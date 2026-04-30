---
read_when:
    - 你想要 OpenClaw 支援項目的完整清單
summary: OpenClaw 在通道、路由、媒體與使用者體驗方面的功能。
title: 功能
x-i18n:
    generated_at: "2026-04-30T02:59:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: b188d786b06e1a51d42130242e8bef6290a728783f24b2fbce513bf4d6c9ec23
    source_path: concepts/features.md
    workflow: 16
---

## 亮點

<Columns>
  <Card title="頻道" icon="message-square" href="/zh-TW/channels">
    Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat，以及更多頻道，皆透過單一 Gateway 支援。
  </Card>
  <Card title="Plugins" icon="plug" href="/zh-TW/tools/plugin">
    內建 Plugins 在一般目前版本中無需個別安裝，即可加入 Matrix、Nextcloud Talk、Nostr、Twitch、Zalo 等更多功能。
  </Card>
  <Card title="路由" icon="route" href="/zh-TW/concepts/multi-agent">
    具備隔離工作階段的多代理路由。
  </Card>
  <Card title="媒體" icon="image" href="/zh-TW/nodes/images">
    圖片、音訊、影片、文件，以及圖片/影片生成。
  </Card>
  <Card title="應用程式與 UI" icon="monitor" href="/zh-TW/web/control-ui">
    網頁 Control UI 與 macOS 輔助應用程式。
  </Card>
  <Card title="行動節點" icon="smartphone" href="/zh-TW/nodes">
    具備配對、語音/聊天與豐富裝置命令的 iOS 和 Android 節點。
  </Card>
</Columns>

## 完整清單

**頻道：**

- 內建頻道包含 Discord、Google Chat、iMessage（舊版）、IRC、Signal、Slack、Telegram、WebChat 和 WhatsApp
- 內建 Plugin 頻道包含適用於 iMessage 的 BlueBubbles、Feishu、LINE、Matrix、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Tlon、Twitch、Zalo 和 Zalo Personal
- 可選擇另外安裝的頻道 Plugins 包含 Voice Call，以及 WeChat 等第三方套件
- 第三方頻道 Plugins 可進一步擴充 Gateway，例如 WeChat
- 支援以提及為基礎啟用的群組聊天
- 透過允許清單與配對提供 DM 安全性

**代理：**

- 內嵌代理執行階段，支援工具串流
- 依工作區或傳送者提供具隔離工作階段的多代理路由
- 工作階段：直接聊天會合併到共享的 `main`；群組則會隔離
- 長回應的串流與分段

**驗證與提供者：**

- 35+ 個模型提供者（Anthropic、OpenAI、Google 等）
- 透過 OAuth 的訂閱驗證（例如 OpenAI Codex）
- 支援自訂與自行託管的提供者（vLLM、SGLang、Ollama，以及任何 OpenAI 相容或 Anthropic 相容端點）

**媒體：**

- 圖片、音訊、影片與文件的輸入與輸出
- 共享的圖片生成與影片生成能力介面
- 語音筆記轉錄
- 支援多個提供者的文字轉語音

**應用程式與介面：**

- WebChat 與瀏覽器 Control UI
- macOS 選單列輔助應用程式
- 具備配對、Canvas、相機、螢幕錄影、位置與語音功能的 iOS 節點
- 具備配對、聊天、語音、Canvas、相機與裝置命令的 Android 節點

**工具與自動化：**

- 瀏覽器自動化、exec、沙箱化
- 網頁搜尋（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily）
- Cron 作業與 Heartbeat 排程
- Skills、Plugins 與工作流程管線（Lobster）

## 相關

- [實驗性功能](/zh-TW/concepts/experimental-features)
- [代理執行階段](/zh-TW/concepts/agent)
