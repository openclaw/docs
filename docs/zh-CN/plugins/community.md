---
read_when:
    - 你想查找第三方 OpenClaw 插件
    - 你想发布或列出自己的插件
summary: 社区维护的 OpenClaw 插件：浏览、安装并提交你自己的插件
title: 社区插件
x-i18n:
    generated_at: "2026-04-29T05:40:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: a54130fefc55042d53270e5f7f4b49a4aad715570743013fbfe06b0e2fa067d0
    source_path: plugins/community.md
    workflow: 16
---

社区插件是第三方软件包，可为 OpenClaw 扩展新的渠道、工具、提供商或其他能力。它们由社区构建和维护，通常发布在 [ClawHub](/zh-CN/tools/clawhub)，并且可通过一条命令安装。对于尚未迁移到 ClawHub 的软件包，npm 仍是受支持的备用方案。

ClawHub 是社区插件的规范发现入口。不要仅为了让你的插件可被发现而提交只改文档的 PR；请改为将其发布到 ClawHub。

```bash
openclaw plugins install <package-name>
```

OpenClaw 会先检查 ClawHub，并在需要时自动回退到 npm。

## 已列出的插件

### Apify

使用 20,000 多个现成爬虫从任何网站抓取数据。让你的智能体只需提问，就能从 Instagram、Facebook、TikTok、YouTube、Google Maps、Google Search、电子商务网站等提取数据。

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

用于 Codex App Server 对话的独立 OpenClaw 桥接。将聊天绑定到 Codex 线程，用纯文本与其对话，并通过聊天原生命令控制恢复、规划、审查、模型选择、压缩等功能。

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

使用 Stream 模式的企业机器人集成。通过任意 DingTalk 客户端支持文本、图片和文件消息。

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

用于 OpenClaw 的无损上下文管理插件。基于 DAG 的对话摘要，支持增量压缩，在减少令牌使用量的同时保留完整上下文保真度。

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

将智能体轨迹导出到 Opik 的官方插件。监控智能体行为、成本、令牌、错误等。

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

为你的 OpenClaw 智能体提供 Live2D 头像，支持实时唇形同步、情绪表情和文本转语音。包含用于 AI 资产生成和一键部署到 Prometheus Marketplace 的创作者工具。目前处于 alpha 阶段。

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

通过 QQ Bot API 将 OpenClaw 连接到 QQ。支持私聊、群组提及、频道消息，以及包括语音、图片、视频和文件在内的富媒体。

当前 OpenClaw 版本内置 QQ Bot。常规安装请使用 [QQ Bot](/zh-CN/channels/qqbot) 中的内置设置；仅当你明确需要 Tencent 维护的独立软件包时，才安装这个外部插件。

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Tencent WeCom 团队为 OpenClaw 提供的 WeCom 渠道插件。它由 WeCom Bot WebSocket 持久连接驱动，支持私信和群聊、流式回复、主动消息、图片/文件处理、Markdown 格式、内置访问控制，以及文档/会议/消息 Skills。

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### 腾讯元宝

Tencent 腾讯元宝团队为 OpenClaw 提供的腾讯元宝渠道插件。它由 WebSocket 持久连接驱动，支持私信和群聊、流式回复、主动消息、图片/文件/音频/视频处理、Markdown 格式、内置访问控制，以及斜杠命令菜单。

- **npm:** `openclaw-plugin-yuanbao`
- **repo:** [github.com/yb-claw/openclaw-plugin-yuanbao](https://github.com/yb-claw/openclaw-plugin-yuanbao)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## 提交你的插件

我们欢迎实用、有文档且运行安全的社区插件。

<Steps>
  <Step title="发布到 ClawHub 或 npm">
    你的插件必须可通过 `openclaw plugins install \<package-name\>` 安装。
    请发布到 [ClawHub](/zh-CN/tools/clawhub)，除非你明确需要仅通过 npm
    分发。
    完整指南请参阅 [构建插件](/zh-CN/plugins/building-plugins)。

  </Step>

  <Step title="托管在 GitHub">
    源代码必须位于包含设置文档和问题跟踪器的公开仓库中。

  </Step>

  <Step title="仅将文档 PR 用于源文档变更">
    你不需要仅为了让插件可被发现而提交文档 PR。请改为将其发布到
    ClawHub。

    仅当 OpenClaw 的源文档需要实际内容变更时才提交文档 PR，例如修正安装指南，或添加属于主文档集的跨仓库文档。

  </Step>
</Steps>

## 质量门槛

| 要求                        | 原因                                           |
| --------------------------- | --------------------------------------------- |
| 发布在 ClawHub 或 npm       | 用户需要 `openclaw plugins install` 能正常工作 |
| 公开 GitHub 仓库            | 源码审查、问题跟踪、透明度                    |
| 设置和使用文档              | 用户需要知道如何配置它                        |
| 活跃维护                    | 近期更新或及时响应问题处理                    |

投入不足的封装、所有权不清晰或无人维护的软件包可能会被拒绝。

## 相关

- [安装和配置插件](/zh-CN/tools/plugin) — 如何安装任意插件
- [构建插件](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [插件清单](/zh-CN/plugins/manifest) — 清单 schema
