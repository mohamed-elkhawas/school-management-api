const request = require('supertest');
const {seed} = require('../../seed_test');
const mongoose = require('mongoose');

let server;
let db;

describe('/api/student', () => {    
    jest.useRealTimers();
    beforeAll(async () => { 
        try{ await require('../../../startups/redis').redisConnect();}catch(err){console.log(err);}
        db = await seed();
        server = require('../../../index');
        try{await request(server).get('/api');} catch{} 
    },30000);
    afterAll(async () => {await server.close();});

    describe('GET /', () => {
        it('should return all classrooms for superAdmin', async () => {

            token = db.usersAndTokens.tokens.superAdminToken;
            const res = await request(server).get('/api/student').set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(16);
            
        },30000);

        it('should return a students in admin\'s classroom', async () => {

            token = db.usersAndTokens.tokens.adminToken;
            const res = await request(server).get('/api/student').set('x-auth-token', token);
            
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(8);
            
        },30000);
    });

    describe('GET /:id', () => {
        it('should return a student if valid id is passed', async () => {

            token = db.usersAndTokens.tokens.superAdminToken;
            student = db.schools[0].classrooms[0].students[0];
            const res = await request(server).get('/api/student/' + student._id).set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', student.name);         
        });

        it('should return a student if valid id is passed and in the same school for admin', async () => {

            token = db.usersAndTokens.tokens.adminToken;
            student = db.schools[0].classrooms[0].students[0];
            const res = await request(server).get('/api/student/' + student._id).set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', student.name);         
        });

        it('should return the student profile', async () => {

            token = db.usersAndTokens.tokens.studentToken;
            student = db.schools[0].classrooms[0].students[0];
            const res = await request(server).get('/api/student/' + student._id).set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', student.name);         
        });

        it('should return a 403 if the student want to see other', async () => {

            token = db.usersAndTokens.tokens.studentToken;
            student = db.schools[0].classrooms[0].students[1];
            const res = await request(server).get('/api/student/' + student._id).set('x-auth-token', token);

            expect(res.status).toBe(403);
        });

        it('should return a 403 if valid id is passed and not the same school for admin', async () => {

            token = db.usersAndTokens.tokens.adminToken;
            student = db.schools[1].classrooms[0].students[0];
            const res = await request(server).get('/api/student/' + student._id).set('x-auth-token', token);

            expect(res.status).toBe(403);
        });

        it('should return 404 if invalid id is passed', async () => {
            token = db.usersAndTokens.tokens.superAdminToken;
            const res = await request(server).get('/api/student/1').set('x-auth-token', token);

            expect(res.status).toBe(404);
        });

        it('should return 404 if no user with the given id exists', async () => {
            token = db.usersAndTokens.tokens.superAdminToken;
            const id = new mongoose.Types.ObjectId();
            const res = await request(server).get('/api/student/' + id).set('x-auth-token', token);

            expect(res.status).toBe(404);
        });
    });

    describe('POST /', () => {

        let token; 
        let newStudent;
         
        const exec = async () => {
            return await request(server)
                .post('/api/student')
                .set('x-auth-token', token)
                .send(newStudent);
        }

        beforeEach(() => {
            token = db.usersAndTokens.tokens.superAdminToken;            
            newStudent = { name: 'student_test', schoolId: db.schools[0]._id, classroomId: db.schools[0].classrooms[0]._id}; 
        })

        it('should return 401 if client is not logged in', async () => {
            token = ''; 

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if student is less than 5 characters', async () => {
            newStudent.name = '1234'; 
            
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if student is more than 50 characters', async () => {
            newStudent.name = new Array(52).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 403 if student is student', async () => {
            token = db.usersAndTokens.tokens.studentToken;
            res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 403 if the admin is from another school', async () => {
            newStudent.schoolId = db.schools[1]._id;
            token = db.usersAndTokens.tokens.adminToken;
            const res = await exec();

            expect(res.status).toBe(403);
        });
       
        it('should return 404 if the schoolId is invalid', async () => {
            newStudent.schoolId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return the student if it is valid and superAdmin create it', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', newStudent.name);
        });

        it('should return the student if it is valid and admin create it', async () => {
            token = db.usersAndTokens.tokens.adminToken;
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', newStudent.name);
        });
    });

    describe('PUT /:id', () => {
        let token; 
        let newName; 
        let id;

        const exec = async () => {
            return await request(server)
                .put('/api/student/' + id)
                .set('x-auth-token', token)
                .send({ name: newName });
        }

        beforeEach(() => {
            token = db.usersAndTokens.tokens.superAdminToken;  
            id = db.schools[0].classrooms[0].students[0]._id;
            newName = 'newEditedSchoolName';      
        })

        it('should return 404 if the id wasn\'t found', async () => {
            id = new mongoose.Types.ObjectId();

            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return the student if it is valid and superAdmin edited it', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', newName);
        });

        it('should return the student if it is valid and admin edited it', async () => {
            token = db.usersAndTokens.tokens.adminToken;
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', newName);
        });

        it('should return 404 if the admin is from another school', async () => {
            id = db.schools[1].classrooms[0].students[0]._id;
            token = db.usersAndTokens.tokens.adminToken;
            const res = await exec();

            expect(res.status).toBe(404);
        });
    });    

    describe('DELETE /:id', () => {
        let token; 
        let id; 

        const exec = async () => {
            return await request(server)
                .delete('/api/student/' + id)
                .set('x-auth-token', token)
                .send();
        }

        beforeEach(async () => {
            token = db.usersAndTokens.tokens.superAdminToken;  
            id = db.schools[0].classrooms[0].students[0]._id;       
        })
       
        it('should return 404 if the id wasn\'t found', async () => {
            id = new mongoose.Types.ObjectId();

            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 404 if the admin is from another school', async () => {
            id = db.schools[1].classrooms[0].students[0]._id;
            token = db.usersAndTokens.tokens.adminToken;
            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return the student if it is valid and admin deleted it', async () => {
            token = db.usersAndTokens.tokens.adminToken;
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
        });

        it('should return the student if it is valid and superAdmin deleted it', async () => {
            id = db.schools[1].classrooms[0].students[0]._id;
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
        });
    });    
});