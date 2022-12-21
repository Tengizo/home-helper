const mongoose = require('mongoose');
const crypto = require('crypto');

const Scrap = mongoose.model('Scrap');

module.exports = app => {
    app.post('/api/scrap/scrap-url', scrapPages);
    app.get('/api/scrap/get-status/:id', getStatus);
    app.get('/api/scrap/search', searchScraps);
};

async function getStatus(req, res) {
    const {id} = req.params;
    const scrap = await Scrap.findOne({uuid: id});
    if (scrap) {
        res.send(scrap);
    } else {
        res.status(404).send();
    }
}


async function scrapPages(req, res) {
    const scrapRequestID = crypto.randomUUID();
    const {url, totalPages = 10, startPage = 0} = req.body;
    if (!url) {
        res.status(400).send('URL is required');
        return;
    }
    const scrap = await new Scrap({
        uuid: scrapRequestID, url, totalPages, startPage, createDate: new Date(), status: 'NEW'
    }).save();
    res.send(scrap);
}

async function searchScraps(req, res) {
    const {page = 0, pageSize = 20, sortField = 'createDate', sortDirection = -1} = req.query;
    const scrapCount = await Scrap.find().sort([[sortField, sortDirection]]).count();
    const scraps = await Scrap.find().sort([[sortField, sortDirection]]);
    res.send({
        page, pageSize, totalItems: scrapCount, totalPages: Math.ceil(scrapCount / pageSize), content: scraps
    });
}
