---
read_when:
    - 您想要從瀏覽器操作 Gateway
    - 你想要不透過 SSH 通道存取 Tailnet
sidebarTitle: Control UI
summary: 瀏覽器式 Gateway 控制使用者介面（聊天、節點、設定）
title: 控制介面
x-i18n:
    generated_at: "2026-05-10T19:55:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb158d1b6b92b7097fe7ba8d61aee5d6c6e67a8d45fc2cb2514c555ef3e52d81
    source_path: web/control-ui.md
    workflow: 16
---

控制 UI 是由 Gateway 提供服務的小型 **Vite + Lit** 單頁應用程式：

- 預設：`http://<host>:18789/`
- 選用前綴：設定 `gateway.controlUi.basePath`（例如 `/openclaw`）

它會在相同連接埠上**直接與 Gateway WebSocket** 通訊。

## 快速開啟（本機）

如果 Gateway 正在同一台電腦上執行，請開啟：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果頁面載入失敗，請先啟動 Gateway：`openclaw gateway`。

Auth 會在 WebSocket 握手期間透過以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 當 `gateway.auth.allowTailscale: true` 時，使用 Tailscale Serve 身分標頭
- 當 `gateway.auth.mode: "trusted-proxy"` 時，使用受信任 Proxy 身分標頭

儀表板設定面板會為目前瀏覽器分頁工作階段和所選的 gateway URL 保留一個 token；密碼不會持久保存。上手流程通常會在首次連線時為 shared-secret auth 產生 gateway token，但當 `gateway.auth.mode` 為 `"password"` 時，也可以使用 password auth。

## 裝置配對（首次連線）

當你從新的瀏覽器或裝置連線到控制 UI 時，Gateway 通常會要求**一次性配對核准**。這是一項安全措施，用於防止未經授權的存取。

**你會看到的內容：**「disconnected (1008): pairing required」

<Steps>
  <Step title="列出待處理要求">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="依要求 ID 核准">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

如果瀏覽器使用變更後的 auth 詳細資料（role/scopes/public key）重試配對，先前待處理的要求會被取代，並建立新的 `requestId`。核准前請重新執行 `openclaw devices list`。

如果瀏覽器已配對，而你將它從讀取存取權變更為寫入/admin 存取權，這會被視為核准升級，而不是靜默重新連線。OpenClaw 會保留舊核准為啟用狀態、封鎖範圍更廣的重新連線，並要求你明確核准新的 scope 集合。

核准後，裝置會被記住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤銷它，否則不需要重新核准。請參閱[裝置 CLI](/zh-TW/cli/devices) 了解 token 輪替與撤銷。

<Note>
- 直接的 local loopback 瀏覽器連線（`127.0.0.1` / `localhost`）會自動核准。
- 當 `gateway.auth.allowTailscale: true`、Tailscale 身分通過驗證，且瀏覽器提供其裝置身分時，Tailscale Serve 可以為控制 UI operator 工作階段略過配對往返。
- 直接的 Tailnet 繫結、LAN 瀏覽器連線，以及沒有裝置身分的瀏覽器設定檔，仍需要明確核准。
- 每個瀏覽器設定檔都會產生唯一的裝置 ID，因此切換瀏覽器或清除瀏覽器資料都會需要重新配對。

</Note>

## 個人身分（瀏覽器本機）

控制 UI 支援每個瀏覽器各自的個人身分（顯示名稱和頭像），並會附加到傳出的訊息，以便在共享工作階段中標示歸屬。它存在瀏覽器儲存空間中，範圍限於目前瀏覽器設定檔，不會同步到其他裝置，也不會在伺服器端持久保存，但你實際傳送的訊息上一般 transcript 作者中繼資料除外。清除網站資料或切換瀏覽器會將它重設為空白。

同樣的瀏覽器本機模式也適用於 assistant 頭像覆寫。上傳的 assistant 頭像只會在本機瀏覽器上覆蓋 gateway 解析出的身分，且絕不會透過 `config.patch` 往返傳送。共享的 `ui.assistant.avatar` config 欄位仍可供非 UI 用戶端直接寫入該欄位（例如 scripted gateways 或自訂儀表板）。

## 執行階段 config endpoint

控制 UI 會從 `/__openclaw/control-ui-config.json` 擷取其執行階段設定。該 endpoint 與其他 HTTP surface 一樣受相同的 gateway auth 保護：未驗證的瀏覽器無法擷取它，而成功擷取需要有效的 gateway token/password、Tailscale Serve 身分，或受信任 Proxy 身分其中之一。

## 語言支援

控制 UI 可以在首次載入時根據你的瀏覽器語言環境進行本地化。若要稍後覆寫，請開啟 **總覽 -> Gateway 存取 -> 語言**。語言環境選擇器位於 Gateway 存取卡片中，而不是外觀底下。

- 支援的語言環境：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`ar`、`it`、`tr`、`uk`、`id`、`pl`、`th`、`vi`、`nl`、`fa`
- 非英文翻譯會在瀏覽器中延遲載入。
- 選取的語言環境會儲存在瀏覽器儲存空間中，並在未來造訪時重複使用。
- 缺少的翻譯鍵會回退為英文。

Docs 翻譯會針對相同的非英文語言環境集合產生，但 docs 網站內建的 Mintlify 語言選擇器僅限於 Mintlify 接受的語言環境代碼。泰文（`th`）和波斯文（`fa`）docs 仍會在發佈 repo 中產生；在 Mintlify 支援這些代碼之前，它們可能不會出現在該選擇器中。

## 外觀主題

外觀面板保留內建的 Claw、Knot 和 Dash 主題，另加一個瀏覽器本機 tweakcn 匯入槽。若要匯入主題，請開啟 [tweakcn editor](https://tweakcn.com/editor/theme)、選擇或建立主題、按一下 **分享**，然後將複製的主題連結貼到外觀中。匯入器也接受 `https://tweakcn.com/r/themes/<id>` registry URL、像 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 這樣的 editor URL、相對 `/themes/<id>` 路徑、原始 theme ID，以及像 `amethyst-haze` 這樣的預設主題名稱。

匯入的主題只會儲存在目前瀏覽器設定檔中。它們不會寫入 gateway config，也不會跨裝置同步。替換匯入的主題會更新單一本機槽；清除它時，如果匯入的主題已被選取，作用中主題會切回 Claw。

## 它目前能做什麼

<AccordionGroup>
  <Accordion title="聊天與語音交談">
    - 透過 Gateway WS 與模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 聊天歷史重新整理會要求有界限的近期視窗，並套用每則訊息文字上限，因此大型工作階段不會在聊天可用之前強迫瀏覽器轉譯完整 transcript payload。
    - 透過瀏覽器即時工作階段進行語音交談。OpenAI 使用直接 WebRTC，Google Live 透過 WebSocket 使用受限制的一次性瀏覽器 token，而僅後端的即時語音 plugins 使用 Gateway relay transport。用戶端擁有的 provider 工作階段以 `talk.client.create` 開始；Gateway relay 工作階段以 `talk.session.create` 開始。relay 會將 provider credentials 保留在 Gateway 上，同時瀏覽器透過 `talk.session.appendAudio` 串流麥克風 PCM，並透過 `talk.client.toolCall` 轉送 `openclaw_agent_consult` provider tool calls，以套用 Gateway policy 和較大的已設定 OpenClaw 模型。
    - 在聊天中串流 tool calls + 即時 tool output cards（agent events）。

  </Accordion>
  <Accordion title="Channels、instances、sessions、dreams">
    - Channels：內建加上 bundled/external plugin channels 狀態、QR login，以及每個 channel 的 config（`channels.status`、`web.login.*`、`config.patch`）。
    - Channel probe 重新整理會在較慢的 provider checks 完成時保留先前快照可見，且當 probe 或 audit 超過其 UI 預算時，會標示部分快照。
    - Instances：presence list + refresh（`system-presence`）。
    - Sessions：預設列出 configured-agent sessions，從過時的 unconfigured agent session keys 回退，並套用 per-session model/thinking/fast/verbose/trace/reasoning overrides（`sessions.list`、`sessions.patch`）。
    - Dreams：Dreaming 狀態、啟用/停用切換，以及 Dream Diary reader（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="Cron、skills、nodes、exec approvals">
    - Cron jobs：列出/新增/編輯/執行/啟用/停用 + 執行歷史（`cron.*`）。
    - Skills：狀態、啟用/停用、安裝、API key updates（`skills.*`）。
    - Nodes：list + caps（`node.list`）。
    - Exec approvals：編輯 gateway 或 node allowlists + `exec host=gateway/node` 的 ask policy（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="Config">
    - 檢視/編輯 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - 套用 + 透過驗證重新啟動（`config.apply`），並喚醒最後的作用中工作階段。
    - 寫入包含 base-hash guard，以防止覆寫並行編輯。
    - 寫入（`config.set`/`config.apply`/`config.patch`）會對提交的 config payload 中 refs 的作用中 SecretRef resolution 進行 preflight；未解析的作用中已提交 refs 會在寫入前被拒絕。
    - Schema + form rendering（`config.schema` / `config.schema.lookup`，包含欄位 `title` / `description`、匹配的 UI hints、immediate child summaries、nested object/wildcard/array/composition nodes 上的 docs metadata，以及可用時的 plugin + channel schemas）；Raw JSON editor 只在快照具有安全 raw round-trip 時可用。
    - 如果快照無法安全 round-trip raw text，控制 UI 會強制使用 Form 模式，並停用該快照的 Raw 模式。
    - Raw JSON editor 的「Reset to saved」會保留 raw-authored shape（格式、註解、`$include` 版面），而不是重新轉譯 flattened snapshot，因此當快照可以安全 round-trip 時，外部編輯可在重設後保留。
    - Structured SecretRef object values 會在 form text inputs 中以唯讀方式轉譯，以防止意外的 object-to-string corruption。

  </Accordion>
  <Accordion title="Debug、logs、update">
    - Debug：status/health/models snapshots + event log + manual RPC calls（`status`、`health`、`models.list`）。
    - Event log 包含控制 UI refresh/RPC timings、slow chat/config render timings，以及當瀏覽器公開那些 PerformanceObserver entry types 時，長 animation frames 或 long tasks 的 browser responsiveness entries。
    - Logs：可 filter/export 的 gateway file logs live tail（`logs.tail`）。
    - Update：執行 package/git update + restart（`update.run`）並附 restart report，然後在重新連線後輪詢 `update.status` 以驗證正在執行的 gateway 版本。

  </Accordion>
  <Accordion title="Cron jobs 面板注意事項">
    - 對於 isolated jobs，delivery 預設為 announce summary。如果你想要 internal-only runs，可以切換為 none。
    - 選取 announce 時會顯示 channel/target fields。
    - Webhook 模式使用 `delivery.mode = "webhook"`，且 `delivery.to` 設為有效的 HTTP(S) webhook URL。
    - 對於 main-session jobs，webhook 和 none delivery modes 可用。
    - 進階編輯控制項包含 delete-after-run、clear agent override、cron exact/stagger options、agent model/thinking overrides，以及 best-effort delivery toggles。
    - Form validation 會以 field-level errors 內嵌顯示；無效值會停用儲存按鈕，直到修正為止。
    - 設定 `cron.webhookToken` 可傳送專用 bearer token；若省略，webhook 會在沒有 auth header 的情況下傳送。
    - 已棄用的 fallback：含有 `notify: true` 的 stored legacy jobs 在遷移前仍可使用 `cron.webhook`。

  </Accordion>
</AccordionGroup>

## 聊天行為

<AccordionGroup>
  <Accordion title="傳送與歷史語意">
    - `chat.send` 是**非阻塞**的：它會立即以 `{ runId, status: "started" }` 確認，回應則透過 `chat` 事件串流傳送。
    - 聊天上傳接受圖片以及非影片檔案。圖片保留原生圖片路徑；其他檔案會儲存為受管理媒體，並在歷史中顯示為附件連結。
    - 使用相同的 `idempotencyKey` 重新傳送時，執行中會回傳 `{ status: "in_flight" }`，完成後會回傳 `{ status: "ok" }`。
    - 為了 UI 安全，`chat.history` 回應有大小限制。當轉錄項目太大時，Gateway 可能會截斷長文字欄位、省略龐大的中繼資料區塊，並以預留位置取代過大的訊息（`[chat.history omitted: message too large]`）。
    - 助理/生成的圖片會持久化為受管理媒體參照，並透過已驗證的 Gateway 媒體 URL 回傳，因此重新載入不需要依賴原始 base64 圖片酬載持續留在聊天歷史回應中。
    - 轉譯 `chat.history` 時，Control UI 會從可見的助理文字中移除僅供顯示的內嵌指令標籤（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、純文字工具呼叫 XML 酬載（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及被截斷的工具呼叫區塊），以及外洩的 ASCII/全形模型控制權杖，並省略整段可見文字僅為精確靜默權杖 `NO_REPLY` / `no_reply` 或 Heartbeat 確認權杖 `HEARTBEAT_OK` 的助理項目。
    - 在作用中的傳送以及最終歷史重新整理期間，如果 `chat.history` 短暫回傳較舊的快照，聊天檢視會保持本機樂觀使用者/助理訊息可見；一旦 Gateway 歷史追上，權威轉錄就會取代那些本機訊息。
    - 即時 `chat` 事件是傳遞狀態，而 `chat.history` 則是從持久工作階段轉錄重新建構。工具最終事件之後，Control UI 會重新載入歷史並只合併一小段樂觀尾端；轉錄邊界記錄於 [WebChat](/zh-TW/web/webchat)。
    - `chat.inject` 會將助理註記附加到工作階段轉錄，並廣播 `chat` 事件供僅限 UI 的更新使用（沒有代理執行，沒有頻道傳遞）。
    - 聊天標頭會在工作階段選擇器之前顯示代理篩選器，且工作階段選擇器會依選定的代理限定範圍。切換代理時只會顯示繫結至該代理的工作階段，且當該代理尚未有已儲存的儀表板工作階段時，會退回到該代理的主要工作階段。
    - 在桌面寬度下，聊天控制項會保持在一個精簡列上，並在向下捲動轉錄時收合；向上捲動、回到頂部，或到達底部時會還原控制項。
    - 連續重複的純文字訊息會轉譯為一個帶有計數徽章的泡泡。帶有圖片、附件、工具輸出或畫布預覽的訊息不會收合。
    - 聊天標頭的模型與思考選擇器會透過 `sessions.patch` 立即修補作用中工作階段；它們是持久的工作階段覆寫，而不是僅限單回合的傳送選項。
    - 如果你在同一工作階段的模型選擇器變更仍在儲存時傳送訊息，撰寫器會等候該工作階段修補完成後才呼叫 `chat.send`，讓傳送使用所選模型。
    - 在 Control UI 中輸入 `/new` 會建立並切換到與「新增聊天」相同的全新儀表板工作階段，但若已設定 `session.dmScope: "main"` 且目前父項是代理的主要工作階段，則會在原處重設主要工作階段。輸入 `/reset` 會保留 Gateway 對目前工作階段的明確原處重設。
    - 聊天模型選擇器會要求 Gateway 已設定的模型檢視。如果存在 `agents.defaults.models`，該允許清單會驅動選擇器，包括保持供應商限定目錄動態的 `provider/*` 項目。否則，選擇器會顯示明確的 `models.providers.*.models` 項目，以及具有可用驗證的供應商。完整目錄仍可透過除錯用 `models.list` RPC 搭配 `view: "all"` 取得。
    - 當新的 Gateway 工作階段用量報告包含目前內容權杖時，聊天撰寫器區域會顯示精簡的內容用量指示器。它會在高內容壓力時切換為警告樣式，並在建議的 Compaction 等級時顯示精簡按鈕，用來執行一般工作階段 Compaction 路徑。過期的權杖快照會被隱藏，直到 Gateway 再次回報新的用量。

  </Accordion>
  <Accordion title="對話模式（瀏覽器即時）">
    對話模式使用已註冊的即時語音供應商。設定 OpenAI 時，使用 `talk.realtime.provider: "openai"`，並搭配 `talk.realtime.providers.openai.apiKey`、`OPENAI_API_KEY` 或 `openai-codex` OAuth 設定檔；設定 Google 時，使用 `talk.realtime.provider: "google"`，並搭配 `talk.realtime.providers.google.apiKey`。瀏覽器永遠不會收到標準供應商 API 金鑰。OpenAI 會收到用於 WebRTC 的暫時 Realtime 用戶端祕密。Google Live 會收到用於瀏覽器 WebSocket 工作階段的一次性受限 Live API 驗證權杖，且指示與工具宣告會由 Gateway 鎖定在權杖中。只公開後端即時橋接的供應商會透過 Gateway 中繼傳輸執行，因此認證與供應商通訊端會留在伺服器端，而瀏覽器音訊會透過已驗證的 Gateway RPC 移動。Realtime 工作階段提示由 Gateway 組裝；`talk.client.create` 不接受呼叫端提供的指示覆寫。

    聊天撰寫器在對話開始/停止按鈕旁包含對話選項按鈕。這些選項會套用到下一個對話工作階段，並可覆寫供應商、傳輸、模型、語音、推理努力程度、VAD 閾值、靜音持續時間與前置填補。當某個選項留白時，Gateway 會在可用時使用已設定的預設值，否則使用供應商預設值。選取 Gateway 中繼會強制使用後端中繼路徑；選取 WebRTC 會保持工作階段由用戶端擁有，且若供應商無法建立瀏覽器工作階段，會失敗而不是無聲地退回中繼。

    在聊天撰寫器中，對話控制項是麥克風聽寫按鈕旁的波形按鈕。對話開始時，撰寫器狀態列會顯示 `Connecting Talk...`，音訊連線後顯示 `Talk live`，或在即時工具呼叫透過 `talk.client.toolCall` 諮詢已設定的較大型模型時顯示 `Asking OpenClaw...`。

    維護者即時煙霧測試：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 會驗證 OpenAI 後端 WebSocket 橋接、OpenAI 瀏覽器 WebRTC SDP 交換、Google Live 受限權杖瀏覽器 WebSocket 設定，以及搭配假麥克風媒體的 Gateway 中繼瀏覽器配接器。此命令只會列印供應商狀態，不會記錄祕密。

  </Accordion>
  <Accordion title="停止與中止">
    - 按一下 **停止**（呼叫 `chat.abort`）。
    - 執行作用中時，一般後續訊息會排入佇列。按一下佇列訊息上的 **Steer**，可將該後續訊息注入正在執行的回合。
    - 輸入 `/stop`（或獨立中止片語，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）即可帶外中止。
    - `chat.abort` 支援 `{ sessionKey }`（沒有 `runId`）來中止該工作階段的所有作用中執行。

  </Accordion>
  <Accordion title="中止部分保留">
    - 當執行被中止時，部分助理文字仍可顯示在 UI 中。
    - 當存在已緩衝輸出時，Gateway 會將已中止的部分助理文字持久化到轉錄歷史中。
    - 持久化項目包含中止中繼資料，讓轉錄消費者能分辨中止部分與正常完成輸出。

  </Accordion>
</AccordionGroup>

## PWA 安裝與網頁推播

Control UI 隨附 `manifest.webmanifest` 和 service worker，因此現代瀏覽器可以將其安裝為獨立 PWA。Web Push 可讓 Gateway 即使在分頁或瀏覽器視窗未開啟時，也能用通知喚醒已安裝的 PWA。

| 表面                                                  | 功能                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest。瀏覽器在可觸及後會提供「安裝應用程式」。             |
| `ui/public/sw.js`                                     | 處理 `push` 事件與通知點擊的 service worker。                      |
| `push/vapid-keys.json`（在 OpenClaw 狀態目錄下）      | 自動產生的 VAPID 金鑰組，用於簽署 Web Push 酬載。                  |
| `push/web-push-subscriptions.json`                    | 持久化的瀏覽器訂閱端點。                                           |

當你想固定金鑰（用於多主機部署、祕密輪替或測試）時，請透過 Gateway 行程上的環境變數覆寫 VAPID 金鑰組：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（預設為 `mailto:openclaw@localhost`）

Control UI 使用這些範圍控管的 Gateway 方法來註冊與測試瀏覽器訂閱：

- `push.web.vapidPublicKey` — 擷取作用中的 VAPID 公開金鑰。
- `push.web.subscribe` — 註冊 `endpoint` 加上 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 移除已註冊的端點。
- `push.web.test` — 傳送測試通知到呼叫端的訂閱。

<Note>
Web Push 獨立於 iOS APNS 中繼路徑（中繼支援的推播請參閱 [Configuration](/zh-TW/gateway/configuration)）以及既有的 `push.test` 方法，後者鎖定原生行動配對。
</Note>

## 託管嵌入

助理訊息可以使用 `[embed ...]` 短碼內嵌轉譯託管的網頁內容。iframe sandbox 政策由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    停用託管嵌入內的指令碼執行。
  </Tab>
  <Tab title="scripts（預設）">
    在保持來源隔離的同時允許互動式嵌入；這是預設值，通常足以用於自包含的瀏覽器遊戲/小工具。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 之上新增 `allow-same-origin`，用於有意需要更強權限的同站文件。
  </Tab>
</Tabs>

範例：

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
只有在嵌入文件確實需要同源行為時才使用 `trusted`。對於多數代理生成的遊戲與互動畫布，`scripts` 是較安全的選擇。
</Warning>

絕對外部 `http(s)` 嵌入 URL 預設仍會被封鎖。如果你刻意想讓 `[embed url="https://..."]` 載入第三方頁面，請設定 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天訊息寬度

群組聊天訊息使用可讀性良好的預設最大寬度。寬螢幕部署可透過設定 `gateway.controlUi.chatMessageMaxWidth` 覆寫，而不需要修補 bundled CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

此值在到達瀏覽器前會先驗證。支援的值包括純長度與百分比，例如 `960px` 或 `82%`，以及受限制的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 寬度運算式。

## Tailnet 存取（建議）

<Tabs>
  <Tab title="整合式 Tailscale Serve（偏好）">
    讓 Gateway 保持在 loopback，並讓 Tailscale Serve 透過 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    開啟：

    - `https://<magicdns>/`（或你設定的 `gateway.controlUi.basePath`）

    預設情況下，當 `gateway.auth.allowTailscale` 為 `true` 時，控制 UI/WebSocket Serve 請求可以透過 Tailscale 身分標頭 (`tailscale-user-login`) 進行驗證。OpenClaw 會使用 `tailscale whois` 解析 `x-forwarded-for` 位址並與該標頭比對，以驗證身分，而且只在請求命中迴環位址並帶有 Tailscale 的 `x-forwarded-*` 標頭時接受。對於具有瀏覽器裝置身分的控制 UI 操作員工作階段，這條已驗證的 Serve 路徑也會略過裝置配對往返；沒有裝置身分的瀏覽器和節點角色連線仍會遵循一般裝置檢查。如果你想要求即使是 Serve 流量也必須使用明確的共享祕密憑證，請設定 `gateway.auth.allowTailscale: false`。接著使用 `gateway.auth.mode: "token"` 或 `"password"`。

    對於該非同步 Serve 身分路徑，來自相同用戶端 IP 和驗證範圍的驗證失敗嘗試，會在寫入速率限制前被序列化。因此，同一個瀏覽器並行送出的錯誤重試，第二個請求可能會顯示 `retry later`，而不是兩個一般不相符結果並行競速。

    <Warning>
    無權杖的 Serve 驗證假設 Gateway 主機是可信任的。如果不受信任的本機程式碼可能在該主機上執行，請要求權杖/密碼驗證。
    </Warning>

  </Tab>
  <Tab title="繫結至 tailnet + 權杖">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    然後開啟：

    - `http://<tailscale-ip>:18789/`（或你設定的 `gateway.controlUi.basePath`）

    將相符的共享祕密貼到 UI 設定中（以 `connect.params.auth.token` 或 `connect.params.auth.password` 傳送）。

  </Tab>
</Tabs>

## 不安全的 HTTP

如果你透過純 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）開啟儀表板，瀏覽器會在**非安全內容**中執行並封鎖 WebCrypto。預設情況下，OpenClaw 會**封鎖**沒有裝置身分的控制 UI 連線。

已記載的例外：

- 僅限 localhost 的不安全 HTTP 相容性，使用 `gateway.controlUi.allowInsecureAuth=true`
- 透過 `gateway.auth.mode: "trusted-proxy"` 成功完成操作員控制 UI 驗證
- 緊急破除限制的 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**建議修正：**使用 HTTPS（Tailscale Serve）或在本機開啟 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在 Gateway 主機上）

<AccordionGroup>
  <Accordion title="不安全驗證切換行為">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` 只是本機相容性切換：

    - 它允許 localhost 控制 UI 工作階段在非安全 HTTP 內容中於沒有裝置身分的情況下繼續。
    - 它不會繞過配對檢查。
    - 它不會放寬遠端（非 localhost）裝置身分要求。

  </Accordion>
  <Accordion title="僅限緊急破除限制">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` 會停用控制 UI 裝置身分檢查，是嚴重的安全性降級。緊急使用後請盡快還原。
    </Warning>

  </Accordion>
  <Accordion title="可信任 Proxy 注意事項">
    - 成功的 trusted-proxy 驗證可以允許沒有裝置身分的**操作員**控制 UI 工作階段進入。
    - 這不會延伸到節點角色控制 UI 工作階段。
    - 同主機迴環反向 Proxy 仍不符合 trusted-proxy 驗證；請參閱[可信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

請參閱 [Tailscale](/zh-TW/gateway/tailscale) 取得 HTTPS 設定指引。

## 內容安全政策

控制 UI 隨附嚴格的 `img-src` 政策：只允許**同源**資產、`data:` URL，以及本機產生的 `blob:` URL。遠端 `http(s)` 和協定相對圖片 URL 會被瀏覽器拒絕，且不會發出網路擷取。

實務上的含義：

- 透過相對路徑提供的頭像和圖片（例如 `/avatars/<id>`）仍會顯示，包括 UI 會擷取並轉換為本機 `blob:` URL 的已驗證頭像路由。
- 內嵌 `data:image/...` URL 仍會顯示（適用於通訊協定內的承載）。
- 控制 UI 建立的本機 `blob:` URL 仍會顯示。
- 通道中繼資料發出的遠端頭像 URL 會在控制 UI 的頭像輔助程式中被移除，並以內建標誌/徽章取代，因此遭入侵或惡意通道無法強迫操作員瀏覽器擷取任意遠端圖片。

你不需要變更任何設定即可取得此行為；它永遠啟用且不可設定。

## 頭像路由驗證

設定 Gateway 驗證時，控制 UI 頭像端點會要求與 API 其他部分相同的 Gateway 權杖：

- `GET /avatar/<agentId>` 只會向已驗證呼叫者傳回頭像圖片。`GET /avatar/<agentId>?meta=1` 會在相同規則下傳回頭像中繼資料。
- 對任一路由的未驗證請求都會被拒絕（與同層的 assistant-media 路由一致）。這可防止頭像路由在其他部分受保護的主機上洩漏代理身分。
- 控制 UI 本身在擷取頭像時會將 Gateway 權杖作為 bearer 標頭轉送，並使用已驗證的 blob URL，讓圖片仍能在儀表板中顯示。

如果你停用 Gateway 驗證（不建議在共享主機上這麼做），頭像路由也會與 Gateway 其他部分一致，變成不需要驗證。

## 助理媒體路由驗證

設定 Gateway 驗證時，助理本機媒體預覽會使用兩步驟路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 需要一般控制 UI 操作員驗證。瀏覽器在檢查可用性時會將 Gateway 權杖作為 bearer 標頭傳送。
- 成功的中繼資料回應會包含短效 `mediaTicket`，限定於該確切來源路徑。
- 瀏覽器呈現的圖片、音訊、影片和文件 URL 會使用 `mediaTicket=<ticket>`，而不是有效的 Gateway 權杖或密碼。該票證會很快過期，且無法授權不同來源。

這讓一般媒體呈現能與瀏覽器原生媒體元素相容，同時不會把可重複使用的 Gateway 憑證放進可見媒體 URL。

## 建置 UI

Gateway 會從 `dist/control-ui` 提供靜態檔案。使用以下指令建置：

```bash
pnpm ui:build
```

選用的絕對基底（當你想要固定資產 URL 時）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

本機開發（獨立開發伺服器）：

```bash
pnpm ui:dev
```

接著將 UI 指向你的 Gateway WS URL（例如 `ws://127.0.0.1:18789`）。

## 偵錯/測試：開發伺服器 + 遠端 Gateway

控制 UI 是靜態檔案；WebSocket 目標可設定，且可以不同於 HTTP 來源。當你想在本機使用 Vite 開發伺服器，但 Gateway 在其他位置執行時，這很方便。

<Steps>
  <Step title="啟動 UI 開發伺服器">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="使用 gatewayUrl 開啟">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    選用的一次性驗證（如有需要）：

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="注意事項">
    - `gatewayUrl` 會在載入後儲存在 localStorage，並從 URL 中移除。
    - 如果你透過 `gatewayUrl` 傳入完整的 `ws://` 或 `wss://` 端點，請對 `gatewayUrl` 值進行 URL 編碼，讓瀏覽器能正確解析查詢字串。
    - 只要可能，`token` 應透過 URL 片段（`#token=...`）傳入。片段不會傳送到伺服器，可避免請求記錄和 Referer 洩漏。舊版 `?token=` 查詢參數仍會為了相容性匯入一次，但僅作為後備，且會在啟動後立即移除。
    - `password` 只會保留在記憶體中。
    - 設定 `gatewayUrl` 時，UI 不會退回使用設定或環境憑證。請明確提供 `token`（或 `password`）。缺少明確憑證會視為錯誤。
    - 當 Gateway 位於 TLS 後方時（Tailscale Serve、HTTPS Proxy 等），請使用 `wss://`。
    - `gatewayUrl` 只會在頂層視窗中被接受（不可嵌入），以防止點擊劫持。
    - 非迴環控制 UI 部署必須明確設定 `gateway.controlUi.allowedOrigins`（完整來源）。這包含遠端開發設定。
    - Gateway 啟動時可能會根據有效的執行階段繫結和連接埠，植入如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>` 的本機來源，但遠端瀏覽器來源仍需要明確項目。
    - 除非是嚴格控管的本機測試，否則不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允許任何瀏覽器來源，而不是「符合我正在使用的任何主機」。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 會啟用 Host 標頭來源後備模式，但這是危險的安全模式。

  </Accordion>
</AccordionGroup>

範例：

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

遠端存取設定詳細資訊：[遠端存取](/zh-TW/gateway/remote)。

## 相關

- [儀表板](/zh-TW/web/dashboard) — Gateway 儀表板
- [健康檢查](/zh-TW/gateway/health) — Gateway 健康監控
- [TUI](/zh-TW/web/tui) — 終端使用者介面
- [WebChat](/zh-TW/web/webchat) — 瀏覽器式聊天介面
