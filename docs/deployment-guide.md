# Deployment Guide — L2 warranty intake prototype

## 1. Requirements

Windows with Docker Desktop/WSL2, macOS with Docker Desktop, or Linux with Docker Engine. Target: Docker Engine 24+ and Compose v2.20+, Linux containers; reserve 4 GB RAM, 5 GB free disk and TCP port 8000. Internet is needed for the first build. PostgreSQL and Node do not need to be installed on the host. These are target requirements, not a tested compatibility matrix.

**Validation status:** Docker is not installed in the authoring environment. The clean-machine test has NOT been run. Do not interpret this guide as evidence of a successful container deployment.

## 2. Setup

After cloning the repository and entering its root, run these two commands (PowerShell, bash or zsh):

1. Copy the example configuration:

   ```sh
   cp .env.example .env
   ```

2. Build and start:

   ```sh
   docker compose up -d --build
   ```

Compose supplies container database connection settings; `DB_PASSWORD` and `JWT_SECRET` come from `.env`. Startup automatically runs migrations and seeds before starting Express. The frontend is built into the image and served by Express at http://localhost:8000. Wait for both services to become healthy.

Stop without removing data: `docker compose down`. To repeat from an empty database in this disposable demo project only: `docker compose down -v` (deletes the project's database volume), then repeat setup. No global Docker prune is needed.

## 3. Environment variables

| Variable | Meaning | Example | Required |
|---|---|---|---|
| DB_HOST | PostgreSQL host | `localhost` (Compose overrides to `db`) | Native: yes; Compose: supplied |
| DB_PORT | PostgreSQL port | `5432` | Native: yes; Compose: supplied |
| DB_NAME | Database name | `baohanh_l2` | Native: yes; Compose: supplied |
| DB_USER | Database user | `postgres` | Native: yes; Compose: supplied |
| DB_PASSWORD | Database password | `doi_mat_khau_cua_ban` | Set in `.env`; demo fallback exists in Compose |
| JWT_SECRET | JWT signing key | `doi_chuoi_bi_mat_dai_it_nhat_32_ky_tu` | Yes; replace for any non-demo use |
| PORT | Express listening port | `8000` | No; default 8000; Compose forces 8000 |
| NODE_ENV | Runtime mode | `production` | No; set in image |
| WORKSHOP_ALLOW_DB_WRITE | Explicit opt-in for integration fixtures | `1` | Only for integration runner |
| WORKSHOP_TEST_PASSWORD | Seed login password override in runner | `Demo@123` | No; runner default shown |

`.env.example` and Compose fallback keys/passwords are public demo values. They do not protect a public deployment. This prototype has no TLS termination, rate limiting or JWT revocation.

## 4. Sample data

`seeds/001_demo.sql` runs automatically. On an empty database expect `service_center=2`, `issue_category=6`, `app_user=2`, `customer=3`, `device=3`, `ticket=3`, `ticket_status_log=3`. Subsequent runs preserve existing data rather than reset it. Sample tickets have fixed October 2026 dates, so overdue flags depend on the current clock.

Login as `nv.tiepnhan01` (intake staff) or `ql.ninhkieu` (manager), password `Demo@123`. Both belong to center 1. Sample phone numbers and addresses are synthetic demo data.

## 5. Verify and troubleshoot

```sh
docker compose ps
```

Expected: `db` and `app` both `healthy`.

```sh
curl http://localhost:8000/health
```

Expected HTTP 200 and `{"status":"ok","db":"ok"}`. In PowerShell use `curl.exe` if `curl` is aliased. Open the frontend and log in with a demo account.

```sh
docker compose exec app npm test
```

Expected 15 tests, 15 pass, 0 fail. Tests are copied into the runtime image. This command does not run the PostgreSQL integration suite.

For integration tests create a separate disposable database (never use the demo database containing work you want to retain):

```sh
docker compose exec db createdb -U postgres baohanh_l2_test
docker compose exec -e DB_NAME=baohanh_l2_test app npm run migrate
docker compose exec -e DB_NAME=baohanh_l2_test app npm run seed
docker compose exec -e DB_NAME=baohanh_l2_test -e WORKSHOP_ALLOW_DB_WRITE=1 app node scripts/run-workshop-integration.js
```

Expected `SUMMARY 12/12 PASS, 0/12 FAIL`. These are verification commands after setup, not additional startup requirements. The image includes an empty `docs/` directory for the runner's output. Copy the report out with `docker compose cp app:/app/docs/workshop-integration-results.txt ./docs/docker-integration-results.txt` if needed.

If startup fails, inspect `docker compose logs app db`. Port conflict: free port 8000. Authentication failure after changing `.env`: the existing database volume retains the original password; use that password or reset only the disposable project volume. A 503 health response means PostgreSQL cannot be reached. Do not record PASS until the commands have actually succeeded.
