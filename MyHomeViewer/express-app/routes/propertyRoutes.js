const mongoose = require('mongoose');

const HomeModel = mongoose.model('Home');


module.exports = app => {
    app.get('/api/property/search', getHomes);
    app.get('/api/property/duplicates/:id', getHomeDuplicates);
    app.post('/api/property/update-status', updateHomeStatus);
};

async function getHomes(req, res) {
    const {page = 0, pageSize = 20, sortField, sortDirection} = req.query;
    const homeCount = await HomeModel
        .find(getFilter(req.query)).count()
    const homes = await HomeModel
        .find(getFilter(req.query)).sort([[sortField, sortDirection]])
        .skip(page * pageSize)
        .limit(pageSize);

    res.send({
        page, pageSize, totalItems: homeCount, totalPages: Math.ceil(homeCount / pageSize), content: homes
    });
}

async function getHomeDuplicates(req, res) {
    const {id} = req.params;
    const {page = 0, pageSize = 20, sortField, sortDirection} = req.query;
    const duplicateCount = await HomeModel.find({duplicateOf: id}).count();
    const homes = await HomeModel
        .find({duplicateOf: id}).sort([[sortField, sortDirection]])
        .skip(page * pageSize)
        .limit(pageSize);

    res.send({
        page, pageSize, totalItems: duplicateCount, totalPages: Math.ceil(duplicateCount / pageSize), content: homes
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
        sources,
        badge,
        homeStatus,
        selectedLabels,
        dateFrom,
        dateTo,
        m2PriceFrom,
        m2PriceTo,
        m2From,
        m2To,
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
    $and.push({duplicateOf: null});
    if (sortField === 'label') {
        $and.push({label: {$ne: null}});
    }
    if (badge) {
        $and.push({badge: badge});
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
    if (sources) {
        if (typeof sources === 'string') {
            $and.push({source: sources});
        } else if (typeof sources === 'object' && Array.isArray(sources)) {
            $and.push({source: {$in: sources}});
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
    if (m2From) {
        $and.push({area: {$gte: m2From}})
    }
    if (m2To) {
        $and.push({area: {$lte: m2To}})
    }
    if (keyword) {
        $and.push({
            $or: [{
                title: {
                    $regex: `.*${keyword}.*`, $options: 'i'
                }
            }, {
                description: {
                    $regex: `.*${keyword}.*`, $options: 'i'
                }
            }, {
                url: {
                    $regex: `.*${keyword}.*`, $options: 'i'
                }
            }]
        })
    }
    if ($and.length > 0) {
        filter.$and = $and;
    }
    return filter;
}

