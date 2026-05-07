---
read_when:
    - 實作或更新 Gateway WS 用戶端
    - 偵錯通訊協定不相符或連線失敗
    - 重新產生通訊協定結構描述/模型
summary: Gateway WebSocket 通訊協定：握手、訊框、版本化
title: Gateway 通訊協定
x-i18n:
    generated_at: "2026-05-07T13:18:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75580b3ad8b2a511cf53975b8d734d18db88bcbfe33bd62c360c24333d65d1c6
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protocol 是 OpenClaw 的**單一控制平面 + Node 傳輸**。
所有客戶端（CLI、網頁 UI、macOS app、iOS/Android Node、無頭
Node）都透過 WebSocket 連線，並在交握時宣告其**角色** + **範圍**。

## 傳輸

- WebSocket，使用帶有 JSON payload 的文字 frame。
- 第一個 frame **必須**是 `connect` request。
- 連線前的 frame 上限為 64 KiB。交握成功後，客戶端
  應遵循 `hello-ok.policy.maxPayload` 和
  `hello-ok.policy.maxBufferedBytes` 限制。啟用診斷後，
  過大的 inbound frame 和緩慢的 outbound buffer 會先發出 `payload.large` event，
  然後 Gateway 才會關閉或丟棄受影響的 frame。這些 event 會保留
  大小、限制、surface 和安全的原因碼。它們不會保留訊息
  body、附件內容、原始 frame body、token、cookie 或 secret 值。

## 交握（connect）

Gateway → Client（連線前 challenge）：

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway：

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
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

Gateway → Client：

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

當 Gateway 仍在完成啟動 sidecar 時，`connect` request 可能會
回傳可重試的 `UNAVAILABLE` error，且 `details.reason` 設為
`"startup-sidecars"` 並帶有 `retryAfterMs`。客戶端應在其整體連線預算內
重試該 response，而不是將其呈現為終止性的交握失敗。

`server`、`features`、`snapshot` 和 `policy` 都是 schema
（`src/gateway/protocol/schema/frames.ts`）要求的欄位。`auth` 也是必要欄位，並回報
協商後的角色/範圍。`pluginSurfaceUrls` 是選用欄位，會將 Plugin
surface 名稱（例如 `canvas`）對應到具範圍的託管 URL。

具範圍的 Plugin surface URL 可能會過期。Node 可以呼叫
`node.pluginSurface.refresh` 並帶入 `{ "surface": "canvas" }`，以在
`pluginSurfaceUrls` 中接收新的項目。實驗性的 Canvas Plugin 重構不
支援已棄用的 `canvasHostUrl`、`canvasCapability` 或
`node.canvas.capability.refresh` 相容路徑；目前的原生客戶端和
Gateway 必須使用 Plugin surface。

未發行 device token 時，`hello-ok.auth` 會回報協商後的
權限，但不包含 token 欄位：

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

受信任的同行程 backend client（`client.id: "gateway-client"`、
`client.mode: "backend"`）在 direct loopback connection 上使用共用 gateway token/password
驗證時，可以省略 `device`。此路徑保留給內部控制平面 RPC，
並避免過時的 CLI/device pairing baseline 阻擋本機 backend 工作，例如 subagent session 更新。遠端客戶端、
browser-origin client、Node client，以及明確的 device-token/device-identity
client 仍使用一般 pairing 和 scope-upgrade 檢查。

發行 device token 時，`hello-ok` 也會包含：

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

在受信任的 bootstrap handoff 期間，`hello-ok.auth` 也可能在
`deviceTokens` 中包含額外的有界角色項目：

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

對於內建的 Node/operator bootstrap 流程，主要的 Node token 會保持
`scopes: []`，任何交付出去的 operator token 都會被限制在 bootstrap
operator allowlist（`operator.approvals`、`operator.read`、
`operator.talk.secrets`、`operator.write`）內。Bootstrap scope 檢查會維持
role-prefixed：operator 項目只滿足 operator request，非 operator
角色仍需要位於其自身 role prefix 下的 scope。

### Node 範例

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
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

## Framing

- **Request**：`{type:"req", id, method, params}`
- **Response**：`{type:"res", id, ok, payload|error}`
- **Event**：`{type:"event", event, payload, seq?, stateVersion?}`

具有副作用的方法需要**冪等性 key**（請參閱 schema）。

## 角色 + scope

如需完整的 operator scope model、approval-time check 和 shared-secret
語意，請參閱 [Operator scopes](/zh-TW/gateway/operator-scopes)。

### 角色

- `operator` = 控制平面 client（CLI/UI/automation）。
- `node` = capability host（camera/screen/canvas/system.run）。

### Scopes（operator）

常見 scope：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

帶有 `includeSecrets: true` 的 `talk.config` 需要 `operator.talk.secrets`
（或 `operator.admin`）。

Plugin 註冊的 gateway RPC method 可以要求自己的 operator scope，但
保留的 core admin prefix（`config.*`、`exec.approvals.*`、`wizard.*`、
`update.*`）一律解析為 `operator.admin`。

Method scope 只是第一道關卡。部分透過
`chat.send` 觸及的 slash command 會在其上套用更嚴格的 command-level check。例如，持久化的
`/config set` 和 `/config unset` 寫入需要 `operator.admin`。

`node.pair.approve` 在基礎 method scope 之外，還有額外的 approval-time scope check：

- 無 command 的 request：`operator.pairing`
- 帶有非 exec Node command 的 request：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的 request：
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions（Node）

Node 會在連線時宣告 capability claim：

- `caps`：高階 capability 類別，例如 `camera`、`canvas`、`screen`、
  `location`、`voice` 和 `talk`。
- `commands`：invoke 的 command allowlist。
- `permissions`：細粒度切換項（例如 `screen.record`、`camera.capture`）。

Gateway 會將這些視為**宣告**，並強制執行伺服器端 allowlist。

## Presence

- `system-presence` 會回傳以 device identity 作為 key 的項目。
- Presence 項目包含 `deviceId`、`roles` 和 `scopes`，因此 UI 可以針對每個 device 顯示單一列，
  即使它同時以 **operator** 和 **node** 身分連線。
- `node.list` 包含選用的 `lastSeenAtMs` 和 `lastSeenReason` 欄位。已連線的 Node 會回報
  其目前連線時間作為 `lastSeenAtMs`，原因為 `connect`；paired Node 也可在受信任的 Node event 更新其 pairing metadata 時
  回報持久的背景 presence。

### Node background alive event

Node 可以呼叫 `node.event` 並帶入 `event: "node.presence.alive"`，以記錄 paired Node 曾在
背景喚醒期間存活，而不將其標示為已連線。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是 closed enum：`background`、`silent_push`、`bg_app_refresh`、
`significant_location`、`manual` 或 `connect`。未知的 trigger 字串會在持久化前由
Gateway 正規化為 `background`。此 event 只有對已驗證的 Node
device session 才是持久的；沒有 device 或未 pairing 的 session 會回傳 `handled: false`。

成功的 Gateway 會回傳結構化結果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

較舊的 Gateway 可能仍會對 `node.event` 回傳 `{ "ok": true }`；客戶端應將其視為
已確認的 RPC，而不是持久化 presence 的保證。

## Broadcast event scoping

Server-pushed WebSocket broadcast event 會受到 scope-gated，因此 pairing-scoped 或 node-only session 不會被動接收 session 內容。

- **Chat、agent 和 tool-result frame**（包括 streamed `agent` event 和 tool call result）至少需要 `operator.read`。沒有 `operator.read` 的 session 會完全略過這些 frame。
- **Plugin-defined `plugin.*` broadcast** 會依 Plugin 註冊方式，被 gate 到 `operator.write` 或 `operator.admin`。
- **Status 和 transport event**（`heartbeat`、`presence`、`tick`、connect/disconnect lifecycle 等）不受限制，以便每個已驗證的 session 都能觀察 transport health。
- **未知的 broadcast event family** 預設會受到 scope-gated（fail-closed），除非已註冊的 handler 明確放寬它們。

每個 client connection 都會保留自己的 per-client sequence number，因此即使不同 client 看見 event stream 中不同的 scope-filtered subset，broadcast 在該 socket 上仍會保持單調排序。

## 常見 RPC method family

公開 WS surface 比上方的 handshake/auth 範例更廣。這
不是 generated dump — `hello-ok.features.methods` 是一個保守的
discovery list，由 `src/gateway/server-methods-list.ts` 加上已載入的
Plugin/channel method export 建構而成。請將其視為 feature discovery，而不是
`src/gateway/server-methods/*.ts` 的完整列舉。

<AccordionGroup>
  <Accordion title="系統與身分">
    - `health` 會回傳快取或新探測的 gateway health snapshot。
    - `diagnostics.stability` 會回傳最近的有界 diagnostic stability recorder。它會保留 operational metadata，例如 event 名稱、計數、byte 大小、memory reading、queue/session state、channel/Plugin 名稱和 session id。它不會保留 chat text、Webhook body、tool output、原始 request 或 response body、token、cookie 或 secret 值。需要 operator read scope。
    - `status` 會回傳 `/status` 風格的 Gateway 摘要；敏感欄位只會包含給 admin-scoped operator client。
    - `gateway.identity.get` 會回傳 relay 和 pairing flow 使用的 Gateway device identity。
    - `system-presence` 會回傳已連線 operator/Node device 的目前 presence snapshot。
    - `system-event` 會附加 system event，並可更新/broadcast presence context。
    - `last-heartbeat` 會回傳最新持久化的 Heartbeat event。
    - `set-heartbeats` 會切換 Gateway 上的 Heartbeat processing。

  </Accordion>

  <Accordion title="模型與用量">
    - `models.list` 會傳回執行階段允許的模型目錄。傳入 `{ "view": "configured" }` 可取得適合選擇器大小的已設定模型（先是 `agents.defaults.models`，再來是 `models.providers.*.models`），或傳入 `{ "view": "all" }` 取得完整目錄。
    - `usage.status` 會傳回供應商用量時段/剩餘額度摘要。
    - `usage.cost` 會傳回日期範圍的彙總成本用量摘要。
    - `doctor.memory.status` 會傳回作用中預設代理工作區的向量記憶體 / 已快取嵌入準備狀態。只有當呼叫端明確需要即時嵌入供應商 ping 時，才傳入 `{ "probe": true }` 或 `{ "deep": true }`。
    - `doctor.memory.remHarness` 會傳回供遠端控制平面用戶端使用的有界、唯讀 REM harness 預覽。它可能包含工作區路徑、記憶體片段、已轉譯的 grounded markdown，以及深度提升候選項目，因此呼叫端需要 `operator.read`。
    - `sessions.usage` 會傳回每個工作階段的用量摘要。
    - `sessions.usage.timeseries` 會傳回單一工作階段的時間序列用量。
    - `sessions.usage.logs` 會傳回單一工作階段的用量記錄項目。

  </Accordion>

  <Accordion title="頻道與登入輔助程式">
    - `channels.status` 會傳回內建 + 隨附頻道/Plugin 狀態摘要。
    - `channels.logout` 會登出指定頻道/帳號，前提是該頻道支援登出。
    - `web.login.start` 會為目前支援 QR 的網頁頻道供應商啟動 QR/網頁登入流程。
    - `web.login.wait` 會等待該 QR/網頁登入流程完成，並在成功時啟動頻道。
    - `push.test` 會將測試 APNs 推播傳送到已註冊的 iOS Node。
    - `voicewake.get` 會傳回已儲存的喚醒詞觸發條件。
    - `voicewake.set` 會更新喚醒詞觸發條件並廣播變更。

  </Accordion>

  <Accordion title="訊息與記錄">
    - `send` 是在聊天執行器外，針對頻道/帳號/討論串目標傳送的直接對外遞送 RPC。
    - `logs.tail` 會傳回已設定的 Gateway 檔案記錄尾端，並提供游標/限制與最大位元組控制。

  </Accordion>

  <Accordion title="Talk 與 TTS">
    - `talk.catalog` 會傳回唯讀 Talk 供應商目錄，用於語音、串流轉錄和即時語音。它包含供應商 ID、標籤、設定狀態、公開的模型/語音 ID、標準模式、傳輸、brain 策略，以及即時音訊/功能旗標，但不會傳回供應商秘密或變更全域設定。
    - `talk.config` 會傳回有效的 Talk 設定承載；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.session.create` 會建立 Gateway 擁有的 Talk 工作階段，用於 `realtime/gateway-relay`、`transcription/gateway-relay` 或 `stt-tts/managed-room`。`brain: "direct-tools"` 需要 `operator.admin`。
    - `talk.session.join` 會驗證受管理房間工作階段權杖，視需要發出 `session.ready` 或 `session.replaced` 事件，並傳回房間/工作階段中繼資料以及近期 Talk 事件，但不包含純文字權杖或已儲存的權杖雜湊。
    - `talk.session.appendAudio` 會將 base64 PCM 輸入音訊附加到 Gateway 擁有的即時轉送與轉錄工作階段。
    - `talk.session.startTurn`、`talk.session.endTurn` 和 `talk.session.cancelTurn` 會驅動受管理房間的回合生命週期，並在清除狀態前拒絕過期回合。
    - `talk.session.cancelOutput` 會停止助理音訊輸出，主要用於 Gateway 轉送工作階段中由 VAD 閘控的插話。
    - `talk.session.submitToolResult` 會完成由 Gateway 擁有的即時轉送工作階段發出的供應商工具呼叫。
    - `talk.session.close` 會關閉 Gateway 擁有的轉送、轉錄或受管理房間工作階段，並發出終止 Talk 事件。
    - `talk.mode` 會設定/廣播 WebChat/Control UI 用戶端目前的 Talk 模式狀態。
    - `talk.client.create` 會使用 `webrtc` 或 `provider-websocket` 建立用戶端擁有的即時供應商工作階段，同時由 Gateway 擁有設定、認證、指示與工具政策。
    - `talk.client.toolCall` 允許用戶端擁有的即時傳輸將供應商工具呼叫轉送到 Gateway 政策。第一個支援的工具是 `openclaw_agent_consult`；用戶端會收到執行 ID，並等待一般聊天生命週期事件後再提交供應商專用的工具結果。
    - `talk.event` 是即時、轉錄、STT/TTS、受管理房間、電話和會議配接器的單一 Talk 事件頻道。
    - `talk.speak` 會透過作用中的 Talk 語音供應商合成語音。
    - `tts.status` 會傳回 TTS 啟用狀態、作用中供應商、備援供應商和供應商設定狀態。
    - `tts.providers` 會傳回可見的 TTS 供應商清單。
    - `tts.enable` 和 `tts.disable` 會切換 TTS 偏好設定狀態。
    - `tts.setProvider` 會更新偏好的 TTS 供應商。
    - `tts.convert` 會執行一次性文字轉語音轉換。

  </Accordion>

  <Accordion title="秘密、設定、更新與精靈">
    - `secrets.reload` 會重新解析作用中的 SecretRefs，且只有在完全成功時才交換執行階段秘密狀態。
    - `secrets.resolve` 會解析特定命令/目標集合的命令目標秘密指派。
    - `config.get` 會傳回目前的設定快照與雜湊。
    - `config.set` 會寫入已驗證的設定承載。
    - `config.patch` 會合併部分設定更新。
    - `config.apply` 會驗證並取代完整設定承載。
    - `config.schema` 會傳回 Control UI 和 CLI 工具使用的即時設定架構承載：schema、`uiHints`、版本與生成中繼資料，包含 Plugin + 頻道架構中繼資料（當執行階段可載入時）。該架構包含欄位 `title` / `description` 中繼資料，這些資料衍生自 UI 使用的相同標籤與說明文字，且在存在相符欄位文件時，也包含巢狀物件、萬用字元、陣列項目，以及 `anyOf` / `oneOf` / `allOf` 組合分支。
    - `config.schema.lookup` 會傳回單一設定路徑的路徑範圍查詢承載：正規化路徑、淺層架構節點、相符提示 + `hintPath`，以及供 UI/CLI 下鑽的直接子項摘要。查詢架構節點會保留面向使用者的文件與常見驗證欄位（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、數值/字串/陣列/物件界限，以及如 `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` 這類旗標）。子項摘要會公開 `key`、正規化的 `path`、`type`、`required`、`hasChildren`，以及相符的 `hint` / `hintPath`。
    - `update.run` 會執行 Gateway 更新流程，且只有在更新本身成功時才排程重新啟動；擁有工作階段的呼叫端可包含 `continuationMessage`，讓啟動在重新啟動延續佇列中恢復一個後續代理回合。套件管理員更新會在套件交換後強制進行非延後、無冷卻時間的更新重新啟動，避免舊 Gateway 行程繼續從已替換的 `dist` 樹進行延遲載入。
    - `update.status` 會傳回最新快取的更新重新啟動哨兵，包含可用時重新啟動後的執行版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 會透過 WS RPC 公開入門精靈。

  </Accordion>

  <Accordion title="代理與工作區輔助程式">
    - `agents.list` 會傳回已設定的代理項目，包含有效模型與執行階段中繼資料。
    - `agents.create`、`agents.update` 和 `agents.delete` 會管理代理記錄與工作區連接。
    - `agents.files.list`、`agents.files.get` 和 `agents.files.set` 會管理為代理公開的啟動工作區檔案。
    - `artifacts.list`、`artifacts.get` 和 `artifacts.download` 會在明確的 `sessionKey`、`runId` 或 `taskId` 範圍內公開衍生自逐字稿的成品摘要與下載。執行與任務查詢會在伺服器端解析擁有的工作階段，且只傳回具有相符來源的逐字稿媒體；不安全或本機 URL 來源會傳回不支援的下載，而不是在伺服器端擷取。
    - `environments.list` 和 `environments.status` 會向 SDK 用戶端公開唯讀 Gateway 本機與 Node 環境探索。
    - `agent.identity.get` 會傳回代理或工作階段的有效助理身分。
    - `agent.wait` 會等待執行完成，並在可用時傳回終止快照。

  </Accordion>

  <Accordion title="工作階段控制">
    - `sessions.list` 會傳回目前的工作階段索引；當已設定代理執行階段後端時，包含每列的 `agentRuntime` 中繼資料。
    - `sessions.subscribe` 和 `sessions.unsubscribe` 會切換目前 WS 用戶端的工作階段變更事件訂閱。
    - `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 會切換單一工作階段的逐字稿/訊息事件訂閱。
    - `sessions.preview` 會傳回特定工作階段鍵的有界逐字稿預覽。
    - `sessions.describe` 會針對精確的工作階段鍵傳回一列 Gateway 工作階段。
    - `sessions.resolve` 會解析或標準化工作階段目標。
    - `sessions.create` 會建立新的工作階段項目。
    - `sessions.send` 會將訊息傳送到現有工作階段。
    - `sessions.steer` 是作用中工作階段的中斷並導向變體。
    - `sessions.abort` 會中止工作階段的作用中工作。呼叫端可傳入 `key` 加上選用的 `runId`，或只傳入 `runId`，適用於 Gateway 可解析到工作階段的作用中執行。
    - `sessions.patch` 會更新工作階段中繼資料/覆寫，並回報已解析的標準模型以及有效的 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 和 `sessions.compact` 會執行工作階段維護。
    - `sessions.get` 會傳回完整儲存的工作階段列。
    - 聊天執行仍使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。`chat.history` 會針對 UI 用戶端做顯示正規化：從可見文字移除行內指示標籤、移除純文字工具呼叫 XML 承載（包含 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和截斷的工具呼叫區塊）以及外洩的 ASCII/全形模型控制權杖、省略純靜默權杖助理列，例如精確的 `NO_REPLY` / `no_reply`，且過大的列可替換為預留位置。

  </Accordion>

  <Accordion title="裝置配對與裝置權杖">
    - `device.pair.list` 會傳回待處理與已核准的配對裝置。
    - `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 會管理裝置配對記錄。
    - `device.token.rotate` 會在已核准角色與呼叫端範圍邊界內輪替配對裝置權杖。
    - `device.token.revoke` 會在已核准角色與呼叫端範圍邊界內撤銷配對裝置權杖。

  </Accordion>

  <Accordion title="Node 配對、叫用與待處理工作">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove` 和 `node.pair.verify` 涵蓋 Node 配對與啟動驗證。
    - `node.list` 和 `node.describe` 會傳回已知/已連線 Node 狀態。
    - `node.rename` 會更新已配對 Node 標籤。
    - `node.invoke` 會將命令轉送到已連線的 Node。
    - `node.invoke.result` 會傳回叫用要求的結果。
    - `node.event` 會將源自 Node 的事件帶回 gateway。
    - `node.pending.pull` 和 `node.pending.ack` 是已連線 Node 佇列 API。
    - `node.pending.enqueue` 和 `node.pending.drain` 會管理離線/已中斷連線 Node 的持久待處理工作。

  </Accordion>

  <Accordion title="核准系列">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 涵蓋一次性 exec 核准請求，以及待處理核准的查詢/重播。
    - `exec.approval.waitDecision` 會等待一個待處理的 exec 核准，並回傳最終決定（逾時時為 `null`）。
    - `exec.approvals.get` 和 `exec.approvals.set` 管理 gateway exec 核准政策快照。
    - `exec.approvals.node.get` 和 `exec.approvals.node.set` 透過 node relay 命令管理 node-local exec 核准政策。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 涵蓋 plugin 定義的核准流程。

  </Accordion>

  <Accordion title="自動化、Skills 與工具">
    - 自動化：`wake` 會排程立即或下一次 Heartbeat 的喚醒文字注入；`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 管理已排程工作。
    - Skills 與工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 常見事件系列

- `chat`：UI 聊天更新，例如 `chat.inject` 和其他僅限逐字稿的聊天
  事件。
- `session.message` 和 `session.tool`：已訂閱工作階段的逐字稿/事件串流
  更新。
- `sessions.changed`：工作階段索引或中繼資料已變更。
- `presence`：系統 presence 快照更新。
- `tick`：週期性 keepalive / liveness 事件。
- `health`：gateway 健康狀態快照更新。
- `heartbeat`：Heartbeat 事件串流更新。
- `cron`：Cron 執行/工作變更事件。
- `shutdown`：gateway 關閉通知。
- `node.pair.requested` / `node.pair.resolved`：node 配對生命週期。
- `node.invoke.request`：node invoke 請求廣播。
- `device.pair.requested` / `device.pair.resolved`：已配對裝置生命週期。
- `voicewake.changed`：wake-word 觸發設定已變更。
- `exec.approval.requested` / `exec.approval.resolved`：exec 核准
  生命週期。
- `plugin.approval.requested` / `plugin.approval.resolved`：plugin 核准
  生命週期。

### Node 輔助方法

- Nodes 可呼叫 `skills.bins` 來擷取目前的 skill 可執行檔清單，
  以進行自動允許檢查。

### Operator 輔助方法

- Operators 可呼叫 `commands.list` (`operator.read`) 來擷取 agent 的 runtime
  命令清單。
  - `agentId` 是選填；省略它即可讀取預設 agent workspace。
  - `scope` 控制主要 `name` 所指向的介面：
    - `text` 回傳不含前導 `/` 的主要文字命令 token
    - `native` 和預設 `both` 路徑會在可用時回傳 provider-aware native names
  - `textAliases` 帶有精確的斜線別名，例如 `/model` 和 `/m`。
  - `nativeName` 會在存在時帶有 provider-aware native command name。
  - `provider` 是選填，且只會影響 native 命名以及 native plugin
    命令可用性。
  - `includeArgs=false` 會從回應中省略序列化的引數中繼資料。
- Operators 可呼叫 `tools.catalog` (`operator.read`) 來擷取 agent 的 runtime tool catalog。回應包含分組工具與來源中繼資料：
  - `source`：`core` 或 `plugin`
  - `pluginId`：當 `source="plugin"` 時的 plugin 擁有者
  - `optional`：plugin tool 是否為選用
- Operators 可呼叫 `tools.effective` (`operator.read`) 來擷取工作階段的 runtime-effective tool
  清單。
  - `sessionKey` 為必填。
  - gateway 會從伺服器端的工作階段衍生可信任的 runtime context，而不是接受
    呼叫方提供的 auth 或 delivery context。
  - 回應限定於工作階段範圍，並反映目前作用中對話可立即使用的內容，
    包含 core、plugin 和 channel tools。
- Operators 可呼叫 `tools.invoke` (`operator.write`) 透過與 `/tools/invoke`
  相同的 gateway policy 路徑叫用一個可用工具。
  - `name` 為必填。`args`、`sessionKey`、`agentId`、`confirm` 和
    `idempotencyKey` 為選填。
  - 如果同時存在 `sessionKey` 和 `agentId`，解析出的工作階段 agent 必須符合
    `agentId`。
  - 回應是面向 SDK 的 envelope，包含 `ok`、`toolName`、選填的 `output`，以及具型別的
    `error` 欄位。核准或政策拒絕會在 payload 中回傳 `ok:false`，而不是
    繞過 gateway tool policy pipeline。
- Operators 可呼叫 `skills.status` (`operator.read`) 來擷取 agent 的可見
  skill 清單。
  - `agentId` 是選填；省略它即可讀取預設 agent workspace。
  - 回應包含資格、缺少的需求、設定檢查，以及
    經清理的安裝選項，不會暴露原始 secret 值。
- Operators 可呼叫 `skills.search` 和 `skills.detail` (`operator.read`) 以取得
  ClawHub 探索中繼資料。
- Operators 可在兩種模式下呼叫 `skills.install` (`operator.admin`)：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 會將
    skill 資料夾安裝到預設 agent workspace 的 `skills/` 目錄。
  - Gateway 安裝程式模式：`{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    會在 gateway host 上執行宣告的 `metadata.openclaw.install` 動作。
- Operators 可在兩種模式下呼叫 `skills.update` (`operator.admin`)：
  - ClawHub 模式會更新一個已追蹤 slug，或預設 agent workspace 中所有已追蹤的 ClawHub 安裝。
  - 設定模式會修補 `skills.entries.<skillKey>` 值，例如 `enabled`、
    `apiKey` 和 `env`。

### `models.list` 檢視

`models.list` 接受選填的 `view` 參數：

- 省略或 `"default"`：目前的 runtime 行為。如果已設定 `agents.defaults.models`，回應會是允許的 catalog；否則回應會是完整的 Gateway catalog。
- `"configured"`：適合 picker 大小的行為。如果已設定 `agents.defaults.models`，它仍會優先。否則回應會使用明確的 `models.providers.*.models` 項目，只有在不存在已設定 model rows 時才退回完整 catalog。
- `"all"`：完整的 Gateway catalog，繞過 `agents.defaults.models`。此檢視用於診斷與探索 UI，而不是一般 model picker。

## Exec 核准

- 當 exec 請求需要核准時，gateway 會廣播 `exec.approval.requested`。
- Operator clients 透過呼叫 `exec.approval.resolve` 來解決（需要 `operator.approvals` scope）。
- 對於 `host=node`，`exec.approval.request` 必須包含 `systemRunPlan`（canonical `argv`/`cwd`/`rawCommand`/工作階段中繼資料）。缺少 `systemRunPlan` 的請求會被拒絕。
- 核准後，轉送的 `node.invoke system.run` 呼叫會重用該 canonical
  `systemRunPlan` 作為具權威性的 command/cwd/工作階段 context。
- 如果呼叫方在準備和最終已核准的 `system.run` 轉送之間變更 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，gateway 會拒絕該執行，而不是信任已變更的 payload。

## Agent delivery fallback

- `agent` 請求可包含 `deliver=true` 以請求 outbound delivery。
- `bestEffortDeliver=false` 會維持嚴格行為：無法解析或僅限內部的 delivery targets 會回傳 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允許在無法解析外部可 delivery 路由時退回到僅限工作階段的執行（例如 internal/webchat 工作階段或模稜兩可的 multi-channel configs）。

## 版本管理

- `PROTOCOL_VERSION` 位於 `src/gateway/protocol/version.ts`。
- Clients 會傳送 `minProtocol` + `maxProtocol`；server 會拒絕不相符的情況。
- Schemas + models 由 TypeBox 定義產生：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Client constants

`src/gateway/client.ts` 中的 reference client 使用這些預設值。這些值在
protocol v4 期間保持穩定，並且是 third-party clients 的預期基準。

| Constant                                  | 預設值                                                | 來源                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| Request timeout (per RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth / connect-challenge timeout       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（config/env 可提高已配對 server/client 的預算） |
| Initial reconnect backoff                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Max reconnect backoff                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-retry clamp after device-token close | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| Force-stop grace before `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` default timeout           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Default tick interval (pre `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick-timeout close                        | code `4000` when silence exceeds `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

server 會在 `hello-ok` 中公告有效的 `policy.tickIntervalMs`、`policy.maxPayload`
和 `policy.maxBufferedBytes`；clients 應遵循這些值，
而不是 pre-handshake 預設值。

## Auth

- 共用密鑰 Gateway 驗證會使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，取決於設定的驗證模式。
- 帶有身分的模式，例如 Tailscale Serve
  (`gateway.auth.allowTailscale: true`) 或非回送的
  `gateway.auth.mode: "trusted-proxy"`，會從請求標頭而非 `connect.params.auth.*`
  滿足 connect 驗證檢查。
- 私有入口 `gateway.auth.mode: "none"` 會完全略過共用密鑰 connect 驗證；
  請勿在公開/不受信任的入口上暴露該模式。
- 配對後，Gateway 會發行一個限定於連線角色 + scopes 的**裝置權杖**。
  它會在 `hello-ok.auth.deviceToken` 中傳回，且用戶端應將其持久化以供未來 connect 使用。
- 用戶端應在任何成功 connect 後持久化主要的 `hello-ok.auth.deviceToken`。
- 使用該**已儲存**裝置權杖重新連線時，也應重用為該權杖儲存的已核准 scope 集合。
  這會保留已授予的 read/probe/status 存取權，並避免將重新連線悄悄降級為
  更窄的隱含 admin-only scope。
- 用戶端 connect 驗證組裝（`src/gateway/client.ts` 中的 `selectConnectAuth`）：
  - `auth.password` 是正交的，且設定時一律會被轉送。
  - `auth.token` 會按優先順序填入：先是明確的共用權杖，
    接著是明確的 `deviceToken`，再來是已儲存的每裝置權杖（以
    `deviceId` + `role` 為索引鍵）。
  - `auth.bootstrapToken` 只會在上述項目都未解析出
    `auth.token` 時送出。共用權杖或任何已解析的裝置權杖都會抑制它。
  - 在一次性的 `AUTH_TOKEN_MISMATCH` 重試中，自動提升已儲存裝置權杖的行為
    僅限於**受信任端點**：回送，或具有已釘選 `tlsFingerprint` 的 `wss://`。
    未釘選的公開 `wss://` 不符合資格。
- 額外的 `hello-ok.auth.deviceTokens` 項目是啟動交接權杖。
  只有在 connect 使用啟動驗證，且傳輸為受信任傳輸（例如 `wss://`
  或回送/本機配對）時，才持久化它們。
- 如果用戶端提供**明確的** `deviceToken` 或明確的 `scopes`，
  該呼叫端請求的 scope 集合仍是權威；只有在用戶端重用已儲存的每裝置權杖時，
  才會重用快取的 scopes。
- 裝置權杖可透過 `device.token.rotate` 和
  `device.token.revoke` 輪替/撤銷（需要 `operator.pairing` scope）。
- `device.token.rotate` 會傳回輪替中繼資料。只有在同一裝置呼叫且已使用該裝置權杖驗證時，
  它才會回傳替代 bearer 權杖，讓僅使用權杖的用戶端能在重新連線前持久化其替代權杖。
  共用/admin 輪替不會回傳 bearer 權杖。
- 權杖發行、輪替與撤銷都會受限於該裝置配對項目中記錄的已核准角色集合；
  權杖變更無法擴大或指向配對核准從未授予的裝置角色。
- 對於已配對裝置的權杖工作階段，除非呼叫端也具有 `operator.admin`，
  否則裝置管理是自我限定的：非 admin 呼叫端只能移除/撤銷/輪替其**自己的**裝置項目。
- `device.token.rotate` 和 `device.token.revoke` 也會根據呼叫端目前的工作階段 scopes
  檢查目標 operator 權杖 scope 集合。非 admin 呼叫端無法輪替或撤銷比自己已持有權限更廣的 operator 權杖。
- 驗證失敗會包含 `error.details.code` 以及復原提示：
  - `error.details.canRetryWithDeviceToken`（布林值）
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` 的用戶端行為：
  - 受信任用戶端可嘗試一次有界限的重試，並使用快取的每裝置權杖。
  - 如果該重試失敗，用戶端應停止自動重新連線迴圈，並顯示 operator 動作指引。

## 裝置身分 + 配對

- Node 應包含從金鑰組指紋衍生的穩定裝置身分 (`device.id`)。
- Gateway 會依每個裝置 + 角色發行權杖。
- 新裝置 ID 需要配對核准，除非已啟用本機自動核准。
- 配對自動核准以直接 local loopback 連線為中心。
- OpenClaw 也有一條狹窄的後端/容器本機自我連線路徑，用於受信任的共用密鑰輔助流程。
- 同主機 tailnet 或 LAN 連線在配對上仍被視為遠端，且需要核准。
- WS 用戶端通常會在 `connect` 期間包含 `device` 身分（operator +
  node）。唯一不需要裝置的 operator 例外是明確信任路徑：
  - `gateway.controlUi.allowInsecureAuth=true`，用於僅限 localhost 的不安全 HTTP 相容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` operator Control UI 驗證。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急破例，嚴重降低安全性）。
  - 直接回送的 `gateway-client` 後端 RPC，使用共用
    Gateway 權杖/密碼驗證。
- 所有連線都必須簽署伺服器提供的 `connect.challenge` nonce。

### 裝置驗證遷移診斷

對於仍使用挑戰前簽署行為的舊版用戶端，`connect` 現在會在
`error.details.code` 下傳回 `DEVICE_AUTH_*` 詳細代碼，並提供穩定的 `error.details.reason`。

常見遷移失敗：

| 訊息                        | details.code                     | details.reason           | 含義                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 用戶端省略 `device.nonce`（或傳送空白值）。        |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 用戶端使用過期/錯誤的 nonce 簽署。                |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 簽章 payload 與 v2 payload 不相符。                |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 已簽署時間戳超出允許偏差。                        |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 與公開金鑰指紋不相符。                |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開金鑰格式/正規化失敗。                         |

遷移目標：

- 一律等待 `connect.challenge`。
- 簽署包含伺服器 nonce 的 v2 payload。
- 在 `connect.params.device.nonce` 中傳送相同 nonce。
- 偏好的簽章 payload 是 `v3`，除了 device/client/role/scopes/token/nonce 欄位外，
  還會繫結 `platform` 和 `deviceFamily`。
- 舊版 `v2` 簽章仍因相容性而被接受，但已配對裝置的中繼資料釘選仍會控制重新連線時的命令政策。

## TLS + 釘選

- TLS 支援 WS 連線。
- 用戶端可選擇釘選 gateway 憑證指紋（請參閱 `gateway.tls`
  設定以及 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`）。

## 範圍

此通訊協定會暴露**完整 gateway API**（status、channels、models、chat、
agent、sessions、nodes、approvals 等）。確切介面由
`src/gateway/protocol/schema.ts` 中的 TypeBox schemas 定義。

## 相關

- [橋接通訊協定](/zh-TW/gateway/bridge-protocol)
- [Gateway runbook](/zh-TW/gateway)
