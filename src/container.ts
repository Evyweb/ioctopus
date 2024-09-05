export interface Container {
    bind(key: symbol): {
        toValue: (value: any) => void;
        toFunction: (fn: CallableFunction) => void;
        toFactory: (factory: CallableFunction) => void;
    };

    get<T>(key: symbol): T;
}

export function createContainer(): Container {
    const functionsOrValues = new Map<symbol, any>();
    const factories = new Map<symbol, CallableFunction>();

    function bind(key: symbol) {
        return {
            toValue: (value: any) => functionsOrValues.set(key, value),
            toFunction: (fn: CallableFunction) => functionsOrValues.set(key, fn),
            toFactory: (factory: CallableFunction) => factories.set(key, factory)
        };
    }

    function get<T>(key: symbol): T {
        if (factories.has(key)) {
            const factory = factories.get(key)!;
            return factory();
        }
        return functionsOrValues.get(key);
    }

    return {bind, get};
}