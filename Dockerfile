# Production build Dockerfile for Next.js 15 App Router (Bun)

FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Workaround: bun >= 1.3.13 streaming tarball extraction tidak stabil di Docker
ENV BUN_FEATURE_FLAG_DISABLE_STREAMING_INSTALL=1

# Install dependencies (respects bun.lock)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source files
COPY . .

# Copy drizzle config
COPY drizzle.config.ts ./

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup -g 1001 -S bunjs && \
    adduser -S nextjs -u 1001

# Copy necessary files from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock ./bun.lock
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/app ./app
COPY --from=builder /app/components ./components
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/types ./types
COPY --from=builder /app/.env.example ./.env.example
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

USER nextjs

EXPOSE 3000

# Start with next start for production
CMD ["bun", "run", "start"]