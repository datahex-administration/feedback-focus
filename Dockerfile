FROM node:20-slim AS builder

WORKDIR /app

# Build frontend
COPY package*.json ./
RUN npm ci
COPY . .
ENV VITE_API_URL=""
RUN npm run build

# Install server dependencies
WORKDIR /app/server
RUN npm install --omit=dev

# Production image
FROM node:20-slim

WORKDIR /app/server

# Copy server and its deps
COPY --from=builder /app/server /app/server
COPY --from=builder /app/server/node_modules /app/server/node_modules

# Copy built frontend for static serving
COPY --from=builder /app/dist /app/public

EXPOSE 8080

CMD ["node", "index.js"]
