# Start from the official Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first (so Docker caches this layer)
# This means npm install only re-runs if package.json changes
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your source code
COPY . .

# Build TypeScript → JavaScript
RUN npm run build

# Expose port so Docker knows this container listens on 5000
EXPOSE 5000

# Run the compiled JavaScript (not ts-node) in production
CMD ["npm", "start"]