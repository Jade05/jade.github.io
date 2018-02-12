## Promise相关分享

### 简单介绍 Promise

#### promise是什么:
promise === 异步？
The Promise object represents the eventual completion (or failure) of an asynchronous operation, and its resulting value.

#### 为什么会有promise
browserjs还是nodejs 最重要的最难的就是异步。
重要？（单线程避免阻塞）
难？（调试 编程复杂（callback hell）异步任务也要反馈信息的）
追根溯源是为了解决异步编程难的而出现的一个对对象。
异步task：不关心过程、只关心最后的状态

#### ES6 将promise写进了语言标准
promise规范： promise/A promise/B promise/A+

ES6 promise则是以 promise A+规范(https://promisesaplus.com/)实现的：
ES promise的源码： https://github.com/then/promise

#### promise A+ 规范是怎样子的：https://promisesaplus.com/


vs promise/A有什么不同https://promisesaplus.com/differences-from-promises-a


简单来说：
1. 三个状态： pending, fulfilled, or rejected.
2. then method, promise.then(onFulfilled, onRejected)
....


比较有意思的有以下三点：
1. 2.2.4规范提到的这么一句话：onFulfilled or onRejected must not be called until the execution context stack contains only platform code. [3.1].——这个规范很重要，等下再说

Here “platform code” means engine, environment, and promise implementation code. In practice, this requirement ensures that onFulfilled and onRejected execute asynchronously, after the event loop turn in which then is called, and with a fresh stack. This can be implemented with either a “macro-task” mechanism such as setTimeout or setImmediate, or with a “micro-task” mechanism such as MutationObserver or process.nextTick. Since the promise implementation is considered platform code, it may itself contain a task-scheduling queue or “trampoline” in which the handlers are called.

2. 2.2.7 规范： then must return a promise
promise2 = promise1.then(onFulfilled, onRejected);

1. If either onFulfilled or onRejected returns a value x, run the Promise Resolution Procedure [[Resolve]](promise2, x).
2. If either onFulfilled or onRejected throws an exception e, promise2 must be rejected with e as the reason.
3. If onFulfilled is not a function and promise1 is fulfilled, promise2 must be fulfilled with the same value as promise1.
4. If onRejected is not a function and promise1 is rejected, promise2 must be rejected with the same reason as promise1.

es6 promise catch行为依据
```javascript
new Promise(function(resolve, reject) {
  resolve(1)
}).then(function() {
  console.log('resolve')
}, function() {
  console.log('reject')
}).catch(function(e) {
  console.log('catch error')
})
```

3. 2.3 规范：Promise Resolution Procedure

表现行为：
```javascript
// Promise Resolution Procedure
const promise1 = new Promise((resolve, reject) => {
  const data = {
    text: 'hello world'
  }
  resolve(data)
})

promise1.then((data) => {
  console.log(data)
  return data.text
}).then(data => {     // Promise Resolution Procedure及相当于运行 [[Resolve]](promise, y)
  console.log(data)
})
```

以上是最常见的表现。具体还分return value的value具体是什么。

Promise所有知识点都讲完了。Promise规范和node的事件机制、Promise规范和浏览器机制，是怎么样子的。

### 浏览器端

这个例子采自这篇文章：https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/

```javascript
setTimeout(() => {
  console.log(1);
}, 0);

Promise.resolve().then(() => {
  console.log(2);
}).then(() => {
  console.log(3);
});

console.log(4);
```
文章里头的测试结果：
Microsoft Edge, Firefox 40, iOS Safari and desktop Safari 8.0.8 log setTimeout before promise1 and promise2 - although it appears to be a race condition. 

Firefox 40, iOS Safari and desktop Safari 8.0.8 ，

以上结论应该是意料之中的，每个浏览器对各种异步任务是划分策略是不一样的。

https://codepen.io/Jade05/pen/QQpJjm
于是我测了几个高版本，却出现了一致的情况。promise then异步回调先于setTimeout。也就是说，现在浏览器厂商觉得这样处理策略是正确。这个策略是什么呢？ Microtasks：每一次task开始之前都会执行Microttasks。高级浏览器都把promise then回调作为一个Microtask了。setTimeout是Macrotasks。

测试结果是：
os chrome64.0.3282.119：
"script start"
"script end"
"promise1"
"promise2"
"setTimeout"

os firefox 53.0.3
"script start"
"script end"
"promise1"
"promise2"
"setTimeout"

os safari 11.0.3
"script start"
"script end"
"promise1"
"promise2"
"setTimeout"

浏览器实现策略一直在调整，不再探索。有兴趣的可以自己去测。

### node端 - event-loop
先看下例子node-example.js

结论：
then async fun 的执行顺序：

表现出来的现象：
promise then 异步函数如果已经resolved也是一个是在每个phase开始之前就要执行，但是在process.nextTick之后。

node各个phase已经执行什么我们基本清楚了，比如timer settimeout,checker setImmediate, 每个phase结束下个phase开始之前都会执行nextTick。node 是怎么处理promise async回调的呢？

还是要回到promise A+规范中找答案：https://promisesaplus.com/
为什么会这样呢：
onFulfilled or onRejected must not be called until the execution context stack contains only platform code. [3.1].

platform code:
Here “platform code” means engine, environment, and promise implementation code. In practice, this requirement ensures that onFulfilled and onRejected execute asynchronously, after the event loop turn in which then is called, and with a fresh stack. This can be implemented with either a “macro-task” mechanism such as setTimeout or setImmediate, or with a “micro-task” mechanism such as MutationObserver or process.nextTick. Since the promise implementation is considered platform code, it may itself contain a task-scheduling queue or “trampoline” in which the handlers are called.

其实解读完规范，并没有解决这个问题：到底什么时候应该执行promise then的异步回调？

node v8的测试代码：
https://github.com/nodejs/node/search?utf8=%E2%9C%93&q=MicrotaskQueue&type=

verifyExecutionOrder unitTest:
```javascript
  // Processing of the MicrotaskQueue is manually handled by node. They are not
  // processed until after the nextTickQueue has been processed.
  Promise.resolve(1).then(common.mustCall(function() {
    results.push(7);
  }));
```

所以在node端promise then async fun是一个Microtask,每个phase结束后会先遍历nextTick queue,然后会遍历完Microtask queue,Microtask有可能会产生nextTick，所以当Microtasktask queue执行完毕后都会检查nextTick queue。然后才会进入下一个phase。

以下这篇文章里头的执行图比之前的流程图可能更清晰： https://jsblog.insiderattack.net/promises-next-ticks-and-immediates-nodejs-event-loop-part-3-9226cbe7a6aa

#### 同为node端，异步知识还有哪些以及比较
async/await generator

#### promise源码分析： 
https://www.promisejs.org/implementing/
https://v8docs.nodesource.com/node-9.3/d3/d8f/classv8_1_1_promise.html
https://github.com/then/promise