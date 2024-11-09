import { DependencyArray, DependencyObject, Module, ResolveFunction } from "./types";

interface Binding {
    factory: (resolve: ResolveFunction) => unknown;
    scope: 'singleton' | 'transient' | 'scoped';
}

export function createModule(): Module {
    const bindings = new Map<symbol, Binding>();

    const resolveDependenciesArray = (dependencies: DependencyArray, resolve: ResolveFunction) => dependencies.map(resolve);

    const resolveDependenciesObject = (dependencies: DependencyObject, resolve: ResolveFunction) => {
        const entries = Object.entries(dependencies);
        return Object.fromEntries(entries.map(([key, dependency]) => [key, resolve(dependency)]));
    };

    const isDependencyArray = (dependencies: DependencyArray | DependencyObject): dependencies is DependencyArray =>
        Array.isArray(dependencies);

    const isDependencyObject = (dependencies: DependencyArray | DependencyObject): dependencies is DependencyObject =>
        dependencies !== null && typeof dependencies === 'object' && !Array.isArray(dependencies);

    const bind = (key: symbol) => {
        const toValue = (value: unknown, scope: 'singleton' | 'transient' | 'scoped' = 'singleton') => {
            bindings.set(key, { factory: () => value, scope });
        };

        const toFunction = (fn: CallableFunction, scope: 'singleton' | 'transient' | 'scoped' = 'singleton') => {
            bindings.set(key, { factory: () => fn, scope });
        };

        const toHigherOrderFunction = (
            fn: CallableFunction,
            dependencies?: DependencyArray | DependencyObject,
            scope: 'singleton' | 'transient' | 'scoped' = 'singleton'
        ) => {
            if (dependencies && !isDependencyArray(dependencies) && !isDependencyObject(dependencies)) {
                throw new Error('Invalid dependencies type');
            }

            const factory = (resolve: ResolveFunction) => {
                if (!dependencies) {
                    return fn();
                }

                if (isDependencyArray(dependencies)) {
                    return fn(...resolveDependenciesArray(dependencies, resolve));
                }

                return fn({ ...resolveDependenciesObject(dependencies, resolve) });
            };

            bindings.set(key, { factory, scope });
        };

        const toFactory = (factory: CallableFunction, scope: 'singleton' | 'transient' | 'scoped' = 'singleton') => {
            bindings.set(key, { factory: (resolve: ResolveFunction) => factory(resolve), scope });
        };

        const toClass = (
            AnyClass: new (...args: unknown[]) => unknown,
            dependencies: DependencyArray = [],
            scope: 'singleton' | 'transient' | 'scoped' = 'singleton'
        ) => {
            const factory = (resolve: ResolveFunction) => {
                const resolvedDeps = dependencies.map(dep => resolve(dep));
                return new AnyClass(...resolvedDeps);
            };

            bindings.set(key, { factory, scope });
        };

        return {
            toValue,
            toFunction,
            toFactory,
            toClass,
            toHigherOrderFunction
        };
    };

    return { bind, bindings };
}
