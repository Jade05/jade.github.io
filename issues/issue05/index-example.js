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
