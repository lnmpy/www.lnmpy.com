---
title: Proxychains Cross GFW
date: 2017-09-21 13:15:00
tags:
- Shandowsocks
- Proxychains
- GFW
---

## 前言
做为一个dev肯定要经常访问404的page, shadowsocks在这里面作为一个不可或缺的一环(此处不展开), 但大家通常的做法只是用其来proxy浏览器的请求.
实际上配置好Proxychains就可以无缝的在commandline中使用一些有特殊要求的app了.

基于某些原因这里不能做太多的展开, 只是介绍一下配置, 作为mark.


## 配置文件

将以下内容保存为`proxychains.conf`
```
# proxychains.conf  VER 4.x
strict_chain
quiet_mode
proxy_dns
remote_dns_subnet 224
tcp_read_time_out 15000
tcp_connect_time_out 8000
[ProxyList]
# socks5     IP PORT
socks5     127.0.0.1 1086
```

最后一行修改为对应的shadowsocks的ip/port, 需要与shadowsocks配置匹配, 如下

<img src="/images/blog/shadowsocks-config.jpg">


## Mac上安装
```
brew install proxychains-ng
cp ./proxychains.conf /usr/local/etc/proxychains.conf

# 由于Mac的SIP限制, proxychanis 不能运行system app
proxychains4 curl google.com  X # because curl is in /usr/bin
proxychains4 npm install uuid  √ # because npm is in /usr/local/bin, not a system app

# 如果需要这个, 则需要关闭SIP的部分限制
csrutil enable --without debug
```

## Ubuntu14.04

apt-get安装的proxychains版本太老无法使用了, 需要通过源码安装

```
git clone https://github.com/rofl0r/proxychains-ng.git
cd proxychains-ng
./configure --prefix=/usr --sysconfdir=/etc && make
sudo make install
sudo cp ./proxychains.conf /etc/proxychains.conf
```


## 用法

```
proxychains4 curl google.com
proxychains4 firebase init

# Mac open gui app in mac with proxy default
proxychains4 open '/Applications/Backup and Sync.app/'  # 使用GoogleDrive
```
