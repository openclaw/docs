---
read_when:
    - 你想要讓代理程式從手機操控你實際已登入的 Chrome 瀏覽器
    - 你不斷遇到 Chrome 的「允許遠端偵錯？」提示，但桌前沒有人可操作
    - 你想了解透過擴充功能接管瀏覽器的安全模型
summary: Chrome 擴充功能：讓 OpenClaw 控制你已登入的 Chrome，且不顯示遠端偵錯提示
title: Chrome 擴充功能
x-i18n:
    generated_at: "2026-07-19T14:06:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3d974f62bb5697a23dd6a6852137ce6af5a8a4a2a8ff738eec0098f259e8faa0
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Chrome 擴充功能

OpenClaw Chrome 擴充功能可讓代理控制你**已登入的 Chrome
分頁**，無需啟動獨立的受管理瀏覽器，也**不會**出現 Chrome
會阻擋操作的「Allow remote debugging?」提示。

當你從手機（Telegram、WhatsApp 等）操作 OpenClaw 時，這一點很重要：
[`user` 設定檔](/zh-TW/tools/browser#profiles-openclaw-user-chrome)會透過
Chrome 的遠端偵錯連接埠連線，而這會彈出桌面同意對話框；你不在電腦旁時，
沒有人能點擊它。此擴充功能改用 `chrome.debugger` API，因此頁面中唯一的提示是
Chrome 可關閉的「OpenClaw started debugging this browser」橫幅。

Anthropic 的 Claude in Chrome 和 OpenAI 的 Codex Chrome 擴充功能也採用相同的架構。

## 運作方式

由三個部分組成：

- **瀏覽器控制服務**（閘道或節點主機）：`browser`
  工具呼叫的 API。
- **擴充功能中繼站**（迴路 WebSocket）：由控制服務在
  `127.0.0.1` 上啟動的小型伺服器。它向 OpenClaw 提供 Chrome DevTools
  Protocol 端點，並與擴充功能通訊。雙方都使用主機本機權杖進行驗證（請見下文）。
- **OpenClaw Chrome 擴充功能**（MV3）：使用 `chrome.debugger`
  附加至分頁、轉送 CDP 流量，並管理 **OpenClaw 分頁群組**。

OpenClaw 只能查看及控制 **OpenClaw 分頁群組**中的分頁。此群組就是同意邊界：
將分頁拖入群組即可分享；將其拖出（或按一下工具列按鈕）即可立即撤銷存取權。

## 安裝與配對

1. 輸出未封裝擴充功能的路徑：

   ```bash
   openclaw browser extension path
   ```

2. 開啟 `chrome://extensions`、啟用 **Developer mode**、按一下 **Load
   unpacked**，然後選取輸出的目錄。

3. 輸出配對字串：

   ```bash
   openclaw browser extension pair
   ```

4. 按一下 OpenClaw 工具列圖示，並將配對字串貼入彈出視窗。
   擴充功能連線至中繼站後，徽章會變成**開啟**。

配對權杖是在首次使用時建立的**主機本機祕密**，並儲存在狀態目錄下的
`credentials/`（模式為 `0600`）。每台執行瀏覽器的機器（閘道主機及每台
瀏覽器節點主機）都有自己的權杖，因此不必在機器之間傳送認證資訊。若要輪替權杖，
請刪除 `browser-extension-relay.secret` 檔案並重新配對。

## 使用方式

在 `browser` 工具呼叫中選取內建的 `chrome` 設定檔，或將其設為
預設值：

```bash
openclaw config set browser.defaultProfile chrome
```

```json5
{
  browser: {
    profiles: {
      chrome: { driver: "extension", color: "#FF4500" },
    },
  },
}
```

- 分享分頁：在該分頁按一下 OpenClaw 工具列按鈕（它會加入
  OpenClaw 分頁群組），或將任何分頁拖入群組。
- 代理也可以開啟新分頁；這些分頁會自動加入群組。
- 撤銷：再次按一下按鈕、將分頁拖出群組，或關閉
  Chrome 的偵錯橫幅。代理會立即失去該分頁的存取權。

### 分頁副駕駛側邊面板

配對擴充功能後，在其工具列彈出視窗中按一下**開啟分頁副駕駛**。
OpenClaw 會為該特定 Chrome 分頁設定 `sidepanel.html`；資訊清單沒有全域
側邊面板路徑。因此，每個分頁都有獨立的面板文件、閘道工作階段、訊息訂閱，
以及具型別的瀏覽器工具繫結。

面板不會將頁面 URL、標題、DOM 或可見文字放入你的訊息。它只會傳送你輸入的文字。
瀏覽器動作會攜帶經閘道驗證的獨立繫結，其中包含 Chrome 分頁和 CDP 目標；
瀏覽器工具會拒絕替換該目標或使用瀏覽器全域動作的嘗試。回覆會留在面板
（`deliver: false`）中；不會繼承 Telegram、Discord 或其他頻道路由。

副駕駛是專用的已配對閘道裝置，具有 `operator.read` 和
`operator.write` 範圍。首次使用時，請檢查並核准其要求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

擴充功能會保留該裝置身分及閘道核發的裝置權杖，其範圍限定於核發它們的標準閘道端點。
配對不同的閘道會建立各自獨立的身分、權杖及工作階段保管關係；認證資訊和工作階段
絕不會跨端點重複使用。擴充功能不會持久儲存閘道共用祕密。面板只能訂閱其自身的
分頁工作階段，閘道會在傳遞前篩選這些事件。

若執行期間閘道連線中斷，擴充功能會持久保管該執行 ID。重新連線後，它會先中止
尚未解決的執行，再重新啟用任何面板，接著重新載入對話記錄。這項失敗時關閉步驟
可避免瀏覽器動作在傳遞中斷期間於不可見的情況下繼續執行。

關閉分頁會立即移除其即時訂閱、中止任何可見的執行，並將該分頁的工作階段標記為
已封存。若閘道暫時離線，擴充功能會持久儲存待處理的封存作業，且只在同一個閘道端點
重新連線時重試；絕不會將封存要求傳送至不同的閘道。瀏覽器當機後，下次啟動時會封存
前一個瀏覽器執行個體留下的工作階段。已封存的工作階段會拒絕新工作，但其對話記錄
仍可在工作階段歷史記錄中使用。瀏覽器副駕駛金鑰屬於討論串工作階段，因此一般的
存續時間與項目數量維護會保留它們。每個代理的工作階段磁碟預算仍然適用
（預設為 `2gb`），並可能在空間不足時移除最舊的工作階段；請參閱
[工作階段維護](/zh-TW/reference/session-management-compaction#store-maintenance-and-disk-controls)。

側邊面板目前需要由閘道託管的擴充功能中繼站，或直接連線至遠端閘道的中繼站。
瀏覽器節點上的迴路中繼站目前還無法提供具型別分頁繫結所需的節點路由，因此面板
會拒絕此拓撲，而不會退回使用瀏覽器全域路由。

## 將頁面傳送至 OpenClaw

使用工具列彈出視窗中的**將頁面傳送至 OpenClaw**，即可與主要 OpenClaw 工作階段
分享可閱讀的頁面文字。你可以加入選填備註、使用頁面或選取範圍的右鍵選單，
或按下 `Alt+Shift+S`。若目前有選取內容，OpenClaw 會優先使用該內容，
將分享排入系統事件佇列，並立即喚醒主要工作階段。

該分頁不必位於 OpenClaw 分頁群組中。這是一次性且明確的分享：頁面上的其他內容
不會暴露，也不會授予持續存取權。Google 文件會使用你已登入的瀏覽器工作階段匯出為
純文字，不需要設定 Google API。X 和 Twitter 討論串會在不包含周圍介面框架的情況下擷取。

頁面文字會包在 OpenClaw 的外部內容安全邊界內。你的選填備註會作為自己的指示，
留在該邊界之外。頁面文字和選取內容的上限約為 120,000 個字元，縮短時會包含截斷標記。

當擴充功能中繼站由閘道託管，且使用同主機配對或直接 `wss://` 閘道配對時，
即可使用頁面分享。由節點託管的中繼站目前會傳回明確錯誤。若要重新對應鍵盤快速鍵，
請開啟 `chrome://extensions/shortcuts`。

## 遠端／跨機器

Chrome 不必在閘道主機上執行。支援三種拓撲：

- **同一主機**（閘道與 Chrome 位於同一台機器）：在該機器上使用
  `openclaw browser extension pair` 配對。中繼站僅限迴路連線。
  如果本機閘道使用 TLS，請透過 `--gateway-url wss://gateway-host.example` 明確傳入其憑證主機名稱；
  配對絕不會改用迴路 IP。
- **直接連線至遠端閘道**（Chrome 在你的筆電上、閘道在 VPS 上，
  而且筆電上**沒有其他元件**）：在閘道上執行
  `openclaw browser extension pair --gateway-url wss://your-gateway.example.com`。
  它會輸出 `wss://…/browser/extension#<secret>` 字串；在筆電上載入並配對擴充功能。
  擴充功能會透過 `wss://` **直接連線至閘道**，筆電上不需要安裝
  OpenClaw、節點、命令列介面，也不需要開放輸入連接埠。這是受管理託管的路徑。
- **透過瀏覽器節點主機**（Chrome 位於已執行 OpenClaw
  節點的機器上）：在節點上執行 `pair` 並於本機配對；閘道會透過
  現有且已驗證的節點連結，將瀏覽器動作代理至該節點。

配對祕密按主機區分（直接連線時為閘道的祕密），並由閘道的
`/browser/extension` 路由驗證。若使用直接連線路徑，請透過 TLS
（`wss://`）提供閘道，以加密配對祕密和 CDP 流量。祕密會保留在配對字串的
URL 片段中，並在 WebSocket 交握期間作為子協定認證資訊提供，因此一般的 Proxy 存取
記錄不會在要求 URL 中收到它。請確保所有反向 Proxy 都保留標準
`Sec-WebSocket-Protocol` 標頭。

## 診斷

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

在擴充功能彈出視窗顯示**已連線**之前，`doctor` 會將
**Chrome 擴充功能中繼站**檢查回報為失敗。

## 安全性模型

- 中繼站僅繫結迴路介面；WebSocket 雙方都使用衍生權杖進行驗證，
  且擴充功能端會針對 `chrome-extension://` 檢查來源。
- 直接閘道配對不接受要求 URL 中的中繼站權杖；
  隨附的擴充功能會改為在 WebSocket 子協定清單中攜帶該權杖。
- 代理只能查看及操作 **OpenClaw 分頁群組**中的分頁。
  你的其他分頁仍會保持私密。
- 側邊面板執行具有雙重範圍限制：閘道傳遞使用各工作階段的
  允許清單，而瀏覽器工具則強制執行在提示之外攜帶的 Chrome 分頁／目標繫結。
- 相較於 `user`（Chrome MCP）設定檔會在你核准遠端偵錯
  提示後暴露整個已登入的瀏覽器，此擴充功能會將分享範圍限制在你一眼即可控制的
  分頁群組內。

另請參閱：[瀏覽器](/zh-TW/tools/browser)，以瞭解完整的設定檔模型，以及受管理的
`openclaw` 和 Chrome MCP `user` 設定檔。
