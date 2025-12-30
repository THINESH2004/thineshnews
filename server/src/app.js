const express = require('express');
const fetch = require('node-fetch');
const FormData = require('form-data');

const rateLimit = require('express-rate-limit');
const { Queue, Worker, QueueScheduler } = require('bullmq');
const IORedis = require('ioredis');

// Durable queue backed by Redis (BullMQ)
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
// When using BullMQ with ioredis, `maxRetriesPerRequest` must be null to allow blocking commands
const redisOptions = { maxRetriesPerRequest: null };
// detect test environment early so we can avoid creating a real Redis connection
const runningInTest = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;
const redisConnection = runningInTest ? null : new IORedis(REDIS_URL, redisOptions);

let publishQueue;
let publishQueueScheduler = null;
let publishWorker = null;

// When running tests we avoid creating real BullMQ workers/queues because ioredis-mock
// does not fully implement the Lua environment used by BullMQ scripts. Use a simple
// in-memory stub in tests so enqueue/getJob behavior still works.
if (runningInTest) {
  const jobs = new Map();
  let idCounter = 1;
  publishQueue = {
    async add(name, data, opts) {
      const id = String(idCounter++);
      const job = { id, name, data, opts };
      jobs.set(id, job);
      return { id };
    },
    async getJob(id) {
      return jobs.get(String(id)) || null;
    },
    async close() {},
  };
} else {
  publishQueue = new Queue('publish', { connection: redisConnection });
  try {
    publishQueueScheduler = new QueueScheduler('publish', { connection: redisConnection });
  } catch (err) {
    // some Redis mocks or environments may not support all commands required by QueueScheduler
    console.warn('QueueScheduler not available in this environment:', err && err.message);
  }
}

async function publishToTelegram(job) {
  // job: { imageData?, caption?, text?, chatId? }
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = job.chatId || process.env.TELEGRAM_CHANNEL_ID || process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN) throw new Error('Missing TELEGRAM_BOT_TOKEN');
  if (!CHAT_ID) throw new Error('Missing chat id: set TELEGRAM_CHANNEL_ID/TELEGRAM_CHAT_ID or provide chatId in the job');

  const TELEGRAM_API_BASE = process.env.TELEGRAM_API_BASE || 'https://api.telegram.org';

  // If text-only message requested, use sendMessage
  if (job.text && !job.imageData) {
    const payload = { chat_id: CHAT_ID, text: (job.text || '').slice(0, 4096) };
    const url = `${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error('Telegram API error');
      err.details = json;
      console.error('Telegram API error response', json);
      throw err;
    }

    console.log('Telegram API response', json);
    return json;
  }

  // Otherwise expect an image and optionally a caption
  if (!job.imageData) throw new Error('Invalid publish: either image or text must be provided');

  const m = job.imageData.match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/);
  if (!m) throw new Error('Invalid image format');

  const mime = m[1];
  const b64 = m[3];
  const buf = Buffer.from(b64, 'base64');

  const form = new FormData();
  form.append('chat_id', CHAT_ID);
  form.append('caption', (job.caption || '').slice(0, 1024));
  form.append('photo', buf, { filename: 'template.png', contentType: mime });

  const url = `${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/sendPhoto`;

  const res = await fetch(url, { method: 'POST', body: form, headers: form.getHeaders() });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error('Telegram API error');
    err.details = json;
    console.error('Telegram API error response', json);
    throw err;
  }

  console.log('Telegram API response', json);
  return json;
}

if (!runningInTest) {
  // Worker to process publish jobs
  publishWorker = new Worker('publish', async (job) => {
    return await publishToTelegram(job.data);
  }, { connection: redisConnection, concurrency: 3 });

  publishWorker.on('completed', (job) => {
    console.log('Publish job completed', job.id);
  });

  publishWorker.on('failed', (job, err) => {
    console.error('Publish job failed', job.id, err && err.message);
  });
}

process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  if (publishWorker && publishWorker.close) await publishWorker.close();
  if (publishQueue && publishQueue.close) await publishQueue.close();
  if (publishQueueScheduler && publishQueueScheduler.close) await publishQueueScheduler.close();
  if (redisConnection && redisConnection.quit) redisConnection.quit();
  process.exit(0);
});

function stripToText(input = '') {
  return String(input || '').replace(/<[^>]*>/g, '').replace(/[\r\n]+/g, ' ').trim().slice(0, 1024);
}

function createApp() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  // Rate limiter middleware (apply to publish route)
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Auth middleware: either use WEBHOOK_SECRET header or WEBHOOK_API_KEY header
  function authMiddleware(req, res, next) {
    const secret = process.env.WEBHOOK_SECRET;
    const apiKey = process.env.WEBHOOK_API_KEY;

    const headerSecret = (req.headers['x-webhook-secret'] || '') + '';
    const headerApiKey = (req.headers['x-api-key'] || '') + '';

    if (secret && headerSecret === secret) return next();
    if (apiKey && headerApiKey === apiKey) return next();

    // if neither configured, allow but log (useful for dev)
    if (!secret && !apiKey) {
      console.warn('No webhook auth configured - accepting requests (dev)');
      return next();
    }

    return res.status(401).json({ error: 'Unauthorized' });
  }

  app.post('/publish', limiter, authMiddleware, async (req, res) => {
    try {
      const { image, caption, text, chatId } = req.body || {};

      if (!image && !text) {
        return res.status(400).json({ error: 'Missing publish content. Provide `image` (data URL) or `text` in request body.' });
      }

      if (image && typeof image !== 'string') {
        return res.status(400).json({ error: 'Invalid image: must be a data URL string.' });
      }

      // validate image format minimally when provided
      if (image) {
        const m = image.match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/);
        if (!m) return res.status(400).json({ error: 'Invalid image format. Provide data:image/png|jpeg;base64,...' });
      }

      const cleanCaption = stripToText(caption || '');
      const cleanText = stripToText(text || '');

      // enqueue for background processing (durable queue)
      const job = await publishQueue.add('publish-job', { imageData: image, caption: cleanCaption, text: cleanText, chatId: chatId }, { attempts: 5, backoff: { type: 'exponential', delay: 2000 } });

      return res.json({ success: true, queued: true, jobId: job.id });
    } catch (err) {
      console.error('Publish error', err && err.message);
      return res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/health', (req, res) => res.json({ ok: true }));

  // expose internals for testing
  app._publishQueue = publishQueue;
  app._publishWorker = publishWorker;
  app._redis = redisConnection;
  return app;
}

function startServerIfEnvReady(app, port) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN not set - server will not start listening (use in tests or set env vars)');
    return;
  }

  if (!process.env.TELEGRAM_CHANNEL_ID && !process.env.TELEGRAM_CHAT_ID) {
    console.warn('No default TELEGRAM_CHANNEL_ID or TELEGRAM_CHAT_ID set - server will start but publishes must include `chatId` in the request');
  }

  app.listen(port, () => {
    console.log(`Telegram webhook server listening on port ${port}`);
  });
}

module.exports = { createApp, startServerIfEnvReady };
