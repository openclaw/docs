---
read_when:
    - 你想從瀏覽器操作 Gateway
    - 你想要無需 SSH 通道即可存取 Tailnet
sidebarTitle: Control UI
summary: 以瀏覽器為基礎的 Gateway 控制介面（聊天、節點、設定）
title: 控制介面
x-i18n:
    generated_at: "2026-05-04T09:37:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b68b5203b369de6a3354a7e7442ee38ee790875b2d7054b0c8ec997098fd9de
    source_path: web/control-ui.md
    workflow: 16
---

控制介面是一個由 Gateway 提供服務的小型 **Vite + Lit** 單頁應用程式：

- 預設：`http://<host>:18789/`
- 選用前置路徑：設定 `gateway.controlUi.basePath`（例如 `/openclaw`）

它會在同一個連接埠上**直接與 Gateway WebSocket** 通訊。

## 快速開啟（本機）

如果 Gateway 正在同一台電腦上執行，請開啟：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果頁面載入失敗，請先啟動 Gateway：`openclaw gateway`。

驗證會在 WebSocket 握手期間透過以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` 時的 Tailscale Serve 身分標頭
- `gateway.auth.mode: "trusted-proxy"` 時的受信任 Proxy 身分標頭

儀表板設定面板會保留目前瀏覽器分頁工作階段與所選 Gateway URL 的權杖；密碼不會被持久保存。首次連線時，入門設定通常會為共享密鑰驗證產生 Gateway 權杖，但當 `gateway.auth.mode` 為 `"password"` 時，密碼驗證也可使用。

## 裝置配對（首次連線）

當你從新的瀏覽器或裝置連線到控制介面時，Gateway 通常需要**一次性配對核准**。這是一項防止未經授權存取的安全措施。

**你會看到：**「已中斷連線 (1008)：需要配對」

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

如果瀏覽器使用已變更的驗證詳細資料（角色/範圍/公開金鑰）重新嘗試配對，先前待處理的要求會被取代，並建立新的 `requestId`。核准前請重新執行 `openclaw devices list`。

如果瀏覽器已配對，而你將它從讀取存取權變更為寫入/管理員存取權，這會被視為核准升級，而不是靜默重新連線。OpenClaw 會保留舊核准的啟用狀態、阻擋更寬鬆權限的重新連線，並要求你明確核准新的範圍集合。

核准後，裝置會被記住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤銷它，否則不需要重新核准。請參閱[裝置 CLI](/zh-TW/cli/devices) 了解權杖輪替與撤銷。

<Note>
- 直接 local loopback 瀏覽器連線（`127.0.0.1` / `localhost`）會自動核准。
- 當 `gateway.auth.allowTailscale: true`、Tailscale 身分驗證通過，且瀏覽器提供其裝置身分時，Tailscale Serve 可略過控制介面操作者工作階段的配對往返。
- 直接 Tailnet 繫結、LAN 瀏覽器連線，以及沒有裝置身分的瀏覽器設定檔仍需要明確核准。
- 每個瀏覽器設定檔都會產生唯一的裝置 ID，因此切換瀏覽器或清除瀏覽器資料都需要重新配對。

</Note>

## 個人身分（瀏覽器本機）

控制介面支援每個瀏覽器的個人身分（顯示名稱與頭像），可附加到傳出的訊息，以便在共享工作階段中標示歸屬。它存放在瀏覽器儲存空間中，範圍限定於目前的瀏覽器設定檔，不會同步到其他裝置，也不會在伺服器端持久保存；除了你實際傳送的訊息上正常的逐字稿作者中繼資料之外。清除站台資料或切換瀏覽器會將它重設為空白。

相同的瀏覽器本機模式也適用於助理頭像覆寫。上傳的助理頭像只會在本機瀏覽器上覆蓋 Gateway 解析出的身分，且絕不會透過 `config.patch` 往返傳送。共享的 `ui.assistant.avatar` 設定欄位仍可供直接寫入該欄位的非 UI 用戶端使用（例如指令碼化 Gateway 或自訂儀表板）。

## 執行階段設定端點

控制介面會從 `/__openclaw/control-ui-config.json` 擷取其執行階段設定。該端點受到與其餘 HTTP 介面相同的 Gateway 驗證保護：未驗證的瀏覽器無法擷取它，而成功擷取需要已有效的 Gateway 權杖/密碼、Tailscale Serve 身分，或受信任 Proxy 身分。

## 語言支援

控制介面可在首次載入時根據你的瀏覽器語言環境進行本地化。若要稍後覆寫，請開啟**概覽 -> Gateway 存取 -> 語言**。語言環境選擇器位於 Gateway 存取卡片中，而不是外觀底下。

- 支援的語言環境：`en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 非英文翻譯會在瀏覽器中延遲載入。
- 選取的語言環境會儲存在瀏覽器儲存空間中，並在日後造訪時重複使用。
- 缺少的翻譯鍵會回退到英文。

文件翻譯會針對相同的非英文語言環境集合產生，但文件站台內建的 Mintlify 語言選擇器僅限於 Mintlify 接受的語言環境代碼。泰文（`th`）和波斯文（`fa`）文件仍會在發布儲存庫中產生；在 Mintlify 支援這些代碼之前，它們可能不會出現在該選擇器中。

## 外觀主題

外觀面板保留內建的 Claw、Knot 和 Dash 主題，另外還有一個瀏覽器本機的 tweakcn 匯入槽。若要匯入主題，請開啟 [tweakcn 編輯器](https://tweakcn.com/editor/theme)，選擇或建立主題，按一下**分享**，並將複製的主題連結貼到外觀中。匯入器也接受 `https://tweakcn.com/r/themes/<id>` 登錄 URL、像 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 的編輯器 URL、相對 `/themes/<id>` 路徑、原始主題 ID，以及 `amethyst-haze` 等預設主題名稱。

匯入的主題只會儲存在目前的瀏覽器設定檔中。它們不會寫入 Gateway 設定，也不會跨裝置同步。取代匯入的主題會更新那個本機槽；如果匯入的主題已被選取，清除它會將作用中主題切回 Claw。

## 它能做什麼（目前）

<AccordionGroup>
  <Accordion title="聊天與語音交談">
    - 透過 Gateway WS 與模型聊天（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）。
    - 透過瀏覽器即時工作階段進行語音交談。OpenAI 使用直接 WebRTC，Google Live 透過 WebSocket 使用受限的一次性瀏覽器權杖，而僅後端的即時語音 Plugin 會使用 Gateway 轉送傳輸。轉送會將提供者認證保留在 Gateway 上，同時瀏覽器透過 `talk.realtime.relay*` RPC 串流麥克風 PCM，並透過 `chat.send` 將 `openclaw_agent_consult` 工具呼叫傳回較大的已設定 OpenClaw 模型。
    - 在聊天中串流工具呼叫與即時工具輸出卡片（代理事件）。

  </Accordion>
  <Accordion title="頻道、執行個體、工作階段、夢境">
    - 頻道：內建以及隨附/外部 Plugin 頻道狀態、QR 登入，以及每個頻道的設定（`channels.status`, `web.login.*`, `config.patch`）。
    - 執行個體：存在清單 + 重新整理（`system-presence`）。
    - 工作階段：清單 + 每個工作階段的模型/思考/快速/詳細/追蹤/推理覆寫（`sessions.list`, `sessions.patch`）。
    - 夢境：Dreaming 狀態、啟用/停用切換，以及 Dream Diary 讀取器（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、Node、執行核准">
    - Cron 作業：列出/新增/編輯/執行/啟用/停用 + 執行歷史（`cron.*`）。
    - Skills：狀態、啟用/停用、安裝、API 金鑰更新（`skills.*`）。
    - Node：清單 + 功能（`node.list`）。
    - 執行核准：編輯 Gateway 或 Node 允許清單 + `exec host=gateway/node` 的詢問政策（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="設定">
    - 檢視/編輯 `~/.openclaw/openclaw.json`（`config.get`, `config.set`）。
    - 套用 + 以驗證重新啟動（`config.apply`），並喚醒最後一個作用中工作階段。
    - 寫入包含 base-hash 防護，以防止覆寫並行編輯。
    - 寫入（`config.set`/`config.apply`/`config.patch`）會針對已提交設定承載中的參照，預先檢查作用中 SecretRef 解析；未解析的作用中已提交參照會在寫入前被拒絕。
    - 結構描述 + 表單呈現（`config.schema` / `config.schema.lookup`，包括欄位 `title` / `description`、相符的 UI 提示、直接子項摘要、巢狀物件/萬用字元/陣列/組合節點上的文件中繼資料，以及可用時的 Plugin + 頻道結構描述）；只有當快照具有安全的原始往返時，才可使用原始 JSON 編輯器。
    - 如果快照無法安全地往返原始文字，控制介面會強制使用表單模式，並針對該快照停用原始模式。
    - 原始 JSON 編輯器的「重設為已儲存」會保留以原始方式撰寫的形狀（格式、註解、`$include` 版面），而不是重新呈現扁平化快照，因此當快照可以安全往返時，外部編輯會在重設後保留下來。
    - 結構化 SecretRef 物件值會在表單文字輸入中以唯讀方式呈現，以防止意外的物件轉字串損毀。

  </Accordion>
  <Accordion title="偵錯、記錄、更新">
    - 偵錯：狀態/健康狀態/模型快照 + 事件記錄 + 手動 RPC 呼叫（`status`, `health`, `models.list`）。
    - 事件記錄包含控制介面重新整理/RPC 時序，以及當瀏覽器公開這些 PerformanceObserver 項目類型時，長動畫影格或長任務的瀏覽器回應性項目。
    - 記錄：Gateway 檔案記錄的即時尾端追蹤，並提供篩選/匯出（`logs.tail`）。
    - 更新：執行套件/git 更新 + 重新啟動（`update.run`），附重新啟動報告，然後在重新連線後輪詢 `update.status` 以驗證執行中的 Gateway 版本。

  </Accordion>
  <Accordion title="Cron 作業面板備註">
    - 對於隔離作業，傳遞預設為公告摘要。如果你想要僅供內部執行，可以切換為無。
    - 選取公告時會顯示頻道/目標欄位。
    - Webhook 模式使用 `delivery.mode = "webhook"`，並將 `delivery.to` 設為有效的 HTTP(S) Webhook URL。
    - 對於主要工作階段作業，可使用 Webhook 和無傳遞模式。
    - 進階編輯控制項包含執行後刪除、清除代理覆寫、Cron 精確/交錯選項、代理模型/思考覆寫，以及最佳努力傳遞切換。
    - 表單驗證會以欄位層級錯誤內嵌顯示；無效值會停用儲存按鈕，直到修正為止。
    - 設定 `cron.webhookToken` 以傳送專用承載權杖；若省略，Webhook 會在沒有驗證標頭的情況下傳送。
    - 已棄用的回退：儲存的舊版作業若含有 `notify: true`，在遷移前仍可使用 `cron.webhook`。

  </Accordion>
</AccordionGroup>

## 聊天行為

<AccordionGroup>
  <Accordion title="Send and history semantics">
    - `chat.send` 是**非阻塞**的：它會立即以 `{ runId, status: "started" }` 確認，回應則透過 `chat` 事件串流傳送。
    - Chat 上傳接受圖片以及非影片檔案。圖片會保留原生圖片路徑；其他檔案會儲存為受管理媒體，並在歷史記錄中顯示為附件連結。
    - 使用相同的 `idempotencyKey` 重新傳送時，執行中會回傳 `{ status: "in_flight" }`，完成後會回傳 `{ status: "ok" }`。
    - `chat.history` 回應會為了 UI 安全而限制大小。當逐字稿項目過大時，Gateway 可能會截斷過長的文字欄位、省略大量中繼資料區塊，並以預留位置取代過大的訊息（`[chat.history omitted: message too large]`）。
    - 助理產生的圖片會持久化為受管理媒體參照，並透過已驗證的 Gateway 媒體 URL 回傳，因此重新載入不會仰賴原始 base64 圖片酬載持續留在聊天歷史回應中。
    - `chat.history` 也會從可見的助理文字中移除僅供顯示的內嵌指令標籤（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、純文字工具呼叫 XML 酬載（包含 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及被截斷的工具呼叫區塊），以及洩漏的 ASCII／全形模型控制權杖，並省略整個可見文字僅為精確靜默權杖 `NO_REPLY` / `no_reply` 的助理項目。
    - 在作用中的傳送期間以及最後的歷史重新整理期間，如果 `chat.history` 短暫回傳較舊的快照，聊天檢視會讓本機樂觀使用者／助理訊息保持可見；一旦 Gateway 歷史記錄追上，權威逐字稿就會取代這些本機訊息。
    - 即時 `chat` 事件是傳遞狀態，而 `chat.history` 會從持久化的工作階段逐字稿重建。工具最終事件之後，控制 UI 會重新載入歷史記錄，並只合併一小段樂觀尾端；逐字稿邊界記載於 [WebChat](/zh-TW/web/webchat)。
    - `chat.inject` 會將助理備註附加到工作階段逐字稿，並廣播 `chat` 事件以供僅限 UI 的更新使用（沒有代理程式執行，沒有頻道傳遞）。
    - 聊天標頭會在工作階段選擇器前顯示代理程式篩選器，且工作階段選擇器會依所選代理程式限定範圍。切換代理程式時只會顯示與該代理程式綁定的工作階段；若尚無已儲存的儀表板工作階段，則會退回到該代理程式的主要工作階段。
    - 在桌面寬度下，聊天控制項會維持在一列精簡排列，並在向下捲動逐字稿時收合；向上捲動、回到頂端或到達底部時會還原控制項。
    - 連續重複且僅含文字的訊息會呈現為一個帶有計數徽章的氣泡。包含圖片、附件、工具輸出或畫布預覽的訊息不會收合。
    - 聊天標頭的模型與思考選擇器會透過 `sessions.patch` 立即修補作用中的工作階段；它們是持久化的工作階段覆寫，而不是僅限單次回合的傳送選項。
    - 在控制 UI 中輸入 `/new` 會建立並切換到與 New Chat 相同的全新儀表板工作階段。輸入 `/reset` 會保留 Gateway 對目前工作階段的明確就地重設。
    - 聊天模型選擇器會請求 Gateway 的已設定模型檢視。如果存在 `agents.defaults.models`，該允許清單會驅動選擇器。否則，選擇器會顯示明確的 `models.providers.*.models` 項目，以及具備可用驗證的提供者。完整目錄仍可透過偵錯 `models.list` RPC 搭配 `view: "all"` 使用。
    - 當新的 Gateway 工作階段用量報告顯示高上下文壓力時，聊天撰寫區會顯示上下文通知；在建議的 Compaction 等級時，會顯示一個精簡按鈕，用來執行一般的工作階段 Compaction 路徑。過期的權杖快照會被隱藏，直到 Gateway 再次回報新的用量。

  </Accordion>
  <Accordion title="Talk mode (browser realtime)">
    Talk 模式使用已註冊的即時語音提供者。若要設定 OpenAI，請使用 `talk.provider: "openai"` 加上 `talk.providers.openai.apiKey`；或若要設定 Google，請使用 `talk.provider: "google"` 加上 `talk.providers.google.apiKey`；Voice Call 即時提供者設定仍可作為備援重複使用。瀏覽器永遠不會收到標準提供者 API 金鑰。OpenAI 會收到供 WebRTC 使用的短期 Realtime 用戶端密鑰。Google Live 會收到一次性且受限的 Live API 驗證權杖，用於瀏覽器 WebSocket 工作階段，並由 Gateway 將指示與工具宣告鎖定在權杖中。只公開後端即時橋接器的提供者會透過 Gateway 中繼傳輸執行，因此憑證與廠商 socket 會保留在伺服器端，而瀏覽器音訊則透過已驗證的 Gateway RPC 傳輸。Realtime 工作階段提示由 Gateway 組裝；`talk.realtime.session` 不接受呼叫端提供的指示覆寫。

    在 Chat 撰寫器中，Talk 控制項是麥克風聽寫按鈕旁的波浪按鈕。Talk 啟動時，撰寫器狀態列會先顯示 `Connecting Talk...`，音訊連線後顯示 `Talk live`，或在即時工具呼叫正透過 `chat.send` 諮詢已設定的較大型模型時顯示 `Asking OpenClaw...`。

    維護者即時煙霧測試：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 會驗證 OpenAI 瀏覽器 WebRTC SDP 交換、Google Live 受限權杖瀏覽器 WebSocket 設定，以及使用假麥克風媒體的 Gateway 中繼瀏覽器配接器。此命令只會列印提供者狀態，不會記錄密鑰。

  </Accordion>
  <Accordion title="Stop and abort">
    - 按一下 **Stop**（呼叫 `chat.abort`）。
    - 執行作用中時，一般後續訊息會排入佇列。在佇列訊息上按一下 **Steer**，即可將該後續訊息注入正在執行的回合。
    - 輸入 `/stop`（或獨立的中止片語，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以帶外中止。
    - `chat.abort` 支援 `{ sessionKey }`（沒有 `runId`），可中止該工作階段的所有作用中執行。

  </Accordion>
  <Accordion title="Abort partial retention">
    - 當執行被中止時，部分助理文字仍可顯示在 UI 中。
    - 當存在已緩衝輸出時，Gateway 會將已中止的部分助理文字持久化到逐字稿歷史記錄中。
    - 持久化項目包含中止中繼資料，讓逐字稿消費者能分辨中止片段與正常完成輸出。

  </Accordion>
</AccordionGroup>

## PWA 安裝與 Web Push

控制 UI 隨附 `manifest.webmanifest` 和 service worker，因此現代瀏覽器可以將它安裝為獨立 PWA。即使分頁或瀏覽器視窗未開啟，Web Push 也能讓 Gateway 以通知喚醒已安裝的 PWA。

| 介面                                                  | 功能                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest。可存取後，瀏覽器會提供「安裝應用程式」。             |
| `ui/public/sw.js`                                     | 處理 `push` 事件與通知點擊的 service worker。                      |
| `push/vapid-keys.json`（位於 OpenClaw 狀態目錄下）    | 自動產生的 VAPID 金鑰組，用於簽署 Web Push 酬載。                 |
| `push/web-push-subscriptions.json`                    | 持久化的瀏覽器訂閱端點。                                           |

當你想固定金鑰時（適用於多主機部署、密鑰輪替或測試），請透過 Gateway 程序上的環境變數覆寫 VAPID 金鑰組：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（預設為 `mailto:openclaw@localhost`）

控制 UI 使用這些受範圍限制的 Gateway 方法來註冊與測試瀏覽器訂閱：

- `push.web.vapidPublicKey` — 擷取作用中的 VAPID 公開金鑰。
- `push.web.subscribe` — 註冊 `endpoint` 以及 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 移除已註冊的端點。
- `push.web.test` — 將測試通知傳送到呼叫端的訂閱。

<Note>
Web Push 獨立於 iOS APNS 中繼路徑（請參閱 [設定](/zh-TW/gateway/configuration) 了解中繼支援的推播）以及現有的 `push.test` 方法；後者以原生行動裝置配對為目標。
</Note>

## 託管嵌入

助理訊息可以使用 `[embed ...]` shortcode 內嵌呈現託管的網頁內容。iframe sandbox 政策由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    停用託管嵌入內的指令碼執行。
  </Tab>
  <Tab title="scripts (default)">
    允許互動式嵌入，同時保持來源隔離；這是預設值，通常足以用於自包含的瀏覽器遊戲／小工具。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 之外再加入 `allow-same-origin`，供刻意需要更高權限的同站文件使用。
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
只有在嵌入文件確實需要同源行為時才使用 `trusted`。對大多數代理程式產生的遊戲與互動畫布而言，`scripts` 是較安全的選擇。
</Warning>

絕對外部 `http(s)` 嵌入 URL 預設仍會被封鎖。如果你刻意希望 `[embed url="https://..."]` 載入第三方頁面，請設定 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天訊息寬度

群組化聊天訊息使用易讀的預設最大寬度。寬螢幕部署可透過設定 `gateway.controlUi.chatMessageMaxWidth` 覆寫，而不需要修補隨附的 CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

此值會在送達瀏覽器前驗證。支援的值包含純長度與百分比，例如 `960px` 或 `82%`，以及受限制的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 寬度運算式。

## Tailnet 存取（建議）

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    將 Gateway 保持在 loopback，並讓 Tailscale Serve 以 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    開啟：

    - `https://<magicdns>/`（或你設定的 `gateway.controlUi.basePath`）

    預設情況下，當 `gateway.auth.allowTailscale` 為 `true` 時，控制 UI／WebSocket Serve 請求可透過 Tailscale 身分標頭（`tailscale-user-login`）進行驗證。OpenClaw 會使用 `tailscale whois` 解析 `x-forwarded-for` 位址並將其與標頭比對來驗證身分，且只在請求透過 loopback 並帶有 Tailscale 的 `x-forwarded-*` 標頭時接受這些驗證。對於具備瀏覽器裝置身分的控制 UI 操作者工作階段，這個已驗證的 Serve 路徑也會跳過裝置配對往返；沒有裝置的瀏覽器與節點角色連線仍會遵循一般裝置檢查。如果你想即使對 Serve 流量也要求明確的共享密鑰憑證，請設定 `gateway.auth.allowTailscale: false`。然後使用 `gateway.auth.mode: "token"` 或 `"password"`。

    對於該非同步 Serve 身分路徑，相同用戶端 IP 與驗證範圍的失敗驗證嘗試會在速率限制寫入前序列化。因此，來自同一瀏覽器的並行錯誤重試，可能會在第二個請求上顯示 `retry later`，而不是兩個普通不匹配並行競爭。

    <Warning>
    無權杖 Serve 驗證假設 Gateway 主機受信任。如果不受信任的本機程式碼可能在該主機上執行，請要求 token／password 驗證。
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    然後開啟：

    - `http://<tailscale-ip>:18789/`（或你設定的 `gateway.controlUi.basePath`）

    將相符的共用密鑰貼到 UI 設定中（以 `connect.params.auth.token` 或 `connect.params.auth.password` 傳送）。

  </Tab>
</Tabs>

## 不安全的 HTTP

如果你透過純 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）開啟儀表板，瀏覽器會在**非安全內容**中執行並封鎖 WebCrypto。預設情況下，OpenClaw 會**封鎖**沒有裝置身分的 Control UI 連線。

已記錄的例外：

- 使用 `gateway.controlUi.allowInsecureAuth=true` 的僅限 localhost 不安全 HTTP 相容性
- 透過 `gateway.auth.mode: "trusted-proxy"` 成功完成操作員 Control UI 驗證
- 緊急破例 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**建議修正方式：**使用 HTTPS（Tailscale Serve）或在本機開啟 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在 Gateway 主機上）

<AccordionGroup>
  <Accordion title="Insecure-auth toggle behavior">
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

    - 它允許 localhost Control UI 工作階段在非安全 HTTP 內容中，在沒有裝置身分的情況下繼續進行。
    - 它不會略過配對檢查。
    - 它不會放寬遠端（非 localhost）裝置身分需求。

  </Accordion>
  <Accordion title="Break-glass only">
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
    `dangerouslyDisableDeviceAuth` 會停用 Control UI 裝置身分檢查，是嚴重的安全性降級。緊急使用後請盡快還原。
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - 成功的 trusted-proxy 驗證可以允許沒有裝置身分的**操作員** Control UI 工作階段。
    - 這**不**會延伸到 node-role Control UI 工作階段。
    - 同一主機的 loopback 反向代理仍然不符合 trusted-proxy 驗證；請參閱 [Trusted proxy auth](/zh-TW/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

請參閱 [Tailscale](/zh-TW/gateway/tailscale) 以取得 HTTPS 設定指南。

## 內容安全性原則

Control UI 隨附嚴格的 `img-src` 原則：只允許**同源**資產、`data:` URL，以及本機產生的 `blob:` URL。瀏覽器會拒絕遠端 `http(s)` 與協定相對圖片 URL，且不會發出網路擷取。

實務上的含義：

- 以相對路徑提供的頭像與圖片（例如 `/avatars/<id>`）仍會顯示，包括 UI 擷取並轉換成本機 `blob:` URL 的已驗證頭像路由。
- 行內 `data:image/...` URL 仍會顯示（對協定內承載很有用）。
- Control UI 建立的本機 `blob:` URL 仍會顯示。
- 通道中繼資料發出的遠端頭像 URL 會由 Control UI 的頭像輔助程式移除，並改用內建標誌/徽章，因此受入侵或惡意通道無法強迫操作員瀏覽器擷取任意遠端圖片。

你不需要變更任何內容即可取得此行為，此行為一律啟用且不可設定。

## 頭像路由驗證

設定 Gateway 驗證時，Control UI 頭像端點需要與 API 其餘部分相同的 Gateway token：

- `GET /avatar/<agentId>` 只會向已驗證呼叫者傳回頭像圖片。`GET /avatar/<agentId>?meta=1` 會在相同規則下傳回頭像中繼資料。
- 對任一路由的未驗證請求都會被拒絕（與同層的 assistant-media 路由一致）。這可防止頭像路由在其他方面已受保護的主機上洩漏代理身分。
- Control UI 本身會在擷取頭像時將 Gateway token 作為 bearer 標頭轉送，並使用已驗證的 blob URL，讓圖片仍能在儀表板中顯示。

如果你停用 Gateway 驗證（不建議在共用主機上這麼做），頭像路由也會變成未驗證，與 Gateway 其餘部分一致。

## Assistant media 路由驗證

設定 Gateway 驗證時，assistant 本機媒體預覽會使用兩步驟路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 需要一般的 Control UI 操作員驗證。瀏覽器在檢查可用性時會將 Gateway token 作為 bearer 標頭傳送。
- 成功的中繼資料回應會包含一個短效 `mediaTicket`，其範圍限定為該確切來源路徑。
- 瀏覽器轉譯的圖片、音訊、影片與文件 URL 會使用 `mediaTicket=<ticket>`，而不是作用中的 Gateway token 或密碼。該 ticket 很快就會過期，且無法授權不同來源。

這能讓一般媒體轉譯與瀏覽器原生媒體元素相容，同時不會把可重複使用的 Gateway 認證放在可見的媒體 URL 中。

## 建置 UI

Gateway 從 `dist/control-ui` 提供靜態檔案。使用以下命令建置：

```bash
pnpm ui:build
```

選用的絕對基底（當你想要固定資產 URL 時）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

用於本機開發（獨立開發伺服器）：

```bash
pnpm ui:dev
```

然後將 UI 指向你的 Gateway WS URL（例如 `ws://127.0.0.1:18789`）。

## 偵錯/測試：開發伺服器 + 遠端 Gateway

Control UI 是靜態檔案；WebSocket 目標可設定，且可以不同於 HTTP 來源。當你想在本機使用 Vite 開發伺服器，但 Gateway 在其他地方執行時，這很方便。

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
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
  <Accordion title="Notes">
    - `gatewayUrl` 會在載入後儲存在 localStorage 中，並從 URL 移除。
    - 如果你透過 `gatewayUrl` 傳遞完整的 `ws://` 或 `wss://` 端點，請對 `gatewayUrl` 值進行 URL 編碼，讓瀏覽器正確解析查詢字串。
    - 應盡可能透過 URL 片段（`#token=...`）傳遞 `token`。片段不會傳送到伺服器，可避免請求記錄與 Referer 洩漏。舊版 `?token=` 查詢參數仍會為相容性匯入一次，但只作為備援，且會在啟動後立即移除。
    - `password` 只會保留在記憶體中。
    - 設定 `gatewayUrl` 時，UI 不會退回使用設定或環境認證。請明確提供 `token`（或 `password`）。缺少明確認證會造成錯誤。
    - 當 Gateway 位於 TLS 後方（Tailscale Serve、HTTPS 代理等）時，請使用 `wss://`。
    - `gatewayUrl` 只會在最上層視窗中被接受（不可嵌入），以防止點擊劫持。
    - 非 loopback 的 Control UI 部署必須明確設定 `gateway.controlUi.allowedOrigins`（完整來源）。這包括遠端開發設定。
    - Gateway 啟動時可能會從有效的執行階段 bind 與 port 播種本機來源，例如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>`，但遠端瀏覽器來源仍需要明確項目。
    - 除非是嚴格受控的本機測試，否則不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允許任何瀏覽器來源，而不是「符合我正在使用的任何主機」。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 會啟用 Host-header 來源備援模式，但這是危險的安全模式。

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

遠端存取設定詳細資訊：[Remote access](/zh-TW/gateway/remote)。

## 相關

- [Dashboard](/zh-TW/web/dashboard) — Gateway 儀表板
- [Health Checks](/zh-TW/gateway/health) — Gateway 健康監控
- [TUI](/zh-TW/web/tui) — 終端機使用者介面
- [WebChat](/zh-TW/web/webchat) — 瀏覽器式聊天介面
