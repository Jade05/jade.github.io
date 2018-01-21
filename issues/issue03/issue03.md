##【Draft】webpack热更新问题解决及分析（一）

简介：本项目架构以express作为服务端，本地开发搭配webpack-dev-middlerware、wepack-hot-middleware、webpack.HotModuleReplacementPlugin实现热加载刷新。生产打包结果在存在dist目录下，开发热加载替换目录为/examples。

### 问题发现

#### 问题描述
现象：本地代码通过打包生产的配置文件（webpack-build.config.js）打包生成的js能够被页面引用到并且入口正常，但是在通过打包本地开发的配置文件（webpack-develop.config.js）打包生成的js也能够被页面引用到但是入口不正常。

具体的例子：
入口文件 - examples/test/index.js
```javascript
const Test = {
  text: 'hello world!'
}

module.exports = Test
```
html - example/test/index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>test</title>
</head>
<body>
    Test
    <!-- <script src="../../dist/components/test.js"></script> -->
    <script src="/examples/test.js"></script>
    <script>
      console.log(test)
      console.log(test.text)
    </script>
</body>
</html>
```
webpack-develop.config.js:
```javascript
entry: {
    test: [path.resolve(__dirname, 'examples/test/index.js'), 'webpack-hot-middleware/client?path=/examples/__what&reload=true'],
  },
  output: {
    filename: '[name].js',
    publicPath: '/examples/',
    library: '[name]',
    libraryTarget: 'umd',
  },
```
本地起服务，在浏览器中打开/examples/test/index.html，按照预期结果，控制台应该输出{text: "hello world!"} hello world!。但是控制台却输出了如下结果：
![01](https://user-images.githubusercontent.com/5029635/35033800-f41cb09e-fba6-11e7-9e85-cdff8b6ce1b0.jpg)

第一反应是：js文件没有加载到。但是通过浏览器面板查看后可以看到test.js已经被正确加载到，而且通过http://localhost:3000/examples/test.js可以看到，examples/test/index.js也已经打包进来：
![02](https://user-images.githubusercontent.com/5029635/35034048-cfefc688-fba7-11e7-9a1b-3d5bd9dcdf12.jpg)

#### 问题分析
懵，就是取不到，明明就在那里-.-。更神奇的是，如果我不用webpack-develop.config.js打包，而是用webpack-build.config.js把文件直接打包到物理磁盘（注：因本地开发是基于webpack-dev-middleware 和hot-middleware，开发打包的结果并不存在于物理磁盘，只存在于内存中），然后更换examples/test/index.html的引用入路径为 ‘’../../dist/components/test.js‘’，即生产打包后的物理文件路径，就一切正常，不会出现加载但是无法引用的问题。

webpack-develop.config.js和webpack-build.config.js有啥区别？区别还是有的，但是其他入口的页面（注：本项目可理解为是多入口页面）也是基于这两个配置文件的，本地开发和生产打包后皆是正常。仔细排查会发现如下两个解决问题的入口：
>1.  webpack-develop.config.js和webpack-build.config.js是有区别的，build配置里头使用ExtractTextPlugin、UglifyJSPlugin，而develop没有使用，develop有热加载插件；
>2.  其它入口的页面都是正常的，唯独examples/test/index.js这种情况有问题，比较后会发现引入的使用方式不同，其他入口文件的是引用了模块文件后自执行代码片段输出dom，而examples/test/index.js作为打包入口最后通过module.exports = Test，然后example/test/index.html是直接通过<script>标签引入后直接去取全局变量里头的Test引用，取引用失败。而事实上我们知道，通过umd打包后，如果页面通过script标签直接引入，入口文件module.exports输出对象实际就是挂在windows上的
![03](https://user-images.githubusercontent.com/5029635/35035851-7ebaa44e-fbad-11e7-9d36-4282df8cbd9f.jpg)

在第1个问题入口处排查中取出热加载功能后，就一切正常了。结合以上两点，我们有理由猜测导致上述问题的原因很可能是热加载过程中导致入口文件module.exports输出的对象无法被正确挂载到windows上。而至于真实情况是就是没有挂载还是挂载后被冲掉（复写）了，则需要分析源码才能知道。

#### 问题解决
去掉热替换，本地开发一切正常。直接去掉实在太残暴，而且热替换这么提高开发效率的工具就因为这一种情况下直接去掉实在可惜，所以为了不影响其他入口的热替换，本地开发模式可以只对指定入口去掉，webpack-develop.config.js 在指定entry去掉 'webpack-hot-middleware/client?path=/examples/__what&reload=true'即可。

### 深入探讨
[我们需要从webpack热更新的原理说起](https://github.com/Jade05/jade.github.io/issues/4)。
