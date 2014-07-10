download:
	./download.sh

upload:
	./upload.sh

process:
	./process_latest.sh
	./process_flatten.sh

all: download upload process
