---
read_when:
    - 你需要在不提高全域記錄層級的情況下取得針對性的除錯日誌
    - 你需要擷取特定子系統的日誌以供支援使用
summary: 用於目標式偵錯記錄的診斷旗標
title: 診斷旗標
x-i18n:
    generated_at: "2026-04-30T03:03:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 486051e54c456dedcae5dce59e253add3554d8417660bfc97a75d21fa5fdd6f5
    source_path: diagnostics/flags.md
    workflow: 16
---

診斷旗標可讓你啟用目標式偵錯日誌，而不必在所有地方開啟詳細記錄。旗標採選擇啟用，除非子系統檢查它們，否則不會有任何作用。

## 運作方式

- 旗標是字串（不區分大小寫）。
- 你可以在設定中或透過環境變數覆寫啟用旗標。
- 支援萬用字元：
  - `telegram.*` 會符合 `telegram.http`
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
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

變更旗標後請重新啟動 Gateway。

## 環境變數覆寫（一次性）

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

停用所有旗標：

```bash
OPENCLAW_DIAGNOSTICS=0
```

## 時間軸產物

`timeline` 旗標會為外部 QA 測試框架寫入結構化的啟動與執行階段計時事件：

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

時間軸檔案路徑仍來自 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`。當 `timeline` 只從設定啟用時，最早的設定載入區段不會被發出，因為 OpenClaw 尚未讀取設定；後續的啟動區段會使用設定旗標。

`OPENCLAW_DIAGNOSTICS=1`、`OPENCLAW_DIAGNOSTICS=all` 和 `OPENCLAW_DIAGNOSTICS=*` 也會啟用時間軸，因為它們會啟用每個診斷旗標。當你只想要 JSONL 計時產物時，請優先使用 `timeline`。

時間軸記錄使用 `openclaw.diagnostics.v1` 封套。事件可包含程序 ID、階段名稱、區段名稱、持續時間、Plugin ID、相依項目數量、事件迴圈延遲樣本、提供者操作名稱、子程序結束狀態，以及啟動錯誤名稱/訊息。請將時間軸檔案視為本機診斷產物；在分享至你的機器之外前，請先檢閱內容。

## 日誌位置

旗標會將日誌發出到標準診斷日誌檔。預設為：

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

如果你設定了 `logging.file`，請改用該路徑。日誌為 JSONL（每行一個 JSON 物件）。仍會根據 `logging.redactSensitive` 套用遮蔽。

## 擷取日誌

選擇最新的日誌檔：

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

篩選 Telegram HTTP 診斷：

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

或在重現問題時追蹤：

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

對於遠端 Gateway，你也可以使用 `openclaw logs --follow`（請參閱 [/cli/logs](/zh-TW/cli/logs)）。

## 備註

- 如果 `logging.level` 設得高於 `warn`，這些日誌可能會被抑制。預設的 `info` 沒問題。
- 旗標可安全地保持啟用；它們只會影響特定子系統的日誌量。
- 使用 [/logging](/zh-TW/logging) 變更日誌目的地、層級和遮蔽。

## 相關

- [Gateway 診斷](/zh-TW/gateway/diagnostics)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
