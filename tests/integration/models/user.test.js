const request = require('supertest');
const {seed} = require('../../seed_test');
const mongoose = require('mongoose');

let server;
let db ;

describe('/api/user', () => {
    jest.useRealTimers();
    beforeAll(async () => { 
        try{ await require('../../../startups/redis').redisConnect();}catch(err){console.log(err);}
        db = await seed();
        server = require('../../../index');
        try{await request(server).get('/api');} catch{} 
    },30000);
    afterAll(async () => { await server.close(); },30000);
 
    describe('GET /', () => {
        it('should return all users for superAdmin', async () => {

            token = db.usersAndTokens.tokens.superAdminToken;
            const res = await request(server).get('/api/user').set('x-auth-token', token);
            
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(4);
                 
            
        },30000);

        it('should return all student in school for admin', async () => {

            token = db.usersAndTokens.tokens.adminToken;
            const res = await request(server).get('/api/user').set('x-auth-token', token);
     
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            
        },30000);
    });

    describe('GET /:id', () => {
        it('should return a user if valid id is passed', async () => {

            token = db.usersAndTokens.tokens.superAdminToken;
            user = db.usersAndTokens.users.student;
            const res = await request(server).get('/api/user/' + user._id).set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', user.name);         
        });

        it('should return a user if valid id is passed and in the same school for admin', async () => {

            token = db.usersAndTokens.tokens.adminToken;
            user = db.usersAndTokens.users.student;
            const res = await request(server).get('/api/user/' + user._id).set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', user.name);         
        });

        it('should return 404 if invalid id is passed', async () => {
            token = db.usersAndTokens.tokens.superAdminToken;
            const res = await request(server).get('/api/user/1').set('x-auth-token', token);

            expect(res.status).toBe(404);
        });

        it('should return 404 if no user with the given id exists', async () => {
            token = db.usersAndTokens.tokens.superAdminToken;
            const id = new mongoose.Types.ObjectId();
            const res = await request(server).get('/api/user/' + id).set('x-auth-token', token);

            expect(res.status).toBe(404);
        });

        it('should return 403 if the student is not in the admin school', async () => {
            token = db.usersAndTokens.tokens.adminToken;
            const id = db.usersAndTokens.users.student2._id;
            const res = await request(server).get('/api/user/' + id).set('x-auth-token', token);

            expect(res.status).toBe(403);
        });
    });

    describe('POST /', () => {

        let token; 
        let newUser;
         
        const exec = async () => {
            return await request(server)
                .post('/api/user')
                .set('x-auth-token', token)
                .send( newUser );
        }

        beforeEach(() => {
            token = db.usersAndTokens.tokens.superAdminToken;            
            newUser = { name: 'superAdmin_test', role: 'superAdmin', email: 'a@aa.com', password: 'password' }; 
        })

        it('should return 401 if client is not logged in', async () => {
            token = ''; 
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 400 if user is less than 5 characters', async () => {
            newUser.name = '1234'; 
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if user is more than 50 characters', async () => {
            newUser.name = new Array(52).join('a');
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if user is more than 50 characters', async () => {
            newUser.email = 'abc@aa.com';
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 403 if admin tried to create superAdmin', async () => {
            token = db.usersAndTokens.tokens.adminToken; 
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 403 if admin tried to create admin', async () => {
            token = db.usersAndTokens.tokens.adminToken;
            newUser.role = 'admin';
            
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 403 if admin creats student in diff school', async () => {
            token = db.usersAndTokens.tokens.adminToken;
            newUser.role = 'student';
            newUser.schoolId = db.schools[1]._id.toString();
            newUser.studentId = db.schools[1].classrooms[0].students[0]._id.toString();
            
            const res = await exec();
            expect(res.status).toBe(403);
        });
        
        it('should return 404 if school wasn\'t found', async () => { 
            newUser.role = 'student';
            newUser.email = 'reallynewemail@new.com';
            newUser.schoolId = db.schools[0].classrooms[0].students[0]._id.toString(); // not valid schoolId
            newUser.studentId = db.schools[0].classrooms[0].students[0]._id.toString();
            
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 404 if student wasn\'t found', async () => { 
            token = db.usersAndTokens.tokens.adminToken;
            newUser.role = 'student';
            newUser.email = 'reallynewemail@new.com';
            newUser.schoolId = db.schools[0]._id.toString();
            newUser.studentId = db.schools[0]._id.toString();// not valid studentId
            
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return the user if admin creats student in his school', async () => { 
            token = db.usersAndTokens.tokens.adminToken;
            newUser.name = 'new_student';
            newUser.role = 'student';
            newUser.email = 'reallynewemail@new.com';
            newUser.schoolId = db.schools[0]._id.toString();
            newUser.studentId = db.schools[0].classrooms[0].students[0]._id.toString();
            
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).not.toHaveProperty('password');
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', newUser.name);
        });

        it('should return the user if it is valid', async () => {
            const res = await exec();
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', newUser.name);
        });

        it('should return the user if it is valid', async () => {
            newUser.email = 'isItNew@mail.com';
            newUser.role = 'student';
            newUser.schoolId = db.schools[1]._id.toString();
            newUser.studentId = db.schools[1].classrooms[0].students[0]._id.toString();

            const res = await exec();
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', newUser.name);
        });

        it('should return the user if it is valid', async () => {
            newUser.email = 'isItNew2@mail.com';
            newUser.role = 'admin';
            newUser.schoolId = db.schools[1]._id.toString();
            newUser.studentId = db.schools[1].classrooms[0].students[0]._id.toString();

            const res = await exec();
            expect(res.body).not.toHaveProperty('password');
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', newUser.name);
        });
    });

    describe('PUT /:id', () => {
        let token; 
        let editedUser;
        let id;
        
        const exec = async () => {
            return await request(server)
                .put('/api/user/'+ id)
                .set('x-auth-token', token)
                .send( editedUser );
        }

        beforeEach(() => {
            token = db.usersAndTokens.tokens.superAdminToken;
            id = db.usersAndTokens.users.student._id.toString();            
            editedUser = { 
                name: 'edited_student_test', role: 'student', email: 'thatIsAGreatEmail@aa.com',
                schoolId: db.schools[0]._id.toString(),
                studentId: db.schools[0].classrooms[0].students[0]._id.toString() 
            }; 
        })

        it('should return 401 if client is not logged in', async () => {
            token = ''; 
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 400 if user is less than 5 characters', async () => {
            editedUser.name = '1234'; 
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if user is more than 50 characters', async () => {
            editedUser.name = new Array(52).join('a');
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 404 if admin tried to edit superAdmin', async () => {
            token = db.usersAndTokens.tokens.adminToken; 
            id = db.usersAndTokens.users.superAdmin._id.toString();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 404 if admin tried to edit admin', async () => {
            token = db.usersAndTokens.tokens.adminToken; 
            id = db.usersAndTokens.users.admin._id.toString();
            
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 404 if admin tried to edit student in diff school', async () => {
            token = db.usersAndTokens.tokens.adminToken; 
            id = db.usersAndTokens.users.student2._id.toString();
            
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 400 if the email is registered', async () => {
            editedUser.email = 'abc@aa.com';
            const res = await exec();
            expect(res.status).toBe(400);
        });


        it('should return 404 if no id found', async () => {
            id = db.schools[0]._id.toString(); // not valid userId
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return the user if admin edit student in his school', async () => {
            token = db.usersAndTokens.tokens.adminToken;
            editedUser.email = 'realynewemail@new.com';
            editedUser.name = 'edited_student_name';
            
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', editedUser.name);
        });

        it('should return the user if it is valid', async () => {
            editedUser.email = 'realynotnewemail@new.com';
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).not.toHaveProperty('password');
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', editedUser.name);
        });
    });    

    describe('DELETE /:id', () => {
        let token; 
        let id; 

        const exec = async () => {
            return await request(server)
                .delete('/api/user/' + id)
                .set('x-auth-token', token)
                .send();
        }

        beforeEach(async () => {
            token = db.usersAndTokens.tokens.superAdminToken;
            id = db.usersAndTokens.users.student._id.toString();           
        })

        it('should return 404 if no user with the given id was found', async () => {
            id = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 404 if the user is not in the admin\'s school', async () => {
            token = db.usersAndTokens.tokens.adminToken;
            id = db.usersAndTokens.users.student2._id.toString(); 
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 200 if the user is in the admin\'s school', async () => {
            token = db.usersAndTokens.tokens.adminToken;
            id = db.usersAndTokens.users.student._id.toString(); 
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id', id);
            expect(res.body).toHaveProperty('name');
        });

        it('should return the removed user', async () => {
            id = db.usersAndTokens.users.student2._id.toString();
            const res = await exec();
            expect(res.body).toHaveProperty('_id', id);
            expect(res.body).toHaveProperty('name');
        });
    });    
});