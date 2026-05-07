---
read_when:
    - 您想查看 OpenClaw 支援內容的完整清單
summary: OpenClaw 在頻道、路由、媒體與使用者體驗方面的功能。
title: 功能
x-i18n:
    generated_at: "2026-05-07T01:51:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f95185073e52f4b5b34042ea27927984bf0b040d20eb61b135514816fddc214
    source_path: concepts/features.md
    workflow: 16
---

## 重點

<Columns>
  <Card title="通道" icon="message-square" href="/zh-TW/channels">
    Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat，以及更多通道，全部透過單一 Gateway 使用。
  </Card>
  <Card title="Plugin" icon="plug" href="/zh-TW/tools/plugin">
    在一般目前版本中，內建 Plugin 會新增 Matrix、Nextcloud Talk、Nostr、Twitch、Zalo 等功能，無需另外安裝。
  </Card>
  <Card title="路由" icon="route" href="/zh-TW/concepts/multi-agent">
    具備隔離工作階段的多代理路由。
  </Card>
  <Card title="媒體" icon="image" href="/zh-TW/nodes/images">
    圖片、音訊、影片、文件，以及圖片/影片生成。
  </Card>
  <Card title="應用程式與 UI" icon="monitor" href="/zh-TW/web/control-ui">
    Web Control UI 與 macOS 輔助應用程式。
  </Card>
  <Card title="行動 Node" icon="smartphone" href="/zh-TW/nodes">
    具備配對、語音/聊天與豐富裝置命令的 iOS 與 Android Node。
  </Card>
</Columns>

## 完整清單

**通道：**

- 內建通道包含 Discord、Google Chat、iMessage、IRC、Signal、Slack、Telegram、WebChat 和 WhatsApp
- 內建 Plugin 通道包含作為舊版 iMessage 橋接器的 BlueBubbles、Feishu、LINE、Matrix、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Tlon、Twitch、Zalo 和 Zalo Personal
- 可選擇另行安裝的通道 Plugin 包含 Voice Call，以及 WeChat 等第三方套件
- 第三方通道 Plugin 可進一步擴充 Gateway，例如 WeChat
- 支援以提及為基礎啟用的群組聊天
- 透過允許清單與配對確保 DM 安全性

**代理：**

- 內嵌代理執行階段，支援工具串流
- 依工作區或傳送者提供具隔離工作階段的多代理路由
- 工作階段：直接聊天會收合到共用的 `main`；群組則會隔離
- 對長回應進行串流與分塊

**驗證與提供者：**

- 35+ 個模型提供者（Anthropic、OpenAI、Google 等）
- 透過 OAuth 進行訂閱驗證（例如 OpenAI Codex）
- 支援自訂與自託管提供者（vLLM、SGLang、Ollama，以及任何 OpenAI 相容或 Anthropic 相容端點）

**媒體：**

- 圖片、音訊、影片與文件的輸入與輸出
- 共用的圖片生成與影片生成功能介面
- 語音備忘錄轉錄
- 支援多個提供者的文字轉語音

**應用程式與介面：**

- WebChat 與瀏覽器 Control UI
- macOS 選單列輔助應用程式
- 具備配對、Canvas、相機、螢幕錄影、位置與語音的 iOS Node
- 具備配對、聊天、語音、Canvas、相機與裝置命令的 Android Node

**工具與自動化：**

- 瀏覽器自動化、exec、沙盒化
- 網頁搜尋（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily）
- Cron 作業與 Heartbeat 排程
- Skills、Plugin 與工作流程管線（Lobster）

## 相關

<CardGroup cols={2}>
  <Card title="實驗性功能" href="/zh-TW/concepts/experimental-features" icon="flask">
    尚未發佈到預設介面的選用功能。
  </Card>
  <Card title="代理執行階段" href="/zh-TW/concepts/agent" icon="robot">
    代理執行階段模型，以及執行如何分派。
  </Card>
  <Card title="通道" href="/zh-TW/channels" icon="message-square">
    從單一 Gateway 連接 Telegram、WhatsApp、Discord、Slack 等服務。
  </Card>
  <Card title="Plugin" href="/zh-TW/tools/plugin" icon="plug">
    擴充 OpenClaw 的內建與第三方 Plugin。
  </Card>
</CardGroup>
