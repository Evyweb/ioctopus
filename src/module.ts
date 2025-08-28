import {DependencyArray, DependencyKey, DependencyObject, Module, ResolveFunction, Scope, TypedModule, DefaultRegistry} from "./types";

interface Binding {
    factory: (resolve: ResolveFunction) => unknown;
    scope: Scope;
}

export function createModule(): Module;
export function createModule<TRegistry>(): TypedModule<TRegistry>;
export function createModule<TRegistry = DefaultRegistry>(): Module | TypedModule<TRegistry> {
    const bindings = new Map<DependencyKey, Binding>();

    const resolveDependenciesArray = (dependencies: DependencyArray, resolve: ResolveFunction) =>
        dependencies.map(resolve);

    const resolveDependenciesObject = (dependencies: DependencyObject, resolve: ResolveFunction) => {
        const entries = Object.entries(dependencies);
        return Object.fromEntries(entries.map(([key, dependency]) => [key, resolve(dependency)]));
    };

    const isDependencyArray = (dependencies: DependencyArray | DependencyObject): dependencies is DependencyArray =>
        Array.isArray(dependencies);

    const isDependencyObject = (dependencies: DependencyArray | DependencyObject): dependencies is DependencyObject =>
        dependencies !== null && typeof dependencies === "object" && !Array.isArray(dependencies);

    const bind = (key: DependencyKey) => {
        const toValue = (value: unknown) => {
            bindings.set(key, {factory: () => value, scope: 'singleton'});
        };

        const toFunction = (fn: CallableFunction) => {
            bindings.set(key, {factory: () => fn, scope: 'singleton'});
        };

        const toHigherOrderFunction = (
            fn: CallableFunction,
            dependencies?: DependencyArray | DependencyObject,
            scope: Scope = 'singleton'
        ) => {
            if (dependencies && !isDependencyArray(dependencies) && !isDependencyObject(dependencies)) {
                throw new Error("Invalid dependencies type");
            }

            const factory = (resolve: ResolveFunction) => {
                if (!dependencies) {
                    return fn();
                }

                if (isDependencyArray(dependencies)) {
                    return fn(...resolveDependenciesArray(dependencies, resolve));
                }

                return fn({...resolveDependenciesObject(dependencies, resolve)});
            };

            bindings.set(key, {factory, scope});
        };

        const toCurry = toHigherOrderFunction;

        const toFactory = (factory: CallableFunction, scope: Scope = 'singleton') => {
            bindings.set(key, {factory: (resolve: ResolveFunction) => factory(resolve), scope});
        };

        const toClass = (
            AnyClass: new (...args: unknown[]) => unknown,
            dependencies?: DependencyArray | DependencyObject,
            scope: Scope = 'singleton'
        ) => {

            if (dependencies && !isDependencyArray(dependencies) && !isDependencyObject(dependencies)) {
                throw new Error("Invalid dependencies type");
            }

            const factory = (resolve: ResolveFunction) => {
                if (!dependencies) {
                    return new AnyClass();
                }

                if (isDependencyArray(dependencies)) {
                    const resolvedDeps = resolveDependenciesArray(dependencies, resolve);
                    return new AnyClass(...resolvedDeps);
                }

                if (isDependencyObject(dependencies)) {
                    const resolvedDeps = resolveDependenciesObject(dependencies, resolve);
                    return new AnyClass({...resolvedDeps});
                }
            };

            bindings.set(key, {factory, scope});
        };

        return {
            toValue,
            toFunction,
            toFactory,
            toClass,
            toHigherOrderFunction,
            toCurry
        };
    };

    return {bind, bindings} as unknown as Module | TypedModule<TRegistry>;
}
