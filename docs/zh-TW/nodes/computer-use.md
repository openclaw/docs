---
read_when:
    - 讓閘道代理程式查看及控制 Mac 桌面
    - 電腦使用的啟用、權限或安全性
    - 擴充 computer.act 節點命令或其執行器
summary: 透過電腦工具與 `computer.act` 節點命令，在已配對的 macOS 節點上進行代理驅動的桌面控制
title: 電腦操作
x-i18n:
    generated_at: "2026-07-12T14:38:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2457d15a59857ffd9c7b160ea4ebed85c8372754abfc7bf75faafc963ecb6547
    source_path: nodes/computer-use.md
    workflow: 16
---

電腦操作功能讓閘道代理程式能查看並控制已配對的 **macOS** 桌面：它透過現有的 `screen.snapshot` 節點命令擷取螢幕截圖，並透過單一危險節點命令 `computer.act` 操控游標與鍵盤。動作集合遵循 Anthropic 核心電腦操作動作；不提供選用的 `computer_20251124` 縮放功能。具備視覺能力的模型會透過內建的 `computer` 代理程式工具操作它。

代理程式會發出統一命令 `computer.act`；它無法得知節點如何執行該命令。macOS 節點會使用內嵌的 Peekaboo 服務及範圍有限的 CoreGraphics 基本功能，在程序內執行 `computer.act`（需具備正確的 TCC 權限，不會啟動額外程序）。未來其他平台也能執行相同命令，而不必變更面向代理程式的合約。

## 需求

- 已配對的 **macOS** 節點（以節點模式執行的 OpenClaw macOS 應用程式）。
- 啟用 macOS 應用程式設定 **Allow Computer Control**（預設：關閉）。
- 授予 OpenClaw macOS **Accessibility** 權限（用於注入游標／鍵盤輸入）及 **Screen Recording** 權限（用於 `screen.snapshot`）。
- 在閘道上啟用 `computer.act` 命令（此命令具有危險性，預設未啟用）。
- 具備視覺能力的代理程式模型。
- 公開 `computer` 的工具政策。預設的 `coding` 設定檔不會公開此工具。請將 `computer` 加入 `tools.alsoAllow`；沙箱化代理程式也需要將它加入 `tools.sandbox.tools.alsoAllow`。

## `computer` 代理程式工具

內建的 `computer` 工具每次呼叫接受一個動作。座標是最新螢幕截圖中的非負整數像素；節點會將它們對應至顯示器座標點。座標動作必須回傳螢幕截圖結果的 `frameId`，而明確指定的 `screenIndex` 必須與該影格相符。OpenClaw 也會將節點在螢幕截圖中核發的顯示器身分傳入動作，因此顯示器重新連線或幾何配置變更時會以封閉方式失敗，而不會悄悄將同一索引重新指向其他目標。這些檢查會拒絕猜測的權杖，以及來自另一個已傳送影格或顯示器的權杖。權杖不保證時效性：擷取後，應用程式仍可變更同一顯示器上的像素，因此每當畫面可能已變更時，都應重新擷取螢幕截圖。

- 讀取：`screenshot`。
- 游標：`left_click`、`right_click`、`middle_click`、`double_click`、`triple_click`、`mouse_move`、`left_click_drag`（搭配 `startCoordinate`）、`left_mouse_down`、`left_mouse_up`。
- 捲動：`scroll`，搭配 `scrollDirection`（`up|down|left|right`）及 `scrollAmount`（滾輪刻度）。
- 鍵盤：`type`（文字）、`key`（例如 `cmd+shift+t` 或 `Return` 的組合鍵）、`hold_key`（按住 `text` 組合鍵 `duration` 秒）。
- 節奏控制：`wait`（`duration` 秒）。

點擊與捲動動作的輔助鍵會透過 `text` 欄位傳遞（`shift`、`ctrl`、`alt`、`cmd`）。執行輸入動作後，工具會傳回新的螢幕截圖，讓模型觀察結果。如果連線了多個支援電腦操作的節點，請明確傳入 `node`。

螢幕截圖僅供**模型使用**：絕不會自動傳送至聊天頻道。請將所有畫面內容視為不受信任的輸入；工具會警告模型，不要遵循與使用者要求衝突的畫面指示。

## `computer.act` 節點命令

`computer.act` 是此工具用來路由輸入的唯一節點命令（透過 `node.invoke`，並使用 `command: "computer.act"`）。它具有以下特性：

- **預設具有危險性**：列於內建的危險節點命令中，且在明確啟用之前會從執行階段允許清單中排除。macOS 節點仍可在配對時宣告此命令，讓此操作介面只需核准一次。
- 目前**僅限 macOS**：只有已啟用 **Allow Computer Control** 的 macOS 節點會公告此命令。

讀取操作會重複使用 `screen.snapshot`；沒有第二條擷取路徑。共用的擷取命令請參閱[相機與螢幕節點](/zh-TW/nodes/camera)。

## 啟用與授權

1. 在 macOS 應用程式中啟用 **Settings → Allow Computer Control**。接著開啟 **Settings → Permissions**，並在 macOS 系統設定中授予 **Accessibility** 與 **Screen Recording** 權限。
2. 在閘道上核准配對更新（新增命令會強制重新配對）。
3. 將工具公開給具備視覺能力的代理程式。若使用預設的 `coding` 設定檔：

   ```json5
   {
     tools: {
       alsoAllow: ["computer"],
       // 沙箱化代理程式也需要通過這第二道閘門：
       sandbox: { tools: { alsoAllow: ["computer"] } },
     },
   }
   ```

4. 在有限的時間範圍內啟用 `computer.act`。`phone-control` 外掛提供 `computer` 群組：

   ```text
   /phone arm computer 30m
   /phone status
   /phone disarm
   ```

   啟用操作需要 `operator.admin`（或擁有者）權限，並會自動到期。舊版 `/phone arm all` 群組刻意不包含桌面控制；請使用明確的 `computer` 群組。啟用只會切換閘道可叫用的命令；macOS 應用程式仍會強制執行其 **Allow Computer Control** 設定及作業系統權限。

若要永久授權，請將 `computer.act` 加入 `gateway.nodes.allowCommands`，**並從** `gateway.nodes.denyCommands` **移除它**；拒絕清單具有優先權。永久授權不會自動到期。在執行 `/phone arm` 前已存在的項目會在執行 `/phone disarm` 後保留；暫時授權處於啟用狀態時，請勿將其轉為永久授權。

授權刻意分為啟用功能與使用功能兩部分。啟用或
永久設定 `computer.act` 需要管理權限。
啟用後，具備 `operator.write` 權限且已通過驗證的操作員，可以透過
`node.invoke` 叫用 `computer.act`，直到授權到期或遭停用；
不會針對每個動作個別檢查管理員權限。核准宣告
`computer.act` 的節點只會記錄此操作介面，以便之後啟用，並不會
自行啟用叫用功能。

## 安全性

- 授權前，每一層（工具政策、閘道命令政策、macOS 設定、Accessibility 與 Screen Recording）都必須同意。啟用後，在到期或執行 `/phone disarm` 前，動作會直接執行，不會逐一要求確認。
- 文字輸入會一次傳送一個字素。取消、連線中斷、暫停、停用或端點替換都會在下一個字素前停止輸入，避免繼續傳送已失效的剩餘內容。
- 螢幕截圖僅供模型使用，絕不會自動傳送至聊天（議題 [#44759](https://github.com/openclaw/openclaw/issues/44759)）。
- 請將畫面內容視為不受信任；其中可能包含提示詞注入。

## 與其他桌面控制路徑的關係

這是由代理程式驅動的路徑。若要了解它與 PeekabooBridge 主機、Codex Computer Use，以及直接使用的 `cua-driver` MCP 之間的關係，請參閱 [Peekaboo 橋接器](/zh-TW/platforms/mac/peekaboo)。
