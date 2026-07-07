---
read_when:
    - 你想要從瀏覽器操作閘道
    - 你想要不透過 SSH 通道存取 Tailnet
sidebarTitle: Control UI
summary: 閘道的瀏覽器式控制介面（聊天、活動、節點、設定）
title: 控制介面
x-i18n:
    generated_at: "2026-07-06T21:52:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: faa16914b33348ae5bc194936453ce822d740c6369e005c1a16c0de399ed45a5
    source_path: web/control-ui.md
    workflow: 16
---

Control UI 是由閘道提供服務的小型 **Vite + Lit** 單頁應用程式：

- 預設：`http://<host>:18789/`
- 選用前置路徑：設定 `gateway.controlUi.basePath`（例如 `/openclaw`）

它會在相同連接埠上**直接與閘道 WebSocket** 通訊。

## 快速開啟（本機）

如果閘道在同一台電腦上執行，請開啟 [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）。

如果頁面載入失敗，請先啟動閘道：`openclaw gateway`。

<Note>
在原生 Windows LAN 繫結上，即使 `127.0.0.1` 可在閘道主機上運作，Windows 防火牆或組織管理的群組原則仍可能封鎖公告的 LAN URL。請在 Windows 主機上執行 `openclaw gateway status --deep`；它會回報可能被封鎖的連接埠、設定檔不相符，以及原則可能忽略的本機防火牆規則。
</Note>

驗證會在 WebSocket 握手期間透過下列方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 當 `gateway.auth.allowTailscale: true` 時的 Tailscale Serve 身分標頭
- 當 `gateway.auth.mode: "trusted-proxy"` 時的信任 Proxy 身分標頭

儀表板設定面板會為目前瀏覽器分頁工作階段與選取的閘道 URL 保留權杖；密碼不會被保留。首次連線時，入門設定通常會為共享密鑰驗證產生閘道權杖，但當 `gateway.auth.mode` 為 `"password"` 時，也可以使用密碼驗證。

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

將已配對的瀏覽器從讀取存取切換為寫入/管理員存取時，會被視為核准升級，而不是靜默重新連線：OpenClaw 會保留舊核准有效、封鎖較廣範圍的重新連線，並要求你明確核准新的範圍組合。

核准後，裝置會被記住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤銷它，否則不需要重新核准。請參閱[裝置命令列介面](/zh-TW/cli/devices)，了解權杖輪替、撤銷，以及 Paperclip / `openclaw_gateway` 首次執行核准流程。

<Note>
- 直接 local loopback 瀏覽器連線（`127.0.0.1` / `localhost`）會自動核准。
- 當 `gateway.auth.allowTailscale: true`、Tailscale 身分驗證通過，且瀏覽器提供其裝置身分時，Tailscale Serve 可略過 Control UI 操作者工作階段的配對往返。無裝置瀏覽器與節點角色連線仍會遵循一般裝置檢查。
- 直接 Tailnet 繫結、LAN 瀏覽器連線，以及沒有裝置身分的瀏覽器設定檔仍需要明確核准。
- 每個瀏覽器設定檔都會產生唯一的裝置 ID，因此切換瀏覽器或清除瀏覽器資料都需要重新配對。

</Note>

## 配對行動裝置

已配對的管理員可以建立 iOS/Android 連線 QR，而不必開啟終端機：

<Steps>
  <Step title="開啟行動裝置配對">
    選取**節點**，然後在**裝置**卡片中按一下**配對行動裝置**。
  </Step>
  <Step title="連接手機">
    在 OpenClaw 行動應用程式中，開啟**設定** → **閘道**並掃描 QR 碼。你也可以改為複製並貼上設定碼。
  </Step>
  <Step title="確認連線">
    官方 iOS/Android 應用程式會自動連線。如果**裝置**顯示待處理要求，請在核准前檢閱其角色和範圍。
  </Step>
</Steps>

建立設定碼需要 `operator.admin`；沒有此權限的工作階段會停用按鈕。設定碼包含短效啟動憑證，因此在有效期間內，請像對待密碼一樣保護 QR 與複製的程式碼。若要遠端配對，閘道必須解析為 `wss://`（例如透過 Tailscale Serve/Funnel）；純 `ws://` 僅限於 loopback 與私人 LAN 位址。請參閱[配對](/zh-TW/channels/pairing#pair-from-the-control-ui-recommended)，了解完整的安全性與備援詳細資料。

## 個人身分（瀏覽器本機）

Control UI 支援每個瀏覽器的個人身分（顯示名稱與頭像），附加到外送訊息，用於共享工作階段中的歸因。它存在於瀏覽器儲存空間中，範圍限定於目前瀏覽器設定檔，不會同步到其他裝置，也不會在伺服器端保留，除了你傳送訊息上的一般逐字稿作者中繼資料。清除網站資料或切換瀏覽器會將其重設為空白。

助理頭像覆寫遵循相同的瀏覽器本機模式：上傳的覆寫會在本機覆蓋閘道解析的身分，且絕不會透過 `config.patch` 往返。共享的 `ui.assistant.avatar` 設定欄位仍可供直接寫入該欄位的非 UI 用戶端使用。

## 執行階段設定端點

Control UI 會從 `/control-ui-config.json` 擷取其執行階段設定，該路徑會相對於閘道的 Control UI 基礎路徑解析（例如在基礎路徑 `/__openclaw__/` 下為 `/__openclaw__/control-ui-config.json`）。此端點與其餘 HTTP 介面一樣受相同閘道驗證保護：未驗證的瀏覽器無法擷取它，而成功擷取需要有效的閘道權杖/密碼、Tailscale Serve 身分，或信任 Proxy 身分。

## 閘道主機狀態

在簡易檢視中開啟**設定**，即可看到**閘道主機**卡片，其中包含閘道機器、LAN 位址、作業系統、執行階段、正常運作時間、CPU 負載、記憶體，以及狀態磁碟區磁碟空間。卡片在可見時會每 10 秒透過 `system.info` 閘道 RPC 重新整理一次，這需要 `operator.read` 範圍。較舊的閘道與沒有該範圍的連線會省略此卡片。

## 語言支援

Control UI 會在首次載入時根據你的瀏覽器地區設定進行在地化。若要稍後覆寫，請開啟**概覽 -> 閘道存取 -> 語言**（選擇器位於閘道存取卡片中，而不是外觀下）。

- 支援的地區設定：`en`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `id`, `it`, `ja-JP`, `ko`, `nl`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- 非英文翻譯會在瀏覽器中延遲載入。
- 選取的地區設定會儲存在瀏覽器儲存空間中，並在未來造訪時重複使用。
- 缺少的翻譯鍵會退回英文。

文件翻譯會針對相同的非英文地區設定集合產生，但文件網站內建的 Mintlify 語言選擇器只會列出 Mintlify 接受的地區設定代碼。泰文（`th`）與波斯文（`fa`）文件仍會在發布 repo 中產生；在 Mintlify 支援這些代碼前，它們可能不會出現在該選擇器中。

## 外觀主題

外觀面板有內建的 Claw、Knot 與 Dash 主題（Claw 為預設），外加一個瀏覽器本機 tweakcn 匯入槽。若要匯入主題，請開啟 [tweakcn 編輯器](https://tweakcn.com/editor/theme)，選擇或建立主題，按一下**分享**，並將複製的連結貼到外觀中。匯入器也接受 `https://tweakcn.com/r/themes/<id>` 登錄 URL、像 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 這樣的編輯器 URL、相對 `/themes/<id>` 路徑、原始主題 ID，以及 `amethyst-haze` 等預設主題名稱。

匯入的主題只會儲存在目前瀏覽器設定檔中；它們不會寫入閘道設定，也不會跨裝置同步。替換匯入的主題會更新唯一的本機槽；如果匯入的主題原本為作用中，清除它會切回 Claw。

外觀也有瀏覽器本機的文字大小設定，會與其餘 Control UI 偏好設定一起儲存。它會套用到聊天文字、編寫器文字、工具卡片與聊天側邊欄，並將文字輸入維持至少 16px，讓行動版 Safari 在聚焦時不會自動縮放。

## 側邊欄導覽

側邊欄會將導覽釘選在可捲動的最近工作階段清單上方，清單分為**已釘選**、每個自訂群組一個區段（工作階段 `category`，依字母排序），以及其餘項目的**未分組**。每個已釘選工作階段都會保持可見，而未釘選工作階段則保有獨立的九項最近預算。開啟可見工作階段會移動選取醒目提示，而不會重新排序列；不在清單中的深層連結會顯示在頂端。自上次讀取後有新活動的工作階段會顯示未讀點，開啟後會標示為已讀。每個工作階段列都有內容選單（kebab 按鈕或按一下右鍵），包含釘選/取消釘選、標示為未讀/已讀、重新命名、分叉、移至群組（包含新群組與從群組移除）、封存與刪除；觸控版面會保持直接釘選與選單控制項可見。多代理設定會在未分組標頭中顯示精簡範圍控制項。**概覽**是唯一預設釘選的目的地；展開**更多**即可前往其他所有目的地。在更多下選取**自訂側邊欄**，或在導覽區域按一下右鍵，即可釘選或取消釘選目的地並還原預設值。已釘選集合與更多展開狀態會儲存在目前瀏覽器設定檔中，並在重新載入後保留。

精簡頁尾會將連線狀態、**設定**、**文件**、行動裝置配對與側邊欄收合切換放在一起。收合會將側邊欄縮成圖示軌，展開按鈕位於頁尾堆疊頂端。在抽屜中斷點時，頂部列的漢堡按鈕會取代該控制項。

## 它目前可以做什麼

<AccordionGroup>
  <Accordion title="聊天與語音">
    - 透過閘道 WS 與模型聊天（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）。
    - 聊天記錄重新整理會要求一個有界的最近視窗，並對每則訊息設定文字上限，因此大型工作階段不會迫使瀏覽器在聊天可用前先渲染完整逐字稿酬載。
    - 將滑鼠停留在公開 GitHub issue 或 pull request 連結上，或以鍵盤聚焦該連結時，會顯示其狀態、標題、作者、近期活動、留言與變更統計。已連線的閘道會擷取並快取公開中繼資料，而不會變更連結目標，包括 UI 使用遠端閘道時。閘道會在確認儲存庫為公開後，於可用時使用 `GH_TOKEN` 或 `GITHUB_TOKEN`；否則會使用 GitHub 的匿名 API 並搭配較長快取。
    - 透過瀏覽器即時工作階段進行語音交談。OpenAI 使用直接 WebRTC，Google Live 透過 WebSocket 使用受限的一次性瀏覽器權杖，而僅後端即時語音外掛則使用閘道中繼傳輸。用戶端擁有的提供者工作階段以 `talk.client.create` 開始；閘道中繼工作階段以 `talk.session.create` 開始。中繼會將提供者憑證保留在閘道上，同時瀏覽器會透過 `talk.session.appendAudio` 串流麥克風 PCM，並透過 `talk.client.toolCall` 轉送 `openclaw_agent_consult` 提供者工具呼叫，以套用閘道政策與較大的已設定 OpenClaw 模型，且會透過 `talk.client.steer` 或 `talk.session.steer` 路由作用中執行的語音導引。
    - 在聊天中串流工具呼叫與即時工具輸出卡片（代理事件）。
    - 活動分頁提供瀏覽器本機、以遮蔽優先的即時工具活動摘要，來自既有的 `session.tool` / 工具事件傳遞。

  </Accordion>
  <Accordion title="通道、執行個體、工作階段、夢境整理">
    - 通道：內建以及隨附/外部外掛通道狀態、QR 登入和各通道設定（`channels.status`、`web.login.*`、`config.patch`）。
    - 通道探測重新整理會在較慢的供應商檢查完成期間保持上一個快照可見，並在探測或稽核超過其 UI 預算時標示部分快照。
    - 執行個體：在線清單與重新整理（`system-presence`）。
    - 工作階段：預設列出已設定代理的工作階段、釘選常用工作階段、重新命名、封存或還原非使用中工作階段、從過期的未設定代理工作階段鍵回退，並套用各工作階段的模型/思考/快速/詳細/追蹤/推理覆寫（`sessions.list`、`sessions.patch`）。釘選的工作階段會排序在最近未釘選工作階段上方；已封存工作階段位於工作階段頁面的封存檢視中，並保留其逐字稿。若工作階段自上次讀取後有活動，列會顯示未讀圓點，並提供標為未讀/標為已讀動作（`sessions.patch { unread }`），以及將逐字稿分支到新工作階段的 Fork 動作（`sessions.create { parentSessionKey, fork: true }`）。
    - 工作階段分組：Group by 控制項會依自訂群組、通道、種類、代理或日期，將工作階段表格整理成區段。自訂群組會透過 `sessions.patch`（`category`）按工作階段保存，因此從訊息通道（Discord、Telegram、WhatsApp，...）開始的工作階段也可以分類；可將列拖曳到區段上，或使用各列的群組選擇器來指派群組，並使用 New group 動作建立群組。
    - 夢境整理：夢境整理狀態、啟用/停用切換，以及 Dream Diary 閱讀器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="排程、工作、Skills、節點、執行核准">
    - 排程工作：列出/新增/編輯/執行/啟用/停用，以及執行歷史記錄（`cron.*`）。
    - 工作：即時的作用中與近期背景工作帳本，含連結的工作階段與取消功能（`tasks.*`）。
    - Skills：狀態、啟用/停用、安裝、API 金鑰更新（`skills.*`）。
    - 節點：列出與能力上限（`node.list`）、建立行動裝置設定碼，以及核准裝置配對（`device.pair.*`）。
    - 執行核准：編輯閘道或節點允許清單，並為 `exec host=gateway/node` 詢問政策（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="設定">
    - 檢視/編輯 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - MCP 有專用設定頁面，可用於已設定伺服器、啟用狀態、OAuth/篩選/平行摘要、常用操作員命令，以及限定範圍的 `mcp` 設定編輯器。
    - 透過驗證套用並重新啟動（`config.apply`），然後喚醒最後作用中的工作階段。
    - 寫入包含 base-hash 防護，以避免覆蓋並行編輯。
    - 寫入（`config.set`/`config.apply`/`config.patch`）會對提交的設定承載內容中的 refs 預先檢查作用中 SecretRef 解析；未解析的作用中已提交 refs 會在寫入前遭拒。
    - 表單儲存會捨棄無法從已儲存設定還原的過期遮蔽預留位置，同時保留仍對應到已儲存秘密的遮蔽值。
    - 結構描述與表單算繪來自 `config.schema` / `config.schema.lookup`，包含欄位 `title`/`description`、相符的 UI 提示、直接子項摘要、巢狀物件/萬用字元/陣列/組合節點上的文件中繼資料，以及可用時的外掛與通道結構描述。Raw JSON 編輯器只有在快照具備安全的原始往返時才可用；否則 Control UI 會強制使用表單模式。
    - Raw JSON 編輯器的「Reset to saved」會保留原始撰寫形狀（格式、註解、`$include` 版面配置），而不是重新算繪扁平化快照，因此當快照可以安全往返時，外部編輯會在重設後保留下來。
    - 結構化 SecretRef 物件值會在表單文字輸入中以唯讀方式算繪，以避免意外的物件轉字串損毀。

  </Accordion>
  <Accordion title="使用量">
    - 由工作階段衍生的權杖與預估成本分析會與供應商計費保持分離。
    - 供應商卡片會呼叫 `usage.status`，並顯示已設定供應商外掛回報的即時計畫名稱、配額時段、餘額、花費與預算。
    - 供應商使用量失敗不會阻擋工作階段/成本儀表板；不可用的供應商卡片會顯示自己的錯誤狀態。

  </Accordion>
  <Accordion title="除錯、記錄、更新">
    - 除錯：狀態/健康情況/模型快照、事件記錄，以及手動 RPC 呼叫（`status`、`health`、`models.list`）。
    - 事件記錄包含 Control UI 重新整理/RPC 計時、較慢的聊天/設定算繪計時，以及當瀏覽器公開這些 PerformanceObserver 項目類型時，長動畫影格或長工作所產生的瀏覽器回應性項目。
    - 記錄：即時追蹤閘道檔案記錄，含篩選/匯出（`logs.tail`）。
    - 更新：執行套件/git 更新並重新啟動（`update.run`），附重新啟動報告，然後在重新連線後輪詢 `update.status`，以驗證正在執行的閘道版本。

  </Accordion>
  <Accordion title="排程工作面板備註">
    - 對於隔離工作，傳遞預設為公告摘要；若為僅內部執行，請切換為無。
    - 選取公告時，會顯示通道/目標欄位。
    - 網路鉤子模式使用 `delivery.mode = "webhook"`，並將 `delivery.to` 設為有效的 HTTP(S) 網路鉤子 URL。
    - 對於主工作階段工作，可使用網路鉤子與無傳遞模式。
    - 進階編輯控制項包含執行後刪除、清除代理覆寫、排程精確/錯開選項、代理模型/思考覆寫，以及盡力傳遞切換。
    - 表單驗證會以欄位層級錯誤內嵌顯示；無效值會停用儲存按鈕，直到修正為止。
    - 設定 `cron.webhookToken` 以傳送專用 bearer token；若省略，網路鉤子會在沒有 auth header 的情況下傳送。
    - `cron.webhook` 是已淘汰的舊版回退：執行 `openclaw doctor --fix`，將仍使用 `notify: true` 的已儲存工作遷移到明確的逐工作網路鉤子或完成傳遞。

  </Accordion>
</AccordionGroup>

## MCP 頁面

專用 MCP 頁面是針對 `mcp.servers` 下 OpenClaw 管理的 MCP 伺服器所提供的操作員檢視。它本身不會啟動 MCP 傳輸；可用來檢查與編輯已儲存設定，然後在需要即時伺服器證明時使用 `openclaw mcp doctor --probe`。

典型工作流程：

1. 從側邊欄開啟 **MCP**。
2. 檢查摘要卡片中的總數、已啟用、OAuth 與已篩選伺服器數量。
3. 檢閱每個伺服器列的傳輸、啟用狀態、驗證、篩選器、逾時與命令提示。
4. 當伺服器應維持設定但不納入執行階段探索時，切換啟用狀態。
5. 編輯限定範圍的 `mcp` 設定區段，用於伺服器定義、標頭、TLS/mTLS 路徑、OAuth 中繼資料、工具篩選器，以及 Codex 投影中繼資料。
6. 使用 **Save** 進行設定寫入，或在執行中的閘道應套用已變更設定時使用 **Save & Publish**。
7. 從終端機執行 `openclaw mcp status --verbose`、`openclaw mcp doctor --probe` 或 `openclaw mcp reload`，以進行靜態診斷、即時證明或清除快取的執行階段。

頁面會在算繪前遮蔽帶有認證的類 URL 值，並在命令片段中引用伺服器名稱，讓複製的命令在名稱包含空格或 shell 中繼字元時仍可運作。完整命令列介面與設定參考：[MCP](/zh-TW/cli/mcp)。

## 活動分頁

Activity 分頁是短暫的瀏覽器本機觀察器，用於即時工具活動，衍生自與聊天工具卡片相同的閘道 `session.tool` / 工具事件串流。它不會新增另一個閘道事件家族、端點、持久活動儲存、指標饋送或外部觀察器串流。

Activity 項目只保留已清理摘要，以及已遮蔽、截斷的輸出預覽。工具引數值不會儲存在 Activity 狀態中；UI 會顯示引數已隱藏，並只記錄引數欄位數量。記憶體內清單會跟隨目前瀏覽器分頁，在 Control UI 內導覽時保留，並在頁面重新載入、工作階段切換或 **Clear** 時重設。

## 操作員終端機

可停駐的操作員終端機預設為停用。若要啟用，請設定 `gateway.terminal.enabled: true` 並重新啟動閘道。終端機需要 `operator.admin` 連線，並會在作用中代理工作區中開啟主機 PTY。新分頁會跟隨目前選取的聊天代理。

<Warning>
終端機是不受限制的主機 shell，並會繼承閘道程序環境。僅在受信任的操作員部署中啟用。OpenClaw 會拒絕 `sandbox.mode: "all"` 代理的終端機工作階段；將作用中代理變更為該模式會關閉其現有與進行中的終端機工作階段。
</Warning>

使用 **Ctrl + backtick** 切換停駐區。版面支援底部與右側停駐，會隨瀏覽器檢視區調整大小，並保留多個 shell 分頁。請參閱[閘道設定](/zh-TW/gateway/configuration-reference#gateway)，了解 `gateway.terminal.enabled` 與選用的 `gateway.terminal.shell` 覆寫。

工作階段可在斷線後保留：頁面重新載入、筆電睡眠或網路短暫中斷時，會在閘道上分離工作階段，而不是終止它，且同一個瀏覽器分頁會在重新連線時重新附加並重播近期輸出。分離的工作階段會在 `gateway.terminal.detachedSessionTimeoutSeconds` 後終止（預設 300 秒；`0` 會還原為斷線即終止）。`terminal.list` 會顯示可附加的工作階段，`terminal.attach` 會接管其中一個（tmux 風格的接管），而 `terminal.text` 會以純文字讀取工作階段近期輸出而不附加，這是提供給代理/工具的便利功能。

終端機也可作為全螢幕、僅終端機文件在 `/?view=terminal` 使用。iOS 與 Android 應用程式會在其 Terminal 畫面中嵌入此頁面，重用已儲存的閘道認證；可用性遵循相同的 `gateway.terminal.enabled` 與 `operator.admin` 閘門，且當已連線閘道未提供終端機時，頁面會顯示通知。

## 聊天行為

<AccordionGroup>
  <Accordion title="傳送與歷史語意">
    - `chat.send` 是**非阻塞式**：它會立即以 `{ runId, status: "started" }` 確認，回應則透過 `chat` 事件串流傳送。受信任的 Control UI 用戶端也可能收到選用的 ACK 時序中繼資料，用於本機診斷。
    - 聊天上傳接受圖片與非影片檔案。圖片保留原生圖片路徑；其他檔案會儲存為受管理媒體，並在歷史中顯示為附件連結。
    - 使用相同的 `idempotencyKey` 重新傳送時，執行中會回傳 `{ status: "in_flight" }`，完成後會回傳 `{ status: "ok" }`。
    - `chat.history` 回應會限制大小以維持 UI 安全。當逐字稿項目過大時，Gateway 可能會截斷長文字欄位、省略大型中繼資料區塊，並以佔位符（`[chat.history omitted: message too large]`）取代過大的訊息。
    - 當可見的助理訊息在 `chat.history` 中被截斷時，側邊閱讀器可視需要透過 `chat.message.get`，依 `sessionKey`、必要時使用作用中的 `agentId`，以及逐字稿 `messageId` 擷取完整的顯示正規化逐字稿項目。如果 Gateway 仍無法回傳更多內容，閱讀器會顯示明確的不可用狀態，而不是悄悄重複截斷的預覽。
    - 助理/產生的圖片會保存為受管理媒體參照，並透過已驗證的 Gateway 媒體 URL 回傳，因此重新載入不依賴原始 base64 圖片承載資料繼續留在聊天歷史回應中。
    - 轉譯 `chat.history` 時，Control UI 會從可見助理文字中移除僅供顯示的內嵌指令標籤（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、純文字工具呼叫 XML 承載資料（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及截斷的工具呼叫區塊），以及外洩的 ASCII/全形模型控制權杖。它會省略整段可見文字只包含精確靜默權杖 `NO_REPLY` / `no_reply` 或心跳偵測確認權杖 `HEARTBEAT_OK` 的助理項目。
    - 在作用中的傳送期間與最終歷史重新整理時，如果 `chat.history` 短暫回傳較舊的快照，聊天檢視會保留本機樂觀使用者/助理訊息可見；一旦 Gateway 歷史追上，權威逐字稿就會取代這些本機訊息。
    - 即時 `chat` 事件是傳遞狀態，而 `chat.history` 則從持久的工作階段逐字稿重建。工具最終事件之後，Control UI 會重新載入歷史，且只合併一小段樂觀尾端；逐字稿邊界記錄於 [WebChat](/zh-TW/web/webchat)。
    - `chat.inject` 會將助理註記附加到工作階段逐字稿，並廣播 `chat` 事件以供僅限 UI 的更新（沒有代理程式執行，沒有通道傳遞）。
    - 側邊欄依釘選/自訂/未分組區段列出最近的工作階段，並提供 New Session 動作與 All Sessions 連結。釘選工作階段一律保持可見；未釘選工作階段保留九個項目的配額與穩定的新近度排序，因此開啟可見列只會移動醒目標示。新的儀表板工作階段會非同步從第一則非命令訊息取得簡潔的產生標題；明確名稱絕不會被取代。設定 `agents.defaults.utilityModel`（或 `agents.list[].utilityModel`）可將這個獨立模型呼叫路由到成本較低的模型。切換精簡代理程式範圍時，只會顯示繫結到該代理程式的工作階段；如果尚未儲存任何儀表板工作階段，則退回該代理程式的主要工作階段。
    - 工作階段搜尋位於命令面板（⌘K，或頂端列中的搜尋按鈕）：輸入查詢會跨代理程式追蹤有界數量的相符頁面、篩除內部子項/cron 列，並在導覽命令旁列出可見相符項。All Sessions 頁面保留可完整搜尋且含篩選器的清單。
    - 每個側邊欄列都保留直接釘選存取，以及用於未讀狀態、重新命名、分叉、分組、封存與刪除的完整內容選單。作用中的執行與代理程式的主要工作階段不能封存。封存或刪除目前選取的工作階段，會將 Chat 切回該代理程式的主要工作階段。
    - 在 macOS 應用程式中，OpenClaw 標記使用視窗控制項旁原本空白的原生標題列條帶，而不是佔用側邊欄列。
    - 在桌面寬度下，聊天控制項維持在單一精簡列上，並在向下捲動逐字稿時收合；向上捲動、回到頂端或到達底部時會還原控制項。
    - 連續重複的純文字訊息會轉譯為一個氣泡，並附上計數徽章。帶有圖片、附件、工具輸出或畫布預覽的訊息不會收合。
    - 聊天標頭的模型與 thinking 選擇器會透過 `sessions.patch` 立即修補作用中的工作階段；它們是持久的工作階段覆寫，而不是僅限單輪的傳送選項。
    - **分割檢視：**從撰寫器控制項開啟，然後可將任何窗格向右或向下分割，直到可容納的窗格數量上限。每個窗格都有自己的工作階段、逐字稿、撰寫器與工具串流。
    - 作用中的分割窗格會驅動側邊欄選取與 URL。分隔線可調整欄與堆疊窗格大小，瀏覽器會在本機跨重新載入儲存版面配置。
    - 在窄螢幕上，分割檢視會保留版面配置，但只轉譯作用中的窗格；其窗格標頭仍提供工作階段切換與關閉控制項。
    - 如果在同一工作階段的模型選擇器變更仍在儲存時傳送訊息，撰寫器會先等待該工作階段修補完成，再呼叫 `chat.send`，讓傳送使用所選模型。
    - 輸入 `/new` 會建立並切換到與 New Chat 相同的新儀表板工作階段，但當已設定 `session.dmScope: "main"` 且目前父項是代理程式的主要工作階段時除外；此時它會就地重設主要工作階段。輸入 `/reset` 會保留 Gateway 對目前工作階段的明確就地重設。
    - 聊天模型選擇器會要求 Gateway 的已設定模型檢視。如果存在 `agents.defaults.models`，該允許清單會驅動選擇器，包括讓提供者範圍型目錄維持動態的 `provider/*` 項目。否則，選擇器會顯示明確的 `models.providers.*.models` 項目，以及具有可用驗證的提供者。完整目錄仍可透過除錯用的 `models.list` RPC 搭配 `view: "all"` 取得。
    - 當新的 Gateway 工作階段用量報告包含目前內容權杖時，聊天撰寫器工具列會顯示一個小型內容用量環，標示已使用百分比。開啟用量環可查看目前內容視窗、最新執行的權杖計數與估計總成本、提供者/模型身分，以及回報時最新提供者回應的輸入/輸出/快取成本明細。用量環會在高內容壓力時切換為警告樣式，並在建議的壓縮層級顯示一個精簡按鈕，用來執行正常的工作階段壓縮路徑。過期的權杖快照會隱藏，直到 Gateway 再次回報新的用量。

  </Accordion>
  <Accordion title="Talk 模式（瀏覽器即時）">
    Talk 模式使用已註冊的即時語音提供者。使用 `talk.realtime.provider: "openai"` 加上 `openai` API 金鑰/OAuth 設定檔、外部 Codex 登入、`talk.realtime.providers.openai.apiKey` 或 `OPENAI_API_KEY` 來設定 OpenAI。已設定的 API 金鑰來源優先，Codex OAuth 是自動後援。使用 `talk.realtime.provider: "google"` 加上 `talk.realtime.providers.google.apiKey` 來設定 Google。瀏覽器永遠不會收到標準提供者 API 金鑰或 OAuth 權杖：OpenAI 會收到用於 WebRTC 的暫時 Realtime 用戶端密鑰，而 Google Live 會收到一次性、受限制的 Live API 驗證權杖，用於瀏覽器 WebSocket 工作階段，且指示與工具宣告會由 Gateway 鎖入權杖中。只公開後端即時橋接的提供者會透過 Gateway 轉送傳輸執行，因此認證與供應商 socket 會留在伺服器端，而瀏覽器音訊則透過已驗證的 Gateway RPC 傳送。Realtime 工作階段提示由 Gateway 組裝；`talk.client.create` 不接受呼叫者提供的指示覆寫。

    持久的提供者、模型、語音、傳輸、推理力度、精確 VAD 閾值、靜音持續時間與前置填補預設值位於 **Settings → Communications → Talk**；變更它們需要 `operator.admin` 存取權。設定 Gateway 轉送會強制後端轉送路徑；設定 WebRTC 會讓工作階段由用戶端擁有，且如果提供者無法建立瀏覽器工作階段，會失敗而不是悄悄退回轉送。

    Talk 控制項本身是撰寫器工具列中的麥克風按鈕。其插入號會列出 **System default** 以及瀏覽器公開的每個麥克風，包括 USB、Bluetooth 與虛擬輸入。所選裝置 ID 只保留在瀏覽器本機，絕不會傳送到 Gateway；如果該確切裝置消失，Talk 會要求你選擇另一個輸入，而不是悄悄從不同麥克風錄音。Talk 啟動時，撰寫器狀態列會先顯示 `Connecting Talk...`，音訊連線後顯示 `Talk live`，或在即時工具呼叫正透過 `talk.client.toolCall` 諮詢已設定的較大型模型時顯示 `Asking OpenClaw...`。

    維護者即時煙霧測試：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 會驗證 OpenAI 後端 WebSocket 橋接、OpenAI 瀏覽器 WebRTC SDP 交換、Google Live 受限制權杖瀏覽器 WebSocket 設定，以及使用假麥克風媒體的 Gateway 轉送瀏覽器配接器。該命令只列印提供者狀態，不會記錄秘密。

  </Accordion>
  <Accordion title="停止與中止">
    - 按一下 **Stop**（呼叫 `chat.abort`）。
    - 執行作用中時，一般後續訊息會排入佇列。按一下佇列訊息上的 **Steer**，可將該後續訊息注入正在執行的回合。
    - 輸入 `/stop`（或獨立的中止片語，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）可帶外中止。
    - `chat.abort` 支援 `{ sessionKey }`（沒有 `runId`）以中止該工作階段的所有作用中執行。

  </Accordion>
  <Accordion title="中止部分保留">
    - 當執行遭中止時，部分助理文字仍可顯示在 UI 中。
    - 當存在已緩衝輸出時，Gateway 會將遭中止的部分助理文字保存到逐字稿歷史中。
    - 保存的項目包含中止中繼資料，因此逐字稿消費者能分辨中止部分與正常完成輸出。

  </Accordion>
</AccordionGroup>

## 連線中斷與重新連線

一旦工作階段建立，Gateway 連線中斷不會讓你登出。用戶端自動以退避重試（800 ms 到最多 15 s）期間，儀表板
會保持可見，並顯示琥珀色「Gateway connection lost — reconnecting…」橫幅。即時更新與動作會暫停，直到
連線恢復；橫幅中的 **Retry now** 會強制立即嘗試。

登入閘門只會在尚未建立工作階段（首次開啟、連線前重新載入頁面），或 Gateway 主動拒絕認證（錯誤權杖/密碼、已撤銷
配對）時出現，這些狀態需要你的輸入，而不是等待。

## PWA 安裝與 Web Push

Control UI 隨附 `manifest.webmanifest` 與 service worker，因此現代瀏覽器可將它安裝為獨立 PWA。Web Push 讓 Gateway 即使在分頁或瀏覽器視窗未開啟時，也能透過通知喚醒已安裝的 PWA。

如果頁面在 OpenClaw 更新後立即顯示 **Protocol mismatch**，請先使用 `openclaw dashboard` 重新開啟儀表板並強制重新整理。如果仍然失敗，請清除儀表板來源的網站資料，或在私人瀏覽器視窗中測試；舊分頁或瀏覽器 service-worker 快取可能會讓更新前的 Control UI bundle 繼續對較新的 Gateway 執行。

| 介面                                                  | 功能                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 資訊清單。瀏覽器會在它可存取後提供「安裝應用程式」。          |
| `ui/public/sw.js`                                     | 處理 `push` 事件與通知點擊的服務工作程式。                         |
| `push/vapid-keys.json`（位於 OpenClaw 狀態目錄下）    | 自動產生的 VAPID 金鑰組，用於簽署 Web Push 承載資料。             |
| `push/web-push-subscriptions.json`                    | 持久化的瀏覽器訂閱端點。                                           |

當你想固定金鑰時（多主機部署、密鑰輪替或測試），請透過 Gateway 程序上的環境變數覆寫 VAPID 金鑰組：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（預設為 `https://openclaw.ai`）

Control UI 使用這些受範圍限制的 Gateway 方法來註冊和測試瀏覽器訂閱：

- `push.web.vapidPublicKey` 取得目前使用中的 VAPID 公鑰。
- `push.web.subscribe` 註冊一個 `endpoint` 以及 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` 移除已註冊的端點。
- `push.web.test` 傳送測試通知到呼叫者的訂閱。

<Note>
Web Push 獨立於 iOS APNS 中繼路徑（請參閱 [Configuration](/zh-TW/gateway/configuration) 了解由中繼支援的推播）以及以原生行動裝置配對為目標的 `push.test` 方法。
</Note>

## 託管嵌入

助理訊息可以使用 `[embed ...]` 短碼內嵌呈現託管的網頁內容。iframe 沙箱政策由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    停用託管嵌入中的指令碼執行。
  </Tab>
  <Tab title="scripts (default)">
    允許互動式嵌入，同時維持來源隔離；通常足以用於自包含的瀏覽器遊戲/小工具。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 之上加入 `allow-same-origin`，用於刻意需要更高權限的同站文件。
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
只有在嵌入文件確實需要同源行為時才使用 `trusted`。對於大多數由代理產生的遊戲與互動畫布，`scripts` 是更安全的選擇。
</Warning>

絕對外部 `http(s)` 嵌入 URL 預設仍會被封鎖。若要讓 `[embed url="https://..."]` 載入第三方頁面，請設定 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天訊息寬度

群組聊天訊息使用易讀的預設最大寬度。寬螢幕部署可以透過設定 `gateway.controlUi.chatMessageMaxWidth` 覆寫它，而不必修補隨附的 CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

該值會在到達瀏覽器之前先經過驗證。支援的形式包含純長度與百分比，例如 `960px` 或 `82%`，以及受限制的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 寬度運算式。

## Tailnet 存取（建議）

<Tabs>
  <Tab title="整合式 Tailscale Serve（偏好）">
    將 Gateway 保持在 loopback 上，並讓 Tailscale Serve 以 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    開啟 `https://<magicdns>/`（或你設定的 `gateway.controlUi.basePath`）。

    預設情況下，當 `gateway.auth.allowTailscale` 為 `true` 時，Control UI/WebSocket Serve 請求可以透過 Tailscale 身分標頭（`tailscale-user-login`）驗證。OpenClaw 會使用 `tailscale whois` 解析 `x-forwarded-for` 位址並將其與標頭比對，以驗證身分，而且只有當請求透過 Tailscale 的 `x-forwarded-*` 標頭命中 loopback 時才接受這些標頭。對於具有瀏覽器裝置身分的 Control UI 操作者工作階段，這個已驗證的 Serve 路徑也會略過裝置配對往返；沒有裝置的瀏覽器與節點角色連線仍會遵循一般裝置檢查。如果即使是 Serve 流量也想要求明確的共享密鑰憑證，請設定 `gateway.auth.allowTailscale: false`，然後使用 `gateway.auth.mode: "token"` 或 `"password"`。

    對於該非同步 Serve 身分路徑，相同用戶端 IP 與驗證範圍的驗證失敗嘗試會在寫入速率限制之前序列化。因此，來自同一瀏覽器的並行錯誤重試，可能會在第二個請求上顯示 `retry later`，而不是兩個單純不相符的請求並行競爭。

    <Warning>
    無權杖 Serve 驗證假設 Gateway 主機是可信任的。如果不受信任的本機程式碼可能在該主機上執行，請要求權杖/密碼驗證。
    </Warning>

  </Tab>
  <Tab title="繫結至 tailnet + 權杖">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    開啟 `http://<tailscale-ip>:18789/`（或你設定的 `gateway.controlUi.basePath`）。

    將相符的共享密鑰貼到 UI 設定中（以 `connect.params.auth.token` 或 `connect.params.auth.password` 傳送）。

  </Tab>
</Tabs>

## 不安全的 HTTP

如果你透過純 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）開啟儀表板，瀏覽器會在**非安全情境**中執行並封鎖 WebCrypto。預設情況下，OpenClaw 會**封鎖**沒有裝置身分的 Control UI 連線。

已記錄的例外：

- 僅限 localhost 的不安全 HTTP 相容性，使用 `gateway.controlUi.allowInsecureAuth=true`
- 透過 `gateway.auth.mode: "trusted-proxy"` 成功完成的操作者 Control UI 驗證
- 緊急例外 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**建議修正：**使用 HTTPS（Tailscale Serve），或在本機以 `https://<magicdns>/`（Serve）或 `http://127.0.0.1:18789/`（在 Gateway 主機上）開啟 UI。

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

    `allowInsecureAuth` 只是一個本機相容性切換：

    - 它允許 localhost Control UI 工作階段在非安全 HTTP 情境中不使用裝置身分也能繼續。
    - 它不會繞過配對檢查。
    - 它不會放寬遠端（非 localhost）裝置身分要求。

  </Accordion>
  <Accordion title="僅限緊急例外">
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
  <Accordion title="受信任代理備註">
    - 成功的受信任代理驗證可允許沒有裝置身分的**操作者** Control UI 工作階段。
    - 這**不會**延伸到節點角色 Control UI 工作階段。
    - 同主機 loopback 反向代理仍然不滿足受信任代理驗證；請參閱 [Trusted proxy auth](/zh-TW/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

請參閱 [Tailscale](/zh-TW/gateway/tailscale) 取得 HTTPS 設定指引。

## 內容安全政策

Control UI 隨附嚴格的 `img-src` 政策：只允許**同源**資產、`data:` URL，以及本機產生的 `blob:` URL。遠端 `http(s)` 和協定相對圖片 URL 會被瀏覽器拒絕，而且永遠不會發出網路擷取。

實務上：

- 透過相對路徑提供的頭像和圖片（例如 `/avatars/<id>`）仍會呈現，包括 UI 擷取並轉換成本機 `blob:` URL 的已驗證頭像路由。
- 內嵌 `data:image/...` URL 仍會呈現。
- 由 Control UI 建立的本機 `blob:` URL 仍會呈現。
- GitHub 連結預覽頭像由 Gateway 從 GitHub 固定的頭像主機擷取，並以受限的 `data:` URL 傳回；操作者瀏覽器永遠不會連線到遠端頭像主機。
- 由通道中繼資料發出的遠端頭像 URL，會在 Control UI 的頭像輔助程式中被剝除，並以內建標誌/徽章取代，因此遭入侵或惡意的通道無法強制操作者瀏覽器擷取任意遠端圖片。

此功能永遠啟用且無法設定。

## 頭像路由驗證

設定 Gateway 驗證時，Control UI 頭像端點會要求與 API 其他部分相同的 Gateway 權杖：

- `GET /avatar/<agentId>` 只會向已驗證的呼叫者傳回頭像圖片。`GET /avatar/<agentId>?meta=1` 會在相同規則下傳回頭像中繼資料。
- 對任一路由的未驗證請求都會被拒絕（與相鄰的助理媒體路由一致），因此頭像路由不會在其他部分受保護的主機上洩漏代理身分。
- Control UI 在擷取頭像時會將 Gateway 權杖作為 bearer 標頭轉送，並使用已驗證的 blob URL，讓圖片仍能在儀表板中呈現。

如果你停用 Gateway 驗證（不建議在共享主機上這麼做），頭像路由也會變成未驗證，與 Gateway 的其餘部分一致。

## 助理媒體路由驗證

設定 Gateway 驗證時，助理本機媒體預覽會使用兩步驟路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 要求一般的 Control UI 操作者驗證；瀏覽器在檢查可用性時會以 bearer 標頭傳送 Gateway 權杖。
- 成功的中繼資料回應會包含一個短效 `mediaTicket`，範圍限定為該確切來源路徑。
- 瀏覽器呈現的圖片、音訊、影片和文件 URL 會使用 `mediaTicket=<ticket>`，而不是作用中的 Gateway 權杖或密碼。該票證很快就會過期，且無法授權不同來源。

這會讓媒體呈現與瀏覽器原生媒體元素相容，同時避免將可重複使用的 Gateway 憑證放入可見的媒體 URL。

## 建置 UI

Gateway 會從 `dist/control-ui` 提供靜態檔案：

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

然後將 UI 指向你的 Gateway WS URL（例如 `ws://127.0.0.1:18789`）。

## 空白 Control UI 頁面

如果瀏覽器載入空白儀表板，且 DevTools 沒有顯示有用錯誤，可能是擴充功能或早期內容指令碼阻止了 JavaScript 模組應用程式求值。靜態頁面包含一個純 HTML 復原面板，會在啟動後 `<openclaw-app>` 未註冊時出現。

變更瀏覽器環境後，請使用面板的**再試一次**動作，或在完成這些檢查後手動重新載入：

- 停用會注入所有頁面的擴充功能，尤其是具有 `<all_urls>` 內容指令碼的擴充功能。
- 嘗試私人視窗、乾淨的瀏覽器設定檔或其他瀏覽器。
- 保持 Gateway 執行，並在變更瀏覽器後驗證相同的儀表板 URL。

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
  <Accordion title="備註">
    - `gatewayUrl` 會在載入後儲存在 localStorage 中，並從 URL 移除。
    - 如果你透過 `gatewayUrl` 傳入完整的 `ws://` 或 `wss://` 端點，請對該值進行 URL 編碼，讓瀏覽器能正確解析查詢字串。
    - 只要可行，`token` 應透過 URL 片段（`#token=...`）傳遞。片段不會傳送到伺服器，因此可避免請求記錄與 Referer 外洩。舊版 `?token=` 查詢參數仍會為相容性匯入一次，但僅作為備援，並會在啟動後立即移除。
    - `password` 只會保留在記憶體中。
    - 設定 `gatewayUrl` 時，UI 不會回退使用設定或環境憑證。請明確提供 `token`（或 `password`）；缺少明確憑證會視為錯誤。
    - 當閘道位於 TLS 後方（Tailscale Serve、HTTPS proxy 等）時，請使用 `wss://`。
    - `gatewayUrl` 只會在頂層視窗中接受（不可嵌入），以防止 clickjacking。
    - 公開的非 loopback 控制 UI 部署必須明確設定 `gateway.controlUi.allowedOrigins`（完整 origins）。來自 loopback、RFC1918/link-local、`.local`、`.ts.net` 或 Tailscale CGNAT 主機的私人同源 LAN/Tailnet 載入，可在未啟用 Host-header 備援的情況下接受。
    - 閘道啟動時，可能會根據有效的執行階段繫結與連接埠植入本機 origins，例如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>`，但遠端瀏覽器 origins 仍需要明確項目。
    - 除了嚴格受控的本機測試外，請勿使用 `gateway.controlUi.allowedOrigins: ["*"]`；它表示允許任何瀏覽器 origin，而不是「符合我正在使用的任何主機」。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 會啟用 Host-header origin 備援模式，但這是危險的安全模式。

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

遠端存取設定詳細資料：[遠端存取](/zh-TW/gateway/remote)。

## 相關

- [儀表板](/zh-TW/web/dashboard) — 閘道儀表板
- [健康檢查](/zh-TW/gateway/health) — 閘道健康監控
- [終端介面](/zh-TW/web/tui) — 終端使用者介面
- [WebChat](/zh-TW/web/webchat) — 瀏覽器式聊天介面
