import { RouteDef, GET, POST } from '@orbstation/route/RouteDef'
import { loadableHandler } from '@orbstation/route/loadableHandler'

const apiPrefix = ''
const apiPrefixManagement = apiPrefix + '/api'

const routesManagementApi: RouteDef[] = [
    // Station App
    {
        id: 'station.app.save', method: POST, path: apiPrefixManagement + '/station/app',
        handler: loadableHandler(() => import ('./handler/systemApi/AppSaveHandler.js').then(extension => extension.default)),
    }, {
        id: 'station.app.details', method: GET, path: apiPrefixManagement + '/station/app',
        handler: loadableHandler(() => import ('./handler/systemApi/AppDetailsHandler.js').then(extension => extension.default)),
    },
    // Station Hooks
    {
        id: 'hook.list', method: GET, path: apiPrefixManagement + '/hooks/*',
        handler: loadableHandler(() => import ('./handler/systemApi/HookListHandler.js').then(extension => extension.default)),
    },
    /*[
        'hook.list2', GET, apiPrefixManagement + '/hooks/:parent/:dd',
        loadableHandler(() => import ('./handler/systemApi/HookListHandler.js').then(extension => extension.default)),
    ],*/
    // Model Service
    {
        id: 'model.status', method: GET, path: apiPrefixManagement + '/model/:modelId/status',
        handler: loadableHandler(() => import ('./handler/modelApi/ModelStatusHandler.js').then(extension => extension.default)),
    },
    {
        id: 'model.domain.status', method: GET, path: apiPrefixManagement + '/models/:domainId/status',
        handler: loadableHandler(() => import ('./handler/modelApi/ModelDomainStatusHandler.js').then(extension => extension.default)),
    },
    {
        id: 'model.domain.install', method: POST, path: apiPrefixManagement + '/models/:domainId/install',
        handler: loadableHandler(() => import ('./handler/modelApi/ModelInstallHandler.js').then(extension => extension.default)),
    },
    {
        id: 'model.domain.uninstall', method: POST, path: apiPrefixManagement + '/models/:domainId/uninstall',
        handler: loadableHandler(() => import ('./handler/modelApi/ModelUninstallHandler.js').then(extension => extension.default)),
    },
    {
        id: 'model.export', method: GET, path: apiPrefixManagement + '/models-export',
        handler: loadableHandler(() => import ('./handler/modelApi/ModelExportHandler.js').then(extension => extension.default)),
    },
    // Extensions
    {
        id: 'extensions.list.enabled', method: GET, path: apiPrefixManagement + '/extensions/enabled',
        handler: loadableHandler(() => import ('./handler/systemApi/ExtensionsListEnabledHandler.js').then(extension => extension.default)),
    },
    {
        id: 'extensions.list.available', method: GET, path: apiPrefixManagement + '/extensions/available',
        handler: loadableHandler(() => import ('./handler/systemApi/ExtensionsListAvailableHandler.js').then(extension => extension.default)),
    },
    {
        id: 'extension.install', method: POST, path: apiPrefixManagement + '/extension/:extensionId/install',
        handler: loadableHandler(() => import ('./handler/systemApi/ExtensionInstallHandler.js').then(extension => extension.default)),
    },
    {
        id: 'extension.update', method: POST, path: apiPrefixManagement + '/extension/:extensionId/update',
        handler: loadableHandler(() => import ('./handler/systemApi/ExtensionInstallHandler.js').then(extension => extension.default)),
    },
    {
        id: 'extension.uninstall', method: POST, path: apiPrefixManagement + '/extension/:extensionId/uninstall',
        handler: loadableHandler(() => import ('./handler/systemApi/ExtensionUninstallHandler.js').then(extension => extension.default)),
    },
    {
        id: 'extension.status', method: GET, path: apiPrefixManagement + '/extension/:extensionId/status',
        handler: loadableHandler(() => import ('./handler/systemApi/ExtensionStatusHandler.js').then(extension => extension.default)),
    },
    // Extensions
    {
        id: 'data_context.describe', method: GET, path: apiPrefixManagement + '/data-context/:contextId',
        handler: loadableHandler(() => import ('./handler/api/DataContextDescribeHandler.js').then(extension => extension.default)),
    },
    // Schema
    {
        id: 'schema.list', method: GET, path: apiPrefixManagement + '/schemas/:scopeId',
        handler: loadableHandler(() => import ('./handler/SchemaListHandler.js').then(extension => extension.default)),
    },
    {
        id: 'schema.details', method: GET, path: apiPrefixManagement + '/schema/:scopeId/:schemaId',
        handler: loadableHandler(() => import ('./handler/SchemaDetailsHandler.js').then(extension => extension.default)),
    },
]

export const routes: RouteDef[] = [
    {
        id: 'home', method: GET, path: apiPrefix + '/',
        handler: loadableHandler(() => import ('./handler/HomeHandler.js').then(extension => extension.default)),
    },
    {
        id: 'ping', method: GET, path: apiPrefix + '/ping',
        handler: loadableHandler(() => import ('./handler/PingHandler.js').then(extension => extension.default)),
    },
    ...routesManagementApi,
]
