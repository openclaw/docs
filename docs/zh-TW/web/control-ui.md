---
read_when:
    - 你想要從瀏覽器操作閘道
    - 你想要不透過 SSH 通道的 Tailnet 存取
sidebarTitle: Control UI
summary: 瀏覽器型閘道控制 UI（聊天、活動、節點、設定）
title: 控制介面
x-i18n:
    generated_at: "2026-06-27T20:12:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc8b9675454d57bbfb6be10bb7ef94152a89a72c94affdf72be8c79cf14cbb08
    source_path: web/control-ui.md
    workflow: 16
---

控制 UI 是由閘道提供服務的小型 **Vite + Lit** 單頁應用程式：

- 預設：`http://<host>:18789/`
- 選用前綴：設定 `gateway.controlUi.basePath`（例如 `/openclaw`）

它會在相同連接埠上**直接與閘道 WebSocket** 通訊。

## 快速開啟（本機）

如果閘道正在同一台電腦上執行，請開啟：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果頁面載入失敗，請先啟動閘道：`openclaw gateway`。

驗證會在 WebSocket 握手期間透過以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 當 `gateway.auth.allowTailscale: true` 時的 Tailscale Serve 身分標頭
- 當 `gateway.auth.mode: "trusted-proxy"` 時的 trusted-proxy 身分標頭

儀表板設定面板會為目前的瀏覽器分頁工作階段與所選閘道 URL 保留 token；密碼不會持久保存。首次連線時，初始設定通常會產生用於 shared-secret 驗證的閘道 token，但當 `gateway.auth.mode` 為 `"password"` 時，密碼驗證也可使用。

## 裝置配對（首次連線）

當你從新的瀏覽器或裝置連線到控制 UI 時，閘道通常會要求**一次性配對核准**。這是一項防止未授權存取的安全措施。

**你會看到的內容：**「disconnected (1008): pairing required」

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

如果瀏覽器以變更後的驗證詳細資訊（角色/範圍/公開金鑰）重試配對，先前待處理的請求會被取代，並建立新的 `requestId`。核准前請重新執行 `openclaw devices list`。

如果瀏覽器已配對，而你將它從讀取存取變更為寫入/管理員存取，這會被視為核准升級，而不是靜默重新連線。OpenClaw 會保留舊核准有效、阻擋較廣範圍的重新連線，並要求你明確核准新的範圍集合。

核准後，系統會記住該裝置，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤銷它，否則不需要重新核准。請參閱[裝置命令列介面](/zh-TW/cli/devices)了解 token 輪替與撤銷。

透過 `openclaw_gateway` adapter 連線的 Paperclip agent 會使用相同的首次執行核准流程。初次嘗試連線後，執行 `openclaw devices approve --latest` 來預覽待處理請求，然後重新執行列印出的 `openclaw devices approve <requestId>` 命令來核准。針對遠端閘道，請傳入明確的 `--url` 與 `--token` 值。若要讓核准在重新啟動之間保持穩定，請在 Paperclip 中設定持久的 `adapterConfig.devicePrivateKeyPem`，而不是讓它在每次執行時產生新的臨時裝置身分。

<Note>
- 直接 local loopback 瀏覽器連線（`127.0.0.1` / `localhost`）會自動核准。
- 當 `gateway.auth.allowTailscale: true`、Tailscale 身分驗證通過，且瀏覽器呈現其裝置身分時，Tailscale Serve 可以略過控制 UI 操作者工作階段的配對往返。
- 直接 Tailnet 綁定、LAN 瀏覽器連線，以及沒有裝置身分的瀏覽器設定檔仍需要明確核准。
- 每個瀏覽器設定檔都會產生唯一的裝置 ID，因此切換瀏覽器或清除瀏覽器資料都會需要重新配對。

</Note>

## 個人身分（瀏覽器本機）

控制 UI 支援每個瀏覽器各自的個人身分（顯示名稱與頭像），並附加到傳出訊息，以便在共享工作階段中標示來源。它存在於瀏覽器儲存空間中，範圍限定於目前的瀏覽器設定檔，不會同步到其他裝置，也不會在伺服器端持久保存，除了你實際傳送訊息上的一般逐字稿作者中繼資料。清除網站資料或切換瀏覽器會將它重設為空白。

相同的瀏覽器本機模式也適用於 assistant 頭像覆寫。上傳的 assistant 頭像只會在本機瀏覽器中覆蓋由閘道解析的身分，絕不會透過 `config.patch` 往返傳送。共享的 `ui.assistant.avatar` 設定欄位仍可供直接寫入該欄位的非 UI 用戶端使用（例如 scripted gateways 或自訂儀表板）。

## 執行階段設定端點

控制 UI 會從 `/control-ui-config.json` 擷取其執行階段設定，並相對於閘道的控制 UI base path 解析（例如當 UI 在 `/__openclaw__/` 下提供服務時，為 `/__openclaw__/control-ui-config.json`）。該端點受到與其餘 HTTP surface 相同的閘道驗證保護：未驗證的瀏覽器無法擷取它，成功擷取需要已有效的閘道 token/密碼、Tailscale Serve 身分，或 trusted-proxy 身分。

## 語言支援

控制 UI 可在首次載入時根據你的瀏覽器語系進行本地化。若要稍後覆寫，請開啟 **Overview -> Gateway Access -> Language**。語系選擇器位於 Gateway Access 卡片中，而不是 Appearance 底下。

- 支援的語系：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`ar`、`it`、`tr`、`uk`、`id`、`pl`、`th`、`vi`、`nl`、`fa`
- 非英文翻譯會在瀏覽器中延遲載入。
- 選取的語系會儲存在瀏覽器儲存空間中，並在日後造訪時重複使用。
- 缺少的翻譯鍵會 fallback 到英文。

文件翻譯會針對相同的非英文語系集合產生，但文件網站內建的 Mintlify 語言選擇器受限於 Mintlify 接受的語系代碼。泰文（`th`）與波斯文（`fa`）文件仍會在 publish repo 中產生；在 Mintlify 支援這些代碼前，它們可能不會出現在該選擇器中。

## 外觀主題

Appearance 面板保留內建的 Claw、Knot 與 Dash 主題，另有一個瀏覽器本機 tweakcn 匯入槽。若要匯入主題，請開啟 [tweakcn editor](https://tweakcn.com/editor/theme)，選擇或建立主題，點選 **Share**，然後將複製的主題連結貼到 Appearance。匯入器也接受 `https://tweakcn.com/r/themes/<id>` registry URL、像 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 這樣的 editor URL、相對 `/themes/<id>` 路徑、原始主題 ID，以及 `amethyst-haze` 等預設主題名稱。

Appearance 也包含瀏覽器本機的 Text size 設定。此設定會與其餘控制 UI 偏好設定一併儲存，套用於聊天文字、composer 文字、工具卡片與聊天側邊欄，並讓文字輸入至少保持 16px，避免行動版 Safari 在 focus 時自動縮放。

匯入的主題只會儲存在目前的瀏覽器設定檔中。它們不會寫入閘道設定，也不會跨裝置同步。替換匯入的主題會更新唯一的本機槽；清除它會在匯入的主題已被選取時，將作用中主題切回 Claw。

## 它目前能做什麼

<AccordionGroup>
  <Accordion title="聊天與通話">
    - 透過 Gateway WS 與模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 聊天記錄重新整理會請求有界的近期視窗，並套用每則訊息文字上限，因此大型工作階段不會迫使瀏覽器在聊天可用前先渲染完整逐字稿 payload。
    - 透過瀏覽器即時工作階段通話。OpenAI 使用直接 WebRTC，Google Live 透過 WebSocket 使用受限的一次性瀏覽器 token，而僅後端即時語音外掛使用閘道 relay transport。用戶端擁有的 provider 工作階段以 `talk.client.create` 開始；閘道 relay 工作階段以 `talk.session.create` 開始。relay 會將 provider 憑證保留在閘道上，同時瀏覽器透過 `talk.session.appendAudio` 串流麥克風 PCM，並透過 `talk.client.toolCall` 將 `openclaw_agent_consult` provider 工具呼叫轉送給閘道政策與較大的已設定 OpenClaw 模型，並透過 `talk.client.steer` 或 `talk.session.steer` 路由 active-run 語音導引。
    - 在聊天中串流工具呼叫與即時工具輸出卡片（agent 事件）。
    - Activity 分頁包含來自既有 `session.tool` / 工具事件傳遞的即時工具活動摘要，該摘要為瀏覽器本機、優先遮罩。

  </Accordion>
  <Accordion title="頻道、執行個體、工作階段、夢境整理">
    - 頻道：內建以及 bundled/external 外掛頻道狀態、QR 登入與每個頻道設定（`channels.status`、`web.login.*`、`config.patch`）。
    - 頻道 probe 重新整理會在較慢的 provider 檢查完成前保留先前快照可見，且當 probe 或 audit 超過其 UI 預算時，會標示部分快照。
    - 執行個體：presence 清單與重新整理（`system-presence`）。
    - 工作階段：預設列出 configured-agent 工作階段，從過時的 unconfigured agent 工作階段鍵 fallback，並套用每個工作階段的 model/thinking/fast/verbose/trace/reasoning 覆寫（`sessions.list`、`sessions.patch`）。
    - 夢境整理：夢境整理狀態、啟用/停用切換，以及 Dream Diary 讀取器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="排程、Skills、節點、exec 核准">
    - 排程工作：列出/新增/編輯/執行/啟用/停用 + 執行記錄（`cron.*`）。
    - Skills：狀態、啟用/停用、安裝、API key 更新（`skills.*`）。
    - 節點：清單 + caps（`node.list`）。
    - Exec 核准：編輯閘道或節點 allowlists + `exec host=gateway/node` 的 ask policy（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="設定">
    - 檢視/編輯 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - MCP 有專用設定頁面，適用於已設定的伺服器、啟用狀態、OAuth/filter/parallel 摘要、常用 operator 命令，以及 scoped `mcp` 設定編輯器。
    - 套用 + 以驗證重新啟動（`config.apply`）並喚醒最後的作用中工作階段。
    - 寫入包含 base-hash guard，以避免覆蓋並行編輯。
    - 寫入（`config.set`/`config.apply`/`config.patch`）會針對提交的設定 payload 中的 refs，預先檢查作用中 SecretRef 解析；未解析的作用中已提交 refs 會在寫入前遭拒。
    - 表單儲存會捨棄無法從已儲存設定還原的過時已遮罩 placeholders，同時保留仍可對應到已儲存 secrets 的已遮罩值。
    - Schema + 表單渲染（`config.schema` / `config.schema.lookup`，包含欄位 `title` / `description`、相符的 UI hints、直接子項摘要、nested object/wildcard/array/composition nodes 上的文件中繼資料，以及可用時的外掛 + 頻道 schemas）；只有當快照具有安全的 raw round-trip 時，Raw JSON 編輯器才可用。
    - 如果快照無法安全 round-trip 原始文字，控制 UI 會強制使用 Form 模式，並針對該快照停用 Raw 模式。
    - Raw JSON 編輯器的「Reset to saved」會保留 raw-authored 形狀（格式、註解、`$include` layout），而不是重新渲染 flattened snapshot，因此當快照可以安全 round-trip 時，外部編輯可在 reset 後保留下來。
    - 結構化 SecretRef 物件值會在表單文字輸入中以唯讀方式渲染，以防止意外的 object-to-string 損毀。

  </Accordion>
  <Accordion title="除錯、日誌、更新">
    - 除錯：狀態/健康情況/模型快照 + 事件日誌 + 手動 RPC 呼叫（`status`、`health`、`models.list`）。
    - 事件日誌包含控制 UI 重新整理/RPC 時序、慢速聊天/設定渲染時序，以及當瀏覽器公開那些 PerformanceObserver entry types 時，針對 long animation frames 或 long tasks 的瀏覽器回應性 entries。
    - 日誌：即時 tail 閘道檔案日誌，支援 filter/export（`logs.tail`）。
    - 更新：執行 package/git 更新 + 重新啟動（`update.run`），附重新啟動報告，然後在重新連線後輪詢 `update.status`，以驗證執行中的閘道版本。

  </Accordion>
  <Accordion title="排程工作面板備註">
    - 對於隔離工作，傳遞預設為公告摘要。如果你想要僅供內部執行，可以切換為無。
    - 選取公告時，會顯示頻道/目標欄位。
    - 網路鉤子模式使用 `delivery.mode = "webhook"`，並將 `delivery.to` 設為有效的 HTTP(S) 網路鉤子 URL。
    - 對於主要工作階段工作，可使用網路鉤子與無傳遞模式。
    - 進階編輯控制項包含執行後刪除、清除代理覆寫、排程精確/錯開選項、代理模型/思考覆寫，以及盡力傳遞切換。
    - 表單驗證會以欄位層級錯誤內嵌顯示；無效值會停用儲存按鈕，直到修正為止。
    - 設定 `cron.webhookToken` 可傳送專用 bearer token；若省略，網路鉤子傳送時不會包含驗證標頭。
    - 已棄用的後援：執行 `openclaw doctor --fix`，將已儲存且含有 `notify: true` 的舊版工作，從 `cron.webhook` 遷移為明確的每工作網路鉤子或完成傳遞。

  </Accordion>
</AccordionGroup>

## MCP 頁面

專用 MCP 頁面是 `mcp.servers` 下由 OpenClaw 管理的 MCP 伺服器操作員檢視。它本身不會啟動 MCP 傳輸；請用它檢查與編輯已儲存的設定，然後在需要即時伺服器證明時使用 `openclaw mcp doctor --probe`。

典型工作流程：

1. 從側邊欄開啟 **MCP**。
2. 檢查摘要卡中的總數、已啟用、OAuth 與已篩選伺服器數量。
3. 檢閱每個伺服器列的傳輸、啟用狀態、驗證、篩選器、逾時與命令提示。
4. 當伺服器應保留設定但排除於執行階段探索之外時，切換啟用狀態。
5. 編輯範圍限定的 `mcp` 設定區段，以設定伺服器定義、標頭、TLS/mTLS 路徑、OAuth 中繼資料、工具篩選器與 Codex 投影中繼資料。
6. 使用 **儲存** 寫入設定，或在執行中的閘道應套用已變更設定時使用 **儲存並發布**。
7. 當已編輯的程序需要靜態診斷、即時證明或清除快取執行階段時，從終端機執行 `openclaw mcp status --verbose`、`openclaw mcp doctor --probe` 或 `openclaw mcp reload`。

頁面會在呈現前遮蔽帶有憑證的類 URL 值，並在命令片段中引用伺服器名稱，讓複製的命令即使包含空格或 shell 中繼字元仍可運作。完整的命令列介面與設定參考位於 [MCP](/zh-TW/cli/mcp)。

## 活動分頁

活動分頁是即時工具活動的暫時性瀏覽器本機觀察器。它衍生自驅動聊天工具卡片的同一個閘道 `session.tool` / 工具事件串流；它不會新增另一個閘道事件系列、端點、持久活動儲存、指標摘要或外部觀察器串流。

活動項目只保留已清理的摘要，以及已遮蔽、截斷的輸出預覽。工具引數值不會儲存在活動狀態中；UI 會顯示引數已隱藏，且只記錄引數欄位數量。記憶體內清單會跟隨目前瀏覽器分頁，在控制 UI 內導覽時保留，並在頁面重新載入、切換工作階段或按下 **清除** 時重設。

## 聊天行為

<AccordionGroup>
  <Accordion title="傳送與歷史語意">
    - `chat.send` 是**非阻塞**的：它會立即以 `{ runId, status: "started" }` 確認，回應則透過 `chat` 事件串流傳送。受信任的控制 UI 用戶端也可能收到選用的 ACK 時序中繼資料，用於本機診斷。
    - 聊天上傳接受圖片與非影片檔案。圖片保留原生圖片路徑；其他檔案會儲存為受管理媒體，並在歷史中顯示為附件連結。
    - 使用相同的 `idempotencyKey` 重新傳送時，執行中會回傳 `{ status: "in_flight" }`，完成後會回傳 `{ status: "ok" }`。
    - 為了 UI 安全，`chat.history` 回應有大小上限。當轉錄項目過大時，閘道可能會截斷長文字欄位、省略沉重的中繼資料區塊，並以預留位置（`[chat.history omitted: message too large]`）取代超大型訊息。
    - 當可見的助理訊息在 `chat.history` 中被截斷時，側邊閱讀器可以視需要透過 `chat.message.get`，使用 `sessionKey`、必要時的作用中 `agentId`，以及轉錄 `messageId`，擷取完整的顯示正規化轉錄項目。如果閘道仍無法回傳更多內容，閱讀器會顯示明確的不可用狀態，而不是靜默重複截斷預覽。
    - 助理/生成的圖片會持久化為受管理媒體參照，並透過已驗證的閘道媒體 URL 回傳，因此重新載入不依賴原始 base64 圖片承載資料留在聊天歷史回應中。
    - 呈現 `chat.history` 時，控制 UI 會從可見助理文字中移除僅供顯示的內嵌指令標籤（例如 `[[reply_to_*]]` 與 `[[audio_as_voice]]`）、純文字工具呼叫 XML 承載資料（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 與截斷的工具呼叫區塊），以及外洩的 ASCII/全形模型控制 token，並省略其整個可見文字僅為精確靜默 token `NO_REPLY` / `no_reply` 或心跳偵測確認 token `HEARTBEAT_OK` 的助理項目。
    - 在作用中傳送與最後歷史重新整理期間，如果 `chat.history` 短暫回傳較舊的快照，聊天檢視會保留本機樂觀的使用者/助理訊息可見；一旦閘道歷史追上，標準轉錄就會取代這些本機訊息。
    - 即時 `chat` 事件是傳遞狀態，而 `chat.history` 是從持久工作階段轉錄重建。工具最終事件之後，控制 UI 會重新載入歷史，且只合併小段樂觀尾端；轉錄邊界記錄於 [WebChat](/zh-TW/web/webchat)。
    - `chat.inject` 會將助理備註附加到工作階段轉錄，並廣播 `chat` 事件以供僅 UI 更新使用（沒有代理執行，沒有頻道傳遞）。
    - 聊天標頭會在工作階段選擇器前顯示代理篩選器，且工作階段選擇器受所選代理範圍限制。切換代理時只會顯示與該代理繫結的工作階段，若尚未儲存任何儀表板工作階段，則回退到該代理的主要工作階段。
    - 在桌面寬度下，聊天控制項會保持在一列緊湊排列，並在向下捲動轉錄時收合；向上捲動、回到頂端或抵達底部時會還原控制項。
    - 連續重複的純文字訊息會呈現為一個帶有計數徽章的泡泡。帶有圖片、附件、工具輸出或畫布預覽的訊息不會收合。
    - 聊天標頭的模型與思考選擇器會立即透過 `sessions.patch` 修補作用中工作階段；它們是持久工作階段覆寫，不是僅限單次回合的傳送選項。
    - 如果你在同一工作階段的模型選擇器變更仍在儲存時傳送訊息，撰寫器會等待該工作階段修補完成後才呼叫 `chat.send`，讓傳送使用所選模型。
    - 在控制 UI 中輸入 `/new` 會建立並切換到與新增聊天相同的新儀表板工作階段，除非已設定 `session.dmScope: "main"` 且目前父項是代理的主要工作階段；在該情況下，它會就地重設主要工作階段。輸入 `/reset` 會保留閘道對目前工作階段的明確就地重設。
    - 聊天模型選擇器會要求閘道的已設定模型檢視。如果存在 `agents.defaults.models`，該允許清單會驅動選擇器，包括可讓供應商範圍型目錄保持動態的 `provider/*` 項目。否則，選擇器會顯示明確的 `models.providers.*.models` 項目，以及具有可用驗證的供應商。完整目錄仍可透過除錯 `models.list` RPC 搭配 `view: "all"` 取得。
    - 當新的閘道工作階段用量報告包含目前情境 token 時，聊天撰寫器區域會顯示緊湊的情境用量指示器。它會在高情境壓力時切換為警告樣式，並在建議的壓縮層級顯示緊湊按鈕，以執行一般工作階段壓縮路徑。過時的 token 快照會隱藏，直到閘道再次回報新的用量。

  </Accordion>
  <Accordion title="語音交談模式（瀏覽器即時）">
    語音交談模式使用已註冊的即時語音供應商。使用 `talk.realtime.provider: "openai"` 加上 `openai` API 金鑰驗證設定檔、`talk.realtime.providers.openai.apiKey` 或 `OPENAI_API_KEY` 來設定 OpenAI；OpenAI OAuth 設定檔不會設定 Realtime 語音。使用 `talk.realtime.provider: "google"` 加上 `talk.realtime.providers.google.apiKey` 來設定 Google。瀏覽器永遠不會收到標準供應商 API 金鑰。OpenAI 會收到 WebRTC 的暫時性 Realtime 用戶端密鑰。Google Live 會收到用於瀏覽器 WebSocket 工作階段的一次性受限 Live API 驗證 token，且指示與工具宣告會由閘道鎖定在 token 中。只公開後端即時橋接的供應商會透過閘道中繼傳輸執行，因此憑證與供應商 socket 會留在伺服器端，而瀏覽器音訊會透過已驗證的閘道 RPC 移動。Realtime 工作階段提示由閘道組裝；`talk.client.create` 不接受呼叫者提供的指示覆寫。

    聊天撰寫器在語音交談開始/停止按鈕旁包含一個語音交談選項按鈕。這些選項會套用到下一個語音交談工作階段，並可覆寫供應商、傳輸、模型、語音、推理努力程度、VAD 閾值、靜默持續時間與前綴填補。選項空白時，閘道會使用可用的已設定預設值或供應商預設值。選取閘道中繼會強制使用後端中繼路徑；選取 WebRTC 會讓工作階段由用戶端擁有，且若供應商無法建立瀏覽器工作階段，會失敗而不是靜默回退到中繼。

    在聊天撰寫器中，語音交談控制項是麥克風聽寫按鈕旁的波形按鈕。語音交談開始時，撰寫器狀態列會顯示 `Connecting Talk...`，音訊連線時顯示 `Talk live`，或在即時工具呼叫透過 `talk.client.toolCall` 諮詢已設定的較大型模型時顯示 `Asking OpenClaw...`。

    維護者即時煙霧測試：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 會驗證 OpenAI 後端 WebSocket 橋接、OpenAI 瀏覽器 WebRTC SDP 交換、Google Live 受限 token 瀏覽器 WebSocket 設定，以及使用假麥克風媒體的閘道中繼瀏覽器配接器。此命令只會列印供應商狀態，不會記錄密鑰。

  </Accordion>
  <Accordion title="停止與中止">
    - 按一下 **停止**（呼叫 `chat.abort`）。
    - 執行作用中時，正常後續訊息會進入佇列。按一下佇列訊息上的 **導向**，將該後續訊息注入執行中的回合。
    - 輸入 `/stop`（或獨立的中止片語，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以帶外中止。
    - `chat.abort` 支援 `{ sessionKey }`（沒有 `runId`），可中止該工作階段的所有作用中執行。

  </Accordion>
  <Accordion title="中止部分內容保留">
    - 當執行被中止時，部分助理文字仍可顯示在 UI 中。
    - 當存在已緩衝輸出時，閘道會將已中止的部分助理文字持久化到轉錄歷史中。
    - 持久化項目包含中止中繼資料，讓轉錄消費者可以區分中止部分內容與正常完成輸出。

  </Accordion>
</AccordionGroup>

## PWA 安裝與 Web Push

控制 UI 隨附 `manifest.webmanifest` 與 service worker，因此現代瀏覽器可以將它安裝為獨立 PWA。Web Push 可讓閘道即使在分頁或瀏覽器視窗未開啟時，也能以通知喚醒已安裝的 PWA。

如果頁面在 OpenClaw 更新後立即顯示 **通訊協定不符**，請先使用 `openclaw dashboard` 重新開啟儀表板並強制重新整理頁面。如果仍然失敗，請清除儀表板來源的網站資料，或在私密瀏覽器視窗中測試；舊分頁或瀏覽器 service-worker 快取可能會讓更新前的控制 UI 套件持續對較新的閘道執行。

| 表面                                                  | 功能                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 資訊清單。瀏覽器在可連線後會提供「安裝應用程式」。             |
| `ui/public/sw.js`                                     | 處理 `push` 事件與通知點擊的 Service Worker。                      |
| `push/vapid-keys.json`（位於 OpenClaw 狀態目錄下）    | 自動產生的 VAPID 金鑰組，用於簽署 Web Push 承載資料。              |
| `push/web-push-subscriptions.json`                    | 持久化的瀏覽器訂閱端點。                                           |

當你想固定金鑰（用於多主機部署、密鑰輪替或測試）時，請在閘道程序上透過環境變數覆寫 VAPID 金鑰組：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（預設為 `https://openclaw.ai`）

控制 UI 使用這些受範圍限制的閘道方法來註冊與測試瀏覽器訂閱：

- `push.web.vapidPublicKey` — 擷取作用中的 VAPID 公開金鑰。
- `push.web.subscribe` — 註冊 `endpoint` 加上 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 移除已註冊的端點。
- `push.web.test` — 將測試通知傳送到呼叫者的訂閱。

<Note>
Web Push 獨立於 iOS APNS 轉送路徑（請參閱 [設定](/zh-TW/gateway/configuration) 了解以轉送為後端的推播）以及現有的 `push.test` 方法；後者以原生行動裝置配對為目標。
</Note>

## 託管嵌入

Assistant 訊息可以使用 `[embed ...]` 短代碼內嵌呈現託管的網頁內容。iframe 沙盒政策由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    停用託管嵌入內的指令碼執行。
  </Tab>
  <Tab title="scripts (default)">
    允許互動式嵌入，同時保留來源隔離；這是預設值，通常足以支援自成一體的瀏覽器遊戲/小工具。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 之上新增 `allow-same-origin`，用於刻意需要更高權限的同站文件。
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
只有在嵌入文件確實需要同源行為時才使用 `trusted`。對於大多數由代理程式產生的遊戲與互動畫布，`scripts` 是較安全的選擇。
</Warning>

絕對外部 `http(s)` 嵌入 URL 預設仍會被封鎖。如果你刻意希望 `[embed url="https://..."]` 載入第三方頁面，請設定 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天訊息寬度

分組聊天訊息使用易讀的預設最大寬度。寬螢幕部署可以透過設定 `gateway.controlUi.chatMessageMaxWidth` 來覆寫它，而不需要修補隨附的 CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

此值在送達瀏覽器前會先驗證。支援的值包含一般長度與百分比，例如 `960px` 或 `82%`，以及受限制的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 與 `fit-content(...)` 寬度運算式。

## Tailnet 存取（建議）

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    讓閘道維持在 loopback，並讓 Tailscale Serve 以 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    開啟：

    - `https://<magicdns>/`（或你設定的 `gateway.controlUi.basePath`）

    預設情況下，當 `gateway.auth.allowTailscale` 為 `true` 時，控制 UI/WebSocket Serve 請求可以透過 Tailscale 身分標頭（`tailscale-user-login`）進行驗證。OpenClaw 會透過 `tailscale whois` 解析 `x-forwarded-for` 位址並與標頭比對來驗證身分，而且只有在請求命中 loopback 並帶有 Tailscale 的 `x-forwarded-*` 標頭時才接受。對於具有瀏覽器裝置身分的控制 UI 操作者工作階段，這個已驗證的 Serve 路徑也會略過裝置配對往返；沒有裝置的瀏覽器與節點角色連線仍會遵循一般裝置檢查。如果即使是 Serve 流量也要要求明確的共享密鑰憑證，請設定 `gateway.auth.allowTailscale: false`。接著使用 `gateway.auth.mode: "token"` 或 `"password"`。

    對於該非同步 Serve 身分路徑，同一用戶端 IP 與驗證範圍的驗證失敗嘗試，會在寫入速率限制之前序列化。因此，來自同一瀏覽器的並行錯誤重試，第二個請求可能會顯示 `retry later`，而不是兩個單純的不相符結果並行競爭。

    <Warning>
    無權杖 Serve 驗證假設閘道主機是可信任的。如果不受信任的本機程式碼可能在該主機上執行，請要求 token/password 驗證。
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    然後開啟：

    - `http://<tailscale-ip>:18789/`（或你設定的 `gateway.controlUi.basePath`）

    將相符的共享密鑰貼到 UI 設定中（以 `connect.params.auth.token` 或 `connect.params.auth.password` 傳送）。

  </Tab>
</Tabs>

## 不安全的 HTTP

如果你透過純 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）開啟儀表板，瀏覽器會在**非安全環境**中執行並封鎖 WebCrypto。預設情況下，OpenClaw 會**封鎖**沒有裝置身分的控制 UI 連線。

文件化的例外：

- 僅限 localhost 的不安全 HTTP 相容性，搭配 `gateway.controlUi.allowInsecureAuth=true`
- 透過 `gateway.auth.mode: "trusted-proxy"` 成功完成操作者控制 UI 驗證
- 緊急破窗用的 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

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

    - 它允許 localhost 控制 UI 工作階段在非安全 HTTP 環境中不帶裝置身分繼續進行。
    - 它不會繞過配對檢查。
    - 它不會放寬遠端（非 localhost）裝置身分要求。

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
    `dangerouslyDisableDeviceAuth` 會停用控制 UI 裝置身分檢查，屬於嚴重的安全性降級。緊急使用後請迅速還原。
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - 成功的 trusted-proxy 驗證可以允許沒有裝置身分的**操作者**控制 UI 工作階段。
    - 這**不會**延伸到節點角色控制 UI 工作階段。
    - 同主機 loopback 反向代理仍不滿足 trusted-proxy 驗證；請參閱 [受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

請參閱 [Tailscale](/zh-TW/gateway/tailscale) 取得 HTTPS 設定指南。

## 內容安全政策

控制 UI 隨附嚴格的 `img-src` 政策：只允許**同源**資產、`data:` URL，以及本機產生的 `blob:` URL。遠端 `http(s)` 與協定相對圖片 URL 會被瀏覽器拒絕，且不會發出網路擷取。

實務上的意義：

- 以相對路徑提供的頭像與圖片（例如 `/avatars/<id>`）仍會呈現，包括 UI 擷取並轉換成本機 `blob:` URL 的已驗證頭像路由。
- 內嵌 `data:image/...` URL 仍會呈現（對協定內承載資料很有用）。
- 控制 UI 建立的本機 `blob:` URL 仍會呈現。
- 頻道中繼資料發出的遠端頭像 URL 會在控制 UI 的頭像輔助程式中被移除，並替換為內建標誌/徽章，因此遭入侵或惡意的頻道無法強迫操作者瀏覽器擷取任意遠端圖片。

你不需要變更任何設定即可取得此行為 — 它永遠啟用且不可設定。

## 頭像路由驗證

當設定了閘道驗證時，控制 UI 頭像端點需要與 API 其餘部分相同的閘道權杖：

- `GET /avatar/<agentId>` 只會向已驗證的呼叫者回傳頭像圖片。`GET /avatar/<agentId>?meta=1` 會在相同規則下回傳頭像中繼資料。
- 對任一路由的未驗證請求都會被拒絕（與相鄰的 assistant-media 路由一致）。這可防止頭像路由在其他方面受保護的主機上洩漏代理程式身分。
- 控制 UI 本身在擷取頭像時，會將閘道權杖作為 bearer 標頭轉送，並使用已驗證的 blob URL，因此圖片仍會在儀表板中呈現。

如果你停用閘道驗證（不建議在共享主機上這麼做），頭像路由也會變成未驗證，與閘道其餘部分一致。

## Assistant 媒體路由驗證

當設定了閘道驗證時，assistant 本機媒體預覽會使用兩步驟路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 需要一般控制 UI 操作者驗證。瀏覽器在檢查可用性時，會將閘道權杖作為 bearer 標頭傳送。
- 成功的中繼資料回應會包含一個短效 `mediaTicket`，其範圍限定於該確切來源路徑。
- 瀏覽器呈現的圖片、音訊、影片與文件 URL 使用 `mediaTicket=<ticket>`，而不是作用中的閘道權杖或密碼。票證會快速過期，且不能授權不同來源。

這讓一般媒體呈現能與瀏覽器原生媒體元素相容，同時不會把可重複使用的閘道憑證放進可見的媒體 URL。

## 建置 UI

閘道會從 `dist/control-ui` 提供靜態檔案。使用以下命令建置：

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

## 空白控制 UI 頁面

如果瀏覽器載入空白儀表板，而 DevTools 沒有顯示有用錯誤，可能是擴充功能或早期內容指令碼阻止了 JavaScript 模組應用程式進行評估。靜態頁面包含一個純 HTML 復原面板，當 `<openclaw-app>` 在啟動後未註冊時會顯示。

變更瀏覽器環境後，使用面板的**再試一次**動作，或在完成以下檢查後手動重新載入：

- 停用會注入所有頁面的擴充功能，尤其是具有 `<all_urls>` 內容指令碼的擴充功能。
- 嘗試私人視窗、乾淨的瀏覽器設定檔，或另一個瀏覽器。
- 保持閘道執行，並在變更瀏覽器後驗證相同的儀表板 URL。

## 偵錯/測試：開發伺服器 + 遠端閘道

控制 UI 是靜態檔案；WebSocket 目標可設定，並且可以不同於 HTTP 來源。當你想在本機使用 Vite 開發伺服器，但閘道在其他地方執行時，這很方便。

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
    - 如果你透過 `gatewayUrl` 傳入完整的 `ws://` 或 `wss://` 端點，請對 `gatewayUrl` 值進行 URL 編碼，讓瀏覽器能正確解析查詢字串。
    - 只要可能，`token` 應透過 URL 片段（`#token=...`）傳遞。片段不會傳送到伺服器，可避免請求記錄和 Referer 外洩。舊版 `?token=` 查詢參數仍會為相容性匯入一次，但僅作為備援，並會在啟動程序後立即移除。
    - `password` 只保留在記憶體中。
    - 設定 `gatewayUrl` 時，UI 不會退回使用設定或環境憑證。請明確提供 `token`（或 `password`）。缺少明確憑證會造成錯誤。
    - 當閘道位於 TLS 後方時（Tailscale Serve、HTTPS proxy 等），請使用 `wss://`。
    - `gatewayUrl` 只接受在頂層視窗中使用（不可嵌入），以防止點擊劫持。
    - 公開的非回送 Control UI 部署必須明確設定 `gateway.controlUi.allowedOrigins`（完整來源）。從回送、RFC1918/link-local、`.local`、`.ts.net` 或 Tailscale CGNAT 主機載入的私有同來源 LAN/Tailnet，可在不啟用 Host-header 備援的情況下被接受。
    - 閘道啟動時可能會根據有效的執行階段繫結和連接埠，植入如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>` 等本機來源，但遠端瀏覽器來源仍需要明確項目。
    - 除了嚴格控管的本機測試外，請勿使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允許任何瀏覽器來源，而不是「符合我正在使用的任何主機」。
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
- [網頁聊天](/zh-TW/web/webchat) — 以瀏覽器為基礎的聊天介面
