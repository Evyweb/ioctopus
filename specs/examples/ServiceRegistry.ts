import { ServiceRegistry} from "../../src";
import { ClassA, ClassB } from "./Circular";
import { CurriedFunctionWithDependencies, CurriedFunctionWithoutDependencies, LoggerInterface, MyServiceClassInterface, MyServiceInterface, MyUseCaseInterface, SayHelloType, ServiceWithoutDependencyInterface } from "./types";

export const serviceRegistry = new ServiceRegistry()
    .define('DEP1').mapTo<string>()
    .define('DEP2').mapTo<number>()
    .define('LOGGER').mapTo<LoggerInterface>()
    .define('MY_SERVICE').mapTo<MyServiceInterface>()
    .define('MY_USE_CASE').mapTo<MyUseCaseInterface>()
    .define('SIMPLE_FUNCTION').mapTo<SayHelloType>()
    .define('NOT_REGISTERED_VALUE').mapTo()
    .define('CLASS_WITH_DEPENDENCIES').mapTo<MyServiceClassInterface>()
    .define('CLASS_WITHOUT_DEPENDENCIES').mapTo<MyServiceClassInterface>()
    .define('HIGHER_ORDER_FUNCTION_WITH_DEPENDENCIES').mapTo<MyServiceInterface>()
    .define('HIGHER_ORDER_FUNCTION_WITHOUT_DEPENDENCIES').mapTo<ServiceWithoutDependencyInterface>()
    .define('CURRIED_FUNCTION_WITHOUT_DEPENDENCIES').mapTo<CurriedFunctionWithoutDependencies>()
    .define('CURRIED_FUNCTION_WITH_DEPENDENCIES').mapTo<CurriedFunctionWithDependencies>()
    .define('CURRIED_FUNCTION_WITH_DEPENDENCIES_OBJECT').mapTo<CurriedFunctionWithDependencies>()
    .define('CIRCULAR_A').mapTo<ClassA>()
    .define('CIRCULAR_B').mapTo<ClassB>();