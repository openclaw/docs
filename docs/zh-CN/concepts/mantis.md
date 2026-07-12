---
read_when:
    - 为 OpenClaw bug 构建或运行实时可视化 QA
    - 为拉取请求添加变更前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 为候选引用运行聚焦的 Control UI 浏览器验证
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行任务
summary: Mantis 为实时传输对比和聚焦于候选版本的浏览器验证捕获可视化端到端证据，然后将这些工件附加到 PR。
title: Mantis
x-i18n:
    generated_at: "2026-07-12T14:24:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 86b65ae8503b23407b600aa08f16940f9fcaa9a4e598963f7f878a3b336784f0
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 会发布 OpenClaw 行为的可视化 CI 证据和 PR 评论。
实时传输场景会将已知有问题的基线与候选 ref 进行比较；
而聚焦的浏览器通道可改为使用确定性的模拟传输，
验证单个候选版本。Discord 率先推出，支持真实 Bot 身份验证、服务器频道、
表情回应、帖子串和浏览器见证。Slack、Telegram 以及聚焦的 Control
UI 聊天通道也已存在；WhatsApp 和 Matrix 尚未实现。

## 所有权

- OpenClaw（`extensions/qa-lab/src/mantis/*`）：场景运行时、`pnpm openclaw qa mantis <command>` CLI、证据架构。
- QA Lab（`extensions/qa-lab/src/live-transports/*`）：实时传输测试框架、驱动程序/SUT Bot、报告/证据写入器。
- Crabbox（`openclaw/crabbox`）：已预热的 Linux 机器、租约、VNC、`crabbox media preview`。
- GitHub Actions（`.github/workflows/mantis-*.yml`）：远程入口点、工件保留。
- ClawSweeper：解析维护者 PR 命令、分派工作流并发布最终 PR 评论。

## CLI 命令

所有命令均为 `pnpm openclaw qa mantis <command>`，定义于
`extensions/qa-lab/src/mantis/cli.ts`。构建/运行时需要 `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
（内置工作流会在构建前设置 `OPENCLAW_BUILD_PRIVATE_QA=1` 和
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`）。

| 命令                            | 用途                                                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | 验证 Mantis Discord Bot 可以看到服务器/频道、发布消息并添加表情回应。                                                                                     |
| `run`                           | 针对基线和候选 ref 运行前后对比场景（仅限 Discord）。                                                                                                     |
| `desktop-browser-smoke`         | 租用/复用 Crabbox 桌面，打开可见浏览器，捕获屏幕截图和视频。                                                                                              |
| `slack-desktop-smoke`           | 租用/复用 Crabbox 桌面，在其中运行 Slack QA，打开 Slack Web，并捕获证据。                                                                                  |
| `telegram-desktop-builder`      | 租用/复用 Crabbox 桌面，安装 Telegram Desktop，并可选择配置 OpenClaw Gateway 网关。                                                                       |
| `visual-task` / `visual-driver` | 通用 Crabbox 桌面捕获，可选择使用图像理解断言；`visual-driver` 是在 `crabbox record --while` 下启动的驱动程序部分。                                         |

每个命令都接受 `--repo-root <path>` 和 `--output-dir <path>`；Crabbox
命令还接受 `--crabbox-bin`、`--provider`、`--machine-class`/`--class`、
`--lease-id`、`--idle-timeout`、`--ttl` 和 `--keep-lease`。除非另有说明，本地 CLI 的
提供商/类别默认值为 `hetzner`/`beast`；CI 工作流通常会覆盖这两个值。

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

调用 Discord REST API（`https://discord.com/api/v10`）获取 Bot
用户、服务器、服务器频道和目标频道，断言该
频道属于该服务器，然后（除非指定 `--skip-post`）发布消息并
添加 `👀` 表情回应。写入 `mantis-discord-smoke-summary.json` 和
`mantis-discord-smoke-report.md`。

令牌解析顺序：`--token-file` 的值，然后是 `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
（可用 `--token-env` 覆盖），最后是由 `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
指定的文件（可用 `--token-file-env` 覆盖）。服务器/频道 ID 来自
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID`（可用
`--guild-id` / `--channel-id` 覆盖），并且必须是 17-20 位的 Discord 雪花 ID。设置
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
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | 帖子串回复省略 `filePath` 附件           | 帖子串回复包含该附件         |

`--candidate` 默认为 `HEAD`。其他标志：`--credential-source`
（默认 `convex`）、`--credential-role`（默认 `ci`）、`--provider-mode`
（默认 `live-frontier`）、`--fast`（默认启用）、`--skip-install`、`--skip-build`。

运行器会在 `<output-dir>/worktrees/` 下为基线和
候选版本创建分离的 `git worktree` 检出，在每个检出中运行 `pnpm install`/`pnpm build`
（除非跳过），然后针对每个 worktree 运行
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`。
每个通道都会写入 `discord-qa-reaction-timelines.json`
以及一对 `<scenario-id>-timeline.html`/`.png` 文件；运行器将此
证据复制回 `baseline/`/`candidate/` 下，在输出目录中写入
`comparison.json`、`mantis-report.md` 和 `mantis-evidence.json`，并且
如果比较未通过（基线为 `fail`、候选版本为
`pass`），则以非零状态退出。

第二个 Discord 场景（`discord-thread-reply-filepath-attachment`）使用
驱动 Bot 发布父消息，创建真实帖子串，使用仓库本地 `filePath` 调用 SUT 的
`message.thread-reply` 操作，然后轮询
帖子串以查找回复和附件文件名。它预期存在名为
`mantis-thread-report.md` 的附件。

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

租用或复用 Crabbox 桌面，在 VNC 会话内启动浏览器，
指向 `--browser-url`（默认 `https://openclaw.ai`）或渲染后的
`--html-file`，等待，使用 `scrot` 截取屏幕，可选择使用
`ffmpeg` 录制 MP4，并通过 rsync 将 `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
同步回 `--output-dir`。

标志：

- `--lease-id <cbx_...>` 复用已预热的桌面，而不是创建新桌面。
- `--browser-profile-dir <remote-path>` 复用远程 Chrome user-data-dir，使持久桌面在多次运行之间保持登录状态（用于长期运行的 Discord Web 查看者配置文件）。
- `--browser-profile-archive-env <name>` 在启动前从该环境变量恢复 base64 `.tgz` Chrome 配置文件归档（默认 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`）；用于 Discord Web 等已登录的见证界面。
- `--video-duration <seconds>` 控制 MP4 捕获时长（默认 10s）。
- `--keep-lease`（或 `OPENCLAW_MANTIS_KEEP_VM=1`）使本次运行创建的租约保持开放，以供 VNC 检查；创建了租约的失败运行默认也会保留该租约。

对于 Discord Web 证据，Mantis 使用专用查看者账号，而不是 Bot
令牌。Discord REST 判定依据（通过 `qa discord`）仍具有权威性；当
设置 `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` 时，该场景还会写入
Discord Web URL 工件，而 `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` 会使
帖子串保持开放足够长的时间，以便浏览器将其打开。

GitHub 工作流优先通过
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 使用持久查看者配置文件（完整配置文件归档可能超过
GitHub 的 Secret 大小限制）；对于较小的/引导用配置文件，它可以改为从
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 恢复 base64 `.tgz`。如果
两个来源均未配置，工作流仍会发布确定性的
基线/候选版本屏幕截图，并记录已跳过已登录见证界面。

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

租用或复用 Crabbox 桌面，将检出同步到 VM 中，在其中运行
`pnpm openclaw qa slack`，在 VNC 浏览器中打开 Slack Web，
捕获桌面，并将 Slack QA 工件（`slack-qa/`）和
VNC 屏幕截图/视频复制回本地。这是唯一一种 SUT Gateway 网关
和浏览器都在同一 VM 内运行的 Mantis 形态。

使用 `--gateway-setup` 时，该命令会在 VM 中的
`$HOME/.openclaw-mantis/slack-openclaw` 创建一个持久的一次性 OpenClaw
主目录，修补目标频道的 Slack
Socket Mode 配置，启动
`openclaw gateway run --dev --allow-unconfigured --port 38973`，并使
Chrome 在 VNC 会话中持续运行；省略 `--gateway-setup` 则改为运行常规
Bot 对 Bot 的 Slack QA 通道。

`--credential-source env` 所需的环境变量（本地默认值为 `env`；角色
默认值为 `maintainer`）：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 远程模型通道需要 `OPENCLAW_LIVE_OPENAI_KEY`（如果本地仅设置了 `OPENAI_API_KEY`，
  Mantis 会先将其复制到 `OPENCLAW_LIVE_OPENAI_KEY`，然后再
  调用 Crabbox）

使用 `--credential-source convex` 时，Mantis 会在创建 VM 前从
共享池租用 Slack SUT 凭据，并将频道 ID、应用令牌和
Bot 令牌作为 `OPENCLAW_MANTIS_SLACK_*` 环境变量转发到 VM 中，因此 GitHub
工作流只需要 Convex broker Secret，而不需要原始 Slack 令牌。

其他标志：`--slack-url <url>` 打开特定 URL（否则 Mantis 会根据 `auth.test`
派生 `https://app.slack.com/client/<team>/<channel>`）；
`--slack-channel-id <id>` 设置 Gateway 网关允许列表频道；
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 内的持久 Chrome
配置文件（默认 `$HOME/.config/openclaw-mantis/slack-chrome-profile`）；
`--approval-checkpoints` 运行原生 Slack 审批场景
（`slack-approval-exec-native`、`slack-approval-plugin-native`），并渲染
待处理/已解决检查点的屏幕截图，而不是设置 Gateway 网关（与
`--gateway-setup` 互斥）；`--hydrate-mode source|prehydrated`、
`--provider-mode`、`--model`、`--alt-model` 和 `--fast` 会透传到
Slack 实时通道。

审批检查点屏幕截图根据场景观察到的 Slack API 消息
渲染，而不是来自实时 Slack UI；只有当租约的浏览器配置文件已登录时，
`slack-desktop-smoke.png` 才是 Slack Web 本身的证据。

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

租用或复用 Crabbox 桌面环境，安装原生 Linux Telegram Desktop，
可选地恢复用户会话归档，使用租用的 Telegram SUT Bot Token 配置 OpenClaw，
启动 `openclaw gateway run --dev --allow-unconfigured --port 38974`，
向租用的私有群组发送驱动 Bot 就绪消息，然后捕获截图和 MP4。Bot Token
仅用于配置 OpenClaw；绝不会让 Telegram Desktop 登录。桌面查看器是一个
独立的 Telegram 用户会话，可从 `--telegram-profile-archive-env <name>`
恢复，也可通过 VNC 手动登录，并使用 `--keep-lease` 保持运行。

标志：`--lease-id <cbx_...>` 针对已登录 Telegram Desktop 的 VM 重新运行；
`--telegram-profile-archive-env <name>` 在启动前恢复 base64 编码的 `.tgz`
配置文件归档；`--telegram-profile-dir <remote-path>` 设置远程配置文件目录
（默认值为 `$HOME/.local/share/TelegramDesktop`）；
`--no-gateway-setup` 仅安装并打开 Telegram Desktop；
`--credential-source`/`--credential-role` 默认分别为 `convex`/`maintainer`。

## 证据清单

每个发布到 PR 的场景都会在其报告旁写入 `mantis-evidence.json`：

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord 状态表情回应 QA",
  "summary": "供 PR 评论使用的可读顶部摘要。",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "仅排队" },
    "candidate": { "sha": "...", "status": "pass", "expected": "排队 -> 思考中 -> 完成" },
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

工件 `path` 相对于清单所在目录；`targetPath` 相对于配置的 R2/S3 工件前缀。
当文件缺失时，`scripts/mantis/publish-pr-evidence.mjs` 会拒绝路径遍历并跳过
`"required": false` 的条目。

工件类型：`timeline`（确定性的前后对比截图）、
`desktopScreenshot`（VNC/浏览器截图）、`motionPreview`（由录制内容生成的内联
动画 GIF）、`motionClip`（按运动片段裁剪的 MP4）、`fullVideo`（完整录制）、
`metadata`（JSON/日志附属文件）、`report`（Markdown 报告）。

一次运行在磁盘上的工件布局：

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

截图是证据，而不是密钥，但仍需遵守脱敏规范：其中可能出现私有渠道名称、
用户名或消息内容。上传公共工件时设置
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`；Discord/Slack/Telegram GitHub
工作流默认启用此设置。

## GitHub 自动化

`scripts/mantis/publish-pr-evidence.mjs` 是可复用的发布器。工作流调用它时会
传入清单、目标 PR、工件目标根目录、评论标记、工件 URL、运行 URL 和请求来源。
它会将声明的工件上传到 Mantis R2 存储桶，生成一条摘要优先的 PR 评论，其中
包含内联图片/预览和视频链接，然后更新现有的标记评论或创建新评论。所需的
环境变量：

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`（工作流设置为 `openclaw-crabbox-artifacts`）
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`（工作流设置为 `auto`）
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`（工作流设置为 `https://artifacts.openclaw.ai`）

评论通过 Mantis GitHub App（`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`）发布，而不是通过 `github-actions[bot]`；
它使用隐藏的标记评论作为更新或插入键。

| 工作流                            | 触发方式                                                                                   | 执行内容                                                                                                                                                                                                                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | 手动分派                                                                                   | 针对选定的 ref 运行 `discord-smoke`。                                                                                                                                                                                                                                                                            |
| `Mantis Discord Status Reactions` | PR 评论或手动分派                                                                          | 创建独立的基线/候选工作树，分别运行 `discord-status-reactions-tool-only`，在 Crabbox 桌面浏览器中渲染各通道的时间线，使用 `crabbox media preview` 生成按运动片段裁剪的 GIF/MP4 预览，上传工件，并发布内联 PR 证据。                                  |
| `Mantis Scenario`                 | 手动分派                                                                                   | 通用分派器：接收 `scenario_id`（`discord-status-reactions-tool-only`、`discord-thread-reply-filepath-attachment`、`slack-desktop-smoke`、`telegram-live`、`telegram-desktop-proof`、`web-ui-chat-proof`）、`baseline_ref`、`candidate_ref`、`pr_number`，并转发到匹配的场景工作流。 |
| `Mantis Slack Desktop Smoke`      | 手动分派                                                                                   | 租用 Crabbox Linux 桌面环境（默认为 `aws`，也可选择 `hetzner`），针对候选版本运行 `slack-desktop-smoke --gateway-setup`，录制桌面，生成运动预览并上传工件；如果提供了 PR 编号，则发布 PR 证据。                                                      |
| `Mantis Telegram Live`            | PR 评论或手动分派                                                                          | 运行基于 Bot API 的 Telegram 实时 QA 通道（`openclaw qa telegram`），根据 QA 摘要写入 `mantis-evidence.json`，通过 Crabbox 桌面浏览器渲染经过脱敏的证据 HTML，生成运动 GIF，并发布 PR 证据。此通道无需登录 Telegram Web。                             |
| `Mantis Telegram Desktop Proof`   | 维护者 PR 标签（`mantis: telegram-visible-proof`）加 PR 评论，或手动分派                   | 由智能体执行的原生 Telegram Desktop 前后对比证明。将 PR、基线/候选 ref 和维护者指令交给 Codex，由其针对两个 ref 运行真实用户 Crabbox Telegram Desktop 证明通道，并发布两列式 PR 证据表。                                                           |
| `Mantis Web UI Chat Proof`        | PR 评论或手动分派                                                                          | 针对候选版本运行聚焦于 OpenClaw Control UI 聊天的 Playwright 证明，验证浏览器通过模拟的 Gateway 网关发送消息，捕获截图/视频工件，并发布 PR 证据。此通道仅用于 Web 聊天证明，不适用于 WinUI/原生应用或任意可视化证明。                      |

`Mantis Discord Status Reactions` 和 `Mantis Telegram Live` 均接受
`baseline_ref`/`candidate_ref`（或 PR 评论中的 `baseline=`/`candidate=`），
并在使用包含密钥的凭据运行前验证解析出的 SHA 是 `origin/main` 的祖先、
发布标签（`v*`）或开放 PR 的头提交。

来自具有 write/maintain/admin 权限的 PR 的评论触发器：

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Telegram 评论触发器默认使用 PR 头提交 SHA 作为候选版本，并使用
`telegram-status-command` 作为场景；它们接受 `provider=aws|hetzner` 和
`lease=<cbx_...>`，以指定特定 Crabbox 提供商或预热的桌面环境。
`Mantis Telegram Desktop Proof` 仅在 PR 已带有
`mantis: telegram-visible-proof` 标签时才响应 PR 评论。

Web UI 聊天评论触发器默认使用 PR 头提交 SHA 作为候选版本。它们会运行
Control UI 的模拟 Gateway 网关聊天证明并发布浏览器工件；对于其他网页和
原生应用界面，请使用常规 Playwright/浏览器证明、维护者截图、Crabbox 或
本地工件。

ClawSweeper 也可以直接分派场景：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## 机器和密钥

本地 CLI Crabbox 的默认值为 `--provider hetzner --class beast`；可使用
`--provider`、`--class`/`--machine-class` 或
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`
覆盖。GitHub 工作流通常会覆盖两者（例如 `--class standard`，以及 Slack
工作流的 `aws`/`hetzner` 提供商选择输入）。如果某个提供商速度过慢或不可用，
应通过同一 Crabbox 接口添加该提供商，而不是硬编码回退方案。

VM 基线：Linux，配备支持桌面的 Chrome/Chromium、CDP 访问、VNC/
noVNC、Node 22+ 和 pnpm、OpenClaw 检出目录，以及对目标传输服务、GitHub、
模型提供商和凭据代理的出站访问权限。

Mantis 工作流中使用的密钥名称：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`，用于公共工件上传
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN`（工作流还接受
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` 作为回退，并在调用
  Crabbox 前将其映射到普通名称）
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Mantis 运行器绝不能打印 Discord/Slack/Telegram Bot Token、
提供商 API 密钥、浏览器 Cookie、身份验证配置文件内容、VNC 密码或原始凭据
载荷。如果 Token 泄漏到 issue、PR、聊天或日志中，请在存储替换密钥后轮换它。

## 运行结果

前后对比传输场景会区分以下结果，避免将不稳定环境误判为产品回归：

- **已复现 Bug**：基线以场景预期的方式失败。
- **测试框架故障**：环境设置、凭据、传输 API、浏览器或提供商在判定条件有意义之前失败。

仅针对候选版本的浏览器证明会报告候选版本是否通过模拟 Gateway 网关和可见
UI 断言；它不会声称已复现基线问题。

## 添加场景

实时传输场景按传输方式使用 TypeScript 定义（有关 Discord 前后对比结构，
请参阅 `extensions/qa-lab/src/mantis/run.runtime.ts` 中的
`MANTIS_SCENARIO_CONFIGS`），而不是使用独立的声明式文件格式。每个场景都需要：
ID 和标题、传输方式、所需凭据、基线 ref 策略、候选 ref 策略、OpenClaw
配置补丁、设置/激励步骤、预期的基线和候选判定条件、可视化捕获目标、超时预算
和清理步骤。

仅针对候选版本的浏览器验证可以使用专用的确定性 E2E 测试
和工作流。明确限定其范围，在执行前验证候选 ref，
隔离由密钥支持的发布流程，并生成遵循同一证据
清单契约的输出。

优先使用小型、类型化的判定依据，而非视觉检查：Discord 表情回应状态或
消息引用、Slack 线程 `ts`/表情回应 API 状态、电子邮件消息 ID
和标头。当 UI 是唯一可靠的可观测对象时，使用浏览器截图；
如果平台 API 可作为判定依据，则视觉检查应仅作为补充。

继 Discord、Slack 和 Telegram 之后，同样的运行器结构还可扩展至 WhatsApp
（二维码登录、重新识别、消息送达、媒体、表情回应）和 Matrix
（加密房间、线程/回复关系、重启后恢复）；这两项
目前均未实现。

## 待解决问题

- 复用现有 Mantis Bot 时，哪个 Discord Bot 应作为驱动端，哪个应作为 SUT？
- GitHub 应为 PR 保留 Mantis 工件多长时间？
- ClawSweeper 应在何时自动推荐 Mantis 场景，而不是
  等待维护者命令？
- 对于公开 PR，截图上传前是否应进行脱敏或裁剪？
