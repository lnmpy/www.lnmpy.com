---
title:  Guacamole源码分析
categories: blog
date: 2013-12-04
---

## 环境的搭建
特别注明下版本信息和时间：`Ubuntu 13.10@2013-12-03`，已upgrade到最新state，`gucamole-0.83`。

对于环境的搭建，可以参考我的另外一篇博客[Ubuntu上搭建Guacamole](http://www.lnmpy.com/install-guacamole/)，不过有点啰嗦..。此处可以再简单描述下。

### Guacamole的安装
依赖的编译环境和测试运行环境，(不同的系统自己斟酌，假定你gcc等已经安装了,所以千万不要来一句`wget找不到啊`!- -)

    apt-get install -y libfreerdp-dev libssl-dev libssh-dev libfreerdp-dev libvorbis-dev libpulse-dev libvncserver-dev libpango1.0-dev libcairo2-dev maven

    apt-get install -y tomcat7 vnc4server


下载源码，0.83版本，路径均我放到/tmp下


    cd /tmp
    wget http://downloads.sourceforge.net/project/guacamole/current/source/guacamole-client-0.8.3.tar.gz && tar -xvf guacamole-client-0.8.3.tar.gz && cd guacamole-client-0.8.3/guacamole && mvn package && ln -sf /tmp/guacamole-client-0.8.3/guacamole/target/guacamole-0.8.3.war /var/lib/tomcat7/webapps/guacamole-0.8.3.war

    wget http://jaist.dl.sourceforge.net/project/guacamole/current/source/guacamole-server-0.8.3.tar.gz && tar -xvf guacamole-server-0.8.3.tar.gz && cd guacamole-server-0.8.3 && ./configure && sed -i 's/-pedantic//' src/protocols/ssh/Makefile && make && make install && guacd


### Guacamole配置
配置guacamole，参见http://guac-dev.org/doc/gug/configuring-guacamole.html，没有在环境变量中定义`GUACAMOLE_HOME`，默认路径在`/usr/share/tomcat7/.guacamole/`,配置文件参见我的另外一篇博客[Ubuntu上搭建Guacamole](http://www.lnmpy.com/install-guacamole/)

### Guacamole的MySQL扩展
整合MySQL的登录验证的模块参见http://guac-dev.org/doc/gug/mysql-auth.html或者[Ubuntu上搭建Guacamole](http://www.lnmpy.com/install-guacamole/)中有描述

***

## Guacamole的源码分析
guacamole结构上分为4层，建议先阅读下http://guac-dev.org/doc/gug/guacamole-architecture.html和http://guac-dev.org/doc/gug/guacamole-protocol.html，就可以对Guacamole的架构和协议有个基本的认识。

>
0. JS (WebSocket/xmlhttprequest + canvas)
0. JavaServlet
0. guacd, 底层的daemon
0. libfreerdp，libssh等

### Guacamole协议
原文其实也说不大清，但其实通过修改下代码，JS与JavaServlet， Servlet与guacd交互，都是采用这种格式。我贴下从guacd中抓下来的部分日志，与原文一致。

    4.sync,13.1386052271656;0,1.0,1.7,2.16;l,2.14,1.0,1.0,1.0,1.0,3.255;4.rect,1.0,3.160,3.285,2.10,2.19;5.cfill,2.14,1.0,3.153,3.153,3.153,3.255;4.rect,2.-1,1.0,1.0,3.520,2.19;5.cfill,1.6,2.-1,3.103,3.255,3.103,3.255;4.rect,2.-2,1.0,1.0,3.520,2.19;5.cfill,2.14,2.-2,1.0,1.0,1.0,3.255;4.copy,2.-1,1.0,1.0,3.520,2.19,2.14,2.-2,1.0,1.0;4.copy,2.-2,2.10,1.0,2.10,2.19,2.14,1.0,1.0,3.285;4.copy,2.-2,2.20,1.0,2.10,2.19,2.14,1.0,2.10,3.285;4.rect,2.-1,3.520,1.0,2.10,2.19;5.cfill,1.2,2.-1,1.0,1.0,1.0,3.255;3.png,2.14,2.-1,3.520,1.0,380.iVBORw0KGgoAAAANSUhEUgAAAAoAAAATCAYAAACp65zuAAAABmJLR0QA/wD/AP+gvaeTAAAA0ElEQVQokeXQO0oDURSA4e/eHVjaiJWgWNiI67AZV5BnZekqLBMmVboMBMQXgjYuwS3YpkmC+IqEuTZJHMkKxL89H+fA4T8WWqm1USpHOMtDfl4dNlLjCc95yI9jN3QneEBWRbVU28EBCogQhAGO6qm+tYRRzPCWpJsVjOIVPoJQ3XqC617ova9gJ3Reg3C7hO3U3sU+Bj8XFiWpSNJhMzW35+YZJmPj+zU4M7vDC7LF5othGH6twX7of+IySafYK5VF9QvR7wbYxGhq+uiP9Q20D0RUZK/+VAAAAABJRU5ErkJggg==;


当然，guacd与libfreerdp和libfreerdp与rdp-server是怎么交互的，这个就需要咱自己来整理了。
### JS (WebSocket/xmlhttprequest + canvas)
核心就是那几个js文件：

scripts文件夹下的:service.js，admin-ui.js等

guacamole-common-js下的guacamole.js,layer.js,tunnel.js等。

#### script
`*-ui.js`: 如其名，只是用来处理dom-ui的

`session.js`: 使用localStorage来存取的，保存的是诸如clipboard,其提供了钩子函数

    //钩子函数，外部赋值，又reload调用
    this.onchange = null;

    /*
     * 监听storage，也就是说注册的外部函数会被自动调用。
     * 典型的的是你在rdp里面粘贴板内容会更新到在textarea[id="clipborad"]中
     */
    window.addEventListener("storage", guac_state.reload, false);

`history.js`: 同session.js，只是处理的是你的connection记录。

`service.js`: 提供了GuacamoleService核心类，其定义了`GuacamoleService.Protocol`,`GuacamoleService.Protocol.Parameter`,`GuacamoleService.Connection`,`GuacamoleService.ConnectionGroup`等一些属性。
还提供了以下方法（只展示部分）

    /*
     * 有权限的用户能够操作自己的Connection
     */
    GuacamoleService.Connections = {
        'list':*,
        'create':*,
        'move':*,
        ...
    }
    /*
     * admin用户可以查看其他用户，会使用到这些方法
     */
    GuacamoleService.Users = {
        'list':*,
        'create':*,
        ...
    }
    /*
     * 创建Connection的过程中会提示选择Protocol，
     */
    GuacamoleService.Protocols = {
        'list':*
    }

#### guacamole-common-js
`mouse.js`,`keyboard.js`,`oskeyboard.js`: 创建实例会注册了一堆像`mouseout`之类的监听行为，其会被`scripts/client-ui.js`调用。

     /*
      * 以下代码在scripts/client-ui.js中
      */
     var keyboard = new Guacamole.Keyboard(document);
     ...
     // 定义好钩子函数，会帮我们自动调用
     keyboard.onkeyup = function (keysym) {
        guac.sendKeyEvent(1, keysym);
        ...
     /*
      * 以下代码在guacamole-common-js/guacamole.js中
      */
     this.sendKeyEvent = function(pressed, keysym) {
       if (!isConnected())
         return;
       tunnel.sendMessage("key", keysym, pressed);// 利用tunnel.js来发送请求
     };

     //！！！！注意，尽管又是监听事件，又是请求网络，但这里并不涉及到图形的绘制，其不与layer.js直接交互


`layer.js`: 提供canvas， 以及围绕这这个canvas的各个自定义的接口

    // 创建一个canvas, 然后各种在这个canvas上进行操作
    var display = document.createElement("canvas");

`audtio.js`: 没啥特别的， 只是需要提出的是:

    if (window.webkitAudioContext) {
        // 使用webkitAudioContext来播放，当然性能更高了
    }else{
        // 使用Audio类，使用base64编码的值来播放
    }

`tunnel.js`: 判断浏览器是否支持WebSocket，如果不支持则采用性能较低的xmlHtttpRequest，轮询。这里只是网络请求的封装，并不涉及到协议格式。这里我也没有太多细看。懵懂，点到为止。

`guacamole.js`: 最核心的部分了，其主要涉及两项任务:（业务实现较多，但也就这样了）

 - JS部分协议的定义，解析数据，重绘layer，如"size"操作等
 - 内部定义一个Interval，相当于while(true)来重绘layer。

### JavaServlet
TODO

### guacd, 底层的daemon服务
分为三个部分:

 - guacd
 - libguac
 - protocols

#### guacd
guacd只是一个简单的daemon，只用来监听网络。

    int main(...) {
        ...
        for (;;) {
            ...
            connected_socket_fd = accept(socket_fd, (struct sockaddr*) &client_addr, &client_addr_len); // BLOCK监听的
            fork(); // 判断那我就免了。
            socket = guac_socket_open(connected_socket_fd);
            guacd_handle_connection(socket);
            ...
        }
        ...
    }

    void guacd_handle_connection(guac_socket* socket) {
        ...
        // 先获取各种参数，libguac下的api
        select = guac_instruction_expect(socket, GUACD_USEC_TIMEOUT, "select");
        ...
        // 启动线程来执行网络操作
        guacd_client_start(client); //
        ...

    }

    int guacd_client_start(guac_client* client) {
        ...
        // 起了两个线程
        // 注意两个线程的参数都是client，也就是读写同一个socket，只是划分了责任而已
        pthread_create(&output_thread, NULL, __guacd_client_output_thread, (void*) client);
        pthread_create(&input_thread, NULL, __guacd_client_input_thread, (void*) client);
        ...
    }

    void* __guacd_client_input_thread(void* data) {
        // 当然有个while True
        ...
        // 读取指令，libguac下的api
        guac_instruction* instruction = guac_instruction_read(socket, GUACD_USEC_TIMEOUT);
        ...
        // 再调用libguac中的函数来实现对应指令的操作，之后再讨论细节
        guac_client_handle_instruction(client, instruction);
        ...
    }

    void* __guacd_client_output_thread(void* data) {
        // 当然有个while True
        ...
        // 发送同步信息
        guac_protocol_send_sync(socket, client->last_sent_timestamp)
        guac_socket_flush(socket);
        ...
        // 同步信息加上instruction指令信息，由protocol部分来实现。
        guac_protocol_send_sync(socket, client->last_sent_timestamp)
        client->handle_messages(client);
        guac_socket_flush(socket);
        ...
    }

以上基本上就是guacd的功能结构了，结构简单，很清晰，我就一锅端了，不具体表明在哪个文件中

#### libguac
这里面就重点了解几个文件就行了，我挑几个描述下其部分代码。
##### socket.h/c
提供了`guac_socket`定义，一些socket操作方法

    struct guac_socket {
        void* data;
        ...
        guac_socket_write_handler* write_handler; //需要外部定义的接口
        ...
    }

    ssize_t guac_socket_write(guac_socket* socket,
            const void* buf, size_t count) {
        ...
        int written = __guac_socket_write(socket, buffer, count);
        ...
    }

    static ssize_t __guac_socket_write(guac_socket* socket,
        const void* buf, size_t count) {
        ...
        if (socket->write_handler)
            return socket->write_handler(socket, buf, count); // 这个write_handler的初始化在socket-fd.c中
        ...
    }

##### protocol.h/c
提供协议的各种操作指令的发送，以及定义了


    typedef enum guac_composite_mode;
    typedef enum guac_transfer_function;

    // 一堆协议方法，这些是对外直接开放的，用户可以利用这些来编写自定义的protocol插件
    int guac_protocol_send_move(guac_socket* socket, const guac_layer* layer,
        const guac_layer* parent, int x, int y, int z);


    // 简单的sync可以看到实现如下，也就是对socket的写操作，只是封装了下，这样我们就接触不到任何内部的协议了
    int guac_protocol_send_sync(guac_socket* socket, guac_timestamp timestamp) {
        guac_socket_instruction_begin(socket); // 加锁
        ret_val =
               guac_socket_write_string(socket, "4.sync,")
            || __guac_socket_write_length_int(socket, timestamp)
            || guac_socket_write_string(socket, ";");

        guac_socket_instruction_end(socket); // 释放锁
        return ret_val;
    }

##### instruction.h/c
提供instruction的定义

    typedef struct guac_instruction {
        char* opcode;
        int argc;
        char** argv;
    } guac_instruction;

    guac_instruction* guac_instruction_read(guac_socket* socket,
            int usec_timeout) {
        while (...) {
            char c = socket->__instructionbuf[i++];
            if (c >= '0' && c <= '9')
                ...
            else if (c == '.') {
                if (...) {
                    if (terminator == ';') {
                        ...
                        parsed_instruction->opcode = strdup(socket->__instructionbuf_elementv[0]);
                        memmove(socket->__instructionbuf, socket->__instructionbuf + i, socket->__instructionbuf_used_length - i);
                        socket->__instructionbuf_used_length -= i;
                        socket->__instructionbuf_parse_start = 0;
                        socket->__instructionbuf_elementc = 0;
                        return parsed_instruction;
                    }
                    else if (terminator != ',') {
                        return NULL;
                    }

                }
            }
            else {
                ...
            }
        }
    }

    // 还记得guacd里面的这个方法的调用吧，其实也就是对协议交互流程的一个不成文的规定而已
    guac_instruction* guac_instruction_expect(guac_socket* socket, int usec_timeout,
            const char* opcode) {
        instruction = guac_instruction_read(socket, usec_timeout);
        if (strcmp(instruction->opcode, opcode) != 0) {
            return NULL;
        }
        return instruction;
    }

#### protocols(以rdp为例)
中文搜一下，竟然大多数的文章都是说rdp是微软的。。。好吧，我开始也被迷惑了，后来仔细搜了下，它原来是由国际电信联盟定义的，后来产生了各个不同的实现版本，基本都兼容。所以这个`freerdp`也是兼容windows的。

在`protocols/rdp`下，代码不少，但其实更多的是对libfreerdp的封装，内部调用的是`libguac`的众多接口，并使用libguac下的`protocol_*`系列方法，。


    // 协议需要实现guac_client_init
    int guac_client_init(guac_client* client, int argc, char** argv){
        ...
        client->data = guac_client_data;// 操作client->data，即可实现数据的导出
        ...
        rdp_inst = freerdp_new();
        // 这几个相当于初始化rdp_inst，按照接口的要求定义一些钩子函数吧
        rdp_inst->PreConnect = rdp_freerdp_pre_connect;
        rdp_inst->PostConnect = rdp_freerdp_post_connect;
        rdp_inst->Authenticate = rdp_freerdp_authenticate;
        rdp_inst->VerifyCertificate = rdp_freerdp_verify_certificate;
        rdp_inst->ReceiveChannelData = __guac_receive_channel_data;
        //中间要设置一堆一堆的参数
        ...
        freerdp_connect(rdp_inst);
        ...
    }

    /*
     * 下边这个函数，就是在钩子函数rdp_freerdp_pre_connect中初始化相关的数据,
     * 定义的另外一钩子函数。
     * 反正我们就不管它的调用了吧，只负责实现好相关的接口，处理好连个协议之间的转换工作即可
     * 从下面的部分代码中就可以看到，rdp相关的操作最后都转成相应的guac_protocol调用了
     */
    void guac_rdp_gdi_patblt(rdpContext* context, PATBLT_ORDER* patblt) {
        ...
        guac_client* client = ((rdp_freerdp_context*) context)->client;
        rdp_guac_client_data* data = (rdp_guac_client_data*) client->data;
        ...
        switch (patblt->bRop) {
            case 0x00:
                guac_protocol_send_rect(client->socket, current_layer, x, y, w, h);
                guac_protocol_send_cfill(client->socket,
                        GUAC_COMP_OVER, current_layer,
                        0x00, 0x00, 0x00, 0xFF);
                break;
            case 0xAA:
                break;
            case 0xCC:
            case 0xF0:
                ...
            case 0xFF:
                guac_protocol_send_rect(client->socket, current_layer, x, y, w, h);
                guac_protocol_send_cfill(client->socket,
                        GUAC_COMP_OVER, current_layer,
                        0xFF, 0xFF, 0xFF, 0xFF);
                break;
            default:
                ...
        }
    }


### guacd, libfreerdp，libssh等
好了，到这里我感觉就开始是天坑的开始了，rdp我愣是没找到一个完整讲解其协议格式的文件。https://github.com/FreeRDP/FreeRDP/wiki/Reference-Documentation，在这个上面列举了一堆内部使用或者引用到的技术。
不过蹦到MS的MSDN上，说找下Example看下的，看到的只有这个。。

    00000000    03 00 00 00 10 00 00 00-00 00 00 00 01 00 00 00
    ................

    03 00 00 00   MILCTRLCMD_OPENCONNECTION::controlCode = 0x00000003
    10 00 00 00   MILCTRLCMD_OPENCONNECTION::messageSize = 0x10 = 16 bytes
    00 00 00 00   MILCTRLCMD_OPENCONNECTION::unused (4 bytes)
    01 00 00 00   MILCTRLCMD_OPENCONNECTION::connectingFlags = MilConnection::IsDwm

好吧，也确实是Example，不过，天坑，你就放过我吧。

好了，折腾了这么将近一天时间，也是搞得最长的一篇博客了，欢迎拍砖。

## 相关资料
 1. [Guacamole](http://guac-dev.org/)
 2. [FreeRDP](http://www.freerdp.com/)
 3. [RDP-GitHub-Refs](https://github.com/FreeRDP/FreeRDP/wiki/Reference-Documentation)
 4. [Wikipedia](http://en.wikipedia.org/wiki/Remote_Desktop_Protocol)
 5. [MSDN](http://social.msdn.microsoft.com/Forums/zh-CN/af15dea6-c0c0-440e-b432-783edc4b8526/rdp-protocol-specification)
