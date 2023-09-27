---
password: ""
icon: ""
创建时间: "2023-04-13T15:46:00.000Z"
date: "2023-04-14"
type: Post
slug: day-4
配置类型:
  type: string
  string: 文档
summary: Notion 函数写起来真要命
更新时间: "2023-08-26T15:36:00.000Z"
title: Seven的成长笔记【第4篇】
category: 随笔
tags:
  - 随笔
status: Archived
urlname: 6776bd5c-0ef2-4b60-b651-b08e0f4a4b24
updated: "2023-08-26 15:36:00"
---

1 - 「学习 / 感悟 🥕」

今天写了一晚上的 Notion 的函数，用来给 TODO List DataBase 增加每周看板和上周看板

<details>
  <summary>如何判断该TODO为本周内的任务</summary>

```typescript
// 1. 获取本周起始时间（相对于现在时间的周一的00:00）
// 1.1 获取今天的00:00
// 1.1.1 获取今天的xx:00
const time1 = dateSubtract(now(), minute(now()), "minutes")
// 1.1.2 获取今天的00:00
const time2 = dateSubtract(time1, hour(now()), "hours")
// 1.2 获取周一的00:00
const 本周一 = dateSubtract(time2, day(now()) - 1, "days")
// 函数
dateSubtract(dateSubtract(dateSubtract(now(), minute(now()), "minutes"), hour(now()), "hours"), day(now()) - 1, "days")

// 2. 获取本周的结束时间（相对于现在时间的周日的23:59）
// 2.1 获取今天的23:59
// 2.1.1 获取今天的xx:59
const time1 = dateAdd(dateAdd(now(), 59 - minute(now()), "minutes")
// 2.1.2 获取今天的23:59
const time2 = dateAdd(time1, 23 - hour(now()), "hours")
// 2.2 获取周天的23:59
const 本周天 = dateAdd(time2, 7 - day(now()), "days")
// 函数
dateAdd(dateAdd(dateAdd(now(), 59 - minute(now()), "minutes"), 23 - hour(now()), "hours"), 7 - day(now()), "days")

// 3. 判断是否是本周
const 是否是本周 = and(largerEq(prop("日期"), prop("本周一")), smallerEq(prop("日期"), prop("本周天")))
```

  </details>

<details>
  <summary>如何判断该TODO为上周内的任务</summary>

```typescript
// 1. 获取上周起始时间（相对于现在时间的上周一的00:00）
// 1.1 获取本周一的时间
const time1 = dateSubtract(now(), day(now()) - 1, "days");
// 1.2 获取上周一的时间
const time2 = dateSubtract(time1, 7, "days");
// 1.3 获取上周一的xx:00
const time3 = dateSubtract(time2, minute(time2), "minutes");
// 1.4 获取上周一的00:00
const 上周一 = dateSubtract(time3, hour(time2), "hours");
// 函数
dateSubtract(
  dateSubtract(
    dateSubtract(dateSubtract(now(), day(now()) - 1, "days"), 7, "days"),
    minute(
      dateSubtract(dateSubtract(now(), day(now()) - 1, "days"), 7, "days")
    ),
    "minutes"
  ),
  hour(dateSubtract(dateSubtract(now(), day(now()) - 1, "days"), 7, "days")),
  "hours"
);

// 2. 获取上周的结束时间（相对于现在时间的上周日的23:59）
// 2.1 获取本周日的时间
const time1 = dateAdd(now(), 7 - day(now()), "days");
// 2.2 获取上周日的时间
const time2 = dateSubtract(time1, 7, "days");
// 2.3 获取上周日的xx:59
const time3 = dateAdd(time2, 59 - minute(time2), "minutes");
// 2.4 获取上周日的23:59
const 上周日 = dateAdd(time3, 23 - hour(time2), "hours");
// 函数
dateAdd(
  dateAdd(
    dateSubtract(dateAdd(now(), 7 - day(now()), "days"), 7, "days"),
    59 -
      minute(dateSubtract(dateAdd(now(), 7 - day(now()), "days"), 7, "days")),
    "minutes"
  ),
  23 - hour(dateSubtract(dateAdd(now(), 7 - day(now()), "days"), 7, "days")),
  "hours"
);

// 3. 判断是否是上周
const 是否是上周 = and(
  largerEq(prop("日期"), prop("上周一")),
  smallerEq(prop("日期"), prop("上周日"))
);
```

  </details>

2 - 「轻松一刻 🎮」

6 点准时下班，耶稣也拦不住我！去佛山听草莓音乐节咯～
