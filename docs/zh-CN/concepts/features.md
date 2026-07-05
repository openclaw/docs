---
read_when:
    - 你想查看 OpenClaw 支持内容的完整列表
summary: OpenClaw 在渠道、路由、媒体和用户体验方面的能力。
title: 功能
x-i18n:
    generated_at: "2026-07-05T11:13:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bc3ebdd87a0f6ea0f3d75d029bf7cae469ecd9db84a165bd47c4896936fe303
    source_path: concepts/features.md
    workflow: 16
---

## 亮点

<Columns>
  <Card title="渠道" icon="message-square" href="/zh-CN/channels">
    Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat 等渠道可通过单个 Gateway 网关使用。
  </Card>
  <Card title="插件" icon="plug" href="/zh-CN/tools/plugin">
    官方插件可通过一条安装命令添加 Matrix、Nextcloud Talk、Nostr、Twitch、Zalo 以及更多数十种集成。
  </Card>
  <Card title="路由" icon="route" href="/zh-CN/concepts/multi-agent">
    支持隔离会话的多 Agent 路由。
  </Card>
  <Card title="媒体" icon="image" href="/zh-CN/nodes/images">
    图片、音频、视频、文档，以及图片/视频生成。
  </Card>
  <Card title="应用和 UI" icon="monitor" href="/zh-CN/platforms">
    Windows Hub、浏览器 Control UI、macOS 菜单栏应用和移动节点。
  </Card>
  <Card title="移动节点" icon="smartphone" href="/zh-CN/nodes">
    iOS 和 Android 节点，支持配对、语音/聊天和丰富的设备命令。
  </Card>
</Columns>

## 完整列表

**渠道：**

- iMessage、Telegram 和 WebChat 随核心安装提供；其他所有渠道都是
  官方插件，可通过 `openclaw plugins install @openclaw/<id>` 安装（或在
  `openclaw onboard` / `openclaw channels add` 期间按需安装）
- 官方插件渠道：Discord、Feishu、Google Chat、IRC、LINE、Matrix、Mattermost、
  Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Raft、Signal、Slack、SMS、Synology Chat、
  Tlon、Twitch、Voice Call、WhatsApp、Zalo 和 Zalo Personal
- 在 OpenClaw 仓库外维护的外部插件渠道：微信、腾讯元宝和 Zalo ClawBot
- 支持基于提及激活的群聊
- 通过允许列表和配对保障私信安全

**智能体：**

- 内嵌智能体运行时，支持工具流式传输
- 支持按工作区或发送者隔离会话的多 Agent 路由
- 会话：直接聊天会合并到共享的 `main`；群组相互隔离
- 长响应支持流式传输和分块

**认证和提供商：**

- 35+ 个模型提供商（Anthropic、OpenAI、Google 等）
- 通过 OAuth 使用订阅认证（例如 OpenAI Codex）
- 支持自定义和自托管提供商（vLLM、SGLang、Ollama、llama.cpp、LM Studio，以及
  任何 OpenAI 兼容或 Anthropic 兼容端点）

**媒体：**

- 图片、音频、视频和文档的输入与输出
- 共享的图片生成和视频生成能力表面
- 语音便笺转录
- 支持多个提供商的文本转语音

**应用和界面：**

- WebChat 和浏览器 Control UI
- macOS 菜单栏配套应用
- iOS 节点，支持配对、Canvas、相机、屏幕录制、位置和语音
- Android 节点，支持配对、聊天、语音、Canvas、相机和设备命令

**工具和自动化：**

- 浏览器自动化、exec、沙箱隔离
- Web 搜索（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web 搜索、Perplexity、SearXNG、Tavily）
- Cron 任务和 Heartbeat 调度
- Skills、插件和工作流流水线（Lobster）

## 相关

<CardGroup cols={2}>
  <Card title="实验性功能" href="/zh-CN/concepts/experimental-features" icon="flask">
    尚未发布到默认界面的可选启用功能。
  </Card>
  <Card title="Agent 运行时" href="/zh-CN/concepts/agent" icon="robot">
    Agent 运行时模型，以及运行如何分发。
  </Card>
  <Card title="渠道" href="/zh-CN/channels" icon="message-square">
    通过一个 Gateway 网关连接 Telegram、WhatsApp、Discord、Slack 等。
  </Card>
  <Card title="插件" href="/zh-CN/tools/plugin" icon="plug">
    扩展 OpenClaw 的官方和外部插件。
  </Card>
</CardGroup>
