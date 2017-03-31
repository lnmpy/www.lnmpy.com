---
title:  Neutron-Server启动流程分析
categories: blog
date: 2014-03-21
---

## Neutron-Server启动流程分析

正常的来看，应该是先看nova源码的。一方面网上资料也比较丰富，一方面也是更具有代表性。所以我也就不从头再来，浪费太多的精力去描述像router，deploy等库的使用了
比如[臭蛋](http://www.choudan.net/)的两篇博客就写得挺详细的，结合代码看一下，倒也可以很快速的了解

[Nova Service启动](http://www.choudan.net/2013/08/09/Nova-Service%E5%90%AF%E5%8A%A8.html)

[Openstack Paste Deploy介绍](http://www.choudan.net/2013/07/28/OpenStack-paste-deploy%E4%BB%8B%E7%BB%8D.html)


### deploy加载配置定位到具体的类
在`/etc/neutron/api-paste.ini`，有这么一行，直接指明了哪个类作为router启动

paste.app_factory = neutron.api.v2.router:APIRouter.factory


### 实例化neutron/api/v2/router.py中的APIRouter

    class APIRouter(wsgi.Router):
        # 一个工厂类方法
        @classmethod
        def factory(cls, global_config, **local_config):
            return cls(**local_config)

        # 真正调用的实例化方法
        def __init__(self, **local_config):
            ...
            #获取NeutornManage的core_plugin，这个定义在/etc/neutron/neutron.conf,比如我的是
            #core_plugin = neutron.plugins.openvswitch.ovs_neutron_plugin.OVSNeutronPluginV2
            plugin = manager.NeutronManager.get_plugin()

            #扫描特定路径下的extensions
            ext_mgr = extensions.PluginAwareExtensionManager.get_instance()
            ...

            #定义的局部方法
            def _map_resource(collection, resource, params, parent=None):
                ...
                controller = base.create_resource(
                    collection, resource, plugin, params, allow_bulk=allow_bulk,
                    parent=parent, allow_pagination=allow_pagination,
                    allow_sorting=allow_sorting)
                ...
                # 将这些resource加进router中
                return mapper.collection(collection, resource, **mapper_kwargs)


            # 遍历 {'network': 'networks', 'subnet': 'subnets','port': 'ports'}
            # 添加controller
            for resource in RESOURCES:
                _map_resource(RESOURCES[resource], resource,
                            attributes.RESOURCE_ATTRIBUTE_MAP.get(
                                RESOURCES[resource], dict()))

            for resource in SUB_RESOURCES:
                ...
                #其实操作和上面一个差不多，

由这个可以看出，添加的controller类型主要分为三类：(其实只要你在neutron目录下grep一下，看哪里调用了`create_resource`方法即可)

1. OVSNeutronPluginV2
2. extensions/*.py
3. plugins/*.py

针对前两途径加载resource的类，下面慢慢进行描述。至于第三种，则是在各个不同的plugin内部额外实现的，不是必须的。

顺便简单的提一下，在`neutron/api/extensions.py`下的`get_instance`方法，这里其实也是和nova一样，是遍历目录下的py文件，来增加extension的

    ...
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls(get_extensions_path(),
                                NeutronManager.get_service_plugins())
    ...


### Resource：OVSNeutronPluginV2的实现
看了代码的你肯定知道，`OVSNeutronPluginV2`这个类，作为`core_plugin`继承了好多的的类

    class OVSNeutronPluginV2(db_base_plugin_v2.NeutronDbPluginV2,
                             external_net_db.External_net_db_mixin,
                             extraroute_db.ExtraRoute_db_mixin,
                             l3_gwmode_db.L3_NAT_db_mixin,
                             sg_db_rpc.SecurityGroupServerRpcMixin,
                             l3_agentschedulers_db.L3AgentSchedulerDbMixin,
                             agentschedulers_db.DhcpAgentSchedulerDbMixin,
                             portbindings_db.PortBindingMixin,
                             extradhcpopt_db.ExtraDhcpOptMixin,
                             addr_pair_db.AllowedAddressPairsMixin):

`OVSNeutronPluginV2`基本上没有什么自己的method，全靠它的"爹们"了。

随便抓两个来看下，比如`NeutronDbPluginV2`，他的method有`get_port`,`create_network`之类的，还有`L3_NAT_db_mixin`的`create_router`等。反正与db的操作，`OVSNeutronPluginV2`是不会管的，都在它的父类那边处理。

再看看`OVSNeutronPluginV2`继承的这些父类们:

    #NeutronDbPluginV2继承自NeutronPluginBaseV2
    class NeutronDbPluginV2(neutron_plugin_base_v2.NeutronPluginBaseV2,
                           CommonDbMixin):


    class NeutronPluginBaseV2(...) :
       @abstractmethod
       def create_subnet(self, context, subnet):
       @abstractmethod
       def update_subnet(self, context, id, subnet):
       @abstractmethod
       def get_subnet(self, context, id, fields=None):
       @abstractmethod
       def get_subnets(self, context, filters=None, fields=None,


其类图如下:(仅展示部分)

<img src="/images/blog/neutron_ovs_plugin_class.png" alt="Neutron的OVS-Plugin类图, 仅展示部分">

基本上可以说有一个接口类(如图中的`NeutronPluginBaseV2`)，定义了抽象方法，然后一个具体的db类来实现(如`NeutronDbPluginV2`，这里是采用`SQLAlchemy`来完成db模型的)




### Resource：Extensions目录下resource的实现
在`/etc/neutron/api-paste.ini`还有这么一项配置

    [filter:extensions]
    paste.filter_factory = neutron.api.extensions:plugin_aware_extension_middleware_factory


在`plugin_aware_extension_middleware_factory`会调用到`ExtensionMiddleware.__init__`方法，其代码如下：

    class ExtensionMiddleware(wsgi.Middleware):

        def __init__(self, application,
                     ext_mgr=None):
            self.ext_mgr = ...
            mapper = routes.Mapper()

            # ext_mgr.get_resources()其实在内部会调用每个extensions目录下的extension类的get_resource方法
            for resource in self.ext_mgr.get_resources():
                ...
                # 针对每个extension
                mapper.resource(resource.collection, resource.collection,
                                controller=resource.controller,
                                member=resource.member_actions,
                                parent_resource=resource.parent,
                                path_prefix=path_prefix)
                ...



比如在extensions下的`securitygroup`.py中的`get_resources`方法，看这个代码就知道其中可以处理`security_group`和`security_group_rule`两类请求了。

    class Securitygroup(extensions.ExtensionDescriptor):
        def get_resources(cls):
            ...
            exts = []
            plugin = manager.NeutronManager.get_plugin()
            for resource_name in ['security_group', 'security_group_rule']:
                ...
                controller = base.create_resource(collection_name,
                                                  resource_name,
                                                  plugin, params, allow_bulk=True,
                                                  allow_pagination=True,
                                                  allow_sorting=True)
                ex = extensions.ResourceExtension(collection_name,
                                                  controller,
                                                  attr_map=params)
                exts.append(ex)
            return exts



----------------
如此，`Neutron-Server`就已经基本上启动了，无外乎就是加载配置，router各种resource，然后就等待请求了。其中router哪些resource完全是由配置文件来决定的。
当然，在启动的过程中也会初始化db，这也就是为何在安装`neutron`的时候无需像`nova`，`glance`等要执行`db sync`的原因了。




最后说一下,上面将各种操作都给map到位了,但是调用的时候呢？
Ok, 其实对资源的处理最终都会交由neutron/api/v2/base.py中定义的Controller类来处理,比如`create-network`请求,在create方法的末端，你会看到:

    class Controller():
    def create(...):
        ...
        obj_creator = getattr(self._plugin, action)
        if self._collection in body:
            # Emulate atomic bulk behavior
            objs = self._emulate_bulk_create(obj_creator, request,
                                                body, parent_id)
            return notify({self._collection: objs})
        else:
            kwargs.update({self._resource: body})
            # 在这里，最后就调用到了不同的plugins对不同的resource的处理
            obj = obj_creator(request.context, **kwargs)
            return notify({self._resource: self._view(request.context,
                                                        obj)})


通过`obj_creator`就可以调用到具体的handler了
