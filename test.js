const BrowserPool = require('./browser/browserPool');
const Log = require('./config/logger').logger('test.js');

const browserPool = new BrowserPool({size: 5, headless: true, handleSIGINT: false});


async function doWork(num) {
    const browser = await browserPool.getBrowser();
    Log.info(`browser ${num} aquired: ${browser.uuid}`);
    setTimeout(() => {
        browser.close();
    }, 3000);
}

console.time('test');
let promises = [];
for (let i = 0; i < 20; i++) {
    promises.push(doWork(i));
}


Promise.all([promises]).then(() => {
    console.log('done');
});
console.timeEnd('test');
//
//
// async function test() {
//     console.time('test');
//     let arr = [1, 2, 3, 4, 5, 6, 7, 8];
//     let newArr = [];
//     for (const n of arr) {
//         if (await isEven(n)) {
//             newArr.push(n);
//         }
//     }
//     console.log(newArr);
//     console.timeEnd('test');
// }
//
//
// async function test2() {
//     console.time('test2');
//     let arr = [1, 2, 3, 4, 5, 6, 7, 8];
//     let newArr = [];
//     let promises = arr.map(async (n) => {
//         if (await isEven(n)) {
//             newArr.push(n);
//         }
//     });
//     await Promise.all(promises);
//
//     console.log(newArr);
//     console.timeEnd('test2');
// }
//
// function isEven(n) {
//     return new Promise((resolve, reject) => {
//         setTimeout(() => {
//             resolve(n % 2 === 0)
//         }, 1000);
//     });
// }
//
// test();
// test2()