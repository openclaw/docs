---
read_when:
    - 從零開始的初次設定
    - 你想要最快開始使用可用聊天功能的方法
summary: 幾分鐘內安裝好 OpenClaw，並開始你的第一次對話。
title: 開始使用
x-i18n:
    generated_at: "2026-07-16T12:04:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f50073b059477636b94e128cec90b41dcc21c8bb132e34900e68409cacf70eb
    source_path: start/getting-started.md
    workflow: 16
---

安裝 OpenClaw、執行新手引導，並在約 5 分鐘內開始與你的 AI 助理聊天。完成後，你將擁有一個執行中的閘道、已設定的驗證機制，以及可正常運作的聊天工作階段。

## 你需要準備

- **Node.js 22.22.3+、24.15+ 或 25.9+**（建議預設使用 24）
- 模型供應商（Anthropic、OpenAI、Google 等）的 **API 金鑰** — 新手引導會提示你輸入

<Tip>
使用 `node --version` 檢查你的 Node 版本。
**Windows 使用者：**原生 Windows Hub 應用程式是最簡單的桌面使用方式。
也支援 PowerShell 安裝程式與 WSL2 閘道路徑。請參閱 [Windows](/zh-TW/platforms/windows)。
需要安裝 Node？請參閱 [Node 設定](/zh-TW/install/node)。
</Tip>

## 快速設定

<Steps>
  <Step title="安裝 OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="安裝指令碼流程"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    其他安裝方式（Docker、Nix、npm）：[安裝](/zh-TW/install)。
    </Note>

  </Step>
  <Step title="執行新手引導">
    ```bash
    openclaw onboard --install-daemon
    ```

    精靈會引導你選擇模型供應商、設定 API 金鑰，以及設定閘道。快速開始通常只需幾分鐘，但供應商登入、頻道配對、常駐程式安裝、網路下載、Skills 或選用外掛，可能會讓完整的新手引導花費較長時間。你可以略過選用步驟，之後再使用 `openclaw configure` 返回設定。

    如需完整參考資料，請參閱[新手引導（命令列介面）](/zh-TW/start/wizard)。

  </Step>
  <Step title="確認閘道正在執行">
    ```bash
    openclaw gateway status
    ```

    你應該會看到閘道正在連接埠 18789 上監聽。

  </Step>
  <Step title="開啟儀表板">
    ```bash
    openclaw dashboard
    ```

    這會在你的瀏覽器中開啟控制介面。如果能正常載入，即表示一切運作正常。

  </Step>
  <Step title="傳送第一則訊息">
    在控制介面的聊天中輸入訊息，你應該會收到 AI 回覆。

    想改用手機聊天嗎？最快可完成設定的頻道是
    [Telegram](/zh-TW/channels/telegram)（只需要機器人權杖）。如需所有選項，請參閱[頻道](/zh-TW/channels)。

  </Step>
</Steps>

<Accordion title="進階：掛載自訂控制介面組建">
  如果你維護的是本地化或自訂的儀表板組建，請將
  `gateway.controlUi.root` 指向包含已建置靜態資產和
  `index.html` 的目錄。

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# 將已建置的靜態檔案複製到該目錄。
```

接著設定：

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

重新啟動閘道並再次開啟儀表板：

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## 後續步驟

<Columns>
  <Card title="連接頻道" href="/zh-TW/channels" icon="message-square">
    Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo 等。
  </Card>
  <Card title="配對與安全性" href="/zh-TW/channels/pairing" icon="shield">
    控制哪些人可以向你的代理程式傳送訊息。
  </Card>
  <Card title="設定閘道" href="/zh-TW/gateway/configuration" icon="settings">
    模型、工具、沙箱與進階設定。
  </Card>
  <Card title="瀏覽工具" href="/zh-TW/tools" icon="wrench">
    瀏覽器、執行、網頁搜尋、Skills 與外掛。
  </Card>
</Columns>

<Accordion title="進階：環境變數">
  如果你以服務帳號執行 OpenClaw，或想使用自訂路徑：

- `OPENCLAW_HOME` — 用於內部路徑解析的主目錄
- `OPENCLAW_STATE_DIR` — 覆寫狀態目錄
- `OPENCLAW_CONFIG_PATH` — 覆寫設定檔路徑

完整參考資料：[環境變數](/zh-TW/help/environment)。
</Accordion>

## 相關內容

- [安裝概覽](/zh-TW/install)
- [頻道概覽](/zh-TW/channels)
- [設定](/zh-TW/start/setup)
