---
read_when:
    - 你想讓代理程式從手機操控你已登入的真實 Chrome 瀏覽器
    - 你一再遇到 Chrome 的「允許遠端偵錯？」提示，但桌前沒有人可以操作
    - 你想瞭解透過擴充功能接管瀏覽器的安全模型
summary: Chrome 擴充功能：讓 OpenClaw 控制你已登入的 Chrome，且不顯示遠端偵錯提示
title: Chrome 擴充功能
x-i18n:
    generated_at: "2026-07-12T14:52:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cb3f7d4bd9d933e0e876d21a1edf07bafbdc18d0196ce636981bd11ad5f2facd
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Chrome 擴充功能

OpenClaw Chrome 擴充功能可讓代理程式控制你**已登入的 Chrome 分頁**，無須啟動另一個受管理的瀏覽器，也**不會**出現 Chrome 會阻擋操作的「Allow remote debugging?」提示。

當你從手機（Telegram、WhatsApp 等）操作 OpenClaw 時，這點非常重要：[ `user` 設定檔](/zh-TW/tools/browser#profiles-openclaw-user-chrome)會透過 Chrome 的遠端偵錯連接埠連線，並在桌面上彈出同意對話框；當你不在電腦旁時，沒有人能點選它。此擴充功能改用 `chrome.debugger` API，因此頁面內唯一的提示是 Chrome 可關閉的「OpenClaw started debugging this browser」橫幅。

Anthropic 的 Claude in Chrome 與 OpenAI 的 Codex Chrome 擴充功能也採用相同的架構。

## 運作方式

由三個部分組成：

- **瀏覽器控制服務**（閘道或節點主機）：`browser` 工具呼叫的 API。
- **擴充功能中繼服務**（回送 WebSocket）：控制服務在 `127.0.0.1` 啟動的小型伺服器。它向 OpenClaw 提供 Chrome DevTools Protocol 端點，並與擴充功能通訊。雙方都使用主機本機權杖進行驗證（請見下文）。
- **OpenClaw Chrome 擴充功能**（MV3）：使用 `chrome.debugger` 附加至分頁、轉送 CDP 流量，並管理 **OpenClaw 分頁群組**。

OpenClaw 只能查看及控制 **OpenClaw 分頁群組**中的分頁。此群組是同意授權的界線：將分頁拖入群組即可共享，拖出群組（或按一下工具列按鈕）即可立即撤銷存取權。

## 安裝與配對

1. 顯示未封裝擴充功能的路徑：

   ```bash
   openclaw browser extension path
   ```

2. 開啟 `chrome://extensions`，啟用 **Developer mode**，按一下 **Load
   unpacked**，然後選取顯示的目錄。

3. 顯示配對字串：

   ```bash
   openclaw browser extension pair
   ```

4. 按一下 OpenClaw 工具列圖示，並將配對字串貼到彈出式視窗中。
   擴充功能連線至中繼服務後，徽章會變為 **ON**。

配對權杖是首次使用時建立的**主機本機密鑰**，儲存在狀態目錄的 `credentials/` 下（模式為 `0600`）。每台執行瀏覽器的機器（閘道主機及每台瀏覽器節點主機）都有自己的權杖，因此認證資訊不必在機器之間傳輸。若要輪替權杖，請刪除 `browser-extension-relay.secret` 檔案，然後重新配對。

## 使用方式

在 `browser` 工具呼叫中選取內建的 `chrome` 設定檔，或將其設為預設值：

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

- 共享分頁：在該分頁上按一下 OpenClaw 工具列按鈕（它會加入 OpenClaw 分頁群組），或將任何分頁拖入該群組。
- 代理程式也可以開啟新分頁；這些分頁會自動加入群組。
- 撤銷存取權：再次按一下按鈕、將分頁拖出群組，或關閉 Chrome 的偵錯橫幅。代理程式會立即失去該分頁的存取權。

## 遠端／跨機器

Chrome 不必在閘道主機上執行。支援三種拓撲：

- **同一台主機**（閘道與 Chrome 位於同一台機器）：在該機器上使用 `openclaw browser extension pair` 進行配對。中繼服務僅限回送介面。
- **直接連至遠端閘道**（Chrome 位於你的筆記型電腦、閘道位於 VPS，且筆記型電腦上**不需執行任何其他元件**）：在閘道上執行 `openclaw browser extension pair --gateway-url wss://your-gateway.example.com`。它會顯示 `wss://…/browser/extension#<secret>` 字串；在筆記型電腦上載入擴充功能並進行配對。擴充功能會透過 `wss://` **直接連線至閘道**，筆記型電腦上不需要安裝 OpenClaw、節點、命令列介面，也不需要開放對內連入的連接埠。這是受管理代管環境所使用的方式。
- **透過瀏覽器節點主機**（Chrome 位於已執行 OpenClaw 節點的機器）：在該節點上執行 `pair` 並於本機配對；閘道會透過現有且已驗證的節點連線，將瀏覽器操作代理至該節點。

配對密鑰以每台主機為單位（直接連線時為閘道的密鑰），並由閘道的 `/browser/extension` 路由驗證。若使用直接連線方式，請透過 TLS（`wss://`）提供閘道服務，以加密配對密鑰和 CDP 流量。
密鑰會保留在配對字串的 URL 片段中，並在 WebSocket 交握期間以子通訊協定認證資訊的形式提供，因此一般的 Proxy 存取記錄不會在請求 URL 中收到它。請確保所有反向 Proxy 都保留標準的 `Sec-WebSocket-Protocol` 標頭。

## 診斷

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

在擴充功能彈出式視窗顯示 **Connected** 之前，`doctor` 會將 **Chrome 擴充功能中繼服務**檢查回報為失敗。

## 安全性模型

- 中繼服務僅繫結至回送介面；WebSocket 雙方都使用衍生權杖進行驗證，且擴充功能端會檢查來源是否為 `chrome-extension://`。
- 直接配對閘道不接受請求 URL 中的中繼權杖；隨附的擴充功能會改為透過 WebSocket 子通訊協定清單傳送權杖。
- 代理程式只能查看及操作 **OpenClaw 分頁群組**中的分頁。你的其他分頁會保持私密。
- 相較於 `user`（Chrome MCP）設定檔在你核准遠端偵錯提示後會公開整個已登入的瀏覽器，此擴充功能會將共享範圍限制在你能一目瞭然控制的分頁群組內。

另請參閱：[瀏覽器](/zh-TW/tools/browser)，瞭解完整的設定檔模型，以及受管理的 `openclaw` 與 Chrome MCP `user` 設定檔。
