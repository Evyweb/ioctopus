import {createContainer, createModule} from '../src';
import {DI} from './examples/DI';
import {HigherOrderFunctionWithDependencyObject} from './examples/HigherOrderFunctions';
import {Mock, vi} from 'vitest';

describe('Container core', () => {
    describe('When unloading a module', () => {
        it('should clear singleton cache so singletons are recreated', () => {
            // Arrange
            const container = createContainer();
            container.bind(DI.DEP1).toValue('dependency1');
            container.bind(DI.DEP2).toValue(42);

            const factoryCalls: Mock = vi.fn();
            container.bind(DI.MY_SERVICE).toFactory(() => {
                factoryCalls();
                return HigherOrderFunctionWithDependencyObject({
                    dep1: container.get<string>(DI.DEP1),
                    dep2: container.get<number>(DI.DEP2)
                });
            });

            const instanceBefore = container.get(DI.MY_SERVICE);

            const MODULE_KEY = Symbol('TEMP_MODULE');
            const tempModule = createModule();
            tempModule.bind(DI.SIMPLE_FUNCTION).toFunction(() => 'hello');
            container.load(MODULE_KEY, tempModule);

            // Act
            container.unload(MODULE_KEY);

            // Assert
            const instanceAfter = container.get(DI.MY_SERVICE);
            expect(instanceBefore).not.toBe(instanceAfter);
            expect(factoryCalls).toHaveBeenCalledTimes(2);
        });
    });

    describe('When using nested scopes', () => {
        it('should keep instance within the same scope and isolate between scopes', () => {
            // Arrange
            const container = createContainer();
            container.bind(DI.DEP1).toValue('dependency1');
            container.bind(DI.DEP2).toValue(42);

            const factoryCalls: Mock = vi.fn();
            container.bind(DI.MY_SERVICE).toFactory(() => {
                factoryCalls();
                return HigherOrderFunctionWithDependencyObject({
                    dep1: container.get<string>(DI.DEP1),
                    dep2: container.get<number>(DI.DEP2)
                });
            }, 'scoped');

            // Act
            let outer1: unknown, outer2: unknown, outer3: unknown, inner1: unknown, inner2: unknown;
            container.runInScope(() => {
                outer1 = container.get(DI.MY_SERVICE);
                outer2 = container.get(DI.MY_SERVICE);

                container.runInScope(() => {
                    inner1 = container.get(DI.MY_SERVICE);
                    inner2 = container.get(DI.MY_SERVICE);
                });

                outer3 = container.get(DI.MY_SERVICE);
            });

            // Assert
            expect(outer1).toBeDefined();
            expect(outer2).toBeDefined();
            expect(outer3).toBeDefined();
            expect(inner1).toBeDefined();
            expect(inner2).toBeDefined();

            expect(outer1).toBe(outer2);
            expect(outer1).toBe(outer3);
            expect(inner1).toBe(inner2);
            expect(inner1).not.toBe(outer1);

            expect(factoryCalls).toHaveBeenCalledTimes(2);
        });
    });

    describe('When loading a module with the same key', () => {
        it('should replace previous module bindings for resolution when not previously resolved', () => {
            // Arrange
            const container = createContainer();
            const MODULE_KEY = Symbol('MY_MODULE');

            const moduleV1 = createModule();
            moduleV1.bind(DI.DEP1).toValue('v1');
            container.load(MODULE_KEY, moduleV1);

            const moduleV2 = createModule();
            moduleV2.bind(DI.DEP1).toValue('v2');

            // Act
            container.load(MODULE_KEY, moduleV2);

            // Assert
            expect(container.get<string>(DI.DEP1)).toBe('v2');
        });

        it('should keep cached singleton values after replacement until cache is cleared', () => {
            // Arrange
            const container = createContainer();
            const MODULE_KEY = Symbol('MY_MODULE');

            const moduleV1 = createModule();
            moduleV1.bind(DI.DEP1).toValue('v1');
            container.load(MODULE_KEY, moduleV1);
            container.get<string>(DI.DEP1);

            const moduleV2 = createModule();
            moduleV2.bind(DI.DEP1).toValue('v2');
            container.load(MODULE_KEY, moduleV2);

            // Act
            const value = container.get<string>(DI.DEP1);

            // Assert
            expect(value).toBe('v1');
        });

        it('should reflect replacement after a cache-clearing unload', () => {
            // Arrange
            const container = createContainer();
            const MODULE_KEY = Symbol('MY_MODULE');

            const moduleV1 = createModule();
            moduleV1.bind(DI.DEP1).toValue('v1');
            container.load(MODULE_KEY, moduleV1);
            container.get<string>(DI.DEP1);

            const moduleV2 = createModule();
            moduleV2.bind(DI.DEP1).toValue('v2');
            container.load(MODULE_KEY, moduleV2);

            const TEMP = Symbol('TEMP');
            const temp = createModule();
            container.load(TEMP, temp);

            // Act
            container.unload(TEMP);

            // Assert
            expect(container.get<string>(DI.DEP1)).toBe('v2');
        });
    });

    describe('When running a scoped callback', () => {
        it('should return the callback result', () => {
            // Arrange
            const container = createContainer();

            // Act
            const result = container.runInScope(() => 123);

            // Assert
            expect(result).toBe(123);
        });
    });

    describe('When a string key is missing', () => {
        it('should throw an error with the string key in the message', () => {
            // Arrange
            const container = createContainer();

            // Act
            const expectCall = expect(() => container.get<string>('NOT_FOUND'));

            // Assert
            expectCall.toThrowError('No binding found for key: NOT_FOUND');
        });
    });
});
