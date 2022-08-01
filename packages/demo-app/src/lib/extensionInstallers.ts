import { couchDbModelInstaller } from '@orbstation/app-model-couchdb/CouchDbModelInstaller'
import { CouchDbService } from '@orbstation/app-model-couchdb/CouchDbService'
import { IExtensionDefinition } from '@orbstation/app/ExtensionService'
import { ExtensionSetupIntegrationInstallers } from '@orbstation/app/ExtensionSetup'
import { extensionInstallerHooks } from '@orbstation/app/ExtensionSetup/extensionInstallerHooks'
import { HookService } from '@orbstation/app/HookService'
import { DataContextService } from '../service/DataContextService.js'
import { ServiceService } from '../services.js'
import { extensionInstallerDataContext } from './extensionInstallerDataContext.js'

export const extensionInstallers: () => ExtensionSetupIntegrationInstallers<IExtensionDefinition> = () => ({
    models: [
        couchDbModelInstaller(ServiceService.use(CouchDbService)),
    ],
    dataContexts: [
        extensionInstallerDataContext(ServiceService.use(DataContextService)),
    ],
    hooks: [
        extensionInstallerHooks(ServiceService.use(HookService)),
    ],
})
