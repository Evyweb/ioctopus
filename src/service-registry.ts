export class ServiceRegistry<KeyMap extends Record<string, unknown> = {}> {
    keyMap: KeyMap = {} as KeyMap;

    define<OutputType, Key extends string>(key: Key, identifier?: unknown) {
        this.keyMap = {
            ...this.keyMap,
            [key]: identifier,
        };
        return new ServiceBinder<OutputType, Key, KeyMap>(this, key);
    }
}

class ServiceBinder<
    Service,
    Key extends string,
    KeyMap extends Record<string, unknown>
> {
    constructor(
        private readonly serviceRegistry: ServiceRegistry<KeyMap>,
        private readonly key: Key
    ) {}

    mapTo<NewService extends Service>() {
        return this.serviceRegistry as unknown as ServiceRegistry<
            KeyMap & Record<Key, NewService>
        >;
    }
}
