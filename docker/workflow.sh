#!/bin/bash
npm install
npm run build
npm run test
bash <(curl -s https://codecov.io/bash) -Z -t 0eb75e7c-b708-4d35-8620-5e668d8ccf5d