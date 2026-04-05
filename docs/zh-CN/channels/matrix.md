---
read_when:
    - 在 OpenClaw 中设置 Matrix
    - 配置 Matrix E2EE 和验证
summary: Matrix 支持状态、设置与配置示例
title: Matrix
x-i18n:
    generated_at: "2026-04-05T08:17:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba5c49ad2125d97adf66b5517f8409567eff8b86e20224a32fcb940a02cb0659
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix 是 OpenClaw 的 Matrix 内置渠道插件。
它使用官方 `matrix-js-sdk`，并支持私信、房间、线程、媒体、reactions、投票、位置以及 E2EE。

## 内置插件

Matrix 随当前的 OpenClaw 版本作为内置插件提供，因此普通打包构建不需要单独安装。

如果你使用的是较旧的构建版本，或不包含 Matrix 的自定义安装，请手动安装：

从 npm 安装：

```bash
openclaw plugins install @openclaw/matrix
```

从本地检出安装：

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

有关插件行为和安装规则，请参阅 [插件](/tools/plugin)。

## 设置

1. 确保 Matrix 插件可用。
   - 当前打包的 OpenClaw 版本已内置它。
   - 较旧 / 自定义安装可使用上述命令手动添加。
2. 在你的 homeserver 上创建一个 Matrix 账户。
3. 使用以下其中一种方式配置 `channels.matrix`：
   - `homeserver` + `accessToken`，或
   - `homeserver` + `userId` + `password`。
4. 重启 Gateway 网关。
5. 与机器人发起私信，或邀请它加入房间。

交互式设置路径：

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix 向导实际会询问以下内容：

- homeserver URL
- 认证方式：access token 或 password
- 仅当你选择 password 认证时才会询问 user ID
- 可选的设备名称
- 是否启用 E2EE
- 是否现在就配置 Matrix 房间访问

需要注意的向导行为：

- 如果所选账户已存在 Matrix 认证环境变量，且该账户的配置中尚未保存认证信息，向导会提供环境变量快捷方式，并且只会为该账户写入 `enabled: true`。
- 当你以交互方式添加另一个 Matrix 账户时，输入的账户名会被规范化为配置和环境变量中使用的账户 ID。例如，`Ops Bot` 会变成 `ops-bot`。
- 私信 allowlist 提示可直接接受完整的 `@user:server` 值。显示名称仅在实时目录查找能找到唯一精确匹配时才有效；否则向导会要求你使用完整 Matrix ID 重试。
- 房间 allowlist 提示可直接接受房间 ID 和别名。它们也可以实时解析已加入房间的名称，但无法解析的名称只会在设置期间按原样保留，之后会在运行时 allowlist 解析中被忽略。优先使用 `!room:server` 或 `#alias:server`。
- 运行时房间 / 会话身份使用稳定的 Matrix 房间 ID。房间声明的别名仅作为查找输入使用，不作为长期会话键或稳定群组身份。
- 若要在保存前解析房间名称，请使用 `openclaw channels resolve --channel matrix "Project Room"`。

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

基于 password 的设置（登录后会缓存 token）：

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
默认账户使用 `credentials.json`；具名账户使用 `credentials-<account>.json`。

对应的环境变量（当未设置配置键时使用）：

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

对于非默认账户，请使用带账户作用域的环境变量：

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

以账户 `ops` 为例：

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

对于规范化账户 ID `ops-bot`，请使用：

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix 会对账户 ID 中的标点符号进行转义，以避免带作用域环境变量发生冲突。
例如，`-` 会变成 `_X2D_`，因此 `ops-prod` 会映射到 `MATRIX_OPS_X2D_PROD_*`。

只有当这些认证环境变量已经存在，且所选账户的配置中尚未保存 Matrix 认证信息时，交互式向导才会提供环境变量快捷方式。

## 配置示例

这是一个实用的基线配置，启用了私信配对、房间 allowlist 和 E2EE：

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

## 流式预览

Matrix 回复流式传输需要显式启用。

当你希望 OpenClaw 发送一条草稿回复、在模型生成文本时原地编辑这条草稿，并在回复完成后最终定稿时，请将 `channels.matrix.streaming` 设为 `"partial"`：

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` 是默认值。OpenClaw 会等待最终回复，然后只发送一次。
- `streaming: "partial"` 会为当前 assistant 块创建一条可编辑的预览消息，而不是发送多条部分消息。
- `blockStreaming: true` 会启用单独的 Matrix 进度消息。配合 `streaming: "partial"` 时，Matrix 会为当前块保留实时草稿，并将已完成的块保留为单独消息。
- 当 `streaming: "partial"` 且 `blockStreaming` 关闭时，Matrix 只会编辑实时草稿，并在该块或该回合完成后发送完成的回复。
- 如果预览内容已无法放进单个 Matrix 事件中，OpenClaw 会停止预览流式传输，并回退到普通的最终投递。
- 媒体回复仍会正常发送附件。如果某条过期预览已无法安全复用，OpenClaw 会在发送最终媒体回复前将其 redact。
- 预览编辑会产生额外的 Matrix API 调用。如果你希望采用最保守的速率限制行为，请保持关闭流式传输。

`blockStreaming` 本身不会启用草稿预览。
如需预览编辑，请使用 `streaming: "partial"`；然后仅当你还希望已完成的 assistant 块保留为单独的进度消息时，再添加 `blockStreaming: true`。

## 加密与验证

在加密（E2EE）房间中，出站图片事件使用 `thumbnail_file`，因此图片预览会与完整附件一起加密。未加密房间仍使用普通的 `thumbnail_url`。无需配置——插件会自动检测 E2EE 状态。

### 机器人对机器人房间

默认情况下，来自其他已配置 OpenClaw Matrix 账户的 Matrix 消息会被忽略。

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

- `allowBots: true` 会在允许的房间和私信中接受来自其他已配置 Matrix 机器人账户的消息。
- `allowBots: "mentions"` 仅当这些消息在房间中明确提及本机器人时才接受。私信仍然允许。
- `groups.<room>.allowBots` 会覆盖某一个房间的账户级设置。
- OpenClaw 仍会忽略来自同一个 Matrix user ID 的消息，以避免自回复循环。
- Matrix 在这里不暴露原生机器人标记；OpenClaw 将“机器人发送”视为“由此 OpenClaw Gateway 网关上另一个已配置 Matrix 账户发送”。

在共享房间中启用机器人对机器人通信时，请使用严格的房间 allowlist 和提及要求。

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

检查验证状态：

```bash
openclaw matrix verify status
```

详细状态（完整诊断）：

```bash
openclaw matrix verify status --verbose
```

在机器可读输出中包含已存储的恢复密钥：

```bash
openclaw matrix verify status --include-recovery-key --json
```

引导建立 cross-signing 和验证状态：

```bash
openclaw matrix verify bootstrap
```

多账户支持：使用 `channels.matrix.accounts` 设置按账户区分的凭证和可选 `name`。共享模式请参阅 [配置参考](/gateway/configuration-reference#multi-account-all-channels)。

详细的 bootstrap 诊断：

```bash
openclaw matrix verify bootstrap --verbose
```

在 bootstrap 前强制重置 cross-signing 身份：

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

使用恢复密钥验证此设备：

```bash
openclaw matrix verify device "<your-recovery-key>"
```

详细的设备验证信息：

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

检查房间密钥备份健康状态：

```bash
openclaw matrix verify backup status
```

详细的备份健康诊断：

```bash
openclaw matrix verify backup status --verbose
```

从服务器备份恢复房间密钥：

```bash
openclaw matrix verify backup restore
```

详细的恢复诊断：

```bash
openclaw matrix verify backup restore --verbose
```

删除当前服务器备份并创建全新的备份基线。如果已存储的备份密钥无法被干净地加载，此重置也可以重新创建 secret storage，以便未来冷启动时可以加载新的备份密钥：

```bash
openclaw matrix verify backup reset --yes
```

所有 `verify` 命令默认都保持简洁（包括安静的内部 SDK 日志），仅在使用 `--verbose` 时显示详细诊断。
编写脚本时请使用 `--json` 获取完整的机器可读输出。

在多账户设置中，除非你传入 `--account <id>`，否则 Matrix CLI 命令会使用隐式的 Matrix 默认账户。
如果你配置了多个具名账户，请先设置 `channels.matrix.defaultAccount`，否则这些隐式 CLI 操作会停止并要求你显式选择一个账户。
当你希望某条验证或设备操作显式作用于某个具名账户时，请使用 `--account`：

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

当某个具名账户的加密被禁用或不可用时，Matrix 警告和验证错误会指向该账户的配置键，例如 `channels.matrix.accounts.assistant.encryption`。

### “已验证”是什么意思

只有当这个 Matrix 设备被你自己的 cross-signing 身份验证后，OpenClaw 才会将其视为已验证。
实际上，`openclaw matrix verify status --verbose` 会暴露三个信任信号：

- `Locally trusted`：此设备仅被当前客户端信任
- `Cross-signing verified`：SDK 报告该设备已通过 cross-signing 验证
- `Signed by owner`：该设备由你自己的 self-signing key 签名

只有在存在 cross-signing 验证或所有者签名时，`Verified by owner` 才会变为 `yes`。
仅有本地信任不足以让 OpenClaw 将设备视为完全已验证。

### bootstrap 会做什么

`openclaw matrix verify bootstrap` 是加密 Matrix 账户的修复与设置命令。
它会按顺序完成以下所有操作：

- 引导建立 secret storage，并在可能时复用现有恢复密钥
- 引导建立 cross-signing，并上传缺失的公开 cross-signing keys
- 尝试标记并 cross-sign 当前设备
- 如果服务器端尚不存在房间密钥备份，则创建一个新的备份

如果 homeserver 上传 cross-signing keys 时要求交互式认证，OpenClaw 会先尝试无认证上传，然后使用 `m.login.dummy`，最后在配置了 `channels.matrix.password` 时使用 `m.login.password`。

仅当你明确希望丢弃当前 cross-signing 身份并创建新身份时，才使用 `--force-reset-cross-signing`。

如果你明确希望丢弃当前房间密钥备份，并为未来消息启动一个新的备份基线，请使用 `openclaw matrix verify backup reset --yes`。
只有在你接受无法恢复的旧加密历史将继续不可用，并且 OpenClaw 可能会在当前备份 secret 无法安全加载时重新创建 secret storage 的情况下，才这样做。

### 全新备份基线

如果你希望未来的加密消息继续正常工作，并接受丢失无法恢复的旧历史，请按顺序运行以下命令：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

如果你希望显式指定某个具名 Matrix 账户，请为每条命令添加 `--account <id>`。

### 启动行为

当 `encryption: true` 时，Matrix 会将 `startupVerification` 默认设为 `"if-unverified"`。
启动时，如果此设备仍未验证，Matrix 会在另一个 Matrix 客户端中请求自我验证；如果已有请求待处理，则跳过重复请求；并在重启后重试前应用本地冷却时间。
默认情况下，创建请求失败后的重试会比成功创建请求后的重试更快。
如果你想禁用自动启动请求，请设置 `startupVerification: "off"`；如果你希望缩短或延长重试窗口，请调整 `startupVerificationCooldownHours`。

启动时还会自动执行一次保守的加密 bootstrap 检查。
该过程会优先尝试复用当前的 secret storage 和 cross-signing 身份，并避免重置 cross-signing，除非你运行显式的 bootstrap 修复流程。

如果启动时发现 bootstrap 状态损坏，且已配置 `channels.matrix.password`，OpenClaw 可以尝试更严格的修复路径。
如果当前设备已经由 owner 签名，OpenClaw 会保留该身份，而不会自动重置它。

从之前的公开 Matrix 插件升级时：

- OpenClaw 会在可能时自动复用相同的 Matrix 账户、access token 和设备身份。
- 在运行任何可执行的 Matrix 迁移变更之前，OpenClaw 会在 `~/Backups/openclaw-migrations/` 下创建或复用一个恢复快照。
- 如果你使用多个 Matrix 账户，请在从旧的平面存储布局升级前设置 `channels.matrix.defaultAccount`，以便 OpenClaw 知道应将共享的旧状态分配给哪个账户。
- 如果之前的插件在本地存储了 Matrix 房间密钥备份解密密钥，启动过程或 `openclaw doctor --fix` 会自动将其导入新的恢复密钥流程。
- 如果在准备迁移后 Matrix access token 发生变化，启动时现在会扫描同级 token-hash 存储根目录中的待恢复旧状态，然后才会放弃自动备份恢复。
- 如果同一账户、homeserver 和用户的 Matrix access token 之后再次发生变化，OpenClaw 现在会优先复用最完整的现有 token-hash 存储根，而不是从空的 Matrix 状态目录开始。
- 在下一次 Gateway 网关启动时，已备份的房间密钥会自动恢复到新的加密存储中。
- 如果旧插件存在从未备份过的仅本地房间密钥，OpenClaw 会清楚发出警告。这些密钥无法从之前的 rust crypto store 中自动导出，因此某些旧的加密历史可能仍需手动恢复后才能使用。
- 完整升级流程、限制、恢复命令和常见迁移消息，请参阅 [Matrix 迁移](/install/migrating-matrix)。

加密运行时状态按账户、按用户、按 token-hash 组织，存储在
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 中。
该目录在相关功能启用时包含同步存储（`bot-storage.json`）、加密存储（`crypto/`）、
恢复密钥文件（`recovery-key.json`）、IndexedDB 快照（`crypto-idb-snapshot.json`）、
线程绑定（`thread-bindings.json`）以及启动验证状态（`startup-verification.json`）。
当 token 变化但账户身份保持不变时，OpenClaw 会为该 account/homeserver/user 元组复用最佳现有根目录，以便此前的同步状态、加密状态、线程绑定和启动验证状态仍然可见。

### Node 加密存储模型

此插件中的 Matrix E2EE 在 Node 中使用官方 `matrix-js-sdk` Rust crypto 路径。
当你希望加密状态在重启后保留时，该路径需要基于 IndexedDB 的持久化。

OpenClaw 目前在 Node 中通过以下方式提供支持：

- 使用 `fake-indexeddb` 作为 SDK 所期望的 IndexedDB API shim
- 在 `initRustCrypto` 之前，从 `crypto-idb-snapshot.json` 恢复 Rust crypto IndexedDB 内容
- 在初始化后和运行期间，将更新后的 IndexedDB 内容持久化回 `crypto-idb-snapshot.json`
- 通过建议性文件锁，对 `crypto-idb-snapshot.json` 的快照恢复和持久化进行串行化，以避免 Gateway 网关运行时持久化和 CLI 维护在同一快照文件上竞争

这是兼容性 / 存储层工作，不是自定义加密实现。
该快照文件属于敏感运行时状态，并使用严格的文件权限存储。
按照 OpenClaw 的安全模型，Gateway 网关主机和本地 OpenClaw 状态目录本就处于受信任的操作员边界内，因此这主要是一个操作持久性问题，而不是单独的远程信任边界。

计划中的改进：

- 为持久化 Matrix 密钥材料增加 SecretRef 支持，以便恢复密钥和相关存储加密 secret 可以来自 OpenClaw secrets provider，而不仅限于本地文件

## 资料管理

使用以下命令更新所选账户的 Matrix 自身资料：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

如果你希望显式指定某个具名 Matrix 账户，请添加 `--account <id>`。

Matrix 可直接接受 `mxc://` 头像 URL。当你传入 `http://` 或 `https://` 头像 URL 时，OpenClaw 会先将其上传到 Matrix，然后把解析后的 `mxc://` URL 回写到 `channels.matrix.avatarUrl`（或所选账户的覆盖项）中。

## 自动验证通知

Matrix 现在会将验证生命周期通知直接作为 `m.notice` 消息发布到严格私信验证房间中。
其中包括：

- 验证请求通知
- 验证就绪通知（包含明确的“通过 emoji 验证”指引）
- 验证开始和完成通知
- SAS 详情（如果可用，包括 emoji 和十进制数字）

来自另一个 Matrix 客户端的入站验证请求会被 OpenClaw 跟踪并自动接受。
对于自我验证流程，当 emoji 验证可用时，OpenClaw 也会自动启动 SAS 流程并确认自己这一侧。
对于来自其他 Matrix 用户 / 设备的验证请求，OpenClaw 会自动接受该请求，然后等待 SAS 流程正常继续。
你仍然需要在你的 Matrix 客户端中比对 emoji 或十进制 SAS，并在那里确认“它们匹配”，才能完成验证。

OpenClaw 不会盲目自动接受由自己发起的重复流程。若已有自我验证请求待处理，启动时会跳过创建新的请求。

验证协议 / 系统通知不会被转发到智能体聊天管线，因此不会产生 `NO_REPLY`。

### 设备清理

旧的由 OpenClaw 管理的 Matrix 设备可能会在账户中累积，使加密房间的信任关系更难理解。
可使用以下命令列出它们：

```bash
openclaw matrix devices list
```

使用以下命令删除过期的由 OpenClaw 管理的设备：

```bash
openclaw matrix devices prune-stale
```

### 直连房间修复

如果私信状态不同步，OpenClaw 可能会出现过期的 `m.direct` 映射，指向旧的一对一房间，而不是当前有效的私信。可使用以下命令检查某个对端的当前映射：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

使用以下命令进行修复：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修复会将 Matrix 特定逻辑保留在插件内部：

- 它会优先选择已经映射在 `m.direct` 中的严格一对一私信
- 否则会回退到与该用户当前已加入的任意严格一对一私信
- 如果不存在健康的私信，则会创建一个新的直连房间，并重写 `m.direct` 指向它

修复流程不会自动删除旧房间。它只会选择健康的私信并更新映射，以便新的 Matrix 发送、验证通知和其他私信流程再次指向正确房间。

## 线程

Matrix 同时支持自动回复和 message-tool 发送中的原生 Matrix 线程。

- `threadReplies: "off"` 会让回复保持在顶层，并将入站线程消息保留在父会话中。
- `threadReplies: "inbound"` 仅当入站消息本身已经位于某个线程中时，才在线程内回复。
- `threadReplies: "always"` 会让房间回复保持在以触发消息为根的线程中，并从第一条触发消息开始，通过匹配的线程作用域会话路由该对话。
- `dm.threadReplies` 仅覆盖私信的顶层设置。例如，你可以让房间线程彼此隔离，同时保持私信为扁平结构。
- 入站线程消息会将线程根消息作为额外的智能体上下文。
- 现在，message-tool 发送在目标为同一房间或同一私信用户目标时，会自动继承当前 Matrix 线程，除非显式提供了 `threadId`。
- Matrix 支持运行时线程绑定。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 和线程绑定的 `/acp spawn` 现在都可在 Matrix 房间和私信中工作。
- 当 `threadBindings.spawnSubagentSessions=true` 时，顶层 Matrix 房间 / 私信中的 `/focus` 会创建一个新的 Matrix 线程，并将其绑定到目标会话。
- 在现有 Matrix 线程中运行 `/focus` 或 `/acp spawn --thread here` 时，则会绑定当前线程本身。

## ACP 会话绑定

Matrix 房间、私信和现有 Matrix 线程都可以在不改变聊天界面的情况下转变为持久化 ACP 工作区。

快速操作流程：

- 在你想继续使用的 Matrix 私信、房间或现有线程中运行 `/acp spawn codex --bind here`。
- 在顶层 Matrix 私信或房间中，当前私信 / 房间会继续作为聊天界面，后续消息将路由到新启动的 ACP 会话。
- 在现有 Matrix 线程中，`--bind here` 会原地绑定当前线程。
- `/new` 和 `/reset` 会原地重置同一个已绑定 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

说明：

- `--bind here` 不会创建子 Matrix 线程。
- 仅当 OpenClaw 需要创建或绑定子 Matrix 线程时，`threadBindings.spawnAcpSessions` 才是 `/acp spawn --thread auto|here` 所必需的。

### 线程绑定配置

Matrix 会继承来自 `session.threadBindings` 的全局默认值，同时也支持按渠道覆盖：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix 线程绑定的启动标志需要显式启用：

- 设置 `threadBindings.spawnSubagentSessions: true` 以允许顶层 `/focus` 创建并绑定新的 Matrix 线程。
- 设置 `threadBindings.spawnAcpSessions: true` 以允许 `/acp spawn --thread auto|here` 将 ACP 会话绑定到 Matrix 线程。

## Reactions

Matrix 支持出站 reaction 操作、入站 reaction 通知以及入站 ack reaction。

- 出站 reaction 工具受 `channels["matrix"].actions.reactions` 控制。
- `react` 会向指定 Matrix 事件添加一个 reaction。
- `reactions` 会列出指定 Matrix 事件当前的 reaction 汇总。
- `emoji=""` 会移除机器人账户在该事件上的所有自身 reactions。
- `remove: true` 仅移除机器人账户的指定 emoji reaction。

Ack reaction 的解析顺序遵循标准 OpenClaw 顺序：

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- 智能体 identity emoji 回退

Ack reaction 作用域按以下顺序解析：

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Reaction 通知模式按以下顺序解析：

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- 默认值：`own`

当前行为：

- `reactionNotifications: "own"` 会在 `m.reaction` 事件指向由机器人撰写的 Matrix 消息时转发新增事件。
- `reactionNotifications: "off"` 会禁用 reaction 系统事件。
- 由于 Matrix 将 reaction 移除表现为 redaction，而非独立的 `m.reaction` 删除事件，因此 reaction 移除仍不会被合成为系统事件。

## 历史上下文

- `channels.matrix.historyLimit` 控制当 Matrix 房间消息触发智能体时，作为 `InboundHistory` 包含多少条最近房间消息。
- 它会回退到 `messages.groupChat.historyLimit`。设为 `0` 可禁用。
- Matrix 房间历史仅限房间本身。私信仍使用普通会话历史。
- Matrix 房间历史是 pending-only：OpenClaw 会缓冲那些尚未触发回复的房间消息，然后在提及或其他触发到来时，对这段窗口进行快照。
- 当前触发消息不会包含在 `InboundHistory` 中；它会保留在该回合的主入站正文里。
- 同一个 Matrix 事件的重试会复用原始历史快照，而不会漂移到更新的房间消息。

## 上下文可见性

Matrix 支持共享的 `contextVisibility` 控制，用于补充房间上下文，例如抓取到的回复文本、线程根消息和待处理历史。

- `contextVisibility: "all"` 是默认值。补充上下文会按接收内容保留。
- `contextVisibility: "allowlist"` 会将补充上下文过滤为通过当前房间 / 用户 allowlist 检查的发送者。
- `contextVisibility: "allowlist_quote"` 的行为与 `allowlist` 相同，但仍会保留一条显式引用回复。

此设置影响的是补充上下文的可见性，而不是入站消息本身是否可以触发回复。
触发授权仍由 `groupPolicy`、`groups`、`groupAllowFrom` 和私信策略设置决定。

## 私信与房间策略示例

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

关于提及门控和 allowlist 行为，请参阅 [群组](/channels/groups)。

Matrix 私信的配对示例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果未获批准的 Matrix 用户在批准前持续向你发送消息，OpenClaw 会复用同一个待处理配对码，并可能在短暂冷却后再次发送提醒回复，而不是生成新的配对码。

有关共享的私信配对流程和存储布局，请参阅 [配对](/channels/pairing)。

## Exec 审批

Matrix 可以作为某个 Matrix 账户的 exec 审批客户端。

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（可选；会回退到 `channels.matrix.dm.allowFrom`）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

审批人必须是 Matrix 用户 ID，例如 `@owner:example.org`。当 `enabled` 未设置或设为 `"auto"`，并且至少可以从 `execApprovals.approvers` 或 `channels.matrix.dm.allowFrom` 中解析出一个审批人时，Matrix 会自动启用原生 exec 审批。若要显式禁用 Matrix 作为原生审批客户端，请设置 `enabled: false`。否则，审批请求会回退到其他已配置审批路径，或 exec 审批回退策略。

当前 Matrix 原生路由仅支持 exec：

- `channels.matrix.execApprovals.*` 仅控制 exec 审批的原生私信 / 渠道路由。
- 插件审批仍使用共享的同聊天 `/approve` 以及任何已配置的 `approvals.plugin` 转发。
- 当 Matrix 可以安全推断审批人时，它仍可复用 `channels.matrix.dm.allowFrom` 用于插件审批授权，但不会暴露单独的原生插件审批私信 / 渠道扇出路径。

投递规则：

- `target: "dm"` 会将审批提示发送到审批人的私信
- `target: "channel"` 会将提示发送回原始 Matrix 房间或私信
- `target: "both"` 会同时发送到审批人的私信以及原始 Matrix 房间或私信

目前 Matrix 使用文本审批提示。审批人可通过 `/approve <id> allow-once`、`/approve <id> allow-always` 或 `/approve <id> deny` 进行处理。

只有已解析的审批人才能批准或拒绝。渠道投递会包含命令文本，因此仅应在受信任房间中启用 `channel` 或 `both`。

Matrix 审批提示复用共享核心审批规划器。Matrix 特定的原生界面目前仅作为 exec 审批的传输层：房间 / 私信路由，以及消息发送 / 更新 / 删除行为。

按账户覆盖：

- `channels.matrix.accounts.<account>.execApprovals`

相关文档：[Exec 审批](/tools/exec-approvals)

## 多账户示例

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

顶层 `channels.matrix` 值会作为具名账户的默认值，除非某个账户显式覆盖。
你可以在多账户设置中使用 `groups.<room>.account`（或旧版 `rooms.<room>.account`）将继承的房间条目限定到某个 Matrix 账户。
未设置 `account` 的条目会在所有 Matrix 账户之间共享，而带有 `account: "default"` 的条目在默认账户直接配置于顶层 `channels.matrix.*` 时仍然有效。
部分共享认证默认值本身不会创建单独的隐式默认账户。只有当顶层默认账户具备新的认证信息（`homeserver` + `accessToken`，或 `homeserver` + `userId` 和 `password`）时，OpenClaw 才会合成顶层 `default` 账户；具名账户仍然可以仅凭 `homeserver` + `userId` 保持可发现，并在稍后由缓存凭证满足认证。
如果 Matrix 已经恰好有一个具名账户，或者 `defaultAccount` 指向某个现有具名账户键，那么单账户到多账户的修复 / 设置提升会保留该账户，而不是创建新的 `accounts.default` 条目。只有 Matrix 认证 / bootstrap 键会移动到该提升后的账户；共享投递策略键会保留在顶层。
当你希望 OpenClaw 在隐式路由、探测和 CLI 操作中优先使用某个具名 Matrix 账户时，请设置 `defaultAccount`。
如果你配置了多个具名账户，请设置 `defaultAccount`，或在依赖隐式账户选择的 CLI 命令中传入 `--account <id>`。
当你希望针对某个命令覆盖该隐式选择时，请将 `--account <id>` 传给 `openclaw matrix verify ...` 和 `openclaw matrix devices ...`。

## 私有 / 局域网 homeserver

出于 SSRF 防护考虑，除非你为每个账户显式选择加入，否则 OpenClaw 默认会阻止连接私有 / 内部 Matrix homeserver。

如果你的 homeserver 运行在 localhost、局域网 / Tailscale IP，或内部主机名上，请为该 Matrix 账户启用 `allowPrivateNetwork`：

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      allowPrivateNetwork: true,
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

此选择加入仅允许受信任的私有 / 内部目标。公共明文 homeserver，例如
`http://matrix.example.org:8008`，仍会被阻止。请尽可能优先使用 `https://`。

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

具名账户可通过 `channels.matrix.accounts.<id>.proxy` 覆盖顶层默认值。
OpenClaw 对运行时 Matrix 流量和账户状态探测使用同一个代理设置。

## 目标解析

无论 OpenClaw 在哪里要求你提供房间或用户目标，Matrix 都接受以下目标形式：

- 用户：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房间：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 别名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

实时目录查找使用已登录的 Matrix 账户：

- 用户查找会查询该 homeserver 上的 Matrix 用户目录。
- 房间查找会直接接受显式房间 ID 和别名，然后回退到搜索该账户已加入房间的名称。
- 已加入房间名称查找是尽力而为的。如果房间名无法解析为 ID 或别名，它会在运行时 allowlist 解析中被忽略。

## 配置参考

- `enabled`：启用或禁用该渠道。
- `name`：账户的可选标签。
- `defaultAccount`：配置了多个 Matrix 账户时的首选账户 ID。
- `homeserver`：homeserver URL，例如 `https://matrix.example.org`。
- `allowPrivateNetwork`：允许此 Matrix 账户连接私有 / 内部 homeserver。当 homeserver 解析到 `localhost`、局域网 / Tailscale IP 或内部主机（如 `matrix-synapse`）时启用它。
- `proxy`：用于 Matrix 流量的可选 HTTP(S) 代理 URL。具名账户可以用自己的 `proxy` 覆盖顶层默认值。
- `userId`：完整 Matrix 用户 ID，例如 `@bot:example.org`。
- `accessToken`：基于 token 的认证 access token。`channels.matrix.accessToken` 和 `channels.matrix.accounts.<id>.accessToken` 支持明文值和 SecretRef 值，适用于 env/file/exec provider。参见 [Secrets Management](/gateway/secrets)。
- `password`：基于 password 的登录密码。支持明文值和 SecretRef 值。
- `deviceId`：显式 Matrix 设备 ID。
- `deviceName`：password 登录时的设备显示名称。
- `avatarUrl`：用于资料同步和 `set-profile` 更新的已存储自身头像 URL。
- `initialSyncLimit`：启动同步事件限制。
- `encryption`：启用 E2EE。
- `allowlistOnly`：强制对私信和房间使用仅 allowlist 行为。
- `allowBots`：允许来自其他已配置 OpenClaw Matrix 账户的消息（`true` 或 `"mentions"`）。
- `groupPolicy`：`open`、`allowlist` 或 `disabled`。
- `contextVisibility`：补充房间上下文的可见性模式（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`：房间流量的用户 ID allowlist。
- `groupAllowFrom` 条目应为完整 Matrix 用户 ID。未解析的名称会在运行时被忽略。
- `historyLimit`：作为群组历史上下文包含的最大房间消息数。会回退到 `messages.groupChat.historyLimit`。设为 `0` 可禁用。
- `replyToMode`：`off`、`first` 或 `all`。
- `markdown`：出站 Matrix 文本的可选 Markdown 渲染配置。
- `streaming`：`off`（默认）、`partial`、`true` 或 `false`。`partial` 和 `true` 会启用单消息草稿预览和原地编辑更新。
- `blockStreaming`：`true` 会在草稿预览流式传输启用时，为已完成的 assistant 块启用单独的进度消息。
- `threadReplies`：`off`、`inbound` 或 `always`。
- `threadBindings`：按渠道覆盖线程绑定的会话路由和生命周期。
- `startupVerification`：启动时自动自我验证请求模式（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`：重试自动启动验证请求前的冷却时间。
- `textChunkLimit`：出站消息分块大小。
- `chunkMode`：`length` 或 `newline`。
- `responsePrefix`：出站回复的可选消息前缀。
- `ackReaction`：该渠道 / 账户的可选 ack reaction 覆盖。
- `ackReactionScope`：可选 ack reaction 作用域覆盖（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`：入站 reaction 通知模式（`own`、`off`）。
- `mediaMaxMb`：Matrix 媒体处理的媒体大小上限（MB）。适用于出站发送和入站媒体处理。
- `autoJoin`：邀请自动加入策略（`always`、`allowlist`、`off`）。默认值：`off`。
- `autoJoinAllowlist`：当 `autoJoin` 为 `allowlist` 时允许的房间 / 别名。别名条目会在处理邀请时解析为房间 ID；OpenClaw 不信任被邀请房间自行声明的别名状态。
- `dm`：私信策略块（`enabled`、`policy`、`allowFrom`、`threadReplies`）。
- `dm.allowFrom` 条目应为完整 Matrix 用户 ID，除非你已经通过实时目录查找解析了它们。
- `dm.threadReplies`：仅私信的线程策略覆盖（`off`、`inbound`、`always`）。它会覆盖顶层 `threadReplies` 设置，同时影响私信中的回复位置和会话隔离。
- `execApprovals`：Matrix 原生 exec 审批投递（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`：允许批准 exec 请求的 Matrix 用户 ID。当 `dm.allowFrom` 已可识别审批人时可省略。
- `execApprovals.target`：`dm | channel | both`（默认：`dm`）。
- `accounts`：具名按账户覆盖。顶层 `channels.matrix` 值会作为这些条目的默认值。
- `groups`：按房间策略映射。优先使用房间 ID 或别名；未解析的房间名会在运行时被忽略。解析后，会话 / 群组身份使用稳定房间 ID，而便于阅读的标签仍来自房间名称。
- `groups.<room>.account`：在多账户设置中，将某个继承房间条目限制到特定 Matrix 账户。
- `groups.<room>.allowBots`：为已配置机器人发送者设置房间级覆盖（`true` 或 `"mentions"`）。
- `groups.<room>.users`：按房间的发送者 allowlist。
- `groups.<room>.tools`：按房间的工具 allow/deny 覆盖。
- `groups.<room>.autoReply`：房间级提及门控覆盖。`true` 会禁用该房间的提及要求；`false` 会强制重新启用。
- `groups.<room>.skills`：可选的房间级 skill 过滤器。
- `groups.<room>.systemPrompt`：可选的房间级 system prompt 片段。
- `rooms`：`groups` 的旧版别名。
- `actions`：按操作的工具门控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 相关内容

- [渠道概览](/channels) —— 所有支持的渠道
- [配对](/channels/pairing) —— 私信认证与配对流程
- [群组](/channels/groups) —— 群聊行为与提及门控
- [渠道路由](/channels/channel-routing) —— 消息的会话路由
- [安全](/gateway/security) —— 访问模型与加固
