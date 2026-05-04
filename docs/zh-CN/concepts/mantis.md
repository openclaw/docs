---
read_when:
    - 为 OpenClaw 缺陷构建或运行实时视觉 QA
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是一种可视化端到端验证系统，用于在真实传输协议上复现 OpenClaw 缺陷、捕获修复前后的证据，并将工件附加到 PR。
title: Mantis
x-i18n:
    generated_at: "2026-05-04T02:52:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d3f3fa3db111b1b5c85f8efeccd749fbd5885cee6b7843ca4c8d049acfd9164
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 端到端验证系统，用于需要真实运行时、真实传输协议和可见证据的 bug。它会针对已知有问题的 ref 运行场景，捕获证据，再针对候选 ref 运行相同场景，并将对比结果发布为工件，维护者可以从 PR 或本地命令中检查这些工件。

Mantis 从 Discord 开始，因为 Discord 为我们提供了一条高价值的首条通道：真实 bot 凭证、真实服务器渠道、reaction、thread、原生命令，以及可供人类直观看到传输协议显示内容的浏览器 UI。

## 目标

- 使用用户看到的相同传输协议形态，复现 GitHub issue 或 PR 中的 bug。
- 在应用修复之前，在基线 ref 上捕获 **before** 工件。
- 在应用修复之后，在候选 ref 上捕获 **after** 工件。
- 尽可能使用确定性的判定器，例如 Discord REST reaction 读取或渠道 transcript 检查。
- 当 bug 有可见 UI 表面时捕获截图。
- 从智能体控制的 CLI 本地运行，并从 GitHub 远程运行。
- 当登录、浏览器自动化或提供商凭证卡住时，保留足够的机器状态用于 VNC 救援。
- 当运行被阻塞、需要人工 VNC 帮助或完成时，向 operator Discord 渠道发布简洁 Status。

## 非目标

- Mantis 不是单元测试的替代品。理解修复后，Mantis 运行通常应该转化为一个更小的回归测试。
- Mantis 不是常规的快速 CI 门禁。它更慢，会使用实时凭证，并且只用于实时环境很重要的 bug。
- Mantis 的正常操作不应该需要人工介入。手动 VNC 是救援路径，而不是正常路径。
- Mantis 不会在工件、日志、截图、Markdown 报告或 PR 评论中存储原始密钥。

## 归属范围

Mantis 位于 OpenClaw QA 栈中。

- OpenClaw 拥有场景运行时、传输协议适配器、证据 schema，以及 `pnpm openclaw qa mantis` 下的本地 CLI。
- QA Lab 拥有实时传输协议 harness 组件、浏览器捕获助手和工件写入器。
- 当需要远程 VM 时，Crabbox 拥有预热的 Linux 机器。
- GitHub Actions 拥有远程 workflow 入口点和工件保留。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、分发 workflow，并发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体通过 Codex 驱动 Mantis。

这个边界让传输协议知识保留在 OpenClaw 中，机器调度保留在 Crabbox 中，维护者 workflow 胶水保留在 ClawSweeper 中。

## 命令形态

第一个本地命令会验证 Discord bot、服务器、渠道、消息发送、reaction 发送和工件路径：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本地 before 和 after 运行器接受以下形态：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

运行器会在输出目录下创建分离的基线和候选 worktree，安装依赖，构建每个 ref，使用 `--allow-failures` 运行场景，然后写入 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md`。对于第一个 Discord 场景，成功验证意味着基线 Status 为 `fail`，候选 Status 为 `pass`。

第一个 VM/browser 原语是桌面 smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它会租用或复用 Crabbox 桌面机器，在 VNC 会话中启动可见浏览器，捕获桌面，将工件拉回本地输出目录，并把重连命令写入报告。该命令默认使用 Hetzner 提供商，因为它是 Mantis 通道中第一个具备可用桌面/VNC 覆盖的提供商。针对另一个 Crabbox 机群运行时，可用 `--provider`、`--crabbox-bin` 或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆盖。

有用的桌面 smoke 标志：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 复用已预热的桌面。
- `--browser-url <url>` 更改可见浏览器中打开的页面。
- `--html-file <path>` 在可见浏览器中渲染仓库本地 HTML 工件。Mantis 使用它通过真实 Crabbox 桌面捕获生成的 Discord status-reaction 时间线。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 会让新创建且通过的 lease 保持打开，以便 VNC 检查。失败运行在创建了 lease 时默认保留它，以便 operator 重新连接。
- `--class`、`--idle-timeout` 和 `--ttl` 调整机器规格和 lease 生命周期。

第一个完整桌面传输协议原语是 Slack 桌面 smoke：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它会租用或复用 Crabbox 桌面机器，将当前 checkout 同步到 VM 中，在该 VM 内运行 `pnpm openclaw qa slack`，在 VNC 浏览器中打开 Slack Web，捕获可见桌面，并将 Slack QA 工件和 VNC 截图都复制回本地输出目录。这是第一个 Mantis 形态，其中 SUT OpenClaw Gateway 网关和浏览器都位于同一个 Linux 桌面 VM 中。

使用 `--gateway-setup` 时，该命令会在 `$HOME/.openclaw-mantis/slack-openclaw` 准备一个持久的一次性 OpenClaw home，为选定渠道修补 Slack Socket Mode 配置，在端口 `38973` 上启动 `openclaw gateway run`，并让 Chrome 保持运行在 VNC 会话中。这是“给我留一个运行着 Slack 和 claw 的 Linux 桌面”模式；省略 `--gateway-setup` 时，bot-to-bot Slack QA 通道仍是默认模式。

`--credential-source env` 的必需输入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 远程模型通道需要 `OPENCLAW_LIVE_OPENAI_KEY`。如果本地只设置了 `OPENAI_API_KEY`，Mantis 会在调用 Crabbox 前将它映射到 `OPENCLAW_LIVE_OPENAI_KEY`，这样 Crabbox 的 `OPENCLAW_*` 环境变量转发就能把它带入 VM。

有用的 Slack 桌面标志：

- `--lease-id <cbx_...>` 针对 operator 已经通过 VNC 登录 Slack Web 的机器重新运行。
- `--gateway-setup` 在 VM 中启动持久 OpenClaw Slack Gateway 网关，而不是只运行 bot-to-bot QA 通道。
- `--slack-url <url>` 打开指定 Slack Web URL。若未提供，当 SUT bot token 可用时，Mantis 会从 Slack `auth.test` 派生 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 控制 Gateway 网关设置使用的 Slack 渠道 allowlist。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 内的持久 Chrome profile。默认值为 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手动 Slack Web 登录会在同一 lease 的重新运行中保留。
- `--credential-source convex --credential-role ci` 使用共享凭证池，而不是直接使用 Slack 环境变量 token。
- `--provider-mode`、`--model`、`--alt-model` 和 `--fast` 会透传给 Slack 实时通道。

GitHub smoke workflow 是 `Mantis Discord Smoke`。第一个真实场景的 before 和 after GitHub workflow 是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期会复现 queued-only 行为的 ref。
- `candidate_ref`：预期会显示 `queued -> thinking -> done` 的 ref。

它会 checkout workflow harness ref，构建单独的基线和候选 worktree，针对每个 worktree 运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 作为 Actions 工件上传。它还会在 Crabbox 桌面浏览器中渲染每条通道的时间线 HTML，并在 PR 评论中将这些 VNC 截图与确定性的时间线 PNG 一起发布。该 workflow 会从 `openclaw/crabbox` main 构建 Crabbox CLI，以便在下一个 Crabbox 二进制 release 发布前使用当前桌面/browser lease 标志。

你也可以直接从 PR 评论触发 status-reactions 运行：

```text
@Mantis discord status reactions
```

评论触发器刻意保持窄范围。它只会在拥有 write、maintain 或 admin 访问权限的用户发出的 pull request 评论上运行，并且只识别 Discord status-reaction 请求。默认情况下，它使用已知有问题的基线 ref 和当前 PR head SHA 作为候选。维护者可以覆盖任一 ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一个命令是显式且聚焦场景的。第二个之后可以从标签、变更文件和 ClawSweeper review 发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭证。
2. 分配或复用 VM。
3. 当场景需要 UI 证据时，准备桌面/browser profile。
4. 为基线 ref 准备干净 checkout。
5. 安装依赖，并只构建场景需要的内容。
6. 使用隔离状态目录启动子 OpenClaw Gateway 网关。
7. 配置实时传输协议、提供商、模型和 browser profile。
8. 运行场景并捕获基线证据。
9. 停止 Gateway 网关并保留日志。
10. 在同一 VM 中准备候选 ref。
11. 运行相同场景并捕获候选证据。
12. 对比判定器结果和视觉证据。
13. 写入 Markdown、JSON、日志、截图和可选 trace 工件。
14. 上传 GitHub Actions 工件。
15. 发布简洁 PR 或 Discord Status 消息。

场景应该能够以两种不同方式失败：

- **Bug 已复现**：基线以预期方式失败。
- **Harness 失败**：环境设置、凭证、Discord API、浏览器或提供商在 bug 判定器有意义之前失败。

最终报告必须区分这些情况，这样维护者就不会把不稳定环境与产品行为混淆。

## Discord MVP

第一个场景应以源回复投递模式为 `message_tool_only` 的服务器渠道中的 Discord Status reaction 为目标。

它适合作为 Mantis 种子场景的原因：

- 它在 Discord 中以触发消息上的 reaction 可见。
- 它通过 Discord 消息 reaction 状态具备强 REST 判定器。
- 它会覆盖真实 OpenClaw Gateway 网关、Discord bot 凭证、消息分发、源回复投递模式、Status reaction 状态和模型 turn 生命周期。
- 它足够窄，可以让首个实现保持诚实。

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

基线证据应显示 queued 确认 reaction，但在 tool-only 模式下没有生命周期转换。候选证据应显示当 `messages.statusReactions.enabled` 显式为 true 时，生命周期 Status reaction 会运行。

可执行的第一个切片是 opt-in Discord 实时 QA 场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

它会将 SUT 配置为始终开启 guild 处理、`visibleReplies:
"message_tool"`、`ackReaction: "👀"`，以及显式状态 reaction。预言机会轮询真实的 Discord 触发消息，并期望观察到序列 `👀 -> 🤔 -> 👍`。工件包括 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应基于现有私有 QA 栈构建，而不是从零开始：

- `pnpm openclaw qa discord` 已经运行带有驱动和 SUT bot 的实时 Discord 通道。
- 实时传输运行器已经会在 `.artifacts/qa-e2e/` 下写入报告和观察到的消息工件。
- Convex 凭证租约已经提供对共享实时传输凭证的独占访问。
- 浏览器控制服务已经支持截图、快照、无头托管 profile 和远程 CDP profile。
- QA Lab 已经有用于传输形态测试的调试器 UI 和总线。

第一个 Mantis 实现可以是这些组件之上的一个轻量 before/after 运行器，再加上一层视觉证据。

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

摘要必须包含：

- 已测试的 ref 和 SHA
- 传输和场景 id
- 机器提供商以及机器 id 或租约 id
- 不含 secret 值的凭证来源
- baseline 结果
- candidate 结果
- bug 是否在 baseline 上复现
- candidate 是否修复了它
- 工件路径
- 已脱敏的设置或清理问题

截图是证据，不是 secret。它们仍然需要遵守脱敏纪律：私有 channel 名称、用户名或消息内容可能会出现。对于公开 PR，在脱敏方案更完善之前，优先使用 GitHub Actions 工件链接，而不是内联图片。

## 浏览器和 VNC

浏览器通道有两种模式：

- **无头自动化**：CI 默认模式。Chrome 会启用 CDP，Playwright 或 OpenClaw 浏览器控制会捕获截图。
- **VNC 救援**：当登录、MFA、Discord 反自动化或视觉调试需要人工介入时，在同一 VM 上启用。

Discord 观察者浏览器 profile 应该足够持久，避免每次运行都登录，但要与个人浏览器状态隔离。profile 属于 Mantis 机器池，而不是开发者笔记本。

当 Mantis 卡住时，它会发布一条 Discord 状态消息，其中包含：

- 运行 id
- 场景 id
- 机器提供商
- 工件目录
- VNC 或 noVNC 连接说明（如果可用）
- 简短阻塞说明

第一个私有部署可以将这些消息发布到现有 operator channel，之后再迁移到专用 Mantis channel。

## 机器

Mantis 的第一个远程实现应优先通过 Crabbox 使用 AWS。Crabbox 为我们提供预热机器、租约跟踪、hydration、日志、结果和清理。如果 AWS 容量太慢或不可用，则在同一个机器接口后面添加 Hetzner 提供商。

最低 VM 要求：

- Linux，并安装支持桌面的 Chrome 或 Chromium
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够运行一个 OpenClaw Gateway 网关、一个浏览器和一次模型运行的 CPU 和内存
- 能够出站访问 Discord、GitHub、模型提供商和凭证代理

VM 不应在预期的凭证或浏览器 profile 存储之外保留长期原始 secret。

## Secret

远程运行的 secret 存在 GitHub 组织或仓库 secret 中，本地运行的 secret 存在由本地 operator 控制的 secret 文件中。

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

长期来看，Convex 凭证池应继续作为实时传输凭证的常规来源。GitHub secret 用于引导代理和 fallback 通道。Discord 状态 reaction 工作流会将 Mantis Crabbox secret 映射回 Crabbox CLI 期望的 `CRABBOX_COORDINATOR` 和 `CRABBOX_COORDINATOR_TOKEN` 环境变量。普通的 `CRABBOX_*` GitHub secret 名称仍会作为兼容 fallback 被接受。

Mantis 运行器绝不能打印：

- Discord bot token
- 提供商 API key
- 浏览器 cookie
- auth profile 内容
- VNC 密码
- 原始凭证 payload

公开工件上传还应脱敏 Discord 目标元数据，例如 bot、guild、channel 和 message id。GitHub smoke 工作流因此启用了 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 被意外粘贴到 issue、PR、聊天或日志中，请在存储新的 secret 后轮换它。

## GitHub 工件和 PR 评论

Mantis 工作流应将完整证据包作为短期 Actions 工件上传。当工作流针对 bug 报告或修复 PR 运行时，还应将脱敏后的 PNG 截图发布到 `qa-artifacts` 分支，并在对应 bug 或修复 PR 上 upsert 一条包含内联 before/after 截图的评论。不要只把主要证明发布到通用 QA 自动化 PR。原始日志、观察到的消息和其他大型证据保留在 Actions 工件中。

生产工作流应使用 Mantis GitHub App 发布这些评论，而不是使用 `github-actions[bot]`。将 app id 和私钥作为 `MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions secret 存储。工作流使用隐藏标记作为 upsert key，当 token 可以编辑时更新该评论；当较旧的 bot 所有标记无法编辑时，创建一条新的 Mantis 所有评论。

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

当运行因为 harness 失败而失败时，评论必须明确说明这一点，而不是暗示 candidate 失败。

## 私有部署说明

私有部署可能已经有一个 Mantis Discord application。如果该 application 拥有正确的 bot 权限并且可以安全轮换，请复用它，而不是创建另一个 app。

通过 secret 或部署配置设置初始 operator 通知 channel。它可以先指向现有 maintainer 或 operations channel，等专用 Mantis channel 存在后再迁移过去。

不要把 guild id、channel id、bot token、浏览器 cookie 或 VNC 密码放进本文档。将它们存储在 GitHub secret、凭证代理或 operator 的本地 secret 存储中。

## 添加场景

Mantis 场景应声明：

- id 和标题
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

场景应优先使用小型、类型化的预言机：

- reaction bug 使用 Discord reaction 状态
- threading bug 使用 Discord 消息引用
- Slack bug 使用 Slack thread ts 和 reaction API 状态
- email bug 使用 email message id 和 header
- 当 UI 是唯一可靠可观测对象时使用浏览器截图

视觉检查应是附加的。如果平台 API 可以证明 bug，请将 API 用作通过/失败预言机，并保留截图用于增强人工信心。

## 提供商扩展

Discord 之后，同一个运行器可以添加：

- Slack：reaction、thread、app mention、modal、文件上传。
- Email：在 connector 不足时，使用 `gog` 进行 Gmail auth 和消息 threading。
- WhatsApp：二维码登录、重新识别、消息投递、媒体、reaction。
- Telegram：群组 mention gating、command、可用时的 reaction。
- Matrix：加密房间、thread 或 reply relation、重启恢复。

每种传输都应有一个低成本 smoke 场景，以及一个或多个 bug 类别场景。昂贵的视觉场景应保持 opt-in。

## 未决问题

- 复用现有 Mantis bot 时，哪个 Discord bot 应该作为 driver，哪个应该作为 SUT？
- 第一阶段，观察者浏览器登录应使用人类 Discord 账户、测试账户，还是只使用 bot 可读的 REST 证据？
- GitHub 应为 PR 保留 Mantis 工件多长时间？
- ClawSweeper 应在什么时候自动推荐 Mantis，而不是等待 maintainer 命令？
- 公开 PR 上传前，截图是否应该脱敏或裁剪？
