const Log = require('../config/logger').logger('myHomeScrapper.js');
const mongoose = require('mongoose');
const {isOwner} = require('./utils');

const HomeModel = mongoose.model('Home');

const fixAllOwner = async () => {
    Log.info('fixing owner duplicates');
    const total = await HomeModel.find({$and: [{duplicateOf: null}, {badge: 'მესაკუთრე'}]}).count()
    Log.info(`Found ${total} homes to fix`);

    for (let i = 0; i < total; i++) {
        const homes = await HomeModel.find({$and: [{duplicateOf: null}, {badge: 'მესაკუთრე'}]})
            .sort([['date', -1]]).limit(1).skip(i).exec();
        if (homes.length > 0) {
            await fixHome(homes[0]);
        }
        Log.info(`Fixed ${i}/${total} homes`);
    }
}
const fixAllAgent = async () => {
    Log.info('fixing agent duplicates');
    const filter = {$and: [{duplicateOf: null}, {badge: {$ne: 'მესაკუთრე'}}]};
    const total = await HomeModel.find(filter).count()
    Log.info(`Found ${total} homes to fix`);

    for (let i = 0; i < total; i++) {
        const homes = await HomeModel.find(filter)
            .sort([['date', -1]]).limit(1).skip(i).exec();
        if (homes.length > 0) {
            await fixHome(homes[0]);
        }
        Log.info(`Fixed ${i}/${total} homes`);
    }
}
const fixAll = async () => {
    await fixAllOwner();
    await fixAllAgent();

}
const fixHome = async (home) => {
    const {duplicateHomes: duplicates, _id} = await findDuplicates(home);
    if (duplicates.length > 0) {
        await HomeModel.updateMany({_id: {$in: duplicates}}, {duplicateOf: _id}).exec();
        await HomeModel.updateOne({_id}, {duplicates: duplicates.length}).exec();
        Log.info(`found ${duplicates.length} duplicates for home: ${_id}`);
    }
};
const findDuplicates = async (home) => {
    const filter = getDuplicateFilter(home);
    const result = await HomeModel.find(filter);
    const duplicates = [];
    let mainHome = home;
    if (result.length > 0) {
        for (const resultElement of result) {
            if (Math.abs(home.date.getTime() - resultElement.date.getTime()) < 1000 * 60 * 60 * 24 * 20) {

                // const titleMatch = checkText(home.title, resultElement.title);
                // const descriptionMatch = checkText(home.description, resultElement.description);
                // if (titleMatch > 80 || descriptionMatch > 80) {
                if (isOwner(resultElement) && resultElement.duplicates?.length > 0) {
                    mainHome = resultElement;
                    mainHome.alreadyChosen = true;
                } else if (!mainHome.alreadyChosen && (isOwner(resultElement) || resultElement.duplicates?.length > 0)) {
                    mainHome = resultElement;
                } else {
                    duplicates.push(resultElement._id);
                }

            }
        }
    }

    if (home._id && mainHome._id !== home._id) {
        duplicates.push(home._id);
    }
    mainHome.duplicateHomes = duplicates;
    return mainHome;
}

const priceStep = 3000;
const areaStep = 1;

const getDuplicateFilter = (home) => {
    const $and = [];
    const filter = {};

    $and.push({status: home.status});
    $and.push({duplicateOf: null});

    if (home.price) {
        $and.push({price: {$gte: home.price - priceStep, $lte: home.price + priceStep}});
    }
    if (home.area) {
        $and.push({area: {$gte: home.area - areaStep, $lte: home.area + areaStep}});
    }
    if (home.floor) {
        $and.push({floor: home.floor});
    }
    if (home.floorsTotal) {
        $and.push({floorsTotal: home.floorsTotal});
    }
    if (home.buildingStatus) {
        $and.push({buildingStatus: home.buildingStatus});
    }
    if (home.region) {
        $and.push({region: home.region});
    }
    $and.push({originalId: {$ne: home.originalId}});

    if ($and.length > 0) {
        filter.$and = $and;
    }
    return filter;
}

// function checkText(txt, txt2) {
//     if (!txt) {
//         txt = '';
//     }
//     if (!txt2) {
//         txt2 = '';
//     }
//     const words = txt.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '').split(' ');
//     let regex = "";
//     for (const word of words) {
//         if (word.length > 0) {
//             regex += word + '|';
//         }
//     }
//     regex = regex.slice(0, -1);
//     regex = `(?:${regex})`;
//     const regexObj = new RegExp(regex, 'gi');
//     let matchLength = txt2 ? txt2?.match(regexObj)?.length : 0;
//     return matchLength * 100 / words.length;
//
// }

module.exports = {getDuplicateFilter, findDuplicates, fixAllOwner, fixAllAgent, fixAll};