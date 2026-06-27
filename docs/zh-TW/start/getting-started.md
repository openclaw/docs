---
read_when:
    - 從零開始的首次設定
    - 你想要最快速建立可用聊天的路徑
summary: 幾分鐘內安裝 OpenClaw 並開始你的第一次聊天。
title: 開始使用
x-i18n:
    generated_at: "2026-06-27T20:03:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 769682cfa35a361cc4adc49f010fed18cf897ce66e1404d07b631e4dede64de8
    source_path: start/getting-started.md
    workflow: 16
---

安裝 OpenClaw、執行初始設定，並與你的 AI 助理聊天——全部約 5 分鐘即可完成。完成後，你會有一個正在執行的閘道、已設定的驗證，以及可用的聊天工作階段。

## 你需要準備

- **Node.js**——建議使用節點 24（也支援節點 22.19+）
- **API 金鑰**，來自模型提供者（Anthropic、OpenAI、Google 等）——初始設定會提示你輸入

<Tip>
使用 `node --version` 檢查你的節點版本。
**Windows 使用者：**原生 Windows Hub 應用程式是最簡單的桌面路徑。也支援 PowerShell 安裝程式和 WSL2 閘道路徑。請參閱 [Windows](/zh-TW/platforms/windows)。
需要安裝節點？請參閱 [節點設定](/zh-TW/install/node)。
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
    其他安裝方法（Docker、Nix、npm）：[安裝](/zh-TW/install)。
    </Note>

  </Step>
  <Step title="執行初始設定">
    ```bash
    openclaw onboard --install-daemon
    ```

    精靈會引導你選擇模型提供者、設定 API 金鑰，
    並設定閘道。大約需要 2 分鐘。

    如需完整參考，請參閱 [初始設定（命令列介面）](/zh-TW/start/wizard)。

  </Step>
  <Step title="確認閘道正在執行">
    ```bash
    openclaw gateway status
    ```

    你應該會看到閘道正在連接埠 18789 監聽。

  </Step>
  <Step title="開啟儀表板">
    ```bash
    openclaw dashboard
    ```

    這會在你的瀏覽器中開啟 Control UI。如果能載入，表示一切正常運作。

  </Step>
  <Step title="傳送你的第一則訊息">
    在 Control UI 聊天中輸入訊息，你應該會收到 AI 回覆。

    想改用手機聊天嗎？最快速可設定的通道是
    [Telegram](/zh-TW/channels/telegram)（只需要機器人權杖）。請參閱 [通道](/zh-TW/channels)
    了解所有選項。

  </Step>
</Steps>

<Accordion title="進階：掛載自訂 Control UI 建置">
  如果你維護本地化或自訂的儀表板建置，請將
  `gateway.controlUi.root` 指向包含已建置靜態
  資產與 `index.html` 的目錄。

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# 將你建置好的靜態檔案複製到該目錄。
```

然後設定：

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

重新啟動閘道並重新開啟儀表板：

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## 接下來可以做什麼

<Columns>
  <Card title="連接通道" href="/zh-TW/channels" icon="message-square">
    Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo 等等。
  </Card>
  <Card title="配對與安全性" href="/zh-TW/channels/pairing" icon="shield">
    控制誰可以傳訊息給你的代理程式。
  </Card>
  <Card title="設定閘道" href="/zh-TW/gateway/configuration" icon="settings">
    模型、工具、沙盒與進階設定。
  </Card>
  <Card title="瀏覽工具" href="/zh-TW/tools" icon="wrench">
    瀏覽器、exec、網路搜尋、skills 和外掛。
  </Card>
</Columns>

<Accordion title="進階：環境變數">
  如果你以服務帳戶執行 OpenClaw，或想使用自訂路徑：

- `OPENCLAW_HOME`——內部路徑解析的主目錄
- `OPENCLAW_STATE_DIR`——覆寫狀態目錄
- `OPENCLAW_CONFIG_PATH`——覆寫設定檔路徑

完整參考：[環境變數](/zh-TW/help/environment)。
</Accordion>

## 相關內容

- [安裝概觀](/zh-TW/install)
- [通道概觀](/zh-TW/channels)
- [設定](/zh-TW/start/setup)
