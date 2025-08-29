FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm i

COPY . .

VOLUME ["/app/data"]

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]

