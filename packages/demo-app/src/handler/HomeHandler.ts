import { RouteHandler } from '@orbstation/route/RouteHandler'
import { ServiceService } from '../services.js'

const HomeHandler: RouteHandler = async(_req, res) => {
    return res.send(`
  <!doctype HTML>
<html lang="en">
<head>
    <title>OrbStation</title>
    <style>
        body {
            font-family: -apple-system,system-ui,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,sans-serif;
            background: #182e35;
            color: #fff;
        }
    </style>
</head>
<body>
    <h1>OrbStation</h1>
    <code>${process.env.APP_ENV}</code>
    <small style="display: block"><code style="color: #300051">${ServiceService.config('git_commit') || ''}</code></small>
    <div style="margin-top: 15px;"><a style="color: #4bdcb9; text-decoration: none;" href="https://bemit.io">bemit.io</a></div>
</body>
</html>`)
}

export default HomeHandler
