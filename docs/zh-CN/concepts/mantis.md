---
read_when:
    - 为 OpenClaw 缺陷构建或运行实时视觉 QA
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输协议场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是用于在实时传输协议上复现 OpenClaw 缺陷、捕获前后证据，并将工件附加到 PR 的可视化端到端验证系统。
title: Mantis
x-i18n:
    generated_at: "2026-05-05T06:28:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: c84a09037d1edab88548eeb35a2d1b4066741511297423fe6c6fff656b95c27a
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 端到端验证系统，适用于需要真实
运行时、真实传输协议和可见证明的错误。它会针对一个已知有问题的
ref 运行场景，捕获证据，再针对候选 ref 运行同一场景，并将比较结果
发布为工件，维护者可以从 PR 或本地命令检查这些工件。

Mantis 从 Discord 开始，因为 Discord 为我们提供了高价值的第一条验证通道：
真实 bot 凭证、真实服务器渠道、reaction、thread、原生命令，以及一个
浏览器 UI，让人可以直观确认传输协议显示了什么。

## 目标

- 使用与用户看到的相同传输协议形态，复现 GitHub issue 或 PR 中的错误。
- 在应用修复之前，在基线 ref 上捕获一个**修复前**工件。
- 在应用修复之后，在候选 ref 上捕获一个**修复后**工件。
- 尽可能使用确定性的判定器，例如 Discord REST reaction 读取或渠道转录检查。
- 当错误有可见 UI 表面时捕获截图。
- 从智能体控制的 CLI 在本地运行，并从 GitHub 远程运行。
- 当登录、浏览器自动化或提供商凭证卡住时，保留足够的机器状态以便 VNC 救援。
- 当运行被阻塞、需要手动 VNC 帮助或完成时，向 operator Discord 渠道发布简洁 Status。

## 非目标

- Mantis 不是单元测试的替代品。Mantis 运行通常应在修复被理解后变成更小的回归测试。
- Mantis 不是常规的快速 CI 门禁。它更慢，会使用实时凭据，并且保留给实时环境重要的错误。
- Mantis 的正常运行不应需要人参与。手动 VNC 是救援路径，不是理想路径。
- Mantis 不会在工件、日志、截图、Markdown 报告或 PR 评论中存储原始密钥。

## 所有权

Mantis 位于 OpenClaw QA 栈中。

- OpenClaw 拥有场景运行时、传输协议适配器、证据 schema，以及 `pnpm openclaw qa mantis` 下的本地 CLI。
- QA Lab 拥有实时传输协议 harness 组件、浏览器捕获 helper 和工件写入器。
- 需要远程 VM 时，Crabbox 拥有预热的 Linux 机器。
- GitHub Actions 拥有远程工作流入口点和工件保留。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、派发工作流，以及发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体通过 Codex 驱动 Mantis。

这个边界将传输协议知识保留在 OpenClaw 中，将机器调度保留在
Crabbox 中，并将维护者工作流粘合逻辑保留在 ClawSweeper 中。

## 命令形态

第一个本地命令会验证 Discord bot、服务器、渠道、消息发送、
reaction 发送和工件路径：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本地修复前和修复后 runner 接受这种形态：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner 会在输出目录下创建分离的基线和候选 worktree，安装依赖，构建每个
ref，使用 `--allow-failures` 运行场景，然后写入 `baseline/`、`candidate/`、`comparison.json`
和 `mantis-report.md`。对于第一个 Discord 场景，成功验证意味着基线 Status 为
`fail`，候选 Status 为 `pass`。

第一个 VM/浏览器原语是桌面 smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它会租用或复用 Crabbox 桌面机器，在 VNC 会话内启动一个可见浏览器，
捕获桌面，将工件拉回本地输出目录，并把重新连接命令写入报告。该命令默认使用
Hetzner 提供商，因为它是 Mantis lane 中第一个具备可工作桌面/VNC 覆盖的提供商。
对其他 Crabbox fleet 运行时，可以用 `--provider`、`--crabbox-bin` 或
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆盖它。

有用的桌面 smoke 标志：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 会复用预热的桌面。
- `--browser-url <url>` 会更改可见浏览器中打开的页面。
- `--html-file <path>` 会在可见浏览器中渲染仓库本地 HTML 工件。Mantis 使用它通过真实 Crabbox 桌面捕获生成的 Discord Status reaction 时间线。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 会让新创建且通过的租约保持打开，以便 VNC 检查。失败运行在创建了租约时默认会保留租约，以便 operator 重新连接。
- `--class`、`--idle-timeout` 和 `--ttl` 会调节机器规格和租约生命周期。

第一个完整桌面传输协议原语是 Slack 桌面 smoke：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它会租用或复用 Crabbox 桌面机器，将当前 checkout 同步到
VM，在该 VM 内运行 `pnpm openclaw qa slack`，在 VNC
浏览器中打开 Slack Web，捕获可见桌面，并把 Slack QA 工件和
VNC 截图复制回本地输出目录。这是第一个 SUT OpenClaw Gateway 网关
和浏览器都位于同一台 Linux 桌面 VM 内的 Mantis 形态。

使用 `--gateway-setup` 时，该命令会在 `$HOME/.openclaw-mantis/slack-openclaw`
准备一个持久的一次性 OpenClaw home，为选定渠道 patch Slack Socket Mode
配置，在端口 `38973` 上启动 `openclaw gateway run`，并让 Chrome
在 VNC 会话中保持运行。这是“给我留一台带有 Slack 和正在运行的 claw 的
Linux 桌面”模式；省略 `--gateway-setup` 时，bot-to-bot Slack QA lane
仍是默认模式。

`--credential-source env` 的必需输入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 远程模型 lane 使用 `OPENCLAW_LIVE_OPENAI_KEY`。如果本地只设置了
  `OPENAI_API_KEY`，Mantis 会在调用 Crabbox 之前把它映射到
  `OPENCLAW_LIVE_OPENAI_KEY`，这样 Crabbox 的 `OPENCLAW_*` 环境变量转发可以将它带入
  VM。

有用的 Slack 桌面标志：

- `--lease-id <cbx_...>` 会在 operator 已经通过 VNC 登录 Slack Web 的机器上重新运行。
- `--gateway-setup` 会在 VM 中启动持久 OpenClaw Slack Gateway 网关，而不是只运行 bot-to-bot QA lane。
- `--slack-url <url>` 会打开特定 Slack Web URL。未提供时，如果 SUT bot token 可用，Mantis 会从 Slack `auth.test` 派生 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 控制 Gateway 网关设置使用的 Slack 渠道 allowlist。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 内的持久 Chrome profile。默认值为 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手动 Slack Web 登录会在同一租约的重新运行中保留。
- `--credential-source convex --credential-role ci` 使用共享凭据池，而不是直接 Slack 环境变量 token。
- `--provider-mode`、`--model`、`--alt-model` 和 `--fast` 会透传到 Slack live lane。

GitHub smoke 工作流是 `Mantis Discord Smoke`。第一个真实场景的修复前和修复后
GitHub 工作流是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期会复现 queued-only 行为的 ref。
- `candidate_ref`：预期会显示 `queued -> thinking -> done` 的 ref。

它会 checkout 工作流 harness ref，构建独立的基线和候选 worktree，
针对每个 worktree 运行 `discord-status-reactions-tool-only`，并将
`baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md`
作为 Actions 工件上传。它还会在 Crabbox 桌面浏览器中渲染每个 lane
的时间线 HTML，并在 PR 评论中把这些 VNC 截图与确定性的时间线 PNG
一起发布。同一条 PR 评论会嵌入由 VNC 桌面录制生成的轻量动画 GIF
预览，并链接到完整桌面 MP4 文件，同时截图保持内联显示以便快速审阅。
该工作流会从 `openclaw/crabbox` main 构建 Crabbox CLI，因此它可以在下一个
Crabbox 二进制发布完成之前使用当前桌面/浏览器租约标志。

你也可以直接从 PR 评论触发 Status reaction 运行：

```text
@Mantis discord status reactions
```

评论触发器刻意保持狭窄。它只会在具有 write、maintain 或 admin 权限的用户发布的
pull request 评论上运行，并且只识别 Discord Status reaction 请求。默认情况下，
它使用已知有问题的基线 ref 和当前 PR head SHA 作为候选。维护者可以覆盖任一
ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一个命令是显式且聚焦场景的。第二个命令之后可以根据标签、变更文件和
ClawSweeper review 发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭据。
2. 分配或复用 VM。
3. 当场景需要 UI 证据时，准备桌面/浏览器 profile。
4. 为基线 ref 准备干净的 checkout。
5. 安装依赖，并只构建场景需要的内容。
6. 使用隔离的状态目录启动子 OpenClaw Gateway 网关。
7. 配置实时传输协议、提供商、模型和浏览器 profile。
8. 运行场景并捕获基线证据。
9. 停止 Gateway 网关并保留日志。
10. 在同一台 VM 中准备候选 ref。
11. 运行同一场景并捕获候选证据。
12. 比较判定器结果和视觉证据。
13. 写入 Markdown、JSON、日志、截图和可选 trace 工件。
14. 上传 GitHub Actions 工件。
15. 发布简洁的 PR 或 Discord Status 消息。

场景应能够以两种不同方式失败：

- **错误已复现**：基线以预期方式失败。
- **Harness 失败**：环境设置、凭据、Discord API、浏览器或提供商在错误判定器有意义之前失败。

最终报告必须区分这些情况，这样维护者就不会把不稳定环境误认为产品行为。

## Discord MVP

第一个场景应面向服务器渠道中的 Discord Status reaction，其中源回复投递模式为
`message_tool_only`。

它适合作为 Mantis 起点的原因：

- 它在 Discord 中显示为触发消息上的 reaction。
- 它通过 Discord 消息 reaction 状态提供强 REST 判定器。
- 它会覆盖真实 OpenClaw Gateway 网关、Discord bot 凭证、消息派发、
  源回复投递模式、Status reaction 状态和模型轮次生命周期。
- 它足够狭窄，能让第一版实现保持可靠。

预期场景形态：

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

基线证据应显示 queued acknowledgement reaction，但在 tool-only 模式下没有
生命周期转换。候选证据应显示当 `messages.statusReactions.enabled` 显式为
true 时，生命周期 Status reaction 正在运行。

第一个可执行切片是 opt-in Discord live QA 场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

它会将 SUT 配置为始终启用 guild 处理、`visibleReplies:
"message_tool"`、`ackReaction: "👀"`，并配置显式状态反应。oracle
会轮询真实的 Discord 触发消息，并期望观察到的序列为
`👀 -> 🤔 -> 👍`。制品包括 `discord-qa-reaction-timelines.json`、
`discord-status-reactions-tool-only-timeline.html` 和
`discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应基于现有私有 QA 栈构建，而不是从零开始：

- `pnpm openclaw qa discord` 已经运行带有驱动 bot 和 SUT bot 的实时 Discord 车道。
- 实时传输协议运行器已经会在 `.artifacts/qa-e2e/` 下写入报告和已观察消息制品。
- Convex 凭证租约已经为共享实时传输协议凭证提供独占访问。
- 浏览器控制服务已经支持截图、快照、无头托管配置文件和远程 CDP 配置文件。
- QA Lab 已经具备面向传输协议形态测试的调试器 UI 和总线。

第一个 Mantis 实现可以是在这些组件之上的一个轻量前后对比运行器，再加上一层视觉证据。

## 证据模型

每次运行都会写入一个稳定的制品目录：

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` 应该是机器可读的事实来源。Markdown 报告用于 PR 评论和人工审查。

摘要必须包含：

- 被测试的 refs 和 SHA
- 传输协议和场景 id
- 机器提供商以及机器 id 或租约 id
- 不含密钥值的凭证来源
- 基线结果
- 候选结果
- bug 是否在基线上复现
- 候选是否修复了它
- 制品路径
- 已清理的设置或清理问题

截图是证据，不是密钥。它们仍然需要遵守脱敏纪律：
可能会出现私有渠道名称、用户名或消息内容。对于公开 PR，
在脱敏方案更完善之前，优先使用 GitHub Actions 制品链接，而不是内联图片。

## 浏览器和 VNC

浏览器车道有两种模式：

- **无头自动化**：CI 默认模式。Chrome 以启用 CDP 的方式运行，
  Playwright 或 OpenClaw 浏览器控制会捕获截图。
- **VNC 救援**：当登录、MFA、Discord 反自动化或视觉调试需要人工介入时，在同一台 VM 上启用。

Discord 观察者浏览器配置文件应足够持久，以避免每次运行都登录，
但要与个人浏览器状态隔离。配置文件属于 Mantis 机器池，而不是开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord 状态消息，其中包含：

- 运行 id
- 场景 id
- 机器提供商
- 制品目录
- VNC 或 noVNC 连接说明（如果可用）
- 简短阻塞原因文本

第一个私有部署可以将这些消息发布到现有操作员渠道，之后再迁移到专用 Mantis 渠道。

## 机器

第一个远程实现中，Mantis 应优先通过 Crabbox 使用 AWS。
Crabbox 为我们提供预热机器、租约跟踪、注水、日志、结果和
清理。如果 AWS 容量太慢或不可用，则在同一机器接口后添加 Hetzner 提供商。

最低 VM 要求：

- Linux，安装支持桌面的 Chrome 或 Chromium
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够的 CPU 和内存，可运行一个 OpenClaw Gateway 网关、一个浏览器和一次模型运行
- 可出站访问 Discord、GitHub、模型提供商和凭证代理

VM 不应在预期凭证或浏览器配置文件存储之外保留长期原始密钥。

## 密钥

远程运行的密钥存放在 GitHub 组织或仓库密钥中，本地运行的密钥存放在
由本地操作员控制的密钥文件中。

推荐的密钥名称：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` 用于公开 GitHub 制品上传
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

长期来看，Convex 凭证池应继续作为实时传输协议凭证的正常来源。GitHub 密钥用于引导代理和回退车道。
Discord 状态反应工作流会把 Mantis Crabbox 密钥映射回 Crabbox CLI 期望的
`CRABBOX_COORDINATOR` 和 `CRABBOX_COORDINATOR_TOKEN` 环境变量。
普通的 `CRABBOX_*` GitHub 密钥名称仍作为兼容性回退被接受。

Mantis 运行器绝不能打印：

- Discord bot token
- 提供商 API key
- 浏览器 cookie
- auth profile 内容
- VNC 密码
- 原始凭证载荷

公开制品上传还应脱敏 Discord 目标元数据，例如 bot、guild、渠道和消息 id。
GitHub 冒烟工作流因此启用了
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 被意外粘贴到 issue、PR、聊天或日志中，在新密钥存储后轮换它。

## GitHub 制品和 PR 评论

Mantis 工作流应将完整证据包作为短期 Actions 制品上传。当工作流针对 bug 报告或修复 PR 运行时，
它还应将脱敏后的 PNG 截图发布到 `qa-artifacts` 分支，并在该 bug 或修复 PR 上 upsert 一条评论，
内联展示前后截图。不要只把主要证据发布到通用 QA 自动化 PR 上。原始日志、已观察消息和其他大体积证据保留在 Actions 制品中。

生产工作流应使用 Mantis GitHub App 发布这些评论，而不是使用 `github-actions[bot]`。
将 app id 和私钥作为 `MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions
密钥存储。工作流使用隐藏标记作为 upsert key，在 token 能编辑时更新该评论，并在较旧的 bot 所有标记无法编辑时创建新的 Mantis 所有评论。

PR 评论应简短且可视化：

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

当运行失败是因为 harness 失败时，评论必须说明这一点，而不是暗示候选失败。

## 私有部署说明

私有部署可能已经有一个 Mantis Discord 应用。只要它具备正确的 bot 权限并且可以安全轮换，
就复用该应用，而不是再创建另一个 app。

通过密钥或部署配置设置初始操作员通知渠道。它可以先指向现有维护者或运维渠道，
等专用 Mantis 渠道存在后再迁移过去。

不要把 guild id、渠道 id、bot token、浏览器 cookie 或 VNC 密码放进本文档。
将它们存放在 GitHub 密钥、凭证代理或操作员的本地密钥存储中。

## 添加场景

Mantis 场景应声明：

- id 和标题
- 传输协议
- 所需凭证
- 基线 ref 策略
- 候选 ref 策略
- OpenClaw 配置补丁
- 设置步骤
- 刺激
- 预期基线 oracle
- 预期候选 oracle
- 视觉捕获目标
- 超时预算
- 清理步骤

场景应优先使用小型、带类型的 oracle：

- 用于反应 bug 的 Discord 反应状态
- 用于线程 bug 的 Discord 消息引用
- 用于 Slack bug 的 Slack 线程 ts 和反应 API 状态
- 用于 email bug 的 email 消息 id 和标头
- 当 UI 是唯一可靠可观察对象时，使用浏览器截图

视觉检查应是增量补充。如果平台 API 能证明 bug，则使用该 API 作为通过/失败 oracle，
并保留截图用于增强人工信心。

## 提供商扩展

在 Discord 之后，同一个运行器可以添加：

- Slack：反应、线程、app mention、modal、文件上传。
- Email：当 connector 不足时，使用 `gog` 进行 Gmail auth 和消息线程处理。
- WhatsApp：二维码登录、重新识别、消息投递、媒体、反应。
- Telegram：群组 mention gate、命令、可用时的反应。
- Matrix：加密房间、线程或回复关系、重启恢复。

每种传输协议都应有一个低成本冒烟场景和一个或多个 bug 类场景。昂贵的视觉场景应保持为选择性启用。

## 待解决问题

- 复用现有 Mantis bot 时，哪个 Discord bot 应作为驱动，哪个应作为 SUT？
- 观察者浏览器登录在第一阶段应使用真人 Discord 账号、测试账号，还是仅使用 bot 可读 REST 证据？
- GitHub 应为 PR 保留 Mantis 制品多久？
- ClawSweeper 应在什么时候自动推荐 Mantis，而不是等待维护者命令？
- 公开 PR 上传前，截图是否应脱敏或裁剪？
