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

- State lives in `localStorage`, per browser, per page title. Nothing reaches disk — to keep an edit, `匯出` and paste it into the `.mmd`.
- Not editable in the page: a node's role (`entry` / `store` / `external` / `optional`) and a label's second technical line. Both stay in the `.mmd`, where the diagram's meaning belongs.
- When you hand over the file, mention the first four rows — most people assume it's a static export.
