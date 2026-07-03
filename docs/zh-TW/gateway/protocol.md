---
read_when:
    - 實作或更新閘道 WS 用戶端
    - 偵錯協定不相符或連線失敗
    - 重新產生協定結構描述/模型
summary: 閘道 WebSocket 協定：交握、框架、版本控管
title: 閘道協定
x-i18n:
    generated_at: "2026-07-03T13:16:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 815ac729824587579d112d665df2060d84d2894b4d46235e210804ca8a07082d
    source_path: gateway/protocol.md
    workflow: 16
---

閘道 WS 協定是 OpenClaw 的**單一控制平面 + 節點傳輸**。所有用戶端（命令列介面、網頁 UI、macOS app、iOS/Android 節點、無介面節點）都透過 WebSocket 連線，並在握手時宣告其**角色** + **範圍**。

## 傳輸

- WebSocket，帶有 JSON 承載資料的文字框架。
- 第一個框架**必須**是 `connect` 請求。
- 連線前框架上限為 64 KiB。成功握手後，用戶端應遵循 `hello-ok.policy.maxPayload` 和 `hello-ok.policy.maxBufferedBytes` 限制。啟用診斷時，過大的入站框架和緩慢的出站緩衝區會在閘道關閉或丟棄受影響框架前發出 `payload.large` 事件。這些事件會保留大小、限制、介面和安全原因碼。它們不會保留訊息本文、附件內容、原始框架本文、權杖、Cookie 或秘密值。

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

當閘道仍在完成啟動 sidecar 時，`connect` 請求可能會回傳可重試的 `UNAVAILABLE` 錯誤，且 `details.reason` 設為 `"startup-sidecars"` 並帶有 `retryAfterMs`。用戶端應在其整體連線預算內重試該回應，而不是將其顯示為終止性的握手失敗。

`server`、`features`、`snapshot` 和 `policy` 都是架構要求的必要欄位（`packages/gateway-protocol/src/schema/frames.ts`）。`auth` 也是必要欄位，並回報協商後的角色/範圍。`pluginSurfaceUrls` 是選用欄位，會將外掛介面名稱（例如 `canvas`）對應到具範圍限制的託管 URL。

具範圍限制的外掛介面 URL 可能會過期。節點可以呼叫 `node.pluginSurface.refresh` 並傳入 `{ "surface": "canvas" }`，以在 `pluginSurfaceUrls` 中收到新的項目。實驗性的 Canvas 外掛重構不支援已棄用的 `canvasHostUrl`、`canvasCapability` 或 `node.canvas.capability.refresh` 相容路徑；目前的原生用戶端和閘道必須使用外掛介面。

未發出裝置權杖時，`hello-ok.auth` 會回報協商後的權限，且不含權杖欄位：

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

受信任的同處理序後端用戶端（`client.id: "gateway-client"`、`client.mode: "backend"`）在使用共用閘道權杖/密碼驗證時，可在直接 local loopback 連線上省略 `device`。此路徑保留給內部控制平面 RPC，並避免過時的命令列介面/裝置配對基準阻擋本機後端工作，例如子代理程式工作階段更新。遠端用戶端、瀏覽器來源用戶端、節點用戶端，以及明確使用裝置權杖/裝置身分的用戶端，仍會使用正常的配對與範圍升級檢查。

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

內建 QR/設定碼啟動程序是一條新的行動交接路徑。成功的基準設定碼連線會回傳主要節點權杖，以及一個有界限的操作者權杖：

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

操作者交接刻意設有界限，讓 QR onboarding 可以啟動行動操作者迴圈並完成原生設定，而不授予配對變更範圍或 `operator.admin`。它包含 `operator.talk.secrets`，因此原生用戶端可在啟動程序後讀取所需的 Talk 設定。更廣泛的配對與管理員存取需要另一個已核准的操作者配對或權杖流程。用戶端只有在連線使用受信任傳輸（例如 `wss://` 或 loopback/本機配對）上的啟動驗證時，才應保存 `hello-ok.auth.deviceTokens`。

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

## 框架格式

- **請求**：`{type:"req", id, method, params}`
- **回應**：`{type:"res", id, ok, payload|error}`
- **事件**：`{type:"event", event, payload, seq?, stateVersion?}`

具有副作用的方法需要**冪等鍵**（請參閱架構）。

## 角色 + 範圍

完整的操作者範圍模型、核准時檢查和共用秘密語意，請參閱[操作者範圍](/zh-TW/gateway/operator-scopes)。

### 角色

- `operator` = 控制平面用戶端（命令列介面/UI/自動化）。
- `node` = 功能主機（camera/screen/canvas/system.run）。

### 範圍（操作者）

常見範圍：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

帶有 `includeSecrets: true` 的 `talk.config` 需要 `operator.talk.secrets`（或 `operator.admin`）。
包含秘密時，用戶端應從 `talk.resolved.config.apiKey` 讀取作用中的 Talk 提供者憑證；`talk.providers.<id>.apiKey` 會維持來源形狀，可能是 SecretRef 物件或已遮蔽字串。

外掛註冊的閘道 RPC 方法可要求自己的操作者範圍，但保留的核心管理前綴（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）一律解析為 `operator.admin`。

方法範圍只是第一道關卡。某些透過 `chat.send` 到達的斜線命令會在其上套用更嚴格的命令層級檢查。例如，持久性 `/config set` 和 `/config unset` 寫入需要 `operator.admin`。

`node.pair.approve` 除了基礎方法範圍外，在核准時也有額外的範圍檢查：

- 無命令請求：`operator.pairing`
- 含非 exec 節點命令的請求：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的請求：
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions（節點）

節點在連線時宣告功能主張：

- `caps`：高層級功能類別，例如 `camera`、`canvas`、`screen`、`location`、`voice` 和 `talk`。
- `commands`：供 invoke 使用的命令允許清單。
- `permissions`：細粒度切換（例如 `screen.record`、`camera.capture`）。

閘道會將這些視為**主張**，並強制套用伺服器端允許清單。

## 在線狀態

- `system-presence` 會回傳以裝置身分為鍵的項目。
- 在線狀態項目包含 `deviceId`、`roles` 和 `scopes`，因此即使裝置同時以**操作者**和**節點**身分連線，UI 仍可為每個裝置顯示單一列。
- `node.list` 包含選用的 `lastSeenAtMs` 和 `lastSeenReason` 欄位。已連線節點會將目前連線時間回報為 `lastSeenAtMs`，原因為 `connect`；當受信任的節點事件更新其配對中繼資料時，已配對節點也可以回報持久的背景在線狀態。

### 節點背景存活事件

節點可呼叫 `node.event` 並帶有 `event: "node.presence.alive"`，以記錄已配對節點在背景喚醒期間仍然存活，而不將其標記為已連線。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是封閉列舉：`background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual` 或 `connect`。未知的觸發字串會在保存前由閘道正規化為 `background`。此事件只有對已驗證的節點裝置工作階段才具持久性；無裝置或未配對的工作階段會回傳 `handled: false`。

成功的閘道會回傳結構化結果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

較舊的閘道仍可能對 `node.event` 回傳 `{ "ok": true }`；用戶端應將其視為已確認的 RPC，而不是持久在線狀態保存。

## 廣播事件範圍界定

伺服器推送的 WebSocket 廣播事件會經過範圍閘控，因此僅具配對範圍或僅節點的工作階段不會被動接收工作階段內容。

- **聊天、代理程式和工具結果框架**（包含串流 `agent` 事件和工具呼叫結果）至少需要 `operator.read`。沒有 `operator.read` 的工作階段會完全跳過這些框架。
- **外掛定義的 `plugin.*` 廣播**會依外掛註冊方式，閘控至 `operator.write` 或 `operator.admin`。
- **狀態與傳輸事件**（`heartbeat`、`presence`、`tick`、連線/中斷連線生命週期等）維持不受限制，因此每個已驗證工作階段都可觀察傳輸健康狀態。
- **未知的廣播事件家族**預設會受範圍閘控（失敗關閉），除非已註冊的處理常式明確放寬限制。

每個用戶端連線都會保留自己的逐用戶端序號，因此即使不同用戶端看到事件串流中不同的範圍過濾子集，廣播仍會在該 socket 上維持單調排序。

## 常見 RPC 方法家族

公開 WS 介面比上方的握手/驗證範例更廣。這不是產生出的傾印 — `hello-ok.features.methods` 是由 `src/gateway/server-methods-list.ts` 加上已載入外掛/通道方法匯出建立的保守探索清單。請將其視為功能探索，而不是 `src/gateway/server-methods/*.ts` 的完整列舉。

  <AccordionGroup>
  <Accordion title="系統與身分識別">
    - `health` 會傳回快取或新近探測的閘道健康狀態快照。
    - `diagnostics.stability` 會傳回近期有界的診斷穩定性記錄器。它保留作業中繼資料，例如事件名稱、計數、位元組大小、記憶體讀數、佇列/工作階段狀態、通道/外掛名稱，以及工作階段 ID。它不保留聊天文字、網路鉤子本文、工具輸出、原始請求或回應本文、權杖、Cookie 或密鑰值。需要 operator 讀取範圍。
    - `status` 會傳回 `/status` 樣式的閘道摘要；敏感欄位只會包含在具 admin 範圍的 operator 用戶端中。
    - `gateway.identity.get` 會傳回 relay 與配對流程使用的閘道裝置身分識別。
    - `system-presence` 會傳回已連線 operator/節點裝置的目前 presence 快照。
    - `system-event` 會附加系統事件，並可更新/廣播 presence 情境。
    - `last-heartbeat` 會傳回最新持久化的心跳偵測事件。
    - `set-heartbeats` 會切換閘道上的心跳偵測處理。

  </Accordion>

  <Accordion title="模型與用量">
    - `models.list` 會傳回執行階段允許的模型目錄。傳入 `{ "view": "configured" }` 可取得適合選擇器大小的已設定模型（先是 `agents.defaults.models`，再是 `models.providers.*.models`），或傳入 `{ "view": "all" }` 取得完整目錄。
    - `usage.status` 會傳回 provider 用量視窗/剩餘配額摘要。
    - `usage.cost` 會傳回日期範圍內的彙總成本用量摘要。
      傳入 `agentId` 可指定單一 agent，或傳入 `agentScope: "all"` 彙總已設定的 agent。
    - `doctor.memory.status` 會傳回作用中預設 agent 工作區的向量記憶體/快取 embedding 就緒狀態。只有在呼叫端明確想要即時 ping embedding provider 時，才傳入 `{ "probe": true }` 或 `{ "deep": true }`。支援夢境整理的用戶端也可傳入 `{ "agentId": "agent-id" }`，將夢境整理儲存統計範圍限定到選取的 agent 工作區；省略 `agentId` 會保留預設 agent fallback，並彙總已設定的夢境整理工作區。
    - `doctor.memory.dreamDiary`、`doctor.memory.backfillDreamDiary`、`doctor.memory.resetDreamDiary`、`doctor.memory.resetGroundedShortTerm`、`doctor.memory.repairDreamingArtifacts` 和 `doctor.memory.dedupeDreamDiary` 接受選用的 `{ "agentId": "agent-id" }` 參數，用於選取 agent 的夢境整理檢視/動作。省略 `agentId` 時，它們會在已設定的預設 agent 工作區上運作。
    - `doctor.memory.remHarness` 會傳回供遠端控制平面用戶端使用的有界唯讀 REM harness 預覽。它可能包含工作區路徑、記憶體片段、已算繪的 grounded Markdown，以及深度提升候選項目，因此呼叫端需要 `operator.read`。
    - `sessions.usage` 會傳回每個工作階段的用量摘要。傳入 `agentId` 可指定單一
      agent，或傳入 `agentScope: "all"` 一併列出已設定的 agent。
    - `sessions.usage.timeseries` 會傳回單一工作階段的時間序列用量。
    - `sessions.usage.logs` 會傳回單一工作階段的用量記錄項目。

  </Accordion>

  <Accordion title="通道與登入輔助工具">
    - `channels.status` 會傳回內建 + bundled 通道/外掛狀態摘要。
    - `channels.logout` 會登出特定通道/帳號，前提是該通道支援登出。
    - `web.login.start` 會為目前支援 QR 的 web 通道 provider 啟動 QR/web 登入流程。
    - `web.login.wait` 會等待該 QR/web 登入流程完成，並在成功時啟動通道。
    - `push.test` 會將測試 APNs push 傳送到已註冊的 iOS 節點。
    - `voicewake.get` 會傳回已儲存的喚醒詞觸發器。
    - `voicewake.set` 會更新喚醒詞觸發器並廣播變更。

  </Accordion>

  <Accordion title="訊息與記錄">
    - `send` 是直接 outbound-delivery RPC，用於在 chat runner 外部依通道/帳號/執行緒目標傳送。
    - `logs.tail` 會傳回已設定閘道檔案記錄的 tail，並提供 cursor/limit 與最大位元組控制。

  </Accordion>

  <Accordion title="Talk 與 TTS">
    - `talk.catalog` 會傳回語音、串流轉錄和即時語音的唯讀 Talk provider 目錄。它包含標準 provider ID、registry aliases、標籤、設定狀態、選用的群組層級 `ready` 結果、公開的 model/voice ID、標準模式、transport、brain strategies，以及 realtime audio/capability flags，而不會傳回 provider 密鑰或變更全域設定。目前的閘道會在套用執行階段 provider selection 後設定 `ready`；為了與較舊的閘道相容，用戶端應將其缺席視為未驗證。
    - `talk.config` 會傳回有效的 Talk 設定 payload；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.session.create` 會為 `realtime/gateway-relay`、`transcription/gateway-relay` 或 `stt-tts/managed-room` 建立閘道擁有的 Talk 工作階段。對於 `stt-tts/managed-room`，傳入 `sessionKey` 的 `operator.write` 呼叫端也必須傳入 `spawnedBy`，以取得有範圍的 session-key 可見性；未限定範圍的 `sessionKey` 建立與 `brain: "direct-tools"` 需要 `operator.admin`。
    - `talk.session.join` 會驗證 managed-room 工作階段權杖，視需要發出 `session.ready` 或 `session.replaced` 事件，並傳回 room/session 中繼資料與近期 Talk 事件，而不包含明文權杖或已儲存的權杖雜湊。
    - `talk.session.appendAudio` 會將 base64 PCM 輸入音訊附加到閘道擁有的 realtime relay 與 transcription 工作階段。
    - `talk.session.startTurn`、`talk.session.endTurn` 和 `talk.session.cancelTurn` 會驅動 managed-room turn 生命週期，並在清除狀態前拒絕 stale-turn。
    - `talk.session.cancelOutput` 會停止 assistant 音訊輸出，主要用於閘道 relay 工作階段中由 VAD 控制的 barge-in。
    - `talk.session.submitToolResult` 會完成閘道擁有的 realtime relay 工作階段發出的 provider 工具呼叫。當最終結果稍後會送出時，傳入 `options: { willContinue: true }` 代表 interim tool output；或當工具結果應滿足 provider 呼叫而不啟動另一個 realtime assistant 回應時，傳入 `options: { suppressResponse: true }`。
    - `talk.session.steer` 會將 active-run voice control 傳送到閘道擁有且由 agent 支援的 Talk 工作階段。它接受 `{ sessionId, text, mode? }`，其中 `mode` 為 `status`、`steer`、`cancel` 或 `followup`；省略 mode 時會依 spoken text 分類。
    - `talk.session.close` 會關閉閘道擁有的 relay、transcription 或 managed-room 工作階段，並發出 terminal Talk 事件。
    - `talk.mode` 會為 WebChat/Control UI 用戶端設定/廣播目前的 Talk mode 狀態。
    - `talk.client.create` 會使用 `webrtc` 或 `provider-websocket` 建立 client-owned realtime provider 工作階段，同時由閘道擁有設定、認證、instructions 與工具政策。
    - `talk.client.toolCall` 允許 client-owned realtime transport 將 provider 工具呼叫轉送到閘道政策。第一個支援的工具是 `openclaw_agent_consult`；用戶端會收到 run ID，並在提交 provider-specific tool result 前等待一般聊天生命週期事件。
    - `talk.client.steer` 會傳送 client-owned realtime transport 的 active-run voice control。閘道會從 `sessionKey` 解析 active embedded run，並傳回結構化的 accepted/rejected 結果，而不是默默丟棄 steering。
    - `talk.event` 是 realtime、transcription、STT/TTS、managed-room、telephony 與 meeting adapter 的單一 Talk 事件通道。
    - `talk.speak` 會透過作用中的 Talk speech provider 合成語音。
    - `tts.status` 會傳回 TTS 啟用狀態、作用中 provider、fallback provider，以及 provider 設定狀態。
    - `tts.providers` 會傳回可見的 TTS provider inventory。
    - `tts.enable` 與 `tts.disable` 會切換 TTS prefs 狀態。
    - `tts.setProvider` 會更新偏好的 TTS provider。
    - `tts.convert` 會執行一次性文字轉語音轉換。

  </Accordion>

  <Accordion title="密鑰、設定、更新與精靈">
    - `secrets.reload` 會重新解析作用中的 SecretRefs，且只在完全成功時替換執行階段密鑰狀態。
    - `secrets.resolve` 會解析特定 command/target 集合的 command-target 密鑰指派。
    - `config.get` 會傳回目前的設定快照與雜湊。
    - `config.set` 會寫入經驗證的設定 payload。
    - `config.patch` 會合併部分設定更新。破壞性的陣列
      取代需要在 `replacePaths` 中包含受影響路徑；陣列項目底下的巢狀陣列
      使用 `[]` 路徑，例如 `agents.list[].skills`。
    - `config.apply` 會驗證 + 取代完整設定 payload。
    - `config.schema` 會傳回 Control UI 與命令列介面 tooling 使用的即時設定 schema payload：schema、`uiHints`、版本與生成中繼資料，包含執行階段可載入時的外掛 + 通道 schema 中繼資料。schema 包含從 UI 使用的相同標籤與說明文字衍生出的欄位 `title` / `description` 中繼資料，並在存在相符欄位文件時，涵蓋巢狀物件、wildcard、array-item，以及 `anyOf` / `oneOf` / `allOf` 組合分支。
    - `config.schema.lookup` 會為單一設定路徑傳回 path-scoped lookup payload：標準化路徑、淺層 schema node、相符 hint + `hintPath`、選用的 `reloadKind`，以及 UI/命令列介面 drill-down 的 immediate child summaries。`reloadKind` 是 `restart`、`hot` 或 `none` 之一，並映射所請求路徑的閘道設定 reload planner。Lookup schema nodes 會保留 user-facing docs 與常見驗證欄位（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、numeric/string/array/object bounds，以及 `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` 等 flags）。Child summaries 會公開 `key`、標準化 `path`、`type`、`required`、`hasChildren`、選用的 `reloadKind`，以及相符的 `hint` / `hintPath`。
    - `update.run` 會執行閘道更新流程，且只有在更新本身成功時才排程重新啟動；具有工作階段的呼叫端可包含 `continuationMessage`，讓啟動透過 restart continuation queue 恢復一個後續 agent turn。來自 control plane 的套件管理器更新與受監督的 git-checkout 更新，會使用 detached managed-service handoff，而不是在即時閘道內取代 package tree 或變更 checkout/build output。已啟動的 handoff 會傳回 `ok: true`，並帶有 `result.reason: "managed-service-handoff-started"` 與 `handoff.status: "started"`；不可用或失敗的 handoff 會傳回 `ok: false`，並帶有 `managed-service-handoff-unavailable` 或 `managed-service-handoff-failed`，以及需要手動 shell 更新時的 `handoff.command`。不可用的 handoff 表示 OpenClaw 缺少安全的 supervisor boundary 或 durable service identity，例如 systemd 的 `OPENCLAW_SYSTEMD_UNIT`。在已啟動的 handoff 期間，restart sentinel 可能短暫回報 `stats.reason: "restart-health-pending"`；continuation 會延遲，直到命令列介面驗證已重新啟動的閘道並寫入最終 `ok` sentinel。
    - `update.status` 會重新整理並傳回最新的 update restart sentinel，包含可用時的重啟後執行版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 會透過 WS RPC 公開 onboarding wizard。

  </Accordion>

  <Accordion title="代理程式與工作區輔助工具">
    - `agents.list` 會傳回已設定的代理程式項目，包括有效模型與執行階段中繼資料。
    - `agents.create`、`agents.update` 與 `agents.delete` 會管理代理程式記錄與工作區接線。
    - `agents.files.list`、`agents.files.get` 與 `agents.files.set` 會管理為代理程式公開的啟動工作區檔案。
    - `tasks.list`、`tasks.get` 與 `tasks.cancel` 會向 SDK 與操作員用戶端公開閘道任務分類帳。
    - `artifacts.list`、`artifacts.get` 與 `artifacts.download` 會針對明確的 `sessionKey`、`runId` 或 `taskId` 範圍，公開由轉錄衍生的成品摘要與下載。執行與任務查詢會在伺服器端解析所屬工作階段，且只傳回具有相符來源的轉錄媒體；不安全或本機 URL 來源會傳回不支援的下載，而不是在伺服器端擷取。
    - `environments.list` 與 `environments.status` 會向 SDK 用戶端公開唯讀的閘道本機與節點環境探索。
    - `agent.identity.get` 會傳回代理程式或工作階段的有效助理身分。
    - `agent.wait` 會等待執行完成，並在可用時傳回終端快照。

  </Accordion>

  <Accordion title="工作階段控制">
    - `sessions.list` 會傳回目前的工作階段索引；若已設定代理程式執行階段後端，則包含每列的 `agentRuntime` 中繼資料。
    - `sessions.subscribe` 與 `sessions.unsubscribe` 會為目前 WS 用戶端切換工作階段變更事件訂閱。
    - `sessions.messages.subscribe` 與 `sessions.messages.unsubscribe` 會為單一工作階段切換轉錄/訊息事件訂閱。
    - `sessions.preview` 會傳回特定工作階段鍵的有界轉錄預覽。
    - `sessions.describe` 會針對精確的工作階段鍵傳回一列閘道工作階段。
    - `sessions.resolve` 會解析或標準化工作階段目標。
    - `sessions.create` 會建立新的工作階段項目。
    - `sessions.send` 會將訊息傳送到現有工作階段。
    - `sessions.steer` 是作用中工作階段的中斷並導向變體。
    - `sessions.abort` 會中止工作階段的作用中工作。呼叫端可以傳入 `key` 加上選用的 `runId`，或針對閘道可解析到工作階段的作用中執行，只傳入 `runId`。
    - `sessions.patch` 會更新工作階段中繼資料/覆寫，並回報已解析的標準模型與有效的 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 與 `sessions.compact` 會執行工作階段維護。
    - `sessions.get` 會傳回完整儲存的工作階段列。
    - 聊天執行仍使用 `chat.history`、`chat.send`、`chat.abort` 與 `chat.inject`。`chat.history` 會針對 UI 用戶端進行顯示正規化：從可見文字中移除行內指令標籤，移除純文字工具呼叫 XML 承載（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 與被截斷的工具呼叫區塊）和外洩的 ASCII/全形模型控制權杖，省略純靜默權杖的助理列，例如完全相符的 `NO_REPLY` / `no_reply`，且過大的列可由預留位置取代。
    - `chat.message.get` 是附加的有界完整訊息讀取器，用於單一可見轉錄項目。用戶端會傳入 `sessionKey`、當工作階段選取範圍限定於代理程式時選用的 `agentId`，以及先前透過 `chat.history` 公開的轉錄 `messageId`；當儲存的項目仍可用且未過大時，閘道會傳回相同的顯示正規化投影，但不套用輕量歷史截斷上限。
    - `chat.send` 接受單回合 `fastMode: "auto"`，以便在自動截止前開始的模型呼叫使用快速模式，之後啟動的重試、fallback、工具結果或延續呼叫則不使用快速模式。截止預設為 60 秒，並可使用 `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` 逐模型設定。`chat.send` 呼叫端可以傳入單回合 `fastAutoOnSeconds`，以覆寫該請求的截止時間。

  </Accordion>

  <Accordion title="裝置配對與裝置權杖">
    - `device.pair.list` 會傳回待處理與已核准的配對裝置。
    - `device.pair.approve`、`device.pair.reject` 與 `device.pair.remove` 會管理裝置配對記錄。
    - `device.token.rotate` 會在其已核准角色與呼叫端範圍界限內輪替配對裝置權杖。
    - `device.token.revoke` 會在其已核准角色與呼叫端範圍界限內撤銷配對裝置權杖。

  </Accordion>

  <Accordion title="節點配對、叫用與待處理工作">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove` 與 `node.pair.verify` 涵蓋節點配對與啟動驗證。
    - `node.list` 與 `node.describe` 會傳回已知/已連線的節點狀態。
    - `node.rename` 會更新配對節點標籤。
    - `node.invoke` 會將命令轉送至已連線節點。
    - `node.invoke.result` 會傳回叫用請求的結果。
    - `node.event` 會將節點來源事件帶回閘道。
    - `node.pending.pull` 與 `node.pending.ack` 是已連線節點佇列 API。
    - `node.pending.enqueue` 與 `node.pending.drain` 會管理離線/中斷連線節點的耐久待處理工作。

  </Accordion>

  <Accordion title="核准系列">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 與 `exec.approval.resolve` 涵蓋一次性 exec 核准請求，以及待處理核准查詢/重播。
    - `exec.approval.waitDecision` 會等待一個待處理 exec 核准，並傳回最終決策（逾時時為 `null`）。
    - `exec.approvals.get` 與 `exec.approvals.set` 會管理閘道 exec 核准原則快照。
    - `exec.approvals.node.get` 與 `exec.approvals.node.set` 會透過節點轉送命令管理節點本機 exec 核准原則。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 與 `plugin.approval.resolve` 涵蓋外掛定義的核准流程。

  </Accordion>

  <Accordion title="自動化、Skills 與工具">
    - 自動化：`wake` 會排程立即或下一次心跳偵測喚醒文字注入；`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 會管理已排程工作。
    - `cron.run` 仍是手動執行的入列式 RPC。需要完成語意的用戶端應讀取傳回的 `runId` 並輪詢 `cron.runs`。
    - `cron.runs` 接受選用的非空 `runId` 篩選器，讓用戶端可以追蹤一個已排入佇列的手動執行，而不會與同一工作的其他歷史項目競爭。
    - Skills 與工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 常見事件系列

- `chat`：UI 聊天更新，例如 `chat.inject` 與其他僅限轉錄的聊天
  事件。在協定 v4 中，差異承載會攜帶 `deltaText`；`message` 仍是
  累計的助理快照。非前綴取代會設定 `replace=true`
  並使用 `deltaText` 作為取代文字。
- `session.message`、`session.operation` 與 `session.tool`：已訂閱
  工作階段的轉錄、進行中的工作階段操作與事件串流更新。
- `sessions.changed`：工作階段索引或中繼資料已變更。
- `presence`：系統存在狀態快照更新。
- `tick`：週期性 keepalive / 存活事件。
- `health`：閘道健康狀態快照更新。
- `heartbeat`：心跳偵測事件串流更新。
- `cron`：排程執行/工作變更事件。
- `shutdown`：閘道關閉通知。
- `node.pair.requested` / `node.pair.resolved`：節點配對生命週期。
- `node.invoke.request`：節點叫用請求廣播。
- `device.pair.requested` / `device.pair.resolved`：配對裝置生命週期。
- `voicewake.changed`：喚醒詞觸發設定已變更。
- `exec.approval.requested` / `exec.approval.resolved`：exec 核准
  生命週期。
- `plugin.approval.requested` / `plugin.approval.resolved`：外掛核准
  生命週期。

### 節點輔助方法

- 節點可以呼叫 `skills.bins`，以擷取目前的技能可執行檔清單，
  用於自動允許檢查。

### 任務分類帳 RPC

操作員用戶端可以透過任務分類帳 RPC 檢查並取消閘道背景任務記錄。
這些方法會傳回已清理的任務摘要，而非原始執行階段狀態。

- `tasks.list` 需要 `operator.read`。
  - 參數：選用的 `status`（`"queued"`、`"running"`、`"completed"`、
    `"failed"`、`"cancelled"` 或 `"timed_out"`）或這些狀態的陣列、
    選用的 `agentId`、選用的 `sessionKey`、從 `1` 到
    `500` 的選用 `limit`，以及選用的字串 `cursor`。
  - 結果：`{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` 需要 `operator.read`。
  - 參數：`{ "taskId": string }`。
  - 結果：`{ "task": TaskSummary }`。
  - 缺少的任務 ID 會傳回閘道的找不到錯誤形狀。
- `tasks.cancel` 需要 `operator.write`。
  - 參數：`{ "taskId": string, "reason"?: string }`。
  - 結果：
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` 會回報分類帳是否有相符任務。`cancelled`
    會回報執行階段是否接受或記錄取消。

`TaskSummary` 包含 `id`、`status`，以及選用中繼資料，例如 `kind`、
`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、
`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、時間戳記、進度、
終端摘要與已清理的錯誤文字。`agentId` 識別執行任務的代理程式；
`sessionKey` 與 `ownerKey` 會保留請求者與控制情境。

### 操作員輔助方法

- 操作者可以呼叫 `commands.list`（`operator.read`）來擷取代理程式的執行階段
  命令清單。
  - `agentId` 為選用；省略即可讀取預設代理程式工作區。
  - `scope` 控制主要 `name` 目標是哪個介面：
    - `text` 會回傳不含前置 `/` 的主要文字命令 token
    - `native` 與預設的 `both` 路徑會在可用時回傳具提供者感知能力的原生命令名稱
  - `textAliases` 會帶有精確的斜線別名，例如 `/model` 和 `/m`。
  - `nativeName` 會在存在時帶有具提供者感知能力的原生命令名稱。
  - `provider` 為選用，且只會影響原生命名以及原生外掛
    命令可用性。
  - `includeArgs=false` 會從回應中省略序列化的引數中繼資料。
- 操作者可以呼叫 `tools.catalog`（`operator.read`）來擷取代理程式的執行階段工具目錄。回應包含分組工具與來源中繼資料：
  - `source`：`core` 或 `plugin`
  - `pluginId`：當 `source="plugin"` 時的外掛擁有者
  - `optional`：外掛工具是否為選用
- 操作者可以呼叫 `tools.effective`（`operator.read`）來擷取工作階段的執行階段有效工具
  清單。
  - `sessionKey` 為必填。
  - 閘道會從伺服器端的工作階段推導可信任的執行階段脈絡，而不是接受
    呼叫者提供的驗證或傳遞脈絡。
  - 回應是以工作階段為範圍、由伺服器推導出的作用中清單投影，
    包含核心、外掛、頻道，以及已探索到的 MCP 伺服器工具。
  - `tools.effective` 對 MCP 為唯讀：它可以透過最終工具政策投影已預熱工作階段的 MCP 目錄，但不會建立 MCP 執行階段、連接傳輸，或發出
    `tools/list`。如果不存在相符的已預熱目錄，回應可能包含例如
    `mcp-not-yet-connected`、`mcp-not-yet-listed` 或 `mcp-stale-catalog` 的通知。
  - 有效工具項目會使用 `source="core"`、`source="plugin"`、`source="channel"` 或
    `source="mcp"`。
- 操作者可以呼叫 `tools.invoke`（`operator.write`），透過與 `/tools/invoke` 相同的
  閘道政策路徑叫用一個可用工具。
  - `name` 為必填。`args`、`sessionKey`、`agentId`、`confirm` 和
    `idempotencyKey` 為選用。
  - 如果同時存在 `sessionKey` 和 `agentId`，解析出的工作階段代理程式必須符合
    `agentId`。
  - 僅限擁有者的核心包裝器，例如 `cron`、`gateway` 和 `nodes`，需要
    擁有者/管理員身分（`operator.admin`），即使 `tools.invoke`
    方法本身是 `operator.write`。
  - 回應是面向 SDK 的信封，包含 `ok`、`toolName`、選用的 `output`，以及具型別的
    `error` 欄位。核准或政策拒絕會在酬載中回傳 `ok:false`，而不是
    繞過閘道工具政策管線。
- 操作者可以呼叫 `skills.status`（`operator.read`）來擷取代理程式可見的
  Skills 清單。
  - `agentId` 為選用；省略即可讀取預設代理程式工作區。
  - 回應包含資格、缺少的需求、設定檢查，以及
    已清理的安裝選項，且不會暴露原始秘密值。
- 操作者可以呼叫 `skills.search` 和 `skills.detail`（`operator.read`）取得
  ClawHub 探索中繼資料。
- 操作者可以呼叫 `skills.upload.begin`、`skills.upload.chunk` 和
  `skills.upload.commit`（`operator.admin`），在安裝前暫存私人 Skills 封存檔。
  這是供受信任用戶端使用的獨立管理員上傳路徑，
  不是一般的 ClawHub Skills 安裝流程，且預設停用，除非
  `skills.install.allowUploadedArchives` 已啟用。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    會建立一個綁定到該 slug 與 force 值的上傳。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` 會在
    精確的已解碼偏移量附加位元組。
  - `skills.upload.commit({ uploadId, sha256? })` 會驗證最終大小與
    SHA-256。提交只會完成上傳；不會安裝 Skills。
  - 上傳的 Skills 封存檔是包含 `SKILL.md` 根目錄的 zip 封存檔。封存檔的內部目錄名稱永遠不會選擇安裝目標。
- 操作者可以呼叫 `skills.install`（`operator.admin`），有三種模式：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 會將
    Skills 資料夾安裝到預設代理程式工作區的 `skills/` 目錄。
  - 上傳模式：`{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    會將已提交的上傳安裝到預設代理程式工作區的 `skills/<slug>`
    目錄。slug 與 force 值必須符合原始
    `skills.upload.begin` 請求。除非
    `skills.install.allowUploadedArchives` 已啟用，否則此模式會被拒絕。此設定不會
    影響 ClawHub 安裝。
  - 閘道安裝器模式：`{ name, installId, timeoutMs? }`
    會在閘道主機上執行宣告的 `metadata.openclaw.install` 動作。
    較舊的用戶端可能仍會傳送 `dangerouslyForceUnsafeInstall`；此欄位已
    棄用，僅為協定相容性而接受，且會被忽略。請使用
    `security.installPolicy` 進行操作者擁有的安裝決策。
- 操作者可以呼叫 `skills.update`（`operator.admin`），有兩種模式：
  - ClawHub 模式會更新預設代理程式工作區中一個已追蹤的 slug，或所有已追蹤的 ClawHub 安裝。
  - 設定模式會修補 `skills.entries.<skillKey>` 值，例如 `enabled`、
    `apiKey` 和 `env`。

### `models.list` 檢視

`models.list` 接受選用的 `view` 參數：

- 省略或 `"default"`：目前的執行階段行為。如果已設定 `agents.defaults.models`，回應會是允許的目錄，包含針對 `provider/*` 項目動態探索到的模型。否則，回應會是完整的閘道目錄。
- `"configured"`：適合選擇器大小的行為。如果已設定 `agents.defaults.models`，它仍會優先，包括 `provider/*` 項目的提供者範圍探索。沒有允許清單時，回應會使用明確的 `models.providers.*.models` 項目，只有在沒有已設定模型列時才會退回完整目錄。
- `"all"`：完整閘道目錄，略過 `agents.defaults.models`。請將此用於診斷與探索 UI，而非一般模型選擇器。

## 執行核准

- 當 exec 請求需要核准時，閘道會廣播 `exec.approval.requested`。
- 操作者用戶端透過呼叫 `exec.approval.resolve` 來解析（需要 `operator.approvals` 範圍）。
- 對於 `host=node`，`exec.approval.request` 必須包含 `systemRunPlan`（標準 `argv`/`cwd`/`rawCommand`/工作階段中繼資料）。缺少 `systemRunPlan` 的請求會被拒絕。
- 核准後，轉送的 `node.invoke system.run` 呼叫會重用該標準
  `systemRunPlan`，作為權威命令/cwd/工作階段脈絡。
- 如果呼叫者在準備與最終核准的 `system.run` 轉送之間變更 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，閘道會拒絕該執行，而不是信任已變更的酬載。

## 代理程式傳遞後援

- `agent` 請求可以包含 `deliver=true` 以請求對外傳遞。
- `bestEffortDeliver=false` 會保持嚴格行為：無法解析或僅限內部的傳遞目標會回傳 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允許在無法解析外部可傳遞路由時，退回僅工作階段執行（例如內部/webchat 工作階段或模糊的多頻道設定）。
- 最終 `agent` 結果在請求傳遞時可能包含 `result.deliveryStatus`，
  使用與 [`openclaw agent --json --deliver`](/zh-TW/cli/agent#json-delivery-status) 文件中相同的
  `sent`、`suppressed`、`partial_failed` 和 `failed`
  狀態。

## 版本管理

- `PROTOCOL_VERSION` 位於 `packages/gateway-protocol/src/version.ts`。
- 用戶端會傳送 `minProtocol` + `maxProtocol`；伺服器會拒絕
  不包含其目前協定的範圍。目前的用戶端與伺服器需要
  協定 v4。
- 架構 + 模型會從 TypeBox 定義產生：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 用戶端常數

`src/gateway/client.ts` 中的參考用戶端使用這些預設值。值在
協定 v4 中保持穩定，且是第三方用戶端的預期基準。

| 常數                                      | 預設值                                                | 來源                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| 請求逾時（每個 RPC）                      | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| 預先驗證 / 連線挑戰逾時                  | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（config/env 可以提高成對的伺服器/用戶端預算）          |
| 初始重新連線退避                          | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| 最大重新連線退避                          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| 裝置 token 關閉後的快速重試鉗制          | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前的強制停止寬限            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` 預設逾時                  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| 預設 tick 間隔（`hello-ok` 前）           | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| tick 逾時關閉                             | 沉默超過 `tickIntervalMs * 2` 時使用代碼 `4000`       | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

伺服器會在 `hello-ok` 中公布有效的 `policy.tickIntervalMs`、`policy.maxPayload`
和 `policy.maxBufferedBytes`；用戶端應遵循這些值，
而不是握手前的預設值。

## 驗證

- 共享密鑰閘道驗證會使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，取決於已設定的驗證模式。
- 帶有身分的模式，例如 Tailscale Serve
  (`gateway.auth.allowTailscale: true`) 或非迴環的
  `gateway.auth.mode: "trusted-proxy"`，會從請求標頭而不是 `connect.params.auth.*`
  滿足連線驗證檢查。
- 私有入口的 `gateway.auth.mode: "none"` 會完全略過共享密鑰連線驗證；請勿在公開或不受信任的入口公開該模式。
- 配對後，閘道會核發限定於連線角色 + 範圍的**裝置權杖**。它會在 `hello-ok.auth.deviceToken` 中回傳，且用戶端應持久保存，以供未來連線使用。
- 用戶端應在任何成功連線後持久保存主要的 `hello-ok.auth.deviceToken`。
- 使用該**已儲存**裝置權杖重新連線時，也應重用該權杖已儲存的已核准範圍集。這會保留先前已授予的讀取、探測、狀態存取權，並避免重新連線時靜默收斂為較窄的隱含僅管理員範圍。
- 用戶端連線驗證組裝（`src/gateway/client.ts` 中的 `selectConnectAuth`）：
  - `auth.password` 是正交的，設定時一律會轉送。
  - `auth.token` 會依優先順序填入：先是明確共享權杖，接著是明確的 `deviceToken`，再來是已儲存的每裝置權杖（以 `deviceId` + `role` 為鍵）。
  - 只有在上述都未解析出 `auth.token` 時，才會傳送 `auth.bootstrapToken`。共享權杖或任何已解析的裝置權杖都會抑制它。
  - 在一次性的 `AUTH_TOKEN_MISMATCH` 重試中自動提升已儲存裝置權杖，僅限**受信任端點**：迴環，或具有釘選 `tlsFingerprint` 的 `wss://`。未釘選的公開 `wss://` 不符合資格。
- 內建設定碼啟動程序會回傳主要節點
  `hello-ok.auth.deviceToken`，以及位於 `hello-ok.auth.deviceTokens` 中、有界限的操作者權杖，用於受信任的行動裝置交接。操作者權杖包含 `operator.talk.secrets` 以供原生 Talk 設定讀取，但排除配對變更範圍與 `operator.admin`。
- 當非基準設定碼啟動程序正在等待核准時，`PAIRING_REQUIRED`
  詳細資訊包含 `recommendedNextStep: "wait_then_retry"`、`retryable: true`
  以及 `pauseReconnect: false`。用戶端應持續使用相同的啟動權杖重新連線，直到請求獲准或權杖失效。
- 僅當連線在受信任傳輸（例如 `wss://` 或迴環／本機配對）上使用啟動驗證時，才持久保存 `hello-ok.auth.deviceTokens`。
- 如果用戶端提供**明確**的 `deviceToken` 或明確的 `scopes`，該呼叫者要求的範圍集仍具權威性；只有在用戶端重用已儲存的每裝置權杖時，才會重用快取範圍。
- 裝置權杖可透過 `device.token.rotate` 和
  `device.token.revoke` 輪替／撤銷（需要 `operator.pairing` 範圍）。輪替或撤銷節點或其他非操作者角色也需要 `operator.admin`。
- `device.token.rotate` 會回傳輪替中繼資料。只有對已使用該裝置權杖驗證的同一裝置呼叫，它才會回顯替換承載權杖，因此僅使用權杖的用戶端可在重新連線前持久保存替換權杖。共享／管理員輪替不會回顯承載權杖。
- 權杖核發、輪替與撤銷都受限於該裝置配對項目中記錄的已核准角色集；權杖變更無法擴大或指向配對核准從未授予的裝置角色。
- 對於已配對裝置的權杖工作階段，除非呼叫者也有 `operator.admin`，否則裝置管理是自我限定範圍的：非管理員呼叫者只能管理其**自己**裝置項目的操作者權杖。即使是呼叫者自己的裝置，節點與其他非操作者權杖管理也僅限管理員。
- `device.token.rotate` 和 `device.token.revoke` 也會比對目標操作者權杖範圍集與呼叫者目前的工作階段範圍。非管理員呼叫者無法輪替或撤銷比自己已持有範圍更廣的操作者權杖。
- 驗證失敗包含 `error.details.code` 加上復原提示：
  - `error.details.canRetryWithDeviceToken`（布林值）
  - `error.details.recommendedNextStep`（`retry_with_device_token`、`update_auth_configuration`、`update_auth_credentials`、`wait_then_retry`、`review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH` 的用戶端行為：
  - 受信任用戶端可嘗試一次有界限的重試，使用快取的每裝置權杖。
  - 如果該重試失敗，用戶端應停止自動重新連線迴圈，並顯示操作者操作指引。
- `AUTH_SCOPE_MISMATCH` 表示裝置權杖已被辨識，但不涵蓋要求的角色／範圍。用戶端不應將其呈現為不良權杖；應提示操作者重新配對，或核准較窄／較廣的範圍合約。

## 裝置身分 + 配對

- 節點應包含衍生自金鑰組指紋的穩定裝置身分（`device.id`）。
- 閘道會依裝置 + 角色核發權杖。
- 除非已啟用本機自動核准，否則新的裝置 ID 需要配對核准。
- 配對自動核准以直接 local loopback 連線為核心。
- OpenClaw 也有一條狹窄的後端／容器本機自我連線路徑，用於受信任的共享密鑰輔助流程。
- 同主機 tailnet 或 LAN 連線仍視為遠端配對，並需要核准。
- WS 用戶端通常會在 `connect` 期間包含 `device` 身分（操作者 +
  節點）。唯一不帶裝置的操作者例外是明確信任路徑：
  - `gateway.controlUi.allowInsecureAuth=true` 用於僅限 localhost 的不安全 HTTP 相容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` 操作者 Control UI 驗證。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急破例，嚴重降低安全性）。
  - 保留內部輔助路徑上的直接迴環 `gateway-client` 後端 RPC。
- 省略裝置身分會影響範圍。當不帶裝置的操作者連線透過明確信任路徑獲准時，OpenClaw 仍會將自我宣告範圍清為空集合，除非該路徑具有具名的範圍保留例外。受範圍限制的方法接著會因 `missing scope` 而失敗。
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` 是 Control UI
  緊急破例的範圍保留路徑。它不會向任意自訂後端或命令列介面形態的 WebSocket 用戶端授予範圍。
- 保留的直接迴環 `gateway-client` 後端輔助路徑，只會為內部本機控制平面 RPC 保留範圍；自訂後端 ID 不會取得此例外。
- 所有連線都必須簽署伺服器提供的 `connect.challenge` nonce。

### 裝置驗證遷移診斷

對於仍使用挑戰前簽署行為的舊版用戶端，`connect` 現在會在 `error.details.code` 下回傳
`DEVICE_AUTH_*` 詳細代碼，並附帶穩定的 `error.details.reason`。

常見遷移失敗：

| 訊息                        | details.code                     | details.reason           | 含義                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 用戶端省略了 `device.nonce`（或傳送空白）。        |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 用戶端使用過時／錯誤的 nonce 簽署。               |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 簽章承載內容與 v2 承載不符。                      |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 已簽署時間戳超出允許偏移。                       |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 與公開金鑰指紋不符。                  |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開金鑰格式／標準化失敗。                        |

遷移目標：

- 一律等待 `connect.challenge`。
- 簽署包含伺服器 nonce 的 v2 承載內容。
- 在 `connect.params.device.nonce` 中傳送相同 nonce。
- 偏好的簽章承載是 `v3`，除了裝置／用戶端／角色／範圍／權杖／nonce 欄位外，也會綁定 `platform` 和 `deviceFamily`。
- 舊版 `v2` 簽章仍會因相容性而被接受，但已配對裝置的中繼資料釘選仍會控制重新連線時的命令政策。

## TLS + 釘選

- TLS 支援 WS 連線。
- 用戶端可選擇釘選閘道憑證指紋（請參閱 `gateway.tls`
  設定，以及 `gateway.remote.tlsFingerprint` 或命令列介面 `--tls-fingerprint`）。

## 範圍

此協定公開**完整閘道 API**（狀態、頻道、模型、聊天、代理、工作階段、節點、核准等）。確切介面由 `packages/gateway-protocol/src/schema.ts` 中的
TypeBox 結構描述定義。

## 相關

- [橋接協定](/zh-TW/gateway/bridge-protocol)
- [閘道作業手冊](/zh-TW/gateway)
