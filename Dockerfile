FROM node:23.11-alpine


ARG CRON_FORM="0 0 * * *"
# --------------------------------------------------------------
# set timezone 
ENV TZ='Asia/Bangkok'
# --------------------------------------------------------------

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
RUN echo "*/2 * * * * /bin/bash /app/callscript.sh >> /app/cron.log 2>&1" > /etc/crontabs/root
# --------------------------------------------------------------
CMD sh -c "crond && crontab -l && npm start"
