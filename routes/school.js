const validateObjectId = require("../middlewares/validateObjectId");
const auth = require("../middlewares/auth");
const superAdmin = require("../middlewares/superAdmin");
const adminOrSuperAdmin = require("../middlewares/adminOrSuperAdmin");
const validateMw = require("../middlewares/validate");
const { School, validate } = require("../models/school");
const express = require("express");
const router = express.Router();

router.get("/", [auth, superAdmin], async (req, res) => {
    schools = await School.find()
        .select("-__v")
        .sort("name");
    res.send(schools);
});

router.get("/:id", [auth, validateObjectId, adminOrSuperAdmin], async (req, res) => {
    const school = await School.findById(req.params.id).select("-__v");

    if (!school){
        return res.status(404).send("The school with the given ID was not found.");
    }

    if (req.user.role === 'admin' && school._id.toString() !== req.user.schoolId){
        return res.status(403).send("Access denied.");
    } 
    
    res.send(school);
});

router.post("/", [auth, superAdmin, validateMw(validate)], async (req, res) => {
 let school = new School({ name: req.body.name });
    school = await school.save();

    res.send(school);
});

router.put("/:id", [auth, superAdmin, validateObjectId, validateMw(validate)], async (req, res) => {
    const school = await School.findByIdAndUpdate(
        req.params.id,
        {name: req.body.name},
        {new: true}
    );

    if (!school)
        return res.status(404).send("The school with the given ID was not found.");

    res.send(school);
});

router.delete("/:id", [auth, superAdmin, validateObjectId], async (req, res) => {
    const school = await School.findOneAndDelete({_id: req.params.id});

    if (!school)
        return res.status(404).send("The school with the given ID was not found.");

    res.send(school);
});

module.exports = router;
