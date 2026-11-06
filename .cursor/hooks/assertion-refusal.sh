#!/usr/bin/env python3
"""Refuse test edits that weaken assertions.

afterFileEdit matchers are compared to the tool name "Write", so this script
applies the tests/** scope itself. It reads file_path from the stdin JSON and
compares each edit's old_string with its new_string.

Exit 0 allows. Exit 2 blocks when the edit has fewer expect( occurrences than
before, or an expect( was commented out.
"""

import json
import os
import sys


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


def under_tests(file_path: str, root: str) -> bool:
    parts = relative_path(file_path, root).split(os.sep)
    return len(parts) >= 2 and parts[0] == "tests"


def expect_stats(source: str) -> tuple[int, int]:
    """Return (literal expect( count, expect( count outside comments and strings)."""
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
            f"fewer expect( occurrences ({literal_before} to {literal_after})"
        )
    commented_out = (active_before - active_after) - max(0, literal_before - literal_after)
    if commented_out > 0:
        reasons.append(f"an expect( was commented out ({commented_out})")
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


def main() -> None:
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError as exc:
        emit_block(f"assertion refusal: hook input is not JSON ({exc})")

    if not isinstance(payload, dict):
        emit_block("assertion refusal: hook input is not an object")

    file_path = payload.get("file_path")
    if not isinstance(file_path, str) or not file_path:
        emit_allow()

    root = project_dir(payload)
    if not under_tests(file_path, root):
        emit_allow()

    relative = relative_path(file_path, root)
    edits = payload.get("edits", [])
    if edits is None or edits == []:
        emit_allow(f"assertion refusal: allowed {relative}")
    if not isinstance(edits, list):
        emit_block(f"assertion refusal: blocked {relative}: edits is not a list")

    compared = combined_edit(edits)
    if compared is None:
        emit_block(
            f"assertion refusal: blocked {relative}: edit is missing old_string or new_string"
        )

    before, after = compared
    reasons = weakening_reasons(before, after)
    if reasons:
        emit_block("assertion refusal: blocked " + relative + ": " + "; ".join(reasons))

    emit_allow(f"assertion refusal: allowed {relative}")


if __name__ == "__main__":
    main()
