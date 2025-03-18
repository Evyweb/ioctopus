
export type DependencyKey= symbol | string;
export type DependencyKeyType<T extends Record<string, unknown> = {}> = keyof T;
export type AnyFunction = (...args: any) => any;
export type ModuleKey = symbol | string;

export interface DependencyObject {
    [key: string]: DependencyKey;
}

export type DependencyArray = DependencyKey[];
export type DependencyArrayType<DependenciesTuple extends any[], Services extends Record<string, unknown> = {}> = ToKeysTuple<Services, DependenciesTuple>;

export type Scope = 'singleton' | 'transient' | 'scoped';

interface Bindable<Services extends Record<string, unknown> = {}> {
    bind(key: DependencyKeyType<Services>): {
        toValue: (value: unknown) => void;
        toFunction: (fn: CallableFunction) => void;
        toHigherOrderFunction: <Fn extends AnyFunction>(
            fn: Fn,
            dependencies?: DependencyArrayType<Parameters<Fn>, Services> | DependencyObject,
            scope?: Scope
        ) => void;
        toCurry: <Fn extends AnyFunction>(
            fn: AnyFunction,
            dependencies?: DependencyArrayType<Parameters<Fn>, Services> | DependencyObject,
            scope?: Scope
        ) => void;
        toFactory: (factory: CallableFunction, scope?: Scope) => void;
        toClass: <C>(
            constructor: new (...args: any[]) => C,
            dependencies?: DependencyArray | DependencyObject,
            scope?: Scope
        ) => void;
    };
}

export interface Container extends Bindable {
    load(moduleKey: ModuleKey, module: Module): void;

    get<T>(key: DependencyKey): T;

    unload(key: ModuleKey): void;

    runInScope<T>(callback: () => T): T;
}

export interface Module<Services extends Record<string, unknown> = {}> extends Bindable<Services> {
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

export type FindKeyByValue<T extends Record<string, unknown>, V> = {
    [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

export type ToKeysTuple<
    Map extends Record<string, unknown>,
    T extends any[]
> = {
    [K in keyof T]: FindKeyByValue<Map, T[K]>;
};
