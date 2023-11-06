const winston = require("winston");
const express = require("express");
const config = require("config");
const app = express();

require("./startups/logging")();
require("./startups/cors")(app);
require("./startups/routes")(app);
require("./startups/mongoDB")();
require("./startups/config")();
require("./startups/validation")();
require("./startups/redis").redisConnect();

const port = process.env.PORT || config.get("port");
const server = app.listen(port, () =>
    winston.info(`Listening on port ${port}`)
);

module.exports = server;
