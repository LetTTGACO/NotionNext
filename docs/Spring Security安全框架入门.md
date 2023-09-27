---
password: ""
icon: ""
创建时间: "2023-04-07T19:15:00.000Z"
date: "2019-02-17"
type: Post
slug: fh1na3
配置类型:
  type: string
  string: 文档
summary: ""
更新时间: "2023-08-26T15:24:00.000Z"
title: Spring Security安全框架入门
category: 学习笔记
tags:
  - Java
status: Archived
urlname: 31d9494b-7c68-4d94-a407-7625e31421fb
updated: "2023-08-26 15:24:00"
---

# 引言

Spring Security 是一个能够为基于 Spring 的企业应用系统提供声明式的安全访问控制解决方案的安全框架。它提供了一组可以在 Spring 应用上下文中配置的 Bean，充分利用了 Spring IOC（Inversion of Control 控制反转），DI（Dependency Injection 依赖注入）和 AOP（Aspect Oriented Programming 面向切面编程）功能，为应用系统提供声明式的安全访问控制功能，减少了为企业系统安全控制编写大量重复代码的工作。

## pom.xml

在 spring framework 常规依赖的基础上添加以下依赖：

```xml
<dependency>
	<groupId>org.springframework.security</groupId>
	<artifactId>spring-security-config</artifactId>
	<version>4.1.0.RELEASE</version>
</dependency>
<dependency>
	<groupId>javax.servlet</groupId>
	<artifactId>servlet-api</artifactId>
	<version>2.5</version>
	<scope>provided</scope>
</dependency>
```

## web.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns="http://java.sun.com/xml/ns/javaee"
	xsi:schemaLocation="http://java.sun.com/xml/ns/javaee
                        http://java.sun.com/xml/ns/javaee/web-app_2_5.xsd"
         version="2.5">
    <!-- security安全框架 -->
	<context-param>
        <param-name>contextConfigLocation</param-name>
        <param-value>classpath:spring-security.xml</param-value>
	</context-param>
	<listener>
        <listener-class>
            org.springframework.web.context.ContextLoaderListener
        </listener-class>
	</listener>
	<filter>
        <filter-name>springSecurityFilterChain</filter-name>
        <filter-class>
            org.springframework.web.filter.DelegatingFilterProxy
        </filter-class>
	</filter>
	<filter-mapping>
        <filter-name>springSecurityFilterChain</filter-name>
        <url-pattern>/*</url-pattern>
	</filter-mapping>
</web-app>
```

## spring-security.xml(静态设置账号密码)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans:beans xmlns="http://www.springframework.org/schema/security"
xmlns:beans="http://www.springframework.org/schema/beans"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.springframework.org/schema/beans
    http://www.springframework.org/schema/beans/spring-beans.xsd
    http://www.springframework.org/schema/security
    http://www.springframework.org/schema/security/spring-security.xsd">

    <!-- 以下页面不被拦截 -->
	<http pattern="/login.html" security="none"></http>
	<!-- 页面拦截规则 -->
	<http use-expressions="false">
        <!-- intercept-url表示需要拦截的 -->
        <!-- /**表示拦截所有,access中必须以"ROLE_"开头,后面的是自定的用户-->
		<intercept-url pattern="/**" access="ROLE_TEST" />
        <!--
			login-page：指定登录页面。
			authentication-failure-url：指定了身份验证失败时跳转到的页面。
			default-target-url：指定了成功进行身份验证和授权后默认呈现给用户的页面。
 		-->
        <form-login login-page="/login.html" default-target-url="/index.html" authentication-failure-url="/error.html"/>
        <!-- 关闭CSRF,如果不加会出现错误 -->
        <!-- CSRF（Cross-site request forgery）跨站请求伪造，也被称为“One Click Attack”或者Session Riding，通常缩写为CSRF或者XSRF，是一种对网站的恶意利用。-->
		<csrf disabled="true"/>
        <!-- 如果你在系统中使用了框架页，需要设置框架页的策略为SAMEORIGIN -->
        <headers>
			<frame-options policy="SAMEORIGIN"/>
		</headers>
	</http>

	<!-- 认证管理器 -->
	<authentication-manager>
		<authentication-provider>
			<user-service>
                <!-- 为方便测试,将账号密码固定了 -->
				<user name="admin" password="123456" authorities="ROLE_TEST"/>
			</user-service>
		</authentication-provider>
	</authentication-manager>
</beans:beans>
```

## 动态从数据库中获取账号密码

### 创建 UserDetailsServiceImpl.java 并实现 UserDetailsService 接口

```java
package cn.letttgaco.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import cn.letttgaco.pojo.LoginUser;

public class UserDetailServiceImpl implements UserDetailsService {

	private SellerService sellerService;

	public void setSellerService(SellerService sellerService) {
		this.sellerService = sellerService;
	}

	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		System.out.println("通过UserDetailServiceImpl");
		// 构建角色列表
		List<GrantedAuthority> grantAuths = new ArrayList<GrantedAuthority>();
		// 添加角色
		grantAuths.add(new SimpleGrantedAuthority("ROLE_SELLER"));
		//得到用户对象
		LoginUser user = userService.login(username);
		if (user != null) {
			// 返回具有一定角色对象的用户对象
			return new User(username, user.getPassword(), grantAuths);
			return null;
		}else {
			return null;
		}
	}
}
```

### spring-security.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans:beans xmlns="http://www.springframework.org/schema/security"
	xmlns:beans="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:dubbo="http://code.alibabatech.com/schema/dubbo"
	xsi:schemaLocation="http://www.springframework.org/schema/beans
	http://www.springframework.org/schema/beans/spring-beans.xsd
	http://www.springframework.org/schema/security
	http://www.springframework.org/schema/security/spring-security.xsd
	http://code.alibabatech.com/schema/dubbo
	http://code.alibabatech.com/schema/dubbo/dubbo.xsd">


	<!-- 设置不登录也可以访问的页面 -->
	<http pattern="/*.html" security="none"></http>
	<http pattern="/css/**" security="none"></http>
	<http pattern="/img/**" security="none"></http>
	<http pattern="/js/**" security="none"></http>
	<!-- 放开用户注册入口 -->
	<http pattern="/user/register.do" security="none"></http>

	<!-- 页面拦截规则 use-expressions:是否启用SPEL表达式,默认为true -->
	<http use-expressions="false">
		<!-- 当前用户必须有ROLE_USER的角色才可访问根目录及所属子目录的资源 -->
		<intercept-url pattern="/**" access="ROLE_SELLER" />
		<!-- 开启表单登录功能 -->
		<form-login login-page="/login.html"
			default-target-url="/index.html" authentication-failure-url="/login.html"
			always-use-default-target="true" />
		<!-- 关闭csrf -->
		<csrf disabled="true" />
		<!-- 配置策略,使用框架页面 -->
		<headers>
			<frame-options policy="SAMEORIGIN" />
		</headers>
		<logout />
	</http>

	<!-- 添加认证类 -->
	<beans:bean id="userDetailService" class="cn.letttgaco.service.UserDetailServiceImpl">
		<beans:property name="userService" ref="userService"></beans:property>
	</beans:bean>

	<!-- 认证管理器 -->
	<authentication-manager>
		<!-- 认证的提供者 -->
		<authentication-provider user-service-ref="userDetailService"/>
	</authentication-manager>
</beans:beans>
```

通过以上配置，用户在登陆页输入用户名和密码与数据库一致即可登陆。
