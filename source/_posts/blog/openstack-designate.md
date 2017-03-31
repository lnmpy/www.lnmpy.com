---
title:  Designate配置及部署
categories: blog
date: 2015-06-10
---

Designate目前还在开发过程中, 且文档资料比较匮乏, 此处的介绍的内容就相对比较片面和不是那么严整了, 若有相应的错误,也请包涵并及时指正。

## Designate的工作原理
此处有一张图,用来描述designate的运行流程:

<img style="width:100%;" src='/images/blog/Designate-MiniDNS-Pools.gif'></img>
> gif动态图片, 参考[Designate-MiniDNS-Pools](https://wiki.openstack.org/w/images/a/a7/Designate-MiniDNS-Pools.gif)

0. 用户请求designate-api,添加record或者domain
0. designate-api发送请求至mq中
0. designate-central接收到mq请求,写入db,同时通过mq触发pool_manager进行更新操作
0. pool_manager通过rndc(addzone/delzone/notifyzone)三个操作来通知pool_targets中定义的bind来进行操作
0. bind使用axfr来请求同步mdns
0. mdns从数据库中读取相应的domain信息来响应axfr请求

## Designate的安装

此处只描述和介绍其中一种可用的部署模式(其应该具有多种部署模式, 此处就没有深究了)

架构如图(DB,MQ略):

<img style="width:100%;" src='/images/blog/designate_flow.png'></img>

> 按照目前个人的理解, 在kilo版本种, 一个pool_manager进程就管理一个pool, pool中可以指定多个dns-server. 但不一定准确

安装环境:

- 系统为`Ubuntu 12.04`
- `designate-api`, `designate-central`, `designate-pool-manager`, `designate-mdns`部署在 `172.16.2.100`
- `bind`分别部署在`172.16.2.101`, `172.16.2.102`, `172.16.2.103`中
- 测试domain为`lnmpy.com`
- 使用kilo版本的designate


### 配置bind & rndc(只以安装Bind-A为例, 其余类推)

安装 bind

    apt-get install bind9 -y


修改`/etc/bind/named.conf.options`内容为:

    options {
            directory "/var/cache/bind";
            dnssec-validation auto;
            auth-nxdomain no;
            allow-new-zones yes;  # 此配置必须加上, 其允许rndc进行zone的相关操作
            listen-on { <your-ip>; };  # 表面bind的53端口是监听在这个网络中
            listen-on-v6 { any; };
    };

    controls {
            inet 172.16.2.101 port 953
                    allow { 172.16.2.100; } keys { "rndc-key"; };
    };

    # 以下内容来自: rndc-confgen
    key "rndc-key" {
            algorithm hmac-md5;
            secret "jmED6H54nY+DD/SRJG6Okw==";
    };


修改`/etc/bind/rndc.key`内容为(secret值保持与named.conf.options中一致):

    key "rndc-key" {
            algorithm hmac-md5;
            secret "jmED6H54nY+DD/SRJG6Okw==";
    };


在`172.16.2.100`中调用以下命令进行测试:


    rndc -s 172.16.2.101 -p 953 -k /etc/bind/rndc.key addzone lnmpy.com '{ type slave;masters { 172.16.2.100 port 5354;}; file "slave.lnmpy.com.ba4dbff3-a32f-4f54-bb7c-68710f7935a5"; };'


如果没有报错且`172.16.2.101`机器中的`/var/cache/bind/`出现了`slave.lnmpy.com.ba4dbff3-a32f-4f54-bb7c-68710f7935a5`, 则表明`bind`配置成功.


### 配置Designate(以全部安装在同一个机器上为例)

安装MySql,RabbitMq, 配置从略:

    apt-get install -y rabbitmq-server mysql-server python-dev libmysqlclient-dev

    git clone git://github.com/openstack/designate designate
    cd designate
    git checkout stable/kilo # checkout出指定版本
    pip install virtualenv
    virtualenv .venv
    source .venv/bin/activate
    sed -i 's/oslo.config>=1.9.3,<1.10.0  # Apache-2.0/oslo.config>=1.9.3,<=1.11.0  #Apache-2.0/' requirements.txt
    pip install -r requirements.txt -i http://pypi.douban.com/simple  # 视网络情况可能会有超时失败多次,重复运行一次就行
    while [ $? != 0 ]
    do
    pip install -r requirements.txt -i http://pypi.douban.com/simple
    done
    pip install mysql-python functools32 -i http://pypi.douban.com/simple
    python setup.py install
    cp -R etc/designate /etc/
    ls /etc/designate/*.sample | while read f; do sudo cp $f $(echo $f | sed "s/.sample$//g"); done
    mkdir /var/log/designate/ /var/cache/designate


修改`/etc/designate/designate.conf`

    [DEFAULT]
    verbose = True
    debug = True
    state_path = /var/lib/designate
    logdir = /var/log/designate
    notification_driver = messaging
    notification_topics = notifications

    # 默认的quota值， 按需设置
    quota_domains = 100000
    quota_domain_recordsets = 100000
    quota_domain_records = 100000
    quota_recordset_records = 100000

    [oslo_messaging_rabbit]
    rabbit_userid = guest # 默认不配置RabbitMq的话是guest, 建议修改
    rabbit_password = guest
    rabbit_virtual_host = /
    rabbit_use_ssl = False
    rabbit_hosts = 127.0.0.1:5672
    [service:central]
    [service:api]
    auth_strategy = noauth # 此处为了便利, 关闭了auth认证
    enable_api_v1 = True
    enabled_extensions_v1 = sync, quotas
    enable_api_v2 = True
    [service:mdns]
    threads = 1000
    host = 0.0.0.0
    port = 5354
    tcp_backlog = 100
    tcp_recv_timeout = 0.5
    query_enforce_tsig = False
    [service:pool_manager]
    pool_id = 794ccc2c-d751-44fe-b57f-8894c9f5c842
    [pool_manager_cache:sqlalchemy]
    connection = mysql://root:r00t@127.0.0.1/designate_pool_manager
    [storage:sqlalchemy]
    connection = mysql://root:r00t@127.0.0.1:3306/designate
    connection_debug = 0
    [pool:794ccc2c-d751-44fe-b57f-8894c9f5c842]
    nameservers = 0f66b842-96c2-4189-93fc-1dc95a08b012, 0f66b842-96c2-4189-93fc-1dc95a08b013
    targets = f26e0b32-736f-4f0a-831b-039a415c481e, f26e0b32-736f-4f0a-831b-039a415c481f
    [pool_nameserver:0f66b842-96c2-4189-93fc-1dc95a08b012]
    port = 53
    host = 172.16.2.101
    [pool_target:f26e0b32-736f-4f0a-831b-039a415c481e]
    options = rndc_host: 172.16.2.101, rndc_port: 953, rndc_key_file: /etc/bind/rndc.key
    masters = 172.16.2.100:5354
    type = bind9
    port = 53
    host = 172.16.2.101
    [pool_nameserver:0f66b842-96c2-4189-93fc-1dc95a08b013]
    port = 53
    host = 172.16.2.102
    [pool_target:f26e0b32-736f-4f0a-831b-039a415c481f]
    options = rndc_host: 172.16.2.102, rndc_port: 953, rndc_key_file: /etc/bind/rndc.key
    masters = 172.16.2.100:5354
    type = bind9
    port = 53
    host = 172.16.2.102
    [pool_nameserver:0f66b842-96c2-4189-93fc-1dc95a08b014]
    port = 53
    host = 172.16.2.103
    [pool_target:f26e0b32-736f-4f0a-831b-039a415c4820]
    options = rndc_host: 172.16.2.103, rndc_port: 953, rndc_key_file: /etc/bind/rndc.key
    masters = 172.16.2.100:5354
    type = bind9
    port = 53
    host = 172.16.2.103

初始化数据库

    mysql -uroot -pr00t  -e 'drop database if exists designate; create database designate;'
    mysql -uroot -pr00t  -e 'drop database if exists designate_pool_manager; create database designate_pool_manager;'

    designate-manage database sync
    designate-manage pool-manager-cache sync

启动Designate

    # 在virtualenv中启动下面四个组件(无顺序要求)
    designate-central
    designate-api
    designate-pool-manager
    designate-mdns


如无报错,则表面正常启动, 再将其包装成upstart即可

## Designate的API

此处使用了[httpie](https://github.com/jakubroztocil/httpie)作为客户端,也可以试用postmane或者curl

    http 127.0.0.1:9001/v1/servers name=ns.lnmpy.com.

    http 127.0.0.1:9001/v1/domains name=lnmpy.com. ttl:=3600 email=elvis@lnmpy.com

    http 127.0.0.1:9001/v1/domains/{domain_id}/records name=www.lnmpy.com. type=A data=192.168.1.101
    http 127.0.0.1:9001/v1/domains/{domain_id}/records name=mail.lnmpy.com. type=A data=192.168.1.102

    dig @172.16.2.101 www.lnmpy.com
    dig @172.16.2.102 www.lnmpy.com
    dig @172.16.2.103 www.lnmpy.com

    # 如果要创建PTR反向解析的话， 需要再单独创建一个domain
    # 注：反向解析域必须以 in-addr.arpa. 结尾， designate只支持在 in-addr.arpa.的域中添加PTR记录
    http 127.0.0.1:9001/v1/domains name=1.168.192.in-addr.arpa. ttl:=3600 email=elvis@lnmpy.com

    http 127.0.0.1:9001/v1/domains/{ptr_domain_id}/records name=102.1.168.192.in-addr.arpa. type=PTR data=mail.lnmpy.com.

    dig @172.16.2.101 -x 192.168.1.101
    dig @172.16.2.102 -x 192.168.1.101
    dig @172.16.2.103 -x 192.168.1.101


可以看到,通过dig测试,返回的结果表面3台bind-server均可(包括反向解析)解析www.lnmpy.com.

## Designate HA

MQ, DB的HA不必说了。

- `desigante-api`只会涉及到读取DB和rpc调用`designate-central`, 所以使用`nginx`在多台机器上部署,都没有问题
- `desigante-central`会被`desigante-api`rpc调用,但是有oslo.concurrency的存在,也只会有一个被调用到, 所以在不同的机器中部署,也是没有问题的。其被调用后会发送一条mq消息给`designate-pool-manager`
- 由于mq的消息是独占性的,`desigante-pool-manager`之间的消息自然也不会发生抢占,部署多个自然也是允许的
- `desigante-mdns`逻辑上来讲也是只读取db并且响应`axfr`请求, 只要pool中的bind能够实现`multi-master`即可

修改`pool_target`内容为:

    [pool_target:f26e0b32-736f-4f0a-831b-039a415c4820]
    ...
    masters = 172.16.2.100:5354, 172.16.2.200:5354   # masters列表
    ...


那么`/var/cache/bind/3bf305731dd26307.nzf`中对应的zone就变成了:


    ...
    zone lnmpy.com { type slave; masters { 172.16.2.100 port 5354; 172.16.2.200 port 5354;}; file "slave.lnmpy.com.60987de9-97a1-4ecf-a124-3f148b21af78"; };
    ...


这样,当其中一个mdns down了之后,bind依然能够sync另一个mdns


## 参考
0. [Designate Developer Docs](http://docs.openstack.org/developer/designate/)
0. [Installing Juno on Ubuntu](http://docs.openstack.org/developer/designate/install/ubuntu-juno.html)
0. [Designate Rest API](http://docs.openstack.org/developer/designate/rest.html)
0. [designate-overview-openstack](http://www.slideshare.net/grahamhayes/designate-overview-openstack-summit-paris-presentation)
0. [Designate-MiniDNS-Pools](https://wiki.openstack.org/w/images/a/a7/Designate-MiniDNS-Pools.gif)
0. [DNS视图及bind中rndc的使用](http://wubinary.blog.51cto.com/8570032/1378363)
