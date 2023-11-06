const winston = require('winston');
const mongoose = require('mongoose');
const config = require('config');

module.exports = function() {
    const db = config.get('mongoDB_url');
    mongoose.connect(db)
        .then(() => winston.info(`Connected to ${db}`))
        .catch((err) => winston.info(`${err}`));
}