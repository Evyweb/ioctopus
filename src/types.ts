export interface DependencyObject {
    [key: string]: symbol;
}

export type DependencyArray = symbol[];

export type Scope = 'singleton' | 'transient' | 'scoped';

export interface Container {
    bind(key: symbol): {
        toValue: (value: unknown, scope?: Scope) => void;
        toFunction: (fn: CallableFunction, scope?: Scope) => void;
        toHigherOrderFunction: (
            fn: CallableFunction,
            dependencies?: DependencyArray | DependencyObject,
            scope?: Scope
        ) => void;
        toFactory: (factory: CallableFunction, scope?: Scope) => void;
        toClass: <C>(
            constructor: new (...args: any[]) => C,
            dependencies?: DependencyArray,
            scope?: Scope
        ) => void;
    };

    load(moduleKey: symbol, module: Module): void;

    get<T>(key: symbol): T;

    unload(key: symbol): void;

    runInScope<T>(callback: () => T): T;
}

export interface Module {
    bind(key: symbol): {
        toValue: (value: unknown, scope?: Scope) => void;
        toFunction: (fn: CallableFunction, scope?: Scope) => void;
        toHigherOrderFunction: (
            fn: CallableFunction,
            dependencies?: DependencyArray | DependencyObject,
            scope?: Scope
        ) => void;
        toFactory: (factory: CallableFunction, scope?: Scope) => void;
        toClass: <C>(
            constructor: new (...args: any[]) => C,
            dependencies?: DependencyArray,
            scope?: Scope
        ) => void;
    };

    bindings: Map<symbol, Binding>;
}

export interface InjectionTokens {
    [key: string]: symbol;
}

export type ResolveFunction = (dep: symbol) => unknown;

export interface Binding {
    factory: (resolve: (key: symbol) => unknown) => unknown;
    scope: Scope;
}