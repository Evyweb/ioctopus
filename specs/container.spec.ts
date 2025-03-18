import {serviceRegistry} from "./examples/DI";
import {Container, createContainer, ExtractServiceRegistryKeys, ExtractServiceRegistryType} from "../src";
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

    let container: Container<ExtractServiceRegistryType<typeof serviceRegistry>>;

    beforeEach(() => {
        container = createContainer(serviceRegistry);
    });

    describe.each([
        // [{ key: serviceRegistry.get('DEP1'), value: 'dependency1' }],
        // TODO: Consider to support string as identiifer, Currently Support only key as string, to get actual symbol value
        [{ key: 'DEP1', value: 'dependency1' }],
    ])('toValue()', ({key, value}) => {
        it(`should return the associated value of key: ${key.toString()}`, () => {

            // Arrange
            container.bind(key as ExtractServiceRegistryKeys<typeof serviceRegistry>).toValue(value);

            // Act
            const result = container.get(key as ExtractServiceRegistryKeys<typeof serviceRegistry>);

            // Assert
            expect(result).toBe(value);
        });
    });

    describe('toFunction()', () => {
        it('should return the associated function', () => {
            // Arrange
            container.bind('SIMPLE_FUNCTION').toFunction(sayHelloWorld);

            // Act
            const sayHello = container.get('SIMPLE_FUNCTION');

            // Assert
            expect(sayHello()).toBe('hello world');
        });
    });

    describe('toHigherOrderFunction()', () => {
        describe('When the higher order function has dependencies', () => {
            beforeEach(() => {
                container.bind('DEP1').toValue('dependency1');
                container.bind('DEP2').toValue(42);
            });

            describe('When the dependencies are defined in an array', () => {
                it('should return the function with all its dependencies resolved', () => {
                    // Arrange
                    container.bind('HIGHER_ORDER_FUNCTION_WITH_DEPENDENCIES')
                        .toHigherOrderFunction(HigherOrderFunctionWithDependencies, ['DEP1', 'DEP2']);

                    // Act
                    const myService = container.get('HIGHER_ORDER_FUNCTION_WITH_DEPENDENCIES');

                    // Assert
                    expect(myService.runTask()).toBe('Executing with dep1: dependency1 and dep2: 42');
                });
            });

            describe('When the dependencies are defined in an object', () => {
                it('should return the function with all its dependencies resolved', () => {
                    // Arrange
                    container.bind('MY_SERVICE')
                        .toHigherOrderFunction(HigherOrderFunctionWithDependencyObject, {
                            dep1: serviceRegistry.get('DEP1'),
                            dep2: serviceRegistry.get('DEP2')
                        });

                    // Act
                    const myService = container.get('MY_SERVICE');

                    // Assert
                    expect(myService.runTask()).toBe('Executing with dep1: dependency1 and dep2: 42');
                });
            });

            describe('When the dependencies are defined in an other format', () => {
                it('should throw an error', () => {
                    // Act
                    const expectCall = expect(() => {
                        container.bind('HIGHER_ORDER_FUNCTION_WITH_DEPENDENCIES')
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
                container.bind('DEP1').toValue('dependency1');
                container.bind('HIGHER_ORDER_FUNCTION_WITHOUT_DEPENDENCIES')
                    .toHigherOrderFunction(HigherOrderFunctionWithoutDependency, dependencies as any);

                // Act
                const myService = container.get<ServiceWithoutDependencyInterface>(serviceRegistry.get('HIGHER_ORDER_FUNCTION_WITHOUT_DEPENDENCIES'));

                // Assert
                expect(myService.run()).toBe('OtherService');
            });
        });
    });

    describe('toCurry()', () => {
        describe('When the function has dependencies', () => {
            beforeEach(() => {
                container.bind('DEP1').toValue('dependency1');
                container.bind('DEP2').toValue(42);
            });

            describe('When the dependencies are defined in an array', () => {
                it('should return the function with all its dependencies resolved', () => {
                    // Arrange
                    container.bind('CURRIED_FUNCTION_WITH_DEPENDENCIES')
                        .toCurry(curriedFunctionWithDependencies, ['DEP1']);

                    // Act
                    const myService = container.get<CurriedFunctionWithDependencies>(serviceRegistry.get('CURRIED_FUNCTION_WITH_DEPENDENCIES'));

                    // Assert
                    expect(myService('curry')).toBe('Hello curry with dependency1');
                });
            });

            describe('When the dependencies are defined in an object', () => {
                it('should return the function with all its dependencies resolved', () => {
                    // Arrange
                    container.bind('CURRIED_FUNCTION_WITH_DEPENDENCIES_OBJECT')
                        .toCurry(curriedFunctionWithDependencyObject, {dep1: serviceRegistry.get('DEP1'), dep2: serviceRegistry.get('DEP2')});

                    // Act
                    const myService = container.get<CurriedFunctionWithDependencies>(serviceRegistry.get('CURRIED_FUNCTION_WITH_DEPENDENCIES_OBJECT'));

                    // Assert
                    expect(myService('curry')).toBe('Hello curry with dependency1 and 42');
                });
            });

            describe('When the dependencies are defined in an other format', () => {
                it('should throw an error', () => {
                    // Act
                    const expectCall = expect(() => container.bind('CURRIED_FUNCTION_WITH_DEPENDENCIES')
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
                container.bind('DEP1').toValue('dependency1');
                container.bind('CURRIED_FUNCTION_WITHOUT_DEPENDENCIES')
                    .toCurry(curriedFunctionWithoutDependencies, dependencies);

                // Act
                const myService = container.get<CurriedFunctionWithoutDependencies>(serviceRegistry.get('CURRIED_FUNCTION_WITHOUT_DEPENDENCIES'));

                // Assert
                expect(myService()).toBe('OtherService');
            });
        });
    });

    describe('toFactory()', () => {
        it('should resolve all its dependencies', () => {
            // Arrange
            container.bind('DEP1').toValue('dependency1');
            container.bind('DEP2').toValue(42);

            container.bind('MY_SERVICE').toFactory(() => {
                return HigherOrderFunctionWithDependencyObject({
                    dep1: container.get<string>(serviceRegistry.get('DEP1')),
                    dep2: container.get<number>(serviceRegistry.get('DEP2'))
                });
            });

            // Act
            const myService = container.get<MyServiceInterface>(serviceRegistry.get('MY_SERVICE'));

            // Assert
            expect(myService.runTask()).toBe('Executing with dep1: dependency1 and dep2: 42');
        });

        describe('When the dependency has dependencies', () => {
            it('should return the dependency with all its dependencies resolved', () => {
                // Arrange
                container.bind('DEP1').toValue('dependency1');
                container.bind('DEP2').toValue(42);
                container.bind('SIMPLE_FUNCTION').toFunction(sayHelloWorld);

                container.bind('MY_SERVICE').toFactory(() => {
                    return HigherOrderFunctionWithDependencyObject({
                        dep1: container.get<string>(serviceRegistry.get('DEP1')),
                        dep2: container.get<number>(serviceRegistry.get('DEP2'))
                    });
                });

                container.bind('LOGGER').toValue(mock<LoggerInterface>());

                container.bind('MY_USE_CASE').toFactory(() => {
                    return UseCase({
                        myService: container.get<MyServiceInterface>(serviceRegistry.get('MY_SERVICE')),
                        logger: container.get<LoggerInterface>(serviceRegistry.get('LOGGER')),
                        sayHello: container.get<SayHelloType>(serviceRegistry.get('SIMPLE_FUNCTION'))
                    });
                });

                // Act
                const myUseCase = container.get<MyUseCaseInterface>(serviceRegistry.get('MY_USE_CASE'));

                // Assert
                expect(myUseCase.execute()).toBe('Executing with dep1: dependency1 and dep2: 42');

                const fakeLogger = container.get<MockProxy<LoggerInterface>>(serviceRegistry.get('LOGGER'));
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
                    container.bind('DEP1').toValue('dependency1');
                    container.bind('DEP2').toValue(42);
                    container.bind('CLASS_WITH_DEPENDENCIES').toClass(MyServiceClass, [serviceRegistry.get('DEP1'), serviceRegistry.get('DEP2')]);

                    // Act
                    const myService = container.get<MyServiceClassInterface>(serviceRegistry.get('CLASS_WITH_DEPENDENCIES'));

                    // Assert
                    expect(myService.runTask()).toBe('Executing with dep1: dependency1 and dep2: 42');
                });
            });

            describe('When the dependencies are defined in an object', () => {
                it('should return the instance with the resolved dependencies', () => {
                    // Arrange
                    container.bind('DEP1').toValue('dependency1');
                    container.bind('DEP2').toValue(42);
                    container.bind('CLASS_WITH_DEPENDENCIES').toClass(MyServiceClassWithDependencyObject, {
                        dep1: serviceRegistry.get('DEP1'),
                        dep2: serviceRegistry.get('DEP2')
                    });

                    // Act
                    const myService = container.get<MyServiceClassInterface>(serviceRegistry.get('CLASS_WITH_DEPENDENCIES'));

                    // Assert
                    expect(myService.runTask()).toBe('Executing with dep1: dependency1 and dep2: 42');
                });
            });

            describe('When the dependencies are defined in an other format', () => {
                it('should throw an error', () => {
                    // Arrange
                    container.bind('DEP1').toValue('dependency1');
                    container.bind('DEP2').toValue(42);

                    // Act
                    const expectCall = expect(() => {
                        container.bind('CLASS_WITH_DEPENDENCIES')
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
                container.bind('CLASS_WITHOUT_DEPENDENCIES').toClass(MyServiceClassWithoutDependencies);

                // Act
                const myService = container.get<MyServiceClassInterface>(serviceRegistry.get('CLASS_WITHOUT_DEPENDENCIES'));

                // Assert
                expect(myService.runTask()).toBe('Executing without dependencies');
            });
        });
    });

    describe('When a dependency is missing', () => {
        it('should throw an error', () => {
            // Act
            const expectCall = expect(() => container.get<string>(serviceRegistry.get('NOT_REGISTERED_VALUE')));

            // Assert
            expectCall.toThrowError(`No binding found for key: ${serviceRegistry.get('NOT_REGISTERED_VALUE').toString()}`);
        });
    });

    describe('When a circular dependency is detected', () => {
        it('should throw an error', () => {
            // Arrange
            const container = createContainer(serviceRegistry);

            container.bind('CIRCULAR_A').toClass(ClassA, [serviceRegistry.get('CIRCULAR_B')]);
            container.bind('CIRCULAR_B').toClass(ClassB, [serviceRegistry.get('CIRCULAR_A')]);

            // Act
            const expectCall = expect(() => container.get(serviceRegistry.get('CIRCULAR_A')));

            // Assert
            expectCall.toThrowError(/Circular dependency detected: Symbol\(CIRCULAR_A\) -> Symbol\(CIRCULAR_B\) -> Symbol\(CIRCULAR_A\)/);
        });
    });
});
