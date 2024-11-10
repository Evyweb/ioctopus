import {MyServiceClassInterface} from "./MyServiceClassInterface";

export class MyServiceClass implements MyServiceClassInterface {
    constructor(
        private readonly dep1: string,
        private readonly dep2: number,
    ) {}

    runTask(): string {
        return `Executing with dep1: ${this.dep1} and dep2: ${this.dep2}`;
    }
}