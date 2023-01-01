
const path = require('path');

module.exports = {
    resolve: {
        alias: {
            '@orbstation/app': path.resolve(__dirname, './orb-app/src'),
'@orbstation/app-model-couchdb': path.resolve(__dirname, './orb-app-model-couchdb/src'),
'@orbstation/app-model-lowdb': path.resolve(__dirname, './orb-app-model-lowdb/src'),
'@orbstation/route': path.resolve(__dirname, './orb-route/src'),
'@orbstation/command': path.resolve(__dirname, './orb-command/src'),
'@orbstation/cling': path.resolve(__dirname, './orb-cling/src'),
'@bemit/schema': path.resolve(__dirname, './schema-lib/src'),

        }
    }
}