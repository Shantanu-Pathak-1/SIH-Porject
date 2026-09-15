# Production Release Plan

**Project:** GEO-alart-in-NER  
**Target Release:** v1.0.0 Production  
**Deployment Infrastructure:** Render Web Services + Managed PostgreSQL (with PostGIS)

---

## 1. Release Strategy Overview
This release transitions the GeoAlert-NER disaster early warning system from local QA-validated state to live staging and cloud production. The release leverages automated web service provisioning via `render.yaml`, multi-container Docker support, and backward-compatible REST/WebSocket endpoints.

---

## 2. Execution Phases

### Phase 1: Local Integrity & Safety Check (COMPLETED)
1. Verify development database baseline (read-only verification).
2. Validate Alembic schema migrations are synchronized to `HEAD`.
3. Verify zero secrets, credentials, or `.env` files are tracked in Git.
4. Execute full regression test suite (`scripts/test_api.py` and auth compatibility suite).
5. Compile Python backend with `python -m compileall app`.
6. Build frontend production assets with `npm --prefix frontend run build`.

### Phase 2: Remote Branch Synchronization (COMPLETED)
1. Fetch latest commits from `origin/main` (`0992b07` render.yaml and `8256a6b` auth route).
2. Rebase local release preparation onto remote `main`.
3. Resolve auth endpoint contract conflict to ensure dual-mode support for both JSON and Form authentication.
4. Verify tests pass after rebase.

### Phase 3: Repository Push & Deployment Trigger (BLOCKED)
1. Attempt standard push: `git push origin main`.
2. **Current Blocker:** GitHub returned HTTP 403 Forbidden for user `shubhamraivara1-dev` on repository `shiveshpatel08/GEO-alart-in-NER`.
3. **Unblock Requirement:** Grant push permissions to `shubhamraivara1-dev` or re-authenticate git credentials with account `shiveshpatel08`.

### Phase 4: Staging & Cloud Deployment Execution (PENDING PUSH)
1. Render detects push on `main` branch.
2. Render executes build command: `pip install -r requirements.txt`.
3. Render runs startup command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Run database migrations: `alembic upgrade head`.
5. Execute smoke tests on deployed staging URL (`/health`, `/api/v1/stations`, `/api/v1/risk/map`).

### Phase 5: Post-Release Monitoring
1. Verify background ingestion schedulers (Open-Meteo, NASA GLC).
2. Monitor real-time WebSocket telemetry connections.
3. Validate NDMA CAP 1.2 XML broadcast feed endpoint (`/api/v1/alerts/{id}/cap.xml`).
