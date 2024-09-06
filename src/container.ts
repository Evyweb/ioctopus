export interface Container {
    bind(key: symbol): {
        toValue: (value: any) => void;
        toFunction: (fn: CallableFunction) => void;
        toFactory: (factory: CallableFunction) => void;
        toClass: (anyClass: new (...args: any[]) => any, dependencies: symbol[]) => void;
    };

    get<T>(key: symbol): T;
}

export function createContainer(): Container {
    const functionsOrValues = new Map<symbol, any>();
    const factories = new Map<symbol, CallableFunction>();
    const instances = new Map<symbol, any>();

    function bind(key: symbol) {
        return {
            toValue: (value: any) => functionsOrValues.set(key, value),
            toFunction: (fn: CallableFunction) => functionsOrValues.set(key, fn),
            toFactory: (factory: CallableFunction) => factories.set(key, factory),
            toClass: (anyClass: new (...args: any[]) => any, dependencies: symbol[]) => {
                const resolvedDependencies = dependencies.map((dependency) => get(dependency));
                factories.set(key, () => new anyClass(...resolvedDependencies));
            }
        };
    }

    function get<T>(key: symbol): T {
        if (factories.has(key)) {
            const factory = factories.get(key)!;
            if (!instances.has(key)) {
                instances.set(key, factory());
            }
            return instances.get(key);
        }
        return functionsOrValues.get(key);
    }

    return {bind, get};
}