## 目录
1. AMP是什么
2. 我们为什么选择AMP
3. AMP项目开发
4. 我们踩过的"坑"儿
5. 如何优化AMP SEO页面
6. eamp框架，让开发AMP项目更简单


## AMP是什么

Google 前沿的 AMP 「 Accelerated Mobile Pages 」技术，能使用户从搜索引擎当中进入我们页面的体验得到一个极大的提升。确切地说，AMP并不是一门新的技术，它只是一种能让页面打开得更快的解决方案。你只要会HTML,CSS，略懂JS，就可以开发你自己的AMP页面。

有关AMP更多内容可以参看[官网](https://www.ampproject.org/zh_cn/learn/overview/)。


## 我们为什么选择AMP

看看AMP能给我们带来什么：
1. AMP能够带来SEO排名优化。
2. AMP Cache能够让我们充分借助Google CDN cache的优势。虽然我们内部已经做了很多优化，包括DNS预热（有关DNS预热可参见我们组同事写的一篇文章——[网站性能优化——DNS预热与合并HTTP请求](https://zhuanlan.zhihu.com/p/32168340)），但如果能有Google全球CDN支持就更是件好事。
3. Google搜索结果对AMP页面有预加载处理，能让用户更快地到达我们的着陆页。

所以，作为携程的海外业务部门，我们率先试水了AMP项目。


## AMP项目开发

AMP项目开发和普通站点的开发模式几乎一样，但是为了最大限度提升性能，AMP项目页面有不少要求。比如：
1. 为了避免 JavaScript 延缓页面渲染，AMP页面不能包含自己编写的JavaScript。
2. CSS都必须内联，以减少HTTP的请求，并且有50KB的大小限制。
3. AMP 页面允许第三方 JavaScript，但仅限在沙盒环境下的 iframe 中。
4. 用户几乎可以使用所有原生的HTML标签，但是对img等会产生外部资源依赖的标签，只能使用amp-img自定义标签。

基于以上几点，页面上所有交互逻辑都必须通过css实现，无法依赖JS。对于实现复杂的交互，AMP会显得力不从心。但是这其实是和AMP原则相一致的，JS丰富了页面，但JS也是页面优化噩梦的开始。[What Google AMP means for the JavaScript community](https://molily.de/amp/)这篇文章将阐述JavaScript性能影响。

当开发完成后，必须保证页面是符合AMP规范的，只有符合AMP规范的页面才会被搜索引擎收录。在chrome中安装AMP Validator插件，当你的页面是完全符合AMP规范的时候，chrome validator AMP按钮会呈现绿色。如下图：
![image](https://user-images.githubusercontent.com/5029635/37567101-f17cd30c-2afc-11e8-9080-88711f033db8.png)

在页面link中配置amphtml和canonical,将原始页面和AMP页面进行绑定。

*******添加图片，待补充*****

## 我们踩过的坑儿

AMP有不少限制要求，开发中难免碰到不好解决的问题。以下对我们碰到过的问题及解决方法进行分享。

1. AMP对表达式复杂度有限制要求，最大值是50。复杂度50是什么概念呢，比如以下例子，只有纯粹的字符串连接，但是以下复杂度已经接近是46，如果再增加一个连接，会达到53的复杂度，控制台会直接报错：
```HTML
<a href='<%- searchData.defaultSearchUrl %>'
  [href]='"/m/hotels/" + location.concatResult
    + "/?checkin=" + date.selectedStartDate
    + "&checkout=" + date.selectedEndDate
    + "&starID=" + activeStarKeys.keys
    + "&adult=" + guestsSelectResult.adultsNum
    + "&children=" + guestsSelectResult.childNum
    + "&ages=" + guestsSelectResult.childAges'>
```
![image](https://user-images.githubusercontent.com/5029635/37567104-fa18ddf8-2afc-11e8-866a-427f7f9c08c4.png)

除非AMP放开复杂度限制，否则我们能做的只能是尽量提前运算，当需要某个计算结果的时候，可以直接使用。比如例子中，location.concatResult就是在location组件内部先进行concat，再将concat的结果拼接到href。此外，可以尽量简化交互，减少参数。

此问题在AMP开发中势必会碰到，详细讨论可以看[ISSUES-11434](https://github.com/ampproject/amphtml/issues/11434)

2. AMP限制编写JavaScript，也就不允许我们读写cookie、localstorage，但是记录用户行为是很重要的事情，比如一些表单信息，用户的选择，等用户下次打开我们的页面时，能够显示用户上一次的状态。我们的解决方法是通过http set-cookie方式解决前端无法记录cookie的问题。

3. AMP form只能提交ajax post请求，无法做到以post表单形式跳转。所以在开发过程中尽量避免出现post表单形式的请求，一般改用ajax post加页面跳转的形式来提交；在迫不得已的情况下，可以考虑通过增加非amp的中间路由，在中间页中构造表单并自动提交数据。

4. AMP CROS：用户最终访问的是AMP Cache，在AMP launch新版本之前，命中AMP Cache，页面地址并非是真实地址而是google amp cache地址，如果页面上有额外的异步请求，就会有跨域限制，所以我们要在服务端开启跨域，返回头设置AMP-Access-Control-Allow-Source-Origin。

5. amp-iframe有sandbox属性，用来指定iframe内部的站点权限，默认值为空。如果希望iframe内部可以执行js脚本，则需要设置成"allow-scripts"；如果需要添加内部发送同域请求的权限，则需要设置成"allow-scripts allow-same-origin"；但如果amp-iframe的src是同域站点，那么sandbox属性必须不能包含allow-same-origin，这样做杜绝了脱离amp控件发送请求的可能性。

6. amp下统计页面埋点必须基于[amp自带的统计控件](https://www.ampproject.org/docs/ads_analytics/analytics-vendors)，目前amp封装了市面上大部分的第三方统计系统。但是由于公司内部的统计工具没有amp对应的控件，所以无法接入。


## 如何优化AMP SEO页面

### 最大化提速

通过对非SEO数据异步化加载，让AMP更快。

### amp-install-serviceworker，让你打开的不仅仅是一个amp页面

AMP SEO页面作为搜索排名优化页面的同时，还兼具引流功能。虽然AMP页面能让用户从搜索结果中最快速地到达我们的landing页面，但是只有用户最终从landing页又回到原始页面走完必要的业务流程，才是有效的转化。例如，在我们的业务中，用户可以通过搜索引擎快速到达酒店列表、酒店详情的AMP页面，但只有从酒店详情AMP页面跳转到支付页（非AMP），并完成支付，才算转换成功。如果原始页面体验不好，用户依旧可能中途流失。这似乎不是AMP的"错"，但AMP确实还能再做些什么。

通过amp-install-serviceworker安装原始站点的sw.js，提前加载好原始页面的资源，当用户从AMP页面跳出，进入原始主站的时候，让主站体验更好，从而提高转化。

******添加图片，待补充******


## [eamp](https://github.com/Jade05/eamp)框架，让开发AMP项目更简单

eamp是从我们AMP SEO项目中提取出来的简化版框架，能够让我们快速开启AMP Node项目，使用者无需从0开始搭建，更能专注amp页面开发。

特点：
1. 快速搭建基于node的AMP项目
2. 内置自动化上线打包工具，自动将css打包内联，符合AMP规范
3. 目录结构清晰，职责划分清楚，便于多人团队开发


## 推荐资料
### [AMP官网](https://www.ampproject.org/)
### [ampproject github](https://github.com/ampproject/amphtml)
