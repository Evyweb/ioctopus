export interface Container {
    bind(key: symbol): {
        toValue: (value: unknown) => void;
        toFunction: (fn: CallableFunction, dependencies?: symbol[]) => void;
        toFactory: (factory: CallableFunction) => void;
        toClass: <C>(constructor: new (...args: any[]) => C, dependencies: symbol[]) => void;
    };

    get<T>(key: symbol): T;
}

export function createContainer(): Container {
    const values = new Map<symbol, unknown>();
    const factories = new Map<symbol, CallableFunction>();
    const instances = new Map<symbol, unknown>();

    const resolveDependencies = (dependencies: symbol[]) => dependencies.map((dependency) => get(dependency));

    function bind(key: symbol) {
        const toValue = (value: unknown) => values.set(key, value);

        const toFunction = (fn: CallableFunction, dependencies?: symbol[]) => {
            if (dependencies && Array.isArray(dependencies)) {
                factories.set(key, () => fn(...resolveDependencies(dependencies)));
            } else {
                factories.set(key, () => fn);
            }
        };

        const toFactory = (factory: CallableFunction) => factories.set(key, factory);

        const toClass = (AnyClass: new (...args: unknown[]) => unknown, dependencies: symbol[]) => {
            factories.set(key, () => new AnyClass(...(resolveDependencies(dependencies))));
        };

        return {
            toValue,
            toFunction,
            toFactory,
            toClass
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