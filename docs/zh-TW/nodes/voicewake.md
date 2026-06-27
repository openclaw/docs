---
read_when:
    - 變更語音喚醒詞行為或預設值
    - 新增需要同步喚醒詞的節點平台
summary: 全域語音喚醒詞（由閘道擁有）及其如何跨節點同步
title: 語音喚醒
x-i18n:
    generated_at: "2026-06-27T19:30:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c57955e8061eca2f9fec83500e829f183cd3ef9f794bf385823a28f9c89b0a4
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw 將**喚醒詞視為單一全域清單**，由**閘道**擁有。

- **沒有每個節點自訂的喚醒詞**。
- **任何節點/應用程式 UI 都可以編輯**此清單；變更會由閘道持久化並廣播給所有人。
- macOS 和 iOS 保留本機的**語音喚醒啟用/停用**切換（本機 UX 與權限不同）。
- Android 目前保持語音喚醒關閉，並在語音分頁使用手動麥克風流程。

## 儲存（閘道主機）

喚醒詞與路由規則儲存在閘道狀態資料庫中：

- `~/.openclaw/state/openclaw.sqlite`

作用中的資料表為：

- `voicewake_triggers`
- `voicewake_routing_config`
- `voicewake_routing_routes`

舊版 `settings/voicewake.json` 與 `settings/voicewake-routing.json` 檔案僅作為
doctor 遷移輸入；執行階段會讀寫 SQLite 資料表。

## 通訊協定

### 方法

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` 搭配參數 `{ triggers: string[] }` → `{ triggers: string[] }`

注意事項：

- 觸發詞會被正規化（修剪空白、移除空值）。空清單會回退到預設值。
- 為安全起見會強制套用限制（數量/長度上限）。

### 路由方法（觸發詞 → 目標）

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` 搭配參數 `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

`VoiceWakeRoutingConfig` 結構：

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

路由目標僅支援以下其中一種：

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### 事件

- `voicewake.changed` 承載 `{ triggers: string[] }`
- `voicewake.routing.changed` 承載 `{ config: VoiceWakeRoutingConfig }`

接收對象：

- 所有 WebSocket 用戶端（macOS 應用程式、WebChat 等）
- 所有已連線節點（iOS/Android），並且也會在節點連線時推送一次初始「目前狀態」。

## 用戶端行為

### macOS 應用程式

- 使用全域清單來控管 `VoiceWakeRuntime` 觸發詞。
- 在語音喚醒設定中編輯「Trigger words」會呼叫 `voicewake.set`，接著依賴廣播讓其他用戶端保持同步。

### iOS 節點

- 使用全域清單進行 `VoiceWakeManager` 觸發詞偵測。
- 在設定中編輯喚醒詞會呼叫 `voicewake.set`（透過閘道 WS），並同時保持本機喚醒詞偵測反應迅速。

### Android 節點

- 語音喚醒目前在 Android 執行階段/設定中停用。
- Android 語音會在語音分頁使用手動麥克風擷取，而不是喚醒詞觸發。

## 相關

- [對話模式](/zh-TW/nodes/talk)
- [音訊與語音備註](/zh-TW/nodes/audio)
- [媒體理解](/zh-TW/nodes/media-understanding)
