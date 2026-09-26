FROM node:22-alpine

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY backend/src ./src

# Expose the port (adjust if needed)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]

