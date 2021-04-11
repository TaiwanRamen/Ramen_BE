const mongoose = require('mongoose'),
    log = require('../modules/logger');

const mongooseConnection = async () => {
    try{
        await mongoose.connect(process.env.DATABASE_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true
        });
        log.info('MongoDB Connected...');
    } catch (error) {
        throw new Error('connection broke');
    }

}

module.exports = mongooseConnection();