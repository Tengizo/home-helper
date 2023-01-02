const listSelectors = require("./ssgeSelectors").listSelectors;
const utils = require("../../utils");
const Log = require("../../../config/logger").logger("SSListScrapper");

module.exports.scrap = async function (url, browserPool) {
    const browser = await browserPool.getBrowser();
    Log.info(`Got browser ${browser.uuid}`);
    const page = await browser.newPage();
    Log.info(`Got page`);
    await page.goto(url);
    Log.info(`Page reached ${url}`);

    await page.waitForSelector(listSelectors.cardSelector);
    const result = [];
    let content = await page.$$(listSelectors.cardSelector);
    let ids = await page.$$eval(listSelectors.cardSelector, el => el.map(x => x.getAttribute("data-id")));
    const promises = [];
    for (let i = 0; i < content.length; i++) {
        promises.push(scrapCard(content[i], url, ids[i]));
    }
    const values = await Promise.all(promises);
    result.push(...values);
    await page.close();
    await browser.close();
    return result;
};

async function scrapCard(item, searchUrl, id) {
    const pr1 = item.$eval(listSelectors.linkSelector, (el) =>
        el.getAttribute("href")
    );
    const pr2 = item.$eval(listSelectors.dateSelector, (el) => el?.innerText);
    return Promise.all([pr1, pr2]).then((values) => {
        const date = utils.toDateSS(values[1]);
        return {
            originalId: id,
            date,
            url: `https://ss.ge${values[0]}`,
            searchUrl
        };
    });
}
