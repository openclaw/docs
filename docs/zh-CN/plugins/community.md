---
read_when:
    - 你想查找第三方 OpenClaw 插件
    - 你想发布或列出自己的插件
summary: 社区维护的 OpenClaw 插件：浏览、安装并提交你自己的插件
title: 社区插件
x-i18n:
    generated_at: "2026-05-10T19:40:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: ee23598011f79f46b9171296501605cf0a5ef5aa7b67040135ea47cac21ca6a4
    source_path: plugins/community.md
    workflow: 16
---

社区插件是第三方包，可为 OpenClaw 扩展新的渠道、工具、提供商或其他能力。它们由社区构建和维护，通常发布在 [ClawHub](/zh-CN/clawhub)，并且可以通过一条命令安装。在 ClawHub 包安装逐步推出期间，npm 仍是裸包规格的默认启动方式。

ClawHub 是社区插件的规范发现入口。不要仅为了让你的插件可被发现而提交仅文档 PR；请改为将其发布到 ClawHub。

```bash
openclaw plugins install clawhub:<package-name>
```

对 npm 托管的包使用 `openclaw plugins install <package-name>`。

## 已列出的插件

### Apify

使用 20,000 多个现成爬虫从任意网站抓取数据。让你的智能体只需通过请求，即可从 Instagram、Facebook、TikTok、YouTube、Google Maps、Google Search、电商网站等提取数据。

- **npm:** `@apify/apify-openclaw-plugin`
- **仓库:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

用于 Codex App Server 对话的独立 OpenClaw 桥接插件。将聊天绑定到 Codex 线程，用纯文本与其交互，并通过聊天原生命令控制恢复、规划、审查、模型选择、压缩等功能。

- **npm:** `openclaw-codex-app-server`
- **仓库:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

使用 Stream 模式的企业机器人集成。通过任意 DingTalk 客户端支持文本、图片和文件消息。

- **npm:** `@largezhou/ddingtalk`
- **仓库:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

面向 OpenClaw 的无损上下文管理插件。基于 DAG 的对话摘要，支持增量压缩，在减少 token 用量的同时保留完整上下文保真度。

- **npm:** `@martian-engineering/lossless-claw`
- **仓库:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

将智能体轨迹导出到 Opik 的官方插件。监控智能体行为、成本、token、错误等。

- **npm:** `@opik/opik-openclaw`
- **仓库:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

为你的 OpenClaw 智能体提供具备实时唇形同步、情绪表情和文本转语音的 Live2D 头像。包含用于 AI 资产生成的创作者工具，以及一键部署到 Prometheus Marketplace 的能力。目前处于 alpha 阶段。

- **npm:** `@prometheusavatar/openclaw-plugin`
- **仓库:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

通过 QQ Bot API 将 OpenClaw 连接到 QQ。支持私聊、群组提及、频道消息，以及包括语音、图片、视频和文件在内的富媒体。

当前 OpenClaw 版本内置 QQ Bot。普通安装请使用 [QQ Bot](/zh-CN/channels/qqbot) 中的内置设置；只有在你明确需要腾讯维护的独立包时，才安装此外部插件。

- **npm:** `@tencent-connect/openclaw-qqbot`
- **仓库:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

由腾讯 WeCom 团队为 OpenClaw 提供的 WeCom 渠道插件。基于 WeCom Bot WebSocket 持久连接，支持私信和群聊、流式回复、主动消息、图片/文件处理、Markdown 格式化、内置访问控制，以及文档/会议/消息 Skills。

- **npm:** `@wecom/wecom-openclaw-plugin`
- **仓库:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

由腾讯元宝团队为 OpenClaw 提供的腾讯元宝渠道插件。基于 WebSocket 持久连接，支持私信和群聊、流式回复、主动消息、图片/文件/音频/视频处理、Markdown 格式化、内置访问控制，以及斜杠菜单。

- **npm:** `openclaw-plugin-yuanbao`
- **仓库:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## 提交你的插件

我们欢迎有用、文档完善且运行安全的社区插件。

<Steps>
  <Step title="发布到 ClawHub 或 npm">
    你的插件必须能通过 `openclaw plugins install \<package-name\>` 安装。
    除非你明确需要仅 npm 分发，否则请发布到 [ClawHub](/zh-CN/clawhub)。
    完整指南见 [构建插件](/zh-CN/plugins/building-plugins)。

  </Step>

  <Step title="托管在 GitHub 上">
    源代码必须位于公共仓库，并包含设置文档和 issue 跟踪器。

  </Step>

  <Step title="仅将文档 PR 用于源文档变更">
    你不需要仅为了让插件可被发现而提交文档 PR。请改为将其发布到 ClawHub。

    只有在 OpenClaw 的源文档需要实际内容变更时，才提交文档 PR，例如修正安装指南，或添加属于主文档集的跨仓库文档。

  </Step>
</Steps>

## 质量门槛

| 要求                        | 原因                                          |
| --------------------------- | --------------------------------------------- |
| 发布在 ClawHub 或 npm       | 用户需要 `openclaw plugins install` 可正常工作 |
| 公共 GitHub 仓库            | 源码审查、issue 跟踪、透明度                  |
| 设置和使用文档              | 用户需要知道如何配置它                        |
| 积极维护                    | 最近有更新或能及时处理 issue                  |

低投入封装、所有权不清晰或无人维护的包可能会被拒绝。

## 相关

- [安装和配置插件](/zh-CN/tools/plugin) — 如何安装任意插件
- [构建插件](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [插件清单](/zh-CN/plugins/manifest) — 清单 schema
