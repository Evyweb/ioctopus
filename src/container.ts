import {Container, DependencyArray, DependencyObject} from "./types";

export function createContainer(): Container {
    const values = new Map<symbol, unknown>();
    const factories = new Map<symbol, CallableFunction>();
    const instances = new Map<symbol, unknown>();

    const resolveDependenciesArray = (dependencies: DependencyArray) => dependencies.map((dependency) => get(dependency));

    const resolveDependenciesObject = (dependencies: DependencyObject) => {
        const entries = Object.entries(dependencies);
        return Object.fromEntries(entries.map(([key, dependency]) => [key, get(dependency)]));
    };

    const isDependencyArray = (dependencies: DependencyArray | DependencyObject): dependencies is DependencyArray => Array.isArray(dependencies);

    const isDependencyObject = (dependencies: DependencyArray | DependencyObject): dependencies is DependencyObject => typeof dependencies === 'object' && !Array.isArray(dependencies);

    function bind(key: symbol) {
        const toValue = (value: unknown) => values.set(key, value);

        const toFunction = (fn: CallableFunction) => factories.set(key, () => fn);

        const toHigherOrderFunction = (fn: CallableFunction, dependencies?: DependencyArray | DependencyObject) => {
            if(dependencies) {
                if (isDependencyArray(dependencies)) {
                    factories.set(key, () => fn(...resolveDependenciesArray(dependencies)));
                } else if (isDependencyObject(dependencies)) {
                    factories.set(key, () => fn({...resolveDependenciesObject(dependencies)}));
                } else {
                    throw new Error('Invalid dependencies type');
                }
            } else {
                factories.set(key, () => fn());
            }
        };

        const toFactory = (factory: CallableFunction) => factories.set(key, factory);

        const toClass = (AnyClass: new (...args: unknown[]) => unknown, dependencies: DependencyArray = []) => {
            factories.set(key, () => new AnyClass(...resolveDependenciesArray(dependencies)));
        };

        return {
            toValue,
            toFunction,
            toFactory,
            toClass,
            toHigherOrderFunction
        };
    }

    function get<T>(key: symbol): T {
        if (values.has(key)) {
            return values.get(key) as T;
        }

        if (instances.has(key)) {
            return instances.get(key) as T;
        }

        if (factories.has(key)) {
            const factory = factories.get(key)!;
            instances.set(key, factory());
            return instances.get(key) as T;
        }

        throw new Error(`No binding found for key: ${key.toString()}`);
    }

    return {bind, get};
}