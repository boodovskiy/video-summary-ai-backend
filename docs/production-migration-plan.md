# Production migration plan

Last updated: 2026-07-10

## Current state

- The backend is deployed to `backend-wispy-fire-4184.fly.dev`.
- Production currently uses SQLite at `/data/data.db` on the Fly volume.
- The deploy workflow explicitly stages `DATABASE_CLIENT=sqlite` and
  `DATABASE_FILENAME=/data/data.db` before every deployment.
- The previous PostgreSQL configuration was unreachable. Its data has not been
  migrated into the current SQLite database.
- Summary generation requires an OpenAI API key and a transcript provider.

## Target state

Use a managed PostgreSQL database as the production source of truth. Keep the
current SQLite database and its backup available as a rollback target until the
PostgreSQL deployment has been stable for several days.

## Migration phases

### 1. Recover and inspect the old PostgreSQL database

1. Identify the old database provider and project.
2. Recover or rotate its connection credentials outside GitHub and chat.
3. Confirm that the database is reachable.
4. Create and validate a `pg_dump` backup.
5. Record counts for users, summaries, roles, permissions, and credit fields.

If the old database is unavailable, document that outcome and continue with a
new empty PostgreSQL database plus any recoverable SQLite records.

### 2. Provision the target PostgreSQL database

1. Create a managed PostgreSQL database near the Fly `fra` region.
2. Enable provider backups and point-in-time recovery when available.
3. Create a dedicated application user with access only to the application
   database and schema.
4. Restore the old PostgreSQL backup into a non-production rehearsal database.
5. Store the new connection details only in the deployment secret store.

### 3. Rehearse the migration

1. Start the current Strapi version against the rehearsal database.
2. Allow Strapi database migrations to complete.
3. Verify existing users can authenticate.
4. Verify user credits, summaries, roles, and permissions.
5. Compare record counts with the pre-migration inventory.
6. Check whether `/data/data.db` contains new records that need to be merged.
7. Test summary generation and confirm exactly one credit is deducted.

Do not merge databases by copying raw rows until primary keys, Strapi document
IDs, relations, password hashes, and unique fields have been checked for
collisions.

### 4. Prepare the production cutover

1. Announce a short maintenance window and prevent new writes.
2. Back up the old PostgreSQL database again.
3. Copy `/data/data.db` to a separate backup location.
4. Import any approved SQLite-only records into the target PostgreSQL database.
5. Remove the deploy step that currently forces SQLite.
6. Configure production PostgreSQL secrets appropriate for the provider:

   ```env
   DATABASE_CLIENT=postgres
   DATABASE_URL=postgresql://...
   DATABASE_SSL=true
   DATABASE_SSL_REJECT_UNAUTHORIZED=true
   ```

   `DATABASE_SSL` and certificate verification settings must match the selected
   provider. Never commit `DATABASE_URL`.

### 5. Deploy and validate

1. Deploy the backend with the PostgreSQL configuration.
2. Confirm `GET /_health` returns HTTP `204`.
3. Test registration, login, and an existing user login.
4. Verify existing summaries and credit balances.
5. Generate one real summary through the frontend.
6. Confirm the saved summary is published and exactly one credit is deducted.
7. Review Fly and Strapi logs for database, transcript, and OpenAI errors.
8. Recheck the migration record counts.

### 6. Rollback and retirement

If validation fails:

1. Stop production writes.
2. Restore the previous deployment configuration.
3. Point the backend back to `/data/data.db`.
4. Verify health and authentication before reopening writes.
5. Preserve the failed PostgreSQL database for diagnosis.

After several stable production days, retain final backups according to the
chosen retention policy and retire obsolete database resources and credentials.

## Owner checklist

### Database

- [ ] Decide whether the old PostgreSQL data must be recovered.
- [ ] Locate the old database provider and project.
- [ ] Recover the connection details or rotate the database password.
- [ ] Select and provision the target PostgreSQL provider and region.
- [ ] Confirm whether the current SQLite database contains important new data.
- [ ] Choose a maintenance window.
- [ ] Do not paste connection strings or passwords into GitHub issues or chat.

Fly secrets are write-only. A secret name can be listed, but its previous value
cannot be retrieved from Fly.

### OpenAI

- [ ] Create a project API key at <https://platform.openai.com/api-keys>.
- [ ] Configure API billing and an appropriate project budget.
- [ ] Add `OPENAI_API_KEY` to the Fly app secrets.
- [ ] Optionally set `OPENAI_MODEL`; the backend defaults to `gpt-5.4-mini`.
- [ ] Optionally set `OPENAI_TIMEOUT_MS`; the backend defaults to `45000`.
- [ ] Never commit or log the API key.

### Transcript provider

- [ ] Select or confirm the transcript provider.
- [ ] Confirm that `<TRANSCRIPT_API_URL>/<youtube-video-id>` returns plain text.
- [ ] Add `TRANSCRIPT_API_URL` to the Fly app secrets.
- [ ] Optionally set `TRANSCRIPT_TIMEOUT_MS`; the default is `15000`.
- [ ] Optionally set `TRANSCRIPT_MAX_CHARS`; the default is `160000`.
- [ ] Confirm whether the provider requires authentication.

The current backend sends no transcript authorization header. If the provider
requires a token, add `TRANSCRIPT_API_TOKEN` support before the production test.

### Application verification

- [ ] Confirm the frontend points to `https://backend-wispy-fire-4184.fly.dev`.
- [ ] Provide a test user with at least one credit.
- [ ] Select a public YouTube video with an available transcript for testing.
- [ ] Do not rotate existing Strapi keys during the database migration unless a
  deliberate session/token invalidation is planned.

## Backend implementation checklist

- [ ] Add a secure database inventory and backup procedure.
- [ ] Build a repeatable rehearsal migration.
- [ ] Add an explicit SQLite-to-PostgreSQL merge step only if SQLite has new data.
- [ ] Update the Fly deploy workflow from SQLite to PostgreSQL.
- [ ] Add transcript-provider token support if required.
- [ ] Run automated tests and a production build before cutover.
- [ ] Execute the cutover, smoke tests, record-count checks, and rollback audit.

