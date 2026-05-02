---
read_when:
    - 你想查找第三方 OpenClaw 插件
    - 你想发布或列出自己的插件
summary: 社区维护的 OpenClaw 插件：浏览、安装并提交你自己的插件
title: 社区插件
x-i18n:
    generated_at: "2026-05-02T19:10:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a58fbc153c837f5ac79ee70406a5611e8a9a273c18c0c5642763531fbe10dca
    source_path: plugins/community.md
    workflow: 16
---

社区插件是第三方软件包，可为 OpenClaw 扩展新的渠道、工具、提供商或其他能力。它们由社区构建和维护，通常发布在 [ClawHub](/zh-CN/tools/clawhub)，并可通过单条命令安装。在 ClawHub 打包安装逐步推出期间，npm 仍是裸包规范的默认启动方式。

ClawHub 是社区插件的权威发现入口。不要只是为了让你的插件在这里可被发现而提交纯文档 PR；请改为将其发布到 ClawHub。

```bash
openclaw plugins install clawhub:<package-name>
```

对托管在 npm 上的软件包，请使用 `openclaw plugins install <package-name>`。

## 已列出的插件

### Apify

使用 20,000 多个现成爬虫从任意网站抓取数据。只需提出请求，就能让你的智能体从 Instagram、Facebook、TikTok、YouTube、Google Maps、Google Search、电子商务网站等提取数据。

- **npm：** `@apify/apify-openclaw-plugin`
- **仓库：** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

用于 Codex App Server 对话的独立 OpenClaw 桥接器。将聊天绑定到 Codex 线程，用纯文本与它对话，并通过聊天原生命令控制恢复、规划、审查、模型选择、压缩等功能。

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

面向 OpenClaw 的无损上下文管理插件。基于 DAG 的对话摘要与增量压缩，可在减少令牌用量的同时保留完整的上下文保真度。

- **npm：** `@martian-engineering/lossless-claw`
- **仓库：** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

将智能体跟踪导出到 Opik 的官方插件。监控智能体行为、成本、令牌、错误等。

- **npm：** `@opik/opik-openclaw`
- **仓库：** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

为你的 OpenClaw 智能体配备 Live2D 头像，支持实时口型同步、情绪表情和文本转语音。包含用于 AI 资产生成的创作者工具，并可一键部署到 Prometheus Marketplace。目前处于 alpha 阶段。

- **npm：** `@prometheusavatar/openclaw-plugin`
- **仓库：** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

通过 QQ Bot API 将 OpenClaw 连接到 QQ。支持私聊、群组提及、频道消息，以及语音、图片、视频和文件等富媒体。

当前 OpenClaw 版本已内置 QQ Bot。常规安装请使用 [QQ Bot](/zh-CN/channels/qqbot) 中的内置设置；仅当你明确想要 Tencent 维护的独立软件包时，才安装此外部插件。

- **npm：** `@tencent-connect/openclaw-qqbot`
- **仓库：** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Tencent WeCom 团队为 OpenClaw 提供的 WeCom 渠道插件。它由 WeCom Bot WebSocket 持久连接驱动，支持私信和群聊、流式回复、主动消息、图片/文件处理、Markdown 格式化、内置访问控制，以及文档/会议/消息 Skills。

- **npm：** `@wecom/wecom-openclaw-plugin`
- **仓库：** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### 腾讯元宝

腾讯元宝团队为 OpenClaw 提供的腾讯元宝渠道插件。它由 WebSocket 持久连接驱动，支持私信和群聊、流式回复、主动消息、图片/文件/音频/视频处理、Markdown 格式化、内置访问控制，以及斜杠菜单。

- **npm：** `openclaw-plugin-yuanbao`
- **仓库：** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## 提交你的插件

我们欢迎实用、有文档且运行安全的社区插件。

<Steps>
  <Step title="发布到 ClawHub 或 npm">
    你的插件必须能够通过 `openclaw plugins install \<package-name\>` 安装。
    除非你明确需要仅通过 npm 分发，否则请发布到 [ClawHub](/zh-CN/tools/clawhub)。
    完整指南请参见 [构建插件](/zh-CN/plugins/building-plugins)。

  </Step>

  <Step title="托管在 GitHub 上">
    源代码必须位于公共仓库中，并包含设置文档和问题跟踪器。

  </Step>

  <Step title="仅将文档 PR 用于源文档变更">
    你不需要仅为了让插件可被发现而提交文档 PR。请改为将其发布到 ClawHub。

    仅当 OpenClaw 的源文档确实需要内容变更时才打开文档 PR，例如更正安装指导，或添加属于主文档集的跨仓库文档。

  </Step>
</Steps>

## 质量门槛

| 要求                        | 原因                                           |
| --------------------------- | --------------------------------------------- |
| 发布在 ClawHub 或 npm       | 用户需要 `openclaw plugins install` 能正常工作 |
| 公共 GitHub 仓库            | 源代码审查、问题跟踪、透明度                  |
| 设置和使用文档              | 用户需要知道如何配置它                        |
| 积极维护                    | 近期更新或及时响应问题处理                    |

低投入封装、所有权不清晰或无人维护的软件包可能会被拒绝。

## 相关内容

- [安装和配置插件](/zh-CN/tools/plugin) — 如何安装任意插件
- [构建插件](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [插件清单](/zh-CN/plugins/manifest) — 清单架构
