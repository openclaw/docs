---
read_when:
    - 为 OpenClaw 缺陷构建或运行实时视觉 QA
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是用于在真实传输协议上复现 OpenClaw 缺陷、捕获修复前后的证据，并将工件附加到拉取请求的可视化端到端验证系统。
title: Mantis
x-i18n:
    generated_at: "2026-05-05T06:58:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00f2be92845fb13e410af7188f348010140914514d739b930f97b43abaa66a0c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 端到端验证系统，用于需要真实运行时、真实传输协议和可见证明的错误。它会针对一个已知有问题的引用运行场景，捕获证据，再针对候选引用运行相同场景，并将比较结果发布为构件，维护者可以从 PR 或本地命令中检查这些构件。

Mantis 从 Discord 开始，因为 Discord 为我们提供了高价值的第一条验证路径：真实机器人凭证、真实服务器渠道、回应、线程、原生命令，以及可让人类直观看到传输协议展示内容的浏览器 UI。

## 目标

- 使用用户看到的同一种传输协议形态，复现 GitHub issue 或 PR 中的错误。
- 在应用修复之前，基于基线引用捕获一个**修复前**构件。
- 在应用修复之后，基于候选引用捕获一个**修复后**构件。
- 尽可能使用确定性判定器，例如 Discord REST 回应读取或渠道转录检查。
- 当错误有可见 UI 表面时捕获截图。
- 从智能体控制的 CLI 在本地运行，并从 GitHub 远程运行。
- 当登录、浏览器自动化或提供商凭证卡住时，保留足够的机器状态以便 VNC 救援。
- 当运行被阻塞、需要人工 VNC 帮助或完成时，向操作员 Discord 渠道发布简明 Status。

## 非目标

- Mantis 不是单元测试的替代品。理解修复后，Mantis 运行通常应转化为更小的回归测试。
- Mantis 不是常规的快速 CI 门禁。它更慢，使用实时凭据，并且仅用于实时环境很重要的错误。
- Mantis 的正常运行不应需要人工介入。手动 VNC 是救援路径，而不是理想路径。
- Mantis 不会在构件、日志、截图、Markdown 报告或 PR 评论中存储原始密钥。

## 所属权

Mantis 位于 OpenClaw QA 栈中。

- OpenClaw 拥有场景运行时、传输协议适配器、证据架构，以及 `pnpm openclaw qa mantis` 下的本地 CLI。
- QA Lab 拥有实时传输协议测试框架部分、浏览器捕获助手和构件写入器。
- 当需要远程 VM 时，Crabbox 拥有预热的 Linux 机器。
- GitHub Actions 拥有远程工作流入口点和构件保留。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、分派工作流，以及发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体通过 Codex 驱动 Mantis。

这条边界将传输协议知识保留在 OpenClaw，将机器调度保留在 Crabbox，并将维护者工作流粘合逻辑保留在 ClawSweeper。

## 命令形式

第一个本地命令会验证 Discord 机器人、服务器、渠道、消息发送、回应发送和构件路径：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本地修复前和修复后运行器接受以下形式：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

运行器会在输出目录下创建分离的基线和候选 worktree，安装依赖，构建每个引用，使用 `--allow-failures` 运行场景，然后写入 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md`。对于第一个 Discord 场景，成功验证意味着基线 Status 为 `fail`，候选 Status 为 `pass`。

第一个 VM/浏览器原语是桌面冒烟测试：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它会租用或复用 Crabbox 桌面机器，在 VNC 会话内启动可见浏览器，捕获桌面，将构件拉回本地输出目录，并把重连命令写入报告。该命令默认使用 Hetzner 提供商，因为它是 Mantis 验证路径中第一个具备可用桌面/VNC 覆盖的提供商。在针对另一个 Crabbox 机群运行时，可用 `--provider`、`--crabbox-bin` 或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆盖。

有用的桌面冒烟测试标志：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 会复用预热桌面。
- `--browser-url <url>` 会更改可见浏览器打开的页面。
- `--html-file <path>` 会在可见浏览器中渲染仓库本地 HTML 构件。Mantis 用它通过真实 Crabbox 桌面捕获生成的 Discord Status 回应时间线。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 会让新创建且通过的租约保持打开，以便 VNC 检查。失败运行默认会在创建了租约时保留租约，以便操作员重连。
- `--class`、`--idle-timeout` 和 `--ttl` 会调整机器规格和租约生命周期。

第一个完整桌面传输协议原语是 Slack 桌面冒烟测试：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它会租用或复用 Crabbox 桌面机器，将当前 checkout 同步到 VM 中，在该 VM 内运行 `pnpm openclaw qa slack`，在 VNC 浏览器中打开 Slack Web，捕获可见桌面，并把 Slack QA 构件和 VNC 截图都复制回本地输出目录。这是第一个 SUT OpenClaw gateway 和浏览器都位于同一台 Linux 桌面 VM 内的 Mantis 形态。

使用 `--gateway-setup` 时，该命令会在 `$HOME/.openclaw-mantis/slack-openclaw` 准备一个持久的一次性 OpenClaw home，为所选渠道修补 Slack Socket Mode 配置，在端口 `38973` 上启动 `openclaw gateway run`，并让 Chrome 保持运行在 VNC 会话中。这是“给我留下一个带有 Slack 和正在运行的 claw 的 Linux 桌面”模式；省略 `--gateway-setup` 时，机器人到机器人的 Slack QA 验证路径仍为默认路径。

`--credential-source env` 的必需输入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 用于远程模型验证路径的 `OPENCLAW_LIVE_OPENAI_KEY`。如果本地仅设置了 `OPENAI_API_KEY`，Mantis 会在调用 Crabbox 前将其映射为 `OPENCLAW_LIVE_OPENAI_KEY`，这样 Crabbox 的 `OPENCLAW_*` 环境变量转发就能将其带入 VM。

有用的 Slack 桌面标志：

- `--lease-id <cbx_...>` 会在操作员已通过 VNC 登录 Slack Web 的机器上重新运行。
- `--gateway-setup` 会在 VM 中启动持久 OpenClaw Slack Gateway 网关，而不是只运行机器人到机器人的 QA 验证路径。
- `--slack-url <url>` 会打开指定的 Slack Web URL。没有它时，如果 SUT 机器人令牌可用，Mantis 会从 Slack `auth.test` 派生 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 控制 Gateway 网关设置使用的 Slack 渠道允许列表。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 内的持久 Chrome 配置目录。默认值为 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手动 Slack Web 登录会在同一租约的重运行中保留。
- `--credential-source convex --credential-role ci` 使用共享凭据池，而不是直接使用 Slack 环境变量令牌。
- `--provider-mode`、`--model`、`--alt-model` 和 `--fast` 会透传到 Slack 实时验证路径。

GitHub 冒烟测试工作流是 `Mantis Discord Smoke`。第一个真实场景的修复前和修复后 GitHub 工作流是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期会复现仅 queued 行为的引用。
- `candidate_ref`：预期会显示 `queued -> thinking -> done` 的引用。

它会 checkout 工作流测试框架引用，构建单独的基线和候选 worktree，针对每个 worktree 运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 作为 Actions 构件上传。它还会在 Crabbox 桌面浏览器中渲染每条验证路径的时间线 HTML，并在 PR 评论中把这些 VNC 截图发布到确定性时间线 PNG 旁边。同一条 PR 评论会嵌入由 `crabbox media preview` 生成的轻量运动裁剪 GIF 预览，链接到匹配的运动裁剪 MP4 片段，并保留完整桌面 MP4 文件以便深入检查。截图会保持内联，以便快速审阅。该工作流从 `openclaw/crabbox` main 构建 Crabbox CLI，以便在下一次 Crabbox 二进制发布前使用当前桌面/浏览器租约标志。

你也可以直接从 PR 评论触发 Status 回应运行：

```text
@Mantis discord status reactions
```

评论触发器有意保持范围狭窄。它只会在具有写入、维护或管理员访问权限的用户发布的 pull request 评论上运行，并且只识别 Discord Status 回应请求。默认情况下，它使用已知有问题的基线引用，并将当前 PR head SHA 作为候选。维护者可以覆盖任一引用：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一个命令是显式且面向场景的。第二个命令稍后可以根据标签、变更文件和 ClawSweeper 审查发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭据。
2. 分配或复用 VM。
3. 当场景需要 UI 证据时，准备桌面/浏览器配置目录。
4. 为基线引用准备干净 checkout。
5. 安装依赖，并仅构建场景需要的内容。
6. 使用隔离状态目录启动子 OpenClaw Gateway 网关。
7. 配置实时传输协议、提供商、模型和浏览器配置目录。
8. 运行场景并捕获基线证据。
9. 停止 Gateway 网关并保留日志。
10. 在同一 VM 中准备候选引用。
11. 运行相同场景并捕获候选证据。
12. 比较判定器结果和视觉证据。
13. 写入 Markdown、JSON、日志、截图和可选跟踪构件。
14. 上传 GitHub Actions 构件。
15. 发布简明 PR 或 Discord Status 消息。

场景应能以两种不同方式失败：

- **错误已复现**：基线以预期方式失败。
- **测试框架失败**：环境设置、凭据、Discord API、浏览器或提供商在错误判定器产生有意义结果之前失败。

最终报告必须区分这些情况，以免维护者将不稳定环境与产品行为混淆。

## Discord MVP

第一个场景应以服务器渠道中的 Discord Status 回应为目标，其中源回复交付模式为 `message_tool_only`。

它是一个好的 Mantis 种子，原因如下：

- 它在 Discord 中以触发消息上的回应形式可见。
- 它通过 Discord 消息回应状态提供了强 REST 判定器。
- 它会覆盖真实 OpenClaw Gateway 网关、Discord 机器人凭证、消息分派、源回复交付模式、Status 回应状态和模型回合生命周期。
- 它足够窄，可以让第一版实现保持诚实。

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

基线证据应显示 queued 确认回应，但在仅工具模式下没有生命周期转换。候选证据应显示当 `messages.statusReactions.enabled` 被显式设为 true 时，生命周期 Status 回应正在运行。

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

它会为 SUT 配置始终开启的服务器处理、`visibleReplies:
"message_tool"`、`ackReaction: "👀"` 和显式状态反应。判定器会轮询真实的 Discord 触发消息，并期望观测到序列 `👀 -> 🤔 -> 👍`。工件包括 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应该基于现有的私有 QA 栈构建，而不是从零开始：

- `pnpm openclaw qa discord` 已经运行带有驱动和 SUT 机器人的实时 Discord 通道。
- 实时传输协议运行器已经会在 `.artifacts/qa-e2e/` 下写入报告和观测消息工件。
- Convex 凭证租约已经为共享实时传输协议凭证提供独占访问。
- 浏览器控制服务已经支持截图、快照、无头托管配置文件和远程 CDP 配置文件。
- QA Lab 已经有用于传输协议形态测试的调试器 UI 和总线。

第一个 Mantis 实现可以是在这些组件之上做一个很薄的前后对比运行器，再加一层视觉证据。

## 证据模型

每次运行都会写入一个稳定的工件目录：

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

`mantis-summary.json` 应该是机器可读的事实来源。Markdown 报告用于 PR 评论和人工审核。

摘要必须包含：

- 测试的 refs 和 SHA
- 传输协议和场景 id
- 机器提供商以及机器 id 或租约 id
- 不含密钥值的凭证来源
- 基线结果
- 候选结果
- bug 是否在基线上复现
- 候选是否修复了它
- 工件路径
- 已清理的设置或清理问题

截图是证据，不是密钥。它们仍然需要遵守脱敏纪律：私有频道名称、用户名或消息内容可能会出现。对于公开 PR，在脱敏方案更成熟之前，优先使用 GitHub Actions 工件链接，而不是内联图片。

## 浏览器和 VNC

浏览器通道有两种模式：

- **无头自动化**：CI 的默认模式。Chrome 启用 CDP 运行，Playwright 或 OpenClaw 浏览器控制会捕获截图。
- **VNC 救援**：当登录、MFA、Discord 反自动化或视觉调试需要人工介入时，在同一台 VM 上启用。

Discord 观察者浏览器配置文件应该足够持久，以避免每次运行都登录，但要与个人浏览器状态隔离。配置文件属于 Mantis 机器池，而不是某个开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord 状态消息，包含：

- 运行 id
- 场景 id
- 机器提供商
- 工件目录
- 如果可用，提供 VNC 或 noVNC 连接说明
- 简短的阻塞原因文本

第一个私有部署可以先把这些消息发布到现有的操作员频道，之后再迁移到专用 Mantis 频道。

## 机器

Mantis 的第一个远程实现应该优先通过 Crabbox 使用 AWS。Crabbox 为我们提供预热机器、租约跟踪、补水、日志、结果和清理。如果 AWS 容量太慢或不可用，则在同一个机器接口后添加 Hetzner 提供商。

最低 VM 要求：

- Linux，安装支持桌面的 Chrome 或 Chromium
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够运行一个 OpenClaw Gateway 网关、一个浏览器和一次模型运行的 CPU 与内存
- 能够出站访问 Discord、GitHub、模型提供商和凭证代理

VM 不应在预期凭证存储或浏览器配置文件存储之外保留长期存在的原始密钥。

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

长期来看，Convex 凭证池应该继续作为实时传输协议凭证的常规来源。GitHub 密钥用于引导代理和兜底通道。Discord 状态反应工作流会把 Mantis Crabbox 密钥映射回 Crabbox CLI 期望的 `CRABBOX_COORDINATOR` 和 `CRABBOX_COORDINATOR_TOKEN` 环境变量。普通的 `CRABBOX_*` GitHub 密钥名称仍然作为兼容兜底被接受。

Mantis 运行器绝不能打印：

- Discord 机器人令牌
- 提供商 API 密钥
- 浏览器 cookie
- 认证配置文件内容
- VNC 密码
- 原始凭证负载

公开工件上传也应该脱敏 Discord 目标元数据，例如机器人、服务器、频道和消息 id。GitHub smoke 工作流为此启用了 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果令牌被意外粘贴到 issue、PR、聊天或日志中，在新密钥存储完成后轮换它。

## GitHub 工件和 PR 评论

Mantis 工作流应该把完整证据包上传为短期 Actions 工件。当工作流针对 bug 报告或修复 PR 运行时，它还应该把已脱敏的 PNG 截图发布到 `qa-artifacts` 分支，并在对应 bug 或修复 PR 上更新或插入一条带有内联前后对比截图的评论。不要只在通用 QA 自动化 PR 上发布主要证明。原始日志、观测消息和其他大体量证据保留在 Actions 工件中。

生产工作流应该使用 Mantis GitHub App 发布这些评论，而不是使用 `github-actions[bot]`。把应用 id 和私钥作为 `MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions 密钥存储。工作流使用隐藏标记作为更新插入键，在令牌可以编辑时更新该评论；当较旧的机器人拥有的标记无法编辑时，则创建一条新的 Mantis 所有评论。

PR 评论应该简短且可视化：

```md
Mantis Discord 状态反应 QA

摘要：Mantis 针对已知坏基线和候选修复重新运行了报告的 Discord 状态反应 bug。基线复现了 bug，而候选显示了预期的 queued -> thinking -> done 序列。

- 场景：`discord-status-reactions-tool-only`
- 运行：<workflow run link>
- 工件：<artifact link>
- 基线：`<status>` at `<sha>`
- 候选：`<status>` at `<sha>`

| 基线                | 候选                |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

当运行因为 harness 失败而失败时，评论必须说明这一点，而不是暗示候选失败。

## 私有部署说明

私有部署可能已经有一个 Mantis Discord 应用。当该应用具备正确的机器人权限并且可以安全轮换时，复用该应用，而不是再创建一个应用。

通过密钥或部署配置设置初始操作员通知频道。它可以先指向现有维护者或运维频道，然后在专用 Mantis 频道存在后迁移过去。

不要把服务器 id、频道 id、机器人令牌、浏览器 cookie 或 VNC 密码放入本文档。把它们存储在 GitHub 密钥、凭证代理或操作员的本地密钥存储中。

## 添加场景

Mantis 场景应该声明：

- id 和标题
- 传输协议
- 所需凭证
- 基线 ref 策略
- 候选 ref 策略
- OpenClaw 配置补丁
- 设置步骤
- 激励
- 预期基线判定器
- 预期候选判定器
- 视觉捕获目标
- 超时预算
- 清理步骤

场景应该优先使用小型、类型化的判定器：

- 用于反应 bug 的 Discord 反应状态
- 用于线程 bug 的 Discord 消息引用
- 用于 Slack bug 的 Slack 线程 ts 和反应 API 状态
- 用于邮件 bug 的邮件消息 id 和标头
- 当 UI 是唯一可靠可观测对象时使用浏览器截图

视觉检查应该是附加的。如果平台 API 可以证明 bug，就使用 API 作为通过/失败判定器，并保留截图用于增强人工信心。

## 提供商扩展

在 Discord 之后，同一个运行器可以添加：

- Slack：反应、线程、应用提及、模态框、文件上传。
- 邮件：在连接器不足时，使用 `gog` 进行 Gmail 认证和消息线程处理。
- WhatsApp：二维码登录、重新识别、消息投递、媒体、反应。
- Telegram：群组提及门控、命令、可用时的反应。
- Matrix：加密房间、线程或回复关系、重启恢复。

每个传输协议都应该有一个低成本 smoke 场景，以及一个或多个 bug 类场景。昂贵的视觉场景应该保持 opt-in。

## 未决问题

- 复用现有 Mantis 机器人时，哪个 Discord 机器人应该作为驱动，哪个应该作为 SUT？
- 观察者浏览器登录在第一阶段应该使用人工 Discord 账号、测试账号，还是只使用机器人可读的 REST 证据？
- GitHub 应该为 PR 保留 Mantis 工件多久？
- ClawSweeper 什么时候应该自动推荐 Mantis，而不是等待维护者命令？
- 公开 PR 上传前，截图是否应该脱敏或裁剪？
