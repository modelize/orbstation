import { IExtensionDefinition } from '@orbstation/app/ExtensionService'
import { HookService } from '@orbstation/app/HookService'
import crypto from 'crypto'

export const extensionInstallerHooks = (
    hookService: HookService,
) => async(
    extensionId: string,
    hooks: IExtensionDefinition['hooks'],
    // doUpdate?: boolean,
): Promise<string[]> => {
    const hookModel = await hookService.getModel()
    if(hookModel.desc.readOnly) {
        return [' > skipping hooks, readOnly model is active - must use e.g. `preload`']
    }
    const hooksPrev = await hookService.listHooksOfExt(extensionId)
    const fullLog: string[] = []
    if(!hooks) return fullLog
    let i = -1
    const hooksChanged: string[] = []
    for(const hookDef of hooks) {
        i++
        if(!hookDef.parent || !hookDef.type) {
            fullLog.push(' ❌ hook missing `parent` or `type` at `[' + i + ']`')
            continue
        }
        if(hookDef.from) {
            // must not be set inside of modules
            fullLog.push(' ❌ hook must not have `from` at `[' + i + ']`')
            continue
        }
        if(hookDef.restrict && !Array.isArray(hookDef.restrict)) {
            fullLog.push(' ❌ hook invalid `restrict` at `[' + i + ']`')
            continue
        }
        if(hookDef.data) {
            // nested data not allowed in hookDef atm.
            fullLog.push(' ❌ hook must not have `data` at `[' + i + ']`')
            continue
        }
        if(hookDef.parent?.indexOf(':') !== -1) {
            // nested data not allowed in hookDef atm.
            fullLog.push(' ❌ hook `parent` must not include a `:` at `[' + i + ']`')
            continue
        }
        const fromId = 'ext:' + extensionId
        const parsedParent = hookDef.parent.replace('{{extId}}', extensionId)
        // todo: switch to a saver id-generation
        const hookId = crypto.createHash('sha256').update(fromId + '/' + parsedParent + ':' + hookDef.type + ':' + i).digest('hex')
        const existingHook = hooksPrev.find(h => h.id === hookId)
        try {
            if(existingHook) {
                await hookService.updateHook({
                    // todo: regarding id-generation. e.g. it could be that "deleted" data is mixed up here for existing hooks
                    //       but necessary for couchdb stuff, maybe switch to `old/new` strategy here already?
                    ...existingHook,
                    ...hookDef,
                    id: hookId,
                    from: fromId,
                    parent: parsedParent,
                })
            } else {
                await hookService.createHook({
                    ...hookDef,
                    id: hookId,
                    from: fromId,
                    parent: parsedParent,
                })
            }
            hooksChanged.push(hookId)
            fullLog.push(' > hook ' + (existingHook ? 'updated' : 'added') + ' at `[' + i + ']`')
        } catch(e) {
            console.error(e)
            fullLog.push(
                '   ❌ system failure while ' +
                (existingHook ? 'updating' : 'creating') +
                ' hook at `[' + i + ']`',
            )
        }
    }
    const hooksToRemove = hooksPrev.filter(h => !hooksChanged.includes(h.id as string))
    if(hooksToRemove.length) {
        fullLog.push(' > deleting `' + hooksToRemove.length + '` unused hooks')
        for(const hookToRemove of hooksToRemove) {
            try {
                await hookService.deleteHook(hookToRemove)
                fullLog.push('   ✓ deleted hook `' + hookToRemove.id + '`')
            } catch(e) {
                console.error(e)
                fullLog.push('   ❌ system failure while deleting hook at `[' + hookToRemove.id + ']`')
            }
        }
    }
    return fullLog
}
