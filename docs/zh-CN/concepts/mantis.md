---
read_when:
    - 为 OpenClaw 缺陷构建或运行实时可视化 QA
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输协议场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是一个可视化端到端验证系统，用于在实时传输协议上复现 OpenClaw 缺陷、捕获前后证据，并将产物附加到 PR。
title: Mantis
x-i18n:
    generated_at: "2026-05-04T00:57:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 42161d802c8601e58af1abef69277b5b3eac37750480326e1f56b2898a6af3fb
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 的端到端验证系统，适用于需要真实运行时、真实传输协议和可见证明的错误。它会针对一个已知有问题的 ref 运行场景，捕获证据，再针对一个候选 ref 运行相同场景，并将对比结果发布为 artifact，维护者可以从 PR 或本地命令中检查。

Mantis 从 Discord 开始，因为 Discord 提供了一个高价值的首个通道：真实机器人凭证、真实公会频道、回应、线程、原生命令，以及一个人类可以直观看到传输协议所展示内容的浏览器 UI。

## 目标

- 使用用户看到的相同传输协议形态，从 GitHub issue 或 PR 中复现错误。
- 在应用修复前，在基线 ref 上捕获一个 **before** artifact。
- 在应用修复后，在候选 ref 上捕获一个 **after** artifact。
- 尽可能使用确定性 oracle，例如 Discord REST 回应读取或频道 transcript 检查。
- 当错误具有可见 UI 表面时捕获截图。
- 从智能体控制的 CLI 在本地运行，并从 GitHub 远程运行。
- 保留足够的机器状态，以便在登录、浏览器自动化或提供商凭证卡住时进行 VNC 救援。
- 当运行被阻塞、需要手动 VNC 帮助或完成时，向操作员 Discord 频道发布简洁 Status。

## 非目标

- Mantis 不是单元测试的替代品。理解修复后，Mantis 运行通常应转化为更小的回归测试。
- Mantis 不是常规的快速 CI 门禁。它更慢，使用实时凭证，并且保留给实时环境很重要的错误。
- Mantis 不应要求人类参与正常操作。手动 VNC 是救援路径，不是正常路径。
- Mantis 不会在 artifact、日志、截图、Markdown 报告或 PR 评论中存储原始密钥。

## 所有权

Mantis 位于 OpenClaw QA 栈中。

- OpenClaw 拥有场景运行时、传输协议适配器、证据 schema，以及 `pnpm openclaw qa mantis` 下的本地 CLI。
- QA Lab 拥有实时传输协议 harness 组件、浏览器捕获辅助工具和 artifact 写入器。
- 需要远程 VM 时，Crabbox 拥有预热的 Linux 机器。
- GitHub Actions 拥有远程 workflow 入口点和 artifact 保留。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、分派 workflow，以及发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体通过 Codex 驱动 Mantis。

这个边界将传输协议知识保留在 OpenClaw 中，将机器调度保留在 Crabbox 中，并将维护者 workflow 胶水保留在 ClawSweeper 中。

## 命令形式

第一个本地命令会验证 Discord 机器人、公会、频道、消息发送、回应发送和 artifact 路径：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本地 before 和 after runner 接受以下形式：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner 会在输出目录下创建分离的基线和候选 worktree，安装依赖，构建每个 ref，使用 `--allow-failures` 运行场景，然后写入 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md`。对于第一个 Discord 场景，验证成功意味着基线 Status 为 `fail`，候选 Status 为 `pass`。

第一个 VM/浏览器原语是桌面冒烟测试：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它会租用或复用一台 Crabbox 桌面机器，在 VNC 会话内启动可见浏览器，捕获桌面，将 artifact 拉回本地输出目录，并将重新连接命令写入报告。该命令默认使用 Hetzner 提供商，因为它是 Mantis 通道中第一个具备可用桌面/VNC 覆盖的提供商。针对另一个 Crabbox fleet 运行时，可使用 `--provider`、`--crabbox-bin` 或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆盖。

有用的桌面冒烟测试标志：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 会复用预热的桌面。
- `--browser-url <url>` 会更改在可见浏览器中打开的页面。
- `--html-file <path>` 会在可见浏览器中渲染仓库本地 HTML artifact。Mantis 使用它通过真实 Crabbox 桌面捕获生成的 Discord 状态回应时间线。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 会让新创建且通过的 lease 保持打开，以供 VNC 检查。失败运行默认会保留创建的 lease，以便操作员重新连接。
- `--class`、`--idle-timeout` 和 `--ttl` 用于调整机器规格和 lease 生命周期。

GitHub 冒烟测试 workflow 是 `Mantis Discord Smoke`。第一个真实场景的 before 和 after GitHub workflow 是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期会复现仅排队行为的 ref。
- `candidate_ref`：预期会显示 `queued -> thinking -> done` 的 ref。

它会 checkout workflow harness ref，构建独立的基线和候选 worktree，针对每个 worktree 运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 作为 Actions artifact 上传。它还会在 Crabbox 桌面浏览器中渲染每个通道的时间线 HTML，并在 PR 评论中将这些 VNC 截图发布到确定性时间线 PNG 旁边。

你也可以直接从 PR 评论触发状态回应运行：

```text
@Mantis discord status reactions
```

评论触发器有意保持窄范围。它只会在具有写入、维护或管理员权限的用户发表的 pull request 评论上运行，并且只识别 Discord 状态回应请求。默认情况下，它使用已知有问题的基线 ref，并将当前 PR head SHA 作为候选。维护者可以覆盖任一 ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一个命令是显式且聚焦场景的。第二个之后可以基于标签、变更文件和 ClawSweeper review 发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭证。
2. 分配或复用 VM。
3. 当场景需要 UI 证据时，准备桌面/浏览器 profile。
4. 为基线 ref 准备干净 checkout。
5. 安装依赖，并只构建场景需要的内容。
6. 使用隔离状态目录启动子 OpenClaw Gateway 网关。
7. 配置实时传输协议、提供商、模型和浏览器 profile。
8. 运行场景并捕获基线证据。
9. 停止 Gateway 网关并保留日志。
10. 在同一 VM 中准备候选 ref。
11. 运行相同场景并捕获候选证据。
12. 对比 oracle 结果和视觉证据。
13. 写入 Markdown、JSON、日志、截图和可选 trace artifact。
14. 上传 GitHub Actions artifact。
15. 发布简洁的 PR 或 Discord Status 消息。

场景应能以两种不同方式失败：

- **错误已复现**：基线按预期方式失败。
- **Harness 失败**：在错误 oracle 有意义之前，环境设置、凭证、Discord API、浏览器或提供商失败。

最终报告必须区分这些情况，以免维护者将不稳定环境与产品行为混淆。

## Discord 最小可行版本

第一个场景应针对公会频道中的 Discord 状态回应，其中源回复投递模式为 `message_tool_only`。

它是一个好的 Mantis 种子，原因如下：

- 它在 Discord 中表现为触发消息上的回应，可见。
- 它通过 Discord 消息回应状态提供强 REST oracle。
- 它会覆盖真实 OpenClaw Gateway 网关、Discord 机器人凭证、消息分发、源回复投递模式、状态回应状态以及模型轮次生命周期。
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

基线证据应显示已排队的确认回应，但在仅工具模式下没有生命周期转换。候选证据应显示当 `messages.statusReactions.enabled` 被显式设置为 true 时生命周期状态回应正在运行。

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

它会为被测系统配置始终开启的公会处理、`visibleReplies: "message_tool"`、`ackReaction: "👀"` 和显式状态回应。oracle 会轮询真实 Discord 触发消息，并期望观察到序列 `👀 -> 🤔 -> 👍`。Artifact 包括 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应基于现有私有 QA 栈构建，而不是从零开始：

- `pnpm openclaw qa discord` 已经会使用 driver 和被测系统机器人运行实时 Discord 通道。
- 实时传输协议 runner 已经会在 `.artifacts/qa-e2e/` 下写入报告和观察到的消息 artifact。
- Convex 凭证 lease 已经为共享实时传输协议凭证提供独占访问。
- 浏览器控制服务已经支持截图、快照、无头托管 profile 和远程 CDP profile。
- QA Lab 已经有用于传输协议形态测试的调试器 UI 和总线。

第一个 Mantis 实现可以是在这些组件之上的轻量 before/after runner，再加一个视觉证据层。

## 证据模型

每次运行都会写入一个稳定的 artifact 目录：

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

- 已测试的 ref 和 SHA
- 传输协议和场景 ID
- 机器提供商以及机器 ID 或 lease ID
- 不含密钥值的凭证来源
- 基线结果
- 候选结果
- 错误是否在基线上复现
- 候选是否修复了它
- artifact 路径
- 已清理的设置或清理问题

截图是证据，不是密钥。它们仍然需要遵守脱敏纪律：私有频道名称、用户名或消息内容可能会出现。对于公开 PR，在脱敏方案更强之前，优先使用 GitHub Actions artifact 链接，而不是内联图片。

## 浏览器和 VNC

浏览器通道有两种模式：

- **无头自动化**：CI 的默认模式。Chrome 启用 CDP 运行，Playwright 或 OpenClaw 浏览器控制会捕获截图。
- **VNC 救援**：当登录、MFA、Discord 反自动化或视觉调试需要人类时，在同一 VM 上启用。

Discord 观察者浏览器配置文件应足够持久，避免每次运行都登录，但要与个人浏览器状态隔离。配置文件属于 Mantis 机器池，而不是开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord 状态消息，其中包含：

- 运行 ID
- 场景 ID
- 机器提供商
- 工件目录
- VNC 或 noVNC 连接说明（如可用）
- 简短的阻塞原因文本

首次私有部署可以将这些消息发布到现有操作员渠道，之后再迁移到专用的 Mantis 渠道。

## 机器

Mantis 的首个远程实现应优先通过 Crabbox 使用 AWS。Crabbox 为我们提供预热机器、租约跟踪、补水、日志、结果和清理。如果 AWS 容量太慢或不可用，则在同一机器接口后添加 Hetzner 提供商。

最低 VM 要求：

- 安装了可用于桌面的 Chrome 或 Chromium 的 Linux
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw 检出和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够运行一个 OpenClaw Gateway 网关、一个浏览器和一次模型运行的 CPU 和内存
- 可出站访问 Discord、GitHub、模型提供商和凭证代理

VM 不应在预期的凭证或浏览器配置文件存储之外保留长期有效的原始密钥。

## 密钥

远程运行的密钥存储在 GitHub 组织或仓库密钥中，本地运行的密钥存储在本地操作员控制的密钥文件中。

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

长期来看，Convex 凭证池应继续作为实时传输凭证的常规来源。GitHub 密钥用于引导代理和备用通道。

Mantis 运行器绝不能打印：

- Discord 机器人令牌
- 提供商 API key
- 浏览器 Cookie
- 认证配置文件内容
- VNC 密码
- 原始凭证载荷

公开工件上传还应脱敏 Discord 目标元数据，例如机器人、公会、渠道和消息 ID。因此，GitHub 冒烟工作流会启用 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果令牌被意外粘贴到 issue、PR、聊天或日志中，请在新密钥已存储后轮换该令牌。

## GitHub 工件和 PR 评论

Mantis 工作流应将完整证据包上传为短期 Actions 工件。当工作流针对缺陷报告或修复 PR 运行时，它还应将脱敏后的 PNG 截图发布到 `qa-artifacts` 分支，并在该缺陷或修复 PR 上更新或插入一条评论，包含内联的修复前/修复后截图。不要只在通用 QA 自动化 PR 上发布主要证明。原始日志、观察到的消息和其他大体积证据保留在 Actions 工件中。

生产工作流应使用 Mantis GitHub App 发布这些评论，而不是使用 `github-actions[bot]`。将应用 ID 和私钥作为 `MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions 密钥存储。工作流使用隐藏标记作为更新或插入键；当令牌可以编辑评论时更新该评论；当较旧的机器人所有标记无法编辑时，创建一条由 Mantis 拥有的新评论。

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

私有部署可能已经有一个 Mantis Discord 应用。如果该应用具备正确的机器人权限并且可以安全轮换，请复用该应用，而不是创建另一个应用。

通过密钥或部署配置设置初始操作员通知渠道。它可以先指向现有的维护者或运维渠道，然后在专用 Mantis 渠道存在后再迁移过去。

不要将公会 ID、渠道 ID、机器人令牌、浏览器 Cookie 或 VNC 密码放入本文档。请将它们存储在 GitHub 密钥、凭证代理或操作员的本地密钥存储中。

## 添加场景

Mantis 场景应声明：

- ID 和标题
- 传输协议
- 所需凭证
- 基线 ref 策略
- 候选 ref 策略
- OpenClaw 配置补丁
- 设置步骤
- 刺激输入
- 预期基线判定器
- 预期候选判定器
- 可视化捕获目标
- 超时预算
- 清理步骤

场景应优先使用小型、带类型的判定器：

- 用于 reaction 缺陷的 Discord reaction 状态
- 用于串线缺陷的 Discord 消息引用
- 用于 Slack 缺陷的 Slack 线程 ts 和 reaction API 状态
- 用于电子邮件缺陷的电子邮件消息 ID 和标头
- 当 UI 是唯一可靠可观察项时的浏览器截图

视觉检查应作为增量补充。如果平台 API 可以证明该缺陷，请使用 API 作为通过/失败判定器，并保留截图供人工建立信心。

## 提供商扩展

在 Discord 之后，同一运行器可以添加：

- Slack：reaction、线程、应用提及、模态框、文件上传。
- 电子邮件：在连接器不足时使用 `gog` 进行 Gmail 认证和消息串线。
- WhatsApp：二维码登录、重新识别、消息投递、媒体、reaction。
- Telegram：群组提及门控、命令、可用时的 reaction。
- Matrix：加密房间、线程或回复关系、重启恢复。

每个传输协议都应有一个低成本冒烟场景，以及一个或多个缺陷类别场景。昂贵的视觉场景应保持为可选启用。

## 未决问题

- 复用现有 Mantis 机器人时，哪个 Discord 机器人应作为驱动方，哪个应作为 SUT？
- 第一阶段的观察者浏览器登录应使用真人 Discord 账号、测试账号，还是只使用机器人可读的 REST 证据？
- GitHub 应为 PR 保留 Mantis 工件多久？
- ClawSweeper 何时应自动推荐 Mantis，而不是等待维护者命令？
- 对于公开 PR，截图上传前是否应脱敏或裁剪？
