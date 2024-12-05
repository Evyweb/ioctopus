import {Dependencies, MyServiceClassInterface} from "./types";

export class MyServiceClassWithoutDependencies implements MyServiceClassInterface {
    runTask(): string {
        return `Executing without dependencies`;
    }
}

export class MyServiceClass implements MyServiceClassInterface {
    constructor(
        private readonly dep1: string,
        private readonly dep2: number,
    ) {
    }

    runTask(): string {
        return `Executing with dep1: ${this.dep1} and dep2: ${this.dep2}`;
    }
}

export class MyServiceClassWithDependencyObject implements MyServiceClassInterface {
    constructor(private readonly dependencies: Dependencies) {
    }

    runTask(): string {
        return `Executing with dep1: ${this.dependencies.dep1} and dep2: ${this.dependencies.dep2}`;
    }
}
