const mongoose = require("mongoose");
const log = require("./logger").logger('config/database.js');
const {MONGO_URI} = process.env;

module.exports.connect = () => {
    // Connecting to the database
    mongoose.Promise = global.Promise;
    log.info({'mongo urll:::::': MONGO_URI})
    mongoose.set('strictQuery', false);
    mongoose.connect(MONGO_URI);
};
