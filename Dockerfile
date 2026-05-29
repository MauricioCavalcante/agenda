# Stage 1: Build React Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Runtime Backend & Static Serving
FROM node:18-alpine
WORKDIR /app

# Setup production environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3050
ENV CRONOGRAMA_PATH=/app/cronograma.txt
ENV DATA_DIR=/app/data

COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist ./public

# Ensure the data directory is present
RUN mkdir -p /app/data

EXPOSE 3050
CMD ["node", "server.js"]
