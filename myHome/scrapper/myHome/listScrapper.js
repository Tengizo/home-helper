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
        const values = (await Promise.all(promises)).filter((x) => x !== null);
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
    try {
        const link = await item.$eval(listSelectors.linkSelector, (el) => el.getAttribute("href"));
        const dateStr = await item.$eval(listSelectors.dateSelector, (el) => el?.innerText);
        const idStr = await item.$eval(listSelectors.idSelector, (el) => el?.innerText);
        const isVip = await item.$(listSelectors.isVip);
        const id = idStr?.replace("ID", "")?.trim();
        const date = utils.toDateMyHome(dateStr);
        return {
            originalId: id,
            date,
            url: link,
            searchUrl,
            isVip: isVip !== null,
        };
    } catch (e) {
        return null;
    }
}
