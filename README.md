# A simple IOC container for Typescript

![logo-ioctopus.png](assets/logo-ioctopus.png)

## Introduction
An IOC (Inversion of Control) container for Typescript. 
The idea behind is to create a simple container that can be used to register and resolve dependencies working with classes & functions but without reflect metadata.
It is using simple Typescript code, so it can be used in any project without any dependency.
Works in NextJS middleware and edge runtime.

## Installation
```npm i @evyweb/ioctopus```

## How to use

### List your injection tokens
Create a symbol for each dependency you want to register. It will be used to identify the dependency.

```typescript
export const DI: InjectionTokens = {
    DEP1: Symbol('DEP1'),
    DEP2: Symbol('DEP2'),
    LOGGER: Symbol('LOGGER'),
    MY_SERVICE: Symbol('MY_SERVICE'),
    MY_USE_CASE: Symbol('MY_USE_CASE'),
    SIMPLE_FUNCTION: Symbol('SIMPLE_FUNCTION'),
    CLASS_WITH_DEPENDENCIES: Symbol('CLASS_WITH_DEPENDENCIES'),
    CLASS_WITHOUT_DEPENDENCIES: Symbol('CLASS_WITHOUT_DEPENDENCIES'),
    HIGHER_ORDER_FUNCTION_WITH_DEPENDENCIES: Symbol('HIGHER_ORDER_FUNCTION_WITH_DEPENDENCIES'),
    HIGHER_ORDER_FUNCTION_WITHOUT_DEPENDENCIES: Symbol('HIGHER_ORDER_FUNCTION_WITHOUT_DEPENDENCIES')
} ;
```
Then create your container.

```typescript
import { DI } from './di';

const container: Container = createContainer();
```

### Register the dependencies

- You can register primitives
```typescript
container.bind(DI.DEP1).toValue('dependency1');
container.bind(DI.DEP2).toValue(42);
```

- You can register functions without dependencies
```typescript
const sayHelloWorld = () => console.log('Hello World');

container.bind(DI.SIMPLE_FUNCTION).toFunction(sayHelloWorld);
```

- You can register functions with dependencies by using higher order functions
```typescript
const MyServiceWithDependencies = (dep1: string, dep2: number): MyServiceWithDependenciesInterface => {
    return {
        runTask: () => {
            // Do something with dep1 and dep2
        }
    };
};

// The dependencies will be listed in an array in the second parameter
container.bind(DI.HIGHER_ORDER_FUNCTION_WITH_DEPENDENCIES)
    .toHigherOrderFunction(MyServiceWithDependencies, [DI.DEP1, DI.DEP2]);
```

- But if you prefer, you can also use a dependency object

```typescript
interface Dependencies {
    dep1: string,
    dep2: number
}

const MyService = (dependencies: Dependencies): MyServiceInterface => {
    return {
        runTask: () => {
            // Do something with dependencies.dep1 and dependencies.dep2
        }
    };
};

// The dependencies will be listed in an object in the second parameter
container.bind(DI.HIGHER_ORDER_FUNCTION_WITH_DEPENDENCIES)
    .toHigherOrderFunction(MyService, {dep1: DI.DEP1, dep2: DI.DEP2});
```

- For more complex cases, you can register factories.
    
```typescript
container.bind(DI.MY_USE_CASE).toFactory(() => {
    // Do something before creating the instance
     
    // Then return the instance
    return MyUseCase({
        myService: container.get<MyService>(DI.MY_SERVICE)
    });
});
```

- You can register classes, the dependencies of the class will be resolved and injected in the constructor

```typescript
class MyServiceClass implements MyServiceClassInterface {
    constructor(
        private readonly dep1: string,
        private readonly dep2: number,
    ) {}

    runTask(): string {
        return `Executing with dep1: ${this.dep1} and dep2: ${this.dep2}`;
    }
}

container.bind(DI.CLASS_WITH_DEPENDENCIES).toClass(MyServiceClass, [DI.DEP1, DI.DEP2]);
```

- You can register classes without dependencies
```typescript
class MyServiceClassWithoutDependencies implements MyServiceClassInterface {
    runTask(): string {
        return `Executing without dependencies`;
    }
}

container.bind(DI.CLASS_WITHOUT_DEPENDENCIES).toClass(MyServiceClassWithoutDependencies);
```

### Resolve the dependencies

```typescript
import { DI } from './di';

// Call the container to resolve the dependencies
const myUseCase = container.get<MyUseCaseInterface>(DI.MY_USE_CASE);

myUseCase.execute();
```

Code used in the examples can be found in the specs folder.
