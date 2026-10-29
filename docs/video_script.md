# Video Script: Word Cards (about 11 to 12 minutes, face visible)

**Before recording**
- Turn on your camera overlay (OBS, Zoom or Loom) so your face is in a corner the whole time.
- Open VS Code on the `Words/` folder, a terminal in `Words/`, and a browser.
- Run `docker compose down` first, so the build is shown from the start.

Lines in quotes are what you say. **Do** lines are what you show.

---

## 1. Overview of the project (about 1 minute)
**Do:** face on camera, then show the GitHub repo page.

> "Hello, my name is ___, student ID ___. This is my container project, called **Word Cards**."
>
> "Word Cards is a flashcard web app for learning English words with Thai meanings. You can create sets of cards, study them with flip cards, mark each word as Know or Still learning, and test yourself with a quiz."
>
> "The app has two parts: a Node.js web server and a PostgreSQL database. Each part runs in its own Docker container, and I start the whole system with one command, `docker compose up`."
>
> "The code is on GitHub at github.com/Nannanam27/word-cards."

## 2. Application structure (about 1 minute)
**Do:** show the architecture diagram in the report (section 2), or the diagram at the top of the README.

> "Here is how the system works."
>
> "The browser talks to the **web container** over HTTP on port 3000. The web container uses Express. It sends the web pages to the browser, and it has a REST API under `/api`."
>
> "When the API needs data, it connects to the **database container** on port 5432. The two containers are on a private Docker network called `backend`."
>
> "Only the web container publishes a port to my computer. The database has no published port, so nobody outside can connect to it directly. Only the web container can."
>
> "The database files are stored in a Docker **volume** called `db_data`. Because of this, my data is still there after I delete and recreate the containers."

## 3. Source code structure (about 1.5 minutes)
**Do:** in VS Code, expand the folder tree and open each file for a few seconds.

> "At the top level I have `docker-compose.yml`, which defines both containers, and `.env.example`, which shows the settings you can change, like the password and port."
>
> "The `app` folder is the web container. It has the `Dockerfile`, `package.json` with the two packages, `express` and `pg`, and `server.js`, which starts the server."
>
> "`db.js` creates the connection pool to PostgreSQL. It also retries the connection until the database is ready."
>
> "The `routes` folder has the API. `decks.js` handles the sets, and `cards.js` handles the cards. Every query uses parameters like `$1`, so it is safe from SQL injection."
>
> "The `public` folder is the frontend. `index.html` has all the screens. The `js` folder has one file per screen: `library.js`, `editor.js`, `study.js` and `quiz.js`, plus `main.js`, where the app starts, and `api.js`, which sends requests to the server. The `css` folder has ten style files, one for each part of the page."
>
> "Finally, `db/init.sql` creates two tables, `decks` and `cards`, and adds some sample words. Each card belongs to one deck."

## 4. Explanation of the Dockerfile (about 1.5 minutes)
**Do:** open `app/Dockerfile` and point at each line as you explain it.

> "This is the Dockerfile for the web container."
>
> "`FROM node:20-alpine`: I start from the official Node.js 20 image based on Alpine Linux, which is very small."
>
> "`WORKDIR /usr/src/app` sets the folder inside the container where my app lives."
>
> "Next, I copy only `package.json` first and run `npm install`. I do this before copying the rest of the code because Docker caches each layer. If I only change my code, Docker reuses the cached install layer, so rebuilding is much faster."
>
> "`--omit=dev` installs only the packages needed in production, and `npm cache clean` makes the image smaller."
>
> "Then I copy the rest of the code. `--chown=node:node` gives the files to the `node` user. `USER node` means the app does **not** run as root, which is safer. If someone breaks into the app, they don't get root inside the container."
>
> "`EXPOSE 3000` documents the port. The `HEALTHCHECK` calls `/api/health` every 10 seconds, so Docker knows if the app is really working."
>
> "`CMD` starts the server with `node server.js`. I use the JSON form, so node receives the stop signal directly."

## 5. Explanation of the docker-compose.yml file (about 1.5 minutes)
**Do:** open `docker-compose.yml` and scroll slowly.

> "This file defines my two services."
>
> "The first is `db`, using the official `postgres:16-alpine` image. The username, password and database name come from environment variables, with default values if there is no `.env` file."
>
> "It has two volumes. `db_data` stores the database files permanently. `init.sql` is mounted read-only into a special folder, so PostgreSQL runs it automatically the first time and creates my tables."
>
> "The healthcheck runs `pg_isready` every 5 seconds to check whether the database is ready."
>
> "The second service is `web`. It is built from my Dockerfile in the `app` folder. `DB_HOST: db` is interesting: I just write the service name, and Docker's built-in DNS turns `db` into the database container's IP address."
>
> "`ports` maps port 3000 on my computer to port 3000 in the container. Only `web` has this."
>
> "`depends_on` with `service_healthy` means the web container waits until the database is healthy, not just started."
>
> "`init: true` adds a tiny init process as PID 1. It passes stop signals to node and cleans up finished child processes."
>
> "Under `deploy`, I set resource limits: half a CPU and 128 MB of memory for web, and 256 MB for the database."
>
> "At the bottom I declare the volume `db_data` and the bridge network `backend`."

## 6. Steps for building and running the containers (about 1 minute)
**Do:** in the terminal, run each command and wait for the output.

```bash
docker compose up --build -d
docker compose ps
docker compose logs web
curl localhost:3000/api/health
```

> "First I run `docker compose up --build -d`. This builds the web image from my Dockerfile, pulls the PostgreSQL image, creates the network and volume, and starts both containers in the background."
>
> "With `docker compose ps`, both containers show **healthy**. The database became healthy first, and then the web container started."
>
> "In the logs you can see 'Connected to PostgreSQL' and 'Word Cards running on port 3000'."
>
> "And the health check returns `status: ok`, so the web server can reach the database."

## 7. Demonstration of the running application (about 2.5 minutes)
**Do:** open http://localhost:3000 in the browser.

1. **Library:** "This is the library. It lists all my sets. I can search here, and switch between the Flashcards and Quiz tabs."
2. **Create a set:** click **New set**, type a title, and add 3 or 4 cards with a word and a Thai meaning.
   "Each change is saved to the database automatically. You can see 'Saved just now'."
3. **Flashcards:** open the set.
   - "I click the card, or press Space, to flip it and see the meaning."
   - "I press the check button if I know the word, or the X if I'm still learning. The counters at the top change."
   - "Undo takes back my last answer, and shuffle mixes the cards. This button swaps the front and back."
   - Finish the round. "At the end I get a summary, and I can review only the words I'm still learning."
4. **Quiz:** start a quiz, answer one right and one wrong. "The correct answer turns green, a wrong answer turns red, and I get a score at the end."
5. **Phone (optional):** open `http://<your IP>:3000` on your phone. "It also works on a phone. I can swipe right for Know and left for Still learning."
6. **Persistence test:** in the terminal:
   ```bash
   docker compose down
   docker compose up -d
   ```
   Refresh the browser. "I removed both containers and created new ones, but my new set is still here. That's because the data is in the `db_data` volume, not inside the container."

## 8. How the project relates to operating system concepts (about 1.5 minutes)
**Do:** run each command and say one line about the result.

```bash
docker compose exec web ps
docker compose exec web hostname
docker compose exec web uname -sr
docker compose exec web cat /sys/fs/cgroup/memory.max /sys/fs/cgroup/cpu.max
docker stats --no-stream
docker compose exec web getent hosts db
docker compose exec web id
docker image history words-web
docker compose stop
docker compose logs web --tail 2
```

> "A container is not a virtual machine. It is a normal Linux process, isolated by the kernel."
>
> "**Process namespace:** inside the container, `ps` shows only a few processes. The init process is PID 1 and node is PID 7. On the host the same node process has a much bigger PID. The container has its own view of process IDs."
>
> "**UTS namespace:** the hostname is the container ID, not my computer's name."
>
> "**Shared kernel:** `uname` shows a Linux kernel, even though my computer is a Mac. Docker Desktop runs one small Linux VM, and every container shares that one kernel."
>
> "**cgroups:** `memory.max` is 134217728 bytes, which is 128 MB, and `cpu.max` is 50000 out of 100000, which is half a CPU. These are exactly the limits from my compose file. The kernel enforces them, and `docker stats` shows usage against the limit."
>
> "**Network namespace and IPC:** `getent hosts db` shows the database's private IP. The two containers communicate through TCP sockets over the bridge network, which is a form of inter-process communication."
>
> "**Users and permissions:** `id` shows uid 1000, the `node` user, not root."
>
> "**File system:** `docker image history` shows the image layers. Docker stacks them with an overlay file system, and only the top layer is writable. The volume is separate storage that stays when the container is removed."
>
> "**Signals:** when I run `docker compose stop`, Docker sends SIGTERM. My server catches it, finishes open requests, closes the database connections and exits cleanly. The log shows 'SIGTERM received, shutting down'."

## 9. Problems encountered and how they were solved (about 1 minute)
**Do:** show the problems table in the report (section 9).

> "Here are some problems I had and how I solved them."
>
> "**One:** my code changes did not show up in the browser. The container was still running the old image, and the browser cached the old files. I fixed it by rebuilding with `docker compose up --build`, and the server now sends a no-cache header."
>
> "**Two:** the web container started before the database was ready, so the connection failed. I fixed it in two ways: a healthcheck with `depends_on: service_healthy`, and a retry loop in `db.js`."
>
> "**Three:** `docker compose stop` took 10 seconds, because node did not react to the stop signal. I added `init: true` and a SIGTERM handler in `server.js`, and now it stops in about a second."
>
> "**Four:** my sample data did not load again after I changed `init.sql`. That's because the script only runs when the volume is empty. I fixed it with `docker compose down -v`, which deletes the volume and starts fresh."

## Closing (about 20 seconds)
> "To sum up, Word Cards runs as two containers that talk over a private network. The data stays safe in a volume, and the kernel isolates and limits each container with namespaces and cgroups."
>
> "I also used an AI assistant to help write code. I explain how in my report."
>
> "Thank you for watching."
