---
read_when:
    - 你想要一份 OpenClaw 支援項目的完整清單
summary: OpenClaw 涵蓋通道、路由、媒體和使用者體驗的功能。
title: 功能
x-i18n:
    generated_at: "2026-05-06T02:45:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: d46085b326dd1e5f0d5531bdf8d7d84ac8c22b7fb4637b7183be2bd9d556c500
    source_path: concepts/features.md
    workflow: 16
---

## 重點

<Columns>
  <Card title="頻道" icon="message-square" href="/zh-TW/channels">
    Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat 等，都可透過單一 Gateway 使用。
  </Card>
  <Card title="Plugins" icon="plug" href="/zh-TW/tools/plugin">
    在一般目前版本中，內建 plugins 可新增 Matrix、Nextcloud Talk、Nostr、Twitch、Zalo 等功能，無需另外安裝。
  </Card>
  <Card title="路由" icon="route" href="/zh-TW/concepts/multi-agent">
    具備隔離工作階段的多代理路由。
  </Card>
  <Card title="媒體" icon="image" href="/zh-TW/nodes/images">
    圖片、音訊、影片、文件，以及圖片/影片生成。
  </Card>
  <Card title="應用程式和 UI" icon="monitor" href="/zh-TW/web/control-ui">
    Web Control UI 與 macOS 輔助應用程式。
  </Card>
  <Card title="行動節點" icon="smartphone" href="/zh-TW/nodes">
    具備配對、語音/聊天與豐富裝置指令的 iOS 和 Android 節點。
  </Card>
</Columns>

## 完整清單

**頻道：**

- 內建頻道包括 Discord、Google Chat、iMessage（舊版）、IRC、Signal、Slack、Telegram、WebChat 和 WhatsApp
- 內建 plugin 頻道包括適用於 iMessage 的 BlueBubbles、Feishu、LINE、Matrix、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Tlon、Twitch、Zalo 和 Zalo Personal
- 可選的另行安裝頻道 plugins 包括 Voice Call，以及 WeChat 等第三方套件
- 第三方頻道 plugins 可以進一步擴充 Gateway，例如 WeChat
- 支援以提及為基礎啟用的群組聊天
- 透過允許清單與配對保障 DM 安全

**代理：**

- 內嵌代理執行階段，支援工具串流
- 依工作區或傳送者提供具備隔離工作階段的多代理路由
- 工作階段：直接聊天會合併到共用的 `main`；群組則會隔離
- 針對長回應提供串流與分塊

**驗證與供應商：**

- 35+ 個模型供應商（Anthropic、OpenAI、Google 等）
- 透過 OAuth 進行訂閱驗證（例如 OpenAI Codex）
- 支援自訂與自託管供應商（vLLM、SGLang、Ollama，以及任何 OpenAI 相容或 Anthropic 相容端點）

**媒體：**

- 圖片、音訊、影片和文件的輸入與輸出
- 共用的圖片生成與影片生成能力介面
- 語音備忘錄轉錄
- 支援多個供應商的文字轉語音

**應用程式與介面：**

- WebChat 與瀏覽器 Control UI
- macOS 選單列輔助應用程式
- iOS 節點，具備配對、Canvas、相機、螢幕錄影、位置與語音
- Android 節點，具備配對、聊天、語音、Canvas、相機與裝置指令

**工具與自動化：**

- 瀏覽器自動化、exec、沙箱化
- 網頁搜尋（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily）
- Cron 工作與 Heartbeat 排程
- Skills、plugins 與工作流程管線（Lobster）

## 相關內容

<CardGroup cols={2}>
  <Card title="實驗性功能" href="/zh-TW/concepts/experimental-features" icon="flask">
    尚未發佈到預設介面的選用功能。
  </Card>
  <Card title="代理執行階段" href="/zh-TW/concepts/agent" icon="robot">
    代理執行階段模型，以及執行如何派送。
  </Card>
  <Card title="頻道" href="/zh-TW/channels" icon="message-square">
    從單一 Gateway 連接 Telegram、WhatsApp、Discord、Slack 等。
  </Card>
  <Card title="Plugins" href="/zh-TW/tools/plugin" icon="plug">
    擴充 OpenClaw 的內建與第三方 plugins。
  </Card>
</CardGroup>
