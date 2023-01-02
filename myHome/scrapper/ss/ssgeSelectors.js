module.exports = {
    listSelectors: {
        cardSelector: `div[class='latest_articles_block listing-section'] .latest_article_each`,
        linkSelector: `div[class='latest_desc'] > div:first-of-type > a:first-of-type`,
        dateSelector: `div[class='add_time']`,
        idProperty: `data-product-id`,
        isVip: `div.vip-label`,
    },
    propertySelectors: {
        detailPage: `div[class='DetailedPageAllBodyBLock'] .DetailedLeftAll`,
        statementHeader: `div[class='statement-header']`,
        price: `div[class='article_body_right_in'] div[class='price_block_all desktopPriceBlockDet'] .article_right_price`,
        priceSwitch: `.DetailedRightAll div[class='PriceSWitchBlock'] .switch .label-usd`,
        mainFeatures: `.article_item_parameters .DetailedItemParametersBlock .DetailedItemParametersBlock_in .ParamsDetTop .ParamsHdBlk text`,
        mainFeaturesKeys: `.article_item_parameters .DetailedItemParametersBlock .DetailedItemParametersBlock_in .ParamsDetTop .ParamsBotBlk`,
        description: `.article_item_desc .translate_block .article_item_desc_body .details_text`,
        amenities: `.article_item_parameters .DetailedItemParametersBlock .DetailedItemParametersBlock_in .ParamsbotProj .ProjBotEach .PRojeachBlack`,
        amenitiesKeys: `.article_item_parameters .DetailedItemParametersBlock .DetailedItemParametersBlock_in .ParamsbotProj .ProjBotEach .TitleEachparbt`,
        amenitiesInterior: `ul li`,
        status: `div span[class='d-block']`,
        badge: `div[class='agent d-flex align-items-center'] span[class='badge badge-success mt-1']`,
        date: `div[class='d-flex align-items-center date'] span`,
        title: `div[class='article_in_title'] h1`,
        address: `div[class='cadastrcode-streets'] a`,
    }
}