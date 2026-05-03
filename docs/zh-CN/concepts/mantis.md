---
read_when:
    - 为 OpenClaw 缺陷构建或运行实时视觉 QA
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是用于在实时传输协议上复现 OpenClaw 缺陷、捕获前后对比证据，并将工件附加到 PR 的可视化端到端验证系统。
title: Mantis
x-i18n:
    generated_at: "2026-05-03T17:26:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8918ce7fe1c90184a0bcfc8427f2cd90cb969e3c93027dff08506108bf19c205
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 的端到端验证系统，适用于需要真实运行时、真实传输协议和可见证据的 bug。它会针对已知不良 ref 运行一个场景，捕获证据，再针对候选 ref 运行同一场景，并将比较结果发布为制品，维护者可以从 PR 或本地命令中检查。

Mantis 从 Discord 开始，因为 Discord 为我们提供了一个高价值的首条验证通道：真实 bot 凭证、真实公会渠道、回应、线程、原生命令，以及一个让人类可以直观确认传输协议显示内容的浏览器 UI。

## 目标

- 使用用户看到的同类传输协议形态，复现 GitHub issue 或 PR 中的 bug。
- 在应用修复之前，在 baseline ref 上捕获一个 **before** 制品。
- 在应用修复之后，在候选 ref 上捕获一个 **after** 制品。
- 尽可能使用确定性的判定器，例如 Discord REST 回应读取或渠道转录检查。
- 当 bug 有可见 UI 表面时捕获截图。
- 从智能体控制的 CLI 在本地运行，并从 GitHub 远程运行。
- 当登录、浏览器自动化或提供商凭证卡住时，保留足够的机器状态以便 VNC 救援。
- 当运行受阻、需要手动 VNC 帮助或完成时，向操作员 Discord 渠道发布简洁状态。

## 非目标

- Mantis 不是单元测试的替代品。在理解修复后，Mantis 运行通常应转化为更小的回归测试。
- Mantis 不是常规快速 CI 门禁。它更慢、使用实时凭据，并且仅保留给实时环境确实重要的 bug。
- Mantis 的正常运行不应需要人类介入。手动 VNC 是救援路径，不是理想路径。
- Mantis 不会在制品、日志、截图、Markdown 报告或 PR 评论中存储原始密钥。

## 所有权

Mantis 位于 OpenClaw QA 技术栈中。

- OpenClaw 拥有场景运行时、传输协议适配器、证据 schema，以及 `pnpm openclaw qa mantis` 下的本地 CLI。
- QA Lab 拥有实时传输协议 harness 组件、浏览器捕获帮助工具和制品写入器。
- 需要远程 VM 时，Crabbox 拥有预热后的 Linux 机器。
- GitHub Actions 拥有远程 workflow 入口点和制品保留。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、调度 workflow，以及发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体会通过 Codex 驱动 Mantis。

此边界将传输协议知识保留在 OpenClaw 中，将机器调度保留在 Crabbox 中，并将维护者 workflow 胶水逻辑保留在 ClawSweeper 中。

## 命令形态

第一个本地命令会验证 Discord bot、公会、渠道、消息发送、回应发送和制品路径：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

后续的 before 和 after 运行器应接受这种形态：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

GitHub 冒烟 workflow 是 `Mantis Discord Smoke`。第一个真实场景的 before 和 after GitHub workflow 是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期会复现 queued-only 行为的 ref。
- `candidate_ref`：预期会显示 `queued -> thinking -> done` 的 ref。

它会检出 workflow harness ref，构建单独的 baseline 和 candidate worktree，针对每个 worktree 运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 作为 Actions 制品上传。

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一个命令明确且聚焦于场景。第二个命令之后可以根据标签、已变更文件和 ClawSweeper 审查发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭据。
2. 分配或复用 VM。
3. 为 baseline ref 准备干净的 checkout。
4. 安装依赖，并仅构建场景所需内容。
5. 使用隔离的状态目录启动子 OpenClaw Gateway 网关。
6. 配置实时传输协议、提供商、模型和浏览器 profile。
7. 运行场景并捕获 baseline 证据。
8. 停止 Gateway 网关并保留日志。
9. 在同一 VM 中准备候选 ref。
10. 运行同一场景并捕获 candidate 证据。
11. 比较判定器结果和视觉证据。
12. 写入 Markdown、JSON、日志、截图和可选 trace 制品。
13. 上传 GitHub Actions 制品。
14. 发布简洁的 PR 或 Discord 状态消息。

场景应能够以两种不同方式失败：

- **已复现 bug**：baseline 以预期方式失败。
- **Harness 失败**：环境设置、凭据、Discord API、浏览器或提供商在 bug 判定器有意义之前失败。

最终报告必须区分这些情况，以免维护者将不稳定环境误认为产品行为。

## Discord MVP

第一个场景应针对公会渠道中的 Discord 状态回应，其中源回复投递模式为 `message_tool_only`。

它是一个适合 Mantis 起步的原因：

- 它在 Discord 中表现为触发消息上的回应，是可见的。
- 它通过 Discord 消息回应状态提供强 REST 判定器。
- 它会覆盖真实的 OpenClaw Gateway 网关、Discord bot 凭证、消息分发、源回复投递模式、状态回应状态和模型轮次生命周期。
- 它足够窄，能让第一版实现保持诚实。

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

Baseline 证据应显示 queued 确认回应，但在 tool-only 模式下没有生命周期转换。Candidate 证据应显示当 `messages.statusReactions.enabled` 被显式设为 true 时，生命周期状态回应会运行。

第一个可执行切片是选择启用的 Discord 实时 QA 场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

它会将 SUT 配置为始终开启公会处理、`visibleReplies: "message_tool"`、`ackReaction: "👀"` 和显式状态回应。判定器会轮询真实的 Discord 触发消息，并期望观察到的序列为 `👀 -> 🤔 -> 👍`。制品包括 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应基于现有私有 QA 技术栈构建，而不是从零开始：

- `pnpm openclaw qa discord` 已经会使用 driver 和 SUT bot 运行一个实时 Discord 通道。
- 实时传输协议运行器已经会在 `.artifacts/qa-e2e/` 下写入报告和 observed-message 制品。
- Convex 凭据租约已经为共享实时传输协议凭据提供独占访问。
- 浏览器控制服务已经支持截图、快照、无头托管 profile 和远程 CDP profile。
- QA Lab 已经拥有用于传输协议形态测试的调试器 UI 和总线。

第一版 Mantis 实现可以是这些组件之上的一个薄 before/after 运行器，再加一个视觉证据层。

## 证据模型

每次运行都会写入稳定的制品目录：

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

`mantis-summary.json` 应是机器可读的事实来源。Markdown 报告用于 PR 评论和人工审查。

摘要必须包括：

- 已测试的 refs 和 SHA
- 传输协议和场景 id
- 机器提供商和机器 id 或租约 id
- 不含密钥值的凭据来源
- baseline 结果
- candidate 结果
- bug 是否在 baseline 上复现
- candidate 是否修复了它
- 制品路径
- 已清理的设置或清理问题

截图是证据，不是密钥。它们仍然需要遵守脱敏纪律：私有渠道名称、用户名或消息内容可能会出现。对于公开 PR，在脱敏方案更强之前，优先使用 GitHub Actions 制品链接，而不是内联图片。

## 浏览器和 VNC

浏览器通道有两种模式：

- **无头自动化**：CI 的默认模式。Chrome 会启用 CDP 运行，Playwright 或 OpenClaw 浏览器控制会捕获截图。
- **VNC 救援**：当登录、MFA、Discord 反自动化或视觉调试需要人类介入时，在同一 VM 上启用。

Discord 观察者浏览器 profile 应具备足够持久性，避免每次运行都登录，但要与个人浏览器状态隔离。profile 属于 Mantis 机器池，而不是开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord 状态消息，其中包含：

- 运行 id
- 场景 id
- 机器提供商
- 制品目录
- 如可用，VNC 或 noVNC 连接说明
- 简短阻塞原因文本

第一个私有部署可以将这些消息发布到现有操作员渠道，之后再迁移到专用 Mantis 渠道。

## 机器

第一版远程实现中，Mantis 应优先通过 Crabbox 使用 AWS。Crabbox 为我们提供预热机器、租约跟踪、hydration、日志、结果和清理。如果 AWS 容量太慢或不可用，请在同一机器接口后添加 Hetzner 提供商。

最低 VM 要求：

- Linux，并安装可用于桌面的 Chrome 或 Chromium
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够的 CPU 和内存，可运行一个 OpenClaw Gateway 网关、一个浏览器和一次模型运行
- 可出站访问 Discord、GitHub、模型提供商和凭据 broker

VM 不应在预期凭据或浏览器 profile 存储之外保留长期存在的原始密钥。

## 密钥

远程运行的密钥位于 GitHub 组织或仓库密钥中，本地运行的密钥位于由本地操作员控制的密钥文件中。

推荐密钥名称：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` 用于公开 GitHub 制品上传
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`

长期来看，Convex 凭据池应继续作为实时传输协议凭据的常规来源。GitHub 密钥用于引导 broker 和 fallback 通道。

Mantis 运行器绝不能打印：

- Discord bot token
- 提供商 API key
- 浏览器 cookie
- 凭证 profile 内容
- VNC 密码
- 原始凭据 payload

公开制品上传还应脱敏 Discord 目标元数据，例如 bot、公会、渠道和消息 id。GitHub 冒烟 workflow 因此启用了 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 被意外粘贴到 issue、PR、聊天或日志中，请在新密钥存储完成后轮换它。

## GitHub 制品和 PR 评论

Mantis 工作流应将完整证据包作为短期 Actions artifact 上传。当工作流为错误报告或修复 PR 运行时，还应将已脱敏的 PNG 截图发布到 `qa-artifacts` 分支，并在该错误或修复 PR 上更新或插入一条评论，内联显示前后对比截图。不要只把主要证明发布在通用 QA 自动化 PR 上。原始日志、观察到的消息以及其他体积较大的证据保留在 Actions artifact 中。

生产工作流应使用 Mantis GitHub App 发布这些评论，而不是使用 `github-actions[bot]`。将 app id 和私钥存储为 `MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions secrets。如果 app 被重命名，请将 `MANTIS_GITHUB_APP_BOT_LOGIN` 设置为 GitHub Actions 变量，值为新的 bot login，例如 `openclaw-mantis[bot]`。当已有 Mantis 拥有的评论时，工作流应更新该评论；如果只存在较旧的 `github-actions[bot]` 评论，则应创建一条新的 Mantis 拥有的评论，而不是重写旧版 bot 评论。

PR 评论应简短且直观：

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

当运行因为 harness 失败而失败时，评论必须说明这一点，而不是暗示候选修复失败。

## 私有部署说明

私有部署可能已经有一个 Mantis Discord 应用。当该应用具备正确的 bot 权限并且可以安全轮换时，请复用该应用，而不是再创建一个 app。

通过 secrets 或部署配置设置初始操作员通知渠道。它可以先指向现有的维护者或运维渠道，等专用 Mantis 渠道存在后再迁移过去。

不要在本文档中放入 guild id、channel id、bot token、浏览器 cookie 或 VNC 密码。将它们存储在 GitHub secrets、凭证代理或操作员的本地密钥存储中。

## 添加场景

Mantis 场景应声明：

- id 和标题
- 传输协议
- 所需凭证
- 基线 ref 策略
- 候选 ref 策略
- OpenClaw 配置补丁
- 设置步骤
- 刺激输入
- 预期基线 oracle
- 预期候选 oracle
- 视觉捕获目标
- 超时预算
- 清理步骤

场景应优先使用小型、带类型的 oracle：

- 用于 reaction 错误的 Discord reaction 状态
- 用于线程错误的 Discord 消息引用
- 用于 Slack 错误的 Slack thread ts 和 reaction API 状态
- 用于电子邮件错误的电子邮件 message id 和 header
- 当 UI 是唯一可靠可观测对象时使用浏览器截图

视觉检查应是增量补充。如果平台 API 可以证明错误，就使用 API 作为通过/失败 oracle，并保留截图用于增强人工信心。

## 提供商扩展

在 Discord 之后，同一个 runner 可以添加：

- Slack：reaction、thread、app mention、modal、文件上传。
- 电子邮件：在 connectors 不够用的地方，使用 `gog` 进行 Gmail 认证和消息线程处理。
- WhatsApp：二维码登录、重新识别、消息投递、媒体、reaction。
- Telegram：群组提及门控、命令、可用时的 reaction。
- Matrix：加密房间、thread 或 reply relation、重启恢复。

每种传输协议都应有一个低成本 smoke 场景，以及一个或多个错误类别场景。昂贵的视觉场景应保持为可选启用。

## 未决问题

- 当复用现有 Mantis bot 时，哪个 Discord bot 应作为 driver，哪个应作为 SUT？
- 第一阶段中，observer 浏览器登录应使用真人 Discord 账号、测试账号，还是只使用 bot 可读取的 REST 证据？
- GitHub 应为 PR 保留 Mantis artifact 多久？
- ClawSweeper 什么时候应自动推荐 Mantis，而不是等待维护者命令？
- 对于公开 PR，截图在上传前是否应脱敏或裁剪？
