# this image relies on the nodejs image
FROM node:20-alpine
# set working directory
WORKDIR /usr/src/users-service
# we need CURL to verify that the key-value storage is running (see boot-in-order.sh)
RUN apk update && apk add curl

# let NPM packages be called anywhere within the container
ENV PATH /usr/src/users-service/node_modules/.bin:${PATH}
ADD package.json .
RUN npm install
# source files of the authentication service
ADD gulpfile.js .
ADD src src
ADD boot-in-order.sh .
# string to create tokens (see utils/en-de-coders.js)
ENV TOKEN_SECRET="7Jnmemx3l/Ehy6Z0+D+8kA1VAUali+lORHDUIYMvwIXHxRIrZg6g+o33Qb3N8Q+mZjSjr5DmooL1uOMTwMVGQA=="
# header for logging messages
ENV DEBUG users-d
# non empty string use perisitence (with CouchDB)
ENV WITH_PERSISTENT_DATA Y

ENV USERS_D_PORT 80

# name of container running CouchDB
ENV DB_HOST users-db
# database name
ENV DB_USERS users
ENV DB_SESSIONS sessions
# authentication information to CRUD (create/remove/update/delete) objects in our DB
ENV ADMIN_NAME admin
ENV ADMIN_PASSW admin
ENV DB_USERS_URL http://${ADMIN_NAME}:${ADMIN_PASSW}@${DB_HOST}:5984/${DB_USERS}
ENV DB_SESSIONS_URL http://${ADMIN_NAME}:${ADMIN_PASSW}@${DB_HOST}:5984/${DB_SESSIONS}

# we now use an script to deploy the authentication service
CMD source boot-in-order.sh