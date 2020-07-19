FROM node:lts

RUN apt-get update || : && apt-get install python -y
RUN apt-get install ffmpeg -y

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci
# If you are building your code for production
# # RUN npm ci --only=production

COPY . .

CMD [ "node", "main.js" ]


