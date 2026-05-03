---
read_when:
    - 针对 OpenClaw 缺陷构建或运行实时视觉 QA
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是用于在实时传输协议上复现 OpenClaw 缺陷、捕获前后证据，并将工件附加到拉取请求的可视化端到端验证系统。
title: Mantis
x-i18n:
    generated_at: "2026-05-03T16:48:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b58934ec88a640745f7430c875c377e898f87f1b3d4a9ef03115395084664f5
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 的端到端验证系统，适用于需要真实运行时、真实传输协议和可见证明的缺陷。它会针对已知有问题的 ref 运行一个场景并捕获证据，再针对候选 ref 运行相同场景，然后将对比结果发布为构件，维护者可以从 PR 或本地命令中检查这些构件。

Mantis 从 Discord 开始，因为 Discord 为我们提供了一条高价值的首个通道：真实机器人凭证、真实公会渠道、回应、线程、原生命令，以及人类可以直观确认传输协议展示内容的浏览器 UI。

## 目标

- 使用用户看到的相同传输形态，从 GitHub 问题或 PR 中复现缺陷。
- 在应用修复之前，在基线 ref 上捕获一个 **before** 构件。
- 在应用修复之后，在候选 ref 上捕获一个 **after** 构件。
- 尽可能使用确定性的判定器，例如 Discord REST 回应读取或渠道转录检查。
- 当缺陷有可见 UI 表面时捕获截图。
- 从智能体控制的 CLI 在本地运行，并从 GitHub 远程运行。
- 当登录、浏览器自动化或提供商凭证卡住时，保留足够的机器状态以便 VNC 救援。
- 当运行被阻塞、需要手动 VNC 帮助或完成时，向操作员 Discord 渠道发布简洁状态。

## 非目标

- Mantis 不是单元测试的替代品。理解修复后，Mantis 运行通常应该转化为更小的回归测试。
- Mantis 不是常规的快速 CI 门禁。它更慢、使用实时凭证，并且只保留给实时环境重要的缺陷。
- Mantis 的正常运行不应该需要人类介入。手动 VNC 是救援路径，不是理想路径。
- Mantis 不会在构件、日志、截图、Markdown 报告或 PR 评论中存储原始密钥。

## 所有权

Mantis 位于 OpenClaw QA 栈中。

- OpenClaw 拥有场景运行时、传输协议适配器、证据 schema，以及 `pnpm openclaw qa mantis` 下的本地 CLI。
- QA Lab 拥有实时传输协议 harness 组件、浏览器捕获辅助工具和构件写入器。
- 需要远程 VM 时，Crabbox 拥有预热的 Linux 机器。
- GitHub Actions 拥有远程工作流入口点和构件保留。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、调度工作流，以及发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体通过 Codex 驱动 Mantis。

这个边界将传输协议知识保留在 OpenClaw 中，将机器调度保留在 Crabbox 中，并将维护者工作流粘合逻辑保留在 ClawSweeper 中。

## 命令形态

第一个本地命令会验证 Discord 机器人、公会、渠道、消息发送、回应发送和构件路径：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

后续的前后对比运行器应该接受这种形态：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

GitHub 冒烟工作流是 `Mantis Discord Smoke`。第一个真实场景的前后对比 GitHub 工作流是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期会复现仅 queued 行为的 ref。
- `candidate_ref`：预期会显示 `queued -> thinking -> done` 的 ref。

它会检出工作流 harness ref，构建独立的基线和候选 worktree，分别针对每个 worktree 运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 作为 Actions 构件上传。

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一个命令明确且聚焦于场景。第二个命令之后可以根据标签、变更文件和 ClawSweeper 审查发现，将 PR 或问题映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭证。
2. 分配或复用 VM。
3. 为基线 ref 准备一个干净检出。
4. 安装依赖，并只构建场景需要的内容。
5. 使用隔离的状态目录启动一个子 OpenClaw Gateway 网关。
6. 配置实时传输协议、提供商、模型和浏览器配置文件。
7. 运行场景并捕获基线证据。
8. 停止 Gateway 网关并保留日志。
9. 在同一个 VM 中准备候选 ref。
10. 运行相同场景并捕获候选证据。
11. 比较判定器结果和视觉证据。
12. 写入 Markdown、JSON、日志、截图和可选 trace 构件。
13. 上传 GitHub Actions 构件。
14. 发布简洁的 PR 或 Discord 状态消息。

场景应该能够以两种不同方式失败：

- **已复现缺陷**：基线以预期方式失败。
- **Harness 失败**：环境设置、凭证、Discord API、浏览器或提供商在缺陷判定器有意义之前失败。

最终报告必须区分这些情况，确保维护者不会把不稳定的环境与产品行为混淆。

## Discord MVP

第一个场景应该针对公会渠道中的 Discord 状态回应，其中源回复投递模式为 `message_tool_only`。

它适合作为 Mantis 起点的原因：

- 它在 Discord 中表现为触发消息上的回应，具有可见性。
- 它通过 Discord 消息回应状态提供强 REST 判定器。
- 它会覆盖真实的 OpenClaw Gateway 网关、Discord 机器人凭证、消息分发、源回复投递模式、状态回应状态和模型轮次生命周期。
- 它足够窄，可以让第一个实现保持诚实。

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

基线证据应该显示 queued 确认回应，但在仅工具模式下没有生命周期转换。候选证据应该显示当 `messages.statusReactions.enabled` 被显式设为 true 时，生命周期状态回应会运行。

可执行的第一个切片是选择启用的 Discord 实时 QA 场景：

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
"message_tool"`、`ackReaction: "👀"` 和显式状态回应。判定器会轮询真实的 Discord 触发消息，并预期观察到序列 `👀 -> 🤔 -> 👍`。构件包括 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应该构建在现有私有 QA 栈之上，而不是从零开始：

- `pnpm openclaw qa discord` 已经运行一条带 driver 和 SUT 机器人的实时 Discord 通道。
- 实时传输协议运行器已经在 `.artifacts/qa-e2e/` 下写入报告和观测消息构件。
- Convex 凭证租约已经提供对共享实时传输协议凭证的独占访问。
- 浏览器控制服务已经支持截图、快照、无头托管配置文件和远程 CDP 配置文件。
- QA Lab 已经拥有用于传输协议形态测试的调试器 UI 和总线。

第一个 Mantis 实现可以是在这些组件之上的一层很薄的前后对比运行器，再加上一层视觉证据。

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

`mantis-summary.json` 应该是机器可读的事实来源。Markdown 报告用于 PR 评论和人工审查。

摘要必须包括：

- 测试的 ref 和 SHA
- 传输协议和场景 ID
- 机器提供商以及机器 ID 或租约 ID
- 不含密钥值的凭证来源
- 基线结果
- 候选结果
- 缺陷是否在基线上复现
- 候选是否修复了它
- 构件路径
- 已清理的设置或清理问题

截图是证据，不是密钥。它们仍然需要遵守脱敏纪律：私有渠道名称、用户名或消息内容可能会出现。对于公开 PR，在脱敏方案更成熟之前，优先使用 GitHub Actions 构件链接，而不是内联图片。

## 浏览器和 VNC

浏览器通道有两种模式：

- **无头自动化**：CI 的默认模式。Chrome 启用 CDP 运行，Playwright 或 OpenClaw 浏览器控制会捕获截图。
- **VNC 救援**：当登录、MFA、Discord 反自动化或视觉调试需要人类介入时，在同一个 VM 上启用。

Discord 观察者浏览器配置文件应该足够持久，以避免每次运行都登录，但要与个人浏览器状态隔离。配置文件属于 Mantis 机器池，而不是开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord 状态消息，其中包含：

- 运行 ID
- 场景 ID
- 机器提供商
- 构件目录
- VNC 或 noVNC 连接说明（如果可用）
- 简短阻塞原因文本

第一个私有部署可以将这些消息发布到现有操作员渠道，之后再迁移到专用 Mantis 渠道。

## 机器

第一个远程实现中，Mantis 应优先通过 Crabbox 使用 AWS。Crabbox 为我们提供预热机器、租约跟踪、环境补水、日志、结果和清理。如果 AWS 容量太慢或不可用，就在相同机器接口后添加 Hetzner 提供商。

最低 VM 要求：

- Linux，安装了具备桌面能力的 Chrome 或 Chromium
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw 检出和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够运行一个 OpenClaw Gateway 网关、一个浏览器和一次模型运行的 CPU 与内存
- 对 Discord、GitHub、模型提供商和凭证代理的出站访问

VM 不应在预期凭证或浏览器配置文件存储之外保留长期存在的原始密钥。

## 密钥

远程运行的密钥位于 GitHub 组织或仓库密钥中，本地运行的密钥位于本地操作员控制的密钥文件中。

推荐的密钥名称：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`，用于公开 GitHub 构件上传
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`

长期来看，Convex 凭证池应继续作为实时传输协议凭证的常规来源。GitHub 密钥用于引导代理和回退通道。

Mantis 运行器绝不能打印：

- Discord 机器人 token
- 提供商 API key
- 浏览器 cookie
- 凭证配置文件内容
- VNC 密码
- 原始凭证载荷

公开构件上传还应脱敏 Discord 目标元数据，例如机器人、公会、渠道和消息 ID。GitHub 冒烟工作流因此启用了 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 被意外粘贴到问题、PR、聊天或日志中，请在新密钥存储后轮换它。

## GitHub 构件和 PR 评论

Mantis 工作流应将完整证据包作为短期 Actions 工件上传。当工作流针对错误报告或修复 PR 运行时，它还应将已脱敏的 PNG 截图发布到 `qa-artifacts` 分支，并在该错误或修复 PR 上插入或更新一条评论，内联展示修复前/修复后的截图。不要只把主要证明发布在通用 QA 自动化 PR 上。原始日志、观测到的消息和其他体量较大的证据保留在 Actions 工件中。

PR 评论应简短且偏视觉化：

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

当运行失败是因为 harness 失败时，评论必须说明这一点，而不是暗示候选修复失败。

## 私有部署说明

私有部署可能已经有一个 Mantis Discord 应用。当该应用具备正确的机器人权限并且可以安全轮换时，复用该应用，而不是再创建一个应用。

通过密钥或部署配置设置初始操作员通知渠道。它可以先指向现有的维护者或运维渠道，然后在专用 Mantis 渠道存在后再迁移过去。

不要将服务器 ID、渠道 ID、机器人令牌、浏览器 Cookie 或 VNC 密码放入本文档。请将它们存储在 GitHub 密钥、凭证代理或操作员的本地密钥存储中。

## 添加场景

Mantis 场景应声明：

- ID 和标题
- 传输协议
- 所需凭证
- 基线 ref 策略
- 候选 ref 策略
- OpenClaw 配置补丁
- 设置步骤
- 触发输入
- 预期基线判定依据
- 预期候选判定依据
- 视觉捕获目标
- 超时预算
- 清理步骤

场景应优先使用小型、类型化的判定依据：

- 用于回应错误的 Discord 回应状态
- 用于话题串错误的 Discord 消息引用
- 用于 Slack 错误的 Slack 线程 ts 和回应 API 状态
- 用于邮件错误的电子邮件消息 ID 和标头
- 当 UI 是唯一可靠的可观测对象时，使用浏览器截图

视觉检查应作为补充。如果平台 API 可以证明错误，就使用 API 作为通过/失败判定依据，并保留截图以增强人工信心。

## 提供商扩展

在 Discord 之后，同一个 runner 可以添加：

- Slack：回应、线程、应用提及、模态框、文件上传。
- 电子邮件：在连接器不足时，使用 `gog` 进行 Gmail 凭证和消息话题串处理。
- WhatsApp：二维码登录、重新识别、消息送达、媒体、回应。
- Telegram：群组提及门控、命令、可用时的回应。
- Matrix：加密房间、线程或回复关系、重启后恢复。

每种传输协议都应有一个低成本冒烟场景，以及一个或多个错误类别场景。昂贵的视觉场景应保持为可选启用。

## 待解问题

- 当复用现有 Mantis 机器人时，哪个 Discord 机器人应作为驱动方，哪个应作为 SUT？
- 第一阶段的观察者浏览器登录应使用真人 Discord 账号、测试账号，还是只使用机器人可读的 REST 证据？
- GitHub 应为 PR 保留 Mantis 工件多长时间？
- ClawSweeper 何时应自动推荐 Mantis，而不是等待维护者命令？
- 公开 PR 上传前，截图是否应脱敏或裁剪？
