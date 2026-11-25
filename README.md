# GamerPointMC Vercel frontend

Deploy this folder as its own Vercel project.

1. Edit `config.js` and replace `https://YOUR-BACKEND-DOMAIN.example.com` with your deployed backend URL (no trailing slash).
2. In Vercel, set Root Directory to `Vercel` (if this folder is at repository root, choose `Vercel`).
3. Framework Preset: Other.
4. Build Command: leave empty. Output Directory: `.`. Install Command: leave empty.
5. Deploy.

Checkout calls the backend at the URL in `config.js`. Do not put Discord tokens, RCON passwords, or other secrets in this folder. Everything in this folder is public.
