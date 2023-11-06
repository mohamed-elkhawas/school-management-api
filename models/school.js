const Joi = require('joi');
const mongoose = require('mongoose');
const {classroomSchema} = require('./classroom');

const schoolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // minlength: 5,
        // maxlength: 50,
        match: /^[a-zA-Z0-9_ \-]{5,50}$/
    },
    classrooms: [classroomSchema]
});

const School = mongoose.model('School', schoolSchema);

function validateSchool(school) {
    const schema = Joi.object({
        name: Joi.string().required().regex(/^[a-zA-Z0-9_ \-]{5,50}$/),
    });

    return schema.validate(school);
}

exports.schoolSchema = schoolSchema;
exports.School = School; 
exports.validate = validateSchool;