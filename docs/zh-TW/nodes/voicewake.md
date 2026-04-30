---
read_when:
    - 變更語音喚醒詞的行為或預設值
    - 新增需要喚醒詞同步的 Node 平台
summary: 全域語音喚醒詞（由 Gateway 管理）及其在各節點間的同步方式
title: 語音喚醒
x-i18n:
    generated_at: "2026-04-30T03:18:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: ac638cdf89f09404cdf293b416417f6cb3e31865b09f04ef87b9604e436dcbbe
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw 將**喚醒詞視為單一全域清單**，由 **Gateway** 擁有。

- **沒有每個 Node 自訂喚醒詞**。
- **任何 Node/應用程式 UI 都可以編輯**該清單；變更會由 Gateway 持久化並廣播給所有人。
- macOS 和 iOS 保留本機**語音喚醒啟用/停用**切換（本機 UX 與權限有所不同）。
- Android 目前保持語音喚醒關閉，並在語音分頁使用手動麥克風流程。

## 儲存（Gateway 主機）

喚醒詞儲存在 Gateway 機器上的：

- `~/.openclaw/settings/voicewake.json`

形狀：

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## 協定

### 方法

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set`，參數為 `{ triggers: string[] }` → `{ triggers: string[] }`

注意事項：

- 觸發詞會被正規化（修剪空白、移除空值）。空清單會回退到預設值。
- 為了安全會強制執行限制（數量/長度上限）。

### 路由方法（觸發詞 → 目標）

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set`，參數為 `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

`VoiceWakeRoutingConfig` 形狀：

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

路由目標只支援以下其中一種：

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### 事件

- `voicewake.changed` 酬載 `{ triggers: string[] }`
- `voicewake.routing.changed` 酬載 `{ config: VoiceWakeRoutingConfig }`

接收者：

- 所有 WebSocket 用戶端（macOS 應用程式、WebChat 等）
- 所有已連線的 Node（iOS/Android），並且在 Node 連線時也會推送初始「目前狀態」。

## 用戶端行為

### macOS 應用程式

- 使用全域清單來控管 `VoiceWakeRuntime` 觸發詞。
- 在語音喚醒設定中編輯「觸發詞」會呼叫 `voicewake.set`，然後依賴廣播讓其他用戶端保持同步。

### iOS Node

- 使用全域清單進行 `VoiceWakeManager` 觸發詞偵測。
- 在設定中編輯喚醒詞會呼叫 `voicewake.set`（透過 Gateway WS），並且也會讓本機喚醒詞偵測保持即時回應。

### Android Node

- Android 執行階段/設定目前停用語音喚醒。
- Android 語音使用語音分頁中的手動麥克風擷取，而不是喚醒詞觸發。

## 相關

- [對話模式](/zh-TW/nodes/talk)
- [音訊與語音備忘](/zh-TW/nodes/audio)
- [媒體理解](/zh-TW/nodes/media-understanding)
