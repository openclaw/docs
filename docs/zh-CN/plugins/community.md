---
read_when:
    - 你想查找第三方 OpenClaw 插件
    - 你想发布或列出你自己的插件
summary: 由社区维护的 OpenClaw 插件：浏览、安装并提交你自己的插件
title: 社区插件
x-i18n:
    generated_at: "2026-04-05T08:38:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0069c8b5e22702f571860b9381469b7c80978dd56a784e212e46ef667a20b83d
    source_path: plugins/community.md
    workflow: 15
---

# 社区插件

社区插件是第三方软件包，可为 OpenClaw 扩展新的渠道、工具、提供商或其他能力。它们由社区构建和维护，发布在 [ClawHub](/tools/clawhub) 或 npm 上，并且可通过一条命令安装。

```bash
openclaw plugins install <package-name>
```

OpenClaw 会先检查 ClawHub，然后自动回退到 npm。

## 已列出的插件

### Codex App Server Bridge

用于 Codex App Server 对话的独立 OpenClaw 桥接。将聊天绑定到一个 Codex 线程，用纯文本与其对话，并通过聊天原生命令控制恢复、规划、评审、模型选择、压缩等功能。

- **npm：** `openclaw-codex-app-server`
- **repo：** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

使用 Stream 模式的企业机器人集成。支持通过任意 DingTalk 客户端发送文本、图片和文件消息。

- **npm：** `@largezhou/ddingtalk`
- **repo：** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw（LCM）

OpenClaw 的无损上下文管理插件。基于 DAG 的对话摘要与增量压缩——在减少 token 使用量的同时保持完整的上下文保真度。

- **npm：** `@martian-engineering/lossless-claw`
- **repo：** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

将智能体追踪导出到 Opik 的官方插件。可监控智能体行为、成本、token、错误等。

- **npm：** `@opik/opik-openclaw`
- **repo：** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### QQ Bot

通过 QQ Bot API 将 OpenClaw 连接到 QQ。支持私聊、群提及、频道消息，以及语音、图片、视频和文件等富媒体。

- **npm：** `@tencent-connect/openclaw-qqbot`
- **repo：** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

由腾讯 WeCom 团队开发的 OpenClaw WeCom 渠道插件。基于 WeCom Bot WebSocket 持久连接，支持私聊和群聊、流式回复、主动消息、图片/文件处理、Markdown 格式化、内置访问控制，以及文档/会议/消息 Skills。

- **npm：** `@wecom/wecom-openclaw-plugin`
- **repo：** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## 提交你的插件

我们欢迎对用户有用、文档完善且运行安全的社区插件。

<Steps>
  <Step title="发布到 ClawHub 或 npm">
    你的插件必须可通过 `openclaw plugins install \<package-name\>` 安装。
    发布到 [ClawHub](/tools/clawhub)（推荐）或 npm。
    完整指南请参见 [Building Plugins](/plugins/building-plugins)。

  </Step>

  <Step title="托管到 GitHub">
    源代码必须位于带有设置文档和问题跟踪器的公开仓库中。

  </Step>

  <Step title="提交 PR">
    将你的插件添加到此页面，并包含：

    - 插件名称
    - npm 包名称
    - GitHub 仓库 URL
    - 一行描述
    - 安装命令

  </Step>
</Steps>

## 质量门槛

| 要求                        | 原因                                      |
| --------------------------- | ----------------------------------------- |
| 发布在 ClawHub 或 npm 上    | 用户需要让 `openclaw plugins install` 正常工作 |
| GitHub 公开仓库             | 便于审查源码、跟踪问题并保持透明度        |
| 设置和使用文档              | 用户需要知道如何配置它                    |
| 持续维护                    | 近期有更新，或能及时响应问题处理          |

低投入包装器、归属不明确或无人维护的软件包可能会被拒绝。

## 相关内容

- [Install and Configure Plugins](/tools/plugin) — 如何安装任意插件
- [Building Plugins](/plugins/building-plugins) — 创建你自己的插件
- [Plugin Manifest](/plugins/manifest) — 清单 schema
