GAMERPOINTMC MULTI-PAGE STORE

Pages:
- index.html: home, live status, server details, featured catalog
- ranks.html: Diamond, Ascendant, Immortal
- coins.html: coin packages
- tags.html: chat tags
- cart.html: persistent add-to-cart cart and Discord order summary
- how-to-order.html: ordering instructions

Setup:
1. Upload the entire GamerPointMC-MultiPage-Store folder contents to your web host's public folder, keeping assets/ intact.
2. The supplied GamerPointMC logo is in assets/gamerpointmc-logo.png.
3. Your supplied details are already configured:
   Discord: https://discord.gg/T8h5gp5fET
   Java: play.gamerpointmc.qzz.io
   Bedrock: pe.gamerpointmc.qzz.io port 443
4. Edit products.js to set real prices, coin quantities, and final rank/tag perks. Current prices say "Ask on Discord" because no exact prices were supplied.
5. Live player count and MOTD use the public mcsrvstat.us API and refresh once per minute.

Cart:
- Cart is saved in the visitor's browser using localStorage.
- Send Order copies a summary and opens your Discord invite.
- This is manual Discord checkout, not automatic payment processing or automatic rank delivery.
- Do not request Minecraft account passwords.

Host all files together on a static host such as GitHub Pages, Netlify, Cloudflare Pages, or normal web hosting.
