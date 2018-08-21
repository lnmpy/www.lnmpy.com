---
title: AngularJs Nginx的配置
date: 2016-07-22 15:03:55
tags:
- nginx
- server
- angular
---


最近为一个angular的project配置Nginx时踩了些坑, 在此mark一下.

<!-- more -->

## 定义
`proxy_pass`: 就是域名的代理, 将匹配的url请求转发到对应的domain中, 简单用法如下:
```
location ^~ /api/ {
proxy_pass http://example.com/mock-api;
}
```

`rewrite`: 重写url, 支持正则匹配和分组提取, 简单用法如下:


```
rewrite /api/(.+)$ /mock-api/$1 break;
```

> rewrite 有几种不同的flag: last, break等. 常用的就这两个.

## 背景

Angular中的请求规则一般很简单, 主要分为三类:

0. index.html
0. 各种js, css等static资源
0. api

先介绍下背景, 一开始`api-server`负责所有的请求和资源, nginx的配置也就非常简单, 就是将所有的请求都转给api-server中.

简化版的配置如下:

```
location @server {
    proxy_pass http://localhost:8080;
}
location /api {
    allow 176.168.2.100;
    try_files $url @server;
}

location /static {
    expires 86400;
    try_files $url @server;
}

location / {
    expires -1;
    try_files $url @server;
}
```

不过基于性能的考虑, 要将`index.html`和`static`资源都放在cdn中, `api-server`就只负责api那一部分. 所以nginx的配置变成了这样:

**先提前说下, 下面的配置里面有两个bug**

```
location /api {
    allow 176.168.2.100;
    proxy_pass http://localhost:8080;
}

location /static {
    expires 86400;
    rewrite ^/.*$ /;
    proxy_pass http://cdn/prod/static;
}

location / {
    expires -1;
    rewrite ^/.*$ /index.html;
    proxy_pass http://cdn/prod;
}
```

## bug1: rewrite 匹配循环

> 好吧, 这里一开始是不清楚rewrite flag的区别

```
rewrite ^/.*$ /index.html;
// 会rewrite后重新进行location的匹配
// 也就是说 `location /`会一次一次的匹配自己, 导致nginx报错
// 所以应该改成下面这样, break表明不再进行location的匹配

rewrite ^/.*$ /index.html break;
```

## bug2: proxy_pass与rewrite一起忽略后缀

```
// 单独一个proxy_pass, 所有请求都会转到 http://cdn/prod
location / {
    proxy_pass http://cdn/prod;
}
```

```
// 按照这个的预期, 所有请求都会转到 http://cdn/prod/index.html
location / {
    rewrite ^/.*$ /index.html break;
    proxy_pass http://cdn/prod;
}
```

但事实并非如此, 实际中所有的请求都被转到了 `http://cdn/index.html`, `rewrite` 与 `proxy_pass`一起, `proxy_pass`就只认host部分

```
location / {
    rewrite ^/.*$ /prod/index.html break;
    proxy_pass http://cdn;
}
```

这个限制完全没有想到, 通过debug_log一步一步的调试出来, 也是非常的无奈, 所以, proxy_pass比较好的使用方式就是只proxy domain比较好.


## fixed: 正解
所以正解应该为:
```
location /api {
    allow 176.168.2.100;
    proxy_pass http://localhost:8080;
}

location /static {
    expires 86400;
    rewrite ^/.*$ /;
    proxy_pass http://cdn/prod/static;
}

location / {
    expires -1;
    rewrite ^/.*$ /prod/index.html;
    proxy_pass http://cdn;
}
```

## 参考
0. [Official Reference](http://nginx.org/en/docs/http/ngx_http_proxy_module.html)
0. [nginx配置location总结及rewrite规则写法](http://seanlook.com/2015/05/17/nginx-location-rewrite/)
