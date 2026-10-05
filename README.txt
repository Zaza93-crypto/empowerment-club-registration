Lundazi Town Council Empowerment Admin — LINKED V1

This package is designed to be added to the EXISTING GitHub/Cloudflare project.
It does NOT replace the public registration website.

Existing architecture retained:
Public Pages -> empowerment-api Cloudflare Worker -> empowerment-registration-db (D1)

New architecture:
Admin Pages (/admin) -> same empowerment-api -> same D1

Files:
admin/admin.html
admin/admin.css
admin/admin.js
admin/lundazi-town-council-logo.jpg
database/admin_tables.sql
worker/admin_auth_additions.js

Deployment order:
1. Back up the current Worker code.
2. Run database/admin_tables.sql once on the existing D1 database.
3. Add the admin authentication functions to the existing empowerment-api Worker.
4. Configure Cloudflare Worker secrets:
   PRIMARY_ADMIN_USERNAME
   PRIMARY_ADMIN_PASSWORD
5. Upload the admin folder into the existing GitHub Pages/Cloudflare Pages project.
6. Open /admin/admin.html after deployment.
7. Log in using the primary credentials stored in Cloudflare secrets.
8. Create secondary users from User Management.

Important:
The public registration API remains usable by the existing website. Admin edits/deletes are authenticated.
Do not place passwords or Cloudflare secrets in GitHub.
