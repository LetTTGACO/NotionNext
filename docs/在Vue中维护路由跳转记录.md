---
password: ""
icon: ""
创建时间: "2023-04-07T19:15:00.000Z"
date: "2021-02-01"
type: Post
slug: hemk59
配置类型:
  type: string
  string: 文档
summary: 本文介绍了如何在Vue中维护路由跳转记录，以解决使用this.$router.go(-1)返回上一个路由时，无法拿到上个路由的路由地址的问题，并避免进入死循环。作者提出了通过路由守卫，利用堆栈的方式维护页面跳转的历史记录的思路，并给出了具体实现方法。
更新时间: "2023-08-26T15:22:00.000Z"
title: 在Vue中维护路由跳转记录
category: 技术分享
tags:
  - Vue
status: Archived
urlname: e7200c3e-ae64-4093-8ecc-4d249b091349
updated: "2023-08-26 15:22:00"
---

# 引言

在 vue 中我们可以用`this.$router.go(-1)`返回上一个路由，但无法拿到上个路由的路由地址，这样就出现一个问题就是如果我上个路由是中转页面，作用就是跳到下个页面，这个时候的`this.$router.go(-1)`就不起作用，进入了死循环。 所以网上找了下一个比较好的办法就是利用路由守卫，维护自己的路由跳转记录。

# 思路

1. 实现一个`Vue`工具`history.js`，通过堆栈的方式维护页面跳转的历史记录，控制返回跳转。
2. 扩展一个获取上个路由的方法。
3. 在全局路由`router.js`中，实例化路由前，通过原型扩展`router`的`goBack()`方法
4. 在`router`路由守卫`afterEach`的生命周期中存放历史记录。

# 实现

```javascript
// src/utils/history.js

const History = {
  _history: [], // 历史记录堆栈
  install(Vue) {
    // 提供Vue插件所需安装方法
    Object.defineProperty(Vue.prototype, "$routerHistory", {
      get() {
        return History;
      },
    });
  },
  push(path) {
    // 入栈
    this._history.push(path);
  },
  pop() {
    this._history.pop();
  },
  canBack() {
    return this._history.length > 1;
  },
  lastHistory() {
    return this._history.length > 1
      ? this._history[this._history.length - 2]
      : "/";
  },
};
export default History;
```

在路由实例化之前，扩展`back()`方法

```javascript
// src/router/index.js

import Vue from "vue";
import Router from "vue-router";
import History from "./utils/history";

Vue.use(Router);
Vue.use(History);

// 实例化之前，扩展Router
Router.prototype.goBack = function () {
  this.isBack = true;
  this.back();
};
```

在路由全局`afterEach`中记录跳转历史

```javascript
// src/router/index.js
import History from "./utils/history";
// afterEach记录历史记录
router.afterEach((to, from) => {
  if (router.isBack) {
    // 后退
    History.pop();
    router.isBack = false;
    router.transitionName = "route-back";
  } else {
    History.push(to.path);
    router.transitionName = "route-forward";
  }
});
```

在页面中使用

```javascript
if (this.$routerHistory.lastHistory().indexOf("/router") !== -1) {
  this.$router.push({
    path: "/",
  });
} else {
  this.$router.goback();
}
```
