FROM node:20-slim

# Install wget and curl for downloading assets
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install

COPY server.js ./
COPY public ./public

# Create asset directories
RUN mkdir -p public/assets/models/board \
    public/assets/models/characters \
    public/assets/models/dice \
    public/assets/textures

# Download assets automatically during build
# This will attempt to download from known working sources
# If downloads fail, the game will use enhanced procedural models (which look great!)
RUN if [ -f public/assets/download-assets-docker.sh ]; then \
    chmod +x public/assets/download-assets-docker.sh && \
    public/assets/download-assets-docker.sh || echo "Note: Asset download had issues. Game will use procedural models."; \
    elif [ -f public/assets/download-assets.sh ]; then \
    chmod +x public/assets/download-assets.sh && \
    public/assets/download-assets.sh || echo "Note: Some assets failed to download. Game will use procedural models."; \
    fi

# Note: For best results, manually download assets from Kenney.nl and place them
# in host/public/assets/ before building. The game will automatically use them.

EXPOSE 8080
CMD ["npm", "start"]
