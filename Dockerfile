# ══════════════════════════════════════
#   CodeScan AI — Dockerfile
#   Multi-stage production build
# ══════════════════════════════════════

# ── Stage 1: Builder ──────────────────
FROM node:20-alpine AS builder

LABEL maintainer="CodeScan AI"
LABEL description="AI-powered code reviewer"

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install ALL dependencies (including dev)
RUN npm ci --include=dev

# Copy source files
COPY . .

# ── Stage 2: Production ───────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S codescan -u 1001

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy app source from builder
COPY --from=builder /app/public    ./public
COPY --from=builder /app/server.js ./server.js

# Set ownership to non-root user
RUN chown -R codescan:nodejs /app
USER codescan

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Use dumb-init to handle PID 1 signals correctly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
