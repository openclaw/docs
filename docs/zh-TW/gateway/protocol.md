---
read_when:
    - 實作或更新 Gateway WS 客戶端
    - 偵錯通訊協定不相符或連線失敗
    - 重新產生協定結構描述/模型
summary: Gateway WebSocket 協定：握手、訊框、版本控制
title: Gateway 通訊協定
x-i18n:
    generated_at: "2026-05-02T02:51:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8295e4e416250e7381393c0aa6a0016719f96552485cf9d56bb3896c9704c4a9
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS 協定是 OpenClaw 的**單一控制平面 + 節點傳輸**。所有用戶端（CLI、網頁 UI、macOS app、iOS/Android 節點、無周邊節點）都透過 WebSocket 連線，並在交握時宣告其**角色** + **範圍**。

## 傳輸

- WebSocket，文字影格搭配 JSON 承載。
- 第一個影格**必須**是 `connect` 請求。
- 連線前影格上限為 64 KiB。成功交握後，用戶端應遵循 `hello-ok.policy.maxPayload` 和 `hello-ok.policy.maxBufferedBytes` 限制。啟用診斷時，過大的傳入影格和緩慢的傳出緩衝區會在 gateway 關閉或丟棄受影響影格前發出 `payload.large` 事件。這些事件會保留大小、限制、介面和安全原因代碼。它們不會保留訊息本文、附件內容、原始影格本文、權杖、Cookie 或祕密值。

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

當 Gateway 仍在完成啟動 sidecar 時，`connect` 請求可能會傳回可重試的 `UNAVAILABLE` 錯誤，其中 `details.reason` 設為 `"startup-sidecars"`，並包含 `retryAfterMs`。用戶端應在整體連線預算內重試該回應，而不是將其顯示為終止性的交握失敗。

`server`、`features`、`snapshot` 和 `policy` 都是 schema（`src/gateway/protocol/schema/frames.ts`）要求的欄位。`auth` 也同樣為必要欄位，並回報協商後的角色/範圍。`canvasHostUrl` 為選用欄位。

未核發裝置權杖時，`hello-ok.auth` 會回報協商後的權限，不含權杖欄位：

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

受信任的同程序後端用戶端（`client.id: "gateway-client"`、`client.mode: "backend"`）在以共用 gateway 權杖/密碼進行驗證時，可於直接 loopback 連線上省略 `device`。此路徑保留給內部控制平面 RPC 使用，並避免過期的 CLI/裝置配對基準阻擋本機後端工作，例如子代理工作階段更新。遠端用戶端、瀏覽器來源用戶端、節點用戶端，以及明確的裝置權杖/裝置身分用戶端，仍會使用一般的配對與範圍升級檢查。

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

在受信任的啟動交接期間，`hello-ok.auth` 也可能在 `deviceTokens` 中包含其他受界定的角色項目：

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

對於內建的節點/operator 啟動流程，主要節點權杖會維持 `scopes: []`，任何交接出的 operator 權杖則維持限縮在啟動 operator 允許清單（`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`）內。啟動範圍檢查會維持角色前綴：operator 項目只滿足 operator 請求，而非 operator 角色仍需具備自身角色前綴下的範圍。

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

## 影格格式

- **請求**：`{type:"req", id, method, params}`
- **回應**：`{type:"res", id, ok, payload|error}`
- **事件**：`{type:"event", event, payload, seq?, stateVersion?}`

具有副作用的方法需要**冪等性金鑰**（請參閱 schema）。

## 角色 + 範圍

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

帶有 `includeSecrets: true` 的 `talk.config` 需要 `operator.talk.secrets`（或 `operator.admin`）。

Plugin 註冊的 gateway RPC 方法可能會要求自己的 operator 範圍，但保留的核心管理前綴（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）一律解析為 `operator.admin`。

方法範圍只是第一道關卡。某些透過 `chat.send` 到達的斜線命令會在其上套用更嚴格的命令層級檢查。例如，持久性 `/config set` 和 `/config unset` 寫入需要 `operator.admin`。

`node.pair.approve` 也會在基礎方法範圍之外，於核准時額外執行範圍檢查：

- 無命令請求：`operator.pairing`
- 含非 exec 節點命令的請求：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的請求：`operator.pairing` + `operator.admin`

### 能力/命令/權限（節點）

節點在連線時宣告能力主張：

- `caps`：高階能力類別。
- `commands`：用於 invoke 的命令允許清單。
- `permissions`：細粒度切換項（例如 `screen.record`、`camera.capture`）。

Gateway 會將這些視為**主張**，並強制執行伺服器端允許清單。

## Presence

- `system-presence` 傳回以裝置身分為鍵的項目。
- Presence 項目包含 `deviceId`、`roles` 和 `scopes`，因此 UI 即使在裝置同時以 **operator** 和 **node** 連線時，也能為每個裝置顯示單一列。
- `node.list` 包含選用的 `lastSeenAtMs` 和 `lastSeenReason` 欄位。已連線節點會以 `connect` 作為原因，將目前連線時間回報為 `lastSeenAtMs`；當受信任的節點事件更新其配對中繼資料時，已配對節點也可以回報持久的背景 Presence。

### 節點背景存活事件

節點可呼叫 `node.event` 並帶上 `event: "node.presence.alive"`，以記錄已配對節點在背景喚醒期間仍存活，而不將其標記為已連線。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是封閉列舉：`background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual` 或 `connect`。未知的 trigger 字串會在持久化前由 gateway 正規化為 `background`。此事件僅對已驗證的節點裝置工作階段具有持久性；無裝置或未配對的工作階段會傳回 `handled: false`。

成功的 gateway 會傳回結構化結果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

較舊的 gateway 仍可能針對 `node.event` 傳回 `{ "ok": true }`；用戶端應將其視為已確認的 RPC，而不是持久 Presence 儲存。

## 廣播事件範圍限定

伺服器推送的 WebSocket 廣播事件會受範圍管制，因此限於配對範圍或僅限節點的工作階段不會被動接收工作階段內容。

- **聊天、代理與工具結果影格**（包括串流的 `agent` 事件和工具呼叫結果）至少需要 `operator.read`。沒有 `operator.read` 的工作階段會完全略過這些影格。
- **Plugin 定義的 `plugin.*` 廣播**會根據 Plugin 註冊方式，限制為 `operator.write` 或 `operator.admin`。
- **狀態與傳輸事件**（`heartbeat`、`presence`、`tick`、連線/中斷連線生命週期等）維持不受限制，因此每個已驗證工作階段都能觀察傳輸健康狀態。
- **未知的廣播事件家族**預設受範圍管制（失敗關閉），除非已註冊的處理常式明確放寬限制。

每個用戶端連線會保留自己的每用戶端序號，因此即使不同用戶端看到事件串流中不同的範圍篩選子集，廣播仍會在該 socket 上維持單調排序。

## 常見 RPC 方法家族

公開 WS 介面比上述交握/驗證範例更廣。這不是產生出的傾印 — `hello-ok.features.methods` 是從 `src/gateway/server-methods-list.ts` 加上已載入的 Plugin/通道方法匯出所建構的保守探索清單。請將其視為功能探索，而不是 `src/gateway/server-methods/*.ts` 的完整列舉。

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` 傳回快取或新探測的 gateway 健康狀態快照。
    - `diagnostics.stability` 傳回近期受界定的診斷穩定性記錄器。它會保留事件名稱、計數、位元組大小、記憶體讀數、佇列/工作階段狀態、通道/Plugin 名稱和工作階段 ID 等操作中繼資料。它不會保留聊天文字、Webhook 本文、工具輸出、原始請求或回應本文、權杖、Cookie 或祕密值。需要 operator 讀取範圍。
    - `status` 傳回 `/status` 風格的 gateway 摘要；敏感欄位只會納入具 admin 範圍的 operator 用戶端。
    - `gateway.identity.get` 傳回 relay 和配對流程使用的 gateway 裝置身分。
    - `system-presence` 傳回目前已連線 operator/node 裝置的 Presence 快照。
    - `system-event` 附加系統事件，並可更新/廣播 Presence 內容。
    - `last-heartbeat` 傳回最新持久化的 Heartbeat 事件。
    - `set-heartbeats` 切換 gateway 上的 Heartbeat 處理。

  </Accordion>

  <Accordion title="模型與用量">
    - `models.list` 會傳回執行階段允許的模型目錄。傳入 `{ "view": "configured" }` 可取得適合選擇器大小的已設定模型（先是 `agents.defaults.models`，再來是 `models.providers.*.models`），或傳入 `{ "view": "all" }` 取得完整目錄。
    - `usage.status` 會傳回提供者用量時段／剩餘配額摘要。
    - `usage.cost` 會傳回日期範圍內的彙總成本用量摘要。
    - `doctor.memory.status` 會傳回作用中預設代理程式工作區的向量記憶體／快取嵌入就緒狀態。只有在呼叫端明確想要即時嵌入提供者 ping 時，才傳入 `{ "probe": true }` 或 `{ "deep": true }`。
    - `doctor.memory.remHarness` 會傳回供遠端控制平面用戶端使用的有界唯讀 REM harness 預覽。它可以包含工作區路徑、記憶體片段、已渲染的 grounded markdown，以及深度提升候選項目，因此呼叫端需要 `operator.read`。
    - `sessions.usage` 會傳回每個工作階段的用量摘要。
    - `sessions.usage.timeseries` 會傳回單一工作階段的時間序列用量。
    - `sessions.usage.logs` 會傳回單一工作階段的用量記錄項目。

  </Accordion>

  <Accordion title="通道與登入輔助程式">
    - `channels.status` 會傳回內建 + 隨附通道／Plugin 狀態摘要。
    - `channels.logout` 會登出支援登出的特定通道／帳戶。
    - `web.login.start` 會為目前具 QR 功能的網頁通道提供者啟動 QR／網頁登入流程。
    - `web.login.wait` 會等待該 QR／網頁登入流程完成，並在成功時啟動通道。
    - `push.test` 會傳送測試 APNs 推播到已註冊的 iOS Node。
    - `voicewake.get` 會傳回已儲存的喚醒詞觸發條件。
    - `voicewake.set` 會更新喚醒詞觸發條件並廣播變更。

  </Accordion>

  <Accordion title="訊息與記錄">
    - `send` 是在聊天執行器之外，針對通道／帳戶／對話串目標傳送的直接外送 RPC。
    - `logs.tail` 會傳回已設定 Gateway 檔案記錄尾端，並支援游標／限制與最大位元組控制。

  </Accordion>

  <Accordion title="Talk 與 TTS">
    - `talk.config` 會傳回有效的 Talk 設定 payload；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.mode` 會為 WebChat／Control UI 用戶端設定／廣播目前的 Talk 模式狀態。
    - `talk.speak` 會透過作用中的 Talk 語音提供者合成語音。
    - `tts.status` 會傳回 TTS 啟用狀態、作用中提供者、備援提供者，以及提供者設定狀態。
    - `tts.providers` 會傳回可見的 TTS 提供者清單。
    - `tts.enable` 和 `tts.disable` 會切換 TTS 偏好設定狀態。
    - `tts.setProvider` 會更新偏好的 TTS 提供者。
    - `tts.convert` 會執行一次性的文字轉語音轉換。

  </Accordion>

  <Accordion title="機密、設定、更新與精靈">
    - `secrets.reload` 會重新解析作用中的 SecretRefs，並且只在完整成功時替換執行階段機密狀態。
    - `secrets.resolve` 會解析特定命令／目標集合的命令目標機密指派。
    - `config.get` 會傳回目前的設定快照與雜湊。
    - `config.set` 會寫入已驗證的設定 payload。
    - `config.patch` 會合併部分設定更新。
    - `config.apply` 會驗證 + 取代完整設定 payload。
    - `config.schema` 會傳回 Control UI 與 CLI 工具使用的即時設定 schema payload：schema、`uiHints`、版本與產生中繼資料，包括執行階段可載入時的 Plugin + 通道 schema 中繼資料。該 schema 會包含欄位 `title` / `description` 中繼資料，這些中繼資料衍生自 UI 使用的相同標籤與說明文字；在存在相符欄位文件時，也包含巢狀物件、萬用字元、陣列項目，以及 `anyOf` / `oneOf` / `allOf` 組合分支。
    - `config.schema.lookup` 會為單一設定路徑傳回路徑範圍內的查找 payload：正規化路徑、淺層 schema 節點、相符提示 + `hintPath`，以及供 UI／CLI 向下鑽研的直接子項摘要。查找 schema 節點會保留面向使用者的文件與常見驗證欄位（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、數值／字串／陣列／物件邊界，以及 `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` 等旗標）。子項摘要會揭露 `key`、正規化 `path`、`type`、`required`、`hasChildren`，以及相符的 `hint` / `hintPath`。
    - `update.run` 會執行 Gateway 更新流程，並且只在更新本身成功時排程重新啟動。套件管理器更新會在套件替換後強制進行非延後、無冷卻時間的更新重新啟動，讓舊 Gateway 程序不會繼續從已替換的 `dist` 樹延遲載入。
    - `update.status` 會傳回最新的快取更新重新啟動 sentinel，包括可用時重新啟動後的執行中版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 會透過 WS RPC 暴露入門精靈。

  </Accordion>

  <Accordion title="代理程式與工作區輔助程式">
    - `agents.list` 會傳回已設定的代理程式項目，包括有效模型與執行階段中繼資料。
    - `agents.create`、`agents.update` 和 `agents.delete` 會管理代理程式記錄與工作區接線。
    - `agents.files.list`、`agents.files.get` 和 `agents.files.set` 會管理為代理程式暴露的啟動工作區檔案。
    - `artifacts.list`、`artifacts.get` 和 `artifacts.download` 會在明確的 `sessionKey`、`runId` 或 `taskId` 範圍內，暴露衍生自逐字稿的成品摘要與下載。執行與任務查詢會在伺服器端解析所屬工作階段，並且只傳回具有相符來源的逐字稿媒體；不安全或本機 URL 來源會傳回不支援的下載，而不是在伺服器端擷取。
    - `agent.identity.get` 會傳回代理程式或工作階段的有效助理身分。
    - `agent.wait` 會等待一次執行完成，並在可用時傳回終端快照。

  </Accordion>

  <Accordion title="工作階段控制">
    - `sessions.list` 會傳回目前的工作階段索引；在已設定代理程式執行階段後端時，包含每列 `agentRuntime` 中繼資料。
    - `sessions.subscribe` 和 `sessions.unsubscribe` 會為目前 WS 用戶端切換工作階段變更事件訂閱。
    - `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 會為單一工作階段切換逐字稿／訊息事件訂閱。
    - `sessions.preview` 會傳回特定工作階段鍵的有界逐字稿預覽。
    - `sessions.resolve` 會解析或正規化工作階段目標。
    - `sessions.create` 會建立新的工作階段項目。
    - `sessions.send` 會將訊息傳送到現有工作階段。
    - `sessions.steer` 是作用中工作階段的中斷並引導變體。
    - `sessions.abort` 會中止工作階段的作用中工作。呼叫端可以傳入 `key` 加上選用的 `runId`，或只為 Gateway 可解析到工作階段的作用中執行傳入 `runId`。
    - `sessions.patch` 會更新工作階段中繼資料／覆寫，並回報已解析的正規模型加上有效的 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 和 `sessions.compact` 會執行工作階段維護。
    - `sessions.get` 會傳回完整儲存的工作階段列。
    - 聊天執行仍使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。`chat.history` 會針對 UI 用戶端進行顯示正規化：從可見文字中移除行內指令標籤、移除純文字工具呼叫 XML payload（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及截斷的工具呼叫區塊）和外洩的 ASCII／全形模型控制 token，省略純靜默 token 的助理列，例如完全相符的 `NO_REPLY` / `no_reply`，且過大的列可以替換為預留位置。

  </Accordion>

  <Accordion title="裝置配對與裝置 token">
    - `device.pair.list` 會傳回待處理與已核准的已配對裝置。
    - `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 會管理裝置配對記錄。
    - `device.token.rotate` 會在其已核准角色與呼叫端範圍界限內輪替已配對裝置 token。
    - `device.token.revoke` 會在其已核准角色與呼叫端範圍界限內撤銷已配對裝置 token。

  </Accordion>

  <Accordion title="Node 配對、叫用與待處理工作">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove` 和 `node.pair.verify` 涵蓋 Node 配對與啟動驗證。
    - `node.list` 和 `node.describe` 會傳回已知／已連線 Node 狀態。
    - `node.rename` 會更新已配對 Node 標籤。
    - `node.invoke` 會將命令轉送到已連線 Node。
    - `node.invoke.result` 會傳回叫用要求的結果。
    - `node.event` 會將 Node 來源事件帶回 Gateway。
    - `node.canvas.capability.refresh` 會重新整理範圍內的畫布能力 token。
    - `node.pending.pull` 和 `node.pending.ack` 是已連線 Node 佇列 API。
    - `node.pending.enqueue` 和 `node.pending.drain` 會管理離線／中斷連線 Node 的持久待處理工作。

  </Accordion>

  <Accordion title="核准系列">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 涵蓋一次性 exec 核准要求，以及待處理核准查找／重播。
    - `exec.approval.waitDecision` 會等待一個待處理 exec 核准並傳回最終決策（逾時則為 `null`）。
    - `exec.approvals.get` 和 `exec.approvals.set` 會管理 Gateway exec 核准政策快照。
    - `exec.approvals.node.get` 和 `exec.approvals.node.set` 會透過 Node relay 命令管理 Node 本機 exec 核准政策。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 涵蓋 Plugin 定義的核准流程。

  </Accordion>

  <Accordion title="自動化、Skills 與工具">
    - 自動化：`wake` 會排程立即或下一次 Heartbeat 的喚醒文字注入；`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 會管理排程工作。
    - Skills 與工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 常見事件系列

- `chat`：UI 聊天更新，例如 `chat.inject` 與其他僅逐字稿聊天
  事件。
- `session.message` 和 `session.tool`：已訂閱工作階段的逐字稿／事件串流
  更新。
- `sessions.changed`：工作階段索引或中繼資料已變更。
- `presence`：系統 presence 快照更新。
- `tick`：週期性 keepalive／存活事件。
- `health`：Gateway 健康狀態快照更新。
- `heartbeat`：Heartbeat 事件串流更新。
- `cron`：Cron 執行／工作變更事件。
- `shutdown`：Gateway 關閉通知。
- `node.pair.requested` / `node.pair.resolved`：Node 配對生命週期。
- `node.invoke.request`：Node 叫用要求廣播。
- `device.pair.requested` / `device.pair.resolved`：已配對裝置生命週期。
- `voicewake.changed`：喚醒詞觸發條件設定已變更。
- `exec.approval.requested` / `exec.approval.resolved`：exec 核准
  生命週期。
- `plugin.approval.requested` / `plugin.approval.resolved`：Plugin 核准
  生命週期。

### Node 輔助方法

- Node 可以呼叫 `skills.bins` 來擷取目前的 skill 可執行檔清單，
  以用於自動允許檢查。

### 操作者輔助方法

- 操作員可以呼叫 `commands.list`（`operator.read`）來擷取代理的執行階段
  命令清單。
  - `agentId` 為選用；省略即可讀取預設代理工作區。
  - `scope` 控制主要 `name` 目標的介面：
    - `text` 回傳不含前置 `/` 的主要文字命令權杖
    - `native` 與預設的 `both` 路徑會在可用時回傳具提供者感知能力的原生命令名稱
  - `textAliases` 攜帶精確的斜線別名，例如 `/model` 和 `/m`。
  - `nativeName` 攜帶具提供者感知能力的原生命令名稱（若存在）。
  - `provider` 為選用，且只會影響原生命名以及原生 Plugin
    命令可用性。
  - `includeArgs=false` 會從回應中省略序列化的引數中繼資料。
- 操作員可以呼叫 `tools.catalog`（`operator.read`）來擷取代理的執行階段工具目錄。回應包含分組工具與來源中繼資料：
  - `source`：`core` 或 `plugin`
  - `pluginId`：當 `source="plugin"` 時的 Plugin 擁有者
  - `optional`：Plugin 工具是否為選用
- 操作員可以呼叫 `tools.effective`（`operator.read`）來擷取工作階段的執行階段有效工具
  清單。
  - `sessionKey` 為必填。
  - Gateway 會從伺服器端工作階段推導可信任的執行階段脈絡，而不是接受
    呼叫端提供的驗證或傳遞脈絡。
  - 回應以工作階段為範圍，並反映目前作用中對話可立即使用的內容，
    包含核心、Plugin 和通道工具。
- 操作員可以呼叫 `tools.invoke`（`operator.write`），透過與 `/tools/invoke`
  相同的 Gateway 原則路徑叫用一個可用工具。
  - `name` 為必填。`args`、`sessionKey`、`agentId`、`confirm` 和
    `idempotencyKey` 為選用。
  - 如果同時提供 `sessionKey` 和 `agentId`，解析出的工作階段代理必須符合
    `agentId`。
  - 回應是面向 SDK 的封套，包含 `ok`、`toolName`、選用的 `output`，以及具型別的
    `error` 欄位。核准或原則拒絕會在酬載中回傳 `ok:false`，而不是
    繞過 Gateway 工具原則管線。
- 操作員可以呼叫 `skills.status`（`operator.read`）來擷取代理可見的
  Skills 清單。
  - `agentId` 為選用；省略即可讀取預設代理工作區。
  - 回應包含資格、缺少的需求、設定檢查，以及
    經過清理的安裝選項，不會暴露原始秘密值。
- 操作員可以呼叫 `skills.search` 和 `skills.detail`（`operator.read`）取得
  ClawHub 探索中繼資料。
- 操作員可以用兩種模式呼叫 `skills.install`（`operator.admin`）：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 會將
    Skills 資料夾安裝到預設代理工作區的 `skills/` 目錄。
  - Gateway 安裝器模式：`{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    會在 Gateway 主機上執行宣告的 `metadata.openclaw.install` 動作。
- 操作員可以用兩種模式呼叫 `skills.update`（`operator.admin`）：
  - ClawHub 模式會更新預設代理工作區中一個受追蹤的 slug，或所有受追蹤的 ClawHub 安裝項目。
  - 設定模式會修補 `skills.entries.<skillKey>` 值，例如 `enabled`、
    `apiKey` 和 `env`。

### `models.list` 檢視

`models.list` 接受選用的 `view` 參數：

- 省略或 `"default"`：目前的執行階段行為。如果已設定 `agents.defaults.models`，回應會是允許的目錄；否則回應會是完整 Gateway 目錄。
- `"configured"`：適合選擇器大小的行為。如果已設定 `agents.defaults.models`，它仍會優先。否則回應會使用明確的 `models.providers.*.models` 項目，只有在沒有任何已設定的模型列時才會退回完整目錄。
- `"all"`：完整 Gateway 目錄，略過 `agents.defaults.models`。這應用於診斷與探索 UI，而非一般模型選擇器。

## 執行核准

- 當 exec 請求需要核准時，Gateway 會廣播 `exec.approval.requested`。
- 操作員用戶端透過呼叫 `exec.approval.resolve` 來解析（需要 `operator.approvals` 範圍）。
- 對於 `host=node`，`exec.approval.request` 必須包含 `systemRunPlan`（規範的 `argv`/`cwd`/`rawCommand`/工作階段中繼資料）。缺少 `systemRunPlan` 的請求會被拒絕。
- 核准後，轉送的 `node.invoke system.run` 呼叫會重用該規範的
  `systemRunPlan`，作為權威的命令/cwd/工作階段脈絡。
- 如果呼叫端在準備與最終已核准的 `system.run` 轉送之間變更 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，Gateway 會拒絕執行，而不是信任變更後的酬載。

## 代理傳遞後援

- `agent` 請求可以包含 `deliver=true` 以要求對外傳遞。
- `bestEffortDeliver=false` 會維持嚴格行為：無法解析或僅限內部的傳遞目標會回傳 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允許在無法解析外部可傳遞路由時，後援為僅工作階段執行（例如內部/webchat 工作階段或曖昧的多通道設定）。

## 版本控管

- `PROTOCOL_VERSION` 位於 `src/gateway/protocol/schema/protocol-schemas.ts`。
- 用戶端傳送 `minProtocol` + `maxProtocol`；伺服器會拒絕不相符的版本。
- 結構描述與模型由 TypeBox 定義產生：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 用戶端常數

`src/gateway/client.ts` 中的參考用戶端使用這些預設值。這些值在
協定 v3 中保持穩定，並且是第三方用戶端的預期基準。

| 常數                                      | 預設值                                                | 來源                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| 請求逾時（每個 RPC）                      | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| 預先驗證 / 連線挑戰逾時                  | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（config/env 可提高成對的伺服器/用戶端預算）            |
| 初始重新連線退避                          | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| 最大重新連線退避                          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| 裝置權杖關閉後的快速重試限制              | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前的強制停止寬限時間         | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` 預設逾時                  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| 預設 tick 間隔（`hello-ok` 前）            | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| tick 逾時關閉                             | 當靜默超過 `tickIntervalMs * 2` 時使用代碼 `4000`     | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

伺服器會在 `hello-ok` 中公告有效的 `policy.tickIntervalMs`、`policy.maxPayload`
與 `policy.maxBufferedBytes`；用戶端應遵循這些值，
而不是預先握手的預設值。

## 驗證

- Shared-secret Gateway 驗證會使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，取決於設定的驗證模式。
