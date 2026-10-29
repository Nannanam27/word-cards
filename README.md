# Word Cards – Flashcard Web App with Docker

Word Cards is a flashcard app for learning English words with Thai meanings, similar to Quizlet.
It runs as two containers: a web container and a database container.

| Part | Container | Technology |
|---|---|---|
| Web (pages + REST API) | `wordcards-web` | Node.js 20, Express, HTML/CSS/JavaScript |
| Database | `wordcards-db` | PostgreSQL 16 |

```
Browser ──HTTP :3000──▶ wordcards-web ──TCP :5432──▶ wordcards-db ──▶ volume db_data
                         (Express)        network "backend"   (PostgreSQL)
```

## Features
- **Library**: lists all sets, with search and tabs for Flashcards and Quiz.
- **Set editor**: create, rename and delete sets; add, edit and delete cards (word, meaning, part of speech, example). Each change saves automatically.
- **Flashcards**: one card at a time with a 3D flip.
  - Mark each card "know" or "still learning" with buttons or by swiping on a phone.
  - Undo, shuffle, and swap front and back.
  - Progress is saved automatically, with a summary at the end of each round.
- **Quiz**: multiple-choice questions with a score.
- **Mobile web app**: works on phones and can be added to the home screen (PWA manifest and icons).
- **Keyboard shortcuts**: `Space` flip · `←/→` previous/next · `K` know · `L` still learning · `Backspace` undo · `Esc` back to library.

## Project Structure
```
Words/
├── docker-compose.yml        # defines the 2 services, network and volume
├── .env.example              # settings you can change (copy to .env)
├── README.md
├── app/                      # web container
│   ├── Dockerfile            # how the web image is built
│   ├── .dockerignore
│   ├── package.json          # dependencies: express, pg
│   ├── server.js             # starts Express, mounts the routes, graceful shutdown
│   ├── db.js                 # PostgreSQL connection pool with retry
│   ├── routes/               # REST API, one file per resource
│   │   ├── decks.js          # /api/decks
│   │   ├── cards.js          # /api/decks/:id/cards, /api/cards/:id
│   │   └── wrap.js           # turns errors into HTTP 500
│   └── public/               # frontend (served as static files)
│       ├── index.html        # all views: library, editor, flashcards, quiz
│       ├── manifest.webmanifest
│       ├── icons/            # app icons
│       ├── assets/           # background image
│       ├── js/               # ES modules
│       │   ├── main.js       # entry point: navigation, keyboard, first load
│       │   ├── api.js        # REST client
│       │   ├── state.js      # shared app state
│       │   ├── ui.js         # switch screens, toast, modal
│       │   ├── utils.js      # small helpers
│       │   ├── library.js    # library screen
│       │   ├── editor.js     # set editor screen
│       │   ├── study.js      # flashcards screen + swipe
│       │   └── quiz.js       # quiz screen
│       └── css/              # loaded in this order
│           ├── base.css      # colors, fonts, reset
│           ├── layout.css    # top bar, page, buttons
│           ├── library.css, editor.css, study.css, quiz.css
│           ├── overlays.css  # modal, toast
│           ├── responsive.css
│           ├── panels.css    # light panels over the galaxy
│           └── mobile.css    # touch, swipe, iPhone safe areas
└── db/
    └── init.sql              # tables + sample data (runs on first start)
```

## Install
1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/), or Podman with podman-compose.
2. Check that it works:
   ```bash
   docker --version
   docker compose version
   ```
3. Optional: copy the settings file, then edit it to change the password or port.
   ```bash
   cp .env.example .env
   ```

## Build and Run
Run these from the `Words/` folder.
```bash
docker compose up --build -d     # build the web image and start both containers
docker compose ps                # both should show "healthy"
```
Then open **http://localhost:3000**.

To open it on a phone on the same Wi-Fi, use `http://<your-computer-IP>:3000`. To find the IP on macOS, run `ipconfig getifaddr en0`.

With Podman:
```bash
podman-compose up --build -d
```

## Stop / Reset
```bash
docker compose stop          # stop the containers (sends SIGTERM)
docker compose down          # remove the containers; the data stays in the volume
docker compose down -v       # also delete the database volume; sample data is loaded again next start
```

## Useful Commands
```bash
docker compose logs -f web                         # web server logs
docker compose exec db psql -U words wordcards     # SQL shell in the database
docker compose exec web ps                         # processes inside the web container
docker stats wordcards-web wordcards-db            # CPU / memory use against the limits
docker network inspect words_backend               # the private network between the containers
docker volume inspect words_db_data                # where the database files are stored
```

## Configuration (`.env`)
| Variable | Default | Meaning |
|---|---|---|
| `DB_USER` | `words` | database user |
| `DB_PASSWORD` | `words123` | database password |
| `DB_NAME` | `wordcards` | database name |
| `WEB_PORT` | `3000` | port on your computer |

## REST API
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | health check (also tests the DB) |
| GET / POST | `/api/decks` | list sets / create a set |
| PUT / DELETE | `/api/decks/:id` | rename / delete a set |
| GET / POST | `/api/decks/:id/cards` | list cards / add a card |
| PUT / DELETE | `/api/cards/:id` | edit / delete a card |

## Troubleshooting
| Problem | Fix |
|---|---|
| `port is already allocated` | Set `WEB_PORT=3001` in `.env`, then run `docker compose up -d` again. |
| Page doesn't change after editing code | Rebuild the web image: `docker compose up --build -d web`. |
| Sample data didn't load | `init.sql` only runs when the volume is empty. Run `docker compose down -v`, then start again. |
