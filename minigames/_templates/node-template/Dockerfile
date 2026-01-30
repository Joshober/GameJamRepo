FROM node:20-slim

WORKDIR /app

# Copy game files
COPY main.js .
COPY package.json .

# Install dependencies (if any)
RUN npm install

# Run the game
CMD ["node", "main.js", "--players", "4", "--seed", "123", "--mode", "jam"]
