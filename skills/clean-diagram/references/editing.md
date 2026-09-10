# What the reader can do in the page

The rendered HTML is not a picture — every panel carries the Mermaid source it
was drawn from, and edits rewrite that source and re-render.

| Action | How |
|---|---|
| Move a node | drag it; edges re-route, position is saved per browser |
| Rename | double-click the label, type, Enter (Escape cancels) |
| Add a node | `新增` — the new node opens for typing |
| Draw an edge | `連線`, click the source node, then the target |
| Delete | click a node or an edge, then Delete / Backspace |
| Get the source back | `匯出` — copies the Mermaid text to the clipboard |
| Start over | `重設佈局` — drops both the layout and the edits |

Everything lives in `localStorage`, per browser, per page title. Nothing is
written back to disk: to keep an edit, `匯出` and paste it into the `.mmd`.

Two things the page deliberately can't do: set a node's role (`entry` / `store` /
`external` / `optional`) and edit the second technical line of a label. Both stay
in the `.mmd`, which is where the diagram's meaning belongs.

Mention the first four rows to the user when you hand over the file — most people
assume it's a static export.
