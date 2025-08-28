import {Binding, Container, DependencyKey, Module, ModuleKey, TypedContainer, DefaultRegistry} from './types';
import {createModule} from './module';

function createContainerCore() {
    const modules = new Map<ModuleKey, Module>();
    const singletonInstances = new Map<DependencyKey, unknown>();
    const scopedInstances = new Map<DependencyKey, Map<DependencyKey, unknown>>();
    const resolutionStack: DependencyKey[] = [];
    let currentScopeId: symbol | undefined;

    const DEFAULT_MODULE_KEY = Symbol('DEFAULT');
    const defaultModule = createModule();
    modules.set(DEFAULT_MODULE_KEY, defaultModule);

    const load = (moduleKey: symbol, module: Module) => modules.set(moduleKey, module);

    const unload = (moduleKey: ModuleKey) => {
        singletonInstances.clear();
        modules.delete(moduleKey);
    };

    const findLastBinding = (key: DependencyKey): Binding | null => {
        const modulesArray = Array.from(modules.values());
        for (let i = modulesArray.length - 1; i >= 0; i--) {
            const module = modulesArray[i];
            const binding = module.bindings.get(key);
            if (binding) {
                return binding as Binding;
            }
        }
        return null;
    };

    const getLastBinding = (key: DependencyKey): Binding => {
        const binding = findLastBinding(key);
        if (!binding) {
            throw new Error(`No binding found for key: ${key.toString()}`);
        }
        return binding;
    };

    const isCircularDependency = (key: DependencyKey): boolean => resolutionStack.includes(key);

    const buildCyclePath = (key: DependencyKey) => [...resolutionStack, key].map((k) => k.toString()).join(' -> ');

    const startResolution = (dependencyKey: DependencyKey) => resolutionStack.push(dependencyKey);

    const endResolution = () => resolutionStack.pop();

    const resolveBinding = <T>(dependencyKey: DependencyKey): T => {
        if (isCircularDependency(dependencyKey)) {
            const cycle = buildCyclePath(dependencyKey);
            throw new Error(`Circular dependency detected: ${cycle}`);
        }

        startResolution(dependencyKey);

        try {
            const binding = getLastBinding(dependencyKey);
            const {factory, scope} = binding;

            if (scope === 'singleton') {
                if (!singletonInstances.has(dependencyKey)) {
                    singletonInstances.set(dependencyKey, factory(resolveDependency));
                }
                return singletonInstances.get(dependencyKey) as T;
            }

            if (scope === 'transient') {
                return factory(resolveDependency) as T;
            }

            if (scope === 'scoped') {
                if (!currentScopeId) {
                    throw new Error(`Cannot resolve scoped binding outside of a scope: ${dependencyKey.toString()}`);
                }

                if (!scopedInstances.has(currentScopeId)) {
                    scopedInstances.set(currentScopeId, new Map<DependencyKey, unknown>());
                }
                const scopeMap = scopedInstances.get(currentScopeId)!;
                if (!scopeMap.has(dependencyKey)) {
                    scopeMap.set(dependencyKey, factory(resolveDependency));
                }

                return scopeMap.get(dependencyKey) as T;
            }

            throw new Error(`Unknown scope: ${scope}`);
        } finally {
            endResolution();
        }
    };

    const resolveDependency = (depKey: DependencyKey): unknown => {
        return resolveBinding(depKey);
    };

    const runInScope = <T>(callback: () => T): T => {
        const previousScopeId = currentScopeId;
        currentScopeId = Symbol('scope');
        try {
            return callback();
        } finally {
            scopedInstances.delete(currentScopeId);
            currentScopeId = previousScopeId;
        }
    };

    return {
        defaultModule,
        load,
        unload,
        runInScope,
        resolveBinding,
    };
}

export function createContainer(): Container;
export function createContainer<TRegistry>(): TypedContainer<TRegistry>;
export function createContainer<TRegistry = DefaultRegistry>(): Container | TypedContainer<TRegistry> {
    const core = createContainerCore();

    const bind = (key: DependencyKey) => core.defaultModule.bind(key);
    const get = <T>(key: DependencyKey): T => core.resolveBinding<T>(key);

    return {
        bind,
        load: core.load,
        get,
        unload: core.unload,
        runInScope: core.runInScope,
    } as Container | TypedContainer<TRegistry>;
}
