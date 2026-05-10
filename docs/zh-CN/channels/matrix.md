---
read_when:
    - 在 OpenClaw 中设置 Matrix
    - 配置 Matrix E2EE 和验证
summary: Matrix 支持状态、设置和配置示例
title: Matrix
x-i18n:
    generated_at: "2026-05-10T19:22:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 111f7d4ce9b1c2ead6a69b5ba2e704cc273e759001f19555f61716f07210d8b2
    source_path: channels/matrix.md
    workflow: 16
---

Matrix 是 OpenClaw 的可下载渠道插件。
它使用官方 `matrix-js-sdk`，并支持私信、房间、线程、媒体、表情回应、投票、位置和 E2EE。

## 安装

配置渠道之前，先从 ClawHub 安装 Matrix：

```bash
openclaw plugins install @openclaw/matrix
```

裸插件规格会先尝试 ClawHub，然后回退到 npm。要强制指定注册表来源，请使用 `openclaw plugins install clawhub:@openclaw/matrix` 或 `openclaw plugins install npm:@openclaw/matrix`。

从本地检出安装：

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` 会注册并启用该插件，因此不需要单独执行 `openclaw plugins enable matrix` 步骤。在你完成下面的渠道配置之前，该插件仍然不会执行任何操作。有关通用插件行为和安装规则，请参阅 [插件](/zh-CN/tools/plugin)。

## 设置

1. 在你的 homeserver 上创建一个 Matrix 账号。
2. 使用 `homeserver` + `accessToken`，或 `homeserver` + `userId` + `password` 配置 `channels.matrix`。
3. 重启 Gateway 网关。
4. 与机器人发起私信，或邀请它加入房间（请参阅 [自动加入](#auto-join) - 只有当 `autoJoin` 允许时，新邀请才会生效）。

### 交互式设置

```bash
openclaw channels add
openclaw configure --section channels
```

向导会询问：homeserver URL、认证方式（访问令牌或密码）、用户 ID（仅密码认证）、可选设备名称、是否启用 E2EE，以及是否配置房间访问和自动加入。

如果匹配的 `MATRIX_*` 环境变量已经存在，并且所选账号没有保存的认证信息，向导会提供环境变量快捷方式。要在保存 allowlist 之前解析房间名称，请运行 `openclaw channels resolve --channel matrix "Project Room"`。启用 E2EE 时，向导会写入配置，并运行与 [`openclaw matrix encryption setup`](#encryption-and-verification) 相同的引导流程。

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

`channels.matrix.autoJoin` 默认是 `off`。使用默认值时，机器人不会出现在来自新邀请的新房间或私信中，直到你手动加入。

OpenClaw 无法在邀请时判断被邀请的房间是私信还是群组，因此所有邀请（包括私信形式的邀请）都会先经过 `autoJoin`。`dm.policy` 只会在之后应用，也就是机器人加入且房间完成分类之后。

<Warning>
设置 `autoJoin: "allowlist"` 和 `autoJoinAllowlist`，可限制机器人接受哪些邀请；或设置 `autoJoin: "always"`，接受所有邀请。

`autoJoinAllowlist` 只接受稳定目标：`!roomId:server`、`#alias:server` 或 `*`。纯房间名称会被拒绝；别名条目会针对 homeserver 解析，而不是针对受邀房间声明的状态解析。
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

### Allowlist 目标格式

私信和房间 allowlist 最好使用稳定 ID 填充：

- 私信（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）：使用 `@user:server`。只有当 homeserver 目录正好返回一个匹配项时，显示名称才会解析。
- 房间（`groups`、`autoJoinAllowlist`）：使用 `!room:server` 或 `#alias:server`。名称会尽力针对已加入房间解析；未解析的条目会在运行时被忽略。

### 账号 ID 规范化

向导会将友好名称转换为规范化账号 ID。例如，`Ops Bot` 会变成 `ops-bot`。标点符号会在作用域环境变量名称中转义，确保两个账号不会冲突：`-` → `_X2D_`，因此 `ops-prod` 会映射到 `MATRIX_OPS_X2D_PROD_*`。

### 缓存凭据

Matrix 将缓存凭据存储在 `~/.openclaw/credentials/matrix/` 下：

- 默认账号：`credentials.json`
- 命名账号：`credentials-<account>.json`

当其中存在缓存凭据时，即使访问令牌不在配置文件中，OpenClaw 也会将 Matrix 视为已配置；这涵盖设置、`openclaw doctor` 和渠道状态探测。

### 环境变量

当等效配置键未设置时使用。默认账号使用无前缀名称；命名账号会在后缀前插入账号 ID。

| 默认账号              | 命名账号（`<ID>` 是规范化账号 ID）                 |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

对于账号 `ops`，名称会变为 `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN`，依此类推。当你通过 `--recovery-key-stdin` 管道传入密钥时，支持恢复的 CLI 流程（`verify backup restore`、`verify device`、`verify bootstrap`）会读取恢复密钥环境变量。

`MATRIX_HOMESERVER` 不能从工作区 `.env` 设置；请参阅[工作区 `.env` 文件](/zh-CN/gateway/security)。

## 配置示例

一个包含私信配对、房间 allowlist 和 E2EE 的实用基线：

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

Matrix 回复流式传输是选择性启用的。`streaming` 控制 OpenClaw 如何交付生成中的助手回复；`blockStreaming` 控制是否将每个已完成的块保留为自己的 Matrix 消息。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

要保留实时回答预览，但隐藏中间工具/进度行，请使用对象形式：

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

| `streaming`       | 行为                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（默认）   | 等待完整回复，然后发送一次。`true` ↔ `"partial"`，`false` ↔ `"off"`。                                                                                                |
| `"partial"`       | 当模型写入当前块时，就地编辑一条普通文本消息。标准 Matrix 客户端可能会在第一次预览时通知，而不是在最终编辑时通知。                                                  |
| `"quiet"`         | 与 `"partial"` 相同，但消息是不会触发通知的 notice。只有当每用户推送规则匹配最终编辑时，接收者才会收到一次通知（见下文）。                                          |

`blockStreaming` 独立于 `streaming`：

| `streaming`             | `blockStreaming: true`                    | `blockStreaming: false`（默认）       |
| ----------------------- | ----------------------------------------- | ------------------------------------- |
| `"partial"` / `"quiet"` | 当前块的实时草稿，已完成块保留为消息      | 当前块的实时草稿，最终就地完成        |
| `"off"`                 | 每个完成块发送一条会通知的 Matrix 消息    | 完整回复发送一条会通知的 Matrix 消息  |

注意：

- 如果预览超过 Matrix 的单事件大小限制，OpenClaw 会停止预览流式传输，并回退到仅最终交付。
- 媒体回复始终正常发送附件。如果陈旧预览不再能安全复用，OpenClaw 会先将其撤回，再发送最终媒体回复。
- 当 Matrix 预览流式传输处于活动状态时，工具进度预览更新默认启用。设置 `streaming.preview.toolProgress: false` 可以保留回答文本的预览编辑，但让工具进度走正常交付路径。
- 预览编辑会产生额外的 Matrix API 调用。如果你想要最保守的限流配置，请保持 `streaming: "off"`。

## 审批元数据

Matrix 原生审批提示是普通 `m.room.message` 事件，其中 OpenClaw 专用的自定义事件内容位于 `com.openclaw.approval` 下。Matrix 允许自定义事件内容键，因此标准客户端仍会渲染文本正文，而支持 OpenClaw 的客户端可以读取结构化审批 ID、类型、状态、可用决策，以及 exec/插件详情。

当审批提示太长，无法放进一个 Matrix 事件时，OpenClaw 会将可见文本分块，并且只把 `com.openclaw.approval` 附加到第一个块。允许/拒绝决策的表情回应会绑定到第一个事件，因此长提示与单事件提示保持相同的审批目标。

### 用于 quiet 最终预览的自托管推送规则

`streaming: "quiet"` 只会在块或轮次最终完成时通知接收者，也就是必须有一条每用户推送规则匹配最终预览标记。完整流程（接收者令牌、pusher 检查、规则安装、按 homeserver 的注意事项）请参阅 [quiet 预览的 Matrix 推送规则](/zh-CN/channels/matrix-push-rules)。

## 机器人到机器人房间

默认情况下，来自其他已配置 OpenClaw Matrix 账号的 Matrix 消息会被忽略。

当你有意需要智能体之间的 Matrix 流量时，请使用 `allowBots`：

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

- `allowBots: true` 接受允许房间和私信中来自其他已配置 Matrix 机器人账号的消息。
- `allowBots: "mentions"` 只在这些消息在房间中明显提及此机器人时接受。私信仍然允许。
- `groups.<room>.allowBots` 会覆盖某个房间的账号级设置。
- OpenClaw 仍会忽略来自同一 Matrix 用户 ID 的消息，以避免自回复循环。
- Matrix 在这里不公开原生机器人标记；OpenClaw 将“机器人编写”视为“由此 OpenClaw Gateway 网关上的另一个已配置 Matrix 账号发送”。

在共享房间中启用机器人到机器人流量时，请使用严格的房间 allowlist 和提及要求。

## 加密和验证

在加密（E2EE）房间中，出站图片事件使用 `thumbnail_file`，因此图片预览会与完整附件一起加密。未加密房间仍使用普通 `thumbnail_url`。不需要配置，插件会自动检测 E2EE 状态。

所有 `openclaw matrix` 命令都接受 `--verbose`（完整诊断）、`--json`（机器可读输出）和 `--account <id>`（多账号设置）。默认输出简洁，并采用安静的内部 SDK 日志。下面的示例展示规范形式；按需添加这些标志。

### 启用加密

```bash
openclaw matrix encryption setup
```

引导密钥存储和交叉签名，必要时创建房间密钥备份，然后打印 Status 和后续步骤。常用标志：

- `--recovery-key <key>` 在引导前应用恢复密钥（优先使用下方记录的 stdin 形式）
- `--force-reset-cross-signing` 丢弃当前交叉签名身份并创建新的身份（仅在明确需要时使用）

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

### Status 和信任信号

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` 会报告三个独立的信任信号（`--verbose` 会显示全部）：

- `Locally trusted`：仅被此客户端信任
- `Cross-signing verified`：SDK 报告已通过交叉签名验证
- `Signed by owner`：由你自己的自签名密钥签名（仅用于诊断）

只有当 `Cross-signing verified` 为 `yes` 时，`Verified by owner` 才会变为 `yes`。仅本地信任或仅所有者签名都不够。

`--allow-degraded-local-state` 会在不先准备 Matrix 账号的情况下返回尽力而为的诊断；适用于离线或部分配置的探测。

### 使用恢复密钥验证此设备

恢复密钥是敏感信息，请通过 stdin 管道传入，而不是在命令行上传递。设置 `MATRIX_RECOVERY_KEY`（或为命名账号设置 `MATRIX_<ID>_RECOVERY_KEY`）：

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

该命令报告三种状态：

- `Recovery key accepted`：Matrix 接受了用于密钥存储或设备信任的密钥。
- `Backup usable`：可以用受信任的恢复材料加载房间密钥备份。
- `Device verified by owner`：此设备拥有完整的 Matrix 交叉签名身份信任。

当完整身份信任不完整时，即使恢复密钥已解锁备份材料，它也会以非零状态退出。在这种情况下，请从另一个 Matrix 客户端完成自验证：

```bash
openclaw matrix verify self
```

`verify self` 会等待 `Cross-signing verified: yes` 后再成功退出。使用 `--timeout-ms <ms>` 调整等待时间。

也接受字面密钥形式 `openclaw matrix verify device "<recovery-key>"`，但密钥会进入你的 shell 历史记录。

### 引导或修复交叉签名

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` 是加密账号的修复和设置命令。它会按顺序执行：

- 引导密钥存储，并尽可能复用现有恢复密钥
- 引导交叉签名并上传缺失的公钥
- 标记并交叉签名当前设备
- 如果尚不存在服务端房间密钥备份，则创建一个

如果 homeserver 要求 UIA 才能上传交叉签名密钥，OpenClaw 会先尝试无认证，然后尝试 `m.login.dummy`，再尝试 `m.login.password`（需要 `channels.matrix.password`）。

常用标志：

- `--recovery-key-stdin`（搭配 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`）或 `--recovery-key <key>`
- `--force-reset-cross-signing` 用于丢弃当前交叉签名身份（仅在明确需要时）

### 房间密钥备份

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` 显示服务端备份是否存在，以及此设备是否可以解密它。`backup restore` 会把已备份的房间密钥导入本地加密存储；如果恢复密钥已在磁盘上，可以省略 `--recovery-key-stdin`。

要用新的基线替换损坏的备份（接受丢失不可恢复的旧历史；如果当前备份密钥无法加载，也可以重新创建密钥存储）：

```bash
openclaw matrix verify backup reset --yes
```

只有当你明确希望旧恢复密钥不再能解锁新的备份基线时，才添加 `--rotate-recovery-key`。

### 列出、请求和响应验证

```bash
openclaw matrix verify list
```

列出所选账号的待处理验证请求。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

从此 OpenClaw 账号发送验证请求。`--own-user` 请求自验证（你在同一用户的另一个 Matrix 客户端中接受提示）；`--user-id`/`--device-id`/`--room-id` 指向其他人。`--own-user` 不能与其他目标标志组合使用。

对于更底层的生命周期处理，通常是在跟随另一个客户端的入站请求时，这些命令会作用于特定请求 `<id>`（由 `verify list` 和 `verify request` 打印）：

| 命令                                       | 用途                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 接受入站请求                                                        |
| `openclaw matrix verify start <id>`        | 启动 SAS 流程                                                       |
| `openclaw matrix verify sas <id>`          | 打印 SAS 表情或十进制数字                                           |
| `openclaw matrix verify confirm-sas <id>`  | 确认 SAS 与另一个客户端显示的内容匹配                               |
| `openclaw matrix verify mismatch-sas <id>` | 当表情或十进制数字不匹配时拒绝 SAS                                  |
| `openclaw matrix verify cancel <id>`       | 取消；接受可选的 `--reason <text>` 和 `--code <matrix-code>`         |

当验证锚定到特定私信房间时，`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas` 和 `cancel` 都接受 `--user-id` 和 `--room-id` 作为私信跟进提示。

### 多账号说明

如果没有 `--account <id>`，Matrix CLI 命令会使用隐式默认账号。如果你有多个命名账号且未设置 `channels.matrix.defaultAccount`，它们会拒绝猜测并要求你选择。当命名账号的 E2EE 已禁用或不可用时，错误会指向该账号的配置键，例如 `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="启动行为">
    使用 `encryption: true` 时，`startupVerification` 默认为 `"if-unverified"`。启动时，未验证设备会在另一个 Matrix 客户端中请求自验证，跳过重复请求并应用冷却时间（默认为 24 小时）。使用 `startupVerificationCooldownHours` 调整，或使用 `startupVerification: "off"` 禁用。

    启动时还会运行一个保守的加密引导过程，复用当前密钥存储和交叉签名身份。如果引导状态损坏，OpenClaw 即使没有 `channels.matrix.password` 也会尝试受保护的修复；如果 homeserver 要求密码 UIA，启动会记录警告并保持非致命状态。已由所有者签名的设备会被保留。

    完整升级流程请参阅 [Matrix 迁移](/zh-CN/channels/matrix-migration)。

  </Accordion>

  <Accordion title="验证通知">
    Matrix 会将验证生命周期通知作为 `m.notice` 消息发布到严格的私信验证房间中：请求、就绪（包含“通过表情验证”指引）、启动/完成，以及可用时的 SAS（表情/十进制）详情。

    来自另一个 Matrix 客户端的传入请求会被跟踪并自动接受。对于自验证，OpenClaw 会自动启动 SAS 流程，并在表情验证可用后确认自己这一侧，你仍然需要在你的 Matrix 客户端中比较并确认“它们匹配”。

    验证系统通知不会转发到 agent 聊天管道。

  </Accordion>

  <Accordion title="已删除或无效的 Matrix 设备">
    如果 `verify status` 表示当前设备已不再列在 homeserver 上，请创建新的 OpenClaw Matrix 设备。对于密码登录：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    对于令牌认证，请在你的 Matrix 客户端或管理 UI 中创建新的访问令牌，然后更新 OpenClaw：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    将 `assistant` 替换为失败命令中的账号 ID，或省略 `--account` 以使用默认账号。

  </Accordion>

  <Accordion title="设备清理">
    由 OpenClaw 管理的旧设备可能会累积。列出并清理：

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="加密存储">
    Matrix E2EE 使用官方 `matrix-js-sdk` Rust 加密路径，并用 `fake-indexeddb` 作为 IndexedDB shim。加密状态持久化到 `crypto-idb-snapshot.json`（限制性文件权限）。

    加密运行时状态位于 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 下，包括同步存储、加密存储、恢复密钥、IDB 快照、线程绑定和启动验证状态。当令牌变化但账号身份保持不变时，OpenClaw 会复用最佳的现有根目录，使先前状态仍然可见。

  </Accordion>
</AccordionGroup>

## 个人资料管理

更新所选账号的 Matrix 自身个人资料：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

你可以在一次调用中同时传递这两个选项。Matrix 直接接受 `mxc://` 头像 URL；当你传递 `http://` 或 `https://` 时，OpenClaw 会先上传文件，并将解析后的 `mxc://` URL 存入 `channels.matrix.avatarUrl`（或按账号的覆盖项）。

## 线程

Matrix 支持用于自动回复和消息工具发送的原生 Matrix 线程。两个独立的开关控制行为：

### 会话路由（`sessionScope`）

`dm.sessionScope` 决定 Matrix 私信房间如何映射到 OpenClaw 会话：

- `"per-user"`（默认）：与同一路由对端的所有私信房间共享一个会话。
- `"per-room"`：每个 Matrix 私信房间都有自己的会话键，即使对端相同。

显式对话绑定始终优先于 `sessionScope`，因此已绑定的房间和线程会保持其选定的目标会话。

### 回复线程（`threadReplies`）

`threadReplies` 决定机器人在哪里发布回复：

- `"off"`：回复为顶层消息。入站线程消息会留在父会话上。
- `"inbound"`：仅当入站消息已经在线程中时，才在线程内回复。
- `"always"`：在线程内回复，线程根为触发消息；从首次触发开始，该对话会通过匹配的线程作用域会话路由。

`dm.threadReplies` 仅为私信覆盖此设置，例如保持房间线程隔离，同时让私信保持扁平。

### 线程继承和斜杠命令

- 入站线程消息会将线程根消息作为额外智能体上下文包含进来。
- 消息工具发送在目标为同一 Matrix 房间（或同一私信用户目标）时会自动继承当前 Matrix 线程，除非提供了显式 `threadId`。
- 只有当当前会话元数据证明同一 Matrix 账户上的同一私信对端时，才会启用私信用户目标复用；否则 OpenClaw 会回退到普通的用户作用域路由。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 和线程绑定的 `/acp spawn` 都可在 Matrix 房间和私信中使用。
- 顶层 `/focus` 会创建一个新的 Matrix 线程，并在 `threadBindings.spawnSessions` 启用时将其绑定到目标会话。
- 在现有 Matrix 线程内运行 `/focus` 或 `/acp spawn --thread here` 会就地绑定该线程。

当 OpenClaw 检测到某个 Matrix 私信房间与同一共享会话上的另一个私信房间冲突时，会在该房间发布一次性 `m.notice`，指向 `/focus` 逃生路径并建议修改 `dm.sessionScope`。只有启用线程绑定时才会显示该通知。

## ACP 对话绑定

Matrix 房间、私信和现有 Matrix 线程都可以转换为持久 ACP 工作区，而无需改变聊天表面。

快速操作流程：

- 在你想继续使用的 Matrix 私信、房间或现有线程内运行 `/acp spawn codex --bind here`。
- 在顶层 Matrix 私信或房间中，当前私信/房间会保留为聊天表面，后续消息会路由到新生成的 ACP 会话。
- 在现有 Matrix 线程内，`--bind here` 会就地绑定当前线程。
- `/new` 和 `/reset` 会就地重置同一个已绑定的 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

注意：

- `--bind here` 不会创建子 Matrix 线程。
- `threadBindings.spawnSessions` 控制 `/acp spawn --thread auto|here`，此时 OpenClaw 需要创建或绑定子 Matrix 线程。

### 线程绑定配置

Matrix 会继承 `session.threadBindings` 的全局默认值，也支持按渠道覆盖：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix 线程绑定会话生成默认开启：

- 设置 `threadBindings.spawnSessions: false` 可阻止顶层 `/focus` 和 `/acp spawn --thread auto|here` 创建/绑定 Matrix 线程。
- 当原生子智能体线程生成不应分叉父级转录内容时，设置 `threadBindings.defaultSpawnContext: "isolated"`。

## 反应

Matrix 支持出站反应、入站反应通知和确认反应。

出站反应工具受 `channels.matrix.actions.reactions` 控制：

- `react` 向 Matrix 事件添加反应。
- `reactions` 列出 Matrix 事件的当前反应摘要。
- `emoji=""` 会移除机器人自己在该事件上的反应。
- `remove: true` 只会移除机器人指定的 emoji 反应。

**解析顺序**（第一个已定义值胜出）：

| 设置                    | 顺序                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | 按账户 → 渠道 → `messages.ackReaction` → 智能体身份 emoji 回退                   |
| `ackReactionScope`      | 按账户 → 渠道 → `messages.ackReactionScope` → 默认 `"group-mentions"`            |
| `reactionNotifications` | 按账户 → 渠道 → 默认 `"own"`                                                     |

`reactionNotifications: "own"` 会在新增的 `m.reaction` 事件以机器人撰写的 Matrix 消息为目标时转发这些事件；`"off"` 会禁用反应系统事件。反应移除不会被合成为系统事件，因为 Matrix 将其呈现为撤回，而不是独立的 `m.reaction` 移除。

## 历史上下文

- `channels.matrix.historyLimit` 控制当 Matrix 房间消息触发智能体时，有多少最近房间消息会作为 `InboundHistory` 包含进去。会回退到 `messages.groupChat.historyLimit`；如果两者都未设置，有效默认值为 `0`。设置为 `0` 可禁用。
- Matrix 房间历史仅限房间。私信继续使用普通会话历史。
- Matrix 房间历史仅包含待处理消息：OpenClaw 会缓冲尚未触发回复的房间消息，然后在提及或其他触发到达时对该窗口创建快照。
- 当前触发消息不会包含在 `InboundHistory` 中；它会保留在该轮的主入站正文中。
- 同一 Matrix 事件的重试会复用原始历史快照，而不是向前漂移到更新的房间消息。

## 上下文可见性

Matrix 支持共享的 `contextVisibility` 控件，用于补充房间上下文，例如获取到的回复文本、线程根消息和待处理历史。

- `contextVisibility: "all"` 是默认值。补充上下文会按接收内容保留。
- `contextVisibility: "allowlist"` 会过滤补充上下文，只发送通过活跃房间/用户 allowlist 检查的发送者内容。
- `contextVisibility: "allowlist_quote"` 的行为类似 `allowlist`，但仍会保留一条显式引用回复。

此设置影响补充上下文的可见性，而不影响入站消息本身是否可以触发回复。
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

要完全静默私信同时保持房间可用，请设置 `dm.enabled: false`：

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

请参阅 [群组](/zh-CN/channels/groups) 了解提及门控和 allowlist 行为。

Matrix 私信的配对示例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果未获批准的 Matrix 用户在批准前持续给你发消息，OpenClaw 会复用同一个待处理配对代码，并可能在短暂冷却后发送提醒回复，而不是生成新代码。

请参阅 [配对](/zh-CN/channels/pairing) 了解共享私信配对流程和存储布局。

## 直接房间修复

如果直接消息状态不同步，OpenClaw 可能会留下过时的 `m.direct` 映射，指向旧的单人房间而不是实时私信。检查某个对端的当前映射：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修复它：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

两个命令都接受 `--account <id>`，用于多账户设置。修复流程：

- 优先使用已在 `m.direct` 中映射的严格 1:1 私信
- 回退到当前已加入且包含该用户的任何严格 1:1 私信
- 如果不存在健康的私信，则创建新的直接房间并重写 `m.direct`

它不会自动删除旧房间。它会选择健康的私信并更新映射，以便后续 Matrix 发送、验证通知和其他直接消息流程以正确房间为目标。

## Exec 审批

Matrix 可以作为原生审批客户端。在 `channels.matrix.execApprovals` 下配置（或在 `channels.matrix.accounts.<account>.execApprovals` 下进行按账户覆盖）：

- `enabled`：通过 Matrix 原生提示递送审批。未设置或为 `"auto"` 时，只要至少能解析出一个审批者，Matrix 就会自动启用。设置为 `false` 可显式禁用。
- `approvers`：允许审批 exec 请求的 Matrix 用户 ID（`@owner:example.org`）。可选，会回退到 `channels.matrix.dm.allowFrom`。
- `target`：提示发送位置。`"dm"`（默认）发送给审批者私信；`"channel"` 发送到发起请求的 Matrix 房间或私信；`"both"` 同时发送到两者。
- `agentFilter` / `sessionFilter`：可选 allowlist，用于限定哪些智能体/会话触发 Matrix 递送。

不同审批类型的授权略有差异：

- **Exec 审批** 使用 `execApprovals.approvers`，并回退到 `dm.allowFrom`。
- **插件审批** 仅通过 `dm.allowFrom` 授权。

两种类型共享 Matrix 反应快捷方式和消息更新。审批者会在主审批消息上看到反应快捷方式：

- `✅` 允许一次
- `❌` 拒绝
- `♾️` 始终允许（当有效 exec 策略允许时）

备用斜杠命令：`/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

只有已解析的审批者可以批准或拒绝。Exec 审批的渠道递送会包含命令文本，仅在受信任房间中启用 `channel` 或 `both`。

相关：[Exec 审批](/zh-CN/tools/exec-approvals)。

## 斜杠命令

斜杠命令（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` 等）可直接在私信中使用。在房间中，OpenClaw 也会识别以机器人自己的 Matrix 提及为前缀的命令，因此 `@bot:server /new` 会触发命令路径，而不需要自定义提及正则表达式。这让机器人能够响应 Element 和类似客户端在用户通过 Tab 补全机器人后输入命令时发出的房间风格 `@mention /command` 帖子。

授权规则仍然适用：命令发送者必须满足与普通消息相同的私信或房间 allowlist/所有者策略。

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

- 顶层 `channels.matrix` 值会作为命名账户的默认值，除非账户覆盖它们。
- 使用 `groups.<room>.account` 将继承的房间条目限定到特定账户。没有 `account` 的条目会在账户之间共享；当默认账户配置在顶层时，`account: "default"` 仍然有效。

**默认账户选择：**

- 设置 `defaultAccount` 可选择隐式路由、探测和 CLI 命令偏好的命名账户。
- 如果你有多个账户，且其中一个字面上命名为 `default`，即使未设置 `defaultAccount`，OpenClaw 也会隐式使用它。
- 如果你有多个命名账户且未选择默认账户，CLI 命令会拒绝猜测，请设置 `defaultAccount` 或传入 `--account <id>`。
- 只有在顶层 `channels.matrix.*` 块的认证信息完整（`homeserver` + `accessToken`，或 `homeserver` + `userId` + `password`）时，它才会被视为隐式 `default` 账户。只要缓存凭证覆盖了认证，命名账户仍可通过 `homeserver` + `userId` 被发现。

**提升：**

- 当 OpenClaw 在修复或设置过程中将单账户配置提升为多账户配置时，如果已有命名账户，或 `defaultAccount` 已指向某个命名账户，它会保留现有命名账户。只有 Matrix 认证/引导键会移动到提升后的账户中；共享递送策略键会保留在顶层。

请参阅 [配置参考](/zh-CN/gateway/config-channels#multi-account-all-channels) 了解共享多账户模式。

## 私有/LAN homeserver

默认情况下，出于 SSRF 保护，OpenClaw 会阻止私有/内部 Matrix homeserver，除非你
按账户显式选择启用。

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

此选择加入项仅允许可信的私有/内部目标。公共明文主服务器，例如
`http://matrix.example.org:8008` 仍会被阻止。尽可能优先使用 `https://`。

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

命名账号可以通过 `channels.matrix.accounts.<id>.proxy` 覆盖顶层默认值。
OpenClaw 对运行时 Matrix 流量和账号状态探测使用相同的代理设置。

## 目标解析

在 OpenClaw 要求你提供房间或用户目标的任何位置，Matrix 都接受以下目标形式：

- 用户：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房间：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 别名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

Matrix 房间 ID 区分大小写。配置显式投递目标、cron 作业、绑定或允许列表时，请使用来自 Matrix 的准确房间 ID 大小写。
OpenClaw 会将内部会话键保持为规范形式用于存储，因此这些小写键不能作为 Matrix 投递 ID 的可靠来源。

实时目录查找使用已登录的 Matrix 账号：

- 用户查找会查询该主服务器上的 Matrix 用户目录。
- 房间查找会直接接受显式房间 ID 和别名，然后回退到搜索该账号已加入的房间名称。
- 已加入房间名称查找是尽力而为的。如果房间名称无法解析为 ID 或别名，运行时允许列表解析会忽略它。

## 配置参考

允许列表风格的字段（`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`）接受完整的 Matrix 用户 ID（最安全）。精确目录匹配会在启动时解析，并在监控器运行期间允许列表发生变化时重新解析；无法解析的条目会在运行时被忽略。出于同样原因，房间允许列表优先使用房间 ID 或别名。

### 账号和连接

- `enabled`：启用或禁用该渠道。
- `name`：账号的可选显示标签。
- `defaultAccount`：配置多个 Matrix 账号时的首选账号 ID。
- `accounts`：按账号命名的覆盖项。顶层 `channels.matrix` 值会作为默认值继承。
- `homeserver`：homeserver URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允许此账号连接到 `localhost`、LAN/Tailscale IP 或内部主机名。
- `proxy`：用于 Matrix 流量的可选 HTTP(S) 代理 URL。支持按账号覆盖。
- `userId`：完整的 Matrix 用户 ID（`@bot:example.org`）。
- `accessToken`：基于令牌认证的访问令牌。跨 env/file/exec 提供商支持明文和 SecretRef 值（[密钥管理](/zh-CN/gateway/secrets)）。
- `password`：基于密码登录的密码。支持明文和 SecretRef 值。
- `deviceId`：显式 Matrix 设备 ID。
- `deviceName`：密码登录时使用的设备显示名称。
- `avatarUrl`：为个人资料同步和 `profile set` 更新存储的自身头像 URL。
- `initialSyncLimit`：启动同步期间获取的最大事件数。

### 加密

- `encryption`：启用 E2EE。默认值：`false`。
- `startupVerification`：`"if-unverified"`（E2EE 开启时的默认值）或 `"off"`。当此设备未验证时，在启动时自动请求自验证。
- `startupVerificationCooldownHours`：下次自动启动请求前的冷却时间。默认值：`24`。

### 访问和策略

- `groupPolicy`：`"open"`、`"allowlist"` 或 `"disabled"`。默认值：`"allowlist"`。
- `groupAllowFrom`：房间流量的用户 ID 允许列表。
- `dm.enabled`：为 `false` 时，忽略所有私信。默认值：`true`。
- `dm.policy`：`"pairing"`（默认值）、`"allowlist"`、`"open"` 或 `"disabled"`。在 bot 加入并将房间分类为私信后应用；不影响邀请处理。
- `dm.allowFrom`：私信流量的用户 ID 允许列表。
- `dm.sessionScope`：`"per-user"`（默认值）或 `"per-room"`。
- `dm.threadReplies`：仅私信的回复线程覆盖项（`"off"`、`"inbound"`、`"always"`）。
- `allowBots`：接受来自其他已配置 Matrix bot 账号的消息（`true` 或 `"mentions"`）。
- `allowlistOnly`：为 `true` 时，将所有活跃私信策略（除 `"disabled"` 外）和 `"open"` 群组策略强制设为 `"allowlist"`。不会更改 `"disabled"` 策略。
- `autoJoin`：`"always"`、`"allowlist"` 或 `"off"`。默认值：`"off"`。适用于每个 Matrix 邀请，包括私信风格的邀请。
- `autoJoinAllowlist`：当 `autoJoin` 为 `"allowlist"` 时允许的房间/别名。别名条目会根据 homeserver 解析，而不是根据受邀房间声称的状态解析。
- `contextVisibility`：补充上下文可见性（默认 `"all"`、`"allowlist"`、`"allowlist_quote"`）。

### 回复行为

- `replyToMode`：`"off"`、`"first"`、`"all"` 或 `"batched"`。
- `threadReplies`：`"off"`、`"inbound"` 或 `"always"`。
- `threadBindings`：线程绑定会话路由和生命周期的按渠道覆盖项。
- `streaming`：`"off"`（默认值）、`"partial"`、`"quiet"`，或对象形式 `{ mode, preview: { toolProgress } }`。`true` ↔ `"partial"`，`false` ↔ `"off"`。
- `blockStreaming`：为 `true` 时，已完成的 assistant 块会保留为独立的进度消息。
- `markdown`：出站文本的可选 Markdown 渲染配置。
- `responsePrefix`：添加到出站回复前面的可选字符串。
- `textChunkLimit`：当 `chunkMode: "length"` 时，出站分块大小（字符数）。默认值：`4000`。
- `chunkMode`：`"length"`（默认，按字符数拆分）或 `"newline"`（按行边界拆分）。
- `historyLimit`：当房间消息触发智能体时，作为 `InboundHistory` 包含的最近房间消息数量。回退到 `messages.groupChat.historyLimit`；有效默认值为 `0`（禁用）。
- `mediaMaxMb`：出站发送和入站处理的媒体大小上限，单位为 MB。

### 反应设置

- `ackReaction`：此渠道/账号的确认反应覆盖项。
- `ackReactionScope`：作用域覆盖项（默认 `"group-mentions"`、`"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）。
- `reactionNotifications`：入站反应通知模式（默认 `"own"`、`"off"`）。

### 工具和按房间覆盖项

- `actions`：按操作的工具门控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`：按房间的策略映射。会话身份在解析后使用稳定的房间 ID。（`rooms` 是旧版别名。）
  - `groups.<room>.account`：将一个继承的房间条目限制到特定账号。
  - `groups.<room>.allowBots`：渠道级设置的按房间覆盖项（`true` 或 `"mentions"`）。
  - `groups.<room>.users`：按房间的发送者允许列表。
  - `groups.<room>.tools`：按房间的工具允许/拒绝覆盖项。
  - `groups.<room>.autoReply`：按房间的提及门控覆盖项。`true` 会为该房间禁用提及要求；`false` 会强制重新启用。
  - `groups.<room>.skills`：按房间的技能过滤器。
  - `groups.<room>.systemPrompt`：按房间的系统提示片段。

### Exec 审批设置

- `execApprovals.enabled`：通过 Matrix 原生提示投递 exec 审批。
- `execApprovals.approvers`：允许审批的 Matrix 用户 ID。回退到 `dm.allowFrom`。
- `execApprovals.target`：`"dm"`（默认值）、`"channel"` 或 `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`：用于投递的可选智能体/会话允许列表。

## 相关

- [渠道概览](/zh-CN/channels) - 所有支持的渠道
- [配对](/zh-CN/channels/pairing) - 私信认证和配对流程
- [群组](/zh-CN/channels/groups) - 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) - 消息的会话路由
- [安全](/zh-CN/gateway/security) - 访问模型和加固
