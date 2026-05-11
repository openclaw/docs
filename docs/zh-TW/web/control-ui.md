---
read_when:
    - 你想從瀏覽器操作 Gateway
    - 你想要在不使用 SSH 通道的情況下存取 Tailnet
sidebarTitle: Control UI
summary: 瀏覽器式 Gateway 控制 UI（聊天、節點、設定）
title: 控制介面
x-i18n:
    generated_at: "2026-05-11T20:38:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0033b2666fe76bd23d5585d05b39fdd33f8d15d4e7c16561b5cfd0e75b8d22e
    source_path: web/control-ui.md
    workflow: 16
---

Control UI 是一個由 Gateway 提供服務的小型 **Vite + Lit** 單頁應用程式：

- 預設：`http://<host>:18789/`
- 選用前綴：設定 `gateway.controlUi.basePath`（例如 `/openclaw`）

它會在同一個連接埠上**直接與 Gateway WebSocket** 通訊。

## 快速開啟（本機）

如果 Gateway 正在同一台電腦上執行，請開啟：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果頁面載入失敗，請先啟動 Gateway：`openclaw gateway`。

Auth 會在 WebSocket 交握期間透過以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 當 `gateway.auth.allowTailscale: true` 時使用 Tailscale Serve 身分標頭
- 當 `gateway.auth.mode: "trusted-proxy"` 時使用 trusted-proxy 身分標頭

儀表板設定面板會為目前瀏覽器分頁工作階段和所選 gateway URL 保留 token；密碼不會被持久化。Onboarding 通常會在首次連線時為 shared-secret auth 產生 gateway token，但當 `gateway.auth.mode` 為 `"password"` 時也可使用密碼 auth。

## 裝置配對（首次連線）

當你從新的瀏覽器或裝置連線到 Control UI 時，Gateway 通常會要求**一次性配對核准**。這是一項安全措施，用於防止未授權存取。

**你會看到：**「disconnected (1008): pairing required」

<Steps>
  <Step title="列出待處理請求">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="依請求 ID 核准">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

如果瀏覽器以變更後的 auth 詳細資料（role/scopes/public key）重試配對，先前的待處理請求會被取代，並建立新的 `requestId`。核准前請重新執行 `openclaw devices list`。

如果瀏覽器已配對，而你將它從讀取存取變更為寫入/admin 存取，這會被視為核准升級，而不是靜默重新連線。OpenClaw 會保留舊核准、封鎖更廣泛的重新連線，並要求你明確核准新的 scope 集合。

核准後，裝置會被記住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤銷它，否則不需要重新核准。請參閱 [Devices CLI](/zh-TW/cli/devices) 了解 token 輪替與撤銷。

<Note>
- 直接的 local loopback 瀏覽器連線（`127.0.0.1` / `localhost`）會自動核准。
- 當 `gateway.auth.allowTailscale: true`、Tailscale 身分驗證通過，且瀏覽器出示其裝置身分時，Tailscale Serve 可為 Control UI operator 工作階段略過配對來回流程。
- 直接 Tailnet 綁定、LAN 瀏覽器連線，以及沒有裝置身分的瀏覽器設定檔仍需要明確核准。
- 每個瀏覽器設定檔都會產生唯一的裝置 ID，因此切換瀏覽器或清除瀏覽器資料都需要重新配對。

</Note>

## 個人身分（瀏覽器本機）

Control UI 支援每個瀏覽器一組個人身分（顯示名稱與 avatar），會附加到傳出的訊息，以便在共享工作階段中標示歸屬。它存在於瀏覽器儲存空間中，範圍限定於目前的瀏覽器設定檔，不會同步到其他裝置，也不會在伺服器端持久化，除了你實際傳送訊息上的一般 transcript authorship metadata。清除網站資料或切換瀏覽器會將它重設為空。

相同的瀏覽器本機模式也適用於 assistant avatar override。上傳的 assistant avatars 只會在本機瀏覽器中覆蓋 gateway 解析出的身分，絕不會透過 `config.patch` 往返傳送。共享的 `ui.assistant.avatar` config 欄位仍可供非 UI 用戶端直接寫入該欄位（例如 scripted gateways 或自訂 dashboards）。

## 執行階段 config endpoint

Control UI 會從 `/__openclaw/control-ui-config.json` 擷取其執行階段設定。該 endpoint 受與其餘 HTTP 表面相同的 gateway auth 控制：未經驗證的瀏覽器無法擷取它，成功擷取需要已有效的 gateway token/password、Tailscale Serve 身分，或 trusted-proxy 身分。

## 語言支援

Control UI 可在首次載入時根據你的瀏覽器 locale 自行本地化。若之後要覆寫，請開啟 **Overview -> Gateway Access -> Language**。locale 選擇器位於 Gateway Access 卡片中，而不是 Appearance 底下。

- 支援的 locales：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`ar`、`it`、`tr`、`uk`、`id`、`pl`、`th`、`vi`、`nl`、`fa`
- 非英文翻譯會在瀏覽器中延遲載入。
- 選取的 locale 會儲存在瀏覽器儲存空間，並在未來造訪時重用。
- 遺漏的翻譯鍵會回退到英文。

Docs 翻譯會為同一組非英文 locale 產生，但 docs 網站內建的 Mintlify 語言選擇器僅限於 Mintlify 接受的 locale codes。泰文（`th`）和波斯文（`fa`）docs 仍會在 publish repo 中產生；在 Mintlify 支援這些 codes 之前，它們可能不會出現在該選擇器中。

## 外觀 themes

Appearance 面板保留內建的 Claw、Knot 和 Dash themes，以及一個瀏覽器本機 tweakcn 匯入槽。若要匯入 theme，請開啟 [tweakcn editor](https://tweakcn.com/editor/theme)、選擇或建立 theme、按一下 **Share**，並將複製的 theme link 貼到 Appearance。匯入器也接受 `https://tweakcn.com/r/themes/<id>` registry URLs、像 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 這類 editor URLs、相對 `/themes/<id>` 路徑、原始 theme IDs，以及像 `amethyst-haze` 這類預設 theme names。

匯入的 themes 只會儲存在目前瀏覽器設定檔中。它們不會寫入 gateway config，也不會跨裝置同步。替換匯入的 theme 會更新唯一的本機槽；清除它會在匯入的 theme 已被選取時，將啟用中的 theme 切回 Claw。

## 它目前能做什麼

<AccordionGroup>
  <Accordion title="聊天和語音交談">
    - 透過 Gateway WS 與模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 聊天記錄重新整理會請求有界限的近期視窗，並包含每則訊息文字上限，因此大型工作階段不會迫使瀏覽器在聊天可用前渲染完整 transcript payload。
    - 透過瀏覽器 realtime 工作階段進行語音交談。OpenAI 使用直接 WebRTC，Google Live 透過 WebSocket 使用受限制的一次性瀏覽器 token，而僅限後端的 realtime voice plugins 使用 Gateway relay transport。用戶端持有的 provider 工作階段以 `talk.client.create` 開始；Gateway relay 工作階段以 `talk.session.create` 開始。relay 會將 provider credentials 保留在 Gateway 上，同時瀏覽器透過 `talk.session.appendAudio` 串流 microphone PCM，並透過 `talk.client.toolCall` 轉送 `openclaw_agent_consult` provider tool calls，以套用 Gateway policy 和較大的已設定 OpenClaw model。
    - 在 Chat 中串流 tool calls 和即時 tool output cards（agent events）。

  </Accordion>
  <Accordion title="Channels、instances、sessions、dreams">
    - Channels：內建加上 bundled/external plugin channels 的狀態、QR login，以及每個 channel config（`channels.status`、`web.login.*`、`config.patch`）。
    - Channel probe 重新整理會在較慢的 provider checks 完成時保留上一個 snapshot 可見，並在 probe 或 audit 超過其 UI budget 時標記 partial snapshots。
    - Instances：presence list + refresh（`system-presence`）。
    - Sessions：預設列出 configured-agent sessions，從 stale unconfigured agent session keys 回退，並套用每個 session 的 model/thinking/fast/verbose/trace/reasoning overrides（`sessions.list`、`sessions.patch`）。
    - Dreams：dreaming 狀態、啟用/停用切換，以及 Dream Diary reader（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、nodes、exec approvals">
    - Cron jobs：列出/新增/編輯/執行/啟用/停用 + 執行記錄（`cron.*`）。
    - Skills：狀態、啟用/停用、安裝、API key 更新（`skills.*`）。
    - Nodes：列表 + caps（`node.list`）。
    - Exec approvals：編輯 gateway 或 node allowlists + `exec host=gateway/node` 的 ask policy（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="Config">
    - 檢視/編輯 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - 透過驗證套用 + 重新啟動（`config.apply`），並喚醒最後一個 active session。
    - 寫入包含 base-hash guard，以防止覆蓋並行編輯。
    - 寫入（`config.set`/`config.apply`/`config.patch`）會對 submitted config payload 中 refs 的 active SecretRef resolution 執行 preflight；未解析的 active submitted refs 會在寫入前被拒絕。
    - Schema + 表單渲染（`config.schema` / `config.schema.lookup`，包含欄位 `title` / `description`、匹配的 UI hints、immediate child summaries、nested object/wildcard/array/composition nodes 上的 docs metadata，加上可用時的 plugin + channel schemas）；Raw JSON editor 只有在 snapshot 具備安全 raw round-trip 時才可用。
    - 如果 snapshot 無法安全地 round-trip raw text，Control UI 會強制使用 Form mode，並對該 snapshot 停用 Raw mode。
    - Raw JSON editor 的「Reset to saved」會保留 raw-authored shape（格式、註解、`$include` 版面），而不是重新渲染扁平化的 snapshot，因此當 snapshot 可安全 round-trip 時，外部編輯可在 reset 後保留。
    - Structured SecretRef object values 會在 form text inputs 中以唯讀方式渲染，以防止意外的 object-to-string 損壞。

  </Accordion>
  <Accordion title="Debug、logs、update">
    - Debug：status/health/models snapshots + event log + manual RPC calls（`status`、`health`、`models.list`）。
    - event log 包含 Control UI refresh/RPC timings、slow chat/config render timings，以及當瀏覽器公開這些 PerformanceObserver entry types 時，針對 long animation frames 或 long tasks 的 browser responsiveness entries。
    - Logs：gateway file logs 的即時 tail，附 filter/export（`logs.tail`）。
    - Update：執行 package/git update + restart（`update.run`）並提供 restart report，然後在重新連線後輪詢 `update.status`，以驗證執行中的 gateway 版本。

  </Accordion>
  <Accordion title="Cron jobs 面板注意事項">
    - 對於 isolated jobs，delivery 預設為 announce summary。如果你想要 internal-only runs，可以切換為 none。
    - 當選取 announce 時，會顯示 channel/target fields。
    - Webhook 模式使用 `delivery.mode = "webhook"`，並將 `delivery.to` 設為有效的 HTTP(S) webhook URL。
    - 對於 main-session jobs，可使用 webhook 和 none delivery modes。
    - Advanced edit controls 包含 delete-after-run、clear agent override、cron exact/stagger options、agent model/thinking overrides，以及 best-effort delivery toggles。
    - 表單驗證會以 inline 方式顯示 field-level errors；無效值會停用儲存按鈕，直到修正為止。
    - 設定 `cron.webhookToken` 可傳送專用 bearer token；如果省略，webhook 會在沒有 auth header 的情況下傳送。
    - Deprecated fallback：儲存的 legacy jobs 若具有 `notify: true`，仍可使用 `cron.webhook`，直到遷移完成。

  </Accordion>
</AccordionGroup>

## 聊天行為

<AccordionGroup>
  <Accordion title="傳送與歷史語義">
    - `chat.send` 是**非阻塞**的：它會立即以 `{ runId, status: "started" }` 確認，回應則透過 `chat` 事件串流傳送。
    - Chat 上傳接受圖片以及非影片檔案。圖片保留原生圖片路徑；其他檔案會儲存為受管理媒體，並在歷史記錄中顯示為附件連結。
    - 使用相同的 `idempotencyKey` 重新傳送時，執行中會回傳 `{ status: "in_flight" }`，完成後會回傳 `{ status: "ok" }`。
    - `chat.history` 回應會基於 UI 安全性限制大小。當逐字稿項目過大時，Gateway 可能會截斷長文字欄位、省略沉重的中繼資料區塊，並以佔位符（`[chat.history omitted: message too large]`）取代過大的訊息。
    - 助理/產生的圖片會作為受管理媒體參照持久化，並透過已驗證的 Gateway 媒體 URL 回傳，因此重新載入不依賴原始 base64 圖片承載資料仍留在聊天歷史回應中。
    - 呈現 `chat.history` 時，Control UI 會從可見助理文字中移除僅供顯示的行內指令標籤（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、純文字工具呼叫 XML 承載資料（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及被截斷的工具呼叫區塊）和洩漏的 ASCII/全形模型控制權杖，並省略整段可見文字只是不發聲權杖 `NO_REPLY` / `no_reply` 或 Heartbeat 確認權杖 `HEARTBEAT_OK` 的助理項目。
    - 在作用中的傳送期間及最後的歷史重新整理期間，如果 `chat.history` 短暫回傳較舊的快照，聊天檢視會保留本機樂觀使用者/助理訊息可見；一旦 Gateway 歷史追上，權威逐字稿就會取代這些本機訊息。
    - 即時 `chat` 事件是傳遞狀態，而 `chat.history` 是從持久化工作階段逐字稿重建。工具最終事件之後，Control UI 會重新載入歷史並只合併一小段樂觀尾端；逐字稿邊界記錄於 [WebChat](/zh-TW/web/webchat)。
    - `chat.inject` 會將助理註記附加到工作階段逐字稿，並廣播一個 `chat` 事件用於僅限 UI 的更新（沒有代理執行，沒有通道傳遞）。
    - 聊天標頭會在工作階段選擇器之前顯示代理篩選器，且工作階段選擇器會以所選代理為範圍。切換代理時只會顯示繫結到該代理的工作階段；若該代理尚未儲存任何儀表板工作階段，則會回退到該代理的主要工作階段。
    - 在桌面寬度下，聊天控制項會保持在一個精簡列上，並在向下捲動逐字稿時收合；向上捲動、返回頂端或到達底部時會還原控制項。
    - 連續重複的純文字訊息會呈現為一個帶有數量徽章的氣泡。帶有圖片、附件、工具輸出或畫布預覽的訊息不會收合。
    - 聊天標頭中的模型與思考選擇器會立即透過 `sessions.patch` 修補作用中工作階段；它們是持久的工作階段覆寫，而不是只限單輪的傳送選項。
    - 如果你在同一工作階段的模型選擇器變更仍在儲存時傳送訊息，編寫器會先等待該工作階段修補完成，再呼叫 `chat.send`，讓傳送使用所選模型。
    - 在 Control UI 中輸入 `/new` 會建立並切換到與「新增聊天」相同的全新儀表板工作階段，但當已設定 `session.dmScope: "main"` 且目前父項是代理的主要工作階段時除外；在該情況下，它會就地重設主要工作階段。輸入 `/reset` 會保留 Gateway 對目前工作階段的明確就地重設。
    - 聊天模型選擇器會請求 Gateway 已設定的模型檢視。如果存在 `agents.defaults.models`，該允許清單會驅動選擇器，包括讓提供者範圍型目錄保持動態的 `provider/*` 項目。否則，選擇器會顯示明確的 `models.providers.*.models` 項目，以及具有可用驗證的提供者。完整目錄仍可透過偵錯 `models.list` RPC 搭配 `view: "all"` 取得。
    - 當新的 Gateway 工作階段使用量報告包含目前內容權杖時，聊天編寫器區域會顯示精簡的內容使用量指示器。在高內容壓力時，它會切換為警告樣式；在建議的 Compaction 等級時，會顯示一個精簡按鈕，用來執行一般工作階段 Compaction 路徑。過期的權杖快照會隱藏，直到 Gateway 再次回報新的使用量。

  </Accordion>
  <Accordion title="通話模式（瀏覽器即時）">
    通話模式使用已註冊的即時語音提供者。設定 OpenAI 時，使用 `talk.realtime.provider: "openai"`，並搭配 `talk.realtime.providers.openai.apiKey`、`OPENAI_API_KEY` 或 `openai-codex` OAuth 設定檔；設定 Google 時，使用 `talk.realtime.provider: "google"`，並搭配 `talk.realtime.providers.google.apiKey`。瀏覽器絕不會收到標準提供者 API 金鑰。OpenAI 會收到用於 WebRTC 的暫時 Realtime 用戶端密鑰。Google Live 會收到一個用於瀏覽器 WebSocket 工作階段的一次性受限 Live API 驗證權杖，且指令和工具宣告會由 Gateway 鎖定在權杖中。只公開後端即時橋接的提供者會透過 Gateway 轉送傳輸執行，因此憑證與供應商 socket 會留在伺服器端，而瀏覽器音訊會透過已驗證的 Gateway RPC 移動。Realtime 工作階段提示會由 Gateway 組裝；`talk.client.create` 不接受呼叫者提供的指令覆寫。

    Chat 編寫器在通話開始/停止按鈕旁包含一個通話選項按鈕。這些選項會套用至下一個通話工作階段，並可覆寫提供者、傳輸、模型、語音、推理強度、VAD 閾值、靜默持續時間和前綴填補。當選項為空白時，Gateway 會使用可用的已設定預設值或提供者預設值。選取 Gateway 轉送會強制使用後端轉送路徑；選取 WebRTC 會讓工作階段由用戶端擁有，且若提供者無法建立瀏覽器工作階段，會失敗而不是靜默回退到轉送。

    在 Chat 編寫器中，通話控制項是麥克風聽寫按鈕旁的波浪按鈕。通話開始時，編寫器狀態列會顯示 `Connecting Talk...`，音訊連線時顯示 `Talk live`，或在即時工具呼叫正透過 `talk.client.toolCall` 諮詢已設定的較大型模型時顯示 `Asking OpenClaw...`。

    維護者即時煙霧測試：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 會驗證 OpenAI 後端 WebSocket 橋接、OpenAI 瀏覽器 WebRTC SDP 交換、Google Live 受限權杖瀏覽器 WebSocket 設定，以及使用假麥克風媒體的 Gateway 轉送瀏覽器配接器。此命令只列印提供者狀態，不會記錄密鑰。

  </Accordion>
  <Accordion title="停止與中止">
    - 按一下**停止**（呼叫 `chat.abort`）。
    - 執行作用中時，一般後續訊息會排入佇列。按一下佇列訊息上的**引導**，將該後續訊息注入正在執行的輪次。
    - 輸入 `/stop`（或獨立的中止片語，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以帶外中止。
    - `chat.abort` 支援 `{ sessionKey }`（沒有 `runId`），可中止該工作階段的所有作用中執行。

  </Accordion>
  <Accordion title="保留中止部分內容">
    - 當執行被中止時，部分助理文字仍可顯示在 UI 中。
    - 當存在已緩衝輸出時，Gateway 會將中止的部分助理文字持久化到逐字稿歷史。
    - 持久化項目包含中止中繼資料，因此逐字稿消費者可以分辨中止部分內容與一般完成輸出。

  </Accordion>
</AccordionGroup>

## PWA 安裝與網頁推播

Control UI 內建 `manifest.webmanifest` 和 service worker，因此現代瀏覽器可以將它安裝為獨立 PWA。Web Push 讓 Gateway 即使在分頁或瀏覽器視窗未開啟時，也能以通知喚醒已安裝的 PWA。

| 表面                                                  | 功能                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest。瀏覽器會在可存取後提供「安裝應用程式」。             |
| `ui/public/sw.js`                                     | 處理 `push` 事件和通知點擊的 service worker。                      |
| `push/vapid-keys.json`（位於 OpenClaw 狀態目錄下）    | 自動產生的 VAPID 金鑰組，用於簽署 Web Push 承載資料。              |
| `push/web-push-subscriptions.json`                    | 持久化的瀏覽器訂閱端點。                                           |

當你想固定金鑰（用於多主機部署、密鑰輪替或測試）時，請透過 Gateway 行程上的環境變數覆寫 VAPID 金鑰組：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（預設為 `mailto:openclaw@localhost`）

Control UI 使用這些範圍控管的 Gateway 方法來註冊和測試瀏覽器訂閱：

- `push.web.vapidPublicKey` — 擷取作用中的 VAPID 公鑰。
- `push.web.subscribe` — 註冊 `endpoint` 加上 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 移除已註冊的端點。
- `push.web.test` — 將測試通知傳送到呼叫者的訂閱。

<Note>
Web Push 獨立於 iOS APNS 轉送路徑（轉送支援的推播請參閱[設定](/zh-TW/gateway/configuration)）以及現有的 `push.test` 方法，後者以原生行動裝置配對為目標。
</Note>

## 託管嵌入

助理訊息可以使用 `[embed ...]` 短代碼行內呈現託管網頁內容。iframe sandbox 政策由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    停用託管嵌入內部的腳本執行。
  </Tab>
  <Tab title="scripts (default)">
    允許互動式嵌入，同時保留來源隔離；這是預設值，通常足以支援自含式瀏覽器遊戲/小工具。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 之上新增 `allow-same-origin`，用於刻意需要更強權限的同站文件。
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
只有在嵌入文件確實需要同源行為時才使用 `trusted`。對於大多數代理產生的遊戲和互動畫布，`scripts` 是較安全的選擇。
</Warning>

絕對外部 `http(s)` 嵌入 URL 預設仍會被封鎖。如果你刻意想讓 `[embed url="https://..."]` 載入第三方頁面，請設定 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天訊息寬度

群組化聊天訊息使用易讀的預設最大寬度。寬螢幕部署可以透過設定 `gateway.controlUi.chatMessageMaxWidth` 來覆寫它，而不必修補 bundled CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

此值會在到達瀏覽器前先驗證。支援的值包括一般長度和百分比，例如 `960px` 或 `82%`，以及受限制的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 寬度運算式。

## Tailnet 存取（建議）

<Tabs>
  <Tab title="整合式 Tailscale Serve（偏好）">
    將 Gateway 保持在 loopback，並讓 Tailscale Serve 以 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    開啟：

    - `https://<magicdns>/`（或你設定的 `gateway.controlUi.basePath`）

    預設情況下，當 `gateway.auth.allowTailscale` 為 `true` 時，Control UI/WebSocket Serve 請求可以透過 Tailscale 身分標頭（`tailscale-user-login`）進行驗證。OpenClaw 會使用 `tailscale whois` 解析 `x-forwarded-for` 位址並與該標頭比對，以驗證身分；而且只有在請求命中回送位址並帶有 Tailscale 的 `x-forwarded-*` 標頭時才會接受。對於具備瀏覽器裝置身分的 Control UI 操作員工作階段，這個已驗證的 Serve 路徑也會略過裝置配對來回流程；沒有裝置的瀏覽器與 node-role 連線仍會遵循一般裝置檢查。如果即使是 Serve 流量也想要求明確的共享密鑰憑證，請設定 `gateway.auth.allowTailscale: false`。接著使用 `gateway.auth.mode: "token"` 或 `"password"`。

    對於該非同步 Serve 身分路徑，來自相同用戶端 IP 與驗證範圍的驗證失敗嘗試，會在寫入速率限制前被序列化。因此，來自同一個瀏覽器的並行錯誤重試，可能會讓第二個請求顯示 `retry later`，而不是兩個單純不符的請求並行競速。

    <Warning>
    無 Token 的 Serve 驗證假設 gateway 主機是受信任的。如果不受信任的本機程式碼可能在該主機上執行，請要求 token/password 驗證。
    </Warning>

  </Tab>
  <Tab title="繫結到 tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    然後開啟：

    - `http://<tailscale-ip>:18789/`（或你設定的 `gateway.controlUi.basePath`）

    將相符的共享密鑰貼到 UI 設定中（以 `connect.params.auth.token` 或 `connect.params.auth.password` 傳送）。

  </Tab>
</Tabs>

## 不安全的 HTTP

如果你透過純 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）開啟儀表板，瀏覽器會在**非安全內容**中執行並封鎖 WebCrypto。預設情況下，OpenClaw 會**封鎖**沒有裝置身分的 Control UI 連線。

已記錄的例外：

- 僅限 localhost 的不安全 HTTP 相容性，使用 `gateway.controlUi.allowInsecureAuth=true`
- 透過 `gateway.auth.mode: "trusted-proxy"` 成功完成操作員 Control UI 驗證
- 緊急例外 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**建議修正：**使用 HTTPS（Tailscale Serve），或在本機開啟 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在 gateway 主機上）

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

    - 它允許 localhost Control UI 工作階段在非安全 HTTP 內容中，沒有裝置身分也能繼續。
    - 它不會繞過配對檢查。
    - 它不會放寬遠端（非 localhost）裝置身分要求。

  </Accordion>
  <Accordion title="僅供緊急例外使用">
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
    `dangerouslyDisableDeviceAuth` 會停用 Control UI 裝置身分檢查，並且是嚴重的安全性降級。緊急使用後請盡快還原。
    </Warning>

  </Accordion>
  <Accordion title="受信任 Proxy 說明">
    - 成功的 trusted-proxy 驗證可以允許**操作員** Control UI 工作階段沒有裝置身分。
    - 這**不會**延伸到 node-role Control UI 工作階段。
    - 同主機回送反向 Proxy 仍不滿足 trusted-proxy 驗證；請參閱[受信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

請參閱 [Tailscale](/zh-TW/gateway/tailscale) 以取得 HTTPS 設定指引。

## 內容安全性政策

Control UI 隨附嚴格的 `img-src` 政策：只允許**同源**資產、`data:` URL，以及本機產生的 `blob:` URL。遠端 `http(s)` 與通訊協定相對圖片 URL 會被瀏覽器拒絕，且不會發出網路擷取。

實務上的含義：

- 在相對路徑下提供的頭像與圖片（例如 `/avatars/<id>`）仍會呈現，包括 UI 擷取並轉換成本機 `blob:` URL 的已驗證頭像路由。
- 內嵌 `data:image/...` URL 仍會呈現（適合通訊協定內承載資料）。
- Control UI 建立的本機 `blob:` URL 仍會呈現。
- Channel metadata 發出的遠端頭像 URL 會在 Control UI 的頭像輔助工具中被移除，並替換為內建標誌/徽章，因此遭入侵或惡意 channel 無法強制操作員瀏覽器擷取任意遠端圖片。

你不需要變更任何設定即可取得此行為；它一律啟用且不可設定。

## 頭像路由驗證

設定 gateway 驗證時，Control UI 頭像端點需要與 API 其餘部分相同的 gateway token：

- `GET /avatar/<agentId>` 只會向已驗證呼叫者回傳頭像圖片。`GET /avatar/<agentId>?meta=1` 會依相同規則回傳頭像 metadata。
- 對任一路由的未驗證請求都會被拒絕（與相鄰的 assistant-media 路由一致）。這可防止頭像路由在原本受保護的主機上洩漏 agent 身分。
- Control UI 自身會在擷取頭像時，將 gateway token 作為 bearer 標頭轉送，並使用已驗證的 blob URL，讓圖片仍能在儀表板中呈現。

如果你停用 gateway 驗證（不建議在共享主機上使用），頭像路由也會變成未驗證，與 gateway 其餘部分一致。

## Assistant 媒體路由驗證

設定 gateway 驗證時，assistant 本機媒體預覽會使用兩步驟路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 需要一般 Control UI 操作員驗證。瀏覽器在檢查可用性時，會將 gateway token 作為 bearer 標頭傳送。
- 成功的 metadata 回應會包含短效 `mediaTicket`，範圍限定為該確切來源路徑。
- 瀏覽器呈現的圖片、音訊、影片與文件 URL 會使用 `mediaTicket=<ticket>`，而不是有效的 gateway token 或 password。ticket 很快就會過期，且無法授權其他來源。

這讓一般媒體呈現可與瀏覽器原生媒體元素相容，而不會把可重複使用的 gateway 憑證放在可見的媒體 URL 中。

## 建置 UI

Gateway 會從 `dist/control-ui` 提供靜態檔案。使用以下指令建置：

```bash
pnpm ui:build
```

選用的絕對基底（當你想要固定資產 URL 時）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

本機開發（獨立 dev server）：

```bash
pnpm ui:dev
```

接著將 UI 指向你的 Gateway WS URL（例如 `ws://127.0.0.1:18789`）。

## 空白 Control UI 頁面

如果瀏覽器載入空白儀表板，而且 DevTools 沒有顯示有用錯誤，可能是擴充功能或早期 content script 阻止 JavaScript 模組應用程式求值。靜態頁面包含純 HTML 復原面板，會在啟動後 `<openclaw-app>` 尚未註冊時顯示。

變更瀏覽器環境後，使用面板的**再試一次**動作，或在完成以下檢查後手動重新載入：

- 停用會注入所有頁面的擴充功能，尤其是具有 `<all_urls>` content script 的擴充功能。
- 試用私密視窗、乾淨的瀏覽器設定檔，或其他瀏覽器。
- 保持 Gateway 執行，並在瀏覽器變更後驗證相同的儀表板 URL。

## 偵錯/測試：dev server + 遠端 Gateway

Control UI 是靜態檔案；WebSocket 目標可設定，且可以不同於 HTTP origin。當你想在本機使用 Vite dev server，但 Gateway 在其他地方執行時，這很方便。

<Steps>
  <Step title="啟動 UI dev server">
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
    - 盡可能透過 URL 片段（`#token=...`）傳遞 `token`。片段不會傳送到伺服器，可避免請求記錄與 Referer 洩漏。舊版 `?token=` 查詢參數仍會為了相容性匯入一次，但只作為備援，並會在 bootstrap 後立即移除。
    - `password` 只保存在記憶體中。
    - 設定 `gatewayUrl` 時，UI 不會退回使用設定或環境憑證。請明確提供 `token`（或 `password`）。缺少明確憑證會產生錯誤。
    - Gateway 位於 TLS 後方時（Tailscale Serve、HTTPS Proxy 等），請使用 `wss://`。
    - `gatewayUrl` 只會在頂層視窗中被接受（不可嵌入），以防止 clickjacking。
    - 非回送 Control UI 部署必須明確設定 `gateway.controlUi.allowedOrigins`（完整 origins）。這包括遠端 dev 設定。
    - Gateway 啟動時可能會根據有效的 runtime bind 與 port，植入本機 origins，例如 `http://localhost:<port>` 與 `http://127.0.0.1:<port>`，但遠端瀏覽器 origins 仍需要明確項目。
    - 除非是嚴格受控的本機測試，否則不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允許任何瀏覽器 origin，而不是「符合我正在使用的任何主機」。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 會啟用 Host-header origin 備援模式，但這是危險的安全性模式。

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

- [儀表板](/zh-TW/web/dashboard) — gateway 儀表板
- [健康檢查](/zh-TW/gateway/health) — gateway 健康監控
- [TUI](/zh-TW/web/tui) — 終端機使用者介面
- [WebChat](/zh-TW/web/webchat) — 以瀏覽器為基礎的聊天介面
