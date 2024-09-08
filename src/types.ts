export interface Container {
    bind(key: symbol): {
        toValue: (value: unknown) => void;
        toFunction: (fn: CallableFunction) => void;
        toHigherOrderFunction: (fn: CallableFunction, dependencies?: symbol[]) => void;
        toFactory: (factory: CallableFunction) => void;
        toClass: <C>(constructor: new (...args: any[]) => C, dependencies?: symbol[]) => void;
    };

    get<T>(key: symbol): T;
}

export interface InjectionTokens {
    [key: string]: symbol;
}
