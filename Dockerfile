FROM node:latest
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm i
COPY . .
RUN npm run build
RUN npm run generate
EXPOSE 3000
CMD ["npm", "run", "start:prod"]