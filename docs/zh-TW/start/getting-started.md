---
read_when:
    - 從零開始的首次設定
    - 你想要最快讓聊天可用的方式
summary: 在幾分鐘內安裝 OpenClaw，並開始你的第一次聊天。
title: 開始使用
x-i18n:
    generated_at: "2026-06-28T20:45:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 579ed2b4797dc851b0293b96a4177cc356641b6842fe45c4d48f4e8c224eef75
    source_path: start/getting-started.md
    workflow: 16
---

安裝 OpenClaw、執行初始設定，並與你的 AI 助理聊天，全程約 5 分鐘。完成後，你會擁有正在執行的閘道、已設定的驗證，以及可用的聊天工作階段。

## 你需要準備

- **Node.js** — 建議使用節點 24（也支援節點 22.19+）
- 來自模型提供者（Anthropic、OpenAI、Google 等）的 **API 金鑰** — 初始設定會提示你輸入

<Tip>
使用 `node --version` 檢查你的節點版本。
**Windows 使用者：** 原生 Windows Hub 應用程式是最簡單的桌面路徑。
也支援 PowerShell 安裝程式與 WSL2 閘道路徑。請參閱 [Windows](/zh-TW/platforms/windows)。
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
  alt="安裝腳本流程"
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
  <Step title="執行初始設定">
    ```bash
    openclaw onboard --install-daemon
    ```

    精靈會引導你選擇模型提供者、設定 API 金鑰，並設定閘道。QuickStart 通常只需要幾分鐘，但提供者登入、頻道配對、daemon 安裝、網路下載、Skills，或選用外掛可能會讓完整初始設定花更久。你可以略過選用步驟，之後再使用 `openclaw configure` 返回設定。

    完整參考請參閱 [初始設定（命令列介面）](/zh-TW/start/wizard)。

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

    這會在瀏覽器中開啟 Control UI。如果能載入，就代表一切正常。

  </Step>
  <Step title="傳送你的第一則訊息">
    在 Control UI 聊天中輸入訊息，你應該會收到 AI 回覆。

    想改用手機聊天嗎？最快能設定好的頻道是
    [Telegram](/zh-TW/channels/telegram)（只需要機器人權杖）。所有選項請參閱 [頻道](/zh-TW/channels)。

  </Step>
</Steps>

<Accordion title="進階：掛載自訂 Control UI 建置">
  如果你維護本地化或自訂的儀表板建置，請將
  `gateway.controlUi.root` 指向包含已建置靜態資產與 `index.html` 的目錄。

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
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

重新啟動閘道並重新開啟儀表板：

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## 接下來可以做什麼

<Columns>
  <Card title="連接頻道" href="/zh-TW/channels" icon="message-square">
    Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo 等。
  </Card>
  <Card title="配對與安全" href="/zh-TW/channels/pairing" icon="shield">
    控制誰可以傳訊息給你的代理。
  </Card>
  <Card title="設定閘道" href="/zh-TW/gateway/configuration" icon="settings">
    模型、工具、沙盒與進階設定。
  </Card>
  <Card title="瀏覽工具" href="/zh-TW/tools" icon="wrench">
    瀏覽器、exec、網頁搜尋、Skills 與外掛。
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
