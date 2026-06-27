---
read_when:
    - 启动新的 OpenClaw 智能体会话
    - 启用或审计默认 Skills
summary: 个人助手设置的默认 OpenClaw 智能体指令和 Skills 名单
title: 默认 AGENTS.md
x-i18n:
    generated_at: "2026-06-27T03:12:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6af0d9e5bb250fe91dda6ad31b7e0b169d94d4e7c19c2fc0943b816b4599ec26
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## 首次运行（推荐）

OpenClaw 为智能体使用专用工作区目录。默认值：`~/.openclaw/workspace`（可通过 `agents.defaults.workspace` 配置）。

1. 创建工作区（如果尚不存在）：

```bash
mkdir -p ~/.openclaw/workspace
```

2. 将默认工作区模板复制到工作区：

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. 可选：如果你想使用个人助手 Skills 名单，请用此文件替换 AGENTS.md：

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. 可选：通过设置 `agents.defaults.workspace` 选择其他工作区（支持 `~`）：

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 安全默认值

- 不要把目录内容或密钥倾倒到聊天中。
- 除非明确要求，否则不要运行破坏性命令。
- 在更改配置或调度器（例如 crontab、systemd 单元、nginx 配置或 shell rc 文件）之前，先检查现有状态，并默认保留/合并。
- 不要向外部消息界面发送部分/流式回复（只发送最终回复）。

## 现有方案预检

在提议或构建自定义系统、功能、工作流、工具、集成或自动化之前，先简要检查是否已有开源项目、维护良好的库、现有 OpenClaw 插件或免费平台能足够好地解决问题。合适时优先使用这些方案。只有当现有选项不适用、过于昂贵、无人维护、不安全、不合规，或用户明确要求自定义时，才构建自定义方案。除非用户明确批准支出，否则避免推荐付费服务。保持轻量：这是预检门槛，不是广泛的研究任务。

## 会话开始（必需）

- 读取 `SOUL.md`、`USER.md`，以及 `memory/` 中今天和昨天的内容。
- 如果存在，读取 `MEMORY.md`。
- 在回复前完成这些操作。

## 灵魂（必需）

- `SOUL.md` 定义身份、语气和边界。保持其最新。
- 如果你更改了 `SOUL.md`，请告知用户。
- 每个会话中你都是一个全新实例；连续性存放在这些文件中。

## 共享空间（推荐）

- 你不是用户的代言人；在群聊或公共频道中要谨慎。
- 不要分享私人数据、联系信息或内部笔记。

## 记忆系统（推荐）

- 每日日志：`memory/YYYY-MM-DD.md`（如有需要，创建 `memory/`）。
- 长期记忆：`MEMORY.md`，用于持久事实、偏好和决策。
- 小写的 `memory.md` 仅作为旧版修复输入；不要有意同时保留两个根文件。
- 会话开始时，如果存在，读取今天 + 昨天 + `MEMORY.md`。
- 写入记忆文件前，先读取它们；只写入具体更新，绝不写空占位符。
- 捕获：决策、偏好、约束、未闭环事项。
- 除非明确要求，否则避免记录密钥。

## 工具和 Skills

- 工具存在于 Skills 中；需要使用某个 Skill 时，遵循其 `SKILL.md`。
- 将特定环境的说明保存在 `TOOLS.md`（Skills 说明）中。

## 备份提示（推荐）

如果你把这个工作区当作 Clawd 的“记忆”，请将它建成 git 仓库（最好是私有仓库），这样 `AGENTS.md` 和你的记忆文件就有备份。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## OpenClaw 做什么

- 运行 WhatsApp 网关 + 嵌入式 OpenClaw 智能体，使助手能够读取/写入聊天、获取上下文，并通过宿主 Mac 运行 Skills。
- macOS 应用管理权限（屏幕录制、通知、麦克风），并通过其内置二进制文件暴露 `openclaw` CLI。
- 默认情况下，直接聊天会折叠到智能体的 `main` 会话中；群组保持隔离，格式为 `agent:<agentId>:<channel>:group:<id>`（房间/频道：`agent:<agentId>:<channel>:channel:<id>`）；heartbeat 保持后台任务存活。

## 核心 Skills（在设置 → Skills 中启用）

- **mcporter** - 用于管理外部 Skill 后端的工具服务器运行时/CLI。
- **Peekaboo** - 快速 macOS 截图，可选 AI 视觉分析。
- **camsnap** - 从 RTSP/ONVIF 安防摄像头捕获帧、片段或运动告警。
- **oracle** - 支持会话回放和浏览器控制的 OpenAI 就绪智能体 CLI。
- **eightctl** - 从终端控制你的睡眠。
- **imsg** - 发送、读取、流式传输 iMessage 和 SMS。
- **wacli** - WhatsApp CLI：同步、搜索、发送。
- **discord** - Discord 操作：回应、贴纸、投票。使用 `user:<id>` 或 `channel:<id>` 目标（裸数字 id 有歧义）。
- **gog** - Google Suite CLI：Gmail、Calendar、Drive、Contacts。
- **spotify-player** - 终端 Spotify 客户端，用于搜索/排队/控制播放。
- **sag** - ElevenLabs 语音，具备 mac 风格的 say 体验；默认流式传输到扬声器。
- **Sonos CLI** - 通过脚本控制 Sonos 扬声器（发现/状态/播放/音量/分组）。
- **blucli** - 通过脚本播放、分组并自动化 BluOS 播放器。
- **OpenHue CLI** - 用于场景和自动化的 Philips Hue 灯光控制。
- **OpenAI Whisper** - 本地语音转文本，用于快速听写和语音邮件转录。
- **Gemini CLI** - 从终端使用 Google Gemini 模型进行快速问答。
- **agent-tools** - 用于自动化和辅助脚本的实用工具包。

## 使用说明

- 编写脚本时优先使用 `openclaw` CLI；Mac 应用会处理权限。
- 从 Skills 标签页运行安装；如果二进制文件已存在，它会隐藏按钮。
- 保持 heartbeats 启用，这样助手可以安排提醒、监控收件箱并触发摄像头捕获。
- Canvas UI 以全屏运行，并带原生叠加层。避免将关键控件放在左上、右上或底部边缘；在布局中添加明确的边距，不要依赖安全区域内边距。
- 对于浏览器驱动的验证，请使用 `openclaw browser`（标签页/状态/截图）和 OpenClaw 管理的 Chrome 配置文件。
- 对于 DOM 检查，请使用 `openclaw browser eval|query|dom|snapshot`（需要机器输出时使用 `--json`/`--out`）。
- 对于交互，请使用 `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run`（click/type 需要 snapshot 引用；CSS 选择器请使用 `evaluate`）。

## 相关

- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [智能体运行时](/zh-CN/concepts/agent)
