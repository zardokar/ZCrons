FROM node:23.11-alpine
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
RUN echo "*/1 * * * * /bin/bash /app/callscript.sh >> /app/cron.log 2>&1" > /etc/crontabs/root

RUN crond -f -l 8

# checking whether the current user has any scheduled jobs
RUN crontab -l
# --------------------------------------------------------------
CMD ["npm", "start"]
