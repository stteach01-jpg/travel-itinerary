## Project Entrance

Project name: travel itinerary

Working directory:

`G:\我的雲端硬碟\travel itinerary`

This project is for building and maintaining travel itinerary materials. Keep practical trip details in the repo, and keep project progress and decisions in the Obsidian dashboard.

## Obsidian Dashboard

Primary project dashboard:

`G:\我的雲端硬碟\2026codex\secondbrain\知識庫\專案\travel itinerary.md`

Main Obsidian vault:

`G:\我的雲端硬碟\2026codex\secondbrain`

When updating project state, first read the dashboard, then update it with concise status, decisions, and next steps. Important operations should also be appended to:

`G:\我的雲端硬碟\2026codex\secondbrain\知識庫\log.md`

## Main Files

- `README.md`: project overview and operating notes.
- `.gitignore`: local/system/build exclusions.
- `AGENTS.md`: durable Codex working rules for this project.
- `index.html`: editable travel itinerary webpage.
- `styles.css`: itinerary webpage layout and visual style.
- `script.js`: itinerary data editing, local saving, JSON import/export, and route estimation.

## Sync Rules

- This folder is inside Google Drive. Keep Git configured with `windows.appendAtomically=false`.
- Do not commit secrets, API keys, passwords, tokens, private booking documents, passport numbers, or payment details.
- Keep personally sensitive travel data out of public repos.
- Before overwriting existing itinerary content, read the current file and preserve the user's intent.

## Workflow

- Use `startup-sync` when starting a project session.
- Use `shutdown-sync` when wrapping up a project session.
- Use Obsidian for durable progress notes and decision history.
