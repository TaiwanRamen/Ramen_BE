const express = require('express'),
    apiRouter = express.Router();

apiRouter.use('/map', require('./map'));
apiRouter.use('/user', require('./user'));
apiRouter.use('/stores', require('./store'));
apiRouter.use('/management', require('./management'));
apiRouter.use('/comments', require('./comment'));
apiRouter.use('/reviews', require('./review'));


module.exports = apiRouter