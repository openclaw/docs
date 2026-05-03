---
read_when:
    - 为 OpenClaw 缺陷构建或运行实时视觉 QA
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是用于在实时传输上复现 OpenClaw 缺陷、捕获修复前后证据并将工件附加到拉取请求的可视化端到端验证系统。
title: Mantis
x-i18n:
    generated_at: "2026-05-03T14:30:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4ce96f271703e06036a893c01a88562d9c336f7781a0b91a15dc3d5bb41a2e7
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 端到端验证系统，面向需要真实运行时、真实传输协议和可见证据的错误。它会针对已知的坏 ref 运行一个场景，捕获证据，再针对候选 ref 运行相同场景，并将对比结果发布为 artifact，维护者可以从 PR 或本地命令中检查这些 artifact。

Mantis 从 Discord 开始，因为 Discord 给了我们一条高价值的第一条验证线路：真实机器人凭证、真实 guild 渠道、reaction、thread、原生命令，以及一个浏览器 UI，让人类可以直观看到传输协议显示了什么。

## 目标

- 使用用户看到的相同传输形态，复现 GitHub issue 或 PR 中的错误。
- 在应用修复前，基于 baseline ref 捕获一个 **before** artifact。
- 在应用修复后，基于候选 ref 捕获一个 **after** artifact。
- 尽可能使用确定性 oracle，例如 Discord REST reaction 读取或渠道 transcript 检查。
- 当错误有可见 UI 表面时捕获截图。
- 从智能体控制的 CLI 在本地运行，也能从 GitHub 远程运行。
- 保留足够的机器状态，以便在登录、浏览器自动化或提供商凭证卡住时进行 VNC 救援。
- 当运行被阻塞、需要手动 VNC 帮助或完成时，向操作员 Discord 渠道发布简短状态。

## 非目标

- Mantis 不是单元测试的替代品。修复被理解后，一次 Mantis 运行通常应该转化为更小的回归测试。
- Mantis 不是常规的快速 CI gate。它更慢，使用实时凭证，并且仅用于实时环境确实重要的错误。
- Mantis 正常运行时不应需要人工参与。手动 VNC 是救援路径，不是理想路径。
- Mantis 不会在 artifact、日志、截图、Markdown 报告或 PR 评论中存储原始密钥。

## 所有权

Mantis 位于 OpenClaw QA 栈中。

- OpenClaw 拥有场景运行时、传输适配器、证据 schema，以及 `pnpm openclaw qa mantis` 下的本地 CLI。
- QA Lab 拥有实时传输 harness 组件、浏览器捕获 helper 和 artifact 写入器。
- Crabbox 在需要远程 VM 时拥有预热的 Linux 机器。
- GitHub Actions 拥有远程工作流入口点和 artifact 保留策略。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、分发工作流，并发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体通过 Codex 驱动 Mantis。

这个边界让传输知识留在 OpenClaw，机器调度留在 Crabbox，维护者工作流粘合层留在 ClawSweeper。

## 命令形态

第一个本地命令会验证 Discord 机器人、guild、渠道、消息发送、reaction 发送和 artifact 路径：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

后续的 before 和 after runner 应接受这种形态：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

GitHub smoke 工作流是 `Mantis Discord Smoke`。before 和 after GitHub 工作流应接受等价输入：

- `transport`：第一个版本使用 `discord`。
- `scenario`：一个或多个场景 ID。
- `baseline_ref`：默认 `origin/main`，或关联 issue 中报告的坏 tag。
- `candidate_ref`：PR head SHA。
- `machine_provider`：默认 `aws`，后续可 fallback 到 `hetzner`。
- `post_to_pr`：ClawSweeper 是否应评论结果。

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一个命令显式且聚焦场景。第二个后续可以根据 label、变更文件和 ClawSweeper review 发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭证。
2. 分配或复用 VM。
3. 为 baseline ref 准备干净 checkout。
4. 安装依赖，并只构建场景需要的内容。
5. 使用隔离状态目录启动子 OpenClaw Gateway 网关。
6. 配置实时传输协议、提供商、模型和浏览器 profile。
7. 运行场景并捕获 baseline 证据。
8. 停止 Gateway 网关并保留日志。
9. 在同一 VM 中准备候选 ref。
10. 运行相同场景并捕获候选证据。
11. 对比 oracle 结果和视觉证据。
12. 写入 Markdown、JSON、日志、截图和可选 trace artifact。
13. 上传 GitHub Actions artifact。
14. 发布简短的 PR 或 Discord 状态消息。

场景应能以两种不同方式失败：

- **错误已复现**：baseline 以预期方式失败。
- **Harness 失败**：环境设置、凭证、Discord API、浏览器或提供商在错误 oracle 产生意义之前失败。

最终报告必须区分这些情况，避免维护者把不稳定环境和产品行为混淆。

## Discord MVP

第一个场景应面向 guild 渠道中的 Discord 状态 reaction，其中源回复投递模式是 `message_tool_only`。

为什么它是很好的 Mantis 种子：

- 它在 Discord 中表现为触发消息上的 reaction，可见。
- 它通过 Discord 消息 reaction 状态提供强 REST oracle。
- 它会覆盖真实 OpenClaw Gateway 网关、Discord 机器人凭证、消息分发、源回复投递模式、状态 reaction 状态和模型 turn 生命周期。
- 它足够窄，可以让第一版实现保持真实可靠。

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

Baseline 证据应显示排队的 acknowledgement reaction，但在 tool-only 模式下没有生命周期转换。Candidate 证据应显示当 `messages.statusReactions.enabled` 被显式设为 true 时，生命周期状态 reaction 正在运行。

## 现有 QA 组件

Mantis 应构建在现有私有 QA 栈之上，而不是从零开始：

- `pnpm openclaw qa discord` 已经运行一条带 driver 和 SUT 机器人的实时 Discord 线路。
- 实时传输 runner 已经在 `.artifacts/qa-e2e/` 下写入报告和 observed-message artifact。
- Convex credential lease 已经为共享实时传输凭证提供独占访问。
- 浏览器控制服务已经支持截图、snapshot、headless 托管 profile 和远程 CDP profile。
- QA Lab 已经有用于传输形态测试的 debugger UI 和 bus。

第一版 Mantis 实现可以是这些组件之上的一个轻量 before/after runner，再加一层视觉证据。

## 证据模型

每次运行都会写入稳定的 artifact 目录：

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

summary 必须包含：

- 被测试的 ref 和 SHA
- 传输协议和场景 ID
- 机器提供商和机器 ID 或 lease ID
- 不含密钥值的凭证来源
- baseline 结果
- candidate 结果
- 错误是否在 baseline 上复现
- candidate 是否修复了它
- artifact 路径
- 已脱敏的设置或清理问题

截图是证据，不是密钥。它们仍需要遵守脱敏纪律：私有渠道名称、用户名或消息内容可能会出现。对于公开 PR，在脱敏方案更成熟前，优先使用 GitHub Actions artifact 链接，而不是内联图片。

## 浏览器和 VNC

浏览器线路有两种模式：

- **Headless 自动化**：CI 默认模式。Chrome 启用 CDP 运行，Playwright 或 OpenClaw 浏览器控制会捕获截图。
- **VNC 救援**：当登录、MFA、Discord 反自动化或视觉调试需要人工介入时，在同一 VM 上启用。

Discord observer 浏览器 profile 应足够持久，避免每次运行都登录，但要与个人浏览器状态隔离。profile 属于 Mantis 机器池，不属于开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord 状态消息，包含：

- run id
- scenario id
- machine provider
- artifact directory
- 可用时的 VNC 或 noVNC 连接说明
- 简短阻塞原因文本

第一版私有部署可以把这些消息发布到现有操作员渠道，之后再迁移到专用 Mantis 渠道。

## 机器

第一版远程实现中，Mantis 应优先通过 Crabbox 使用 AWS。Crabbox 为我们提供预热机器、lease 跟踪、hydration、日志、结果和清理。如果 AWS 容量太慢或不可用，则在同一机器接口后添加 Hetzner 提供商。

最低 VM 要求：

- 安装了支持桌面能力的 Chrome 或 Chromium 的 Linux
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够的 CPU 和内存，用于一个 OpenClaw Gateway 网关、一个浏览器和一次模型运行
- 到 Discord、GitHub、模型提供商和凭证 broker 的出站访问

VM 不应在预期凭证或浏览器 profile 存储之外保留长期有效的原始密钥。

## 密钥

远程运行的密钥位于 GitHub 组织或仓库 secrets 中，本地运行的密钥位于本地操作员控制的 secret 文件中。

推荐 secret 名称：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` 用于公开 GitHub artifact 上传
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`

长期来看，Convex credential pool 应保持为实时传输凭证的常规来源。GitHub secrets 用于 bootstrap broker 和 fallback 线路。

Mantis runner 绝不能打印：

- Discord bot token
- 提供商 API key
- 浏览器 cookie
- auth profile 内容
- VNC 密码
- 原始凭证 payload

公开 artifact 上传也应脱敏 Discord 目标元数据，例如机器人、guild、渠道和消息 ID。GitHub smoke 工作流因此启用 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 被意外粘贴到 issue、PR、聊天或日志中，在新 secret 存储后轮换它。

## GitHub Artifact 和 PR 评论

第一版 GitHub 实现应将截图上传为 Actions artifact，并从 PR 评论中链接它们。待脱敏、保留策略和公开/私有仓库行为确定后，再支持内联图片。

PR 评论应简短：

```md
Mantis Discord verification: pass

- Scenario: `discord-status-reactions-tool-only`
- Baseline: reproduced on `<sha>`
- Candidate: fixed on `<sha>`
- Evidence: <artifact link>
- Screenshots: baseline and candidate message-row captures in the artifact
```

当运行失败是因为 harness 失败时，评论必须说明这一点，而不是暗示 candidate 失败。

## 私有部署说明

私有部署中可能已经有一个 Mantis Discord 应用。如果该应用具备正确的机器人权限并且可以安全轮换，请复用它，而不是创建另一个应用。

通过机密或部署配置设置初始操作员通知渠道。它可以先指向现有的维护者或运维渠道，然后在专用 Mantis 渠道存在后再迁移过去。

不要在本文档中放入 guild ID、渠道 ID、bot token、浏览器 cookie 或 VNC 密码。将它们存储在 GitHub 机密、凭证代理或操作员的本地机密存储中。

## 添加场景

Mantis 场景应声明：

- id 和标题
- 传输协议
- 必需凭证
- 基线 ref 策略
- 候选 ref 策略
- OpenClaw 配置补丁
- 设置步骤
- 触发输入
- 预期基线判据
- 预期候选判据
- 视觉捕获目标
- 超时预算
- 清理步骤

场景应优先使用小型、类型化的判据：

- 用于表情回应 bug 的 Discord 表情回应状态
- 用于消息串接 bug 的 Discord 消息引用
- 用于 Slack bug 的 Slack thread ts 和表情回应 API 状态
- 用于电子邮件 bug 的电子邮件消息 ID 和标头
- 当 UI 是唯一可靠可观测对象时的浏览器截图

视觉检查应作为补充。如果平台 API 能证明该 bug，就使用 API 作为通过/失败判据，并将截图保留用于增强人工信心。

## 提供商扩展

在 Discord 之后，同一个运行器可以添加：

- Slack：表情回应、线程、应用提及、模态框、文件上传。
- 电子邮件：在连接器不足时，使用 `gog` 进行 Gmail 凭证和消息串接。
- WhatsApp：二维码登录、重新识别、消息送达、媒体、表情回应。
- Telegram：群组提及门控、命令、可用时的表情回应。
- Matrix：加密房间、线程或回复关系、重启后恢复。

每种传输协议都应有一个低成本烟雾测试场景，以及一个或多个 bug 类别场景。高成本视觉场景应保持为选择性启用。

## 待解决问题

- 当复用现有 Mantis bot 时，哪个 Discord bot 应作为驱动方，哪个应作为被测系统？
- 第一阶段中，观察者浏览器登录应使用真人 Discord 账号、测试账号，还是仅使用 bot 可读的 REST 证据？
- GitHub 应为 PR 保留 Mantis 工件多久？
- ClawSweeper 何时应自动推荐 Mantis，而不是等待维护者命令？
- 对于公开 PR，截图是否应在上传前做脱敏或裁剪？
