---
read_when:
    - 你想查找第三方 OpenClaw 插件
    - 你想发布或列出你自己的插件
summary: 社区维护的 OpenClaw 插件：浏览、安装并提交你自己的插件
title: 社区插件
x-i18n:
    generated_at: "2026-04-27T15:08:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b9c92e8f2e592bbbdbaa8d3f354d176f1600354f6438f137dbe01c01c6f5603
    source_path: plugins/community.md
    workflow: 15
---

社区插件是第三方软件包，可通过新的渠道、工具、提供商或其他能力扩展 OpenClaw。它们由社区构建和维护，发布在 [ClawHub](/zh-CN/tools/clawhub) 或 npm 上，并且只需一条命令即可安装。

ClawHub 是社区插件的权威发现入口。不要仅仅为了让你的插件更容易被发现而提交只改文档的 PR；请改为将它发布到 ClawHub。

```bash
openclaw plugins install <package-name>
```

OpenClaw 会先检查 ClawHub，并在需要时自动回退到 npm。

## 已列出的插件

### Apify

使用 20,000 多个现成爬虫从任何网站抓取数据。让你的智能体仅通过提问，就能从 Instagram、Facebook、TikTok、YouTube、Google Maps、Google Search、电商网站等提取数据。

- **npm：** `@apify/apify-openclaw-plugin`
- **仓库：** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

面向 Codex App Server 对话的独立 OpenClaw 桥接插件。你可以将聊天绑定到一个 Codex 线程，通过纯文本与其交互，并使用聊天原生命令控制恢复、规划、审查、模型选择、压缩等功能。

- **npm：** `openclaw-codex-app-server`
- **仓库：** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

使用 Stream 模式的企业机器人集成。支持通过任意 DingTalk 客户端发送文本、图片和文件消息。

- **npm：** `@largezhou/ddingtalk`
- **仓库：** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

适用于 OpenClaw 的无损上下文管理插件。基于 DAG 的对话摘要与增量压缩，在减少 token 使用量的同时保留完整上下文保真度。

- **npm：** `@martian-engineering/lossless-claw`
- **仓库：** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

将智能体追踪导出到 Opik 的官方插件。可监控智能体行为、成本、token、错误等。

- **npm：** `@opik/opik-openclaw`
- **仓库：** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

为你的 OpenClaw 智能体赋予一个带有实时唇形同步、情绪表情和文本转语音能力的 Live2D 虚拟形象。包含用于 AI 资产生成的创作者工具，以及一键部署到 Prometheus Marketplace 的功能。目前处于 alpha 阶段。

- **npm：** `@prometheusavatar/openclaw-plugin`
- **仓库：** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

通过 QQ Bot API 将 OpenClaw 连接到 QQ。支持私聊、群组提及、频道消息，以及语音、图片、视频和文件等富媒体内容。

当前的 OpenClaw 版本已内置 QQ Bot。正常安装时，请使用 [QQ Bot](/zh-CN/channels/qqbot) 中的内置设置；只有在你明确想使用腾讯维护的独立软件包时，才安装这个外部插件。

- **npm：** `@tencent-connect/openclaw-qqbot`
- **仓库：** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

由腾讯企业微信团队提供的 OpenClaw WeCom 渠道插件。基于 WeCom Bot WebSocket 长连接，支持私信和群聊、流式回复、主动消息发送、图片/文件处理、Markdown 格式化、内置访问控制，以及文档/会议/消息相关 Skills。

- **npm：** `@wecom/wecom-openclaw-plugin`
- **仓库：** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

由腾讯元宝团队提供的 OpenClaw Yuanbao 渠道插件。基于 WebSocket 长连接，支持私信和群聊、流式回复、主动消息发送、图片/文件/音频/视频处理、Markdown 格式化、内置访问控制以及斜杠命令菜单。

- **npm：** `openclaw-plugin-yuanbao`
- **仓库：** [github.com/yb-claw/openclaw-plugin-yuanbao](https://github.com/yb-claw/openclaw-plugin-yuanbao)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## 提交你的插件

我们欢迎实用、有文档且可安全运行的社区插件。

<Steps>
  <Step title="Publish to ClawHub or npm">
    你的插件必须可以通过 `openclaw plugins install \<package-name\>` 安装。
    请发布到 [ClawHub](/zh-CN/tools/clawhub)（推荐）或 npm。
    完整指南请参阅 [构建插件](/zh-CN/plugins/building-plugins)。

  </Step>

  <Step title="Host on GitHub">
    源代码必须位于带有设置文档和 issue 跟踪器的公开仓库中。

  </Step>

  <Step title="Use docs PRs only for source-doc changes">
    你不需要仅为了让插件可被发现而提交文档 PR。请改为将它发布到 ClawHub。

    只有当 OpenClaw 的源文档确实需要内容变更时，才应提交文档 PR，例如更正安装指引，或添加属于主文档集的跨仓库文档。

  </Step>
</Steps>

## 质量门槛

| 要求 | 原因 |
| --------------------------- | --------------------------------------------- |
| 发布到 ClawHub 或 npm | 用户需要 `openclaw plugins install` 能正常工作 |
| 公开的 GitHub 仓库 | 便于审查源码、跟踪问题并提升透明度 |
| 设置和使用文档 | 用户需要知道如何配置它 |
| 持续维护 | 近期有更新，或能及时响应 issue 处理 |

低质量封装、归属不清或无人维护的软件包可能会被拒绝。

## 相关内容

- [安装和配置插件](/zh-CN/tools/plugin) — 如何安装任意插件
- [构建插件](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [插件清单](/zh-CN/plugins/manifest) — 清单 schema
