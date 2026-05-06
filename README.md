# Diet System — Simple Auth Backend

This project adds a small Express + MongoDB backend to store user credentials and exposes two endpoints used by the frontend:

- POST /api/register — register a new user (body: { username, email, password })
- POST /api/login — authenticate user (body: { email, password })

The client-side `jquery/auth.js` is updated to call those endpoints. If the backend is unreachable, it falls back to the previous localStorage-based behavior for demo/offline use.

Quick start (Windows PowerShell):

1. Install dependencies:

```powershell
cd "c:\Users\sjaga\Desktop\Projects\Diet System"
npm install
```

2. Configure MongoDB connection (optional): copy `.env.example` to `.env` and edit `MONGO_URI` if you're using a hosted MongoDB instance.

3. Start local MongoDB (if not using a hosted DB). For local development you can run a local MongoDB server or use a Docker container.

4. Start the backend:

```powershell
npm start
# or for auto-reload during development:
npm run dev
```

5. Open the client pages in a browser (e.g., `html/register.html` and `html/login.html`). By default the frontend will talk to `http://localhost:3000/api`.

Notes:
- Passwords are hashed with bcrypt on the server.
- The server returns a simple session object; no JWT or cookies are implemented (keeps the example small). You can extend the server to issue JWTs if you need authentication for protected API routes.
