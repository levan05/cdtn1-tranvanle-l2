# Docker packaging verification — 12 November 2026

Verified source revision: `ca4ce2aaa8fb9e8e060dd4146bee669783451815`.

The verification script exported committed Git sources into a new temporary directory with no local `.env`, `node_modules` or pre-existing project database volume. It used a new Compose project `bt3verify-20261112-132605`. No global prune or deletion of the author's database was performed.

Setup: copy `.env.example` to `.env`; `docker compose up -d --build --wait --wait-timeout 180` (with the unique project name). The extra flags only wait for health checks. Both services became healthy. `/health` returned `{"status":"ok","db":"ok"}`. Unit tests inside the app container: 15/15 PASS. Integration tests against a separate empty PostgreSQL database: 12/12 PASS. Rerunning migrations/seeds retained clean counts 2 centers, 6 categories, 2 users, 3 customers/devices/tickets/logs.

- [PowerShell run metadata/transcript](20261112-132605.txt) (Windows PowerShell 5 did not capture all native stdout in this first run)
- [Captured runtime checks and unit-test stdout](20261112-132605-verification.txt)
- [Integration output copied from container](20261112-132605-integration.txt)

This verifies a clean local source export on Docker Desktop/WSL2. It does not verify cloning a public `v1.0` tag, which has not been published. The transcript is text evidence; real terminal/frontend screenshots must still be taken for the PDF's evidence section.
