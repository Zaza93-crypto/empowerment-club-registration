# Empowerment Groups Registry — Cloudflare D1 version

This version replaces browser-only localStorage with a central Cloudflare D1 database.

## Folder structure

- index.html
- script.js
- styles.css
- functions/api/data.js
- schema.sql

## Cloudflare setup

1. In your Cloudflare Pages project, keep the D1 binding exactly as:
   - Variable name: `DB`
   - D1 database: `empowerment-registration-db`
2. In the D1 database console, run the complete contents of `schema.sql` once.
3. Upload/commit this whole project to the GitHub repository connected to your Pages project.
4. Redeploy Pages.
5. Open the website and register a test group.
6. Open the same website in another browser/device. The group should appear there too.

## Important

The `functions` folder must be in the project root. Cloudflare Pages uses file-based routing, so:
`functions/api/data.js` becomes `/api/data`.

Do not put the D1 database credentials in `script.js`. The browser calls `/api/data`, and the server-side Pages Function accesses the D1 binding as `env.DB`.

## Existing localStorage data

The old browser-only data is not automatically copied into D1 by this version. If you have important records in the old version, use its Backup All Data function first. The new version's Restore Backup function can restore a compatible JSON backup into D1.

## Security note

This version provides the database connection and basic server-side validation, but it does not yet include user authentication/role permissions. Anyone who can access the public API could potentially modify data. Add authentication before using it for sensitive production records.
