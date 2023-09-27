---
password: ""
icon: ""
创建时间: "2023-04-07T19:15:00.000Z"
date: "2019-02-08"
type: Post
slug: ywdq07
配置类型:
  type: string
  string: 文档
summary: ""
更新时间: "2023-08-26T14:42:00.000Z"
title: Mybatis分页插件警告解决办法
category: 技术分享
tags:
  - Java
status: Archived
urlname: 88e73589-a9b1-4652-b05e-116b288aa5b8
updated: "2023-08-26 14:42:00"
---

在使用`springmvc+mybatis`分页插件`pagehelper`时，只在业务层引用了 mybatis 的分页插件的 jar 包而表现层接收时没有引用，会报这样的警告：

```java
警告: Hessian/Burlap: 'com.github.pagehelper.Page' is an unknown class in WebappClassLoader
context:
delegate: false
repositories:
----------> Parent Classloader:
ClassRealm[plugin>org.apache.tomcat.maven:tomcat7-maven-plugin:2.2
java.lang.ClassNotFoundException: com.github.pagehelper.Page
```

解决办法：`mybatis`的分页`pagehelper`插件依赖于`mybatis`的相关 jar 包，因此解决办法是在表现层同时加入分页`pagehelper`的`jar`包和`mybatis`的相关 jar 包，如下:

```xml
<dependency>
	<groupId>org.mybatis</groupId>
	<artifactId>mybatis</artifactId>
</dependency>
<dependency>
	<groupId>org.mybatis</groupId>
	<artifactId>mybatis-spring</artifactId>
</dependency>
<dependency>
	<groupId>com.github.miemiedev</groupId>
	<artifactId>mybatis-paginator</artifactId>
</dependency>
<dependency>
	<groupId>com.github.pagehelper</groupId>
	<artifactId>pagehelper</artifactId>
</dependency>
```
