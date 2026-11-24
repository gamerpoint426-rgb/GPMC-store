# GamerPointMC Store Pro

A responsive multi-section Minecraft store with a Node.js backend, player store accounts, cart, server status/ping, coupon validation, order records and an admin panel.

## Included catalogue

### Ranks
- Diamond — ₹39, 35 days (30 + 5 bonus), +50 bonus coins
- Ascendant — ₹59, 35 days (30 + 5 bonus), +100 bonus coins
- Immortal — ₹69, 35 days (30 + 5 bonus), +150 bonus coins

### Coins
- 500 — ₹19
- 1,000 — ₹35 + 50 bonus
- 2,500 — ₹49 + 250 bonus
- 5,000 — ₹89 + 600 bonus
- 10,000 — ₹149 + 1,500 bonus

### Permanent tags
- PHANTOM ₹19; GHOST ₹29; SPECTRE ₹29; APEX ₹39; ODIN ₹39; OMEGA ₹49
- Complete collection ₹149 (individual total ₹204; saves ₹55)

The additional coin packs, coin bonuses and rank benefits are suggested store offers, not confirmed game/plugin capabilities. Update `products` in `server.js` to match what your server can actually deliver before launch.

## Run locally

1. Install Node.js 22.x (recommended for the included `better-sqlite3` native module).
2. Extract the ZIP.
3. Copy `.env.example` to `.env`.
4. Change `SESSION_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `.env` to unique strong values. Never deploy with the example credentials.
5. Run `npm install`.
6. Run `npm start`.
7. Open `http://localhost:3000`.

The database `store.db` is created automatically. Back it up regularly.

## Deploying to Vercel

The project pins Node.js to 22.x because the included `better-sqlite3` native addon is not compatible with the Node.js 26 runtime shown in some Vercel build logs. Commit the updated `package.json`, `.nvmrc`, and `.npmrc`, then redeploy. In Vercel Project Settings → General → Node.js Version, select Node.js 22.x if the setting is available.

**Persistence warning:** this app currently uses a local SQLite file (`store.db`) and Express in-memory sessions. Vercel Functions have ephemeral filesystem/runtime instances, so local SQLite data and sessions are not durable across deployments or instances. A successful install/build does not make this production-safe on Vercel. Before accepting real customer accounts or orders, move the database to a persistent hosted database (for example, Postgres) and sessions to a persistent store, or deploy this Node server on a persistent Node host with a persistent disk.

## Admin panel

Click **Staff** in the footer, then log in with `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`. Admin can view orders, update their status, create fixed/percentage coupons, and enable/disable coupons.

## Important limitations before public launch

- This is an order-request store. It does not collect payment, integrate UPI/Razorpay, or automatically deliver items in Minecraft. Staff must verify payment and fulfill orders manually.
- Player login is a separate store account using email/password and a Minecraft username. It does **not** prove ownership of that Minecraft account. Never ask players for their Microsoft/Minecraft password. For verified linking, add a one-time in-game code flow with a companion Paper/Velocity plugin.
- The current order state is recorded server-side. The included default Express session store is suitable for testing only; use a persistent session store (Redis or a compatible database store) for production and deploy behind HTTPS.
- Server status/ping checks Java. It does not test an individual visitor's network ping or Bedrock reachability. Browser-based ping to a Minecraft TCP port is not directly available; the displayed latency is measured from the website server.
- Rank perks shown are suggested marketing copy. Confirm/configure the actual LuckPerms groups, durations, coin credit and permissions before advertising them as guaranteed benefits.
- No refund policy is pre-decided. Publish your real terms, support contact and delivery time before taking payments.

## Configure server details

Edit `.env`: `JAVA_HOST`, `JAVA_PORT`, `BEDROCK_HOST`, `BEDROCK_PORT`, and `DISCORD_INVITE`. The current frontend displays the supplied Java/Bedrock addresses. The ping endpoint queries the Java server from the store host.

## Customizing products

Edit the `products` array near the top of `server.js`. Prices are in whole INR. For ranks, `days` and `bonusCoins` are descriptive metadata; they are not automatically granted by this app. For coin packs, `coins` and `bonus` are descriptive until a delivery integration is added.
