require("dotenv").config();
require('../config/database').connect();
require('../model/home');
require('../model/statistics');
require('../model/scrap');

require('./express-app/expressApp')