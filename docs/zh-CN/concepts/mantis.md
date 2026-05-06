---
read_when:
    - 构建或运行用于 OpenClaw 缺陷的实时视觉 QA
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 调试需要屏幕截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是一个可视化端到端验证系统，用于在真实传输协议上复现 OpenClaw 缺陷、捕获修改前后的证据，并将工件附加到 PR。
title: Mantis
x-i18n:
    generated_at: "2026-05-06T00:25:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: e16fcbbcdf6514f87b5dc3369c3194784f586732e223d9cf530dc5911c5a57eb
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 的端到端验证系统，用于需要真实运行时、真实传输协议和可见证据的 bug。它会针对已知有问题的 ref 运行一个场景，捕获证据，再针对候选 ref 运行同一场景，并将对比结果发布为工件，维护者可以从 PR 或本地命令中检查这些工件。

Mantis 从 Discord 开始，因为 Discord 为我们提供了高价值的第一条验证路径：真实 bot 凭证、真实 guild 渠道、回应、线程、原生命令，以及一个浏览器 UI，让人可以直观看到传输协议展示了什么。

## 目标

- 使用用户看到的相同传输协议形态，复现 GitHub issue 或 PR 中的 bug。
- 在应用修复前，在基线 ref 上捕获一个 **before** 工件。
- 在应用修复后，在候选 ref 上捕获一个 **after** 工件。
- 尽可能使用确定性的判定器，例如 Discord REST 回应读取或渠道 transcript 检查。
- 当 bug 有可见 UI 表面时捕获截图。
- 可从智能体控制的 CLI 在本地运行，也可从 GitHub 远程运行。
- 在登录、浏览器自动化或提供商认证卡住时，保留足够的机器状态以便通过 VNC 救援。
- 当运行被阻塞、需要手动 VNC 帮助或完成时，向操作员 Discord 渠道发布简洁状态。

## 非目标

- Mantis 不是单元测试的替代品。修复被理解后，一次 Mantis 运行通常应转化为一个更小的回归测试。
- Mantis 不是常规的快速 CI 门禁。它更慢，使用实时凭证，并且仅保留给实时环境很重要的 bug。
- Mantis 的常规运行不应需要人工介入。手动 VNC 是救援路径，不是理想路径。
- Mantis 不会在工件、日志、截图、Markdown 报告或 PR 评论中存储原始密钥。

## 归属

Mantis 位于 OpenClaw QA 栈中。

- OpenClaw 拥有场景运行时、传输协议适配器、证据 schema，以及 `pnpm openclaw qa mantis` 下的本地 CLI。
- QA Lab 拥有实时传输协议 harness 组件、浏览器捕获辅助工具和工件写入器。
- 当需要远程 VM 时，Crabbox 拥有预热的 Linux 机器。
- GitHub Actions 拥有远程工作流入口点和工件保留。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、调度工作流，以及发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体通过 Codex 驱动 Mantis。

这个边界将传输协议知识保留在 OpenClaw 中，将机器调度保留在 Crabbox 中，将维护者工作流胶水保留在 ClawSweeper 中。

## 命令形式

第一个本地命令会验证 Discord bot、guild、渠道、消息发送、回应发送和工件路径：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本地 before 和 after runner 接受这种形式：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner 会在输出目录下创建分离的基线和候选 worktree，安装依赖，构建每个 ref，使用 `--allow-failures` 运行场景，然后写入 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md`。对于第一个 Discord 场景，成功验证意味着基线 Status 是 `fail`，候选 Status 是 `pass`。

第二个 Discord before/after 探针针对线程附件：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

该场景会用 driver bot 发布一条父消息，创建一个真实的 Discord 线程，使用 repo-local `filePath` 调用 OpenClaw 的 `message.thread-reply` 操作，然后轮询线程以查找 SUT 回复和附件文件名。基线截图显示没有附件的回复；候选截图显示预期的 `mantis-thread-report.md` 附件。

第一个 VM/browser 原语是桌面冒烟检查：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它会租用或复用一台 Crabbox 桌面机器，在 VNC 会话中启动可见浏览器，捕获桌面，将工件拉回本地输出目录，并把重连命令写入报告。该命令默认使用 Hetzner 提供商，因为它是 Mantis 验证路径中第一个拥有可用桌面/VNC 覆盖的提供商。对其他 Crabbox fleet 运行时，可用 `--provider`、`--crabbox-bin` 或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆盖它。

有用的桌面冒烟检查标志：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 会复用预热的桌面。
- `--browser-url <url>` 会更改可见浏览器打开的页面。
- `--html-file <path>` 会在可见浏览器中渲染 repo-local HTML 工件。Mantis 用它通过真实 Crabbox 桌面捕获生成的 Discord 状态回应时间线。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 会让新创建且通过的租约保持打开，以便 VNC 检查。失败运行在创建了租约时默认保留该租约，以便操作员可以重连。
- `--class`、`--idle-timeout` 和 `--ttl` 会调整机器大小和租约生命周期。

第一个完整桌面传输协议原语是 Slack 桌面冒烟检查：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它会租用或复用一台 Crabbox 桌面机器，将当前 checkout 同步到 VM 中，在该 VM 内运行 `pnpm openclaw qa slack`，在 VNC 浏览器中打开 Slack Web，捕获可见桌面，并将 Slack QA 工件和 VNC 截图都复制回本地输出目录。这是第一个让 SUT OpenClaw Gateway 网关和浏览器都位于同一个 Linux 桌面 VM 内的 Mantis 形式。

使用 `--gateway-setup` 时，该命令会在 `$HOME/.openclaw-mantis/slack-openclaw` 准备一个持久的一次性 OpenClaw home，为所选渠道修补 Slack Socket Mode 配置，在端口 `38973` 启动 `openclaw gateway run`，并保持 Chrome 在 VNC 会话中运行。这是“给我留下一个运行着 Slack 和 claw 的 Linux 桌面”模式；省略 `--gateway-setup` 时，bot-to-bot Slack QA 验证路径仍是默认值。

`--credential-source env` 的必需输入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 远程模型验证路径需要 `OPENCLAW_LIVE_OPENAI_KEY`。如果本地只设置了 `OPENAI_API_KEY`，Mantis 会在调用 Crabbox 前将其映射到 `OPENCLAW_LIVE_OPENAI_KEY`，这样 Crabbox 的 `OPENCLAW_*` 环境转发就能把它带入 VM。

使用 `--gateway-setup --credential-source convex` 时，Mantis 会先从共享池租用 Slack SUT 凭证，然后再创建 VM，并在桌面内部将租用的渠道 id、Socket Mode app token 和 bot token 转发为 `OPENCLAW_MANTIS_SLACK_*` 运行时环境变量。这让 GitHub 工作流保持轻量：它们只需要 Convex broker 密钥，不需要原始 Slack bot 或 app token。

有用的 Slack 桌面标志：

- `--lease-id <cbx_...>` 会针对操作员已经通过 VNC 登录 Slack Web 的机器重新运行。
- `--gateway-setup` 会在 VM 中启动持久 OpenClaw Slack Gateway 网关，而不是只运行 bot-to-bot QA 验证路径。
- `--keep-lease` 会在成功后保持 Gateway 网关 VM 打开，以便 VNC 检查；`--no-keep-lease` 会在收集工件后停止它。
- `--slack-url <url>` 会打开特定 Slack Web URL。没有它时，若 SUT bot token 可用，Mantis 会从 Slack `auth.test` 派生 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 控制 Gateway 网关设置使用的 Slack 渠道 allowlist。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 内的持久 Chrome profile。默认值是 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手动 Slack Web 登录可以在同一租约上的重复运行中保留。
- `--credential-source convex --credential-role ci` 使用共享凭证池，而不是直接的 Slack 环境 token。
- `--provider-mode`、`--model`、`--alt-model` 和 `--fast` 会透传到 Slack 实时验证路径。

GitHub 冒烟工作流是 `Mantis Discord Smoke`。第一个真实场景的 before 和 after GitHub 工作流是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期复现 queued-only 行为的 ref。
- `candidate_ref`：预期显示 `queued -> thinking -> done` 的 ref。

它会 checkout 工作流 harness ref，构建独立的基线和候选 worktree，分别针对每个 worktree 运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 作为 Actions 工件上传。它还会在 Crabbox 桌面浏览器中渲染每条验证路径的时间线 HTML，并在 PR 评论中把这些 VNC 截图发布到确定性的时间线 PNG 旁边。同一条 PR 评论会嵌入由 `crabbox media preview` 生成的轻量级 motion-trimmed GIF 预览，链接到匹配的 motion-trimmed MP4 片段，并保留完整桌面 MP4 文件以便深入检查。截图会保持内联，以便快速审阅。该工作流从 `openclaw/crabbox` main 构建 Crabbox CLI，以便在下一个 Crabbox 二进制版本发布前使用当前的桌面/浏览器租约标志。

`Mantis Scenario` 是通用手动入口点。它接受 `scenario_id`、`candidate_ref`、可选的 `baseline_ref` 和可选的 `pr_number`，然后调度该场景拥有的工作流。这个 wrapper 有意保持轻量：场景工作流仍然拥有自己的传输协议设置、凭证、VM class、预期判定器和工件清单。

`Mantis Slack Desktop Smoke` 是第一个 Slack VM 工作流。它会在单独的 worktree 中 checkout 受信任的候选 ref，租用一个 Crabbox Linux 桌面，针对该候选运行 `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`，在 VNC 浏览器中打开 Slack Web，录制桌面，用 `crabbox media preview` 生成 motion-trimmed 预览，上传完整工件目录，并可选择在目标 PR 上发布内联证据评论。它默认使用 AWS 进行桌面租约，并暴露一个手动提供商输入，以便操作员在 AWS 容量缓慢或不可用时切换到 Hetzner。当你需要“一个运行着 Slack 和 claw 的 Linux 桌面”，而不是只有 bot-to-bot Slack transcript 时，使用这条验证路径。

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

工件 `path` 值相对于清单目录。`targetPath` 值是 `qa-artifacts` 分支发布目录下的相对路径。publisher 会拒绝路径遍历，并在可选预览或视频不可用时跳过标记为 `"required": false` 的条目。

支持的工件类型：

- `timeline`：确定性场景截图，通常为前后对比。
- `desktopScreenshot`：VNC/浏览器桌面截图。
- `motionPreview`：由桌面录制生成的内联 GIF 动画。
- `motionClip`：去除静态开头和结尾的动作裁剪 MP4。
- `fullVideo`：用于深入检查的完整 MP4 录制。
- `metadata`：JSON/日志随附文件。
- `report`：Markdown 报告。

可复用的发布器是 `scripts/mantis/publish-pr-evidence.mjs`。工作流
会使用清单、目标 PR、`qa-artifacts` 目标根目录、评论标记、
Actions 工件 URL、运行 URL 和请求来源来调用它。它会将声明的工件
复制到 `qa-artifacts` 分支，生成一个摘要优先的 PR 评论，其中包含内联
图片/预览和链接视频，然后更新现有的标记评论或创建一个新评论。

你也可以直接从 PR 评论触发状态表情回应运行：

```text
@Mantis discord status reactions
```

评论触发器刻意保持范围狭窄。它只会在具有写入、维护或管理员权限的用户
发表的拉取请求评论上运行，并且只识别 Discord 状态表情回应请求。默认情况下，
它会使用已知有问题的基线 ref，并将当前 PR head SHA 作为候选版本。维护者可以覆盖任一
ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一个命令是显式且聚焦场景的。第二个命令之后可以根据标签、变更文件和
ClawSweeper 审查发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭证。
2. 分配或复用 VM。
3. 当场景需要 UI 证据时，准备桌面/浏览器配置文件。
4. 为基线 ref 准备一个干净的 checkout。
5. 安装依赖，并只构建场景所需的内容。
6. 使用隔离的状态目录启动一个子 OpenClaw Gateway 网关。
7. 配置实时传输协议、提供商、模型和浏览器配置文件。
8. 运行场景并捕获基线证据。
9. 停止 Gateway 网关并保留日志。
10. 在同一 VM 中准备候选 ref。
11. 运行相同场景并捕获候选证据。
12. 比较判定器结果和视觉证据。
13. 写入 Markdown、JSON、日志、截图和可选的 trace 工件。
14. 上传 GitHub Actions 工件。
15. 发布一条简洁的 PR 或 Discord 状态消息。

场景应能以两种不同方式失败：

- **已复现 bug**：基线以预期方式失败。
- **测试框架故障**：环境设置、凭证、Discord API、浏览器或
  提供商在 bug 判定器产生有意义结果之前失败。

最终报告必须区分这些情况，避免维护者将不稳定环境与产品行为混淆。

## Discord MVP

第一个场景应针对 guild 频道中的 Discord 状态表情回应，其中
源回复投递模式为 `message_tool_only`。

它适合作为 Mantis 初始场景的原因：

- 它在 Discord 中以触发消息上的表情回应形式可见。
- 它通过 Discord 消息表情回应状态提供强 REST 判定器。
- 它会覆盖真实的 OpenClaw Gateway 网关、Discord bot 凭证、消息分发、
  源回复投递模式、状态表情回应状态和模型轮次生命周期。
- 它足够狭窄，可以让第一个实现保持务实。

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

基线证据应显示排队的确认表情回应，但在仅工具模式下没有生命周期转换。
候选证据应显示当 `messages.statusReactions.enabled` 被显式设为
true 时，生命周期状态表情回应会运行。

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

它会用始终开启的 guild 处理、`visibleReplies:
"message_tool"`、`ackReaction: "👀"` 和显式状态表情回应来配置 SUT。判定器
会轮询真实的 Discord 触发消息，并期望观察到序列
`👀 -> 🤔 -> 👍`。工件包括 `discord-qa-reaction-timelines.json`、
`discord-status-reactions-tool-only-timeline.html` 和
`discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应基于现有私有 QA 栈构建，而不是从零开始：

- `pnpm openclaw qa discord` 已经运行带有驱动 bot 和
  SUT bot 的实时 Discord 通道。
- 实时传输协议运行器已经会在 `.artifacts/qa-e2e/` 下写入报告和已观察消息
  工件。
- Convex 凭证租约已经为共享实时传输协议凭证提供独占访问。
- 浏览器控制服务已经支持截图、快照、无头托管配置文件和远程 CDP 配置文件。
- QA Lab 已经有用于传输协议形态测试的调试器 UI 和总线。

第一个 Mantis 实现可以是在这些组件之上添加一个轻量的前后对比运行器，
再加一层视觉证据。

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

`mantis-summary.json` 应是机器可读的事实来源。
Markdown 报告用于 PR 评论和人工审查。

摘要必须包含：

- 已测试的 refs 和 SHA
- 传输协议和场景 id
- 机器提供商以及机器 id 或租约 id
- 不包含密钥值的凭证来源
- 基线结果
- 候选结果
- bug 是否在基线上复现
- 候选版本是否修复了它
- 工件路径
- 已清理的设置或清理问题

截图是证据，不是机密。它们仍然需要严格脱敏：
私有频道名称、用户名或消息内容可能会出现。对于公开 PR，
在脱敏方案更完善之前，优先使用 GitHub Actions 工件链接，而不是内联图片。

## 浏览器和 VNC

浏览器通道有两种模式：

- **无头自动化**：CI 默认模式。Chrome 启用 CDP 运行，
  Playwright 或 OpenClaw 浏览器控制会捕获截图。
- **VNC 救援**：在同一 VM 上启用，当登录、MFA、Discord 反自动化
  或视觉调试需要人工介入时使用。

Discord 观察者浏览器配置文件应具有足够持久性，避免每次运行都重新登录，
但要与个人浏览器状态隔离。配置文件属于 Mantis 机器池，而不是开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord 状态消息，包含：

- 运行 id
- 场景 id
- 机器提供商
- 工件目录
- 如果可用，提供 VNC 或 noVNC 连接说明
- 简短阻塞说明

第一个私有部署可以将这些消息发布到现有操作员频道，之后再迁移到专用的
Mantis 频道。

## 机器

Mantis 在第一个远程实现中应优先通过 Crabbox 使用 AWS。
Crabbox 为我们提供预热机器、租约跟踪、水合、日志、结果和
清理。如果 AWS 容量太慢或不可用，则在同一机器接口后添加
Hetzner 提供商。

最低 VM 要求：

- 安装了支持桌面的 Chrome 或 Chromium 的 Linux
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够的 CPU 和内存，可运行一个 OpenClaw Gateway 网关、一个浏览器和一次模型运行
- 可出站访问 Discord、GitHub、模型提供商和凭证 broker

VM 不应在预期凭证或浏览器配置文件存储之外保留长期原始机密。

## 机密

远程运行的机密存放在 GitHub 组织或仓库机密中，本地运行的机密存放在
由本地操作员控制的机密文件中。

推荐机密名称：

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

长期来看，Convex 凭证池应继续作为实时传输协议凭证的常规来源。
GitHub 机密用于引导 broker 和 fallback 通道。
Discord 状态表情回应工作流会将 Mantis Crabbox 机密映射回
Crabbox CLI 预期的 `CRABBOX_COORDINATOR` 和 `CRABBOX_COORDINATOR_TOKEN`
环境变量。普通的 `CRABBOX_*` GitHub 机密名称仍会作为兼容性 fallback 被接受。

Mantis 运行器绝不能打印：

- Discord bot token
- 提供商 API key
- 浏览器 cookie
- auth profile 内容
- VNC 密码
- 原始凭证 payload

公开工件上传还应脱敏 Discord 目标元数据，例如 bot、
guild、频道和消息 id。GitHub smoke 工作流因此启用了
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 被意外粘贴到 issue、PR、聊天或日志中，在新机密已存储后
轮换它。

## GitHub 工件和 PR 评论

Mantis 工作流应将完整证据包上传为短期 Actions 工件。
当工作流针对 bug 报告或修复 PR 运行时，还应将脱敏后的 PNG 截图发布到
`qa-artifacts` 分支，并在该 bug 或修复 PR 上插入或更新一条
包含内联前后对比截图的评论。不要只把主要证明发布在通用 QA 自动化 PR 上。
原始日志、已观察消息和其他大型证据保留在 Actions 工件中。

生产工作流应使用 Mantis GitHub App 发布这些评论，而不是
`github-actions[bot]`。将 app id 和私钥分别存储为
`MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions
机密。工作流使用隐藏标记作为插入或更新键，当 token 可以编辑时更新该
评论；当较旧的 bot 所有标记无法编辑时，创建一条新的 Mantis 所有评论。

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

当运行因测试框架故障而失败时，评论必须说明这一点，而不是暗示候选版本失败。

## 私有部署说明

私有部署可能已经有一个 Mantis Discord 应用。当它拥有正确的 bot
权限并且可以安全轮换时，复用该应用，而不是创建另一个 app。

设置初始操作员通知渠道时，请通过 secrets 或部署配置完成。它可以先指向现有维护者或运维渠道，等专用的 Mantis 渠道存在后再迁移过去。

不要把 guild id、channel id、bot token、浏览器 cookie 或 VNC 密码放进本文档。请将它们存储在 GitHub secrets、凭证代理或操作员的本地密钥存储中。

## 添加场景

Mantis 场景应声明：

- id 和 title
- 传输协议
- 所需凭证
- baseline ref 策略
- candidate ref 策略
- OpenClaw 配置补丁
- 设置步骤
- 触发输入
- 预期 baseline 判定源
- 预期 candidate 判定源
- 视觉捕获目标
- 超时预算
- 清理步骤

场景应优先使用小型的类型化判定源：

- 用于 reaction bug 的 Discord reaction 状态
- 用于 threading bug 的 Discord message references
- 用于 Slack bug 的 Slack thread ts 和 reaction API 状态
- 用于 email bug 的 email message id 和 header
- 当 UI 是唯一可靠可观测对象时，使用浏览器截图

视觉检查应作为补充。如果平台 API 能证明 bug，就使用 API 作为通过/失败判定源，并将截图保留用于增强人工信心。

## 提供商扩展

在 Discord 之后，同一个 runner 可以添加：

- Slack：reaction、thread、app mention、modal、文件上传。
- Email：在 connector 不足时，使用 `gog` 进行 Gmail 凭证验证和消息 threading。
- WhatsApp：QR 登录、重新识别、消息投递、媒体、reaction。
- Telegram：群组 mention 门控、命令、可用时的 reaction。
- Matrix：加密房间、thread 或 reply 关系、重启恢复。

每个传输协议都应有一个低成本 smoke 场景，以及一个或多个 bug 类别场景。昂贵的视觉场景应保持为 opt-in。

## 未决问题

- 复用现有 Mantis bot 时，哪个 Discord bot 应作为 driver，哪个应作为 SUT？
- observer 浏览器登录在第一阶段应使用真人 Discord 账号、测试账号，还是只使用 bot 可读的 REST 证据？
- GitHub 应为 PR 保留 Mantis artifact 多久？
- ClawSweeper 应在什么情况下自动推荐 Mantis，而不是等待维护者命令？
- 面向公开 PR 上传前，截图是否应做脱敏或裁剪？
