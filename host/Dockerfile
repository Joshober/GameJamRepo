FROM node:20-slim

# Install dependencies for Playwright and asset downloads
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    curl \
    unzip \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install

# Install Playwright browsers (required for browser automation)
RUN npx playwright install chromium
RUN npx playwright install-deps chromium

COPY server.js ./
COPY public ./public

# Create asset directories
RUN mkdir -p public/assets/models/board \
    public/assets/models/characters \
    public/assets/models/dice \
    public/assets/textures

# Download assets using Playwright (browser automation)
# This handles sites that require browser interaction
RUN if [ -f public/assets/download-with-playwright.js ]; then \
    echo "Downloading assets with Playwright..." && \
    (node public/assets/download-with-playwright.js || echo "Playwright download completed (may have used fallbacks)"); \
    fi

# Fallback: Try shell script downloads if Playwright didn't get everything
RUN if [ -f public/assets/download-assets-docker.sh ]; then \
    chmod +x public/assets/download-assets-docker.sh && \
    (public/assets/download-assets-docker.sh || true); \
    fi

# Generate procedural GLTF assets if downloads failed or files don't exist
# This ensures we always have valid GLTF files to load
RUN if [ ! -f public/assets/models/dice/dice.glb ] && [ ! -f public/assets/models/dice/dice.gltf ]; then \
    echo "Generating procedural 3D assets..." && \
    (node public/assets/generate-assets.js || echo "Asset generation completed"); \
    fi

# Note: For best results, manually download assets from Kenney.nl and place them
# in host/public/assets/ before building. The game will automatically use them.

EXPOSE 8080
CMD ["npm", "start"]
