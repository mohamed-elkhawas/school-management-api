const validateObjectId = require("../middlewares/validateObjectId");
const auth = require("../middlewares/auth");
const adminOrSuperAdmin = require("../middlewares/adminOrSuperAdmin");
const { Student, validate } = require("../models/student");
const { School } = require("../models/school");
const validateMw = require("../middlewares/validate");
const express = require("express");
const router = express.Router();

router.get("/", auth, async (req, res) => {
    if (req.user.role === 'admin') schools = await School.find({_id: req.user.schoolId});
    else schools = await School.find();
    
    let students = [];
    for (let i = 0; i < schools.length; i++) {
        for (let j = 0; j < schools[i].classrooms.length; j++) {
            for (let k = 0; k < schools[i].classrooms[j].students.length; k++) {
                students.push(schools[i].classrooms[j].students[k]);
            }
        }
    }
    res.send(students);
});

router.get("/:id", [auth, validateObjectId], async (req, res) => {
    const school = await School.findOne({"classrooms.students._id": req.params.id});

    if (!school)
        return res.status(404).send("The student with the given ID was not found.");

    if (req.user.role === 'admin' && school._id.toString() !== req.user.schoolId) 
        return res.status(403).send("Access denied.");
    
    if (req.user.role === 'student' && req.params.id !== req.user.studentId)
        return res.status(403).send("Access denied.");

    let student;
    for (let i = 0; i < school.classrooms.length; i++) {
        for (let j = 0; j < school.classrooms[i].students.length; j++) {
            if (req.params.id === school.classrooms[i].students[j]._id.toString()) 
            student = school.classrooms[i].students[j];
        }
    }

    res.send(student);
});

router.post("/", [auth, adminOrSuperAdmin, validateMw(validate)], async (req, res) => {
    if (req.user.role === 'admin' && req.body.schoolId !==req.user.schoolId) 
        return res.status(403).send("Access denied.");
    
    let student = new Student({ name: req.body.name });

    const school = await School.findOneAndUpdate(
        {_id: req.body.schoolId, "classrooms._id": req.body.classroomId},
        {$push: { "classrooms.$.students": student } },
        {new: true}
    );

    if (!school)
        return res.status(404).send("The school with the given ID was not found.");

    res.send(student);
});

router.put("/:id", [auth, adminOrSuperAdmin, validateObjectId, validateMw(validate)], async (req, res) => {
 if (req.user.role === 'admin'){
        school = await School.findOneAndUpdate(
            {"classrooms.students._id": req.params.id, _id: req.user.schoolId},
            {
                $set: {
                    "classrooms.$[].students.$[student].name":req.body.name,
                    "classrooms.$[].students.$[student].grades":req.body.grades,
                }
            },
            {
                arrayFilters : [
                {"student._id": req.params.id}
                ],
                new: true
            },
        );
        
        if (!school)
            return res.status(404).send("The classroom with the given ID was not found.");
    }
    else{
        school = await School.findOneAndUpdate(
            {"classrooms.students._id": req.params.id},
            {
                $set: {
                    "classrooms.$[].students.$[student].name":req.body.name,
                    "classrooms.$[].students.$[student].grades":req.body.grades,
                }
            },
            {
                arrayFilters : [
                {"student._id": req.params.id}
                ],
                new: true
            },
        );

        if (!school)
            return res.status(404).send("The classroom with the given ID was not found.");
    }

    let student;
    for (let i = 0; i < school.classrooms.length; i++) {
        for (let j = 0; j < school.classrooms[i].students.length; j++) {
            if (req.params.id === school.classrooms[i].students[j]._id.toString()) 
            student = school.classrooms[i].students[j];
        }
    }

    res.send(student);
});

router.delete("/:id", [auth, adminOrSuperAdmin, validateObjectId], async (req, res) => {
    let school;
    if (req.user.role === 'admin'){
        school = await School.findOneAndUpdate({"classrooms.students._id": req.params.id, _id: req.user.schoolId }, {
            $pull: {
                "classrooms.$.students": {_id: req.params.id},
            },
        });
    }
    else{
        school = await School.findOneAndUpdate({ "classrooms.students._id": req.params.id }, {
            $pull: {
                "classrooms.$.students": {_id: req.params.id},
            },
        });
    }

    if (!school) return res.status(404).send("The student with the given ID was not found.");

    res.send(school);
});

module.exports = router;
