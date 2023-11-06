const request = require('supertest');
const {seed} = require('../../seed_test');

let server;
let db;

describe('/api/logout', () => {
    jest.useRealTimers();
    beforeAll(async () => { 
        try{ await require('../../../startups/redis').redisConnect();}catch(err){console.log(err);}
        db = await seed();
        server = require('../../../index');
        try{await request(server).get('/api');} catch{} 
    },30000);
    afterAll(async () => {await server.close();});

    describe('GET /', () => {

        let token;

        const exec = async () => {
            return await request(server)
                .get('/api/logout')
                .set('x-auth-token', token);
        }

        beforeEach(() => {
            token = db.usersAndTokens.tokens.superAdminToken;            
        })
     
        it('should return 200 and if the token is valid and 400 if not', async () => {
            let res = await request(server).get('/api/user/me').set('x-auth-token', token);
            expect(res.status).toBe(200);

            res = await exec();
            expect(res.status).toBe(200);

            res = await exec();
            expect(res.status).toBe(400);

            res = await request(server).get('/api/user').set('x-auth-token', token);
            expect(res.status).toBe(400);

        });

        it('should return 401 if no token', async () => {
            token = ''; 
            
            const res = await exec();
            expect(res.status).toBe(401);
        });
    });
});