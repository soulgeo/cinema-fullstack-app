FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

WORKDIR /app/frontend
COPY . .

ENV PATH /app/node_modules/.bin:$PATH

EXPOSE 5173

CMD [ "npm", "run", "dev" ]
