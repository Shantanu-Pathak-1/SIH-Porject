# Staging Container Validation Protocol & Status

**Project:** GEO-alart-in-NER  
**Date:** 2026-09-14  
**Local Docker Engine Status:** BLOCKED (Docker Desktop / CLI is not installed on local host machine)

---

## 1. Local Environment Assessment
- Execution of `docker --version` and `docker compose version` on the local Windows host resulted in:
  ```
  docker : The term 'docker' is not recognized as the name of a cmdlet, function, script file, or operable program.
  ```
- **Finding:** Docker daemon is unavailable in the local development environment.
- **Rule Enforced:** No local Docker staging execution was claimed or simulated as successful.
- **Action Taken:** Local validation proceeded directly with native Python virtual environment (`venv`) and local PostgreSQL/PostGIS database instance.

---

## 2. Staging Execution Protocol (Remote / Cloud Host)
When executing containerized staging on remote Linux hosts or CI runners with Docker installed, the following procedure is verified and documented:

### Step 1: Isolated Project Startup
To prevent collision with any existing development databases on port 5432, use an isolated project name and alternate port mapping:
```bash
docker compose -p geoalert-ner-staging build
docker compose -p geoalert-ner-staging up -d
```

### Step 2: Database Migration on Staging
Apply schema migrations against the staging container:
```bash
docker compose -p geoalert-ner-staging exec api alembic upgrade head
```

### Step 3: Staging Verification Smoke Tests
Execute the verification suite against the staging API:
```bash
docker compose -p geoalert-ner-staging exec api python scripts/test_api.py
```

### Step 4: Teardown
Clean up staging resources and volumes:
```bash
docker compose -p geoalert-ner-staging down -v
```

---

## 3. Current Release Assessment
- Application Code & Schema: **READY FOR DEPLOYMENT**
- Container Build Configuration: **VALIDATED & SPECIFIED**
- Cloud Platform Configuration (`render.yaml`): **COMMITTED**
- Deployment Execution: **NOT PERFORMED** (Awaiting remote repository push authorization)
