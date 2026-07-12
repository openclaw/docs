---
read_when:
    - 變更語音喚醒詞的行為或預設值
    - 新增需要同步喚醒詞的節點平台
summary: 全域語音喚醒詞（由閘道擁有）及其在各節點間的同步方式
title: 語音喚醒
x-i18n:
    generated_at: "2026-07-12T14:39:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8a8c7a8bb2ee5bbc57d9141cd8f2176246cc61952b0ed42257f83af2c777427
    source_path: nodes/voicewake.md
    workflow: 16
---

喚醒詞是**由閘道擁有的單一全域清單**——沒有各節點專屬的自訂清單。任何節點或應用程式 UI 都可以編輯此清單；閘道會持久儲存變更，並將其廣播給每個已連線的用戶端。

- **macOS**：本機語音喚醒啟用/停用切換開關。需要 macOS 26+；執行階段/PTT 詳情請參閱[語音喚醒（macOS）](/zh-TW/platforms/mac/voicewake)。
- **iOS**：設定中的本機語音喚醒啟用/停用切換開關。
- **Android**：未實作語音喚醒。語音分頁使用手動麥克風擷取，而非喚醒詞觸發。

## 儲存空間

喚醒詞與路由規則儲存在閘道狀態資料庫中，預設為 `~/.openclaw/state/openclaw.sqlite`（可使用 `OPENCLAW_STATE_DIR` 覆寫），資料表為 `voicewake_triggers`、`voicewake_routing_config`、`voicewake_routing_routes`。舊版 `settings/voicewake.json` 與 `settings/voicewake-routing.json` 僅作為 `openclaw doctor --fix` 的遷移輸入——執行階段絕不會讀取它們。

## 通訊協定

### 觸發詞清單

| 方法            | 參數                     | 結果                     |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | 無                       | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` 會正規化輸入：修剪空白、捨棄空白項目、最多保留 32 個觸發詞，並在不分割代理對的前提下，將每個觸發詞截斷為 64 個 UTF-16 程式碼單元。若結果為空，則會回復為內建預設值（`openclaw`、`claude`、`computer`）。

### 路由（觸發詞至目標）

| 方法                    | 參數                                 | 結果                                 |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `voicewake.routing.get` | 無                                   | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

每條路由的 `target` 恰好支援下列其中一種格式：

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

限制：最多 32 條路由，觸發詞文字最多 64 個字元。為了進行比對與重複偵測，路由觸發詞會經過正規化：轉換為小寫、移除每個單字開頭與結尾的標點符號，並合併空白（`"Hey, Bot!!"` 與 `"hey bot"` 會相符，且視為重複）——這比上述全域觸發詞清單使用的單純修剪更為嚴格。

### 事件

| 事件                        | 承載資料                             |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

兩者都會廣播給每個具有讀取範圍的 WebSocket 用戶端（macOS 應用程式、WebChat 及類似用戶端），以及每個已連線的節點。節點也會在連線後立即收到兩者的初始快照推送。

## 用戶端行為

- **macOS**：呼叫 `voicewake.set`/`voicewake.get`，並監聽 `voicewake.changed`，以與其他用戶端保持同步。
- **iOS**：呼叫 `voicewake.set`/`voicewake.get`，並監聽 `voicewake.changed`，以維持本機喚醒詞偵測的即時回應。
- **Android**：不宣告 `voiceWake` 功能，也不接收喚醒詞更新。

## 相關內容

- [對話模式](/zh-TW/nodes/talk)
- [音訊與語音備忘錄](/zh-TW/nodes/audio)
- [媒體理解](/zh-TW/nodes/media-understanding)
