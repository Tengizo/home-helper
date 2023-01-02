const mongoose = require('mongoose');

const {Schema} = mongoose;

const ScrapSchema = new Schema({
    url: String,
    uuid: {type: String, unique: true},
    totalPages: Number,
    createDate: Date,
    startPage: Number,
    scrappedPages: Number,
    timeTaken: Number,
    startDate: Date,
    endDate: Date,
    started: Boolean    ,
    type: String,
    cron: String,
    totalProperties: Number,
    status: String,
    failedMessage: String,

});

mongoose.model('Scrap', ScrapSchema);