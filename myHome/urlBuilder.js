const URL = require('url');

module.exports.URL_VALUES = {
    adType: {
        key: 'AdTypeID', values: {
            sell: 1, mortgage: 2, rent: 3
        }
    }, propertyType: {
        key: 'PrTypeID', values: {
            apartment: 1, house: 2, commercial: 4, land: 5, hotel: 7
        }
    }, sort: {
        key: 'SortID', values: {
            dateDecrease: 1, dateIncrease: 2, priceIncrease: 3, priceDecrease: 4, m2Increase: 5, m2Decrease: 6,
        }
    }, estateTypeId: {
        key: 'EstateTypeID', values: {
            new: 1, current: 2, old: 3,
        }
    }, propertyPrice: {
        currency: {
            key: 'FCurrencyID', values: {GEL: 1, USD: 2, EUR: 3}
        }, priceFrom: {
            key: 'FPriceFrom',
        }, priceTo: {
            key: 'FPriceTo',
        }
    }, m2Price: {
        currency: {
            key: 'SCurrencyID', values: {GEL: 2, USD: 1, EUR: 3}
        }, priceFrom: {
            key: 'SPriceFrom',
        }, priceTo: {
            key: 'SPriceTo',
        }
    }, areaSize: {
        areaSizeFrom: 'AreaSizeFrom', areaSizeTo: 'AreaSizeTo',
    }, floor: {
        floorFrom: 'FloorFrom', floorTo: 'FloorTo',
    },
    enableMap: 'EnableMap', page: 'Page',
}


module.exports.getUrl = function ({
                                      adType,
                                      propertyType,
                                      sort,
                                      propertyPrice: {propertyPriceFrom, propertyPriceTo, propertyCurrency = 2},
                                      m2Price: {m2PriceFrom, m2PriceTo, m2Currency = 1},
                                      areaSize: {areaSizeFrom, areaSizeTo},
                                      floor: {floorFrom, floorTo},
                                      enableMap = 0,
                                      page = 0,
                                      baseUrl = 'https://www.myhome.ge/ka/s/'

                                  }) {
    const url = new URL.parse(baseUrl);
    if (adType) {
        url.query[URL_VALUES.adType.key] = URL_VALUES.adType.values[adType];
    }
    if (propertyType) {
        url.query[URL_VALUES.propertyType.key] = URL_VALUES.propertyType.values[propertyType];
    }
    if (sort) {
        url.query[URL_VALUES.sort.key] = URL_VALUES.sort.values[sort];
    }
    if (propertyPriceFrom) {
        url.query[URL_VALUES.propertyPrice.priceFrom.key] = propertyPriceFrom;
    }
    if (propertyPriceTo) {
        url.query[URL_VALUES.propertyPrice.priceTo.key] = propertyPriceTo;
    }
    url.query[URL_VALUES.propertyPrice.currency.key] = propertyCurrency;
    if (m2PriceFrom) {
        url.query[URL_VALUES.m2Price.priceFrom.key] = m2PriceFrom;
    }
    if (m2PriceTo) {
        url.query[URL_VALUES.m2Price.priceTo.key] = m2PriceTo;
    }
    url.query[URL_VALUES.m2Price.currency.key] = m2Currency;
    if (areaSizeFrom) {
        url.query[URL_VALUES.areaSize.areaSizeFrom] = areaSizeFrom;
    }
    if (areaSizeTo) {
        url.query[URL_VALUES.areaSize.areaSizeTo] = areaSizeTo;
    }
    if (floorFrom) {
        url.query[URL_VALUES.floor.floorFrom] = floorFrom;
    }
    if (floorTo) {
        url.query[URL_VALUES.floor.floorTo] = floorTo;
    }
    url.query[URL_VALUES.enableMap] = enableMap;
    url.query[URL_VALUES.page] = page;
}

