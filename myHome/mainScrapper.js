const {URL} = require('url');
const Log = require('../config/logger').logger('MainScrapper.js');
const urlBuilder = require('./urlBuilder');
const scrapper = require('./scrapper/scrapper');
const {findDuplicates} = require('./duplicateDetector');
const mongoose = require('mongoose');
const util = require('./utils');

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
            id, finished: (i + 1), totalPages: maxPages, totalProperties: count
        });
        const source = util.getSource(url);
        Log.info(`Got ${result.length} homes`);
        result = await checkExisting(result, source);
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
        return await scrapper.scrapList(url.toString(), browserPool)
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
                scrapper.scrapProperty(home, browserPool)
                    .then(saveToDb)
                    .catch(() => {
                        Log.error(`unable to scrap ${home.url}`);
                    });
            } else {
                eventEmitter.emit(defaultUrlToScrap, {home, stats: home?.stats})
            }
        }
    }
}

async function saveToDb(home) {
    try {
        let stats = await getStats(home);
        if (home.price > 0 && stats && stats.propertiesTotal > 10) {
            home.label = getLabel(stats, home);
        }
        home.source = util.getSource(home.url);
        const {
            duplicateHomes: duplicateIds,
            originalId,
            _id: mainHomeId
        } = await findDuplicates(home);
        let savedHome;
        if (duplicateIds.length > 0) {
            if (originalId === home.originalId) {
                home.duplicates = duplicateIds?.length ?? 0;
                savedHome = await new Home(home).save();
                await Home.updateMany({_id: {$in: duplicateIds}}, {duplicateOf: savedHome._id}).exec();
            } else {
                home.duplicateOf = mainHomeId;
                savedHome = await new Home(home).save();
                duplicateIds.push(savedHome._id);
                await Home.updateMany({_id: {$in: duplicateIds}}, {duplicateOf: mainHomeId}).exec();
                await Home.updateMany({_id: mainHomeId}, {duplicates: duplicateIds?.length ?? 0}).exec();
            }
        } else {
            savedHome = await new Home(home).save();
            if (home.price > 0) {
                stats = await updateStats(savedHome);
            }
        }
        eventEmitter.emit(defaultUrlToScrap, {savedHome, stats});
        Log.info(`Home Saved ${home.url}`);
    } catch (err) {
        Log.error(err.toString());
        Log.trace(err.stack);
        Log.info(`Home Exists In DB ${home.url}`);
    }

    return home;
}

async function checkExisting(result, source) {
    const originalIds = result.map(home => home.originalId);
    let existingHomes = await Home.find({
        $and: [
            {originalId: {$in: originalIds}},
            {source: source}
        ]
    })
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
            const existing = existingHomes.find(existingHome => existingHome.originalId === home.originalId)
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
    try {
        if (!stats && stats.averageM2Price) {
            return null;
        }
        const percentage = home.m2Price / stats.averageM2Price;
        return Math.round(percentage / LABEL_STEP);
    } catch (err) {
        Log.error('ამან მოკლა ამან')
        console.log(err);
    }
}

module.exports.toDb = saveToDb;