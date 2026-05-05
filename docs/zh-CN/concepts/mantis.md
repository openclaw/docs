---
read_when:
    - 为 OpenClaw 缺陷构建或运行实时视觉 QA
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是用于在实时传输协议上复现 OpenClaw 错误、捕获前后证据并将制品附加到 PR 的可视化端到端验证系统。
title: Mantis
x-i18n:
    generated_at: "2026-05-05T09:12:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2db0e0ba75da831f29cc5312e9468db7d3a91d97f0b7a8c8f30c51bd128d148c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 的端到端验证系统，适用于需要真实运行时、真实传输协议和可见证据的 bug。它会针对已知有问题的 ref 运行一个场景并捕获证据，再针对候选 ref 运行同一场景，然后将对比结果发布为工件，维护者可以从 PR 或本地命令中检查这些工件。

Mantis 从 Discord 开始，因为 Discord 为我们提供了高价值的首条验证线路：真实 bot 凭证、真实 guild 渠道、回应、线程、原生命令，以及一个可供人类直观看到传输协议显示内容的浏览器 UI。

## 目标

- 使用与用户所见相同的传输协议形态，从 GitHub issue 或 PR 中复现 bug。
- 在应用修复前，在基线 ref 上捕获一个 **before** 工件。
- 在应用修复后，在候选 ref 上捕获一个 **after** 工件。
- 尽可能使用确定性 oracle，例如 Discord REST 回应读取或渠道 transcript 检查。
- 当 bug 具有可见 UI 表面时捕获截图。
- 从智能体控制的 CLI 本地运行，并从 GitHub 远程运行。
- 在登录、浏览器自动化或提供商凭证卡住时，保留足够的机器状态用于 VNC 救援。
- 当运行被阻塞、需要手动 VNC 帮助或完成时，向操作者 Discord 渠道发布简洁状态。

## 非目标

- Mantis 不是单元测试的替代品。修复被理解之后，一次 Mantis 运行通常应转化为更小的回归测试。
- Mantis 不是常规的快速 CI 门禁。它更慢，会使用实时凭证，并保留给实时环境重要的 bug。
- Mantis 不应在正常操作中需要人工介入。手动 VNC 是救援路径，不是理想路径。
- Mantis 不会在工件、日志、截图、Markdown 报告或 PR 评论中存储原始密钥。

## 职责归属

Mantis 位于 OpenClaw QA 栈中。

- OpenClaw 拥有场景运行时、传输协议适配器、证据 schema，以及 `pnpm openclaw qa mantis` 下的本地 CLI。
- QA Lab 拥有实时传输协议 harness 组件、浏览器捕获辅助工具和工件写入器。
- 需要远程 VM 时，Crabbox 拥有预热的 Linux 机器。
- GitHub Actions 拥有远程 workflow 入口点和工件保留。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、调度 workflow，以及发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体通过 Codex 驱动 Mantis。

这一边界让传输协议知识保留在 OpenClaw 中，让机器调度保留在 Crabbox 中，并让维护者 workflow 胶水保留在 ClawSweeper 中。

## 命令形式

第一个本地命令会验证 Discord bot、guild、渠道、消息发送、回应发送和工件路径：

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

运行器会在输出目录下创建分离的基线和候选 worktree，安装依赖，构建每个 ref，使用 `--allow-failures` 运行场景，然后写入 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md`。对于第一个 Discord 场景，验证成功意味着基线状态为 `fail`，候选状态为 `pass`。

第一个 VM/浏览器原语是桌面 smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它会租用或复用一台 Crabbox 桌面机器，在 VNC 会话中启动可见浏览器，捕获桌面，将工件拉回本地输出目录，并将重连命令写入报告。该命令默认使用 Hetzner 提供商，因为它是 Mantis 验证线路中第一个具备可用桌面/VNC 覆盖的提供商。针对另一组 Crabbox fleet 运行时，可用 `--provider`、`--crabbox-bin` 或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆盖。

有用的桌面 smoke 标志：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 会复用预热的桌面。
- `--browser-url <url>` 会更改可见浏览器打开的页面。
- `--html-file <path>` 会在可见浏览器中渲染仓库本地 HTML 工件。Mantis 使用它通过真实 Crabbox 桌面捕获生成的 Discord 状态回应时间线。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 会让新创建且通过的 lease 保持打开，以供 VNC 检查。失败运行在创建了 lease 时默认保留该 lease，便于操作者重新连接。
- `--class`、`--idle-timeout` 和 `--ttl` 会调整机器规格和 lease 生命周期。

第一个完整桌面传输协议原语是 Slack 桌面 smoke：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它会租用或复用一台 Crabbox 桌面机器，将当前 checkout 同步到 VM 中，在该 VM 内运行 `pnpm openclaw qa slack`，在 VNC 浏览器中打开 Slack Web，捕获可见桌面，并将 Slack QA 工件和 VNC 截图复制回本地输出目录。这是第一个 Mantis 形态，其中 SUT OpenClaw Gateway 网关 和浏览器都位于同一个 Linux 桌面 VM 中。

使用 `--gateway-setup` 时，该命令会在 `$HOME/.openclaw-mantis/slack-openclaw` 准备一个持久的一次性 OpenClaw home，为所选渠道 patch Slack Socket Mode 配置，在端口 `38973` 上启动 `openclaw gateway run`，并让 Chrome 在 VNC 会话中持续运行。这是“给我留一个运行着 Slack 和 claw 的 Linux 桌面”模式；省略 `--gateway-setup` 时，bot-to-bot Slack QA 验证线路仍是默认模式。

`--credential-source env` 的必需输入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 用于远程模型验证线路的 `OPENCLAW_LIVE_OPENAI_KEY`。如果本地只设置了 `OPENAI_API_KEY`，Mantis 会在调用 Crabbox 前将它映射到 `OPENCLAW_LIVE_OPENAI_KEY`，这样 Crabbox 的 `OPENCLAW_*` 环境变量转发就能把它带入 VM。

使用 `--gateway-setup --credential-source convex` 时，Mantis 会在创建 VM 前从共享池租用 Slack SUT 凭证，并将租用的渠道 id、Socket Mode app token 和 bot token 作为桌面内的 `OPENCLAW_MANTIS_SLACK_*` 运行时环境变量转发。这样可以让 GitHub workflow 保持轻量：它们只需要 Convex broker 密钥，而不需要原始 Slack bot 或 app token。

有用的 Slack 桌面标志：

- `--lease-id <cbx_...>` 会在操作者已经通过 VNC 登录 Slack Web 的机器上重新运行。
- `--gateway-setup` 会在 VM 中启动持久 OpenClaw Slack Gateway 网关，而不是只运行 bot-to-bot QA 验证线路。
- `--slack-url <url>` 会打开特定 Slack Web URL。不提供时，如果 SUT bot token 可用，Mantis 会根据 Slack `auth.test` 推导 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 会控制 Gateway 网关设置使用的 Slack 渠道 allowlist。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 会控制 VM 内的持久 Chrome profile。默认值为 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手动 Slack Web 登录会在同一 lease 上跨重新运行保留。
- `--credential-source convex --credential-role ci` 会使用共享凭证池，而不是直接 Slack 环境变量 token。
- `--provider-mode`、`--model`、`--alt-model` 和 `--fast` 会透传到 Slack 实时验证线路。

GitHub smoke workflow 是 `Mantis Discord Smoke`。第一个真实场景的 before 和 after GitHub workflow 是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期会复现仅 queued 行为的 ref。
- `candidate_ref`：预期会显示 `queued -> thinking -> done` 的 ref。

它会 checkout workflow harness ref，构建独立的基线和候选 worktree，针对每个 worktree 运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 上传为 Actions 工件。它还会在 Crabbox 桌面浏览器中渲染每条验证线路的时间线 HTML，并在 PR 评论中把这些 VNC 截图与确定性时间线 PNG 一起发布。同一条 PR 评论会嵌入由 `crabbox media preview` 生成的轻量级运动裁剪 GIF 预览，链接到匹配的运动裁剪 MP4 片段，并保留完整桌面 MP4 文件用于深入检查。截图会保持内联，便于快速审查。该 workflow 从 `openclaw/crabbox` main 构建 Crabbox CLI，以便在下一个 Crabbox 二进制发布 cut 之前使用当前桌面/浏览器 lease 标志。

`Mantis Scenario` 是通用手动入口点。它接受 `scenario_id`、`candidate_ref`、可选的 `baseline_ref` 和可选的 `pr_number`，然后调度场景拥有的 workflow。该 wrapper 刻意保持轻量：场景 workflow 仍然拥有自己的传输协议设置、凭证、VM class、预期 oracle 和工件 manifest。

`Mantis Slack Desktop Smoke` 是第一个 Slack VM workflow。它会在单独的 worktree 中 checkout 受信任候选 ref，租用 Crabbox Linux 桌面，针对该候选运行 `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`，在 VNC 浏览器中打开 Slack Web，录制桌面，使用 `crabbox media preview` 生成运动裁剪预览，上传完整工件目录，并可选地在目标 PR 上发布内联证据评论。当你想要“一个运行着 Slack 和 claw 的 Linux 桌面”，而不是只有 bot-to-bot Slack transcript 时，使用这条验证线路。

每个发布到 PR 的场景都会在其报告旁写入 `mantis-evidence.json`。这个 schema 是场景代码和 GitHub 评论之间的交接：

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

工件 `path` 值相对于 manifest 目录。`targetPath` 值是 `qa-artifacts` 分支发布目录下的相对路径。发布器会拒绝路径遍历，并在可选预览或视频不可用时跳过标记为 `"required": false` 的条目。

支持的工件种类：

- `timeline`：确定性场景截图，通常是 before/after。
- `desktopScreenshot`：VNC/浏览器桌面截图。
- `motionPreview`：从桌面录制生成的内联动画 GIF。
- `motionClip`：移除静态开头和结尾的运动裁剪 MP4。
- `fullVideo`：用于深入检查的完整 MP4 录制。
- `metadata`：JSON/日志 sidecar。
- `report`：Markdown 报告。

可复用发布器是 `scripts/mantis/publish-pr-evidence.mjs`。Workflow 会使用 manifest、目标 PR、`qa-artifacts` 目标根目录、评论 marker、Actions 工件 URL、运行 URL 和请求来源来调用它。它会将声明的工件复制到 `qa-artifacts` 分支，构建一条摘要优先的 PR 评论，其中包含内联图片/预览和链接视频，然后更新现有 marker 评论或创建一条新评论。

你也可以直接从 PR 评论触发状态回应运行：

```text
@Mantis discord status reactions
```

评论触发器的范围有意保持狭窄。它只会针对具有 write、maintain 或 admin 权限用户发布的 pull request 评论运行，并且只识别 Discord 状态 reaction 请求。默认情况下，它使用已知故障基线 ref 和当前 PR head SHA 作为候选版本。维护者可以覆盖任一 ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一个命令是显式的，并且聚焦于场景。第二个命令稍后可以根据标签、变更文件和 ClawSweeper 审查发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭据。
2. 分配或复用 VM。
3. 当场景需要 UI 证据时，准备桌面/浏览器配置文件。
4. 为基线 ref 准备干净的 checkout。
5. 安装依赖，并且只构建场景所需内容。
6. 使用隔离的状态目录启动子 OpenClaw Gateway 网关。
7. 配置实时传输协议、提供商、模型和浏览器配置文件。
8. 运行场景并捕获基线证据。
9. 停止 Gateway 网关并保留日志。
10. 在同一 VM 中准备候选 ref。
11. 运行相同场景并捕获候选证据。
12. 比较 oracle 结果和视觉证据。
13. 写入 Markdown、JSON、日志、截图和可选 trace 构件。
14. 上传 GitHub Actions 构件。
15. 发布简洁的 PR 或 Discord 状态消息。

场景应当能够以两种不同方式失败：

- **复现了 bug**：基线按预期方式失败。
- **Harness 失败**：环境设置、凭据、Discord API、浏览器或提供商在 bug oracle 具有意义之前失败。

最终报告必须区分这些情况，避免维护者将不稳定环境与产品行为混淆。

## Discord MVP

第一个场景应针对 guild channel 中的 Discord 状态 reactions，其中来源回复投递模式是 `message_tool_only`。

它适合作为 Mantis 种子场景的原因：

- 它在 Discord 中表现为触发消息上的 reactions，可见。
- 它通过 Discord 消息 reaction 状态提供强 REST oracle。
- 它覆盖真实的 OpenClaw Gateway 网关、Discord bot 认证、消息分发、来源回复投递模式、状态 reaction 状态和模型轮次生命周期。
- 它足够狭窄，能让第一个实现保持可靠。

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

基线证据应显示已排队的确认 reaction，但在仅工具模式下没有生命周期转换。候选证据应显示当 `messages.statusReactions.enabled` 被显式设为 true 时，生命周期状态 reactions 正在运行。

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

它会为 SUT 配置始终开启的 guild 处理、`visibleReplies: "message_tool"`、`ackReaction: "👀"` 和显式状态 reactions。oracle 会轮询真实的 Discord 触发消息，并期望观察到序列 `👀 -> 🤔 -> 👍`。构件包括 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应基于现有私有 QA 栈构建，而不是从零开始：

- `pnpm openclaw qa discord` 已经运行带有 driver 和 SUT bots 的实时 Discord lane。
- 实时传输协议 runner 已经在 `.artifacts/qa-e2e/` 下写入报告和已观察消息构件。
- Convex 凭据租约已经提供对共享实时传输协议凭据的独占访问。
- 浏览器控制服务已经支持截图、快照、headless 托管配置文件和远程 CDP 配置文件。
- QA Lab 已经拥有用于传输协议形态测试的调试器 UI 和 bus。

第一个 Mantis 实现可以是在这些组件之上的轻量前后对比 runner，再加上一层视觉证据。

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

`mantis-summary.json` 应是机器可读的事实来源。Markdown 报告用于 PR 评论和人工审查。

摘要必须包含：

- 已测试的 refs 和 SHAs
- 传输协议和场景 ID
- 机器提供商和机器 ID 或租约 ID
- 不包含密钥值的凭据来源
- 基线结果
- 候选结果
- bug 是否在基线上复现
- 候选版本是否修复了它
- 构件路径
- 已脱敏的设置或清理问题

截图是证据，不是密钥。它们仍然需要遵守脱敏规范：可能出现私有频道名称、用户名或消息内容。对于公开 PR，在脱敏方案更完善之前，优先使用 GitHub Actions 构件链接，而不是内联图片。

## 浏览器和 VNC

浏览器 lane 有两种模式：

- **Headless 自动化**：CI 默认模式。Chrome 启用 CDP 运行，Playwright 或 OpenClaw 浏览器控制会捕获截图。
- **VNC 救援**：当登录、MFA、Discord 反自动化或视觉调试需要人工介入时，在同一 VM 上启用。

Discord 观察者浏览器配置文件应足够持久，避免每次运行都登录，但应与个人浏览器状态隔离。配置文件属于 Mantis 机器池，而不是开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord 状态消息，其中包含：

- 运行 ID
- 场景 ID
- 机器提供商
- 构件目录
- 可用时的 VNC 或 noVNC 连接说明
- 简短阻塞文本

第一个私有部署可以把这些消息发布到现有 operator 频道，之后再迁移到专用 Mantis 频道。

## 机器

第一个远程实现中，Mantis 应优先通过 Crabbox 使用 AWS。Crabbox 为我们提供预热机器、租约跟踪、hydration、日志、结果和清理。如果 AWS 容量太慢或不可用，在相同机器接口后添加 Hetzner 提供商。

最低 VM 要求：

- Linux，并安装支持桌面的 Chrome 或 Chromium
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够的 CPU 和内存，可运行一个 OpenClaw Gateway 网关、一个浏览器和一次模型运行
- 可出站访问 Discord、GitHub、模型提供商和凭据 broker

VM 不应在预期的凭据或浏览器配置文件存储之外保留长期 raw secrets。

## 密钥

远程运行的密钥存放在 GitHub 组织或仓库密钥中，本地运行的密钥存放在由本地 operator 控制的密钥文件中。

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
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

长期来看，Convex 凭据池应继续作为实时传输协议凭据的常规来源。GitHub secrets 用于引导 broker 和 fallback lanes。Discord 状态 reactions workflow 会将 Mantis Crabbox secrets 映射回 Crabbox CLI 期望的 `CRABBOX_COORDINATOR` 和 `CRABBOX_COORDINATOR_TOKEN` 环境变量。普通的 `CRABBOX_*` GitHub secret 名称仍作为兼容 fallback 被接受。

Mantis runner 绝不能打印：

- Discord bot tokens
- 提供商 API keys
- 浏览器 cookies
- 认证配置文件内容
- VNC passwords
- raw credential payloads

公开构件上传还应脱敏 Discord 目标元数据，例如 bot、guild、channel 和 message ids。GitHub smoke workflow 因此启用了 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 被意外粘贴到 issue、PR、聊天或日志中，请在新密钥存储完成后轮换它。

## GitHub 构件和 PR 评论

Mantis workflows 应将完整证据包作为短期 Actions 构件上传。当 workflow 针对 bug 报告或修复 PR 运行时，它还应将脱敏后的 PNG 截图发布到 `qa-artifacts` 分支，并在该 bug 或修复 PR 上 upsert 一条带有内联前后对比截图的评论。不要只把主要证明发布在通用 QA 自动化 PR 上。raw logs、已观察消息和其他大型证据保留在 Actions 构件中。

生产 workflows 应使用 Mantis GitHub App 发布这些评论，而不是使用 `github-actions[bot]`。将 app id 和 private key 存储为 `MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions secrets。workflow 使用隐藏 marker 作为 upsert key，当 token 可以编辑评论时更新该评论；当旧的 bot-owned marker 无法编辑时，创建一条新的 Mantis-owned 评论。

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

当运行因为 harness 失败而失败时，评论必须说明这一点，而不是暗示候选版本失败。

## 私有部署说明

私有部署可能已经有一个 Mantis Discord 应用。如果该应用具备正确的 bot 权限并且可以安全轮换，请复用它，而不是创建另一个 app。

通过 secrets 或部署配置设置初始 operator 通知频道。它可以先指向现有维护者或 operations 频道，然后在专用 Mantis 频道存在后再迁移过去。

不要在本文档中放入 guild ids、channel ids、bot tokens、浏览器 cookies 或 VNC passwords。将它们存储在 GitHub secrets、凭据 broker 或 operator 的本地密钥存储中。

## 添加场景

Mantis 场景应声明：

- ID 和标题
- 传输协议
- 所需凭据
- 基线 ref 策略
- 候选 ref 策略
- OpenClaw 配置 patch
- 设置步骤
- stimulus
- 预期基线 oracle
- 预期候选 oracle
- 视觉捕获目标
- 超时预算
- 清理步骤

场景应优先使用小型、带类型的 oracles：

- reaction bug 使用 Discord reaction 状态
- threading bug 使用 Discord 消息引用
- Slack bug 使用 Slack thread ts 和 reaction API 状态
- email bug 使用 email message ids 和 headers
- 当 UI 是唯一可靠可观察项时，使用浏览器截图

视觉检查应是增量式的。如果平台 API 能证明该 bug，就使用该 API 作为通过/失败判据，并保留截图供人工确认。

## 提供商扩展

在 Discord 之后，同一个运行器可以添加：

- Slack：回应、线程、应用提及、模态框、文件上传。
- 电子邮件：在连接器不足时，使用 `gog` 进行 Gmail 认证和消息串联。
- WhatsApp：二维码登录、重新识别、消息送达、媒体、回应。
- Telegram：群组提及门禁、命令、可用时的回应。
- Matrix：加密房间、线程或回复关系、重启恢复。

每种传输协议都应有一个低成本的冒烟场景，以及一个或多个 bug 类别场景。昂贵的视觉场景应保持为可选启用。

## 未决问题

- 复用现有 Mantis 机器人时，哪个 Discord 机器人应作为驱动端，哪个应作为被测系统？
- 第一阶段中，观察者浏览器登录应使用真人 Discord 账号、测试账号，还是只使用机器人可读取的 REST 证据？
- GitHub 应为 PR 保留 Mantis 工件多久？
- ClawSweeper 应在何时自动推荐 Mantis，而不是等待维护者命令？
- 上传到公开 PR 前，截图是否应进行打码或裁剪？
