import {HigherOrderFunctionDependencies, MyServiceInterface, ServiceWithoutDependencyInterface} from "./types";

export const HigherOrderFunctionWithoutDependency = (): ServiceWithoutDependencyInterface => ({
    run() {
        return 'OtherService';
    }
});

export const HigherOrderFunctionWithDependencies = (dep1: string, dep2: number): MyServiceInterface => ({
    runTask() {
        return `Executing with dep1: ${dep1} and dep2: ${dep2}`;
    }
});

export const HigherOrderFunctionWithDependencyObject = ({ dep1, dep2 }: HigherOrderFunctionDependencies): MyServiceInterface => ({
    runTask() {
        return `Executing with dep1: ${dep1} and dep2: ${dep2}`;
    }
});

