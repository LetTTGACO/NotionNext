---
password: ""
icon: ""
创建时间: "2023-04-07T19:15:00.000Z"
date: "2021-01-15"
type: Post
slug: sbgn9r
配置类型:
  type: string
  string: 文档
summary: ""
更新时间: "2023-08-26T14:48:00.000Z"
title: Tinymce-Vue初体验
category: 学习笔记
tags:
  - 富文本
  - Vue
status: Archived
urlname: b3c87db0-ebc5-4eb3-9529-2ea17e5d4bc8
updated: "2023-08-26 14:48:00"
---

# 引言

最近有需求需要用到富文本编辑器，而且需要将上传/粘贴的图片上传到阿里云 OSS 上。在简单体验了几个富文本编辑器之后，决定选用 Tinymce。 Tinymce-Vue 里面的坑还是挺多的，花了两天时间终于把一些简单的坑填上了，基本上算是满足了需求。这里来简单讲一下在项目中使用 `Tinymce-Vue` 的经过。

# Tinymce-Vue 插件安装

```text
npm install @tinymce/tinymce-vue -D
npm install tinymce -D
```

安装成功之后，在`node_modules`目录中，找到`tinymce`中的`skins`目录，将其拷贝到`static`或者`public`目录下。为了结构清晰，我外层包了`tinymce`目录。

> 踩坑 ①：用不同版本的 vue-cli 创建出来的项目，默认静态公共资源的目录是不一样的。vue-cli2 的默认静态公共资源目录为 static，但是 vue-cli3 默认为 public。拷贝的时候根据自己项目的配置注意下

由于`tinymce`默认是英文界面，如果需要下载[中文的语言包](https://www.tiny.cloud/get-tiny/language-packages/)，可以去官网下载。下载之后将其放在`public/tinymce/`下。同样的，为了结构清晰，我将其放在了`langs`目录下。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/10f143f442b9ea87df6a7fd826e6c14c.png)

# 起步

在组件中初始化`Tinymce.vue`组件，并引入需要用到的依赖。

```javascript
// 引入基本文件
import tinymce from "tinymce/tinymce";
import Editor from "@tinymce/tinymce-vue";
// 引入主题文件
import "tinymce/themes/silver";
// 引入你需要的插件
import "tinymce/plugins/paste"; //粘贴插件，很强大，配置后可以粘贴图片
import "tinymce/plugins/image"; //上传图片的插件
import "tinymce/plugins/table"; //表格
import "tinymce/plugins/wordcount";
```

由于`Editor-vue`也是官方封装的组件，所以需要注册组件使用。

```javascript
components: {
  Editor;
}
```

使用组件，代码如下：

```javascript
<template>
  <div class="tinymce-editor">
    <editor
      :key="tinymceFlag"
      class="editor"
      v-model="myValue"
      :init="tinymceInit">
    </editor>
    <a-button @click="handleSubmit" type="primary" class="button">{{ label }}</a-button>
  </div>
</template>

<script>
// 引入基本文件
// eslint-disable-next-line no-unused-vars
import tinymce from 'tinymce/tinymce'
import Editor from '@tinymce/tinymce-vue'
// 引入主题样式
import 'tinymce/themes/silver'
// 引入你需要的插件
import 'tinymce/plugins/paste'
import 'tinymce/plugins/image'
import 'tinymce/plugins/table'
import OSS from '@/utils/oss.js'
import v1 from 'uuid'

export default {
  name: 'Tinymce',
  data () {
    return {
      tinymceFlag: 1,
      myValue: '',
      isShowFileDlg: false,
      tinymceInit: {}
    }
  },
  props: {
    // 基本路径，默认为空根目录，如果你的项目发布后的地址为目录形式，
    // 即abc.com/tinymce，baseUrl需要配置成tinymce，不然发布后资源会找不到
    // 我也不知道为啥要设置baseUrl，我目前没有遇到这个问题。等遇到再说
    baseUrl: {
      type: String,
      default: ''
    },
    // 定义允许上传的图片类型
    accept: {
      default: 'image/jpeg, image/png',
      type: String
    },
    // 最大上传图片大小
    maxSize: {
      default: 5242880,
      type: Number
    },
    // 偶尔会需要禁用富文本
    disabled: {
      type: Boolean,
      default: false
    },
    // 设置默认需要的拓展
    plugins: {
      type: [String, Array],
      default: 'image table wordcount'   // 可以按照自己需要配置默认需要的组件
    },
   	// 设置默认菜单栏 ‘|’ 用来分隔功能
    toolbar: {
      type: [String, Array],
      default: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | image table'
    },
    // 自己项目需要做一个类似提交表单的按钮
    label: {
      type: String,
      default: '提交'
    },
    // 设置默认宽度
    width: {
      type: String,
      default: '1200'
    },
    // 设置默认高度
    height: {
      type: String
    }
  },
  components: {
    Editor
  },
  mounted () {
  },
  created () {
    // 定义self防止this调用时指向性问题
    const self = this
    self.tinymceInit = {
      fontsize_formats: '11px 12px 14px 16px 18px 24px 36px 48px 50px 56px 60px 64px',
      language_url: `/tinymce/langs/zh_CN.js`, // 设置中文语言的路径，我的是/public下的tinymce
      skin_url: '/tinymce/skins/ui/oxide', // skin路径
      language: 'zh_CN',
      width: this.width,
      browser_spellcheck: true, // 拼写检查
      branding: false, // 去水印
      statusbar: false, // 隐藏编辑器底部的状态栏
      paste_data_images: true, // 允许粘贴图像
      menubar: false, // 隐藏最上方menu
      plugins: this.plugins,
      toolbar: this.toolbar,
      // 设置图片上传时的上传函数，支持图片复制粘贴前上传到指定服务器然后返回url到富文本
      images_upload_handler: (blobInfo, success, failure) => {
        if (blobInfo.blob().size > self.maxSize) {
          failure('文件体积不能超过' + this.maxSize / (1024 * 1024) + 'Mb')
        }
        if (self.accept.indexOf(blobInfo.blob().type) >= 0) {
          uploadPic()
        } else {
          failure('图片格式错误, 仅支持' + this.accept + '格式的图片')
        }
        // 异步上传到OSS
        async function uploadPic () {
          if (self.client) {
            //值得注意的是，测试时，微信截图后直接在富文本进行粘贴后会出现OSS文件类型报错，需要传入Buffer流或者Blob文件，可blobInfo.blob()按道理应该是blob才对，可还是报错，无奈做了一个blobInfo.blob()的带的File文件对象 ==》 ArrayBuffer流 ==》 Buffer流 才使得OSS能够识别。
            const reader = new FileReader()
            reader.readAsArrayBuffer(blobInfo.blob()) // File文件对象 ==》 ArrayBuffer流
            reader.onload = function (event) {
              console.log(event.target.result)
              // 引入UUID防止文件覆盖
              const fileName = `${v1()}-${blobInfo.name()}`
              self.client
                // ArrayBuffer流 ==》 Buffer流 ==》 OSS.put()
                .put(fileName, toBuffer(event.target.result))
                .then(result => {
                  // 得到OSS返回的url
                  result.url = result.res.requestUrls[0].split('?')[0]
                  // 将上传完成的状态抛出
                  self.$emit('on-upload-complete', result) // 抛出 'on-upload-complete' 钩子
                  // 返回url
                  success(result.url)
                })
                .catch(err => {
                  // 失败
                  failure(err)
                })
            }
          } else {
            // 封装的OSS的错误提示（ak失效时触发）
            await self.$message.info('上传配置已失效，重新加载中...')
          }
          return {
            failure () {}
          }
          // ArrayBuffer流 ==》 Buffer流
          function toBuffer (ab) {
            const buf = Buffer.alloc(ab.byteLength)
            const view = new Uint8Array(ab)
            for (let i = 0; i < buf.length; ++i) {
              buf[i] = view[i]
            }
            return buf
          }
        }
      }
    }
  },
  watch: {
    myValue (newValue) {
      this.$emit('input', newValue)
    }
  },
  activated () {
    // 当使用keep-alive时，在切换标签页再切回来会出现富文本key缺少无法使用的情况，在这个里做一个处理，让每次的key不一样
    this.tinymceFlag++
  },
  methods: {
    // 自己的业务需求需要一个提交按钮，将值传回父组件
    handleSubmit () {
      this.$emit('submit', this.myValue)
    }
  },
  computed: {
    // 封装的OSS的初始化方法
    client: function () {
      return OSS.client()
    }
  }
}
</script>

<style lang="scss" scoped>
  .tinymce-editor {
    margin-left: 30px;
    .button {
      margin-top: 15px;
      float: right;
    }
  }
</style>
```

> 坑 ②：当使用`keep-alive`时，富文本会出现`key`重复的问题

    坑③：微信截图完直接粘贴图片后`blobInfo.blob()`生成一个不能被`OSS`识别的`File`对象，需要`File`文件对象 ==》 `ArrayBuffer`流 ==》 `Buffer`流 才能被`OSS`识别
