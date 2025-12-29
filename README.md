# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

## Telegram publishing (client)

You can enable client-triggered publishing to Telegram by setting an API endpoint in your environment: `VITE_TELEGRAM_API`.
The endpoint should accept a POST with JSON:

```json
{
  "image": "data:image/png;base64,...",
  "caption": "Sanitized headline text",
  "channelTemplate": "polimer|sun|jaya|null"
}
```

Note: the repository contains only the front-end flow by default. I added a minimal server webhook in `/server` that posts images to Telegram securely from the server using `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.

Follow `server/README.md` to install and run it, then set `VITE_TELEGRAM_API` to your running server URL (for example `http://localhost:3001/publish`).

I added a minimal server webhook at `/server` with the following safeguards and features:

- Authentication: support for `WEBHOOK_SECRET` (header `x-webhook-secret`) or `WEBHOOK_API_KEY` (header `x-api-key`). If neither is set, the server will accept requests but will log a warning (development only).
- Rate limiting: the `/publish` endpoint is rate-limited (30 requests per minute per IP).
- Job queue: an in-memory job queue with retry/backoff handles sending images to Telegram so the endpoint is fast and resilient. For production, replace or augment with a Redis-backed job queue (Bull, Bee-Queue, etc.).
- Tests: the server includes Jest + Supertest tests covering validation, auth, and enqueueing.
- CI: a GitHub Actions workflow runs the server tests on push/PR. (See `.github/workflows/server-ci.yml`.)

If you'd like, I can now:
1. Add Redis-backed job queue support (Bull) and optional durable persistence. ✅
2. Add authentication middleware tied to a user/service management system. ✅
3. Add logging, metrics, and rate-limit monitoring. ✅

Tell me which of those you'd like next.

## Channel templates

This project includes **inspired** channel templates (Polimer, Sun, Jaya). These are generic, non-branded designs intended as starting points. Do not use protected logos or trademarked assets without permission.
