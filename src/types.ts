export type DependencyKey = symbol | string;

export type ModuleKey = symbol | string;

export interface DependencyObject {
    [key: string]: DependencyKey;
}

export type DependencyArray = DependencyKey[];

export type Scope = 'singleton' | 'transient' | 'scoped';

export interface DefaultRegistry {
    [key: string]: unknown;
}

type RegistryKey<TRegistry> = Extract<keyof TRegistry, DependencyKey>;

type IncompatibleOverride<K extends PropertyKey, Expected, Provided> = {
    __error: 'Incompatible override type for registry key';
    key: K;
    expected: Expected;
    provided: Provided;
};

type CompatibleKey<TRegistry, TOverride> = [TOverride] extends [never]
    ? RegistryKey<TRegistry>
    : {
          [K in RegistryKey<TRegistry>]: TOverride extends TRegistry[K]
              ? K
              : IncompatibleOverride<K, TRegistry[K], TOverride>
      }[RegistryKey<TRegistry>];


interface Bindable {
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
}

interface TypedBindable<TRegistry> {
    bind<K extends RegistryKey<TRegistry>>(key: K): {
        toValue: (value: TRegistry[K]) => void;
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
}

export interface Container extends Bindable {
    load(moduleKey: ModuleKey, module: Module): void;

    get<T>(key: DependencyKey): T;

    unload(key: ModuleKey): void;

    runInScope<T>(callback: () => T): T;
}

export interface TypedContainer<TRegistry> {
    bind<K extends keyof TRegistry & DependencyKey>(key: K): {
        toValue: (value: TRegistry[K]) => void;
        toFunction: (fn: TRegistry[K] extends CallableFunction ? TRegistry[K] : never) => void;
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
        toFactory: (factory: (resolve: (key: DependencyKey) => unknown) => TRegistry[K], scope?: Scope) => void;
        toClass: (
            constructor: new (...args: any[]) => TRegistry[K],
            dependencies?: DependencyArray | DependencyObject,
            scope?: Scope
        ) => void;
    };

    load<TModuleRegistry>(moduleKey: ModuleKey, module: TypedModule<TModuleRegistry>): void;
    load(moduleKey: ModuleKey, module: Module): void;

    get<
        TOverride = never,
        K extends CompatibleKey<TRegistry, TOverride> = CompatibleKey<TRegistry, TOverride>
    >(key: K): [TOverride] extends [never] ? TRegistry[K & keyof TRegistry] : TOverride;

    unload(key: ModuleKey): void;

    runInScope<T>(callback: () => T): T;
}

export interface Module extends Bindable {
    bindings: Map<DependencyKey, Binding>;
}

export interface TypedModule<TRegistry> extends TypedBindable<TRegistry> {
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
