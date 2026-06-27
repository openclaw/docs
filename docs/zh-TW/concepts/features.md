---
read_when:
    - 你想要 OpenClaw 支援項目的完整清單
summary: OpenClaw 在各通道、路由、媒體與使用者體驗方面的功能。
title: 功能
x-i18n:
    generated_at: "2026-06-27T19:10:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b69cead6fc3c6af91e95f8080d9ca409f24c314cf97f707b67d8fdeb84cf92fa
    source_path: concepts/features.md
    workflow: 16
---

## 亮點

<Columns>
  <Card title="頻道" icon="message-square" href="/zh-TW/channels">
    透過單一閘道支援 Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat 等更多頻道。
  </Card>
  <Card title="外掛" icon="plug" href="/zh-TW/tools/plugin">
    在一般現行版本中，隨附外掛可加入 Matrix、Nextcloud Talk、Nostr、Twitch、Zalo 等更多功能，無需另外安裝。
  </Card>
  <Card title="路由" icon="route" href="/zh-TW/concepts/multi-agent">
    具備隔離工作階段的多代理路由。
  </Card>
  <Card title="媒體" icon="image" href="/zh-TW/nodes/images">
    圖片、音訊、影片、文件，以及圖片/影片生成。
  </Card>
  <Card title="應用程式與 UI" icon="monitor" href="/zh-TW/platforms">
    Windows Hub、Web Control UI、macOS 應用程式，以及行動節點。
  </Card>
  <Card title="行動節點" icon="smartphone" href="/zh-TW/nodes">
    iOS 與 Android 節點，支援配對、語音/聊天，以及豐富的裝置命令。
  </Card>
</Columns>

## 完整清單

**頻道：**

- 內建頻道包括 Discord、Google Chat、iMessage、IRC、Signal、Slack、Telegram、WebChat 和 WhatsApp
- 隨附外掛頻道包括 Feishu、LINE、Matrix、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Tlon、Twitch、Zalo 和 Zalo Personal
- 可選擇另行安裝的頻道外掛包括 Voice Call，以及 WeChat 等第三方套件
- 第三方頻道外掛可進一步擴充閘道，例如 WeChat
- 支援以提及為基礎啟用的群組聊天
- 透過允許清單和配對確保私訊安全

**代理：**

- 內嵌代理執行階段，支援工具串流
- 依工作區或傳送者提供具隔離工作階段的多代理路由
- 工作階段：直接聊天會合併到共用的 `main`；群組則彼此隔離
- 長回應支援串流和分塊

**身分驗證與提供者：**

- 35+ 模型提供者（Anthropic、OpenAI、Google 等）
- 透過 OAuth 的訂閱身分驗證（例如 OpenAI Codex）
- 支援自訂和自行託管的提供者（vLLM、SGLang、Ollama，以及任何 OpenAI 相容或 Anthropic 相容端點）

**媒體：**

- 圖片、音訊、影片和文件的輸入與輸出
- 共用的圖片生成與影片生成功能介面
- 語音訊息轉錄
- 透過多個提供者進行文字轉語音

**應用程式與介面：**

- WebChat 和瀏覽器 Control UI
- macOS 選單列輔助應用程式
- iOS 節點，支援配對、Canvas、相機、螢幕錄製、位置和語音
- Android 節點，支援配對、聊天、語音、Canvas、相機和裝置命令

**工具與自動化：**

- 瀏覽器自動化、執行、沙箱化
- 網頁搜尋（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily）
- 排程工作與心跳偵測排程
- Skills、外掛和工作流程管線（Lobster）

## 相關

<CardGroup cols={2}>
  <Card title="實驗性功能" href="/zh-TW/concepts/experimental-features" icon="flask">
    尚未發布到預設介面的選用功能。
  </Card>
  <Card title="代理執行階段" href="/zh-TW/concepts/agent" icon="robot">
    代理執行階段模型，以及執行如何被派發。
  </Card>
  <Card title="頻道" href="/zh-TW/channels" icon="message-square">
    從單一閘道連接 Telegram、WhatsApp、Discord、Slack 等更多頻道。
  </Card>
  <Card title="外掛" href="/zh-TW/tools/plugin" icon="plug">
    可擴充 OpenClaw 的隨附與第三方外掛。
  </Card>
</CardGroup>
