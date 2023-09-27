---
password: ""
icon: ""
创建时间: "2023-04-07T19:15:00.000Z"
date: "2020-10-16"
type: Post
slug: hryfur
配置类型:
  type: string
  string: 文档
summary: 本文主要介绍了如何使用 Nginx 配置重定向和 HTTPS，包括如何将 HTTP 请求重定向到 HTTPS，以及如何申请和配置 SSL 证书。此外，本文还提供了一个简单的脚本，用于自动化启动 Nginx。
更新时间: "2023-08-26T15:21:00.000Z"
title: Nginx配置重定向和Https的实践
category: 技术分享
tags:
  - Nginx
  - SSL
status: Archived
urlname: cbd49264-58c3-4052-b267-0ec9109cb24d
updated: "2023-08-26 15:21:00"
---

# 引言

在`docker`容器化越来越流行的今天，安装各种环境和软件都越来越方便。然而我的腾讯云服务器却依旧使用的是较为原始的`yum`等安装方式，后来换成了宝塔一键式安装后，网站也稳定运行着，也没有再去管了。然而今天发现云服务的内存占用都快满了，然而我还想安装一些其他环境。所以为了进一步榨干云服务的性能，我选择重装系统，全部利用`docker`的方式去安装各种环境。不过今天只记录下安装`nginx`及其一些配置时爬过的坑。

我的博客`blog.letttgaco.cn`，是部署在`GitHub Pages`上的，但是域名备案时是备案的`www.letttgaco.cn`，所以我是想利用`nginx`的重定向功能，将`www.letttgaco.cn`重定向到我的博客去。

# 思路

在 dns 解析中，`blog.letttgaco.cn`已经指向的是`github`（GitHub Pages 已设置强制 HTTPS 访问），现在需要将`www.letttgaco.cn`的`dns`解析指向云服务器上，然后由云服务器上部署的 Nginx 去监听 80 端口和 443 端口，将其重定向/转发至`https://blog.letttgaco.cn`。

# 安装前准备

我的云服务器为腾讯云服务器，系统为 CentOS7.6(64 位)，自带 50G 系统盘。 在`dns`解析中将`www.letttgaco.cn`指向云服务器的对外 IP 地址。

# 安装并配置 Nginx

## 目录结构

```text
|--root                   // root（家）目录
|  |--app                 // 各个程序所在目录
|  |  |--nginx            // 各个程序所在目录
|  |  |  |--conf
|  |  |  |  |--nginx.conf // nginx自定义配置文件
|  |  |  |--html          // 网页根目录
|  |  |  |--logs          // 日志文件
|  |  |  |--ssl           // 各个域名的证书存放地址nginx.conf
|  |--nginx_run.sh        // sh自动化命令
```

按照以上目录结构创建相应的文件夹和文件

```text
mkdir /root/app/nginx/conf -p
touch /root/app/nginx/conf/nginx.conf
mkdir /root/app/nginx/html -p
mkdir /root/app/nginx/logs -p
mkdir /root/app/nginx/ssl -p
touch /root/nginx_run.sh
```

## 配置文件

### 不需要 SSL

如果只需要将`http://www.letttgaco.cn`重定向到`https://blog.letttgaco.cn`，那就只需要配置 80 端口。

```text
vim /root/app/nginx/conf/nginx.conf
```

```text
server {
    listen       80;

    server_name  www.letttgaco.cn;
    rewrite /.* https://blog.letttgaco.cn$uri permanent;
}
```

重定向的`url`是会发生变更，如果是需要隐式转发，则可以进行如下配置：

```text
server {
    listen 80;
    server_name www.letttgaco.cn;
    large_client_header_buffers 4 128k;

    location / {

        #开启对http1.1支持
        proxy_http_version 1.1;

        #设置Connection为空串,以禁止传递头部到后端
        #http1.0中默认值Connection: close
        proxy_set_header Connection "";

        proxy_pass https://blog.letttgaco.cn;
    }
}
```

### 需要 SSL

如果也需要将`https://www.letttgaco.cn`也进行重定向，那么就需要进行额外的证书配置

### 申请 SSL 证书

首先先去腾讯云去申请`www.letttgaco.cn`的 SSL 证书，主要有两个文件：

- `1_www.letttgaco.cn_bundle.crt`
- `2_www.letttgaco.cn.key`

将证书下载下来并上传到`/root/app/nginx/ssl`中，

> 备注：腾讯云 SSL 部署文档

### 配置 conf 文件

```text
server {
    listen 80;
    #SSL 访问端口号为 443
    listen 443 ssl;
    #填写绑定证书的域名
    server_name www.letttgaco;
    #证书文件名称
    ssl_certificate /ssl/1_www.letttgaco.cn_bundle.crt;
    #私钥文件名称
    ssl_certificate_key /ssl/2_www.letttgaco.cn.key;
    ssl_session_timeout 5m;
    #请按照以下协议配置
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    #请按照以下套件配置，配置加密套件，写法遵循 openssl 标准。
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;
    ssl_prefer_server_ciphers on;
        # 重定向
    rewrite /.* https://blog.letttgaco.cn$uri permanent;
}
```

## 启动 Nginx

### 不需要 SSL

```text
docker run -p 80:80 --name nginx -v /root/app/nginx/html/:/usr/share/nginx/html -v /root/app/nginx/nginx.conf:/etc/nginx/conf.d/nginx.conf -v /root/app/nginx/logs/:/var/log/nginx/  --privileged=true -d nginx:1.19.3
```

### 需要 SSL

```text
docker run -p 80:80 -p 443:443 --name nginx -v /root/app/nginx/html/:/usr/share/nginx/html -v /root/app/nginx/nginx.conf:/etc/nginx/conf.d/nginx.conf -v /root/app/nginx/logs/:/var/log/nginx/ -v /root/app/nginx/ssl/:/ssl/ --privileged=true -d nginx:1.19.3
```

> -p 80:80 将 80 端口映射到主机 80 端口

    - `-name nginx` 别名，可以使用别名操作 nginx 容器
    - `v /root/app/nginx/nginx.conf:/etc/nginx/conf.d/nginx.conf` 将主机的配置文件挂载到容器中，使 nginx 容器使用主机中的自定义配置文件
    - `-privileged=true` 获取宿主机 root 权限

    `nginx:1.19.3` 指定 nginx 的版本，防止后续有坑

# 自动化启动 Nginx

为了启动`Nginx`方便，我在这里写了一个简单的`nginx_run.sh`的脚本：

```text
docker stop nginxdocker rm nginxdocker run -p 80:80 -p 443:443 --name nginx -v /root/app/nginx/html/:/usr/share/nginx/html -v /root/app/nginx/nginx.conf:/etc/nginx/conf.d/nginx.conf -v /root/app/nginx/logs/:/var/log/nginx/ -v /root/app/nginx/ssl/:/ssl/ --privileged=true -d nginx:1.19.3
```

# 结束

至此，我的网站终于可以实现`http`和`https`的重定向了。
