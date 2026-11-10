#!/usr/bin/env python3
"""Mechanical WON'T checks for tests/** and pages/** after agent writes.

Matchers on afterFileEdit filter tool type (Write), not paths — scope here.
Exit 0 allow, exit 2 block (failClosed).
"""

from __future__ import annotations

import json
import os
import re
import sys

SPEC_RE = re.compile(r"\.(spec|test)\.[cm]?[jt]sx?$")
TS_JS_RE = re.compile(r"\.[cm]?[jt]sx?$")

WAIT_RE = re.compile(r"\b(?:page|this\.page)\.waitForTimeout\s*\(")
ANY_RE = re.compile(
    r"(?:\b:\s*any\b|<any\b|as\s+any\b|\bany\[\]|\bArray\s*<\s*any\s*>)"
)
DESCRIBE_TAG_RE = re.compile(
    r"""test\.describe\s*\(\s*['"]@|test\.describe\s*\([^)]*\btag\s*:\s*['"]@""",
    re.DOTALL,
)
LOCATOR_CALL_RE = re.compile(
    r"""(?:page|this\.page)\.locator\s*\(\s*(['"`])(.*?)\1""",
    re.DOTALL,
)
CREDENTIAL_RE = re.compile(
    r"""(?i)\b(?:password|passwd|api[_-]?key|client[_-]?secret|auth[_-]?token|access[_-]?token|bearer)\s*[:=]\s*(['"])(?!\1)(?:\\.|(?!\1).){4,}\1"""
)
ENV_LITERAL_OK = re.compile(r"process\.env\.|import\.meta\.env")

XPATH_IN_SELECTOR = re.compile(
    r"(?:^xpath\s*=|//|/\*(?!/))",
)


def emit_allow(note: str | None = None) -> None:
    if note:
        sys.stderr.write(note + "\n")
    sys.stdout.write("{}\n")
    sys.exit(0)


def emit_block(message: str) -> None:
    sys.stdout.write(message + "\n")
    sys.stderr.write(message + "\n")
    sys.exit(2)


def project_dir(payload: dict) -> str:
    env_dir = os.environ.get("CURSOR_PROJECT_DIR") or os.environ.get("CLAUDE_PROJECT_DIR") or ""
    if env_dir:
        return env_dir
    roots = payload.get("workspace_roots") or []
    if isinstance(roots, list) and roots and isinstance(roots[0], str):
        return roots[0]
    return ""


def relative_path(file_path: str, root: str) -> str:
    path = os.path.normpath(file_path)
    if root:
        root_norm = os.path.normpath(root)
        if path == root_norm or path.startswith(root_norm + os.sep):
            return os.path.relpath(path, root_norm)
    return path


def in_scope(file_path: str, root: str) -> bool:
    rel = relative_path(file_path, root)
    parts = rel.split(os.sep)
    if len(parts) < 2:
        return False
    if parts[0] not in ("tests", "pages"):
        return False
    return TS_JS_RE.search(parts[-1]) is not None


def expect_stats(source: str) -> tuple[int, int]:
    literal = source.count("expect(")
    active = 0
    i = 0
    n = len(source)
    state = "code"
    while i < n:
        if state == "code":
            if source.startswith("//", i):
                state = "line"
                i += 2
                continue
            if source.startswith("/*", i):
                state = "block"
                i += 2
                continue
            if source[i] in "\"'`":
                state = source[i]
                i += 1
                continue
            if source.startswith("expect(", i):
                active += 1
                i += len("expect(")
                continue
            i += 1
            continue
        if state == "line":
            if source[i] == "\n":
                state = "code"
            i += 1
            continue
        if state == "block":
            if source.startswith("*/", i):
                state = "code"
                i += 2
            else:
                i += 1
            continue
        if source[i] == "\\":
            i += 2
            continue
        if source[i] == state:
            state = "code"
        i += 1
    return literal, active


def weakening_reasons(before: str, after: str) -> list[str]:
    literal_before, active_before = expect_stats(before)
    literal_after, active_after = expect_stats(after)
    reasons: list[str] = []
    if literal_after < literal_before:
        reasons.append(
            f"removed expect( ({literal_before} → {literal_after})"
        )
    commented_out = (active_before - active_after) - max(0, literal_before - literal_after)
    if commented_out > 0:
        reasons.append(f"commented-out expect( ({commented_out})")
    return reasons


def combined_edit(edits: list) -> tuple[str, str] | None:
    old_parts: list[str] = []
    new_parts: list[str] = []
    for edit in edits:
        if not isinstance(edit, dict):
            return None
        old = edit.get("old_string")
        new = edit.get("new_string")
        if not isinstance(old, str) or not isinstance(new, str):
            return None
        old_parts.append(old)
        new_parts.append(new)
    return "\n".join(old_parts), "\n".join(new_parts)


def scan_source(source: str, *, is_spec: bool) -> list[str]:
    reasons: list[str] = []
    if WAIT_RE.search(source):
        reasons.append("page.waitForTimeout (use auto-wait / expect)")
    if ANY_RE.search(source):
        reasons.append("TypeScript any type")
    if DESCRIBE_TAG_RE.search(source):
        reasons.append("tag on test.describe (tags belong on individual tests)")
    for match in LOCATOR_CALL_RE.finditer(source):
        body = match.group(2)
        if XPATH_IN_SELECTOR.search(body):
            reasons.append(f"XPath locator: locator({body[:60]}{'…' if len(body) > 60 else ''})")
    for match in CREDENTIAL_RE.finditer(source):
        snippet = match.group(0)
        if ENV_LITERAL_OK.search(snippet):
            continue
        if "your-" in snippet.lower() or "changeme" in snippet.lower():
            continue
        reasons.append(f"hardcoded credential pattern: {snippet[:48]}…")
    if is_spec and "xpath=" in source.lower():
        reasons.append("XPath locator (xpath=)")
    return reasons


def main() -> None:
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError as exc:
        emit_block(f"constitution gate: hook input is not JSON ({exc})")

    if not isinstance(payload, dict):
        emit_block("constitution gate: hook input is not an object")

    file_path = payload.get("file_path")
    if not isinstance(file_path, str) or not file_path:
        emit_allow()

    root = project_dir(payload)
    relative = relative_path(file_path, root)
    if not in_scope(file_path, root):
        emit_allow()

    is_spec = SPEC_RE.search(os.path.basename(file_path)) is not None
    reasons: list[str] = []

    edits = payload.get("edits")
    if isinstance(edits, list) and edits:
        compared = combined_edit(edits)
        if compared is None:
            emit_block(
                f"constitution gate: blocked {relative}: edit missing old_string/new_string"
            )
        before, after = compared
        reasons.extend(weakening_reasons(before, after))
        reasons.extend(scan_source(after, is_spec=is_spec))
    else:
        try:
            with open(file_path, encoding="utf-8") as handle:
                source = handle.read()
        except OSError as exc:
            emit_block(f"constitution gate: could not read {relative} ({exc})")
        reasons.extend(scan_source(source, is_spec=is_spec))

    if reasons:
        emit_block(
            "constitution gate blocked "
            + relative
            + ": "
            + "; ".join(dict.fromkeys(reasons))
        )

    emit_allow(f"constitution gate: allowed {relative}")


if __name__ == "__main__":
    main()
