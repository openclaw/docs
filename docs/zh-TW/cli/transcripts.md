---
read_when:
    - 你想要從終端機讀取已儲存的對話記錄摘要
    - 你需要逐字稿 Markdown 摘要的路徑
    - 你正在偵錯核心逐字記錄的儲存配置
summary: '`openclaw transcripts` 的命令列介面參考（列出、顯示及定位已儲存的對話記錄）'
title: 逐字稿命令列介面
x-i18n:
    generated_at: "2026-07-11T21:15:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde02e924339c64cf6acd5c4b6162785dcfccf4a1df2aac0d9d52d5306511579
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

用於檢查由 `transcripts` 代理工具寫入之逐字稿的唯讀檢視器。
擷取、匯入與摘要皆透過該工具執行，而非此命令列介面。

成品位於狀態目錄下：

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

預設狀態目錄為 `~/.openclaw`；可使用 `OPENCLAW_STATE_DIR` 覆寫。
日期目錄取自工作階段開始時間；工作階段目錄則是由工作階段 ID 衍生而來、可安全用於檔案系統的 slug。

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
| `show <session>`              | 輸出已儲存的 `summary.md`。                     |
| `path <session>`              | 輸出 `summary.md` 的路徑。                      |
| `path <session> --dir`        | 輸出工作階段目錄。                              |
| `path <session> --metadata`   | 輸出 `metadata.json`。                          |
| `path <session> --transcript` | 輸出 `transcript.jsonl`。                       |
| `--json`                      | 輸出機器可讀的內容（適用於任何子命令）。        |

`<session>` 可接受單獨的工作階段 ID，或包含日期的選擇器（`YYYY-MM-DD/<session>`）。當同一工作階段 ID 出現在多個日期時，請使用包含日期的格式，例如 `openclaw transcripts show 2026-05-22/standup`。預設工作階段 ID 包含時間戳記與隨機後綴；僅當固定 ID 在當日唯一時，才為工作階段指定固定 ID。

## 輸出

`list` 會為每個工作階段輸出一行以 Tab 分隔的內容：選擇器、開始時間、標題、摘要路徑。

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  每週例會  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

將選擇器傳回 `show` 或 `path` 是最安全的做法。

`list --json` 會傳回包含 `sessionId`、`selector`、`date`、`title`、`startedAt`、`stoppedAt`、`source`、`path`、`summaryPath`、`hasSummary` 的物件。

`show --json` 會傳回已儲存的工作階段中繼資料、選擇器、工作階段目錄、摘要路徑，以及 Markdown 格式的摘要文字。

`path --json` 會傳回所選路徑，以及該檔案是否存在。

## 每日多個工作階段

工作階段先依日期分組，再依工作階段 ID 分組。同一天的十場會議會成為十個同層資料夾：

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

自動化作業請使用預設產生的 ID。僅當同一日期內不會重複時，才使用 `standup` 之類的固定 ID。

## 缺少摘要

即時工作階段會在工作階段停止時寫入 `summary.md`；匯入的逐字稿則會在匯入後立即寫入。若擷取仍在進行、供應商在停止過程中失敗，或在收到任何發言前便已寫入中繼資料，工作階段可能會出現在 `list` 中，但沒有摘要。

使用 `path <session> --transcript` 檢查僅供附加的原始逐字稿，或執行 `transcripts` 工具的 `summarize` 動作，以重新產生 Markdown 摘要。

## 設定

擷取功能須選擇啟用（即時來源可以加入並錄製會議音訊）。請使用以下設定啟用：

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

- `enabled`（預設為 `false`）：啟用此工具。
- `maxUtterances`（預設為 `2000`，限制在 1 至 10000）：每個工作階段的發言緩衝區大小。

使用 `transcripts.autoStart` 設定自動啟動來源。每個項目只要存在即表示啟用；省略項目即可停用該來源。`discord-voice` 是內建且支援自動啟動的來源，並需要 `guildId` 與 `channelId`：

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
