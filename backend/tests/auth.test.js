const { setup } = require('./helpers');

describe('CE-1 student sign up and login', () => {
  let t;
  beforeEach(async () => {
    t = await setup();
  });

  test('a new student can register and is given a token', async () => {
    const res = await t.api
      .post('/api/auth/register')
      .send({ name: 'Kabir', email: 'Kabir@Test.local', password: 'kabir123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toMatchObject({ name: 'Kabir', email: 'kabir@test.local', role: 'student' });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test('registering the same email twice is rejected', async () => {
    const res = await t.api
      .post('/api/auth/register')
      .send({ name: 'Riya Again', email: 'riya@test.local', password: 'another1' });
    expect(res.status).toBe(409);
  });

  test.each([
    [{ email: 'a@b.co', password: 'secret1' }, 'missing name'],
    [{ name: 'X', email: 'not-an-email', password: 'secret1' }, 'bad email'],
    [{ name: 'X', email: 'x@y.co', password: '123' }, 'short password'],
  ])('registration validates input (%#: %s)', async (body) => {
    const res = await t.api.post('/api/auth/register').send(body);
    expect(res.status).toBe(400);
  });

  test('login fails with the wrong password', async () => {
    const res = await t.api.post('/api/auth/login').send({ email: 'riya@test.local', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('/me returns the logged-in user', async () => {
    const res = await t.api.get('/api/auth/me').set(t.student);
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Riya');
  });

  test('protected routes reject a missing or forged token', async () => {
    expect((await t.api.get('/api/auth/me')).status).toBe(401);
    expect((await t.api.get('/api/auth/me').set({ Authorization: 'Bearer forged' })).status).toBe(401);
  });
});
