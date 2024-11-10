import {Container, createContainer, Scope} from "../src";
import {DI} from "./examples/DI";
import {MyService} from "./examples/MyService";
import {MyServiceInterface} from "./examples/MyServiceInterface";
import {vi} from "vitest";
import {sayHelloWorld} from "./examples/sayHelloWorld";
import {SayHelloType} from "./examples/SayHelloType";

describe('Scope', () => {

    let container: Container;
    let factoryCalls = vi.fn();

    beforeEach(() => {
        container = createContainer();
        container.bind(DI.DEP1).toValue('dependency1');
        container.bind(DI.DEP2).toValue(42);
        factoryCalls = vi.fn();
    });

    describe.each([
        {scope: undefined},
        {scope: 'singleton'},
    ])('When the scope is default or defined to "singleton"', ({scope}) => {
        it('should return the same instance', () => {
            // Arrange
            container.bind(DI.MY_SERVICE).toFactory(() => {
                factoryCalls();
                return MyService({
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
                return MyService({
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
                return MyService({
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
                return MyService({
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
