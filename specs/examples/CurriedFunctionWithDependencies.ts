export type CurriedFunctionWithDependencies = (name: string) => string;

export const curriedFunctionWithDependencies =
    (dep1: string): CurriedFunctionWithDependencies => (name: string) => `Hello ${name} with ${dep1}`;