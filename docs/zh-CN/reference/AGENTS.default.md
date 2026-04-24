---
read_when:
    - 开始新的 OpenClaw 智能体会话
    - 启用或审计默认 Skills
summary: 个人助理设置的默认 OpenClaw 智能体指令与 Skills 清单
title: 默认 AGENTS.md
x-i18n:
    generated_at: "2026-04-24T04:06:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1ce4e8bd84ca8913dc30112fd2d7ec81782c1f84f62eb8cc5c1032e9b060da
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

3. 可选：如果你想使用个人助理 Skills 清单，请用此文件替换 AGENTS.md：

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. 可选：通过设置 `agents.defaults.workspace` 选择不同的工作区（支持 `~`）：

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 安全默认值

- 不要将目录或密钥转储到聊天中。
- 除非被明确要求，否则不要运行破坏性命令。
- 不要向外部消息表面发送部分/流式回复（只发送最终回复）。

## 会话开始（必需）

- 读取 `SOUL.md`、`USER.md`，以及 `memory/` 中今天和昨天的内容。
- 如果存在，也读取 `MEMORY.md`。
- 在回复前完成这些操作。

## Soul（必需）

- `SOUL.md` 定义身份、语气和边界。请保持其最新。
- 如果你更改了 `SOUL.md`，告诉用户。
- 你在每个会话中都是一个全新实例；连续性存储在这些文件中。

## 共享空间（推荐）

- 你不是用户的代言人；在群聊或公共渠道中要谨慎。
- 不要分享私人数据、联系信息或内部笔记。

## 记忆系统（推荐）

- 每日日志：`memory/YYYY-MM-DD.md`（如有需要请创建 `memory/`）。
- 长期记忆：`MEMORY.md` 用于保存持久事实、偏好和决策。
- 小写的 `memory.md` 仅用于旧版修复输入；不要有意同时保留这两个根文件。
- 在会话开始时，读取今天 + 昨天 + `MEMORY.md`（如果存在）。
- 记录内容：决策、偏好、约束、未完成事项。
- 除非被明确要求，否则避免记录密钥。

## 工具与 Skills

- 工具存在于 Skills 中；当你需要某个 skill 时，请遵循其 `SKILL.md`。
- 将环境相关说明保存在 `TOOLS.md` 中（Notes for Skills）。

## 备份提示（推荐）

如果你将此工作区视为 Clawd 的“记忆”，请将其设为 git 仓库（最好为私有），这样 `AGENTS.md` 和你的记忆文件就能备份。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# 可选：添加私有远程仓库并推送
```

## OpenClaw 的作用

- 运行 WhatsApp Gateway 网关 + Pi 编码智能体，使助理能够读取/写入聊天、获取上下文，并通过宿主 Mac 运行 Skills。
- macOS 应用负责管理权限（屏幕录制、通知、麦克风），并通过其内置二进制文件暴露 `openclaw` CLI。
- 默认情况下，私聊会折叠到智能体的 `main` 会话中；群组会保持隔离为 `agent:<agentId>:<channel>:group:<id>`（房间/渠道：`agent:<agentId>:<channel>:channel:<id>`）；心跳会让后台任务保持存活。

## 核心 Skills（在设置 → Skills 中启用）

- **mcporter** — 用于管理外部 skill 后端的工具服务器运行时/CLI。
- **Peekaboo** — 快速 macOS 截图，可选 AI 视觉分析。
- **camsnap** — 从 RTSP/ONVIF 安防摄像头采集帧、片段或运动提醒。
- **oracle** — 兼容 OpenAI 的智能体 CLI，支持会话重放和浏览器控制。
- **eightctl** — 通过终端控制你的睡眠。
- **imsg** — 发送、读取、流式处理 iMessage 与短信。
- **wacli** — WhatsApp CLI：同步、搜索、发送。
- **discord** — Discord 操作：反应、贴纸、投票。使用 `user:<id>` 或 `channel:<id>` 目标（裸数字 id 含义不明确）。
- **gog** — Google Suite CLI：Gmail、Calendar、Drive、Contacts。
- **spotify-player** — 终端 Spotify 客户端，用于搜索/加入队列/控制播放。
- **sag** — ElevenLabs 语音，提供 mac 风格的 say 体验；默认流式输出到扬声器。
- **Sonos CLI** — 通过脚本控制 Sonos 扬声器（发现/状态/播放/音量/分组）。
- **blucli** — 通过脚本播放、分组和自动化 BluOS 播放器。
- **OpenHue CLI** — 用于场景和自动化的 Philips Hue 灯光控制。
- **OpenAI Whisper** — 用于快速听写和语音信箱转录的本地语音转文本。
- **Gemini CLI** — 通过终端使用 Google Gemini 模型进行快速问答。
- **agent-tools** — 用于自动化和辅助脚本的实用工具包。

## 使用说明

- 优先使用 `openclaw` CLI 进行脚本编写；mac 应用负责处理权限。
- 从 Skills 标签页运行安装；如果二进制文件已存在，它会隐藏按钮。
- 保持启用心跳，这样助理才能安排提醒、监控收件箱并触发摄像头采集。
- Canvas UI 以全屏模式运行并带有原生覆盖层。避免将关键控件放在左上/右上/底部边缘；在布局中添加明确的边距，不要依赖安全区域 inset。
- 对于浏览器驱动的验证，请使用 `openclaw browser`（tabs/status/screenshot），并配合 OpenClaw 管理的 Chrome profile。
- 对于 DOM 检查，请使用 `openclaw browser eval|query|dom|snapshot`（在需要机器输出时加上 `--json`/`--out`）。
- 对于交互，请使用 `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run`（click/type 需要 snapshot 引用；对 CSS 选择器请使用 `evaluate`）。

## 相关内容

- [智能体工作区](/zh-CN/concepts/agent-workspace)
- [智能体运行时](/zh-CN/concepts/agent)
