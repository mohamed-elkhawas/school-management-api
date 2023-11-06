const Joi = require('joi');
const bcrypt = require('bcrypt');
const {User} = require('../models/user');
const validateMw = require("../middlewares/validate");
const express = require('express');
const router = express.Router();
const {redisClient} = require('../startups/redis');

router.post('/', validateMw(validate), async (req, res) => {

    let reqNo;
    reqNo = parseInt(await redisClient.get(req.body.email)) || 1;

    if (reqNo > 10) return res.status(400).send('too many requests you may try again after 10 minutes');    
    await redisClient.set(req.body.email, (reqNo+1).toString(), {EX: 600});

    let user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send('Invalid email or password.');

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).send('Invalid email or password.');

    const token = await user.generateAuthToken();
    res.send(token);
});

function validate(req) {
    const schema = Joi.object({
        email: Joi.string().min(5).max(255).required().email(),
        password: Joi.string().min(5).max(255).required()
    });

    return schema.validate(req);
}

module.exports = router; 
