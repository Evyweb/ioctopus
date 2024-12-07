import {DI} from "./examples/DI";
import {Container, createContainer} from "../src";
import {mock, MockProxy} from "vitest-mock-extended";
import {
    MyServiceClass,
    MyServiceClassWithDependencyObject,
    MyServiceClassWithoutDependencies
} from "./examples/Classes";
import {
    CurriedFunctionWithDependencies,
    CurriedFunctionWithoutDependencies,
    LoggerInterface,
    MyServiceClassInterface,
    MyServiceInterface,
    MyUseCaseInterface,
    SayHelloType,
    ServiceWithoutDependencyInterface
} from "./examples/types";
import {
    curriedFunctionWithDependencies,
    curriedFunctionWithDependencyObject,
    curriedFunctionWithoutDependencies
} from "./examples/Currying";
import {
    HigherOrderFunctionWithDependencies,
    HigherOrderFunctionWithDependencyObject,
    HigherOrderFunctionWithoutDependency
} from "./examples/HigherOrderFunctions";
import {sayHelloWorld} from "./examples/SimpleFunctions";
import {ClassA, ClassB} from "./examples/Circular";
import {UseCase} from "./examples/UseCase";

describe('Container', () => {

    let container: Container;

    beforeEach(() => {
        container = createContainer();
    });

    describe.each([
        [{ key: DI.DEP1, value: 'dependency1' }],
        [{ key: 'DEP1', value: 'dependency1' }],
    ])('toValue()', ({key, value}) => {
        it(`should return the associated value of key: ${key.toString()}`, () => {
            // Arrange
            container.bind(key).toValue(value);

            // Act
            const result = container.get<string>(key);

            // Assert
            expect(result).toBe(value);
        });
    });

    describe('toFunction()', () => {
        it('should return the associated function', () => {
            // Arrange
            container.bind(DI.SIMPLE_FUNCTION).toFunction(sayHelloWorld);

            // Act
            const sayHello = container.get<SayHelloType>(DI.SIMPLE_FUNCTION);

            // Assert
            expect(sayHello()).toBe('hello world');
        });
    });

    describe('toHigherOrderFunction()', () => {
        describe('When the higher order function has dependencies', () => {
            beforeEach(() => {
                container.bind(DI.DEP1).toValue('dependency1');
                container.bind(DI.DEP2).toValue(42);
            });

            describe('When the dependencies are defined in an array', () => {
                it('should return the function with all its dependencies resolved', () => {
                    // Arrange
                    container.bind(DI.HIGHER_ORDER_FUNCTION_WITH_DEPENDENCIES)
                        .toHigherOrderFunction(HigherOrderFunctionWithDependencies, [DI.DEP1, DI.DEP2]);

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
                        .toHigherOrderFunction(HigherOrderFunctionWithDependencyObject, {
                            dep1: DI.DEP1,
                            dep2: DI.DEP2
                        });

                    // Act
                    const myService = container.get<MyServiceInterface>(DI.MY_SERVICE);

                    // Assert
                    expect(myService.runTask()).toBe('Executing with dep1: dependency1 and dep2: 42');
                });
            });

            describe('When the dependencies are defined in an other format', () => {
                it('should throw an error', () => {
                    // Act
                    const expectCall = expect(() => {
                        container.bind(DI.HIGHER_ORDER_FUNCTION_WITH_DEPENDENCIES)
                            .toHigherOrderFunction(HigherOrderFunctionWithDependencies, 'invalid' as any)
                    });

                    // Assert
                    expectCall.toThrowError('Invalid dependencies type');
                });
            });
        });

        describe.each([
            {dependencies: undefined},
            {dependencies: []},
            {dependencies: {}},
        ])('When the higher order function has no dependencies', ({dependencies}) => {
            it('should just return the function', () => {
                // Arrange
                container.bind(DI.DEP1).toValue('dependency1');
                container.bind(DI.HIGHER_ORDER_FUNCTION_WITHOUT_DEPENDENCIES)
                    .toHigherOrderFunction(HigherOrderFunctionWithoutDependency, dependencies);

                // Act
                const myService = container.get<ServiceWithoutDependencyInterface>(DI.HIGHER_ORDER_FUNCTION_WITHOUT_DEPENDENCIES);

                // Assert
                expect(myService.run()).toBe('OtherService');
            });
        });
    });

    describe('toCurry()', () => {
        describe('When the function has dependencies', () => {
            beforeEach(() => {
                container.bind(DI.DEP1).toValue('dependency1');
                container.bind(DI.DEP2).toValue(42);
            });

            describe('When the dependencies are defined in an array', () => {
                it('should return the function with all its dependencies resolved', () => {
                    // Arrange
                    container.bind(DI.CURRIED_FUNCTION_WITH_DEPENDENCIES)
                        .toCurry(curriedFunctionWithDependencies, [DI.DEP1]);

                    // Act
                    const myService = container.get<CurriedFunctionWithDependencies>(DI.CURRIED_FUNCTION_WITH_DEPENDENCIES);

                    // Assert
                    expect(myService('curry')).toBe('Hello curry with dependency1');
                });
            });

            describe('When the dependencies are defined in an object', () => {
                it('should return the function with all its dependencies resolved', () => {
                    // Arrange
                    container.bind(DI.CURRIED_FUNCTION_WITH_DEPENDENCIES_OBJECT)
                        .toCurry(curriedFunctionWithDependencyObject, {dep1: DI.DEP1, dep2: DI.DEP2});

                    // Act
                    const myService = container.get<CurriedFunctionWithDependencies>(DI.CURRIED_FUNCTION_WITH_DEPENDENCIES_OBJECT);

                    // Assert
                    expect(myService('curry')).toBe('Hello curry with dependency1 and 42');
                });
            });

            describe('When the dependencies are defined in an other format', () => {
                it('should throw an error', () => {
                    // Act
                    const expectCall = expect(() => container.bind(DI.CURRIED_FUNCTION_WITH_DEPENDENCIES)
                        .toCurry(curriedFunctionWithoutDependencies, 'invalid' as any));

                    // Assert
                    expectCall.toThrowError('Invalid dependencies type');
                });
            });
        });

        describe.each([
            {dependencies: undefined},
            {dependencies: []},
            {dependencies: {}},
        ])('When the curried function has no dependencies', ({dependencies}) => {
            it('should just return the function', () => {
                // Arrange
                container.bind(DI.DEP1).toValue('dependency1');
                container.bind(DI.CURRIED_FUNCTION_WITHOUT_DEPENDENCIES)
                    .toCurry(curriedFunctionWithoutDependencies, dependencies);

                // Act
                const myService = container.get<CurriedFunctionWithoutDependencies>(DI.CURRIED_FUNCTION_WITHOUT_DEPENDENCIES);

                // Assert
                expect(myService()).toBe('OtherService');
            });
        });
    });

    describe('toFactory()', () => {
        it('should resolve all its dependencies', () => {
            // Arrange
            container.bind(DI.DEP1).toValue('dependency1');
            container.bind(DI.DEP2).toValue(42);

            container.bind(DI.MY_SERVICE).toFactory(() => {
                return HigherOrderFunctionWithDependencyObject({
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
                    return HigherOrderFunctionWithDependencyObject({
                        dep1: container.get<string>(DI.DEP1),
                        dep2: container.get<number>(DI.DEP2)
                    });
                });

                container.bind(DI.LOGGER).toValue(mock<LoggerInterface>());

                container.bind(DI.MY_USE_CASE).toFactory(() => {
                    return UseCase({
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
    });

    describe('toClass()', () => {
        describe('When the class has dependencies', () => {
            describe('When the dependencies are defined in an array', () => {
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

            describe('When the dependencies are defined in an object', () => {
                it('should return the instance with the resolved dependencies', () => {
                    // Arrange
                    container.bind(DI.DEP1).toValue('dependency1');
                    container.bind(DI.DEP2).toValue(42);
                    container.bind(DI.CLASS_WITH_DEPENDENCIES).toClass(MyServiceClassWithDependencyObject, {
                        dep1: DI.DEP1,
                        dep2: DI.DEP2
                    });

                    // Act
                    const myService = container.get<MyServiceClassInterface>(DI.CLASS_WITH_DEPENDENCIES);

                    // Assert
                    expect(myService.runTask()).toBe('Executing with dep1: dependency1 and dep2: 42');
                });
            });

            describe('When the dependencies are defined in an other format', () => {
                it('should throw an error', () => {
                    // Arrange
                    container.bind(DI.DEP1).toValue('dependency1');
                    container.bind(DI.DEP2).toValue(42);

                    // Act
                    const expectCall = expect(() => {
                        container.bind(DI.CLASS_WITH_DEPENDENCIES)
                            .toClass(MyServiceClassWithDependencyObject, 'invalid' as any);
                    });

                    // Assert
                    expectCall.toThrowError('Invalid dependencies type');
                });
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
    });

    describe('When a dependency is missing', () => {
        it('should throw an error', () => {
            // Act
            const expectCall = expect(() => container.get<string>(DI.NOT_REGISTERED_VALUE));

            // Assert
            expectCall.toThrowError(`No binding found for key: ${DI.NOT_REGISTERED_VALUE.toString()}`);
        });
    });

    describe('When a circular dependency is detected', () => {
        it('should throw an error', () => {
            // Arrange
            const container = createContainer();

            container.bind(DI.CIRCULAR_A).toClass(ClassA, [DI.CIRCULAR_B]);
            container.bind(DI.CIRCULAR_B).toClass(ClassB, [DI.CIRCULAR_A]);

            // Act
            const expectCall = expect(() => container.get(DI.CIRCULAR_A));

            // Assert
            expectCall.toThrowError(/Circular dependency detected: Symbol\(CIRCULAR_A\) -> Symbol\(CIRCULAR_B\) -> Symbol\(CIRCULAR_A\)/);
        });
    });
});
