---
read_when:
    - 實作或更新 Gateway WS 客戶端
    - 偵錯通訊協定不相符或連線失敗
    - 重新產生通訊協定結構描述/模型
summary: Gateway WebSocket 通訊協定：交握、訊框、版本控管
title: Gateway 協定
x-i18n:
    generated_at: "2026-05-03T02:44:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 06f6e1f2188860362bff481e646bd1c4bae4cf8f9a9ccae4fbd5ceea434d2247
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS 協定是 OpenClaw 的**單一控制平面 + 節點傳輸**。
所有用戶端（CLI、網頁 UI、macOS app、iOS/Android 節點、無介面節點）都會透過 WebSocket 連線，並在交握時宣告其**角色**與**範圍**。

## 傳輸

- WebSocket，使用含 JSON 酬載的文字框架。
- 第一個框架**必須**是 `connect` 請求。
- 連線前框架上限為 64 KiB。交握成功後，用戶端應遵循 `hello-ok.policy.maxPayload` 與 `hello-ok.policy.maxBufferedBytes` 限制。啟用診斷時，過大的入站框架與緩慢的出站緩衝區會在 gateway 關閉或丟棄受影響框架前發出 `payload.large` 事件。這些事件會保留大小、限制、介面與安全原因代碼。它們不會保留訊息本文、附件內容、原始框架本文、權杖、Cookie 或秘密值。

## 交握 (connect)

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

當 Gateway 仍在完成啟動 sidecar 時，`connect` 請求可能會回傳可重試的 `UNAVAILABLE` 錯誤，且 `details.reason` 設為 `"startup-sidecars"` 並帶有 `retryAfterMs`。用戶端應在整體連線預算內重試該回應，而不是將它呈現為終止性的交握失敗。

`server`、`features`、`snapshot` 與 `policy` 皆為結構描述所要求
（`src/gateway/protocol/schema/frames.ts`）。`auth` 也為必填，並回報已協商的角色/範圍。`canvasHostUrl` 為選填。

未核發裝置權杖時，`hello-ok.auth` 會回報已協商的權限，不含權杖欄位：

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

受信任的同處理程序後端用戶端（`client.id: "gateway-client"`、`client.mode: "backend"`）在直接 local loopback 連線上使用共用 gateway 權杖/密碼進行驗證時，可省略 `device`。此路徑保留給內部控制平面 RPC，並避免過期的 CLI/裝置配對基準阻擋本機後端工作，例如子代理程式工作階段更新。遠端用戶端、瀏覽器來源用戶端、節點用戶端，以及明確的裝置權杖/裝置身分用戶端，仍使用一般配對與範圍升級檢查。

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

對於內建的節點/operator 啟動流程，主要節點權杖會保持 `scopes: []`，任何交接的 operator 權杖則維持限制在啟動 operator 允許清單（`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`）。啟動範圍檢查會維持以角色為前綴：operator 項目只滿足 operator 請求，非 operator 角色仍需要其自身角色前綴下的範圍。

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

具有副作用的方法需要**冪等性金鑰**（請參閱結構描述）。

## 角色 + 範圍

如需完整 operator 範圍模型、核准時檢查與共用秘密語意，請參閱 [Operator 範圍](/zh-TW/gateway/operator-scopes)。

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

帶有 `includeSecrets: true` 的 `talk.config` 需要 `operator.talk.secrets`
（或 `operator.admin`）。

Plugin 註冊的 gateway RPC 方法可以要求自己的 operator 範圍，但保留的核心管理前綴（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）一律解析為 `operator.admin`。

方法範圍只是第一道閘門。某些透過 `chat.send` 進入的斜線指令會額外套用更嚴格的指令層級檢查。例如，持久性的 `/config set` 與 `/config unset` 寫入需要 `operator.admin`。

`node.pair.approve` 在基礎方法範圍之上，也有額外的核准時範圍檢查：

- 無指令請求：`operator.pairing`
- 含非 exec 節點指令的請求：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的請求：
  `operator.pairing` + `operator.admin`

### 能力/指令/權限（節點）

節點在連線時宣告能力聲明：

- `caps`：高階能力類別。
- `commands`：invoke 的指令允許清單。
- `permissions`：細粒度切換（例如 `screen.record`、`camera.capture`）。

Gateway 會將這些視為**聲明**，並強制執行伺服器端允許清單。

## 線上狀態

- `system-presence` 會回傳以裝置身分為鍵的項目。
- 線上狀態項目包含 `deviceId`、`roles` 與 `scopes`，因此即使裝置同時以 **operator** 和 **node** 連線，UI 也能為每個裝置顯示單一列。
- `node.list` 包含選填的 `lastSeenAtMs` 與 `lastSeenReason` 欄位。已連線節點會將目前連線時間回報為 `lastSeenAtMs`，原因為 `connect`；當受信任的節點事件更新其配對中繼資料時，已配對節點也可以回報持久的背景線上狀態。

### 節點背景存活事件

節點可呼叫 `node.event` 並使用 `event: "node.presence.alive"`，以記錄已配對節點在背景喚醒期間仍存活，而不將其標記為已連線。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是封閉列舉：`background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual` 或 `connect`。未知的 trigger 字串會在持久化前由 gateway 正規化為 `background`。此事件僅對已驗證的節點裝置工作階段具有持久性；無裝置或未配對的工作階段會回傳 `handled: false`。

成功的 gateway 會回傳結構化結果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

較舊的 gateway 對 `node.event` 仍可能回傳 `{ "ok": true }`；用戶端應將其視為已確認的 RPC，而非持久線上狀態儲存。

## 廣播事件範圍控管

伺服器推送的 WebSocket 廣播事件會受範圍控管，因此配對範圍或僅節點工作階段不會被動接收工作階段內容。

- **聊天、代理程式與工具結果框架**（包含串流的 `agent` 事件與工具呼叫結果）至少需要 `operator.read`。沒有 `operator.read` 的工作階段會完全略過這些框架。
- **Plugin 定義的 `plugin.*` 廣播**會依 Plugin 註冊方式，受 `operator.write` 或 `operator.admin` 控管。
- **狀態與傳輸事件**（`heartbeat`、`presence`、`tick`、連線/斷線生命週期等）維持不受限制，讓每個已驗證工作階段都能觀察傳輸健康狀態。
- **未知的廣播事件家族**預設受範圍控管（失敗即關閉），除非已註冊的處理常式明確放寬限制。

每個用戶端連線都保有自己的每用戶端序號，因此即使不同用戶端看見事件串流中不同的範圍篩選子集，廣播在該 socket 上仍會保持單調排序。

## 常見 RPC 方法家族

公開 WS 介面比上述交握/驗證範例更廣。這不是產生的傾印內容，`hello-ok.features.methods` 是根據 `src/gateway/server-methods-list.ts` 加上已載入的 Plugin/通道方法匯出所建立的保守探索清單。請將它視為功能探索，而非 `src/gateway/server-methods/*.ts` 的完整列舉。

<AccordionGroup>
  <Accordion title="系統與身分">
    - `health` 會回傳快取或新探測的 gateway 健康狀態快照。
    - `diagnostics.stability` 會回傳最近的有界診斷穩定性記錄器。它會保留操作中繼資料，例如事件名稱、計數、位元組大小、記憶體讀數、佇列/工作階段狀態、通道/Plugin 名稱與工作階段 ID。它不會保留聊天文字、webhook 本文、工具輸出、原始請求或回應本文、權杖、Cookie 或秘密值。需要 operator 讀取範圍。
    - `status` 會回傳 `/status` 風格的 gateway 摘要；敏感欄位只會包含在具備 admin 範圍的 operator 用戶端回應中。
    - `gateway.identity.get` 會回傳 relay 與配對流程使用的 gateway 裝置身分。
    - `system-presence` 會回傳已連線 operator/node 裝置的目前線上狀態快照。
    - `system-event` 會附加系統事件，並可更新/廣播線上狀態內容。
    - `last-heartbeat` 會回傳最新持久化的 Heartbeat 事件。
    - `set-heartbeats` 會切換 gateway 上的 Heartbeat 處理。

  </Accordion>

  <Accordion title="模型與使用量">
    - `models.list` 會傳回執行階段允許的模型目錄。傳入 `{ "view": "configured" }` 可取得適合選擇器大小的已設定模型（先是 `agents.defaults.models`，接著是 `models.providers.*.models`），或傳入 `{ "view": "all" }` 取得完整目錄。
    - `usage.status` 會傳回提供者使用量視窗／剩餘配額摘要。
    - `usage.cost` 會傳回日期範圍內的彙總成本使用量摘要。
    - `doctor.memory.status` 會傳回作用中預設 agent 工作區的向量記憶體／快取嵌入就緒狀態。只有在呼叫端明確想要即時偵測嵌入提供者連線時，才傳入 `{ "probe": true }` 或 `{ "deep": true }`。
    - `doctor.memory.remHarness` 會為遠端控制平面用戶端傳回有界、唯讀的 REM harness 預覽。它可能包含工作區路徑、記憶體片段、已算繪的 grounded markdown，以及深度提升候選項，因此呼叫端需要 `operator.read`。
    - `sessions.usage` 會傳回每個工作階段的使用量摘要。
    - `sessions.usage.timeseries` 會傳回單一工作階段的時間序列使用量。
    - `sessions.usage.logs` 會傳回單一工作階段的使用量記錄項目。

  </Accordion>

  <Accordion title="通道與登入輔助工具">
    - `channels.status` 會傳回內建 + 隨附通道／Plugin 狀態摘要。
    - `channels.logout` 會在通道支援登出時，登出特定通道／帳號。
    - `web.login.start` 會為目前具備 QR 能力的 Web 通道提供者啟動 QR／Web 登入流程。
    - `web.login.wait` 會等待該 QR／Web 登入流程完成，並在成功時啟動通道。
    - `push.test` 會傳送測試 APNs 推播到已註冊的 iOS node。
    - `voicewake.get` 會傳回已儲存的喚醒詞觸發條件。
    - `voicewake.set` 會更新喚醒詞觸發條件並廣播變更。

  </Accordion>

  <Accordion title="訊息與記錄">
    - `send` 是直接的對外傳遞 RPC，用於 chat runner 外部以通道／帳號／thread 為目標的傳送。
    - `logs.tail` 會傳回已設定的 gateway 檔案記錄尾端，並提供游標／限制與最大位元組控制。

  </Accordion>

  <Accordion title="Talk 與 TTS">
    - `talk.config` 會傳回有效的 Talk 設定 payload；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.mode` 會為 WebChat／Control UI 用戶端設定／廣播目前的 Talk 模式狀態。
    - `talk.speak` 會透過作用中的 Talk 語音提供者合成語音。
    - `tts.status` 會傳回 TTS 啟用狀態、作用中提供者、備援提供者，以及提供者設定狀態。
    - `tts.providers` 會傳回可見的 TTS 提供者清單。
    - `tts.enable` 和 `tts.disable` 會切換 TTS 偏好設定狀態。
    - `tts.setProvider` 會更新偏好的 TTS 提供者。
    - `tts.convert` 會執行一次性文字轉語音轉換。

  </Accordion>

  <Accordion title="機密、設定、更新與精靈">
    - `secrets.reload` 會重新解析作用中的 SecretRefs，且只有在完全成功時才交換執行階段機密狀態。
    - `secrets.resolve` 會為特定命令／目標集合解析命令目標機密指派。
    - `config.get` 會傳回目前的設定快照與雜湊。
    - `config.set` 會寫入已驗證的設定 payload。
    - `config.patch` 會合併部分設定更新。
    - `config.apply` 會驗證並取代完整設定 payload。
    - `config.schema` 會傳回 Control UI 與 CLI 工具使用的即時設定結構描述 payload：結構描述、`uiHints`、版本與產生中繼資料；當執行階段可以載入時，也包含 Plugin + 通道結構描述中繼資料。此結構描述包含欄位 `title` / `description` 中繼資料，衍生自 UI 使用的相同標籤與說明文字；當存在相符欄位文件時，也包含巢狀物件、萬用字元、陣列項目，以及 `anyOf` / `oneOf` / `allOf` 組合分支。
    - `config.schema.lookup` 會為單一設定路徑傳回以路徑為範圍的查詢 payload：正規化路徑、淺層結構描述節點、相符提示 + `hintPath`，以及供 UI／CLI 下鑽的直接子項摘要。查詢結構描述節點會保留面向使用者的文件與常見驗證欄位（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、數值／字串／陣列／物件邊界，以及 `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` 等旗標）。子項摘要會公開 `key`、正規化的 `path`、`type`、`required`、`hasChildren`，以及相符的 `hint` / `hintPath`。
    - `update.run` 會執行 gateway 更新流程，且只有在更新本身成功時才排程重新啟動。套件管理器更新會在套件交換後強制非延後、無冷卻時間的更新重新啟動，因此舊的 Gateway 程序不會繼續從已取代的 `dist` tree 延遲載入。
    - `update.status` 會傳回最新快取的更新重新啟動 sentinel，包含可用時重新啟動後執行中的版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 會透過 WS RPC 公開上手精靈。

  </Accordion>

  <Accordion title="Agent 與工作區輔助工具">
    - `agents.list` 會傳回已設定的 agent 項目，包含有效模型與執行階段中繼資料。
    - `agents.create`、`agents.update` 和 `agents.delete` 會管理 agent 記錄與工作區連線。
    - `agents.files.list`、`agents.files.get` 和 `agents.files.set` 會管理為 agent 公開的 bootstrap 工作區檔案。
    - `artifacts.list`、`artifacts.get` 和 `artifacts.download` 會針對明確的 `sessionKey`、`runId` 或 `taskId` 範圍，公開從 transcript 衍生的 artifact 摘要與下載。Run 與 task 查詢會在伺服器端解析擁有的工作階段，且只會傳回 provenance 相符的 transcript 媒體；不安全或本機 URL 來源會傳回不支援的下載，而不是在伺服器端擷取。
    - `agent.identity.get` 會傳回 agent 或工作階段的有效 assistant identity。
    - `agent.wait` 會等待 run 完成，並在可用時傳回終止快照。

  </Accordion>

  <Accordion title="工作階段控制">
    - `sessions.list` 會傳回目前的工作階段索引；當已設定 agent runtime 後端時，包含每列 `agentRuntime` 中繼資料。
    - `sessions.subscribe` 和 `sessions.unsubscribe` 會為目前 WS 用戶端切換工作階段變更事件訂閱。
    - `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 會為單一工作階段切換 transcript／訊息事件訂閱。
    - `sessions.preview` 會傳回特定工作階段 key 的有界 transcript 預覽。
    - `sessions.describe` 會傳回精確工作階段 key 的一列 Gateway 工作階段。
    - `sessions.resolve` 會解析或標準化工作階段目標。
    - `sessions.create` 會建立新的工作階段項目。
    - `sessions.send` 會將訊息傳送到現有工作階段。
    - `sessions.steer` 是作用中工作階段的中斷並導向變體。
    - `sessions.abort` 會中止工作階段的作用中工作。呼叫端可以傳入 `key` 加上選用的 `runId`，或對 Gateway 可解析到工作階段的作用中 runs 僅傳入 `runId`。
    - `sessions.patch` 會更新工作階段中繼資料／覆寫，並回報已解析的標準模型以及有效的 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 和 `sessions.compact` 會執行工作階段維護。
    - `sessions.get` 會傳回完整儲存的工作階段資料列。
    - 聊天執行仍使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。`chat.history` 會為 UI 用戶端進行顯示正規化：從可見文字中移除 inline directive tags、移除純文字 tool-call XML payloads（包含 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及截斷的 tool-call blocks）與外洩的 ASCII／全形模型控制 token；省略純 silent-token assistant rows，例如精確的 `NO_REPLY` / `no_reply`；而過大的資料列可替換為預留位置。

  </Accordion>

  <Accordion title="裝置配對與裝置 token">
    - `device.pair.list` 會傳回待處理與已核准的已配對裝置。
    - `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 會管理裝置配對記錄。
    - `device.token.rotate` 會在其已核准角色與呼叫端範圍邊界內輪替已配對裝置 token。
    - `device.token.revoke` 會在其已核准角色與呼叫端範圍邊界內撤銷已配對裝置 token。

  </Accordion>

  <Accordion title="Node 配對、叫用與待處理工作">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove` 和 `node.pair.verify` 涵蓋 node 配對與 bootstrap 驗證。
    - `node.list` 和 `node.describe` 會傳回已知／已連線的 node 狀態。
    - `node.rename` 會更新已配對 node 標籤。
    - `node.invoke` 會將命令轉送到已連線 node。
    - `node.invoke.result` 會傳回 invoke request 的結果。
    - `node.event` 會將源自 node 的事件帶回 gateway。
    - `node.canvas.capability.refresh` 會重新整理具範圍的 canvas-capability tokens。
    - `node.pending.pull` 和 `node.pending.ack` 是已連線 node 佇列 API。
    - `node.pending.enqueue` 和 `node.pending.drain` 會管理離線／中斷連線 nodes 的 durable pending work。

  </Accordion>

  <Accordion title="核准系列">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 涵蓋一次性 exec 核准請求，以及待處理核准查詢／重播。
    - `exec.approval.waitDecision` 會等待一個待處理 exec 核准，並傳回最終決策（逾時時為 `null`）。
    - `exec.approvals.get` 和 `exec.approvals.set` 會管理 gateway exec 核准政策快照。
    - `exec.approvals.node.get` 和 `exec.approvals.node.set` 會透過 node relay commands 管理 node-local exec 核准政策。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 涵蓋 Plugin 定義的核准流程。

  </Accordion>

  <Accordion title="自動化、Skills 與工具">
    - 自動化：`wake` 會排程立即或下一次 Heartbeat 的 wake text injection；`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 會管理排程工作。
    - Skills 與工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 常見事件系列

- `chat`：UI 聊天更新，例如 `chat.inject` 與其他僅限 transcript 的聊天
  事件。
- `session.message` 和 `session.tool`：已訂閱工作階段的 transcript／事件串流更新。
- `sessions.changed`：工作階段索引或中繼資料已變更。
- `presence`：系統 presence 快照更新。
- `tick`：週期性 keepalive／liveness 事件。
- `health`：gateway 健全狀態快照更新。
- `heartbeat`：Heartbeat 事件串流更新。
- `cron`：Cron run／job 變更事件。
- `shutdown`：gateway 關閉通知。
- `node.pair.requested` / `node.pair.resolved`：node 配對生命週期。
- `node.invoke.request`：node invoke request 廣播。
- `device.pair.requested` / `device.pair.resolved`：已配對裝置生命週期。
- `voicewake.changed`：喚醒詞觸發條件設定已變更。
- `exec.approval.requested` / `exec.approval.resolved`：exec 核准
  生命週期。
- `plugin.approval.requested` / `plugin.approval.resolved`：Plugin 核准
  生命週期。

### Node 輔助方法

- Nodes 可以呼叫 `skills.bins` 以擷取目前的 skill 執行檔清單，
  用於 auto-allow 檢查。

### 操作員輔助方法

- 操作員可以呼叫 `commands.list` (`operator.read`) 以擷取代理的執行階段
  指令清單。
  - `agentId` 為選用；省略時會讀取預設代理工作區。
  - `scope` 控制主要 `name` 目標所屬的介面：
    - `text` 會傳回不含開頭 `/` 的主要文字指令權杖
    - `native` 與預設的 `both` 路徑會在可用時傳回可感知供應商的原生命名
  - `textAliases` 帶有精確的斜線別名，例如 `/model` 和 `/m`。
  - `nativeName` 會在存在時帶有可感知供應商的原生指令名稱。
  - `provider` 為選用，且只會影響原生命名與原生 Plugin
    指令可用性。
  - `includeArgs=false` 會在回應中省略序列化的引數中繼資料。
- 操作員可以呼叫 `tools.catalog` (`operator.read`) 以擷取代理的執行階段工具目錄。回應包含分組工具與來源中繼資料：
  - `source`: `core` 或 `plugin`
  - `pluginId`: 當 `source="plugin"` 時的 Plugin 擁有者
  - `optional`: Plugin 工具是否為選用
- 操作員可以呼叫 `tools.effective` (`operator.read`) 以擷取工作階段的執行階段有效工具
  清單。
  - `sessionKey` 為必要。
  - Gateway 會從伺服器端的工作階段衍生受信任的執行階段脈絡，而不是接受
    呼叫端提供的驗證或傳遞脈絡。
  - 回應以工作階段為範圍，並反映目前作用中對話可以立即使用的內容，
    包含核心、Plugin 與通道工具。
- 操作員可以呼叫 `tools.invoke` (`operator.write`) 透過與 `/tools/invoke`
  相同的 Gateway 政策路徑叫用一個可用工具。
  - `name` 為必要。`args`、`sessionKey`、`agentId`、`confirm` 和
    `idempotencyKey` 為選用。
  - 如果 `sessionKey` 和 `agentId` 皆存在，解析出的工作階段代理必須符合
    `agentId`。
  - 回應是面向 SDK 的封套，包含 `ok`、`toolName`、選用的 `output`，以及具型別的
    `error` 欄位。核准或政策拒絕會在承載中傳回 `ok:false`，而不是
    繞過 Gateway 工具政策管線。
- 操作員可以呼叫 `skills.status` (`operator.read`) 以擷取代理可見的
  技能清單。
  - `agentId` 為選用；省略時會讀取預設代理工作區。
  - 回應包含資格、缺少的需求、設定檢查，以及
    經清理的安裝選項，不會暴露原始祕密值。
- 操作員可以呼叫 `skills.search` 和 `skills.detail` (`operator.read`) 取得
  ClawHub 探索中繼資料。
- 操作員可以用兩種模式呼叫 `skills.install` (`operator.admin`)：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 會將
    技能資料夾安裝到預設代理工作區的 `skills/` 目錄。
  - Gateway 安裝程式模式：`{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    會在 Gateway 主機上執行宣告的 `metadata.openclaw.install` 動作。
- 操作員可以用兩種模式呼叫 `skills.update` (`operator.admin`)：
  - ClawHub 模式會更新預設代理工作區中一個已追蹤的 slug，或所有已追蹤的 ClawHub 安裝。
  - 設定模式會修補 `skills.entries.<skillKey>` 值，例如 `enabled`、
    `apiKey` 和 `env`。

### `models.list` 檢視

`models.list` 接受選用的 `view` 參數：

- 省略或 `"default"`：目前的執行階段行為。如果已設定 `agents.defaults.models`，回應會是允許的目錄；否則回應會是完整的 Gateway 目錄。
- `"configured"`：適合挑選器大小的行為。如果已設定 `agents.defaults.models`，它仍會優先。否則回應會使用明確的 `models.providers.*.models` 項目，只有在沒有已設定的模型列時才會退回完整目錄。
- `"all"`：完整的 Gateway 目錄，略過 `agents.defaults.models`。請將此用於診斷與探索 UI，而不是一般模型挑選器。

## Exec 核准

- 當 exec 要求需要核准時，Gateway 會廣播 `exec.approval.requested`。
- 操作員用戶端會透過呼叫 `exec.approval.resolve` 來解析（需要 `operator.approvals` 範圍）。
- 對於 `host=node`，`exec.approval.request` 必須包含 `systemRunPlan`（標準 `argv`/`cwd`/`rawCommand`/工作階段中繼資料）。缺少 `systemRunPlan` 的要求會遭到拒絕。
- 核准後，轉送的 `node.invoke system.run` 呼叫會重用該標準
  `systemRunPlan`，作為具權威性的指令/cwd/工作階段脈絡。
- 如果呼叫端在準備與最終核准的 `system.run` 轉送之間變更 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，Gateway 會拒絕執行，而不是信任遭變更的承載。

## 代理傳遞備援

- `agent` 要求可以包含 `deliver=true` 以請求對外傳遞。
- `bestEffortDeliver=false` 會維持嚴格行為：無法解析或僅限內部的傳遞目標會傳回 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允許在無法解析外部可傳遞路由時，退回僅工作階段執行（例如內部/webchat 工作階段或模糊的多通道設定）。

## 版本控管

- `PROTOCOL_VERSION` 位於 `src/gateway/protocol/schema/protocol-schemas.ts`。
- 用戶端傳送 `minProtocol` + `maxProtocol`；伺服器會拒絕不相符的項目。
- 結構描述與模型會從 TypeBox 定義產生：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 用戶端常數

`src/gateway/client.ts` 中的參考用戶端使用這些預設值。值在
通訊協定 v3 中維持穩定，且是第三方用戶端的預期基準。

| 常數                                      | 預設值                                                | 來源                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| 要求逾時（每個 RPC）                      | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| 預驗證 / 連線挑戰逾時                    | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（config/env 可提高成對的伺服器/用戶端預算）            |
| 初始重新連線退避                          | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| 最大重新連線退避                          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| 裝置權杖關閉後的快速重試限制              | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前的強制停止寬限            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` 預設逾時                  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| 預設 tick 間隔（`hello-ok` 前）            | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick 逾時關閉                             | 靜默超過 `tickIntervalMs * 2` 時使用代碼 `4000`       | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

伺服器會在 `hello-ok` 中公告有效的 `policy.tickIntervalMs`、`policy.maxPayload`
和 `policy.maxBufferedBytes`；用戶端應遵循這些值，
而不是握手前的預設值。

## 驗證

- 共用祕密 Gateway 驗證會使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，取決於已設定的驗證模式。
- 帶有身分的模式，例如 Tailscale Serve
  (`gateway.auth.allowTailscale: true`) 或非回送的
  `gateway.auth.mode: "trusted-proxy"`，會從請求標頭而不是
  `connect.params.auth.*` 滿足連線驗證檢查。
- 私有入口 `gateway.auth.mode: "none"` 會完全略過共用祕密連線驗證；
  請勿在公開／不受信任的入口公開該模式。
- 配對後，Gateway 會簽發一個限定於連線角色 + 範圍的**裝置權杖**。
  它會在 `hello-ok.auth.deviceToken` 中回傳，且用戶端應將其保存供日後連線使用。
- 用戶端應在任何成功連線後保存主要的 `hello-ok.auth.deviceToken`。
- 使用該**已儲存**裝置權杖重新連線時，也應重用該權杖已儲存的
  已核准範圍集合。這會保留已授予的讀取／探測／狀態存取權，
  並避免重新連線時悄悄縮減為較窄的隱含僅管理員範圍。
- 用戶端連線驗證組裝（`src/gateway/client.ts` 中的 `selectConnectAuth`）：
  - `auth.password` 是正交的，設定時一律會轉送。
  - `auth.token` 會依優先順序填入：明確共用權杖優先，
    接著是明確的 `deviceToken`，再來是已儲存的每裝置權杖
    （以 `deviceId` + `role` 為鍵）。
  - `auth.bootstrapToken` 只會在上述項目都未解析出
    `auth.token` 時傳送。共用權杖或任何已解析的裝置權杖都會抑制它。
  - 在一次性的 `AUTH_TOKEN_MISMATCH` 重試中，自動提升已儲存裝置權杖僅限於
    **受信任端點**——回送，或帶有已釘選 `tlsFingerprint` 的 `wss://`。
    未釘選的公開 `wss://` 不符合資格。
- 額外的 `hello-ok.auth.deviceTokens` 項目是啟動交接權杖。
  僅當連線在受信任傳輸上使用啟動驗證時保存它們，例如 `wss://`
  或回送／本機配對。
- 如果用戶端提供**明確**的 `deviceToken` 或明確的 `scopes`，
  該呼叫者要求的範圍集合仍具權威性；快取範圍只會在用戶端重用
  已儲存的每裝置權杖時使用。
- 裝置權杖可透過 `device.token.rotate` 和
  `device.token.revoke` 進行輪替／撤銷（需要 `operator.pairing` 範圍）。
- `device.token.rotate` 會回傳輪替中繼資料。它只會在同裝置呼叫且已使用
  該裝置權杖驗證時回顯替換用的承載權杖，因此僅權杖用戶端可在重新連線前
  保存其替換權杖。共用／管理員輪替不會回顯承載權杖。
- 權杖簽發、輪替和撤銷都受限於該裝置配對項目中記錄的已核准角色集合；
  權杖變更無法擴充或指定配對核准從未授予的裝置角色。
- 對於已配對裝置權杖工作階段，除非呼叫者同時具備 `operator.admin`，
  否則裝置管理限於自身範圍：非管理員呼叫者只能移除／撤銷／輪替
  **自己的**裝置項目。
- `device.token.rotate` 和 `device.token.revoke` 也會以呼叫者目前工作階段範圍
  檢查目標操作者權杖範圍集合。非管理員呼叫者不能輪替或撤銷比自己
  已持有範圍更廣的操作者權杖。
- 驗證失敗會包含 `error.details.code` 加上復原提示：
  - `error.details.canRetryWithDeviceToken`（布林值）
  - `error.details.recommendedNextStep`（`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH` 的用戶端行為：
  - 受信任用戶端可嘗試一次有界重試，並使用快取的每裝置權杖。
  - 如果該重試失敗，用戶端應停止自動重新連線迴圈，並顯示操作者行動指引。

## 裝置身分 + 配對

- Node 應包含由金鑰組指紋衍生的穩定裝置身分（`device.id`）。
- Gateway 會依裝置 + 角色簽發權杖。
- 新裝置 ID 需要配對核准，除非已啟用本機自動核准。
- 配對自動核准以直接 local loopback 連線為中心。
- OpenClaw 也有一條狹窄的後端／容器本機自我連線路徑，用於受信任的
  共用祕密輔助流程。
- 同主機 tailnet 或 LAN 連線仍會被視為遠端配對並需要核准。
- WS 用戶端通常會在 `connect` 期間包含 `device` 身分（操作者 +
  Node）。唯一無裝置的操作者例外是明確信任路徑：
  - `gateway.controlUi.allowInsecureAuth=true`，用於僅限 localhost 的不安全 HTTP 相容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` 操作者控制 UI 驗證。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急破窗，嚴重降低安全性）。
  - 以共用 Gateway 權杖／密碼驗證的直接回送 `gateway-client` 後端 RPC。
- 所有連線都必須簽署伺服器提供的 `connect.challenge` nonce。

### 裝置驗證遷移診斷

對於仍使用挑戰前簽署行為的舊版用戶端，`connect` 現在會在
`error.details.code` 下回傳 `DEVICE_AUTH_*` 詳細碼，並提供穩定的 `error.details.reason`。

常見遷移失敗：

| 訊息                        | details.code                     | details.reason           | 含義                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 用戶端省略了 `device.nonce`（或傳送空白）。        |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 用戶端使用過期／錯誤的 nonce 簽署。               |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 簽章酬載與 v2 酬載不符。                          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 已簽署時間戳超出允許偏差。                        |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 與公開金鑰指紋不符。                  |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開金鑰格式／正規化失敗。                        |

遷移目標：

- 一律等待 `connect.challenge`。
- 簽署包含伺服器 nonce 的 v2 酬載。
- 在 `connect.params.device.nonce` 中傳送相同的 nonce。
- 偏好的簽章酬載是 `v3`，除了裝置／用戶端／角色／範圍／權杖／nonce 欄位外，
  也會繫結 `platform` 和 `deviceFamily`。
- 舊版 `v2` 簽章仍會為相容性而被接受，但已配對裝置的中繼資料釘選
  仍會控制重新連線時的命令政策。

## TLS + 釘選

- TLS 支援 WS 連線。
- 用戶端可選擇性釘選 Gateway 憑證指紋（請參閱 `gateway.tls`
  設定，加上 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`）。

## 範圍

此協定公開**完整 Gateway API**（狀態、頻道、模型、聊天、
代理、工作階段、Node、核准等）。確切表面由
`src/gateway/protocol/schema.ts` 中的 TypeBox 綱要定義。

## 相關

- [橋接協定](/zh-TW/gateway/bridge-protocol)
- [Gateway 作業手冊](/zh-TW/gateway)
