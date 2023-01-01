# OrbStation: cling

[![npm (scoped)](https://img.shields.io/npm/v/@orbstation/cling?style=flat-square)](https://www.npmjs.com/package/@orbstation/cling)
[![Github actions Build](https://github.com/modelize/orbstation/actions/workflows/blank.yml/badge.svg)](https://github.com/modelize/orbstation/actions)
[![MIT license](https://img.shields.io/npm/l/@orbstation/cling?style=flat-square)](https://github.com/modelize/orbstation/blob/main/LICENSE)
![Typed](https://flat.badgen.net/badge/icon/Typed?icon=typescript&label&labelColor=blue&color=555555)

Textual status helper, for CLI progress or API result log.

```shell
npm i --save @orbstation/cling
```

> ESM only package

## Usage

Using the default `stdout` configured instance:

```typescript
import { cling } from '@orbstation/cling'

cling.line('some simple line to output')

cling.message('succes', 'line with severity level')
cling.message('error', 'line with severity level')

const end = cling.progress('waiting for upload')
// will print / animate:
// waiting for upload .
// waiting for upload ..
// waiting for upload ...
// waiting for upload .
// when done, end the logging with one final line:
end()
// waiting for upload ...

```

Using the default `array-log` configured instance:

```typescript
import { clingLog } from '@orbstation/cling'
import { ClingLogEntry } from '@orbstation/cling/outputLog'

const store: ClingLogEntry[] = []
const cling = clingLog(store)

cling.line('some line')
cling.line('and another line')

// flushing the current content of the store:
console.log(store.splice(0, store.length))

// when not "flushed" again, this line won't be shown anywhere
cling.line('and another line')
```

Building a custom instance:

```typescript
import { ClingFns, ClingLevels, makeCling } from '@orbstation/cling/make'
import { symbolsUTF8 } from '@orbstation/cling/symbols'
import { clingOutputStd } from '@orbstation/cling/outputStd'

export const cling: ClingFns<ClingLevels> =
    makeCling({
        onOutput: clingOutputStd(symbolsUTF8),
    })
```

```typescript
import { ClingFns, ClingLevels, makeCling } from '@orbstation/cling/make'
import { ClingLogEntry, clingOutputLog } from '@orbstation/cling/outputLog'

export const clingLog: <L extends ClingLevels = ClingLevels>(store: ClingLogEntry[]) => ClingFns<L> =
    (store) =>
        makeCling({
            onOutput: clingOutputLog(store),
        })
```

## License

[MIT License](https://github.com/modelize/orbstation/blob/main/LICENSE)

© 2023 [bemit](https://bemit.codes)
