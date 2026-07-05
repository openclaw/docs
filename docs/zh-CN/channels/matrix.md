---
read_when:
    - 在 OpenClaw 中设置 Matrix
    - 配置 Matrix E2EE 和验证
summary: Matrix 支持状态、设置和配置示例
title: Matrix
x-i18n:
    generated_at: "2026-07-05T11:02:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42f1775d1f92198d1eafdd8f3e07fcb6921bdc4a5c095ce3e793c260e037e06f
    source_path: channels/matrix.md
    workflow: 16
---

Matrix 是一个可下载的渠道插件（`@openclaw/matrix`），基于官方 `matrix-js-sdk` 构建。它支持私信、房间、线程、媒体、表情回应、投票、位置和 E2EE。

## 安装

```bash
openclaw plugins install @openclaw/matrix
```

裸插件规格会先尝试 ClawHub，然后回退到 npm。使用 `openclaw plugins install clawhub:@openclaw/matrix` 或 `npm:@openclaw/matrix` 强制指定来源。从本地检出安装：`openclaw plugins install ./path/to/local/matrix-plugin`。

`plugins install` 会注册并启用插件；不需要单独的 `enable` 步骤。在完成下面的配置之前，该渠道仍不会执行任何操作。查看 [插件](/zh-CN/tools/plugin) 了解通用安装规则。

## 设置

1. 在你的 homeserver 上创建一个 Matrix 账号。
2. 使用 `homeserver` + `accessToken`，或 `homeserver` + `userId` + `password` 配置 `channels.matrix`。
3. 重启 Gateway 网关。
4. 与该 bot 开始私信，或邀请它加入房间。只有当 [`autoJoin`](#auto-join) 允许时，新的邀请才会生效。

### 交互式设置

```bash
openclaw channels add
openclaw configure --section channels
```

向导会询问 homeserver URL、认证方法（token 或密码）、用户 ID（仅密码认证）、可选设备名称、是否启用 E2EE，以及房间访问/自动加入。如果匹配的 `MATRIX_*` 环境变量已存在，并且该账号没有已保存的认证信息，向导会提供环境变量快捷方式。在保存允许列表前，使用 `openclaw channels resolve --channel matrix "Project Room"` 解析房间名称。在向导中启用 E2EE 会运行与 [`openclaw matrix encryption setup`](#encryption-and-verification) 相同的引导流程。

### 最小配置

基于 token：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

基于密码（首次登录后会缓存 token）：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

### 自动加入

`channels.matrix.autoJoin` 默认为 `"off"`：在你手动加入之前，该 bot 不会出现在来自新邀请的新房间或私信中。OpenClaw 无法在收到邀请时判断邀请是私信还是群组，因此每个邀请都会先经过 `autoJoin`；`dm.policy` 只会在之后应用，也就是 bot 加入并且房间完成分类之后。

<Warning>
设置 `autoJoin: "allowlist"` 加上 `autoJoinAllowlist` 来限制接受的邀请，或设置 `autoJoin: "always"` 来接受每个邀请。

`autoJoinAllowlist` 只接受 `!roomId:server`、`#alias:server` 或 `*`。纯房间名称会被拒绝；别名会根据 homeserver 解析，而不是根据被邀请房间声称的状态解析。
</Warning>

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": { requireMention: true },
      },
    },
  },
}
```

### 允许列表目标格式

- 私信（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）：使用 `@user:server`。默认会忽略显示名称（可变）；仅在明确需要显示名称兼容性时设置 `dangerouslyAllowNameMatching: true`。
- 房间允许列表键（`groups`，旧版别名 `rooms`）：使用 `!room:server` 或 `#alias:server`。除非设置了 `dangerouslyAllowNameMatching: true`，否则会忽略纯名称。
- 邀请允许列表（`autoJoinAllowlist`）：使用 `!room:server`、`#alias:server` 或 `*`。纯名称始终会被拒绝。

### 账号 ID 规范化

向导会将易读名称转换为规范化账号 ID（`Ops Bot` -> `ops-bot`）。在作用域环境变量名称中，标点符号会以十六进制转义，因此账号不会发生冲突：`-`（0x2D）会变成 `_X2D_`，所以 `ops-prod` 会映射到环境变量前缀 `MATRIX_OPS_X2D_PROD_`。

### 缓存的凭据

Matrix 会在 `~/.openclaw/credentials/matrix/` 下缓存凭据：默认账号使用 `credentials.json`，具名账号使用 `credentials-<account>.json`。当存在缓存凭据时，即使配置文件中没有 `accessToken`，OpenClaw 也会将 Matrix 视为已配置 - 这涵盖设置、`openclaw doctor` 和渠道状态探测。

### 环境变量

由配置键支持的环境变量，在等效配置键未设置时使用。默认账户使用无前缀名称；命名账户会在后缀前插入账户令牌（参见[规范化](#account-id-normalization)）。

| 默认账户              | 命名账户（`<ID>` = 账户令牌）       |
| --------------------- | -------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

对于账户 `ops`，名称会变成 `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN`，依此类推。`MATRIX_HOMESERVER`（以及任何限定范围的 `*_HOMESERVER` 变体）不能从工作区 `.env` 设置；参见[工作区 `.env` 文件](/zh-CN/gateway/security)。

<Note>
恢复密钥不是由配置支持的环境变量：OpenClaw 永远不会自行从环境中读取它。CLI 指引文本建议通过名为 `MATRIX_RECOVERY_KEY` 的 shell 变量为默认账户传入，或通过 `MATRIX_RECOVERY_KEY_<ID>`（普通大写账户 ID，不做十六进制转义）为命名账户传入 - 参见[使用恢复密钥验证此设备](#verify-this-device-with-a-recovery-key)。
</Note>

## 配置示例

一个包含私信配对、房间允许列表和 E2EE 的实用基线：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

## 流式预览

Matrix 回复流式传输是选择性启用的。`streaming` 控制 OpenClaw 如何交付进行中的助手回复；`blockStreaming` 控制每个已完成的块是否保留为自己的 Matrix 消息。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

若要保留实时回答预览但隐藏临时工具/进度行，请使用对象形式：

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "partial",
        preview: {
          toolProgress: false,
        },
      },
    },
  },
}
```

完整对象形式接受 `{ mode, preview, progress }`：

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // pick from configured or built-in labels (false to hide)
          labels: ["Thinking", "Writing", "Searching"], // candidates for label: "auto"
          maxLines: 8, // max rolling progress lines (default: 8)
          maxLineChars: 120, // max chars per line before truncation (default: 120)
          toolProgress: true, // show tool/progress activity (default: true)
        },
      },
    },
  },
}
```

- `progress.label`：自定义标签，`"auto"`/未设置表示选择一个已配置或内置标签，或设为 `false` 来隐藏。
- `progress.labels`：仅当 `label` 为 `"auto"` 或未设置时使用的候选项。
- `progress.maxLines`：草稿中保留的最大滚动进度行数；更早的行会在超过该数量后被裁剪。
- `progress.maxLineChars`：每条紧凑进度行在截断前的最大字符数。
- `progress.toolProgress`：为 `true`（默认）时，实时工具/进度活动会显示在草稿中。

| `streaming`       | 行为                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（默认） | 等待完整回复，然后一次性发送。`true` <-> `"partial"`，`false` <-> `"off"`。                                                                         |
| `"partial"`       | 在模型写入当前块时，就地编辑一条普通文本消息。常见客户端可能会在首次预览时通知，而不是在最终编辑时通知。          |
| `"quiet"`         | 与 `"partial"` 相同，但消息是不触发通知的 notice。一旦按用户配置的推送规则匹配最终编辑，接收者就会收到通知（见下文）。 |
| `"progress"`      | 使用进度草稿发送单独的紧凑进度行。                                                                                          |

`blockStreaming`（默认 `false`）独立于 `streaming`：

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false`（默认）                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 当前块使用实时草稿，已完成的块保留为消息 | 当前块使用实时草稿，并就地定稿 |
| `"off"`                 | 每个完成的块发送一条触发通知的 Matrix 消息                     | 完整回复发送一条触发通知的 Matrix 消息      |

说明：

- 如果预览超过 Matrix 的单事件大小限制，OpenClaw 会停止预览流式传输，并回退为仅最终交付。
- 媒体回复始终正常发送附件；如果陈旧预览无法安全复用，OpenClaw 会在发送最终媒体回复前将其涂黑。
- 预览流式传输启用时，工具进度预览更新默认开启。设置 `streaming.preview.toolProgress: false` 可保留回答文本的预览编辑，但让工具进度继续走正常交付路径。
- 预览编辑会消耗额外的 Matrix API 调用。若要使用最保守的速率限制配置，请保持 `streaming: "off"`。

## 语音消息

入站 Matrix 语音便笺会在房间提及门禁前转录，因此说出 Bot 名称的语音便笺可以在 `requireMention: true` 房间中触发智能体，并且智能体会收到转录文本，而不只是音频附件占位符。

Matrix 使用 `tools.media.audio` 下的共享音频媒体提供商，例如 OpenAI `gpt-4o-mini-transcribe`。提供商设置和限制请参见[媒体工具概览](/zh-CN/tools/media-overview)。

- `m.audio` 事件和 MIME 类型为 `audio/*` 的 `m.file` 事件符合条件。
- 在加密房间中，OpenClaw 会先通过现有 Matrix 媒体路径解密附件，然后再转录。
- 转录文本会在智能体提示中标记为机器生成且不可信。
- 附件会标记为已转录，因此下游媒体工具不会再次转录它。
- 设置 `tools.media.audio.enabled: false` 可全局禁用音频转录。

## 审批元数据

Matrix 原生审批提示是普通的 `m.room.message` 事件，OpenClaw 特定内容位于 `com.openclaw.approval` 键下。常见客户端仍会渲染文本正文；支持 OpenClaw 的客户端可以读取结构化审批 ID、类型、状态、决策以及 Exec/插件详情。

当提示过长而无法放入一个 Matrix 事件时，OpenClaw 会将可见文本分块，并仅将 `com.openclaw.approval` 附加到第一个块。允许/拒绝表情回应绑定到该第一个事件，因此长提示会与单事件提示保持相同的审批目标。

### 自托管静默 finalized 预览的推送规则

`streaming: "quiet"` 只会在分块或轮次 finalized 后通知接收者 - 必须有一条按用户设置的推送规则匹配 finalized 预览标记。完整配置请参阅 [Matrix 静默预览推送规则](/zh-CN/channels/matrix-push-rules)。

## Bot 到 bot 房间

默认情况下，来自其他已配置 OpenClaw Matrix 账号的 Matrix 消息会被忽略。使用 `allowBots` 可有意允许智能体之间的流量：

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` 会在允许的房间和私信中接受来自其他已配置 Matrix bot 账号的消息。
- `allowBots: "mentions"` 仅当这些消息在房间中可见地提及此 bot 时才接受；私信仍会一律允许。
- `groups.<room>.allowBots` 会为单个房间覆盖账号级设置。
- 已接受的已配置 bot 消息使用共享的 [bot 循环保护](/zh-CN/channels/bot-loop-protection)。先配置 `channels.defaults.botLoopProtection`，再用 `channels.matrix.botLoopProtection` 按账号覆盖，或用 `channels.matrix.groups.<room>.botLoopProtection` 按房间覆盖。
- OpenClaw 仍会忽略来自同一 Matrix 用户 ID 的消息，以避免自回复循环。
- Matrix 没有原生 bot 标记；OpenClaw 将“bot-authored”视为“由此 OpenClaw Gateway 网关上的另一个已配置 Matrix 账号发送”。

在共享房间中启用 bot 到 bot 流量时，请使用严格的房间 allowlist 和提及要求。

## 加密与验证

在加密（E2EE）房间中，出站图片事件使用 `thumbnail_file`，这样图片预览会与完整附件一起加密；未加密房间使用普通的 `thumbnail_url`。无需配置 - 插件会自动检测 E2EE 状态。

所有 `openclaw matrix` 命令都接受 `--verbose`（完整诊断）、`--json`（机器可读输出）和 `--account <id>`（多账号设置）。默认输出简洁。

### 启用加密

```bash
openclaw matrix encryption setup
```

引导 secret storage 和 cross-signing，按需创建 room-key backup，然后打印状态和后续步骤。常用标志：

- `--recovery-key <key>` 在引导前应用 recovery key（推荐使用下面的 stdin 形式）
- `--force-reset-cross-signing` 丢弃当前 cross-signing identity 并创建一个新的 identity（仅限有意使用）

对于新账号，在创建时启用 E2EE：

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` 是 `--enable-e2ee` 的别名。等效的手动配置：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

### 状态和信任信号

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` 会报告三个独立的信任信号（`--verbose` 会显示全部信号）：

- `Locally trusted`：仅被此客户端信任
- `Cross-signing verified`：SDK 报告已通过 cross-signing 验证
- `Signed by owner`：由你自己的 self-signing key 签名（仅用于诊断）

只有当 `Cross-signing verified` 为 `yes` 时，`Verified by owner` 才是 `yes`；仅有本地信任或 owner signature 并不足够。

`--allow-degraded-local-state` 会在不先准备 Matrix 账号的情况下返回尽力而为的诊断；适用于离线或部分配置的探测。

### 使用 recovery key 验证此设备

通过 stdin 管道传入 recovery key，而不要在命令行上传递：

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

该命令会报告三种状态：

- `Recovery key accepted`：Matrix 已接受用于 secret storage 或设备信任的 key。
- `Backup usable`：room-key backup 可以使用受信任的 recovery material 加载。
- `Device verified by owner`：此设备拥有完整的 Matrix cross-signing identity 信任。

即使 recovery key 已解锁 backup material，只要完整 identity trust 未完成，它也会以非零状态退出。在这种情况下，请从另一个 Matrix 客户端完成 self-verification：

```bash
openclaw matrix verify self
```

`verify self` 会等待 `Cross-signing verified: yes` 后再成功退出。使用 `--timeout-ms <ms>` 调整等待时间。

字面 key 形式 `openclaw matrix verify device "<recovery-key>"` 也可用，但 key 会进入 shell 历史记录。

### 引导或修复 cross-signing

```bash
openclaw matrix verify bootstrap
```

这是加密账号的修复/设置命令。它会按顺序：

- 引导 secret storage，尽可能复用现有 recovery key
- 引导 cross-signing 并上传缺失的 public key
- 标记并 cross-sign 当前设备
- 如果尚不存在 server-side room-key backup，则创建一个

如果 homeserver 要求 UIA 才能上传 cross-signing key，OpenClaw 会先尝试 no-auth，然后尝试 `m.login.dummy`，再尝试 `m.login.password`（需要 `channels.matrix.password`）。

常用标志：

- `--recovery-key-stdin`（与 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...` 配合使用）或 `--recovery-key <key>`
- `--force-reset-cross-signing` 用于丢弃当前 cross-signing identity（仅限有意使用；需要已存储或通过 `--recovery-key-stdin` 提供 active recovery key）

### Room-key backup

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` 会显示是否存在 server-side backup，以及此设备是否可以解密它。`backup restore` 会将已备份的 room key 导入本地 crypto store；如果 recovery key 已在磁盘上，请省略 `--recovery-key-stdin`。

要用新的 baseline 替换损坏的 backup（接受丢失无法恢复的旧历史；如果当前 backup secret 无法加载，也可以重新创建 secret storage）：

```bash
openclaw matrix verify backup reset --yes
```

仅当需要有意让先前的 recovery key 不再能解锁新的 backup baseline 时，才添加 `--rotate-recovery-key`。

### 列出、请求和响应验证

```bash
openclaw matrix verify list
```

列出所选账号的待处理验证请求。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

从此账号发送验证请求。`--own-user` 请求 self-verification（在同一用户的另一个 Matrix 客户端中接受提示）；`--user-id`/`--device-id`/`--room-id` 指向其他人。`--own-user` 不能与其他目标标志组合使用。

对于更低层级的生命周期处理 - 通常是在跟踪来自另一个客户端的入站请求时 - 这些命令会作用于特定请求 `<id>`（由 `verify list` 和 `verify request` 打印）：

| 命令                                       | 用途                                                        |
| ------------------------------------------ | ----------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 接受入站请求                                                |
| `openclaw matrix verify start <id>`        | 启动 SAS 流程                                               |
| `openclaw matrix verify sas <id>`          | 打印 SAS emoji 或十进制数字                                 |
| `openclaw matrix verify confirm-sas <id>`  | 确认 SAS 与另一个客户端显示的内容匹配                       |
| `openclaw matrix verify mismatch-sas <id>` | 当 emoji 或十进制数字不匹配时拒绝 SAS                       |
| `openclaw matrix verify cancel <id>`       | 取消；接受可选的 `--reason <text>` 和 `--code <matrix-code>` |

当验证锚定到特定 direct-message room 时，`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas` 和 `cancel` 都接受 `--user-id` 和 `--room-id` 作为私信后续提示。

### 多账号说明

如果没有 `--account <id>`，Matrix CLI 命令会使用隐式默认账号。如果有多个命名账号且没有 `channels.matrix.defaultAccount`，命令会拒绝猜测并要求你选择。当某个命名账号禁用或无法使用 E2EE 时，错误会指向该账号的配置键，例如 `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="启动行为">
    当设置 `encryption: true` 时，`startupVerification` 默认为 `"if-unverified"`。启动时，未验证设备会在另一个 Matrix 客户端中请求 self-verification，跳过重复请求并应用冷却时间（默认 24 小时）。使用 `startupVerificationCooldownHours` 调整，或使用 `startupVerification: "off"` 禁用。

    启动时还会运行一次保守的 crypto bootstrap pass，复用当前 secret storage 和 cross-signing identity。如果 bootstrap 状态损坏，OpenClaw 即使没有 `channels.matrix.password` 也会尝试受保护的修复；如果 homeserver 要求 password UIA，启动会记录警告并保持非致命。已由 owner 签名的设备会被保留。

    完整升级流程请参阅 [Matrix 迁移](/zh-CN/channels/matrix-migration)。

  </Accordion>

  <Accordion title="验证通知">
    Matrix 会以 `m.notice` 消息形式将验证生命周期通知发布到严格的私信验证房间：请求、ready（附带“Verify by emoji”指引）、start/completion，以及可用时的 SAS（emoji/decimal）详情。

    来自另一个 Matrix 客户端的传入请求会被跟踪并自动接受。对于 self-verification，OpenClaw 会自动启动 SAS 流程，并在 emoji verification 可用后确认自己这一侧 - 你仍需要在你的 Matrix 客户端中比较并确认“They match”。

    验证系统通知不会转发到智能体聊天管道。

  </Accordion>

  <Accordion title="已删除或无效的 Matrix 设备">
    如果 `verify status` 显示当前设备不再列在 homeserver 上，请创建一个新的 OpenClaw Matrix 设备。对于密码登录：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    对于 token auth，请在你的 Matrix 客户端或 admin UI 中创建一个新的 access token，然后更新 OpenClaw：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    将 `assistant` 替换为失败命令中的账号 ID，或为默认账号省略 `--account`。

  </Accordion>

  <Accordion title="设备清理">
    旧的 OpenClaw 托管设备可能会累积。列出并清理：

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE 使用官方 `matrix-js-sdk` Rust crypto 路径，并以 `fake-indexeddb` 作为 IndexedDB shim。Crypto state 会持久化到 `crypto-idb-snapshot.json`（限制性文件权限）。

    加密的运行时状态位于 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 下，包括 sync store、crypto store、recovery key、IDB snapshot、thread bindings 和启动验证状态。当 token 变化但账号 identity 保持不变时，OpenClaw 会复用最佳现有 root，因此先前状态仍可见。

    单个较旧的 token-hash 根可能是正常的令牌轮换连续性路径。如果 OpenClaw 日志记录 `matrix: multiple populated token-hash storage roots detected`，请检查账号目录，并仅在确认选中的活动根健康后归档过期的同级根。优先将过期根移入 `_archive/` 目录，而不是立即删除它们。

  </Accordion>
</AccordionGroup>

## 配置文件管理

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

在一次调用中传入两个选项。Matrix 直接接受 `mxc://` 头像 URL；传入 `http://`/`https://` 会先上传文件，并将解析后的 `mxc://` URL 存入 `channels.matrix.avatarUrl`（或每个账号的覆盖配置）。

## 线程

Matrix 支持自动回复和 message-tool 发送的原生线程。两个相互独立的开关控制行为：

### 会话路由（`sessionScope`）

`dm.sessionScope` 决定 Matrix 私信房间如何映射到 OpenClaw 会话：

- `"per-user"`（默认）：与同一路由对端关联的所有私信房间共享一个会话。
- `"per-room"`：每个 Matrix 私信房间都有自己的会话键，即使对端相同也是如此。

显式会话绑定始终优先于 `sessionScope`；已绑定的房间和线程会保留其选定的目标会话。

### 回复线程（`threadReplies`）

`threadReplies` 决定 bot 在哪里发布回复：

- `"off"`：回复位于顶层。入站线程消息仍保留在父会话上。
- `"inbound"`：仅当入站消息已在线程中时，才在线程内回复。
- `"always"`：在线程内回复，线程根为触发消息；该会话从首次触发起通过匹配的线程范围会话路由。

`dm.threadReplies` 仅对私信覆盖此行为，例如在保持私信扁平化的同时隔离房间线程。

### 线程继承和斜杠命令

- 入站线程消息会将线程根消息作为额外的智能体上下文包含进来。
- 当目标为同一房间（或同一私信用户目标）时，message-tool 发送会自动继承当前 Matrix 线程，除非提供了显式 `threadId`。
- 仅当当前会话元数据能证明同一 Matrix 账号上的同一私信对端时，私信用户目标复用才会生效；否则 OpenClaw 会回退到普通的用户范围路由。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 和线程绑定的 `/acp spawn` 均可在 Matrix 房间和私信中使用。
- 当 `threadBindings.spawnSessions` 启用时，顶层 `/focus` 会创建新的 Matrix 线程并将其绑定到目标会话。
- 在现有 Matrix 线程中运行 `/focus` 或 `/acp spawn --thread here` 会就地绑定该线程。

当 OpenClaw 检测到 Matrix 私信房间与同一共享会话上的另一个私信房间冲突时，它会发布一次性 `m.notice`，指向 `/focus` 逃生路径并建议更改 `dm.sessionScope`。该通知仅在线程绑定启用时出现。

## ACP 会话绑定

Matrix 房间、私信和现有 Matrix 线程可以在不改变聊天界面的情况下成为持久 ACP 工作区。

快速操作员流程：

- 在要继续使用的 Matrix 私信、房间或现有线程中运行 `/acp spawn codex --bind here`。
- 在顶层私信或房间中，当前私信/房间会保留为聊天界面，未来消息会路由到生成的 ACP 会话。
- 在现有线程中，`--bind here` 会就地绑定当前线程。
- `/new` 和 `/reset` 会就地重置同一个已绑定 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

`--bind here` 不会创建子 Matrix 线程。`threadBindings.spawnSessions` 控制 `/acp spawn --thread auto|here`，此时 OpenClaw 需要创建或绑定子线程。

### 线程绑定配置

Matrix 从 `session.threadBindings` 继承全局默认值，并支持按渠道覆盖：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`：控制子智能体和 ACP 线程生成。
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`：对子智能体专用或 ACP 专用生成的更窄覆盖。
- `threadBindings.defaultSpawnContext`

Matrix 线程绑定会话生成默认开启。设置 `threadBindings.spawnSessions: false` 可阻止顶层 `/focus` 和 `/acp spawn --thread auto|here` 创建/绑定 Matrix 线程。当原生子智能体线程生成不应 fork 父转录时，设置 `threadBindings.defaultSpawnContext: "isolated"`。

## 表情回应

Matrix 支持出站表情回应、入站表情回应通知和 ack 表情回应。

出站表情回应工具由 `channels.matrix.actions.reactions` 控制：

- `react` 向 Matrix 事件添加表情回应。
- `reactions` 列出 Matrix 事件的当前表情回应摘要。
- `emoji=""` 移除该事件上 bot 自己的表情回应。
- `remove: true` 仅移除 bot 的指定 emoji 表情回应。

**解析顺序**（第一个已定义值生效）：

| 设置                    | 顺序                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | 每账号 -> 渠道 -> `messages.ackReaction` -> 智能体身份 emoji 回退                   |
| `ackReactionScope`      | 每账号 -> 渠道 -> `messages.ackReactionScope` -> 默认 `"group-mentions"` |
| `reactionNotifications` | 每账号 -> 渠道 -> 默认 `"own"`                                           |

`reactionNotifications: "own"` 会在新增 `m.reaction` 事件且其目标为 bot 编写的 Matrix 消息时转发；`"off"` 会禁用表情回应系统事件。表情回应移除不会合成为系统事件 - Matrix 将其呈现为撤回，而不是独立的 `m.reaction` 移除。

## 历史上下文

- `channels.matrix.historyLimit` 控制当房间消息触发智能体时，作为 `InboundHistory` 包含的近期房间消息数量。回退到 `messages.groupChat.historyLimit`；如果两者均未设置，有效默认值为 `0`（禁用）。
- Matrix 房间历史仅限房间；私信继续使用普通会话历史。
- 房间历史仅限待处理消息：OpenClaw 会缓冲尚未触发回复的房间消息，然后在提及或其他触发到来时快照该窗口。
- 当前触发消息不会包含在 `InboundHistory` 中；它会保留在该轮次的主入站正文中。
- 同一 Matrix 事件的重试会复用原始历史快照，而不是向前漂移到更新的房间消息。

## 上下文可见性

Matrix 支持共享的 `contextVisibility` 控制，用于补充房间上下文，例如获取到的回复文本、线程根和待处理历史。

- `contextVisibility: "all"` 是默认值。补充上下文会按收到的形式保留。
- `contextVisibility: "allowlist"` 会过滤补充上下文，只发送活动房间/用户 allowlist 检查允许的发送者。
- `contextVisibility: "allowlist_quote"` 的行为类似 `allowlist`，但仍会保留一个显式引用回复。

这仅影响补充上下文的可见性，不影响入站消息本身是否可以触发回复。触发授权仍来自 `groupPolicy`、`groups`、`groupAllowFrom` 和私信策略设置。

## 私信和房间策略

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

要在保持房间可用的同时完全静默私信，请设置 `dm.enabled: false`：

```json5
{
  channels: {
    matrix: {
      dm: { enabled: false },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
    },
  },
}
```

参见 [Groups](/zh-CN/channels/groups)，了解提及门控和 allowlist 行为。

Matrix 私信的配对示例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果未获批准的 Matrix 用户在批准前持续发送消息，OpenClaw 会复用同一个待处理配对码，并可能在短暂冷却后发送提醒回复，而不是生成新代码。

参见 [配对](/zh-CN/channels/pairing)，了解共享私信配对流程和存储布局。

## 直接房间修复

如果直接消息状态发生漂移，OpenClaw 最终可能会出现过期的 `m.direct` 映射，指向旧的单人房间而不是实时私信。检查某个对端的当前映射：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修复它：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

两个命令都接受 `--account <id>`，用于多账号设置。修复流程：

- 优先使用已在 `m.direct` 中映射的严格 1:1 私信
- 回退到当前已加入的、包含该用户的任意严格 1:1 私信
- 如果不存在健康私信，则创建新的直接房间并重写 `m.direct`

它不会自动删除旧房间。它会选择健康的私信并更新映射，使未来的 Matrix 发送、验证通知和其他直接消息流程以正确房间为目标。

## Exec 审批

Matrix 可以作为原生审批客户端。在 `channels.matrix.execApprovals` 下配置（或在 `channels.matrix.accounts.<account>.execApprovals` 下进行每账号覆盖）：

- `enabled`：通过 Matrix 原生提示交付审批。未设置或 `"auto"` 会在至少可以解析一个审批者后自动启用；设置 `false` 可显式禁用。
- `approvers`：允许批准 exec 请求的 Matrix 用户 ID（`@owner:example.org`）。回退到 `channels.matrix.dm.allowFrom`。
- `target`：提示发送位置。`"dm"`（默认）发送到审批者私信；`"channel"` 发送到来源房间或私信；`"both"` 同时发送到两者。
- `agentFilter` / `sessionFilter`：可选 allowlist，用于限定哪些智能体/会话触发 Matrix 交付。

不同审批类型的授权略有不同：

- **Exec 审批**使用 `execApprovals.approvers`，并回退到 `dm.allowFrom`。
- **插件审批**仅通过 `dm.allowFrom` 授权。

两类审批共享 Matrix 表情回应快捷方式和消息更新。审批者会在主审批消息上看到表情回应快捷方式：

- ✅ 允许一次
- ❌ 拒绝
- ♾️ 始终允许（当有效 exec 策略允许时）

回退斜杠命令：`/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

只有已解析的审批者可以批准或拒绝。exec 审批的渠道交付包含命令文本 - 仅在受信任房间中启用 `channel` 或 `both`。

相关：[Exec 审批](/zh-CN/tools/exec-approvals)。

## 斜杠命令

斜杠命令（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` 等）可直接在私信中使用。在房间中，OpenClaw 还会识别以 bot 自身 Matrix 提及为前缀的命令，因此 `@bot:server /new` 会触发命令路径，而无需自定义提及正则 - 这让 bot 能响应 Element 和类似客户端在用户通过 Tab 补全 bot 后键入命令时发出的房间风格 `@mention /command` 帖子。

授权规则仍适用：命令发送者必须满足与普通消息相同的私信或房间 allowlist/所有者策略。

## 多账号

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

**继承：**

- 顶层 `channels.matrix` 值会作为命名账号的默认值，除非账号覆盖它们。
- 使用 `groups.<room>.account` 将继承的房间条目限定到特定账号。没有 `account` 的条目会在账号之间共享；当默认账号在顶层配置时，`account: "default"` 仍然有效。

**默认账号选择：**

- 设置 `defaultAccount`，选择隐式路由、探测和 CLI 命令优先使用的命名账号。
- 如果你有多个账号，并且其中一个字面上命名为 `default`，即使未设置 `defaultAccount`，OpenClaw 也会隐式使用它。
- 在有多个命名账号且未选择默认账号时，CLI 命令会拒绝猜测，请设置 `defaultAccount` 或传入 `--account <id>`。
- 只有当顶层 `channels.matrix.*` 块的认证信息完整时（`homeserver` + `accessToken`，或 `homeserver` + `userId` + `password`），才会被视为隐式 `default` 账号。一旦缓存凭据覆盖认证，命名账号仍可通过 `homeserver` + `userId` 被发现。

**提升：**

- 当 OpenClaw 在修复或设置期间将单账号配置提升为多账号配置时，如果已有命名账号或 `defaultAccount` 已经指向某个账号，它会保留现有命名账号。只有 Matrix 认证/引导键会移动到提升后的账号；共享投递策略键会保留在顶层。

有关共享多账号模式，请参阅[配置参考](/zh-CN/gateway/config-channels#multi-account-all-channels)。

## 私有/LAN 主服务器

默认情况下，OpenClaw 会阻止私有/内部 Matrix 主服务器以提供 SSRF 保护，除非你按账号选择启用。

如果你的主服务器运行在 localhost、LAN/Tailscale IP 或内部主机名上，请为该账号启用 `network.dangerouslyAllowPrivateNetwork`：

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

CLI 设置示例：

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

此选择启用仅允许受信任的私有/内部目标。公共明文主服务器（例如 `http://matrix.example.org:8008`）仍会被阻止。请尽可能优先使用 `https://`。

## 代理 Matrix 流量

如果你的 Matrix 部署需要显式出站 HTTP(S) 代理，请设置 `channels.matrix.proxy`：

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

命名账号可以使用 `channels.matrix.accounts.<id>.proxy` 覆盖顶层默认值。OpenClaw 会对运行时 Matrix 流量和账号状态探测使用相同的代理设置。

## 目标解析

在 OpenClaw 要求提供房间或用户目标的任何位置，Matrix 都接受这些目标形式：

- 用户：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房间：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 别名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

Matrix 房间 ID 区分大小写。配置显式投递目标、cron 任务、绑定或允许列表时，请使用 Matrix 中的确切房间 ID 大小写。OpenClaw 会将内部会话键规范化后用于存储，因此这些小写键不能可靠地作为 Matrix 投递 ID 的来源。

实时目录查找使用已登录的 Matrix 账号：

- 用户查找会查询该 homeserver 上的 Matrix 用户目录。
- 房间查找会直接接受显式房间 ID 和别名。已加入房间的名称查找是尽力而为的，并且仅在设置 `dangerouslyAllowNameMatching: true` 时适用于运行时房间允许列表。
- 如果房间名称无法解析为 ID 或别名，运行时允许列表解析会忽略它。

## 配置参考

允许列表风格的用户字段（`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`）接受完整的 Matrix 用户 ID（最安全）。默认会忽略非 ID 条目。如果设置了 `dangerouslyAllowNameMatching: true`，则会在启动时以及监视器运行期间允许列表发生变化时解析精确匹配的 Matrix 目录显示名称；运行时会忽略无法解析的条目。

房间允许列表键（`groups`，旧版 `rooms`）应为房间 ID 或别名。默认会忽略纯房间名称键；`dangerouslyAllowNameMatching: true` 会恢复对已加入房间名称的尽力而为查找。

### 账号和连接

- `enabled`：启用或禁用该渠道。
- `name`：账号的可选显示标签。
- `defaultAccount`：配置多个 Matrix 账号时的首选账号 ID。
- `accounts`：命名的按账号覆盖项。顶层 `channels.matrix` 值会作为默认值继承。
- `homeserver`：homeserver URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允许此账号连接到 `localhost`、LAN/Tailscale IP 或内部主机名。
- `proxy`：Matrix 流量的可选 HTTP(S) 代理 URL。支持按账号覆盖。
- `userId`：完整 Matrix 用户 ID（`@bot:example.org`）。
- `accessToken`：基于令牌认证的访问令牌。支持通过 env/file/exec 提供商使用明文和 SecretRef 值（[密钥管理](/zh-CN/gateway/secrets)）。
- `password`：基于密码登录的密码。支持明文和 SecretRef 值。
- `deviceId`：显式 Matrix 设备 ID。
- `deviceName`：密码登录时使用的设备显示名称。
- `avatarUrl`：用于个人资料同步和 `profile set` 更新的已存储自头像 URL。
- `initialSyncLimit`：启动同步期间获取的最大事件数。

### 加密

- `encryption`：启用 E2EE。默认：`false`。
- `startupVerification`：`"if-unverified"`（E2EE 开启时的默认值）或 `"off"`。当此设备未验证时，在启动时自动请求自验证。
- `startupVerificationCooldownHours`：下一次自动启动请求之前的冷却时间。默认：`24`。

### 访问和策略

- `groupPolicy`：`"open"`、`"allowlist"` 或 `"disabled"`。默认：`"allowlist"`。
- `groupAllowFrom`：房间流量的用户 ID 允许列表。
- `mentionPatterns`：用于房间提及的作用域正则表达式模式。对象格式为 `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`。控制配置的 `agents.list[].groupChat.mentionPatterns` 是否按房间应用。
- `dm.enabled`：为 `false` 时，忽略所有私信。默认：`true`。
- `dm.policy`：`"pairing"`（默认）、`"allowlist"`、`"open"` 或 `"disabled"`。在机器人已加入并将房间分类为私信后应用；它不会影响邀请处理。
- `dm.allowFrom`：私信流量的用户 ID 允许列表。
- `dm.sessionScope`：`"per-user"`（默认）或 `"per-room"`。
- `dm.threadReplies`：仅私信的回复线程覆盖项（`"off"`、`"inbound"`、`"always"`）。
- `allowBots`：接受来自其他已配置 Matrix 机器人账号的消息（`true` 或 `"mentions"`）。
- `allowlistOnly`：为 `true` 时，强制所有活动私信策略（`"disabled"` 除外）和 `"open"` 群组策略变为 `"allowlist"`。不会更改 `"disabled"` 策略。
- `dangerouslyAllowNameMatching`：为 `true` 时，允许对用户允许列表条目进行 Matrix 显示名称目录查找，并允许对房间允许列表键进行已加入房间名称查找。优先使用完整的 `@user:server` ID 以及房间 ID 或别名。
- `autoJoin`：`"always"`、`"allowlist"` 或 `"off"`。默认：`"off"`。适用于每个 Matrix 邀请，包括私信风格的邀请。
- `autoJoinAllowlist`：当 `autoJoin` 为 `"allowlist"` 时允许的房间/别名。别名条目会根据 homeserver 解析，而不是根据被邀请房间声明的状态解析。
- `contextVisibility`：补充上下文可见性（默认 `"all"`、`"allowlist"`、`"allowlist_quote"`）。

### 回复行为

- `replyToMode`：`"off"`（默认）、`"first"`、`"all"` 或 `"batched"`。
- `threadReplies`：`"off"`（顶层默认会解析为 `"inbound"`，除非显式设置）、`"inbound"` 或 `"always"`。
- `threadBindings`：线程绑定会话路由和生命周期的按渠道覆盖项。
- `streaming`：`"off"`（默认）、`"partial"`、`"quiet"`、`"progress"`，或对象形式 `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`。`true` <-> `"partial"`，`false` <-> `"off"`。
- `blockStreaming`：为 `true` 时，已完成的 assistant 块会作为单独的进度消息保留。默认：`false`。
- `markdown`：出站文本的可选 Markdown 渲染配置。
- `responsePrefix`：添加到出站回复前面的可选字符串。
- `textChunkLimit`：当 `chunkMode: "length"` 时，出站分块的字符大小。默认：`4000`。
- `chunkMode`：`"length"`（默认，按字符数拆分）或 `"newline"`（按行边界拆分）。
- `historyLimit`：当房间消息触发 agent 时，作为 `InboundHistory` 包含的近期房间消息数量。回退到 `messages.groupChat.historyLimit`；有效默认值为 `0`（禁用）。
- `mediaMaxMb`：出站发送和入站处理的媒体大小上限，单位 MB。默认：`20`。

### 表情回应设置

- `ackReaction`：此渠道/账号的确认表情回应覆盖项。
- `ackReactionScope`：作用域覆盖项（默认 `"group-mentions"`、`"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）。
- `reactionNotifications`：入站表情回应通知模式（默认 `"own"`、`"off"`）。

### 工具和按房间覆盖项

- `actions`：按 action 的工具门控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`：按房间策略映射。会话身份在解析后使用稳定的房间 ID。（`rooms` 是旧版别名。）
  - `groups.<room>.account`：将一个继承的房间条目限制到特定账号。
  - `groups.<room>.enabled`：按房间开关。为 `false` 时，该房间会被忽略，就像它不在映射中一样。
  - `groups.<room>.requireMention`：渠道级提及要求的按房间覆盖项。
  - `groups.<room>.allowBots`：渠道级设置的按房间覆盖项（`true` 或 `"mentions"`）。
  - `groups.<room>.botLoopProtection`：机器人到机器人循环保护预算的按房间覆盖项。
  - `groups.<room>.users`：按房间发送者允许列表。
  - `groups.<room>.tools`：按房间工具允许/拒绝覆盖项。
  - `groups.<room>.autoReply`：按房间提及门控覆盖项。`true` 会禁用该房间的提及要求；`false` 会强制重新开启。
  - `groups.<room>.skills`：按房间 Skills 过滤器。
  - `groups.<room>.systemPrompt`：按房间系统提示片段。

### Exec 审批设置

- `execApprovals.enabled`：通过 Matrix 原生提示投递 exec 审批。
- `execApprovals.approvers`：允许审批的 Matrix 用户 ID。回退到 `dm.allowFrom`。
- `execApprovals.target`：`"dm"`（默认）、`"channel"` 或 `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`：用于投递的可选 agent/会话允许列表。

## 相关

- [渠道概览](/zh-CN/channels) - 所有支持的渠道
- [配对](/zh-CN/channels/pairing) - 私信认证和配对流程
- [群组](/zh-CN/channels/groups) - 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) - 消息的会话路由
- [安全](/zh-CN/gateway/security) - 访问模型和加固
