---
read_when:
    - 您想從瀏覽器操作 Gateway
    - 你想要不透過 SSH 隧道存取 Tailnet
sidebarTitle: Control UI
summary: Gateway 的瀏覽器式控制介面（聊天、節點、設定）
title: 控制介面
x-i18n:
    generated_at: "2026-05-06T03:00:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8421a302ce5585594cf50c16dc0993a2f4d6614de034cf46a9d2e35d39076ee4
    source_path: web/control-ui.md
    workflow: 16
---

控制 UI 是由 Gateway 提供服務的小型 **Vite + Lit** 單頁應用程式：

- 預設：`http://<host>:18789/`
- 可選前綴：設定 `gateway.controlUi.basePath`（例如 `/openclaw`）

它會在同一個連接埠上**直接與 Gateway WebSocket** 通訊。

## 快速開啟（本機）

如果 Gateway 正在同一台電腦上執行，請開啟：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果頁面載入失敗，請先啟動 Gateway：`openclaw gateway`。

驗證會在 WebSocket 握手期間透過以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 當 `gateway.auth.allowTailscale: true` 時的 Tailscale Serve 身分標頭
- 當 `gateway.auth.mode: "trusted-proxy"` 時的受信任 Proxy 身分標頭

儀表板設定面板會為目前的瀏覽器分頁工作階段和所選的 gateway URL 保留一個 Token；密碼不會持久保存。Onboarding 通常會在第一次連線時為共享祕密驗證產生 gateway Token，但當 `gateway.auth.mode` 為 `"password"` 時，密碼驗證也可以使用。

## 裝置配對（第一次連線）

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

如果瀏覽器以變更後的驗證詳細資料（角色/範圍/公開金鑰）重試配對，先前待處理的要求會被取代，並建立新的 `requestId`。核准前請重新執行 `openclaw devices list`。

如果瀏覽器已經配對，而你將它從讀取存取權變更為寫入/管理員存取權，這會被視為核准升級，而不是靜默重新連線。OpenClaw 會讓舊核准保持作用中、封鎖範圍更廣的重新連線，並要求你明確核准新的範圍集合。

核准後，裝置會被記住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤銷它，否則不需要重新核准。請參閱[裝置 CLI](/zh-TW/cli/devices) 了解 Token 輪換和撤銷。

<Note>
- 直接的 local loopback 瀏覽器連線（`127.0.0.1` / `localhost`）會自動核准。
- 當 `gateway.auth.allowTailscale: true`、Tailscale 身分驗證通過，且瀏覽器提供其裝置身分時，Tailscale Serve 可略過控制 UI 操作者工作階段的配對往返。
- 直接 Tailnet 綁定、LAN 瀏覽器連線，以及沒有裝置身分的瀏覽器設定檔，仍需要明確核准。
- 每個瀏覽器設定檔都會產生唯一的裝置 ID，因此切換瀏覽器或清除瀏覽器資料會需要重新配對。

</Note>

## 個人身分（瀏覽器本機）

控制 UI 支援每個瀏覽器的個人身分（顯示名稱與頭像），可附加到傳出訊息，以便在共享工作階段中標示歸屬。它存在於瀏覽器儲存空間中，範圍限定於目前的瀏覽器設定檔，不會同步到其他裝置，也不會在伺服器端持久保存，但你實際傳送的訊息仍會保留一般的逐字稿作者中繼資料。清除網站資料或切換瀏覽器會將其重設為空白。

同樣的瀏覽器本機模式也適用於助理頭像覆寫。上傳的助理頭像只會在本機瀏覽器中覆蓋 gateway 解析出的身分，且絕不會透過 `config.patch` 往返傳送。共享的 `ui.assistant.avatar` 設定欄位仍可供直接寫入該欄位的非 UI 用戶端使用（例如指令碼化 gateway 或自訂儀表板）。

## 執行階段設定端點

控制 UI 會從 `/__openclaw/control-ui-config.json` 擷取其執行階段設定。該端點受到與其餘 HTTP 介面相同的 gateway 驗證保護：未驗證的瀏覽器無法擷取它，而成功擷取需要已有效的 gateway Token/密碼、Tailscale Serve 身分，或受信任 Proxy 身分其中之一。

## 語言支援

控制 UI 可在第一次載入時根據你的瀏覽器語言環境進行本地化。若要稍後覆寫，請開啟**總覽 -> Gateway 存取 -> 語言**。語言環境選擇器位於 Gateway 存取卡片中，而不是在外觀下。

- 支援的語言環境：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`ar`、`it`、`tr`、`uk`、`id`、`pl`、`th`、`vi`、`nl`、`fa`
- 非英文翻譯會在瀏覽器中延遲載入。
- 選取的語言環境會儲存在瀏覽器儲存空間中，並在未來造訪時重複使用。
- 缺少的翻譯鍵會退回英文。

文件翻譯會為同一組非英文語言環境產生，但文件網站內建的 Mintlify 語言選擇器僅限於 Mintlify 接受的語言環境代碼。泰文（`th`）和波斯文（`fa`）文件仍會在發布儲存庫中產生；在 Mintlify 支援這些代碼之前，它們可能不會出現在該選擇器中。

## 外觀主題

外觀面板保留內建的 Claw、Knot 和 Dash 主題，外加一個瀏覽器本機 tweakcn 匯入槽。若要匯入主題，請開啟 [tweakcn 編輯器](https://tweakcn.com/editor/theme)，選擇或建立主題，按一下**分享**，並將複製的主題連結貼到外觀中。匯入器也接受 `https://tweakcn.com/r/themes/<id>` 登錄 URL、像 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 這類編輯器 URL、相對 `/themes/<id>` 路徑、原始主題 ID，以及 `amethyst-haze` 等預設主題名稱。

匯入的主題只會儲存在目前的瀏覽器設定檔中。它們不會寫入 gateway 設定，也不會跨裝置同步。取代匯入的主題會更新唯一的本機槽；如果匯入的主題已被選取，清除它會將作用中的主題切回 Claw。

## 它可以做什麼（目前）

<AccordionGroup>
  <Accordion title="聊天與語音交談">
    - 透過 Gateway WS 與模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 透過瀏覽器即時工作階段語音交談。OpenAI 使用直接 WebRTC，Google Live 透過 WebSocket 使用受限的一次性瀏覽器 Token，而僅後端即時語音 plugins 使用 Gateway 中繼傳輸。用戶端擁有的供應商工作階段以 `talk.client.create` 開始；Gateway 中繼工作階段以 `talk.session.create` 開始。中繼會將供應商憑證保留在 Gateway 上，同時瀏覽器透過 `talk.session.appendAudio` 串流麥克風 PCM，並透過 `talk.client.toolCall` 轉送 `openclaw_agent_consult` 供應商工具呼叫，以套用 Gateway 政策和較大的已設定 OpenClaw 模型。
    - 在聊天中串流工具呼叫與即時工具輸出卡片（Agent 事件）。

  </Accordion>
  <Accordion title="頻道、執行個體、工作階段、夢境">
    - 頻道：內建加上隨附/外部 Plugin 頻道狀態、QR 登入，以及每頻道設定（`channels.status`、`web.login.*`、`config.patch`）。
    - 執行個體：存在清單 + 重新整理（`system-presence`）。
    - 工作階段：清單 + 每工作階段模型/thinking/fast/verbose/trace/reasoning 覆寫（`sessions.list`、`sessions.patch`）。
    - 夢境：dreaming 狀態、啟用/停用切換，以及 Dream Diary 讀取器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="Cron、skills、節點、exec 核准">
    - Cron 工作：列出/新增/編輯/執行/啟用/停用 + 執行歷史記錄（`cron.*`）。
    - Skills：狀態、啟用/停用、安裝、API 金鑰更新（`skills.*`）。
    - 節點：清單 + 能力（`node.list`）。
    - Exec 核准：編輯 gateway 或節點允許清單 + `exec host=gateway/node` 的詢問政策（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="設定">
    - 檢視/編輯 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - 套用 + 透過驗證重新啟動（`config.apply`），並喚醒最後一個作用中的工作階段。
    - 寫入包含 base-hash 保護，以防止覆寫並行編輯。
    - 寫入（`config.set`/`config.apply`/`config.patch`）會對提交的設定承載中 refs 的作用中 SecretRef 解析進行預檢；未解析的作用中已提交 refs 會在寫入前被拒絕。
    - Schema + 表單呈現（`config.schema` / `config.schema.lookup`，包括欄位 `title` / `description`、相符的 UI 提示、直接子項摘要、巢狀物件/萬用字元/陣列/組合節點上的文件中繼資料，以及可用時的 Plugin + 頻道 schema）；Raw JSON 編輯器僅在快照具備安全 raw 往返時可用。
    - 如果快照無法安全地往返 raw 文字，控制 UI 會強制使用表單模式，並對該快照停用 Raw 模式。
    - Raw JSON 編輯器的「重設為已儲存」會保留 raw 編寫的形狀（格式、註解、`$include` 版面），而不是重新呈現扁平化快照，因此當快照可以安全往返時，外部編輯會在重設後保留下來。
    - 結構化 SecretRef 物件值會在表單文字輸入中以唯讀方式呈現，以防止意外的物件轉字串損壞。

  </Accordion>
  <Accordion title="偵錯、記錄、更新">
    - 偵錯：狀態/健康狀態/模型快照 + 事件記錄 + 手動 RPC 呼叫（`status`、`health`、`models.list`）。
    - 事件記錄包括控制 UI 重新整理/RPC 計時，以及當瀏覽器公開這些 PerformanceObserver 項目類型時的長動畫影格或長任務瀏覽器回應能力項目。
    - 記錄：即時追蹤 gateway 檔案記錄，並提供篩選/匯出（`logs.tail`）。
    - 更新：執行套件/git 更新 + 重新啟動（`update.run`）並提供重新啟動報告，然後在重新連線後輪詢 `update.status`，以驗證執行中的 gateway 版本。

  </Accordion>
  <Accordion title="Cron 工作面板注意事項">
    - 對於隔離工作，傳遞預設為宣告摘要。如果你想要僅內部執行，可以切換為無。
    - 選取宣告時會顯示頻道/目標欄位。
    - Webhook 模式使用 `delivery.mode = "webhook"`，並將 `delivery.to` 設定為有效的 HTTP(S) webhook URL。
    - 對於主工作階段工作，webhook 和無傳遞模式可用。
    - 進階編輯控制項包括執行後刪除、清除 Agent 覆寫、cron 精確/錯開選項、Agent 模型/thinking 覆寫，以及最佳努力傳遞切換。
    - 表單驗證會以欄位層級錯誤內嵌顯示；無效值會停用儲存按鈕，直到修正為止。
    - 設定 `cron.webhookToken` 以傳送專用 bearer Token；如果省略，webhook 會在沒有驗證標頭的情況下傳送。
    - 已淘汰的退回機制：儲存的舊版工作若包含 `notify: true`，在遷移前仍可使用 `cron.webhook`。

  </Accordion>
</AccordionGroup>

## 聊天行為

<AccordionGroup>
  <Accordion title="傳送與歷史記錄語意">
    - `chat.send` 是**非阻塞**的：它會立即以 `{ runId, status: "started" }` 確認，回應則透過 `chat` 事件串流傳送。
    - 聊天上傳接受圖片以及非影片檔案。圖片會保留原生圖片路徑；其他檔案會儲存為受管理媒體，並在歷史記錄中顯示為附件連結。
    - 使用相同 `idempotencyKey` 重新傳送時，執行期間會傳回 `{ status: "in_flight" }`，完成後會傳回 `{ status: "ok" }`。
    - `chat.history` 回應會受大小限制，以確保 UI 安全。當逐字稿項目太大時，Gateway 可能會截斷長文字欄位、省略大型中繼資料區塊，並將過大的訊息替換為預留位置（`[chat.history omitted: message too large]`）。
    - Assistant/產生的圖片會以受管理媒體參照形式持久化，並透過已驗證的 Gateway 媒體 URL 回傳，因此重新載入時不依賴原始 base64 圖片酬載仍留在聊天歷史記錄回應中。
    - 呈現 `chat.history` 時，Control UI 會從可見的 assistant 文字中移除僅供顯示的行內指令標籤（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、純文字工具呼叫 XML 酬載（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及被截斷的工具呼叫區塊）、洩漏的 ASCII/全形模型控制權杖，並省略整段可見文字只有精確靜默權杖 `NO_REPLY` / `no_reply` 或 Heartbeat 確認權杖 `HEARTBEAT_OK` 的 assistant 項目。
    - 在作用中的傳送以及最終歷史記錄重新整理期間，如果 `chat.history` 短暫傳回較舊的快照，聊天檢視會保留本機樂觀使用者/assistant 訊息可見；一旦 Gateway 歷史記錄追上，標準逐字稿會取代這些本機訊息。
    - 即時 `chat` 事件是傳遞狀態，而 `chat.history` 則從持久工作階段逐字稿重建。工具最終事件之後，Control UI 會重新載入歷史記錄，且只合併一小段樂觀尾端；逐字稿邊界記錄於 [WebChat](/zh-TW/web/webchat)。
    - `chat.inject` 會將一則 assistant 備註附加到工作階段逐字稿，並廣播一個 `chat` 事件以供僅 UI 更新使用（沒有 agent 執行，也沒有頻道傳遞）。
    - 聊天標頭會在工作階段選擇器之前顯示 agent 篩選器，而工作階段選擇器會依所選 agent 限定範圍。切換 agent 時，只會顯示繫結到該 agent 的工作階段；若該 agent 尚未儲存任何 dashboard 工作階段，則會回退到該 agent 的主要工作階段。
    - 在桌面寬度下，聊天控制項會維持在一個精簡列上，並在向下捲動逐字稿時收合；向上捲動、回到頂端或到達底部時會還原控制項。
    - 連續重複的純文字訊息會呈現為一個帶有數量徽章的氣泡。帶有圖片、附件、工具輸出或 canvas 預覽的訊息不會收合。
    - 聊天標頭的模型與思考選擇器會透過 `sessions.patch` 立即修補作用中的工作階段；它們是持久的工作階段覆寫，不是僅限單回合的傳送選項。
    - 在 Control UI 輸入 `/new` 會建立並切換到與 New Chat 相同的全新 dashboard 工作階段。輸入 `/reset` 會保留 Gateway 對目前工作階段的明確就地重設。
    - 聊天模型選擇器會請求 Gateway 已設定的模型檢視。如果存在 `agents.defaults.models`，該允許清單會驅動選擇器。否則，選擇器會顯示明確的 `models.providers.*.models` 項目，以及具有可用驗證的 provider。完整 catalog 仍可透過偵錯 `models.list` RPC 搭配 `view: "all"` 取得。
    - 當新的 Gateway 工作階段使用量報告顯示高度情境壓力時，聊天撰寫區會顯示情境通知；在建議的 Compaction 等級下，會顯示一個精簡按鈕，用於執行正常工作階段 Compaction 路徑。過期的 token 快照會隱藏，直到 Gateway 再次回報新的使用量。

  </Accordion>
  <Accordion title="交談模式（瀏覽器即時）">
    交談模式使用已註冊的即時語音 provider。使用 `talk.realtime.provider: "openai"` 加上 `talk.realtime.providers.openai.apiKey` 設定 OpenAI，或使用 `talk.realtime.provider: "google"` 加上 `talk.realtime.providers.google.apiKey` 設定 Google。瀏覽器永遠不會收到標準 provider API key。OpenAI 會收到用於 WebRTC 的暫時 Realtime 用戶端祕密。Google Live 會收到一次性、受限制的 Live API 驗證 token，用於瀏覽器 WebSocket 工作階段，且指令與工具宣告會由 Gateway 鎖定在 token 中。僅公開後端即時橋接的 provider 會透過 Gateway relay transport 執行，因此憑證與 vendor socket 會保留在伺服器端，而瀏覽器音訊會透過已驗證的 Gateway RPC 傳送。Realtime 工作階段提示由 Gateway 組合；`talk.client.create` 不接受呼叫者提供的指令覆寫。

    在聊天撰寫器中，交談控制項是麥克風聽寫按鈕旁的波形按鈕。交談開始時，撰寫器狀態列會顯示 `Connecting Talk...`，音訊連線後顯示 `Talk live`，或在即時工具呼叫透過 `talk.client.toolCall` 諮詢已設定的較大型模型時顯示 `Asking OpenClaw...`。

    維護者即時煙霧測試：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 會驗證 OpenAI 瀏覽器 WebRTC SDP 交換、Google Live 受限制 token 的瀏覽器 WebSocket 設定，以及搭配假麥克風媒體的 Gateway relay 瀏覽器配接器。該命令只會列印 provider 狀態，不會記錄祕密。

  </Accordion>
  <Accordion title="停止與中止">
    - 按一下 **Stop**（呼叫 `chat.abort`）。
    - 執行作用中時，一般後續訊息會排入佇列。按一下佇列中訊息上的 **Steer**，可將該後續訊息注入正在執行的回合。
    - 輸入 `/stop`（或獨立的中止片語，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以帶外中止。
    - `chat.abort` 支援 `{ sessionKey }`（沒有 `runId`）以中止該工作階段的所有作用中執行。

  </Accordion>
  <Accordion title="中止部分保留">
    - 當執行被中止時，部分 assistant 文字仍可顯示在 UI 中。
    - 當存在已緩衝輸出時，Gateway 會將已中止的部分 assistant 文字持久化到逐字稿歷史記錄中。
    - 持久化項目包含中止中繼資料，因此逐字稿消費者可以區分中止片段與正常完成輸出。

  </Accordion>
</AccordionGroup>

## PWA 安裝與 Web Push

Control UI 隨附 `manifest.webmanifest` 和 service worker，因此現代瀏覽器可以將其安裝為獨立 PWA。Web Push 可讓 Gateway 以通知喚醒已安裝的 PWA，即使分頁或瀏覽器視窗未開啟也一樣。

| 介面                                                  | 作用                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest。瀏覽器在可存取後會提供「安裝應用程式」。             |
| `ui/public/sw.js`                                     | 處理 `push` 事件和通知點擊的 service worker。                      |
| `push/vapid-keys.json`（位於 OpenClaw 狀態目錄下）    | 自動產生的 VAPID 金鑰組，用於簽署 Web Push 酬載。                  |
| `push/web-push-subscriptions.json`                    | 持久化的瀏覽器訂閱端點。                                           |

當你想固定金鑰（用於多主機部署、祕密輪替或測試）時，請透過 Gateway 行程上的環境變數覆寫 VAPID 金鑰組：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（預設為 `mailto:openclaw@localhost`）

Control UI 使用這些受 scope 限制的 Gateway 方法來註冊與測試瀏覽器訂閱：

- `push.web.vapidPublicKey` — 擷取作用中的 VAPID 公開金鑰。
- `push.web.subscribe` — 註冊一個 `endpoint` 以及 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 移除已註冊的端點。
- `push.web.test` — 傳送測試通知到呼叫者的訂閱。

<Note>
Web Push 獨立於 iOS APNS relay 路徑（請參閱 [Configuration](/zh-TW/gateway/configuration) 了解 relay 支援的 push）以及既有的 `push.test` 方法；後者的目標是原生行動裝置配對。
</Note>

## 託管嵌入

Assistant 訊息可使用 `[embed ...]` shortcode 行內呈現託管網頁內容。iframe sandbox policy 由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    停用託管嵌入中的 script 執行。
  </Tab>
  <Tab title="scripts (default)">
    允許互動式嵌入，同時保留 origin 隔離；這是預設值，通常足以支援自含式瀏覽器遊戲/widget。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 之上加入 `allow-same-origin`，用於有意需要更強權限的同站文件。
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
只有在嵌入文件確實需要 same-origin 行為時才使用 `trusted`。對大多數 agent 產生的遊戲和互動式 canvas 而言，`scripts` 是較安全的選擇。
</Warning>

絕對外部 `http(s)` 嵌入 URL 預設仍會被封鎖。如果你刻意想讓 `[embed url="https://..."]` 載入第三方頁面，請設定 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天訊息寬度

群組化聊天訊息使用易讀的預設 max-width。寬螢幕部署可透過設定 `gateway.controlUi.chatMessageMaxWidth` 覆寫它，而不需修補 bundled CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

該值在送達瀏覽器前會先經過驗證。支援的值包括純長度與百分比，例如 `960px` 或 `82%`，以及受限制的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 寬度運算式。

## Tailnet 存取（建議）

<Tabs>
  <Tab title="整合式 Tailscale Serve（偏好）">
    將 Gateway 保持在 loopback，並讓 Tailscale Serve 以 HTTPS proxy 它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    開啟：

    - `https://<magicdns>/`（或你設定的 `gateway.controlUi.basePath`）

    預設情況下，當 `gateway.auth.allowTailscale` 為 `true` 時，Control UI/WebSocket Serve 請求可透過 Tailscale 身分標頭（`tailscale-user-login`）進行驗證。OpenClaw 會透過 `tailscale whois` 解析 `x-forwarded-for` 位址並將其與標頭比對，以驗證身分，且只有當請求透過帶有 Tailscale `x-forwarded-*` 標頭的 loopback 抵達時才會接受。對於具有瀏覽器裝置身分的 Control UI operator 工作階段，這條已驗證的 Serve 路徑也會略過裝置配對往返；沒有裝置的瀏覽器和 node-role 連線仍會遵循一般裝置檢查。如果你想即使對 Serve 流量也要求明確的 shared-secret 憑證，請設定 `gateway.auth.allowTailscale: false`。然後使用 `gateway.auth.mode: "token"` 或 `"password"`。

    對於該非同步 Serve 身分路徑，來自相同用戶端 IP 和驗證 scope 的失敗驗證嘗試，會在 rate-limit 寫入前被序列化。因此，同一瀏覽器的並行錯誤重試可能會在第二個請求上顯示 `retry later`，而不是兩個單純不符並行競爭。

    <Warning>
    無 token 的 Serve 驗證假設 gateway 主機是可信任的。如果不受信任的本機程式碼可能在該主機上執行，請要求 token/password 驗證。
    </Warning>

  </Tab>
  <Tab title="繫結到 tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    然後開啟：

    - `http://<tailscale-ip>:18789/`（或你設定的 `gateway.controlUi.basePath`）

    將相符的共用密鑰貼到 UI 設定中（以 `connect.params.auth.token` 或 `connect.params.auth.password` 傳送）。

  </Tab>
</Tabs>

## 不安全的 HTTP

如果你透過純 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）開啟儀表板，瀏覽器會在**非安全內容**中執行並封鎖 WebCrypto。預設情況下，OpenClaw 會**封鎖**沒有裝置身分的控制 UI 連線。

已記錄的例外：

- 僅限 localhost 的不安全 HTTP 相容性，使用 `gateway.controlUi.allowInsecureAuth=true`
- 透過 `gateway.auth.mode: "trusted-proxy"` 成功完成的操作員控制 UI 驗證
- 緊急例外 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

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

    - 它允許 localhost 控制 UI 工作階段在非安全 HTTP 內容中不使用裝置身分也能繼續。
    - 它不會略過配對檢查。
    - 它不會放寬遠端（非 localhost）裝置身分需求。

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
    `dangerouslyDisableDeviceAuth` 會停用控制 UI 裝置身分檢查，這是嚴重的安全性降級。緊急使用後請盡快還原。
    </Warning>

  </Accordion>
  <Accordion title="受信任代理注意事項">
    - 成功的受信任代理驗證可以允許沒有裝置身分的**操作員**控制 UI 工作階段進入。
    - 這**不會**延伸到節點角色控制 UI 工作階段。
    - 同主機 loopback 反向代理仍不符合受信任代理驗證；請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

請參閱 [Tailscale](/zh-TW/gateway/tailscale) 取得 HTTPS 設定指引。

## 內容安全政策

控制 UI 隨附嚴格的 `img-src` 政策：只允許**同源**資產、`data:` URL，以及本機產生的 `blob:` URL。遠端 `http(s)` 和協定相對圖片 URL 會被瀏覽器拒絕，而且不會發出網路擷取。

實務上的意義如下：

- 在相對路徑下提供的頭像和圖片（例如 `/avatars/<id>`）仍會呈現，包括 UI 擷取並轉換成本機 `blob:` URL 的已驗證頭像路由。
- 內嵌 `data:image/...` URL 仍會呈現（對協定內酬載很有用）。
- 由控制 UI 建立的本機 `blob:` URL 仍會呈現。
- 由通道中繼資料發出的遠端頭像 URL 會在控制 UI 的頭像輔助工具中被移除，並替換為內建標誌/徽章，因此遭入侵或惡意的通道無法強迫操作員瀏覽器擷取任意遠端圖片。

你不需要變更任何設定即可取得此行為——它一律啟用且不可設定。

## 頭像路由驗證

設定 gateway 驗證後，控制 UI 頭像端點需要與 API 其餘部分相同的 gateway 權杖：

- `GET /avatar/<agentId>` 只會向已驗證呼叫者傳回頭像圖片。`GET /avatar/<agentId>?meta=1` 會在相同規則下傳回頭像中繼資料。
- 對任一路由的未驗證要求都會遭到拒絕（與相鄰的助理媒體路由一致）。這可防止頭像路由在其他部分受保護的主機上洩漏代理身分。
- 控制 UI 本身在擷取頭像時會將 gateway 權杖作為 bearer 標頭轉送，並使用已驗證的 blob URL，因此圖片仍會在儀表板中呈現。

如果你停用 gateway 驗證（不建議在共用主機上這麼做），頭像路由也會變成未驗證，與 gateway 的其餘部分一致。

## 助理媒體路由驗證

設定 gateway 驗證後，助理本機媒體預覽會使用兩步驟路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 需要一般的控制 UI 操作員驗證。瀏覽器在檢查可用性時，會將 gateway 權杖作為 bearer 標頭傳送。
- 成功的中繼資料回應包含短效的 `mediaTicket`，範圍限定於該確切來源路徑。
- 瀏覽器呈現的圖片、音訊、影片和文件 URL 會使用 `mediaTicket=<ticket>`，而不是作用中的 gateway 權杖或密碼。票證會快速過期，且無法授權不同來源。

這讓一般媒體呈現能與瀏覽器原生媒體元素相容，同時不會把可重複使用的 gateway 認證放入可見的媒體 URL。

## 建置 UI

Gateway 會從 `dist/control-ui` 提供靜態檔案。使用以下命令建置：

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

然後將 UI 指向你的 Gateway WS URL（例如 `ws://127.0.0.1:18789`）。

## 偵錯/測試：開發伺服器 + 遠端 Gateway

控制 UI 是靜態檔案；WebSocket 目標可設定，且可不同於 HTTP 來源。當你想在本機使用 Vite 開發伺服器，但 Gateway 在其他地方執行時，這很方便。

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
    - 如果你透過 `gatewayUrl` 傳入完整的 `ws://` 或 `wss://` 端點，請對 `gatewayUrl` 值進行 URL 編碼，讓瀏覽器正確剖析查詢字串。
    - 盡可能透過 URL 片段（`#token=...`）傳遞 `token`。片段不會傳送到伺服器，可避免要求記錄和 Referer 洩漏。舊版 `?token=` 查詢參數仍會為了相容性匯入一次，但僅作為後備，且會在啟動後立即移除。
    - `password` 只保留在記憶體中。
    - 設定 `gatewayUrl` 時，UI 不會後備使用設定或環境認證。請明確提供 `token`（或 `password`）。缺少明確認證是錯誤。
    - 當 Gateway 位於 TLS 後方時（Tailscale Serve、HTTPS 代理等），請使用 `wss://`。
    - `gatewayUrl` 只接受在最上層視窗中使用（不可嵌入），以防止點擊劫持。
    - 非 loopback 控制 UI 部署必須明確設定 `gateway.controlUi.allowedOrigins`（完整來源）。這包括遠端開發設定。
    - Gateway 啟動時可能會從有效的執行階段繫結和連接埠植入本機來源，例如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>`，但遠端瀏覽器來源仍需要明確項目。
    - 除了嚴格受控的本機測試外，請勿使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允許任何瀏覽器來源，而不是「符合我正在使用的任何主機」。
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

- [儀表板](/zh-TW/web/dashboard) — gateway 儀表板
- [健康檢查](/zh-TW/gateway/health) — gateway 健康監控
- [TUI](/zh-TW/web/tui) — 終端機使用者介面
- [WebChat](/zh-TW/web/webchat) — 瀏覽器型聊天介面
