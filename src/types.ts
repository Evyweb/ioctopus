import { ServiceRegistry } from "./service-registry";

export type DependencyKey= symbol | string;
export type DependencyKeyType<T extends Record<string, unknown> = {}> = keyof T;
export type AnyFunction = (...args: any) => any;
export type AnyClass<Return = any> = new (...args: any) => Return;
export type ModuleKey = symbol | string;

export interface DependencyObject {
    [key: string]: DependencyKey;
}

export type DependencyArray = DependencyKey[];
export type DependencyArrayType<DependenciesTuple extends any[], Services extends Record<string, unknown> = {}> = ToKeysTuple<Services, DependenciesTuple>;

export type DependencyObjectType<Dependencies extends Record<string, unknown>, Services extends Record<string, unknown> = {}> = ToKeysObject<Services, Dependencies>;

export type Scope = 'singleton' | 'transient' | 'scoped';

interface Bindable<Services extends Record<string, unknown> = {}> {
    bind<Key extends DependencyKeyType<Services>>(key: Key): {
        toValue: (value: Services[Key]) => void;
        toFunction: (fn: CallableFunction) => void;
        toHigherOrderFunction: <Fn extends AnyFunction>(
            fn: Fn,
            dependencies?: DependencyArrayType<Parameters<Fn>, Services> | DependencyObjectType<Parameters<Fn>[0], Services>,
            scope?: Scope
        ) => void;
        toCurry: <Fn extends AnyFunction>(
            fn: Fn,
            dependencies?: DependencyArrayType<Parameters<Fn>, Services> | DependencyObjectType<Parameters<Fn>[0], Services>,
            scope?: Scope
        ) => void;
        toFactory: (factory: CallableFunction, scope?: Scope) => void;
        toClass: <Class extends AnyClass>(
            constructor: Class,
            dependencies?: DependencyArrayType<ConstructorParameters<Class>, Services> | DependencyObjectType<ConstructorParameters<Class>[0], Services>,
            scope?: Scope
        ) => void;
    };
}

export interface Container<Services extends Record<string, unknown> = {}> extends Bindable<Services>  {
    load(moduleKey: ModuleKey, module: Module<Services>): void;

    get<Key extends DependencyKeyType<Services>>(key: Key): Services[Key];

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

/**
 * Extracts the keys of a type that are of a specific value
 * 
 * @example
 * type MyType = {
 *    a: Cat,
 *    b: Dog,
 *    c: Ant,
 * }
 * 
 * type Result = FindKeyByValue<MyType, 'a'> // Cat
 */

export type FindKeyByValue<T extends Record<string, unknown>, V> = {
    [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Extracts the keys of a type that are of a specific value
 * 
 * @example
 * type Output = ToKeysTuple<{ a: string, b: number }, [string, number]>;
 * 
 * // Output = ['a', 'b']
 */

export type ToKeysTuple<
    Map extends Record<string, unknown>,
    T extends any[]
> = {
    [K in keyof T]: FindKeyByValue<Map, T[K]>;
};

/**
 * Extracts the keys of a type that are of a specific value and returns an object
 * 
 * @example
 * type Output = ToKeysObject<{ dep1: string, dep2: string, c: { name: string } }, { dep1: string, dep2: string }>;
 * 
 * // Output = { dep1: 'dep1', dep2: 'dep1' | 'dep2' }
 */

export type ToKeysObject<
    Map extends Record<string, unknown>,
    T extends Record<string, unknown>
> = {
    [K in keyof T]: FindKeyByValue<Map, T[K]>;
};

export type ExtractServiceRegistryType<T> = T extends ServiceRegistry<infer Services> ? Services : never;
export type ExtractServiceRegistryKeys<T> = keyof ExtractServiceRegistryType<T>;