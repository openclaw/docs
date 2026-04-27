---
read_when:
    - 在 OpenClaw 中设置 Matrix
    - 配置 Matrix E2EE 和验证
summary: Matrix 支持状态、设置和配置示例
title: Matrix
x-i18n:
    generated_at: "2026-04-27T18:55:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: adfd82ef371046cd537455db77285ab27e3a09f7e589a773c5e12bc766d25512
    source_path: channels/matrix.md
    workflow: 15
---

Matrix 是 OpenClaw 的一个内置渠道插件。  
它使用官方 `matrix-js-sdk`，并支持私信、房间、线程、媒体、回应、投票、位置和 E2EE。

## 内置插件

当前打包发布的 OpenClaw 版本已内置 Matrix 插件。你无需安装任何内容；配置 `channels.matrix.*`（参见 [设置](#setup)）即可激活它。

对于较旧的构建版本或排除了 Matrix 的自定义安装，请先手动安装：

```bash
openclaw plugins install @openclaw/matrix
# or, from a local checkout
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` 会注册并启用该插件，因此无需单独执行 `openclaw plugins enable matrix`。不过，在你配置下方的渠道之前，该插件仍不会执行任何操作。有关插件的一般行为和安装规则，请参见 [插件](/zh-CN/tools/plugin)。

## 设置

1. 在你的 homeserver 上创建一个 Matrix 账户。
2. 配置 `channels.matrix`，使用 `homeserver` + `accessToken`，或 `homeserver` + `userId` + `password`。
3. 重启 Gateway 网关。
4. 与机器人发起私信，或邀请它加入房间（参见 [自动加入](#auto-join) —— 只有当 `autoJoin` 允许时，新邀请才会生效）。

### 交互式设置

```bash
openclaw channels add
openclaw configure --section channels
```

向导会询问以下内容：homeserver URL、认证方式（访问令牌或密码）、用户 ID（仅密码认证）、可选的设备名称、是否启用 E2EE，以及是否配置房间访问和自动加入。

如果匹配的 `MATRIX_*` 环境变量已存在，且所选账户没有已保存的认证信息，向导会提供环境变量快捷方式。在保存允许列表前，如需解析房间名称，请运行 `openclaw channels resolve --channel matrix "Project Room"`。启用 E2EE 后，向导会写入配置，并运行与 [`openclaw matrix encryption setup`](#encryption-and-verification) 相同的引导流程。

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

`channels.matrix.autoJoin` 默认值为 `off`。使用默认值时，在你手动加入之前，机器人不会出现在通过新邀请加入的新房间或私信中。

OpenClaw 无法在收到邀请时判断被邀请的房间是私信还是群组，因此所有邀请——包括类似私信的邀请——都会先经过 `autoJoin`。`dm.policy` 只会在机器人加入后、且房间已被分类之后才生效。

<Warning>
设置 `autoJoin: "allowlist"` 并配合 `autoJoinAllowlist`，可限制机器人接受哪些邀请；或者设置 `autoJoin: "always"`，以接受所有邀请。

`autoJoinAllowlist` 只接受稳定目标：`!roomId:server`、`#alias:server` 或 `*`。普通房间名会被拒绝；别名条目会针对 homeserver 进行解析，而不是依据被邀请房间声称的状态进行解析。
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

如需接受所有邀请，请使用 `autoJoin: "always"`。

### 允许列表目标格式

私信和房间允许列表最好使用稳定 ID 填充：

- 私信（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）：使用 `@user:server`。显示名称只有在 homeserver 目录恰好返回一个匹配项时才会解析。
- 房间（`groups`、`autoJoinAllowlist`）：使用 `!room:server` 或 `#alias:server`。名称会尽力在已加入的房间中解析；运行时会忽略无法解析的条目。

### 账户 ID 规范化

向导会将友好名称转换为规范化账户 ID。例如，`Ops Bot` 会变成 `ops-bot`。在带作用域的环境变量名称中，标点符号会被转义，以避免两个账户发生冲突：`-` → `_X2D_`，因此 `ops-prod` 会映射为 `MATRIX_OPS_X2D_PROD_*`。

### 缓存凭证

Matrix 会将缓存凭证存储在 `~/.openclaw/credentials/matrix/` 下：

- 默认账户：`credentials.json`
- 命名账户：`credentials-<account>.json`

当这些位置存在缓存凭证时，即使配置文件中没有访问令牌，OpenClaw 也会将 Matrix 视为已配置——这适用于设置、`openclaw doctor` 和渠道状态探测。

### 环境变量

当等效配置键未设置时使用。默认账户使用不带前缀的名称；命名账户会在后缀前插入账户 ID。

| 默认账户              | 命名账户（`<ID>` 是规范化后的账户 ID）             |
| --------------------- | -------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                           |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                         |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                              |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                             |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                            |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                          |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                         |

对于账户 `ops`，这些名称会变成 `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN` 等。恢复密钥环境变量会被支持恢复流程的 CLI 命令读取（`verify backup restore`、`verify device`、`verify bootstrap`），前提是你通过 `--recovery-key-stdin` 管道传入密钥。

`MATRIX_HOMESERVER` 不能从工作区 `.env` 设置；参见 [工作区 `.env` 文件](/zh-CN/gateway/security)。

## 配置示例

一个实用的基础配置，包含私信配对、房间允许列表和 E2EE：

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

Matrix 回复流式传输为选择启用。`streaming` 控制 OpenClaw 如何传递生成中的助手回复；`blockStreaming` 控制每个已完成的分块是否保留为单独的 Matrix 消息。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

| `streaming`       | 行为                                                                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（默认）   | 等待完整回复，然后发送一次。`true` ↔ `"partial"`，`false` ↔ `"off"`。                                                                                   |
| `"partial"`       | 在模型写入当前分块时，就地编辑一条普通文本消息。标准 Matrix 客户端可能会在首次预览时通知，而不是在最终编辑时通知。                                     |
| `"quiet"`         | 与 `"partial"` 相同，但消息为不触发通知的 notice。只有当某条按用户设置的推送规则匹配到最终完成的编辑时，接收者才会收到通知（见下文）。                 |

`blockStreaming` 与 `streaming` 相互独立：

| `streaming`             | `blockStreaming: true`                                          | `blockStreaming: false`（默认）                 |
| ----------------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| `"partial"` / `"quiet"` | 当前分块使用实时草稿，已完成分块保留为消息                      | 当前分块使用实时草稿，并原地完成最终定稿        |
| `"off"`                 | 每个已完成分块发送一条会通知的 Matrix 消息                      | 整个完整回复发送一条会通知的 Matrix 消息        |

说明：

- 如果预览内容增长超过 Matrix 的单事件大小限制，OpenClaw 会停止预览流式传输，并回退为仅发送最终内容。
- 媒体回复始终会正常发送附件。如果过期预览已无法安全复用，OpenClaw 会在发送最终媒体回复前将其隐藏。
- 预览编辑会额外消耗 Matrix API 调用。如果你希望采用最保守的速率限制配置，请保持 `streaming: "off"`。

## 审批元数据

Matrix 原生审批提示是普通的 `m.room.message` 事件，并在 `com.openclaw.approval` 下携带 OpenClaw 特有的自定义事件内容。Matrix 允许自定义事件内容键，因此标准客户端仍会渲染文本正文，而支持 OpenClaw 的客户端则可以读取结构化的审批 ID、类型、状态、可用决策以及 exec/plugin 详情。

当审批提示过长、无法放入单个 Matrix 事件时，OpenClaw 会对可见文本进行分块，并且只将 `com.openclaw.approval` 附加到第一块。用于允许/拒绝决策的回应会绑定到第一个事件，因此长提示与单事件提示会保持相同的审批目标。

### quiet 最终预览的自托管推送规则

`streaming: "quiet"` 只会在某个分块或整轮内容最终完成时通知接收者——按用户设置的推送规则必须匹配最终完成的预览标记。完整配置方法（接收者令牌、pusher 检查、规则安装、各 homeserver 注意事项）请参见 [quiet 预览的 Matrix 推送规则](/zh-CN/channels/matrix-push-rules)。

## 机器人到机器人房间

默认情况下，来自其他已配置 OpenClaw Matrix 账户的 Matrix 消息会被忽略。

当你确实希望启用智能体之间的 Matrix 通信时，请使用 `allowBots`：

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

- `allowBots: true` 会在允许的房间和私信中接受来自其他已配置 Matrix 机器人账户的消息。
- `allowBots: "mentions"` 仅在这些消息在房间中明确提及该机器人时才接受。私信仍然允许。
- `groups.<room>.allowBots` 可覆盖单个房间的账户级设置。
- OpenClaw 仍会忽略来自相同 Matrix 用户 ID 的消息，以避免自回复循环。
- Matrix 在这里不提供原生机器人标记；OpenClaw 将“机器人发送的”定义为“由此 OpenClaw Gateway 网关上另一个已配置的 Matrix 账户发送”。

在共享房间中启用机器人到机器人通信时，请使用严格的房间允许列表和提及要求。

## 加密和验证

在加密的（E2EE）房间中，出站图片事件使用 `thumbnail_file`，因此图片预览会与完整附件一起加密。未加密房间仍使用普通的 `thumbnail_url`。无需任何配置——插件会自动检测 E2EE 状态。

所有 `openclaw matrix` 命令都支持 `--verbose`（完整诊断）、`--json`（机器可读输出）和 `--account <id>`（多账户设置）。默认输出较为简洁，并使用安静的内部 SDK 日志记录。以下示例展示的是规范形式；可根据需要添加这些标志。

### 启用加密

```bash
openclaw matrix encryption setup
```

引导设置秘密存储和交叉签名，在需要时创建房间密钥备份，然后打印状态和后续步骤。常用标志：

- `--recovery-key <key>` 在引导设置前应用恢复密钥（优先使用下面记录的 stdin 形式）
- `--force-reset-cross-signing` 丢弃当前交叉签名身份并创建新身份（仅在你明确要这么做时使用）

对于新账户，请在创建时启用 E2EE：

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

### Status 和信任信号

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` 会报告三个独立的信任信号（`--verbose` 会显示全部）：

- `Locally trusted`：仅被此客户端信任
- `Cross-signing verified`：SDK 报告已通过交叉签名验证
- `Signed by owner`：已由你自己的 self-signing 密钥签名（仅用于诊断）

只有当 `Cross-signing verified` 为 `yes` 时，`Verified by owner` 才会变为 `yes`。仅有本地信任或 owner 签名并不足够。

`--allow-degraded-local-state` 会在不先准备 Matrix 账户的情况下返回尽力而为的诊断信息；适用于离线或部分已配置的探测。

### 使用恢复密钥验证此设备

恢复密钥是敏感信息——应通过 stdin 管道传入，而不是直接放在命令行中。设置 `MATRIX_RECOVERY_KEY`（或命名账户使用 `MATRIX_<ID>_RECOVERY_KEY`）：

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

该命令会报告三种状态：

- `Recovery key accepted`：Matrix 已接受该密钥用于秘密存储或设备信任。
- `Backup usable`：可使用受信任的恢复材料加载房间密钥备份。
- `Device verified by owner`：此设备已获得完整的 Matrix 交叉签名身份信任。

即使恢复密钥已解锁备份材料，只要完整身份信任尚未完成，该命令仍会以非零状态退出。在这种情况下，请从另一个 Matrix 客户端完成自我验证：

```bash
openclaw matrix verify self
```

`verify self` 会等待直到 `Cross-signing verified: yes`，然后才会成功退出。可使用 `--timeout-ms <ms>` 调整等待时间。

也接受字面密钥形式 `openclaw matrix verify device "<recovery-key>"`，但密钥会进入你的 shell 历史记录。

### 引导设置或修复交叉签名

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` 是加密账户的修复和设置命令。它会按顺序执行以下操作：

- 引导设置秘密存储，并在可能时复用现有恢复密钥
- 引导设置交叉签名并上传缺失的公钥
- 标记并交叉签名当前设备
- 如果服务器端尚不存在房间密钥备份，则创建一个

如果 homeserver 需要 UIA 才能上传交叉签名密钥，OpenClaw 会先尝试无认证方式，然后尝试 `m.login.dummy`，最后尝试 `m.login.password`（需要 `channels.matrix.password`）。

常用标志：

- `--recovery-key-stdin`（与 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` 搭配使用）或 `--recovery-key <key>`
- `--force-reset-cross-signing`，用于丢弃当前交叉签名身份（仅在明确需要时）

### 房间密钥备份

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` 会显示是否存在服务器端备份，以及此设备是否可以解密该备份。`backup restore` 会将已备份的房间密钥导入本地加密存储；如果恢复密钥已存在于磁盘上，则可以省略 `--recovery-key-stdin`。

如需用新的基线替换损坏的备份（接受丢失无法恢复的旧历史记录；如果当前备份密钥无法加载，也可重新创建秘密存储）：

```bash
openclaw matrix verify backup reset --yes
```

仅当你明确希望先前的恢复密钥不再能解锁新的备份基线时，才添加 `--rotate-recovery-key`。

### 列出、请求和响应验证

```bash
openclaw matrix verify list
```

列出所选账户的待处理验证请求。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

从此 OpenClaw 账户发送验证请求。`--own-user` 请求自我验证（你需要在同一用户的另一个 Matrix 客户端中接受提示）；`--user-id`/`--device-id`/`--room-id` 则用于指定其他人。`--own-user` 不能与其他目标标志组合使用。

对于更底层的生命周期处理——通常是在你从另一个客户端跟踪入站请求时——以下命令会作用于某个特定请求 `<id>`（由 `verify list` 和 `verify request` 输出）：

| Command                                    | 用途                                 |
| ------------------------------------------ | ------------------------------------ |
| `openclaw matrix verify accept <id>`       | 接受入站请求                         |
| `openclaw matrix verify start <id>`        | 启动 SAS 流程                        |
| `openclaw matrix verify sas <id>`          | 打印 SAS 表情符号或数字              |
| `openclaw matrix verify confirm-sas <id>`  | 确认 SAS 与另一客户端显示内容一致    |
| `openclaw matrix verify mismatch-sas <id>` | 当表情符号或数字不匹配时拒绝 SAS     |
| `openclaw matrix verify cancel <id>`       | 取消；可选 `--reason <text>` 和 `--code <matrix-code>` |

当验证锚定到特定私信房间时，`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas` 和 `cancel` 都接受 `--user-id` 和 `--room-id` 作为私信后续提示。

### 多账户说明

如果不传入 `--account <id>`，Matrix CLI 命令会使用隐式默认账户。如果你有多个命名账户且未设置 `channels.matrix.defaultAccount`，命令将拒绝猜测并要求你选择。当某个命名账户的 E2EE 被禁用或不可用时，错误会指向该账户的配置键，例如 `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="启动行为">
    当 `encryption: true` 时，`startupVerification` 默认值为 `"if-unverified"`。启动时，未验证设备会在另一个 Matrix 客户端中请求自我验证，同时跳过重复请求并应用冷却时间（默认 24 小时）。可使用 `startupVerificationCooldownHours` 调整，或通过 `startupVerification: "off"` 禁用。

    启动时还会运行一次保守的加密引导流程，复用当前的秘密存储和交叉签名身份。如果引导状态损坏，OpenClaw 即使没有 `channels.matrix.password` 也会尝试受保护的修复；如果 homeserver 需要密码 UIA，启动时会记录警告，但不会导致致命错误。已由 owner 签名的设备会被保留。

    完整升级流程请参见 [Matrix 迁移](/zh-CN/channels/matrix-migration)。

  </Accordion>

  <Accordion title="验证通知">
    Matrix 会将验证生命周期通知作为 `m.notice` 消息发布到严格的私信验证房间中：请求、就绪（附“通过表情符号验证”的说明）、开始/完成，以及在可用时发布 SAS（表情符号/数字）详情。

    来自另一个 Matrix 客户端的入站请求会被跟踪并自动接受。对于自我验证，OpenClaw 会在表情符号验证可用时自动启动 SAS 流程并确认自己这一侧——你仍需要在你的 Matrix 客户端中比较并确认“它们匹配”。

    验证系统通知不会转发到智能体聊天管道。

  </Accordion>

  <Accordion title="已删除或无效的 Matrix 设备">
    如果 `verify status` 显示当前设备已不再列在 homeserver 上，请创建一个新的 OpenClaw Matrix 设备。对于密码登录：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    对于令牌认证，请在你的 Matrix 客户端或管理员 UI 中创建一个新的访问令牌，然后更新 OpenClaw：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    将 `assistant` 替换为失败命令中的账户 ID，或省略 `--account` 以使用默认账户。

  </Accordion>

  <Accordion title="设备管理">
    旧的由 OpenClaw 管理的设备可能会不断累积。列出并清理：

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="加密存储">
    Matrix E2EE 使用官方 `matrix-js-sdk` Rust 加密路径，并以 `fake-indexeddb` 作为 IndexedDB 兼容层。加密状态会持久化到 `crypto-idb-snapshot.json`（文件权限受限）。

    加密运行时状态位于 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 下，其中包括同步存储、加密存储、恢复密钥、IDB 快照、线程绑定和启动验证状态。当令牌变化但账户身份保持不变时，OpenClaw 会复用现有的最佳根目录，以便先前状态仍然可见。

  </Accordion>
</AccordionGroup>

## 配置文件管理

更新所选账户的 Matrix 自身资料：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

你可以在一次调用中同时传入两个选项。Matrix 可直接接受 `mxc://` 头像 URL；当你传入 `http://` 或 `https://` 时，OpenClaw 会先上传文件，然后将解析后的 `mxc://` URL 存储到 `channels.matrix.avatarUrl`（或按账户覆盖的值）中。

## 线程

Matrix 同时支持自动回复和消息工具发送使用原生 Matrix 线程。有两个相互独立的旋钮用于控制行为：

### 会话路由（`sessionScope`）

`dm.sessionScope` 决定 Matrix 私信房间如何映射到 OpenClaw 会话：

- `"per-user"`（默认）：与同一路由对端相关的所有私信房间共享一个会话。
- `"per-room"`：每个 Matrix 私信房间都会获得自己的会话键，即使对端是同一个人。

显式会话绑定始终优先于 `sessionScope`，因此已绑定的房间和线程会保持其选定的目标会话。

### 回复线程（`threadReplies`）

`threadReplies` 决定机器人将回复发布到哪里：

- `"off"`：回复位于顶层。入站线程消息仍保留在父级会话上。
- `"inbound"`：仅当入站消息本身已经位于该线程中时，才在线程内回复。
- `"always"`：在线程中回复，线程根为触发消息；从第一次触发开始，该会话将通过匹配的线程作用域会话进行路由。

`dm.threadReplies` 仅对私信覆盖此行为——例如，让房间线程保持隔离，同时让私信保持扁平。

### 线程继承和斜杠命令

- 入站线程消息会将线程根消息作为额外的智能体上下文。
- 当消息工具发送目标为同一房间（或同一私信用户目标）时，会自动继承当前 Matrix 线程，除非显式提供了 `threadId`。
- 只有当当前会话元数据能证明是在同一 Matrix 账户上的同一个私信对端时，才会复用私信用户目标；否则 OpenClaw 会回退到常规的按用户作用域路由。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 和绑定线程的 `/acp spawn` 都可在 Matrix 房间和私信中使用。
- 当 `threadBindings.spawnSubagentSessions: true` 时，顶层 `/focus` 会创建一个新的 Matrix 线程，并将其绑定到目标会话。
- 在现有 Matrix 线程中运行 `/focus` 或 `/acp spawn --thread here`，会就地绑定该线程。

当 OpenClaw 检测到某个 Matrix 私信房间与同一共享会话上的另一个私信房间发生冲突时，它会在该房间中发布一次性 `m.notice`，指向 `/focus` 这一逃生口，并建议调整 `dm.sessionScope`。只有在线程绑定已启用时，才会显示此通知。

## ACP 会话绑定

Matrix 房间、私信和现有 Matrix 线程都可以转换为持久化 ACP 工作区，而无需更改聊天界面。

适合操作员的快速流程：

- 在你想继续使用的 Matrix 私信、房间或现有线程中运行 `/acp spawn codex --bind here`。
- 在顶层 Matrix 私信或房间中，当前私信/房间会保留为聊天界面，后续消息会路由到新建的 ACP 会话。
- 在现有 Matrix 线程中，`--bind here` 会就地绑定当前线程。
- `/new` 和 `/reset` 会就地重置同一个已绑定的 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

说明：

- `--bind here` 不会创建子 Matrix 线程。
- `threadBindings.spawnAcpSessions` 仅在 `/acp spawn --thread auto|here` 时需要，因为此时 OpenClaw 需要创建或绑定子 Matrix 线程。

### 线程绑定配置

Matrix 会继承来自 `session.threadBindings` 的全局默认值，同时也支持按渠道覆盖：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix 线程绑定的 spawn 标志为选择启用：

- 设置 `threadBindings.spawnSubagentSessions: true`，可允许顶层 `/focus` 创建并绑定新的 Matrix 线程。
- 设置 `threadBindings.spawnAcpSessions: true`，可允许 `/acp spawn --thread auto|here` 将 ACP 会话绑定到 Matrix 线程。

## 回应

Matrix 支持出站回应、入站回应通知和 ack 回应。

出站回应工具受 `channels.matrix.actions.reactions` 控制：

- `react` 为 Matrix 事件添加回应。
- `reactions` 列出 Matrix 事件当前的回应摘要。
- `emoji=""` 会移除机器人自己在该事件上的回应。
- `remove: true` 只会移除机器人指定表情符号的回应。

**解析顺序**（先定义的值优先）：

| Setting                 | 顺序                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `ackReaction`           | 按账户 → 渠道 → `messages.ackReaction` → 智能体身份 emoji 回退值                  |
| `ackReactionScope`      | 按账户 → 渠道 → `messages.ackReactionScope` → 默认 `"group-mentions"`             |
| `reactionNotifications` | 按账户 → 渠道 → 默认 `"own"`                                                      |

当 `reactionNotifications: "own"` 时，如果新增的 `m.reaction` 事件目标是机器人发送的 Matrix 消息，则会转发该事件；`"off"` 则会禁用回应系统事件。回应移除不会被合成为系统事件，因为 Matrix 将其表现为 redaction，而不是独立的 `m.reaction` 移除事件。

## 历史上下文

- `channels.matrix.historyLimit` 控制当 Matrix 房间消息触发智能体时，作为 `InboundHistory` 包含多少条最近房间消息。它会回退到 `messages.groupChat.historyLimit`；如果两者都未设置，则有效默认值为 `0`。设为 `0` 可禁用。
- Matrix 房间历史仅限房间。私信仍使用常规会话历史。
- Matrix 房间历史是仅待处理的：OpenClaw 会缓冲那些尚未触发回复的房间消息，然后在提及或其他触发条件到来时对该窗口进行快照。
- 当前触发消息不会包含在 `InboundHistory` 中；它会保留在该轮的主入站正文里。
- 对同一 Matrix 事件的重试会复用原始历史快照，而不是漂移到更新的房间消息。

## 上下文可见性

Matrix 支持共享的 `contextVisibility` 控制，用于补充房间上下文，例如抓取到的回复文本、线程根消息和待处理历史。

- `contextVisibility: "all"` 为默认值。补充上下文会按接收时原样保留。
- `contextVisibility: "allowlist"` 会将补充上下文过滤为仅保留通过当前房间/用户允许列表检查的发送者内容。
- `contextVisibility: "allowlist_quote"` 与 `allowlist` 类似，但仍会保留一条显式引用的回复。

此设置影响的是补充上下文的可见性，而不是入站消息本身是否可以触发回复。  
触发授权仍由 `groupPolicy`、`groups`、`groupAllowFrom` 和私信策略设置决定。

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

如果你想完全静默私信，同时保留房间功能，请设置 `dm.enabled: false`：

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

有关提及门控和允许列表行为，请参见 [群组](/zh-CN/channels/groups)。

Matrix 私信的配对示例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果某个尚未批准的 Matrix 用户在获批前持续向你发消息，OpenClaw 会复用同一个待处理配对码，并且可能会在短暂冷却后发送提醒回复，而不是生成新的配对码。

有关共享的私信配对流程和存储布局，请参见 [配对](/zh-CN/channels/pairing)。

## 直接房间修复

如果私信状态漂移而不同步，OpenClaw 可能会出现过时的 `m.direct` 映射，指向旧的一对一房间，而不是当前有效的私信。要检查某个对端的当前映射：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修复它：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

这两个命令都接受 `--account <id>`，用于多账户设置。修复流程会：

- 优先选择已在 `m.direct` 中映射的严格一对一私信
- 如果没有，则回退到当前已加入的、与该用户的任意严格一对一私信
- 如果仍不存在健康的私信，则创建一个新的直接房间并重写 `m.direct`

它不会自动删除旧房间。它会选取健康的私信并更新映射，以便未来的 Matrix 发送、验证通知和其他私信流程都能指向正确的房间。

## Exec 审批

Matrix 可以作为原生审批客户端。配置位于 `channels.matrix.execApprovals` 下（或按账户覆盖时使用 `channels.matrix.accounts.<account>.execApprovals`）：

- `enabled`：通过 Matrix 原生提示传递审批。未设置或为 `"auto"` 时，一旦至少能解析出一个审批者，Matrix 就会自动启用。显式设置 `false` 可禁用。
- `approvers`：允许批准 exec 请求的 Matrix 用户 ID（`@owner:example.org`）。可选——默认回退到 `channels.matrix.dm.allowFrom`。
- `target`：提示发送到哪里。`"dm"`（默认）发送到审批者私信；`"channel"` 发送到发起请求的 Matrix 房间或私信；`"both"` 同时发送到两者。
- `agentFilter` / `sessionFilter`：可选允许列表，用于限制哪些智能体/会话会触发 Matrix 传递。

不同审批类型的授权略有不同：

- **Exec 审批** 使用 `execApprovals.approvers`，回退到 `dm.allowFrom`。
- **插件审批** 仅通过 `dm.allowFrom` 进行授权。

这两类审批共享 Matrix 回应快捷方式和消息更新。审批者会在主要审批消息上看到回应快捷方式：

- `✅` 允许一次
- `❌` 拒绝
- `♾️` 始终允许（当有效 exec 策略允许时）

回退斜杠命令：`/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

只有已解析出的审批者才能批准或拒绝。通过渠道发送的 exec 审批会包含命令文本——仅应在可信房间中启用 `channel` 或 `both`。

相关内容： [Exec 审批](/zh-CN/tools/exec-approvals)。

## 斜杠命令

斜杠命令（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` 等）可以直接在私信中使用。在房间中，OpenClaw 也能识别以前缀为机器人自身 Matrix 提及的命令，因此 `@bot:server /new` 会触发命令路径，而无需自定义提及正则表达式。这样一来，当用户在 Element 或类似客户端中先通过 Tab 补全机器人再输入命令时，机器人仍能响应这种房间风格的 `@mention /command` 消息。

授权规则仍然适用：命令发送者必须满足与普通消息相同的私信或房间允许列表 / owner 策略。

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

- 顶层 `channels.matrix` 值会作为命名账户的默认值，除非某个账户进行了覆盖。
- 可通过 `groups.<room>.account` 将继承的房间条目限定到特定账户。未设置 `account` 的条目会由各账户共享；当默认账户配置在顶层时，`account: "default"` 仍然有效。

**默认账户选择：**

- 设置 `defaultAccount` 以选择隐式路由、探测和 CLI 命令优先使用的命名账户。
- 如果你有多个账户，且其中一个账户名称恰好是 `default`，即使未设置 `defaultAccount`，OpenClaw 也会隐式使用它。
- 如果你有多个命名账户但未选择默认账户，CLI 命令会拒绝猜测——请设置 `defaultAccount` 或传入 `--account <id>`。
- 只有当顶层 `channels.matrix.*` 配置块的认证完整时（`homeserver` + `accessToken`，或 `homeserver` + `userId` + `password`），它才会被视为隐式 `default` 账户。只要缓存凭证已覆盖认证，命名账户仍可通过 `homeserver` + `userId` 被发现。

**提升：**

- 当 OpenClaw 在修复或设置过程中将单账户配置提升为多账户配置时，如果现有命名账户存在，或 `defaultAccount` 已指向某个命名账户，它会保留该账户。只有 Matrix 认证 / 引导设置相关键会移动到提升后的账户中；共享的传递策略键会保留在顶层。

有关共享的多账户模式，请参见 [配置参考](/zh-CN/gateway/config-channels#multi-account-all-channels)。

## 私有 / LAN homeserver

默认情况下，出于 SSRF 防护，OpenClaw 会阻止私有 / 内部 Matrix homeserver，除非你  
为每个账户显式选择启用。

如果你的 homeserver 运行在 localhost、LAN/Tailscale IP 或内部主机名上，请为该 Matrix 账户启用  
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

此选择启用仅允许受信任的私有 / 内部目标。像  
`http://matrix.example.org:8008` 这样的公共明文 homeserver 仍会被阻止。请尽可能优先使用 `https://`。

## 通过代理转发 Matrix 流量

如果你的 Matrix 部署需要显式的出站 HTTP(S) 代理，请设置 `channels.matrix.proxy`：

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

命名账户可通过 `channels.matrix.accounts.<id>.proxy` 覆盖顶层默认值。  
OpenClaw 会对运行时 Matrix 流量和账户状态探测使用同一个代理设置。

## 目标解析

在 OpenClaw 要求你提供房间或用户目标的任何地方，Matrix 都接受以下目标格式：

- 用户：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房间：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 别名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

Matrix 房间 ID 区分大小写。  
在配置显式传递目标、cron 作业、绑定或允许列表时，请使用 Matrix 中房间 ID 的准确大小写。  
OpenClaw 会为存储保留内部会话键的规范形式，因此这些小写键并不是 Matrix 传递 ID 的可靠来源。

实时目录查找使用已登录的 Matrix 账户：

- 用户查找会查询该 homeserver 上的 Matrix 用户目录。
- 房间查找会直接接受显式房间 ID 和别名，然后回退为搜索该账户已加入的房间名称。
- 已加入房间名称查找属于尽力而为。如果某个房间名无法解析为 ID 或别名，它会在运行时允许列表解析中被忽略。

## 配置参考

允许列表风格的字段（`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`）接受完整的 Matrix 用户 ID（最安全）。精确目录匹配会在启动时以及监控运行期间允许列表发生变化时解析；无法解析的条目会在运行时被忽略。出于同样原因，房间允许列表优先使用房间 ID 或别名。

### 账户和连接

- `enabled`：启用或禁用该渠道。
- `name`：账户的可选显示标签。
- `defaultAccount`：配置多个 Matrix 账户时的首选账户 ID。
- `accounts`：按账户命名的覆盖项。顶层 `channels.matrix` 值会作为默认值继承。
- `homeserver`：homeserver URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允许该账户连接到 `localhost`、LAN/Tailscale IP 或内部主机名。
- `proxy`：Matrix 流量的可选 HTTP(S) 代理 URL。支持按账户覆盖。
- `userId`：完整的 Matrix 用户 ID（`@bot:example.org`）。
- `accessToken`：基于令牌认证的访问令牌。支持跨 env/file/exec 提供商使用明文和 SecretRef 值（[Secrets Management](/zh-CN/gateway/secrets)）。
- `password`：基于密码登录的密码。支持明文和 SecretRef 值。
- `deviceId`：显式 Matrix 设备 ID。
- `deviceName`：密码登录时使用的设备显示名称。
- `avatarUrl`：用于资料同步和 `profile set` 更新的已存储自身头像 URL。
- `initialSyncLimit`：启动同步期间获取的最大事件数。

### 加密

- `encryption`：启用 E2EE。默认值：`false`。
- `startupVerification`：`"if-unverified"`（启用 E2EE 时的默认值）或 `"off"`。当此设备未验证时，会在启动时自动请求自我验证。
- `startupVerificationCooldownHours`：下次自动启动请求前的冷却时间。默认值：`24`。

### 访问和策略

- `groupPolicy`：`"open"`、`"allowlist"` 或 `"disabled"`。默认值：`"allowlist"`。
- `groupAllowFrom`：房间流量的用户 ID 允许列表。
- `dm.enabled`：为 `false` 时，忽略所有私信。默认值：`true`。
- `dm.policy`：`"pairing"`（默认）、`"allowlist"`、`"open"` 或 `"disabled"`。它在机器人加入并将房间分类为私信后才生效；不会影响邀请处理。
- `dm.allowFrom`：私信流量的用户 ID 允许列表。
- `dm.sessionScope`：`"per-user"`（默认）或 `"per-room"`。
- `dm.threadReplies`：仅私信的回复线程覆盖项（`"off"`、`"inbound"`、`"always"`）。
- `allowBots`：接受来自其他已配置 Matrix 机器人账户的消息（`true` 或 `"mentions"`）。
- `allowlistOnly`：为 `true` 时，会将所有活动中的私信策略（`"disabled"` 除外）和 `"open"` 群组策略强制为 `"allowlist"`。不会更改 `"disabled"` 策略。
- `autoJoin`：`"always"`、`"allowlist"` 或 `"off"`。默认值：`"off"`。适用于所有 Matrix 邀请，包括类似私信的邀请。
- `autoJoinAllowlist`：当 `autoJoin` 为 `"allowlist"` 时允许的房间 / 别名。别名条目会针对 homeserver 解析，而不是依据被邀请房间声称的状态进行解析。
- `contextVisibility`：补充上下文可见性（默认 `"all"`，也可为 `"allowlist"`、`"allowlist_quote"`）。

### 回复行为

- `replyToMode`：`"off"`、`"first"`、`"all"` 或 `"batched"`。
- `threadReplies`：`"off"`、`"inbound"` 或 `"always"`。
- `threadBindings`：按渠道覆盖线程绑定的会话路由和生命周期。
- `streaming`：`"off"`（默认）、`"partial"`、`"quiet"`。`true` ↔ `"partial"`，`false` ↔ `"off"`。
- `blockStreaming`：为 `true` 时，已完成的助手分块会保留为独立的进度消息。
- `markdown`：出站文本的可选 Markdown 渲染配置。
- `responsePrefix`：添加到出站回复前的可选字符串。
- `textChunkLimit`：当 `chunkMode: "length"` 时，按字符数拆分的出站分块大小。默认值：`4000`。
- `chunkMode`：`"length"`（默认，按字符数拆分）或 `"newline"`（在换行边界拆分）。
- `historyLimit`：当房间消息触发智能体时，作为 `InboundHistory` 包含的最近房间消息数量。回退到 `messages.groupChat.historyLimit`；有效默认值为 `0`（禁用）。
- `mediaMaxMb`：出站发送和入站处理的媒体大小上限（MB）。

### 回应设置

- `ackReaction`：此渠道 / 账户的 ack 回应覆盖值。
- `ackReactionScope`：作用域覆盖值（默认 `"group-mentions"`，也可为 `"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）。
- `reactionNotifications`：入站回应通知模式（默认 `"own"`，也可为 `"off"`）。

### 工具和按房间覆盖

- `actions`：按操作的工具门控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`：按房间的策略映射。解析后，会话身份使用稳定的房间 ID。（`rooms` 是旧版别名。）
  - `groups.<room>.account`：将某个继承的房间条目限制到特定账户。
  - `groups.<room>.allowBots`：对渠道级设置的按房间覆盖（`true` 或 `"mentions"`）。
  - `groups.<room>.users`：按房间的发送者允许列表。
  - `groups.<room>.tools`：按房间的工具允许 / 拒绝覆盖。
  - `groups.<room>.autoReply`：按房间的提及门控覆盖。`true` 会禁用该房间的提及要求；`false` 会强制重新开启。
  - `groups.<room>.skills`：按房间的 Skills 过滤器。
  - `groups.<room>.systemPrompt`：按房间的系统提示片段。

### Exec 审批设置

- `execApprovals.enabled`：通过 Matrix 原生提示传递 exec 审批。
- `execApprovals.approvers`：允许审批的 Matrix 用户 ID。回退到 `dm.allowFrom`。
- `execApprovals.target`：`"dm"`（默认）、`"channel"` 或 `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`：用于传递的可选智能体 / 会话允许列表。

## 相关内容

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全性](/zh-CN/gateway/security) — 访问模型和加固
