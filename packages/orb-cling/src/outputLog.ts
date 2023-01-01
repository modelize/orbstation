import { ClingOnOutput } from '@orbstation/cling/make'

export interface ClingLogEntry {
    ts: number
    level?: string
    line: string
}

export const clingOutputLog: (store: ClingLogEntry[]) => ClingOnOutput = (store) => (line, opts) => {
    let entry: ClingLogEntry | undefined = undefined
    if(typeof line === 'string') {
        entry = {
            ts: new Date().getTime(),
            line: line,
        }
    } else if(Array.isArray(line)) {
        const [level, text] = line
        entry = {
            ts: new Date().getTime(),
            line: text,
            level: level,
        }
    }
    if(!entry) return
    if(opts?.replacePrev) {
        store.splice(-1, 1, entry)
    } else {
        store.push(entry)
    }
}
