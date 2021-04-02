require('dotenv').config()
const mongoose = require('mongoose'),
    log = require('../modules/logger');

mongoose.connect(process.env.DATABASE_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true
    })
    .then(() => log.info('MongoDB Connected...'))
    .catch(err => log.error(err));