import {MyServiceInterface} from "./MyServiceInterface";
import {MyUseCaseInterface} from "./MyUseCaseInterface";
import {LoggerInterface} from "./LoggerInterface";
import {SayHelloType} from "./SayHelloType";

interface Dependencies {
    myService: MyServiceInterface,
    logger: LoggerInterface,
    sayHello: SayHelloType
}

export function MyUseCase({myService, logger, sayHello}: Dependencies): MyUseCaseInterface {
    return {
        execute() {
            const message = myService.runTask();
            logger.log(message);
            logger.log(sayHello());
            return message;
        }
    };
}