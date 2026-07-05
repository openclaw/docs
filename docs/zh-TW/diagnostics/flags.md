---
read_when:
    - 你需要目標式除錯記錄，而不提高全域記錄層級
    - 您需要擷取子系統特定的記錄以供支援
summary: 針對性除錯日誌的診斷旗標
title: 診斷旗標
x-i18n:
    generated_at: "2026-07-05T11:16:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9847f464fde89d9e639b089fe54fb933deb9debad2a6d8b120ab01bacff181a8
    source_path: diagnostics/flags.md
    workflow: 16
---

診斷旗標會為單一子系統開啟額外記錄，而不會全域提高
`logging.level`。除非子系統檢查該旗標，否則旗標不會產生效果。

## 運作方式

- 旗標是不區分大小寫的字串，會從設定中的 `diagnostics.flags`
  加上 `OPENCLAW_DIAGNOSTICS` 環境覆寫解析，去除重複並轉為小寫。
- `name.*` 會匹配 `name` 本身以及 `name.` 底下的任何項目（例如
  `telegram.*` 會匹配 `telegram.http`）。
- `*` 或 `all` 會啟用所有旗標。
- 在設定中變更 `diagnostics.flags` 後，請重新啟動閘道；它不會
  熱重新載入。

## 已知旗標

| 旗標             | 啟用項目                                                   |
| ---------------- | --------------------------------------------------------- |
| `telegram.http`  | Telegram Bot API HTTP 錯誤記錄                            |
| `brave.http`     | Brave Search 請求/回應/快取記錄                           |
| `profiler`       | 回覆階段分析器與 Codex 應用程式伺服器分析器（兩者）       |
| `reply.profiler` | 僅回覆階段分析器                                          |
| `codex.profiler` | 僅 Codex 應用程式伺服器分析器                             |
| `timeline`       | 結構化 JSONL 時間軸成品（見下方）                         |

## 透過設定啟用

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

多個旗標：

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

## 環境覆寫（一次性）

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,brave.http
```

值會以逗號或空白分割。特殊值：

| 值                          | 效果                                     |
| --------------------------- | ---------------------------------------- |
| `0`, `false`, `off`, `none` | 停用所有旗標，也會覆寫設定               |
| `1`, `true`, `all`, `*`     | 啟用所有旗標                             |

`OPENCLAW_DIAGNOSTICS=0` 會停用該程序中來自環境與設定的旗標，適合用來
暫時靜音設定中遺留開啟的分析器旗標，而不必編輯檔案。

## 分析器旗標

分析器旗標會控管輕量時間跨度；關閉時不會增加額外負擔。

為一次閘道執行啟用所有受分析器控管的跨度：

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

僅啟用回覆派送分析器跨度：

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

僅啟用 Codex 應用程式伺服器啟動/工具/執行緒分析器跨度：

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

`profiler` 會同時啟用回覆分析器與 Codex 分析器；若只要啟用其中一個，
請使用具範圍的旗標名稱。

或在設定中設定：

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

變更設定旗標後請重新啟動閘道。若要停用分析器旗標，請將它從
`diagnostics.flags` 移除並重新啟動，或使用 `OPENCLAW_DIAGNOSTICS=0`
啟動程序，以覆寫該次執行的所有診斷旗標。

## 時間軸成品

`timeline` 旗標（別名：`diagnostics.timeline`）會將結構化啟動與執行階段
計時事件寫成 JSONL，供外部 QA 測試工具使用：

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

或在設定中啟用：

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

輸出路徑一律來自 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`，即使旗標本身是在
設定中設定；路徑沒有對應的設定鍵。當 `timeline` 只從設定啟用時，最早的
設定載入跨度會遺失，因為 OpenClaw 尚未讀取設定；後續啟動跨度會正常擷取。

`OPENCLAW_DIAGNOSTICS=1`、`=all` 和 `=*` 也會啟用時間軸，因為它們會啟用
所有旗標。若你只想要 JSONL 成品，而不是所有其他診斷旗標，請優先使用
具範圍的 `timeline` 旗標。

時間軸中的事件迴圈延遲樣本需要在 `timeline` 之外再額外選擇啟用：
在啟用時間軸的同時設定 `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`
（或 `on`/`true`/`yes`）。

時間軸記錄使用 `openclaw.diagnostics.v1` 封套，並可包含程序 ID、階段名稱、
跨度名稱、持續時間、外掛 ID、相依項目數量、事件迴圈延遲樣本、供應者操作名稱、
子程序結束狀態，以及啟動錯誤名稱/訊息。請將時間軸檔案視為本機診斷成品；
在分享至你的機器之外前先審查。

## 記錄位置

旗標會將記錄送到標準診斷記錄檔。預設為：

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

如果你設定了 `logging.file`，請改用該路徑。記錄是 JSONL（每行一個 JSON
物件）。遮蔽仍會依據 `logging.redactSensitive` 套用。完整的記錄路徑解析、
輪替與遮蔽模型，請參閱[記錄](/zh-TW/logging)。

## 擷取記錄

挑選最新的記錄檔：

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

篩選 Telegram HTTP 診斷：

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

篩選 Brave Search HTTP 診斷：

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

或在重現時追蹤：

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

對於遠端閘道，請改用 `openclaw logs --follow`（見
[/cli/logs](/zh-TW/cli/logs)）。

## 注意事項

- 如果 `logging.level` 設得高於 `warn`，受旗標控管的記錄可能會被
  抑制。預設的 `info` 沒問題。
- `brave.http` 會記錄 Brave Search 請求 URL/查詢參數、回應
  狀態/計時，以及快取命中/未命中/寫入事件。它不會記錄 API 金鑰
  （以請求標頭送出）或回應主體，但搜尋查詢可能具有敏感性。
- 旗標可以安全地保持啟用；它們只會影響特定子系統的記錄量。
- 使用 [/logging](/zh-TW/logging) 變更記錄目的地、層級與遮蔽。

## 相關

- [閘道診斷](/zh-TW/gateway/diagnostics)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
