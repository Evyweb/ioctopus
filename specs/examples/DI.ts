import { ServiceRegistry} from "../../src";

export const serviceRegistry = new ServiceRegistry()
    .define('DEP1').mapTo()
    .define('DEP2').mapTo()
    .define('LOGGER').mapTo()
    .define('MY_SERVICE').mapTo()
    .define('MY_USE_CASE').mapTo()
    .define('SIMPLE_FUNCTION').mapTo()
    .define('NOT_REGISTERED_VALUE').mapTo()
    .define('CLASS_WITH_DEPENDENCIES').mapTo()
    .define('CLASS_WITHOUT_DEPENDENCIES').mapTo()
    .define('HIGHER_ORDER_FUNCTION_WITH_DEPENDENCIES').mapTo()
    .define('HIGHER_ORDER_FUNCTION_WITHOUT_DEPENDENCIES').mapTo()
    .define('CURRIED_FUNCTION_WITHOUT_DEPENDENCIES').mapTo()
    .define('CURRIED_FUNCTION_WITH_DEPENDENCIES').mapTo()
    .define('CURRIED_FUNCTION_WITH_DEPENDENCIES_OBJECT').mapTo()
    .define('CIRCULAR_A').mapTo()
    .define('CIRCULAR_B').mapTo();
