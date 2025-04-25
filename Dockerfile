FROM node:23.11-alpine
# set timezone ----------------------------------------------------
ARG TZ='Asia/Bangkok'

ENV TZ ${TZ}

RUN apk update

RUN apk upgrade

RUN apk add ca-certificates && update-ca-certificates

# Change TimeZone
RUN apk add --update tzdata

# Clean APK cache
RUN rm -rf /var/cache/apk/*
# --------------------------------------------------------------
WORKDIR /app
# --------------------------------------------------------------
COPY . .
# --------------------------------------------------------------
RUN npm install
# --------------------------------------------------------------
RUN apk update
RUN apk add --no-cache bash curl dcron
# --------------------------------------------------------------
RUN chmod +x /app/callscript.sh
RUN echo "* * * * * /bin/bash /app/callscript.sh >> /app/cron.log 2>&1" > /etc/crontabs/root
# --------------------------------------------------------------
CMD sh -c "crond && crontab -l && npm start"
