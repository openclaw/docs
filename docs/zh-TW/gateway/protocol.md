---
read_when:
    - 實作或更新閘道 WebSocket 用戶端
    - 偵錯通訊協定不相符或連線失敗
    - 重新產生通訊協定結構描述／模型
summary: 閘道 WebSocket 通訊協定：交握、框架、版本控制
title: 閘道通訊協定
x-i18n:
    generated_at: "2026-07-12T14:30:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d71b75d49bf8a1ea2d835b1d8e532b1d01e87e8b64d6ab7dcb00f28791d3b8ac
    source_path: gateway/protocol.md
    workflow: 16
---

閘道 WS 協定是 OpenClaw 的單一控制平面與節點傳輸機制。操作端與節點用戶端（命令列介面、網頁 UI、macOS App、iOS/Android 節點、無頭節點）透過 WebSocket 連線，並在交握時宣告 **角色**與**範圍**。

## 傳輸與訊框

- WebSocket、文字訊框、JSON 承載資料。
- 第一個訊框**必須**是 `connect` 請求。
- 連線前訊框上限為 64 KiB（`MAX_PREAUTH_PAYLOAD_BYTES`）。交握後，請遵循 `hello-ok.policy.maxPayload` 與 `hello-ok.policy.maxBufferedBytes`。啟用診斷後，對於過大的傳入訊框與緩慢的傳出緩衝區，閘道會在關閉連線或捨棄訊框前發出 `payload.large` 事件。這些事件會包含 `surface`、位元組大小、限制與安全的原因代碼，絕不包含訊息本文、附件內容、原始訊框位元組、權杖、Cookie 或密鑰。

訊框格式：

- 請求：`{type:"req", id, method, params}`
- 回應：`{type:"res", id, ok, payload|error}`
- 事件：`{type:"event", event, payload, seq?, stateVersion?}`

具有副作用的方法需要等冪鍵（請參閱結構描述）。

## 交握

閘道會傳送連線前挑戰：

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

閘道以 `hello-ok` 回應：

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

`HelloOkSchema`（`packages/gateway-protocol/src/schema/frames.ts`）要求必須提供 `server`、`features`、`snapshot`、`policy` 與 `auth`。即使未核發裝置權杖，`auth` 仍會回報協商後的角色／範圍（格式如上）。`pluginSurfaceUrls` 為選填欄位，會將外掛介面名稱（例如 `canvas`）對應至限定範圍的託管 URL；該 URL 可能會過期，因此節點會使用 `{ "surface": "canvas" }` 呼叫 `node.pluginSurface.refresh` 以取得新的項目。已淘汰的 `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh` 路徑不受支援；請使用外掛介面。

當閘道仍在完成啟動附屬服務時，`connect` 可能會傳回可重試的 `UNAVAILABLE` 錯誤，其中包含 `details.reason: "startup-sidecars"` 與 `retryAfterMs`。請在你的連線時間預算內重試，而不要將其視為終止性的交握失敗。

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

內建的 QR／設定代碼啟動流程是行動裝置交接路徑。基準設定代碼連線成功後，會傳回一個主要節點權杖，以及一個受限的操作端權杖：

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

此操作端交接是刻意限制的：足以啟動行動裝置操作端迴圈與原生設定，包括用於讀取 Talk 設定的 `operator.talk.secrets`，但不包含配對異動範圍，也不包含 `operator.admin`。更廣泛的配對／管理員存取權需要另一個經核准的配對或權杖流程。僅當啟動驗證透過受信任的傳輸（`wss://` 或回送／本機配對）執行時，才可保存 `hello-ok.auth.deviceTokens`。

受信任的同程序後端用戶端（`client.id: "gateway-client"`、`client.mode: "backend"`）在直接回送連線上使用共用閘道權杖／密碼進行驗證時，可以省略 `device`。此路徑保留給內部控制平面 RPC（例如子代理程式工作階段更新），可避免過時的命令列介面／裝置配對基準阻擋本機後端工作。遠端、源自瀏覽器、節點，以及明確使用裝置權杖／裝置身分的用戶端，仍會經過一般的配對與範圍升級檢查。

### 工作節點角色與封閉式協定

雲端工作節點透過閘道擁有、以主機金鑰釘選的 SSH 通道，使用專用的回送進入點。它僅接受工作節點身分，絕不分派一般驗證、節點事件、操作端 RPC 或外掛方法。嚴格的 `connect` 會驗證一項以雜湊形式靜態儲存的短效認證資訊；該認證資訊會繫結至環境、套件組合雜湊、擁有者 Epoch、RPC 集合版本、到期時間，以及一個可為 null 的工作階段；它也會另行檢查目前版本與功能集。成功時會傳回最精簡的 `worker-hello-ok`；功能協商獨立於一般協定版本。訊框維持在 64 KiB 以下。封閉式允許清單包含 `worker.heartbeat`、`worker.transcript.commit` 與 `worker.live-event`。逐字稿提交使用擁有者 Epoch 防護、由閘道擁有的工作階段繫結、基礎葉節點比較後交換，以及持久性序列重播；閘道透過一般工作階段寫入器產生逐字稿項目與父項目 ID。每次 RPC 都會重新檢查擁有權與到期時間。

### 用戶端能力

操作端用戶端可在 `connect.params.caps` 中宣告選用能力：

- `tool-events`：接受結構化工具生命週期事件。
- `inline-widgets`：可轉譯託管的行內小工具結果。

用戶端能力描述的是已連線的用戶端，而非授權。代理程式工具可宣告必要能力；除非來源用戶端的 `caps` 包含所有要求，否則閘道會省略這些工具。源自頻道的執行沒有閘道用戶端能力，因此即使工具原則明確允許，受能力限制的工具仍無法使用。

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

節點會在連線時宣告能力聲明：

- `caps`：高階類別，例如 `camera`、`canvas`、`screen`、`location`、`voice`、`talk`。
- `commands`：可供叫用的命令允許清單。
- `permissions`：細部切換設定（例如 `screen.record`、`camera.capture`）。

閘道會將這些視為聲明，並強制執行伺服器端允許清單。

## 角色與範圍

如需完整的操作端範圍模型、核准時檢查與共用密鑰語意，請參閱[操作端範圍](/zh-TW/gateway/operator-scopes)。

角色：

- `operator`：控制平面用戶端（命令列介面／UI／自動化）。
- `node`：能力主機（攝影機／螢幕／畫布／system.run）。
- `worker`：在專用封閉式工作節點協定上的雲端執行主機。

操作端範圍（`src/gateway/operator-scopes.ts`）的完整封閉集合：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

將 `talk.config` 的 `includeSecrets: true` 設定為 true 時，需要 `operator.talk.secrets`（或 `operator.admin`）。包含密鑰時，請從 `talk.resolved.config.apiKey` 讀取目前使用中的 Talk 提供者認證資訊；`talk.providers.<id>.apiKey` 會維持來源格式，且可能是 SecretRef 物件或經遮蔽的字串。

由外掛註冊的閘道 RPC 方法可以要求自己的操作端範圍，但下列保留的核心前綴一律解析為 `operator.admin`（`src/shared/gateway-method-policy.ts`）：`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`。

方法範圍只是第一道關卡。部分透過 `chat.send` 執行的斜線命令會套用更嚴格的命令層級檢查：即使閘道用戶端已具備較低層級的操作端範圍，持久性 `/config set` 與 `/config unset` 寫入仍需要 `operator.admin`。

除了基本方法範圍（`operator.pairing`）外，`node.pair.approve` 還會根據待處理請求宣告的 `commands`，執行額外的核准時範圍檢查（`src/infra/node-pairing-authz.ts`）：

| 宣告的命令                                                   | 必要範圍                              |
| -------------------------------------------------------------- | ------------------------------------- |
| 無                                                             | `operator.pairing`                    |
| 非執行命令                                                     | `operator.pairing` + `operator.write` |
| 包含 `system.run`、`system.run.prepare` 或 `system.which`       | `operator.pairing` + `operator.admin` |

### Caps／commands／permissions（節點）

節點會在連線時宣告能力聲明：

- `caps`：高階能力類別，例如 `camera`、`canvas`、`screen`、`location`、`voice` 與 `talk`。
- `commands`：可供叫用的命令允許清單。
- `permissions`：細部切換設定（例如 `screen.record`、`camera.capture`）。

閘道會將這些視為**聲明**，並強制執行伺服器端允許清單。成功連線或重新連線後，已連線的節點可以使用 `node.pluginTools.update` 發布選用、代理程式可見的外掛或 MCP 工具描述元。無頭節點主機需要重新啟動，才能套用宣告式 MCP 清單變更。此更新方法是唯一的發布路徑；`connect` 參數不接受外掛工具描述元。每個描述元都必須使用提供者安全的工具 `name`，並指定節點目前命令允許清單中的 `command`。閘道會信任已配對節點提供的描述元中繼資料、篩除已核准命令介面以外的描述元、在節點中斷連線時移除描述元，並拒絕操作端嘗試變更其他節點的目錄。將 `gateway.nodes.pluginTools.enabled: false` 設定為 false，可忽略節點發布的描述元。

已連線的節點主機會使用 `node.skills.update` 發布其完整的 Skills 取代目錄。此節點角色方法是唯一的節點 Skills 發布路徑；`connect` 參數不接受 Skills。每個描述元均包含安全名稱、描述與有大小限制的 `SKILL.md` 內容。閘道會使用一般 Skills 載入器剖析該內容，在節點連線期間將其納入代理程式 Skills 快照，並在中斷連線時移除。將 `gateway.nodes.skills.enabled: false` 設定為 false，可忽略節點發布的 Skills。

## 在線狀態

- `system-presence` 會傳回以裝置身分為索引鍵的項目，其中包含 `deviceId`、`roles` 與 `scopes`，因此即使同一裝置同時以操作端與節點身分連線，UI 仍可為每個裝置顯示一列。
- `node.list` 包含選用的 `lastSeenAtMs` 與 `lastSeenReason`。已連線節點會以原因 `connect` 回報目前連線時間；已配對節點也可以透過受信任的節點事件回報持久性背景在線狀態。

原生 macOS 節點也能傳送已驗證的 `node.presence.activity` 事件，
其中包含有界限的輸入閒置時間。閘道會依據自身時鐘推導活動時間戳記，
透過 `node.list` 和 `node.describe` 公開最近仍連線的 Mac，
並向具有讀取範圍的用戶端廣播 `node.presence` 更新。
如需瞭解選擇、隱私權、模型情境及通知路由行為，請參閱
[作用中電腦上線狀態](/nodes/presence)。

### 節點背景存活事件

節點會呼叫 `node.event` 並指定 `event: "node.presence.alive"`，以記錄
已配對節點曾在背景喚醒期間存活，但不會將其標示為已連線：

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是封閉列舉：`background`、`silent_push`、`bg_app_refresh`、
`significant_location`、`manual`、`connect`。未知值會正規化為
`background`（`src/shared/node-presence.ts`）。只有已驗證的節點裝置工作階段
才會持久保存此事件；沒有裝置或未配對的工作階段會傳回
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

較舊的閘道可能只會針對 `node.event` 傳回 `{ "ok": true }`；應將其視為
已確認的 RPC，而非持久化上線狀態已保存。

## 廣播事件範圍

伺服器推送的廣播事件會受到範圍管控，因此僅限配對範圍或僅限節點的
工作階段不會被動接收工作階段內容
（`src/gateway/server-broadcast.ts`）：

- 聊天、代理程式與工具結果框架（串流的 `agent` 事件、工具結果
  事件）至少需要 `operator.read`。沒有此範圍的工作階段會完全略過這些
  框架。
- 外掛定義的 `plugin.*` 廣播預設限制為 `operator.write` 或
  `operator.admin`；`plugin.approval.requested` /
  `plugin.approval.resolved` 等明確項目則改用
  `operator.approvals`。
- 狀態／傳輸事件（`heartbeat`、`presence`、`tick`、連線／中斷連線
  生命週期）維持不受限制，讓每個已驗證的工作階段都能觀察傳輸健康狀態。
- 未知的廣播事件系列預設受範圍管控（失敗時關閉），除非已註冊的處理常式
  明確放寬限制。

每個用戶端連線都會維護各自的每用戶端序號，因此即使不同用戶端看到
經不同範圍篩選的事件串流子集，廣播在該通訊端上仍會保持單調遞增排序。

## RPC 方法系列

`hello-ok.features.methods` 是根據
`src/gateway/server-methods-list.ts` 加上已載入的外掛／頻道方法
匯出所建立的保守探索清單；它不是每個方法的自動產生傾印，而且某些方法
（例如 `push.test`、`web.login.start`、`web.login.wait`、`sessions.usage`）
即使是真實且可呼叫的方法，也會刻意從探索中排除。請將其視為功能探索，
而不是 `src/gateway/server-methods/*.ts` 的完整列舉。

<AccordionGroup>
  <Accordion title="系統與身分">
    - `health` 會傳回快取或新近探測的閘道健康狀態快照。
    - `diagnostics.stability` 會傳回近期且有界限的診斷穩定性記錄器資料：事件名稱、計數、位元組大小、記憶體讀數、佇列／工作階段狀態、頻道／外掛名稱、工作階段 ID。不包含聊天文字、網路鉤子本文、工具輸出、原始要求／回應本文、權杖、Cookie 或密鑰。需要 `operator.read`。
    - `status` 會傳回 `/status` 樣式的閘道摘要；敏感欄位僅供具有管理員範圍的操作員用戶端使用。
    - `gateway.identity.get` 會傳回轉送與配對流程所使用的閘道裝置身分。
    - `system-presence` 會傳回已連線操作員／節點裝置目前的上線狀態快照。
    - `system-event` 會附加系統事件，並可更新／廣播上線狀態情境。
    - `last-heartbeat` 會傳回最新持久保存的心跳偵測事件。
    - `set-heartbeats` 會切換閘道上的心跳偵測處理。
    - `gateway.suspend.prepare` 僅會在受追蹤的閘道工作閒置時，建立短期的協同暫停租約。`gateway.suspend.status` 會檢查該租約，而 `gateway.suspend.resume` 會在解除凍結或主機作業中止後釋放租約。

  </Accordion>

  <Accordion title="模型與用量">
    - `models.list` 會傳回執行階段允許的模型目錄。請參閱下方的「`models.list` 檢視」。
    - `usage.status` 會傳回供應商用量期間／剩餘配額摘要。
    - `usage.cost` 會傳回某日期範圍的彙總成本用量摘要。傳入 `agentId` 可指定單一代理程式，或傳入 `agentScope: "all"` 以彙總已設定的代理程式。
    - `doctor.memory.status` 會傳回作用中預設代理程式工作區的向量記憶／快取嵌入就緒狀態。只有在明確要即時偵測嵌入供應商時，才傳入 `{ "probe": true }` 或 `{ "deep": true }`。傳入 `{ "agentId": "agent-id" }` 可將夢境整理儲存區統計資料限定於單一代理程式工作區；省略時則會彙總已設定的夢境整理工作區。
    - `doctor.memory.dreamDiary`、`doctor.memory.backfillDreamDiary`、`doctor.memory.resetDreamDiary`、`doctor.memory.resetGroundedShortTerm`、`doctor.memory.repairDreamingArtifacts` 和 `doctor.memory.dedupeDreamDiary` 接受選用的 `{ "agentId": "agent-id" }`；省略時，它們會對已設定的預設代理程式工作區執行作業。
    - `doctor.memory.remHarness` 會為遠端控制平面用戶端傳回有界限、唯讀的 REM 測試框架預覽，包括工作區路徑、記憶片段、已轉譯的基礎 Markdown，以及深度提升候選項目。需要 `operator.read`。
    - `sessions.usage` 會傳回每個工作階段的用量摘要。傳入 `agentId` 可指定單一代理程式，或傳入 `agentScope: "all"` 以一併列出已設定的代理程式。
      這兩種用量方法都接受搭配 IANA `timeZone` 的 `mode: "specific"`，以提供感知日光節約時間的日曆日邊界與分桶。較舊的用戶端仍支援 `utcOffset`，且當閘道執行階段無法辨識所要求的時區時，也會將其作為備援。
    - `sessions.usage.timeseries` 會傳回單一工作階段的時間序列用量。
    - `sessions.usage.logs` 會傳回單一工作階段的用量記錄項目。

  </Accordion>

  <Accordion title="頻道與登入輔助工具">
    - `channels.status` 會傳回內建及隨附頻道／外掛的狀態摘要。
    - `channels.logout` 會在頻道支援的情況下，登出特定頻道／帳戶。
    - `web.login.start` 會針對目前支援 QR 的網頁頻道供應商啟動 QR／網頁登入流程。
    - `web.login.wait` 會等待該流程完成，並在成功時啟動頻道。
    - `push.test` 會向已註冊的 iOS 節點傳送測試 APNs 推播。
    - `voicewake.get` 會傳回已儲存的喚醒詞觸發條件。
    - `voicewake.set` 會更新喚醒詞觸發條件並廣播變更。

  </Accordion>

  <Accordion title="外掛管理">
    - `plugins.list`（`operator.read`）會傳回已安裝的外掛清單，加上本機精選的官方項目、診斷資訊，以及目前的安裝模式是否允許變更。
    - `plugins.search`（`operator.read`）會搜尋可安裝的 ClawHub 程式碼外掛與套件外掛系列。請傳入非空白的 `query`，以及介於 1 到 100 的選用 `limit`。
    - `plugins.install`（`operator.admin`）會安裝官方目錄項目 `{ source: "official", pluginId }`，或 ClawHub 套件 `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }`。ClawHub 安裝會維持閘道的信任、完整性與安裝原則檢查。成功安裝後必須重新啟動閘道。
    - `plugins.setEnabled`（`operator.admin`）會使用 `{ pluginId, enabled }` 變更單一已安裝外掛的啟用原則。回應包含更新後的目錄項目、重新啟動中繼資料，以及任何插槽選擇警告。
    - `plugins.uninstall`（`operator.admin`）會使用 `{ pluginId }` 移除單一外部安裝的外掛：設定參照、安裝記錄與受管理的檔案。隨附外掛無法解除安裝，只能停用。回應會列出移除動作，且一律需要重新啟動閘道。

  </Accordion>

  <Accordion title="訊息與記錄">
    - `send` 是直接對外傳送 RPC，用於在聊天執行器之外，依頻道／帳戶／討論串目標傳送內容。
    - `logs.tail` 會傳回已設定閘道檔案記錄的尾端內容，並提供游標／限制與最大位元組控制。

  </Accordion>

  <Accordion title="操作員終端">
    - `terminal.open` 會為明確的 `agentId` 或預設代理程式啟動主機 PTY，並傳回解析後的代理程式、工作目錄、Shell 與限制狀態。
    - `terminal.input`、`terminal.resize` 和 `terminal.close` 僅能操作呼叫連線所擁有的工作階段。
    - `terminal.data` 和 `terminal.exit` 事件只會串流至擁有該工作階段的連線。
    - 連線中斷的工作階段會分離，而非終止：在近期輸出累積於有界限的伺服器端緩衝區期間，它們會於 `gateway.terminal.detachedSessionTimeoutSeconds`（預設為 300；`0` 會恢復中斷連線即終止）內保持可重新連接。
    - `terminal.list` 會傳回可連接的工作階段；`terminal.attach` 會將仍在執行或已分離的工作階段重新綁定至呼叫連線，並傳回重播緩衝區（tmux 樣式接管——先前的即時擁有者會收到原因為 `detached` 的 `terminal.exit`）；`terminal.text` 則會在不連接的情況下，以純文字讀取緩衝區。
    - 每個終端方法都需要 `operator.admin`；`gateway.terminal.enabled` 必須明確設為 true。系統會拒絕完全沙箱化的代理程式，而代理程式原則變更會關閉現有及處理中的 PTY，包括已分離的 PTY。

  </Accordion>

  <Accordion title="Talk 與 TTS">
    - `talk.catalog` 會傳回唯讀的 Talk 提供者目錄，涵蓋語音、串流轉錄與即時語音：標準提供者 ID、登錄別名、標籤、已設定狀態、選用的群組層級 `ready` 結果、公開的模型／語音 ID、標準模式、傳輸方式、大腦策略，以及即時音訊／功能旗標，且不會傳回提供者密鑰或變更全域設定。目前的閘道會在套用執行階段提供者選擇後設定 `ready`；在較舊的閘道中，若缺少此欄位，應視為尚未驗證。
    - `talk.config` 會傳回實際生效的 Talk 設定承載資料；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.session.create` 會建立由閘道擁有的 Talk 工作階段，供 `realtime/gateway-relay`、`transcription/gateway-relay` 或 `stt-tts/managed-room` 使用。對於 `stt-tts/managed-room`，傳入 `sessionKey` 的 `operator.write` 呼叫端也必須傳入 `spawnedBy`，才能取得限定範圍的工作階段金鑰可見性；建立未限定範圍的 `sessionKey` 及使用 `brain: "direct-tools"` 需要 `operator.admin`。
    - `talk.session.join` 會驗證受管理房間的工作階段權杖、視需要發出 `session.ready` 或 `session.replaced`，並傳回房間／工作階段中繼資料及近期的 Talk 事件，但絕不傳回純文字權杖或其雜湊。
    - `talk.session.appendAudio` 會將 base64 PCM 輸入音訊附加至由閘道擁有的即時中繼與轉錄工作階段。
    - `talk.session.startTurn`、`talk.session.endTurn` 和 `talk.session.cancelTurn` 會驅動受管理房間的輪次生命週期，並在清除狀態前拒絕過期輪次。
    - `talk.session.cancelOutput` 會停止助理音訊輸出，主要用於閘道中繼工作階段中由 VAD 控制的插話。
    - `talk.session.submitToolResult` 會完成由閘道擁有的即時中繼工作階段所發出的提供者工具呼叫。請求會等待提供者橋接器公開的任何非同步完成訊號；提交失敗時，關聯的執行會保持作用中，且不會發出成功的工具結果事件。若是暫時性工具輸出，請傳入 `options: { willContinue: true }`；若提供者橋接器宣告支援抑制，且該結果不應啟動另一個回應，請傳入 `options: { suppressResponse: true }`。
    - `talk.session.steer` 會將作用中執行的語音控制傳送至由閘道擁有、以代理程式為後端的 Talk 工作階段：`{ sessionId, text, mode? }`，其中 `mode` 可為 `status`、`steer`、`cancel` 或 `followup`；若省略模式，則會依口述文字進行分類。
    - `talk.session.close` 會關閉由閘道擁有的中繼、轉錄或受管理房間工作階段，並發出終止 Talk 事件。
    - `talk.mode` 會設定／廣播 WebChat／Control UI 用戶端目前的 Talk 模式狀態。
    - `talk.client.create` 會使用 `webrtc` 或 `provider-websocket` 建立由用戶端擁有的即時提供者工作階段，而設定、認證資訊、指示和工具政策則由閘道擁有。
    - `talk.client.toolCall` 可讓由用戶端擁有的即時傳輸層，將提供者工具呼叫轉送至閘道政策。第一個支援的工具是 `openclaw_agent_consult`；用戶端會取得執行 ID，並等待一般聊天生命週期事件，再提交提供者特定的工具結果。
    - `talk.client.steer` 會為由用戶端擁有的即時傳輸層傳送作用中執行的語音控制。閘道會根據 `sessionKey` 解析作用中的內嵌執行，並傳回結構化的接受／拒絕結果，而不是無聲地捨棄引導要求。
    - `talk.event` 是即時、轉錄、STT/TTS、受管理房間、電話及會議轉接器的單一 Talk 事件通道。
    - `talk.speak` 會透過作用中的 Talk 語音提供者合成語音。
    - `tts.status` 會傳回 TTS 啟用狀態、作用中的提供者、備援提供者及提供者設定狀態。
    - `tts.providers` 會傳回可見的 TTS 提供者清單。
    - `tts.enable` 和 `tts.disable` 會切換 TTS 偏好設定狀態。
    - `tts.setProvider` 會更新偏好的 TTS 提供者。
    - `tts.convert` 會執行一次性的文字轉語音轉換。
    - `tts.speak`（`operator.write`）會使用已設定的一般 TTS 提供者鏈，為非空的 `text` 產生語音，並以 `audioBase64` 內嵌傳回一個完整片段，以及 `provider` 和選用的 `outputFormat`、`mimeType`、`fileExtension` 中繼資料。與 `tts.convert` 不同，它不會傳回閘道本機路徑；與 `talk.speak` 不同，它不需要 Talk 提供者。超過 `messages.tts.maxTextLength` 的文字會傳回 `INVALID_REQUEST`；合成失敗則傳回 `UNAVAILABLE`。

  </Accordion>

  <Accordion title="密鑰、設定、更新與精靈">
    - `secrets.reload` 會重新解析作用中的 SecretRef，且僅在完全成功時置換執行階段密鑰狀態。
    - `secrets.resolve` 會針對特定的命令／目標集合，解析命令目標的密鑰指派。
    - `config.get` 會傳回目前的設定快照及雜湊。
    - `config.set` 會寫入已驗證的設定承載資料。
    - `config.patch` 會合併部分設定更新。具破壞性的陣列取代，必須將受影響的路徑列於 `replacePaths`；陣列項目下的巢狀陣列使用 `[]` 路徑，例如 `agents.list[].skills`。
    - `config.apply` 會驗證並取代完整的設定承載資料。
    - `config.schema` 會傳回 Control UI 和命令列介面工具所使用的即時設定結構描述承載資料：結構描述、`uiHints`、版本、產生中繼資料，以及可載入時的外掛與頻道結構描述中繼資料。其中包含與 UI 相同標籤／說明文字中的 `title`／`description` 中繼資料；當有相符的欄位文件時，也涵蓋巢狀物件、萬用字元、陣列項目及 `anyOf`／`oneOf`／`allOf` 組合分支。
    - `config.schema.lookup` 會針對一個設定路徑傳回限定路徑範圍的查詢承載資料：正規化路徑、淺層結構描述節點、相符的提示與 `hintPath`、選用的 `reloadKind`，以及供 UI／命令列介面逐層檢視的直接子項摘要。`reloadKind` 可為 `restart`、`hot` 或 `none`（`src/config/schema.ts`），並反映所要求路徑的閘道設定重新載入規劃器。查詢結構描述節點會保留面向使用者的文件及常見驗證欄位（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、數值／字串／陣列／物件界限、`additionalProperties`、`deprecated`、`readOnly`、`writeOnly`）。子項摘要會公開 `key`、正規化的 `path`、`type`、`required`、`hasChildren`、選用的 `reloadKind`，以及相符的 `hint`／`hintPath`。
    - `update.run` 會執行閘道更新流程，且僅在更新成功時排程重新啟動；具有工作階段的呼叫端可包含 `continuationMessage`，讓啟動程序透過重新啟動接續佇列，接續一個後續代理程式輪次。來自控制平面的套件管理器更新和受監督的 Git 簽出更新，會使用分離式受管理服務移交，而不是在執行中的閘道內取代套件樹或變更簽出／建置輸出。已啟動的移交會傳回 `ok: true`，並包含 `result.reason: "managed-service-handoff-started"` 和 `handoff.status: "started"`；無法使用或失敗的移交會傳回 `ok: false`，並包含 `managed-service-handoff-unavailable` 或 `managed-service-handoff-failed`，若需要手動執行殼層更新，還會包含 `handoff.command`。無法使用表示 OpenClaw 缺少安全的監督程序邊界或持久服務識別，例如 systemd 的 `OPENCLAW_SYSTEMD_UNIT`。移交啟動期間，重新啟動哨兵可能會短暫回報 `stats.reason: "restart-health-pending"`；接續程序會延遲到命令列介面驗證重新啟動後的閘道，並寫入最終的 `ok` 哨兵為止。
    - `update.status` 會重新整理並傳回最新的更新重新啟動哨兵，包含可用時重新啟動後的執行中版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 會透過 WS RPC 公開新手設定精靈。

  </Accordion>

  <Accordion title="代理程式與工作區輔助功能">
    - `agents.list` 會傳回已設定的代理程式項目，包含實際生效的模型及執行階段中繼資料。
    - `agents.create`、`agents.update` 和 `agents.delete` 會管理代理程式記錄及工作區連接。
    - `agents.files.list`、`agents.files.get` 和 `agents.files.set` 會管理為代理程式公開的啟動工作區檔案。
    - `audit.activity.list` 會傳回具版本的純中繼資料活動帳本；`audit.list` 則仍是相容性安全的執行／工具 RPC。
    - `agents.workspace.list` 和 `agents.workspace.get`（`operator.read`）會向處於[操作員範圍](/zh-TW/gateway/operator-scopes)所述受信任操作員網域中的用戶端，公開代理程式工作區目錄的唯讀分頁瀏覽功能。請求僅接受工作區相對路徑；讀取作業會限制在解析真實路徑後的工作區根目錄內（拒絕符號連結及硬連結逸出），設有大小上限，並僅限 UTF-8 文字及常見圖片類型（base64）。回應不會公開主機工作區路徑。此命名空間沒有寫入操作。
    - `tasks.list`、`tasks.get` 和 `tasks.cancel` 會向 SDK 與操作員用戶端公開閘道工作帳本。請參閱下方的[工作帳本 RPC](#task-ledger-rpcs)。
    - `artifacts.list`、`artifacts.get` 和 `artifacts.download` 會針對明確的 `sessionKey`、`runId` 或 `taskId` 範圍，公開由逐字稿衍生的成品摘要與下載。執行與工作查詢會在伺服器端解析其所屬工作階段，且僅傳回來源相符的逐字稿媒體；不安全或本機 URL 來源會傳回不支援下載，而不會由伺服器端擷取。
    - `environments.list` 和 `environments.status` 會保留閘道本機及節點環境探索功能。已設定的雲端工作者，以及先前設定檔留下的持久記錄，會新增 `worker` 中繼資料，其中包含 `providerId`、選用的 `leaseId`、`state`、`ageMs`、選用的 `idleMs` 及 `attachedSessionIds`。工作者生命週期狀態為 `requested`、`provisioning`、`bootstrapping`、`ready`、`attached`、`idle`、`draining`、`destroying`、`destroyed`、`failed` 和 `orphaned`。
    - `environments.create`（`{ profileId, idempotencyKey }`）會從已設定的外掛提供者設定檔佈建工作者；使用相同金鑰重試時，會重複使用持久操作。`environments.destroy`（`{ environmentId }`）會要求以冪等方式拆除持久工作者環境。兩者皆需要 `operator.admin`、屬於控制平面寫入操作，並傳回與狀態回應相同格式的環境摘要。
    - `agent.identity.get` 會傳回代理程式或工作階段實際生效的助理身分。
    - `agent.wait` 會等待執行完成，並在可用時傳回終止快照。

  </Accordion>

  <Accordion title="工作階段控制">
    - `sessions.list` 傳回目前的工作階段索引；若已設定代理程式執行階段後端，也會包含每列的 `agentRuntime` 中繼資料。
    - `sessions.subscribe` 和 `sessions.unsubscribe` 切換目前 WS 用戶端的工作階段變更事件訂閱。
    - `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 切換單一工作階段的逐字稿／訊息事件訂閱。傳入 `includeApprovals: true`，即可一併接收經過清理的 `session.approval` 核准生命週期事件，但僅限其持久化受眾包含該確切工作階段，且審核者繫結授權訂閱用戶端的核准。此時，訂閱回應會包含有界的待處理 `approvalReplay`；當 `truncated` 為 false 時，該資料具有權威性。此選擇加入設定以每次訂閱呼叫為單位，不會持續保留：若重新訂閱相同工作階段時未傳入 `includeApprovals: true`，便會移除既有的核准訂閱。除了正常的工作階段讀取權限外，此選擇加入還需要 `operator.admin`，或已配對裝置上的 `operator.approvals`。
    - `sessions.preview` 傳回特定工作階段鍵的有界逐字稿預覽。
    - `sessions.describe` 傳回與確切工作階段鍵相符的一列閘道工作階段資料。
    - `sessions.resolve` 解析工作階段目標或將其正規化。
    - `sessions.create` 建立新的工作階段項目。`worktree: true` 會佈建受管理的工作樹；選用的 `worktreeBaseRef`／`worktreeName` 可選取基底參照與分支名稱，而 `execNode`（`operator.admin`）會將工作階段執行繫結至節點主機。建立的工作樹會回顯於結果中，並持久化至工作階段資料列（`worktree: { id, branch, repoRoot }`）。若項目已建立，但其內嵌的初始 `chat.send` 遭拒絕，成功結果會包含 `runStarted: false` 和 `runError`；用戶端可以保留提示詞，並針對傳回的工作階段鍵重試。
    - `sessions.groups.list`、`sessions.groups.put`、`sessions.groups.rename` 和 `sessions.groups.delete` 管理由閘道擁有的自訂工作階段群組目錄（名稱與顯示順序）。成員資格仍儲存在每個工作階段的 `category` 欄位；重新命名與刪除會在伺服器端更新成員工作階段。
    - `sessions.send` 將訊息傳送至既有工作階段。
    - `sessions.steer` 是用於進行中工作階段的中斷並引導變體。
    - `sessions.abort` 中止工作階段的進行中工作。傳入 `key` 及選用的 `runId`；若閘道可將進行中的執行解析至工作階段，也可只傳入 `runId`。
    - `sessions.patch` 更新工作階段中繼資料／覆寫值，並回報解析後的正規模型與實際生效的 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 和 `sessions.compact` 執行工作階段維護。
    - `sessions.get` 傳回完整儲存的工作階段資料列。
    - 聊天執行仍使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。`chat.history` 會針對 UI 用戶端進行顯示正規化：從可見文字中移除行內指令標籤、純文字工具呼叫 XML 承載資料（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及遭截斷的工具呼叫區塊）和外洩的 ASCII／全形模型控制權杖；略過只含靜默權杖的助理資料列（完全相符的 `NO_REPLY`／`no_reply`）；過大的資料列則可能以預留位置取代。
    - `chat.message.get` 是附加的有界完整訊息讀取器，用於讀取單一可見的逐字稿項目。傳入 `sessionKey`；若工作階段選取範圍限定於代理程式，可選擇傳入 `agentId`；另需傳入先前透過 `chat.history` 顯示的逐字稿 `messageId`。只要儲存的項目仍然可用且未超出大小限制，閘道就會傳回相同的顯示正規化投影，但不受輕量歷程截斷上限限制。
    - `chat.toolTitles` 傳回在控制 UI 中呈現之工具呼叫的簡短用途標題（批次處理，上限為 24 個項目，且輸入有界）。此功能須透過 `gateway.controlUi.toolTitles` 選擇加入（預設關閉）；停用此功能的閘道會回應 `{ titles: {}, disabled: true }`，且不呼叫模型，讓用戶端停止詢問。啟用時，標題會使用標準公用模型路由：優先使用明確設定的 `utilityModel`（這是操作員的決策，與所有公用工作一樣，可能會將有界的工作內容傳送給所選供應商）；否則使用工作階段供應商宣告的小型模型預設值，因此不會隱含新增資料傳出目的地；空白的 `utilityModel` 會完全停用標題。標題絕不會後援至主要模型。結果會依工具名稱 + 輸入作為索引鍵，快取於各代理程式狀態資料庫中，因此重複檢視不會對相同呼叫再次計費。
    - `chat.send` 接受單輪的 `fastMode: "auto"`，使自動截止時間前啟動的模型呼叫使用快速模式，之後啟動的重試、後援、工具結果或接續呼叫則不使用快速模式。截止時間預設為 60 秒（`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`），並可透過 `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` 針對各模型設定。`chat.send` 呼叫端可傳入單輪的 `fastAutoOnSeconds`，以覆寫該要求的截止時間。

  </Accordion>

  <Accordion title="裝置配對與裝置權杖">
    - `device.pair.list` 傳回待處理及已核准的配對裝置。
    - `device.pair.setupCode` 建立行動裝置設定碼，且預設會建立 PNG QR 資料 URL。此方法需要 `operator.admin`，並刻意不列入對外公告的探索資訊中。結果包含 `setupCode`、選用的 `qrDataUrl`、`gatewayUrl`、非機密的 `auth` 標籤，以及 `urlSource`。
    - `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 管理裝置配對記錄。
    - `device.pair.rename` 指派操作員標籤（`{ deviceId, label }`）；此標籤的優先順序高於用戶端回報的顯示名稱，且在裝置修復或重新核准後仍會保留。
    - `device.token.rotate` 在已核准的角色與呼叫端範圍界限內輪替配對裝置權杖。
    - `device.token.revoke` 在已核准的角色與呼叫端範圍界限內撤銷配對裝置權杖。

    設定碼嵌入了短效的啟動認證資訊。用戶端不得在配對流程之外
    記錄或持久化該資訊。

  </Accordion>

  <Accordion title="節點配對、叫用與待處理工作">
    - `node.pair.list`、`node.pair.approve`、`node.pair.reject` 和 `node.pair.remove` 涵蓋節點能力核准。`node.pair.request` 和 `node.pair.verify` 已於 2026.7 與獨立的節點配對儲存區一併移除；待處理要求會在節點連線期間由閘道建立。
    - `node.list` 和 `node.describe` 傳回已知／已連線的節點狀態。
    - `node.rename` 更新已配對節點的標籤。
    - `node.invoke` 將命令轉送至已連線節點。
    - `node.invoke.result` 傳回叫用要求的結果。
    - `mcp.tools.call.v1` 是無介面節點主機用來呼叫已設定之節點本機 MCP 工具的命令。此命令透過 `node.invoke` 傳送，要求節點宣告該命令，且仍受配對核准與 `gateway.nodes.denyCommands` 約束。
    - `node.event` 將源自節點的事件傳回閘道。
    - `node.pluginTools.update` 是取代已連線節點之代理程式可見外掛／MCP 工具描述元的唯一發布路徑；`connect` 參數不會攜帶這些描述元。
    - `node.pending.pull` 和 `node.pending.ack` 是已連線節點的佇列 API。
    - `node.pending.enqueue` 和 `node.pending.drain` 管理離線／中斷連線節點的持久待處理工作。

  </Accordion>

  <Accordion title="核准系列">
    - `approval.get` 和 `approval.resolve` 是不限定種類的持久核准方法（範圍為 `operator.approvals`）。`approval.get` 會傳回經過清理的待處理投影，或保留的終止狀態投影，並附帶穩定的 `urlPath`；`approval.resolve` 接受正規核准 ID、明確的 `kind` 和決策，採用先回答者勝出的解析方式，並一律傳回已記錄的正規結果。
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 涵蓋一次性執行核准要求，以及待處理核准的查詢／重播。它們是同一個持久核准登錄的通訊協定邊界轉接器。
    - `exec.approval.waitDecision` 等待單一待處理的執行核准，並傳回最終決策（逾時時傳回 `null`）。
    - `exec.approvals.get` 和 `exec.approvals.set` 管理閘道執行核准原則快照。
    - `exec.approvals.node.get` 和 `exec.approvals.node.set` 透過節點轉送命令，管理節點本機的執行核准原則。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 涵蓋外掛定義的核准流程。

  </Accordion>

  <Accordion title="自動化、Skills 與工具">
    - 自動化：`wake` 排定立即或下次心跳偵測時注入喚醒文字；`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 管理排程工作。
    - `cron.run` 仍是用於手動執行的入列式 RPC。需要完成語意的用戶端應讀取傳回的 `runId`，並輪詢 `cron.runs`。
    - `cron.runs` 接受選用且非空白的 `runId` 篩選器，讓用戶端可以追蹤單一已入列的手動執行，而不會與同一工作的其他歷程項目發生競爭。
    - Skills 與工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。請參閱下方的[操作員輔助方法](#operator-helper-methods)。

  </Accordion>
</AccordionGroup>

### 常見事件系列

- `chat`：UI 聊天更新，例如 `chat.inject` 與其他僅限逐字稿的聊天
  事件。在通訊協定 v4 中，差異承載資料包含 `deltaText`；`message` 仍是
  累積的助理快照。非前綴取代會設定
  `replace=true`，並使用 `deltaText` 作為取代文字。
- `session.message`、`session.operation`、`session.tool`：已訂閱工作階段的逐字稿、進行中
  工作階段作業與事件串流更新。
- `session.approval`：提供給明確選擇加入之確切工作階段訂閱者的經過清理之待處理與終止狀態核准事實。子核准使用
  持久化的祖先受眾；事件絕不會變更逐字稿或喚醒代理程式。
- `sessions.changed`：工作階段索引或中繼資料已變更。
- `presence`：系統上線狀態快照更新。
- `tick`：週期性連線維持／存活事件。
- `health`：閘道健康狀態快照更新。
- `heartbeat`：心跳偵測事件串流更新。
- `cron`：排程執行／工作變更事件。
- `shutdown`：閘道關閉通知。
- `node.pair.requested` / `node.pair.resolved`：節點配對生命週期。
- `node.invoke.request`：節點叫用要求廣播。
- `device.pair.requested` / `device.pair.resolved`：配對裝置生命週期。
- `voicewake.changed`：喚醒詞觸發設定已變更。
- `exec.approval.requested` / `exec.approval.resolved`：執行核准
  生命週期。
- `plugin.approval.requested` / `plugin.approval.resolved`：外掛核准
  生命週期。

### 節點輔助方法

節點可以呼叫 `skills.bins`，以擷取目前的 Skill 可執行檔清單，
供自動允許檢查使用。

## 稽核帳本 RPC

`audit.activity.list` 為操作員用戶端提供穩定且由新至舊排列的代理程式
執行、工具動作與選擇加入之訊息生命週期中繼資料檢視。此方法需要
`operator.read`。查詢會排除超過 30 天的記錄，而共用
SQLite 帳本上限為 100,000 筆記錄。過期資料列會在
閘道啟動、每小時維護及後續寫入期間刪除。資料模型與隱私語意請參閱
[稽核歷程](/gateway/audit)。

- 參數：可選的精確 `agentId`、`sessionKey` 或 `runId`；可選的 `kind`
  （`"agent_run"`、`"tool_action"` 或 `"message"`）；可選的 `status`
  （`"started"`、`"succeeded"`、`"failed"`、`"cancelled"`、`"timed_out"`、
  `"blocked"` 或 `"unknown"`）；可選的訊息 `direction`（`"inbound"` 或
  `"outbound"`）與精確的 `channel`；可選的含端點 `after`／`before`
  Unix 毫秒界限；可選的 `limit`，範圍為 `1` 至 `500`；以及可選的
  字串 `cursor`，其值來自前一頁。
- 結果：`{ "events": AuditActivityEventV1[], "nextCursor"?: string }`。

具名的 V1 結果聯集分別為代理程式執行、工具動作、輸入訊息及輸出訊息提供獨立的
結構描述。`eventType` 判別欄位依序為 `agent_run`、`tool_action`、
`inbound_message` 或 `outbound_message`；`kind` 和訊息 `direction`
仍可用於篩選與顯示。每個事件都有整數 `schemaVersion: 1`。訊息身分參照使用精確的
`hmac-sha256:v1:<32 hex key id>:<64 hex digest>` 格式；頻道傳送者的動作者
ID 也使用相同格式。

所有變體都需要 `eventType`、`schemaVersion`、`eventId`、`sequence`、
`sourceSequence`、`occurredAt`、`kind`、`action`、`status`、`actor` 和
`redaction`。各變體欄位如下：

| `eventType`        | 必要欄位                                                          | 可選欄位                                                                                                                        |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`、`runId`；`kind: "agent_run"`                           | `sessionKey`、`sessionId`、`errorCode`                                                                                          |
| `tool_action`      | `agentId`、`runId`；`kind: "tool_action"`                         | `sessionKey`、`sessionId`、`toolCallId`、`toolName`、`errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`、`channel`、`conversationKind`、`outcome`  | `agentId`、`runId`、`durationMs`、`resultCount`、身分參照、`reasonCode`、`errorCode`                                             |
| `outbound_message` | `direction: "outbound"`、`channel`、`conversationKind`、`outcome` | `agentId`、`runId`、`durationMs`、`resultCount`、身分參照、`reasonCode`、`deliveryKind`、`failureStage`、`errorCode`               |

封閉式訊息列舉如下：

- `conversationKind`：`direct`、`group`、`channel` 或 `unknown`。
- 輸入訊息的 `outcome`：`completed`、`skipped` 或 `failed`；可選的
  `reasonCode`：`duplicate`、`reply_operation_active`、
  `reply_operation_aborted`、`fast_abort`、`plugin_bound_handled`、
  `plugin_bound_unavailable`、`plugin_bound_declined`、`plugin_bound_error`、
  `before_dispatch_handled`、`acp_dispatch_completed`、`acp_dispatch_failed`、
  `acp_dispatch_empty` 或 `acp_dispatch_aborted`。
- 輸出訊息的 `outcome`：`sent`、`suppressed`、`failed` 或 `unknown`；可選的
  `reasonCode`：`cancelled_by_message_sending_hook`、
  `cancelled_by_reply_payload_sending_hook`、
  `empty_after_message_sending_hook`、`empty_after_reply_payload_sending_hook`
  或 `no_visible_payload`。未傳回平台身分的轉接器會標記為
  `unknown`，因為無法排除外部副作用已發生。
- `deliveryKind`：`text`、`media` 或 `other`；`failureStage`：
  `platform_send`、`queue` 或 `unknown`。

終止欄位彼此相關，並非各自獨立的可選欄位：

| 變體             | 終止狀態對應                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 代理程式執行     | `started` 沒有 `errorCode`；每個非成功的完成狀態都需要與其相符的 `run_*` 代碼。                                                                                    |
| 工具動作         | `started` 和成功狀態沒有 `errorCode`；其他每個完成狀態都需要與其相符的 `tool_*` 代碼。                                                                             |
| 輸入訊息         | succeeded = `completed`；blocked = `skipped`；failed = `failed` 加上 `message_processing_failed`。若有 `reasonCode`，其值必須屬於對應的終止狀態類別。               |
| 輸出訊息         | succeeded = `sent`；blocked = `suppressed` 加上 `reasonCode`；failed = `failed` 加上 `errorCode` 和 `failureStage`；unknown = `unknown` 加上 `failureStage`。        |

每個活動事件都包含穩定的事件 ID、單調遞增的帳本序號、來源事件序號、
時間戳記、動作者、動作、狀態、整數 `schemaVersion: 1`，以及
`redaction: "metadata_only"`。執行和工具記錄必須包含代理程式與執行來源資訊，
也可以包含工作階段來源資訊。訊息記錄可以包含代理程式與執行 ID，但刻意永不包含
`sessionKey` 或 `sessionId`；因此，`sessionKey` 查詢篩選條件僅適用於
執行與工具資料列。工具事件可以包含工具呼叫 ID 和工具名稱。

訊息記錄使用 `message.inbound.processed` 或
`message.outbound.finished`，並加入方向、頻道、對話種類、
正規化結果，以及可選的傳遞種類、失敗階段、持續時間、
結果數量、原因代碼，和以安裝環境本機金鑰產生的
帳號／對話／訊息／目標假名。這些假名有助於建立關聯，
但不構成匿名化：狀態資料庫包含其金鑰，而 RPC 與命令列介面匯出內容則不包含。
帳本不儲存提示詞、訊息本文、工具引數、工具結果、命令輸出或原始錯誤文字。
執行／工具的 `sessionKey` 值仍是未處理的關聯中繼資料，且可能內嵌
平台帳號或對等端 ID；訊息記錄則省略工作階段金鑰。

對於輸入資料列，`durationMs` 測量從核心分派到其終止狀態的時間，而
`resultCount` 則計算已完成的佇列工具、區塊與回覆承載資料數量。對於
輸出資料列，`durationMs` 涵蓋從取得傳遞所有權到確認、寄不出去的郵件或
對帳的時間（包括佇列等待時間），而 `resultCount`
則計算已識別的實體平台傳送次數。`deliveryKind` 若存在，
描述經過鉤子與轉譯後的有效承載資料；遭抑制或
因當機而狀態不明確的資料列會省略此欄位。

目前的訊息涵蓋範圍包括到達核心分派的已接受輸入訊息，
其中也包括核心的重複與終止結果。輸出涵蓋範圍會針對每個到達共用持久
傳遞邊界的原始邏輯回覆承載資料寫入一筆終止資料列；分塊與轉接器展開
會彙總於 `resultCount`。可重試或狀態不明確的佇列傳送，
只會在確認、寄不出去的郵件或對帳後記錄。繞過這些
共用邊界的外掛本機與直接傳送路徑目前尚未涵蓋。受限的工作執行緒佇列採盡力而為，
可能會在失敗或飽和時捨棄記錄，因此此介面並非
無損的合規封存。

記錄功能預設為啟用，並由
[`audit.enabled`](/zh-TW/gateway/configuration-reference#audit) 控制。訊息記錄則
由 `audit.messages` 另行控制，預設為 `"off"`。停用
記錄功能時，`audit.activity.list` 仍會提供先前寫入的記錄，
直到這些記錄過期為止。

已發布的 `audit.list` 要求、結果與 `AuditEvent` 結構描述維持
不變，且只會傳回代理程式執行與工具動作記錄。新的操作員
用戶端應在閘道公告支援 `audit.activity.list` 時呼叫它。較舊的
閘道可能會回報 `unknown method: audit.activity.list`，或者由於
已發布版本會先進行授權再查找方法，對僅具讀取範圍的要求回報 `missing scope:
operator.admin`。只有在未公告該方法時，才能將後者
視為方法不存在。接著，只有在其篩選條件不需要訊息種類、方向或頻道
支援時，用戶端才可重試 `audit.list`。

使用 [`openclaw audit`](/zh-TW/cli/audit) 進行文字查詢與有界限的 JSON 匯出。

## 任務總帳 RPC

操作員用戶端透過任務總帳 RPC
檢查及取消閘道背景任務記錄（`packages/gateway-protocol/src/schema/tasks.ts`）。這些
RPC 傳回經過清理的任務摘要，而非原始執行階段狀態。

- `tasks.list` 需要 `operator.read`。
  - 參數：選用的 `status`（`"queued"`、`"running"`、`"completed"`、
    `"failed"`、`"cancelled"` 或 `"timed_out"`）或由這些狀態組成的陣列、
    選用的 `agentId`、選用的 `sessionKey`、從 `1` 到
    `500` 的選用 `limit`，以及選用的字串 `cursor`。
  - 結果：`{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` 需要 `operator.read`。
  - 參數：`{ "taskId": string }`。
  - 結果：`{ "task": TaskSummary }`。
  - 不存在的任務 ID 會傳回閘道的找不到錯誤格式。
- `tasks.cancel` 需要 `operator.write`。
  - 參數：`{ "taskId": string, "reason"?: string }`。
  - 結果：`{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` 表示總帳中是否有相符的任務。`cancelled`
    表示執行階段是否接受或記錄了取消要求。

`TaskSummary` 包含 `id`、`status` 與選用的中繼資料：`kind`、
`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、
`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、時間戳記、進度、
終止摘要，以及經過清理的錯誤文字。`agentId` 識別執行任務的代理程式；
`sessionKey` 與 `ownerKey` 保留要求者與控制
情境。

## 操作員輔助方法

- `commands.list` (`operator.read`) 會擷取代理程式的執行階段命令清單。
  - `agentId` 為選填；省略即可讀取預設代理程式工作區。
  - `scope` 控制主要 `name` 所指向的介面：`text` 會傳回不含開頭 `/` 的主要文字命令權杖；`native` 和預設的 `both` 路徑則會在可用時傳回可感知供應商的原生命令名稱。
  - `textAliases` 包含精確的斜線別名，例如 `/model` 和 `/m`。
  - `nativeName` 會在原生命令名稱存在時，包含可感知供應商的原生命令名稱。
  - `provider` 為選填，只會影響原生命名及原生外掛命令的可用性。
  - `includeArgs=false` 會從回應中省略序列化的引數中繼資料。
- `tools.catalog` (`operator.read`) 會擷取代理程式的執行階段工具目錄。回應包含分組工具及來源中繼資料：
  - `source`：`core` 或 `plugin`
  - `pluginId`：當 `source="plugin"` 時的外掛擁有者
  - `optional`：外掛工具是否為選用
- `tools.effective` (`operator.read`) 會擷取工作階段中實際生效的執行階段工具清單。
  - `sessionKey` 為必填。
  - 閘道會在伺服器端從工作階段衍生受信任的執行階段內容，而不接受呼叫端提供的驗證或傳遞內容。
  - 回應是由伺服器衍生、限於工作階段範圍的作用中清單投影，其中包含核心、外掛、頻道，以及已探索到的 MCP 伺服器工具。
  - 對 MCP 而言，`tools.effective` 是唯讀的：它可以透過最終工具政策投影已暖機工作階段的 MCP 目錄，但不會建立 MCP 執行階段、連接傳輸層，也不會發出 `tools/list`。如果不存在相符的已暖機目錄，回應可能包含 `mcp-not-yet-connected`、`mcp-not-yet-listed` 或 `mcp-stale-catalog` 等通知。
  - 實際生效的工具項目會使用 `source="core"`、`source="plugin"`、`source="channel"` 或 `source="mcp"`。
- `tools.invoke` (`operator.write`) 會透過與 `/tools/invoke` 相同的閘道政策路徑叫用一個可用工具。
  - `name` 為必填。`args`、`sessionKey`、`agentId`、`confirm` 和 `idempotencyKey` 為選填。
  - 如果同時提供 `sessionKey` 和 `agentId`，解析出的工作階段代理程式必須符合 `agentId`。
  - 僅限擁有者使用的核心包裝器（例如 `cron`、`gateway` 和 `nodes`）需要擁有者／管理員身分 (`operator.admin`)，即使 `tools.invoke` 本身是 `operator.write`。
  - 回應是面向 SDK 的封套，包含 `ok`、`toolName`、選用的 `output`，以及具型別的 `error` 欄位。核准或政策拒絕會在承載內容中傳回 `ok:false`，而不是繞過閘道工具政策管線。
- `skills.status` (`operator.read`) 會擷取代理程式可見的 Skills 清單。
  - `agentId` 為選填；省略即可讀取預設代理程式工作區。
  - 回應包含資格條件、缺少的需求、設定檢查，以及經清理的安裝選項，不會揭露原始密鑰值。
- `skills.search` 和 `skills.detail` (`operator.read`) 會傳回 ClawHub 探索中繼資料。
- `skills.upload.begin`、`skills.upload.chunk` 和 `skills.upload.commit` (`operator.admin`) 會在安裝私人 Skill 封存檔前先進行暫存。這是供受信任用戶端使用的獨立管理員上傳路徑，而非一般 ClawHub Skill 安裝流程；除非啟用 `skills.install.allowUploadedArchives`，否則預設停用。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    會建立繫結至該 slug 和 force 值的上傳。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` 會在精確的解碼位移處附加位元組。
  - `skills.upload.commit({ uploadId, sha256? })` 會驗證最終大小和 SHA-256。提交只會完成上傳，不會安裝 Skill。
  - 上傳的 Skill 封存檔是根目錄包含 `SKILL.md` 的 zip 封存檔。封存檔內部的目錄名稱永遠不會選取安裝目標。
- `skills.install` (`operator.admin`) 有三種模式：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 會將 Skill 資料夾安裝到預設代理程式工作區的 `skills/` 目錄。
  - 上傳模式：`{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    會將已提交的上傳安裝到預設代理程式工作區的 `skills/<slug>` 目錄。slug 和 force 值必須符合原始 `skills.upload.begin` 要求。除非已啟用 `skills.install.allowUploadedArchives`，否則會遭拒；此設定不影響 ClawHub 安裝。
  - 閘道安裝程式模式：`{ name, installId, timeoutMs? }` 會在閘道主機上執行已宣告的 `metadata.openclaw.install` 動作。舊版用戶端可能仍會傳送 `dangerouslyForceUnsafeInstall`；此欄位已淘汰，只為了通訊協定相容性而接受，並會被忽略。請使用 `security.installPolicy` 進行由操作員掌控的安裝決策。
- `skills.update` (`operator.admin`) 有兩種模式：
  - ClawHub 模式會更新預設代理程式工作區中的單一已追蹤 slug，或所有已追蹤的 ClawHub 安裝。
  - 設定模式會修補 `skills.entries.<skillKey>` 的值，例如 `enabled`、`apiKey` 和 `env`。

### `models.list` 檢視

`models.list` 接受選用的 `view` 參數
(`src/agents/model-catalog-visibility.ts`)：

- 省略或設為 `"default"`：如果已設定 `agents.defaults.models`，回應會是允許的目錄，其中包含針對 `provider/*` 項目動態探索到的模型。否則，回應會是完整的閘道目錄。
- `"configured"`：適合選擇器大小的行為。如果已設定 `agents.defaults.models`，它仍具有優先權，包括針對 `provider/*` 項目的供應商範圍探索。若沒有允許清單，回應會使用明確的 `models.providers.<provider>.models` 項目，且只有在不存在已設定的模型資料列時，才會回退至完整目錄。
- `"provider-config"`：由來源定義的 `models.providers.*.models` 清單，不受選擇器允許清單影響。資料列包含公開模型功能及可感知路由的可用性，但會省略供應商端點、驗證資料和執行階段要求設定。
- `"all"`：完整的閘道目錄，略過 `agents.defaults.models`。請用於診斷／探索使用者介面，而不是一般模型選擇器。

## Exec 核准

- 當 exec 要求需要核准時，閘道會廣播 `exec.approval.requested`。
- 操作員用戶端會透過呼叫 `exec.approval.resolve` 進行處理（需要 `operator.approvals`）。
- 對於 `host=node`，`exec.approval.request` 必須包含 `systemRunPlan`（標準的 `argv`／`cwd`／`rawCommand`／工作階段中繼資料）。缺少 `systemRunPlan` 的要求會遭拒。
- 核准後，轉送的 `node.invoke system.run` 呼叫會重複使用該標準 `systemRunPlan`，作為具權威性的命令／cwd／工作階段內容。
- 如果呼叫端在準備階段與最終核准的 `system.run` 轉送之間變更 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，閘道會拒絕執行，而不會信任遭變更的承載內容。

## 代理程式傳遞回退

- `agent` 要求可包含 `deliver=true`，以要求向外傳遞。
- `bestEffortDeliver=false`（預設值）會維持嚴格行為：無法解析或僅限內部使用的傳遞目標會傳回 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允許在無法解析任何可向外傳遞的路由時，回退至僅限工作階段的執行（例如內部／網頁聊天工作階段，或有歧義的多頻道設定）。
- 要求傳遞時，最終 `agent` 結果可能包含 `result.deliveryStatus`，並使用為
  [`openclaw agent --json --deliver`](/zh-TW/cli/agent#json-delivery-status) 所記載的相同 `sent`、`suppressed`、`partial_failed` 和 `failed` 狀態。

## 版本控制

- `PROTOCOL_VERSION`、`MIN_CLIENT_PROTOCOL_VERSION`、
  `MIN_NODE_PROTOCOL_VERSION` 和 `MIN_PROBE_PROTOCOL_VERSION` 位於
  `packages/gateway-protocol/src/version.ts`。
- 用戶端會傳送 `minProtocol` + `maxProtocol`。操作員和使用者介面用戶端必須在該範圍中包含目前的通訊協定；目前的用戶端和伺服器執行通訊協定 v4。
- 同時具有 `role: "node"` 和 `client.mode: "node"` 的已驗證用戶端可使用 N-1 節點通訊協定（目前為 v3）。輕量級重新啟動探查使用相同的 N-1 範圍。裝置驗證、配對、範圍、命令政策和 exec 核准不受此相容性範圍影響。由外掛擁有的節點功能和命令會保留不提供，直到節點升級至目前的通訊協定，因為其託管介面不屬於 N-1 合約的一部分。
- 結構描述和模型會從 TypeBox 定義產生：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 用戶端常數

參考用戶端實作位於 `packages/gateway-client/src/`
（OpenClaw 透過精簡的 `src/gateway/client.ts` 外觀包裝它）。這些預設值在通訊協定 v4 中維持穩定，並且是第三方用戶端應採用的基準。

| 常數                                      | 預設值                                                | 來源                                                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| 請求逾時（每個 RPC）                      | `30_000` ms                                           | `packages/gateway-client/src/client.ts`（`requestTimeoutMs`）                                                             |
| 預先驗證／連線挑戰逾時                    | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts`（`OPENCLAW_HANDSHAKE_TIMEOUT_MS` 環境變數可提高配對的伺服器／用戶端時間預算）   |
| 初始重新連線退避時間                      | `1_000` ms                                            | `packages/gateway-client/src/client.ts`（`backoffMs`）                                                                    |
| 最大重新連線退避時間                      | `30_000` ms                                           | `packages/gateway-client/src/client.ts`（`scheduleReconnect`）                                                            |
| 裝置權杖關閉後的快速重試限制              | `250` ms                                              | `packages/gateway-client/src/client.ts`                                                                                   |
| `terminate()` 前的強制停止寬限時間        | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| `stopAndWait()` 預設逾時                  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| 預設偵測間隔（`hello-ok` 前）             | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| 偵測逾時關閉                              | 靜默時間超過 `tickIntervalMs * 2` 時使用代碼 `4000`   | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024`（25 MB）                           | `src/gateway/server-constants.ts`                                                                                         |

伺服器會在 `hello-ok` 中公布實際生效的 `policy.tickIntervalMs`、
`policy.maxPayload` 與 `policy.maxBufferedBytes`；用戶端應遵循這些值，而非交握前的預設值。

當每個待處理請求都有期限時，參考用戶端會讓有限期請求使用其設定的期限。沒有有限
`timeoutMs` 的 `expectFinal` 請求、任何使用 `timeoutMs: null` 的請求，或有限期與
無期限請求的混合，都會讓偵測監視器維持啟用。如果傳入事件與回應的靜默時間超過
偵測逾時門檻，用戶端會以代碼 `4000` 關閉通訊端、拒絕所有待處理請求，並重新連線。
重新連線後不會重播遭拒絕的請求。

## 驗證

- 共用密鑰閘道驗證會依設定的 `gateway.auth.mode`
  （`"none" | "token" | "password" | "trusted-proxy"`），使用
  `connect.params.auth.token` 或 `connect.params.auth.password`。
- 具身分資訊的模式，例如 Tailscale Serve（`gateway.auth.allowTailscale: true`）
  或非迴路介面的 `gateway.auth.mode: "trusted-proxy"`，會透過請求標頭通過連線
  驗證檢查，而非使用 `connect.params.auth.*`。
- 私有入口的 `gateway.auth.mode: "none"` 會完全略過共用密鑰連線驗證；請勿在
  公開／不受信任的入口公開此模式。
- 配對後，閘道會核發範圍限定於連線角色與權限範圍的裝置權杖，並在
  `hello-ok.auth.deviceToken` 中傳回。用戶端應在任何成功連線後將其持久化。
- 使用儲存的裝置權杖重新連線時，也應重複使用為該權杖儲存的已核准權限範圍集合。
  這會保留已授予的讀取／探測／狀態存取權，並避免重新連線時悄然縮減為更窄的
  隱含僅限管理員權限範圍。
- 用戶端連線驗證組裝（`packages/gateway-client/src/client.ts` 中的
  `selectConnectAuth`）：
  - `auth.password` 是獨立的，設定後一律轉送。
  - `auth.token` 依下列優先順序填入：先使用明確的共用權杖，接著是明確的
    `deviceToken`，最後是儲存的每裝置權杖（以 `deviceId` + `role` 為鍵）。
  - 僅在上述項目都未解析出 `auth.token` 時，才會傳送 `auth.bootstrapToken`。
    共用權杖或任何已解析的裝置權杖都會抑制它。
  - 在一次性的 `AUTH_TOKEN_MISMATCH` 重試中，自動提升儲存的裝置權杖僅限受信任的
    端點：迴路介面，或具有固定 `tlsFingerprint` 的 `wss://`。未固定指紋的公開
    `wss://` 不符合資格。
- 內建的設定代碼啟動程序會傳回主要節點的 `hello-ok.auth.deviceToken`，以及
  `hello-ok.auth.deviceTokens` 中有界限的操作員權杖，供受信任的行動裝置交接使用。
  操作員權杖包含 `operator.talk.secrets`，可供原生 Talk 設定讀取，但不包含
  配對變更權限範圍與 `operator.admin`。
- 非基準設定代碼啟動程序等待核准時，`PAIRING_REQUIRED` 詳細資料會包含
  `recommendedNextStep: "wait_then_retry"`、`retryable: true` 與
  `pauseReconnect: false`。請持續使用相同的啟動權杖重新連線，直到請求獲得核准或
  權杖失效。
- 僅當連線在受信任的傳輸方式（例如 `wss://` 或迴路介面／本機配對）上使用啟動
  驗證時，才持久化 `hello-ok.auth.deviceTokens`。
- 如果用戶端提供明確的 `deviceToken` 或明確的 `scopes`，該呼叫端要求的權限範圍
  集合仍具權威性；只有當用戶端重複使用儲存的每裝置權杖時，才會重複使用快取的
  權限範圍。
- 裝置權杖可透過 `device.token.rotate` 與 `device.token.revoke` 輪替／撤銷
  （需要 `operator.pairing`）。輪替或撤銷節點或其他非操作員角色時，也需要
  `operator.admin`。
- `device.token.rotate` 會傳回輪替中繼資料。只有已使用該裝置權杖驗證的同裝置
  呼叫，才會回傳替代的不記名權杖，讓僅使用權杖的用戶端可在重新連線前持久化
  替代權杖。共用／管理員輪替不會回傳不記名權杖。
- 權杖核發、輪替與撤銷始終受限於該裝置配對項目中記錄的已核准角色集合；權杖
  變更無法擴大至或以配對核准從未授予的裝置角色為目標。
- 對於已配對裝置的權杖工作階段，除非呼叫端也具有 `operator.admin`，否則裝置
  管理僅限自身範圍：非管理員呼叫端只能管理其自身裝置項目的操作員權杖。節點與
  其他非操作員權杖的管理僅限管理員，即使是呼叫端自己的裝置亦然。
- `device.token.rotate` 與 `device.token.revoke` 也會根據呼叫端目前的工作階段
  權限範圍，檢查目標操作員權杖的權限範圍集合。非管理員呼叫端無法輪替或撤銷
  權限範圍比自己目前持有範圍更廣的操作員權杖。
- 驗證失敗會包含 `error.details.code` 與復原提示：
  - `error.details.canRetryWithDeviceToken`（布林值）
  - `error.details.recommendedNextStep`：`retry_with_device_token`、
    `update_auth_configuration`、`update_auth_credentials`、
    `wait_then_retry`、`review_auth_configuration` 其中之一
    （`packages/gateway-protocol/src/connect-error-details.ts`）。
- `AUTH_TOKEN_MISMATCH` 的用戶端行為：
  - 受信任的用戶端可使用快取的每裝置權杖進行一次有界限的重試。
  - 如果該次重試失敗，請停止自動重新連線迴圈，並顯示操作員行動指引。
- `AUTH_SCOPE_MISMATCH` 表示裝置權杖已被辨識，但未涵蓋要求的角色／權限範圍。
  請勿將此情況呈現為權杖錯誤；應提示操作員重新配對，或核准更窄／更廣的權限
  範圍合約。

## 裝置身分與配對

- 節點應包含從金鑰組指紋衍生的穩定裝置身分（`device.id`）。
- 閘道會依裝置與角色核發權杖。
- 除非已啟用本機自動核准，否則新的裝置 ID 必須取得配對核准。
- 配對自動核准以直接的本機迴路介面連線為中心。
- OpenClaw 另有一條範圍有限的後端／容器本機自我連線路徑，供受信任的共用密鑰
  輔助程式流程使用。
- 同主機的 tailnet 或 LAN 連線在配對方面仍視為遠端，並需要核准。
- WS 用戶端通常會在 `connect` 期間包含 `device` 身分（操作員 + 節點）。唯一可
  不提供裝置身分的操作員例外，是明確的信任路徑：
  - `gateway.controlUi.allowInsecureAuth=true`，用於僅限 localhost 的不安全
    HTTP 相容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` 操作員 Control UI 驗證。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急解鎖，嚴重降低
    安全性）。
  - 保留內部輔助程式路徑上的直接迴路介面 `gateway-client` 後端 RPC。
- 省略裝置身分會影響權限範圍。當明確的信任路徑允許無裝置身分的操作員連線時，
  除非該路徑具備具名的權限範圍保留例外，OpenClaw 仍會將自行宣告的權限範圍清除
  為空集合。受權限範圍限制的方法接著會因 `missing scope` 而失敗。
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` 是 Control UI 的緊急解鎖
  權限範圍保留路徑。它不會向任意自訂後端或命令列介面形式的 WebSocket 用戶端
  授予權限範圍。
- 保留的直接迴路介面 `gateway-client` 後端輔助程式路徑，只會為內部本機控制平面
  RPC 保留權限範圍；自訂後端 ID 不會獲得此例外。
- 所有連線都必須簽署伺服器提供的 `connect.challenge` 單次隨機值。

### 裝置驗證遷移診斷

對於仍使用挑戰前簽署行為的舊版用戶端，`connect` 會在 `error.details.code`
下傳回 `DEVICE_AUTH_*` 詳細代碼，並附上穩定的 `error.details.reason`。

常見遷移失敗：

| 訊息                        | details.code                     | details.reason           | 含義                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 用戶端省略了 `device.nonce`（或傳送空白值）。      |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 用戶端使用過期或錯誤的 nonce 簽署。                |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 簽章酬載與 v2 酬載不符。                           |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 簽署的時間戳記超出允許的時間偏差。                 |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 與公開金鑰指紋不符。                   |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開金鑰格式或正規化失敗。                         |

遷移目標：

- 一律等待 `connect.challenge`。
- 簽署包含伺服器 nonce 的 v2 酬載。
- 在 `connect.params.device.nonce` 中傳送相同的 nonce。
- 建議使用的簽章酬載為 `v3`
  （`packages/gateway-client/src/device-auth.ts` 中的 `buildDeviceAuthPayloadV3`），
  除了裝置、用戶端、角色、範圍、權杖與 nonce 欄位外，
  還會繫結 `platform` 和 `deviceFamily`。
- 為了相容性，仍接受舊版 `v2` 簽章，但配對裝置的
  中繼資料釘選仍會控制重新連線時的命令原則。

## TLS 與釘選

- WS 連線支援 TLS（`gateway.tls` 設定）。
- 用戶端可選擇透過 `gateway.remote.tlsFingerprint` 或命令列介面
  `--tls-fingerprint` 釘選閘道憑證指紋。

## 範圍

此通訊協定公開完整的閘道 API：狀態、頻道、模型、聊天、
代理程式、工作階段、節點、核准等。確切介面由
`packages/gateway-protocol/src/schema.ts` 重新匯出的 TypeBox 結構描述定義。

## 相關內容

- [橋接通訊協定](/zh-TW/gateway/bridge-protocol)
- [閘道操作手冊](/zh-TW/gateway)
