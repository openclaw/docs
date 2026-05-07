---
read_when:
    - 你想從瀏覽器操作 Gateway
    - 你想在不使用 SSH 隧道的情況下存取 Tailnet
sidebarTitle: Control UI
summary: 適用於 Gateway 的瀏覽器式控制介面（聊天、節點、設定）
title: 控制介面
x-i18n:
    generated_at: "2026-05-07T13:27:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9ef19392f0d14aef9373e4469789f5916250f76038c8c81fe8a932c47913ca8
    source_path: web/control-ui.md
    workflow: 16
---

控制 UI 是由 Gateway 提供的小型 **Vite + Lit** 單頁應用程式：

- 預設：`http://<host>:18789/`
- 可選前置路徑：設定 `gateway.controlUi.basePath`（例如 `/openclaw`）

它會在同一個連接埠上**直接與 Gateway WebSocket** 通訊。

## 快速開啟（本機）

如果 Gateway 在同一台電腦上執行，請開啟：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果頁面載入失敗，請先啟動 Gateway：`openclaw gateway`。

身分驗證會在 WebSocket 握手期間透過以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` 時的 Tailscale Serve 身分標頭
- `gateway.auth.mode: "trusted-proxy"` 時的受信任代理身分標頭

儀表板設定面板會為目前的瀏覽器分頁工作階段和所選的 gateway URL 保留一個權杖；密碼不會被保存。初始設定通常會在第一次連線時為共享密鑰驗證產生 gateway 權杖，但當 `gateway.auth.mode` 為 `"password"` 時，密碼驗證也可以使用。

## 裝置配對（第一次連線）

當你從新的瀏覽器或裝置連線到控制 UI 時，Gateway 通常會要求**一次性配對核准**。這是一項防止未授權存取的安全措施。

**你會看到的內容：**「disconnected (1008): pairing required」

<Steps>
  <Step title="List pending requests">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Approve by request ID">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

如果瀏覽器使用已變更的驗證詳細資料（角色/範圍/公開金鑰）重試配對，先前待處理的請求會被取代，並建立新的 `requestId`。核准前請重新執行 `openclaw devices list`。

如果瀏覽器已配對，而你將它從讀取權限改為寫入/管理員權限，這會被視為核准升級，而不是靜默重新連線。OpenClaw 會保持舊核准有效、阻止較高權限的重新連線，並要求你明確核准新的範圍集合。

核准後，裝置會被記住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤銷它，否則不需要重新核准。權杖輪替與撤銷請參閱 [Devices CLI](/zh-TW/cli/devices)。

<Note>
- 直接的 local loopback 瀏覽器連線（`127.0.0.1` / `localhost`）會自動核准。
- 當 `gateway.auth.allowTailscale: true`、Tailscale 身分驗證通過，且瀏覽器提供其裝置身分時，Tailscale Serve 可以略過控制 UI 操作者工作階段的配對往返流程。
- 直接 Tailnet 綁定、LAN 瀏覽器連線，以及沒有裝置身分的瀏覽器設定檔仍然需要明確核准。
- 每個瀏覽器設定檔都會產生唯一裝置 ID，因此切換瀏覽器或清除瀏覽器資料都需要重新配對。

</Note>

## 個人身分（瀏覽器本機）

控制 UI 支援每個瀏覽器各自的個人身分（顯示名稱和頭像），附加到傳出的訊息，以便在共享工作階段中標示歸屬。它儲存在瀏覽器儲存空間中，範圍限於目前瀏覽器設定檔，不會同步到其他裝置，也不會在伺服器端保存，除了你實際傳送的訊息上一般的逐字稿作者中繼資料。清除網站資料或切換瀏覽器會將它重設為空白。

相同的瀏覽器本機模式也適用於助理頭像覆寫。上傳的助理頭像只會在本機瀏覽器上覆蓋 gateway 解析出的身分，絕不會透過 `config.patch` 往返傳送。共享的 `ui.assistant.avatar` 設定欄位仍可供非 UI 用戶端直接寫入該欄位（例如指令碼化 gateway 或自訂儀表板）。

## 執行階段設定端點

控制 UI 會從 `/__openclaw/control-ui-config.json` 擷取其執行階段設定。該端點與 HTTP 介面其餘部分一樣受相同的 gateway 驗證保護：未驗證的瀏覽器無法擷取它，而成功擷取需要已有效的 gateway 權杖/密碼、Tailscale Serve 身分，或受信任代理身分。

## 語言支援

控制 UI 可以在第一次載入時根據你的瀏覽器語系進行本地化。若要稍後覆寫，請開啟 **Overview -> Gateway Access -> Language**。語系選擇器位於 Gateway Access 卡片中，而不是 Appearance 底下。

- 支援的語系：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`ar`、`it`、`tr`、`uk`、`id`、`pl`、`th`、`vi`、`nl`、`fa`
- 非英文翻譯會在瀏覽器中延遲載入。
- 選取的語系會儲存在瀏覽器儲存空間中，並在未來造訪時重複使用。
- 缺少的翻譯鍵會回退到英文。

文件翻譯會針對相同的非英文語系集合產生，但文件網站內建的 Mintlify 語言選擇器僅限於 Mintlify 接受的語系代碼。泰文（`th`）和波斯文（`fa`）文件仍會在發布 repo 中產生；在 Mintlify 支援這些代碼之前，它們可能不會出現在該選擇器中。

## 外觀主題

Appearance 面板保留內建的 Claw、Knot 和 Dash 主題，外加一個瀏覽器本機 tweakcn 匯入槽。若要匯入主題，請開啟 [tweakcn editor](https://tweakcn.com/editor/theme)、選擇或建立主題、點擊 **Share**，並將複製的主題連結貼到 Appearance。匯入器也接受 `https://tweakcn.com/r/themes/<id>` 註冊表 URL、像 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 這樣的編輯器 URL、相對 `/themes/<id>` 路徑、原始主題 ID，以及 `amethyst-haze` 這類預設主題名稱。

匯入的主題只儲存在目前的瀏覽器設定檔中。它們不會寫入 gateway 設定，也不會跨裝置同步。取代匯入的主題會更新唯一的本機槽；如果所選的是匯入主題，清除它會將作用中主題切回 Claw。

## 它能做什麼（目前）

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - 透過 Gateway WS 與模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 聊天記錄重新整理會請求一個有界限的近期視窗，並對每則訊息設定文字上限，因此大型工作階段不會迫使瀏覽器在聊天可用前先渲染完整逐字稿 payload。
    - 透過瀏覽器即時工作階段對話。OpenAI 使用直接 WebRTC，Google Live 透過 WebSocket 使用受限的一次性瀏覽器權杖，而僅後端的即時語音 Plugins 使用 Gateway 中繼傳輸。用戶端擁有的提供者工作階段以 `talk.client.create` 開始；Gateway 中繼工作階段以 `talk.session.create` 開始。中繼會將提供者憑證保留在 Gateway 上，同時瀏覽器透過 `talk.session.appendAudio` 串流麥克風 PCM，並透過 `talk.client.toolCall` 轉發 `openclaw_agent_consult` 提供者工具呼叫，以套用 Gateway 政策和更大的已設定 OpenClaw 模型。
    - 在 Chat 中串流工具呼叫與即時工具輸出卡片（代理事件）。

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - 頻道：內建加上隨附/外部 Plugin 頻道狀態、QR 登入，以及每個頻道的設定（`channels.status`、`web.login.*`、`config.patch`）。
    - 頻道探測重新整理會在慢速提供者檢查完成前維持顯示先前快照，而當探測或稽核超過其 UI 預算時，部分快照會被標記。
    - 執行個體：存在清單與重新整理（`system-presence`）。
    - 工作階段：預設列出已設定代理工作階段、從過期的未設定代理工作階段鍵回退，並套用每個工作階段的模型/思考/快速/詳細/追蹤/推理覆寫（`sessions.list`、`sessions.patch`）。
    - Dreams：dreaming 狀態、啟用/停用切換，以及 Dream Diary 閱讀器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Cron 工作：列出/新增/編輯/執行/啟用/停用 + 執行記錄（`cron.*`）。
    - Skills：狀態、啟用/停用、安裝、API 金鑰更新（`skills.*`）。
    - 節點：清單 + caps（`node.list`）。
    - 執行核准：編輯 gateway 或節點允許清單 + `exec host=gateway/node` 的詢問政策（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="Config">
    - 檢視/編輯 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - 透過驗證套用 + 重新啟動（`config.apply`），並喚醒最後一個作用中的工作階段。
    - 寫入包含 base-hash 防護，以避免覆蓋並行編輯。
    - 寫入（`config.set`/`config.apply`/`config.patch`）會預先檢查提交設定 payload 中 ref 的作用中 SecretRef 解析；未解析的作用中已提交 ref 會在寫入前被拒絕。
    - Schema + 表單渲染（`config.schema` / `config.schema.lookup`，包含欄位 `title` / `description`、相符的 UI 提示、直接子項摘要、巢狀物件/萬用字元/陣列/組合節點上的文件中繼資料，以及可用時的 Plugin + 頻道 schema）；Raw JSON 編輯器只會在快照具有安全 raw 往返時可用。
    - 如果快照無法安全地往返 raw 文字，控制 UI 會強制使用 Form 模式，並停用該快照的 Raw 模式。
    - Raw JSON 編輯器的「Reset to saved」會保留 raw 撰寫的形狀（格式、註解、`$include` 版面），而不是重新渲染扁平化快照，因此當快照可以安全往返時，外部編輯會在重設後保留下來。
    - 結構化 SecretRef 物件值會在表單文字輸入中以唯讀方式渲染，以防止意外的物件轉字串損壞。

  </Accordion>
  <Accordion title="Debug, logs, update">
    - 偵錯：狀態/健康/模型快照 + 事件記錄 + 手動 RPC 呼叫（`status`、`health`、`models.list`）。
    - 事件記錄包含控制 UI 重新整理/RPC 計時、緩慢聊天/設定渲染計時，以及當瀏覽器公開這些 PerformanceObserver 項目類型時，長動畫影格或長任務的瀏覽器回應性項目。
    - 記錄：即時追蹤 gateway 檔案記錄，含篩選/匯出（`logs.tail`）。
    - 更新：執行套件/git 更新 + 重新啟動（`update.run`）並產生重新啟動報告，然後在重新連線後輪詢 `update.status` 以驗證執行中的 gateway 版本。

  </Accordion>
  <Accordion title="Cron jobs panel notes">
    - 對於隔離工作，傳遞預設為宣布摘要。如果你想要僅供內部使用的執行，可以切換為無。
    - 選取宣布時會顯示頻道/目標欄位。
    - Webhook 模式使用 `delivery.mode = "webhook"`，並將 `delivery.to` 設為有效的 HTTP(S) webhook URL。
    - 對於主工作階段工作，可使用 webhook 和無傳遞模式。
    - 進階編輯控制包含執行後刪除、清除代理覆寫、cron 精確/錯開選項、代理模型/思考覆寫，以及最佳努力傳遞切換。
    - 表單驗證會以欄位層級錯誤內嵌顯示；無效值會停用儲存按鈕，直到修正為止。
    - 設定 `cron.webhookToken` 可傳送專用 bearer 權杖；如果省略，webhook 會在沒有驗證標頭的情況下傳送。
    - 已棄用的後援：儲存的舊版工作若有 `notify: true`，在遷移前仍可使用 `cron.webhook`。

  </Accordion>
</AccordionGroup>

## 聊天行為

<AccordionGroup>
  <Accordion title="傳送與歷史語意">
    - `chat.send` 是**非阻塞式**：它會立即以 `{ runId, status: "started" }` 確認，且回應會透過 `chat` 事件串流。
    - 聊天上傳接受圖片加上非影片檔案。圖片保留原生圖片路徑；其他檔案會儲存為受管理媒體，並在歷史記錄中顯示為附件連結。
    - 使用相同的 `idempotencyKey` 重新傳送時，執行期間會傳回 `{ status: "in_flight" }`，完成後會傳回 `{ status: "ok" }`。
    - `chat.history` 回應會基於 UI 安全限制大小。當逐字稿項目過大時，Gateway 可能會截斷長文字欄位、省略大型中繼資料區塊，並以預留位置取代過大的訊息（`[chat.history omitted: message too large]`）。
    - 助理/產生的圖片會保存為受管理媒體參照，並透過已驗證的 Gateway 媒體 URL 回傳，因此重新載入不依賴原始 base64 圖片酬載持續留在聊天歷史回應中。
    - 轉譯 `chat.history` 時，Control UI 會從可見助理文字中移除僅供顯示的行內指令標籤（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、純文字工具呼叫 XML 酬載（包含 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及截斷的工具呼叫區塊）、外洩的 ASCII/全形模型控制權杖，並省略整段可見文字只有精確靜默權杖 `NO_REPLY` / `no_reply` 或 Heartbeat 確認權杖 `HEARTBEAT_OK` 的助理項目。
    - 在進行中的傳送與最終歷史重新整理期間，如果 `chat.history` 短暫傳回較舊的快照，聊天檢視會讓本機樂觀使用者/助理訊息保持可見；一旦 Gateway 歷史追上，權威逐字稿就會取代那些本機訊息。
    - 即時 `chat` 事件是傳遞狀態，而 `chat.history` 會從持久工作階段逐字稿重建。工具最終事件後，Control UI 會重新載入歷史，並只合併一小段樂觀尾端；逐字稿邊界記錄於 [WebChat](/zh-TW/web/webchat)。
    - `chat.inject` 會將助理註記附加到工作階段逐字稿，並廣播一個 `chat` 事件供僅限 UI 的更新使用（沒有代理執行，沒有通道傳遞）。
    - 聊天標頭會在工作階段選擇器之前顯示代理篩選器，且工作階段選擇器會依所選代理限定範圍。切換代理時只會顯示繫結到該代理的工作階段；若該代理尚無已儲存的儀表板工作階段，則會退回到該代理的主要工作階段。
    - 在桌面寬度下，聊天控制項會保持在一列精簡排列，並在向下捲動逐字稿時收合；向上捲動、回到頂部或抵達底部時會還原控制項。
    - 連續重複的純文字訊息會轉譯為一個帶有計數徽章的泡泡。攜帶圖片、附件、工具輸出或畫布預覽的訊息不會收合。
    - 聊天標頭的模型與思考選擇器會透過 `sessions.patch` 立即修補作用中工作階段；它們是持久的工作階段覆寫，不是僅限單一回合的傳送選項。
    - 在 Control UI 中輸入 `/new` 會建立並切換到與 New Chat 相同的全新儀表板工作階段。輸入 `/reset` 會保留 Gateway 對目前工作階段明確的原地重設。
    - 聊天模型選擇器會要求 Gateway 已設定的模型檢視。如果存在 `agents.defaults.models`，該允許清單會驅動選擇器。否則，選擇器會顯示明確的 `models.providers.*.models` 項目，加上具備可用驗證的供應商。完整目錄仍可透過偵錯 `models.list` RPC 搭配 `view: "all"` 使用。
    - 當新的 Gateway 工作階段使用量報告包含目前情境權杖時，聊天撰寫區會顯示精簡的情境使用量指示器。它會在高情境壓力下切換為警告樣式，並在建議的 Compaction 層級顯示一個精簡按鈕，用來執行正常的工作階段 Compaction 路徑。過期權杖快照會隱藏，直到 Gateway 再次報告新的使用量。

  </Accordion>
  <Accordion title="通話模式（瀏覽器即時）">
    通話模式使用已註冊的即時語音供應商。使用 `talk.realtime.provider: "openai"` 加上 `talk.realtime.providers.openai.apiKey` 設定 OpenAI，或使用 `talk.realtime.provider: "google"` 加上 `talk.realtime.providers.google.apiKey` 設定 Google。瀏覽器永遠不會收到標準供應商 API 金鑰。OpenAI 會收到用於 WebRTC 的暫時 Realtime 用戶端祕密。Google Live 會收到供瀏覽器 WebSocket 工作階段使用的一次性受限 Live API 驗證權杖，且指令與工具宣告會由 Gateway 鎖定到權杖中。只公開後端即時橋接的供應商會透過 Gateway 中繼傳輸執行，因此憑證與廠商 socket 會保留在伺服器端，而瀏覽器音訊會透過已驗證的 Gateway RPC 移動。Realtime 工作階段提示由 Gateway 組裝；`talk.client.create` 不接受呼叫端提供的指令覆寫。

    在聊天撰寫器中，通話控制項是麥克風聽寫按鈕旁的波浪按鈕。通話啟動時，撰寫器狀態列會顯示 `Connecting Talk...`，接著在音訊連線時顯示 `Talk live`，或在即時工具呼叫透過 `talk.client.toolCall` 諮詢已設定的較大型模型時顯示 `Asking OpenClaw...`。

    維護者即時煙霧測試：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 會驗證 OpenAI 瀏覽器 WebRTC SDP 交換、Google Live 受限權杖瀏覽器 WebSocket 設定，以及使用假麥克風媒體的 Gateway 中繼瀏覽器配接器。此命令只列印供應商狀態，且不會記錄祕密。

  </Accordion>
  <Accordion title="停止與中止">
    - 按一下 **停止**（呼叫 `chat.abort`）。
    - 當執行作用中時，一般後續訊息會排入佇列。按一下佇列訊息上的 **引導**，將該後續訊息注入正在執行的回合。
    - 輸入 `/stop`（或獨立中止片語，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）即可頻外中止。
    - `chat.abort` 支援 `{ sessionKey }`（沒有 `runId`），用來中止該工作階段的所有作用中執行。

  </Accordion>
  <Accordion title="中止部分保留">
    - 當執行被中止時，部分助理文字仍可顯示在 UI 中。
    - 當有緩衝輸出時，Gateway 會將中止的部分助理文字保存到逐字稿歷史。
    - 保存的項目包含中止中繼資料，讓逐字稿消費者能分辨中止部分與正常完成輸出。

  </Accordion>
</AccordionGroup>

## PWA 安裝與 Web Push

Control UI 隨附 `manifest.webmanifest` 與服務工作者，因此現代瀏覽器可將它安裝為獨立 PWA。Web Push 可讓 Gateway 以通知喚醒已安裝的 PWA，即使分頁或瀏覽器視窗未開啟也可以。

| 表面                                                  | 作用                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 資訊清單。瀏覽器在可連線後會提供「安裝應用程式」。             |
| `ui/public/sw.js`                                     | 處理 `push` 事件與通知點擊的服務工作者。                           |
| `push/vapid-keys.json`（位於 OpenClaw 狀態目錄下）    | 自動產生的 VAPID 金鑰組，用於簽署 Web Push 酬載。                  |
| `push/web-push-subscriptions.json`                    | 已保存的瀏覽器訂閱端點。                                           |

當你想固定金鑰（用於多主機部署、祕密輪替或測試）時，請在 Gateway 行程上透過環境變數覆寫 VAPID 金鑰組：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（預設為 `mailto:openclaw@localhost`）

Control UI 使用這些依範圍控管的 Gateway 方法來註冊與測試瀏覽器訂閱：

- `push.web.vapidPublicKey` — 擷取作用中的 VAPID 公開金鑰。
- `push.web.subscribe` — 註冊一個 `endpoint` 加上 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 移除已註冊的端點。
- `push.web.test` — 將測試通知傳送到呼叫端的訂閱。

<Note>
Web Push 獨立於 iOS APNS 中繼路徑（中繼支援推播請參閱[設定](/zh-TW/gateway/configuration)）以及現有的 `push.test` 方法，後者目標是原生行動配對。
</Note>

## 託管嵌入

助理訊息可以使用 `[embed ...]` 短代碼行內轉譯託管網頁內容。iframe sandbox 政策由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    停用託管嵌入內的指令碼執行。
  </Tab>
  <Tab title="scripts（預設）">
    允許互動式嵌入，同時保留來源隔離；這是預設值，且通常足以支援自含式瀏覽器遊戲/小工具。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 之外額外加入 `allow-same-origin`，供刻意需要較高權限的同站文件使用。
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
只有在嵌入文件確實需要同源行為時才使用 `trusted`。對多數代理產生的遊戲與互動畫布而言，`scripts` 是較安全的選擇。
</Warning>

絕對外部 `http(s)` 嵌入 URL 預設仍會被封鎖。如果你刻意想讓 `[embed url="https://..."]` 載入第三方頁面，請設定 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天訊息寬度

群組聊天訊息使用可讀性良好的預設最大寬度。寬螢幕部署可透過設定 `gateway.controlUi.chatMessageMaxWidth` 覆寫它，而不需要修補隨附的 CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

此值在到達瀏覽器之前會先驗證。支援的值包含純長度與百分比，例如 `960px` 或 `82%`，以及受限的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 寬度運算式。

## Tailnet 存取（建議）

<Tabs>
  <Tab title="整合式 Tailscale Serve（偏好）">
    讓 Gateway 保持在 loopback，並讓 Tailscale Serve 以 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    開啟：

    - `https://<magicdns>/`（或你設定的 `gateway.controlUi.basePath`）

    預設情況下，當 `gateway.auth.allowTailscale` 為 `true` 時，Control UI/WebSocket Serve 要求可以透過 Tailscale 身分標頭（`tailscale-user-login`）進行驗證。OpenClaw 會使用 `tailscale whois` 解析 `x-forwarded-for` 位址並將它與標頭比對，以驗證身分，且只有在要求帶有 Tailscale 的 `x-forwarded-*` 標頭並命中 loopback 時才接受。對具備瀏覽器裝置身分的 Control UI 操作者工作階段，這個已驗證的 Serve 路徑也會略過裝置配對往返；沒有裝置的瀏覽器與節點角色連線仍會遵循一般裝置檢查。如果你想即使對 Serve 流量也要求明確的共享祕密憑證，請設定 `gateway.auth.allowTailscale: false`。接著使用 `gateway.auth.mode: "token"` 或 `"password"`。

    對於該非同步 Serve 身分路徑，相同用戶端 IP 與驗證範圍的失敗驗證嘗試，會在速率限制寫入之前序列化。因此，來自同一瀏覽器的並行錯誤重試可能會讓第二個要求顯示 `retry later`，而不是兩個普通不匹配並行競爭。

    <Warning>
    無權杖 Serve 驗證假設 Gateway 主機可信。如果不受信任的本機程式碼可能在該主機上執行，請要求權杖/密碼驗證。
    </Warning>

  </Tab>
  <Tab title="繫結到 tailnet + 權杖">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    然後開啟：

    - `http://<tailscale-ip>:18789/`（或你設定的 `gateway.controlUi.basePath`）

    將相符的共用祕密貼到 UI 設定中（以 `connect.params.auth.token` 或 `connect.params.auth.password` 傳送）。

  </Tab>
</Tabs>

## 不安全的 HTTP

如果你透過純 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）開啟儀表板，瀏覽器會在**非安全情境**中執行並封鎖 WebCrypto。預設情況下，OpenClaw 會**封鎖**沒有裝置身分的 Control UI 連線。

已記錄的例外：

- 使用 `gateway.controlUi.allowInsecureAuth=true` 的僅限 localhost 不安全 HTTP 相容性
- 透過 `gateway.auth.mode: "trusted-proxy"` 成功完成的操作員 Control UI 驗證
- 緊急破例 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**建議修正：**使用 HTTPS（Tailscale Serve），或在本機開啟 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在 Gateway 主機上）

<AccordionGroup>
  <Accordion title="不安全驗證開關行為">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` 只是本機相容性開關：

    - 它允許 localhost Control UI 工作階段在非安全 HTTP 情境中，沒有裝置身分也能繼續。
    - 它不會繞過配對檢查。
    - 它不會放寬遠端（非 localhost）裝置身分要求。

  </Accordion>
  <Accordion title="僅限緊急破例">
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
    `dangerouslyDisableDeviceAuth` 會停用 Control UI 裝置身分檢查，這是嚴重的安全性降級。緊急使用後請盡快還原。
    </Warning>

  </Accordion>
  <Accordion title="受信任代理注意事項">
    - 成功的受信任代理驗證可以允許**操作員** Control UI 工作階段不需要裝置身分。
    - 這**不會**延伸到節點角色的 Control UI 工作階段。
    - 同主機 loopback 反向代理仍然不符合受信任代理驗證；請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

請參閱 [Tailscale](/zh-TW/gateway/tailscale) 以取得 HTTPS 設定指引。

## 內容安全政策

Control UI 隨附嚴格的 `img-src` 政策：只允許**同來源**資產、`data:` URL，以及本機產生的 `blob:` URL。遠端 `http(s)` 和協定相對圖片 URL 會被瀏覽器拒絕，且不會發出網路擷取。

這在實務上的意思是：

- 以相對路徑提供的頭像和圖片（例如 `/avatars/<id>`）仍會算繪，包括 UI 擷取並轉換成本機 `blob:` URL 的已驗證頭像路由。
- 內嵌 `data:image/...` URL 仍會算繪（對協定內承載很有用）。
- Control UI 建立的本機 `blob:` URL 仍會算繪。
- 通道中繼資料發出的遠端頭像 URL 會在 Control UI 的頭像輔助程式中被移除，並替換為內建標誌/徽章，因此遭入侵或惡意的通道無法強迫操作員瀏覽器擷取任意遠端圖片。

你不需要變更任何設定即可取得此行為，它會永遠啟用且不可設定。

## 頭像路由驗證

設定 Gateway 驗證時，Control UI 頭像端點需要和 API 其餘部分相同的 Gateway token：

- `GET /avatar/<agentId>` 只會向已驗證呼叫者回傳頭像圖片。`GET /avatar/<agentId>?meta=1` 會依相同規則回傳頭像中繼資料。
- 對任一路由的未驗證請求都會被拒絕（與同層的 assistant-media 路由一致）。這可防止頭像路由在原本受到保護的主機上洩漏代理身分。
- Control UI 本身會在擷取頭像時，將 Gateway token 以 bearer 標頭轉送，並使用已驗證的 blob URL，讓圖片仍能在儀表板中算繪。

如果停用 Gateway 驗證（不建議在共用主機上這麼做），頭像路由也會變成未驗證，與 Gateway 其餘部分一致。

## 助理媒體路由驗證

設定 Gateway 驗證時，助理本機媒體預覽會使用兩步驟路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 需要一般 Control UI 操作員驗證。瀏覽器在檢查可用性時，會將 Gateway token 以 bearer 標頭傳送。
- 成功的中繼資料回應會包含短效 `mediaTicket`，範圍限定於該確切來源路徑。
- 瀏覽器算繪的圖片、音訊、影片和文件 URL 會使用 `mediaTicket=<ticket>`，而不是作用中的 Gateway token 或密碼。票證很快就會過期，且無法授權不同來源。

這可讓一般媒體算繪相容於瀏覽器原生媒體元素，同時不會把可重複使用的 Gateway 憑證放在可見的媒體 URL 中。

## 建置 UI

Gateway 會從 `dist/control-ui` 提供靜態檔案。使用以下指令建置：

```bash
pnpm ui:build
```

選用的絕對基底（當你需要固定資產 URL 時）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

本機開發（獨立開發伺服器）：

```bash
pnpm ui:dev
```

接著將 UI 指向你的 Gateway WS URL（例如 `ws://127.0.0.1:18789`）。

## 偵錯/測試：開發伺服器 + 遠端 Gateway

Control UI 是靜態檔案；WebSocket 目標可設定，且可以不同於 HTTP 來源。當你想在本機使用 Vite 開發伺服器，但 Gateway 在其他地方執行時，這很方便。

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

    選用的一次性驗證（如果需要）：

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="注意事項">
    - `gatewayUrl` 會在載入後儲存在 localStorage，並從 URL 移除。
    - 如果你透過 `gatewayUrl` 傳入完整的 `ws://` 或 `wss://` 端點，請對 `gatewayUrl` 值進行 URL 編碼，讓瀏覽器正確解析查詢字串。
    - `token` 應盡可能透過 URL 片段（`#token=...`）傳遞。片段不會傳送到伺服器，可避免請求記錄和 Referer 洩漏。舊版 `?token=` 查詢參數仍會為了相容性匯入一次，但只作為後備，並會在啟動後立即移除。
    - `password` 只會保留在記憶體中。
    - 設定 `gatewayUrl` 時，UI 不會退回使用設定或環境憑證。請明確提供 `token`（或 `password`）。缺少明確憑證會是錯誤。
    - Gateway 位於 TLS 後方時（Tailscale Serve、HTTPS 代理等），請使用 `wss://`。
    - `gatewayUrl` 只會在頂層視窗中被接受（不可嵌入），以防止 clickjacking。
    - 非 loopback Control UI 部署必須明確設定 `gateway.controlUi.allowedOrigins`（完整來源）。這包括遠端開發設定。
    - Gateway 啟動可能會從有效執行階段繫結與連接埠，植入像是 `http://localhost:<port>` 和 `http://127.0.0.1:<port>` 的本機來源，但遠端瀏覽器來源仍需要明確項目。
    - 除了嚴格受控的本機測試，不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允許任何瀏覽器來源，而不是「符合我正在使用的任何主機」。
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
