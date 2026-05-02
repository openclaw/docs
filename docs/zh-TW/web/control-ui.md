---
read_when:
    - 您想從瀏覽器操作 Gateway
    - 你想要無需 SSH 隧道即可存取 Tailnet
sidebarTitle: Control UI
summary: 基於瀏覽器的 Gateway 控制 UI（聊天、節點、設定）
title: 控制介面
x-i18n:
    generated_at: "2026-05-02T23:39:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 50bef807915f27406e19f1c6ca7d839a610d79ba79da85d7a78523400cbf9208
    source_path: web/control-ui.md
    workflow: 16
---

控制 UI 是一個小型 **Vite + Lit** 單頁應用程式，由 Gateway 提供服務：

- 預設：`http://<host>:18789/`
- 可選前綴：設定 `gateway.controlUi.basePath`（例如 `/openclaw`）

它會在同一個連接埠上**直接與 Gateway WebSocket** 通訊。

## 快速開啟（本機）

如果 Gateway 在同一台電腦上執行，請開啟：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果頁面載入失敗，請先啟動 Gateway：`openclaw gateway`。

驗證會在 WebSocket 握手期間透過以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 當 `gateway.auth.allowTailscale: true` 時的 Tailscale Serve 身分標頭
- 當 `gateway.auth.mode: "trusted-proxy"` 時的受信任 Proxy 身分標頭

儀表板設定面板會為目前的瀏覽器分頁工作階段和所選 Gateway URL 保留一個權杖；密碼不會持久保存。Onboarding 通常會在第一次連線時為共享密鑰驗證產生 Gateway 權杖，但當 `gateway.auth.mode` 為 `"password"` 時，密碼驗證也可以使用。

## 裝置配對（第一次連線）

當你從新的瀏覽器或裝置連線到控制 UI 時，Gateway 通常會要求**一次性配對核准**。這是一項安全措施，用於防止未授權存取。

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

如果瀏覽器以已變更的驗證詳細資料（角色/範圍/公開金鑰）重試配對，先前的待處理要求會被取代，並建立新的 `requestId`。核准前請重新執行 `openclaw devices list`。

如果瀏覽器已經配對，而你將它從讀取存取變更為寫入/管理員存取，這會被視為核准升級，而不是靜默重新連線。OpenClaw 會保留舊核准有效、封鎖更高權限的重新連線，並要求你明確核准新的範圍集合。

核准後，裝置會被記住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤銷它，否則不需要重新核准。請參閱[裝置 CLI](/zh-TW/cli/devices)了解權杖輪替和撤銷。

<Note>
- 直接 local loopback 瀏覽器連線（`127.0.0.1` / `localhost`）會自動核准。
- 當 `gateway.auth.allowTailscale: true`、Tailscale 身分驗證通過，且瀏覽器呈現其裝置身分時，Tailscale Serve 可以為控制 UI 操作者工作階段略過配對往返。
- 直接 Tailnet 綁定、LAN 瀏覽器連線，以及沒有裝置身分的瀏覽器設定檔仍需要明確核准。
- 每個瀏覽器設定檔都會產生唯一裝置 ID，因此切換瀏覽器或清除瀏覽器資料都需要重新配對。

</Note>

## 個人身分（瀏覽器本機）

控制 UI 支援每個瀏覽器的個人身分（顯示名稱和頭像），並附加到傳出訊息，以便在共享工作階段中標示歸屬。它存在於瀏覽器儲存空間中，範圍限於目前瀏覽器設定檔，不會同步到其他裝置，也不會在伺服器端持久保存，除了你實際傳送的訊息上一般逐字稿作者身分中繼資料之外。清除網站資料或切換瀏覽器會將它重設為空白。

相同的瀏覽器本機模式也適用於助理頭像覆寫。上傳的助理頭像只會在本機瀏覽器上覆蓋 Gateway 解析出的身分，且永遠不會透過 `config.patch` 往返。共享的 `ui.assistant.avatar` 設定欄位仍可供直接寫入該欄位的非 UI 用戶端使用（例如指令碼化 Gateway 或自訂儀表板）。

## 執行階段設定端點

控制 UI 會從 `/__openclaw/control-ui-config.json` 擷取其執行階段設定。該端點受與其餘 HTTP 介面相同的 Gateway 驗證保護：未驗證的瀏覽器無法擷取它，而成功擷取需要已有有效的 Gateway 權杖/密碼、Tailscale Serve 身分，或受信任 Proxy 身分。

## 語言支援

控制 UI 可以在第一次載入時根據你的瀏覽器語言環境進行本地化。若要稍後覆寫，請開啟 **Overview -> Gateway Access -> Language**。語言環境選擇器位於 Gateway Access 卡片中，而不是 Appearance 底下。

- 支援的語言環境：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`ar`、`it`、`tr`、`uk`、`id`、`pl`、`th`、`vi`、`nl`、`fa`
- 非英文翻譯會在瀏覽器中延遲載入。
- 選取的語言環境會儲存在瀏覽器儲存空間中，並在未來造訪時重複使用。
- 缺少的翻譯鍵會退回英文。

文件翻譯會針對相同的非英文語言環境集合產生，但文件網站內建的 Mintlify 語言選擇器僅限於 Mintlify 接受的語言環境代碼。泰文（`th`）和波斯文（`fa`）文件仍會在發布 repo 中產生；在 Mintlify 支援這些代碼之前，它們可能不會出現在該選擇器中。

## 外觀主題

Appearance 面板保留內建的 Claw、Knot 和 Dash 主題，外加一個瀏覽器本機 tweakcn 匯入槽。若要匯入主題，請開啟 [tweakcn themes](https://tweakcn.com/themes)，選擇或建立主題，按一下 **Share**，並將複製的主題連結貼到 Appearance。匯入器也接受 `https://tweakcn.com/r/themes/<id>` 登錄 URL、像 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 這樣的編輯器 URL、相對 `/themes/<id>` 路徑、原始主題 ID，以及預設主題名稱，例如 `amethyst-haze`。

匯入的主題只會儲存在目前的瀏覽器設定檔中。它們不會寫入 Gateway 設定，也不會跨裝置同步。替換匯入的主題會更新該本機槽；清除它時，如果匯入的主題目前被選取，作用中主題會切回 Claw。

## 它現在可以做什麼

<AccordionGroup>
  <Accordion title="聊天與語音交談">
    - 透過 Gateway WS 與模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 使用伺服器端 STT 對 Chat 編寫器口述（`chat.transcribeAudio`）。瀏覽器會錄製一段短麥克風片段並傳送到 Gateway，由 Gateway 執行設定的 `tools.media.audio` 轉錄管線，並在不向瀏覽器暴露供應商憑證的情況下傳回草稿文字。
    - 透過瀏覽器即時工作階段進行語音交談。OpenAI 使用直接 WebRTC，Google Live 透過 WebSocket 使用受限的一次性瀏覽器權杖，而僅後端即時語音 Plugin 使用 Gateway 轉送傳輸。轉送會將供應商憑證保留在 Gateway 上，同時瀏覽器透過 `talk.realtime.relay*` RPC 串流麥克風 PCM，並透過 `chat.send` 將 `openclaw_agent_consult` 工具呼叫送回較大的已設定 OpenClaw 模型。
    - 在 Chat 中串流工具呼叫與即時工具輸出卡片（代理事件）。

  </Accordion>
  <Accordion title="頻道、執行個體、工作階段、dreams">
    - 頻道：內建加上已綁定/外部 Plugin 頻道狀態、QR 登入，以及每個頻道設定（`channels.status`、`web.login.*`、`config.patch`）。
    - 執行個體：存在清單與重新整理（`system-presence`）。
    - 工作階段：清單與每個工作階段的模型/thinking/fast/verbose/trace/reasoning 覆寫（`sessions.list`、`sessions.patch`）。
    - Dreams：dreaming 狀態、啟用/停用切換，以及 Dream Diary 閱讀器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、節點、exec 核准">
    - Cron 工作：列出/新增/編輯/執行/啟用/停用與執行歷史記錄（`cron.*`）。
    - Skills：狀態、啟用/停用、安裝、API 金鑰更新（`skills.*`）。
    - 節點：清單與能力（`node.list`）。
    - Exec 核准：編輯 Gateway 或節點允許清單，以及 `exec host=gateway/node` 的詢問政策（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="設定">
    - 檢視/編輯 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - 套用並以驗證重新啟動（`config.apply`），並喚醒最後一個作用中的工作階段。
    - 寫入包含 base-hash 防護，以防止覆蓋並行編輯。
    - 寫入（`config.set`/`config.apply`/`config.patch`）會針對已提交設定酬載中的 refs 預先檢查作用中 SecretRef 解析；未解析的作用中已提交 refs 會在寫入前遭拒。
    - Schema 與表單呈現（`config.schema` / `config.schema.lookup`，包括欄位 `title` / `description`、相符的 UI 提示、直接子項摘要、巢狀物件/萬用字元/陣列/組合節點上的文件中繼資料，以及可用時的 Plugin 與頻道 schema）；只有當快照具有安全的原始往返時，Raw JSON 編輯器才可用。
    - 如果快照無法安全地往返原始文字，控制 UI 會強制使用表單模式，並停用該快照的原始模式。
    - Raw JSON 編輯器的「Reset to saved」會保留原始撰寫的形狀（格式、註解、`$include` 版面），而不是重新呈現扁平化快照，因此當快照可以安全往返時，外部編輯會在重設後保留下來。
    - 結構化 SecretRef 物件值會在表單文字輸入中以唯讀方式呈現，以防止意外的物件到字串毀損。

  </Accordion>
  <Accordion title="偵錯、記錄、更新">
    - 偵錯：狀態/健康情況/模型快照、事件記錄，以及手動 RPC 呼叫（`status`、`health`、`models.list`）。
    - 記錄：Gateway 檔案記錄的即時尾端追蹤，包含篩選/匯出（`logs.tail`）。
    - 更新：執行套件/git 更新並重新啟動（`update.run`），附帶重新啟動報告，然後在重新連線後輪詢 `update.status` 以驗證執行中的 Gateway 版本。

  </Accordion>
  <Accordion title="Cron 工作面板注意事項">
    - 對於隔離工作，傳遞預設為宣布摘要。如果你想要僅限內部執行，可以切換為無。
    - 選取宣布時，會出現頻道/目標欄位。
    - Webhook 模式使用 `delivery.mode = "webhook"`，並將 `delivery.to` 設為有效的 HTTP(S) Webhook URL。
    - 對於主工作階段工作，Webhook 和無傳遞模式可用。
    - 進階編輯控制項包含執行後刪除、清除代理覆寫、Cron exact/stagger 選項、代理模型/thinking 覆寫，以及盡力傳遞切換。
    - 表單驗證會以欄位層級錯誤內嵌顯示；無效值會停用儲存按鈕，直到修正為止。
    - 設定 `cron.webhookToken` 以傳送專用 bearer 權杖；如果省略，Webhook 會在沒有驗證標頭的情況下送出。
    - 已棄用的備援：具有 `notify: true` 的已儲存舊工作仍可使用 `cron.webhook`，直到遷移為止。

  </Accordion>
</AccordionGroup>

## 聊天行為

<AccordionGroup>
  <Accordion title="傳送與歷史記錄語義">
    - `chat.send` 是**非阻塞**的：它會立即以 `{ runId, status: "started" }` 確認，回應則透過 `chat` 事件串流傳送。
    - `chat.transcribeAudio` 是用於 Chat 草稿的一次性聽寫輔助工具。它接受瀏覽器錄製的 base64 音訊，將上傳內容維持在 Gateway WebSocket 影格限制以下，寫入暫存本機檔案，以作用中的 Gateway 設定執行媒體理解音訊轉錄，回傳 `{ text, provider, model }`，並移除暫存檔案。它不會建立 agent run，且與即時 Talk 分開。
    - Chat 上傳接受圖片及非影片檔案。圖片會保留原生圖片路徑；其他檔案會儲存為受管理媒體，並在歷史記錄中顯示為附件連結。
    - 使用相同的 `idempotencyKey` 重新傳送時，執行中會回傳 `{ status: "in_flight" }`，完成後會回傳 `{ status: "ok" }`。
    - 為了 UI 安全，`chat.history` 回應有大小限制。當逐字稿項目過大時，Gateway 可能會截斷長文字欄位、省略龐大的中繼資料區塊，並以預留位置（`[chat.history omitted: message too large]`）取代過大的訊息。
    - Assistant/產生的圖片會保存為受管理媒體參照，並透過已驗證的 Gateway 媒體 URL 回傳，因此重新載入不依賴原始 base64 圖片酬載保留在聊天歷史記錄回應中。
    - `chat.history` 也會從可見的 assistant 文字中移除僅供顯示的行內指示標籤（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、純文字工具呼叫 XML 酬載（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及截斷的工具呼叫區塊），以及外洩的 ASCII/全形模型控制權杖，並省略整段可見文字只等於精確靜默權杖 `NO_REPLY` / `no_reply` 的 assistant 項目。
    - 在作用中的傳送期間以及最終歷史記錄重新整理時，如果 `chat.history` 短暫回傳較舊的快照，聊天檢視會讓本機樂觀使用者/assistant 訊息保持可見；等 Gateway 歷史記錄追上後，正式逐字稿會取代那些本機訊息。
    - `chat.inject` 會將 assistant 備註附加到工作階段逐字稿，並廣播 `chat` 事件以供僅限 UI 的更新使用（沒有 agent run，沒有通道傳遞）。
    - 聊天標頭的模型與思考選擇器會透過 `sessions.patch` 立即修補作用中工作階段；它們是持久的工作階段覆寫，不是僅限單輪的傳送選項。
    - 在 Control UI 中輸入 `/new` 會建立並切換到與 New Chat 相同的全新儀表板工作階段。輸入 `/reset` 會保留 Gateway 對目前工作階段的明確就地重設。
    - 聊天模型選擇器會請求 Gateway 設定的模型檢視。如果存在 `agents.defaults.models`，該 allowlist 會驅動選擇器。否則，選擇器會顯示明確的 `models.providers.*.models` 項目，以及具有可用驗證的 provider。完整目錄仍可透過偵錯用 `models.list` RPC 搭配 `view: "all"` 取得。
    - 當新的 Gateway 工作階段用量報告顯示高脈絡壓力時，聊天撰寫區會顯示脈絡通知；在建議的 Compaction 層級，會顯示一個 compact 按鈕，以執行一般的工作階段 Compaction 路徑。過時的 token 快照會被隱藏，直到 Gateway 再次回報新的用量。

  </Accordion>
  <Accordion title="Talk 模式（瀏覽器即時）">
    Talk 模式使用已註冊的即時語音 provider。使用 `talk.provider: "openai"` 加上 `talk.providers.openai.apiKey` 設定 OpenAI，或使用 `talk.provider: "google"` 加上 `talk.providers.google.apiKey` 設定 Google；Voice Call 即時 provider 設定仍可作為後援重複使用。瀏覽器永遠不會收到標準 provider API key。OpenAI 會收到用於 WebRTC 的臨時 Realtime 用戶端密鑰。Google Live 會收到用於瀏覽器 WebSocket 工作階段的一次性受限 Live API 驗證 token，且指令與工具宣告會由 Gateway 鎖定在該 token 中。僅公開後端即時橋接的 provider 會透過 Gateway relay transport 執行，因此憑證和 vendor socket 會留在伺服器端，而瀏覽器音訊則透過已驗證的 Gateway RPC 傳輸。Realtime 工作階段提示由 Gateway 組裝；`talk.realtime.session` 不接受呼叫端提供的指令覆寫。

    在 Chat 撰寫器中，Talk 控制項是麥克風聽寫按鈕旁的波紋按鈕。Talk 啟動時，撰寫器狀態列會顯示 `Connecting Talk...`，音訊連線後顯示 `Talk live`，或在即時工具呼叫正透過 `chat.send` 諮詢已設定的較大型模型時顯示 `Asking OpenClaw...`。

    維護者即時煙霧測試：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 會驗證 OpenAI 瀏覽器 WebRTC SDP 交換、Google Live 受限 token 瀏覽器 WebSocket 設定，以及使用假麥克風媒體的 Gateway relay 瀏覽器配接器。該命令只列印 provider 狀態，不會記錄秘密。

  </Accordion>
  <Accordion title="停止與中止">
    - 按一下 **Stop**（呼叫 `chat.abort`）。
    - 執行中有作用中的 run 時，一般後續訊息會排入佇列。按一下佇列訊息上的 **Steer**，可將該後續訊息注入正在執行的回合。
    - 輸入 `/stop`（或獨立的中止片語，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以帶外中止。
    - `chat.abort` 支援 `{ sessionKey }`（無 `runId`）以中止該工作階段的所有作用中 run。

  </Accordion>
  <Accordion title="中止部分保留">
    - 當 run 被中止時，部分 assistant 文字仍可顯示在 UI 中。
    - 當存在已緩衝的輸出時，Gateway 會將中止的部分 assistant 文字保存到逐字稿歷史記錄。
    - 保存的項目包含中止中繼資料，讓逐字稿消費者可分辨中止部分與正常完成輸出。

  </Accordion>
</AccordionGroup>

## PWA 安裝與 Web Push

Control UI 隨附 `manifest.webmanifest` 和 service worker，因此現代瀏覽器可以將它安裝為獨立 PWA。即使分頁或瀏覽器視窗未開啟，Web Push 也能讓 Gateway 透過通知喚醒已安裝的 PWA。

| 表面                                                  | 功能                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest。瀏覽器在可到達後會提供「Install app」。              |
| `ui/public/sw.js`                                     | 處理 `push` 事件和通知點擊的 service worker。                      |
| `push/vapid-keys.json`（位於 OpenClaw state dir 下）  | 自動產生的 VAPID keypair，用於簽署 Web Push 酬載。                 |
| `push/web-push-subscriptions.json`                    | 保存的瀏覽器訂閱端點。                                             |

當你想固定金鑰時（用於多主機部署、秘密輪替或測試），可在 Gateway 程序上透過 env vars 覆寫 VAPID keypair：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（預設為 `mailto:openclaw@localhost`）

Control UI 使用這些受 scope 限制的 Gateway 方法來註冊和測試瀏覽器訂閱：

- `push.web.vapidPublicKey` — 擷取作用中的 VAPID public key。
- `push.web.subscribe` — 註冊 `endpoint` 以及 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 移除已註冊的 endpoint。
- `push.web.test` — 將測試通知傳送到呼叫者的訂閱。

<Note>
Web Push 獨立於 iOS APNS relay 路徑（請參閱 [設定](/zh-TW/gateway/configuration) 了解 relay 支援的 push）以及現有的 `push.test` 方法，後者目標是原生行動裝置配對。
</Note>

## 託管嵌入

Assistant 訊息可使用 `[embed ...]` shortcode 行內呈現託管網頁內容。iframe sandbox 政策由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    停用託管嵌入中的 script 執行。
  </Tab>
  <Tab title="scripts（預設）">
    允許互動式嵌入，同時保持來源隔離；這是預設值，通常足以支援自含式瀏覽器遊戲/widgets。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 之上加入 `allow-same-origin`，用於有意需要更強權限的 same-site 文件。
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
只有在嵌入文件確實需要 same-origin 行為時才使用 `trusted`。對大多數 agent 產生的遊戲和互動畫布而言，`scripts` 是較安全的選擇。
</Warning>

預設會封鎖絕對外部 `http(s)` 嵌入 URL。如果你有意讓 `[embed url="https://..."]` 載入第三方頁面，請設定 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天訊息寬度

分組聊天訊息使用易讀的預設 max-width。寬螢幕部署可透過設定 `gateway.controlUi.chatMessageMaxWidth` 覆寫，而不必修補隨附的 CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

該值在到達瀏覽器前會先經過驗證。支援的值包括純長度和百分比，例如 `960px` 或 `82%`，以及受限制的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 寬度運算式。

## Tailnet 存取（建議）

<Tabs>
  <Tab title="整合式 Tailscale Serve（偏好）">
    將 Gateway 保持在 loopback，並讓 Tailscale Serve 以 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    開啟：

    - `https://<magicdns>/`（或你設定的 `gateway.controlUi.basePath`）

    預設情況下，當 `gateway.auth.allowTailscale` 為 `true` 時，Control UI/WebSocket Serve 請求可透過 Tailscale 身分標頭（`tailscale-user-login`）驗證。OpenClaw 會透過 `tailscale whois` 解析 `x-forwarded-for` 位址並與標頭比對來驗證身分，且僅在請求命中 loopback 並帶有 Tailscale 的 `x-forwarded-*` 標頭時接受這些請求。對具有瀏覽器裝置身分的 Control UI operator 工作階段，此已驗證的 Serve 路徑也會略過裝置配對往返；無裝置瀏覽器和 node-role 連線仍會遵循一般裝置檢查。如果你想即使是 Serve 流量也要求明確的 shared-secret 憑證，請設定 `gateway.auth.allowTailscale: false`。接著使用 `gateway.auth.mode: "token"` 或 `"password"`。

    對於該 async Serve 身分路徑，來自相同用戶端 IP 和 auth scope 的驗證失敗嘗試會在 rate-limit 寫入前被序列化。因此，來自同一瀏覽器的並行錯誤重試可能會在第二個請求顯示 `retry later`，而不是兩個單純不相符並行競爭。

    <Warning>
    無 token 的 Serve auth 假設 gateway 主機受信任。如果不受信任的本機程式碼可能在該主機上執行，請要求 token/password auth。
    </Warning>

  </Tab>
  <Tab title="繫結到 tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    然後開啟：

    - `http://<tailscale-ip>:18789/`（或你設定的 `gateway.controlUi.basePath`）

    將相符的 shared secret 貼到 UI 設定中（以 `connect.params.auth.token` 或 `connect.params.auth.password` 傳送）。

  </Tab>
</Tabs>

## 不安全的 HTTP

如果你透過純 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）開啟儀表板，瀏覽器會在**非安全脈絡**中執行並封鎖 WebCrypto。預設情況下，OpenClaw 會**封鎖**沒有裝置身分的 Control UI 連線。

已記錄的例外：

- 僅限 localhost 的不安全 HTTP 相容性，搭配 `gateway.controlUi.allowInsecureAuth=true`
- 透過 `gateway.auth.mode: "trusted-proxy"` 成功完成操作員控制 UI 驗證
- 緊急避險 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**建議修正：**使用 HTTPS（Tailscale Serve），或在本機開啟 UI：

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

    - 它允許 localhost 控制 UI 工作階段在非安全 HTTP 情境中不需裝置身分即可繼續。
    - 它不會略過配對檢查。
    - 它不會放寬遠端（非 localhost）裝置身分要求。

  </Accordion>
  <Accordion title="僅供緊急避險">
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
  <Accordion title="trusted-proxy 注意事項">
    - 成功的 trusted-proxy 驗證可以允許**操作員**控制 UI 工作階段不需裝置身分即可進入。
    - 這**不會**延伸到 node-role 控制 UI 工作階段。
    - 同一主機的 loopback 反向代理仍無法滿足 trusted-proxy 驗證；請參閱 [trusted-proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

請參閱 [Tailscale](/zh-TW/gateway/tailscale) 取得 HTTPS 設定指引。

## 內容安全政策

控制 UI 內建嚴格的 `img-src` 政策：只允許**同源**資產、`data:` URL，以及本機產生的 `blob:` URL。遠端 `http(s)` 與協定相對圖片 URL 會被瀏覽器拒絕，且不會發出網路擷取。

實務上的意思是：

- 透過相對路徑提供的頭像與圖片（例如 `/avatars/<id>`）仍會呈現，包括 UI 擷取並轉換成本機 `blob:` URL 的已驗證頭像路由。
- 行內 `data:image/...` URL 仍會呈現（對協定內酬載很有用）。
- 控制 UI 建立的本機 `blob:` URL 仍會呈現。
- 頻道中繼資料輸出的遠端頭像 URL 會在控制 UI 的頭像輔助程式中被移除，並替換成內建 logo/badge，因此遭入侵或惡意的頻道無法強制操作員瀏覽器擷取任意遠端圖片。

你不需要變更任何設定即可取得此行為，它永遠啟用且不可設定。

## 頭像路由驗證

設定 Gateway 驗證時，控制 UI 頭像端點需要與 API 其餘部分相同的 Gateway token：

- `GET /avatar/<agentId>` 只會向已驗證呼叫端回傳頭像圖片。`GET /avatar/<agentId>?meta=1` 會依照相同規則回傳頭像中繼資料。
- 對任一路由的未驗證請求都會被拒絕（與相鄰的 assistant-media 路由一致）。這可防止頭像路由在其他部分受保護的主機上洩漏 agent 身分。
- 控制 UI 本身在擷取頭像時會將 Gateway token 作為 bearer header 轉送，並使用已驗證的 blob URL，讓圖片仍可在儀表板中呈現。

如果停用 Gateway 驗證（不建議在共用主機上這麼做），頭像路由也會變成未驗證，與 Gateway 其餘部分一致。

## 建置 UI

Gateway 會從 `dist/control-ui` 提供靜態檔案。請使用以下指令建置：

```bash
pnpm ui:build
```

選用的絕對 base（當你想要固定資產 URL 時）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

本機開發（獨立開發伺服器）：

```bash
pnpm ui:dev
```

接著將 UI 指向你的 Gateway WS URL（例如 `ws://127.0.0.1:18789`）。

## 除錯／測試：開發伺服器 + 遠端 Gateway

控制 UI 是靜態檔案；WebSocket 目標可設定，且可與 HTTP origin 不同。當你想在本機使用 Vite 開發伺服器，但 Gateway 在其他地方執行時，這很方便。

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
    - 盡可能透過 URL fragment（`#token=...`）傳遞 `token`。Fragments 不會傳送到伺服器，可避免請求記錄與 Referer 洩漏。舊版 `?token=` 查詢參數仍會為了相容性匯入一次，但只作為備援，並會在啟動後立即移除。
    - `password` 只會保留在記憶體中。
    - 設定 `gatewayUrl` 時，UI 不會回退到設定或環境憑證。請明確提供 `token`（或 `password`）。缺少明確憑證是錯誤。
    - 當 Gateway 位於 TLS 後方時（Tailscale Serve、HTTPS proxy 等），請使用 `wss://`。
    - `gatewayUrl` 只會在頂層視窗中接受（不可嵌入），以防止 clickjacking。
    - 非 loopback 的控制 UI 部署必須明確設定 `gateway.controlUi.allowedOrigins`（完整 origins）。這包含遠端開發設定。
    - Gateway 啟動時可能會依據有效的執行階段 bind 與 port，植入 `http://localhost:<port>` 和 `http://127.0.0.1:<port>` 等本機 origins，但遠端瀏覽器 origins 仍需要明確項目。
    - 除非是嚴格受控的本機測試，否則不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允許任何瀏覽器 origin，而不是「符合我正在使用的任何主機」。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 會啟用 Host-header origin fallback 模式，但這是危險的安全模式。

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
- [健康檢查](/zh-TW/gateway/health) — Gateway 健康監控
- [TUI](/zh-TW/web/tui) — 終端使用者介面
- [WebChat](/zh-TW/web/webchat) — 瀏覽器式聊天介面
