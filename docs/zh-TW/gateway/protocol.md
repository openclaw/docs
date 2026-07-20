---
read_when:
    - 實作或更新閘道 WebSocket 用戶端
    - 偵錯通訊協定不相符或連線失敗
    - 重新產生通訊協定結構描述／模型
summary: 閘道 WebSocket 協定：交握、訊框、版本控制
title: 閘道協定
x-i18n:
    generated_at: "2026-07-20T11:44:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5c4d1769eef5af3af9bc81ba8b996e32b79548bf2e2d53bd45db5a24c016123e
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS 通訊協定是 OpenClaw 的單一控制平面與節點傳輸機制。操作端與節點用戶端（命令列介面、網頁 UI、macOS 應用程式、iOS/Android 節點、無頭節點）透過 WebSocket 連線，並在交握時宣告 **角色**與**範圍**。

## npm 套件

這些套件會隨 OpenClaw 發行系列一同提供。在初始推出期間，npm 可能會傳回 `E404`，直到第一個包含套件的版本發布為止。

- [`@openclaw/gateway-protocol`](https://www.npmjs.com/package/@openclaw/gateway-protocol)
  發布結構描述、驗證器、TypeScript 型別、輕量的訊框與錯誤輔助工具，以及版本常數。其 tarball 包含產生的
  [`protocol.schema.json`](https://unpkg.com/@openclaw/gateway-protocol/protocol.schema.json)
  機器可讀合約。
- [`@openclaw/gateway-client`](https://www.npmjs.com/package/@openclaw/gateway-client)
  發布參考節點用戶端，並在
  `@openclaw/gateway-client/browser` 提供瀏覽器安全的進入點。

如需應用程式生命週期指引，請參閱
[建置 Gateway 用戶端](https://docs.openclaw.ai/gateway/clients)。若應用程式會將 Gateway 作為子行程監督，請參閱
[嵌入 OpenClaw](https://docs.openclaw.ai/gateway/embedding)。

## 傳輸與訊框

- WebSocket、文字訊框、JSON 承載資料。
- 第一個訊框**必須**是 `connect` 請求。
- 連線前訊框的上限為 64 KiB（`MAX_PREAUTH_PAYLOAD_BYTES`）。交握後，請遵循 `hello-ok.policy.maxPayload` 與
  `hello-ok.policy.maxBufferedBytes`。啟用診斷後，過大的輸入訊框與緩慢的輸出緩衝區會在
  Gateway 關閉或捨棄訊框之前發出 `payload.large` 事件。這些事件會攜帶 `surface`、位元組大小、限制，以及安全的原因代碼，絕不包含訊息內文、附件內容、原始訊框位元組、權杖、Cookie 或密鑰。

訊框形式：

- 請求：`{type:"req", id, method, params}`
- 回應：`{type:"res", id, ok, payload|error}`
- 事件：`{type:"event", event, payload, seq?, stateVersion?}`

回應錯誤使用 `{ code, message, details?, retryable?, retryAfterMs? }`。
用戶端應依據 `code` 與 `details.code` 分支處理；`message` 仍供人類閱讀，除非相容性說明另有規定，否則可能變更。方法層級的授權失敗使用頂層 `code: "FORBIDDEN"`，並附帶結構化的缺少範圍詳細資料：

- 缺少範圍：`{ code: "MISSING_SCOPE", missingScope, requiredScopes }`。
  `requiredScopes` 是所請求作業的完整已知範圍集合。
  舊版 `missing scope: <scope>` 訊息會保留供較舊的用戶端使用。

用戶端應先讀取 `details`，僅將舊版訊息作為相容性備援。`readMissingScopeError` 與 `readMissingScopeErrorDetails` 由
`@openclaw/gateway-protocol/gateway-error-details` 匯出；瀏覽器安全的 Gateway 用戶端會從 `@openclaw/gateway-client/browser` 重新匯出它們。

結構描述會從 `@openclaw/gateway-protocol/schema` 匯出為 `GatewayErrorDetailsSchema`、`MissingScopeErrorDetailsSchema`。
HTTP 範圍失敗會在 `error.details` 下反映 `MISSING_SCOPE` 物件，並使用 HTTP 狀態 `403`。

具有副作用的方法需要冪等性金鑰（請參閱結構描述）。

## 交握

Gateway 會傳送連線前挑戰：

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

用戶端以 `connect` 回覆：

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

Gateway 以 `hello-ok` 回應：

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

`server`、`features`、`snapshot`、`policy` 與 `auth` 均為
`HelloOkSchema`（`packages/gateway-protocol/src/schema/frames.ts`）的必要欄位。即使未核發裝置權杖，`auth` 也會回報協商後的角色／範圍（形式如上）。`pluginSurfaceUrls` 為選用項目，會將外掛介面名稱（例如
`canvas`）對應至限定範圍的託管 URL；它可能會過期，因此節點會使用 `{ "surface": "canvas" }` 呼叫
`node.pluginSurface.refresh` 以取得新的項目。
已棄用的 `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
路徑不受支援；請使用外掛介面。
快照中的選用 `appliedConfigHash` 是目前運作中 Gateway 執行階段所接受的已解析來源設定修訂版本。用戶端可將其與
`config.get.configRevisionHash` 比較，以判斷較新的已儲存設定是否仍需重新啟動。`config.get.hash` 仍是設定寫入衝突防護所使用的原始根檔案修訂版本。

當 Gateway 仍在完成啟動附屬程序時，`connect` 可能會傳回可重試的 `UNAVAILABLE` 錯誤，並附帶 `details.reason: "startup-sidecars"` 與
`retryAfterMs`。請在連線時間預算內重試，而不要將其視為最終的交握失敗。

核發裝置權杖時，`hello-ok.auth` 會加入該權杖：

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

內建的 QR／設定代碼啟動程序是行動裝置移交路徑。成功的基準設定代碼連線會傳回一個主要節點權杖，以及一個受限的操作端權杖：

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

這項操作端移交刻意受到限制：權限足以啟動行動操作端迴圈與原生設定，包括用於 Talk 設定讀取的 `operator.talk.secrets`，但不包含配對異動範圍，也不包含 `operator.admin`。更廣泛的配對／管理存取需要另外經核准的配對或權杖流程。僅在啟動驗證透過受信任的傳輸（`wss://` 或迴路／本機配對）執行時，才保存 `hello-ok.auth.deviceTokens`。

受信任的同處理程序後端用戶端（`client.id: "gateway-client"`、`client.mode: "backend"`）在使用共用 Gateway 權杖／密碼進行驗證時，可在直接迴路連線上省略 `device`。此路徑僅供內部控制平面 RPC 使用（例如子代理工作階段更新），並可避免過時的命令列介面／裝置配對基準阻礙本機後端工作。遠端、瀏覽器來源、節點，以及明確使用裝置權杖／裝置身分的用戶端，仍須通過一般配對與範圍升級檢查。

### 工作者角色與封閉式通訊協定

雲端工作者會透過 Gateway 擁有、固定主機金鑰的 SSH 通道，使用專用迴路入口。它僅接受工作者身分，絕不分派一般驗證、節點事件、操作端 RPC 或外掛方法。嚴格的 `connect` 會驗證以雜湊形式靜態儲存、短效且綁定至環境、套件組合雜湊、擁有者 Epoch、RPC 集合版本、到期時間及一個可為 null 的工作階段之認證資訊；它也會另外檢查目前版本與功能集合。成功時會傳回最小化的
`worker-hello-ok`；功能協商獨立於一般通訊協定版本。訊框會維持在 64 KiB 以下，但經協商的 `worker.inference.start`
訊框最大可達 25 MiB。封閉式允許清單包含 `worker.heartbeat`、`worker.transcript.commit`、`worker.live-event`、`worker.inference.start` 與
`worker.inference.cancel`。

逐字稿提交會使用擁有者 Epoch 防護、Gateway 擁有的工作階段綁定、基礎葉節點比較交換，以及持久化序列重播；Gateway 會透過一般工作階段寫入器產生逐字稿項目與父項目 ID。每次 RPC 都會重新檢查擁有權與到期狀態。

### 用戶端功能

操作端用戶端可在 `connect.params.caps` 中宣告選用功能：

- `tool-events`：接受結構化工具生命週期事件。
- `inline-widgets`：可呈現託管的行內小工具結果。

用戶端功能描述的是已連線的用戶端，而不是授權。代理工具可宣告必要功能；除非每項要求都出現在原始用戶端的 `caps` 中，否則 Gateway 會省略這些工具。源自頻道的執行沒有 Gateway 用戶端功能，因此即使工具原則明確允許，受功能限制的工具仍無法使用。

### 節點連線範例

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

節點會在連線時宣告功能聲明：

- `caps`：高階類別，例如 `camera`、`canvas`、`screen`、
  `location`、`voice`、`talk`。
- `commands`：呼叫作業的命令允許清單。
- `permissions`：細部切換項目（例如 `screen.record`、`camera.capture`）。

Gateway 會將這些視為聲明，並強制執行伺服器端允許清單。

## 角色與範圍

如需完整的操作端範圍模型、核准時檢查及共用密鑰語意，請參閱[操作端範圍](/zh-TW/gateway/operator-scopes)。

角色：

- `operator`：控制平面用戶端（命令列介面／UI／自動化）。
- `node`：功能主機（攝影機／螢幕／畫布／system.run）。
- `worker`：專用封閉式工作者通訊協定上的雲端執行主機。

操作端範圍（`src/gateway/operator-scopes.ts`），完整封閉集合：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

搭配 `includeSecrets: true` 的 `talk.config` 需要 `operator.talk.secrets`（或
`operator.admin`）。包含密鑰時，請從 `talk.resolved.config.apiKey` 讀取目前啟用的 Talk 提供者認證資訊；`talk.providers.<id>.apiKey`
會維持來源形式，且可能是 SecretRef 物件或經遮蔽的字串。

由外掛註冊的 Gateway RPC 方法可以要求自己的操作端範圍，但這些保留的核心前綴一律會解析為 `operator.admin`
（`src/shared/gateway-method-policy.ts`）：`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`。

方法範圍只是第一道關卡。部分透過 `chat.send` 存取的斜線命令會套用更嚴格的命令層級檢查：即使 Gateway 用戶端已持有較低層級的操作端範圍，持久化的 `/config set` 與
`/config unset` 寫入仍需要 `operator.admin`。

除了基本方法範圍（`operator.pairing`）外，`node.pair.approve` 還會根據待處理請求所宣告的
`commands`（`src/infra/node-pairing-authz.ts`），額外執行核准時範圍檢查：

| 宣告的命令                                                                                                             | 必要範圍                       |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 無                                                                                                                          | `operator.pairing`                    |
| 一般命令                                                                                                             | `operator.pairing` + `operator.write` |
| 包含 `system.run`、`system.run.prepare`、`system.which`、`browser.proxy`、`fs.listDir` 或 `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

### 能力／命令／權限（節點）

節點會在連線時宣告能力聲明：

- `caps`：高階能力類別，例如 `camera`、`canvas`、`screen`、
  `location`、`voice` 和 `talk`。
- `commands`：用於叫用的命令允許清單。
- `permissions`：細部切換項目（例如 `screen.record`、`camera.capture`）。

閘道會將這些視為**聲明**，並強制執行伺服器端允許清單。
連線的節點可在成功連線或重新連線後，透過 `node.pluginTools.update` 發布選用、代理程式可見的外掛或 MCP 工具
描述元。無介面節點主機會重新啟動，以套用宣告式 MCP 清單
變更。此更新方法是唯一的發布途徑；`connect` 參數不接受外掛工具描述元。
每個描述元都必須使用供應商安全的工具 `name`，並指定節點目前命令允許清單中的
`command`。閘道信任已配對節點提供的描述元
中繼資料、篩除核准命令範圍之外的描述元、在節點中斷連線時移除這些描述元，並拒絕操作者嘗試
變更其他節點的目錄。設定 `gateway.nodes.pluginTools.enabled: false`
以忽略節點發布的描述元。

連線的節點主機會透過 `node.skills.update` 發布其完整的 Skills 替代目錄。
此節點角色方法是唯一的節點 Skills 發布途徑；`connect` 參數不接受 Skills。
每個描述元都包含安全的名稱、描述及有大小限制的 `SKILL.md` 內容。閘道會使用一般 Skills 載入器剖析該
內容，在節點連線期間將其納入代理程式 Skills 快照，並在中斷連線時移除。設定
`gateway.nodes.skills.enabled: false` 以忽略節點發布的 Skills。

## 上線狀態

- `system-presence` 會傳回以裝置身分為鍵的項目，包括
  `deviceId`、`roles` 和 `scopes`，讓使用者介面可為每個裝置顯示一列，即使
  該裝置同時以操作者和節點身分連線。
- `node.list` 包含選用的 `lastSeenAtMs` 和 `lastSeenReason`。已連線的
  節點會以原因 `connect` 回報目前的連線時間；已配對節點也可
  透過受信任的節點事件回報持續性背景上線狀態。

原生 macOS 節點也能傳送已驗證的 `node.presence.activity` 事件，
其中包含有上限的輸入閒置時間。閘道會依自己的時鐘推導活動時間戳記，透過 `node.list` 和
`node.describe` 公開最近有活動且已連線的 Mac，並向具有讀取範圍的用戶端廣播 `node.presence` 更新。
如需瞭解選取、隱私權、模型
上下文及通知路由行為，請參閱[使用中的電腦上線狀態](/zh-TW/nodes/presence)。

### 節點背景存活事件

節點會以 `event: "node.presence.alive"` 呼叫 `node.event`，記錄
已配對節點曾在背景喚醒期間存活，而不將其標示為已連線：

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是封閉列舉：`background`、`silent_push`、`bg_app_refresh`、
`significant_location`、`manual`、`connect`。未知值會正規化為
`background`（`src/shared/node-presence.ts`）。此事件只會為
已驗證的節點裝置工作階段持久保存；沒有裝置或未配對的工作階段會傳回
`handled: false`。

成功的閘道會傳回結構化結果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

較舊的閘道可能只為 `node.event` 傳回 `{ "ok": true }`；應將其視為
已確認的 RPC，而不是持久性上線狀態已保存。

## 廣播事件範圍

伺服器推送的廣播事件會依範圍設限，讓僅限配對範圍或僅限節點的
工作階段不會被動接收工作階段內容
（`src/gateway/server-broadcast.ts`）：

- 聊天、代理程式及工具結果框架（串流的 `agent` 事件、工具結果
  事件）至少需要 `operator.read`。沒有此範圍的工作階段會完全略過這些
  框架。
- 外掛定義的 `plugin.*` 廣播預設僅限 `operator.write` 或
  `operator.admin`；`plugin.approval.requested` / `plugin.approval.resolved` 等明確項目則改用
  `operator.approvals`。
- 狀態／傳輸事件（`heartbeat`、`presence`、`tick`、連線／中斷連線
  生命週期）維持不受限制，讓每個已驗證的工作階段都能觀察
  傳輸健康狀態。
- 未知的廣播事件系列預設會依範圍設限（失敗時關閉），
  除非已註冊的處理常式明確放寬限制。

每個用戶端連線都會保有自己的每用戶端序號，因此即使不同用戶端看到
事件串流中經不同範圍篩選的子集，廣播在該通訊端上仍會保持
單調排序。

## RPC 方法系列

`hello-ok.features.methods` 是由
`src/gateway/server-methods-list.ts` 加上已載入的外掛／頻道方法
匯出所建立的保守探索清單——它不是每個方法的自動產生完整傾印，且部分方法（例如
`push.test`、`web.login.start`、`web.login.wait`、`sessions.usage`）
雖然是真實且可呼叫的方法，仍刻意排除在探索之外。請將其視為功能探索，而不是
`src/gateway/server-methods/*.ts` 的完整列舉。

<AccordionGroup>
  <Accordion title="系統與身分">
    - `health` 傳回快取或新探測的閘道健康狀態快照。
    - `diagnostics.stability` 傳回近期且有界限的診斷穩定性記錄：事件名稱、計數、位元組大小、記憶體讀數、佇列／工作階段狀態、頻道／外掛名稱、工作階段 ID。不包含聊天文字、網路鉤子本文、工具輸出、原始要求／回應本文、權杖、Cookie 或密鑰。需要 `operator.read`。
    - `status` 傳回 `/status` 風格的閘道摘要；敏感欄位僅提供給具管理員範圍的操作者用戶端。
    - `gateway.identity.get` 傳回轉送與配對流程使用的閘道裝置身分。
    - `system-presence` 傳回已連線操作者／節點裝置目前的上線狀態快照。
    - `system-event` 附加系統事件，並可更新／廣播上線狀態上下文。
    - `last-heartbeat` 傳回最新持久保存的心跳偵測事件。
    - `set-heartbeats` 切換閘道上的心跳偵測處理。
    - `gateway.suspend.prepare` 僅在追蹤中的閘道工作閒置時，建立短期協同暫停租約。`gateway.suspend.status` 會檢查該租約，而 `gateway.suspend.resume` 會在解除凍結或主機作業中止後釋放租約。

  </Accordion>

  <Accordion title="模型與用量">
    - `models.list` 傳回執行階段允許的模型目錄。請參閱下方的「`models.list` 檢視」。
    - `usage.status` 傳回供應商用量時段／剩餘配額摘要。
    - `usage.cost` 傳回某日期範圍的彙總成本用量摘要。傳入 `agentId` 以指定單一代理程式，或傳入 `agentScope: "all"` 以彙總已設定的代理程式。
    - `doctor.memory.status` 傳回使用中預設代理程式工作區的向量記憶／快取嵌入就緒狀態。只有在明確即時偵測嵌入供應商時，才傳入 `{ "probe": true }` 或 `{ "deep": true }`。傳入 `{ "agentId": "agent-id" }` 可將夢境整理儲存區統計資料限定於單一代理程式工作區；省略時會彙總已設定的夢境整理工作區。
    - `doctor.memory.dreamDiary`、`doctor.memory.backfillDreamDiary`、`doctor.memory.resetDreamDiary`、`doctor.memory.resetGroundedShortTerm`、`doctor.memory.repairDreamingArtifacts` 和 `doctor.memory.dedupeDreamDiary` 接受選用的 `{ "agentId": "agent-id" }`；省略時，會對已設定的預設代理程式工作區執行操作。
    - `doctor.memory.remHarness` 傳回供遠端控制平面用戶端使用的有界限唯讀 REM 測試載具預覽，包括工作區路徑、記憶片段、已呈現且有依據的 Markdown，以及深層提升候選項目。需要 `operator.read`。
    - `sessions.usage` 傳回每個工作階段的用量摘要。傳入 `agentId` 以指定單一代理程式，或傳入 `agentScope: "all"` 以一併列出已設定的代理程式。
      兩種用量方法都接受搭配 IANA `timeZone` 的 `mode: "specific"`，以支援感知日光節約時間的曆日邊界與分組。`utcOffset` 仍支援較舊的用戶端，也會在閘道執行階段無法辨識要求的時區時作為備援。
    - `sessions.usage.timeseries` 傳回單一工作階段的時間序列用量。
    - `sessions.usage.logs` 傳回單一工作階段的用量記錄項目。

  </Accordion>

  <Accordion title="頻道與登入輔助程式">
    - `channels.status` 傳回內建及隨附頻道／外掛的狀態摘要。
    - `channels.logout` 在頻道支援時，登出指定的頻道／帳號。
    - `web.login.start` 為目前支援 QR 的網頁頻道供應商啟動 QR／網頁登入流程。
    - `web.login.wait` 等待該流程完成，並在成功時啟動頻道。
    - `push.test` 向已註冊的 iOS 節點傳送測試 APNs 推播。
    - `voicewake.get` 傳回已儲存的喚醒詞觸發條件。
    - `voicewake.set` 更新喚醒詞觸發條件並廣播變更。

  </Accordion>

  <Accordion title="外掛管理">
    - `plugins.list`（`operator.read`）傳回已安裝的外掛清單，以及本機精選的官方選項、診斷資訊，並指出目前的安裝模式是否允許變更。
    - `plugins.search`（`operator.read`）搜尋可安裝的 ClawHub 程式碼外掛及套件外掛系列。傳入非空白的 `query`，以及從 1 到 100 的選用 `limit`。
    - `plugins.install`（`operator.admin`）會以 `{ source: "official", pluginId }` 安裝官方目錄項目，或以 `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }` 安裝 ClawHub 套件。ClawHub 安裝會保留閘道信任、完整性及安裝原則檢查。安裝成功後必須重新啟動閘道。
    - `plugins.setEnabled`（`operator.admin`）以 `{ pluginId, enabled }` 變更單一已安裝外掛的啟用原則。回應包含更新後的目錄項目、重新啟動中繼資料，以及任何插槽選取警告。
    - `plugins.uninstall`（`operator.admin`）以 `{ pluginId }` 移除單一外部安裝的外掛：設定參照、安裝記錄及受管理檔案。隨附外掛無法解除安裝，只能停用。回應會列出移除動作，且一律需要重新啟動閘道。

  </Accordion>

  <Accordion title="訊息與記錄">
    - `send` 是在聊天執行器之外，針對頻道／帳號／討論串目標傳送的直接對外遞送 RPC。
    - `logs.tail` 會傳回已設定的閘道檔案記錄尾端內容，並提供游標／數量限制及最大位元組控制。

  </Accordion>

  <Accordion title="操作員終端">
    - `terminal.open` 會為明確指定的 `agentId` 或預設代理程式啟動主機 PTY，並傳回解析後的代理程式、工作目錄、殼層及隔離狀態。
    - `terminal.input`、`terminal.resize` 和 `terminal.close` 僅能操作呼叫連線所擁有的工作階段。
    - `terminal.upload` 接受一個最大 16 MiB 的 base64 檔案，將其暫存於工作階段的閘道或配對節點主機上、存續 24 小時的私有暫存目錄中，並傳回絕對路徑。呼叫端仍須貼上或以其他方式使用該路徑；此 RPC 絕不寫入終端輸入或執行命令。
    - `terminal.data` 和 `terminal.exit` 事件僅串流至擁有該工作階段的連線。
    - 連線中斷的工作階段會被卸離而非終止：在 `gateway.terminal.detachedSessionTimeoutSeconds` 期間仍可重新附加（預設為 300；`0` 會恢復中斷連線時終止），同時近期輸出會累積於有界的伺服器端緩衝區。
    - `terminal.list` 會傳回可附加的工作階段；`terminal.attach` 會將執行中或已卸離的工作階段重新繫結至呼叫連線，並傳回重播緩衝區（類似 tmux 的接管方式——先前的作用中擁有者會收到 `terminal.exit`，原因為 `detached`）；`terminal.text` 則會在不附加的情況下，以純文字讀取緩衝區。
    - 每個終端方法都需要 `operator.admin`；`gateway.terminal.enabled` 必須明確設為 true。系統會拒絕完全沙箱化的代理程式，而代理程式政策變更會關閉現有及進行中的 PTY，包括已卸離者。

  </Accordion>

  <Accordion title="對話與 TTS">
    - `talk.catalog` 會傳回語音、串流轉錄及即時語音的唯讀對話供應商目錄：標準供應商 ID、登錄別名、標籤、設定狀態、選用的群組層級 `ready` 結果、公開的模型／語音 ID、標準模式、傳輸方式、大腦策略，以及即時音訊／功能旗標，且不會傳回供應商密鑰或修改全域設定。目前的閘道會在套用執行階段供應商選擇後設定 `ready`；在較舊的閘道中，若缺少此項，應視為未驗證。
    - `talk.config` 會傳回有效的對話設定承載資料；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.session.create` 會建立由閘道擁有的對話工作階段，供 `realtime/gateway-relay`、`transcription/gateway-relay` 或 `stt-tts/managed-room` 使用。對於 `stt-tts/managed-room`，傳入 `sessionKey` 的 `operator.write` 呼叫端也必須傳入 `spawnedBy`，以取得限定範圍的工作階段金鑰可見性；建立未限定範圍的 `sessionKey` 及 `brain: "direct-tools"` 需要 `operator.admin`。
    - `talk.session.join` 會驗證受管理房間的工作階段權杖、視需要發出 `session.ready` 或 `session.replaced`，並傳回房間／工作階段中繼資料及近期對話事件，絕不傳回純文字權杖或其雜湊。
    - `talk.session.appendAudio` 會將 base64 PCM 輸入音訊附加至閘道擁有的即時轉送及轉錄工作階段。
    - `talk.session.startTurn`、`talk.session.endTurn` 和 `talk.session.cancelTurn` 會驅動受管理房間的輪次生命週期，並在清除狀態前拒絕過期輪次。
    - `talk.session.cancelOutput` 會停止助理音訊輸出，主要用於閘道轉送工作階段中由 VAD 控制的插話。
    - `talk.session.submitToolResult` 會完成由閘道擁有的即時轉送工作階段所發出的供應商工具呼叫。請求會等待供應商橋接器公開的任何非同步完成訊號；提交失敗時，連結的執行會保持作用中，且不會發出成功的工具結果事件。傳入 `options: { willContinue: true }` 可提供暫時性工具輸出；若供應商橋接器宣告支援抑制，且結果不應啟動另一個回應，則傳入 `options: { suppressResponse: true }`。
    - `talk.session.steer` 會將作用中執行的語音控制傳送至由閘道擁有、以代理程式為後端的對話工作階段：`{ sessionId, text, mode? }`，其中 `mode` 為 `status`、`steer`、`cancel` 或 `followup`；若省略模式，則會依語音文字進行分類。
    - `talk.session.close` 會關閉由閘道擁有的轉送、轉錄或受管理房間工作階段，並發出終止對話事件。
    - `talk.mode` 會為 WebChat／Control UI 用戶端設定並廣播目前的對話模式狀態。
    - `talk.client.create` 會使用 `webrtc` 或 `provider-websocket` 建立或繼續由用戶端擁有的即時供應商工作階段，同時由閘道擁有認證資訊、指示、工具政策及傳回的 `voiceSessionId`。用戶端會傳入 `sessionKey`，並在一次通話期間更換供應商傳輸方式時重複使用 `voiceSessionId`。
    - `talk.client.transcript` 會將一個已完成的 `{ role, text }` 項目附加至一般代理程式工作階段。必要的 `entryId` 在 `voiceSessionId` 內具冪等性；重試不會重複產生逐字稿訊息。
    - `talk.client.close` 會在待處理的逐字稿寫入完成後關閉邏輯語音工作階段。關閉操作具冪等性，並可能將僅含變更的通話摘要遞送至該工作階段最後一個非 WebChat 頻道。
    - `talk.client.toolCall` 可讓由用戶端擁有的即時傳輸方式將供應商工具呼叫轉送至閘道政策。第一個支援的工具是 `openclaw_agent_consult`；用戶端會取得執行 ID，並等待一般聊天生命週期事件，再提交供應商專屬的工具結果。與語音繫結的高影響操作會傳回 `VOICE_CONFIRMATION_REQUIRED:<id>`，直到之後完成的使用者語句明確確認該確切操作，且下一次諮詢提供 `confirmationId`。
    - `talk.client.steer` 會為由用戶端擁有的即時傳輸方式傳送作用中執行的語音控制。閘道會從 `sessionKey` 解析作用中的內嵌執行，並傳回結構化的接受／拒絕結果，而非無聲地捨棄導引。
    - `talk.event` 是即時、轉錄、STT／TTS、受管理房間、電話及會議介接器共用的單一對話事件頻道。
    - `talk.speak` 會透過作用中的對話語音供應商合成語音。
    - `tts.status` 會傳回 TTS 啟用狀態、作用中供應商、備援供應商及供應商設定狀態。
    - `tts.providers` 會傳回可見的 TTS 供應商清單。
    - `tts.enable` 和 `tts.disable` 會切換 TTS 偏好設定狀態。
    - `tts.setProvider` 會更新偏好的 TTS 供應商。
    - `tts.convert` 會執行一次性的文字轉語音轉換。
    - `tts.speak`（`operator.write`）會使用已設定的一般 TTS 供應商鏈來轉譯非空的 `text`，並以 `audioBase64` 形式行內傳回一個完整音訊片段，以及 `provider` 和選用的 `outputFormat`、`mimeType`、`fileExtension` 中繼資料。與 `tts.convert` 不同，它不會傳回閘道本機路徑；與 `talk.speak` 不同，它不需要對話供應商。超過 `messages.tts.maxTextLength` 的文字會傳回 `INVALID_REQUEST`；合成失敗會傳回 `UNAVAILABLE`。

  </Accordion>

  <Accordion title="密鑰、設定、更新與精靈">
    - `secrets.reload` 會重新解析作用中的 SecretRef，並以不可分割方式發布可識別擁有者的執行階段狀態。符合條件的擁有者失敗可透過 `warningCount` 發布為冷降級或過期降級；嚴格或未對應的失敗會拒絕重新載入，並保留作用中的快照。
    - `secrets.resolve` 會為特定命令／目標集合解析命令目標密鑰指派。
    - `config.get` 會傳回目前的磁碟設定快照、原始根檔案 `hash`、解析後的 `configRevisionHash`，以及作用中閘道執行階段所接受之解析後修訂版本的選用 `appliedConfigHash`。
    - `config.set` 會寫入已驗證的設定承載資料。
    - `config.patch` 會合併部分設定更新。破壞性的陣列取代需要將受影響的路徑加入 `replacePaths`；陣列項目下的巢狀陣列使用 `[]` 路徑，例如 `agents.list[].skills`。
    - `config.apply` 會驗證並取代完整的設定承載資料。
    - `config.schema` 會傳回 Control UI 和命令列介面工具所使用的即時設定結構描述承載資料：結構描述、`uiHints`、版本、產生中繼資料，以及可載入時的外掛與頻道結構描述中繼資料。它包含與 UI 相同標籤／說明文字中的 `title`／`description` 中繼資料，包括巢狀物件、萬用字元、陣列項目，以及在有相符欄位文件時的 `anyOf`／`oneOf`／`allOf` 組合分支。
    - `config.schema.lookup` 會傳回單一設定路徑的路徑限定查詢承載資料：正規化路徑、淺層結構描述節點、相符的提示與 `hintPath`、選用的 `reloadKind`，以及供 UI／命令列介面逐層查看的直接子項摘要。`reloadKind` 是 `restart`、`hot` 或 `none`（`src/config/schema.ts`）之一，並針對所要求的路徑反映閘道設定重新載入規劃器。查詢結構描述節點會保留使用者可見的文件及常見驗證欄位（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、數值／字串／陣列／物件界限、`additionalProperties`、`deprecated`、`readOnly`、`writeOnly`）。子項摘要會公開 `key`、正規化的 `path`、`type`、`required`、`hasChildren`、選用的 `reloadKind`，以及相符的 `hint`／`hintPath`。
    - `update.run` 會執行閘道更新流程，且僅在更新成功時排定重新啟動；具有工作階段的呼叫端可包含 `continuationMessage`，讓啟動流程透過重新啟動接續佇列繼續一輪後續代理程式執行。來自控制平面的套件管理員更新及受監督的 Git 工作目錄更新，會使用卸離的受管理服務交接，而非在運作中的閘道內取代套件樹狀結構或修改工作目錄／建置輸出。已啟動的交接會傳回 `ok: true`，以及 `result.reason: "managed-service-handoff-started"` 和 `handoff.status: "started"`。由同一閘道處理程序處理的第二個並行 `update.run` 會傳回 `ok: false`，以及 `result.reason: "managed-service-handoff-already-running"` 和 `handoff.status: "already-running"`；其接續要求不會被接受，因此呼叫端可在作用中更新完成後重試。獨立的命令列介面更新程式及替代閘道處理程序不受此處理程序本機防護限制。無法使用或失敗的交接會傳回 `ok: false`，以及 `managed-service-handoff-unavailable` 或 `managed-service-handoff-failed`；需要手動從殼層更新時，還會傳回 `handoff.command`。“無法使用”表示 OpenClaw 缺少安全的監督程式邊界或持久服務識別，例如 systemd 的 `OPENCLAW_SYSTEMD_UNIT`。在已啟動的交接期間，重新啟動哨兵可能會短暫回報 `stats.reason: "restart-health-pending"`；接續作業會延遲，直到命令列介面驗證已重新啟動的閘道，並寫入最終的 `ok` 哨兵。
    - `update.status` 會重新整理並傳回最新的更新重新啟動哨兵，包括可用時重新啟動後執行中的版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 會透過 WS RPC 公開初始設定精靈。

  </Accordion>

  <Accordion title="代理程式與工作區輔助功能">
    - `agents.list` 會傳回已設定的代理程式項目，包括實際生效的模型與執行階段中繼資料。
    - `agents.create`、`agents.update` 和 `agents.delete` 用於管理代理程式記錄與工作區連接。
    - `agents.files.list`、`agents.files.get` 和 `agents.files.set` 用於管理向代理程式公開的啟動工作區檔案。
    - `audit.activity.list` 會傳回具版本控制且僅含中繼資料的活動帳本；`audit.list` 仍是確保相容性的執行／工具 RPC。
    - `agents.workspace.list` 和 `agents.workspace.get`（`operator.read`）讓[操作員範圍](/zh-TW/gateway/operator-scopes)所述受信任操作員網域中的用戶端，能以唯讀、分頁方式瀏覽代理程式的工作區目錄。要求僅接受工作區相對路徑；讀取範圍會限制在經 realpath 解析的工作區根目錄內（拒絕透過符號連結與硬連結逸出），設有大小上限，且僅限 UTF-8 文字與常見影像類型（base64）。回應不會公開主機上的工作區路徑。此命名空間不提供寫入操作。
    - `tasks.list`、`tasks.get` 和 `tasks.cancel` 會向 SDK 與操作員用戶端公開閘道工作帳本。請參閱下方的[工作帳本 RPC](#task-ledger-rpcs)。
    - `artifacts.list`、`artifacts.get` 和 `artifacts.download` 會針對明確的 `sessionKey`、`runId` 或 `taskId` 範圍，公開由逐字記錄衍生的成品摘要與下載項目。執行與工作查詢會在伺服器端解析其所屬工作階段，且只傳回來源資訊相符的逐字記錄媒體；對於不安全或本機 URL 來源，則傳回不支援的下載結果，而不會在伺服器端擷取。
    - `environments.list` 和 `environments.status` 會保留閘道本機與節點環境探索功能。已設定的雲端工作程式，以及先前設定檔留下的持久記錄，會新增 `worker` 中繼資料，其中包含 `providerId`、選用的 `leaseId`、`state`、`ageMs`、選用的 `idleMs` 和 `attachedSessionIds`。工作程式的生命週期狀態為 `requested`、`provisioning`、`bootstrapping`、`ready`、`attached`、`idle`、`draining`、`destroying`、`destroyed`、`failed` 和 `orphaned`。
    - `environments.create`（`{ profileId, idempotencyKey }`）會從已設定的外掛提供者設定檔佈建工作程式；使用相同金鑰重試時，會重用持久操作。`environments.destroy`（`{ environmentId }`）會要求以冪等方式拆除持久工作程式環境。兩者皆需要 `operator.admin`，屬於控制平面寫入操作，並傳回與狀態回應所用相同結構的環境摘要。
    - `agent.identity.get` 會傳回代理程式或工作階段實際生效的助理身分。
    - `agent.wait` 會等待執行完成，並在可用時傳回終止狀態快照。

  </Accordion>

  <Accordion title="工作階段控制">
    - `sessions.list` 會傳回目前的工作階段索引；若已設定代理程式執行階段後端，則包括每列的 `agentRuntime` 中繼資料。啟用雲端工作程式配置或存在持久復原狀態時，工作階段列也會包括封閉的 `placement` 狀態（`local`、`requested`、`provisioning`、`syncing`、`starting`、`active`、`draining`、`reconciling`、`reclaimed` 或 `failed`），以及依狀態而異的環境、擁有者時期、工作區、套件組合、ACK 游標或復原欄位。
    - `sessions.subscribe` 和 `sessions.unsubscribe` 會切換目前 WS 用戶端的工作階段變更事件訂閱。
    - `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 會切換單一工作階段的逐字記錄／訊息事件訂閱。傳入 `includeApprovals: true`，即可同時接收已清理的 `session.approval` 生命週期事件，但僅限其持久化受眾包含該確切工作階段，且其審查者繫結授權訂閱用戶端的核准作業。此時，訂閱回應會包含有界的待處理 `approvalReplay`；當 `truncated` 為 false 時，此資料具有權威性。此選擇加入設定以每次訂閱呼叫為單位，不會持續保留：若重新訂閱相同工作階段時未傳入 `includeApprovals: true`，便會移除現有的核准訂閱。除了正常的工作階段讀取權限外，此選擇加入還需要 `operator.admin`，或在已配對裝置上具備 `operator.approvals`。
    - `sessions.preview` 會傳回特定工作階段金鑰的有界逐字記錄預覽。
    - `sessions.describe` 會傳回與確切工作階段金鑰對應的一筆閘道工作階段資料列。
    - `sessions.resolve` 會解析工作階段目標或將其正規化。
    - `sessions.create` 會建立新的工作階段項目。選用的 `model` 與 `thinkingLevel` 值會以不可分割的方式持久保存初始模型與推理覆寫設定。`worktree: true` 會佈建受管理的工作樹；選用的 `worktreeBaseRef`/`worktreeName` 會選取基底參照與分支名稱，而 `execNode`（`operator.admin`）則會將工作階段執行繫結至節點主機。建立的工作樹會在結果中回傳，並持久保存於工作階段資料列（`worktree: { id, branch, repoRoot }`）中。若項目已建立，但其巢狀的初始 `chat.send` 遭拒，成功結果會包含 `runStarted: false` 和 `runError`；用戶端可以保留提示，並使用傳回的工作階段金鑰重試。傳入 `parentSessionKey` 與 `emitCommandHooks: true` 的呼叫端，也應宣告不同子工作階段的生命週期處置方式：`succeedsParent: true` 會以 `session_end` 結束父工作階段，而 `false` 會讓父工作階段保持作用中，且僅發出子工作階段的 `session_start`。省略 `succeedsParent` 會為現有用戶端保留舊版父工作階段輪替行為。此處置方式同時需要父工作階段連結與命令掛鉤；分支工作階段不能讓其父工作階段成功。主工作階段的就地重設行為維持不變，因為不會建立不同的子工作階段。
    - `sessions.dispatch`（`operator.admin`）會將具備工作階段自有受管理工作樹的現有本機 OpenClaw 工作階段，移至已設定的雲端工作程式設定檔。請傳入 `{ key, profileId, agentId? }`。若未設定工作程式設定檔，便不會提供此方法；此方法會在排空作用中工作前停止接受本機回合，並僅在配置達到 `active` 工作程式擁有權後才傳回。分派是單向的；將工作程式拉回本機不屬於此 RPC 的功能。
    - `sessions.groups.list`、`sessions.groups.put`、`sessions.groups.rename` 和 `sessions.groups.delete` 用於管理閘道所擁有的自訂工作階段群組目錄（名稱與顯示順序）。成員資格仍儲存在各工作階段的 `category` 欄位；重新命名與刪除會在伺服器端更新成員工作階段。
    - `sessions.send` 會將訊息傳送至現有工作階段。
    - `sessions.steer` 是作用中工作階段的中斷並引導變體。
    - `sessions.abort` 會中止工作階段的作用中工作。請傳入 `key` 與選用的 `runId`，或僅傳入 `runId`，以中止閘道可解析至工作階段的作用中執行。
    - `sessions.patch` 會更新工作階段中繼資料／覆寫設定，並回報解析後的正規模型與實際生效的 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 和 `sessions.compact` 會執行工作階段維護。
    - `sessions.get` 會傳回完整儲存的工作階段資料列。
    - 聊天執行仍會使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。`chat.history` 會針對 UI 用戶端進行顯示正規化：從可見文字中移除行內指令標籤、純文字工具呼叫 XML 承載資料（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和遭截斷的工具呼叫區塊）以及洩漏的 ASCII／全形模型控制權杖；省略完全由靜默權杖組成的助理資料列（完全符合 `NO_REPLY` / `no_reply`），且可用預留位置取代過大的資料列。
    - `chat.message.get` 是針對單一可見逐字記錄項目新增的有界完整訊息讀取器。請傳入 `sessionKey`、工作階段選取範圍限定於代理程式時選用的 `agentId`，以及先前透過 `chat.history` 公開的逐字記錄 `messageId`；若儲存的項目仍可用且未超過大小限制，閘道會傳回相同的顯示正規化投影，但不套用輕量記錄的截斷上限。
    - `chat.toolTitles` 會傳回在控制 UI 中呈現之工具呼叫的簡短用途標題（批次處理，最多 24 個項目，輸入有界）。此功能可透過 `gateway.controlUi.toolTitles` 選擇加入（預設關閉）；停用此功能的閘道會以 `{ titles: {}, disabled: true }` 回應，且不呼叫模型，讓用戶端停止要求。啟用後，標題會使用標準的公用模型路由：優先使用明確設定的 `utilityModel`（這是操作員的決策，與所有公用工作相同，可能會將有界的工作內容傳送至所選提供者）；否則使用工作階段提供者宣告的預設小型模型，因此不會隱含出現新的資料傳出目的地；空白的 `utilityModel` 會完全停用標題。標題絕不會後援至主要模型。結果會依工具名稱與輸入作為金鑰，快取於每個代理程式的狀態資料庫中，因此重複檢視絕不會對相同呼叫再次計費。
    - `chat.send` 接受單回合的 `fastMode: "auto"`，讓自動截止時間前開始的模型呼叫使用快速模式，之後開始的重試、後援、工具結果或接續呼叫則不使用快速模式。截止時間預設為 60 秒（`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`），並可使用 `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` 依模型設定。`chat.send` 呼叫端可傳入單回合的 `fastAutoOnSeconds`，覆寫該要求的截止時間。傳入 `queueMode`（`steer`、`followup`、`collect` 或 `interrupt`），即可僅針對此要求覆寫已儲存的佇列模式；明確的控制 UI 引導動作會使用 `queueMode: "steer"`。

  </Accordion>

  <Accordion title="裝置配對與裝置權杖">
    - `device.pair.list` 會傳回待處理及已核准的配對裝置。
    - `device.pair.setupCode` 會建立行動裝置設定碼，預設也會建立 PNG QR 圖碼資料 URL。此操作需要 `operator.admin`，且刻意不會列入公開的探索資訊。結果包含 `setupCode`、選用的 `qrDataUrl`、`gatewayUrl`、非機密的 `auth` 標籤，以及 `urlSource`。
    - `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 用於管理裝置配對記錄。
    - `device.pair.rename` 會指派操作員標籤（`{ deviceId, label }`）；此標籤的優先順序高於用戶端回報的顯示名稱，且會在裝置修復或重新核准後保留。
    - `device.token.rotate` 會在已核准的角色與呼叫端範圍界限內，輪替已配對裝置權杖。
    - `device.token.revoke` 會在已核准的角色與呼叫端範圍界限內，撤銷已配對裝置權杖。

    設定碼內嵌短效的啟動認證資訊。用戶端不得
    在配對流程之外記錄或持久保存該資訊。

  </Accordion>

  <Accordion title="節點配對、叫用與待處理工作">
    - `node.pair.list`、`node.pair.approve`、`node.pair.reject` 和 `node.pair.remove` 涵蓋節點能力核准。`node.pair.request` 和 `node.pair.verify` 已於 2026.7 隨獨立的節點配對儲存區一併移除；待處理要求會在節點連線時由閘道建立。
    - `node.list` 和 `node.describe` 會傳回已知／已連線的節點狀態。
    - `node.rename` 會更新已配對節點的標籤。
    - `node.invoke` 會將命令轉送至已連線的節點。
    - `node.invoke.result` 會傳回叫用要求的結果。
    - `mcp.tools.call.v1` 是用於呼叫已設定之節點本機 MCP 工具的無頭節點主機命令。它透過 `node.invoke` 傳送，要求節點宣告該命令，且仍受配對核准和 `gateway.nodes.denyCommands` 約束。
    - `node.event` 會將源自節點的事件傳回閘道。
    - `node.pluginTools.update` 是取代已連線節點之代理可見外掛／MCP 工具描述元的唯一發布路徑；`connect` 參數不會攜帶這些描述元。
    - `node.pending.pull` 和 `node.pending.ack` 是已連線節點的佇列 API。
    - `node.pending.enqueue` 和 `node.pending.drain` 會管理離線／中斷連線節點的持久待處理工作。

  </Accordion>

  <Accordion title="核准系列">
    - `approval.history` 會依最新優先順序傳回保留 30 天的終止狀態核准，涵蓋執行、外掛和系統代理要求（範圍 `operator.approvals`）。它支援游標分頁及選用的種類篩選器；待處理核准不是歷程記錄列。
    - `approval.get` 和 `approval.resolve` 是不區分種類的持久核准方法（範圍 `operator.approvals`）。`approval.get` 會傳回經過清理的待處理或已保留終止狀態投影，並具有穩定的 `urlPath`；`approval.resolve` 接受標準核准 ID、明確的 `kind` 和決策，套用先回覆者勝出的解析規則，且一律傳回已記錄的標準結果。
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 涵蓋單次執行核准要求，以及待處理核准的查詢／重播。它們是同一持久核准登錄的通訊協定邊界配接器。
    - `exec.approval.waitDecision` 會等待一項待處理的執行核准，並傳回最終決策（若逾時則傳回 `null`）。
    - `exec.approvals.get` 和 `exec.approvals.set` 會管理閘道執行核准原則快照。
    - `exec.approvals.node.get` 和 `exec.approvals.node.set` 會透過節點轉送命令管理節點本機的執行核准原則。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 涵蓋由外掛定義的核准流程。

  </Accordion>

  <Accordion title="Control UI 命令">
    - `ui.command` 可讓 `operator.write` 呼叫端向宣告 `ui-commands` 能力的已連線 Control UI 用戶端傳送具型別的版面配置與導覽命令。
    - 命令涵蓋窗格分割／關閉／聚焦、側邊欄可見性、終端機／瀏覽器面板的可見性與停駐位置，以及工作階段導覽。
    - 通訊協定 v1 會刻意廣播至每個已連線且具備相應能力的 Control UI。若沒有任何此類 Control UI 連線，要求會以 `UNAVAILABLE` 失敗，而不會假裝版面配置已變更。

  </Accordion>

  <Accordion title="自動化、Skills 與工具">
    - 自動化：`wake` 會排程立即或在下一次心跳偵測時注入喚醒文字；`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 會管理排程工作。
    - `cron.run` 仍是供手動執行使用的入列式 RPC。需要完成語意的用戶端應讀取傳回的 `runId`，並輪詢 `cron.runs`。
    - `cron.runs` 接受選用且非空的 `runId` 篩選器，使用戶端能追蹤單一已排入佇列的手動執行，而不會與同一工作的其他歷程項目發生競爭。
    - Skills 與工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。請參閱下方的[操作員輔助方法](#operator-helper-methods)。

  </Accordion>
</AccordionGroup>

### 常見事件系列

- `chat`：UI 聊天更新，例如 `chat.inject` 和其他僅限文字記錄的聊天
  事件。在通訊協定 v4 中，差異承載資料會攜帶 `deltaText`；`message` 仍是
  累積的助理快照。非前綴取代會設定
  `replace=true`，並使用 `deltaText` 作為取代文字。
- `session.message`、`session.operation`、`session.tool`：所訂閱工作階段的文字記錄、進行中的
  工作階段作業，以及事件串流更新。
- `session.approval`：供明確選擇加入之精確工作階段訂閱者使用的、經過清理的待處理與終止狀態核准事實。
  子核准會使用已保存的祖先對象；事件絕不會修改文字記錄或喚醒代理。
- `sessions.changed`：工作階段索引或中繼資料已變更。
- `presence`：系統在線狀態快照更新。
- `tick`：週期性保持連線／存活事件。
- `health`：閘道健康狀態快照更新。
- `heartbeat`：心跳偵測事件串流更新。
- `cron`：排程執行／工作變更事件。
- `shutdown`：閘道關閉通知。
- `node.pair.requested` / `node.pair.resolved`：節點配對生命週期。
- `node.invoke.request`：節點叫用要求廣播。
- `device.pair.requested` / `device.pair.resolved`：已配對裝置生命週期。
- `voicewake.changed`：喚醒詞觸發設定已變更。
- `config.changed`：設定寫入已保存（承載資料包含設定路徑、
  新快照雜湊值與時間戳記——絕不包含設定內容）。範圍限定為操作員讀取；
  用戶端透過 `config.get` 重新整理。
- `exec.approval.requested` / `exec.approval.resolved`：執行核准
  生命週期。
- `plugin.approval.requested` / `plugin.approval.resolved`：外掛核准
  生命週期。

### 節點輔助方法

節點可以呼叫 `skills.bins`，擷取目前的 Skill 可執行檔清單，
以進行自動允許檢查。

## 稽核分類帳 RPC

`audit.activity.list` 為操作員用戶端提供代理執行、工具動作和選擇加入之訊息生命週期中繼資料的穩定最新優先檢視。
它需要 `operator.read`。查詢會排除超過 30 天的記錄，而共用
SQLite 分類帳的上限為 100,000 筆記錄。過期資料列會在
閘道啟動、每小時維護及後續寫入期間刪除。資料模型與隱私權語意請參閱
[稽核歷程](/zh-TW/gateway/audit)。

- 參數：選用的精確 `agentId`、`sessionKey` 或 `runId`；選用的 `kind`
  （`"agent_run"`、`"tool_action"` 或 `"message"`）；選用的 `status`
  （`"started"`、`"succeeded"`、`"failed"`、`"cancelled"`、`"timed_out"`、
  `"blocked"` 或 `"unknown"`）；選用的訊息 `direction`（`"inbound"` 或
  `"outbound"`）和精確的 `channel`；選用的含邊界 `after` / `before`
  Unix 毫秒界限；選用的 `limit`，範圍從 `1` 到 `500`；以及選用的
  字串 `cursor`，取自上一頁。
- 結果：`{ "events": AuditActivityEventV1[], "nextCursor"?: string }`。

具名的 V1 結果聯集具有各自獨立的代理執行、工具動作、傳入訊息
和傳出訊息結構描述。`eventType` 判別欄位依序為
`agent_run`、`tool_action`、`inbound_message` 或 `outbound_message`；`kind` 和
訊息 `direction` 仍可用於篩選與顯示。每個事件都有
整數 `schemaVersion: 1`。訊息身分參照使用精確的
`hmac-sha256:v1:<32 hex key id>:<64 hex digest>` 格式；頻道傳送者的動作者
ID 使用相同格式。

所有變體都需要 `eventType`、`schemaVersion`、`eventId`、`sequence`、
`sourceSequence`、`occurredAt`、`kind`、`action`、`status`、`actor` 和
`redaction`。變體欄位如下：

| `eventType`        | 必要欄位                                                   | 選用欄位                                                                                                                 |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`、`runId`；`kind: "agent_run"`                           | `sessionKey`、`sessionId`、`errorCode`                                                                                          |
| `tool_action`      | `agentId`、`runId`；`kind: "tool_action"`                         | `sessionKey`、`sessionId`、`toolCallId`、`toolName`、`errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`、`channel`、`conversationKind`、`outcome`  | `agentId`、`runId`、`durationMs`、`resultCount`、身分參照、`reasonCode`、`errorCode`                                 |
| `outbound_message` | `direction: "outbound"`、`channel`、`conversationKind`、`outcome` | `agentId`、`runId`、`durationMs`、`resultCount`、身分參照、`reasonCode`、`deliveryKind`、`failureStage`、`errorCode` |

封閉式訊息列舉如下：

- `conversationKind`：`direct`、`group`、`channel` 或 `unknown`。
- 傳入 `outcome`：`completed`、`skipped` 或 `failed`；選用的
  `reasonCode`：`duplicate`、`reply_operation_active`、
  `reply_operation_aborted`、`fast_abort`、`plugin_bound_handled`、
  `plugin_bound_unavailable`、`plugin_bound_declined`、`plugin_bound_error`、
  `before_dispatch_handled`、`acp_dispatch_completed`、`acp_dispatch_failed`、
  `acp_dispatch_empty` 或 `acp_dispatch_aborted`。
- 傳出 `outcome`：`sent`、`suppressed`、`failed` 或 `unknown`；選用的
  `reasonCode`：`cancelled_by_message_sending_hook`、
  `cancelled_by_reply_payload_sending_hook`、
  `empty_after_message_sending_hook`、`empty_after_reply_payload_sending_hook`
  或 `no_visible_payload`。未傳回平台身分的配接器屬於
  `unknown`，因為無法證明外部副作用未發生。
- `deliveryKind`：`text`、`media` 或 `other`；`failureStage`：
  `platform_send`、`queue` 或 `unknown`。

終止狀態欄位彼此相關，並非各自獨立選用：

| 變體             | 終止狀態對應                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 代理程式執行     | `started` 沒有 `errorCode`；每個非成功的已完成狀態都需要其對應的 `run_*` 代碼。                                                         |
| 工具動作         | `started` 和成功狀態沒有 `errorCode`；其他每個已完成狀態都需要其對應的 `tool_*` 代碼。                                                  |
| 輸入訊息         | 成功 = `completed`；遭封鎖 = `skipped`；失敗 = `failed` 加上 `message_processing_failed`。若有 `reasonCode`，則必須屬於該終止狀態系列。 |
| 輸出訊息         | 成功 = `sent`；遭封鎖 = `suppressed` 加上 `reasonCode`；失敗 = `failed` 加上 `errorCode` 和 `failureStage`；未知 = `unknown` 加上 `failureStage`。      |

每個活動事件都包含穩定的事件 ID、單調遞增的分類帳序號、
來源事件序號、時間戳記、執行者、動作、狀態、整數
`schemaVersion: 1`，以及 `redaction: "metadata_only"`。執行和工具記錄
需要代理程式與執行來源資訊，也可能包含工作階段來源資訊。訊息
記錄可能包含代理程式和執行 ID，但刻意永不包含
`sessionKey` 或 `sessionId`；因此 `sessionKey` 查詢篩選條件僅適用於
執行和工具資料列。工具事件可能包含工具呼叫 ID 和工具名稱。

訊息記錄使用 `message.inbound.processed` 或
`message.outbound.finished`，並新增方向、頻道、對話種類、
正規化結果，以及選用的傳遞種類、失敗階段、持續時間、
結果數量、原因代碼，與以安裝執行個體本機金鑰產生的
帳號／對話／訊息／目標假名。這些假名有助於
建立關聯，但並非匿名化：狀態資料庫包含其金鑰，
而 RPC 與命令列介面匯出內容則不包含。分類帳不會儲存提示詞、訊息
本文、工具引數、工具結果、命令輸出或原始錯誤文字。
執行／工具的 `sessionKey` 值仍是原始關聯中繼資料，且可能嵌入
平台帳號或對等端 ID；訊息記錄會省略工作階段金鑰。

對於輸入資料列，`durationMs` 會測量核心分派直到其終止狀態為止的時間，而
`resultCount` 則計算已完成的佇列工具、封鎖與回覆承載內容數量。對於
輸出資料列，`durationMs` 涵蓋從傳遞權責開始，直到確認、
無法投遞或核對為止的時間（包括佇列等候時間），而 `resultCount`
則計算已識別的實體平台傳送次數。若有 `deliveryKind`，
其描述的是經過鉤子和呈現處理後的有效承載內容；遭抑制或
當機狀態不明確的資料列會省略此欄位。

目前的訊息涵蓋範圍包括到達核心
分派的已接受輸入訊息，包括核心重複／終止結果。對於到達共用持久
傳遞機制的每個原始邏輯回覆承載內容，輸出涵蓋範圍會寫入
一筆終止資料列；分塊和介面卡扇出會彙總於 `resultCount`。可重試或結果不明確的佇列
傳送，僅會在確認、無法投遞或核對後記錄。
繞過這些共用邊界的外掛本機與直接傳送路徑目前尚未涵蓋。
有界工作佇列採盡力而為，且在發生失敗或飽和時可能捨棄記錄，
因此此介面並非無遺失的合規封存。

記錄功能預設為啟用，並由
[`audit.enabled`](/zh-TW/gateway/configuration-reference#audit) 控制。訊息記錄則
由 `audit.messages` 個別控制，預設為 `"off"`。停用
記錄功能時，`audit.activity.list` 仍會提供先前寫入的記錄，
直到記錄到期。

已發行的 `audit.list` 請求、結果和 `AuditEvent` 結構描述維持
不變，且僅傳回代理程式執行與工具動作記錄。新的操作員
用戶端應在閘道宣告支援時呼叫 `audit.activity.list`。較舊的
閘道可能會向具有讀取範圍的請求回報 `unknown method: audit.activity.list`，或因為
已發行版本是在方法查找之前進行授權，而回報 `missing scope:
operator.admin`。只有在未宣告該方法時，
才將後者視為方法不存在。接著，只有當其篩選條件不需要訊息種類、方向或頻道
支援時，用戶端才可重試 `audit.list`。

使用 [`openclaw audit`](/zh-TW/cli/audit) 進行文字查詢與有界 JSON 匯出。

## 任務分類帳 RPC

操作員用戶端透過
任務分類帳 RPC（`packages/gateway-protocol/src/schema/tasks.ts`）檢查及取消閘道背景任務記錄。這些
RPC 傳回的是經過清理的任務摘要，而非原始執行階段狀態。

- `tasks.list` 需要 `operator.read`。
  - 參數：選用的 `status`（`"queued"`、`"running"`、`"completed"`、
    `"failed"`、`"cancelled"` 或 `"timed_out"`）或這些狀態的陣列，
    選用的 `agentId`、選用的 `sessionKey`、從 `1` 到
    `500` 的選用 `limit`，以及選用的字串 `cursor`。
  - 結果：`{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` 需要 `operator.read`。
  - 參數：`{ "taskId": string }`。
  - 結果：`{ "task": TaskSummary }`。
  - 不存在的任務 ID 會傳回閘道的「找不到」錯誤格式。
- `tasks.cancel` 需要 `operator.write`。
  - 參數：`{ "taskId": string, "reason"?: string }`。
  - 結果：`{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` 表示分類帳是否有相符的任務。`cancelled`
    表示執行階段是否接受或記錄取消要求。

`TaskSummary` 包含 `id`、`status`，以及選用的中繼資料：`kind`、
`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、
`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、時間戳記、進度、
終止摘要，以及經過清理的錯誤文字。`agentId` 識別執行該任務的代理程式；
`sessionKey` 和 `ownerKey` 則保留請求者與控制情境。

## 操作員輔助方法

- `commands.list`（`operator.read`）會擷取代理程式的執行階段命令清單。
  - `agentId` 為選填；省略即可讀取預設代理程式工作區。
  - `scope` 控制主要 `name` 所針對的介面：`text` 會傳回不含開頭 `/` 的主要文字命令權杖；`native` 與預設的 `both` 路徑會在可用時傳回可感知提供者的原生命名。
  - `textAliases` 包含確切的斜線別名，例如 `/model` 和 `/m`。
  - `nativeName` 會在存在時包含可感知提供者的原生命令名稱。
  - `provider` 為選填，且只會影響原生命名與原生外掛命令的可用性。
  - `includeArgs=false` 會從回應中省略序列化的引數中繼資料。
- `tools.catalog`（`operator.read`）會擷取代理程式的執行階段工具目錄。回應包含分組的工具與來源中繼資料：
  - `source`：`core` 或 `plugin`
  - `pluginId`：當 `source="plugin"` 時為外掛擁有者
  - `optional`：外掛工具是否為選用
- `tools.effective`（`operator.read`）會擷取工作階段中實際生效的執行階段工具清單。
  - `sessionKey` 為必填。
  - 閘道會在伺服器端從工作階段衍生可信任的執行階段內容，而不接受呼叫端提供的驗證或傳遞內容。
  - 回應是由伺服器衍生、限定於工作階段的作用中清單投影，其中包含核心、外掛、頻道，以及已探索到的 MCP 伺服器工具。
  - `tools.effective` 對 MCP 為唯讀：它可以透過最終工具政策投影已暖機工作階段的 MCP 目錄，但不會建立 MCP 執行階段、連線傳輸層或發出 `tools/list`。若不存在相符的已暖機目錄，回應可能包含 `mcp-not-yet-connected`、`mcp-not-yet-listed` 或 `mcp-stale-catalog` 等通知。
  - 實際生效的工具項目使用 `source="core"`、`source="plugin"`、`source="channel"` 或 `source="mcp"`。
- `tools.invoke`（`operator.write`）會透過與 `/tools/invoke` 相同的閘道政策路徑叫用一個可用工具。
  - `name` 為必填。`args`、`sessionKey`、`agentId`、`confirm` 與 `idempotencyKey` 為選填。
  - 如果 `sessionKey` 和 `agentId` 同時存在，解析出的工作階段代理程式必須與 `agentId` 相符。
  - 僅限擁有者使用的核心包裝函式（例如 `cron`、`gateway` 和 `nodes`）需要擁有者／管理員身分（`operator.admin`），即使 `tools.invoke` 本身是 `operator.write`。
  - 回應是面向 SDK 的封裝，包含 `ok`、`toolName`、選填的 `output`，以及具型別的 `error` 欄位。核准或政策拒絕會在承載資料中傳回 `ok:false`，而不會繞過閘道工具政策流水線。
- `skills.status`（`operator.read`）會擷取代理程式可見的 Skill 清單。
  - `agentId` 為選填；省略即可讀取預設代理程式工作區。
  - 回應包含資格、缺少的需求、設定檢查，以及經過清理且不會暴露原始祕密值的安裝選項。
- `skills.search` 與 `skills.detail`（`operator.read`）會傳回 ClawHub 探索中繼資料。
- `skills.upload.begin`、`skills.upload.chunk` 與 `skills.upload.commit`（`operator.admin`）會在安裝私人 Skill 封存檔前先暫存。這是供可信任用戶端使用的獨立管理員上傳路徑，並非一般的 ClawHub Skill 安裝流程；除非啟用 `skills.install.allowUploadedArchives`，否則預設停用。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` 會建立繫結至該 slug 與 force 值的上傳。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` 會在解碼後的確切位移處附加位元組。
  - `skills.upload.commit({ uploadId, sha256? })` 會驗證最終大小與 SHA-256。提交只會完成上傳，不會安裝 Skill。
  - 上傳的 Skill 封存檔是包含 `SKILL.md` 根目錄的 zip 封存檔。封存檔內部的目錄名稱絕不會選取安裝目標。
- `skills.install`（`operator.admin`）有三種模式：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 會將 Skill 資料夾安裝至預設代理程式工作區的 `skills/` 目錄。
  - 上傳模式：`{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` 會將已提交的上傳安裝至預設代理程式工作區的 `skills/<slug>` 目錄。slug 與 force 值必須符合原始的 `skills.upload.begin` 要求。除非啟用 `skills.install.allowUploadedArchives`，否則會遭拒；此設定不影響 ClawHub 安裝。
  - 閘道安裝程式模式：`{ name, installId, timeoutMs? }` 會在閘道主機上執行已宣告的 `metadata.openclaw.install` 動作。舊版用戶端可能仍會傳送 `dangerouslyForceUnsafeInstall`；此欄位已淘汰，只為通訊協定相容性而接受，且會被忽略。由操作員決定的安裝應使用 `security.installPolicy`。
- `skills.update`（`operator.admin`）有兩種模式：
  - ClawHub 模式會更新預設代理程式工作區中一個受追蹤的 slug，或所有受追蹤的 ClawHub 安裝。
  - 設定模式會修補 `skills.entries.<skillKey>` 值，例如 `enabled`、`apiKey` 和 `env`。

### `models.list` 檢視

`models.list` 接受選填的 `view` 參數（`src/agents/model-catalog-visibility.ts`）：

- 省略或 `"default"`：若已設定 `agents.defaults.modelPolicy.allow`，回應會是允許的目錄，其中包含為 `provider/*` 項目動態探索到的模型。否則，回應會是完整的閘道目錄。
- `"configured"`：符合選擇器規模的行為。若已設定 `agents.defaults.modelPolicy.allow`，仍以其為準，包括針對 `provider/*` 項目限定於提供者範圍的探索。若沒有允許清單，回應會使用明確的 `models.providers.<provider>.models` 項目，只有在不存在已設定的模型資料列時，才會退回完整目錄。
- `"provider-config"`：由來源編寫的 `models.providers.*.models` 清單，不受選擇器允許清單影響。資料列包含公開的模型功能與可感知路由的可用性，但會省略提供者端點、驗證資料和執行階段要求設定。
- `"all"`：完整的閘道目錄，會略過 `agents.defaults.modelPolicy.allow`。用於診斷／探索使用者介面，而非一般模型選擇器。

## 執行核准

- 當執行要求需要核准時，閘道會廣播 `exec.approval.requested`。
- 操作員用戶端會透過呼叫 `exec.approval.resolve` 來處理（需要 `operator.approvals`）。
- 針對 `host=node`，`exec.approval.request` 必須包含 `systemRunPlan`（標準的 `argv`/`cwd`/`rawCommand`/工作階段中繼資料）。缺少 `systemRunPlan` 的要求會遭拒。
- 核准後，轉送的 `node.invoke system.run` 呼叫會重複使用該標準 `systemRunPlan`，作為具權威性的命令／cwd／工作階段內容。
- 若呼叫端在準備與最終核准的 `system.run` 轉送之間變更 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，閘道會拒絕執行，而不會信任遭變更的承載資料。

## 代理程式傳遞備援

- `agent` 要求可包含 `deliver=true`，以要求對外傳遞。
- `bestEffortDeliver=false`（預設值）會維持嚴格行為：無法解析或僅供內部使用的傳遞目標會傳回 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允許在無法解析出可對外傳遞的路由時，退回僅限工作階段的執行（例如內部／網頁聊天工作階段或不明確的多頻道設定）。
- 若已要求傳遞，最終 `agent` 結果可能包含 `result.deliveryStatus`，並使用 [`openclaw agent --json --deliver`](/zh-TW/cli/agent#json-delivery-status) 中記載的相同 `sent`、`suppressed`、`partial_failed` 與 `failed` 狀態。

## 版本控制

- `PROTOCOL_VERSION`、`MIN_CLIENT_PROTOCOL_VERSION`、`MIN_NODE_PROTOCOL_VERSION` 與 `MIN_PROBE_PROTOCOL_VERSION` 位於 `packages/gateway-protocol/src/version.ts`。
- 用戶端會傳送 `minProtocol` + `maxProtocol`。操作員與使用者介面用戶端必須在該範圍內包含目前的通訊協定；目前的用戶端與伺服器執行通訊協定 v4。
- 同時具備 `role: "node"` 與 `client.mode: "node"` 的已驗證用戶端，可以使用 N-1 節點通訊協定（目前為 v3）。輕量重新啟動探測也使用相同的 N-1 範圍。此相容性範圍不會變更裝置驗證、配對、範圍、命令政策與執行核准。外掛擁有的節點功能與命令會暫不提供，直到節點升級至目前的通訊協定，因為其託管介面不屬於 N-1 合約的一部分。
- 結構描述與模型會從 TypeBox 定義產生：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 用戶端常數

參考用戶端實作位於 `packages/gateway-client/src/`（OpenClaw 透過精簡的 `src/gateway/client.ts` 外觀介面包裝它）。這些預設值在通訊協定 v4 中保持穩定，並且是第三方用戶端的預期基準。

| 常數                                      | 預設值                                                | 來源                                                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| 請求逾時（每次 RPC）                      | `30_000` ms                                           | `packages/gateway-client/src/client.ts`（`requestTimeoutMs`）                                                              |
| 預先驗證／連線挑戰逾時                    | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts`（`OPENCLAW_HANDSHAKE_TIMEOUT_MS` 環境變數可提高配對的伺服器／用戶端時限） |
| 初始重新連線退避                          | `1_000` ms                                            | `packages/gateway-client/src/client.ts`（`GATEWAY_RECONNECT_POLICY`）                                                      |
| 最大重新連線退避                          | `30_000` ms                                           | `packages/gateway-client/src/client.ts`（`GATEWAY_RECONNECT_POLICY`）                                                      |
| 裝置權杖關閉後的快速重試限制              | `250` ms                                              | `packages/gateway-client/src/client.ts`                                                                                   |
| `terminate()` 前的強制停止寬限期     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| `stopAndWait()` 預設逾時               | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| 預設計時週期（`hello-ok` 前）     | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| 計時逾時關閉                              | 靜默超過 `tickIntervalMs * 2` 時使用代碼 `4000` | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024`（25 MB）                            | `src/gateway/server-constants.ts`                                                                                         |

伺服器會在 `hello-ok` 中公告實際的 `policy.tickIntervalMs`、
`policy.maxPayload` 和 `policy.maxBufferedBytes`；用戶端應遵循這些值，而非交握前的預設值。

當每個待處理請求都有期限時，參考用戶端會讓有限期請求使用各自設定的期限。沒有有限
`timeoutMs` 的 `expectFinal` 請求、任何具有 `timeoutMs: null` 的請求，或有限期與
無限期請求的混合，都會讓計時監控程式保持啟用。若傳入事件和
回應的靜默時間超過計時逾時門檻，用戶端會以代碼 `4000` 關閉
通訊端、拒絕所有待處理請求，並重新連線。重新連線後不會
重送遭拒絕的請求。

## 驗證

- 共用密鑰閘道驗證會使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，取決於已設定的
  `gateway.auth.mode`（`"none" | "token" | "password" | "trusted-proxy"`）。
- 具身分資訊的模式（例如 Tailscale Serve（`gateway.auth.allowTailscale: true`）
  或非迴路介面的 `gateway.auth.mode: "trusted-proxy"`）會透過請求標頭滿足連線
  驗證檢查，而非使用 `connect.params.auth.*`。
- 私有入口的 `gateway.auth.mode: "none"` 會完全略過共用密鑰連線驗證；
  請勿將此模式暴露於公開／不受信任的入口。
- 配對後，閘道會簽發限定於連線角色與範圍的裝置權杖，
  並在 `hello-ok.auth.deviceToken` 中傳回。用戶端應在任何成功連線後
  將其持久保存。
- 使用該已儲存裝置權杖重新連線時，也應重複使用為該權杖儲存的
  已核准範圍集合。這可保留已授予的讀取／探查／狀態存取權，
  並避免重新連線時悄然縮減為更窄、隱含的僅限管理員範圍。
- 用戶端連線驗證組合（`packages/gateway-client/src/client.ts` 中的
  `selectConnectAuth`）：
  - `auth.password` 是獨立的，設定後一律轉送。
  - `auth.token` 依優先順序填入：先使用明確的共用權杖，
    再使用明確的 `deviceToken`，最後使用已儲存的每裝置權杖（以
    `deviceId` + `role` 為鍵）。
  - 只有在上述方式皆未解析出
    `auth.token` 時，才會傳送 `auth.bootstrapToken`。共用權杖或任何已解析的裝置權杖都會抑制它。
  - 在一次性的 `AUTH_TOKEN_MISMATCH` 重試時，自動提升已儲存裝置權杖
    僅限受信任端點：迴路介面，
    或具有固定 `tlsFingerprint` 的 `wss://`。未固定的公開 `wss://`
    不符合資格。
- 內建設定代碼啟動程序會傳回主要節點
  `hello-ok.auth.deviceToken`，以及 `hello-ok.auth.deviceTokens` 中
  用於受信任行動裝置移交的受限操作員權杖。操作員權杖
  包含供原生 Talk 設定讀取使用的 `operator.talk.secrets`，但
  不包含配對變更範圍和 `operator.admin`。
- 當非基準設定代碼啟動程序等待核准時，
  `PAIRING_REQUIRED` 詳細資料會包含 `recommendedNextStep: "wait_then_retry"`、
  `retryable: true` 和 `pauseReconnect: false`。請持續使用
  相同的啟動權杖重新連線，直到請求獲准或權杖失效。
- 僅當連線在受信任傳輸（例如 `wss://` 或迴路介面／本機配對）
  上使用啟動驗證時，才持久保存 `hello-ok.auth.deviceTokens`。
- 若用戶端提供明確的 `deviceToken` 或明確的 `scopes`，該
  呼叫端要求的範圍集合仍具有最高權威；僅當用戶端重複使用已儲存的每裝置權杖時，
  才會重複使用快取的範圍。
- 裝置權杖可透過 `device.token.rotate` 和
  `device.token.revoke` 輪替／撤銷（需要 `operator.pairing`）。輪替或撤銷
  節點或其他非操作員角色時，也需要 `operator.admin`。
- `device.token.rotate` 會傳回輪替中繼資料。只有同一裝置已使用該
  裝置權杖驗證的呼叫，才會回傳替代的
  持有者權杖，使僅使用權杖的用戶端可在重新連線前持久保存替代權杖。
  共用／管理員輪替不會回傳持有者權杖。
- 權杖簽發、輪替和撤銷都限於該裝置配對項目中記錄的已核准角色
  集合；權杖變更無法擴大或指定配對核准從未授予的
  裝置角色。
- 對於已配對裝置的權杖工作階段，裝置管理僅限自身範圍，除非
  呼叫端也具有 `operator.admin`：非管理員呼叫端只能管理自己
  裝置項目的操作員權杖。即使是呼叫端自己的裝置，節點和其他非操作員權杖
  管理仍僅限管理員。
- `device.token.rotate` 和 `device.token.revoke` 也會依呼叫端目前的工作階段範圍，
  檢查目標操作員權杖的範圍集合。
  非管理員呼叫端無法輪替或撤銷範圍比自身現有範圍更廣的操作員權杖。
- 驗證失敗會包含 `error.details.code` 及復原提示：
  - `error.details.canRetryWithDeviceToken`（布林值）
  - `error.details.recommendedNextStep`：以下其中之一：`retry_with_device_token`、
    `update_auth_configuration`、`update_auth_credentials`、
    `wait_then_retry`、`review_auth_configuration`
    （`packages/gateway-protocol/src/connect-error-details.ts`）。
- 用戶端針對 `AUTH_TOKEN_MISMATCH` 的行為：
  - 受信任的用戶端可嘗試使用快取的每裝置
    權杖進行一次受限重試。
  - 若該次重試失敗，請停止自動重新連線迴圈，並顯示需要操作員
    採取動作的指引。
- `AUTH_SCOPE_MISMATCH` 表示裝置權杖已被辨識，但未涵蓋
  要求的角色／範圍。請勿將此呈現為無效權杖；應提示
  操作員重新配對，或核准較窄／較廣的範圍契約。

## 裝置身分與配對

- 節點應包含衍生自金鑰組指紋的穩定裝置身分（`device.id`）。
- 閘道會依裝置與角色簽發權杖。
- 除非已啟用本機自動核准，否則新的裝置 ID 必須取得配對核准。
- 配對自動核准以直接的本機迴路介面連線為核心。
- OpenClaw 也針對受信任的共用密鑰輔助程式流程，提供一條範圍狹窄的
  後端／容器本機自我連線路徑。
- 同一主機的 tailnet 或 LAN 連線在配對時仍視為遠端，
  並需要核准。
- WS 用戶端通常會在 `connect` 期間包含 `device` 身分（操作員 +
  節點）。唯有明確的信任路徑可作為無裝置身分操作員的例外：
  - `gateway.controlUi.allowInsecureAuth=true`，用於僅限 localhost 的不安全
    HTTP 相容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` 操作員控制介面驗證。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急手段，會嚴重
    降低安全性）。
  - 保留的內部輔助程式路徑上，直接迴路介面的 `gateway-client` 後端 RPC。
- 省略裝置身分會影響範圍。透過明確信任路徑允許無裝置身分的
  操作員連線時，OpenClaw 仍會將自行宣告的範圍清除為空集合，
  除非該路徑具有具名的範圍保留例外。受範圍限制的方法之後會以
  `missing scope` 失敗。
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` 是控制介面的
  緊急範圍保留路徑。它不會向任意自訂
  後端或命令列介面形式的 WebSocket 用戶端授予範圍。
- 保留的直接迴路介面 `gateway-client` 後端輔助程式路徑僅為
  內部本機控制平面 RPC 保留範圍；自訂後端 ID
  不會獲得此例外。
- 所有連線都必須簽署伺服器提供的 `connect.challenge` nonce。

### 裝置驗證遷移診斷

對於仍使用挑戰前簽署行為的舊版用戶端，`connect`
會在 `error.details.code` 下傳回 `DEVICE_AUTH_*` 詳細代碼，並提供穩定的
`error.details.reason`。

常見遷移失敗：

| 訊息                     | details.code                     | details.reason           | 含義                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 用戶端省略了 `device.nonce`（或傳送空白值）。     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 用戶端使用過期／錯誤的 nonce 簽署。            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 簽章酬載與 v2 酬載不符。       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 簽署的時間戳記超出允許的偏差範圍。          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 與公開金鑰指紋不符。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開金鑰格式／正規化失敗。         |

遷移目標：

- 一律等待 `connect.challenge`。
- 簽署包含伺服器 nonce 的 v2 酬載。
- 在 `connect.params.device.nonce` 中傳送相同的 nonce。
- 建議使用的簽章酬載為 `v3`
  （`packages/gateway-client/src/device-auth.ts` 中的 `buildDeviceAuthPayloadV3`），
  除了 device/client/role/scopes/token/nonce 欄位外，
  還會繫結 `platform` 與 `deviceFamily`。
- 為維持相容性，仍接受舊版 `v2` 簽章，但重新連線時，
  已配對裝置的中繼資料釘選仍會控制命令政策。

## TLS 與釘選

- WS 連線支援 TLS（`gateway.tls` 設定）。
- 用戶端可選擇透過
  `gateway.remote.tlsFingerprint` 或命令列介面 `--tls-fingerprint` 釘選閘道憑證指紋。

## 範圍

此協定公開完整的閘道 API：狀態、頻道、模型、聊天、
代理程式、工作階段、節點、核准等。確切介面由
從 `packages/gateway-protocol/src/schema.ts` 重新匯出的 TypeBox 結構描述定義。

## 相關內容

- [建置閘道用戶端](https://docs.openclaw.ai/gateway/clients)
- [嵌入 OpenClaw](https://docs.openclaw.ai/gateway/embedding)
- [橋接協定](/zh-TW/gateway/bridge-protocol)
- [閘道操作手冊](/zh-TW/gateway)
