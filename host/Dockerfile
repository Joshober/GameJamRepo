FROM node:20-slim

# Install unzip for extracting dice textures
RUN apt-get update && apt-get install -y --no-install-recommends \
    unzip \
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

# Extract assets from repository (fast - no downloads needed!)
# Assets are stored as tar.gz files in the repo
RUN if [ -f public/assets/extract-assets.sh ]; then \
    chmod +x public/assets/extract-assets.sh && \
    public/assets/extract-assets.sh; \
    fi

# Generate procedural GLTF assets if no assets found
# This ensures we always have valid GLTF files to load
RUN if [ ! -f public/assets/models/characters/character_1.glb ] && \
       [ ! -f public/assets/models/characters/character_1.gltf ]; then \
    echo "No character models found in repo, generating procedural assets..." && \
    (node public/assets/generate-assets.js || echo "Asset generation completed"); \
    fi

RUN if [ ! -f public/assets/models/dice/dice.glb ] && \
       [ ! -f public/assets/models/dice/dice.gltf ]; then \
    echo "No dice model found in repo, generating procedural dice..." && \
    (node public/assets/generate-assets.js || echo "Asset generation completed"); \
    fi

EXPOSE 8080
CMD ["npm", "start"]
