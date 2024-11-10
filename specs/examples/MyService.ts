import {MyServiceInterface} from "./MyServiceInterface";

interface Dependencies {
    dep1: string,
    dep2: number
}

export const MyService = ({ dep1, dep2 }: Dependencies): MyServiceInterface => ({
    runTask() {
        return `Executing with dep1: ${dep1} and dep2: ${dep2}`;
    }
});