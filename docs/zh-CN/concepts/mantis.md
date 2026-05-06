---
read_when:
    - 为 OpenClaw 缺陷构建或运行实时视觉 QA
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是用于在真实传输协议上复现 OpenClaw 缺陷、捕获修复前后证据并将工件附加到拉取请求的可视化端到端验证系统。
title: Mantis
x-i18n:
    generated_at: "2026-05-06T04:53:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: b470cfe2b79dc6eee7382122c6ad7d1a9f7df6a1c4972254cd2672eefcf54e22
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 端到端验证系统，适用于需要真实运行时、真实传输协议和可见证据的 bug。它会针对已知错误的 ref 运行一个场景，捕获证据，再针对候选 ref 运行同一场景，并将对比结果发布为构件，维护者可以从拉取请求或本地命令中检查这些构件。

Mantis 从 Discord 开始，因为 Discord 为我们提供了一条高价值的首个通道：真实的机器人凭证、真实的服务器频道、回应、帖子串、原生命令，以及一个人类可以直观确认传输协议显示内容的浏览器界面。

## 目标

- 使用用户看到的同类传输形态，从 GitHub 议题或拉取请求中复现 bug。
- 在应用修复前，在基线 ref 上捕获一个 **before** 构件。
- 在应用修复后，在候选 ref 上捕获一个 **after** 构件。
- 尽可能使用确定性判定器，例如读取 Discord REST 回应或检查频道转录。
- 当 bug 有可见 UI 表面时捕获截图。
- 从智能体控制的 CLI 本地运行，也能从 GitHub 远程运行。
- 当登录、浏览器自动化或提供商凭证卡住时，保留足够的机器状态用于 VNC 救援。
- 当运行被阻塞、需要手动 VNC 协助或完成时，向操作员 Discord 频道发布简洁状态。

## 非目标

- Mantis 不是单元测试的替代品。理解修复后，Mantis 运行通常应转化为更小的回归测试。
- Mantis 不是常规的快速 CI 门禁。它更慢，使用真实凭证，并且仅用于真实环境很重要的 bug。
- Mantis 不应要求人工参与常规操作。手动 VNC 是救援路径，而不是顺畅路径。
- Mantis 不会在构件、日志、截图、Markdown 报告或拉取请求评论中存储原始密钥。

## 所有权

Mantis 属于 OpenClaw QA 栈。

- OpenClaw 拥有场景运行时、传输协议适配器、证据 schema，以及 `pnpm openclaw qa mantis` 下的本地 CLI。
- QA Lab 拥有真实传输协议 harness 组件、浏览器捕获辅助工具和构件写入器。
- 需要远程 VM 时，Crabbox 拥有预热的 Linux 机器。
- GitHub Actions 拥有远程工作流入口点和构件保留。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、分派工作流，以及发布最终拉取请求评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体通过 Codex 驱动 Mantis。

这个边界将传输协议知识保留在 OpenClaw，将机器调度保留在 Crabbox，并将维护者工作流粘合逻辑保留在 ClawSweeper。

## 命令形态

第一个本地命令会验证 Discord 机器人、服务器、频道、消息发送、回应发送和构件路径：

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

运行器会在输出目录下创建分离的基线和候选 worktree，安装依赖，构建每个 ref，使用 `--allow-failures` 运行场景，然后写入 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md`。对于第一个 Discord 场景，成功验证意味着基线状态是 `fail`，候选状态是 `pass`。

第二个 Discord before/after 探针以帖子串附件为目标：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

该场景会使用驱动机器人发布一条父消息，创建真实的 Discord 帖子串，调用 OpenClaw 的 `message.thread-reply` 动作并传入仓库本地的 `filePath`，然后轮询该帖子串以获取 SUT 回复和附件文件名。基线截图显示回复中没有附件；候选截图显示预期的 `mantis-thread-report.md` 附件。

第一个 VM/浏览器基础能力是桌面 smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它会租用或复用一台 Crabbox 桌面机器，在 VNC 会话中启动可见浏览器，捕获桌面，将构件拉回本地输出目录，并把重新连接命令写入报告。该命令默认使用 Hetzner 提供商，因为它是 Mantis 通道中第一个具备可用桌面/VNC 覆盖的提供商。针对另一个 Crabbox 机群运行时，可使用 `--provider`、`--crabbox-bin` 或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆盖它。

有用的桌面 smoke 标志：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 会复用预热的桌面。
- `--browser-url <url>` 会更改可见浏览器中打开的页面。
- `--html-file <path>` 会在可见浏览器中渲染仓库本地 HTML 构件。Mantis 使用它通过真实 Crabbox 桌面捕获生成的 Discord 状态回应时间线。
- `--browser-profile-dir <remote-path>` 会复用远程 Chrome user-data-dir，使持久 Mantis 桌面可以在运行之间保持登录状态。将它用于长期存在的 Discord Web 查看器配置。
- `--browser-profile-archive-env <name>` 会在启动浏览器前，从命名环境变量中还原 base64 `.tgz` Chrome user-data-dir 归档。将它用于已登录的见证者，例如 Discord Web。默认环境变量是 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`。
- `--video-duration <seconds>` 控制 MP4 捕获时长。对于需要时间稳定下来的慢速已登录 Web 应用，使用更长时长。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 会让新建且通过的租约保持打开，以便 VNC 检查。当创建了租约时，失败运行默认保留租约，以便操作员重新连接。
- `--class`、`--idle-timeout` 和 `--ttl` 会调节机器大小和租约生命周期。

对于 Discord Web 证据，Mantis 使用专用查看器账号，而不是机器人令牌。真实 Discord API 场景仍然是判定器：它会创建真实帖子串，发送 SUT `thread-reply`，并通过 Discord REST 检查附件。设置 `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` 时，该场景还会写入一个 Discord Web URL 构件。设置 `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` 时，它会让该帖子串保留足够长的时间，以便已登录浏览器打开并记录它。

GitHub 工作流会在 Discord Web 中打开候选帖子串 URL，捕获截图，录制 MP4，并在 Crabbox 媒体工具可用时生成裁剪后的 GIF 预览。优先使用通过 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 配置的持久查看器配置路径，因为完整 Chrome 配置归档可能超过 GitHub 的密钥大小限制。对于较小或引导用配置，工作流也可以从 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 还原 base64 `.tgz` 归档。如果未配置任何配置来源，工作流仍会发布确定性的基线/候选附件截图，并记录一条通知，说明已跳过已登录的 Discord Web 见证者。

第一个完整桌面传输协议基础能力是 Slack 桌面 smoke：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它会租用或复用一台 Crabbox 桌面机器，将当前 checkout 同步到 VM 中，在该 VM 内运行 `pnpm openclaw qa slack`，在 VNC 浏览器中打开 Slack Web，捕获可见桌面，并将 Slack QA 构件和 VNC 截图复制回本地输出目录。这是第一种 SUT OpenClaw gateway 和浏览器都位于同一台 Linux 桌面 VM 内的 Mantis 形态。

使用 `--gateway-setup` 时，该命令会在 `$HOME/.openclaw-mantis/slack-openclaw` 准备一个持久的一次性 OpenClaw home，为所选频道修补 Slack Socket Mode 配置，在端口 `38973` 上启动 `openclaw gateway run`，并让 Chrome 保持在 VNC 会话中运行。这是“给我留一个运行着 Slack 和 claw 的 Linux 桌面”模式；省略 `--gateway-setup` 时，机器人到机器人的 Slack QA 通道仍是默认模式。

`--credential-source env` 的必需输入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 远程模型通道需要 `OPENCLAW_LIVE_OPENAI_KEY`。如果本地只设置了 `OPENAI_API_KEY`，Mantis 会在调用 Crabbox 前将其映射到 `OPENCLAW_LIVE_OPENAI_KEY`，以便 Crabbox 的 `OPENCLAW_*` 环境变量转发可以将它带入 VM。

使用 `--gateway-setup --credential-source convex` 时，Mantis 会先从共享池租用 Slack SUT 凭证，再创建 VM，并将租用的频道 ID、Socket Mode 应用令牌和机器人令牌作为桌面内的 `OPENCLAW_MANTIS_SLACK_*` 运行时环境变量转发。这会让 GitHub 工作流保持轻量：它们只需要 Convex broker 密钥，而不需要原始 Slack 机器人或应用令牌。

有用的 Slack 桌面标志：

- `--lease-id <cbx_...>` 会针对操作员已通过 VNC 登录 Slack Web 的机器重新运行。
- `--gateway-setup` 会在 VM 中启动持久 OpenClaw Slack gateway，而不只是运行机器人到机器人的 QA 通道。
- `--keep-lease` 会在成功后保留 gateway VM 以供 VNC 检查；`--no-keep-lease` 会在收集构件后停止它。
- `--slack-url <url>` 会打开特定 Slack Web URL。没有它时，当 SUT 机器人令牌可用，Mantis 会根据 Slack `auth.test` 推导 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 控制 gateway 设置使用的 Slack 频道允许列表。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 内的持久 Chrome 配置。默认值是 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手动 Slack Web 登录可以在同一租约上的重新运行中保留。
- `--credential-source convex --credential-role ci` 使用共享凭证池，而不是直接 Slack 环境令牌。
- `--provider-mode`、`--model`、`--alt-model` 和 `--fast` 会透传给 Slack 真实通道。

GitHub smoke 工作流是 `Mantis Discord Smoke`。第一个真实场景的 before 和 after GitHub 工作流是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期会复现仅 queued 行为的 ref。
- `candidate_ref`：预期会显示 `queued -> thinking -> done` 的 ref。

它会 checkout 工作流 harness ref，构建单独的基线和候选 worktree，针对每个 worktree 运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 作为 Actions 构件上传。它还会在 Crabbox 桌面浏览器中渲染每个通道的时间线 HTML，并在拉取请求评论中将这些 VNC 截图发布到确定性时间线 PNG 旁边。同一条拉取请求评论会嵌入由 `crabbox media preview` 生成的轻量运动裁剪 GIF 预览，链接到对应的运动裁剪 MP4 片段，并保留完整桌面 MP4 文件用于深入检查。截图保持内联，便于快速审阅。该工作流会从 `openclaw/crabbox` main 构建 Crabbox CLI，以便在下一个 Crabbox 二进制版本发布前使用当前桌面/浏览器租约标志。

`Mantis Scenario` 是通用手动入口点。它接受 `scenario_id`、`candidate_ref`、可选的 `baseline_ref` 和可选的 `pr_number`，然后分派场景拥有的工作流。该包装器有意保持轻量：场景工作流仍然拥有自己的传输协议设置、凭证、VM 类别、预期判定器和构件清单。

`Mantis Slack Desktop Smoke` 是第一个 Slack VM 工作流。它会在单独的 worktree 中检出受信任的候选 ref，租用一台 Crabbox Linux 桌面，针对该候选版本运行 `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`，在 VNC 浏览器中打开 Slack Web，录制桌面，使用 `crabbox media preview` 生成经过动作裁剪的预览，上传完整 artifact 目录，并可选择在目标 PR 上发布内联证据评论。它默认使用 AWS 租用桌面，并公开一个手动 provider 输入，让操作员在 AWS 容量较慢或不可用时切换到 Hetzner。当你想要“一个带有 Slack 和正在运行的 claw 的 Linux 桌面”，而不只是机器人到机器人的 Slack 记录时，请使用这条通道。

每个 PR 发布场景都会在其报告旁写入 `mantis-evidence.json`。此 schema 是场景代码和 GitHub 评论之间的交接格式：

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
- `desktopScreenshot`：VNC/浏览器桌面截图。
- `motionPreview`：从桌面录制生成的内联动画 GIF。
- `motionClip`：经过动作裁剪、移除静态开头和结尾的 MP4。
- `fullVideo`：用于深入检查的完整 MP4 录制。
- `metadata`：JSON/日志附带文件。
- `report`：Markdown 报告。

可复用发布器是 `scripts/mantis/publish-pr-evidence.mjs`。工作流会使用清单、目标 PR、`qa-artifacts` 目标根目录、评论标记、Actions artifact URL、运行 URL 和请求来源来调用它。它会将声明的 artifacts 复制到 `qa-artifacts` 分支，构建以摘要优先的 PR 评论，包含内联图片/预览和链接视频，然后更新现有标记评论或创建一个新评论。

你也可以直接从 PR 评论触发状态反应运行：

```text
@Mantis discord status reactions
```

评论触发器有意保持范围很窄。它只会在拥有 write、maintain 或 admin 访问权限的用户发布的 pull request 评论上运行，并且只识别 Discord 状态反应请求。默认情况下，它使用已知有问题的基线 ref，并使用当前 PR head SHA 作为候选版本。维护者可以覆盖任一 ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一个命令是显式且聚焦场景的。第二个稍后可以根据标签、变更文件和 ClawSweeper 评审发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭据。
2. 分配或复用一台 VM。
3. 当场景需要 UI 证据时，准备桌面/浏览器 profile。
4. 为基线 ref 准备干净的 checkout。
5. 安装依赖，并只构建场景需要的内容。
6. 使用隔离状态目录启动子 OpenClaw Gateway 网关。
7. 配置实时传输协议、provider、model 和浏览器 profile。
8. 运行场景并捕获基线证据。
9. 停止 Gateway 网关并保留日志。
10. 在同一台 VM 中准备候选 ref。
11. 运行同一场景并捕获候选证据。
12. 比较 oracle 结果和视觉证据。
13. 写入 Markdown、JSON、日志、截图和可选 trace artifacts。
14. 上传 GitHub Actions artifacts。
15. 发布简洁的 PR 或 Discord 状态消息。

场景应能以两种不同方式失败：

- **复现了 bug**：基线按预期方式失败。
- **Harness 失败**：环境设置、凭据、Discord API、浏览器或 provider 在 bug oracle 变得有意义之前失败。

最终报告必须区分这些情况，以免维护者将不稳定环境与产品行为混淆。

## Discord MVP

第一个场景应针对 guild channel 中的 Discord 状态反应，其中源回复投递模式为 `message_tool_only`。

它适合作为 Mantis 起点的原因：

- 它在 Discord 中以触发消息上的反应形式可见。
- 它通过 Discord 消息反应状态提供强 REST oracle。
- 它会覆盖真实的 OpenClaw Gateway 网关、Discord bot auth、消息分发、源回复投递模式、状态反应状态和 model 轮次生命周期。
- 它足够窄，能让第一版实现保持准确。

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

基线证据应显示已排队的确认反应，但在仅工具模式下没有生命周期转换。候选证据应显示当 `messages.statusReactions.enabled` 显式为 true 时，生命周期状态反应正在运行。

可执行的第一个切片是选择加入的 Discord 实时 QA 场景：

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
"message_tool"`、`ackReaction: "👀"` 和显式状态反应。Oracle 会轮询真实 Discord 触发消息，并期望观察到序列 `👀 -> 🤔 -> 👍`。Artifacts 包括 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应基于现有私有 QA 栈构建，而不是从零开始：

- `pnpm openclaw qa discord` 已经运行一条带 driver 和 SUT bot 的实时 Discord 通道。
- 实时传输协议 runner 已经会在 `.artifacts/qa-e2e/` 下写入报告和 observed-message artifacts。
- Convex 凭据租约已经提供对共享实时传输协议凭据的独占访问。
- 浏览器控制服务已经支持截图、快照、无头托管 profile 和远程 CDP profile。
- QA Lab 已经有用于传输协议形态测试的调试器 UI 和总线。

第一个 Mantis 实现可以是在这些组件之上的轻量前后对比 runner，再加上一层视觉证据。

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

`mantis-summary.json` 应是机器可读的事实来源。Markdown 报告用于 PR 评论和人工评审。

摘要必须包含：

- 测试的 refs 和 SHA
- 传输协议和场景 id
- 机器 provider 和机器 id 或租约 id
- 不含 secret 值的凭据来源
- 基线结果
- 候选结果
- bug 是否在基线上复现
- 候选版本是否修复了它
- artifact 路径
- 已清理的设置或清理问题

截图是证据，不是 secret。它们仍然需要遵守脱敏纪律：私有 channel 名称、用户名或消息内容可能会出现。对于公开 PR，在脱敏策略更完善之前，优先使用 GitHub Actions artifact 链接，而不是内联图片。

## 浏览器和 VNC

浏览器通道有两种模式：

- **无头自动化**：CI 的默认模式。Chrome 会启用 CDP，Playwright 或 OpenClaw 浏览器控制会捕获截图。
- **VNC 救援**：当登录、MFA、Discord 反自动化或视觉调试需要人工介入时，在同一台 VM 上启用。

Discord 观察者浏览器 profile 应足够持久，以避免每次运行都登录，但要与个人浏览器状态隔离。Profile 属于 Mantis 机器池，而不是开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord 状态消息，包含：

- 运行 id
- 场景 id
- 机器 provider
- artifact 目录
- VNC 或 noVNC 连接说明（如可用）
- 简短阻塞原因文本

第一次私有部署可以将这些消息发布到现有 operator channel，之后再迁移到专用 Mantis channel。

## 机器

Mantis 的第一个远程实现应优先通过 Crabbox 使用 AWS。Crabbox 为我们提供预热机器、租约跟踪、hydration、日志、结果和清理。如果 AWS 容量太慢或不可用，请在相同机器接口后添加 Hetzner provider。

最低 VM 要求：

- 安装了支持桌面的 Chrome 或 Chromium 的 Linux
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够运行一个 OpenClaw Gateway 网关、一个浏览器和一次 model 运行的 CPU 和内存
- 能够出站访问 Discord、GitHub、model providers 和凭据 broker

VM 不应在预期凭据或浏览器 profile 存储之外保留长期有效的原始 secrets。

## Secrets

远程运行的 secrets 存放在 GitHub organization 或 repository secrets 中，本地运行则存放在由本地操作员控制的 secret 文件中。

推荐的 secret 名称：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` 用于公开 GitHub artifact 上传
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

长期来看，Convex 凭据池应继续作为实时传输协议凭据的常规来源。GitHub secrets 用于引导 broker 和 fallback 通道。Discord 状态反应工作流会将 Mantis Crabbox secrets 映射回 Crabbox CLI 期望的 `CRABBOX_COORDINATOR` 和 `CRABBOX_COORDINATOR_TOKEN` 环境变量。纯 `CRABBOX_*` GitHub secret 名称仍作为兼容 fallback 被接受。

Mantis runner 绝不能打印：

- Discord bot tokens
- provider API keys
- 浏览器 cookies
- auth profile 内容
- VNC passwords
- 原始凭据 payloads

公开 artifact 上传还应脱敏 Discord 目标 metadata，例如 bot、guild、channel 和 message ids。GitHub smoke 工作流因此启用了 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 被意外粘贴到 issue、PR、chat 或日志中，请在新 secret 存储完成后轮换它。

## GitHub artifacts 和 PR 评论

Mantis 工作流应将完整证据包上传为短期保留的 Actions 构件。当工作流针对 bug 报告或修复 PR 运行时，还应将已脱敏的 PNG 截图发布到 `qa-artifacts` 分支，并在该 bug 或修复 PR 上插入或更新一条评论，内联展示前后对比截图。不要只把主要证明发布在通用 QA 自动化 PR 上。原始日志、观测到的消息以及其他大体积证据保留在 Actions 构件中。

生产工作流应使用 Mantis GitHub App 发布这些评论，而不是使用 `github-actions[bot]`。将应用 ID 和私钥存储为 `MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions 密钥。工作流使用隐藏标记作为插入或更新键；当令牌可以编辑该评论时会更新它；当较早的机器人所有标记无法编辑时，会创建新的 Mantis 所有评论。

PR 评论应简短且以视觉信息为主：

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

私有部署可能已经有一个 Mantis Discord 应用。当该应用具备正确的机器人权限并且可以安全轮换时，应复用该应用，而不是再创建一个应用。

通过密钥或部署配置设置初始操作员通知渠道。它可以先指向现有维护者或运维渠道，然后在专用 Mantis 渠道存在后再迁移过去。

不要把 guild ID、渠道 ID、机器人令牌、浏览器 cookie 或 VNC 密码放入本文档。将它们存储在 GitHub 密钥、凭证代理或操作员本地密钥存储中。

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
- 视觉捕获目标
- 超时预算
- 清理步骤

场景应优先使用小型、类型化的判定器：

- 用于 reaction bug 的 Discord reaction 状态
- 用于线程 bug 的 Discord 消息引用
- 用于 Slack bug 的 Slack 线程 ts 和 reaction API 状态
- 用于邮件 bug 的电子邮件消息 ID 和标头
- 当 UI 是唯一可靠可观测项时，使用浏览器截图

视觉检查应作为补充。如果平台 API 可以证明 bug，就使用该 API 作为通过/失败判定器，并保留截图以增强人工信心。

## 提供商扩展

在 Discord 之后，同一个运行器可以添加：

- Slack：reactions、threads、app mentions、modals、file uploads。
- 电子邮件：在 connectors 不够用的地方，使用 `gog` 进行 Gmail 凭证和消息线程测试。
- WhatsApp：二维码登录、重新识别、消息投递、媒体、reactions。
- Telegram：群组 mention gating、commands、可用时的 reactions。
- Matrix：加密房间、thread 或 reply relations、重启恢复。

每种传输协议都应有一个低成本冒烟场景，以及一个或多个 bug 类别场景。昂贵的视觉场景应保持为可选启用。

## 待解决问题

- 复用现有 Mantis 机器人时，哪个 Discord 机器人应作为驱动方，哪个应作为 SUT？
- 观察者浏览器登录在第一阶段应使用真人 Discord 账号、测试账号，还是只使用机器人可读的 REST 证据？
- GitHub 应为 PR 保留 Mantis 构件多长时间？
- ClawSweeper 何时应自动推荐 Mantis，而不是等待维护者命令？
- 面向公开 PR 上传之前，截图是否应先脱敏或裁剪？
