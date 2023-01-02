const myHomeListScrapper = require('./myHome/listScrapper');
const myHomePropertyScrapper = require('./myHome/propertyScrapper');
const ssgeListScrapper = require('./ss/listScrapper');
const ssgePropertyScrapper = require('./ss/propertyScrapper');
const Log = require('../../config/logger').logger('myHomeScrapper.js');
const {URL} = require('url');
const SS_HOST = 'ss.ge';
const MYHOME_HOST = 'myhome.ge';


function getScrapper(url, type) {
    let host = new URL(url).host;
    host = host.toLowerCase().replace('www.', '');
    switch (host) {
        case SS_HOST:
            if (type === 'LIST') {
                Log.info(`Got SS.ge scrapper`);
                return ssgeListScrapper;
            }
            Log.info(`Got SS.ge scrapper`);
            return ssgePropertyScrapper;

        case MYHOME_HOST:
            if (type === 'LIST') {
                Log.info(`Got MyHome scrapper`);
                return myHomeListScrapper;
            }
            Log.info(`Got MyHome scrapper`);
            return myHomePropertyScrapper;

        default:
            throw new Error(`Unknown host ${host}`);
    }
}

module.exports.scrapList = async (url, browserPool) => {
    let scrapper = getScrapper(url, 'LIST');

    return scrapper.scrap(url, browserPool);
};
module.exports.scrapProperty = (home, browserPool) => {
    let scrapper = getScrapper(home.url, 'PROPERTY');
    return scrapper.scrap(home, browserPool);
};