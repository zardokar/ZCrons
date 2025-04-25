FROM node:23.11-alpine
# --------------------------------------------------------------
WORKDIR /app
# --------------------------------------------------------------
COPY . .
# --------------------------------------------------------------
RUN npm install
# --------------------------------------------------------------
RUN apk update
RUN apk add --no-cache curl dcron
# --------------------------------------------------------------
RUN * * * * * /app/callscript.sh >/dev/null 2>&1

RUN crond -f -l 8
# checking whether the current user has any scheduled jobs
RUN crontab -l
# --------------------------------------------------------------
CMD ["npm", "start"]
