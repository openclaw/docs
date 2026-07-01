---
read_when:
    - 實作或更新閘道 WS 用戶端
    - 偵錯協定不相符或連線失敗
    - 重新產生通訊協定結構描述/模型
summary: 閘道 WebSocket 協定：握手、訊框、版本管理
title: 閘道協定
x-i18n:
    generated_at: "2026-07-01T02:59:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fbfc5db0169f7ac2eacdb882d2afe08c80d5b8d669b6a1cfb2ffd0edbf71d16
    source_path: gateway/protocol.md
    workflow: 16
---

閘道 WS 協定是 OpenClaw 的**單一控制平面 + 節點傳輸**。所有用戶端（命令列介面、網頁 UI、macOS 應用程式、iOS/Android 節點、無頭節點）都透過 WebSocket 連線，並在交握時宣告其**角色** + **範圍**。

## 傳輸

- WebSocket，使用含 JSON 承載的文字訊框。
- 第一個訊框**必須**是 `connect` 請求。
- 連線前訊框上限為 64 KiB。交握成功後，用戶端應遵循 `hello-ok.policy.maxPayload` 和 `hello-ok.policy.maxBufferedBytes` 限制。啟用診斷時，過大的入站訊框和緩慢的出站緩衝區會在閘道關閉或丟棄受影響的訊框之前發出 `payload.large` 事件。這些事件會保留大小、限制、表面和安全原因碼。它們不會保留訊息本文、附件內容、原始訊框本文、權杖、Cookie 或祕密值。

## 交握（connect）

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

當閘道仍在完成啟動 sidecar 時，`connect` 請求可能會回傳可重試的 `UNAVAILABLE` 錯誤，且 `details.reason` 設為 `"startup-sidecars"` 並包含 `retryAfterMs`。用戶端應在其整體連線預算內重試該回應，而不是將其呈現為終止性的交握失敗。

`server`、`features`、`snapshot` 和 `policy` 都是結構描述（`packages/gateway-protocol/src/schema/frames.ts`）要求的項目。`auth` 也同樣為必要項目，並會回報協商後的角色/範圍。`pluginSurfaceUrls` 是選用項目，會將外掛表面名稱（例如 `canvas`）對應到具範圍限制的託管 URL。

具範圍限制的外掛表面 URL 可能會過期。節點可以呼叫 `node.pluginSurface.refresh` 並帶入 `{ "surface": "canvas" }`，以在 `pluginSurfaceUrls` 中收到新的項目。實驗性的 Canvas 外掛重構不支援已棄用的 `canvasHostUrl`、`canvasCapability` 或 `node.canvas.capability.refresh` 相容路徑；目前的原生用戶端和閘道必須使用外掛表面。

未發出裝置權杖時，`hello-ok.auth` 會回報協商後的權限，且不包含權杖欄位：

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

受信任的同程序後端用戶端（`client.id: "gateway-client"`、`client.mode: "backend"`）在使用共享閘道權杖/密碼進行驗證時，可在直接 loopback 連線上省略 `device`。此路徑保留給內部控制平面 RPC，並避免過期的命令列介面/裝置配對基準阻擋本機後端工作，例如子代理程式工作階段更新。遠端用戶端、瀏覽器來源用戶端、節點用戶端，以及明確使用裝置權杖/裝置身分的用戶端，仍使用一般配對和範圍升級檢查。

發出裝置權杖時，`hello-ok` 也會包含：

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

內建 QR/設定碼啟動程序是一條新的行動端交接路徑。成功的基準設定碼連線會回傳一個主要節點權杖，以及一個有界的操作員權杖：

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

操作員交接刻意保持有界，讓 QR 上線流程可以啟動行動端操作員迴圈，而不授予 `operator.admin` 或 `operator.pairing`。它確實包含 `operator.talk.secrets`，因此原生用戶端可在啟動後讀取所需的 Talk 設定。更廣泛的管理員與配對範圍需要另外經核准的操作員配對或權杖流程。只有當連線在受信任傳輸（例如 `wss://` 或 loopback/本機配對）上使用啟動驗證時，用戶端才應保存 `hello-ok.auth.deviceTokens`。

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

具有副作用的方法需要**冪等性金鑰**（請參閱結構描述）。

## 角色 + 範圍

如需完整的操作員範圍模型、核准時檢查和共享祕密語意，請參閱[操作員範圍](/zh-TW/gateway/operator-scopes)。

### 角色

- `operator` = 控制平面用戶端（命令列介面/UI/自動化）。
- `node` = 功能主機（camera/screen/canvas/system.run）。

### 範圍（操作員）

常見範圍：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` 搭配 `includeSecrets: true` 需要 `operator.talk.secrets`（或 `operator.admin`）。包含祕密時，用戶端應從 `talk.resolved.config.apiKey` 讀取作用中的 Talk 提供者憑證；`talk.providers.<id>.apiKey` 會保來源形狀，且可能是 SecretRef 物件或經遮蔽的字串。

外掛註冊的閘道 RPC 方法可以要求自己的操作員範圍，但保留的核心管理員前綴（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）一律解析為 `operator.admin`。

方法範圍只是第一道門檻。某些透過 `chat.send` 觸達的斜線命令會在其上套用更嚴格的命令層級檢查。例如，持久性的 `/config set` 和 `/config unset` 寫入需要 `operator.admin`。

`node.pair.approve` 在基礎方法範圍之上，還有額外的核准時範圍檢查：

- 無命令請求：`operator.pairing`
- 帶有非 exec 節點命令的請求：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的請求：`operator.pairing` + `operator.admin`

### 功能/命令/權限（節點）

節點會在連線時宣告功能主張：

- `caps`：高層級功能類別，例如 `camera`、`canvas`、`screen`、`location`、`voice` 和 `talk`。
- `commands`：用於 invoke 的命令允許清單。
- `permissions`：細粒度切換（例如 `screen.record`、`camera.capture`）。

閘道會將這些視為**主張**，並強制執行伺服器端允許清單。

## 存在狀態

- `system-presence` 會回傳以裝置身分為鍵的項目。
- 存在狀態項目包含 `deviceId`、`roles` 和 `scopes`，因此即使同一裝置同時以 **operator** 和 **node** 連線，UI 也能為每個裝置顯示單一列。
- `node.list` 包含選用的 `lastSeenAtMs` 和 `lastSeenReason` 欄位。已連線的節點會將目前連線時間回報為 `lastSeenAtMs`，原因為 `connect`；當受信任的節點事件更新配對中繼資料時，已配對節點也可以回報持久的背景存在狀態。

### 節點背景存活事件

節點可以呼叫 `node.event` 並帶入 `event: "node.presence.alive"`，以記錄已配對節點曾在背景喚醒期間存活，而不將其標記為已連線。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是封閉列舉：`background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual` 或 `connect`。未知的 trigger 字串會在持久化前由閘道正規化為 `background`。此事件僅對已驗證的節點裝置工作階段具持久性；無裝置或未配對的工作階段會回傳 `handled: false`。

成功的閘道會回傳結構化結果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

較舊的閘道仍可能針對 `node.event` 回傳 `{ "ok": true }`；用戶端應將其視為已確認的 RPC，而不是持久存在狀態的持久化。

## 廣播事件範圍控管

伺服器推送的 WebSocket 廣播事件受範圍控管，因此配對範圍或僅節點工作階段不會被動接收工作階段內容。

- **聊天、代理程式和工具結果訊框**（包括串流的 `agent` 事件和工具呼叫結果）至少需要 `operator.read`。沒有 `operator.read` 的工作階段會完全跳過這些訊框。
- **外掛定義的 `plugin.*` 廣播**會依外掛註冊方式，受 `operator.write` 或 `operator.admin` 控管。
- **狀態和傳輸事件**（`heartbeat`、`presence`、`tick`、連線/中斷連線生命週期等）維持不受限制，因此每個已驗證工作階段都能觀察傳輸健康狀態。
- **未知廣播事件家族**預設受範圍控管（失敗關閉），除非已註冊的處理常式明確放寬限制。

每個用戶端連線都保有自己的每用戶端序號，因此即使不同用戶端看到的事件串流子集經不同範圍過濾，廣播在該 socket 上仍能維持單調排序。

## 常見 RPC 方法家族

公開 WS 表面比上述交握/驗證範例更廣。這不是產生出的完整傾印，`hello-ok.features.methods` 是由 `src/gateway/server-methods-list.ts` 加上已載入的外掛/頻道方法匯出所建立的保守探索清單。請將其視為功能探索，而不是 `src/gateway/server-methods/*.ts` 的完整列舉。

  <AccordionGroup>
  <Accordion title="系統與身分">
    - `health` 會回傳快取或新探測到的閘道健康狀態快照。
    - `diagnostics.stability` 會回傳近期有界限的診斷穩定性記錄器。它保留事件名稱、計數、位元組大小、記憶體讀數、佇列/工作階段狀態、頻道/外掛名稱，以及工作階段 ID 等操作中繼資料。它不保留聊天文字、網路鉤子本文、工具輸出、原始請求或回應本文、權杖、Cookie，或秘密值。需要操作員讀取範圍。
    - `status` 會回傳 `/status` 風格的閘道摘要；敏感欄位只會包含在具管理員範圍的操作員用戶端中。
    - `gateway.identity.get` 會回傳轉送與配對流程使用的閘道裝置身分。
    - `system-presence` 會回傳已連線操作員/節點裝置的目前存在狀態快照。
    - `system-event` 會附加系統事件，並可更新/廣播存在狀態內容。
    - `last-heartbeat` 會回傳最新持久化的心跳偵測事件。
    - `set-heartbeats` 會切換閘道上的心跳偵測處理。

  </Accordion>

  <Accordion title="模型與用量">
    - `models.list` 會回傳執行階段允許的模型目錄。傳入 `{ "view": "configured" }` 可取得適合選擇器大小的已設定模型（先是 `agents.defaults.models`，再是 `models.providers.*.models`），或傳入 `{ "view": "all" }` 取得完整目錄。
    - `usage.status` 會回傳供應商用量時段/剩餘配額摘要。
    - `usage.cost` 會回傳某個日期範圍的彙總成本用量摘要。
      傳入 `agentId` 可指定單一代理，或傳入 `agentScope: "all"` 以彙總已設定代理。
    - `doctor.memory.status` 會回傳作用中預設代理工作區的向量記憶體/快取嵌入就緒狀態。只有在呼叫端明確需要即時嵌入供應商 ping 時，才傳入 `{ "probe": true }` 或 `{ "deep": true }`。具備夢境整理感知的用戶端也可傳入 `{ "agentId": "agent-id" }`，將夢境整理儲存統計限定到選取的代理工作區；省略 `agentId` 會保留預設代理後援，並彙總已設定的夢境整理工作區。
    - `doctor.memory.dreamDiary`、`doctor.memory.backfillDreamDiary`、`doctor.memory.resetDreamDiary`、`doctor.memory.resetGroundedShortTerm`、`doctor.memory.repairDreamingArtifacts` 和 `doctor.memory.dedupeDreamDiary` 接受選用的 `{ "agentId": "agent-id" }` 參數，用於選取代理的夢境整理檢視/動作。省略 `agentId` 時，它們會作用於已設定的預設代理工作區。
    - `doctor.memory.remHarness` 會為遠端控制平面用戶端回傳有界限、唯讀的 REM harness 預覽。它可能包含工作區路徑、記憶體片段、已渲染的 grounded Markdown，以及深度提升候選項，因此呼叫端需要 `operator.read`。
    - `sessions.usage` 會回傳每個工作階段的用量摘要。傳入 `agentId` 可指定單一
      代理，或傳入 `agentScope: "all"` 一併列出已設定代理。
    - `sessions.usage.timeseries` 會回傳單一工作階段的時間序列用量。
    - `sessions.usage.logs` 會回傳單一工作階段的用量記錄項目。

  </Accordion>

  <Accordion title="頻道與登入輔助工具">
    - `channels.status` 會回傳內建 + bundled 頻道/外掛狀態摘要。
    - `channels.logout` 會登出特定頻道/帳號，前提是該頻道支援登出。
    - `web.login.start` 會為目前具 QR 能力的網頁頻道供應商啟動 QR/網頁登入流程。
    - `web.login.wait` 會等待該 QR/網頁登入流程完成，並在成功時啟動頻道。
    - `push.test` 會傳送測試 APNs 推播到已註冊的 iOS 節點。
    - `voicewake.get` 會回傳已儲存的喚醒詞觸發器。
    - `voicewake.set` 會更新喚醒詞觸發器並廣播變更。

  </Accordion>

  <Accordion title="訊息與記錄">
    - `send` 是直接外送 RPC，用於聊天執行器之外，以頻道/帳號/對話串為目標的傳送。
    - `logs.tail` 會回傳已設定的閘道檔案記錄尾端，並具備游標/限制與最大位元組控制。

  </Accordion>

  <Accordion title="Talk 與 TTS">
    - `talk.catalog` 會回傳語音、串流轉錄和即時語音的唯讀 Talk 供應商目錄。它包含供應商 ID、標籤、設定狀態、公開的模型/語音 ID、標準模式、傳輸、腦策略，以及即時音訊/能力旗標，但不會回傳供應商秘密或變更全域設定。
    - `talk.config` 會回傳有效的 Talk 設定酬載；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.session.create` 會建立由閘道擁有的 Talk 工作階段，用於 `realtime/gateway-relay`、`transcription/gateway-relay` 或 `stt-tts/managed-room`。對於 `stt-tts/managed-room`，傳入 `sessionKey` 的 `operator.write` 呼叫端也必須傳入 `spawnedBy`，以取得限定範圍的工作階段金鑰可見性；未限定範圍的 `sessionKey` 建立與 `brain: "direct-tools"` 需要 `operator.admin`。
    - `talk.session.join` 會驗證 managed-room 工作階段權杖，視需要發出 `session.ready` 或 `session.replaced` 事件，並回傳房間/工作階段中繼資料與近期 Talk 事件，但不包含純文字權杖或已儲存的權杖雜湊。
    - `talk.session.appendAudio` 會將 base64 PCM 輸入音訊附加到由閘道擁有的即時轉送與轉錄工作階段。
    - `talk.session.startTurn`、`talk.session.endTurn` 和 `talk.session.cancelTurn` 會驅動 managed-room 回合生命週期，並在清除狀態前拒絕過期回合。
    - `talk.session.cancelOutput` 會停止助理音訊輸出，主要用於閘道轉送工作階段中由 VAD 閘控的插話。
    - `talk.session.submitToolResult` 會完成由閘道擁有的即時轉送工作階段所發出的供應商工具呼叫。當最終結果稍後會跟進時，傳入 `options: { willContinue: true }` 作為暫時工具輸出；或當工具結果應滿足供應商呼叫而不啟動另一個即時助理回應時，傳入 `options: { suppressResponse: true }`。
    - `talk.session.steer` 會將作用中執行的語音控制送入由閘道擁有、代理支援的 Talk 工作階段。它接受 `{ sessionId, text, mode? }`，其中 `mode` 是 `status`、`steer`、`cancel` 或 `followup`；省略模式時會從語音文字分類。
    - `talk.session.close` 會關閉由閘道擁有的轉送、轉錄或 managed-room 工作階段，並發出終端 Talk 事件。
    - `talk.mode` 會為 WebChat/Control UI 用戶端設定/廣播目前的 Talk 模式狀態。
    - `talk.client.create` 會使用 `webrtc` 或 `provider-websocket` 建立用戶端擁有的即時供應商工作階段，同時由閘道擁有設定、憑證、指示與工具政策。
    - `talk.client.toolCall` 允許用戶端擁有的即時傳輸將供應商工具呼叫轉送至閘道政策。第一個支援的工具是 `openclaw_agent_consult`；用戶端會收到執行 ID，並等待正常聊天生命週期事件後再提交供應商專屬的工具結果。
    - `talk.client.steer` 會為用戶端擁有的即時傳輸傳送作用中執行的語音控制。閘道會從 `sessionKey` 解析作用中的嵌入式執行，並回傳結構化的已接受/已拒絕結果，而不是靜默丟棄 steering。
    - `talk.event` 是即時、轉錄、STT/TTS、managed-room、電話語音與會議配接器的單一 Talk 事件頻道。
    - `talk.speak` 會透過作用中的 Talk 語音供應商合成語音。
    - `tts.status` 會回傳 TTS 啟用狀態、作用中供應商、後援供應商，以及供應商設定狀態。
    - `tts.providers` 會回傳可見的 TTS 供應商清單。
    - `tts.enable` 和 `tts.disable` 會切換 TTS 偏好設定狀態。
    - `tts.setProvider` 會更新偏好的 TTS 供應商。
    - `tts.convert` 會執行一次性文字轉語音轉換。

  </Accordion>

  <Accordion title="秘密、設定、更新與精靈">
    - `secrets.reload` 會重新解析作用中的 SecretRefs，並且只有在完全成功時才替換執行階段秘密狀態。
    - `secrets.resolve` 會解析特定命令/目標集的命令目標秘密指派。
    - `config.get` 會回傳目前設定快照與雜湊。
    - `config.set` 會寫入已驗證的設定酬載。
    - `config.patch` 會合併部分設定更新。破壞性的陣列
      替換需要在 `replacePaths` 中指定受影響路徑；陣列項目下的巢狀陣列使用 `[]` 路徑，例如 `agents.list[].skills`。
    - `config.apply` 會驗證 + 替換完整設定酬載。
    - `config.schema` 會回傳 Control UI 與命令列介面工具使用的即時設定結構描述酬載：結構描述、`uiHints`、版本與產生中繼資料，包含執行階段可載入時的外掛 + 頻道結構描述中繼資料。結構描述包含欄位 `title` / `description` 中繼資料，這些中繼資料衍生自 UI 使用的相同標籤與說明文字；當存在相符的欄位文件時，也包含巢狀物件、萬用字元、陣列項目，以及 `anyOf` / `oneOf` / `allOf` 組合分支。
    - `config.schema.lookup` 會為單一設定路徑回傳限定路徑的查詢酬載：正規化路徑、淺層結構描述節點、相符提示 + `hintPath`、選用的 `reloadKind`，以及供 UI/命令列介面深入檢視的直接子項摘要。`reloadKind` 是 `restart`、`hot` 或 `none` 之一，並鏡像請求路徑的閘道設定重新載入規劃器。查詢結構描述節點會保留面向使用者的文件與常見驗證欄位（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、數字/字串/陣列/物件界限，以及 `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` 等旗標）。子項摘要會公開 `key`、正規化 `path`、`type`、`required`、`hasChildren`、選用的 `reloadKind`，以及相符的 `hint` / `hintPath`。
    - `update.run` 會執行閘道更新流程，並且只有在更新本身成功時才排程重新啟動；具備工作階段的呼叫端可包含 `continuationMessage`，讓啟動時透過重新啟動延續佇列恢復一個後續代理回合。來自控制平面的套件管理器更新與受監督的 git-checkout 更新，會使用分離式 managed-service handoff，而不是在即時閘道內替換套件樹或變更 checkout/build 輸出。已啟動的 handoff 會回傳 `ok: true`，並帶有 `result.reason: "managed-service-handoff-started"` 與 `handoff.status: "started"`；無法使用或失敗的 handoff 會回傳 `ok: false`，並帶有 `managed-service-handoff-unavailable` 或 `managed-service-handoff-failed`，另外在需要手動 shell 更新時包含 `handoff.command`。無法使用的 handoff 表示 OpenClaw 缺少安全的監督者邊界或持久服務身分，例如 systemd 的 `OPENCLAW_SYSTEMD_UNIT`。在已啟動的 handoff 期間，重新啟動哨兵可能短暫回報 `stats.reason: "restart-health-pending"`；延續會延後到命令列介面驗證重新啟動後的閘道並寫入最終 `ok` 哨兵為止。
    - `update.status` 會重新整理並回傳最新的更新重新啟動哨兵，包含可用時重新啟動後的執行版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 會透過 WS RPC 公開入門精靈。

  </Accordion>

  <Accordion title="代理程式與工作區輔助方法">
    - `agents.list` 會傳回已設定的代理程式項目，包括有效模型與執行階段中繼資料。
    - `agents.create`、`agents.update` 和 `agents.delete` 會管理代理程式記錄與工作區接線。
    - `agents.files.list`、`agents.files.get` 和 `agents.files.set` 會管理公開給代理程式的啟動工作區檔案。
    - `tasks.list`、`tasks.get` 和 `tasks.cancel` 會將閘道任務帳本公開給 SDK 與操作者用戶端。
    - `artifacts.list`、`artifacts.get` 和 `artifacts.download` 會針對明確的 `sessionKey`、`runId` 或 `taskId` 範圍，公開轉錄衍生的成果摘要與下載。執行與任務查詢會在伺服器端解析所屬工作階段，且只會傳回來源相符的轉錄媒體；不安全或本機 URL 來源會傳回不支援的下載，而不是在伺服器端擷取。
    - `environments.list` 和 `environments.status` 會向 SDK 用戶端公開唯讀的閘道本機與節點環境探索。
    - `agent.identity.get` 會傳回代理程式或工作階段的有效助理身分。
    - `agent.wait` 會等待執行完成，並在可用時傳回終止快照。

  </Accordion>

  <Accordion title="工作階段控制">
    - `sessions.list` 會傳回目前的工作階段索引，包含每列在已設定代理程式執行階段後端時的 `agentRuntime` 中繼資料。
    - `sessions.subscribe` 和 `sessions.unsubscribe` 會切換目前 WS 用戶端的工作階段變更事件訂閱。
    - `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 會切換單一工作階段的轉錄/訊息事件訂閱。
    - `sessions.preview` 會傳回特定工作階段鍵的有界轉錄預覽。
    - `sessions.describe` 會針對精確的工作階段鍵傳回一列閘道工作階段。
    - `sessions.resolve` 會解析或正規化工作階段目標。
    - `sessions.create` 會建立新的工作階段項目。
    - `sessions.send` 會將訊息傳送到現有工作階段。
    - `sessions.steer` 是作用中工作階段的中斷並導向變體。
    - `sessions.abort` 會中止工作階段的作用中工作。呼叫端可以傳入 `key` 加上選用的 `runId`，或只針對閘道可解析為工作階段的作用中執行傳入 `runId`。
    - `sessions.patch` 會更新工作階段中繼資料/覆寫，並回報已解析的正規模型加上有效的 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 和 `sessions.compact` 會執行工作階段維護。
    - `sessions.get` 會傳回完整儲存的工作階段列。
    - 聊天執行仍使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。`chat.history` 已針對 UI 用戶端做顯示正規化：內嵌指令標籤會從可見文字中移除，純文字工具呼叫 XML 承載（包含 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和遭截斷的工具呼叫區塊）以及外洩的 ASCII/全形模型控制權杖會被移除，像精確 `NO_REPLY` / `no_reply` 這類純靜默權杖助理列會被省略，過大的列則可替換為預留位置。
    - `chat.message.get` 是新增的有界完整訊息讀取器，用於單一可見轉錄項目。用戶端傳入 `sessionKey`、在工作階段選取以代理程式為範圍時選用的 `agentId`，再加上先前透過 `chat.history` 顯示的轉錄 `messageId`；當儲存的項目仍可用且未過大時，閘道會傳回相同的顯示正規化投影，但不套用輕量歷史記錄截斷上限。
    - `chat.send` 接受單回合 `fastMode: "auto"`，以便對自動截止前啟動的模型呼叫使用快速模式，之後再啟動稍後的重試、備援、工具結果或延續呼叫時不使用快速模式。截止預設為 60 秒，且可用 `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` 逐模型設定。`chat.send` 呼叫端可以傳入單回合 `fastAutoOnSeconds`，以覆寫該請求的截止時間。

  </Accordion>

  <Accordion title="裝置配對與裝置權杖">
    - `device.pair.list` 會傳回待處理與已核准的配對裝置。
    - `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 會管理裝置配對記錄。
    - `device.token.rotate` 會在已核准角色與呼叫端範圍界線內輪替配對裝置權杖。
    - `device.token.revoke` 會在已核准角色與呼叫端範圍界線內撤銷配對裝置權杖。

  </Accordion>

  <Accordion title="節點配對、呼叫與待處理工作">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove` 和 `node.pair.verify` 涵蓋節點配對與啟動驗證。
    - `node.list` 和 `node.describe` 會傳回已知/已連線的節點狀態。
    - `node.rename` 會更新配對節點標籤。
    - `node.invoke` 會將命令轉送至已連線節點。
    - `node.invoke.result` 會傳回呼叫請求的結果。
    - `node.event` 會將節點來源事件帶回閘道。
    - `node.pending.pull` 和 `node.pending.ack` 是已連線節點佇列 API。
    - `node.pending.enqueue` 和 `node.pending.drain` 會管理離線/已中斷連線節點的耐久待處理工作。

  </Accordion>

  <Accordion title="核准系列">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 涵蓋一次性 exec 核准請求，以及待處理核准查詢/重播。
    - `exec.approval.waitDecision` 會等待一個待處理 exec 核准，並傳回最終決策（逾時則為 `null`）。
    - `exec.approvals.get` 和 `exec.approvals.set` 會管理閘道 exec 核准政策快照。
    - `exec.approvals.node.get` 和 `exec.approvals.node.set` 會透過節點轉送命令管理節點本機 exec 核准政策。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 涵蓋外掛定義的核准流程。

  </Accordion>

  <Accordion title="自動化、Skills 與工具">
    - 自動化：`wake` 會排程立即或下一次心跳偵測的喚醒文字注入；`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 會管理已排程工作。
    - `cron.run` 仍是用於手動執行的佇列式 RPC。需要完成語意的用戶端應讀取傳回的 `runId`，並輪詢 `cron.runs`。
    - `cron.runs` 接受選用的非空 `runId` 篩選器，讓用戶端可以追蹤一個已排入佇列的手動執行，而不會與相同工作的其他歷史項目競爭。
    - Skills 與工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 常見事件系列

- `chat`：UI 聊天更新，例如 `chat.inject` 和其他僅轉錄的聊天
  事件。在協定 v4 中，差異承載會帶有 `deltaText`；`message` 仍是
  累積的助理快照。非前綴替換會設定 `replace=true`，
  並使用 `deltaText` 作為替換文字。
- `session.message`、`session.operation` 和 `session.tool`：已訂閱
  工作階段的轉錄、進行中工作階段操作，以及事件串流更新。
- `sessions.changed`：工作階段索引或中繼資料已變更。
- `presence`：系統存在狀態快照更新。
- `tick`：週期性 keepalive / 存活事件。
- `health`：閘道健康狀態快照更新。
- `heartbeat`：心跳偵測事件串流更新。
- `cron`：排程執行/工作變更事件。
- `shutdown`：閘道關閉通知。
- `node.pair.requested` / `node.pair.resolved`：節點配對生命週期。
- `node.invoke.request`：節點呼叫請求廣播。
- `device.pair.requested` / `device.pair.resolved`：配對裝置生命週期。
- `voicewake.changed`：喚醒詞觸發設定已變更。
- `exec.approval.requested` / `exec.approval.resolved`：exec 核准
  生命週期。
- `plugin.approval.requested` / `plugin.approval.resolved`：外掛核准
  生命週期。

### 節點輔助方法

- 節點可以呼叫 `skills.bins`，以擷取目前的 Skills 可執行檔清單，
  供自動允許檢查使用。

### 任務帳本 RPC

操作者用戶端可以透過任務帳本 RPC 檢查並取消閘道背景任務記錄。
這些方法會傳回已清理的任務摘要，而不是原始執行階段狀態。

- `tasks.list` 需要 `operator.read`。
  - 參數：選用的 `status`（`"queued"`、`"running"`、`"completed"`、
    `"failed"`、`"cancelled"` 或 `"timed_out"`）或這些狀態的陣列、
    選用的 `agentId`、選用的 `sessionKey`、從 `1` 到
    `500` 的選用 `limit`，以及選用字串 `cursor`。
  - 結果：`{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` 需要 `operator.read`。
  - 參數：`{ "taskId": string }`。
  - 結果：`{ "task": TaskSummary }`。
  - 缺少的任務 ID 會傳回閘道 not-found 錯誤形狀。
- `tasks.cancel` 需要 `operator.write`。
  - 參數：`{ "taskId": string, "reason"?: string }`。
  - 結果：
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` 回報帳本是否有相符任務。`cancelled`
    回報執行階段是否接受或記錄了取消。

`TaskSummary` 包含 `id`、`status`，以及選用中繼資料，例如 `kind`、
`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、
`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、時間戳記、進度、
終止摘要，以及已清理的錯誤文字。`agentId` 識別執行任務的代理程式；
`sessionKey` 和 `ownerKey` 會保留請求者與控制脈絡。

### 操作者輔助方法

- 操作員可以呼叫 `commands.list`（`operator.read`）以擷取代理的執行階段
  命令清單。
  - `agentId` 為選用；省略即可讀取預設代理工作區。
  - `scope` 控制主要 `name` 目標指向哪個介面：
    - `text` 會傳回不含前置 `/` 的主要文字命令權杖
    - `native` 與預設的 `both` 路徑會在可用時傳回具提供者感知能力的原生命令名稱
  - `textAliases` 會攜帶精確的斜線別名，例如 `/model` 與 `/m`。
  - `nativeName` 會在存在時攜帶具提供者感知能力的原生命令名稱。
  - `provider` 為選用，且只會影響原生命名以及原生外掛命令可用性。
  - `includeArgs=false` 會從回應中省略序列化的引數中繼資料。
- 操作員可以呼叫 `tools.catalog`（`operator.read`）以擷取代理的執行階段工具目錄。回應包含已分組工具與來源中繼資料：
  - `source`：`core` 或 `plugin`
  - `pluginId`：當 `source="plugin"` 時的外掛擁有者
  - `optional`：外掛工具是否為選用
- 操作員可以呼叫 `tools.effective`（`operator.read`）以擷取工作階段的執行階段有效工具
  清單。
  - `sessionKey` 為必填。
  - 閘道會從伺服器端的工作階段衍生受信任的執行階段脈絡，而不是接受
    呼叫者提供的驗證或遞送脈絡。
  - 回應是以工作階段為範圍、由伺服器衍生的作用中清單投影，
    包含核心、外掛、通道，以及已探索的 MCP 伺服器工具。
  - `tools.effective` 對 MCP 是唯讀的：它可以將已暖機的工作階段 MCP 目錄透過
    最終工具政策投影，但不會建立 MCP 執行階段、連接傳輸，或發出
    `tools/list`。如果沒有相符的已暖機目錄，回應可能包含如
    `mcp-not-yet-connected`、`mcp-not-yet-listed` 或 `mcp-stale-catalog` 的通知。
  - 有效工具項目會使用 `source="core"`、`source="plugin"`、`source="channel"` 或
    `source="mcp"`。
- 操作員可以呼叫 `tools.invoke`（`operator.write`），透過與 `/tools/invoke` 相同的
  閘道政策路徑叫用一個可用工具。
  - `name` 為必填。`args`、`sessionKey`、`agentId`、`confirm` 與
    `idempotencyKey` 為選用。
  - 如果同時存在 `sessionKey` 與 `agentId`，解析出的工作階段代理必須符合
    `agentId`。
  - 僅限擁有者的核心包裝器，例如 `cron`、`gateway` 與 `nodes`，需要
    擁有者/管理員身分（`operator.admin`），即使 `tools.invoke`
    方法本身是 `operator.write`。
  - 回應是面向 SDK 的封套，包含 `ok`、`toolName`、選用的 `output`，以及具型別的
    `error` 欄位。核准或政策拒絕會在酬載中傳回 `ok:false`，而不是
    繞過閘道工具政策管線。
- 操作員可以呼叫 `skills.status`（`operator.read`）以擷取代理可見的
  技能清單。
  - `agentId` 為選用；省略即可讀取預設代理工作區。
  - 回應包含資格、缺少的需求、設定檢查，以及
    已清理的安裝選項，而不會暴露原始秘密值。
- 操作員可以呼叫 `skills.search` 與 `skills.detail`（`operator.read`）以取得
  ClawHub 探索中繼資料。
- 操作員可以呼叫 `skills.upload.begin`、`skills.upload.chunk` 與
  `skills.upload.commit`（`operator.admin`），在安裝前暫存私有技能封存檔。
  這是給受信任用戶端使用的獨立管理員上傳路徑，
  不是一般的 ClawHub 技能安裝流程，且預設停用，除非
  啟用 `skills.install.allowUploadedArchives`。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    會建立繫結到該 slug 與 force 值的上傳。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` 會在
    精確的解碼偏移量附加位元組。
  - `skills.upload.commit({ uploadId, sha256? })` 會驗證最終大小與
    SHA-256。提交只會完成上傳；不會安裝技能。
  - 已上傳的技能封存檔是包含 `SKILL.md` 根目錄的 zip 封存檔。封存檔的
    內部目錄名稱絕不會選擇安裝目標。
- 操作員可以用三種模式呼叫 `skills.install`（`operator.admin`）：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 會將
    技能資料夾安裝到預設代理工作區的 `skills/` 目錄。
  - 上傳模式：`{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    會將已提交的上傳安裝到預設代理工作區的 `skills/<slug>`
    目錄。slug 與 force 值必須符合原始的
    `skills.upload.begin` 請求。除非啟用
    `skills.install.allowUploadedArchives`，否則此模式會遭拒。此設定不會
    影響 ClawHub 安裝。
  - 閘道安裝器模式：`{ name, installId, timeoutMs? }`
    會在閘道主機上執行宣告的 `metadata.openclaw.install` 動作。
    較舊的用戶端仍可能傳送 `dangerouslyForceUnsafeInstall`；此欄位已
    棄用，僅為了通訊協定相容性而接受，並會被忽略。請使用
    `security.installPolicy` 來處理操作員擁有的安裝決策。
- 操作員可以用兩種模式呼叫 `skills.update`（`operator.admin`）：
  - ClawHub 模式會更新預設代理工作區中的一個追蹤 slug，或所有追蹤的 ClawHub 安裝。
  - 設定模式會修補 `skills.entries.<skillKey>` 值，例如 `enabled`、
    `apiKey` 與 `env`。

### `models.list` 檢視

`models.list` 接受選用的 `view` 參數：

- 省略或 `"default"`：目前的執行階段行為。如果已設定 `agents.defaults.models`，回應會是允許的目錄，包含針對 `provider/*` 項目動態探索出的模型。否則回應會是完整的閘道目錄。
- `"configured"`：適合選擇器大小的行為。如果已設定 `agents.defaults.models`，它仍會優先，包括針對 `provider/*` 項目的提供者範圍探索。沒有允許清單時，回應會使用明確的 `models.providers.*.models` 項目，只有在沒有已設定模型列時才退回完整目錄。
- `"all"`：完整的閘道目錄，略過 `agents.defaults.models`。請將此用於診斷與探索 UI，而非一般模型選擇器。

## Exec 核准

- 當 exec 請求需要核准時，閘道會廣播 `exec.approval.requested`。
- 操作員用戶端透過呼叫 `exec.approval.resolve` 來解析（需要 `operator.approvals` 範圍）。
- 對於 `host=node`，`exec.approval.request` 必須包含 `systemRunPlan`（標準 `argv`/`cwd`/`rawCommand`/工作階段中繼資料）。缺少 `systemRunPlan` 的請求會遭拒。
- 核准後，轉送的 `node.invoke system.run` 呼叫會重用該標準
  `systemRunPlan` 作為具權威性的命令/cwd/工作階段脈絡。
- 如果呼叫者在準備與最終已核准的 `system.run` 轉送之間變更 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，閘道會拒絕該執行，而不是信任已變更的酬載。

## 代理遞送後援

- `agent` 請求可以包含 `deliver=true` 以要求對外遞送。
- `bestEffortDeliver=false` 會維持嚴格行為：無法解析或僅供內部使用的遞送目標會傳回 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允許在無法解析外部可遞送路由時，退回僅工作階段執行（例如內部/webchat 工作階段或模糊的多通道設定）。
- 最終 `agent` 結果在要求遞送時可能包含 `result.deliveryStatus`，
  使用與 [`openclaw agent --json --deliver`](/zh-TW/cli/agent#json-delivery-status) 文件相同的
  `sent`、`suppressed`、`partial_failed` 與 `failed`
  狀態。

## 版本控管

- `PROTOCOL_VERSION` 位於 `packages/gateway-protocol/src/version.ts`。
- 用戶端會傳送 `minProtocol` + `maxProtocol`；伺服器會拒絕
  不包含其目前通訊協定的範圍。目前的用戶端與伺服器需要
  通訊協定 v4。
- 結構描述與模型由 TypeBox 定義產生：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 用戶端常數

`src/gateway/client.ts` 中的參考用戶端使用這些預設值。值在
通訊協定 v4 中保持穩定，且是第三方用戶端的預期基準。

| 常數                                      | 預設值                                                | 來源                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| 請求逾時（每個 RPC）                      | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| 預驗證 / 連線挑戰逾時                     | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（config/env 可以提高配對的伺服器/用戶端預算）          |
| 初始重新連線退避                          | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| 最大重新連線退避                          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| 裝置權杖關閉後的快速重試限制              | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前的強制停止寬限            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` 預設逾時                  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| 預設 tick 間隔（`hello-ok` 前）            | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| tick 逾時關閉                             | 當靜默超過 `tickIntervalMs * 2` 時使用 code `4000`    | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

伺服器會在 `hello-ok` 中宣告有效的 `policy.tickIntervalMs`、`policy.maxPayload`
與 `policy.maxBufferedBytes`；用戶端應遵循這些值，
而不是握手前的預設值。

## 驗證

- 共享密鑰閘道驗證會使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，取決於設定的驗證模式。
- 帶有身分的模式，例如 Tailscale Serve
  (`gateway.auth.allowTailscale: true`) 或非回送的
  `gateway.auth.mode: "trusted-proxy"`，會從請求標頭滿足 connect 驗證檢查，
  而不是使用 `connect.params.auth.*`。
- 私有入口 `gateway.auth.mode: "none"` 會完全略過共享密鑰 connect 驗證；
  請勿在公開/不受信任的入口暴露該模式。
- 配對後，閘道會發出範圍限於連線角色 + scopes 的**裝置權杖**。
  它會在 `hello-ok.auth.deviceToken` 中傳回，且用戶端應將其持久保存，
  供未來連線使用。
- 用戶端應在任何成功連線後，持久保存主要的 `hello-ok.auth.deviceToken`。
- 使用該**已儲存**的裝置權杖重新連線時，也應重用該權杖已儲存的
  已核准 scope 集合。這會保留先前已授予的讀取/探測/狀態存取權，
  並避免重新連線悄悄縮減為較窄的隱含僅管理員 scope。
- 用戶端 connect 驗證組裝（`src/gateway/client.ts` 中的 `selectConnectAuth`）：
  - `auth.password` 是正交的，設定時一律會轉送。
  - `auth.token` 會依優先順序填入：先使用明確的共享權杖，
    然後是明確的 `deviceToken`，再來是已儲存的每裝置權杖
    （以 `deviceId` + `role` 為鍵）。
  - 只有在上述任一項都未解析出 `auth.token` 時，才會傳送
    `auth.bootstrapToken`。共享權杖或任何已解析的裝置權杖都會抑制它。
  - 在一次性 `AUTH_TOKEN_MISMATCH` 重試中，自動提升已儲存裝置權杖
    只允許用於**受信任端點**：回送，或具備釘選 `tlsFingerprint` 的
    `wss://`。未釘選的公開 `wss://` 不符合資格。
- 內建設定碼 bootstrap 會傳回主要節點
  `hello-ok.auth.deviceToken`，以及 `hello-ok.auth.deviceTokens` 中
  用於受信任行動交接的有界操作員權杖。操作員權杖包含
  `operator.talk.secrets`，用於原生 Talk 設定讀取，並排除
  `operator.admin` 與 `operator.pairing`。
- 當非基準設定碼 bootstrap 正在等待核准時，`PAIRING_REQUIRED`
  詳細資料會包含 `recommendedNextStep: "wait_then_retry"`、`retryable: true`
  和 `pauseReconnect: false`。用戶端應持續使用同一個 bootstrap 權杖
  重新連線，直到請求獲准或權杖失效。
- 只有在 connect 使用 bootstrap 驗證，且傳輸為受信任傳輸（例如
  `wss://` 或回送/本機配對）時，才持久保存 `hello-ok.auth.deviceTokens`。
- 如果用戶端提供**明確**的 `deviceToken` 或明確的 `scopes`，
  則呼叫者要求的 scope 集合仍為權威來源；快取 scope 只會在用戶端
  重用已儲存的每裝置權杖時使用。
- 裝置權杖可透過 `device.token.rotate` 和 `device.token.revoke`
  輪替/撤銷（需要 `operator.pairing` scope）。輪替或撤銷節點或其他
  非操作員角色也需要 `operator.admin`。
- `device.token.rotate` 會傳回輪替中繼資料。它只會在同裝置呼叫且該呼叫
  已使用該裝置權杖驗證時，回應替換用的 bearer 權杖，因此僅權杖用戶端
  可以在重新連線前持久保存替換權杖。共享/管理員輪替不會回應 bearer 權杖。
- 權杖發行、輪替與撤銷都會限制在該裝置配對項目中記錄的已核准角色集合內；
  權杖異動無法擴大或指向配對核准從未授予的裝置角色。
- 對於已配對裝置的權杖工作階段，除非呼叫者也具備 `operator.admin`，
  否則裝置管理是自我範圍限定的：非管理員呼叫者只能管理其**自己**
  裝置項目的操作員權杖。節點與其他非操作員權杖管理僅限管理員，
  即使是呼叫者自己的裝置也一樣。
- `device.token.rotate` 和 `device.token.revoke` 也會檢查目標操作員
  權杖的 scope 集合，是否符合呼叫者目前的工作階段 scopes。非管理員
  呼叫者不能輪替或撤銷比自己已持有範圍更廣的操作員權杖。
- 驗證失敗會包含 `error.details.code` 以及復原提示：
  - `error.details.canRetryWithDeviceToken`（布林值）
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` 的用戶端行為：
  - 受信任用戶端可以使用快取的每裝置權杖嘗試一次有界重試。
  - 如果該重試失敗，用戶端應停止自動重新連線迴圈，並呈現操作員動作指引。
- `AUTH_SCOPE_MISMATCH` 表示裝置權杖已被辨識，但未涵蓋所要求的角色/scopes。
  用戶端不應將此呈現為錯誤權杖；請提示操作員重新配對，或核准較窄/較寬的
  scope 合約。

## 裝置身分 + 配對

- 節點應包含由金鑰組指紋衍生的穩定裝置身分 (`device.id`)。
- 閘道會依裝置 + 角色發行權杖。
- 除非已啟用本機自動核准，否則新的裝置 ID 需要配對核准。
- 配對自動核准以直接 local loopback 連線為中心。
- OpenClaw 也有一條狹窄的後端/容器本機自我連線路徑，
  用於受信任的共享密鑰輔助流程。
- 同主機 tailnet 或 LAN 連線在配對上仍視為遠端，並需要核准。
- WS 用戶端通常會在 `connect` 期間包含 `device` 身分（操作員 +
  節點）。唯一不帶裝置的操作員例外，是明確的信任路徑：
  - `gateway.controlUi.allowInsecureAuth=true`，用於僅限 localhost 的不安全 HTTP 相容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` 操作員控制 UI 驗證。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急破窗，嚴重降低安全性）。
  - 保留內部輔助路徑上的直接回送 `gateway-client` 後端 RPC。
- 省略裝置身分會有 scope 後果。當不帶裝置的操作員連線透過明確的信任路徑
  獲准時，OpenClaw 仍會將自我宣告的 scopes 清為空集合，除非該路徑具有
  具名的 scope 保留例外。受 scope 控制的方法接著會因 `missing scope` 失敗。
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` 是控制 UI 的緊急破窗
  scope 保留路徑。它不會向任意自訂後端或命令列介面形態的 WebSocket
  用戶端授予 scopes。
- 保留的直接回送 `gateway-client` 後端輔助路徑，只會為內部本機控制平面
  RPC 保留 scopes；自訂後端 ID 不會取得此例外。
- 所有連線都必須簽署伺服器提供的 `connect.challenge` nonce。

### 裝置驗證遷移診斷

對於仍使用挑戰前簽署行為的舊版用戶端，`connect` 現在會在
`error.details.code` 下傳回 `DEVICE_AUTH_*` 詳細代碼，並提供穩定的
`error.details.reason`。

常見遷移失敗：

| 訊息                        | details.code                     | details.reason           | 意義                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 用戶端省略 `device.nonce`（或傳送空白）。          |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 用戶端使用過期/錯誤的 nonce 簽署。                |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 簽章承載與 v2 承載不相符。                        |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 已簽署時間戳超出允許偏移。                        |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 與公開金鑰指紋不相符。                |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開金鑰格式/正規化失敗。                         |

遷移目標：

- 一律等待 `connect.challenge`。
- 簽署包含伺服器 nonce 的 v2 承載。
- 在 `connect.params.device.nonce` 中傳送相同 nonce。
- 偏好的簽章承載為 `v3`，除了 device/client/role/scopes/token/nonce
  欄位外，也會綁定 `platform` 和 `deviceFamily`。
- 舊版 `v2` 簽章仍會為了相容性而接受，但已配對裝置的中繼資料釘選
  仍會控制重新連線時的命令政策。

## TLS + 釘選

- WS 連線支援 TLS。
- 用戶端可以選擇性釘選閘道憑證指紋（請參閱 `gateway.tls`
  設定，以及 `gateway.remote.tlsFingerprint` 或命令列介面
  `--tls-fingerprint`）。

## 範圍

此協定暴露**完整閘道 API**（狀態、頻道、模型、聊天、
代理程式、工作階段、節點、核准等）。確切介面由
`packages/gateway-protocol/src/schema.ts` 中的 TypeBox schemas 定義。

## 相關

- [橋接協定](/zh-TW/gateway/bridge-protocol)
- [閘道操作手冊](/zh-TW/gateway)
