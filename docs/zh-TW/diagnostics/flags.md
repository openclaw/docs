---
read_when:
    - 你需要針對性的偵錯日誌，而不提高全域日誌層級
    - 您需要擷取特定子系統的記錄以供支援使用
summary: 用於目標式偵錯日誌的診斷旗標
title: 診斷旗標
x-i18n:
    generated_at: "2026-07-11T21:18:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9847f464fde89d9e639b089fe54fb933deb9debad2a6d8b120ab01bacff181a8
    source_path: diagnostics/flags.md
    workflow: 16
---

診斷旗標可為單一子系統啟用額外記錄，而不必全域提高
`logging.level`。除非子系統會檢查某個旗標，否則該旗標不會產生任何作用。

## 運作方式

- 旗標是不區分大小寫的字串，由設定中的 `diagnostics.flags` 加上
  `OPENCLAW_DIAGNOSTICS` 環境變數覆寫值解析而成，並會去除重複項目及轉為小寫。
- `name.*` 會比對 `name` 本身以及 `name.` 之下的所有項目（例如
  `telegram.*` 會比對 `telegram.http`）。
- `*` 或 `all` 會啟用所有旗標。
- 在設定中變更 `diagnostics.flags` 後，請重新啟動閘道；此設定不支援
  熱重新載入。

## 已知旗標

| 旗標             | 啟用功能                                                  |
| ---------------- | --------------------------------------------------------- |
| `telegram.http`  | Telegram Bot API HTTP 錯誤記錄                            |
| `brave.http`     | Brave Search 請求／回應／快取記錄                         |
| `profiler`       | 回覆階段效能分析器與 Codex 應用程式伺服器效能分析器（兩者） |
| `reply.profiler` | 僅啟用回覆階段效能分析器                                  |
| `codex.profiler` | 僅啟用 Codex 應用程式伺服器效能分析器                     |
| `timeline`       | 結構化 JSONL 時間軸成品（見下文）                         |

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

## 環境變數覆寫（單次）

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,brave.http
```

值會依逗號或空白分隔。特殊值：

| 值                          | 效果                                     |
| --------------------------- | ---------------------------------------- |
| `0`, `false`, `off`, `none` | 停用所有旗標，並同時覆寫設定             |
| `1`, `true`, `all`, `*`     | 啟用所有旗標                             |

`OPENCLAW_DIAGNOSTICS=0` 會同時停用該程序來自環境變數與設定的旗標，適合在不編輯檔案的情況下，暫時停用設定中仍保持啟用的效能分析器旗標。

## 效能分析器旗標

效能分析器旗標可控制輕量的計時區段；停用時不會增加任何額外負擔。

為單次閘道執行啟用所有受效能分析器旗標控制的區段：

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

僅啟用回覆分派效能分析器區段：

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

僅啟用 Codex 應用程式伺服器的啟動／工具／執行緒效能分析器區段：

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

`profiler` 會同時啟用回覆效能分析器與 Codex 效能分析器；若只要啟用其中一個，請使用限定範圍的旗標名稱。

或者在設定中指定：

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

變更設定旗標後，請重新啟動閘道。若要停用效能分析器旗標，請將其從 `diagnostics.flags` 移除並重新啟動；或者使用 `OPENCLAW_DIAGNOSTICS=0` 啟動程序，以覆寫該次執行的所有診斷旗標。

## 時間軸成品

`timeline` 旗標（別名：`diagnostics.timeline`）會將結構化的啟動與執行階段計時事件寫入 JSONL，供外部 QA 測試框架使用：

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

或者在設定中啟用：

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

即使旗標本身是在設定中指定，輸出路徑也一律取自 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`；路徑沒有對應的設定鍵。若 `timeline` 僅透過設定啟用，最早期的設定載入區段會缺失，因為 OpenClaw 當時尚未讀取設定；後續的啟動區段則會正常擷取。

`OPENCLAW_DIAGNOSTICS=1`、`=all` 和 `=*` 也會啟用時間軸，因為這些值會啟用所有旗標。如果只需要 JSONL 成品，而不需要其他所有診斷旗標，建議使用限定範圍的 `timeline` 旗標。

時間軸中的事件迴圈延遲樣本除了 `timeline` 之外，還需要額外明確啟用：在啟用時間軸的基礎上，設定 `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`（或 `on`／`true`／`yes`）。

時間軸記錄使用 `openclaw.diagnostics.v1` 封套，其中可包含程序 ID、階段名稱、區段名稱、持續時間、外掛 ID、相依項目數量、事件迴圈延遲樣本、提供者操作名稱、子程序結束狀態，以及啟動錯誤名稱／訊息。請將時間軸檔案視為本機診斷成品；在分享至本機以外的位置前，請先檢閱內容。

## 記錄輸出位置

旗標會將記錄輸出至標準診斷記錄檔。預設為：

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

如果設定了 `logging.file`，則改用該路徑。記錄格式為 JSONL（每行一個 JSON 物件）。遮蔽處理仍會依據 `logging.redactSensitive` 套用。完整的記錄路徑解析、輪替與遮蔽模型，請參閱[記錄](/zh-TW/logging)。

## 擷取記錄

選取最新的記錄檔：

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

或者在重現問題時持續追蹤：

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

若為遠端閘道，請改用 `openclaw logs --follow`（請參閱
[/cli/logs](/zh-TW/cli/logs)）。

## 注意事項

- 如果 `logging.level` 設定為高於 `warn`，受旗標控制的記錄可能會遭到抑制。預設的 `info` 即可。
- `brave.http` 會記錄 Brave Search 的請求 URL／查詢參數、回應狀態／計時，以及快取命中／未命中／寫入事件。它不會記錄 API 金鑰（其透過請求標頭傳送）或回應本文，但搜尋查詢可能包含敏感資訊。
- 旗標可安全地保持啟用；它們只會影響特定子系統的記錄量。
- 使用[記錄](/zh-TW/logging)變更記錄輸出位置、層級與遮蔽設定。

## 相關內容

- [閘道診斷](/zh-TW/gateway/diagnostics)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
