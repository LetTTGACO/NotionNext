---
password: ""
icon: ""
创建时间: "2023-04-07T19:15:00.000Z"
date: "2019-05-04"
type: Post
slug: olp6f6
配置类型:
  type: string
  string: 文档
summary: ""
更新时间: "2023-08-26T14:43:00.000Z"
title: Centos命令提示符显示完整路径
category: 学习笔记
tags:
  - Linux
status: Archived
urlname: 53037fea-b13b-4fc6-8c6b-a254bb871dcd
updated: "2023-08-26 14:43:00"
---

# 前言

Linux 下，命令行显示路径仅最后一个文件名，非常不方便， 最近在学大数据的时候才偶然发现这个小细节，简直太省心了，记录一下。

# Centos 命令提示符显示完整路径

编辑`[/etc/profile]`文件，在末尾添加环境变量 PS1

```text
export PS1='[\u@\h `pwd`]\$'
```

刷新配置文件，使其生效

```text
$> source /etc/profile
```

> 命令释义： \u 显示当前用户账号 \h 显示当前主机名 只显示当前路径最后一个目录 显示当前绝对路径（当前用户目录会以 ~代替） pwd 显示当前全路径 $ 显示命令行’$‘或者’#’符号

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/d703f084edb6c651bf916d71947e03f5.png)
