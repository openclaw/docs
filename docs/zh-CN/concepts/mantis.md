---
read_when:
    - 构建或运行 OpenClaw bug 的实时视觉 QA
    - 为拉取请求添加变更前后验证
    - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
    - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
summary: Mantis 是一个可视化端到端验证系统，用于在实时传输协议上复现 OpenClaw bug、捕获前后证据，并将工件附加到 PR。
title: Mantis
x-i18n:
    generated_at: "2026-07-05T11:12:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9900316f179fbb42fb8cef603bd6719b55a8fb769409980ff7b17cf3e562ae70
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 会在真实传输协议上针对已知有问题的基线引用和候选引用重新运行 bug 场景，然后将前后对比发布为 CI 构件和 PR 评论。Discord 最先交付：真实 bot 凭证、真实 guild 频道、表情回应、线程，以及可供人工检查的浏览器见证。Slack 和 Telegram 通道也已存在；WhatsApp 和 Matrix 尚未实现。

## 所有权

- OpenClaw（`extensions/qa-lab/src/mantis/*`）：场景运行时、`pnpm openclaw qa mantis <command>` CLI、证据 schema。
- QA Lab（`extensions/qa-lab/src/live-transports/*`）：实时传输协议 harness、driver/SUT bot、报告/证据写入器。
- Crabbox（`openclaw/crabbox`）：预热的 Linux 机器、租约、VNC、`crabbox media preview`。
- GitHub Actions（`.github/workflows/mantis-*.yml`）：远程入口点、构件保留。
- ClawSweeper：解析维护者 PR 命令，分发 workflow，发布最终 PR 评论。

## CLI 命令

所有命令都是 `pnpm openclaw qa mantis <command>`，定义在
`extensions/qa-lab/src/mantis/cli.ts` 中。构建/运行时需要 `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
（内置 workflow 会在构建前设置 `OPENCLAW_BUILD_PRIVATE_QA=1` 和
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`）。

| 命令                            | 用途                                                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | 验证 Mantis Discord bot 能看到 guild/频道、发帖并添加表情回应。                                                                                          |
| `run`                           | 针对基线和候选引用运行前后场景（仅 Discord）。                                                                                                           |
| `desktop-browser-smoke`         | 租用/复用 Crabbox 桌面，打开可见浏览器，捕获截图 + 视频。                                                                                                |
| `slack-desktop-smoke`           | 租用/复用 Crabbox 桌面，在其中运行 Slack QA，打开 Slack Web，捕获证据。                                                                                  |
| `telegram-desktop-builder`      | 租用/复用 Crabbox 桌面，安装 Telegram Desktop，可选配置 OpenClaw gateway。                                                                               |
| `visual-task` / `visual-driver` | 通用 Crabbox 桌面捕获，支持可选图像理解断言；`visual-driver` 是在 `crabbox record --while` 下启动的 driver 半部分。                                     |

每个命令都接受 `--repo-root <path>` 和 `--output-dir <path>`；Crabbox
命令还接受 `--crabbox-bin`、`--provider`、`--machine-class`/`--class`、
`--lease-id`、`--idle-timeout`、`--ttl` 和 `--keep-lease`。除非另有说明，本地 CLI 的
provider/class 默认值是 `hetzner`/`beast`；CI workflow 通常会同时覆盖两者。

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

调用 Discord REST API（`https://discord.com/api/v10`）获取 bot
用户、guild、guild 的频道和目标频道，断言该频道属于该 guild，然后（除非设置 `--skip-post`）发布一条消息并添加一个 `👀` 表情回应。写入 `mantis-discord-smoke-summary.json` 和
`mantis-discord-smoke-report.md`。

Token 解析顺序：`--token-file` 的值，然后是 `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
（可用 `--token-env` 覆盖），然后是由 `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
命名的文件（可用 `--token-file-env` 覆盖）。Guild/频道 id 来自
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID`（可用
`--guild-id` / `--channel-id` 覆盖），且必须是 17-20 位 Discord snowflake。设置
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` 可在发布的摘要和报告中将 bot/guild/频道/消息 id
和名称替换为 `<redacted>`。

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

`--transport` 当前只接受 `discord`。`--scenario` 是两个内置 id 之一，每个都有自己的默认基线引用和预期的前后标签（`extensions/qa-lab/src/mantis/run.runtime.ts`）：

| 场景                                       | 默认基线                                   | 基线预期                                 | 候选预期                     |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | 线程回复省略 `filePath` 附件             | 线程回复包含它               |

`--candidate` 默认是 `HEAD`。其他标志：`--credential-source`
（默认 `convex`）、`--credential-role`（默认 `ci`）、`--provider-mode`
（默认 `live-frontier`）、`--fast`（默认开启）、`--skip-install`、`--skip-build`。

运行器会在 `<output-dir>/worktrees/` 下为基线和候选创建分离的 `git worktree` checkout，
在每个 checkout 中运行 `pnpm install`/`pnpm build`（除非跳过），然后针对每个 worktree 运行
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`。
每个通道写入 `discord-qa-reaction-timelines.json` 以及一对 `<scenario-id>-timeline.html`/`.png`；运行器将这些证据复制回 `baseline/`/`candidate/` 下，在输出目录中写入 `comparison.json`、
`mantis-report.md` 和 `mantis-evidence.json`，并在对比未通过（基线 `fail` 且候选
`pass`）时以非零状态退出。

第二个 Discord 场景（`discord-thread-reply-filepath-attachment`）会使用 driver bot 发布父消息，创建真实线程，使用仓库本地 `filePath` 调用 SUT 的 `message.thread-reply` 动作，然后轮询线程以查找回复和附件文件名。它预期存在名为 `mantis-thread-report.md` 的附件。

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

租用或复用 Crabbox 桌面，在 VNC 会话中启动浏览器并指向 `--browser-url`（默认 `https://openclaw.ai`）或渲染后的
`--html-file`，等待，用 `scrot` 截图，可选用 `ffmpeg` 录制 MP4，并将 `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
通过 rsync 同步回 `--output-dir`。

标志：

- `--lease-id <cbx_...>` 复用已预热桌面，而不是创建一个新的。
- `--browser-profile-dir <remote-path>` 复用远程 Chrome user-data-dir，使持久桌面在多次运行之间保持登录状态（用于长期存在的 Discord Web 查看器 profile）。
- `--browser-profile-archive-env <name>` 在启动前从该环境变量恢复 base64 `.tgz` Chrome profile 归档（默认 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`）；用于 Discord Web 等已登录见证。
- `--video-duration <seconds>` 控制 MP4 捕获时长（默认 10 秒）。
- `--keep-lease`（或 `OPENCLAW_MANTIS_KEEP_VM=1`）保留本次运行创建的租约，以便进行 VNC 检查；创建了租约的失败运行默认也会保留它。

对于 Discord Web 证据，Mantis 使用专用查看器账号，而不是 bot
token。Discord REST oracle（通过 `qa discord`）仍是权威来源；设置
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` 时，场景还会写入一个
Discord Web URL 构件，并且 `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` 会让线程保持打开足够长时间，以便浏览器打开它。

GitHub workflow 优先通过 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 使用持久查看器 profile（完整 profile 归档可能超过 GitHub 的 secret 大小限制）；对于小型/引导 profile，也可以改为从 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 恢复 base64 `.tgz`。如果两个来源都未配置，workflow 仍会发布确定性的基线/候选截图，并记录已跳过已登录见证。

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

租用或复用 Crabbox 桌面，将 checkout 同步进虚拟机，在其中运行
`pnpm openclaw qa slack`，在 VNC 浏览器中打开 Slack Web，捕获桌面，并将 Slack QA 构件（`slack-qa/`）和 VNC 截图/视频都复制回本地。这是唯一一种 SUT gateway 和浏览器都在同一台虚拟机内运行的 Mantis 形态。

使用 `--gateway-setup` 时，命令会在虚拟机的 `$HOME/.openclaw-mantis/slack-openclaw` 创建持久的一次性 OpenClaw
home，修补目标频道的 Slack Socket Mode 配置，启动
`openclaw gateway run --dev --allow-unconfigured --port 38973`，并让
Chrome 在 VNC 会话中保持运行；省略 `--gateway-setup` 时会改为运行普通的 bot 到 bot Slack QA 通道。

`--credential-source env` 所需的环境变量（本地默认是 `env`；角色默认是 `maintainer`）：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 远程模型通道需要 `OPENCLAW_LIVE_OPENAI_KEY`（如果本地只设置了 `OPENAI_API_KEY`，
  Mantis 会在调用 Crabbox 前将其复制到 `OPENCLAW_LIVE_OPENAI_KEY`）

使用 `--credential-source convex` 时，Mantis 会在创建虚拟机前从共享池租用 Slack SUT 凭证，并将频道 id、app token 和 bot token 作为 `OPENCLAW_MANTIS_SLACK_*` 环境变量转发到虚拟机中，因此 GitHub
workflow 只需要 Convex broker secret，而不需要原始 Slack token。

其他标志：`--slack-url <url>` 打开特定 URL（否则 Mantis 会从 `auth.test` 推导
`https://app.slack.com/client/<team>/<channel>`）；
`--slack-channel-id <id>` 设置 gateway allowlist 频道；
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制虚拟机内的持久 Chrome
profile（默认 `$HOME/.config/openclaw-mantis/slack-chrome-profile`）；
`--approval-checkpoints` 运行原生 Slack 审批场景
（`slack-approval-exec-native`、`slack-approval-plugin-native`），并渲染待处理/已解决 checkpoint 截图，而不是进行 gateway 设置（与 `--gateway-setup` 互斥）；`--hydrate-mode source|prehydrated`、
`--provider-mode`、`--model`、`--alt-model` 和 `--fast` 会传递给
Slack 实时通道。

审批 checkpoint 截图是根据场景观察到的 Slack API 消息渲染的，而不是实时 Slack UI；只有在租约的浏览器 profile 已登录时，`slack-desktop-smoke.png` 才能证明 Slack Web 本身。

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

租用或复用 Crabbox 桌面，安装原生 Linux Telegram Desktop，可选恢复用户会话归档，使用租用的 Telegram SUT bot token 配置 OpenClaw，启动
`openclaw gateway run --dev --allow-unconfigured --port 38974`，向租用的私有群组发布一条 driver-bot 就绪消息，然后捕获截图和 MP4。Bot token 只用于配置 OpenClaw；它绝不会登录
Telegram Desktop。桌面查看器是一个独立的 Telegram 用户会话，可从 `--telegram-profile-archive-env <name>` 恢复，或通过 VNC 手动登录并用 `--keep-lease` 保持存活。

标志：`--lease-id <cbx_...>` 会针对已登录 Telegram Desktop 的 VM 重新运行；`--telegram-profile-archive-env <name>` 会在启动前恢复 base64 `.tgz` 配置文件归档；`--telegram-profile-dir <remote-path>` 设置远程配置文件目录（默认 `$HOME/.local/share/TelegramDesktop`）；`--no-gateway-setup` 仅安装并打开 Telegram Desktop；`--credential-source`/`--credential-role` 默认是 `convex`/`maintainer`。

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

工件 `path` 相对于清单所在目录；`targetPath` 相对于配置的 R2/S3 工件前缀。`scripts/mantis/publish-pr-evidence.mjs` 会拒绝路径遍历，并在文件缺失时跳过带有 `"required": false` 的条目。

工件类型：`timeline`（确定性的前后对比截图）、`desktopScreenshot`（VNC/浏览器截图）、`motionPreview`（由录制生成的内联动画 GIF）、`motionClip`（运动裁剪后的 MP4）、`fullVideo`（完整录制）、`metadata`（JSON/日志旁路文件）、`report`（Markdown 报告）。

一次运行的磁盘工件布局：

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

截图是证据，不是密钥，但仍需要遵守脱敏规范：其中可能出现私有渠道名称、用户名或消息内容。为公共工件上传设置 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`；它在 Discord/Slack/Telegram GitHub 工作流中默认启用。

## GitHub 自动化

`scripts/mantis/publish-pr-evidence.mjs` 是可复用的发布器。工作流会用清单、目标 PR、工件目标根目录、评论标记、工件 URL、运行 URL 和请求来源调用它。它会把声明的工件上传到 Mantis R2 存储桶，构建摘要优先的 PR 评论，包含内联图片/预览和链接视频，然后更新现有标记评论或创建新评论。必需环境变量：

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`（工作流设置为 `openclaw-crabbox-artifacts`）
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`（工作流设置为 `auto`）
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`（工作流设置为 `https://artifacts.openclaw.ai`）

评论通过 Mantis GitHub App（`MANTIS_GITHUB_APP_ID` / `MANTIS_GITHUB_APP_PRIVATE_KEY`）发布，而不是 `github-actions[bot]`，并使用隐藏标记评论作为 upsert 键。

| 工作流                          | 触发器                                                                                    | 执行内容                                                                                                                                                                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | 手动分发                                                                            | 针对选定 ref 运行 `discord-smoke`。                                                                                                                                                                                                                                                  |
| `Mantis Discord Status Reactions` | PR 评论或手动分发                                                              | 构建独立的 baseline/candidate worktree，分别运行 `discord-status-reactions-tool-only`，在 Crabbox 桌面浏览器中渲染每个 lane 的时间线，用 `crabbox media preview` 生成运动裁剪后的 GIF/MP4 预览，上传工件，并发布内联 PR 证据。            |
| `Mantis Scenario`                 | 手动分发                                                                            | 通用分发器：接收 `scenario_id`（`discord-status-reactions-tool-only`、`discord-thread-reply-filepath-attachment`、`slack-desktop-smoke`、`telegram-live`、`telegram-desktop-proof`）、`baseline_ref`、`candidate_ref`、`pr_number`，并转发到匹配的场景工作流。 |
| `Mantis Slack Desktop Smoke`      | 手动分发                                                                            | 租用 Crabbox Linux 桌面（默认 `aws`，可选 `hetzner`），针对 candidate 运行 `slack-desktop-smoke --gateway-setup`，录制桌面，生成运动预览，上传工件，并在给出 PR 编号时发布 PR 证据。                                 |
| `Mantis Telegram Live`            | PR 评论或手动分发                                                              | 运行 bot-API Telegram 实时 QA lane（`openclaw qa telegram`），从 QA 摘要写入 `mantis-evidence.json`，通过 Crabbox 桌面浏览器渲染脱敏证据 HTML，生成运动 GIF，并发布 PR 证据。此 lane 不需要 Telegram Web 登录。          |
| `Mantis Telegram Desktop Proof`   | 维护者 PR 标签（`mantis: telegram-visible-proof`）加 PR 评论，或手动分发 | Agentic 原生 Telegram Desktop 前后对比证明。把 PR、baseline/candidate refs 和维护者指令交给 Codex，由它针对两个 ref 运行真实用户 Crabbox Telegram Desktop 证明 lane，并发布 2 列 PR 证据表。                                         |

`Mantis Discord Status Reactions` 和 `Mantis Telegram Live` 都接受 `baseline_ref`/`candidate_ref`（或 PR 评论中的 `baseline=`/`candidate=`），并在携带密钥凭据运行前验证解析出的 SHA 是 `origin/main` 的祖先、发布标签（`v*`），或打开 PR 的 head。

来自具有 write/maintain/admin 权限的 PR 的评论触发器：

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Telegram 评论触发器默认使用 PR head SHA 作为 candidate，并使用 `telegram-status-command` 作为场景；它们接受 `provider=aws|hetzner` 和 `lease=<cbx_...>`，用于指定特定 Crabbox 提供商或预热过的桌面。`Mantis Telegram Desktop Proof` 仅在 PR 已带有 `mantis: telegram-visible-proof` 标签时响应 PR 评论。

ClawSweeper 也可以直接分发场景：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## 机器和密钥

本地 CLI Crabbox 默认值是 `--provider hetzner --class beast`；可用 `--provider`、`--class`/`--machine-class`，或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS` 覆盖。GitHub 工作流通常会同时覆盖两者（例如 `--class standard`，以及 Slack 工作流的 `aws`/`hetzner` 提供商选择输入）。如果某个提供商太慢或不可用，请把它接到同一个 Crabbox 接口后面，而不是硬编码 fallback。

VM 基线：Linux，带可用于桌面的 Chrome/Chromium、CDP 访问、VNC/
noVNC、Node 22+ 和 pnpm、一个 OpenClaw checkout，并且可出站访问目标传输协议、GitHub、模型提供商和凭据代理。

Mantis 工作流中使用的密钥名称：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` 用于公共工件上传
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN`（工作流也接受 `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` 作为 fallback，并在调用 Crabbox 前把它们映射到普通名称）
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Mantis runner 绝不能打印 Discord/Slack/Telegram bot token、提供商 API key、浏览器 cookie、auth 配置文件内容、VNC 密码或原始凭据载荷。如果 token 泄露到 issue、PR、聊天或日志中，请在替换密钥存储后轮换它。

## 运行结果

场景会以两种可区分的方式之一失败，报告会将它们分开，这样不稳定环境不会被解读为产品回归：

- **复现 Bug**：baseline 按场景预期的方式失败。
- **Harness 失败**：环境设置、凭据、传输 API、浏览器或提供商在 oracle 有意义之前失败。

## 添加场景

场景按传输协议以 TypeScript 定义（Discord 前后对比形状见 `extensions/qa-lab/src/mantis/run.runtime.ts` 中的 `MANTIS_SCENARIO_CONFIGS`），不是独立的声明式文件格式。每个场景需要：ID 和标题、传输协议、所需凭据、baseline ref 策略、candidate ref 策略、OpenClaw 配置补丁、设置/刺激步骤、预期 baseline 和 candidate oracle、视觉捕获目标、超时预算以及清理步骤。

优先使用小型、类型化的 oracle，而不是视觉检查：Discord 表情回应状态或消息引用、Slack thread `ts`/reaction API 状态、电子邮件消息 ID 和标头。仅在 UI 是唯一可靠可观察对象时使用浏览器截图；如果存在平台 API oracle，则让视觉检查作为它的补充。

在 Discord、Slack 和 Telegram 之后，同一个 runner 形状可扩展到 WhatsApp（QR 登录、重新识别、投递、媒体、表情回应）和 Matrix（加密房间、thread/reply 关系、重启恢复）；两者目前尚未实现。

## 未决问题

- 复用现有 Mantis bot 时，哪个 Discord bot 应该作为 driver，哪个应该作为 SUT？
- GitHub 应该为 PR 保留 Mantis 工件多久？
- ClawSweeper 应该何时自动推荐 Mantis 场景，而不是等待维护者命令？
- 公共 PR 上传前是否应该对截图进行脱敏或裁剪？
