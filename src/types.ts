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

// Find all registry keys whose resolved type extends T
type KeysMatching<TRegistry, T> = {
  [K in RegistryKey<TRegistry>]: TRegistry[K & keyof TRegistry] extends T
    ? K
    : never;
}[RegistryKey<TRegistry>];

// For each position in a params tuple, compute the valid registry keys
type ValidatedArrayDeps<TRegistry, TParams extends readonly unknown[]> = {
  readonly [I in keyof TParams]: KeysMatching<TRegistry, TParams[I]>;
};

// For a single object parameter, map each property to valid registry keys
type ValidatedObjectDeps<TRegistry, TParam> = {
  [P in keyof TParam]: KeysMatching<TRegistry, TParam[P]>;
};

// Shared core, validate deps against a parameter tuple
type ValidDepsForParams<
  TRegistry,
  TParams extends readonly unknown[]
> = TParams extends readonly []
  ? never
  : TParams extends readonly [infer Only, ...infer Rest]
  ? Rest extends []
    ? Only extends Record<string, unknown>
      ? ValidatedArrayDeps<TRegistry, [Only]> | ValidatedObjectDeps<TRegistry, Only>
      : ValidatedArrayDeps<TRegistry, [Only]>
    : ValidatedArrayDeps<TRegistry, TParams>
  : never;

// Combine valid dependencies for a given constructor
type ValidDepsFor<
  TRegistry,
  TClass extends new (...args: any[]) => any
> = ValidDepsForParams<TRegistry, ConstructorParameters<TClass>>;

// Combine valid dependencies for a given function
type ValidFnDepsFor<
  TRegistry,
  TFn extends (...args: any[]) => any
> = ValidDepsForParams<TRegistry, Parameters<TFn>>;

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
    toHigherOrderFunction: {
      <TFn extends (...args: readonly []) => TRegistry[K]>(
        fn: TFn,
        dependencies?: undefined,
        scope?: Scope
      ): void;
      <TFn extends (...args: any[]) => TRegistry[K]>(
        fn: TFn,
        dependencies: ValidFnDepsFor<TRegistry, TFn>,
        scope?: Scope
      ): void;
    };
    toCurry: {
      <TFn extends (...args: readonly []) => TRegistry[K]>(
        fn: TFn,
        dependencies?: undefined,
        scope?: Scope
      ): void;
      <TFn extends (...args: any[]) => TRegistry[K]>(
        fn: TFn,
        dependencies: ValidFnDepsFor<TRegistry, TFn>,
        scope?: Scope
      ): void;
    };
    toFactory: (factory: CallableFunction, scope?: Scope) => void;
    toClass: {
      <TClass extends new () => TRegistry[K]>(
        constructor: TClass,
        dependencies?: undefined,
        scope?: Scope
      ): void;
      <TClass extends new (...args: any[]) => TRegistry[K]>(
        constructor: TClass,
        dependencies: ValidDepsFor<TRegistry, TClass>,
        scope?: Scope
      ): void;
    };
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
  bind<K extends RegistryKey<TRegistry>>(key: K): {
    toValue: (value: TRegistry[K]) => void;
    toFunction: (fn: TRegistry[K] extends CallableFunction ? TRegistry[K] : never) => void;
    toHigherOrderFunction: {
      <TFn extends (...args: readonly []) => TRegistry[K]>(
        fn: TFn,
        dependencies?: undefined,
        scope?: Scope
      ): void;
      <TFn extends (...args: any[]) => TRegistry[K]>(
        fn: TFn,
        dependencies: ValidFnDepsFor<TRegistry, TFn>,
        scope?: Scope
      ): void;
    };
    toCurry: {
      <TFn extends (...args: readonly []) => TRegistry[K]>(
        fn: TFn,
        dependencies?: undefined,
        scope?: Scope
      ): void;
      <TFn extends (...args: any[]) => TRegistry[K]>(
        fn: TFn,
        dependencies: ValidFnDepsFor<TRegistry, TFn>,
        scope?: Scope
      ): void;
    };
    toFactory: (factory: (resolve: (key: DependencyKey) => unknown) => TRegistry[K], scope?: Scope) => void;
    toClass: {
      <TClass extends new () => TRegistry[K]>(
        constructor: TClass,
        dependencies?: undefined,
        scope?: Scope
      ): void;
      <TClass extends new (...args: any[]) => TRegistry[K]>(
        constructor: TClass,
        dependencies: ValidDepsFor<TRegistry, TClass>,
        scope?: Scope
      ): void;
    };
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
