const validateObjectId = require("../middlewares/validateObjectId");
const auth = require("../middlewares/auth");
const adminOrSuperAdmin = require("../middlewares/adminOrSuperAdmin");
const { Classroom, validate } = require("../models/classroom");
const { School } = require("../models/school");
const validateMw = require("../middlewares/validate");
const express = require("express");
const router = express.Router();

router.get("/", [auth, adminOrSuperAdmin], async (req, res) => {
    if (req.user.role === 'admin') schools = await School.find({_id: req.user.schoolId});
    else schools = await School.find();
    
    let classrooms = [];
    for (let i = 0; i < schools.length; i++) {
        const school = schools[i];
        for (let j = 0; j < school.classrooms.length; j++) {
            const classroom = school.classrooms[j];
            classrooms.push(classroom);
        }
    }
    
    res.send(classrooms);
});

router.get("/:id", [auth, adminOrSuperAdmin, validateObjectId], async (req, res) => {
    const school = await School.findOne({"classrooms._id": req.params.id});

    if (!school)
        return res.status(404).send("The classroom with the given ID was not found.");

    if (req.user.role === 'admin' && school._id.toString() !==req.user.schoolId) 
        return res.status(403).send("Access denied.");

    let classroom;
    for (let i = 0; i < school.classrooms.length; i++) {
        if (req.params.id === school.classrooms[i]._id.toString()) 
            classroom = school.classrooms[i];
    }

    res.send(classroom);
});

router.post("/", [auth, adminOrSuperAdmin, validateMw(validate)], async (req, res) => {
    if (req.user.role === 'admin' && req.body.schoolId !==req.user.schoolId) 
        return res.status(403).send("Access denied.");
    
    let classroom = new Classroom({ name: req.body.name });

    const school = await School.findByIdAndUpdate(
        req.body.schoolId,
        {$push: { classrooms: classroom } },
        {new: true}
    );

    if (!school)
        return res.status(404).send("The school with the given ID was not found.");

    res.send(classroom);
});

router.put("/:id", [auth, adminOrSuperAdmin, validateObjectId, validateMw(validate)], async (req, res) => {
    if (req.user.role === 'admin'){
        school = await School.findOneAndUpdate(
            {"classrooms._id": req.params.id, _id: req.user.schoolId},
            {$set: {"classrooms.$.name":req.body.name}},
            {new: true}
        );
        
        if (!school)
            return res.status(404).send("The classroom with the given ID was not found.");
    }
    else{
        school = await School.findOneAndUpdate(
            {"classrooms._id": req.params.id},
            {$set: {"classrooms.$.name":req.body.name}},
            {new: true}
        );

        if (!school)
            return res.status(404).send("The classroom with the given ID was not found.");
    }

    let classroom;
    for (let i = 0; i < school.classrooms.length; i++) {
        if (req.params.id === school.classrooms[i]._id.toString()) 
            classroom = school.classrooms[i];
    }
    res.send(classroom);
});

router.delete("/:id", [auth, adminOrSuperAdmin, validateObjectId], async (req, res) => {
    let school;
    if (req.user.role === 'admin'){
        school = await School.findOneAndUpdate({"classrooms._id": req.params.id, _id: req.user.schoolId }, {
            $pull: {
                classrooms: {_id: req.params.id},
            },
        });
    }
    else{
        school = await School.findOneAndUpdate({ "classrooms._id": req.params.id }, {
            $pull: {
                classrooms: {_id: req.params.id},
            },
        });
    }

    if (!school) return res.status(404).send("The classroom with the given ID was not found.");

    res.send(school);
});

module.exports = router;
