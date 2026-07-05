---
read_when:
    - 變更語音喚醒詞行為或預設值
    - 新增需要喚醒詞同步的新節點平台
summary: 全域語音喚醒詞（由閘道擁有）及其如何在各節點之間同步
title: 語音喚醒
x-i18n:
    generated_at: "2026-07-05T11:28:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ec1980dd69a041e7dfeaa9d74e370e3279b22aa7ed19b72067ee56f3f696899
    source_path: nodes/voicewake.md
    workflow: 16
---

喚醒詞是**由閘道擁有的一個全域清單**——沒有每個節點各自的自訂清單。任何節點或應用程式 UI 都可以編輯此清單；閘道會保存變更，並將其廣播給每個已連線的用戶端。

- **macOS**：本機 Voice Wake 啟用/停用切換。需要 macOS 26+；如需執行階段/PTT 詳細資訊，請參閱 [Voice wake (macOS)](/zh-TW/platforms/mac/voicewake)。
- **iOS**：設定中的本機 Voice Wake 啟用/停用切換。
- **Android**：Voice Wake 會在執行階段被強制停用。Voice 分頁使用手動麥克風擷取，而不是喚醒詞觸發。

## 儲存

喚醒詞和路由規則位於閘道狀態資料庫，預設為 `~/.openclaw/state/openclaw.sqlite`（可使用 `OPENCLAW_STATE_DIR` 覆寫），資料表為 `voicewake_triggers`、`voicewake_routing_config`、`voicewake_routing_routes`。舊版 `settings/voicewake.json` 和 `settings/voicewake-routing.json` 只是 `openclaw doctor --fix` 的遷移輸入——執行階段絕不會讀取它們。

## 通訊協定

### 觸發清單

| 方法 | 參數 | 結果 |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | 無 | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` 會正規化輸入：修剪空白、丟棄空白項目、最多保留 32 個觸發詞，並將每個觸發詞截斷至 64 個字元。空白結果會退回內建預設值（`openclaw`、`claude`、`computer`）。

### 路由（觸發詞到目標）

| 方法 | 參數 | 結果 |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `voicewake.routing.get` | 無 | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

每個路由 `target` 僅支援以下其中一種：

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

限制：最多 32 條路由，觸發詞文字最多 64 個字元。路由觸發詞會透過轉為小寫、移除每個單字開頭/結尾標點，並合併空白來正規化，以便比對和偵測重複（`"Hey, Bot!!"` 和 `"hey bot"` 會相符並計為重複）——這比上述全域觸發清單使用的純修剪更嚴格。

### 事件

| 事件 | 酬載 |
| --------------------------- | ------------------------------------ |
| `voicewake.changed` | `{ triggers: string[] }` |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

兩者都會廣播給每個具有讀取範圍的 WebSocket 用戶端（macOS 應用程式、WebChat 及類似用戶端），以及每個已連線的節點。節點也會在連線後立即收到兩者作為初始快照推送。

## 用戶端行為

- **macOS**：呼叫 `voicewake.set`/`voicewake.get`，並監聽 `voicewake.changed`，以與其他用戶端保持同步。
- **iOS**：呼叫 `voicewake.set`/`voicewake.get`，並監聽 `voicewake.changed`，讓本機喚醒詞偵測保持回應靈敏。
- **Android**：`VoiceWakeMode`（`Off`/`Foreground`/`Always`）和閘道同步程式碼都存在，但應用程式會在啟動時將模式強制設為 `Off`——目前無法從 Android 設定使用 Voice Wake。

## 相關

- [對話模式](/zh-TW/nodes/talk)
- [音訊與語音記事](/zh-TW/nodes/audio)
- [媒體理解](/zh-TW/nodes/media-understanding)
