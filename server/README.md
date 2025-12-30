# Telegram webhook (server)

This small Express server accepts the client payload (image data URL + caption) and posts it to the Telegram Bot API using a server-side bot token.

Setup
1. Copy `.env.example` to `.env` and fill in your `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
2. (Optional) Set `WEBHOOK_SECRET` to require clients to include `x-webhook-secret` header.
3. Install dependencies and start the server:

```sh
cd server
npm install
npm start
```

Client configuration
- Set `VITE_TELEGRAM_API` to the server URL, for example: `http://localhost:3001/publish`.
- Optionally set `VITE_TELEGRAM_SECRET` in your client env so the client will include `x-webhook-secret` header (note: putting a secret into a client env will make it visible to the client). Prefer session-based or server-controlled auth in production.

Quick test using curl
--------------------
Once the server is running (and `.env` populated) you can test publishing with curl. Replace `BASE_URL` and `TELEGRAM_SECRET` as needed:

```sh
# send a fake PNG (base64 for "png") with optional secret header
curl -v -X POST $BASE_URL/publish \
	-H "Content-Type: application/json" \
	-H "x-webhook-secret: $TELEGRAM_SECRET" \
	-d '{"image":"data:image/png;base64,iVBORw0KGgo=","caption":"Test publish from local"}'

# send a text-only publish to a specific channel username (override default)
curl -v -X POST $BASE_URL/publish \
	-H "Content-Type: application/json" \
	-H "x-webhook-secret: $TELEGRAM_SECRET" \
	-d '{"chatId":"@newaithinesh","text":"News"}'

# or set TELEGRAM_CHANNEL_ID in your .env to make it the default destination
curl -v -X POST $BASE_URL/publish \
	-H "Content-Type: application/json" \
	-H "x-webhook-secret: $TELEGRAM_SECRET" \
	-d '{"text":"News"}'
```
If the request succeeds you will receive JSON like:

```json
{ "success": true, "queued": true, "jobId": "1" }
```

Security notes
- Do not store Telegram bot tokens in client-side code. Keep them on the server.
- Consider rate limiting, authentication, logging, and anti-abuse measures for production.
