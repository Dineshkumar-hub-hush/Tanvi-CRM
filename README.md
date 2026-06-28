<<<<<<< HEAD
# TanviCRM Deployment

TanviCRM has a React/Vite frontend and a FastAPI backend.

## Frontend

Set this environment variable on your static host:

```text
VITE_API_BASE_URL=https://your-api-domain.com/api/v1
```

Build command:

```bash
npm install
npm run build
```

Publish directory:

```text
frontend/dist
```

The frontend includes `public/_redirects` so `/customers`, `/purchases`, and `/reports` refresh correctly on SPA hosts such as Netlify.

## Backend

Set these environment variables on your API host:

```text
DATABASE_URL=postgresql://user:password@host:5432/tanvi_crm
SECRET_KEY=use-a-long-random-production-secret
ADMIN_EMAIL=admin@example.com
ADMIN_NAME=Your Name
ADMIN_PASSWORD=use-a-strong-password
CORS_ORIGINS=https://your-frontend-domain.com
CORS_ORIGIN_REGEX=https://.*\\.vercel\\.app
```

Install and start:

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Production platforms that use `Procfile` can run:

```text
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Health check:

```text
GET /health
```

=======
# Tanvi-CRM
>>>>>>> 063a2cde043a7aab2bca11be1ae44e7891d575d4
