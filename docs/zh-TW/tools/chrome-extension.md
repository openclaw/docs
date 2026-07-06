---
read_when:
    - 你想要代理程式從手機操作你實際已登入的 Chrome
    - 你一直遇到 Chrome「允許遠端偵錯？」提示，但桌前沒有人
    - 您想要了解透過擴充功能接管瀏覽器的安全模型
summary: Chrome 擴充功能：讓 OpenClaw 驅動你已登入的 Chrome，且不出現遠端偵錯提示
title: Chrome 擴充功能
x-i18n:
    generated_at: "2026-07-06T10:53:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c189e8f5585fb28544190690a2177e247d6f7e213b1e33c0534d74dde2eeae62
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Chrome 擴充功能

OpenClaw Chrome 擴充功能可讓代理控制你的**已登入 Chrome
分頁**，不必啟動另一個受管理瀏覽器，也**不會**出現 Chrome 會阻擋流程的「允許遠端偵錯？」提示。

當你從手機（Telegram、WhatsApp 等）驅動 OpenClaw 時，這一點很重要：
[`user` 設定檔](/zh-TW/tools/browser#profiles-openclaw-user-chrome)會透過
Chrome 的遠端偵錯連接埠連上，這會跳出桌面同意對話框；當你不在電腦前時沒有人能點選。
此擴充功能改用 `chrome.debugger` API，因此頁面內唯一的提示是 Chrome 可關閉的
「OpenClaw 已開始偵錯此瀏覽器」橫幅。

這與 Anthropic 的 Claude in Chrome 和 OpenAI 的 Codex Chrome 擴充功能採用相同形式。

## 運作方式

三個部分：

- **瀏覽器控制服務**（閘道或節點主機）：`browser`
  工具呼叫的 API。
- **擴充功能轉送**（loopback WebSocket）：控制服務在 `127.0.0.1`
  上啟動的小型伺服器。它向 OpenClaw 提供 Chrome DevTools Protocol 端點，
  並與擴充功能通訊。兩端都使用主機本機權杖進行驗證（見下方）。
- **OpenClaw Chrome 擴充功能**（MV3）：透過 `chrome.debugger` 附加到分頁、
  轉送 CDP 流量，並管理 **OpenClaw 分頁群組**。

OpenClaw 只能看見並控制位於 **OpenClaw 分頁群組**中的分頁。
該群組就是同意邊界：將分頁拖入即可分享；將分頁拖出（或點擊工具列按鈕）即可立即撤銷存取權。

## 安裝並配對

1. 印出未封裝擴充功能路徑：

   ```bash
   openclaw browser extension path
   ```

2. 開啟 `chrome://extensions`，啟用**開發人員模式**，點擊**載入未封裝項目**，
   並選取印出的目錄。

3. 印出配對字串：

   ```bash
   openclaw browser extension pair
   ```

4. 點擊 OpenClaw 工具列圖示，並將配對字串貼到彈出視窗中。
   擴充功能連上轉送後，徽章會變成**開啟**。

配對權杖是首次使用時建立的**主機本機密鑰**，並儲存在狀態目錄下的
`credentials/`（模式 `0600`）。每台執行瀏覽器的機器，也就是閘道主機和每個瀏覽器節點主機，都擁有自己的權杖，
因此憑證不需要在機器之間傳送。若要輪替，請刪除
`browser-extension-relay.secret` 檔案並重新配對。

## 使用方式

在 `browser` 工具呼叫中選取內建的 `chrome` 設定檔，或將它設為預設值：

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

- 分享分頁：在該分頁上點擊 OpenClaw 工具列按鈕（它會加入
  OpenClaw 分頁群組），或將任何分頁拖入該群組。
- 代理也可以開啟新分頁；這些分頁會自動落在該群組中。
- 撤銷：再次點擊按鈕、將分頁拖出群組，或關閉 Chrome 的偵錯橫幅。
  代理會立即失去該分頁的存取權。

## 遠端瀏覽器節點

無論 Chrome 是在閘道主機上執行，還是在另一台
[瀏覽器節點主機](/zh-TW/tools/browser#local-vs-remote-control)上執行，此擴充功能都能運作。
轉送一律只限 loopback，且執行在**裝有瀏覽器的機器上**：

- **同一主機**（閘道 + Chrome 在同一台機器上）：在該機器上配對。
- **遠端節點**（Chrome 在節點上，閘道在其他地方）：在**該節點**上執行
  `openclaw browser extension path` / `pair`，並在那裡載入及配對擴充功能。
  閘道會透過既有已驗證的節點連線，將瀏覽器操作代理到該節點；該節點的本機轉送會驅動擴充功能。
  節點上不會開啟新的傳入連接埠。

配對權杖是逐主機設定，因此每個節點都會印出自己的字串。

## 診斷

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

在擴充功能彈出視窗顯示**已連線**之前，`doctor` 會回報
**Chrome 擴充功能轉送**檢查失敗。

## 安全模型

- 轉送只綁定 loopback；兩個 WebSocket 端都使用衍生權杖驗證，
  且擴充功能端會檢查來源是否為 `chrome-extension://`。
- 代理只能看見並驅動 **OpenClaw 分頁群組**中的分頁。你的其他分頁會保持私密。
- 相較於 `user`（Chrome MCP）設定檔在你核准遠端偵錯提示後會暴露整個已登入瀏覽器，
  此擴充功能會將分享範圍限制在你一眼就能控管的分頁群組中。

另請參閱：[瀏覽器](/zh-TW/tools/browser)，了解完整設定檔模型，以及受管理的
`openclaw` 和 Chrome MCP `user` 設定檔。
