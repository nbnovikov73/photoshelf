FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

COPY . .

RUN npm run db:generate
RUN npm run build

ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV PORT=4321

EXPOSE 4321

CMD ["node", "apps/web/dist/server/entry.mjs"]
