#!/bin/bash
npm install
npm run build
npm run test
bash <(curl -s https://codecov.io/bash) -Z -t 2e67ee6c-9c40-4a9b-990e-1d3bc0d1b885