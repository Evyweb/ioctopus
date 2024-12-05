import {MyUseCaseInterface, UseCaseDependencies} from "./types";

export function UseCase({myService, logger, sayHello}: UseCaseDependencies): MyUseCaseInterface {
    return {
        execute() {
            const message = myService.runTask();
            logger.log(message);
            logger.log(sayHello());
            return message;
        }
    };
}