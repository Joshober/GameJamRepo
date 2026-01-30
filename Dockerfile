FROM node:20-slim

WORKDIR /app

# Install a simple HTTP server
RUN npm install -g http-server

# Copy game files
COPY index.html .
COPY game.js .
COPY controls.js .

# Expose port
EXPOSE 8080

# Start HTTP server
CMD ["http-server", "-p", "8080", "--cors"]
