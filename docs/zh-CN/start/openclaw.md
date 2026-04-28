---
read_when:
    - 新助手实例的新手引导
    - 审查安全/权限影响
summary: 将 OpenClaw 作为个人助理运行的端到端指南，包含安全注意事项
title: 个人助手设置
x-i18n:
    generated_at: "2026-04-28T12:04:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0614272f9a2b30e0900c55b39a8bd6a2b71b9f5d5fbf0fe00c534b91193e6a0
    source_path: start/openclaw.md
    workflow: 16
---

# 使用 OpenClaw 构建个人助手

OpenClaw 是一个自托管 Gateway 网关，可将 Discord、Google Chat、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo 等连接到 AI 智能体。本指南介绍“个人助手”设置：一个专用 WhatsApp 号码，表现得像始终在线的 AI 助手。

## ⚠️ 安全优先

你会把智能体放在一个能够执行以下操作的位置：

- 在你的机器上运行命令（取决于你的工具策略）
- 读取/写入你工作区中的文件
- 通过 WhatsApp/Telegram/Discord/Mattermost 和其他内置渠道发回消息

从保守配置开始：

- 始终设置 `channels.whatsapp.allowFrom`（绝不要在你的个人 Mac 上运行对全世界开放的配置）。
- 为助手使用专用 WhatsApp 号码。
- 心跳现在默认每 30 分钟一次。在你信任该设置之前，先通过设置 `agents.defaults.heartbeat.every: "0m"` 禁用它。

## 前提条件

- 已安装并完成新手引导的 OpenClaw —— 如果你还没有完成，请参阅[入门指南](/zh-CN/start/getting-started)
- 助手需要第二个电话号码（SIM/eSIM/预付费）

## 双手机设置（推荐）

你想要的是：

```mermaid
flowchart TB
    A["<b>Your Phone (personal)<br></b><br>Your WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Second Phone (assistant)<br></b><br>Assistant WA<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Your Mac (openclaw)<br></b><br>AI agent"]
```

如果你把个人 WhatsApp 关联到 OpenClaw，那么发给你的每条消息都会变成“智能体输入”。这很少是你想要的。

## 5 分钟快速开始

1. 配对 WhatsApp Web（显示二维码；用助手手机扫描）：

```bash
openclaw channels login
```

2. 启动 Gateway 网关（保持运行）：

```bash
openclaw gateway --port 18789
```

3. 在 `~/.openclaw/openclaw.json` 中放入最小配置：

```json5
{
  gateway: { mode: "local" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

现在从你已加入允许列表的手机向助手号码发送消息。

新手引导完成后，OpenClaw 会自动打开仪表盘并打印一个干净的（非令牌化）链接。如果仪表盘提示认证，请把已配置的共享密钥粘贴到 Control UI 设置中。新手引导默认使用令牌（`gateway.auth.token`），但如果你已将 `gateway.auth.mode` 切换为 `password`，密码认证也可用。稍后重新打开：`openclaw dashboard`。

## 为智能体提供工作区（AGENTS）

OpenClaw 会从其工作区目录读取操作指令和“记忆”。

默认情况下，OpenClaw 使用 `~/.openclaw/workspace` 作为智能体工作区，并会在设置/首次智能体运行时自动创建它（以及初始 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`）。`BOOTSTRAP.md` 仅在工作区全新时创建（删除后不应再次出现）。`MEMORY.md` 是可选的（不会自动创建）；存在时，会在普通会话中加载。子智能体会话只会注入 `AGENTS.md` 和 `TOOLS.md`。

<Tip>
把这个文件夹当作 OpenClaw 的记忆，并将其做成 git 仓库（最好是私有仓库），这样你的 `AGENTS.md` 和记忆文件就会有备份。如果安装了 git，全新工作区会自动初始化。
</Tip>

```bash
openclaw setup
```

完整工作区布局 + 备份指南：[Agent 工作区](/zh-CN/concepts/agent-workspace)
记忆工作流：[Memory](/zh-CN/concepts/memory)

可选：使用 `agents.defaults.workspace` 选择不同的工作区（支持 `~`）。

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

如果你已经从仓库分发自己的工作区文件，可以完全禁用引导文件创建：

```json5
{
  agents: {
    defaults: {
      skipBootstrap: true,
    },
  },
}
```

## 将它变成“助手”的配置

OpenClaw 默认就是一套不错的助手配置，但你通常会想要调整：

- [`SOUL.md`](/zh-CN/concepts/soul) 中的人设/指令
- 思考默认值（如有需要）
- 心跳（在你信任它之后）

示例：

```json5
{
  logging: { level: "info" },
  agent: {
    model: "anthropic/claude-opus-4-6",
    workspace: "~/.openclaw/workspace",
    thinkingDefault: "high",
    timeoutSeconds: 1800,
    // Start with 0; enable later.
    heartbeat: { every: "0m" },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  routing: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"],
    },
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080,
    },
  },
}
```

## 会话与记忆

- 会话文件：`~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- 会话元数据（令牌用量、上次路由等）：`~/.openclaw/agents/<agentId>/sessions/sessions.json`（旧版：`~/.openclaw/sessions/sessions.json`）
- `/new` 或 `/reset` 会为该聊天启动一个新会话（可通过 `resetTriggers` 配置）。如果单独发送，OpenClaw 会确认重置，而不会调用模型。
- `/compact [instructions]` 会压缩会话上下文并报告剩余的上下文预算。

## 心跳（主动模式）

默认情况下，OpenClaw 每 30 分钟运行一次心跳，提示词为：
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
设置 `agents.defaults.heartbeat.every: "0m"` 可禁用。

- 如果 `HEARTBEAT.md` 存在但实际为空（只有空行和类似 `# Heading` 的 Markdown 标题），OpenClaw 会跳过心跳运行以节省 API 调用。
- 如果文件缺失，心跳仍会运行，由模型决定要做什么。
- 如果智能体回复 `HEARTBEAT_OK`（可带短填充；参见 `agents.defaults.heartbeat.ackMaxChars`），OpenClaw 会抑制该心跳的出站投递。
- 默认情况下，允许向私信风格的 `user:<id>` 目标投递心跳。设置 `agents.defaults.heartbeat.directPolicy: "block"` 可在保持心跳运行处于启用状态的同时抑制直接目标投递。
- 心跳会运行完整的智能体轮次 —— 间隔越短，消耗的令牌越多。

```json5
{
  agent: {
    heartbeat: { every: "30m" },
  },
}
```

## 媒体输入与输出

入站附件（图片/音频/文档）可以通过模板暴露给你的命令：

- `{{MediaPath}}`（本地临时文件路径）
- `{{MediaUrl}}`（伪 URL）
- `{{Transcript}}`（如果已启用音频转写）

来自智能体的出站附件：在单独一行包含 `MEDIA:<path-or-url>`（无空格）。示例：

```
Here’s the screenshot.
MEDIA:https://example.com/screenshot.png
```

OpenClaw 会提取这些内容，并将其作为媒体随文本一起发送。

本地路径行为遵循与智能体相同的文件读取信任模型：

- 如果 `tools.fs.workspaceOnly` 为 `true`，出站 `MEDIA:` 本地路径会限制在 OpenClaw 临时根目录、媒体缓存、智能体工作区路径以及沙箱生成的文件中。
- 如果 `tools.fs.workspaceOnly` 为 `false`，出站 `MEDIA:` 可以使用智能体已被允许读取的主机本地文件。
- 主机本地发送仍然只允许媒体和安全文档类型（图片、音频、视频、PDF 和 Office 文档）。纯文本和类似密钥的文件不会被视为可发送媒体。

这意味着，当你的文件系统策略已经允许这些读取时，工作区外生成的图片/文件现在也可以发送，同时不会重新打开任意主机文本附件外泄通道。

## 运维检查清单

```bash
openclaw status          # local status (creds, sessions, queued events)
openclaw status --all    # full diagnosis (read-only, pasteable)
openclaw status --deep   # asks the gateway for a live health probe with channel probes when supported
openclaw health --json   # gateway health snapshot (WS; default can return a fresh cached snapshot)
```

日志位于 `/tmp/openclaw/` 下（默认：`openclaw-YYYY-MM-DD.log`）。

## 后续步骤

- WebChat：[WebChat](/zh-CN/web/webchat)
- Gateway 网关运维：[Gateway runbook](/zh-CN/gateway)
- Cron + 唤醒：[Cron jobs](/zh-CN/automation/cron-jobs)
- macOS 菜单栏配套应用：[OpenClaw macOS app](/zh-CN/platforms/macos)
- iOS 节点应用：[iOS app](/zh-CN/platforms/ios)
- Android 节点应用：[Android app](/zh-CN/platforms/android)
- Windows 状态：[Windows (WSL2)](/zh-CN/platforms/windows)
- Linux 状态：[Linux app](/zh-CN/platforms/linux)
- 安全：[Security](/zh-CN/gateway/security)

## 相关

- [入门指南](/zh-CN/start/getting-started)
- [设置](/zh-CN/start/setup)
- [渠道概览](/zh-CN/channels)
