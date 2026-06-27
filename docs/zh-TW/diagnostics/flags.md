---
read_when:
    - 你需要有針對性的除錯日誌，而不提高全域記錄層級
    - 你需要擷取子系統專屬記錄以供支援
summary: 用於目標偵錯記錄的診斷旗標
title: 診斷旗標
x-i18n:
    generated_at: "2026-06-27T19:15:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c78c5c2f90fb1d601d0a3ef94919310759d58c9f9c70a093c91f31594bc777fb
    source_path: diagnostics/flags.md
    workflow: 16
---

診斷旗標可讓你啟用目標式偵錯記錄，而不必到處開啟詳細記錄。旗標採用選擇加入，除非子系統檢查它們，否則不會有任何效果。

## 運作方式

- 旗標是字串（不區分大小寫）。
- 你可以在設定中啟用旗標，或透過環境變數覆寫。
- 支援萬用字元：
  - `telegram.*` 會比對 `telegram.http`
  - `*` 會啟用所有旗標

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

變更旗標後請重新啟動閘道。

## 環境變數覆寫（一次性）

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

停用所有旗標：

```bash
OPENCLAW_DIAGNOSTICS=0
```

`OPENCLAW_DIAGNOSTICS=0` 是程序層級的停用覆寫：它會停用該程序中來自環境變數與設定的旗標。

## 效能分析旗標

效能分析器旗標可啟用目標式計時區段，而不提高全域記錄層級。它們預設為停用。

針對一次閘道執行啟用所有受效能分析器控管的區段：

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

僅啟用回覆分派效能分析器區段：

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

僅啟用 Codex 應用程式伺服器啟動／工具／執行緒效能分析器區段：

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

從設定啟用效能分析器旗標：

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

變更設定旗標後請重新啟動閘道。若要停用效能分析器旗標，請從 `diagnostics.flags` 移除它並重新啟動。若要暫時停用每個診斷旗標，即使設定已啟用效能分析器旗標，也請以下列方式啟動程序：

```bash
OPENCLAW_DIAGNOSTICS=0 openclaw gateway run
```

## 時間軸成品

`timeline` 旗標會為外部 QA 測試框架寫入結構化啟動與執行階段計時事件：

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

你也可以在設定中啟用它：

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

時間軸檔案路徑仍來自 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`。當 `timeline` 只從設定啟用時，最早的設定載入區段不會發出，因為 OpenClaw 尚未讀取設定；後續啟動區段會使用設定旗標。

`OPENCLAW_DIAGNOSTICS=1`、`OPENCLAW_DIAGNOSTICS=all` 和 `OPENCLAW_DIAGNOSTICS=*` 也會啟用時間軸，因為它們會啟用每個診斷旗標。當你只想要 JSONL 計時成品時，請優先使用 `timeline`。

時間軸記錄使用 `openclaw.diagnostics.v1` 封套。事件可以包含程序 ID、階段名稱、區段名稱、持續時間、外掛 ID、相依項數量、事件迴圈延遲樣本、供應商操作名稱、子程序結束狀態，以及啟動錯誤名稱／訊息。請將時間軸檔案視為本機診斷成品；在分享至你的機器外部之前，請先檢閱它們。

## 記錄位置

旗標會將記錄發出至標準診斷記錄檔。預設為：

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

如果你設定 `logging.file`，請改用該路徑。記錄為 JSONL（每行一個 JSON 物件）。遮罩仍會依據 `logging.redactSensitive` 套用。

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

或是在重現問題時追蹤：

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

對於遠端閘道，你也可以使用 `openclaw logs --follow`（請參閱 [/cli/logs](/zh-TW/cli/logs)）。

## 備註

- 如果 `logging.level` 設定高於 `warn`，這些記錄可能會被抑制。預設的 `info` 沒問題。
- `brave.http` 會記錄 Brave Search 請求 URL／查詢參數、回應狀態／計時，以及快取命中／未命中／寫入事件。它不會記錄 API 金鑰或回應本文，但搜尋查詢可能具有敏感性。
- 旗標可以安全地保持啟用；它們只會影響特定子系統的記錄量。
- 使用 [/logging](/zh-TW/logging) 變更記錄目的地、層級與遮罩。

## 相關

- [閘道診斷](/zh-TW/gateway/diagnostics)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
