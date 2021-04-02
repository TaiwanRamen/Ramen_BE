const express = require('express'),
    apiRouter = express.Router();

apiRouter.use('/map', require('./map-api'));
apiRouter.use('/stores', require('./stores-api'));

module.exports = apiRouter