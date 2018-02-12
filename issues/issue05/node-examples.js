const fs = require('fs')

// example1:
// setTimeout(() => {
//   console.log(1);
// }, 0);
// setImmediate(() => {
//  console.log(2);
// });

// // example2:
// fs.readFile('./issue05.md', () => {
//   setTimeout(() => {
//     console.log('timeout')
//   }, 0)
//   setImmediate(() => {
//     console.log('immediate')
//   })
// })

// example3:
setTimeout(function() {
  console.log(1)
}, 0);
setImmediate(() => {
  console.log(2)
})
process.nextTick(() => {
  console.log(3)
})
new Promise(function executor(resolve) {
  console.log(4)
  // for( var i=0 ; i<10000 ; i++ ) {
  //   i === 9999 && resolve('I am resolved');
  // }
  console.log(5)
  process.nextTick(() => {
    console.log(6)
  })

  // fs.readFile('./issue05.md', (err, data) => {
  //   resolve('I am resolved')
  // })

  setTimeout(() => {
    resolve('I am resolved')
  })

  // setTimeout(() => {
  //   console.log(10)
  //   resolve('I am resolved')
  //   process.nextTick(() => {
  //     console.log(11)
  //   })
  // })
}).then(function(data) {   // promise的then回调发生在什么时候
  console.log(7)
  console.log(data)
});

console.log(8);
