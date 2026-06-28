---
read_when:
    - 在 OpenClaw 中设置 Matrix
    - 配置 Matrix E2EE 和验证
summary: Matrix 支持状态、设置和配置示例
title: Matrix
x-i18n:
    generated_at: "2026-06-28T20:40:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1291273746e364fb0ca7eafbde3d717ee555c3edfa576eab4fdd3d0048ceedd
    source_path: channels/matrix.md
    workflow: 16
---

Matrix 是 OpenClaw 的可下载渠道插件。
它使用官方 `matrix-js-sdk`，并支持私信、房间、线程、媒体、回应、投票、位置和 E2EE。

## 安装

配置渠道前，先从 ClawHub 安装 Matrix：

```bash
openclaw plugins install @openclaw/matrix
```

裸插件规格会先尝试 ClawHub，然后回退到 npm。要强制指定注册表来源，请使用 `openclaw plugins install clawhub:@openclaw/matrix` 或 `openclaw plugins install npm:@openclaw/matrix`。

从本地检出安装：

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` 会注册并启用插件，因此不需要单独执行 `openclaw plugins enable matrix` 步骤。在你配置下面的渠道之前，该插件仍不会执行任何操作。有关通用插件行为和安装规则，请参阅 [插件](/zh-CN/tools/plugin)。

## 设置

1. 在你的 homeserver 上创建 Matrix 账户。
2. 使用 `homeserver` + `accessToken`，或 `homeserver` + `userId` + `password` 配置 `channels.matrix`。
3. 重启 Gateway 网关。
4. 与机器人发起私信，或邀请它加入房间（请参阅 [自动加入](#auto-join) - 只有 `autoJoin` 允许时，新邀请才会生效）。

### 交互式设置

```bash
openclaw channels add
openclaw configure --section channels
```

向导会询问：homeserver URL、认证方式（访问令牌或密码）、用户 ID（仅密码认证）、可选设备名称、是否启用 E2EE，以及是否配置房间访问和自动加入。

如果匹配的 `MATRIX_*` 环境变量已存在，且所选账户没有已保存的认证信息，向导会提供环境变量快捷方式。要在保存允许列表前解析房间名称，请运行 `openclaw channels resolve --channel matrix "Project Room"`。启用 E2EE 时，向导会写入配置，并运行与 [`openclaw matrix encryption setup`](#encryption-and-verification) 相同的引导流程。

### 最小配置

基于令牌：

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

基于密码（首次登录后会缓存令牌）：

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

`channels.matrix.autoJoin` 默认值为 `off`。使用默认值时，在你手动加入之前，机器人不会出现在来自新邀请的新房间或私信中。

OpenClaw 无法在邀请时判断被邀请的房间是私信还是群组，因此所有邀请（包括私信样式的邀请）都会先经过 `autoJoin`。`dm.policy` 只会在之后应用，也就是机器人已加入且房间已完成分类之后。

<Warning>
设置 `autoJoin: "allowlist"` 加 `autoJoinAllowlist` 来限制机器人接受哪些邀请，或设置 `autoJoin: "always"` 来接受所有邀请。

`autoJoinAllowlist` 只接受稳定目标：`!roomId:server`、`#alias:server` 或 `*`。普通房间名称会被拒绝；别名条目会针对 homeserver 解析，而不是针对被邀请房间声称的状态解析。
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

要接受所有邀请，请使用 `autoJoin: "always"`。

### 允许列表目标格式

私信和房间允许列表最好使用稳定 ID 填充：

- 私信（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）：使用 `@user:server`。默认忽略显示名称，因为它们可变；仅在你明确需要兼容显示名称条目时，才设置 `dangerouslyAllowNameMatching: true`。
- 房间允许列表键（`groups`、旧版 `rooms`）：使用 `!room:server` 或 `#alias:server`。默认忽略普通房间名称；仅在你明确需要兼容已加入房间的名称查找时，才设置 `dangerouslyAllowNameMatching: true`。
- 邀请允许列表（`autoJoinAllowlist`）：使用 `!room:server`、`#alias:server` 或 `*`。普通房间名称会被拒绝。

### 账户 ID 规范化

向导会将友好名称转换为规范化账户 ID。例如，`Ops Bot` 会变成 `ops-bot`。在带作用域的环境变量名称中，标点会被转义，以避免两个账户发生冲突：`-` → `_X2D_`，因此 `ops-prod` 会映射到 `MATRIX_OPS_X2D_PROD_*`。

### 缓存凭证

Matrix 会将缓存凭证存储在 `~/.openclaw/credentials/matrix/` 下：

- 默认账户：`credentials.json`
- 命名账户：`credentials-<account>.json`

当那里存在缓存凭证时，即使访问令牌不在配置文件中，OpenClaw 也会将 Matrix 视为已配置；这涵盖设置、`openclaw doctor` 和渠道状态探测。

### 环境变量

在等效配置键未设置时使用。默认账户使用无前缀名称；命名账户会在后缀前插入账户 ID。

| 默认账户              | 命名账户（`<ID>` 是规范化账户 ID） |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

对于账户 `ops`，名称会变成 `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN`，依此类推。当你通过 `--recovery-key-stdin` 管道传入密钥时，恢复感知的 CLI 流程（`verify backup restore`、`verify device`、`verify bootstrap`）会读取恢复密钥环境变量。

`MATRIX_HOMESERVER` 不能从工作区 `.env` 设置；请参阅[工作区 `.env` 文件](/zh-CN/gateway/security)。

## 配置示例

一个实用基线，包含私信配对、房间允许列表和 E2EE：

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

Matrix 回复流式传输是选择启用的。`streaming` 控制 OpenClaw 如何投递正在进行中的助手回复；`blockStreaming` 控制每个完成的块是否作为自己的 Matrix 消息保留。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

要保留实时答案预览，但隐藏中间工具/进度行，请使用对象形式：

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

| `streaming`       | 行为                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（默认） | 等待完整回复，然后发送一次。`true` ↔ `"partial"`，`false` ↔ `"off"`。                                                                                        |
| `"partial"`       | 在模型写入当前块时，就地编辑一条普通文本消息。标准 Matrix 客户端可能会在第一次预览时通知，而不是在最终编辑时通知。              |
| `"quiet"`         | 与 `"partial"` 相同，但消息是不会发出通知的 notice。只有当按用户配置的推送规则匹配最终编辑后，收件人才会收到通知（见下文）。 |

`blockStreaming` 独立于 `streaming`：

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false`（默认）                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 当前块的实时草稿，已完成块保留为消息 | 当前块的实时草稿，并就地定稿 |
| `"off"`                 | 每个完成块发送一条会通知的 Matrix 消息                     | 对完整回复发送一条会通知的 Matrix 消息      |

说明：

- 如果预览超过 Matrix 的单事件大小限制，OpenClaw 会停止预览流式传输，并回退到仅最终投递。
- 媒体回复始终正常发送附件。如果过期预览无法再安全复用，OpenClaw 会在发送最终媒体回复前将其删除。
- 当 Matrix 预览流式传输处于活动状态时，默认启用工具进度预览更新。设置 `streaming.preview.toolProgress: false` 可保留答案文本的预览编辑，但让工具进度走普通投递路径。
- 预览编辑会产生额外的 Matrix API 调用。如果你想要最保守的速率限制配置，请保留 `streaming: "off"`。

## 语音消息

入站 Matrix 语音留言会在房间提及门禁之前转录。这样，在 `requireMention: true` 房间中，说出机器人名称的语音留言可以触发智能体，并且智能体会收到转录文本，而不只是音频附件占位符。

Matrix 使用在 `tools.media.audio` 下配置的共享音频媒体提供商，例如 OpenAI `gpt-4o-mini-transcribe`。有关提供商设置和限制，请参阅[媒体工具概览](/zh-CN/tools/media-overview)。

行为详情：

- `m.audio` 事件和带有 `audio/*` MIME 类型的 `m.file` 事件符合条件。
- 在加密房间中，OpenClaw 会先通过现有 Matrix 媒体路径解密附件，然后再转录。
- 转录文本会在智能体提示中标记为机器生成且不受信任。
- 附件会被标记为已转录，因此下游媒体工具不会再次转录同一条语音留言。
- 设置 `tools.media.audio.enabled: false` 可全局禁用音频转录。

## 审批元数据

Matrix 原生审批提示是普通 `m.room.message` 事件，其 `com.openclaw.approval` 下带有 OpenClaw 专用自定义事件内容。Matrix 允许自定义事件内容键，因此标准客户端仍会渲染文本正文，而感知 OpenClaw 的客户端可以读取结构化审批 ID、种类、状态、可用决策，以及 exec/插件详情。

当审批提示过长，无法放入一个 Matrix 事件时，OpenClaw 会将可见文本分块，并仅将 `com.openclaw.approval` 附加到第一个块。允许/拒绝决策的回应绑定到该第一个事件，因此长提示会与单事件提示保持相同的审批目标。

### 用于静默最终预览的自托管推送规则

`streaming: "quiet"` 只会在块或轮次定稿后通知收件人，也就是按用户配置的推送规则必须匹配最终预览标记。完整方法（收件人令牌、pusher 检查、规则安装、按 homeserver 说明）请参阅 [Matrix 静默预览推送规则](/zh-CN/channels/matrix-push-rules)。

## 机器人到机器人房间

默认情况下，来自其他已配置 OpenClaw Matrix 账户的 Matrix 消息会被忽略。

当你有意需要智能体间 Matrix 流量时，请使用 `allowBots`：

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

- `allowBots: true` 接受来自其他已配置 Matrix 机器人账号、位于允许房间和私信中的消息。
- `allowBots: "mentions"` 仅在这些消息在房间中明显提及此机器人时才接受。私信仍然允许。
- `groups.<room>.allowBots` 会为单个房间覆盖账号级设置。
- 已接受的已配置机器人消息使用共享的[机器人循环保护](/zh-CN/channels/bot-loop-protection)。配置 `channels.defaults.botLoopProtection`，然后在某个房间需要不同预算时，用 `channels.matrix.botLoopProtection` 或 `channels.matrix.groups.<room>.botLoopProtection` 覆盖。
- OpenClaw 仍会忽略来自同一 Matrix 用户 ID 的消息，以避免自我回复循环。
- Matrix 此处不公开原生机器人标志；OpenClaw 将“机器人发送”视为“由此 OpenClaw Gateway 网关上的另一个已配置 Matrix 账号发送”。

在共享房间中启用机器人到机器人流量时，请使用严格的房间允许列表和提及要求。

## 加密和验证

在加密（E2EE）房间中，出站图片事件使用 `thumbnail_file`，因此图片预览会与完整附件一起加密。未加密房间仍使用普通的 `thumbnail_url`。无需配置，插件会自动检测 E2EE 状态。

所有 `openclaw matrix` 命令都接受 `--verbose`（完整诊断）、`--json`（机器可读输出）和 `--account <id>`（多账号设置）。默认输出简洁，并使用安静的内部 SDK 日志。以下示例展示规范形式；按需添加这些标志。

### 启用加密

```bash
openclaw matrix encryption setup
```

引导密钥存储和交叉签名，必要时创建房间密钥备份，然后打印状态和后续步骤。实用标志：

- `--recovery-key <key>` 在引导前应用恢复密钥（优先使用下文记录的 stdin 形式）
- `--force-reset-cross-signing` 丢弃当前交叉签名身份并创建新身份（仅在明确需要时使用）

对于新账号，在创建时启用 E2EE：

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` 是 `--enable-e2ee` 的别名。

等效的手动配置：

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

`verify status` 报告三个独立的信任信号（`--verbose` 会显示全部）：

- `Locally trusted`：仅受此客户端信任
- `Cross-signing verified`：SDK 报告已通过交叉签名验证
- `Signed by owner`：由你自己的自签名密钥签名（仅用于诊断）

只有当 `Cross-signing verified` 为 `yes` 时，`Verified by owner` 才会变为 `yes`。仅有本地信任或所有者签名并不足够。

`--allow-degraded-local-state` 会在不先准备 Matrix 账号的情况下返回尽力而为的诊断；适合离线或部分配置的探测。

### 使用恢复密钥验证此设备

恢复密钥很敏感，请通过 stdin 管道传入，而不是在命令行上传递。设置 `MATRIX_RECOVERY_KEY`（或为命名账号设置 `MATRIX_<ID>_RECOVERY_KEY`）：

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

该命令报告三种状态：

- `Recovery key accepted`：Matrix 已接受用于密钥存储或设备信任的密钥。
- `Backup usable`：房间密钥备份可以用受信任的恢复材料加载。
- `Device verified by owner`：此设备拥有完整的 Matrix 交叉签名身份信任。

当完整身份信任不完整时，它会以非零状态退出，即使恢复密钥已解锁备份材料也是如此。这种情况下，请从另一个 Matrix 客户端完成自我验证：

```bash
openclaw matrix verify self
```

`verify self` 会等待 `Cross-signing verified: yes` 后再成功退出。使用 `--timeout-ms <ms>` 调整等待时间。

字面密钥形式 `openclaw matrix verify device "<recovery-key>"` 也受支持，但密钥会进入你的 shell 历史记录。

### 引导或修复交叉签名

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` 是加密账号的修复和设置命令。它会按顺序：

- 引导密钥存储，并尽可能复用现有恢复密钥
- 引导交叉签名并上传缺失的公钥
- 标记当前设备并为其交叉签名
- 如果尚不存在，则创建服务端房间密钥备份

如果 homeserver 要求 UIA 才能上传交叉签名密钥，OpenClaw 会先尝试无认证，然后尝试 `m.login.dummy`，再尝试 `m.login.password`（需要 `channels.matrix.password`）。

实用标志：

- `--recovery-key-stdin`（与 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` 搭配）或 `--recovery-key <key>`
- `--force-reset-cross-signing` 用于丢弃当前交叉签名身份（仅限明确意图；要求活动恢复密钥已存储，或通过 `--recovery-key-stdin` 提供）

### 房间密钥备份

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` 显示是否存在服务端备份，以及此设备能否解密它。`backup restore` 会将已备份的房间密钥导入本地加密存储；如果恢复密钥已在磁盘上，可以省略 `--recovery-key-stdin`。

要用新的基线替换损坏的备份（接受丢失无法恢复的旧历史；如果当前备份密钥无法加载，也可以重新创建密钥存储）：

```bash
openclaw matrix verify backup reset --yes
```

仅当你明确希望旧恢复密钥不再能解锁新的备份基线时，才添加 `--rotate-recovery-key`。

### 列出、请求和响应验证

```bash
openclaw matrix verify list
```

列出所选账号的待处理验证请求。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

从此 OpenClaw 账号发送验证请求。`--own-user` 请求自我验证（你在同一用户的另一个 Matrix 客户端中接受提示）；`--user-id`/`--device-id`/`--room-id` 面向其他人。`--own-user` 不能与其他目标标志组合使用。

对于更底层的生命周期处理，通常是在跟踪来自另一个客户端的入站请求时，这些命令会作用于特定请求 `<id>`（由 `verify list` 和 `verify request` 打印）：

| 命令                                       | 用途                                      |
| ------------------------------------------ | ----------------------------------------- |
| `openclaw matrix verify accept <id>`       | 接受入站请求                              |
| `openclaw matrix verify start <id>`        | 启动 SAS 流程                             |
| `openclaw matrix verify sas <id>`          | 打印 SAS 表情或十进制数字                 |
| `openclaw matrix verify confirm-sas <id>`  | 确认 SAS 与另一个客户端显示的内容匹配     |
| `openclaw matrix verify mismatch-sas <id>` | 当表情或十进制数字不匹配时拒绝 SAS        |
| `openclaw matrix verify cancel <id>`       | 取消；接受可选的 `--reason <text>` 和 `--code <matrix-code>` |

当验证锚定到特定直接消息房间时，`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas` 和 `cancel` 都接受 `--user-id` 和 `--room-id` 作为私信后续提示。

### 多账号说明

如果没有 `--account <id>`，Matrix CLI 命令会使用隐式默认账号。如果你有多个命名账号且尚未设置 `channels.matrix.defaultAccount`，它们会拒绝猜测并要求你选择。当某个命名账号禁用或无法使用 E2EE 时，错误会指向该账号的配置键，例如 `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="Startup behavior">
    使用 `encryption: true` 时，`startupVerification` 默认为 `"if-unverified"`。启动时，未验证设备会在另一个 Matrix 客户端中请求自我验证，跳过重复请求并应用冷却时间（默认 24 小时）。用 `startupVerificationCooldownHours` 调整，或用 `startupVerification: "off"` 禁用。

    启动时还会运行保守的加密引导过程，复用当前密钥存储和交叉签名身份。如果引导状态损坏，即使没有 `channels.matrix.password`，OpenClaw 也会尝试受保护的修复；如果 homeserver 要求密码 UIA，启动会记录警告并保持非致命。已由所有者签名的设备会保留。

    完整升级流程见 [Matrix 迁移](/zh-CN/channels/matrix-migration)。

  </Accordion>

  <Accordion title="Verification notices">
    Matrix 会将验证生命周期通知作为 `m.notice` 消息发布到严格的私信验证房间中：请求、就绪（带有“通过表情验证”的指导）、开始/完成，以及可用时的 SAS（表情/十进制）详情。

    来自另一个 Matrix 客户端的传入请求会被跟踪并自动接受。对于自我验证，OpenClaw 会自动启动 SAS 流程，并在表情验证可用后确认自己这一侧；你仍需在 Matrix 客户端中比较并确认“它们匹配”。

    验证系统通知不会转发到智能体聊天管道。

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    如果 `verify status` 表示当前设备不再列在 homeserver 上，请创建新的 OpenClaw Matrix 设备。对于密码登录：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    对于令牌认证，请在你的 Matrix 客户端或管理界面中创建新的访问令牌，然后更新 OpenClaw：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    将 `assistant` 替换为失败命令中的账号 ID，或对默认账号省略 `--account`。

  </Accordion>

  <Accordion title="Device hygiene">
    旧的 OpenClaw 托管设备可能会累积。列出并清理：

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE 使用官方 `matrix-js-sdk` Rust 加密路径，并以 `fake-indexeddb` 作为 IndexedDB shim。加密状态会持久化到 `crypto-idb-snapshot.json`（限制性文件权限）。

    加密运行时状态位于 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 下，包括同步存储、加密存储、恢复密钥、IDB 快照、线程绑定和启动验证状态。当令牌更改但账号身份保持不变时，OpenClaw 会复用最佳现有根目录，因此先前状态仍可见。

    单个较旧的令牌哈希根目录可以是正常的令牌轮换连续性路径。如果 OpenClaw 记录 `matrix: multiple populated token-hash storage roots detected`，请检查账号目录，并仅在确认所选活动根目录健康后归档陈旧的同级根目录。优先将陈旧根目录移动到 `_archive/` 目录，而不是立即删除。

  </Accordion>
</AccordionGroup>

## 配置文件管理

更新所选账户的 Matrix 自配置文件：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

你可以在一次调用中同时传入这两个选项。Matrix 可直接接受 `mxc://` 头像 URL；当你传入 `http://` 或 `https://` 时，OpenClaw 会先上传文件，并将解析后的 `mxc://` URL 存入 `channels.matrix.avatarUrl`（或按账户覆盖项）。

## 线程

Matrix 支持原生 Matrix 线程，可用于自动回复和消息工具发送。两个独立开关控制行为：

### 会话路由（`sessionScope`）

`dm.sessionScope` 决定 Matrix 私信房间如何映射到 OpenClaw 会话：

- `"per-user"`（默认）：与同一路由对端关联的所有私信房间共享一个会话。
- `"per-room"`：每个 Matrix 私信房间都有自己的会话键，即使对端相同也是如此。

显式对话绑定始终优先于 `sessionScope`，因此已绑定的房间和线程会保留其所选目标会话。

### 回复线程（`threadReplies`）

`threadReplies` 决定 Bot 在哪里发布回复：

- `"off"`：回复位于顶层。入站线程消息会留在父会话上。
- `"inbound"`：只有当入站消息已经在线程中时，才在线程内回复。
- `"always"`：在线程内回复，该线程以触发消息为根；从第一次触发开始，该对话会通过匹配的线程作用域会话进行路由。

`dm.threadReplies` 只会针对私信覆盖此设置，例如在保持私信扁平的同时隔离房间线程。

### 线程继承和斜杠命令

- 入站线程消息会包含线程根消息，作为额外的智能体上下文。
- 当目标为同一房间（或同一私信用户目标）时，消息工具发送会自动继承当前 Matrix 线程，除非提供了显式 `threadId`。
- 只有当当前会话元数据证明同一 Matrix 账户上的同一私信对端时，才会复用私信用户目标；否则 OpenClaw 会回退到普通的用户作用域路由。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 和线程绑定的 `/acp spawn` 都可在 Matrix 房间和私信中使用。
- 当 `threadBindings.spawnSessions` 启用时，顶层 `/focus` 会创建一个新的 Matrix 线程，并将其绑定到目标会话。
- 在现有 Matrix 线程中运行 `/focus` 或 `/acp spawn --thread here` 会就地绑定该线程。

当 OpenClaw 检测到某个 Matrix 私信房间与同一共享会话上的另一个私信房间冲突时，它会在该房间发布一次性 `m.notice`，指向 `/focus` 逃生路径，并建议更改 `dm.sessionScope`。该通知只会在线程绑定启用时出现。

## ACP 对话绑定

Matrix 房间、私信和现有 Matrix 线程都可以转换为持久 ACP 工作区，而无需更改聊天界面。

快速操作流程：

- 在你想继续使用的 Matrix 私信、房间或现有线程中运行 `/acp spawn codex --bind here`。
- 在顶层 Matrix 私信或房间中，当前私信/房间会保留为聊天界面，后续消息会路由到生成的 ACP 会话。
- 在现有 Matrix 线程中，`--bind here` 会就地绑定当前线程。
- `/new` 和 `/reset` 会就地重置同一个已绑定的 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

说明：

- `--bind here` 不会创建子 Matrix 线程。
- `threadBindings.spawnSessions` 会限制 `/acp spawn --thread auto|here`，在这些情况下 OpenClaw 需要创建或绑定子 Matrix 线程。

### 线程绑定配置

Matrix 会继承 `session.threadBindings` 的全局默认值，也支持按渠道覆盖：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix 线程绑定会话生成默认为开启：

- 设置 `threadBindings.spawnSessions: false` 可阻止顶层 `/focus` 和 `/acp spawn --thread auto|here` 创建/绑定 Matrix 线程。
- 当原生子智能体线程生成不应派生父转录时，设置 `threadBindings.defaultSpawnContext: "isolated"`。

## 反应

Matrix 支持出站反应、入站反应通知和确认反应。

出站反应工具由 `channels.matrix.actions.reactions` 控制：

- `react` 会向 Matrix 事件添加反应。
- `reactions` 会列出 Matrix 事件的当前反应摘要。
- `emoji=""` 会移除 Bot 自己在该事件上的反应。
- `remove: true` 只会从 Bot 移除指定表情反应。

**解析顺序**（第一个已定义的值胜出）：

| 设置                    | 顺序                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | 按账户 → 渠道 → `messages.ackReaction` → 智能体身份表情回退                      |
| `ackReactionScope`      | 按账户 → 渠道 → `messages.ackReactionScope` → 默认 `"group-mentions"`            |
| `reactionNotifications` | 按账户 → 渠道 → 默认 `"own"`                                                     |

`reactionNotifications: "own"` 会在新增的 `m.reaction` 事件以 Bot 编写的 Matrix 消息为目标时转发这些事件；`"off"` 会禁用反应系统事件。反应移除不会被合成为系统事件，因为 Matrix 会将其呈现为删改，而不是独立的 `m.reaction` 移除。

## 历史上下文

- `channels.matrix.historyLimit` 控制当 Matrix 房间消息触发智能体时，作为 `InboundHistory` 包含的最近房间消息数量。会回退到 `messages.groupChat.historyLimit`；如果两者都未设置，有效默认值为 `0`。设置为 `0` 可禁用。
- Matrix 房间历史仅限房间。私信继续使用普通会话历史。
- Matrix 房间历史仅保留待处理消息：OpenClaw 会缓冲尚未触发回复的房间消息，然后在提及或其他触发到来时对此窗口进行快照。
- 当前触发消息不会包含在 `InboundHistory` 中；它会保留在该轮次的主入站正文中。
- 同一 Matrix 事件的重试会复用原始历史快照，而不是向前漂移到更新的房间消息。

## 上下文可见性

Matrix 支持共享的 `contextVisibility` 控制，用于补充房间上下文，例如获取到的回复文本、线程根和待处理历史。

- `contextVisibility: "all"` 是默认值。补充上下文会按接收时保留。
- `contextVisibility: "allowlist"` 会过滤补充上下文，只发送通过活动房间/用户允许列表检查的发送者内容。
- `contextVisibility: "allowlist_quote"` 的行为类似 `allowlist`，但仍会保留一个显式引用回复。

此设置影响补充上下文的可见性，不影响入站消息本身是否可以触发回复。
触发授权仍来自 `groupPolicy`、`groups`、`groupAllowFrom` 和私信策略设置。

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

参见 [群组](/zh-CN/channels/groups)，了解提及门控和允许列表行为。

Matrix 私信的配对示例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果未经批准的 Matrix 用户在获批前持续给你发消息，OpenClaw 会复用同一个待处理配对码，并可能在短暂冷却后发送提醒回复，而不是铸造新代码。

参见 [配对](/zh-CN/channels/pairing)，了解共享私信配对流程和存储布局。

## 直接房间修复

如果直接消息状态失去同步，OpenClaw 可能会产生过期的 `m.direct` 映射，指向旧的单人房间，而不是当前可用的私信。检查某个对端的当前映射：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修复它：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

这两个命令都接受 `--account <id>`，用于多账户设置。修复流程：

- 优先选择已经映射在 `m.direct` 中的严格 1:1 私信
- 回退到当前已加入、包含该用户的任意严格 1:1 私信
- 如果不存在健康的私信，则创建新的直接房间并重写 `m.direct`

它不会自动删除旧房间。它会选择健康的私信并更新映射，使未来的 Matrix 发送、验证通知和其他直接消息流程指向正确的房间。

## Exec 审批

Matrix 可以作为原生审批客户端。请在 `channels.matrix.execApprovals` 下配置（或在 `channels.matrix.accounts.<account>.execApprovals` 下配置按账户覆盖项）：

- `enabled`：通过 Matrix 原生提示投递审批。未设置或为 `"auto"` 时，只要至少能解析到一个审批者，Matrix 就会自动启用。设置为 `false` 可显式禁用。
- `approvers`：允许审批 Exec 请求的 Matrix 用户 ID（`@owner:example.org`）。可选；会回退到 `channels.matrix.dm.allowFrom`。
- `target`：提示发送位置。`"dm"`（默认）发送到审批者私信；`"channel"` 发送到发起请求的 Matrix 房间或私信；`"both"` 同时发送到两者。
- `agentFilter` / `sessionFilter`：可选允许列表，用于限定哪些智能体/会话会触发 Matrix 投递。

不同审批类型的授权略有差异：

- **Exec 审批**使用 `execApprovals.approvers`，并回退到 `dm.allowFrom`。
- **插件审批**只通过 `dm.allowFrom` 授权。

这两类审批共享 Matrix 反应快捷方式和消息更新。审批者会在主审批消息上看到反应快捷方式：

- `✅` 允许一次
- `❌` 拒绝
- `♾️` 始终允许（当有效 Exec 策略允许时）

回退斜杠命令：`/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

只有已解析的审批者可以批准或拒绝。Exec 审批的渠道投递包含命令文本；只应在可信房间中启用 `channel` 或 `both`。

相关：[Exec 审批](/zh-CN/tools/exec-approvals)。

## 斜杠命令

斜杠命令（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` 等）可直接在私信中使用。在房间中，OpenClaw 还会识别带有 Bot 自身 Matrix 提及前缀的命令，因此 `@bot:server /new` 可触发命令路径，而无需自定义提及正则表达式。这能让 Bot 响应 Element 和类似客户端在用户输入命令前通过 Tab 补全 Bot 时发出的房间风格 `@mention /command` 消息。

授权规则仍然适用：命令发送者必须满足与普通消息相同的私信或房间允许列表/所有者策略。

## 多账户

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

- 顶层 `channels.matrix` 值会作为命名账号的默认值，除非某个账号覆盖它们。
- 使用 `groups.<room>.account` 将继承的房间条目限定到特定账号。没有 `account` 的条目会在账号之间共享；当默认账号配置在顶层时，`account: "default"` 仍然有效。

**默认账号选择：**

- 设置 `defaultAccount`，以选择隐式路由、探测和 CLI 命令优先使用的命名账号。
- 如果你有多个账号，且其中一个确实命名为 `default`，即使未设置 `defaultAccount`，OpenClaw 也会隐式使用它。
- 如果你有多个命名账号但未选择默认账号，CLI 命令会拒绝猜测 - 请设置 `defaultAccount` 或传入 `--account <id>`。
- 只有当顶层 `channels.matrix.*` 块的凭证完整时（`homeserver` + `accessToken`，或 `homeserver` + `userId` + `password`），它才会被视为隐式 `default` 账号。只要缓存的凭证覆盖了认证，命名账号仍可从 `homeserver` + `userId` 被发现。

**提升：**

- 当 OpenClaw 在修复或设置期间将单账号配置提升为多账号配置时，如果已有命名账号，或 `defaultAccount` 已经指向某个账号，它会保留现有命名账号。只有 Matrix 凭证/引导键会移动到提升后的账号；共享的投递策略键会保留在顶层。

参见[配置参考](/zh-CN/gateway/config-channels#multi-account-all-channels)，了解共享的多账号模式。

## 私有/LAN homeserver

默认情况下，OpenClaw 会阻止私有/内部 Matrix homeserver 以提供 SSRF 防护，除非你
按账号显式选择启用。

如果你的 homeserver 运行在 localhost、LAN/Tailscale IP 或内部主机名上，请为该 Matrix 账号启用
`network.dangerouslyAllowPrivateNetwork`：

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

此选择启用仅允许受信任的私有/内部目标。公共明文 homeserver，例如
`http://matrix.example.org:8008` 仍会被阻止。尽可能优先使用 `https://`。

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

命名账号可以用 `channels.matrix.accounts.<id>.proxy` 覆盖顶层默认值。
OpenClaw 会对运行时 Matrix 流量和账号状态探测使用同一个代理设置。

## 目标解析

在 OpenClaw 要求你提供房间或用户目标的任何位置，Matrix 都接受以下目标形式：

- 用户：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房间：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 别名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

Matrix 房间 ID 区分大小写。配置显式投递目标、cron 作业、绑定或允许列表时，
请使用来自 Matrix 的确切房间 ID 大小写。
OpenClaw 会保持内部会话键在存储中规范化，因此这些小写
键不能作为 Matrix 投递 ID 的可靠来源。

实时目录查找使用已登录的 Matrix 账号：

- 用户查找会查询该 homeserver 上的 Matrix 用户目录。
- 房间查找会直接接受显式房间 ID 和别名。已加入房间名称查找是尽力而为的，并且只在设置 `dangerouslyAllowNameMatching: true` 时适用于运行时房间允许列表。
- 如果房间名称无法解析为 ID 或别名，它会被运行时允许列表解析忽略。

## 配置参考

允许列表风格的用户字段（`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`）接受完整 Matrix 用户 ID（最安全）。默认情况下，非 ID 用户条目会被忽略。如果你设置 `dangerouslyAllowNameMatching: true`，精确匹配的 Matrix 目录显示名称会在启动时解析，并在监视器运行期间允许列表发生变化时重新解析；无法解析的条目会在运行时被忽略。

房间允许列表键（`groups`、旧版 `rooms`）应为房间 ID 或别名。默认情况下，纯房间名称键会被忽略；`dangerouslyAllowNameMatching: true` 会恢复针对已加入房间名称的尽力而为查找。

### 账号和连接

- `enabled`：启用或禁用该渠道。
- `name`：账号的可选显示标签。
- `defaultAccount`：配置多个 Matrix 账号时的首选账号 ID。
- `accounts`：按账号命名的覆盖项。顶层 `channels.matrix` 值会作为默认值继承。
- `homeserver`：homeserver URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允许此账号连接到 `localhost`、LAN/Tailscale IP 或内部主机名。
- `proxy`：Matrix 流量的可选 HTTP(S) 代理 URL。支持按账号覆盖。
- `userId`：完整 Matrix 用户 ID（`@bot:example.org`）。
- `accessToken`：基于令牌认证的访问令牌。支持跨 env/file/exec 提供商的明文和 SecretRef 值（[密钥管理](/zh-CN/gateway/secrets)）。
- `password`：基于密码登录的密码。支持明文和 SecretRef 值。
- `deviceId`：显式 Matrix 设备 ID。
- `deviceName`：密码登录时使用的设备显示名称。
- `avatarUrl`：为个人资料同步和 `profile set` 更新存储的自身头像 URL。
- `initialSyncLimit`：启动同步期间获取的最大事件数。

### 加密

- `encryption`：启用 E2EE。默认：`false`。
- `startupVerification`：`"if-unverified"`（E2EE 开启时的默认值）或 `"off"`。当此设备未验证时，启动时自动请求自我验证。
- `startupVerificationCooldownHours`：下一次自动启动请求之前的冷却时间。默认：`24`。

### 访问和策略

- `groupPolicy`：`"open"`、`"allowlist"` 或 `"disabled"`。默认：`"allowlist"`。
- `groupAllowFrom`：房间流量的用户 ID 允许列表。
- `dm.enabled`：当为 `false` 时，忽略所有私信。默认：`true`。
- `dm.policy`：`"pairing"`（默认）、`"allowlist"`、`"open"` 或 `"disabled"`。在 Bot 已加入并将房间分类为私信之后适用；它不影响邀请处理。
- `dm.allowFrom`：私信流量的用户 ID 允许列表。
- `dm.sessionScope`：`"per-user"`（默认）或 `"per-room"`。
- `dm.threadReplies`：仅限私信的回复串接覆盖（`"off"`、`"inbound"`、`"always"`）。
- `allowBots`：接受来自其他已配置 Matrix Bot 账号的消息（`true` 或 `"mentions"`）。
- `allowlistOnly`：当为 `true` 时，将所有活动私信策略（`"disabled"` 除外）和 `"open"` 群组策略强制为 `"allowlist"`。不会改变 `"disabled"` 策略。
- `dangerouslyAllowNameMatching`：当为 `true` 时，允许对用户允许列表条目进行 Matrix 显示名称目录查找，并对房间允许列表键进行已加入房间名称查找。优先使用完整 `@user:server` ID 以及房间 ID 或别名。
- `autoJoin`：`"always"`、`"allowlist"` 或 `"off"`。默认：`"off"`。适用于每个 Matrix 邀请，包括私信风格邀请。
- `autoJoinAllowlist`：当 `autoJoin` 为 `"allowlist"` 时允许的房间/别名。别名条目会针对 homeserver 解析，而不是针对被邀请房间声明的状态解析。
- `contextVisibility`：补充上下文可见性（默认 `"all"`、`"allowlist"`、`"allowlist_quote"`）。

### 回复行为

- `replyToMode`：`"off"`、`"first"`、`"all"` 或 `"batched"`。
- `threadReplies`：`"off"`、`"inbound"` 或 `"always"`。
- `threadBindings`：线程绑定会话路由和生命周期的按渠道覆盖项。
- `streaming`：`"off"`（默认）、`"partial"`、`"quiet"`，或对象形式 `{ mode, preview: { toolProgress } }`。`true` ↔ `"partial"`，`false` ↔ `"off"`。
- `blockStreaming`：当为 `true` 时，已完成的 assistant 块会作为单独进度消息保留。
- `markdown`：出站文本的可选 Markdown 渲染配置。
- `responsePrefix`：添加到出站回复前面的可选字符串。
- `textChunkLimit`：当 `chunkMode: "length"` 时，出站分块的字符大小。默认：`4000`。
- `chunkMode`：`"length"`（默认，按字符数拆分）或 `"newline"`（在行边界拆分）。
- `historyLimit`：当房间消息触发智能体时，作为 `InboundHistory` 包含的最近房间消息数量。回退到 `messages.groupChat.historyLimit`；有效默认值为 `0`（禁用）。
- `mediaMaxMb`：出站发送和入站处理的媒体大小上限，单位为 MB。

### Reaction 设置

- `ackReaction`：此渠道/账号的 ack reaction 覆盖项。
- `ackReactionScope`：范围覆盖项（默认 `"group-mentions"`、`"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）。
- `reactionNotifications`：入站 reaction 通知模式（默认 `"own"`、`"off"`）。

### 工具和按房间覆盖

- `actions`：按 action 的工具门控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`：按房间的策略映射。会话身份在解析后使用稳定房间 ID。（`rooms` 是旧版别名。）
  - `groups.<room>.account`：将一个继承的房间条目限制到特定账号。
  - `groups.<room>.allowBots`：渠道级设置的按房间覆盖项（`true` 或 `"mentions"`）。
  - `groups.<room>.users`：按房间的发送者允许列表。
  - `groups.<room>.tools`：按房间的工具允许/拒绝覆盖项。
  - `groups.<room>.autoReply`：按房间的提及门控覆盖项。`true` 会禁用该房间的提及要求；`false` 会强制重新开启。
  - `groups.<room>.skills`：按房间的技能过滤器。
  - `groups.<room>.systemPrompt`：按房间的系统提示词片段。

### Exec 审批设置

- `execApprovals.enabled`：通过 Matrix 原生提示投递 exec 审批。
- `execApprovals.approvers`：允许审批的 Matrix 用户 ID。回退到 `dm.allowFrom`。
- `execApprovals.target`：`"dm"`（默认）、`"channel"` 或 `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`：用于投递的可选智能体/会话允许列表。

## 相关

- [渠道概览](/zh-CN/channels) - 所有支持的渠道
- [配对](/zh-CN/channels/pairing) - 私信认证和配对流程
- [群组](/zh-CN/channels/groups) - 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) - 消息的会话路由
- [安全](/zh-CN/gateway/security) - 访问模型和加固
