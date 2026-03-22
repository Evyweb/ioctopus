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

type MatchingRegistryKeys<TRegistry, T> = {
  [K in RegistryKey<TRegistry>]: TRegistry[K & keyof TRegistry] extends T
    ? K
    : never;
}[RegistryKey<TRegistry>];

type ValidatedArrayDependencies<TRegistry, TParameters extends readonly unknown[]> = {
  readonly [I in keyof TParameters]: MatchingRegistryKeys<TRegistry, TParameters[I]>;
};

type NonTupleArray<T extends readonly unknown[]> = number extends T['length'] ? T : never;

type CompatibleArrayDependencies<TRegistry, TParameters extends readonly unknown[]> =
  readonly MatchingRegistryKeys<TRegistry, TParameters[number]>[];

type ValidatedObjectDependencies<TRegistry, TParameter> = {
  [P in keyof TParameter]: MatchingRegistryKeys<TRegistry, TParameter[P]>;
};

type ValidDependenciesForParameters<
  TRegistry,
  TParameters extends readonly unknown[]
> = TParameters extends readonly []
  ? never
  : TParameters extends readonly [infer Only, ...infer Rest]
  ? Rest extends []
    ? Only extends Record<string, unknown>
      ? ValidatedArrayDependencies<TRegistry, [Only]> | ValidatedObjectDependencies<TRegistry, Only>
      : ValidatedArrayDependencies<TRegistry, [Only]>
    : ValidatedArrayDependencies<TRegistry, TParameters>
  : never;

type ValidDependenciesFor<
  TRegistry,
  TClass extends new (...args: any[]) => any
> = ValidDependenciesForParameters<TRegistry, ConstructorParameters<TClass>>;

type ValidFunctionDependenciesFor<
  TRegistry,
  TFunction extends (...args: any[]) => any
> = ValidDependenciesForParameters<TRegistry, Parameters<TFunction>>;

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
    toFunction: (fn: TRegistry[K] extends CallableFunction ? TRegistry[K] : never) => void;
    toHigherOrderFunction: {
      <TFunction extends (...args: readonly []) => TRegistry[K]>(
        fn: TFunction,
        dependencies?: undefined,
        scope?: Scope
      ): void;
      <TFunction extends (...args: any[]) => TRegistry[K]>(
        fn: TFunction,
        dependencies: ValidFunctionDependenciesFor<TRegistry, TFunction>,
        scope?: Scope
      ): void;
      <TFunction extends (...args: any[]) => TRegistry[K], const TDependencies extends CompatibleArrayDependencies<TRegistry, Parameters<TFunction>>>(
        fn: TFunction,
        dependencies: NonTupleArray<TDependencies>,
        scope?: Scope
      ): void;
    };
    toCurry: {
      <TFunction extends (...args: readonly []) => TRegistry[K]>(
        fn: TFunction,
        dependencies?: undefined,
        scope?: Scope
      ): void;
      <TFunction extends (...args: any[]) => TRegistry[K]>(
        fn: TFunction,
        dependencies: ValidFunctionDependenciesFor<TRegistry, TFunction>,
        scope?: Scope
      ): void;
      <TFunction extends (...args: any[]) => TRegistry[K], const TDependencies extends CompatibleArrayDependencies<TRegistry, Parameters<TFunction>>>(
        fn: TFunction,
        dependencies: NonTupleArray<TDependencies>,
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
        dependencies: ValidDependenciesFor<TRegistry, TClass>,
        scope?: Scope
      ): void;
      <TClass extends new (...args: any[]) => TRegistry[K], const TDependencies extends CompatibleArrayDependencies<TRegistry, ConstructorParameters<TClass>>>(
        constructor: TClass,
        dependencies: NonTupleArray<TDependencies>,
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
      <TFunction extends (...args: readonly []) => TRegistry[K]>(
        fn: TFunction,
        dependencies?: undefined,
        scope?: Scope
      ): void;
      <TFunction extends (...args: any[]) => TRegistry[K]>(
        fn: TFunction,
        dependencies: ValidFunctionDependenciesFor<TRegistry, TFunction>,
        scope?: Scope
      ): void;
      <TFunction extends (...args: any[]) => TRegistry[K], const TDependencies extends CompatibleArrayDependencies<TRegistry, Parameters<TFunction>>>(
        fn: TFunction,
        dependencies: NonTupleArray<TDependencies>,
        scope?: Scope
      ): void;
    };
    toCurry: {
      <TFunction extends (...args: readonly []) => TRegistry[K]>(
        fn: TFunction,
        dependencies?: undefined,
        scope?: Scope
      ): void;
      <TFunction extends (...args: any[]) => TRegistry[K]>(
        fn: TFunction,
        dependencies: ValidFunctionDependenciesFor<TRegistry, TFunction>,
        scope?: Scope
      ): void;
      <TFunction extends (...args: any[]) => TRegistry[K], const TDependencies extends CompatibleArrayDependencies<TRegistry, Parameters<TFunction>>>(
        fn: TFunction,
        dependencies: NonTupleArray<TDependencies>,
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
        dependencies: ValidDependenciesFor<TRegistry, TClass>,
        scope?: Scope
      ): void;
      <TClass extends new (...args: any[]) => TRegistry[K], const TDependencies extends CompatibleArrayDependencies<TRegistry, ConstructorParameters<TClass>>>(
        constructor: TClass,
        dependencies: NonTupleArray<TDependencies>,
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
