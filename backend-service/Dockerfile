FROM node:20-slim AS builder

WORKDIR /app

ENV TRANSFORMER_CACHE=/app/.models-cache

COPY package*.json tsconfig.json ./

RUN npm ci --ignore-scripts

COPY . .

RUN node download-model.js

RUN npm run build


FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV TRANSFORMER_CACHE=/app/.models-cache

ENV PORT=10000 

COPY package*.json ./

RUN npm ci --only=production --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.models-cache ./.models-cache

EXPOSE 10000

CMD ["node", "dist/server.js"]