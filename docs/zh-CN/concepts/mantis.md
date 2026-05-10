---
read_when:
    - 构建或运行针对 OpenClaw 缺陷的实时可视化 QA
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是一种可视化端到端验证系统，用于在实时传输协议上复现 OpenClaw bug、捕获前后证据，并将构件附加到 PR。
title: Mantis
x-i18n:
    generated_at: "2026-05-10T19:30:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1622b86cb5e08def1c8f06a16a0f454c67a58cf42f6c08c40bd66754648b9a95
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 端到端验证系统，面向需要真实运行时、真实传输协议和可见证据的 bug。它会针对一个已知有问题的引用运行场景，捕获证据，再针对一个候选引用运行相同场景，并将对比结果发布为产物，维护者可以从 PR 或本地命令中检查。

Mantis 从 Discord 开始，因为 Discord 提供了一条高价值的首条验证通道：真实 bot 凭证、真实 guild 频道、reaction、thread、原生命令，以及一个浏览器 UI，方便人员直观看到传输协议展示的内容。

## 目标

- 用用户看到的同类传输形态，复现 GitHub issue 或 PR 中的 bug。
- 在应用修复前，在基线引用上捕获 **before** 产物。
- 在应用修复后，在候选引用上捕获 **after** 产物。
- 尽可能使用确定性 oracle，例如 Discord REST reaction 读取或频道 transcript 检查。
- 当 bug 有可见 UI 表面时捕获截图。
- 从智能体控制的 CLI 本地运行，也可从 GitHub 远程运行。
- 当登录、浏览器自动化或提供商凭证卡住时，保留足够的机器状态用于 VNC 救援。
- 当运行被阻塞、需要手动 VNC 帮助或完成时，向操作员 Discord 频道发布简洁状态。

## 非目标

- Mantis 不是单元测试的替代品。理解修复后，Mantis 运行通常应转化为更小的回归测试。
- Mantis 不是常规的快速 CI 门禁。它更慢，使用实时凭据，并保留给实时环境很重要的 bug。
- Mantis 正常运行不应需要人工介入。手动 VNC 是救援路径，不是理想路径。
- Mantis 不会在产物、日志、截图、Markdown 报告或 PR 评论中存储原始 secret。

## 所有权

Mantis 位于 OpenClaw QA 栈中。

- OpenClaw 拥有场景运行时、传输适配器、证据架构，以及 `pnpm openclaw qa mantis` 下的本地 CLI。
- QA Lab 拥有实时传输 harness 部分、浏览器捕获辅助工具和产物写入器。
- Crabbox 在需要远程 VM 时拥有预热的 Linux 机器。
- GitHub Actions 拥有远程工作流入口点和产物保留。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、派发工作流并发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体通过 Codex 驱动 Mantis。

该边界将传输知识保留在 OpenClaw 中，将机器调度保留在 Crabbox 中，并将维护者工作流粘合逻辑保留在 ClawSweeper 中。

## 命令形态

第一个本地命令会验证 Discord bot、guild、频道、消息发送、reaction 发送和产物路径：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本地 before 和 after runner 接受以下形态：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

该 runner 会在输出目录下创建分离的 baseline 和 candidate worktree，安装依赖，构建每个引用，使用 `--allow-failures` 运行场景，然后写入 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md`。对于第一个 Discord 场景，验证成功意味着 baseline 状态是 `fail`，candidate 状态是 `pass`。

第二个 Discord before/after 探针面向 thread 附件：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

该场景会用 driver bot 发布父消息，创建真实 Discord thread，使用仓库本地 `filePath` 调用 OpenClaw 的 `message.thread-reply` action，然后轮询 thread，查找 SUT 回复和附件文件名。baseline 截图显示回复没有附件；candidate 截图显示预期的 `mantis-thread-report.md` 附件。

第一个 VM/browser primitive 是桌面 smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它会租用或复用 Crabbox 桌面机器，在 VNC 会话中启动可见浏览器，捕获桌面，将产物拉回本地输出目录，并把重连命令写入报告。该命令默认使用 Hetzner 提供商，因为它是 Mantis 通道中第一个具备可用桌面/VNC 覆盖的提供商。针对另一个 Crabbox fleet 运行时，可用 `--provider`、`--crabbox-bin` 或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆盖。

有用的桌面 smoke 标志：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 复用预热桌面。
- `--browser-url <url>` 更改可见浏览器打开的页面。
- `--html-file <path>` 在可见浏览器中渲染仓库本地 HTML 产物。Mantis 使用它通过真实 Crabbox 桌面捕获生成的 Discord status-reaction timeline。
- `--browser-profile-dir <remote-path>` 复用远程 Chrome user-data-dir，以便持久 Mantis 桌面可在多次运行之间保持登录。将它用于长期存在的 Discord Web viewer profile。
- `--browser-profile-archive-env <name>` 在启动浏览器前，从命名环境变量恢复 base64 `.tgz` Chrome user-data-dir 归档。将它用于已登录见证者，例如 Discord Web。默认环境变量是 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`。
- `--video-duration <seconds>` 控制 MP4 捕获长度。对需要时间稳定下来的慢速已登录 Web 应用使用更长时长。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 保持新创建且通过的租约打开，以便 VNC 检查。当运行失败且创建了租约时，默认保留租约，以便操作员可重连。
- `--class`、`--idle-timeout` 和 `--ttl` 调整机器规格和租约生命周期。

对于 Discord Web 证据，Mantis 使用专用 viewer 账号，而不是 bot token。实时 Discord API 场景仍然是 oracle：它创建真实 thread，发送 SUT `thread-reply`，并通过 Discord REST 检查附件。设置 `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` 时，该场景还会写入 Discord Web URL 产物。设置 `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` 时，它会将该 thread 保留足够长的时间，供已登录浏览器打开和录制。

GitHub 工作流会在 Discord Web 中打开候选 thread URL，捕获截图，录制 MP4，并在 Crabbox 媒体工具可用时生成裁剪过动作的 GIF 预览。优先使用通过 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 配置的持久 viewer profile 路径，因为完整 Chrome profile 归档可能超过 GitHub 的 secret 大小限制。对于小型/bootstrap profile，工作流也可以从 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 恢复 base64 `.tgz` 归档。如果两个 profile 来源都未配置，工作流仍会发布确定性的 baseline/candidate 附件截图，并记录一条 notice，说明已跳过已登录 Discord Web 见证者。

第一个完整桌面传输 primitive 是 Slack 桌面 smoke：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它会租用或复用 Crabbox 桌面机器，将当前 checkout 同步到 VM 中，在该 VM 内运行 `pnpm openclaw qa slack`，在 VNC 浏览器中打开 Slack Web，捕获可见桌面，并将 Slack QA 产物和 VNC 截图都复制回本地输出目录。这是第一个让 SUT OpenClaw gateway 和浏览器都位于同一个 Linux 桌面 VM 中的 Mantis 形态。

使用 `--gateway-setup` 时，该命令会在 `$HOME/.openclaw-mantis/slack-openclaw` 准备一个持久的一次性 OpenClaw home，为所选频道修补 Slack Socket Mode 配置，在端口 `38973` 上启动 `openclaw gateway run`，并保持 Chrome 在 VNC 会话中运行。这是“给我留一台带 Slack 和运行中 claw 的 Linux 桌面”模式；省略 `--gateway-setup` 时，bot-to-bot Slack QA 通道仍为默认值。

`--credential-source env` 的必需输入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 远程模型通道需要 `OPENCLAW_LIVE_OPENAI_KEY`。如果本地只设置了 `OPENAI_API_KEY`，Mantis 会在调用 Crabbox 前将其映射到 `OPENCLAW_LIVE_OPENAI_KEY`，以便 Crabbox 的 `OPENCLAW_*` 环境变量转发可以将其带入 VM。

使用 `--gateway-setup --credential-source convex` 时，Mantis 会在创建 VM 前从共享池租用 Slack SUT 凭据，并将租用的 channel id、Socket Mode app token 和 bot token 作为桌面内的 `OPENCLAW_MANTIS_SLACK_*` 运行时环境变量转发。这让 GitHub 工作流保持轻量：它们只需要 Convex broker secret，不需要原始 Slack bot 或 app token。

有用的 Slack 桌面标志：

- `--lease-id <cbx_...>` 针对操作员已通过 VNC 登录 Slack Web 的机器重新运行。
- `--gateway-setup` 在 VM 中启动持久 OpenClaw Slack gateway，而不是只运行 bot-to-bot QA 通道。
- `--keep-lease` 在成功后保持 gateway VM 打开以供 VNC 检查；`--no-keep-lease` 在收集产物后停止它。
- `--slack-url <url>` 打开特定 Slack Web URL。没有该参数时，如果 SUT bot token 可用，Mantis 会从 Slack `auth.test` 推导 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 控制 gateway 设置使用的 Slack 频道 allowlist。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 内的持久 Chrome profile。默认值为 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手动 Slack Web 登录可在同一租约的多次运行中保留。
- `--credential-source convex --credential-role ci` 使用共享凭据池，而不是直接 Slack 环境 token。
- `--provider-mode`、`--model`、`--alt-model` 和 `--fast` 会传递给 Slack 实时通道。

GitHub smoke 工作流是 `Mantis Discord Smoke`。第一个真实场景的 before 和 after GitHub 工作流是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期复现 queued-only 行为的引用。
- `candidate_ref`：预期显示 `queued -> thinking -> done` 的引用。

它会 checkout 工作流 harness 引用，构建独立的 baseline 和 candidate worktree，针对每个 worktree 运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 作为 Actions 产物上传。它还会在 Crabbox 桌面浏览器中渲染每个通道的 timeline HTML，并在 PR 评论中将这些 VNC 截图与确定性的 timeline PNG 一起发布。同一条 PR 评论会嵌入由 `crabbox media preview` 生成的轻量裁剪动作 GIF 预览，链接到匹配的裁剪动作 MP4 片段，并保留完整桌面 MP4 文件以供深入检查。截图保持内联，便于快速审查。该工作流会从 `openclaw/crabbox` main 构建 Crabbox CLI，以便在下一个 Crabbox 二进制版本发布前使用当前桌面/浏览器租约标志。

`Mantis Scenario` 是通用手动入口点。它接收 `scenario_id`、`candidate_ref`、可选 `baseline_ref` 和可选 `pr_number`，然后派发场景拥有的工作流。该 wrapper 有意保持轻量：场景工作流仍然拥有自己的传输设置、凭据、VM 规格、预期 oracle 和产物清单。

`Mantis Slack Desktop Smoke` 是第一个 Slack VM 工作流。它会在单独的 worktree 中检出受信任的候选 ref，租用 Crabbox Linux 桌面，针对该候选版本运行 `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`，在 VNC 浏览器中打开 Slack Web，录制桌面，用 `crabbox media preview` 生成经过运动裁剪的预览，上传完整 artifact 目录，并可选地在目标 PR 上发布内联证据评论。它默认使用 AWS 进行桌面租用，并公开一个手动提供商输入，让操作员在 AWS 容量缓慢或不可用时切换到 Hetzner。当你想要“一个运行着 Slack 和 claw 的 Linux 桌面”，而不是只有 bot 到 bot 的 Slack 文字记录时，请使用这个 lane。

`Mantis Telegram Live` 将现有的 Telegram 实时 QA lane 包装到同一个 PR 证据流水线中。它会在单独的 worktree 中检出受信任的候选 ref，运行 `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`，根据 Telegram QA 摘要和 observed-message artifact 写入 `mantis-evidence.json` 清单，通过 Crabbox 桌面浏览器渲染经过脱敏的文字记录 HTML，用 `crabbox media preview` 生成经过运动裁剪的 GIF，并在有 PR 编号时发布内联 PR 证据评论。这个 lane 是文字记录可视化，而不是已登录 Telegram Web 证明：Telegram Bot API 提供稳定的实时消息证据，但正常的 Mantis 自动化不需要 Telegram Web 登录状态。

对于人工介入的 Telegram 桌面设置，请使用场景构建器：

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

构建器会租用或复用 Crabbox 桌面，安装原生 Linux Telegram Desktop 二进制文件，可选地恢复用户会话归档，用租用的 Telegram SUT bot token 配置 OpenClaw，在端口 `38974` 上启动 `openclaw gateway run`，向租用的私有群组发布 driver-bot 就绪消息，然后从可见的 VNC 桌面捕获截图和 MP4。bot token 永远不会登录 Telegram Desktop；它只用于配置 OpenClaw。桌面查看器是一个单独的 Telegram 用户会话，可从 `--telegram-profile-archive-env <name>` 恢复，也可以通过 VNC 手动创建，并用 `--keep-lease` 保持运行。

有用的 Telegram 桌面构建器标志：

- `--lease-id <cbx_...>` 会在操作员已经登录 Telegram Desktop 的 VM 上重新运行。
- `--telegram-profile-archive-env <name>` 从该环境变量读取 base64 `.tgz` Telegram Desktop 配置文件归档，并在启动前恢复它。
- `--telegram-profile-dir <remote-path>` 控制远程 Telegram Desktop 配置文件目录。默认值是 `$HOME/.local/share/TelegramDesktop`。
- `--no-gateway-setup` 会安装并打开 Telegram Desktop，但不配置 OpenClaw。
- `--credential-source convex --credential-role ci` 使用共享凭据代理，而不是直接使用 Telegram 环境 token。

每个发布到 PR 的场景都会在其报告旁边写入 `mantis-evidence.json`。这个 schema 是场景代码和 GitHub 评论之间的交接格式：

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

Artifact `path` 值相对于清单目录。`targetPath` 值是 `qa-artifacts` 分支发布目录下的相对路径。发布器会拒绝路径遍历，并在可选预览或视频不可用时跳过标记为 `"required": false` 的条目。

支持的 artifact 类型：

- `timeline`：确定性的场景截图，通常是 before/after。
- `desktopScreenshot`：VNC/浏览器桌面截图。
- `motionPreview`：从桌面录制生成的内联动画 GIF。
- `motionClip`：经过运动裁剪的 MP4，移除了静态开头和结尾。
- `fullVideo`：用于深入检查的完整 MP4 录制。
- `metadata`：JSON/日志 sidecar。
- `report`：Markdown 报告。

可复用的发布器是 `scripts/mantis/publish-pr-evidence.mjs`。工作流会用清单、目标 PR、`qa-artifacts` 目标根目录、评论 marker、Actions artifact URL、运行 URL 和请求来源调用它。它会将声明的 artifact 复制到 `qa-artifacts` 分支，构建一个摘要优先的 PR 评论，包含内联图片/预览和链接视频，然后更新现有的 marker 评论或创建一个新评论。

你也可以直接从 PR 评论触发 status-reactions 运行：

```text
@Mantis discord status reactions
```

评论触发器刻意保持狭窄。它只会在具有 write、maintain 或 admin 权限的用户发表的 pull request 评论上运行，并且只识别 Discord status-reaction 请求。默认情况下，它使用已知有问题的 baseline ref，并使用当前 PR head SHA 作为候选版本。维护者可以覆盖任一 ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram 实时 QA 也可以从 PR 评论触发：

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

默认情况下，它使用当前 PR head SHA 作为候选版本，并运行 `telegram-status-command`。当维护者需要特定 ref 或预热的 Crabbox 桌面时，可以覆盖 `candidate=...`、`provider=aws|hetzner` 和 `lease=<cbx_...>`。

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一条命令是明确且聚焦场景的。第二条之后可以根据标签、变更文件和 ClawSweeper 审查发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭据。
2. 分配或复用 VM。
3. 当场景需要 UI 证据时，准备桌面/浏览器配置文件。
4. 为 baseline ref 准备干净的 checkout。
5. 安装依赖，并只构建场景需要的内容。
6. 使用隔离的状态目录启动子 OpenClaw Gateway 网关。
7. 配置实时传输协议、提供商、模型和浏览器配置文件。
8. 运行场景并捕获 baseline 证据。
9. 停止 Gateway 网关并保留日志。
10. 在同一个 VM 中准备候选 ref。
11. 运行同一个场景并捕获候选证据。
12. 对比 oracle 结果和视觉证据。
13. 写入 Markdown、JSON、日志、截图和可选 trace artifact。
14. 上传 GitHub Actions artifact。
15. 发布简洁的 PR 或 Discord 状态消息。

场景应该能够以两种不同方式失败：

- **复现了 bug**：baseline 按预期方式失败。
- **Harness 失败**：环境设置、凭据、Discord API、浏览器或提供商在 bug oracle 变得有意义之前失败。

最终报告必须区分这些情况，以免维护者把不稳定环境误认为产品行为。

## Discord MVP

第一个场景应针对 guild 渠道中的 Discord 状态 reaction，其中源回复投递模式为 `message_tool_only`。

它是良好 Mantis 起点的原因：

- 它在 Discord 中作为触发消息上的 reaction 可见。
- 它通过 Discord 消息 reaction 状态拥有强 REST oracle。
- 它会覆盖真实的 OpenClaw Gateway 网关、Discord bot auth、消息分发、源回复投递模式、状态 reaction 状态以及模型轮次生命周期。
- 它足够狭窄，能让第一个实现保持务实。

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

Baseline 证据应显示排队确认 reaction，但在 tool-only 模式下没有生命周期转换。候选证据应显示当 `messages.statusReactions.enabled` 被显式设为 true 时，生命周期状态 reaction 会运行。

可执行的第一个 slice 是 opt-in Discord 实时 QA 场景：

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
"message_tool"`、`ackReaction: "👀"` 和显式状态 reaction 配置 SUT。oracle 会轮询真实的 Discord 触发消息，并期望观察到序列 `👀 -> 🤔 -> 👍`。Artifact 包括 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应基于现有私有 QA 栈构建，而不是从零开始：

- `pnpm openclaw qa discord` 已经运行带 driver 和 SUT bot 的实时 Discord lane。
- 实时传输协议 runner 已经会在 `.artifacts/qa-e2e/` 下写入报告和 observed-message artifact。
- Convex 凭据租约已经为共享实时传输协议凭据提供独占访问。
- 浏览器控制服务已经支持截图、快照、headless 托管配置文件和远程 CDP 配置文件。
- QA Lab 已经有用于 transport-shaped 测试的调试器 UI 和 bus。

第一个 Mantis 实现可以是在这些组件之上的薄 before/after runner，再加上一层视觉证据。

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

`mantis-summary.json` 应该是机器可读的可信来源。Markdown 报告用于 PR 评论和人工审查。

摘要必须包含：

- 测试过的 refs 和 SHA
- 传输协议和场景 id
- 机器提供商以及机器 id 或租约 id
- 不包含 secret 值的凭据来源
- baseline 结果
- 候选结果
- bug 是否在 baseline 上复现
- 候选版本是否修复了它
- artifact 路径
- 经过清理的设置或清理问题

截图是证据，不是 secret。但它们仍然需要遵守脱敏纪律：可能会出现私有渠道名称、用户名或消息内容。对于公开 PR，在脱敏方案更完善之前，优先使用 GitHub Actions artifact 链接，而不是内联图片。

## 浏览器和 VNC

浏览器 lane 有两种模式：

- **Headless 自动化**：CI 的默认模式。Chrome 启用 CDP 运行，并由 Playwright 或 OpenClaw 浏览器控制捕获截图。
- **VNC 救援**：当登录、MFA、Discord 反自动化或视觉调试需要人工时，在同一 VM 上启用。

Discord 观察者浏览器配置文件应足够持久，以避免每次运行都登录，但要与个人浏览器状态隔离。配置文件属于 Mantis 机器池，而不是开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord 状态消息，包含：

- 运行 ID
- 场景 ID
- 机器提供商
- 工件目录
- 可用时的 VNC 或 noVNC 连接说明
- 简短的阻塞原因文本

第一次私有部署可以将这些消息发布到现有的操作员
频道，之后再迁移到专用的 Mantis 频道。

## 机器

Mantis 的第一个远程实现应优先通过 Crabbox 使用 AWS。
Crabbox 为我们提供预热机器、租约跟踪、水合、日志、结果和
清理。如果 AWS 容量太慢或不可用，则在同一机器接口后面添加
Hetzner 提供商。

最低 VM 要求：

- 已安装支持桌面的 Chrome 或 Chromium 的 Linux
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw 检出和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够的 CPU 和内存，可运行一个 OpenClaw Gateway 网关、一个浏览器和一次模型运行
- 可出站访问 Discord、GitHub、模型提供商和凭证代理

VM 不应在预期的凭证或浏览器配置文件存储之外保留长期存在的原始密钥。

## 密钥

远程运行的密钥存放在 GitHub 组织或仓库密钥中，本地运行的密钥
存放在由本地操作员控制的密钥文件中。

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

长期来看，Convex 凭证池应继续作为实时传输凭证的常规来源。
GitHub 密钥用于引导代理和回退通道。
Discord 状态反应工作流会将 Mantis Crabbox 密钥映射回
Crabbox CLI 所需的 `CRABBOX_COORDINATOR` 和 `CRABBOX_COORDINATOR_TOKEN` 环境变量。
纯 `CRABBOX_*` GitHub 密钥名称仍作为兼容性回退被接受。

Mantis 运行器绝不能打印：

- Discord 机器人令牌
- 提供商 API 密钥
- 浏览器 Cookie
- 认证配置文件内容
- VNC 密码
- 原始凭证载荷

公开工件上传还应编辑 Discord 目标元数据，例如机器人、公会、频道和消息 ID。
GitHub 冒烟工作流因此启用 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果令牌被意外粘贴到 issue、PR、聊天或日志中，请在存储新密钥后轮换它。

## GitHub 工件和 PR 评论

Mantis 工作流应将完整证据包作为短期 Actions 工件上传。
当工作流针对缺陷报告或修复 PR 运行时，它还应将经过编辑的 PNG 截图发布到
`qa-artifacts` 分支，并在该缺陷或修复 PR 上更新插入一条评论，附带内联的前后对比截图。
不要只把主要证明发布到通用的 QA 自动化 PR 上。原始日志、观察到的
消息和其他大体积证据保留在 Actions 工件中。

生产工作流应使用 Mantis GitHub App 发布这些评论，而不是使用
`github-actions[bot]`。将应用 ID 和私钥分别存储为
`MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions
密钥。该工作流使用隐藏标记作为更新插入键，在令牌可编辑时更新该
评论，并在较旧的机器人所有标记无法编辑时创建新的 Mantis 所有评论。

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

当运行因测试框架失败而失败时，评论必须说明这一点，而不是暗示候选修复失败。

## 私有部署说明

私有部署可能已经有一个 Mantis Discord 应用。当该应用具备正确的机器人
权限并且可以安全轮换时，请复用它，而不是再创建一个应用。

通过密钥或部署配置设置初始操作员通知频道。它可以先指向现有的维护者或
运维频道，等专用 Mantis 频道存在后再迁移过去。

不要将公会 ID、频道 ID、机器人令牌、浏览器 Cookie 或 VNC 密码放入本文档。
请将它们存储在 GitHub 密钥、凭证代理或操作员的本地密钥存储中。

## 添加场景

Mantis 场景应声明：

- ID 和标题
- 传输协议
- 所需凭证
- 基线引用策略
- 候选引用策略
- OpenClaw 配置补丁
- 设置步骤
- 刺激
- 预期基线判定器
- 预期候选判定器
- 可视化捕获目标
- 超时预算
- 清理步骤

场景应优先使用小型、类型化的判定器：

- 用于反应缺陷的 Discord 反应状态
- 用于线程缺陷的 Discord 消息引用
- 用于 Slack 缺陷的 Slack 线程 ts 和反应 API 状态
- 用于邮件缺陷的电子邮件消息 ID 和标头
- 当 UI 是唯一可靠可观测对象时使用浏览器截图

视觉检查应作为补充。如果平台 API 能证明缺陷，请使用 API 作为通过/失败
判定器，并保留截图以增强人的信心。

## 提供商扩展

在 Discord 之后，同一运行器可以添加：

- Slack：反应、线程、应用提及、模态框、文件上传。
- 电子邮件：在连接器不足时，使用 `gog` 进行 Gmail 认证和消息线程处理。
- WhatsApp：二维码登录、重新识别、消息投递、媒体、反应。
- Telegram：群组提及门控、命令、可用时的反应。
- Matrix：加密房间、线程或回复关系、重启恢复。

每种传输协议都应有一个低成本冒烟场景，以及一个或多个缺陷类别场景。
昂贵的可视化场景应保持为选择性启用。

## 未决问题

- 复用现有 Mantis 机器人时，哪个 Discord 机器人应作为驱动，哪个应作为 SUT？
- 第一阶段中，观察者浏览器登录应使用真人 Discord 账号、测试账号，还是只使用机器人可读取的 REST 证据？
- GitHub 应为 PR 保留 Mantis 工件多长时间？
- ClawSweeper 应在什么时候自动推荐 Mantis，而不是等待维护者命令？
- 对于公开 PR，截图上传前是否应编辑或裁剪？
