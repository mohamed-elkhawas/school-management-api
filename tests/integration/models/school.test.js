const request = require('supertest');
const {seed} = require('../../seed_test');
const mongoose = require('mongoose');

let server;
let db;

describe('/api/school', () => {
    jest.useRealTimers();
    beforeAll(async () => { 
        try{ await require('../../../startups/redis').redisConnect();}catch(err){console.log(err);}
        db = await seed();
        server = require('../../../index');
        try{await request(server).get('/api');} catch{} 
    },30000);
    afterAll(async () => { await server.close(); },30000);

    describe('GET /', () => {
        it('should return all schools for superAdmin', async () => {

            token = db.usersAndTokens.tokens.superAdminToken;
            const res = await request(server).get('/api/school').set('x-auth-token', token);
            
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(3);
            
        },30000);

        it('should return a 403 for admin', async () => {

            token = db.usersAndTokens.tokens.adminToken;
            const res = await request(server).get('/api/school').set('x-auth-token', token);
            
            expect(res.status).toBe(403);
            
        },30000);
    });

    describe('GET /:id', () => {
        it('should return a school if valid id is passed', async () => {

            token = db.usersAndTokens.tokens.superAdminToken;
            school = db.schools[0];
            const res = await request(server).get('/api/school/' + school._id).set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', school.name);         
        });

        it('should return a school if valid id is passed and in the same school for admin', async () => {

            token = db.usersAndTokens.tokens.adminToken;
            school = db.schools[0];
            const res = await request(server).get('/api/school/' + school._id).set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', school.name);         
        });

        it('should return a 403 if valid id is passed and not the same school for admin', async () => {

            token = db.usersAndTokens.tokens.adminToken;
            school = db.schools[1];
            const res = await request(server).get('/api/school/' + school._id).set('x-auth-token', token);

            expect(res.status).toBe(403);
        });

        it('should return 404 if invalid id is passed', async () => {
            token = db.usersAndTokens.tokens.superAdminToken;
            const res = await request(server).get('/api/school/1').set('x-auth-token', token);

            expect(res.status).toBe(404);
        });

        it('should return 404 if no school with the given id exists', async () => {
            token = db.usersAndTokens.tokens.superAdminToken;
            const id = new mongoose.Types.ObjectId();
            const res = await request(server).get('/api/school/' + id).set('x-auth-token', token);

            expect(res.status).toBe(404);
        });
    });

    describe('POST /', () => {

        let token; 
        let newSchool;
         
        const exec = async () => {
            return await request(server)
                .post('/api/school')
                .set('x-auth-token', token)
                .send(newSchool);
        }

        beforeEach(() => {
            token = db.usersAndTokens.tokens.superAdminToken;            
            newSchool = { name: 'school_test' }; 
        })

        it('should return 401 if client is not logged in', async () => {
            token = ''; 

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if school is less than 5 characters', async () => {
            newSchool.name = '1234'; 
            
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if school is more than 50 characters', async () => {
            newSchool.name = new Array(52).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 403 if school is not a superAdmin', async () => {
            let res;
            token = db.usersAndTokens.tokens.adminToken;
            res = await exec();
            expect(res.status).toBe(403);
            
            token = db.usersAndTokens.tokens.studentToken;
            res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return the school if it is valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', newSchool.name);
        });
    });

    describe('PUT /:id', () => {
        let token; 
        let newName; 
        let id;

        const exec = async () => {
            return await request(server)
                .put('/api/school/' + id)
                .set('x-auth-token', token)
                .send({ name: newName });
        }

        beforeEach(() => {
            token = db.usersAndTokens.tokens.superAdminToken;  
            id = db.schools[0]._id;
            newName = 'newEditedSchoolName';      
        })

        it('should return 404 if the id wasn\'t found', async () => {
            id = new mongoose.Types.ObjectId();

            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return the updated school if it is valid', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', newName);
        });
    });    

    describe('DELETE /:id', () => {
        let token; 
        let id; 

        const exec = async () => {
            return await request(server)
                .delete('/api/school/' + id)
                .set('x-auth-token', token)
                .send();
        }

        beforeEach(async () => {
            token = db.usersAndTokens.tokens.superAdminToken;  
            id = db.schools[0]._id;        
        })

        it('should return the removed user', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });
        
        it('should return 404 if the id wasn\'t found', async () => {
            id = new mongoose.Types.ObjectId();

            const res = await exec();
            expect(res.status).toBe(404);
        });
    });    
});