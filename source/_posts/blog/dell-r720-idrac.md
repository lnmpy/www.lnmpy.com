---
title:  Dell R720 ipmi配置
categories: blog
date: 2014-09-15
---

IPMI是一个intel,hp,dell等提出的一个跨软硬件平台的工业标准,用户可以通过其来监控或获取服务器的状态,但是需要提前配置

## R720的配置

**着重说明一下版本信息为1.57, 对于这个配置,不同的版本界面及配置均有所区别**

重启进去`System Setup`界面,选择`iDRAC Settings`:
<img src="/images/blog/idrac-config.png" style="width:98%;">

进入后,先配置`Network`:
<img src="/images/blog/choose_network.png" style="width:98%;">
先后在这个页面中配置了：

- 启动iDrac网卡
- 设置idrac的ip
- 启用ipmi

<img src="/images/blog/enable_idrc.png" style="width:98%;">
如果服务器启用了idrac卡,在`Nic Selection`可以看到这个`Dedicated`的专用网卡,否则只能看到`LOM1`,`LOM2`(为`Lan Of MotherBoard`的缩写)这样的配置。没有这个只是功能缩减了一点,其余的配置依然相同。
<img src="/images/blog/set_idrac_ip.png" style="width:98%;">
启用`ipmi`后可以通过`ipmitool`来进行远程管理了
<img src="/images/blog/enable_ipmi.png" style="width:98%;">

配置完网络后,再配置`User Configuration`,只是配置一下用户名及密码即可:
<img src="/images/blog/user_confuguration.png" style="width:98%;">
<img src="/images/blog/set_user_passwd.png" style="width:98%;">


## ipmitool的安装及使用


	# 先安装ipmitool
	apt-get install -y openipmi ipmitool

	# 启动openimpi服务,否则会报错
	service openipmi start

接下来就直接执行了

	# ipmitool -I <open|lan|lanplus> -U <user> -P <passwd> command
	ipmitool -I open
	ipmitool -I lanplus .. chassis power staus

这里面有个Interface是需要区分的,使用的不对则会报错。[我就不解释了,直接粘出处](http://manpages.ubuntu.com/manpages/lucid/man1/ipmitool.1.html#contenttoc10).



在实际中我只碰到这个问题：`Error: Unable to establish LAN session`。 其有可能是由两个问题引起的:

0. 在idrac配置中,没有启用impi
0. openipmi服务想没有启动
0. 不同的ipmi版本使用的`Interface`版本也不相同,尝试`lan`和`lanplus`或者几个其他的Interface试一下

## 参考
0. [使用 ipmitool 实现 Linux 系统下对服务器的 ipmi 管理](http://www.ibm.com/developerworks/cn/linux/l-ipmi/index.html)
0. [Cobbler Dell ipmi 设置](http://tinytub.github.io/Cobbler-Dell-ipmi.html)
