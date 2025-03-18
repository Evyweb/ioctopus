import {Container, createContainer, ExtractServiceRegistryType, Scope} from "../src";
import {serviceRegistry} from "./examples/DI";
import {Mock, vi} from "vitest";
import {MyServiceClass} from "./examples/Classes";
import {CurriedFunctionWithDependencies, MyServiceClassInterface, MyServiceInterface} from "./examples/types";
import {curriedFunctionWithDependencyObject} from "./examples/Currying";
import {HigherOrderFunctionWithDependencyObject} from "./examples/HigherOrderFunctions";

describe('Scope', () => {

    let container: Container<ExtractServiceRegistryType<typeof serviceRegistry>>;
    let factoryCalls: Mock;

    beforeEach(() => {
        container = createContainer(serviceRegistry);
        container.bind('DEP1').toValue('dependency1');
        container.bind('DEP2').toValue(42);
        factoryCalls = vi.fn();
    });

    describe('Factories', () => {

        describe.each([
            {scope: undefined},
            {scope: 'singleton'},
        ])('When the scope is default or defined to "singleton"', ({scope}) => {
            it('should return the same instance', () => {
                // Arrange
                container.bind('MY_SERVICE').toFactory(() => {
                    factoryCalls();
                    return HigherOrderFunctionWithDependencyObject({
                        dep1: container.get<string>(serviceRegistry.get('DEP1')),
                        dep2: container.get<number>(serviceRegistry.get('DEP2'))
                    });
                }, scope as Scope);

                const myService1 = container.get<MyServiceInterface>(serviceRegistry.get('MY_SERVICE'));

                // Act
                const myService2 = container.get<MyServiceInterface>(serviceRegistry.get('MY_SERVICE'));

                // Assert
                expect(myService1).toBe(myService2);
                expect(factoryCalls).toHaveBeenCalledTimes(1);
            });
        });

        describe('When the scope is defined to "transient"', () => {
            it('should return a new instance each time', () => {
                // Arrange
                container.bind('MY_SERVICE').toFactory(() => {
                    factoryCalls();
                    return HigherOrderFunctionWithDependencyObject({
                        dep1: container.get<string>(serviceRegistry.get('DEP1')),
                        dep2: container.get<number>(serviceRegistry.get('DEP2'))
                    });
                }, 'transient');

                const myService1 = container.get<MyServiceInterface>(serviceRegistry.get('MY_SERVICE'));

                // Act
                const myService2 = container.get<MyServiceInterface>(serviceRegistry.get('MY_SERVICE'));

                // Assert
                expect(myService1).not.toBe(myService2);
                expect(factoryCalls).toHaveBeenCalledTimes(2);
            });
        });

        describe('When the scope is defined to "scoped"', () => {
            it('should return the same instance within the same scope', () => {
                // Arrange
                container.bind('DEP1').toValue('dependency1');
                container.bind('DEP2').toValue(42);
                container.bind('MY_SERVICE').toFactory(() => {
                    factoryCalls();
                    return HigherOrderFunctionWithDependencyObject({
                        dep1: container.get<string>(serviceRegistry.get('DEP1')),
                        dep2: container.get<number>(serviceRegistry.get('DEP2'))
                    });
                }, 'scoped');

                let myService1: MyServiceInterface | undefined;
                let myService2: MyServiceInterface | undefined;

                // Act
                container.runInScope(() => {
                    myService1 = container.get<MyServiceInterface>(serviceRegistry.get('MY_SERVICE'));
                    myService2 = container.get<MyServiceInterface>(serviceRegistry.get('MY_SERVICE'));
                });

                // Assert
                expect(myService1).toBeDefined();
                expect(myService2).toBeDefined();
                expect(myService1).toBe(myService2);
                expect(factoryCalls).toHaveBeenCalledTimes(1);
            });

            it('should return different instances in different scopes', () => {
                // Arrange
                container.bind('MY_SERVICE').toFactory(() => {
                    factoryCalls();
                    return HigherOrderFunctionWithDependencyObject({
                        dep1: container.get<string>(serviceRegistry.get('DEP1')),
                        dep2: container.get<number>(serviceRegistry.get('DEP2'))
                    });
                }, 'scoped');

                let myService1: MyServiceInterface | undefined;
                let myService2: MyServiceInterface | undefined;

                container.runInScope(() => {
                    myService1 = container.get<MyServiceInterface>(serviceRegistry.get('MY_SERVICE'));
                });

                // Act
                container.runInScope(() => {
                    myService2 = container.get<MyServiceInterface>(serviceRegistry.get('MY_SERVICE'));
                });

                // Assert
                expect(myService1).toBeDefined();
                expect(myService2).toBeDefined();
                expect(myService1).not.toBe(myService2);
                expect(factoryCalls).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('Classes', () => {

        describe.each([
            {scope: undefined},
            {scope: 'singleton'},
        ])('When the scope is default or defined to "singleton"', ({scope}) => {
            it('should return the same instance', () => {
                // Arrange
                container.bind('MY_SERVICE').toClass(MyServiceClass, [serviceRegistry.get('DEP1'),serviceRegistry.get('DEP2')], scope as Scope);

                const myService1 = container.get<MyServiceInterface>(serviceRegistry.get('MY_SERVICE'));

                // Act
                const myService2 = container.get<MyServiceInterface>(serviceRegistry.get('MY_SERVICE'));

                // Assert
                expect(myService1).toBe(myService2);
            });
        });

        describe('When the scope is defined to "transient"', () => {
            it('should return a new instance each time', () => {
                // Arrange
                container.bind('MY_SERVICE').toClass(MyServiceClass, [serviceRegistry.get('DEP1'),serviceRegistry.get('DEP2')], 'transient');

                const myService1 = container.get<MyServiceInterface>(serviceRegistry.get('MY_SERVICE'));

                // Act
                const myService2 = container.get<MyServiceInterface>(serviceRegistry.get('MY_SERVICE'));

                // Assert
                expect(myService1).not.toBe(myService2);
            });
        });
    });

    describe('Higher order functions', () => {

        describe.each([
            {scope: undefined},
            {scope: 'singleton'},
        ])('When the scope is default or defined to "singleton"', ({scope}) => {
            it('should return the same instance', () => {
                // Arrange
                container.bind('MY_SERVICE')
                    .toHigherOrderFunction(HigherOrderFunctionWithDependencyObject, {dep1: serviceRegistry.get('DEP1'), dep2: serviceRegistry.get('DEP2')}, scope as Scope);

                const myService1 = container.get<MyServiceInterface>(serviceRegistry.get('MY_SERVICE'));

                // Act
                const myService2 = container.get<MyServiceInterface>(serviceRegistry.get('MY_SERVICE'));

                // Assert
                expect(myService1).toBe(myService2);
            });
        });

        describe('When the scope is defined to "transient"', () => {
            it('should return a new instance each time', () => {
                // Arrange
                container.bind('MY_SERVICE')
                    .toHigherOrderFunction(HigherOrderFunctionWithDependencyObject, {dep1: serviceRegistry.get('DEP1'), dep2: serviceRegistry.get('DEP2')}, 'transient');

                const myService1 = container.get<MyServiceInterface>(serviceRegistry.get('MY_SERVICE'));

                // Act
                const myService2 = container.get<MyServiceInterface>(serviceRegistry.get('MY_SERVICE'));

                // Assert
                expect(myService1).not.toBe(myService2);
            });
        });
    });

    describe('Curry', () => {

        describe.each([
            {scope: undefined},
            {scope: 'singleton'},
        ])('When the scope is default or defined to "singleton"', ({scope}) => {
            it('should return the same instance', () => {
                // Arrange
                container.bind('MY_SERVICE')
                    .toCurry(curriedFunctionWithDependencyObject, {dep1: serviceRegistry.get('DEP1'), dep2: serviceRegistry.get('DEP2')}, scope as Scope);

                const myService1 = container.get<CurriedFunctionWithDependencies>(serviceRegistry.get('MY_SERVICE'));

                // Act
                const myService2 = container.get<CurriedFunctionWithDependencies>(serviceRegistry.get('MY_SERVICE'));

                // Assert
                expect(myService1).toBe(myService2);
            });
        });

        describe('When the scope is defined to "transient"', () => {
            it('should return a new instance each time', () => {
                // Arrange
                container.bind('MY_SERVICE')
                    .toCurry(curriedFunctionWithDependencyObject, {dep1: serviceRegistry.get('DEP1'), dep2: serviceRegistry.get('DEP2')}, 'transient');

                const myService1 = container.get<CurriedFunctionWithDependencies>(serviceRegistry.get('MY_SERVICE'));

                // Act
                const myService2 = container.get<CurriedFunctionWithDependencies>(serviceRegistry.get('MY_SERVICE'));

                // Assert
                expect(myService1).not.toBe(myService2);
            });
        });
    });

    describe('When a scoped dependency is resolved outside of a scope', () => {
        it('should throw an error', () => {
            // Arrange
            container.bind('MY_SERVICE')
                .toHigherOrderFunction(HigherOrderFunctionWithDependencyObject, {dep1: serviceRegistry.get('DEP1'), dep2: serviceRegistry.get('DEP2')}, 'scoped');

            // Act & Assert
            expect(() => container.get<MyServiceInterface>(serviceRegistry.get('MY_SERVICE')))
                .toThrowError(`Cannot resolve scoped binding outside of a scope: ${serviceRegistry.get('MY_SERVICE').toString()}`);
        });
    });

    describe('When an unknown scope is used during binding', () => {
        it('should throw an error', () => {
            // Arrange
            container.bind('MY_SERVICE').toClass(MyServiceClass, [], 'unknown' as any);

            // Act & Assert
            expect(() => container.get<MyServiceClassInterface>(serviceRegistry.get('MY_SERVICE')))
                .toThrowError('Unknown scope: unknown');
        });
    });
});
