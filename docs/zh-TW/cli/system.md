---
read_when:
    - 你想要在不建立排程工作的情況下，將系統事件排入佇列
    - 你需要啟用或停用心跳偵測
    - 你想檢查系統存在項目
summary: '`openclaw system` 的命令列介面參考（系統事件、心跳偵測、上線狀態）'
title: 系統
x-i18n:
    generated_at: "2026-07-05T11:13:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

閘道的系統層級輔助工具：將系統事件加入佇列、控制心跳偵測，以及檢視狀態存在資訊。

所有 `system` 子命令都使用閘道 RPC，並接受共用的用戶端旗標：

| 旗標              | 預設值                              | 說明                                                                                                                                                                                            |
| ----------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--url <url>`     | 已設定時為 `gateway.remote.url` | 閘道 WebSocket URL。                                                                                                                                                                                 |
| `--token <token>` | 無                                 | 閘道權杖（如果需要）。                                                                                                                                                                           |
| `--timeout <ms>`  | `30000`                              | RPC 逾時時間，單位為毫秒。                                                                                                                                                                           |
| `--expect-final`  | 關閉                                  | 等待最終回應（代理程式）。                                                                                                                                                                       |
| `--json`          | 關閉                                  | 輸出 JSON。`heartbeat last/enable/disable` 和 `system presence` 一律印出原始 RPC JSON 負載，不受此旗標影響；`system event` 會使用它在 JSON 與純文字 `ok` 行之間切換。 |

## 常用命令

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

預設在**主要**工作階段上將系統事件加入佇列。下一次心跳偵測會將它作為提示中的 `System:` 行注入。使用 `--mode now` 可立即觸發心跳偵測；`next-heartbeat`（預設）會等待下一個排程的 tick。

傳入 `--session-key` 可指定特定工作階段，例如將非同步任務完成狀態轉送回啟動它的頻道。

<Note>
**使用 `--session-key` 時的時序例外：**提供 `--session-key` 時，`--mode next-heartbeat` 會收斂為立即的定向喚醒，而不是等待下一個排程的 tick。定向喚醒會使用心跳偵測意圖 `immediate`，因此會繞過執行器的未到期閘門；否則該閘門會延後（並實際上丟棄）`event` 意圖的喚醒。如果你想要延遲交付，請省略 `--session-key`，讓事件落在主要工作階段，並搭載下一次一般心跳偵測。
</Note>

旗標：

- `--text <text>`：必填的系統事件文字。
- `--mode <mode>`：`now` 或 `next-heartbeat`（預設）。
- `--session-key <sessionKey>`：選填；指定特定代理程式工作階段，而不是代理程式的主要工作階段。不屬於已解析代理程式的金鑰，會回退到代理程式的主要工作階段。

## `system heartbeat last|enable|disable`

- `last`：顯示最後一個心跳偵測事件。
- `enable`：重新開啟心跳偵測（如果先前已停用，請使用此命令）。
- `disable`：暫停心跳偵測。

## `system presence`

列出閘道目前知道的系統狀態存在項目（節點、執行個體，以及類似的狀態行）。

## 注意事項

- 需要有可由目前設定連線的執行中閘道（本機或遠端）。
- 系統事件是暫時性的，重新啟動後不會保留。

## 相關

- [命令列介面參考](/zh-TW/cli)
