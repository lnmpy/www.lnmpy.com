export PATH := node_modules/.bin/:$(PATH)

SHELL = /bin/bash
dist = public

bucket = www.lnmpy.com
theme = Hacker

all: clean build serve

install:
	cd themes && rm -rf $(theme) && git clone git@github.com:elvis-macak/$(theme).git
	npm install

clean:
	rm -rf $(dist)/*

build:
	cp themes/_config.yml themes/$(theme)/
	hexo g --debug

deploy: clean build
	aws s3 sync $(dist) s3://$(bucket) --acl public-read --region ap-northeast-2

serve:
	hexo server
