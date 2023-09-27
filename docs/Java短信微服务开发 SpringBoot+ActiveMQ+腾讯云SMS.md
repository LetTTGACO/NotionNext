---
password: ""
icon: ""
创建时间: "2023-04-07T19:15:00.000Z"
date: "2019-04-02"
type: Post
slug: qykfat
配置类型:
  type: string
  string: 文档
summary: 这篇文章介绍了如何使用 SpringBoot、ActiveMQ 和腾讯云 SMS 搭建 Java 短信微服务，并提供了详细的步骤和代码示例。
更新时间: "2023-08-26T14:43:00.000Z"
title: Java短信微服务开发 SpringBoot+ActiveMQ+腾讯云SMS
category: 技术分享
tags:
  - Java
status: Archived
urlname: af91247d-4fac-406b-8272-9a807defeefd
updated: "2023-08-26 14:43:00"
---

# 引言

在 2018 年学习 Java 的 WEB 开发时，就慢慢变得上瘾起来，不太愿意用视频中给的静态网页来做项目。自己便用不太熟练的 JS 写了个注册网页，然后还用上了邮箱验证码，很喜欢这个网页。但是后来的项目一直用不上，直到最近做一个网站，刚好可以用到之前做的注册网页。就把它用更高级的 Angular JS 改造了一下，并改成了手机短信验证码，感觉更有成就感了！ 此次开发的短信微服务是利用 SpringBoot 快速搭建 ActiveMQ，因为我的云服务器和域名都在腾讯云，而且腾讯云短信每个月送 100 条短信，对我日常开发测试而言，根本用不完，所以使用腾讯云短信 API 完成发送短信，里面有好多技术都是第一次接触，所以写一下记录下细节。

# 项目架构

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/da78077740f7d9ef55f93d731d9678e6.png)

# 利用 SpringBoot 搭建 ActiveMQ

## 创建 Maven 工程 letttgaco_sms_service（注意：打包方式为 jar）

添加如下依赖至 pom.xml

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<groupId>cn.letttgaco.sms</groupId>
	<artifactId>letttgaco_sms_service</artifactId>
	<version>1.0</version>
    <!-- 用Eclipse建SpringBoot项目会默认为jdk1.6 这里调整为jdk1.7 -->
	<properties>
		<java.version>1.7</java.version>
	</properties>
	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>1.4.0.RELEASE</version>
	</parent>
	<dependencies>
        <!-- 起步依赖 SpringBoot核心部分就是依赖传递，它会自动引入WEB开发所需要的所有包，
			甚至连tomcat都内置了，所以这也是它搭建如此之快的原因了-->
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency>
		<!-- activtemq 只需要引入这一个依赖，它就会把所有用到的关联jar包都依赖传递过来-->
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-activemq</artifactId>
		</dependency>
		<!-- 腾讯云短信API -->
		<dependency>
			<groupId>com.github.qcloudsms</groupId>
			<artifactId>qcloudsms</artifactId>
			<version>1.0.6</version>
		</dependency>
        <!-- springboot热部署 除了改pom文件，其他文件改了都不用重启，简直节省大量时间啊-->
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-devtools</artifactId>
		</dependency>
	</dependencies>
</project>
```

## 创建引导类 Application.java

这个类是程序的入口，启动它就能启动 SpringBoot 容器

```java
package cn.letttgaco.sms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
//@SpringBootApplication其实就是以下三个注解的总和
//@Configuration： 用于定义一个配置类
//@EnableAutoConfiguration ：Spring Boot会自动根据你jar包的依赖来自动配置项目。
//@ComponentScan： 告诉Spring 哪个packages 的用注解标识的类 会被spring自动扫描并且装入bean容器。
public class Application {
	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}
}
```

## 使用腾讯云 SMS 需要准备的信息

在腾讯云开通短信服务，申请好短信签名和短信模板后，可以将相关配置储存到配置文件 application.properties（直接在 resources 中创建）中。[点击前往腾讯云短信官方文档](https://cloud.tencent.com/document/product/382/18071)

```java
// 短信应用SDK AppID
	int appid = 1400xxxx; // 1400开头

    // 短信应用SDK AppKey
    String appkey = "qwertyuiopasdfghjkl123456789";

    // 需要发送短信的手机号码
    String[] phoneNumbers = {"21212313123", "12345678902", "12345678903"};

    // 短信模板ID，需要在短信应用中申请
    int templateId = 7839; // NOTE: 这里的模板ID`7839`只是一个示例，真实的模板ID需要在短信控制台中申请
    // 签名
    String smsSign = "腾讯云"; // NOTE: 签名参数使用的是`签名内容`，而不是`签名ID`。这里的签名"腾讯云"只是一个示例，真实的签名需要在短信控制台申请。
```

## 创建腾讯云 SMS 工具类 SmsUtil.java

```java
package cn.letttgaco.sms;

import java.io.IOException;
import java.util.Map;

import org.json.JSONException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import com.github.qcloudsms.SmsMultiSender;
import com.github.qcloudsms.SmsMultiSenderResult;
import com.github.qcloudsms.httpclient.HTTPException;
@Component
public class SmsUtil {
	//用来读取springboot的配置文件中的内容
	@Autowired
	private Environment env;

	/**
	 * 我只在配置文件中存储了appid和appkey,其他信息我选择从上层传过来
	 * @param map
	 */
	public void sendSms(Map<String,String> map) {
		try {
			//因为我这里只会用到单个手机号，所以用map传输
			String phone = map.get("phone");
			int templateId = Integer.parseInt(map.get("templateId"));
			String smsSign = map.get("smsSign");
            //多个手机号可以在数组中填写多个
			String[] phoneNumbers = {phone};
			String code = map.get("code");
            //我的短信模板是“欢迎注册，{1}为您的验证码,请于5分钟内填写。”
            //{1}对应下面数组中的第一个信息
			String[] params = { code };// 对应模板中的内容
			//从配置文件中获取信息
			int appid = Integer.parseInt(env.getProperty("appid"));
			String appkey = env.getProperty("appkey");
			SmsMultiSender msender = new SmsMultiSender(appid,appkey);
			// 签名参数未提供或者为空时，会使用默认签名发送短信
			SmsMultiSenderResult result = msender.sendWithParam("86", phoneNumbers,templateId, params, smsSign, "", "");
			System.out.println(result);
		} catch (HTTPException e) {
			// HTTP响应码错误
			e.printStackTrace();
		} catch (JSONException e) {
			// json解析错误
			e.printStackTrace();
		} catch (IOException e) {
			// 网络IO错误
			e.printStackTrace();
		}
	}

}
```

## 创建消息的消费者 SmsListener.java

利用 SpringBoot 甚至不用配置 ActiveMQ 的 xml 文件！！！！

```java
package cn.letttgaco.sms;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;
/**
 * 消息的消费端,监听消息
 * @author LetTTGACO
 *
 */
@Component
public class SmsListener {

	@Autowired
	private SmsUtil smsUtil;
	//destination="sendSms"指消费端会监听名称为sendSms的队列
	@JmsListener(destination="sendSms")
	public void sendSms(Map<String,String> map) {
		smsUtil.sendSms(map);
	}

}
```

## 创建消息的生产者

```java
package cn.letttgaco.user.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.jms.core.JmsMessagingTemplate;

import com.alibaba.dubbo.config.annotation.Service;


/**
 * 消息的生产者
 * @author LetTTGACO
 *
 */
@RestController
public class UserServiceImpl implements UserService {

    @Autowired
	private JmsMessagingTemplate jmsMessagingTemplate;

	@Value("${templateId}")
	private String templateId;

	@Value("${smsSign}")
	private String smsSign;

	@RequestMapping("/sendSms")
	public void sendSms(String phone) {
		//将短信内容发送给ActiveMQ
		Map<String, String> map = new HashMap<String, String>();
		map.put("phone", phone);//手机号
		map.put("templateId", templateId);//签名模板
		map.put("smsSign", smsSign);//签名内容
		jmsMessagingTemplate.convertAndSend("sendSms",phone);

	}

}
```

# 测试

> 注：可以在 application.properties 设置内置 tomcat 的访问端口号，默认为 8080。

```xml
server.port=9080
```

## 启动 Application.java

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/c17f754e7ff2fde75784a8af71b9e0ae.png)

## 打开浏览器

输入`http://localhost:9080/sendSms?phone=13333333333` 消息产生过程：

1. 浏览器访问到控制层 sendSms()方法产生消息，并推送给 ActiveMQ。
2. 消费者监听消息，接收 ActiveMQ 的消息，执行发送短信的任务。
3. 手机收到短信

---

至此，短信微服务搭建成功！
