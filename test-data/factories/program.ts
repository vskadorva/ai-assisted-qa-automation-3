import { faker } from '@faker-js/faker';

export type ProgramDraft = {
  name: string;
};

/**
 * Happy-path program payload for create flows. Each call gets a unique name
 * so parallel specs do not collide.
 */
export function buildProgram(overrides?: Partial<ProgramDraft>): ProgramDraft {
  const stamp = Date.now();
  return {
    name: overrides?.name ?? `${faker.commerce.department()} Program ${stamp}`,
    ...overrides,
  };
}
