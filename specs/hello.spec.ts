import {hello} from "../src/hello";

describe('[Hello World]', () => {
    it('should work', () => {
        expect(hello()).toBe('world');
    });
});