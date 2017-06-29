export PATH := node_modules/.bin/:$(PATH)

SHELL = /bin/bash
bucket = www.lnmpy.com
folder = public

all: clean build serve

install:
	cd themes && rm -rf Hacker && git clone git@github.com:elvis-macak/Hacker.git
	npm install

clean:
	rm -rf $(folder)/*

build:
	cp themes/_config.yml themes/*/
	hexo g --debug

deploy: clean build
	aws s3 sync $(folder) s3://$(bucket) --acl public-read --region ap-northeast-2

serve:
	hexo server
