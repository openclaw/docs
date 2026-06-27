---
read_when:
    - 为 OpenClaw bug 构建或运行实时视觉 QA
    - 为拉取请求添加变更前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是一个视觉端到端验证系统，用于在实时传输协议上复现 OpenClaw bug，捕获前后证据，并将构件附加到 PR。
title: Mantis
x-i18n:
    generated_at: "2026-06-27T01:48:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9de83fac9bfa64b4828dab96fcbf5fac33466c7ede9406472801dc7322bf3ae
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 的端到端验证系统，适用于需要真实运行时、真实传输协议和可见证明的 bug。它会针对已知有问题的 ref 运行场景、捕获证据，再针对候选 ref 运行相同场景，并将对比结果发布为构件，维护者可以从 PR 或本地命令中检查这些构件。

Mantis 从 Discord 开始，因为 Discord 为我们提供了高价值的第一条通道：真实机器人凭证、真实 guild 频道、reaction、thread、原生命令，以及一个浏览器 UI，让人类可以直观确认传输协议显示了什么。

## 目标

- 使用用户看到的相同传输形态，从 GitHub issue 或 PR 复现 bug。
- 在应用修复前，在基线 ref 上捕获一个**之前**构件。
- 在应用修复后，在候选 ref 上捕获一个**之后**构件。
- 尽可能使用确定性判定器，例如 Discord REST reaction 读取或频道转录检查。
- 当 bug 有可见 UI 表面时捕获截图。
- 从智能体控制的 CLI 本地运行，并从 GitHub 远程运行。
- 当登录、浏览器自动化或提供商凭证卡住时，保留足够的机器状态以便 VNC 救援。
- 当运行被阻塞、需要手动 VNC 帮助或完成时，向操作员 Discord 频道发布简洁状态。

## 非目标

- Mantis 不是单元测试的替代品。理解修复后，Mantis 运行通常应变成一个更小的回归测试。
- Mantis 不是常规快速 CI 门禁。它更慢、使用实时凭证，并且只保留给实时环境很重要的 bug。
- Mantis 的正常运行不应要求人工介入。手动 VNC 是救援路径，不是理想路径。
- Mantis 不会在构件、日志、截图、Markdown 报告或 PR 评论中存储原始 secret。

## 所有权

Mantis 位于 OpenClaw QA 栈中。

- OpenClaw 拥有 `pnpm openclaw qa mantis` 下的场景运行时、传输协议适配器、证据 schema 和本地 CLI。
- QA Lab 拥有实时传输协议 harness 组件、浏览器捕获助手和构件写入器。
- 当需要远程 VM 时，Crabbox 拥有预热的 Linux 机器。
- GitHub Actions 拥有远程 workflow 入口点和构件保留。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、分派 workflow，并发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体通过 Codex 驱动 Mantis。

这个边界将传输协议知识保留在 OpenClaw 中，将机器调度保留在 Crabbox 中，并将维护者 workflow 胶水保留在 ClawSweeper 中。

## 命令形态

第一个本地命令会验证 Discord 机器人、guild、频道、消息发送、reaction 发送和构件路径：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本地的之前和之后运行器接受这种形态：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

运行器会在输出目录下创建分离的基线和候选 worktree，安装依赖，构建每个 ref，使用 `--allow-failures` 运行场景，然后写入 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md`。对于第一个 Discord 场景，成功验证意味着基线状态为 `fail`，候选状态为 `pass`。

第二个 Discord 之前/之后探针面向 thread 附件：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

该场景会用 driver bot 发布父消息，创建真实 Discord thread，使用仓库本地 `filePath` 调用 OpenClaw 的 `message.thread-reply` action，然后轮询 thread 以获取 SUT 回复和附件文件名。基线截图显示回复没有附件；候选截图显示预期的 `mantis-thread-report.md` 附件。

第一个 VM/browser 原语是桌面 smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它会租用或复用 Crabbox 桌面机器，在 VNC 会话中启动可见浏览器，捕获桌面，将构件拉回本地输出目录，并把重连命令写入报告。该命令默认使用 Hetzner 提供商，因为它是 Mantis 通道中第一个具备可用桌面/VNC 覆盖的提供商。针对另一个 Crabbox 机群运行时，可以用 `--provider`、`--crabbox-bin` 或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆盖。

有用的桌面 smoke 标志：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 会复用预热的桌面。
- `--browser-url <url>` 会更改可见浏览器中打开的页面。
- `--html-file <path>` 会在可见浏览器中渲染仓库本地 HTML 构件。Mantis 使用它通过真实 Crabbox 桌面捕获生成的 Discord 状态 reaction 时间线。
- `--browser-profile-dir <remote-path>` 会复用远程 Chrome user-data-dir，使持久 Mantis 桌面可以在运行之间保持登录。将它用于长期存在的 Discord Web 查看器 profile。
- `--browser-profile-archive-env <name>` 会在启动浏览器前，从指定环境变量恢复 base64 `.tgz` Chrome user-data-dir 归档。将它用于 Discord Web 等已登录见证者。默认环境变量是 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`。
- `--video-duration <seconds>` 控制 MP4 捕获时长。对于需要时间稳定下来的较慢已登录 Web 应用，使用更长时长。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 会让新创建且通过的租约保持打开，以便 VNC 检查。失败运行在创建了租约时默认保留租约，以便操作员可以重连。
- `--class`、`--idle-timeout` 和 `--ttl` 调整机器大小和租约生命周期。

对于 Discord Web 证据，Mantis 使用专用查看器账号，而不是机器人 token。实时 Discord API 场景仍然是判定器：它会创建真实 thread，发送 SUT `thread-reply`，并通过 Discord REST 检查附件。设置 `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` 时，场景还会写入 Discord Web URL 构件。设置 `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` 时，它会让该 thread 保持可用足够长的时间，以便已登录浏览器打开并记录它。

GitHub workflow 会在 Discord Web 中打开候选 thread URL，捕获截图，录制 MP4，并在 Crabbox 媒体工具可用时生成裁剪后的 GIF 预览。优先使用通过 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 配置的持久查看器 profile 路径，因为完整 Chrome profile 归档可能超过 GitHub 的 secret 大小限制。对于小型/bootstrap profile，workflow 也可以从 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 恢复 base64 `.tgz` 归档。如果两个 profile 来源都未配置，workflow 仍会发布确定性的基线/候选附件截图，并记录通知说明已跳过已登录的 Discord Web 见证者。

第一个完整桌面传输协议原语是 Slack 桌面 smoke：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它会租用或复用 Crabbox 桌面机器，将当前 checkout 同步到 VM，在该 VM 内运行 `pnpm openclaw qa slack`，在 VNC 浏览器中打开 Slack Web，捕获可见桌面，并将 Slack QA 构件和 VNC 截图复制回本地输出目录。这是第一个 SUT OpenClaw Gateway 网关和浏览器都位于同一台 Linux 桌面 VM 内的 Mantis 形态。

使用 `--gateway-setup` 时，该命令会在 `$HOME/.openclaw-mantis/slack-openclaw` 准备一个持久的一次性 OpenClaw home，针对所选频道修补 Slack Socket Mode 配置，在端口 `38973` 上启动 `openclaw gateway run`，并让 Chrome 在 VNC 会话中持续运行。这是“给我留一个带 Slack 和一个正在运行的 claw 的 Linux 桌面”模式；省略 `--gateway-setup` 时，默认仍是机器人到机器人的 Slack QA 通道。

`--credential-source env` 所需输入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 远程模型通道需要 `OPENCLAW_LIVE_OPENAI_KEY`。如果本地只设置了
  `OPENAI_API_KEY`，Mantis 会在调用 Crabbox 前将其映射为 `OPENCLAW_LIVE_OPENAI_KEY`，
  这样 Crabbox 的 `OPENCLAW_*` 环境转发可以把它带入 VM。

使用 `--gateway-setup --credential-source convex` 时，Mantis 会先从共享池租用 Slack SUT 凭证，再创建 VM，并将租用的频道 id、Socket Mode app token 和 bot token 作为桌面内的 `OPENCLAW_MANTIS_SLACK_*` 运行时环境变量转发。这让 GitHub workflow 保持轻量：它们只需要 Convex broker secret，而不需要原始 Slack bot 或 app token。

有用的 Slack 桌面标志：

- `--lease-id <cbx_...>` 会针对操作员已通过 VNC 登录 Slack Web 的机器重新运行。
- `--gateway-setup` 会在 VM 中启动持久 OpenClaw Slack Gateway 网关，而不是只运行机器人到机器人的 QA 通道。
- `--keep-lease` 会在成功后保持 Gateway 网关 VM 打开以便 VNC 检查；`--no-keep-lease` 会在收集构件后停止它。
- `--slack-url <url>` 会打开指定 Slack Web URL。没有它时，如果 SUT bot token 可用，Mantis 会从 Slack `auth.test` 派生 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 控制 Gateway 网关设置使用的 Slack 频道 allowlist。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 内的持久 Chrome profile。默认值是 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手动 Slack Web 登录可以在同一租约上的重复运行中保留。
- `--credential-source convex --credential-role ci` 使用共享凭证池，而不是直接 Slack 环境 token。
- `--provider-mode`、`--model`、`--alt-model` 和 `--fast` 会透传到 Slack 实时通道。

审批 checkpoint 运行会将 Slack API 消息快照渲染为 checkpoint PNG，用作 CI 安全的视觉证明。只有当租约使用已经登录的预热浏览器 profile 时，`slack-desktop-smoke.png` 才是 Slack Web 的证明。

GitHub smoke workflow 是 `Mantis Discord Smoke`。第一个真实场景的之前和之后 GitHub workflow 是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期复现仅 queued 行为的 ref。
- `candidate_ref`：预期显示 `queued -> thinking -> done` 的 ref。

它会 checkout workflow harness ref，构建单独的基线和候选 worktree，分别针对每个 worktree 运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 作为 Actions 构件上传。它还会在 Crabbox 桌面浏览器中渲染每条通道的时间线 HTML，并在 PR 评论中将这些 VNC 截图与确定性时间线 PNG 一起发布。同一条 PR 评论会嵌入由 `crabbox media preview` 生成的轻量级运动裁剪 GIF 预览，链接到匹配的运动裁剪 MP4 片段，并保留完整桌面 MP4 文件以便深入检查。截图保持内联，便于快速审查。该 workflow 从 `openclaw/crabbox` main 构建 Crabbox CLI，以便在下一个 Crabbox 二进制发布之前使用当前桌面/浏览器租约标志。

`Mantis Scenario` 是通用的手动入口点。它接收 `scenario_id`、`candidate_ref`、可选的 `baseline_ref` 和可选的 `pr_number`，然后分发到场景自有的工作流。这个包装器刻意保持轻量：场景工作流仍然拥有自己的传输设置、凭证、VM 类型、预期 oracle 和工件清单。

`Mantis Slack Desktop Smoke` 是第一个 Slack VM 工作流。它会在单独的 worktree 中检出受信任的候选 ref，租用一个 Crabbox Linux 桌面，针对该候选运行 `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`，在 VNC 浏览器中打开 Slack Web，录制桌面，用 `crabbox media preview` 生成运动裁剪预览，上传完整工件目录，并可选地在目标 PR 上发布内联证据评论。它默认使用 AWS 租用桌面，并暴露一个手动提供商输入，以便操作员在 AWS 容量缓慢或不可用时切换到 Hetzner。当你想要的是“一个运行着 Slack 和 claw 的 Linux 桌面”，而不只是机器人到机器人之间的 Slack 转录时，请使用这条通道。

`Mantis Telegram Live` 将现有 Telegram live QA 通道包装到同一个 PR 证据流水线中。它会在单独的 worktree 中检出受信任的候选 ref，运行 `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`，从 Telegram QA 摘要、`qa-evidence.json` 和报告工件写入 `mantis-evidence.json` 清单，通过 Crabbox 桌面浏览器渲染已脱敏的证据 HTML，用 `crabbox media preview` 生成运动裁剪 GIF，并在有 PR 编号时发布内联 PR 证据评论。这条通道是 QA 证据可视化，而不是已登录 Telegram Web 的证明：Telegram Bot API 提供稳定的 live 消息证据，但正常 Mantis 自动化不需要 Telegram Web 登录状态。

`Mantis Telegram Desktop Proof` 是 agentic 原生 Telegram Desktop 前后对比包装器。维护者可以从 PR 评论中用 `@openclaw-mantis telegram desktop proof` 触发，从 Actions UI 中用自由格式指令触发，或通过通用的 `Mantis Scenario` 分发器触发。该工作流会把 PR、baseline ref、candidate ref 和维护者指令交给 Codex。智能体会读取 PR，决定哪些 Telegram 可见行为能够证明这次变更，针对 baseline 和 candidate 运行真实用户 Crabbox Telegram Desktop 证明通道，迭代直到原生 GIF 有用，把成对的 `motionPreview` 工件写入 `mantis-evidence.json`，上传包，并在有 PR 编号时发布一个两列表格的 PR 证据。

对于需要人工介入的 Telegram 桌面设置，请使用场景构建器：

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

该构建器会租用或复用一个 Crabbox 桌面，安装原生 Linux Telegram Desktop 二进制文件，可选地恢复用户会话归档，用租用的 Telegram SUT 机器人令牌配置 OpenClaw，在端口 `38974` 上启动 `openclaw gateway run`，向租用的私有群组发布一条 driver bot 就绪消息，然后从可见的 VNC 桌面捕获截图和 MP4。机器人令牌永远不会登录 Telegram Desktop；它只用于配置 OpenClaw。桌面查看器是一个单独的 Telegram 用户会话，可以从 `--telegram-profile-archive-env <name>` 恢复，或通过 VNC 手动创建，并用 `--keep-lease` 保持存活。

有用的 Telegram 桌面构建器标志：

- `--lease-id <cbx_...>` 针对操作员已登录 Telegram Desktop 的 VM 重新运行。
- `--telegram-profile-archive-env <name>` 从该环境变量读取 base64 `.tgz` Telegram Desktop 配置归档，并在启动前恢复它。
- `--telegram-profile-dir <remote-path>` 控制远程 Telegram Desktop 配置目录。默认值是 `$HOME/.local/share/TelegramDesktop`。
- `--no-gateway-setup` 安装并打开 Telegram Desktop，但不配置 OpenClaw。
- `--credential-source convex --credential-role ci` 使用共享凭证代理，而不是直接的 Telegram 环境变量令牌。

每个发布到 PR 的场景都会在其报告旁写入 `mantis-evidence.json`。该 schema 是场景代码和 GitHub 评论之间的交接：

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

工件 `path` 值相对于清单目录。`targetPath` 值是配置的 Mantis R2/S3 工件前缀下的相对路径。发布器会拒绝路径穿越，并在可选预览或视频不可用时跳过标记为 `"required": false` 的条目。

支持的工件类型：

- `timeline`：确定性的场景截图，通常用于前后对比。
- `desktopScreenshot`：VNC/浏览器桌面截图。
- `motionPreview`：从桌面录制生成的内联动画 GIF。
- `motionClip`：移除静态开头和结尾的运动裁剪 MP4。
- `fullVideo`：用于深度检查的完整 MP4 录制。
- `metadata`：JSON/日志附属文件。
- `report`：Markdown 报告。

可复用发布器是 `scripts/mantis/publish-pr-evidence.mjs`。工作流会调用它，并传入清单、目标 PR、工件目标根目录、评论标记、Actions 工件 URL、运行 URL 和请求来源。它会把声明的工件上传到配置的 Mantis R2/S3 存储桶，构建一个摘要优先的 PR 评论，包含内联图片/预览和已链接的视频，然后更新现有标记评论或创建新评论。这些工作流会发布到 `openclaw-crabbox-artifacts`，公开 URL 位于 `https://artifacts.openclaw.ai` 下。它们直接提供存储桶、区域和公开 URL 值。可复用发布器需要：

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`

你也可以直接从 PR 评论触发 status-reactions 运行：

```text
@openclaw-mantis discord status reactions
```

评论触发器刻意保持狭窄。它只会在具有 write、maintain 或 admin 访问权限的用户发布的 pull request 评论上运行，并且只识别 Discord status-reaction 请求。默认情况下，它使用已知不良的 baseline ref，并使用当前 PR head SHA 作为 candidate。维护者可以覆盖任一 ref：

```text
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram live QA 也可以从 PR 评论触发：

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

默认情况下，它使用当前 PR head SHA 作为 candidate，并运行 `telegram-status-command`。当维护者需要特定 ref 或预热过的 Crabbox 桌面时，可以覆盖 `candidate=...`、`provider=aws|hetzner` 和 `lease=<cbx_...>`。

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一个命令是显式且聚焦场景的。第二个命令之后可以根据标签、已更改文件和 ClawSweeper 评审发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭证。
2. 分配或复用 VM。
3. 在场景需要 UI 证据时准备桌面/浏览器配置。
4. 为 baseline ref 准备干净的 checkout。
5. 安装依赖，并只构建场景所需内容。
6. 用隔离的状态目录启动子 OpenClaw Gateway 网关。
7. 配置 live 传输、提供商、模型和浏览器配置。
8. 运行场景并捕获 baseline 证据。
9. 停止 Gateway 网关并保留日志。
10. 在同一个 VM 中准备 candidate ref。
11. 运行同一个场景并捕获 candidate 证据。
12. 比较 oracle 结果和视觉证据。
13. 写入 Markdown、JSON、日志、截图和可选 trace 工件。
14. 上传 GitHub Actions 工件。
15. 发布简洁的 PR 或 Discord 状态消息。

场景应该能够以两种不同方式失败：

- **复现了 bug**：baseline 按预期方式失败。
- **Harness 失败**：环境设置、凭证、Discord API、浏览器或提供商在 bug oracle 具备意义之前失败。

最终报告必须区分这些情况，这样维护者就不会把不稳定环境和产品行为混淆。

## Discord MVP

第一个场景应该面向 guild 频道中的 Discord 状态 reaction，其中源回复交付模式是 `message_tool_only`。

它适合作为 Mantis 起点的原因：

- 它在 Discord 中表现为触发消息上的 reaction。
- 它通过 Discord 消息 reaction 状态提供强 REST oracle。
- 它会覆盖真实的 OpenClaw Gateway 网关、Discord bot 凭证、消息分发、源回复交付模式、状态 reaction 状态和模型轮次生命周期。
- 它足够狭窄，可以让第一个实现保持可靠。

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

Baseline 证据应显示已排队的确认 reaction，但在 tool-only 模式下没有生命周期转换。Candidate 证据应显示当 `messages.statusReactions.enabled` 明确为 true 时，生命周期状态 reaction 正在运行。

第一个可执行切片是可选启用的 Discord live QA 场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

它会为 SUT 配置始终开启的 guild 处理、`visibleReplies:
"message_tool"`、`ackReaction: "👀"` 和显式状态 reaction。Oracle 会轮询真实的 Discord 触发消息，并预期观察到序列 `👀 -> 🤔 -> 👍`。工件包括 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组成部分

Mantis 应该基于现有私有 QA 栈构建，而不是从零开始：

- `pnpm openclaw qa discord` 已经运行一个带有 driver 和 SUT bot 的 live Discord 通道。
- live 传输运行器已经在 `.artifacts/qa-e2e/` 下写入报告、QA 证据和传输特定工件。
- Convex 凭证租约已经为共享 live 传输凭证提供独占访问。
- 浏览器控制服务已经支持截图、快照、headless 托管配置和远程 CDP 配置。
- QA Lab 已经有用于传输形态测试的调试器 UI 和总线。

第一个 Mantis 实现可以是在这些组成部分之上的轻量前后对比运行器，再加上一层视觉证据。

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
- 机器提供商以及机器 id 或租约 id
- 不含密钥值的凭据来源
- 基线结果
- 候选结果
- Bug 是否在基线上复现
- 候选是否修复了它
- 工件路径
- 已清理敏感信息的设置或清理问题

截图是证据，不是密钥。它们仍然需要遵守脱敏纪律：可能会出现私有频道名称、用户名或消息内容。对于公开 PR，在脱敏方案更完善之前，优先使用 GitHub Actions 工件链接，而不是内联图片。

## 浏览器和 VNC

浏览器通道有两种模式：

- **无头自动化**：CI 的默认模式。Chrome 启用 CDP 运行，并由 Playwright 或 OpenClaw 浏览器控制捕获截图。
- **VNC 救援**：在登录、MFA、Discord 反自动化或可视化调试需要人工介入时，在同一台 VM 上启用。

Discord 观察者浏览器配置文件应足够持久，以避免每次运行都登录，但要与个人浏览器状态隔离。配置文件属于 Mantis 机器池，而不是开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord 状态消息，包含：

- 运行 id
- 场景 id
- 机器提供商
- 工件目录
- VNC 或 noVNC 连接说明（如果可用）
- 简短的阻塞原因文本

第一个私有部署可以将这些消息发布到现有操作员频道，之后再迁移到专用 Mantis 频道。

## 机器

Mantis 的首个远程实现应优先通过 Crabbox 使用 AWS。Crabbox 为我们提供预热机器、租约跟踪、水合、日志、结果和清理。如果 AWS 容量太慢或不可用，请在同一个机器接口后添加 Hetzner 提供商。

最低 VM 要求：

- 安装了支持桌面的 Chrome 或 Chromium 的 Linux
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够支撑一个 OpenClaw Gateway 网关、一个浏览器和一次模型运行的 CPU 和内存
- 可出站访问 Discord、GitHub、模型提供商和凭据代理

VM 不应在预期的凭据或浏览器配置文件存储之外保留长期原始密钥。

## 密钥

远程运行的密钥存放在 GitHub 组织或仓库密钥中，本地运行的密钥存放在由本地操作员控制的密钥文件中。

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
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

长期来看，Convex 凭据池应继续作为实时传输协议凭据的常规来源。GitHub 密钥用于引导代理和备用通道。Discord 状态反应工作流会把 Mantis Crabbox 密钥映射回 Crabbox CLI 预期的 `CRABBOX_COORDINATOR` 和 `CRABBOX_COORDINATOR_TOKEN` 环境变量。普通的 `CRABBOX_*` GitHub 密钥名称仍作为兼容性备用被接受。

Mantis 运行器绝不能打印：

- Discord Bot token
- 提供商 API key
- 浏览器 cookie
- 认证配置文件内容
- VNC 密码
- 原始凭据载荷

公开工件上传还应脱敏 Discord 目标元数据，例如 bot、guild、channel 和 message id。GitHub smoke 工作流因此启用 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 被意外粘贴到 issue、PR、聊天或日志中，请在新密钥存储完成后轮换它。

## GitHub 工件和 PR 评论

Mantis 工作流应将完整证据包上传为短期 Actions 工件。当工作流针对 Bug 报告或修复 PR 运行时，它还应将脱敏后的内联媒体发布到已配置的 Mantis R2/S3 bucket，并在该 Bug 或修复 PR 上 upsert 一条带有前后对比截图的评论。不要只把主要证明发布到一个通用 QA 自动化 PR 上。原始日志、观察到的消息和其他大型证据保留在 Actions 工件中。

生产工作流应使用 Mantis GitHub App 发布这些评论，而不是使用 `github-actions[bot]`。将 app id 和私钥作为 `MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions 密钥存储。工作流使用隐藏标记作为 upsert 键，在 token 可以编辑时更新该评论；当旧的 bot 所有标记无法编辑时，创建一条新的 Mantis 所有评论。

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

当运行因为 harness 失败而失败时，评论必须说明这一点，而不是暗示候选失败。

## 私有部署说明

私有部署可能已经有一个 Mantis Discord 应用。如果该应用拥有正确的 bot 权限并且可以安全轮换，请复用该应用，而不是创建另一个 app。

通过密钥或部署配置设置初始操作员通知频道。它可以先指向现有维护者或运维频道，然后在专用 Mantis 频道存在后迁移过去。

不要将 guild id、channel id、bot token、浏览器 cookie 或 VNC 密码放入本文档。请将它们存储在 GitHub 密钥、凭据代理或操作员的本地密钥存储中。

## 添加场景

Mantis 场景应声明：

- id 和标题
- 传输协议
- 所需凭据
- 基线 ref 策略
- 候选 ref 策略
- OpenClaw 配置补丁
- 设置步骤
- 刺激输入
- 预期基线 oracle
- 预期候选 oracle
- 可视化捕获目标
- 超时预算
- 清理步骤

场景应优先使用小型、类型化的 oracle：

- 用于 reaction bug 的 Discord reaction 状态
- 用于 threading bug 的 Discord 消息引用
- 用于 Slack bug 的 Slack thread ts 和 reaction API 状态
- 用于 email bug 的 email message id 和 header
- 当 UI 是唯一可靠可观察项时使用浏览器截图

视觉检查应作为补充。如果平台 API 可以证明 Bug，请使用 API 作为通过/失败 oracle，并保留截图以增强人工信心。

## 提供商扩展

在 Discord 之后，同一个运行器可以添加：

- Slack：reactions、threads、app mentions、modals、file uploads。
- Email：在 connectors 不足时，使用 `gog` 进行 Gmail auth 和 message threading。
- WhatsApp：QR 登录、重新识别、消息投递、媒体、reactions。
- Telegram：群组 mention gating、commands、可用时的 reactions。
- Matrix：encrypted rooms、thread 或 reply relations、restart resume。

每个传输协议都应有一个低成本 smoke 场景，以及一个或多个 Bug 类别场景。昂贵的可视化场景应保持为可选启用。

## 未决问题

- 当复用现有 Mantis bot 时，哪个 Discord bot 应该作为 driver，哪个应该作为 SUT？
- 第一阶段的观察者浏览器登录应使用人工 Discord 账号、测试账号，还是只使用 bot 可读的 REST 证据？
- GitHub 应为 PR 保留 Mantis 工件多久？
- ClawSweeper 应在什么时候自动推荐 Mantis，而不是等待维护者命令？
- 公开 PR 上传前，截图是否应脱敏或裁剪？
