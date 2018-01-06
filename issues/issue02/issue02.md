## 开发一个本地上传图片控件你需要知道的知识点

接了一个「常规」需求：开发一个本地上传图片控件，需要支持三种上传方式：
第一种：支持打开本地目录，选择本地图片上传
第二种：支持拖曳图片上传
第三种：支持微信截图上传

我们先从工程角度来看一下用户上传图片的流程是怎样子的：
1.用户选择了一张本地图片，或者拖曳了一张图片，或者通过微信截图了一张图片。这时，我们需要知道用户所选择图片的信息，比如图片的内容、图片的大小、图片的类型等。
2.用户上传图片。这时，我们需要保存图片。
3.用户查看图片。这时，我们需要把第2步中保存的图片展示给用户。

### 如何获取到图片信息

#### 通过input 打开本地目录，选择本地图片上传
通过type为file的input标签选择本地图片上传，每次选择不同图片的时候会触发onChange事件。为什么我要强调不同图片，因为当两次选择的图片是一样的情况下，onChange事件无法触发。解决方法：每次处理完后手动置空input的value。
```html
  <input id='img-input' type='file' accept='image/*' onChange={this.bindChooseEvents} />
```
```javascript
  // 置空input value
  clearImgInputValue () {
    document.getElementById('img-input').value = ''
  }
  bindChooseEvents = (e) => {
    console.log('choose a image')

    // 获取File对象
    const file = e.target.files[0]
    let size = file.size

    if (!file.type.match('image.*')) {
      AntMessage.warning('File\'s type is not supported. Images only.')
      this.clearImgInputValue()
      return;
    }

    if (size > maxSize) {
      AntMessage.warning('The size of the image is too large')
      this.clearImgInputValue()
      return;
    }

    /* eslint-disable */
    const reader = new FileReader()  // FileReader
    /* eslint-disable */
    // 将图片转换为base64
    reader.readAsDataURL(file)
    reader.onload = (arg) => {
      // 获取到base64图片内容
      const fileStream = arg.target.result
      /**
       * overwrite do something
       * */
      this.clearImgInputValue()
    }
  }
```
#### 拖曳图片上传
监听拖曳事件，通过拖曳相关的DataTransfer对象获取图片信息。
```html
  <div id='drop-zone' style={{width: '100px', height: '100px'}}>Drop Zone</div>
```
```javascript
  bindDragEvents = (e) => {
    const handleDragOver = (event) => {
      event.stopPropagation()
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
    }

    // 必须阻止dragenter和dragover事件的默认行为，这样才能触发 drop 事件
    const handleFileSelect = (event) => {
      event.stopPropagation()
      event.preventDefault()

      const files = event.dataTransfer.files // 文件对象
      const file = files[0]
      const size = file.size
      const type = file.type

      if (!type.match('image.*')) {
        AntMessage.warning('File\'s type is not supported. Images only.')
        return;
      }

      if (size > maxSize) {
        AntMessage.warning('The size of the image is too large')
        return;
      }

      /* eslint-disable */
      const reader = new FileReader()
      /* eslint-disable */
      // 将图片转换为base64
      reader.readAsDataURL(file)
      reader.onload = (arg) => {
        // 获取到base64图片内容
        const fileStream = arg.target.result
        /**
         * overwrite do something
         * */
      }
    }

    const dropZone = document.getElementById('drop-zone');
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleFileSelect, false);
  }
```
#### 微信截图上传
监听paste事件，通过剪贴板对象clipboardData获取图片信息。
```javascript
  bindClipEvents() {
    document.addEventListener('paste', (e) => {
      console.log('paste a image')
      const clipboard = e.clipboardData

      // 有无内容
      if (!clipboard.items || !clipboard.items.length) {
        AntMessage.warning('No content in the clipboard')
        return;
      }

      let item = clipboard.items[0]
      if (item.kind === 'file' && item.type.match('image.*')) {
          // 获取图片文件
          let imgFile = item.getAsFile()

          if (imgFile.size > maxSize) {
            AntMessage.warning('The size of the image is too large')
            return;
          }

          const reader = new FileReader()
          // 将图片转换为base64
          reader.readAsDataURL(imgFile)
          reader.onload = (arg) => {
            // 获取到base64图片内容
            const fileStream = arg.target.result
            /**
             * overwrite do something
             * */
          }
      } else {
        AntMessage.warning('File\'s type is not supported. Images only.')
      }
    }, false)
  }
```

### 如何保存
图片保存一般都采用独立图片独立域名服务器，不会傻乎乎地把图片保存在web服务器上也不会直接存在项目表的数据库中。这样做有什么好处呢？
1. 图片访问是I/O密集型操作，很消耗服务器资源，从Web服务器独立出来后，能够减少Web服务器的压力
2. 便于扩容、容灾和数据迁移
3. 浏览器有同域名下的并发策略限制
4. 请求图片一般并不需要cookie，但是浏览器发起的所有同域名请求时，http头部都会自动带上cookie信息，导致浪费带宽
5. 方便对图片访问做负载均衡，可以对图片应用各种缓存策略
6. 方便迁移CDN
...

### 总结&优化

#### 流程图：



#### 不足:
我们虽然采用了独立图片服务器，下载过程只是通过Web服务器去数据库拿到图片地址，但是我们的上传操作仍旧经过了Web服务器，需要Web服务器上的应用程序来处理，所以上传过程仍旧对Web服务器造成压力。所幸的是，我们对图片上传大小进行了1M的大小限制，同时作为内部系统没啥访问压力，而且图片上传功能也并不是很高发的行为，所以这么做基本也不会有啥问题。但是最好的方案还是不管下载上传都直接走独立图片服务器，避免对Web服务器造成额外的压力。

#### 后续，探究图片服务器架构 & 如何应对大文件的上传 & Blob Buffer Stream三者之间的关系。

### 本文参考资料：

1. [理解DOMString、Document、FormData、Blob、File、ArrayBuffer数据类型](http://www.zhangxinxu.com/wordpress/2013/10/understand-domstring-document-formdata-blob-file-arraybuffer/)
2. [复制粘贴的高级玩法](http://www.alloyteam.com/2015/04/how-to-paste-zhuangbility/)
2. [使用FileReader.readAsArrayBuffer()在浏览器中处理大文件](http://joji.me/zh-cn/blog/processing-huge-files-using-filereader-readasarraybuffer-in-web-browser)
3. [大型网站图片服务器架构的演进](http://blog.jobbole.com/87967/)
