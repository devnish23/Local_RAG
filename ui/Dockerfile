FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm i --only=prod
COPY server.js ./server.js
COPY public ./public
EXPOSE 3000
CMD ["node", "server.js"]
