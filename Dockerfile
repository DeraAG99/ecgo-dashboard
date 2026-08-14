# Production build Dockerfile for Next.js 15 App Router

FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --include=dev

# Copy source files
COPY . .

# Copy drizzle config (tambahan)
COPY drizzle.config.ts ./

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy necessary files from builder
COPY --from=builder /app/package*.json ./
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
CMD ["npm", "run", "start"]