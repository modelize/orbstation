#!/bin/bash

echo "//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}" >.npmrc

git checkout -- packages/webpackPartialConfig.js

cd ./packages

cd orb-route
cp README.md build/ && cp LICENSE build/
cd ../

cd orb-oas
cp README.md build/ && cp LICENSE build/
cd ../

cd orb-command
cp README.md build/ && cp LICENSE build/
cd ../

cd orb-cling
cp README.md build/ && cp LICENSE build/
cd ../

cd schema-lib
cp README.md build/ && cp LICENSE build/
cd ../

cd ../

#npm run release
npm run release -- --yes

rm .npmrc
