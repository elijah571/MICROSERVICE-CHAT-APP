# Use official lightweight Node image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy all app files
COPY . .

# Expose service port (change per service)
EXPOSE 3002

# Start the app
CMD ["node", "src/server.js"]
