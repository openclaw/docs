---
read_when:
    - 在 OpenClaw 中设置 Matrix
    - 配置 Matrix E2EE 和验证
summary: Matrix 支持状态、设置和配置示例
title: Matrix
x-i18n:
    generated_at: "2026-04-05T19:18:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a1413c8c6fb6991a6bbb54ef7893ce01350ccf9d18405127981ac7369c52ab5
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix 是 OpenClaw 的 Matrix 内置渠道插件。
它使用官方 `matrix-js-sdk`，并支持私信、房间、线程、媒体、回应、投票、位置和 E2EE。

## 内置插件

Matrix 作为内置插件随当前的 OpenClaw 版本一起发布，因此常规打包构建不需要单独安装。

如果你使用的是较旧版本，或是不包含 Matrix 的自定义安装，请手动安装：

从 npm 安装：

```bash
openclaw plugins install @openclaw/matrix
```

从本地检出安装：

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

有关插件行为和安装规则，请参阅 [插件](/zh-CN/tools/plugin)。

## 设置

1. 确保 Matrix 插件可用。
   - 当前打包的 OpenClaw 版本已内置该插件。
   - 较旧版本/自定义安装可使用上述命令手动添加。
2. 在你的 homeserver 上创建一个 Matrix 账号。
3. 使用以下任一方式配置 `channels.matrix`：
   - `homeserver` + `accessToken`，或
   - `homeserver` + `userId` + `password`。
4. 重启 Gateway 网关。
5. 与机器人发起私信，或将它邀请到房间中。

交互式设置路径：

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix 向导实际会询问的内容：

- homeserver URL
- 认证方式：access token 或 password
- 仅当你选择密码认证时才需要用户 ID
- 可选的设备名称
- 是否启用 E2EE
- 是否现在配置 Matrix 房间访问

需要注意的向导行为：

- 如果所选账号已经存在 Matrix 认证环境变量，且该账号的认证信息尚未保存在配置中，向导会提供环境变量快捷方式，并且只会为该账号写入 `enabled: true`。
- 当你以交互方式添加另一个 Matrix 账号时，输入的账号名称会被规范化为配置和环境变量中使用的账号 ID。例如，`Ops Bot` 会变成 `ops-bot`。
- 私信 allowlist 提示可立即接受完整的 `@user:server` 值。仅当实时目录查找恰好找到一个精确匹配时，显示名称才可用；否则向导会要求你使用完整的 Matrix ID 重试。
- 房间 allowlist 提示可直接接受房间 ID 和别名。它们也可以实时解析已加入的房间名称，但无法解析的名称只会在设置期间按原样保留，稍后运行时 allowlist 解析会忽略它们。建议优先使用 `!room:server` 或 `#alias:server`。
- 运行时房间/会话身份使用稳定的 Matrix 房间 ID。房间声明的别名仅作为查找输入使用，不会作为长期会话键或稳定群组身份。
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

Matrix 会将缓存的凭证存储在 `~/.openclaw/credentials/matrix/` 中。
默认账号使用 `credentials.json`；命名账号使用 `credentials-<account>.json`。

等效的环境变量（当未设置对应配置键时使用）：

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

对于非默认账号，请使用带账号作用域的环境变量：

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

以账号 `ops` 为例：

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

对于规范化后的账号 ID `ops-bot`，请使用：

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix 会对账号 ID 中的标点符号进行转义，以避免带作用域的环境变量发生冲突。
例如，`-` 会变成 `_X2D_`，因此 `ops-prod` 会映射为 `MATRIX_OPS_X2D_PROD_*`。

只有当这些认证环境变量已存在，且所选账号尚未在配置中保存 Matrix 认证信息时，交互式向导才会提供环境变量快捷方式。

## 配置示例

这是一个实用的基础配置，启用了私信配对、房间 allowlist 和 E2EE：

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

## 流式预览

Matrix 回复流式传输为可选启用。

当你希望 OpenClaw 发送一条草稿回复、在模型生成文本时原地编辑这条草稿，并在回复完成后最终定稿时，请将 `channels.matrix.streaming` 设置为 `"partial"`：

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
- `streaming: "partial"` 会为当前 assistant 块创建一条可编辑的预览消息，而不是发送多条部分消息。
- `blockStreaming: true` 会启用单独的 Matrix 进度消息。与 `streaming: "partial"` 一起使用时，Matrix 会保留当前块的实时草稿，并将已完成的块保留为单独消息。
- 当 `streaming: "partial"` 且 `blockStreaming` 关闭时，Matrix 只会编辑实时草稿，并在该块或该轮完成后发送完整回复。
- 如果预览已无法容纳在单个 Matrix 事件中，OpenClaw 会停止预览流式传输并回退为正常的最终发送。
- 媒体回复仍会正常发送附件。如果过期预览无法再被安全复用，OpenClaw 会在发送最终媒体回复前将其 redact。
- 预览编辑会产生额外的 Matrix API 调用。如果你希望采用最保守的速率限制行为，请关闭流式传输。

`blockStreaming` 本身不会启用草稿预览。
如需预览编辑，请使用 `streaming: "partial"`；如果你还希望已完成的 assistant 块以单独进度消息保留可见，再添加 `blockStreaming: true`。

## 加密和验证

在加密（E2EE）房间中，出站图片事件使用 `thumbnail_file`，因此图片预览会与完整附件一起被加密。未加密房间仍使用普通的 `thumbnail_url`。无需任何配置——插件会自动检测 E2EE 状态。

### Bot 对 bot 房间

默认情况下，来自其他已配置 OpenClaw Matrix 账号的 Matrix 消息会被忽略。

当你有意启用智能体之间的 Matrix 流量时，请使用 `allowBots`：

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

- `allowBots: true` 会接受来自其他已配置 Matrix bot 账号、且位于允许房间和私信中的消息。
- `allowBots: "mentions"` 仅当这些消息在房间中显式提及此 bot 时才接受。私信仍然允许。
- `groups.<room>.allowBots` 会覆盖该房间的账号级设置。
- OpenClaw 仍会忽略来自同一 Matrix 用户 ID 的消息，以避免自回复循环。
- Matrix 在这里不提供原生 bot 标记；OpenClaw 将“由 bot 撰写”视为“由此 OpenClaw Gateway 网关上另一个已配置的 Matrix 账号发送”。

在共享房间中启用 bot 对 bot 流量时，请使用严格的房间 allowlist 和提及要求。

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

引导 cross-signing 和验证状态：

```bash
openclaw matrix verify bootstrap
```

多账号支持：使用 `channels.matrix.accounts` 配置每个账号的凭证和可选的 `name`。共享模式请参阅 [配置参考](/zh-CN/gateway/configuration-reference#multi-account-all-channels)。

详细引导诊断：

```bash
openclaw matrix verify bootstrap --verbose
```

在引导前强制重置一个全新的 cross-signing 身份：

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

使用恢复密钥验证此设备：

```bash
openclaw matrix verify device "<your-recovery-key>"
```

详细设备验证信息：

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

检查房间密钥备份健康状态：

```bash
openclaw matrix verify backup status
```

详细备份健康诊断：

```bash
openclaw matrix verify backup status --verbose
```

从服务器备份恢复房间密钥：

```bash
openclaw matrix verify backup restore
```

详细恢复诊断：

```bash
openclaw matrix verify backup restore --verbose
```

删除当前服务器备份并创建全新的备份基线。如果无法干净地加载已存储的备份密钥，此重置还可以重新创建 secret storage，以便未来冷启动时能够加载新的备份密钥：

```bash
openclaw matrix verify backup reset --yes
```

所有 `verify` 命令默认都很简洁（包括安静的内部 SDK 日志），只有在使用 `--verbose` 时才显示详细诊断。
编写脚本时，请使用 `--json` 获取完整的机器可读输出。

在多账号设置中，Matrix CLI 命令会使用隐式的 Matrix 默认账号，除非你传入 `--account <id>`。
如果你配置了多个命名账号，请先设置 `channels.matrix.defaultAccount`，否则这些隐式 CLI 操作会停止并要求你显式选择一个账号。
当你希望验证或设备操作显式针对某个命名账号时，请使用 `--account`：

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

当命名账号禁用了加密，或该账号不可用时，Matrix 警告和验证错误会指向该账号的配置键，例如 `channels.matrix.accounts.assistant.encryption`。

### “已验证” 的含义

只有当这个 Matrix 设备由你自己的 cross-signing 身份验证后，OpenClaw 才会将其视为已验证。
实际上，`openclaw matrix verify status --verbose` 会暴露三个信任信号：

- `Locally trusted`：此设备仅被当前客户端信任
- `Cross-signing verified`：SDK 报告该设备已通过 cross-signing 验证
- `Signed by owner`：该设备由你自己的 self-signing 密钥签名

只有当存在 cross-signing 验证或所有者签名时，`Verified by owner` 才会变为 `yes`。
仅有本地信任，不足以让 OpenClaw 将该设备视为完全已验证。

### bootstrap 的作用

`openclaw matrix verify bootstrap` 是用于加密 Matrix 账号的修复和设置命令。
它会按顺序完成以下所有操作：

- 引导 secret storage，并在可能时复用现有恢复密钥
- 引导 cross-signing 并上传缺失的公开 cross-signing 密钥
- 尝试标记并 cross-sign 当前设备
- 如果服务器端尚不存在房间密钥备份，则创建新的服务器端房间密钥备份

如果 homeserver 要求交互式认证才能上传 cross-signing 密钥，OpenClaw 会先尝试无认证上传，然后尝试 `m.login.dummy`，当已配置 `channels.matrix.password` 时再尝试 `m.login.password`。

只有在你明确想要丢弃当前 cross-signing 身份并创建新身份时，才使用 `--force-reset-cross-signing`。

如果你明确想要丢弃当前房间密钥备份，并为未来消息建立新的备份基线，请使用 `openclaw matrix verify backup reset --yes`。
只有在你可以接受无法恢复的旧加密历史仍然不可用，并且 OpenClaw 可能会在当前备份 secret 无法安全加载时重新创建 secret storage 的情况下，才这样做。

### 全新备份基线

如果你想保持未来的加密消息继续正常工作，并接受丢失无法恢复的旧历史，请按顺序运行以下命令：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

当你想显式针对某个命名 Matrix 账号时，请为每条命令添加 `--account <id>`。

### 启动行为

当 `encryption: true` 时，Matrix 默认会将 `startupVerification` 设为 `"if-unverified"`。
在启动时，如果此设备仍未验证，Matrix 会在另一个 Matrix 客户端中请求自我验证，在已有请求待处理时跳过重复请求，并在重启后重试前应用本地冷却时间。
默认情况下，失败的请求尝试会比成功创建请求后的重试更早再次尝试。
如果你想禁用自动启动请求，请设置 `startupVerification: "off"`；如果你想缩短或延长重试窗口，请调整 `startupVerificationCooldownHours`。

启动时还会自动执行一轮保守的加密 bootstrap。
该过程会优先尝试复用当前的 secret storage 和 cross-signing 身份，除非你运行显式的 bootstrap 修复流程，否则不会重置 cross-signing。

如果启动时发现 bootstrap 状态损坏，且已配置 `channels.matrix.password`，OpenClaw 可以尝试更严格的修复路径。
如果当前设备已经由 owner 签名，OpenClaw 会保留该身份，而不会自动重置。

从上一个公开 Matrix 插件升级时：

- OpenClaw 会在可能时自动复用相同的 Matrix 账号、access token 和设备身份。
- 在运行任何可执行的 Matrix 迁移更改之前，OpenClaw 会在 `~/Backups/openclaw-migrations/` 下创建或复用恢复快照。
- 如果你使用多个 Matrix 账号，请在从旧的平面存储布局升级前设置 `channels.matrix.defaultAccount`，这样 OpenClaw 才知道应将共享的旧状态交给哪个账号。
- 如果之前的插件在本地存储了 Matrix 房间密钥备份解密密钥，启动过程或 `openclaw doctor --fix` 会自动将其导入到新的恢复密钥流程中。
- 如果 Matrix access token 在准备迁移之后发生了变化，启动时现在会扫描同级 token-hash 存储根目录中待恢复的旧状态，而不是立即放弃自动备份恢复。
- 如果同一账号、homeserver 和用户稍后更换了 Matrix access token，OpenClaw 现在会优先复用最完整的现有 token-hash 存储根，而不是从空的 Matrix 状态目录开始。
- 在下一次 Gateway 网关启动时，已备份的房间密钥会自动恢复到新的加密存储中。
- 如果旧插件中存在从未备份的仅本地房间密钥，OpenClaw 会明确发出警告。由于这些密钥无法从之前的 rust crypto store 中自动导出，因此在手动恢复之前，某些旧的加密历史可能仍然不可用。
- 完整升级流程、限制、恢复命令和常见迁移消息请参阅 [Matrix 迁移](/zh-CN/install/migrating-matrix)。

加密运行时状态按每个账号、每个用户的 token-hash 根目录组织，路径位于
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`。
该目录在使用相关功能时包含同步存储（`bot-storage.json`）、加密存储（`crypto/`）、
恢复密钥文件（`recovery-key.json`）、IndexedDB 快照（`crypto-idb-snapshot.json`）、
线程绑定（`thread-bindings.json`）以及启动验证状态（`startup-verification.json`）。
当 token 改变但账号身份保持不变时，OpenClaw 会为该账号/homeserver/用户元组复用最佳现有根目录，以便先前的同步状态、加密状态、线程绑定和启动验证状态保持可见。

### Node 加密存储模型

此插件中的 Matrix E2EE 在 Node 中使用官方 `matrix-js-sdk` Rust 加密路径。
如果你希望加密状态在重启后继续保留，这一路径要求使用基于 IndexedDB 的持久化。

OpenClaw 当前在 Node 中通过以下方式提供支持：

- 使用 `fake-indexeddb` 作为 SDK 所要求的 IndexedDB API shim
- 在 `initRustCrypto` 之前，从 `crypto-idb-snapshot.json` 恢复 Rust 加密 IndexedDB 内容
- 在初始化后和运行期间，将更新后的 IndexedDB 内容持久化回 `crypto-idb-snapshot.json`
- 通过建议性文件锁，对 `crypto-idb-snapshot.json` 的快照恢复和持久化进行串行化，以避免 Gateway 网关运行时持久化与 CLI 维护操作在同一快照文件上发生竞争

这属于兼容性/存储管线，而不是自定义加密实现。
该快照文件属于敏感运行时状态，并以严格的文件权限存储。
按照 OpenClaw 的安全模型，Gateway 网关主机和本地 OpenClaw 状态目录本来就位于受信任的操作员边界之内，因此这主要是一个运行耐久性问题，而不是单独的远程信任边界问题。

计划中的改进：

- 为持久化的 Matrix 密钥材料添加 SecretRef 支持，以便恢复密钥及相关的存储加密 secret 可通过 OpenClaw secrets 提供商提供，而不仅限于本地文件

## 配置文件管理

使用以下命令更新所选账号的 Matrix 自身配置文件：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

当你想显式针对某个命名账号时，请添加 `--account <id>`。

Matrix 可直接接受 `mxc://` 头像 URL。当你传入 `http://` 或 `https://` 头像 URL 时，OpenClaw 会先将其上传到 Matrix，然后将解析后的 `mxc://` URL 回写到 `channels.matrix.avatarUrl`（或所选账号的覆盖项）中。

## 自动验证通知

Matrix 现在会将验证生命周期通知直接作为 `m.notice` 消息发布到严格私信验证房间中。
这包括：

- 验证请求通知
- 验证就绪通知（带有明确的“通过表情符号验证”指引）
- 验证开始和完成通知
- SAS 详情（表情符号和十进制），如果可用

来自另一个 Matrix 客户端的传入验证请求会被 OpenClaw 跟踪并自动接受。
对于自我验证流程，当表情符号验证可用时，OpenClaw 也会自动启动 SAS 流程并确认自己这一侧。
对于来自另一位 Matrix 用户/设备的验证请求，OpenClaw 会自动接受请求，然后等待 SAS 流程正常继续。
你仍然需要在你的 Matrix 客户端中比较表情符号或十进制 SAS，并在其中确认“它们匹配”，才能完成验证。

OpenClaw 不会盲目自动接受由自己发起的重复流程。当自我验证请求已在待处理中时，启动过程会跳过创建新请求。

验证协议/系统通知不会转发到智能体聊天管线，因此不会产生 `NO_REPLY`。

### 设备清理

旧的由 OpenClaw 管理的 Matrix 设备可能会在账号上不断累积，使加密房间中的信任关系更难理解。
使用以下命令列出它们：

```bash
openclaw matrix devices list
```

使用以下命令移除过时的 OpenClaw 管理设备：

```bash
openclaw matrix devices prune-stale
```

### 直接房间修复

如果私信状态不同步，OpenClaw 最终可能会留下过时的 `m.direct` 映射，这些映射指向旧的单人房间，而不是当前的活跃私信。使用以下命令检查某个对等方的当前映射：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

使用以下命令修复：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修复逻辑会将 Matrix 专用逻辑保留在插件内部：

- 优先选择已在 `m.direct` 中映射的严格 1:1 私信
- 否则回退到与该用户当前已加入的任意严格 1:1 私信
- 如果不存在健康的私信，则创建一个新的直连房间，并重写 `m.direct` 使其指向该房间

修复流程不会自动删除旧房间。它只会选择健康的私信并更新映射，以便新的 Matrix 发送、验证通知和其他直连消息流再次正确地指向目标房间。

## 线程

Matrix 同时支持自动回复和 message-tool 发送中的原生 Matrix 线程。

- `dm.sessionScope: "per-user"`（默认）会让 Matrix 私信路由保持按发送者作用域，因此多个私信房间在解析到同一个对等方时可以共享一个会话。
- `dm.sessionScope: "per-room"` 会将每个 Matrix 私信房间隔离到各自的会话键中，同时仍使用正常的私信认证和 allowlist 检查。
- 显式的 Matrix 会话绑定仍然优先于 `dm.sessionScope`，因此已绑定的房间和线程会保持它们选择的目标会话。
- `threadReplies: "off"` 会让回复保持在顶层，并让传入的线程消息进入父会话。
- `threadReplies: "inbound"` 仅当传入消息本来就在某个线程中时，才在线程内回复。
- `threadReplies: "always"` 会让房间回复保持在线程中，并以触发消息为根路由该会话，通过第一次触发消息所匹配的线程作用域会话继续。
- `dm.threadReplies` 仅为私信覆盖顶层设置。例如，你可以让房间线程保持隔离，同时让私信保持平铺。
- 传入的线程消息会将线程根消息作为额外的智能体上下文。
- 现在，当目标为同一房间或同一私信用户目标，且未提供显式 `threadId` 时，message-tool 发送会自动继承当前 Matrix 线程。
- 仅当当前会话元数据能证明是同一 Matrix 账号上的同一私信对等方时，同会话私信用户目标复用才会生效；否则 OpenClaw 会回退到常规的用户作用域路由。
- 当 OpenClaw 发现某个 Matrix 私信房间与同一共享 Matrix 私信会话上的另一个私信房间发生冲突时，如果启用了线程绑定并存在 `dm.sessionScope` 提示，它会在该房间中发布一次性 `m.notice`，并附带 `/focus` 逃生口。
- Matrix 支持运行时线程绑定。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 和线程绑定的 `/acp spawn` 现在都可在 Matrix 房间和私信中使用。
- 当 `threadBindings.spawnSubagentSessions=true` 时，在顶层 Matrix 房间/私信中执行 `/focus` 会创建一个新的 Matrix 线程并将其绑定到目标会话。
- 在现有 Matrix 线程中运行 `/focus` 或 `/acp spawn --thread here` 时，则会改为绑定当前线程。

## ACP 会话绑定

Matrix 房间、私信和现有 Matrix 线程都可以变成持久的 ACP 工作区，而无需改变聊天界面。

快速操作员流程：

- 在你想继续使用的 Matrix 私信、房间或现有线程中运行 `/acp spawn codex --bind here`。
- 在顶层 Matrix 私信或房间中，当前私信/房间会保持为聊天界面，后续消息将路由到新生成的 ACP 会话。
- 在现有 Matrix 线程中，`--bind here` 会将当前线程原地绑定。
- `/new` 和 `/reset` 会原地重置同一个已绑定的 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

说明：

- `--bind here` 不会创建子 Matrix 线程。
- 只有在使用 `/acp spawn --thread auto|here` 且 OpenClaw 需要创建或绑定子 Matrix 线程时，才需要 `threadBindings.spawnAcpSessions`。

### 线程绑定配置

Matrix 会继承 `session.threadBindings` 中的全局默认值，同时也支持按渠道覆盖：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix 线程绑定的生成标志为可选启用：

- 设置 `threadBindings.spawnSubagentSessions: true` 以允许顶层 `/focus` 创建并绑定新的 Matrix 线程。
- 设置 `threadBindings.spawnAcpSessions: true` 以允许 `/acp spawn --thread auto|here` 将 ACP 会话绑定到 Matrix 线程。

## 回应

Matrix 支持出站回应操作、入站回应通知和入站确认回应。

- 出站回应工具受 `channels["matrix"].actions.reactions` 控制。
- `react` 会向特定 Matrix 事件添加一个回应。
- `reactions` 会列出特定 Matrix 事件当前的回应摘要。
- `emoji=""` 会移除 bot 账号自己在该事件上的回应。
- `remove: true` 只会移除 bot 账号上的指定表情回应。

确认回应的解析顺序遵循标准 OpenClaw 解析顺序：

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- 智能体身份 emoji 回退

确认回应作用域按以下顺序解析：

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

回应通知模式按以下顺序解析：

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- 默认值：`own`

当前行为：

- `reactionNotifications: "own"` 会在目标是 bot 撰写的 Matrix 消息时，转发新增的 `m.reaction` 事件。
- `reactionNotifications: "off"` 会禁用回应系统事件。
- 回应移除仍不会被合成为系统事件，因为 Matrix 将它们作为 redact 而不是独立的 `m.reaction` 移除来呈现。

## 历史上下文

- `channels.matrix.historyLimit` 控制当 Matrix 房间消息触发智能体时，作为 `InboundHistory` 包含多少最近房间消息。
- 它会回退到 `messages.groupChat.historyLimit`。设置为 `0` 可禁用。
- Matrix 房间历史仅限房间。私信仍使用常规会话历史。
- Matrix 房间历史仅适用于待处理消息：OpenClaw 会缓冲尚未触发回复的房间消息，然后在提及或其他触发到来时快照该窗口。
- 当前触发消息不会包含在 `InboundHistory` 中；它会保留在该轮的主入站正文中。
- 对同一 Matrix 事件的重试会复用原始历史快照，而不会漂移到更新的房间消息。

## 上下文可见性

Matrix 支持共享的 `contextVisibility` 控制，用于补充房间上下文，例如获取到的回复文本、线程根和待处理历史。

- `contextVisibility: "all"` 是默认值。补充上下文会按接收时原样保留。
- `contextVisibility: "allowlist"` 会将补充上下文过滤为仅保留通过当前房间/用户 allowlist 检查的发送者内容。
- `contextVisibility: "allowlist_quote"` 的行为与 `allowlist` 类似，但仍会保留一条显式引用回复。

此设置影响的是补充上下文的可见性，而不是入站消息本身是否可以触发回复。
触发授权仍来自 `groupPolicy`、`groups`、`groupAllowFrom` 和私信策略设置。

## 私信和房间策略示例

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

有关提及门控和 allowlist 行为，请参阅 [群组](/zh-CN/channels/groups)。

Matrix 私信的配对示例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果某个尚未批准的 Matrix 用户在批准前持续向你发送消息，OpenClaw 会复用同一个待处理的配对码，并且在短暂冷却后可能再次发送提醒回复，而不是生成新的配对码。

有关共享的私信配对流程和存储布局，请参阅 [配对](/zh-CN/channels/pairing)。

## Exec 审批

Matrix 可以作为某个 Matrix 账号的 exec 审批客户端。

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（可选；会回退到 `channels.matrix.dm.allowFrom`）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

审批人必须是 Matrix 用户 ID，例如 `@owner:example.org`。当 `enabled` 未设置或为 `"auto"`，且至少能解析出一位审批人时，Matrix 会自动启用原生 exec 审批；审批人可来自 `execApprovals.approvers` 或 `channels.matrix.dm.allowFrom`。设置 `enabled: false` 可显式禁用 Matrix 作为原生审批客户端。否则，审批请求会回退到其他已配置的审批路由或 exec 审批回退策略。

原生 Matrix 路由目前仅支持 exec：

- `channels.matrix.execApprovals.*` 仅控制 exec 审批的原生私信/渠道路由。
- 插件审批仍使用共享的同聊天 `/approve`，以及任何已配置的 `approvals.plugin` 转发。
- 当 Matrix 能够安全推断审批人时，它仍可复用 `channels.matrix.dm.allowFrom` 进行插件审批授权，但它不会暴露单独的原生插件审批私信/渠道扇出路径。

投递规则：

- `target: "dm"` 会将审批提示发送到审批人私信
- `target: "channel"` 会将提示发回原始 Matrix 房间或私信
- `target: "both"` 会同时发送到审批人私信和原始 Matrix 房间或私信

Matrix 审批提示会在主审批消息上预置回应快捷方式：

- `✅` = 允许一次
- `❌` = 拒绝
- `♾️` = 当该决策受当前 exec 策略允许时，始终允许

审批人可以对该消息添加回应，或使用回退斜杠命令：`/approve <id> allow-once`、`/approve <id> allow-always` 或 `/approve <id> deny`。

只有已解析的审批人可以批准或拒绝。渠道投递会包含命令文本，因此只有在受信任房间中才应启用 `channel` 或 `both`。

Matrix 审批提示复用共享核心审批规划器。Matrix 专用的原生界面仅作为 exec 审批的传输层：房间/私信路由以及消息发送/更新/删除行为。

按账号覆盖：

- `channels.matrix.accounts.<account>.execApprovals`

相关文档：[Exec 审批](/zh-CN/tools/exec-approvals)

## 多账号示例

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

除非账号自行覆盖，否则顶层 `channels.matrix` 值会作为命名账号的默认值。
你可以使用 `groups.<room>.account`（或旧版 `rooms.<room>.account`）将继承的房间条目限定到某一个 Matrix 账号。
不带 `account` 的条目会在所有 Matrix 账号之间共享，而带有 `account: "default"` 的条目在默认账号直接配置在顶层 `channels.matrix.*` 时仍然有效。
部分共享认证默认值本身不会创建单独的隐式默认账号。只有当该默认账号拥有新的认证信息（`homeserver` 加 `accessToken`，或 `homeserver` 加 `userId` 和 `password`）时，OpenClaw 才会合成顶层 `default` 账号；命名账号仍可依靠 `homeserver` 加 `userId` 保持可发现性，只要后续缓存凭证能够满足认证。
如果 Matrix 已经正好有一个命名账号，或 `defaultAccount` 指向现有命名账号键，那么单账号到多账号的修复/设置升级会保留该账号，而不是新建一个 `accounts.default` 条目。只有 Matrix 认证/bootstrap 键会移动到升级后的账号中；共享投递策略键会保留在顶层。
当你希望 OpenClaw 在隐式路由、探测和 CLI 操作中优先使用某个命名 Matrix 账号时，请设置 `defaultAccount`。
如果你配置了多个命名账号，请设置 `defaultAccount`，或在依赖隐式账号选择的 CLI 命令中传入 `--account <id>`。
当你希望为某条命令覆盖该隐式选择时，请将 `--account <id>` 传给 `openclaw matrix verify ...` 和 `openclaw matrix devices ...`。

## 私有/LAN homeserver

默认情况下，出于 SSRF 防护考虑，OpenClaw 会阻止连接私有/内部 Matrix homeserver，除非你为每个账号显式选择加入。

如果你的 homeserver 运行在 localhost、LAN/Tailscale IP 或内部主机名上，请为该 Matrix 账号启用 `allowPrivateNetwork`：

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

此选择加入仅允许受信任的私有/内部目标。公共明文 homeserver，例如
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

命名账号可以使用 `channels.matrix.accounts.<id>.proxy` 覆盖顶层默认值。
OpenClaw 会将同一代理设置用于运行时 Matrix 流量和账号状态探测。

## 目标解析

在 OpenClaw 任何要求你输入房间或用户目标的地方，Matrix 都接受以下目标形式：

- 用户：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房间：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 别名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

实时目录查找使用已登录的 Matrix 账号：

- 用户查找会查询该 homeserver 上的 Matrix 用户目录。
- 房间查找会直接接受显式房间 ID 和别名，然后回退到搜索该账号已加入的房间名称。
- 已加入房间名称查找属于尽力而为。如果房间名称无法解析为 ID 或别名，运行时 allowlist 解析会忽略它。

## 配置参考

- `enabled`：启用或禁用该渠道。
- `name`：账号的可选标签。
- `defaultAccount`：配置多个 Matrix 账号时的首选账号 ID。
- `homeserver`：homeserver URL，例如 `https://matrix.example.org`。
- `allowPrivateNetwork`：允许此 Matrix 账号连接到私有/内部 homeserver。当 homeserver 解析为 `localhost`、LAN/Tailscale IP 或诸如 `matrix-synapse` 之类的内部主机时，请启用此项。
- `proxy`：Matrix 流量的可选 HTTP(S) 代理 URL。命名账号可以用自己的 `proxy` 覆盖顶层默认值。
- `userId`：完整的 Matrix 用户 ID，例如 `@bot:example.org`。
- `accessToken`：基于 token 的认证 access token。`channels.matrix.accessToken` 和 `channels.matrix.accounts.<id>.accessToken` 支持跨 env/file/exec 提供商的明文值和 SecretRef 值。请参阅 [Secrets Management](/zh-CN/gateway/secrets)。
- `password`：基于密码登录的密码。支持明文值和 SecretRef 值。
- `deviceId`：显式 Matrix 设备 ID。
- `deviceName`：用于密码登录的设备显示名称。
- `avatarUrl`：用于配置文件同步和 `set-profile` 更新的已存储自身头像 URL。
- `initialSyncLimit`：启动时同步事件限制。
- `encryption`：启用 E2EE。
- `allowlistOnly`：强制对私信和房间仅使用 allowlist 行为。
- `allowBots`：允许来自其他已配置 OpenClaw Matrix 账号的消息（`true` 或 `"mentions"`）。
- `groupPolicy`：`open`、`allowlist` 或 `disabled`。
- `contextVisibility`：补充房间上下文可见性模式（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`：房间流量的用户 ID allowlist。
- `groupAllowFrom` 条目应为完整的 Matrix 用户 ID。无法解析的名称会在运行时被忽略。
- `historyLimit`：作为群组历史上下文包含的最大房间消息数。会回退到 `messages.groupChat.historyLimit`。设置 `0` 可禁用。
- `replyToMode`：`off`、`first` 或 `all`。
- `markdown`：出站 Matrix 文本的可选 Markdown 渲染配置。
- `streaming`：`off`（默认）、`partial`、`true` 或 `false`。`partial` 和 `true` 会启用带原地编辑更新的单消息草稿预览。
- `blockStreaming`：`true` 会在草稿预览流式传输处于激活状态时，为已完成的 assistant 块启用单独进度消息。
- `threadReplies`：`off`、`inbound` 或 `always`。
- `threadBindings`：线程绑定会话路由和生命周期的按渠道覆盖。
- `startupVerification`：启动时自动自我验证请求模式（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`：自动启动验证请求再次尝试前的冷却时间。
- `textChunkLimit`：出站消息分块大小。
- `chunkMode`：`length` 或 `newline`。
- `responsePrefix`：出站回复的可选消息前缀。
- `ackReaction`：此渠道/账号的可选确认回应覆盖。
- `ackReactionScope`：可选的确认回应作用域覆盖（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`：入站回应通知模式（`own`、`off`）。
- `mediaMaxMb`：Matrix 媒体处理的媒体大小上限（MB）。适用于出站发送和入站媒体处理。
- `autoJoin`：邀请自动加入策略（`always`、`allowlist`、`off`）。默认值：`off`。
- `autoJoinAllowlist`：当 `autoJoin` 为 `allowlist` 时允许的房间/别名。别名条目会在处理邀请时解析为房间 ID；OpenClaw 不信任被邀请房间声称的别名状态。
- `dm`：私信策略块（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.allowFrom` 条目应为完整的 Matrix 用户 ID，除非你已经通过实时目录查找完成了解析。
- `dm.sessionScope`：`per-user`（默认）或 `per-room`。如果你希望每个 Matrix 私信房间即使面对同一对等方也保留独立上下文，请使用 `per-room`。
- `dm.threadReplies`：仅私信的线程策略覆盖（`off`、`inbound`、`always`）。它会覆盖顶层 `threadReplies` 设置，并同时影响私信中的回复位置和会话隔离。
- `execApprovals`：Matrix 原生 exec 审批投递（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`：允许审批 exec 请求的 Matrix 用户 ID。当 `dm.allowFrom` 已经标识审批人时可选。
- `execApprovals.target`：`dm | channel | both`（默认：`dm`）。
- `accounts`：每个账号的命名覆盖项。顶层 `channels.matrix` 值会作为这些条目的默认值。
- `groups`：按房间的策略映射。优先使用房间 ID 或别名；无法解析的房间名称会在运行时被忽略。解析后，会话/群组身份使用稳定的房间 ID，而人类可读标签仍来自房间名称。
- `groups.<room>.account`：在多账号设置中，将一个继承的房间条目限制到特定 Matrix 账号。
- `groups.<room>.allowBots`：已配置 bot 发送者的房间级覆盖（`true` 或 `"mentions"`）。
- `groups.<room>.users`：按房间的发送者 allowlist。
- `groups.<room>.tools`：按房间的工具允许/拒绝覆盖。
- `groups.<room>.autoReply`：房间级提及门控覆盖。`true` 会禁用该房间的提及要求；`false` 会重新强制启用。
- `groups.<room>.skills`：可选的房间级技能过滤器。
- `groups.<room>.systemPrompt`：可选的房间级系统提示片段。
- `rooms`：`groups` 的旧版别名。
- `actions`：按操作的工具门控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 相关

- [渠道概览](/zh-CN/channels) — 所有受支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固
