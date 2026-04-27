---
read_when:
    - 在 OpenClaw 中设置 Matrix
    - 配置 Matrix E2EE 和验证
summary: Matrix 支持状态、设置和配置示例
title: Matrix
x-i18n:
    generated_at: "2026-04-27T10:58:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 253c91d0b425617a2f6e9bf1edfa56db9fee0607509ec382b3abfb99452f6003
    source_path: channels/matrix.md
    workflow: 15
---

Matrix 是 OpenClaw 的内置渠道插件。

它使用官方的 `matrix-js-sdk`，并支持私信、房间、线程、媒体、回应、投票、位置和 E2EE。

## 内置插件

当前打包发布的 OpenClaw 版本已随附 Matrix 插件。你无需安装任何内容；配置 `channels.matrix.*`（见 [设置](#setup)）即可激活它。

对于不包含 Matrix 的旧版构建或自定义安装，请先手动安装：

```bash
openclaw plugins install @openclaw/matrix
# 或者，从本地检出安装
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` 会注册并启用该插件，因此不需要单独执行 `openclaw plugins enable matrix`。在你完成下方的渠道配置之前，该插件仍不会执行任何操作。有关插件的一般行为和安装规则，请参阅 [插件](/zh-CN/tools/plugin)。

## 设置

1. 在你的 homeserver 上创建一个 Matrix 账号。
2. 配置 `channels.matrix`，使用 `homeserver` + `accessToken`，或 `homeserver` + `userId` + `password`。
3. 重启 Gateway 网关。
4. 与机器人发起私信，或邀请它加入房间（见 [自动加入](#auto-join) —— 只有当 `autoJoin` 允许时，新邀请才会生效）。

### 交互式设置

```bash
openclaw channels add
openclaw configure --section channels
```

向导会询问：homeserver URL、认证方式（访问令牌或密码）、用户 ID（仅限密码认证）、可选的设备名称、是否启用 E2EE，以及是否配置房间访问和自动加入。

如果匹配的 `MATRIX_*` 环境变量已存在，且所选账号没有已保存的认证信息，向导会提供环境变量快捷方式。在保存允许列表之前，如需解析房间名称，请运行 `openclaw channels resolve --channel matrix "Project Room"`。启用 E2EE 后，向导会写入配置，并运行与 [`openclaw matrix encryption setup`](#encryption-and-verification) 相同的引导流程。

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

OpenClaw 无法在邀请到达时判断被邀请的房间是私信还是群组，因此所有邀请——包括私信式邀请——都会先经过 `autoJoin`。`dm.policy` 仅在之后生效，也就是机器人已加入并且房间已被分类之后。

<Warning>
设置 `autoJoin: "allowlist"` 并配合 `autoJoinAllowlist`，可限制机器人接受哪些邀请；或者设置 `autoJoin: "always"` 以接受所有邀请。

`autoJoinAllowlist` 仅接受稳定目标：`!roomId:server`、`#alias:server` 或 `*`。纯房间名称会被拒绝；别名条目会针对 homeserver 进行解析，而不是依据被邀请房间声称的状态进行解析。
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

- 私信（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）：使用 `@user:server`。显示名称只有在 homeserver 目录返回恰好一个匹配项时才会解析。
- 房间（`groups`、`autoJoinAllowlist`）：使用 `!room:server` 或 `#alias:server`。名称会尽力根据已加入的房间进行解析；未解析的条目会在运行时被忽略。

### 账号 ID 规范化

向导会将友好名称转换为规范化的账号 ID。例如，`Ops Bot` 会变成 `ops-bot`。在带作用域的环境变量名称中，标点符号会被转义，以避免两个账号发生冲突：`-` → `_X2D_`，因此 `ops-prod` 会映射为 `MATRIX_OPS_X2D_PROD_*`。

### 缓存的凭证

Matrix 会将缓存的凭证存储在 `~/.openclaw/credentials/matrix/` 下：

- 默认账号：`credentials.json`
- 命名账号：`credentials-<account>.json`

当那里存在缓存的凭证时，即使访问令牌不在配置文件中，OpenClaw 也会将 Matrix 视为已配置——这适用于设置、`openclaw doctor` 和渠道状态探测。

### 环境变量

当等效的配置键未设置时使用。默认账号使用无前缀名称；命名账号则在后缀前插入账号 ID。

| 默认账号 | 命名账号（`<ID>` 是规范化后的账号 ID） |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

对于账号 `ops`，这些名称会变为 `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN` 等。恢复密钥环境变量由支持恢复的 CLI 流程读取（`verify backup restore`、`verify device`、`verify bootstrap`），前提是你通过 `--recovery-key-stdin` 传入该密钥。

`MATRIX_HOMESERVER` 不能从工作区 `.env` 设置；请参阅 [工作区 `.env` 文件](/zh-CN/gateway/security)。

## 配置示例

一个实用的基线配置，包含私信配对、房间允许列表和 E2EE：

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

Matrix 回复流式传输为可选启用。`streaming` 控制 OpenClaw 如何传递进行中的智能体回复；`blockStreaming` 控制每个已完成的块是否作为单独的 Matrix 消息保留。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

| `streaming`       | 行为                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（默认） | 等待完整回复，然后发送一次。`true` ↔ `"partial"`，`false` ↔ `"off"`。                                                                                        |
| `"partial"`       | 当模型写入当前块时，原地编辑一条普通文本消息。标准 Matrix 客户端可能会在第一次预览时通知，而不是在最终编辑时通知。              |
| `"quiet"`         | 与 `"partial"` 相同，但该消息是一个不通知的 notice。只有当每用户推送规则匹配到最终编辑时，接收者才会收到通知（见下文）。 |

`blockStreaming` 与 `streaming` 相互独立：

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false`（默认）                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 当前块使用实时草稿，已完成的块保留为消息 | 当前块使用实时草稿，最终原地定稿 |
| `"off"`                 | 每个完成的块发送一条会通知的 Matrix 消息                     | 完整回复发送一条会通知的 Matrix 消息      |

说明：

- 如果预览增长超过 Matrix 的每事件大小限制，OpenClaw 会停止预览流式传输，并回退为仅最终发送。
- 媒体回复始终会正常发送附件。如果过期的预览已无法安全复用，OpenClaw 会在发送最终媒体回复前将其隐藏。
- 预览编辑会额外消耗 Matrix API 调用。如果你想要最保守的限流配置，请保持 `streaming: "off"`。

### 用于安静定稿预览的自托管推送规则

`streaming: "quiet"` 仅会在一个块或一轮对话最终定稿时通知接收者——每用户推送规则必须匹配最终预览标记。完整方案（接收者令牌、pusher 检查、规则安装、每个 homeserver 的说明）请参阅 [用于安静预览的 Matrix 推送规则](/zh-CN/channels/matrix-push-rules)。

## 机器人到机器人房间

默认情况下，来自其他已配置 OpenClaw Matrix 账号的 Matrix 消息会被忽略。

当你有意启用智能体之间的 Matrix 通信时，请使用 `allowBots`：

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

- `allowBots: true` 会在允许的房间和私信中接受来自其他已配置 Matrix 机器人账号的消息。
- `allowBots: "mentions"` 仅当这些消息在房间中明确提到此机器人时才接受。私信仍然允许。
- `groups.<room>.allowBots` 会覆盖单个房间的账号级设置。
- OpenClaw 仍会忽略来自同一 Matrix 用户 ID 的消息，以避免自回复循环。
- Matrix 在这里不提供原生机器人标记；OpenClaw 将“机器人撰写”视为“由此 OpenClaw Gateway 网关上另一个已配置的 Matrix 账号发送”。

在共享房间中启用机器人到机器人通信时，请使用严格的房间允许列表和提及要求。

## 加密和验证

在加密（E2EE）房间中，出站图片事件使用 `thumbnail_file`，因此图片预览会与完整附件一起加密。未加密房间仍使用纯 `thumbnail_url`。无需任何配置——插件会自动检测 E2EE 状态。

所有 `openclaw matrix` 命令都接受 `--verbose`（完整诊断）、`--json`（机器可读输出）和 `--account <id>`（多账号设置）。默认输出简洁，并带有安静的内部 SDK 日志。下面的示例展示规范形式；可按需添加这些标志。

### 启用加密

```bash
openclaw matrix encryption setup
```

引导创建密钥存储和交叉签名，如有需要还会创建房间密钥备份，然后打印状态和后续步骤。常用标志：

- `--recovery-key <key>` 在引导前应用恢复密钥（优先使用下文记录的 stdin 形式）
- `--force-reset-cross-signing` 丢弃当前交叉签名身份并创建新的身份（仅在你明确有意时使用）

对于新账号，可在创建时启用 E2EE：

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

`verify status` 会报告三个彼此独立的信任信号（`--verbose` 会显示全部）：

- `Locally trusted`：仅被此客户端信任
- `Cross-signing verified`：SDK 报告已通过交叉签名验证
- `Signed by owner`：已由你自己的自签名密钥签名（仅用于诊断）

只有当 `Cross-signing verified` 为 `yes` 时，`Verified by owner` 才会变为 `yes`。仅有本地信任或所有者签名都不足以满足条件。

`--allow-degraded-local-state` 会在不先准备 Matrix 账号的情况下返回尽力而为的诊断结果；适用于离线或部分配置的探测。

### 使用恢复密钥验证此设备

恢复密钥是敏感信息——请通过 stdin 管道传入，而不是在命令行中直接传递。设置 `MATRIX_RECOVERY_KEY`（或命名账号使用 `MATRIX_<ID>_RECOVERY_KEY`）：

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

该命令会报告三种状态：

- `Recovery key accepted`：Matrix 已接受该密钥用于密钥存储或设备信任。
- `Backup usable`：可以使用受信任的恢复材料加载房间密钥备份。
- `Device verified by owner`：此设备已获得完整的 Matrix 交叉签名身份信任。

即使恢复密钥已解锁备份材料，只要完整身份信任尚未完成，该命令也会以非零状态退出。在这种情况下，请从另一个 Matrix 客户端完成自验证：

```bash
openclaw matrix verify self
```

`verify self` 会等待直到 `Cross-signing verified: yes`，然后才会成功退出。可使用 `--timeout-ms <ms>` 调整等待时间。

也接受字面密钥形式 `openclaw matrix verify device "<recovery-key>"`，但该密钥会出现在你的 shell 历史中。

### 引导或修复交叉签名

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` 是加密账号的修复和设置命令。按顺序，它会：

- 引导创建密钥存储，并在可能时复用现有恢复密钥
- 引导交叉签名并上传缺失的公钥
- 标记并交叉签名当前设备
- 如果尚不存在，则创建服务器端房间密钥备份

如果 homeserver 需要 UIA 才能上传交叉签名密钥，OpenClaw 会先尝试无认证，再尝试 `m.login.dummy`，最后尝试 `m.login.password`（需要 `channels.matrix.password`）。

常用标志：

- `--recovery-key-stdin`（与 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` 搭配使用）或 `--recovery-key <key>`
- `--force-reset-cross-signing` 用于丢弃当前交叉签名身份（仅在你明确有意时使用）

### 房间密钥备份

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` 显示是否存在服务器端备份，以及此设备是否可以解密它。`backup restore` 会将已备份的房间密钥导入本地加密存储；如果恢复密钥已保存在磁盘上，则可以省略 `--recovery-key-stdin`。

如需用新的基线替换损坏的备份（接受丢失无法恢复的旧历史；如果当前备份密钥无法加载，也可重新创建密钥存储）：

```bash
openclaw matrix verify backup reset --yes
```

仅当你明确希望此前的恢复密钥不再能解锁新的备份基线时，才添加 `--rotate-recovery-key`。

### 列出、请求和响应验证

```bash
openclaw matrix verify list
```

列出所选账号的待处理验证请求。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

从这个 OpenClaw 账号发送验证请求。`--own-user` 请求自验证（你需要在同一用户的另一个 Matrix 客户端中接受提示）；`--user-id`/`--device-id`/`--room-id` 则用于指定其他人。`--own-user` 不能与其他目标标志同时使用。

对于更底层的生命周期处理——通常是在跟随来自其他客户端的入站请求时——以下命令作用于特定请求 `<id>`（由 `verify list` 和 `verify request` 打印）：

| 命令                                    | 用途                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 接受入站请求                                           |
| `openclaw matrix verify start <id>`        | 启动 SAS 流程                                                  |
| `openclaw matrix verify sas <id>`          | 打印 SAS 表情符号或数字                                     |
| `openclaw matrix verify confirm-sas <id>`  | 确认 SAS 与另一客户端显示的一致            |
| `openclaw matrix verify mismatch-sas <id>` | 当表情符号或数字不匹配时拒绝 SAS              |
| `openclaw matrix verify cancel <id>`       | 取消；可选 `--reason <text>` 和 `--code <matrix-code>` |

`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas` 和 `cancel` 都接受 `--user-id` 和 `--room-id`，可在验证绑定到特定私信房间时作为私信后续提示。

### 多账号说明

如果不使用 `--account <id>`，Matrix CLI 命令会使用隐式默认账号。如果你有多个命名账号且尚未设置 `channels.matrix.defaultAccount`，命令将拒绝猜测，并要求你进行选择。当某个命名账号的 E2EE 被禁用或不可用时，错误会指向该账号的配置键，例如 `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="启动行为">
    当 `encryption: true` 时，`startupVerification` 默认值为 `"if-unverified"`。启动时，未验证设备会在另一个 Matrix 客户端中请求自验证，同时跳过重复请求并应用冷却时间（默认 24 小时）。可使用 `startupVerificationCooldownHours` 调整，或通过 `startupVerification: "off"` 禁用。

    启动时还会执行一次保守的加密引导过程，复用当前密钥存储和交叉签名身份。如果引导状态已损坏，即使没有 `channels.matrix.password`，OpenClaw 也会尝试受控修复；如果 homeserver 要求密码 UIA，启动只会记录警告，并保持非致命状态。已由所有者签名的设备会被保留。

    完整升级流程请参阅 [Matrix 迁移](/zh-CN/channels/matrix-migration)。

  </Accordion>

  <Accordion title="验证通知">
    Matrix 会将验证生命周期通知作为 `m.notice` 消息发布到严格私信验证房间中：请求、就绪（附“通过表情符号验证”的指引）、开始/完成，以及在可用时提供 SAS（表情/数字）详情。

    来自另一个 Matrix 客户端的入站请求会被跟踪并自动接受。对于自验证，一旦表情验证可用，OpenClaw 会自动启动 SAS 流程并确认自身这一侧——你仍然需要在 Matrix 客户端中比对并确认“它们匹配”。

    验证系统通知不会转发到智能体聊天流水线。

  </Accordion>

  <Accordion title="已删除或无效的 Matrix 设备">
    如果 `verify status` 表示当前设备已不再列于 homeserver 上，请创建新的 OpenClaw Matrix 设备。对于密码登录：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    对于令牌认证，请在 Matrix 客户端或管理界面中创建新的访问令牌，然后更新 OpenClaw：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    将 `assistant` 替换为失败命令中的账号 ID；如果是默认账号，则省略 `--account`。

  </Accordion>

  <Accordion title="设备卫生">
    旧的由 OpenClaw 管理的设备可能会不断累积。可列出并清理：

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="加密存储">
    Matrix E2EE 使用官方 `matrix-js-sdk` 的 Rust 加密路径，并以 `fake-indexeddb` 作为 IndexedDB shim。加密状态会持久化到 `crypto-idb-snapshot.json`（使用严格的文件权限）。

    加密运行时状态位于 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 下，包含同步存储、加密存储、恢复密钥、IDB 快照、线程绑定和启动验证状态。当令牌变化但账号身份保持不变时，OpenClaw 会复用现有的最佳根目录，以便此前状态仍然可见。

  </Accordion>
</AccordionGroup>

## 配置文件管理

更新所选账号的 Matrix 自身资料：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

你可以在一次调用中同时传入这两个选项。Matrix 可直接接受 `mxc://` 头像 URL；当你传入 `http://` 或 `https://` 时，OpenClaw 会先上传文件，再将解析后的 `mxc://` URL 存入 `channels.matrix.avatarUrl`（或每账号覆盖项）。

## 线程

Matrix 同时支持用于自动回复和消息工具发送的原生 Matrix 线程。两个彼此独立的开关控制其行为：

### 会话路由（`sessionScope`）

`dm.sessionScope` 决定 Matrix 私信房间如何映射到 OpenClaw 会话：

- `"per-user"`（默认）：与同一路由对端相关的所有私信房间共享一个会话。
- `"per-room"`：每个 Matrix 私信房间都有各自的会话键，即使对端相同也是如此。

显式会话绑定始终优先于 `sessionScope`，因此已绑定的房间和线程会保留其已选定的目标会话。

### 回复线程化（`threadReplies`）

`threadReplies` 决定机器人将回复发到哪里：

- `"off"`：回复位于顶层。入站线程消息仍保留在父会话中。
- `"inbound"`：仅当入站消息本来就在该线程中时，才在线程内回复。
- `"always"`：在以触发消息为根的线程内回复；从第一次触发开始，该对话会通过匹配的线程作用域会话进行路由。

`dm.threadReplies` 仅对私信覆盖此行为——例如，在保持私信扁平的同时，让房间线程彼此隔离。

### 线程继承和斜杠命令

- 入站线程消息会将线程根消息作为额外的智能体上下文。
- 当目标是同一房间（或同一私信用户目标）时，消息工具发送会自动继承当前 Matrix 线程，除非显式提供了 `threadId`。
- 仅当当前会话元数据能证明是在同一 Matrix 账号上的同一私信对端时，私信用户目标复用才会生效；否则 OpenClaw 会回退到普通的按用户作用域路由。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 和绑定到线程的 `/acp spawn` 都可在 Matrix 房间和私信中使用。
- 当 `threadBindings.spawnSubagentSessions: true` 时，顶层 `/focus` 会创建一个新的 Matrix 线程，并将其绑定到目标会话。
- 在现有 Matrix 线程内运行 `/focus` 或 `/acp spawn --thread here` 会就地绑定该线程。

当 OpenClaw 检测到某个 Matrix 私信房间与同一共享会话上的另一个私信房间发生冲突时，它会在该房间中发布一次性 `m.notice`，提示可使用 `/focus` 作为逃生口，并建议调整 `dm.sessionScope`。该通知仅在线程绑定启用时出现。

## ACP 对话绑定

Matrix 房间、私信和现有 Matrix 线程都可以转为持久化的 ACP 工作区，而无需改变聊天界面。

快速操作流程：

- 在你希望继续使用的 Matrix 私信、房间或现有线程中运行 `/acp spawn codex --bind here`。
- 在顶层 Matrix 私信或房间中，当前私信/房间会继续作为聊天界面，后续消息将路由到新建的 ACP 会话。
- 在现有 Matrix 线程内，`--bind here` 会就地绑定当前线程。
- `/new` 和 `/reset` 会就地重置同一个已绑定的 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

说明：

- `--bind here` 不会创建子 Matrix 线程。
- `threadBindings.spawnAcpSessions` 仅在 `/acp spawn --thread auto|here` 时才需要，因为此时 OpenClaw 需要创建或绑定子 Matrix 线程。

### 线程绑定配置

Matrix 会继承来自 `session.threadBindings` 的全局默认值，也支持按渠道覆盖：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix 线程绑定生成标志为可选启用：

- 设置 `threadBindings.spawnSubagentSessions: true`，以允许顶层 `/focus` 创建并绑定新的 Matrix 线程。
- 设置 `threadBindings.spawnAcpSessions: true`，以允许 `/acp spawn --thread auto|here` 将 ACP 会话绑定到 Matrix 线程。

## 回应

Matrix 支持出站回应、入站回应通知和确认回应。

出站回应工具受 `channels.matrix.actions.reactions` 控制：

- `react` 向 Matrix 事件添加一个回应。
- `reactions` 列出 Matrix 事件当前的回应摘要。
- `emoji=""` 会移除机器人在该事件上的所有回应。
- `remove: true` 仅移除机器人对此表情的回应。

**解析顺序**（先定义的值优先）：

| 设置                 | 顺序                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | 每账号 → 渠道 → `messages.ackReaction` → 智能体身份 emoji 回退值   |
| `ackReactionScope`      | 每账号 → 渠道 → `messages.ackReactionScope` → 默认 `"group-mentions"` |
| `reactionNotifications` | 每账号 → 渠道 → 默认 `"own"`                                          |

当 `reactionNotifications: "own"` 时，如果新增的 `m.reaction` 事件目标是由机器人撰写的 Matrix 消息，则会被转发；`"off"` 会禁用回应系统事件。回应移除不会被合成为系统事件，因为 Matrix 将其表现为 redaction，而不是独立的 `m.reaction` 移除事件。

## 历史上下文

- `channels.matrix.historyLimit` 控制当 Matrix 房间消息触发智能体时，作为 `InboundHistory` 包含多少条最近房间消息。它会回退到 `messages.groupChat.historyLimit`；如果两者都未设置，则有效默认值为 `0`。设为 `0` 可禁用。
- Matrix 房间历史仅限房间。私信仍使用普通会话历史。
- Matrix 房间历史仅记录待处理内容：OpenClaw 会缓冲尚未触发回复的房间消息，然后在提及或其他触发条件到来时对该窗口拍摄快照。
- 当前触发消息不会包含在 `InboundHistory` 中；在该轮中，它仍保留在主入站正文里。
- 对同一 Matrix 事件的重试会复用原始历史快照，而不是漂移到更新的房间消息。

## 上下文可见性

Matrix 支持共享的 `contextVisibility` 控制，用于补充房间上下文，例如提取到的回复文本、线程根消息和待处理历史。

- `contextVisibility: "all"` 为默认值。补充上下文会按接收时原样保留。
- `contextVisibility: "allowlist"` 会根据当前房间/用户允许列表检查，仅保留允许发送者的补充上下文。
- `contextVisibility: "allowlist_quote"` 的行为类似 `allowlist`，但仍会保留一条显式引用的回复。

该设置影响的是补充上下文的可见性，而不是入站消息本身能否触发回复。
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

如需在保留房间功能的同时完全静默私信，请设置 `dm.enabled: false`：

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

有关提及门控和允许列表行为，请参阅 [群组](/zh-CN/channels/groups)。

Matrix 私信的配对示例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果未获批准的 Matrix 用户在批准前持续向你发送消息，OpenClaw 会复用同一个待处理配对代码，并可能在短暂冷却后发送提醒回复，而不是生成新代码。

共享的私信配对流程和存储布局请参阅 [配对](/zh-CN/channels/pairing)。

## 直接房间修复

如果私信状态漂移不同步，OpenClaw 可能会保留指向旧单人房间而不是当前私信的陈旧 `m.direct` 映射。检查某个对端的当前映射：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修复它：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

这两个命令都接受 `--account <id>`，用于多账号设置。修复流程会：

- 优先选择已映射在 `m.direct` 中的严格 1:1 私信
- 若无，则回退到与该用户当前已加入的任意严格 1:1 私信
- 如果不存在健康私信，则创建一个新的直接房间并重写 `m.direct`

它不会自动删除旧房间。它会选定健康私信并更新映射，以便未来的 Matrix 发送、验证通知和其他私信流程都指向正确房间。

## Exec 审批

Matrix 可以作为原生审批客户端。请在 `channels.matrix.execApprovals` 下配置（或使用 `channels.matrix.accounts.<account>.execApprovals` 对单个账号覆盖）：

- `enabled`：通过 Matrix 原生提示传递审批。未设置或为 `"auto"` 时，一旦至少可解析出一个审批人，Matrix 就会自动启用。显式设为 `false` 可禁用。
- `approvers`：允许审批 exec 请求的 Matrix 用户 ID（`@owner:example.org`）。可选——会回退到 `channels.matrix.dm.allowFrom`。
- `target`：提示发送位置。`"dm"`（默认）发送到审批人的私信；`"channel"` 发送到发起请求的 Matrix 房间或私信；`"both"` 同时发送到两者。
- `agentFilter` / `sessionFilter`：可选允许列表，用于限定哪些智能体/会话会触发 Matrix 投递。

不同审批类型的授权略有不同：

- **Exec 审批** 使用 `execApprovals.approvers`，并回退到 `dm.allowFrom`。
- **插件审批** 仅通过 `dm.allowFrom` 授权。

两类审批共享 Matrix 回应快捷方式和消息更新。审批人会在主审批消息上看到回应快捷方式：

- `✅` 单次允许
- `❌` 拒绝
- `♾️` 始终允许（当有效 exec 策略允许时）

回退的斜杠命令：`/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

只有已解析的审批人才能批准或拒绝。Exec 审批的渠道投递会包含命令文本——仅应在受信任房间中启用 `channel` 或 `both`。

相关内容： [Exec 审批](/zh-CN/tools/exec-approvals)。

## 斜杠命令

斜杠命令（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` 等）可直接在私信中使用。在房间中，OpenClaw 也能识别以机器人自身 Matrix 提及为前缀的命令，因此 `@bot:server /new` 会触发命令路径，而无需自定义提及正则表达式。这样可确保当用户在 Element 等客户端中先通过 tab 补全机器人再输入命令时，机器人仍能响应这种房间风格的 `@mention /command` 消息。

授权规则仍然适用：命令发送者必须满足与普通消息相同的私信或房间允许列表/所有者策略。

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

- 顶层 `channels.matrix` 的值会作为命名账号的默认值，除非账号进行了覆盖。
- 可通过 `groups.<room>.account` 将继承的房间条目限定到特定账号。未带 `account` 的条目会在账号之间共享；当默认账号在顶层配置时，`account: "default"` 仍然有效。

**默认账号选择：**

- 设置 `defaultAccount` 以选择隐式路由、探测和 CLI 命令优先使用的命名账号。
- 如果你有多个账号，且其中一个账号名恰好为 `default`，即使未设置 `defaultAccount`，OpenClaw 也会隐式使用它。
- 如果你有多个命名账号且未选择默认账号，CLI 命令会拒绝猜测——请设置 `defaultAccount` 或传入 `--account <id>`。
- 只有当顶层 `channels.matrix.*` 的认证完整（`homeserver` + `accessToken`，或 `homeserver` + `userId` + `password`）时，它才会被视为隐式 `default` 账号。对于命名账号，只要缓存凭证覆盖了认证，仍可通过 `homeserver` + `userId` 发现。

**提升：**

- 当 OpenClaw 在修复或设置期间将单账号配置提升为多账号时，如果已存在命名账号，或 `defaultAccount` 已指向某个命名账号，它会保留该现有命名账号。只有 Matrix 认证/引导键会移入提升后的账号；共享的投递策略键仍保留在顶层。

共享的多账号模式请参阅 [配置参考](/zh-CN/gateway/config-channels#multi-account-all-channels)。

## 私有/LAN homeserver

默认情况下，出于 SSRF 防护考虑，OpenClaw 会阻止私有/内部 Matrix homeserver，除非你
为每个账号显式选择启用。

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
`http://matrix.example.org:8008`，仍会被阻止。尽可能优先使用 `https://`。

## 代理 Matrix 流量

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

命名账号可使用 `channels.matrix.accounts.<id>.proxy` 覆盖顶层默认值。
OpenClaw 会将相同的代理设置用于运行时 Matrix 流量和账号状态探测。

## 目标解析

无论 OpenClaw 在何处要求你提供房间或用户目标，Matrix 都接受以下目标形式：

- 用户：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房间：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 别名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

Matrix 房间 ID 区分大小写。在配置显式投递目标、cron 作业、绑定或允许列表时，
请使用 Matrix 中房间 ID 的精确大小写。
OpenClaw 会将内部会话键规范化后用于存储，因此这些小写键
不能可靠地作为 Matrix 投递 ID 的来源。

实时目录查找使用已登录的 Matrix 账号：

- 用户查找会查询该 homeserver 上的 Matrix 用户目录。
- 房间查找会直接接受显式房间 ID 和别名，然后回退为搜索该账号已加入的房间名称。
- 已加入房间名称查找是尽力而为的。如果房间名称无法解析为 ID 或别名，运行时允许列表解析会忽略它。

## 配置参考

允许列表风格字段（`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`）接受完整 Matrix 用户 ID（最安全）。精确的目录匹配会在启动时以及监视器运行期间允许列表发生变化时解析；无法解析的条目会在运行时被忽略。出于相同原因，房间允许列表优先使用房间 ID 或别名。

### 账号和连接

- `enabled`：启用或禁用该渠道。
- `name`：账号的可选显示标签。
- `defaultAccount`：配置多个 Matrix 账号时的首选账号 ID。
- `accounts`：命名的每账号覆盖。顶层 `channels.matrix` 值会作为默认值继承。
- `homeserver`：homeserver URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允许此账号连接到 `localhost`、LAN/Tailscale IP 或内部主机名。
- `proxy`：Matrix 流量的可选 HTTP(S) 代理 URL。支持每账号覆盖。
- `userId`：完整 Matrix 用户 ID（`@bot:example.org`）。
- `accessToken`：基于令牌认证的访问令牌。在环境变量/文件/exec 提供商中支持明文和 SecretRef 值（[Secrets Management](/zh-CN/gateway/secrets)）。
- `password`：基于密码登录的密码。支持明文和 SecretRef 值。
- `deviceId`：显式 Matrix 设备 ID。
- `deviceName`：密码登录时使用的设备显示名称。
- `avatarUrl`：用于资料同步和 `profile set` 更新的已存储自身头像 URL。
- `initialSyncLimit`：启动同步期间获取的最大事件数。

### 加密

- `encryption`：启用 E2EE。默认值：`false`。
- `startupVerification`：`"if-unverified"`（启用 E2EE 时的默认值）或 `"off"`。当此设备未验证时，会在启动时自动请求自验证。
- `startupVerificationCooldownHours`：下次自动启动请求前的冷却小时数。默认值：`24`。

### 访问和策略

- `groupPolicy`：`"open"`、`"allowlist"` 或 `"disabled"`。默认值：`"allowlist"`。
- `groupAllowFrom`：房间流量的用户 ID 允许列表。
- `dm.enabled`：当为 `false` 时，忽略所有私信。默认值：`true`。
- `dm.policy`：`"pairing"`（默认）、`"allowlist"`、`"open"` 或 `"disabled"`。它在机器人加入并将房间分类为私信后才生效；不会影响邀请处理。
- `dm.allowFrom`：私信流量的用户 ID 允许列表。
- `dm.sessionScope`：`"per-user"`（默认）或 `"per-room"`。
- `dm.threadReplies`：仅用于私信的回复线程覆盖（`"off"`、`"inbound"`、`"always"`）。
- `allowBots`：接受来自其他已配置 Matrix 机器人账号的消息（`true` 或 `"mentions"`）。
- `allowlistOnly`：当为 `true` 时，会将所有活动中的私信策略（除 `"disabled"` 外）和 `"open"` 群组策略强制为 `"allowlist"`。不会更改 `"disabled"` 策略。
- `autoJoin`：`"always"`、`"allowlist"` 或 `"off"`。默认值：`"off"`。适用于每个 Matrix 邀请，包括私信式邀请。
- `autoJoinAllowlist`：当 `autoJoin` 为 `"allowlist"` 时允许的房间/别名。别名条目会针对 homeserver 解析，而不是依据被邀请房间声称的状态进行解析。
- `contextVisibility`：补充上下文可见性（默认 `"all"`，另有 `"allowlist"`、`"allowlist_quote"`）。

### 回复行为

- `replyToMode`：`"off"`、`"first"`、`"all"` 或 `"batched"`。
- `threadReplies`：`"off"`、`"inbound"` 或 `"always"`。
- `threadBindings`：线程绑定会话路由和生命周期的按渠道覆盖。
- `streaming`：`"off"`（默认）、`"partial"`、`"quiet"`。`true` ↔ `"partial"`，`false` ↔ `"off"`。
- `blockStreaming`：当为 `true` 时，已完成的智能体块会作为单独的进度消息保留。
- `markdown`：出站文本的可选 Markdown 渲染配置。
- `responsePrefix`：附加在出站回复前的可选字符串。
- `textChunkLimit`：当 `chunkMode: "length"` 时，按字符数计算的出站分块大小。默认值：`4000`。
- `chunkMode`：`"length"`（默认，按字符数拆分）或 `"newline"`（按行边界拆分）。
- `historyLimit`：当房间消息触发智能体时，作为 `InboundHistory` 包含的最近房间消息数量。回退到 `messages.groupChat.historyLimit`；有效默认值为 `0`（禁用）。
- `mediaMaxMb`：用于出站发送和入站处理的媒体大小上限（MB）。

### 回应设置

- `ackReaction`：此渠道/账号的确认回应覆盖。
- `ackReactionScope`：作用域覆盖（默认 `"group-mentions"`，另有 `"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）。
- `reactionNotifications`：入站回应通知模式（默认 `"own"`，另有 `"off"`）。

### 工具和按房间覆盖

- `actions`：按操作的工具门控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`：按房间的策略映射。解析后，会话身份使用稳定房间 ID。`rooms` 是旧版别名。
  - `groups.<room>.account`：将一个继承的房间条目限制到特定账号。
  - `groups.<room>.allowBots`：对渠道级设置的按房间覆盖（`true` 或 `"mentions"`）。
  - `groups.<room>.users`：按房间的发送者允许列表。
  - `groups.<room>.tools`：按房间的工具允许/拒绝覆盖。
  - `groups.<room>.autoReply`：按房间的提及门控覆盖。`true` 会禁用该房间的提及要求；`false` 会重新强制启用。
  - `groups.<room>.skills`：按房间的 Skills 过滤器。
  - `groups.<room>.systemPrompt`：按房间的系统提示片段。

### Exec 审批设置

- `execApprovals.enabled`：通过 Matrix 原生提示传递 exec 审批。
- `execApprovals.approvers`：允许审批的 Matrix 用户 ID。回退到 `dm.allowFrom`。
- `execApprovals.target`：`"dm"`（默认）、`"channel"` 或 `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`：用于投递的可选智能体/会话允许列表。

## 相关内容

- [Channels Overview](/zh-CN/channels) — 所有受支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Security](/zh-CN/gateway/security) — 访问模型和加固
