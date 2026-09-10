# clean-diagram

[English](README.md) · 繁體中文

**可以編輯的html**

**方便與agent合作**

![工程視角](docs/engineer.png)

## 三件事

**1. 工程視角** — 模組、依賴、資料流。第二行 mono 小字放語言、協定、port。

**2. Worth a look**

## 這個頁面可以直接編輯
 
包含 Mermaid
可以直接在頁面上補完,不用re-prompt

![編輯圖](docs/edit.gif)

| | |
|---|---|
| 移動 | 拖節點,連線跟著重算 |
| 改名 | 對標籤點兩下,打字,Enter |
| 新增 / 連線 | `新增` 放一個節點 · `連線` 點兩個節點畫一條線 |
| 刪除 | 選一個節點或一條線,按 Delete |
| 拿回原始碼 | `匯出` 把 Mermaid 複製到剪貼簿 |
| 重來 | `重設佈局` 同時清掉佈局和編輯 |

存在瀏覽器裡，可以用 `匯出` 貼回 `.mmd`。

![拖曳節點](docs/drag.gif)

## 安裝

Claude Code:

```
/plugin marketplace add adiolk98/clean-diagram
/plugin install clean-diagram
```

| Harness | 放哪裡 |
|---|---|
| Cursor | `cp -r skills/clean-diagram ~/.cursor/skills/`(專案內用 `.cursor/skills/`) |
| Codex CLI | `cp -r skills/clean-diagram ~/.codex/skills/` |
| Claude Code(不用 plugin) | `cp -r skills/clean-diagram ~/.claude/skills/` |
| 其他(Gemini CLI、aider、Copilot…) | clone 這個 repo,跟 agent 說:*照著 `skills/clean-diagram/SKILL.md` 做* |

## 使用

prompt:

```
幫我畫這個 repo 的架構圖
幫我畫 src/payments 的架構圖
畫一張,順便做一張給老闆看的
```

範圍不確定時它會先問一句,然後給你一個 HTML 檔路徑。
Mermaid 是內嵌的,檔案離線可開、不需要 CDN。

範例輸出:[`examples/netflix-recs.html`](examples/netflix-recs.html)

## 直接跑 renderer

不透過 agent 也能用:

```bash
python3 skills/clean-diagram/scripts/render.py engineer.mmd out.html \
  --title "Netflix Recommendations" --subtitle "首頁推薦 · 從幾萬部片挑出你會按下去的那幾部" \
  --scope "recommendation path · 10 nodes" \
  --notes notes.txt --plain plain.mmd --explain explain.txt
```

只有 `--title` 和第一個 `.mmd` 是必要的。`--notes` 一行一則(`標題 :: 說明`),
`--plain` 是第二張圖,`--explain` 是它的說明文字(空行分段)。

Mermaid 語法上多了四個角色 class:

```
classDef entry fill:transparent
classDef store fill:transparent
class App entry
class Feat,Emb store
```

樣式由頁面的 stylesheet 決定,`classDef` 的值不會被使用 — 每張圖不用重複貼 hex。

檔案分工:`assets/template.html` 是頁面骨架,`assets/diagram.css` 是圖和編輯的樣式,
`assets/diagram-src.js` 是純粹的 Mermaid 文字改寫,`assets/diagram.js` 是拖曳/編輯/匯出的行為,
`render.py` 把它們全部內嵌成一個檔案。

## License

MIT。內嵌的 Mermaid 亦為 MIT,見 [THIRD_PARTY.md](THIRD_PARTY.md)。
