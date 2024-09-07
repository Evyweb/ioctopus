export interface Container {
    bind(key: symbol): {
        toValue: (value: any) => void;
        toFunction: (fn: CallableFunction, dependencies?: symbol[]) => void;
        toFactory: (factory: CallableFunction) => void;
        toClass: (anyClass: new (...args: any[]) => any, dependencies: symbol[]) => void;
    };

    get<T>(key: symbol): T;
}

export function createContainer(): Container {
    const values = new Map<symbol, any>();
    const factories = new Map<symbol, CallableFunction>();
    const instances = new Map<symbol, any>();

    function bind(key: symbol) {
        const toValue = (value: any) => values.set(key, value)

        const toFunction = (fn: CallableFunction, dependencies: symbol[] = []) => {
            if (dependencies.length > 0) {
                factories.set(key, () => {
                    const resolvedDependencies = dependencies.map((dependency) => get(dependency));
                    return fn(...resolvedDependencies);
                });
            } else {
                factories.set(key, () => fn);
            }
        }

        const toFactory = (factory: CallableFunction) => factories.set(key, factory)

        const toClass = (anyClass: new (...args: any[]) => any, dependencies: symbol[]) => {
            factories.set(key, () => {
                const resolvedDependencies = dependencies.map((dependency) => get(dependency));
                return new anyClass(...resolvedDependencies)
            });
        }

        return {
            toValue,
            toFunction,
            toFactory,
            toClass
        };
    }

    function get<T>(key: symbol): T {
        if(instances.has(key)) {
            return instances.get(key);
        }

        if (factories.has(key)) {
            const factory = factories.get(key)!;
            instances.set(key, factory());
            return instances.get(key);
        }

        if(values.has(key)) {
            return values.get(key);
        }

        throw new Error(`No binding found for key: ${key.toString()}`);
    }

    return {bind, get};
}