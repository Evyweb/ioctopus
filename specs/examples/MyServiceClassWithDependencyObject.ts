import {MyServiceClassInterface} from "./MyServiceClassInterface";

interface Dependencies {
    dep1: string;
    dep2: number;
}

export class MyServiceClassWithDependencyObject implements MyServiceClassInterface {
    constructor(private readonly dependencies: Dependencies) {}

    runTask(): string {
        return `Executing with dep1: ${this.dependencies.dep1} and dep2: ${this.dependencies.dep2}`;
    }
}