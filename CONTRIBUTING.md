# Contributing

Small repo, short rules. English first, 繁體中文 below.

## What lives where

| Path | What it is |
|---|---|
| `skills/clean-diagram/SKILL.md` | the instructions the agent reads |
| `skills/clean-diagram/scripts/render.py` | turns `.mmd` into one self-contained HTML |
| `skills/clean-diagram/assets/` | page skeleton, styles, drag/edit JS |
| `docs/logo.py` | regenerates `docs/logo.gif` |
| `examples/` | committed sample output |

## Try a change

```bash
python3 skills/clean-diagram/scripts/render.py examples/streaming-recs.mmd /tmp/out.html --title "Test"
open /tmp/out.html
```

Open the file with no network. It has to work offline — Mermaid is vendored,
never add a CDN link.

## Using Claude Code on this repo

The repo is also a Claude Code plugin, so you can develop it with the thing it
plugs into:

```
/plugin marketplace add .
/plugin install clean-diagram
```

Then in a chat: `draw the architecture of this repo`. If the output looks
wrong, the fix usually belongs in `SKILL.md` (what the agent is told) rather
than in `render.py` (how it is drawn).

Editing `SKILL.md`? Keep it short and imperative. It is a prompt, not docs.

## Pull requests

- One change per PR. A style tweak and a renderer fix are two PRs.
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`.
- Changed the renderer or the assets? Re-render `examples/streaming-recs.html`
  and commit it, so the example matches the code.
- No new runtime dependencies. `render.py` is stdlib-only python3, on purpose.
- Bug report is fine too: paste the `.mmd` and what you expected to see.

## 繁體中文

- 一個 PR 做一件事,commit 用 `feat:` / `fix:` / `docs:` / `chore:`。
- 改了 renderer 或 assets,請重新產生 `examples/streaming-recs.html` 一起送出。
- 不要加新的執行期套件,`render.py` 只用 python3 標準函式庫。
- 產出的 HTML 必須離線可開,不要引入 CDN。
- 用 Claude Code 開發:`/plugin marketplace add .` 然後 `/plugin install clean-diagram`。
- 輸出結果不對,多半是改 `SKILL.md`(agent 收到的指令),不是改 `render.py`。
