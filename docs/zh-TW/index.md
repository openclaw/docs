---
read_when:
    - 向新手介紹 OpenClaw
summary: OpenClaw 是可在任何作業系統上執行的 AI 代理程式多管道閘道。
title: OpenClaw
x-i18n:
    generated_at: "2026-07-12T14:37:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2b87c2a9ce06f110bda45709fb6055ed8000f73993793ea7386db2a47a782828
    source_path: index.md
    workflow: 16
---

# OpenClaw 🦞

<p align="center">
    <img
        src="/assets/openclaw-hero-light.png"
        alt="OpenClaw"
        width="500"
        class="dark:hidden"
    />
    <img
        src="/assets/openclaw-hero-dark.png"
        alt="OpenClaw"
        width="500"
        class="hidden dark:block"
    />
</p>

> _“去角質！去角質！”_ — 大概是某隻太空龍蝦說的

<p align="center">
  <strong>適用於任何作業系統的 AI 代理程式閘道，支援 Discord、Google Chat、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo 等服務。</strong><br />
  傳送訊息，即可隨身取得代理程式的回覆。使用單一閘道串接頻道外掛、WebChat 和行動節點。
</p>

<Columns>
  <Card title="開始使用" href="/zh-TW/start/getting-started" icon="rocket">
    安裝 OpenClaw，幾分鐘內即可啟動閘道。
  </Card>
  <Card title="執行引導設定" href="/zh-TW/start/wizard" icon="list-checks">
    使用 `openclaw onboard` 和配對流程進行引導式設定。
  </Card>
  <Card title="連接頻道" href="/zh-TW/channels" icon="message-circle">
    連結 Discord、Signal、Telegram、WhatsApp 等服務，隨時隨地聊天。
  </Card>
  <Card title="開啟控制介面" href="/zh-TW/web/control-ui" icon="layout-dashboard">
    啟動瀏覽器儀表板，以進行聊天、設定及工作階段管理。
  </Card>
</Columns>

## 瀏覽文件

行動版瀏覽器可能只會顯示區段選單，而不顯示完整的桌面版分頁列。請使用
這些中心連結，從頁面內文前往相同的頂層文件區域。

<Columns>
  <Card title="開始使用" href="/zh-TW" icon="rocket">
    概覽、展示、入門步驟及設定指南。
  </Card>
  <Card title="安裝" href="/zh-TW/install" icon="download">
    安裝方式、更新、容器、託管及進階設定。
  </Card>
  <Card title="頻道" href="/zh-TW/channels" icon="messages-square">
    訊息頻道、配對、路由、存取群組及頻道品質保證。
  </Card>
  <Card title="代理程式" href="/zh-TW/concepts/architecture" icon="bot">
    架構、工作階段、上下文、記憶及多代理程式路由。
  </Card>
  <Card title="功能" href="/zh-TW/tools" icon="wand-sparkles">
    工具、Skills、排程、網路鉤子及自動化功能。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="store">
    外掛市集、發布、策展及信任指南。
  </Card>
  <Card title="模型" href="/zh-TW/providers" icon="brain">
    提供者、模型設定、容錯移轉及本機模型服務。
  </Card>
  <Card title="平台" href="/zh-TW/platforms" icon="monitor-smartphone">
    macOS、Windows、iOS、Android、節點及網頁介面。
  </Card>
  <Card title="閘道與維運" href="/zh-TW/gateway" icon="server">
    閘道設定、安全性、診斷及維運。
  </Card>
  <Card title="參考資料" href="/zh-TW/cli" icon="terminal">
    命令列介面參考、結構描述、RPC、版本資訊及範本。
  </Card>
  <Card title="說明" href="/zh-TW/help" icon="life-buoy">
    疑難排解、常見問題、測試、診斷及環境檢查。
  </Card>
</Columns>

## 什麼是 OpenClaw？

OpenClaw 是一個**自行託管的閘道**，透過頻道外掛將你喜愛的聊天應用程式（Discord、Google Chat、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo 等）連接至 AI 程式設計代理程式。你只需在自己的電腦（或伺服器）上執行單一閘道處理程序，它便會成為訊息應用程式與隨時可用的 AI 助理之間的橋樑。

**適合哪些人？** 想要從任何地方向個人 AI 助理傳送訊息，同時不放棄資料控制權、也不依賴託管服務的開發人員與進階使用者。

**有何不同？**

- **自行託管**：在你的硬體上執行，遵循你的規則
- **多頻道**：單一閘道同時服務所有已設定的頻道外掛
- **代理程式原生**：專為具備工具使用、工作階段、記憶及多代理程式路由功能的程式設計代理程式打造
- **開放原始碼**：採用 MIT 授權，由社群共同推動

**需要什麼？** Node 24（建議），或為了相容性使用 Node 22 LTS（`22.19+`）、所選提供者的 API 金鑰，以及 5 分鐘。為獲得最佳品質與安全性，請使用目前可用的最強新世代模型。

## 運作方式

```mermaid
flowchart LR
  A["聊天應用程式 + 外掛"] --> B["閘道"]
  B --> C["OpenClaw 代理程式"]
  B --> D["命令列介面"]
  B --> E["網頁控制介面"]
  B --> F["macOS 應用程式"]
  B --> G["iOS 和 Android 節點"]
```

閘道是工作階段、路由及頻道連線的唯一真實來源。

## 主要功能

<Columns>
  <Card title="多頻道閘道" icon="network" href="/zh-TW/channels">
    透過單一閘道處理程序支援 Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat 等服務。
  </Card>
  <Card title="外掛頻道" icon="plug" href="/zh-TW/tools/plugin">
    頻道外掛可新增 Matrix、Nostr、Twitch、Zalo 等服務；官方外掛可按需安裝。
  </Card>
  <Card title="多代理程式路由" icon="route" href="/zh-TW/concepts/multi-agent">
    依代理程式、工作區或傳送者提供隔離的工作階段。
  </Card>
  <Card title="媒體支援" icon="image" href="/zh-TW/nodes/images">
    傳送及接收圖片、音訊和文件。
  </Card>
  <Card title="網頁控制介面" icon="monitor" href="/zh-TW/web/control-ui">
    用於聊天、設定、工作階段及節點的瀏覽器儀表板。
  </Card>
  <Card title="行動節點" icon="smartphone" href="/zh-TW/nodes">
    配對 iOS 和 Android 節點，以支援 Canvas、相機及語音工作流程。
  </Card>
</Columns>

## 快速開始

<Steps>
  <Step title="安裝 OpenClaw">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="完成引導設定並安裝服務">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="聊天">
    在瀏覽器中開啟控制介面並傳送訊息：

    ```bash
    openclaw dashboard
    ```

    或連接一個頻道（[Telegram](/zh-TW/channels/telegram) 最快），然後使用手機聊天。

  </Step>
</Steps>

需要完整的安裝與開發環境設定嗎？請參閱[開始使用](/zh-TW/start/getting-started)。

## 儀表板

閘道啟動後，開啟瀏覽器控制介面。

- 本機預設：[http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- 遠端存取：[網頁介面](/zh-TW/web)和 [Tailscale](/zh-TW/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## 設定（選用）

設定檔位於 `~/.openclaw/openclaw.json`。

- 如果你**不進行任何設定**，OpenClaw 會使用隨附的 OpenClaw 代理程式執行階段；私訊共用代理程式的主要工作階段，而每個群組聊天都有自己的工作階段。
- 如果你想限制存取，請先設定 `channels.whatsapp.allowFrom`，並為群組設定提及規則。

範例：

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  messages: { groupChat: { mentionPatterns: ["@openclaw"] } },
}
```

## 從這裡開始

<Columns>
  <Card title="文件中心" href="/zh-TW/start/hubs" icon="book-open">
    依使用案例整理的所有文件與指南。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="settings">
    核心閘道設定、權杖及提供者設定。
  </Card>
  <Card title="遠端存取" href="/zh-TW/gateway/remote" icon="globe">
    SSH 和 tailnet 存取模式。
  </Card>
  <Card title="頻道" href="/zh-TW/channels/telegram" icon="message-square">
    Discord、Feishu、Microsoft Teams、Telegram、WhatsApp 等服務的頻道專屬設定。
  </Card>
  <Card title="節點" href="/zh-TW/nodes" icon="smartphone">
    具備配對、Canvas、相機及裝置動作的 iOS 和 Android 節點。
  </Card>
  <Card title="說明" href="/zh-TW/help" icon="life-buoy">
    常見修正與疑難排解入口。
  </Card>
</Columns>

## 深入瞭解

<Columns>
  <Card title="完整功能清單" href="/zh-TW/concepts/features" icon="list">
    完整的頻道、路由及媒體功能。
  </Card>
  <Card title="多代理程式路由" href="/zh-TW/concepts/multi-agent" icon="route">
    工作區隔離及個別代理程式的工作階段。
  </Card>
  <Card title="安全性" href="/zh-TW/gateway/security" icon="shield">
    權杖、允許清單及安全控制。
  </Card>
  <Card title="疑難排解" href="/zh-TW/gateway/troubleshooting" icon="wrench">
    閘道診斷及常見錯誤。
  </Card>
  <Card title="關於與致謝" href="/zh-TW/reference/credits" icon="info">
    專案起源、貢獻者及授權條款。
  </Card>
</Columns>
