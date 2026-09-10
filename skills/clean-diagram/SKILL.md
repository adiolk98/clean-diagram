---
name: clean-diagram
description: Generate a clean, self-contained HTML architecture map from a codebase — an engineer view, an optional plain-language view for non-engineers, and a short list of gaps worth a look. In the page, nodes can be dragged, renamed, added, connected and deleted, and the Mermaid source exported back out. Use when the user asks for an architecture diagram, system diagram, module map, or "explain how this codebase is structured" — not for UI mockups or chart/data visualization.
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
6. **Write the plain view** when the user wants something to show other people.
   Triggers and rules: `references/plain-view.md`.
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
   missing; the person who asked can. Then one line saying the page is editable,
   and what to mention: `references/editing.md`.

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

## Style rules (baked into the template — don't override)

Editorial dark: near-black canvas, one cinnabar accent, hairline strokes, serif
headings + mono labels + sans node text. No shadows, no gradients, no legend inside
the canvas, no icons. Nodes fade in staggered on load and highlight on hover. Motion
stays restrained — nothing loops, nothing bounces.

The page's own files: `assets/template.html` (skeleton), `assets/diagram.css`
(diagram + editing styles), `assets/diagram-src.js` (Mermaid text surgery, pure),
`assets/diagram.js` (drag, edit, export). `scripts/render.py` inlines all of them.

## What this skill deliberately does not do

Sequence/ER/timeline/chart types, brand color extraction, drawio import, before/after
validation, PNG/SVG export. Say so plainly and do it ad hoc — don't grow this skill.
