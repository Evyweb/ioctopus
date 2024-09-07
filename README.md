# Draft of a simple IOC container in Typescript

## Introduction
This is just a **draft** of an attempt to create a simple IOC (Inversion of Control) container in Typescript. 
The idea behind is to create a simple container that can be used to register and resolve dependencies working with functions and without reflect metadata.
It is using simple Typescript code, so it can be used in any project without any dependency.
Remember that it is just a draft and it is not ready for production.

## How to use

### List the dependencies
Create a symbol for each dependency you want to register. It will be used to identify the dependency.

```typescript
export const DI = {
    HELLO_WORLD: Symbol('HELLO_WORLD'),
    DEP1: Symbol('dep1'),
    DEP2: Symbol('dep2'),
    MY_SERVICE: Symbol('MyService'),
    MY_SERVICE_WITH_DEPENDENCIES: Symbol('MyServiceWithDependencies'),
    MY_USE_CASE: Symbol('MyUseCase'),
    LOGGER: Symbol('LOGGER'),
    MY_SERVICE_CLASS: Symbol('MyServiceClass'),
    NOT_REGISTERED_VALUE: Symbol('NOT_REGISTERED_VALUE')
};
```

### Register the dependencies

```typescript
import { DI } from './di';

const container: Container = createContainer();

// You can register primitives
container.bind(DI.DEP1).toValue('dependency1');
container.bind(DI.DEP2).toValue(42);

// You can register functions without dependencies (e.g. a const sayHelloWorld = () => 'Hello World')
// This kind of function has no dependecies, so you need to register it without the dependency array
container.bind(DI.HELLO_WORLD).toFunction(sayHelloWorld);

// You can register functions with dependencies
container.bind(DI.MY_SERVICE_WITH_DEPENDENCIES).toFunction(MyServiceWithDependencies, [DI.DEP1, DI.DEP2]);

// Note: If your function has no dependencies but is a higher order function, you have to register it as a function with an empty array of dependencies:
container.bind(DI.SERVICE_WITHOUT_DEPENDENCY).toFunction(ServiceWithoutDependency, []);

// For more complexe cases, you can register a factory so dep1 and dep2 will be injected
container.bind(DI.MY_SERVICE).toFactory(() => {
    return MyService({
        dep1: container.get<string>(DI.DEP1),
        dep2: container.get<number>(DI.DEP2)
    });
});

// You can register a factory so myService will be injected
container.bind(DI.MY_USE_CASE).toFactory(() => {
    return MyUseCase({
        myService: container.get<MyService>(DI.MY_SERVICE)
    });
});

// You can register classes, the dependencies of the class will be resolved and injected in the constructor
container.bind(DI.MY_SERVICE_CLASS).toClass(MyServiceClass, [DI.DEP1, DI.DEP2]);

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
