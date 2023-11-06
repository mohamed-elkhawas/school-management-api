const Joi = require('joi');
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // minlength: 5,
        // maxlength: 50,
        match: /^[a-zA-Z0-9_ \-]{5,50}$/
    },
    grades: { 
        type: Number, 
        default: 0,
        min: 0,
        max: 100
    },
});

const Student = mongoose.model('Student', studentSchema);

function validateStudent(student) {
    const schema = Joi.object({
        name: Joi.string().regex(/^[a-zA-Z0-9_ \-]{5,50}$/),
        grades: Joi.number().integer().min(0).max(100),
        schoolId: Joi.objectId(),
        classroomId: Joi.objectId()
    });

    return schema.validate(student);
}

exports.studentSchema = studentSchema;
exports.Student = Student; 
exports.validate = validateStudent;