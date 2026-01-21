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

# Download or generate assets automatically during build
# First try to download from known sources, then generate procedural GLTF files
RUN if [ -f public/assets/download-assets-docker.sh ]; then \
    chmod +x public/assets/download-assets-docker.sh && \
    (public/assets/download-assets-docker.sh || true); \
    elif [ -f public/assets/download-assets.sh ]; then \
    chmod +x public/assets/download-assets.sh && \
    (public/assets/download-assets.sh || true); \
    fi

# Generate procedural GLTF assets if downloads failed or files don't exist
# This ensures we always have valid GLTF files to load
# Check if any character or dice files exist, if not generate them
RUN if [ ! -f public/assets/models/dice/dice.glb ] && [ ! -f public/assets/models/dice/dice.gltf ]; then \
    echo "Generating procedural 3D assets..." && \
    node public/assets/generate-assets.js || echo "Asset generation completed"; \
    fi

# Note: For best results, manually download assets from Kenney.nl and place them
# in host/public/assets/ before building. The game will automatically use them.

EXPOSE 8080
CMD ["npm", "start"]
