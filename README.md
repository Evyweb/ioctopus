# A simple IOC container in Typescript (DRAFT)

![logo-ioctopus.png](assets/logo-ioctopus.png)

## Introduction
This is just a **draft** of an attempt to create a simple IOC (Inversion of Control) container in Typescript. 
The idea behind is to create a simple container that can be used to register and resolve dependencies working with functions and without reflect metadata.
It is using simple Typescript code, so it can be used in any project without any dependency.
Should work in NextJS middleware and edge runtime.
Remember that it is just a draft and it is not ready for production.

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

### Register the dependencies

```typescript
import { DI } from './di';

const container: Container = createContainer();

// 1. You can register primitives
container.bind(DI.DEP1).toValue('dependency1');
container.bind(DI.DEP2).toValue(42);

// 2. You can register functions without dependencies
const sayHelloWorld = () => console.log('Hello World');
container.bind(DI.SIMPLE_FUNCTION).toFunction(sayHelloWorld);

// 3. You can register functions with dependencies by using higher order functions
const MyServiceWithDependencies = (dep1: string, dep2: number) => {
    return {
        runTask: () => {
            // Do something with dep1 and dep2
        }
    };
};

// The dependencies will be listed in an array in the second parameter
container.bind(DI.HIGHER_ORDER_FUNCTION_WITH_DEPENDENCIES)
    .toHigherOrderFunction(MyServiceWithDependencies, [DI.DEP1, DI.DEP2]);

// But if you prefer, you can also use a dependency object
const MyService = (dependencies: { dep1: string, dep2: number }) => {
    return {
        runTask: () => {
            // Do something with dependencies.dep1 and dependencies.dep2
        }
    };
};

// The dependencies will be listed in an object in the second parameter
container.bind(DI.HIGHER_ORDER_FUNCTION_WITH_DEPENDENCIES)
    .toHigherOrderFunction(MyServiceWithDependencies, { dep1: DI.DEP1, dep2: DI.DEP2 });

// 4. For more complexe cases, you can register a factory so myService will be injected
container.bind(DI.MY_USE_CASE).toFactory(() => {
    // Do something before creating the instance
    return MyUseCase({
        myService: container.get<MyService>(DI.MY_SERVICE)
    });
});

// 5. You can register classes, the dependencies of the class will be resolved and injected in the constructor
container.bind(DI.CLASS_WITH_DEPENDENCIES).toClass(MyServiceClass, [DI.DEP1, DI.DEP2]);

// 6. You can register classes without dependencies
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

This is just a draft, and it is not ready for production.
Can be improved in many ways.
