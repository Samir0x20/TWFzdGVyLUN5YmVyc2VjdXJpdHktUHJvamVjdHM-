# this image relies on the nodejs image
FROM node:20-alpine

WORKDIR /usr/src/artillery

RUN apk update && apk add curl
RUN npm install artillery

# let NPM packages be called anywhere within the container
ENV PATH /usr/src/artillery/node_modules/.bin:${PATH}

ADD login-user-load-test.yml .
ADD cart-load-test.yml .
ADD checkout-load-test.yml .
ADD product-load-test.yml .
ADD logs-load-test.yml .

