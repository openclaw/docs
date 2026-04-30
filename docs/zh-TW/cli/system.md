---
read_when:
    - 你想要將系統事件排入佇列，而不建立 Cron 作業
    - 您需要啟用或停用 Heartbeat
    - 您想要檢視系統在線狀態項目
summary: '`openclaw system` 的 CLI 參考（系統事件、Heartbeat、線上狀態）'
title: 系統
x-i18n:
    generated_at: "2026-04-30T02:56:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f4be30b0b2d18ee5653071d6375cebeb9fc94733e30bdb7b89a19c286df880b
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Gateway 的系統層級輔助工具：將系統事件排入佇列、控制 Heartbeat，
並檢視線上狀態。

所有 `system` 子命令都使用 Gateway RPC，並接受共用的用戶端旗標：

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## 常用命令

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

在**主要**工作階段上將系統事件排入佇列。下一次 Heartbeat 會將它作為提示中的
`System:` 行注入。使用 `--mode now` 可立即觸發 Heartbeat；
`next-heartbeat` 會等待下一個排程的週期。

旗標：

- `--text <text>`：必要的系統事件文字。
- `--mode <mode>`：`now` 或 `next-heartbeat`（預設）。
- `--json`：機器可讀輸出。
- `--url`、`--token`、`--timeout`、`--expect-final`：共用的 Gateway RPC 旗標。

## `system heartbeat last|enable|disable`

Heartbeat 控制：

- `last`：顯示最後一個 Heartbeat 事件。
- `enable`：重新開啟 Heartbeat（如果它們先前已停用，請使用此項）。
- `disable`：暫停 Heartbeat。

旗標：

- `--json`：機器可讀輸出。
- `--url`、`--token`、`--timeout`、`--expect-final`：共用的 Gateway RPC 旗標。

## `system presence`

列出 Gateway 已知的目前系統線上狀態項目（節點、執行個體，
以及類似的狀態列）。

旗標：

- `--json`：機器可讀輸出。
- `--url`、`--token`、`--timeout`、`--expect-final`：共用的 Gateway RPC 旗標。

## 注意事項

- 需要一個可由目前設定連線的執行中 Gateway（本機或遠端）。
- 系統事件是暫時性的，不會在重新啟動後保留。

## 相關

- [CLI 參考](/zh-TW/cli)
