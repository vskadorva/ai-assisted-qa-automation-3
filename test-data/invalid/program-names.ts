/** Confluence: Program Setup — Field Definitions (Name max 100 characters). */
export const PROGRAM_NAME_MAX_LENGTH = 100;

/** Curated invalid / boundary names — not generated at runtime. */
export const WHITESPACE_ONLY_PROGRAM_NAMES = ['', '   ', '\t\n'] as const;

export const PROGRAM_NAME_OVER_MAX = 'x'.repeat(PROGRAM_NAME_MAX_LENGTH + 1);
