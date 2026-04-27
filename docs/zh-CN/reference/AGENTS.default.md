---
read_when:
    - 开始新的 OpenClaw 智能体会话
    - 启用或审计默认 Skills
summary: 个人助理设置的默认 OpenClaw 智能体指令和 Skills 名单
title: 默认 AGENTS.md
x-i18n:
    generated_at: "2026-04-27T07:12:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 839368a09c60ac6b7cd403e6ecd86dd0cafd01de8c8b70a1d919cf7daf6d51af
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - OpenClaw 个人助理（默认）

## 首次运行（推荐）

OpenClaw 为智能体使用专用工作区目录。默认值：`~/.openclaw/workspace`（可通过 `agents.defaults.workspace` 配置）。

1. 创建工作区（如果尚不存在）：

```bash
mkdir -p ~/.openclaw/workspace
```

2. 将默认工作区模板复制到工作区中：

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. 可选：如果你想使用个人助理的 Skills 名单，请用此文件替换 AGENTS.md：

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. 可选：通过设置 `agents.defaults.workspace` 选择不同的工作区（支持 `~`）：

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 默认安全设置

- 不要将目录内容或密钥转储到聊天中。
- 除非被明确要求，否则不要运行破坏性命令。
- 不要向外部消息渠道发送部分 / 流式回复（只发送最终回复）。

## 会话开始（必需）

- 读取 `SOUL.md`、`USER.md`，以及 `memory/` 中今天和昨天的内容。
- 如果存在，也要读取 `MEMORY.md`。
- 在回复之前完成这些操作。

## Soul（必需）

- `SOUL.md` 定义身份、语气和边界。请保持其为最新状态。
- 如果你更改了 `SOUL.md`，请告诉用户。
- 你在每次会话中都是一个全新的实例；连续性保存在这些文件中。

## 共享空间（推荐）

- 你不是用户本人的声音；在群聊或公共渠道中要谨慎。
- 不要分享私密数据、联系信息或内部笔记。

## 记忆系统（推荐）

- 每日日志：`memory/YYYY-MM-DD.md`（如有需要请创建 `memory/`）。
- 长期记忆：`MEMORY.md`，用于保存持久事实、偏好和决定。
- 小写的 `memory.md` 仅用于旧版修复输入；不要有意同时保留这两个根目录文件。
- 在会话开始时，读取今天 + 昨天 + `MEMORY.md`（如果存在）。
- 记录：决定、偏好、约束、未完成事项。
- 除非被明确要求，否则避免记录密钥。

## 工具与 Skills

- 工具存在于 Skills 中；当你需要时，请遵循每个 skill 的 `SKILL.md`。
- 将特定于环境的说明保存在 `TOOLS.md` 中（Skills 说明）。

## 备份提示（推荐）

如果你将此工作区视为 Clawd 的“记忆”，请将其设为一个 git 仓库（最好是私有仓库），以便备份 `AGENTS.md` 和你的记忆文件。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## OpenClaw 的作用

- 运行 WhatsApp Gateway 网关 + Pi 编码智能体，使助手能够读写聊天、获取上下文，并通过主机 Mac 运行 Skills。
- macOS 应用负责管理权限（屏幕录制、通知、麦克风），并通过其内置二进制文件提供 `openclaw` CLI。
- 默认情况下，私聊会合并到智能体的 `main` 会话中；群组会保持隔离，作为 `agent:<agentId>:<channel>:group:<id>`（房间 / 渠道：`agent:<agentId>:<channel>:channel:<id>`）；心跳会保持后台任务存活。

## 核心 Skills（在 设置 → Skills 中启用）

- **mcporter** — 用于管理外部技能后端的工具服务器运行时 / CLI。
- **Peekaboo** — 快速进行 macOS 截图，并可选使用 AI 视觉分析。
- **camsnap** — 从 RTSP / ONVIF 安防摄像头捕获帧、片段或运动提醒。
- **oracle** — 兼容 OpenAI 的智能体 CLI，支持会话回放和浏览器控制。
- **eightctl** — 从终端控制你的睡眠。
- **imsg** — 发送、读取、流式处理 iMessage 和短信。
- **wacli** — WhatsApp CLI：同步、搜索、发送。
- **discord** — Discord 操作：回应、贴纸、投票。使用 `user:<id>` 或 `channel:<id>` 作为目标（裸数字 id 有歧义）。
- **gog** — Google Suite CLI：Gmail、Calendar、Drive、Contacts。
- **spotify-player** — 终端 Spotify 客户端，用于搜索 / 加入队列 / 控制播放。
- **sag** — ElevenLabs 语音，具有 mac 风格的 say 体验；默认流式输出到扬声器。
- **Sonos CLI** — 从脚本中控制 Sonos 扬声器（发现 / 状态 / 播放 / 音量 / 分组）。
- **blucli** — 从脚本中播放、分组和自动化 BluOS 播放器。
- **OpenHue CLI** — Philips Hue 灯光控制，用于场景和自动化。
- **OpenAI Whisper** — 本地语音转文本，用于快速听写和语音信箱转录。
- **Gemini CLI** — 在终端中使用 Google Gemini 模型进行快速问答。
- **agent-tools** — 用于自动化和辅助脚本的工具集。

## 使用说明

- 优先使用 `openclaw` CLI 进行脚本编写；mac 应用会处理权限。
- 从 Skills 标签页运行安装；如果二进制文件已存在，它会隐藏该按钮。
- 保持心跳启用，以便助手可以安排提醒、监控收件箱并触发摄像头捕获。
- Canvas UI 以全屏方式运行，并带有原生覆盖层。避免将关键控件放在左上 / 右上 / 底部边缘；请在布局中添加明确边距，不要依赖安全区域内边距。
- 对于浏览器驱动的验证，请使用 `openclaw browser`（tabs / status / screenshot），并配合 OpenClaw 管理的 Chrome 配置文件。
- 对于 DOM 检查，请使用 `openclaw browser eval|query|dom|snapshot`（当你需要机器可读输出时使用 `--json` / `--out`）。
- 对于交互，请使用 `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run`（click / type 需要 snapshot refs；CSS 选择器请使用 `evaluate`）。

## 相关内容

- [智能体工作区](/zh-CN/concepts/agent-workspace)
- [智能体运行时](/zh-CN/concepts/agent)
