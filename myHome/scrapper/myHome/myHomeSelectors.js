module.exports = {
    listSelectors: {
        cardSelector: `.statement-card`,
        linkSelector: ` a[class='card-container']`,
        idSelector: `div[class='list-view-id-container justify-content-center'] div[class='content'] span[class='d-block']`,
        dateSelector: `div[class='card-body'] div[class='statement-date']`,
        idProperty: `data-product-id`,
        isVip: `div.vip-label`,
    },
    propertySelectors: {
        detailPage: `.detail-page`,
        statementHeader: `div[class='statement-header']`,
        priceBlock: `aside[class='price-block'] div[class='price-box']`,
        mainFeatures: `div[class='main-features row no-gutters'] span[class='d-block']`,
        description: `div[class='description'] div div p`,
        amenities: `div[class='amenities'] div[class='row'] div[class='col-6']`,
        amenitiesInterior: `ul li`,
        status: `div span[class='d-block']`,
        badge: `div[class='agent d-flex align-items-center'] span[class='badge badge-success mt-1']`,
        date: `div[class='d-flex align-items-center date'] span`,
        title: function () {
            return `${this.statementHeader} h1[class='mb-0']`
        },
        address: function () {
            return `${this.statementHeader} span[class='address']`
        },
        isDollar: function () {
            return `${this.priceBlock} span[class='small convert-toggler active']`
        },
        toDollar: function () {
            return `${this.priceBlock} span[class='small convert-toggler']`
        },
        price: function () {
            return `${this.priceBlock} div[class='price-toggler-wrapper'] div[class='d-flex mb-2 align-items-center justify-content-between'] span[class='d-block convertable']`
        },
        area: function () {
            return `${this.priceBlock} div[class='price-toggler-wrapper'] div[class='space d-flex align-items-center'] div`
        }
    }
}