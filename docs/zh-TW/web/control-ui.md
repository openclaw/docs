---
read_when:
    - 你想要從瀏覽器操作閘道
    - 你想在不使用 SSH 通道的情況下存取 Tailnet
sidebarTitle: Control UI
summary: 閘道的瀏覽器控制介面（聊天、活動、節點、設定）
title: 控制介面
x-i18n:
    generated_at: "2026-07-12T14:53:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5e9902cd8c2b7af0f47eaeec73cf365dd0f3963900b28880d4150939a1f447a2
    source_path: web/control-ui.md
    workflow: 16
---

Control UI 是由閘道提供的小型 **Vite + Lit** 單頁應用程式：

- 預設：`http://<host>:18789/`
- 選用前綴：設定 `gateway.controlUi.basePath`（例如 `/openclaw`）

它會透過相同連接埠**直接連線至閘道 WebSocket**。

## 快速開啟（本機）

如果閘道在同一台電腦上執行，請開啟 [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）。

如果頁面無法載入，請先啟動閘道：`openclaw gateway`。

<Note>
在原生 Windows 區域網路繫結中，即使 `127.0.0.1` 可在閘道主機上運作，Windows 防火牆或由組織管理的群組原則仍可能封鎖公告的區域網路 URL。請在 Windows 主機上執行 `openclaw gateway status --deep`；它會回報可能遭封鎖的連接埠、設定檔不相符，以及原則可能忽略的本機防火牆規則。
</Note>

驗證資訊會在 WebSocket 交握期間透過下列方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` 時的 Tailscale Serve 身分標頭
- `gateway.auth.mode: "trusted-proxy"` 時的受信任 Proxy 身分標頭

儀表板設定面板會為目前的瀏覽器分頁工作階段與所選閘道 URL 保留權杖，但不會保存密碼。初始設定通常會在首次連線時產生閘道權杖，用於共用密鑰驗證；不過，當 `gateway.auth.mode` 為 `"password"` 時，也可以使用密碼驗證。

## 裝置配對（首次連線）

從新的瀏覽器或裝置連線通常需要**一次性配對核准**，畫面會顯示 `disconnected (1008): pairing required`。

<Steps>
  <Step title="列出待處理的要求">
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

如果瀏覽器使用變更後的驗證詳細資料（角色／範圍／公開金鑰）重試配對，先前的待處理要求會被取代，並建立新的 `requestId`；核准前請重新執行 `openclaw devices list`。

將已配對瀏覽器從讀取存取權切換為寫入／管理員存取權，會視為核准升級，而非無提示地重新連線：OpenClaw 會維持舊核准有效、封鎖權限較廣的重新連線，並要求你明確核准新的範圍集合。

核准後，系統會記住該裝置；除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤銷，否則不需要再次核准。如需權杖輪替、撤銷，以及 Paperclip／`openclaw_gateway` 首次執行核准流程的相關資訊，請參閱[裝置命令列介面](/zh-TW/cli/devices)。

<Note>
- 直接透過本機回送位址連線的瀏覽器（`127.0.0.1`／`localhost`）會自動獲得核准。
- 當 `gateway.auth.allowTailscale: true`、Tailscale 身分驗證成功，且瀏覽器提供其裝置身分時，Tailscale Serve 可讓 Control UI 操作者工作階段略過配對往返流程。沒有裝置身分的瀏覽器與節點角色連線仍會遵循一般裝置檢查。
- 直接 Tailnet 繫結、區域網路瀏覽器連線，以及沒有裝置身分的瀏覽器設定檔仍需要明確核准。
- 每個瀏覽器設定檔都會產生唯一的裝置 ID，因此切換瀏覽器或清除瀏覽器資料後必須重新配對。

</Note>

## 配對行動裝置

已配對的管理員可以建立 iOS／Android 連線 QR Code，而不必開啟終端機：

<Steps>
  <Step title="開啟行動裝置配對">
    選取 **Devices**，然後在 **Devices** 卡片中按一下 **Pair mobile device**。
  </Step>
  <Step title="連接手機">
    在 OpenClaw 行動應用程式中，開啟 **Settings** → **Gateway**，然後掃描 QR Code。你也可以改為複製並貼上設定碼。
  </Step>
  <Step title="確認連線">
    官方 iOS／Android 應用程式會自動連線。如果 **Pending approval** 顯示要求，請先檢查其角色與範圍，再予以核准。
  </Step>
</Steps>

建立設定碼需要 `operator.admin`；沒有此權限的工作階段會停用該按鈕。設定碼包含短效的啟動認證資訊，因此在 QR Code 與複製的代碼有效期間，請將其視同密碼。若要進行遠端配對，閘道必須解析為 `wss://`（例如透過 Tailscale Serve/Funnel）；純 `ws://` 僅限回送位址與私人區域網路位址。如需完整的安全性與備援詳細資訊，請參閱[配對](/zh-TW/channels/pairing#pair-from-the-control-ui-recommended)。

## 個人身分（瀏覽器本機）

Control UI 支援每個瀏覽器各自的個人身分（顯示名稱與頭像），並將其附加至外送訊息，以便在共用工作階段中識別來源。此資料存放於瀏覽器儲存空間，範圍限定於目前的瀏覽器設定檔；除了你傳送之訊息的一般對話記錄作者中繼資料外，不會同步至其他裝置，也不會保存在伺服器端。清除網站資料或切換瀏覽器會將其重設為空白。

助理頭像覆寫也採用相同的瀏覽器本機模式：上傳的覆寫會在本機覆蓋由閘道解析的身分，且絕不會透過 `config.patch` 往返傳輸。共用的 `ui.assistant.avatar` 設定欄位仍可供直接寫入該欄位的非 UI 用戶端使用。

## 執行階段設定端點

Control UI 會從 `/control-ui-config.json` 擷取執行階段設定，該路徑是相對於閘道的 Control UI 基底路徑解析（例如在基底路徑 `/__openclaw__/` 下為 `/__openclaw__/control-ui-config.json`）。此端點受到與其他 HTTP 介面相同的閘道驗證保護：未驗證的瀏覽器無法擷取，而且必須提供有效的閘道權杖／密碼、Tailscale Serve 身分或受信任 Proxy 身分，才能成功擷取。

## 閘道主機狀態

在簡易檢視中開啟 **Settings**，即可查看 **Gateway Host** 卡片，其中包含閘道機器、區域網路位址、作業系統、執行階段、運作時間、CPU 負載、記憶體及狀態磁碟區空間。卡片顯示時，每 10 秒會透過 `system.info` 閘道 RPC 重新整理；這需要 `operator.read` 範圍。較舊的閘道，以及沒有此範圍的連線，不會顯示此卡片。

## 語言支援

Control UI 會在首次載入時根據你的瀏覽器地區設定自動本地化。若要稍後覆寫，請開啟 **Settings -> General -> Language**（選擇器位於 General 快速設定卡片，而不是 Appearance 下方）。

- 支援的地區設定：`en`、`ar`、`de`、`es`、`fa`、`fr`、`hi`、`id`、`it`、`ja-JP`、`ko`、`nl`、`pl`、`pt-BR`、`ru`、`th`、`tr`、`uk`、`vi`、`zh-CN`、`zh-TW`
- 非英文翻譯會在瀏覽器中延遲載入。
- 所選地區設定會儲存在瀏覽器儲存空間，並於日後造訪時重複使用。
- 缺少的翻譯鍵會回退至英文。

文件翻譯會針對相同的非英文地區設定集合產生，但文件網站內建的 Mintlify 語言選擇器只會列出 Mintlify 接受的地區設定代碼。泰文（`th`）與波斯文（`fa`）文件仍會在發布儲存庫中產生；在 Mintlify 支援這些代碼前，它們可能不會出現在該選擇器中。

## 外觀主題

Appearance 面板內建 Claw、Knot 與 Dash 主題（預設為 Claw），另有一個僅限瀏覽器本機使用的 tweakcn 匯入欄位。若要匯入主題，請開啟 [tweakcn 編輯器](https://tweakcn.com/editor/theme)，選擇或建立主題，按一下 **Share**，然後將複製的連結貼入 Appearance。匯入器也接受 `https://tweakcn.com/r/themes/<id>` 登錄 URL、`https://tweakcn.com/editor/theme?theme=amethyst-haze` 這類編輯器 URL、相對 `/themes/<id>` 路徑、原始主題 ID，以及 `amethyst-haze` 等預設主題名稱。

匯入的主題只會儲存在目前的瀏覽器設定檔中；它們不會寫入閘道設定，也不會在裝置間同步。取代匯入的主題會更新該唯一的本機欄位；如果匯入的主題正在使用中，清除後會切換回 Claw。

Appearance 也提供僅限瀏覽器本機使用的 Text size 設定，與其他 Control UI 偏好設定一起儲存。它會套用至聊天文字、撰寫器文字、工具卡片及聊天側邊欄，並讓文字輸入欄位維持至少 16px，避免行動版 Safari 在取得焦點時自動縮放。

## 管理外掛

在側邊欄中開啟 **Plugins**，或使用相對於已設定 Control UI 基底路徑的
`/settings/plugins`，即可在不離開 Control UI 的情況下瀏覽與管理外掛。
例如，基底路徑 `/openclaw` 會使用 `/openclaw/settings/plugins`。即使所有
選用外掛都已停用，此頁面仍一律可用。

Plugins 是包含四個分頁的中樞：**Installed** 與 **Discover** 在
`/settings/plugins` 管理外掛程式碼；**Skills** 在 `/skills`
提供各代理程式的技能管理工具；**Workshop** 則在 `/skills/workshop`
提供 Skill Workshop 提案審查功能。每個分頁都會保有自己的 URL，而側邊欄
只會顯示一個 Plugins 項目來涵蓋所有分頁。

**Installed** 分頁會顯示依類別分組的完整本機清單，並提供概覽數量。
每一列都可開啟詳細資料檢視；其溢位（`…`）選單可啟用或停用外掛，
並為外部安裝的外掛提供 **Remove**。它也會列出已設定的
[MCP 伺服器](/zh-TW/cli/mcp)，並支援直接新增、停用及移除。**Discover**
分頁是商店：其中包含 OpenClaw 隨附的精選外掛、官方外部外掛，以及適用於
熱門服務的一鍵式 MCP 連接器。在搜尋方塊中輸入內容會直接查詢
[ClawHub](https://clawhub.ai/plugins)，並附加 **From ClawHub**
區段，其中包含下載次數與來源驗證徽章。深層連結可透過
`/settings/plugins?tab=discover` 直接指向商店。

**Skills** 分頁會保留技能狀態報告、啟用／停用切換、API
金鑰輸入，以及行內 ClawHub 技能搜尋，其範圍限定於所選代理程式。
**Workshop** 分頁會保留 Skill Workshop 看板與 Today 審查流程，用於
[技能提案](/zh-TW/tools/skill-workshop)。

隨附的外掛已存在於閘道上，並會顯示 **Enable** 或 **Disable**，
而不是 **Install**。例如，Workboard 隨 OpenClaw 附帶，但預設停用，
因此其動作為 **Enable**。內建外掛無法移除，只能停用。

讀取目錄與搜尋 ClawHub 需要 `operator.read`。安裝、啟用、停用或移除外掛，
以及變更 MCP 伺服器，需要 `operator.admin`；唯讀操作者無法使用這些動作。

ClawHub 安裝會透過閘道執行，並採用與其他由閘道媒介之安裝相同的信任、
完整性與外掛安裝原則檢查。安裝或移除外掛程式碼需要重新啟動閘道。
當外掛與目前的閘道執行階段支援時，啟用或停用已安裝的外掛可在不重新啟動
的情況下套用；否則 UI 會回報需要重新啟動。由 OAuth 支援的 MCP 連接器
在新增後，需要從命令列介面執行一次 `openclaw mcp login <name>`。

此頁面刻意聚焦於清單、探索、安裝、啟用及移除。若要使用任意 npm、git
或本機路徑來源、更新及進階外掛設定，請使用
[`openclaw plugins`](/zh-TW/cli/plugins)。

## 側邊欄導覽

側邊欄將導覽固定在可捲動的工作階段清單上方。在多代理程式設定中，每個代理程式都會顯示為可收合的頂層區段；展開代理程式後，即可瀏覽其工作階段，而不會離開目前開啟的聊天；已收合的代理程式則會顯示未讀指示。代理程式內的清單分為 **已釘選**、每個已連線頻道各自的一個內建區段（Telegram、Slack、WhatsApp、...）、供繫結至受管理工作樹或執行節點之工作階段使用的內建 **工作** 區段（列中會顯示 `repo ⎇ branch` 行與節點主機）、自訂群組（工作階段的 `category`），以及容納其餘項目的 **聊天**。頻道和工作區段會自動分類各列；將工作階段指派至自訂群組一律優先。開啟工作階段只會移動選取醒目提示，不會重新排序各列。自上次讀取後出現新活動的工作階段會顯示未讀圓點，開啟後即標示為已讀。每個工作階段列都有快顯選單（三點按鈕或按右鍵），其中包含釘選／取消釘選、標示為未讀／已讀、重新命名、分叉、移至群組（包括新增群組與從群組移除）、封存及刪除；觸控版面會讓直接釘選與選單控制項保持可見。按住 Cmd/Ctrl 並按一下可切換列的多選狀態，按住 Shift 並按一下則可依目前可見順序延伸選取範圍；接著在已選取的列上開啟選單，便會提供批次動作（將 N 個項目標示為未讀／已讀、將 N 個項目移至群組、封存 N 個項目、刪除 N 個項目），並套用至每個已選取的工作階段；批次刪除只需確認一次。將工作階段拖曳至自訂群組或 **聊天** 即可移動。自訂群組標頭可以收合、展開或拖曳以重新排序；群組名稱及順序儲存在閘道中（`sessions.groups.*`），因此會跨瀏覽器同步，而收合狀態則保留在瀏覽器設定檔中。群組標頭也有選單（三點按鈕或按右鍵），其中包含重新命名群組、新增群組及刪除群組；重新命名或刪除群組時，伺服器端會更新每個成員工作階段，包括已封存的工作階段；刪除群組會保留其中的工作階段，並將其移回聊天。工作階段清單標頭中唯一的 **+** 會開啟新增工作階段頁面（請見下文）。排序控制項另有「分組方式」切換選項：分組（預設）或無，以顯示單一平面清單（已釘選項目仍會分開）；此選擇儲存在目前的瀏覽器設定檔中。**用量**、**自動化**及**外掛**預設為已釘選；展開 **更多** 即可前往其他所有目的地。在「更多」下選取 **編輯釘選項目**，或在導覽區域按右鍵，即可釘選或取消釘選目的地，以及還原預設值。釘選集合與「更多」的展開狀態會儲存在目前的瀏覽器設定檔中，並在重新載入後保留。

## 新增工作階段頁面

側邊欄工作階段清單標頭中的 **+** 會在 `/new` 開啟全頁草稿：在你傳送第一則訊息之前，不會建立任何內容。訊息方塊上方的目標列可選擇工作階段的工作位置：代理程式（適用於多代理程式設定）、執行作業的執行位置（**閘道 · 本機**，或公開 `system.run` 的已配對節點；需要 `operator.admin`）、資料夾（預設為代理程式工作區；其他絕對閘道路徑需要 `operator.admin` 和工作樹），以及選用的 **工作樹** 切換選項，其中包含基礎分支選擇器（由 `worktrees.branches` 提供，因此不會執行擷取）和選用的工作樹名稱（分支會成為 `openclaw/<name>`）。資料夾籤片的瀏覽按鈕會開啟內嵌目錄選擇器，由僅限管理員使用的 `fs.listDir` 方法提供。其頂層會顯示閘道與每個已知節點；離線節點及不支援目錄瀏覽的節點仍會顯示，但無法使用。選取閘道後，會從目前資料夾或閘道主目錄開始。選取具備相應功能的節點後，則會瀏覽該節點的主機檔案系統、將執行繫結至該節點，並直接使用所選的絕對節點路徑（受管理工作樹仍僅限閘道使用）。提交時會使用第一則訊息呼叫 `sessions.create`，因此執行會在同一次往返中開始，且 UI 會跳至新工作階段的聊天。如果閘道已建立工作階段，卻拒絕首次傳送，聊天會在重新載入後保留提示詞與錯誤；**重試** 會透過已建立的工作階段傳送，而不會另外建立新的工作階段。

在 **設定** 中，專用側邊欄頂端提供 **搜尋設定** 欄位，讓你快速尋找設定區段。

  側邊欄頂端的**搜尋**欄位會開啟命令選擇區（⌘K）。按一下側邊欄標頭中的 OpenClaw 品牌標誌，會開啟簡潔的「新增工作階段」起始畫面。當有事項需要處理時（例如排程工作失敗或逾期、模型驗證即將到期或已到期），精簡的注意事項標籤會顯示在側邊欄頁尾上方，按一下即可前往負責該事項的頁面。精簡頁尾集中顯示連線狀態、**設定**、**文件**、行動裝置配對，以及淺色／深色／系統色彩模式切換；當閘道從 `main` 以外分支的原始碼簽出版本執行時，頁尾也會以紅色顯示該分支名稱，讓人一眼看出這是非發行版閘道（發行版安裝永遠不會顯示）。按下 Shift-Command-Comma 可開啟**設定**，且不會覆寫瀏覽器的 Command-Comma 快捷鍵。側邊欄標頭也包含收合切換按鈕（⌘B）；收合後會完全隱藏側邊欄，提供全寬工作區，而浮動展開控制項（或 ⌘B）可將其恢復；macOS App 則改為在標題列中原生提供此切換按鈕。側邊欄是桌面版唯一的導覽介面，不設頂端列。較窄的檢視區會將側邊欄替換成滑入式抽屜，並在精簡標頭列後方顯示，該標頭列包含抽屜切換按鈕、品牌標誌和命令選擇區搜尋；在 macOS App 中，這個標頭列會將標題列的預留空間整合成視窗控制項旁的一條精簡橫列。導覽使用一般瀏覽器歷程記錄，因此瀏覽器的上一頁／下一頁按鈕可在其中移動；macOS App 還會在視窗控制項旁新增原生側邊欄切換按鈕和觸控板滑動手勢，側邊欄展開時，其右側邊緣會顯示上一頁／下一頁按鈕；側邊欄收合時，則顯示原生搜尋（命令選擇區）和新增工作階段按鈕。

  ## 目前可執行的功能

  <AccordionGroup>
  <Accordion title="聊天與對話">
    - 透過閘道 WS 與模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 重新整理聊天記錄時，會請求有界限的近期內容範圍，並限制每則訊息的文字量，因此大型工作階段不會迫使瀏覽器在聊天可用前，先算繪完整的逐字記錄酬載。
    - 將游標停留在公開 GitHub 議題或提取要求連結上，或使用鍵盤將焦點移至該連結時，會顯示其狀態、標題、作者、近期活動、留言和變更統計資料。已連線的閘道會擷取並快取公開中繼資料，而不變更連結目標，即使 UI 使用遠端閘道也是如此。閘道會在確認儲存庫為公開後，使用可用的 `GH_TOKEN` 或 `GITHUB_TOKEN`；否則會使用 GitHub 的匿名 API，並採用較長的快取時間。
    - 透過瀏覽器即時工作階段進行對話。OpenAI 使用直接 WebRTC，Google Live 使用受限制的單次瀏覽器權杖透過 WebSocket 連線，而僅限後端的即時語音外掛則使用閘道轉送傳輸。用戶端擁有的提供者工作階段以 `talk.client.create` 啟動；閘道轉送工作階段以 `talk.session.create` 啟動。轉送機制會將提供者認證資訊保留在閘道上，同時瀏覽器透過 `talk.session.appendAudio` 串流麥克風 PCM；它也會透過 `talk.client.toolCall` 轉送 `openclaw_agent_consult` 提供者工具呼叫，以套用閘道政策並使用已設定的較大型 OpenClaw 模型，並透過 `talk.client.steer` 或 `talk.session.steer` 路由執行中工作的語音引導。
    - 在聊天中串流工具呼叫和即時工具輸出卡片（代理程式事件）。工具活動會依類型呈現為不同資料列：殼層命令會顯示具語法醒目提示的命令及終端機樣式輸出；支援的編輯與寫入呼叫會顯示有界限的行內差異、可用時的行號，以及 `+added -removed` 統計資料；連續呼叫則會收合成「執行了 13 個命令、讀取了 6 個檔案、編輯了 9 個檔案」之類的摘要。工作執行期間，最新執行中的呼叫名稱會作為群組標頭。展開資料列可檢查其餘引數和原始輸出。
    - 可選擇為複雜工具呼叫（長殼層命令、引數繁多的外掛工具）產生 AI 用途標題；以 `gateway.controlUi.toolTitles: true` 啟用（預設關閉）。標題來自批次 `chat.toolTitles` 方法，並透過標準公用模型路由處理：優先使用明確設定的 `utilityModel`（由操作員選擇的提供者，與其他公用工作相同），否則使用工作階段提供者宣告的預設小型模型；閘道端會依代理程式快取結果。未啟用此選項或沒有可用的低成本模型時，資料列會保留其確定性標籤，且不會呼叫模型。
    - 啟動或關閉模型暫時建議的後續工作；接受建議後，會使用提議的提示詞開啟全新的受管理工作樹工作階段。
    - 「活動」分頁會針對現有 `session.tool`／工具事件傳遞中的即時工具活動，提供儲存於瀏覽器本機且優先遮蔽敏感資訊的摘要。

  </Accordion>
  <Accordion title="頻道、工作階段與記憶">
    - 頻道：內建及隨附／外部外掛頻道的狀態、QR 登入，以及各頻道的設定（`channels.status`、`web.login.*`、`config.patch`）。
    - 重新整理頻道探測時，會在速度較慢的提供者檢查完成前持續顯示先前的快照；若探測或稽核超過其 UI 時間預算，則會標示部分完成的快照。
    - 工作階段：預設列出已設定代理程式的工作階段、釘選常用工作階段、重新命名、封存或還原非使用中的工作階段、從已過時且未設定的代理程式工作階段金鑰回復，並套用各工作階段的模型／思考／快速／詳細／追蹤／推理覆寫（`sessions.list`、`sessions.patch`）。已釘選的工作階段會排序在近期未釘選的工作階段之前；已封存的工作階段位於「工作階段」頁面的封存檢視中，並保留其逐字記錄。若工作階段在上次讀取後有新活動，資料列會顯示未讀圓點，並提供標示為未讀／標示為已讀動作（`sessions.patch { unread }`）；「分支」動作可將逐字記錄分支成新的工作階段（`sessions.create { parentSessionKey, fork: true }`）。表格上方的概覽方塊會摘要已載入的清單（工作階段數量、執行中工作、未讀工作階段、權杖總數）；每個資料列都會顯示類型圖示，執行中時附帶圓點；狀態則呈現為純色圓點加標籤；當工作階段回報權杖和內容視窗大小時，「權杖」欄會顯示內容視窗用量計。資料列管理動作位於各資料列的選單中（三點按鈕或按一下滑鼠右鍵），其內容與側邊欄的工作階段選單一致；資料列抽屜則會在其他工作階段詳細資料旁顯示代理程式執行階段和執行持續時間。
    - 工作階段分組：「分組依據」控制項可依自訂群組、頻道、類型、代理程式或日期，將工作階段表格整理成不同區段。自訂群組會透過 `sessions.patch`（`category`）針對各工作階段持續保存，因此從訊息頻道（Discord、Telegram、WhatsApp 等）啟動的工作階段也能分類；你可以將資料列拖曳至區段，或使用各資料列的群組選擇器指派群組，並透過「新增群組」動作建立群組。
    - 記憶（「代理程式」頁面上的分頁，範圍限定為所選代理程式）：夢境整理狀態、啟用／停用切換按鈕，以及「夢境日記」閱讀器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="排程、任務、外掛、Skills、裝置、執行核准">
    - 自動化（排程工作）：在「自動化／執行記錄」分頁切換器上方顯示統計卡片（自動化數量、失敗數量、排程器狀態、下次喚醒）；「自動化」分頁會在可篩選的表格中列出工作（全部／啟用中／已暫停、搜尋、排程與上次執行篩選器、每列動作選單），下方則提供入門建議，而「執行記錄」分頁會顯示所有自動化最近的執行記錄（`cron.*`）。
    - 任務：即時顯示進行中及最近的背景任務台帳，並提供連結的工作階段與取消功能（`tasks.*`）。
    - 外掛：瀏覽已安裝清單與精選商店、搜尋 ClawHub、安裝及移除外掛程式碼，以及啟用或停用已安裝的外掛（`plugins.*`）；MCP 伺服器列會透過設定方法編輯 `mcp.servers`。
    - Skills：狀態、啟用／停用、安裝、API 金鑰更新（`skills.*`）。
    - 裝置：單一清單整合已配對裝置記錄、節點目錄與即時在線狀態（`device.pair.list`、`node.list`、`system-presence`）。閘道主機固定顯示於最前方；已配對的用戶端會顯示連線狀態、角色、權杖、功能與命令。重複配對會合併為可展開的群組，而 **清理 N 個過期項目** 會批次移除經管理員確認為離線的重複項目，這些項目可能是自動核准的（無提示本機、受信任的 CIDR 或經 SSH 驗證），或早於核准來源記錄。你可以移除項目（`node.pair.remove`、`device.pair.remove`）、直接處理裝置配對及節點重新核准（`device.pair.*`、`node.pair.approve`/`reject`），並從同一卡片建立行動裝置設定碼。
    - 執行核准：編輯閘道或節點允許清單，以及 `exec host=gateway/node` 的詢問政策（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="設定">
    - 檢視／編輯 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - 個人檔案：顯示預設代理程式身分及歷來使用統計資料的設定頁面，包括累計權杖、尖峰日、最長工作階段、活動連續天數、一整年的權杖熱度圖、最常用工具，以及頻道重點摘要（`usage.cost`、`sessions.usage`）。
    - MCP 有專用的設定頁面，其中包含唯讀的伺服器列（傳輸方式、啟用狀態、OAuth／篩選器／平行處理摘要）、常用操作員命令，以及限定範圍的 `mcp` 設定編輯器；伺服器的新增、啟用／停用與移除會在「外掛」頁面進行。
    - 模型供應商：此設定頁面會列出每個已設定的模型供應商及其品牌圖示、驗證狀態（`models.authStatus`）、模型可用性（`models.list`）、供應商回報的即時方案／配額／帳務資料（`usage.status`），以及最近 30 天的本機工作階段支出（`sessions.usage`）。「重新整理」動作會重新讀取認證資訊狀態及供應商用量。
    - 連線：此設定頁面（位於**連線**下）管理儀表板本身的閘道連結，包括 WebSocket URL、閘道權杖、密碼及預設工作階段金鑰，並顯示最新的交握快照（狀態、運作時間、計時週期、上次重新整理頻道的時間）。離線登入閘門會處理中斷連線的情況；連線時可透過此頁面編輯連線。
    - 經過驗證後套用並重新啟動（`config.apply`），接著喚醒上次使用中的工作階段。
    - 寫入操作包含基礎雜湊防護，以避免覆寫同時進行的編輯。
    - 寫入操作（`config.set`/`config.apply`/`config.patch`）會預先檢查所提交設定承載內容中參照的有效 SecretRef 解析；若提交的有效參照無法解析，系統會在寫入前拒絕操作。
    - 表單儲存時會捨棄無法從已儲存設定還原的過時遮蔽預留位置，同時保留仍可對應至已儲存密鑰的遮蔽值。
    - 結構描述與表單呈現來自 `config.schema` / `config.schema.lookup`，包括欄位 `title`/`description`、相符的 UI 提示、直接子項摘要、巢狀物件／萬用字元／陣列／組合節點上的文件中繼資料，以及可用時的外掛與頻道結構描述。只有當快照可安全進行原始資料來回轉換時，才可使用原始 JSON 編輯器；否則控制介面會強制使用表單模式。
    - 原始 JSON 編輯器的「重設為已儲存內容」會保留以原始方式編寫的形態（格式、註解、`$include` 配置），而非重新呈現扁平化快照，因此當快照可安全地來回轉換時，重設後仍會保留外部編輯。
    - 結構化 SecretRef 物件值會在表單文字輸入欄位中以唯讀方式呈現，以免意外將物件損毀為字串。

  </Accordion>
  <Accordion title="用量">
    - 從工作階段衍生的權杖與預估成本分析，會與供應商帳務分開呈現。
    - 供應商卡片會呼叫 `usage.status`，並顯示已設定供應商外掛所回報的即時方案名稱、配額週期、餘額、支出與預算。
    - 供應商用量取得失敗不會阻擋工作階段／成本儀表板；無法使用的供應商卡片會顯示各自的錯誤狀態。

  </Accordion>
  <Accordion title="偵錯、記錄、更新">
    - 偵錯：狀態／健康情形／模型快照、事件記錄，以及手動 RPC 呼叫（`status`、`health`、`models.list`）。
    - 事件記錄包括控制介面重新整理／RPC 計時、緩慢的聊天／設定呈現計時，以及瀏覽器公開相關 PerformanceObserver 項目類型時，針對長動畫影格或長時間任務記錄的瀏覽器回應性項目。
    - 記錄：即時追蹤閘道檔案記錄，並提供篩選／匯出功能（`logs.tail`）。
    - 更新：執行套件／git 更新並重新啟動（`update.run`），同時產生重新啟動報告；接著在重新連線後輪詢 `update.status`，確認執行中的閘道版本。

  </Accordion>
  <Accordion title="自動化面板注意事項">
    - 選取某列會開啟整頁詳細資料檢視，頁首含「啟用中／已暫停」切換開關與「立即執行」（其選單中另有到期才執行、複製及移除）；「設定」分頁可直接編輯自動化（提示詞、詳細資料、頻率、進階覆寫），而「執行記錄」分頁則顯示該自動化的執行記錄。
    - 表格下方的入門自動化會使用可編輯的提示詞與排程預先填入建立表單。
    - 對於隔離任務，傳遞方式預設為公告摘要；僅供內部執行時請切換為無。
    - 選取公告時，會顯示頻道／目標欄位。
    - 網路鉤子模式使用 `delivery.mode = "webhook"`，並將 `delivery.to` 設為有效的 HTTP(S) 網路鉤子 URL。
    - 對於主要工作階段任務，可使用網路鉤子與無傳遞模式。
    - 進階編輯控制項包括執行後刪除、清除代理程式覆寫、排程精確／錯開選項、代理程式模型／思考覆寫，以及盡力傳遞切換開關。
    - 表單驗證會直接顯示各欄位的錯誤；無效值修正前，儲存按鈕將停用。
    - 設定 `cron.webhookToken` 以傳送專用的持有人權杖；若省略，網路鉤子將不含驗證標頭。
    - `cron.webhook` 是已棄用的舊版後援機制：執行 `openclaw doctor --fix`，將仍使用 `notify: true` 的已儲存工作遷移為明確的個別工作網路鉤子或完成傳遞。

  </Accordion>
</AccordionGroup>

## MCP 頁面

專用 MCP 頁面是供操作員檢視 `mcp.servers` 下由 OpenClaw 管理之 MCP 伺服器的介面。它本身不會啟動 MCP 傳輸；請用它檢查及編輯已儲存的設定，並在需要即時伺服器證明時使用 `openclaw mcp doctor --probe`。

一般工作流程：

1. 從側邊欄開啟 **MCP**。
2. 查看摘要卡片中的伺服器總數、已啟用數量、OAuth 數量與已篩選數量。
3. 檢查每個伺服器列的傳輸方式、啟用狀態、驗證、篩選器、逾時與命令提示。
4. 在**外掛**頁面管理伺服器（新增、啟用／停用、移除）；該頁面是 `mcp.servers` 唯一的互動式寫入介面，此處的列清單會連結至該頁面。
5. 編輯限定範圍的 `mcp` 設定區段，包括伺服器定義、標頭、TLS/mTLS 路徑、OAuth 中繼資料、工具篩選器及 Codex 投影中繼資料。
6. 使用**儲存**寫入設定；若執行中的閘道應套用變更後的設定，則使用**儲存並發布**。
7. 從終端機執行 `openclaw mcp status --verbose`、`openclaw mcp doctor --probe` 或 `openclaw mcp reload`，以進行靜態診斷、即時證明或清除快取的執行階段。

此頁面會在呈現前遮蔽含認證資訊、類似 URL 的值，並在命令片段中引用伺服器名稱，讓複製的命令即使含有空格或 shell 中繼字元仍可運作。完整的命令列介面與設定參考資料：[MCP](/zh-TW/cli/mcp)。

## 活動分頁

「活動」分頁位於**設定 › 系統**中，與「記錄」及「偵錯」並列。它是短暫存在於瀏覽器本機的即時工具活動觀察器，衍生自支援聊天工具卡片的同一個閘道 `session.tool`／工具事件串流。它不會新增其他閘道事件系列、端點、持久活動儲存區、指標資料來源或外部觀察器串流。

活動項目只保留經過清理的摘要，以及已遮蔽、截斷的輸出預覽。工具引數值不會儲存在活動狀態中；UI 會顯示引數已隱藏，且只記錄引數欄位數量。記憶體內的清單會隨目前的瀏覽器分頁存在，在控制介面內瀏覽時會予以保留，並於重新載入頁面、切換工作階段或按下**清除**時重設。

## 操作員終端機

可停駐的操作員終端機預設為停用。若要啟用，請設定 `gateway.terminal.enabled: true` 並重新啟動閘道。終端機需要 `operator.admin` 連線，並會在使用中代理程式的工作區內開啟主機 PTY。新分頁會跟隨目前選取的聊天代理程式。

<Warning>
終端機是不受限制的主機 shell，並會繼承閘道處理程序環境。請只在受信任的操作員部署中啟用。OpenClaw 會拒絕為設有 `sandbox.mode: "all"` 的代理程式建立終端機工作階段；將使用中的代理程式變更為該模式，會關閉其現有及正在建立的終端機工作階段。
</Warning>

使用 **Ctrl + 反引號** 切換停駐區。版面配置支援停駐於底部及右側、隨瀏覽器檢視區調整大小，並可保留多個 shell 分頁。如需 `gateway.terminal.enabled` 與選用的 `gateway.terminal.shell` 覆寫設定，請參閱[閘道設定](/zh-TW/gateway/configuration-reference#gateway)。

工作階段可在中斷連線後保留：重新載入頁面、筆記型電腦進入睡眠或網路短暫中斷時，工作階段會在閘道上中斷連結而非遭到終止；重新連線後，同一個瀏覽器分頁會重新連結，並重播最近的輸出。中斷連結的工作階段會在 `gateway.terminal.detachedSessionTimeoutSeconds` 後遭到終止（預設為 300 秒；`0` 會恢復中斷連線時終止）。`terminal.list` 會顯示可連結的工作階段，`terminal.attach` 會接管其中一個工作階段（類似 tmux 的接管方式），而 `terminal.text` 可在不連結的情況下，以純文字讀取工作階段最近的輸出，供代理程式／工具使用。

終端機也能以全螢幕、僅含終端機的文件形式於 `/?view=terminal` 使用。iOS 與 Android 應用程式會將此頁面嵌入其終端機畫面，並重複使用已儲存的閘道認證資訊；可用性遵循相同的 `gateway.terminal.enabled` 與 `operator.admin` 閘門，而當連線的閘道未提供終端機時，頁面會顯示通知。

## 瀏覽器面板

控制介面隨附可停駐的瀏覽器面板，可在任何一般網頁瀏覽器中呈現由閘道控制的瀏覽器（也就是代理程式透過[瀏覽器工具](/zh-TW/tools/browser-control)操作的同一個瀏覽器），不需要原生 WebView。當連線的閘道向 `operator.admin` 連線公開 `browser.request` 時，此面板便會顯示；工作階段工作區導軌中的地球按鈕可切換面板。面板會顯示即時頁面快照，並提供分頁、可編輯的 URL 列、上一頁／下一頁／重新載入、在你的瀏覽器中開啟等功能；它可停駐於右側或底部，並會將點擊、滾輪捲動及基本輸入轉送至遠端頁面。

兩種擷取模式會為代理程式封裝頁面內容：

- **註記（鉛筆）**：在頁面上手繪標記。**傳送到聊天**會將筆畫合成到螢幕截圖中、把圖片附加至目前使用中的聊天輸入框，並預先填入描述頁面 URL、標題及每個標記區域的提示，讓代理程式能確切知道你圈選了哪些內容。
- **檢查（指標）**：將游標停留在元素上，即可查看游標下方的元素（選取器、無障礙名稱、角色、大小）；按一下即可透過相同的輸入框流程，傳送該元素的詳細資料與醒目標示的螢幕截圖。檢查、滾輪捲動及上一頁／下一頁功能需要 `browser.evaluateEnabled`（預設啟用）。

macOS 應用程式會為在儀表板中點選的連結保留其原生連結瀏覽器側邊欄；瀏覽器面板也可在其中使用，並且是在其他所有平台上註記頁面的方式。

## 聊天行為

  <AccordionGroup>
  <Accordion title="Send and history semantics">
    - `chat.send` 為**非阻塞式**：它會立即以 `{ runId, status: "started" }` 確認，而回應則透過 `chat` 事件串流傳送。受信任的 Control UI 用戶端也可能收到選用的 ACK 計時中繼資料，供本機診斷使用。
    - 聊天上傳支援圖片及非影片檔案。圖片會保留原生圖片路徑；其他檔案則儲存為受管理的媒體，並在歷史記錄中顯示為附件連結。
    - 使用相同的 `idempotencyKey` 重新傳送時，執行期間會傳回 `{ status: "in_flight" }`，完成後則傳回 `{ status: "ok" }`。
    - 為確保 UI 安全，`chat.history` 回應有大小上限。當逐字稿項目過大時，閘道可能會截斷過長的文字欄位、省略龐大的中繼資料區塊，並以預留位置取代過大的訊息（`[chat.history omitted: message too large]`）。
    - 當可見的助理訊息在 `chat.history` 中遭到截斷時，側邊閱讀器可依需求透過 `chat.message.get`，按 `sessionKey`、必要時的作用中 `agentId`，以及逐字稿 `messageId`，擷取完整且已正規化顯示的逐字稿項目。如果閘道仍無法傳回更多內容，閱讀器會顯示明確的無法使用狀態，而不會無提示地重複顯示遭截斷的預覽。
    - 助理產生的圖片會持久儲存為受管理的媒體參照，並透過經驗證的閘道媒體 URL 傳回，因此重新載入時不必依賴聊天歷史記錄回應中持續保留原始 base64 圖片承載內容。
    - 呈現 `chat.history` 時，Control UI 會從可見的助理文字中移除僅供顯示的行內指令標籤（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、純文字工具呼叫 XML 承載內容（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及遭截斷的工具呼叫區塊），還有外洩的 ASCII／全形模型控制權杖。如果助理項目的全部可見文字只有完全相符的靜默權杖 `NO_REPLY`／`no_reply`，或心跳偵測確認權杖 `HEARTBEAT_OK`，則會省略該項目。
    - 在作用中的傳送期間及最終歷史記錄重新整理時，如果 `chat.history` 短暫傳回較舊的快照，聊天檢視會讓本機樂觀顯示的使用者／助理訊息保持可見；閘道歷史記錄追上後，標準逐字稿便會取代這些本機訊息。
    - 即時 `chat` 事件代表傳遞狀態，而 `chat.history` 則會從持久的工作階段逐字稿重新建立。工具最終事件發生後，Control UI 會重新載入歷史記錄，並僅合併一小段樂觀顯示的尾端內容；逐字稿邊界記載於 [WebChat](/zh-TW/web/webchat)。
    - `chat.inject` 會將助理備註附加至工作階段逐字稿，並廣播 `chat` 事件，用於僅限 UI 的更新（不執行代理程式、不傳遞至頻道）。
    - 側邊欄會依代理程式區段，並以已釘選／頻道／工作／自訂／聊天分類列出每個已載入的作用中工作階段，且只有一個 New Session 動作可開啟草稿對話框。開啟可見列只會移動反白選取位置。自訂群組可以收合及拖曳重新排序，工作階段則可拖放至群組或聊天；群組名稱與順序會透過閘道同步，收合狀態則保留在瀏覽器中。新的儀表板工作階段會以第一則非命令訊息非同步產生簡潔標題；明確指定的名稱絕不會被取代。設定 `agents.defaults.utilityModel`（或 `agents.list[].utilityModel`），可將這次獨立的模型呼叫路由至成本較低的模型。展開其他代理程式區段，即可瀏覽該代理程式的工作階段，而不會離開目前開啟的聊天。
    - 工作階段搜尋位於命令選擇區中（⌘K，或側邊欄頂端的 Search 欄位）：輸入查詢後，系統會在各代理程式間搜尋有限數量的相符頁面、篩除內部子項目／排程列，並在導覽命令旁列出可見的相符項目。Sessions 頁面則保留含篩選功能的完整可搜尋清單。
    - 每個側邊欄列都保留直接釘選功能，以及完整的內容選單，可操作未讀狀態、重新命名、分支、群組、封存和刪除。多選列（使用 Cmd/Ctrl 加按，或使用 Shift 加按選取範圍）會提供批次選單，涵蓋未讀狀態、群組、封存和刪除；除非所有選取的工作階段皆可封存，否則批次封存／刪除會維持停用。作用中的執行作業及代理程式的主要工作階段無法封存。封存或刪除目前選取的工作階段後，聊天會切回該代理程式的主要工作階段。
    - 在 macOS 應用程式中，OpenClaw 標誌會使用視窗控制項旁原本空白的原生標題列區帶，而不會占用側邊欄的一列。
    - 在桌面寬度下，聊天控制項會保持在單一緊湊列中，並在向下捲動逐字稿時收合；向上捲動、回到頂端或抵達底部時，控制項便會恢復顯示。
    - 連續重複且僅含文字的訊息會呈現為單一訊息泡泡，並附上計數徽章。含有圖片、附件、工具輸出或畫布預覽的訊息不會收合。
    - 當工作階段的簽出位於 GitHub 儲存庫的非預設分支時，聊天檢視會在撰寫區上方釘選提取要求資訊標籤：PR 編號、儲存庫、分支、差異計數、CI 狀態標籤，以及草稿／已合併／已關閉狀態，每個標籤皆連結至該 PR。該列最多顯示兩個標籤，並優先顯示即時（開放／草稿）PR；"Show more" 按鈕會顯示已收合的已合併／已關閉歷史記錄。CI 狀態標籤會開啟小型 CI 監控彈出視窗，其中包含通過／失敗／執行中／已略過的檢查數量，以及前往 PR 檢查頁面的連結。偵測作業會透過 `controlUi.sessionPullRequests` 在伺服器端執行；設定 `GH_TOKEN`／`GITHUB_TOKEN` 時，會重複使用閘道的設定。達到 GitHub API 速率限制時，標籤會保留最後已知狀態，並顯示狀態可能已過期的警告；關閉標籤後，該標籤會在目前瀏覽器設定檔中對此工作階段隱藏。
    - 工作階段差異面板會顯示工作階段簽出實際變更的內容：分支按鈕（位於工作區側欄標頭、分割窗格標頭，或單一窗格聊天中的浮動按鈕）會開啟詳細資料面板，顯示相對於簽出之預設分支合併基準的逐檔案差異，涵蓋分支、未提交及未追蹤的工作內容，其中包含狀態圓點、重新命名箭頭、逐檔案 +/− 計數、可收合檔案，以及差異區塊間的 "N unmodified lines" 標記。差異會透過 `sessions.diff` 閘道方法（`operator.read` 範圍）在伺服器端計算；二進位檔案和過大檔案會降級為僅顯示統計資料的項目，而只有在已連線閘道公告 `sessions.diff` 時，按鈕才會出現。
    - 每個聊天窗格中的工作階段工作區側欄會列出工作階段檔案、專案檔案及成品。預設會停駐在窗格右側邊緣；拖曳其標頭（或使用停駐按鈕）即可將它移至底部，且此選擇會儲存在目前的瀏覽器設定檔中。收合的側欄完全不占空間：使用 ⇧⌘B、分割窗格標頭中的檔案切換按鈕，或單一窗格聊天中的浮動檔案按鈕，即可重新開啟（後兩者皆會顯示變更檔案數量徽章）。獨立的檔案、工具及 Canvas 詳細資料面板不受影響。
    - 按一下聊天中的檔案參照、已展開讀取／編輯／寫入工具卡片中的檔案路徑，或工作區側欄中的檔案列，會開啟檔案詳細資料面板：這是以 CodeMirror 為基礎的程式碼檢視，提供語法醒目提示、行號、跳至指定行、檔案內搜尋、複製動作，以及在外部編輯器中開啟的選單。當閘道向 `operator.admin` 連線公告 `sessions.files.set` 時，面板會新增 Edit 模式，其中包含未儲存變更追蹤及使用 Cmd/Ctrl-S 儲存；未儲存的草稿在目前瀏覽器分頁中切換檔案、面板和工作階段時仍會保留，直到明確儲存或捨棄。儲存作業會依 `sessions.files.get` 傳回的內容雜湊進行比較後交換：如果檔案自載入後已在磁碟上變更（例如代理程式仍持續處理），面板會顯示衝突通知，並提供 Reload（採用最新內容）及 Overwrite（保留本機編輯）動作。寫入作業會使用與讀取作業相同且確保檔案系統安全的工作區防護措施，包括路徑範圍限制、拒絕符號連結／硬連結，以及 256 KB UTF-8 上限，且只能覆寫現有檔案；編輯器絕不會建立或刪除檔案。
    - 每個聊天窗格中的背景工作側欄會列出目前代理程式的背景工作及子代理程式（`tasks.list` 依代理程式設定範圍，並透過 `task` 事件保持即時更新）：執行中的工作會顯示即時經過時間計時器、工具使用次數、目前使用中的工具及停止控制項；可收合的已完成區段則會新增執行持續時間；View transcript 連結可在窗格中開啟該工作的子工作階段。使用分割窗格標頭中的活動切換按鈕，或單一窗格聊天中的浮動活動按鈕即可開啟；工作快照會預先載入，因此兩者無須先開啟側欄，即會顯示執行中數量徽章。Tasks 頁面仍會保留完整的跨代理程式工作清冊。
    - 工作區側欄、背景工作側欄及詳細資料面板會依各窗格本身的寬度調整，而非依視窗寬度調整：在狹窄窗格或緊湊視窗中，兩個側欄都會呈現為底部區帶（側邊停駐控制項會隱藏，直到窗格變寬；當空間只容得下一欄時，工作區側欄會優先占用側邊位置），而詳細資料面板會堆疊在線程下方，使用水平調整大小控點，而不會與其共用同一列。手機大小的可視區域仍會以全螢幕開啟詳細資料面板。
    - 聊天標頭中的模型及思考選擇器會透過 `sessions.patch` 立即修補作用中的工作階段；它們是持久的工作階段覆寫設定，而非僅限單次傳送的選項。
    - **分割檢視：**從右上角的浮動切換按鈕列開啟（位於工作階段差異、背景工作和工作階段檔案切換按鈕旁），接著向右或向下分割作用中的窗格，直到達到可容納的窗格數量。每個窗格都有各自的工作階段、逐字稿、撰寫區及工具串流。
    - 將工作階段從側邊欄拖曳至聊天，即可在窗格中開啟。動畫式放置預覽會在各區域間平順移動並標示結果，在新窗格即將占用的確切一半區域上顯示 "Split"，在整個窗格上顯示 "Open here"；單一窗格模式也支援拖放。
    - 作用中的分割窗格會決定側邊欄選取項目及 URL。每個窗格都有自己的標頭列，其中包含工作階段標題，以及工作區側欄、分割和關閉控制項；分隔線可調整欄寬及堆疊窗格大小，而瀏覽器會將版面配置儲存在本機，並在重新載入後保留。
    - 在窄螢幕上，分割檢視會保留版面配置，但只呈現作用中的窗格，包括含關閉控制項的標頭。
    - 如果你在同一工作階段的模型選擇器變更仍在儲存時傳送訊息，撰寫區會等待該工作階段修補完成，再呼叫 `chat.send`，以確保使用所選模型傳送。
    - 輸入 `/new` 會建立並切換至與 New Chat 相同的全新儀表板工作階段，但若已設定 `session.dmScope: "main"`，且目前父工作階段是代理程式的主要工作階段，則會就地重設主要工作階段。輸入 `/reset` 則會保留閘道針對目前工作階段的明確就地重設行為。
    - 聊天模型選擇器會要求閘道提供已設定的模型檢視。如果存在 `agents.defaults.models`，該允許清單會決定選擇器內容，包括讓供應商範圍目錄保持動態的 `provider/*` 項目。否則，選擇器會顯示明確的 `models.providers.*.models` 項目，以及具有可用驗證資訊的供應商。完整目錄仍可透過偵錯用的 `models.list` RPC 搭配 `view: "all"` 取得。
    - 當最新的閘道工作階段用量報告包含目前的上下文權杖時，聊天撰寫區工具列會顯示一個小型上下文用量環，並標示已使用百分比。開啟此環即可查看目前的上下文視窗、最近一次執行的權杖計數及預估總成本、供應商／模型識別資訊，以及最新供應商回應所回報的輸入／輸出／快取成本明細。當上下文壓力偏高時，此環會切換為警告樣式；達到建議的壓縮程度時，則會顯示一個緊湊按鈕，用以執行一般的工作階段壓縮路徑。過時的權杖快照會隱藏，直到閘道再次回報最新用量。

  </Accordion>
  <Accordion title="通話模式（瀏覽器即時語音）">
    通話模式會使用已註冊的即時語音供應商。若要設定 OpenAI，請使用 `talk.realtime.provider: "openai"`，並搭配 `openai` API 金鑰設定檔、`talk.realtime.providers.openai.apiKey` 或 `OPENAI_API_KEY`。OpenAI Realtime 使用公開的 Platform API，並需要 Platform API 金鑰；Codex OAuth 登入無法滿足此介面的需求。若要設定 Google，請使用 `talk.realtime.provider: "google"`，並搭配 `talk.realtime.providers.google.apiKey`。瀏覽器永遠不會收到標準的供應商 API 金鑰：OpenAI 會收到用於 WebRTC 的暫時性 Realtime 用戶端密鑰，而 Google Live 會收到用於瀏覽器 WebSocket 工作階段、僅能使用一次且受限的 Live API 驗證權杖，其中的指示與工具宣告會由閘道鎖定至權杖內。僅提供後端即時橋接器的供應商會透過閘道中繼傳輸執行，因此認證資訊與供應商通訊端會保留在伺服器端，而瀏覽器音訊則透過已驗證的閘道 RPC 傳輸。Realtime 工作階段提示由閘道組合；`talk.client.create` 不接受呼叫端提供的指示覆寫。

    持久化的供應商、模型、語音、傳輸、推理強度、精確的 VAD 閾值、靜音持續時間及前綴填補預設值位於 **Settings → Communications → Talk**；變更這些設定需要 `operator.admin` 存取權。設定閘道中繼會強制使用後端中繼路徑；設定 WebRTC 則會讓工作階段由用戶端擁有，若供應商無法建立瀏覽器工作階段，系統會失敗，而不會無提示地退回中繼。

    Talk 控制項本身是撰寫器工具列中的麥克風按鈕。其插入符號選單會列出 **System default**，以及瀏覽器公開的所有麥克風，包括 USB、Bluetooth 與虛擬輸入。所選裝置 ID 只會保留在瀏覽器本機，絕不會傳送至閘道；如果該特定裝置消失，Talk 會要求你選擇其他輸入，而不會無提示地改用不同的麥克風錄音。Talk 啟用時，麥克風按鈕會變成顯示即時輸入音量計的膠囊按鈕；按一下會停止語音輸入，游標停留時則會顯示停止圖示。當即時工具呼叫透過 `talk.client.toolCall` 諮詢已設定的較大型模型時，螢幕閱讀器會朗讀 `Connecting voice input...`、`Listening...` 或 `Asking OpenClaw...`。停止正在執行的代理程式回應仍使用膠囊按鈕旁獨立的方形 **Stop** 控制項。

    維護者即時冒煙測試：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 會驗證 OpenAI 後端 WebSocket 橋接器、OpenAI 瀏覽器 WebRTC SDP 交換、Google Live 受限權杖的瀏覽器 WebSocket 設定，以及搭配模擬麥克風媒體的閘道中繼瀏覽器介面卡。此命令只會輸出供應商狀態，不會記錄密鑰。

  </Accordion>
  <Accordion title="停止與中止">
    - 按一下 **Stop**（呼叫 `chat.abort`）。
    - 執行作業進行期間，一般後續訊息會進入佇列。在佇列訊息上按一下 **Steer**，即可將該後續訊息注入正在執行的回合。
    - 輸入 `/stop`（或獨立的中止片語，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`），以透過頻帶外方式中止。
    - `chat.abort` 支援使用 `{ sessionKey }`（不含 `runId`）中止該工作階段的所有進行中執行作業。

  </Accordion>
  <Accordion title="保留中止時的部分內容">
    - 執行作業中止時，使用者介面仍可顯示助理的部分文字。
    - 當緩衝輸出存在時，閘道會將已中止的部分助理文字持久保存至文字記錄歷程。
    - 持久保存的項目包含中止中繼資料，讓文字記錄取用端能區分中止時的部分內容與正常完成的輸出。

  </Accordion>
</AccordionGroup>

## 連線中斷與重新連線

工作階段建立後，閘道連線中斷並不會將你登出。用戶端使用退避機制（800 ms，最高 15 s）自動重試時，儀表板會保持顯示，並在頂端列下方顯示浮動的琥珀色 “閘道連線已中斷 — 正在重新連線…” 膠囊提示。即時更新及即時／工作階段動作會暫停，直到連線恢復；膠囊提示中的 **Retry now** 會強制立即嘗試。聊天內容仍可編輯：一般文字與附件傳送會保留在目前分頁中以閘道／工作階段為範圍的瀏覽器儲存空間，顯示為等待重新連線，並在閘道恢復後自動傳送。離線時，即時控制項與斜線命令仍無法使用。

如果此瀏覽器已持有認證資訊（已設定的權杖／密碼或已核准的裝置權杖），首次開啟與重新載入時，會在建立連線期間顯示小型動畫 OpenClaw 標誌，而不會短暫顯示登入閘道。只有在尚未儲存認證資訊，或閘道主動拒絕認證資訊（權杖／密碼錯誤、配對已撤銷）時，才會顯示登入閘道——這些狀態需要你輸入資訊，而不是等待即可解決。

## 安裝 PWA 與 Web Push

Control UI 隨附 `manifest.webmanifest` 與 Service Worker，因此現代瀏覽器可以將其安裝為獨立 PWA。即使分頁或瀏覽器視窗未開啟，Web Push 也能讓閘道透過通知喚醒已安裝的 PWA。

如果頁面在 OpenClaw 更新後立即顯示 **Protocol mismatch**，請先使用 `openclaw dashboard` 重新開啟儀表板並強制重新整理。如果仍然失敗，請清除儀表板來源的網站資料，或在無痕瀏覽器視窗中測試；舊分頁或瀏覽器的 Service Worker 快取可能會繼續執行更新前的 Control UI 套件，並連線至較新的閘道。

| 介面                                                  | 功能                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 資訊清單。可存取後，瀏覽器會提供 “Install app”。                |
| `ui/public/sw.js`                                     | 處理 `push` 事件與通知點擊的 Service Worker。                       |
| `push/vapid-keys.json`（位於 OpenClaw 狀態目錄下）    | 自動產生的 VAPID 金鑰組，用於簽署 Web Push 承載資料。               |
| `push/web-push-subscriptions.json`                    | 持久保存的瀏覽器訂閱端點。                                         |

如果你想固定金鑰（多主機部署、密鑰輪替或測試），請透過閘道處理程序的環境變數覆寫 VAPID 金鑰組：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（預設為 `https://openclaw.ai`）

Control UI 使用以下受範圍限制的閘道方法註冊及測試瀏覽器訂閱：

- `push.web.vapidPublicKey` 會擷取作用中的 VAPID 公開金鑰。
- `push.web.subscribe` 會註冊 `endpoint` 及 `keys.p256dh`／`keys.auth`。
- `push.web.unsubscribe` 會移除已註冊的端點。
- `push.web.test` 會傳送測試通知至呼叫端的訂閱。

<Note>
Web Push 與 iOS APNS 中繼路徑無關（如需中繼支援的推播，請參閱[設定](/zh-TW/gateway/configuration)），也與以原生行動裝置配對為目標的 `push.test` 方法無關。
</Note>

## 託管嵌入內容

助理訊息可以使用 `[embed ...]` 短代碼，在行內呈現託管的網頁內容。iframe 沙箱原則由 `gateway.controlUi.embedSandbox` 控制：

隨附的 Canvas 外掛也提供 [`show_widget`](/tools/show-widget)，可直接從工具呼叫呈現自足式 SVG 或 HTML。瀏覽器會宣告 `inline-widgets` 閘道功能，且重新載入聊天記錄後，產生的 Canvas 文件仍可使用。源自頻道的執行作業不會取得此工具。

<Tabs>
  <Tab title="strict">
    停用託管嵌入內容中的指令碼執行。
  </Tab>
  <Tab title="scripts (default)">
    允許互動式嵌入內容，同時維持來源隔離；通常足以支援自足式瀏覽器遊戲／小工具。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 之外加入 `allow-same-origin`，供刻意需要較高權限的同站文件使用。
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
只有在嵌入文件確實需要同源行為時，才使用 `trusted`。對於大多數由代理程式產生的遊戲和互動式畫布，`scripts` 是更安全的選擇。
</Warning>

預設會封鎖絕對外部 `http(s)` 嵌入 URL。若要讓 `[embed url="https://..."]` 載入第三方頁面，請設定 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天訊息寬度

聊天文字記錄使用與撰寫器對齊、置中且易於閱讀的框架。在該框架內，助理與工具輸出維持靠左對齊，而使用者訊息泡泡則維持靠右對齊。寬螢幕部署可以設定 `gateway.controlUi.chatMessageMaxWidth`，在不修改隨附 CSS 的情況下覆寫文字記錄寬度：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

此值會在傳送至瀏覽器之前進行驗證。支援的形式包括純長度與百分比（例如 `960px` 或 `82%`），以及受限的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 寬度運算式。

## Tailnet 存取（建議）

<Tabs>
  <Tab title="整合式 Tailscale Serve（首選）">
    讓閘道維持在迴路位址上，並由 Tailscale Serve 透過 HTTPS 進行 Proxy：

    ```bash
    openclaw gateway --tailscale serve
    ```

    開啟 `https://<magicdns>/`（或你設定的 `gateway.controlUi.basePath`）。

    根據預設，當 `gateway.auth.allowTailscale` 為 `true` 時，Control UI／WebSocket Serve 要求可透過 Tailscale 身分標頭（`tailscale-user-login`）進行驗證。OpenClaw 會使用 `tailscale whois` 解析 `x-forwarded-for` 位址並比對標頭，以驗證身分，而且只有當要求透過迴路位址傳入，並具有 Tailscale 的 `x-forwarded-*` 標頭時，才會接受這類驗證。對於具有瀏覽器裝置身分的 Control UI 操作員工作階段，這個已驗證的 Serve 路徑也會略過裝置配對往返流程；沒有裝置身分的瀏覽器及節點角色連線仍會遵循一般裝置檢查。如果你希望即使是 Serve 流量也必須使用明確的共用密鑰認證資訊，請設定 `gateway.auth.allowTailscale: false`，然後使用 `gateway.auth.mode: "token"` 或 `"password"`。

    對於這個非同步 Serve 身分路徑，系統會在寫入速率限制資料前，將相同用戶端 IP 與驗證範圍的驗證失敗嘗試序列化。因此，同一瀏覽器同時進行的錯誤重試，可能會在第二個要求顯示 `retry later`，而不是讓兩個單純的不符錯誤平行競爭。

    <Warning>
    無權杖 Serve 驗證假設閘道主機可信任。如果該主機可能執行不受信任的本機程式碼，請要求使用權杖／密碼驗證。
    </Warning>

  </Tab>
  <Tab title="繫結至 tailnet + 權杖">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    開啟 `http://<tailscale-ip>:18789/`（或你設定的 `gateway.controlUi.basePath`）。

    將相符的共用密鑰貼到使用者介面設定中（以 `connect.params.auth.token` 或 `connect.params.auth.password` 傳送）。

  </Tab>
</Tabs>

## 不安全的 HTTP

如果你透過純 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）開啟儀表板，瀏覽器會在**非安全環境**中執行，並封鎖 WebCrypto。根據預設，OpenClaw 會**封鎖**沒有裝置身分的 Control UI 連線。

文件記載的例外情況：

- 僅限 localhost 的不安全 HTTP 相容模式：`gateway.controlUi.allowInsecureAuth=true`
- 透過 `gateway.auth.mode: "trusted-proxy"` 成功完成操作員 Control UI 驗證
- 緊急解鎖選項 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**建議的修正方式：**使用 HTTPS（Tailscale Serve），或在本機開啟位於 `https://<magicdns>/`（Serve）或 `http://127.0.0.1:18789/`（閘道主機上）的使用者介面。

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

    `allowInsecureAuth` 僅是本機相容性切換：

    - 它允許 localhost 的控制介面工作階段在非安全的 HTTP 情境中，無須裝置身分即可繼續。
    - 它不會略過配對檢查。
    - 它不會放寬遠端（非 localhost）的裝置身分要求。

  </Accordion>
  <Accordion title="僅供緊急存取">
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
    `dangerouslyDisableDeviceAuth` 會停用控制介面的裝置身分檢查，並大幅降低安全性。緊急使用後請儘速還原。
    </Warning>

  </Accordion>
  <Accordion title="受信任 Proxy 注意事項">
    - 成功的受信任 Proxy 驗證可允許 **operator** 控制介面工作階段在沒有裝置身分的情況下進入。
    - 這**不會**延伸至 node-role 控制介面工作階段。
    - 同一主機上的迴送反向 Proxy 仍不符合受信任 Proxy 驗證；請參閱[受信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

如需 HTTPS 設定指引，請參閱 [Tailscale](/zh-TW/gateway/tailscale)。

## 內容安全政策

控制介面採用嚴格的 `img-src` 政策：僅允許**同源**資產、`data:` URL，以及在本機產生的 `blob:` URL。遠端 `http(s)` 和協定相對圖片 URL 會遭瀏覽器拒絕，且絕不會發出網路擷取要求。

實際上：

- 透過相對路徑提供的頭像和圖片（例如 `/avatars/<id>`）仍可顯示，包括由控制介面擷取並轉換成本機 `blob:` URL 的已驗證頭像路由。
- 內嵌的 `data:image/...` URL 仍可顯示。
- 控制介面建立的本機 `blob:` URL 仍可顯示。
- GitHub 連結預覽頭像由閘道從 GitHub 的固定頭像主機擷取，並以有大小限制的 `data:` URL 傳回；操作者的瀏覽器絕不會連線至遠端頭像主機。
- 頻道中繼資料產生的遠端頭像 URL 會由控制介面的頭像輔助函式移除，並替換為內建標誌／徽章，因此遭入侵或惡意的頻道無法強迫操作者的瀏覽器任意擷取遠端圖片。

此功能一律啟用，且無法設定。

## 頭像路由驗證

設定閘道驗證後，控制介面的頭像端點需要與其餘 API 相同的閘道權杖：

- `GET /avatar/<agentId>` 僅向已驗證的呼叫端傳回頭像圖片。`GET /avatar/<agentId>?meta=1` 依相同規則傳回頭像中繼資料。
- 對任一路由的未驗證要求都會遭到拒絕（與相鄰的助理媒體路由一致），因此頭像路由不會在其他方面已受保護的主機上洩漏代理程式身分。
- 控制介面擷取頭像時，會將閘道權杖以 bearer 標頭轉送，並使用已驗證的 blob URL，讓圖片仍能在儀表板中顯示。

如果你停用閘道驗證（不建議在共用主機上這麼做），頭像路由也會比照閘道其餘部分變成不需要驗證。

## 助理媒體路由驗證

設定閘道驗證後，助理的本機媒體預覽會使用兩步驟路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 需要一般的控制介面操作者驗證；瀏覽器檢查可用性時，會將閘道權杖以 bearer 標頭傳送。
- 成功的中繼資料回應會包含短效的 `mediaTicket`，其範圍限定為該確切來源路徑。
- 瀏覽器呈現的圖片、音訊、影片和文件 URL 會使用 `mediaTicket=<ticket>`，而非有效的閘道權杖或密碼。此票證會迅速到期，且無法授權不同的來源。

這可讓媒體呈現與瀏覽器原生媒體元素相容，同時避免將可重複使用的閘道認證資訊放入可見的媒體 URL。

## 核准連結

操作者核准通知可以深層連結至保留的 `${controlUiBasePath}/approve/{approvalId}` 命名空間下所提供的獨立核准文件（例如 `/approve/<approvalId>`，或在已設定基底路徑時使用 `/openclaw/approve/<approvalId>`）。此 URL 在核准的有效期間內保持穩定，且可安全地在你自己的裝置之間轉送：它只會識別核准，絕不會授權核准。

- 閘道會先於外掛 HTTP 路由，為**所有** HTTP 方法保留單一區段的 `/approve/<approvalId>` 命名空間，因此外掛路由絕不會遮蔽或攔截核准文件。
- 開啟核准文件需要與控制介面其餘部分相同的閘道驗證（權杖／密碼、Tailscale Serve 身分或受信任 Proxy 身分）；認證資訊絕不會成為核准 URL 的一部分。
- 停用控制介面提供服務時，對該命名空間的要求會傳回 `404`，而不會轉交給外掛處理常式。
- 在核准文件中登入僅對該頁面暫時有效：它不會覆寫同一瀏覽器中完整控制介面所儲存的閘道選擇或設定。

閘道從 `dist/control-ui` 提供靜態檔案：

```bash
pnpm ui:build
```

選用的絕對基底（固定資產 URL）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

本機開發（獨立的開發伺服器）：

```bash
pnpm ui:dev
```

接著將介面指向你的閘道 WS URL（例如 `ws://127.0.0.1:18789`）。

## 空白的控制介面頁面

如果瀏覽器載入空白儀表板，且 DevTools 未顯示有用的錯誤，可能是擴充功能或提前執行的內容指令碼阻止 JavaScript 模組應用程式進行求值。當 `<openclaw-app>` 在啟動後仍未註冊時，靜態頁面會顯示純 HTML 復原面板。

變更瀏覽器環境後，使用面板的 **Try again** 動作；或在完成以下檢查後手動重新載入：

- 停用會注入所有頁面的擴充功能，尤其是具有 `<all_urls>` 內容指令碼的擴充功能。
- 嘗試使用私密視窗、全新的瀏覽器設定檔或其他瀏覽器。
- 保持閘道執行，並在變更瀏覽器後驗證相同的儀表板 URL。

## 偵錯／測試：開發伺服器 + 遠端閘道

控制介面由靜態檔案組成；WebSocket 目標可以設定，也可以與 HTTP 來源不同。當你想在本機使用 Vite 開發伺服器，但閘道在其他位置執行時，這會很方便。

<Steps>
  <Step title="啟動介面開發伺服器">
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
    - 載入後，`gatewayUrl` 會儲存在 localStorage 中，並從 URL 移除。
    - 如果你透過 `gatewayUrl` 傳入完整的 `ws://` 或 `wss://` 端點，請對該值進行 URL 編碼，讓瀏覽器能正確剖析查詢字串。
    - 只要可行，`token` 應透過 URL 片段（`#token=...`）傳遞。片段不會傳送至伺服器，因此可避免要求記錄和 Referer 洩漏。為了相容性，舊版 `?token=` 查詢參數仍會匯入一次，但僅作為備用方式，且會在啟動程序後立即移除。
    - `password` 僅保存在記憶體中。
    - 設定 `gatewayUrl` 後，介面不會退回使用設定或環境認證資訊。請明確提供 `token`（或 `password`）；未提供明確認證資訊即為錯誤。
    - 當閘道位於 TLS 後方（Tailscale Serve、HTTPS Proxy 等）時，請使用 `wss://`。
    - `gatewayUrl` 僅能在頂層視窗中使用（不可嵌入），以防止點擊劫持。
    - 公開的非迴送控制介面部署必須明確設定 `gateway.controlUi.allowedOrigins`（完整來源）。來自迴送位址、RFC1918／連結本機位址、`.local`、`.ts.net` 或 Tailscale CGNAT 主機的私有同源 LAN／Tailnet 載入，無須啟用 Host 標頭備用機制即可接受。
    - 閘道啟動時，可能會根據有效執行階段的繫結和連接埠，填入 `http://localhost:<port>` 和 `http://127.0.0.1:<port>` 等本機來源，但遠端瀏覽器來源仍需明確列出。
    - 除了嚴格控管的本機測試外，請勿使用 `gateway.controlUi.allowedOrigins: ["*"]`；這表示允許任何瀏覽器來源，而不是「符合我目前使用的任何主機」。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 會啟用 Host 標頭來源備用模式，但這是危險的安全模式。

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

## 相關內容

- [儀表板](/zh-TW/web/dashboard) — 閘道儀表板
- [健康情況檢查](/zh-TW/gateway/health) — 閘道健康情況監控
- [終端介面](/zh-TW/web/tui) — 終端使用者介面
- [WebChat](/zh-TW/web/webchat) — 瀏覽器聊天介面
