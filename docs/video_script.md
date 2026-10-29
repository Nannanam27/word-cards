# Video Script – Word Cards (target 11–12 minutes, face visible)

Setup before recording:
- Turn on the camera overlay (for example OBS, Zoom or Loom) so your face stays in a corner the whole time.
- Open VS Code on the `Words/` folder.
- Open a terminal in `Words/`.
- Open a browser tab ready on http://localhost:3000.
- Start from a clean state so the build appears in the video: `docker compose down`.

---

## 1. Overview (≈1:00)
**Show:** your face, then the app's library page.

> Hello, my name is ___ and this is my container project, **Word Cards**.
> It's a flashcard web app for learning English words with Thai meanings, similar to Quizlet.
> The system has two parts, a Node.js web server and a PostgreSQL database. Each runs in its own Docker container, and I start everything with one command.

## 2. Application structure (≈1:00)
**Show:** the architecture diagram in the report (section 2).

> The browser connects to the web container on port 3000. The web container serves the pages and a REST API.
> The API talks to the database container on port 5432 over a private network called `backend`. The database has no published port, so it can't be reached from outside.
> The database files are stored in a named volume, `db_data`, so data survives when containers are removed.

## 3. Source code structure (≈1:30)
**Show in VS Code:** the folder tree, then open each file briefly.

- `docker-compose.yml` and `.env.example` at the top level.
- `app/` is the web container: the `Dockerfile`, `package.json`, `server.js` (starts the server), `db.js` (the connection pool with retry) and `routes/` (one file per API resource: decks and cards).
- `app/public/` is the frontend: `index.html`, the manifest and icons.
  - `js/` has one module per screen (library, editor, study, quiz), plus `main.js` (entry point), `api.js`, `state.js`, `ui.js` and `utils.js`.
  - `css/` has 10 files, one per part of the page, loaded in order.
- `db/init.sql` creates the two tables, `decks` and `cards`, and adds sample data.

> In routes/decks.js and routes/cards.js, every query uses parameterized SQL, like `$1`, to prevent SQL injection.

## 4. Dockerfile (≈1:30)
**Show:** `app/Dockerfile`, explaining each line (see the table in report section 4).

Points to say:
- Alpine base image, so the image is small.
- `package.json` is copied first so the `npm install` layer is cached.
- `--omit=dev` installs only production packages.
- `COPY --chown` plus `USER node` means the app does not run as root.
- `HEALTHCHECK` calls `/api/health`.
- `CMD` uses the exec form.

## 5. docker-compose.yml (≈1:30)
**Show:** `docker-compose.yml`.

Points to say:
- The two services.
- Environment variables with defaults from `.env`.
- `DB_HOST: db` works through Docker's DNS.
- `ports` is set only on `web`.
- The volume, plus `init.sql` mounted read-only.
- The healthcheck and `depends_on: service_healthy`.
- `init: true`.
- The CPU and memory limits.
- The bridge network.

## 6. Build and run (≈1:00)
**Terminal:**
```bash
docker compose up --build -d
docker compose ps
docker compose logs web
curl localhost:3000/api/health
```
> You can see the database becomes healthy first, then the web container starts and logs "Connected to PostgreSQL".

## 7. Demo (≈2:30)
**Browser:**
1. In the library, search for a set.
2. Create a new set, add 3–4 cards, and point out "Saved just now".
3. Open Flashcards:
   - flip with a click and with Space;
   - mark cards with ✓ and ✕, use Undo and Shuffle;
   - finish the round and show the summary.
4. Start a Quiz: answer one right and one wrong, then show the score.
5. Optional: show the app on your phone at `http://<IP>:3000` and swipe a card.
6. **Persistence test:**
   ```bash
   docker compose down
   docker compose up -d
   ```
   Refresh the page. The new set is still there because of the volume.

## 8. OS concepts (≈1:30)
**Terminal:**
```bash
docker compose exec web ps                  # PID namespace: node is PID 7, init is PID 1
docker compose exec web hostname            # UTS namespace
docker compose exec web uname -sr           # shared Linux kernel
docker stats --no-stream                    # cgroup limits 128MiB / 256MiB
docker compose exec web cat /sys/fs/cgroup/memory.max /sys/fs/cgroup/cpu.max
docker compose exec web getent hosts db     # bridge network + DNS
docker compose exec web id                  # runs as uid 1000, not root
docker image history words-web              # overlay filesystem layers
docker compose stop && docker compose logs web --tail 2   # SIGTERM handled
```
> A container is a normal Linux process, isolated by namespaces and limited by cgroups. The two containers communicate through TCP sockets, which is a form of IPC.

## 9. Problems and solutions (≈1:00)
Pick 3–4 from the table in report section 9:
- Changes not showing: rebuild the image and set no-cache.
- The database not ready yet: healthcheck plus retry.
- Slow stop: `init` plus a SIGTERM handler.
- The `chown` layer: `COPY --chown`.

## Closing (≈0:20)
> I also used an AI assistant, Claude Code, to write most of the code. I directed it, tested every part, and explained it in my report.
> Thank you.
