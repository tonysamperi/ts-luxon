FROM node:13


# Copies your code file from your action repository to the filesystem path `/` of the container
COPY . /tonysamperi/ts-luxon

RUN ["chmod", "+x", "/tonysamperi/ts-luxon/docker/workflow.sh"]

ENV HUSKY_SKIP_INSTALL=1

ENV LANG=it-IT.utf8
ENV LIMIT_JEST=yes
ENV CI=yes
ENV TZ=Europe/Rome

