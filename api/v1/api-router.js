const express = require('express'),
    apiRouter = express.Router();

apiRouter.use('/map', require('./map'));
apiRouter.use('/user', require('./user'));
apiRouter.use('/stores', require('./store'));
apiRouter.use('/management', require('./management'));

module.exports = apiRouter