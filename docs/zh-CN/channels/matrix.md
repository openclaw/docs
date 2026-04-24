---
read_when:
    - 在 OpenClaw 中设置 Matrix
    - 配置 Matrix 端到端加密和验证
summary: Matrix 支持状态、设置和配置示例
title: Matrix
x-i18n:
    generated_at: "2026-04-24T03:37:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf25a6f64ed310f33b72517ccd1526876e27caae240e9fa837a86ca2c392ab25
    source_path: channels/matrix.md
    workflow: 15
---

Matrix 是 OpenClaw 的一个内置渠道插件。  
它使用官方 `matrix-js-sdk`，并支持私信、房间、线程、媒体、表情回应、投票、位置以及端到端加密（E2EE）。

## 内置插件

Matrix 在当前的 OpenClaw 版本中作为内置插件提供，因此常规的打包构建不需要单独安装。

如果你使用的是较旧的构建版本，或是不包含 Matrix 的自定义安装，请手动安装：

从 npm 安装：

```bash
openclaw plugins install @openclaw/matrix
```

从本地检出目录安装：

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

有关插件行为和安装规则，请参阅 [Plugins](/zh-CN/tools/plugin)。

## 设置

1. 确保 Matrix 插件可用。
   - 当前打包的 OpenClaw 版本已内置它。
   - 较旧版本或自定义安装可使用上面的命令手动添加。
2. 在你的 homeserver 上创建一个 Matrix 账号。
3. 使用以下任一方式配置 `channels.matrix`：
   - `homeserver` + `accessToken`，或
   - `homeserver` + `userId` + `password`。
4. 重启 Gateway 网关。
5. 与机器人发起私信，或将其邀请到房间中。
   - 只有当 `channels.matrix.autoJoin` 允许时，新建的 Matrix 邀请才会生效。

交互式设置路径：

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix 向导会询问：

- homeserver URL
- 认证方式：access token 或 password
- 用户 ID（仅密码认证时）
- 可选的设备名称
- 是否启用 E2EE
- 是否配置房间访问和邀请自动加入

向导的关键行为：

- 如果 Matrix 认证环境变量已存在，且该账号尚未在配置中保存认证信息，则向导会提供一个环境变量快捷方式，以便将认证信息保存在环境变量中。
- 账号名称会标准化为账号 ID。例如，`Ops Bot` 会变成 `ops-bot`。
- 私信允许列表条目可直接接受 `@user:server`；显示名称仅在实时目录查询找到唯一精确匹配时可用。
- 房间允许列表条目可直接接受房间 ID 和别名。优先使用 `!room:server` 或 `#alias:server`；未解析的名称在运行时进行允许列表解析时会被忽略。
- 在邀请自动加入的允许列表模式中，只能使用稳定的邀请目标：`!roomId:server`、`#alias:server` 或 `*`。普通房间名称会被拒绝。
- 若要在保存前解析房间名称，请使用 `openclaw channels resolve --channel matrix "Project Room"`。

<Warning>
`channels.matrix.autoJoin` 默认值为 `off`。

如果你不设置它，机器人将不会加入被邀请的房间或新建的私信式邀请，因此除非你先手动加入，否则它不会出现在新群组或受邀私信中。

设置 `autoJoin: "allowlist"` 并配合 `autoJoinAllowlist`，可限制它接受哪些邀请；或者设置 `autoJoin: "always"`，让它加入所有邀请。

在 `allowlist` 模式下，`autoJoinAllowlist` 只接受 `!roomId:server`、`#alias:server` 或 `*`。
</Warning>

允许列表示例：

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

加入所有邀请：

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

基于 token 的最小设置：

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

基于密码的设置（登录后会缓存 token）：

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

Matrix 会将缓存凭证存储在 `~/.openclaw/credentials/matrix/` 中。  
默认账号使用 `credentials.json`；命名账号使用 `credentials-<account>.json`。  
当该位置存在缓存凭证时，即使当前认证信息未直接写在配置中，OpenClaw 也会在设置、Doctor 和渠道状态发现中将 Matrix 视为已配置。

对应的环境变量（仅当配置键未设置时使用）：

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

对于非默认账号，请使用账号作用域环境变量：

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

账号 `ops` 的示例：

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

对于标准化账号 ID `ops-bot`，请使用：

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix 会对账号 ID 中的标点进行转义，以避免作用域环境变量发生冲突。  
例如，`-` 会变成 `_X2D_`，因此 `ops-prod` 会映射为 `MATRIX_OPS_X2D_PROD_*`。

只有当这些认证环境变量已存在，且所选账号尚未在配置中保存 Matrix 认证信息时，交互式向导才会提供环境变量快捷方式。

`MATRIX_HOMESERVER` 不能通过工作区 `.env` 设置；请参阅 [Workspace `.env` files](/zh-CN/gateway/security)。

## 配置示例

这是一个实用的基础配置，启用了私信配对、房间允许列表和 E2EE：

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
        "!roomid:example.org": {
          requireMention: true,
        },
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

`autoJoin` 适用于所有 Matrix 邀请，包括私信式邀请。OpenClaw 无法在邀请时可靠地将一个被邀请的房间分类为私信还是群组，因此所有邀请都会先经过 `autoJoin`。`dm.policy` 会在机器人加入后、并且该房间被分类为私信后才会生效。

## 流式预览

Matrix 回复流式传输为选择启用功能。

当你希望 OpenClaw 发送一条实时预览回复、在模型生成文本时原地编辑该预览，并在回复完成时将其定稿，请将 `channels.matrix.streaming` 设置为 `"partial"`：

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` 是默认值。OpenClaw 会等待最终回复并一次性发送。
- `streaming: "partial"` 会为当前 assistant block 创建一条可编辑的预览消息，使用普通 Matrix 文本消息。这会保留 Matrix 传统的“先预览后完成”通知行为，因此标准客户端可能会对第一段流式预览文本发出通知，而不是对最终完成的 block 发出通知。
- `streaming: "quiet"` 会为当前 assistant block 创建一条可编辑的静默预览通知。仅当你还为已定稿的预览编辑配置了接收方推送规则时才使用此选项。
- `blockStreaming: true` 会启用单独的 Matrix 进度消息。启用预览流式传输时，Matrix 会保留当前 block 的实时草稿，并将已完成的 block 保留为单独消息。
- 当预览流式传输开启且 `blockStreaming` 为关闭时，Matrix 会原地编辑实时草稿，并在 block 或整个轮次结束时定稿该同一事件。
- 如果预览内容不再适合放入单个 Matrix 事件中，OpenClaw 会停止预览流式传输，并回退到正常的最终发送方式。
- 媒体回复仍会正常发送附件。如果旧预览无法再被安全复用，OpenClaw 会先将其撤销标记，然后再发送最终的媒体回复。
- 预览编辑会增加额外的 Matrix API 调用。如果你想要最保守的速率限制行为，请保持关闭流式传输。

`blockStreaming` 本身不会启用草稿预览。  
使用 `streaming: "partial"` 或 `streaming: "quiet"` 进行预览编辑；然后仅在你还希望已完成的 assistant block 作为单独进度消息保留可见时，再添加 `blockStreaming: true`。

如果你需要标准 Matrix 通知而不想配置自定义推送规则，可使用 `streaming: "partial"` 以获得“先预览”行为，或保持 `streaming` 关闭以仅发送最终结果。对于 `streaming: "off"`：

- `blockStreaming: true` 会将每个已完成的 block 作为普通的 Matrix 通知消息发送。
- `blockStreaming: false` 只会将最终完整回复作为普通的 Matrix 通知消息发送。

### 自托管静默定稿预览的推送规则

静默流式传输（`streaming: "quiet"`）只会在某个 block 或轮次定稿后通知接收方——必须有一条按用户设置的推送规则匹配该定稿预览标记。完整设置（接收方 token、pusher 检查、规则安装、各 homeserver 说明）请参阅 [Matrix push rules for quiet previews](/zh-CN/channels/matrix-push-rules)。

## 机器人到机器人房间

默认情况下，来自其他已配置 OpenClaw Matrix 账号的 Matrix 消息会被忽略。

当你明确希望启用智能体之间的 Matrix 通信时，请使用 `allowBots`：

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
- `allowBots: "mentions"` 仅当这些消息在房间中显式提到此机器人时才接受。私信仍然允许。
- `groups.<room>.allowBots` 会覆盖某个房间的账号级设置。
- OpenClaw 仍会忽略来自相同 Matrix 用户 ID 的消息，以避免自回复循环。
- Matrix 在这里不提供原生机器人标记；OpenClaw 将“机器人发送”定义为“由此 OpenClaw Gateway 网关上的另一个已配置 Matrix 账号发送”。

在共享房间中启用机器人到机器人通信时，请使用严格的房间允许列表和提及要求。

## 加密和验证

在加密（E2EE）房间中，出站图片事件会使用 `thumbnail_file`，以便图片预览与完整附件一同加密。未加密房间仍使用普通的 `thumbnail_url`。无需任何配置——插件会自动检测 E2EE 状态。

启用加密：

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

验证命令（全部支持使用 `--verbose` 输出诊断信息，并支持使用 `--json` 输出机器可读结果）：

| 命令 | 用途 |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `openclaw matrix verify status` | 检查交叉签名和设备验证状态 |
| `openclaw matrix verify status --include-recovery-key --json` | 包含已存储的恢复密钥 |
| `openclaw matrix verify bootstrap` | 初始化交叉签名和验证（见下文） |
| `openclaw matrix verify bootstrap --force-reset-cross-signing` | 丢弃当前交叉签名身份并创建新的身份 |
| `openclaw matrix verify device "<recovery-key>"` | 使用恢复密钥验证此设备 |
| `openclaw matrix verify backup status` | 检查房间密钥备份健康状态 |
| `openclaw matrix verify backup restore` | 从服务器备份恢复房间密钥 |
| `openclaw matrix verify backup reset --yes` | 删除当前备份并创建全新基线（可能会重新创建 secret storage） |

在多账号设置中，除非你传入 `--account <id>`，否则 Matrix CLI 命令会使用隐式的 Matrix 默认账号。  
如果你配置了多个命名账号，请先设置 `channels.matrix.defaultAccount`，否则这些隐式 CLI 操作会停止并要求你显式选择一个账号。  
当你希望验证或设备操作明确针对某个命名账号时，请使用 `--account`：

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

当某个命名账号未启用加密或无法使用加密时，Matrix 警告和验证错误会指向该账号的配置键，例如 `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="已验证意味着什么">
    只有当你自己的交叉签名身份对某个设备进行了签名时，OpenClaw 才会将其视为已验证。`verify status --verbose` 会显示三个信任信号：

    - `Locally trusted`：仅被此客户端本地信任
    - `Cross-signing verified`：SDK 报告该设备已通过交叉签名验证
    - `Signed by owner`：已由你自己的 self-signing key 签名

    只有存在交叉签名或所有者签名时，`Verified by owner` 才会变为 `yes`。仅有本地信任还不够。

  </Accordion>

  <Accordion title="bootstrap 会做什么">
    `verify bootstrap` 是加密账号的修复和设置命令。按顺序，它会：

    - 初始化 secret storage，并在可能时复用现有恢复密钥
    - 初始化交叉签名并上传缺失的公开交叉签名密钥
    - 标记并交叉签名当前设备
    - 如果服务器端房间密钥备份尚不存在，则创建一个

    如果 homeserver 在上传交叉签名密钥时要求 UIA，OpenClaw 会先尝试无认证方式，然后尝试 `m.login.dummy`，再尝试 `m.login.password`（需要 `channels.matrix.password`）。仅当你明确要丢弃当前身份时，才使用 `--force-reset-cross-signing`。

  </Accordion>

  <Accordion title="全新的备份基线">
    如果你希望未来的加密消息继续可用，并接受丢失无法恢复的旧历史记录：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    添加 `--account <id>` 以指定某个命名账号。这也可能在当前备份 secret 无法安全加载时重新创建 secret storage。

  </Accordion>

  <Accordion title="启动行为">
    当设置 `encryption: true` 时，`startupVerification` 默认值为 `"if-unverified"`。启动时，未验证设备会在另一个 Matrix 客户端中请求自我验证，同时跳过重复请求并应用冷却时间。可使用 `startupVerificationCooldownHours` 调整，或使用 `startupVerification: "off"` 禁用。

    启动时还会运行一次保守的加密 bootstrap 流程，复用当前的 secret storage 和交叉签名身份。如果 bootstrap 状态损坏，即使没有 `channels.matrix.password`，OpenClaw 也会尝试进行受保护的修复；如果 homeserver 需要密码 UIA，启动时会记录警告，但不会导致致命错误。已由所有者签名的设备会被保留。

    完整升级流程请参阅 [Matrix migration](/zh-CN/install/migrating-matrix)。

  </Accordion>

  <Accordion title="验证通知">
    Matrix 会将验证生命周期通知作为 `m.notice` 消息发布到严格的私信验证房间中：请求、就绪（附带“通过 emoji 验证”的说明）、开始/完成，以及在可用时提供 SAS（emoji/十进制）详细信息。

    来自另一个 Matrix 客户端的传入请求会被跟踪并自动接受。对于自我验证，OpenClaw 会在 emoji 验证可用后自动启动 SAS 流程并确认自己这一侧——你仍然需要在你的 Matrix 客户端中比较并确认“它们匹配”。

    验证系统通知不会转发到智能体聊天流水线。

  </Accordion>

  <Accordion title="设备清理">
    旧的 OpenClaw 管理设备可能会不断累积。可列出并清理：

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="加密存储">
    Matrix E2EE 使用官方 `matrix-js-sdk` Rust 加密路径，并以 `fake-indexeddb` 作为 IndexedDB shim。加密状态会持久化到 `crypto-idb-snapshot.json`（文件权限受限）。

    加密运行时状态位于 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 下，其中包括 sync store、crypto store、恢复密钥、IDB 快照、线程绑定和启动验证状态。当 token 变化但账号身份保持不变时，OpenClaw 会复用现有的最佳根目录，因此先前状态仍然可见。

  </Accordion>
</AccordionGroup>

## 配置文件管理

使用以下命令更新所选账号的 Matrix 自身资料：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

如果你想显式针对某个命名 Matrix 账号，请添加 `--account <id>`。

Matrix 可直接接受 `mxc://` 头像 URL。  
当你传入 `http://` 或 `https://` 头像 URL 时，OpenClaw 会先将其上传到 Matrix，然后将解析后的 `mxc://` URL 回写到 `channels.matrix.avatarUrl`（或所选账号的覆盖配置）中。

## 线程

Matrix 同时支持自动回复和 message-tool 发送的原生 Matrix 线程。

- `dm.sessionScope: "per-user"`（默认）会让 Matrix 私信路由保持按发送者作用域，因此多个私信房间在解析到同一对端时可以共享一个会话。
- `dm.sessionScope: "per-room"` 会将每个 Matrix 私信房间隔离到各自独立的会话键中，同时仍使用普通私信认证和允许列表检查。
- 显式 Matrix 会话绑定仍然优先于 `dm.sessionScope`，因此已绑定的房间和线程会继续保持其所选目标会话。
- `threadReplies: "off"` 会让回复保持在顶层，并将传入的线程消息保留在父会话上。
- `threadReplies: "inbound"` 仅当传入消息已经位于某个线程中时，才在线程内回复。
- `threadReplies: "always"` 会将房间回复保持在线程中，该线程以触发消息为根，并从第一条触发消息起，通过匹配的线程作用域会话路由该会话。
- `dm.threadReplies` 仅覆盖私信的顶层设置。例如，你可以让房间线程保持隔离，同时让私信保持扁平化。
- 传入的线程消息会将线程根消息作为额外智能体上下文包含进来。
- 当目标是同一房间或同一私信用户目标时，message-tool 发送会自动继承当前 Matrix 线程，除非显式提供了 `threadId`。
- 仅当当前会话元数据能证明是同一 Matrix 账号上的同一私信对端时，才会启用同会话私信用户目标复用；否则 OpenClaw 会回退到普通的按用户作用域路由。
- 当 OpenClaw 发现一个 Matrix 私信房间与同一共享 Matrix 私信会话上的另一个私信房间发生冲突时，如果启用了线程绑定并设置了 `dm.sessionScope` 提示，它会在该房间中发布一次性的 `m.notice`，附带 `/focus` 逃生入口。
- Matrix 支持运行时线程绑定。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 以及线程绑定的 `/acp spawn` 可在 Matrix 房间和私信中使用。
- 当 `threadBindings.spawnSubagentSessions=true` 时，顶层 Matrix 房间/私信中的 `/focus` 会创建一个新的 Matrix 线程，并将其绑定到目标会话。
- 在现有 Matrix 线程中运行 `/focus` 或 `/acp spawn --thread here`，则会改为绑定当前线程本身。

## ACP 会话绑定

Matrix 房间、私信和现有 Matrix 线程都可以变成持久化的 ACP 工作区，而无需改变聊天界面。

快速操作流程：

- 在你想继续使用的 Matrix 私信、房间或现有线程中运行 `/acp spawn codex --bind here`。
- 在顶层 Matrix 私信或房间中，当前私信/房间会继续作为聊天界面，后续消息将路由到新建的 ACP 会话。
- 在现有线程中，`--bind here` 会将该当前线程原地绑定。
- `/new` 和 `/reset` 会原地重置同一个已绑定 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

说明：

- `--bind here` 不会创建子 Matrix 线程。
- 只有在 `/acp spawn --thread auto|here` 场景下，才需要 `threadBindings.spawnAcpSessions`，因为此时 OpenClaw 需要创建或绑定一个子 Matrix 线程。

### 线程绑定配置

Matrix 会继承来自 `session.threadBindings` 的全局默认值，同时也支持每渠道覆盖：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix 线程绑定的 spawn 标志为选择启用：

- 设置 `threadBindings.spawnSubagentSessions: true`，允许顶层 `/focus` 创建并绑定新的 Matrix 线程。
- 设置 `threadBindings.spawnAcpSessions: true`，允许 `/acp spawn --thread auto|here` 将 ACP 会话绑定到 Matrix 线程。

## 表情回应

Matrix 支持出站表情回应操作、入站表情回应通知和入站 ack 表情回应。

- 出站表情回应工具功能由 `channels["matrix"].actions.reactions` 控制。
- `react` 会向指定 Matrix 事件添加一个表情回应。
- `reactions` 会列出指定 Matrix 事件当前的表情回应摘要。
- `emoji=""` 会移除机器人账号在该事件上的所有自身表情回应。
- `remove: true` 仅移除机器人账号上的指定 emoji 表情回应。

ack 表情回应使用标准 OpenClaw 解析顺序：

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- 智能体身份 emoji 回退值

ack 表情回应范围按以下顺序解析：

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

表情回应通知模式按以下顺序解析：

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- 默认值：`own`

行为：

- `reactionNotifications: "own"` 会在新增的 `m.reaction` 事件针对机器人编写的 Matrix 消息时转发这些事件。
- `reactionNotifications: "off"` 会禁用表情回应系统事件。
- 表情回应移除不会被合成为系统事件，因为 Matrix 将其表现为 redaction，而不是独立的 `m.reaction` 移除事件。

## 历史上下文

- `channels.matrix.historyLimit` 控制当 Matrix 房间消息触发智能体时，作为 `InboundHistory` 包含多少条最近的房间消息。它会回退到 `messages.groupChat.historyLimit`；如果两者都未设置，则实际默认值为 `0`。设置为 `0` 可禁用。
- Matrix 房间历史仅限房间。私信仍使用正常的会话历史。
- Matrix 房间历史是“仅待处理”模式：OpenClaw 会缓冲那些尚未触发回复的房间消息，然后在提及或其他触发到来时对该窗口进行快照。
- 当前触发消息不会包含在 `InboundHistory` 中；在该轮中，它会保留在主入站正文里。
- 对同一个 Matrix 事件的重试会复用原始历史快照，而不会漂移到较新的房间消息。

## 上下文可见性

Matrix 支持共享的 `contextVisibility` 控制，用于补充房间上下文，例如获取到的回复文本、线程根消息和待处理历史。

- `contextVisibility: "all"` 是默认值。补充上下文会按接收时原样保留。
- `contextVisibility: "allowlist"` 会将补充上下文过滤为仅保留通过当前房间/用户允许列表检查的发送者内容。
- `contextVisibility: "allowlist_quote"` 的行为类似 `allowlist`，但仍会保留一条显式引用回复。

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
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

有关提及门控和允许列表行为，请参阅 [Groups](/zh-CN/channels/groups)。

Matrix 私信配对示例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果某个未获批准的 Matrix 用户在获批前持续给你发消息，OpenClaw 会复用同一个待处理配对码，并且在短暂冷却后可能再次发送提醒回复，而不是生成新的配对码。

共享的私信配对流程和存储布局请参阅 [Pairing](/zh-CN/channels/pairing)。

## 直连房间修复

如果直连消息状态不同步，OpenClaw 可能会留下过时的 `m.direct` 映射，指向旧的单人房间而不是当前正在使用的私信。使用以下命令查看某个对端的当前映射：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

使用以下命令修复：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修复流程：

- 优先选择已经在 `m.direct` 中映射的严格 1:1 私信
- 如果没有，则回退到当前已加入的、与该用户的任意严格 1:1 私信
- 如果不存在健康的私信，则创建一个新的直连房间并重写 `m.direct`

修复流程不会自动删除旧房间。它只会选出健康的私信并更新映射，以便新的 Matrix 发送、验证通知和其他直连消息流程再次定位到正确的房间。

## Exec 审批

Matrix 可以作为 Matrix 账号的原生审批客户端。原生私信/渠道路由控制项仍位于 exec 审批配置下：

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（可选；会回退到 `channels.matrix.dm.allowFrom`）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

审批人必须是 Matrix 用户 ID，例如 `@owner:example.org`。当 `enabled` 未设置或为 `"auto"`，且至少有一个审批人可解析时，Matrix 会自动启用原生审批。Exec 审批会优先使用 `execApprovals.approvers`，并可回退到 `channels.matrix.dm.allowFrom`。插件审批则通过 `channels.matrix.dm.allowFrom` 授权。设置 `enabled: false` 可显式禁用 Matrix 作为原生审批客户端。否则，审批请求会回退到其他已配置的审批路由或审批回退策略。

Matrix 原生路由支持两种审批类型：

- `channels.matrix.execApprovals.*` 控制 Matrix 审批提示的原生私信/渠道扇出模式。
- Exec 审批使用来自 `execApprovals.approvers` 或 `channels.matrix.dm.allowFrom` 的 exec 审批人集合。
- 插件审批使用来自 `channels.matrix.dm.allowFrom` 的 Matrix 私信允许列表。
- Matrix 表情回应快捷方式和消息更新适用于 exec 审批和插件审批。

发送规则：

- `target: "dm"` 会将审批提示发送到审批人的私信
- `target: "channel"` 会将提示发回到原始 Matrix 房间或私信
- `target: "both"` 会同时发送到审批人的私信和原始 Matrix 房间或私信

Matrix 审批提示会在主审批消息上预置表情回应快捷方式：

- `✅` = 允许一次
- `❌` = 拒绝
- `♾️` = 当该决定被当前生效的 exec 策略允许时，始终允许

审批人可以在该消息上添加表情回应，或使用回退斜杠命令：`/approve <id> allow-once`、`/approve <id> allow-always` 或 `/approve <id> deny`。

只有已解析的审批人才能批准或拒绝。对于 exec 审批，渠道发送会包含命令文本，因此只应在受信任房间中启用 `channel` 或 `both`。

每账号覆盖：

- `channels.matrix.accounts.<account>.execApprovals`

相关文档：[Exec approvals](/zh-CN/tools/exec-approvals)

## 斜杠命令

Matrix 斜杠命令（例如 `/new`、`/reset`、`/model`）可直接在私信中使用。在房间中，OpenClaw 也能识别以机器人自身 Matrix 提及为前缀的斜杠命令，因此 `@bot:server /new` 会触发命令路径，而无需自定义提及正则。这让机器人能够响应 Element 和类似客户端在用户先用 Tab 补全机器人名称、再输入命令时发出的房间式 `@mention /command` 消息。

授权规则仍然适用：命令发送者必须像普通消息一样满足私信或房间允许列表/所有者策略。

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

顶层 `channels.matrix` 值会作为命名账号的默认值，除非某个账号自行覆盖。  
你可以使用 `groups.<room>.account` 将继承的房间条目限定到某个 Matrix 账号。  
未带 `account` 的条目会在所有 Matrix 账号之间共享，而带有 `account: "default"` 的条目在默认账号直接配置在顶层 `channels.matrix.*` 时仍然有效。  
部分共享认证默认值本身不会创建单独的隐式默认账号。只有当该默认账号具有新的认证信息（`homeserver` 加 `accessToken`，或 `homeserver` 加 `userId` 和 `password`）时，OpenClaw 才会合成顶层 `default` 账号；命名账号仍可在稍后由缓存凭证满足认证时，通过 `homeserver` 加 `userId` 的方式保持可发现。  
如果 Matrix 已经恰好有一个命名账号，或者 `defaultAccount` 指向现有命名账号键，则单账号到多账号的修复/设置提升会保留该账号，而不是创建新的 `accounts.default` 条目。只有 Matrix 认证/bootstrap 键会移动到被提升的账号中；共享的发送策略键仍保留在顶层。  
当你希望 OpenClaw 在隐式路由、探测和 CLI 操作中优先使用某个命名 Matrix 账号时，请设置 `defaultAccount`。  
如果配置了多个 Matrix 账号，且其中一个账号 ID 为 `default`，即使 `defaultAccount` 未设置，OpenClaw 也会隐式使用该账号。  
如果你配置了多个命名账号，请设置 `defaultAccount`，或为依赖隐式账号选择的 CLI 命令传入 `--account <id>`。  
当你想针对单个命令覆盖该隐式选择时，请向 `openclaw matrix verify ...` 和 `openclaw matrix devices ...` 传入 `--account <id>`。

共享的多账号模式请参阅 [Configuration reference](/zh-CN/gateway/config-channels#multi-account-all-channels)。

## 私有/LAN homeserver

默认情况下，出于 SSRF 保护，OpenClaw 会阻止连接私有/内部 Matrix homeserver，除非你为每个账号显式选择启用。

如果你的 homeserver 运行在 localhost、LAN/Tailscale IP 或内部主机名上，请为该 Matrix 账号启用 `network.dangerouslyAllowPrivateNetwork`：

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

此选择启用仅允许受信任的私有/内部目标。像 `http://matrix.example.org:8008` 这样的公开明文 homeserver 仍会被阻止。尽可能优先使用 `https://`。

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
OpenClaw 对运行时 Matrix 流量和账号状态探测都会使用同一代理设置。

## 目标解析

在 OpenClaw 要求你提供房间或用户目标的任何位置，Matrix 都接受以下目标形式：

- 用户：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房间：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 别名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

实时目录查询使用已登录的 Matrix 账号：

- 用户查询会在该 homeserver 的 Matrix 用户目录中进行。
- 房间查询会直接接受显式房间 ID 和别名，然后回退为搜索该账号已加入房间的名称。
- 已加入房间名称查询是尽力而为的。如果某个房间名称无法解析为 ID 或别名，它会在运行时允许列表解析中被忽略。

## 配置参考

- `enabled`：启用或禁用该渠道。
- `name`：账号的可选标签。
- `defaultAccount`：配置了多个 Matrix 账号时的首选账号 ID。
- `homeserver`：homeserver URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允许此 Matrix 账号连接到私有/内部 homeserver。当 homeserver 解析到 `localhost`、LAN/Tailscale IP 或诸如 `matrix-synapse` 这样的内部主机时，请启用此项。
- `proxy`：Matrix 流量的可选 HTTP(S) 代理 URL。命名账号可以用自己的 `proxy` 覆盖顶层默认值。
- `userId`：完整的 Matrix 用户 ID，例如 `@bot:example.org`。
- `accessToken`：用于基于 token 认证的 access token。`channels.matrix.accessToken` 和 `channels.matrix.accounts.<id>.accessToken` 支持明文值和 SecretRef 值，适用于 env/file/exec 提供商。请参阅 [Secrets Management](/zh-CN/gateway/secrets)。
- `password`：用于基于密码登录的密码。支持明文值和 SecretRef 值。
- `deviceId`：显式 Matrix 设备 ID。
- `deviceName`：用于密码登录的设备显示名称。
- `avatarUrl`：用于资料同步和 `profile set` 更新的已存储自身头像 URL。
- `initialSyncLimit`：启动同步期间获取的最大事件数。
- `encryption`：启用 E2EE。
- `allowlistOnly`：当为 `true` 时，会将 `open` 房间策略升级为 `allowlist`，并强制所有活动中的私信策略（除 `disabled` 外，包括 `pairing` 和 `open`）变为 `allowlist`。不影响 `disabled` 策略。
- `allowBots`：允许来自其他已配置 OpenClaw Matrix 账号的消息（`true` 或 `"mentions"`）。
- `groupPolicy`：`open`、`allowlist` 或 `disabled`。
- `contextVisibility`：补充房间上下文的可见性模式（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`：房间流量的允许列表用户 ID。完整 Matrix 用户 ID 最安全；当监视器运行时，在启动时以及允许列表变化时会解析精确的目录匹配。无法解析的名称会被忽略。
- `historyLimit`：作为群组历史上下文包含的最大房间消息数。会回退到 `messages.groupChat.historyLimit`；如果两者都未设置，则实际默认值为 `0`。设置为 `0` 可禁用。
- `replyToMode`：`off`、`first`、`all` 或 `batched`。
- `markdown`：出站 Matrix 文本的可选 Markdown 渲染配置。
- `streaming`：`off`（默认）、`"partial"`、`"quiet"`、`true` 或 `false`。`"partial"` 和 `true` 会使用普通 Matrix 文本消息启用“预览优先”的草稿更新。`"quiet"` 则为自托管推送规则设置使用不通知的预览通知。`false` 等同于 `"off"`。
- `blockStreaming`：当草稿预览流式传输处于活动状态时，`true` 会为已完成的 assistant block 启用单独的进度消息。
- `threadReplies`：`off`、`inbound` 或 `always`。
- `threadBindings`：线程绑定会话路由和生命周期的每渠道覆盖。
- `startupVerification`：启动时自动自我验证请求模式（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`：再次尝试自动启动验证请求前的冷却小时数。
- `textChunkLimit`：出站消息按字符计的分块大小限制（当 `chunkMode` 为 `length` 时适用）。
- `chunkMode`：`length` 按字符数拆分消息；`newline` 按行边界拆分。
- `responsePrefix`：为该渠道所有出站回复添加的可选前缀字符串。
- `ackReaction`：该渠道/账号的可选 ack 表情回应覆盖值。
- `ackReactionScope`：可选 ack 表情回应范围覆盖（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`：入站表情回应通知模式（`own`、`off`）。
- `mediaMaxMb`：出站发送和入站媒体处理的媒体大小上限（MB）。
- `autoJoin`：邀请自动加入策略（`always`、`allowlist`、`off`）。默认值：`off`。适用于所有 Matrix 邀请，包括私信式邀请。
- `autoJoinAllowlist`：当 `autoJoin` 为 `allowlist` 时允许的房间/别名。别名条目会在处理邀请时解析为房间 ID；OpenClaw 不信任被邀请房间宣称的别名状态。
- `dm`：私信策略块（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.policy`：控制 OpenClaw 加入房间并将其分类为私信之后的私信访问。它不会改变邀请是否自动加入。
- `dm.allowFrom`：私信流量的允许列表用户 ID。完整 Matrix 用户 ID 最安全；当监视器运行时，在启动时以及允许列表变化时会解析精确的目录匹配。无法解析的名称会被忽略。
- `dm.sessionScope`：`per-user`（默认）或 `per-room`。如果你希望即使对端相同，每个 Matrix 私信房间也保持独立上下文，请使用 `per-room`。
- `dm.threadReplies`：仅私信的线程策略覆盖（`off`、`inbound`、`always`）。它会覆盖顶层 `threadReplies` 设置，影响私信中的回复位置和会话隔离。
- `execApprovals`：Matrix 原生 exec 审批发送（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`：允许批准 exec 请求的 Matrix 用户 ID。当 `dm.allowFrom` 已经标识出审批人时可选。
- `execApprovals.target`：`dm | channel | both`（默认：`dm`）。
- `accounts`：命名的每账号覆盖。顶层 `channels.matrix` 值会作为这些条目的默认值。
- `groups`：每房间策略映射。优先使用房间 ID 或别名；无法解析的房间名称会在运行时被忽略。解析后会话/群组身份使用稳定的房间 ID。
- `groups.<room>.account`：在多账号设置中，将某个继承的房间条目限制到特定 Matrix 账号。
- `groups.<room>.allowBots`：针对已配置机器人发送者的房间级覆盖（`true` 或 `"mentions"`）。
- `groups.<room>.users`：每房间发送者允许列表。
- `groups.<room>.tools`：每房间工具允许/拒绝覆盖。
- `groups.<room>.autoReply`：房间级提及门控覆盖。`true` 会禁用该房间的提及要求；`false` 会强制重新启用。
- `groups.<room>.skills`：可选的房间级 Skills 过滤器。
- `groups.<room>.systemPrompt`：可选的房间级 system prompt 片段。
- `rooms`：`groups` 的旧别名。
- `actions`：每操作工具门控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 相关内容

- [Channels Overview](/zh-CN/channels) — 所有支持的渠道
- [Pairing](/zh-CN/channels/pairing) — 私信认证和配对流程
- [Groups](/zh-CN/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Security](/zh-CN/gateway/security) — 访问模型和加固
