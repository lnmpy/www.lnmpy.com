DIST = public
BUCKET = www.lnmpy.com
THEME = Hacker

all: clean build serve

install:
	cd themes && rm -rf ${THEME} && git clone https://github.com/elvismacak/${THEME}.git
	yarn install

clean:
	rm -rf ${DIST}/*

build:
	cp themes/_config.yml themes/${THEME}/
	node_modules/.bin/hexo generate --debug

deploy: clean build
	aws s3 sync ${DIST} s3://${BUCKET} --acl public-read --region ap-northeast-2 --cache-control max-age=86400
	aws s3 cp ${DIST}/index.html s3://${BUCKET}/index.html --acl public-read --region ap-northeast-2 --cache-control no-cache

serve:
	node_modules/.bin/hexo server
