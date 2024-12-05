export type CurriedFunctionWithoutDependencies = () => string;

export const curriedFunctionWithoutDependencies = (): CurriedFunctionWithoutDependencies => () => 'OtherService';