const request = require('supertest');
const { createApp } = require('./app');

describe('POST /publish', () => {
  let app;
  beforeEach(() => {
    app = createApp();
  });

  test('rejects missing image', async () => {
    const res = await request(app).post('/publish').send({ caption: 'hello' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing image/);
  });

  test('rejects invalid image format', async () => {
    const res = await request(app).post('/publish').send({ image: 'data:bad,notbase64' });
    expect(res.status).toBe(400);
  });

  test('queues valid publish', async () => {
    const fakeImage = 'data:image/png;base64,' + Buffer.from('png').toString('base64');
    const res = await request(app).post('/publish').send({ image: fakeImage, caption: '<b>hi</b>' });
    expect(res.status).toBe(200);
    expect(res.body.queued).toBe(true);

    // ensure job queue has been enqueued
    expect(app._jobQueue.jobs.length).toBeGreaterThan(0);
  });

  test('requires auth when secret env set', async () => {
    process.env.WEBHOOK_SECRET = 'secret123';
    app = createApp();

    const fakeImage = 'data:image/png;base64,' + Buffer.from('png').toString('base64');
    const res = await request(app).post('/publish').send({ image: fakeImage });
    expect(res.status).toBe(401);

    const res2 = await request(app).post('/publish').set('x-webhook-secret', 'secret123').send({ image: fakeImage });
    expect(res2.status).toBe(200);

    delete process.env.WEBHOOK_SECRET;
  });
});
