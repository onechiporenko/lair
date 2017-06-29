# Lair-db

[![Build Status](https://travis-ci.org/onechiporenko/lair.svg?branch=master)](https://travis-ci.org/onechiporenko/lair)
[![npm version](https://badge.fury.io/js/lair-db.svg)](https://badge.fury.io/js/lair-db)
[![npm version](https://img.shields.io/npm/dm/lair-db.svg)](https://npmjs.com/package/lair-db)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/a308984984ff4f9a826a5b34be2cc46a)](https://www.codacy.com/app/cv_github/lair)

./node_modules/.bin/istanbul cover ./node_modules/mocha/bin/_mocha --report lcovonly -- -R spec tests && cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js && rm -rf ./coverage

./node_modules/.bin/istanbul cover -e .ts -x '*.spec.ts' _mocha -- 'tests/**/*.ts' --compilers ts:ts-node/register