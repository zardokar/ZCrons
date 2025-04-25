NAME_IMAGE="koh/cronjob"
NAME_CONTAINER="cronjob"
TAG="latest"
DOCNET=bridge-net
LOC_PORT=9978
PUB_PORT=9978

sudo docker stop $NAME_CONTAINER

sudo docker rm $NAME_CONTAINER

sudo docker build -t $NAME_IMAGE:$TAG .

sudo docker run --name $NAME_CONTAINER\
	--network $DOCNET \
	--restart always \
	--log-opt max-size=1g --log-opt max-file=1 \
	-p $PUB_PORT:$LOC_PORT \
	-d $NAME_IMAGE:$TAG

# Clean Container
sudo docker rm $(docker ps -a -f status=exited -q)
# Clean Images
sudo docker rmi $(docker images -f "dangling=true" -q)
