# Draft of a simple IOC container in Typescript

## Introduction
This is just a draft for an attempt to create a simple IOC (Inversion of Control) container in Typescript. The idea is to create a simple container that can be used to register and resolve dependencies working with functions (no class) and without reflect metadata.

## How to use

### List the dependencies
Create a symbol for each dependency you want to register. It will be used to identify the dependency.

```typescript
export const DI = {
    HELLO_WORLD: Symbol('HELLO_WORLD'),
    DEP1: Symbol('dep1'),
    DEP2: Symbol('dep2'),
    MY_SERVICE: Symbol('MyService'),
    MY_USE_CASE: Symbol('MyUseCase'),
    LOGGER: Symbol('LOGGER'),
};
```

### Register the dependencies

```typescript
import { DI } from './di';

const container: Container = createContainer();

// You can register primitives
container.bind(DI.DEP1).toValue('dependency1');
container.bind(DI.DEP2).toValue(42);

// You can register functions without dependencies
container.bind(DI.HELLO_WORLD).toFunction(sayHelloWorld);

// You can register functions with dependencies
container.bind(DI.MY_SERVICE_WITH_DEPENDENCY_ARRAY).toFunction(MyServiceWithDependencyArray, [DI.DEP1, DI.DEP2]);

// You can register a factory so dep1 and dep2 will be injected
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

This is just a draft and it is not ready for production.
Can be improved in many ways.