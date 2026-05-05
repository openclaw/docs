---
read_when:
    - 你想從瀏覽器操作 Gateway
    - 你想要不透過 SSH 隧道存取 Tailnet
sidebarTitle: Control UI
summary: 基於瀏覽器的 Gateway 控制介面（聊天、節點、設定）
title: 控制介面
x-i18n:
    generated_at: "2026-05-05T06:19:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: d249559d26ef8d257a14b104a797442e9fbb67a8ab31c7fcc9eaa4127f29c933
    source_path: web/control-ui.md
    workflow: 16
---

控制 UI 是由 Gateway 提供服務的小型 **Vite + Lit** 單頁應用程式：

- 預設：`http://<host>:18789/`
- 選用前綴：設定 `gateway.controlUi.basePath`（例如 `/openclaw`）

它會在同一個連接埠上**直接與 Gateway WebSocket** 通訊。

## 快速開啟（本機）

如果 Gateway 在同一台電腦上執行，請開啟：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果頁面無法載入，請先啟動 Gateway：`openclaw gateway`。

驗證會在 WebSocket 握手期間透過以下項目提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` 時的 Tailscale Serve 身分標頭
- `gateway.auth.mode: "trusted-proxy"` 時的受信任 Proxy 身分標頭

儀表板設定面板會為目前的瀏覽器分頁工作階段和所選的 gateway URL 保留權杖；密碼不會持久儲存。Onboarding 通常會在首次連線時，為共享密鑰驗證產生 gateway 權杖，但當 `gateway.auth.mode` 為 `"password"` 時，也可以使用密碼驗證。

## 裝置配對（首次連線）

當你從新的瀏覽器或裝置連線到控制 UI 時，Gateway 通常會要求**一次性配對核准**。這是一項防止未經授權存取的安全措施。

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

如果瀏覽器使用變更後的驗證詳細資料（角色/範圍/公開金鑰）重試配對，先前的待處理請求會被取代，並建立新的 `requestId`。核准前請重新執行 `openclaw devices list`。

如果瀏覽器已配對，而你將它從讀取存取權變更為寫入/管理員存取權，這會被視為核准升級，而不是靜默重新連線。OpenClaw 會保留舊核准有效、封鎖較廣泛的重新連線，並要求你明確核准新的範圍集合。

核准後，裝置會被記住，除非你用 `openclaw devices revoke --device <id> --role <role>` 撤銷它，否則不需要再次核准。請參閱 [裝置 CLI](/zh-TW/cli/devices) 了解權杖輪替與撤銷。

<Note>
- 直接 local loopback 瀏覽器連線（`127.0.0.1` / `localhost`）會自動核准。
- 當 `gateway.auth.allowTailscale: true`、Tailscale 身分驗證通過，且瀏覽器提供其裝置身分時，Tailscale Serve 可以略過控制 UI 操作者工作階段的配對往返。
- 直接 Tailnet 繫結、LAN 瀏覽器連線，以及沒有裝置身分的瀏覽器設定檔仍需要明確核准。
- 每個瀏覽器設定檔都會產生唯一的裝置 ID，因此切換瀏覽器或清除瀏覽器資料都需要重新配對。

</Note>

## 個人身分（瀏覽器本機）

控制 UI 支援依瀏覽器設定的個人身分（顯示名稱與頭像），會附加到傳出的訊息，以便在共享工作階段中標示來源。它存在瀏覽器儲存空間中，範圍限於目前的瀏覽器設定檔，不會同步到其他裝置，也不會在伺服器端持久儲存，除了你實際傳送訊息時一般逐字稿作者中繼資料之外。清除網站資料或切換瀏覽器會將它重設為空白。

相同的瀏覽器本機模式也適用於助理頭像覆寫。上傳的助理頭像只會在本機瀏覽器中覆蓋 gateway 解析出的身分，絕不會透過 `config.patch` 往返傳送。共享的 `ui.assistant.avatar` 設定欄位仍可供非 UI 用戶端直接寫入該欄位使用（例如腳本化 gateways 或自訂儀表板）。

## 執行階段設定端點

控制 UI 會從 `/__openclaw/control-ui-config.json` 擷取其執行階段設定。該端點與 HTTP 介面的其餘部分受相同的 gateway 驗證保護：未驗證的瀏覽器無法擷取它，成功擷取需要已有效的 gateway 權杖/密碼、Tailscale Serve 身分，或受信任 Proxy 身分。

## 語言支援

控制 UI 可以在首次載入時依據你的瀏覽器語言環境進行本地化。若要稍後覆寫，請開啟 **總覽 -> Gateway 存取 -> 語言**。語言環境選擇器位於 Gateway 存取卡片中，不在外觀底下。

- 支援的語言環境：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`ar`、`it`、`tr`、`uk`、`id`、`pl`、`th`、`vi`、`nl`、`fa`
- 非英文翻譯會在瀏覽器中延遲載入。
- 所選語言環境會儲存在瀏覽器儲存空間中，並在未來造訪時重複使用。
- 缺少的翻譯鍵會回退到英文。

文件翻譯會針對相同的非英文語言環境集合產生，但文件網站內建的 Mintlify 語言選擇器僅限於 Mintlify 接受的語言環境代碼。泰文（`th`）和波斯文（`fa`）文件仍會在發佈 repo 中產生；在 Mintlify 支援這些代碼之前，它們可能不會出現在該選擇器中。

## 外觀主題

外觀面板保留內建的 Claw、Knot 和 Dash 主題，另有一個瀏覽器本機 tweakcn 匯入槽。若要匯入主題，請開啟 [tweakcn 編輯器](https://tweakcn.com/editor/theme)、選擇或建立主題、點擊 **分享**，然後將複製的主題連結貼到外觀中。匯入工具也接受 `https://tweakcn.com/r/themes/<id>` 登錄 URL、像 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 這樣的編輯器 URL、相對 `/themes/<id>` 路徑、原始主題 ID，以及像 `amethyst-haze` 這樣的預設主題名稱。

匯入的主題只會儲存在目前的瀏覽器設定檔中。它們不會寫入 gateway 設定，也不會跨裝置同步。替換匯入的主題會更新那個本機槽；若匯入的主題已被選取，清除它會將使用中的主題切回 Claw。

## 它目前能做什麼

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - 透過 Gateway WS 與模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 透過瀏覽器即時工作階段進行語音對話。OpenAI 使用直接 WebRTC，Google Live 透過 WebSocket 使用受限制的一次性瀏覽器權杖，而僅後端即時語音 plugins 使用 Gateway relay 傳輸。Relay 會將 provider 認證保留在 Gateway 上，同時瀏覽器透過 `talk.realtime.relay*` RPC 串流麥克風 PCM，並透過 `chat.send` 將 `openclaw_agent_consult` 工具呼叫送回給較大型的已設定 OpenClaw 模型。
    - 在聊天中串流工具呼叫與即時工具輸出卡片（agent 事件）。

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - 頻道：內建加上隨附/外部 plugin 頻道狀態、QR 登入，以及依頻道設定（`channels.status`、`web.login.*`、`config.patch`）。
    - 實例：Presence 清單與重新整理（`system-presence`）。
    - 工作階段：清單與依工作階段的模型/thinking/fast/verbose/trace/reasoning 覆寫（`sessions.list`、`sessions.patch`）。
    - 夢境：Dreaming 狀態、啟用/停用切換，以及 Dream Diary 閱讀器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Cron 作業：列出/新增/編輯/執行/啟用/停用，以及執行歷程（`cron.*`）。
    - Skills：狀態、啟用/停用、安裝、API key 更新（`skills.*`）。
    - 節點：清單與能力（`node.list`）。
    - Exec 核准：編輯 gateway 或節點允許清單，以及 `exec host=gateway/node` 的詢問政策（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="Config">
    - 檢視/編輯 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - 套用並重新啟動，同時進行驗證（`config.apply`），並喚醒最後一個作用中的工作階段。
    - 寫入包含 base-hash 防護，以避免覆蓋並行編輯。
    - 寫入（`config.set`/`config.apply`/`config.patch`）會預檢提交設定 payload 中 refs 的作用中 SecretRef 解析；無法解析的作用中已提交 refs 會在寫入前被拒絕。
    - Schema 與表單渲染（`config.schema` / `config.schema.lookup`，包含欄位 `title` / `description`、相符的 UI 提示、直接子項摘要、巢狀物件/萬用字元/陣列/組合節點上的文件中繼資料，以及可用時的 plugin 與頻道 schemas）；只有當快照具備安全原始往返時，才可使用 Raw JSON 編輯器。
    - 如果快照無法安全地往返原始文字，控制 UI 會強制使用表單模式，並停用該快照的原始模式。
    - Raw JSON 編輯器的「重設為已儲存」會保留原始撰寫的形狀（格式、註解、`$include` 佈局），而不是重新渲染扁平化快照，因此當快照可以安全往返時，外部編輯在重設後仍會保留。
    - 結構化 SecretRef 物件值會在表單文字輸入中以唯讀方式渲染，以防止意外的物件轉字串損毀。

  </Accordion>
  <Accordion title="Debug, logs, update">
    - 偵錯：狀態/健康情況/模型快照、事件記錄，以及手動 RPC 呼叫（`status`、`health`、`models.list`）。
    - 事件記錄包含控制 UI 重新整理/RPC 計時，以及當瀏覽器公開相關 PerformanceObserver 項目類型時，長動畫影格或長任務的瀏覽器回應性項目。
    - 記錄：即時追蹤 gateway 檔案記錄，並支援篩選/匯出（`logs.tail`）。
    - 更新：執行套件/git 更新並重新啟動（`update.run`），包含重新啟動報告，然後在重新連線後輪詢 `update.status`，以驗證正在執行的 gateway 版本。

  </Accordion>
  <Accordion title="Cron jobs panel notes">
    - 對於隔離作業，傳遞預設會公告摘要。如果你想要僅限內部的執行，可以切換為無。
    - 選取公告時，會出現頻道/目標欄位。
    - Webhook 模式使用 `delivery.mode = "webhook"`，並將 `delivery.to` 設為有效的 HTTP(S) webhook URL。
    - 對於主要工作階段作業，可使用 webhook 和無傳遞模式。
    - 進階編輯控制項包含執行後刪除、清除 agent 覆寫、cron 精確/錯開選項、agent 模型/thinking 覆寫，以及盡力傳遞切換。
    - 表單驗證會在欄位層級錯誤中內嵌顯示；無效值會停用儲存按鈕，直到修正為止。
    - 設定 `cron.webhookToken` 可傳送專用 bearer token；若省略，webhook 會在沒有驗證標頭的情況下傳送。
    - 已棄用的 fallback：已儲存且含 `notify: true` 的舊版作業，在遷移前仍可使用 `cron.webhook`。

  </Accordion>
</AccordionGroup>

## 聊天行為

<AccordionGroup>
  <Accordion title="傳送與歷史語意">
    - `chat.send` 是**非阻塞**的：它會立即以 `{ runId, status: "started" }` 確認，回應則透過 `chat` 事件串流傳送。
    - 聊天上傳接受圖片與非影片檔案。圖片會保留原生圖片路徑；其他檔案會儲存為受管理媒體，並在歷史紀錄中顯示為附件連結。
    - 使用相同的 `idempotencyKey` 重新傳送時，執行中會回傳 `{ status: "in_flight" }`，完成後會回傳 `{ status: "ok" }`。
    - `chat.history` 回應會限制大小以確保 UI 安全。當逐字稿項目過大時，Gateway 可能會截斷長文字欄位、略過大型中繼資料區塊，並以預留位置取代過大的訊息（`[chat.history omitted: message too large]`）。
    - 助理／產生的圖片會持久化為受管理媒體參照，並透過已驗證的 Gateway 媒體 URL 回傳，因此重新載入不依賴原始 base64 圖片承載資料持續留在聊天歷史回應中。
    - 呈現 `chat.history` 時，Control UI 會從可見的助理文字中移除僅供顯示的行內指示標籤（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、純文字工具呼叫 XML 承載資料（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及被截斷的工具呼叫區塊）、外洩的 ASCII／全形模型控制權杖，並略過整段可見文字只有精確靜默權杖 `NO_REPLY` / `no_reply` 或 Heartbeat 確認權杖 `HEARTBEAT_OK` 的助理項目。
    - 在作用中的傳送期間與最終歷史重新整理時，如果 `chat.history` 短暫回傳較舊的快照，聊天檢視會保留本機樂觀使用者／助理訊息可見；一旦 Gateway 歷史追上，標準逐字稿就會取代那些本機訊息。
    - 即時 `chat` 事件是遞送狀態，而 `chat.history` 是從持久化工作階段逐字稿重建。工具最終事件後，Control UI 會重新載入歷史並只合併一小段樂觀尾端；逐字稿邊界記錄在 [WebChat](/zh-TW/web/webchat) 中。
    - `chat.inject` 會將助理備註附加到工作階段逐字稿，並廣播 `chat` 事件以供僅限 UI 的更新使用（沒有代理執行，沒有通道遞送）。
    - 聊天標頭會在工作階段選擇器之前顯示代理篩選器，且工作階段選擇器會依所選代理界定範圍。切換代理時只會顯示繫結到該代理的工作階段；若該代理尚未儲存任何儀表板工作階段，則會回退到該代理的主要工作階段。
    - 在桌面寬度下，聊天控制項會維持在單一精簡列中，並在向下捲動逐字稿時收合；向上捲動、回到頂端或到達底部時會還原控制項。
    - 連續重複的純文字訊息會呈現為一個泡泡，並帶有計數徽章。包含圖片、附件、工具輸出或畫布預覽的訊息不會收合。
    - 聊天標頭中的模型與思考選擇器會立即透過 `sessions.patch` 修補作用中的工作階段；它們是持久的工作階段覆寫，不是僅限單回合的傳送選項。
    - 在 Control UI 中輸入 `/new`，會建立並切換到與「新聊天」相同的全新儀表板工作階段。輸入 `/reset` 則會保留 Gateway 對目前工作階段的明確就地重設。
    - 聊天模型選擇器會要求 Gateway 的已設定模型檢視。如果存在 `agents.defaults.models`，該允許清單會驅動選擇器。否則，選擇器會顯示明確的 `models.providers.*.models` 項目，以及具備可用驗證的提供者。完整目錄仍可透過偵錯用 `models.list` RPC 搭配 `view: "all"` 取得。
    - 當新的 Gateway 工作階段使用量報告顯示高脈絡壓力時，聊天撰寫區域會顯示脈絡通知；在建議的 Compaction 層級，會顯示一個精簡按鈕，用來執行一般的工作階段 Compaction 路徑。過時的權杖快照會被隱藏，直到 Gateway 再次回報新的使用量。

  </Accordion>
  <Accordion title="Talk 模式（瀏覽器即時）">
    Talk 模式使用已註冊的即時語音提供者。使用 `talk.provider: "openai"` 加上 `talk.providers.openai.apiKey` 設定 OpenAI，或使用 `talk.provider: "google"` 加上 `talk.providers.google.apiKey` 設定 Google；Voice Call 即時提供者設定仍可作為後援重複使用。瀏覽器永遠不會收到標準提供者 API 金鑰。OpenAI 會收到用於 WebRTC 的短暫 Realtime 用戶端密鑰。Google Live 會收到用於瀏覽器 WebSocket 工作階段的一次性受限 Live API 驗證權杖，且指示與工具宣告會由 Gateway 鎖定在權杖中。只公開後端即時橋接的提供者會透過 Gateway 中繼傳輸執行，因此憑證與廠商 socket 會保留在伺服器端，而瀏覽器音訊則透過已驗證的 Gateway RPC 移動。Realtime 工作階段提示由 Gateway 組裝；`talk.realtime.session` 不接受呼叫端提供的指示覆寫。

    在聊天撰寫器中，Talk 控制項是麥克風聽寫按鈕旁的波形按鈕。Talk 啟動時，撰寫器狀態列會先顯示 `Connecting Talk...`，接著在音訊連線時顯示 `Talk live`，或在即時工具呼叫透過 `chat.send` 諮詢已設定的較大模型時顯示 `Asking OpenClaw...`。

    維護者即時煙霧測試：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 會驗證 OpenAI 瀏覽器 WebRTC SDP 交換、Google Live 受限權杖瀏覽器 WebSocket 設定，以及使用假麥克風媒體的 Gateway 中繼瀏覽器配接器。此命令只會列印提供者狀態，不會記錄密鑰。

  </Accordion>
  <Accordion title="停止與中止">
    - 按一下**停止**（呼叫 `chat.abort`）。
    - 執行作用中時，一般後續訊息會排入佇列。按一下佇列訊息上的**引導**，即可將該後續訊息注入正在執行的回合。
    - 輸入 `/stop`（或獨立的中止片語，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以帶外中止。
    - `chat.abort` 支援 `{ sessionKey }`（沒有 `runId`），可中止該工作階段的所有作用中執行。

  </Accordion>
  <Accordion title="中止部分保留">
    - 執行遭中止時，部分助理文字仍可顯示在 UI 中。
    - 當存在已緩衝輸出時，Gateway 會將已中止的部分助理文字持久化到逐字稿歷史中。
    - 持久化項目包含中止中繼資料，因此逐字稿消費者可分辨中止部分與正常完成輸出。

  </Accordion>
</AccordionGroup>

## PWA 安裝與網頁推播

Control UI 隨附 `manifest.webmanifest` 和 service worker，因此現代瀏覽器可以將它安裝為獨立 PWA。Web Push 讓 Gateway 即使在分頁或瀏覽器視窗未開啟時，也能以通知喚醒已安裝的 PWA。

| 介面                                                  | 功能                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest。瀏覽器可存取後會提供「安裝應用程式」。               |
| `ui/public/sw.js`                                     | 處理 `push` 事件與通知點擊的 service worker。                      |
| `push/vapid-keys.json`（位於 OpenClaw 狀態目錄下）    | 自動產生的 VAPID 金鑰組，用於簽署 Web Push 承載資料。              |
| `push/web-push-subscriptions.json`                    | 持久化的瀏覽器訂閱端點。                                           |

當你想固定金鑰時（用於多主機部署、密鑰輪替或測試），可透過 Gateway 處理程序上的環境變數覆寫 VAPID 金鑰組：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（預設為 `mailto:openclaw@localhost`）

Control UI 使用這些受範圍限制的 Gateway 方法來註冊和測試瀏覽器訂閱：

- `push.web.vapidPublicKey` — 擷取作用中的 VAPID 公開金鑰。
- `push.web.subscribe` — 註冊 `endpoint` 加上 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 移除已註冊的端點。
- `push.web.test` — 傳送測試通知到呼叫端的訂閱。

<Note>
Web Push 獨立於 iOS APNS 中繼路徑（中繼支援的推播請參閱[設定](/zh-TW/gateway/configuration)）以及既有的 `push.test` 方法，後者以原生行動配對為目標。
</Note>

## 託管嵌入

助理訊息可以使用 `[embed ...]` 短碼行內呈現託管網頁內容。iframe sandbox 政策由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    停用託管嵌入中的指令碼執行。
  </Tab>
  <Tab title="scripts（預設）">
    允許互動式嵌入，同時保留來源隔離；這是預設值，通常足以用於自包含的瀏覽器遊戲／小工具。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 之上加入 `allow-same-origin`，用於刻意需要更高權限的同站文件。
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
只有在嵌入文件確實需要同源行為時，才使用 `trusted`。對於大多數代理產生的遊戲與互動畫布，`scripts` 是較安全的選擇。
</Warning>

絕對外部 `http(s)` 嵌入 URL 預設仍會被封鎖。如果你刻意要讓 `[embed url="https://..."]` 載入第三方頁面，請設定 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天訊息寬度

群組聊天訊息使用易讀的預設最大寬度。寬螢幕部署可以透過設定 `gateway.controlUi.chatMessageMaxWidth` 覆寫，而不必修補隨附的 CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

此值在到達瀏覽器前會先經過驗證。支援的值包括純長度與百分比，例如 `960px` 或 `82%`，以及受約束的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 寬度運算式。

## Tailnet 存取（建議）

<Tabs>
  <Tab title="整合式 Tailscale Serve（偏好）">
    將 Gateway 保留在 loopback，並讓 Tailscale Serve 透過 HTTPS 代理：

    ```bash
    openclaw gateway --tailscale serve
    ```

    開啟：

    - `https://<magicdns>/`（或你設定的 `gateway.controlUi.basePath`）

    預設情況下，當 `gateway.auth.allowTailscale` 為 `true` 時，Control UI/WebSocket Serve 請求可以透過 Tailscale 身分標頭（`tailscale-user-login`）驗證。OpenClaw 會使用 `tailscale whois` 解析 `x-forwarded-for` 位址並將其與標頭比對，以驗證身分；且只會在請求命中 loopback 並帶有 Tailscale 的 `x-forwarded-*` 標頭時接受這些資訊。對於具備瀏覽器裝置身分的 Control UI 操作者工作階段，此已驗證的 Serve 路徑也會略過裝置配對往返；沒有裝置的瀏覽器與節點角色連線仍會遵循一般裝置檢查。如果你想即使對 Serve 流量也要求明確的共享密鑰憑證，請設定 `gateway.auth.allowTailscale: false`。接著使用 `gateway.auth.mode: "token"` 或 `"password"`。

    對於該非同步 Serve 身分路徑，同一用戶端 IP 與驗證範圍的失敗驗證嘗試會在寫入速率限制前序列化。因此，來自同一瀏覽器的並行錯誤重試，可能會在第二個請求上顯示 `retry later`，而不是兩個單純不符並行競速。

    <Warning>
    無權杖 Serve 驗證假設 Gateway 主機是受信任的。如果不受信任的本機程式碼可能在該主機上執行，請要求權杖／密碼驗證。
    </Warning>

  </Tab>
  <Tab title="繫結到 tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    接著開啟：

    - `http://<tailscale-ip>:18789/`（或你設定的 `gateway.controlUi.basePath`）

    將相符的共用密鑰貼到 UI 設定中（以 `connect.params.auth.token` 或 `connect.params.auth.password` 傳送）。

  </Tab>
</Tabs>

## 不安全的 HTTP

如果你透過純 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）開啟儀表板，瀏覽器會在**非安全情境**中執行並阻擋 WebCrypto。預設情況下，OpenClaw 會在沒有裝置身分的情況下**封鎖** Control UI 連線。

已記錄的例外：

- 使用 `gateway.controlUi.allowInsecureAuth=true` 的僅限 localhost 不安全 HTTP 相容性
- 透過 `gateway.auth.mode: "trusted-proxy"` 成功完成操作員 Control UI 驗證
- 緊急破例 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**建議修正方式：**使用 HTTPS（Tailscale Serve）或在本機開啟 UI：

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

    - 它允許 localhost Control UI 工作階段在非安全 HTTP 情境中不使用裝置身分也能繼續。
    - 它不會略過配對檢查。
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
    - 成功的受信任代理驗證可以在沒有裝置身分的情況下允許**操作員** Control UI 工作階段。
    - 這**不會**延伸到節點角色的 Control UI 工作階段。
    - 同主機 loopback 反向代理仍不符合受信任代理驗證；請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

請參閱 [Tailscale](/zh-TW/gateway/tailscale) 取得 HTTPS 設定指南。

## 內容安全政策

Control UI 隨附嚴格的 `img-src` 政策：只允許**同源**資產、`data:` URL，以及本機產生的 `blob:` URL。遠端 `http(s)` 和協定相對圖片 URL 會遭瀏覽器拒絕，且不會發出網路擷取。

實務上的意義：

- 在相對路徑下提供的頭像和圖片（例如 `/avatars/<id>`）仍會呈現，包括 UI 擷取並轉換成本機 `blob:` URL 的已驗證頭像路由。
- 內嵌 `data:image/...` URL 仍會呈現（適合用於協定內酬載）。
- Control UI 建立的本機 `blob:` URL 仍會呈現。
- 通道中繼資料發出的遠端頭像 URL 會由 Control UI 的頭像輔助程式移除，並以內建標誌/徽章取代，因此遭入侵或惡意的通道無法強迫操作員瀏覽器擷取任意遠端圖片。

你不需要變更任何內容即可取得此行為 — 它一律啟用且不可設定。

## 頭像路由驗證

設定 Gateway 驗證時，Control UI 頭像端點需要與 API 其餘部分相同的 Gateway 權杖：

- `GET /avatar/<agentId>` 只會向已驗證呼叫者傳回頭像圖片。`GET /avatar/<agentId>?meta=1` 會依相同規則傳回頭像中繼資料。
- 對任一路由的未驗證要求都會遭拒（與相鄰的 assistant-media 路由一致）。這可防止頭像路由在原本受保護的主機上洩漏 agent 身分。
- Control UI 本身會在擷取頭像時，以 bearer 標頭轉送 Gateway 權杖，並使用已驗證的 blob URL，讓圖片仍可在儀表板中呈現。

如果你停用 Gateway 驗證（不建議在共用主機上這樣做），頭像路由也會變成未驗證，與 Gateway 其餘部分一致。

## 助理媒體路由驗證

設定 Gateway 驗證時，助理本機媒體預覽會使用兩步驟路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 需要一般的 Control UI 操作員驗證。瀏覽器會在檢查可用性時，以 bearer 標頭傳送 Gateway 權杖。
- 成功的中繼資料回應會包含短效的 `mediaTicket`，其範圍限定於該確切來源路徑。
- 瀏覽器呈現的圖片、音訊、影片和文件 URL 會使用 `mediaTicket=<ticket>`，而不是作用中的 Gateway 權杖或密碼。票證會很快過期，且無法授權不同來源。

這可讓一般媒體呈現與瀏覽器原生媒體元素相容，同時不把可重複使用的 Gateway 憑證放在可見的媒體 URL 中。

## 建置 UI

Gateway 會從 `dist/control-ui` 提供靜態檔案。使用以下命令建置：

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

然後將 UI 指向你的 Gateway WS URL（例如 `ws://127.0.0.1:18789`）。

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

    選用的一次性驗證（如有需要）：

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="注意事項">
    - 載入後，`gatewayUrl` 會儲存在 localStorage 中並從 URL 移除。
    - 如果你透過 `gatewayUrl` 傳入完整的 `ws://` 或 `wss://` 端點，請對 `gatewayUrl` 值進行 URL 編碼，讓瀏覽器正確解析查詢字串。
    - 只要可行，`token` 應透過 URL 片段（`#token=...`）傳遞。片段不會傳送到伺服器，可避免要求記錄和 Referer 洩漏。舊版 `?token=` 查詢參數仍會為了相容性匯入一次，但只作為備援，且會在 bootstrap 後立即移除。
    - `password` 只會保留在記憶體中。
    - 設定 `gatewayUrl` 時，UI 不會退回使用設定或環境憑證。請明確提供 `token`（或 `password`）。缺少明確憑證會產生錯誤。
    - Gateway 位於 TLS 後方時（Tailscale Serve、HTTPS 代理等），請使用 `wss://`。
    - `gatewayUrl` 只會在頂層視窗（非嵌入）中被接受，以防止 clickjacking。
    - 非 loopback Control UI 部署必須明確設定 `gateway.controlUi.allowedOrigins`（完整來源）。這包含遠端開發設定。
    - Gateway 啟動時可能會根據有效的執行階段 bind 和 port，植入 `http://localhost:<port>` 和 `http://127.0.0.1:<port>` 等本機來源，但遠端瀏覽器來源仍需要明確項目。
    - 除非是嚴格受控的本機測試，否則不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允許任何瀏覽器來源，而不是「符合我正在使用的任何主機」。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 會啟用 Host 標頭來源備援模式，但這是危險的安全模式。

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
