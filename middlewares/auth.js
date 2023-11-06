const {jwtr} = require("../startups/redis");
const config = require("config");

module.exports = async function(req, res, next) {

  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Access denied. No token provided.");

  try {
    const decoded = await jwtr.verify(token, config.get("jwtPrivateKey"));
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
};
