---
read_when:
    - 你想要將系統事件加入佇列，而不建立排程工作
    - 您需要啟用或停用心跳偵測
    - 您想要檢查系統上線狀態項目
summary: '`openclaw system` 的命令列介面參考（系統事件、心跳偵測、上線狀態）'
title: 系統
x-i18n:
    generated_at: "2026-07-11T21:13:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

閘道的系統層級輔助工具：將系統事件加入佇列、控制心跳偵測，以及檢視上線狀態。

所有 `system` 子命令都使用閘道 RPC，並接受共用的用戶端旗標：

| 旗標              | 預設值                               | 說明                                                                                                                                                                                                   |
| ----------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--url <url>`     | 設定時為 `gateway.remote.url`        | 閘道 WebSocket URL。                                                                                                                                                                                   |
| `--token <token>` | 無                                   | 閘道權杖（如有需要）。                                                                                                                                                                                 |
| `--timeout <ms>`  | `30000`                              | RPC 逾時時間，以毫秒為單位。                                                                                                                                                                          |
| `--expect-final`  | 關閉                                 | 等待最終回應（代理程式）。                                                                                                                                                                             |
| `--json`          | 關閉                                 | 輸出 JSON。無論此旗標為何，`heartbeat last/enable/disable` 和 `system presence` 一律輸出原始 RPC JSON 承載資料；`system event` 則使用此旗標在 JSON 與單純的 `ok` 行之間切換。 |

## 常用命令

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

預設將系統事件加入**主要**工作階段的佇列。下一次心跳偵測會將其以 `System:` 行的形式注入提示詞。使用 `--mode now` 可立即觸發心跳偵測；`next-heartbeat`（預設值）則會等待下一次排定的觸發時點。

傳入 `--session-key` 可指定特定工作階段，例如將非同步任務的完成結果轉送回啟動該任務的頻道。

<Note>
**使用 `--session-key` 時的時間例外：**提供 `--session-key` 時，`--mode next-heartbeat` 不會等待下一次排定的觸發時點，而會改成立即對目標發出喚醒。定向喚醒使用心跳偵測意圖 `immediate`，因此會略過執行器的尚未到期閘門；否則該閘門會延後（實際上等同捨棄）意圖為 `event` 的喚醒。若要延遲傳送，請省略 `--session-key`，讓事件送至主要工作階段，並隨下一次定期心跳偵測送出。
</Note>

旗標：

- `--text <text>`：必要的系統事件文字。
- `--mode <mode>`：`now` 或 `next-heartbeat`（預設值）。
- `--session-key <sessionKey>`：選用；指定特定代理程式工作階段，而非代理程式的主要工作階段。不屬於已解析代理程式的金鑰，會回退至該代理程式的主要工作階段。

## `system heartbeat last|enable|disable`

- `last`：顯示最近一次心跳偵測事件。
- `enable`：重新開啟心跳偵測（若先前已停用，請使用此選項）。
- `disable`：暫停心跳偵測。

## `system presence`

列出閘道目前已知的系統上線狀態項目（節點、執行個體及類似的狀態行）。

## 注意事項

- 需要有執行中的閘道，且可透過目前的設定連線（本機或遠端）。
- 系統事件是暫時性的，不會跨重新啟動持久保存。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
