---
read_when:
    - 你想查看 OpenClaw 支持内容的完整列表
summary: OpenClaw 在渠道、路由、媒体和用户体验方面的能力。
title: 功能
x-i18n:
    generated_at: "2026-05-07T01:51:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f95185073e52f4b5b34042ea27927984bf0b040d20eb61b135514816fddc214
    source_path: concepts/features.md
    workflow: 16
---

## 亮点

<Columns>
  <Card title="渠道" icon="message-square" href="/zh-CN/channels">
    Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat 等通过一个 Gateway 网关接入。
  </Card>
  <Card title="插件" icon="plug" href="/zh-CN/tools/plugin">
    在常规当前版本中，内置插件无需单独安装即可添加 Matrix、Nextcloud Talk、Nostr、Twitch、Zalo 等。
  </Card>
  <Card title="路由" icon="route" href="/zh-CN/concepts/multi-agent">
    多智能体路由，带隔离会话。
  </Card>
  <Card title="媒体" icon="image" href="/zh-CN/nodes/images">
    图像、音频、视频、文档，以及图像/视频生成。
  </Card>
  <Card title="应用和 UI" icon="monitor" href="/zh-CN/web/control-ui">
    Web Control UI 和 macOS 配套应用。
  </Card>
  <Card title="移动节点" icon="smartphone" href="/zh-CN/nodes">
    iOS 和 Android 节点，支持配对、语音/聊天和丰富的设备命令。
  </Card>
</Columns>

## 完整列表

**渠道：**

- 内置渠道包括 Discord、Google Chat、iMessage、IRC、Signal、Slack、Telegram、WebChat 和 WhatsApp
- 内置插件渠道包括作为旧版 iMessage 桥接的 BlueBubbles、Feishu、LINE、Matrix、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Tlon、Twitch、Zalo 和 Zalo Personal
- 可选单独安装的渠道插件包括 Voice Call 和 WeChat 等第三方软件包
- 第三方渠道插件可以进一步扩展 Gateway 网关，例如 WeChat
- 基于提及激活的群聊支持
- 通过允许列表和配对实现私信安全

**智能体：**

- 内嵌智能体运行时，支持工具流式传输
- 按工作区或发送者提供隔离会话的多智能体路由
- 会话：直接聊天会折叠到共享的 `main`；群组会隔离
- 长回复的流式传输和分块

**身份验证和提供商：**

- 35+ 个模型提供商（Anthropic、OpenAI、Google 等）
- 通过 OAuth 的订阅身份验证（例如 OpenAI Codex）
- 支持自定义和自托管提供商（vLLM、SGLang、Ollama，以及任何 OpenAI 兼容或 Anthropic 兼容端点）

**媒体：**

- 图像、音频、视频和文档的输入与输出
- 共享的图像生成和视频生成功能表面
- 语音笔记转录
- 通过多个提供商实现文本转语音

**应用和界面：**

- WebChat 和浏览器 Control UI
- macOS 菜单栏配套应用
- iOS 节点，支持配对、Canvas、摄像头、屏幕录制、位置和语音
- Android 节点，支持配对、聊天、语音、Canvas、摄像头和设备命令

**工具和自动化：**

- 浏览器自动化、执行、沙箱隔离
- Web 搜索（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web 搜索、Perplexity、SearXNG、Tavily）
- Cron 任务和 Heartbeat 调度
- Skills、插件和工作流管线（Lobster）

## 相关

<CardGroup cols={2}>
  <Card title="实验性功能" href="/zh-CN/concepts/experimental-features" icon="flask">
    尚未发布到默认表面的选择启用功能。
  </Card>
  <Card title="智能体运行时" href="/zh-CN/concepts/agent" icon="robot">
    智能体运行时模型以及运行如何分派。
  </Card>
  <Card title="渠道" href="/zh-CN/channels" icon="message-square">
    从一个 Gateway 网关连接 Telegram、WhatsApp、Discord、Slack 等。
  </Card>
  <Card title="插件" href="/zh-CN/tools/plugin" icon="plug">
    扩展 OpenClaw 的内置和第三方插件。
  </Card>
</CardGroup>
