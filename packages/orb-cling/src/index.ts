import { ClingFns, ClingLevels, makeCling } from '@orbstation/cling/make'
import { clingOutputStd } from '@orbstation/cling/outputStd'
import { symbolsUTF8 } from '@orbstation/cling/symbols'
import { ClingLogEntry, clingOutputLog } from '@orbstation/cling/outputLog'

export const cling: ClingFns<ClingLevels> = makeCling({
    onOutput: clingOutputStd(symbolsUTF8),
})

export const clingLog: <L extends ClingLevels = ClingLevels>(store: ClingLogEntry[]) => ClingFns<L> =
    (store) =>
        makeCling({
            onOutput: clingOutputLog(store),
        })
