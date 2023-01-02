const listSelectors = require("./myHomeSelectors").listSelectors;
const utils = require("../../utils");
const Log = require("../../../config/logger").logger("MHListScrapper");

module.exports.scrap = async function (url, browserPool) {
    let page;
    let browser;
    try {
        browser = await browserPool.getBrowser();
        Log.debug(`Got browser ${browser.uuid}`);
        page = await browser.newPage();
        await page.goto(url);

        await page.waitForSelector(listSelectors.cardSelector);
        const result = [];
        let content = await page.$$(listSelectors.cardSelector);
        const promises = [];
        for (const item of content) {
            promises.push(scrapCard(item, url));
        }
        const values = await Promise.all(promises);
        result.push(...values);

        return result;
    } catch (e) {
        throw e;
    } finally {
        await page?.close();
        await browser?.close();
    }
};

async function scrapCard(item, searchUrl) {
    const pr1 = item.$eval(listSelectors.linkSelector, (el) =>
        el.getAttribute("href")
    );
    const pr2 = item.$eval(listSelectors.dateSelector, (el) => el?.innerText);
    const pr3 = item.$eval(listSelectors.idSelector, (el) => el?.innerText);
    const pr4 = item.$(listSelectors.isVip);
    return Promise.all([pr1, pr2, pr3, pr4]).then((values) => {
        const id = values[2]?.replace("ID", "")?.trim();
        const date = utils.toDateMyHome(values[1]);
        return {
            originalId: id,
            date,
            url: values[0],
            searchUrl,
            isVip: values[3] !== null,
        };
    });
}
