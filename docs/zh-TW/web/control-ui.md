---
read_when:
    - 您想要從瀏覽器操作 Gateway
    - 你想要無需 SSH 通道即可存取 Tailnet
sidebarTitle: Control UI
summary: Gateway 的瀏覽器式控制介面（聊天、節點、設定）
title: 控制使用者介面
x-i18n:
    generated_at: "2026-05-04T02:47:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: c890d83da2c296b600e4b5a00a538f37e6bd54da31fbe62113ecd6177b15626e
    source_path: web/control-ui.md
    workflow: 16
---

Control UI 是由 Gateway 提供服務的小型 **Vite + Lit** 單頁應用程式：

- 預設：`http://<host>:18789/`
- 選用前置路徑：設定 `gateway.controlUi.basePath`（例如 `/openclaw`）

它會在同一個連接埠上**直接與 Gateway WebSocket** 通訊。

## 快速開啟（本機）

如果 Gateway 正在同一台電腦上執行，請開啟：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果頁面載入失敗，請先啟動 Gateway：`openclaw gateway`。

驗證會在 WebSocket 交握期間透過下列方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 當 `gateway.auth.allowTailscale: true` 時使用 Tailscale Serve 身分標頭
- 當 `gateway.auth.mode: "trusted-proxy"` 時使用信任 Proxy 身分標頭

儀表板設定面板會為目前的瀏覽器分頁工作階段和所選 Gateway URL 保留 Token；密碼不會被持久化。首次連線時，導覽流程通常會為共用密鑰驗證產生 Gateway Token，但當 `gateway.auth.mode` 為 `"password"` 時，也可以使用密碼驗證。

## 裝置配對（首次連線）

當你從新的瀏覽器或裝置連線到 Control UI 時，Gateway 通常會要求**一次性配對核准**。這是防止未授權存取的安全措施。

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

如果瀏覽器以變更後的驗證詳細資料（角色/範圍/公開金鑰）重試配對，前一個待處理請求會被取代，並建立新的 `requestId`。核准前請重新執行 `openclaw devices list`。

如果瀏覽器已經配對，而你將它從讀取存取權變更為寫入/管理員存取權，這會被視為核准升級，而不是靜默重新連線。OpenClaw 會保留舊核准有效、阻擋更廣泛的重新連線，並要求你明確核准新的範圍集合。

核准後，裝置會被記住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤銷它，否則不需要重新核准。請參閱[裝置 CLI](/zh-TW/cli/devices) 了解 Token 輪替與撤銷。

<Note>
- 直接的 local loopback 瀏覽器連線（`127.0.0.1` / `localhost`）會自動核准。
- 當 `gateway.auth.allowTailscale: true`、Tailscale 身分驗證通過，且瀏覽器出示其裝置身分時，Tailscale Serve 可以略過 Control UI 操作者工作階段的配對往返流程。
- 直接 Tailnet 綁定、LAN 瀏覽器連線，以及沒有裝置身分的瀏覽器設定檔仍需要明確核准。
- 每個瀏覽器設定檔都會產生唯一的裝置 ID，因此切換瀏覽器或清除瀏覽器資料會需要重新配對。

</Note>

## 個人身分（瀏覽器本機）

Control UI 支援每個瀏覽器各自的個人身分（顯示名稱與頭像），會附加到傳出的訊息，以便在共用工作階段中標示歸屬。它存在於瀏覽器儲存空間中，作用範圍限於目前的瀏覽器設定檔，不會同步到其他裝置，也不會在伺服器端持久化，除了你實際送出的訊息上一般的逐字稿作者中繼資料。清除網站資料或切換瀏覽器會將它重設為空白。

同樣的瀏覽器本機模式也適用於助理頭像覆寫。上傳的助理頭像只會在本機瀏覽器中覆蓋 Gateway 解析出的身分，且絕不會透過 `config.patch` 往返傳送。共用的 `ui.assistant.avatar` 設定欄位仍可供非 UI 用戶端直接寫入該欄位（例如指令碼化 Gateway 或自訂儀表板）。

## 執行階段設定端點

Control UI 會從 `/__openclaw/control-ui-config.json` 擷取其執行階段設定。該端點受到與其餘 HTTP 介面相同的 Gateway 驗證保護：未驗證的瀏覽器無法擷取它，成功擷取需要已有效的 Gateway Token/密碼、Tailscale Serve 身分，或信任 Proxy 身分。

## 語言支援

Control UI 可以在首次載入時根據你的瀏覽器語言環境自動本地化。若要稍後覆寫它，請開啟 **Overview -> Gateway Access -> Language**。語言環境選擇器位於 Gateway Access 卡片中，而不是 Appearance 底下。

- 支援的語言環境：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`ar`、`it`、`tr`、`uk`、`id`、`pl`、`th`、`vi`、`nl`、`fa`
- 非英文翻譯會在瀏覽器中延遲載入。
- 所選語言環境會儲存在瀏覽器儲存空間中，並在未來造訪時重複使用。
- 缺少的翻譯鍵會退回英文。

文件翻譯會為同一組非英文語言環境產生，但文件網站內建的 Mintlify 語言選擇器受限於 Mintlify 接受的語言環境代碼。泰文（`th`）和波斯文（`fa`）文件仍會在發布 Repo 中產生；在 Mintlify 支援這些代碼之前，它們可能不會出現在該選擇器中。

## 外觀主題

Appearance 面板保留內建的 Claw、Knot 和 Dash 主題，外加一個瀏覽器本機的 tweakcn 匯入槽。若要匯入主題，請開啟 [tweakcn 主題](https://tweakcn.com/themes)、選擇或建立主題、按一下 **Share**，然後將複製的主題連結貼到 Appearance 中。匯入器也接受 `https://tweakcn.com/r/themes/<id>` Registry URL、像 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 這類編輯器 URL、相對 `/themes/<id>` 路徑、原始主題 ID，以及像 `amethyst-haze` 這類預設主題名稱。

匯入的主題只會儲存在目前瀏覽器設定檔中。它們不會寫入 Gateway 設定，也不會跨裝置同步。取代匯入的主題會更新唯一的本機槽；如果已選取匯入主題，清除它會將作用中主題切回 Claw。

## 它目前能做什麼

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - 透過 Gateway WS 與模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 透過瀏覽器即時工作階段通話。OpenAI 使用直接 WebRTC，Google Live 透過 WebSocket 使用受限的一次性瀏覽器 Token，而僅後端的即時語音 Plugin 使用 Gateway Relay 傳輸。Relay 會將供應商憑證保留在 Gateway 上，同時瀏覽器透過 `talk.realtime.relay*` RPC 串流麥克風 PCM，並透過 `chat.send` 將 `openclaw_agent_consult` 工具呼叫送回更大的已設定 OpenClaw 模型。
    - 在 Chat 中串流工具呼叫與即時工具輸出卡片（代理事件）。

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Channel：內建 Channel 加上隨附/外部 Plugin Channel 狀態、QR 登入，以及每個 Channel 的設定（`channels.status`、`web.login.*`、`config.patch`）。
    - 執行個體：存在清單與重新整理（`system-presence`）。
    - 工作階段：清單與每個工作階段的模型/思考/快速/詳細/追蹤/推理覆寫（`sessions.list`、`sessions.patch`）。
    - Dreams：Dreaming 狀態、啟用/停用切換，以及 Dream Diary 閱讀器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Cron 工作：列出/新增/編輯/執行/啟用/停用，加上執行歷程（`cron.*`）。
    - Skills：狀態、啟用/停用、安裝、API 金鑰更新（`skills.*`）。
    - Node：清單與能力（`node.list`）。
    - Exec 核准：編輯 Gateway 或 Node 允許清單，以及 `exec host=gateway/node` 的詢問政策（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="Config">
    - 檢視/編輯 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - 套用並透過驗證重新啟動（`config.apply`），並喚醒上一個作用中工作階段。
    - 寫入包含基底雜湊保護，以防止覆寫並行編輯。
    - 寫入（`config.set`/`config.apply`/`config.patch`）會對提交設定 Payload 中的 Ref 預先檢查作用中的 SecretRef 解析；未解析的作用中已提交 Ref 會在寫入前被拒絕。
    - Schema 與表單渲染（`config.schema` / `config.schema.lookup`，包含欄位 `title` / `description`、相符的 UI 提示、直接子項摘要、巢狀物件/萬用字元/陣列/組合節點上的文件中繼資料，以及可用時的 Plugin 與 Channel Schema）；只有當快照具有安全的原始往返能力時，才可使用 Raw JSON 編輯器。
    - 如果快照無法安全地以原始文字往返，Control UI 會強制使用 Form 模式，並針對該快照停用 Raw 模式。
    - Raw JSON 編輯器的「Reset to saved」會保留原始撰寫的形狀（格式、註解、`$include` 版面），而不是重新渲染扁平化快照，因此當快照可以安全往返時，外部編輯會在重設後保留下來。
    - 結構化 SecretRef 物件值會在表單文字輸入中以唯讀方式渲染，以防止意外的物件轉字串損毀。

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug：狀態/健康狀態/模型快照、事件記錄，以及手動 RPC 呼叫（`status`、`health`、`models.list`）。
    - Log：即時追蹤 Gateway 檔案 Log，並可篩選/匯出（`logs.tail`）。
    - 更新：執行套件/git 更新並重新啟動（`update.run`），附帶重新啟動報告，然後在重新連線後輪詢 `update.status` 以驗證正在執行的 Gateway 版本。

  </Accordion>
  <Accordion title="Cron jobs panel notes">
    - 對於隔離工作，交付預設為宣布摘要。如果你想要僅內部執行，可以切換為無。
    - 選取宣布時，會顯示 Channel/目標欄位。
    - Webhook 模式使用 `delivery.mode = "webhook"`，並將 `delivery.to` 設為有效的 HTTP(S) Webhook URL。
    - 對於主要工作階段工作，可使用 Webhook 和無交付模式。
    - 進階編輯控制包含執行後刪除、清除代理覆寫、Cron 精確/錯開選項、代理模型/思考覆寫，以及盡力交付切換。
    - 表單驗證會以欄位層級錯誤內嵌顯示；無效值會停用儲存按鈕，直到修正為止。
    - 設定 `cron.webhookToken` 可傳送專用 Bearer Token；如果省略，Webhook 會在沒有驗證標頭的情況下傳送。
    - 已淘汰的後援：儲存的舊版工作若有 `notify: true`，在遷移前仍可使用 `cron.webhook`。

  </Accordion>
</AccordionGroup>

## Chat 行為

<AccordionGroup>
  <Accordion title="傳送與歷史記錄語意">
    - `chat.send` 是**非阻塞**的：它會立即以 `{ runId, status: "started" }` 確認，回應則透過 `chat` 事件串流傳送。
    - 聊天上傳接受圖片和非影片檔案。圖片會保留原生圖片路徑；其他檔案會儲存為受管理媒體，並在歷史記錄中顯示為附件連結。
    - 使用相同的 `idempotencyKey` 重新傳送時，執行中會回傳 `{ status: "in_flight" }`，完成後會回傳 `{ status: "ok" }`。
    - `chat.history` 回應會為了 UI 安全限制大小。當逐字稿項目過大時，Gateway 可能會截斷長文字欄位、省略大型中繼資料區塊，並以預留位置取代過大的訊息（`[chat.history omitted: message too large]`）。
    - 助理/產生的圖片會保存為受管理媒體參照，並透過已驗證的 Gateway 媒體 URL 回傳，因此重新載入不依賴原始 base64 圖片負載留在聊天歷史記錄回應中。
    - `chat.history` 也會從可見的助理文字中移除僅供顯示的行內指令標籤（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、純文字工具呼叫 XML 負載（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和截斷的工具呼叫區塊），以及洩漏的 ASCII/全形模型控制權杖，並省略整段可見文字只有精確靜默權杖 `NO_REPLY` / `no_reply` 的助理項目。
    - 在作用中的傳送期間和最終歷史記錄重新整理時，如果 `chat.history` 短暫回傳較舊的快照，聊天檢視會讓本機樂觀使用者/助理訊息保持可見；一旦 Gateway 歷史記錄追上，規範逐字稿就會取代這些本機訊息。
    - 即時 `chat` 事件是傳送狀態，而 `chat.history` 會從耐久工作階段逐字稿重建。工具最終事件之後，Control UI 會重新載入歷史記錄，且只合併一小段樂觀尾端；逐字稿邊界記錄於 [WebChat](/zh-TW/web/webchat)。
    - `chat.inject` 會將助理備註附加到工作階段逐字稿，並廣播 `chat` 事件供僅限 UI 的更新使用（沒有代理程式執行，也沒有通道傳送）。
    - 聊天標頭的模型和思考選擇器會透過 `sessions.patch` 立即修補作用中的工作階段；它們是持久的工作階段覆寫，不是僅限單回合的傳送選項。
    - 在 Control UI 中輸入 `/new` 會建立並切換到與 New Chat 相同的全新儀表板工作階段。輸入 `/reset` 會保留 Gateway 對目前工作階段的明確就地重設。
    - 聊天模型選擇器會請求 Gateway 已設定的模型檢視。如果存在 `agents.defaults.models`，該允許清單會驅動選擇器。否則選擇器會顯示明確的 `models.providers.*.models` 項目，以及具有可用驗證的提供者。完整型錄仍可透過偵錯用 `models.list` RPC 搭配 `view: "all"` 取得。
    - 當新的 Gateway 工作階段用量報告顯示高上下文壓力時，聊天撰寫區會顯示上下文通知；在建議的 Compaction 層級，會顯示一個緊湊按鈕來執行一般工作階段 Compaction 路徑。過期的權杖快照會隱藏，直到 Gateway 再次回報新的用量。

  </Accordion>
  <Accordion title="通話模式（瀏覽器即時）">
    通話模式使用已註冊的即時語音提供者。設定 OpenAI 時使用 `talk.provider: "openai"` 加上 `talk.providers.openai.apiKey`，或設定 Google 時使用 `talk.provider: "google"` 加上 `talk.providers.google.apiKey`；Voice Call 即時提供者設定仍可重複用作後援。瀏覽器永遠不會收到標準提供者 API 金鑰。OpenAI 會收到用於 WebRTC 的臨時 Realtime 用戶端密鑰。Google Live 會收到一次性、受限制的 Live API 驗證權杖，用於瀏覽器 WebSocket 工作階段，且指示與工具宣告會由 Gateway 鎖定在權杖中。僅公開後端即時橋接的提供者會透過 Gateway 轉送傳輸執行，因此憑證和供應商通訊端會留在伺服器端，而瀏覽器音訊則透過已驗證的 Gateway RPC 傳輸。Realtime 工作階段提示由 Gateway 組裝；`talk.realtime.session` 不接受呼叫端提供的指示覆寫。

    在聊天撰寫器中，通話控制項是麥克風聽寫按鈕旁的波浪按鈕。通話開始時，撰寫器狀態列會顯示 `Connecting Talk...`，音訊連線後顯示 `Talk live`，或在即時工具呼叫透過 `chat.send` 諮詢已設定的較大型模型時顯示 `Asking OpenClaw...`。

    維護者即時煙霧測試：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 會驗證 OpenAI 瀏覽器 WebRTC SDP 交換、Google Live 受限制權杖瀏覽器 WebSocket 設定，以及使用假麥克風媒體的 Gateway 轉送瀏覽器介面卡。此命令只列印提供者狀態，不會記錄密鑰。

  </Accordion>
  <Accordion title="停止與中止">
    - 按一下 **Stop**（呼叫 `chat.abort`）。
    - 當執行處於作用中時，一般後續訊息會排入佇列。按一下佇列訊息上的 **Steer**，可將該後續訊息注入正在執行的回合。
    - 輸入 `/stop`（或獨立的中止片語，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）可帶外中止。
    - `chat.abort` 支援 `{ sessionKey }`（沒有 `runId`），可中止該工作階段的所有作用中執行。

  </Accordion>
  <Accordion title="中止部分保留">
    - 當執行遭到中止時，部分助理文字仍可顯示在 UI 中。
    - 當存在已緩衝輸出時，Gateway 會將中止的部分助理文字保存到逐字稿歷史記錄中。
    - 保存的項目包含中止中繼資料，因此逐字稿消費者可以區分中止部分與一般完成輸出。

  </Accordion>
</AccordionGroup>

## PWA 安裝與 Web Push

Control UI 隨附 `manifest.webmanifest` 和服務工作程式，因此現代瀏覽器可將其安裝為獨立 PWA。Web Push 可讓 Gateway 即使在分頁或瀏覽器視窗未開啟時，也能透過通知喚醒已安裝的 PWA。

| 表面                                                  | 功能                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 資訊清單。瀏覽器可連到它後，就會提供「安裝應用程式」。         |
| `ui/public/sw.js`                                     | 處理 `push` 事件和通知點擊的服務工作程式。                         |
| `push/vapid-keys.json`（在 OpenClaw 狀態目錄下）      | 自動產生的 VAPID 金鑰組，用於簽署 Web Push 負載。                  |
| `push/web-push-subscriptions.json`                    | 保存的瀏覽器訂閱端點。                                             |

當你想釘選金鑰（用於多主機部署、密鑰輪替或測試）時，可在 Gateway 行程上透過環境變數覆寫 VAPID 金鑰組：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（預設為 `mailto:openclaw@localhost`）

Control UI 使用這些受範圍限制的 Gateway 方法註冊和測試瀏覽器訂閱：

- `push.web.vapidPublicKey` — 擷取作用中的 VAPID 公鑰。
- `push.web.subscribe` — 註冊 `endpoint` 以及 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 移除已註冊的端點。
- `push.web.test` — 傳送測試通知到呼叫端的訂閱。

<Note>
Web Push 獨立於 iOS APNS 轉送路徑（轉送支援推播請見[設定](/zh-TW/gateway/configuration)）和現有的 `push.test` 方法，後兩者以原生行動配對為目標。
</Note>

## 託管嵌入

助理訊息可以使用 `[embed ...]` 短代碼行內轉譯託管網頁內容。iframe 沙箱政策由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    停用託管嵌入內的指令碼執行。
  </Tab>
  <Tab title="scripts（預設）">
    允許互動式嵌入，同時保持來源隔離；這是預設值，通常足以支援自包含的瀏覽器遊戲/小工具。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 之上新增 `allow-same-origin`，供刻意需要更高權限的同站文件使用。
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
只有在嵌入文件確實需要同源行為時才使用 `trusted`。對於大多數代理程式產生的遊戲和互動式畫布，`scripts` 是較安全的選擇。
</Warning>

絕對外部 `http(s)` 嵌入 URL 預設仍會被封鎖。如果你刻意希望 `[embed url="https://..."]` 載入第三方頁面，請設定 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天訊息寬度

群組化聊天訊息使用易讀的預設最大寬度。寬螢幕部署可以透過設定 `gateway.controlUi.chatMessageMaxWidth` 覆寫，而不必修補隨附的 CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

該值會在送達瀏覽器前驗證。支援的值包括一般長度和百分比，例如 `960px` 或 `82%`，以及受限制的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 寬度運算式。

## Tailnet 存取（建議）

<Tabs>
  <Tab title="整合式 Tailscale Serve（偏好）">
    將 Gateway 保持在 loopback，並讓 Tailscale Serve 透過 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    開啟：

    - `https://<magicdns>/`（或你已設定的 `gateway.controlUi.basePath`）

    預設情況下，當 `gateway.auth.allowTailscale` 為 `true` 時，Control UI/WebSocket Serve 請求可透過 Tailscale 身分標頭（`tailscale-user-login`）驗證。OpenClaw 會使用 `tailscale whois` 解析 `x-forwarded-for` 位址並比對該標頭來驗證身分，而且只有在請求透過 loopback 並帶有 Tailscale 的 `x-forwarded-*` 標頭時才接受這些身分。對於具有瀏覽器裝置身分的 Control UI 操作者工作階段，這個已驗證的 Serve 路徑也會略過裝置配對往返；無裝置瀏覽器和節點角色連線仍會遵循一般裝置檢查。如果你想即使對 Serve 流量也要求明確的共享密鑰憑證，請設定 `gateway.auth.allowTailscale: false`。然後使用 `gateway.auth.mode: "token"` 或 `"password"`。

    對於該非同步 Serve 身分路徑，同一用戶端 IP 和驗證範圍的驗證失敗嘗試，會在寫入速率限制前序列化。因此，同一瀏覽器的並行錯誤重試，可能會在第二個請求看到 `retry later`，而不是兩個一般不相符結果並行競爭。

    <Warning>
    無權杖 Serve 驗證假設 Gateway 主機是可信任的。如果不受信任的本機程式碼可能在該主機上執行，請要求權杖/密碼驗證。
    </Warning>

  </Tab>
  <Tab title="繫結到 tailnet + 權杖">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    然後開啟：

    - `http://<tailscale-ip>:18789/`（或你已設定的 `gateway.controlUi.basePath`）

    將相符的共享密鑰貼到 UI 設定中（以 `connect.params.auth.token` 或 `connect.params.auth.password` 傳送）。

  </Tab>
</Tabs>

## 不安全 HTTP

如果你透過純 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）開啟儀表板，瀏覽器會在**非安全上下文**中執行並封鎖 WebCrypto。預設情況下，OpenClaw 會**封鎖**沒有裝置身分的 Control UI 連線。

已記錄的例外：

- 僅限 localhost 的不安全 HTTP 相容性搭配 `gateway.controlUi.allowInsecureAuth=true`
- 透過 `gateway.auth.mode: "trusted-proxy"` 成功進行的操作者 Control UI 驗證
- 緊急破例用 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

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

    - 它允許 localhost 控制 UI 工作階段在非安全 HTTP 環境中不需裝置身分即可繼續。
    - 它不會略過配對檢查。
    - 它不會放寬遠端（非 localhost）裝置身分要求。

  </Accordion>
  <Accordion title="僅供緊急破窗使用">
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
  <Accordion title="受信任 Proxy 注意事項">
    - 成功的受信任 Proxy 驗證可以允許沒有裝置身分的**操作者**控制 UI 工作階段進入。
    - 這**不會**延伸到節點角色的控制 UI 工作階段。
    - 同主機 loopback 反向 Proxy 仍然不會滿足受信任 Proxy 驗證；請參閱[受信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

請參閱 [Tailscale](/zh-TW/gateway/tailscale) 以取得 HTTPS 設定指引。

## 內容安全性政策

控制 UI 隨附嚴格的 `img-src` 政策：只允許**同源**資產、`data:` URL，以及本機產生的 `blob:` URL。瀏覽器會拒絕遠端 `http(s)` 和通訊協定相對圖片 URL，且不會發出網路擷取。

這在實務上的意義：

- 透過相對路徑提供的頭像和圖片（例如 `/avatars/<id>`）仍會呈現，包括 UI 擷取並轉換成本機 `blob:` URL 的已驗證頭像路由。
- 內嵌 `data:image/...` URL 仍會呈現（對通訊協定內承載資料很有用）。
- 控制 UI 建立的本機 `blob:` URL 仍會呈現。
- 通道中繼資料送出的遠端頭像 URL 會在控制 UI 的頭像輔助程式中被移除，並替換為內建標誌/徽章，因此遭入侵或惡意的通道無法強迫操作者瀏覽器擷取任意遠端圖片。

你不需要變更任何內容即可取得此行為 — 它一律啟用且不可設定。

## 頭像路由驗證

設定 Gateway 驗證後，控制 UI 頭像端點需要與其餘 API 相同的 Gateway 權杖：

- `GET /avatar/<agentId>` 只會將頭像圖片傳回給已驗證的呼叫端。`GET /avatar/<agentId>?meta=1` 會在相同規則下傳回頭像中繼資料。
- 對任一路由的未驗證請求都會遭拒（與相鄰的 assistant-media 路由一致）。這可防止頭像路由在原本受保護的主機上洩漏代理身分。
- 控制 UI 在擷取頭像時會將 Gateway 權杖作為 bearer 標頭轉送，並使用已驗證的 blob URL，讓圖片仍可在儀表板中呈現。

如果你停用 Gateway 驗證（不建議在共用主機上使用），頭像路由也會與 Gateway 其餘部分一致，變成不需驗證。

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

接著將 UI 指向你的 Gateway WS URL（例如 `ws://127.0.0.1:18789`）。

## 偵錯/測試：開發伺服器 + 遠端 Gateway

控制 UI 是靜態檔案；WebSocket 目標可設定，且可以不同於 HTTP 來源。當你想在本機使用 Vite 開發伺服器，但 Gateway 在其他地方執行時，這很方便。

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
    - 如果你透過 `gatewayUrl` 傳入完整的 `ws://` 或 `wss://` 端點，請對 `gatewayUrl` 值進行 URL 編碼，讓瀏覽器正確解析查詢字串。
    - 只要可行，`token` 應透過 URL 片段（`#token=...`）傳遞。片段不會傳送到伺服器，可避免請求日誌和 Referer 洩漏。舊版 `?token=` 查詢參數仍會為了相容性匯入一次，但只作為後備，且會在啟動後立即移除。
    - `password` 只會保留在記憶體中。
    - 設定 `gatewayUrl` 時，UI 不會退回使用設定或環境憑證。請明確提供 `token`（或 `password`）。缺少明確憑證會造成錯誤。
    - 當 Gateway 位於 TLS 後方時（Tailscale Serve、HTTPS Proxy 等），請使用 `wss://`。
    - `gatewayUrl` 只會在最上層視窗中接受（不可嵌入），以防止點擊劫持。
    - 非 loopback 控制 UI 部署必須明確設定 `gateway.controlUi.allowedOrigins`（完整來源）。這包含遠端開發設定。
    - Gateway 啟動時可能會從有效的執行階段繫結和連接埠植入本機來源，例如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>`，但遠端瀏覽器來源仍需要明確項目。
    - 除非是嚴格受控的本機測試，否則不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允許任何瀏覽器來源，而不是「符合我正在使用的任何主機」。
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

遠端存取設定詳細資料：[遠端存取](/zh-TW/gateway/remote)。

## 相關

- [儀表板](/zh-TW/web/dashboard) — Gateway 儀表板
- [健康狀態檢查](/zh-TW/gateway/health) — Gateway 健康狀態監控
- [TUI](/zh-TW/web/tui) — 終端機使用者介面
- [WebChat](/zh-TW/web/webchat) — 瀏覽器型聊天介面
