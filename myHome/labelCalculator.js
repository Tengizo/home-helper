const mongoose = require('mongoose');
const Log = require('../config/logger').logger('myHomeScrapper.js');

let {LABEL_STEP} = process.env;
LABEL_STEP = Number.parseFloat(LABEL_STEP);

const Home = mongoose.model('Home');
const Stats = mongoose.model('Stats');
const batchSize = 100;
const statsMap = new Map();

module.exports.updateLabels = async function () {
    const count = await Home.find({}).sort({date: 'desc'}).count()
    for (let i = 0; i < (count / batchSize) + 1; i++) {
        const homes = await Home.find({}).sort({date: 'desc'}).skip(i * batchSize).limit(batchSize);
        for (const home of homes) {
            const stats = await getStats(home);
            home.label = getLabel(stats, home);
            await updateHomeLabel(home);
        }
        Log.info(`Updated From ${i * batchSize} to ${i * batchSize + batchSize} homes`);
    }
    Log.info(`Updated ${count} homes`);
    process.exit(0);
};


async function getStats(home) {
    let name = home.status + home.region + home.buildingStatus;
    if (statsMap.has(name)) {
        return statsMap.get(name);
    }
    name = name.replace(/\s/g, '');
    return (await Stats.findOne({name}))?._doc;
}

function getLabel(stats, home) {
    const percentage = home.m2Price / stats.averageM2Price;
    return Math.round(percentage / LABEL_STEP);
}

async function updateHomeLabel(home) {
    return Home.findOneAndUpdate({_id: home.id}, {label: home.label}, {new: true});
}