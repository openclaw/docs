---
read_when:
    - 實作或更新 Gateway WS 用戶端
    - 偵錯通訊協定不相符或連線失敗
    - 正在重新產生通訊協定結構描述/模型
summary: Gateway WebSocket 協定：握手、訊框、版本控制
title: Gateway 通訊協定
x-i18n:
    generated_at: "2026-05-03T21:34:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 238706fcecd8ca96394402714cde5b01fb296de8e7b5a5867b1b3cf5b7940689
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS 協定是 OpenClaw 的**單一控制平面 + 節點傳輸**。所有用戶端（CLI、網頁 UI、macOS 應用程式、iOS/Android 節點、無介面節點）都透過 WebSocket 連線，並在交握時宣告其**角色** + **範圍**。

## 傳輸

- WebSocket，使用帶有 JSON 承載資料的文字訊框。
- 第一個訊框**必須**是 `connect` 請求。
- 連線前訊框上限為 64 KiB。成功交握後，用戶端應遵循 `hello-ok.policy.maxPayload` 與 `hello-ok.policy.maxBufferedBytes` 限制。啟用診斷時，過大的傳入訊框與緩慢的傳出緩衝區會在 Gateway 關閉或丟棄受影響訊框之前發出 `payload.large` 事件。這些事件會保留大小、限制、介面與安全原因碼。它們不會保留訊息內文、附件內容、原始訊框內文、權杖、Cookie 或秘密值。

## 交握（connect）

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

當 Gateway 仍在完成啟動輔助程序時，`connect` 請求可能會傳回可重試的 `UNAVAILABLE` 錯誤，且 `details.reason` 設為 `"startup-sidecars"` 並帶有 `retryAfterMs`。用戶端應在整體連線預算內重試該回應，而不是將其顯示為終止性交握失敗。

`server`、`features`、`snapshot` 和 `policy` 都是結構描述（`src/gateway/protocol/schema/frames.ts`）要求的欄位。`auth` 也是必要欄位，會回報協商出的角色/範圍。`canvasHostUrl` 是選用欄位。

未核發裝置權杖時，`hello-ok.auth` 會回報協商出的權限，不包含權杖欄位：

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

受信任的同程序後端用戶端（`client.id: "gateway-client"`、`client.mode: "backend"`）在以共用 Gateway 權杖/密碼進行驗證時，可在直接 local loopback 連線上省略 `device`。此路徑保留給內部控制平面 RPC，並避免過期的 CLI/裝置配對基準阻擋本機後端工作，例如子代理程式工作階段更新。遠端用戶端、瀏覽器來源用戶端、節點用戶端，以及明確的裝置權杖/裝置身分用戶端，仍會使用一般配對與範圍升級檢查。

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

在受信任的啟動交接期間，`hello-ok.auth` 也可能在 `deviceTokens` 中包含額外的有界角色項目：

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

對於內建的節點/操作員啟動流程，主要節點權杖會維持 `scopes: []`，而任何交接的操作員權杖都會受限於啟動操作員允許清單（`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`）。啟動範圍檢查會維持角色前綴：操作員項目只會滿足操作員請求，非操作員角色仍需要其自身角色前綴下的範圍。

### Node 範例

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

## 訊框

- **請求**：`{type:"req", id, method, params}`
- **回應**：`{type:"res", id, ok, payload|error}`
- **事件**：`{type:"event", event, payload, seq?, stateVersion?}`

具有副作用的方法需要**冪等鍵**（請參閱結構描述）。

## 角色 + 範圍

如需完整的操作員範圍模型、核准時檢查與共用秘密語意，請參閱[操作員範圍](/zh-TW/gateway/operator-scopes)。

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

由 Plugin 註冊的 Gateway RPC 方法可以要求自己的 operator 範圍，但
保留的核心管理前綴（`config.*`、`exec.approvals.*`、`wizard.*`、
`update.*`）一律解析為 `operator.admin`。

方法範圍只是第一道關卡。某些透過 `chat.send` 進入的斜線命令會在此之上
套用更嚴格的命令層級檢查。例如，持久化的
`/config set` 和 `/config unset` 寫入需要 `operator.admin`。

`node.pair.approve` 除了基礎方法範圍之外，還有一個額外的核准時範圍檢查：

- 無命令請求：`operator.pairing`
- 帶有非 exec Node 命令的請求：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的請求：
  `operator.pairing` + `operator.admin`

### 能力/命令/權限（Node）

Node 會在連線時宣告能力主張：

- `caps`：高層級能力類別。
- `commands`：用於叫用的命令允許清單。
- `permissions`：細粒度切換項（例如 `screen.record`、`camera.capture`）。

Gateway 會將這些視為**主張**，並強制執行伺服器端允許清單。

## Presence

- `system-presence` 會傳回以裝置身分為鍵的項目。
- Presence 項目包含 `deviceId`、`roles` 和 `scopes`，讓 UI 即使在裝置同時以 **operator** 和 **node** 連線時，也能針對每個裝置顯示單一列。
- `node.list` 包含選用的 `lastSeenAtMs` 和 `lastSeenReason` 欄位。已連線的 Node 會將其目前連線時間回報為 `lastSeenAtMs`，原因為 `connect`；當受信任的 Node 事件更新其配對中繼資料時，已配對的 Node 也可以回報持久的背景 presence。

### Node 背景存活事件

Node 可以使用 `event: "node.presence.alive"` 呼叫 `node.event`，以記錄已配對的 Node 在背景喚醒期間
仍然存活，而不將其標記為已連線。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是封閉列舉：`background`、`silent_push`、`bg_app_refresh`、
`significant_location`、`manual` 或 `connect`。未知的 trigger 字串會在持久化前由 Gateway 正規化為
`background`。此事件只有對已驗證的 Node
裝置工作階段才是持久的；沒有裝置或未配對的工作階段會傳回 `handled: false`。

成功的 Gateway 會傳回結構化結果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

較舊的 Gateway 對 `node.event` 仍可能傳回 `{ "ok": true }`；用戶端應將其視為
已確認的 RPC，而不是持久 presence 持久化。

## 廣播事件範圍

伺服器推送的 WebSocket 廣播事件會受到範圍控管，因此配對範圍或僅 Node 的工作階段不會被動接收工作階段內容。

- **聊天、agent 和工具結果 frame**（包含串流的 `agent` 事件和工具呼叫結果）至少需要 `operator.read`。沒有 `operator.read` 的工作階段會完全略過這些 frame。
- **Plugin 定義的 `plugin.*` 廣播**會根據 Plugin 註冊方式，受 `operator.write` 或 `operator.admin` 控管。
- **狀態和傳輸事件**（`heartbeat`、`presence`、`tick`、連線/中斷連線生命週期等）維持不受限制，讓每個已驗證工作階段都能觀察傳輸健康狀態。
- **未知的廣播事件家族**預設會受到範圍控管（失敗即關閉），除非已註冊的處理常式明確放寬限制。

每個用戶端連線都保有自己的每用戶端序號，因此即使不同用戶端看到事件串流中經過不同範圍篩選的子集，廣播也能在該 socket 上保留單調排序。

## 常見 RPC 方法家族

公開 WS 介面比上方的交握/驗證範例更廣。這
不是產生出的傾印內容 — `hello-ok.features.methods` 是由 `src/gateway/server-methods-list.ts` 加上已載入的
Plugin/channel 方法匯出建構的保守探索清單。請將其視為功能探索，而不是
`src/gateway/server-methods/*.ts` 的完整列舉。

<AccordionGroup>
  <Accordion title="系統和身分">
    - `health` 會傳回快取或新近探測的 Gateway 健康狀態快照。
    - `diagnostics.stability` 會傳回近期有界的診斷穩定性記錄器。它會保留作業中繼資料，例如事件名稱、計數、位元組大小、記憶體讀數、佇列/工作階段狀態、channel/Plugin 名稱和工作階段 ID。它不會保留聊天文字、Webhook 內容本文、工具輸出、原始請求或回應本文、token、cookie 或祕密值。需要 operator 讀取範圍。
    - `status` 會傳回 `/status` 樣式的 Gateway 摘要；敏感欄位只會包含給具 admin 範圍的 operator 用戶端。
    - `gateway.identity.get` 會傳回 relay 和配對流程使用的 Gateway 裝置身分。
    - `system-presence` 會傳回已連線 operator/Node 裝置的目前 presence 快照。
    - `system-event` 會附加系統事件，並可更新/廣播 presence 情境。
    - `last-heartbeat` 會傳回最新持久化的 Heartbeat 事件。
    - `set-heartbeats` 會切換 Gateway 上的 Heartbeat 處理。

  </Accordion>

  <Accordion title="模型與用量">
    - `models.list` 會回傳執行階段允許的模型目錄。傳入 `{ "view": "configured" }` 可取得適合選擇器大小的已設定模型（先是 `agents.defaults.models`，再是 `models.providers.*.models`），或傳入 `{ "view": "all" }` 取得完整目錄。
    - `usage.status` 會回傳提供者用量視窗／剩餘配額摘要。
    - `usage.cost` 會回傳某日期範圍的彙總成本用量摘要。
    - `doctor.memory.status` 會回傳作用中預設代理工作區的向量記憶體／快取嵌入就緒狀態。只有在呼叫端明確想要即時 ping 嵌入提供者時，才傳入 `{ "probe": true }` 或 `{ "deep": true }`。
    - `doctor.memory.remHarness` 會為遠端控制平面用戶端回傳有界、唯讀的 REM harness 預覽。它可以包含工作區路徑、記憶體片段、已轉譯的 grounded markdown，以及深度提升候選項，因此呼叫端需要 `operator.read`。
    - `sessions.usage` 會回傳各工作階段的用量摘要。
    - `sessions.usage.timeseries` 會回傳單一工作階段的時間序列用量。
    - `sessions.usage.logs` 會回傳單一工作階段的用量記錄項目。

  </Accordion>

  <Accordion title="通道與登入輔助工具">
    - `channels.status` 會回傳內建與隨附通道／Plugin 狀態摘要。
    - `channels.logout` 會登出特定通道／帳號，前提是該通道支援登出。
    - `web.login.start` 會為目前支援 QR 的網頁通道提供者啟動 QR／網頁登入流程。
    - `web.login.wait` 會等待該 QR／網頁登入流程完成，並在成功時啟動通道。
    - `push.test` 會向已註冊的 iOS Node 傳送測試 APNs 推播。
    - `voicewake.get` 會回傳已儲存的喚醒詞觸發器。
    - `voicewake.set` 會更新喚醒詞觸發器並廣播變更。

  </Accordion>

  <Accordion title="訊息與記錄">
    - `send` 是用於聊天執行器外部、以通道／帳號／對話串為目標傳送的直接對外傳遞 RPC。
    - `logs.tail` 會回傳已設定的 Gateway 檔案記錄尾端，並支援游標／限制與最大位元組控制。

  </Accordion>

  <Accordion title="Talk 與 TTS">
    - `talk.config` 會回傳有效的 Talk 設定 payload；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.mode` 會為 WebChat／Control UI 用戶端設定／廣播目前的 Talk 模式狀態。
    - `talk.speak` 會透過作用中的 Talk 語音提供者合成語音。
    - `tts.status` 會回傳 TTS 啟用狀態、作用中提供者、後援提供者，以及提供者設定狀態。
    - `tts.providers` 會回傳可見的 TTS 提供者清單。
    - `tts.enable` 和 `tts.disable` 會切換 TTS 偏好設定狀態。
    - `tts.setProvider` 會更新偏好的 TTS 提供者。
    - `tts.convert` 會執行一次性文字轉語音轉換。

  </Accordion>

  <Accordion title="秘密、設定、更新與精靈">
    - `secrets.reload` 會重新解析作用中的 SecretRefs，並且只有在完全成功時才替換執行階段秘密狀態。
    - `secrets.resolve` 會解析特定命令／目標集合的命令目標秘密指派。
    - `config.get` 會回傳目前的設定快照與雜湊。
    - `config.set` 會寫入已驗證的設定 payload。
    - `config.patch` 會合併部分設定更新。
    - `config.apply` 會驗證並取代完整設定 payload。
    - `config.schema` 會回傳 Control UI 與 CLI 工具使用的即時設定 schema payload：schema、`uiHints`、版本與產生中繼資料，當執行階段可以載入時，也包括 plugin 與通道 schema 中繼資料。該 schema 會包含欄位 `title` / `description` 中繼資料，這些中繼資料衍生自 UI 使用的相同標籤與說明文字，並在有相符欄位文件時包含巢狀物件、萬用字元、陣列項目，以及 `anyOf` / `oneOf` / `allOf` 組合分支。
    - `config.schema.lookup` 會為單一設定路徑回傳路徑範圍的查詢 payload：正規化路徑、淺層 schema 節點、相符提示與 `hintPath`，以及供 UI／CLI 向下鑽研使用的直接子項摘要。查詢 schema 節點會保留面向使用者的文件與常見驗證欄位（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、數值／字串／陣列／物件邊界，以及 `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` 等旗標）。子項摘要會公開 `key`、正規化 `path`、`type`、`required`、`hasChildren`，以及相符的 `hint` / `hintPath`。
    - `update.run` 會執行 gateway 更新流程，並且只有在更新本身成功時才排程重新啟動；有工作階段的呼叫端可以包含 `continuationMessage`，讓啟動時透過重新啟動接續佇列恢復一輪後續代理回合。套件管理員更新會在套件替換後強制進行不可延後、無冷卻時間的更新重新啟動，如此舊的 Gateway 程序才不會繼續從已被取代的 `dist` 樹進行惰性載入。
    - `update.status` 會回傳最新的快取更新重新啟動 sentinel，並在可用時包含重新啟動後正在執行的版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 會透過 WS RPC 公開入門精靈。

  </Accordion>

  <Accordion title="代理與工作區輔助工具">
    - `agents.list` 會回傳已設定的代理項目，包括有效模型與執行階段中繼資料。
    - `agents.create`、`agents.update` 和 `agents.delete` 會管理代理記錄與工作區接線。
    - `agents.files.list`、`agents.files.get` 和 `agents.files.set` 會管理為代理公開的啟動工作區檔案。
    - `artifacts.list`、`artifacts.get` 和 `artifacts.download` 會針對明確的 `sessionKey`、`runId` 或 `taskId` 範圍，公開由轉錄衍生的 artifact 摘要與下載。執行與任務查詢會在伺服器端解析擁有者工作階段，且只會回傳具有相符來源的轉錄媒體；不安全或本機 URL 來源會回傳不支援的下載，而不是在伺服器端擷取。
    - `agent.identity.get` 會回傳代理或工作階段的有效助理身分。
    - `agent.wait` 會等待執行完成，並在可用時回傳終端快照。

  </Accordion>

  <Accordion title="工作階段控制">
    - `sessions.list` 會回傳目前的工作階段索引，當已設定代理執行階段後端時，包含每列的 `agentRuntime` 中繼資料。
    - `sessions.subscribe` 和 `sessions.unsubscribe` 會切換目前 WS 用戶端的工作階段變更事件訂閱。
    - `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 會切換單一工作階段的轉錄／訊息事件訂閱。
    - `sessions.preview` 會回傳特定工作階段鍵的有界轉錄預覽。
    - `sessions.describe` 會針對精確工作階段鍵回傳一列 Gateway 工作階段。
    - `sessions.resolve` 會解析或標準化工作階段目標。
    - `sessions.create` 會建立新的工作階段項目。
    - `sessions.send` 會將訊息傳送到既有工作階段。
    - `sessions.steer` 是作用中工作階段的中斷並引導變體。
    - `sessions.abort` 會中止工作階段的作用中工作。呼叫端可以傳入 `key` 加上選用的 `runId`，或只針對 Gateway 可解析為工作階段的作用中執行傳入 `runId`。
    - `sessions.patch` 會更新工作階段中繼資料／覆寫，並回報已解析的標準模型以及有效的 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 和 `sessions.compact` 會執行工作階段維護。
    - `sessions.get` 會回傳完整儲存的工作階段列。
    - 聊天執行仍使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。`chat.history` 會為 UI 用戶端進行顯示正規化：從可見文字中移除行內指令標籤，移除純文字工具呼叫 XML payload（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及被截斷的工具呼叫區塊）與外洩的 ASCII／全形模型控制權杖，省略純靜默權杖助理列，例如精確的 `NO_REPLY` / `no_reply`，並且過大的列可以替換為預留位置。

  </Accordion>

  <Accordion title="裝置配對與裝置權杖">
    - `device.pair.list` 會回傳待處理與已核准的已配對裝置。
    - `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 會管理裝置配對記錄。
    - `device.token.rotate` 會在其已核准角色與呼叫端範圍界限內輪替已配對裝置權杖。
    - `device.token.revoke` 會在其已核准角色與呼叫端範圍界限內撤銷已配對裝置權杖。

  </Accordion>

  <Accordion title="Node 配對、呼叫與待處理工作">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove` 和 `node.pair.verify` 涵蓋 Node 配對與啟動驗證。
    - `node.list` 和 `node.describe` 會回傳已知／已連線的 Node 狀態。
    - `node.rename` 會更新已配對 Node 標籤。
    - `node.invoke` 會將命令轉送到已連線的 Node。
    - `node.invoke.result` 會回傳呼叫請求的結果。
    - `node.event` 會將源自 Node 的事件帶回 gateway。
    - `node.canvas.capability.refresh` 會重新整理範圍化的 canvas capability 權杖。
    - `node.pending.pull` 和 `node.pending.ack` 是已連線 Node 佇列 API。
    - `node.pending.enqueue` 和 `node.pending.drain` 會管理離線／中斷連線 Node 的持久待處理工作。

  </Accordion>

  <Accordion title="核准系列">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 涵蓋一次性 exec 核准請求，以及待處理核准查詢／重播。
    - `exec.approval.waitDecision` 會等待一個待處理 exec 核准並回傳最終決策（逾時則為 `null`）。
    - `exec.approvals.get` 和 `exec.approvals.set` 會管理 gateway exec 核准原則快照。
    - `exec.approvals.node.get` 和 `exec.approvals.node.set` 會透過 Node relay 命令管理 Node 本機 exec 核准原則。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 涵蓋由 plugin 定義的核准流程。

  </Accordion>

  <Accordion title="自動化、Skills 與工具">
    - 自動化：`wake` 會排程立即或下一次 Heartbeat 的喚醒文字注入；`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 會管理排程工作。
    - Skills 與工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 常見事件系列

- `chat`：UI 聊天更新，例如 `chat.inject` 與其他僅限轉錄的聊天事件。
- `session.message` 和 `session.tool`：已訂閱工作階段的轉錄／事件串流更新。
- `sessions.changed`：工作階段索引或中繼資料已變更。
- `presence`：系統 presence 快照更新。
- `tick`：定期 keepalive／存活事件。
- `health`：gateway 健康狀態快照更新。
- `heartbeat`：Heartbeat 事件串流更新。
- `cron`：Cron 執行／工作變更事件。
- `shutdown`：gateway 關閉通知。
- `node.pair.requested` / `node.pair.resolved`：Node 配對生命週期。
- `node.invoke.request`：Node 呼叫請求廣播。
- `device.pair.requested` / `device.pair.resolved`：已配對裝置生命週期。
- `voicewake.changed`：喚醒詞觸發器設定已變更。
- `exec.approval.requested` / `exec.approval.resolved`：exec 核准生命週期。
- `plugin.approval.requested` / `plugin.approval.resolved`：plugin 核准生命週期。

### Node 輔助方法

- Node 可以呼叫 `skills.bins` 來擷取目前的 skill 可執行檔清單，以進行自動允許檢查。

### 操作者輔助方法

- 操作者可以呼叫 `commands.list`（`operator.read`）來擷取代理程式的執行階段
  指令清單。
  - `agentId` 是選用的；省略它可讀取預設代理程式工作區。
  - `scope` 控制主要 `name` 目標的表面：
    - `text` 會傳回不含前導 `/` 的主要文字指令權杖
    - `native` 和預設的 `both` 路徑會在可用時傳回具提供者感知能力的原生命稱
  - `textAliases` 會攜帶精確的斜線別名，例如 `/model` 和 `/m`。
  - `nativeName` 會在存在時攜帶具提供者感知能力的原生指令名稱。
  - `provider` 是選用的，且只會影響原生命名以及原生 Plugin
    指令可用性。
  - `includeArgs=false` 會從回應中省略序列化的引數中繼資料。
- 操作者可以呼叫 `tools.catalog`（`operator.read`）來擷取代理程式的執行階段工具目錄。回應包含分組工具與來源中繼資料：
  - `source`: `core` 或 `plugin`
  - `pluginId`: 當 `source="plugin"` 時的 plugin 擁有者
  - `optional`: plugin 工具是否為選用
- 操作者可以呼叫 `tools.effective`（`operator.read`）來擷取工作階段的執行階段有效工具
  清單。
  - `sessionKey` 是必填的。
  - gateway 會從伺服器端工作階段衍生可信任的執行階段內容，而不是接受
    呼叫者提供的驗證或傳遞內容。
  - 回應以工作階段為範圍，並反映目前作用中對話現在可使用的內容，
    包含核心、plugin 與頻道工具。
- 操作者可以呼叫 `tools.invoke`（`operator.write`），透過與 `/tools/invoke`
  相同的 gateway 政策路徑呼叫一個可用工具。
  - `name` 是必填的。`args`、`sessionKey`、`agentId`、`confirm` 和
    `idempotencyKey` 是選用的。
  - 如果同時存在 `sessionKey` 與 `agentId`，解析出的工作階段代理程式必須符合
    `agentId`。
  - 回應是面向 SDK 的封套，包含 `ok`、`toolName`、選用的 `output`，以及具型別的
    `error` 欄位。核准或政策拒絕會在酬載中傳回 `ok:false`，而不是
    繞過 gateway 工具政策管線。
- 操作者可以呼叫 `skills.status`（`operator.read`）來擷取代理程式可見的
  skill 清單。
  - `agentId` 是選用的；省略它可讀取預設代理程式工作區。
  - 回應包含資格、缺少的需求、設定檢查，以及
    經過清理的安裝選項，不會暴露原始祕密值。
- 操作者可以呼叫 `skills.search` 和 `skills.detail`（`operator.read`）取得
  ClawHub 探索中繼資料。
- 操作者可以用兩種模式呼叫 `skills.install`（`operator.admin`）：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 會將
    skill 資料夾安裝到預設代理程式工作區的 `skills/` 目錄。
  - Gateway 安裝程式模式：`{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    會在 gateway 主機上執行宣告的 `metadata.openclaw.install` 動作。
- 操作者可以用兩種模式呼叫 `skills.update`（`operator.admin`）：
  - ClawHub 模式會更新預設代理程式工作區中一個受追蹤的 slug，或所有受追蹤的 ClawHub 安裝。
  - 設定模式會修補 `skills.entries.<skillKey>` 值，例如 `enabled`、
    `apiKey` 和 `env`。

### `models.list` 檢視

`models.list` 接受選用的 `view` 參數：

- 省略或 `"default"`：目前的執行階段行為。如果已設定 `agents.defaults.models`，回應會是允許的目錄；否則回應會是完整的 Gateway 目錄。
- `"configured"`：適合挑選器大小的行為。如果已設定 `agents.defaults.models`，它仍然優先。否則回應會使用明確的 `models.providers.*.models` 項目，只有在沒有已設定的模型列時才退回完整目錄。
- `"all"`：完整 Gateway 目錄，略過 `agents.defaults.models`。請將此用於診斷與探索 UI，而不是一般模型挑選器。

## 執行核准

- 當執行請求需要核准時，gateway 會廣播 `exec.approval.requested`。
- 操作者用戶端透過呼叫 `exec.approval.resolve` 解決（需要 `operator.approvals` 範圍）。
- 對於 `host=node`，`exec.approval.request` 必須包含 `systemRunPlan`（標準 `argv`/`cwd`/`rawCommand`/工作階段中繼資料）。缺少 `systemRunPlan` 的請求會被拒絕。
- 核准後，轉送的 `node.invoke system.run` 呼叫會重用該標準
  `systemRunPlan` 作為權威的指令/cwd/工作階段內容。
- 如果呼叫者在準備與最終已核准的 `system.run` 轉送之間變更 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，gateway 會拒絕執行，而不是信任變更後的酬載。

## 代理程式傳遞備援

- `agent` 請求可以包含 `deliver=true` 以要求對外傳遞。
- `bestEffortDeliver=false` 保持嚴格行為：無法解析或僅限內部的傳遞目標會傳回 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允許在無法解析外部可傳遞路由時退回僅工作階段執行（例如內部/webchat 工作階段或模糊的多頻道設定）。

## 版本控管

- `PROTOCOL_VERSION` 位於 `src/gateway/protocol/schema/protocol-schemas.ts`。
- 用戶端會傳送 `minProtocol` + `maxProtocol`；伺服器會拒絕不相符的項目。
- 結構描述 + 模型是從 TypeBox 定義產生：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 用戶端常數

`src/gateway/client.ts` 中的參考用戶端使用這些預設值。這些值在
協定 v3 中保持穩定，且是第三方用戶端的預期基準。

| 常數                                      | 預設值                                                | 來源                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| 請求逾時（每個 RPC）                      | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| 預先驗證 / 連線挑戰逾時                   | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（config/env 可提高配對的伺服器/用戶端預算）            |
| 初始重新連線退避                          | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| 最大重新連線退避                          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| 裝置權杖關閉後的快速重試限制              | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前的強制停止寬限            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` 預設逾時                  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| 預設 tick 間隔（`hello-ok` 前）            | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| tick 逾時關閉                             | 當靜默超過 `tickIntervalMs * 2` 時為代碼 `4000`       | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

伺服器會在 `hello-ok` 中宣告有效的 `policy.tickIntervalMs`、`policy.maxPayload`
和 `policy.maxBufferedBytes`；用戶端應遵循這些值，
而不是握手前的預設值。

## 驗證

- 共享密鑰 Gateway 驗證會使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，取決於設定的驗證模式。
- Tailscale Serve 等帶有身分的模式
  (`gateway.auth.allowTailscale: true`) 或非 loopback
  `gateway.auth.mode: "trusted-proxy"` 會從請求標頭滿足 connect 驗證檢查，
  而不是使用 `connect.params.auth.*`。
- 私人入口 `gateway.auth.mode: "none"` 會完全略過共享密鑰 connect 驗證；
  請勿在公開/不受信任的入口暴露該模式。
- 配對後，Gateway 會發出範圍限定於連線角色 + 範圍的**裝置權杖**。
  它會在 `hello-ok.auth.deviceToken` 中傳回，且用戶端應將其保存以供未來連線使用。
- 用戶端應在任何成功連線後保存主要的 `hello-ok.auth.deviceToken`。
- 使用該**已儲存**裝置權杖重新連線時，也應重用該權杖已儲存的核准範圍集合。
  這會保留已授予的讀取/探測/狀態存取權，並避免將重新連線悄悄縮減為較窄的隱含僅管理員範圍。
- 用戶端 connect 驗證組裝（`src/gateway/client.ts` 中的 `selectConnectAuth`）：
  - `auth.password` 是正交的，且設定時一律會轉送。
  - `auth.token` 會依優先順序填入：先使用明確的共享權杖，
    接著是明確的 `deviceToken`，再來是已儲存的每裝置權杖（以
    `deviceId` + `role` 作為鍵）。
  - `auth.bootstrapToken` 只會在上述項目都未解析出
    `auth.token` 時送出。共享權杖或任何解析出的裝置權杖都會抑制它。
  - 在一次性的 `AUTH_TOKEN_MISMATCH` 重試中，自動提升已儲存裝置權杖僅限於**受信任端點** —
    loopback，或具有釘選 `tlsFingerprint` 的 `wss://`。未釘選的公開 `wss://`
    不符合資格。
- 額外的 `hello-ok.auth.deviceTokens` 項目是 bootstrap 交接權杖。
  只有在連線於受信任傳輸上使用 bootstrap 驗證時才保存它們，
  例如 `wss://` 或 loopback/本機配對。
- 如果用戶端提供**明確**的 `deviceToken` 或明確的 `scopes`，
  該呼叫者要求的範圍集合仍具權威性；只有當用戶端重用已儲存的每裝置權杖時，
  才會重用快取範圍。
- 裝置權杖可透過 `device.token.rotate` 和
  `device.token.revoke` 輪換/撤銷（需要 `operator.pairing` 範圍）。
- `device.token.rotate` 會傳回輪換中繼資料。它只會在同一裝置呼叫且已使用該裝置權杖驗證時，
  回傳替換用承載權杖，因此僅使用權杖的用戶端可在重新連線前保存替換權杖。
  共享/管理員輪換不會回傳承載權杖。
- 權杖發出、輪換與撤銷會維持受限於該裝置配對項目中記錄的已核准角色集合；
  權杖變更不能擴展或鎖定配對核准從未授予的裝置角色。
- 對於已配對裝置的權杖工作階段，除非呼叫者也有 `operator.admin`，
  否則裝置管理會自我限定範圍：非管理員呼叫者只能移除/撤銷/輪換其**自己的**裝置項目。
- `device.token.rotate` 和 `device.token.revoke` 也會檢查目標 operator
  權杖範圍集合是否符合呼叫者目前的工作階段範圍。非管理員呼叫者不能輪換或撤銷比自己已持有範圍更廣的 operator 權杖。
- 驗證失敗會包含 `error.details.code` 及復原提示：
  - `error.details.canRetryWithDeviceToken`（布林值）
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` 的用戶端行為：
  - 受信任用戶端可嘗試一次有界重試，使用快取的每裝置權杖。
  - 如果該重試失敗，用戶端應停止自動重新連線迴圈，並顯示 operator 操作指引。

## 裝置身分 + 配對

- Node 應包含從金鑰組指紋衍生的穩定裝置身分 (`device.id`)。
- Gateway 會依裝置 + 角色發出權杖。
- 除非啟用本機自動核准，否則新的裝置 ID 需要配對核准。
- 配對自動核准以直接 local loopback 連線為中心。
- OpenClaw 也有一條狹窄的後端/container-local 自我連線路徑，
  用於受信任的共享密鑰輔助流程。
- 同主機 tailnet 或 LAN 連線在配對上仍視為遠端，並需要核准。
- WS 用戶端通常會在 `connect` 期間包含 `device` 身分（operator +
  node）。唯一無裝置 operator 例外是明確的信任路徑：
  - `gateway.controlUi.allowInsecureAuth=true`，用於僅限 localhost 的不安全 HTTP 相容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` operator Control UI 驗證。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急破窗，嚴重降低安全性）。
  - 直接 loopback 的 `gateway-client` 後端 RPC，使用共享
    gateway 權杖/密碼驗證。
- 所有連線都必須簽署伺服器提供的 `connect.challenge` nonce。

### 裝置驗證遷移診斷

對於仍使用挑戰前簽署行為的舊版用戶端，`connect` 現在會在
`error.details.code` 下傳回 `DEVICE_AUTH_*` 詳細代碼，並帶有穩定的 `error.details.reason`。

常見遷移失敗：

| 訊息                        | details.code                     | details.reason           | 含義                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 用戶端省略 `device.nonce`（或送出空白）。          |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 用戶端使用過期/錯誤的 nonce 簽署。                |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 簽署酬載不符合 v2 酬載。                          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 簽署時間戳超出允許偏移。                          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 不符合公開金鑰指紋。                  |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開金鑰格式/標準化失敗。                         |

遷移目標：

- 一律等待 `connect.challenge`。
- 簽署包含伺服器 nonce 的 v2 酬載。
- 在 `connect.params.device.nonce` 中送出相同 nonce。
- 偏好的簽署酬載是 `v3`，除了 device/client/role/scopes/token/nonce 欄位外，
  還會繫結 `platform` 和 `deviceFamily`。
- 舊版 `v2` 簽章仍會為相容性而接受，但已配對裝置的中繼資料釘選仍會控制重新連線時的命令政策。

## TLS + 釘選

- TLS 支援 WS 連線。
- 用戶端可選擇性釘選 gateway 憑證指紋（請參閱 `gateway.tls`
  設定以及 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`）。

## 範圍

此協定會暴露**完整 gateway API**（狀態、頻道、模型、聊天、
agent、工作階段、節點、核准等）。確切表面由
`src/gateway/protocol/schema.ts` 中的 TypeBox schema 定義。

## 相關

- [橋接協定](/zh-TW/gateway/bridge-protocol)
- [Gateway runbook](/zh-TW/gateway)
