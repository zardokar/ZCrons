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
RUN chmod +x /app/callscript.sh
RUN echo "*/1 * * * * /bin/bash /app/callscript.sh >> /app/cron.log 2>&1" > /etc/crontabs/root
# --------------------------------------------------------------
CMD sh -c "crond && crontab -l && npm start"
