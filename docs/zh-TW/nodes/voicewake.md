---
read_when:
    - 變更語音喚醒詞的行為或預設值
    - 新增需要喚醒詞同步的節點平台
summary: 全域語音喚醒詞（由閘道管理）及其在各節點間的同步方式
title: 語音喚醒
x-i18n:
    generated_at: "2026-07-14T13:49:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: aef2a5bba664ce10fb6ab457bb6d202639dcc6c0a9df61567e7cb402c290bbec
    source_path: nodes/voicewake.md
    workflow: 16
---

喚醒詞是**由閘道擁有的一份全域清單**，不存在各節點的自訂清單。任何節點或應用程式 UI 都可以編輯此清單；閘道會持久儲存變更，並將其廣播至每個已連線的用戶端。

- **macOS**：本機語音喚醒啟用／停用切換開關。需要 macOS 26+；執行階段／PTT 詳細資訊請參閱[語音喚醒（macOS）](/zh-TW/platforms/mac/voicewake)。
- **iOS**：設定中的本機語音喚醒啟用／停用切換開關。
- **Android**：設定 → Voice 中的本機語音喚醒啟用／停用切換開關與喚醒詞編輯器。需要 Android 裝置端語音辨識。

## 儲存空間

喚醒詞與路由規則儲存在閘道狀態資料庫中，預設為 `~/.openclaw/state/openclaw.sqlite`（可使用 `OPENCLAW_STATE_DIR` 覆寫），資料表為 `voicewake_triggers`、`voicewake_routing_config`、`voicewake_routing_routes`。舊版 `settings/voicewake.json` 與 `settings/voicewake-routing.json` 僅作為 `openclaw doctor --fix` 的遷移輸入——執行階段絕不讀取它們。

## 通訊協定

### 觸發詞清單

| 方法          | 參數                   | 結果                   |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | 無                     | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` 會正規化輸入：修剪空白、移除空白項目、最多保留 32 個觸發詞，並在不拆分代理配對的情況下，將每個觸發詞截斷至 64 個 UTF-16 程式碼單位。若結果為空，則會回復使用內建預設值（`openclaw`、`claude`、`computer`）。

### 路由（觸發詞至目標）

| 方法                  | 參數                               | 結果                               |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `voicewake.routing.get` | 無                                 | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

每個路由 `target` 僅支援以下其中一項：

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

限制：最多 32 條路由，觸發詞文字最多 64 個字元。為進行比對與重複偵測，路由觸發詞會透過以下方式正規化：轉為小寫、移除每個詞開頭／結尾的標點符號，並合併空白（`"Hey, Bot!!"` 與 `"hey bot"` 會相符並被視為重複）——這比上方全域觸發詞清單所使用的單純修剪更嚴格。

### 事件

| 事件                       | 承載資料                              |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

兩者都會廣播至每個具有讀取範圍的 WebSocket 用戶端（macOS 應用程式、WebChat 等）及每個已連線的節點。節點也會在連線後立即收到兩者，作為初始快照推送。

## 用戶端行為

- **macOS**：呼叫 `voicewake.set`/`voicewake.get`，並監聽 `voicewake.changed`，以與其他用戶端保持同步。
- **iOS**：呼叫 `voicewake.set`/`voicewake.get`，並監聽 `voicewake.changed`，以維持本機喚醒詞偵測的即時反應。
- **Android**：呼叫 `voicewake.set`/`voicewake.get`、監聽 `voicewake.changed`，並在啟用時宣告 `voiceWake`。辨識功能僅在裝置端與前景執行；當 Talk、手動聽寫、語音備忘錄擷取或訊息語音功能占用音訊時，辨識會暫停。

## 相關內容

- [Talk 模式](/zh-TW/nodes/talk)
- [音訊與語音備忘錄](/zh-TW/nodes/audio)
- [媒體理解](/zh-TW/nodes/media-understanding)
