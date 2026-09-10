# The plain view

A second diagram for people who don't read code, behind a toggle in the same page.
Written with `--plain <file.mmd> --explain <file.txt>`.

Build it when the user wants something to show other people, or says
給別人看 / 對外說明 / 老闆 / 客戶.

## The diagram (`--plain`)

- 4–6 nodes, everyday nouns (`使用者`, `網站`, `資料倉庫`, `付款公司`) — no service
  names, no protocols, no sublabels, at most one `entry` accent.
- Same Mermaid grammar as the engineer view, just far less of it.
- Draw the path a person would describe out loud, not the deployment.

## The explanation (`--explain`)

- Two or three short paragraphs. Blank line = new paragraph.
- Explain it like the reader is five: one real-world analogy, carried through all
  the way — a video store clerk, a factory line, a post office. Don't switch
  analogies halfway.
- Plain sentences a parent would use. No jargon, no acronyms, no bullet lists,
  no "簡而言之", no naming the analogy as an analogy.
- The word "ELI5" is a note to you, not to the reader — it never appears in the
  output. The test is whether someone outside the team gets it in one read.
- Write it in the user's language (default 繁體中文 when the conversation is Chinese).
