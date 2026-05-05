---
read_when:
    - 了解 QA 栈如何协同工作
    - 扩展 qa-lab、qa-channel 或传输适配器
    - 添加基于仓库的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实度的 QA 自动化
summary: QA 堆栈概览：qa-lab、qa-channel、仓库支持的场景、实时传输通道、传输适配器和报告。
title: QA overview
x-i18n:
    generated_at: "2026-05-05T00:43:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01cc3543a10a8ea3a7ea3a135e95ae0ea0c6e983e6b30c35aab1f74c13d7f4a3
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 栈旨在以比单个单元测试更真实、更贴近渠道形态的方式测试 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，包含私信、渠道、线程、表情回应、编辑和删除界面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察转录、注入入站消息，以及导出 Markdown 报告。
- `extensions/qa-matrix`、未来的运行器插件：实时传输适配器，在子 QA Gateway 网关内驱动真实渠道。
- `qa/`：由仓库提供的启动任务种子资源和基线 QA 场景。
- [Mantis](/zh-CN/concepts/mantis)：针对需要真实传输、浏览器截图、VM 状态和 PR 证据的错误进行前后实时验证。

## 命令接口

每个 QA 流程都在 `pnpm openclaw qa <subcommand>` 下运行。许多命令有 `pnpm qa:*` 脚本别名；两种形式都受支持。

| 命令                                                | 用途                                                                                                                                                                                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 内置 QA 自检；写入 Markdown 报告。                                                                                                                                                                        |
| `qa suite`                                          | 针对 QA Gateway 网关通道运行仓库支持的场景。别名：`pnpm openclaw qa suite --runner multipass`，用于一次性 Linux VM。                                                                                      |
| `qa coverage`                                       | 打印 Markdown 场景覆盖清单（`--json` 用于机器输出）。                                                                                                                                                     |
| `qa parity-report`                                  | 比较两个 `qa-suite-summary.json` 文件并写入智能体一致性报告。                                                                                                                                             |
| `qa character-eval`                                 | 跨多个实时模型运行角色 QA 场景，并生成评审报告。参见[报告](#reporting)。                                                                                                                                  |
| `qa manual`                                         | 针对所选提供商/模型通道运行一次性提示。                                                                                                                                                                  |
| `qa ui`                                             | 启动 QA 调试器 UI 和本地 QA 总线（别名：`pnpm qa:lab:ui`）。                                                                                                                                              |
| `qa docker-build-image`                             | 构建预烘焙的 QA Docker 镜像。                                                                                                                                                                            |
| `qa docker-scaffold`                                | 为 QA 仪表盘 + Gateway 网关通道写入 docker-compose 脚手架。                                                                                                                                              |
| `qa up`                                             | 构建 QA 站点，启动 Docker 支持的栈，并打印 URL（别名：`pnpm qa:lab:up`；`:fast` 变体会添加 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                       |
| `qa aimock`                                         | 仅启动 AIMock provider 服务器。                                                                                                                                                                          |
| `qa mock-openai`                                    | 仅启动感知场景的 `mock-openai` provider 服务器。                                                                                                                                                         |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享 Convex 凭证池。                                                                                                                                                                                 |
| `qa matrix`                                         | 针对一次性 Tuwunel homeserver 的实时传输通道。参见 [Matrix QA](/zh-CN/concepts/qa-matrix)。                                                                                                                     |
| `qa telegram`                                       | 针对真实私有 Telegram 群组的实时传输通道。                                                                                                                                                               |
| `qa discord`                                        | 针对真实私有 Discord guild 渠道的实时传输通道。                                                                                                                                                          |
| `qa slack`                                          | 针对真实私有 Slack 渠道的实时传输通道。                                                                                                                                                                  |
| `qa mantis`                                         | 用于实时传输错误的前后验证运行器，包含 Discord 状态表情回应证据、Crabbox 桌面/浏览器冒烟测试，以及 VNC 中的 Slack 冒烟测试。参见 [Mantis](/zh-CN/concepts/mantis)。 |

## 操作员流程

当前 QA 操作员流程是一个双栏 QA 站点：

- 左侧：包含智能体的 Gateway 网关仪表盘（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的转录和场景计划。

运行方式：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点，启动 Docker 支持的 Gateway 网关通道，并公开 QA Lab 页面，操作员或自动化循环可以在其中向智能体交付 QA 任务、观察真实渠道行为，并记录哪些有效、失败或仍被阻塞。

为了在不每次重建 Docker 镜像的情况下更快迭代 QA Lab UI，可以使用绑定挂载的 QA Lab 包启动栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务使用预构建镜像，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重建该包，浏览器会在 QA Lab 资源哈希变化时自动重新加载。

要进行本地 OpenTelemetry trace 冒烟测试，运行：

```bash
pnpm qa:otel:smoke
```

该脚本会启动本地 OTLP/HTTP trace 接收器，在启用 `diagnostics-otel` 插件的情况下运行 `otel-trace-smoke` QA 场景，然后解码导出的 protobuf spans，并断言发布关键形态：必须存在 `openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、`openclaw.context.assembled` 和 `openclaw.message.delivery`；模型调用在成功轮次中不得导出 `StreamAbandoned`；原始诊断 ID 和 `openclaw.content.*` 属性必须保留在 trace 之外。它会在 QA suite 工件旁写入 `otel-smoke-summary.json`。

可观测性 QA 仅限源代码检出。npm tarball 会有意省略 QA Lab，因此包 Docker 发布通道不会运行 `qa` 命令。更改诊断 instrumentation 时，请从构建后的源代码检出中使用 `pnpm qa:otel:smoke`。

要运行真实传输的 Matrix 冒烟通道，运行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

此通道的完整 CLI 参考、profile/场景目录、环境变量和工件布局位于 [Matrix QA](/zh-CN/concepts/qa-matrix)。概览：它会在 Docker 中配置一次性 Tuwunel homeserver，注册临时 driver/SUT/observer 用户，在限定到该传输的子 QA Gateway 网关内运行真实 Matrix 插件（没有 `qa-channel`），然后在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下写入 Markdown 报告、JSON 摘要、observed-events 工件和合并输出日志。

要运行真实传输的 Telegram、Discord 和 Slack 冒烟通道：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

它们面向一个预先存在的真实渠道，使用两个 bot（driver + SUT）。所需环境变量、场景列表、输出工件和 Convex 凭证池记录在下面的 [Telegram、Discord 和 Slack QA 参考](#telegram-discord-and-slack-qa-reference)中。

要运行带 VNC 救援的完整 Slack 桌面 VM：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

该命令会租用一台 Crabbox 桌面/浏览器机器，在 VM 内运行 Slack 实时通道，在 VNC 浏览器中打开 Slack Web，捕获桌面，并将 `slack-qa/` 和 `slack-desktop-smoke.png` 复制回 Mantis 工件目录。通过 VNC 手动登录 Slack Web 后，可复用 `--lease-id <cbx_...>`。使用 `--gateway-setup` 时，Mantis 会在 VM 内的 `38973` 端口保留一个持久运行的 OpenClaw Slack Gateway 网关；不使用它时，该命令会运行普通的 bot 到 bot Slack QA 通道，并在捕获工件后退出。

使用池化实时凭证前，运行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 会检查 Convex broker 环境，验证端点设置，并在 maintainer secret 存在时验证 admin/list 可达性。它只报告 secret 的已设置/缺失状态。

## 实时传输覆盖范围

实时传输通道共享一个契约，而不是各自发明自己的场景列表形态。`qa-channel` 是覆盖面较广的合成产品行为套件，不属于实时传输覆盖矩阵。

| 通道     | Canary | 提及门控 | Bot 到 bot | Allowlist block | 顶层回复 | 重启恢复 | 线程跟进 | 线程隔离 | 表情回应观察 | 帮助命令 | 原生命令注册 |
| -------- | ------ | -------- | ---------- | --------------- | -------- | -------- | -------- | -------- | ------------ | -------- | ------------ |
| Matrix   | x      | x        | x          | x               | x        | x        | x        | x        | x            |          |              |
| Telegram | x      | x        | x          |                 |          |          |          |          |              | x        |              |
| Discord  | x      | x        | x          |                 |          |          |          |          |              |          | x            |
| Slack    | x      | x        | x          |                 |          |          |          |          |              |          |              |

这会让 `qa-channel` 保持为覆盖面较广的产品行为套件，同时 Matrix、Telegram 和未来的实时传输共享一个明确的传输契约检查清单。

要运行不把 Docker 带入 QA 路径的一次性 Linux VM 通道，运行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass 客户机，安装依赖，在客户机内构建 OpenClaw，运行 `qa suite`，然后把常规 QA 报告和摘要复制回主机上的 `.artifacts/qa-e2e/...`。
它复用与主机上 `qa suite` 相同的场景选择行为。
默认情况下，主机和 Multipass 套件运行会通过隔离的 Gateway 网关工作进程并行执行多个选中的场景。`qa-channel` 默认并发数为 4，并受选中场景数量限制。使用 `--concurrency <count>` 调整工作进程数量，或使用 `--concurrency 1` 进行串行执行。
当任何场景失败时，该命令会以非零状态退出。如果你想生成产物但不希望退出码失败，请使用 `--allow-failures`。
实时运行会转发客户机可实际使用的受支持 QA 身份验证输入：基于环境变量的提供商密钥、QA 实时提供商配置路径，以及存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，这样客户机就能通过挂载的工作区写回。

## Telegram、Discord 和 Slack QA 参考

Matrix 因场景数量和基于 Docker 的 homeserver 预配而有一个[专用页面](/zh-CN/concepts/qa-matrix)。Telegram、Discord 和 Slack 较小，每个只有少量场景，没有配置文件系统，并针对预先存在的真实渠道，因此其参考内容放在这里。

### 共享 CLI 标志

这些通道通过 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 注册，并接受相同的标志：

| 标志                                  | 默认值                                                          | 描述                                                                                                                |
| ------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | 只运行此场景。可重复使用。                                                                                         |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | 写入报告、摘要、观测到的消息和输出日志的位置。相对路径会基于 `--repo-root` 解析。                                  |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 从中立 cwd 调用时使用的仓库根目录。                                                                                |
| `--sut-account <id>`                  | `sut`                                                           | QA Gateway 网关配置中的临时账号 id。                                                                               |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` 或 `live-frontier`（旧版 `live-openai` 仍可使用）。                                                   |
| `--model <ref>` / `--alt-model <ref>` | 提供商默认值                                                    | 主模型/备用模型引用。                                                                                              |
| `--fast`                              | 关闭                                                            | 在受支持的位置启用提供商快速模式。                                                                                 |
| `--credential-source <env\|convex>`   | `env`                                                           | 参见 [Convex 凭据池](#convex-credential-pool)。                                                                    |
| `--credential-role <maintainer\|ci>`  | CI 中为 `ci`，否则为 `maintainer`                               | 使用 `--credential-source convex` 时采用的角色。                                                                    |

任何场景失败时，每个通道都会以非零状态退出。`--allow-failures` 会写入产物，但不会设置失败退出码。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目标是一个真实的私有 Telegram 群组，其中包含两个不同的 bot（驱动 + SUT）。SUT bot 必须有 Telegram 用户名；当两个 bot 都在 `@BotFather` 中启用 **Bot-to-Bot Communication Mode** 时，bot 到 bot 的观测效果最好。

使用 `--credential-source env` 时所需的环境变量：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 数字聊天 id（字符串）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

可选：

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` 会在观测消息产物中保留消息正文（默认会脱敏）。

场景（`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`）：

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

输出产物：

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — 从 canary 开始，包含每条回复的 RTT（驱动发送 → 观测到 SUT 回复）。
- `telegram-qa-observed-messages.json` — 除非设置 `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`，否则正文会被脱敏。

### Discord QA

```bash
pnpm openclaw qa discord
```

目标是一个真实的私有 Discord guild 频道，其中包含两个 bot：由 harness 控制的驱动 bot，以及由子 OpenClaw Gateway 网关通过内置 Discord 插件启动的 SUT bot。它会验证频道提及处理、SUT bot 已向 Discord 注册原生 `/help` 命令，以及可选择启用的 Mantis 证据场景。

使用 `--credential-source env` 时所需的环境变量：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — 必须匹配 Discord 返回的 SUT bot 用户 id（否则该通道会快速失败）。

可选：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 会在观测消息产物中保留消息正文。

场景（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — 可选择启用的 Mantis 场景。它会单独运行，因为它会将 SUT 切换为始终开启、仅工具的 guild 回复，并设置 `messages.statusReactions.enabled=true`，然后捕获 REST reaction 时间线以及 HTML/PNG 可视化产物。

显式运行 Mantis 状态 reaction 场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

输出产物：

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — 除非设置 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否则正文会被脱敏。
- 运行状态 reaction 场景时，会生成 `discord-qa-reaction-timelines.json` 和 `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

目标是一个真实的私有 Slack 频道，其中包含两个不同的 bot：由 harness 控制的驱动 bot，以及由子 OpenClaw Gateway 网关通过内置 Slack 插件启动的 SUT bot。

使用 `--credential-source env` 时所需的环境变量：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

可选：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 会在观测消息产物中保留消息正文。

场景（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`）：

- `slack-canary`
- `slack-mention-gating`

输出产物：

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — 除非设置 `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`，否则正文会被脱敏。

#### 设置 Slack 工作区

该通道需要在一个工作区中有两个不同的 Slack 应用，外加一个两个 bot 都是成员的频道：

- `channelId` — 两个 bot 都已受邀加入的频道的 `Cxxxxxxxxxx` id。请使用专用频道；该通道每次运行都会发帖。
- `driverBotToken` — **Driver** 应用的 bot token（`xoxb-...`）。
- `sutBotToken` — **SUT** 应用的 bot token（`xoxb-...`），它必须是不同于驱动的单独 Slack 应用，以确保其 bot 用户 id 不同。
- `sutAppToken` — SUT 应用的应用级 token（`xapp-...`），带有 `connections:write`，Socket Mode 会使用它让 SUT 应用接收事件。

建议使用专门用于 QA 的 Slack 工作区，而不是复用生产工作区。

**1. 创建 Driver 应用**

前往 [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → 选择 QA 工作区，粘贴以下清单，然后执行 _Install to Workspace_：

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

复制 _Bot User OAuth Token_（`xoxb-...`）—— 它就是 `driverBotToken`。驱动只需要发消息并识别自己；不需要事件，也不需要 Socket Mode。

**2. 创建 SUT 应用**

在同一工作区中重复 _Create New App → From a manifest_。scope 集合与内置 Slack 插件的生产安装一致（`extensions/slack/src/setup-shared.ts:10`）：

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Slack 创建应用后，在其设置页面完成两件事：

- _Install to Workspace_ → 复制 _Bot User OAuth Token_ → 它就是 `sutBotToken`。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 添加 scope `connections:write` → 保存 → 复制 `xapp-...` 值 → 它就是 `sutAppToken`。

通过分别对每个 token 调用 `auth.test`，验证两个 bot 的用户 id 不同。运行时会通过用户 id 区分驱动和 SUT；将一个应用同时用于两者会导致 mention-gating 立即失败。

**3. 创建频道**

在 QA 工作区中创建一个频道（例如 `#openclaw-qa`），并从频道内邀请两个 bot：

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

从 _channel info → About → Channel ID_ 复制 `Cxxxxxxxxxx` ID，它会成为 `channelId`。公共频道可以使用；如果你使用私有频道，两个应用都已经有 `groups:history`，因此 harness 的历史读取仍会成功。

**4. 注册凭证**

有两种选项。单机调试使用环境变量（设置四个 `OPENCLAW_QA_SLACK_*` 变量并传入 `--credential-source env`），或者填充共享的 Convex 池，让 CI 和其他维护者可以租用它们。

对于 Convex 池，将四个字段写入 JSON 文件：

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

在你的 shell 中导出 `OPENCLAW_QA_CONVEX_SITE_URL` 和 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 后，注册并验证：

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

预期 `count: 1`、`status: "active"`，且没有 `lease` 字段。

**5. 端到端验证**

在本地运行该 lane，以确认两个机器人都能通过 broker 相互通信：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

绿色运行会在远少于 30 秒内完成，且 `slack-qa-report.md` 显示 `slack-canary` 和 `slack-mention-gating` 的 Status 都是 `pass`。如果 lane 挂起约 90 秒并以 `Convex credential pool exhausted for kind "slack"` 退出，说明池为空或每一行都已被租用，`qa credentials list --kind slack --status all --json` 会告诉你是哪一种情况。

### Convex 凭证池

Telegram、Discord 和 Slack lane 可以从共享 Convex 池租用凭证，而不是读取上面的环境变量。传入 `--credential-source convex`（或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 会获取一个独占租约，在运行期间发送 Heartbeat，并在关闭时释放它。池类型是 `"telegram"`、`"discord"` 和 `"slack"`。

broker 在 `admin/add` 上验证的 payload 形状：

- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string, sutToken: string }`，`groupId` 必须是数字 chat-id 字符串。
- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Slack（`kind: "slack"`）：`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`，`channelId` 必须匹配 `^[A-Z][A-Z0-9]+$`（例如 `Cxxxxxxxxxx` 这样的 Slack ID）。有关应用和 scope 配置，请参阅[设置 Slack 工作区](#setting-up-the-slack-workspace)。

操作环境变量和 Convex broker 端点契约位于[测试 → 通过 Convex 共享 Telegram 凭证](/zh-CN/help/testing#shared-telegram-credentials-via-convex-v1)（该章节名称早于 Discord 支持；两种类型的 broker 语义相同）。

## 仓库支持的种子

种子资产位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些内容有意放在 git 中，这样 QA 计划对人类和智能体都可见。

`qa-lab` 应保持为通用的 Markdown runner。每个场景 Markdown 文件都是一次测试运行的事实来源，并应定义：

- 场景元数据
- 可选的 category、capability、lane 和 risk 元数据
- 文档和代码引用
- 可选的插件要求
- 可选的 Gateway 网关配置补丁
- 可执行的 `qa-flow`

支持 `qa-flow` 的可复用运行时表面允许保持通用且跨领域。例如，Markdown 场景可以把传输侧 helper 与浏览器侧 helper 结合起来，通过 Gateway 网关 `browser.request` seam 驱动嵌入式 Control UI，而无需添加特殊情况 runner。

场景文件应按产品能力分组，而不是按源码树文件夹分组。文件移动时保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 进行实现可追溯性。

基线列表应保持足够广，以覆盖：

- 私信和渠道聊天
- 线程行为
- 消息操作生命周期
- cron 回调
- 记忆召回
- 模型切换
- subagent 移交
- 仓库读取和文档读取
- 一个小型构建任务，例如 Lobster Invaders

## 提供商 mock lane

`qa suite` 有两个本地提供商 mock lane：

- `mock-openai` 是感知场景的 OpenClaw mock。它仍然是仓库支持 QA 和 parity gate 的默认确定性 mock lane。
- `aimock` 会启动一个由 AIMock 支持的提供商服务器，用于实验性协议、fixture、record/replay 和 chaos 覆盖。它是增量能力，不会替代 `mock-openai` 场景 dispatcher。

提供商 lane 实现位于 `extensions/qa-lab/src/providers/` 下。每个提供商拥有自己的默认值、本地服务器启动、Gateway 网关模型配置、auth-profile 暂存需求以及 live/mock 能力标志。共享 suite 和 Gateway 网关代码应通过提供商 registry 路由，而不是按提供商名称分支。

## 传输适配器

`qa-lab` 为 Markdown QA 场景拥有一个通用传输 seam。`qa-channel` 是该 seam 上的第一个适配器，但设计目标更广：未来的真实或合成渠道应接入同一个 suite runner，而不是添加传输专用的 QA runner。

在架构层面，拆分如下：

- `qa-lab` 拥有通用场景执行、worker 并发、工件写入和报告。
- 传输适配器拥有 Gateway 网关配置、就绪状态、入站和出站观测、传输操作以及规范化传输状态。
- `qa/scenarios/` 下的 Markdown 场景文件定义测试运行；`qa-lab` 提供执行它们的可复用运行时表面。

### 添加渠道

向 Markdown QA 系统添加渠道只需要两件事：

1. 该渠道的传输适配器。
2. 覆盖该渠道契约的场景包。

当共享 `qa-lab` host 可以拥有该流程时，不要添加新的顶层 QA command root。

`qa-lab` 拥有共享 host 机制：

- `openclaw qa` command root
- suite 启动和 teardown
- worker 并发
- 工件写入
- 报告生成
- 场景执行
- 旧版 `qa-channel` 场景的兼容别名

Runner 插件拥有传输契约：

- `openclaw qa <runner>` 如何挂载到共享 `qa` root 下
- 如何为该传输配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观测出站消息
- 如何暴露 transcript 和规范化传输状态
- 如何执行传输支持的操作
- 如何处理传输专用 reset 或 cleanup

新渠道的最低采用门槛：

1. 保持 `qa-lab` 作为共享 `qa` root 的所有者。
2. 在共享 `qa-lab` host seam 上实现传输 runner。
3. 将传输专用机制保留在 runner 插件或渠道 harness 内。
4. 将 runner 挂载为 `openclaw qa <runner>`，而不是注册竞争性的 root command。Runner 插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。保持 `runtime-api.ts` 轻量；惰性 CLI 和 runner 执行应保留在单独入口点之后。
5. 在按主题组织的 `qa/scenarios/` 目录下编写或适配 Markdown 场景。
6. 对新场景使用通用场景 helper。
7. 保持现有兼容别名可用，除非仓库正在进行有意的迁移。

决策规则很严格：

- 如果行为可以在 `qa-lab` 中表达一次，就把它放在 `qa-lab` 中。
- 如果行为依赖一个渠道传输，就把它保留在该 runner 插件或插件 harness 中。
- 如果某个场景需要多个渠道都可使用的新能力，就添加通用 helper，而不是在 `suite.ts` 中添加渠道专用分支。
- 如果某个行为只对一个传输有意义，就保持场景传输专用，并在场景契约中明确说明。

### 场景 helper 名称

新场景首选的通用 helper：

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

兼容别名仍可用于现有场景：`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus`，但新场景编写应使用通用名称。这些别名用于避免一次性强制迁移，不代表未来的模型。

## 报告

`qa-lab` 会从观测到的 bus timeline 导出 Markdown 协议报告。报告应回答：

- 哪些有效
- 哪些失败
- 哪些仍被阻塞
- 哪些后续场景值得添加

要查看可用场景清单（在评估后续工作规模或接入新传输时很有用），运行 `pnpm openclaw qa coverage`（添加 `--json` 可获得机器可读输出）。

对于角色和风格检查，在多个 live 模型 ref 上运行同一个场景，并写入经过评审的 Markdown 报告：

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

该命令运行本地 QA Gateway 网关子进程，而不是 Docker。角色评估场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，例如聊天、工作区帮助和小型文件任务。不应告诉候选模型它正在被评估。该命令会保留每个完整 transcript，记录基本运行统计，然后要求 judge 模型使用 fast mode，并在支持时使用 `xhigh` reasoning，按自然度、vibe 和幽默感对运行结果排名。比较提供商时使用 `--blind-judge-models`：judge prompt 仍会获得每个 transcript 和运行状态，但候选 ref 会替换为 `candidate-01` 等中性标签；报告会在解析后将排名映射回真实 ref。

候选运行默认使用 `high` thinking，GPT-5.5 使用 `medium`，支持它的旧版 OpenAI eval ref 使用 `xhigh`。使用 `--model provider/model,thinking=<level>` 内联覆盖特定候选。`--thinking <level>` 仍会设置全局 fallback，旧的 `--model-thinking <provider/model=level>` 形式保留用于兼容。

OpenAI 候选 ref 默认启用 fast mode，因此在提供商支持时会使用 priority processing。当单个候选或 judge 需要覆盖时，内联添加 `,fast`、`,no-fast` 或 `,fast=false`。只有当你想为每个候选模型强制开启 fast mode 时，才传入 `--fast`。候选和 judge 的持续时间会记录在报告中用于 benchmark 分析，但 judge prompt 会明确说明不要按速度排名。

候选和 judge 模型运行的默认并发均为 16。当提供商限制或本地 Gateway 网关压力使运行噪声过大时，降低 `--concurrency` 或 `--judge-concurrency`。

未传入候选 `--model` 时，角色评估默认使用 `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。

未传入 `--judge-model` 时，judge 默认使用 `openai/gpt-5.5,thinking=xhigh,fast` 和 `anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [Matrix QA](/zh-CN/concepts/qa-matrix)
- [QA channel](/zh-CN/channels/qa-channel)
- [测试](/zh-CN/help/testing)
- [仪表板](/zh-CN/web/dashboard)
