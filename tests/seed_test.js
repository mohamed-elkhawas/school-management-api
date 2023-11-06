const { School } = require("../models/school");
const {User} = require('../models/user');
const mongoose = require("mongoose");
const config = require("config");
const bcrypt = require("bcrypt");
const {redisClient} = require('../startups/redis');

async function createUser (newUser){
    user = new User(newUser);
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();
    user.password = newUser.password;
    return user;
}

async function createUsers(schoolId, schoolId2, studentId, studentId2){

    let users = {};
    let newUser;
    let tokens = {};
        
    newUser = { name: 'superAdmin_test', role: 'superAdmin', email: 'abc@aa.com', password: 'password' };
    users.superAdmin = await createUser(newUser);
    tokens.superAdminToken = await user.generateAuthToken();
    
    newUser = { name: 'admin_test', role: 'admin', email: 'abcd@aa.com', password: 'password', schoolId: schoolId };
    users.admin = await createUser(newUser);
    tokens.adminToken = await user.generateAuthToken();
    
    newUser = { name: 'student_test', role: 'student', email: 'abcde@aa.com', password: 'password', schoolId: schoolId, studentId: studentId };
    users.student = await createUser(newUser); 
    tokens.studentToken = await user.generateAuthToken();

    newUser = { name: 'student2_test', role: 'student', email: 'abcdef@aa.com', password: 'password', schoolId: schoolId2, studentId: studentId2 };
    users.student2 = await createUser(newUser); 
    tokens.studentToken2 = await user.generateAuthToken();
    
    return {users,tokens};
}

async function seed() {

    await redisClient.flushAll('ASYNC');

    await mongoose.connect(config.get("mongoDB_url"));

    await School.deleteMany({});
    await User.deleteMany({});

    schoolsData = [
        {name:'schoolName1', classrooms:[
            {name:'classroomName1', students:[
                {name:'studentName1'},{name:'studentName2'}
            ]}, 
            {name:'classroomName2', students:[
                {name:'studentName3'},{name:'studentName4'}
            ]},
            {name:'classroomName3', students:[
                {name:'studentName5'},{name:'studentName6'}
            ]}, 
            {name:'classroomName4', students:[
                {name:'studentName7'},{name:'studentName8'}
            ]}
        ]},
        {name:'schoolName2', classrooms:[
            {name:'classroomName1', students:[
                    {name:'studentName1'},{name:'studentName2'}
            ]}, 
            {name:'classroomName2', students:[
                {name:'studentName3'},{name:'studentName4'}
            ]}
        ]},
        {name:'schoolName3', classrooms:[
            {name:'classroomName1', students:[
                    {name:'studentName1'},{name:'studentName2'}
            ]}, 
            {name:'classroomName2', students:[
                {name:'studentName3'},{name:'studentName4'}
            ]}
        ]}
    ]

    schools = [];

    for (let index = 0; index < schoolsData.length; index++) {
        const element = schoolsData[index];
        school = new School(element);
        await school.save();
        schools.push(school);
    }
    
    usersAndTokens = await createUsers(schools[0]._id, schools[1]._id, schools[0].classrooms[0].students[0]._id, schools[1].classrooms[0].students[0]._id);
 
    mongoose.disconnect();

    return {usersAndTokens, schools};
}

exports.seed = seed;
