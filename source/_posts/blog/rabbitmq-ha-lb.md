---
title:  RabbitMQ HA和LB的配置
categories: blog
date: 2014-11-12
tag:
- RabbitMQ
- Linux
- Server
---

rabbitmq是使用erlang开发的,集群非常方便,且天生就支持并发分布式,但自身并不支持负载均衡. 常规的博客介绍都是说rabbitmq有几种部署模式,其中最常用的也就两种:

0. 单一模式: 就是不做ha...
0. 镜像模式模式: active/active模式的ha,当master挂掉了,按照策略选择某个slave(其实就是最先加入集群的那个slave)来担当master的角色

下面就直接切入正题,在实际中该如何针对rabbitmq进行ha

### 配置网络环境
实验中使用三台机器(mq-cluster1,2,3)来进行部署实验, 系统均为ubuntu-14.04, amd64, 直接将以下内容其加到`/etc/hosts`文件中.

其中`mq-cluster1`为master,其余的为slave

{% codeblock %}
10.22.129.57 mq-cluster1
10.22.129.58 mq-cluster2
10.22.129.59 mq-cluster3
{% endcodeblock %}

### 安装rabbitmq-server

{% codeblock %}
apt-get install -y rabbitmq-server
{% endcodeblock %}

### 同步erlang.cookie文件
rabbitmq集群是依赖erlang的集群来工作的,所以要保证集群中每个rabbitmq的`/var/lib/rabbitmq/.erlang.cookie`内容是一样的.

我是以`mq-cluster1`为master的,所以需要将其内容覆盖到`mq-cluster2`和`mq-cluster3`中

{% codeblock %}
service rabbitmq-server stop
# 你也可以选择其它方式来进行同步
scp root@mq-cluster1:/var/lib/rabbitmq/.erlang.cookie /var/lib/rabbitmq/.erlang.cookie
service rabbitmq-server start
{% endcodeblock %}


### 设置ha模式
`rabbitmqctl set_policy [-p <vhostpath>] [--priority <priority>] [--apply-to <apply-to>] <name> <pattern> <definition>`

- name 策略名称
- pattern  正则表达式,用来匹配资源,符合的就会应用设置的策略
- definition 是json格式设置的策略。
- apply-to 表示策略应用到什么类型的地方,一般有queues,exchange和all,默认是all
- priority 是个整数优先级

其中`ha-mode`有三种模式:

- all: 同步至所有的.
- exactly: 同步最多N个机器. 当现有集群机器数小于N时,同步所有,大于等于N时则不进行同步. N需要额外通过`ha-params`来指定.
- nodes: 只同步至符合指定名称的nodes. N需要额外通过`ha-params`来指定.

{% codeblock %}
// 这里设置的是同步全部的queue, 可以按需自己选择指定的queue
rabbitmqctl  set_policy ha-all '.*' '{"ha-mode":"all"}'
{% endcodeblock %}

### cluster2,3加入集群
在`mq-cluster2`和`mq-cluster3`中分别执行:

{% codeblock %}
rabbitmqctl stop_app
rabbitmqctl join_cluster rabbit@mq-cluster1
rabbitmqctl start_app
{% endcodeblock %}

加入之后, 可以通过`rabbitmqctl cluster_status`来查看cluster状态.

ps:
> 默认加入是一`disc`模式加入,可以执行`rabbitmqctl change_cluster_node_type <ram|disc>`进行模式的修改

以上是在rabbitmq 3.*中使用, 而在rabbitmq 2.*中使用:

{% codeblock %}
rabbitmqctl stop_app
rabbitmqctl force_cluster rabbit@mq-cluster1 # 不加自己的node_name, 是ram模式
rabbitmqctl force_cluster rabbit@mq-cluster1 rabbit@mq-cluster2 # 加自己的node_name, 是disc模式
rabbitmqctl start_app
{% endcodeblock %}

### 测试rabbitmq的ha

测试的python代码,依次发送消息到三个rabbitmq-server中,

{% codeblock %}
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pika

mq_servers = ['10.22.129.57', '10.22.129.58', '10.22.129.59']
mq_exchange = 'test_exchange'

queue_name = 'test'
routing_key = 'test.test'
message = 'msg'

for mq_server in mq_exchange:
    try:
        connection = pika.BlockingConnection(pika.ConnectionParameters(host=mq_server))
        channel = connection.channel()
        channel.exchange_declare(exchange=mq_exchange, type='topic', durable=True, auto_delete=False)
        channel.queue_declare(queue=queue_name, durable=True, exclusive=False, auto_delete=False)
        channel.queue_bind(exchange=mq_exchange, queue=queue_name, routing_key=routing_key)

        channel.basic_publish(exchange=mq_exchange,
                              routing_key=routing_key,
                              body=message,
                              properties=pika.BasicProperties(content_type='text/plain',
                                                              delivery_mode=2)
                              )

        channel.close()
        connection.close()
        print 'success: ' + mq_server
    except:
        print 'failed: ' + mq_server
{% endcodeblock %}


可以随机的操作去关闭任意一个`mq-cluster`上的`rabbitmq-server`服务, 再通过`rabbitmqctl list_queues`来查看消息的数量. 可以看到,尽管master挂了,消息依然能够发送成功,且当挂掉的机器(master或者slave)重新起起来之后,消息会马上同步过去.

### 搭建haproxy

安装和初始配置haproxy此处就从略.

在配置好的`/etc/haproxy/haproxy.cfg`尾端加上以下内容

{% codeblock %}
listen  rabbitmq 0.0.0.0:56720
    mode    tcp
    balance roundrobin
    option  tcplog
    option  tcpka
    server  rabbit1 192.168.100.67:5672 check inter 5000
    server  rabbit2 192.168.100.68:5672 check inter 5000
    server  rabbit3 192.168.100.69:5672 check inter 5000
{% endcodeblock %}

接着启动haproxy

{% codeblock %}
haproxy -f /etc/haproxy/haproxy.cfg -D
{% endcodeblock %}

### 测试rabbitmq的haproxy下的lb

将之前的测试代码中的

{% codeblock %}
mq_servers = ['10.22.129.57', '10.22.129.58', '10.22.129.59']
{% endcodeblock %}

改成

{% codeblock %}
mq_servers = ['10.22.129.53', '10.22.129.53', '10.22.129.53']
{% endcodeblock %}


执行测试代码,发现三个消息均发送成功,然后即使手动关闭其中一台mq,消息依然发送成功,通过`rabbitctl list_queues`也依然可以看到消息是成功收到３条的.

至此，可以看到rabbitmq-server成功的解除了`single-point`状态.


### 参考

0. [rabbitmq-ha](https://www.rabbitmq.com/ha.html)
0. [rabbitmqctl命令介绍](http://my.oschina.net/guol/blog/186445)
0. [软件级负载均衡器(LVS/HAProxy/Nginx)的特点简介和对比](http://yuhongchun.blog.51cto.com/1604432/697466)
