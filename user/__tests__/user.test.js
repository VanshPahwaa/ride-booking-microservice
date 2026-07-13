const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const userModel = require('../models/user.model');

// Mock rabbitmq and db connection to prevent real connections during app load
jest.mock('../service/rabbit', () => ({
    connect: jest.fn(),
    subscribeToExchange: jest.fn(),
    publishToExchange: jest.fn()
}));

jest.mock('../db/db', () => jest.fn());

const app = require('../app');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    // Clear the database after each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany();
    }
});

describe('User Service API', () => {
    let testUser = {
        name: { firstname: 'John', lastname: 'Doe' },
        email: 'john@example.com',
        password: 'password123'
    };

    describe('POST /register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/register')
                .send(testUser);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(testUser.email);
        });

        it('should fail validation without email', async () => {
            const res = await request(app)
                .post('/register')
                .send({
                    name: { firstname: 'John' },
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('errors');
        });
    });

    describe('POST /login', () => {
        beforeEach(async () => {
            // Register user before login test
            await request(app).post('/register').send(testUser);
        });

        it('should login an existing user successfully', async () => {
            const res = await request(app)
                .post('/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
        });

        it('should fail with incorrect password', async () => {
            const res = await request(app)
                .post('/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('message', 'Invalid email or password');
        });
    });

    describe('GET /profile', () => {
        let token;
        beforeEach(async () => {
            const res = await request(app).post('/register').send(testUser);
            token = res.body.token;
        });

        it('should fetch user profile with valid token', async () => {
            const res = await request(app)
                .get('/profile')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(testUser.email);
        });

        it('should fail without token', async () => {
            const res = await request(app).get('/profile');
            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('message', 'Unauthorized');
        });
    });
});
