const express = require('express'),
    apiRouter = express.Router();

apiRouter.use('/map', require('./map'));
apiRouter.use('/user', require('./user'));
module.exports = apiRouter