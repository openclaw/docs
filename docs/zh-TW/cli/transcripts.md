---
read_when:
    - 你想要從終端機讀取已儲存的轉錄摘要
    - 你需要逐字稿 Markdown 摘要的路徑
    - 你正在偵錯核心逐字稿儲存配置
summary: '`openclaw transcripts` 的命令列介面參考（列出、顯示及定位已儲存的轉錄）'
title: 轉錄稿命令列介面
x-i18n:
    generated_at: "2026-07-05T11:11:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde02e924339c64cf6acd5c4b6162785dcfccf4a1df2aac0d9d52d5306511579
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

用於檢查由 `transcripts` agent 工具寫入之逐字稿的唯讀檢查器。
擷取、匯入與摘要會透過該工具執行，而不是透過此命令列介面。

成品位於狀態目錄下：

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

預設狀態目錄是 `~/.openclaw`；可用 `OPENCLAW_STATE_DIR` 覆寫。
日期目錄來自工作階段開始時間；工作階段目錄是由工作階段 ID 衍生而來、適合檔案系統使用的 slug。

## 命令

```bash
openclaw transcripts list
openclaw transcripts show <session>
openclaw transcripts show YYYY-MM-DD/<session>
openclaw transcripts path <session>
openclaw transcripts path YYYY-MM-DD/<session>
openclaw transcripts path <session> --dir
openclaw transcripts path <session> --metadata
openclaw transcripts path <session> --transcript
openclaw transcripts list --json
openclaw transcripts show <session> --json
openclaw transcripts path <session> --json
```

| 命令                          | 說明                                            |
| ----------------------------- | ----------------------------------------------- |
| `list`                        | 列出已儲存的工作階段。                          |
| `show <session>`              | 列印已儲存的 `summary.md`。                     |
| `path <session>`              | 列印 `summary.md` 路徑。                        |
| `path <session> --dir`        | 列印工作階段目錄。                              |
| `path <session> --metadata`   | 列印 `metadata.json`。                          |
| `path <session> --transcript` | 列印 `transcript.jsonl`。                       |
| `--json`                      | 列印機器可讀輸出（任何子命令）。                |

`<session>` 接受純工作階段 ID，或帶日期的選擇器
（`YYYY-MM-DD/<session>`）。當相同工作階段 ID 出現在多天時，請使用帶日期的形式，例如 `openclaw transcripts show
2026-05-22/standup`。預設工作階段 ID 會包含時間戳與隨機
後綴；只有在該 ID 在當天內唯一時，才為工作階段指定固定 ID。

## 輸出

`list` 會為每個工作階段列印一行以定位字元分隔的內容：選擇器、開始時間、標題、摘要路徑。

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Weekly standup  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

選擇器是傳回給 `show` 或 `path` 時最安全的值。

`list --json` 會傳回包含 `sessionId`、`selector`、`date`、`title`、
`startedAt`、`stoppedAt`、`source`、`path`、`summaryPath`、`hasSummary` 的物件。

`show --json` 會傳回已儲存的工作階段中繼資料、選擇器、工作階段
目錄、摘要路徑，以及摘要 Markdown 文字。

`path --json` 會傳回所選路徑，以及該檔案是否存在。

## 每天多個工作階段

工作階段先依日期分組，再依工作階段 ID 分組。一天內的十場會議會變成
十個同層資料夾：

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

自動化請使用預設產生的 ID。只有在同一日期不會重複時，才使用像 `standup` 這樣的固定 ID。

## 缺少摘要

即時工作階段會在工作階段停止時寫入 `summary.md`；匯入的逐字稿
會在匯入後立即寫入。若擷取仍在進行、提供者在停止期間失敗，或
中繼資料在任何發言抵達前就已寫入，工作階段可能會出現在 `list` 中但沒有
摘要。

使用 `path <session> --transcript` 檢查原始的僅附加逐字稿，
或執行 `transcripts` 工具的 `summarize` 動作以重新產生 Markdown
摘要。

## 設定

擷取採選用制（即時來源可以加入並錄製會議音訊）。使用以下方式啟用：

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

- `enabled`（預設 `false`）：啟用此工具。
- `maxUtterances`（預設 `2000`，限制為 1-10000）：每個
  工作階段的發言緩衝大小。

使用 `transcripts.autoStart` 設定自動啟動來源。每個項目
只要存在即為啟用；省略某個項目即可停用該來源。`discord-voice`
是內建具備自動啟動能力的來源，且需要 `guildId` 與
`channelId`：

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      }
    ]
  }
}
```
