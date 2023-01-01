import { ServiceService } from '../services.js'
import { HookService, IHook } from '@orbstation/app/HookService'
import { handlerErrorWrapper } from './routing.js'
import { DELETE, GET, PATCH, POST, PUT } from '@orbstation/route/RouteDef'
import { loadableHandler } from '@orbstation/route/loadableHandler'
import * as core from 'express-serve-static-core'

const buildRouteHandler = (
    router: core.Router,
    extensionFolder: string,
    routeId: string,
    hook: IHook,
) => {
    const {
        type, from,
        path: routePath, handler, method,
    } = hook
    if(type !== 'route') {
        return
    }
    if(!from.startsWith('ext:')) {
        return
    }
    const [, fromId] = from.split(':')
    const handlerPath = extensionFolder + fromId + (handler.startsWith('.') ? handler.slice(1) : handler.startsWith('/') ? handler : '/' + handler)
    //console.log('handlerPath', method, routePath, handlerPath)

    const handle = handlerErrorWrapper(
        routeId,
        loadableHandler(() => import (handlerPath).then(extension => extension.default)),
    )

    // todo: must always be "before `ErrorHandlerMiddleware`"
    switch(method.toLowerCase()) {
        case PUT:
            router.put(routePath, handle)
            break
        case POST:
            router.post(routePath, handle)
            break
        case PATCH:
            router.patch(routePath, handle)
            break
        case DELETE:
            router.delete(routePath, handle)
            break
        case GET:
            router.get(routePath, handle)
            break
        default:
            console.error('invalid route, has no valid method: ' + method)
            throw new Error('invalid route, has no valid method: ' + method)
    }
}

export const AppRouter: (router: core.Router) => core.Router = (router: core.Router) => {
    const hookService = ServiceService.use(HookService)
    const managedIds: string[] = []
    hookService.listHooksOfParent('router')
        .then((hooks) => {
            // console.log('hooks', hooks)
            hooks.forEach((hook) => {
                const {id} = hook
                buildRouteHandler(
                    router,
                    '../extensions/',
                    'hook.' + id,
                    hook,
                )
                router.stack[router.stack.length - 1].id = 'hook.' + id
                managedIds.push('hook.' + id)
            }, [])
            //console.log('app-router', router)
            // console.log(router.stack.map(r => r.route), managedIds)
        })

    hookService.onChanges((doc) => {
        const routeId = 'hook.' + doc.id
        if(managedIds.includes(routeId)) {
            const i = router.stack.find(r => r.id === routeId)
            if(i !== -1) {
                router.stack.splice(i, 1)
            }
        } else {
            managedIds.push(routeId)
        }
        buildRouteHandler(
            router,
            '../extensions/',
            routeId,
            doc,
        )
        router.stack[router.stack.length - 1].id = routeId
    })

    return router
}
