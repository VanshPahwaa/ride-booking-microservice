const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const rideModel = require('../models/ride.model');

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
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany();
    }
});

describe('Ride Service API', () => {
    let testRide = {
        pickup: '123 Main St',
        destination: '456 Oak Ave'
    };
    
    // In actual tests, we need a valid token. For this unit test mock,
    // we may need to mock the authentication middleware if it exists.
    
    describe('POST /create-ride', () => {
        it('should require authentication', async () => {
            const res = await request(app)
                .post('/create-ride')
                .send(testRide);

            expect(res.statusCode).toEqual(401); // Unauthorized
        });
        
        // Detailed mocking of the 'auth' middleware is necessary to fully test this route
        // This acts as a placeholder for the actual implemented logic
    });

    describe('PUT /accept-ride', () => {
        it('should require authentication', async () => {
            const res = await request(app)
                .put('/accept-ride')
                .query({ rideId: '12345' });

            expect(res.statusCode).toEqual(401); // Unauthorized
        });
    });
});
