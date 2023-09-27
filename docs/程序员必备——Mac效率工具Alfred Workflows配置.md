---
password: ""
icon: ""
创建时间: "2023-04-07T19:15:00.000Z"
date: "2022-04-19"
type: Post
slug: rm057k
配置类型:
  type: string
  string: 文档
summary: Alfred YYDS
更新时间: "2023-04-10T05:04:00.000Z"
title: 程序员必备——Mac效率工具Alfred Workflows配置
category: 技术分享
tags:
  - 效率工具
status: Published
urlname: 08ccfc16-c8cb-42a2-ad65-b37c4d49ce78
updated: "2023-04-10 05:04:00"
---

# 引言

最近发现`Alfred`简直不要太好用，快速打开网址功能（Web Search）在工作中使用起来行云流水，再也不用去一堆标签中寻找常用的网址。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/c88cff762b3fefd15034d524b1e4885d.png)

但是在项目开发过程中，经常需要打开或运行各种项目，所以需要经常使`iTerm`或者`IDE`进入到各种项目文件夹中。在`VSCode`中，大家经常会使用`code`命令打开项目，再配合环境变量的别名设置，使用起来很方便。但是！我是忠诚的`WebStorm`党派，每次打开项目都得先打开应用然后找到需要打开的项目（不过后来发现，`WebStorm`其实也有命令行启动器，效果也一样）。但是这么做也有一个痛点，就是需要事先配置环境变量的别名才能做到快速打开。 最近一琢磨，可以利用`Aflfed`的`Workflows`功能去尝试一下，于是真被我搞出来了，这里记录一下。

# 开始

## Open in WebStorm

用`WebStrom`打开项目。通过`code`命令打开指定目录下的文件夹，快速打开项目。效果如下：

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/0eb51c9380631c51d6f34b67c8262397.gif)

### 运行流程

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/98401f1514a56f0602d7eab7e83597f2.png)

### 设置

1. 右下角新建一个`Blank Workflow`，配置如下：

注意`Bundle id`必须是唯一的才行。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/7a565a10c7bc037f90b6505033aa7def.png)

1. 右键新增一个`File Filter`，配置如下：

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/f8a2896728c9a744d422ec7ea435941f.png)

`Basic Setup`基础设置。

- Keyword: code
- with space: true
- Placeholder Title: Open in WebStorm
- Placeholder Subtext: 请继续输入以打开项目
- File Types: 文件类型，随便拖一个文件夹进去表示只识别文件夹，过滤掉文件

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/2ffad9e5d4fd7145175403d2ce88d4ba.png)

`Scope`搜索范围

- Search Scope: 指定搜索范围，将目录拖拽进去即可

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/904f1b4c2c259ac107a9412c3c44aa20.png)

`Fields`和`Limit and Sort`保持不变，可以根据自己的习惯修改

1. 左键单击并选择添加`Actions-Run Script`，配置如下：

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/b8e6ab4a950b27856ba7bffeaffcba7e.png)

- Language: /bin/zsh 终端，也可以选择/bin/bash 终端
- with input as {query}: true
- running instances: Sequentially
- Script: /usr/local/bin/wstorm “{query}”

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/aaf2382b5835cd4c4bed596bbfd9cb1a.png)

注意：使用`/usr/local/bin/wstorm`命令需要在`WebStorm`中开启工具-创建命令行启动器，配置脚本位置为`/usr/local/bin`，并配置脚本命令为`wstorm`。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/d75e44dd0ee64ca731ff0ef80518d8a8.png)

## Open in iTerm

从`iTerm`中打开文件夹。通过`cd`命令进入指定目录下的文件夹，快速打开项目并运行。效果如下：

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/bfcd6c280bab6c48286bc9dceb4d7922.gif)

### 运行流程

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/92afc08cbea2aa21a025f78f64b21cd5.png)

### 设置

1. 新建一个`Blank workflow`，配置如下：

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/c74cf85993ecd736faed7ee5e871e22e.png)

1. 新增`File Filter`，配置如下：

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/05053b6b58b7cf7363b657f8a3941828.png)

1. 左键单击并选择添加 Actions-Run NSAppleScript，配置如下：

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/31bd242cc74c441caa461efc88cbac43.png)

```text
-- For the latest version:
-- https://github.com/vitorgalvao/custom-alfred-iterm-scripts

-- Set this property to true to always open in a new window
property open_in_new_window : false

-- Set this property to false to reuse current tab
property open_in_new_tab : true

-- Handlers
on new_window()
tell application "iTerm" to create window with default profile
end new_window

on new_tab()
tell application "iTerm" to tell the first window to create tab with default profile
end new_tab

on call_forward()
tell application "iTerm" to activate
end call_forward

on is_running()
application "iTerm" is running
end is_running

on has_windows()
if not is_running() then return false
if windows of application "iTerm" is {} then return false
true
end has_windows

on send_text(custom_text)
tell application "iTerm" to tell the first window to tell current session to write text custom_text
end send_text

-- Main
on alfred_script(query)
if has_windows() then
if open_in_new_window then
new_window()
else if open_in_new_tab then
new_tab()
else
-- Reuse current tab
end if
else
-- If iTerm is not running and we tell it to create a new window, we get two
-- One from opening the application, and the other from the command
if is_running() then
new_window()
else
call_forward()
end if
end if

-- Make sure a window exists before we continue, or the write may fail
repeat until has_windows()
delay 0.01
end repeat

send_text(query)
call_forward()
end alfred_script
```

# 大功告成！
