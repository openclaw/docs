---
read_when:
    - 为 OpenClaw 缺陷构建或运行实时可视化质量检查
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是一种可视化端到端验证系统，用于在实时传输协议上复现 OpenClaw 缺陷、捕获前后证据，并将制品附加到拉取请求。
title: Mantis
x-i18n:
    generated_at: "2026-05-06T01:51:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bba09cf1c3b4e16fc1e8ca84ce0d9c8284969c82e56f1f7083fc54f238924e9
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 的端到端验证系统，面向需要真实运行时、真实传输协议以及可见证明的 bug。它会针对已知有问题的 ref 运行一个场景，捕获证据，再针对候选 ref 运行同一场景，并将对比结果发布为 artifacts，维护者可以从 PR 或本地命令中检查这些 artifacts。

Mantis 从 Discord 开始，因为 Discord 为我们提供了一条高价值的第一条验证路径：真实 bot 凭证、真实 guild 渠道、reaction、thread、原生命令，以及一个可供人类直观看到传输协议所呈现内容的浏览器 UI。

## 目标

- 使用用户看到的同一种传输协议形态，从 GitHub issue 或 PR 复现 bug。
- 在应用修复前，基线 ref 上捕获一个 **before** artifact。
- 在应用修复后，候选 ref 上捕获一个 **after** artifact。
- 尽可能使用确定性的 oracle，例如 Discord REST reaction 读取或渠道 transcript 检查。
- 当 bug 具有可见 UI 表面时捕获截图。
- 从智能体控制的 CLI 本地运行，并从 GitHub 远程运行。
- 保留足够的机器状态，便于在登录、浏览器自动化或提供商凭证卡住时进行 VNC 救援。
- 当运行被阻塞、需要手动 VNC 帮助或完成时，向操作员 Discord 渠道发布简洁状态。

## 非目标

- Mantis 不是单元测试的替代品。理解修复后，一次 Mantis 运行通常应转化为更小的回归测试。
- Mantis 不是常规快速 CI gate。它更慢、使用实时凭证，并且只保留给实时环境有影响的 bug。
- Mantis 的正常运行不应需要人工介入。手动 VNC 是救援路径，不是理想路径。
- Mantis 不会在 artifacts、日志、截图、Markdown 报告或 PR 评论中存储原始 secret。

## 所有权

Mantis 位于 OpenClaw QA 栈中。

- OpenClaw 拥有 `pnpm openclaw qa mantis` 下的场景运行时、传输协议适配器、证据 schema 和本地 CLI。
- QA Lab 拥有实时传输协议 harness 组件、浏览器捕获辅助工具和 artifact writer。
- 当需要远程 VM 时，Crabbox 拥有预热的 Linux 机器。
- GitHub Actions 拥有远程 workflow 入口点和 artifact 保留。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、调度 workflow，并发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体通过 Codex 驱动 Mantis。

这个边界将传输协议知识保留在 OpenClaw 中，将机器调度保留在 Crabbox 中，并将维护者 workflow 胶水保留在 ClawSweeper 中。

## 命令形态

第一个本地命令会验证 Discord bot、guild、渠道、消息发送、reaction 发送以及 artifact 路径：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本地 before 和 after runner 接受如下形态：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner 会在输出目录下创建 detached baseline 和 candidate worktree，安装依赖，构建每个 ref，使用 `--allow-failures` 运行场景，然后写入 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md`。对于第一个 Discord 场景，成功验证意味着 baseline status 为 `fail`，candidate status 为 `pass`。

第二个 Discord before/after 探针面向 thread 附件：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

该场景会使用 driver bot 发布一条父消息，创建一个真实的 Discord thread，使用 repo-local `filePath` 调用 OpenClaw 的 `message.thread-reply` action，然后轮询 thread 以获取 SUT 回复和附件文件名。baseline 截图显示回复没有附件；candidate 截图显示预期的 `mantis-thread-report.md` 附件。

第一个 VM/浏览器原语是 desktop smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它会租用或复用一台 Crabbox 桌面机器，在 VNC 会话内启动可见浏览器，捕获桌面，将 artifacts 拉回本地输出目录，并把重新连接命令写入报告。该命令默认使用 Hetzner 提供商，因为它是 Mantis lane 中第一个具备可用 desktop/VNC 覆盖的提供商。针对其他 Crabbox fleet 运行时，可使用 `--provider`、`--crabbox-bin` 或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆盖。

有用的 desktop smoke 标志：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 会复用已预热的桌面。
- `--browser-url <url>` 会更改可见浏览器中打开的页面。
- `--html-file <path>` 会在可见浏览器中渲染 repo-local HTML artifact。Mantis 使用它通过真实 Crabbox 桌面捕获生成的 Discord status-reaction 时间线。
- `--browser-profile-dir <remote-path>` 会复用远程 Chrome user-data-dir，使持久化 Mantis 桌面可以在多次运行之间保持登录状态。将它用于长期存在的 Discord Web viewer profile。
- `--browser-profile-archive-env <name>` 会在启动浏览器前，从指定环境变量恢复 base64 `.tgz` Chrome user-data-dir archive。将它用于已登录的 witness，例如 Discord Web。默认环境变量是 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`。
- `--video-duration <seconds>` 控制 MP4 捕获时长。对于需要时间稳定下来的慢速已登录 Web 应用，请使用更长时长。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 会让新创建且通过的 lease 保持打开，以便进行 VNC 检查。失败运行在创建了 lease 时默认会保留该 lease，以便操作员重新连接。
- `--class`、`--idle-timeout` 和 `--ttl` 会调整机器规格和 lease 生命周期。

对于 Discord Web 证据，Mantis 使用专用 viewer 账号，而不是 bot token。实时 Discord API 场景仍然是 oracle：它创建真实 thread，发送 SUT `thread-reply`，并通过 Discord REST 检查附件。设置 `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` 时，场景还会写入一个 Discord Web URL artifact。设置 `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` 时，它会让该 thread 保留足够长的时间，以便已登录浏览器打开并录制它。

GitHub workflow 会在 Discord Web 中打开候选 thread URL，捕获截图，录制 MP4，并在 Crabbox 媒体工具可用时生成裁剪后的 GIF 预览。优先使用通过 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 配置的持久化 viewer profile 路径，因为完整 Chrome profile archive 可能超过 GitHub 的 secret 大小限制。对于较小或 bootstrap profile，workflow 也可以从 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 恢复 base64 `.tgz` archive。如果未配置任何 profile 来源，workflow 仍会发布确定性的 baseline/candidate 附件截图，并记录一条 notice，说明已跳过已登录 Discord Web witness。

第一个完整 desktop 传输协议原语是 Slack desktop smoke：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它会租用或复用一台 Crabbox 桌面机器，将当前 checkout 同步到 VM 中，在该 VM 内运行 `pnpm openclaw qa slack`，在 VNC 浏览器中打开 Slack Web，捕获可见桌面，并将 Slack QA artifacts 和 VNC 截图复制回本地输出目录。这是第一个让 SUT OpenClaw Gateway 网关和浏览器都位于同一个 Linux 桌面 VM 内的 Mantis 形态。

使用 `--gateway-setup` 时，该命令会在 `$HOME/.openclaw-mantis/slack-openclaw` 准备一个持久的可丢弃 OpenClaw home，为选定渠道 patch Slack Socket Mode 配置，在端口 `38973` 上启动 `openclaw gateway run`，并让 Chrome 在 VNC 会话中保持运行。这是“给我留一个运行着 Slack 和 claw 的 Linux 桌面”模式；省略 `--gateway-setup` 时，bot-to-bot Slack QA lane 仍是默认路径。

`--credential-source env` 的必需输入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 远程模型 lane 需要 `OPENCLAW_LIVE_OPENAI_KEY`。如果本地只设置了 `OPENAI_API_KEY`，Mantis 会在调用 Crabbox 前将它映射为 `OPENCLAW_LIVE_OPENAI_KEY`，从而让 Crabbox 的 `OPENCLAW_*` 环境变量转发可以将其带入 VM。

使用 `--gateway-setup --credential-source convex` 时，Mantis 会在创建 VM 前从共享池租用 Slack SUT credential，并将租用的渠道 id、Socket Mode app token 和 bot token 作为 desktop 内的 `OPENCLAW_MANTIS_SLACK_*` 运行时环境变量转发。这让 GitHub workflows 保持精简：它们只需要 Convex broker secret，而不需要原始 Slack bot 或 app token。

有用的 Slack desktop 标志：

- `--lease-id <cbx_...>` 会针对操作员已通过 VNC 登录 Slack Web 的机器重新运行。
- `--gateway-setup` 会在 VM 中启动持久化 OpenClaw Slack Gateway 网关，而不仅仅运行 bot-to-bot QA lane。
- `--keep-lease` 会在成功后保留 Gateway 网关 VM 以供 VNC 检查；`--no-keep-lease` 会在收集 artifacts 后停止它。
- `--slack-url <url>` 会打开指定 Slack Web URL。未提供时，如果 SUT bot token 可用，Mantis 会从 Slack `auth.test` 推导出 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 控制 gateway 设置使用的 Slack 渠道 allowlist。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 内的持久化 Chrome profile。默认值是 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手动 Slack Web 登录可以在同一 lease 上跨多次运行保留。
- `--credential-source convex --credential-role ci` 使用共享 credential pool，而不是直接 Slack 环境 token。
- `--provider-mode`、`--model`、`--alt-model` 和 `--fast` 会透传给 Slack live lane。

GitHub smoke workflow 是 `Mantis Discord Smoke`。第一个真实场景的 before 和 after GitHub workflow 是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期会复现 queued-only 行为的 ref。
- `candidate_ref`：预期会显示 `queued -> thinking -> done` 的 ref。

它会 checkout workflow harness ref，构建独立的 baseline 和 candidate worktree，针对每个 worktree 运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 上传为 Actions artifacts。它还会在 Crabbox 桌面浏览器中渲染每条 lane 的时间线 HTML，并在 PR 评论中把这些 VNC 截图与确定性的时间线 PNG 一起发布。同一条 PR 评论会嵌入由 `crabbox media preview` 生成的轻量 motion-trimmed GIF 预览，链接到匹配的 motion-trimmed MP4 片段，并保留完整 desktop MP4 文件以供深入检查。截图保持 inline，方便快速 review。该 workflow 会从 `openclaw/crabbox` main 构建 Crabbox CLI，以便在下一个 Crabbox binary release 发布前使用当前 desktop/browser lease 标志。

`Mantis Scenario` 是通用手动入口点。它接受 `scenario_id`、`candidate_ref`、可选的 `baseline_ref` 和可选的 `pr_number`，然后调度场景拥有的 workflow。这个 wrapper 有意保持精简：场景 workflow 仍然拥有自己的传输协议设置、credentials、VM class、预期 oracle 和 artifact manifest。

`Mantis Slack Desktop Smoke` 是第一个 Slack 虚拟机工作流。它会在单独的 worktree 中检出受信任的候选 ref，租用 Crabbox Linux 桌面，对该候选版本运行 `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`，在 VNC 浏览器中打开 Slack Web，录制桌面，用 `crabbox media preview` 生成经过运动裁剪的预览，上传完整 artifact 目录，并可选择在目标 PR 上发布内联证据评论。它默认使用 AWS 租用桌面，并暴露一个手动 provider 输入，让操作员在 AWS 容量缓慢或不可用时切换到 Hetzner。当你想要“一个运行着 Slack 和 claw 的 Linux 桌面”，而不只是 bot 到 bot 的 Slack transcript 时，请使用这条 lane。

每个 PR 发布场景都会在其报告旁写入 `mantis-evidence.json`。这个 schema 是场景代码与 GitHub 评论之间的交接格式：

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

Artifact 的 `path` 值相对于 manifest 目录。`targetPath` 值是 `qa-artifacts` 分支发布目录下的相对路径。publisher 会拒绝路径遍历，并在可选预览或视频不可用时跳过标记为 `"required": false` 的条目。

支持的 artifact 类型：

- `timeline`：确定性的场景截图，通常用于前后对比。
- `desktopScreenshot`：VNC/浏览器桌面截图。
- `motionPreview`：从桌面录制生成的内联动画 GIF。
- `motionClip`：经过运动裁剪的 MP4，会移除静态开头和结尾。
- `fullVideo`：用于深入检查的完整 MP4 录制。
- `metadata`：JSON/log sidecar。
- `report`：Markdown 报告。

可复用的 publisher 是 `scripts/mantis/publish-pr-evidence.mjs`。工作流会使用 manifest、目标 PR、`qa-artifacts` 目标根目录、评论 marker、Actions artifact URL、运行 URL 和请求来源来调用它。它会把声明的 artifact 复制到 `qa-artifacts` 分支，构建一个以摘要开头、包含内联图片/预览和链接视频的 PR 评论，然后更新现有 marker 评论或创建新评论。

你也可以直接从 PR 评论触发 status-reactions 运行：

```text
@Mantis discord status reactions
```

评论触发器有意保持范围狭窄。它只会在具有 write、maintain 或 admin 权限的用户发布的 pull request 评论上运行，并且只识别 Discord status-reaction 请求。默认情况下，它使用已知有问题的 baseline ref，并使用当前 PR head SHA 作为候选版本。维护者可以覆盖任一 ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一个命令是显式且面向场景的。第二个命令之后可以根据标签、变更文件和 ClawSweeper review 发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭证。
2. 分配或复用虚拟机。
3. 当场景需要 UI 证据时，准备桌面/浏览器 profile。
4. 为 baseline ref 准备干净的 checkout。
5. 安装依赖，并只构建该场景需要的内容。
6. 使用隔离的状态目录启动子 OpenClaw Gateway 网关。
7. 配置 live transport、provider、model 和浏览器 profile。
8. 运行场景并捕获 baseline 证据。
9. 停止 gateway 并保留日志。
10. 在同一台虚拟机中准备 candidate ref。
11. 运行相同场景并捕获 candidate 证据。
12. 比较 oracle 结果和视觉证据。
13. 写入 Markdown、JSON、日志、截图和可选 trace artifact。
14. 上传 GitHub Actions artifact。
15. 发布简洁的 PR 或 Discord status 消息。

场景应该能以两种不同方式失败：

- **复现了 bug**：baseline 以预期方式失败。
- **harness 失败**：环境设置、凭证、Discord API、浏览器或 provider 在 bug oracle 有意义之前失败。

最终报告必须区分这些情况，以免维护者把不稳定环境误认为产品行为。

## Discord MVP

第一个场景应该针对 guild channel 中的 Discord status reaction，其中源回复投递模式是 `message_tool_only`。

它适合作为 Mantis 种子场景的原因：

- 它在 Discord 中表现为触发消息上的 reaction，可见性强。
- 它通过 Discord 消息 reaction 状态提供强 REST oracle。
- 它会覆盖真实的 OpenClaw Gateway 网关、Discord bot auth、消息派发、源回复投递模式、status reaction 状态和 model turn 生命周期。
- 它足够狭窄，可以让第一版实现保持诚实。

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

Baseline 证据应显示 queued acknowledgement reaction，但在 tool-only 模式下没有生命周期转换。Candidate 证据应显示当 `messages.statusReactions.enabled` 显式为 true 时，生命周期 status reaction 会运行。

第一个可执行切片是 opt-in Discord live QA 场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

它使用 always-on guild handling、`visibleReplies: "message_tool"`、`ackReaction: "👀"` 和显式 status reaction 来配置 SUT。oracle 会轮询真实的 Discord 触发消息，并期望观察到序列 `👀 -> 🤔 -> 👍`。Artifact 包括 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应该基于现有私有 QA 栈构建，而不是从零开始：

- `pnpm openclaw qa discord` 已经运行一条带 driver 和 SUT bot 的 live Discord lane。
- live transport runner 已经会在 `.artifacts/qa-e2e/` 下写入报告和 observed-message artifact。
- Convex 凭证租约已经为共享 live transport 凭证提供独占访问。
- 浏览器控制服务已经支持截图、snapshot、headless managed profile 和远程 CDP profile。
- QA Lab 已经拥有用于 transport-shaped 测试的 debugger UI 和 bus。

第一个 Mantis 实现可以是在这些组件之上的轻量前后对比 runner，再加一个视觉证据层。

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

`mantis-summary.json` 应该是机器可读的事实来源。Markdown 报告用于 PR 评论和人工 review。

摘要必须包含：

- 测试的 ref 和 SHA
- transport 和场景 id
- 机器 provider 以及 machine id 或 lease id
- 不含 secret 值的凭证来源
- baseline 结果
- candidate 结果
- 该 bug 是否在 baseline 上复现
- candidate 是否修复了它
- artifact 路径
- 已清理的 setup 或 cleanup 问题

截图是证据，不是 secret。它们仍然需要遵守脱敏纪律：私有 channel 名称、用户名或消息内容可能会出现。对于公开 PR，在脱敏方案更完善之前，优先使用 GitHub Actions artifact 链接，而不是内联图片。

## 浏览器和 VNC

浏览器 lane 有两种模式：

- **Headless automation**：CI 默认模式。Chrome 启用 CDP 运行，并由 Playwright 或 OpenClaw 浏览器控制捕获截图。
- **VNC rescue**：当登录、MFA、Discord 反自动化或视觉调试需要人工介入时，在同一台虚拟机上启用。

Discord observer 浏览器 profile 应该足够持久，以避免每次运行都登录，但要与个人浏览器状态隔离。profile 属于 Mantis 机器池，不属于开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord status 消息，其中包含：

- run id
- scenario id
- machine provider
- artifact 目录
- VNC 或 noVNC 连接说明（如可用）
- 简短 blocker 文本

第一个私有部署可以把这些消息发布到现有 operator channel，之后再迁移到专用 Mantis channel。

## 机器

第一个远程实现中，Mantis 应该优先通过 Crabbox 使用 AWS。Crabbox 为我们提供预热机器、lease 跟踪、hydration、日志、结果和 cleanup。如果 AWS 容量太慢或不可用，可以在同一 machine interface 后添加 Hetzner provider。

最低虚拟机要求：

- Linux，并安装支持桌面的 Chrome 或 Chromium
- 用于浏览器自动化的 CDP 访问
- 用于 rescue 的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和依赖 cache
- 使用 Playwright 时的 Playwright Chromium 浏览器 cache
- 足够的 CPU 和内存，可运行一个 OpenClaw Gateway 网关、一个浏览器和一次 model run
- 可出站访问 Discord、GitHub、model provider 和凭证 broker

虚拟机不应在预期的凭证或浏览器 profile 存储之外保留长期存在的原始 secret。

## Secrets

远程运行的 secret 存放在 GitHub organization 或 repository secret 中，本地运行的 secret 存放在由本地 operator 控制的 secret 文件中。

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

长期来看，Convex 凭证池应继续作为 live transport 凭证的常规来源。GitHub secret 用于引导 broker 和 fallback lane。Discord status-reactions 工作流会把 Mantis Crabbox secret 映射回 Crabbox CLI 期望的 `CRABBOX_COORDINATOR` 和 `CRABBOX_COORDINATOR_TOKEN` 环境变量。普通的 `CRABBOX_*` GitHub secret 名称仍作为兼容性 fallback 被接受。

Mantis runner 绝不能打印：

- Discord bot token
- provider API key
- 浏览器 cookie
- auth profile 内容
- VNC 密码
- 原始凭证 payload

公开 artifact 上传还应脱敏 Discord 目标元数据，例如 bot、guild、channel 和 message id。因此，GitHub smoke 工作流会启用 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 被意外粘贴到 issue、PR、chat 或 log 中，请在新 secret 已存储后轮换它。

## GitHub Artifact 和 PR 评论

Mantis 工作流应将完整证据包上传为短期保留的 Actions 工件。当工作流针对错误报告或修复 PR 运行时，还应将已脱敏的 PNG 截图发布到 `qa-artifacts` 分支，并在该错误或修复 PR 上更新或插入一条评论，内联展示修复前/修复后截图。不要只把主要证明发布到通用 QA 自动化 PR 上。原始日志、观察到的消息和其他体量较大的证据保留在 Actions 工件中。

生产工作流应使用 Mantis GitHub App 发布这些评论，而不是使用 `github-actions[bot]`。将应用 ID 和私钥存储为 `MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions 密钥。工作流使用隐藏标记作为更新插入键，在令牌可以编辑时更新该评论；当较早的机器人所有标记无法编辑时，则创建一条由 Mantis 拥有的新评论。

PR 评论应简短且直观：

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

私有部署可能已经有一个 Mantis Discord 应用。如果该应用具备正确的机器人权限，并且可以安全轮换，请复用该应用，而不是创建另一个应用。

通过密钥或部署配置设置初始操作员通知渠道。它一开始可以指向现有维护者或运维渠道，等专用 Mantis 渠道存在后再迁移过去。

不要将公会 ID、渠道 ID、机器人令牌、浏览器 cookie 或 VNC 密码放入本文档。请将它们存储在 GitHub 密钥、凭证代理或操作员的本地密钥存储中。

## 添加场景

Mantis 场景应声明：

- ID 和标题
- 传输协议
- 所需凭证
- 基线引用策略
- 候选引用策略
- OpenClaw 配置补丁
- 设置步骤
- 激励输入
- 预期基线判定器
- 预期候选判定器
- 视觉捕获目标
- 超时预算
- 清理步骤

场景应优先使用小型、带类型的判定器：

- 用于反应错误的 Discord 反应状态
- 用于线程错误的 Discord 消息引用
- 用于 Slack 错误的 Slack 线程时间戳和反应 API 状态
- 用于电子邮件错误的电子邮件消息 ID 和标头
- 当 UI 是唯一可靠可观察对象时，使用浏览器截图

视觉检查应作为补充。如果平台 API 可以证明该错误，请使用 API 作为通过/失败判定器，并保留截图用于增强人工信心。

## 提供商扩展

在 Discord 之后，同一个运行器可以添加：

- Slack：反应、线程、应用提及、模态框、文件上传。
- 电子邮件：在连接器不足时，使用 `gog` 进行 Gmail 身份验证和消息线程处理。
- WhatsApp：二维码登录、重新识别、消息送达、媒体、反应。
- Telegram：群组提及门控、命令、可用时的反应。
- Matrix：加密房间、线程或回复关系、重启恢复。

每种传输协议都应有一个低成本冒烟场景，以及一个或多个错误类别场景。昂贵的视觉场景应保持为可选启用。

## 未决问题

- 复用现有 Mantis 机器人时，哪个 Discord 机器人应作为驱动方，哪个应作为被测系统？
- 观察者浏览器登录在第一阶段应使用真人 Discord 账号、测试账号，还是只使用机器人可读取的 REST 证据？
- GitHub 应为 PR 保留 Mantis 工件多长时间？
- ClawSweeper 应在何时自动推荐 Mantis，而不是等待维护者命令？
- 对于公开 PR，截图在上传前是否应脱敏或裁剪？
