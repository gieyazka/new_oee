FROM node:16-alpine3.16
ARG SERVERPORT
ENV SERVERPORT "${SERVERPORT}"
WORKDIR /app
RUN apk update && \
    apk add --no-cache tzdata
COPY . .

RUN npm install
EXPOSE 3000
CMD ["npm", "run", "production"]