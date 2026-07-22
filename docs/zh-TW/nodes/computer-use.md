---
read_when:
    - 讓閘道代理程式查看並控制已配對的桌面電腦
    - 電腦使用的啟用、權限或安全性
    - 擴充 computer.act 節點命令或其執行器
summary: 透過電腦工具與 computer.act 節點命令進行以功能為基礎的桌面控制
title: 電腦操作
x-i18n:
    generated_at: "2026-07-22T10:37:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: df8ce87e607ce1b22d91e4ed8702d500bccd4d4f59dab7b0eafac565e730d48a
    source_path: nodes/computer-use.md
    workflow: 16
---

電腦操作可讓閘道代理程式查看並控制功能完整且已配對的桌面。資格取決於功能：已連線的節點必須同時宣告 `computer.act` 和 `screen.snapshot`，且後者的結果必須包含 `displayFrameId`。此工具會擷取螢幕截圖作為參考畫面，然後透過危險的 `computer.act` 命令操控指標與鍵盤。動作集遵循 Anthropic 核心電腦操作動作；不提供選用的 `computer_20251124` 縮放功能。具備視覺能力的模型會透過內建的 `computer` 代理程式工具驅動此功能。

代理程式只會發出一種統一命令 `computer.act`；它無法得知節點如何執行該命令。隨附的 macOS 應用程式會使用內嵌的 Peekaboo 服務加上範圍有限的 CoreGraphics 基本功能，在處理程序內處理該命令（需具備正確的 TCC 權限，不會啟動額外處理程序）。Windows 和 Linux 可使用選用的實驗性 `cua-computer` 外掛，並需另行安裝 `cua-driver` 二進位檔。兩種執行端皆採用相同的配對與啟用政策。

## 需求

- 已配對且連線中的節點，須同時宣告 `computer.act` 和 `screen.snapshot`，且 `screen.snapshot` 應傳回 `displayFrameId`。
- **macOS 執行端：**已啟用應用程式設定 **Allow Computer Control**（預設：關閉）。
- **macOS 執行端：**已授予 OpenClaw **Accessibility** 權限（用於注入指標／鍵盤輸入）和 **Screen Recording** 權限（用於 `screen.snapshot`）。
- **Windows/Linux 執行端：**已啟用隨附的 `cua-computer` 外掛，並安裝相容的 `cua-driver` 0.10.x 可執行檔。
- 已在閘道上啟用 `computer.act` 命令（此命令具危險性，預設為停用）。
- 具備視覺能力的代理程式模型。
- 公開 `computer` 的工具政策。預設的 `coding` 設定檔不會公開此工具。請將 `computer` 新增至 `tools.alsoAllow`；沙箱化代理程式也需要將其加入 `tools.sandbox.tools.alsoAllow`。

## `computer` 代理程式工具

內建的 `computer` 工具每次呼叫接受一個動作。座標是最新螢幕截圖中的非負整數像素；節點會將其對應至顯示器上的點。座標動作必須回傳螢幕截圖結果的 `frameId`，而明確指定的 `screenIndex` 必須與該畫面相符。OpenClaw 也會將螢幕截圖中由節點發出的顯示器識別資訊帶入動作，因此顯示器重新連線或幾何配置變更時，系統會採取封閉式失敗，而不會在沒有提示的情況下重新指向相同索引。這些檢查會拒絕猜測的權杖，以及來自其他已傳送畫面或顯示器的權杖。權杖不保證畫面仍為最新狀態：擷取後，應用程式仍可能變更同一顯示器上的像素，因此每當場景可能已變更時，都應擷取新的螢幕截圖。

- 讀取：`screenshot`。
- 指標：`left_click`、`right_click`、`middle_click`、`double_click`、`triple_click`、`mouse_move`、`left_click_drag`（搭配 `startCoordinate`）、`left_mouse_down`、`left_mouse_up`。
- 捲動：`scroll`，搭配 `scrollDirection`（`up|down|left|right`）和 `scrollAmount`（滾輪刻度）。
- 鍵盤：`type`（文字）、`key`（例如 `cmd+shift+t` 或 `Return` 的組合鍵）、`hold_key`（按住 `text` 組合鍵 `duration` 秒）。
- 節奏控制：`wait`（`duration` 秒）。

按一下和捲動動作會透過 `text` 欄位攜帶輔助按鍵（`shift`、`ctrl`、`alt`、`cmd`）。執行輸入動作後，工具會傳回新的螢幕截圖，讓模型觀察結果。如果連線了多個支援電腦操作的節點，請明確傳入 `node`。

螢幕截圖僅供**模型使用**：絕不會自動傳送至聊天頻道。請將螢幕上的所有內容視為不受信任的輸入；工具會警告模型，不要遵循與使用者要求衝突的螢幕指示。

## Windows 和 Linux（實驗性，透過 cua-driver）

隨附的 `cua-computer` 外掛為 Windows 和 Linux 節點主機提供實驗性執行端。此功能預設為停用，且需要預發行版 0.10.x 驅動程式合約：

1. 從[上游發行版本](https://github.com/trycua/cua/releases)安裝 `cua-driver` 0.10.x 二進位檔，並確保可透過 `PATH` 存取。若要使用其他可執行檔位置，請設定 `plugins.entries.cua-computer.config.driverPath`。
2. 啟用外掛：

   ```bash
   openclaw plugins enable cua-computer
   ```

3. 從互動式桌面工作階段啟動 `openclaw node run`。首次收到擷取或動作要求時，外掛才會延遲啟動本機驅動程式常駐程式。

此執行端目前只能控制主要顯示器。X11/XWayland 是 Linux 的首選路徑。原生 Wayland 仍是上游的選用功能：請在啟動節點前自行設定 `CUA_DRIVER_RS_ENABLE_WAYLAND`；OpenClaw 絕不會自動設定。上游原生 Wayland 輸入路徑不支援 KDE/KWin。由於 cua-driver 0.10.x 沒有跨平台桌面範圍的按住狀態合約，因此無法使用 `hold_key`、`left_mouse_down` 和 `left_mouse_up`。兩個平台皆無法使用按住輔助鍵的捲動與拖曳，Linux 也無法使用按住輔助鍵的按一下動作。`key` 動作接受具名按鍵、字母和輔助鍵組合（例如 `cmd+c` 或 `Return`）；數字和標點符號按鍵會遭拒絕，因為驅動程式會捨棄依鍵盤配置而定的 Shift 狀態，因此請改用 `type` 動作傳送這類文字。在一次 `type_text` 驅動程式呼叫途中，無法取消文字輸入。

由於 cua-driver 不會回報穩定的顯示器識別資訊，畫面授權會繫結至驅動程式連線以及目前主要顯示器的幾何配置。常駐程式或工作階段重新連線會使尚未使用的畫面失效，但若在保持連線開啟的情況下，將主要顯示器替換為幾何配置相同的顯示器，則無法偵測；此執行端建議使用穩定的單一顯示器工作階段。

OpenClaw 會針對其管理的 `mcp` 和 `serve` 處理程序停用 cua-driver 遙測與更新檢查。它不會下載或更新驅動程式二進位檔。

### 疑難排解

`cua-computer` 執行端會在工具結果和節點記錄中顯示具型別的錯誤代碼。常見錯誤如下：

| 代碼                                                 | 原因                                                                                                                                                           | 修正方式                                                                                                                                                                                                                                  |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `COMPUTER_DRIVER_UNAVAILABLE`                        | `cua-driver` 二進位檔不在 `PATH` 上（或 `driverPath` 不正確）、常駐程式未及時就緒，或節點不是 Windows/Linux。                 | 在 `PATH` 上安裝 `cua-driver` 0.10.x，或設定 `driverPath`。在互動式桌面工作階段中執行 `openclaw node run`；在 Linux 上，請確保存在 X11 `DISPLAY`（或搭配 `CUA_DRIVER_RS_ENABLE_WAYLAND` 的 `WAYLAND_DISPLAY`）。 |
| `COMPUTER_DRIVER_UNSUPPORTED`                        | 已連線的驅動程式不是 `cua-driver` 0.10.x，或其功能／結構描述版本不同。                                                                      | 安裝支援的 0.10.x 組建。修正後，外掛約每 30 秒會重新探測一次，因此不需要重新啟動節點。                                                                                                          |
| `COMPUTER_REFUSED_<code>`                            | 驅動程式以 `background_unavailable`、`background_occluded` 或 `foreground_unavailable`（KDE/KWin Wayland）等結構化代碼拒絕此動作。   | 將目標視窗移至最前方、切換至 X11，或使用支援的合成器。請參閱上方的相容性注意事項。                                                                                                                    |
| `COMPUTER_STALE_FRAME`                               | 座標參照的螢幕截圖已不再是目前畫面（內容壓縮、顯示器幾何配置變更，或參考寬度變更）。                 | 在執行座標動作前重新取得 `screenshot`。                                                                                                                                                                              |
| `COMPUTER_UNSUPPORTED_ACTION`                        | 此執行端無法如實執行的動作：`hold_key`、`left_mouse_down`、`left_mouse_up`、按住輔助鍵的拖曳／捲動，或 Linux 上按住輔助鍵的按一下動作。 | 使用支援的動作。cua-driver 0.10.x 沒有桌面範圍的按住輸入合約。                                                                                                                                                  |
| `COMPUTER_UNSUPPORTED_DISPLAY`                       | 非主要 `screenIndex`、擷取／螢幕幾何配置不相符，或游標位於主要顯示器之外。                                                       | 僅操控主要顯示器。                                                                                                                                                                                                      |
| `COMPUTER_UNSUPPORTED_KEY`                           | 驅動程式無法可靠重現的 `key` 值：Shift 狀態取決於鍵盤配置的數字或標點符號按鍵，或未知按鍵。                        | 改用 `type` 動作傳送該文字。                                                                                                                                                                                    |
| `COMPUTER_DRIVER_ERROR` / `COMPUTER_INVALID_REQUEST` | 驅動程式在沒有結構化代碼的情況下失敗，或動作引數格式錯誤。                                                                            | 檢查驅動程式狀態並重新擷取螢幕截圖；修正動作引數。                                                                                                                                                        |

## `computer.act` 節點命令

`computer.act` 是工具用來路由輸入的唯一節點命令（`node.invoke` 搭配 `command: "computer.act"`）。其特性如下：

- **預設具有危險性**：列於內建的危險節點命令中，且在明確啟用前不會納入執行階段允許清單。macOS、Windows 和 Linux 桌面節點仍可在配對時宣告此命令，讓此功能介面只需核准一次。
- **依功能判定**：工具要求已連線的節點同時宣告 `computer.act` 和 `screen.snapshot`。隨附的 macOS 應用程式和選用的實驗性 `cua-computer` 外掛會執行同一組命令。

讀取作業會重複使用 `screen.snapshot`；沒有第二條擷取路徑。共用擷取命令請參閱[相機與螢幕節點](/zh-TW/nodes/camera)。

## 啟用與解除鎖定

1. 啟用平台執行器：在 macOS 上，啟用 **Settings → Allow Computer Control**，然後在 **Settings → Permissions** 下授予 **Accessibility** 和 **Screen Recording**；在 Windows/Linux 上，依照上方的實驗性 `cua-computer` 設定操作。
2. 在閘道上核准配對更新（新命令會強制重新配對）。
3. 將工具提供給具備視覺能力的代理程式。針對預設的 `coding` 設定檔：

   ```json5
   {
     tools: {
       alsoAllow: ["computer"],
       // 沙箱化代理程式也需要通過這第二道管制：
       sandbox: { tools: { alsoAllow: ["computer"] } },
     },
   }
   ```

4. 在有限時段內啟用 `computer.act`。`phone-control` 外掛提供 `computer` 群組：

   ```text
   /phone arm computer 30m
   /phone status
   /phone disarm
   ```

   啟用需要 `operator.admin`（或擁有者）權限，且會自動到期。舊版 `/phone arm all` 群組刻意排除桌面控制；請使用明確的 `computer` 群組。啟用只會切換閘道可叫用的功能；節點應用程式仍會強制執行其平台特定設定及作業系統權限，包括 macOS 上的 **Allow Computer Control**、Accessibility 和 Screen Recording。

若要持續授權，請將 `computer.act` 加入 `gateway.nodes.commands.allow`，**並將其從** `gateway.nodes.commands.deny` **移除**；拒絕清單優先。持續授權不會自動到期。在 `/phone arm` 之前就已存在的項目，於 `/phone disarm` 後仍會保留；暫時授權處於啟用狀態時，請勿將其轉換為持續授權。

授權刻意區分為啟用與使用兩個階段。啟用或
持續設定 `computer.act` 需要管理權限。
啟用後，具備 `operator.write` 的已驗證操作員可透過
`node.invoke` 叫用 `computer.act`，直到授權到期或遭停用為止；
不會針對每個動作檢查管理員權限。核准宣告
`computer.act` 的節點只會記錄此功能介面，以便日後啟用，
本身並不會啟用叫用功能。

## 安全性

- 授權之前，每一層（工具政策、閘道命令政策、節點應用程式設定及平台權限）都必須同意。對目前的 macOS 執行器而言，這包括 **Allow Computer Control**、Accessibility 和 Screen Recording。啟用後，動作會在沒有逐項確認的情況下執行，直到授權到期或 `/phone disarm` 為止。
- macOS 執行器會一次傳送一個字素的文字，因此取消、斷線、暫停、停用或取代端點，都會使其在傳送下一個字素前停止。實驗性的 cua-driver 執行器無法在輸入過程中途取消 `type_text` 呼叫。
- 螢幕截圖僅供模型使用，絕不會自動傳送至聊天（議題 [#44759](https://github.com/openclaw/openclaw/issues/44759)）。
- 請將螢幕內容視為不受信任；其中可能包含提示詞注入。

## 與其他桌面控制路徑的關係

這是由代理程式驅動的路徑。如需瞭解它與 PeekabooBridge 主機、Codex Computer Use 及直接 `cua-driver` MCP 的關係，請參閱 [Peekaboo 橋接器](/zh-TW/platforms/mac/peekaboo)。
