---
read_when:
    - 为新的助手实例执行新手引导时
    - 审查安全性/权限影响时
summary: 将 OpenClaw 作为个人助手运行的端到端指南，并包含安全注意事项
title: 个人助手设置
x-i18n:
    generated_at: "2026-04-05T10:09:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02f10a9f7ec08f71143cbae996d91cbdaa19897a40f725d8ef524def41cf2759
    source_path: start/openclaw.md
    workflow: 15
---

# 使用 OpenClaw 构建个人助手

OpenClaw 是一个自托管 Gateway 网关，可将 Discord、Google Chat、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo 等连接到 AI 智能体。本指南介绍“个人助手”设置：一个专用的 WhatsApp 号码，行为就像你始终在线的 AI 助手。

## ⚠️ 安全第一

你正在让一个智能体处于这样的位置：

- 在你的机器上运行命令（取决于你的工具策略）
- 读取/写入你工作区中的文件
- 通过 WhatsApp/Telegram/Discord/Mattermost 和其他内置渠道向外发送消息

开始时请保守一些：

- 始终设置 `channels.whatsapp.allowFrom`（绝不要在你的个人 Mac 上以对全世界开放的方式运行）。
- 为助手使用一个专用的 WhatsApp 号码。
- Heartbeats 现在默认每 30 分钟运行一次。在你信任这套设置之前，请通过设置 `agents.defaults.heartbeat.every: "0m"` 来禁用它。

## 前提条件

- 已安装 OpenClaw 并完成新手引导 —— 如果你还没完成，请参见 [入门指南](/zh-CN/start/getting-started)
- 一个给助手使用的第二个电话号码（SIM/eSIM/预付费都可以）

## 双手机设置（推荐）

你需要的是这个：

```mermaid
flowchart TB
    A["<b>你的手机（个人）<br></b><br>你的 WhatsApp<br>+1-555-YOU"] -- message --> B["<b>第二部手机（助手）<br></b><br>助手 WA<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>你的 Mac（openclaw）<br></b><br>AI 智能体"]
```

如果你把个人 WhatsApp 连接到 OpenClaw，那么发给你的每条消息都会变成“智能体输入”。这通常不是你想要的。

## 5 分钟快速开始

1. 配对 WhatsApp Web（会显示 QR 码；用助手手机扫描）：

```bash
openclaw channels login
```

2. 启动 Gateway 网关（保持它持续运行）：

```bash
openclaw gateway --port 18789
```

3. 在 `~/.openclaw/openclaw.json` 中写入最小配置：

```json5
{
  gateway: { mode: "local" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

现在，从已加入 allowlist 的手机向助手号码发送消息。

当新手引导完成后，我们会自动打开 dashboard 并打印一个干净的（不带令牌的）链接。如果它提示需要认证，请将已配置的共享密钥粘贴到控制 UI 设置中。新手引导默认使用令牌（`gateway.auth.token`），但如果你把 `gateway.auth.mode` 切换为 `password`，也可以使用密码认证。之后如需重新打开：`openclaw dashboard`。

## 给智能体一个工作区（AGENTS）

OpenClaw 会从其工作区目录中读取操作说明和“记忆”。

默认情况下，OpenClaw 使用 `~/.openclaw/workspace` 作为智能体工作区，并会在设置/首次运行智能体时自动创建它（以及初始的 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`）。`BOOTSTRAP.md` 只会在工作区全新创建时生成（你删除后它不应再次出现）。`MEMORY.md` 是可选的（不会自动创建）；存在时，会在普通会话中加载它。子智能体会话只会注入 `AGENTS.md` 和 `TOOLS.md`。

提示：把这个文件夹视为 OpenClaw 的“记忆”，并把它做成一个 git 仓库（最好是私有仓库），这样你的 `AGENTS.md` 和记忆文件就能得到备份。如果安装了 git，全新的工作区会自动初始化。

```bash
openclaw setup
```

完整的工作区布局和备份指南：[智能体工作区](/zh-CN/concepts/agent-workspace)
记忆工作流：[记忆](/zh-CN/concepts/memory)

可选：通过 `agents.defaults.workspace` 选择不同的工作区（支持 `~`）。

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

如果你已经通过某个仓库提供了自己的工作区文件，可以完全禁用 bootstrap 文件创建：

```json5
{
  agent: {
    skipBootstrap: true,
  },
}
```

## 将它变成“一个助手”的配置

OpenClaw 默认提供了较好的助手设置，但你通常仍会希望调整：

- [`SOUL.md`](/zh-CN/concepts/soul) 中的人设/指令
- thinking 默认值（如有需要）
- heartbeats（在你信任它之后）

示例：

```json5
{
  logging: { level: "info" },
  agent: {
    model: "anthropic/claude-opus-4-6",
    workspace: "~/.openclaw/workspace",
    thinkingDefault: "high",
    timeoutSeconds: 1800,
    // 从 0 开始；稍后再启用。
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
- 会话元数据（token 用量、上一条路由等）：`~/.openclaw/agents/<agentId>/sessions/sessions.json`（旧版位置：`~/.openclaw/sessions/sessions.json`）
- `/new` 或 `/reset` 会为该聊天启动一个新会话（可通过 `resetTriggers` 配置）。如果单独发送，智能体会回复一条简短问候，以确认重置成功。
- `/compact [instructions]` 会压缩会话上下文，并报告剩余上下文预算。

## Heartbeats（主动模式）

默认情况下，OpenClaw 每 30 分钟运行一次 heartbeat，提示词为：
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
设置 `agents.defaults.heartbeat.every: "0m"` 可禁用它。

- 如果 `HEARTBEAT.md` 存在，但实际上是空的（仅包含空行和诸如 `# Heading` 之类的 Markdown 标题），OpenClaw 会跳过该次 heartbeat，以节省 API 调用。
- 如果文件缺失，heartbeat 仍会运行，并由模型决定要做什么。
- 如果智能体回复 `HEARTBEAT_OK`（可带少量填充内容；参见 `agents.defaults.heartbeat.ackMaxChars`），OpenClaw 会抑制该次 heartbeat 的对外投递。
- 默认允许将 heartbeat 投递到私信风格的 `user:<id>` 目标。设置 `agents.defaults.heartbeat.directPolicy: "block"` 可在保持 heartbeat 运行的同时抑制对直接目标的投递。
- Heartbeats 会运行完整的智能体回合 —— 间隔越短，消耗的 token 越多。

```json5
{
  agent: {
    heartbeat: { every: "30m" },
  },
}
```

## 媒体输入与输出

输入附件（图片/音频/文档）可以通过模板暴露给你的命令：

- `{{MediaPath}}`（本地临时文件路径）
- `{{MediaUrl}}`（伪 URL）
- `{{Transcript}}`（如果启用了音频转录）

智能体输出附件：在单独一行中包含 `MEDIA:<path-or-url>`（不要有空格）。示例：

```
Here’s the screenshot.
MEDIA:https://example.com/screenshot.png
```

OpenClaw 会提取这些内容，并将其作为媒体与文本一同发送。

本地路径行为遵循与智能体相同的文件读取信任模型：

- 如果 `tools.fs.workspaceOnly` 为 `true`，则输出 `MEDIA:` 的本地路径仍限制在 OpenClaw 临时根目录、媒体缓存、智能体工作区路径以及沙箱生成的文件中。
- 如果 `tools.fs.workspaceOnly` 为 `false`，则输出 `MEDIA:` 可以使用智能体本就被允许读取的宿主机本地文件。
- 宿主机本地发送仍只允许媒体和安全文档类型（图片、音频、视频、PDF 和 Office 文档）。纯文本和类似密钥的文件不会被视为可发送媒体。

这意味着，当你的 fs 策略已允许这些读取时，工作区之外生成的图片/文件现在也可以发送，而不会重新打开任意宿主机文本附件外泄的风险。

## 运维检查清单

```bash
openclaw status          # 本地状态（凭证、会话、排队事件）
openclaw status --all    # 完整诊断（只读，适合粘贴）
openclaw status --deep   # 请求 gateway 执行实时健康探测，并在支持时包含渠道探测
openclaw health --json   # gateway 健康快照（WS；默认可返回最新缓存快照）
```

日志位于 `/tmp/openclaw/` 下（默认：`openclaw-YYYY-MM-DD.log`）。

## 后续步骤

- WebChat：[WebChat](/web/webchat)
- Gateway 网关运维：[Gateway 网关运行手册](/zh-CN/gateway)
- Cron + 唤醒：[Cron 作业](/zh-CN/automation/cron-jobs)
- macOS 菜单栏配套应用：[OpenClaw macOS 应用](/zh-CN/platforms/macos)
- iOS 节点应用：[iOS 应用](/zh-CN/platforms/ios)
- Android 节点应用：[Android 应用](/zh-CN/platforms/android)
- Windows 状态：[Windows（WSL2）](/zh-CN/platforms/windows)
- Linux 状态：[Linux 应用](/zh-CN/platforms/linux)
- 安全：[Security](/zh-CN/gateway/security)
