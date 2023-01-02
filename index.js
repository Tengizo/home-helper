const mongoose = require('mongoose');
require("dotenv").config();
require('./config/database').connect();
require('./model/home');
require('./model/statistics');
require('./model/scrap');
const cron = require('node-cron');
const BrowserPool = require('./browser/browserPool');
const EventEmitter = require('events');
const Log = require('./config/logger').logger('index.js');


const eventEmitter = new EventEmitter();
const {
    MY_HOME_URL, BATCH_SIZE
} = process.env;

const browserPool = new BrowserPool({size: BATCH_SIZE, headless: true, handleSIGINT: false});
global.myHome = {
    eventEmitter, browserPool, defaultUrlToScrap: MY_HOME_URL,
}

const myHomeScrapper = require('./myHome/mainScrapper');
const Queue = require('./browser/queue');
const Scrap = mongoose.model('Scrap');
const scrapRequestQueue = new Queue();
let status = 0;
let firstTime = true;
const cronJobs = {};

async function checkScrapRequests() {
    let runningScrapRequests = [];
    if (firstTime) {
        runningScrapRequests = await Scrap
            .find({$and: [{status: 'RUNNING'}]})
            .sort({createDate: 'asc'});
        firstTime = false;
    }
    let newScrapRequests = await Scrap.find({$and: [{status: 'NEW'}, {type: {$ne: 'CRON'}}]}).sort({createDate: 'asc'}).limit(1);
    let cronScrapRequests = await Scrap.find({$and: [{type: 'CRON'}, {started: false}]}).sort({createDate: 'asc'}).limit(1);
    if (runningScrapRequests.length !== 0 || newScrapRequests.length !== 0) {
        Log.info(`Added ${runningScrapRequests.length} RUNNING scrap requests to queue`);
        Log.info(`Added ${newScrapRequests.length} NEW scrap requests to queue`);
        scrapRequestQueue.enqueue(...runningScrapRequests, ...newScrapRequests);
    }
    await startCronJobs(cronScrapRequests);
}

async function startCronJobs(scrapRequests) {
    for (const scrapRequest of scrapRequests) {
        if (scrapRequest.cron) {
            const valid = cron.validate(scrapRequest.cron);
            if (!valid) {
                await Scrap.findOneAndUpdate({_id: scrapRequest._id}, {type: 'INVALID-CRON'}).exec();
                continue;
            }
            const cronJob = cron.schedule(scrapRequest.cron, () => {
                scrapRequestQueue.enqueue(scrapRequest);
                Log.info(`Added cron job ${scrapRequest.uuid} to queue`);
            });
            cronJob.start();
            await Scrap.findOneAndUpdate({_id: scrapRequest._id}, {started: true}).exec();
            cronJobs[scrapRequest.uuid] = cronJob;
            Log.info(`Cron job started for ${scrapRequest.uuid}`);
        }
    }
}


async function runScrapRequest() {
    Log.info(`Checking for scrap requests: got ${scrapRequestQueue.length} requests in queue`);
    const scrapRequest = await scrapRequestQueue.dequeueAsync();
    Log.info('Got Scrap request');
    if (!scrapRequest.type === 'CRON') {
        await Scrap.findOneAndUpdate({_id: scrapRequest._id}, {status: 'RUNNING', started: true}).exec();
    }
    await Scrap.findOneAndUpdate({_id: scrapRequest._id}, {status: 'RUNNING'}).exec();
    try {
        status = 1;
        const startTime = Date.now();
        let alreadyScrapped = scrapRequest.scrappedPages && scrapRequest.type !== 'CRON' ? scrapRequest.scrappedPages : 0;

        Log.info(`Scraping ${scrapRequest.url} from page ${scrapRequest.startPage} to page ${scrapRequest.totalPages}`);
        const totalProperties = await myHomeScrapper.scrap({
            id: scrapRequest._id,
            scrapped: alreadyScrapped,
            totalProperties: scrapRequest.totalProperties,
            urlToScrap: scrapRequest.url,
            maxPages: Number.parseInt(scrapRequest.totalPages),
            startPage: Number.parseInt(scrapRequest.startPage)
        });

        const endTime = Date.now();
        let update = {
            status: 'SUCCESS',
            scrappedPages: scrapRequest.totalPages,
            totalProperties,
            timeTaken: endTime - startTime,
            endDate: endTime
        };
        await Scrap.findOneAndUpdate({_id: scrapRequest._id}, update).exec();
        Log.info(`Scrapping Finished successfully for ${scrapRequest.url}`);
    } catch (err) {
        Log.error(`Error while scraping ${scrapRequest.url}`, err);
        let update = {
            status: 'FAILED', failedMessage: err.message,
        }
        await Scrap.findOneAndUpdate({_id: scrapRequest._id}, update).exec();
    } finally {
        status = 0;
    }
}

eventEmitter.on('PAGE_SCRAPPED', async (message) => {
    Log.info(message);
    await Scrap.findOneAndUpdate({_id: message.id}, {
        scrappedPages: message.finished, totalProperties: message.totalProperties
    }).exec();
    Log.info(`Scrapped ${message.finished} pages out of ${message.totalPages}`);

});


async function start() {
    while (true) {
        await runScrapRequest();
    }
}

async function cleanup() {
    Log.info('Cleaning up');
    await Scrap.updateMany({type: 'CRON'}, {started: false}).exec();
    Log.info('Cleaning up done');
    process.exit(0);
}

process.on('exit', cleanup);
process.on('SIGINT', cleanup);
setInterval(checkScrapRequests, 5000);
start().then(() => {
    Log.info('Started');
});
