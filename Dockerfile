FROM node:18.4.0-alpine3.16

## TODO: no idea whether this is a good or fast Dockerfile.
## See https://towardsdev.com/writing-a-docker-file-for-your-node-js-typescript-micro-service-c5170b957893
##   for at least a multi-stage build

# Create app directory
WORKDIR /usr/src/app

RUN npm install -g typescript
RUN npm install -g ts-node

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 10389
CMD [ "ts-node", "server.ts" ]