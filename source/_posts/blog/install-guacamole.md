---
title:  Ubuntu上搭建Guacamole
categories: blog
date: 2013-11-26
---

Leader提出让我自己去了解一下Guacamole这个开源项目，自己一看，以前也没有接触过VNC之类的东西，个人对于这种开源的项目并没有太大感觉。 不过就像当初没有用过ssh之前，我一样觉得这个应该可以很快的上手。OK，进入正题，首先就是环境的搭建了。

## Guacamole的原理

引用官方的原理图(或者说叫流程图)。

<a href="http://guac-dev.org/" title="Guacamole结构图" target="_blank"><img src="http://guacamole.incubator.apache.org/doc/gug/images/guac-arch.png" alt="Guacamole结构图"></a>

VNC之类的原理咱就先跳过不管了，这里面先简单说下各个模块:

`Web Browser`：普通的用户，使用的HTML5与后台进行交互。

`Guacamole`:处理与用户的交互，将页面上的操作请求处理下，再直接与下层的`guacd`来交互。

`guacd`:封装了各种RDP协议的中间层，如VNC等。

从图中可以看到，这个架构使得底层的guacd基本不需要进行什么修改和扩展了，直接部署上去就完事了，管你前端Web页面要改得怎样花里花俏的。

为啥这样，guacd使用C++实现的，底层处理封装各种不同的RDP，性能肯定高些，而用Java来生成前端则是方便吧，用PHP、Python等也可以，反正`Guacamole`和`guacd`的交互是采用独家的guacamole协议。这种设计思想和X-11是多么的神似。

## Guacamole的部署(此处我以Ubuntu-12.04为例)
### VNCServer的安装启动
ubuntu上安装VNC server很简单:

    sudo apt-get install vnc4server

安装完后要给当前用户设置密码，这个密码就是连接VNC时要用到的:
接着输入:

    vncserver :1  # :1 表示显示号，启启用的端口为5901


`:1`代表display-number，这里我用Chrome的插件[VNC Viewer](https://chrome.google.com/webstore/detail/vnc-viewer-for-google-chr/iabmpiboiopbgfabjmgeedhcmjenhbla?utm_source=chrome-ntp-launcher)来测试的。连上去当然只有一个ssh客户端了，配置下也可以连各种X-window，这个不是我们的重点。

注意vncserver默认的端口是5900,如果采用VNC客户端的话，直接使用display-number即可，涉及到具体端口的，则使用端口`display-number+5900`，从`0`开始。

### Guacamole-Web的部署
接下来安装Java-Web端的环境，直接输入，就会自动把依赖的环境也配置好。

    sudo apt-get install guacamole-tomcat
    //会提示重启tomcat，确认即可

其就是安装好java,tomcat之后，发布guacamole的war包。同时在`/etc/guacamole`中可以看到两个配置文件:`guacamole.properties`和`user-mapping.xml`

guacamole.properties的配置如下:

    // guacd服务绑定的ip和port，必须和guacd中配置相同
    guacd-hostname: localhost
    guacd-port:     4822

    //这个不用管
    auth-provider: net.sourceforge.guacamole.net.basic.BasicFileAuthenticationProvider
    basic-user-mapping: /etc/guacamole/user-mapping.xml

user-mapping.xml的配置如下:

    <user-mapping>
        <authorize username="USERNAME" password="PASSWORD"> //在浏览器中的登录账号密码
            <protocol>vnc</protocol> //rdp类型
            <param name="hostname">localhost</param> //VNC的ip，可以是任意的ip和hostname，此处以本机为例
            <param name="port">5901</param> //这个和你的VNC端口类似，注意其对应于 :1
            <param name="password">password</param>
        </authorize>
    </user-mapping>

这两个配置文件修改后，Guacamole会动态重新加载，只要你别改错了就行。

### guacd的配置和部署

    sudo apt-get install guacd
    //其实直接sudo apt-get install guacamole可以同时安装好guacd和guacamole-tomcat。

注意默认的例子是连接localhost下的`4822`端口，需要的话自己再修改下源码即可。在`guacd/daemon.c`中可以看到代码中对ip-port的绑定。

    char* listen_address = NULL; /* Default address of INADDR_ANY */
    char* listen_port = "4822";  /* Default port */

### Guacamole初体验
好了，直接在浏览器中打开[http://localhost:8080/guacamole/](http://localhost:8080/guacamole/)就可以看到:

<img src="/images/blog/Install-Guacamole-1.png" alt="Guacamelo登录界面">

登录呢，一个简单的Web Terminal:

<img src="/images/blog/Install-Guacamole-2.png" alt="Guacamelo登录效果图">

这只是一个简单的安装流程吧，后续的集成再来总结吧
