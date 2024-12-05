export class ClassA {
    constructor(public b: ClassB) {
    }
}

export class ClassB {
    constructor(public a: ClassA) {
    }
}