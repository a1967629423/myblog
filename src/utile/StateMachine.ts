export module MStateMachine {
    export class StateMachine {
        nowState: State | null = null;
        constructor(def?: State) {
            if (def)
                this.changeState(def);
        }
        changeState(ns: State) {
            if (this.nowState) this.nowState.emit('quit');
            this.nowState = ns;
            ns.emit('start');
        }
        emit(event: string,...argv:any[]) {
            if (this.nowState) this.nowState.emit(event,...argv);
        }
    }
    export class State {
        eventSave: { event: string, cbs: Function[] }[] = [];
        public on(event: string, cb: (eventHandle: any,...argv:any[]) => void) {
            const save = this.eventSave.find(v => v.event === event)
            if (save) {
                save.cbs.push(cb);
            }
            else {
                this.eventSave.push({ event, cbs: [cb] });
            }
        }
        public emit(event: string,...argv:any[]) {
            const save = this.eventSave.find(v => v.event === event)
            if (save) {
                let handle = {};
                save.cbs.forEach(cb => {
                    cb(handle,...argv);
                });
            }
        }
        public off(event: string, cb: (eventHandle: any) => void) {
            const save = this.eventSave.find(v => v.event === event);
            if (save) {
                const idx = save.cbs.findIndex(v => v === cb);
                if (idx > -1) {
                    save.cbs.splice(idx, 1);
                }
            }
        }
    }
}