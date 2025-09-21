export type TestRegistry = {
  'USER_SERVICE': UserService;
  'LOGGER': Logger;
  'CONFIG': Config;
  'DEP1': string;
  'DEP2': number;
  'SIMPLE_FUNCTION': () => string;
  'MY_SERVICE': MyService;
  'MY_USE_CASE': MyUseCase;
  'CLASS_WITH_DEPENDENCIES': ServiceClass;
  'CLASS_WITHOUT_DEPENDENCIES': ServiceClass;
}

export interface UserService {
  getUser(id: string): string;
}

export interface Logger {
  log(message: string): void;
}

export type Config = {
  apiUrl: string;
  timeout: number;
}

export interface MyService {
  runTask(): string;
}

export interface MyUseCase {
  execute(): string;
}

export interface ServiceClass {
  runTask(): string;
}

export class FakeLogger implements Logger {
  log(message: string) {
    console.log(message);
  }

  extraMethod() {
    console.log('Extra method');
  }
}

export const simpleFunction = () => 'hello world';

export class ServiceClassWithDeps implements ServiceClass {
  constructor(private dep1: string, private dep2: number) {}

  runTask(): string {
    return `Executing with dep1: ${this.dep1} and dep2: ${this.dep2}`;
  }
}

export class ServiceClassWithObjectDeps implements ServiceClass {
  constructor(private dependencies: { dep1: string; dep2: number }) {}

  runTask(): string {
    return `Executing with dep1: ${this.dependencies.dep1} and dep2: ${this.dependencies.dep2}`;
  }
}

export class ServiceClassNoDeps implements ServiceClass {
  runTask(): string {
    return 'Executing without dependencies';
  }
}