import { expect, test } from '@playwright/test';

type AxeViolation = {
  id: string;
  impact?: string;
  help: string;
  nodes: Array<{ target: string[] }>;
};

type AxeScanResults = {
  violations: AxeViolation[];
};

function formatAxeViolations(violations: AxeViolation[]): string {
  if (violations.length === 0) {
    return 'No axe violations.';
  }

  const lines = [`Axe violations (${violations.length}):`];
  for (const violation of violations) {
    lines.push(`- ${violation.id} (${violation.impact ?? 'unknown'}): ${violation.help}`);
    for (const node of violation.nodes.slice(0, 5)) {
      lines.push(`  ${node.target.join(' ')}`);
    }
    if (violation.nodes.length > 5) {
      lines.push(`  ... and ${violation.nodes.length - 5} more node(s)`);
    }
  }
  return lines.join('\n');
}

/** Fails locally on violations; in CI attaches a report and does not fail the job. */
export async function assertNoAxeViolations(results: AxeScanResults): Promise<void> {
  const summary = formatAxeViolations(results.violations);

  if (results.violations.length > 0) {
    await test.info().attach('axe-violations.json', {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    });
    await test.info().attach('axe-violations.txt', {
      body: summary,
      contentType: 'text/plain',
    });
    test.info().annotations.push({
      type: 'warning',
      description: summary.length > 500 ? `${summary.slice(0, 497)}...` : summary,
    });
  }

  if (process.env.CI) {
    if (results.violations.length > 0) {
      console.warn(`[a11y advisory — CI does not fail on axe violations]\n${summary}`);
    }
    return;
  }

  await expect(results.violations).toEqual([]);
}
