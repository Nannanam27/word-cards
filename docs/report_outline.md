# Report Outline (5–8 pages) + Video Script

## Report
1. **Introduction** – goal: deploy a multi-tier web app with containers; what Word Cards does.
2. **System Architecture** – diagram: Browser → `web` (Express :3000) → `db` (PostgreSQL :5432) on the bridge network `backend`; named volume `db_data`.
3. **Application Design** – database schema (decks 1–N cards), REST API table, frontend views (Decks, Deck, Study).
4. **Dockerfile Explained** – base image `node:20-alpine`, `WORKDIR`, copying package.json first for layer caching, `npm install --omit=dev`, non-root `USER node`, `EXPOSE`, `HEALTHCHECK`, `CMD`.
5. **docker-compose.yml Explained** – services, environment variables, `ports`, `volumes` (persistence + init.sql), `networks`, `healthcheck` + `depends_on: condition: service_healthy`.
6. **Build & Run Steps** – commands with screenshots.
7. **Relation to Operating System Concepts**
   - Containers are **processes** isolated by Linux **namespaces** (PID, NET, MNT, UTS, IPC, USER)
   - **cgroups** limit CPU and memory per container
   - The containers share the **host kernel**, unlike virtual machines
   - **Union/overlay filesystem** and image layers; volumes give persistent storage
   - **Virtual networking**: bridge network, internal DNS (`db` hostname), port mapping
   - **Inter-process communication** over TCP sockets between the web and db processes
   - Running as non-root follows the **least privilege** principle
   - Signals: `docker stop` sends SIGTERM to PID 1
8. **Problems & Solutions** – e.g. web started before the DB was ready → healthcheck + retry in `db.js`; data was lost after `down` → named volume; port 3000 already in use → `WEB_PORT` in `.env`. *(Replace these with the problems you actually had.)*
9. **How AI Was Used** – state honestly which tool(s) you used and for which parts (e.g. generating the starting code, UI styling, explaining Docker concepts). Then explain what you reviewed, tested and changed yourself, and what you learned.
10. **Conclusion**

## Video Script (≥10 min, face visible)
| # | Section | ~Time | Show |
|---|---|---|---|
| 1 | Overview | 1:00 | Intro yourself, app purpose |
| 2 | Application structure | 1:00 | Architecture diagram |
| 3 | Source code structure | 1:30 | Folder tree, server.js, app.js, init.sql |
| 4 | Dockerfile | 1:30 | Explain line by line |
| 5 | docker-compose.yml | 1:30 | Services, volume, network, healthcheck |
| 6 | Build & run | 1:00 | `docker compose up --build`, `ps`, logs |
| 7 | Demo | 2:00 | Create deck, add/edit word, study, restart → data persists |
| 8 | OS concepts | 1:00 | `docker exec web ps`, `docker stats`, `docker network inspect` |
| 9 | Problems & solutions | 1:00 | What went wrong and the fix |
