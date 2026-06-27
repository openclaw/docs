---
read_when:
    - 你想要從終端讀取已儲存的逐字稿摘要
    - 你需要逐字稿 Markdown 摘要的路徑
    - 你正在偵錯核心逐字稿儲存配置
summary: 命令列介面參考：`openclaw transcripts`（列出、顯示並定位已儲存的轉錄）
title: 逐字稿命令列介面
x-i18n:
    generated_at: "2026-06-27T19:08:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae6010cfb4e051182f1c48d0d728b30d054542e1e7983ff15a2432840193f9c0
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

檢查由 OpenClaw 核心 `transcripts` 工具寫入的逐字稿。此命令列介面為唯讀；擷取、匯入和摘要由代理工具以及已設定的自動啟動來源負責。

當你想尋找昨天的筆記、在編輯器中開啟 Markdown 檔案、將逐字稿提供給另一個工具，或偵錯某個工作階段落在磁碟上的位置時，請使用此命令列介面。它不會啟動或停止擷取。

成品位於 OpenClaw 狀態目錄下：

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

預設狀態目錄是 `~/.openclaw`；設定 `OPENCLAW_STATE_DIR` 可使用不同目錄。日期目錄來自工作階段開始時間，而工作階段目錄則是從工作階段 id 衍生出的安全檔案系統區段。

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

- `list`：列出已儲存的工作階段、含日期的選擇器、開始時間、標題和 `summary.md` 路徑。
- `show <session>`：列印已儲存的 `summary.md`。
- `path <session>`：列印 `summary.md` 路徑。
- `path <session> --dir`：列印工作階段目錄。
- `path <session> --metadata`：列印 `metadata.json`。
- `path <session> --transcript`：列印 `transcript.jsonl`。
- `--json`：列印機器可讀輸出。

當人類可讀的工作階段 id 在不同日期重複時，請使用 `list` 中的含日期選擇器，例如 `openclaw transcripts show 2026-05-22/standup`。預設工作階段 id 包含時間戳記和隨機後綴；只有在固定工作階段 id 於當日內唯一時，才設定固定工作階段 id。

## 輸出

`list` 每行列印一個工作階段：

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Weekly standup  /Users/alex/.openclaw/transcripts/2026-05-22/standup/summary.md
```

輸出以定位字元分隔。欄位為選擇器、開始時間、標題和摘要路徑。選擇器是傳回給 `show` 或 `path` 時最安全的值。

`list --json` 會列印包含以下欄位的物件：

- `sessionId`
- `selector`
- `date`
- `title`
- `startedAt`
- `stoppedAt`
- `source`
- `path`
- `summaryPath`
- `hasSummary`

`show --json` 會傳回已儲存的工作階段中繼資料、選擇器、工作階段目錄、摘要路徑和摘要 Markdown 文字。`path --json` 會傳回所選路徑，以及該檔案是否存在。

## 每天多場會議

逐字稿會先依日期分組工作階段，再依工作階段 id 分組。同一天的十場會議會成為十個同層資料夾：

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

大多數自動化請使用預設產生的 id。只有在同一個 id 不會於同一天重複使用時，才使用像 `standup` 這樣的固定 id。

## 缺少摘要

即時工作階段會在工作階段停止時寫入 `summary.md`。匯入的逐字稿會在匯入後立即寫入 `summary.md`。當擷取仍在進行中、提供者在停止期間失敗，或中繼資料在任何發言到達前就已寫入時，工作階段仍可能出現在 `list` 中但沒有摘要。

使用 `path <session> --transcript` 檢查僅附加的逐字稿，並使用 `transcripts` 工具動作 `summarize` 重新產生 Markdown 摘要。

## 設定

逐字稿擷取為選擇啟用，因為即時來源可以加入並錄製會議音訊。使用頂層 `transcripts.enabled` 啟用此工具：

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

在 `openclaw.json` 中使用 `transcripts.autoStart` 設定自動啟動來源。每個項目只要存在即為啟用；省略某個項目即可停用該來源。

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      },
      {
        "providerId": "slack-huddle",
        "accountId": "workspace",
        "channelId": "C123"
      }
    ]
  }
}
```
