# Railway Dockerfile for Incident Bot
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy source code (needed for build)
COPY . .

# Install ALL dependencies (including TypeScript for build)
RUN npm ci

# Build TypeScript
RUN npm run build

# Prune dev dependencies after build (optional optimization)
RUN npm prune --production

# Expose port (Railway will set PORT env var)
EXPOSE 3000

# Start the application
CMD ["node", "dist/src/index.js"]
