const redis = require('redis');
const JWTR =    require('jwt-redis').default;
const winston = require('winston');
const config = require('config');
const redisUrl = config.get('redisDB_url');
const redisClient = redis.createClient({ url: redisUrl });

exports.jwtr = new JWTR(redisClient);
exports.redisClient = redisClient;
exports.redisConnect = async function() {
    redisClient.connect()
        .then(() => winston.info(`Connected to ${redisUrl}`))
        .catch((err) => winston.info(`${err}`));
}
