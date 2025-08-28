# A simple IOC container for Typescript
[![NPM Version](https://img.shields.io/npm/v/%40evyweb%2Fioctopus.svg?style=flat)]()
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/evyweb/ioctopus/main.yml)
[![codecov](https://codecov.io/gh/Evyweb/ioctopus/graph/badge.svg?token=A3Z8UCNHDY)](https://codecov.io/gh/Evyweb/ioctopus)

![NPM Downloads](https://img.shields.io/npm/dm/%40evyweb%2Fioctopus)
[![NPM Downloads](https://img.shields.io/npm/dt/%40evyweb%2Fioctopus.svg?style=flat)]()

![logo-ioctopus.png](assets/logo-ioctopus.png)

## Introduction
An IOC (Inversion of Control) container for Typescript. 

The idea behind is to create a simple container that can be used to register and resolve dependencies working with classes & functions but without reflect metadata.

It is using simple Typescript code, so it can be used in any project without any dependency.

Works also in NextJS middleware and node+edge runtimes.

## Installation
```npm i @evyweb/ioctopus```

## How to use

To use ioctopus, you need to create a container and bind your dependencies.
To do so you need to create an id for each dependency you want to register.

This id that we call an "injection token" can be a string or a symbol.
(Please note that you have to be consistent and use always strings for binding and resolving dependencies or always symbols, you can't mix them).

Then you can bind the dependency to a value, a function, a class, a factory, a higher order function, or a curried function.

#### Type-Safe Registry (Recommended)

**⚠️ Using a type-safe registry is the recommended approach for better type safety and developer experience.**

You can define a registry type or interface to get full type safety for your dependency injection keys and their corresponding types. This eliminates the need for manual casting when resolving dependencies.

### Create the Registry

Define a type or interface that maps your injection tokens to the desired types:

```typescript
// Using strings as injection tokens
type MyRegistry = {
    'USER_SERVICE': UserService;
    //...
}

// Or using symbols
const USER_SERVICE = Symbol('USER_SERVICE');
type MyRegistry = {
  [USER_SERVICE]: UserService;
  //...
}
```

### Create the container

Create your container with your registry type:

```typescript
import { createContainer } from '@evyweb/ioctopus';

// Create a type-safe container (Recommended)
const container = createContainer<MyRegistry>();
// Old way, without type safety
const container = createContainer();
```

### Register the dependencies

#### Primitives
You can register primitives
```typescript
// using strings
container.bind('DEP1').toValue('dependency1');
container.bind('DEP2').toValue(42);

// using symbols
container.bind(DI.DEP1).toValue('dependency1');
container.bind(DI.DEP2).toValue(42);
```

#### Functions
- You can register functions without dependencies
```typescript
const sayHelloWorld = () => console.log('Hello World');

container.bind(DI.SIMPLE_FUNCTION).toFunction(sayHelloWorld);

// or using strings
container.bind('SIMPLE_FUNCTION').toFunction(sayHelloWorld);
```

#### Currying
- You can register functions with dependencies using currying (1 level of currying)

```typescript
const myFunction = (dep1: string, dep2: number) => (name: string) => console.log(`${dep1} ${dep2} ${name}`);

container.bind(DI.CURRIED_FUNCTION_WITH_DEPENDENCIES)
    .toCurry(myFunction, [DI.DEP1, DI.DEP2]);

// or using strings
container.bind('CURRIED_FUNCTION_WITH_DEPENDENCIES')
    .toCurry(myFunction, ['DEP1', 'DEP2']);
```

- You can also use a dependency object

```typescript
interface Dependencies {
    dep1: string,
    dep2: number
}

const myFunction = (dependencies: Dependencies) => (name: string) => console.log(`${dependencies.dep1} ${dependencies.dep2} ${name}`);

// The dependencies will be listed in an object in the second parameter
container.bind(DI.CURRIED_FUNCTION_WITH_DEPENDENCIES)
    .toCurry(myFunction, {dep1: DI.DEP1, dep2: DI.DEP2});

// or using strings
container.bind('CURRIED_FUNCTION_WITH_DEPENDENCIES')
    .toCurry(myFunction, {dep1: 'DEP1', dep2: 'DEP2'});
```

#### Higher order functions
You can also register functions with dependencies by using higher order functions
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

// or using strings
container.bind('HIGHER_ORDER_FUNCTION_WITH_DEPENDENCIES')
    .toHigherOrderFunction(MyServiceWithDependencies, ['DEP1', 'DEP2']);
```

But if you prefer, you can also use a dependency object

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

// or using strings
container.bind('HIGHER_ORDER_FUNCTION_WITH_DEPENDENCIES')
    .toHigherOrderFunction(MyService, {dep1: 'DEP1', dep2: 'DEP2'});
```

#### Factories
For more complex cases, you can register factories.
    
```typescript
container.bind(DI.MY_USE_CASE).toFactory(() => {
    // Do something before creating the instance
     
    // Then return the instance
    return MyUseCase({
        myService: container.get<MyService>(DI.MY_SERVICE)
    });
});

// or using strings
container.bind('MY_USE_CASE').toFactory(() => {
    // Do something before creating the instance
     
    // Then return the instance
    return MyUseCase({
        myService: container.get<MyService>('MY_SERVICE')
    });
});
```

#### Classes
You can register classes, the dependencies of the class will be resolved and injected in the constructor

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

container.bind('CLASS_WITH_DEPENDENCIES').toClass(MyServiceClass, ['DEP1', 'DEP2']);

// orusing symbols
container.bind(DI.CLASS_WITH_DEPENDENCIES).toClass(MyServiceClass, [DI.DEP1, DI.DEP2]);
```

But if you prefer, you can also use a dependency object:
```typescript

interface Dependencies {
    dep1: string,
    dep2: number
}

class MyServiceClass implements MyServiceClassInterface {
    constructor(private readonly dependencies: Dependencies) {}

    runTask(): string {
        return `Executing with dep1: ${this.dependencies.dep1} and dep2: ${this.dependencies.dep2}`;
    }
}

container.bind('CLASS_WITH_DEPENDENCIES').toClass(MyServiceClass, {dep1: 'DEP1', dep2: 'DEP2'});

// or using symbols
container.bind(DI.CLASS_WITH_DEPENDENCIES).toClass(MyServiceClass, {dep1: DI.DEP1, dep2: DI.DEP2});
```

- You can register classes without dependencies:
```typescript
class MyServiceClassWithoutDependencies implements MyServiceClassInterface {
    runTask(): string {
        return `Executing without dependencies`;
    }
}

container.bind('CLASS_WITHOUT_DEPENDENCIES').toClass(MyServiceClassWithoutDependencies);

// or using symbols
container.bind(DI.CLASS_WITHOUT_DEPENDENCIES).toClass(MyServiceClassWithoutDependencies);
```

### Resolve the dependencies using the registry (recommended)

You can now resolve the dependencies using the get method of the container.

```typescript
import { DI } from './di';

// Primitive
const dep1 = container.get(DI.DEP1); // type will be the one you registered in your registry (string here)
// or using strings
const dep1 = container.get('DEP1'); // type will be the one you registered in your registry (string here)
```

### Resolve the dependencies without the registry

```typescript
import { DI } from './di';

// Primitive
const dep1 = container.get<string>(DI.DEP1); // Be fafault the type will be 'unknown', you need to cast it manually
// or using strings
const dep1 = container.get<string>('DEP1'); // Be fafault the type will be 'unknown', you need to cast it manually
```

### Modules

You can also use modules to organize your dependencies. Modules support the same type-safe registry approach as containers.

#### Loading modules

Modules can then be loaded in your container. 
By default, when you create a container, it is using a default module under the hood.

**With Registry (Recommended):**
```typescript
interface AppRegistry {
    'DEP1': string;
    'DEP2': number;
    'MY_SERVICE': MyServiceInterface;
}

const module1 = createModule<AppRegistry>();
module1.bind('DEP1').toValue('dependency1');

const module2 = createModule<AppRegistry>();
module2.bind('DEP2').toValue(42);

const module3 = createModule<AppRegistry>();
module3.bind('MY_SERVICE').toHigherOrderFunction(MyService, {dep1: 'DEP1', dep2: 'DEP2'});

const container = createContainer<AppRegistry>();
container.load('module1', module1);
container.load('module2', module2);
container.load('module3', module3);

const myService = container.get('MY_SERVICE'); // Type: MyServiceInterface
```

**Old approach without registry:**
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
Note that the module name used as a key can be a symbol or a string.

#### Modules override

You can also override dependencies of a module. The dependencies of the module will be overridden by the dependencies of the last loaded module.

```typescript
const module1 = createModule<AppRegistry>();
module1.bind(DI.DEP1).toValue('OLD dependency1');
module1.bind(DI.MY_SERVICE).toFunction(sayHelloWorld);

const module2 = createModule<AppRegistry>();
module2.bind(DI.DEP1).toValue('NEW dependency1');

const module3 = createModule<AppRegistry>();
module3.bind(DI.MY_SERVICE).toHigherOrderFunction(MyService, {dep1: DI.DEP1, dep2: DI.DEP2});

const container = createContainer<AppRegistry>();
container.bind(DI.DEP2).toValue(42); // Default module
container.load(Symbol('module1'), module1);
container.load(Symbol('module2'), module2);
container.load(Symbol('module3'), module3);

// The dependency DI.MY_SERVICE will be resolved with the higher order function and dep1 will be 'NEW dependency1'
const myService = container.get(DI.MY_SERVICE);
```

#### Unload modules

You can also unload a module from the container. The dependencies of the module will be removed from the container.
Already cached instances will be removed to keep consistency and avoid potential errors.

```typescript
const module1 = createModule<AppRegistry>();
module1.bind(DI.DEP1).toValue('dependency1');

const container = createContainer<AppRegistry>();
container.load(Symbol('module1'), module1);

container.unload(Symbol('module1'));

// Will throw an error as the dependency is not registered anymore
const myService = container.get(DI.DEP1); 
```
### Using scopes

#### Singleton scope (default)

In singleton scope, the container returns the same instance every time a dependency is resolved.

```typescript
container.bind(DI.MY_SERVICE).toClass(MyServiceClass, [DI.DEP1, DI.DEP2]);
// or
container.bind(DI.MY_SERVICE).toClass(MyServiceClass, [DI.DEP1, DI.DEP2], 'singleton');

const instance1 = container.get(DI.MY_SERVICE);
const instance2 = container.get(DI.MY_SERVICE);

console.log(instance1 === instance2); // true
```
#### Transient scope

In transient scope, the container returns a new instance every time the dependency is resolved.

```typescript
container.bind(DI.MY_SERVICE).toClass(MyServiceClass, [DI.DEP1, DI.DEP2], 'transient');

const instance1 = container.get(DI.MY_SERVICE);
const instance2 = container.get(DI.MY_SERVICE);

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
    instance1 = container.get(DI.MY_SERVICE);
    instance2 = container.get(DI.MY_SERVICE);

    console.log(instance1 === instance2); // true
});

container.runInScope(() => {
    const instance3 = container.get(DI.MY_SERVICE);

    console.log(instance3 === instance1); // false
});
```

Note: If you try to resolve a scoped dependency outside a scope, an error will be thrown.

### Circular dependencies

IOctopus can detect circular dependencies. 
An error will be thrown if a circular dependency is detected.

```typescript
const container = createContainer<AppRegistry>();

const A_TOKEN = Symbol('A');
const B_TOKEN = Symbol('B');

class A {
    constructor(public b: B) {}
}

class B {
    constructor(public a: A) {}
}

container.bind(A_TOKEN).toClass(A, [B_TOKEN]);
container.bind(B_TOKEN).toClass(B, [A_TOKEN]);

container.get(A_TOKEN); // Will throw: "Circular dependency detected: Symbol(A) -> Symbol(B) -> Symbol(A)"
```

This way you can avoid infinite loops and stack overflow errors.
