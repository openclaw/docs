---
read_when:
    - 构建或运行 OpenClaw 缺陷的实时可视化 QA
    - 为拉取请求添加更改前和更改后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 为候选引用运行聚焦的 Control UI 浏览器验证
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行任务
summary: Mantis 为实时传输对比和仅针对候选版本的浏览器专项验证捕获可视化端到端证据，然后将工件附加到 PR。
title: Mantis
x-i18n:
    generated_at: "2026-07-16T11:34:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 48a1b306e37aba7e8c67139df61f3680a9aec066361aa196d88c81270337bc1b
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 为 OpenClaw 行为发布可视化 CI 证据和 PR 评论。
实时传输场景会将已知有问题的基线与候选 ref 进行比较；
聚焦的浏览器通道也可以改为针对确定性的模拟传输验证单个候选版本。
Discord 最先交付，支持真实 Bot 身份验证、服务器频道、表情回应、帖子和浏览器见证。
Slack、Telegram 和聚焦的 Control UI 聊天通道也已存在；WhatsApp 和 Matrix 尚未实现。

## 所有权

- OpenClaw（`extensions/qa-lab/src/mantis/*`）：场景运行时、`pnpm openclaw qa mantis <command>` CLI、证据架构。
- QA Lab（`extensions/qa-lab/src/live-transports/*`）：实时传输测试框架、驱动/SUT Bot、报告/证据写入器。
- Crabbox（`openclaw/crabbox`）：已预热的 Linux 计算机、租约、VNC、`crabbox media preview`。
- GitHub Actions（`.github/workflows/mantis-*.yml`）：远程入口点、工件保留。
- ClawSweeper：解析维护者 PR 命令、分派工作流并发布最终 PR 评论。

## CLI 命令

所有命令均为 `pnpm openclaw qa mantis <command>`，定义于
`extensions/qa-lab/src/mantis/cli.ts`。构建/运行时需要 `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
（内置工作流会在构建前设置 `OPENCLAW_BUILD_PRIVATE_QA=1` 和
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`）。

| 命令                            | 用途                                                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | 验证 Mantis Discord Bot 能否看到服务器/频道、发布消息并添加表情回应。                                                                                     |
| `run`                           | 针对基线和候选 ref 运行前后对比场景（仅限 Discord）。                                                                                                     |
| `desktop-browser-smoke`         | 租用/复用 Crabbox 桌面、打开可见浏览器并捕获屏幕截图和视频。                                                                                              |
| `slack-desktop-smoke`           | 租用/复用 Crabbox 桌面、在其中运行 Slack QA、打开 Slack Web 并捕获证据。                                                                                  |
| `telegram-desktop-builder`      | 租用/复用 Crabbox 桌面、安装 Telegram Desktop，并可选择配置 OpenClaw Gateway 网关。                                                                       |
| `visual-task` / `visual-driver` | 通用 Crabbox 桌面捕获，支持可选的图像理解断言；`visual-driver` 是在 `crabbox record --while` 下启动的驱动端。 |

每个命令都接受 `--repo-root <path>` 和 `--output-dir <path>`；Crabbox
命令还接受 `--crabbox-bin`、`--provider`、`--machine-class`/`--class`、
`--lease-id`、`--idle-timeout`、`--ttl` 和 `--keep-lease`。除非另有说明，provider/class 的本地 CLI 默认值
为 `hetzner`/`beast`；CI 工作流通常会覆盖这两个值。

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

调用 Discord REST API（`https://discord.com/api/v10`）获取 Bot
用户、服务器、服务器频道和目标频道，断言该
频道属于该服务器，然后（除非设置 `--skip-post`）发布一条消息并
添加 `👀` 表情回应。写入 `mantis-discord-smoke-summary.json` 和
`mantis-discord-smoke-report.md`。

令牌解析顺序：`--token-file` 值，然后是 `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
（使用 `--token-env` 覆盖），再然后是由 `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
指定名称的文件（使用 `--token-file-env` 覆盖）。服务器/频道 ID 来自
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID`（使用
`--guild-id` / `--channel-id` 覆盖），并且必须是 17-20 位的 Discord snowflake。设置
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` 可在发布的摘要和报告中将 Bot/服务器/频道/消息 ID
及名称替换为 `<redacted>`。

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

`--transport` 当前仅接受 `discord`。`--scenario` 是两个
内置 ID 之一，每个 ID 都有自己的默认基线 ref 和预期前后
标签（`extensions/qa-lab/src/mantis/run.runtime.ts`）：

| 场景                                       | 默认基线                                   | 基线预期                                 | 候选版本预期                 |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | 帖子回复省略 `filePath` 附件 | 帖子回复包含该附件           |

`--candidate` 默认为 `HEAD`。其他标志：`--credential-source`
（默认值为 `convex`）、`--credential-role`（默认值为 `ci`）、`--provider-mode`
（默认值为 `live-frontier`）、`--fast`（默认启用）、`--skip-install`、`--skip-build`。

运行器会在 `<output-dir>/worktrees/` 下为基线和
候选版本创建分离的 `git worktree` 检出，在
每个检出中运行 `pnpm install`/`pnpm build`（除非跳过），然后针对每个工作树运行
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`。
每个通道都会写入 `discord-qa-reaction-timelines.json`
以及一对 `<scenario-id>-timeline.html`/`.png`；运行器会将这些
证据复制回 `baseline/`/`candidate/` 下，在输出目录中写入 `comparison.json`、
`mantis-report.md` 和 `mantis-evidence.json`，并在比较未通过（基线
`fail`，候选版本 `pass`）时以非零状态退出。

第二个 Discord 场景（`discord-thread-reply-filepath-attachment`）使用
驱动 Bot 发布父消息、创建真实帖子、调用 SUT 的
`message.thread-reply` 操作并传入仓库本地的 `filePath`，然后轮询
帖子以查找回复和附件文件名。它预期存在名为
`mantis-thread-report.md` 的附件。

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

租用或复用 Crabbox 桌面，在 VNC 会话中启动浏览器，
使其指向 `--browser-url`（默认值为 `https://openclaw.ai`）或渲染后的
`--html-file`，等待后使用 `scrot` 截图，可选择使用
`ffmpeg` 录制 MP4，并通过 rsync 将 `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
同步回 `--output-dir`。

标志：

- `--lease-id <cbx_...>` 复用已预热的桌面，而不是创建新桌面。
- `--browser-profile-dir <remote-path>` 复用远程 Chrome 用户数据目录，使持久桌面在多次运行之间保持登录状态（用于长期存续的 Discord Web 查看器配置文件）。
- `--browser-profile-archive-env <name>` 在启动前从该环境变量恢复 base64 `.tgz` Chrome 配置文件归档（默认值为 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`）；用于 Discord Web 等已登录的见证端。
- `--video-duration <seconds>` 控制 MP4 捕获时长（默认 10 秒）。
- `--keep-lease`（或 `OPENCLAW_MANTIS_KEEP_VM=1`）让本次运行创建的租约保持开启，以便通过 VNC 检查；创建了租约的失败运行默认也会保留该租约。

对于 Discord Web 证据，Mantis 使用专用查看器账户，而不是 Bot
令牌。Discord REST 预言机（通过 `qa discord`）仍是权威依据；设置
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` 后，场景还会写入
Discord Web URL 工件，而 `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` 会让
帖子保持打开足够长的时间，以便浏览器打开它。

GitHub 工作流优先通过
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 使用持久查看器配置文件（完整配置文件归档可能超过
GitHub 的 Secret 大小限制）；对于小型/引导配置文件，也可以改为从 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 恢复
base64 `.tgz`。如果两种来源均未配置，工作流仍会发布确定性的
基线/候选版本屏幕截图，并记录已跳过登录状态见证。

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

租用或复用 Crabbox 桌面，将检出内容同步到虚拟机中，在其中运行
`pnpm openclaw qa slack`，在 VNC 浏览器中打开 Slack Web，
捕获桌面，并将 Slack QA 工件（`slack-qa/`）和
VNC 屏幕截图/视频复制回本地。这是唯一一种 SUT Gateway 网关与浏览器
都在同一虚拟机内运行的 Mantis 形态。

使用 `--gateway-setup` 时，该命令会在虚拟机的
`$HOME/.openclaw-mantis/slack-openclaw` 中创建持久的一次性 OpenClaw
主目录，为目标频道修补 Slack
Socket Mode 配置，启动
`openclaw gateway run --dev --allow-unconfigured --port 38973`，并让
Chrome 在 VNC 会话中保持运行；省略 `--gateway-setup` 时则运行常规的
Bot 到 Bot Slack QA 通道。

`--credential-source env` 所需的环境变量（本地默认值为 `env`；
角色默认值为 `maintainer`）：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` 用于远程模型通道（如果本地仅设置了 `OPENAI_API_KEY`，
  Mantis 会在调用 Crabbox 前将其复制到 `OPENCLAW_LIVE_OPENAI_KEY`）

使用 `--credential-source convex` 时，Mantis 会先从共享池租用 Slack SUT 凭据，
然后再创建虚拟机，并将频道 ID、应用令牌和 Bot
令牌作为 `OPENCLAW_MANTIS_SLACK_*` 环境变量转发到虚拟机中，因此 GitHub
工作流只需 Convex 代理 Secret，无需原始 Slack 令牌。

其他标志：`--slack-url <url>` 打开指定 URL（否则 Mantis 会根据
`auth.test` 推导 `https://app.slack.com/client/<team>/<channel>`）；
`--slack-channel-id <id>` 设置 Gateway 网关允许列表频道；
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制虚拟机内的持久 Chrome
配置文件（默认值为 `$HOME/.config/openclaw-mantis/slack-chrome-profile`）；
`--approval-checkpoints` 运行原生 Slack 审批场景
（`slack-approval-exec-native`、`slack-approval-plugin-native`），并渲染
待处理/已解决检查点屏幕截图，而不是执行 Gateway 网关设置（与
`--gateway-setup` 互斥）；`--hydrate-mode source|prehydrated`、
`--provider-mode`、`--model`、`--alt-model` 和 `--fast` 会透传到
Slack 实时通道。

审批检查点屏幕截图根据场景观察到的 Slack API 消息渲染，
而不是来自实时 Slack UI；仅当租约的浏览器配置文件已登录时，
`slack-desktop-smoke.png` 才能作为 Slack Web 本身的证据。

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

租用或复用 Crabbox 桌面、安装原生 Linux Telegram Desktop、
可选择恢复用户会话归档、使用租用的 Telegram SUT Bot 令牌配置 OpenClaw、启动
`openclaw gateway run --dev --allow-unconfigured --port 38974`、向租用的私有群组发布
驱动 Bot 就绪消息，然后捕获屏幕截图和 MP4。Bot 令牌仅用于配置 OpenClaw；
它绝不会让 Telegram Desktop 登录。桌面查看器是独立的 Telegram 用户会话，
可从 `--telegram-profile-archive-env <name>` 恢复，也可通过 VNC 手动登录，
并使用 `--keep-lease` 保持运行。

标志：`--lease-id <cbx_...>` 针对已登录
Telegram Desktop 的虚拟机重新运行；`--telegram-profile-archive-env <name>` 在启动前恢复 base64
`.tgz` 配置文件归档；`--telegram-profile-dir <remote-path>`
设置远程配置文件目录（默认值为 `$HOME/.local/share/TelegramDesktop`）；
`--no-gateway-setup` 仅安装并打开 Telegram Desktop；
`--credential-source`/`--credential-role` 的默认值为 `convex`/`maintainer`。

## 证据清单

每个发布到 PR 的场景都会在其报告旁写入 `mantis-evidence.json`：

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord 状态表情回应 QA",
  "summary": "用于 PR 评论的易读顶部摘要。",
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
      "label": "基线仅排队",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "基线 Discord 时间线",
      "width": 420
    }
  ]
}
```

工件 `path` 相对于清单所在目录；`targetPath` 相对于配置的 R2/S3 工件前缀。`scripts/mantis/publish-pr-evidence.mjs` 会拒绝路径遍历，并在文件缺失时跳过带有 `"required": false` 的条目。

工件类型：`timeline`（确定性的前后对比截图）、`desktopScreenshot`（VNC/浏览器截图）、`motionPreview`（录制内容中的内嵌动画 GIF）、`motionClip`（裁剪静止片段后的 MP4）、`fullVideo`（完整录制）、`metadata`（JSON/日志伴随文件）、`report`（Markdown 报告）。

一次运行的磁盘工件布局：

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

截图是证据，而不是密钥，但仍需遵守脱敏规范：其中可能会出现私有频道名称、用户名或消息内容。对于公开工件上传，请设置 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`；Discord/Slack/Telegram GitHub 工作流默认启用此设置。

## GitHub 自动化

`scripts/mantis/publish-pr-evidence.mjs` 是可复用的发布程序。工作流调用它时会传入清单、目标 PR、工件目标根目录、评论标记、工件 URL、运行 URL 和请求来源。它会将声明的工件上传到 Mantis R2 存储桶，构建一条摘要优先的 PR 评论，其中包含内嵌图片/预览和视频链接，然后更新已有的标记评论或创建一条新评论。所需环境变量：

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`（工作流设置 `openclaw-crabbox-artifacts`）
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`（工作流设置 `auto`）
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`（工作流设置 `https://artifacts.openclaw.ai`）

评论通过 Mantis GitHub App（`MANTIS_GITHUB_APP_ID` / `MANTIS_GITHUB_APP_PRIVATE_KEY`）发布，而不是通过 `github-actions[bot]`；它使用隐藏的标记评论作为更新或插入键。

| 工作流                          | 触发方式                                                                                    | 执行内容                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | 手动调度                                                                            | 针对所选引用运行 `discord-smoke`。                                                                                                                                                                                                                                                                       |
| `Mantis Discord Status Reactions` | PR 评论或手动调度                                                              | 构建独立的基线/候选工作树，分别在其中运行 `discord-status-reactions-tool-only`，在 Crabbox 桌面浏览器中渲染各通道的时间线，使用 `crabbox media preview` 生成裁剪静止片段后的 GIF/MP4 预览，上传工件，并发布内嵌 PR 证据。                                 |
| `Mantis Scenario`                 | 手动调度                                                                            | 通用调度器：接收 `scenario_id`（`discord-status-reactions-tool-only`、`discord-thread-reply-filepath-attachment`、`slack-desktop-smoke`、`telegram-live`、`telegram-desktop-proof`、`web-ui-chat-proof`）、`baseline_ref`、`candidate_ref`、`pr_number`，并转发到匹配的场景工作流。 |
| `Mantis Slack Desktop Smoke`      | 手动调度                                                                            | 租用一台 Crabbox Linux 桌面（默认为 `aws`，可选择 `hetzner`），针对候选版本运行 `slack-desktop-smoke --gateway-setup`，录制桌面，生成动态预览，上传工件，并在提供 PR 编号时发布 PR 证据。                                                      |
| `Mantis Telegram Live`            | PR 评论或手动调度                                                              | 运行 Bot API Telegram 实时 QA 通道（`openclaw qa telegram`），根据 QA 摘要写入 `mantis-evidence.json`，通过 Crabbox 桌面浏览器渲染已脱敏的证据 HTML，生成动态 GIF，并发布 PR 证据。此通道不需要登录 Telegram Web。                               |
| `Mantis Telegram Desktop Proof`   | 维护者 PR 标签（`mantis: telegram-visible-proof`）加 PR 评论，或手动调度 | Agent 驱动的原生 Telegram Desktop 前后对比证明。将 PR、基线/候选引用和维护者说明交给 Codex，由其为两个引用运行真实用户 Crabbox Telegram Desktop 证明通道，并发布一个双列 PR 证据表。                                                              |
| `Mantis Web UI Chat Proof`        | PR 评论或手动调度                                                              | 针对候选版本运行聚焦于 OpenClaw Control UI 聊天的 Playwright 证明，验证浏览器通过模拟的 Gateway 网关发送消息，捕获截图/视频工件，并发布 PR 证据。此通道仅用于 Web 聊天证明，不用于 WinUI/原生应用或任意视觉证明。                           |

`Mantis Discord Status Reactions` 和 `Mantis Telegram Live` 都接受 `baseline_ref`/`candidate_ref`（或 PR 评论中的 `baseline=`/`candidate=`），并在使用包含密钥的凭据运行前，验证解析出的 SHA 是 `origin/main` 的祖先、发布标签（`v*`），或开放 PR 的头部。

来自具有写入/维护/管理员权限的 PR 的评论触发命令：

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Telegram 评论触发命令默认使用 PR 头部 SHA 作为候选版本，并使用 `telegram-status-command` 作为场景；它们接受 `provider=aws|hetzner` 和 `lease=<cbx_...>`，以指定特定的 Crabbox 提供商或预热桌面。仅当 PR 已带有 `mantis: telegram-visible-proof` 标签时，`Mantis Telegram Desktop Proof` 才会响应 PR 评论。

Web UI 聊天评论触发命令默认使用 PR 头部 SHA 作为候选版本。它们运行 Control UI 的模拟 Gateway 网关聊天证明并发布浏览器工件；对于其他网页和原生应用界面，请使用普通 Playwright/浏览器证明、维护者截图、Crabbox 或本地工件。

ClawSweeper 也可以直接调度场景：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## 机器和密钥

本地 CLI Crabbox 默认为 `--provider hetzner --class beast`；可使用 `--provider`、`--class`/`--machine-class` 或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS` 覆盖。GitHub 工作流通常会同时覆盖两者（例如 `--class standard`，以及 Slack 工作流的 `aws`/`hetzner` 提供商选择输入）。如果某个提供商速度过慢或不可用，应在同一 Crabbox 接口后添加该提供商，而不是硬编码回退方案。

虚拟机基线：Linux，配备支持桌面的 Chrome/Chromium、CDP 访问、VNC/noVNC、Node 22.22.3+、24.15+ 或 25.9+ 及 pnpm、OpenClaw 检出，并且能够出站访问目标传输服务、GitHub、模型提供商和凭据代理。

Mantis 命令和工作流中使用的凭据及环境变量名称：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- 本地 `qa mantis run --credential-source env` 还需要
  `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
  和 `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`。GitHub 工作流通常使用
  `--credential-source convex` 和下方的代理凭据，而不是原始
  Discord Bot 令牌。
- 用于公开工件上传的 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`、`OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENAI_API_KEY`（或 Telegram Desktop 证明专用的
  `OPENCLAW_MANTIS_AGENT_OPENAI_API_KEY`）
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN`（工作流也接受
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` 作为回退，并在调用 Crabbox
  前将其映射为普通名称）
- `CRABBOX_ACCESS_CLIENT_ID`、`CRABBOX_ACCESS_CLIENT_SECRET`
- `MANTIS_GITHUB_APP_ID`、`MANTIS_GITHUB_APP_PRIVATE_KEY`

Mantis 运行程序绝不能打印 Discord/Slack/Telegram Bot 令牌、提供商 API 密钥、浏览器 Cookie、身份验证配置文件内容、VNC 密码或原始凭据载荷。如果令牌泄露到议题、PR、聊天或日志中，请在存储替换密钥后轮换该令牌。

## 运行结果

前后对比传输场景会区分以下结果，以避免将不稳定环境误判为产品回归：

- **已复现缺陷**：基线以场景预期的方式失败。
- **测试框架失败**：在判定条件具备意义之前，环境设置、凭据、传输 API、浏览器或提供商失败。

仅候选版本的浏览器证明会报告候选版本是否通过模拟 Gateway 网关和可见 UI 断言；它不会声称已复现基线问题。

## 添加场景

实时传输场景按传输服务使用 TypeScript 定义（Discord 前后对比结构参见 `extensions/qa-lab/src/mantis/run.runtime.ts` 中的 `MANTIS_SCENARIO_CONFIGS`），而不是采用独立的声明式文件格式。每个场景需要：ID 和标题、传输服务、所需凭据、基线引用策略、候选引用策略、OpenClaw 配置补丁、设置/刺激步骤、预期的基线和候选判定条件、视觉捕获目标、超时预算和清理步骤。

聚焦于仅候选版本的浏览器证明可以使用专用的确定性 E2E 测试和工作流。明确限定其范围，在执行前验证候选引用，隔离使用密钥的发布过程，并输出相同的证据清单契约。

应优先使用小型、有类型的判定条件，而不是视觉检查：Discord 表情回应状态或消息引用、Slack 线程 `ts`/表情回应 API 状态、电子邮件消息 ID 和标头。仅当 UI 是唯一可靠的可观察对象时才使用浏览器截图；如果存在平台 API 判定条件，应将视觉检查作为其补充。

继 Discord、Slack 和 Telegram 之后，同一运行程序结构还可扩展到 WhatsApp（二维码登录、重新识别、送达、媒体、表情回应）和 Matrix（加密房间、线程/回复关系、重启后恢复）；两者目前均未实现。

## 待解决问题

- 复用现有 Mantis Bot 时，哪个 Discord Bot 应作为驱动端，哪个应作为被测系统（SUT）？
- 对于 PR，GitHub 应将 Mantis 工件保留多长时间？
- ClawSweeper 应在何时自动推荐 Mantis 场景，而不是等待维护者命令？
- 对于公开 PR，上传前是否应对截图进行脱敏或裁剪？
