---
read_when:
    - 您想要將系統事件加入佇列，而不建立 Cron 工作
    - 你需要啟用或停用 Heartbeat
    - 您想要檢視系統在線狀態項目
summary: '`openclaw system` 的 CLI 參考（系統事件、Heartbeat、在線狀態）'
title: 系統
x-i18n:
    generated_at: "2026-05-11T20:26:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2810fb064ea4afeac24ca0d71419913a664bbec0721cabdb09196075914f4864
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Gateway 的系統層級輔助工具：將系統事件加入佇列、控制 Heartbeat，
以及檢視存在狀態。

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

預設在 **主要** 工作階段將系統事件加入佇列。下一次 Heartbeat
會將它作為提示中的 `System:` 行注入。使用 `--mode now` 可立即觸發
Heartbeat；`next-heartbeat` 會等待下一次排定的觸發週期。

傳入 `--session-key` 可指定特定工作階段（例如將非同步任務完成狀態轉送回
啟動它的頻道）。

> **搭配 `--session-key` 的時序例外：** 提供 `--session-key` 時，
> `--mode next-heartbeat` 會收斂為立即的定向喚醒，而不是等待下一次排定的觸發週期。
> 定向喚醒使用 Heartbeat 意圖 `immediate`，因此會略過執行器的未到期閘門；否則該閘門
> 會延後（實際上等同丟棄）一個 `event` 意圖喚醒。如果你想要延遲
> 傳送，請省略 `--session-key`，讓事件落在主要工作階段，並隨下一次一般 Heartbeat
> 一起送出。

旗標：

- `--text <text>`：必要的系統事件文字。
- `--mode <mode>`：`now` 或 `next-heartbeat`（預設）。
- `--session-key <sessionKey>`：選用；指定特定代理工作階段，
  而不是代理的主要工作階段。不屬於已解析代理的鍵會回退到代理的主要工作階段。
- `--json`：機器可讀的輸出。
- `--url`、`--token`、`--timeout`、`--expect-final`：共用的 Gateway RPC 旗標。

## `system heartbeat last|enable|disable`

Heartbeat 控制：

- `last`：顯示上一個 Heartbeat 事件。
- `enable`：重新開啟 Heartbeat（如果先前已停用，請使用此項）。
- `disable`：暫停 Heartbeat。

旗標：

- `--json`：機器可讀的輸出。
- `--url`、`--token`、`--timeout`、`--expect-final`：共用的 Gateway RPC 旗標。

## `system presence`

列出 Gateway 目前知道的系統存在狀態項目（節點、實例，以及類似的狀態行）。

旗標：

- `--json`：機器可讀的輸出。
- `--url`、`--token`、`--timeout`、`--expect-final`：共用的 Gateway RPC 旗標。

## 注意事項

- 需要可由你目前設定連線到的執行中 Gateway（本機或遠端）。
- 系統事件是暫時性的，不會在重新啟動後保留。

## 相關

- [CLI 參考](/zh-TW/cli)
