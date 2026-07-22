---
read_when:
    - 向新手介紹 OpenClaw
summary: OpenClaw 是可在任何作業系統上執行的 AI 代理多頻道閘道。
title: OpenClaw
x-i18n:
    generated_at: "2026-07-22T13:19:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0ce948d12d4b4fcbde2597f9b33f50b99c4f677b69e0f5d72677b2f6683291f3
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

> _“去角質！去角質！”_ — 大概是一隻太空龍蝦

<p align="center">
  <strong>適用於任何作業系統的 AI 代理程式閘道，支援 Discord、Google Chat、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo 等平台。</strong><br />
  傳送訊息，即可隨時從口袋裡取得代理程式的回覆。只需執行一個閘道，即可連接頻道外掛、WebChat 與行動節點。<br />
  由非營利組織 <a href="https://openclaw.org">OpenClaw 基金會</a>以開放方式開發。
</p>

<Columns>
  <Card title="開始使用" href="/zh-TW/start/getting-started" icon="rocket">
    安裝 OpenClaw，幾分鐘內即可啟動閘道。
  </Card>
  <Card title="執行初始設定" href="/zh-TW/start/wizard" icon="list-checks">
    透過 `openclaw onboard` 與配對流程進行引導式設定。
  </Card>
  <Card title="連接頻道" href="/zh-TW/channels" icon="message-circle">
    連結 Discord、Signal、Telegram、WhatsApp 等平台，隨時隨地進行對話。
  </Card>
  <Card title="開啟控制介面" href="/zh-TW/web/control-ui" icon="layout-dashboard">
    啟動瀏覽器儀表板，管理聊天、設定與工作階段。
  </Card>
</Columns>

## 瀏覽文件

行動版瀏覽器可能只會顯示章節選單，而不會顯示完整的桌面分頁列。請使用
這些入口連結，從頁面內容前往相同的頂層文件區域。

<Columns>
  <Card title="開始使用" href="/zh-TW" icon="rocket">
    概覽、展示、入門步驟與設定指南。
  </Card>
  <Card title="安裝" href="/zh-TW/install" icon="download">
    安裝方式、更新、容器、託管與進階設定。
  </Card>
  <Card title="頻道" href="/zh-TW/channels" icon="messages-square">
    訊息頻道、配對、路由、存取群組與頻道品質保證。
  </Card>
  <Card title="代理程式" href="/zh-TW/concepts/architecture" icon="bot">
    架構、工作階段、上下文、記憶與多代理程式路由。
  </Card>
  <Card title="功能" href="/zh-TW/tools" icon="wand-sparkles">
    工具、Skills、排程、網路鉤子與自動化功能。
  </Card>
  <Card title="ClawHub" href="/zh-TW/clawhub" icon="store">
    外掛市集、發布、策展與信任指南。
  </Card>
  <Card title="模型" href="/zh-TW/providers" icon="brain">
    提供者、模型設定、容錯移轉與本機模型服務。
  </Card>
  <Card title="平台" href="/zh-TW/platforms" icon="monitor-smartphone">
    macOS、Windows、iOS、Android、節點與網頁介面。
  </Card>
  <Card title="閘道與維運" href="/zh-TW/gateway" icon="server">
    閘道設定、安全性、診斷與維運。
  </Card>
  <Card title="參考資料" href="/zh-TW/cli" icon="terminal">
    命令列介面參考資料、結構描述、RPC、版本資訊與範本。
  </Card>
  <Card title="說明" href="/zh-TW/help" icon="life-buoy">
    疑難排解、常見問題、測試、診斷與環境檢查。
  </Card>
</Columns>

## 什麼是 OpenClaw？

OpenClaw 是一個**自行託管的閘道**，透過頻道外掛將你常用的聊天應用程式（Discord、Google Chat、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo 等）連接至 AI 程式設計代理程式。你只需在自己的電腦（或伺服器）上執行單一閘道程序，它就會成為訊息應用程式與隨時可用的 AI 助理之間的橋樑。

**適合哪些人？** 適合想要能隨時隨地傳訊息互動的個人 AI 助理，且不願放棄資料控制權或依賴託管服務的開發人員與進階使用者。

**有何不同？**

- **自行託管**：在你的硬體上執行，由你制定規則
- **多頻道**：一個閘道可同時服務所有已設定的頻道外掛
- **以代理程式為核心**：專為具備工具使用、工作階段、記憶與多代理程式路由能力的程式設計代理程式打造
- **開放原始碼**：採用 MIT 授權，由社群共同推動

**需要什麼？** Node 24.15+（建議）、Node 22 LTS（`22.22.3+`）以確保相容性，或 Node 25.9+、所選提供者的 API 金鑰，以及 5 分鐘。為獲得最佳品質與安全性，請使用目前可用的最強新一代模型。

## 運作方式

```mermaid
flowchart LR
  A["聊天應用程式 + 外掛"] --> B["閘道"]
  B --> C["OpenClaw 代理程式"]
  B --> D["命令列介面"]
  B --> E["網頁控制介面"]
  B --> F["macOS 應用程式"]
  B --> G["iOS 與 Android 節點"]
```

閘道是工作階段、路由與頻道連線的唯一真實資料來源。

## 主要功能

<Columns>
  <Card title="多頻道閘道" icon="network" href="/zh-TW/channels">
    透過單一閘道程序支援 Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat 等平台。
  </Card>
  <Card title="外掛頻道" icon="plug" href="/zh-TW/tools/plugin">
    頻道外掛可新增 Matrix、Nostr、Twitch、Zalo 等平台；官方外掛可依需求安裝。
  </Card>
  <Card title="多代理程式路由" icon="route" href="/zh-TW/concepts/multi-agent">
    依代理程式、工作區或傳送者隔離工作階段。
  </Card>
  <Card title="媒體支援" icon="image" href="/zh-TW/nodes/images">
    傳送及接收圖片、音訊與文件。
  </Card>
  <Card title="網頁控制介面" icon="monitor" href="/zh-TW/web/control-ui">
    用於聊天、設定、工作階段與節點的瀏覽器儀表板。
  </Card>
  <Card title="行動節點" icon="smartphone" href="/zh-TW/nodes">
    配對 iOS 與 Android 節點，以進行 Canvas、相機及語音工作流程。
  </Card>
</Columns>

## 快速開始

<Steps>
  <Step title="安裝 OpenClaw">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="進行初始設定並安裝服務">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="聊天">
    在瀏覽器中開啟控制介面並傳送訊息：

    ```bash
    openclaw dashboard
    ```

    或連接頻道（[Telegram](/zh-TW/channels/telegram) 最快），然後用手機聊天。

  </Step>
</Steps>

需要完整的安裝與開發環境設定嗎？請參閱[開始使用](/zh-TW/start/getting-started)。

## 儀表板

閘道啟動後，開啟瀏覽器控制介面。

- 本機預設：[http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- 遠端存取：[網頁介面](/zh-TW/web)與 [Tailscale](/zh-TW/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## 設定（選用）

設定檔位於 `~/.openclaw/openclaw.json`。

- 如果你**不進行任何操作**，OpenClaw 會使用隨附的 OpenClaw 代理程式執行階段；私訊共用代理程式的主要工作階段，而每個群組聊天都有自己的工作階段。
- 如果你想限制存取，請先設定 `channels.whatsapp.allowFrom`，群組則另需設定提及規則。

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
  <Card title="文件入口" href="/zh-TW/start/hubs" icon="book-open">
    依使用案例整理的所有文件與指南。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="settings">
    閘道核心設定、權杖與提供者設定。
  </Card>
  <Card title="遠端存取" href="/zh-TW/gateway/remote" icon="globe">
    SSH 與 tailnet 存取模式。
  </Card>
  <Card title="頻道" href="/zh-TW/channels/telegram" icon="message-square">
    Discord、Feishu、Microsoft Teams、Telegram、WhatsApp 等平台的頻道專屬設定。
  </Card>
  <Card title="節點" href="/zh-TW/nodes" icon="smartphone">
    支援配對、Canvas、相機與裝置動作的 iOS 與 Android 節點。
  </Card>
  <Card title="說明" href="/zh-TW/help" icon="life-buoy">
    常見修正方式與疑難排解入口。
  </Card>
</Columns>

## 深入瞭解

<Columns>
  <Card title="完整功能清單" href="/zh-TW/concepts/features" icon="list">
    完整的頻道、路由與媒體功能。
  </Card>
  <Card title="多代理程式路由" href="/zh-TW/concepts/multi-agent" icon="route">
    工作區隔離與各代理程式獨立工作階段。
  </Card>
  <Card title="安全性" href="/zh-TW/gateway/security" icon="shield">
    權杖、允許清單與安全控制。
  </Card>
  <Card title="疑難排解" href="/zh-TW/gateway/troubleshooting" icon="wrench">
    閘道診斷與常見錯誤。
  </Card>
  <Card title="關於與致謝" href="/zh-TW/reference/credits" icon="info">
    專案起源、貢獻者與授權條款。
  </Card>
</Columns>
