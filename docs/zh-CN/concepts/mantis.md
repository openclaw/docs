---
read_when:
    - 为 OpenClaw 缺陷构建或运行实时可视化质量验证
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是用于在实时传输协议上复现 OpenClaw 缺陷、捕获前后对比证据并将工件附加到 PR 的可视化端到端验证系统。
title: Mantis
x-i18n:
    generated_at: "2026-05-04T01:25:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a86ab4bc876d1c53ada1c30580034165f028194a072f559eb54a898a369211d
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 端到端验证系统，用于需要真实运行时、真实传输协议和可见证明的 bug。它会针对一个已知有问题的 ref 运行场景、捕获证据，再针对候选 ref 运行相同场景，并将对比结果发布为工件，维护者可以从 PR 或本地命令中检查这些工件。

Mantis 从 Discord 开始，因为 Discord 为我们提供了一条高价值的首条通道：真实机器人凭证、真实公会频道、回应、帖子、原生命令，以及一个人类可以直观看到传输协议所展示内容的浏览器 UI。

## 目标

- 用用户看到的相同传输协议形态，复现来自 GitHub issue 或 PR 的 bug。
- 在应用修复之前，在基线 ref 上捕获一个 **before** 工件。
- 在应用修复之后，在候选 ref 上捕获一个 **after** 工件。
- 尽可能使用确定性判定器，例如读取 Discord REST 回应或检查频道记录。
- 当 bug 有可见 UI 表面时捕获截图。
- 从智能体控制的 CLI 本地运行，并从 GitHub 远程运行。
- 当登录、浏览器自动化或提供商凭证卡住时，保留足够的机器状态用于 VNC 救援。
- 当运行被阻塞、需要人工 VNC 协助或完成时，向操作员 Discord 频道发布简洁 Status。

## 非目标

- Mantis 不是单元测试的替代品。理解修复后，一次 Mantis 运行通常应转化为更小的回归测试。
- Mantis 不是常规的快速 CI 门禁。它更慢，使用实时凭证，并且只保留给实时环境很重要的 bug。
- Mantis 不应要求人类参与常规操作。手动 VNC 是救援路径，不是正常路径。
- Mantis 不会在工件、日志、截图、Markdown 报告或 PR 评论中存储原始密钥。

## 所有权

Mantis 位于 OpenClaw QA 栈中。

- OpenClaw 拥有场景运行时、传输协议适配器、证据 schema，以及 `pnpm openclaw qa mantis` 下的本地 CLI。
- QA Lab 拥有实时传输协议 harness 组件、浏览器捕获辅助工具和工件写入器。
- 当需要远程 VM 时，Crabbox 拥有预热的 Linux 机器。
- GitHub Actions 拥有远程工作流入口点和工件保留。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、分派工作流，并发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体会通过 Codex 驱动 Mantis。

该边界将传输协议知识保留在 OpenClaw 中，将机器调度保留在 Crabbox 中，并将维护者工作流胶水保留在 ClawSweeper 中。

## 命令形式

第一个本地命令会验证 Discord 机器人、公会、频道、消息发送、回应发送和工件路径：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本地 before 和 after 运行器接受以下形式：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

运行器会在输出目录下创建分离的基线和候选 worktree，安装依赖，构建每个 ref，使用 `--allow-failures` 运行场景，然后写入 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md`。对于第一个 Discord 场景，成功验证意味着基线 Status 为 `fail`，候选 Status 为 `pass`。

第一个 VM/浏览器原语是桌面 smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它会租用或复用一台 Crabbox 桌面机器，在 VNC 会话内启动可见浏览器，捕获桌面，将工件拉回本地输出目录，并将重连命令写入报告。该命令默认使用 Hetzner 提供商，因为它是 Mantis 通道中第一个具备可用桌面/VNC 覆盖的提供商。针对另一个 Crabbox 机群运行时，可使用 `--provider`、`--crabbox-bin` 或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆盖。

有用的桌面 smoke 标志：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 会复用预热的桌面。
- `--browser-url <url>` 会更改在可见浏览器中打开的页面。
- `--html-file <path>` 会在可见浏览器中渲染一个仓库本地 HTML 工件。Mantis 使用它通过真实 Crabbox 桌面捕获生成的 Discord Status 回应时间线。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 会让新创建且通过的 lease 保持打开，供 VNC 检查。失败运行在创建了 lease 时默认保留 lease，以便操作员可以重新连接。
- `--class`、`--idle-timeout` 和 `--ttl` 可调整机器规格和 lease 生命周期。

GitHub smoke 工作流是 `Mantis Discord Smoke`。第一个真实场景的 before 和 after GitHub 工作流是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期会复现仅 queued 行为的 ref。
- `candidate_ref`：预期会显示 `queued -> thinking -> done` 的 ref。

它会检出工作流 harness ref，构建独立的基线和候选 worktree，针对每个 worktree 运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 作为 Actions 工件上传。它还会在 Crabbox 桌面浏览器中渲染每条通道的时间线 HTML，并在 PR 评论中将这些 VNC 截图与确定性的时间线 PNG 一起发布。该工作流会从 `openclaw/crabbox` main 构建 Crabbox CLI，以便在下一个 Crabbox 二进制版本发布之前使用当前的桌面/浏览器 lease 标志。

你也可以直接从 PR 评论触发 Status 回应运行：

```text
@Mantis discord status reactions
```

评论触发器有意保持狭窄。它只会在具有 write、maintain 或 admin 访问权限的用户发布的拉取请求评论上运行，并且只识别 Discord Status 回应请求。默认情况下，它使用已知有问题的基线 ref，并将当前 PR head SHA 作为候选。维护者可以覆盖任一 ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一个命令是显式且聚焦场景的。第二个命令稍后可以根据标签、已更改文件和 ClawSweeper 评审发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭证。
2. 分配或复用 VM。
3. 当场景需要 UI 证据时，准备桌面/浏览器配置文件。
4. 为基线 ref 准备干净检出。
5. 安装依赖，并只构建场景需要的内容。
6. 使用隔离状态目录启动一个子 OpenClaw Gateway 网关。
7. 配置实时传输协议、提供商、模型和浏览器配置文件。
8. 运行场景并捕获基线证据。
9. 停止 Gateway 网关并保留日志。
10. 在同一 VM 中准备候选 ref。
11. 运行相同场景并捕获候选证据。
12. 比较判定器结果和视觉证据。
13. 写入 Markdown、JSON、日志、截图和可选 trace 工件。
14. 上传 GitHub Actions 工件。
15. 发布简洁的 PR 或 Discord Status 消息。

场景应能够以两种不同方式失败：

- **Bug 已复现**：基线以预期方式失败。
- **Harness 失败**：在 bug 判定器具有意义之前，环境设置、凭证、Discord API、浏览器或提供商失败。

最终报告必须区分这些情况，避免维护者将不稳定环境与产品行为混淆。

## Discord MVP

第一个场景应针对公会频道中的 Discord Status 回应，其中源回复投递模式为 `message_tool_only`。

它是一个好的 Mantis 种子，原因如下：

- 它在 Discord 中以触发消息上的回应形式可见。
- 它通过 Discord 消息回应状态提供强 REST 判定器。
- 它会覆盖真实 OpenClaw Gateway 网关、Discord 机器人凭证、消息分派、源回复投递模式、Status 回应状态和模型回合生命周期。
- 它足够狭窄，可以让首个实现保持可靠。

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

基线证据应显示 queued 确认回应，但在 tool-only 模式中没有生命周期转换。候选证据应显示当 `messages.statusReactions.enabled` 显式为 true 时运行的生命周期 Status 回应。

可执行的首个切片是选择启用的 Discord 实时 QA 场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

它会使用始终开启的公会处理、`visibleReplies: "message_tool"`、`ackReaction: "👀"` 和显式 Status 回应来配置 SUT。判定器会轮询真实 Discord 触发消息，并期望观察到的序列为 `👀 -> 🤔 -> 👍`。工件包括 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应基于现有私有 QA 栈构建，而不是从零开始：

- `pnpm openclaw qa discord` 已经使用 driver 和 SUT 机器人运行一个实时 Discord 通道。
- 实时传输协议运行器已经在 `.artifacts/qa-e2e/` 下写入报告和观测消息工件。
- Convex 凭证 lease 已经为共享实时传输协议凭证提供独占访问。
- 浏览器控制服务已经支持截图、快照、无头托管配置文件和远程 CDP 配置文件。
- QA Lab 已经有用于传输协议形态测试的调试器 UI 和总线。

第一个 Mantis 实现可以是在这些组件之上的薄 before/after 运行器，再加上一层视觉证据。

## 证据模型

每次运行都会写入稳定的工件目录：

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

`mantis-summary.json` 应是机器可读的事实来源。Markdown 报告用于 PR 评论和人工评审。

摘要必须包括：

- 测试过的 ref 和 SHA
- 传输协议和场景 id
- 机器提供商和机器 id 或 lease id
- 不含密钥值的凭证来源
- 基线结果
- 候选结果
- bug 是否已在基线上复现
- 候选是否修复了它
- 工件路径
- 已清理的设置或清理问题

截图是证据，不是密钥。它们仍需要遵守脱敏纪律：可能会出现私有频道名称、用户名或消息内容。对于公开 PR，在脱敏方案更完善之前，优先使用 GitHub Actions 工件链接，而不是内联图片。

## 浏览器和 VNC

浏览器通道有两种模式：

- **无头自动化**：CI 的默认模式。Chrome 启用 CDP 运行，并由 Playwright 或 OpenClaw 浏览器控制捕获截图。
- **VNC 救援**：当登录、MFA、Discord 反自动化或视觉调试需要人工介入时，在同一 VM 上启用。

Discord 观察者浏览器配置文件应足够持久，避免每次运行都要登录，但要与个人浏览器状态隔离。配置文件属于 Mantis 机器池，而不是开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord 状态消息，其中包含：

- 运行 ID
- 场景 ID
- 机器提供商
- 构件目录
- VNC 或 noVNC 连接说明（如果可用）
- 简短阻塞原因文本

首次私有部署可以先把这些消息发布到现有操作员渠道，之后再迁移到专用 Mantis 渠道。

## 机器

Mantis 的首个远程实现应优先通过 Crabbox 使用 AWS。Crabbox 为我们提供预热机器、租约跟踪、水合、日志、结果和清理。如果 AWS 容量太慢或不可用，请在同一机器接口后添加 Hetzner 提供商。

最低 VM 要求：

- Linux，并安装支持桌面的 Chrome 或 Chromium
- CDP 访问权限，用于浏览器自动化
- VNC 或 noVNC，用于救援
- Node 22 和 pnpm
- OpenClaw 检出和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够的 CPU 和内存，用于一个 OpenClaw Gateway 网关、一个浏览器和一次模型运行
- 可出站访问 Discord、GitHub、模型提供商和凭证代理

VM 不应在预期凭证或浏览器配置文件存储之外保留长期有效的原始密钥。

## 密钥

远程运行的密钥存放在 GitHub 组织或仓库密钥中，本地运行的密钥存放在由本地操作员控制的密钥文件中。

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
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

长期来看，Convex 凭证池应继续作为实时传输凭证的常规来源。GitHub 密钥用于引导代理和回退通道。Discord 状态反应工作流会把 Mantis Crabbox 密钥映射回 Crabbox CLI 预期的 `CRABBOX_COORDINATOR` 和 `CRABBOX_COORDINATOR_TOKEN` 环境变量。纯 `CRABBOX_*` GitHub 密钥名称仍会作为兼容性回退被接受。

Mantis 运行器绝不能打印：

- Discord 机器人令牌
- 提供商 API key
- 浏览器 Cookie
- 认证配置文件内容
- VNC 密码
- 原始凭证载荷

公开构件上传还应遮盖 Discord 目标元数据，例如机器人、服务器、频道和消息 ID。GitHub 烟测工作流因此启用了 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果令牌被意外粘贴到 issue、PR、聊天或日志中，请在新密钥存储完成后轮换该令牌。

## GitHub 构件和 PR 评论

Mantis 工作流应将完整证据包作为短期 Actions 构件上传。当工作流针对 bug 报告或修复 PR 运行时，还应将已遮盖的 PNG 截图发布到 `qa-artifacts` 分支，并在对应 bug 或修复 PR 上更新插入一条评论，内联展示修复前/修复后截图。不要只把主要证明发布在通用 QA 自动化 PR 上。原始日志、观察到的消息和其他体积较大的证据保留在 Actions 构件中。

生产工作流应使用 Mantis GitHub App 发布这些评论，而不是使用 `github-actions[bot]`。将应用 ID 和私钥作为 `MANTIS_GITHUB_APP_ID` 与 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions 密钥存储。工作流使用隐藏标记作为更新插入键；当令牌可以编辑评论时更新该评论；当较早的机器人所有标记无法编辑时，创建一条新的 Mantis 所有评论。

PR 评论应简短且视觉化：

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

私有部署可能已经有一个 Mantis Discord 应用。如果该应用具备正确的机器人权限并且可以安全轮换，请复用该应用，而不是再创建一个应用。

通过密钥或部署配置设置初始操作员通知渠道。它可以先指向现有维护者或运维渠道，等专用 Mantis 渠道存在后再迁移过去。

不要把服务器 ID、频道 ID、机器人令牌、浏览器 Cookie 或 VNC 密码放入本文档。请将它们存放在 GitHub 密钥、凭证代理或操作员的本地密钥存储中。

## 添加场景

Mantis 场景应声明：

- ID 和标题
- 传输协议
- 所需凭证
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

场景应优先使用小型、带类型的判定器：

- 用于反应 bug 的 Discord 反应状态
- 用于串线 bug 的 Discord 消息引用
- 用于 Slack bug 的 Slack 线程 ts 和反应 API 状态
- 用于电子邮件 bug 的电子邮件消息 ID 和标头
- 当 UI 是唯一可靠可观察对象时使用浏览器截图

视觉检查应是附加的。如果平台 API 可以证明 bug，请使用该 API 作为通过/失败判定器，并保留截图以增强人工信心。

## 提供商扩展

在 Discord 之后，同一运行器可以添加：

- Slack：反应、线程、应用提及、模态框、文件上传。
- 电子邮件：Gmail 认证，以及在连接器不足时使用 `gog` 进行消息串线。
- WhatsApp：二维码登录、重新识别、消息送达、媒体、反应。
- Telegram：群组提及门控、命令、反应（如可用）。
- Matrix：加密房间、线程或回复关系、重启恢复。

每种传输协议都应有一个低成本烟测场景，以及一个或多个 bug 类场景。昂贵的视觉场景应保持为选择性启用。

## 待解决问题

- 复用现有 Mantis 机器人时，哪个 Discord 机器人应作为驱动，哪个应作为 SUT？
- 第一阶段中，观察者浏览器登录应使用真人 Discord 账号、测试账号，还是仅使用机器人可读的 REST 证据？
- GitHub 应为 PR 保留 Mantis 构件多久？
- ClawSweeper 什么时候应自动推荐 Mantis，而不是等待维护者命令？
- 面向公开 PR 上传之前，截图是否应被遮盖或裁剪？
