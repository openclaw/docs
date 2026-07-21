---
read_when:
    - 實作或審查工作階段儀表板（看板）功能
    - 變更小工具託管、小工具橋接或看板儲存空間
summary: 工作階段儀表板：架構與實作計畫（技術設計，GA 前）
title: 儀表板架構
x-i18n:
    generated_at: "2026-07-21T09:04:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a7c5da94ec19add55c6b7b530f0c17509a027e97fb301469ce48f520b325c169
    source_path: web/dashboard-architecture.md
    workflow: 16
---

<Note>
工作階段儀表板功能的技術設計文件，撰寫於實作之前及
實作期間。這是建置工作的唯一事實來源。功能推出後，
`/web/dashboard` 將成為面向使用者的頁面，而本頁會保留
作為架構參考。
</Note>

## 願景

目前與代理程式協作時，只有文字串流。儀表板會將其變成
工作台：代理程式呈現即時互動式小工具；使用者將它們釘選到
持久化介面上；聊天停駐在側邊（或隱藏），而主要內容則是
看板。你可以從「與代理程式交談」轉變為「操作代理程式為你
建置的控制面板」，全程都不必離開工作階段。

原則：

- **看板是工作階段的一個介面，而不是新的物件。** 每個工作階段（討論串）
  都有兩個介面：對話記錄和看板。沒有釘選小工具的工作階段
  就是一般聊天。釘選一個小工具後，看板即告建立。看板會繼承
  工作階段的識別身分、代理程式擁有權、命名、釘選狀態和生命週期。不存在
  `dashboard_create`、看板登錄檔或獨立的 ACL 模型。
- **代理程式對等性。** 使用者能在看板上執行的所有操作，代理程式都能
  透過工具執行：新增／更新／移除小工具、排列小工具、管理分頁、切換
  可見分頁，以及停駐或隱藏聊天。
- **原生，而非嵌入。** 看板由 Control UI 外殼中的 Lit 元件構成
  （與應用程式其他部分使用相同的設計系統）。只有小工具的_內容_
  會在 iframe 中進行沙箱隔離。沒有網址列，也沒有瀏覽器介面框架。
- **精簡的代理程式操作介面。** 小工具以穩定名稱定址並原地更新。
  版面配置採用可自動壓縮的流動式網格；代理程式指定尺寸和
  錨點，絕不指定像素或座標。
- **以能力取代信任。** 小工具程式碼是代理程式任意撰寫的 HTML/JS，
  並置於嚴格沙箱中。存取範圍（閘道資料、動作、網路）只能透過
  已宣告且由操作者授予的能力資訊清單取得。

## 概念

| 概念                | 定義                                                                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 工作階段（討論串）  | 現有閘道工作階段，以穩定的 `sessionKey` 作為索引鍵。由代理程式擁有。                                                                                         |
| 看板                | 單一工作階段的小工具介面。僅在工作階段具有小工具／分頁時存在。可在 `/new`/`/reset` 後保留（附加至 `sessionKey`，而非對話記錄）。           |
| 分頁                | 看板的呈現頁面：包含哪些小工具、其排列方式，以及聊天停駐狀態（`left`/`right`/`bottom`/`hidden`）。看板一開始有一個隱含分頁。 |
| 小工具              | 由工作階段擁有、具名稱且在沙箱中執行的 HTML/JS 程式。以 `sessionKey` + `name` 定址。依名稱原地更新。                                                |
| 能力資訊清單        | 每個小工具的存取範圍宣告：`data`（讀取繫結）、`actions`（允許清單中的動詞）、`prompt`（傳送至工作階段）、`net`（允許的來源）。 |
| 釘選（小工具）      | 將對話記錄中的小工具移至工作階段的看板（透過使用者操作介面或代理程式工具引數）。取消釘選會將其從看板移除。                                                          |
| 釘選（工作階段）    | 現有的側邊欄工作階段釘選功能。具有看板的已釘選工作階段會在其看板介面開啟。                                                                                          |

## 使用者體驗流程

- **轉換：** 代理程式在任何聊天中呼叫 `show_widget` → 小工具會與目前完全相同，
  直接呈現在對話記錄中 → 游標停留時顯示 **釘選到儀表板** → 小工具
  出現在工作階段的看板上。代理程式可以傳入 `pin: true` 以執行相同操作。
- **看板檢視：** 具有看板的工作階段會顯示介面切換選項（聊天／儀表板）。
  看板檢視 = 分頁列（僅在分頁數量 >1 時顯示）+ 流動式網格 + 停駐的聊天窗格。
  聊天停駐區可調整大小、移動（左／右／下），也可像側邊欄一樣
  收合。系統會記住每個分頁的停駐狀態。
- **拖曳：** 使用者拖曳小工具；網格會自動壓縮（小工具向上浮動，相鄰項目
  重新排列）。使用調整控點變更大小時，會貼齊尺寸級距。任何人都不能
  使用像素定位。
- **重設警告：** 對具有看板的工作階段執行 `/new` / `/reset` 時，
  Web UI 會要求確認（「內容脈絡會重設，但儀表板會保留」），並保留
  看板。
- **側邊欄：** 已釘選的工作階段如果具有看板，便會呈現其看板介面。
  首頁工作階段的看板是預設的「代理程式儀表板」。
- **互動**（三個層級，請見下文）：無聲的狀態事件、可見的
  提示傳送，以及自動化觸發器。

## 互動層級

1. **狀態事件（預設）。** 模型應得知但不應回應的
   小工具 UI 互動。`bridge.emitState({...})` 會附加結構化的
   工作階段通知（與群組活動通知使用相同機制）。不會啟動代理程式回合；
   模型會在下一次執行時看到累積的通知。
2. **提示（明確交談）。** `bridge.sendPrompt(text)` — 需要使用者
   啟用；將可見的使用者訊息傳送至工作階段（停駐的聊天區會
   顯示該訊息）。受速率限制；除非小工具持有
   `prompt` 能力授權，否則每次傳送都需由使用者確認。
3. **自動化。** `bridge.runAction(name, args)` — 觸發資訊清單中宣告的
   動作。初始動詞集合：`cron.trigger`（立即執行現有的排程工作）和
   `binding.refresh`。排程工作原本就會在可見且隔離的執行工作階段中
   執行，並可使用成本較低的模型：這就是「小型模型驅動小工具」
   的途徑。任何地方都不會有隱藏的工作階段。

## 小工具模型與託管

小工具 HTML/JS 由代理程式撰寫（通常透過 `show_widget`），會包裝於
標準文件外殼中（CSP meta、尺寸回報器、橋接啟動程式），並在
`<iframe sandbox="allow-scripts">` 中呈現（絕不使用 `allow-same-origin`）。

- **行內（對話記錄）小工具**會沿用目前的畫布文件管線：
  寫入狀態目錄下、由閘道提供、依範圍修剪，且無須核准
  （其設計上不具任何能力；提示傳送需由使用者確認）。
- **看板小工具**屬於工作階段狀態：位元組存放在所屬代理程式的 SQLite
  資料庫（`board_widgets`）中，由核心閘道路由
  （`/__openclaw__/board/<agentId>/<sessionKey>/<name>/`）讀取資料庫並提供。
  釘選對話記錄小工具時會複製其位元組。上限：每個小工具 256 KB，
  每個看板 48 個小工具。
- **原地更新：** 再次發出具有相同 `name` 的小工具時，會取代
  位元組、遞增 `revision`、廣播 `board.changed`，而即時檢視只會重新載入
  該 iframe。
- **位元組凍結：** 已授予的能力會繫結至小工具位元組的 sha256。
  變更位元組後，只有在新修訂版宣告的是已授予資訊清單的子集時，才會保留
  `data`/`net`/`actions` 授權；擴大的資訊清單
  會再次要求操作者確認。

### 小工具託管內容；MCP 應用程式是其中一種內容類型

**小工具是 OpenClaw 的基本單元**：具有名稱、已釘選、已設定尺寸、
由工作階段擁有且具有授權記錄的看板儲存格。其內部呈現的是一種
內容類型：

- `html` — 由代理程式透過 `show_widget` 撰寫，位元組存放於看板儲存空間。
- `mcp-app` — 託管於小工具儲存格內的第三方 MCP 應用程式檢視（來自已設定
  伺服器的 `ui://` 資源）。

MCP 應用程式不定義小工具模型；小工具只是新增了託管
它們的能力。識別身分、位置、釘選、授權和面向作者的 API 仍屬於
OpenClaw，因此 `show_widget` 程式碼能維持與目前一樣精簡，而且永遠
不需要知道 MCP Apps 規格的存在。

底層共用基礎架構（簡化之處就在這裡）：

- **單一沙箱主機。** `html` 小工具透過 MCP 應用程式隨附的相同強化
  管線呈現（在專用沙箱來源上使用雙重 iframe，
  依小工具宣告 CSP，並以失敗即拒絕方式解碼），而非使用第二個
  特製 iframe 主機。代理伺服器以值傳遞方式接收 HTML，因此本機內容
  是自然的使用情境。
- **單一授權模型。** 無論小工具屬於哪種類型，其存取範圍都是已授予的允許清單：
  對 `html` 小工具而言是主機工具；對 `mcp-app` 小工具而言，
  則是伺服器提供給應用程式使用的工具（透過現有的 `allowedAppToolNames`
  機制，改為依小工具持久化，而非依每次建立作業）。
- **供 `html` 小工具使用的主機工具**（透過小工具橋接公開，並依授權
  檢查）：
  - `openclaw.prompt.send` — 第 2 層；透過可見的撰寫區路由，
    除非已授權，否則需由使用者確認
  - `openclaw.state.emit` — 第 1 層工作階段通知（合併處理，且有大小上限）
  - `openclaw.data.read` — 參數化唯讀繫結（現有的
    允許清單讀取 RPC 集合），由閘道端解析
  - `openclaw.cron.trigger` — 第 3 層自動化
- **`net` = CSP。** 網路存取範圍使用已推出的每個小工具 CSP
  宣告（`connect-src` 來源）— 可自行更新的天氣小工具會
  直接從沙箱擷取其 API，閘道不會介入。
- **授權。** 未宣告任何項目的小工具會立即呈現（經沙箱隔離、
  `default-src 'none'`，每次傳送提示皆須個別確認）— 信任等級與
  目前的行內聊天小工具相同。宣告工具／來源後，小工具會在看板上進入
  `pending`：預留位置卡片會以人類可讀形式列出這些項目，並提供單次點按的
  **允許**／**拒絕**。授權依小工具名稱區分；對 `html` 小工具而言，
  授權會依位元組凍結（sha256），變更位元組後，只有在
  宣告範圍縮小時才會保留授權。
- **撰寫相容層。** 文件包裝器會注入 `window.openclaw.prompt`、
  `window.openclaw.state`、`window.openclaw.data` 和 `window.openclaw.cron`
  作為穩定的作者 API。儀表板呼叫共用一個與檢視票證繫結的
  要求通道；尺寸回報和佈景主題權杖仍是獨立的主機
  通知。

### 外掛能力宣告

已啟用的外掛可透過 `openclaw.plugin.json` 中的 `dashboard.dataBindings`
和 `dashboard.actionVerbs` 擴充小工具主機。外掛本機 ID 會成為
以外掛 ID 為前綴的授權名稱，例如 `workboard.cards.list` 和
`workboard.dispatch`；外掛 ID 區段中的 `%` 和 `.` 會經過逸出處理，
使不同的外掛／本機 ID 分割方式無法繼承相同的持久化授權。在
外掛註冊期間，OpenClaw 會驗證每個繫結都以相同外掛透過
`operator.read` 註冊的 RPC 為目標，而每個動作都以透過
`operator.write` 註冊的 RPC 為目標；無效的宣告會導致外掛載入失敗。經驗證的
登錄檔只會隨外掛生命週期變更而重建，而小工具授權仍依小工具區分，
並與位元組和修訂版本繫結。

### 已建模的殘餘風險：WebRTC 資料通道

沙箱 CSP 會發出提議的 `webrtc 'block'` 指令，但
[Chromium 目前的 CSP 指令集](https://chromium.googlesource.com/chromium/src/+/main/services/network/public/mojom/content_security_policy.mojom#95)
並未實作該指令。因此，在目前的 Chromium 中，可執行指令碼的小工具
可以使用 WebRTC 資料通道向外傳輸資料。相同的殘餘風險已存在於
`main` 上的行內聊天小工具和 MCP Apps 主機中。

**已接受的取捨：** OpenClaw 不會依此殘餘風險限制可編寫指令碼的小工具。小工具內容只有透過
操作員授予、位元組凍結的 `data:read` 能力，才能存取敏感的 OpenClaw 資料，而沙箱
Permissions Policy 會封鎖相機和麥克風存取。DOM API 防護是盡力而為的縱深防禦，
並非安全邊界，應納入後續強化。

### 對話記錄顯示：一張小工具卡片

行內顯示統一採用小工具基本元件。當工具結果帶有 UI —
`show_widget` 輸出，或包含應用程式資源的 MCP 工具結果 — 系統會具現化一個
**暫時、自動命名的小工具**（工作階段範圍、會清除），而對話記錄會轉譯一張
依內容種類分派的小工具卡片。MCP 應用程式自動顯示完全維持規格預期的行為
（不增加任何模型工作）；其底層本身就是小工具。這會刪除聊天轉譯中平行的
`mcpApp` 特殊處理（介面限制、獨立去重），為每個行內 UI 提供相同的
釘選操作，並讓小工具登錄成為主要的重新開啟路徑（對從未釘選的歷史記錄，
仍以掃描對話記錄重建作為備援）。唯讀、使用票證的獨立主機與面板同樣可作為
持久的重新開啟介面 — 這是要在 T6 評估的整併候選項目，不預先假定會整併。

組合：v1 使用網格相鄰配置（同一分頁中，代理程式框架小工具位於應用程式小工具旁）。
v2 新增**由主機管理的應用程式插槽** — 代理程式小工具 HTML 宣告插槽區域，
主機則將真正的應用程式檢視組合成同層沙箱。應用程式絕不在代理程式的 iframe
內轉譯：巢狀結構會破壞橋接身分，並可能對已授權的應用程式 UI 進行覆蓋／點擊劫持，
因此插槽是版面配置合約，而不是嵌入。

### 伺服器來源的小工具（已釘選的 MCP 應用程式）

使用統一主機後，釘選第三方 MCP 應用程式就只是建立一個從伺服器擷取內容、
而非儲存內容的小工具：`board_widgets` 會保留描述項
（`serverName`、`toolName`、`uiResourceUri`、來源
`toolCallId` + `sessionKey`），而不是 HTML 位元組；面板會在聊天輪次
10 分鐘 TTL 過後重新鑄造檢視租約（過期時重新擷取 `ui://` 資源）。
聊天中的行內 MCP 應用程式檢視會取得與代理程式小工具相同的
**釘選至儀表板**操作。依設計，目前重新開啟的檢視為唯讀；需要保持互動能力的
已釘選應用程式，會取得伺服器應用程式可見工具的持久授權（釘選時向操作員顯示
明確允許清單），並與鑄造它的執行作業解耦。未授權的釘選內容維持唯讀 —
仍可用於顯示型儀表板。v1 會釘選到來源工作階段的面板；跨工作階段釘選需要
租約代理程式，因此延後實作。需與開放中的 PR #109807 協調
（`ui/message` 編排器路由、主題／尺寸傳播）。

### WorkBoard 整合

WorkBoard 整合計畫會讓卡片與面板維持由外掛擁有，同時透過現有的
`sessionKey` 和 `runId`，將已分派的卡片重新串接至其工作階段面板；
透過外掛宣告的繫結與動作公開 WorkBoard 摘要來源和分派功能，並將這些結果與現有的
`html` 和 `mcp-app` 小工具種類組合，而不是引入
WorkBoard 專用的小工具類型。

## 版面配置：流動式網格

12 欄、固定列高、**自動緊密排列**（向上吸附，拖曳時推開旁邊項目 —
採用 gridstack 語意並以原生方式實作；網格數學維持純函式且不依賴 DOM）。
每個分頁的小工具版面配置狀態：`{ name, w (1-12), h (rows) }` 加上
順序。代理程式詞彙：

- `size`：`sm` (3×3) · `md` (6×4) · `lg` (8×6) · `xl` (12×8) · `full`
  （單一小工具分頁）
- `after: <widgetName>` 選用的排序錨點；省略 = 附加
- 使用者可自由拖曳／調整大小；相同的順序＋尺寸模型可來回轉換。

## 資料模型（每個代理程式的資料庫）

在 `agents/<agentId>/agent/openclaw-agent.sqlite` 中新增資料表
（**需要提高代理程式資料庫結構版本 — 合併前必須取得操作員核准**）：

```sql
CREATE TABLE board_tabs (
  session_key TEXT NOT NULL,
  tab_id      TEXT NOT NULL,           -- 短代稱
  title       TEXT NOT NULL,
  position    INTEGER NOT NULL,
  chat_dock   TEXT NOT NULL DEFAULT 'right',  -- left|right|bottom|hidden
  created_by  TEXT NOT NULL,           -- 'user' | 'agent'
  PRIMARY KEY (session_key, tab_id)
) STRICT;

CREATE TABLE board_widgets (
  session_key  TEXT NOT NULL,
  name         TEXT NOT NULL,          -- 穩定的小工具名稱
  tab_id       TEXT NOT NULL,
  title        TEXT,
  html         BLOB NOT NULL,          -- 包裝後的文件原始碼
  sha256       TEXT NOT NULL,
  revision     INTEGER NOT NULL,
  size_w       INTEGER NOT NULL,
  size_h       INTEGER NOT NULL,
  position     INTEGER NOT NULL,       -- 分頁內的順序（自動緊密排列輸入）
  manifest     TEXT NOT NULL DEFAULT '{}',  -- 能力資訊清單 JSON
  grant_state  TEXT NOT NULL DEFAULT 'none', -- none|pending|granted|rejected
  granted_sha  TEXT,                   -- 位元組凍結的授權
  created_by   TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  PRIMARY KEY (session_key, name)
) STRICT;
```

面板存在 = `sessionKey` 有任何資料列。刪除工作階段時會刪除其
面板資料列。`/new`/`/reset` 不會變更它們。

## 通訊協定介面

RPC（核心方法表，typebox 結構描述位於 `gateway-protocol`）：

- `board.get { sessionKey }` → 分頁＋小工具中繼資料（不含位元組）— `operator.read`
- `board.update { sessionKey, ops[] }` — 分頁 CRUD／重新排序、小工具移動／調整大小／
  移除／取消釘選、停駐狀態、聚焦分頁 — `operator.write`
- `board.widget.put { sessionKey, name, html, manifest, placement }` —
  `operator.write`（代理程式工具路徑和釘選路徑）
- `board.widget.grant { sessionKey, name, decision }` — `operator.approvals`
- `board.event { ticket, payload }` — 綁定票證的第 1 層狀態事件擷取；
  保留舊版受信任主機的 `{ sessionKey, widget, payload }` 形狀 —
  `operator.write`
- `board.prompt.authorize { ticket }` — 傳回可見提示傳送是否
  仍需要逐次點擊確認 — `operator.read`
- `board.data.read { ticket, bindingId, params? }` — 閘道端允許清單中的
  核心或作用中外掛讀取繫結解析 — `operator.read`
- `board.action { ticket, action, ... }` — 完全符合授權的自動化分派，
  透過現有排程立即執行路徑，或作用中外掛經驗證的動作動詞 —
  `operator.write`

事件（位於 `EVENT_SCOPE_GUARDS`，讀取範圍）：

- `board.changed { sessionKey, revision, widget? }` — 持久化狀態已變更；
  UI 會重新擷取（當存在 `widget` 時，也會重新載入一個 iframe）。
- `board.command { sessionKey, command }` — 暫時性 UI 驅動（代理程式切換
  可見分頁、切換聊天停駐區）— `ui.command` 模式。

小工具位元組透過已驗證的 HTTP 介面提供，而不是透過通訊端。

## 代理程式工具

共三項工具（核心、永遠註冊；轉譯仍如目前一樣受
`inline-widgets` 用戶端能力限制）：

- `show_widget { title, widget_code, name?, pin?, size?, tab?, after?,
capabilities? }` — 依名稱建立／更新；`pin` 將其放到面板上。
  沒有 `name`/`pin` 時，其行為與目前完全相同（行內、暫時）。
- `dashboard { action, ... }` — 面板管理動詞：`read`、`tab_create`、
  `tab_update`、`tab_delete`、`tabs_reorder`、`widget_move`、`widget_remove`、
  `unpin`、`focus_tab`、`set_chat_dock`。
- 現有的 `cron` 工具涵蓋自動化層；不需要新工具。

工具描述會說明尺寸／錨點詞彙和分層模型。代理程式會透過工作階段通知得知
使用者的第 1 層事件，例如 `[dashboard] user clicked "Refresh" on widget weather (tab main)`。

## 此方案取代的項目

- **刪除 `extensions/workspaces`。** 此功能屬實驗性、`enabledByDefault:
false`，
從未出現在穩定版本中（首次出現於 2026.7.2 beta 版）。不進行遷移；
若存在過時的 `<stateDir>/workspaces/`，doctor 規則會將其移除。
沿用的構想：純網格數學、橋接安全模型（連接埠啟動、
繫結限制、速率限制）、位元組凍結核准。
- **小工具託管從 `extensions/canvas` 移至核心。** 畫布文件
  儲存區、文件包裝器、HTTP 服務，以及 `show_widget` 工具會成為核心功能
  （`src/canvas/`）；外掛保留節點畫布控制工具（`canvas`）和
  A2UI。`pluginSurfaceUrls["canvas"]` 宣告與
  `/__openclaw__/canvas` 路徑是已發布的原生用戶端合約，會維持
  穩定。Discord 工作階段保留由 Discord 擁有的 `show_widget` 變體。

## 非目標（此計畫）

- 多使用者面板共用／ACL（未來功能；將透過工作階段共用提供）。
- 原生 macOS/iOS 面板轉譯（只要它們嵌入
  Control UI，就能取得此功能；行內小工具路徑維持不變）。
- 內建資料小工具（工作階段／用量／排程卡片）— 能力橋接加上
  代理程式編寫的小工具已涵蓋 v1；內建種類登錄可於日後加入。

## 實作計畫

使用獨立工作樹、由 Codex 建置，依序審查＋合併。先合併，再修正。

| #   | 分支                               | 範圍                                                                                                                                                                              | 相依項目                       |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| T1  | `claude/dashboard-remove-workspaces` | 刪除 workspaces 外掛＋UI＋文件＋i18n 鍵；doctor 清理規則                                                                                                              | —                                |
| T2  | `claude/dashboard-canvas-core`       | 將小工具託管＋`show_widget` 提升至核心；canvas 外掛保留節點工具；行為零變更                                                                                | —                                |
| T3  | `claude/dashboard-domain`            | 代理程式資料庫資料表（結構版本提升）、`board.*` RPC＋事件、`dashboard` 工具、`show_widget` 釘選／名稱／資訊清單引數、第 1 層通知、重設時保留面板                                  | T2                               |
| T4  | `claude/dashboard-ui`                | 面板介面＋分頁列＋流動式自動緊密排列網格＋聊天停駐區（左／右／下／隱藏）＋對話記錄釘選操作＋側邊欄面板介面＋重設確認                           | T3（先透過開發用 fixture 模擬） |
| T5  | `claude/dashboard-capabilities`      | 授權儲存區／UI＋位元組凍結；將 `html` 小工具移至共用沙箱主機；主機工具（`openclaw.prompt.send/state.emit/data.read/cron.trigger`）；`net` CSP；編寫相容層 | T3、T4                           |
| T7  | `claude/dashboard-mcp-apps`          | `mcp-app` 內容種類：行內應用程式檢視的釘選操作、描述項儲存、租約重新鑄造／重新整理、持久伺服器工具授權（重用已發布的 MCP Apps 主機）                   | T3、T4                           |
| T6  | 完善                               | 在暫用閘道上進行即時 E2E（真實金鑰）、螢幕擷取、修正、以使用者為中心改寫 `/web/dashboard`、預設啟用審查                                                     | 全部                              |

依儲存庫規則驗證：在本機執行聚焦的 vitest，在
Crabbox/Testbox 執行完整檢查，每次合併前執行 `$autoreview`，並為 T6 進行即時驗證。
