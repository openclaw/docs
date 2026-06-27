---
read_when:
    - 你想要一份 OpenClaw 支持内容的完整列表
summary: OpenClaw 在渠道、路由、媒体和用户体验方面的能力。
title: 功能
x-i18n:
    generated_at: "2026-06-27T01:48:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b69cead6fc3c6af91e95f8080d9ca409f24c314cf97f707b67d8fdeb84cf92fa
    source_path: concepts/features.md
    workflow: 16
---

## 亮点

<Columns>
  <Card title="渠道" icon="message-square" href="/zh-CN/channels">
    Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat 等都可通过单个 Gateway 网关使用。
  </Card>
  <Card title="插件" icon="plug" href="/zh-CN/tools/plugin">
    内置插件会添加 Matrix、Nextcloud Talk、Nostr、Twitch、Zalo 等，在正常的当前版本中无需单独安装。
  </Card>
  <Card title="路由" icon="route" href="/zh-CN/concepts/multi-agent">
    支持隔离会话的多 Agent 路由。
  </Card>
  <Card title="媒体" icon="image" href="/zh-CN/nodes/images">
    图片、音频、视频、文档，以及图片/视频生成。
  </Card>
  <Card title="应用和 UI" icon="monitor" href="/zh-CN/platforms">
    Windows Hub、Web Control UI、macOS 应用和移动节点。
  </Card>
  <Card title="移动节点" icon="smartphone" href="/zh-CN/nodes">
    iOS 和 Android 节点，支持配对、语音/聊天和丰富的设备命令。
  </Card>
</Columns>

## 完整列表

**渠道：**

- 内置渠道包括 Discord、Google Chat、iMessage、IRC、Signal、Slack、Telegram、WebChat 和 WhatsApp
- 内置插件渠道包括 Feishu、LINE、Matrix、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Tlon、Twitch、Zalo 和 Zalo Personal
- 可选的单独安装渠道插件包括 Voice Call，以及 WeChat 等第三方包
- 第三方渠道插件可以进一步扩展 Gateway 网关，例如 WeChat
- 通过基于提及的激活支持群聊
- 通过允许列表和配对保障私信安全

**Agent：**

- 内嵌 Agent 运行时，支持工具流式传输
- 按工作区或发送者提供隔离会话的多 Agent 路由
- 会话：直接聊天会折叠到共享的 `main`；群组会隔离
- 长回复的流式传输和分块

**身份验证和提供商：**

- 35+ 个模型提供商（Anthropic、OpenAI、Google 等）
- 通过 OAuth 进行订阅身份验证（例如 OpenAI Codex）
- 支持自定义和自托管提供商（vLLM、SGLang、Ollama，以及任何 OpenAI 兼容或 Anthropic 兼容端点）

**媒体：**

- 图片、音频、视频和文档的收发
- 共享的图片生成和视频生成能力面
- 语音便笺转录
- 多提供商文本转语音

**应用和接口：**

- WebChat 和浏览器 Control UI
- macOS 菜单栏配套应用
- iOS 节点，支持配对、Canvas、相机、屏幕录制、位置和语音
- Android 节点，支持配对、聊天、语音、Canvas、相机和设备命令

**工具和自动化：**

- 浏览器自动化、exec、沙箱隔离
- Web 搜索（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web 搜索、Perplexity、SearXNG、Tavily）
- Cron 作业和 heartbeat 调度
- Skills、插件和工作流管道（Lobster）

## 相关

<CardGroup cols={2}>
  <Card title="实验性功能" href="/zh-CN/concepts/experimental-features" icon="flask">
    尚未发布到默认表面的可选功能。
  </Card>
  <Card title="Agent 运行时" href="/zh-CN/concepts/agent" icon="robot">
    Agent 运行时模型，以及运行的调度方式。
  </Card>
  <Card title="渠道" href="/zh-CN/channels" icon="message-square">
    从一个 Gateway 网关连接 Telegram、WhatsApp、Discord、Slack 等。
  </Card>
  <Card title="插件" href="/zh-CN/tools/plugin" icon="plug">
    扩展 OpenClaw 的内置和第三方插件。
  </Card>
</CardGroup>
