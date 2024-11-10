import {ServiceWithoutDependencyInterface} from "./ServiceWithoutDependencyInterface";

export const HigherOrderFunctionWithoutDependencies = (): ServiceWithoutDependencyInterface => ({
    run() {
        return 'OtherService';
    }
});