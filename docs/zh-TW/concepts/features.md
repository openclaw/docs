---
read_when:
    - 您想要 OpenClaw 支援內容的完整清單
summary: OpenClaw 在通道、路由、媒體與使用者體驗方面的功能。
title: 功能
x-i18n:
    generated_at: "2026-05-10T19:30:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb2e4973ad7f986034e125cd84d9d3f8542ea4821bde28fce2df3fb78c06c34f
    source_path: concepts/features.md
    workflow: 16
---

## 重點

<Columns>
  <Card title="頻道" icon="message-square" href="/zh-TW/channels">
    Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat，以及更多頻道，全部透過單一 Gateway 使用。
  </Card>
  <Card title="Plugins" icon="plug" href="/zh-TW/tools/plugin">
    在一般目前版本中，內建 Plugins 可加入 Matrix、Nextcloud Talk、Nostr、Twitch、Zalo 等功能，無需另行安裝。
  </Card>
  <Card title="路由" icon="route" href="/zh-TW/concepts/multi-agent">
    具備隔離工作階段的多代理路由。
  </Card>
  <Card title="媒體" icon="image" href="/zh-TW/nodes/images">
    圖片、音訊、影片、文件，以及圖片/影片生成。
  </Card>
  <Card title="應用程式與 UI" icon="monitor" href="/zh-TW/web/control-ui">
    網頁版 Control UI 與 macOS companion app。
  </Card>
  <Card title="行動節點" icon="smartphone" href="/zh-TW/nodes">
    具備配對、語音/聊天與豐富裝置指令的 iOS 和 Android 節點。
  </Card>
</Columns>

## 完整清單

**頻道：**

- 內建頻道包含 Discord、Google Chat、iMessage、IRC、Signal、Slack、Telegram、WebChat 和 WhatsApp
- 內建 Plugin 頻道包含 Feishu、LINE、Matrix、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Tlon、Twitch、Zalo 和 Zalo Personal
- 可選擇另行安裝的頻道 Plugins 包含 Voice Call，以及 WeChat 等第三方套件
- 第三方頻道 Plugins 可進一步擴充 Gateway，例如 WeChat
- 支援以提及為基礎啟用的群組聊天
- 透過允許清單與配對確保私訊安全

**代理：**

- 內嵌式代理執行環境，支援工具串流
- 依工作區或傳送者提供具備隔離工作階段的多代理路由
- 工作階段：直接聊天會合併到共用的 `main`；群組則彼此隔離
- 長回應支援串流與分塊

**驗證與供應商：**

- 35+ 個模型供應商（Anthropic、OpenAI、Google 等）
- 透過 OAuth 進行訂閱驗證（例如 OpenAI Codex）
- 支援自訂與自架供應商（vLLM、SGLang、Ollama，以及任何 OpenAI 相容或 Anthropic 相容端點）

**媒體：**

- 圖片、音訊、影片與文件的輸入與輸出
- 共用圖片生成與影片生成能力介面
- 語音留言轉錄
- 多供應商文字轉語音

**應用程式與介面：**

- WebChat 與瀏覽器 Control UI
- macOS 選單列 companion app
- iOS 節點，具備配對、Canvas、相機、螢幕錄影、位置與語音
- Android 節點，具備配對、聊天、語音、Canvas、相機與裝置指令

**工具與自動化：**

- 瀏覽器自動化、exec、沙箱化
- 網頁搜尋（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily）
- Cron 工作與 Heartbeat 排程
- Skills、Plugins 與工作流程管線（Lobster）

## 相關內容

<CardGroup cols={2}>
  <Card title="實驗性功能" href="/zh-TW/concepts/experimental-features" icon="flask">
    尚未發布到預設介面的選擇加入功能。
  </Card>
  <Card title="代理執行環境" href="/zh-TW/concepts/agent" icon="robot">
    代理執行環境模型，以及執行如何分派。
  </Card>
  <Card title="頻道" href="/zh-TW/channels" icon="message-square">
    從單一 Gateway 連接 Telegram、WhatsApp、Discord、Slack 等服務。
  </Card>
  <Card title="Plugins" href="/zh-TW/tools/plugin" icon="plug">
    用於擴充 OpenClaw 的內建與第三方 Plugins。
  </Card>
</CardGroup>
