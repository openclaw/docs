---
read_when:
    - 你想查看 OpenClaw 支持内容的完整列表
summary: OpenClaw 在渠道、路由、媒体和用户体验方面的能力。
title: 功能
x-i18n:
    generated_at: "2026-05-06T02:04:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: d46085b326dd1e5f0d5531bdf8d7d84ac8c22b7fb4637b7183be2bd9d556c500
    source_path: concepts/features.md
    workflow: 16
---

## 亮点

<Columns>
  <Card title="渠道" icon="message-square" href="/zh-CN/channels">
    Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat 等都可通过单个 Gateway 网关接入。
  </Card>
  <Card title="插件" icon="plug" href="/zh-CN/tools/plugin">
    在当前常规版本中，内置插件会添加 Matrix、Nextcloud Talk、Nostr、Twitch、Zalo 等功能，无需单独安装。
  </Card>
  <Card title="路由" icon="route" href="/zh-CN/concepts/multi-agent">
    使用隔离会话进行多智能体路由。
  </Card>
  <Card title="媒体" icon="image" href="/zh-CN/nodes/images">
    图像、音频、视频、文档，以及图像/视频生成。
  </Card>
  <Card title="应用和 UI" icon="monitor" href="/zh-CN/web/control-ui">
    Web Control UI 和 macOS 配套应用。
  </Card>
  <Card title="移动节点" icon="smartphone" href="/zh-CN/nodes">
    iOS 和 Android 节点，支持配对、语音/聊天，以及丰富的设备命令。
  </Card>
</Columns>

## 完整列表

**渠道：**

- 内置渠道包括 Discord、Google Chat、iMessage（旧版）、IRC、Signal、Slack、Telegram、WebChat 和 WhatsApp
- 内置插件渠道包括用于 iMessage 的 BlueBubbles、Feishu、LINE、Matrix、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Tlon、Twitch、Zalo 和 Zalo Personal
- 可选的单独安装渠道插件包括 Voice Call，以及 WeChat 等第三方包
- 第三方渠道插件可以进一步扩展 Gateway 网关，例如 WeChat
- 通过基于提及的激活支持群聊
- 使用 allowlist 和配对保证私信安全

**智能体：**

- 内嵌的智能体运行时，支持工具流式传输
- 按工作区或发送者为每个隔离会话进行多智能体路由
- 会话：直接聊天会折叠到共享的 `main`；群组保持隔离
- 针对长回复的流式传输和分块

**认证和提供商：**

- 35+ 个模型提供商（Anthropic、OpenAI、Google 等）
- 通过 OAuth 进行订阅认证（例如 OpenAI Codex）
- 支持自定义和自托管提供商（vLLM、SGLang、Ollama，以及任何兼容 OpenAI 或兼容 Anthropic 的端点）

**媒体：**

- 图像、音频、视频和文档的输入与输出
- 共享的图像生成和视频生成能力表面
- 语音笔记转录
- 支持多个提供商的文本转语音

**应用和界面：**

- WebChat 和浏览器 Control UI
- macOS 菜单栏配套应用
- iOS 节点，支持配对、Canvas、摄像头、屏幕录制、位置和语音
- Android 节点，支持配对、聊天、语音、Canvas、摄像头和设备命令

**工具和自动化：**

- 浏览器自动化、exec、沙箱隔离
- Web 搜索（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web 搜索、Perplexity、SearXNG、Tavily）
- Cron 作业和 Heartbeat 调度
- Skills、插件和工作流流水线（Lobster）

## 相关

<CardGroup cols={2}>
  <Card title="实验性功能" href="/zh-CN/concepts/experimental-features" icon="flask">
    尚未发布到默认表面的可选启用功能。
  </Card>
  <Card title="智能体运行时" href="/zh-CN/concepts/agent" icon="robot">
    智能体运行时模型，以及运行的分派方式。
  </Card>
  <Card title="渠道" href="/zh-CN/channels" icon="message-square">
    从一个 Gateway 网关连接 Telegram、WhatsApp、Discord、Slack 等。
  </Card>
  <Card title="插件" href="/zh-CN/tools/plugin" icon="plug">
    扩展 OpenClaw 的内置和第三方插件。
  </Card>
</CardGroup>
