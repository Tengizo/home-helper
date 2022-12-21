const mongoose = require('mongoose');

const HomeModel = mongoose.model('Home');


module.exports = app => {
    app.get('/api/property/search', getHomes);
    app.post('/api/property/update-status', updateHomeStatus);
};

async function getHomes(req, res) {
    const {page = 0, pageSize = 20, sortField, sortDirection} = req.query;
    const homeCount = await HomeModel
        .find(getFilter(req.query)).sort([[sortField, sortDirection]]).count()
    const homes = await HomeModel
        .find(getFilter(req.query)).sort([[sortField, sortDirection]])
        .skip(page * pageSize)
        .limit(pageSize);

    res.send({
        page, pageSize, totalItems: homeCount, totalPages: Math.ceil(homeCount / pageSize), content: homes
    });
}

async function updateHomeStatus(req, res) {
    const {id, status} = req.body;
    console.log(`
    _id: ${id},
    status: ${status}`);
    const home = await HomeModel.findOneAndUpdate({_id: id}, {homeStatus: status}, {upsert: false, new: true});
    res.send(home?._doc);
}


const getFilter = (query) => {
    const {
        keyword,
        statuses,
        homeStatus,
        selectedLabels,
        dateFrom,
        dateTo,
        m2PriceFrom,
        m2PriceTo,
        priceFrom,
        priceTo,
        sortField
    } = query;
    const $and = [];
    const filter = {};
    if (selectedLabels) {
        if (typeof selectedLabels === 'string') {
            $and.push({labels: selectedLabels});
        } else if (typeof selectedLabels === 'object' && Array.isArray(selectedLabels)) {
            $and.push({label: {$in: selectedLabels.map(label => parseInt(label))}});
        }
    }
    if (sortField === 'label') {
        $and.push({label: {$ne: null}});
    }
    if (homeStatus) {
        $and.push({homeStatus});
    } else {
        $and.push({homeStatus: {$ne: 'REJECTED'}});
        $and.push({homeStatus: {$ne: 'FAVOURITE'}});
    }
    if (statuses) {
        if (typeof statuses === 'string') {
            $and.push({status: statuses});
        } else if (typeof statuses === 'object' && Array.isArray(statuses)) {
            $and.push({status: {$in: statuses}});
        }
    }
    if (dateFrom) {
        $and.push({date: {$gte: new Date(Number.parseInt(dateFrom))}})
    }
    if (dateTo) {
        $and.push({date: {$lte: new Date(Number.parseInt(dateTo))}})
    }
    if (m2PriceFrom) {
        $and.push({m2Price: {$gte: m2PriceFrom}})
    }
    if (m2PriceTo) {
        $and.push({m2Price: {$lte: m2PriceTo}})
    }
    if (priceFrom) {
        $and.push({price: {$gte: priceFrom}})
    }
    if (priceTo) {
        $and.push({price: {$lte: priceTo}})
    }
    if (keyword) {
        $and.push({
            $or: [{
                title: {
                    $regex: `. *${!keyword ? '' : keyword}.*`, $options: 'i'
                }
            }, {
                description: {
                    $regex: `. *${!keyword ? '' : keyword}.*`, $options: 'i'
                }
            }, {
                url: {
                    $regex: `. *${!keyword ? '' : keyword}.*`, $options: 'i'
                }
            }]
        })
    }
    if ($and.length > 0) {
        filter.$and = $and;
    }
    return filter;
}

