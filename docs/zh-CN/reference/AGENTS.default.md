---
read_when:
    - 启动新的 OpenClaw 智能体会话
    - 启用或审计默认 Skills
summary: 个人助理设置的默认 OpenClaw 智能体指令和技能名单
title: 默认 AGENTS.md
x-i18n:
    generated_at: "2026-07-05T11:39:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 645342f8c6e2805135817cf4bbc2c8bd1d57066054ed671eda93876b2762ffb1
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## 首次运行（推荐）

OpenClaw 智能体使用一个工作区目录。默认：`~/.openclaw/workspace`（可通过 `agents.defaults.workspace` 配置，支持 `~`）。

1. 创建工作区：

```bash
mkdir -p ~/.openclaw/workspace
```

2. 将默认工作区模板复制进去：

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. 可选：使用此文件的个人助理 Skills 名单，而不是通用模板：

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. 可选：指向不同的工作区：

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 安全默认设置

- 不要将目录或密钥倾倒到聊天中。
- 除非明确要求，否则不要运行破坏性命令。
- 在更改配置或调度器（crontab、systemd 单元、nginx 配置、shell rc 文件）之前，先检查现有状态，并默认保留/合并。
- 不要向外部消息界面发送部分/流式回复（只发送最终回复）。

## 现有解决方案预检

在提议或构建自定义系统、功能、工作流、工具、集成或自动化之前，检查是否有开源项目、维护中的库、现有 OpenClaw 插件或免费平台已经足够好地解决该问题。适用时优先使用它们。仅当现有选项不合适、太贵、无人维护、不安全、不合规，或用户明确要求自定义时，才构建自定义方案。除非用户明确批准支出，否则避免推荐付费服务。保持轻量级，把它作为预检关口，而不是研究任务。

## 会话启动（必需）

- 回复前读取 `SOUL.md`、`USER.md`，以及 `memory/` 中今天和昨天的记录。
- 如果存在 `MEMORY.md`，也要读取。

## Soul（必需）

- `SOUL.md` 定义身份、语气和边界。保持它为最新。
- 如果你更改 `SOUL.md`，告诉用户。
- 每个会话中你都是一个全新实例；连续性存在于这些文件中。

## 共享空间（推荐）

- 你不是用户的声音；在群聊或公共渠道中要谨慎。
- 不要分享私人数据、联系信息或内部备注。

## 记忆系统（推荐）

- 每日日志：`memory/YYYY-MM-DD.md`（需要时创建 `memory/`）。
- 长期记忆：`MEMORY.md`，用于持久事实、偏好和决定。
- 小写 `memory.md` 仅作为旧版修复输入；不要有意同时保留两个根文件。
- 会话启动时，在存在时读取今天 + 昨天 + `MEMORY.md`。
- 写入记忆文件前，先读取它们；只写入具体更新，绝不写空占位符。
- 捕获：决定、偏好、约束、未闭环事项。
- 除非明确要求，否则避免密钥。

## 工具和 Skills

- 工具位于 Skills 中；需要某个 Skill 时，遵循其 `SKILL.md`。
- 将环境特定备注保存在 `TOOLS.md`（Skills 的备注）。

## 备份提示（推荐）

将此工作区视为助理的记忆：把它做成一个 git 仓库（最好是私有仓库），这样 `AGENTS.md` 和记忆文件都会有备份。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add workspace"
# Optional: add a private remote + push
```

## OpenClaw 做什么

- 运行消息渠道 Gateway 网关（WhatsApp、Telegram、Discord、Signal、iMessage、Slack 等）以及一个嵌入式智能体，让助理能够读写聊天、获取上下文，并通过宿主机运行 Skills。
- macOS 应用管理权限（屏幕录制、通知、麦克风），并通过其内置二进制文件暴露 `openclaw` CLI。
- 默认情况下，直接聊天会折叠到智能体的 `main` 会话中；群组和渠道/房间会获得自己的会话键。确切的键格式见[渠道路由](/zh-CN/channels/channel-routing)。Heartbeat 会保持后台任务存活。

## 核心 Skills（在设置 → Skills 中启用）

个人助理工作区的示例名单；可换成适合你设置的任意 Skills。

- **mcporter** - 用于管理外部 Skill 后端的工具服务器运行时/CLI。
- **Peekaboo** - 快速 macOS 截图，可选 AI 视觉分析。
- **camsnap** - 从 RTSP/ONVIF 安防摄像头捕获帧、片段或运动警报。
- **oracle** - 支持会话回放和浏览器控制的 OpenAI 就绪智能体 CLI。
- **eightctl** - 从终端控制你的睡眠。
- **imsg** - 发送、读取、流式传输 iMessage 和 SMS。
- **wacli** - WhatsApp CLI：同步、搜索、发送。
- **discord** - Discord 操作：回应、贴纸、投票。使用 `user:<id>` 或 `channel:<id>` 目标（裸数字 id 有歧义）。
- **gog** - Google Suite CLI：Gmail、Calendar、Drive、Contacts。
- **spotify-player** - 终端 Spotify 客户端，用于搜索/排队/控制播放。
- **sag** - ElevenLabs 语音，提供 mac 风格的 say 用户体验；默认流式传输到扬声器。
- **Sonos CLI** - 从脚本控制 Sonos 扬声器（发现/状态/播放/音量/分组）。
- **blucli** - 从脚本播放、分组并自动化 BluOS 播放器。
- **OpenHue CLI** - 用于场景和自动化的 Philips Hue 灯光控制。
- **OpenAI Whisper** - 本地语音转文本，用于快速听写和语音信箱转录。
- **Gemini CLI** - 从终端使用 Google Gemini 模型进行快速问答。
- **agent-tools** - 用于自动化和辅助脚本的实用工具包。

## 使用说明

- 脚本编写优先使用 `openclaw` CLI；桌面应用会处理权限。
- 从 Skills 选项卡运行安装；当所需二进制文件已存在时，安装按钮会隐藏。
- 保持 Heartbeat 启用，这样助理可以安排提醒、监控收件箱并触发摄像头捕获。
- Canvas UI 以全屏运行，并带有原生叠加层。避免将关键控件放在左上/右上/底部边缘；添加明确的布局边距，而不是依赖安全区域插入。
- 对于浏览器驱动的验证，使用 `openclaw browser` CLI（内置 `browser` 插件），并使用 OpenClaw 管理的 Chrome/Brave/Edge/Chromium 配置文件。
- 管理：`status`、`doctor [--deep]`、`start [--headless]`、`stop`、`tabs`、`tab [new|select|close]`、`open <url>`、`focus <id>`、`close <id>`。
- 检查：`screenshot [--full-page|--ref|--labels]`、`snapshot [--format ai|aria|--interactive|--efficient]`、`console`、`errors`、`requests`、`pdf`、`responsebody`。
- 操作：`navigate`、`click <ref>`、`type <ref> <text>`、`press`、`hover`、`drag`、`select`、`upload`、`download`、`fill`、`dialog`、`wait`、`evaluate --fn <js>`、`highlight`。操作需要来自 `snapshot` 的 `ref`（操作不接受 CSS 选择器）；需要 `document.querySelector` 风格的目标选择时，使用 `evaluate`。
- 对任何检查命令添加 `--json`，可获得机器可读输出。

## 相关

- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [Agent 运行时](/zh-CN/concepts/agent)
- [渠道路由](/zh-CN/channels/channel-routing)
