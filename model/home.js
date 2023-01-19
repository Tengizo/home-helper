const mongoose = require('mongoose');

const {Schema} = mongoose;

const HomeSchema = new Schema({
    originalId: String,
    url: {type: String, unique: true},
    searchUrl: {type: String},
    date: Date,
    source: String,
    isVip: Boolean,
    price: Number,
    m2Price: Number,
    region: String,
    description: String,
    area: Number,
    rooms: Number,
    bedrooms: Number,
    floorsTotal: Number,
    floor: Number,
    homeStatus: String,
    badge: String,
    label: Number,
    buildingStatus: String,
    status: String,
    notificationSent: Boolean,
    type: String,
    title: String,
    isAgent: Boolean,
    duplicateOf: String,
    duplicates: Number,
});

mongoose.model('Home', HomeSchema);