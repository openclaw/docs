---
read_when:
    - 實作或更新 Gateway WS 用戶端
    - 偵錯協定不相符或連線失敗問題
    - 重新產生通訊協定結構描述/模型
summary: Gateway WebSocket 協定：交握、幀、版本控制
title: Gateway 協定
x-i18n:
    generated_at: "2026-05-11T20:29:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92a8ea464fa3ca1fdc6cc32fdcd7d981c186c9900bb8dc2eeaf1a2d2be05d
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS 通訊協定是 OpenClaw 的**單一控制平面 + Node 傳輸**。所有用戶端（CLI、網頁 UI、macOS app、iOS/Android Node、無頭 Node）都透過 WebSocket 連線，並在握手時宣告其**角色** + **範圍**。

## 傳輸

- WebSocket，使用含 JSON 酬載的文字訊框。
- 第一個訊框**必須**是 `connect` 請求。
- 連線前訊框上限為 64 KiB。成功握手後，用戶端應遵循 `hello-ok.policy.maxPayload` 和 `hello-ok.policy.maxBufferedBytes` 限制。啟用診斷時，過大的傳入訊框和緩慢的傳出緩衝區會在 Gateway 關閉或丟棄受影響訊框前發出 `payload.large` 事件。這些事件會保留大小、限制、介面，以及安全原因代碼。它們不會保留訊息本文、附件內容、原始訊框本文、權杖、Cookie 或秘密值。

## 握手 (connect)

Gateway → 用戶端（連線前挑戰）：

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

用戶端 → Gateway：

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → 用戶端：

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 4,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "auth": {
      "role": "operator",
      "scopes": ["operator.read", "operator.write"]
    },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

當 Gateway 仍在完成啟動 sidecar 時，`connect` 請求可能會傳回可重試的 `UNAVAILABLE` 錯誤，且 `details.reason` 設為 `"startup-sidecars"` 並帶有 `retryAfterMs`。用戶端應在整體連線預算內重試該回應，而不是將其呈現為終止性的握手失敗。

`server`、`features`、`snapshot` 和 `policy` 都是結構描述（`src/gateway/protocol/schema/frames.ts`）要求的欄位。`auth` 也是必填，並回報協商後的角色/範圍。`pluginSurfaceUrls` 是選填，會將 Plugin 介面名稱（例如 `canvas`）對應到具範圍的託管 URL。

具範圍的 Plugin 介面 URL 可能會過期。Node 可以使用 `{ "surface": "canvas" }` 呼叫 `node.pluginSurface.refresh`，以在 `pluginSurfaceUrls` 中收到新的項目。實驗性的 Canvas Plugin 重構不支援已棄用的 `canvasHostUrl`、`canvasCapability` 或 `node.canvas.capability.refresh` 相容路徑；目前的原生用戶端和 Gateway 必須使用 Plugin 介面。

未核發裝置權杖時，`hello-ok.auth` 會回報協商後的權限，且不含權杖欄位：

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

受信任的同程序後端用戶端（`client.id: "gateway-client"`、`client.mode: "backend"`）在使用共用 Gateway 權杖/密碼驗證的直接 loopback 連線上，可以省略 `device`。此路徑保留給內部控制平面 RPC，並避免過時的 CLI/裝置配對基準阻擋本機後端工作，例如子代理工作階段更新。遠端用戶端、瀏覽器來源用戶端、Node 用戶端，以及明確使用裝置權杖/裝置身分的用戶端，仍會使用一般配對和範圍升級檢查。

核發裝置權杖時，`hello-ok` 也會包含：

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

在受信任的 bootstrap 交接期間，`hello-ok.auth` 也可能在 `deviceTokens` 中包含額外的有界角色項目：

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

對於內建的 Node/操作者 bootstrap 流程，主要 Node 權杖維持 `scopes: []`，而任何交接的操作者權杖都會限制在 bootstrap 操作者允許清單（`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`）。Bootstrap 範圍檢查維持角色前綴：操作者項目只滿足操作者請求，非操作者角色仍需要其自身角色前綴下的範圍。

### Node 範例

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## 訊框格式

- **請求**：`{type:"req", id, method, params}`
- **回應**：`{type:"res", id, ok, payload|error}`
- **事件**：`{type:"event", event, payload, seq?, stateVersion?}`

具有副作用的方法需要**等冪鍵**（請參閱結構描述）。

## 角色 + 範圍

如需完整的操作者範圍模型、核准時檢查和共用秘密語意，請參閱[操作者範圍](/zh-TW/gateway/operator-scopes)。

### 角色

- `operator` = 控制平面用戶端（CLI/UI/自動化）。
- `node` = 能力主機（camera/screen/canvas/system.run）。

### 範圍（操作者）

常見範圍：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

帶有 `includeSecrets: true` 的 `talk.config` 需要 `operator.talk.secrets`（或 `operator.admin`）。

Plugin 註冊的 Gateway RPC 方法可以要求自己的操作者範圍，但保留的核心管理前綴（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）一律解析為 `operator.admin`。

方法範圍只是第一道閘門。部分透過 `chat.send` 到達的斜線命令，會在其上套用更嚴格的命令層級檢查。例如，持久性的 `/config set` 和 `/config unset` 寫入需要 `operator.admin`。

`node.pair.approve` 在基礎方法範圍之上，還有額外的核准時範圍檢查：

- 無命令請求：`operator.pairing`
- 含非 exec Node 命令的請求：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的請求：`operator.pairing` + `operator.admin`

### 能力/命令/權限（Node）

Node 在連線時宣告能力主張：

- `caps`：高階能力類別，例如 `camera`、`canvas`、`screen`、`location`、`voice` 和 `talk`。
- `commands`：用於 invoke 的命令允許清單。
- `permissions`：細粒度切換（例如 `screen.record`、`camera.capture`）。

Gateway 將這些視為**主張**，並強制執行伺服器端允許清單。

## Presence

- `system-presence` 會傳回以裝置身分為鍵的項目。
- Presence 項目包含 `deviceId`、`roles` 和 `scopes`，讓 UI 即使在裝置同時以**操作者**和 **Node** 身分連線時，也能每個裝置顯示單一列。
- `node.list` 包含選填的 `lastSeenAtMs` 和 `lastSeenReason` 欄位。已連線的 Node 會以原因 `connect` 將目前連線時間回報為 `lastSeenAtMs`；當受信任的 Node 事件更新其配對中繼資料時，已配對的 Node 也可以回報持久背景 Presence。

### Node 背景存活事件

Node 可以使用 `event: "node.presence.alive"` 呼叫 `node.event`，以記錄已配對的 Node 在背景喚醒期間曾經存活，而不將其標記為已連線。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是封閉列舉：`background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual` 或 `connect`。未知的觸發字串會在持久化前由 Gateway 正規化為 `background`。此事件只對已驗證的 Node 裝置工作階段具持久性；無裝置或未配對的工作階段會傳回 `handled: false`。

成功的 Gateway 會傳回結構化結果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

較舊的 Gateway 仍可能對 `node.event` 傳回 `{ "ok": true }`；用戶端應將其視為已確認的 RPC，而不是持久 Presence 持久化。

## 廣播事件範圍限定

伺服器推送的 WebSocket 廣播事件會受範圍閘控，因此配對範圍或僅限 Node 的工作階段不會被動接收工作階段內容。

- **聊天、代理和工具結果訊框**（包含串流的 `agent` 事件和工具呼叫結果）至少需要 `operator.read`。沒有 `operator.read` 的工作階段會完全略過這些訊框。
- **Plugin 定義的 `plugin.*` 廣播**會依 Plugin 註冊方式，以 `operator.write` 或 `operator.admin` 閘控。
- **狀態和傳輸事件**（`heartbeat`、`presence`、`tick`、連線/中斷連線生命週期等）保持不受限制，因此每個已驗證工作階段都能觀察傳輸健康狀態。
- **未知廣播事件家族**預設會受範圍閘控（失敗關閉），除非已註冊的處理常式明確放寬限制。

每個用戶端連線都會保留自己的每用戶端序號，因此即使不同用戶端看到事件串流中不同的範圍過濾子集，廣播也能在該 socket 上維持單調排序。

## 常見 RPC 方法家族

公開 WS 介面比上述握手/驗證範例更廣。這不是產生出的傾印 — `hello-ok.features.methods` 是從 `src/gateway/server-methods-list.ts` 加上已載入的 Plugin/通道方法匯出建置出的保守探索清單。請將其視為功能探索，而不是 `src/gateway/server-methods/*.ts` 的完整列舉。

<AccordionGroup>
  <Accordion title="系統與身分">
    - `health` 會傳回快取或新探測的 Gateway 健康狀態快照。
    - `diagnostics.stability` 會傳回最近的有界診斷穩定性記錄器。它會保留操作中繼資料，例如事件名稱、計數、位元組大小、記憶體讀數、佇列/工作階段狀態、通道/Plugin 名稱，以及工作階段 ID。它不會保留聊天文字、Webhook 本文、工具輸出、原始請求或回應本文、權杖、Cookie 或秘密值。需要操作者讀取範圍。
    - `status` 會傳回 `/status` 樣式的 Gateway 摘要；敏感欄位只會包含在具管理範圍的操作者用戶端中。
    - `gateway.identity.get` 會傳回 relay 和配對流程使用的 Gateway 裝置身分。
    - `system-presence` 會傳回已連線操作者/Node 裝置的目前 Presence 快照。
    - `system-event` 會附加系統事件，且可以更新/廣播 Presence 內容。
    - `last-heartbeat` 會傳回最新持久化的 Heartbeat 事件。
    - `set-heartbeats` 會切換 Gateway 上的 Heartbeat 處理。

  </Accordion>

  <Accordion title="模型與用量">
    - `models.list` 會傳回執行階段允許的模型目錄。傳入 `{ "view": "configured" }` 可取得適合選擇器大小的已設定模型（先是 `agents.defaults.models`，再是 `models.providers.*.models`），或傳入 `{ "view": "all" }` 以取得完整目錄。
    - `usage.status` 會傳回提供者用量視窗／剩餘配額摘要。
    - `usage.cost` 會傳回某日期範圍的彙總成本用量摘要。
    - `doctor.memory.status` 會傳回作用中預設代理工作區的向量記憶體／快取嵌入就緒狀態。只有在呼叫端明確想要即時 ping 嵌入提供者時，才傳入 `{ "probe": true }` 或 `{ "deep": true }`。
    - `doctor.memory.remHarness` 會為遠端控制平面用戶端傳回有界、唯讀的 REM harness 預覽。它可能包含工作區路徑、記憶體片段、已算繪且有根據的 Markdown，以及深度提升候選項目，因此呼叫端需要 `operator.read`。
    - `sessions.usage` 會傳回每個工作階段的用量摘要。
    - `sessions.usage.timeseries` 會傳回單一工作階段的時間序列用量。
    - `sessions.usage.logs` 會傳回單一工作階段的用量記錄項目。

  </Accordion>

  <Accordion title="頻道與登入輔助工具">
    - `channels.status` 會傳回內建 + 隨附頻道／Plugin 狀態摘要。
    - `channels.logout` 會登出特定頻道／帳號，前提是該頻道支援登出。
    - `web.login.start` 會為目前支援 QR 的網頁頻道提供者啟動 QR／網頁登入流程。
    - `web.login.wait` 會等待該 QR／網頁登入流程完成，並在成功時啟動頻道。
    - `push.test` 會將測試 APNs 推播傳送至已註冊的 iOS node。
    - `voicewake.get` 會傳回已儲存的喚醒詞觸發條件。
    - `voicewake.set` 會更新喚醒詞觸發條件並廣播變更。

  </Accordion>

  <Accordion title="訊息與記錄">
    - `send` 是直接外送 RPC，用於聊天執行器之外，針對頻道／帳號／討論串目標傳送訊息。
    - `logs.tail` 會傳回已設定的 Gateway 檔案記錄尾端，並提供游標／限制與最大位元組控制。

  </Accordion>

  <Accordion title="Talk 與 TTS">
    - `talk.catalog` 會傳回語音、串流轉錄與即時語音的唯讀 Talk 提供者目錄。它包含提供者 ID、標籤、已設定狀態、公開的模型／語音 ID、標準模式、傳輸、brain 策略，以及即時音訊／能力旗標，而不會傳回提供者祕密或變更全域設定。
    - `talk.config` 會傳回有效的 Talk 設定 payload；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.session.create` 會為 `realtime/gateway-relay`、`transcription/gateway-relay` 或 `stt-tts/managed-room` 建立由 Gateway 擁有的 Talk 工作階段。`brain: "direct-tools"` 需要 `operator.admin`。
    - `talk.session.join` 會驗證受管理房間工作階段 token，視需要發出 `session.ready` 或 `session.replaced` 事件，並傳回房間／工作階段中繼資料以及近期 Talk 事件，但不包含明文 token 或已儲存的 token 雜湊。
    - `talk.session.appendAudio` 會將 base64 PCM 輸入音訊附加到 Gateway 擁有的即時 relay 與轉錄工作階段。
    - `talk.session.startTurn`、`talk.session.endTurn` 與 `talk.session.cancelTurn` 會驅動受管理房間的回合生命週期，並在清除狀態前拒絕過期回合。
    - `talk.session.cancelOutput` 會停止助理音訊輸出，主要用於 Gateway relay 工作階段中受 VAD 閘控的插話。
    - `talk.session.submitToolResult` 會完成由 Gateway 擁有的即時 relay 工作階段所發出的提供者工具呼叫。當後續會有最終結果時，傳入 `options: { willContinue: true }` 作為中繼工具輸出；或當工具結果應滿足提供者呼叫且不啟動另一個即時助理回應時，傳入 `options: { suppressResponse: true }`。
    - `talk.session.close` 會關閉由 Gateway 擁有的 relay、轉錄或受管理房間工作階段，並發出終止 Talk 事件。
    - `talk.mode` 會為 WebChat／Control UI 用戶端設定／廣播目前的 Talk 模式狀態。
    - `talk.client.create` 會使用 `webrtc` 或 `provider-websocket` 建立用戶端擁有的即時提供者工作階段，同時由 Gateway 擁有設定、憑證、指示與工具政策。
    - `talk.client.toolCall` 可讓用戶端擁有的即時傳輸將提供者工具呼叫轉送至 Gateway 政策。第一個支援的工具是 `openclaw_agent_consult`；用戶端會收到 run ID，並在提交提供者專屬工具結果前等待一般聊天生命週期事件。
    - `talk.event` 是即時、轉錄、STT/TTS、受管理房間、電話與會議配接器的單一 Talk 事件頻道。
    - `talk.speak` 會透過作用中的 Talk 語音提供者合成語音。
    - `tts.status` 會傳回 TTS 啟用狀態、作用中提供者、後援提供者與提供者設定狀態。
    - `tts.providers` 會傳回可見的 TTS 提供者清單。
    - `tts.enable` 與 `tts.disable` 會切換 TTS 偏好設定狀態。
    - `tts.setProvider` 會更新偏好的 TTS 提供者。
    - `tts.convert` 會執行一次性文字轉語音轉換。

  </Accordion>

  <Accordion title="祕密、設定、更新與精靈">
    - `secrets.reload` 會重新解析作用中的 SecretRefs，且只有在完全成功時才替換執行階段祕密狀態。
    - `secrets.resolve` 會為特定命令／目標集解析命令目標祕密指派。
    - `config.get` 會傳回目前的設定快照與雜湊。
    - `config.set` 會寫入已驗證的設定 payload。
    - `config.patch` 會合併部分設定更新。
    - `config.apply` 會驗證並取代完整設定 payload。
    - `config.schema` 會傳回 Control UI 與 CLI 工具使用的即時設定 schema payload：schema、`uiHints`、版本與產生中繼資料，並在執行階段可載入時包含 Plugin + 頻道 schema 中繼資料。該 schema 包含欄位 `title` / `description` 中繼資料，衍生自 UI 使用的相同標籤與說明文字；當存在相符欄位文件時，也包含巢狀物件、萬用字元、陣列項目，以及 `anyOf` / `oneOf` / `allOf` 組合分支。
    - `config.schema.lookup` 會為單一設定路徑傳回路徑範圍查詢 payload：正規化路徑、淺層 schema 節點、相符提示 + `hintPath`，以及供 UI／CLI 向下鑽取的直接子項摘要。查詢 schema 節點會保留面向使用者的文件與常見驗證欄位（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、數值／字串／陣列／物件界限，以及 `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` 等旗標）。子項摘要會公開 `key`、正規化 `path`、`type`、`required`、`hasChildren`，以及相符的 `hint` / `hintPath`。
    - `update.run` 會執行 Gateway 更新流程，且只有在更新本身成功時才排程重新啟動；具有工作階段的呼叫端可包含 `continuationMessage`，讓啟動流程透過重新啟動接續佇列恢復一個後續代理回合。套件管理器更新會在套件替換後強制進行非延後、無冷卻的更新重新啟動，避免舊 Gateway 程序繼續從已替換的 `dist` 樹延遲載入。
    - `update.status` 會傳回最新快取的更新重新啟動 sentinel，包含可用時重新啟動後正在執行的版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 與 `wizard.cancel` 會透過 WS RPC 公開上線設定精靈。

  </Accordion>

  <Accordion title="代理與工作區輔助工具">
    - `agents.list` 會傳回已設定的代理項目，包含有效模型與執行階段中繼資料。
    - `agents.create`、`agents.update` 與 `agents.delete` 會管理代理記錄與工作區連線。
    - `agents.files.list`、`agents.files.get` 與 `agents.files.set` 會管理為代理公開的 bootstrap 工作區檔案。
    - `tasks.list`、`tasks.get` 與 `tasks.cancel` 會將 Gateway 任務分類帳公開給 SDK 與 operator 用戶端。
    - `artifacts.list`、`artifacts.get` 與 `artifacts.download` 會針對明確的 `sessionKey`、`runId` 或 `taskId` 範圍，公開由逐字稿衍生的成品摘要與下載。Run 與任務查詢會在伺服器端解析所屬工作階段，且只傳回來源相符的逐字稿媒體；不安全或本機 URL 來源會傳回不支援的下載，而不是在伺服器端擷取。
    - `environments.list` 與 `environments.status` 會向 SDK 用戶端公開唯讀的 Gateway 本機與 node 環境探索。
    - `agent.identity.get` 會傳回代理或工作階段的有效助理身分。
    - `agent.wait` 會等待 run 完成，並在可用時傳回終止快照。

  </Accordion>

  <Accordion title="工作階段控制">
    - `sessions.list` 會傳回目前的工作階段索引，並在已設定代理執行階段後端時，包含每列的 `agentRuntime` 中繼資料。
    - `sessions.subscribe` 與 `sessions.unsubscribe` 會為目前 WS 用戶端切換工作階段變更事件訂閱。
    - `sessions.messages.subscribe` 與 `sessions.messages.unsubscribe` 會為單一工作階段切換逐字稿／訊息事件訂閱。
    - `sessions.preview` 會傳回特定工作階段 key 的有界逐字稿預覽。
    - `sessions.describe` 會針對精確的工作階段 key 傳回一列 Gateway 工作階段。
    - `sessions.resolve` 會解析或標準化工作階段目標。
    - `sessions.create` 會建立新的工作階段項目。
    - `sessions.send` 會將訊息傳送至既有工作階段。
    - `sessions.steer` 是作用中工作階段的中斷並導引變體。
    - `sessions.abort` 會中止工作階段的作用中工作。呼叫端可傳入 `key` 加上選用的 `runId`，或對 Gateway 可解析至工作階段的作用中 run 單獨傳入 `runId`。
    - `sessions.patch` 會更新工作階段中繼資料／覆寫，並回報已解析的標準模型加上有效的 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 與 `sessions.compact` 會執行工作階段維護。
    - `sessions.get` 會傳回完整儲存的工作階段列。
    - 聊天執行仍使用 `chat.history`、`chat.send`、`chat.abort` 與 `chat.inject`。`chat.history` 會為 UI 用戶端進行顯示正規化：從可見文字中移除內嵌指令標籤，移除純文字工具呼叫 XML payload（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 與截斷的工具呼叫區塊）以及外洩的 ASCII／全形模型控制 token，省略純靜默 token 的助理列，例如精確的 `NO_REPLY` / `no_reply`，且過大的列可替換為 placeholder。

  </Accordion>

  <Accordion title="裝置配對與裝置 token">
    - `device.pair.list` 會傳回待處理與已核准的配對裝置。
    - `device.pair.approve`、`device.pair.reject` 與 `device.pair.remove` 會管理裝置配對記錄。
    - `device.token.rotate` 會在其已核准角色與呼叫端範圍界限內輪替配對裝置 token。
    - `device.token.revoke` 會在其已核准角色與呼叫端範圍界限內撤銷配對裝置 token。

  </Accordion>

  <Accordion title="Node 配對、叫用與待處理工作">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove` 與 `node.pair.verify` 涵蓋 node 配對與 bootstrap 驗證。
    - `node.list` 與 `node.describe` 會傳回已知／已連線的 node 狀態。
    - `node.rename` 會更新已配對 node 標籤。
    - `node.invoke` 會將命令轉送至已連線 node。
    - `node.invoke.result` 會傳回叫用請求的結果。
    - `node.event` 會將 node 來源事件帶回 Gateway。
    - `node.pending.pull` 與 `node.pending.ack` 是已連線 node 佇列 API。
    - `node.pending.enqueue` 與 `node.pending.drain` 會管理離線／中斷連線 node 的持久待處理工作。

  </Accordion>

  <Accordion title="核准系列">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 涵蓋一次性 exec 核准要求，以及待核准項目的查詢/重播。
    - `exec.approval.waitDecision` 會等待一個待處理的 exec 核准，並傳回最終決策（逾時則傳回 `null`）。
    - `exec.approvals.get` 和 `exec.approvals.set` 管理 gateway exec 核准政策快照。
    - `exec.approvals.node.get` 和 `exec.approvals.node.set` 透過節點轉送命令管理節點本機的 exec 核准政策。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 涵蓋 plugin 定義的核准流程。

  </Accordion>

  <Accordion title="自動化、Skills 與工具">
    - 自動化：`wake` 排程立即或下一次 heartbeat 的喚醒文字注入；`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 管理排程工作。
    - Skills 與工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 常見事件系列

- `chat`：UI 聊天更新，例如 `chat.inject` 和其他僅限逐字稿的聊天
  事件。
- `session.message` 和 `session.tool`：已訂閱工作階段的逐字稿/事件串流
  更新。
- `sessions.changed`：工作階段索引或中繼資料已變更。
- `presence`：系統線上狀態快照更新。
- `tick`：週期性 keepalive / 存活事件。
- `health`：Gateway 健康狀態快照更新。
- `heartbeat`：heartbeat 事件串流更新。
- `cron`：cron 執行/作業變更事件。
- `shutdown`：gateway 關閉通知。
- `node.pair.requested` / `node.pair.resolved`：節點配對生命週期。
- `node.invoke.request`：節點 invoke 要求廣播。
- `device.pair.requested` / `device.pair.resolved`：已配對裝置生命週期。
- `voicewake.changed`：喚醒詞觸發設定已變更。
- `exec.approval.requested` / `exec.approval.resolved`：exec 核准
  生命週期。
- `plugin.approval.requested` / `plugin.approval.resolved`：plugin 核准
  生命週期。

### 節點輔助方法

- 節點可以呼叫 `skills.bins` 來擷取目前的 skill 可執行檔清單，
  供自動允許檢查使用。

### 任務分類帳 RPC

操作員用戶端可以透過任務分類帳 RPC 檢查並取消 Gateway 背景任務記錄。
這些方法傳回經過清理的任務摘要，而不是原始
執行階段狀態。

- `tasks.list` 需要 `operator.read`。
  - 參數：選用的 `status`（`"queued"`、`"running"`、`"completed"`、
    `"failed"`、`"cancelled"` 或 `"timed_out"`）或這些狀態的陣列、
    選用的 `agentId`、選用的 `sessionKey`、選用的 `limit`，範圍從 `1` 到
    `500`，以及選用的字串 `cursor`。
  - 結果：`{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` 需要 `operator.read`。
  - 參數：`{ "taskId": string }`。
  - 結果：`{ "task": TaskSummary }`。
  - 缺少的任務 ID 會傳回 Gateway 的 not-found 錯誤形狀。
- `tasks.cancel` 需要 `operator.write`。
  - 參數：`{ "taskId": string, "reason"?: string }`。
  - 結果：
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` 回報分類帳是否有相符任務。`cancelled`
    回報執行階段是否接受或記錄了取消。

`TaskSummary` 包含 `id`、`status`，以及選用中繼資料，例如 `kind`、
`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、
`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、時間戳記、進度、
終端摘要，以及經過清理的錯誤文字。

### 操作員輔助方法

- 操作員可以呼叫 `commands.list`（`operator.read`）來擷取代理程式的執行階段
  命令清單。
  - `agentId` 為選用；省略即可讀取預設代理程式工作區。
  - `scope` 控制主要 `name` 目標所屬的介面：
    - `text` 傳回不含前置 `/` 的主要文字命令權杖
    - `native` 和預設的 `both` 路徑會在可用時傳回可感知提供者的原生命名
  - `textAliases` 帶有精確的斜線別名，例如 `/model` 和 `/m`。
  - `nativeName` 在存在時帶有可感知提供者的原生命令名稱。
  - `provider` 為選用，且只會影響原生命名以及原生 plugin
    命令可用性。
  - `includeArgs=false` 會從回應中省略序列化的引數中繼資料。
- 操作員可以呼叫 `tools.catalog`（`operator.read`）來擷取代理程式的執行階段工具目錄。
  回應包含分組工具與來源中繼資料：
  - `source`：`core` 或 `plugin`
  - `pluginId`：當 `source="plugin"` 時的 plugin 擁有者
  - `optional`：plugin 工具是否為選用
- 操作員可以呼叫 `tools.effective`（`operator.read`）來擷取工作階段的執行階段有效工具
  清單。
  - `sessionKey` 為必填。
  - gateway 會從伺服器端的工作階段衍生受信任的執行階段內容，而不是接受
    呼叫端提供的驗證或傳遞內容。
  - 回應的範圍限於工作階段，並反映目前作用中對話可使用的內容，
    包括核心、plugin 和頻道工具。
- 操作員可以呼叫 `tools.invoke`（`operator.write`），透過與
  `/tools/invoke` 相同的 gateway 政策路徑叫用一個可用工具。
  - `name` 為必填。`args`、`sessionKey`、`agentId`、`confirm` 和
    `idempotencyKey` 為選用。
  - 如果同時存在 `sessionKey` 和 `agentId`，解析後的工作階段代理程式必須符合
    `agentId`。
  - 回應是面向 SDK 的封套，包含 `ok`、`toolName`、選用的 `output`，以及具型別的
    `error` 欄位。核准或政策拒絕會在酬載中傳回 `ok:false`，而不是
    繞過 gateway 工具政策管線。
- 操作員可以呼叫 `skills.status`（`operator.read`）來擷取代理程式的可見
  skill 清單。
  - `agentId` 為選用；省略即可讀取預設代理程式工作區。
  - 回應包含資格、缺少的需求、設定檢查，以及
    經過清理且不暴露原始秘密值的安裝選項。
- 操作員可以呼叫 `skills.search` 和 `skills.detail`（`operator.read`）取得
  ClawHub 探索中繼資料。
- 操作員可以呼叫 `skills.upload.begin`、`skills.upload.chunk` 和
  `skills.upload.commit`（`operator.admin`），在安裝前暫存私人 skill 封存檔。
  這是受信任用戶端的獨立管理員上傳路徑，
  不是一般 ClawHub skill 安裝流程，且預設停用，除非
  `skills.install.allowUploadedArchives` 已啟用。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    會建立繫結到該 slug 和 force 值的上傳。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` 會在
    精確的解碼位移附加位元組。
  - `skills.upload.commit({ uploadId, sha256? })` 會驗證最終大小和
    SHA-256。提交只會完成上傳；不會安裝 skill。
  - 上傳的 skill 封存檔是包含 `SKILL.md` 根目錄的 zip 封存檔。該
    封存檔的內部目錄名稱絕不會選取安裝目標。
- 操作員可以在三種模式下呼叫 `skills.install`（`operator.admin`）：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 會將
    skill 資料夾安裝到預設代理程式工作區的 `skills/` 目錄。
  - 上傳模式：`{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    會將已提交的上傳安裝到預設代理程式工作區的 `skills/<slug>`
    目錄。slug 和 force 值必須符合原始
    `skills.upload.begin` 要求。除非
    `skills.install.allowUploadedArchives` 已啟用，否則此模式會被拒絕。該設定不會
    影響 ClawHub 安裝。
  - Gateway 安裝器模式：`{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    會在 gateway 主機上執行宣告的 `metadata.openclaw.install` 動作。
- 操作員可以在兩種模式下呼叫 `skills.update`（`operator.admin`）：
  - ClawHub 模式會更新預設代理程式工作區中一個受追蹤的 slug，或所有受追蹤的 ClawHub 安裝。
  - 設定模式會修補 `skills.entries.<skillKey>` 值，例如 `enabled`、
    `apiKey` 和 `env`。

### `models.list` 檢視

`models.list` 接受選用的 `view` 參數：

- 省略或 `"default"`：目前的執行階段行為。如果已設定 `agents.defaults.models`，回應會是允許的目錄，包括針對 `provider/*` 項目動態探索到的模型。否則回應會是完整的 Gateway 目錄。
- `"configured"`：適合選擇器大小的行為。如果已設定 `agents.defaults.models`，它仍然優先，包括針對 `provider/*` 項目的提供者範圍探索。沒有允許清單時，回應會使用明確的 `models.providers.*.models` 項目，只有在不存在已設定模型列時才回退到完整目錄。
- `"all"`：完整的 Gateway 目錄，略過 `agents.defaults.models`。請將此用於診斷與探索 UI，而不是一般模型選擇器。

## Exec 核准

- 當 exec 要求需要核准時，gateway 會廣播 `exec.approval.requested`。
- 操作員用戶端透過呼叫 `exec.approval.resolve` 解析（需要 `operator.approvals` 範圍）。
- 對於 `host=node`，`exec.approval.request` 必須包含 `systemRunPlan`（標準 `argv`/`cwd`/`rawCommand`/工作階段中繼資料）。缺少 `systemRunPlan` 的要求會被拒絕。
- 核准後，轉送的 `node.invoke system.run` 呼叫會重用該標準
  `systemRunPlan`，作為權威命令/cwd/工作階段內容。
- 如果呼叫端在 prepare 與最終已核准的 `system.run` 轉送之間變更 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，gateway 會拒絕該執行，而不是信任已變更的酬載。

## 代理程式傳遞備援

- `agent` 要求可以包含 `deliver=true` 以要求對外傳遞。
- `bestEffortDeliver=false` 會維持嚴格行為：無法解析或僅限內部的傳遞目標會傳回 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允許在無法解析外部可傳遞路由時，回退到僅工作階段執行（例如內部/webchat 工作階段或模稜兩可的多頻道設定）。
- 最終 `agent` 結果在要求傳遞時可能包含 `result.deliveryStatus`，
  使用與 [`openclaw agent --json --deliver`](/zh-TW/cli/agent#json-delivery-status) 文件中相同的 `sent`、`suppressed`、`partial_failed` 和 `failed`
  狀態。

## 版本控管

- `PROTOCOL_VERSION` 位於 `src/gateway/protocol/version.ts`。
- 用戶端傳送 `minProtocol` + `maxProtocol`；伺服器會拒絕
  未包含目前協定的範圍。原生用戶端使用 v3 下限，因此
  加法式 v4 用戶端仍可連線到 v3 gateway。
- 結構描述 + 模型是從 TypeBox 定義產生：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 用戶端常數

`src/gateway/client.ts` 中的參考用戶端使用這些預設值。值在
protocol v4 期間保持穩定，並且是第三方用戶端的預期基準。

| 常數                                      | 預設值                                                | 來源                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `3`                                                   | `src/gateway/protocol/version.ts`                                                          |
| 請求逾時（每個 RPC）                      | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| 預先驗證 / connect-challenge 逾時         | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（config/env 可提高成對的伺服器/用戶端預算）            |
| 初始重新連線退避                          | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| 最大重新連線退避                          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| device-token 關閉後的快速重試限制         | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前的強制停止寬限期          | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` 預設逾時                  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| 預設 tick 間隔（`hello-ok` 前）            | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick 逾時關閉                             | 靜默超過 `tickIntervalMs * 2` 時為代碼 `4000`         | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024`（25 MB）                           | `src/gateway/server-constants.ts`                                                          |

伺服器會在 `hello-ok` 中公布有效的 `policy.tickIntervalMs`、`policy.maxPayload`
和 `policy.maxBufferedBytes`；用戶端應遵守這些值，而不是握手前的預設值。

## 驗證

- 共享祕密 Gateway 驗證會依設定的驗證模式使用 `connect.params.auth.token` 或
  `connect.params.auth.password`。
- 帶有身分的模式，例如 Tailscale Serve
  (`gateway.auth.allowTailscale: true`) 或非回送的
  `gateway.auth.mode: "trusted-proxy"`，會從請求標頭而非 `connect.params.auth.*`
  滿足連線驗證檢查。
- 私有入口 `gateway.auth.mode: "none"` 會完全略過共享祕密連線驗證；
  不要將該模式暴露在公開/不受信任的入口上。
- 配對後，Gateway 會發出一個作用域限於連線角色 + scopes 的**裝置權杖**。
  它會在 `hello-ok.auth.deviceToken` 中返回，且用戶端應保存它以供後續連線使用。
- 用戶端應在任何成功連線後保存主要的 `hello-ok.auth.deviceToken`。
- 使用該**已儲存**裝置權杖重新連線時，也應重用該權杖已儲存的已核准 scope 集合。
  這會保留先前已授權的讀取/探測/狀態存取權，並避免重新連線被靜默縮減為較窄的隱含僅管理員 scope。
- 用戶端連線驗證組裝（`src/gateway/client.ts` 中的 `selectConnectAuth`）：
  - `auth.password` 是獨立的，設定時一律會轉送。
  - `auth.token` 會依優先順序填入：先是明確共享權杖，
    接著是明確的 `deviceToken`，再來是已儲存的逐裝置權杖（以
    `deviceId` + `role` 為鍵）。
  - `auth.bootstrapToken` 只會在上述皆未解析出
    `auth.token` 時傳送。共享權杖或任何解析出的裝置權杖都會抑制它。
  - 在一次性的 `AUTH_TOKEN_MISMATCH` 重試中自動提升已儲存裝置權杖，
    僅限於**受信任端點**：回送，或帶有固定 `tlsFingerprint` 的 `wss://`。
    未固定的公開 `wss://` 不符合資格。
- 其他 `hello-ok.auth.deviceTokens` 項目是啟動交接權杖。
  只有在連線使用受信任傳輸上的啟動驗證時才保存它們，例如 `wss://` 或回送/本機配對。
- 如果用戶端提供**明確**的 `deviceToken` 或明確的 `scopes`，
  該呼叫端要求的 scope 集合仍具權威性；快取的 scopes 只會在用戶端重用已儲存的逐裝置權杖時使用。
- 裝置權杖可透過 `device.token.rotate` 和
  `device.token.revoke` 輪替/撤銷（需要 `operator.pairing` scope）。
- `device.token.rotate` 會返回輪替中繼資料。它只會在同裝置呼叫且已使用該裝置權杖驗證時回傳替換 bearer 權杖，
  讓僅權杖用戶端能在重新連線前保存替換權杖。共享/管理員輪替不會回傳 bearer 權杖。
- 權杖發行、輪替和撤銷皆受限於該裝置配對項目中記錄的已核准角色集合；
  權杖變更無法擴大或指定配對核准從未授予的裝置角色。
- 對於已配對裝置權杖工作階段，除非呼叫端也有 `operator.admin`，
  否則裝置管理限於自身 scope：非管理員呼叫端只能移除/撤銷/輪替其**自己的**裝置項目。
- `device.token.rotate` 和 `device.token.revoke` 也會檢查目標 operator
  權杖 scope 集合是否符合呼叫端目前的工作階段 scopes。非管理員呼叫端無法輪替或撤銷比自己已持有更寬的 operator 權杖。
- 驗證失敗包含 `error.details.code` 加上復原提示：
  - `error.details.canRetryWithDeviceToken`（布林值）
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` 的用戶端行為：
  - 受信任的用戶端可以嘗試一次有界限的重試，使用快取的逐裝置權杖。
  - 如果該重試失敗，用戶端應停止自動重新連線迴圈，並顯示 operator 動作指引。
- `AUTH_SCOPE_MISMATCH` 表示裝置權杖已被辨識，但未涵蓋要求的角色/scopes。
  用戶端不應將此呈現為錯誤權杖；請提示 operator 重新配對，或核准較窄/較寬的 scope 合約。

## 裝置身分 + 配對

- Nodes 應包含從金鑰對指紋衍生的穩定裝置身分 (`device.id`)。
- Gateways 會依裝置 + 角色發出權杖。
- 新裝置 ID 需要配對核准，除非已啟用本機自動核准。
- 配對自動核准以直接 local loopback 連線為中心。
- OpenClaw 也有一條狹窄的後端/容器本機自我連線路徑，用於受信任的共享祕密輔助流程。
- 同主機 tailnet 或 LAN 連線在配對上仍會視為遠端，並需要核准。
- WS 用戶端通常會在 `connect` 期間包含 `device` 身分（operator +
  node）。唯一不含裝置的 operator 例外是明確信任路徑：
  - `gateway.controlUi.allowInsecureAuth=true`，用於僅限 localhost 的不安全 HTTP 相容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` operator Control UI 驗證。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急破玻璃，嚴重降低安全性）。
  - 使用共享 gateway 權杖/密碼驗證的直接回送 `gateway-client` 後端 RPC。
- 所有連線都必須簽署伺服器提供的 `connect.challenge` nonce。

### 裝置驗證遷移診斷

對於仍使用 challenge 前簽署行為的舊版用戶端，`connect` 現在會在
`error.details.code` 下返回 `DEVICE_AUTH_*` 詳細代碼，並帶有穩定的 `error.details.reason`。

常見遷移失敗：

| 訊息                        | details.code                     | details.reason           | 含義                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 用戶端省略了 `device.nonce`（或傳送空白）。        |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 用戶端使用過期/錯誤 nonce 簽署。                  |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 簽章酬載與 v2 酬載不相符。                        |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 簽署時間戳超出允許偏移。                          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 與公開金鑰指紋不相符。                |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開金鑰格式/正規化失敗。                         |

遷移目標：

- 一律等待 `connect.challenge`。
- 簽署包含伺服器 nonce 的 v2 酬載。
- 在 `connect.params.device.nonce` 中傳送相同 nonce。
- 偏好的簽章酬載是 `v3`，除了 device/client/role/scopes/token/nonce 欄位外，
  也會綁定 `platform` 和 `deviceFamily`。
- 舊版 `v2` 簽章仍會為了相容性而被接受，但已配對裝置的中繼資料固定仍會控制重新連線時的命令政策。

## TLS + 固定

- WS 連線支援 TLS。
- 用戶端可選擇固定 gateway 憑證指紋（請參閱 `gateway.tls`
  config，加上 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`）。

## Scope

此協定公開**完整 Gateway API**（狀態、channels、models、聊天、
agent、sessions、nodes、approvals 等）。確切介面由
`src/gateway/protocol/schema.ts` 中的 TypeBox schemas 定義。

## 相關

- [橋接協定](/zh-TW/gateway/bridge-protocol)
- [Gateway 執行手冊](/zh-TW/gateway)
