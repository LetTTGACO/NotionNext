---
password: ''
icon: ''
创建时间: '2023-04-14T18:04:00.000Z'
date: '2023-04-15 00:00:00'
type: Post
slug: notion-weekly-board
配置类型:
  type: string
  string: 文档
summary: 本文介绍了如何在Notion中打造TODO List，包括看板和数据库属性的设置，以及高级筛选和函数的使用。此外，还分享了Notion模板。
更新时间: '2023-08-26T15:24:00.000Z'
title: 玩转Notion系列——TODO List
category: 技术分享
tags:
  - Notion
status: Archived
cover: 'https://www.notion.so/images/page-cover/woodcuts_4.jpg'
urlname: 6c0aa69b-7ec6-47ac-b2fd-4984e2f4e020
updated: '2023-08-26 23:24:00'
---

# 引言


在 Notion 成为我的唯一生产力工具之后，我尝试把日常生活、工作中的点点滴滴都用Notion 记录下来。为此我专门建立了个人主页，把打造个人主页的过程用一个系列记录下来。


本次分享的就是打造自己的TODO List（待办事项清单）


![Untitled.png](https://image.1874.cool/1874-blog-images/abfc4b2463c8c145070ba9498156fc19.png)


# 看板

- 头脑风暴看板：将平时的灵感、暂定的待办事项都记录到这里
- 今日任务：把今天要做的任务罗列在此，并按时调整任务状态
- 明日任务：把明天要做的TODO罗列在此
- 每周看板：回顾本周（周一到周日）的任务
- 上周看板：回顾上周的任务
- 汇总：查看所有任务的状态

# 数据库属性

- 任务状态（Status）
	- Todo：待办
	- Doing：正在做
	- Done：已完成
- 类型
	- 个人
	- 工作
- 未完成：今天以前状态未扭转到`Done`的任务
- 本周一：根据当前时间获取本周一的00:00
- 本周日：根据当前时间获取本周日的23:59
- 上周一：根据当前时间获取上周一的00:00
- 本周日：根据当前时间获取上周日的23:59

## Notion 数据库函数实践


## 本周看板（周一到周天）


![Untitled.png](https://image.1874.cool/1874-blog-images/4b885af4d1839d5dfff1ebb746c358d7.png)


```javascript
// 1. 获取本周起始时间（相对于现在时间的周一的00:00）
// 1.1 获取今天的00:00
// 1.1.1 获取今天的xx:00
const time1 = dateSubtract(now(), minute(now()), "minutes")
// 1.1.2 获取今天的00:00
const time2 = dateSubtract(time1, hour(now()), "hours")
// 1.2 获取周一的00:00
// 矫正星期
if(equal(day(now()), 0), 7, day(now()))
const 本周一 = dateSubtract(time2, if(equal(day(now()), 0), 7, day(now())) - 1, "days")
// 函数
dateSubtract(dateSubtract(dateSubtract(now(), minute(now()), "minutes"), hour(now()), "hours"), if(equal(day(now()), 0), 7, day(now())), "days")

// 2. 获取本周的结束时间（相对于现在时间的周日的23:59）
// 2.1 获取今天的23:59
// 2.1.1 获取今天的xx:59
const time1 = dateAdd(dateAdd(now(), 59 - minute(now()), "minutes")
// 2.1.2 获取今天的23:59
const time2 = dateAdd(time1, 23 - hour(now()), "hours")
// 2.2 获取周天的23:59
// 矫正星期
if(equal(day(now()), 0), 7, day(now()))
const 本周天 = dateAdd(time2, 7 - if(equal(day(now()), 0), 7, day(now())), "days")
// 函数
dateAdd(dateAdd(dateAdd(now(), 59 - minute(now()), "minutes"), 23 - hour(now()), "hours"), 7 - if(equal(day(now()), 0), 7, day(now())), "days")

// 3. 判断是否是本周
const 是否是本周 = and(largerEq(prop("日期"), prop("本周一")), smallerEq(prop("日期"), prop("本周天")))
```


## 上周看板


### 如何判断任务处于上周内


```javascript
// 1. 获取上周起始时间（相对于现在时间的上周一的00:00）
// 1.1 获取本周一的时间
// 矫正星期
if(equal(day(now()), 0), 7, day(now()))
const time1 = dateSubtract(now(), if(equal(day(now()), 0), 7, day(now())) - 1, "days")
// 1.2 获取上周一的时间
const time2 = dateSubtract(time1, 7, "days")
// 1.3 获取上周一的xx:00
const time3 = dateSubtract(time2, minute(time2), "minutes")
// 1.4 获取上周一的00:00
const 上周一 = dateSubtract(time3, hour(time2), "hours")
// 函数
dateSubtract(dateSubtract(dateSubtract(dateSubtract(now(), if(equal(day(now()), 0), 7, day(now())) - 1, "days"), 7, "days"), minute(dateSubtract(dateSubtract(now(), if(equal(day(now()), 0), 7, day(now())) - 1, "days"), 7, "days")), "minutes"), hour(dateSubtract(dateSubtract(now(), if(equal(day(now()), 0), 7, day(now())) - 1, "days"), 7, "days")), "hours")

// 2. 获取上周的结束时间（相对于现在时间的上周日的23:59）
// 2.1 获取本周日的时间
// 矫正星期
if(equal(day(now()), 0), 7, day(now()))
const time1 = dateAdd(now(), 7 - if(equal(day(now()), 0), 7, day(now())), "days")
// 2.2 获取上周日的时间
const time2 = dateSubtract(time1, 7, "days")
// 2.3 获取上周日的xx:59
const time3 = dateAdd(time2, 59 - minute(time2), "minutes")
// 2.4 获取上周日的23:59
const 上周日 = dateAdd(time3, 23 - hour(time2), "hours")
// 函数
dateAdd(dateAdd(dateSubtract(dateAdd(now(), 7 - if(equal(day(now()), 0), 7, day(now())), "days"), 7, "days"), 59 - minute(dateSubtract(dateAdd(now(), 7 - if(equal(day(now()), 0), 7, day(now())), "days"), 7, "days")), "minutes"), 23 - hour(dateSubtract(dateAdd(now(), 7 - if(equal(day(now()), 0), 7, day(now())), "days"), 7, "days")), "hours")

// 3. 判断是否是上周
const 是否是上周 = and(largerEq(prop("日期"), prop("上周一")), smallerEq(prop("日期"), prop("上周日")))
```


# 高级筛选


## 自动调整指定属性值


当存在过期任务（该任务在今天之前处于未完成（Todo/Doing）状态）时，需要在`今日任务`中展示出来。而且当我在今天将过期扭转到Done时，该任务的完成时间应该是今天，而非原本的过期时间，以便在`本周看板`中能看到这些任务。


所以需要这些过期任务在扭转到Done状态时，时间自动调整为今天。


![Untitled.png](https://image.1874.cool/1874-blog-images/c26debfe03399ed4ad654c02e8ba3325.png)


好在Notion相当智能，只需要将筛选条件变为高级筛选，并设置为以上条件。在把过期任务拖拽到Done状态时，Notion会将时间会自动调整为今天以符合当前的筛选条件。


# Notion模版分享


[bookmark](https://1874.notion.site/6fe9704466f3475b95ed03cd4f3250c1?v=36f35706926f4960af8b076c505cf16b)

