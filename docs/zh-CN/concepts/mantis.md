---
read_when:
    - 构建或运行针对 OpenClaw 缺陷的实时视觉 QA
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输协议场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是一个可视化端到端验证系统，用于在实时传输协议上复现 OpenClaw bug、捕获前后证据，并将制品附加到拉取请求中。
title: Mantis
x-i18n:
    generated_at: "2026-05-04T01:17:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b32fdfed4ebf75083b4ca24fd41a800924c67918d2c969fa108639583284d84
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 端到端验证系统，面向需要真实运行时、真实传输协议和可见证明的 bug。它会针对已知坏 ref 运行一个场景，捕获证据，再针对候选 ref 运行同一场景，并将对比结果发布为构件，维护者可从 PR 或本地命令中检查。

Mantis 从 Discord 开始，因为 Discord 为我们提供了一条高价值的首个验证通道：真实 bot 凭证、真实服务器渠道、reaction、thread、原生命令，以及一个浏览器 UI，让人可以目视确认传输协议展示了什么。

## 目标

- 使用用户看到的同样传输协议形态，复现 GitHub issue 或 PR 中的 bug。
- 在应用修复之前，在基线 ref 上捕获一个**修复前**构件。
- 在应用修复之后，在候选 ref 上捕获一个**修复后**构件。
- 尽可能使用确定性的判定器，例如 Discord REST reaction 读取或渠道 transcript 检查。
- 当 bug 有可见 UI 表面时捕获截图。
- 通过智能体控制的 CLI 在本地运行，并通过 GitHub 远程运行。
- 当登录、浏览器自动化或提供商凭证卡住时，保留足够的机器状态用于 VNC 救援。
- 当运行被阻塞、需要人工 VNC 帮助或完成时，向操作员 Discord 渠道发布简洁状态。

## 非目标

- Mantis 不是单元测试的替代品。理解修复后，Mantis 运行通常应转化为一个更小的回归测试。
- Mantis 不是常规的快速 CI 门禁。它更慢，使用实时凭据，并且只保留给实时环境很重要的 bug。
- Mantis 的正常运行不应需要人工参与。手动 VNC 是救援路径，而不是正常路径。
- Mantis 不会在构件、日志、截图、Markdown 报告或 PR 评论中存储原始 secret。

## 职责归属

Mantis 属于 OpenClaw QA 技术栈。

- OpenClaw 负责场景运行时、传输协议适配器、证据 schema，以及 `pnpm openclaw qa mantis` 下的本地 CLI。
- QA Lab 负责实时传输协议 harness 组件、浏览器捕获助手和构件写入器。
- 当需要远程 VM 时，Crabbox 负责预热的 Linux 机器。
- GitHub Actions 负责远程 workflow 入口点和构件保留。
- ClawSweeper 负责 GitHub 评论路由：解析维护者命令、分发 workflow，并发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体通过 Codex 驱动 Mantis。

这条边界将传输协议知识保留在 OpenClaw，将机器调度保留在 Crabbox，将维护者 workflow 胶水逻辑保留在 ClawSweeper。

## 命令形式

第一个本地命令验证 Discord bot、服务器、渠道、消息发送、reaction 发送和构件路径：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本地修复前和修复后 runner 接受这种形式：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner 会在输出目录下创建分离的基线和候选 worktree，安装依赖，构建每个 ref，使用 `--allow-failures` 运行场景，然后写入 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md`。对于第一个 Discord 场景，成功验证意味着基线 status 为 `fail`，候选 status 为 `pass`。

第一个 VM/浏览器原语是桌面 smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它会租用或复用 Crabbox 桌面机器，在 VNC 会话内启动一个可见浏览器，捕获桌面，将构件拉回本地输出目录，并把重连命令写入报告。该命令默认使用 Hetzner 提供商，因为它是 Mantis 通道中首个具备可用桌面/VNC 覆盖的提供商。针对另一个 Crabbox fleet 运行时，可用 `--provider`、`--crabbox-bin` 或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆盖。

有用的桌面 smoke flag：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 会复用已预热的桌面。
- `--browser-url <url>` 会更改可见浏览器打开的页面。
- `--html-file <path>` 会在可见浏览器中渲染仓库本地 HTML 构件。Mantis 使用它通过真实 Crabbox 桌面捕获生成的 Discord status-reaction 时间线。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 会让新创建且通过的租约保持打开，以便 VNC 检查。失败运行默认会保留其创建的租约，以便操作员可以重新连接。
- `--class`、`--idle-timeout` 和 `--ttl` 用于调整机器规格和租约生命周期。

GitHub smoke workflow 是 `Mantis Discord Smoke`。第一个真实场景的修复前和修复后 GitHub workflow 是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期会复现仅 queued 行为的 ref。
- `candidate_ref`：预期会展示 `queued -> thinking -> done` 的 ref。

它会 checkout workflow harness ref，构建单独的基线和候选 worktree，分别针对每个 worktree 运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 作为 Actions 构件上传。它还会在 Crabbox 桌面浏览器中渲染每条通道的时间线 HTML，并在 PR 评论中将这些 VNC 截图发布到确定性时间线 PNG 旁边。

你也可以直接从 PR 评论触发 status-reactions 运行：

```text
@Mantis discord status reactions
```

评论触发器有意保持窄范围。它只会在具有 write、maintain 或 admin 权限的用户发表的 pull request 评论上运行，并且只识别 Discord status-reaction 请求。默认情况下，它会使用已知坏的基线 ref，并将当前 PR head SHA 作为候选。维护者可以覆盖任一 ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一条命令是显式且聚焦场景的。第二条之后可以根据标签、变更文件和 ClawSweeper 评审发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭据。
2. 分配或复用 VM。
3. 当场景需要 UI 证据时，准备桌面/浏览器配置文件。
4. 为基线 ref 准备干净的 checkout。
5. 安装依赖，并只构建场景需要的内容。
6. 使用隔离的状态目录启动一个子 OpenClaw Gateway 网关。
7. 配置实时传输协议、提供商、模型和浏览器配置文件。
8. 运行场景并捕获基线证据。
9. 停止 Gateway 网关并保留日志。
10. 在同一 VM 中准备候选 ref。
11. 运行同一场景并捕获候选证据。
12. 对比判定器结果和视觉证据。
13. 写入 Markdown、JSON、日志、截图和可选 trace 构件。
14. 上传 GitHub Actions 构件。
15. 发布简洁的 PR 或 Discord 状态消息。

场景应能够以两种不同方式失败：

- **已复现 bug**：基线以预期方式失败。
- **Harness 故障**：环境设置、凭据、Discord API、浏览器或提供商在 bug 判定器有意义之前失败。

最终报告必须区分这些情况，避免维护者将不稳定环境误认为产品行为。

## Discord MVP

第一个场景应针对服务器渠道中的 Discord status reaction，其中源回复投递模式为 `message_tool_only`。

它是一个很好的 Mantis 种子，原因如下：

- 它在 Discord 中以触发消息上的 reaction 形式可见。
- 它通过 Discord 消息 reaction 状态提供强 REST 判定器。
- 它会执行真实的 OpenClaw Gateway 网关、Discord bot 凭证、消息分发、源回复投递模式、status reaction 状态和模型轮次生命周期。
- 它足够窄，可以让第一个实现保持诚实。

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

基线证据应显示 queued acknowledgement reaction，但在 tool-only 模式下没有生命周期转换。候选证据应显示当 `messages.statusReactions.enabled` 被显式设为 true 时，生命周期 status reaction 会运行。

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

它会使用始终开启的服务器处理、`visibleReplies: "message_tool"`、`ackReaction: "👀"` 和显式 status reaction 配置 SUT。判定器会轮询真实 Discord 触发消息，并期望观察到序列 `👀 -> 🤔 -> 👍`。构件包括 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应基于现有私有 QA 技术栈，而不是从零开始：

- `pnpm openclaw qa discord` 已经运行带有 driver 和 SUT bot 的实时 Discord 通道。
- 实时传输协议 runner 已经会在 `.artifacts/qa-e2e/` 下写入报告和观测消息构件。
- Convex 凭据租约已经为共享实时传输协议凭据提供独占访问。
- 浏览器控制服务已经支持截图、快照、headless 托管配置文件和远程 CDP 配置文件。
- QA Lab 已经有用于传输协议形态测试的 debugger UI 和 bus。

第一个 Mantis 实现可以是在这些组件之上的薄修复前/修复后 runner，再加一层视觉证据。

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

`mantis-summary.json` 应是机器可读的真实来源。Markdown 报告用于 PR 评论和人工评审。

summary 必须包括：

- 测试的 ref 和 SHA
- 传输协议和场景 ID
- 机器提供商和机器 ID 或租约 ID
- 不含 secret 值的凭据来源
- 基线结果
- 候选结果
- bug 是否在基线上复现
- 候选是否修复了它
- 构件路径
- 已清理的设置或清理问题

截图是证据，不是 secret。它们仍然需要遵守脱敏纪律：私有渠道名称、用户名或消息内容可能会出现。对于公开 PR，在脱敏方案更完善之前，优先使用 GitHub Actions 构件链接，而不是内联图片。

## 浏览器和 VNC

浏览器通道有两种模式：

- **Headless 自动化**：CI 的默认模式。Chrome 会启用 CDP 运行，并由 Playwright 或 OpenClaw 浏览器控制捕获截图。
- **VNC 救援**：当登录、MFA、Discord 反自动化或视觉调试需要人工参与时，会在同一 VM 上启用。

Discord 观察者浏览器配置文件应当足够持久，以避免每次运行都需要登录，但要与个人浏览器状态隔离。配置文件属于 Mantis 机器池，而不是开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord 状态消息，其中包含：

- 运行 id
- 场景 id
- 机器提供商
- 工件目录
- VNC 或 noVNC 连接说明（如果可用）
- 简短的阻塞原因文本

第一个私有部署可以先将这些消息发布到现有的操作员渠道，之后再迁移到专用的 Mantis 渠道。

## 机器

Mantis 的第一个远程实现应优先通过 Crabbox 使用 AWS。Crabbox 为我们提供预热机器、租约跟踪、水合、日志、结果和清理。如果 AWS 容量太慢或不可用，就在同一个机器接口后面添加 Hetzner 提供商。

最低 VM 要求：

- Linux，安装支持桌面的 Chrome 或 Chromium
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够的 CPU 和内存，可运行一个 OpenClaw Gateway 网关、一个浏览器和一次模型运行
- 可出站访问 Discord、GitHub、模型提供商和凭证代理

VM 不应在预期凭证或浏览器配置文件存储之外保留长期原始密钥。

## 密钥

远程运行的密钥存放在 GitHub 组织或仓库密钥中，本地运行的密钥存放在由本地操作员控制的密钥文件中。

推荐的密钥名称：

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

长期来看，Convex 凭证池应继续作为实时传输凭证的常规来源。GitHub 密钥用于引导代理和后备通道。Discord 状态反应工作流会将 Mantis Crabbox 密钥映射回 Crabbox CLI 期望的 `CRABBOX_COORDINATOR` 和 `CRABBOX_COORDINATOR_TOKEN` 环境变量。普通的 `CRABBOX_*` GitHub 密钥名称仍作为兼容性后备被接受。

Mantis 运行器绝不能打印：

- Discord 机器人令牌
- 提供商 API key
- 浏览器 cookie
- 认证配置文件内容
- VNC 密码
- 原始凭证负载

公开工件上传也应对 Discord 目标元数据进行脱敏，例如机器人、服务器、渠道和消息 id。因此，GitHub smoke 工作流启用了 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果令牌被意外粘贴到 issue、PR、聊天或日志中，请在存储新密钥后轮换它。

## GitHub 工件和 PR 评论

Mantis 工作流应将完整证据包作为短期 Actions 工件上传。当工作流针对 bug 报告或修复 PR 运行时，它还应将脱敏后的 PNG 截图发布到 `qa-artifacts` 分支，并在该 bug 或修复 PR 上 upsert 一条带有内联前后对比截图的评论。不要只把主要证据发布到通用的 QA 自动化 PR 上。原始日志、观察到的消息和其他体积较大的证据保留在 Actions 工件中。

生产工作流应使用 Mantis GitHub App 发布这些评论，而不是使用 `github-actions[bot]`。将 app id 和私钥分别存储为 `MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions 密钥。工作流使用隐藏标记作为 upsert 键；当令牌可以编辑评论时会更新该评论；当较早的机器人拥有的标记无法编辑时，会创建一条由 Mantis 拥有的新评论。

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

私有部署可能已经有一个 Mantis Discord 应用。如果该应用具备正确的机器人权限并且可以安全轮换，请复用该应用，而不是创建另一个 app。

通过密钥或部署配置设置初始操作员通知渠道。它可以先指向现有维护者或运维渠道，然后在专用 Mantis 渠道存在后迁移过去。

不要把服务器 id、渠道 id、机器人令牌、浏览器 cookie 或 VNC 密码放入本文档。将它们存储在 GitHub 密钥、凭证代理或操作员的本地密钥存储中。

## 添加场景

Mantis 场景应声明：

- id 和标题
- 传输协议
- 所需凭证
- 基线 ref 策略
- 候选 ref 策略
- OpenClaw 配置补丁
- 设置步骤
- 刺激
- 预期基线判定器
- 预期候选判定器
- 视觉捕获目标
- 超时预算
- 清理步骤

场景应优先使用小型、带类型的判定器：

- 反应 bug 使用 Discord 反应状态
- 线程 bug 使用 Discord 消息引用
- Slack bug 使用 Slack 线程 ts 和反应 API 状态
- 邮件 bug 使用电子邮件消息 id 和标头
- 当 UI 是唯一可靠可观察项时使用浏览器截图

视觉检查应是附加性的。如果平台 API 可以证明 bug，就使用 API 作为通过/失败判定器，并保留截图以增强人工信心。

## 提供商扩展

在 Discord 之后，同一运行器可以添加：

- Slack：反应、线程、app 提及、模态框、文件上传。
- 电子邮件：在连接器不足时使用 `gog` 进行 Gmail 认证和消息线程处理。
- WhatsApp：二维码登录、重新识别、消息投递、媒体、反应。
- Telegram：群组提及门控、命令、可用时的反应。
- Matrix：加密房间、线程或回复关系、重启恢复。

每种传输协议都应有一个低成本 smoke 场景，以及一个或多个 bug 类场景。昂贵的视觉场景应保持为选择性启用。

## 未决问题

- 复用现有 Mantis 机器人时，哪个 Discord 机器人应作为驱动方，哪个应作为 SUT？
- 第一阶段的观察者浏览器登录应使用真人 Discord 账号、测试账号，还是只使用机器人可读取的 REST 证据？
- GitHub 应为 PR 保留 Mantis 工件多长时间？
- ClawSweeper 应在什么时候自动推荐 Mantis，而不是等待维护者命令？
- 公开 PR 上传前是否应对截图进行脱敏或裁剪？
