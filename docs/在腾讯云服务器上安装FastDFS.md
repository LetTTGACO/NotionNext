---
password: ""
icon: ""
创建时间: "2023-04-07T19:15:00.000Z"
date: "2019-02-21"
type: Post
slug: di6uo5
配置类型:
  type: string
  string: 文档
summary: ""
更新时间: "2023-08-26T14:48:00.000Z"
title: 在腾讯云服务器上安装FastDFS
category: 学习笔记
tags:
  - Java
status: Archived
urlname: 5608118c-f262-4b39-999d-d67a5424cd82
updated: "2023-08-26 14:48:00"
---

# 引言

FastDFS 是一个由 C 语言实现的开源轻量级分布式文件系统，作者余庆[@YuQing](https://github.com/happyfish100) ，支持 Linux、FreeBSD、AID 等 Unix 系统，解决了大数据存储和读写负载均衡等问题，适合存储 4KB~500MB 之间的小文件，如图片网站、短视频网站、文档、app 下载站等，UC、京东、支付宝、迅雷、酷狗等都有使用。

# 安装前准备

我的云服务器为腾讯云服务器，系统为 CentOS7.2(64 位)，自带 50G 系统盘。

# 安装 FastDFS

## 上传安装包

此次用到的安装包如图所示，我们首先用 FTP 工具把 FastDFS(

[点击下载安装包](https://files.letttgaco.cn/%E6%8A%80%E6%9C%AF%E6%94%AF%E6%8C%81/FastDFS/)

)的相关安装包上传至服务器的

```text
/usr/local/fastDFS
```

目录中（也可以自行选择目录，后面在涉及到修改配置文件时会进一步提示说明）。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/123f0954a1ef099862b4c0b234f64770.png)

## 安装基本环境

```shell
yum -y install libevent
```

## 安装 libfastcommonV1.0.7 工具包

```text
tar -zxvf libfastcommonV1.0.7.tar.gz
```

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/0d4cd6510527743d9684c0532cce4fd5.png)

进入解压后的目录，看到有

```text
make.sh
```

，依次执行命令进行编译。

```text
./make.sh
./make.sh install
```

## 安装 Tracker 服务

```text
tar -zxvf FastDFS_v5.05.tar.gz
```

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/7f1b89d682275459b0025ef9f519a405.png)

进入文件夹后依次执行命令进行编译:

```text
./make.sh
./make.sh install
```

安装后文件会默认安装在 `/usr/bin` 中:

```text
ll fdfs*
```

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/59bccf5c5beeb9e21def10a6f63cf5d1.png)

配置文件在

```text
/etc/fdfs
```

目录中：

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/28600acdb178a4e4a8c7a08d6cab471a.png)

进入

```text
/usr/locla/fastDFS/FastDFS/conf/
```

目录下:

```text
cd /usr/locla/fastDFS/FastDFS/conf/
```

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/4bceda5a68b38e353df077bb7ca9b92a.png)

将其所有文件拷贝至

```text
/etc/fdfs
```

目录下:

```text
cp * /etc/fdfs/
```

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/c2a0ec2752e7ce26897dbf01211b16ee.png)

配置 tracker 服务,进入

```text
/etc/fdfs/
```

目录下，修改

```text
tracker.conf
```

文件

```text
cd /etc/fdfs/
vim tracker.conf
```

修改`base_path`为自定义存放 tracker 日志的目录，这里以`/usr/local/fastDFS/trackerLog`为例，如果没有创建此目录，可以先修改再创建。

```text
mkdir -p /usr/local/fastDFS/trackerLog
```

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/a5da58745f7227edbc7e32d84508cabb.png)

> 这里我们也可以挂载的一个云硬盘，使用云硬盘的目录来存放文件。因为系统盘不支持扩容，以后系统盘满了之后就很麻烦，所以最好就挂载一个硬盘，同时也可以把图片文件都和系统盘给区分开来。我暂时没有云硬盘，这里以系统盘为例。

启动 tracker 服务并查看进程是否已启动

```text
/usr/bin/fdfs_trackerd /etc/fdfs/tracker.conf
ps aux|grep trackerd
```

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/f0cec77c70144bd8f858269331a871c3.png)

## 安装 storage 服务

进入`/etc/fdfs/`目录，修改`storage.conf`文件

```text
vim /etc/fdfs/storage.conf
```

修改日志的存储路径，如果没有相关文件夹，可以先配置再创建：

```text
mkdir -p /usr/local/fastDFS/storageLog/
```

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/d5de4f493bb887c876470e6c334d2bb1.png)

修改文件的存储路径：

```text
mkdir -p /usr/local/fastDFS/storage/
```

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/746d2e7cadaa6349188b24e479ffb194.png)

修改

```text
tracker_server
```

的值为云服务器的公网 IP 地址。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/ae9ebd239bf524d95a03ba2b37c98a89.png)

启动 storage 服务并且查看进程：

```text
/usr/bin/fdfs_storaged /etc/fdfs/storage.conf
ps aux|grep storage
```

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/9ae28af1d244c68350238cd0b45ce9f0.png)

至此，FastDFS 安装完毕，但是我们需要通过 http 来进行上传文件并访问，所以需要使用 nginx 一起来搞事情！

## 安装 nginx

进入`/usr/local/fastDFS`目录，解压缩 fastdfs-nginx-module_v1.16.tar.gz

```text
tar -zxvf fastdfs-nginx-module_v1.16.tar.gz
```

修改`/fastdfs-nginx-module/src/config`文件，把其中的`local`去掉:

```text
cd fastdfs-nginx-module/src/
vim config
```

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/dd964c018aff9ff760d3d84f839f4067.png)

创建默认的 nginx 的安装目录：

```text
mkdir /usr/local/nginx/
```

进入 nginx 根目录进行配置：

```text
cd /usr/local/fastDFS/nginx-1.14.2/
```

直接输入以下命令对 nginx 进行配置:

> 注意：最后一行**--add-module=/usr/local/fastDFS/nginx/fastdfs-nginx-module/src**的目录为你所指定的**fastdfs-nginx-module**的安装目录

```text
./configure \
--prefix=/usr/local/nginx \
--pid-path=/var/run/nginx/nginx.pid \
--lock-path=/var/lock/nginx.lock \
--error-log-path=/var/log/nginx/error.log \
--http-log-path=/var/log/nginx/access.log \
--with-http_gzip_static_module \
--http-client-body-temp-path=/var/temp/nginx/client \
--http-proxy-temp-path=/var/temp/nginx/proxy \
--http-fastcgi-temp-path=/var/temp/nginx/fastcgi \
--http-uwsgi-temp-path=/var/temp/nginx/uwsgi \
--http-scgi-temp-path=/var/temp/nginx/scgi \
--add-module=/usr/local/fastDFS/nginx/fastdfs-nginx-module/src
```

依次执行以下命令进行编译：

```text
make
make install
```

把`/fastdfs-nginx-module/src/mod_fastdfs.conf`文件复制到`/etc/fdfs`目录下：

```text
cd /usr/local/fastDFS/nginx/fastdfs-nginx-module/src/
cp mod_fastdfs.conf /etc/fdfs
```

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/6605d5944a1ef48a5ecf68d7ce3822b4.png)

进入

```text
/etc/fdfs/
```

，打开

```text
mod_fastdfs.conf
```

并且修改日志存放路径：

```text
mkdir -p /usr/local/fastDFS/tmp/
cd /etc/fdfs/
vim mod_fastdfs.conf
```

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/ec5b95f87e3edda9891a43f994387d5c.png)

修改

```text
tracker_server
```

的值为云服务器的公网 IP 地址。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/03726f041e73e6d1970a60ba147083df.png)

修改

```text
storage_path0
```

的存放路径：

```text
mkdir -p /usr/local/fastDFS/storage/
```

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/e67978445231868f6527263fdda2c281.png)

进入 ngxin 的配置文件目录并且修改

```text
nginx.conf
```

文件：

```text
cd /usr/local/nginx/conf/
vim nginx.conf
```

修改原 server 中的配置为以下：

```text
server {
  listen       80;
  server_name  你的公网IP地址;

  location /group1/M00 {
  ngx_fastdfs_module;
  }
}
```

启动 nginx

```text
/usr/local/nginx/sbin/nginx
```

## 安装完成

至此，FastDFS 已全部安装完成，下面将介绍如何利用 java 开发工具来测试 FastDFS 的上传文件功能。

# 上传测试

需求：将本地图片上传至图片服务器，再控制台打印 url。

## 创建 Maven 工程 FastDFSTest

由于 FastDFS 客户端 jar 包并没有在中央仓库中，所以需要使用下列命令手动安装 jar 包到 Maven 本地仓库。 源码地址：[fastdfs-client-java](https://github.com/happyfish100/fastdfs-client-java)，解压后导入 Eclipse 的 Maven 工程，右键项目选择`Run As — Maven Install`进行本地仓库的安装。 在你的`FastDFSTest`工程的`pom.xml`中添加依赖：

```xml
<dependency>    <groupId>org.csource</groupId>    <artifactId>fastdfs-client-java</artifactId>    <version>1.27-SNAPSHOT</version></dependency>
```

## 在 resources 文件夹中创建`fdfs_client.conf`文件

```text
# 连接超时时间
# 默认30s
connect_timeout=30

# 网络超时时间
# 默认30秒30s
network_timeout=60

# 工作文件夹，日志存在此（目录自定）
base_path=/home/yuqing/fastdfs

# tracer server服务器地址列表，多个tracer server的话，分行列出
tracker_server=你的公网IP:22122

#日志级别
### emerg for emergency
### alert
### crit for critical
### error
### warn for warning
### notice
### info
### debu
log_level=info

# 是否使用连接池
use_connection_pool = false

# 连接闲置超时时间，连接如果闲置的时间超过本配置，则关闭次连接，单位秒
connection_pool_max_idle_time = 3600

# 是否从tracer server读取fastdfs的参数，默认为false
load_fdfs_parameters_from_tracker=false

# 是否使用storage id 替换 ip，默认为false
# 和tracker.conf该参数含义一样
# 本配置只有在load_fdfs_parameters_from_tracker＝false时生效
# 本配置默认为false
use_storage_id = false

# 指定storage id的文件名，允许使用绝对路径
# 和tracker.conf该参数含义一样
# 本配置只有在load_fdfs_parameters_from_tracker＝false时生效
storage_ids_filename = storage_ids.conf

#HTTP settings
http.tracker_server_port=8080

#引入HTTP相关配置
##include http.conf
```

## 创建测试 java 类

```java
package cn.letttgaco.fastdfs;import org.csource.fastdfs.ClientGlobal;import org.csource.fastdfs.StorageClient;import org.csource.fastdfs.StorageServer;import org.csource.fastdfs.TrackerClient;import org.csource.fastdfs.TrackerServer;public class TestDemo {    public static void main(String[] args) throws Exception {        // 1、加载配置文件（绝对路径），配置文件中的内容就是 tracker 服务的地址。        ClientGlobal.init("D:/Codes/Eclipse/Tiramisu/spring-security-demo/src/main/resources/fdfs_client.conf");        // 2、创建一个 TrackerClient 对象。直接 new 一个。        TrackerClient trackerClient = new TrackerClient();        // 3、使用 TrackerClient 对象创建连接，获得一个 TrackerServer 对象。        TrackerServer trackerServer = trackerClient.getConnection();        // 4、创建一个 StorageServer 的引用，值为 null        StorageServer storageServer = null;        // 5、创建一个 StorageClient 对象，需要两个参数 TrackerServer 对象、StorageServer 的引用        StorageClient storageClient = new StorageClient(trackerServer, storageServer);        // 6、使用 StorageClient 对象上传图片（绝对路径）。        // 扩展名不带“.”        String[] strings = storageClient.upload_file("D:/Codes/TestCodes/c.JPG", "jpg", null);        // 7、返回数组。包含组名和图片的路径。        for (String string : strings) {            System.out.println(string);        }    }}
```

控制台输出如下结果：

```java
group1M00/00/00/wKgZhVkMP4KAZEy-AAA-tCf93Fo973.jpg
```

## 打开浏览器查看已上传的图片

```text
http://你的公网IP/group1/M00/00/00/wKgZhVkMP4KAZEy-AAA-tCf93Fo973.jpg
```
