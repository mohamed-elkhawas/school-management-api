const cors = require("cors");

// var corsOptions = {
//     origin: 'http://example.com',
//     optionsSuccessStatus: 200 
// }

// module.exports = function(app) {
//     app.use(cors(corsOptions));
// };

module.exports = function(app) {
    app.use(cors());
};
