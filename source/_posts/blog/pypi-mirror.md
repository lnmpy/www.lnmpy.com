---
title: pypi本地源的搭建
categories: blog
date: 2014-07-08
---

介于Python的跨平台性，所以这里就不描述我本地的环境了

<!-- more -->

## 安装pypimirror
首先安装pypimirror

    pip install z3c.pypimirror


> 安装的过程中会会出现`BeautifulSoup`版本不匹配的报错

    Downloading/unpacking BeautifulSoup<=3.0.9999 (from z3c.pypimirror)
    Could not find a version that satisfies the requirement BeautifulSoup<=3.0.9999 (from z3c.pypimirror) (from versions: 3.2.0, 3.2.1)
    Cleaning up...
    No distributions matching the version for BeautifulSoup<=3.0.9999 (from z3c.pypimirror)
    Storing debug log for failure in /home/topgear/.pip/pip.log


将`/usr/local/lib/python2.7/dist-packages/z3c.pypimirror-1.0.16-py2.7.egg/EGG-INFO/requires.txt`文件修改一下即可. (这里我是ubuntu的，具体的发行版的配置可能会不一样)

其中有一行是: `BeautifulSoup<=3.0.9999`, 将版本号去掉，即改成:`BeautifulSoup`. 改完之后再重新执行上面的安装命令即可.


## 配置pypimirror.cfg
配置pypimirror.cfg文件，保存路径无所谓

    [DEFAULT]
    # 镜像文件的本地存放路径
    mirror_file_path = /opt/pypi/

    # 远程镜像的url
    base_url =  http://0.0.0.0/pypi

    # 日志文件
    log_filename = /var/log/pypi-mirror.log

    # 防止重复运行的锁文件
    lock_file_name = /tmp/pypi-mirror.lock

    # days to fetch in past on update
    fetch_since_days = 1

    # 需要进行镜像拷贝的文件类型，不在列表中的则不进行拷贝
    filename_matches =
        *.zip
        *.tgz
        *.egg
        *.tar.gz
        *.tar.bz2

    # 需要进行镜像拷贝的文件名称，不在列表中的则不进行拷贝
    # 默认拷贝全部，上面已经删选了类型
    package_matches =
        *

    # 删除本地有而服务器上没有的包
    # 默认是True，会进行删除的，此处我调整为False
    cleanup = False

    # 创建索引文件
    create_indexes = True

    # 显示相信信息
    verbose = True


## 拷贝远程镜像

> 执行`pypimirror -h` 可以看到pypimirror的帮助信息

> -I: 初始化镜像

> -U: 更新镜像(当已经初始化过了，只需要进行同步的更新)

> -i: 为本地文件创建索引

> -c: 同时输出到console中

> -v: 显示详细信息



    pypimirror -c -v -I pypimirror.cfg # 第一次需要初始化
    pypimirror -c -v -U pypimirror.cfg # 如果已经存在本地镜像了则可以进行更新



## 创建本地索引

    pypimirror -c -v -i pypimirror.cfg



## 整合apache
其实就是简单的执行一个软链接而已

    ln -sf /opt/pypi /var/www/pypi



## 使用本地源
使用镜像源很简单，用-i指定就行了:

    easy_install -i http://127.0.0.1/pypi/ django
    pip install -i http://127.0.0.1/pypi/ django


> 当然实际中你会发现有些源即使你指定了第三方的源(本地源)， 它竟然还是从官方的源去下载了, so(=￣ω￣=), 改下pip或者easy_install的源码，替换掉代码中hardcode的官方源吧.

## 参考
 0. [搭建本地pypi服务器](http://www.worldhello.net/2011/03/14/2357.html)
 0. [Setting up a PyPI mirror](http://bluedynamics.com/articles/jens/setup-z3c.pypimirror)
