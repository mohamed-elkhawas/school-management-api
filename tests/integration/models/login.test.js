const request = require('supertest');
const {User} = require('../../../models/user');
const {seed} = require('../../seed_test');

let server;
let db;

describe('/api/login', () => {
    jest.useRealTimers();
    beforeAll(async () => { 
        try{ await require('../../../startups/redis').redisConnect();}catch(err){console.log(err);}
        db = await seed();
        server = require('../../../index');
        try{await request(server).get('/api');} catch{} 
    },30000);
    afterAll(async () => {await server.close(); });

    describe('POST /', () => {

        let email;
        let password; 

        const exec = async () => {
            return await request(server)
                .post('/api/login')
                .send({email, password});
        }

        beforeEach(() => {
            password = db.usersAndTokens.users.superAdmin.password;            
            email = db.usersAndTokens.users.superAdmin.email; 
        })
        
        it('should return 200 and save the login if it is valid', async () => {
            const res = await exec();
            expect(res.status).toBe(200);

            const user = await User.find({ name: db.usersAndTokens.users.superAdmin.name });
            expect(user).not.toBeNull();
        });

        it('should return 400 is password is wrong', async () => {
            password = '123456'; 
            
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if email is wrong', async () => {
            email = '1234@123.com'; 
            
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if password is less than 5 characters', async () => {
            password = '1234'; 
            
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if password is more than 255 characters', async () => {
            password = new Array(257).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if email is not email formatted', async () => {
            email = new Array(27).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if more than 10 req made to the same email in 10 minutes', async () => {
            email = db.usersAndTokens.users.admin.email;
            password = db.usersAndTokens.users.admin.password;

            for (let i = 0; i < 10; i++) {
                const res = await exec();
                expect(res.status).toBe(200);
            }

            const res = await exec();
            expect(res.status).toBe(400);
        },30000);

        // it('should return 200 if request was sent after the 10 seconds', async () => {
        //     // edit the EX time to 10 istead of 600 first
        //     email = db.usersAndTokens.users.admin.email;
        //     password = db.usersAndTokens.users.admin.password;
        //     let res;
        //     await setTimeout( async ()=>{res = await exec(); expect(res.status).toBe(200);},10000);
        // },30000);
    });
});