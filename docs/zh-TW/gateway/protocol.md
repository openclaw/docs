---
read_when:
    - 實作或更新 Gateway WS 用戶端
    - 偵錯通訊協定不相符或連線失敗
    - 重新產生通訊協定結構描述/模型
summary: Gateway WebSocket 通訊協定：握手、訊框、版本化
title: Gateway 通訊協定
x-i18n:
    generated_at: "2026-05-06T02:48:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a5eb7a84dbe0664fd78271408686a643dbc0579de5b5402fd1a8d33fd59221d
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS 協定是 OpenClaw 的**單一控制平面 + 節點傳輸**。所有用戶端（CLI、網頁 UI、macOS 應用程式、iOS/Android 節點、無頭節點）都透過 WebSocket 連線，並在握手時宣告其**角色** + **範圍**。

## 傳輸

- WebSocket，文字框架搭配 JSON 酬載。
- 第一個框架**必須**是 `connect` 請求。
- 連線前框架限制為 64 KiB。成功握手後，用戶端應遵循 `hello-ok.policy.maxPayload` 和 `hello-ok.policy.maxBufferedBytes` 限制。啟用診斷時，過大的傳入框架和緩慢的傳出緩衝區會在 gateway 關閉或丟棄受影響的框架前發出 `payload.large` 事件。這些事件會保留大小、限制、表面和安全原因代碼。它們不會保留訊息本文、附件內容、原始框架本文、權杖、Cookie 或秘密值。

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
    "maxProtocol": 3,
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
    "protocol": 3,
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

當 Gateway 仍在完成啟動 sidecar 時，`connect` 請求可能會回傳可重試的 `UNAVAILABLE` 錯誤，且 `details.reason` 設為 `"startup-sidecars"` 並包含 `retryAfterMs`。用戶端應在其整體連線預算內重試該回應，而不是將其呈現為終止性的握手失敗。

`server`、`features`、`snapshot` 和 `policy` 都是 schema（`src/gateway/protocol/schema/frames.ts`）要求的欄位。`auth` 也是必要欄位，並回報協商後的角色/範圍。`canvasHostUrl` 是選用欄位。

未核發裝置權杖時，`hello-ok.auth` 會回報協商後的權限，且不含權杖欄位：

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

受信任的同程序後端用戶端（`client.id: "gateway-client"`、`client.mode: "backend"`）在直接 loopback 連線上以共用 gateway 權杖/密碼驗證時，可以省略 `device`。此路徑保留給內部控制平面 RPC，並避免過時的 CLI/裝置配對基準阻擋本機後端工作，例如子代理程式工作階段更新。遠端用戶端、瀏覽器來源用戶端、節點用戶端，以及明確的裝置權杖/裝置身分用戶端，仍使用一般的配對與範圍升級檢查。

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

在受信任的啟動交接期間，`hello-ok.auth` 也可能在 `deviceTokens` 中包含其他有界角色項目：

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

對於內建的節點/operator 啟動流程，主要節點權杖會維持 `scopes: []`，任何交接的 operator 權杖都會被限制在啟動 operator 允許清單內（`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`）。啟動範圍檢查仍保持角色前綴：operator 項目只滿足 operator 請求，而非 operator 角色仍需要其自身角色前綴下的範圍。

### 節點範例

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
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

## 框架

- **請求**：`{type:"req", id, method, params}`
- **回應**：`{type:"res", id, ok, payload|error}`
- **事件**：`{type:"event", event, payload, seq?, stateVersion?}`

具有副作用的方法需要**冪等性金鑰**（請參閱 schema）。

## 角色 + 範圍

如需完整的 operator 範圍模型、核准時檢查和共用秘密語義，請參閱 [Operator 範圍](/zh-TW/gateway/operator-scopes)。

### 角色

- `operator` = 控制平面用戶端（CLI/UI/自動化）。
- `node` = 能力主機（camera/screen/canvas/system.run）。

### 範圍 (operator)

常見範圍：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` 搭配 `includeSecrets: true` 需要 `operator.talk.secrets`（或 `operator.admin`）。

Plugin 註冊的 gateway RPC 方法可以要求自己的 operator 範圍，但保留的核心管理前綴（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）一律解析為 `operator.admin`。

方法範圍只是第一道閘門。透過 `chat.send` 觸及的某些斜線命令會在其上套用更嚴格的命令層級檢查。例如，持久化的 `/config set` 和 `/config unset` 寫入需要 `operator.admin`。

`node.pair.approve` 也會在基礎方法範圍之外，額外執行核准時範圍檢查：

- 無命令請求：`operator.pairing`
- 含非 exec 節點命令的請求：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的請求：`operator.pairing` + `operator.admin`

### 能力/命令/權限（節點）

節點在連線時宣告能力主張：

- `caps`：高階能力類別，例如 `camera`、`canvas`、`screen`、`location`、`voice` 和 `talk`。
- `commands`：用於 invoke 的命令允許清單。
- `permissions`：細粒度切換（例如 `screen.record`、`camera.capture`）。

Gateway 會將這些視為**主張**，並強制執行伺服器端允許清單。

## Presence

- `system-presence` 會回傳以裝置身分為鍵的項目。
- Presence 項目包含 `deviceId`、`roles` 和 `scopes`，因此 UI 可以為每個裝置顯示單一列，即使該裝置同時以 **operator** 和 **node** 連線。
- `node.list` 包含選用的 `lastSeenAtMs` 和 `lastSeenReason` 欄位。已連線節點會以原因 `connect` 將目前連線時間回報為 `lastSeenAtMs`；當受信任的節點事件更新其配對中繼資料時，已配對節點也可以回報持久的背景 Presence。

### 節點背景存活事件

節點可以呼叫 `node.event`，並帶有 `event: "node.presence.alive"`，以記錄已配對節點在背景喚醒期間仍存活，而不將其標記為已連線。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是封閉列舉：`background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual` 或 `connect`。未知的 trigger 字串會在持久化前由 gateway 正規化為 `background`。此事件只會對已驗證的節點裝置工作階段持久化；無裝置或未配對的工作階段會回傳 `handled: false`。

成功的 gateway 會回傳結構化結果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

較舊的 gateway 對 `node.event` 可能仍會回傳 `{ "ok": true }`；用戶端應將其視為已確認的 RPC，而非持久 Presence 保存。

## 廣播事件範圍控管

伺服器推送的 WebSocket 廣播事件會受到範圍控管，因此配對範圍或僅節點的工作階段不會被動接收工作階段內容。

- **聊天、代理程式和工具結果框架**（包括串流的 `agent` 事件和工具呼叫結果）至少需要 `operator.read`。沒有 `operator.read` 的工作階段會完全略過這些框架。
- **Plugin 定義的 `plugin.*` 廣播**會依 Plugin 註冊方式，受 `operator.write` 或 `operator.admin` 控管。
- **狀態與傳輸事件**（`heartbeat`、`presence`、`tick`、連線/中斷連線生命週期等）維持不受限制，因此每個已驗證的工作階段都能觀察傳輸健康狀態。
- **未知的廣播事件系列**預設會受到範圍控管（失敗關閉），除非已註冊的處理常式明確放寬限制。

每個用戶端連線都保留自己的逐用戶端序號，因此即使不同用戶端看到事件串流中不同的範圍過濾子集，廣播仍會在該 socket 上保留單調排序。

## 常見 RPC 方法系列

公開 WS 表面比上述握手/驗證範例更廣。這不是產生的傾印 — `hello-ok.features.methods` 是由 `src/gateway/server-methods-list.ts` 加上已載入的 Plugin/channel 方法匯出所建構的保守探索清單。請將其視為功能探索，而不是 `src/gateway/server-methods/*.ts` 的完整列舉。

<AccordionGroup>
  <Accordion title="系統與身分">
    - `health` 會回傳快取或新探測的 gateway 健康快照。
    - `diagnostics.stability` 會回傳最近的有界診斷穩定性記錄器。它會保留操作中繼資料，例如事件名稱、計數、位元組大小、記憶體讀數、佇列/工作階段狀態、channel/Plugin 名稱和工作階段 id。它不會保留聊天文字、webhook 本文、工具輸出、原始請求或回應本文、權杖、Cookie 或秘密值。需要 operator 讀取範圍。
    - `status` 會回傳 `/status` 樣式的 gateway 摘要；敏感欄位只會包含給具備管理範圍的 operator 用戶端。
    - `gateway.identity.get` 會回傳 relay 和配對流程使用的 gateway 裝置身分。
    - `system-presence` 會回傳已連線 operator/節點裝置的目前 Presence 快照。
    - `system-event` 會附加系統事件，並可更新/廣播 Presence 內容。
    - `last-heartbeat` 會回傳最新持久化的 Heartbeat 事件。
    - `set-heartbeats` 會切換 gateway 上的 Heartbeat 處理。

  </Accordion>

  <Accordion title="模型與用量">
    - `models.list` 會傳回執行階段允許的模型目錄。傳入 `{ "view": "configured" }` 可取得適合選擇器顯示的已設定模型（先是 `agents.defaults.models`，再是 `models.providers.*.models`），或傳入 `{ "view": "all" }` 取得完整目錄。
    - `usage.status` 會傳回供應商用量時段/剩餘配額摘要。
    - `usage.cost` 會傳回日期範圍內的彙總成本用量摘要。
    - `doctor.memory.status` 會傳回作用中預設代理工作區的向量記憶體 / 快取嵌入準備狀態。只有在呼叫端明確想要即時嵌入供應商 ping 時，才傳入 `{ "probe": true }` 或 `{ "deep": true }`。
    - `doctor.memory.remHarness` 會為遠端控制平面用戶端傳回有界、唯讀的 REM harness 預覽。它可包含工作區路徑、記憶體片段、已算繪的 grounded markdown，以及深度提升候選項目，因此呼叫端需要 `operator.read`。
    - `sessions.usage` 會傳回各工作階段的用量摘要。
    - `sessions.usage.timeseries` 會傳回單一工作階段的時間序列用量。
    - `sessions.usage.logs` 會傳回單一工作階段的用量記錄項目。

  </Accordion>

  <Accordion title="頻道與登入輔助工具">
    - `channels.status` 會傳回內建 + 隨附頻道/Plugin 狀態摘要。
    - `channels.logout` 會在頻道支援登出時，登出特定頻道/帳號。
    - `web.login.start` 會為目前具 QR 功能的網頁頻道供應商啟動 QR/網頁登入流程。
    - `web.login.wait` 會等待該 QR/網頁登入流程完成，並在成功時啟動頻道。
    - `push.test` 會向已註冊的 iOS 節點傳送測試 APNs 推播。
    - `voicewake.get` 會傳回已儲存的喚醒詞觸發器。
    - `voicewake.set` 會更新喚醒詞觸發器並廣播變更。

  </Accordion>

  <Accordion title="訊息與記錄">
    - `send` 是用於聊天執行器外、依頻道/帳號/對話串目標傳送的直接對外遞送 RPC。
    - `logs.tail` 會傳回已設定的 gateway 檔案記錄尾端，並支援游標/限制與最大位元組控制。

  </Accordion>

  <Accordion title="Talk 與 TTS">
    - `talk.catalog` 會傳回語音、串流轉錄與即時語音的唯讀 Talk 供應商目錄。它包含供應商 ID、標籤、設定狀態、公開的模型/語音 ID、標準模式、傳輸、brain 策略，以及即時音訊/功能旗標，且不會傳回供應商祕密或變更全域設定。
    - `talk.config` 會傳回有效的 Talk 設定 payload；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.session.create` 會建立由 Gateway 擁有的 Talk 工作階段，用於 `realtime/gateway-relay`、`transcription/gateway-relay` 或 `stt-tts/managed-room`。`brain: "direct-tools"` 需要 `operator.admin`。
    - `talk.session.join` 會驗證 managed-room 工作階段權杖，視需要發出 `session.ready` 或 `session.replaced` 事件，並傳回房間/工作階段中繼資料加上近期 Talk 事件，不包含純文字權杖或已儲存的權杖雜湊。
    - `talk.session.appendAudio` 會將 base64 PCM 輸入音訊附加到 Gateway 擁有的即時中繼與轉錄工作階段。
    - `talk.session.startTurn`、`talk.session.endTurn` 和 `talk.session.cancelTurn` 會驅動 managed-room 回合生命週期，並在狀態清除前拒絕過期回合。
    - `talk.session.cancelOutput` 會停止助理音訊輸出，主要用於 Gateway 中繼工作階段中由 VAD 閘控的插話。
    - `talk.session.submitToolResult` 會完成由 Gateway 擁有的即時中繼工作階段發出的供應商工具呼叫。
    - `talk.session.close` 會關閉由 Gateway 擁有的中繼、轉錄或 managed-room 工作階段，並發出終止 Talk 事件。
    - `talk.mode` 會設定/廣播 WebChat/Control UI 用戶端目前的 Talk 模式狀態。
    - `talk.client.create` 會使用 `webrtc` 或 `provider-websocket` 建立由用戶端擁有的即時供應商工作階段，同時由 Gateway 擁有設定、認證、指示與工具政策。
    - `talk.client.toolCall` 允許用戶端擁有的即時傳輸將供應商工具呼叫轉送至 Gateway 政策。第一個受支援的工具是 `openclaw_agent_consult`；用戶端會收到執行 ID，並在提交供應商特定工具結果前等待一般聊天生命週期事件。
    - `talk.event` 是即時、轉錄、STT/TTS、managed-room、電話語音與會議配接器的單一 Talk 事件頻道。
    - `talk.speak` 會透過作用中的 Talk 語音供應商合成語音。
    - `tts.status` 會傳回 TTS 啟用狀態、作用中供應商、備援供應商與供應商設定狀態。
    - `tts.providers` 會傳回可見的 TTS 供應商清單。
    - `tts.enable` 和 `tts.disable` 會切換 TTS 偏好設定狀態。
    - `tts.setProvider` 會更新偏好的 TTS 供應商。
    - `tts.convert` 會執行一次性文字轉語音轉換。

  </Accordion>

  <Accordion title="祕密、設定、更新與精靈">
    - `secrets.reload` 會重新解析作用中的 SecretRefs，並且只有在完全成功時才交換執行階段祕密狀態。
    - `secrets.resolve` 會解析特定命令/目標集合的命令目標祕密指派。
    - `config.get` 會傳回目前的設定快照與雜湊。
    - `config.set` 會寫入已驗證的設定 payload。
    - `config.patch` 會合併部分設定更新。
    - `config.apply` 會驗證 + 取代完整設定 payload。
    - `config.schema` 會傳回 Control UI 與 CLI 工具使用的即時設定結構描述 payload：結構描述、`uiHints`、版本與產生中繼資料；當執行階段可載入時，也包含 Plugin + 頻道結構描述中繼資料。此結構描述包含欄位 `title` / `description` 中繼資料，衍生自 UI 使用的相同標籤與說明文字，並在存在相符欄位文件時，包含巢狀物件、萬用字元、陣列項目，以及 `anyOf` / `oneOf` / `allOf` 組合分支。
    - `config.schema.lookup` 會針對單一設定路徑傳回路徑範圍查詢 payload：正規化路徑、淺層結構描述節點、相符提示 + `hintPath`，以及供 UI/CLI 向下鑽研的直接子項摘要。查詢結構描述節點會保留面向使用者的文件與常見驗證欄位（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、數值/字串/陣列/物件界限，以及 `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` 等旗標）。子項摘要會公開 `key`、正規化 `path`、`type`、`required`、`hasChildren`，加上相符的 `hint` / `hintPath`。
    - `update.run` 會執行 gateway 更新流程，且只有在更新本身成功時才排程重新啟動；有工作階段的呼叫端可包含 `continuationMessage`，讓啟動時透過重新啟動延續佇列恢復一次後續代理回合。套件管理器更新會在套件替換後強制進行非延後、無冷卻時間的更新重新啟動，避免舊 Gateway 程序持續從已替換的 `dist` 樹延遲載入。
    - `update.status` 會傳回最新的快取更新重新啟動哨兵，包含可用時重新啟動後的執行版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 會透過 WS RPC 公開上線精靈。

  </Accordion>

  <Accordion title="代理與工作區輔助工具">
    - `agents.list` 會傳回已設定的代理項目，包含有效模型與執行階段中繼資料。
    - `agents.create`、`agents.update` 和 `agents.delete` 會管理代理記錄與工作區連接。
    - `agents.files.list`、`agents.files.get` 和 `agents.files.set` 會管理為代理公開的啟動工作區檔案。
    - `artifacts.list`、`artifacts.get` 和 `artifacts.download` 會針對明確的 `sessionKey`、`runId` 或 `taskId` 範圍，公開由逐字稿衍生的成品摘要與下載。執行與任務查詢會在伺服器端解析所屬工作階段，且只傳回來源相符的逐字稿媒體；不安全或本機 URL 來源會傳回不支援的下載，而不是在伺服器端擷取。
    - `environments.list` 和 `environments.status` 會為 SDK 用戶端公開唯讀的 Gateway 本機與節點環境探索。
    - `agent.identity.get` 會傳回代理或工作階段的有效助理身分。
    - `agent.wait` 會等待執行完成，並在可用時傳回終止快照。

  </Accordion>

  <Accordion title="工作階段控制">
    - `sessions.list` 會傳回目前的工作階段索引，當設定了代理執行階段後端時，包含每列的 `agentRuntime` 中繼資料。
    - `sessions.subscribe` 和 `sessions.unsubscribe` 會為目前的 WS 用戶端切換工作階段變更事件訂閱。
    - `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 會為單一工作階段切換逐字稿/訊息事件訂閱。
    - `sessions.preview` 會傳回特定工作階段鍵的有界逐字稿預覽。
    - `sessions.describe` 會針對精確的工作階段鍵傳回一列 Gateway 工作階段。
    - `sessions.resolve` 會解析或標準化工作階段目標。
    - `sessions.create` 會建立新的工作階段項目。
    - `sessions.send` 會將訊息傳送到既有工作階段。
    - `sessions.steer` 是作用中工作階段的中斷並引導變體。
    - `sessions.abort` 會中止工作階段的作用中工作。呼叫端可傳入 `key` 加上選用的 `runId`，或對於 Gateway 可解析至工作階段的作用中執行，僅傳入 `runId`。
    - `sessions.patch` 會更新工作階段中繼資料/覆寫，並回報已解析的標準模型加上有效的 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 和 `sessions.compact` 會執行工作階段維護。
    - `sessions.get` 會傳回完整的已儲存工作階段列。
    - 聊天執行仍使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。`chat.history` 會為 UI 用戶端進行顯示正規化：從可見文字移除內嵌指示標籤，移除純文字工具呼叫 XML payload（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 與遭截斷的工具呼叫區塊）以及洩漏的 ASCII/全形模型控制權杖，省略純靜默權杖助理列，例如精確的 `NO_REPLY` / `no_reply`，且過大的列可替換為預留位置。

  </Accordion>

  <Accordion title="裝置配對與裝置權杖">
    - `device.pair.list` 會傳回待處理與已核准的已配對裝置。
    - `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 會管理裝置配對記錄。
    - `device.token.rotate` 會在已核准角色與呼叫端範圍界限內輪替已配對裝置權杖。
    - `device.token.revoke` 會在已核准角色與呼叫端範圍界限內撤銷已配對裝置權杖。

  </Accordion>

  <Accordion title="Node 配對、叫用與待處理工作">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove` 和 `node.pair.verify` 涵蓋 Node 配對與啟動驗證。
    - `node.list` 和 `node.describe` 會傳回已知/已連線的 Node 狀態。
    - `node.rename` 會更新已配對的 Node 標籤。
    - `node.invoke` 會將命令轉送至已連線的 Node。
    - `node.invoke.result` 會傳回叫用要求的結果。
    - `node.event` 會將 Node 發出的事件帶回 gateway。
    - `node.canvas.capability.refresh` 會重新整理範圍限定的 canvas 功能權杖。
    - `node.pending.pull` 和 `node.pending.ack` 是已連線 Node 佇列 API。
    - `node.pending.enqueue` 和 `node.pending.drain` 會管理離線/已中斷連線 Node 的持久待處理工作。

  </Accordion>

  <Accordion title="核准系列">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 涵蓋一次性 exec 核准請求，以及待處理核准的查詢/重播。
    - `exec.approval.waitDecision` 會等待一個待處理的 exec 核准，並回傳最終決定（逾時時為 `null`）。
    - `exec.approvals.get` 和 `exec.approvals.set` 管理 Gateway exec 核准政策快照。
    - `exec.approvals.node.get` 和 `exec.approvals.node.set` 透過 Node relay 命令管理 Node 本機的 exec 核准政策。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 涵蓋 Plugin 定義的核准流程。

  </Accordion>

  <Accordion title="自動化、Skills 和工具">
    - 自動化：`wake` 排程立即或下一次 Heartbeat 的喚醒文字注入；`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 管理已排程的工作。
    - Skills 和工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 常見事件系列

- `chat`：UI 聊天更新，例如 `chat.inject` 和其他僅限轉錄稿的聊天
  事件。
- `session.message` 和 `session.tool`：已訂閱工作階段的轉錄稿/事件串流更新。
- `sessions.changed`：工作階段索引或中繼資料已變更。
- `presence`：系統存在狀態快照更新。
- `tick`：定期 keepalive / 存活事件。
- `health`：Gateway 健康狀態快照更新。
- `heartbeat`：Heartbeat 事件串流更新。
- `cron`：Cron 執行/工作變更事件。
- `shutdown`：Gateway 關閉通知。
- `node.pair.requested` / `node.pair.resolved`：Node 配對生命週期。
- `node.invoke.request`：Node invoke 請求廣播。
- `device.pair.requested` / `device.pair.resolved`：已配對裝置生命週期。
- `voicewake.changed`：喚醒詞觸發設定已變更。
- `exec.approval.requested` / `exec.approval.resolved`：exec 核准
  生命週期。
- `plugin.approval.requested` / `plugin.approval.resolved`：Plugin 核准
  生命週期。

### Node 輔助方法

- Node 可以呼叫 `skills.bins`，以擷取目前的技能可執行檔清單
  供自動允許檢查使用。

### 操作者輔助方法

- 操作者可以呼叫 `commands.list`（`operator.read`），以擷取代理程式的執行階段
  命令清單。
  - `agentId` 是選用項；省略它即可讀取預設代理程式工作區。
  - `scope` 控制主要 `name` 目標所屬的介面：
    - `text` 回傳不含前置 `/` 的主要文字命令權杖
    - `native` 和預設的 `both` 路徑會在可用時回傳具提供者感知能力的原生命名
  - `textAliases` 承載精確的斜線別名，例如 `/model` 和 `/m`。
  - `nativeName` 承載具提供者感知能力的原生命令名稱（如果存在）。
  - `provider` 是選用項，且只會影響原生命名加上原生 Plugin
    命令可用性。
  - `includeArgs=false` 會從回應中省略序列化的引數中繼資料。
- 操作者可以呼叫 `tools.catalog`（`operator.read`），以擷取代理程式的執行階段工具目錄。回應包含分組工具和來源中繼資料：
  - `source`：`core` 或 `plugin`
  - `pluginId`：當 `source="plugin"` 時的 Plugin 擁有者
  - `optional`：Plugin 工具是否為選用
- 操作者可以呼叫 `tools.effective`（`operator.read`），以擷取工作階段在執行階段實際可用的工具
  清單。
  - `sessionKey` 為必填。
  - Gateway 會從伺服器端工作階段推導可信的執行階段脈絡，而不是接受
    呼叫端提供的驗證或遞送脈絡。
  - 回應限定於工作階段範圍，並反映目前作用中對話現在可使用的項目，
    包含核心、Plugin 和頻道工具。
- 操作者可以呼叫 `tools.invoke`（`operator.write`），透過與
  `/tools/invoke` 相同的 Gateway 政策路徑呼叫一個可用工具。
  - `name` 為必填。`args`、`sessionKey`、`agentId`、`confirm` 和
    `idempotencyKey` 為選用。
  - 如果 `sessionKey` 和 `agentId` 同時存在，解析後的工作階段代理程式必須符合
    `agentId`。
  - 回應是面向 SDK 的封套，包含 `ok`、`toolName`、選用的 `output`，以及具型別的
    `error` 欄位。核准或政策拒絕會在酬載中回傳 `ok:false`，而不是
    繞過 Gateway 工具政策管線。
- 操作者可以呼叫 `skills.status`（`operator.read`），以擷取代理程式的可見
  技能清單。
  - `agentId` 是選用項；省略它即可讀取預設代理程式工作區。
  - 回應包含資格、缺少的需求、設定檢查，以及
    經清理的安裝選項，且不會暴露原始秘密值。
- 操作者可以呼叫 `skills.search` 和 `skills.detail`（`operator.read`）以取得
  ClawHub 探索中繼資料。
- 操作者可以用兩種模式呼叫 `skills.install`（`operator.admin`）：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 會將
    技能資料夾安裝到預設代理程式工作區的 `skills/` 目錄。
  - Gateway 安裝程式模式：`{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    會在 Gateway 主機上執行宣告的 `metadata.openclaw.install` 動作。
- 操作者可以用兩種模式呼叫 `skills.update`（`operator.admin`）：
  - ClawHub 模式會更新一個已追蹤的 slug，或預設代理程式工作區中所有已追蹤的 ClawHub 安裝。
  - 設定模式會修補 `skills.entries.<skillKey>` 值，例如 `enabled`、
    `apiKey` 和 `env`。

### `models.list` 檢視

`models.list` 接受選用的 `view` 參數：

- 省略或 `"default"`：目前的執行階段行為。如果已設定 `agents.defaults.models`，回應會是允許的目錄；否則回應會是完整的 Gateway 目錄。
- `"configured"`：適合選擇器大小的行為。如果已設定 `agents.defaults.models`，它仍會優先。否則回應會使用明確的 `models.providers.*.models` 項目，只有在沒有已設定模型列時才退回完整目錄。
- `"all"`：完整 Gateway 目錄，繞過 `agents.defaults.models`。這適用於診斷和探索 UI，不適合一般模型選擇器。

## Exec 核准

- 當 exec 請求需要核准時，Gateway 會廣播 `exec.approval.requested`。
- 操作者用戶端透過呼叫 `exec.approval.resolve` 解析（需要 `operator.approvals` 範圍）。
- 對於 `host=node`，`exec.approval.request` 必須包含 `systemRunPlan`（標準 `argv`/`cwd`/`rawCommand`/工作階段中繼資料）。缺少 `systemRunPlan` 的請求會被拒絕。
- 核准後，轉送的 `node.invoke system.run` 呼叫會重用該標準
  `systemRunPlan`，作為權威的命令/cwd/工作階段脈絡。
- 如果呼叫端在準備與最終核准的 `system.run` 轉送之間變更 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，Gateway 會拒絕執行，而不是信任已變更的酬載。

## 代理程式遞送後援

- `agent` 請求可以包含 `deliver=true` 以請求對外遞送。
- `bestEffortDeliver=false` 會維持嚴格行為：無法解析或僅限內部的遞送目標會回傳 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允許在無法解析外部可遞送路由時，後援為僅限工作階段的執行（例如內部/webchat 工作階段或模糊的多頻道設定）。

## 版本控管

- `PROTOCOL_VERSION` 位於 `src/gateway/protocol/schema/protocol-schemas.ts`。
- 用戶端傳送 `minProtocol` + `maxProtocol`；伺服器會拒絕不相符的版本。
- Schema + 模型由 TypeBox 定義產生：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 用戶端常數

`src/gateway/client.ts` 中的參考用戶端使用這些預設值。這些值在 protocol v3 中
保持穩定，也是第三方用戶端的預期基準。

| 常數                                      | 預設值                                                | 來源                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| 請求逾時（每個 RPC）                      | `30_000` ms                                           | `src/gateway/client.ts`（`requestTimeoutMs`）                                              |
| 預先驗證 / 連線挑戰逾時                   | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（設定/env 可提高已配對伺服器/用戶端預算）             |
| 初始重新連線 backoff                      | `1_000` ms                                            | `src/gateway/client.ts`（`backoffMs`）                                                     |
| 最大重新連線 backoff                      | `30_000` ms                                           | `src/gateway/client.ts`（`scheduleReconnect`）                                             |
| 裝置權杖關閉後的快速重試限制              | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前的強制停止寬限            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` 預設逾時                  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| 預設 tick 間隔（`hello-ok` 前）            | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick 逾時關閉                             | 當靜默超過 `tickIntervalMs * 2` 時使用 code `4000`    | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024`（25 MB）                           | `src/gateway/server-constants.ts`                                                          |

伺服器會在 `hello-ok` 中通告有效的 `policy.tickIntervalMs`、`policy.maxPayload`
和 `policy.maxBufferedBytes`；用戶端應遵循這些值，
而不是握手前的預設值。

## 驗證

- 共享祕密 Gateway 驗證會使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，取決於已設定的驗證模式。
- 具身分資訊的模式，例如 Tailscale Serve
  (`gateway.auth.allowTailscale: true`) 或非 loopback
  `gateway.auth.mode: "trusted-proxy"`，會從請求標頭滿足 connect 驗證檢查，
  而不是使用 `connect.params.auth.*`。
- 私有入口 `gateway.auth.mode: "none"` 會完全略過共享祕密 connect 驗證；
  請勿在公開或不受信任的入口暴露此模式。
- 配對後，Gateway 會核發一個限定於連線角色 + scope 的**裝置 token**。
  它會在 `hello-ok.auth.deviceToken` 中傳回，且客戶端應將其持久保存以供日後連線使用。
- 客戶端應在任何成功連線後持久保存主要的 `hello-ok.auth.deviceToken`。
- 使用該**已儲存**裝置 token 重新連線時，也應重用為該 token 儲存的
  已核准 scope 集。這會保留先前已授予的讀取、探測、狀態存取權，
  並避免重新連線時靜默收窄成只含隱含 admin 的 scope。
- 客戶端 connect 驗證組裝（`src/gateway/client.ts` 中的 `selectConnectAuth`）：
  - `auth.password` 是正交的，只要有設定就一律轉送。
  - `auth.token` 會依優先順序填入：先使用明確的共享 token，
    接著是明確的 `deviceToken`，再來是已儲存的每裝置 token（以
    `deviceId` + `role` 作為 key）。
  - `auth.bootstrapToken` 只會在上述項目都未解析出
    `auth.token` 時傳送。共享 token 或任何已解析的裝置 token 都會抑制它。
  - 在一次性的 `AUTH_TOKEN_MISMATCH` 重試中，自動提升已儲存裝置 token
    僅限於**受信任端點**：loopback，或搭配固定 `tlsFingerprint` 的
    `wss://`。未固定指紋的公開 `wss://` 不符合資格。
- 額外的 `hello-ok.auth.deviceTokens` 項目是 bootstrap 交接 token。
  只有在 connect 使用 bootstrap 驗證，且位於受信任傳輸（例如
  `wss://` 或 loopback/local 配對）上時，才持久保存它們。
- 如果客戶端提供**明確**的 `deviceToken` 或明確的 `scopes`，
  該呼叫端要求的 scope 集仍具權威性；只有當客戶端重用已儲存的每裝置 token 時，
  才會重用快取 scope。
- 裝置 token 可透過 `device.token.rotate` 和
  `device.token.revoke` 輪替/撤銷（需要 `operator.pairing` scope）。
- `device.token.rotate` 會傳回輪替中繼資料。只有在同一裝置呼叫，
  且已使用該裝置 token 完成驗證時，才會回傳替換用 bearer token，
  因此只使用 token 的客戶端可在重新連線前持久保存替換 token。
  共享/admin 輪替不會回傳 bearer token。
- Token 核發、輪替與撤銷都會限制在該裝置配對項目中記錄的已核准角色集內；
  token 變更無法擴展或鎖定配對核准從未授予的裝置角色。
- 對於已配對裝置 token 工作階段，除非呼叫端也具有 `operator.admin`，
  否則裝置管理會限定於自身範圍：非 admin 呼叫端只能移除/撤銷/輪替
  **自己的**裝置項目。
- `device.token.rotate` 和 `device.token.revoke` 也會檢查目標 operator
  token scope 集是否符合呼叫端目前的工作階段 scope。非 admin 呼叫端無法輪替或撤銷
  比自身已持有權限更廣的 operator token。
- 驗證失敗會包含 `error.details.code` 以及復原提示：
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` 的客戶端行為：
  - 受信任客戶端可以嘗試一次受限重試，使用快取的每裝置 token。
  - 如果該重試失敗，客戶端應停止自動重新連線迴圈，並顯示操作員行動指引。

## 裝置身分 + 配對

- 節點應包含穩定的裝置身分（`device.id`），由 keypair 指紋衍生。
- Gateway 會依裝置 + 角色核發 token。
- 除非已啟用本機自動核准，否則新的裝置 ID 需要配對核准。
- 配對自動核准以直接 local loopback 連線為中心。
- OpenClaw 也有一條狹窄的後端/容器本機自我連線路徑，用於受信任的共享祕密輔助流程。
- 同主機 tailnet 或 LAN 連線在配對上仍視為遠端，並需要核准。
- WS 客戶端通常會在 `connect` 期間包含 `device` 身分（operator +
  node）。唯一不需要裝置的 operator 例外是明確的信任路徑：
  - `gateway.controlUi.allowInsecureAuth=true`，用於僅限 localhost 的不安全 HTTP 相容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` operator Control UI 驗證。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急破窗，嚴重降低安全性）。
  - 使用共享 gateway token/password 完成驗證的 direct-loopback
    `gateway-client` 後端 RPC。
- 所有連線都必須簽署伺服器提供的 `connect.challenge` nonce。

### 裝置驗證遷移診斷

對於仍使用挑戰前簽署行為的舊版客戶端，`connect` 現在會在
`error.details.code` 下傳回 `DEVICE_AUTH_*` 詳細代碼，並附上穩定的 `error.details.reason`。

常見遷移失敗：

| 訊息                        | details.code                     | details.reason           | 意義                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 客戶端省略了 `device.nonce`（或送出空白）。        |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 客戶端使用過期/錯誤的 nonce 簽署。                |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 簽章 payload 與 v2 payload 不符。                  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 已簽署時間戳超出允許偏移。                        |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 與公開金鑰指紋不符。                  |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開金鑰格式/正規化失敗。                         |

遷移目標：

- 一律等待 `connect.challenge`。
- 簽署包含伺服器 nonce 的 v2 payload。
- 在 `connect.params.device.nonce` 中傳送相同 nonce。
- 慣用的簽章 payload 是 `v3`，除了 device/client/role/scopes/token/nonce
  欄位外，也會綁定 `platform` 和 `deviceFamily`。
- 舊版 `v2` 簽章仍會基於相容性接受，但已配對裝置的中繼資料固定
  仍會控制重新連線時的命令政策。

## TLS + 固定

- WS 連線支援 TLS。
- 客戶端可選擇固定 gateway 憑證指紋（請參閱 `gateway.tls`
  設定以及 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`）。

## 範圍

此協定會暴露**完整 Gateway API**（狀態、頻道、模型、聊天、
agent、工作階段、節點、核准等等）。確切介面由
`src/gateway/protocol/schema.ts` 中的 TypeBox schema 定義。

## 相關

- [Bridge 協定](/zh-TW/gateway/bridge-protocol)
- [Gateway runbook](/zh-TW/gateway)
