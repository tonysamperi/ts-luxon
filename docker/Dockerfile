FROM library/node:13-slim

ENV HUSKY_SKIP_INSTALL=1

RUN npm install full-icu

ENV NODE_ICU_DATA=/node_modules/full-icu
ENV LANG=it-IT.utf8
ENV LIMIT_JEST=yes
ENV CI=yes
ENV TZ=Europe/Rome
