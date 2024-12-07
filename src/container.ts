import {Binding, Container, DependencyKey, Module, ModuleKey} from './types';
import {createModule} from './module';

export function createContainer(): Container {
    const modules = new Map<ModuleKey, Module>();
    const singletonInstances = new Map<DependencyKey, unknown>();
    const scopedInstances = new Map<DependencyKey, Map<DependencyKey, unknown>>();
    const resolutionStack: DependencyKey[] = [];
    let currentScopeId: symbol | undefined;

    const DEFAULT_MODULE_KEY = Symbol('DEFAULT');
    const defaultModule = createModule();
    modules.set(DEFAULT_MODULE_KEY, defaultModule);

    const bind = (key: DependencyKey) => defaultModule.bind(key);

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

    const verifyCircularDependencies = (key: DependencyKey) => {
        if (resolutionStack.includes(key)) {
            const cycle = [...resolutionStack, key].map((k) => k.toString()).join(' -> ');
            throw new Error(`Circular dependency detected: ${cycle}`);
        }
    };

    const get = <T>(key: DependencyKey): T => {
        verifyCircularDependencies(key);

        resolutionStack.push(key);

        try {
            const binding = getLastBinding(key);

            const {factory, scope} = binding;

            if (scope === 'singleton') {
                if (!singletonInstances.has(key)) {
                    singletonInstances.set(key, factory(resolveDependency));
                }
                return singletonInstances.get(key) as T;
            }

            if (scope === 'transient') {
                return factory(resolveDependency) as T;
            }

            if (scope === 'scoped') {
                if (!currentScopeId)
                    throw new Error(`Cannot resolve scoped binding outside of a scope: ${key.toString()}`);

                if (!scopedInstances.has(currentScopeId)) {
                    scopedInstances.set(currentScopeId, new Map<DependencyKey, unknown>());
                }
                const scopeMap = scopedInstances.get(currentScopeId)!;
                if (!scopeMap.has(key)) {
                    scopeMap.set(key, factory(resolveDependency));
                }

                return scopeMap.get(key) as T;
            }

            throw new Error(`Unknown scope: ${scope}`);
        } finally {
            resolutionStack.pop();
        }
    };

    const resolveDependency = (depKey: DependencyKey): unknown => {
        return get(depKey);
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

    return {bind, load, get, unload, runInScope};
}
