export interface StateEvents {
    start: Function,
    quit: Function
}
export module MStateMachine {
    export type eventCallback = (...argv: any[]) => any
    type StateConfig = StateEvents | { [key: string]: any }

    export class StateMachine {
        nowState: State | null = null;
        States: State[] = []
        constructor(def?: State) {
            if (def)
                this.changeState(def);
        }
        changeState(ns: State) {
            if (this.nowState) this.nowState.emit('quit');
            this.nowState = ns;
            ns.emit('start');
        }
        emit(event: string, ...argv: any[]): any {
            if (this.nowState) return this.nowState[event](...argv);
        }
        createState(name?:string):State;
        createState(conf?:StateConfig,name?:string):State;
        createState(conf?: StateConfig|string, name?: string):State
        createState(conf?: StateConfig|string, name?: string) {
            let state:State
            if(conf!==undefined)
            {
                if(typeof conf === 'string')
                {
                   state = new State({}, conf);
                }
                else
                {
                    state = new State(conf,name);
                }
            }
            else
            {
                state = new State();
            }
            
            state.machine = this;
            this.States.push(state);
            return state;
        }
        createStateAsDefault(name?:string):State
        createStateAsDefault(conf?:StateConfig,name?:string):State
        createStateAsDefault(conf?:StateConfig|string,name?:string):State
        createStateAsDefault(conf?:StateConfig|string,name?:string)
        {
            let state = this.createState(conf,name)
            this.changeState(state);
            return state
        }
    }
    function keyInObject<T extends any>(k: any, ob: T): k is keyof T {
        return k in ob;
    }
    export class State {
        [key: string]: any
        name: string = ''
        private static currentID: number = 0;
        id: number = 0;
        machine: StateMachine | null = null;
        constructor(conf?: StateConfig, name: string = '') {
            this.name = name;
            this.id = State.currentID++;
            if (conf) {
                for (let key in conf) {
                    if (keyInObject(key, conf)) {
                        let value = conf[key];
                        this[key] = value;
                    }
                }
            }
        }
        public on(event: keyof StateEvents, cb: eventCallback): void
        public on(event: string, cb: eventCallback): void
        public on(event: string, cb: eventCallback) {
            if (typeof cb === 'function') {
                this[event] = cb;
            }
            else {
                throw 'the second param of on function must be a Function'
            }

        }
        public bind(event: keyof StateEvents, value: any): void
        public bind(event: string, value: any): void
        public bind(event: string, value: any) {
            this[event] = value;
        }
        public emit(event: keyof StateEvents, eventHandle: any, ...argv: any[]): void
        public emit(event: keyof StateEvents, ...argv: any[]): void
        public emit(event: string, eventHandle: any, ...argv: any[]): void
        public emit(event: string, ...argv: any[]): void
        public emit(event: string, eventHandle: any = null, ...argv: any[]) {
            if(this[event]&&typeof this[event] === 'function')this[event](eventHandle, ...argv);
        }
        public off(event: keyof StateEvents): void;
        public off(event: string): void
        public off(event: string) {
            this[event] = null;
        }
    }
}