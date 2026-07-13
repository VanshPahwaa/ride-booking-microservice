const request = require('supertest');
const app = require('../app'); // Ensure gateway/app.js exports the express app

// Mock express-http-proxy if needed, or just let it fail connecting to local services 
// and assert the appropriate error code. Since this is an integration test of the gateway,
// we might mock the proxy to return a standard response.

jest.mock('express-http-proxy', () => {
    return (host) => {
        return (req, res, next) => {
            // Mock proxy behavior based on the host
            if (host === process.env.USER_URL) {
                res.status(200).json({ proxied: 'user' });
            } else if (host === process.env.CAPTAIN_URL) {
                res.status(200).json({ proxied: 'captain' });
            } else if (host === process.env.RIDE_URL) {
                res.status(200).json({ proxied: 'ride' });
            } else {
                res.status(404).json({ message: 'Not found' });
            }
        };
    };
});

describe('Gateway API', () => {
    it('should proxy user requests', async () => {
        const res = await request(app).get('/user/profile');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ proxied: 'user' });
    });

    it('should proxy captain requests', async () => {
        const res = await request(app).get('/captain/profile');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ proxied: 'captain' });
    });

    it('should proxy ride requests', async () => {
        const res = await request(app).get('/ride/create-ride');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ proxied: 'ride' });
    });
});
