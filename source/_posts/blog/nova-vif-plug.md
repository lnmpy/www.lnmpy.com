---
title:  Neutron如何与Nova-Compute进行交互
categories: blog
date: 2014-03-24
---

开门见山,最近在研究了一下Neutton的代码，看的过程中也将所了解的内容进行整理，整理内容如下:

<!-- more -->

## Nova-compute如何发出请求
当我执行nova boot的时候,nova-compute是如何执行接下来的操作呢,贴个代码说起来也太罗嗦了,还是直接用一个流程图来说明一下,然后再根据他图来说明一下就比较直观吧

不过看图容易画图难啊,为了表示函数调用层级,我用数字放在方法前面,比如`0 methodA` -> `1 methodB` -> `2 methodC` -> `0 methodD`. 就表明,`methodA`里面调用了`methodB`,`methodB`里面调用了`methodC`,然后`methodA`结束了,开始调用`methodD`.OK,上图:


<img src="/images/blog/neutron_interact_with_nova_compute.png" alt="nova-compute-build-instance" />

Openstack毕竟是各个不同的模块组合起来的,上面的流程是通用的, 不管你是用neutron-ovs,nova-network,neutron-ml2,还是libvirt,lxc,hyperv等, 不变的部分它就长这样了.

既然通用的都说完了,那么接下来就到了如何去管理和创建网络资源了.这里我们就采用Neutron-OVS和libvirt来为例说明.

图中其中两个标红的操作,一个`post_message_to_create_and_bind`和`plug`,就是接下来要说明的重点:Neutron-OVS返回port并绑定,libvirt如何响应并创建相应的网卡设备


## Neutron-OVS返回port并绑定

    # OVSNeutronPluginV2下的create_port,Neutron-server最后会调用这个方法
    def create_port(self, context, port):
        port['port']['status'] = q_const.PORT_STATUS_DOWN
        port_data = port['port']
        session = context.session
        with session.begin(subtransactions=True):
            self._ensure_default_security_group_on_port(context, port)
            sgids = self._get_security_groups_on_port(context, port)
            dhcp_opts = port['port'].get(edo_ext.EXTRADHCPOPTS, [])

            # 创建port
            port = super(OVSNeutronPluginV2, self).create_port(context, port)

            # 绑定port和host, 实际上是执行插入portbindingports表
            self._process_portbindings_create_and_update(context, port_data, port)

            # 绑定port和security, 实际上是执行插入securitygroupportbindings表
            # 作用嘛,肯定就是用来执行port的securitygroup的操作啦
            self._process_port_create_security_group(context, port, sgids)

            # 执行插入extradhcpopts
            # TODO? 这个作用我还不清楚
            self._process_port_create_extra_dhcp_opts(context, port,
                                                        dhcp_opts)
            # 配置db,以允许该机器与外界进行通信,以后会生成iptables
            # http://blog.csdn.net/matt_mao/article/details/19417451
            port[addr_pair.ADDRESS_PAIRS] = (
                self._process_create_allowed_address_pairs(
                    context, port,
                    port_data.get(addr_pair.ADDRESS_PAIRS)))
        # 通知相关的agent执行security_group的更新,通常就是iptables
        self.notify_security_groups_member_updated(context, port)
        return port


另外,由于OVSNeutronPluginV2的__init__方法中,存在`base_binding_dict`这么一个属性

    class OVSNeutronPluginV2(...):
       def __init__(self, configfile=None):
            self.base_binding_dict = {
                portbindings.VIF_TYPE: portbindings.VIF_TYPE_OVS,
                portbindings.CAPABILITIES: {
                    portbindings.CAP_PORT_FILTER:
                    'security-group' in self.supported_extension_aliases}}


在代码中可以看到,其初始化为`base_binding_dict['binding:vif_type']='ovs'`, 在之后的一些代码中会被update到port中.这个执行`neutron port-show`中可以看到对应的值,同时,在最后的`libvirt`的plug方法中也是起着判断因素的.


## libvirt如何响应并创建相应的网卡设备
这里就直接上代码,逻辑也不是很复杂.

<img src="/images/blog/libvirt_vif_plug.png" alt="lib_vif_plug" />

跟下plug的代码就知道了,其实根据配置文件来选择哪一个vif_driver的.在旧版的代码中,你还是有很多选择的,但是在新版的代码里面就只有`LibvirtGenericVIFDriver`

    # 如此的配置在旧版的nova是可行的,不过代码中会有提示说已经废弃了,建议使用GenericVIFDriver
    libvirt_vif_driver = nova.virt.libvirt.vif.LibvirtHybridOVSBridgeDriver
    # 所以还是使用如下的配置
    libvirt_vif_driver = nova.virt.libvirt.vif.LibvirtGenericVIFDriver

此处就以OVS的创建代码来说明了

    def plug_ovs_hybrid(self,instance,vif):
        iface_id = self.get_ovs_interfaceid(vif)
        # 获取了br_name, 以qbr开头
        br_name = self.get_br_name(vif['id'])
        # 获取了veth_pair_name, 以qvb,qvo开头
        v1_name,v2_name = self.get_veth_pair_names(vif['id'])

        # 添加一个qbr 网桥
        if not linux_net.device_exists(br_name):
            utils.execute('brctl','addbr',br_name,run_as_root=True)
            utils.execute('brctl','setfd',br_name,0,run_as_root=True)
            utils.execute('brctl','stp',br_name,'off',run_as_root=True)
            utils.execute('tee',
                          ('/sys/class/net/%s/bridge/multicast_snooping' %
                           br_name),
                          process_input='0',
                          run_as_root=True,
                          check_exit_code=[0,1])

        # 创建添加一个qvo网桥
        if not linux_net.device_exists(v2_name):
            # 将两个veth创建为一个peer-port
            linux_net._create_veth_pair(v1_name,v2_name)
            utils.execute('ip','link','set',br_name,'up',run_as_root=True)
            # 将qvb接口添加到qbr上
            utils.execute('brctl','addif',br_name,v1_name,run_as_root=True)
            # 将接口qvo桥接到br-int上
            # 分别传入的参数为:br-int, qvo, port['id'], port的mac地址, instance-uuid
            linux_net.create_ovs_vif_port(self.get_bridge_name(vif),
                                          v2_name,iface_id,vif['address'],
                                          instance['uuid'])

    def _create_veth_pair(dev1_name, dev2_name):
        # 将两个veth创建为一个peer-port
        for dev in [dev1_name, dev2_name]:
            delete_net_dev(dev)

        utils.execute('ip', 'link', 'add', dev1_name, 'type', 'veth', 'peer',
                      'name', dev2_name, run_as_root=True)
        for dev in [dev1_name, dev2_name]:
            utils.execute('ip', 'link', 'set', dev, 'up', run_as_root=True)
            utils.execute('ip', 'link', 'set', dev, 'promisc', 'on',
                          run_as_root=True)

    def create_ovs_vif_port(bridge, dev, iface_id, mac, instance_id):
        # 将接口qvo桥接到br-int上
        # 分别传入的参数为:br-int, qvo, port['id'], port的mac地址, instance-uuid
        utils.execute('ovs-vsctl', '--', '--may-exist', 'add-port',
                      bridge, dev,
                      '--', 'set', 'Interface', dev,
                      'external-ids:iface-id=%s' % iface_id,
                      'external-ids:iface-status=active',
                      'external-ids:attached-mac=%s' % mac,
                      'external-ids:vm-uuid=%s' % instance_id,
                      run_as_root=True)



由代码可以看出,至此,`<qbr>`--`(qvb)`--`(qvo)`--`<br-int>`就已经连接上了
至于虚机是如何与`<qbr>`连上的,这个就是在virt内部做的了,执行以下的命令, 其中的source字段是你提供的`qbr`, `tap`则是virt生成的.

    virsh domiflist <instance-id>

到这里可以看出,从一个nova-compute到neutron到libvrit的各个网络信息的处理交互. 逻辑相对来说还是比较清晰的。

终于整理完了之后，感觉变成了nova-compute的源码分析了。。。
