import {MyServiceClassInterface} from "./MyServiceClassInterface";

export class MyServiceClassWithoutDependencies implements MyServiceClassInterface {
    runTask(): string {
        return `Executing without dependencies`;
    }
}