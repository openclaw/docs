---
read_when:
    - 为 OpenClaw 缺陷构建或运行实时视觉 QA
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是用于在真实传输协议上复现 OpenClaw 缺陷、捕获前后证据并将工件附加到 PR 的可视化端到端验证系统。
title: Mantis
x-i18n:
    generated_at: "2026-05-05T08:06:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b287e2832e3e49de6b3cb65aeb1d381a36fc30ce9c94dc5b6b4d7e928c2706c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 的端到端验证系统，用于需要真实运行时、真实传输协议和可见证据的 bug。它会针对已知存在问题的 ref 运行场景，捕获证据，再针对候选 ref 运行同一场景，并将对比结果发布为工件，维护者可以从 PR 或本地命令中检查。

Mantis 从 Discord 开始，因为 Discord 提供了一条高价值的首条通道：真实 bot 凭证、真实 guild 渠道、reaction、thread、原生命令，以及可供人工直观确认传输协议展示内容的浏览器 UI。

## 目标

- 使用用户看到的同一传输协议形态，复现 GitHub issue 或 PR 中的 bug。
- 在应用修复前，在基线 ref 上捕获一个 **before** 工件。
- 在应用修复后，在候选 ref 上捕获一个 **after** 工件。
- 尽可能使用确定性 oracle，例如 Discord REST reaction 读取或渠道 transcript 检查。
- 当 bug 有可见 UI 表面时捕获截图。
- 从智能体控制的 CLI 本地运行，并从 GitHub 远程运行。
- 保留足够的机器状态，以便在登录、浏览器自动化或提供商凭证卡住时进行 VNC 救援。
- 当运行被阻塞、需要手动 VNC 帮助或完成时，向操作员 Discord 渠道发布简洁状态。

## 非目标

- Mantis 不是单元测试的替代品。理解修复后，Mantis 运行通常应转化为更小的回归测试。
- Mantis 不是常规的快速 CI 门禁。它更慢、使用 live 凭证，并保留给 live 环境很重要的 bug。
- Mantis 的正常运行不应需要人工介入。手动 VNC 是救援路径，而不是正常路径。
- Mantis 不会在工件、日志、截图、Markdown 报告或 PR 评论中存储原始密钥。

## 所有权

Mantis 位于 OpenClaw QA 栈中。

- OpenClaw 拥有场景运行时、传输协议适配器、证据 schema，以及 `pnpm openclaw qa mantis` 下的本地 CLI。
- QA Lab 拥有 live 传输协议 harness 组件、浏览器捕获 helper 和工件写入器。
- 当需要远程 VM 时，Crabbox 拥有预热的 Linux 机器。
- GitHub Actions 拥有远程 workflow 入口点和工件保留。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、调度 workflow，并发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体通过 Codex 驱动 Mantis。

这个边界将传输协议知识保留在 OpenClaw 中，将机器调度保留在 Crabbox 中，并将维护者 workflow 胶水逻辑保留在 ClawSweeper 中。

## 命令形态

第一个本地命令会验证 Discord bot、guild、渠道、消息发送、reaction 发送和工件路径：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本地 before 和 after 运行器接受这种形态：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

运行器会在输出目录下创建分离的基线和候选 worktree、安装依赖、构建每个 ref、使用 `--allow-failures` 运行场景，然后写入 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md`。对于第一个 Discord 场景，成功验证意味着基线状态为 `fail`，候选状态为 `pass`。

第一个 VM/浏览器原语是桌面 smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它会租用或复用 Crabbox 桌面机器，在 VNC 会话中启动可见浏览器，捕获桌面，将工件拉回本地输出目录，并将重新连接命令写入报告。该命令默认使用 Hetzner 提供商，因为它是 Mantis 通道中第一个具备可用桌面/VNC 覆盖的提供商。针对另一个 Crabbox fleet 运行时，可使用 `--provider`、`--crabbox-bin` 或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆盖它。

有用的桌面 smoke 标志：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 会复用预热桌面。
- `--browser-url <url>` 会更改可见浏览器打开的页面。
- `--html-file <path>` 会在可见浏览器中渲染 repo 本地 HTML 工件。Mantis 用它通过真实 Crabbox 桌面捕获生成的 Discord Status reaction 时间线。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 会让新创建且通过的 lease 保持打开，以便进行 VNC 检查。失败运行在创建了 lease 时默认保留该 lease，以便操作员可以重新连接。
- `--class`、`--idle-timeout` 和 `--ttl` 会调整机器规格和 lease 生命周期。

第一个完整桌面传输协议原语是 Slack 桌面 smoke：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它会租用或复用 Crabbox 桌面机器，将当前 checkout 同步到 VM 中，在该 VM 内运行 `pnpm openclaw qa slack`，在 VNC 浏览器中打开 Slack Web，捕获可见桌面，并将 Slack QA 工件和 VNC 截图复制回本地输出目录。这是第一个 SUT OpenClaw gateway 和浏览器都位于同一个 Linux 桌面 VM 内的 Mantis 形态。

使用 `--gateway-setup` 时，该命令会在 `$HOME/.openclaw-mantis/slack-openclaw` 准备持久的一次性 OpenClaw home，针对所选渠道修补 Slack Socket Mode 配置，在端口 `38973` 启动 `openclaw gateway run`，并让 Chrome 在 VNC 会话中持续运行。这是“给我留一个运行 Slack 和 claw 的 Linux 桌面”模式；省略 `--gateway-setup` 时，bot-to-bot Slack QA 通道仍为默认值。

`--credential-source env` 的必需输入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 远程模型通道使用的 `OPENCLAW_LIVE_OPENAI_KEY`。如果本地只设置了
  `OPENAI_API_KEY`，Mantis 会在调用 Crabbox 前将其映射到 `OPENCLAW_LIVE_OPENAI_KEY`，
  这样 Crabbox 的 `OPENCLAW_*` 环境转发即可把它带入 VM。

有用的 Slack 桌面标志：

- `--lease-id <cbx_...>` 会针对操作员已通过 VNC 登录 Slack Web 的机器重新运行。
- `--gateway-setup` 会在 VM 中启动持久的 OpenClaw Slack Gateway 网关，而不是只运行 bot-to-bot QA 通道。
- `--slack-url <url>` 会打开指定的 Slack Web URL。没有它时，如果 SUT bot token 可用，Mantis 会从 Slack `auth.test` 推导 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 控制 gateway 设置使用的 Slack 渠道 allowlist。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 内的持久 Chrome profile。默认值是 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手动 Slack Web 登录会在同一 lease 的重新运行中保留。
- `--credential-source convex --credential-role ci` 使用共享凭证池，而不是直接 Slack 环境 token。
- `--provider-mode`、`--model`、`--alt-model` 和 `--fast` 会传递给 Slack live 通道。

GitHub smoke workflow 是 `Mantis Discord Smoke`。第一个真实场景的 before 和 after GitHub workflow 是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期复现 queued-only 行为的 ref。
- `candidate_ref`：预期展示 `queued -> thinking -> done` 的 ref。

它会 checkout workflow harness ref，构建单独的基线和候选 worktree，针对每个 worktree 运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 上传为 Actions 工件。它还会在 Crabbox 桌面浏览器中渲染每个通道的时间线 HTML，并在 PR 评论中将这些 VNC 截图与确定性时间线 PNG 一起发布。同一 PR 评论会嵌入由 `crabbox media preview` 生成的轻量 motion-trimmed GIF 预览，链接到匹配的 motion-trimmed MP4 片段，并保留完整桌面 MP4 文件供深入检查。截图会保持内联，便于快速审阅。该 workflow 会从 `openclaw/crabbox` main 构建 Crabbox CLI，以便在下一个 Crabbox 二进制发布完成前使用当前桌面/浏览器 lease 标志。

`Mantis Scenario` 是通用手动入口点。它接收 `scenario_id`、`candidate_ref`、可选的 `baseline_ref` 和可选的 `pr_number`，然后调度场景拥有的 workflow。该包装器刻意保持很薄：场景 workflow 仍然拥有自己的传输协议设置、凭证、VM 规格、预期 oracle 和工件清单。

`Mantis Slack Desktop Smoke` 是第一个 Slack VM workflow。它会在单独的 worktree 中 checkout 受信任的候选 ref，租用 Crabbox Linux 桌面，针对该候选运行 `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`，在 VNC 浏览器中打开 Slack Web，录制桌面，使用 `crabbox media preview` 生成 motion-trimmed 预览，上传完整工件目录，并可选地在目标 PR 上发布内联证据评论。当你想要“一个运行 Slack 和 claw 的 Linux 桌面”，而不只是 bot-to-bot Slack transcript 时，使用这条通道。

每个会发布到 PR 的场景都会在报告旁写入 `mantis-evidence.json`。该 schema 是场景代码和 GitHub 评论之间的交接：

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

工件 `path` 值是相对于 manifest 目录的路径。`targetPath` 值是 `qa-artifacts` 分支发布目录下的相对路径。发布器会拒绝路径遍历，并在可选预览或视频不可用时跳过标记为 `"required": false` 的条目。

支持的工件类型：

- `timeline`：确定性场景截图，通常是 before/after。
- `desktopScreenshot`：VNC/浏览器桌面截图。
- `motionPreview`：从桌面录制生成的内联动画 GIF。
- `motionClip`：移除静态开头和结尾的 motion-trimmed MP4。
- `fullVideo`：用于深入检查的完整 MP4 录制。
- `metadata`：JSON/log sidecar。
- `report`：Markdown 报告。

可复用发布器是 `scripts/mantis/publish-pr-evidence.mjs`。Workflow 使用 manifest、目标 PR、`qa-artifacts` 目标根目录、评论 marker、Actions 工件 URL、运行 URL 和请求来源调用它。它会将声明的工件复制到 `qa-artifacts` 分支，构建以摘要优先的 PR 评论，其中包含内联图片/预览和链接视频，然后更新现有 marker 评论或创建一个新评论。

你也可以直接从 PR 评论触发 status-reactions 运行：

```text
@Mantis discord status reactions
```

评论触发器刻意保持范围很窄。它只会对具有 write、maintain 或 admin 权限的用户在 pull request 上的评论运行，并且只识别 Discord Status reaction 请求。默认情况下，它使用已知存在问题的基线 ref，并使用当前 PR head SHA 作为候选。维护者可以覆盖任一 ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一个命令是显式且聚焦场景的。第二个命令之后可以根据标签、变更文件和 ClawSweeper 审查发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭证。
2. 分配或复用一台 VM。
3. 在场景需要 UI 证据时，准备桌面/浏览器配置文件。
4. 为基线 ref 准备干净的 checkout。
5. 安装依赖，并只构建场景所需内容。
6. 使用隔离的状态目录启动一个子 OpenClaw Gateway 网关。
7. 配置实时传输协议、提供商、模型和浏览器配置文件。
8. 运行场景并捕获基线证据。
9. 停止 Gateway 网关并保留日志。
10. 在同一台 VM 中准备候选 ref。
11. 运行相同场景并捕获候选证据。
12. 比较判定源结果和视觉证据。
13. 写入 Markdown、JSON、日志、截图和可选 trace 工件。
14. 上传 GitHub Actions 工件。
15. 发布简洁的 PR 或 Discord Status 消息。

场景应该能够以两种不同方式失败：

- **已复现 bug**：基线以预期方式失败。
- **Harness 失败**：环境设置、凭证、Discord API、浏览器或提供商在 bug 判定源有意义之前失败。

最终报告必须区分这些情况，以免维护者将不稳定环境与产品行为混淆。

## Discord 最小可行版本

第一个场景应该针对公会渠道中的 Discord Status 反应，其中源回复投递模式为 `message_tool_only`。

它是一个好的 Mantis 种子场景，原因如下：

- 它在 Discord 中可见，表现为触发消息上的反应。
- 它通过 Discord 消息反应状态提供强 REST 判定源。
- 它会执行真实的 OpenClaw Gateway 网关、Discord bot 认证、消息分发、源回复投递模式、Status 反应状态和模型轮次生命周期。
- 它足够窄，可以让第一个实现保持务实。

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

基线证据应该显示已排队的确认反应，但在仅工具模式中没有生命周期转换。候选证据应该显示，当 `messages.statusReactions.enabled` 被显式设为 true 时，生命周期 Status 反应会运行。

第一个可执行切片是可选启用的 Discord 实时 QA 场景：

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
"message_tool"`、`ackReaction: "👀"` 和显式 Status 反应。判定源会轮询真实的 Discord 触发消息，并期望观察到序列 `👀 -> 🤔 -> 👍`。工件包括 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应该基于现有私有 QA 栈构建，而不是从零开始：

- `pnpm openclaw qa discord` 已经使用 driver 和 SUT bot 运行实时 Discord 路径。
- 实时传输运行器已经会在 `.artifacts/qa-e2e/` 下写入报告和观察到的消息工件。
- Convex 凭证租约已经提供对共享实时传输凭证的独占访问。
- 浏览器控制服务已经支持截图、快照、无头托管配置文件和远程 CDP 配置文件。
- QA Lab 已经有用于传输形态测试的调试器 UI 和总线。

第一个 Mantis 实现可以是在这些组件之上的薄 before/after 运行器，再加上一层视觉证据。

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

`mantis-summary.json` 应该是机器可读的事实来源。Markdown 报告用于 PR 评论和人工审查。

摘要必须包含：

- 测试过的 refs 和 SHA
- 传输协议和场景 id
- 机器提供商和机器 id 或租约 id
- 不含秘密值的凭证来源
- 基线结果
- 候选结果
- bug 是否在基线上复现
- 候选是否修复了它
- 工件路径
- 已清理的设置或清理问题

截图是证据，不是秘密。它们仍然需要遵守脱敏规范：私有渠道名称、用户名或消息内容可能会出现。对于公开 PR，在脱敏方案更成熟之前，优先使用 GitHub Actions 工件链接，而不是内嵌图片。

## 浏览器和 VNC

浏览器路径有两种模式：

- **无头自动化**：CI 默认模式。Chrome 启用 CDP 运行，并由 Playwright 或 OpenClaw 浏览器控制捕获截图。
- **VNC 救援**：在同一台 VM 上启用，用于登录、MFA、Discord 反自动化或需要人工的视觉调试。

Discord 观察者浏览器配置文件应该足够持久，以避免每次运行都登录，但要与个人浏览器状态隔离。配置文件属于 Mantis 机器池，而不是开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord Status 消息，包含：

- 运行 id
- 场景 id
- 机器提供商
- 工件目录
- 如果可用，提供 VNC 或 noVNC 连接说明
- 简短阻塞原因文本

第一个私有部署可以先将这些消息发布到现有 operator 渠道，之后再迁移到专用 Mantis 渠道。

## 机器

第一个远程实现中，Mantis 应该优先通过 Crabbox 使用 AWS。Crabbox 为我们提供预热机器、租约跟踪、hydration、日志、结果和清理。如果 AWS 容量太慢或不可用，则在相同机器接口后面添加 Hetzner 提供商。

最低 VM 要求：

- Linux，并安装可用于桌面的 Chrome 或 Chromium
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够的 CPU 和内存，可运行一个 OpenClaw Gateway 网关、一个浏览器和一次模型运行
- 可出站访问 Discord、GitHub、模型提供商和凭证 broker

VM 不应在预期凭证或浏览器配置文件存储之外保留长期存在的原始秘密。

## 秘密

远程运行的秘密位于 GitHub 组织或仓库 secrets 中，本地运行的秘密位于由本地 operator 控制的 secret 文件中。

推荐的 secret 名称：

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

长期来看，Convex 凭证池应该继续作为实时传输凭证的常规来源。GitHub secrets 用于引导 broker 和 fallback 路径。Discord Status 反应工作流会将 Mantis Crabbox secrets 映射回 Crabbox CLI 期望的 `CRABBOX_COORDINATOR` 和 `CRABBOX_COORDINATOR_TOKEN` 环境变量。普通的 `CRABBOX_*` GitHub secret 名称仍作为兼容 fallback 被接受。

Mantis 运行器绝不能打印：

- Discord bot token
- 提供商 API key
- 浏览器 cookie
- 认证配置文件内容
- VNC 密码
- 原始凭证载荷

公开工件上传还应该脱敏 Discord 目标元数据，例如 bot、公会、渠道和消息 id。GitHub smoke 工作流因此启用了 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 被意外粘贴到 issue、PR、聊天或日志中，请在新 secret 存储后轮换它。

## GitHub 工件和 PR 评论

Mantis 工作流应该将完整证据包上传为短期 Actions 工件。当工作流针对 bug 报告或修复 PR 运行时，它还应该将脱敏 PNG 截图发布到 `qa-artifacts` 分支，并在该 bug 或修复 PR 上 upsert 一条带内嵌前后对比截图的评论。不要只把主要证据发布到通用 QA 自动化 PR 上。原始日志、观察到的消息和其他大体积证据保留在 Actions 工件中。

生产工作流应该使用 Mantis GitHub App 发布这些评论，而不是使用 `github-actions[bot]`。将 app id 和私钥作为 `MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions secrets 存储。工作流使用隐藏标记作为 upsert key，在 token 可以编辑时更新该评论；当较旧的 bot 所有标记无法编辑时，创建一条新的 Mantis 所有评论。

PR 评论应该简短且可视化：

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

当运行因 harness 失败而失败时，评论必须说明这一点，而不是暗示候选失败。

## 私有部署说明

私有部署中可能已经有一个 Mantis Discord 应用。如果该应用具备正确的 bot 权限并且可以安全轮换，请复用该应用，而不是创建另一个应用。

通过 secrets 或部署配置设置初始 operator 通知渠道。它可以先指向现有维护者或运维渠道，然后在专用 Mantis 渠道存在后再迁移过去。

不要将公会 id、渠道 id、bot token、浏览器 cookie 或 VNC 密码放入本文档。将它们存储在 GitHub secrets、凭证 broker 或 operator 的本地 secret 存储中。

## 添加场景

Mantis 场景应该声明：

- id 和标题
- 传输协议
- 所需凭证
- 基线 ref 策略
- 候选 ref 策略
- OpenClaw 配置补丁
- 设置步骤
- 刺激输入
- 预期基线判定源
- 预期候选判定源
- 视觉捕获目标
- 超时预算
- 清理步骤

场景应该优先使用小型、类型化的判定源：

- 针对反应 bug 使用 Discord 反应状态
- 针对穿线 bug 使用 Discord 消息引用
- 针对 Slack bug 使用 Slack thread ts 和反应 API 状态
- 针对电子邮件 bug 使用电子邮件消息 id 和标头
- 当 UI 是唯一可靠可观察对象时使用浏览器截图

视觉检查应该是附加的。如果平台 API 可以证明 bug，请使用 API 作为通过/失败判定源，并保留截图用于增强人工信心。

## 提供商扩展

在 Discord 之后，同一运行器可以添加：

- Slack：回应、线程、应用提及、模态窗口、文件上传。
- 电子邮件：在连接器不够用的地方，使用 `gog` 进行 Gmail 凭证和消息线程处理。
- WhatsApp：二维码登录、重新识别、消息送达、媒体、回应。
- Telegram：群组提及门控、命令、可用时的回应。
- Matrix：加密房间、线程或回复关系、重启后恢复。

每种传输协议都应该有一个低成本冒烟场景，以及一个或多个缺陷类别场景。成本较高的可视场景应保持为可选启用。

## 未决问题

- 复用现有 Mantis 机器人时，哪个 Discord 机器人应作为驱动端，哪个应作为被测系统？
- 观察者浏览器登录在第一阶段应使用真人 Discord 账号、测试账号，还是仅使用机器人可读的 REST 证据？
- GitHub 应为 PR 保留 Mantis 工件多长时间？
- ClawSweeper 应在什么时候自动推荐 Mantis，而不是等待维护者命令？
- 对于公开 PR，截图在上传前是否应进行脱敏或裁剪？
