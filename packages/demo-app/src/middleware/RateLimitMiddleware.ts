import { ServiceService } from '../services.js'
import crypto from 'crypto'
import { RedisManager } from '@bemit/redis/RedisManager'
import { RouteMiddleware } from '@orbstation/route/RouteHandler'

export const RateLimitMiddleware: RouteMiddleware = async(req, res, next) => {
    if(req.path.indexOf('/queue') === 0) {
        // todo: add `RateLimiter` as service with path-based exclusions etc.
        next()
        return
    }
    const clientIp = req.header('x-forwarded-for')
    const now1D = Number((new Date().getTime() / 1000 / 60 / 1440).toFixed(0))
    const ipHash = crypto.createHash('sha256').update(clientIp + '2du4hgs5t64@' + now1D).digest('hex')

    const redisManager = ServiceService.get<RedisManager>('RedisManager')
    const key = 'rate-ip:'

    const maxRates = {
        r10s: 30,
        r1m: 120,
        r3m: 200,
        r5m: 350,
        r60m: 4500,
    }
    const rateCurrentR10S = await redisManager.rater(key + ipHash + ':R10S', 10, maxRates.r10s)
    // const rateCurrentR1M = await redisManager.rater(key + ipHash + ':R1M', 60, maxRates.r1m)
    // const rateCurrentR3M = await redisManager.rater(key + ipHash + ':R3M', 60 * 3, maxRates.r3m)
    const rateCurrentR5M = await redisManager.rater(key + ipHash + ':R5M', 60 * 5, maxRates.r5m)
    // const rateCurrentR60M = await redisManager.rater(key + ipHash + ':R60M', 1440, maxRates.r60m)

    const ratesLeft: { [k: string]: number } = {
        r10s: maxRates.r10s - rateCurrentR10S,
        // r1m: maxRates.r1m - rateCurrentR1M,
        // r3m: maxRates.r3m - rateCurrentR3M,
        r5m: maxRates.r5m - rateCurrentR5M,
        // r60m: maxRates.r60m - rateCurrentR60M,
    }

    // console.log('rates', rateCurrentR10S, rateCurrentR1M, rateCurrentR3M, rateCurrentR5M, rateCurrentR60M)

    const exceededRate = Object.keys(ratesLeft).find(r => ratesLeft[r] <= 0)
    res.setHeader('X-Rate-Left-10S', ratesLeft.r10s)
    // res.setHeader('X-Rate-Left-1M', ratesLeft.r1m)
    // res.setHeader('X-Rate-Left-3M', ratesLeft.r3m)
    res.setHeader('X-Rate-Left-5M', ratesLeft.r5m)
    // res.setHeader('X-Rate-Left-60M', ratesLeft.r60m)

    if(exceededRate) {
        return res.status(429).send({
            error: 'exceeded-rate',
            rate: exceededRate,
        })
    }
    next()
}
