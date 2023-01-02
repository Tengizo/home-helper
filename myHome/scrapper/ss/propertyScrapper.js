const utils = require('../../utils');
const selectors = require('./ssgeSelectors').propertySelectors;
const Log = require('../../../config/logger').logger('SSPropertyScrapper');

const STATUS_MAP = {
    "ახალი რემონტით": "ახალი გარემონტებული",
    "გარემონტებული": "ახალი გარემონტებული",
    "ძველი რემონტით": "ძველი გარემონტებული",
    "მიმდინარე რემონტი": "მიმდინარე რემონტი",
    "სარემონტო": "სარემონტო",
    "შავი კარკასი": "შავი კარკასი",
    "თეთრი კარკასი": "თეთრი კარკასი",
    "მწვანე კარკასი": "მწვანე კარკასი"
}


module.exports.scrap = async function (home, browserPool) {
    Log.info(`Scraping Home ${home.url}`);
    const browser = await browserPool.getBrowser();
    Log.debug(`Got browser ${browser.uuid} for home ${home.url}`);
    const page = await browser.newPage();
    try {
        await page.goto(home.url);
        await page.waitForSelector(selectors.price);
        await toDollar(page);
        const result = await getData(page);
        return {...home, ...result};
    } catch (e) {
        Log.error(`Error during scrapping property: ${home.url}`, e);
        console.log(e);
    } finally {
        await page.close();
        await browser.close();
        Log.debug(`Closed browser ${browser.uuid}`);
    }
    throw new Error('Failed to scrap property');
}

async function getData(page) {
    let result = {};
    const promiseArr = [];
    let details = await page.$(selectors.detailPage);
    /*home.title = await */
    promiseArr.push(details.$eval(selectors.title, el => el?.innerText));
    /*home.address = await*/
    promiseArr.push(details.$eval(selectors.address, el => el?.innerText));
    promiseArr.push(page.$eval(selectors.price, el => {
        const txt = el?.innerText
        let price = txt?.replace(' ', '')?.trim()
        price = price ? Number.parseInt(price) : 0;
        return isNaN(price) ? 0 : price;
    }));
    promiseArr.push(getMainFeatures(details));
    promiseArr.push(details.$eval(selectors.description, el => el?.innerText))
    promiseArr.push(getPropertyStatus(details));
    // promiseArr.push(details.$eval(selectors.date, el => el?.innerText))

    const values = await Promise.allSettled(promiseArr);

    result.title = values[0].value;
    result.address = values[1].value;
    result.price = values[2].value;
    result.region = getRegion(result.title);
    if (values[3].status === 'fulfilled') {
        result = {...result, ...values[3].value};
    }
    if (values[4].status === 'fulfilled') {
        result.description = values[4].value;
    }
    if (values[5].status === 'fulfilled') {
        result = {...result, ...values[5].value};
    }
    result.m2Price = result.price && result.area ? result.price / result.area : 0;
    return result;
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

function standartizeStatus(status) {
    return STATUS_MAP[status.trim()];
}

async function getPropertyStatus(details) {
    const amenitities = (await details.$$eval(selectors.amenities, nodes => nodes.map(n => n?.innerText)));
    const keys = (await details.$$eval(selectors.amenitiesKeys,
        nodes => nodes.map(n => n?.innerText?.replace(':', '')?.trim())
    ));
    const result = {};
    for (let i = 0; i < keys.length; i++) {
        if (keys[i] === 'სტატუსი') {
            result.buildingStatus = utils.getBuildingStatus(amenitities[i]?.replace(';', '')?.trim());
        } else if (keys[i] === 'მდგომარეობა') {
            result.status = standartizeStatus(amenitities[i]?.replace(';', '')?.trim());
        }
    }
    return result;
}


async function getMainFeatures(details) {
    const main = {};
    const features = await details.$$eval(selectors.mainFeatures, nodes => nodes.map(n => n?.innerText));
    const featuresKeys = await details.$$eval(selectors.mainFeaturesKeys, nodes => nodes.map(n => n?.innerText));

    for (let i = 0; i < featuresKeys.length; i++) {
        switch (featuresKeys[i]?.trim()) {
            case 'საერთო ფართი':
                main.area = Number.parseFloat(features[i]?.replace('მ²', '')?.trim());
                break;
            case 'ოთახები':
                main.rooms = Number.parseInt(features[i]?.trim());
                break;
            case 'საძინებლები':
                main.bedrooms = Number.parseInt(features[i]?.trim());
                break;
            case 'სართული':
                const floorSplit = features[i]?.split('/');
                if (floorSplit.length === 2) {
                    main.floorsTotal = Number.parseInt(floorSplit[1]);
                    main.floor = Number.parseInt(floorSplit[0]);
                } else {
                    main.floorsTotal = Number.parseInt(floorSplit[0]);
                }
        }
    }
    return main;
}

async function toDollar(page) {
    const toDollarElement = await page.$(selectors.priceSwitch);
    if (toDollarElement) {
        await toDollarElement.click();
    }
}