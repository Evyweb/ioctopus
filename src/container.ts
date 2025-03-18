import {Binding, Container, DependencyKey, DependencyKeyType, Module, ModuleKey} from './types';
import {createModule} from './module';
import { ServiceRegistry } from './service-registry';

export function createContainer<Services extends Record<string, unknown> = {}>(
    serviceRegistry: ServiceRegistry<Services>
): Container<Services> {
    const modules = new Map<ModuleKey, Module>();
    const singletonInstances = new Map<DependencyKey, unknown>();
    const scopedInstances = new Map<DependencyKey, Map<DependencyKey, unknown>>();
    const resolutionStack: DependencyKey[] = [];
    let currentScopeId: symbol | undefined;

    const DEFAULT_MODULE_KEY = Symbol('DEFAULT');
    const defaultModule = createModule(serviceRegistry);
    modules.set(DEFAULT_MODULE_KEY, defaultModule as unknown as Module);

    const bind = (key: DependencyKeyType<Services>) => defaultModule.bind(key);

    const load = (moduleKey: symbol, module: Module<Services>) => modules.set(moduleKey, module as unknown as Module);

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

    const buildCycleOf = (key: DependencyKey) => [...resolutionStack, key].map((k) => k.toString()).join(' -> ');

    const startCircularDependencyDetectionFor = (dependencyKey: DependencyKey) => resolutionStack.push(dependencyKey);

    const endCircularDependencyDetection = () => resolutionStack.pop();

    const get = <T>(dependencyKey: DependencyKey): T => {
        if (isCircularDependency(dependencyKey)) {
            const cycle = buildCycleOf(dependencyKey);
            throw new Error(`Circular dependency detected: ${cycle}`);
        }

        startCircularDependencyDetectionFor(dependencyKey);

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
            endCircularDependencyDetection();
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
