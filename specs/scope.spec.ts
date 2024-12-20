import {Container, createContainer, Scope} from "../src";
import {DI} from "./examples/DI";
import {Mock, vi} from "vitest";
import {MyServiceClass} from "./examples/Classes";
import {CurriedFunctionWithDependencies, MyServiceClassInterface, MyServiceInterface} from "./examples/types";
import {curriedFunctionWithDependencyObject} from "./examples/Currying";
import {HigherOrderFunctionWithDependencyObject} from "./examples/HigherOrderFunctions";

describe('Scope', () => {

    let container: Container;
    let factoryCalls: Mock;

    beforeEach(() => {
        container = createContainer();
        container.bind(DI.DEP1).toValue('dependency1');
        container.bind(DI.DEP2).toValue(42);
        factoryCalls = vi.fn();
    });

    describe('Factories', () => {

        describe.each([
            {scope: undefined},
            {scope: 'singleton'},
        ])('When the scope is default or defined to "singleton"', ({scope}) => {
            it('should return the same instance', () => {
                // Arrange
                container.bind(DI.MY_SERVICE).toFactory(() => {
                    factoryCalls();
                    return HigherOrderFunctionWithDependencyObject({
                        dep1: container.get<string>(DI.DEP1),
                        dep2: container.get<number>(DI.DEP2)
                    });
                }, scope as Scope);

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
                container.bind(DI.MY_SERVICE).toFactory(() => {
                    factoryCalls();
                    return HigherOrderFunctionWithDependencyObject({
                        dep1: container.get<string>(DI.DEP1),
                        dep2: container.get<number>(DI.DEP2)
                    });
                }, 'transient');

                const myService1 = container.get<MyServiceInterface>(DI.MY_SERVICE);

                // Act
                const myService2 = container.get<MyServiceInterface>(DI.MY_SERVICE);

                // Assert
                expect(myService1).not.toBe(myService2);
                expect(factoryCalls).toHaveBeenCalledTimes(2);
            });
        });

        describe('When the scope is defined to "scoped"', () => {
            it('should return the same instance within the same scope', () => {
                // Arrange
                container.bind(DI.DEP1).toValue('dependency1');
                container.bind(DI.DEP2).toValue(42);
                container.bind(DI.MY_SERVICE).toFactory(() => {
                    factoryCalls();
                    return HigherOrderFunctionWithDependencyObject({
                        dep1: container.get<string>(DI.DEP1),
                        dep2: container.get<number>(DI.DEP2)
                    });
                }, 'scoped');

                let myService1: MyServiceInterface | undefined;
                let myService2: MyServiceInterface | undefined;

                // Act
                container.runInScope(() => {
                    myService1 = container.get<MyServiceInterface>(DI.MY_SERVICE);
                    myService2 = container.get<MyServiceInterface>(DI.MY_SERVICE);
                });

                // Assert
                expect(myService1).toBeDefined();
                expect(myService2).toBeDefined();
                expect(myService1).toBe(myService2);
                expect(factoryCalls).toHaveBeenCalledTimes(1);
            });

            it('should return different instances in different scopes', () => {
                // Arrange
                container.bind(DI.MY_SERVICE).toFactory(() => {
                    factoryCalls();
                    return HigherOrderFunctionWithDependencyObject({
                        dep1: container.get<string>(DI.DEP1),
                        dep2: container.get<number>(DI.DEP2)
                    });
                }, 'scoped');

                let myService1: MyServiceInterface | undefined;
                let myService2: MyServiceInterface | undefined;

                container.runInScope(() => {
                    myService1 = container.get<MyServiceInterface>(DI.MY_SERVICE);
                });

                // Act
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

    describe('Classes', () => {

        describe.each([
            {scope: undefined},
            {scope: 'singleton'},
        ])('When the scope is default or defined to "singleton"', ({scope}) => {
            it('should return the same instance', () => {
                // Arrange
                container.bind(DI.MY_SERVICE).toClass(MyServiceClass, [DI.DEP1, DI.DEP2], scope as Scope);

                const myService1 = container.get<MyServiceInterface>(DI.MY_SERVICE);

                // Act
                const myService2 = container.get<MyServiceInterface>(DI.MY_SERVICE);

                // Assert
                expect(myService1).toBe(myService2);
            });
        });

        describe('When the scope is defined to "transient"', () => {
            it('should return a new instance each time', () => {
                // Arrange
                container.bind(DI.MY_SERVICE).toClass(MyServiceClass, [DI.DEP1, DI.DEP2], 'transient');

                const myService1 = container.get<MyServiceInterface>(DI.MY_SERVICE);

                // Act
                const myService2 = container.get<MyServiceInterface>(DI.MY_SERVICE);

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
                container.bind(DI.MY_SERVICE)
                    .toHigherOrderFunction(HigherOrderFunctionWithDependencyObject, {dep1: DI.DEP1, dep2: DI.DEP2}, scope as Scope);

                const myService1 = container.get<MyServiceInterface>(DI.MY_SERVICE);

                // Act
                const myService2 = container.get<MyServiceInterface>(DI.MY_SERVICE);

                // Assert
                expect(myService1).toBe(myService2);
            });
        });

        describe('When the scope is defined to "transient"', () => {
            it('should return a new instance each time', () => {
                // Arrange
                container.bind(DI.MY_SERVICE)
                    .toHigherOrderFunction(HigherOrderFunctionWithDependencyObject, {dep1: DI.DEP1, dep2: DI.DEP2}, 'transient');

                const myService1 = container.get<MyServiceInterface>(DI.MY_SERVICE);

                // Act
                const myService2 = container.get<MyServiceInterface>(DI.MY_SERVICE);

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
                container.bind(DI.MY_SERVICE)
                    .toCurry(curriedFunctionWithDependencyObject, {dep1: DI.DEP1, dep2: DI.DEP2}, scope as Scope);

                const myService1 = container.get<CurriedFunctionWithDependencies>(DI.MY_SERVICE);

                // Act
                const myService2 = container.get<CurriedFunctionWithDependencies>(DI.MY_SERVICE);

                // Assert
                expect(myService1).toBe(myService2);
            });
        });

        describe('When the scope is defined to "transient"', () => {
            it('should return a new instance each time', () => {
                // Arrange
                container.bind(DI.MY_SERVICE)
                    .toCurry(curriedFunctionWithDependencyObject, {dep1: DI.DEP1, dep2: DI.DEP2}, 'transient');

                const myService1 = container.get<CurriedFunctionWithDependencies>(DI.MY_SERVICE);

                // Act
                const myService2 = container.get<CurriedFunctionWithDependencies>(DI.MY_SERVICE);

                // Assert
                expect(myService1).not.toBe(myService2);
            });
        });
    });

    describe('When a scoped dependency is resolved outside of a scope', () => {
        it('should throw an error', () => {
            // Arrange
            container.bind(DI.MY_SERVICE)
                .toHigherOrderFunction(HigherOrderFunctionWithDependencyObject, {dep1: DI.DEP1, dep2: DI.DEP2}, 'scoped');

            // Act & Assert
            expect(() => container.get<MyServiceInterface>(DI.MY_SERVICE))
                .toThrowError(`Cannot resolve scoped binding outside of a scope: ${DI.MY_SERVICE.toString()}`);
        });
    });

    describe('When an unknown scope is used during binding', () => {
        it('should throw an error', () => {
            // Arrange
            container.bind(DI.MY_SERVICE).toClass(MyServiceClass, [], 'unknown' as any);

            // Act & Assert
            expect(() => container.get<MyServiceClassInterface>(DI.MY_SERVICE))
                .toThrowError('Unknown scope: unknown');
        });
    });
});
