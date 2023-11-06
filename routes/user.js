const auth = require("../middlewares/auth");
const adminOrSuperAdmin = require("../middlewares/adminOrSuperAdmin");
const validateMw = require("../middlewares/validate");
const validateObjectId = require("../middlewares/validateObjectId");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const { User, validate } = require("../models/user");
const { School } = require("../models/school");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

router.get("/", [auth, adminOrSuperAdmin], async (req, res) => {
    if (req.user.role === 'admin') users = await User.find({schoolId: req.user.schoolId, role: 'student'}).select("-password");
    else users = await User.find().select("-password");
    res.send(users);
});

router.get("/me", auth, async (req, res) => {
    const user = await User.findById(req.user._id).select("-password");
    res.send(user);
});

router.get("/:id", [auth, adminOrSuperAdmin, validateObjectId], async (req, res) => {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).send('Invalid ID.');
    if (req.user.role === 'admin' && user.schoolId !== req.user.schoolId)return res.status(403).send('Access denied.');
    res.send(user);
});

router.post("/", [auth, adminOrSuperAdmin, validateMw(validate)], async (req, res) => {
    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send("User already registered.");
    
    if (req.user.role !== 'superAdmin' && req.body.role !== 'student') return res.status(403).send("Access denied.");
    
    if (req.user.role === 'admin' && req.user.schoolId !== req.body.schoolId) return res.status(403).send("Access denied.");

    if (req.body.role === 'admin' || req.body.role === 'student'){      
        school = await School.findOne({_id:req.body.schoolId})
        if (!school) return res.status(404).send('school not found.');

        if (req.body.role === 'student'){            
            school = await School.findOne({_id:req.body.schoolId, "classrooms.students._id": req.body.studentId})
            if (!school) return res.status(404).send('student not found.');
            
            user = new User(_.pick(req.body, ["name", "email", "password", "role", "schoolId", "studentId"]));
        }
        else user = new User(_.pick(req.body, ["name", "email", "password", "role", "schoolId"]));
    }
    else user = new User(_.pick(req.body, ["name", "email", "password", "role"]));
        
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();

    user.password = undefined;
    res.send(user);
});

router.put("/:id", [auth, adminOrSuperAdmin, validateObjectId, validateMw(validate)], async (req, res) => {
    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send("email already registered.");

    user = undefined;

    if (req.user.role === 'admin'){
        user = await User.findOneAndUpdate(
        {_id: req.params.id, schoolId: req.user.schoolId, role: 'student'},
        _.pick(req.body, ["name", "email"]) ,
        {new: true}
        );
    }

    else {
        user = await User.findOneAndUpdate(
            {_id: req.params.id},
            _.pick(req.body, ["name", "email", "role"]) ,
            {new: true}
        );
    }
    
    if (!user) return res.status(404).send("The user with the given ID was not found.");

    user.password = undefined;
    res.send(user);
});

router.delete("/:id", [auth, adminOrSuperAdmin, validateObjectId], async (req, res) => {
    if (req.user.role === 'admin'){
        user = await User.findOneAndDelete({_id: req.params.id, schoolId: req.user.schoolId, role: 'student'});
        if (!user) return res.status(404).send("The user with the given ID was not found.");
        return res.send(user);
    }
    
    user = await User.findOneAndDelete({_id: req.params.id});
    if (!user) return res.status(404).send("The user with the given ID was not found.");
    
    user.password = undefined;
    res.send(user);
});

module.exports = router;
