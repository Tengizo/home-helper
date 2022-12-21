const mongoose = require('mongoose');

const {Schema} = mongoose;

const StatsSchema = new Schema({
    name: {
        type: String,
        unique: true,
    },
    averageM2Price: Number,
    averagePrice: Number,
    propertiesTotal: Number,
    region: String,
    status: String,

});

mongoose.model('Stats', StatsSchema);