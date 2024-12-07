export type DependencyKey = symbol | string;

export type ModuleKey = symbol | string;

export interface DependencyObject {
    [key: string]: DependencyKey;
}

export type DependencyArray = DependencyKey[];

export type Scope = 'singleton' | 'transient' | 'scoped';

export interface Container {
    bind(key: DependencyKey): {
        toValue: (value: unknown) => void;
        toFunction: (fn: CallableFunction) => void;
        toHigherOrderFunction: (
            fn: CallableFunction,
            dependencies?: DependencyArray | DependencyObject,
            scope?: Scope
        ) => void;
        toCurry: (
            fn: CallableFunction,
            dependencies?: DependencyArray | DependencyObject,
            scope?: Scope
        ) => void;
        toFactory: (factory: CallableFunction, scope?: Scope) => void;
        toClass: <C>(
            constructor: new (...args: any[]) => C,
            dependencies?: DependencyArray | DependencyObject,
            scope?: Scope
        ) => void;
    };

    load(moduleKey: ModuleKey, module: Module): void;

    get<T>(key: DependencyKey): T;

    unload(key: ModuleKey): void;

    runInScope<T>(callback: () => T): T;
}

export interface Module {
    bind(key: DependencyKey): {
        toValue: (value: unknown) => void;
        toFunction: (fn: CallableFunction) => void;
        toHigherOrderFunction: (
            fn: CallableFunction,
            dependencies?: DependencyArray | DependencyObject,
            scope?: Scope
        ) => void;
        toCurry: (
            fn: CallableFunction,
            dependencies?: DependencyArray | DependencyObject,
            scope?: Scope
        ) => void;
        toFactory: (factory: CallableFunction, scope?: Scope) => void;
        toClass: <C>(
            constructor: new (...args: any[]) => C,
            dependencies?: DependencyArray | DependencyObject,
            scope?: Scope
        ) => void;
    };

    bindings: Map<DependencyKey, Binding>;
}

export interface InjectionTokens {
    [key: string]: DependencyKey;
}

export type ResolveFunction = (dep: DependencyKey) => unknown;

export interface Binding {
    factory: (resolve: (key: DependencyKey) => unknown) => unknown;
    scope: Scope;
}