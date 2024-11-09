import {DependencyArray, DependencyObject, Module, ResolveFunction} from "./types";

export function createModule(): Module {
    const bindings = new Map<symbol, CallableFunction>();

    const resolveDependenciesArray = (dependencies: DependencyArray, resolve: ResolveFunction) => dependencies.map(resolve);

    const resolveDependenciesObject = (dependencies: DependencyObject, resolve: ResolveFunction) => {
        const entries = Object.entries(dependencies);
        return Object.fromEntries(entries.map(([key, dependency]) => [key, resolve(dependency)]));
    };

    const isDependencyArray = (dependencies: DependencyArray | DependencyObject): dependencies is DependencyArray => Array.isArray(dependencies);

    const isDependencyObject = (dependencies: DependencyArray | DependencyObject): dependencies is DependencyObject => dependencies !== null && typeof dependencies === 'object' && !Array.isArray(dependencies);

    const bind = (key: symbol) => {
        const toValue = (value: unknown) => {
            bindings.set(key, () => value);
        };

        const toFunction = (fn: CallableFunction) => {
            bindings.set(key, () => fn);
        };

        const toHigherOrderFunction = (fn: CallableFunction, dependencies?: DependencyArray | DependencyObject) => {
            if (dependencies && !isDependencyArray(dependencies) && !isDependencyObject(dependencies)) {
                throw new Error('Invalid dependencies type');
            }

            bindings.set(key, (resolve: ResolveFunction) => {
                if (!dependencies) {
                    return fn();
                }

                if (isDependencyArray(dependencies)) {
                    return fn(...resolveDependenciesArray(dependencies, resolve));
                }

                return fn({ ...resolveDependenciesObject(dependencies, resolve) });
            });
        };

        const toFactory = (factory: CallableFunction) => {
            bindings.set(key, (resolve: ResolveFunction) => factory(resolve));
        };

        const toClass = (AnyClass: new (...args: unknown[]) => unknown, dependencies: DependencyArray = []) => {
            bindings.set(key, (resolve: ResolveFunction) => {
                const resolvedDeps = dependencies.map(dep => resolve(dep));
                return new AnyClass(...resolvedDeps);
            });
        };

        return {
            toValue,
            toFunction,
            toFactory,
            toClass,
            toHigherOrderFunction
        };
    };

    return {bind, bindings};
}
