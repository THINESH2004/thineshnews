const request = require('supertest');
// Use ioredis-mock so tests do not require a real Redis server
jest.mock('ioredis', () => require('ioredis-mock'));
const { createApp } = require('./app');

describe('POST /publish', () => {
  let app;
  beforeEach(() => {
    app = createApp();
  });

  test('rejects missing publish content', async () => {
    const res = await request(app).post('/publish').send({ caption: 'hello' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing publish content/);
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

    // ensure job was enqueued (BullMQ exposes job retrieval)
    const job = await app._publishQueue.getJob(res.body.jobId);
    expect(job).not.toBeNull();
  });

  test('queues text-only publish', async () => {
    const res = await request(app).post('/publish').send({ text: '1,2,3,4,5' });
    expect(res.status).toBe(200);
    expect(res.body.queued).toBe(true);

    const job = await app._publishQueue.getJob(res.body.jobId);
    expect(job).not.toBeNull();
    expect(job.data.text).toBe('1,2,3,4,5');
  });

  test('allows chatId override per request', async () => {
    const res = await request(app).post('/publish').send({ text: 'hello', chatId: '@newaithinesh' });
    expect(res.status).toBe(200);
    expect(res.body.queued).toBe(true);

    const job = await app._publishQueue.getJob(res.body.jobId);
    expect(job).not.toBeNull();
    expect(job.data.chatId).toBe('@newaithinesh');
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
