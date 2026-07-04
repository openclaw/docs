---
read_when:
    - 您想要從瀏覽器操作閘道
    - 你想要不透過 SSH 通道的 Tailnet 存取
sidebarTitle: Control UI
summary: 瀏覽器式閘道控制使用者介面（聊天、活動、節點、設定）
title: 控制介面
x-i18n:
    generated_at: "2026-07-04T20:25:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 883e951b304a104a5cb2d0197199d06e372b1b8a25efdfd082ae190575bf409d
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
在原生 Windows LAN 綁定上，即使 `127.0.0.1` 在閘道主機上可用，Windows 防火牆或組織管理的群組原則仍可能封鎖公告的 LAN URL。請在 Windows 主機上執行 `openclaw gateway status --deep`；它會回報可能遭封鎖的連接埠、設定檔不一致，以及原則可能忽略的本機防火牆規則。
</Note>

驗證會在 WebSocket 握手期間透過以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 當 `gateway.auth.allowTailscale: true` 時，使用 Tailscale Serve 身分標頭
- 當 `gateway.auth.mode: "trusted-proxy"` 時，使用受信任 Proxy 身分標頭

儀表板設定面板會為目前瀏覽器分頁工作階段和選取的閘道 URL 保留一個權杖；密碼不會持久保存。初始設定通常會在第一次連線時為共享密鑰驗證產生閘道權杖，但當 `gateway.auth.mode` 是 `"password"` 時，也可以使用密碼驗證。

## 裝置配對（第一次連線）

當你從新的瀏覽器或裝置連線到控制 UI 時，閘道通常會要求**一次性配對核准**。這是一項防止未授權存取的安全措施。

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

如果瀏覽器使用已變更的驗證詳細資料（角色/範圍/公開金鑰）重試配對，先前的待處理要求會被取代，並建立新的 `requestId`。請在核准前重新執行 `openclaw devices list`。

如果瀏覽器已配對，而你將它從讀取存取變更為寫入/管理員存取，這會被視為核准升級，而不是靜默重新連線。OpenClaw 會保持舊核准啟用、封鎖較大權限的重新連線，並要求你明確核准新的範圍集合。

核准後，裝置會被記住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤銷它，否則不會要求重新核准。請參閱[裝置命令列介面](/zh-TW/cli/devices)了解權杖輪替和撤銷。

透過 `openclaw_gateway` 轉接器連線的 Paperclip 代理程式會使用相同的首次執行核准流程。初次連線嘗試後，執行 `openclaw devices approve --latest` 以預覽待處理要求，然後重新執行列印出的 `openclaw devices approve <requestId>` 命令來核准。針對遠端閘道，請傳入明確的 `--url` 和 `--token` 值。若要讓核准在重新啟動後保持穩定，請在 Paperclip 中設定持久的 `adapterConfig.devicePrivateKeyPem`，而不是讓它每次執行都產生新的暫時裝置身分。

<Note>
- 直接的 local loopback 瀏覽器連線（`127.0.0.1` / `localhost`）會自動核准。
- 當 `gateway.auth.allowTailscale: true`、Tailscale 身分驗證通過，且瀏覽器提供其裝置身分時，Tailscale Serve 可以略過控制 UI 操作者工作階段的配對往返。
- 直接 Tailnet 綁定、LAN 瀏覽器連線，以及沒有裝置身分的瀏覽器設定檔，仍需要明確核准。
- 每個瀏覽器設定檔都會產生唯一的裝置 ID，因此切換瀏覽器或清除瀏覽器資料將需要重新配對。

</Note>

## 配對行動裝置

已配對的管理員可以建立 iOS/Android 連線 QR，而不需要
開啟終端機：

<Steps>
  <Step title="開啟行動裝置配對">
    選取**節點**，然後在**裝置**卡片中點擊**配對行動裝置**。
  </Step>
  <Step title="連接手機">
    在 OpenClaw 行動應用程式中，開啟**設定** → **閘道**並掃描 QR
    碼。你也可以改為複製並貼上設定碼。
  </Step>
  <Step title="確認連線">
    官方 iOS/Android 應用程式會自動連線。如果**裝置**顯示
    待處理要求，請在核准前檢閱其角色與範圍。
  </Step>
</Steps>

建立設定碼需要 `operator.admin`；沒有該權限的
工作階段會停用按鈕。設定碼包含短效的啟動認證，
因此在 QR 和複製的代碼有效期間，請像處理密碼一樣保護它們。針對遠端
配對，閘道必須解析為 `wss://`（例如透過 Tailscale
Serve/Funnel）；純 `ws://` 僅限於 loopback 和私有 LAN 位址。
請參閱[配對](/zh-TW/channels/pairing#pair-from-the-control-ui-recommended)了解
完整的安全性與備援詳細資料。

## 個人身分（瀏覽器本機）

控制 UI 支援每個瀏覽器一組個人身分（顯示名稱和頭像），附加到傳出訊息以便在共享工作階段中標示來源。它位於瀏覽器儲存空間中，範圍限於目前的瀏覽器設定檔，不會同步到其他裝置，也不會在伺服器端持久保存，除了你實際傳送訊息時正常逐字稿作者身分中繼資料。清除網站資料或切換瀏覽器會將它重設為空白。

同樣的瀏覽器本機模式也適用於助理頭像覆寫。上傳的助理頭像只會在本機瀏覽器上覆蓋閘道解析出的身分，且絕不會透過 `config.patch` 往返傳送。共享的 `ui.assistant.avatar` 設定欄位仍可供直接寫入該欄位的非 UI 用戶端使用（例如腳本化閘道或自訂儀表板）。

## 執行階段設定端點

控制 UI 會從 `/control-ui-config.json` 擷取其執行階段設定，並相對於閘道的控制 UI 基底路徑解析（例如 UI 在 `/__openclaw__/` 下提供服務時為 `/__openclaw__/control-ui-config.json`）。該端點受到與其餘 HTTP 介面相同的閘道驗證保護：未驗證的瀏覽器無法擷取它，且成功擷取需要已有效的閘道權杖/密碼、Tailscale Serve 身分，或受信任 Proxy 身分。

## 語言支援

控制 UI 可以在首次載入時根據你的瀏覽器語系自動本地化。若稍後要覆寫它，請開啟**總覽 -> 閘道存取 -> 語言**。語系選擇器位於閘道存取卡片中，而不是外觀底下。

- 支援的語系：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`ar`、`it`、`tr`、`uk`、`id`、`pl`、`th`、`vi`、`nl`、`fa`
- 非英文翻譯會在瀏覽器中延遲載入。
- 選取的語系會儲存在瀏覽器儲存空間中，並在未來造訪時重複使用。
- 缺少的翻譯鍵會退回英文。

文件翻譯也會為相同的非英文語系集合產生，但文件網站內建的 Mintlify 語言選擇器僅限於 Mintlify 接受的語系代碼。泰文（`th`）和波斯文（`fa`）文件仍會在發布 repo 中產生；在 Mintlify 支援這些代碼之前，它們可能不會出現在該選擇器中。

## 外觀主題

外觀面板保留內建的 Claw、Knot 和 Dash 主題，並加上一個瀏覽器本機的 tweakcn 匯入槽。若要匯入主題，請開啟 [tweakcn 編輯器](https://tweakcn.com/editor/theme)，選擇或建立主題，點擊**分享**，並將複製的主題連結貼到外觀中。匯入器也接受 `https://tweakcn.com/r/themes/<id>` 登錄 URL、像 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 的編輯器 URL、相對 `/themes/<id>` 路徑、原始主題 ID，以及例如 `amethyst-haze` 的預設主題名稱。

外觀也包含瀏覽器本機的文字大小設定。此設定會與其他控制 UI 偏好設定一起儲存，套用於聊天文字、撰寫器文字、工具卡片和聊天側邊欄，並讓文字輸入至少保持 16px，避免行動版 Safari 在聚焦時自動縮放。

匯入的主題只會儲存在目前瀏覽器設定檔中。它們不會寫入閘道設定，也不會跨裝置同步。替換匯入的主題會更新唯一的本機槽；如果已選取匯入的主題，清除它會將作用中主題切回 Claw。

## 它目前可以做什麼

<AccordionGroup>
  <Accordion title="聊天與通話">
    - 透過閘道 WS 與模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 聊天記錄重新整理會要求一個有界的近期視窗，並對每則訊息設定文字上限，因此大型工作階段不會在聊天可用前強迫瀏覽器渲染完整逐字稿承載。
    - 透過瀏覽器即時工作階段通話。OpenAI 使用直接 WebRTC，Google Live 透過 WebSocket 使用受限的一次性瀏覽器權杖，而僅後端的即時語音外掛則使用閘道轉送傳輸。用戶端擁有的供應商工作階段以 `talk.client.create` 開始；閘道轉送工作階段以 `talk.session.create` 開始。轉送會將供應商認證保留在閘道上，同時瀏覽器透過 `talk.session.appendAudio` 串流麥克風 PCM，透過 `talk.client.toolCall` 將 `openclaw_agent_consult` 供應商工具呼叫轉送給閘道政策和較大的已設定 OpenClaw 模型，並透過 `talk.client.steer` 或 `talk.session.steer` 路由作用中執行的語音導引。
    - 在聊天中串流工具呼叫與即時工具輸出卡片（代理程式事件）。
    - 活動分頁會從現有的 `session.tool` / 工具事件傳遞，顯示瀏覽器本機、以遮罩為先的即時工具活動摘要。

  </Accordion>
  <Accordion title="頻道、執行個體、工作階段、夢境">
    - 頻道：內建加上隨附/外部外掛頻道狀態、QR 登入，以及每個頻道設定（`channels.status`、`web.login.*`、`config.patch`）。
    - 頻道探測重新整理會在較慢的供應商檢查完成前保留先前快照可見，且當探測或稽核超過其 UI 預算時，部分快照會被標示。
    - 執行個體：線上狀態清單與重新整理（`system-presence`）。
    - 工作階段：預設列出已設定代理程式工作階段、釘選常用工作階段、重新命名它們、封存或還原非作用中工作階段、從過時且未設定的代理程式工作階段鍵退回，並套用每個工作階段的模型/思考/快速/詳細/追蹤/推理覆寫（`sessions.list`、`sessions.patch`）。釘選工作階段會排序在近期未釘選工作階段之上；封存工作階段位於工作階段頁面的封存檢視中，並保留其逐字稿。
    - 夢境：夢境整理狀態、啟用/停用切換，以及夢境日記閱讀器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="排程、Skills、節點、執行核准">
    - 排程工作：列出/新增/編輯/執行/啟用/停用 + 執行記錄（`cron.*`）。
    - Skills：狀態、啟用/停用、安裝、API 金鑰更新（`skills.*`）。
    - 節點：清單 + 能力（`node.list`）、建立行動裝置設定碼，以及核准裝置配對（`device.pair.*`）。
    - 執行核准：編輯閘道或節點允許清單 + `exec host=gateway/node` 的詢問政策（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="設定">
    - 檢視/編輯 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - MCP 針對已設定的伺服器、啟用狀態、OAuth/篩選器/平行摘要、常見操作員命令，以及限定範圍的 `mcp` 設定編輯器，提供專用設定頁面。
    - 套用 + 重新啟動並進行驗證（`config.apply`），然後喚醒最後一個作用中的工作階段。
    - 寫入包含 base-hash 防護，避免覆寫並行編輯。
    - 寫入（`config.set`/`config.apply`/`config.patch`）會針對提交的設定承載中 refs 的作用中 SecretRef 解析進行預檢；未解析的作用中提交 refs 會在寫入前被拒絕。
    - 表單儲存會捨棄無法從已儲存設定還原的過期已遮蔽預留位置，同時保留仍可對應到已儲存祕密的已遮蔽值。
    - 結構描述 + 表單算繪（`config.schema` / `config.schema.lookup`，包含欄位 `title` / `description`、相符的 UI 提示、直接子項摘要、巢狀物件/萬用字元/陣列/組合節點上的文件中繼資料，以及可用時的外掛 + 頻道結構描述）；只有在快照具備安全原始往返時，才可使用原始 JSON 編輯器。
    - 如果快照無法安全地往返原始文字，Control UI 會強制使用表單模式，並停用該快照的原始模式。
    - 原始 JSON 編輯器的「重設為已儲存」會保留原始作者撰寫的形狀（格式、註解、`$include` 版面），而不是重新算繪扁平化快照，因此當快照可安全往返時，外部編輯可在重設後保留下來。
    - 結構化 SecretRef 物件值會在表單文字輸入中以唯讀方式算繪，以防止意外的物件轉字串損毀。

  </Accordion>
  <Accordion title="偵錯、日誌、更新">
    - 偵錯：狀態/健康情況/模型快照 + 事件日誌 + 手動 RPC 呼叫（`status`、`health`、`models.list`）。
    - 事件日誌包含 Control UI 重新整理/RPC 計時、緩慢聊天/設定算繪計時，以及當瀏覽器公開這些 PerformanceObserver 項目類型時，針對長動畫影格或長工作項目的瀏覽器回應性項目。
    - 日誌：即時尾隨閘道檔案日誌，並支援篩選/匯出（`logs.tail`）。
    - 更新：執行套件/git 更新 + 重新啟動（`update.run`）並產生重新啟動報告，然後在重新連線後輪詢 `update.status`，以驗證正在執行的閘道版本。

  </Accordion>
  <Accordion title="排程工作面板注意事項">
    - 對於隔離工作，傳遞預設為宣布摘要。如果你想要僅限內部執行，可切換為無。
    - 選取宣布時，會顯示頻道/目標欄位。
    - 網路鉤子模式使用 `delivery.mode = "webhook"`，並將 `delivery.to` 設為有效的 HTTP(S) 網路鉤子 URL。
    - 對於主工作階段工作，可使用網路鉤子和無傳遞模式。
    - 進階編輯控制包含執行後刪除、清除代理覆寫、排程精確/錯開選項、代理模型/思考覆寫，以及盡力傳遞切換。
    - 表單驗證會以欄位層級錯誤內嵌顯示；無效值會停用儲存按鈕直到修正為止。
    - 設定 `cron.webhookToken` 以傳送專用 bearer token；若省略，網路鉤子會在沒有 auth 標頭的情況下傳送。
    - 已棄用的後援：執行 `openclaw doctor --fix`，將已儲存且含有 `notify: true` 的舊版工作從 `cron.webhook` 遷移至明確的每工作網路鉤子或完成傳遞。

  </Accordion>
</AccordionGroup>

## MCP 頁面

專用 MCP 頁面是針對 `mcp.servers` 下由 OpenClaw 管理的 MCP 伺服器的操作員檢視。它本身不會啟動 MCP 傳輸；請用它檢查和編輯已儲存設定，然後在需要即時伺服器證明時使用 `openclaw mcp doctor --probe`。

典型工作流程：

1. 從側邊欄開啟 **MCP**。
2. 檢查摘要卡片中的總數、已啟用、OAuth，以及已篩選伺服器數量。
3. 檢閱每個伺服器列的傳輸、啟用狀態、驗證、篩選器、逾時，以及命令提示。
4. 當伺服器應保持設定但不進入執行階段探索時，切換啟用狀態。
5. 編輯限定範圍的 `mcp` 設定區段，用於伺服器定義、標頭、TLS/mTLS 路徑、OAuth 中繼資料、工具篩選器，以及 Codex 投影中繼資料。
6. 使用 **儲存** 寫入設定；或在執行中的閘道應套用已變更設定時，使用 **儲存並發布**。
7. 當已編輯程序需要靜態診斷、即時證明，或捨棄快取執行階段時，從終端機執行 `openclaw mcp status --verbose`、`openclaw mcp doctor --probe` 或 `openclaw mcp reload`。

頁面會在算繪前遮蔽帶有憑證且類似 URL 的值，並在命令片段中為伺服器名稱加上引號，因此複製的命令仍可搭配空格或 shell 中繼字元使用。完整的命令列介面與設定參考位於 [MCP](/zh-TW/cli/mcp)。

## 活動分頁

活動分頁是瀏覽器本機的暫時性觀察器，用於即時工具活動。它衍生自與聊天工具卡片相同的閘道 `session.tool` / 工具事件串流；它不會新增另一個閘道事件家族、端點、持久活動儲存、指標饋送，或外部觀察器串流。

活動項目只保留已清理的摘要，以及已遮蔽、截斷的輸出預覽。工具引數值不會儲存在活動狀態中；UI 會顯示引數已隱藏，並只記錄引數欄位數量。記憶體中的清單會跟隨目前的瀏覽器分頁，在 Control UI 內導覽時保留，並在頁面重新載入、切換工作階段或按下 **清除** 時重設。

## 聊天行為

<AccordionGroup>
  <Accordion title="傳送與歷史語意">
    - `chat.send` 是**非阻塞**的：它會立即以 `{ runId, status: "started" }` 確認，並透過 `chat` 事件串流傳回回應。受信任的 Control UI 用戶端也可能收到選用 ACK 計時中繼資料，用於本機診斷。
    - 聊天上傳接受圖片加上非影片檔案。圖片保留原生圖片路徑；其他檔案會儲存為受管理媒體，並在歷史中顯示為附件連結。
    - 使用相同 `idempotencyKey` 重新傳送時，執行中會傳回 `{ status: "in_flight" }`，完成後會傳回 `{ status: "ok" }`。
    - `chat.history` 回應會為 UI 安全限制大小。當逐字稿項目過大時，閘道可能會截斷長文字欄位、省略大型中繼資料區塊，並以預留位置（`[chat.history omitted: message too large]`）取代過大的訊息。
    - 當可見的助理訊息在 `chat.history` 中被截斷時，側邊閱讀器可視需要透過 `chat.message.get`，依 `sessionKey`、需要時的作用中 `agentId`，以及逐字稿 `messageId` 擷取完整的顯示正規化逐字稿項目。如果閘道仍無法傳回更多內容，閱讀器會顯示明確的不可用狀態，而不是靜默重複截斷預覽。
    - 助理/產生的圖片會持久化為受管理媒體參照，並透過已驗證的閘道媒體 URL 傳回，因此重新載入不依賴原始 base64 圖片承載留在聊天歷史回應中。
    - 在算繪 `chat.history` 時，Control UI 會從可見助理文字中移除僅供顯示的內嵌指令標籤（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、純文字工具呼叫 XML 承載（包含 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及截斷的工具呼叫區塊），以及洩漏的 ASCII/全形模型控制 token，並省略整段可見文字僅為精確靜默 token `NO_REPLY` / `no_reply` 或心跳偵測確認 token `HEARTBEAT_OK` 的助理項目。
    - 在作用中傳送與最終歷史重新整理期間，如果 `chat.history` 短暫傳回較舊的快照，聊天檢視會保留本機樂觀使用者/助理訊息可見；一旦閘道歷史追上，標準逐字稿就會取代這些本機訊息。
    - 即時 `chat` 事件是傳遞狀態，而 `chat.history` 會從持久工作階段逐字稿重建。在 tool-final 事件後，Control UI 會重新載入歷史，並只合併小段樂觀尾端；逐字稿邊界記錄在 [WebChat](/zh-TW/web/webchat)。
    - `chat.inject` 會將助理註記附加到工作階段逐字稿，並廣播 `chat` 事件以進行僅限 UI 的更新（無代理執行、無頻道傳遞）。
    - 側邊欄列出最近工作階段，並提供新增工作階段動作、所有工作階段連結，以及開啟完整工作階段選擇器的工作階段搜尋按鈕（依所選代理限定範圍，並支援搜尋與分頁）。切換代理時只顯示繫結到該代理的工作階段；若該代理尚無已儲存的儀表板工作階段，則回退到該代理的主工作階段。
    - 每個工作階段選擇器列都可重新命名、釘選或封存工作階段。作用中執行和代理的主工作階段不能封存。封存目前選取的工作階段會將聊天切回該代理的主工作階段。
    - 在桌面寬度下，聊天控制項會維持在一個精簡列上，並在向下捲動逐字稿時收合；向上捲動、返回頂端或到達底部時會還原控制項。
    - 連續重複的純文字訊息會算繪為一個帶有計數徽章的氣泡。帶有圖片、附件、工具輸出或畫布預覽的訊息不會收合。
    - 聊天標頭模型與思考選擇器會透過 `sessions.patch` 立即修補作用中工作階段；它們是持久工作階段覆寫，而不是僅限單回合的傳送選項。
    - 如果你在同一工作階段的模型選擇器變更仍在儲存時傳送訊息，撰寫器會等待該工作階段修補完成後才呼叫 `chat.send`，讓傳送使用所選模型。
    - 在 Control UI 輸入 `/new` 會建立並切換到與新增聊天相同的全新儀表板工作階段；但當已設定 `session.dmScope: "main"` 且目前父項是代理的主工作階段時，會就地重設主工作階段。輸入 `/reset` 會保留閘道對目前工作階段的明確就地重設。
    - 聊天模型選擇器會要求閘道提供已設定的模型檢視。如果存在 `agents.defaults.models`，該允許清單會驅動選擇器，包含維持提供者限定範圍目錄動態的 `provider/*` 項目。否則，選擇器會顯示明確的 `models.providers.*.models` 項目，以及具備可用驗證的提供者。完整目錄仍可透過偵錯 `models.list` RPC 搭配 `view: "all"` 使用。
    - 當新的閘道工作階段用量報告包含目前內容 token 時，聊天撰寫器工具列會顯示一個小型內容用量圓環，標示已使用百分比；完整 token 詳細資料位於其工具提示中。圓環會在高內容壓力時切換為警告樣式，並在建議壓縮層級時顯示精簡按鈕，用於執行一般工作階段壓縮路徑。過期 token 快照會隱藏，直到閘道再次回報新用量。

  </Accordion>
  <Accordion title="通話模式（瀏覽器即時）">
    通話模式使用已註冊的即時語音提供者。使用 `talk.realtime.provider: "openai"` 加上 `openai` API-key 驗證設定檔、`talk.realtime.providers.openai.apiKey` 或 `OPENAI_API_KEY` 設定 OpenAI；OpenAI OAuth 設定檔不會設定 Realtime 語音。使用 `talk.realtime.provider: "google"` 加上 `talk.realtime.providers.google.apiKey` 設定 Google。瀏覽器永遠不會收到標準提供者 API key。OpenAI 會收到用於 WebRTC 的短暫 Realtime 用戶端祕密。Google Live 會收到一次性受限 Live API 驗證 token，用於瀏覽器 WebSocket 工作階段，且指令和工具宣告由閘道鎖定到該 token 中。只公開後端即時橋接的提供者會透過閘道轉送傳輸執行，因此憑證和廠商 socket 會保留在伺服器端，而瀏覽器音訊會透過已驗證的閘道 RPC 移動。Realtime 工作階段提示由閘道組裝；`talk.client.create` 不接受呼叫者提供的指令覆寫。

    Chat 撰寫器在 Talk 開始/停止按鈕旁包含一個 Talk 選項按鈕。這些選項會套用到下一個 Talk 工作階段，並可覆寫供應商、傳輸、模型、語音、推理強度、VAD 閾值、靜音持續時間與前綴填補。當某個選項留空時，閘道會在可用時使用已設定的預設值，否則使用供應商預設值。選取閘道轉送會強制使用後端轉送路徑；選取 WebRTC 會讓工作階段維持由用戶端擁有，並在供應商無法建立瀏覽器工作階段時失敗，而不是悄悄退回轉送。

    在 Chat 撰寫器中，Talk 控制項是麥克風聽寫按鈕旁的波形按鈕。Talk 啟動時，撰寫器狀態列會顯示 `Connecting Talk...`，接著在音訊已連線時顯示 `Talk live`，或在即時工具呼叫透過 `talk.client.toolCall` 諮詢已設定的較大型模型時顯示 `Asking OpenClaw...`。

    維護者即時煙霧測試：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 會驗證 OpenAI 後端 WebSocket 橋接、OpenAI 瀏覽器 WebRTC SDP 交換、Google Live 受限權杖瀏覽器 WebSocket 設定，以及使用假麥克風媒體的閘道轉送瀏覽器配接器。此命令只會列印供應商狀態，不會記錄秘密。

  </Accordion>
  <Accordion title="Stop and abort">
    - 按一下 **停止**（呼叫 `chat.abort`）。
    - 執行正在進行時，一般後續訊息會排入佇列。按一下佇列訊息上的 **導向**，可將該後續訊息注入正在執行的回合。
    - 輸入 `/stop`（或獨立的中止片語，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）即可在頻外中止。
    - `chat.abort` 支援 `{ sessionKey }`（無 `runId`），可中止該工作階段的所有作用中執行。

  </Accordion>
  <Accordion title="Abort partial retention">
    - 執行被中止時，部分助理文字仍可顯示在 UI 中。
    - 當存在已緩衝輸出時，閘道會將已中止的部分助理文字保存到逐字稿歷史記錄。
    - 保存的項目包含中止中繼資料，因此逐字稿消費者可分辨中止部分與正常完成輸出。

  </Accordion>
</AccordionGroup>

## PWA 安裝與 Web Push

控制 UI 隨附 `manifest.webmanifest` 和服務工作程式，因此現代瀏覽器可將其安裝為獨立 PWA。Web Push 可讓閘道即使在分頁或瀏覽器視窗未開啟時，也能透過通知喚醒已安裝的 PWA。

如果頁面在 OpenClaw 更新後立即顯示 **通訊協定不符**，請先使用 `openclaw dashboard` 重新開啟儀表板，並強制重新整理頁面。如果仍然失敗，請清除儀表板來源的網站資料，或在私人瀏覽器視窗中測試；舊分頁或瀏覽器服務工作程式快取可能會讓更新前的控制 UI 套件持續執行，並連到較新的閘道。

| 介面                                                  | 作用                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 資訊清單。瀏覽器會在可存取後提供「安裝應用程式」。             |
| `ui/public/sw.js`                                     | 處理 `push` 事件與通知點擊的服務工作程式。                         |
| `push/vapid-keys.json`（位於 OpenClaw 狀態目錄下）    | 自動產生的 VAPID 金鑰組，用於簽署 Web Push 承載。                  |
| `push/web-push-subscriptions.json`                    | 已保存的瀏覽器訂閱端點。                                           |

當你想固定金鑰時（用於多主機部署、秘密輪替或測試），請透過閘道程序上的環境變數覆寫 VAPID 金鑰組：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（預設為 `https://openclaw.ai`）

控制 UI 使用這些受範圍限制的閘道方法來註冊與測試瀏覽器訂閱：

- `push.web.vapidPublicKey` — 擷取作用中的 VAPID 公開金鑰。
- `push.web.subscribe` — 註冊 `endpoint` 加上 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 移除已註冊的端點。
- `push.web.test` — 將測試通知傳送到呼叫者的訂閱。

<Note>
Web Push 獨立於 iOS APNS 轉送路徑（轉送支援的推播請參閱[設定](/zh-TW/gateway/configuration)）以及現有的 `push.test` 方法；後兩者的目標是原生行動裝置配對。
</Note>

## 託管嵌入

助理訊息可使用 `[embed ...]` 短代碼行內呈現託管網頁內容。iframe 沙盒政策由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    停用託管嵌入內的指令碼執行。
  </Tab>
  <Tab title="scripts (default)">
    允許互動式嵌入，同時保留來源隔離；這是預設值，通常足以用於自成一體的瀏覽器遊戲/小工具。
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
只有在嵌入文件確實需要同源行為時，才使用 `trusted`。對大多數由代理產生的遊戲與互動畫布而言，`scripts` 是較安全的選擇。
</Warning>

絕對外部 `http(s)` 嵌入 URL 預設仍會被封鎖。如果你刻意希望 `[embed url="https://..."]` 載入第三方頁面，請設定 `gateway.controlUi.allowExternalEmbedUrls: true`。

## Chat 訊息寬度

群組化 Chat 訊息使用易讀的預設最大寬度。寬螢幕部署可透過設定 `gateway.controlUi.chatMessageMaxWidth` 覆寫它，而無需修補隨附的 CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

此值會在到達瀏覽器前驗證。支援的值包含純長度與百分比，例如 `960px` 或 `82%`，以及受限制的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 寬度運算式。

## Tailnet 存取（建議）

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    將閘道保留在 loopback 上，並讓 Tailscale Serve 透過 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    開啟：

    - `https://<magicdns>/`（或你設定的 `gateway.controlUi.basePath`）

    預設情況下，當 `gateway.auth.allowTailscale` 為 `true` 時，控制 UI/WebSocket Serve 請求可透過 Tailscale 身分標頭（`tailscale-user-login`）進行驗證。OpenClaw 會使用 `tailscale whois` 解析 `x-forwarded-for` 位址並比對該標頭，以驗證身分，且只會在請求命中 loopback 並帶有 Tailscale 的 `x-forwarded-*` 標頭時接受這些資訊。對於具備瀏覽器裝置身分的控制 UI 操作者工作階段，這個已驗證的 Serve 路徑也會略過裝置配對往返；無裝置的瀏覽器與節點角色連線仍會遵循一般裝置檢查。如果你希望即使是 Serve 流量也必須使用明確的共用秘密憑證，請設定 `gateway.auth.allowTailscale: false`。接著使用 `gateway.auth.mode: "token"` 或 `"password"`。

    對於該非同步 Serve 身分路徑，同一用戶端 IP 與驗證範圍的失敗驗證嘗試，會在寫入速率限制前序列化。因此，來自同一瀏覽器的並行錯誤重試，可能會讓第二個請求顯示 `retry later`，而不是兩個單純不符並行競爭。

    <Warning>
    無權杖 Serve 驗證假設閘道主機是受信任的。如果不受信任的本機程式碼可能在該主機上執行，請要求權杖/密碼驗證。
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    然後開啟：

    - `http://<tailscale-ip>:18789/`（或你設定的 `gateway.controlUi.basePath`）

    將相符的共用秘密貼到 UI 設定中（以 `connect.params.auth.token` 或 `connect.params.auth.password` 傳送）。

  </Tab>
</Tabs>

## 不安全 HTTP

如果你透過純 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）開啟儀表板，瀏覽器會在**非安全內容**中執行並封鎖 WebCrypto。預設情況下，OpenClaw 會**封鎖**沒有裝置身分的控制 UI 連線。

已記錄的例外：

- 使用 `gateway.controlUi.allowInsecureAuth=true` 的僅限 localhost 不安全 HTTP 相容性
- 透過 `gateway.auth.mode: "trusted-proxy"` 成功進行操作者控制 UI 驗證
- 緊急破例 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**建議修正：** 使用 HTTPS（Tailscale Serve）或在本機開啟 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在閘道主機上）

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

    - 它允許 localhost 控制 UI 工作階段在非安全 HTTP 內容中不具備裝置身分也能繼續。
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
    `dangerouslyDisableDeviceAuth` 會停用控制 UI 裝置身分檢查，是嚴重的安全性降級。緊急使用後請盡快還原。
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - 成功的 trusted-proxy 驗證可允許**操作者**控制 UI 工作階段不具備裝置身分。
    - 這**不會**延伸到節點角色控制 UI 工作階段。
    - 同主機 loopback 反向代理仍不滿足 trusted-proxy 驗證；請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

HTTPS 設定指引請參閱 [Tailscale](/zh-TW/gateway/tailscale)。

## 內容安全政策

控制 UI 隨附嚴格的 `img-src` 政策：只允許**同源**資產、`data:` URL，以及本機產生的 `blob:` URL。遠端 `http(s)` 與相對通訊協定的圖片 URL 會被瀏覽器拒絕，且不會發出網路擷取。

實務上的意義：

- 透過相對路徑提供的頭像與圖片（例如 `/avatars/<id>`）仍會呈現，包括 UI 擷取並轉換成本機 `blob:` URL 的已驗證頭像路由。
- 行內 `data:image/...` URL 仍會呈現（對通訊協定內承載很有用）。
- 由控制 UI 建立的本機 `blob:` URL 仍會呈現。
- 通道中繼資料發出的遠端頭像 URL 會在控制 UI 的頭像輔助程式中被剝除，並替換為內建標誌/徽章，因此受入侵或惡意的通道無法強制操作者瀏覽器擷取任意遠端圖片。

你不需要變更任何設定即可取得此行為，它始終啟用且不可設定。

## 頭像路由驗證

當已設定閘道驗證時，控制 UI 頭像端點需要與 API 其餘部分相同的閘道權杖：

- `GET /avatar/<agentId>` 只會向已驗證呼叫者傳回頭像圖片。`GET /avatar/<agentId>?meta=1` 會在相同規則下傳回頭像中繼資料。
- 對任一路由的未驗證請求都會遭拒（與相鄰的 assistant-media 路由一致）。這可防止頭像路由在其他方面受保護的主機上洩漏代理身分。
- 控制 UI 本身在擷取頭像時會將閘道權杖作為 bearer 標頭轉送，並使用已驗證的 blob URL，因此圖片仍會在儀表板中呈現。

如果你停用閘道驗證（不建議在共用主機上這麼做），頭像路由也會變成未驗證，與閘道的其他部分一致。

## 助理媒體路由驗證

設定閘道驗證時，助理本機媒體預覽會使用兩步驟路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 需要一般 Control UI 操作者驗證。瀏覽器在檢查可用性時，會以 bearer 標頭傳送閘道權杖。
- 成功的中繼資料回應會包含一個短效的 `mediaTicket`，其範圍限定為該確切來源路徑。
- 瀏覽器轉譯的圖片、音訊、影片和文件 URL 會使用 `mediaTicket=<ticket>`，而不是使用中的閘道權杖或密碼。票證會很快過期，且無法授權不同的來源。

這可讓一般媒體轉譯與瀏覽器原生媒體元素相容，同時避免將可重複使用的閘道憑證放在可見的媒體 URL 中。

## 建置 UI

閘道會從 `dist/control-ui` 提供靜態檔案。使用以下指令建置：

```bash
pnpm ui:build
```

選用的絕對基底路徑（當你需要固定資產 URL 時）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

本機開發（獨立的開發伺服器）：

```bash
pnpm ui:dev
```

接著將 UI 指向你的閘道 WS URL（例如 `ws://127.0.0.1:18789`）。

## 空白 Control UI 頁面

如果瀏覽器載入空白儀表板，且 DevTools 沒有顯示有用錯誤，可能是擴充功能或早期內容指令碼阻止了 JavaScript 模組應用程式執行。靜態頁面包含一個純 HTML 復原面板，會在啟動後未註冊 `<openclaw-app>` 時顯示。

變更瀏覽器環境後，使用面板的 **再試一次** 動作，或在完成以下檢查後手動重新載入：

- 停用會注入所有頁面的擴充功能，尤其是含有 `<all_urls>` 內容指令碼的擴充功能。
- 嘗試使用私密視窗、乾淨的瀏覽器設定檔，或另一個瀏覽器。
- 保持閘道執行，並在變更瀏覽器後驗證同一個儀表板 URL。

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

    選用的一次性驗證（如有需要）：

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` 會在載入後儲存在 localStorage，並從 URL 中移除。
    - 如果你透過 `gatewayUrl` 傳入完整的 `ws://` 或 `wss://` 端點，請對 `gatewayUrl` 值進行 URL 編碼，讓瀏覽器能正確剖析查詢字串。
    - 只要可能，`token` 應透過 URL 片段（`#token=...`）傳入。片段不會傳送到伺服器，可避免請求記錄和 Referer 洩漏。舊版 `?token=` 查詢參數仍會為了相容性匯入一次，但只作為備援，並會在啟動後立即移除。
    - `password` 只會保存在記憶體中。
    - 設定 `gatewayUrl` 時，UI 不會退回使用設定或環境憑證。請明確提供 `token`（或 `password`）。缺少明確憑證會造成錯誤。
    - 當閘道位於 TLS 後方時（Tailscale Serve、HTTPS proxy 等），請使用 `wss://`。
    - `gatewayUrl` 只會在最上層視窗中被接受（不可嵌入），以防止點擊劫持。
    - 公開的非 loopback Control UI 部署必須明確設定 `gateway.controlUi.allowedOrigins`（完整來源）。從 loopback、RFC1918/link-local、`.local`、`.ts.net` 或 Tailscale CGNAT 主機載入的私人 same-origin LAN/Tailnet，無需啟用 Host-header 備援即可接受。
    - 閘道啟動時，可能會從有效的執行階段綁定位址和連接埠，植入如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>` 的本機來源，但遠端瀏覽器來源仍需要明確項目。
    - 除了嚴格控管的本機測試外，請勿使用 `gateway.controlUi.allowedOrigins: ["*"]`。它代表允許任何瀏覽器來源，而不是「符合我正在使用的任何主機」。
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

遠端存取設定詳細資訊：[遠端存取](/zh-TW/gateway/remote)。

## 相關

- [儀表板](/zh-TW/web/dashboard) — 閘道儀表板
- [健康檢查](/zh-TW/gateway/health) — 閘道健康監控
- [終端介面](/zh-TW/web/tui) — 終端使用者介面
- [WebChat](/zh-TW/web/webchat) — 瀏覽器式聊天介面
