---
read_when:
    - 启动新的 OpenClaw 智能体会话
    - 启用或审计默认 Skills
summary: 个人助理设置的默认 OpenClaw 智能体指令和 Skills 名单
title: 默认 AGENTS.md
x-i18n:
    generated_at: "2026-05-05T23:38:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55be14855a0cd2bd90081bd16d26e3322cd00392e96b9222a9b14c60c7d7aafe
    source_path: reference/AGENTS.default.md
    workflow: 16
---

# AGENTS.md - OpenClaw 个人助理（默认）

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

3. 可选：如果你想使用个人助理 Skills 名册，请用此文件替换 AGENTS.md：

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. 可选：通过设置 `agents.defaults.workspace` 选择不同的工作区（支持 `~`）：

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 安全默认设置

- 不要把目录或密钥转储到聊天中。
- 除非明确要求，否则不要运行破坏性命令。
- 不要向外部消息界面发送部分/流式回复（仅发送最终回复）。

## 会话开始（必需）

- 读取 `SOUL.md`、`USER.md`，以及 `memory/` 中今天和昨天的内容。
- 存在 `MEMORY.md` 时读取它。
- 在响应之前完成这些操作。

## 灵魂（必需）

- `SOUL.md` 定义身份、语气和边界。保持它为最新状态。
- 如果你更改了 `SOUL.md`，请告知用户。
- 每个会话中你都是一个全新实例；连续性保存在这些文件中。

## 共享空间（推荐）

- 你不是用户本人的声音；在群聊或公开渠道中要谨慎。
- 不要共享私人数据、联系方式或内部备注。

## 记忆系统（推荐）

- 每日日志：`memory/YYYY-MM-DD.md`（需要时创建 `memory/`）。
- 长期记忆：`MEMORY.md`，用于保存持久事实、偏好和决策。
- 小写 `memory.md` 仅作为旧版修复输入；不要有意同时保留两个根文件。
- 会话开始时，读取今天 + 昨天 + 存在时的 `MEMORY.md`。
- 捕获：决策、偏好、约束、未闭环事项。
- 除非明确请求，否则避免记录密钥。

## 工具和 Skills

- 工具存在于 Skills 中；需要某个 Skill 时，请遵循其 `SKILL.md`。
- 将环境特定备注保存在 `TOOLS.md`（Skills 备注）中。

## 备份提示（推荐）

如果你把此工作区视为 Clawd 的“记忆”，请将它设为 git 仓库（最好是私有仓库），以便备份 `AGENTS.md` 和你的记忆文件。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## OpenClaw 做什么

- 运行 WhatsApp 网关 + Pi 编码智能体，使助理可以读写聊天、获取上下文，并通过宿主 Mac 运行 Skills。
- macOS 应用管理权限（屏幕录制、通知、麦克风），并通过其内置二进制文件暴露 `openclaw` CLI。
- 默认情况下，直接聊天会折叠进智能体的 `main` 会话；群组保持隔离，形式为 `agent:<agentId>:<channel>:group:<id>`（房间/频道：`agent:<agentId>:<channel>:channel:<id>`）；Heartbeat 会让后台任务保持运行。

## 核心 Skills（在设置 → Skills 中启用）

- **mcporter** — 用于管理外部 Skill 后端的工具服务器运行时/CLI。
- **Peekaboo** — 快速 macOS 截图，支持可选 AI 视觉分析。
- **camsnap** — 从 RTSP/ONVIF 安防摄像头捕获帧、片段或运动提醒。
- **oracle** — 支持会话回放和浏览器控制的 OpenAI-ready 智能体 CLI。
- **eightctl** — 从终端控制你的睡眠。
- **imsg** — 发送、读取、流式传输 iMessage 和 SMS。
- **wacli** — WhatsApp CLI：同步、搜索、发送。
- **discord** — Discord 操作：反应、贴纸、投票。使用 `user:<id>` 或 `channel:<id>` 目标（裸数字 ID 存在歧义）。
- **gog** — Google Suite CLI：Gmail、Calendar、Drive、Contacts。
- **spotify-player** — 终端 Spotify 客户端，用于搜索/排队/控制播放。
- **sag** — ElevenLabs 语音，提供 mac 风格的 say 体验；默认流式输出到扬声器。
- **Sonos CLI** — 从脚本控制 Sonos 扬声器（发现/Status/播放/音量/分组）。
- **blucli** — 从脚本播放、分组和自动化 BluOS 播放器。
- **OpenHue CLI** — 用于场景和自动化的 Philips Hue 灯光控制。
- **OpenAI Whisper** — 用于快速听写和语音邮件转写的本地语音转文本。
- **Gemini CLI** — 从终端使用 Google Gemini 模型进行快速问答。
- **agent-tools** — 用于自动化和辅助脚本的实用工具包。

## 使用备注

- 脚本编写优先使用 `openclaw` CLI；Mac 应用会处理权限。
- 从 Skills 标签页运行安装；如果二进制文件已存在，它会隐藏按钮。
- 保持 Heartbeat 启用，以便助理可以安排提醒、监控收件箱并触发摄像头捕获。
- Canvas UI 以全屏运行，并带有原生叠加层。避免将关键控件放在左上角、右上角或底部边缘；在布局中添加明确的边距，不要依赖安全区域内边距。
- 对于浏览器驱动的验证，使用 `openclaw browser`（标签页/Status/截图）配合 OpenClaw 托管的 Chrome 配置文件。
- 对于 DOM 检查，使用 `openclaw browser eval|query|dom|snapshot`（需要机器输出时使用 `--json`/`--out`）。
- 对于交互，使用 `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run`（click/type 需要快照引用；CSS 选择器请使用 `evaluate`）。

## 相关

- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [智能体运行时](/zh-CN/concepts/agent)
