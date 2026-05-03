---
read_when:
    - 为 OpenClaw 缺陷构建或运行实时可视化 QA
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是一个可视化端到端验证系统，用于在实时传输协议上复现 OpenClaw 缺陷，捕获修改前后的证据，并将工件附加到 PR。
title: Mantis
x-i18n:
    generated_at: "2026-05-03T17:21:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: a93378f980358d2687be13ade2db9d0eff8e64d92ca0ad0ee8f38deeb4786a6f
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 端到端验证系统，用于需要真实运行时、真实传输协议和可见证据的 bug。它会在已知有问题的 ref 上运行一个场景、捕获证据，再在候选 ref 上运行同一场景，并将对比结果发布为 artifact，维护者可从 PR 或本地命令检查。

Mantis 从 Discord 开始，因为 Discord 提供了一条高价值的首条线路：真实 bot 认证、真实公会频道、reaction、thread、原生命令，以及人类可用来视觉确认传输协议所展示内容的浏览器 UI。

## 目标

- 用用户看到的相同传输协议形态，复现来自 GitHub issue 或 PR 的 bug。
- 在应用修复前，在 baseline ref 上捕获 **before** artifact。
- 在应用修复后，在 candidate ref 上捕获 **after** artifact。
- 尽可能使用确定性的 oracle，例如 Discord REST reaction 读取或频道 transcript 检查。
- 当 bug 有可见 UI 表面时捕获截图。
- 从智能体控制的 CLI 在本地运行，并从 GitHub 远程运行。
- 当登录、浏览器自动化或提供商认证卡住时，保留足够的机器状态以便 VNC 救援。
- 当运行被阻塞、需要手动 VNC 帮助或完成时，向 operator Discord 频道发布简洁 Status。

## 非目标

- Mantis 不是单元测试的替代品。修复被理解后，Mantis 运行通常应转化为更小的回归测试。
- Mantis 不是常规快速 CI gate。它更慢、使用实时凭证，并且仅用于实时环境很重要的 bug。
- Mantis 不应要求人类参与常规操作。手动 VNC 是救援路径，而不是正常路径。
- Mantis 不会在 artifact、日志、截图、Markdown 报告或 PR 评论中存储原始密钥。

## 所有权

Mantis 位于 OpenClaw QA 栈中。

- OpenClaw 拥有场景运行时、传输协议适配器、证据 schema，以及 `pnpm openclaw qa mantis` 下的本地 CLI。
- QA Lab 拥有实时传输协议 harness 组件、浏览器捕获 helper 和 artifact 写入器。
- 当需要远程 VM 时，Crabbox 拥有已预热的 Linux 机器。
- GitHub Actions 拥有远程 workflow 入口点和 artifact 保留策略。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、分发 workflow，以及发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体通过 Codex 驱动 Mantis。

这个边界将传输协议知识保留在 OpenClaw 中，将机器调度保留在 Crabbox 中，并将维护者 workflow 粘合逻辑保留在 ClawSweeper 中。

## 命令形态

第一个本地命令会验证 Discord bot、公会、频道、消息发送、reaction 发送和 artifact 路径：

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

GitHub smoke workflow 是 `Mantis Discord Smoke`。第一个真实场景的 before 和 after GitHub workflow 是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期会复现 queued-only 行为的 ref。
- `candidate_ref`：预期会显示 `queued -> thinking -> done` 的 ref。

它会 checkout workflow harness ref，构建独立的 baseline 和 candidate worktree，针对每个 worktree 运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 上传为 Actions artifact。

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一个命令是明确且聚焦场景的。第二个命令后续可以根据 label、变更文件和 ClawSweeper review 发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭证。
2. 分配或复用 VM。
3. 为 baseline ref 准备干净的 checkout。
4. 安装依赖，并且只构建场景所需内容。
5. 使用隔离的状态目录启动子 OpenClaw Gateway 网关。
6. 配置实时传输协议、提供商、模型和浏览器 profile。
7. 运行场景并捕获 baseline 证据。
8. 停止 Gateway 网关并保留日志。
9. 在同一 VM 中准备 candidate ref。
10. 运行同一场景并捕获 candidate 证据。
11. 比较 oracle 结果和视觉证据。
12. 写入 Markdown、JSON、日志、截图和可选 trace artifact。
13. 上传 GitHub Actions artifact。
14. 发布简洁的 PR 或 Discord Status 消息。

场景应能以两种不同方式失败：

- **Bug reproduced**：baseline 以预期方式失败。
- **Harness failure**：环境设置、凭证、Discord API、浏览器或提供商在 bug oracle 有意义之前失败。

最终报告必须区分这些情况，以免维护者将不稳定环境误认为产品行为。

## Discord MVP

第一个场景应面向公会频道中的 Discord Status reaction，其中 source reply delivery mode 是 `message_tool_only`。

为什么它是一个好的 Mantis 种子：

- 它在 Discord 中以触发消息上的 reaction 可见。
- 它通过 Discord message reaction 状态拥有强 REST oracle。
- 它会覆盖真实 OpenClaw Gateway 网关、Discord bot 认证、消息分发、source reply delivery mode、Status reaction 状态和模型轮次生命周期。
- 它足够窄，能让第一个实现保持扎实。

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

Baseline 证据应显示 queued 确认 reaction，但在 tool-only mode 下没有生命周期转换。Candidate 证据应显示当 `messages.statusReactions.enabled` 显式为 true 时，生命周期 Status reaction 会运行。

可执行的第一片是 opt-in Discord live QA 场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

它会用 always-on guild handling、`visibleReplies:
"message_tool"`、`ackReaction: "👀"` 和显式 Status reaction 配置 SUT。oracle 会轮询真实的 Discord 触发消息，并期望观察到的序列为 `👀 -> 🤔 -> 👍`。Artifact 包括 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应基于现有私有 QA 栈构建，而不是从零开始：

- `pnpm openclaw qa discord` 已经使用 driver 和 SUT bot 运行实时 Discord lane。
- 实时传输协议 runner 已经在 `.artifacts/qa-e2e/` 下写入报告和 observed-message artifact。
- Convex credential lease 已经提供对共享实时传输协议凭证的独占访问。
- 浏览器控制服务已经支持截图、snapshot、headless managed profile 和远程 CDP profile。
- QA Lab 已经有用于传输协议形态测试的 debugger UI 和 bus。

第一个 Mantis 实现可以是在这些组件之上的轻量 before/after runner，再加一个视觉证据层。

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

- 测试过的 ref 和 SHA
- 传输协议和场景 id
- 机器提供商以及机器 id 或 lease id
- 不含密钥值的凭证来源
- baseline 结果
- candidate 结果
- bug 是否在 baseline 上复现
- candidate 是否修复了它
- artifact 路径
- 已清理敏感信息的设置或清理问题

截图是证据，不是密钥。它们仍然需要遵守脱敏规范：私有频道名称、用户名或消息内容可能会出现。对于公开 PR，在脱敏方案更完善之前，优先使用 GitHub Actions artifact 链接，而不是内联图片。

## 浏览器和 VNC

浏览器 lane 有两种模式：

- **Headless automation**：CI 默认模式。Chrome 启用 CDP 运行，Playwright 或 OpenClaw 浏览器控制捕获截图。
- **VNC rescue**：当登录、MFA、Discord 反自动化或视觉调试需要人类时，在同一 VM 上启用。

Discord observer 浏览器 profile 应足够持久，避免每次运行都登录，但要与个人浏览器状态隔离。profile 属于 Mantis 机器池，不属于开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord Status 消息，包含：

- run id
- scenario id
- 机器提供商
- artifact 目录
- 可用时的 VNC 或 noVNC 连接说明
- 简短阻塞说明

第一个私有部署可以将这些消息发布到现有 operator 频道，后续再迁移到专用 Mantis 频道。

## 机器

Mantis 的第一个远程实现应优先通过 Crabbox 使用 AWS。Crabbox 为我们提供已预热机器、lease tracking、hydration、日志、结果和清理。如果 AWS 容量太慢或不可用，则在相同机器接口后添加 Hetzner 提供商。

最低 VM 要求：

- Linux，并安装支持桌面的 Chrome 或 Chromium
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够运行一个 OpenClaw Gateway 网关、一个浏览器和一次模型运行的 CPU 与内存
- 到 Discord、GitHub、模型提供商和凭证 broker 的出站访问

VM 不应在预期凭证或浏览器 profile 存储之外保留长期存在的原始密钥。

## 密钥

远程运行的密钥位于 GitHub organization 或 repository secrets 中，本地运行的密钥位于由本地 operator 控制的 secret 文件中。

推荐的 secret 名称：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`，用于公开 GitHub artifact 上传
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`

长期来看，Convex 凭证池应继续作为实时传输协议凭证的常规来源。GitHub secrets 用于 bootstrap broker 和 fallback lane。

Mantis runner 绝不能打印：

- Discord bot token
- 提供商 API key
- 浏览器 cookie
- auth profile 内容
- VNC 密码
- 原始凭证 payload

公开 artifact 上传还应对 Discord 目标元数据进行脱敏，例如 bot、公会、频道和消息 id。GitHub smoke workflow 因此启用了 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 被意外粘贴到 issue、PR、chat 或日志中，请在新 secret 存储后轮换它。

## GitHub Artifact 和 PR 评论

Mantis 工作流应将完整证据包上传为短期有效的 Actions 工件。当工作流为错误报告或修复 PR 运行时，还应将已脱敏的 PNG 截图发布到 `qa-artifacts` 分支，并在该错误报告或修复 PR 上更新或插入一条评论，内嵌修复前/后的截图。不要只把主要证明发布在通用 QA 自动化 PR 上。原始日志、观测到的消息和其他体积较大的证据保留在 Actions 工件中。

生产工作流应使用 Mantis GitHub App 发布这些评论，而不是使用 `github-actions[bot]`。将应用 ID 和私钥存储为 `MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions 机密。工作流应在已有 Mantis 拥有的评论时更新它；如果只存在较旧的 `github-actions[bot]` 评论，则应创建一条新的 Mantis 拥有的评论，而不是重写旧版机器人评论。

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

当运行因 harness 失败而失败时，评论必须说明这一点，而不是暗示候选修复失败。

## 私有部署说明

私有部署可能已经有一个 Mantis Discord 应用。当该应用具备正确的机器人权限并且可以安全轮换时，复用该应用，而不是创建另一个应用。

通过机密或部署配置设置初始操作员通知渠道。它可以先指向现有维护者或运维渠道，等专用 Mantis 渠道存在后再迁移过去。

不要在本文档中放入服务器 ID、渠道 ID、机器人令牌、浏览器 Cookie 或 VNC 密码。将它们存储在 GitHub 机密、凭证代理或操作员的本地机密存储中。

## 添加场景

Mantis 场景应声明：

- ID 和标题
- 传输协议
- 必需凭证
- 基线 ref 策略
- 候选 ref 策略
- OpenClaw 配置补丁
- 设置步骤
- 刺激输入
- 预期基线判定器
- 预期候选判定器
- 视觉捕获目标
- 超时预算
- 清理步骤

场景应优先使用小型、类型化的判定器：

- 用于反应错误的 Discord 反应状态
- 用于线程错误的 Discord 消息引用
- 用于 Slack 错误的 Slack 线程 `ts` 和反应 API 状态
- 用于电子邮件错误的电子邮件消息 ID 和标头
- 当 UI 是唯一可靠可观测对象时使用浏览器截图

视觉检查应作为附加手段。如果平台 API 能证明错误，就使用 API 作为通过/失败判定器，并保留截图以增强人工信心。

## 提供商扩展

在 Discord 之后，同一个运行器可以添加：

- Slack：反应、线程、应用提及、模态窗口、文件上传。
- 电子邮件：在连接器不足时，使用 `gog` 进行 Gmail 认证和消息线程处理。
- WhatsApp：二维码登录、重新识别、消息投递、媒体、反应。
- Telegram：群组提及门控、命令、可用时的反应。
- Matrix：加密房间、线程或回复关系、重启恢复。

每种传输协议都应有一个低成本冒烟场景，以及一个或多个错误类别场景。昂贵的视觉场景应保持为可选启用。

## 未决问题

- 复用现有 Mantis 机器人时，哪个 Discord 机器人应作为驱动方，哪个应作为被测系统？
- 观察者浏览器登录在第一阶段应使用真人 Discord 账户、测试账户，还是仅使用机器人可读的 REST 证据？
- GitHub 应为 PR 保留 Mantis 工件多长时间？
- ClawSweeper 应在何时自动推荐 Mantis，而不是等待维护者命令？
- 针对公开 PR，截图在上传前是否应脱敏或裁剪？
