---
read_when:
    - 你想要從瀏覽器操作閘道
    - 你想要不透過 SSH 通道取得 Tailnet 存取權限
sidebarTitle: Control UI
summary: 瀏覽器型閘道控制使用者介面（聊天、活動、節點、設定）
title: 控制介面
x-i18n:
    generated_at: "2026-07-05T11:49:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ae0d8bd066edaab2d58f7eec53ee125a792577fb8a3f2af1d7b5e8c75480657
    source_path: web/control-ui.md
    workflow: 16
---

控制介面是一個由閘道提供服務的小型 **Vite + Lit** 單頁應用程式：

- 預設：`http://<host>:18789/`
- 選用前置路徑：設定 `gateway.controlUi.basePath`（例如 `/openclaw`）

它會在同一個連接埠上**直接與閘道 WebSocket** 通訊。

## 快速開啟（本機）

如果閘道正在同一台電腦上執行，請開啟 [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）。

如果頁面載入失敗，請先啟動閘道：`openclaw gateway`。

<Note>
在原生 Windows LAN 綁定上，即使 `127.0.0.1` 可在閘道主機上運作，Windows 防火牆或組織管理的群組原則仍可能封鎖公告的 LAN URL。請在 Windows 主機上執行 `openclaw gateway status --deep`；它會回報可能遭封鎖的連接埠、設定檔不相符，以及原則可能忽略的本機防火牆規則。
</Note>

驗證會在 WebSocket 交握期間透過以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 當 `gateway.auth.allowTailscale: true` 時的 Tailscale Serve 身分標頭
- 當 `gateway.auth.mode: "trusted-proxy"` 時的受信任代理身分標頭

儀表板設定面板會為目前的瀏覽器分頁工作階段和選取的閘道 URL 保留權杖；密碼不會被保存。首次連線時，入門設定通常會為共用密鑰驗證產生閘道權杖，但當 `gateway.auth.mode` 為 `"password"` 時，也可以使用密碼驗證。

## 裝置配對（首次連線）

從新的瀏覽器或裝置連線通常需要**一次性配對核准**，顯示為 `disconnected (1008): pairing required`。

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

如果瀏覽器以變更後的驗證詳細資料（角色/範圍/公開金鑰）重試配對，先前待處理的要求會被取代，並建立新的 `requestId`；核准前請重新執行 `openclaw devices list`。

將已配對的瀏覽器從讀取存取切換為寫入/管理員存取，會被視為核准升級，而不是靜默重新連線：OpenClaw 會保持舊核准有效、封鎖更廣泛範圍的重新連線，並要求你明確核准新的範圍集合。

核准後，裝置會被記住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤銷，否則不需要重新核准。請參閱 [裝置命令列介面](/zh-TW/cli/devices)，了解權杖輪換、撤銷，以及 Paperclip / `openclaw_gateway` 首次執行核准流程。

<Note>
- 直接的 local loopback 瀏覽器連線（`127.0.0.1` / `localhost`）會自動核准。
- 當 `gateway.auth.allowTailscale: true`、Tailscale 身分驗證通過，且瀏覽器提供其裝置身分時，Tailscale Serve 可以為控制介面操作員工作階段略過配對往返。無裝置身分的瀏覽器與節點角色連線仍會遵循一般裝置檢查。
- 直接 Tailnet 綁定、LAN 瀏覽器連線，以及沒有裝置身分的瀏覽器設定檔，仍需要明確核准。
- 每個瀏覽器設定檔都會產生唯一裝置 ID，因此切換瀏覽器或清除瀏覽器資料需要重新配對。

</Note>

## 配對行動裝置

已配對的管理員可以在不開啟終端機的情況下建立 iOS/Android 連線 QR：

<Steps>
  <Step title="開啟行動裝置配對">
    選取 **節點**，然後在 **裝置** 卡片中點擊 **配對行動裝置**。
  </Step>
  <Step title="連接手機">
    在 OpenClaw 行動應用程式中，開啟 **設定** → **閘道** 並掃描 QR 碼。你也可以改為複製並貼上設定碼。
  </Step>
  <Step title="確認連線">
    官方 iOS/Android 應用程式會自動連線。如果 **裝置** 顯示待處理要求，請在核准前檢閱其角色與範圍。
  </Step>
</Steps>

建立設定碼需要 `operator.admin`；沒有此權限的工作階段會停用按鈕。設定碼包含短效啟動憑證，因此在有效期間，請將 QR 和複製的代碼視同密碼處理。若要遠端配對，閘道必須解析為 `wss://`（例如透過 Tailscale Serve/Funnel）；純 `ws://` 僅限於 loopback 和私人 LAN 位址。請參閱[配對](/zh-TW/channels/pairing#pair-from-the-control-ui-recommended)，了解完整的安全性與備援詳細資料。

## 個人身分（瀏覽器本機）

控制介面支援每個瀏覽器各自的個人身分（顯示名稱與頭像），可附加到外送訊息，用於共用工作階段中的歸屬標示。它存在瀏覽器儲存空間中，範圍限定於目前的瀏覽器設定檔，不會同步到其他裝置，也不會在伺服器端保存，除了你傳送訊息時的一般逐字稿作者中繼資料。清除網站資料或切換瀏覽器會將它重設為空白。

助理頭像覆寫遵循相同的瀏覽器本機模式：上傳的覆寫會在本機覆蓋閘道解析出的身分，且永遠不會透過 `config.patch` 往返傳送。共用的 `ui.assistant.avatar` 設定欄位仍可供直接寫入該欄位的非 UI 用戶端使用。

## 執行期設定端點

控制介面會從 `/control-ui-config.json` 擷取其執行期設定，並相對於閘道的控制介面基底路徑解析（例如在基底路徑 `/__openclaw__/` 下為 `/__openclaw__/control-ui-config.json`）。該端點受到與其他 HTTP 表面相同的閘道驗證控管：未驗證的瀏覽器無法擷取它，而成功擷取需要有效的閘道權杖/密碼、Tailscale Serve 身分，或受信任代理身分。

## 語言支援

控制介面會在首次載入時根據你的瀏覽器語言環境進行在地化。若稍後要覆寫，請開啟 **概覽 -> 閘道存取 -> 語言**（選擇器位於閘道存取卡片中，不在外觀下）。

- 支援的語言環境：`en`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `id`, `it`, `ja-JP`, `ko`, `nl`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- 非英文翻譯會在瀏覽器中延遲載入。
- 選取的語言環境會儲存在瀏覽器儲存空間中，並在未來造訪時重複使用。
- 缺少的翻譯鍵會退回英文。

文件翻譯會為同一組非英文語言環境產生，但文件網站內建的 Mintlify 語言選擇器只會列出 Mintlify 接受的語言環境代碼。泰文（`th`）與波斯文（`fa`）文件仍會在發布儲存庫中產生；在 Mintlify 支援這些代碼之前，它們可能不會出現在該選擇器中。

## 外觀主題

外觀面板內建 Claw、Knot 和 Dash 主題（Claw 為預設），另有一個瀏覽器本機 tweakcn 匯入槽。若要匯入主題，請開啟 [tweakcn 編輯器](https://tweakcn.com/editor/theme)，選擇或建立主題，點擊 **分享**，並將複製的連結貼到外觀中。匯入器也接受 `https://tweakcn.com/r/themes/<id>` 登錄 URL、像 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 這類編輯器 URL、相對 `/themes/<id>` 路徑、原始主題 ID，以及 `amethyst-haze` 等預設主題名稱。

匯入的主題只會儲存在目前瀏覽器設定檔中；它們不會寫入閘道設定，也不會跨裝置同步。取代匯入的主題會更新唯一的本機槽；如果匯入的主題正在使用中，清除它會切回 Claw。

外觀也有瀏覽器本機的文字大小設定，會與其他控制介面偏好設定一起儲存。它會套用到聊天文字、撰寫器文字、工具卡片和聊天側邊欄，並讓文字輸入至少保持 16px，避免行動版 Safari 在聚焦時自動縮放。

## 它能做什麼（目前）

<AccordionGroup>
  <Accordion title="聊天與語音交談">
    - 透過閘道 WS 與模型聊天（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）。
    - 聊天記錄重新整理會要求一個有界限的近期視窗，並對每則訊息設定文字上限，因此大型工作階段不會在聊天可用之前強迫瀏覽器渲染完整逐字稿承載。
    - 透過瀏覽器即時工作階段進行語音交談。OpenAI 使用直接 WebRTC，Google Live 透過 WebSocket 使用受限的一次性瀏覽器權杖，而僅後端的即時語音外掛使用閘道轉送傳輸。由用戶端擁有的供應商工作階段以 `talk.client.create` 開始；閘道轉送工作階段以 `talk.session.create` 開始。轉送會將供應商憑證保留在閘道上，同時瀏覽器透過 `talk.session.appendAudio` 串流麥克風 PCM，透過 `talk.client.toolCall` 將 `openclaw_agent_consult` 供應商工具呼叫轉送到閘道以套用政策和較大的已設定 OpenClaw 模型，並透過 `talk.client.steer` 或 `talk.session.steer` 路由作用中執行的語音引導。
    - 在聊天中串流工具呼叫和即時工具輸出卡片（代理程式事件）。
    - 活動分頁會從現有 `session.tool` / 工具事件交付中，提供瀏覽器本機、優先遮蔽的即時工具活動摘要。

  </Accordion>
  <Accordion title="頻道、執行個體、工作階段、夢境">
    - 頻道：內建加上捆綁/外部外掛頻道狀態、QR 登入，以及每個頻道設定（`channels.status`, `web.login.*`, `config.patch`）。
    - 頻道探測重新整理會在較慢的供應商檢查完成前保持先前快照可見，並在探測或稽核超過其 UI 預算時標示部分快照。
    - 執行個體：存在清單與重新整理（`system-presence`）。
    - 工作階段：預設列出已設定代理程式工作階段、釘選常用工作階段、重新命名、封存或還原非作用中工作階段、從過時的未設定代理程式工作階段鍵退回，並套用每個工作階段的模型/思考/快速/詳細/追蹤/推理覆寫（`sessions.list`, `sessions.patch`）。已釘選工作階段會排序在近期未釘選工作階段之上；已封存工作階段位於工作階段頁面的封存檢視中，並保留其逐字稿。
    - 夢境：夢境整理狀態、啟用/停用切換，以及夢境日記讀取器（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）。

  </Accordion>
  <Accordion title="排程、Skills、節點、exec 核准">
    - 排程工作：列出/新增/編輯/執行/啟用/停用，以及執行記錄（`cron.*`）。
    - Skills：狀態、啟用/停用、安裝、API 金鑰更新（`skills.*`）。
    - 節點：清單加上能力（`node.list`）、建立行動裝置設定碼，以及核准裝置配對（`device.pair.*`）。
    - Exec 核准：編輯閘道或節點允許清單，並為 `exec host=gateway/node` 詢問政策（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="設定">
    - 檢視/編輯 `~/.openclaw/openclaw.json`（`config.get`, `config.set`）。
    - MCP 有專用的設定頁面，用於已設定的伺服器、啟用狀態、OAuth/篩選器/平行摘要、常用操作員命令，以及限定範圍的 `mcp` 設定編輯器。
    - 套用並以驗證重新啟動（`config.apply`），然後喚醒最後一個作用中的工作階段。
    - 寫入包含基底雜湊防護，以避免覆蓋並行編輯。
    - 寫入（`config.set`/`config.apply`/`config.patch`）會對提交的設定承載中的 refs 預先檢查作用中的 SecretRef 解析；未解析的作用中已提交 refs 會在寫入前被拒絕。
    - 表單儲存會丟棄無法從已儲存設定還原的過時已遮蔽預留位置，同時保留仍對應到已儲存密鑰的已遮蔽值。
    - 結構描述與表單渲染來自 `config.schema` / `config.schema.lookup`，包括欄位 `title`/`description`、相符的 UI 提示、直接子項摘要、巢狀物件/萬用字元/陣列/組合節點上的文件中繼資料，以及可用時的外掛與頻道結構描述。原始 JSON 編輯器只會在快照具有安全原始往返時可用；否則控制介面會強制使用表單模式。
    - 原始 JSON 編輯器的「重設為已儲存」會保留原始撰寫的形狀（格式、註解、`$include` 版面），而不是重新渲染扁平化快照，因此當快照可以安全往返時，外部編輯可在重設後保留下來。
    - 結構化 SecretRef 物件值會在表單文字輸入中以唯讀方式渲染，以防止意外的物件轉字串損毀。

  </Accordion>
  <Accordion title="偵錯、日誌、更新">
    - 偵錯：狀態/健康狀態/模型快照、事件日誌，以及手動 RPC 呼叫（`status`、`health`、`models.list`）。
    - 事件日誌包含控制 UI 重新整理/RPC 計時、慢速聊天/設定算繪計時，以及在瀏覽器公開這些 PerformanceObserver 項目類型時，針對長動畫影格或長任務的瀏覽器回應性項目。
    - 日誌：即時追蹤閘道檔案日誌，支援篩選/匯出（`logs.tail`）。
    - 更新：執行套件/git 更新並重新啟動（`update.run`），附重新啟動報告，然後在重新連線後輪詢 `update.status`，以驗證正在執行的閘道版本。

  </Accordion>
  <Accordion title="排程工作面板注意事項">
    - 對於隔離工作，傳遞預設為宣布摘要；若僅供內部執行，請切換為無。
    - 選取宣布時，會顯示頻道/目標欄位。
    - 網路鉤子模式使用 `delivery.mode = "webhook"`，並將 `delivery.to` 設為有效的 HTTP(S) 網路鉤子 URL。
    - 對於主工作階段工作，可使用網路鉤子與無傳遞模式。
    - 進階編輯控制項包含執行後刪除、清除代理覆寫、排程精確/錯開選項、代理模型/思考覆寫，以及盡力傳遞切換。
    - 表單驗證會以欄位層級錯誤內嵌顯示；無效值會停用儲存按鈕，直到修正為止。
    - 設定 `cron.webhookToken` 以傳送專用 bearer token；若省略，網路鉤子會在沒有驗證標頭的情況下傳送。
    - `cron.webhook` 是已棄用的舊版後援：執行 `openclaw doctor --fix`，將仍使用 `notify: true` 的已儲存工作遷移為明確的每工作網路鉤子或完成傳遞。

  </Accordion>
</AccordionGroup>

## MCP 頁面

專用的 MCP 頁面是 `mcp.servers` 下 OpenClaw 管理的 MCP 伺服器操作員檢視。它本身不會啟動 MCP 傳輸；請用它檢查並編輯已儲存的設定，然後在需要即時伺服器證明時使用 `openclaw mcp doctor --probe`。

典型工作流程：

1. 從側邊欄開啟 **MCP**。
2. 檢查摘要卡片中的總數、已啟用、OAuth 與已篩選伺服器數量。
3. 檢閱每個伺服器列的傳輸、啟用狀態、驗證、篩選器、逾時與命令提示。
4. 當伺服器應保持已設定但不進入執行階段探索時，切換啟用狀態。
5. 編輯範圍限定的 `mcp` 設定區段，用於伺服器定義、標頭、TLS/mTLS 路徑、OAuth 中繼資料、工具篩選器與 Codex 投影中繼資料。
6. 使用 **儲存** 寫入設定，或在執行中的閘道應套用已變更設定時使用 **儲存並發布**。
7. 從終端機執行 `openclaw mcp status --verbose`、`openclaw mcp doctor --probe` 或 `openclaw mcp reload`，以進行靜態診斷、即時證明或清除快取執行階段。

頁面會在算繪前遮蔽帶有憑證的類 URL 值，並在命令片段中引用伺服器名稱，因此複製的命令在含有空格或 shell 中繼字元時仍可運作。完整命令列介面與設定參考：[MCP](/zh-TW/cli/mcp)。

## 活動分頁

活動分頁是暫時性的瀏覽器本機觀察器，用於即時工具活動，源自同一個驅動聊天工具卡片的閘道 `session.tool` / 工具事件串流。它不會新增另一個閘道事件家族、端點、持久活動儲存、指標來源或外部觀察器串流。

活動項目只保留已清理的摘要，以及已遮蔽、截斷的輸出預覽。工具引數值不會儲存在活動狀態中；UI 會顯示引數已隱藏，且只記錄引數欄位數。記憶體內清單會跟隨目前瀏覽器分頁，在控制 UI 內導覽時保留，並在頁面重新載入、工作階段切換或按下 **清除** 時重設。

## 操作員終端機

可停駐的操作員終端機預設為停用。若要啟用，請設定 `gateway.terminal.enabled: true` 並重新啟動閘道。終端機需要 `operator.admin` 連線，並會在作用中代理工作區開啟主機 PTY。新分頁會跟隨目前選取的聊天代理。

<Warning>
終端機是不受限制的主機 shell，並會繼承閘道程序環境。只應在受信任的操作員部署中啟用。OpenClaw 會拒絕 `sandbox.mode: "all"` 代理的終端機工作階段；將作用中代理變更為該模式會關閉其既有與進行中的終端機工作階段。
</Warning>

使用 **Ctrl + 反引號** 切換停駐區。版面支援底部與右側停駐，會隨瀏覽器視窗調整大小，並保留多個 shell 分頁。請參閱[閘道設定](/zh-TW/gateway/configuration-reference#gateway)，了解 `gateway.terminal.enabled` 與選用的 `gateway.terminal.shell` 覆寫。

工作階段會在中斷連線後保留：頁面重新載入、筆電睡眠或網路短暫中斷時，閘道會分離工作階段而不是終止它，且同一個瀏覽器分頁會在重新連線時重新附加並重播近期輸出。分離的工作階段會在 `gateway.terminal.detachedSessionTimeoutSeconds` 後被終止（預設 300 秒；`0` 會恢復為中斷連線即終止）。`terminal.list` 顯示可附加的工作階段，`terminal.attach` 採用其中一個（tmux 風格接管），而 `terminal.text` 會將工作階段近期輸出讀取為純文字且不附加，這是提供給代理/工具的便利功能。

終端機也可在 `/?view=terminal` 作為全螢幕、僅終端機文件使用。iOS 與 Android 應用程式會在其終端機畫面中嵌入此頁面，並重用已儲存的閘道憑證；可用性遵循相同的 `gateway.terminal.enabled` 與 `operator.admin` 閘門，且當已連線的閘道未提供終端機時，頁面會顯示通知。

## 聊天行為

<AccordionGroup>
  <Accordion title="傳送與歷史語意">
    - `chat.send` 是**非阻塞**：它會立即以 `{ runId, status: "started" }` 確認，回應則透過 `chat` 事件串流傳送。受信任的控制 UI 用戶端也可能收到選用的 ACK 計時中繼資料，用於本機診斷。
    - 聊天上傳接受圖片與非影片檔案。圖片保留原生圖片路徑；其他檔案會儲存為受管理媒體，並在歷史中顯示為附件連結。
    - 使用相同的 `idempotencyKey` 重新傳送時，執行中會回傳 `{ status: "in_flight" }`，完成後會回傳 `{ status: "ok" }`。
    - 為了 UI 安全，`chat.history` 回應有大小限制。當逐字稿項目過大時，閘道可能會截斷長文字欄位、省略大型中繼資料區塊，並以預留位置取代超大訊息（`[chat.history omitted: message too large]`）。
    - 當可見的助理訊息在 `chat.history` 中被截斷時，側邊閱讀器可在需要時透過 `chat.message.get`，使用 `sessionKey`、必要時的作用中 `agentId`，以及逐字稿 `messageId`，擷取完整的顯示正規化逐字稿項目。若閘道仍無法回傳更多內容，閱讀器會顯示明確的不可用狀態，而不是無聲地重複截斷預覽。
    - 助理/產生的圖片會以受管理媒體參照持久保存，並透過已驗證的閘道媒體 URL 回傳，因此重新載入不會依賴原始 base64 圖片酬載持續留在聊天歷史回應中。
    - 算繪 `chat.history` 時，控制 UI 會從可見助理文字中移除僅供顯示的內嵌指令標籤（例如 `[[reply_to_*]]` 與 `[[audio_as_voice]]`）、純文字工具呼叫 XML 酬載（包含 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及截斷的工具呼叫區塊），以及洩漏的 ASCII/全形模型控制 token。若助理項目的整個可見文字只包含精確的靜默 token `NO_REPLY` / `no_reply`，或心跳偵測確認 token `HEARTBEAT_OK`，則會省略該助理項目。
    - 在作用中的傳送與最後歷史重新整理期間，如果 `chat.history` 短暫回傳較舊的快照，聊天檢視會保留本機樂觀使用者/助理訊息可見；一旦閘道歷史追上，標準逐字稿會取代那些本機訊息。
    - 即時 `chat` 事件是傳遞狀態，而 `chat.history` 會從持久工作階段逐字稿重建。工具最終事件後，控制 UI 會重新載入歷史，且只合併一小段樂觀尾端；逐字稿邊界記錄於 [WebChat](/zh-TW/web/webchat)。
    - `chat.inject` 會將助理備註附加到工作階段逐字稿，並廣播 `chat` 事件以進行僅限 UI 的更新（無代理執行、無頻道傳遞）。
    - 側邊欄會列出近期工作階段，並提供新增工作階段動作、所有工作階段連結，以及可開啟完整工作階段選擇器的工作階段搜尋按鈕（依所選代理設定範圍，含搜尋與分頁）。新的儀表板工作階段會非同步地從其第一則非命令訊息取得簡潔的產生標題；明確名稱永遠不會被取代。設定 `agents.defaults.utilityModel`（或 `agents.list[].utilityModel`）可將這個獨立模型呼叫路由到成本較低的模型。切換代理時只會顯示與該代理相關的工作階段；若尚無已儲存的儀表板工作階段，則會退回到該代理的主工作階段。
    - 每個工作階段選擇器列都可以重新命名、釘選或封存工作階段。作用中執行與代理的主工作階段不能封存。封存目前選取的工作階段會將聊天切回該代理的主工作階段。
    - 在桌面寬度下，聊天控制項會保持在單一精簡列，並在向下捲動逐字稿時收合；向上捲動、返回頂端或抵達底部時會還原控制項。
    - 連續重複的純文字訊息會算繪為一個泡泡，並帶有計數徽章。帶有圖片、附件、工具輸出或畫布預覽的訊息不會收合。
    - 聊天標頭的模型與思考選擇器會透過 `sessions.patch` 立即修補作用中工作階段；它們是持久工作階段覆寫，不是僅限單次傳送的選項。
    - 如果你在同一工作階段的模型選擇器變更仍在儲存時傳送訊息，撰寫器會先等待該工作階段修補完成，再呼叫 `chat.send`，以確保傳送使用所選模型。
    - 輸入 `/new` 會建立並切換到與新聊天相同的全新儀表板工作階段，但當已設定 `session.dmScope: "main"` 且目前父項是代理的主工作階段時除外；此時它會就地重設主工作階段。輸入 `/reset` 會保留閘道對目前工作階段的明確就地重設。
    - 聊天模型選擇器會要求閘道已設定的模型檢視。如果存在 `agents.defaults.models`，該允許清單會驅動選擇器，包括保持供應者範圍目錄動態的 `provider/*` 項目。否則，選擇器會顯示明確的 `models.providers.*.models` 項目，以及具有可用驗證的供應者。完整目錄仍可透過偵錯 `models.list` RPC 搭配 `view: "all"` 使用。
    - 當新的閘道工作階段用量報告包含目前脈絡 token 時，聊天撰寫器工具列會顯示小型脈絡用量環，並顯示已使用百分比；完整 token 詳細資訊位於其工具提示中。當脈絡壓力偏高時，用量環會切換為警告樣式；在建議的壓縮層級時，會顯示精簡按鈕以執行一般工作階段壓縮路徑。過時的 token 快照會隱藏，直到閘道再次回報新的用量。

  </Accordion>
  <Accordion title="談話模式（瀏覽器即時）">
    談話模式使用已註冊的即時語音提供者。使用 `talk.realtime.provider: "openai"` 搭配 `openai` API 金鑰驗證設定檔、`talk.realtime.providers.openai.apiKey` 或 `OPENAI_API_KEY` 來設定 OpenAI；OpenAI OAuth 設定檔不會設定即時語音。使用 `talk.realtime.provider: "google"` 搭配 `talk.realtime.providers.google.apiKey` 來設定 Google。瀏覽器永遠不會收到標準提供者 API 金鑰：OpenAI 會收到用於 WebRTC 的短效 Realtime 用戶端祕密，而 Google Live 會收到一次性受限的 Live API 驗證權杖，用於瀏覽器 WebSocket 工作階段，且指令與工具宣告會由閘道鎖定在該權杖中。只公開後端即時橋接的提供者會透過閘道中繼傳輸執行，因此憑證和供應商 socket 會保留在伺服器端，而瀏覽器音訊則透過已驗證的閘道 RPC 傳輸。Realtime 工作階段提示由閘道組裝；`talk.client.create` 不接受呼叫端提供的指令覆寫。

    Chat 編寫器在談話開始/停止按鈕旁包含一個談話選項按鈕。選項會套用到下一個談話工作階段，並可覆寫提供者、傳輸、模型、語音、推理強度、VAD 閾值、靜音持續時間和前置填充。空白選項會退回為已設定的預設值或提供者預設值。選取閘道中繼會強制使用後端中繼路徑；選取 WebRTC 會讓工作階段由用戶端擁有，且如果提供者無法建立瀏覽器工作階段，會失敗而不是靜默退回到中繼。

    談話控制本身是麥克風聽寫按鈕旁的波形按鈕。談話開始時，編寫器狀態列會顯示 `Connecting Talk...`，音訊連線後顯示 `Talk live`，或在即時工具呼叫透過 `talk.client.toolCall` 向已設定的較大型模型查詢時顯示 `Asking OpenClaw...`。

    維護者即時冒煙測試：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 會驗證 OpenAI 後端 WebSocket 橋接、OpenAI 瀏覽器 WebRTC SDP 交換、Google Live 受限權杖瀏覽器 WebSocket 設定，以及使用假麥克風媒體的閘道中繼瀏覽器配接器。該命令只會列印提供者狀態，且不會記錄祕密。

  </Accordion>
  <Accordion title="停止與中止">
    - 按一下 **停止**（呼叫 `chat.abort`）。
    - 執行正在作用中時，一般後續訊息會排入佇列。按一下佇列訊息上的 **引導**，可將該後續訊息注入正在執行的回合。
    - 輸入 `/stop`（或獨立的中止片語，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以帶外中止。
    - `chat.abort` 支援 `{ sessionKey }`（沒有 `runId`），可中止該工作階段的所有作用中執行。

  </Accordion>
  <Accordion title="中止部分保留">
    - 執行遭中止時，部分助理文字仍可顯示在 UI 中。
    - 當存在已緩衝輸出時，閘道會將遭中止的部分助理文字持久化到逐字稿歷史中。
    - 持久化項目包含中止中繼資料，因此逐字稿消費者能區分中止部分與正常完成輸出。

  </Accordion>
</AccordionGroup>

## PWA 安裝與網頁推送

Control UI 隨附 `manifest.webmanifest` 和 service worker，因此現代瀏覽器可以將其安裝為獨立 PWA。Web Push 讓閘道即使在分頁或瀏覽器視窗未開啟時，也能以通知喚醒已安裝的 PWA。

如果頁面在 OpenClaw 更新後立即顯示 **通訊協定不符**，請先使用 `openclaw dashboard` 重新開啟儀表板並強制重新整理。如果仍然失敗，請清除儀表板來源的網站資料，或在私密瀏覽器視窗中測試；舊分頁或瀏覽器 service-worker 快取可能會繼續以更新前的 Control UI bundle 對上較新的閘道執行。

| 介面                                                  | 作用                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest。瀏覽器會在可存取後提供「安裝 app」。                 |
| `ui/public/sw.js`                                     | 處理 `push` 事件和通知點擊的 service worker。                      |
| `push/vapid-keys.json`（位於 OpenClaw 狀態目錄下）    | 自動產生的 VAPID 金鑰組，用來簽署 Web Push payload。               |
| `push/web-push-subscriptions.json`                    | 持久化的瀏覽器訂閱端點。                                           |

當你想固定金鑰（多主機部署、祕密輪替或測試）時，請透過閘道程序上的環境變數覆寫 VAPID 金鑰組：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（預設為 `https://openclaw.ai`）

Control UI 使用這些受範圍控管的閘道方法來註冊和測試瀏覽器訂閱：

- `push.web.vapidPublicKey` 擷取作用中的 VAPID 公開金鑰。
- `push.web.subscribe` 註冊 `endpoint` 加上 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` 移除已註冊的端點。
- `push.web.test` 傳送測試通知到呼叫端的訂閱。

<Note>
Web Push 獨立於 iOS APNS 中繼路徑（請參閱 [設定](/zh-TW/gateway/configuration) 了解中繼支援的推送）以及以原生行動配對為目標的 `push.test` 方法。
</Note>

## 託管嵌入

助理訊息可以使用 `[embed ...]` shortcode 內嵌呈現託管網頁內容。iframe sandbox 政策由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="嚴格">
    停用託管嵌入內的指令碼執行。
  </Tab>
  <Tab title="指令碼（預設）">
    允許互動式嵌入，同時維持來源隔離；通常足以支援自含式瀏覽器遊戲/小工具。
  </Tab>
  <Tab title="受信任">
    在 `allow-scripts` 之上加入 `allow-same-origin`，供刻意需要更高權限的同站文件使用。
  </Tab>
</Tabs>

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
只有在嵌入文件確實需要同源行為時，才使用 `trusted`。對大多數由代理產生的遊戲和互動畫布而言，`scripts` 是較安全的選擇。
</Warning>

預設仍會封鎖絕對外部 `http(s)` 嵌入 URL。若要讓 `[embed url="https://..."]` 載入第三方頁面，請設定 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天訊息寬度

分組聊天訊息使用易讀的預設最大寬度。寬螢幕部署可以設定 `gateway.controlUi.chatMessageMaxWidth` 來覆寫它，而不需修補 bundled CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

該值在到達瀏覽器前會先經過驗證。支援的形式包含純長度和百分比，例如 `960px` 或 `82%`，以及受限的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 寬度運算式。

## Tailnet 存取（建議）

<Tabs>
  <Tab title="整合式 Tailscale Serve（偏好）">
    將閘道保留在 loopback，並讓 Tailscale Serve 以 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    開啟 `https://<magicdns>/`（或你設定的 `gateway.controlUi.basePath`）。

    預設情況下，當 `gateway.auth.allowTailscale` 為 `true` 時，Control UI/WebSocket Serve 請求可透過 Tailscale 身分標頭（`tailscale-user-login`）進行驗證。OpenClaw 會使用 `tailscale whois` 解析 `x-forwarded-for` 位址並將其與標頭比對來驗證身分，且只有在請求命中 loopback 並帶有 Tailscale 的 `x-forwarded-*` 標頭時才接受這些身分。對於具備瀏覽器裝置身分的 Control UI 操作者工作階段，此已驗證的 Serve 路徑也會略過裝置配對來回流程；無裝置瀏覽器和節點角色連線仍會遵循一般裝置檢查。如果你想即使對 Serve 流量也要求明確的共享祕密憑證，請設定 `gateway.auth.allowTailscale: false`，然後使用 `gateway.auth.mode: "token"` 或 `"password"`。

    對於該非同步 Serve 身分路徑，來自相同用戶端 IP 和驗證範圍的驗證失敗嘗試，會在寫入速率限制前被序列化。因此，同一瀏覽器的並行錯誤重試可能會在第二個請求顯示 `retry later`，而不是兩個普通不符並行競爭。

    <Warning>
    無權杖 Serve 驗證假設閘道主機是受信任的。如果不受信任的本機程式碼可能在該主機上執行，請要求 token/password 驗證。
    </Warning>

  </Tab>
  <Tab title="綁定到 tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    開啟 `http://<tailscale-ip>:18789/`（或你設定的 `gateway.controlUi.basePath`）。

    將相符的共享祕密貼到 UI 設定中（以 `connect.params.auth.token` 或 `connect.params.auth.password` 傳送）。

  </Tab>
</Tabs>

## 不安全 HTTP

如果你透過純 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）開啟儀表板，瀏覽器會在 **非安全內容** 中執行並封鎖 WebCrypto。預設情況下，OpenClaw 會 **封鎖** 沒有裝置身分的 Control UI 連線。

文件化例外：

- 僅限 localhost 的不安全 HTTP 相容性，使用 `gateway.controlUi.allowInsecureAuth=true`
- 透過 `gateway.auth.mode: "trusted-proxy"` 成功進行的操作者 Control UI 驗證
- 緊急破窗 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**建議修正：** 使用 HTTPS（Tailscale Serve），或在本機開啟 UI：`https://<magicdns>/`（Serve）或 `http://127.0.0.1:18789/`（在閘道主機上）。

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

    - 它允許 localhost Control UI 工作階段在非安全 HTTP 內容中，不使用裝置身分也能繼續。
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
    `dangerouslyDisableDeviceAuth` 會停用 Control UI 裝置身分檢查，是嚴重的安全性降級。緊急使用後請盡快還原。
    </Warning>

  </Accordion>
  <Accordion title="受信任代理注意事項">
    - 成功的受信任代理驗證可允許沒有裝置身分的 **操作者** Control UI 工作階段進入。
    - 這**不會**延伸到節點角色 Control UI 工作階段。
    - 同主機 loopback 反向代理仍不符合受信任代理驗證；請參閱 [受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

請參閱 [Tailscale](/zh-TW/gateway/tailscale) 取得 HTTPS 設定指引。

## 內容安全性政策

Control UI 隨附嚴格的 `img-src` 政策：只允許 **同源** 資產、`data:` URL 和本機產生的 `blob:` URL。遠端 `http(s)` 和通訊協定相對圖片 URL 會被瀏覽器拒絕，且永遠不會發出網路擷取。

實務上：

- 在相對路徑下提供的頭像和圖片（例如 `/avatars/<id>`）仍會呈現，包括 UI 擷取並轉換為本機 `blob:` URL 的已驗證頭像路由。
- 行內 `data:image/...` URL 仍會呈現。
- 由 Control UI 建立的本機 `blob:` URL 仍會呈現。
- 通道中繼資料發出的遠端頭像 URL 會在 Control UI 的頭像輔助程式中被剝除，並替換為內建標誌/徽章，因此遭入侵或惡意的通道無法強制操作者瀏覽器任意擷取遠端圖片。

這項功能一律啟用，且無法設定。

## 頭像路由驗證

設定閘道驗證時，控制介面的頭像端點需要與 API 其餘部分相同的閘道權杖：

- `GET /avatar/<agentId>` 只會向已驗證呼叫端傳回頭像圖片。`GET /avatar/<agentId>?meta=1` 會依相同規則傳回頭像中繼資料。
- 對任一路由發出的未驗證請求都會遭到拒絕（與相鄰的 assistant-media 路由一致），因此頭像路由不會在其他部分受保護的主機上洩漏代理身分。
- 控制介面在擷取頭像時，會將閘道權杖作為 bearer 標頭轉送，並使用已驗證的 blob URL，讓圖片仍可在儀表板中顯示。

如果你停用閘道驗證（不建議在共用主機上這麼做），頭像路由也會變成未驗證，與閘道其餘部分一致。

## 助理媒體路由驗證

設定閘道驗證時，助理本機媒體預覽會使用兩步驟路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 需要一般的控制介面操作員驗證；瀏覽器在檢查可用性時，會以 bearer 標頭傳送閘道權杖。
- 成功的中繼資料回應會包含短效 `mediaTicket`，其範圍限定於該確切來源路徑。
- 瀏覽器呈現的圖片、音訊、影片與文件 URL 會使用 `mediaTicket=<ticket>`，而不是有效的閘道權杖或密碼。票證會快速過期，且無法授權不同來源。

這會讓媒體呈現與瀏覽器原生媒體元素保持相容，而不會把可重複使用的閘道憑證放進可見的媒體 URL。

## 建置 UI

閘道會從 `dist/control-ui` 提供靜態檔案：

```bash
pnpm ui:build
```

選用的絕對基底（固定資產 URL）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

本機開發（獨立開發伺服器）：

```bash
pnpm ui:dev
```

接著將 UI 指向你的閘道 WS URL（例如 `ws://127.0.0.1:18789`）。

## 空白控制介面頁面

如果瀏覽器載入的是空白儀表板，且 DevTools 沒有顯示有用的錯誤，可能是擴充功能或早期內容指令碼阻止 JavaScript 模組應用程式進行評估。靜態頁面包含一個純 HTML 復原面板，會在啟動後 `<openclaw-app>` 未註冊時顯示。

變更瀏覽器環境後，使用面板的 **再試一次** 動作，或在完成以下檢查後手動重新載入：

- 停用會注入所有頁面的擴充功能，尤其是具有 `<all_urls>` 內容指令碼的擴充功能。
- 嘗試使用私人視窗、乾淨的瀏覽器設定檔，或其他瀏覽器。
- 保持閘道執行，並在變更瀏覽器後驗證相同的儀表板 URL。

## 偵錯/測試：開發伺服器 + 遠端閘道

控制介面是靜態檔案；WebSocket 目標可設定，且可以不同於 HTTP 來源。當你想在本機使用 Vite 開發伺服器，但閘道在其他地方執行時，這很方便。

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
    - `gatewayUrl` 會在載入後儲存在 localStorage，並從 URL 移除。
    - 如果你透過 `gatewayUrl` 傳入完整的 `ws://` 或 `wss://` 端點，請對該值進行 URL 編碼，讓瀏覽器能正確解析查詢字串。
    - 應盡可能透過 URL 片段（`#token=...`）傳遞 `token`。片段不會傳送到伺服器，可避免請求記錄與 Referer 洩漏。舊版 `?token=` 查詢參數仍會為了相容性匯入一次，但僅作為後備，並會在 bootstrap 後立即移除。
    - `password` 只會保留在記憶體中。
    - 設定 `gatewayUrl` 時，UI 不會後備使用設定或環境憑證。請明確提供 `token`（或 `password`）；缺少明確憑證會造成錯誤。
    - 當閘道位於 TLS 後方（Tailscale Serve、HTTPS 代理等）時，請使用 `wss://`。
    - `gatewayUrl` 只會在最上層視窗中接受（不可嵌入），以防止點擊劫持。
    - 公開的非本機回送控制介面部署必須明確設定 `gateway.controlUi.allowedOrigins`（完整來源）。來自本機回送、RFC1918/link-local、`.local`、`.ts.net` 或 Tailscale CGNAT 主機的私人同源 LAN/Tailnet 載入，不需要啟用 Host 標頭後備即可接受。
    - 閘道啟動可能會依有效的執行階段繫結與連接埠，植入像是 `http://localhost:<port>` 和 `http://127.0.0.1:<port>` 這類本機來源，但遠端瀏覽器來源仍需要明確項目。
    - 除了嚴格控管的本機測試之外，請勿使用 `gateway.controlUi.allowedOrigins: ["*"]`；它表示允許任何瀏覽器來源，而不是「符合我正在使用的任何主機」。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 會啟用 Host 標頭來源後備模式，但這是危險的安全模式。

  </Accordion>
</AccordionGroup>

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

- [儀表板](/zh-TW/web/dashboard) — 閘道儀表板
- [健康狀態檢查](/zh-TW/gateway/health) — 閘道健康狀態監控
- [終端介面](/zh-TW/web/tui) — 終端使用者介面
- [WebChat](/zh-TW/web/webchat) — 瀏覽器式聊天介面
