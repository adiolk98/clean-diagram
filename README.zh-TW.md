# clean-diagram

[![stars](https://img.shields.io/github/stars/adiolk98/clean-diagram?style=flat&labelColor=0a0a0b&color=c1442c)](https://github.com/adiolk98/clean-diagram/stargazers)
[![license](https://img.shields.io/github/license/adiolk98/clean-diagram?style=flat&labelColor=0a0a0b&color=97968f)](LICENSE)

[English](README.md) · 繁體中文

把一個 codebase 變成一張架構圖 — 一個頁面,兩種視角,外加一份「值得看一下」的清單。

給軟體工程用。不做 39 種圖型選單,不做驗證流程,不做品牌色抽取。

![工程視角](docs/engineer.png)

## 三件事

**1. 工程視角** — 模組、依賴、資料流。節點分四種角色:入口(朱紅)、資料儲存(圓柱)、
外部服務(虛線)、非同步(虛線淡化)。第二行 mono 小字放語言、協定、port。

**2. 說明視角** — 同一個系統,換成 4–6 個白話節點,附一段誰都看得懂的說明,
拿去給非工程的人看。切換在標題下方。

![說明視角](docs/plain.png)

**3. Worth a look** — 讀 code 時發現的缺口:沒有 retry 的外部呼叫、沒人 import 的模組、
沒有 TTL 的快取。沒發現就不會有這一段。

## 節點可以直接拖

擺不順眼就用滑鼠拖,連線跟著重算,佈局存在瀏覽器裡(`重設佈局` 還原)。

![拖曳節點](docs/drag.gif)

## 安裝

Claude Code:

```
/plugin marketplace add adiolk98/clean-diagram
/plugin install clean-diagram
```

其他 agent — skill 就是一個資料夾,複製到工具讀 skill 的位置即可:

| Harness | 放哪裡 |
|---|---|
| Cursor | `cp -r skills/clean-diagram ~/.cursor/skills/`(專案內用 `.cursor/skills/`) |
| Codex CLI | `cp -r skills/clean-diagram ~/.codex/skills/` |
| Claude Code(不用 plugin) | `cp -r skills/clean-diagram ~/.claude/skills/` |
| 其他(Gemini CLI、aider、Copilot…) | clone 這個 repo,跟 agent 說:*照著 `skills/clean-diagram/SKILL.md` 做* |

## 使用

跟 agent 說一句就好:

```
幫我畫這個 repo 的架構圖
幫我畫 src/payments 的架構圖
畫一張,順便做一張給老闆看的
```

範圍不確定時它會先問一句,然後給你一個 HTML 檔路徑。
Mermaid 是內嵌的,檔案離線可開、不需要 CDN。

範例輸出:[`examples/netflix-recs.html`](examples/netflix-recs.html) — 一條 Netflix 式的推薦流程。

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

測試:`python3 skills/clean-diagram/scripts/test_render.py`

## 風格

Editorial dark:近黑底、單一朱紅強調色、細線框、serif 標題 + mono 標籤 + sans 內文。
沒有陰影、沒有漸層、圖上沒有圖例。節點載入時淡入,hover 時亮起,動態克制。

## License

MIT。內嵌的 Mermaid 亦為 MIT,見 [THIRD_PARTY.md](THIRD_PARTY.md)。
