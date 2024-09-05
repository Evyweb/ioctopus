import {MyService} from "./MyService";
import {MyServiceInterface} from "./MyServiceInterface";
import {SayHelloType} from "./SayHelloType";
import {sayHelloWorld} from "./sayHelloWorld";
import {MyUseCase} from "./MyUseCase";
import {MyUseCaseInterface} from "./MyUseCaseInterface";
import {LoggerInterface} from "./LoggerInterface";
import {DI} from "./DI";
import {Container, createContainer} from "../src/container";

describe('Container', () => {

    let container: Container;

    beforeEach(() => {
        container = createContainer();
    });

    describe('When the function is registered using a symbol', () => {
        it('should return the associated function', () => {
            // Arrange
            container.bind(DI.HELLO_WORLD).toFunction(sayHelloWorld);

            // Act
            const sayHello = container.get<SayHelloType>(DI.HELLO_WORLD);

            // Assert
            expect(sayHello()).toBe('hello world');
        });

        it('should resolve all its dependencies using the factory', () => {
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
    });
});