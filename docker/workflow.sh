#!/bin/bash
npm install
npm run build
npm run test
bash <(curl -s https://codecov.io/bash) -Z -t 75a49158-d42e-4dc5-bcc3-56252ae051d8