import {Container} from "./types";

export function createContainer(): Container {
    const values = new Map<symbol, unknown>();
    const factories = new Map<symbol, CallableFunction>();
    const instances = new Map<symbol, unknown>();

    const resolveDependencies = (dependencies: symbol[]) => dependencies.map((dependency) => get(dependency));

    function bind(key: symbol) {
        const toValue = (value: unknown) => values.set(key, value);

        const toFunction = (fn: CallableFunction) => factories.set(key, () => fn);

        const toHigherOrderFunction = (fn: CallableFunction, dependencies: symbol[] = []) => {
            factories.set(key, () => fn(...resolveDependencies(dependencies)));
        };

        const toFactory = (factory: CallableFunction) => factories.set(key, factory);

        const toClass = (AnyClass: new (...args: unknown[]) => unknown, dependencies: symbol[] = []) => {
            factories.set(key, () => new AnyClass(...resolveDependencies(dependencies)));
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