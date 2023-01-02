const Log = require('../config/logger').logger('myHomeScrapper.js');
const fs = require('fs');
const path = require('path');
const nodeUtils = require('util')
const mongoose = require('mongoose');



const {
    eventEmitter, defaultUrlToScrap
} = myHome;


const fullPath = path.join(__dirname, '../', 'results');


Log.info(`Registered listener for ${defaultUrlToScrap}`);
eventEmitter.on(defaultUrlToScrap, async (message) => {
    Log.debug(`Got message from ${defaultUrlToScrap}`);
    try {
        await filter(message);
    } catch (e) {
        Log.error(`error while filtering ${e}`);
    }

});


async function filter(message) {
    const {stats, home} = message;
    const label = getLabel(stats, home);
    if (stats.propertiesTotal > 10 && (label <= 16)) {
        Log.info(`Found Matching home ${home.url}`);
        try {
            await saveToFile(home, stats, label)
        } catch (e) {
            Log.error(`Error while saving home ${e}`);
        }
    } else {
        Log.debug(`Found Not Matching home ${home.url}`);
    }
}
//
// function filterByKeyword(keywords, home) {
//     for (const keyword of keywords) {
//         if (home.description.includes(keyword)) {
//             return true;
//         }
//     }
//     return false;
// }

// function isDuplicate(home) {
//     HomeModel.find({originalId: home.originalId}).then((result) => {
// }

function getLabel(stats, home) {
    const percentage = home.m2Price / stats.averageM2Price;
    return Math.round(percentage / 0.05);
}

const fileExists = nodeUtils.promisify(fs.exists);
const mkdir = nodeUtils.promisify(fs.mkdir);
const writeFile = nodeUtils.promisify(fs.writeFile);

async function saveToFile(home, stats, label) {
    const data = {url: home.url, price: home.price, m2Price: home.m2Price, title: home.title, stats: stats};
    const labelPath = path.join(fullPath, label.toString());
    if (!await fileExists(labelPath)) {
        await mkdir(labelPath);
    }
    const filePath = path.join(labelPath, `/${home.originalId}.json`);
    await writeFile(filePath, JSON.stringify(data));
    Log.info(`Saved home with label: ${label} to ${filePath}`);
}

