# Ezra — Daily Goals

A minimal daily-intent app with an embedded mentor chat (Ezra). Built with **Next.js 14 + Tailwind + Framer Motion**.

## Quick start

```bash
pnpm i   # or npm i / yarn
pnpm dev
```

Open http://localhost:3000

## Enable real Ezra responses

1. Copy `.env.local.example` to `.env.local`.
2. Add your `OPENAI_API_KEY`.
3. Restart the dev server.

## Deploy

- Vercel: push this repo, set `OPENAI_API_KEY` in project Environment Variables, deploy.
- Any Node host: `npm run build && npm start`

## Tests

```bash
pnpm test
```

## Notes

- If you prefer the public GPT UI, click **Open in Ezra** in the chat modal.
- All local data (entries/ratings) are stored in `localStorage`.
