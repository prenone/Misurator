FROM node:18

ENV DATABASE_URL=undefined

WORKDIR /misurator

COPY package*.json ./
RUN npm i

COPY . .
RUN npm run build

EXPOSE 3000
CMD [ "npm", "run", "start" ]