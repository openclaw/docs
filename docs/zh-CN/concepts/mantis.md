---
read_when:
    - 为 OpenClaw 缺陷构建或运行实时视觉 QA
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是用于在实时传输协议上复现 OpenClaw 缺陷、捕获前后对比证据，并将产物附加到 PR 的视觉端到端验证系统。
title: Mantis
x-i18n:
    generated_at: "2026-05-03T20:39:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3463882b01a7941f6d758c509d6cd70e099aa8352053347fa9c37a80e5b256ce
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 端到端验证系统，用于需要真实运行时、真实传输协议和可见证明的错误。它会针对已知有问题的 ref 运行场景，捕获证据，再针对候选 ref 运行相同场景，并将比较结果发布为制品，维护者可以从 PR 或本地命令中检查这些制品。

Mantis 从 Discord 开始，因为 Discord 提供了一个高价值的首条通道：真实机器人认证、真实公会渠道、回应、帖子、原生命令，以及人类可视化确认传输协议显示内容的浏览器 UI。

## 目标

- 使用用户看到的相同传输协议形态，从 GitHub issue 或 PR 复现错误。
- 在应用修复之前，在基线 ref 上捕获 **before** 制品。
- 在应用修复之后，在候选 ref 上捕获 **after** 制品。
- 尽可能使用确定性 oracle，例如 Discord REST 回应读取或渠道转录检查。
- 当错误有可见 UI 表面时捕获截图。
- 从智能体控制的 CLI 本地运行，也可从 GitHub 远程运行。
- 当登录、浏览器自动化或提供商认证卡住时，保留足够的机器状态以便 VNC 救援。
- 当运行被阻塞、需要手动 VNC 帮助或完成时，向操作员 Discord 渠道发布简明 Status。

## 非目标

- Mantis 不是单元测试的替代品。Mantis 运行通常应在理解修复后转化为更小的回归测试。
- Mantis 不是常规快速 CI 门禁。它更慢，使用实时凭证，并且仅用于实时环境很重要的错误。
- Mantis 不应要求人类参与常规操作。手动 VNC 是救援路径，不是理想路径。
- Mantis 不会在制品、日志、截图、Markdown 报告或 PR 评论中存储原始密钥。

## 所有权

Mantis 位于 OpenClaw QA 栈中。

- OpenClaw 拥有场景运行时、传输协议适配器、证据 schema，以及 `pnpm openclaw qa mantis` 下的本地 CLI。
- QA Lab 拥有实时传输协议 harness 组件、浏览器捕获辅助工具和制品写入器。
- 当需要远程 VM 时，Crabbox 拥有已预热的 Linux 机器。
- GitHub Actions 拥有远程 workflow 入口点和制品保留。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、分发 workflow，以及发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体通过 Codex 驱动 Mantis。

此边界将传输协议知识保留在 OpenClaw 中，将机器调度保留在 Crabbox 中，将维护者 workflow 粘合逻辑保留在 ClawSweeper 中。

## 命令形态

第一个本地命令会验证 Discord 机器人、公会、渠道、消息发送、回应发送和制品路径：

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

GitHub smoke workflow 是 `Mantis Discord Smoke`。第一个真实场景的 before 和 after GitHub workflow 是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期会复现仅 queued 行为的 ref。
- `candidate_ref`：预期会显示 `queued -> thinking -> done` 的 ref。

它会签出 workflow harness ref，构建独立的基线和候选 worktree，针对每个 worktree 运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 作为 Actions 制品上传。

你也可以直接从 PR 评论触发 status-reactions 运行：

```text
@Mantis discord status reactions
```

评论触发器有意保持狭窄。它仅在具有 write、maintain 或 admin 访问权限的用户发出的 pull request 评论上运行，并且只识别 Discord 状态回应请求。默认情况下，它使用已知有问题的基线 ref 和当前 PR head SHA 作为候选。维护者可以覆盖任一 ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一个命令是显式且聚焦场景的。第二个命令以后可以根据标签、变更文件和 ClawSweeper 审查发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭证。
2. 分配或复用 VM。
3. 为基线 ref 准备干净的 checkout。
4. 安装依赖，并且只构建场景需要的内容。
5. 使用隔离的状态目录启动子 OpenClaw Gateway 网关。
6. 配置实时传输协议、提供商、模型和浏览器配置文件。
7. 运行场景并捕获基线证据。
8. 停止 Gateway 网关并保留日志。
9. 在同一 VM 中准备候选 ref。
10. 运行相同场景并捕获候选证据。
11. 比较 oracle 结果和视觉证据。
12. 写入 Markdown、JSON、日志、截图和可选 trace 制品。
13. 上传 GitHub Actions 制品。
14. 发布简明 PR 或 Discord Status 消息。

场景应能够以两种不同方式失败：

- **错误已复现**：基线以预期方式失败。
- **Harness 失败**：环境设置、凭证、Discord API、浏览器或提供商在错误 oracle 具有意义之前失败。

最终报告必须区分这些情况，以便维护者不会将不稳定环境误认为产品行为。

## Discord MVP

第一个场景应针对公会渠道中的 Discord 状态回应，其中源回复投递模式为 `message_tool_only`。

它是很好的 Mantis 种子，原因如下：

- 它在 Discord 中表现为触发消息上的回应，可见。
- 它通过 Discord 消息回应状态提供强 REST oracle。
- 它会演练真实的 OpenClaw Gateway 网关、Discord 机器人认证、消息分发、源回复投递模式、状态回应状态和模型轮次生命周期。
- 它足够狭窄，可以让第一个实现保持明确。

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

基线证据应显示 queued 确认回应，但在 tool-only 模式下没有生命周期转换。候选证据应显示在 `messages.statusReactions.enabled` 显式为 true 时，生命周期状态回应正在运行。

第一个可执行切片是选择加入的 Discord 实时 QA 场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

它会使用始终开启的公会处理、`visibleReplies: "message_tool"`、`ackReaction: "👀"` 和显式状态回应配置 SUT。oracle 会轮询真实的 Discord 触发消息，并期望观察到序列 `👀 -> 🤔 -> 👍`。制品包括 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应基于现有私有 QA 栈构建，而不是从零开始：

- `pnpm openclaw qa discord` 已经使用 driver 和 SUT 机器人运行实时 Discord 通道。
- 实时传输协议运行器已经在 `.artifacts/qa-e2e/` 下写入报告和 observed-message 制品。
- Convex 凭证租约已经为共享实时传输协议凭证提供独占访问。
- 浏览器控制服务已经支持截图、快照、headless 托管配置文件和远程 CDP 配置文件。
- QA Lab 已经拥有用于传输协议形态测试的调试器 UI 和总线。

第一个 Mantis 实现可以是在这些组件之上的一层很薄的 before/after 运行器，再加一个视觉证据层。

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

- 测试的 refs 和 SHA
- 传输协议和场景 id
- 机器提供商以及机器 id 或租约 id
- 不包含密钥值的凭证来源
- 基线结果
- 候选结果
- 错误是否在基线上复现
- 候选是否修复了它
- 制品路径
- 经过清理的设置或清理问题

截图是证据，不是密钥。它们仍然需要遵守脱敏纪律：私有渠道名称、用户名或消息内容可能会出现。对于公开 PR，在脱敏方案更成熟之前，优先使用 GitHub Actions 制品链接，而不是内联图片。

## 浏览器和 VNC

浏览器通道有两种模式：

- **Headless 自动化**：CI 默认模式。Chrome 启用 CDP 运行，Playwright 或 OpenClaw 浏览器控制会捕获截图。
- **VNC 救援**：当登录、MFA、Discord 反自动化或视觉调试需要人类参与时，在同一 VM 上启用。

Discord 观察者浏览器配置文件应足够持久，以避免每次运行都登录，但应与个人浏览器状态隔离。配置文件属于 Mantis 机器池，而不是开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord Status 消息，其中包含：

- 运行 id
- 场景 id
- 机器提供商
- 制品目录
- 可用时的 VNC 或 noVNC 连接说明
- 简短阻塞文本

第一个私有部署可以将这些消息发布到现有操作员渠道，之后再迁移到专用 Mantis 渠道。

## 机器

第一个远程实现中，Mantis 应优先通过 Crabbox 使用 AWS。Crabbox 为我们提供已预热机器、租约跟踪、水合、日志、结果和清理。如果 AWS 容量太慢或不可用，则在同一机器接口后添加 Hetzner 提供商。

最低 VM 要求：

- 安装了支持桌面的 Chrome 或 Chromium 的 Linux
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够的 CPU 和内存，可运行一个 OpenClaw Gateway 网关、一个浏览器和一次模型运行
- 可出站访问 Discord、GitHub、模型提供商和凭证 broker

VM 不应在预期凭证或浏览器配置文件存储之外保留长期存在的原始密钥。

## 密钥

远程运行的密钥存放在 GitHub 组织或仓库密钥中，本地运行的密钥存放在本地操作员控制的密钥文件中。

推荐的密钥名称：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` 用于公开 GitHub 工件上传
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`

从长期来看，Convex 凭证池应继续作为实时传输凭证的常规来源。GitHub 密钥用于引导代理和回退通道。

Mantis 运行器绝不能打印：

- Discord 机器人令牌
- 提供商 API 密钥
- 浏览器 Cookie
- 认证配置文件内容
- VNC 密码
- 原始凭证载荷

公开工件上传还应遮蔽 Discord 目标元数据，例如机器人、服务器、渠道和消息 ID。GitHub smoke 工作流因此会启用 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果令牌被意外粘贴到 issue、PR、聊天或日志中，请在新密钥存储完成后轮换它。

## GitHub 工件和 PR 评论

Mantis 工作流应将完整证据包上传为短期 Actions 工件。当工作流针对错误报告或修复 PR 运行时，还应将已遮蔽的 PNG 截图发布到 `qa-artifacts` 分支，并在该错误或修复 PR 上更新或插入一条评论，内联展示前后对比截图。不要只把主要证明发布在通用 QA 自动化 PR 上。原始日志、观测到的消息以及其他体量较大的证据保留在 Actions 工件中。

生产工作流应使用 Mantis GitHub App 发布这些评论，而不是使用 `github-actions[bot]`。将应用 ID 和私钥作为 `MANTIS_GITHUB_APP_ID` 与 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions 密钥存储。该工作流使用隐藏标记作为更新插入键，在令牌可以编辑时更新该评论，并在较旧的机器人所有标记无法编辑时创建一条新的 Mantis 所有评论。

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

当运行失败是因为 harness 失败时，评论必须说明这一点，而不是暗示候选版本失败。

## 私有部署说明

私有部署可能已经有一个 Mantis Discord 应用。当该应用拥有正确的机器人权限并且可以安全轮换时，请复用该应用，而不是创建另一个应用。

通过密钥或部署配置设置初始操作者通知渠道。它可以先指向现有维护者或运维渠道，然后在专用 Mantis 渠道存在后再迁移过去。

不要把服务器 ID、渠道 ID、机器人令牌、浏览器 Cookie 或 VNC 密码放入本文档。请将它们存储在 GitHub 密钥、凭证代理或操作者的本地密钥存储中。

## 添加场景

Mantis 场景应声明：

- ID 和标题
- 传输协议
- 必需凭证
- 基线引用策略
- 候选引用策略
- OpenClaw 配置补丁
- 设置步骤
- 激励
- 预期基线判定器
- 预期候选判定器
- 可视化采集目标
- 超时预算
- 清理步骤

场景应优先使用小型、带类型的判定器：

- 用于 reaction 错误的 Discord reaction 状态
- 用于线程错误的 Discord 消息引用
- 用于 Slack 错误的 Slack 线程 ts 和 reaction API 状态
- 用于电子邮件错误的电子邮件消息 ID 和标头
- 当 UI 是唯一可靠可观测对象时使用浏览器截图

视觉检查应作为补充。如果平台 API 可以证明错误，请使用该 API 作为通过/失败判定器，并保留截图用于增强人的信心。

## 提供商扩展

在 Discord 之后，同一个运行器可以添加：

- Slack：reaction、线程、应用提及、模态框、文件上传。
- 电子邮件：在连接器不足时，使用 `gog` 进行 Gmail 认证和消息线程处理。
- WhatsApp：二维码登录、重新识别、消息投递、媒体、reaction。
- Telegram：群组提及门控、命令、可用时的 reaction。
- Matrix：加密房间、线程或回复关系、重启恢复。

每种传输协议都应有一个低成本 smoke 场景，以及一个或多个错误类别场景。昂贵的可视化场景应保持为选择加入。

## 未决问题

- 复用现有 Mantis 机器人时，哪个 Discord 机器人应作为驱动，哪个应作为 SUT？
- 第一阶段中，观察者浏览器登录应使用人类 Discord 账号、测试账号，还是只使用机器人可读的 REST 证据？
- GitHub 应为 PR 保留 Mantis 工件多长时间？
- ClawSweeper 应在什么时候自动推荐 Mantis，而不是等待维护者命令？
- 对于公开 PR，截图在上传前是否应被遮蔽或裁剪？
