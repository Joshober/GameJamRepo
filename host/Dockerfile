FROM node:20-slim

WORKDIR /app
COPY package.json ./
RUN npm install

COPY server.js ./
COPY public ./public

EXPOSE 8080
CMD ["npm", "start"]
