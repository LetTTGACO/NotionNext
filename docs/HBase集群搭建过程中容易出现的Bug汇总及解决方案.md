---
password: ''
icon: ''
创建时间: '2023-04-07T19:15:00.000Z'
date: '2019-05-14 00:00:00'
type: Post
slug: qfvyux
配置类型:
  type: string
  string: 文档
summary: ''
更新时间: '2023-08-26T15:20:00.000Z'
title: HBase集群搭建过程中容易出现的Bug汇总及解决方案
category: 技术分享
tags:
  - Java
status: Archived
urlname: b043b306-f082-4e6d-bd82-f4be2262de22
updated: '2023-08-26 23:20:00'
---

# 引言


最近在搭建 Hadoop+zookeeper+HBase 集群过程中，HBase 老是出现各种问题，经过不断查看日志文件，找各种解决办法……此时此时，我终于是搭建成功了吼吼吼~值得庆祝一下。以下是我在搭建 HBase 集群过程中出现的问题记录，改天抽空写一下 Hadoop+zookeeper+HBase 的集群搭建。


# hbase-site.xml


先放一下最后搞定成功的配置文件


```xml
<!-- 设置HRegionServers共享目录。因为我搭建的是高可用集群，
	所以这里的hbase.rootdir值来自hadoop中的hdfs.default的值 -->
<property>
	<name>hbase.rootdir</name>
	<value>hdfs://mycluster/hbase</value>
</property>
<!-- 启用分布式模式 -->
<property>
	<name>hbase.cluster.distributed</name>
	<value>true</value>
</property>
<!-- master主机的端口号 -->
<property>
	<name>hbase.master</name>
	<value>mycluster:60000</value>
</property>
<!-- 指定Zookeeper集群位置 -->
<property>
	<name>hbase.zookeeper.quorum</name>
	<value>s201:2181,s202:2181,s203:2181</value>
</property>
 <!-- 指定独立Zookeeper安装路径 -->
<property>
	<name>hbase.zookeeper.property.dataDir</name>
	<value>/home/letttgaco/zookeeper</value>
</property>
<!-- 指定ZooKeeper集群端口 -->
<property>
	<name>hbase.zookeeper.property.clientPort</name>
	<value>2181</value>
</property>
```


# Bug 汇总


**java.net.UnknownHostException: MyCluster**


> 这是因为，HBase 没有识别 MyCluster 这个集群，解决这个问题的方法是把 Hadoop 的 2 个配置文件（core-site.xml和hdfs-site.xml），放到每个 HBase 的 conf 目录下，让 HBase 能找到 Hadoop 的配置。


**zookeeper.MetaTableLocator: Failed verification of hbase:meta,,1 at address xxx**


> 如果你也是集群搭建过程中出现这个问题，请清除 hbase 安装目录下 logs 文件夹以 hbase 开头的所有日志文件，进入 zkCli.sh 客户端，并用rmr /hbase删除所有关于 hbase 的表信息，并用hdfs dfs -rmr /hbase删除所有关于 hbase 的文件，然后参照我的配置文件进行修改，然后集群就好了。


**ERROR: org.apache.hadoop.hbase.ipc.ServerNotRunningYetException: Server is not running yet**


> 如果你也是集群搭建过程中出现这个问题，请清除 hbase 安装目录下 logs 文件夹以 hbase 开头的所有日志文件，进入 zkCli.sh 客户端，并用rmr /hbase删除所有关于 hbase 的表信息，并用hdfs dfs -rmr /hbase删除所有关于 hbase 的文件，然后参照我的配置文件进行修改，然后集群就好了。


**org.apache.hadoop.ipc.RemoteException(org.apache.hadoop.ipc.StandbyException): Operation category READ is not supported in state standby**


> 这是由于启动 hbase 时，namenode 所在节点的主机的 hadoop 状态为 standby（备用）态，hbase master 进程会在启动后自动停掉。我出现这个的原因是：我虽然准备搭建 hbase 集群，但是在hbase-site.xml配置文件中的hbase.rootdir属性中配置的依然是单一某个主机节点的共享目录，导致在 standby 态的主机启动 hbase 坏掉。所以解决方案是参照我的配置文件进行修改，清除 hbase 安装目录下 logs 文件夹以 hbase 开头的所有日志文件，进入 zkCli.sh 客户端，并用rmr /hbase删除所有关于 hbase 的表信息，并用hdfs dfs -rmr /hbase删除所有关于 hbase 的文件，然后重新启动start-hbase.sh。


**exception=org.apache.hadoop.hbase.NotServingRegionException: Region hbase:meta,,1 is not online on xxx**


> 即使我已经搭建好的集群，我每次启动还是会报这个错误，但是并不影响正常运行。。。 如果你是集群搭建过程中出现这个问题，请清除 hbase 安装目录下 logs 文件夹以 hbase 开头的所有日志文件，进入 zkCli.sh 客户端，并用rmr /hbase删除所有关于 hbase 的表信息，并用hdfs dfs -rmr /hbase删除所有关于 hbase 的文件，然后参照我的配置文件进行修改，然后集群就好了。


**org.apache.hadoop.ipc.RemoteException(org.apache.hadoop.fs. PathIsNotEmptyDirectoryException): `/hbase/WALs/xxx-splitting is non empty’: Directory is not empty**


> 我出现的原因是配置文件配错，在 hbase-site.xml 配置文件中的hbase.rootdir属性中配置的依然是单一某个主机节点的共享目录，所以 hbase 只会访问单一节点的 hdfs 的 /hbase/WALs/ 目录，导致冲突。解决方案是：请清除 hbase 安装目录下 logs 文件夹以 hbase 开头的所有日志文件，进入 zkCli.sh 客户端，并用rmr /hbase删除所有关于 hbase 的表信息，并用hdfs dfs -rmr /hbase删除所有关于 hbase 的文件，然后参照我的配置文件进行修改，然后集群就好了。

