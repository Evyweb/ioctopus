import {Container, Module} from "./types";
import {createModule} from "./module";

const DEFAULT_MODULE = Symbol('DEFAULT');

export function createContainer(): Container {
    const modules = new Map<symbol, Module>();
    const instances = new Map<symbol, unknown>();

    const defaultModule = createModule();
    modules.set(DEFAULT_MODULE, defaultModule);

    const bind = (key: symbol) => defaultModule.bind(key);

    const load = (moduleKey: symbol, module: Module) => modules.set(moduleKey, module);

    const unload = (moduleKey: symbol) => {
        instances.clear();
        modules.delete(moduleKey);
    };

    const findLastBinding = (key: symbol): CallableFunction | null => {
        const modulesArray = Array.from(modules.values());
        const moduleLength = modulesArray.length - 1;

        for (let i = moduleLength; i >= 0; i--) {
            const module = modulesArray[i];
            const binding = module.bindings.get(key);
            if (binding) {
                return binding;
            }
        }

        return null;
    };

    const get = <T>(key: symbol): T => {
        if (instances.has(key)) {
            return instances.get(key) as T;
        }

        const binding = findLastBinding(key);
        if (!binding) {
            throw new Error(`No binding found for key: ${key.toString()}`);
        }

        const instance = binding((depKey: symbol) => get(depKey));
        instances.set(key, instance);
        return instance as T;
    };

    return {bind, load, get, unload};
}
