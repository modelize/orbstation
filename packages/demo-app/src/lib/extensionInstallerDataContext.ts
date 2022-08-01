import { IExtensionDefinition } from '@orbstation/app/ExtensionService'
import { DataContextService } from '../service/DataContextService.js'

export const extensionInstallerDataContext = (
    dataContextService: DataContextService,
) => async(
    extensionId: string,
    dataContexts: IExtensionDefinition['dataContexts'],
    // doUpdate?: boolean,
): Promise<string[]> => {
    const dataContextsPrev = await dataContextService.listDataContextsOfExt(extensionId)
    let i = -1
    const dataContextsChanged: string[] = []
    const fromId = 'ext:' + extensionId
    const fullLog: string[] = []
    for(const dataContextId in dataContexts) {
        i++
        const dataContext = dataContexts[dataContextId]
        const existingContext = dataContextsPrev.find(h => h._id === dataContextId)
        try {
            if(existingContext) {
                await dataContextService.updateDataContext({
                    ...existingContext,
                    id: dataContextId,
                    from: fromId,
                    context: dataContext,
                })
            } else {
                await dataContextService.createDataContext({
                    id: dataContextId,
                    from: fromId,
                    context: dataContext
                })
            }
            dataContextsChanged.push(dataContextId)
            fullLog.push(' > data-context ' + (existingContext ? 'updated' : 'added') + ' at `[' + i + ']`')
        } catch(e) {
            console.error(e)
            fullLog.push(
                ' ❌ system failure while ' +
                (existingContext ? 'updating' : 'creating') +
                ' data-context at `[' + i + ']`',
            )
        }
    }
    const contextsToRemove = dataContextsPrev.filter(h => !dataContextsChanged.includes(h._id as string))
    if(contextsToRemove.length) {
        fullLog.push(' > deleting `' + contextsToRemove.length + '` unused data-contexts')
        for(const contextToRemove of contextsToRemove) {
            try {
                await dataContextService.deleteDataContext(contextToRemove)
                fullLog.push(' > deleted data-context `' + contextToRemove._id + '`')
            } catch(e) {
                console.error(e)
                fullLog.push(' ❌ system failure while deleting data-context at `[' + contextToRemove._id + ']`')
            }
        }
    }
    return fullLog
}
