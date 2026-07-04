---
read_when:
    - 您想透過瀏覽器操作閘道
    - 你想要不透過 SSH 通道存取 Tailnet
sidebarTitle: Control UI
summary: 閘道的瀏覽器型控制介面（聊天、活動、節點、設定）
title: Control UI
x-i18n:
    generated_at: "2026-07-04T17:49:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00575a4633b192b6121145476c3b15b6b68cfd177322f409cacbb7ef331d09d
    source_path: web/control-ui.md
    workflow: 16
---

控制 UI 是由閘道提供服務的小型 **Vite + Lit** 單頁應用程式：

- 預設：`http://<host>:18789/`
- 選用前綴：設定 `gateway.controlUi.basePath`（例如 `/openclaw`）

它會在同一個連接埠上**直接與閘道 WebSocket** 通訊。

## 快速開啟（本機）

如果閘道正在同一台電腦上執行，請開啟：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果頁面載入失敗，請先啟動閘道：`openclaw gateway`。

<Note>
在原生 Windows LAN 綁定上，即使 `127.0.0.1` 可在閘道主機上運作，Windows 防火牆或組織管理的群組原則仍可能封鎖公告的 LAN URL。請在 Windows 主機上執行 `openclaw gateway status --deep`；它會回報可能遭封鎖的連接埠、設定檔不相符，以及原則可能忽略的本機防火牆規則。
</Note>

驗證會在 WebSocket 握手期間透過下列方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 當 `gateway.auth.allowTailscale: true` 時使用 Tailscale Serve 身分標頭
- 當 `gateway.auth.mode: "trusted-proxy"` 時使用受信任 Proxy 身分標頭

儀表板設定面板會為目前瀏覽器分頁工作階段與選取的閘道 URL 保留權杖；密碼不會持久保存。首次連線時，初始設定通常會產生閘道權杖以用於共享密鑰驗證，但當 `gateway.auth.mode` 為 `"password"` 時，也可以使用密碼驗證。

## 裝置配對（首次連線）

當你從新的瀏覽器或裝置連線到控制 UI 時，閘道通常需要**一次性配對核准**。這是一項防止未授權存取的安全措施。

**你會看到的內容：**「已中斷連線 (1008)：需要配對」

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

如果瀏覽器以變更後的驗證詳細資料（角色/範圍/公開金鑰）重試配對，先前待處理的請求會被取代，並建立新的 `requestId`。核准前請重新執行 `openclaw devices list`。

如果瀏覽器已完成配對，而你將其從讀取存取改為寫入/管理員存取，這會被視為核准升級，而不是靜默重新連線。OpenClaw 會保留舊核准有效、封鎖較廣範圍的重新連線，並要求你明確核准新的範圍集合。

核准後，裝置會被記住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤銷，否則不需要重新核准。請參閱[裝置命令列介面](/zh-TW/cli/devices)了解權杖輪替與撤銷。

透過 `openclaw_gateway` 配接器連線的 Paperclip 代理會使用相同的首次執行核准流程。初始連線嘗試後，執行 `openclaw devices approve --latest` 以預覽待處理請求，然後重新執行列印出的 `openclaw devices approve <requestId>` 命令來核准。若使用遠端閘道，請傳入明確的 `--url` 與 `--token` 值。若要讓核准在重新啟動後保持穩定，請在 Paperclip 中設定持久的 `adapterConfig.devicePrivateKeyPem`，而不是讓它在每次執行時產生新的暫時裝置身分。

<Note>
- 直接的 local loopback 瀏覽器連線（`127.0.0.1` / `localhost`）會自動核准。
- 當 `gateway.auth.allowTailscale: true`、Tailscale 身分驗證通過，且瀏覽器提供其裝置身分時，Tailscale Serve 可以為控制 UI 操作者工作階段略過配對往返。
- 直接 Tailnet 綁定、LAN 瀏覽器連線，以及沒有裝置身分的瀏覽器設定檔仍需要明確核准。
- 每個瀏覽器設定檔都會產生唯一的裝置 ID，因此切換瀏覽器或清除瀏覽器資料都需要重新配對。

</Note>

## 配對行動裝置

已配對的管理員可以建立 iOS/Android 連線 QR，而不需要
開啟終端機：

<Steps>
  <Step title="開啟行動裝置配對">
    選取**節點**，然後在**裝置**卡片中按一下**配對行動裝置**。
  </Step>
  <Step title="連線手機">
    在 OpenClaw 行動應用程式中，開啟**設定** → **閘道**並掃描 QR
    碼。你也可以改為複製並貼上設定碼。
  </Step>
  <Step title="確認連線">
    官方 iOS/Android 應用程式會自動連線。如果**裝置**顯示
    待處理請求，請先檢閱其角色與範圍，再核准。
  </Step>
</Steps>

建立設定碼需要 `operator.admin`；沒有該權限的
工作階段會停用此按鈕。設定碼包含短效啟動憑證，
因此在有效期間，請將 QR 與複製的碼視同密碼處理。若要遠端
配對，閘道必須解析為 `wss://`（例如透過 Tailscale
Serve/Funnel）；純 `ws://` 僅限於 loopback 和私人 LAN 位址。
請參閱[配對](/zh-TW/channels/pairing#pair-from-the-control-ui-recommended)了解
完整安全性與備援細節。

## 個人身分（瀏覽器本機）

控制 UI 支援每個瀏覽器的個人身分（顯示名稱與頭像），並將其附加到外送訊息，以便在共享工作階段中歸屬來源。它存在於瀏覽器儲存空間中，範圍限定於目前瀏覽器設定檔，不會同步到其他裝置，也不會在伺服器端持久保存，除了你實際傳送的訊息上正常的逐字稿作者中繼資料。清除網站資料或切換瀏覽器會將其重設為空白。

同樣的瀏覽器本機模式也適用於助理頭像覆寫。上傳的助理頭像只會在本機瀏覽器上覆蓋閘道解析出的身分，且絕不會透過 `config.patch` 往返傳送。共享的 `ui.assistant.avatar` 設定欄位仍可供直接寫入該欄位的非 UI 用戶端使用（例如腳本化閘道或自訂儀表板）。

## 執行階段設定端點

控制 UI 會從 `/control-ui-config.json` 擷取其執行階段設定，並相對於閘道的控制 UI 基底路徑解析（例如當 UI 由 `/__openclaw__/` 提供服務時，為 `/__openclaw__/control-ui-config.json`）。該端點受到與其餘 HTTP 介面相同的閘道驗證保護：未驗證的瀏覽器無法擷取它，而成功擷取需要已有效的閘道權杖/密碼、Tailscale Serve 身分，或受信任 Proxy 身分。

## 語言支援

控制 UI 可以在首次載入時根據你的瀏覽器語言環境進行本地化。若要稍後覆寫，請開啟**概觀 -> 閘道存取 -> 語言**。語言環境選擇器位於閘道存取卡片中，而不是外觀底下。

- 支援的語言環境：`en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 非英文翻譯會在瀏覽器中延遲載入。
- 選取的語言環境會儲存在瀏覽器儲存空間中，並在未來造訪時重複使用。
- 缺少的翻譯鍵會退回英文。

文件翻譯會針對同一組非英文語言環境產生，但文件網站內建的 Mintlify 語言選擇器受限於 Mintlify 接受的語言環境代碼。泰文（`th`）與波斯文（`fa`）文件仍會在發布儲存庫中產生；在 Mintlify 支援這些代碼之前，它們可能不會出現在該選擇器中。

## 外觀主題

外觀面板保留內建的 Claw、Knot 與 Dash 主題，另有一個瀏覽器本機的 tweakcn 匯入槽。若要匯入主題，請開啟 [tweakcn 編輯器](https://tweakcn.com/editor/theme)、選擇或建立主題、按一下**分享**，並將複製的主題連結貼到外觀中。匯入器也接受 `https://tweakcn.com/r/themes/<id>` 登錄 URL、像 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 這類編輯器 URL、相對 `/themes/<id>` 路徑、原始主題 ID，以及像 `amethyst-haze` 這類預設主題名稱。

外觀也包含瀏覽器本機的文字大小設定。該設定會與其餘控制 UI 偏好設定一起儲存，套用於聊天文字、撰寫器文字、工具卡片與聊天側邊欄，並讓文字輸入至少保持 16px，避免行動版 Safari 在聚焦時自動縮放。

匯入的主題只會儲存在目前瀏覽器設定檔中。它們不會寫入閘道設定，也不會跨裝置同步。替換匯入的主題會更新單一本機槽；若選取的是匯入主題，清除它會將作用中主題切回 Claw。

## 它能做什麼（目前）

<AccordionGroup>
  <Accordion title="聊天與語音交談">
    - 透過閘道 WS 與模型聊天（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）。
    - 聊天記錄重新整理會要求有限的近期視窗，並套用每則訊息文字上限，因此大型工作階段不會在聊天可用前迫使瀏覽器渲染完整逐字稿酬載。
    - 透過瀏覽器即時工作階段進行語音交談。OpenAI 使用直接 WebRTC，Google Live 透過 WebSocket 使用受限的一次性瀏覽器權杖，而僅後端的即時語音外掛使用閘道轉送傳輸。由用戶端擁有的供應商工作階段以 `talk.client.create` 開始；閘道轉送工作階段以 `talk.session.create` 開始。轉送會將供應商憑證保留在閘道上，同時瀏覽器透過 `talk.session.appendAudio` 串流麥克風 PCM，透過 `talk.client.toolCall` 轉送 `openclaw_agent_consult` 供應商工具呼叫，以套用閘道政策與較大的已設定 OpenClaw 模型，並透過 `talk.client.steer` 或 `talk.session.steer` 路由作用中執行的語音引導。
    - 在聊天中串流工具呼叫與即時工具輸出卡片（代理事件）。
    - 活動分頁會以瀏覽器本機、優先遮蔽敏感資訊的摘要呈現來自既有 `session.tool` / 工具事件傳遞的即時工具活動。

  </Accordion>
  <Accordion title="頻道、執行個體、工作階段、夢境">
    - 頻道：內建加上隨附/外部外掛頻道狀態、QR 登入，以及各頻道設定（`channels.status`, `web.login.*`, `config.patch`）。
    - 頻道探測重新整理會在緩慢的供應商檢查完成前保持顯示先前快照，而當探測或稽核超過其 UI 預算時，會標記部分快照。
    - 執行個體：存在清單與重新整理（`system-presence`）。
    - 工作階段：預設列出已設定代理工作階段，從過期的未設定代理工作階段鍵退回，並套用每個工作階段的模型/思考/快速/詳細/追蹤/推理覆寫（`sessions.list`, `sessions.patch`）。
    - 夢境：夢境整理狀態、啟用/停用切換，以及夢境日記閱讀器（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）。

  </Accordion>
  <Accordion title="排程、Skills、節點、執行核准">
    - 排程工作：列出/新增/編輯/執行/啟用/停用 + 執行記錄（`cron.*`）。
    - Skills：狀態、啟用/停用、安裝、API 金鑰更新（`skills.*`）。
    - 節點：清單 + 能力（`node.list`）、建立行動裝置設定碼，以及核准裝置配對（`device.pair.*`）。
    - 執行核准：編輯閘道或節點允許清單 + `exec host=gateway/node` 的詢問政策（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="設定">
    - 檢視/編輯 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - MCP 有專用設定頁面，可用於已設定的伺服器、啟用狀態、OAuth/篩選器/並行摘要、常見操作員命令，以及限定範圍的 `mcp` 設定編輯器。
    - 透過驗證套用並重新啟動（`config.apply`），並喚醒最後一個作用中工作階段。
    - 寫入包含 base-hash 防護，以避免覆寫並行編輯。
    - 寫入（`config.set`/`config.apply`/`config.patch`）會對提交的設定 payload 中的 refs 預先檢查作用中 SecretRef 解析；未解析的作用中提交 refs 會在寫入前被拒絕。
    - 表單儲存會捨棄無法從已儲存設定還原的過期已遮蔽 placeholder，同時保留仍能對應到已儲存 secrets 的已遮蔽值。
    - Schema + 表單渲染（`config.schema` / `config.schema.lookup`，包括欄位 `title` / `description`、相符的 UI 提示、直接子項摘要、巢狀物件/萬用字元/陣列/組合節點上的文件中繼資料，以及可用時的外掛 + 頻道 schema）；Raw JSON 編輯器僅在快照具備安全原始往返時可用。
    - 如果快照無法安全往返原始文字，Control UI 會強制使用表單模式，並停用該快照的原始模式。
    - Raw JSON 編輯器的「重設為已儲存」會保留原始撰寫的形狀（格式、註解、`$include` 版面），而不是重新渲染扁平化快照，因此當快照可安全往返時，外部編輯會在重設後保留下來。
    - 結構化 SecretRef 物件值會在表單文字輸入中以唯讀方式渲染，以防止意外的物件轉字串損壞。

  </Accordion>
  <Accordion title="偵錯、記錄、更新">
    - 偵錯：status/health/models 快照 + 事件記錄 + 手動 RPC 呼叫（`status`、`health`、`models.list`）。
    - 事件記錄包含 Control UI 重新整理/RPC 計時、緩慢 chat/config 渲染計時，以及當瀏覽器公開這些 PerformanceObserver entry 類型時，長動畫影格或長任務的瀏覽器回應性項目。
    - 記錄：即時追蹤 Gateway 檔案記錄，並支援篩選/匯出（`logs.tail`）。
    - 更新：執行 package/git 更新 + 重新啟動（`update.run`）並附重新啟動報告，然後在重新連線後輪詢 `update.status`，以驗證正在執行的 Gateway 版本。

  </Accordion>
  <Accordion title="排程工作面板備註">
    - 對於隔離工作，傳遞預設為公告摘要。如果你想要僅限內部執行，可以切換為 none。
    - 選取公告時會顯示頻道/目標欄位。
    - 網路鉤子模式使用 `delivery.mode = "webhook"`，並將 `delivery.to` 設為有效的 HTTP(S) webhook URL。
    - 對於主工作階段工作，可使用 webhook 和 none 傳遞模式。
    - 進階編輯控制項包括執行後刪除、清除 agent 覆寫、cron 精確/錯開選項、agent 模型/thinking 覆寫，以及 best-effort 傳遞切換。
    - 表單驗證會以欄位層級錯誤內嵌顯示；無效值會停用儲存按鈕，直到修正為止。
    - 設定 `cron.webhookToken` 可傳送專用 bearer token；若省略，webhook 會在沒有 auth header 的情況下傳送。
    - 已棄用的 fallback：執行 `openclaw doctor --fix`，將儲存的舊版工作中含有 `notify: true` 的項目，從 `cron.webhook` 遷移為明確的個別工作 webhook 或完成傳遞。

  </Accordion>
</AccordionGroup>

## MCP 頁面

專用 MCP 頁面是 `mcp.servers` 下由 OpenClaw 管理的 MCP 伺服器操作員檢視。它本身不會啟動 MCP transports；請用它檢查並編輯已儲存設定，然後在需要即時伺服器證明時使用 `openclaw mcp doctor --probe`。

典型工作流程：

1. 從側邊欄開啟 **MCP**。
2. 檢查摘要卡片中的總數、已啟用、OAuth 和已篩選伺服器數量。
3. 檢閱每個伺服器列的 transport、啟用狀態、auth、篩選器、逾時和命令提示。
4. 當伺服器應保留設定但不納入執行階段探索時，切換啟用狀態。
5. 編輯限定範圍的 `mcp` 設定區段，用於伺服器定義、headers、TLS/mTLS paths、OAuth metadata、tool filters 和 Codex projection metadata。
6. 使用 **儲存** 進行設定寫入，或在執行中的 Gateway 應套用變更後設定時使用 **儲存並發布**。
7. 當已編輯程序需要靜態診斷、即時證明或快取執行階段處置時，從終端機執行 `openclaw mcp status --verbose`、`openclaw mcp doctor --probe` 或 `openclaw mcp reload`。

頁面會在渲染前遮蔽帶有憑證的類 URL 值，並在命令片段中引用伺服器名稱，因此複製的命令仍可處理空格或 shell metacharacters。完整的命令列介面與設定參考位於 [MCP](/zh-TW/cli/mcp)。

## 活動分頁

活動分頁是瀏覽器本機的暫時性即時工具活動觀察器。它衍生自同一個 Gateway `session.tool` / tool event stream，也就是驅動 Chat 工具卡片的串流；它不會新增另一個 Gateway 事件家族、endpoint、持久活動儲存、metrics feed 或外部觀察者串流。

活動項目只保留已清理摘要，以及已遮蔽、截斷的輸出預覽。工具引數值不會儲存在活動狀態中；UI 會顯示引數已隱藏，且只記錄引數欄位數量。記憶體中的清單會跟隨目前瀏覽器分頁，在 Control UI 內導覽時保留，並在頁面重新載入、工作階段切換或 **清除** 時重設。

## Chat 行為

<AccordionGroup>
  <Accordion title="傳送與歷史語意">
    - `chat.send` 是**非阻塞**的：它會立即以 `{ runId, status: "started" }` ACK，且回應會透過 `chat` 事件串流傳送。受信任的 Control UI 用戶端也可能會收到選用的 ACK 計時中繼資料，用於本機診斷。
    - Chat 上傳接受圖片以及非影片檔案。圖片會保留原生圖片路徑；其他檔案會儲存為受管理媒體，並在歷史中顯示為附件連結。
    - 使用相同的 `idempotencyKey` 重新傳送時，執行中會回傳 `{ status: "in_flight" }`，完成後會回傳 `{ status: "ok" }`。
    - `chat.history` 回應會限制大小以保障 UI 安全。當 transcript 項目過大時，Gateway 可能會截斷長文字欄位、省略大型中繼資料區塊，並以 placeholder（`[chat.history omitted: message too large]`）取代過大的訊息。
    - 當可見的 assistant 訊息在 `chat.history` 中被截斷時，側邊閱讀器可依需求透過 `chat.message.get`，使用 `sessionKey`、需要時的作用中 `agentId`，以及 transcript `messageId`，擷取完整的顯示正規化 transcript 項目。如果 Gateway 仍無法回傳更多內容，閱讀器會顯示明確的不可用狀態，而不是靜默重複截斷預覽。
    - Assistant/生成的圖片會作為受管理媒體參照持久化，並透過已驗證的 Gateway 媒體 URL 回傳，因此重新載入不依賴原始 base64 圖片 payload 持續存在於 chat history 回應中。
    - 渲染 `chat.history` 時，Control UI 會從可見的 assistant 文字中移除僅供顯示的 inline directive tags（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、純文字 tool-call XML payloads（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和截斷的 tool-call 區塊），以及洩漏的 ASCII/全形模型控制 tokens，並省略整個可見文字僅為精確靜默 token `NO_REPLY` / `no_reply` 或心跳偵測 acknowledgment token `HEARTBEAT_OK` 的 assistant 項目。
    - 在作用中傳送和最終歷史重新整理期間，如果 `chat.history` 短暫回傳較舊的快照，chat 檢視會保持本機樂觀 user/assistant 訊息可見；一旦 Gateway 歷史追上，canonical transcript 會取代那些本機訊息。
    - 即時 `chat` 事件是傳遞狀態，而 `chat.history` 會從持久 session transcript 重建。在 tool-final 事件之後，Control UI 會重新載入歷史，並只合併一小段樂觀尾端；transcript 邊界記錄於 [WebChat](/zh-TW/web/webchat)。
    - `chat.inject` 會將 assistant note 附加到 session transcript，並廣播 `chat` 事件，用於僅 UI 的更新（沒有 agent run，沒有 channel delivery）。
    - 側邊欄會列出最近的工作階段，並提供 New Session 動作、All Sessions 連結，以及開啟完整 session picker 的工作階段搜尋按鈕（依所選 agent 限定範圍，並提供搜尋和分頁）。切換 agents 時只會顯示與該 agent 綁定的工作階段；若該 agent 尚未有已儲存 dashboard sessions，則 fallback 到該 agent 的主工作階段。
    - 在桌面寬度下，chat 控制項會維持在一個精簡列上，並在向下捲動 transcript 時收合；向上捲動、回到頂端或到達底部時會還原控制項。
    - 連續重複的純文字訊息會渲染為一個 bubble，並附有 count badge。帶有圖片、附件、tool output 或 canvas previews 的訊息不會收合。
    - chat header 模型和 thinking picker 會透過 `sessions.patch` 立即 patch 作用中工作階段；它們是持久性 session overrides，而不是僅限單次傳送的選項。
    - 如果在同一工作階段的模型 picker 變更仍在儲存時傳送訊息，composer 會等待該 session patch 完成後才呼叫 `chat.send`，因此傳送會使用所選模型。
    - 在 Control UI 中輸入 `/new` 會建立並切換到與 New Chat 相同的全新 dashboard session，但若已設定 `session.dmScope: "main"` 且目前 parent 是 agent 的主工作階段，則會就地重設主工作階段。輸入 `/reset` 會保留 Gateway 針對目前工作階段的明確就地重設。
    - chat 模型 picker 會請求 Gateway 已設定的模型檢視。如果存在 `agents.defaults.models`，該 allowlist 會驅動 picker，包括會讓 provider-scoped catalogs 保持動態的 `provider/*` 項目。否則 picker 會顯示明確的 `models.providers.*.models` 項目，以及具備可用 auth 的 providers。完整 catalog 仍可透過 debug `models.list` RPC 搭配 `view: "all"` 取得。
    - 當新的 Gateway session usage reports 包含目前 context tokens 時，chat composer toolbar 會顯示一個小型 context usage ring，並標示使用百分比；完整 token detail 位於其 tooltip。該 ring 會在高 context 壓力下切換為 warning 樣式，並在建議的壓縮層級顯示一個 compact button，用於執行正常的 session compaction path。過期的 token snapshots 會隱藏，直到 Gateway 再次報告新的 usage。

  </Accordion>
  <Accordion title="Talk mode（瀏覽器 realtime）">
    Talk mode 使用已註冊的 realtime voice provider。使用 `talk.realtime.provider: "openai"` 搭配 `openai` API-key auth profile、`talk.realtime.providers.openai.apiKey` 或 `OPENAI_API_KEY` 來設定 OpenAI；OpenAI OAuth profiles 不會設定 Realtime voice。使用 `talk.realtime.provider: "google"` 搭配 `talk.realtime.providers.google.apiKey` 來設定 Google。瀏覽器絕不會收到標準 provider API key。OpenAI 會收到用於 WebRTC 的暫時性 Realtime client secret。Google Live 會收到一次性、受限制的 Live API auth token，用於瀏覽器 WebSocket session，且 instructions 與 tool declarations 由 Gateway 鎖定在 token 中。僅公開 backend realtime bridge 的 Providers 會透過 Gateway relay transport 執行，因此 credentials 和 vendor sockets 會留在伺服器端，而瀏覽器音訊會透過已驗證的 Gateway RPCs 移動。Realtime session prompt 由 Gateway 組裝；`talk.client.create` 不接受呼叫端提供的 instruction overrides。

    聊天撰寫器在語音對話開始/停止按鈕旁包含一個語音對話選項按鈕。這些選項會套用到下一個語音對話工作階段，並可覆寫供應商、傳輸、模型、語音、推理力度、VAD 閾值、靜音持續時間和前綴填補。當選項留空時，閘道會在可用時使用已設定的預設值，否則使用供應商預設值。選取閘道中繼會強制使用後端中繼路徑；選取 WebRTC 會讓工作階段維持由用戶端擁有，並在供應商無法建立瀏覽器工作階段時失敗，而不是默默退回到中繼。

    在聊天撰寫器中，語音對話控制項是麥克風聽寫按鈕旁的波形按鈕。語音對話開始時，撰寫器狀態列會顯示 `Connecting Talk...`，接著在音訊已連線時顯示 `Talk live`，或在即時工具呼叫透過 `talk.client.toolCall` 諮詢已設定的較大型模型時顯示 `Asking OpenClaw...`。

    維護者即時煙霧測試：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 會驗證 OpenAI 後端 WebSocket 橋接、OpenAI 瀏覽器 WebRTC SDP 交換、Google Live 受限權杖瀏覽器 WebSocket 設定，以及使用假麥克風媒體的閘道中繼瀏覽器配接器。此命令只會列印供應商狀態，不會記錄秘密。

  </Accordion>
  <Accordion title="停止並中止">
    - 按一下 **停止**（呼叫 `chat.abort`）。
    - 執行中有工作正在進行時，一般後續訊息會排入佇列。按一下佇列訊息上的 **引導**，可將該後續訊息注入正在執行的回合。
    - 輸入 `/stop`（或獨立的中止片語，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以頻外中止。
    - `chat.abort` 支援 `{ sessionKey }`（沒有 `runId`），可中止該工作階段的所有作用中執行。

  </Accordion>
  <Accordion title="中止部分內容保留">
    - 執行遭中止時，部分助理文字仍可顯示在 UI 中。
    - 當存在已緩衝輸出時，閘道會將中止的部分助理文字保存到逐字稿歷史中。
    - 已保存項目包含中止中繼資料，因此逐字稿消費者可以分辨中止部分內容與正常完成輸出。

  </Accordion>
</AccordionGroup>

## PWA 安裝與網頁推播

Control UI 隨附 `manifest.webmanifest` 和服務工作程式，因此現代瀏覽器可以將它安裝為獨立 PWA。網頁推播可讓閘道用通知喚醒已安裝的 PWA，即使分頁或瀏覽器視窗未開啟也一樣。

如果頁面在 OpenClaw 更新後立即顯示 **協定不相符**，請先用 `openclaw dashboard` 重新開啟儀表板並強制重新整理頁面。如果仍然失敗，請清除儀表板來源的網站資料，或在私人瀏覽器視窗中測試；舊分頁或瀏覽器服務工作程式快取可能會讓更新前的 Control UI 套件繼續針對較新的閘道執行。

| 介面                                                  | 功能                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 資訊清單。瀏覽器會在它可存取後提供「安裝應用程式」。           |
| `ui/public/sw.js`                                     | 處理 `push` 事件和通知點擊的服務工作程式。                         |
| `push/vapid-keys.json`（位於 OpenClaw 狀態目錄下）    | 自動產生的 VAPID 金鑰組，用於簽署網頁推播酬載。                   |
| `push/web-push-subscriptions.json`                    | 已保存的瀏覽器訂閱端點。                                           |

當你想固定金鑰（用於多主機部署、秘密輪替或測試）時，請透過閘道程序上的環境變數覆寫 VAPID 金鑰組：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（預設為 `https://openclaw.ai`）

Control UI 使用這些受作用域限制的閘道方法來註冊和測試瀏覽器訂閱：

- `push.web.vapidPublicKey` — 擷取作用中的 VAPID 公開金鑰。
- `push.web.subscribe` — 註冊 `endpoint` 加上 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 移除已註冊的端點。
- `push.web.test` — 將測試通知傳送到呼叫者的訂閱。

<Note>
網頁推播獨立於 iOS APNS 中繼路徑（請參閱 [設定](/zh-TW/gateway/configuration) 了解中繼支援的推播）和現有的 `push.test` 方法，後兩者以原生行動配對為目標。
</Note>

## 託管嵌入

助理訊息可以使用 `[embed ...]` 短代碼內嵌轉譯託管網頁內容。iframe 沙箱政策由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    停用託管嵌入中的指令碼執行。
  </Tab>
  <Tab title="scripts（預設）">
    允許互動式嵌入，同時維持來源隔離；這是預設值，通常足以用於自包含的瀏覽器遊戲/小工具。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 之上加入 `allow-same-origin`，供刻意需要更高權限的同站文件使用。
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
只有在嵌入文件確實需要同源行為時，才使用 `trusted`。對於大多數代理產生的遊戲和互動畫布，`scripts` 是較安全的選擇。
</Warning>

絕對外部 `http(s)` 嵌入 URL 預設仍會被封鎖。如果你刻意希望 `[embed url="https://..."]` 載入第三方頁面，請設定 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天訊息寬度

分組聊天訊息使用易讀的預設最大寬度。寬螢幕部署可以透過設定 `gateway.controlUi.chatMessageMaxWidth` 覆寫它，而不必修補隨附的 CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

此值在到達瀏覽器之前會先經過驗證。支援的值包括純長度與百分比，例如 `960px` 或 `82%`，以及受限制的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 寬度運算式。

## Tailnet 存取（建議）

<Tabs>
  <Tab title="整合式 Tailscale Serve（偏好）">
    將閘道保留在 loopback，並讓 Tailscale Serve 以 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    開啟：

    - `https://<magicdns>/`（或你設定的 `gateway.controlUi.basePath`）

    預設情況下，當 `gateway.auth.allowTailscale` 為 `true` 時，Control UI/WebSocket Serve 請求可透過 Tailscale 身分標頭（`tailscale-user-login`）驗證。OpenClaw 會使用 `tailscale whois` 解析 `x-forwarded-for` 位址並將它與標頭比對，以驗證該身分，而且只有在請求帶著 Tailscale 的 `x-forwarded-*` 標頭命中 loopback 時才接受。對於具有瀏覽器裝置身分的 Control UI 操作者工作階段，這個已驗證的 Serve 路徑也會略過裝置配對往返；無裝置瀏覽器和節點角色連線仍會遵循一般裝置檢查。如果你即使對 Serve 流量也想要求明確的共享秘密憑證，請設定 `gateway.auth.allowTailscale: false`。接著使用 `gateway.auth.mode: "token"` 或 `"password"`。

    對於該非同步 Serve 身分路徑，同一個用戶端 IP 和驗證作用域的失敗驗證嘗試，會在寫入速率限制前被序列化。因此來自同一瀏覽器的並行錯誤重試，可能會讓第二個請求顯示 `retry later`，而不是兩個普通不相符錯誤平行競爭。

    <Warning>
    無權杖 Serve 驗證假設閘道主機可信任。如果不受信任的本機程式碼可能在該主機上執行，請要求權杖/密碼驗證。
    </Warning>

  </Tab>
  <Tab title="繫結到 tailnet + 權杖">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    接著開啟：

    - `http://<tailscale-ip>:18789/`（或你設定的 `gateway.controlUi.basePath`）

    將相符的共享秘密貼到 UI 設定中（以 `connect.params.auth.token` 或 `connect.params.auth.password` 傳送）。

  </Tab>
</Tabs>

## 不安全的 HTTP

如果你透過純 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）開啟儀表板，瀏覽器會在**非安全環境**中執行並封鎖 WebCrypto。預設情況下，OpenClaw 會**封鎖**沒有裝置身分的 Control UI 連線。

已記載的例外：

- 僅限 localhost 的不安全 HTTP 相容性，搭配 `gateway.controlUi.allowInsecureAuth=true`
- 透過 `gateway.auth.mode: "trusted-proxy"` 成功進行的操作者 Control UI 驗證
- 緊急破窗 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**建議修正：**使用 HTTPS（Tailscale Serve），或在本機開啟 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在閘道主機上）

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

    - 它允許 localhost Control UI 工作階段在非安全 HTTP 環境中無需裝置身分即可繼續。
    - 它不會略過配對檢查。
    - 它不會放寬遠端（非 localhost）裝置身分要求。

  </Accordion>
  <Accordion title="僅限緊急破窗">
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
    `dangerouslyDisableDeviceAuth` 會停用 Control UI 裝置身分檢查，這是嚴重的安全降級。緊急使用後請迅速還原。
    </Warning>

  </Accordion>
  <Accordion title="受信任代理注意事項">
    - 成功的受信任代理驗證可允許沒有裝置身分的**操作者** Control UI 工作階段。
    - 這**不會**延伸到節點角色 Control UI 工作階段。
    - 同主機 loopback 反向代理仍不滿足受信任代理驗證；請參閱 [受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

請參閱 [Tailscale](/zh-TW/gateway/tailscale) 取得 HTTPS 設定指引。

## 內容安全政策

Control UI 隨附嚴格的 `img-src` 政策：只允許**同源**資產、`data:` URL，以及本機產生的 `blob:` URL。遠端 `http(s)` 和協定相對圖片 URL 會被瀏覽器拒絕，且不會發出網路擷取。

實務上的含義：

- 透過相對路徑提供的頭像和圖片（例如 `/avatars/<id>`）仍會轉譯，包括 UI 擷取並轉換成本機 `blob:` URL 的已驗證頭像路由。
- 內嵌 `data:image/...` URL 仍會轉譯（適用於協定內酬載）。
- Control UI 建立的本機 `blob:` URL 仍會轉譯。
- 通道中繼資料發出的遠端頭像 URL 會在 Control UI 的頭像輔助程式中被剝除，並以內建標誌/徽章取代，因此遭入侵或惡意通道無法強制操作者瀏覽器擷取任意遠端圖片。

你不需要變更任何內容即可取得此行為 — 它永遠啟用且不可設定。

## 頭像路由驗證

設定閘道驗證後，Control UI 頭像端點會要求與 API 其餘部分相同的閘道權杖：

- `GET /avatar/<agentId>` 只會向已驗證呼叫者傳回頭像圖片。`GET /avatar/<agentId>?meta=1` 會在相同規則下傳回頭像中繼資料。
- 對任一路由的未驗證請求都會被拒絕（與相鄰的 assistant-media 路由一致）。這可防止頭像路由在原本受保護的主機上洩漏代理身分。
- Control UI 本身在擷取頭像時會將閘道權杖作為 bearer 標頭轉送，並使用已驗證的 blob URL，讓圖片仍可在儀表板中轉譯。

如果你停用閘道驗證（不建議在共用主機上這麼做），頭像路由也會變成未驗證，與閘道的其他部分一致。

## 助理媒體路由驗證

設定閘道驗證時，助理本機媒體預覽會使用兩步驟路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 需要一般的 Control UI 操作者驗證。瀏覽器檢查可用性時，會以 bearer 標頭傳送閘道權杖。
- 成功的中繼資料回應會包含一個短效 `mediaTicket`，範圍限定於該精確來源路徑。
- 瀏覽器呈現的圖片、音訊、影片和文件 URL 會使用 `mediaTicket=<ticket>`，而不是作用中的閘道權杖或密碼。票證很快就會過期，且無法授權不同來源。

這可讓一般媒體呈現與瀏覽器原生媒體元素相容，同時避免把可重複使用的閘道憑證放在可見的媒體 URL 中。

## 建置 UI

閘道會從 `dist/control-ui` 提供靜態檔案。使用以下指令建置：

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

然後將 UI 指向你的閘道 WS URL（例如 `ws://127.0.0.1:18789`）。

## 空白 Control UI 頁面

如果瀏覽器載入空白儀表板，且 DevTools 沒有顯示有用的錯誤，可能是擴充功能或早期內容指令碼阻止了 JavaScript 模組應用程式執行。當 `<openclaw-app>` 在啟動後未註冊時，靜態頁面會包含一個純 HTML 復原面板。

變更瀏覽器環境後，使用面板的 **Try again** 動作，或在完成以下檢查後手動重新載入：

- 停用會注入所有頁面的擴充功能，特別是具有 `<all_urls>` 內容指令碼的擴充功能。
- 嘗試使用私人視窗、乾淨的瀏覽器設定檔，或其他瀏覽器。
- 保持閘道執行，並在瀏覽器變更後驗證相同的儀表板 URL。

## 偵錯/測試：開發伺服器 + 遠端閘道

Control UI 是靜態檔案；WebSocket 目標可設定，且可以不同於 HTTP 來源。當你想在本機使用 Vite 開發伺服器，但閘道在其他地方執行時，這很方便。

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

    選用的一次性驗證（如需要）：

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` 會在載入後儲存在 localStorage，並從 URL 中移除。
    - 如果你透過 `gatewayUrl` 傳入完整的 `ws://` 或 `wss://` 端點，請對 `gatewayUrl` 值進行 URL 編碼，讓瀏覽器能正確解析查詢字串。
    - 只要可能，`token` 應透過 URL 片段（`#token=...`）傳入。片段不會傳送到伺服器，可避免請求記錄和 Referer 外洩。舊版 `?token=` 查詢參數仍會為了相容性匯入一次，但只作為備援，並會在啟動後立即移除。
    - `password` 只會保留在記憶體中。
    - 設定 `gatewayUrl` 時，UI 不會退回使用設定或環境憑證。請明確提供 `token`（或 `password`）。缺少明確憑證會導致錯誤。
    - 當閘道位於 TLS 後方（Tailscale Serve、HTTPS 代理等）時，請使用 `wss://`。
    - `gatewayUrl` 只會在最上層視窗中被接受（不可嵌入），以防止點擊劫持。
    - 公開的非 loopback Control UI 部署必須明確設定 `gateway.controlUi.allowedOrigins`（完整來源）。來自 loopback、RFC1918/link-local、`.local`、`.ts.net` 或 Tailscale CGNAT 主機的私人同源 LAN/Tailnet 載入，不需啟用 Host 標頭備援即可接受。
    - 閘道啟動可能會從有效的執行階段繫結和連接埠植入本機來源，例如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>`，但遠端瀏覽器來源仍需要明確項目。
    - 除了嚴格控管的本機測試外，請勿使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允許任何瀏覽器來源，而不是「符合我正在使用的任何主機」。
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

遠端存取設定詳細資料：[遠端存取](/zh-TW/gateway/remote)。

## 相關

- [儀表板](/zh-TW/web/dashboard) — 閘道儀表板
- [健康檢查](/zh-TW/gateway/health) — 閘道健康狀態監控
- [終端介面](/zh-TW/web/tui) — 終端使用者介面
- [WebChat](/zh-TW/web/webchat) — 以瀏覽器為基礎的聊天介面
