FROM node:24

#Create the app directory

WORKDIR /usr/src/app

# Install app dependency

COPY package*.json ./

RUN npm install

#Bundle app Source

COPY . .

RUN npm run build

EXPOSE 8000

CMD [ "node","dist/index.js"]