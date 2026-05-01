---
read_when:
    - 實作或更新 Gateway WS 用戶端
    - 偵錯協定不一致或連線失敗
    - 正在重新產生通訊協定結構描述/模型
summary: Gateway WebSocket 協定：握手、訊框、版本管理
title: Gateway 通訊協定
x-i18n:
    generated_at: "2026-05-01T02:44:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6da9ce755b941789ae6b9e866247c8bebb86e9a1530fb8cb258fb0650b24b8a
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS 通訊協定是 OpenClaw 的**單一控制平面 + Node 傳輸**。
所有用戶端（CLI、網頁 UI、macOS app、iOS/Android Node、無頭
Node）都透過 WebSocket 連線，並在握手時宣告其**角色** + **範圍**。

## 傳輸

- WebSocket，使用含 JSON 承載的文字影格。
- 第一個影格**必須**是 `connect` 請求。
- 連線前影格上限為 64 KiB。握手成功後，用戶端應遵循
  `hello-ok.policy.maxPayload` 和
  `hello-ok.policy.maxBufferedBytes` 限制。啟用診斷時，
  過大的入站影格和緩慢的出站緩衝區會在 Gateway 關閉或丟棄受影響的影格前發出
  `payload.large` 事件。這些事件會保留大小、限制、表面和安全原因代碼。
  它們不會保留訊息本文、附件內容、原始影格本文、權杖、Cookie 或祕密值。

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

當 Gateway 仍在完成啟動 sidecar 時，`connect` 請求可能會回傳可重試的
`UNAVAILABLE` 錯誤，並將 `details.reason` 設為
`"startup-sidecars"`，且包含 `retryAfterMs`。用戶端應在其整體連線預算內重試該回應，
而不是將其呈現為終止性的握手失敗。

`server`、`features`、`snapshot` 和 `policy` 都是結構描述要求的欄位
（`src/gateway/protocol/schema/frames.ts`）。`auth` 也是必要欄位，並回報
協商後的角色/範圍。`canvasHostUrl` 則為選用。

未核發裝置權杖時，`hello-ok.auth` 會回報協商後的權限，不包含權杖欄位：

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

受信任的同處理序後端用戶端（`client.id: "gateway-client"`、
`client.mode: "backend"`）在直接 local loopback 連線上使用共用 Gateway 權杖/密碼驗證時，
可以省略 `device`。此路徑保留給內部控制平面 RPC 使用，並避免過期的 CLI/裝置配對基線阻擋
本機後端工作，例如子代理工作階段更新。遠端用戶端、瀏覽器來源用戶端、Node 用戶端，以及明確的
裝置權杖/裝置身分用戶端，仍使用一般的配對和範圍升級檢查。

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

對於內建 Node/operator 啟動流程，主要 Node 權杖會維持
`scopes: []`，且任何交接的 operator 權杖都會維持受限於啟動
operator 允許清單（`operator.approvals`、`operator.read`、
`operator.talk.secrets`、`operator.write`）。啟動範圍檢查維持角色前綴：
operator 項目只滿足 operator 請求，而非 operator 角色仍需要其自身角色前綴下的範圍。

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

## 影格格式

- **請求**：`{type:"req", id, method, params}`
- **回應**：`{type:"res", id, ok, payload|error}`
- **事件**：`{type:"event", event, payload, seq?, stateVersion?}`

具有副作用的方法需要**冪等鍵**（請參閱結構描述）。

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

包含 `includeSecrets: true` 的 `talk.config` 需要 `operator.talk.secrets`
（或 `operator.admin`）。

Plugin 註冊的 Gateway RPC 方法可以請求自己的 operator 範圍，但
保留的核心管理前綴（`config.*`、`exec.approvals.*`、`wizard.*`、
`update.*`）一律解析為 `operator.admin`。

方法範圍只是第一道門檻。某些透過 `chat.send` 觸及的斜線命令會在其上套用更嚴格的
命令層級檢查。例如，持久性的 `/config set` 和 `/config unset` 寫入需要
`operator.admin`。

`node.pair.approve` 在基礎方法範圍之上，還有額外的核准時範圍檢查：

- 無命令請求：`operator.pairing`
- 含非 exec Node 命令的請求：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的請求：
  `operator.pairing` + `operator.admin`

### 能力/命令/權限（Node）

Node 會在連線時宣告能力聲明：

- `caps`：高階能力類別。
- `commands`：用於叫用的命令允許清單。
- `permissions`：細粒度切換（例如 `screen.record`、`camera.capture`）。

Gateway 會將這些視為**聲明**，並強制執行伺服器端允許清單。

## 狀態存在

- `system-presence` 會回傳以裝置身分為鍵的項目。
- 狀態存在項目包含 `deviceId`、`roles` 和 `scopes`，因此 UI 可以為每個裝置顯示單一列，
  即使它同時以 **operator** 和 **node** 連線。
- `node.list` 包含選用的 `lastSeenAtMs` 和 `lastSeenReason` 欄位。已連線的 Node 會將其目前連線時間回報為
  `lastSeenAtMs`，原因為 `connect`；已配對的 Node 也可以在受信任的 Node 事件更新其配對中繼資料時，
  回報持久的背景狀態存在。

### Node 背景存活事件

Node 可以呼叫 `node.event` 並使用 `event: "node.presence.alive"`，以記錄已配對 Node 在背景喚醒期間
曾經存活，而不將其標記為已連線。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是封閉列舉：`background`、`silent_push`、`bg_app_refresh`、
`significant_location`、`manual` 或 `connect`。未知的觸發字串會在持久化前由 Gateway 正規化為
`background`。此事件僅對已驗證的 Node 裝置工作階段具有持久性；無裝置或未配對的工作階段會回傳
`handled: false`。

成功的 Gateway 會回傳結構化結果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

較舊的 Gateway 對 `node.event` 可能仍回傳 `{ "ok": true }`；用戶端應將其視為
已確認的 RPC，而非持久狀態存在的保存。

## 廣播事件範圍限定

伺服器推送的 WebSocket 廣播事件會受範圍閘控，因此配對範圍或僅限 Node 的工作階段不會被動接收工作階段內容。

- **聊天、代理和工具結果影格**（包含串流的 `agent` 事件和工具呼叫結果）至少需要 `operator.read`。沒有 `operator.read` 的工作階段會完全略過這些影格。
- **Plugin 定義的 `plugin.*` 廣播**會依 Plugin 註冊方式，閘控至 `operator.write` 或 `operator.admin`。
- **狀態和傳輸事件**（`heartbeat`、`presence`、`tick`、連線/中斷連線生命週期等）維持不受限制，因此每個已驗證工作階段都能觀察傳輸健康狀態。
- **未知的廣播事件家族**預設會受範圍閘控（失敗即關閉），除非已註冊的處理常式明確放寬限制。

每個用戶端連線都會保留自己的每用戶端序號，因此即使不同用戶端看到事件串流中不同的範圍篩選子集，廣播在該 socket 上仍會維持單調排序。

## 常見 RPC 方法家族

公開 WS 表面比上方的握手/驗證範例更廣。這不是產生的傾印 — `hello-ok.features.methods` 是一份保守的
探索清單，由 `src/gateway/server-methods-list.ts` 加上已載入的
Plugin/通道方法匯出所建構。請將它視為功能探索，而不是
`src/gateway/server-methods/*.ts` 的完整列舉。

<AccordionGroup>
  <Accordion title="系統與身分">
    - `health` 會回傳快取或新探測的 Gateway 健康快照。
    - `diagnostics.stability` 會回傳最近的有界診斷穩定性記錄器。它保留操作中繼資料，例如事件名稱、計數、位元組大小、記憶體讀數、佇列/工作階段狀態、通道/Plugin 名稱和工作階段 ID。它不會保留聊天文字、Webhook 本文、工具輸出、原始請求或回應本文、權杖、Cookie 或祕密值。需要 operator 讀取範圍。
    - `status` 會回傳 `/status` 風格的 Gateway 摘要；敏感欄位只會包含在具管理範圍的 operator 用戶端中。
    - `gateway.identity.get` 會回傳 relay 和配對流程使用的 Gateway 裝置身分。
    - `system-presence` 會回傳已連線 operator/Node 裝置的目前狀態存在快照。
    - `system-event` 會附加系統事件，並可更新/廣播狀態存在內容。
    - `last-heartbeat` 會回傳最新持久化的 Heartbeat 事件。
    - `set-heartbeats` 會切換 Gateway 上的 Heartbeat 處理。

  </Accordion>

  <Accordion title="模型與使用量">
    - `models.list` 會傳回執行階段允許的模型目錄。傳入 `{ "view": "configured" }` 可取得適合選擇器大小的已設定模型（先是 `agents.defaults.models`，再是 `models.providers.*.models`），或傳入 `{ "view": "all" }` 可取得完整目錄。
    - `usage.status` 會傳回供應商使用量視窗/剩餘配額摘要。
    - `usage.cost` 會傳回日期範圍內的彙總成本使用量摘要。
    - `doctor.memory.status` 會傳回作用中預設代理工作區的向量記憶體/快取嵌入就緒狀態。只有在呼叫端明確想要即時嵌入供應商 ping 時，才傳入 `{ "probe": true }` 或 `{ "deep": true }`。
    - `doctor.memory.remHarness` 會為遠端控制平面用戶端傳回有界、唯讀的 REM harness 預覽。它可能包含工作區路徑、記憶體片段、已轉譯的 grounded markdown，以及深度提升候選項目，因此呼叫端需要 `operator.read`。
    - `sessions.usage` 會傳回每個工作階段的使用量摘要。
    - `sessions.usage.timeseries` 會傳回單一工作階段的時間序列使用量。
    - `sessions.usage.logs` 會傳回單一工作階段的使用量記錄項目。

  </Accordion>

  <Accordion title="通道與登入輔助工具">
    - `channels.status` 會傳回內建 + 綑綁通道/Plugin 狀態摘要。
    - `channels.logout` 會登出指定通道/帳號，前提是該通道支援登出。
    - `web.login.start` 會為目前支援 QR 的 Web 通道供應商啟動 QR/Web 登入流程。
    - `web.login.wait` 會等待該 QR/Web 登入流程完成，並在成功時啟動通道。
    - `push.test` 會將測試 APNs 推播傳送到已註冊的 iOS Node。
    - `voicewake.get` 會傳回已儲存的喚醒詞觸發器。
    - `voicewake.set` 會更新喚醒詞觸發器並廣播變更。

  </Accordion>

  <Accordion title="訊息與記錄">
    - `send` 是在聊天執行器之外，針對通道/帳號/討論串目標傳送的直接對外遞送 RPC。
    - `logs.tail` 會傳回已設定的 Gateway 檔案記錄尾端，並提供游標/限制與最大位元組控制。

  </Accordion>

  <Accordion title="Talk 與 TTS">
    - `talk.config` 會傳回有效的 Talk 設定 payload；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.mode` 會為 WebChat/Control UI 用戶端設定/廣播目前的 Talk 模式狀態。
    - `talk.speak` 會透過作用中的 Talk 語音供應商合成語音。
    - `tts.status` 會傳回 TTS 啟用狀態、作用中供應商、後援供應商，以及供應商設定狀態。
    - `tts.providers` 會傳回可見的 TTS 供應商清單。
    - `tts.enable` 和 `tts.disable` 會切換 TTS 偏好設定狀態。
    - `tts.setProvider` 會更新偏好的 TTS 供應商。
    - `tts.convert` 會執行一次性文字轉語音轉換。

  </Accordion>

  <Accordion title="密鑰、設定、更新與精靈">
    - `secrets.reload` 會重新解析作用中的 SecretRefs，且只有在完全成功時才會交換執行階段密鑰狀態。
    - `secrets.resolve` 會解析特定命令/目標集合的命令目標密鑰指派。
    - `config.get` 會傳回目前的設定快照與雜湊。
    - `config.set` 會寫入已驗證的設定 payload。
    - `config.patch` 會合併部分設定更新。
    - `config.apply` 會驗證並取代完整設定 payload。
    - `config.schema` 會傳回 Control UI 與 CLI 工具使用的即時設定結構描述 payload：結構描述、`uiHints`、版本與產生中繼資料，包括執行階段可載入時的 Plugin + 通道結構描述中繼資料。此結構描述包含從 UI 使用的相同標籤與說明文字衍生出的欄位 `title` / `description` 中繼資料，包括在存在相符欄位文件時，巢狀物件、萬用字元、陣列項目，以及 `anyOf` / `oneOf` / `allOf` 組合分支。
    - `config.schema.lookup` 會傳回單一設定路徑的路徑範圍查詢 payload：正規化路徑、淺層結構描述節點、相符提示 + `hintPath`，以及用於 UI/CLI 向下鑽研的直接子項摘要。查詢結構描述節點會保留使用者可見的文件與常見驗證欄位（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、數值/字串/陣列/物件邊界，以及像 `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` 這類旗標）。子項摘要會公開 `key`、正規化 `path`、`type`、`required`、`hasChildren`，以及相符的 `hint` / `hintPath`。
    - `update.run` 會執行 Gateway 更新流程，且只有在更新本身成功時才排程重新啟動。
    - `update.status` 會傳回最新快取的更新重新啟動 sentinel，包括可用時重新啟動後的執行版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 會透過 WS RPC 公開入門精靈。

  </Accordion>

  <Accordion title="代理與工作區輔助工具">
    - `agents.list` 會傳回已設定的代理項目，包括有效模型與執行階段中繼資料。
    - `agents.create`、`agents.update` 和 `agents.delete` 會管理代理記錄與工作區連線。
    - `agents.files.list`、`agents.files.get` 和 `agents.files.set` 會管理為代理公開的啟動工作區檔案。
    - `artifacts.list`、`artifacts.get` 和 `artifacts.download` 會公開明確 `sessionKey`、`runId` 或 `taskId` 範圍中，從逐字稿衍生的成品摘要與下載。執行與任務查詢會在伺服器端解析所屬工作階段，且只傳回具有相符來源的逐字稿媒體；不安全或本機 URL 來源會傳回不支援的下載，而不是在伺服器端擷取。
    - `agent.identity.get` 會傳回代理或工作階段的有效助理身分。
    - `agent.wait` 會等待一次執行完成，並在可用時傳回終端快照。

  </Accordion>

  <Accordion title="工作階段控制">
    - `sessions.list` 會傳回目前的工作階段索引，包括設定代理執行階段後端時每列的 `agentRuntime` 中繼資料。
    - `sessions.subscribe` 和 `sessions.unsubscribe` 會切換目前 WS 用戶端的工作階段變更事件訂閱。
    - `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 會切換單一工作階段的逐字稿/訊息事件訂閱。
    - `sessions.preview` 會傳回特定工作階段鍵的有界逐字稿預覽。
    - `sessions.resolve` 會解析或正規化工作階段目標。
    - `sessions.create` 會建立新的工作階段項目。
    - `sessions.send` 會將訊息傳送到現有工作階段。
    - `sessions.steer` 是作用中工作階段的中斷並導引變體。
    - `sessions.abort` 會中止工作階段的作用中工作。呼叫端可以傳入 `key` 加上可選的 `runId`，或只為 Gateway 可解析到工作階段的作用中執行傳入 `runId`。
    - `sessions.patch` 會更新工作階段中繼資料/覆寫，並回報已解析的正規模型與有效的 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 和 `sessions.compact` 會執行工作階段維護。
    - `sessions.get` 會傳回完整儲存的工作階段列。
    - 聊天執行仍使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。`chat.history` 會為 UI 用戶端進行顯示正規化：可見文字中的內嵌指令標籤會被移除，純文字工具呼叫 XML payload（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及截斷的工具呼叫區塊）與外洩的 ASCII/全形模型控制權杖會被移除，完全由靜默權杖組成的助理列（例如精確的 `NO_REPLY` / `no_reply`）會被省略，而過大的列可以用佔位符取代。

  </Accordion>

  <Accordion title="裝置配對與裝置權杖">
    - `device.pair.list` 會傳回待處理和已核准的配對裝置。
    - `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 會管理裝置配對記錄。
    - `device.token.rotate` 會在其已核准角色與呼叫端範圍界限內輪替配對裝置權杖。
    - `device.token.revoke` 會在其已核准角色與呼叫端範圍界限內撤銷配對裝置權杖。

  </Accordion>

  <Accordion title="Node 配對、叫用與待處理工作">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove` 和 `node.pair.verify` 涵蓋 Node 配對與啟動驗證。
    - `node.list` 和 `node.describe` 會傳回已知/已連線的 Node 狀態。
    - `node.rename` 會更新配對 Node 標籤。
    - `node.invoke` 會將命令轉送到已連線的 Node。
    - `node.invoke.result` 會傳回叫用請求的結果。
    - `node.event` 會將 Node 來源事件帶回 Gateway。
    - `node.canvas.capability.refresh` 會重新整理範圍限定的畫布能力權杖。
    - `node.pending.pull` 和 `node.pending.ack` 是已連線 Node 佇列 API。
    - `node.pending.enqueue` 和 `node.pending.drain` 會管理離線/中斷連線 Node 的持久待處理工作。

  </Accordion>

  <Accordion title="核准系列">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 涵蓋一次性 exec 核准請求，以及待處理核准查詢/重播。
    - `exec.approval.waitDecision` 會等待一個待處理 exec 核准，並傳回最終決策（逾時時為 `null`）。
    - `exec.approvals.get` 和 `exec.approvals.set` 會管理 Gateway exec 核准政策快照。
    - `exec.approvals.node.get` 和 `exec.approvals.node.set` 會透過 Node relay 命令管理 Node 本機 exec 核准政策。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 涵蓋 Plugin 定義的核准流程。

  </Accordion>

  <Accordion title="自動化、Skills 與工具">
    - 自動化：`wake` 會排程立即或下一次 Heartbeat 喚醒文字注入；`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 會管理排程工作。
    - Skills 與工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`。

  </Accordion>
</AccordionGroup>

### 常見事件系列

- `chat`：UI 聊天更新，例如 `chat.inject` 與其他僅限逐字稿的聊天
  事件。
- `session.message` 和 `session.tool`：已訂閱工作階段的逐字稿/事件串流更新。
- `sessions.changed`：工作階段索引或中繼資料已變更。
- `presence`：系統 presence 快照更新。
- `tick`：週期性 keepalive / liveness 事件。
- `health`：Gateway 健康狀態快照更新。
- `heartbeat`：Heartbeat 事件串流更新。
- `cron`：Cron 執行/工作變更事件。
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

- Node 可以呼叫 `skills.bins` 來擷取目前的技能可執行檔清單，
  用於自動允許檢查。

### Operator 輔助方法

- 操作員可以呼叫 `commands.list` (`operator.read`) 來擷取代理程式的執行階段
  命令清單。
  - `agentId` 為選填；省略即可讀取預設代理程式工作區。
  - `scope` 控制主要 `name` 目標是哪個介面：
    - `text` 會傳回不含前導 `/` 的主要文字命令權杖
    - `native` 與預設的 `both` 路徑會在可用時傳回可感知提供者的原生命名
  - `textAliases` 會攜帶精確的斜線別名，例如 `/model` 與 `/m`。
  - `nativeName` 會在存在時攜帶可感知提供者的原生命令名稱。
  - `provider` 為選填，且只會影響原生命名與原生 Plugin
    命令可用性。
  - `includeArgs=false` 會從回應中省略序列化的引數中繼資料。
- 操作員可以呼叫 `tools.catalog` (`operator.read`) 來擷取代理程式的執行階段工具目錄。回應包含分組工具與來源中繼資料：
  - `source`: `core` 或 `plugin`
  - `pluginId`: `source="plugin"` 時的 Plugin擁有者
  - `optional`: Plugin工具是否為選用
- 操作員可以呼叫 `tools.effective` (`operator.read`) 來擷取工作階段的執行階段有效工具
  清單。
  - `sessionKey` 為必填。
  - Gateway 會在伺服器端從工作階段衍生受信任的執行階段內容，而不是接受
    呼叫端提供的驗證或傳遞內容。
  - 回應以工作階段為範圍，並反映目前作用中對話現在可使用的內容，
    包括核心、Plugin 與通道工具。
- 操作員可以呼叫 `skills.status` (`operator.read`) 來擷取代理程式可見的
  Skills 清單。
  - `agentId` 為選填；省略即可讀取預設代理程式工作區。
  - 回應包含資格、缺少的需求、設定檢查，以及
    不會暴露原始密鑰值的已清理安裝選項。
- 操作員可以呼叫 `skills.search` 與 `skills.detail` (`operator.read`) 來取得
  ClawHub 探索中繼資料。
- 操作員可以呼叫 `skills.install` (`operator.admin`)，支援兩種模式：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 會將
    skill 資料夾安裝到預設代理程式工作區的 `skills/` 目錄。
  - Gateway 安裝器模式：`{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    會在 Gateway 主機上執行宣告的 `metadata.openclaw.install` 動作。
- 操作員可以呼叫 `skills.update` (`operator.admin`)，支援兩種模式：
  - ClawHub 模式會更新預設代理程式工作區中一個已追蹤的 slug，或所有已追蹤的 ClawHub 安裝。
  - 設定模式會修補 `skills.entries.<skillKey>` 值，例如 `enabled`、
    `apiKey` 與 `env`。

### `models.list` 檢視

`models.list` 接受選填的 `view` 參數：

- 省略或 `"default"`：目前的執行階段行為。如果已設定 `agents.defaults.models`，回應會是允許的目錄；否則回應會是完整的 Gateway 目錄。
- `"configured"`：適合選擇器大小的行為。如果已設定 `agents.defaults.models`，它仍會優先。否則回應會使用明確的 `models.providers.*.models` 項目，只有在沒有已設定的模型列時才會退回完整目錄。
- `"all"`：完整的 Gateway 目錄，略過 `agents.defaults.models`。這適用於診斷與探索 UI，不適用於一般模型選擇器。

## 執行核准

- 當執行要求需要核准時，Gateway 會廣播 `exec.approval.requested`。
- 操作員用戶端透過呼叫 `exec.approval.resolve` 來解析（需要 `operator.approvals` 範圍）。
- 對於 `host=node`，`exec.approval.request` 必須包含 `systemRunPlan`（標準 `argv`/`cwd`/`rawCommand`/工作階段中繼資料）。缺少 `systemRunPlan` 的要求會被拒絕。
- 核准後，轉送的 `node.invoke system.run` 呼叫會重用該標準
  `systemRunPlan` 作為權威的命令/cwd/工作階段內容。
- 如果呼叫端在準備與最終核准的 `system.run` 轉送之間變更 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，Gateway 會拒絕執行，而不是信任已變更的承載。

## 代理程式傳遞後援

- `agent` 要求可以包含 `deliver=true` 以要求對外傳遞。
- `bestEffortDeliver=false` 保持嚴格行為：無法解析或僅限內部的傳遞目標會傳回 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允許在無法解析外部可傳遞路由時退回僅工作階段執行（例如內部/webchat 工作階段或不明確的多通道設定）。

## 版本控管

- `PROTOCOL_VERSION` 位於 `src/gateway/protocol/schema/protocol-schemas.ts`。
- 用戶端傳送 `minProtocol` + `maxProtocol`；伺服器會拒絕不相符的情況。
- 結構描述 + 模型由 TypeBox 定義產生：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 用戶端常數

`src/gateway/client.ts` 中的參考用戶端使用這些預設值。這些值在
協定 v3 中保持穩定，並且是第三方用戶端的預期基準。

| 常數                                      | 預設值                                                | 來源                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| 要求逾時（每個 RPC）                      | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| 預先驗證 / 連線挑戰逾時                  | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（config/env 可提高配對的伺服器/用戶端預算）            |
| 初始重新連線退避                          | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| 最大重新連線退避                          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| 裝置權杖關閉後的快速重試上限              | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前的強制停止寬限            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` 預設逾時                  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| 預設 tick 間隔（`hello-ok` 前）            | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| tick 逾時關閉                             | 靜默超過 `tickIntervalMs * 2` 時使用代碼 `4000`       | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

伺服器會在 `hello-ok` 中公告有效的 `policy.tickIntervalMs`、`policy.maxPayload`
與 `policy.maxBufferedBytes`；用戶端應遵循這些值，
而不是交握前的預設值。

## 驗證

- 共享密鑰 Gateway 驗證會使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，取決於已設定的驗證模式。
- 帶有身分的模式，例如 Tailscale Serve
  (`gateway.auth.allowTailscale: true`) 或非迴圈
  `gateway.auth.mode: "trusted-proxy"`，會從要求標頭滿足連線驗證檢查，
  而不是使用 `connect.params.auth.*`。
- 私有入口 `gateway.auth.mode: "none"` 會完全略過共享密鑰連線驗證；
  請勿在公開/不受信任的入口上暴露該模式。
- 配對後，Gateway 會發行一個範圍限定為連線
  角色 + 範圍的**裝置權杖**。它會在 `hello-ok.auth.deviceToken` 中傳回，且應由用戶端保存以供未來連線使用。
- 用戶端應在任何成功連線後保存主要的 `hello-ok.auth.deviceToken`。
- 使用該**已儲存**裝置權杖重新連線時，也應重用該權杖已儲存的
  已核准範圍集合。這會保留已授予的讀取/探測/狀態存取權，
  並避免重新連線悄悄收斂到較窄的隱含僅管理員範圍。
- 用戶端連線驗證組裝（`src/gateway/client.ts` 中的 `selectConnectAuth`）：
  - `auth.password` 是正交的，設定時一律會轉送。
  - `auth.token` 會依優先順序填入：先是明確的共享權杖，
    接著是明確的 `deviceToken`，再來是已儲存的每裝置權杖（依
    `deviceId` + `role` 作為鍵）。
  - `auth.bootstrapToken` 只有在上述皆未解析出
    `auth.token` 時才會傳送。共享權杖或任何已解析的裝置權杖都會抑制它。
  - 在一次性的 `AUTH_TOKEN_MISMATCH` 重試中自動提升已儲存裝置權杖，
    僅限於**受信任端點**：loopback，或具有已釘選 `tlsFingerprint` 的 `wss://`。未釘選的公開 `wss://`
    不符合資格。
- 額外的 `hello-ok.auth.deviceTokens` 項目是啟動交接權杖。
  只有在連線於受信任傳輸（例如 `wss://` 或 loopback/local 配對）上使用啟動驗證時才保存它們。
- 如果用戶端提供**明確**的 `deviceToken` 或明確的 `scopes`，該
  呼叫端要求的範圍集合仍具權威性；快取範圍只會在用戶端重用已儲存的每裝置權杖時
  重用。
- 裝置權杖可以透過 `device.token.rotate` 與
  `device.token.revoke` 輪替/撤銷（需要 `operator.pairing` 範圍）。
- `device.token.rotate` 會傳回輪替中繼資料。它只會對已使用該裝置權杖完成驗證的同裝置呼叫
  回顯替代 bearer 權杖，因此僅權杖用戶端可以在
  重新連線前保存替代權杖。共享/管理員輪替不會回顯 bearer 權杖。
- 權杖發行、輪替與撤銷都會限制在該裝置配對項目中記錄的已核准角色集合內；
  權杖變更無法擴大或鎖定配對核准從未授予的裝置角色。
- 對於已配對裝置權杖工作階段，除非呼叫端也有 `operator.admin`，
  否則裝置管理是自我範圍限定的：非管理員呼叫端只能移除/撤銷/輪替
  自己的裝置項目。
- `device.token.rotate` 與 `device.token.revoke` 也會根據呼叫端目前的工作階段範圍
  檢查目標操作員權杖範圍集合。非管理員呼叫端
  不能輪替或撤銷比自己已持有範圍更廣的操作員權杖。
- 驗證失敗包含 `error.details.code` 加上復原提示：
  - `error.details.canRetryWithDeviceToken`（布林值）
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` 的用戶端行為：
  - 受信任用戶端可以嘗試一次有界限的重試，並使用快取的每裝置權杖。
  - 如果該重試失敗，用戶端應停止自動重新連線迴圈，並顯示操作員動作指引。

## 裝置身分 + 配對

- Node 應包含穩定的裝置身分識別（`device.id`），並由
  金鑰對指紋衍生。
- Gateway 會依裝置 + 角色發行權杖。
- 新裝置 ID 必須取得配對核准，除非已啟用本機自動核准。
- 配對自動核准以直接 local loopback 連線為中心。
- OpenClaw 也有一條狹窄的後端/容器本機自我連線路徑，供
  受信任的共享密鑰輔助流程使用。
- 同主機 tailnet 或 LAN 連線在配對上仍視為遠端，並且
  需要核准。
- WS 用戶端通常會在 `connect` 期間包含 `device` 身分識別（操作者 +
  node）。唯一不帶裝置的操作者例外是明確的信任路徑：
  - `gateway.controlUi.allowInsecureAuth=true`，用於僅限 localhost 的不安全 HTTP 相容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` 操作者 Control UI 驗證。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急破窗，嚴重降低安全性）。
  - 使用共享
    gateway 權杖/密碼驗證的 direct-loopback `gateway-client` 後端 RPC。
- 所有連線都必須簽署伺服器提供的 `connect.challenge` nonce。

### 裝置驗證遷移診斷

對於仍使用挑戰前簽署行為的舊版用戶端，`connect` 現在會在
`error.details.code` 下傳回 `DEVICE_AUTH_*` 詳細代碼，並提供穩定的 `error.details.reason`。

常見遷移失敗：

| 訊息                        | details.code                     | details.reason           | 含義                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 用戶端省略了 `device.nonce`（或傳送空白）。        |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 用戶端使用過期/錯誤的 nonce 簽署。                |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 簽章承載資料與 v2 承載資料不符。                  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 簽署時間戳超出允許的偏差範圍。                    |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 與公開金鑰指紋不符。                  |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開金鑰格式/正規化失敗。                         |

遷移目標：

- 一律等待 `connect.challenge`。
- 簽署包含伺服器 nonce 的 v2 承載資料。
- 在 `connect.params.device.nonce` 中傳送相同的 nonce。
- 偏好的簽章承載資料是 `v3`，除了 device/client/role/scopes/token/nonce 欄位外，
  也會繫結 `platform` 和 `deviceFamily`。
- 舊版 `v2` 簽章仍會為了相容性而接受，但已配對裝置的
  中繼資料釘選仍會控制重新連線時的命令政策。

## TLS + 釘選

- TLS 支援 WS 連線。
- 用戶端可選擇釘選 gateway 憑證指紋（請參閱 `gateway.tls`
  設定，以及 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`）。

## 範圍

此協定公開**完整的 gateway API**（狀態、頻道、模型、聊天、
agent、sessions、nodes、approvals 等）。確切介面由
`src/gateway/protocol/schema.ts` 中的 TypeBox schema 定義。

## 相關

- [橋接協定](/zh-TW/gateway/bridge-protocol)
- [Gateway 操作手冊](/zh-TW/gateway)
