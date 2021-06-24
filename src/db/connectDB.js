const mongoose = require('mongoose'),
    log = require('../modules/logger');

const connectDB = async () => {
    try{
        await mongoose.connect(process.env.DATABASE_URL_RS, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true,
            replicaSet: "rs0"
        });
        log.info('MongoDB Connected...');
    } catch (error) {
        throw new Error('connection broke');
    }

}

module.exports = connectDB();