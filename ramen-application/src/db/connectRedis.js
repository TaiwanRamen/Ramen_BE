const redis = require('redis'),
    log = require('../modules/logger'),
    util = require('util');

let redis_client = null;
const redisClient = () => {
    if(redis_client == null) {
        redis_client = redis.createClient({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
        })
        redis_client.auth(process.env.REDIS_PASS);//密碼驗證
        redis_client.get = util.promisify(redis_client.get);
        redis_client.set = util.promisify(redis_client.set);
        redis_client.setex = util.promisify(redis_client.setex);


        redis_client.on("error", function (err) {
            log.error("Redis error:" + err);
            throw new Error('connection broke');
        });
        log.info("Redis Connected")
    }
    return redis_client
}


module.exports = redisClient();
