---
password: ''
icon: ''
创建时间: '2023-04-07T19:15:00.000Z'
date: '2019-02-09 00:00:00'
type: Post
slug: oelsu8
配置类型:
  type: string
  string: 文档
summary: ''
更新时间: '2023-08-26T15:24:00.000Z'
title: 注解式配置dubbo服务
category: 学习笔记
tags:
  - Java
status: Archived
urlname: 0feb7c90-7c54-4806-9ade-d9ae5bab5946
updated: '2023-08-26 23:24:00'
---

# 引言


之前在做项目时一直用的都是 dubbo 的 xml 配置，在调试时未防止连接超时，一般会在 xml 中设置超时时间，但是最近的项目试了下 dubbo 的注解配置，但是一时半会没找到利用注解配置来设置超时时间，于是找了找资料，整理出常用的 dubbo 的配置文件以及注解配置设置超时时间等属性。


# 服务提供者


## applicationContext-service.xml 配置文件


```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:p="http://www.springframework.org/schema/p"
	xmlns:context="http://www.springframework.org/schema/context"
	xmlns:dubbo="http://code.alibabatech.com/schema/dubbo"
    xmlns:mvc="http://www.springframework.org/schema/mvc"
	xsi:schemaLocation="http://www.springframework.org/schema/beans 
        http://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/mvc
        http://www.springframework.org/schema/mvc/spring-mvc.xsd
        http://code.alibabatech.com/schema/dubbo
        http://code.alibabatech.com/schema/dubbo/dubbo.xsd
        http://www.springframework.org/schema/context 
        http://www.springframework.org/schema/context/spring-context.xsd">
        
	<!--发布dubbo服务 -->
	<!--提供方应用信息,用于计算依赖关系-->
	<dubbo:application name="tiramisu-sellergoods-service" />
	<!--注册中心的地址-->
	<dubbo:registry protocol="zookeeper" address="xxx.xxx.xxx.xxx:2181" />
	<!--用于dubbo协议在20881端口暴露服务-->
	<dubbo:protocol name="dubbo" port="20881"/>
    <!--配置dubbo注解扫描包路径-->
	<dubbo:annotation package="cn.tiramisu.sellergoods.service.impl"/>
</beans>
```


## @Service 实现类


```java
import com.alibaba.dubbo.config.annotation.Service;

//注意不是springframework的service
@Service
public class TiramisuServiceImpl implements TiramisuService {
    
}
```


# 服务消费者


## springmvc.xml 配置文件


```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:p="http://www.springframework.org/schema/p"
	xmlns:context="http://www.springframework.org/schema/context"
	xmlns:dubbo="http://code.alibabatech.com/schema/dubbo" 
	xmlns:mvc="http://www.springframework.org/schema/mvc"
	xsi:schemaLocation="http://www.springframework.org/schema/beans
	http://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/mvc 
        http://www.springframework.org/schema/mvc/spring-mvc.xsd
        http://code.alibabatech.com/schema/dubbo 
        http://code.alibabatech.com/schema/dubbo/dubbo.xsd
        http://www.springframework.org/schema/context 
        http://www.springframework.org/schema/context/spring-context.xsd">

	<!-- 引用dubbo服务 -->
	<dubbo:application name="tiramisu-manager-web" />
    <!--注册中心的地址-->
	<dubbo:registry address="zookeeper://xxx.xxx.xxx.xxx:2181"/>
    <!--配置dubbo注解扫描包路径-->
	<dubbo:annotation package="cn.letttgaco.manager.controller" />  	
</beans>
```


## @Reference 注解


```java
import com.alibaba.dubbo.config.annotation.Reference;@RestController

@Controller
public class BrandController {
    //使用dubbo提供的reference注解，引用dubbo服务
	@Reference
	private TiramisuService tiramisuService; 
}
```


## @Service 和@Reference 的属性配置


在平时测试过程中，由于 dubbo 默认的超时时间为 5000 毫秒，无法很方便的进行测试，容易报超时异常，而在以前的 xml 配置 dubbo 时，经常这样配置客户端的超时时间：


```xml
<!--设置超时时间为30秒-->
<dubbo:service interface="cn.letttgaco.order.service.OrderService" ref="orderServiceImpl" timeout="300000"/>
```


但是现在用的是 dubbo 的注解形式，设置注解形式的超时时间是直接在注解中声明的：


```java
//都要设置超时时间为30秒
//服务提供方
@Service(timeout=300000)
//服务消费者
@Reference(timeout=300000)
```


当然还有更多的属性都可以设置，如果有需要的可以研究下。

