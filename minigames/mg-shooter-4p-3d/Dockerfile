FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy game files
COPY . .

# Expose port (game uses 3847 by default)
EXPOSE 3847

# Run the game server
CMD ["npm", "start"]
