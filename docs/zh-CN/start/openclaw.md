---
read_when:
    - 新手引导新的助手实例
    - 审查安全/权限影响
summary: 将 OpenClaw 作为个人助理运行的端到端指南，并包含安全注意事项
title: 个人助理设置
x-i18n:
    generated_at: "2026-06-27T03:22:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0cd640872a2a60fd88d2dc3df6d038ef8574163430d8683ef9b67921b0c87f4
    source_path: start/openclaw.md
    workflow: 16
---

OpenClaw 是一个自托管 Gateway 网关，可将 Discord、Google Chat、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo 等连接到 AI 智能体。本指南介绍“个人助手”设置：一个专用 WhatsApp 号码，像你的常驻 AI 助手一样工作。

## ⚠️ 安全第一

你正在让一个智能体处于可以执行以下操作的位置：

- 在你的机器上运行命令（取决于你的工具策略）
- 读写你的工作区文件
- 通过 WhatsApp/Telegram/Discord/Mattermost 和其他内置渠道发送消息

从保守配置开始：

- 始终设置 `channels.whatsapp.allowFrom`（绝不要在你的个人 Mac 上以向全世界开放的方式运行）。
- 为助手使用专用 WhatsApp 号码。
- Heartbeat 现在默认每 30 分钟运行一次。在你信任该设置之前，请通过设置 `agents.defaults.heartbeat.every: "0m"` 将其禁用。

## 前提条件

- 已安装并完成 OpenClaw 新手引导；如果你还没完成，请参阅[入门指南](/zh-CN/start/getting-started)
- 为助手准备第二个电话号码（SIM/eSIM/预付费）

## 双手机设置（推荐）

你需要的是：

```mermaid
flowchart TB
    A["<b>Your Phone (personal)<br></b><br>Your WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Second Phone (assistant)<br></b><br>Assistant WA<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Your Mac (openclaw)<br></b><br>AI agent"]
```

如果你把个人 WhatsApp 连接到 OpenClaw，发给你的每条消息都会变成“智能体输入”。这通常不是你想要的。

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

现在，从你的允许列表手机向助手号码发送消息。

新手引导完成后，OpenClaw 会自动打开仪表板，并打印一个干净的（不带令牌的）链接。如果仪表板提示认证，请将配置的共享密钥粘贴到 Control UI 设置中。新手引导默认使用令牌（`gateway.auth.token`），但如果你已将 `gateway.auth.mode` 切换为 `password`，也可以使用密码认证。稍后重新打开：`openclaw dashboard`。

## 为智能体提供工作区（AGENTS）

OpenClaw 会从其工作区目录读取操作说明和“记忆”。

默认情况下，OpenClaw 使用 `~/.openclaw/workspace` 作为 Agent 工作区，并会在设置或首次智能体运行时自动创建它（以及初始的 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`）。`BOOTSTRAP.md` 只会在工作区全新时创建（删除后不应再次出现）。`MEMORY.md` 是可选的（不会自动创建）；存在时，会在普通会话中加载。子智能体会话只注入 `AGENTS.md` 和 `TOOLS.md`。

<Tip>
把这个文件夹当作 OpenClaw 的记忆，并把它做成 git 仓库（最好是私有仓库），这样你的 `AGENTS.md` 和记忆文件就有备份。如果已安装 git，全新的工作区会自动初始化。
</Tip>

```bash
openclaw setup
```

完整工作区布局 + 备份指南：[Agent 工作区](/zh-CN/concepts/agent-workspace)
记忆工作流：[记忆](/zh-CN/concepts/memory)

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

如果你已经从仓库交付自己的工作区文件，可以完全禁用引导文件创建：

```json5
{
  agents: {
    defaults: {
      skipBootstrap: true,
    },
  },
}
```

## 将其变成“助手”的配置

OpenClaw 默认提供了良好的助手设置，但你通常会想调整：

- [`SOUL.md`](/zh-CN/concepts/soul) 中的人设/指令
- 思考默认值（如果需要）
- Heartbeat（在你信任它之后）

示例：

```json5
{
  logging: { level: "info" },
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      workspace: "~/.openclaw/workspace",
      thinkingDefault: "high",
      timeoutSeconds: 1800,
      // Start with 0; enable later.
      heartbeat: { every: "0m" },
    },
    list: [
      {
        id: "main",
        default: true,
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
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

## 会话和记忆

- 会话文件：`~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- 会话元数据（令牌用量、上次路由等）：`~/.openclaw/agents/<agentId>/sessions/sessions.json`（旧版：`~/.openclaw/sessions/sessions.json`）
- `/new` 或 `/reset` 会为该聊天启动一个全新会话（可通过 `resetTriggers` 配置）。如果单独发送，OpenClaw 会确认重置，而不会调用模型。
- `/compact [instructions]` 会压缩会话上下文，并报告剩余上下文预算。

## Heartbeat（主动模式）

默认情况下，OpenClaw 每 30 分钟运行一次 Heartbeat，提示词为：
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
设置 `agents.defaults.heartbeat.every: "0m"` 可禁用。

- 如果 `HEARTBEAT.md` 存在但实际上为空（只有空行、Markdown/HTML 注释、类似 `# Heading` 的 Markdown 标题、围栏标记或空的检查清单占位），OpenClaw 会跳过 Heartbeat 运行以节省 API 调用。
- 如果文件缺失，Heartbeat 仍会运行，并由模型决定要做什么。
- 如果智能体回复 `HEARTBEAT_OK`（可带短填充；见 `agents.defaults.heartbeat.ackMaxChars`），OpenClaw 会抑制该 Heartbeat 的出站投递。
- 默认情况下，允许向私信风格的 `user:<id>` 目标投递 Heartbeat。设置 `agents.defaults.heartbeat.directPolicy: "block"` 可在保持 Heartbeat 运行活跃的同时抑制直接目标投递。
- Heartbeat 会运行完整智能体轮次；更短的间隔会消耗更多令牌。

```json5
{
  agents: {
    defaults: {
      heartbeat: { every: "30m" },
    },
  },
}
```

## 媒体输入和输出

入站附件（图像/音频/文档）可通过模板暴露给你的命令：

- `{{MediaPath}}`（本地临时文件路径）
- `{{MediaUrl}}`（伪 URL）
- `{{Transcript}}`（如果启用了音频转录）

来自智能体的出站附件使用消息工具或回复载荷上的结构化媒体字段，例如 `media`、`mediaUrl`、`mediaUrls`、`path` 或 `filePath`。示例消息工具参数：

```json
{
  "message": "Here's the screenshot.",
  "mediaUrl": "https://example.com/screenshot.png"
}
```

OpenClaw 会将结构化媒体与文本一起发送。旧版最终助手回复仍可能为兼容性而规范化，但工具输出、浏览器输出、流式传输块和消息操作不会把文本解析为附件命令。

本地路径行为遵循与智能体相同的文件读取信任模型：

- 如果 `tools.fs.workspaceOnly` 为 `true`，出站本地媒体路径会限制在 OpenClaw 临时根目录、媒体缓存、Agent 工作区路径和沙箱生成的文件内。
- 如果 `tools.fs.workspaceOnly` 为 `false`，出站本地媒体可以使用智能体已获准读取的主机本地文件。
- 本地路径可以是绝对路径、工作区相对路径，或带 `~/` 的主目录相对路径。
- 主机本地发送仍然只允许媒体和安全文档类型（图像、音频、视频、PDF、Office 文档，以及经过验证的文本文件，例如 Markdown/MD、TXT、JSON、YAML 和 YML）。这是对现有主机读取信任边界的扩展，而不是秘密扫描器：如果智能体可以读取主机本地的 `secret.txt` 或 `config.json`，并且扩展名与内容验证匹配，它就可以附加该文件。

这意味着，当你的 fs 策略已经允许这些读取时，工作区外生成的图像/文件现在也可以发送，而任意主机本地文本扩展名仍会被阻止。请将敏感文件放在智能体可读取的文件系统之外，或保持 `tools.fs.workspaceOnly=true` 以使用更严格的本地路径发送。

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
- Windows Hub：[Windows](/zh-CN/platforms/windows)
- Linux 状态：[Linux app](/zh-CN/platforms/linux)
- 安全：[Security](/zh-CN/gateway/security)

## 相关

- [入门指南](/zh-CN/start/getting-started)
- [设置](/zh-CN/start/setup)
- [渠道概览](/zh-CN/channels)
