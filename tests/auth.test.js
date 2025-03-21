const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user.model');

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!',
          name: 'Test User',
          phone: {
            number: '+35799123456'
          }
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
    });
  });
});