export interface DependencyObject {
    [key: string]: symbol;
}

export type DependencyArray = symbol[];

export interface Container {
    bind(key: symbol): {
        toValue: (value: unknown) => void;
        toFunction: (fn: CallableFunction) => void;
        toHigherOrderFunction: (fn: CallableFunction, dependencies?: DependencyArray | DependencyObject) => void;
        toFactory: (factory: CallableFunction) => void;
        toClass: <C>(constructor: new (...args: any[]) => C, dependencies?: DependencyArray) => void;
    };

    get<T>(key: symbol): T;
}

export interface InjectionTokens {
    [key: string]: symbol;
}
