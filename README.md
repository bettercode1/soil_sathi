# Soil Sathi

Modern React + Express application that delivers soil health insights, fertilizer recommendations, and a conversational farmer assistant powered by Gemini.

## Tech Stack

- Vite + React 18 + TypeScript
- Tailwind CSS & shadcn/ui
- Express API with Gemini integrations
- RAG knowledge base for contextual answers

## Getting Started

```bash
# install dependencies
npm install

# start both Vite dev server (port 8080) and Express API (port 3001)
npm run dev
```

Key scripts:

- `npm run dev`: run frontend and backend concurrently.
- `npm run build`: produce a production build (`dist/client` + `dist/server`).
- `npm run start`: serve the prebuilt app with Node.
- `npm run lint`: run ESLint across the project.

## Environment Variables

Create a `.env` file in `soil_sathi/` (or configure variables in Render) with the following keys:

- `PORT` (optional) – defaults to `3001`.
- `GEMINI_API_KEY` – required for Gemini-powered endpoints.
- `GEMINI_MODEL` – defaults to `gemini-2.5-flash`.
- `GEMINI_EMBED_MODEL` – defaults to `text-embedding-004`.
- `ALLOWED_ORIGINS` – comma-separated list for CORS (leave empty to accept any origin).
- `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX_REQUESTS` – optional rate-limit tuning.

## Production Build & Preview

```bash
npm run build
npm run start
```

The command above creates a static client build in `dist/client` and compiles the Express server to `dist/server`. The production server will serve both the API and the static assets on the same port.

## Deploying to Render

A ready-to-use `render.yaml` blueprint is included at the repository root.

1. Create a new Web Service from Render’s Blueprint option and point it to this repository.
2. Render will use the `render.yaml` file to:
   - Install dependencies and run the build (`npm install && npm run build`).
   - Start the Express server (`npm run start`).
   - Keep dev dependencies available during build (`NPM_CONFIG_PRODUCTION=false`).
3. Configure the environment variables above (especially `GEMINI_API_KEY`) in the Render dashboard.

Once the deployment succeeds, API routes will be available under `/api/*`, and the React SPA will be served from the same domain.
