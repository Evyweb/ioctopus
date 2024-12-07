import {Container, createContainer, createModule} from "../src";
import {DI} from "./examples/DI";
import {MyServiceInterface, SayHelloType} from "./examples/types";
import {HigherOrderFunctionWithDependencyObject} from "./examples/HigherOrderFunctions";
import {sayHelloWorld} from "./examples/SimpleFunctions";

describe('Module', () => {

    let container: Container;

    beforeEach(() => {
        container = createContainer();
    });

    describe('When a module is loaded', () => {
        it('should return all module dependencies', () => {
            // Arrange
            const myModule = createModule();
            myModule.bind('SIMPLE_FUNCTION').toFunction(sayHelloWorld);
            container.load(Symbol('myModule'), myModule);

            // Act
            const sayHello = container.get<SayHelloType>('SIMPLE_FUNCTION');

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
                module3.bind(DI.MY_SERVICE).toHigherOrderFunction(HigherOrderFunctionWithDependencyObject, {
                    dep1: DI.DEP1,
                    dep2: DI.DEP2
                });

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
                module3.bind(DI.MY_SERVICE).toHigherOrderFunction(HigherOrderFunctionWithDependencyObject, {
                    dep1: DI.DEP1,
                    dep2: DI.DEP2
                });

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
});