import {MyService} from "./MyService";
import {MyServiceInterface} from "./MyServiceInterface";
import {SayHelloType} from "./SayHelloType";
import {sayHelloWorld} from "./sayHelloWorld";
import {MyUseCase} from "./MyUseCase";
import {MyUseCaseInterface} from "./MyUseCaseInterface";
import {LoggerInterface} from "./LoggerInterface";
import {DI} from "./DI";
import {Container, createContainer} from "../src";
import {MyServiceClass} from "./MyServiceClass";
import {MyServiceClassInterface} from "./MyServiceClassInterface";
import {FunctionWithDependencies} from "./FunctionWithDependencies";
import {HigherOrderFunctionWithoutDependencies} from "./HigherOrderFunctionWithoutDependencies";
import {ServiceWithoutDependencyInterface} from "./ServiceWithoutDependencyInterface";
import {MyServiceClassWithoutDependencies} from "./MyServiceClassWithoutDependencies";

describe('Container', () => {

    let container: Container;

    beforeEach(() => {
        container = createContainer();
    });

    describe('When a function is registered using a symbol', () => {
        it('should return the associated function', () => {
            // Arrange
            container.bind(DI.SIMPLE_FUNCTION).toFunction(sayHelloWorld);

            // Act
            const sayHello = container.get<SayHelloType>(DI.SIMPLE_FUNCTION);

            // Assert
            expect(sayHello()).toBe('hello world');
        });

        describe('When the function with dependency array is used', () => {
            it('should resolve all its dependencies', () => {
                // Arrange
                container.bind(DI.DEP1).toValue('dependency1');
                container.bind(DI.DEP2).toValue(42);

                container.bind(DI.HIGHER_ORDER_FUNCTION_WITH_DEPENDENCIES)
                    .toHigherOrderFunction(FunctionWithDependencies, [DI.DEP1, DI.DEP2]);

                // Act
                const myService = container.get<MyServiceInterface>(DI.HIGHER_ORDER_FUNCTION_WITH_DEPENDENCIES);

                // Assert
                expect(myService.runTask()).toBe('Executing with dep1: dependency1 and dep2: 42');
            });
        });

        describe('When the function with dependency empty array is used', () => {
            it('should consider the function as an higher order function', () => {
                // Arrange
                container.bind(DI.DEP1).toValue('dependency1');
                container.bind(DI.HIGHER_ORDER_FUNCTION_WITHOUT_DEPENDENCIES)
                    .toHigherOrderFunction(HigherOrderFunctionWithoutDependencies);

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
        });

        describe('When the dependency has dependencies', () => {
            it('should resolve all its dependencies using the factory', () => {
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

                const fakeLogger: LoggerInterface = {
                    log: vi.fn()
                }
                container.bind(DI.LOGGER).toValue(fakeLogger);

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
                expect(fakeLogger.log).toHaveBeenCalledTimes(2);
                expect(fakeLogger.log).toHaveBeenCalledWith('Executing with dep1: dependency1 and dep2: 42');
                expect(fakeLogger.log).toHaveBeenCalledWith('hello world');
            });
        });

        describe('When the dependency is retrieved twice', () => {
            it('should return the same instance', () => {
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
    });

    describe('When a class is registered using a symbol', () => {
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
            it('should return the instance', () => {
                // Arrange
                container.bind(DI.DEP1).toValue('dependency1');
                container.bind(DI.DEP2).toValue(42);
                container.bind(DI.CLASS_WITHOUT_DEPENDENCIES).toClass(MyServiceClassWithoutDependencies);

                // Act
                const myService = container.get<MyServiceClassInterface>(DI.CLASS_WITHOUT_DEPENDENCIES);

                // Assert
                expect(myService.runTask()).toBe('Executing without dependencies');
            });
        });

        describe('When the dependency is retrieved twice', () => {
            it('should return the same instance', () => {
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
    });

    describe('When no dependency has been registered for a given dependency', () => {
        it('should throw an error', () => {
            // Act & Assert
            expect(() => container.get<string>(DI.NOT_REGISTERED_VALUE))
                .toThrowError(`No binding found for key: ${DI.NOT_REGISTERED_VALUE.toString()}`);
        });
    });
});