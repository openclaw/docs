---
read_when:
    - 你想查看 OpenClaw 支持内容的完整列表
summary: OpenClaw 在渠道、路由、媒体和用户体验方面的能力。
title: 功能
x-i18n:
    generated_at: "2026-07-11T20:27:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bc3ebdd87a0f6ea0f3d75d029bf7cae469ecd9db84a165bd47c4896936fe303
    source_path: concepts/features.md
    workflow: 16
---

## 亮点

<Columns>
  <Card title="Channels" icon="message-square" href="/zh-CN/channels">
    通过单个 Gateway 网关使用 Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat 等渠道。
  </Card>
  <Card title="Plugins" icon="plug" href="/zh-CN/tools/plugin">
    只需一条安装命令，官方插件即可添加 Matrix、Nextcloud Talk、Nostr、Twitch、Zalo 等数十种渠道。
  </Card>
  <Card title="Routing" icon="route" href="/zh-CN/concepts/multi-agent">
    支持会话隔离的多智能体路由。
  </Card>
  <Card title="Media" icon="image" href="/zh-CN/nodes/images">
    支持图像、音频、视频、文档，以及图像和视频生成。
  </Card>
  <Card title="Apps and UI" icon="monitor" href="/zh-CN/platforms">
    Windows Hub、浏览器 Control UI、macOS 菜单栏应用和移动节点。
  </Card>
  <Card title="Mobile nodes" icon="smartphone" href="/zh-CN/nodes">
    支持配对、语音/聊天和丰富设备命令的 iOS 与 Android 节点。
  </Card>
</Columns>

## 完整列表

**渠道：**

- iMessage、Telegram 和 WebChat 随核心安装一同提供；其他所有渠道均为官方插件，可通过 `openclaw plugins install @openclaw/<id>` 安装（也可在执行 `openclaw onboard` / `openclaw channels add` 时按需安装）
- 官方插件渠道：Discord、Feishu、Google Chat、IRC、LINE、Matrix、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Raft、Signal、Slack、SMS、Synology Chat、Tlon、Twitch、Voice Call、WhatsApp、Zalo 和 Zalo Personal
- 在 OpenClaw 仓库之外维护的外部插件渠道：微信、腾讯元宝和 Zalo ClawBot
- 支持通过提及触发的群聊
- 通过允许列表和配对保障私信安全

**智能体：**

- 内置支持工具流式传输的智能体运行时
- 按工作区或发送者提供会话隔离的多智能体路由
- 会话：直接聊天合并到共享的 `main`；群聊相互隔离
- 为长回复提供流式传输和分块

**身份验证和提供商：**

- 35 个以上的模型提供商（Anthropic、OpenAI、Google 等）
- 通过 OAuth 进行订阅身份验证（例如 OpenAI Codex）
- 支持自定义和自托管提供商（vLLM、SGLang、Ollama、llama.cpp、LM Studio，以及任何兼容 OpenAI 或 Anthropic 的端点）

**媒体：**

- 支持图像、音频、视频和文档的输入与输出
- 共享的图像生成和视频生成能力接口
- 语音消息转录
- 支持多个提供商的文本转语音

**应用和界面：**

- WebChat 和浏览器 Control UI
- macOS 菜单栏配套应用
- iOS 节点支持配对、Canvas、相机、屏幕录制、位置和语音
- Android 节点支持配对、聊天、语音、Canvas、相机和设备命令

**工具和自动化：**

- 浏览器自动化、Exec、沙箱隔离
- Web 搜索（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web 搜索、Perplexity、SearXNG、Tavily）
- Cron 作业和 Heartbeat 调度
- Skills、插件和工作流管道（Lobster）

## 相关内容

<CardGroup cols={2}>
  <Card title="Experimental features" href="/zh-CN/concepts/experimental-features" icon="flask">
    尚未在默认功能界面中发布的可选启用功能。
  </Card>
  <Card title="Agent runtime" href="/zh-CN/concepts/agent" icon="robot">
    智能体运行时模型以及运行任务的分派方式。
  </Card>
  <Card title="Channels" href="/zh-CN/channels" icon="message-square">
    通过一个 Gateway 网关连接 Telegram、WhatsApp、Discord、Slack 等渠道。
  </Card>
  <Card title="Plugins" href="/zh-CN/tools/plugin" icon="plug">
    扩展 OpenClaw 的官方插件和外部插件。
  </Card>
</CardGroup>
