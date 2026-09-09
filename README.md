# clean-diagram

把一個 codebase 變成一張架構圖 — 一個頁面,兩種視角,外加一份「值得看一下」的清單。

給軟體工程用。不做 39 種圖型選單,不做驗證流程,不做品牌色抽取。

## 產出

一個自包含的 HTML 檔(Mermaid 內嵌,離線可開):

- **工程視角** — 模組、依賴、資料流。節點角色分四種:入口、資料儲存、外部服務、非同步。
- **說明視角**(選用) — 4–6 個節點的白話版本,附 ELI5 說明,拿去給非工程的人看。
- **Worth a look**(選用) — 讀 code 時發現的缺口:沒有 retry 的外部呼叫、沒人 import 的模組、沒有 TTL 的快取。
- 節點可以直接在頁面上拖曳調整,佈局存在瀏覽器裡。

風格是 editorial dark:近黑底、單一朱紅強調色、細線框、serif 標題 + mono 標籤。

## 安裝

```
/plugin marketplace add adiolk98/clean-diagram
/plugin install clean-diagram
```

## 使用

```
幫我畫這個 repo 的架構圖
幫我畫 src/payments 的架構圖,順便做一張給老闆看的
```

## 直接跑 renderer

```
python3 skills/clean-diagram/scripts/render.py engineer.mmd out.html \
  --title "Example Service" --subtitle "web app · api · database" \
  --scope "whole repo · 9 nodes" \
  --notes notes.txt --plain plain.mmd --explain explain.txt
```

`notes.txt` 一行一則,格式 `標題 :: 說明`。`explain.txt` 空行分段。

```
python3 skills/clean-diagram/scripts/test_render.py
```

## License

MIT
