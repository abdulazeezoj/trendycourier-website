FROM node:22-bookworm-slim AS base


# Dependency layer
FROM base AS deps

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN \
    if [ -f package-lock.json ]; then npm ci; \
    else echo "Lockfile not found." && exit 1; \
    fi


# Build layer
FROM base AS builder

# Set build arguments
ARG MODE=production

# Set working directory
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
WORKDIR /app/app
COPY . .

# Build application
ENV STRAPI_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    PATH=/app/node_modules/.bin:$PATH
RUN \
    if [ -f package-lock.json ]; then npm run build; \
    else echo "Lockfile not found." && exit 1; \
    fi


# Runner layer
FROM base AS runner

# Set working directory
WORKDIR /app

# Set environment variables
ENV MODE=production
ENV NODE_ENV=${MODE} \
    STRAPI_TELEMETRY_DISABLED=1 \
    PORT=8000 \
    HOST=0.0.0.0

# Add non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --home /home/strapi strapi

# Copy build artifacts
COPY --from=builder /app/node_modules ./node_modules
WORKDIR /app/app
COPY --from=builder --chown=strapi:nodejs /app/app ./
ENV PATH=/app/node_modules/.bin:$PATH

# Copy start script
COPY start.sh ./
RUN chmod +x start.sh

# Set non-root user
USER strapi

# Expose the application port
EXPOSE ${PORT}

# Start the application
CMD ["./start.sh"]