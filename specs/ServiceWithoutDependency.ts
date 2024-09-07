import {ServiceWithoutDependencyInterface} from "./ServiceWithoutDependencyInterface";

export const ServiceWithoutDependency = (): ServiceWithoutDependencyInterface => ({
    run() {
        return 'OtherService';
    }
});