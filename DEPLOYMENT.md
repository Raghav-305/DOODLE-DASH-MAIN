# Deployment Guide

This guide covers deploying the DoodleGuess backend and frontend. The recommended setup is:

- Backend on Railway or Render
- Frontend on Vercel, Render Static Site, Netlify, or any static hosting provider

The backend must be deployed before the frontend environment variable can point to it.

## Required Environment Variables

Backend:

```env
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

Frontend:

```env
VITE_SOCKET_URL=https://your-backend-domain.com
```

Use exact origins. For example, `https://your-app.vercel.app` is different from `http://localhost:5173`.

## Backend on Railway

1. Push this repository to GitHub.
2. Create a new Railway project.
3. Choose `Deploy from GitHub repo`.
4. Set the Railway service root directory to:

```text
backend
```

5. Set environment variables:

```env
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

Railway automatically provides `PORT`. The backend reads `process.env.PORT`, so you do not need to hardcode it.

6. Use these commands if Railway asks:

```bash
npm install
npm run build
npm start
```

7. After deploy, open:

```text
https://your-railway-service.up.railway.app/health
```

You should see:

```json
{
  "status": "healthy",
  "uptime": 12.345,
  "rooms": 0,
  "players": 0
}
```

## Backend on Render

1. Push this repository to GitHub.
2. In Render, create a new `Web Service`.
3. Connect the GitHub repository.
4. Configure:

```text
Root Directory: backend
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
```

5. Set environment variables:

```env
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

Render provides `PORT`, and the backend uses it automatically.

6. Deploy and test:

```text
https://your-render-service.onrender.com/health
```

Important Render note: free web services can sleep after inactivity. First WebSocket connection after sleep may take longer while the service wakes.

## Frontend on Vercel

1. Create a new Vercel project from the GitHub repository.
2. Use the repository root as the project root.
3. Set build settings:

```text
Install Command: npm install
Build Command: npm run build
Output Directory: dist/client
```

4. Add environment variable:

```env
VITE_SOCKET_URL=https://your-backend-domain.com
```

5. Deploy.
6. Copy the Vercel domain and update backend `CORS_ORIGIN` with that exact URL.
7. Redeploy or restart the backend after changing `CORS_ORIGIN`.

## Frontend on Render Static Site

1. In Render, create a new `Static Site`.
2. Connect the GitHub repository.
3. Configure:

```text
Root Directory: .
Build Command: npm install && npm run build
Publish Directory: dist/client
```

4. Add environment variable:

```env
VITE_SOCKET_URL=https://your-backend-domain.com
```

5. Deploy.
6. Update backend `CORS_ORIGIN` to the Render static-site URL.

## Frontend on Netlify

1. Create a new Netlify site from GitHub.
2. Configure:

```text
Base directory: .
Build command: npm run build
Publish directory: dist/client
```

3. Add environment variable:

```env
VITE_SOCKET_URL=https://your-backend-domain.com
```

4. Deploy.
5. Update backend `CORS_ORIGIN` to the Netlify URL.

## Local Production Test

Build backend:

```bash
cd backend
npm run build
npm start
```

Build frontend:

```bash
npm run build
npm run preview
```

Then confirm:

```bash
curl http://localhost:4000/health
```

Open the frontend and check the browser console for:

```text
[socket] Connected to backend
```

## Deployment Checklist

Backend:
- `npm run build` passes in `backend/`
- `NODE_ENV=production` is set
- `CORS_ORIGIN` equals the deployed frontend origin
- `/health` returns `status: healthy`
- WebSocket connections are allowed by the platform

Frontend:
- `npm run build` passes
- `VITE_SOCKET_URL` equals the deployed backend URL
- Browser console shows `[socket] Connected to backend`
- Creating a room emits `create_room`
- Joining a room emits `join_room`
- Drawing emits `draw_stroke`
- Guessing emits `submit_guess`

## Common Issues

`CORS` or connection errors:
- Check that backend `CORS_ORIGIN` exactly matches the frontend URL.
- Include `https://`.
- Do not include a trailing slash.

Frontend connects locally but not in production:
- Confirm `VITE_SOCKET_URL` is set in the hosting provider.
- Rebuild the frontend after changing `VITE_SOCKET_URL`; Vite embeds env variables at build time.

Backend deploy succeeds but `/health` fails:
- Check service logs.
- Confirm the start command is `npm start`.
- Confirm the build command ran `npm run build`.

Socket connects but room events fail:
- Open the browser console and look for `[socket] emit` and `[socket] event`.
- Check backend logs for `[room]`, `[game]`, `[chat]`, and `[canvas]` entries.

Render backend sleeps:
- Use a paid Render instance or Railway if you need faster always-on WebSocket startup.

## Production Recommendations

- Use `CORS_ORIGIN=https://your-real-frontend-domain.com`, not `*`.
- Use a paid or always-on backend plan for stable multiplayer sessions.
- Keep backend and frontend on HTTPS.
- Add monitoring for `/health`.
- Avoid deploying frontend with `VITE_SOCKET_URL=http://localhost:4000`.
