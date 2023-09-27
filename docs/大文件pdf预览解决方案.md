---
password: ""
icon: ""
创建时间: "2023-04-07T19:15:00.000Z"
date: "2021-02-24"
type: Post
slug: owidng
配置类型:
  type: string
  string: 文档
summary: 本文介绍了一种利用 pdf.js 和 pdfbox 技术实现大文件 PDF 预览的解决方案。通过采用前端 pdf.js 插件解析 PDF 文件并转化为图片，后端 pdfbox 进行 PDF 处理和切图，实现了大文件的分片上传和处理。同时，本文介绍了在实践过程中遇到的内存溢出问题和解决方案。
更新时间: "2023-08-26T14:42:00.000Z"
title: 大文件pdf预览解决方案
category: 技术分享
tags:
  - Vue
  - Java
status: Archived
urlname: 74a06a6c-40b4-4408-8636-14cf996b3a71
updated: "2023-08-26 14:42:00"
---

# 背景

最近在项目中遇到一个很有意思的图册业务需求：

- 用户在后台上传 pdf 图册文件，前台可以进行 pdf 浏览，浏览方式为左右翻页模式（默认 pdf 是从上到下的），还有其他玩法，本质是花样看图（翻页电子书）。
- 后续又产生了付费需求：可以预览前 5 页，后面图册浏览需要付费查阅。

# 技术选型

基于上述业务，我们简单进行需求拆解：

- pdf 文件大小，需要考虑文件的上传速度和页面预览速度
- 浏览方式，要求灵活性，所以要做成图片化浏览

## 方案 1

- 文件存储采用阿里云 oss 存储，前端服务直接跟 oss 存储交互，实现前端上传与下载，效率最大化（没有中间商赚差价）
- 技术上选择 pdf.js + canvas；上传时，前端解析 pdf 文件后，按页读流，利用 canvas 转化为图片后上传；浏览时，直接对每页的图片进行读取并呈现；

然而在实践过程中出现了预料之中的问题：由于后台上传的 pdf 大多都是几十甚至几百页的 pdf，从 oss 拿到 pdf 链接后，前端 canvas 进行渲染展示的速度相当感人，无法达到产品经理的要求。 问题分析:

- 前端工作量大，时间不足。
- 更深入思考技术细节：切图后的清晰度问题、图片压缩问题、图片命名规则问题、网络某个图片上传失败问题、大文件 OOM 问题等。

## 方案 2

基于以上问题，我们对方案进行改进：

- 前端直接将 pdf 进行分片上传至 oss，保留了原 pdf，后续即便出现未知 pdf 故障也可以脚本处理（如图片清晰度问题）
- 后端新增 pdf 处理服务，从 oss 获取 pdf 后处理切图后，再将图片上传 oss
- 前端根据约定规则获取图片信息并呈现

这样做的好处就是：

- 前端专注于呈现，屏蔽了一些不必要的数据处理细节

当然也有个缺点：

- 用户上传 pdf 后立即进行预览，文件太大的情况下，后端还在处理中，前端可能获取不到图片

当然了，最后考虑到使用场景，图册 pdf 制作需要时间，更新频率不会太高；我们保证其最终可见性，目前是足以支撑业务的。 不过在实践过程中，还是出现了一个小问题： 前端在预览 pdf 时，需要知道 pdf 的总页数，本来是由后端在解析 pdf 的时候顺便拿到 pdf 的页数后更新到数据库中，但是由于 oom 问题，需要前端在上传的时候拿到总页数后提交给后端。

# 前端方案

所以就还是需要前端借助 pdfjs 这个插件来解决问题： 先安装依赖：

```shell
npm i pdfjs-dist -S
```

在上传 pdf 的时候进行解析，拿到 pdf 的总页数：

```javascript
import PDFJS from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry'
// 这里一定要设置！
PDFJS.GlobalWorkerOptions.workerSrc = pdfjsWorker

// 常用于上传的接口
async function upload(file) {
  // OSS上传逻辑
  ...
  ...
  const array = await file2Array(file.file)
  const pdfDocument = await PDFJS.getDocument(array)
  // 这样就可以拿到pdf的总页数了
  this.filePageSize = pdfDocument.numPages
  this.$emit('change', this.filePageSize)
}


// 这里要借助一个工具类将file文件转为Uint8Array
function file2Array(file) {
  const reader = new FileReader()
  reader.readAsArrayBuffer(file)
  return new Promise((resolve, reject) => {
    reader.onload = async (e) => {
      const array = new Uint8Array(e.target.result) // ArrayBuffer转Uint8Array
      resolve(array)
    }
    reader.onerror = (err) => {
      reject(err)
    }
  })
}
```

# 后端方案

## 技术选型

java 实现 pdf 处理的技术现有技术大概有几种：pdfbox、PDFRenderer、jpedal、itext、ICEPDF。

- pdfbox：是 appach 出品，开源、免费、今年还在更新。
- PDFRenderer：sum 出品，只有一个 2012 年版本[0.9.1-patched](https://mvnrepository.com/artifact/com.sun.pdfview/pdfrenderer/0.9.1-patched)，不大行的样子
- jpedal：收费
- itext：[AGPL](https://github.com/itext/itext7/blob/develop/LICENSE.md) / [商业软件的](https://itextpdf.com/sales)双重许可。AGPL 是免费/开源软件许可证。这并不意味着该软件是[免费的](https://en.wikipedia.org/wiki/Gratis_versus_libre)！
- ICEPDF：切图后质量不大行，有水印的 pdf，切图后水印会特别清晰。

基于以上调研，最终选择了 pdfbox。

## 遇到的问题

### java.awt.AWTError: Assistive Technology not found: org.GNOME.Accessibility.AtkWrapper

### 现象

本地正常，无此问题，pass 部署后第一次调用 pdf 处理时报 error 错误。

### 排查

- 根据报错信息初步判断，这应该是某个类不存在。（大意是说该辅助技术不存在）
- 追溯内部代码，pdf 处理后生成图片使用 java.awt.toolkit 工具包。
- 其初始化采用单例模式，如果有配置 Assistive Technology（辅助技术），则会实例化该辅助技术。

### 原因

- toolkit 类内部会基于 spi 机制加载辅助技术 assistive_technologies，该辅助技术非必须。
- 该配置文件在 jdk/accessibility.properties 中。
- 本地是 jdk 为 jdk1.8.0_221，无配置 assistive_technologies，无加载问题
- 代码构建平台上基础镜像 jdk 为： java-8-openjdk，其内部配置 assistive_technologies，却无引入具体类，导致第一次初始化时异常。
- 所以，**这是一起由 jdk 版本不同/环境不同、引发的问题**。

### 解决

- 第一种：修改 jdk/accessibility.properties 配置： 注释 assistive_technologies
- 第二种：因为内部初始化为单例模式，初始化后 toolkit 对象存在则不在初始化，预先初始化。

### java.lang.OutOfMemoryError: Java heap space

### 现象

上传一个 188M pdf 文件时，在某几页的处理会出现 OOM 堆内存溢出

> 造成 OutOfMemoryError 原因一般有 2 种：

    - 内存泄露，对象已经死了，无法通过垃圾收集器进行自动回收，通过找出泄露的代码位置和原因，才好确定解决方案；
    - 内存溢出，内存中的对象都还必须存活着，这说明 Java 堆分配空间不足，检查堆设置大小（-Xmx 与-Xms），检查代码是否存在对象生命周期太长、持有状态时间过长的情况。

### 排查

- 启动加入参数：-XX:+HeapDumpOnOutOfMemoryError， 进行对 OOM 日志 dump
- OOM 后进行日志分析，其占用空间为 2 部分：
  - 第一部分：原 pdf 所需内存。
  - 第二部分：每一页的 pdf 转图片过程需要的内存。（主要内存占用在此部分）
- 针对第一部分，官方倒是有一个配置：MemoryUsageSetting._setupTempFileOnly_();
  - 即原 pdf 暂存在外存中，而非内存，减轻主内存暂用。
- 针对第二部分
  - 取某一页的 pdf 流，进行解析；解析后的像素数据写入 BufferedImage 中，在调用原生 java.awt.image 画图生成。
  - 内部涉及 pdf 的解析、渲染+渲染算法、是否允许下采样等等。

最终定位到，部分页后绘制成图所需的内存巨大，pdf 越是精致，越是巨大。这个跟图像的着色、轮廓、纹理、像素点、边缘锯齿、抖动等相关。这里水有点深，概念上就有分辨率、容量、清晰度、像素、矢量图、位图、栅格化、插值算法。 总之，一套流程下来，我们发现某些 pdf 的转化确实需要巨大的内存，典型的空间复杂度高。所以，这是个正常内存溢出，并非某些流或对象未及时关闭，本质上还是需要扩大虚拟机堆内存。 经测试，某 24M 的单页 pdf 图，转化成图片大约需要 800M 内存。（就是这么夸张！）

### 优化总结

- `PDDocument.load(file, MemoryUsageSetting.setupTempFileOnly())`将 pdf 暂存在本地磁盘，即省出了内存空间；像 100M 的 pdf 就能省 100M 内存呢
- `PDFRenderer.renderImageWithDPI(i，72)；`降低 dpi，减少 dpi 比例，也可以一定程度上优化，但在呈现上跟原图比会有所缩放。
- ` PDFRenderer``.setSubsamplingAllowed(``true``); `允许下采样，下采样可以在更快、更小的内存密集型情况下使用，但它也可能导致质量的损失，尤其是针对高空间频率的图像
- 通过-Xmx 增加最大堆内存，终极大法，扩大内存

pdfbox 官方也有 oom 问题的处理建议，如下：

> I’m getting an OutOfMemoryError. What can I do? The memory footprint depends on the PDF itself and on the resolution you use for rendering. Some possible options:

    - increase the `Xmx` value when starting java
    - use a scratch file by loading files with this code `PDDocument.load(file, MemoryUsageSetting.setupTempFileOnly())`
    - be careful not to hold your images after rendering them, e.g. avoid putting all images of a PDF into a `List`
    - don’t forgot to close your `PDDocument` objects
    - decrease the scale when calling `PDFRenderer.renderImage()`, or the dpi value when calling `PDFRenderer.renderImageWithDPI()`
    - disable the cache for `PDImageXObject` objects by calling `PDDocument.setResourceCache()` with a cache object that is derived from `DefaultResourceCache` and whose call `public void put(COSObject indirect, PDXObject xobject)` does nothing. Be aware that this will slow down rendering for PDF files that have an identical image in several pages (e.g. a company logo or a background). More about this can be read in [PDFBOX-3700](https://issues.apache.org/jira/browse/PDFBOX-3700).

# 文件加密设计

一个 pdf，可能含 200+的页码，切成图片后分开存放，即产生 200+记录。如果存储在库里，有点浪费空间，同时还是能通过接口规则获取数据。如果单纯的通过统一路径后加 1、2、3、4，也是很容易的推导后续的数据。所以需要制定内部加密规则。

## 基本流程

明文  + 规则（密钥）  -> 密文  （典型的对称加密的加密段) **明文**为 uuid：如数据库存放格式：/fileUrl/**68428de9168548f3a9da61a6ee5faaf3**  ,   黑体部分即明文 **规则**： 即密钥：rule = “zxcvbnmlkjhgfdsa” **密文**： 为具体的 oss 文件名：` /fileUrl/``**6**``**g**``**8428de9168548f3a9da61a6ee5faaf**``**1** ` ，这是第一页/张，`/fileUrl/`**68**`**z**`**428de9168548f3a9da61a6ee5faaf**`**2**`  ,   这是第二页/张

## 加密规则

### java 版

```java
/**
 * pdfHelper
 *
 */
public class PdfHelper {
    /**
     * uuid规则构造器
     * 原理：去除最后一位字符，再取剩下最后一位字符为起始值，经过规则转换后，插入第i个位置；
     * 规则：ruleMark
     * 如ABCD,1 -> C ABC 1
     * 如ABCD,2 -> D ABC 2
     *
     * @param sourceUuid 源id
     * @param pageNum    页码 第n页
     * @return 规则后的uuid
     */
    public static String uuidBuilder(String sourceUuid, int pageNum) {
        String splitUuid = sourceUuid.substring(0, sourceUuid.length() - 1);
        String publicMark = splitUuid.substring(splitUuid.length() - 1);
        String ruleMark = ruleMark(publicMark, pageNum);
        int index = pageNum;
        while (index > splitUuid.length()) {
            index = index - splitUuid.length();
        }
        return splitUuid.substring(0, index) + ruleMark + splitUuid.substring(index) + pageNum;
    }

    public static String ruleMark(String mark, int pageNum) {
        String rule = "qwertyuiopasdfghjklzxcvbnm1234567890";
        int index = rule.indexOf(mark) + pageNum;
        while (index > rule.length() - 1) {
            index = index - rule.length();
        }
        char c = rule.charAt(index);
        return String.valueOf(c);
    }

}
```

### javascript 版

```javascript
/**
 * uuid规则构造器
 * 原理：去除最后一位字符，再取剩下最后一位字符为起始值，经过规则转换后，插入第i个位置；
 * 规则：ruleMark
 * 如ABCD,1 -> C ABC 1
 * 如ABCD,2 -> D ABC 2
 *
 * @param sourceUuid 源id
 * @param pageNum 页码 第n页
 * @return string 规则后的uuid
 */

function uuidBuilder(sourceUuid, pageNum) {
  const ruleMark = (mark, pageNum) => {
    const rule = "qwertyuiopasdfghjklzxcvbnm1234567890";
    let index = rule.indexOf(mark) + pageNum;
    while (index > rule.length - 1) {
      index = index - rule.length;
    }
    const c = rule.charAt(index);
    return c;
  };
  const splitUuid = sourceUuid.substring(0, sourceUuid.length - 1);
  const publicMark = splitUuid.substring(splitUuid.length - 1);
  const ruleMarkV = ruleMark(publicMark, pageNum);
  let index = pageNum;
  while (index > splitUuid.length) {
    index = index - splitUuid.length;
  }
  return (
    splitUuid.substring(0, index) +
    ruleMarkV +
    splitUuid.substring(index) +
    pageNum
  );
}

export default uuidBuilder;
```
