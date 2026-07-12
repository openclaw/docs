---
read_when:
    - 你想要讓代理程式透過手機操控你已實際登入的 Chrome 瀏覽器
    - 你一直遇到 Chrome 的「Allow remote debugging?」提示，但桌前沒有人操作
    - 你想了解透過擴充功能接管瀏覽器的安全模型
summary: Chrome 擴充功能：讓 OpenClaw 操控您已登入的 Chrome，且不顯示遠端偵錯提示
title: Chrome 擴充功能
x-i18n:
    generated_at: "2026-07-11T21:49:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb3f7d4bd9d933e0e876d21a1edf07bafbdc18d0196ce636981bd11ad5f2facd
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Chrome 擴充功能

OpenClaw Chrome 擴充功能可讓代理控制您**已登入的 Chrome 分頁**，無須啟動個別的受管理瀏覽器，也**不會**觸發 Chrome 阻擋操作的「Allow remote debugging?」提示。

當您從手機（Telegram、WhatsApp 等）操作 OpenClaw 時，這一點非常重要：[「`user` 設定檔」](/zh-TW/tools/browser#profiles-openclaw-user-chrome)會透過 Chrome 的遠端偵錯連接埠連線，並在桌面上彈出同意對話方塊；您不在電腦旁時，沒有人能按下確認。此擴充功能則改用 `chrome.debugger` API，因此頁面中唯一的提示是 Chrome 可關閉的「OpenClaw started debugging this browser」橫幅。

這與 Anthropic 的 Claude in Chrome 和 OpenAI 的 Codex Chrome 擴充功能採用相同的架構。

## 運作方式

由三個部分組成：

- **瀏覽器控制服務**（閘道或節點主機）：`browser` 工具呼叫的 API。
- **擴充功能中繼服務**（回送 WebSocket）：控制服務在 `127.0.0.1` 上啟動的小型伺服器。它向 OpenClaw 提供 Chrome DevTools Protocol 端點，並與擴充功能通訊。雙方都使用主機本機權杖進行驗證（請參閱下文）。
- **OpenClaw Chrome 擴充功能**（MV3）：使用 `chrome.debugger` 附加至分頁、轉送 CDP 流量，並管理 **OpenClaw 分頁群組**。

OpenClaw 只能查看和控制 **OpenClaw 分頁群組**中的分頁。該群組就是同意存取的界線：將分頁拖入即可分享；將其拖出（或按一下工具列按鈕）即可立即撤銷存取權。

## 安裝與配對

1. 顯示未封裝擴充功能的路徑：

   ```bash
   openclaw browser extension path
   ```

2. 開啟 `chrome://extensions`、啟用 **Developer mode**、按一下 **Load unpacked**，然後選取所顯示的目錄。

3. 顯示配對字串：

   ```bash
   openclaw browser extension pair
   ```

4. 按一下 OpenClaw 工具列圖示，並將配對字串貼到彈出式視窗中。擴充功能連線至中繼服務後，徽章會顯示 **ON**。

配對權杖是首次使用時建立的**主機本機密鑰**，儲存在狀態目錄的 `credentials/` 下（模式為 `0600`）。每台執行瀏覽器的機器（包括閘道主機及每台瀏覽器節點主機）都有自己的權杖，因此憑證不必在機器之間傳輸。若要輪替權杖，請刪除 `browser-extension-relay.secret` 檔案並重新配對。

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

- 分享分頁：在該分頁上按一下 OpenClaw 工具列按鈕（該分頁會加入 OpenClaw 分頁群組），或將任何分頁拖入群組。
- 代理也可以開啟新分頁；這些分頁會自動加入群組。
- 撤銷存取權：再次按一下按鈕、將分頁拖出群組，或關閉 Chrome 的偵錯橫幅。代理會立即失去該分頁的存取權。

## 遠端／跨機器

Chrome 不一定要在閘道主機上執行。支援以下三種拓撲：

- **同一主機**（閘道與 Chrome 位於同一台機器）：在該機器上使用 `openclaw browser extension pair` 進行配對。中繼服務僅限回送連線。
- **直接連線至遠端閘道**（Chrome 在您的筆記型電腦上、閘道位於 VPS，且筆記型電腦上**沒有其他元件**）：在閘道上執行 `openclaw browser extension pair --gateway-url wss://your-gateway.example.com`。此命令會顯示 `wss://…/browser/extension#<secret>` 字串；請在筆記型電腦上載入擴充功能並進行配對。擴充功能會透過 `wss://` **直接連線至閘道**，筆記型電腦上不需要安裝 OpenClaw、節點、命令列介面，也不需要開放入站連接埠。這是受管理代管的使用方式。
- **透過瀏覽器節點主機**（Chrome 位於已執行 OpenClaw 節點的機器）：在該節點上執行 `pair` 並於本機配對；閘道會透過現有且經過驗證的節點連線，將瀏覽器操作代理轉送至該節點。

配對密鑰為每台主機各自擁有（直接連線時則使用閘道的密鑰），並由閘道的 `/browser/extension` 路由驗證。若使用直接連線方式，請透過 TLS（`wss://`）提供閘道服務，以加密配對密鑰與 CDP 流量。
密鑰會保留在配對字串的 URL 片段中，並在 WebSocket 交握期間作為子協定憑證提供，因此一般的 Proxy 存取記錄不會在請求 URL 中收到該密鑰。請確保任何反向 Proxy 都會保留標準的 `Sec-WebSocket-Protocol` 標頭。

## 診斷

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

在擴充功能彈出式視窗顯示 **Connected** 之前，`doctor` 會將 **Chrome 擴充功能中繼服務**檢查報告為失敗。

## 安全性模型

- 中繼服務僅繫結至回送介面；WebSocket 雙方都會使用衍生權杖進行驗證，且擴充功能端會檢查來源是否為 `chrome-extension://`。
- 閘道直接配對不接受請求 URL 中的中繼權杖；隨附的擴充功能會改為透過 WebSocket 子協定清單攜帶該權杖。
- 代理只能查看和操作 **OpenClaw 分頁群組**中的分頁。您的其他分頁會維持私密。
- 相較於 `user`（Chrome MCP）設定檔在您核准遠端偵錯提示後會暴露整個已登入的瀏覽器，此擴充功能會將共享範圍限制在您可一目瞭然地控制的分頁群組中。

另請參閱：[瀏覽器](/zh-TW/tools/browser)，以瞭解完整的設定檔模型，以及受管理的 `openclaw` 和 Chrome MCP `user` 設定檔。
