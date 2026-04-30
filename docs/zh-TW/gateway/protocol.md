---
read_when:
    - 實作或更新 Gateway WS 用戶端
    - 偵錯協定不相符或連線失敗
    - 重新產生協定結構描述/模型
summary: Gateway WebSocket 協定：交握、訊框、版本管理
title: Gateway 通訊協定
x-i18n:
    generated_at: "2026-04-30T03:08:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d922e9b4b778c333873e551498b905461f30f944e809555b45669ae2f5c404
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS 協定是 OpenClaw 的**單一控制平面 + 節點傳輸**。所有用戶端（CLI、網頁 UI、macOS app、iOS/Android 節點、無頭節點）都透過 WebSocket 連線，並在握手時宣告其**角色** + **範圍**。

## 傳輸

- WebSocket，文字訊框搭配 JSON 承載。
- 第一個訊框**必須**是 `connect` 請求。
- 連線前訊框上限為 64 KiB。握手成功後，用戶端應遵循 `hello-ok.policy.maxPayload` 和 `hello-ok.policy.maxBufferedBytes` 限制。啟用診斷時，過大的入站訊框與緩慢的出站緩衝區會在 gateway 關閉或捨棄受影響訊框前發出 `payload.large` 事件。這些事件會保留大小、限制、介面與安全原因代碼。不會保留訊息本文、附件內容、原始訊框本文、權杖、Cookie 或祕密值。

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

當 Gateway 仍在完成啟動附屬程序時，`connect` 請求可能會傳回可重試的 `UNAVAILABLE` 錯誤，且 `details.reason` 設為 `"startup-sidecars"` 並包含 `retryAfterMs`。用戶端應在其整體連線預算內重試該回應，而不是將其呈現為終止性的握手失敗。

`server`、`features`、`snapshot` 和 `policy` 都是 schema（`src/gateway/protocol/schema/frames.ts`）要求的欄位。`auth` 也為必要欄位，並回報協商後的角色/範圍。`canvasHostUrl` 為選用欄位。

未簽發裝置權杖時，`hello-ok.auth` 會回報協商後的權限，且不含權杖欄位：

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

受信任的同行程後端用戶端（`client.id: "gateway-client"`、`client.mode: "backend"`）在使用共用 Gateway 權杖/密碼驗證的直接 loopback 連線上，可以省略 `device`。此路徑保留給內部控制平面 RPC，並避免過期的 CLI/裝置配對基準阻擋本機後端工作，例如子代理工作階段更新。遠端用戶端、瀏覽器來源用戶端、節點用戶端，以及明確的裝置權杖/裝置身分用戶端，仍會使用一般配對與範圍升級檢查。

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

在受信任的啟動交接期間，`hello-ok.auth` 也可能在 `deviceTokens` 中包含其他受限角色項目：

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

對於內建節點/操作員啟動流程，主要節點權杖會維持 `scopes: []`，任何交接的操作員權杖則會受限於啟動操作員允許清單（`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`）。啟動範圍檢查仍以角色前綴為準：操作員項目只會滿足操作員請求，非操作員角色仍需要其自身角色前綴下的範圍。

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

## 訊框格式

- **請求**：`{type:"req", id, method, params}`
- **回應**：`{type:"res", id, ok, payload|error}`
- **事件**：`{type:"event", event, payload, seq?, stateVersion?}`

具有副作用的方法需要**冪等性金鑰**（請參閱 schema）。

## 角色 + 範圍

### 角色

- `operator` = 控制平面用戶端（CLI/UI/自動化）。
- `node` = 能力主機（camera/screen/canvas/system.run）。

### 範圍（操作員）

常見範圍：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` 搭配 `includeSecrets: true` 時需要 `operator.talk.secrets`（或 `operator.admin`）。

由 Plugin 註冊的 Gateway RPC 方法可以要求自己的操作員範圍，但保留的核心管理前綴（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）一律解析為 `operator.admin`。

方法範圍只是第一道關卡。透過 `chat.send` 觸達的部分斜線指令會在其上套用更嚴格的指令層級檢查。例如，持久性 `/config set` 和 `/config unset` 寫入需要 `operator.admin`。

`node.pair.approve` 在基本方法範圍之外，還有額外的核准時範圍檢查：

- 不含指令的請求：`operator.pairing`
- 帶有非 exec 節點指令的請求：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的請求：`operator.pairing` + `operator.admin`

### 能力/指令/權限（節點）

節點會在連線時宣告能力主張：

- `caps`：高階能力類別。
- `commands`：供呼叫使用的指令允許清單。
- `permissions`：細粒度開關（例如 `screen.record`、`camera.capture`）。

Gateway 會將這些視為**主張**，並強制執行伺服器端允許清單。

## 在線狀態

- `system-presence` 會傳回以裝置身分為鍵的項目。
- 在線狀態項目包含 `deviceId`、`roles` 和 `scopes`，因此即使同一裝置同時以**操作員**和**節點**身分連線，介面也能為每個裝置顯示單一列。
- `node.list` 包含選用的 `lastSeenAtMs` 和 `lastSeenReason` 欄位。已連線節點會將目前連線時間回報為 `lastSeenAtMs`，原因為 `connect`；配對節點也可以在受信任的節點事件更新其配對中繼資料時，回報持久背景在線狀態。

### Node 背景存活事件

Node 可以使用 `event: "node.presence.alive"` 呼叫 `node.event`，以記錄配對節點在背景喚醒期間仍存活，而不將其標記為已連線。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是封閉列舉：`background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual` 或 `connect`。未知觸發字串會由 gateway 在持久化前正規化為 `background`。此事件只會針對已驗證的節點裝置工作階段持久保存；無裝置或未配對的工作階段會傳回 `handled: false`。

成功的 Gateway 會傳回結構化結果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

較舊的 Gateway 對 `node.event` 可能仍會傳回 `{ "ok": true }`；用戶端應將其視為已確認的 RPC，而非在線狀態已持久保存。

## 廣播事件範圍控管

伺服器推送的 WebSocket 廣播事件會受範圍控管，避免僅具配對範圍或僅節點的工作階段被動收到工作階段內容。

- **聊天、代理與工具結果訊框**（包括串流的 `agent` 事件與工具呼叫結果）至少需要 `operator.read`。沒有 `operator.read` 的工作階段會完全略過這些訊框。
- **Plugin 定義的 `plugin.*` 廣播**會依照該 Plugin 的註冊方式，受 `operator.write` 或 `operator.admin` 控管。
- **狀態與傳輸事件**（`heartbeat`、`presence`、`tick`、連線/斷線生命週期等）維持不受限制，讓每個已驗證工作階段都能觀察傳輸健康狀態。
- **未知廣播事件族**預設會受範圍控管（預設封閉），除非已註冊處理器明確放寬限制。

每個用戶端連線都會保有自己的個別用戶端序號，因此即使不同用戶端看到事件串流中不同的範圍過濾子集，廣播也能在該通訊端上保留單調遞增排序。

## 常見 RPC 方法族

公開 WS 介面比上述握手/驗證範例更廣。這不是自動產生的完整清單；`hello-ok.features.methods` 是從 `src/gateway/server-methods-list.ts` 加上已載入的 Plugin/頻道方法匯出所建立的保守探索清單。請將它視為功能探索，而不是 `src/gateway/server-methods/*.ts` 的完整列舉。

<AccordionGroup>
  <Accordion title="系統與身分">
    - `health` 會傳回快取或新偵測的 Gateway 健康狀態快照。
    - `diagnostics.stability` 會傳回近期有界限的診斷穩定性記錄器。它會保留事件名稱、計數、位元組大小、記憶體讀數、佇列/工作階段狀態、頻道/Plugin 名稱與工作階段 ID 等作業中繼資料。不會保留聊天文字、Webhook 本文、工具輸出、原始請求或回應本文、權杖、Cookie 或祕密值。需要操作員讀取範圍。
    - `status` 會傳回 `/status` 風格的 Gateway 摘要；敏感欄位只會包含給具備管理範圍的操作員用戶端。
    - `gateway.identity.get` 會傳回 relay 與配對流程使用的 Gateway 裝置身分。
    - `system-presence` 會傳回已連線操作員/節點裝置目前的在線狀態快照。
    - `system-event` 會附加系統事件，並可更新/廣播在線狀態內容。
    - `last-heartbeat` 會傳回最新持久保存的 Heartbeat 事件。
    - `set-heartbeats` 會切換 Gateway 上的 Heartbeat 處理。

  </Accordion>

  <Accordion title="模型與用量">
    - `models.list` 會傳回執行階段允許的模型目錄。傳入 `{ "view": "configured" }` 可取得適合選擇器顯示的已設定模型（先列 `agents.defaults.models`，再列 `models.providers.*.models`），或傳入 `{ "view": "all" }` 取得完整目錄。
    - `usage.status` 會傳回提供者用量時段／剩餘配額摘要。
    - `usage.cost` 會傳回日期範圍內的彙總成本用量摘要。
    - `doctor.memory.status` 會傳回作用中預設代理工作區的向量記憶體／快取嵌入就緒狀態。只有在呼叫者明確想要即時偵測嵌入提供者時，才傳入 `{ "probe": true }` 或 `{ "deep": true }`。
    - `doctor.memory.remHarness` 會為遠端控制平面用戶端傳回有界、唯讀的 REM 測試工具預覽。它可能包含工作區路徑、記憶體片段、已轉譯且具依據的 Markdown，以及深度提升候選項，因此呼叫者需要 `operator.read`。
    - `sessions.usage` 會傳回每個工作階段的用量摘要。
    - `sessions.usage.timeseries` 會傳回單一工作階段的時間序列用量。
    - `sessions.usage.logs` 會傳回單一工作階段的用量記錄項目。

  </Accordion>

  <Accordion title="頻道與登入輔助工具">
    - `channels.status` 會傳回內建與隨附頻道／Plugin 狀態摘要。
    - `channels.logout` 會登出特定頻道／帳號，前提是該頻道支援登出。
    - `web.login.start` 會為目前具備 QR 能力的網頁頻道提供者啟動 QR／網頁登入流程。
    - `web.login.wait` 會等待該 QR／網頁登入流程完成，並在成功時啟動頻道。
    - `push.test` 會向已註冊的 iOS Node 傳送測試 APNs 推播。
    - `voicewake.get` 會傳回已儲存的喚醒詞觸發器。
    - `voicewake.set` 會更新喚醒詞觸發器並廣播變更。

  </Accordion>

  <Accordion title="訊息與記錄">
    - `send` 是直接對外投遞 RPC，用於在聊天執行器之外進行以頻道／帳號／對話串為目標的傳送。
    - `logs.tail` 會傳回已設定的 Gateway 檔案記錄尾端，並提供游標／限制與最大位元組控制。

  </Accordion>

  <Accordion title="Talk 與 TTS">
    - `talk.config` 會傳回有效的 Talk 設定承載；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.mode` 會為 WebChat/Control UI 用戶端設定／廣播目前的 Talk 模式狀態。
    - `talk.speak` 會透過作用中的 Talk 語音提供者合成語音。
    - `tts.status` 會傳回 TTS 啟用狀態、作用中提供者、備援提供者，以及提供者設定狀態。
    - `tts.providers` 會傳回可見的 TTS 提供者清單。
    - `tts.enable` 與 `tts.disable` 會切換 TTS 偏好設定狀態。
    - `tts.setProvider` 會更新偏好的 TTS 提供者。
    - `tts.convert` 會執行一次性文字轉語音轉換。

  </Accordion>

  <Accordion title="秘密、設定、更新與精靈">
    - `secrets.reload` 會重新解析作用中的 SecretRefs，並且只有在完全成功時才替換執行階段秘密狀態。
    - `secrets.resolve` 會解析特定命令／目標集合的命令目標秘密指派。
    - `config.get` 會傳回目前的設定快照與雜湊。
    - `config.set` 會寫入已驗證的設定承載。
    - `config.patch` 會合併部分設定更新。
    - `config.apply` 會驗證並取代完整設定承載。
    - `config.schema` 會傳回 Control UI 與 CLI 工具使用的即時設定結構描述承載：結構描述、`uiHints`、版本與產生中繼資料，當執行階段可以載入時，還包括 Plugin 與頻道結構描述中繼資料。結構描述包含欄位 `title` / `description` 中繼資料，這些中繼資料衍生自 UI 使用的相同標籤與說明文字；當存在相符欄位文件時，也包含巢狀物件、萬用字元、陣列項目，以及 `anyOf` / `oneOf` / `allOf` 組合分支。
    - `config.schema.lookup` 會為單一設定路徑傳回限定路徑範圍的查詢承載：正規化路徑、淺層結構描述節點、相符提示與 `hintPath`，以及供 UI/CLI 下鑽的直接子項摘要。查詢結構描述節點會保留面向使用者的文件與常見驗證欄位（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、數值／字串／陣列／物件邊界，以及像 `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` 這類旗標）。子項摘要會公開 `key`、正規化 `path`、`type`、`required`、`hasChildren`，以及相符的 `hint` / `hintPath`。
    - `update.run` 會執行 Gateway 更新流程，且只有在更新本身成功時才排程重新啟動。
    - `update.status` 會傳回最新的快取更新重新啟動哨兵，包含可用時重新啟動後正在執行的版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 與 `wizard.cancel` 會透過 WS RPC 公開入門精靈。

  </Accordion>

  <Accordion title="代理與工作區輔助工具">
    - `agents.list` 會傳回已設定的代理項目，包含有效模型與執行階段中繼資料。
    - `agents.create`、`agents.update` 與 `agents.delete` 會管理代理記錄與工作區接線。
    - `agents.files.list`、`agents.files.get` 與 `agents.files.set` 會管理為代理公開的啟動工作區檔案。
    - `agent.identity.get` 會傳回代理或工作階段的有效助理身分。
    - `agent.wait` 會等待執行完成，並在可用時傳回終端快照。

  </Accordion>

  <Accordion title="工作階段控制">
    - `sessions.list` 會傳回目前的工作階段索引，當已設定代理執行階段後端時，包含每列的 `agentRuntime` 中繼資料。
    - `sessions.subscribe` 與 `sessions.unsubscribe` 會為目前的 WS 用戶端切換工作階段變更事件訂閱。
    - `sessions.messages.subscribe` 與 `sessions.messages.unsubscribe` 會為單一工作階段切換逐字稿／訊息事件訂閱。
    - `sessions.preview` 會為特定工作階段鍵傳回有界逐字稿預覽。
    - `sessions.resolve` 會解析或正規化工作階段目標。
    - `sessions.create` 會建立新的工作階段項目。
    - `sessions.send` 會向現有工作階段傳送訊息。
    - `sessions.steer` 是作用中工作階段的中斷並導向變體。
    - `sessions.abort` 會中止工作階段的作用中工作。呼叫者可以傳入 `key` 加上選用的 `runId`，或針對 Gateway 可解析到工作階段的作用中執行，單獨傳入 `runId`。
    - `sessions.patch` 會更新工作階段中繼資料／覆寫，並回報已解析的正規模型以及有效的 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 與 `sessions.compact` 會執行工作階段維護。
    - `sessions.get` 會傳回完整儲存的工作階段列。
    - 聊天執行仍使用 `chat.history`、`chat.send`、`chat.abort` 與 `chat.inject`。`chat.history` 會為 UI 用戶端進行顯示正規化：從可見文字移除行內指令標籤、移除純文字工具呼叫 XML 承載（包含 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 與被截斷的工具呼叫區塊）以及洩漏的 ASCII／全形模型控制權杖，省略精確為 `NO_REPLY` / `no_reply` 這類純靜默權杖的助理列，且過大的列可替換為預留位置。

  </Accordion>

  <Accordion title="裝置配對與裝置權杖">
    - `device.pair.list` 會傳回待處理與已核准的配對裝置。
    - `device.pair.approve`、`device.pair.reject` 與 `device.pair.remove` 會管理裝置配對記錄。
    - `device.token.rotate` 會在已核准角色與呼叫者範圍界限內輪替配對裝置權杖。
    - `device.token.revoke` 會在已核准角色與呼叫者範圍界限內撤銷配對裝置權杖。

  </Accordion>

  <Accordion title="Node 配對、叫用與待處理工作">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove` 與 `node.pair.verify` 涵蓋 Node 配對與啟動驗證。
    - `node.list` 與 `node.describe` 會傳回已知／已連線的 Node 狀態。
    - `node.rename` 會更新已配對的 Node 標籤。
    - `node.invoke` 會將命令轉送至已連線的 Node。
    - `node.invoke.result` 會傳回叫用請求的結果。
    - `node.event` 會將源自 Node 的事件帶回 Gateway。
    - `node.canvas.capability.refresh` 會重新整理限定範圍的畫布能力權杖。
    - `node.pending.pull` 與 `node.pending.ack` 是已連線 Node 佇列 API。
    - `node.pending.enqueue` 與 `node.pending.drain` 會管理離線／中斷連線 Node 的持久待處理工作。

  </Accordion>

  <Accordion title="核准系列">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 與 `exec.approval.resolve` 涵蓋一次性 exec 核准請求，以及待處理核准查詢／重播。
    - `exec.approval.waitDecision` 會等待一個待處理 exec 核准，並傳回最終決策（逾時時為 `null`）。
    - `exec.approvals.get` 與 `exec.approvals.set` 會管理 Gateway exec 核准政策快照。
    - `exec.approvals.node.get` 與 `exec.approvals.node.set` 會透過 Node 中繼命令管理 Node 本機 exec 核准政策。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 與 `plugin.approval.resolve` 涵蓋 Plugin 定義的核准流程。

  </Accordion>

  <Accordion title="自動化、Skills 與工具">
    - 自動化：`wake` 會排程立即或下一次 Heartbeat 的喚醒文字注入；`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 會管理排程工作。
    - Skills 與工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`。

  </Accordion>
</AccordionGroup>

### 常見事件系列

- `chat`：UI 聊天更新，例如 `chat.inject` 與其他僅逐字稿的聊天
  事件。
- `session.message` 與 `session.tool`：已訂閱工作階段的逐字稿／事件串流更新。
- `sessions.changed`：工作階段索引或中繼資料已變更。
- `presence`：系統存在狀態快照更新。
- `tick`：週期性 keepalive／存活事件。
- `health`：Gateway 健全狀態快照更新。
- `heartbeat`：Heartbeat 事件串流更新。
- `cron`：Cron 執行／工作變更事件。
- `shutdown`：Gateway 關閉通知。
- `node.pair.requested` / `node.pair.resolved`：Node 配對生命週期。
- `node.invoke.request`：Node 叫用請求廣播。
- `device.pair.requested` / `device.pair.resolved`：配對裝置生命週期。
- `voicewake.changed`：喚醒詞觸發器設定已變更。
- `exec.approval.requested` / `exec.approval.resolved`：exec 核准
  生命週期。
- `plugin.approval.requested` / `plugin.approval.resolved`：Plugin 核准
  生命週期。

### Node 輔助方法

- Node 可呼叫 `skills.bins` 來擷取目前的技能可執行檔清單，以進行自動允許檢查。

### 操作者輔助方法

- 操作者可以呼叫 `commands.list`（`operator.read`）來擷取代理程式的執行階段
  命令清單。
  - `agentId` 為選填；省略即可讀取預設代理程式工作區。
  - `scope` 控制主要 `name` 目標所屬的介面：
    - `text` 會傳回不含開頭 `/` 的主要文字命令權杖
    - `native` 與預設的 `both` 路徑會在可用時傳回感知提供者的原生命令名稱
  - `textAliases` 帶有精確的斜線別名，例如 `/model` 和 `/m`。
  - `nativeName` 會在存在時帶有感知提供者的原生命令名稱。
  - `provider` 為選填，且只會影響原生命名以及原生 Plugin
    命令可用性。
  - `includeArgs=false` 會從回應中省略序列化的引數中繼資料。
- 操作者可以呼叫 `tools.catalog`（`operator.read`）來擷取代理程式的執行階段工具目錄。回應包含分組工具與來源中繼資料：
  - `source`：`core` 或 `plugin`
  - `pluginId`：當 `source="plugin"` 時的 Plugin 擁有者
  - `optional`：Plugin 工具是否為選用
- 操作者可以呼叫 `tools.effective`（`operator.read`）來擷取工作階段中執行階段實際生效的工具清單。
  - `sessionKey` 為必填。
  - Gateway 會從伺服器端的工作階段推導受信任的執行階段脈絡，而不是接受
    呼叫端提供的驗證或傳遞脈絡。
  - 回應以工作階段為範圍，並反映目前作用中的對話現在可以使用的內容，
    包含核心、Plugin 與頻道工具。
- 操作者可以呼叫 `skills.status`（`operator.read`）來擷取代理程式可見的
  Skills 清單。
  - `agentId` 為選填；省略即可讀取預設代理程式工作區。
  - 回應包含資格、缺少的需求、設定檢查，以及
    已清理的安裝選項，且不會暴露原始秘密值。
- 操作者可以呼叫 `skills.search` 和 `skills.detail`（`operator.read`）取得
  ClawHub 探索中繼資料。
- 操作者可以用兩種模式呼叫 `skills.install`（`operator.admin`）：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 會將
    Skills 資料夾安裝到預設代理程式工作區的 `skills/` 目錄。
  - Gateway 安裝程式模式：`{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    會在 Gateway 主機上執行宣告的 `metadata.openclaw.install` 動作。
- 操作者可以用兩種模式呼叫 `skills.update`（`operator.admin`）：
  - ClawHub 模式會更新一個受追蹤的 slug，或更新預設代理程式工作區中所有受追蹤的 ClawHub 安裝項目。
  - 設定模式會修補 `skills.entries.<skillKey>` 值，例如 `enabled`、
    `apiKey` 和 `env`。

### `models.list` 檢視

`models.list` 接受選用的 `view` 參數：

- 省略或 `"default"`：目前的執行階段行為。如果已設定 `agents.defaults.models`，回應會是允許的目錄；否則回應會是完整的 Gateway 目錄。
- `"configured"`：適合選擇器大小的行為。如果已設定 `agents.defaults.models`，它仍會優先。否則回應會使用明確的 `models.providers.*.models` 項目，只有在沒有已設定的模型列時才會退回完整目錄。
- `"all"`：完整 Gateway 目錄，略過 `agents.defaults.models`。將此用於診斷與探索 UI，而非一般模型選擇器。

## Exec 核准

- 當 exec 請求需要核准時，Gateway 會廣播 `exec.approval.requested`。
- 操作者用戶端透過呼叫 `exec.approval.resolve` 來解析（需要 `operator.approvals` 範圍）。
- 對於 `host=node`，`exec.approval.request` 必須包含 `systemRunPlan`（標準 `argv`/`cwd`/`rawCommand`/工作階段中繼資料）。缺少 `systemRunPlan` 的請求會被拒絕。
- 核准後，轉送的 `node.invoke system.run` 呼叫會重用該標準
  `systemRunPlan` 作為具權威性的命令/cwd/工作階段脈絡。
- 如果呼叫端在準備和最終核准的 `system.run` 轉送之間變更 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，Gateway 會拒絕該執行，而不是信任已變更的承載。

## 代理程式傳遞後援

- `agent` 請求可以包含 `deliver=true` 以要求輸出傳遞。
- `bestEffortDeliver=false` 會維持嚴格行為：無法解析或僅供內部使用的傳遞目標會傳回 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允許在無法解析任何外部可傳遞路由時，後援為僅限工作階段的執行（例如內部/webchat 工作階段或不明確的多頻道設定）。

## 版本控管

- `PROTOCOL_VERSION` 位於 `src/gateway/protocol/schema/protocol-schemas.ts`。
- 用戶端傳送 `minProtocol` + `maxProtocol`；伺服器會拒絕不相符的版本。
- 結構描述與模型會從 TypeBox 定義產生：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 用戶端常數

`src/gateway/client.ts` 中的參考用戶端使用這些預設值。這些值在協定 v3 中保持穩定，並且是第三方用戶端的預期基準。

| 常數                                      | 預設值                                                | 來源                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| 請求逾時（每個 RPC）                      | `30_000` ms                                           | `src/gateway/client.ts`（`requestTimeoutMs`）                                              |
| 預驗證 / 連線挑戰逾時                     | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（設定/env 可提高成對的伺服器/用戶端預算）             |
| 初始重新連線退避                          | `1_000` ms                                            | `src/gateway/client.ts`（`backoffMs`）                                                     |
| 最大重新連線退避                          | `30_000` ms                                           | `src/gateway/client.ts`（`scheduleReconnect`）                                             |
| 裝置權杖關閉後的快速重試上限              | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前的強制停止寬限            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` 預設逾時                  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| 預設 tick 間隔（`hello-ok` 前）            | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| tick 逾時關閉                             | 當靜默超過 `tickIntervalMs * 2` 時使用代碼 `4000`     | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024`（25 MB）                           | `src/gateway/server-constants.ts`                                                          |

伺服器會在 `hello-ok` 中公告實際生效的 `policy.tickIntervalMs`、`policy.maxPayload` 和 `policy.maxBufferedBytes`；用戶端應遵循這些值，而不是握手前的預設值。

## 驗證

- 共用秘密 Gateway 驗證會使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，取決於已設定的驗證模式。
- 帶有身分的模式，例如 Tailscale Serve
  （`gateway.auth.allowTailscale: true`）或非 local loopback
  `gateway.auth.mode: "trusted-proxy"`，會從請求標頭而非 `connect.params.auth.*`
  滿足連線驗證檢查。
- 私有入口 `gateway.auth.mode: "none"` 會完全略過共用秘密連線驗證；
  請勿在公開/不受信任的入口暴露該模式。
- 配對後，Gateway 會發出一個範圍限定為連線角色 + 範圍的**裝置權杖**。
  它會在 `hello-ok.auth.deviceToken` 中傳回，且用戶端應將其持久保存以供未來連線使用。
- 用戶端應在任何成功連線後持久保存主要的 `hello-ok.auth.deviceToken`。
- 使用該**已儲存**裝置權杖重新連線時，也應重用該權杖已儲存的
  已核准範圍集合。這會保留先前已授權的讀取/探測/狀態存取權，
  並避免在不明顯的情況下將重新連線縮減為較窄的隱含僅管理員範圍。
- 用戶端連線驗證組裝（`src/gateway/client.ts` 中的 `selectConnectAuth`）：
  - `auth.password` 是正交的，設定時一律會被轉送。
  - `auth.token` 依優先順序填入：明確的共用權杖優先，
    接著是明確的 `deviceToken`，再來是已儲存的每裝置權杖（以
    `deviceId` + `role` 為鍵）。
  - 只有在上述都未解析出 `auth.token` 時，才會傳送 `auth.bootstrapToken`。
    共用權杖或任何已解析的裝置權杖都會抑制它。
  - 在一次性的 `AUTH_TOKEN_MISMATCH` 重試上，自動提升已儲存裝置權杖僅限於**受信任端點**：
    loopback，或具有釘選 `tlsFingerprint` 的 `wss://`。沒有釘選的公開 `wss://`
    不符合資格。
- 額外的 `hello-ok.auth.deviceTokens` 項目是啟動程序交接權杖。
  只有在連線於受信任傳輸（例如 `wss://` 或 loopback/local 配對）上使用啟動驗證時，才持久保存它們。
- 如果用戶端提供**明確**的 `deviceToken` 或明確的 `scopes`，該呼叫端要求的範圍集合仍具有權威性；只有在用戶端重用已儲存的每裝置權杖時，才會重用快取的範圍。
- 裝置權杖可透過 `device.token.rotate` 和
  `device.token.revoke` 輪替/撤銷（需要 `operator.pairing` 範圍）。
- `device.token.rotate` 會傳回輪替中繼資料。它只會對已使用該裝置權杖完成驗證的同一裝置呼叫回傳替換的持有者權杖，因此僅權杖用戶端可在重新連線前持久保存替換項。共用/管理員輪替不會回傳持有者權杖。
- 權杖發行、輪替與撤銷仍會被限制在該裝置配對項目中記錄的已核准角色集合內；權杖變更不能擴大或瞄準配對核准從未授予的裝置角色。
- 對於已配對裝置權杖工作階段，除非呼叫端也擁有 `operator.admin`，否則裝置管理僅限自身範圍：非管理員呼叫端只能移除/撤銷/輪替自己的裝置項目。
- `device.token.rotate` 和 `device.token.revoke` 也會檢查目標操作者
  權杖範圍集合是否符合呼叫端目前的工作階段範圍。非管理員呼叫端
  不能輪替或撤銷比自己已持有範圍更廣的操作者權杖。
- 驗證失敗包含 `error.details.code` 加上復原提示：
  - `error.details.canRetryWithDeviceToken`（布林值）
  - `error.details.recommendedNextStep`（`retry_with_device_token`、`update_auth_configuration`、`update_auth_credentials`、`wait_then_retry`、`review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH` 的用戶端行為：
  - 受信任用戶端可以使用快取的每裝置權杖嘗試一次有界重試。
  - 如果該重試失敗，用戶端應停止自動重新連線迴圈，並顯示操作者動作指引。

## 裝置身分 + 配對

- 節點應包含穩定的裝置身分識別 (`device.id`)，並由
  金鑰組指紋衍生而來。
- Gateway 會依裝置 + 角色核發權杖。
- 新裝置 ID 必須獲得配對核准，除非已啟用本機自動核准。
- 配對自動核准以直接 local loopback 連線為核心。
- OpenClaw 也有狹窄的後端/容器本機自我連線路徑，用於
  受信任的共享密鑰輔助流程。
- 同主機 tailnet 或 LAN 連線在配對時仍會被視為遠端，並且
  需要核准。
- WS 用戶端通常會在 `connect` 期間包含 `device` 身分識別（操作者 +
  節點）。唯一不含裝置的操作者例外是明確的信任路徑：
  - `gateway.controlUi.allowInsecureAuth=true` 用於僅限 localhost 的不安全 HTTP 相容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` 操作者控制 UI 驗證。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急處置，嚴重降低安全性）。
  - 以共享
    Gateway 權杖/密碼驗證的直接 loopback `gateway-client` 後端 RPC。
- 所有連線都必須簽署伺服器提供的 `connect.challenge` nonce。

### 裝置驗證遷移診斷

對於仍使用挑戰前簽署行為的舊版用戶端，`connect` 現在會在
`error.details.code` 下傳回 `DEVICE_AUTH_*` 詳細代碼，並附帶穩定的 `error.details.reason`。

常見遷移失敗：

| 訊息                        | details.code                     | details.reason           | 含義                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 用戶端省略了 `device.nonce`（或傳送空白）。        |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 用戶端使用過期/錯誤的 nonce 簽署。                |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 簽章酬載與 v2 酬載不相符。                        |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 簽署時間戳超出允許的偏差範圍。                    |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 與公開金鑰指紋不相符。                |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開金鑰格式/標準化失敗。                         |

遷移目標：

- 一律等待 `connect.challenge`。
- 簽署包含伺服器 nonce 的 v2 酬載。
- 在 `connect.params.device.nonce` 中傳送相同的 nonce。
- 偏好的簽章酬載是 `v3`，除了裝置/用戶端/角色/範圍/權杖/nonce 欄位外，
  也會綁定 `platform` 和 `deviceFamily`。
- 舊版 `v2` 簽章仍會因相容性而被接受，但已配對裝置的
  中繼資料釘選仍會控制重新連線時的命令政策。

## TLS + 釘選

- WS 連線支援 TLS。
- 用戶端可選擇釘選 Gateway 憑證指紋（請參閱 `gateway.tls`
  設定，加上 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`）。

## 範圍

此協定公開**完整的 Gateway API**（狀態、通道、模型、聊天、
代理程式、工作階段、節點、核准等）。確切介面由
`src/gateway/protocol/schema.ts` 中的 TypeBox schema 定義。

## 相關

- [橋接協定](/zh-TW/gateway/bridge-protocol)
- [Gateway 運行手冊](/zh-TW/gateway)
