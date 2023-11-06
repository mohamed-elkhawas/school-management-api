const {jwtr} = require("../startups/redis");
const config = require("config");
const Joi = require("joi");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        match: /^[a-zA-Z0-9_ \-]{5,50}$/
    },
    email: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255
    },
    role: {
        type: String,
        enum : ['student','admin','superAdmin'],
        default: 'student'
    },
    schoolId: {
        type: String,
        match: /^[0-9a-fA-F]+$/,
        required: function() { return this.role !== 'superAdmin';} 
    },
    studentId: {
        type: String,
        match: /^[0-9a-fA-F]+$/,
        required: function() { return this.role === 'student';} 
    }
});

userSchema.methods.generateAuthToken = async function() {
    const token = await jwtr.sign(
        {
            _id: this._id,
            name: this.name,
            email: this.email,
            role: this.role,
            schoolId: this.schoolId,
            studentId: this.studentId,
        },
        config.get("jwtPrivateKey"),
        {expiresIn: '1d'}
    );
    return token;
};

const User = mongoose.model("User", userSchema);

function validateUser(user) {
    const schema = Joi.object({
        name: Joi.string().regex(/^[a-zA-Z0-9_ \-]{5,50}$/),
        email: Joi.string().min(5).max(255).email(),
        password: Joi.string().min(5).max(255),
        role: Joi.string().valid('student','admin','superAdmin'),
        schoolId: Joi.objectId(),
        studentId: Joi.objectId()
    });

    return schema.validate(user);
}

exports.User = User;
exports.validate = validateUser;
