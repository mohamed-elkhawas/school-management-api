const { School } = require("./models/school");
const {User} = require('./models/user');
const mongoose = require("mongoose");
const config = require("config");
const bcrypt = require("bcrypt");

async function seed() {
    await mongoose.connect(config.get("mongoDB_url"));

    await School.deleteMany({});
    await User.deleteMany({});

    newUser = { 
        name: config.get("superAdmin.username"), role: 'superAdmin',
        email: config.get("superAdmin.email"), password: config.get("superAdmin.password") 
    };
    user = new User(newUser);
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();

    await mongoose.disconnect();
}

seed();
