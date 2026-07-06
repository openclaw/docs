---
read_when:
    - 實作或更新閘道 WS 用戶端
    - 偵錯協定不相符或連線失敗
    - 重新產生協定結構描述/模型
summary: 閘道 WebSocket 通訊協定：交握、訊框、版本控管
title: 閘道協定
x-i18n:
    generated_at: "2026-07-06T21:48:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15e0635d1b96e8ceabc98cfcececebde873b901de7b4bae2048b4d5cd4909c9d
    source_path: gateway/protocol.md
    workflow: 16
---

閘道 WS 協定是 OpenClaw 的單一控制平面與節點傳輸。
每個用戶端（命令列介面、網頁 UI、macOS app、iOS/Android 節點、無介面
節點）都透過 WebSocket 連線，並在握手時宣告 **角色**與**範圍**。

## 傳輸與框架

- WebSocket、文字框架、JSON 承載。
- 第一個框架**必須**是 `connect` 請求。
- 預連線框架上限為 64 KiB（`MAX_PREAUTH_PAYLOAD_BYTES`）。握手後，
  請遵循 `hello-ok.policy.maxPayload` 與
  `hello-ok.policy.maxBufferedBytes`。啟用診斷時，過大的傳入框架與緩慢的
  傳出緩衝區會在閘道關閉或丟棄框架前發出 `payload.large` 事件。
  這些事件會攜帶 `surface`、位元組大小、限制與安全的原因代碼，
  絕不包含訊息正文、附件內容、原始框架位元組、權杖、Cookie 或秘密。

框架形狀：

- 請求：`{type:"req", id, method, params}`
- 回應：`{type:"res", id, ok, payload|error}`
- 事件：`{type:"event", event, payload, seq?, stateVersion?}`

具有副作用的方法需要冪等性金鑰（請參閱 schema）。

## 握手

閘道會傳送預連線挑戰：

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

`server`、`features`、`snapshot`、`policy` 與 `auth` 都是
`HelloOkSchema`（`packages/gateway-protocol/src/schema/frames.ts`）所必需。
即使未核發裝置權杖，`auth` 也會回報協商後的角色/範圍（形狀如上）。
`pluginSurfaceUrls` 是選用項目，會將外掛 surface 名稱（例如
`canvas`）對應至具範圍限制的託管 URL；它可能會過期，因此節點會呼叫
`node.pluginSurface.refresh`，並帶上 `{ "surface": "canvas" }` 以取得新的項目。
已棄用的 `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
路徑不受支援；請使用外掛 surface。

當閘道仍在完成啟動 sidecar 時，`connect` 可能會傳回可重試的
`UNAVAILABLE` 錯誤，並帶有 `details.reason: "startup-sidecars"` 與
`retryAfterMs`。請在你的連線預算內重試，而不是將其視為終止性的握手失敗。

核發裝置權杖時，`hello-ok.auth` 會加入它：

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

內建 QR/設定碼啟動程序是行動裝置交接路徑。成功的基準設定碼
connect 會傳回主要節點權杖，以及一個有界的操作者權杖：

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

此操作者交接是刻意受限的：足以啟動行動操作者迴圈與原生設定，
包含用於讀取 Talk 設定的 `operator.talk.secrets`，但沒有配對變更範圍，
也沒有 `operator.admin`。更廣泛的配對/管理存取需要另外核准的配對或權杖流程。
只有在啟動驗證透過受信任傳輸（`wss://` 或 loopback/本機配對）執行時，
才持久化 `hello-ok.auth.deviceTokens`。

受信任的同處理序後端用戶端（`client.id: "gateway-client"`、
`client.mode: "backend"`）在以共用閘道權杖/密碼驗證的直接 loopback 連線上，
可以省略 `device`。此路徑保留給內部控制平面 RPC（例如子代理程式工作階段更新），
並避免過期的命令列介面/裝置配對基準阻擋本機後端工作。遠端、瀏覽器來源、
節點，以及明確的裝置權杖/裝置身分用戶端，仍會走一般配對與範圍升級檢查。

### 節點 connect 範例

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

節點會在 connect 時宣告能力主張：

- `caps`：高階分類，例如 `camera`、`canvas`、`screen`、
  `location`、`voice`、`talk`。
- `commands`：可供 invoke 使用的命令允許清單。
- `permissions`：細粒度切換（例如 `screen.record`、`camera.capture`）。

閘道會將這些視為主張，並強制套用伺服器端允許清單。

## 角色與範圍

如需完整的操作者範圍模型、核准時檢查與共用秘密語意，
請參閱[操作者範圍](/zh-TW/gateway/operator-scopes)。

角色：

- `operator`：控制平面用戶端（命令列介面/UI/自動化）。
- `node`：能力主機（camera/screen/canvas/system.run）。

操作者範圍（`src/gateway/operator-scopes.ts`），完整封閉集合：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

帶有 `includeSecrets: true` 的 `talk.config` 需要 `operator.talk.secrets`（或
`operator.admin`）。包含秘密時，請從 `talk.resolved.config.apiKey`
讀取作用中的 Talk provider 認證；`talk.providers.<id>.apiKey`
會保留來源形狀，可能是 SecretRef 物件或已遮蔽的字串。

外掛註冊的閘道 RPC 方法可以要求自己的操作者範圍，
但這些保留的核心前綴一律解析為 `operator.admin`
（`src/shared/gateway-method-policy.ts`）：`config.*`、`exec.approvals.*`、
`wizard.*`、`update.*`。

方法範圍只是第一道關卡。部分透過 `chat.send` 觸達的斜線命令會套用更嚴格的
命令層級檢查：持久化的 `/config set` 與 `/config unset` 寫入需要
`operator.admin`，即使閘道用戶端已持有較低的操作者範圍也一樣。

`node.pair.approve` 除了基礎方法範圍（`operator.pairing`）之外，
還有額外的核准時範圍檢查，這會根據待處理請求宣告的 `commands`
決定（`src/infra/node-pairing-authz.ts`）：

| 宣告的命令                                                   | 必要範圍                              |
| -------------------------------------------------------------- | ------------------------------------- |
| 無                                                             | `operator.pairing`                    |
| 非 exec 命令                                                   | `operator.pairing` + `operator.write` |
| 包含 `system.run`、`system.run.prepare` 或 `system.which`       | `operator.pairing` + `operator.admin` |

## Presence

- `system-presence` 會傳回以裝置身分為鍵的項目，包含
  `deviceId`、`roles` 與 `scopes`，因此即使裝置同時以操作者與節點身分連線，
  UI 也能為每個裝置顯示一列。
- `node.list` 包含選用的 `lastSeenAtMs` 與 `lastSeenReason`。已連線節點會以
  `connect` 原因回報目前連線時間；已配對節點也可以透過受信任的節點事件，
  回報持久的背景 presence。

### 節點背景存活事件

節點會以 `event: "node.presence.alive"` 呼叫 `node.event`，
用來記錄已配對節點在背景喚醒期間處於存活狀態，但不將其標記為已連線：

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是封閉列舉：`background`、`silent_push`、`bg_app_refresh`、
`significant_location`、`manual`、`connect`。未知值會正規化為
`background`（`src/shared/node-presence.ts`）。此事件只會為已驗證的節點裝置
工作階段持久化；無裝置或未配對工作階段會傳回 `handled: false`。

成功的閘道會傳回結構化結果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

較舊的閘道可能只會針對 `node.event` 傳回 `{ "ok": true }`；請將其視為
已確認的 RPC，而不是持久 presence 已保存。

## 廣播事件範圍控管

伺服器推送的廣播事件會受範圍控管，因此僅具配對範圍或僅限節點的工作階段，
不會被動接收工作階段內容（`src/gateway/server-broadcast.ts`）：

- Chat、agent 與工具結果框架（串流的 `agent` 事件、工具結果事件）至少需要
  `operator.read`。沒有此範圍的工作階段會完全略過這些框架。
- 外掛定義的 `plugin.*` 廣播預設受 `operator.write` 或
  `operator.admin` 控管；明確項目例如
  `plugin.approval.requested` / `plugin.approval.resolved` 則改用
  `operator.approvals`。
- 狀態/傳輸事件（`heartbeat`、`presence`、`tick`、connect/disconnect
  生命週期）保持不受限制，讓每個已驗證工作階段都能觀察傳輸健康狀態。
- 未知的廣播事件家族預設受範圍控管（fail-closed），
  除非已註冊的 handler 明確放寬限制。

每個用戶端連線都保有自己的每用戶端序號，因此即使不同用戶端看到的是事件串流中
經範圍篩選後的不同子集，廣播在該 socket 上仍會保持單調排序。

## RPC 方法家族

`hello-ok.features.methods` 是一份保守的探索清單，由
`src/gateway/server-methods-list.ts` 加上已載入的外掛/頻道方法匯出所建立，
它不是每個方法的生成式傾印，而且有些方法（例如 `push.test`、
`web.login.start`、`web.login.wait`、`sessions.usage`）即使是真實且可呼叫的方法，
也會刻意排除於探索之外。請將其視為功能探索，而不是
`src/gateway/server-methods/*.ts` 的完整列舉。

  <AccordionGroup>
  <Accordion title="System and identity">
    - `health` 會傳回快取或新探測的閘道健康狀態快照。
    - `diagnostics.stability` 會傳回近期有界限的診斷穩定性記錄器：事件名稱、計數、位元組大小、記憶體讀數、佇列/工作階段狀態、頻道/外掛名稱、工作階段 ID。不包含聊天文字、網路鉤子本文、工具輸出、原始請求/回應本文、權杖、Cookie 或密鑰。需要 `operator.read`。
    - `status` 會傳回 `/status` 風格的閘道摘要；敏感欄位只提供給具管理員範圍的操作者用戶端。
    - `gateway.identity.get` 會傳回轉送與配對流程使用的閘道裝置身分。
    - `system-presence` 會傳回已連線操作者/節點裝置的目前在線狀態快照。
    - `system-event` 會附加系統事件，並可更新/廣播在線狀態情境。
    - `last-heartbeat` 會傳回最新持久化的心跳偵測事件。
    - `set-heartbeats` 會切換閘道上的心跳偵測處理。

  </Accordion>

  <Accordion title="Models and usage">
    - `models.list` 會傳回執行階段允許的模型目錄。請參閱下方的「`models.list` 檢視」。
    - `usage.status` 會傳回供應商用量視窗/剩餘配額摘要。
    - `usage.cost` 會傳回日期範圍內的彙總成本用量摘要。傳入 `agentId` 可查詢單一代理，或傳入 `agentScope: "all"` 以彙總已設定的代理。
    - `doctor.memory.status` 會傳回目前預設代理工作區的向量記憶體 / 快取嵌入就緒狀態。只有在明確需要即時嵌入供應商 ping 時，才傳入 `{ "probe": true }` 或 `{ "deep": true }`。傳入 `{ "agentId": "agent-id" }` 可將夢境整理儲存區統計限定到單一代理工作區；省略時會彙總已設定的夢境整理工作區。
    - `doctor.memory.dreamDiary`、`doctor.memory.backfillDreamDiary`、`doctor.memory.resetDreamDiary`、`doctor.memory.resetGroundedShortTerm`、`doctor.memory.repairDreamingArtifacts` 和 `doctor.memory.dedupeDreamDiary` 接受選用的 `{ "agentId": "agent-id" }`；省略時會作用於已設定的預設代理工作區。
    - `doctor.memory.remHarness` 會為遠端控制平面用戶端傳回有界限、唯讀的 REM 測試工具預覽，包括工作區路徑、記憶體片段、算繪後的 grounded Markdown，以及深度提升候選項目。需要 `operator.read`。
    - `sessions.usage` 會傳回每個工作階段的用量摘要。傳入 `agentId` 可查詢單一代理，或傳入 `agentScope: "all"` 以一併列出已設定的代理。
    - `sessions.usage.timeseries` 會傳回單一工作階段的時間序列用量。
    - `sessions.usage.logs` 會傳回單一工作階段的用量記錄項目。

  </Accordion>

  <Accordion title="Channels and login helpers">
    - `channels.status` 會傳回內建 + bundled 頻道/外掛狀態摘要。
    - `channels.logout` 會登出頻道支援的特定頻道/帳號。
    - `web.login.start` 會為目前具 QR 能力的網頁頻道供應商啟動 QR/網頁登入流程。
    - `web.login.wait` 會等待該流程完成，並在成功時啟動頻道。
    - `push.test` 會向已註冊的 iOS 節點傳送測試 APNs 推播。
    - `voicewake.get` 會傳回已儲存的喚醒詞觸發器。
    - `voicewake.set` 會更新喚醒詞觸發器並廣播變更。

  </Accordion>

  <Accordion title="Messaging and logs">
    - `send` 是直接出站遞送 RPC，用於聊天執行器之外，針對頻道/帳號/對話串目標的傳送。
    - `logs.tail` 會傳回已設定的閘道檔案記錄尾端，並提供游標/限制與最大位元組控制。

  </Accordion>

  <Accordion title="Operator terminal">
    - `terminal.open` 會為明確的 `agentId` 或預設代理啟動主機 PTY，並傳回解析後的代理、工作目錄、shell 與限制狀態。
    - `terminal.input`、`terminal.resize` 和 `terminal.close` 只會作用於呼叫連線所擁有的工作階段。
    - `terminal.data` 和 `terminal.exit` 事件只會串流到擁有該工作階段的連線。
    - 連線中斷的工作階段會分離，而不是被終止：它們會在 `gateway.terminal.detachedSessionTimeoutSeconds` 期間保持可重新附加（預設 300；`0` 會恢復為中斷連線即終止），同時近期輸出會累積在有界限的伺服器端緩衝區中。
    - `terminal.list` 會傳回可附加的工作階段；`terminal.attach` 會將即時或已分離的工作階段重新繫結到呼叫連線，並傳回重播緩衝區（tmux 風格的接管，先前的即時擁有者會收到原因為 `detached` 的 `terminal.exit`）；`terminal.text` 會以純文字讀取緩衝區而不附加。
    - 每個終端機方法都需要 `operator.admin`；`gateway.terminal.enabled` 必須明確為 true。完全沙箱化的代理會被拒絕，且代理政策變更會關閉既有與進行中的 PTY，包括已分離者。

  </Accordion>

  <Accordion title="Talk and TTS">
    - `talk.catalog` 會傳回唯讀的 Talk 供應商目錄，涵蓋語音、串流轉錄與即時語音：標準供應商 ID、註冊表別名、標籤、設定狀態、選用的群組層級 `ready` 結果、公開的模型/聲音 ID、標準模式、傳輸、brain 策略，以及即時音訊/能力旗標，且不會傳回供應商密鑰或變更全域設定。目前的閘道會在套用執行階段供應商選擇後設定 `ready`；在較舊閘道上，若缺少該值，請視為尚未驗證。
    - `talk.config` 會傳回有效的 Talk 設定酬載；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.session.create` 會為 `realtime/gateway-relay`、`transcription/gateway-relay` 或 `stt-tts/managed-room` 建立閘道擁有的 Talk 工作階段。對於 `stt-tts/managed-room`，傳入 `sessionKey` 的 `operator.write` 呼叫者也必須傳入 `spawnedBy`，以提供限定範圍的工作階段金鑰可見性；未限定範圍的 `sessionKey` 建立與 `brain: "direct-tools"` 需要 `operator.admin`。
    - `talk.session.join` 會驗證受管房間工作階段權杖，視需要發出 `session.ready` 或 `session.replaced`，並傳回房間/工作階段中繼資料與近期 Talk 事件，絕不傳回明文權杖或其雜湊。
    - `talk.session.appendAudio` 會將 base64 PCM 輸入音訊附加到閘道擁有的即時轉送與轉錄工作階段。
    - `talk.session.startTurn`、`talk.session.endTurn` 和 `talk.session.cancelTurn` 會驅動受管房間回合生命週期，並在狀態清除前拒絕過期回合。
    - `talk.session.cancelOutput` 會停止助理音訊輸出，主要用於閘道轉送工作階段中由 VAD 控制的插話。
    - `talk.session.submitToolResult` 會完成閘道擁有的即時轉送工作階段所發出的供應商工具呼叫。當後續會有最終結果時，傳入 `options: { willContinue: true }` 以提供暫時工具輸出；或當工具結果應滿足供應商呼叫且不啟動另一個即時回應時，傳入 `options: { suppressResponse: true }`。
    - `talk.session.steer` 會將作用中執行的語音控制傳送到閘道擁有、由代理支援的 Talk 工作階段：`{ sessionId, text, mode? }`，其中 `mode` 為 `status`、`steer`、`cancel` 或 `followup`；省略的模式會從語音文字分類。
    - `talk.session.close` 會關閉閘道擁有的轉送、轉錄或受管房間工作階段，並發出終端 Talk 事件。
    - `talk.mode` 會為 WebChat/Control UI 用戶端設定/廣播目前的 Talk 模式狀態。
    - `talk.client.create` 會使用 `webrtc` 或 `provider-websocket` 建立用戶端擁有的即時供應商工作階段，同時由閘道擁有設定、憑證、指示與工具政策。
    - `talk.client.toolCall` 可讓用戶端擁有的即時傳輸將供應商工具呼叫轉送到閘道政策。第一個支援的工具是 `openclaw_agent_consult`；用戶端會取得執行 ID，並在提交供應商特定工具結果前等待一般聊天生命週期事件。
    - `talk.client.steer` 會為用戶端擁有的即時傳輸傳送作用中執行的語音控制。閘道會從 `sessionKey` 解析作用中的嵌入式執行，並傳回結構化的接受/拒絕結果，而不是默默丟棄 steering。
    - `talk.event` 是即時、轉錄、STT/TTS、受管房間、電話語音與會議配接器的單一 Talk 事件頻道。
    - `talk.speak` 會透過作用中的 Talk 語音供應商合成語音。
    - `tts.status` 會傳回 TTS 啟用狀態、作用中供應商、備援供應商與供應商設定狀態。
    - `tts.providers` 會傳回可見的 TTS 供應商清單。
    - `tts.enable` 和 `tts.disable` 會切換 TTS 偏好設定狀態。
    - `tts.setProvider` 會更新偏好的 TTS 供應商。
    - `tts.convert` 會執行一次性文字轉語音轉換。
    - `tts.speak`（`operator.write`）會使用已設定的一般 TTS 供應商鏈算繪非空的 `text`，並以 `audioBase64` 內嵌傳回一整段音訊片段，外加 `provider` 及選用的 `outputFormat`、`mimeType` 和 `fileExtension` 中繼資料。不同於 `tts.convert`，它不會傳回閘道本機路徑；不同於 `talk.speak`，它不需要 Talk 供應商。超過 `messages.tts.maxTextLength` 的文字會傳回 `INVALID_REQUEST`；合成失敗會傳回 `UNAVAILABLE`。

  </Accordion>

  <Accordion title="密鑰、設定、更新與精靈">
    - `secrets.reload` 會重新解析作用中的 SecretRefs，且只在完全成功時交換執行階段密鑰狀態。
    - `secrets.resolve` 會解析特定命令/目標集合的命令目標密鑰指派。
    - `config.get` 會傳回目前的設定快照與雜湊。
    - `config.set` 會寫入經驗證的設定承載資料。
    - `config.patch` 會合併部分設定更新。破壞性陣列替換需要在 `replacePaths` 中指定受影響的路徑；陣列項目下的巢狀陣列使用 `[]` 路徑，例如 `agents.list[].skills`。
    - `config.apply` 會驗證並替換完整設定承載資料。
    - `config.schema` 會傳回 Control UI 和命令列介面工具使用的即時設定綱要承載資料：綱要、`uiHints`、版本、產生中繼資料，以及可載入時的外掛與頻道綱要中繼資料。它包含與 UI 相同標籤/說明文字來源的 `title` / `description` 中繼資料，包括巢狀物件、萬用字元、陣列項目，以及在存在相符欄位文件時的 `anyOf` / `oneOf` / `allOf` 組合分支。
    - `config.schema.lookup` 會針對一個設定路徑傳回路徑範圍的查詢承載資料：標準化路徑、淺層綱要節點、相符提示 + `hintPath`、選用 `reloadKind`，以及供 UI/命令列介面向下鑽取的直接子項摘要。`reloadKind` 是 `restart`、`hot` 或 `none`（`src/config/schema.ts`）之一，並會映射所要求路徑的閘道設定重新載入規劃器。查詢綱要節點會保留面向使用者的文件與常見驗證欄位（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、數值/字串/陣列/物件邊界、`additionalProperties`、`deprecated`、`readOnly`、`writeOnly`）。子項摘要會公開 `key`、標準化 `path`、`type`、`required`、`hasChildren`、選用 `reloadKind`，以及相符的 `hint` / `hintPath`。
    - `update.run` 會執行閘道更新流程，並且只在更新成功時排程重新啟動；具有工作階段的呼叫端可以包含 `continuationMessage`，讓啟動時透過重新啟動延續佇列恢復一個後續代理回合。來自控制平面的套件管理員更新與受監督 git-checkout 更新，會使用分離式受管理服務交接，而不是在即時閘道內替換套件樹或變更 checkout/build 輸出。已開始的交接會傳回 `ok: true`，並帶有 `result.reason: "managed-service-handoff-started"` 和 `handoff.status: "started"`；不可用或失敗的交接會傳回 `ok: false`，並帶有 `managed-service-handoff-unavailable` 或 `managed-service-handoff-failed`，當需要手動 shell 更新時還會包含 `handoff.command`。不可用表示 OpenClaw 缺少安全的監督器邊界或持久服務身分，例如 systemd 的 `OPENCLAW_SYSTEMD_UNIT`。在已開始的交接期間，重新啟動哨兵可能會短暫回報 `stats.reason: "restart-health-pending"`；延續會延後到命令列介面驗證重新啟動後的閘道並寫入最終 `ok` 哨兵為止。
    - `update.status` 會重新整理並傳回最新的更新重新啟動哨兵，包括可用時重新啟動後執行中的版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 會透過 WS RPC 公開入門精靈。

  </Accordion>

  <Accordion title="代理與工作區輔助工具">
    - `agents.list` 會傳回已設定的代理項目，包括有效模型與執行階段中繼資料。
    - `agents.create`、`agents.update` 和 `agents.delete` 會管理代理記錄與工作區接線。
    - `agents.files.list`、`agents.files.get` 和 `agents.files.set` 會管理為代理公開的啟動工作區檔案。
    - `audit.list` 會傳回代理執行與工具動作事件的有界限、僅含中繼資料分類帳。
    - `agents.workspace.list` 和 `agents.workspace.get`（`operator.read`）會為 [操作者範圍](/zh-TW/gateway/operator-scopes) 中描述的可信任操作者網域內用戶端，公開代理工作區目錄的唯讀、分頁瀏覽。要求只接受相對於工作區的路徑；讀取會限制在 realpathed 工作區根目錄內（拒絕符號連結與硬連結逸出）、受大小上限限制，且限定為 UTF-8 文字加上常見影像類型（base64）。回應不會公開主機工作區路徑。此命名空間沒有寫入操作。
    - `tasks.list`、`tasks.get` 和 `tasks.cancel` 會向 SDK 與操作者用戶端公開閘道任務分類帳。請參閱下方的[任務分類帳 RPC](#task-ledger-rpcs)。
    - `artifacts.list`、`artifacts.get` 和 `artifacts.download` 會針對明確的 `sessionKey`、`runId` 或 `taskId` 範圍，公開由逐字稿衍生的成品摘要與下載。執行與任務查詢會在伺服器端解析擁有的工作階段，且只傳回來源相符的逐字稿媒體；不安全或本機 URL 來源會傳回不支援的下載，而不是在伺服器端擷取。
    - `environments.list` 和 `environments.status` 會為 SDK 用戶端公開唯讀的閘道本機與節點環境探索。
    - `agent.identity.get` 會傳回代理或工作階段的有效助理身分。
    - `agent.wait` 會等待執行完成，並在可用時傳回終端快照。

  </Accordion>

  <Accordion title="工作階段控制">
    - `sessions.list` 會傳回目前的工作階段索引，包括已設定代理執行階段後端時每列的 `agentRuntime` 中繼資料。
    - `sessions.subscribe` 和 `sessions.unsubscribe` 會為目前 WS 用戶端切換工作階段變更事件訂閱。
    - `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 會為一個工作階段切換逐字稿/訊息事件訂閱。
    - `sessions.preview` 會傳回特定工作階段鍵的有界限逐字稿預覽。
    - `sessions.describe` 會針對精確工作階段鍵傳回一列閘道工作階段。
    - `sessions.resolve` 會解析工作階段目標或將其正規化。
    - `sessions.create` 會建立新的工作階段項目。
    - `sessions.send` 會將訊息傳送到既有工作階段。
    - `sessions.steer` 是作用中工作階段的中斷並導向變體。
    - `sessions.abort` 會中止工作階段的作用中工作。傳入 `key` 加上選用 `runId`，或只傳入 `runId` 以處理閘道可解析至工作階段的作用中執行。
    - `sessions.patch` 會更新工作階段中繼資料/覆寫，並回報已解析的正規模型與有效 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 和 `sessions.compact` 會執行工作階段維護。
    - `sessions.get` 會傳回完整儲存的工作階段列。
    - 聊天執行仍使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。`chat.history` 會為 UI 用戶端進行顯示標準化：從可見文字中移除內嵌指令標籤、移除純文字工具呼叫 XML 承載資料（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和遭截斷的工具呼叫區塊）及洩漏的 ASCII/全形模型控制權杖、略過純靜默權杖助理列（完全符合 `NO_REPLY` / `no_reply`），且過大的列可替換為預留位置。
    - `chat.message.get` 是加法式、有界限的完整訊息讀取器，用於單一可見逐字稿項目。傳入 `sessionKey`、當工作階段選取以代理為範圍時的選用 `agentId`，以及先前透過 `chat.history` 顯示的逐字稿 `messageId`；當儲存項目仍可用且未超出大小時，閘道會傳回相同的顯示標準化投影，但沒有輕量歷史截斷上限。
    - `chat.send` 接受單回合 `fastMode: "auto"`，以便在自動截止前啟動的模型呼叫使用快速模式，然後在不使用快速模式的情況下啟動之後的重試、備援、工具結果或延續呼叫。截止預設為 60 秒（`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`），並可透過 `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` 依模型設定。`chat.send` 呼叫端可以傳入單回合 `fastAutoOnSeconds`，以覆寫該要求的截止。

  </Accordion>

  <Accordion title="裝置配對與裝置權杖">
    - `device.pair.list` 會傳回待處理與已核准的已配對裝置。
    - `device.pair.setupCode` 會建立行動裝置設定碼，且預設建立 PNG QR 資料 URL。它需要 `operator.admin`，並且刻意從公告探索中省略。結果包含 `setupCode`、選用 `qrDataUrl`、`gatewayUrl`、非密鑰的 `auth` 標籤，以及 `urlSource`。
    - `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 會管理裝置配對記錄。
    - `device.token.rotate` 會在其已核准角色與呼叫端範圍界限內輪替已配對裝置權杖。
    - `device.token.revoke` 會在其已核准角色與呼叫端範圍界限內撤銷已配對裝置權杖。

    設定碼會嵌入短效啟動認證。用戶端不得在配對流程之外
    記錄或保存它。

  </Accordion>

  <Accordion title="節點配對、叫用與待處理工作">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove` 和 `node.pair.verify` 涵蓋節點配對與啟動驗證。
    - `node.list` 和 `node.describe` 會傳回已知/已連線節點狀態。
    - `node.rename` 會更新已配對節點標籤。
    - `node.invoke` 會將命令轉送到已連線節點。
    - `node.invoke.result` 會傳回叫用要求的結果。
    - `node.event` 會將節點來源事件帶回閘道。
    - `node.pending.pull` 和 `node.pending.ack` 是已連線節點佇列 API。
    - `node.pending.enqueue` 和 `node.pending.drain` 會管理離線/中斷連線節點的持久待處理工作。

  </Accordion>

  <Accordion title="核准系列">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 涵蓋一次性 exec 核准要求，加上待處理核准查詢/重播。
    - `exec.approval.waitDecision` 會等待一個待處理 exec 核准，並傳回最終決策（逾時則為 `null`）。
    - `exec.approvals.get` 和 `exec.approvals.set` 會管理閘道 exec 核准政策快照。
    - `exec.approvals.node.get` 和 `exec.approvals.node.set` 會透過節點轉送命令管理節點本機 exec 核准政策。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 涵蓋外掛定義的核准流程。

  </Accordion>

  <Accordion title="自動化、Skills 與工具">
    - 自動化：`wake` 會排程立即或下一次心跳偵測的喚醒文字注入；`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 會管理排程工作。
    - `cron.run` 仍是用於手動執行的入列式 RPC。需要完成語意的用戶端應讀取傳回的 `runId` 並輪詢 `cron.runs`。
    - `cron.runs` 接受選用的非空 `runId` 篩選器，讓用戶端可以追蹤一個已排入佇列的手動執行，而不會與同一作業的其他歷史項目競爭。
    - Skills 與工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。請參閱下方的[操作者輔助方法](#operator-helper-methods)。

  </Accordion>
</AccordionGroup>

### 常見事件系列

- `chat`：UI 聊天更新，例如 `chat.inject` 和其他僅限逐字稿的聊天事件。在通訊協定 v4 中，差異酬載會帶有 `deltaText`；`message` 仍然是累積的助理快照。非前綴替換會設定 `replace=true`，並使用 `deltaText` 作為替換文字。
- `session.message`、`session.operation`、`session.tool`：已訂閱工作階段的逐字稿、進行中的工作階段操作，以及事件串流更新。
- `sessions.changed`：工作階段索引或中繼資料已變更。
- `presence`：系統存在狀態快照更新。
- `tick`：週期性保活／存活事件。
- `health`：閘道健康狀態快照更新。
- `heartbeat`：心跳偵測事件串流更新。
- `cron`：排程執行／工作變更事件。
- `shutdown`：閘道關閉通知。
- `node.pair.requested` / `node.pair.resolved`：節點配對生命週期。
- `node.invoke.request`：節點叫用請求廣播。
- `device.pair.requested` / `device.pair.resolved`：已配對裝置生命週期。
- `voicewake.changed`：喚醒詞觸發設定已變更。
- `exec.approval.requested` / `exec.approval.resolved`：執行核准生命週期。
- `plugin.approval.requested` / `plugin.approval.resolved`：外掛核准生命週期。

### 節點輔助方法

節點可以呼叫 `skills.bins`，擷取目前的技能可執行檔清單，以進行自動允許檢查。

## 稽核帳本 RPC

`audit.list` 會為操作者用戶端提供穩定、最新優先的代理執行與工具動作中繼資料檢視。它需要 `operator.read`。查詢會排除超過 30 天的記錄，且共用 SQLite 帳本上限為 100,000 筆記錄。過期資料列會在閘道啟動、每小時維護，以及後續寫入時刪除。

- 參數：選用的精確 `agentId`、`sessionKey` 或 `runId`；選用的 `kind`（`"agent_run"` 或 `"tool_action"`）；選用的 `status`（`"started"`、`"succeeded"`、`"failed"`、`"cancelled"`、`"timed_out"`、`"blocked"` 或 `"unknown"`）；選用的包含端點 `after` / `before` Unix 毫秒界線；選用的 `limit`，範圍從 `1` 到 `500`；以及來自前一頁的選用字串 `cursor`。
- 結果：`{ "events": AuditEvent[], "nextCursor"?: string }`。

每個事件都包含穩定的事件 ID、單調遞增的帳本序號、來源事件序號、時間戳記、執行者、代理／工作階段／執行來源、動作、狀態，以及適用時的正規化錯誤碼。工具事件可能包含工具呼叫 ID 和工具名稱。`redaction` 欄位一律為 `"metadata_only"`：帳本不會儲存提示、訊息、工具引數、工具結果、命令輸出或原始錯誤文字。

記錄預設為開啟，並由 [`audit.enabled`](/zh-TW/gateway/configuration-reference#audit) 控制；停用時，`audit.list` 會持續提供先前寫入的記錄，直到它們過期。

使用 [`openclaw audit`](/cli/audit) 進行文字查詢和有界 JSON 匯出。

## 工作帳本 RPC

操作者用戶端透過工作帳本 RPC（`packages/gateway-protocol/src/schema/tasks.ts`）檢查並取消閘道背景工作記錄。這些 RPC 會傳回經過清理的工作摘要，而不是原始執行階段狀態。

- `tasks.list` 需要 `operator.read`。
  - 參數：選用的 `status`（`"queued"`、`"running"`、`"completed"`、`"failed"`、`"cancelled"` 或 `"timed_out"`）或這些狀態的陣列、選用的 `agentId`、選用的 `sessionKey`、選用的 `limit`，範圍從 `1` 到 `500`，以及選用字串 `cursor`。
  - 結果：`{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` 需要 `operator.read`。
  - 參數：`{ "taskId": string }`。
  - 結果：`{ "task": TaskSummary }`。
  - 缺少的工作 ID 會傳回閘道找不到項目的錯誤形狀。
- `tasks.cancel` 需要 `operator.write`。
  - 參數：`{ "taskId": string, "reason"?: string }`。
  - 結果：`{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` 回報帳本是否有相符的工作。`cancelled` 回報執行階段是否接受或記錄了取消。

`TaskSummary` 包含 `id`、`status`，以及選用中繼資料：`kind`、`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、時間戳記、進度、終端摘要，以及經過清理的錯誤文字。`agentId` 識別正在執行工作的代理；`sessionKey` 和 `ownerKey` 保留請求者與控制內容。

## 操作者輔助方法

- `commands.list`（`operator.read`）會擷取代理的執行階段命令清單。
  - `agentId` 為選用；省略它可讀取預設代理工作區。
  - `scope` 控制主要 `name` 目標的介面：`text` 會傳回不含前置 `/` 的主要文字命令權杖；`native` 和預設的 `both` 路徑會在可用時傳回具提供者感知能力的原生命稱。
  - `textAliases` 帶有精確的斜線別名，例如 `/model` 和 `/m`。
  - `nativeName` 會在存在時帶有具提供者感知能力的原生命令名稱。
  - `provider` 為選用，且只會影響原生命名以及原生外掛命令可用性。
  - `includeArgs=false` 會從回應中省略序列化的引數中繼資料。
- `tools.catalog`（`operator.read`）會擷取代理的執行階段工具目錄。回應包含分組工具和來源中繼資料：
  - `source`：`core` 或 `plugin`
  - `pluginId`：當 `source="plugin"` 時的外掛擁有者
  - `optional`：外掛工具是否為選用
- `tools.effective`（`operator.read`）會擷取工作階段的執行階段有效工具清單。
  - `sessionKey` 為必要。
  - 閘道會從伺服器端工作階段推導可信的執行階段內容，而不是接受呼叫端提供的驗證或傳遞內容。
  - 回應是工作階段範圍、由伺服器推導的作用中清單投影，包含核心、外掛、通道，以及已探索的 MCP 伺服器工具。
  - `tools.effective` 對 MCP 是唯讀的：它可以透過最終工具政策投影已暖機工作階段的 MCP 目錄，但不會建立 MCP 執行階段、連接傳輸，或發出 `tools/list`。如果不存在相符的已暖機目錄，回應可能包含通知，例如 `mcp-not-yet-connected`、`mcp-not-yet-listed` 或 `mcp-stale-catalog`。
  - 有效工具項目會使用 `source="core"`、`source="plugin"`、`source="channel"` 或 `source="mcp"`。
- `tools.invoke`（`operator.write`）會透過與 `/tools/invoke` 相同的閘道政策路徑叫用一個可用工具。
  - `name` 為必要。`args`、`sessionKey`、`agentId`、`confirm` 和 `idempotencyKey` 為選用。
  - 如果同時存在 `sessionKey` 和 `agentId`，解析出的工作階段代理必須符合 `agentId`。
  - 僅限擁有者的核心包裝器，例如 `cron`、`gateway` 和 `nodes`，需要擁有者／管理員身分（`operator.admin`），即使 `tools.invoke` 本身是 `operator.write`。
  - 回應是面向 SDK 的封套，包含 `ok`、`toolName`、選用的 `output`，以及具型別的 `error` 欄位。核准或政策拒絕會在酬載中傳回 `ok:false`，而不是繞過閘道工具政策管線。
- `skills.status`（`operator.read`）會擷取代理的可見技能清單。
  - `agentId` 為選用；省略它可讀取預設代理工作區。
  - 回應包含資格、缺少的需求、設定檢查，以及經過清理的安裝選項，而不會暴露原始密鑰值。
- `skills.search` 和 `skills.detail`（`operator.read`）會傳回 ClawHub 探索中繼資料。
- `skills.upload.begin`、`skills.upload.chunk` 和 `skills.upload.commit`（`operator.admin`）會在安裝前暫存私人技能封存檔。這是供可信用戶端使用的獨立管理員上傳路徑，不是一般 ClawHub 技能安裝流程，且預設停用，除非啟用 `skills.install.allowUploadedArchives`。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` 會建立繫結到該 slug 和 force 值的上傳。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` 會在精確的解碼偏移處附加位元組。
  - `skills.upload.commit({ uploadId, sha256? })` 會驗證最終大小和 SHA-256。提交只會完成上傳；它不會安裝技能。
  - 已上傳的技能封存檔是包含 `SKILL.md` 根目錄的 zip 封存檔。封存檔的內部目錄名稱永遠不會選擇安裝目標。
- `skills.install`（`operator.admin`）有三種模式：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 會將技能資料夾安裝到預設代理工作區的 `skills/` 目錄。
  - 上傳模式：`{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` 會將已提交的上傳安裝到預設代理工作區的 `skills/<slug>` 目錄。slug 和 force 值必須符合原始 `skills.upload.begin` 請求。除非啟用 `skills.install.allowUploadedArchives`，否則會被拒絕；該設定不會影響 ClawHub 安裝。
  - 閘道安裝器模式：`{ name, installId, timeoutMs? }` 會在閘道主機上執行宣告的 `metadata.openclaw.install` 動作。較舊的用戶端仍可能傳送 `dangerouslyForceUnsafeInstall`；此欄位已棄用，僅為通訊協定相容性而接受，且會被忽略。請使用 `security.installPolicy` 進行操作者擁有的安裝決策。
- `skills.update`（`operator.admin`）有兩種模式：
  - ClawHub 模式會更新一個追蹤的 slug，或預設代理工作區中的所有追蹤 ClawHub 安裝。
  - 設定模式會修補 `skills.entries.<skillKey>` 值，例如 `enabled`、`apiKey` 和 `env`。

### `models.list` 檢視

`models.list` 接受選用的 `view` 參數（`src/agents/model-catalog-visibility.ts`）：

- 省略或 `"default"`：如果已設定 `agents.defaults.models`，回應會是允許的目錄，包含為 `provider/*` 項目動態探索的模型。否則回應會是完整閘道目錄。
- `"configured"`：適合挑選器大小的行為。如果已設定 `agents.defaults.models`，它仍然優先，包含 `provider/*` 項目的提供者範圍探索。沒有允許清單時，回應會使用明確的 `models.providers.<provider>.models` 項目，只有在沒有任何已設定模型資料列時才退回完整目錄。
- `"all"`：完整閘道目錄，繞過 `agents.defaults.models`。用於診斷／探索 UI，而不是一般模型挑選器。

## 執行核准

- 當執行請求需要核准時，閘道會廣播 `exec.approval.requested`。
- 操作者用戶端透過呼叫 `exec.approval.resolve` 來解析（需要 `operator.approvals`）。
- 對於 `host=node`，`exec.approval.request` 必須包含 `systemRunPlan`（規範的 `argv`/`cwd`/`rawCommand`/工作階段中繼資料）。缺少 `systemRunPlan` 的請求會被拒絕。
- 核准後，轉送的 `node.invoke system.run` 呼叫會重用該規範的 `systemRunPlan`，作為權威命令／cwd／工作階段內容。
- 如果呼叫端在準備和最終核准的 `system.run` 轉送之間變更 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，閘道會拒絕該執行，而不是信任變更後的酬載。

## 代理傳遞後援

- `agent` 請求可以包含 `deliver=true` 以請求對外傳遞。
- `bestEffortDeliver=false`（預設）會維持嚴格行為：無法解析或僅限內部的傳遞目標會傳回 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允許在無法解析外部可傳遞路由時退回僅工作階段執行（例如內部／網頁聊天工作階段或模糊的多通道設定）。
- 最終 `agent` 結果在請求傳遞時可能包含 `result.deliveryStatus`，使用與 [`openclaw agent --json --deliver`](/zh-TW/cli/agent#json-delivery-status) 所記錄相同的 `sent`、`suppressed`、`partial_failed` 和 `failed` 狀態。

## 版本控管

- `PROTOCOL_VERSION`、`MIN_CLIENT_PROTOCOL_VERSION`、
  `MIN_NODE_PROTOCOL_VERSION` 和 `MIN_PROBE_PROTOCOL_VERSION` 位於
  `packages/gateway-protocol/src/version.ts`。
- 用戶端會傳送 `minProtocol` + `maxProtocol`。操作者與 UI 用戶端必須
  在該範圍中包含目前協定；目前的用戶端與伺服器執行
  protocol v4。
- 同時具備 `role: "node"` 與 `client.mode: "node"` 的已驗證用戶端
  可以使用 N-1 節點協定（目前為 v3）。輕量重新啟動探測會使用
  相同的 N-1 視窗。裝置驗證、配對、範圍、命令政策與執行核准
  不會因這個相容性視窗而改變。外掛擁有的節點
  功能與命令會保留不提供，直到該節點升級到目前
  協定，因為其託管介面不屬於 N-1 合約。
- Schema 與模型由 TypeBox 定義產生：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 用戶端常數

參考用戶端實作位於 `packages/gateway-client/src/`
（OpenClaw 透過薄層 `src/gateway/client.ts` facade 包裝它）。這些
預設值在 protocol v4 中保持穩定，並且是第三方用戶端的預期基準。

| 常數                                      | 預設值                                                | 來源                                                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| 請求逾時（每個 RPC）                      | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                              |
| 預先驗證 / 連線挑戰逾時                  | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts`（`OPENCLAW_HANDSHAKE_TIMEOUT_MS` env 可提高配對的伺服器/用戶端預算）            |
| 初始重新連線退避                          | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`backoffMs`)                                                                     |
| 最大重新連線退避                          | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`scheduleReconnect`)                                                             |
| 裝置權杖關閉後的快速重試上限              | `250` ms                                              | `packages/gateway-client/src/client.ts`                                                                                   |
| `terminate()` 前的強制停止寬限            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| `stopAndWait()` 預設逾時                  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| 預設 tick 間隔（`hello-ok` 前）           | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| tick 逾時關閉                             | 靜默超過 `tickIntervalMs * 2` 時使用 code `4000`      | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

伺服器會在 `hello-ok` 中公告有效的 `policy.tickIntervalMs`、
`policy.maxPayload` 和 `policy.maxBufferedBytes`；用戶端
應遵循這些值，而不是握手前的預設值。

## 驗證

- 共享密鑰閘道驗證會使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，取決於設定的
  `gateway.auth.mode`（`"none" | "token" | "password" | "trusted-proxy"`）。
- 帶有身分的模式，例如 Tailscale Serve（`gateway.auth.allowTailscale: true`）
  或非 loopback 的 `gateway.auth.mode: "trusted-proxy"`，會從請求標頭
  滿足連線驗證檢查，而不是使用 `connect.params.auth.*`。
- 私有入口的 `gateway.auth.mode: "none"` 會完全略過共享密鑰連線驗證；
  請勿在公開/不受信任的入口公開該模式。
- 配對後，閘道會發出限定於連線
  角色 + 範圍的裝置權杖，並在 `hello-ok.auth.deviceToken` 中傳回。用戶端應
  在任何成功連線後保存它。
- 使用該已儲存的裝置權杖重新連線時，也應重用針對該權杖所儲存的
  已核准範圍集。這會保留已授予的讀取/探測/狀態存取權，
  並避免重新連線悄悄縮減為較窄的隱含僅管理員範圍。
- 用戶端連線驗證組裝（`packages/gateway-client/src/client.ts` 中的
  `selectConnectAuth`）：
  - `auth.password` 是正交的，設定時一律轉送。
  - `auth.token` 依優先順序填入：明確共享權杖優先，
    接著是明確的 `deviceToken`，再來是已儲存的逐裝置權杖（以
    `deviceId` + `role` 為鍵）。
  - `auth.bootstrapToken` 只會在上述項目都未解析出
    `auth.token` 時傳送。共享權杖或任何已解析的裝置權杖會抑制它。
  - 在一次性的
    `AUTH_TOKEN_MISMATCH` 重試中自動提升已儲存裝置權杖，僅限受信任端點：loopback，
    或具有釘選 `tlsFingerprint` 的 `wss://`。未釘選的公開 `wss://`
    不符合資格。
- 內建設定碼 bootstrap 會傳回主要節點
  `hello-ok.auth.deviceToken`，以及在
  `hello-ok.auth.deviceTokens` 中供受信任行動交接使用的有界操作者權杖。該操作者權杖
  包含 `operator.talk.secrets` 以讀取原生 Talk 設定，但
  排除配對變更範圍與 `operator.admin`。
- 當非基準設定碼 bootstrap 等待核准時，
  `PAIRING_REQUIRED` 詳細資料會包含 `recommendedNextStep: "wait_then_retry"`、
  `retryable: true` 和 `pauseReconnect: false`。請使用
  相同的 bootstrap 權杖持續重新連線，直到請求獲准或權杖變成
  無效。
- 只有在連線於受信任傳輸（例如 `wss://` 或 loopback/local 配對）上使用 bootstrap
  驗證時，才保存 `hello-ok.auth.deviceTokens`。
- 如果用戶端提供明確的 `deviceToken` 或明確的 `scopes`，該
  呼叫者要求的範圍集仍具權威性；快取的範圍只會在
  用戶端重用已儲存的逐裝置權杖時才重用。
- 裝置權杖可透過 `device.token.rotate` 和
  `device.token.revoke` 輪替/撤銷（需要 `operator.pairing`）。輪替或撤銷
  節點或其他非操作者角色也需要 `operator.admin`。
- `device.token.rotate` 會傳回輪替中繼資料。它只會針對已使用該
  裝置權杖驗證的同裝置呼叫回傳替換的 bearer 權杖，因此僅權杖用戶端可在
  重新連線前保存其替換權杖。共享/管理員輪替不會回傳 bearer 權杖。
- 權杖發行、輪替與撤銷會限制在該裝置配對項目中記錄的已核准角色
  集合內；權杖變更不能擴展或指定配對核准從未授予的裝置角色。
- 對於已配對裝置權杖工作階段，除非呼叫者也有 `operator.admin`，
  否則裝置管理為自我範圍限定：非管理員呼叫者只能管理其自身裝置項目的
  操作者權杖。節點與其他非操作者權杖
  管理僅限管理員，即使是呼叫者自己的裝置也一樣。
- `device.token.rotate` 和 `device.token.revoke` 也會檢查目標
  操作者權杖範圍集是否符合呼叫者目前的工作階段範圍。
  非管理員呼叫者不能輪替或撤銷比自己已持有範圍更廣的操作者權杖。
- 驗證失敗會包含 `error.details.code` 以及復原提示：
  - `error.details.canRetryWithDeviceToken`（boolean）
  - `error.details.recommendedNextStep`：下列之一：`retry_with_device_token`、
    `update_auth_configuration`、`update_auth_credentials`、
    `wait_then_retry`、`review_auth_configuration`
    (`packages/gateway-protocol/src/connect-error-details.ts`)。
- `AUTH_TOKEN_MISMATCH` 的用戶端行為：
  - 受信任用戶端可以嘗試使用快取的逐裝置
    權杖進行一次有界重試。
  - 如果該重試失敗，請停止自動重新連線迴圈，並顯示操作者
    操作指引。
- `AUTH_SCOPE_MISMATCH` 表示裝置權杖已被辨識，但未
  涵蓋要求的角色/範圍。不要將此呈現為錯誤權杖；請提示
  操作者重新配對，或核准較窄/較廣的範圍合約。

## 裝置身分與配對

- 節點應包含從
  金鑰組指紋衍生的穩定裝置身分（`device.id`）。
- 閘道會依每個裝置 + 角色發行權杖。
- 除非啟用本機
  自動核准，否則新的裝置 ID 需要配對核准。
- 配對自動核准以直接 local loopback 連線為核心。
- OpenClaw 也有一條狹窄的後端/容器本機自我連線路徑，用於
  受信任的共享密鑰輔助流程。
- 同主機 tailnet 或 LAN 連線仍會被視為遠端配對，
  並需要核准。
- WS 用戶端通常會在 `connect` 期間包含 `device` 身分（操作者 +
  節點）。唯一不含裝置的操作者例外是明確信任路徑：
  - `gateway.controlUi.allowInsecureAuth=true`，用於僅 localhost 的不安全
    HTTP 相容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` 操作者 Control UI 驗證。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（break-glass，嚴重
    安全性降級）。
  - 保留內部
    輔助路徑上的 direct-loopback `gateway-client` 後端 RPC。
- 省略裝置身分會造成範圍後果。當不含裝置的
  操作者連線透過明確信任路徑獲准時，OpenClaw
  仍會將自我宣告的範圍清空為空集合，除非該路徑有
  具名的範圍保留例外。範圍控管的方法接著會因
  `missing scope` 而失敗。
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` 是 Control UI
  break-glass 範圍保留路徑。它不會授予任意
  自訂後端或 CLI 形態 WebSocket 用戶端範圍。
- 保留的 direct-loopback `gateway-client` 後端輔助路徑只會為
  內部本機控制平面 RPC 保留範圍；自訂後端 ID
  不會收到此例外。
- 所有連線都必須簽署伺服器提供的 `connect.challenge` nonce。

### 裝置驗證遷移診斷

對於仍使用挑戰前簽署行為的舊版用戶端，`connect`
會在 `error.details.code` 下傳回 `DEVICE_AUTH_*` 詳細代碼，並帶有穩定的
`error.details.reason`。

常見遷移失敗：

| 訊息                        | details.code                     | details.reason           | 含義                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 用戶端省略了 `device.nonce`（或傳送空白值）。      |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 用戶端使用過期/錯誤的 nonce 進行簽署。            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 簽章酬載與 v2 酬載不相符。                        |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 已簽署的時間戳記超出允許的偏移範圍。              |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 與公開金鑰指紋不相符。                |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開金鑰格式/正規化失敗。                         |

遷移目標：

- 一律等待 `connect.challenge`。
- 簽署包含伺服器 nonce 的 v2 酬載。
- 在 `connect.params.device.nonce` 中傳送相同的 nonce。
- 偏好的簽章酬載為 `v3`
  （位於 `packages/gateway-client/src/device-auth.ts` 的 `buildDeviceAuthPayloadV3`），
  除了 device/client/role/scopes/token/nonce 欄位外，
  也會繫結 `platform` 和 `deviceFamily`。
- 舊版 `v2` 簽章仍會為了相容性而被接受，但配對裝置
  中繼資料釘選仍會控制重新連線時的命令政策。

## TLS 與釘選

- WS 連線支援 TLS（`gateway.tls` 設定）。
- 用戶端可選擇透過
  `gateway.remote.tlsFingerprint` 或命令列介面 `--tls-fingerprint` 釘選閘道憑證指紋。

## 範圍

此協定公開完整的閘道 API：狀態、頻道、模型、聊天、
代理、工作階段、節點、核准等。確切介面由
從 `packages/gateway-protocol/src/schema.ts` 重新匯出的 TypeBox 結構描述定義。

## 相關

- [橋接協定](/zh-TW/gateway/bridge-protocol)
- [閘道執行手冊](/zh-TW/gateway)
