import {createContainer, TypedContainer} from '../src';
import {
  FakeLogger,
  ServiceClassNoDeps,
  ServiceClassWithDeps,
  ServiceClassWithObjectDeps,
  simpleFunction,
  TestRegistry
} from "./examples/Registry";

describe('Registry', () => {
  let container: TypedContainer<TestRegistry>;

  beforeEach(() => {
    container = createContainer<TestRegistry>();
  });

  describe('toValue()', () => {
    it('should return the associated value', () => {
      // Arrange
      const config = {apiUrl: 'https://test.com', timeout: 3000};
      container.bind('CONFIG').toValue(config);

      // Act
      const result = container.get('CONFIG');

      // Assert
      expect(result).toBe(config);
    });
  });

  describe('toFunction()', () => {
    it('should return the associated simple function', () => {
      // Arrange  
      container.bind('SIMPLE_FUNCTION').toFunction(simpleFunction);

      // Act
      const fn = container.get('SIMPLE_FUNCTION');

      // Assert
      expect(fn()).toBe('hello world');
    });
  });

  describe('toClass()', () => {
    it('should return instance of the bound class', () => {
      // Arrange
      container.bind('LOGGER').toClass(FakeLogger);

      // Act
      const logger = container.get('LOGGER');

      // Assert
      expect(logger).toBeInstanceOf(FakeLogger);
      expect(logger.log).toBeDefined();
    });

    it('should accept compatible class implementations', () => {
      // Arrange
      const container = createContainer<TestRegistry>();

      // Act
      container.bind('LOGGER').toClass(FakeLogger);

      // Assert
      const logger = container.get<FakeLogger>('LOGGER');
      expect(logger.extraMethod).toBeDefined();
      expect(logger.log).toBeDefined();
    });

    describe('When class has dependencies', () => {
      it('should resolve dependencies using array format', () => {
        // Arrange
        container.bind('DEP1').toValue('test dependency');
        container.bind('DEP2').toValue(42);
        container.bind('CLASS_WITH_DEPENDENCIES').toClass(ServiceClassWithDeps, ['DEP1', 'DEP2']);

        // Act
        const service = container.get('CLASS_WITH_DEPENDENCIES');

        // Assert
        expect(service.runTask()).toBe('Executing with dep1: test dependency and dep2: 42');
      });

      it('should resolve dependencies using object format', () => {
        // Arrange
        container.bind('DEP1').toValue('object dependency');
        container.bind('DEP2').toValue(99);
        container.bind('CLASS_WITH_DEPENDENCIES').toClass(ServiceClassWithObjectDeps, {
          dep1: 'DEP1',
          dep2: 'DEP2'
        });

        // Act
        const service = container.get('CLASS_WITH_DEPENDENCIES');

        // Assert
        expect(service.runTask()).toBe('Executing with dep1: object dependency and dep2: 99');
      });
    });

    describe('When class has no dependencies', () => {
      it('should return instance without dependencies', () => {
        // Arrange
        container.bind('CLASS_WITHOUT_DEPENDENCIES').toClass(ServiceClassNoDeps);

        // Act
        const service = container.get('CLASS_WITHOUT_DEPENDENCIES');

        // Assert
        expect(service.runTask()).toBe('Executing without dependencies');
      });
    });
  });

  describe('toFactory()', () => {
    it('should resolve using factory function', () => {
      // Arrange
      container.bind('USER_SERVICE').toFactory(() => ({
        getUser: (id: string) => `Factory User ${id}`
      }));

      // Act
      const userService = container.get('USER_SERVICE');

      // Assert
      expect(userService.getUser('123')).toBe('Factory User 123');
    });

    it('should resolve dependencies within factory', () => {
      // Arrange
      container.bind('CONFIG').toValue({apiUrl: 'https://api.test.com', timeout: 2000});
      container.bind('USER_SERVICE').toFactory(() => {
        const config = container.get('CONFIG');
        return {
          getUser: (id: string) => `User ${id} from ${config.apiUrl}`
        };
      });

      // Act
      const userService = container.get('USER_SERVICE');

      // Assert
      expect(userService.getUser('456')).toBe('User 456 from https://api.test.com');
    });
  });

  describe('When a dependency is missing', () => {
    it('should throw an error with registry key', () => {
      // Act & Assert
      expect(() => container.get('USER_SERVICE'))
        .toThrowError('No binding found for key: USER_SERVICE');
    });
  });
});






