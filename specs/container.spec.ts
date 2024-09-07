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
import {MyServiceWithDependencyArray} from "./MyServiceWithDependencyArray";

describe('Container', () => {

    let container: Container;

    beforeEach(() => {
        container = createContainer();
    });

    describe('When a function is registered using a symbol', () => {
        it('should return the associated function', () => {
            // Arrange
            container.bind(DI.HELLO_WORLD).toFunction(sayHelloWorld);

            // Act
            const sayHello = container.get<SayHelloType>(DI.HELLO_WORLD);

            // Assert
            expect(sayHello()).toBe('hello world');
        });

        describe('When the function with dependency array is used', () => {
            it('should resolve all its dependencies', () => {
                // Arrange
                container.bind(DI.DEP1).toValue('dependency1');
                container.bind(DI.DEP2).toValue(42);

                container.bind(DI.MY_SERVICE_WITH_DEPENDENCY_ARRAY).toFunction(MyServiceWithDependencyArray, [DI.DEP1, DI.DEP2]);

                // Act
                const myService = container.get<MyServiceInterface>(DI.MY_SERVICE_WITH_DEPENDENCY_ARRAY);

                // Assert
                expect(myService.runTask()).toBe('Executing with dep1: dependency1 and dep2: 42');
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
                container.bind(DI.HELLO_WORLD).toFunction(sayHelloWorld);

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
                        sayHello: container.get<SayHelloType>(DI.HELLO_WORLD)
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
        it('should return the associated function', () => {
            // Arrange
            container.bind(DI.DEP1).toValue('dependency1');
            container.bind(DI.DEP2).toValue(42);
            container.bind(DI.MY_SERVICE_CLASS).toClass(MyServiceClass, [DI.DEP1, DI.DEP2]);

            // Act
            const myService = container.get<MyServiceClassInterface>(DI.MY_SERVICE_CLASS);

            // Assert
            expect(myService.runTask()).toBe('Executing with dep1: dependency1 and dep2: 42');
        });

        describe('When the dependency is retrieved twice', () => {
            it('should return the same instance', () => {
                // Arrange
                container.bind(DI.DEP1).toValue('dependency1');
                container.bind(DI.DEP2).toValue(42);
                container.bind(DI.MY_SERVICE_CLASS).toClass(MyServiceClass, [DI.DEP1, DI.DEP2]);
                const myService1 = container.get<MyServiceClassInterface>(DI.MY_SERVICE_CLASS);

                // Act
                const myService2 = container.get<MyServiceClassInterface>(DI.MY_SERVICE_CLASS);

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