---
read_when:
    - 實作或審查工作階段儀表板（看板）功能
    - 變更小工具託管、小工具橋接器或看板儲存空間
summary: 工作階段儀表板：架構與實作計畫（技術設計，GA 前）
title: 儀表板架構
x-i18n:
    generated_at: "2026-07-19T14:12:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 472b6a9268f552f56b7aaa3ceecaa99e15722188f10d703d3321e9d60166904f
    source_path: web/dashboard-architecture.md
    workflow: 16
---

<Note>
工作階段儀表板功能的技術設計文件，撰寫於實作之前及
實作期間。這是建置工作的權威依據。功能推出後，
`/web/dashboard` 將成為面向使用者的頁面，而本頁會保留
作為架構參考。
</Note>

## 願景

目前與代理程式協作時，呈現的是文字串流。儀表板會將它變成
工作台：代理程式呈現即時、可互動的小工具；使用者將它們釘選至
持續存在的介面；聊天停駐於側邊（或隱藏），主要內容則是
看板。你可以從「與代理程式交談」轉變為「操作代理程式為你建立的
控制面板」，全程不必離開工作階段。

原則：

- **看板是工作階段的一個介面，而不是新物件。** 每個工作階段（討論串）
  都有兩個介面：逐字記錄與看板。沒有釘選小工具的工作階段
  就是一般聊天。釘選一個小工具，看板便會存在。看板會繼承
  工作階段的身分、代理程式擁有權、命名、釘選狀態與生命週期。不會有
  `dashboard_create`、看板登錄檔或獨立的 ACL 模型。
- **代理程式功能對等。** 使用者能在看板上執行的一切操作，代理程式也能
  透過工具執行：新增／更新／移除小工具、排列小工具、管理分頁、切換
  顯示中的分頁，以及停駐或隱藏聊天。
- **原生，而非嵌入。** 看板是 Control UI 外殼中的 Lit 元件
  （使用與應用程式其他部分相同的設計系統）。只有小工具的_內容_
  會在 iframe 中進行沙箱隔離。沒有網址列，也沒有瀏覽器介面框架。
- **精簡的代理程式介面。** 小工具透過穩定名稱定址，並就地更新。
  版面配置採用流動式自動緊縮網格；代理程式只指定尺寸與
  錨點，不會指定像素或座標。
- **以能力取代信任。** 小工具程式碼是由代理程式任意撰寫的 HTML/JS，
  並置於嚴格沙箱中。觸及範圍（閘道資料、動作、網路）只能透過
  已宣告且由操作者授予的能力資訊清單取得。

## 概念

| 概念                | 定義                                                                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 工作階段（討論串）  | 現有的閘道工作階段，以穩定的 `sessionKey` 為索引鍵。由代理程式擁有。                                                                                        |
| 看板                | 單一工作階段的小工具介面。僅在工作階段具有小工具／分頁時存在。可跨越 `/new`/`/reset` 持續存在（附加於 `sessionKey`，而非逐字記錄）。                 |
| 分頁                | 看板的呈現頁面：包含哪些小工具、其排列方式，以及聊天停駐狀態（`left`/`right`/`bottom`/`hidden`）。看板一開始有一個隱含分頁。 |
| 小工具              | 由工作階段擁有、具名且經沙箱隔離的 HTML/JS 程式。以 `sessionKey` + `name` 定址。依名稱就地更新。                                              |
| 能力資訊清單        | 每個小工具的觸及範圍宣告：`data`（讀取繫結）、`actions`（允許清單中的動詞）、`prompt`（傳送至工作階段）、`net`（允許的來源）。                      |
| 釘選（小工具）      | 將逐字記錄中的小工具移至工作階段的看板（透過使用者操作介面或代理程式工具引數）。取消釘選會將其從看板移除。                                         |
| 釘選（工作階段）    | 現有的側邊欄工作階段釘選功能。具有看板的已釘選工作階段會開啟其看板介面。                                                                      |

## 使用者體驗流程

- **升級：** 代理程式在任何聊天中呼叫 `show_widget` → 小工具會與目前完全相同地
  直接呈現在逐字記錄中 → 游標停留時顯示 **釘選至儀表板** → 小工具
  出現在工作階段的看板上。代理程式也可以傳入 `pin: true` 來執行相同操作。
- **看板檢視：** 具有看板的工作階段會提供介面切換器（聊天／儀表板）。
  看板檢視 = 分頁列（僅在分頁數 >1 時顯示）+ 流動式網格 + 停駐聊天窗格。
  聊天停駐區可調整大小、移動（左／右／下），也可像側邊欄一樣
  收合。系統會記住每個分頁的停駐狀態。
- **拖曳：** 使用者拖曳小工具；網格會自動緊縮（小工具向上浮動，相鄰項目
  重新排列）。透過控點調整大小時，會貼齊尺寸級距。任何人都不能
  以像素定位。
- **重設警告：** 對具有看板的工作階段執行 `/new` / `/reset` 時，
  Web UI 會要求確認（「內容脈絡會重設，儀表板會保留」），並保留
  看板。
- **側邊欄：** 已釘選的工作階段若有看板，便會呈現其看板介面。
  首頁工作階段的看板是預設的「代理程式儀表板」。
- **互動**（三個層級，詳見下文）：無聲狀態事件、可見的
  提示傳送，以及自動化觸發。

## 互動層級

1. **狀態事件（預設）。** 模型應得知但不應回應的
   小工具 UI 互動。`bridge.emitState({...})` 會附加結構化的
   工作階段通知（機制與群組活動通知相同）。不會啟動代理程式回合；
   模型會在下次執行時看到累積的通知。
2. **提示（明確交談）。** `bridge.sendPrompt(text)` — 需要使用者
   啟用；將可見的使用者訊息傳送至工作階段（停駐的聊天區會
   顯示該訊息）。此操作有速率限制；除非小工具持有
   `prompt` 能力授權，否則每次傳送都需要使用者確認。
3. **自動化。** `bridge.runAction(name, args)` — 觸發資訊清單中宣告的
   動作。初始動詞集合：`cron.trigger`（立即執行現有的排程工作）與
   `binding.refresh`。排程工作原本就會在可見且隔離的執行工作階段中
   執行，並可使用成本較低的模型：這就是「小型模型驅動小工具」
   的路徑。任何地方都不會有隱藏工作階段。

## 小工具模型與託管

小工具 HTML/JS 由代理程式撰寫（通常透過 `show_widget`），包裝於
標準文件外殼中（CSP 中繼標記、尺寸回報器、橋接啟動程式），並
在 `<iframe sandbox="allow-scripts">` 中呈現（絕不使用 `allow-same-origin`）。

- **行內（逐字記錄）小工具**會保留目前的畫布文件管線：
  寫入狀態目錄、由閘道提供、依範圍清除，且不需核准
  （其設計上不具任何能力——提示傳送須由使用者確認）。
- **看板小工具**屬於工作階段狀態：位元組存放於所屬代理程式的 SQLite
  資料庫（`board_widgets`），並由核心閘道路由
  （`/__openclaw__/board/<agentId>/<sessionKey>/<name>/`）讀取資料庫後提供。
  釘選逐字記錄小工具時會複製其位元組。上限：每個小工具 256 KB，
  每個看板 48 個小工具。
- **就地更新：** 再次發出具有相同 `name` 的小工具時，會取代
  位元組、遞增 `revision`、廣播 `board.changed`，而即時檢視只會重新載入
  該 iframe。
- **位元組凍結：** 已授予的能力會繫結至小工具
  位元組的 sha256。變更位元組後，只有在新修訂版宣告的內容是已授予
  資訊清單的子集時，才會保留 `data`/`net`/`actions` 授權；擴大的資訊清單
  會再次提示操作者。

### 小工具託管內容；MCP 應用程式是其中一種內容類型

**小工具是 OpenClaw 的基本元素**：它是具名、已釘選、具有尺寸、
由工作階段擁有且附有授權記錄的看板儲存格。其中呈現的內容則屬於
某種內容類型：

- `html` — 由代理程式透過 `show_widget` 撰寫，位元組存放於看板儲存空間。
- `mcp-app` — 託管於小工具儲存格內的第三方 MCP 應用程式檢視（來自已設定伺服器的 `ui://` 資源）。

MCP 應用程式不會定義小工具模型；而是小工具獲得了託管
它們的能力。身分、位置、釘選、授權及面向作者的 API 仍由
OpenClaw 所有，因此 `show_widget` 程式碼能維持目前的簡短程度，且永遠
不需要知道 MCP Apps 規格的存在。

底層共用基礎架構（簡化會落實於此）：

- **單一沙箱主機。** `html` 小工具會透過 MCP 應用程式隨附的相同強化
  管線呈現（在專用沙箱來源上使用雙重 iframe，逐小工具 CSP 宣告並以
  失敗時關閉的方式解碼），而不是使用第二套特製的 iframe 主機。
  Proxy 以值的方式接收 HTML，因此本機內容是自然的使用情境。
- **單一授權模型。** 無論小工具屬於何種類型，其觸及範圍都是
  已授予的允許清單：對 `html` 小工具而言是主機工具；對 `mcp-app` 小工具而言，
  則是伺服器允許應用程式使用的工具（透過現有的 `allowedAppToolNames`
  機制，改為對每個小工具持久保存，而非僅限於建立該小工具的執行）。
- **供 `html` 小工具使用的主機工具**（透過小工具橋接公開，並依
  授權進行檢查）：
  - `openclaw.prompt.send` — 第 2 層；經由可見的編寫器路由，
    除非已授權，否則須由使用者確認
  - `openclaw.state.emit` — 第 1 層工作階段通知（合併處理，且有大小上限）
  - `openclaw.data.read` — 參數化唯讀繫結（現有
    允許清單中的讀取 RPC 集合），由閘道端解析
  - `openclaw.cron.trigger` — 第 3 層自動化
- **`net` = CSP。** 網路觸及範圍使用已推出的逐小工具 CSP
  宣告（`connect-src` 來源）——可自行更新的天氣小工具
  直接從沙箱擷取其 API，閘道不會介入。
- **授權。** 未宣告任何內容的小工具會立即呈現（經沙箱隔離、
  `default-src 'none'`，每次提示傳送皆個別確認）——信任程度與
  目前的行內聊天小工具相同。宣告工具／來源會讓小工具在看板上進入
  `pending`：預留位置卡片會以人類可讀的方式列出它們，並提供單點操作的
  **允許**／**拒絕**。授權以小工具名稱為單位；對 `html` 小工具而言，
  授權會依位元組凍結（sha256），而變更後的位元組只有在宣告範圍縮小時
  才會保留授權。
- **撰寫相容層。** 文件包裝器會注入
  `window.openclaw.sendPrompt/emitState/read/call` 作為穩定的作者 API；
  底層傳輸使用我們的通道或 AppBridge，都是小工具作者永遠不會看到的
  內部細節。尺寸回報與佈景主題權杖會透過相同橋接傳遞。

### 逐字記錄顯示：單一小工具卡片

行內顯示統一採用小工具基本元素。當工具結果包含 UI 時——
`show_widget` 輸出或具有應用程式資源的 MCP 工具結果——系統會
具體化一個**暫時、自動命名的小工具**（以工作階段為範圍，會被清除），而
逐字記錄會呈現單一小工具卡片，並依內容類型分派。
MCP 應用程式的自動顯示會完全維持規格預期的方式（模型無需額外工作）；
它在底層其實_就是_小工具。這會刪除聊天呈現中的平行 `mcpApp`
特殊處理（介面管控、個別去重），讓每個
行內 UI 都有相同的釘選操作介面，並使小工具登錄檔成為主要的
重新開啟路徑（針對從未釘選的歷史記錄，仍以掃描逐字記錄重建作為備援）。
唯讀且具票證的獨立主機，與看板同樣可作為
持續存在的重新開啟介面——這是要在 T6 評估的整併候選項目，並非
既定假設。

組合方式：v1 採用網格相鄰配置（代理程式介面框架小工具與應用程式小工具
並列於同一分頁）。v2 新增**由主機管理的應用程式插槽**——代理程式小工具 HTML 會宣告
插槽區域，而主機會將真正的應用程式檢視合成為同層沙箱。
應用程式絕不會在代理程式的 iframe 內呈現：巢狀結構會破壞橋接
身分，並可能讓已授權的應用程式 UI 遭到覆蓋／點擊劫持，因此插槽是
版面配置合約，而非嵌入。

### 伺服器來源的小工具（已釘選的 MCP 應用程式）

使用統一主機後，釘選第三方 MCP 應用程式就只是一個從伺服器擷取內容、而非儲存內容的小工具：`board_widgets` 會保留描述子（`serverName`、`toolName`、`uiResourceUri`、來源 `toolCallId` + `sessionKey`），而非 HTML 位元組；看板則會在聊天輪次的 10 分鐘 TTL 到期後重新核發檢視租約（過期時重新擷取 `ui://` 資源）。聊天中的行內 MCP 應用程式檢視會取得與代理程式小工具相同的**釘選至儀表板**功能。依設計，目前重新開啟的檢視為唯讀；應保持互動能力的已釘選應用程式，會取得伺服器上應用程式可見工具的持久授權（釘選時向操作者顯示明確的允許清單），並與核發授權的執行解耦。未獲授權的釘選項目仍為唯讀，但依然適合用於顯示型儀表板。v1 會釘選至來源工作階段的看板；跨工作階段釘選需要租約代理程式，因此暫緩。請與開放中的 PR #109807（`ui/message` 編輯器路由、主題／尺寸傳遞）協調。

## 版面配置：流動式網格

12 欄、固定列高、**自動緊密排列**（向上吸附，拖曳時將其他項目推開——採用 gridstack 語意，但以原生方式實作；網格運算保持純函式且不依賴 DOM）。每個分頁的小工具版面配置狀態：`{ name, w (1-12), h (rows) }` 加上順序。代理程式詞彙：

- `size`：`sm`（3×3）· `md`（6×4）· `lg`（8×6）· `xl`（12×8）· `full`
  （單一小工具分頁）
- `after: <widgetName>` 選用的排序錨點；省略 = 附加至末尾
- 使用者可自由拖曳／調整大小；相同的順序與尺寸模型可完整往返轉換。

## 資料模型（每個代理程式的資料庫）

在 `agents/<agentId>/agent/openclaw-agent.sqlite` 中新增資料表
（**需要提升代理程式資料庫結構版本——在此變更落地前，必須取得操作者核准**）：

```sql
CREATE TABLE board_tabs (
  session_key TEXT NOT NULL,
  tab_id      TEXT NOT NULL,           -- slug
  title       TEXT NOT NULL,
  position    INTEGER NOT NULL,
  chat_dock   TEXT NOT NULL DEFAULT 'right',  -- left|right|bottom|hidden
  created_by  TEXT NOT NULL,           -- 'user' | 'agent'
  PRIMARY KEY (session_key, tab_id)
) STRICT;

CREATE TABLE board_widgets (
  session_key  TEXT NOT NULL,
  name         TEXT NOT NULL,          -- stable widget name
  tab_id       TEXT NOT NULL,
  title        TEXT,
  html         BLOB NOT NULL,          -- wrapped document source
  sha256       TEXT NOT NULL,
  revision     INTEGER NOT NULL,
  size_w       INTEGER NOT NULL,
  size_h       INTEGER NOT NULL,
  position     INTEGER NOT NULL,       -- order within tab (auto-compact input)
  manifest     TEXT NOT NULL DEFAULT '{}',  -- capability manifest JSON
  grant_state  TEXT NOT NULL DEFAULT 'none', -- none|pending|granted|rejected
  granted_sha  TEXT,                   -- byte-frozen grant
  created_by   TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  PRIMARY KEY (session_key, name)
) STRICT;
```

看板存在 = `sessionKey` 有任何資料列。刪除工作階段時，會刪除其看板資料列。`/new`/`/reset` 不會變更這些資料列。

## 通訊協定介面

RPC（核心方法表，typebox 結構描述位於 `gateway-protocol`）：

- `board.get { sessionKey }` → 分頁 + 小工具中繼資料（不含位元組）— `operator.read`
- `board.update { sessionKey, ops[] }` — 分頁 CRUD／重新排序、小工具移動／調整大小／
  移除／取消釘選、停駐狀態、聚焦分頁 — `operator.write`
- `board.widget.put { sessionKey, name, html, manifest, placement }` —
  `operator.write`（代理程式工具路徑與釘選路徑）
- `board.widget.grant { sessionKey, name, decision }` — `operator.approvals`
- `board.event { sessionKey, widget, payload }` — 第 1 層狀態事件擷取 —
  `operator.write`

事件（位於 `EVENT_SCOPE_GUARDS`，讀取範圍）：

- `board.changed { sessionKey, revision, widget? }` — 持久化狀態已變更；
  UI 會重新擷取（若存在 `widget`，也會重新載入一個 iframe）。
- `board.command { sessionKey, command }` — 暫時性 UI 控制（代理程式切換
  可見分頁、切換聊天停駐區）— `ui.command` 模式。

小工具位元組透過已驗證的 HTTP 介面提供，而非通訊端。

## 代理程式工具

總共三項工具（核心，永遠註冊；算繪仍與目前相同，受
`inline-widgets` 用戶端能力限制）：

- `show_widget { title, widget_code, name?, pin?, size?, tab?, after?,
capabilities? }` — 依名稱建立／更新；`pin` 會將其放置於看板上。
  若沒有 `name`/`pin`，其行為會與目前完全相同（行內、暫時性）。
- `dashboard { action, ... }` — 看板管理動詞：`read`、`tab_create`、
  `tab_update`、`tab_delete`、`tabs_reorder`、`widget_move`、`widget_remove`、
  `unpin`、`focus_tab`、`set_chat_dock`。
- 現有的 `cron` 工具已涵蓋自動化層；不需要新增工具。

工具說明會教導尺寸／錨點詞彙及分層模型。代理程式會透過工作階段通知得知使用者的第 1 層事件，例如
`[dashboard] user clicked "Refresh" on widget weather (tab main)`。

## 此方案取代的項目

- **刪除 `extensions/workspaces`。** 此為實驗性功能，`enabledByDefault:
false`，從未納入穩定版本（首次出現於 2026.7.2 Beta 版）。不進行
  遷移；若存在過時的 `<stateDir>/workspaces/`，doctor 規則會將其移除。
  採用的構想：純網格運算、橋接器安全模型（連接埠啟動、
  繫結閘控、速率限制）、位元組凍結核准。
- **小工具託管從 `extensions/canvas` 移至核心。** 畫布文件
  儲存區、文件包裝器、HTTP 服務及 `show_widget` 工具會成為核心功能
  （`src/canvas/`）；外掛保留節點畫布控制工具（`canvas`）及
  A2UI。`pluginSurfaceUrls["canvas"]` 宣告及
  `/__openclaw__/canvas` 路徑是已發布的原生用戶端契約，會保持
  穩定。Discord 工作階段會保留 Discord 擁有的 `show_widget` 變體。
- **不變更 WorkBoard**（整合是後續計畫）。

## 非目標（本計畫）

- 多使用者看板共享／ACL（未來功能；將透過工作階段共享提供）。
- 原生 macOS／iOS 看板算繪（只要嵌入
  Control UI 即可取得；行內小工具路徑不變）。
- 內建資料小工具（工作階段／用量／排程卡片）— 能力橋接器加上
  代理程式編寫的小工具已足以涵蓋 v1；之後可再加入內建種類登錄檔。
- 儀表板上的 WorkBoard。

## 實作計畫

使用獨立工作樹、由 Codex 建置，依序審查並落地。先落地，再修正。

| #   | 分支                               | 範圍                                                                                                                                                                              | 相依項目                       |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| T1  | `claude/dashboard-remove-workspaces` | 刪除工作區外掛 + UI + 文件 + i18n 索引鍵；doctor 清理規則                                                                                                              | —                                |
| T2  | `claude/dashboard-canvas-core`       | 將小工具託管 + `show_widget` 提升至核心；畫布外掛保留節點工具；行為完全不變                                                                                | —                                |
| T3  | `claude/dashboard-domain`            | 代理程式資料庫資料表（結構版本提升）、`board.*` RPC + 事件、`dashboard` 工具、`show_widget` 釘選／名稱／資訊清單引數、第 1 層通知、重設時保留看板                                  | T2                               |
| T4  | `claude/dashboard-ui`                | 看板介面 + 分頁列 + 流動式自動緊密排列網格 + 聊天停駐區（左／右／下／隱藏）+ 對話記錄釘選功能 + 側邊欄看板介面 + 重設確認                           | T3（先透過開發用測試資料模擬） |
| T5  | `claude/dashboard-capabilities`      | 授權儲存區／UI + 位元組凍結；將 `html` 小工具移至共用沙箱主機；主機工具（`openclaw.prompt.send/state.emit/data.read/cron.trigger`）；`net` CSP；編寫相容層 | T3、T4                           |
| T7  | `claude/dashboard-mcp-apps`          | `mcp-app` 內容種類：行內應用程式檢視上的釘選功能、描述子儲存、重新核發／重新整理租約、持久的伺服器工具授權（重複使用已發布的 MCP Apps 主機）                   | T3、T4                           |
| T6  | 完善                               | 在暫用閘道上進行即時 E2E（真實金鑰）、螢幕擷取畫面、修正、以使用者為中心改寫 `/web/dashboard`、預設啟用審查                                                     | 全部                              |

依存放庫規則進行驗證：在本機執行聚焦的 vitest、在
Crabbox/Testbox 執行完整閘門、每次落地前執行 `$autoreview`，並為 T6 提供即時驗證。
