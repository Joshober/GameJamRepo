FROM node:20-slim

WORKDIR /app
COPY package.json ./
RUN npm install

COPY server.js ./
COPY public ./public

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
