import { AnyClass, AnyFunction, DependencyArray, DependencyArrayType, DependencyKey, DependencyObject, DependencyObjectType, Module, ResolveFunction, Scope } from "./types";
import { ServiceRegistry } from './service-registry';

interface Binding {
    factory: (resolve: ResolveFunction) => unknown;
    scope: Scope;
}

export function createModule<Services extends Record<string, unknown> = {}>(
    serviceRegistry: ServiceRegistry<Services>
): Module<Services> {
    const bindings = new Map<DependencyKey, Binding>();

    const resolveDependenciesArray = (dependencies: DependencyArray, resolve: ResolveFunction) =>
        dependencies.map(resolve);

    const resolveDependenciesObject = (dependencies: DependencyObject, resolve: ResolveFunction) => {
        const entries = Object.entries(dependencies);
        return Object.fromEntries(entries.map(([key, dependency]) => [key, resolve(dependency)]));
    };

    const isDependencyArray = (dependencies: unknown): dependencies is DependencyArray =>
        Array.isArray(dependencies);

    const isDependencyObject = (dependencies: unknown): dependencies is DependencyObject =>
        dependencies !== null && typeof dependencies === "object" && !Array.isArray(dependencies);

    const bind = (key: keyof Services) => {
        const resovledKey = serviceRegistry.get(key);

        const toValue = (value: unknown) => {
            bindings.set(resovledKey, { factory: () => value, scope: 'singleton' });
        };

        const toFunction = (fn: CallableFunction) => {
            bindings.set(resovledKey, { factory: () => fn, scope: 'singleton' });
        };

        const toHigherOrderFunction = <Fn extends AnyFunction>(
            fn: Fn,
            dependencies?: DependencyArrayType<Parameters<Fn>, Services> | DependencyObject,
            scope: Scope = 'singleton'
        ) => {
            if (dependencies && !isDependencyArray(dependencies) && !isDependencyObject(dependencies)) {
                throw new Error("Invalid dependencies type");
            }

            const arrayDependencies: symbol[] = [];
            if (!isDependencyObject(dependencies) && isDependencyArray(dependencies)) {
                for(const dependency of dependencies) {
                    arrayDependencies.push(serviceRegistry.get(dependency));
                }
            }

            const factory = (resolve: ResolveFunction) => {
                if (!dependencies) {
                    return fn();
                }

                if (isDependencyArray(dependencies)) {
                    return fn(...resolveDependenciesArray(arrayDependencies, resolve));
                }

                return fn({ ...resolveDependenciesObject(dependencies, resolve) });
            };

            bindings.set(resovledKey, { factory, scope: scope });
        };

        const toCurry = toHigherOrderFunction;

        const toFactory = (factory: CallableFunction, scope: Scope = 'singleton') => {
            bindings.set(resovledKey, { factory: (resolve: ResolveFunction) => factory(resolve), scope });
        };

        const toClass = <Class extends AnyClass>(
            AnyClass: Class,
            dependencies?: DependencyArrayType<ConstructorParameters<Class>, Services> | DependencyObjectType<ConstructorParameters<Class>[0], Services>,
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
                    return new AnyClass({ ...resolvedDeps });
                }
            };

            bindings.set(resovledKey, { factory, scope });
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

    return { bind, bindings };
}
