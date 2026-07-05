---
read_when:
    - 你想要一份 OpenClaw 支援內容的完整清單
summary: OpenClaw 在通道、路由、媒體與使用者體驗方面的能力。
title: 功能
x-i18n:
    generated_at: "2026-07-05T11:15:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bc3ebdd87a0f6ea0f3d75d029bf7cae469ecd9db84a165bd47c4896936fe303
    source_path: concepts/features.md
    workflow: 16
---

## 亮點

<Columns>
  <Card title="頻道" icon="message-square" href="/zh-TW/channels">
    Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat，以及更多頻道都透過單一閘道連接。
  </Card>
  <Card title="外掛" icon="plug" href="/zh-TW/tools/plugin">
    官方外掛可透過一個安裝命令加入 Matrix、Nextcloud Talk、Nostr、Twitch、Zalo，以及數十種更多服務。
  </Card>
  <Card title="路由" icon="route" href="/zh-TW/concepts/multi-agent">
    具備隔離工作階段的多代理路由。
  </Card>
  <Card title="媒體" icon="image" href="/zh-TW/nodes/images">
    圖片、音訊、影片、文件，以及圖片/影片生成。
  </Card>
  <Card title="應用程式與 UI" icon="monitor" href="/zh-TW/platforms">
    Windows Hub、瀏覽器 Control UI、macOS 選單列應用程式，以及行動節點。
  </Card>
  <Card title="行動節點" icon="smartphone" href="/zh-TW/nodes">
    iOS 和 Android 節點，支援配對、語音/聊天，以及豐富的裝置命令。
  </Card>
</Columns>

## 完整清單

**頻道：**

- iMessage、Telegram 和 WebChat 會隨核心安裝一起提供；其他每個頻道都是
  使用 `openclaw plugins install @openclaw/<id>` 安裝的官方外掛（或在
  `openclaw onboard` / `openclaw channels add` 期間依需求安裝）
- 官方外掛頻道：Discord、Feishu、Google Chat、IRC、LINE、Matrix、Mattermost、
  Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Raft、Signal、Slack、SMS、Synology Chat、
  Tlon、Twitch、Voice Call、WhatsApp、Zalo 和 Zalo Personal
- 在 OpenClaw 儲存庫外維護的外部外掛頻道：微信、騰訊元寶和 Zalo ClawBot
- 支援以提及為基礎啟用的群組聊天
- 使用允許清單和配對提供 DM 安全性

**代理：**

- 內嵌代理執行階段，支援工具串流
- 依工作區或傳送者提供具備隔離工作階段的多代理路由
- 工作階段：直接聊天會收斂到共用的 `main`；群組則互相隔離
- 長回應的串流與分塊

**驗證與提供者：**

- 35+ 個模型提供者（Anthropic、OpenAI、Google 等）
- 透過 OAuth 進行訂閱驗證（例如 OpenAI Codex）
- 支援自訂和自託管提供者（vLLM、SGLang、Ollama、llama.cpp、LM Studio，以及
  任何 OpenAI 相容或 Anthropic 相容端點）

**媒體：**

- 圖片、音訊、影片和文件的輸入與輸出
- 共用的圖片生成與影片生成能力介面
- 語音備註轉錄
- 支援多個提供者的文字轉語音

**應用程式與介面：**

- WebChat 和瀏覽器 Control UI
- macOS 選單列伴隨應用程式
- iOS 節點，支援配對、Canvas、相機、螢幕錄製、位置和語音
- Android 節點，支援配對、聊天、語音、Canvas、相機和裝置命令

**工具與自動化：**

- 瀏覽器自動化、exec、沙箱化
- 網頁搜尋（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily）
- 排程工作和心跳偵測排程
- Skills、外掛和工作流程管線（Lobster）

## 相關

<CardGroup cols={2}>
  <Card title="實驗性功能" href="/zh-TW/concepts/experimental-features" icon="flask">
    尚未發布到預設介面的選用功能。
  </Card>
  <Card title="代理執行階段" href="/zh-TW/concepts/agent" icon="robot">
    代理執行階段模型，以及執行如何派送。
  </Card>
  <Card title="頻道" href="/zh-TW/channels" icon="message-square">
    從一個閘道連接 Telegram、WhatsApp、Discord、Slack，以及更多服務。
  </Card>
  <Card title="外掛" href="/zh-TW/tools/plugin" icon="plug">
    擴充 OpenClaw 的官方與外部外掛。
  </Card>
</CardGroup>
