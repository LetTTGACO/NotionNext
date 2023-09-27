---
password: ""
icon: ""
创建时间: "2023-04-12T16:14:00.000Z"
date: "2023-04-12"
type: Post
slug: day-3
配置类型:
  type: string
  string: 文档
summary: RxJs 针不错～
更新时间: "2023-08-26T15:37:00.000Z"
title: Seven的成长笔记【第3篇】
category: 随笔
tags:
  - 随笔
status: Archived
urlname: 0b7ef73a-c23e-4019-8139-a87b987968f3
updated: "2023-08-26 15:37:00"
---

1 - 「学习 / 感悟 🥕」

`RxJs`用起来还挺爽，特别是用来处理流式过程堪比 `Loadsh`在`Js`中的使用体验。

以我目前的使用场景，RxJs 非常适合用来解决类似队列的问题。

<details>
  <summary>场景一：批量任务分组处理</summary>

由于第三方接口的限流和并发，导致一次性只能同时请求 N 个请求，等这一批请求结束再发起下一批请求才不太会报错。

在以往的编程习惯中，我们需要对批量任务进行分组然后线性执行批量任务分组，代码示例如下：

```typescript
/**
 * 对批量任务进行分组
 *
 * @param {Array<() => Promise<any>>} jobs
 * @param {number} [concurrent_count]
 * @returns
 */
export const chunkJobs = (
  jobs: Array<() => Promise<any>>,
  concurrent_count?: number
) => {
  const concurrentCount = concurrent_count || 6;
  return jobs.reduce(
    (queues, c, i) => {
      if (i % concurrentCount > 0) {
        queues[queues.length - 1].push(c);
        return queues;
      }

      queues.push([c]);
      return queues;
    },
    [[]] as Array<Array<() => Promise<any>>>
  );
};

/**
 * 线性执行批量任务分组
 *
 * @param {Array<Array<() => Promise<any>>>} jobs
 * @param callbackFunc
 * @returns
 */
export const runSerialJobsQueue = async (
  jobs: Array<Array<() => Promise<any>>>
) => {
  let p = 0;
  const res: Array<any> = [];
  while (p < jobs.length) {
    const part_res = await Promise.all(
      jobs[p].map((fn) => fn().catch(() => false))
    );
    res.push(...part_res);
    ++p;
  }
  return res;
};
```

以上代码有几个注意点 ⚠️

- 由于需要批量执行分组任务，这里使用的是`Prmosie.all`。但是由于不能中断其他分组的任务，所以当其中的一个分组任务有报错，需要手动进行 `catch` 住。
- 我们很难得到每一个任务的执行结果，并对其进行结果处理
- chunkJobs 在使用上需要提前准备好 Promise 数组
- 代码的易读性较差

如果用 RxJs 就看起来简短并且易读性还不错，代码示例如下：

```typescript
// 批量执行
async function requestAll(
  reqs: any[],
  request: any,
  callback: (params: any, res: any) => void
) {
  const promises = reqs.map((param) =>
    request(param)
      .then((res: any) => {
        callback(param, res);
        return res;
      })
      .catch((err: any) => {
        callback(param, { error: err });
      })
  );
  return await Promise.all(promises);
}

// 分组
export const chunkJobs = (
  list: any[],
  request: any,
  callback: (params: any, res: any) => void,
  limit = 5
) => {
  return Rx.from(list)
    .pipe(
      RxOp.bufferCount(limit), // 将 Observable 拆分为 指定数量的组
      RxOp.concatMap((reqs) => Rx.from(requestAll(reqs, request, callback))) // 批量执行请求
    )
    .toPromise();
};
```

- `RxOp.bufferCount` 可以非常方便的将批量任务进行分组
- `RxOp.concatMap` 可以将每组请求参数传递给 requestAll 函数进行批量执行
- 我这里写了一个自定义的 callback 方法，主要是想在代码执行过程中对每一个请求的结果进行收集和处理
- 当然为了不让批量任务报错影响其他分组的执行，这里进行了 `catch`
- 用户只需要把请求参数数组和请求方法传入，就能很方便的执行分组任务

当然上述代码还是有一定的优化空间，比如：

- 错误收集和处理可以尝试用`RxOp.catchError` 操作符进行处理

  </details>

<details>
  <summary>场景二：错误日志的收集</summary>

在利用 Node 子线程的通信能力中，需要用一个子线程 A 去跑程序 B，然后在子线程 A 中收集程序 B 中的所有输出。

```typescript
const worker = childProcess.spawn(cli, args);
// 监听控制台日志输出
worker.stdout.on("data", (message) => {
  // 构造消息体
  const logLine: ILogLine = {
    date: new Date().getTime(),
    level: LogLevel.INFO,
    message: message.toString(),
  };
  /** 收集10条后上报日志 */
});

// 监听控制台错误日志输出
worker.stderr.on("data", (message) => {
  // 构造消息体
  const logLine: ILogLine = {
    date: new Date().getTime(),
    level: LogLevel.ERROR,
    message: message.toString(),
  };
  /** 上报日志 */
});

// 构建结束
worker.on("exit", () => {
  /** 收集所有日志 */
});
```

- 子线程 `worker` 中会有 3 个监听器，由于分布在不同的监听器，如果想收集所有日志的话，需要自己构建一个队列
- 为了减少请求次数，日志会在收集指定条数后才会上报一次，但是由于是在不同的监听器收集，所以所有的单条日志都需要先 `push` 到队列中
- 队列在满 10 条之后会取出进行日志的批量上报

这种需求就很流式，非常适合用 RxJs 去进行流的处理。代码示例如下：

```typescript
// 构建运行进程
const worker = childProcess.spawn(cli, args);
// 监听控制台日志输出
worker.stdout.on("data", (message) => {
  console.log(message.toString());
  // 构造消息体
  const logLine: ILogLine = {
    date: new Date().getTime(),
    level: LogLevel.INFO,
    message: message.toString(),
  };
  /** 收集/上报日志 */
  this.logClient.pushLog(logLine);
});

// 监听控制台错误日志输出
worker.stderr.on("data", (message) => {
  console.error(message.toString());
  // 构造消息体
  const logLine: ILogLine = {
    date: new Date().getTime(),
    level: LogLevel.ERROR,
    message: message.toString(),
  };
  /** 收集/上报日志 */
  this.logClient.pushLog(logLine);
});

// 构建结束
worker.on("exit", () => {
  this.logClient.complete();
});
```

```typescript
import { ILog, ILogLine, ILogReportConfig } from "../type/log";
import { apis } from "../api";
import * as rx from "rxjs";
import * as rxOp from "rxjs/operators";
import { LogLevel } from "../const";

/**
 * 日志上报
 */
export class LogReportClient {
  private readonly _config: ILogReportConfig;
  private _queue: rx.Subject<ILogLine>;
  private _fileBoxClient: FileBoxClient;
  private _logs: ILogLine[] = [];

  public constructor(config: ILogReportConfig) {
    this._config = config;
    this._queue = new rx.Subject<ILogLine>();
    this._initSubscribe();
  }

  /**
   * 初始化订阅器处理
   * @private
   */
  private _initSubscribe(): void {
    this._queue
      .pipe(
        rxOp.bufferCount(this._config.limit),
        rxOp.tap(async (value) => {
          this._logs.push(...value);
          // 上报日志
          await this._report(value);
        })
      )
      .subscribe({
        complete: async () => {
          // 保证最后一次上报是最后发的
          setTimeout(() => {
            // 发送isEnd日志
            const endMessage: ILogLine = {
              message: "构建结束",
              date: new Date().getTime(),
              level: LogLevel.INFO,
            };
            void this._report([endMessage], true);
          }, 300);

          // 上报到OSS
          const buffer = new Buffer(JSON.stringify(this._logs));
          await this.ossClient.uploadBuildLog(buffer);
        },
      });
  }

  /**
   * 收集日志
   * @param log
   */
  public pushLog(log: ILogLine): void {
    this._queue.next(log);
  }

  /**
   * 构建结束
   */
  public complete(): void {
    this._queue.complete();
  }

  /**
   * 日志上报
   */
  private async _report(logs: ILogLine[], isEnd?: boolean): Promise<void> {
    const content: ILog = {
      logs: logs,
      isEnd: !!isEnd,
    };
    return apis.log.report(content).catch((e) => {
      console.error("日志推送失败", e);
    });
  }
}
```

- 用 `next` 方法 进行日志的 `push`
- `rxOp.bufferCount` 用来堵塞流程，会在日志达到指定条数后才执行后续流程
- 再次通过 `rxOp.tap` 拿到分组日志进行收集和上报
- 日志收集结束后，发送结束日志并把收集到的所有日志上传到阿里云

`Rxjs` 帮我们维护了个队列并进行了分组，核心代码逻辑非常清晰明了！

  </details>

总结：目前我对 `RxJs` 的使用还在初级阶段，一般有什么流式调用，我都会先问下 Notion AI 怎么写。目前还没了解完主要的 `RxJs` 方法，相信在熟悉了 RxJs 之后，我的代码风格和代码逻辑将会更上一层楼！

2 - 「轻松一刻 🎮」

今天下班和同事玩了一把【拉斯维加斯】桌游，赌狗上线爽翻天，赢不赢没关系，恶心队友才是正道的光哈哈哈哈。
