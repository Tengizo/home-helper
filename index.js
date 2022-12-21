const mongoose = require('mongoose');
require("dotenv").config();
require('./config/database').connect();
require('./model/home');
require('./model/statistics');
require('./model/scrap');
const BrowserPool = require('./browser/browserPool');
const EventEmitter = require('events');
const Log = require('./config/logger').logger('index.js');


const eventEmitter = new EventEmitter();
const {
    MY_HOME_URL, BATCH_SIZE, START_PAGE, TOTAL_PAGES
} = process.env;

const browserPool = new BrowserPool({size: BATCH_SIZE, headless: true, handleSIGINT: false});
global.myHome = {
    eventEmitter, browserPool, defaultUrlToScrap: MY_HOME_URL,
}

const myHomeScrapper = require('./myHome/myHomeScrapper');
const Scrap = mongoose.model('Scrap');
let status = 0;

async function checkScrapRequests() {
    if (status === 1) {
        return
    }
    let scrapRequests = await Scrap.find({status: 'RUNNING'}).sort({createDate: 'asc'}).limit(1);
    if (scrapRequests.length === 0) {
        scrapRequests = await Scrap.find({status: 'NEW'}).sort({createDate: 'asc'}).limit(1);
    }
    if (scrapRequests.length > 0) {
        const scrapRequest = scrapRequests[0];
        await Scrap.findOneAndUpdate({_id: scrapRequest._id}, {status: 'RUNNING'}).exec();
        try {
            status = 1;
            const startTime = Date.now();
            let alreadyScrapped = scrapRequest.scrappedPages ? scrapRequest.scrappedPages : 0;
            Log.info(`Scraping ${scrapRequest.url} from page ${scrapRequest.startPage} to page ${scrapRequest.totalPages}`);
            const totalProperties = await
                myHomeScrapper.scrap({
                    id: scrapRequest._id,
                    scrapped: alreadyScrapped,
                    totalProperties: scrapRequest.totalProperties,
                    urlToScrap: scrapRequest.url,
                    maxPages: Number.parseInt(scrapRequest.totalPages),
                    startPage: Number.parseInt(scrapRequest.startPage)
                });

            const endTime = Date.now();
            await Scrap.findOneAndUpdate({_id: scrapRequest._id}, {
                status: 'SUCCESS',
                scrappedPages: scrapRequest.totalPages,
                totalProperties,
                timeTaken: endTime - startTime,
                endDate: endTime
            }).exec();
            Log.info(`Scrapping Finished successfully for ${scrapRequest.url}`);
        } catch (err) {
            Log.error(`Error while scraping ${scrapRequest.url}`, err);
            await Scrap.findOneAndUpdate({_id: scrapRequest._id}, {
                status: 'FAILED', failedMessage: err.message
            }).exec();
        } finally {
            status = 0;
        }
    }
}

eventEmitter.on('PAGE_SCRAPPED', async (message) => {
    Log.info(message);
    await Scrap.findOneAndUpdate({_id: message.id}, {
        scrappedPages: message.finished, totalProperties: message.totalProperties
    }).exec();
    Log.info(`Scrapped ${message.finished} pages out of ${message.totalPages}`);

});
setInterval(checkScrapRequests, 5000);


