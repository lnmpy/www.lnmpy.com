---
title:  关于Neutron的几篇不错的博客
categories: blog
date: 2014-02-28
---

懒得多写了， 就先后引用一下四篇文章吧，可以很清楚的描述一下，Neutron的各个概念。

1.[http://www.ustack.com/blog/neutron_intro/](http://www.ustack.com/blog/neutron_intro/)

从Dashboard的的角度来讲解各个网络节点的连接关系，也有比如“网关臂”等的概念

2.[http://docs.openstack.org/havana/config-reference/content/section_networking-scenarios.html](http://docs.openstack.org/havana/config-reference/content/section_networking-scenarios.html)

从三个业务场景的角度，讲解了为什么要这样安装配置，比如配置这个网桥的目的是什么等

3.[http://openstack.redhat.com/Networking_in_too_much_detail](http://openstack.redhat.com/Networking_in_too_much_detail)

以一个demo的角度来讲解网络流图以及简单介绍了如router iptables和ovs的flow table的区别。

4.[http://developer.rackspace.com/blog/software-defined-networks-in-the-havana-release-of-openstack-part-2.html](http://developer.rackspace.com/blog/software-defined-networks-in-the-havana-release-of-openstack-part-2.html)

简单讲解了OVS的Flow Table

就这样，自己多动动手再加上这些应该可以很轻松的构建一个Neutron的网络流图的概念。后续如碰到好的文章再加进来
