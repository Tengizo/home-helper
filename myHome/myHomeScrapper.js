const {URL} = require('url');
const Log = require('../config/logger').logger('myHomeScrapper.js');
const urlBuilder = require('./urlBuilder');
const listScrapper = require('./scrapper/listScrapper');
const propertyScrapper = require('./scrapper/propertyScrapper');
const mongoose = require('mongoose');

const {
    eventEmitter, browserPool, defaultUrlToScrap
} = myHome;
let {LABEL_STEP} = process.env;
LABEL_STEP = Number.parseFloat(LABEL_STEP);

const Home = mongoose.model('Home');
const Stats = mongoose.model('Stats');


module.exports.scrap = async function ({
                                           id,
                                           scrapped = 0,
                                           totalProperties = 0,
                                           urlToScrap = defaultUrlToScrap,
                                           maxPages = 10,
                                           startPage = 1
                                       }) {
    let url = new URL(urlToScrap);
    let count = totalProperties;

    for (let i = scrapped; i < maxPages; i++) {
        console.time('Paged scrapped');
        url.searchParams.set(urlBuilder.URL_VALUES.page, (i + startPage).toString());
        Log.info(`Scraping page ${url.href}`);
        let result = await scrapPage(url.toString());
        eventEmitter.emit('PAGE_SCRAPPED', {
            id,
            finished: (i + 1),
            totalPages: maxPages,
            totalProperties: count
        });
        Log.info(`Got ${result.length} homes`);
        result = await checkExisting(result);
        getHomes(result);
        Log.info(`Page ${i + startPage} done`);
        const newHomeCount = result.filter(home => !home.exists)?.length
        count += newHomeCount;
        console.timeEnd('Paged scrapped');
    }
    return count;
}

async function scrapPage(url, times = 0) {
    try {
        return await listScrapper.scrap(url.toString(), browserPool)
    } catch (err) {
        Log.error(`Error while scraping page ${url}`);
        console.error(err);
        if (times < 3) {
            Log.error(`Retrying to fetch ${url}`);
            return scrapPage(url, times + 1);
        }
    }
    Log.info(`Unable to scrap ${url}`);
    return [];
}


function getHomes(homes) {
    for (let i = 0; i < homes.length; i++) {
        const home = homes[i];
        if (home) {
            if (!home.exists) {
                propertyScrapper.scrap(home, browserPool)
                    .then(saveToDb)
                    .catch(err => {
                        Log.error(`unable to scrap ${home.url}`);
                    });
            } else {
                eventEmitter.emit(defaultUrlToScrap, {home, stats: home?.stats})
            }
        }
    }
}

function getStatus(title) {
    if (title.includes('ახალი')) {
        return 'NEW';
    } else if (title.includes('ძველი')) {
        return 'OLD';
    } else if (title.includes('მშენებარე')) {
        return 'CONSTRUCTION';
    }
    return 'UNKNOWN';
}

function getRegion(title) {
    let start = title.indexOf('ბინა');
    if (start === -1) {
        return '';
    } else {
        start += 4;
    }
    return title.substring(start)?.trim();
}

async function saveToDb(home) {
    try {
        home.m2Price = home.price / home.area;
        home.buildingStatus = getStatus(home.title);
        home.region = getRegion(home.title);
        let stats = await getStats(home);
        if (stats && stats.propertiesTotal > 10) {
            home.label = getLabel(stats, home);
        }
        await Home.findOne({url: home.url});
        await new Home(home).save();
        stats = await updateStats(home);
        eventEmitter.emit(defaultUrlToScrap, {home, stats});
        Log.info(`Home Saved ${home.url}`);
    } catch (err) {
        Log.error(err.toString());
        Log.info(`Home Exists In DB ${home.url}`);
    }

    return home;
}

async function checkExisting(result) {
    const urls = result.map(home => home.url);
    let existingHomes = await Home.find({url: {$in: urls}})
    existingHomes = await Promise.all(existingHomes.map(async (doc) => {
        const home = doc._doc;
        home.stats = await getStats(home);
        return home;
    }));
    for (const existingHome of existingHomes) {
        existingHome.label = getLabel(existingHome.stats, existingHome);
        if (!existingHome.label) {
            updateHomeLabel(existingHome).then(() => {
                Log.info(`Updated home label ${existingHome.url}`)
            });
        }
    }
    if (existingHomes.length > 0) {
        Log.info(`Found ${existingHomes.length} existing homes`);
        return result.map(home => {
            const existing = existingHomes.find(existingHome => existingHome.url === home.url)
            if (existing) {
                existing.exists = true;
                return existing;
            }
            return home;
        });
    }
    return result;
}

async function getStats(home) {
    let name = home.status + home.region + home.buildingStatus;
    name = name.replace(/\s/g, '');
    return (await Stats.findOne({name}))?._doc;
}

async function updateHomeLabel(home) {
    return Home.findOneAndUpdate({_id: home.id}, {label: home.label}, {new: true});
}

async function updateStats(home) {
    let name = home.status + home.region + home.buildingStatus;
    name = name.replace(/\s/g, '');
    let stats = await Stats.findOne({name})
    if (!stats) {
        stats = {
            name: name,
            averageM2Price: home.m2Price,
            averagePrice: home.price,
            propertiesTotal: 1,
            region: home.region,
            status: home.status
        }
    } else {
        let newstats = {};
        newstats.propertiesTotal = stats.propertiesTotal + 1;
        newstats.averageM2Price = (stats.averageM2Price * stats.propertiesTotal + home.m2Price) / (stats.propertiesTotal + 1);
        newstats.averagePrice = (stats.averagePrice * stats.propertiesTotal + home.price) / (stats.propertiesTotal + 1);
        stats = newstats;
    }
    return Stats.findOneAndUpdate({name}, stats, {upsert: true, new: true});
}


function getLabel(stats, home) {
    if (!stats) {
        return null;
    }
    const percentage = home.m2Price / stats.averageM2Price;
    return Math.round(percentage / LABEL_STEP);
}