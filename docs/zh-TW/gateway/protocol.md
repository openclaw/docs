---
read_when:
    - 實作或更新閘道 WS 用戶端
    - 偵錯協定不相符或連線失敗
    - 重新產生協定結構描述/模型
summary: 閘道 WebSocket 協定：交握、訊框、版本控制
title: 閘道協定
x-i18n:
    generated_at: "2026-07-05T01:57:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed4f3faff8575be8a4d11c2a1b20421dab961391935e5adc8e9f1c9ceb5fec61
    source_path: gateway/protocol.md
    workflow: 16
---

閘道 WS 協定是 OpenClaw 的**單一控制平面 + 節點傳輸**。所有用戶端（命令列介面、網頁 UI、macOS 應用程式、iOS/Android 節點、無頭節點）都透過 WebSocket 連線，並在握手時宣告其**角色** + **範圍**。

## 傳輸

- WebSocket，帶有 JSON 承載資料的文字訊框。
- 第一個訊框**必須**是 `connect` 請求。
- 連線前訊框上限為 64 KiB。成功握手後，用戶端應遵循 `hello-ok.policy.maxPayload` 和 `hello-ok.policy.maxBufferedBytes` 限制。啟用診斷時，過大的傳入訊框和緩慢的傳出緩衝區會在閘道關閉或丟棄受影響的訊框之前發出 `payload.large` 事件。這些事件會保留大小、限制、介面和安全原因代碼。它們不會保留訊息本文、附件內容、原始訊框本文、權杖、Cookie 或密鑰值。

## 握手（connect）

閘道 → 用戶端（連線前挑戰）：

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

用戶端 → 閘道：

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
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

閘道 → 用戶端：

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

當閘道仍在完成啟動 sidecar 時，`connect` 請求可能會傳回可重試的 `UNAVAILABLE` 錯誤，並將 `details.reason` 設為 `"startup-sidecars"`，以及 `retryAfterMs`。用戶端應在整體連線預算內重試該回應，而不是將其顯示為終止性的握手失敗。

`server`、`features`、`snapshot` 和 `policy` 都是結構描述（`packages/gateway-protocol/src/schema/frames.ts`）要求的欄位。`auth` 也是必填欄位，並回報協商後的角色/範圍。`pluginSurfaceUrls` 是選填欄位，會將外掛介面名稱（例如 `canvas`）對應到具範圍的託管 URL。

具範圍的外掛介面 URL 可能會過期。節點可以使用 `{ "surface": "canvas" }` 呼叫 `node.pluginSurface.refresh`，以在 `pluginSurfaceUrls` 中接收新的項目。實驗性的 Canvas 外掛重構不支援已淘汰的 `canvasHostUrl`、`canvasCapability` 或 `node.canvas.capability.refresh` 相容性路徑；目前的原生用戶端和閘道必須使用外掛介面。

未核發裝置權杖時，`hello-ok.auth` 會回報協商後的權限，不含權杖欄位：

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

受信任的同處理程序後端用戶端（`client.id: "gateway-client"`、`client.mode: "backend"`）在使用共用閘道權杖/密碼驗證的直接 loopback 連線上，可以省略 `device`。此路徑保留給內部控制平面 RPC，並避免過時的命令列介面/裝置配對基準阻擋本機後端工作，例如子代理工作階段更新。遠端用戶端、瀏覽器來源用戶端、節點用戶端，以及明確使用裝置權杖/裝置身分的用戶端，仍使用一般配對和範圍升級檢查。

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

內建 QR/設定碼啟動流程是一條新的行動交接路徑。成功的基準設定碼連線會傳回一個主要節點權杖，以及一個有界的操作者權杖：

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

操作者交接是刻意限制範圍的，讓 QR 入門流程可以啟動行動操作者迴圈並完成原生設定，而不授予配對變更範圍或 `operator.admin`。它包含 `operator.talk.secrets`，讓原生用戶端可在啟動後讀取所需的 Talk 設定。更廣泛的配對和管理員存取需要另一個已核准的操作者配對或權杖流程。只有在連線使用受信任傳輸上的啟動驗證時，例如 `wss://` 或 loopback/本機配對，用戶端才應保存 `hello-ok.auth.deviceTokens`。

### 節點範例

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
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

## 訊框格式

- **請求**：`{type:"req", id, method, params}`
- **回應**：`{type:"res", id, ok, payload|error}`
- **事件**：`{type:"event", event, payload, seq?, stateVersion?}`

會造成副作用的方法需要**冪等鍵**（請參閱結構描述）。

## 角色 + 範圍

如需完整的操作者範圍模型、核准時檢查和共用密鑰語意，請參閱[操作者範圍](/zh-TW/gateway/operator-scopes)。

### 角色

- `operator` = 控制平面用戶端（命令列介面/UI/自動化）。
- `node` = 能力主機（相機/螢幕/canvas/system.run）。

### 範圍（操作者）

常見範圍：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

使用 `includeSecrets: true` 的 `talk.config` 需要 `operator.talk.secrets`（或 `operator.admin`）。包含密鑰時，用戶端應從 `talk.resolved.config.apiKey` 讀取作用中的 Talk 供應商認證；`talk.providers.<id>.apiKey` 會維持來源形狀，可能是 SecretRef 物件或已遮蔽的字串。

外掛註冊的閘道 RPC 方法可以要求自己的操作者範圍，但保留的核心管理前綴（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）一律解析為 `operator.admin`。

方法範圍只是第一道閘門。某些透過 `chat.send` 進入的斜線命令，會在其上套用更嚴格的命令層級檢查。例如，持久性的 `/config set` 和 `/config unset` 寫入需要 `operator.admin`。

`node.pair.approve` 除了基礎方法範圍之外，也有額外的核准時範圍檢查：

- 無命令請求：`operator.pairing`
- 帶有非 exec 節點命令的請求：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的請求：
  `operator.pairing` + `operator.admin`

### 能力/命令/權限（節點）

節點會在連線時宣告能力聲明：

- `caps`：高階能力類別，例如 `camera`、`canvas`、`screen`、`location`、`voice` 和 `talk`。
- `commands`：用於叫用的命令允許清單。
- `permissions`：細粒度切換（例如 `screen.record`、`camera.capture`）。

閘道會將這些視為**聲明**，並強制執行伺服器端允許清單。

## 在線狀態

- `system-presence` 會傳回以裝置身分為鍵的項目。
- 在線狀態項目包含 `deviceId`、`roles` 和 `scopes`，因此即使裝置同時以**操作者**和**節點**連線，UI 也可以為每個裝置顯示單一列。
- `node.list` 包含選填的 `lastSeenAtMs` 和 `lastSeenReason` 欄位。已連線的節點會以原因 `connect` 將目前連線時間回報為 `lastSeenAtMs`；當受信任的節點事件更新其配對中繼資料時，已配對的節點也可以回報持久的背景在線狀態。

### 節點背景存活事件

節點可以使用 `event: "node.presence.alive"` 呼叫 `node.event`，以記錄已配對節點在背景喚醒期間仍存活，但不將其標記為已連線。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是封閉列舉：`background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual` 或 `connect`。未知的 trigger 字串會在保存前由閘道正規化為 `background`。此事件僅對已驗證的節點裝置工作階段具有持久性；沒有裝置或未配對的工作階段會傳回 `handled: false`。

成功的閘道會傳回結構化結果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

較舊的閘道可能仍會針對 `node.event` 傳回 `{ "ok": true }`；用戶端應將其視為已確認的 RPC，而非持久在線狀態保存。

## 廣播事件範圍設定

伺服器推送的 WebSocket 廣播事件會依範圍設閘，使配對範圍或僅節點工作階段不會被動接收工作階段內容。

- **聊天、代理和工具結果訊框**（包括串流的 `agent` 事件和工具呼叫結果）至少需要 `operator.read`。沒有 `operator.read` 的工作階段會完全跳過這些訊框。
- **外掛定義的 `plugin.*` 廣播**會依外掛註冊方式，由 `operator.write` 或 `operator.admin` 設閘。
- **狀態和傳輸事件**（`heartbeat`、`presence`、`tick`、連線/中斷連線生命週期等）維持不受限制，讓每個已驗證工作階段都能觀察傳輸健康狀態。
- **未知的廣播事件系列**預設會依範圍設閘（失敗關閉），除非已註冊的處理常式明確放寬限制。

每個用戶端連線都保有自己的每用戶端序號，因此即使不同用戶端看到事件串流中不同的範圍篩選子集，廣播仍會在該 socket 上維持單調排序。

## 常見 RPC 方法系列

公開 WS 介面比上方的握手/驗證範例更廣。這不是產生出的傾印 — `hello-ok.features.methods` 是從 `src/gateway/server-methods-list.ts` 加上已載入的外掛/頻道方法匯出所建立的保守探索清單。請將其視為功能探索，而不是 `src/gateway/server-methods/*.ts` 的完整列舉。

  <AccordionGroup>
  <Accordion title="系統與身分">
    - `health` 會傳回快取或新探測的閘道健康狀態快照。
    - `diagnostics.stability` 會傳回最近的有界診斷穩定性記錄器。它保留事件名稱、計數、位元組大小、記憶體讀數、佇列/工作階段狀態、頻道/外掛名稱，以及工作階段 ID 等操作中繼資料。它不保留聊天文字、網路鉤子本文、工具輸出、原始請求或回應本文、權杖、Cookie 或祕密值。需要操作者讀取範圍。
    - `status` 會傳回 `/status` 樣式的閘道摘要；敏感欄位只會包含在具管理員範圍的操作者用戶端中。
    - `gateway.identity.get` 會傳回轉送與配對流程使用的閘道裝置身分。
    - `system-presence` 會傳回已連線操作者/節點裝置的目前上線狀態快照。
    - `system-event` 會附加系統事件，並可更新/廣播上線狀態脈絡。
    - `last-heartbeat` 會傳回最新的已持久化心跳偵測事件。
    - `set-heartbeats` 會切換閘道上的心跳偵測處理。

  </Accordion>

  <Accordion title="模型與使用量">
    - `models.list` 會傳回執行階段允許的模型目錄。傳入 `{ "view": "configured" }` 可取得適合選擇器大小的已設定模型（先是 `agents.defaults.models`，再是 `models.providers.*.models`），或傳入 `{ "view": "all" }` 可取得完整目錄。
    - `usage.status` 會傳回供應商使用量時段/剩餘配額摘要。
    - `usage.cost` 會傳回日期範圍內的彙總成本使用量摘要。
      傳入 `agentId` 可指定單一代理，或傳入 `agentScope: "all"` 可彙總已設定的代理。
    - `doctor.memory.status` 會傳回作用中預設代理工作區的向量記憶 / 快取嵌入就緒狀態。只有在呼叫端明確需要即時嵌入供應商 ping 時，才傳入 `{ "probe": true }` 或 `{ "deep": true }`。具備夢境整理感知能力的用戶端也可以傳入 `{ "agentId": "agent-id" }`，將夢境整理儲存區統計限定在所選代理工作區；省略 `agentId` 會保留預設代理後援，並彙總已設定的夢境整理工作區。
    - `doctor.memory.dreamDiary`、`doctor.memory.backfillDreamDiary`、`doctor.memory.resetDreamDiary`、`doctor.memory.resetGroundedShortTerm`、`doctor.memory.repairDreamingArtifacts` 和 `doctor.memory.dedupeDreamDiary` 接受可選的 `{ "agentId": "agent-id" }` 參數，用於所選代理的夢境整理檢視/動作。省略 `agentId` 時，它們會在已設定的預設代理工作區上運作。
    - `doctor.memory.remHarness` 會為遠端控制平面用戶端傳回有界、唯讀的 REM 控制器預覽。它可能包含工作區路徑、記憶片段、已呈現的 grounded markdown，以及深度提升候選項目，因此呼叫端需要 `operator.read`。
    - `sessions.usage` 會傳回各工作階段的使用量摘要。傳入 `agentId` 可指定單一
      代理，或傳入 `agentScope: "all"` 可一併列出已設定的代理。
    - `sessions.usage.timeseries` 會傳回單一工作階段的時間序列使用量。
    - `sessions.usage.logs` 會傳回單一工作階段的使用量記錄項目。

  </Accordion>

  <Accordion title="頻道與登入輔助工具">
    - `channels.status` 會傳回內建 + 隨附頻道/外掛狀態摘要。
    - `channels.logout` 會在頻道支援登出時，登出特定頻道/帳戶。
    - `web.login.start` 會為目前具備 QR 功能的網頁頻道供應商啟動 QR/網頁登入流程。
    - `web.login.wait` 會等待該 QR/網頁登入流程完成，並在成功時啟動頻道。
    - `push.test` 會向已註冊的 iOS 節點傳送測試 APNs 推播。
    - `voicewake.get` 會傳回已儲存的喚醒詞觸發條件。
    - `voicewake.set` 會更新喚醒詞觸發條件並廣播變更。

  </Accordion>

  <Accordion title="訊息與記錄">
    - `send` 是直接對外傳遞 RPC，用於在聊天執行器之外，對特定頻道/帳戶/對話串目標傳送訊息。
    - `logs.tail` 會傳回已設定的閘道檔案記錄尾端，並提供游標/限制與最大位元組控制。

  </Accordion>

  <Accordion title="操作者終端機">
    - `terminal.open` 會為明確的 `agentId` 或預設代理啟動主機 PTY，並傳回已解析的代理、工作目錄、shell 與限制狀態。
    - `terminal.input`、`terminal.resize` 和 `terminal.close` 只會操作呼叫連線所擁有的工作階段。
    - `terminal.data` 和 `terminal.exit` 事件只會串流到擁有該工作階段的連線。
    - 連線中斷的工作階段會被分離，而不是終止：它們會在 `gateway.terminal.detachedSessionTimeoutSeconds` 期間保持可重新附加（預設 300；`0` 會恢復為中斷連線即終止），同時最近輸出會累積在有界的伺服器端緩衝區中。
    - `terminal.list` 會傳回可附加的工作階段；`terminal.attach` 會將即時或已分離的工作階段重新繫結到呼叫連線，並傳回重播緩衝區（tmux 樣式接管 — 先前的即時擁有者會收到原因為 `detached` 的 `terminal.exit`）；`terminal.text` 會以純文字讀取緩衝區而不附加。
    - 每個終端機方法都需要 `operator.admin`；`gateway.terminal.enabled` 必須明確為 true。完全沙盒化的代理會被拒絕，而代理政策變更會關閉既有與進行中的 PTY，包括已分離的 PTY。

  </Accordion>

  <Accordion title="Talk 與 TTS">
    - `talk.catalog` 會傳回用於語音、串流轉錄與即時語音的唯讀 Talk 供應商目錄。它包含標準供應商 ID、登錄別名、標籤、已設定狀態、可選的群組層級 `ready` 結果、公開的模型/語音 ID、標準模式、傳輸、brain 策略，以及即時音訊/功能旗標，不會傳回供應商祕密或變更全域設定。目前的閘道會在套用執行階段供應商選擇後設定 `ready`；用戶端應將它不存在的情況視為未驗證，以相容於較舊的閘道。
    - `talk.config` 會傳回有效的 Talk 設定承載；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.session.create` 會為 `realtime/gateway-relay`、`transcription/gateway-relay` 或 `stt-tts/managed-room` 建立閘道擁有的 Talk 工作階段。對於 `stt-tts/managed-room`，傳入 `sessionKey` 的 `operator.write` 呼叫端也必須傳入 `spawnedBy`，以取得具範圍的工作階段金鑰可見性；未限定範圍的 `sessionKey` 建立與 `brain: "direct-tools"` 需要 `operator.admin`。
    - `talk.session.join` 會驗證受管理房間工作階段權杖，視需要發出 `session.ready` 或 `session.replaced` 事件，並傳回房間/工作階段中繼資料與近期 Talk 事件，但不包含明文權杖或已儲存的權杖雜湊。
    - `talk.session.appendAudio` 會將 base64 PCM 輸入音訊附加到閘道擁有的即時轉送與轉錄工作階段。
    - `talk.session.startTurn`、`talk.session.endTurn` 和 `talk.session.cancelTurn` 會驅動受管理房間回合生命週期，並在狀態清除前拒絕過期回合。
    - `talk.session.cancelOutput` 會停止助理音訊輸出，主要用於閘道轉送工作階段中由 VAD 閘控的插話。
    - `talk.session.submitToolResult` 會完成由閘道擁有的即時轉送工作階段所發出的供應商工具呼叫。當最終結果稍後會跟隨時，傳入 `options: { willContinue: true }` 以提供暫時工具輸出；或當工具結果應滿足供應商呼叫而不啟動另一個即時助理回應時，傳入 `options: { suppressResponse: true }`。
    - `talk.session.steer` 會將作用中執行的語音控制傳送到閘道擁有且由代理支援的 Talk 工作階段。它接受 `{ sessionId, text, mode? }`，其中 `mode` 是 `status`、`steer`、`cancel` 或 `followup`；省略模式時會從語音文字分類。
    - `talk.session.close` 會關閉閘道擁有的轉送、轉錄或受管理房間工作階段，並發出終止 Talk 事件。
    - `talk.mode` 會為 WebChat/Control UI 用戶端設定/廣播目前的 Talk 模式狀態。
    - `talk.client.create` 會使用 `webrtc` 或 `provider-websocket` 建立用戶端擁有的即時供應商工作階段，同時由閘道擁有設定、憑證、指示與工具政策。
    - `talk.client.toolCall` 允許用戶端擁有的即時傳輸將供應商工具呼叫轉送到閘道政策。第一個支援的工具是 `openclaw_agent_consult`；用戶端會收到執行 ID，並在提交供應商特定工具結果前等待一般聊天生命週期事件。
    - `talk.client.steer` 會為用戶端擁有的即時傳輸傳送作用中執行的語音控制。閘道會從 `sessionKey` 解析作用中的內嵌執行，並傳回結構化的已接受/已拒絕結果，而不是靜默丟棄導引。
    - `talk.event` 是用於即時、轉錄、STT/TTS、受管理房間、電話與會議配接器的單一 Talk 事件頻道。
    - `talk.speak` 會透過作用中的 Talk 語音供應商合成語音。
    - `tts.status` 會傳回 TTS 啟用狀態、作用中供應商、後援供應商，以及供應商設定狀態。
    - `tts.providers` 會傳回可見的 TTS 供應商清冊。
    - `tts.enable` 和 `tts.disable` 會切換 TTS 偏好設定狀態。
    - `tts.setProvider` 會更新偏好的 TTS 供應商。
    - `tts.convert` 會執行一次性文字轉語音轉換。

  </Accordion>

  <Accordion title="密鑰、設定、更新與精靈">
    - `secrets.reload` 會重新解析作用中的 SecretRefs，且只有在完全成功時才替換執行階段密鑰狀態。
    - `secrets.resolve` 會解析特定命令/目標集合的命令目標密鑰指派。
    - `config.get` 會傳回目前的設定快照與雜湊。
    - `config.set` 會寫入已驗證的設定承載。
    - `config.patch` 會合併部分設定更新。破壞性的陣列
      替換需要在 `replacePaths` 中列出受影響路徑；陣列項目下的巢狀陣列
      使用 `[]` 路徑，例如 `agents.list[].skills`。
    - `config.apply` 會驗證並替換完整設定承載。
    - `config.schema` 會傳回 Control UI 與命令列介面工具使用的即時設定結構描述承載：結構描述、`uiHints`、版本與產生中繼資料，包括執行階段能載入時的外掛與頻道結構描述中繼資料。結構描述包含欄位 `title` / `description` 中繼資料，這些資料衍生自 UI 使用的相同標籤與說明文字；當存在相符欄位文件時，也包含巢狀物件、萬用字元、陣列項目，以及 `anyOf` / `oneOf` / `allOf` 組合分支。
    - `config.schema.lookup` 會傳回一個設定路徑的路徑範圍查詢承載：正規化路徑、淺層結構描述節點、相符提示與 `hintPath`、選用的 `reloadKind`，以及用於 UI/命令列介面向下鑽研的直接子項摘要。`reloadKind` 是 `restart`、`hot` 或 `none` 之一，並對應所請求路徑的閘道設定重新載入規劃器。查詢結構描述節點會保留面向使用者的文件與常見驗證欄位（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、數值/字串/陣列/物件界限，以及像 `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` 這類旗標）。子項摘要會公開 `key`、正規化 `path`、`type`、`required`、`hasChildren`、選用的 `reloadKind`，以及相符的 `hint` / `hintPath`。
    - `update.run` 會執行閘道更新流程，且只有更新本身成功時才排程重新啟動；具備工作階段的呼叫端可以包含 `continuationMessage`，讓啟動時透過重新啟動延續佇列恢復一個後續代理程式回合。來自控制平面的套件管理器更新與受監督的 git-checkout 更新，會使用分離式受管理服務交接，而不是在即時閘道內替換套件樹或變更 checkout/build 輸出。已開始的交接會傳回 `ok: true`，並帶有 `result.reason: "managed-service-handoff-started"` 與 `handoff.status: "started"`；不可用或失敗的交接會傳回 `ok: false`，並帶有 `managed-service-handoff-unavailable` 或 `managed-service-handoff-failed`，若需要手動 shell 更新，還會包含 `handoff.command`。不可用的交接表示 OpenClaw 缺少安全的監督邊界或持久服務身分，例如 systemd 的 `OPENCLAW_SYSTEMD_UNIT`。在已開始的交接期間，重新啟動哨兵可能會短暫回報 `stats.reason: "restart-health-pending"`；延續會延後到命令列介面驗證已重新啟動的閘道並寫入最終 `ok` 哨兵後才執行。
    - `update.status` 會重新整理並傳回最新的更新重新啟動哨兵，包括可用時重新啟動後正在執行的版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 與 `wizard.cancel` 會透過 WS RPC 公開初始設定精靈。

  </Accordion>

  <Accordion title="代理程式與工作區輔助工具">
    - `agents.list` 會傳回已設定的代理程式項目，包括有效模型與執行階段中繼資料。
    - `agents.create`、`agents.update` 與 `agents.delete` 會管理代理程式記錄與工作區連線。
    - `agents.files.list`、`agents.files.get` 與 `agents.files.set` 會管理為代理程式公開的啟動工作區檔案。
    - `tasks.list`、`tasks.get` 與 `tasks.cancel` 會向 SDK 與操作員用戶端公開閘道任務帳本。
    - `artifacts.list`、`artifacts.get` 與 `artifacts.download` 會為明確的 `sessionKey`、`runId` 或 `taskId` 範圍公開由逐字稿衍生的成品摘要與下載。執行與任務查詢會在伺服器端解析擁有者工作階段，且只傳回來源相符的逐字稿媒體；不安全或本機 URL 來源會傳回不支援的下載，而不是在伺服器端擷取。
    - `environments.list` 與 `environments.status` 會向 SDK 用戶端公開唯讀的閘道本機與節點環境探索。
    - `agent.identity.get` 會傳回代理程式或工作階段的有效助理身分。
    - `agent.wait` 會等待執行完成，並在可用時傳回終止快照。

  </Accordion>

  <Accordion title="工作階段控制">
    - `sessions.list` 會傳回目前的工作階段索引；當已設定代理程式執行階段後端時，包含每列的 `agentRuntime` 中繼資料。
    - `sessions.subscribe` 與 `sessions.unsubscribe` 會切換目前 WS 用戶端的工作階段變更事件訂閱。
    - `sessions.messages.subscribe` 與 `sessions.messages.unsubscribe` 會切換單一工作階段的逐字稿/訊息事件訂閱。
    - `sessions.preview` 會傳回特定工作階段鍵的有界逐字稿預覽。
    - `sessions.describe` 會為精確的工作階段鍵傳回一列閘道工作階段。
    - `sessions.resolve` 會解析或正規化工作階段目標。
    - `sessions.create` 會建立新的工作階段項目。
    - `sessions.send` 會將訊息傳送到現有工作階段。
    - `sessions.steer` 是作用中工作階段的中斷並導向變體。
    - `sessions.abort` 會中止工作階段的作用中工作。呼叫端可以傳入 `key` 加上選用的 `runId`，或只為閘道可解析到工作階段的作用中執行傳入 `runId`。
    - `sessions.patch` 會更新工作階段中繼資料/覆寫，並回報解析後的正規模型與有效 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 與 `sessions.compact` 會執行工作階段維護。
    - `sessions.get` 會傳回完整儲存的工作階段列。
    - 聊天執行仍使用 `chat.history`、`chat.send`、`chat.abort` 與 `chat.inject`。`chat.history` 會為 UI 用戶端進行顯示正規化：從可見文字移除行內指令標籤、移除純文字工具呼叫 XML 承載（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 與截斷的工具呼叫區塊）以及外洩的 ASCII/全形模型控制權杖；像精確 `NO_REPLY` / `no_reply` 這類純靜默權杖助理列會被省略，過大的列則可替換為預留位置。
    - `chat.message.get` 是針對單一可見逐字稿項目的加法式有界完整訊息讀取器。用戶端會傳入 `sessionKey`、當工作階段選取範圍限定於代理程式時選用的 `agentId`，以及先前透過 `chat.history` 顯示的逐字稿 `messageId`；當儲存的項目仍可用且未過大時，閘道會傳回相同的顯示正規化投影，但不套用輕量歷史截斷上限。
    - `chat.send` 接受單回合 `fastMode: "auto"`，以便對自動截止前啟動的模型呼叫使用快速模式，之後再啟動不使用快速模式的後續重試、備援、工具結果或延續呼叫。截止預設為 60 秒，並可用 `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` 依模型設定。`chat.send` 呼叫端可以傳入單回合 `fastAutoOnSeconds`，覆寫該請求的截止時間。

  </Accordion>

  <Accordion title="裝置配對與裝置權杖">
    - `device.pair.list` 會傳回待處理與已核准的已配對裝置。
    - `device.pair.setupCode` 會建立行動裝置設定碼，預設也會建立 PNG QR 資料 URL。它需要 `operator.admin`，且會刻意從公告的探索中省略。結果包含 `setupCode`、選用的 `qrDataUrl`、`gatewayUrl`、非密鑰 `auth` 標籤，以及 `urlSource`。
    - `device.pair.approve`、`device.pair.reject` 與 `device.pair.remove` 會管理裝置配對記錄。
    - `device.token.rotate` 會在已核准角色與呼叫端範圍界限內輪替已配對裝置權杖。
    - `device.token.revoke` 會在已核准角色與呼叫端範圍界限內撤銷已配對裝置權杖。

    設定碼會內嵌短效啟動憑證。用戶端不得
    在配對流程之外記錄或持久化它。

  </Accordion>

  <Accordion title="節點配對、叫用與待處理工作">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove` 與 `node.pair.verify` 涵蓋節點配對與啟動驗證。
    - `node.list` 與 `node.describe` 會傳回已知/已連線的節點狀態。
    - `node.rename` 會更新已配對節點標籤。
    - `node.invoke` 會將命令轉送到已連線節點。
    - `node.invoke.result` 會傳回叫用請求的結果。
    - `node.event` 會將節點來源事件帶回閘道。
    - `node.pending.pull` 與 `node.pending.ack` 是已連線節點佇列 API。
    - `node.pending.enqueue` 與 `node.pending.drain` 會管理離線/已中斷連線節點的持久待處理工作。

  </Accordion>

  <Accordion title="核准系列">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 與 `exec.approval.resolve` 涵蓋一次性 exec 核准請求，以及待處理核准查詢/重播。
    - `exec.approval.waitDecision` 會等待一個待處理 exec 核准，並傳回最終決策（逾時時為 `null`）。
    - `exec.approvals.get` 與 `exec.approvals.set` 會管理閘道 exec 核准政策快照。
    - `exec.approvals.node.get` 與 `exec.approvals.node.set` 會透過節點中繼命令管理節點本機 exec 核准政策。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 與 `plugin.approval.resolve` 涵蓋外掛定義的核准流程。

  </Accordion>

  <Accordion title="自動化、Skills 與工具">
    - 自動化：`wake` 會排程立即或下一次心跳偵測喚醒文字注入；`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 會管理排程工作。
    - `cron.run` 仍是用於手動執行的入列式 RPC。需要完成語意的用戶端應讀取傳回的 `runId` 並輪詢 `cron.runs`。
    - `cron.runs` 接受選用的非空 `runId` 篩選器，讓用戶端能追蹤一個已排入佇列的手動執行，而不會與同一工作其他歷史項目競爭。
    - Skills 與工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 常見事件系列

- `chat`：UI 聊天更新，例如 `chat.inject` 與其他僅逐字稿聊天
  事件。在協定 v4 中，delta 承載會攜帶 `deltaText`；`message` 仍是
  累積助理快照。非前綴替換會設定 `replace=true`
  並使用 `deltaText` 作為替換文字。
- `session.message`、`session.operation` 與 `session.tool`：已訂閱
  工作階段的逐字稿、進行中的工作階段操作，以及事件串流更新。
- `sessions.changed`：工作階段索引或中繼資料已變更。
- `presence`：系統在線狀態快照更新。
- `tick`：週期性 keepalive / liveness 事件。
- `health`：閘道健康狀態快照更新。
- `heartbeat`：心跳偵測事件串流更新。
- `cron`：排程執行/工作變更事件。
- `shutdown`：閘道關閉通知。
- `node.pair.requested` / `node.pair.resolved`：節點配對生命週期。
- `node.invoke.request`：節點叫用請求廣播。
- `device.pair.requested` / `device.pair.resolved`：已配對裝置生命週期。
- `voicewake.changed`：喚醒詞觸發設定已變更。
- `exec.approval.requested` / `exec.approval.resolved`：exec 核准
  生命週期。
- `plugin.approval.requested` / `plugin.approval.resolved`：外掛核准
  生命週期。

### 節點輔助方法

- 節點可以呼叫 `skills.bins` 來擷取目前的技能可執行檔清單，
  以供自動允許檢查使用。

### 任務帳本 RPC

操作者用戶端可透過任務帳本 RPC 檢查並取消閘道背景任務記錄。這些方法會傳回經過清理的任務摘要，而不是原始運行時狀態。

- `tasks.list` 需要 `operator.read`。
  - 參數：選用的 `status`（`"queued"`、`"running"`、`"completed"`、
    `"failed"`、`"cancelled"` 或 `"timed_out"`）或這些狀態的陣列、
    選用的 `agentId`、選用的 `sessionKey`、從 `1` 到
    `500` 的選用 `limit`，以及選用字串 `cursor`。
  - 結果：`{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` 需要 `operator.read`。
  - 參數：`{ "taskId": string }`。
  - 結果：`{ "task": TaskSummary }`。
  - 缺少的任務 ID 會傳回閘道的找不到錯誤形狀。
- `tasks.cancel` 需要 `operator.write`。
  - 參數：`{ "taskId": string, "reason"?: string }`。
  - 結果：
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` 回報帳本是否有相符的任務。`cancelled`
    回報運行時是否接受或記錄了取消。

`TaskSummary` 包含 `id`、`status`，以及選用中繼資料，例如 `kind`、
`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、
`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、時間戳記、進度、
終端摘要，以及經過清理的錯誤文字。`agentId` 識別正在執行任務的代理；
`sessionKey` 和 `ownerKey` 保留請求者與控制情境。

### 操作者輔助方法

- 操作者可呼叫 `commands.list`（`operator.read`）以擷取代理的運行時
  命令清單。
  - `agentId` 是選用的；省略它可讀取預設代理工作區。
  - `scope` 控制主要 `name` 目標所屬的表面：
    - `text` 傳回不含前導 `/` 的主要文字命令權杖
    - `native` 和預設的 `both` 路徑會在可用時傳回具提供者感知能力的原生命名
  - `textAliases` 攜帶精確的斜線別名，例如 `/model` 和 `/m`。
  - `nativeName` 會在存在時攜帶具提供者感知能力的原生命令名稱。
  - `provider` 是選用的，且只會影響原生命名以及原生外掛
    命令可用性。
  - `includeArgs=false` 會從回應中省略序列化的引數中繼資料。
- 操作者可呼叫 `tools.catalog`（`operator.read`）以擷取代理的運行時工具目錄。回應包含分組工具與來源中繼資料：
  - `source`：`core` 或 `plugin`
  - `pluginId`：`source="plugin"` 時的外掛擁有者
  - `optional`：外掛工具是否為選用
- 操作者可呼叫 `tools.effective`（`operator.read`）以擷取工作階段的運行時有效工具
  清單。
  - `sessionKey` 是必要的。
  - 閘道會從伺服器端的工作階段衍生可信任的運行時情境，而不是接受
    呼叫者提供的驗證或傳遞情境。
  - 回應是作用中清單的工作階段範圍、伺服器衍生投影，
    包含核心、外掛、通道，以及已探索的 MCP 伺服器工具。
  - `tools.effective` 對 MCP 為唯讀：它可能會透過最終工具政策投影已暖機的工作階段 MCP 目錄，
    但不會建立 MCP 運行時、連接傳輸，或發出
    `tools/list`。如果沒有相符的已暖機目錄，回應可能包含例如
    `mcp-not-yet-connected`、`mcp-not-yet-listed` 或 `mcp-stale-catalog` 的通知。
  - 有效工具項目使用 `source="core"`、`source="plugin"`、`source="channel"` 或
    `source="mcp"`。
- 操作者可呼叫 `tools.invoke`（`operator.write`），透過與 `/tools/invoke`
  相同的閘道政策路徑叫用一個可用工具。
  - `name` 是必要的。`args`、`sessionKey`、`agentId`、`confirm` 和
    `idempotencyKey` 是選用的。
  - 如果同時存在 `sessionKey` 和 `agentId`，解析出的工作階段代理必須符合
    `agentId`。
  - 僅限擁有者的核心包裝器，例如 `cron`、`gateway` 和 `nodes`，即使 `tools.invoke`
    方法本身是 `operator.write`，仍需要擁有者/管理員身分（`operator.admin`）。
  - 回應是面向 SDK 的封套，包含 `ok`、`toolName`、選用的 `output`，以及具型別的
    `error` 欄位。核准或政策拒絕會在酬載中傳回 `ok:false`，而不是
    繞過閘道工具政策管線。
- 操作者可呼叫 `skills.status`（`operator.read`）以擷取代理可見的
  技能清單。
  - `agentId` 是選用的；省略它可讀取預設代理工作區。
  - 回應包含資格、缺少的需求、設定檢查，以及
    經過清理的安裝選項，而不會暴露原始秘密值。
- 操作者可呼叫 `skills.search` 和 `skills.detail`（`operator.read`）取得
  ClawHub 探索中繼資料。
- 操作者可呼叫 `skills.upload.begin`、`skills.upload.chunk` 和
  `skills.upload.commit`（`operator.admin`），在安裝前暫存私人技能封存檔。
  這是供可信任用戶端使用的獨立管理員上傳路徑，
  不是一般 ClawHub 技能安裝流程，且預設為停用，除非
  `skills.install.allowUploadedArchives` 已啟用。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    會建立一個繫結到該 slug 與 force 值的上傳。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` 會在
    精確解碼偏移處附加位元組。
  - `skills.upload.commit({ uploadId, sha256? })` 會驗證最終大小與
    SHA-256。提交只會完成上傳；它不會安裝該技能。
  - 上傳的技能封存檔是包含 `SKILL.md` 根目錄的 zip 封存檔。該
    封存檔的內部目錄名稱絕不會選擇安裝目標。
- 操作者可在三種模式下呼叫 `skills.install`（`operator.admin`）：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 會將
    技能資料夾安裝到預設代理工作區的 `skills/` 目錄。
  - 上傳模式：`{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    會將已提交的上傳安裝到預設代理工作區的 `skills/<slug>`
    目錄。slug 與 force 值必須符合原始
    `skills.upload.begin` 請求。除非
    `skills.install.allowUploadedArchives` 已啟用，否則此模式會被拒絕。此設定不會
    影響 ClawHub 安裝。
  - 閘道安裝器模式：`{ name, installId, timeoutMs? }`
    會在閘道主機上執行宣告的 `metadata.openclaw.install` 動作。
    較舊的用戶端可能仍會傳送 `dangerouslyForceUnsafeInstall`；此欄位已
    棄用，僅為協定相容性而接受，且會被忽略。請使用
    `security.installPolicy` 進行操作者擁有的安裝決策。
- 操作者可在兩種模式下呼叫 `skills.update`（`operator.admin`）：
  - ClawHub 模式會更新預設代理工作區中一個受追蹤的 slug，或所有受追蹤的 ClawHub 安裝。
  - 設定模式會修補 `skills.entries.<skillKey>` 值，例如 `enabled`、
    `apiKey` 和 `env`。

### `models.list` 檢視

`models.list` 接受選用的 `view` 參數：

- 省略或 `"default"`：目前運行時行為。如果已設定 `agents.defaults.models`，回應會是允許目錄，包含為 `provider/*` 項目動態探索到的模型。否則回應會是完整閘道目錄。
- `"configured"`：適合選擇器大小的行為。如果已設定 `agents.defaults.models`，它仍會優先，包括對 `provider/*` 項目的提供者範圍探索。若沒有允許清單，回應會使用明確的 `models.providers.*.models` 項目，只有在沒有已設定模型列時才退回完整目錄。
- `"all"`：完整閘道目錄，略過 `agents.defaults.models`。請將此用於診斷與探索 UI，而不是一般模型選擇器。

## Exec 核准

- 當 exec 請求需要核准時，閘道會廣播 `exec.approval.requested`。
- 操作者用戶端透過呼叫 `exec.approval.resolve`（需要 `operator.approvals` 範圍）來解析。
- 對於 `host=node`，`exec.approval.request` 必須包含 `systemRunPlan`（標準 `argv`/`cwd`/`rawCommand`/工作階段中繼資料）。缺少 `systemRunPlan` 的請求會被拒絕。
- 核准後，轉送的 `node.invoke system.run` 呼叫會重用該標準
  `systemRunPlan`，作為權威的命令/cwd/工作階段情境。
- 如果呼叫者在準備與最終核准的 `system.run` 轉送之間變更 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，閘道會拒絕該執行，而不是信任變更後的酬載。

## 代理傳遞後援

- `agent` 請求可包含 `deliver=true` 以請求對外傳遞。
- `bestEffortDeliver=false` 會維持嚴格行為：無法解析或僅限內部的傳遞目標會傳回 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允許在無法解析外部可傳遞路由時，後援為僅工作階段執行（例如內部/webchat 工作階段或模稜兩可的多通道設定）。
- 最終 `agent` 結果可在請求傳遞時包含 `result.deliveryStatus`，
  使用與 [`openclaw agent --json --deliver`](/zh-TW/cli/agent#json-delivery-status) 文件中相同的
  `sent`、`suppressed`、`partial_failed` 和 `failed`
  狀態。

## 版本控制

- `PROTOCOL_VERSION` 位於 `packages/gateway-protocol/src/version.ts`。
- 用戶端會傳送 `minProtocol` + `maxProtocol`；伺服器會拒絕
  不包含其目前協定的範圍。目前的用戶端與伺服器需要
  協定 v4。
- 結構描述 + 模型是從 TypeBox 定義產生：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 用戶端常數

`src/gateway/client.ts` 中的參考用戶端使用這些預設值。這些值在
協定 v4 中保持穩定，且是第三方用戶端的預期基準。

| 常數                                      | 預設值                                                | 來源                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| 要求逾時（每個 RPC）                      | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| 預先驗證 / 連線挑戰逾時                  | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（config/env 可以提高成對的伺服器/用戶端預算）          |
| 初始重新連線退避                          | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| 最大重新連線退避                          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| 裝置權杖關閉後的快速重試限制              | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前的強制停止寬限時間        | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` 預設逾時                  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| 預設 tick 間隔（`hello-ok` 前）           | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick 逾時關閉                             | 靜默超過 `tickIntervalMs * 2` 時使用代碼 `4000`       | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

伺服器會在 `hello-ok` 中公告有效的 `policy.tickIntervalMs`、`policy.maxPayload`
和 `policy.maxBufferedBytes`；用戶端應遵守這些值，而不是握手前的預設值。

## 驗證

- 共享密鑰閘道驗證會使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，取決於設定的驗證模式。
- 帶有身分的模式，例如 Tailscale Serve
  (`gateway.auth.allowTailscale: true`) 或非 loopback 的
  `gateway.auth.mode: "trusted-proxy"`，會改由要求標頭滿足連線驗證檢查，而不是使用 `connect.params.auth.*`。
- 私有入口 `gateway.auth.mode: "none"` 會完全略過共享密鑰連線驗證；
  不要在公開/不受信任的入口公開該模式。
- 配對後，閘道會核發限定於連線角色 + 範圍的**裝置權杖**。它會在
  `hello-ok.auth.deviceToken` 中傳回，並且應由用戶端保存以供未來連線使用。
- 用戶端應在任何成功連線後保存主要的 `hello-ok.auth.deviceToken`。
- 使用該**已儲存**的裝置權杖重新連線時，也應重用該權杖已儲存的核准範圍集合。
  這會保留已授予的讀取/探測/狀態存取，並避免重新連線被默默縮減為較窄的隱含僅管理員範圍。
- 用戶端連線驗證組裝（`src/gateway/client.ts` 中的 `selectConnectAuth`）：
  - `auth.password` 是正交的，設定時一律會轉送。
  - `auth.token` 會依優先順序填入：先使用明確的共享權杖，
    接著是明確的 `deviceToken`，最後是已儲存的每裝置權杖（以
    `deviceId` + `role` 作為鍵）。
  - 只有在上述項目都未解析出 `auth.token` 時，才會送出 `auth.bootstrapToken`。
    共享權杖或任何已解析的裝置權杖都會抑制它。
  - 在一次性 `AUTH_TOKEN_MISMATCH` 重試中，自動提升已儲存裝置權杖僅限於**受信任端點**：
    loopback，或帶有釘選 `tlsFingerprint` 的 `wss://`。未釘選的公開 `wss://`
    不符合資格。
- 內建 setup-code bootstrap 會傳回主要節點
  `hello-ok.auth.deviceToken`，以及 `hello-ok.auth.deviceTokens` 中供受信任行動交接使用的受限操作員權杖。
  操作員權杖包含 `operator.talk.secrets`，可讀取原生 Talk 設定，
  但不包含配對變更範圍和 `operator.admin`。
- 當非基準 setup-code bootstrap 正在等待核准時，`PAIRING_REQUIRED`
  詳細資料會包含 `recommendedNextStep: "wait_then_retry"`、`retryable: true`
  和 `pauseReconnect: false`。用戶端應使用相同的 bootstrap 權杖持續重新連線，
  直到要求獲准或權杖失效。
- 只有在連線於受信任傳輸（例如 `wss://` 或 loopback/local 配對）上使用 bootstrap 驗證時，
  才保存 `hello-ok.auth.deviceTokens`。
- 如果用戶端提供**明確的** `deviceToken` 或明確的 `scopes`，
  則該呼叫端要求的範圍集合仍具權威性；快取範圍只會在用戶端重用已儲存的每裝置權杖時使用。
- 裝置權杖可透過 `device.token.rotate` 和 `device.token.revoke` 輪替/撤銷
  （需要 `operator.pairing` 範圍）。輪替或撤銷節點或其他非操作員角色時，
  也需要 `operator.admin`。
- `device.token.rotate` 會傳回輪替中繼資料。只有在同一裝置呼叫且已使用該裝置權杖驗證時，
  才會回傳替換的 bearer 權杖，因此僅權杖用戶端可以在重新連線前保存替換權杖。
  共享/管理員輪替不會回傳 bearer 權杖。
- 權杖核發、輪替和撤銷都會限制在該裝置配對項目中記錄的已核准角色集合內；
  權杖變更無法擴大或指定配對核准從未授予的裝置角色。
- 對於已配對裝置權杖工作階段，除非呼叫端也有 `operator.admin`，
  否則裝置管理為自我範圍限定：非管理員呼叫端只能管理其**自己**裝置項目的操作員權杖。
  即使是呼叫端自己的裝置，節點和其他非操作員權杖管理也僅限管理員。
- `device.token.rotate` 和 `device.token.revoke` 也會根據呼叫端目前的工作階段範圍，
  檢查目標操作員權杖範圍集合。非管理員呼叫端無法輪替或撤銷比自己已持有範圍更廣的操作員權杖。
- 驗證失敗會包含 `error.details.code` 以及復原提示：
  - `error.details.canRetryWithDeviceToken`（布林值）
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` 的用戶端行為：
  - 受信任的用戶端可以嘗試一次受限重試，使用快取的每裝置權杖。
  - 如果該重試失敗，用戶端應停止自動重新連線迴圈，並顯示操作員行動指引。
- `AUTH_SCOPE_MISMATCH` 表示裝置權杖已被辨識，但不涵蓋要求的角色/範圍。
  用戶端不應將此呈現為錯誤權杖；應提示操作員重新配對，或核准較窄/較寬的範圍合約。

## 裝置身分 + 配對

- 節點應包含從金鑰組指紋衍生的穩定裝置身分 (`device.id`)。
- 閘道會依裝置 + 角色核發權杖。
- 除非已啟用本機自動核准，否則新的裝置 ID 需要配對核准。
- 配對自動核准以直接 local loopback 連線為中心。
- OpenClaw 也有狹窄的後端/容器本機自我連線路徑，用於受信任的共享密鑰輔助流程。
- 同主機 tailnet 或 LAN 連線仍會被視為遠端配對，並且需要核准。
- WS 用戶端通常會在 `connect` 期間包含 `device` 身分（操作員 +
  節點）。唯一不含裝置的操作員例外是明確的信任路徑：
  - `gateway.controlUi.allowInsecureAuth=true`，用於僅 localhost 的不安全 HTTP 相容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` 操作員 Control UI 驗證。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急例外，嚴重降低安全性）。
  - 保留內部輔助路徑上的直接 loopback `gateway-client` 後端 RPC。
- 省略裝置身分會影響範圍。當不含裝置的操作員連線透過明確信任路徑被允許時，
  OpenClaw 仍會將自我宣告的範圍清空為空集合，除非該路徑有具名的範圍保留例外。
  接著受範圍控管的方法會因 `missing scope` 失敗。
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` 是 Control UI
  緊急例外範圍保留路徑。它不會向任意自訂後端或命令列介面形態的 WebSocket 用戶端授予範圍。
- 保留的直接 loopback `gateway-client` 後端輔助路徑只會為內部本機控制平面 RPC 保留範圍；
  自訂後端 ID 不會收到此例外。
- 所有連線都必須簽署伺服器提供的 `connect.challenge` nonce。

### 裝置驗證遷移診斷

對於仍使用挑戰前簽署行為的舊版用戶端，`connect` 現在會在
`error.details.code` 下傳回 `DEVICE_AUTH_*` 詳細代碼，並附上穩定的 `error.details.reason`。

常見遷移失敗：

| 訊息                        | details.code                     | details.reason           | 含義                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 用戶端省略 `device.nonce`（或送出空白）。          |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 用戶端使用過期/錯誤的 nonce 簽署。                |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 簽章承載資料與 v2 承載資料不符。                  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 已簽署時間戳超出允許偏移。                        |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 與公開金鑰指紋不符。                  |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開金鑰格式/正規化失敗。                         |

遷移目標：

- 一律等待 `connect.challenge`。
- 簽署包含伺服器 nonce 的 v2 承載資料。
- 在 `connect.params.device.nonce` 中送出相同的 nonce。
- 慣用簽章承載資料為 `v3`，除裝置/用戶端/角色/範圍/權杖/nonce 欄位外，
  還會綁定 `platform` 和 `deviceFamily`。
- 舊版 `v2` 簽章仍會為相容性而接受，但已配對裝置中繼資料釘選仍會在重新連線時控制命令政策。

## TLS + 釘選

- WS 連線支援 TLS。
- 用戶端可以選擇性釘選閘道憑證指紋（請參閱 `gateway.tls`
  設定，以及 `gateway.remote.tlsFingerprint` 或命令列介面 `--tls-fingerprint`）。

## 範圍

此協定公開**完整的閘道 API**（狀態、頻道、模型、聊天、
代理、工作階段、節點、核准等）。確切表面由
`packages/gateway-protocol/src/schema.ts` 中的 TypeBox schema 定義。

## 相關

- [橋接協定](/zh-TW/gateway/bridge-protocol)
- [閘道作業手冊](/zh-TW/gateway)
