---
read_when:
    - 为 OpenClaw 缺陷构建或运行实时可视化 QA
    - 为拉取请求添加变更前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是可视化端到端验证系统，用于在实时传输协议上复现 OpenClaw 缺陷、捕获前后对比证据，并将产物附加到 PR。
title: Mantis
x-i18n:
    generated_at: "2026-05-05T10:24:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f845ad3f19b88a9a398b43bd8bdfda8c7c2043733e30e7fcef1bf6ee0343c65
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 的端到端验证系统，面向需要真实
运行时、真实传输协议和可见证据的错误。它会针对一个已知的
错误 ref 运行场景、捕获证据，再针对候选 ref 运行同一场景，并将
对比结果发布为产物，供维护者从 PR 或本地命令中检查。

Mantis 从 Discord 开始，因为 Discord 为我们提供了高价值的第一条验证路径：
真实机器人认证、真实公会频道、反应、线程、原生命令，以及一个
人类可以直观看到传输协议显示内容的浏览器 UI。

## 目标

- 使用用户看到的同类传输协议形态，从 GitHub issue 或 PR 复现错误。
- 在应用修复前，在基线 ref 上捕获一个 **before** 产物。
- 在应用修复后，在候选 ref 上捕获一个 **after** 产物。
- 尽可能使用确定性的判定器，例如 Discord REST 反应读取或频道转录检查。
- 当错误具有可见 UI 表面时捕获截图。
- 从智能体控制的 CLI 在本地运行，也能从 GitHub 远程运行。
- 在登录、浏览器自动化或提供商认证卡住时，保留足够的机器状态以便 VNC 救援。
- 当运行被阻塞、需要手动 VNC 帮助或完成时，向操作员 Discord 频道发布简洁状态。

## 非目标

- Mantis 不是单元测试的替代品。理解修复后，一次 Mantis 运行通常应转化为更小的回归测试。
- Mantis 不是普通的快速 CI 门禁。它更慢、使用实时凭证，并且只用于实时环境很重要的错误。
- Mantis 在正常运行时不应需要人类参与。手动 VNC 是救援路径，而不是理想路径。
- Mantis 不会在产物、日志、截图、Markdown 报告或 PR 评论中存储原始密钥。

## 所有权

Mantis 位于 OpenClaw QA 栈中。

- OpenClaw 拥有场景运行时、传输协议适配器、证据 schema，以及 `pnpm openclaw qa mantis` 下的本地 CLI。
- QA Lab 拥有实时传输协议 harness 组件、浏览器捕获辅助工具和产物写入器。
- 当需要远程 VM 时，Crabbox 拥有预热的 Linux 机器。
- GitHub Actions 拥有远程工作流入口点和产物保留。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、分发工作流，并发布最终 PR 评论。
- 当场景需要智能体式设置、调试或卡住状态报告时，OpenClaw 智能体通过 Codex 驱动 Mantis。

此边界将传输协议知识保留在 OpenClaw 中，将机器调度保留在
Crabbox 中，并将维护者工作流粘合逻辑保留在 ClawSweeper 中。

## 命令形态

第一个本地命令会验证 Discord 机器人、公会、频道、消息发送、
反应发送和产物路径：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本地 before 和 after 运行器接受此形态：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

运行器会在输出目录下创建分离的基线和候选 worktree、安装依赖、
构建每个 ref、使用 `--allow-failures` 运行场景，然后写入 `baseline/`、`candidate/`、`comparison.json`
和 `mantis-report.md`。对于第一个 Discord 场景，成功验证意味着
基线状态为 `fail`，候选状态为 `pass`。

第一个 VM/浏览器原语是桌面 smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它会租用或复用一台 Crabbox 桌面机器，在 VNC 会话中启动可见浏览器，
捕获桌面，将产物拉回本地输出目录，并将重连命令写入报告。该命令默认
使用 Hetzner 提供商，因为它是 Mantis 验证路径中第一个具备可用桌面/VNC
覆盖的提供商。在针对另一套 Crabbox 机群运行时，可用 `--provider`、`--crabbox-bin`
或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆盖。

有用的桌面 smoke 标志：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 会复用已预热的桌面。
- `--browser-url <url>` 会更改可见浏览器中打开的页面。
- `--html-file <path>` 会在可见浏览器中渲染仓库本地 HTML 产物。Mantis 用它通过真实 Crabbox 桌面捕获生成的 Discord 状态反应时间线。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 会让新创建且通过的租约保持打开，供 VNC 检查。失败运行默认会保留新创建的租约，以便操作员重新连接。
- `--class`、`--idle-timeout` 和 `--ttl` 会调整机器大小和租约生命周期。

第一个完整桌面传输协议原语是 Slack 桌面 smoke：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它会租用或复用一台 Crabbox 桌面机器，将当前 checkout 同步到
VM 中，在该 VM 内运行 `pnpm openclaw qa slack`，在 VNC 浏览器中打开 Slack Web，
捕获可见桌面，并将 Slack QA 产物和 VNC 截图都复制回本地输出目录。
这是第一个 SUT OpenClaw Gateway 网关和浏览器都位于同一台
Linux 桌面 VM 内的 Mantis 形态。

使用 `--gateway-setup` 时，该命令会在 `$HOME/.openclaw-mantis/slack-openclaw`
准备一个持久的一次性 OpenClaw home，为所选频道修补 Slack Socket Mode
配置，在端口 `38973` 上启动 `openclaw gateway run`，并让 Chrome 在 VNC
会话中保持运行。这是“留给我一个运行着 Slack 和一个 claw 的 Linux 桌面”模式；
当省略 `--gateway-setup` 时，默认仍然是机器人到机器人 Slack QA 验证路径。

`--credential-source env` 的必需输入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 远程模型验证路径需要 `OPENCLAW_LIVE_OPENAI_KEY`。如果本地只设置了
  `OPENAI_API_KEY`，Mantis 会在调用 Crabbox 前将其映射到 `OPENCLAW_LIVE_OPENAI_KEY`，
  这样 Crabbox 的 `OPENCLAW_*` 环境变量转发就能把它带入 VM。

使用 `--gateway-setup --credential-source convex` 时，Mantis 会在创建 VM
之前从共享池租用 Slack SUT 凭证，并将租用的频道 ID、Socket Mode 应用
token 和机器人 token 作为桌面内的 `OPENCLAW_MANTIS_SLACK_*` 运行时环境变量转发。
这让 GitHub 工作流保持轻量：它们只需要 Convex 代理密钥，而不需要原始 Slack
机器人或应用 token。

有用的 Slack 桌面标志：

- `--lease-id <cbx_...>` 会针对操作员已经通过 VNC 登录 Slack Web 的机器重新运行。
- `--gateway-setup` 会在 VM 中启动持久 OpenClaw Slack Gateway 网关，而不是只运行机器人到机器人 QA 验证路径。
- `--keep-lease` 会在成功后保持 Gateway 网关 VM 打开，以供 VNC 检查；`--no-keep-lease` 会在收集产物后停止它。
- `--slack-url <url>` 会打开特定 Slack Web URL。不提供时，如果 SUT 机器人 token 可用，Mantis 会从 Slack `auth.test` 推导 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 控制 Gateway 网关设置使用的 Slack 频道 allowlist。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 内的持久 Chrome profile。默认值为 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手动 Slack Web 登录可在同一租约的重运行中保留。
- `--credential-source convex --credential-role ci` 使用共享凭证池，而不是直接的 Slack 环境变量 token。
- `--provider-mode`、`--model`、`--alt-model` 和 `--fast` 会透传给 Slack 实时验证路径。

GitHub smoke 工作流是 `Mantis Discord Smoke`。第一个真实场景的 before 和 after
GitHub 工作流是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期会复现仅 queued 行为的 ref。
- `candidate_ref`：预期会显示 `queued -> thinking -> done` 的 ref。

它会 checkout 工作流 harness ref，构建分离的基线和候选 worktree，
在每个 worktree 上运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、
`comparison.json` 和 `mantis-report.md` 作为 Actions 产物上传。它还会在 Crabbox
桌面浏览器中渲染每条验证路径的时间线 HTML，并在 PR 评论中将这些 VNC 截图发布在确定性
时间线 PNG 旁边。同一条 PR 评论会嵌入由 `crabbox media preview` 生成的轻量级
运动裁剪 GIF 预览，链接到对应的运动裁剪 MP4 片段，并保留完整桌面 MP4 文件以供深入检查。
截图会保持内联，便于快速审查。该工作流会从
`openclaw/crabbox` main 构建 Crabbox CLI，以便在下一次 Crabbox 二进制发布前使用当前的桌面/浏览器租约标志。

`Mantis Scenario` 是通用手动入口点。它接受 `scenario_id`、`candidate_ref`、
可选 `baseline_ref` 和可选 `pr_number`，然后分发给场景拥有的工作流。该包装器有意保持轻薄：
场景工作流仍然拥有自己的传输协议设置、凭证、VM class、预期判定器和产物清单。

`Mantis Slack Desktop Smoke` 是第一个 Slack VM 工作流。它会在独立 worktree 中 checkout
受信任的候选 ref，租用一台 Crabbox Linux 桌面，针对该候选运行
`pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`，在 VNC 浏览器中打开 Slack Web，
录制桌面，使用 `crabbox media preview` 生成运动裁剪预览，上传完整产物目录，并可选地在目标 PR
上发布内联证据评论。它默认使用 AWS 进行桌面租约，并公开一个手动提供商输入，让操作员在 AWS
容量缓慢或不可用时切换到 Hetzner。当你想要“一个运行着 Slack 和一个 claw 的 Linux 桌面”，而不是仅有机器人到机器人 Slack 转录时，使用这条验证路径。

每个发布到 PR 的场景都会在其报告旁写入 `mantis-evidence.json`。
此 schema 是场景代码和 GitHub 评论之间的交接：

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

产物 `path` 值是相对于清单目录的路径。`targetPath` 值是相对于 `qa-artifacts`
分支发布目录的路径。发布器会拒绝路径遍历，并在可选预览或视频不可用时跳过标记为
`"required": false` 的条目。

支持的产物类型：

- `timeline`：确定性的场景截图，通常为 before/after。
- `desktopScreenshot`：VNC/浏览器桌面截图。
- `motionPreview`：从桌面录制生成的内联动画 GIF。
- `motionClip`：移除静态开头和结尾的运动裁剪 MP4。
- `fullVideo`：用于深入检查的完整 MP4 录制。
- `metadata`：JSON/日志附属文件。
- `report`：Markdown 报告。

可复用发布器是 `scripts/mantis/publish-pr-evidence.mjs`。工作流
会用清单、目标 PR、`qa-artifacts` 目标根目录、评论标记、
Actions 工件 URL、运行 URL 和请求来源来调用它。它会将声明的工件复制
到 `qa-artifacts` 分支，构建摘要优先的 PR 评论，其中包含内联
图片/预览和已链接的视频，然后更新现有标记评论或创建一个新评论。

你也可以直接从 PR 评论触发状态反应运行：

```text
@Mantis discord status reactions
```

评论触发器刻意保持窄范围。它只会在具有写入、维护或管理员访问权限的用户
发布的拉取请求评论上运行，并且只识别 Discord 状态反应请求。默认情况下，
它使用已知错误的基线 ref 和当前 PR head SHA 作为候选。维护者可以覆盖任一
ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一个命令是显式且聚焦场景的。第二个命令之后可以根据标签、已更改文件和
ClawSweeper 评审发现，将 PR 或 issue 映射到推荐的 Mantis 场景。

## 运行生命周期

1. 获取凭证。
2. 分配或复用一个 VM。
3. 当场景需要 UI 证据时，准备桌面/浏览器配置文件。
4. 为基线 ref 准备一个干净的 checkout。
5. 安装依赖，并且只构建场景需要的内容。
6. 使用隔离的状态目录启动子 Gateway 网关。
7. 配置实时传输、提供商、模型和浏览器配置文件。
8. 运行场景并捕获基线证据。
9. 停止 Gateway 网关并保留日志。
10. 在同一个 VM 中准备候选 ref。
11. 运行同一场景并捕获候选证据。
12. 比较 oracle 结果和视觉证据。
13. 写入 Markdown、JSON、日志、截图和可选 trace 工件。
14. 上传 GitHub Actions 工件。
15. 发布简洁的 PR 或 Discord 状态消息。

场景应该能够以两种不同方式失败：

- **已复现 bug**：基线按预期方式失败。
- **Harness 失败**：环境设置、凭证、Discord API、浏览器或
  提供商在 bug oracle 具备意义之前失败。

最终报告必须区分这些情况，以免维护者将不稳定环境与产品行为混淆。

## Discord MVP

第一个场景应面向群组频道中的 Discord 状态反应，其中源回复投递模式为
`message_tool_only`。

它是一个优秀 Mantis 起点的原因：

- 它在 Discord 中可见，会作为触发消息上的反应显示。
- 它通过 Discord 消息反应状态提供强 REST oracle。
- 它会覆盖真实 Gateway 网关、Discord bot 凭证、消息调度、
  源回复投递模式、状态反应状态和模型轮次生命周期。
- 它的范围足够窄，可以让第一版实现保持诚实。

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

基线证据应显示已排队的确认反应，但在仅工具模式下没有生命周期转换。候选
证据应显示当 `messages.statusReactions.enabled` 被显式设置为 true 时，
生命周期状态反应会运行。

可执行的第一阶段是可选启用的 Discord 实时 QA 场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

它会将 SUT 配置为始终启用的群组处理、`visibleReplies:
"message_tool"`、`ackReaction: "👀"` 和显式状态反应。oracle
会轮询真实的 Discord 触发消息，并期望观察到序列
`👀 -> 🤔 -> 👍`。工件包括 `discord-qa-reaction-timelines.json`、
`discord-status-reactions-tool-only-timeline.html` 和
`discord-status-reactions-tool-only-timeline.png`。

## 现有 QA 组件

Mantis 应建立在现有私有 QA 栈之上，而不是从零开始：

- `pnpm openclaw qa discord` 已经会运行带有 driver 和 SUT bot 的实时
  Discord lane。
- 实时传输运行器已经会在 `.artifacts/qa-e2e/` 下写入报告和观测消息
  工件。
- Convex 凭证租约已经为共享实时传输凭证提供独占访问。
- 浏览器控制服务已经支持截图、快照、无头托管配置文件和远程 CDP
  配置文件。
- QA Lab 已经有用于传输形态测试的调试器 UI 和总线。

第一版 Mantis 实现可以是在这些组件之上提供一个轻量的前后对比运行器，再
加上一层视觉证据。

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

`mantis-summary.json` 应该是机器可读的事实来源。Markdown 报告用于
PR 评论和人工评审。

摘要必须包含：

- 已测试的 refs 和 SHAs
- 传输和场景 id
- 机器提供商和机器 id 或租约 id
- 不含密钥值的凭证来源
- 基线结果
- 候选结果
- bug 是否在基线上复现
- 候选是否修复了它
- 工件路径
- 已清理的设置或清理问题

截图是证据，不是密钥。它们仍然需要遵守脱敏纪律：私有频道名称、用户名或
消息内容可能会出现。对于公开 PR，在脱敏方案更成熟之前，优先使用
GitHub Actions 工件链接，而不是内联图片。

## 浏览器和 VNC

浏览器 lane 有两种模式：

- **无头自动化**：CI 的默认模式。Chrome 在启用 CDP 的情况下运行，并由
  Playwright 或 OpenClaw 浏览器控制捕获截图。
- **VNC 救援**：当登录、MFA、Discord 反自动化或视觉调试需要人工介入时，
  在同一个 VM 上启用。

Discord 观察者浏览器配置文件应足够持久，以避免每次运行都登录，但要与个人
浏览器状态隔离。配置文件属于 Mantis 机器池，而不是开发者笔记本电脑。

当 Mantis 卡住时，它会发布一条 Discord 状态消息，包含：

- 运行 id
- 场景 id
- 机器提供商
- 工件目录
- VNC 或 noVNC 连接说明（如果可用）
- 简短的阻塞说明

第一版私有部署可以先将这些消息发布到现有 operator 频道，之后再迁移到专用
Mantis 频道。

## 机器

Mantis 在第一版远程实现中应优先通过 Crabbox 使用 AWS。Crabbox 为我们提供
已预热机器、租约跟踪、hydration、日志、结果和清理。如果 AWS 容量太慢或
不可用，则在同一机器接口后添加 Hetzner 提供商。

最低 VM 要求：

- Linux，安装了支持桌面的 Chrome 或 Chromium
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够的 CPU 和内存，可支撑一个 Gateway 网关、一个浏览器和一次模型运行
- 可出站访问 Discord、GitHub、模型提供商和凭证 broker

VM 不应在预期凭证或浏览器配置文件存储之外保留长期存在的原始密钥。

## 密钥

远程运行的密钥存放在 GitHub 组织或仓库密钥中，本地运行的密钥存放在本地
operator 控制的密钥文件中。

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

长期来看，Convex 凭证池应继续作为实时传输凭证的常规来源。GitHub 密钥用于
引导 broker 和 fallback lane。Discord 状态反应工作流会将 Mantis Crabbox
密钥映射回 Crabbox CLI 期望的 `CRABBOX_COORDINATOR` 和
`CRABBOX_COORDINATOR_TOKEN` 环境变量。普通的 `CRABBOX_*` GitHub 密钥名称
仍会作为兼容性 fallback 被接受。

Mantis 运行器绝不能打印：

- Discord bot token
- 提供商 API key
- 浏览器 cookie
- 凭证配置文件内容
- VNC 密码
- 原始凭证 payload

公开工件上传还应脱敏 Discord 目标元数据，例如 bot、群组、频道和消息 id。
GitHub smoke 工作流因此启用了 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 被意外粘贴到 issue、PR、聊天或日志中，在新密钥已存储后轮换它。

## GitHub 工件和 PR 评论

Mantis 工作流应将完整证据包作为短期 Actions 工件上传。当工作流为 bug
报告或修复 PR 运行时，它还应将脱敏后的 PNG 截图发布到 `qa-artifacts`
分支，并在该 bug 或修复 PR 上 upsert 一条评论，包含内联前后截图。不要只
在通用 QA 自动化 PR 上发布主要证明。原始日志、观测消息和其他体积较大的
证据保留在 Actions 工件中。

生产工作流应使用 Mantis GitHub App 发布这些评论，而不是使用
`github-actions[bot]`。将 app id 和私钥作为 `MANTIS_GITHUB_APP_ID` 和
`MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions 密钥存储。工作流使用隐藏
标记作为 upsert key，在 token 可以编辑时更新该评论；当较旧的 bot 所有的
标记无法编辑时，创建新的 Mantis 所有评论。

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

私有部署可能已经有一个 Mantis Discord 应用。当该应用具备正确的 bot 权限并
且可以安全轮换时，复用该应用，而不是创建另一个 app。

通过密钥或部署配置设置初始 operator 通知频道。它可以先指向现有维护者或运维
频道，然后在专用 Mantis 频道存在后迁移过去。

不要在本文档中放入群组 id、频道 id、bot token、浏览器 cookie 或 VNC 密码。
将它们存储在 GitHub 密钥、凭证 broker 或 operator 的本地密钥存储中。

## 添加场景

Mantis 场景应声明：

- id 和标题
- 传输协议
- 必需凭证
- 基线 ref 策略
- 候选 ref 策略
- OpenClaw 配置补丁
- 设置步骤
- 触发输入
- 预期基线判定依据
- 预期候选判定依据
- 视觉捕获目标
- 超时预算
- 清理步骤

场景应优先使用小型、类型化的判定依据：

- 用于回应 bug 的 Discord 回应状态
- 用于线程 bug 的 Discord 消息引用
- 用于 Slack bug 的 Slack 线程 ts 和 reaction API 状态
- 用于邮件 bug 的邮件消息 id 和标头
- 当 UI 是唯一可靠可观测项时使用浏览器截图

视觉检查应作为补充。如果平台 API 能证明该 bug，则使用该
API 作为通过/失败判定依据，并保留截图用于增强人工信心。

## 提供商扩展

在 Discord 之后，同一运行器可以添加：

- Slack：回应、线程、应用提及、模态框、文件上传。
- 电子邮件：当连接器不足时，使用 `gog` 进行 Gmail 认证和消息线程处理。
- WhatsApp：二维码登录、重新识别、消息送达、媒体、回应。
- Telegram：群组提及门控、命令、可用时的回应。
- Matrix：加密房间、线程或回复关系、重启后恢复。

每种传输协议都应有一个低成本冒烟场景，以及一个或多个 bug 类别
场景。昂贵的视觉场景应保持为可选启用。

## 待解决问题

- 复用现有 Mantis 机器人时，哪个 Discord 机器人应作为驱动，哪个应作为 SUT？
- 观察者浏览器登录在第一阶段应使用真人 Discord 账号、测试账号，
  还是只使用机器人可读取的 REST 证据？
- GitHub 应为 PR 保留 Mantis 工件多久？
- ClawSweeper 什么时候应自动推荐 Mantis，而不是等待维护者命令？
- 为公开 PR 上传前，截图是否应进行脱敏或裁剪？
