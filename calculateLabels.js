const mongoose = require('mongoose');
require("dotenv").config();
require('./config/database').connect();
require('./model/home');
require('./model/statistics');
require('./model/scrap');
const {updateLabels} = require('./myHome/labelCalculator');

updateLabels().then(() => {
    console.log(`Labels updated successfully`);
});