---
name: clean-diagram
description: Generate a clean, self-contained HTML architecture map from a codebase — an engineer view, an optional plain-language view for non-engineers, and a short list of gaps worth a look. Nodes are draggable in the page. Use when the user asks for an architecture diagram, system diagram, module map, or "explain how this codebase is structured" — not for UI mockups or chart/data visualization.
---

# Clean Diagram

One page, one system. Read the code, decide the layers, draw the graph, say what's
worth a second look. No diagram-type menu, no validation passes, no branding step.

## Workflow

1. **Pick the scope.** Three ways in, in order of preference:
   - the user named a module/package/path → map exactly that
   - the user just said "this repo" → map the whole thing at service level
   - the user is unsure → ask **one** question ("整個 repo,還是某個模組?"), then go.

   State the scope you used in `--scope` (e.g. `whole repo · 9 nodes`, `src/payments`).
2. **Read before drawing.** Entry points, `package.json`/`pyproject.toml`/`pubspec.yaml`,
   top-level directories, then the imports/calls between the units you picked. Never
   draw an edge you didn't see in the code.
3. **Budget: 6–12 nodes, ≤16 edges, ≤3 subgraphs.** More than that is a wiring
   diagram, not an architecture map. Collapse leaf clusters (`Observability` instead
   of Grafana + Loki + Tempo), merge replicas (`Worker ×6`), drop cross-cutting
   infra (logging, CI) unless the diagram is about it. Above ~15 nodes, ask which
   subsystem to focus on instead of cramming.
4. **Write the engineer diagram** (`flowchart TD` or `LR`) — see grammar below.
5. **Write the notes** — 2–5 lines, only real observations from reading the code:
   a missing retry, an undocumented coupling, a store with no migration path, a
   module nothing imports. No filler, no "consider adding tests" boilerplate. Skip
   the file entirely if the code gave you nothing.
6. **Write the plain view** when the user wants something to show other people
   (or says 給別人看 / 對外說明 / 老闆 / 客戶). 4–6 nodes, no jargon in the labels,
   plus an ELI5 explanation — see below.
7. **Render**:
   ```
   python3 scripts/render.py <engineer.mmd> <output.html> \
     --title "<System Name>" --subtitle "<one line>" --scope "<what was mapped>" \
     [--notes notes.txt] [--plain plain.mmd --explain explain.txt]
   ```
   One self-contained HTML file — Mermaid inlined, no CDN, opens offline. Give the
   user the path; never paste the HTML/SVG back into chat.
8. **Report what you cut**, in two or three lines after the path: source node count →
   drawn, what merged, what was dropped. The reader of the diagram can't see what's
   missing; the person who asked can.

## Mermaid grammar this skill expects

```
flowchart LR
  subgraph SERVICE
    Router["API Router<br/><span class='sublabel'>Go · :8080</span>"]
  end
  DB[("Postgres")]
  Router --> DB

  classDef entry fill:transparent
  classDef store fill:transparent
  classDef external fill:transparent
  classDef optional fill:transparent
  class Router entry
  class DB store
```

- **Node roles** — declare the `classDef` lines you use (the values are ignored; the
  page stylesheet does the painting), then tag nodes:
  `entry` (the way in — **1–2 per diagram, max**), `store` (db/cache/queue),
  `external` (third party, dashed), `optional` (async or best-effort, dashed + dim).
  Untagged nodes are ordinary services. More than two accents and the focus is gone.
- **Sublabels** — technical detail goes in a `<span class='sublabel'>` on a second
  line: language, protocol, port, table. Keep them Latin and short; skip when unknown.
- **Edges** — `-->` for calls/imports, `-.->` for async/optional. Label an edge only
  when the verb isn't obvious (`-->|HTTPS|`, `-->|writes|`). Never both directions
  when one is implied.
- **Subgraphs** are layers or trust boundaries (CLIENT / SERVICE / DATA), uppercase,
  one word or two. Group by tier, not by folder, when the two disagree.

## The plain view (`--plain` + `--explain`)

A second diagram for people who don't read code, behind a toggle in the same page.

- 4–6 nodes, everyday nouns (`使用者`, `網站`, `資料倉庫`, `付款公司`) — no service
  names, no protocols, no sublabels, at most one `entry` accent.
- `--explain` is the ELI5 text: **two or three short paragraphs, one real-world
  analogy carried through**, plain sentences a 5-year-old's parent would use. No
  jargon, no acronyms, no bullet lists, no "簡而言之". Blank line = new paragraph.
- Write it in the user's language (default 繁體中文 when the conversation is Chinese).

## Style rules (baked into the template — don't override)

Editorial dark: near-black canvas, one cinnabar accent, hairline strokes, serif
headings + mono labels + sans node text. No shadows, no gradients, no legend inside
the canvas, no icons. Nodes fade in staggered on load and highlight on hover; nodes
are draggable and the layout is saved per browser. Motion stays restrained — nothing
loops, nothing bounces.

## What this skill deliberately does not do

Sequence/ER/timeline/chart types, brand color extraction, drawio import, before/after
validation, PNG/SVG export. If the user wants one of those, say so plainly and do it
ad hoc — don't grow this skill to cover it.
