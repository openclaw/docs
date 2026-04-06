---
read_when:
    - 在 OpenClaw 中设置 Matrix
    - 配置 Matrix E2EE 和验证
summary: Matrix 支持状态、设置和配置示例
title: Matrix
x-i18n:
    generated_at: "2026-04-06T03:58:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06f833bf0ede81bad69f140994c32e8cc5d1635764f95fc5db4fc5dc25f2b85e
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix 是 OpenClaw 的 Matrix 内置渠道插件。
它使用官方 `matrix-js-sdk`，并支持私信、房间、线程、媒体、表情回应、投票、位置和 E2EE。

## 内置插件

Matrix 作为内置插件随当前 OpenClaw 版本一同发布，因此普通的打包构建不需要单独安装。

如果你使用的是较旧的构建版本，或是不包含 Matrix 的自定义安装，请手动安装：

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
   - 当前打包的 OpenClaw 版本已内置它。
   - 较旧的版本或自定义安装可以使用上述命令手动添加它。
2. 在你的 homeserver 上创建一个 Matrix 账号。
3. 使用以下任一方式配置 `channels.matrix`：
   - `homeserver` + `accessToken`，或
   - `homeserver` + `userId` + `password`。
4. 重启 Gateway 网关。
5. 与机器人开始一个私信，或邀请它加入一个房间。

交互式设置路径：

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix 向导实际会询问的内容：

- homeserver URL
- 认证方式：access token 或 password
- 仅当你选择 password 认证时才需要 user ID
- 可选的设备名称
- 是否启用 E2EE
- 是否现在配置 Matrix 房间访问

需要注意的向导行为：

- 如果所选账号已经存在 Matrix 认证环境变量，并且该账号尚未在配置中保存认证信息，向导会提供环境变量快捷方式，并且只为该账号写入 `enabled: true`。
- 当你以交互方式添加另一个 Matrix 账号时，输入的账号名称会被规范化为配置和环境变量中使用的账号 ID。例如，`Ops Bot` 会变成 `ops-bot`。
- 私信 allowlist 提示会立即接受完整的 `@user:server` 值。显示名称仅在实时目录查找找到唯一精确匹配时可用；否则向导会要求你使用完整 Matrix ID 重试。
- 房间 allowlist 提示会直接接受房间 ID 和别名。它们也可以实时解析已加入房间的名称，但无法解析的名称只会在设置期间按原样保留，之后会被运行时 allowlist 解析忽略。优先使用 `!room:server` 或 `#alias:server`。
- 运行时房间/会话身份使用稳定的 Matrix 房间 ID。房间声明的别名仅作为查找输入使用，不会作为长期会话键或稳定群组身份。
- 如需在保存前解析房间名称，请使用 `openclaw channels resolve --channel matrix "Project Room"`。

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

Matrix 会将缓存的凭证存储在 `~/.openclaw/credentials/matrix/` 中。
默认账号使用 `credentials.json`；命名账号使用 `credentials-<account>.json`。
如果该目录中存在缓存凭证，即使当前认证没有直接在配置中设置，OpenClaw 也会在 setup、Doctor 和渠道状态发现中将 Matrix 视为已配置。

对应的环境变量（当未设置配置键时使用）：

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

对于非默认账号，请使用按账号范围划分的环境变量：

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

`ops` 账号示例：

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

对于规范化账号 ID `ops-bot`，请使用：

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix 会转义账号 ID 中的标点符号，以避免带作用域的环境变量发生冲突。
例如，`-` 会变成 `_X2D_`，因此 `ops-prod` 会映射为 `MATRIX_OPS_X2D_PROD_*`。

只有当这些认证环境变量已经存在，且所选账号尚未在配置中保存 Matrix 认证信息时，交互式向导才会提供环境变量快捷方式。

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

`autoJoin` 适用于一般意义上的 Matrix 邀请，而不仅仅是房间/群组邀请。
这包括新的私信式邀请。在邀请时，OpenClaw 无法可靠地知道被邀请的房间最终会被视为私信还是群组，因此所有邀请都会先经过同一个 `autoJoin` 决策。机器人加入后，如果该房间被归类为私信，`dm.policy` 仍然会生效，因此 `autoJoin` 控制加入行为，而 `dm.policy` 控制回复/访问行为。

## 流式预览

Matrix 回复流式传输为选择启用。

当你希望 OpenClaw 发送一条实时预览回复、在模型生成文本时原地编辑该预览，并在回复完成后最终定稿时，请将 `channels.matrix.streaming` 设置为 `"partial"`：

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` 是默认值。OpenClaw 会等待最终回复并发送一次。
- `streaming: "partial"` 会为当前 assistant 块创建一条可编辑的预览消息，使用普通的 Matrix 文本消息。这会保留 Matrix 传统的“先预览后完成”通知行为，因此标准客户端可能会在第一次流式预览文本时通知，而不是在完成的块上通知。
- `streaming: "quiet"` 会为当前 assistant 块创建一条可编辑的静默预览通知。只有在你同时为最终定稿的预览编辑配置接收方推送规则时，才使用此选项。
- `blockStreaming: true` 会启用单独的 Matrix 进度消息。启用预览流式传输后，Matrix 会为当前块保留实时草稿，并将已完成的块保留为单独消息。
- 当启用预览流式传输且 `blockStreaming` 关闭时，Matrix 会原地编辑实时草稿，并在块或轮次结束时完成同一事件。
- 如果预览内容已无法容纳在一个 Matrix 事件中，OpenClaw 会停止预览流式传输并回退到普通最终投递。
- 媒体回复仍会正常发送附件。如果过期的预览已无法安全复用，OpenClaw 会在发送最终媒体回复前将其清除。
- 预览编辑会产生额外的 Matrix API 调用。如果你希望采用最保守的限流行为，请保持关闭流式传输。

`blockStreaming` 本身不会启用草稿预览。
如需预览编辑，请使用 `streaming: "partial"` 或 `streaming: "quiet"`；只有当你还希望已完成的 assistant 块以单独进度消息保留可见时，再添加 `blockStreaming: true`。

如果你需要标准 Matrix 通知而不自定义推送规则，请使用 `streaming: "partial"` 以获得先预览的行为，或保持 `streaming` 关闭以仅在最终完成时投递。对于 `streaming: "off"`：

- `blockStreaming: true` 会将每个完成的块作为普通的可通知 Matrix 消息发送。
- `blockStreaming: false` 只会将最终完成的回复作为普通的可通知 Matrix 消息发送。

### 用于静默最终预览的自托管推送规则

如果你运行自己的 Matrix 基础设施，并希望静默预览仅在块或最终回复完成时通知，请设置 `streaming: "quiet"`，并为最终定稿的预览编辑添加按用户划分的推送规则。

这通常是接收方用户级别的设置，而不是 homeserver 全局配置更改：

开始之前的快速对应关系：

- recipient user = 应该接收通知的人
- bot user = 发送回复的 OpenClaw Matrix 账号
- 对下面的 API 调用使用接收方用户的 access token
- 在推送规则中，将 `sender` 与机器人用户的完整 MXID 匹配

1. 配置 OpenClaw 使用静默预览：

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. 确保接收方账号已经能收到普通的 Matrix 推送通知。静默预览规则只有在该用户已经有正常工作的 pusher/设备时才会生效。

3. 获取接收方用户的 access token。
   - 使用接收用户的 token，而不是机器人的 token。
   - 复用现有客户端会话 token 通常最简单。
   - 如果你需要签发一个新的 token，可以通过标准 Matrix Client-Server API 登录：

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. 验证接收方账号是否已经有 pusher：

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

如果这里没有返回活动中的 pusher/设备，请先修复普通的 Matrix 通知，再添加下面的 OpenClaw 规则。

OpenClaw 会用以下标记标识最终定稿的纯文本预览编辑：

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. 为每个应接收这些通知的接收方账号创建一个 override 推送规则：

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

运行该命令前，请替换以下值：

- `https://matrix.example.org`：你的 homeserver 基础 URL
- `$USER_ACCESS_TOKEN`：接收方用户的 access token
- `openclaw-finalized-preview-botname`：该接收用户针对这个机器人的唯一规则 ID
- `@bot:example.org`：你的 OpenClaw Matrix 机器人 MXID，而不是接收用户的 MXID

多机器人设置的重要说明：

- 推送规则以 `ruleId` 作为键。对同一个规则 ID 重复执行 `PUT` 会更新这一条规则。
- 如果一个接收用户需要为多个 OpenClaw Matrix 机器人账号通知，请为每个机器人创建一条规则，并为每个发送者匹配使用唯一规则 ID。
- 一个简单的模式是 `openclaw-finalized-preview-<botname>`，例如 `openclaw-finalized-preview-ops` 或 `openclaw-finalized-preview-support`。

该规则是针对事件发送者进行评估的：

- 使用接收用户的 token 进行认证
- 将 `sender` 与 OpenClaw 机器人 MXID 匹配

6. 验证规则已存在：

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. 测试一次流式回复。在静默模式下，房间中应显示一个静默草稿预览，并且在块或轮次结束时，最终的原地编辑应触发一次通知。

如果你之后需要移除该规则，请使用接收用户的 token 删除同一个规则 ID：

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

说明：

- 使用接收用户的 access token 创建规则，而不是机器人的。
- 新的用户定义 `override` 规则会插入到默认抑制规则之前，因此不需要额外的排序参数。
- 这只影响 OpenClaw 能够安全原地定稿的纯文本预览编辑。媒体回退和过期预览回退仍然使用普通 Matrix 投递。
- 如果 `GET /_matrix/client/v3/pushers` 显示没有 pusher，说明该用户尚未为此账号/设备配置正常工作的 Matrix 推送投递。

#### Synapse

对于 Synapse，通常只需完成上述设置即可：

- 最终定稿的 OpenClaw 预览通知不需要特殊的 `homeserver.yaml` 更改。
- 如果你的 Synapse 部署已经能发送普通的 Matrix 推送通知，那么用户 token + 上述 `pushrules` 调用就是主要设置步骤。
- 如果你在反向代理或 worker 后运行 Synapse，请确保 `/_matrix/client/.../pushrules/` 能正确到达 Synapse。
- 如果你使用 Synapse workers，请确保 pusher 状态正常。推送投递由主进程或 `synapse.app.pusher` / 已配置的 pusher workers 处理。

#### Tuwunel

对于 Tuwunel，请使用与上方相同的设置流程和 push-rule API 调用：

- 最终预览标记本身不需要任何 Tuwunel 特定配置。
- 如果该用户的普通 Matrix 通知已经正常工作，那么用户 token + 上述 `pushrules` 调用就是主要设置步骤。
- 如果当用户在其他设备上活跃时通知似乎消失了，请检查是否启用了 `suppress_push_when_active`。Tuwunel 在 2025 年 9 月 12 日发布的 Tuwunel 1.4.2 中添加了此选项，它可能会有意抑制向其他设备发送推送。

## 加密和验证

在加密（E2EE）房间中，出站图片事件会使用 `thumbnail_file`，因此图片预览会与完整附件一起加密。未加密房间仍使用普通的 `thumbnail_url`。无需配置——插件会自动检测 E2EE 状态。

### Bot 到 Bot 房间

默认情况下，来自其他已配置 OpenClaw Matrix 账号的 Matrix 消息会被忽略。

当你确实希望启用智能体之间的 Matrix 流量时，请使用 `allowBots`：

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

- `allowBots: true` 接受来自其他已配置 Matrix 机器人账号、且位于允许房间和私信中的消息。
- `allowBots: "mentions"` 仅当这些消息在房间中明确提及此机器人时才接受。私信仍然允许。
- `groups.<room>.allowBots` 会覆盖某个房间的账号级设置。
- OpenClaw 仍会忽略来自同一 Matrix 用户 ID 的消息，以避免自回复循环。
- Matrix 在这里不提供原生 bot 标志；OpenClaw 将“由机器人撰写”视为“由此 OpenClaw Gateway 网关上另一个已配置的 Matrix 账号发送”。

当你在共享房间中启用 bot 到 bot 流量时，请使用严格的房间 allowlist 和提及要求。

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

在机器可读输出中包含存储的恢复密钥：

```bash
openclaw matrix verify status --include-recovery-key --json
```

引导交叉签名和验证状态：

```bash
openclaw matrix verify bootstrap
```

多账号支持：使用 `channels.matrix.accounts` 配置每个账号的凭证和可选 `name`。共享模式请参阅 [配置参考](/zh-CN/gateway/configuration-reference#multi-account-all-channels)。

详细引导诊断：

```bash
openclaw matrix verify bootstrap --verbose
```

在引导前强制重置全新的交叉签名身份：

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

删除当前服务器备份并创建一个全新的备份基线。如果存储的备份密钥无法被干净地加载，此重置也可以重新创建 secret storage，以便未来冷启动时可以加载新的备份密钥：

```bash
openclaw matrix verify backup reset --yes
```

所有 `verify` 命令默认都保持简洁（包括安静的内部 SDK 日志），只有使用 `--verbose` 时才显示详细诊断。
编写脚本时请使用 `--json` 获取完整的机器可读输出。

在多账号设置中，除非你传入 `--account <id>`，否则 Matrix CLI 命令会使用隐式的 Matrix 默认账号。
如果你配置了多个命名账号，请先设置 `channels.matrix.defaultAccount`，否则这些隐式 CLI 操作会停止并要求你显式选择一个账号。
每当你希望验证或设备操作明确针对某个命名账号时，请使用 `--account`：

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

当某个命名账号未启用加密或无法使用加密时，Matrix 警告和验证错误会指向该账号的配置键，例如 `channels.matrix.accounts.assistant.encryption`。

### “已验证” 的含义

只有当这个 Matrix 设备被你自己的交叉签名身份验证时，OpenClaw 才会将其视为已验证。
实际中，`openclaw matrix verify status --verbose` 会显示三个信任信号：

- `Locally trusted`：此设备仅被当前客户端信任
- `Cross-signing verified`：SDK 报告该设备已通过交叉签名验证
- `Signed by owner`：该设备由你自己的 self-signing 密钥签名

只有存在交叉签名验证或 owner-signing 时，`Verified by owner` 才会变为 `yes`。
仅有本地信任并不足以让 OpenClaw 将设备视为完全已验证。

### bootstrap 会做什么

`openclaw matrix verify bootstrap` 是用于修复和设置加密 Matrix 账号的命令。
它会按顺序完成以下所有操作：

- 引导 secret storage，尽可能复用现有恢复密钥
- 引导交叉签名并上传缺失的公开交叉签名密钥
- 尝试标记并交叉签名当前设备
- 如果服务器端房间密钥备份不存在，则创建一个新的备份

如果 homeserver 要求交互式认证才能上传交叉签名密钥，OpenClaw 会先尝试无认证上传，然后尝试使用 `m.login.dummy`，如果配置了 `channels.matrix.password`，则再尝试使用 `m.login.password`。

只有当你明确希望丢弃当前交叉签名身份并创建新身份时，才使用 `--force-reset-cross-signing`。

如果你明确希望丢弃当前房间密钥备份，并为未来消息开始一个新的备份基线，请使用 `openclaw matrix verify backup reset --yes`。
仅当你接受无法恢复的旧加密历史将继续不可用，并且 OpenClaw 在当前备份密钥无法安全加载时可能会重新创建 secret storage 时，才这样做。

### 全新备份基线

如果你希望保持未来加密消息正常工作，并接受失去无法恢复的旧历史，请按顺序运行以下命令：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

当你希望明确针对某个命名 Matrix 账号时，请为每条命令添加 `--account <id>`。

### 启动行为

当 `encryption: true` 时，Matrix 默认将 `startupVerification` 设为 `"if-unverified"`。
启动时，如果该设备仍未验证，Matrix 会在另一个 Matrix 客户端中请求自我验证；如果已有一个请求处于待处理状态，则跳过重复请求；并在重启后重试前应用本地冷却时间。
默认情况下，失败的请求创建尝试会比成功创建请求后的重试更早再次尝试。
如果要禁用自动启动请求，请将 `startupVerification: "off"`；如果你希望重试窗口更短或更长，请调整 `startupVerificationCooldownHours`。

启动时也会自动执行一次保守的加密引导流程。
该流程会优先尝试复用当前的 secret storage 和交叉签名身份，并避免重置交叉签名，除非你运行显式的引导修复流程。

如果启动时发现引导状态损坏，并且已配置 `channels.matrix.password`，OpenClaw 可以尝试更严格的修复路径。
如果当前设备已经由 owner 签名，OpenClaw 会保留该身份，而不是自动重置它。

从上一版公开 Matrix 插件升级时：

- OpenClaw 会在可能的情况下自动复用相同的 Matrix 账号、access token 和设备身份。
- 在运行任何可执行的 Matrix 迁移更改之前，OpenClaw 会在 `~/Backups/openclaw-migrations/` 下创建或复用一个恢复快照。
- 如果你使用多个 Matrix 账号，请在从旧的平面存储布局升级前设置 `channels.matrix.defaultAccount`，这样 OpenClaw 才知道哪个账号应接收该共享旧状态。
- 如果先前的插件在本地存储了 Matrix 房间密钥备份解密密钥，启动或 `openclaw doctor --fix` 现在会自动将其导入新的恢复密钥流程。
- 如果在准备迁移之后 Matrix access token 发生变化，启动现在会在放弃自动备份恢复前扫描同级 token-hash 存储根，以查找待恢复的旧状态。
- 如果之后相同账号、homeserver 和用户的 Matrix access token 再次变化，OpenClaw 现在会优先复用最完整的现有 token-hash 存储根，而不是从空的 Matrix 状态目录开始。
- 在下一次 Gateway 网关启动时，已备份的房间密钥会自动恢复到新的加密存储中。
- 如果旧插件存在从未备份的仅本地房间密钥，OpenClaw 会清楚地发出警告。这些密钥无法从之前的 rust crypto store 自动导出，因此某些旧的加密历史可能仍不可用，直到手动恢复为止。
- 完整升级流程、限制、恢复命令和常见迁移消息，请参阅 [Matrix 迁移](/zh-CN/install/migrating-matrix)。

加密运行时状态按每个账号、每个用户的 token-hash 根组织，位于
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`。
该目录会包含同步存储（`bot-storage.json`）、加密存储（`crypto/`）、
恢复密钥文件（`recovery-key.json`）、IndexedDB 快照（`crypto-idb-snapshot.json`）、
线程绑定（`thread-bindings.json`）和启动验证状态（`startup-verification.json`），
前提是这些功能正在使用中。
当 token 改变但账号身份保持不变时，OpenClaw 会为该账号/homeserver/用户元组复用最佳的现有根目录，因此之前的同步状态、加密状态、线程绑定和启动验证状态仍然可见。

### Node 加密存储模型

此插件中的 Matrix E2EE 在 Node 中使用官方 `matrix-js-sdk` Rust 加密路径。
当你希望加密状态在重启后仍然存在时，这一路径需要基于 IndexedDB 的持久化。

OpenClaw 当前在 Node 中通过以下方式提供这一能力：

- 使用 `fake-indexeddb` 作为 SDK 期望的 IndexedDB API shim
- 在 `initRustCrypto` 之前，从 `crypto-idb-snapshot.json` 恢复 Rust 加密 IndexedDB 内容
- 在初始化后和运行期间，将更新后的 IndexedDB 内容持久化回 `crypto-idb-snapshot.json`
- 使用建议性文件锁针对 `crypto-idb-snapshot.json` 串行化快照恢复和持久化，以避免 Gateway 网关运行时持久化与 CLI 维护在同一个快照文件上发生竞争

这是兼容性/存储层面的处理，不是自定义加密实现。
该快照文件属于敏感运行时状态，并使用严格的文件权限存储。
根据 OpenClaw 的安全模型，Gateway 网关主机和本地 OpenClaw 状态目录已处于受信任的操作员边界内，因此这主要是运行持久性问题，而不是独立的远程信任边界问题。

计划中的改进：

- 为持久化 Matrix 密钥材料添加 SecretRef 支持，以便恢复密钥和相关的存储加密密钥可以从 OpenClaw secrets provider 获取，而不仅限于本地文件

## 配置文件管理

使用以下命令为所选账号更新 Matrix 自身资料：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

当你希望明确针对某个命名 Matrix 账号时，请添加 `--account <id>`。

Matrix 可直接接受 `mxc://` 头像 URL。当你传入 `http://` 或 `https://` 头像 URL 时，OpenClaw 会先将其上传到 Matrix，然后将解析得到的 `mxc://` URL 存回 `channels.matrix.avatarUrl`（或所选账号的覆盖项）。

## 自动验证通知

Matrix 现在会将验证生命周期通知直接作为 `m.notice` 消息发布到严格的私信验证房间中。
这包括：

- 验证请求通知
- 验证就绪通知（带有明确的“通过表情符号验证”指导）
- 验证开始和完成通知
- 可用时的 SAS 详情（表情符号和十进制数字）

来自另一个 Matrix 客户端的传入验证请求会被 OpenClaw 跟踪并自动接受。
对于自我验证流程，OpenClaw 还会在表情符号验证可用时自动启动 SAS 流程，并确认自己这一侧。
对于来自另一个 Matrix 用户/设备的验证请求，OpenClaw 会自动接受请求，然后等待 SAS 流程正常继续。
你仍然需要在你的 Matrix 客户端中比较表情符号或十进制 SAS，并在那里确认“它们匹配”，以完成验证。

OpenClaw 不会盲目自动接受自发起的重复流程。当自我验证请求已经处于待处理状态时，启动过程会跳过创建新请求。

验证协议/系统通知不会转发到智能体聊天管道，因此不会产生 `NO_REPLY`。

### 设备清理

由 OpenClaw 管理的旧 Matrix 设备可能会在账号中逐渐积累，使加密房间信任更难判断。
使用以下命令列出它们：

```bash
openclaw matrix devices list
```

使用以下命令移除过时的 OpenClaw 管理设备：

```bash
openclaw matrix devices prune-stale
```

### 直接房间修复

如果私信状态不同步，OpenClaw 最终可能会保留过时的 `m.direct` 映射，使其指向旧的单人房间，而不是当前正在使用的私信。使用以下命令检查某个对等方的当前映射：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

使用以下命令修复它：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修复会将 Matrix 特有逻辑保留在插件内部：

- 它优先选择已经在 `m.direct` 中映射的严格 1:1 私信
- 否则会回退到当前已加入的、与该用户之间任意严格 1:1 私信
- 如果不存在健康的私信，它会创建一个新的直接房间，并重写 `m.direct` 使其指向该房间

修复流程不会自动删除旧房间。它只会选择健康的私信并更新映射，以便新的 Matrix 发送、验证通知和其他直接消息流程再次指向正确的房间。

## 线程

Matrix 同时支持用于自动回复和消息工具发送的原生 Matrix 线程。

- `dm.sessionScope: "per-user"`（默认）会保持 Matrix 私信路由以发送者为作用域，因此多个私信房间在解析到同一对等方时可以共享一个会话。
- `dm.sessionScope: "per-room"` 会将每个 Matrix 私信房间隔离到各自独立的会话键中，同时仍使用普通私信认证和 allowlist 检查。
- 显式 Matrix 对话绑定仍然优先于 `dm.sessionScope`，因此已绑定的房间和线程会保留其所选目标会话。
- `threadReplies: "off"` 会保持回复在顶层，并让传入的线程消息继续使用父级会话。
- `threadReplies: "inbound"` 仅当传入消息已处于该线程中时，才在线程中回复。
- `threadReplies: "always"` 会让房间回复保持在线程中，以触发消息为根，并从第一条触发消息开始，通过匹配的线程范围会话路由该对话。
- `dm.threadReplies` 仅覆盖私信的顶层设置。例如，你可以保持房间线程隔离，同时让私信保持扁平。
- 传入的线程消息会将线程根消息作为额外智能体上下文包含进来。
- 现在，如果目标是同一房间或同一私信用户目标，消息工具发送会自动继承当前 Matrix 线程，除非显式提供了 `threadId`。
- 只有当当前会话元数据能够证明是同一个 Matrix 账号上的同一个私信对等方时，相同会话的私信用户目标复用才会生效；否则 OpenClaw 会回退到普通的用户范围路由。
- 当 OpenClaw 发现某个 Matrix 私信房间与同一共享 Matrix 私信会话上的另一个私信房间发生冲突时，如果启用了线程绑定并存在 `dm.sessionScope` 提示，它会在该房间中发布一次性 `m.notice`，提示使用 `/focus` 作为逃生口。
- Matrix 支持运行时线程绑定。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 和线程绑定的 `/acp spawn` 现在都可在 Matrix 房间和私信中使用。
- 当 `threadBindings.spawnSubagentSessions=true` 时，顶层 Matrix 房间/私信中的 `/focus` 会创建一个新的 Matrix 线程，并将其绑定到目标会话。
- 在现有 Matrix 线程中运行 `/focus` 或 `/acp spawn --thread here` 时，则会改为绑定当前线程。

## ACP 对话绑定

Matrix 房间、私信和现有 Matrix 线程都可以被转换为持久的 ACP 工作区，而无需改变聊天界面。

快速操作流程：

- 在你想继续使用的 Matrix 私信、房间或现有线程中运行 `/acp spawn codex --bind here`。
- 在顶层 Matrix 私信或房间中，当前私信/房间会继续作为聊天界面，未来的消息会路由到新生成的 ACP 会话。
- 在现有 Matrix 线程内，`--bind here` 会将当前线程原地绑定。
- `/new` 和 `/reset` 会原地重置同一个已绑定 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

说明：

- `--bind here` 不会创建子 Matrix 线程。
- 仅当使用 `/acp spawn --thread auto|here` 且 OpenClaw 需要创建或绑定子 Matrix 线程时，才需要 `threadBindings.spawnAcpSessions`。

### 线程绑定配置

Matrix 会继承 `session.threadBindings` 的全局默认值，也支持按渠道覆盖：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix 线程绑定的 spawn 标志为选择启用：

- 设置 `threadBindings.spawnSubagentSessions: true` 以允许顶层 `/focus` 创建并绑定新的 Matrix 线程。
- 设置 `threadBindings.spawnAcpSessions: true` 以允许 `/acp spawn --thread auto|here` 将 ACP 会话绑定到 Matrix 线程。

## 表情回应

Matrix 支持出站表情回应操作、传入表情回应通知以及传入 ack 表情回应。

- 出站表情回应工具由 `channels["matrix"].actions.reactions` 控制。
- `react` 会向特定 Matrix 事件添加一个表情回应。
- `reactions` 会列出特定 Matrix 事件当前的表情回应摘要。
- `emoji=""` 会移除机器人账号在该事件上的所有自身表情回应。
- `remove: true` 只会移除机器人账号对该表情的回应。

Ack 表情回应按标准 OpenClaw 解析顺序处理：

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- 智能体身份 emoji 回退值

Ack 表情回应作用域按以下顺序解析：

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

表情回应通知模式按以下顺序解析：

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- 默认值：`own`

当前行为：

- `reactionNotifications: "own"` 会在 `m.reaction` 事件指向机器人撰写的 Matrix 消息时转发表情回应新增事件。
- `reactionNotifications: "off"` 会禁用表情回应系统事件。
- 表情回应移除仍不会被合成为系统事件，因为 Matrix 将其作为 redaction 呈现，而不是独立的 `m.reaction` 移除事件。

## 历史上下文

- `channels.matrix.historyLimit` 控制当 Matrix 房间消息触发智能体时，作为 `InboundHistory` 包含多少最近房间消息。
- 它会回退到 `messages.groupChat.historyLimit`。如果两者都未设置，则有效默认值为 `0`，因此带提及门控的房间消息不会被缓冲。设置为 `0` 可禁用。
- Matrix 房间历史仅限房间。私信仍使用普通会话历史。
- Matrix 房间历史是待处理专用：OpenClaw 会缓冲尚未触发回复的房间消息，然后在提及或其他触发到来时快照该窗口。
- 当前触发消息不会包含在 `InboundHistory` 中；它会保留在该轮次的主传入正文中。
- 对同一个 Matrix 事件的重试会复用原始历史快照，而不会向前漂移到更新的房间消息。

## 上下文可见性

Matrix 支持共享的 `contextVisibility` 控制，用于补充房间上下文，例如已获取的回复文本、线程根和待处理历史。

- `contextVisibility: "all"` 是默认值。补充上下文会按接收到的内容保留。
- `contextVisibility: "allowlist"` 会根据活动中的房间/用户 allowlist 检查，过滤补充上下文中的发送者。
- `contextVisibility: "allowlist_quote"` 的行为类似 `allowlist`，但仍会保留一个显式引用的回复。

此设置影响的是补充上下文的可见性，而不是传入消息本身是否可以触发回复。
触发授权仍然来自 `groupPolicy`、`groups`、`groupAllowFrom` 和私信策略设置。

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

如果某个未批准的 Matrix 用户在获得批准前持续向你发消息，OpenClaw 会复用相同的待处理配对代码，并可能在短暂冷却后再次发送提醒回复，而不是生成新的代码。

有关共享的私信配对流程和存储布局，请参阅 [配对](/zh-CN/channels/pairing)。

## Exec 审批

Matrix 可以作为某个 Matrix 账号的 exec 审批客户端。

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（可选；回退到 `channels.matrix.dm.allowFrom`）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

审批者必须是 Matrix 用户 ID，例如 `@owner:example.org`。当 `enabled` 未设置或为 `"auto"`，并且至少可以解析出一个审批者时——无论来自 `execApprovals.approvers` 还是 `channels.matrix.dm.allowFrom`——Matrix 会自动启用原生 exec 审批。设置 `enabled: false` 可显式禁用 Matrix 作为原生审批客户端。否则，审批请求会回退到其他已配置的审批路由或 exec 审批回退策略。

目前原生 Matrix 路由仅支持 exec：

- `channels.matrix.execApprovals.*` 仅控制 exec 审批的原生私信/渠道路由。
- 插件审批仍使用共享的同聊天 `/approve`，以及任何已配置的 `approvals.plugin` 转发。
- 当 Matrix 能安全推断审批者时，它仍可以复用 `channels.matrix.dm.allowFrom` 进行插件审批授权，但不会公开单独的原生插件审批私信/渠道扇出路径。

投递规则：

- `target: "dm"` 会将审批提示发送到审批者私信
- `target: "channel"` 会将提示发送回发起的 Matrix 房间或私信
- `target: "both"` 会同时发送到审批者私信以及发起的 Matrix 房间或私信

Matrix 审批提示会在主审批消息上预置表情回应快捷方式：

- `✅` = 允许一次
- `❌` = 拒绝
- `♾️` = 当该决策被有效 exec 策略允许时，始终允许

审批者可以对该消息添加表情回应，或使用回退斜杠命令：`/approve <id> allow-once`、`/approve <id> allow-always` 或 `/approve <id> deny`。

只有已解析的审批者才能批准或拒绝。渠道投递会包含命令文本，因此仅在受信任房间中启用 `channel` 或 `both`。

Matrix 审批提示复用共享的核心审批规划器。Matrix 特有的原生界面目前仅作为 exec 审批的传输层：房间/私信路由以及消息发送/更新/删除行为。

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

顶层 `channels.matrix` 值会作为命名账号的默认值，除非某个账号进行了覆盖。
你可以使用 `groups.<room>.account`（或旧版 `rooms.<room>.account`）将继承的房间条目限定到某个 Matrix 账号。
未设置 `account` 的条目会在所有 Matrix 账号之间共享，而设置 `account: "default"` 的条目在默认账号直接配置在顶层 `channels.matrix.*` 时仍然有效。
部分共享认证默认值本身不会创建单独的隐式默认账号。只有当该默认值具备新的认证信息（`homeserver` 加 `accessToken`，或 `homeserver` 加 `userId` 和 `password`）时，OpenClaw 才会合成顶层 `default` 账号；命名账号仍可以仅凭 `homeserver` 加 `userId` 保持可发现状态，并在稍后由缓存凭证满足认证。
如果 Matrix 已经恰好有一个命名账号，或 `defaultAccount` 指向现有命名账号键，那么单账号到多账号的修复/设置提升会保留该账号，而不会创建新的 `accounts.default` 条目。只有 Matrix 认证/bootstrap 键会移动到提升后的账号；共享投递策略键仍保留在顶层。
当你希望 OpenClaw 在隐式路由、探测和 CLI 操作中优先使用某个命名 Matrix 账号时，请设置 `defaultAccount`。
如果你配置了多个命名账号，请设置 `defaultAccount`，或为依赖隐式账号选择的 CLI 命令传入 `--account <id>`。
当你希望为某条命令覆盖这种隐式选择时，请将 `--account <id>` 传给 `openclaw matrix verify ...` 和 `openclaw matrix devices ...`。

## 私有/LAN homeserver

默认情况下，除非你按账号显式选择启用，否则 OpenClaw 会阻止连接私有/内部 Matrix homeserver，以提供 SSRF 保护。

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

此选择启用仅允许受信任的私有/内部目标。诸如
`http://matrix.example.org:8008` 这样的公共明文 homeserver 仍会被阻止。尽可能优先使用 `https://`。

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
OpenClaw 会对运行时 Matrix 流量和账号状态探测使用相同的代理设置。

## 目标解析

在 OpenClaw 要求你提供房间或用户目标的任何位置，Matrix 都接受以下目标形式：

- 用户：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房间：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 别名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

实时目录查找会使用已登录的 Matrix 账号：

- 用户查找会查询该 homeserver 上的 Matrix 用户目录。
- 房间查找会直接接受显式房间 ID 和别名，然后回退到搜索该账号已加入房间的名称。
- 已加入房间名称查找属于尽力而为。如果房间名称无法解析为 ID 或别名，运行时 allowlist 解析会忽略它。

## 配置参考

- `enabled`：启用或禁用该渠道。
- `name`：账号的可选标签。
- `defaultAccount`：配置多个 Matrix 账号时的首选账号 ID。
- `homeserver`：homeserver URL，例如 `https://matrix.example.org`。
- `allowPrivateNetwork`：允许此 Matrix 账号连接到私有/内部 homeserver。当 homeserver 解析到 `localhost`、LAN/Tailscale IP 或内部主机（如 `matrix-synapse`）时启用此项。
- `proxy`：Matrix 流量的可选 HTTP(S) 代理 URL。命名账号可以用自己的 `proxy` 覆盖顶层默认值。
- `userId`：完整 Matrix 用户 ID，例如 `@bot:example.org`。
- `accessToken`：基于 token 认证的 access token。`channels.matrix.accessToken` 和 `channels.matrix.accounts.<id>.accessToken` 支持明文值和 SecretRef 值，适用于 env/file/exec provider。请参阅 [Secrets Management](/zh-CN/gateway/secrets)。
- `password`：基于 password 登录的密码。支持明文值和 SecretRef 值。
- `deviceId`：显式 Matrix 设备 ID。
- `deviceName`：password 登录时的设备显示名称。
- `avatarUrl`：用于配置文件同步和 `set-profile` 更新的已存储自头像 URL。
- `initialSyncLimit`：启动同步事件限制。
- `encryption`：启用 E2EE。
- `allowlistOnly`：强制对私信和房间启用仅 allowlist 行为。
- `allowBots`：允许来自其他已配置 OpenClaw Matrix 账号的消息（`true` 或 `"mentions"`）。
- `groupPolicy`：`open`、`allowlist` 或 `disabled`。
- `contextVisibility`：补充房间上下文的可见性模式（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`：房间流量的用户 ID allowlist。
- `groupAllowFrom` 条目应为完整 Matrix 用户 ID。无法解析的名称在运行时会被忽略。
- `historyLimit`：作为群组历史上下文包含的最大房间消息数。会回退到 `messages.groupChat.historyLimit`；如果两者都未设置，则有效默认值为 `0`。设置 `0` 可禁用。
- `replyToMode`：`off`、`first` 或 `all`。
- `markdown`：出站 Matrix 文本的可选 Markdown 渲染配置。
- `streaming`：`off`（默认）、`partial`、`quiet`、`true` 或 `false`。`partial` 和 `true` 会使用普通 Matrix 文本消息启用先预览的草稿更新。`quiet` 会在自托管推送规则设置中使用静默预览通知。
- `blockStreaming`：`true` 会在草稿预览流式传输启用时，为已完成的 assistant 块启用单独进度消息。
- `threadReplies`：`off`、`inbound` 或 `always`。
- `threadBindings`：线程绑定会话路由和生命周期的按渠道覆盖。
- `startupVerification`：启动时自动自我验证请求模式（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`：自动启动验证请求重试前的冷却时间。
- `textChunkLimit`：出站消息分块大小。
- `chunkMode`：`length` 或 `newline`。
- `responsePrefix`：出站回复的可选消息前缀。
- `ackReaction`：此渠道/账号的可选 ack 表情回应覆盖。
- `ackReactionScope`：可选的 ack 表情回应作用域覆盖（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`：传入表情回应通知模式（`own`、`off`）。
- `mediaMaxMb`：Matrix 媒体处理的媒体大小上限（MB）。适用于出站发送和传入媒体处理。
- `autoJoin`：邀请自动加入策略（`always`、`allowlist`、`off`）。默认值：`off`。这适用于一般意义上的 Matrix 邀请，包括私信式邀请，而不仅仅是房间/群组邀请。OpenClaw 会在邀请时做出该决定，此时它还无法可靠地将加入的房间归类为私信或群组。
- `autoJoinAllowlist`：当 `autoJoin` 为 `allowlist` 时允许的房间/别名。别名条目会在处理邀请时解析为房间 ID；OpenClaw 不会信任受邀房间声明的别名状态。
- `dm`：私信策略块（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.policy`：控制 OpenClaw 在加入房间并将其归类为私信之后的私信访问。它不会改变邀请是否会自动加入。
- `dm.allowFrom` 条目应为完整 Matrix 用户 ID，除非你已经通过实时目录查找解析过它们。
- `dm.sessionScope`：`per-user`（默认）或 `per-room`。如果你希望每个 Matrix 私信房间即使面对同一个对等方也保持独立上下文，请使用 `per-room`。
- `dm.threadReplies`：仅私信线程策略覆盖（`off`、`inbound`、`always`）。它会覆盖顶层 `threadReplies` 设置，用于私信中的回复位置和会话隔离。
- `execApprovals`：Matrix 原生 exec 审批投递（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`：允许批准 exec 请求的 Matrix 用户 ID。当 `dm.allowFrom` 已经标识审批者时可选。
- `execApprovals.target`：`dm | channel | both`（默认：`dm`）。
- `accounts`：命名的按账号覆盖项。顶层 `channels.matrix` 值会作为这些条目的默认值。
- `groups`：按房间划分的策略映射。优先使用房间 ID 或别名；无法解析的房间名称会在运行时被忽略。解析后，会话/群组身份使用稳定房间 ID，而人类可读标签仍来自房间名称。
- `groups.<room>.account`：在多账号设置中，将某个继承房间条目限制到特定 Matrix 账号。
- `groups.<room>.allowBots`：针对已配置机器人发送者的房间级覆盖（`true` 或 `"mentions"`）。
- `groups.<room>.users`：按房间划分的发送者 allowlist。
- `groups.<room>.tools`：按房间划分的工具允许/拒绝覆盖。
- `groups.<room>.autoReply`：房间级提及门控覆盖。`true` 会禁用该房间的提及要求；`false` 会重新强制启用。
- `groups.<room>.skills`：可选的房间级 skill 过滤器。
- `groups.<room>.systemPrompt`：可选的房间级 system prompt 片段。
- `rooms`：`groups` 的旧版别名。
- `actions`：按操作划分的工具门控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 相关内容

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信认证与配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型与加固
