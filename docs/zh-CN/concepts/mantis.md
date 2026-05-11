---
read_when:
    - 为 OpenClaw 缺陷构建或运行实时可视化 QA
    - 为拉取请求添加变更前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是用于在实时传输协议上复现 OpenClaw 缺陷、捕获修复前后证据，并将工件附加到拉取请求的可视化端到端验证系统。
title: Mantis
x-i18n:
    generated_at: "2026-05-11T20:26:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 465ed7c994e8821fc64ca46a58de46cbec8b4ba687862b00398f7b0d22d62b44
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 的端到端验证系统，用于需要真实运行时、真实传输协议和可见证据的 bug。它会针对已知有问题的 ref 运行一个场景，捕获证据，再针对候选 ref 运行同一场景，并将对比结果发布为构件，维护者可以从 PR 或本地命令中检查。

Mantis 从 Discord 开始，因为 Discord 提供了一个高价值的首条验证通道：真实 bot 凭证、真实 guild 频道、reaction、thread、原生命令，以及一个浏览器 UI，方便人工直观确认传输协议展示了什么。

## 目标

- 使用用户看到的相同传输协议形态，从 GitHub issue 或 PR 复现 bug。
- 在应用修复前，在基线 ref 上捕获一个 **before** 构件。
- 在应用修复后，在候选 ref 上捕获一个 **after** 构件。
- 尽可能使用确定性的 oracle，例如 Discord REST reaction 读取或频道 transcript 检查。
- 当 bug 有可见 UI 表面时捕获截图。
- 从 Agent 控制的 CLI 本地运行，并从 GitHub 远程运行。
- 当登录、浏览器自动化或提供商凭证卡住时，保留足够的机器状态以便 VNC 救援。
- 当运行被阻塞、需要人工 VNC 帮助或完成时，向操作员 Discord 频道发布简洁状态。

## 非目标

- Mantis 不是单元测试的替代品。理解修复后，Mantis 运行通常应转化为更小的回归测试。
- Mantis 不是常规的快速 CI gate。它更慢，使用实时凭证，并且保留给实时环境重要的 bug。
- Mantis 的正常运行不应需要人工参与。手动 VNC 是救援路径，不是理想路径。
- Mantis 不会在构件、日志、截图、Markdown 报告或 PR 评论中存储原始密钥。

## 所有权

Mantis 位于 OpenClaw QA 栈中。

- OpenClaw 拥有 `pnpm openclaw qa mantis` 下的场景运行时、传输协议适配器、证据 schema 和本地 CLI。
- QA Lab 拥有实时传输协议 harness 组件、浏览器捕获 helper 和构件 writer。
- 需要远程 VM 时，Crabbox 拥有预热的 Linux 机器。
- GitHub Actions 拥有远程 workflow 入口点和构件保留。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、分派 workflow，并发布最终 PR 评论。
- 当场景需要 agentic 设置、调试或卡住状态报告时，OpenClaw Agent 通过 Codex 驱动 Mantis。

这个边界将传输协议知识保留在 OpenClaw 中，将机器调度保留在 Crabbox 中，并将维护者工作流 glue 保留在 ClawSweeper 中。

## 命令形态

第一个本地命令会验证 Discord bot、guild、频道、消息发送、reaction 发送和构件路径：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本地 before 和 after runner 接受这种形态：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner 会在输出目录下创建 detached baseline 和 candidate worktree，安装依赖，构建每个 ref，使用 `--allow-failures` 运行场景，然后写入 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md`。对于第一个 Discord 场景，成功验证意味着 baseline 状态是 `fail`，candidate 状态是 `pass`。

第二个 Discord before/after 探针面向 thread 附件：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

该场景使用 driver bot 发布一条父消息，创建一个真实的 Discord thread，使用 repo-local `filePath` 调用 OpenClaw 的 `message.thread-reply` action，然后轮询该 thread，查找 SUT 回复和附件文件名。baseline 截图显示回复没有附件；candidate 截图显示预期的 `mantis-thread-report.md` 附件。

第一个 VM/浏览器 primitive 是 desktop smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它会租用或复用 Crabbox 桌面机器，在 VNC 会话中启动可见浏览器，捕获桌面，将构件拉回本地输出目录，并把重连命令写入报告。该命令默认使用 Hetzner 提供商，因为它是 Mantis 通道中第一个具有可用桌面/VNC 覆盖的提供商。针对另一个 Crabbox fleet 运行时，可用 `--provider`、`--crabbox-bin` 或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆盖。

有用的 desktop smoke flag：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 会复用预热的桌面。
- `--browser-url <url>` 会更改可见浏览器中打开的页面。
- `--html-file <path>` 会在可见浏览器中渲染 repo-local HTML 构件。Mantis 用它通过真实 Crabbox 桌面捕获生成的 Discord 状态 reaction 时间线。
- `--browser-profile-dir <remote-path>` 会复用远程 Chrome user-data-dir，让持久化的 Mantis 桌面在多次运行之间保持登录状态。将其用于长期存在的 Discord Web viewer profile。
- `--browser-profile-archive-env <name>` 会在启动浏览器前，从命名环境变量还原 base64 `.tgz` Chrome user-data-dir archive。将其用于已登录的见证者，例如 Discord Web。默认环境变量是 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`。
- `--video-duration <seconds>` 控制 MP4 捕获时长。对于需要时间稳定下来的慢速已登录 Web 应用，使用更长时长。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 会让新创建且通过的 lease 保持打开，以便 VNC 检查。失败运行在创建了 lease 时默认保留它，以便操作员可以重新连接。
- `--class`、`--idle-timeout` 和 `--ttl` 调整机器大小和 lease 生命周期。

对于 Discord Web 证据，Mantis 使用专用 viewer 账号，而不是 bot token。实时 Discord API 场景仍是 oracle：它会创建真实 thread，发送 SUT `thread-reply`，并通过 Discord REST 检查附件。设置 `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` 时，该场景还会写入 Discord Web URL 构件。设置 `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` 时，它会让该 thread 保持可用足够长时间，以便已登录浏览器打开并录制它。

GitHub workflow 会在 Discord Web 中打开候选 thread URL，捕获截图，录制 MP4，并在 Crabbox 媒体工具可用时生成裁剪过的 GIF 预览。优先使用通过 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 配置的持久化 viewer profile 路径，因为完整 Chrome profile archive 可能超过 GitHub 的密钥大小限制。对于小型/引导 profile，workflow 也可以从 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 还原 base64 `.tgz` archive。如果两个 profile 来源都未配置，workflow 仍会发布确定性的 baseline/candidate 附件截图，并记录一条 notice，说明已跳过已登录 Discord Web 见证者。

第一个完整桌面传输协议 primitive 是 Slack desktop smoke：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它会租用或复用 Crabbox 桌面机器，将当前 checkout 同步进 VM，在该 VM 中运行 `pnpm openclaw qa slack`，在 VNC 浏览器中打开 Slack Web，捕获可见桌面，并将 Slack QA 构件和 VNC 截图都复制回本地输出目录。这是第一个 SUT OpenClaw Gateway 网关和浏览器都位于同一台 Linux 桌面 VM 中的 Mantis 形态。

使用 `--gateway-setup` 时，该命令会在 `$HOME/.openclaw-mantis/slack-openclaw` 准备一个持久化的一次性 OpenClaw home，为所选频道 patch Slack Socket Mode 配置，在端口 `38973` 启动 `openclaw gateway run`，并让 Chrome 在 VNC 会话中保持运行。这是“给我留一台运行着 Slack 和 claw 的 Linux 桌面”模式；省略 `--gateway-setup` 时，bot-to-bot Slack QA 通道仍是默认模式。

`--credential-source env` 的必需输入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 远程模型通道需要 `OPENCLAW_LIVE_OPENAI_KEY`。如果本地只设置了
  `OPENAI_API_KEY`，Mantis 会在调用 Crabbox 前将其映射为 `OPENCLAW_LIVE_OPENAI_KEY`，以便 Crabbox 的 `OPENCLAW_*` 环境转发可以将它带入 VM。

使用 `--gateway-setup --credential-source convex` 时，Mantis 会在创建 VM 前从共享池租用 Slack SUT 凭证，并在桌面内将租用到的频道 id、Socket Mode app token 和 bot token 作为 `OPENCLAW_MANTIS_SLACK_*` 运行时环境转发。这样可以让 GitHub workflow 保持轻量：它们只需要 Convex broker 密钥，不需要原始 Slack bot 或 app token。

有用的 Slack desktop flag：

- `--lease-id <cbx_...>` 会在操作员已通过 VNC 登录 Slack Web 的机器上重新运行。
- `--gateway-setup` 会在 VM 中启动持久化 OpenClaw Slack Gateway 网关，而不是只运行 bot-to-bot QA 通道。
- `--keep-lease` 会在成功后保持 Gateway 网关 VM 打开以便 VNC 检查；`--no-keep-lease` 会在收集构件后停止它。
- `--slack-url <url>` 会打开特定 Slack Web URL。没有该选项时，如果 SUT bot token 可用，Mantis 会从 Slack `auth.test` 推导 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 控制 Gateway 网关设置使用的 Slack 频道 allowlist。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 内部的持久化 Chrome profile。默认值是 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手动 Slack Web 登录可以在同一 lease 上的多次运行之间保留。
- `--credential-source convex --credential-role ci` 使用共享凭证池，而不是直接 Slack 环境 token。
- `--provider-mode`、`--model`、`--alt-model` 和 `--fast` 会传递给 Slack live 通道。

GitHub smoke workflow 是 `Mantis Discord Smoke`。第一个真实场景的 before 和 after GitHub workflow 是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期会复现 queued-only 行为的 ref。
- `candidate_ref`：预期会显示 `queued -> thinking -> done` 的 ref。

它会 checkout workflow harness ref，构建独立的 baseline 和 candidate worktree，对每个 worktree 运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 作为 Actions 构件上传。它还会在 Crabbox 桌面浏览器中渲染每个通道的时间线 HTML，并在 PR 评论中将这些 VNC 截图与确定性的时间线 PNG 一起发布。同一个 PR 评论会嵌入由 `crabbox media preview` 生成的轻量运动裁剪 GIF 预览，链接到匹配的运动裁剪 MP4 clip，并保留完整桌面 MP4 文件用于深入检查。截图保持内联，方便快速审查。workflow 会从 `openclaw/crabbox` main 构建 Crabbox CLI，以便在下一个 Crabbox binary release 切出前使用当前桌面/浏览器 lease flag。

`Mantis Scenario` 是通用手动入口点。它接收 `scenario_id`、`candidate_ref`、可选的 `baseline_ref` 和可选的 `pr_number`，然后分派场景拥有的 workflow。该 wrapper 有意保持轻量：场景 workflow 仍拥有自己的传输协议设置、凭证、VM class、预期 oracle 和构件 manifest。

`Mantis Slack Desktop Smoke` 是第一个 Slack VM 工作流。它会在单独的 worktree 中检出受信任的候选 ref，租用一个 Crabbox Linux 桌面，对该候选运行 `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`，在 VNC 浏览器中打开 Slack Web，录制桌面，用 `crabbox media preview` 生成运动裁剪预览，上传完整 artifact 目录，并可选择在目标 PR 上发布内联证据评论。它默认使用 AWS 租用桌面，并提供手动提供商输入，便于操作员在 AWS 容量缓慢或不可用时切换到 Hetzner。当你想要的是“带有 Slack 且有一个 claw 正在运行的 Linux 桌面”，而不仅仅是 bot 到 bot 的 Slack transcript 时，请使用此 lane。

`Mantis Telegram Live` 将现有 Telegram 实时 QA lane 包装进同一个 PR 证据流水线。它会在单独的 worktree 中检出受信任的候选 ref，运行 `pnpm openclaw qa telegram --credential-source convex --credential-role ci`，根据 Telegram QA 摘要和 observed-message artifact 写入 `mantis-evidence.json` 清单，通过 Crabbox 桌面浏览器渲染已脱敏的 transcript HTML，用 `crabbox media preview` 生成运动裁剪 GIF，并在有 PR 编号时发布内联 PR 证据评论。这个 lane 是 transcript 可视化，而不是已登录 Telegram Web 证明：Telegram Bot API 提供稳定的实时消息证据，但正常 Mantis 自动化不需要 Telegram Web 登录状态。

`Mantis Telegram Desktop Proof` 是智能体式原生 Telegram Desktop 前后对比包装器。维护者可以通过 PR 评论中的 `@Mantis telegram desktop proof`、通过 Actions UI 中的自由格式说明，或通过通用 `Mantis Scenario` 调度器触发它。该工作流会把 PR、基线 ref、候选 ref 和维护者说明交给 Codex。智能体会读取 PR，判断什么 Telegram 可见行为可以证明变更，针对基线和候选运行真实用户 Crabbox Telegram Desktop 证明 lane，反复迭代直到原生 GIF 有用，将成对的 `motionPreview` artifact 写入 `mantis-evidence.json`，上传 bundle，并在有 PR 编号时发布 2 列 PR 证据表。

对于需要人工参与的 Telegram 桌面设置，请使用场景构建器：

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

构建器会租用或复用一个 Crabbox 桌面，安装原生 Linux Telegram Desktop 二进制文件，可选择恢复用户会话归档，使用租用的 Telegram SUT bot token 配置 OpenClaw，在端口 `38974` 上启动 `openclaw gateway run`，向租用的私有群组发布 driver-bot 就绪消息，然后从可见的 VNC 桌面捕获截图和 MP4。bot token 永远不会登录 Telegram Desktop；它只用于配置 OpenClaw。桌面查看器是一个单独的 Telegram 用户会话，可从 `--telegram-profile-archive-env <name>` 恢复，或通过 VNC 手动创建，并用 `--keep-lease` 保持存活。

有用的 Telegram 桌面构建器标志：

- `--lease-id <cbx_...>` 在操作员已登录 Telegram Desktop 的 VM 上重新运行。
- `--telegram-profile-archive-env <name>` 从该环境变量读取 base64 `.tgz` Telegram Desktop profile 归档，并在启动前恢复它。
- `--telegram-profile-dir <remote-path>` 控制远程 Telegram Desktop profile 目录。默认值是 `$HOME/.local/share/TelegramDesktop`。
- `--no-gateway-setup` 安装并打开 Telegram Desktop，但不配置 OpenClaw。
- `--credential-source convex --credential-role ci` 使用共享凭证 broker，而不是直接使用 Telegram 环境 token。

每个发布到 PR 的场景都会在其报告旁写入 `mantis-evidence.json`。这个 schema 是场景代码和 GitHub 评论之间的交接格式：

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

- `timeline`：确定性的场景截图，通常是前后对比。
- `desktopScreenshot`：VNC/browser 桌面截图。
- `motionPreview`：从桌面录制生成的内联动画 GIF。
- `motionClip`：移除静态开头和结尾的运动裁剪 MP4。
- `fullVideo`：用于深入检查的完整 MP4 录制。
- `metadata`：JSON/log sidecar。
- `report`：Markdown 报告。

可复用发布器是 `scripts/mantis/publish-pr-evidence.mjs`。工作流会用清单、目标 PR、`qa-artifacts` 目标根目录、评论标记、Actions artifact URL、运行 URL 和请求来源调用它。它会把声明的 artifact 复制到 `qa-artifacts` 分支，构建一个摘要优先的 PR 评论，其中包含内联图片/预览和链接视频，然后更新现有标记评论或创建一个新评论。

你也可以直接从 PR 评论触发 status-reactions 运行：

```text
@Mantis discord status reactions
```

评论触发器有意保持狭窄。它只会对拥有 write、maintain 或 admin 权限的用户在 pull request 上的评论运行，并且只识别 Discord status-reaction 请求。默认情况下，它使用已知的不良基线 ref，并使用当前 PR head SHA 作为候选。维护者可以覆盖任一 ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram 实时 QA 也可以从 PR 评论触发：

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

默认情况下，它使用当前 PR head SHA 作为候选，并运行 `telegram-status-command`。当维护者需要特定 ref 或预热好的 Crabbox 桌面时，可以覆盖 `candidate=...`、`provider=aws|hetzner` 和 `lease=<cbx_...>`。

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一条命令是显式且聚焦场景的。第二条命令之后可以根据标签、变更文件和 ClawSweeper 审查发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭证。
2. 分配或复用 VM。
3. 当场景需要 UI 证据时，准备桌面/浏览器 profile。
4. 为基线 ref 准备干净 checkout。
5. 安装依赖，并只构建场景需要的内容。
6. 使用隔离的状态目录启动子 OpenClaw Gateway 网关。
7. 配置实时传输、提供商、模型和浏览器 profile。
8. 运行场景并捕获基线证据。
9. 停止 Gateway 网关并保留日志。
10. 在同一 VM 中准备候选 ref。
11. 运行同一场景并捕获候选证据。
12. 比较 oracle 结果和视觉证据。
13. 写入 Markdown、JSON、日志、截图和可选 trace artifact。
14. 上传 GitHub Actions artifact。
15. 发布简洁的 PR 或 Discord status 消息。

场景应该能够以两种不同方式失败：

- **Bug reproduced**：基线以预期方式失败。
- **Harness failure**：在 bug oracle 有意义之前，环境设置、凭证、Discord API、浏览器或提供商失败。

最终报告必须区分这些情况，避免维护者把不稳定环境误认为产品行为。

## Discord MVP

第一个场景应该针对 guild 频道中的 Discord status reactions，其中 source reply delivery mode 为 `message_tool_only`。

为什么它是一个好的 Mantis 种子：

- 它在 Discord 中以触发消息上的 reaction 形式可见。
- 它通过 Discord 消息 reaction 状态提供强 REST oracle。
- 它会运行真实的 OpenClaw Gateway 网关、Discord bot auth、消息分发、source reply delivery mode、status reaction state 和模型轮次生命周期。
- 它足够窄，能让第一版实现保持诚实。

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

基线证据应显示 queued acknowledgement reaction，但在 tool-only 模式下没有生命周期转换。候选证据应显示当 `messages.statusReactions.enabled` 显式为 true 时，生命周期 status reactions 会运行。

可执行的第一个切片是可选启用的 Discord 实时 QA 场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

它会使用始终开启的 guild handling、`visibleReplies: "message_tool"`、`ackReaction: "👀"` 和显式 status reactions 配置 SUT。oracle 会轮询真实的 Discord 触发消息，并期望观测到序列 `👀 -> 🤔 -> 👍`。Artifact 包括 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应该基于现有私有 QA 栈构建，而不是从零开始：

- `pnpm openclaw qa discord` 已经使用 driver 和 SUT bots 运行实时 Discord lane。
- 实时传输 runner 已经会在 `.artifacts/qa-e2e/` 下写入报告和 observed-message artifact。
- Convex credential leases 已经为共享实时传输凭证提供独占访问。
- 浏览器控制服务已经支持截图、快照、headless managed profiles 和远程 CDP profiles。
- QA Lab 已经有用于 transport-shaped testing 的 debugger UI 和 bus。

第一个 Mantis 实现可以是这些组件之上的薄前后对比 runner，再加上一层视觉证据。

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

`mantis-summary.json` 应该是机器可读的事实来源。Markdown 报告用于 PR 评论和人工审查。

摘要必须包含：

- 测试过的 refs 和 SHAs
- 传输和场景 id
- 机器提供商和机器 id 或 lease id
- 不包含秘密值的凭证来源
- 基线结果
- 候选结果
- bug 是否在基线上复现
- 候选是否修复了它
- artifact 路径
- 已清理的设置或清理问题

截图是证据，不是机密。它们仍然需要遵守脱敏纪律：
可能会出现私有渠道名称、用户名或消息内容。对于公开 PR，
在脱敏方案更完善之前，优先使用 GitHub Actions artifact 链接，而不是内联图片。

## 浏览器和 VNC

浏览器运行通道有两种模式：

- **无头自动化**：CI 的默认模式。Chrome 在启用 CDP 的情况下运行，并且
  Playwright 或 OpenClaw 浏览器控制会捕获截图。
- **VNC 救援**：当登录、MFA、Discord 反自动化，
  或可视化调试需要人工介入时，在同一台 VM 上启用。

Discord 观察者浏览器配置文件应足够持久，以避免
每次运行都登录，但要与个人浏览器状态隔离。配置文件
属于 Mantis 机器池，而不是开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord Status 消息，其中包含：

- 运行 id
- 场景 id
- 机器提供商
- artifact 目录
- VNC 或 noVNC 连接说明（如果可用）
- 简短的阻塞原因文本

第一次私有部署可以先将这些消息发布到现有操作员
渠道，稍后再迁移到专用 Mantis 渠道。

## 机器

Mantis 的第一个远程实现应优先通过 Crabbox 使用 AWS。
Crabbox 为我们提供预热机器、租约跟踪、水合、日志、结果和
清理。如果 AWS 容量太慢或不可用，请在相同机器接口
后面添加 Hetzner 提供商。

最低 VM 要求：

- Linux，安装支持桌面的 Chrome 或 Chromium
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够的 CPU 和内存，可运行一个 Gateway 网关、一个浏览器和一次模型运行
- 可出站访问 Discord、GitHub、模型提供商和凭证 broker

VM 不应在预期凭证或浏览器配置文件存储之外保留长期存在的原始机密。

## 机密

远程运行的机密存放在 GitHub 组织或仓库机密中，本地运行的机密
存放在由本地操作员控制的机密文件中。

推荐的机密名称：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`，用于公开 GitHub artifact 上传
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

长期来看，Convex 凭证池应保持为实时传输协议凭证的常规来源。
GitHub 机密用于引导 broker 和 fallback 运行通道。
Discord Status 反应工作流会将 Mantis Crabbox 机密映射回
Crabbox CLI 预期的 `CRABBOX_COORDINATOR` 和 `CRABBOX_COORDINATOR_TOKEN` 环境变量。
普通的 `CRABBOX_*` GitHub 机密名称仍作为兼容 fallback 被接受。

Mantis runner 绝不能打印：

- Discord bot 令牌
- 提供商 API key
- 浏览器 cookie
- auth profile 内容
- VNC 密码
- 原始凭证 payload

公开 artifact 上传还应脱敏 Discord 目标元数据，例如 bot、
guild、渠道和消息 id。因此 GitHub smoke 工作流启用
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果令牌被意外粘贴到 issue、PR、聊天或日志中，请在新的机密存储完成后
轮换它。

## GitHub artifact 和 PR 评论

Mantis 工作流应将完整证据包作为短期 Actions
artifact 上传。当工作流针对 bug 报告或修复 PR 运行时，它还应
将已脱敏的 PNG 截图发布到 `qa-artifacts` 分支，并在该 bug 或修复 PR 上
upsert 一条带有内联前后对比截图的评论。不要只在通用 QA 自动化 PR 上发布
主要证明。原始日志、观察到的消息和其他大型证据保留在 Actions artifact 中。

生产工作流应使用 Mantis GitHub App 发布这些评论，而不是
使用 `github-actions[bot]`。将 app id 和私钥存储为
`MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions
机密。工作流使用隐藏 marker 作为 upsert 键，在令牌可以编辑时更新该
评论，并在旧的 bot 拥有的 marker 无法编辑时创建一条新的 Mantis 拥有的评论。

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

当运行失败是因为 harness 失败时，评论必须说明这一点，
而不是暗示候选修复失败。

## 私有部署说明

私有部署可能已经有一个 Mantis Discord 应用。当该应用具备正确的 bot
权限并且可以安全轮换时，请复用该应用，而不是创建另一个 app。

通过机密或部署配置设置初始操作员通知渠道。它可以先指向现有维护者或运维
渠道，等专用 Mantis 渠道存在后再迁移过去。

不要将 guild id、渠道 id、bot 令牌、浏览器 cookie 或 VNC 密码
放入本文档。将它们存储在 GitHub 机密、凭证 broker 或
操作员的本地机密存储中。

## 添加场景

Mantis 场景应声明：

- id 和标题
- 传输协议
- 所需凭证
- baseline ref 策略
- candidate ref 策略
- OpenClaw 配置 patch
- 设置步骤
- 刺激输入
- 预期 baseline oracle
- 预期 candidate oracle
- 可视化捕获目标
- 超时预算
- 清理步骤

场景应优先使用小型、有类型的 oracle：

- 用于反应 bug 的 Discord 反应状态
- 用于 threading bug 的 Discord 消息引用
- 用于 Slack bug 的 Slack thread ts 和反应 API 状态
- 用于 email bug 的 email 消息 id 和 header
- 当 UI 是唯一可靠可观察项时使用浏览器截图

视觉检查应作为补充。如果平台 API 可以证明 bug，
请使用 API 作为通过/失败 oracle，并保留截图用于提升人工信心。

## 提供商扩展

在 Discord 之后，同一 runner 可以添加：

- Slack：反应、thread、app mention、modal、文件上传。
- Email：在 connector 不够用时，使用 `gog` 进行 Gmail auth 和消息 threading。
- WhatsApp：二维码登录、重新识别、消息送达、媒体、反应。
- Telegram：群组 mention gating、命令、反应（可用时）。
- Matrix：加密房间、thread 或 reply 关系、重启恢复。

每种传输协议都应有一个低成本 smoke 场景和一个或多个 bug 类场景。
昂贵的可视化场景应保持为 opt-in。

## 未决问题

- 复用现有 Mantis bot 时，哪个 Discord bot 应作为 driver，哪个应作为 SUT？
- 第一阶段中，观察者浏览器登录应使用人类 Discord 账号、测试账号，
  还是只使用 bot 可读取的 REST 证据？
- GitHub 应为 PR 保留 Mantis artifact 多久？
- ClawSweeper 何时应自动推荐 Mantis，而不是等待
  维护者命令？
- 对于公开 PR，截图上传前是否应脱敏或裁剪？
