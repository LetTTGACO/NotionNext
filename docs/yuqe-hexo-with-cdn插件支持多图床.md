---
password: ""
icon: ""
创建时间: "2023-04-07T19:15:00.000Z"
date: "2022-02-12"
type: Post
slug: nvikqw
配置类型:
  type: string
  string: 文档
summary: 这是一个支持多个图床的插件，用于在博客中上传图片。目前已适配的图床包括腾讯云、阿里云和七牛云。该插件提供了一个接口适配层，使得上层在使用时可以传入不同的配置参数选择不同的图床。更多详情请查看yuqe-hexo-with-cdn。
更新时间: "2023-08-26T15:22:00.000Z"
title: yuqe-hexo-with-cdn插件支持多图床
category: 技术分享
tags:
  - Hexo
status: Archived
urlname: c28edc25-f869-45dd-875e-0e7396067ac4
updated: "2023-08-26 15:22:00"
---

# 引言

前段时间写了 [yuque-hexo 插件语雀图片防盗链的解决方案](https://www.yuque.com/1874w/1874.cool/osar7h)。当时使用的是腾讯云图床，后来考虑到可以支持更多的图床选择。这次的改造新增了阿里云图床和七牛云图床。

## 阿里云图床

阿里云图床目前各大公司也都在用，技术成熟稳定，但也和腾讯云图床一样，是收费的。但是作为个人博客图床的话，腾讯云 COS 和阿里云 OSS 的费用都相当的便宜，一个月的费用大概都在几分钱到几毛钱的范围。

## 七牛云图床

七牛云图床为个人提供 10G 的免费存储空间和完全够用的免费读写流量，用来作为博客图床再合适不过了。缺点就是七牛云图床默认使用 CDN 域名进行外链访问，而且是 30 天的临时域名，所以建议绑定一个备案域名作为永久 CND 域名进行访问。

# 改造思路

由于各大图床的 API 使用方式不尽相同，所以需要抽离出一个适配层进行接口调用的统一，通过不同的配置获取不同的图床实例进行 API 操作。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/625f68144b227b9ff8e4e69c35a54984.jpeg)

# 具体实现

## 目录结构

```typescript
|--imageBeds
|  |--index                 //接口统一适配层
|  |--cos.js            //腾讯云图床API操作层
|  |--oss.js            //阿里云图床API操作层
|  |--qiniu.js          //七牛云图床API操作层

```

## 代码实现

### 接口统一适配层

```javascript
// imageBeds/index.js
// 接口统一适配层

"use strict";
// 引入图床实例
const CosClient = require("./cos");
const OssClient = require("./oss");
const QiniuClient = require("./qiniu");
const out = require("../../lib/out");

// 目前已适配图床列表
const imageBedList = ["qiniu", "cos", "oss"];

class ImageBeds {
  constructor(config) {
    // 实例化时先赋值保存config配置
    this.config = config;
    // 获取图床实例
    this.imageBedInstance = this.getImageBedInstance(config.imageBed);
  }
  // 单例模式
  static getInstance(config) {
    if (!this.instance) {
      this.instance = new ImageBeds(config);
    }
    return this.instance;
  }

  /**
   * 获取图床对象的实例
   *
   * @param {string} imageBed 图床类型: cos | oss
   * @return {any} 图床实例
   */
  getImageBedInstance(imageBed) {
    if (!imageBedList.includes(imageBed)) {
      out.error(`imageBed配置错误，目前只支持${imageBedList.toString()}`);
      process.exit(-1);
    }
    switch (imageBed) {
      case "cos":
        return CosClient.getInstance(this.config);
      case "oss":
        return OssClient.getInstance(this.config);
      case "qiniu":
        return QiniuClient.getInstance(this.config);
      default:
        return QiniuClient.getInstance(this.config);
    }
  }

  /**
   * 检查图床是否已经存在图片，存在则返回url
   *
   * @param {string} fileName 文件名
   * @return {Promise<string>} 图片url
   */
  async hasImage(fileName) {
    return await this.imageBedInstance.hasImage(fileName);
  }

  /**
   * 上传图片到图床
   *
   * @param {Buffer} imgBuffer 文件buffer
   * @param {string} fileName 文件名
   * @return {Promise<string>} 图床的图片url
   */
  async uploadImg(imgBuffer, fileName) {
    return await this.imageBedInstance.uploadImg(imgBuffer, fileName);
  }
}

module.exports = ImageBeds;
```

### 腾讯云图床 API 操作层

```javascript
// imageBeds/cos.js
// 腾讯云图床API操作层
// 开发文档: https://cloud.tencent.com/document/product/436/8629

"use strict";

// 腾讯云图床
const COS = require("cos-nodejs-sdk-v5");
const out = require("../../lib/out");

const secretId = process.env.SECRET_ID;
const secretKey = process.env.SECRET_KEY;

class CosClient {
  constructor(config) {
    this.config = config;
    // 实例化腾讯云COS
    this.imageBedInstance = new COS({
      SecretId: secretId, // 身份识别ID
      SecretKey: secretKey, // 身份秘钥
    });
  }
  // 单例模式
  static getInstance(config) {
    if (!this.instance) {
      this.instance = new CosClient(config);
    }
    return this.instance;
  }

  /**
   * 检查图床是否已经存在图片，存在则返回url,不存在返回空
   *
   * @param {string} fileName 文件名
   * @return {Promise<string>} 图片url
   */
  async hasImage(fileName) {
    try {
      await this.imageBedInstance.headObject({
        Bucket: this.config.bucket, // 存储桶名字（必须）
        Region: this.config.region, // 存储桶所在地域，必须字段
        Key: `${this.config.prefixKey}/${fileName}`, //  文件名  必须
      });
      return `https://${this.config.bucket}.cos.${this.config.region}.myqcloud.com/${this.config.prefixKey}/${fileName}`;
    } catch (e) {
      return "";
    }
  }

  /**
   * 上传图片到图床
   *
   * @param {Buffer} imgBuffer 文件buffer
   * @param {string} fileName 文件名
   * @return {Promise<string>} 图床的图片url
   */
  async uploadImg(imgBuffer, fileName) {
    try {
      const res = await this.imageBedInstance.putObject({
        Bucket: this.config.bucket, // 存储桶名字（必须）
        Region: this.config.region, // 存储桶所在地域，必须字段
        Key: `${this.config.prefixKey}/${fileName}`, //  文件名  必须
        StorageClass: "STANDARD", // 上传模式（标准模式）
        Body: imgBuffer, // 上传文件对象
      });
      return `https://${res.Location}`;
    } catch (e) {
      out.error(`上传图片失败，请检查: ${e}`);
      process.exit(-1);
    }
  }
}

module.exports = CosClient;
```

### 阿里云图床 API 操作层

```javascript
// imageBeds/oss.js
// 阿里云图床API操作层
// 开发文档: https://help.aliyun.com/document_detail/32067.html

"use strict";

// 阿里云图床
const OSS = require("ali-oss");
const out = require("../../lib/out");

const secretId = process.env.SECRET_ID;
const secretKey = process.env.SECRET_KEY;

class OssClient {
  constructor(config) {
    this.config = config;
    this.imageBedInstance = new OSS({
      bucket: config.bucket,
      // yourRegion填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
      region: config.region,
      // 阿里云账号AccessKey拥有所有API的访问权限，风险很高。强烈建议您创建并使用RAM用户进行API访问或日常运维，请登录RAM控制台创建RAM用户。
      accessKeyId: secretId,
      accessKeySecret: secretKey,
    });
  }
  // 单例模式
  static getInstance(config) {
    if (!this.instance) {
      this.instance = new OssClient(config);
    }
    return this.instance;
  }

  /**
   * 检查图床是否已经存在图片，存在则返回url,不存在返回空
   *
   * @param {string} fileName 文件名
   * @return {Promise<string>} 图片url
   */
  async hasImage(fileName) {
    try {
      await this.imageBedInstance.head(`${this.config.prefixKey}/${fileName}`);
      return `https://${this.config.bucket}.${this.config.region}.aliyuncs.com/${this.config.prefixKey}/${fileName}`;
    } catch (e) {
      return "";
    }
  }

  /**
   * 上传图片到图床
   *
   * @param {Buffer} imgBuffer 文件buffer
   * @param {string} fileName 文件名
   * @return {Promise<string>} 图床的图片url
   */
  async uploadImg(imgBuffer, fileName) {
    try {
      const res = await this.imageBedInstance.put(
        `${this.config.prefixKey}/${fileName}`,
        imgBuffer
      );
      return res.url;
    } catch (e) {
      out.error(`上传图片失败，请检查: ${e}`);
      process.exit(-1);
    }
  }
}

module.exports = OssClient;
```

### 七牛云图床 API 操作层

```javascript
// imageBeds/qiniu.js
// 七牛云图床API操作层
// 七牛云的上传程序相对比较复杂，详情请查看sdk文档https://developer.qiniu.com/kodo/1289/nodejs

"use strict";

// 七牛云图床
const qiniu = require("qiniu");
const out = require("../../lib/out");

const secretId = process.env.SECRET_ID;
const secretKey = process.env.SECRET_KEY;

class QiniuClient {
  constructor(config) {
    this.config = config;
    this.init();
  }

  init() {
    if (!this.config.host) {
      out.error("使用七牛云时，需要在imgCdn中指定域名host");
      process.exit(-1);
    }
    const mac = new qiniu.auth.digest.Mac(secretId, secretKey);
    // 配置
    const putPolicy = new qiniu.rs.PutPolicy({ scope: this.config.bucket });
    // 获取上传凭证
    this.uploadToken = putPolicy.uploadToken(mac);
    const config = new qiniu.conf.Config();
    // 空间对应的机房
    config.zone = qiniu.zone[this.config.region];
    this.formUploader = new qiniu.form_up.FormUploader(config);
    this.bucketManager = new qiniu.rs.BucketManager(mac, config);
    this.putExtra = new qiniu.form_up.PutExtra();
  }

  static getInstance(config) {
    if (!this.instance) {
      this.instance = new QiniuClient(config);
    }
    return this.instance;
  }

  /**
   * 检查图床是否已经存在图片，存在则返回url,不存在返回空
   *
   * @param {string} fileName 文件名
   * @return {Promise<string>} 图片url
   */
  async hasImage(fileName) {
    return await new Promise((resolve) => {
      this.bucketManager.stat(
        this.config.bucket,
        `${this.config.prefixKey}/${fileName}`,
        (err, respBody, respInfo) => {
          if (err) {
            out.error(`上传图片失败，请检查: ${err}`);
            process.exit(-1);
          } else {
            if (respInfo.statusCode === 200) {
              resolve(
                `${this.config.host}/${this.config.prefixKey}/${fileName}`
              );
            } else {
              resolve("");
            }
          }
        }
      );
    });
  }

  /**
   * 上传图片到图床
   *
   * @param {Buffer} imgBuffer 文件buffer
   * @param {string} fileName 文件名
   * @return {Promise<string>} 图床的图片url
   */
  async uploadImg(imgBuffer, fileName) {
    return await new Promise((resolve) => {
      this.formUploader.put(
        this.uploadToken,
        `${this.config.prefixKey}/${fileName}`,
        imgBuffer,
        this.putExtra,
        (respErr, respBody, respInfo) => {
          if (respErr) {
            out.error(`上传图片失败，请检查: ${respErr}`);
            process.exit(-1);
          }
          if (respInfo.statusCode === 200) {
            resolve(`${this.config.host}/${this.config.prefixKey}/${fileName}`);
          } else {
            out.error(`上传图片失败，请检查: ${respInfo}`);
            process.exit(-1);
          }
        }
      );
    });
  }
}

module.exports = QiniuClient;
```

# 大功告成！

使用时，只需要在上层传入 config 配置，获取接口适配层实例，并替换原有的上传图片接口即可。

更多源代码详情，请查看[yuqe-hexo-with-cdn](https://github.com/LetTTGACO/yuque-hexo-with-cdn)
