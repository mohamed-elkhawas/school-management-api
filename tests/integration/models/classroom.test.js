const request = require('supertest');
const {seed} = require('../../seed_test');
const mongoose = require('mongoose');

let server;
let db;

describe('/api/classroom', () => {    
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
            const res = await request(server).get('/api/classroom').set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(8);
            
        },30000);

        it('should return a classrooms in admin\'s classroom', async () => {

            token = db.usersAndTokens.tokens.adminToken;
            const res = await request(server).get('/api/classroom').set('x-auth-token', token);
            
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(4);
            
        },30000);
    });

    describe('GET /:id', () => {
        it('should return a classroom if valid id is passed', async () => {

            token = db.usersAndTokens.tokens.superAdminToken;
            classroom = db.schools[0].classrooms[0];
            const res = await request(server).get('/api/classroom/' + classroom._id).set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', classroom.name);         
        });

        it('should return a classroom if valid id is passed and in the same school for admin', async () => {

            token = db.usersAndTokens.tokens.adminToken;
            classroom = db.schools[0].classrooms[0];
            const res = await request(server).get('/api/classroom/' + classroom._id).set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', classroom.name);         
        });

        it('should return a 403 if valid id is passed and not the same school for admin', async () => {

            token = db.usersAndTokens.tokens.adminToken;
            classroom = db.schools[1].classrooms[0];
            const res = await request(server).get('/api/classroom/' + classroom._id).set('x-auth-token', token);

            expect(res.status).toBe(403);
        });

        it('should return 404 if invalid id is passed', async () => {
            token = db.usersAndTokens.tokens.superAdminToken;
            const res = await request(server).get('/api/classroom/1').set('x-auth-token', token);

            expect(res.status).toBe(404);
        });

        it('should return 404 if no user with the given id exists', async () => {
            token = db.usersAndTokens.tokens.superAdminToken;
            const id = new mongoose.Types.ObjectId();
            const res = await request(server).get('/api/classroom/' + id).set('x-auth-token', token);

            expect(res.status).toBe(404);
        });
    });

    describe('POST /', () => {

        let token; 
        let newClassroom;
         
        const exec = async () => {
            return await request(server)
                .post('/api/classroom')
                .set('x-auth-token', token)
                .send(newClassroom);
        }

        beforeEach(() => {
            token = db.usersAndTokens.tokens.superAdminToken;            
            newClassroom = { name: 'classroom_test', schoolId: db.schools[0]._id }; 
        })

        it('should return 401 if client is not logged in', async () => {
            token = ''; 

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if classroom is less than 5 characters', async () => {
            newClassroom.name = '1234'; 
            
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if classroom is more than 50 characters', async () => {
            newClassroom.name = new Array(52).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 403 if classroom is student', async () => {
            token = db.usersAndTokens.tokens.studentToken;
            res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return the classroom if it is valid and superAdmin create it', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', newClassroom.name);
        });

        it('should return the classroom if it is valid and admin create it', async () => {
            token = db.usersAndTokens.tokens.adminToken;
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', newClassroom.name);
        });

        it('should return 403 if the admin is from another school', async () => {
            newClassroom.schoolId = db.schools[1]._id;
            token = db.usersAndTokens.tokens.adminToken;
            const res = await exec();

            expect(res.status).toBe(403);
        });
       
        it('should return 404 if the schoolId is invalid', async () => {
            newClassroom.schoolId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });
    });

    describe('PUT /:id', () => {
        let token; 
        let newName; 
        let id;

        const exec = async () => {
            return await request(server)
                .put('/api/classroom/' + id)
                .set('x-auth-token', token)
                .send({ name: newName });
        }

        beforeEach(() => {
            token = db.usersAndTokens.tokens.superAdminToken;  
            id = db.schools[0].classrooms[0]._id;
            newName = 'newEditedSchoolName';      
        })

        it('should return 404 if the id wasn\'t found', async () => {
            id = new mongoose.Types.ObjectId();

            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return the classroom if it is valid and superAdmin edited it', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', newName);
        });

        it('should return the classroom if it is valid and admin edited it', async () => {
            token = db.usersAndTokens.tokens.adminToken;
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', newName);
        });

        it('should return 404 if the admin is from another school', async () => {
            id = db.schools[1].classrooms[0]._id;
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
                .delete('/api/classroom/' + id)
                .set('x-auth-token', token)
                .send();
        }

        beforeEach(async () => {
            token = db.usersAndTokens.tokens.superAdminToken;  
            id = db.schools[0].classrooms[0]._id;       
        })
       
        it('should return 404 if the id wasn\'t found', async () => {
            id = new mongoose.Types.ObjectId();

            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 404 if the admin is from another school', async () => {
            id = db.schools[1].classrooms[0]._id;
            token = db.usersAndTokens.tokens.adminToken;
            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return the classroom if it is valid and admin deleted it', async () => {
            token = db.usersAndTokens.tokens.adminToken;
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
        });

        it('should return the classroom if it is valid and superAdmin deleted it', async () => {
            id = db.schools[1].classrooms[0]._id;
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
        });
    });    
});