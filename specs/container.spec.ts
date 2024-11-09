import {MyService} from "./MyService";
import {MyServiceInterface} from "./MyServiceInterface";
import {SayHelloType} from "./SayHelloType";
import {sayHelloWorld} from "./sayHelloWorld";
import {MyUseCase} from "./MyUseCase";
import {MyUseCaseInterface} from "./MyUseCaseInterface";
import {LoggerInterface} from "./LoggerInterface";
import {DI} from "./DI";
import {Container, createContainer, createModule} from "../src";
import {MyServiceClass} from "./MyServiceClass";
import {MyServiceClassInterface} from "./MyServiceClassInterface";
import {FunctionWithDependencies} from "./FunctionWithDependencies";
import {HigherOrderFunctionWithoutDependencies} from "./HigherOrderFunctionWithoutDependencies";
import {ServiceWithoutDependencyInterface} from "./ServiceWithoutDependencyInterface";
import {MyServiceClassWithoutDependencies} from "./MyServiceClassWithoutDependencies";
import {mock, MockProxy} from "vitest-mock-extended";
import {vi} from "vitest";

describe('Container', () => {

    let container: Container;

    beforeEach(() => {
        container = createContainer();
    });

    describe('When a simple function is registered', () => {
        it('should return the associated function', () => {
            // Arrange
            container.bind(DI.SIMPLE_FUNCTION).toFunction(sayHelloWorld);

            // Act
            const sayHello = container.get<SayHelloType>(DI.SIMPLE_FUNCTION);

            // Assert
            expect(sayHello()).toBe('hello world');
        });

        describe('When the function is a higher order function with dependencies', () => {
            beforeEach(() => {
                container.bind(DI.DEP1).toValue('dependency1');
                container.bind(DI.DEP2).toValue(42);
            });

            describe('When the dependencies are defined in an array', () => {
                it('should return the function with all its dependencies resolved', () => {
                    // Arrange
                    container.bind(DI.HIGHER_ORDER_FUNCTION_WITH_DEPENDENCIES)
                        .toHigherOrderFunction(FunctionWithDependencies, [DI.DEP1, DI.DEP2]);

                    // Act
                    const myService = container.get<MyServiceInterface>(DI.HIGHER_ORDER_FUNCTION_WITH_DEPENDENCIES);

                    // Assert
                    expect(myService.runTask()).toBe('Executing with dep1: dependency1 and dep2: 42');
                });
            });

            describe('When the dependencies are defined in an object', () => {
                it('should return the function with all its dependencies resolved', () => {
                    // Arrange
                    container.bind(DI.MY_SERVICE)
                        .toHigherOrderFunction(MyService, {dep1: DI.DEP1, dep2: DI.DEP2});

                    // Act
                    const myService = container.get<MyServiceInterface>(DI.MY_SERVICE);

                    // Assert
                    expect(myService.runTask()).toBe('Executing with dep1: dependency1 and dep2: 42');
                });
            });

            describe('When the dependencies are defined in an other format', () => {
                it('should throw an error', () => {
                    // Act & Assert
                    expect(() => container.bind(DI.HIGHER_ORDER_FUNCTION_WITH_DEPENDENCIES)
                        .toHigherOrderFunction(FunctionWithDependencies, 'invalid' as any))
                        .toThrowError('Invalid dependencies type');
                });
            });

            describe('When the scope is defined to "transient"', () => {
                it('should return a new instance each time', () => {
                    // Arrange
                    container.bind(DI.DEP1).toValue('dependency1');
                    container.bind(DI.DEP2).toValue(42);
                    container.bind(DI.MY_SERVICE)
                        .toHigherOrderFunction(MyService, {dep1: DI.DEP1, dep2: DI.DEP2}, 'transient');

                    // Act
                    const myService1 = container.get<MyServiceInterface>(DI.MY_SERVICE);
                    const myService2 = container.get<MyServiceInterface>(DI.MY_SERVICE);

                    // Assert
                    expect(myService1).not.toBe(myService2);
                });
            });

            describe('When the scope is defined to "scoped"', () => {
                it('should return the same instance within the same scope', () => {
                    // Arrange
                    container.bind(DI.DEP1).toValue('dependency1');
                    container.bind(DI.DEP2).toValue(42);
                    container.bind(DI.MY_SERVICE)
                        .toHigherOrderFunction(MyService, {dep1: DI.DEP1, dep2: DI.DEP2}, 'scoped');

                    // Act & Assert
                    container.runInScope(() => {
                        const myService1 = container.get<MyServiceInterface>(DI.MY_SERVICE);
                        const myService2 = container.get<MyServiceInterface>(DI.MY_SERVICE);
                        expect(myService1).toBe(myService2);
                    });
                });

                it('should return different instances in different scopes', () => {
                    // Arrange
                    container.bind(DI.DEP1).toValue('dependency1');
                    container.bind(DI.DEP2).toValue(42);
                    container.bind(DI.MY_SERVICE)
                        .toHigherOrderFunction(MyService, {dep1: DI.DEP1, dep2: DI.DEP2}, 'scoped');

                    // Act
                    let myService1: MyServiceInterface | undefined;
                    let myService2: MyServiceInterface | undefined;

                    container.runInScope(() => {
                        myService1 = container.get<MyServiceInterface>(DI.MY_SERVICE);
                    });

                    container.runInScope(() => {
                        myService2 = container.get<MyServiceInterface>(DI.MY_SERVICE);
                    });

                    // Assert
                    expect(myService1).toBeDefined();
                    expect(myService2).toBeDefined();
                    expect(myService1).not.toBe(myService2);
                });
            });

            describe('When a scoped dependency is resolved outside of a scope', () => {
                it('should throw an error', () => {
                    // Arrange
                    container.bind(DI.MY_SERVICE)
                        .toHigherOrderFunction(MyService, {dep1: DI.DEP1, dep2: DI.DEP2}, 'scoped');

                    // Act & Assert
                    expect(() => container.get<MyServiceInterface>(DI.MY_SERVICE))
                        .toThrowError(`Cannot resolve scoped binding outside of a scope: ${DI.MY_SERVICE.toString()}`);
                });
            });
        });

        describe.each([
            {dependencies: undefined},
            {dependencies: []},
            {dependencies: {}},
        ])('When the function is a higher order function without dependencies', ({dependencies}) => {
            it('should just return the function', () => {
                // Arrange
                container.bind(DI.DEP1).toValue('dependency1');
                container.bind(DI.HIGHER_ORDER_FUNCTION_WITHOUT_DEPENDENCIES)
                    .toHigherOrderFunction(HigherOrderFunctionWithoutDependencies, dependencies);

                // Act
                const myService = container.get<ServiceWithoutDependencyInterface>(DI.HIGHER_ORDER_FUNCTION_WITHOUT_DEPENDENCIES);

                // Assert
                expect(myService.run()).toBe('OtherService');
            });
        });

        describe('When a factory is used', () => {
            it('should resolve all its dependencies', () => {
                // Arrange
                container.bind(DI.DEP1).toValue('dependency1');
                container.bind(DI.DEP2).toValue(42);

                container.bind(DI.MY_SERVICE).toFactory(() => {
                    return MyService({
                        dep1: container.get<string>(DI.DEP1),
                        dep2: container.get<number>(DI.DEP2)
                    });
                });

                // Act
                const myService = container.get<MyServiceInterface>(DI.MY_SERVICE);

                // Assert
                expect(myService.runTask()).toBe('Executing with dep1: dependency1 and dep2: 42');
            });

            describe('When the dependency has dependencies', () => {
                it('should return the dependency with all its dependencies resolved', () => {
                    // Arrange
                    container.bind(DI.DEP1).toValue('dependency1');
                    container.bind(DI.DEP2).toValue(42);
                    container.bind(DI.SIMPLE_FUNCTION).toFunction(sayHelloWorld);

                    container.bind(DI.MY_SERVICE).toFactory(() => {
                        return MyService({
                            dep1: container.get<string>(DI.DEP1),
                            dep2: container.get<number>(DI.DEP2)
                        });
                    });

                    container.bind(DI.LOGGER).toValue(mock<LoggerInterface>());

                    container.bind(DI.MY_USE_CASE).toFactory(() => {
                        return MyUseCase({
                            myService: container.get<MyServiceInterface>(DI.MY_SERVICE),
                            logger: container.get<LoggerInterface>(DI.LOGGER),
                            sayHello: container.get<SayHelloType>(DI.SIMPLE_FUNCTION)
                        });
                    });

                    // Act
                    const myUseCase = container.get<MyUseCaseInterface>(DI.MY_USE_CASE);

                    // Assert
                    expect(myUseCase.execute()).toBe('Executing with dep1: dependency1 and dep2: 42');

                    const fakeLogger = container.get<MockProxy<LoggerInterface>>(DI.LOGGER);
                    expect(fakeLogger.log).toHaveBeenCalledTimes(2);
                    expect(fakeLogger.log).toHaveBeenCalledWith('Executing with dep1: dependency1 and dep2: 42');
                    expect(fakeLogger.log).toHaveBeenCalledWith('hello world');
                });
            });

            describe('When the instance is retrieved twice', () => {
                describe('When the scope is not defined', () => {
                    it('should return the same instance (singleton)', () => {
                        // Arrange
                        const factoryCalls = vi.fn();
                        container.bind(DI.DEP1).toValue('dependency1');
                        container.bind(DI.DEP2).toValue(42);

                        container.bind(DI.MY_SERVICE).toFactory(() => {
                            factoryCalls();
                            return MyService({
                                dep1: container.get<string>(DI.DEP1),
                                dep2: container.get<number>(DI.DEP2)
                            });
                        });
                        const myService1 = container.get<MyServiceInterface>(DI.MY_SERVICE);

                        // Act
                        const myService2 = container.get<MyServiceInterface>(DI.MY_SERVICE);

                        // Assert
                        expect(myService1).toBe(myService2);
                        expect(factoryCalls).toHaveBeenCalledTimes(1);
                    });
                });

                describe('When the scope is defined to "transient"', () => {
                    it('should return a new instance each time', () => {
                        // Arrange
                        const factoryCalls = vi.fn();
                        container.bind(DI.DEP1).toValue('dependency1');
                        container.bind(DI.DEP2).toValue(42);

                        container.bind(DI.MY_SERVICE).toFactory(() => {
                            factoryCalls();
                            return MyService({
                                dep1: container.get<string>(DI.DEP1),
                                dep2: container.get<number>(DI.DEP2)
                            });
                        }, 'transient');

                        // Act
                        const myService1 = container.get<MyServiceInterface>(DI.MY_SERVICE);
                        const myService2 = container.get<MyServiceInterface>(DI.MY_SERVICE);

                        // Assert
                        expect(myService1).not.toBe(myService2);
                        expect(factoryCalls).toHaveBeenCalledTimes(2);
                    });
                });

                describe('When the scope is defined to "scoped"', () => {
                    it('should return the same instance within the same scope', () => {
                        // Arrange
                        const factoryCalls = vi.fn();
                        container.bind(DI.DEP1).toValue('dependency1');
                        container.bind(DI.DEP2).toValue(42);

                        container.bind(DI.MY_SERVICE).toFactory(() => {
                            factoryCalls();
                            return MyService({
                                dep1: container.get<string>(DI.DEP1),
                                dep2: container.get<number>(DI.DEP2)
                            });
                        }, 'scoped');

                        // Act & Assert
                        container.runInScope(() => {
                            const myService1 = container.get<MyServiceInterface>(DI.MY_SERVICE);
                            const myService2 = container.get<MyServiceInterface>(DI.MY_SERVICE);

                            expect(myService1).toBe(myService2);
                            expect(factoryCalls).toHaveBeenCalledTimes(1);
                        });
                    });

                    it('should return different instances in different scopes', () => {
                        // Arrange
                        const factoryCalls = vi.fn();
                        container.bind(DI.DEP1).toValue('dependency1');
                        container.bind(DI.DEP2).toValue(42);

                        container.bind(DI.MY_SERVICE).toFactory(() => {
                            factoryCalls();
                            return MyService({
                                dep1: container.get<string>(DI.DEP1),
                                dep2: container.get<number>(DI.DEP2)
                            });
                        }, 'scoped');

                        // Act
                        let myService1: MyServiceInterface | undefined;
                        let myService2: MyServiceInterface | undefined;

                        container.runInScope(() => {
                            myService1 = container.get<MyServiceInterface>(DI.MY_SERVICE);
                        });

                        container.runInScope(() => {
                            myService2 = container.get<MyServiceInterface>(DI.MY_SERVICE);
                        });

                        // Assert
                        expect(myService1).toBeDefined();
                        expect(myService2).toBeDefined();
                        expect(myService1).not.toBe(myService2);
                        expect(factoryCalls).toHaveBeenCalledTimes(2);
                    });
                });
            });
        });
    });

    describe('When a class is registered', () => {
        describe('When the class has dependencies', () => {
            it('should return the instance with the resolved dependencies', () => {
                // Arrange
                container.bind(DI.DEP1).toValue('dependency1');
                container.bind(DI.DEP2).toValue(42);
                container.bind(DI.CLASS_WITH_DEPENDENCIES).toClass(MyServiceClass, [DI.DEP1, DI.DEP2]);

                // Act
                const myService = container.get<MyServiceClassInterface>(DI.CLASS_WITH_DEPENDENCIES);

                // Assert
                expect(myService.runTask()).toBe('Executing with dep1: dependency1 and dep2: 42');
            });
        });

        describe('When the class has no dependency', () => {
            it('should just return the instance', () => {
                // Arrange
                container.bind(DI.CLASS_WITHOUT_DEPENDENCIES).toClass(MyServiceClassWithoutDependencies);

                // Act
                const myService = container.get<MyServiceClassInterface>(DI.CLASS_WITHOUT_DEPENDENCIES);

                // Assert
                expect(myService.runTask()).toBe('Executing without dependencies');
            });
        });

        describe('When the instance is retrieved twice', () => {
            describe('When the scope is not defined', () => {
                it('should return the same instance (singleton)', () => {
                    // Arrange
                    container.bind(DI.DEP1).toValue('dependency1');
                    container.bind(DI.DEP2).toValue(42);
                    container.bind(DI.CLASS_WITH_DEPENDENCIES).toClass(MyServiceClass, [DI.DEP1, DI.DEP2]);
                    const myService1 = container.get<MyServiceClassInterface>(DI.CLASS_WITH_DEPENDENCIES);

                    // Act
                    const myService2 = container.get<MyServiceClassInterface>(DI.CLASS_WITH_DEPENDENCIES);

                    // Assert
                    expect(myService1).toBe(myService2);
                });
            });

            describe('When the scope is defined to "singleton"', () => {
                it('should return the same instance', () => {
                    // Arrange
                    container.bind(DI.DEP1).toValue('dependency1');
                    container.bind(DI.DEP2).toValue(42);
                    container.bind(DI.CLASS_WITH_DEPENDENCIES).toClass(MyServiceClass, [DI.DEP1, DI.DEP2], 'singleton');
                    const myService1 = container.get<MyServiceClassInterface>(DI.CLASS_WITH_DEPENDENCIES);

                    // Act
                    const myService2 = container.get<MyServiceClassInterface>(DI.CLASS_WITH_DEPENDENCIES);

                    // Assert
                    expect(myService1).toBe(myService2);
                });
            });

            describe('When the scope is defined to "transient"', () => {
                it('should return a new instance each time', () => {
                    // Arrange
                    container.bind(DI.DEP1).toValue('dependency1');
                    container.bind(DI.DEP2).toValue(42);
                    container.bind(DI.CLASS_WITH_DEPENDENCIES).toClass(MyServiceClass, [DI.DEP1, DI.DEP2], 'transient');

                    // Act
                    const myService1 = container.get<MyServiceClassInterface>(DI.CLASS_WITH_DEPENDENCIES);
                    const myService2 = container.get<MyServiceClassInterface>(DI.CLASS_WITH_DEPENDENCIES);

                    // Assert
                    expect(myService1).not.toBe(myService2);
                });
            });

            describe('When the scope is defined to "scoped"', () => {
                it('should return the same instance within the same scope', () => {
                    // Arrange
                    container.bind(DI.DEP1).toValue('dependency1');
                    container.bind(DI.DEP2).toValue(42);
                    container.bind(DI.CLASS_WITH_DEPENDENCIES).toClass(MyServiceClass, [DI.DEP1, DI.DEP2], 'scoped');

                    // Act
                    container.runInScope(() => {
                        const myService1 = container.get<MyServiceClassInterface>(DI.CLASS_WITH_DEPENDENCIES);
                        const myService2 = container.get<MyServiceClassInterface>(DI.CLASS_WITH_DEPENDENCIES);

                        // Assert
                        expect(myService1).toBe(myService2);
                    });
                });

                it('should return different instances in different scopes', () => {
                    // Arrange
                    container.bind(DI.DEP1).toValue('dependency1');
                    container.bind(DI.DEP2).toValue(42);
                    container.bind(DI.CLASS_WITH_DEPENDENCIES).toClass(MyServiceClass, [DI.DEP1, DI.DEP2], 'scoped');

                    // Act
                    let myService1: MyServiceClassInterface | undefined;
                    let myService2: MyServiceClassInterface | undefined;

                    container.runInScope(() => {
                        myService1 = container.get<MyServiceClassInterface>(DI.CLASS_WITH_DEPENDENCIES);
                    });

                    container.runInScope(() => {
                        myService2 = container.get<MyServiceClassInterface>(DI.CLASS_WITH_DEPENDENCIES);
                    });

                    // Assert
                    expect(myService1).toBeDefined();
                    expect(myService2).toBeDefined();
                    expect(myService1).not.toBe(myService2);
                });
            });

            describe('When a scoped dependency is resolved outside of a scope', () => {
                it('should throw an error', () => {
                    // Arrange
                    container.bind(DI.CLASS_WITH_DEPENDENCIES).toClass(MyServiceClass, [DI.DEP1, DI.DEP2], 'scoped');

                    // Act & Assert
                    expect(() => container.get<MyServiceClassInterface>(DI.CLASS_WITH_DEPENDENCIES))
                        .toThrowError(`Cannot resolve scoped binding outside of a scope: ${DI.CLASS_WITH_DEPENDENCIES.toString()}`);
                });
            });
        });
    });

    describe('When no dependency has been registered', () => {
        it('should throw an error', () => {
            // Act & Assert
            expect(() => container.get<string>(DI.NOT_REGISTERED_VALUE))
                .toThrowError(`No binding found for key: ${DI.NOT_REGISTERED_VALUE.toString()}`);
        });
    });

    describe('When a module is loaded', () => {
        it('should return all module dependencies', () => {
            // Arrange
            const myModule = createModule();
            myModule.bind(DI.SIMPLE_FUNCTION).toFunction(sayHelloWorld);
            container.load(Symbol('myModule'), myModule);

            // Act
            const sayHello = container.get<SayHelloType>(DI.SIMPLE_FUNCTION);

            // Assert
            expect(sayHello()).toBe('hello world');
        });

        describe('When a dependency of the module is registered in another module', () => {
            it('should correctly resolve all dependencies', () => {
                // Arrange
                const module1 = createModule();
                module1.bind(DI.DEP1).toValue('dependency1');

                const module2 = createModule();
                module2.bind(DI.DEP2).toValue(42);

                const module3 = createModule();
                module3.bind(DI.MY_SERVICE).toHigherOrderFunction(MyService, {dep1: DI.DEP1, dep2: DI.DEP2});

                container.load(Symbol('module1'), module1);
                container.load(Symbol('module2'), module2);
                container.load(Symbol('module3'), module3);

                // Act
                const myService = container.get<MyServiceInterface>(DI.MY_SERVICE);

                // Assert
                expect(myService.runTask()).toBe('Executing with dep1: dependency1 and dep2: 42');
            });

            it('should take the last registered values', () => {
                // Arrange
                const module1 = createModule();
                module1.bind(DI.DEP1).toValue('OLD dependency1');
                module1.bind(DI.MY_SERVICE).toFunction(sayHelloWorld);

                const module2 = createModule();
                module2.bind(DI.DEP1).toValue('NEW dependency1');

                const module3 = createModule();
                module3.bind(DI.MY_SERVICE).toHigherOrderFunction(MyService, {dep1: DI.DEP1, dep2: DI.DEP2});

                container.bind(DI.DEP2).toValue(42);
                container.load(Symbol('module1'), module1);
                container.load(Symbol('module2'), module2);
                container.load(Symbol('module3'), module3);

                // Act
                const myService = container.get<MyServiceInterface>(DI.MY_SERVICE);

                // Assert
                expect(myService.runTask()).toBe('Executing with dep1: NEW dependency1 and dep2: 42');
            });
        });
    });

    describe('When a module is unloaded', () => {
        describe('When another module has this dependency already registered', () => {
            it('should use the existing dependency', () => {
                // Arrange
                const MODULE1 = Symbol('myModule1');
                const MODULE2 = Symbol('myModule2');

                const module1 = createModule();
                module1.bind(DI.SIMPLE_FUNCTION).toFunction(() => {
                    return 'module 1 hello world';
                });
                container.load(MODULE1, module1);

                const module2 = createModule();
                module2.bind(DI.SIMPLE_FUNCTION).toFunction(sayHelloWorld);
                container.load(MODULE2, module2);

                const sayHelloBeforeUnload = container.get<SayHelloType>(DI.SIMPLE_FUNCTION);
                expect(sayHelloBeforeUnload()).toBe('hello world');

                // Act
                container.unload(MODULE2);

                // Assert
                const sayHelloAfterUnload = container.get<SayHelloType>(DI.SIMPLE_FUNCTION);
                expect(sayHelloAfterUnload()).toBe('module 1 hello world');
            });
        });

        describe('When no other module has this dependency already registered', () => {
            it('should remove all its dependencies', () => {
                // Arrange
                const MY_MODULE = Symbol('myModule');

                const module = createModule();
                module.bind(DI.SIMPLE_FUNCTION).toFunction(sayHelloWorld);
                container.load(MY_MODULE, module);

                const sayHelloBeforeUnload = container.get<SayHelloType>(DI.SIMPLE_FUNCTION);
                expect(sayHelloBeforeUnload()).toBe('hello world');

                // Act
                container.unload(MY_MODULE);

                // Assert
                expect(() => container.get<SayHelloType>(DI.SIMPLE_FUNCTION))
                    .toThrowError(`No binding found for key: ${DI.SIMPLE_FUNCTION.toString()}`);
            });
        });
    });

    describe('When an unknown scope is used during binding', () => {
        it('should throw an error', () => {
            // Arrange
            container.bind(DI.MY_SERVICE).toFunction(sayHelloWorld, 'unknown' as any);

            // Act & Assert
            expect(() => container.get<SayHelloType>(DI.MY_SERVICE))
                .toThrowError('Unknown scope: unknown');
        });
    });
});
