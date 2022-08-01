import { dynamicLoader } from './lib/routing.js'
import { RouteDef, GET, POST } from '@orbstation/route/RouteDef'

const apiPrefix = ''
const apiPrefixManagement = apiPrefix + '/api'

const routesManagementApi: RouteDef[] = [
    // Station App
    {
        id: 'station.app.save', method: POST, path: apiPrefixManagement + '/station/app',
        handler: dynamicLoader(() => import ('./handler/systemApi/AppSaveHandler.js').then(extension => extension.default)),
    }, {
        id: 'station.app.details', method: GET, path: apiPrefixManagement + '/station/app',
        handler: dynamicLoader(() => import ('./handler/systemApi/AppDetailsHandler.js').then(extension => extension.default)),
    },
    // Station Hooks
    {
        id: 'hook.list', method: GET, path: apiPrefixManagement + '/hooks/*',
        handler: dynamicLoader(() => import ('./handler/systemApi/HookListHandler.js').then(extension => extension.default)),
    },
    /*[
        'hook.list2', GET, apiPrefixManagement + '/hooks/:parent/:dd',
        dynamicLoader(() => import ('./handler/systemApi/HookListHandler.js').then(extension => extension.default)),
    ],*/
    // Model Service
    {
        id: 'model.status', method: GET, path: apiPrefixManagement + '/model/:modelId/status',
        handler: dynamicLoader(() => import ('./handler/modelApi/ModelStatusHandler.js').then(extension => extension.default)),
    },
    {
        id: 'model.domain.status', method: GET, path: apiPrefixManagement + '/models/:domainId/status',
        handler: dynamicLoader(() => import ('./handler/modelApi/ModelDomainStatusHandler.js').then(extension => extension.default)),
    },
    {
        id: 'model.domain.install', method: POST, path: apiPrefixManagement + '/models/:domainId/install',
        handler: dynamicLoader(() => import ('./handler/modelApi/ModelInstallHandler.js').then(extension => extension.default)),
    },
    {
        id: 'model.domain.uninstall', method: POST, path: apiPrefixManagement + '/models/:domainId/uninstall',
        handler: dynamicLoader(() => import ('./handler/modelApi/ModelUninstallHandler.js').then(extension => extension.default)),
    },
    {
        id: 'model.export', method: GET, path: apiPrefixManagement + '/models-export',
        handler: dynamicLoader(() => import ('./handler/modelApi/ModelExportHandler.js').then(extension => extension.default)),
    },
    // Extensions
    {
        id: 'extensions.list.enabled', method: GET, path: apiPrefixManagement + '/extensions/enabled',
        handler: dynamicLoader(() => import ('./handler/systemApi/ExtensionsListEnabledHandler.js').then(extension => extension.default)),
    },
    {
        id: 'extensions.list.available', method: GET, path: apiPrefixManagement + '/extensions/available',
        handler: dynamicLoader(() => import ('./handler/systemApi/ExtensionsListAvailableHandler.js').then(extension => extension.default)),
    },
    {
        id: 'extension.install', method: POST, path: apiPrefixManagement + '/extension/:extensionId/install',
        handler: dynamicLoader(() => import ('./handler/systemApi/ExtensionInstallHandler.js').then(extension => extension.default)),
    },
    {
        id: 'extension.update', method: POST, path: apiPrefixManagement + '/extension/:extensionId/update',
        handler: dynamicLoader(() => import ('./handler/systemApi/ExtensionInstallHandler.js').then(extension => extension.default)),
    },
    {
        id: 'extension.uninstall', method: POST, path: apiPrefixManagement + '/extension/:extensionId/uninstall',
        handler: dynamicLoader(() => import ('./handler/systemApi/ExtensionUninstallHandler.js').then(extension => extension.default)),
    },
    {
        id: 'extension.status', method: GET, path: apiPrefixManagement + '/extension/:extensionId/status',
        handler: dynamicLoader(() => import ('./handler/systemApi/ExtensionStatusHandler.js').then(extension => extension.default)),
    },
    // Extensions
    {
        id: 'data_context.describe', method: GET, path: apiPrefixManagement + '/data-context/:contextId',
        handler: dynamicLoader(() => import ('./handler/api/DataContextDescribeHandler.js').then(extension => extension.default)),
    },
    // Schema
    {
        id: 'schema.list', method: GET, path: apiPrefixManagement + '/schemas/:scopeId',
        handler: dynamicLoader(() => import ('./handler/SchemaListHandler.js').then(extension => extension.default)),
    },
    {
        id: 'schema.details', method: GET, path: apiPrefixManagement + '/schema/:scopeId/:schemaId',
        handler: dynamicLoader(() => import ('./handler/SchemaDetailsHandler.js').then(extension => extension.default)),
    },
]

export const routes: RouteDef[] = [
    {
        id: 'home', method: GET, path: apiPrefix + '/',
        handler: dynamicLoader(() => import ('./handler/HomeHandler.js').then(extension => extension.default)),
    },
    {
        id: 'ping', method: GET, path: apiPrefix + '/ping',
        handler: dynamicLoader(() => import ('./handler/PingHandler.js').then(extension => extension.default)),
    },
    ...routesManagementApi,
]
