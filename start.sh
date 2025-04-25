NAME_IMAGE="zdk/zcrons"
NAME_CONTAINER="zcrons"
TAG="latest"
DOCNET=bridge-net
LOC_PORT=9978
PUB_PORT=9978
SCRIPT_FILE="callscript.sh"

sudo docker stop $NAME_CONTAINER

sudo docker rm $NAME_CONTAINER

sudo docker build -t $NAME_IMAGE:$TAG .

sudo docker run --name $NAME_CONTAINER\
	--network $DOCNET \
	--restart always \
	--log-opt max-size=50m --log-opt max-file=1 \
	-v ${PWD}/$SCRIPT_FILE:/app/callscript.sh \
	-p $PUB_PORT:$LOC_PORT \
	-d $NAME_IMAGE:$TAG

# Clean Container
sudo docker rm $(docker ps -a -f status=exited -q)
# Clean Images
sudo docker rmi $(docker images -f "dangling=true" -q)
