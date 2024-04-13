#!/bin/bash

# record.cjsを実行
node src/record.cjs

# changeFomat.jsを実行
node src/changeFomat.js

# main.jsを実行（注意: --experimental-modulesが必要）
node --experimental-modules src/main.mjs
