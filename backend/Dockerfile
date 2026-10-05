# CampusEats API image
FROM node:22-alpine
WORKDIR /app

# Install production dependencies first so this layer is cached between builds.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

ARG APP_VERSION=dev
ENV NODE_ENV=production APP_VERSION=${APP_VERSION} PORT=4000
EXPOSE 4000

USER node
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1
CMD ["node", "src/server.js"]
