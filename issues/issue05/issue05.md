## Promise相关分享

### Promise/a+
ES6采用的规范

-> promise是什么:
promise === 异步？
The Promise object represents the eventual completion (or failure) of an asynchronous operation, and its resulting value.

-> 为什么会有promise
browser js还是nodejs 最重要的最难的就是异步。
重要？（单线程）
难？（调试 编程复杂（callback hell）异步任务也要反馈信息的）
追根溯源是为了解决异步编程难的而出现的一个对对象。Promise !== 异步
异步task：不关心过程、只关心最后的状态

-> promise规范是什么
https://promisesaplus.com/

比较有意思的
> then must return a promise [3.3].
promise2 = promise1.then(onFulfilled, onRejected);

1. If either onFulfilled or onRejected returns a value x, run the Promise Resolution Procedure [[Resolve]](promise2, x).
2. If either onFulfilled or onRejected throws an exception e, promise2 must be rejected with e as the reason.
3. If onFulfilled is not a function and promise1 is fulfilled, promise2 must be fulfilled with the same value as promise1.
4. If onRejected is not a function and promise1 is rejected, promise2 must be rejected with the same reason as promise1.

Promise Resolution Procedure！！！
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
}).then(data => {
  console.log(data)
})
```
以上是最常见的表现。具体还分return value的value具体是什么

Promise所有知识点都讲完了。Promise规范和node的事件机制、Promise规范和浏览器机制，是怎么样子的。
> Here “platform code” means engine, environment, and promise implementation code. In practice, this requirement ensures that onFulfilled and onRejected execute asynchronously, after the event loop turn in which then is called, and with a fresh stack. This can be implemented with either a “macro-task” mechanism such as setTimeout or setImmediate, or with a “micro-task” mechanism such as MutationObserver or process.nextTick. Since the promise implementation is considered platform code, it may itself contain a task-scheduling queue or “trampoline” in which the handlers are called.

### 浏览器端

先看一下例子browser-example.js
https://codepen.io/Jade05/pen/QQpJjm
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
os chrome64.0.3282.119 测试结果是：
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

参考文章： https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/

和文章结果不太一样，猜测高版本浏览器比较统一了：

在各个浏览器中执行顺序是不一样的，这是肯定，因为每个浏览器甚至同一个浏览器的不同版本，执行结果也是不一样的，本质原因是每个浏览器对各种异步任务是划分策略是不一样的。到底谁对谁错，不好说。

于是我测了几个高版本，却出现了一致的情况，promise then异步回调先于setTimeout。也就是说，现在浏览器厂商觉得这样处理策略是正确。这个策略是什么呢？

概念：
Microtasks：每一次task开始之前都会执行Microttasks。

高级浏览器都把promise then回调作为一个Microtask了。setTimeout是Macrotasks。

浏览器实现策略一直在调整。不再探索。有兴趣的可以自己去测。

#### 主流浏览器之间对规范实现差异程度：
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise

见图：browser_compatibility

### node端 - event-loop
先看下例子node-example.js

结论：
then async fun 的执行顺序：

promise then 异步函数也是一个是在每个phase开始之前就要执行，但是在process.nextTick之后。


es6 promise实现：
参考： https://zhuanlan.zhihu.com/p/25178630

#### 同为node端，异步知识还有哪些以及比较
async  await generator
