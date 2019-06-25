export PATH := node_modules/.bin/:$(PATH)

SHELL = /bin/bash
dist = public

bucket = www.lnmpy.com
theme = Hacker

all: clean build serve

install:
	cd themes && rm -rf $(theme) && git clone https://github.com/elvismacak/$(theme).git
	yarn install

clean:
	rm -rf $(dist)/*

build:
	cp themes/_config.yml themes/$(theme)/
	hexo g --debug

deploy: clean build
	aws s3 sync $(dist) s3://$(bucket) --acl public-read --region ap-northeast-2 --cache-control max-age=86400
	aws s3 cp $(dist)/index.html s3://$(bucket)/index.html --acl public-read --region ap-northeast-2 --cache-control no-cache

serve:
	hexo server -i 0.0.0.0 -o
