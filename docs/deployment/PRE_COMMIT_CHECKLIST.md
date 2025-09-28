# 🔑 Pre-Commit Checklist for Temple Ledger CI/CD

1. **Secrets in Repository**
   - [ ] SUPABASE_PROJECT_REF_STAGING
   - [ ] SUPABASE_SERVICE_ROLE_KEY
   - [ ] SUPABASE_PROJECT_REF_PROD
   - [ ] SUPABASE_SERVICE_ROLE_KEY_PROD
   - [ ] DISCORD_WEBHOOK

2. **Config File**
   - [ ] Confirm `supabase/config.toml` exists in the repo root.

3. **Migrations**
   - [ ] Place your SQL migrations under `supabase/migrations/`.

4. **Supabase Functions**
   - [ ] If present, ensure `convergence-ingest` function is under `supabase/functions/convergence-ingest/`.