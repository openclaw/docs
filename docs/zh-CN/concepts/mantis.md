---
read_when:
    - 构建或运行针对 OpenClaw 缺陷的实时视觉质量检查
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是一个可视化端到端验证系统，用于在实时传输协议上复现 OpenClaw 缺陷、捕获前后对比证据，并将工件附加到 PR。
title: Mantis
x-i18n:
    generated_at: "2026-05-03T16:04:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0291de9b0a6ad33c84c3ef8ea0bc71ffca54c785c442695888722173a0fe1ba5
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 端到端验证系统，面向需要真实运行时、真实传输协议和可见证据的 bug。它会针对已知有问题的引用运行场景、捕获证据，再针对候选引用运行同一场景，并将对比结果发布为构件，维护者可以从 PR 或本地命令中检查。

Mantis 从 Discord 开始，因为 Discord 提供了一条高价值的首条验证线路：真实 bot 凭证、真实公会渠道、回应、线程、原生命令，以及人类可以用来直观确认传输协议展示内容的浏览器 UI。

## 目标

- 使用用户看到的同类传输协议形态，复现 GitHub issue 或 PR 中的 bug。
- 在应用修复前，在基线引用上捕获 **before** 构件。
- 在应用修复后，在候选引用上捕获 **after** 构件。
- 尽可能使用确定性判定器，例如 Discord REST 回应读取或渠道转录检查。
- 当 bug 具有可见 UI 表面时捕获截图。
- 从智能体控制的 CLI 在本地运行，也可从 GitHub 远程运行。
- 当登录、浏览器自动化或提供商凭证卡住时，保留足够的机器状态以便 VNC 救援。
- 当运行被阻塞、需要手动 VNC 帮助或完成时，向操作员 Discord 渠道发布简洁 Status。

## 非目标

- Mantis 不是单元测试的替代品。理解修复后，Mantis 运行通常应转化为更小的回归测试。
- Mantis 不是常规快速 CI 门禁。它更慢、使用实时凭证，并且仅用于实时环境重要的 bug。
- Mantis 不应在正常运行中需要人工介入。手动 VNC 是救援路径，而不是理想路径。
- Mantis 不会在构件、日志、截图、Markdown 报告或 PR 评论中存储原始密钥。

## 所有权

Mantis 位于 OpenClaw QA 栈中。

- OpenClaw 拥有 `pnpm openclaw qa mantis` 下的场景运行时、传输协议适配器、证据 schema 和本地 CLI。
- QA Lab 拥有实时传输协议测试框架组件、浏览器捕获帮助器和构件写入器。
- 当需要远程 VM 时，Crabbox 拥有已预热的 Linux 机器。
- GitHub Actions 拥有远程 workflow 入口点和构件保留策略。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、分发 workflow，并发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体通过 Codex 驱动 Mantis。

这条边界将传输协议知识保留在 OpenClaw 中，将机器调度保留在 Crabbox 中，并将维护者工作流粘合逻辑保留在 ClawSweeper 中。

## 命令形态

第一个本地命令会验证 Discord bot、公会、渠道、消息发送、回应发送和构件路径：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

后续 before 和 after 运行器应接受这种形态：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

GitHub smoke workflow 是 `Mantis Discord Smoke`。第一个真实场景的 before 和 after GitHub workflow 是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期会复现 queued-only 行为的引用。
- `candidate_ref`：预期会显示 `queued -> thinking -> done` 的引用。

它会检出 workflow 测试框架引用，构建独立的基线和候选工作树，针对每个工作树运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 作为 Actions 构件上传。

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一个命令是显式且聚焦场景的。第二个命令之后可以根据标签、变更文件和 ClawSweeper 审查发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭证。
2. 分配或复用 VM。
3. 为基线引用准备干净的 checkout。
4. 安装依赖，并且只构建场景需要的内容。
5. 使用隔离的状态目录启动子 OpenClaw Gateway 网关。
6. 配置实时传输协议、提供商、模型和浏览器配置文件。
7. 运行场景并捕获基线证据。
8. 停止 Gateway 网关并保留日志。
9. 在同一 VM 中准备候选引用。
10. 运行同一场景并捕获候选证据。
11. 对比判定器结果和视觉证据。
12. 写入 Markdown、JSON、日志、截图和可选的 trace 构件。
13. 上传 GitHub Actions 构件。
14. 发布简洁的 PR 或 Discord Status 消息。

场景应能以两种不同方式失败：

- **已复现 bug**：基线按预期方式失败。
- **测试框架失败**：环境设置、凭证、Discord API、浏览器或提供商在 bug 判定器有意义之前失败。

最终报告必须区分这些情况，避免维护者将不稳定环境与产品行为混淆。

## Discord MVP

第一个场景应面向公会渠道中的 Discord Status 回应，其中源回复交付模式为 `message_tool_only`。

它是一个良好 Mantis 起始场景的原因：

- 它在 Discord 中表现为触发消息上的回应，可见。
- 它通过 Discord 消息回应状态拥有强 REST 判定器。
- 它会测试真实的 OpenClaw Gateway 网关、Discord bot 凭证、消息分发、源回复交付模式、Status 回应状态和模型轮次生命周期。
- 它足够窄，可以让第一个实现保持严谨。

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

基线证据应显示 queued 确认回应，但在 tool-only 模式下没有生命周期转换。候选证据应显示当 `messages.statusReactions.enabled` 显式为 true 时运行的生命周期 Status 回应。

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

它会为 SUT 配置始终开启的公会处理、`visibleReplies:
"message_tool"`、`ackReaction: "👀"` 和显式 Status 回应。判定器会轮询真实的 Discord 触发消息，并期望观察到序列 `👀 -> 🤔 -> 👍`。构件包括 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应基于现有私有 QA 栈构建，而不是从零开始：

- `pnpm openclaw qa discord` 已经会使用 driver 和 SUT 机器人运行实时 Discord 线路。
- 实时传输协议运行器已经会在 `.artifacts/qa-e2e/` 下写入报告和已观察消息构件。
- Convex 凭证租约已经提供对共享实时传输协议凭证的独占访问。
- 浏览器控制服务已经支持截图、快照、无头托管配置文件和远程 CDP 配置文件。
- QA Lab 已经具备用于传输协议形态测试的调试器 UI 和总线。

第一个 Mantis 实现可以是在这些组件之上的轻量 before/after 运行器，再加上一层视觉证据。

## 证据模型

每次运行都会写入稳定的构件目录：

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

- 测试的引用和 SHA
- 传输协议和场景 ID
- 机器提供商以及机器 ID 或租约 ID
- 不含密钥值的凭证来源
- 基线结果
- 候选结果
- bug 是否在基线上复现
- 候选是否修复了它
- 构件路径
- 已清理的设置或清理问题

截图是证据，不是密钥。它们仍然需要遵守脱敏纪律：私有渠道名称、用户名或消息内容可能会出现。对于公开 PR，在脱敏方案更成熟之前，优先使用 GitHub Actions 构件链接，而不是内联图片。

## 浏览器和 VNC

浏览器线路有两种模式：

- **无头自动化**：CI 的默认模式。Chrome 启用 CDP 运行，Playwright 或 OpenClaw 浏览器控制会捕获截图。
- **VNC 救援**：当登录、MFA、Discord 反自动化或视觉调试需要人工介入时，在同一 VM 上启用。

Discord 观察者浏览器配置文件应具有足够持久性，避免每次运行都登录，但应与个人浏览器状态隔离。配置文件属于 Mantis 机器池，而不是开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord Status 消息，包含：

- 运行 ID
- 场景 ID
- 机器提供商
- 构件目录
- 如果可用，提供 VNC 或 noVNC 连接说明
- 简短的阻塞原因文本

第一个私有部署可以将这些消息发布到现有操作员渠道，之后再迁移到专用 Mantis 渠道。

## 机器

Mantis 的第一个远程实现应优先通过 Crabbox 使用 AWS。Crabbox 为我们提供已预热机器、租约跟踪、水合、日志、结果和清理。如果 AWS 容量太慢或不可用，可以在同一机器接口后面添加 Hetzner 提供商。

最低 VM 要求：

- 安装了具备桌面能力的 Chrome 或 Chromium 的 Linux
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够的 CPU 和内存，可运行一个 OpenClaw Gateway 网关、一个浏览器和一次模型运行
- 可出站访问 Discord、GitHub、模型提供商和凭证 broker

VM 不应在预期的凭证或浏览器配置文件存储之外保留长期存在的原始密钥。

## 密钥

远程运行的密钥位于 GitHub organization 或 repository secrets 中，本地运行的密钥位于本地操作员控制的密钥文件中。

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

长期来看，Convex 凭证池应继续作为实时传输协议凭证的常规来源。GitHub secrets 用于引导 broker 和 fallback 线路。

Mantis 运行器绝不能打印：

- Discord bot token
- 提供商 API key
- 浏览器 cookie
- 凭证配置文件内容
- VNC 密码
- 原始凭证 payload

公开构件上传还应脱敏 Discord 目标元数据，例如 bot、公会、渠道和消息 ID。GitHub smoke workflow 因此启用了 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 被意外粘贴到 issue、PR、聊天或日志中，请在新密钥已存储后轮换它。

## GitHub 构件和 PR 评论

第一个 GitHub 版本应将截图作为 Actions 工件上传，并从 PR 评论中链接它们。等脱敏、保留策略以及公开/私有仓库行为确定后，再加入内联图片。

PR 评论应简短：

```md
Mantis Discord verification: pass

- Scenario: `discord-status-reactions-tool-only`
- Baseline: reproduced on `<sha>`
- Candidate: fixed on `<sha>`
- Evidence: <artifact link>
- Screenshots: baseline and candidate message-row captures in the artifact
```

当运行失败是因为 harness 失败时，评论必须说明这一点，而不是暗示候选版本失败。

## 私有部署说明

私有部署可能已经有一个 Mantis Discord 应用。若该应用拥有正确的 bot 权限，并且可以安全轮换，请复用该应用，而不是创建另一个应用。

通过 secret 或部署配置设置初始操作员通知渠道。它可以先指向现有的维护者或运维渠道，等专用 Mantis 渠道存在后再迁移过去。

不要将 guild id、channel id、bot token、浏览器 cookie 或 VNC 密码放入本文档。请将它们存储在 GitHub secrets、凭证代理或操作员的本地 secret 存储中。

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
- 预期基线判定依据
- 预期候选判定依据
- 视觉捕获目标
- 超时预算
- 清理步骤

场景应优先使用小型、类型化的判定依据：

- 用于 reaction bug 的 Discord reaction 状态
- 用于线程 bug 的 Discord 消息引用
- 用于 Slack bug 的 Slack thread ts 和 reaction API 状态
- 用于 email bug 的 email message id 和 header
- 当 UI 是唯一可靠可观测对象时，使用浏览器截图

视觉检查应是补充性的。如果平台 API 可以证明该 bug，请使用 API 作为通过/失败判定依据，并保留截图以增强人工信心。

## 提供商扩展

在 Discord 之后，同一个 runner 可以添加：

- Slack：reaction、thread、app mention、modal、文件上传。
- Email：Gmail auth，以及在 connector 不足时使用 `gog` 进行消息线程处理。
- WhatsApp：二维码登录、重新识别、消息送达、媒体、reaction。
- Telegram：群组 mention gating、命令、可用时的 reaction。
- Matrix：加密房间、thread 或 reply relation、重启恢复。

每种传输协议都应有一个低成本 smoke 场景，以及一个或多个 bug 类别场景。昂贵的视觉场景应保持 opt-in。

## 未决问题

- 复用现有 Mantis bot 时，哪个 Discord bot 应作为 driver，哪个应作为 SUT？
- 第一阶段中，observer 浏览器登录应使用真人 Discord 账户、测试账户，还是仅使用 bot 可读的 REST 证据？
- GitHub 应为 PR 保留 Mantis 工件多长时间？
- ClawSweeper 何时应自动推荐 Mantis，而不是等待维护者命令？
- 对于公开 PR，截图在上传前是否应脱敏或裁剪？
