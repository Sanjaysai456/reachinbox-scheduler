FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY public ./public
COPY src ./src

EXPOSE 5173

CMD ["npm", "run", "dev"]
