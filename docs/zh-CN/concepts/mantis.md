---
read_when:
    - 为 OpenClaw 缺陷构建或运行实时视觉 QA
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 调试需要屏幕截图、浏览器自动化或 VNC 访问权限的 QA 运行
summary: Mantis 是一个可视化端到端验证系统，用于在真实传输协议上复现 OpenClaw bug、捕获前后对比证据，并将工件附加到拉取请求。
title: Mantis
x-i18n:
    generated_at: "2026-05-05T05:35:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26a9671135e38bf82d3627364f691f8d91cc8649ffc2e5fa782ebef474a44fa1
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 端到端验证系统，用于需要真实
运行时、真实传输协议和可见证据的 bug。它会针对已知
问题 ref 运行场景，捕获证据，再针对候选 ref 运行同一场景，并将
对比结果发布为工件，维护者可从 PR 或本地命令中检查。

Mantis 从 Discord 开始，因为 Discord 为我们提供了一条高价值的首条通道：
真实 bot 凭证、真实公会频道、回应、话题、原生命令，以及一个
浏览器 UI，让人类可以直观确认传输协议所展示的内容。

## 目标

- 使用用户看到的同一传输协议形态，从 GitHub issue 或 PR 中复现 bug。
- 在应用修复之前，基于基线 ref 捕获 **before** 工件。
- 在应用修复之后，基于候选 ref 捕获 **after** 工件。
- 尽可能使用确定性判定器，例如 Discord REST 回应读取或频道转录检查。
- 当 bug 有可见 UI 表面时捕获截图。
- 从智能体控制的 CLI 在本地运行，也可从 GitHub 远程运行。
- 当登录、浏览器自动化或提供商凭证卡住时，保留足够的机器状态用于 VNC 救援。
- 当运行被阻塞、需要手动 VNC 帮助或完成时，向操作员 Discord 频道发布简洁 Status。

## 非目标

- Mantis 不是单元测试的替代品。理解修复后，Mantis 运行通常应转化为更小的回归测试。
- Mantis 不是常规快速 CI gate。它更慢，使用实时凭证，并且只保留给实时环境重要的 bug。
- Mantis 的正常运行不应需要人类参与。手动 VNC 是救援路径，而不是理想路径。
- Mantis 不会在工件、日志、截图、Markdown 报告或 PR 评论中存储原始密钥。

## 所有权

Mantis 位于 OpenClaw QA 栈中。

- OpenClaw 拥有场景运行时、传输协议适配器、证据 schema，以及 `pnpm openclaw qa mantis` 下的本地 CLI。
- QA Lab 拥有实时传输协议 harness 部件、浏览器捕获辅助工具和工件写入器。
- 当需要远程 VM 时，Crabbox 拥有预热的 Linux 机器。
- GitHub Actions 拥有远程 workflow 入口点和工件保留。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、分发 workflow，并发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体会通过 Codex 驱动 Mantis。

这个边界将传输协议知识保留在 OpenClaw，将机器调度保留在
Crabbox，并将维护者 workflow 胶水保留在 ClawSweeper。

## 命令形式

第一个本地命令会验证 Discord bot、公会、频道、消息发送、
回应发送和工件路径：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本地 before 和 after 运行器接受这种形式：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

运行器会在输出目录下创建分离的基线和候选 worktree，安装依赖，
构建每个 ref，使用 `--allow-failures` 运行场景，然后写入 `baseline/`、
`candidate/`、`comparison.json` 和 `mantis-report.md`。对于第一个 Discord
场景，成功验证意味着基线 Status 为 `fail`，候选 Status 为 `pass`。

第一个 VM/browser 原语是桌面 smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它会租用或复用 Crabbox 桌面机器，在 VNC 会话中启动可见浏览器，
捕获桌面，将工件拉回本地输出目录，并把重新连接命令写入报告。
该命令默认使用 Hetzner 提供商，因为它是 Mantis 通道中第一个拥有可用桌面/VNC 覆盖的提供商。针对另一个 Crabbox fleet 运行时，可用 `--provider`、`--crabbox-bin` 或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆盖它。

有用的桌面 smoke 标志：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 会复用预热的桌面。
- `--browser-url <url>` 会更改可见浏览器中打开的页面。
- `--html-file <path>` 会在可见浏览器中渲染仓库本地 HTML 工件。Mantis 使用它通过真实 Crabbox 桌面捕获生成的 Discord Status 回应时间线。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 会让新建且通过的租约保持打开，以便 VNC 检查。失败运行在创建了租约时默认保留租约，以便操作员可以重新连接。
- `--class`、`--idle-timeout` 和 `--ttl` 会调整机器大小和租约生命周期。

第一个完整桌面传输协议原语是 Slack 桌面 smoke：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它会租用或复用 Crabbox 桌面机器，将当前 checkout 同步到
VM，在该 VM 中运行 `pnpm openclaw qa slack`，在 VNC 浏览器中打开 Slack Web，
捕获可见桌面，并将 Slack QA 工件和 VNC 截图复制回本地输出目录。这是第一个 Mantis 形式，其中 SUT OpenClaw Gateway 网关和浏览器都位于同一个 Linux 桌面 VM 内。

使用 `--gateway-setup` 时，该命令会在 `$HOME/.openclaw-mantis/slack-openclaw` 准备一个持久的一次性 OpenClaw home，为所选频道修补 Slack Socket Mode 配置，在端口 `38973` 上启动 `openclaw gateway run`，并让 Chrome 在 VNC 会话中保持运行。这是“给我留下一个运行着 Slack 和 claw 的 Linux 桌面”模式；省略 `--gateway-setup` 时，bot 到 bot 的 Slack QA 通道仍是默认模式。

`--credential-source env` 的必需输入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 远程模型通道需要 `OPENCLAW_LIVE_OPENAI_KEY`。如果本地只设置了
  `OPENAI_API_KEY`，Mantis 会在调用 Crabbox 之前将其映射到 `OPENCLAW_LIVE_OPENAI_KEY`，
  这样 Crabbox 的 `OPENCLAW_*` 环境变量转发就能把它带入 VM。

有用的 Slack 桌面标志：

- `--lease-id <cbx_...>` 会在操作员已通过 VNC 登录 Slack Web 的机器上重新运行。
- `--gateway-setup` 会在 VM 中启动一个持久的 OpenClaw Slack Gateway 网关，而不是只运行 bot 到 bot 的 QA 通道。
- `--slack-url <url>` 会打开特定 Slack Web URL。没有它时，如果 SUT bot token 可用，Mantis 会根据 Slack `auth.test` 推导 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 会控制 Gateway 网关设置使用的 Slack 频道 allowlist。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 会控制 VM 内的持久 Chrome profile。默认值是 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手动 Slack Web 登录会在同一租约上的重新运行中保留。
- `--credential-source convex --credential-role ci` 会使用共享凭证池，而不是直接使用 Slack 环境变量 token。
- `--provider-mode`、`--model`、`--alt-model` 和 `--fast` 会透传到 Slack 实时通道。

GitHub smoke workflow 是 `Mantis Discord Smoke`。第一个真实场景的 before 和 after GitHub
workflow 是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期复现仅 queued 行为的 ref。
- `candidate_ref`：预期显示 `queued -> thinking -> done` 的 ref。

它会 checkout workflow harness ref，构建独立的基线和候选
worktree，在每个 worktree 上运行 `discord-status-reactions-tool-only`，并将
`baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 作为
Actions 工件上传。它还会在 Crabbox 桌面浏览器中渲染每条通道的时间线 HTML，
并在 PR 评论中将这些 VNC 截图发布在确定性时间线 PNG 旁边。同一 PR 评论会链接到
VNC 浏览器渲染期间捕获的桌面 MP4 录制，而截图会保持内联以便快速查看。该 workflow 会从
`openclaw/crabbox` main 构建 Crabbox CLI，以便在下一个 Crabbox 二进制版本发布前使用当前的桌面/浏览器租约标志。

你也可以直接从 PR 评论触发 Status 回应运行：

```text
@Mantis discord status reactions
```

评论触发器故意保持范围很窄。它只会对具有 write、maintain 或 admin 访问权限的用户在 pull request
评论中的请求运行，并且只识别 Discord Status 回应请求。默认情况下，它使用已知问题基线 ref，并将当前 PR head SHA 作为候选。维护者可以覆盖任一
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
ClawSweeper 审查发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭证。
2. 分配或复用 VM。
3. 当场景需要 UI 证据时，准备桌面/浏览器 profile。
4. 为基线 ref 准备干净 checkout。
5. 安装依赖，并只构建场景需要的内容。
6. 使用隔离状态目录启动子 OpenClaw Gateway 网关。
7. 配置实时传输协议、提供商、模型和浏览器 profile。
8. 运行场景并捕获基线证据。
9. 停止 Gateway 网关并保留日志。
10. 在同一 VM 中准备候选 ref。
11. 运行同一场景并捕获候选证据。
12. 比较判定器结果和视觉证据。
13. 写入 Markdown、JSON、日志、截图和可选 trace 工件。
14. 上传 GitHub Actions 工件。
15. 发布简洁的 PR 或 Discord Status 消息。

场景应能以两种不同方式失败：

- **Bug 已复现**：基线以预期方式失败。
- **Harness 失败**：环境设置、凭证、Discord API、浏览器或
  提供商在 bug 判定器有意义之前失败。

最终报告必须区分这些情况，以便维护者不会把不稳定环境与产品行为混淆。

## Discord MVP

第一个场景应针对公会频道中的 Discord Status 回应，其中
源回复投递模式为 `message_tool_only`。

为什么它是一个好的 Mantis 起点：

- 它在 Discord 中表现为触发消息上的回应，可见。
- 它通过 Discord 消息回应状态拥有强 REST 判定器。
- 它覆盖真实 OpenClaw Gateway 网关、Discord bot 凭证、消息分发、
  源回复投递模式、Status 回应状态和模型轮次生命周期。
- 它足够窄，可以让第一个实现保持诚实。

预期场景形式：

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

基线证据应显示 queued 确认回应，但在 tool-only 模式下没有
生命周期转换。候选证据应显示在 `messages.statusReactions.enabled` 明确为
true 时，生命周期 Status 回应正在运行。

第一个可执行切片是 opt-in Discord 实时 QA 场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

它会为被测系统（SUT）配置始终开启的 guild 处理、`visibleReplies:
"message_tool"`、`ackReaction: "👀"` 和显式状态反应。预言机会轮询真实的 Discord 触发消息，并期望观察到的序列为 `👀 -> 🤔 -> 👍`。工件包括 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应基于现有私有 QA 栈构建，而不是从零开始：

- `pnpm openclaw qa discord` 已经运行带有 driver 和 SUT 机器人的实时 Discord 通道。
- 实时传输运行器已经会在 `.artifacts/qa-e2e/` 下写入报告和已观察消息工件。
- Convex 凭证租约已经为共享实时传输凭证提供独占访问。
- 浏览器控制服务已经支持截图、快照、headless 托管配置文件和远程 CDP 配置文件。
- QA Lab 已经有用于传输形态测试的调试器 UI 和总线。

第一个 Mantis 实现可以是在这些组件之上的一个薄 before/after 运行器，再加一层视觉证据。

## 证据模型

每次运行都会写入一个稳定的工件目录：

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

摘要必须包括：

- 已测试的 refs 和 SHAs
- 传输和场景 ID
- 机器提供商以及机器 ID 或租约 ID
- 不含 secret 值的凭证来源
- baseline 结果
- candidate 结果
- baseline 上是否复现了 bug
- candidate 是否修复了它
- 工件路径
- 已清理的设置或清理问题

截图是证据，不是 secret。它们仍然需要遵守脱敏规范：可能会出现私有频道名称、用户名或消息内容。对于公开 PR，在脱敏方案更完善之前，优先使用 GitHub Actions 工件链接，而不是内联图片。

## 浏览器和 VNC

浏览器通道有两种模式：

- **Headless 自动化**：CI 的默认模式。Chrome 启用 CDP 运行，Playwright 或 OpenClaw 浏览器控制会捕获截图。
- **VNC 救援**：在登录、MFA、Discord 反自动化或视觉调试需要人工介入时，在同一台 VM 上启用。

Discord 观察者浏览器配置文件应该足够持久，以避免每次运行都登录，但应与个人浏览器状态隔离。配置文件属于 Mantis 机器池，而不是开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord 状态消息，包含：

- 运行 ID
- 场景 ID
- 机器提供商
- 工件目录
- VNC 或 noVNC 连接说明（如果可用）
- 简短的阻塞说明

第一个私有部署可以把这些消息发布到现有操作员频道，之后再迁移到专用 Mantis 频道。

## 机器

Mantis 的第一个远程实现应优先通过 Crabbox 使用 AWS。Crabbox 为我们提供预热机器、租约跟踪、水合、日志、结果和清理。如果 AWS 容量太慢或不可用，则在相同机器接口后添加 Hetzner 提供商。

最低 VM 要求：

- Linux，并安装支持桌面的 Chrome 或 Chromium
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够的 CPU 和内存，可运行一个 OpenClaw Gateway 网关、一个浏览器和一次模型运行
- 能访问 Discord、GitHub、模型提供商和凭证代理的出站网络

VM 不应在预期凭证或浏览器配置文件存储之外保留长期原始 secret。

## Secrets

远程运行的 secrets 存放在 GitHub 组织或仓库 secrets 中，本地运行的 secrets 存放在由本地操作员控制的 secret 文件中。

推荐的 secret 名称：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`，用于公开 GitHub 工件上传
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

长期来看，Convex 凭证池应继续作为实时传输凭证的常规来源。GitHub secrets 用于引导代理和 fallback 通道。Discord 状态反应工作流会把 Mantis Crabbox secrets 映射回 Crabbox CLI 预期的 `CRABBOX_COORDINATOR` 和 `CRABBOX_COORDINATOR_TOKEN` 环境变量。普通的 `CRABBOX_*` GitHub secret 名称仍作为兼容 fallback 被接受。

Mantis 运行器绝不能打印：

- Discord 机器人 tokens
- 提供商 API keys
- 浏览器 cookies
- auth profile 内容
- VNC 密码
- 原始凭证 payloads

公开工件上传还应脱敏 Discord 目标元数据，例如 bot、guild、channel 和 message ids。GitHub smoke 工作流会为此启用 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 被意外粘贴到 issue、PR、聊天或日志中，请在新的 secret 存储后轮换它。

## GitHub 工件和 PR 评论

Mantis 工作流应将完整证据包作为短期 Actions 工件上传。当工作流为 bug report 或 fix PR 运行时，它还应将脱敏后的 PNG 截图发布到 `qa-artifacts` 分支，并在该 bug 或 fix PR 上 upsert 一条带有内联 before/after 截图的评论。不要只在通用 QA 自动化 PR 上发布主要证明。原始日志、已观察消息和其他大体积证据保留在 Actions 工件中。

生产工作流应使用 Mantis GitHub App 发布这些评论，而不是使用 `github-actions[bot]`。将 app ID 和私钥分别作为 `MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions secrets 存储。工作流使用隐藏 marker 作为 upsert key；当 token 可以编辑时更新该评论；当较旧的 bot-owned marker 无法编辑时，创建一条新的 Mantis-owned 评论。

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

当运行因为 harness 失败而失败时，评论必须说明这一点，而不是暗示 candidate 失败。

## 私有部署说明

私有部署可能已经有一个 Mantis Discord 应用。当该应用拥有正确的 bot 权限且可以安全轮换时，请复用它，而不是创建另一个 app。

通过 secrets 或部署配置设置初始操作员通知频道。它可以先指向现有维护者或运维频道，等专用 Mantis 频道存在后再迁移过去。

不要把 guild ids、channel ids、bot tokens、浏览器 cookies 或 VNC 密码放入本文档。将它们存储在 GitHub secrets、凭证代理或操作员的本地 secret store 中。

## 添加场景

Mantis 场景应声明：

- ID 和标题
- 传输
- 所需凭证
- baseline ref 策略
- candidate ref 策略
- OpenClaw 配置补丁
- 设置步骤
- 刺激
- 预期 baseline 预言机
- 预期 candidate 预言机
- 视觉捕获目标
- 超时预算
- 清理步骤

场景应优先使用小型、带类型的预言机：

- 用于反应 bug 的 Discord 反应状态
- 用于线程 bug 的 Discord 消息引用
- 用于 Slack bug 的 Slack thread ts 和 reaction API 状态
- 用于 email bug 的 email message ids 和 headers
- 当 UI 是唯一可靠可观察对象时，使用浏览器截图

视觉检查应是附加的。如果平台 API 可以证明 bug，请使用 API 作为 pass/fail 预言机，并保留截图以增强人工信心。

## 提供商扩展

Discord 之后，同一个运行器可以添加：

- Slack：reactions、threads、app mentions、modals、file uploads。
- Email：在 connectors 不足时，使用 `gog` 进行 Gmail auth 和 message threading。
- WhatsApp：QR login、re-identification、message delivery、media、reactions。
- Telegram：group mention gating、commands、可用时的 reactions。
- Matrix：encrypted rooms、thread 或 reply relations、restart resume。

每种传输都应有一个低成本 smoke 场景，以及一个或多个 bug 类场景。昂贵的视觉场景应保持 opt-in。

## 待解决问题

- 复用现有 Mantis bot 时，哪个 Discord bot 应作为 driver，哪个应作为 SUT？
- 观察者浏览器登录在第一阶段应使用真人 Discord 账号、测试账号，还是仅使用 bot-readable REST 证据？
- GitHub 应为 PR 保留 Mantis 工件多久？
- ClawSweeper 应在什么时候自动推荐 Mantis，而不是等待维护者命令？
- 公开 PR 上传前，截图是否应脱敏或裁剪？
