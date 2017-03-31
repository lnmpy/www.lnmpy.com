---
title:  /etc/resolv.conf中search和domain的作用
categories: blog
date: 2013-12-21
---

对这个一开始是一种半解的，Google打不开，顺手百度了半天都找不出一个合理的解释。。无语中。

"nameserver"指定要进行域名解析的dnsserver的IP地址。可以定义多个IP地址，按照顺序来请求

"domain"指定本地的domain，如果查询时的域名没有包含"."，则会在此后面加上domain的值来进行解析

"search"若搜索的域名没有找到，则将域名拼接上search来搜索。下面会有例子来说明。

现实中有"qing.blog.sina.com.cn"，下面就以这个来说明，主要是说明"domain"和"search"的意义。

/etc/resolv.conf配置如下

    nameserver 192.168.1.1
    nameserver 8.8.8.8
    domain  sina.com.cn
    search  sina.com baidu.com


    ping qing.blog.sina.com.cn   ### 这里就老老实实的走nameserver吧
    ping blog
    ### 按顺序查找<strong>blog</strong>，<strong>blog.sina.com.cn</strong>,<strong>blog.sina.com</strong>和<strong>blog.baidu.com</strong>
    ### 这里的顺序是<strong>nameserver,domain,search</strong>

    ping qing.blog
    ### 此处就只查找<strong>qing.blog</strong>，<strong>qing.blog.sina.com</strong>和<strong>qing.blog.baidu.com</strong>
    ### 这里的顺序是<strong>nameserver,<s>domain,</s>search</strong>
    ### domain此时没有起到作用，因为其定义是<strong>当搜索的domain没有"."时，则优先搜索domain，否则跳过</strong>

OK，这里基本上就可以说明/etc/resolv.conf的配置了，简单明了


写一篇博客，确实很花时间，这段时间比较忙，以后再抽空整理下学习OpenStack的心得。
