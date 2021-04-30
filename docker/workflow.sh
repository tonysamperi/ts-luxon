#!/bin/bash
npm install
npm run build
npm run test
bash <(curl -s https://codecov.io/bash) -Z