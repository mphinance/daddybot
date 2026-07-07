# DaddyBot — self-host image.
#
# NOTE: package.json currently pins the SDK as `file:../traderdaddy-sdk` for
# local development. Once `@traderdaddy/sdk` is published to npm, switch that
# dependency to `^0.1.0` and this Dockerfile builds standalone.
#
#   docker build -t daddybot .
#   docker run --env-file .env daddybot

FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
CMD ["node", "dist/index.js"]
