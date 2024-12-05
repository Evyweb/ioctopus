export interface MyServiceClassInterface {
    runTask(): string;
}

export interface Dependencies {
    dep1: string;
    dep2: number;
}

export interface ServiceWithoutDependencyInterface {
    run: () => string;
}

export type SayHelloType = () => string;

export interface MyUseCaseInterface {
    execute: () => string;
}

export interface MyServiceInterface {
    runTask: () => string;
}

export interface LoggerInterface {
    log: (message: string) => void;
}

export interface UseCaseDependencies {
    myService: MyServiceInterface,
    logger: LoggerInterface,
    sayHello: SayHelloType
}

export type CurriedFunctionWithDependencies = (name: string) => string;

export type CurriedFunctionWithoutDependencies = () => string;

export interface HigherOrderFunctionDependencies {
    dep1: string,
    dep2: number
}