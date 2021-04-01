const express = require('express'),
    apiRouter = express.Router();

apiRouter.use('/map', require('./map-api'));
module.exports = apiRouter