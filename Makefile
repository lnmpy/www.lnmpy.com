export PATH := node_modules/.bin/:$(PATH)

SHELL = /bin/bash
bucket = www.lnmpy.com
folder = public

all: build serve

install:
	npm install

clean:
	rm -rf $(folder)/*

build:
	hexo g

deploy: clean build
	aws s3 sync $(folder) s3://$(bucket) --acl public-read --region ap-northeast-2

serve:
	hexo server
