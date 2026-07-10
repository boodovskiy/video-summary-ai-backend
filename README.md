# Video Summary AI backend

Strapi 5 backend for authentication, user credits, summary storage, and AI-powered YouTube transcript summarization.

## Requirements

- Node.js 20–22 (the production image uses Node.js 22)
- PostgreSQL in production or SQLite for local development
- An OpenAI API key
- A compatible transcript provider

Copy `.env.example` to `.env` and set the Strapi secrets plus:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
OPENAI_TIMEOUT_MS=45000
TRANSCRIPT_API_URL=https://example.com/yt-transcript
TRANSCRIPT_TIMEOUT_MS=15000
TRANSCRIPT_MAX_CHARS=160000
```

`TRANSCRIPT_API_URL` is a base URL. The requested YouTube video ID is appended as the final path segment.

## Summary generation API

`POST /api/summaries/generate` requires a Users & Permissions JWT.

```http
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "videoId": "dQw4w9WgXcQ"
}
```

On success, the backend fetches the transcript, generates a structured title and Markdown summary, publishes the summary document, and decrements one user credit atomically.

```json
{
  "data": {
    "documentId": "...",
    "videoId": "dQw4w9WgXcQ",
    "title": "...",
    "summary": "..."
  },
  "error": null
}
```

At startup, an idempotent bootstrap grants only `summary.generate` to the Authenticated role. The route remains unavailable to public users.

Expected errors include invalid video IDs (`400`), insufficient credits (`402`), missing transcripts (`422`), missing service configuration (`503`), and upstream transcript/OpenAI failures (`502`). API responses never expose provider error details or secrets.

## Development

```bash
npm install
npm run develop
```

Useful checks:

```bash
npm test
npm run build
```

## Deployment

The included `Dockerfile` installs from `package-lock.json`, builds the Strapi admin panel, and runs the production server on port `1337`. `fly.toml` is configured to auto-start a stopped machine when a request arrives.

Set production secrets with Fly before deployment, including all Strapi secrets, database settings, `OPENAI_API_KEY`, and transcript provider settings.
