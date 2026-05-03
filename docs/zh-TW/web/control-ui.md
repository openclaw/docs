---
read_when:
    - 您想要從瀏覽器操作 Gateway
    - 你想要無需 SSH 通道即可存取 Tailnet
sidebarTitle: Control UI
summary: 以瀏覽器為基礎的 Gateway 控制 UI（聊天、節點、設定）
title: 控制介面
x-i18n:
    generated_at: "2026-05-03T02:46:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 88959ccf435b31015039bf28c3043023d99f0b953a1489986ab2d0cbd261771c
    source_path: web/control-ui.md
    workflow: 16
---

Control UI 是由 Gateway 提供服務的小型 **Vite + Lit** 單頁應用程式：

- 預設：`http://<host>:18789/`
- 選用前綴：設定 `gateway.controlUi.basePath`（例如 `/openclaw`）

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

儀表板設定面板會為目前瀏覽器分頁工作階段與選取的 Gateway URL 保留 token；密碼不會被持久保存。上手流程通常會在首次連線時產生 Gateway token，用於共用祕密驗證，但當 `gateway.auth.mode` 是 `"password"` 時，也可以使用密碼驗證。

## 裝置配對（第一次連線）

當你從新的瀏覽器或裝置連線到 Control UI 時，Gateway 通常會要求**一次性配對核准**。這是一項安全措施，用來防止未授權存取。

**你會看到：**「disconnected (1008): pairing required」

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

如果瀏覽器已經配對，而你將它從讀取存取變更為寫入/管理員存取，這會被視為核准升級，而不是靜默重新連線。OpenClaw 會保留舊核准有效、阻擋範圍更廣的重新連線，並要求你明確核准新的範圍集合。

核准後，系統會記住該裝置；除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤銷，否則不需要重新核准。請參閱 [裝置 CLI](/zh-TW/cli/devices) 了解 token 輪替與撤銷。

<Note>
- 直接的 local loopback 瀏覽器連線（`127.0.0.1` / `localhost`）會自動核准。
- 當 `gateway.auth.allowTailscale: true`、Tailscale 身分通過驗證，且瀏覽器提供其裝置身分時，Tailscale Serve 可以為 Control UI 操作者工作階段略過配對往返。
- 直接的 Tailnet 繫結、LAN 瀏覽器連線，以及沒有裝置身分的瀏覽器設定檔仍需要明確核准。
- 每個瀏覽器設定檔都會產生唯一裝置 ID，因此切換瀏覽器或清除瀏覽器資料都會需要重新配對。

</Note>

## 個人身分（瀏覽器本機）

Control UI 支援每個瀏覽器各自的個人身分（顯示名稱與頭像），會附加到傳出的訊息上，用於共用工作階段中的歸屬標示。它存在於瀏覽器儲存空間中，範圍限定於目前瀏覽器設定檔，不會同步到其他裝置，也不會在伺服器端持久保存，除了你實際送出的訊息上一般的逐字稿作者中繼資料。清除網站資料或切換瀏覽器會將它重設為空白。

相同的瀏覽器本機模式也適用於助理頭像覆寫。上傳的助理頭像只會在本機瀏覽器上覆蓋由 Gateway 解析出的身分，而且絕不會透過 `config.patch` 往返傳送。共用的 `ui.assistant.avatar` 設定欄位仍可供非 UI 用戶端直接寫入該欄位（例如腳本化 Gateway 或自訂儀表板）。

## 執行階段設定端點

Control UI 會從 `/__openclaw/control-ui-config.json` 擷取其執行階段設定。該端點與其餘 HTTP 介面一樣受相同 Gateway 驗證保護：未驗證的瀏覽器無法擷取它，而成功擷取需要已有效的 Gateway token/密碼、Tailscale Serve 身分，或受信任 Proxy 身分。

## 語言支援

Control UI 可在首次載入時依據你的瀏覽器語言環境進行本地化。若要稍後覆寫，請開啟 **概覽 -> Gateway 存取 -> 語言**。語言環境選擇器位於 Gateway 存取卡片中，不在外觀底下。

- 支援的語言環境：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`ar`、`it`、`tr`、`uk`、`id`、`pl`、`th`、`vi`、`nl`、`fa`
- 非英文翻譯會在瀏覽器中延遲載入。
- 選取的語言環境會儲存在瀏覽器儲存空間，並在日後造訪時重複使用。
- 缺漏的翻譯鍵會退回英文。

文件翻譯會針對相同的非英文語言環境集合產生，但文件網站內建的 Mintlify 語言選擇器僅限於 Mintlify 接受的語言環境代碼。泰文（`th`）與波斯文（`fa`）文件仍會在發布 repo 中產生；在 Mintlify 支援這些代碼之前，它們可能不會出現在該選擇器中。

## 外觀主題

外觀面板保留內建的 Claw、Knot 與 Dash 主題，另加一個瀏覽器本機的 tweakcn 匯入插槽。若要匯入主題，請開啟 [tweakcn 主題](https://tweakcn.com/themes)，選擇或建立主題，點擊 **分享**，然後將複製的主題連結貼到外觀中。匯入器也接受 `https://tweakcn.com/r/themes/<id>` 登錄 URL、像 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 這樣的編輯器 URL、相對 `/themes/<id>` 路徑、原始主題 ID，以及像 `amethyst-haze` 這樣的預設主題名稱。

匯入的主題只會儲存在目前瀏覽器設定檔中。它們不會寫入 Gateway 設定，也不會跨裝置同步。替換匯入的主題會更新單一本機插槽；若清除它，且匯入的主題當時被選取，作用中主題會切回 Claw。

## 它可以做什麼（目前）

<AccordionGroup>
  <Accordion title="聊天與語音交談">
    - 透過 Gateway WS 與模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 透過瀏覽器即時工作階段進行語音交談。OpenAI 使用直接 WebRTC，Google Live 透過 WebSocket 使用受限的一次性瀏覽器 token，而僅後端的即時語音 Plugin 則使用 Gateway 轉送傳輸。轉送會將提供者憑證保留在 Gateway 上，同時瀏覽器透過 `talk.realtime.relay*` RPC 串流麥克風 PCM，並將 `openclaw_agent_consult` 工具呼叫透過 `chat.send` 傳回給設定中較大的 OpenClaw 模型。
    - 在聊天中串流工具呼叫 + 即時工具輸出卡片（代理事件）。

  </Accordion>
  <Accordion title="頻道、執行個體、工作階段、夢境">
    - 頻道：內建加上隨附/外部 Plugin 頻道狀態、QR 登入，以及每個頻道設定（`channels.status`、`web.login.*`、`config.patch`）。
    - 執行個體：在線清單 + 重新整理（`system-presence`）。
    - 工作階段：清單 + 每個工作階段的模型/思考/快速/詳細/追蹤/推理覆寫（`sessions.list`、`sessions.patch`）。
    - 夢境：dreaming 狀態、啟用/停用切換，以及 Dream Diary 閱讀器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、節點、exec 核准">
    - Cron 作業：列出/新增/編輯/執行/啟用/停用 + 執行歷史（`cron.*`）。
    - Skills：狀態、啟用/停用、安裝、API key 更新（`skills.*`）。
    - 節點：清單 + 能力（`node.list`）。
    - Exec 核准：編輯 Gateway 或節點 allowlist + `exec host=gateway/node` 的詢問政策（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="設定">
    - 檢視/編輯 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - 套用 + 以驗證重新啟動（`config.apply`），並喚醒最後一個作用中工作階段。
    - 寫入包含 base-hash 防護，以防止覆蓋並行編輯。
    - 寫入（`config.set`/`config.apply`/`config.patch`）會對已提交設定酬載中的 refs 預先檢查作用中的 SecretRef 解析；未解析的作用中已提交 refs 會在寫入前遭到拒絕。
    - 結構描述 + 表單算繪（`config.schema` / `config.schema.lookup`，包含欄位 `title` / `description`、相符的 UI 提示、直接子項摘要、巢狀物件/萬用字元/陣列/組合節點上的文件中繼資料，以及可用時的 Plugin + 頻道結構描述）；只有當快照具備安全的原始往返時，才可使用原始 JSON 編輯器。
    - 如果快照無法安全地以原始文字往返，Control UI 會強制使用表單模式，並針對該快照停用原始模式。
    - 原始 JSON 編輯器的「重設為已儲存」會保留原始撰寫的形狀（格式、註解、`$include` 版面），而不是重新算繪扁平化快照，因此當快照可以安全往返時，外部編輯在重設後仍會保留。
    - 結構化 SecretRef 物件值會在表單文字輸入中以唯讀呈現，以防止意外的物件轉字串損毀。

  </Accordion>
  <Accordion title="偵錯、日誌、更新">
    - 偵錯：狀態/健康狀態/模型快照 + 事件日誌 + 手動 RPC 呼叫（`status`、`health`、`models.list`）。
    - 日誌：即時追蹤 Gateway 檔案日誌，支援篩選/匯出（`logs.tail`）。
    - 更新：執行套件/git 更新 + 重新啟動（`update.run`）並產生重新啟動報告，然後在重新連線後輪詢 `update.status`，以確認正在執行的 Gateway 版本。

  </Accordion>
  <Accordion title="Cron 作業面板注意事項">
    - 對於隔離作業，遞送預設為宣布摘要。如果你想要僅供內部執行，可以切換為無。
    - 選取宣布時會顯示頻道/目標欄位。
    - Webhook 模式使用 `delivery.mode = "webhook"`，且 `delivery.to` 設為有效的 HTTP(S) Webhook URL。
    - 對於主工作階段作業，可使用 Webhook 與無遞送模式。
    - 進階編輯控制項包含執行後刪除、清除代理覆寫、cron 精確/錯開選項、代理模型/思考覆寫，以及最佳努力遞送切換。
    - 表單驗證會以欄位層級錯誤內嵌顯示；無效值會停用儲存按鈕，直到修正為止。
    - 設定 `cron.webhookToken` 以傳送專用 bearer token；若省略，Webhook 會在沒有驗證標頭的情況下傳送。
    - 已棄用的後援：儲存的舊版作業若有 `notify: true`，在遷移前仍可使用 `cron.webhook`。

  </Accordion>
</AccordionGroup>

## 聊天行為

<AccordionGroup>
  <Accordion title="傳送與歷程語意">
    - `chat.send` 是**非阻塞**的：它會立即以 `{ runId, status: "started" }` 確認，並透過 `chat` 事件串流回應。
    - 聊天上傳接受圖片以及非影片檔案。圖片會保留原生圖片路徑；其他檔案會儲存為受管理媒體，並在歷程中顯示為附件連結。
    - 使用相同 `idempotencyKey` 重新傳送時，執行中會回傳 `{ status: "in_flight" }`，完成後會回傳 `{ status: "ok" }`。
    - `chat.history` 回應基於 UI 安全而有大小限制。當對話記錄項目過大時，Gateway 可能會截斷長文字欄位、省略龐大的中繼資料區塊，並以預留位置取代過大的訊息（`[chat.history omitted: message too large]`）。
    - 助理/產生的圖片會保存為受管理媒體參照，並透過經驗證的 Gateway 媒體 URL 回傳，因此重新載入不會依賴原始 base64 圖片酬載仍保留在聊天歷程回應中。
    - `chat.history` 也會從可見的助理文字中移除僅供顯示的行內指令標籤（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、純文字工具呼叫 XML 酬載（包含 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及被截斷的工具呼叫區塊）、洩漏的 ASCII/全形模型控制詞元，並省略可見全文只有精確靜默詞元 `NO_REPLY` / `no_reply` 的助理項目。
    - 在作用中的傳送期間以及最後的歷程重新整理期間，如果 `chat.history` 短暫回傳較舊的快照，聊天檢視會保持本機樂觀使用者/助理訊息可見；一旦 Gateway 歷程追上，標準對話記錄就會取代這些本機訊息。
    - `chat.inject` 會將助理備註附加到工作階段對話記錄，並廣播 `chat` 事件以進行僅限 UI 的更新（不會執行代理，也不會傳送到頻道）。
    - 聊天標頭的模型與思考選擇器會立即透過 `sessions.patch` 修補作用中的工作階段；它們是持久的工作階段覆寫，而不是僅限單輪的傳送選項。
    - 在 Control UI 中輸入 `/new` 會建立並切換到與新增聊天相同的全新儀表板工作階段。輸入 `/reset` 則會保留 Gateway 對目前工作階段的明確原地重設。
    - 聊天模型選擇器會請求 Gateway 設定的模型檢視。如果存在 `agents.defaults.models`，該允許清單會驅動選擇器。否則，選擇器會顯示明確的 `models.providers.*.models` 項目，以及具備可用驗證的提供者。完整型錄仍可透過除錯用 `models.list` RPC 搭配 `view: "all"` 取得。
    - 當新的 Gateway 工作階段使用量報告顯示高上下文壓力時，聊天撰寫區會顯示上下文提示，並在建議的 Compaction 等級顯示一個緊縮按鈕，用來執行一般工作階段 Compaction 路徑。過期的詞元快照會被隱藏，直到 Gateway 再次回報新的使用量。

  </Accordion>
  <Accordion title="通話模式（瀏覽器即時）">
    通話模式使用已註冊的即時語音提供者。設定 OpenAI 時使用 `talk.provider: "openai"` 加上 `talk.providers.openai.apiKey`，或設定 Google 時使用 `talk.provider: "google"` 加上 `talk.providers.google.apiKey`；語音通話即時提供者設定仍可重用為後援。瀏覽器絕不會收到標準提供者 API key。OpenAI 會收到用於 WebRTC 的短暫 Realtime 用戶端密鑰。Google Live 會收到用於瀏覽器 WebSocket 工作階段的一次性受限 Live API 驗證權杖，其指示與工具宣告會由 Gateway 鎖定在權杖中。僅公開後端即時橋接的提供者會透過 Gateway 中繼傳輸執行，因此憑證與廠商 socket 會保留在伺服器端，而瀏覽器音訊則透過經驗證的 Gateway RPC 移動。Realtime 工作階段提示由 Gateway 組裝；`talk.realtime.session` 不接受呼叫者提供的指示覆寫。

    在聊天撰寫器中，通話控制項是麥克風聽寫按鈕旁的波浪按鈕。通話開始時，撰寫器狀態列會顯示 `Connecting Talk...`，音訊連線後顯示 `Talk live`，或在即時工具呼叫透過 `chat.send` 諮詢已設定的較大模型時顯示 `Asking OpenClaw...`。

    維護者即時煙霧測試：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 會驗證 OpenAI 瀏覽器 WebRTC SDP 交換、Google Live 受限權杖瀏覽器 WebSocket 設定，以及搭配假麥克風媒體的 Gateway 中繼瀏覽器介面卡。此命令只列印提供者狀態，且不記錄密鑰。

  </Accordion>
  <Accordion title="停止與中止">
    - 按一下**停止**（呼叫 `chat.abort`）。
    - 執行作用中時，一般後續訊息會排入佇列。按一下佇列訊息上的**引導**，可將該後續訊息注入正在執行的輪次。
    - 輸入 `/stop`（或獨立的中止片語，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以帶外中止。
    - `chat.abort` 支援 `{ sessionKey }`（沒有 `runId`）來中止該工作階段的所有作用中執行。

  </Accordion>
  <Accordion title="中止部分內容保留">
    - 當執行被中止時，部分助理文字仍可顯示在 UI 中。
    - 當存在已緩衝輸出時，Gateway 會將已中止的部分助理文字保存到對話記錄歷程。
    - 保存的項目包含中止中繼資料，讓對話記錄取用者能區分中止部分內容與正常完成輸出。

  </Accordion>
</AccordionGroup>

## PWA 安裝與 Web Push

Control UI 隨附 `manifest.webmanifest` 和服務工作者，因此現代瀏覽器可以將它安裝為獨立 PWA。Web Push 讓 Gateway 即使在分頁或瀏覽器視窗未開啟時，也能以通知喚醒已安裝的 PWA。

| 介面                                                  | 作用                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest。瀏覽器在可連線後會提供「安裝應用程式」。             |
| `ui/public/sw.js`                                     | 處理 `push` 事件與通知點擊的服務工作者。                           |
| `push/vapid-keys.json`（位於 OpenClaw 狀態目錄下）    | 自動產生的 VAPID 金鑰組，用於簽署 Web Push 酬載。                  |
| `push/web-push-subscriptions.json`                    | 保存的瀏覽器訂閱端點。                                             |

當你想固定金鑰時（用於多主機部署、密鑰輪替或測試），可透過 Gateway 處理程序上的環境變數覆寫 VAPID 金鑰組：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（預設為 `mailto:openclaw@localhost`）

Control UI 使用這些受範圍控管的 Gateway 方法來註冊與測試瀏覽器訂閱：

- `push.web.vapidPublicKey` — 擷取作用中的 VAPID 公開金鑰。
- `push.web.subscribe` — 註冊 `endpoint` 加上 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 移除已註冊的端點。
- `push.web.test` — 將測試通知傳送到呼叫者的訂閱。

<Note>
Web Push 獨立於 iOS APNS 中繼路徑（中繼支援的推播請參閱[設定](/zh-TW/gateway/configuration)）以及既有的 `push.test` 方法，後兩者以原生行動配對為目標。
</Note>

## 託管嵌入

助理訊息可以透過 `[embed ...]` 短代碼行內呈現託管的網頁內容。iframe 沙箱政策由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="嚴格">
    停用託管嵌入內的腳本執行。
  </Tab>
  <Tab title="腳本（預設）">
    允許互動式嵌入，同時保持來源隔離；這是預設值，通常足以支援自包含的瀏覽器遊戲/小工具。
  </Tab>
  <Tab title="受信任">
    在 `allow-scripts` 之外為刻意需要更高權限的同站文件加上 `allow-same-origin`。
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
只有在嵌入文件確實需要同源行為時才使用 `trusted`。對大多數代理產生的遊戲與互動畫布而言，`scripts` 是較安全的選擇。
</Warning>

絕對外部 `http(s)` 嵌入 URL 預設仍會被封鎖。如果你刻意想讓 `[embed url="https://..."]` 載入第三方頁面，請設定 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天訊息寬度

群組化的聊天訊息使用易讀的預設最大寬度。寬螢幕部署可以透過設定 `gateway.controlUi.chatMessageMaxWidth` 覆寫它，而不必修補隨附的 CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

此值會在抵達瀏覽器前進行驗證。支援的值包含純長度與百分比，例如 `960px` 或 `82%`，以及受限制的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 寬度運算式。

## Tailnet 存取（建議）

<Tabs>
  <Tab title="整合式 Tailscale Serve（首選）">
    將 Gateway 保持在迴路介面上，並讓 Tailscale Serve 透過 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    開啟：

    - `https://<magicdns>/`（或你設定的 `gateway.controlUi.basePath`）

    預設情況下，當 `gateway.auth.allowTailscale` 為 `true` 時，Control UI/WebSocket Serve 請求可透過 Tailscale 身分標頭（`tailscale-user-login`）進行驗證。OpenClaw 會透過 `tailscale whois` 解析 `x-forwarded-for` 位址並比對該標頭來驗證身分，且只在請求透過 Tailscale 的 `x-forwarded-*` 標頭打到迴路介面時接受這些身分。對於具有瀏覽器裝置身分的 Control UI 操作者工作階段，此已驗證的 Serve 路徑也會略過裝置配對往返流程；無裝置的瀏覽器與節點角色連線仍會遵循一般裝置檢查。如果你想要求即使是 Serve 流量也必須使用明確的共用密鑰憑證，請設定 `gateway.auth.allowTailscale: false`。然後使用 `gateway.auth.mode: "token"` 或 `"password"`。

    對於該非同步 Serve 身分路徑，相同用戶端 IP 與驗證範圍的失敗驗證嘗試會在寫入速率限制前序列化。因此，來自同一瀏覽器的並行錯誤重試可能會在第二個請求上顯示 `retry later`，而不是兩個單純不相符的請求平行競爭。

    <Warning>
    無權杖 Serve 驗證假設 Gateway 主機可信任。如果不受信任的本機程式碼可能在該主機上執行，請要求權杖/密碼驗證。
    </Warning>

  </Tab>
  <Tab title="繫結至 tailnet + 權杖">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    然後開啟：

    - `http://<tailscale-ip>:18789/`（或你設定的 `gateway.controlUi.basePath`）

    將相符的共用密鑰貼到 UI 設定中（以 `connect.params.auth.token` 或 `connect.params.auth.password` 傳送）。

  </Tab>
</Tabs>

## 不安全的 HTTP

如果你透過一般 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）開啟儀表板，瀏覽器會在**非安全情境**中執行並封鎖 WebCrypto。預設情況下，OpenClaw 會**封鎖**沒有裝置身分的 Control UI 連線。

已記錄的例外：

- 使用 `gateway.controlUi.allowInsecureAuth=true` 的僅限 localhost 不安全 HTTP 相容性
- 透過 `gateway.auth.mode: "trusted-proxy"` 成功進行的操作者 Control UI 驗證
- 緊急破窗 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**建議修正方式：**使用 HTTPS（Tailscale Serve），或在本機開啟 UI：

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

    - 它允許 localhost Control UI 工作階段在非安全 HTTP 情境下不需要裝置身分即可繼續。
    - 它不會略過配對檢查。
    - 它不會放寬遠端（非 localhost）的裝置身分要求。

  </Accordion>
  <Accordion title="僅限緊急處置">
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
  <Accordion title="受信任 Proxy 注意事項">
    - 成功的受信任 Proxy 驗證可以允許沒有裝置身分的 **operator** Control UI 工作階段進入。
    - 這**不會**延伸到 node-role Control UI 工作階段。
    - 同主機 loopback 反向 Proxy 仍然不符合受信任 Proxy 驗證；請參閱[受信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

請參閱 [Tailscale](/zh-TW/gateway/tailscale) 以取得 HTTPS 設定指引。

## 內容安全政策

Control UI 隨附嚴格的 `img-src` 政策：只允許**同源**資產、`data:` URL，以及本機產生的 `blob:` URL。遠端 `http(s)` 和通訊協定相對圖片 URL 會被瀏覽器拒絕，且不會發出網路擷取。

這在實務上的意思是：

- 透過相對路徑提供的頭像和圖片（例如 `/avatars/<id>`）仍會算繪，包括 UI 擷取並轉換成本機 `blob:` URL 的已驗證頭像路由。
- 內嵌 `data:image/...` URL 仍會算繪（對通訊協定內酬載很有用）。
- Control UI 建立的本機 `blob:` URL 仍會算繪。
- 頻道中繼資料發出的遠端頭像 URL 會在 Control UI 的頭像輔助程式中被移除，並替換為內建標誌/徽章，因此遭入侵或惡意的頻道無法強迫操作員瀏覽器擷取任意遠端圖片。

你不需要變更任何設定即可取得此行為，這一律啟用且不可設定。

## 頭像路由驗證

設定 Gateway 驗證時，Control UI 頭像端點需要與 API 其餘部分相同的 Gateway token：

- `GET /avatar/<agentId>` 只會向已驗證呼叫者傳回頭像圖片。`GET /avatar/<agentId>?meta=1` 會依相同規則傳回頭像中繼資料。
- 對任一路由的未驗證請求都會被拒絕（與同層的 assistant-media 路由一致）。這會防止頭像路由在其他部分受保護的主機上洩漏代理身分。
- Control UI 本身在擷取頭像時會以 bearer 標頭轉送 Gateway token，並使用已驗證的 blob URL，讓圖片仍能在儀表板中算繪。

如果你停用 Gateway 驗證（不建議在共用主機上這麼做），頭像路由也會變成未驗證，與 Gateway 的其餘部分一致。

## 建置 UI

Gateway 會從 `dist/control-ui` 提供靜態檔案。使用以下命令建置：

```bash
pnpm ui:build
```

選用的絕對基底路徑（當你想要固定資產 URL 時）：

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

    選用的一次性驗證（如需要）：

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="注意事項">
    - `gatewayUrl` 會在載入後儲存在 localStorage，並從 URL 中移除。
    - 如果你透過 `gatewayUrl` 傳入完整的 `ws://` 或 `wss://` 端點，請對 `gatewayUrl` 值進行 URL 編碼，讓瀏覽器正確解析查詢字串。
    - 只要可行，`token` 應透過 URL 片段（`#token=...`）傳遞。片段不會傳送到伺服器，因此可避免請求記錄和 Referer 洩漏。舊版 `?token=` 查詢參數仍會為了相容性匯入一次，但僅作為備援，並會在啟動後立即移除。
    - `password` 只會保存在記憶體中。
    - 設定 `gatewayUrl` 時，UI 不會回退到設定或環境憑證。請明確提供 `token`（或 `password`）。缺少明確憑證會造成錯誤。
    - 當 Gateway 位於 TLS 後方（Tailscale Serve、HTTPS Proxy 等）時，請使用 `wss://`。
    - `gatewayUrl` 只會在頂層視窗中接受（不接受嵌入式視窗），以防止 clickjacking。
    - 非 loopback Control UI 部署必須明確設定 `gateway.controlUi.allowedOrigins`（完整來源）。這包含遠端開發設定。
    - Gateway 啟動時可能會從有效的執行階段 bind 和連接埠植入本機來源，例如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>`，但遠端瀏覽器來源仍需要明確項目。
    - 除了嚴格受控的本機測試外，請勿使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允許任何瀏覽器來源，而不是「符合我正在使用的任何主機」。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 會啟用 Host-header 來源備援模式，但這是危險的安全性模式。

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
- [健康狀態檢查](/zh-TW/gateway/health) — Gateway 健康狀態監控
- [TUI](/zh-TW/web/tui) — 終端機使用者介面
- [WebChat](/zh-TW/web/webchat) — 瀏覽器式聊天介面
