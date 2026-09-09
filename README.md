# clean-diagram

[![stars](https://img.shields.io/github/stars/adiolk98/clean-diagram?style=flat&labelColor=0a0a0b&color=c1442c)](https://github.com/adiolk98/clean-diagram/stargazers)
[![license](https://img.shields.io/github/license/adiolk98/clean-diagram?style=flat&labelColor=0a0a0b&color=97968f)](LICENSE)

English · [繁體中文](README.zh-TW.md)

Turn a codebase into one architecture map — one HTML page, two views, plus a short
list of things worth a second look.

Built for software architecture only. No 39-type diagram menu, no validation pass,
no brand-color extraction.

![engineer view](docs/engineer.png)

## What you get

**1. Engineer view** — modules, dependencies, data flow. Four node roles: entry
(cinnabar), store (cylinder), external (dashed), async (dashed + dim). The second
line holds language, protocol, port.

**2. Plain view** — the same system in 4–6 everyday nouns, plus a short write-up
anyone can read. Toggle sits under the title.

![plain view](docs/plain.png)

**3. Worth a look** — gaps found while reading the code: an external call with no
retry, a module nothing imports, a cache with no TTL. Nothing found, no section.

## Nodes are draggable

Drag any node, edges re-route, layout is saved in your browser (`重設佈局` resets it).

![drag nodes](docs/drag.gif)

## Install

Claude Code:

```
/plugin marketplace add adiolk98/clean-diagram
/plugin install clean-diagram
```

Other agents — the skill is a plain folder, so copy it where your tool looks for skills:

| Harness | Where |
|---|---|
| Cursor | `cp -r skills/clean-diagram ~/.cursor/skills/` (project: `.cursor/skills/`) |
| Codex CLI | `cp -r skills/clean-diagram ~/.codex/skills/` |
| Claude Code (no plugin) | `cp -r skills/clean-diagram ~/.claude/skills/` |
| Anything else (Gemini CLI, aider, Copilot…) | clone the repo and tell the agent: *follow `skills/clean-diagram/SKILL.md`* |

## Use

Just ask:

```
draw the architecture of this repo
draw the architecture of src/payments
draw one, and one I can show my boss
```

If the scope is unclear it asks one question, then hands you an HTML file path.
Mermaid is inlined — the file opens offline, no CDN.

Example output: [`examples/netflix-recs.html`](examples/netflix-recs.html) — a
Netflix-style recommendation path.

## Running the renderer directly

Works without an agent:

```bash
python3 skills/clean-diagram/scripts/render.py engineer.mmd out.html \
  --title "Netflix Recommendations" --subtitle "home row · picking a few from tens of thousands" \
  --scope "recommendation path · 10 nodes" \
  --notes notes.txt --plain plain.mmd --explain explain.txt
```

Only `--title` and the first `.mmd` are required. `--notes` takes one line per note
(`Title :: what to look at`), `--plain` is the second diagram, `--explain` its
write-up (blank line = new paragraph).

The Mermaid source adds four role classes:

```
classDef entry fill:transparent
classDef store fill:transparent
class App entry
class Feat,Emb store
```

The page stylesheet does the painting — `classDef` values are ignored, so no hex
codes get pasted into every diagram.

Tests: `python3 skills/clean-diagram/scripts/test_render.py`

## Style

Editorial dark: near-black canvas, one cinnabar accent, hairline strokes, serif
headings + mono labels + sans body. No shadows, no gradients, no legend on the
canvas. Nodes fade in on load and highlight on hover. Motion stays restrained.

## License

MIT. The inlined Mermaid is MIT too — see [THIRD_PARTY.md](THIRD_PARTY.md).
