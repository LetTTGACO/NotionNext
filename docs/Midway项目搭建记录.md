---
password: ''
icon: ''
创建时间: '2023-04-07T19:15:00.000Z'
date: '2022-07-16 00:00:00'
type: Post
slug: zbbxv0
配置类型:
  type: string
  string: 文档
summary: 本文记录了在语雀云端写作 Hexo+Github Actions+COS 持续集成中，搭建 Node 项目作为中转站的过程。通过初始化 Midway，编写 GithubController 和 GithubService，实现了通过 Github Actions 的接口触发构建流程。详细内容请见文章。
更新时间: '2023-08-26T15:24:00.000Z'
title: Midway项目搭建记录
category: 学习笔记
tags:
  - Node
  - Midway
status: Archived
urlname: 02209783-f54d-4d2e-9a4e-508c42e43ad9
updated: '2023-08-26 23:24:00'
---

# 引言


在[语雀云端写作 Hexo+Github Actions+COS 持续集成](https://1874.cool/roeayv)中我需要一个 Node 项目来作为中转站替换原来的腾讯云函数，调用`Github Actions`的接口触发构建流程，这里记录下搭建过程。


# 初始化 Midway


> [Midway 官方文档](https://www.midwayjs.org/docs/intro)


我基本都是按照官方文档来搭建的，初始化的过程也很简单，初始化之后把不需要用到的文件删除，基本不用配置就可以直接就可以写代码了。


# 接口流程


![FgaQOwsx7NXJi2YH3J7Gb_k9mrUS.jpeg](https://image.1874.cool/1874-blog-images/a1374c054be28f1ed108f5cedb162d33.jpeg)


# 代码编写


## GithubController


```typescript
import { Controller, Inject, Post } from "@midwayjs/decorator";
import { Context } from "egg";
import { GithubService } from "../service/github";

@Controller("/github")
export class GithubController {
  @Inject()
  ctx: Context;

  @Inject()
  githubService: GithubService;

  @Post("/action/:repo/:event_type")
  async deploy() {
    const { repo, event_type } = this.ctx.params;
    return await this.githubService.action(repo, event_type);
  }
}
```


根据语雀的[webhooks 介绍](https://www.yuque.com/yuque/developer/doc-webhook#4da6e742)，语雀的回调函数是一个 Post 接口


![FiolJEozqoDDhLhUp3ebRyctkYD7.png](https://image.1874.cool/1874-blog-images/d50e9585e2970dfc1fd517c0b333bd7f.png)


所以可以有以下两种处理方法传参数

- 将需要的参数拼接在调用链接上，通过`@Query()`拿到参数
- 利用动态路由传参数，通过`this.ctx.params`拿到参数

## GithubService


```typescript
import { Provide } from "@midwayjs/decorator";
import axios from "axios";

@Provide()
export class GithubService {
  /**
   * 触发Github Actions
   * @param repo
   * @param event_type
   */
  async action(repo: string, event_type: string): Promise<any> {
    try {
      const res = await axios.post(
        `https://api.github.com/repos/LetTTGACO/${repo}/dispatches`,
        { event_type },
        {
          headers: {
            Accept: "*/*",
            Authorization: "token Github访问Token",
          },
        }
      );
      if (res.status === 204) {
        return "This is OK!";
      }
    } catch (e) {
      return e.message;
    }
  }
}
```


# Done!


大功告成，接下来就是构建和部署阶段了，详情请看


[bookmark](https://1874.cool/ovugli)

