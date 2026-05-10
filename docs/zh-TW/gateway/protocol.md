---
read_when:
    - 實作或更新 Gateway WS 用戶端
    - 偵錯通訊協定不相符或連線失敗
    - 重新產生協定結構描述/模型
summary: Gateway WebSocket 協定：交握、訊框、版本管理
title: Gateway 通訊協定
x-i18n:
    generated_at: "2026-05-10T19:36:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8bca116f2b05387e3c045f94137dff4eafba281ea5f2eabb65e75469cba8e8e
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS 協定是 OpenClaw 的**單一控制平面 + 節點傳輸**。
所有用戶端（CLI、Web UI、macOS app、iOS/Android 節點、無周邊
節點）都透過 WebSocket 連線，並在握手時宣告其**角色** + **範圍**。

## 傳輸

- WebSocket，帶有 JSON 酬載的文字框架。
- 第一個框架**必須**是 `connect` 請求。
- 連線前框架上限為 64 KiB。成功握手後，用戶端應遵循
  `hello-ok.policy.maxPayload` 和
  `hello-ok.policy.maxBufferedBytes` 限制。啟用診斷時，
  過大的入站框架和緩慢的出站緩衝區會在 Gateway 關閉或捨棄受影響框架前，
  發出 `payload.large` 事件。這些事件會保留大小、限制、介面和安全的原因代碼。
  它們不會保留訊息本文、附件內容、原始框架本文、權杖、Cookie 或祕密值。

## 握手（connect）

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

當 Gateway 仍在完成啟動 sidecar 時，`connect` 請求可能會傳回可重試的
`UNAVAILABLE` 錯誤，且 `details.reason` 設為
`"startup-sidecars"` 並包含 `retryAfterMs`。用戶端應在其整體連線預算內重試該回應，
而不是將其呈現為終止性的握手失敗。

`server`、`features`、`snapshot` 和 `policy` 都是 schema
（`src/gateway/protocol/schema/frames.ts`）要求的欄位。`auth` 也為必要欄位，
並回報協商後的角色/範圍。`pluginSurfaceUrls` 為選用欄位，會將 Plugin 介面名稱
（例如 `canvas`）對應到具範圍限制的託管 URL。

具範圍限制的 Plugin 介面 URL 可能會過期。節點可以使用 `{ "surface": "canvas" }`
呼叫 `node.pluginSurface.refresh`，以在 `pluginSurfaceUrls` 中接收新的項目。
實驗性的 Canvas Plugin 重構不支援已棄用的 `canvasHostUrl`、`canvasCapability` 或
`node.canvas.capability.refresh` 相容路徑；目前的原生用戶端和 Gateway 必須使用 Plugin 介面。

未簽發裝置權杖時，`hello-ok.auth` 會回報協商後的權限，而不包含權杖欄位：

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

受信任的同程序後端用戶端（`client.id: "gateway-client"`、
`client.mode: "backend"`）在以共用 Gateway 權杖/密碼驗證的 direct loopback 連線上，
可以省略 `device`。此路徑保留給內部控制平面 RPC，並避免過時的 CLI/裝置配對基準
阻擋本機後端工作，例如子代理工作階段更新。遠端用戶端、瀏覽器來源用戶端、節點用戶端，
以及明確的裝置權杖/裝置身分用戶端，仍使用一般配對和範圍升級檢查。

簽發裝置權杖時，`hello-ok` 也會包含：

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

在受信任的啟動交接期間，`hello-ok.auth` 也可能在 `deviceTokens` 中包含額外的
有界角色項目：

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

對於內建的節點/operator 啟動流程，主要節點權杖會維持 `scopes: []`，任何交接的
operator 權杖也會限制在啟動 operator 允許清單
（`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`）內。
啟動範圍檢查會維持角色前綴：operator 項目只滿足 operator 請求，非 operator
角色仍需要其自身角色前綴下的範圍。

### 節點範例

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

## 框架格式

- **請求**：`{type:"req", id, method, params}`
- **回應**：`{type:"res", id, ok, payload|error}`
- **事件**：`{type:"event", event, payload, seq?, stateVersion?}`

具有副作用的方法需要**冪等鍵**（請參閱 schema）。

## 角色 + 範圍

如需完整的 operator 範圍模型、核准時檢查與共用祕密語意，請參閱
[Operator 範圍](/zh-TW/gateway/operator-scopes)。

### 角色

- `operator` = 控制平面用戶端（CLI/UI/自動化）。
- `node` = 能力主機（camera/screen/canvas/system.run）。

### 範圍（operator）

常見範圍：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

帶有 `includeSecrets: true` 的 `talk.config` 需要 `operator.talk.secrets`
（或 `operator.admin`）。

Plugin 註冊的 Gateway RPC 方法可以要求自己的 operator 範圍，但保留的核心管理前綴
（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）一律解析為
`operator.admin`。

方法範圍只是第一道門檻。透過 `chat.send` 觸達的某些斜線命令會在其上套用更嚴格的命令層級檢查。
例如，持久化的 `/config set` 和 `/config unset` 寫入需要 `operator.admin`。

`node.pair.approve` 在基礎方法範圍之外，也有額外的核准時範圍檢查：

- 無命令請求：`operator.pairing`
- 帶有非 exec 節點命令的請求：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的請求：
  `operator.pairing` + `operator.admin`

### 能力/命令/權限（節點）

節點會在連線時宣告能力主張：

- `caps`：高層級能力類別，例如 `camera`、`canvas`、`screen`、
  `location`、`voice` 和 `talk`。
- `commands`：invoke 的命令允許清單。
- `permissions`：細粒度切換（例如 `screen.record`、`camera.capture`）。

Gateway 會將這些視為**主張**，並強制執行伺服器端允許清單。

## 狀態

- `system-presence` 會傳回依裝置身分索引的項目。
- 狀態項目包含 `deviceId`、`roles` 和 `scopes`，因此即使裝置同時以 **operator**
  和**節點**連線，UI 也能為每個裝置顯示單一列。
- `node.list` 包含選用的 `lastSeenAtMs` 和 `lastSeenReason` 欄位。已連線節點會以原因
  `connect` 將其目前連線時間回報為 `lastSeenAtMs`；當受信任節點事件更新其配對中繼資料時，
  已配對節點也可以回報持久的背景狀態。

### 節點背景存活事件

節點可以使用 `event: "node.presence.alive"` 呼叫 `node.event`，以記錄已配對節點在背景喚醒期間存活，
但不將其標記為已連線。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是封閉列舉：`background`、`silent_push`、`bg_app_refresh`、
`significant_location`、`manual` 或 `connect`。未知的 trigger 字串會由 Gateway
在持久化前正規化為 `background`。此事件只對已驗證的節點裝置工作階段具持久性；
無裝置或未配對的工作階段會傳回 `handled: false`。

成功的 Gateway 會傳回結構化結果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

較舊的 Gateway 對 `node.event` 可能仍會傳回 `{ "ok": true }`；用戶端應將其視為
已確認的 RPC，而不是持久狀態保存。

## 廣播事件範圍設定

伺服器推送的 WebSocket 廣播事件會受範圍管制，因此 pairing-scoped 或僅節點工作階段不會被動接收工作階段內容。

- **聊天、代理與工具結果框架**（包含串流的 `agent` 事件與工具呼叫結果）至少需要 `operator.read`。
  沒有 `operator.read` 的工作階段會完全略過這些框架。
- **Plugin 定義的 `plugin.*` 廣播**會依 Plugin 註冊方式，限制為 `operator.write` 或 `operator.admin`。
- **狀態和傳輸事件**（`heartbeat`、`presence`、`tick`、連線/中斷連線生命週期等）維持不受限制，
  讓每個已驗證工作階段都能觀測傳輸健康狀態。
- **未知的廣播事件家族**預設會受範圍管制（失敗時關閉），除非已註冊的處理常式明確放寬限制。

每個用戶端連線都會保留自己的逐用戶端序號，因此即使不同用戶端看到事件串流中經不同範圍篩選的子集，
廣播在該 socket 上仍會保留單調順序。

## 常見 RPC 方法家族

公開 WS 介面比上述握手/驗證範例更廣。這不是產生出的傾印清單；`hello-ok.features.methods`
是由 `src/gateway/server-methods-list.ts` 加上已載入的 Plugin/通道方法匯出所建構的保守探索清單。
請將其視為功能探索，而不是 `src/gateway/server-methods/*.ts` 的完整列舉。

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` 會傳回快取或新探測的 Gateway 健康狀態快照。
    - `diagnostics.stability` 會傳回近期的有界診斷穩定性記錄器。它會保留作業中繼資料，例如事件名稱、計數、位元組大小、記憶體讀數、佇列/工作階段狀態、通道/Plugin 名稱和工作階段 ID。它不會保留聊天文字、Webhook 本文、工具輸出、原始請求或回應本文、權杖、Cookie 或祕密值。需要 operator read 範圍。
    - `status` 會傳回 `/status` 風格的 Gateway 摘要；敏感欄位只會包含於具 admin 範圍的 operator 用戶端。
    - `gateway.identity.get` 會傳回 relay 和配對流程使用的 Gateway 裝置身分。
    - `system-presence` 會傳回目前已連線 operator/節點裝置的狀態快照。
    - `system-event` 會附加系統事件，並可更新/廣播狀態脈絡。
    - `last-heartbeat` 會傳回最新持久化的 Heartbeat 事件。
    - `set-heartbeats` 會切換 Gateway 上的 Heartbeat 處理。

  </Accordion>

  <Accordion title="模型與使用量">
    - `models.list` 會傳回執行階段允許的模型目錄。傳入 `{ "view": "configured" }` 可取得適合選擇器大小的已設定模型（先是 `agents.defaults.models`，再來是 `models.providers.*.models`），或傳入 `{ "view": "all" }` 取得完整目錄。
    - `usage.status` 會傳回供應商使用量時段／剩餘配額摘要。
    - `usage.cost` 會傳回日期範圍的彙總成本使用量摘要。
    - `doctor.memory.status` 會傳回作用中預設代理工作區的向量記憶體／快取嵌入就緒狀態。只有在呼叫端明確想要即時嵌入供應商 ping 時，才傳入 `{ "probe": true }` 或 `{ "deep": true }`。
    - `doctor.memory.remHarness` 會為遠端控制平面用戶端傳回有界、唯讀的 REM harness 預覽。它可以包含工作區路徑、記憶體片段、已算繪的 grounded markdown，以及深度提升候選項，因此呼叫端需要 `operator.read`。
    - `sessions.usage` 會傳回每個工作階段的使用量摘要。
    - `sessions.usage.timeseries` 會傳回單一工作階段的時間序列使用量。
    - `sessions.usage.logs` 會傳回單一工作階段的使用量記錄項目。

  </Accordion>

  <Accordion title="通道與登入輔助工具">
    - `channels.status` 會傳回內建與隨附通道／Plugin 狀態摘要。
    - `channels.logout` 會在通道支援登出時登出特定通道／帳號。
    - `web.login.start` 會為目前支援 QR 的 Web 通道供應商啟動 QR／Web 登入流程。
    - `web.login.wait` 會等待該 QR／Web 登入流程完成，並在成功時啟動通道。
    - `push.test` 會將測試 APNs 推播傳送到已註冊的 iOS 節點。
    - `voicewake.get` 會傳回已儲存的喚醒詞觸發器。
    - `voicewake.set` 會更新喚醒詞觸發器並廣播變更。

  </Accordion>

  <Accordion title="訊息與記錄">
    - `send` 是直接的輸出傳遞 RPC，用於聊天執行器之外、以通道／帳號／對話串為目標的傳送。
    - `logs.tail` 會傳回已設定的 Gateway 檔案記錄尾端，並提供游標／限制與最大位元組控制。

  </Accordion>

  <Accordion title="Talk 與 TTS">
    - `talk.catalog` 會傳回語音、串流轉錄和即時語音的唯讀 Talk 供應商目錄。它包含供應商 ID、標籤、設定狀態、公開的模型／語音 ID、標準模式、傳輸、brain 策略，以及即時音訊／能力旗標，而不會傳回供應商密鑰或變更全域設定。
    - `talk.config` 會傳回有效的 Talk 設定承載；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.session.create` 會為 `realtime/gateway-relay`、`transcription/gateway-relay` 或 `stt-tts/managed-room` 建立由 Gateway 擁有的 Talk 工作階段。`brain: "direct-tools"` 需要 `operator.admin`。
    - `talk.session.join` 會驗證受管理房間工作階段權杖，視需要發出 `session.ready` 或 `session.replaced` 事件，並傳回房間／工作階段中繼資料以及近期 Talk 事件，但不包含明文權杖或已儲存的權杖雜湊。
    - `talk.session.appendAudio` 會將 base64 PCM 輸入音訊附加到 Gateway 擁有的即時轉送與轉錄工作階段。
    - `talk.session.startTurn`、`talk.session.endTurn` 和 `talk.session.cancelTurn` 會驅動受管理房間的輪次生命週期，並在狀態清除前拒絕過期輪次。
    - `talk.session.cancelOutput` 會停止助理音訊輸出，主要用於 Gateway 轉送工作階段中由 VAD 閘控的插話。
    - `talk.session.submitToolResult` 會完成由 Gateway 擁有的即時轉送工作階段發出的供應商工具呼叫。若最終結果稍後會送出，請傳入 `options: { willContinue: true }` 作為中途工具輸出；或在工具結果應滿足供應商呼叫且不啟動另一個即時助理回應時，傳入 `options: { suppressResponse: true }`。
    - `talk.session.close` 會關閉由 Gateway 擁有的轉送、轉錄或受管理房間工作階段，並發出終止 Talk 事件。
    - `talk.mode` 會為 WebChat／Control UI 用戶端設定／廣播目前的 Talk 模式狀態。
    - `talk.client.create` 會使用 `webrtc` 或 `provider-websocket` 建立由用戶端擁有的即時供應商工作階段，同時由 Gateway 擁有設定、憑證、指示和工具政策。
    - `talk.client.toolCall` 讓用戶端擁有的即時傳輸將供應商工具呼叫轉送到 Gateway 政策。第一個支援的工具是 `openclaw_agent_consult`；用戶端會收到執行 ID，並在提交供應商特定工具結果前等待一般聊天生命週期事件。
    - `talk.event` 是即時、轉錄、STT/TTS、受管理房間、電話語音和會議介面卡的單一 Talk 事件通道。
    - `talk.speak` 會透過作用中的 Talk 語音供應商合成語音。
    - `tts.status` 會傳回 TTS 啟用狀態、作用中供應商、備援供應商，以及供應商設定狀態。
    - `tts.providers` 會傳回可見的 TTS 供應商清單。
    - `tts.enable` 和 `tts.disable` 會切換 TTS 偏好設定狀態。
    - `tts.setProvider` 會更新偏好的 TTS 供應商。
    - `tts.convert` 會執行一次性文字轉語音轉換。

  </Accordion>

  <Accordion title="密鑰、設定、更新與精靈">
    - `secrets.reload` 會重新解析作用中的 SecretRefs，並且只有在完全成功時才替換執行階段密鑰狀態。
    - `secrets.resolve` 會為特定命令／目標集合解析命令目標密鑰指派。
    - `config.get` 會傳回目前的設定快照與雜湊。
    - `config.set` 會寫入已驗證的設定承載。
    - `config.patch` 會合併部分設定更新。
    - `config.apply` 會驗證並取代完整設定承載。
    - `config.schema` 會傳回 Control UI 和 CLI 工具使用的即時設定結構描述承載：結構描述、`uiHints`、版本與產生中繼資料，包括執行階段可載入時的 Plugin 與通道結構描述中繼資料。此結構描述包含欄位 `title`／`description` 中繼資料，來源與 UI 使用的標籤和說明文字相同；當存在相符的欄位文件時，也包含巢狀物件、萬用字元、陣列項目，以及 `anyOf`／`oneOf`／`allOf` 組合分支。
    - `config.schema.lookup` 會針對一個設定路徑傳回路徑範圍的查詢承載：標準化路徑、淺層結構描述節點、相符提示與 `hintPath`，以及供 UI/CLI 深入檢視的直接子項摘要。查詢結構描述節點會保留面向使用者的文件與常見驗證欄位（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、數值／字串／陣列／物件界限，以及 `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` 等旗標）。子項摘要會公開 `key`、標準化 `path`、`type`、`required`、`hasChildren`，以及相符的 `hint`／`hintPath`。
    - `update.run` 會執行 Gateway 更新流程，且只有在更新本身成功時才排程重新啟動；具有工作階段的呼叫端可以包含 `continuationMessage`，讓啟動在重新啟動接續佇列中恢復一個後續代理輪次。套件管理器更新會在套件替換後強制非延後、無冷卻時間的更新重新啟動，避免舊的 Gateway 程序繼續從已替換的 `dist` 樹延遲載入。
    - `update.status` 會傳回最新快取的更新重新啟動 sentinel，包括可用時重新啟動後的執行中版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 會透過 WS RPC 公開上手精靈。

  </Accordion>

  <Accordion title="代理與工作區輔助工具">
    - `agents.list` 會傳回已設定的代理項目，包括有效模型與執行階段中繼資料。
    - `agents.create`、`agents.update` 和 `agents.delete` 會管理代理記錄與工作區連接。
    - `agents.files.list`、`agents.files.get` 和 `agents.files.set` 會管理為代理公開的啟動工作區檔案。
    - `tasks.list`、`tasks.get` 和 `tasks.cancel` 會將 Gateway 任務帳本公開給 SDK 與操作者用戶端。
    - `artifacts.list`、`artifacts.get` 和 `artifacts.download` 會在明確的 `sessionKey`、`runId` 或 `taskId` 範圍中公開由逐字稿衍生的 artifact 摘要與下載。執行與任務查詢會在伺服器端解析所屬工作階段，且只傳回 provenance 相符的逐字稿媒體；不安全或本機 URL 來源會傳回不支援的下載，而不是在伺服器端擷取。
    - `environments.list` 和 `environments.status` 會為 SDK 用戶端公開唯讀的 Gateway 本機與節點環境探索。
    - `agent.identity.get` 會傳回代理或工作階段的有效助理身分。
    - `agent.wait` 會等待執行完成，並在可用時傳回終止快照。

  </Accordion>

  <Accordion title="工作階段控制">
    - `sessions.list` 會傳回目前的工作階段索引；當已設定代理執行階段後端時，會包含每列的 `agentRuntime` 中繼資料。
    - `sessions.subscribe` 和 `sessions.unsubscribe` 會為目前的 WS 用戶端切換工作階段變更事件訂閱。
    - `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 會為單一工作階段切換逐字稿／訊息事件訂閱。
    - `sessions.preview` 會傳回特定工作階段鍵的有界逐字稿預覽。
    - `sessions.describe` 會為精確工作階段鍵傳回一列 Gateway 工作階段。
    - `sessions.resolve` 會解析或標準化工作階段目標。
    - `sessions.create` 會建立新的工作階段項目。
    - `sessions.send` 會將訊息傳送到現有工作階段。
    - `sessions.steer` 是作用中工作階段的中斷並導向變體。
    - `sessions.abort` 會中止工作階段的作用中工作。呼叫端可以傳入 `key` 加上選用的 `runId`，或只針對 Gateway 可解析到工作階段的作用中執行傳入 `runId`。
    - `sessions.patch` 會更新工作階段中繼資料／覆寫，並回報已解析的標準模型加上有效的 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 和 `sessions.compact` 會執行工作階段維護。
    - `sessions.get` 會傳回完整已儲存的工作階段列。
    - 聊天執行仍使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。`chat.history` 會針對 UI 用戶端進行顯示標準化：從可見文字中移除行內指示標籤、純文字工具呼叫 XML 承載（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及截斷的工具呼叫區塊）和外洩的 ASCII／全形模型控制權杖，省略如精確 `NO_REPLY`／`no_reply` 這類純靜默權杖助理列，且過大的列可替換為佔位符。

  </Accordion>

  <Accordion title="裝置配對與裝置權杖">
    - `device.pair.list` 會傳回待處理與已核准的已配對裝置。
    - `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 會管理裝置配對記錄。
    - `device.token.rotate` 會在其已核准角色與呼叫端範圍界限內輪替已配對裝置權杖。
    - `device.token.revoke` 會在其已核准角色與呼叫端範圍界限內撤銷已配對裝置權杖。

  </Accordion>

  <Accordion title="節點配對、呼叫與待處理工作">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove` 和 `node.pair.verify` 涵蓋節點配對與啟動驗證。
    - `node.list` 和 `node.describe` 會傳回已知／已連線的節點狀態。
    - `node.rename` 會更新已配對節點標籤。
    - `node.invoke` 會將命令轉送到已連線節點。
    - `node.invoke.result` 會傳回呼叫請求的結果。
    - `node.event` 會將節點來源事件帶回 Gateway。
    - `node.pending.pull` 和 `node.pending.ack` 是已連線節點佇列 API。
    - `node.pending.enqueue` 和 `node.pending.drain` 會管理離線／已中斷連線節點的持久待處理工作。

  </Accordion>

  <Accordion title="核准類別">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 涵蓋一次性 exec 核准請求，以及待處理核准查詢/重播。
    - `exec.approval.waitDecision` 等待一個待處理 exec 核准，並回傳最終決策（逾時則為 `null`）。
    - `exec.approvals.get` 和 `exec.approvals.set` 管理 Gateway exec 核准政策快照。
    - `exec.approvals.node.get` 和 `exec.approvals.node.set` 透過節點中繼命令管理節點本機 exec 核准政策。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 涵蓋 Plugin 定義的核准流程。

  </Accordion>

  <Accordion title="自動化、Skills 和工具">
    - 自動化：`wake` 排程立即或下一次 Heartbeat 喚醒文字注入；`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 管理排程工作。
    - Skills 和工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 常見事件類別

- `chat`：UI 聊天更新，例如 `chat.inject` 和其他僅限文字記錄的聊天
  事件。
- `session.message` 和 `session.tool`：已訂閱工作階段的文字記錄/事件串流
  更新。
- `sessions.changed`：工作階段索引或中繼資料已變更。
- `presence`：系統存在狀態快照更新。
- `tick`：週期性 keepalive / 存活事件。
- `health`：Gateway 健康狀態快照更新。
- `heartbeat`：Heartbeat 事件串流更新。
- `cron`：Cron 執行/作業變更事件。
- `shutdown`：Gateway 關閉通知。
- `node.pair.requested` / `node.pair.resolved`：節點配對生命週期。
- `node.invoke.request`：節點 invoke 請求廣播。
- `device.pair.requested` / `device.pair.resolved`：已配對裝置生命週期。
- `voicewake.changed`：喚醒詞觸發設定已變更。
- `exec.approval.requested` / `exec.approval.resolved`：exec 核准
  生命週期。
- `plugin.approval.requested` / `plugin.approval.resolved`：Plugin 核准
  生命週期。

### 節點輔助方法

- 節點可以呼叫 `skills.bins`，擷取目前的 skill 可執行檔清單，
  用於自動允許檢查。

### 任務帳本 RPC

操作員用戶端可以透過任務帳本 RPC 檢查並取消 Gateway 背景任務記錄。
這些方法會回傳已清理的任務摘要，而不是原始執行階段狀態。

- `tasks.list` 需要 `operator.read`。
  - 參數：選用 `status`（`"queued"`、`"running"`、`"completed"`、
    `"failed"`、`"cancelled"` 或 `"timed_out"`）或這些狀態的陣列、
    選用 `agentId`、選用 `sessionKey`、選用 `limit`，範圍從 `1` 到
    `500`，以及選用字串 `cursor`。
  - 結果：`{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` 需要 `operator.read`。
  - 參數：`{ "taskId": string }`。
  - 結果：`{ "task": TaskSummary }`。
  - 缺少的任務 ID 會回傳 Gateway not-found 錯誤形狀。
- `tasks.cancel` 需要 `operator.write`。
  - 參數：`{ "taskId": string, "reason"?: string }`。
  - 結果：
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` 表示帳本是否有相符任務。`cancelled`
    表示執行階段是否接受或記錄了取消。

`TaskSummary` 包含 `id`、`status`，以及選用中繼資料，例如 `kind`、
`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、
`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、時間戳、進度、
終止摘要，以及已清理的錯誤文字。

### 操作員輔助方法

- 操作員可以呼叫 `commands.list`（`operator.read`），擷取代理程式的執行階段
  命令清單。
  - `agentId` 為選用；省略它即可讀取預設代理程式工作區。
  - `scope` 控制主要 `name` 所指向的介面：
    - `text` 回傳不含前導 `/` 的主要文字命令權杖
    - `native` 和預設的 `both` 路徑會在可用時回傳具 provider 感知的原生命名
  - `textAliases` 攜帶精確的斜線別名，例如 `/model` 和 `/m`。
  - `nativeName` 攜帶具 provider 感知的原生命令名稱（若存在）。
  - `provider` 為選用，且只影響原生命名與原生 Plugin
    命令可用性。
  - `includeArgs=false` 會從回應中省略序列化的引數中繼資料。
- 操作員可以呼叫 `tools.catalog`（`operator.read`），擷取代理程式的執行階段工具目錄。
  回應包含分組工具和來源中繼資料：
  - `source`：`core` 或 `plugin`
  - `pluginId`：當 `source="plugin"` 時的 Plugin 擁有者
  - `optional`：Plugin 工具是否為選用
- 操作員可以呼叫 `tools.effective`（`operator.read`），擷取工作階段的執行階段有效工具
  清單。
  - `sessionKey` 為必填。
  - Gateway 會從伺服器端工作階段推導受信任的執行階段內容，而不是接受
    呼叫端提供的 auth 或傳遞內容。
  - 回應限於工作階段範圍，並反映目前有效對話可以使用的內容，
    包括核心、Plugin 和通道工具。
- 操作員可以呼叫 `tools.invoke`（`operator.write`），透過與
  `/tools/invoke` 相同的 Gateway 政策路徑，叫用一個可用工具。
  - `name` 為必填。`args`、`sessionKey`、`agentId`、`confirm` 和
    `idempotencyKey` 為選用。
  - 如果同時存在 `sessionKey` 和 `agentId`，解析後的工作階段代理程式必須符合
    `agentId`。
  - 回應是面向 SDK 的信封，包含 `ok`、`toolName`、選用 `output`，以及具型別的
    `error` 欄位。核准或政策拒絕會在酬載中回傳 `ok:false`，而不是
    繞過 Gateway 工具政策管線。
- 操作員可以呼叫 `skills.status`（`operator.read`），擷取代理程式可見的
  skill 清單。
  - `agentId` 為選用；省略它即可讀取預設代理程式工作區。
  - 回應包含資格、缺少的需求、設定檢查，以及
    已清理的安裝選項，不會暴露原始密鑰值。
- 操作員可以呼叫 `skills.search` 和 `skills.detail`（`operator.read`），取得
  ClawHub 探索中繼資料。
- 操作員可以呼叫 `skills.upload.begin`、`skills.upload.chunk` 和
  `skills.upload.commit`（`operator.admin`），在安裝前暫存私人 skill 封存檔。
  這是供受信任用戶端使用的獨立管理員上傳路徑，
  不是一般 ClawHub skill 安裝流程，且預設停用，除非
  `skills.install.allowUploadedArchives` 已啟用。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    會建立一個綁定該 slug 和 force 值的上傳。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` 會在
    精確解碼偏移處附加位元組。
  - `skills.upload.commit({ uploadId, sha256? })` 會驗證最終大小和
    SHA-256。Commit 只會完成上傳；它不會安裝 skill。
  - 上傳的 skill 封存檔是包含 `SKILL.md` 根目錄的 zip 封存檔。
    封存檔內部目錄名稱絕不會選擇安裝目標。
- 操作員可以呼叫 `skills.install`（`operator.admin`），有三種模式：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 會將
    skill 資料夾安裝到預設代理程式工作區的 `skills/` 目錄。
  - 上傳模式：`{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    會將已提交的上傳安裝到預設代理程式工作區的 `skills/<slug>`
    目錄。slug 和 force 值必須符合原始的
    `skills.upload.begin` 請求。除非
    `skills.install.allowUploadedArchives` 已啟用，否則此模式會被拒絕。該設定不會
    影響 ClawHub 安裝。
  - Gateway 安裝器模式：`{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    會在 Gateway 主機上執行已宣告的 `metadata.openclaw.install` 動作。
- 操作員可以呼叫 `skills.update`（`operator.admin`），有兩種模式：
  - ClawHub 模式會更新預設代理程式工作區中一個已追蹤的 slug，或所有已追蹤的 ClawHub 安裝。
  - 設定模式會修補 `skills.entries.<skillKey>` 值，例如 `enabled`、
    `apiKey` 和 `env`。

### `models.list` 檢視

`models.list` 接受選用的 `view` 參數：

- 省略或 `"default"`：目前的執行階段行為。如果已設定 `agents.defaults.models`，回應會是允許目錄，包括為 `provider/*` 項目動態探索到的模型。否則回應會是完整的 Gateway 目錄。
- `"configured"`：適合選擇器大小的行為。如果已設定 `agents.defaults.models`，它仍會優先，包括針對 `provider/*` 項目的 provider 範圍探索。若沒有允許清單，回應會使用明確的 `models.providers.*.models` 項目，只有在沒有任何已設定模型列時，才會退回完整目錄。
- `"all"`：完整 Gateway 目錄，略過 `agents.defaults.models`。請將此用於診斷和探索 UI，而不是一般模型選擇器。

## Exec 核准

- 當 exec 請求需要核准時，Gateway 會廣播 `exec.approval.requested`。
- 操作員用戶端透過呼叫 `exec.approval.resolve` 解析（需要 `operator.approvals` 範圍）。
- 對於 `host=node`，`exec.approval.request` 必須包含 `systemRunPlan`（標準 `argv`/`cwd`/`rawCommand`/工作階段中繼資料）。缺少 `systemRunPlan` 的請求會被拒絕。
- 核准後，轉送的 `node.invoke system.run` 呼叫會重複使用該標準
  `systemRunPlan` 作為權威的命令/cwd/工作階段內容。
- 如果呼叫端在 prepare 和最終核准的 `system.run` 轉送之間變更 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，Gateway 會拒絕執行，而不是信任已變更的酬載。

## 代理程式傳遞後援

- `agent` 請求可以包含 `deliver=true` 以請求對外傳遞。
- `bestEffortDeliver=false` 保持嚴格行為：無法解析或僅限內部的傳遞目標會回傳 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允許在無法解析外部可傳遞路由時，後援為僅工作階段執行（例如內部/webchat 工作階段或模稜兩可的多通道設定）。
- 最終 `agent` 結果在請求傳遞時可能包含 `result.deliveryStatus`，
  使用與 [`openclaw agent --json --deliver`](/zh-TW/cli/agent#json-delivery-status) 所記錄相同的 `sent`、`suppressed`、`partial_failed` 和 `failed`
  狀態。

## 版本控管

- `PROTOCOL_VERSION` 位於 `src/gateway/protocol/version.ts`。
- 用戶端傳送 `minProtocol` + `maxProtocol`；伺服器會拒絕不相符的版本。
- Schemas + models 由 TypeBox 定義產生：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 用戶端常數

`src/gateway/client.ts` 中的參考用戶端使用這些預設值。這些值在
protocol v4 期間保持穩定，且是第三方用戶端預期的基準。

| 常數                                      | 預設值                                                | 來源                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| 請求逾時（每個 RPC）                      | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| 預先驗證 / 連線挑戰逾時                   | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（設定/env 可提高成對的伺服器/用戶端預算）              |
| 初始重新連線退避                          | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| 最大重新連線退避                          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| 裝置權杖關閉後的快速重試限制              | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前的強制停止寬限期          | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` 預設逾時                  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| 預設滴答間隔（`hello-ok` 前）             | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| 滴答逾時關閉                              | 靜默超過 `tickIntervalMs * 2` 時使用代碼 `4000`       | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

伺服器會在 `hello-ok` 中公告有效的 `policy.tickIntervalMs`、`policy.maxPayload`
和 `policy.maxBufferedBytes`；用戶端應遵循這些值，
而不是握手前的預設值。

## 驗證

- 共用密鑰 Gateway 驗證會使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，取決於設定的驗證模式。
- 帶有身分的模式，例如 Tailscale Serve
  (`gateway.auth.allowTailscale: true`) 或非迴路的
  `gateway.auth.mode: "trusted-proxy"`，會從請求標頭滿足連線驗證檢查，
  而不是使用 `connect.params.auth.*`。
- 私有入口 `gateway.auth.mode: "none"` 會完全略過共用密鑰連線驗證；
  請勿在公開/不受信任的入口公開該模式。
- 配對後，Gateway 會發出範圍限定為連線角色 + 範圍的**裝置權杖**。
  它會在 `hello-ok.auth.deviceToken` 中回傳，並應由用戶端持久保存，
  供未來連線使用。
- 用戶端應在任何成功連線後持久保存主要的 `hello-ok.auth.deviceToken`。
- 使用該**已儲存**的裝置權杖重新連線時，也應重用該權杖已儲存的核准範圍集合。
  這會保留已授予的讀取/探測/狀態存取權，並避免重新連線被靜默縮減為
  較窄的隱含僅管理員範圍。
- 用戶端連線驗證組裝（`src/gateway/client.ts` 中的 `selectConnectAuth`）：
  - `auth.password` 是正交的，且設定時一律轉送。
  - `auth.token` 會按優先順序填入：先是明確的共用權杖，
    接著是明確的 `deviceToken`，再來是已儲存的每裝置權杖
    （以 `deviceId` + `role` 為鍵）。
  - `auth.bootstrapToken` 只會在上述項目都沒有解析出
    `auth.token` 時傳送。共用權杖或任何已解析的裝置權杖都會抑制它。
  - 在一次性 `AUTH_TOKEN_MISMATCH` 重試中自動提升已儲存的裝置權杖，
    僅限於**受信任的端點**：迴路，或帶有釘選 `tlsFingerprint` 的 `wss://`。
    未釘選的公開 `wss://` 不符合資格。
- 額外的 `hello-ok.auth.deviceTokens` 項目是啟動交接權杖。
  只有在連線使用啟動驗證，且位於受信任的傳輸（例如 `wss://` 或迴路/本機配對）
  時，才持久保存它們。
- 如果用戶端提供**明確**的 `deviceToken` 或明確的 `scopes`，
  該呼叫者要求的範圍集合仍是權威；只有當用戶端重用已儲存的每裝置權杖時，
  才會重用快取的範圍。
- 裝置權杖可透過 `device.token.rotate` 和
  `device.token.revoke` 輪替/撤銷（需要 `operator.pairing` 範圍）。
- `device.token.rotate` 會回傳輪替中繼資料。它只會針對已使用該裝置權杖驗證的
  同裝置呼叫回顯替換用持有人權杖，因此僅權杖用戶端可在重新連線前持久保存替換權杖。
  共用/管理員輪替不會回顯持有人權杖。
- 權杖發行、輪替和撤銷都限制在該裝置配對項目中記錄的已核准角色集合內；
  權杖變更不能擴張或鎖定配對核准從未授予的裝置角色。
- 對於已配對裝置權杖工作階段，除非呼叫者也有 `operator.admin`，
  否則裝置管理是自我範圍限定的：非管理員呼叫者只能移除/撤銷/輪替
  **自己的**裝置項目。
- `device.token.rotate` 和 `device.token.revoke` 也會根據呼叫者目前的工作階段範圍，
  檢查目標操作者權杖範圍集合。非管理員呼叫者不能輪替或撤銷
  比自己已持有範圍更寬的操作者權杖。
- 驗證失敗會包含 `error.details.code` 以及復原提示：
  - `error.details.canRetryWithDeviceToken`（布林值）
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` 的用戶端行為：
  - 受信任的用戶端可嘗試一次有界限的重試，使用快取的每裝置權杖。
  - 如果該重試失敗，用戶端應停止自動重新連線迴圈，並顯示操作者動作指引。

## 裝置身分 + 配對

- 節點應包含由金鑰組指紋衍生的穩定裝置身分 (`device.id`)。
- Gateway 會按裝置 + 角色發出權杖。
- 除非已啟用本機自動核准，否則新的裝置 ID 需要配對核准。
- 配對自動核准以直接 local loopback 連線為中心。
- OpenClaw 也有一條狹窄的後端/容器本機自我連線路徑，
  用於受信任的共用密鑰輔助流程。
- 同主機 tailnet 或 LAN 連線仍會被視為遠端配對，且需要核准。
- WS 用戶端通常會在 `connect` 期間包含 `device` 身分（操作者 +
  節點）。唯一無裝置的操作者例外是明確信任路徑：
  - `gateway.controlUi.allowInsecureAuth=true`，用於僅限 localhost 的不安全 HTTP 相容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` 操作者 Control UI 驗證。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急破窗，嚴重安全降級）。
  - 以共用 Gateway 權杖/密碼驗證的直接迴路 `gateway-client` 後端 RPC。
- 所有連線都必須簽署伺服器提供的 `connect.challenge` nonce。

### 裝置驗證遷移診斷

對於仍使用挑戰前簽署行為的舊版用戶端，`connect` 現在會在 `error.details.code`
下回傳 `DEVICE_AUTH_*` 詳細代碼，並帶有穩定的 `error.details.reason`。

常見遷移失敗：

| 訊息                        | details.code                     | details.reason           | 意義                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 用戶端省略了 `device.nonce`（或送出空白）。        |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 用戶端使用過期/錯誤的 nonce 簽署。                |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 簽章酬載與 v2 酬載不符。                          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 已簽署時間戳超出允許偏差。                        |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 與公開金鑰指紋不符。                  |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開金鑰格式/正規化失敗。                         |

遷移目標：

- 一律等待 `connect.challenge`。
- 簽署包含伺服器 nonce 的 v2 酬載。
- 在 `connect.params.device.nonce` 中傳送相同的 nonce。
- 偏好的簽章酬載是 `v3`，除了裝置/用戶端/角色/範圍/權杖/nonce 欄位外，
  還會繫結 `platform` 和 `deviceFamily`。
- 舊版 `v2` 簽章仍會為了相容性而接受，但已配對裝置的
  中繼資料釘選仍會控制重新連線時的命令政策。

## TLS + 釘選

- WS 連線支援 TLS。
- 用戶端可選擇性釘選 Gateway 憑證指紋（請參閱 `gateway.tls`
  設定，以及 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`）。

## 範圍

此協定公開**完整 Gateway API**（狀態、頻道、模型、聊天、
代理、工作階段、節點、核准等）。確切表面由
`src/gateway/protocol/schema.ts` 中的 TypeBox 結構描述定義。

## 相關

- [橋接協定](/zh-TW/gateway/bridge-protocol)
- [Gateway 執行手冊](/zh-TW/gateway)
