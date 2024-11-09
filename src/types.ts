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

    load(moduleKey: symbol, module: Module): void;

    get<T>(key: symbol): T;

    unload(key: symbol): void;
}

export interface Module {
    bind(key: symbol): {
        toValue: (value: unknown) => void;
        toFunction: (fn: CallableFunction) => void;
        toHigherOrderFunction: (fn: CallableFunction, dependencies?: DependencyArray | DependencyObject) => void;
        toFactory: (factory: CallableFunction) => void;
        toClass: <C>(constructor: new (...args: any[]) => C, dependencies?: DependencyArray) => void;
    };

    bindings: Map<symbol, CallableFunction>;
}

export interface InjectionTokens {
    [key: string]: symbol;
}

export type ResolveFunction = (dep: symbol) => unknown;