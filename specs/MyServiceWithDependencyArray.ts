import {MyServiceInterface} from "./MyServiceInterface";

export const MyServiceWithDependencyArray = (dep1: string, dep2: number): MyServiceInterface => ({
    runTask() {
        return `Executing with dep1: ${dep1} and dep2: ${dep2}`;
    }
});