const mongoose = require('mongoose');
require("dotenv").config();
require('./config/database').connect();
require('./model/home');
require('./model/statistics');
require('./model/scrap');
const scrapper = require('./myHome/scrapper/scrapper');
const BrowserPool = require('./browser/browserPool');
const EventEmitter = require('events');


const eventEmitter = new EventEmitter();
const {
    MY_HOME_URL, BATCH_SIZE
} = process.env;

const browserPool = new BrowserPool({size: BATCH_SIZE, headless: true, handleSIGINT: false});
global.myHome = {
    eventEmitter, browserPool, defaultUrlToScrap: MY_HOME_URL,
}
const mainScrapper = require('./myHome/mainScrapper');


const url = `https://ss.ge/ka/udzravi-qoneba/iyideba-3-otaxiani-bina-saburtaloze-6017807`;

const Home = mongoose.model('Home');


async function test() {
    const home = await scrapper.scrapProperty({url}, browserPool)
    await mainScrapper.toDb(home);

}
//
// test().then((values) => {
//         console.log('done');
//     }
// );
Home.deleteMany({source: 'SS'}).exec().then(() => {
    console.log('done');
});