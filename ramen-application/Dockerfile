FROM node:14.16-alpine
ENV NODE_ENV production
#RUN mkdir /work/
#WORKDIR /work/
#
#COPY package.json /work/package.json
#COPY package-lock.json /work/package-lock.json
#COPY .env /work/.env
#RUN npm ci --prod
#
#COPY ./src/ /work/src
#
#CMD npm start
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
EXPOSE 4000
CMD npm start