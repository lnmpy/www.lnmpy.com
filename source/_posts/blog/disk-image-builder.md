---
title: disk-image-builder制作虚拟机镜像
categories: blog
date: 2014-07-21
---

## 简介
`DiskImage-Builder`是通过chroot到一个创建的临时目录中(默认在/tmp/image.\*中可以看到),同时绑定系统的/proc, /sys, 和/dev 目录来配置(硬件资源)环境的.当提供好的脚本执行完成后,将该tmp目录内容打入到镜像文件中即完成了所有的制作过程.

OK,既然`DiskImage-Builder`提供了一个完整的执行环境,那么要定制一个满足自己需求的镜像,只需要按照其提供的格式完成几个**element**, 接着就biubiu地完成了一个自己的镜像了.

## element

element是一堆符合特定名称的文件(主要为脚本)/文件夹的集合. 其主要包含以下的元素:

- 用于执行脚本, 命名及存放的路径均有特殊含义(这些脚本中描述了在制作镜像的过程中需要执行哪些操作,比如安装好apache,创建用户等.)
- 依赖描述
- 描述文件, 不是强制的，但提供这个就相当于有一个良好的注释, 便于他人阅读和使用


### element的执行脚本

`DiskImage-Builder`默认提供了一些基础的element,可以在源码目录中diskimage-builder/elements中看到. 其中执行的脚本,是按照目录划分的,按照顺序执行.每一个目录操作都有几个属性:

- 其执行的环境,是否在chroot中
- 输入变量
- 输出变量

以下列出了其执行的目录, 执行按先后顺率来排列
<table style="width:96%;margin:2%;border:1px">
  <tr>
    <th>
    操作
    </th>
    <th>
    执行目录
    </th>
    <th>
    接受变量
    </th>
    <th>
    输出变量
    </th>
  </tr>

  <tr>
    <td>
    root.d
    </td>
    <td>
    outside chroot
    </td>
    <td>
    $ARCH=i386|amd64|armhf
    $TARGET_ROOT={path}
    </td>
    <td>
    -
    </td>
  </tr>

  <tr>
    <td>
    extra-data.d
    </td>
    <td>
    outside chroot
    </td>
    <td>
    $TMP_HOOKS_PATH
    </td>
    <td>
    -
    </td>
  </tr>

  <tr>
    <td>
    pre-install.d
    </td>
    <td>
    in chroot
    </td>
    <td>
    -
    </td>
    <td>
    -
    </td>
  </tr>

  <tr>
    <td>
    install.d
    </td>
    <td>
    in chroot
    </td>
    <td>
    -
    </td>
    <td>
    -
    </td>
  </tr>

  <tr>
    <td>
    post-install.d
    </td>
    <td>
    in chroot
    </td>
    <td>
    -
    </td>
    <td>
    -
    </td>
  </tr>

  <tr>
    <td>
    block-device.d
    </td>
    <td>
    outside chroot
    </td>
    <td>
    $IMAGE_BLOCK_DEVICE={path}
    $TARGET_ROOT={path}
    </td>
    <td>
    $IMAGE_BLOCK_DEVICE={path}
    </td>
  </tr>

  <tr>
    <td>
    finalise.d
    </td>
    <td>
    in chroot
    </td>
    <td>
    -
    </td>
    <td>
    -
    </td>
  </tr>

  <tr>
    <td>
    cleanup.d
    </td>
    <td>
    outside chroot
    </td>
    <td>
    $ARCH=i386|amd64|armhf
    $TARGET_ROOT={path}
    </td>
    <td>
    -
    </td>
  </tr>
</table>


### element之间的依赖

element的依赖主要由两个文件来描述

- element-deps: 描述该elements所依赖的element, 那么在执行该elment之前会先执行其依赖的element.

  如默认的element: ubuntu

    cache-url
    cloud-init-datasources
    dib-run-parts
    dkms
    dpkg

  也就是说在执行element`ubuntu`之前会先去执行如`dkms`,`dpkg`,`cache-url`等所依赖的element.

- element-provides: 描述该elements额外提供哪些element的功能, 也就说若执行该element,那么其额外提供的element就不会在执行.

  依然拿ubuntu来举例：

    operating-system

  这个就说明,若选择了`ubuntu`,则不会执行名为`operating-system`的element了


其实到这里，基本就已经了解了一个element的作用了，只要看一下相关的一两个例子，就可以写出满足自己定制需求的element脚本.

## 配置diskimage-builder

    # 下载diskimage-builder，默认已有一些常用的element
    git clone https://github.com/openstack/diskimage-builder.git

    # 以下两个则是配置openstack需要涉及的一些element，可以自行参考和使用
    git clone https://github.com/openstack/tripleo-image-elements
    git clone https://github.com/openstack/heat-templates


绿色无需安装,下载即可使用. 当然需要安装`qemu-utils`和物理内存大于4G.

## 运行环境变量

以创建ubuntu为例

### 必选环境变量

    # 指定版本
    export DIB_RELEASE=precise|trusty

    # 指定引用的elements路径
    export ELEMENTS_PATH=elements_path1:element_path2


### 可选环境变量

    # 指定image的源,比如ubuntu走的是这个
    # 主要是用来优化下载系统镜像速度的
    export DIB_CLOUD_IMAGES=https://cloud-images.ubuntu.com/

    # 制定apt-source的源, 相当于使用自定义好的文件去替换
    # 要使用到element: apt-sources
    export DIB_APT_SOURCES=/opt/apt-source.list.${DIB_RELEASE}


## 运行参数

    # 指定image-cache的缓存路径
    # 默认是：~/.cache/image-create
    --image-cache

    # 设置不更新已存在的image-cache
    # 其实也就是先判断一下sha256md5是否匹配,不匹配的情况下这个参数才有作用
    # 默认是如有不同则进行uopdate
    --offline

    # 指定目标平台的系统版本
    -a amd64|i386

    # 输出镜像的名称
    -o filename


## 运行示例

    # 生成ubuntu-precise镜像
    export ELEMENTS_PATH=elements
    export DIB_RELEASE=precise
    export DIB_APT_SOURCES=apt-source.list.${DIB_RELEASE}
    diskimage-builder/bin/disk-image-create vm ubuntu apt-sources custom-script -a amd64 -o ubuntu-precise

    # 将镜像上传到glance中
    glance image-create --name="ubuntu-$DIB_RELEASE" --disk-format=qcow2 --container-format=bare --is-public=true < ubuntu-$>


## 参考

 0. [Using Diskimage Builder for Heat Deploying Applications](https://pypi.python.org/pypi/diskimage-builder)
 0. [diskimages-heaticehousesummit](http://www.slideshare.net/hpcloud/diskimages-heaticehousesummit)
