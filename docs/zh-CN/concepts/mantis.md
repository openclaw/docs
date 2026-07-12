---
read_when:
    - 构建或运行 OpenClaw 缺陷的实时可视化 QA
    - 为拉取请求添加前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 为候选引用运行聚焦的 Control UI 浏览器验证
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行任务
summary: Mantis 为实时传输对比和仅针对候选版本的浏览器专项验证捕获可视化端到端证据，然后将产物附加到 PR。
title: Mantis
x-i18n:
    generated_at: "2026-07-11T20:27:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86b65ae8503b23407b600aa08f16940f9fcaa9a4e598963f7f878a3b336784f0
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 会发布 OpenClaw 行为的可视化 CI 证据和 PR 评论。
实时传输场景会将已知有问题的基线与候选引用进行比较；
聚焦的浏览器通道也可以改为针对确定性的
模拟传输协议验证单个候选版本。Discord 最先交付，支持真实 Bot 身份验证、服务器频道、
表情回应、帖子串和浏览器见证。Slack、Telegram 以及聚焦的 Control
UI 聊天通道也已存在；WhatsApp 和 Matrix 尚未实现。

## 所有权

- OpenClaw（`extensions/qa-lab/src/mantis/*`）：场景运行时、`pnpm openclaw qa mantis <command>` CLI、证据架构。
- QA Lab（`extensions/qa-lab/src/live-transports/*`）：实时传输协议测试框架、驱动程序/SUT Bot、报告/证据写入器。
- Crabbox（`openclaw/crabbox`）：预热的 Linux 机器、租约、VNC、`crabbox media preview`。
- GitHub Actions（`.github/workflows/mantis-*.yml`）：远程入口点、制品保留。
- ClawSweeper：解析维护者 PR 命令、分派工作流、发布最终 PR 评论。

## CLI 命令

所有命令均采用 `pnpm openclaw qa mantis <command>` 格式，并在
`extensions/qa-lab/src/mantis/cli.ts` 中定义。构建/运行时需要 `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
（内置工作流会在构建前设置 `OPENCLAW_BUILD_PRIVATE_QA=1` 和
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`）。

| 命令                            | 用途                                                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | 验证 Mantis Discord Bot 能够看到服务器/频道、发帖并添加表情回应。                                                                                         |
| `run`                           | 针对基线和候选引用运行前后对比场景（仅限 Discord）。                                                                                                      |
| `desktop-browser-smoke`         | 租用/复用 Crabbox 桌面，打开可见浏览器，捕获屏幕截图和视频。                                                                                              |
| `slack-desktop-smoke`           | 租用/复用 Crabbox 桌面，在其中运行 Slack QA，打开 Slack Web 并捕获证据。                                                                                  |
| `telegram-desktop-builder`      | 租用/复用 Crabbox 桌面，安装 Telegram Desktop，并可选择配置 OpenClaw Gateway 网关。                                                                       |
| `visual-task` / `visual-driver` | 通用 Crabbox 桌面捕获，可选择执行图像理解断言；`visual-driver` 是在 `crabbox record --while` 下启动的驱动程序部分。                                        |

每条命令均接受 `--repo-root <path>` 和 `--output-dir <path>`；Crabbox
命令还接受 `--crabbox-bin`、`--provider`、`--machine-class`/`--class`、
`--lease-id`、`--idle-timeout`、`--ttl` 和 `--keep-lease`。除非另有说明，本地 CLI 的
提供商/类别默认为 `hetzner`/`beast`；CI 工作流通常会覆盖两者。

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

调用 Discord REST API（`https://discord.com/api/v10`）获取 Bot
用户、服务器、服务器频道及目标频道，断言该
频道属于该服务器，然后（除非指定 `--skip-post`）发布消息并
添加 `👀` 表情回应。写入 `mantis-discord-smoke-summary.json` 和
`mantis-discord-smoke-report.md`。

令牌解析顺序：`--token-file` 的值，然后是 `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
（可用 `--token-env` 覆盖），然后是由 `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
指定的文件（可用 `--token-file-env` 覆盖）。服务器/频道 ID 来自
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID`（可用
`--guild-id` / `--channel-id` 覆盖），且必须是 17 至 20 位的 Discord 雪花 ID。设置
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`，可在发布的摘要和报告中将 Bot/服务器/频道/消息 ID
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
内置 ID 之一，每个 ID 都有自己的默认基线引用和预期前后
标签（`extensions/qa-lab/src/mantis/run.runtime.ts`）：

| 场景                                       | 默认基线                                   | 基线预期                                 | 候选版本预期                 |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | 帖子串回复省略 `filePath` 附件           | 帖子串回复包含该附件         |

`--candidate` 默认为 `HEAD`。其他标志：`--credential-source`
（默认值为 `convex`）、`--credential-role`（默认值为 `ci`）、`--provider-mode`
（默认值为 `live-frontier`）、`--fast`（默认启用）、`--skip-install`、`--skip-build`。

运行器会在 `<output-dir>/worktrees/` 下为基线和
候选版本创建分离的 `git worktree` 检出，在
每个检出中运行 `pnpm install`/`pnpm build`（除非跳过），然后针对每个工作树运行
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`。
每个通道都会写入 `discord-qa-reaction-timelines.json`
以及一对 `<scenario-id>-timeline.html`/`.png` 文件；运行器会将这些
证据复制回 `baseline/`/`candidate/` 下，并在输出目录中写入
`comparison.json`、`mantis-report.md` 和 `mantis-evidence.json`；
如果比较未通过（基线为 `fail` 且候选版本为
`pass`），则以非零状态退出。

第二个 Discord 场景（`discord-thread-reply-filepath-attachment`）使用
驱动 Bot 发布父消息，创建真实帖子串，使用仓库本地的 `filePath`
调用 SUT 的 `message.thread-reply` 操作，然后轮询
帖子串以查找回复和附件文件名。它预期存在名为
`mantis-thread-report.md` 的附件。

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

租用或复用 Crabbox 桌面，在 VNC 会话中启动浏览器，
使其打开 `--browser-url`（默认值为 `https://openclaw.ai`）或渲染后的
`--html-file`，等待后使用 `scrot` 截图，可选择使用
`ffmpeg` 录制 MP4，并通过 rsync 将 `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
同步回 `--output-dir`。

标志：

- `--lease-id <cbx_...>` 复用预热桌面，而不是创建新桌面。
- `--browser-profile-dir <remote-path>` 复用远程 Chrome 用户数据目录，使持久化桌面在多次运行之间保持登录状态（用于长期存续的 Discord Web 查看器配置文件）。
- `--browser-profile-archive-env <name>` 在启动前从该环境变量恢复 base64 `.tgz` Chrome 配置文件归档（默认值为 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`）；用于 Discord Web 等已登录见证。
- `--video-duration <seconds>` 控制 MP4 捕获时长（默认 10 秒）。
- `--keep-lease`（或 `OPENCLAW_MANTIS_KEEP_VM=1`）保持本次运行创建的租约处于开启状态，以便通过 VNC 检查；创建了租约的失败运行默认也会保留租约。

对于 Discord Web 证据，Mantis 使用专用查看器账号，而不是 Bot
令牌。Discord REST 预言机（通过 `qa discord`）仍是权威依据；设置
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` 后，场景还会写入
Discord Web URL 制品，而 `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` 会让
帖子串保持开启足够长的时间，以便浏览器将其打开。

GitHub 工作流优先通过
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 使用持久化查看器配置文件（完整配置文件归档可能超过
GitHub 的密钥大小限制）；对于小型/引导配置文件，它也可以改为从
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 恢复 base64 `.tgz`。如果
两种来源都未配置，工作流仍会发布确定性的
基线/候选版本截图，并记录已跳过登录状态见证。

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

租用或复用 Crabbox 桌面，将检出同步到虚拟机中，在其中运行
`pnpm openclaw qa slack`，在 VNC 浏览器中打开 Slack Web，
捕获桌面，并将 Slack QA 制品（`slack-qa/`）和
VNC 屏幕截图/视频复制回本地。这是唯一一种 SUT
Gateway 网关和浏览器都在同一虚拟机中运行的 Mantis 形态。

指定 `--gateway-setup` 后，该命令会在虚拟机中的
`$HOME/.openclaw-mantis/slack-openclaw` 创建持久化的可弃用 OpenClaw
主目录，为目标频道修补 Slack
Socket Mode 配置，启动
`openclaw gateway run --dev --allow-unconfigured --port 38973`，并让
Chrome 继续在 VNC 会话中运行；省略 `--gateway-setup` 则改为运行常规的
Bot 对 Bot Slack QA 通道。

`--credential-source env` 所需的环境变量（本地默认值为 `env`；角色
默认值为 `maintainer`）：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 远程模型通道所需的 `OPENCLAW_LIVE_OPENAI_KEY`（如果本地仅设置了 `OPENAI_API_KEY`，
  Mantis 会在调用 Crabbox 前将其复制到 `OPENCLAW_LIVE_OPENAI_KEY`）

指定 `--credential-source convex` 后，Mantis 会先从
共享池租用 Slack SUT 凭据，再创建虚拟机，并将频道 ID、应用令牌和
Bot 令牌作为 `OPENCLAW_MANTIS_SLACK_*` 环境变量转发到虚拟机，因此 GitHub
工作流只需要 Convex 中介服务密钥，而不需要原始 Slack 令牌。

其他标志：`--slack-url <url>` 打开指定 URL（否则 Mantis 会根据 `auth.test`
派生 `https://app.slack.com/client/<team>/<channel>`）；
`--slack-channel-id <id>` 设置 Gateway 网关允许列表中的频道；
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制虚拟机内的持久化 Chrome
配置文件（默认值为 `$HOME/.config/openclaw-mantis/slack-chrome-profile`）；
`--approval-checkpoints` 运行原生 Slack 审批场景
（`slack-approval-exec-native`、`slack-approval-plugin-native`），并渲染
待处理/已解决检查点的屏幕截图，而不是设置 Gateway 网关（与 `--gateway-setup` 互斥）；
`--hydrate-mode source|prehydrated`、`--provider-mode`、`--model`、`--alt-model`
和 `--fast` 会原样传递到 Slack 实时通道。

审批检查点屏幕截图根据场景观察到的 Slack API 消息渲染，
而不是来自实时 Slack UI；只有当租约的浏览器配置文件已登录时，
`slack-desktop-smoke.png` 才是 Slack Web 本身的证据。

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

租用或复用 Crabbox 桌面环境，安装原生 Linux Telegram Desktop，可选择恢复用户会话归档，使用租用的 Telegram 被测系统 Bot 令牌配置 OpenClaw，启动
`openclaw gateway run --dev --allow-unconfigured --port 38974`，向租用的私有群组发送驱动 Bot 就绪消息，然后捕获截图和 MP4。Bot 令牌只用于配置 OpenClaw；绝不会用于登录 Telegram Desktop。桌面查看器是一个独立的 Telegram 用户会话，可从 `--telegram-profile-archive-env <name>` 恢复，也可通过 VNC 手动登录，并使用 `--keep-lease` 保持运行。

标志：`--lease-id <cbx_...>` 针对已经登录 Telegram Desktop 的虚拟机重新运行；`--telegram-profile-archive-env <name>` 在启动前恢复 base64 编码的 `.tgz` 配置文件归档；`--telegram-profile-dir <remote-path>` 设置远程配置文件目录（默认 `$HOME/.local/share/TelegramDesktop`）；`--no-gateway-setup` 仅安装并打开 Telegram Desktop；`--credential-source`/`--credential-role` 默认为 `convex`/`maintainer`。

## 证据清单

每个发布到 PR 的场景都会在其报告旁写入 `mantis-evidence.json`：

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

制品 `path` 相对于清单所在目录；`targetPath` 相对于已配置的 R2/S3 制品前缀。`scripts/mantis/publish-pr-evidence.mjs` 会拒绝路径遍历，并在文件缺失时跳过 `"required": false` 的条目。

制品类型：`timeline`（确定性的前后对比截图）、`desktopScreenshot`（VNC/浏览器截图）、`motionPreview`（根据录制内容生成的内嵌动画 GIF）、`motionClip`（经动态片段裁剪的 MP4）、`fullVideo`（完整录制）、`metadata`（JSON/日志辅助文件）、`report`（Markdown 报告）。

一次运行在磁盘上的制品布局：

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

截图是证据，不是机密，但仍需遵循脱敏规范：其中可能出现私有渠道名称、用户名或消息内容。公开上传制品时设置 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`；Discord/Slack/Telegram GitHub 工作流默认启用此设置。

## GitHub 自动化

`scripts/mantis/publish-pr-evidence.mjs` 是可复用的发布器。工作流调用它时会传入清单、目标 PR、制品目标根目录、评论标记、制品 URL、运行 URL 和请求来源。它会将声明的制品上传到 Mantis R2 存储桶，构建一条以摘要为先、包含内嵌图片/预览和视频链接的 PR 评论，然后更新已有的标记评论或创建新评论。所需环境变量：

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`（工作流设置为 `openclaw-crabbox-artifacts`）
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`（工作流设置为 `auto`）
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`（工作流设置为 `https://artifacts.openclaw.ai`）

评论通过 Mantis GitHub App（`MANTIS_GITHUB_APP_ID` / `MANTIS_GITHUB_APP_PRIVATE_KEY`）发布，而不是通过 `github-actions[bot]`；它使用隐藏的标记评论作为更新插入键。

| 工作流                            | 触发方式                                                                                   | 执行内容                                                                                                                                                                                                                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | 手动触发                                                                                   | 针对所选引用运行 `discord-smoke`。                                                                                                                                                                                                                                                                               |
| `Mantis Discord Status Reactions` | PR 评论或手动触发                                                                          | 分别构建基线和候选工作树，在每个工作树上运行 `discord-status-reactions-tool-only`，在 Crabbox 桌面浏览器中渲染各通道的时间线，使用 `crabbox media preview` 生成经动态片段裁剪的 GIF/MP4 预览，上传制品，并发布内嵌的 PR 证据。                         |
| `Mantis Scenario`                 | 手动触发                                                                                   | 通用分派器：接收 `scenario_id`（`discord-status-reactions-tool-only`、`discord-thread-reply-filepath-attachment`、`slack-desktop-smoke`、`telegram-live`、`telegram-desktop-proof`、`web-ui-chat-proof`）、`baseline_ref`、`candidate_ref`、`pr_number`，并转发到匹配的场景工作流。 |
| `Mantis Slack Desktop Smoke`      | 手动触发                                                                                   | 租用 Crabbox Linux 桌面环境（默认为 `aws`，可选择 `hetzner`），针对候选版本运行 `slack-desktop-smoke --gateway-setup`，录制桌面，生成动态预览，上传制品，并在提供 PR 编号时发布 PR 证据。                                                            |
| `Mantis Telegram Live`            | PR 评论或手动触发                                                                          | 运行基于 Bot API 的 Telegram 实时 QA 通道（`openclaw qa telegram`），根据 QA 摘要写入 `mantis-evidence.json`，通过 Crabbox 桌面浏览器渲染已脱敏的证据 HTML，生成动态 GIF，并发布 PR 证据。此通道不需要登录 Telegram Web。                          |
| `Mantis Telegram Desktop Proof`   | 维护者 PR 标签（`mantis: telegram-visible-proof`）加 PR 评论，或手动触发                  | 由智能体执行的原生 Telegram Desktop 前后对比证明。将 PR、基线/候选引用和维护者指令交给 Codex，由其针对两个引用运行真实用户 Crabbox Telegram Desktop 证明通道，并发布两列式 PR 证据表。                                                              |
| `Mantis Web UI Chat Proof`        | PR 评论或手动触发                                                                          | 针对候选版本运行聚焦于 OpenClaw Control UI 聊天的 Playwright 证明，验证浏览器通过模拟的 Gateway 网关发送消息，捕获截图/视频制品，并发布 PR 证据。此通道仅用于网页聊天证明，不适用于 WinUI/原生应用或任意视觉证明。                        |

`Mantis Discord Status Reactions` 和 `Mantis Telegram Live` 都接受 `baseline_ref`/`candidate_ref`（或 PR 评论中的 `baseline=`/`candidate=`），并在使用包含机密的凭据运行前验证解析出的 SHA 是 `origin/main` 的祖先、发布标签（`v*`），或开放 PR 的头部提交。

来自具有写入/维护/管理员权限的 PR 的评论触发器：

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Telegram 评论触发器默认将 PR 头部 SHA 用作候选版本，并将 `telegram-status-command` 用作场景；它们接受 `provider=aws|hetzner` 和 `lease=<cbx_...>`，以指定特定的 Crabbox 提供商或已预热的桌面环境。仅当 PR 已带有 `mantis: telegram-visible-proof` 标签时，`Mantis Telegram Desktop Proof` 才会响应 PR 评论。

Web UI 聊天评论触发器默认将 PR 头部 SHA 用作候选版本。它们运行 Control UI 的模拟 Gateway 网关聊天证明并发布浏览器制品；对于其他网页和原生应用界面，请使用常规 Playwright/浏览器证明、维护者截图、Crabbox 或本地制品。

ClawSweeper 也可以直接分派场景：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## 机器和机密

本地 CLI 的 Crabbox 默认值为 `--provider hetzner --class beast`；可使用 `--provider`、`--class`/`--machine-class` 或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS` 覆盖。GitHub 工作流通常会覆盖这两个值（例如 `--class standard`，以及 Slack 工作流的 `aws`/`hetzner` 提供商选择输入）。如果某个提供商速度过慢或不可用，应将其添加到同一个 Crabbox 接口之后，而不是硬编码后备方案。

虚拟机基线：Linux，配备支持桌面环境的 Chrome/Chromium、CDP 访问、VNC/noVNC、Node 22+ 和 pnpm、OpenClaw 检出，并可向目标传输服务、GitHub、模型提供商和凭据代理发起出站访问。

Mantis 工作流中使用的机密名称：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`，用于公开上传制品
- `OPENCLAW_QA_CONVEX_SITE_URL`、`OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN`（工作流还接受 `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` 作为后备，并在调用 Crabbox 前将其映射到不带前缀的名称）
- `MANTIS_GITHUB_APP_ID`、`MANTIS_GITHUB_APP_PRIVATE_KEY`

Mantis 运行器绝不能打印 Discord/Slack/Telegram Bot 令牌、提供商 API 密钥、浏览器 Cookie、身份验证配置文件内容、VNC 密码或原始凭据载荷。如果令牌泄露到议题、PR、聊天或日志中，请在存储替换机密后轮换该令牌。

## 运行结果

前后对比传输场景会区分以下结果，避免将不稳定的环境误判为产品回归：

- **已复现缺陷**：基线以场景预期的方式失败。
- **测试框架失败**：在判定条件具备意义前，环境设置、凭据、传输 API、浏览器或提供商失败。

仅候选版本的浏览器证明会报告候选版本是否通过模拟 Gateway 网关和可见 UI 断言；它不会声称已复现基线问题。

## 添加场景

实时传输场景按传输方式使用 TypeScript 定义（有关 Discord 前后对比结构，请参阅 `extensions/qa-lab/src/mantis/run.runtime.ts` 中的 `MANTIS_SCENARIO_CONFIGS`），而不是使用独立的声明式文件格式。每个场景都需要：ID 和标题、传输方式、所需凭据、基线引用策略、候选引用策略、OpenClaw 配置补丁、设置/激励步骤、预期的基线和候选判定条件、视觉捕获目标、超时预算以及清理步骤。

面向候选版本的聚焦浏览器验证可以使用专用的确定性端到端测试和工作流。明确限定其范围，在执行前验证候选版本引用，隔离由密钥支持的发布流程，并生成符合相同证据清单契约的输出。

相比视觉检查，优先使用小型、类型化的判定依据：Discord 表情回应状态或消息引用、Slack 话题串 `ts`/表情回应 API 状态、电子邮件消息 ID 和标头。仅当 UI 是唯一可靠的可观测对象时使用浏览器截图；如果平台 API 判定依据存在，则将视觉检查作为其补充。

继 Discord、Slack 和 Telegram 之后，同一运行器结构可扩展到 WhatsApp（二维码登录、重新识别、投递、媒体、表情回应）和 Matrix（加密房间、话题串/回复关系、重启后恢复）；这两者目前均未实现。

## 待解决问题

- 复用现有 Mantis Bot 时，哪个 Discord Bot 应作为驱动程序，哪个应作为被测系统？
- GitHub 应为 PR 保留 Mantis 构件多长时间？
- ClawSweeper 应在何时自动推荐 Mantis 场景，而不是等待维护者命令？
- 为公开 PR 上传截图前，是否应对其进行脱敏或裁剪？
