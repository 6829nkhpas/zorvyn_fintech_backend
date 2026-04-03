# ─────────────────────────────────────────────────────────
# Zorvyn Finance Backend — Multi-Stage Docker Build
# Stage 1: Install dependencies + generate Prisma client
# Stage 2: Build TypeScript → JavaScript
# Stage 3: Lean production image (no devDependencies)
# ─────────────────────────────────────────────────────────

# ── Stage 1: Dependencies ───────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate

# ── Stage 2: Build ──────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/generated ./src/generated
COPY . .

RUN npm run build

# ── Stage 3: Production ────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy Prisma artifacts (generated client + schema for migrations)
COPY --from=deps /app/src/generated ./src/generated
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Copy compiled application
COPY --from=build /app/dist ./dist

# Non-root user for security
RUN addgroup -g 1001 -S zorvyn && \
    adduser -S zorvyn -u 1001
USER zorvyn

EXPOSE 3000

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
