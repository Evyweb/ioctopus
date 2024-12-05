export type CurriedFunctionWithDependencies = (name: string) => string;

export const curriedFunctionWithDependencyObject =
    ({dep1, dep2}: {dep1: string, dep2: string}): CurriedFunctionWithDependencies => (name: string) => `Hello ${name} with ${dep1} and ${dep2}`;