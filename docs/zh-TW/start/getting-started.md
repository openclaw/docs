---
read_when:
    - 從零開始的首次設定
    - 您想要最快讓聊天功能運作起來的方式
summary: 安裝 OpenClaw，並在幾分鐘內開始您的第一次聊天。
title: 開始使用
x-i18n:
    generated_at: "2026-04-30T03:40:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe3f92b1464ebf0a5b631c293fa4a3e4b686fdb35c1152663428025dd3c01259
    source_path: start/getting-started.md
    workflow: 16
---

安裝 OpenClaw、執行入門設定，並與你的 AI 助理聊天，全部約 5 分鐘內完成。完成後，你將擁有正在執行的 Gateway、已設定的驗證，以及可用的聊天工作階段。

## 你需要什麼

- **Node.js** — 建議使用 Node 24（也支援 Node 22.14+）
- **模型供應商的 API 金鑰**（Anthropic、OpenAI、Google 等）— 入門設定會提示你輸入

<Tip>
使用 `node --version` 檢查你的 Node 版本。
**Windows 使用者：**支援原生 Windows 與 WSL2。WSL2 更穩定，建議用於完整體驗。請參閱 [Windows](/zh-TW/platforms/windows)。
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
  alt="Install Script Process"
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
  <Step title="執行入門設定">
    ```bash
    openclaw onboard --install-daemon
    ```

    精靈會引導你選擇模型供應商、設定 API 金鑰，並設定 Gateway。大約需要 2 分鐘。

    如需完整參考，請參閱[入門設定（CLI）](/zh-TW/start/wizard)。

  </Step>
  <Step title="確認 Gateway 正在執行">
    ```bash
    openclaw gateway status
    ```

    你應該會看到 Gateway 正在連接埠 18789 上監聽。

  </Step>
  <Step title="開啟儀表板">
    ```bash
    openclaw dashboard
    ```

    這會在你的瀏覽器中開啟 Control UI。如果成功載入，就表示一切正常。

  </Step>
  <Step title="傳送你的第一則訊息">
    在 Control UI 聊天中輸入訊息，你應該會收到 AI 回覆。

    想改用手機聊天？最快設定的頻道是
    [Telegram](/zh-TW/channels/telegram)（只需要機器人權杖）。所有選項請參閱[頻道](/zh-TW/channels)。

  </Step>
</Steps>

<Accordion title="進階：掛載自訂 Control UI 建置">
  如果你維護的是在地化或自訂的儀表板建置，請將
  `gateway.controlUi.root` 指向包含已建置靜態資產與 `index.html` 的目錄。

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
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

重新啟動 gateway 並重新開啟儀表板：

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## 接下來要做什麼

<Columns>
  <Card title="連接頻道" href="/zh-TW/channels" icon="message-square">
    Discord、飛書、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo，以及更多。
  </Card>
  <Card title="配對與安全" href="/zh-TW/channels/pairing" icon="shield">
    控制誰可以傳訊息給你的代理。
  </Card>
  <Card title="設定 Gateway" href="/zh-TW/gateway/configuration" icon="settings">
    模型、工具、沙盒，以及進階設定。
  </Card>
  <Card title="瀏覽工具" href="/zh-TW/tools" icon="wrench">
    瀏覽器、exec、網頁搜尋、Skills，以及 plugins。
  </Card>
</Columns>

<Accordion title="進階：環境變數">
  如果你以服務帳號執行 OpenClaw，或想使用自訂路徑：

- `OPENCLAW_HOME` — 內部路徑解析使用的主目錄
- `OPENCLAW_STATE_DIR` — 覆寫狀態目錄
- `OPENCLAW_CONFIG_PATH` — 覆寫設定檔路徑

完整參考：[環境變數](/zh-TW/help/environment)。
</Accordion>

## 相關

- [安裝總覽](/zh-TW/install)
- [頻道總覽](/zh-TW/channels)
- [設定](/zh-TW/start/setup)
