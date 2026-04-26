---
read_when:
    - 你想查找第三方 OpenClaw 插件
    - 你想发布或列出你自己的插件
summary: 社区维护的 OpenClaw 插件：浏览、安装并提交你自己的插件
title: 社区插件
x-i18n:
    generated_at: "2026-04-26T00:16:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af2f0be5e5e75fe26a58576e6f44bce52a1ff8d597f86cafd8fb893f6c6b8f4
    source_path: plugins/community.md
    workflow: 15
---

社区插件是用于扩展 OpenClaw 的第三方软件包，可添加新的
渠道、工具、提供商或其他能力。它们由社区构建和维护，发布到 [ClawHub](/zh-CN/tools/clawhub) 或 npm，并且
可通过一条命令安装。

ClawHub 是社区插件的权威发现入口。不要仅仅为了让你的插件能在这里被发现而提交只改文档的 PR；请改为将它发布到
ClawHub。

```bash
openclaw plugins install <package-name>
```

OpenClaw 会先检查 ClawHub，并自动回退到 npm。

## 已列出的插件

### Apify

使用 20,000 多个现成爬虫从任意网站抓取数据。只需提出请求，你的智能体
就能从 Instagram、Facebook、TikTok、YouTube、Google Maps、Google
Search、电商网站等提取数据。

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

面向 Codex App Server 对话的独立 OpenClaw 桥接插件。将聊天绑定到
Codex 线程，使用纯文本与其交流，并通过聊天原生命令控制恢复、规划、审查、模型选择、压缩等功能。

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

使用 Stream 模式的企业机器人集成。支持通过任意 DingTalk 客户端发送文本、图片和
文件消息。

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

面向 OpenClaw 的无损上下文管理插件。基于 DAG 的会话摘要
和增量压缩——在减少 token 使用量的同时保留完整上下文保真度。

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

将智能体追踪导出到 Opik 的官方插件。可监控智能体行为、
成本、token、错误等。

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

为你的 OpenClaw 智能体提供一个具有实时口型同步、情绪
表情和文本转语音功能的 Live2D 虚拟形象。包含用于 AI 资产生成的创作者工具，
以及一键部署到 Prometheus Marketplace 的能力。目前处于 alpha 阶段。

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

通过 QQ Bot API 将 OpenClaw 连接到 QQ。支持私聊、群组
提及、渠道消息，以及包括语音、图片、视频
和文件在内的富媒体。

当前的 OpenClaw 版本已内置 QQ Bot。正常安装请使用
[QQ Bot](/zh-CN/channels/qqbot) 中的内置设置；仅当你明确希望使用腾讯维护的独立软件包时，
才安装这个外部插件。

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

由腾讯 WeCom 团队开发的 OpenClaw WeCom 渠道插件。基于
WeCom Bot WebSocket 持久连接，
支持私信和群聊、流式回复、主动消息发送、图片/文件处理、Markdown
格式化、内置访问控制，以及文档/会议/消息技能。

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## 提交你的插件

我们欢迎实用、有文档并且可安全运行的社区插件。

<Steps>
  <Step title="发布到 ClawHub 或 npm">
    你的插件必须可通过 `openclaw plugins install \<package-name\>` 安装。
    发布到 [ClawHub](/zh-CN/tools/clawhub)（推荐）或 npm。
    完整指南请参见[构建插件](/zh-CN/plugins/building-plugins)。

  </Step>

  <Step title="托管在 GitHub 上">
    源代码必须位于带有设置文档和 issue
    跟踪器的公开仓库中。

  </Step>

  <Step title="仅在源文档需要更改时使用文档 PR">
    你不需要仅为了让你的插件可被发现而提交文档 PR。请改为将它发布到
    ClawHub。

    只有当 OpenClaw 的源文档确实需要内容
    更改时，才提交文档 PR，例如更正安装指引，或添加属于主文档集的
    跨仓库文档。

  </Step>
</Steps>

## 质量门槛

| 要求 | 原因 |
| --------------------------- | --------------------------------------------- |
| 发布到 ClawHub 或 npm | 用户需要 `openclaw plugins install` 能正常工作 |
| 公开的 GitHub 仓库 | 便于审查源码、跟踪 issue，并保证透明度 |
| 设置和使用文档 | 用户需要知道如何配置它 |
| 持续维护 | 有近期更新或能及时响应 issue 处理 |

低质量封装、归属不明确或无人维护的软件包可能会被拒绝。

## 相关内容

- [安装和配置插件](/zh-CN/tools/plugin) — 如何安装任意插件
- [构建插件](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [插件清单](/zh-CN/plugins/manifest) — 清单 schema
