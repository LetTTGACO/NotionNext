---
password: ""
icon: ""
创建时间: "2023-04-07T19:15:00.000Z"
date: "2020-04-20"
type: Post
slug: ulvcm5
配置类型:
  type: string
  string: 文档
summary: 本文介绍了如何使用webpack的url-loader和image-webpack-loader插件来优化图片。其中，url-loader可以将小于1kb的图片转换成base64编码进行存储，而image-webpack-loader可以对大一点的图片进行压缩。还介绍了各个优化器的作用，如mozjpeg、optipng、pngquant等，并提供了相应的配置参数说明。
更新时间: "2023-08-26T15:22:00.000Z"
title: Webpack配置-图片优化
category: 技术分享
tags:
  - Webpack
status: Archived
urlname: 451fde56-fb4a-475d-a152-82ebe33d6a74
updated: "2023-08-26 15:22:00"
---

# 引言

图片是大部分网页的重要组成部分，一般情况下，我们不会太关注这方面的问题，需要显示图片直接一个 `img` 标签搞定。但实际上，无论是对于提高加载速度，还是对于优化用户体验，优化图片都是一个重要的手段。 图片优化分成两个方面：

1. 图片压缩。在保证视觉效果的情况下，减少图片的体积。这个很有效，1M 和 100K 的图片，肉眼看起来几乎差不多，但却省了 90% 的流量，大大提高了加载速度。
2. 响应式图片。根据客户端的情况，选择最合适的图片返回给用户。用户是一个 500px 的设备，那么返回 1000px 的图给他就是浪费（假设物理像素和 CSS 像素是一比一）。

# 图片压缩

压缩的第一步是筛选出需要压缩的图片。如果图片本身就已经足够小了，那么再压缩的意义就不大。 而对于这些足够小的图片，我们就可以将其转换成雪碧图**（CssSprites）**或者`base64`编码来存储，而关于这两者的使用场景这里可以看一下这两篇文章（[不要滥用雪碧图 sprite](https://www.cnblogs.com/joyho/articles/3715275.html)和[玩转图片 Base64 编码](https://www.cnblogs.com/coco1s/p/4375774.html)）。

## url-loader

这里我采用的是 webpack 里的`url-loader`插件进行处理，对于小于 1kb 的图片，将其转换成`base64`编码进行存储。

```javascript
{
  test: /\.(png|jpe?g|gif|svg)$/,
  use: [{
      loader: "url-loader", // 它封装了file-loader，所以可以使用两个loader的全部配置属性
      options: {
        limit: 1024,
        esModule: false,
        outputPath: 'images' // 设置图片的输出路径
      }
    }
  ]
},
```

> 参数说明 > limit 是转换成 Base64 的图片大小的零界点设置，单位为 Byte，小于该数值的将进行转换。 esModule 是针对是否使用模块化框架的用户设定参数，默认为 true。如果项目中没有使用模块化框架，建议要将这个属性关闭，避免出现图片资源超过 limit，就变成[object Module]的问题。 outputPath 图片输出路径，将优化后的图片统一输出到该路径。

## image-webpack-loader

接下来就是压缩大一点的图片了，使用[image-webpack-loader](https://github.com/tcoopman/image-webpack-loader)进行进一步处理。

```javascript
{
  test: /\.(png|jpe?g|gif|webp|svg)$/,
  use: [{
      loader: "url-loader",
      options: {
        limit: 1024,
        esModule: false,
        outputPath: 'images'
      }
    },
    {
      loader: 'image-webpack-loader',
      options: {
        mozjpeg: {
          progressive: true,
          quality: 70 // 数值越高，质量越好
        },
        optipng: {
          // enabled: false,
          OptimizationLevel: 4 // 默认是3
        },
        pngquant: {
          enabled：false,
          // quality: [0.75,0.95],
          // speed: 4
        },
        gifsicle: {
          interlaced: true, // 默认：false 隔行扫描gif进行渲染
        },
        // webp: {
        //   quality: 75
        // }
      }
    }
  ]
},
```

> 如文档所说，image-webpack-loader 随附以下优化器，默认情况下会自动启用这些优化器：

    - [mozjpeg](https://github.com/imagemin/imagemin-mozjpeg) — 压缩 JPEG 图像
    - [optipng](https://github.com/kevva/imagemin-optipng) — 压缩 PNG 图像
    - [pngquant](https://github.com/imagemin/imagemin-pngquant) — 压缩 PNG 图像
    - [svgo](https://github.com/kevva/imagemin-svgo) — 压缩 SVG 图像
    - [gifsicle](https://github.com/kevva/imagemin-gifsicle) — 压缩 GIF 图像

    和可选的优化器：

    - [webp](https://github.com/imagemin/imagemin-webp) —将 JPG 和 PNG 图像压缩为 WEBP

    可以通过指定禁用默认优化器`optimizer.enabled: false`，并将其放在选项中即可启用可选优化器。

### [imagemin-mozjpeg](https://github.com/imagemin/imagemin-mozjpeg)

JPEG 根据显示方式的不同，分为两种：Progressive JPEG 和 Baseline JPEG。 Progressive JPEG 会先加载模糊的整张图片，然后变的越来越清晰。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/d1dae36736ef4d62ef8dddacecffcd68.jpg)

而 Baseline JPEG 会先清晰地加载图片的一部分，然后慢慢显示剩余的部分。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/42c1665c1c79e9df76adcbcc504c8d9b.jpg)

从视觉效果来说，Progressive JPEG 自然更好一些。但它也有一些缺点，比如它的解码速度比 Baseline JPEG 要慢，占用的 CPU 时间更多。 如果是桌面浏览器，这点性能问题自然无所谓，但是如果是移动端，就不得不考虑。工程本来就是权衡的艺术。 默认情况下，MozJPEG 生成的是 Progressive JPEG，可以通过 [选项](https://github.com/imagemin/imagemin-mozjpeg#progressive) 调整。

### [optipng](https://github.com/imagemin/imagemin-optipng)

在研究文档的过程中发现一个有趣的问题，也可能是官网无意中的行为（真的吗？），官方文档为了说明其 API 中的禁用指定优化器功能`optimizer.enabled: false`，就在文档中写了这么一段代码：

```javascript
{
// optipng.enabled: false will disable optipng
	optipng: {
		enabled: false,
	},
  pngquant: {
    quality: [0.65, 0.90],
    speed: 4
    }
}
```

本来是一个举例说明，结果在我 google 的几乎所有用户的 webpack 配置中，大家都把`optipng`这个优秀的压缩工具给禁用了 QAQ。 实际上在压缩质量上来说，`optipng`是无损压缩，采用的是基于 LZ/Huffman 的 DEFLATE 算法，以减少图片 IDAT chunk 区域的数据来实现压缩图片，同样是无损压缩的工具还有[**pngcrush**](https://pngcrush.com/)**、**[**pngout**](https://www.oschina.net/translate/4-free-tools-to-optimize-and-compress-png-images-without-loosing-quality?print=)**、advpng**。 而[pngquant](https://github.com/kornelski/pngquant)和[**tinypng**](https://tinify.cn/)**、**[**ImageAlpha**](https://github.com/kornelski/ImageAlpha)**、**[**pngnq**](https://github.com/stuart/pngnq)等都是有损压缩，采用的是 quantization 算法，将 24 位的 PNG 图片转换为 8 位的 PNG 图片，减少图片的颜色数来实现图片压缩； 具体可以参考[Laya 图片压缩](https://www.jianshu.com/p/83d00a7e2a4b)对于各个压缩工具的对比情况。 但是呢，一般有损压缩的压缩率会大大高于无损压缩。就如 png 和 jpg 两者来说，png 格式可以进行无损压缩，质量好、支持透明但是体积大，jpg 的质量相对差一点但是体积很小，两者体积相差几乎在 70%以上。所以具体的权衡取舍还是看个人实际应用场景。

### [pngquant](https://github.com/imagemin/imagemin-pngquant)

正如上面所说，它是一个有损压缩，我这里为了演示，暂时禁用了它。

> 参数说明(引用自 Laya 图片压缩)： 1.quality 参数的作用是保证图片经过优化处理后，图片质量的取值范围（0~1）。取值越小，表示压缩比率越大，同时的图片的质量也就越差。在测试过程中发现，当设置最低取值为 0.60 或 0.65 时，部分图片的质量会严重下降，因此最终选择了 0.70 作为最低值。 2.speed 参数的设置决定了图片优化的执行速度，取值范围为 1~10，默认值为 4。其中 10 的执行速度最快，对应的压缩比率最小；而 1 的执行速度最慢，对应的压缩比率最大。在测试过程中发现，无论我设置哪一个值它们的执行时间都差不多，不过压缩比率确实 1 的最大，10 的最小。 实测效果： 在设置 quality 的取值范围为 0.70~0.95，以及 speed 为 4 的情况下，可以在尽可能不影响图片质量的前提下去缩减文件的大小。 在测试过程中，我们以 PNG-8 品质为 256 的图片为例，最终的图片输出可以降低 70%左右的大小（从 3.78KB 缩减到 1.13KB）。

### [gifsicle](https://github.com/imagemin/imagemin-gifsicle)

gifsicle 一共有 4 个参数配置，我一般常用的就 interlaced，即隔行扫描进行渲染，图片会自上而下渐进式加载。 在上文中提到的 Progressive 和 Baseline 的区别中，progressive 等同于`interlaced`，baseline 等同于 `not interlaced`，所以取舍自己决定。

> 参数说明 optimizationLevel 是优化级别，默认值为 1，取值范围在 1-3。优化级别的高低决定图片的质量，较高的级别需要更长的时间，但可能会有更好的效果。 文档中给出了 3 种取值所做的事： 1：仅存储每个图像的更改部分 2：还使用透明度进一步缩小文件。 3：尝试几种优化方法（通常速度较慢，有时效果更好）。 colors 是颜色减少的高低设置，是将每个输出 GIF 中的不同颜色数量减少到指定数值或者更少，取值范围在 2-256 之间。 buffer 是利用缓冲进行优化。

### [webp](https://github.com/imagemin/imagemin-webp)

最后来看一下该插件的可选优化器 Webp。

> 参数说明 > quality 质量参数，将品质因数设置在 0 和之间 100。是最常用，大多数场景下也只需要调整这一个参数即可。 其他参数可以参考官方文档 > 注意，在实际的使用中，发现这里存在一个容易被忽视的坑。 > image-webpack-loader 里的 webp 优化器只是针对已有的 webp 文件进行质量上的优化（或者说就不起作用，如果有研究出来的大佬麻烦评论告知哈），并不能把前面的 png/jpg 转成 webp。官方文档有点误导到大家，导致许多图片优化的教程都把这个当成 webp 转换器，然而我实际试了下，并不能=.=。

至于 webp 的优化过程，我将在下文`优雅地使用WebP图片`中详细介绍。

# 响应式图片

所谓响应式图片，关键就一点：**根据客户端的情况返回最适合客户端的图片**。

那么，在准备部署响应式图片的时候，会存在哪些情况呢？

- 是否希望根据客户端情况返回不同的图片 **内容**?
- 是否希望根据客户端情况返回不同的图片 **格式**？
- 是否希望根据客户端情况返回不同的图片 **尺寸** ？
- 是否希望优化高 **分辨率** 设备的体验？

在 `picture` 标签出来之前，这些只能通过 JS 来实现，不仅代码而且丑陋能力也不全。但是现在，针对这些问题，我们有了一个完整的优雅的解决方案。

## picture 标签

`picture` 是 HTML5 新引入的标签，基本用法如下。

```html
<picture>
  <source srcset="a.jpg" />
  <source srcset="b.jpg" />
  <img
    src="https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/792069df363c9e9a3737d98e38ffb46e.jpg"
  />
</picture>
```

我们可以这样理解，`picture` 标签会从 `source` 中选择最合适的一个，然后将它的 URL 赋值给 `img`。对于不认识 `picture` 的旧浏览器，他们会忽略 `picture`，只渲染 `img`，一切都不会有问题。 注意：`**picture**`** 标签最后一定要包含一个 **`**img**`** 标签，否则，什么都不会显示。** 现在我们逐一来看 `picture` 是怎样解决上面的四个问题。

## 动态内容

根据客户端的情况，我们来返回完全不同的两张图。这个很简单，使用 `source` 标签的 `media` 属性即可。 如下代码会在小于 1024px 的时候显示 `img-center.jpg`，而在大于等于 1024px 的时候显示 `img-full.jpg`。

```html
<picture>
  <source media="(min-width: 1024px)" srcset="img-full.jpg" />
  <img src="img-center.jpg" />
</picture>
```

## 动态尺寸

如果希望浏览器能根据情况去请求不同尺寸的图片，我们需要提供两个信息：

- 有哪些尺寸的图片
- 图片显示的时候是什么尺寸

下面的代码中，我们首先使用 `srcset` 属性指定有哪些图片，分别是图片名和图片的尺寸，这里注意单位不用 `px` 而是 `w`，用于表示图片的固有宽度。 `sizes` 属性告诉浏览器，这个图片在不同的条件下会是什么样的宽度。这个属性用于给到浏览器提示，并不会真正的指定 `img` 的宽度，我们还是需要另外使用 CSS 来指定。 这样，给定一个视口宽度，浏览器可以得知图片需要的宽度，然后根据 DPI 情况，在所有可选图片中选择最合适的一个。

```html
<img
  src="img-400.jpg"
  sizes="(min-width: 640px) 60vw, 100vw"
  srcset="
    img-200.jpg   200w,
    img-400.jpg   400w,
    img-800.jpg   800w,
    img-1200.jpg 1200w
  "
/>
```

## 动态分辨率

动态分辨率其实是动态尺寸的一种简化情况。 根据显示器的 DPI 返回同一张图片的不同分辨率版本可以直接利用 `img` 标签的 `srcset` 属性。 使用了如下的代码，浏览器会自动根据显示器的 DPI 来决定下载图片的哪个版本。 在低 DPI 设备上，例如桌面显示器，浏览器会使用 img-200.jpg，而在高 DPI 设备上，例如手机，浏览器会使用 img-400.jpg。

```html
<img srcset="img-200.jpg, img-300.jpg 1.5x, img-400.jpg 2x" src="img-400.jpg" />

<style type="text/css">
  img {
    width: 200px;
  }
</style>
```

当然，我们也可以组合这几个选项。

- 视口 >= 1280px 时
  - 根据视口的具体宽度，返回不同尺寸的 _img-full_ 图片
  - 如果客户端支持 WebP，返回 WebP 格式
- 视口 < 1280px 时
  - 根据视口的具体宽度，返回不同尺寸的 _img_ 图片
- 如果客户端支持 WebP，返回 WebP 格式

```html
<picture>
  <source
    media="(min-width: 1280px)"
    sizes="50vw"
    srcset="
      img-full-200.webp   200w,
      img-full-400.webp   400w,
      img-full-800.webp   800w,
      img-full-1200.webp 1200w,
      img-full-1600.webp 1600w,
      img-full-2000.webp 2000w
    "
    type="image/webp"
  />
  <source
    media="(min-width: 1280px)"
    sizes="50vw"
    srcset="
      img-full-200.jpg   200w,
      img-full-400.jpg   400w,
      img-full-800.jpg   800w,
      img-full-1200.jpg 1200w,
      img-full-1600.jpg 1800w,
      img-full-2000.jpg 2000w
    "
  />

  <source
    sizes="(min-width: 640px) 60vw, 100vw"
    srcset="
      img-200.webp   200w,
      img-400.webp   400w,
      img-800.webp   800w,
      img-1200.webp 1200w,
      img-1600.webp 1600w,
      img-2000.webp 2000w
    "
    type="image/webp"
  />
  <img
    src="img-400.jpg"
    sizes="(min-width: 640px) 60vw, 100vw"
    srcset="
      img-200.jpg   200w,
      img-400.jpg   400w,
      img-800.jpg   800w,
      img-1200.jpg 1200w,
      img-1600.jpg 1600w,
      img-2000.jpg 2000w
    "
  />
</picture>
```

这里强烈建议自己动手，结合 [placeholder.com](https://placeholder.com/) 网站，生成一些图片来测试。毕竟，纸上得来终觉浅。

# 优雅地使用 WebP 图片

在使用 webp 图片之前，我们先来了解下 webp 格式的图片到底是怎样的。 参考[将之前的项目图片进行了压缩](https://blog.liuguofeng.com/tag/%E5%9B%BE%E7%89%87)这篇文章的说明：

[WebP](https://developers.google.com/speed/webp/)是 Google 推出的一种相对较新的格式，旨在通过编码[无损](https://en.wikipedia.org/wiki/Lossless_compression)和[有损](https://en.wikipedia.org/wiki/Lossy_compression)格式的图像来提供较小的文件大小，使其成为 JPEG 和 PNG 的绝佳替代品。 WebP 图像的视觉质量通常与 JPEG 和 PNG 相当，但通常文件大小要小得多。例如，当我将屏幕截图从上面转换为 WebP 时，我得到了一个 88 KB 的文件，其质量与 913 KB 的原始图像相当。**减少 90％！** 看一看下面三张图，你能分辨的出来吗？

- [原始图片](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/blog-images/20200419232154.png)
- [优化后的图片](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/blog-images/20200419232255.png)
- [webp 图片](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/blog-images/20200419232329.webp)

就个人而言，视觉质量具有可比性，您所获得的节省很难被忽视。现在我们已经确定了尽可能使用 WebP 格式的价值，但是要注意是它不能完全取代 JPEG 和 PNG。根据

[caniuse.com](https://caniuse.com/#search=WebP)

提供的数据显示，虽然浏览器中的 WebP 支持已经很普遍了，但是需要足够高的版本号才可支持。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/9040695af58ed92f297aa43724bf66d3.png)

截止撰稿日(2020-04-20)，只有 Safari 还在试验中，也算是即将支持 webp 图片了。至于 IE 浏览器嘛，emmmm….一言难尽

数据显示，全球有 77.63%的用户使用支持 WebP 的浏览器。这意味着，通过提供 WebP 图像，您可以为 77.63%的客户提高网页速度。 所以，在客户端支持的情况下，我们应该尽可能地使用 WebP 格式。

## picture 标签兼容优化

### 优化流程

在开始讲针对 webp 图片的优化前，我想先梳理下开发流程。 这里需要分两种情况：

1. 全新网站的兼容优化
2. 针对已有网站的兼容优化。

如果是全新网站，而且设计师把各种图片都给到你了，那就完全不用担心图片转换问题，可以直接运用`picture`标签书写兼容格式，我这里就不再赘述。 而本文主要讲的就是在图片格式不全的情况下，甚至是对已有目录的静态网站进行优化时该怎样的开发流程。 第一个是顺序，在上面我尝试了在构建的同时利用 image-webpack-loader 可选的 webp 转换器，直接对现有 jpg/png 图片转换失败后，就暂时无法在缺失 webp 图片的情况下直接进行改造。 所以现在的思路是：

1. 将现有的图片全部转换成 webp 格式。
2. 将已有的 img 标签全部替换成 picture 标签。
3. 利用 webpack 的 html-loader 识别出所有图片格式的路径后并将其 hash 重命名后打包到同一文件夹下。

下面将具体展开谈一下针对单入口的页面和多入口的页面的处理。

### 单入口页面

对于单入口单页面的话，网站所用的图片原则上都只在一个文件夹。假设一个单页面网站的目录结构是这样的：

```c#
|--dist  								//打包后的路径
|--src  								//项目源代码目录
|  |--css  							//存放css样式表
|  |--images  					//存放网页所需的所有图片
|  |--js  							//存放javaScript代码
|  |--index.html  			//网页入口
|--webpack.config.js  	//webpack的配置文件
|--package.json  				//项目元数据，依赖包等信息
|--package-loack.json   //依赖包具体版本信息
|--webp.js   						//下文中提到的转换图片的js
```

我们可以使用`imagemin-webp`官方文档所提供的方法：使用了`imagemin`和`imagemin-webp`来转换 jpg/png。 在根目录中新建`webp.js`文件

```javascript
const imageminWebp = require("imagemin-webp");
const imagemin = require("imagemin");

imagemin(["src/images/*.{jpg,png}"], {
  destination: "src/images",
  plugins: [
    imageminWebp({
      quality: 80,
    }),
  ],
});
```

这样就可以在根目录运行`node webp.js`，把项目中的所有 jpg/png 转成 webp 格式图片并存放到原图片目录下，然后就可以对原有 img 标签进行改造，加上 webp 格式的图片。

### 多入口页面

对于让人头疼的多入口页面来说，配置起来就复杂的多。首先我们先约定一下多入口页面的目录结构。

### 目录结构

多入口也就意味着多出口，不但 html 网页可能分布在不同的文件夹下，不同网页所需的图片/css/js 也被存放到对应网页的不同文件夹下。假设一个多入口页面的目录结构如下：

```c#
webpack
|--dist  								//打包后的路径
|--src  								//项目源代码目录
|  |--common						//存放各个页面都有可能用到的组件库（基本不变更）
|  |  |--jquery.min.js
|  |  |--swiper.min.js
|  |--css  							//存放css样式表
|  |  |--index.scss  		//index页面所需的样式表
|  |  |--about.scss  		//about页面所需的样式表
|  |  |--common.scss  	//通用样式表
|  |--images  					//存放网页所需的所有图片
|  |  |--index  				//index页面所需的图片
|  |  |  |--header1.png
|  |  |  |--banner1.png
|  |  |  |--a1.jpg
|  |  |  |--...
|  |  |--about  				//about页面所需的图片
|  |  |  |--header1.png
|  |  |  |--banner1.png
|  |  |  |--a1.jpg
|  |  |  |--...
|  |  |--common  				//可复用的图片
|  |  |  |--logo.png
|  |  |  |--footer.png
|  |  |  |--wechat.svg
|  |  |  |--...
|  |--js  							//存放javaScript代码
|  |  |--index.js  			//index页面的js文件
|  |  |--about.js  			//index页面的js文件
|  |  |--common.js  		//可复用的js
|  |--index.html  			//网站首页html
|  |--about.html  			//关于网站html
|--webpack.config.js  	//webpack的配置文件
|--package.json  				//项目元数据，依赖包等信息
|--package-loack.json   //依赖包具体版本信息
```

可以看出，较为复杂的就是图片了。由于多个页面所需的图片数量非常多，在开发的过程中很难保证图片起名的不重复，所以最理想的就是放在不同文件夹下了。 但是新的问题出现了：webpack 常用于将不同文件都打包至同一目录下，如果打包后命名重复导致文件被覆盖了怎么办？ 当然，webpack 也给出了几乎完美的解决方案：将文件进行 hash 重命名后输出，这样就几乎不会导致重名覆盖问题的发生。 可是，又一个棘手的问题发生了： 上文我们也说了，我们是要在打包前就将图片转换成 webp 格式。这样改造过程中，静态资源的文件名也不会变，路径也是各自的路径，开发过程才能方便起来。 那么，既然用到的图片会重名，所以将图片整体拿出来手动转换后再丢回到各自文件夹的方法也不可取。最理想的就是各自转换各自的目录，所以第一个办法就是：

- 用单页面转换的方式，每次改一下输入输出路径，对每个存放图片的文件夹单独转换。

怎么说呢，可以是可以的，但是既然都用了 webpack 自动化打包了，我们应该减少手动操作文件的次数。而且后期维护起来，那是相当的麻烦。当你有更多的页面，每次需求方更新图片的时候，我们都得手动操作一次，费力又费时间。

### gulp

于是乎我投向了 gulp 的怀抱，gulp 在操作文件的过程中，借鉴了 linux 的管道思想，可以将上个的输出作为下一个的输入。于是，基于 gulp 的自动化转换程序诞生了： 首先在根目录建立 gulpfile.js 文件，并安装好所需的依赖。

> 注意，gulp 需要安装两次

```javascript
npm i gulp -D //保证依赖被安装到node_modules下
npm i gulp -g //保证直接在命令行使用gulp命令时不会报错
```

```javascript
const gulp = require("gulp");
const fs = require("fs");
const merge = require("merge-stream");
const path = require("path");
const webp = require("gulp-webp");
// 获取文件夹
function getFolders(dir) {
  return fs.readdirSync(dir).filter(function (file) {
    return fs.statSync(path.join(dir, file)).isDirectory();
  });
}

// 需要转换的文件路径，我这里设置为根目录下的src目录
const scriptsPath = path.resolve(__dirname, "src");

function imagesToWebp() {
  const folders = getFolders(scriptsPath);
  const tasks = folders.map(function (folder) {
    console.log(folder);
    //依次输出：
    //common
    //css
    //images
    //js
    // /**/*.{jpg,png}是找到src下所有层级的jpg/png图片
    return gulp
      .src(path.join(scriptsPath, folder, "/**/*.{jpg,png}"))
      .pipe(webp()) //使用webp插件进行转换（默认会保留原图片）
      .pipe(gulp.dest(scriptsPath + folder)); //输出到各自的文件夹下
  });
  return merge(tasks); //合并gulp流
}

exports.webp = gulp.series(imagesToWebp);
```

大功告成！这样我们就可以在命令行使用`gulp webp`命令进行图片转换了。 在拿到了所有 webp 文件后，就可以使用 picture 标签进行改造了。

```html
<picture>
  <source srcset="./images/index/a1.webp" type="image/webp" />
  <img
    src="https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/422518013301d5620e0d9130f74de00f.png"
  />
</picture>

<picture>
  <source srcset="./images/about/a1.webp" type="image/webp" />
  <img
    src="https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/c0d9eb7699d996ff758e80dfed835afe.png"
  />
</picture>
```

> 注意： 记得在 webpack.config.js 中使用 html-loader 时，将 source 标签下的 srcset 属性加入 attrs，否则 html-loader 将无法识别 source 标签中的图片路径。

```json
{
  test: /\.(html)$/,
  use: {
    loader: 'html-loader',
    options: {
      root: path.resolve(__dirname, 'src'),
      attrs: ['img:src', 'img:data-src', 'source:srcset']
    }
  }
}
```

对于 webpack 中关于多页面的其他配置，我将在其他文章中详细介绍并分享我的代码，请持续关注，谢谢～

## 利用 cdn 服务自动判断

目前，有些图片 cdn 服务可以开启自动兼容 webp 的模式，即支持 webp 的浏览器则将原图转换为 webp 图片并返回，否则直接返回原图。实现这个功能的原理是，根据浏览器发起的请求头中的 Accept 属性中是否包含 webp 格式来判断：

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/5e751b9fc8bf4dbbfa90b35709dc5d70.png)

有则说明浏览器支持 webp 格式，这对开发者来说可能是最简单的兼容方案，但是依赖于后端服务。

# 参考

1. [将之前的项目图片进行了压缩](https://blog.liuguofeng.com/tag/%E5%9B%BE%E7%89%87)
2. [谈谈 Web 应用中的图片优化技巧及反思](https://juejin.im/post/5d4979cc5188255b3e4126ae#heading-10)
3. [Laya 图片压缩](https://www.jianshu.com/p/83d00a7e2a4b)
