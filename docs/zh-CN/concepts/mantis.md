---
read_when:
    - 构建或运行针对 OpenClaw 缺陷的实时视觉 QA
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输协议场景
    - 调试需要截图、浏览器自动化或 VNC 访问权限的 QA 运行
summary: Mantis 是一个可视化端到端验证系统，用于在实时传输协议上重现 OpenClaw 错误，捕获前后对比证据，并将产物附加到 PR。
title: Mantis
x-i18n:
    generated_at: "2026-05-03T16:33:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8a9a623728a34a6c642293de29e40026351130acc9f6fd12b55f25f3c9aef85
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 的端到端验证系统，用于需要真实运行时、真实传输协议和可见证明的 bug。它会针对已知有问题的 ref 运行一个场景，捕获证据，再针对候选 ref 运行同一场景，并将对比结果发布为维护者可从 PR 或本地命令检查的构件。

Mantis 从 Discord 开始，因为 Discord 为我们提供了一条高价值的首条验证线：真实 bot 凭证、真实 guild 渠道、reactions、threads、原生命令，以及一个让人类可以直观确认传输协议所展示内容的浏览器 UI。

## 目标

- 使用用户看到的同一传输协议形态，复现 GitHub issue 或 PR 中的 bug。
- 在应用修复之前，在基线 ref 上捕获 **before** 构件。
- 在应用修复之后，在候选 ref 上捕获 **after** 构件。
- 尽可能使用确定性判定器，例如 Discord REST reaction 读取或渠道 transcript 检查。
- 当 bug 有可见 UI 表面时捕获截图。
- 从智能体控制的 CLI 在本地运行，也可从 GitHub 远程运行。
- 当登录、浏览器自动化或提供商凭证卡住时，保留足够的机器状态以便 VNC 救援。
- 当运行被阻塞、需要手动 VNC 帮助或完成时，向操作员 Discord 渠道发布简明 Status。

## 非目标

- Mantis 不是单元测试的替代品。理解修复后，Mantis 运行通常应转化为更小的回归测试。
- Mantis 不是常规的快速 CI 门禁。它更慢，使用实时凭证，并且保留给实时环境重要的 bug。
- Mantis 在正常操作中不应需要人类介入。手动 VNC 是救援路径，不是理想路径。
- Mantis 不会在构件、日志、截图、Markdown 报告或 PR 评论中存储原始密钥。

## 所有权

Mantis 位于 OpenClaw QA 栈中。

- OpenClaw 拥有 `pnpm openclaw qa mantis` 下的场景运行时、传输协议适配器、证据 schema 和本地 CLI。
- QA Lab 拥有实时传输协议 harness 组件、浏览器捕获 helper 和构件写入器。
- 当需要远程 VM 时，Crabbox 拥有预热的 Linux 机器。
- GitHub Actions 拥有远程 workflow 入口点和构件保留。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、分派 workflow，并发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体通过 Codex 驱动 Mantis。

这条边界将传输协议知识留在 OpenClaw，将机器调度留在 Crabbox，将维护者 workflow 粘合逻辑留在 ClawSweeper。

## 命令形态

第一个本地命令会验证 Discord bot、guild、渠道、消息发送、reaction 发送和构件路径：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

后续 before 和 after runner 应接受这种形态：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

GitHub smoke workflow 是 `Mantis Discord Smoke`。第一个真实场景的 before 和 after GitHub workflow 是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期会复现 queued-only 行为的 ref。
- `candidate_ref`：预期会展示 `queued -> thinking -> done` 的 ref。

它会检出 workflow harness ref，构建独立的基线和候选 worktree，针对每个 worktree 运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 作为 Actions 构件上传。

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一条命令是显式且聚焦场景的。第二条稍后可以根据标签、变更文件和 ClawSweeper review 发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭证。
2. 分配或复用 VM。
3. 为基线 ref 准备干净 checkout。
4. 安装依赖，并只构建场景需要的内容。
5. 使用隔离的状态目录启动子级 Gateway 网关。
6. 配置实时传输协议、提供商、模型和浏览器 profile。
7. 运行场景并捕获基线证据。
8. 停止 Gateway 网关并保留日志。
9. 在同一 VM 中准备候选 ref。
10. 运行同一场景并捕获候选证据。
11. 比较判定器结果和视觉证据。
12. 写入 Markdown、JSON、日志、截图和可选 trace 构件。
13. 上传 GitHub Actions 构件。
14. 发布简明 PR 或 Discord Status 消息。

场景应能以两种不同方式失败：

- **Bug 已复现**：基线以预期方式失败。
- **Harness 失败**：环境设置、凭证、Discord API、浏览器或提供商在 bug 判定器有意义之前失败。

最终报告必须区分这些情况，以免维护者将不稳定环境误认为产品行为。

## Discord MVP

第一个场景应针对 guild 渠道中的 Discord Status reactions，其中源回复投递模式为 `message_tool_only`。

它适合作为 Mantis 种子，原因是：

- 它在 Discord 中表现为触发消息上的 reactions，可见。
- 它通过 Discord 消息 reaction 状态拥有强 REST 判定器。
- 它会演练真实 Gateway 网关、Discord bot 凭证、消息分派、源回复投递模式、Status reaction 状态和模型轮次生命周期。
- 它足够窄，可以让第一次实现保持诚实。

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

基线证据应显示 queued 确认 reaction，但在 tool-only 模式下没有生命周期转换。候选证据应显示当 `messages.statusReactions.enabled` 显式为 true 时，生命周期 Status reactions 会运行。

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

它会用始终开启的 guild handling、`visibleReplies:
"message_tool"`、`ackReaction: "👀"` 和显式 Status reactions 配置 SUT。判定器轮询真实的 Discord 触发消息，并期望观察到序列 `👀 -> 🤔 -> 👍`。构件包括 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应基于现有私有 QA 栈构建，而不是从零开始：

- `pnpm openclaw qa discord` 已经运行带有 driver 和 SUT bot 的实时 Discord 验证线。
- 实时传输协议 runner 已经在 `.artifacts/qa-e2e/` 下写入报告和 observed-message 构件。
- Convex 凭证租约已经提供对共享实时传输协议凭证的独占访问。
- 浏览器控制服务已经支持截图、快照、headless 托管 profile 和远程 CDP profile。
- QA Lab 已经具备用于传输协议形态测试的 debugger UI 和 bus。

第一个 Mantis 实现可以是在这些组件之上的薄 before/after runner，再加一个视觉证据层。

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

`mantis-summary.json` 应是机器可读的事实来源。Markdown 报告用于 PR 评论和人工 review。

摘要必须包含：

- 测试过的 refs 和 SHAs
- 传输协议和场景 id
- 机器提供商以及机器 id 或租约 id
- 不包含密钥值的凭证来源
- 基线结果
- 候选结果
- bug 是否在基线上复现
- 候选是否修复了它
- 构件路径
- 已清理的设置或清理问题

截图是证据，不是密钥。但它们仍需要遵守遮盖纪律：可能出现私有渠道名称、用户名或消息内容。对于公开 PR，在遮盖方案更完善之前，优先使用 GitHub Actions 构件链接，而不是内联图片。

## 浏览器和 VNC

浏览器验证线有两种模式：

- **Headless 自动化**：CI 默认模式。Chrome 启用 CDP 运行，并由 Playwright 或 OpenClaw 浏览器控制捕获截图。
- **VNC 救援**：在登录、MFA、Discord 反自动化或视觉调试需要人类介入时，在同一 VM 上启用。

Discord observer 浏览器 profile 应足够持久，以避免每次运行都登录，但要与个人浏览器状态隔离。profile 属于 Mantis 机器池，而不是开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord Status 消息，包含：

- 运行 id
- 场景 id
- 机器提供商
- 构件目录
- VNC 或 noVNC 连接说明（如可用）
- 简短阻塞原因文本

第一次私有部署可以将这些消息发布到现有操作员渠道，之后再迁移到专用 Mantis 渠道。

## 机器

Mantis 的第一个远程实现应优先通过 Crabbox 使用 AWS。Crabbox 为我们提供预热机器、租约跟踪、水合、日志、结果和清理。如果 AWS 容量太慢或不可用，则在同一机器接口后添加 Hetzner 提供商。

最低 VM 要求：

- Linux，安装了支持桌面的 Chrome 或 Chromium
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够的 CPU 和内存，可运行一个 Gateway 网关、一个浏览器和一次模型运行
- 可出站访问 Discord、GitHub、模型提供商和凭证 broker

VM 不应在预期的凭证或浏览器 profile 存储之外保留长期存在的原始密钥。

## 密钥

密钥在远程运行中存放在 GitHub 组织或仓库 secrets 中，在本地运行中存放在由本地操作员控制的密钥文件中。

推荐密钥名称：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` 用于公开 GitHub 构件上传
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`

长期来看，Convex 凭证池应仍然是实时传输协议凭证的常规来源。GitHub secrets 用于引导 broker 和 fallback 验证线。

Mantis runner 绝不能打印：

- Discord bot tokens
- 提供商 API keys
- 浏览器 cookies
- auth profile 内容
- VNC 密码
- 原始凭证 payloads

公开构件上传还应遮盖 Discord 目标元数据，例如 bot、guild、channel 和 message ids。因此，GitHub smoke workflow 启用了 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 被意外粘贴到 issue、PR、chat 或日志中，在新密钥存储后轮换它。

## GitHub 构件和 PR 评论

Mantis 工作流应将完整证据包上传为短期保留的 Actions 工件。当工作流针对 PR 运行时，还应将已遮盖敏感信息的 PNG 截图发布到 `qa-artifacts` 分支，并更新或插入一条带有内联前后对比截图的 PR 评论。原始日志、观测到的消息和其他较大的证据保留在 Actions 工件中。

PR 评论应简短且以视觉呈现为主：

```md
Mantis Discord Status Reactions QA

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

当运行失败是因为 harness 失败时，评论必须说明这一点，而不是暗示候选版本失败。

## 私有部署说明

私有部署可能已经有一个 Mantis Discord 应用。如果该应用具备正确的机器人权限，并且可以安全轮换，请复用该应用，而不是创建另一个应用。

通过 secrets 或部署配置设置初始操作员通知渠道。它可以先指向现有维护者或运维渠道，然后在专用 Mantis 渠道创建后再迁移过去。

不要将 guild ID、channel ID、bot token、浏览器 cookie 或 VNC 密码放入本文档。请将它们存储在 GitHub secrets、凭据代理或操作员的本地 secret 存储中。

## 添加场景

Mantis 场景应声明：

- ID 和标题
- 传输协议
- 所需凭据
- 基线引用策略
- 候选引用策略
- OpenClaw 配置补丁
- 设置步骤
- 刺激输入
- 预期基线判定器
- 预期候选判定器
- 视觉捕获目标
- 超时预算
- 清理步骤

场景应优先使用小型、类型化的判定器：

- 用于 reaction bug 的 Discord reaction 状态
- 用于 threading bug 的 Discord 消息引用
- 用于 Slack bug 的 Slack thread ts 和 reaction API 状态
- 用于 email bug 的 email message ID 和 header
- 当 UI 是唯一可靠可观测对象时使用浏览器截图

视觉检查应作为补充。如果平台 API 能证明该 bug，请使用 API 作为通过/失败判定器，并保留截图以增强人工信心。

## 提供商扩展

在 Discord 之后，同一个 runner 可以添加：

- Slack：reaction、thread、app mention、modal、文件上传。
- Email：在 connectors 不足时，使用 `gog` 进行 Gmail 认证和消息串接。
- WhatsApp：二维码登录、重新识别、消息送达、媒体、reaction。
- Telegram：群组 mention 门控、命令、可用时的 reaction。
- Matrix：加密房间、thread 或 reply relation、重启后恢复。

每种传输协议都应有一个低成本 smoke 场景，以及一个或多个 bug 类场景。昂贵的视觉场景应保持为可选启用。

## 未决问题

- 复用现有 Mantis bot 时，哪个 Discord bot 应作为 driver，哪个应作为 SUT？
- 第一阶段中，观察者浏览器登录应使用真人 Discord 账号、测试账号，还是仅使用机器人可读取的 REST 证据？
- GitHub 应为 PR 保留 Mantis 工件多长时间？
- ClawSweeper 应在什么时候自动推荐 Mantis，而不是等待维护者命令？
- 对于公开 PR，截图在上传前是否应遮盖敏感信息或裁剪？
