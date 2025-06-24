# ZCrons


### Example .env file
```
CRON_FORM='0 1 * * *'
DATE_OFFSET=0
ONLY_ON_METHOD="GET,post"
TARGET_COUNT=1
TARGET_01_URL=https://target url
TARGET_01_METHOD=POST
```

change .env if want to call every min
```
CRON_FORM='* * * * *'
```

change .env if want to call every 5 min
```
CRON_FORM='*/5 * * * *'
```