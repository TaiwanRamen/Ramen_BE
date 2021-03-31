const express = require('express'),
    apiRouter = express.Router();

apiRouter.use('/map', require('./mapApi'));
module.exports = apiRouter