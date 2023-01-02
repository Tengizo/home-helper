const selectors = require('./myHomeSelectors').propertySelectors;
const Log = require('../../../config/logger').logger('MHPropertyScrapper');


module.exports.scrap = async function (home, browserPool) {
    Log.info(`Scraping Home ${home.url}`);
    const browser = await browserPool.getBrowser();
    Log.debug(`Got browser ${browser.uuid} for home ${home.url}`);
    const page = await browser.newPage();
    try {
        await page.goto(home.url);
        await page.waitForSelector(selectors.priceBlock);
        await page.waitForSelector(selectors.detailPage);
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
    promiseArr.push(details.$eval(selectors.title(), el => el?.innerText));
    /*home.address = await*/
    promiseArr.push(details.$eval(selectors.address(), el => el?.innerText));
    promiseArr.push(details.$eval(selectors.price(), el => el?.innerText)
        .then(txt => {
            const price = txt?.replace(',', '')?.trim()
            return Number.parseInt(price);
        }));
    promiseArr.push(getMainFeatures(details));
    promiseArr.push(details.$eval(selectors.description, el => el?.innerText))
    promiseArr.push(getPropertyStatus(details));
    promiseArr.push(details.$eval(selectors.badge, el => el?.innerText))
    // promiseArr.push(details.$eval(selectors.date, el => el?.innerText))

    const values = await Promise.allSettled(promiseArr);

    result.title = values[0].value;
    result.address = values[1].value;
    result.price = values[2].value;
    if (values[3].status === 'fulfilled') {
        result = {...result, ...values[3].value};
    }
    if (values[4].status === 'fulfilled') {
        result.description = values[4].value;
    }
    if (values[5].status === 'fulfilled') {
        result.status = values[5].value?.trim();
    }
    if (values[6].status === 'fulfilled') {
        result.badge = values[6].value?.trim();
    }
    result.region = getRegion(result.title);
    result.buildingStatus = getStatus(result.title);
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

async function getPropertyStatus(details) {
    const interior = (await details.$$(selectors.amenities));
    const amenitiesInterior = await interior[0].$$(selectors.amenitiesInterior)
    return await amenitiesInterior[0].$eval(selectors.status, el => el.innerText);
}

async function getMainFeatures(details) {
    const main = {};
    const featuers = await details.$$eval(selectors.mainFeatures, nodes => nodes.map(n => n?.innerText));
    const area = featuers[0];
    const rooms = featuers[1];
    const bedRooms = featuers[2];
    const floors = featuers[4];
    main.area = Number(area?.replace('მ²', '')?.trim());
    main.rooms = Number.parseInt(rooms?.replace('ოთახი', '')?.trim());
    main.bedrooms = Number.parseInt(bedRooms);
    const floorSplit = floors.split('/');
    if (floorSplit.length === 2) {
        main.floorsTotal = Number.parseInt(floorSplit[1]);
        main.floor = Number.parseInt(floorSplit[0]);
    } else {
        main.floorsTotal = Number.parseInt(floorSplit[0]);
    }
    return main;

}

async function toDollar(page) {
    const isDOllar = await page.$(selectors.isDollar());
    if (isDOllar == null) {
        const toDollarElement = await page.$(selectors.toDollar());
        await toDollarElement.click();
    }

}