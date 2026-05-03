---
read_when:
    - 为 OpenClaw 缺陷构建或运行实时可视化 QA
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是一个可视化端到端验证系统，用于在实时传输协议上复现 OpenClaw 缺陷、捕获变更前后的证据，并将工件附加到拉取请求。
title: Mantis
x-i18n:
    generated_at: "2026-05-03T20:32:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cbacc20df4439d579556a1a807682e08d1c3d56294ec42b324c298599ebe4bb
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 端到端验证系统，用于验证需要真实运行时、真实传输协议和可见证明的 bug。它会在已知有问题的 ref 上运行一个场景并捕获证据，再在候选 ref 上运行同一场景，然后将对比结果发布为构件，维护者可以从 PR 或本地命令中检查这些构件。

Mantis 从 Discord 开始，因为 Discord 提供了一个高价值的首个通道：真实 bot 凭证、真实服务器渠道、回应、话题串、原生命令，以及一个让人可以直观看到传输协议呈现内容的浏览器 UI。

## 目标

- 使用用户看到的相同传输形态，复现 GitHub issue 或 PR 中的 bug。
- 在应用修复前，在基线 ref 上捕获一个 **before** 构件。
- 在应用修复后，在候选 ref 上捕获一个 **after** 构件。
- 尽可能使用确定性的判定器，例如 Discord REST 回应读取或渠道 transcript 检查。
- 当 bug 有可见 UI 表面时捕获截图。
- 从智能体控制的 CLI 本地运行，也从 GitHub 远程运行。
- 当登录、浏览器自动化或提供商凭证卡住时，保留足够的机器状态以便 VNC 救援。
- 当运行被阻塞、需要手动 VNC 帮助或完成时，向操作员 Discord 渠道发布简洁状态。

## 非目标

- Mantis 不是单元测试的替代品。修复被理解之后，一次 Mantis 运行通常应该转化为一个更小的回归测试。
- Mantis 不是常规的快速 CI 门禁。它更慢，会使用实时凭证，并且只保留给实时环境重要的 bug。
- Mantis 不应要求人工参与常规操作。手动 VNC 是救援路径，不是理想路径。
- Mantis 不会在构件、日志、截图、Markdown 报告或 PR 评论中存储原始密钥。

## 所有权

Mantis 属于 OpenClaw QA 栈。

- OpenClaw 拥有场景运行时、传输适配器、证据 schema，以及 `pnpm openclaw qa mantis` 下的本地 CLI。
- QA Lab 拥有实时传输 harness 组件、浏览器捕获助手和构件写入器。
- 需要远程 VM 时，Crabbox 拥有已预热的 Linux 机器。
- GitHub Actions 拥有远程工作流入口点和构件保留。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、分发工作流，以及发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体通过 Codex 驱动 Mantis。

这个边界将传输协议知识保留在 OpenClaw 中，将机器调度保留在 Crabbox 中，并将维护者工作流粘合逻辑保留在 ClawSweeper 中。

## 命令形态

第一个本地命令会验证 Discord bot、服务器、渠道、消息发送、回应发送和构件路径：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本地 before 和 after runner 接受这种形态：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner 会在输出目录下创建分离的基线和候选 worktree，安装依赖，构建每个 ref，使用 `--allow-failures` 运行场景，然后写入 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md`。对于第一个 Discord 场景，成功验证意味着基线状态为 `fail`，候选状态为 `pass`。

GitHub smoke 工作流是 `Mantis Discord Smoke`。第一个真实场景的 before 和 after GitHub 工作流是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期会复现 queued-only 行为的 ref。
- `candidate_ref`：预期会显示 `queued -> thinking -> done` 的 ref。

它会检出工作流 harness ref，构建独立的基线和候选 worktree，对每个 worktree 运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 上传为 Actions 构件。

你也可以直接从 PR 评论触发 status-reactions 运行：

```text
@Mantis discord status reactions
```

评论触发器有意保持狭窄。它只会在具有 write、maintain 或 admin 权限的用户发布的拉取请求评论上运行，并且只识别 Discord status-reaction 请求。默认情况下，它使用已知有问题的基线 ref 和当前 PR head SHA 作为候选。维护者可以覆盖任意一个 ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一个命令是显式且聚焦场景的。第二个命令之后可以根据标签、变更文件和 ClawSweeper 评审发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭证。
2. 分配或复用 VM。
3. 为基线 ref 准备干净的 checkout。
4. 安装依赖，并只构建场景所需内容。
5. 使用隔离状态目录启动一个子 OpenClaw Gateway 网关。
6. 配置实时传输协议、提供商、模型和浏览器 profile。
7. 运行场景并捕获基线证据。
8. 停止 Gateway 网关并保留日志。
9. 在同一 VM 中准备候选 ref。
10. 运行同一场景并捕获候选证据。
11. 对比判定器结果和视觉证据。
12. 写入 Markdown、JSON、日志、截图和可选 trace 构件。
13. 上传 GitHub Actions 构件。
14. 发布简洁的 PR 或 Discord 状态消息。

场景应该能够以两种不同方式失败：

- **已复现 bug**：基线以预期方式失败。
- **Harness 失败**：环境设置、凭证、Discord API、浏览器或提供商在 bug 判定器有意义之前失败。

最终报告必须区分这些情况，避免维护者将不稳定环境与产品行为混淆。

## Discord MVP

第一个场景应针对服务器渠道中的 Discord 状态回应，其中源回复投递模式为 `message_tool_only`。

它是一个很好的 Mantis 起始场景，原因如下：

- 它在 Discord 中表现为触发消息上的回应，可见。
- 它通过 Discord 消息回应状态提供强 REST 判定器。
- 它会验证真实 OpenClaw Gateway 网关、Discord bot 凭证、消息分发、源回复投递模式、状态回应状态和模型轮次生命周期。
- 它足够狭窄，可以让第一个实现保持诚实。

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

基线证据应显示 queued 确认回应，但在 tool-only 模式中没有生命周期转换。候选证据应显示当 `messages.statusReactions.enabled` 显式为 true 时，生命周期状态回应会运行。

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

它会为 SUT 配置始终开启的服务器处理、`visibleReplies:
"message_tool"`、`ackReaction: "👀"` 和显式状态回应。判定器轮询真实 Discord 触发消息，并期望观察到序列 `👀 -> 🤔 -> 👍`。构件包括 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应构建在现有私有 QA 栈之上，而不是从零开始：

- `pnpm openclaw qa discord` 已经使用 driver 和 SUT bot 运行实时 Discord 通道。
- 实时传输 runner 已经在 `.artifacts/qa-e2e/` 下写入报告和 observed-message 构件。
- Convex 凭证 lease 已经提供对共享实时传输凭证的独占访问。
- 浏览器控制服务已经支持截图、快照、headless 托管 profile 和远程 CDP profile。
- QA Lab 已经有用于传输形态测试的调试器 UI 和总线。

第一个 Mantis 实现可以是在这些组件之上的轻量 before/after runner，再加一层视觉证据。

## 证据模型

每次运行都会写入一个稳定的构件目录：

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

`mantis-summary.json` 应该是机器可读的事实来源。Markdown 报告用于 PR 评论和人工评审。

摘要必须包含：

- 被测试的 ref 和 SHA
- 传输协议和场景 ID
- 机器提供商以及机器 ID 或 lease ID
- 不含密钥值的凭证来源
- 基线结果
- 候选结果
- bug 是否在基线上复现
- 候选是否修复它
- 构件路径
- 已脱敏的设置或清理问题

截图是证据，不是密钥。它们仍然需要遵守脱敏纪律：可能会出现私有渠道名称、用户名或消息内容。对于公开 PR，在脱敏方案更成熟之前，优先使用 GitHub Actions 构件链接，而不是内联图片。

## 浏览器和 VNC

浏览器通道有两种模式：

- **Headless 自动化**：CI 默认模式。Chrome 会启用 CDP，Playwright 或 OpenClaw 浏览器控制会捕获截图。
- **VNC 救援**：当登录、MFA、Discord 反自动化或视觉调试需要人工时，在同一 VM 上启用。

Discord 观察者浏览器 profile 应足够持久，避免每次运行都登录，但要与个人浏览器状态隔离。profile 属于 Mantis 机器池，而不是开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord 状态消息，包含：

- 运行 ID
- 场景 ID
- 机器提供商
- 构件目录
- VNC 或 noVNC 连接说明（如果可用）
- 简短阻塞说明

第一个私有部署可以将这些消息发布到现有操作员渠道，之后再迁移到专用 Mantis 渠道。

## 机器

第一个远程实现中，Mantis 应优先通过 Crabbox 使用 AWS。Crabbox 为我们提供已预热机器、lease 跟踪、水合、日志、结果和清理。如果 AWS 容量太慢或不可用，请在相同机器接口后添加 Hetzner 提供商。

最低 VM 要求：

- Linux，并安装可支持桌面的 Chrome 或 Chromium
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够的 CPU 和内存，用于一个 OpenClaw Gateway 网关、一个浏览器和一次模型运行
- 可出站访问 Discord、GitHub、模型提供商和凭证代理

VM 不应在预期凭证或浏览器 profile 存储之外保留长期存在的原始密钥。

## 密钥

远程运行的密钥存放在 GitHub 组织或仓库密钥中，本地运行的密钥存放在由本地操作员控制的密钥文件中。

推荐的密钥名称：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` 用于公开 GitHub 构件上传
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`

从长期来看，Convex 凭证池应继续作为实时传输凭证的常规来源。GitHub 密钥负责引导 broker 和 fallback lanes。

Mantis runner 绝不能打印：

- Discord bot token
- 提供商 API 密钥
- 浏览器 cookie
- auth profile 内容
- VNC 密码
- 原始凭证 payload

公开构件上传也应遮盖 Discord 目标元数据，例如 bot、guild、channel 和 message id。GitHub smoke workflow 因此启用了 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 被意外粘贴到 issue、PR、聊天或日志中，请在新密钥存储完成后轮换它。

## GitHub 构件和 PR 评论

Mantis workflow 应将完整证据包上传为短期有效的 Actions 构件。当 workflow 为 bug 报告或修复 PR 运行时，还应将已遮盖的 PNG 截图发布到 `qa-artifacts` 分支，并在该 bug 或修复 PR 上 upsert 一条评论，内联展示修复前/后的截图。不要只把主要证明发布到通用 QA automation PR。原始日志、观测到的消息和其他体积较大的证据保留在 Actions 构件中。

生产 workflow 应使用 Mantis GitHub App 发布这些评论，而不是使用 `github-actions[bot]`。将 app id 和私钥存储为 `MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions 密钥。workflow 会从 GitHub App token 解析 bot login，在已有 Mantis 拥有的评论时更新它，并创建新的 Mantis 拥有的评论，而不是重写旧的 `github-actions[bot]` 评论。

PR 评论应简短且以视觉为主：

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

当运行因 harness 失败而失败时，评论必须明确说明这一点，而不是暗示 candidate 失败。

## 私有部署说明

私有部署可能已经有一个 Mantis Discord application。只要该 application 具备正确的 bot 权限并且可以安全轮换，就复用它，而不是再创建一个 app。

通过密钥或部署配置设置初始 operator 通知 channel。它可以先指向现有 maintainer 或 operations channel，之后在专用 Mantis channel 存在后再迁移过去。

不要把 guild id、channel id、bot token、浏览器 cookie 或 VNC 密码放入本文档。请将它们存储在 GitHub 密钥、credential broker 或 operator 的本地密钥存储中。

## 添加场景

Mantis 场景应声明：

- id 和标题
- 传输协议
- 必需凭证
- baseline ref 策略
- candidate ref 策略
- OpenClaw 配置 patch
- 设置步骤
- stimulus
- 预期 baseline oracle
- 预期 candidate oracle
- 视觉捕获目标
- 超时预算
- 清理步骤

场景应优先使用小型、类型化的 oracle：

- 用于 reaction bug 的 Discord reaction 状态
- 用于 threading bug 的 Discord message reference
- 用于 Slack bug 的 Slack thread ts 和 reaction API 状态
- 用于 email bug 的 email message id 和 header
- 当 UI 是唯一可靠可观测对象时，使用浏览器截图

视觉检查应作为补充。如果平台 API 能证明 bug，就使用该 API 作为通过/失败 oracle，并保留截图以增强人的信心。

## 提供商扩展

在 Discord 之后，同一 runner 可以添加：

- Slack：reaction、thread、app mention、modal、文件上传。
- Email：在 connector 不足时，使用 `gog` 进行 Gmail auth 和 message threading。
- WhatsApp：QR login、重新识别、消息送达、媒体、reaction。
- Telegram：group mention gating、命令、可用时的 reaction。
- Matrix：加密 room、thread 或 reply relation、重启恢复。

每种传输协议都应有一个低成本 smoke 场景，以及一个或多个 bug-class 场景。昂贵的视觉场景应保持 opt-in。

## 待解决问题

- 复用现有 Mantis bot 时，哪个 Discord bot 应作为 driver，哪个应作为 SUT？
- observer 浏览器 login 在第一阶段应使用人类 Discord 账号、测试账号，还是只使用 bot 可读的 REST 证据？
- GitHub 应为 PR 保留 Mantis 构件多久？
- ClawSweeper 应在什么时候自动推荐 Mantis，而不是等待 maintainer 命令？
- 公开 PR 上传前，截图是否应遮盖或裁剪？
