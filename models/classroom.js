const Joi = require('joi');
const mongoose = require('mongoose');
const {studentSchema} = require('./student');

const classroomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // minlength: 5,
        // maxlength: 50,
        match: /^[a-zA-Z0-9_ \-]{5,50}$/
    },
    students: [studentSchema]    
});

const Classroom = mongoose.model('Classroom', classroomSchema);

function validateClassroom(classroom) {
    const schema = Joi.object({
        name: Joi.string().regex(/^[a-zA-Z0-9_ \-]{5,50}$/),
        schoolId: Joi.objectId(),
    });

    return schema.validate(classroom);
}

exports.classroomSchema = classroomSchema;
exports.Classroom = Classroom; 
exports.validate = validateClassroom;