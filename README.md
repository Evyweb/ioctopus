# A simple IOC container for Typescript
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/evyweb/ioctopus/main.yml)
[![codecov](https://codecov.io/gh/Evyweb/ioctopus/graph/badge.svg?token=A3Z8UCNHDY)](https://codecov.io/gh/Evyweb/ioctopus)
![NPM Downloads](https://img.shields.io/npm/dm/%40evyweb%2Fioctopus)

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

### Modules

You can also use modules to organize your dependencies.

#### Loading modules

Modules can then be loaded in your container. 
By default, when you create a container, it is using a default module under the hood.

```typescript
const module1 = createModule();
module1.bind(DI.DEP1).toValue('dependency1');

const module2 = createModule();
module2.bind(DI.DEP2).toValue(42);

const module3 = createModule();
module3.bind(DI.MY_SERVICE).toHigherOrderFunction(MyService, {dep1: DI.DEP1, dep2: DI.DEP2});

const container = createContainer();
container.load(Symbol('module1'), module1);
container.load(Symbol('module2'), module2);
container.load(Symbol('module3'), module3);

const myService = container.get<MyServiceInterface>(DI.MY_SERVICE);
```
The dependencies do not need to be registered in the same module as the one that is using them.
Note that the module name used as a key is a symbol.

#### Modules override

You can also override dependencies of a module. The dependencies of the module will be overridden by the dependencies of the last loaded module.

```typescript
const module1 = createModule();
module1.bind(DI.DEP1).toValue('OLD dependency1');
module1.bind(DI.MY_SERVICE).toFunction(sayHelloWorld);

const module2 = createModule();
module2.bind(DI.DEP1).toValue('NEW dependency1');

const module3 = createModule();
module3.bind(DI.MY_SERVICE).toHigherOrderFunction(MyService, {dep1: DI.DEP1, dep2: DI.DEP2});

const container = createContainer();
container.bind(DI.DEP2).toValue(42); // Default module
container.load(Symbol('module1'), module1);
container.load(Symbol('module2'), module2);
container.load(Symbol('module3'), module3);

// The dependency DI.MY_SERVICE will be resolved with the higher order function and dep1 will be 'NEW dependency1'
const myService = container.get<MyServiceInterface>(DI.MY_SERVICE);
```

#### Unload modules

You can also unload a module from the container. The dependencies of the module will be removed from the container.
Already cached instances will be removed to keep consistency and avoid potential errors.

```typescript
const module1 = createModule();
module1.bind(DI.DEP1).toValue('dependency1');

const container = createContainer();
container.load(Symbol('module1'), module1);

container.unload(Symbol('module1'));

// Will throw an error as the dependency is not registered anymore
const myService = container.get<string>(DI.DEP1); 
```
### Using scopes

#### Singleton scope (default)

In singleton scope, the container returns the same instance every time a dependency is resolved.

```typescript
container.bind(DI.MY_SERVICE).toClass(MyServiceClass, [DI.DEP1, DI.DEP2]);
// or
container.bind(DI.MY_SERVICE).toClass(MyServiceClass, [DI.DEP1, DI.DEP2], 'singleton');

const instance1 = container.get<MyServiceClassInterface>(DI.MY_SERVICE);
const instance2 = container.get<MyServiceClassInterface>(DI.MY_SERVICE);

console.log(instance1 === instance2); // true
```
#### Transient scope

In transient scope, the container returns a new instance every time the dependency is resolved.

```typescript
container.bind(DI.MY_SERVICE).toClass(MyServiceClass, [DI.DEP1, DI.DEP2], 'transient');

const instance1 = container.get<MyServiceClassInterface>(DI.MY_SERVICE);
const instance2 = container.get<MyServiceClassInterface>(DI.MY_SERVICE);

console.log(instance1 === instance2); // false
```

#### Scoped Scope
In scoped scope, the container returns the same instance within a scope. Different scopes will have different instances.

To use the scoped scope, you need to create a scope using runInScope.

```typescript
container.bind(DI.MY_SERVICE).toClass(MyServiceClass, [DI.DEP1, DI.DEP2], 'scoped');
const instance1 = undefined;
const instance2 = undefined;

container.runInScope(() => {
    instance1 = container.get<MyServiceClassInterface>(DI.MY_SERVICE);
    instance2 = container.get<MyServiceClassInterface>(DI.MY_SERVICE);

    console.log(instance1 === instance2); // true
});

container.runInScope(() => {
    const instance3 = container.get<MyServiceClassInterface>(DI.MY_SERVICE);

    console.log(instance3 === instance1); // false
});
```

Note: If you try to resolve a scoped dependency outside a scope, an error will be thrown.
