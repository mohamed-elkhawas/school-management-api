const auth = require("../middlewares/auth");
const {jwtr} = require("../startups/redis");
const express = require('express');
const router = express.Router();
const config = require("config");

router.get('/', auth, async (req, res) => {
  jwtr.destroy(req.user.jti, config.get("jwtPrivateKey"))
    .then(() => res.send("logged out sucessfully"));
});

module.exports = router; 
