ARG NODEJS_VERSION=18.4.0

## Building stage
FROM node:${NODEJS_VERSION}-alpine3.16 as builder

WORKDIR /src/

RUN npm install -g typescript
RUN npm install -g ts-node

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy and build source
COPY . .
RUN npm run build


## Final image
FROM node:${NODEJS_VERSION}-alpine3.16 as runtime

# Add a group and a user with specified IDs
RUN addgroup -S -g 1111 appgroup && adduser -S -G appgroup -u 1111 appuser # if based on Alpine
#RUN groupadd -r -g 1111 appgroup && useradd -r -g appgroup -u 1111 --no-log-init appuser # if based on Debian/Ubuntu

# Add curl for health check
RUN apk add --no-cache curl # if based on Alpine
#RUN apt-get update && apt-get install -y curl # if based on Debian/Ubu

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy compiled source
COPY --from=builder /src/build ./build

# Copy configuration file
COPY .env .

EXPOSE 10389
CMD [ "node", "build/server.js" ]