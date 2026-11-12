# Docker packaging verification — 12 November 2026

Verified source revision: `ca4ce2aaa8fb9e8e060dd4146bee669783451815`.

The verification script exported committed Git sources into a new temporary directory with no local `.env`, `node_modules` or pre-existing project database volume. It used a new Compose project `bt3verify-20261112-132605`. No global prune or deletion of the author's database was performed.

Setup: copy `.env.example` to `.env`; `docker compose up -d --build --wait --wait-timeout 180` (with the unique project name). The extra flags only wait for health checks. Both services became healthy. `/health` returned `{"status":"ok","db":"ok"}`. Unit tests inside the app container: 15/15 PASS. Integration tests against a separate empty PostgreSQL database: 12/12 PASS. Rerunning migrations/seeds retained clean counts 2 centers, 6 categories, 2 users, 3 customers/devices/tickets/logs.

- [PowerShell run metadata/transcript](20261112-132605.txt) (Windows PowerShell 5 did not capture all native stdout in this first run)
- [Captured runtime checks and unit-test stdout](20261112-132605-verification.txt)
- [Integration output copied from container](20261112-132605-integration.txt)

The clean-source deployment was verified on Docker Desktop/WSL2. The public `v1.0` tag has not yet been published, so the tag-clone check remains pending.

## Screenshots of the running system

The terminal screenshots were taken from a visible PowerShell console while executing Docker commands on 12 November 2026. The frontend screenshot was captured from the application served at `http://localhost:8000`. No terminal output was recreated as an image.

| Evidence | File |
|---|---|
| Both services healthy and health response | [docker-health.png](screenshots/docker-health.png) |
| 15/15 unit tests PASS | [docker-unit-tests.png](screenshots/docker-unit-tests.png) |
| 12/12 PostgreSQL integration cases PASS | [docker-integration-tests.png](screenshots/docker-integration-tests.png) |
| Customer/device intake checks | [TC-02-docker.png](screenshots/TC-02-docker.png) |
| Center-based ticket access | [TC-10-docker.png](screenshots/TC-10-docker.png) |
| Frontend login page | [frontend-login.png](screenshots/frontend-login.png) |

The screenshot rerun uses the same isolated test database after cleanup. Sequence values may increase between runs even though temporary rows are removed; IDs therefore differ from the first clean deployment's text output.
