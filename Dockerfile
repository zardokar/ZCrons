FROM node:23.11-alpine
# --------------------------------------------------------------
WORKDIR /app
# --------------------------------------------------------------
COPY . .
# --------------------------------------------------------------
RUN npm install
# --------------------------------------------------------------
RUN chmod +w -R /app/db

RUN chmod 0644 /etc/cron.d/zcronjob \
    && crontab /etc/cron.d/zcronjob \
    && chmod +x /app/callscript.sh
# --------------------------------------------------------------
RUN * * * * * /app/callscript.sh >/dev/null 2>&1
# checking whether the current user has any scheduled jobs
RUN crontab -l
# --------------------------------------------------------------
CMD ["npm", "start"]
