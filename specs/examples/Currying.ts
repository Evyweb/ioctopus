import {CurriedFunctionWithDependencies, CurriedFunctionWithoutDependencies} from "./types";

export const curriedFunctionWithoutDependencies = (): CurriedFunctionWithoutDependencies => () => 'OtherService';

export const curriedFunctionWithDependencies =
    (dep1: string): CurriedFunctionWithDependencies => (name: string) => `Hello ${name} with ${dep1}`;

export const curriedFunctionWithDependencyObject =
    ({dep1, dep2}: {
        dep1: string,
        dep2: string
    }): CurriedFunctionWithDependencies => (name: string) => `Hello ${name} with ${dep1} and ${dep2}`;

