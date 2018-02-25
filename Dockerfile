FROM node:6.9.2
EXPOSE 5000
EXPOSE 5432:5432
COPY directorios.tar.gz .
RUN tar -xvzf directorios.tar.gz
#COPY ./src/js/pgPool.js ./src/js/pgPool.js
COPY ./vars .
RUN chmod 777 vars
CMD ./vars
CMD echo $PGHOST
RUN npm install
CMD node refundmserv.js 
