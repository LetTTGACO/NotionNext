---
password: ""
icon: ""
创建时间: "2023-04-07T19:15:00.000Z"
date: "2020-04-15"
type: Post
slug: ymxk6u
配置类型:
  type: string
  string: 文档
summary: ""
更新时间: "2023-08-26T15:24:00.000Z"
title: 阿里canal数据库命令总结
category: 学习笔记
tags:
  - Java
status: Archived
urlname: d9d157b7-9c7f-4375-8d60-d4b58d51882a
updated: "2023-08-26 15:24:00"
---

查看端口：netstat -ntulp

# canal

```text
路径：/root/canal
配置文件：vim /root/canal/conf/example/instance.properties
启动：sh /root/canal/bin/startup.sh
关闭：sh /root/canal/bin/stop.sh
server日志：tail -100f logs/canal/canal.log
nstance日志：tail -100f logs/example/example.log
删除日志：rm -rf logs/canal/canal.log logs/example/example.log
端口：119.27.172.40:11111
```

# zookeeper

```text
路径：/usr/local/zookeeper
配置文件：vim conf/zoo.cfg
启动：bin/zkServer.sh start
关闭：bin/zkServer.sh stop
状态：zkServer.sh status
验证：telnet 127.0.0.1 2181
         stat
关闭：./zkServer.sh stop
端口：119.27.172.40:2181
```

# zkui

```text
路径：/root/zkui
配置文件：vim config.cfg
配置文件：vim target/config.cfg
前台启动：java -jar target/zkui-2.0-SNAPSHOT-jar-with-dependencies.jar
后台启动：nohup java -jar target/zkui-2.0-SNAPSHOT-jar-with-dependencies.jar &
端口：119.27.172.40:9090
```

# kafka

```text
路径：/usr/local/kafka/kafka_2.11-1.1.1
配置文件：vim config/server.properties
启动server：bin/kafka-server-start.sh  -daemon  config/server.properties &
关闭server：bin/kafka-server-stop.sh
查看所有topic：bin/kafka-topics.sh --list --zookeeper 119.27.172.40:2181
查看指定topic下面的数据：
bin/kafka-console-consumer.sh --bootstrap-server 119.27.172.40:9092  --from-beginning --topic example_t
端口：119.27.172.40:9092
```
