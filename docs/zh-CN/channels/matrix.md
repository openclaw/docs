---
read_when:
    - 在 OpenClaw 中设置 Matrix
    - 配置 Matrix E2EE 和验证
summary: Matrix 支持状态、设置与配置示例
title: Matrix
x-i18n:
    generated_at: "2026-04-07T18:44:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec926df79a41fa296d63f0ec7219d0f32e075628d76df9ea490e93e4c5030f83
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix 是 OpenClaw 的 Matrix 内置渠道插件。
它使用官方的 `matrix-js-sdk`，并支持私信、房间、线程、媒体、表情回应、投票、位置和 E2EE。

## 内置插件

Matrix 作为当前 OpenClaw 版本中的内置插件发布，因此普通的打包构建无需单独安装。

如果你使用的是较旧版本，或是排除了 Matrix 的自定义安装，请手动安装：

从 npm 安装：

```bash
openclaw plugins install @openclaw/matrix
```

从本地检出安装：

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

有关插件行为和安装规则，请参见 [插件](/zh-CN/tools/plugin)。

## 设置

1. 确保 Matrix 插件可用。
   - 当前打包的 OpenClaw 版本已内置该插件。
   - 较旧版本或自定义安装可通过上述命令手动添加。
2. 在你的 homeserver 上创建一个 Matrix 账户。
3. 使用以下任一方式配置 `channels.matrix`：
   - `homeserver` + `accessToken`，或
   - `homeserver` + `userId` + `password`。
4. 重启 Gateway 网关。
5. 与机器人发起私信，或邀请它加入房间。
   - 只有当 `channels.matrix.autoJoin` 允许时，新发出的 Matrix 邀请才会生效。

交互式设置路径：

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix 向导实际会询问的内容：

- homeserver URL
- 认证方式：access token 或 password
- 仅当你选择 password 认证时才询问用户 ID
- 可选的设备名称
- 是否启用 E2EE
- 是否现在配置 Matrix 房间访问
- 是否现在配置 Matrix 邀请自动加入
- 启用邀请自动加入时，是否应设为 `allowlist`、`always` 或 `off`

需要注意的向导行为：

- 如果所选账户已存在 Matrix 认证环境变量，且该账户尚未在配置中保存认证信息，向导会提供环境变量快捷方式，这样设置时可将认证信息保留在环境变量中，而不是把密钥复制进配置。
- 当你以交互方式添加另一个 Matrix 账户时，输入的账户名称会被规范化为配置和环境变量中使用的账户 ID。例如，`Ops Bot` 会变成 `ops-bot`。
- 私信 allowlist 提示可直接接受完整的 `@user:server` 值。显示名只有在实时目录查找恰好命中一个结果时才有效；否则向导会要求你使用完整 Matrix ID 重试。
- 房间 allowlist 提示可直接接受房间 ID 和别名。它们也可实时解析已加入房间的名称，但在设置时未解析成功的名称只会按原样保留，运行时进行 allowlist 解析时会被忽略。优先使用 `!room:server` 或 `#alias:server`。
- 向导现在会在邀请自动加入步骤前显示明确警告，因为 `channels.matrix.autoJoin` 默认为 `off`；除非你设置它，否则智能体不会加入被邀请的房间或新的私信式邀请。
- 在邀请自动加入的 allowlist 模式下，只能使用稳定的邀请目标：`!roomId:server`、`#alias:server` 或 `*`。普通房间名会被拒绝。
- 运行时房间/会话标识使用稳定的 Matrix 房间 ID。房间声明的别名仅用作查找输入，不作为长期会话键或稳定的群组标识。
- 如需在保存前解析房间名，请使用 `openclaw channels resolve --channel matrix "Project Room"`。

<Warning>
`channels.matrix.autoJoin` 默认为 `off`。

如果你保持未设置，机器人将不会加入被邀请的房间或新的私信式邀请，因此除非你先手动加入，否则它不会出现在新群组或被邀请的私信中。

设置 `autoJoin: "allowlist"` 并同时配置 `autoJoinAllowlist`，可限制它接受哪些邀请；如果你希望它加入所有邀请，则设置 `autoJoin: "always"`。

在 `allowlist` 模式下，`autoJoinAllowlist` 只接受 `!roomId:server`、`#alias:server` 或 `*`。
</Warning>

Allowlist 示例：

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

基于 token 的最小配置：

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

基于 password 的配置（登录后会缓存 token）：

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

Matrix 会将缓存凭证存储在 `~/.openclaw/credentials/matrix/`。
默认账户使用 `credentials.json`；命名账户使用 `credentials-<account>.json`。
当这些位置存在缓存凭证时，即使当前认证信息未直接设置在配置中，OpenClaw 也会在设置、Doctor 和渠道状态发现中将 Matrix 视为已配置。

对应的环境变量（当配置键未设置时使用）：

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

账户 `ops` 的示例：

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

对于规范化后的账户 ID `ops-bot`，请使用：

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix 会转义账户 ID 中的标点符号，以避免带作用域的环境变量发生冲突。
例如，`-` 会变成 `_X2D_`，因此 `ops-prod` 会映射为 `MATRIX_OPS_X2D_PROD_*`。

只有当这些认证环境变量已经存在，且所选账户尚未在配置中保存 Matrix 认证信息时，交互式向导才会提供环境变量快捷方式。

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

`autoJoin` 适用于所有 Matrix 邀请，而不仅仅是房间/群组邀请。
这也包括新的私信式邀请。在邀请发生时，OpenClaw 还无法可靠判断被邀请房间最终会被视为私信还是群组，因此所有邀请都会先经过同一个 `autoJoin` 决策。机器人加入后，如果房间被归类为私信，`dm.policy` 仍然会生效，因此 `autoJoin` 控制的是加入行为，而 `dm.policy` 控制的是回复/访问行为。

## 流式预览

Matrix 回复流式传输为选择性启用。

当你希望 OpenClaw 发送一条实时预览回复、在模型生成文本期间原地编辑该预览，并在回复完成时将其定稿，请将 `channels.matrix.streaming` 设置为 `"partial"`：

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
- `streaming: "partial"` 会为当前 assistant block 创建一条可编辑的预览消息，使用普通 Matrix 文本消息。这会保留 Matrix 传统的“先预览再通知”行为，因此标准客户端可能会针对第一条流式预览文本发出通知，而不是针对完成后的内容块。
- `streaming: "quiet"` 会为当前 assistant block 创建一条可编辑的静默预览通知。仅当你同时为最终定稿的预览编辑配置了接收方 push rules 时，才应使用此选项。
- `blockStreaming: true` 会启用单独的 Matrix 进度消息。启用预览流式传输后，Matrix 会为当前内容块保留实时草稿，并将已完成的内容块保留为独立消息。
- 当启用预览流式传输且 `blockStreaming` 为关闭时，Matrix 会原地编辑实时草稿，并在内容块或整轮结束时完成该同一事件。
- 如果预览内容已无法放入单个 Matrix 事件，OpenClaw 会停止预览流式传输并回退到普通最终投递。
- 媒体回复仍会正常发送附件。如果陈旧预览已无法安全复用，OpenClaw 会在发送最终媒体回复前将其撤销。
- 预览编辑会产生额外的 Matrix API 调用。如果你想采用最保守的速率限制行为，请关闭流式传输。

`blockStreaming` 本身不会启用草稿预览。
如需预览编辑，请使用 `streaming: "partial"` 或 `streaming: "quiet"`；然后仅当你还希望已完成的 assistant blocks 作为独立进度消息保留可见时，再添加 `blockStreaming: true`。

如果你需要标准 Matrix 通知而不配置自定义 push rules，请使用 `streaming: "partial"` 以获得“先预览”的行为，或关闭 `streaming` 以仅在最终结果时投递。对于 `streaming: "off"`：

- `blockStreaming: true` 会将每个完成的内容块作为普通可通知的 Matrix 消息发送。
- `blockStreaming: false` 只会将最终完成的回复作为普通可通知的 Matrix 消息发送。

### 自托管环境中用于静默定稿预览的 push rules

如果你运行的是自己的 Matrix 基础设施，并希望静默预览仅在内容块或最终回复完成时触发通知，请设置 `streaming: "quiet"`，并为已定稿的预览编辑添加每用户 push rule。

这通常是接收方用户的设置，而不是 homeserver 的全局配置更改：

开始前的快速说明：

- recipient user = 应接收通知的人
- bot user = 发送回复的 OpenClaw Matrix 账户
- 下方 API 调用请使用接收方用户的 access token
- 在 push rule 中，将 `sender` 与 bot user 的完整 MXID 进行匹配

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

2. 确保接收方账户已经能接收普通 Matrix push 通知。静默预览规则只有在该用户已有正常工作的 pushers/devices 时才有效。

3. 获取接收方用户的 access token。
   - 使用接收消息用户的 token，而不是机器人的 token。
   - 复用已有客户端会话 token 通常最简单。
   - 如果你需要签发新的 token，可以通过标准 Matrix Client-Server API 登录：

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

4. 验证接收方账户已存在 pushers：

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

如果这里未返回任何活跃的 pushers/devices，请先修复普通 Matrix 通知，再添加下面的 OpenClaw 规则。

OpenClaw 会用以下字段标记已定稿的纯文本预览编辑：

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. 为每个需要接收这些通知的接收方账户创建一条 override push rule：

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

运行命令前，请替换以下值：

- `https://matrix.example.org`：你的 homeserver 基础 URL
- `$USER_ACCESS_TOKEN`：接收方用户的 access token
- `openclaw-finalized-preview-botname`：对该接收方用户而言、此机器人的唯一规则 ID
- `@bot:example.org`：你的 OpenClaw Matrix 机器人 MXID，而不是接收方用户的 MXID

多机器人场景的重要说明：

- Push rules 以 `ruleId` 为键。对相同 rule ID 重新执行 `PUT` 会更新该条规则。
- 如果一个接收方用户需要针对多个 OpenClaw Matrix 机器人账户触发通知，请为每个机器人创建一条规则，并为每个 sender 匹配项使用唯一 rule ID。
- 一个简单模式是 `openclaw-finalized-preview-<botname>`，例如 `openclaw-finalized-preview-ops` 或 `openclaw-finalized-preview-support`。

该规则会针对事件发送者进行判断：

- 使用接收方用户的 token 进行认证
- 让 `sender` 与 OpenClaw 机器人 MXID 匹配

6. 验证规则已存在：

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. 测试一次流式回复。在静默模式下，房间中应显示静默草稿预览，并且在内容块或整轮结束时，其原地最终编辑会触发一次通知。

如果你之后需要移除此规则，请使用接收方用户的 token 删除同一个 rule ID：

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

说明：

- 请使用接收方用户的 access token 创建规则，而不是机器人的。
- 新建的用户自定义 `override` 规则会插入到默认抑制规则之前，因此不需要额外的排序参数。
- 这只影响 OpenClaw 能够安全原地定稿的纯文本预览编辑。媒体回退和陈旧预览回退仍使用普通 Matrix 投递。
- 如果 `GET /_matrix/client/v3/pushers` 未显示任何 pushers，说明该用户在此账户/设备上尚未具备正常工作的 Matrix push 投递。

#### Synapse

对于 Synapse，通常只需完成上述设置即可：

- 无需对 `homeserver.yaml` 做任何特殊修改即可支持已定稿的 OpenClaw 预览通知。
- 如果你的 Synapse 部署已经能发送普通 Matrix push 通知，那么用户 token + 上述 `pushrules` 调用就是主要设置步骤。
- 如果你的 Synapse 运行在反向代理或 workers 之后，请确保 `/_matrix/client/.../pushrules/` 能正确到达 Synapse。
- 如果你使用 Synapse workers，请确保 pushers 状态健康。Push 投递由主进程或 `synapse.app.pusher` / 已配置的 pusher workers 处理。

#### Tuwunel

对于 Tuwunel，请使用与上方相同的设置流程和 push-rule API 调用：

- 对于已定稿预览标记本身，不需要任何 Tuwunel 专用配置。
- 如果该用户的普通 Matrix 通知已正常工作，那么用户 token + 上述 `pushrules` 调用就是主要设置步骤。
- 如果通知在用户于另一台设备活跃时似乎消失，请检查是否启用了 `suppress_push_when_active`。Tuwunel 在 2025 年 9 月 12 日发布的 Tuwunel 1.4.2 中加入了该选项，它可能会在一台设备活跃时，有意抑制发往其他设备的推送。

## 加密与验证

在加密（E2EE）房间中，出站图片事件使用 `thumbnail_file`，因此图片预览会与完整附件一起加密。未加密房间仍使用普通的 `thumbnail_url`。无需任何配置——插件会自动检测 E2EE 状态。

### 机器人到机器人房间

默认情况下，来自其他已配置 OpenClaw Matrix 账户的 Matrix 消息会被忽略。

如果你确实需要智能体之间的 Matrix 流量，请使用 `allowBots`：

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
- `allowBots: "mentions"` 仅在这些消息在房间中明确提及当前机器人时才接受。私信仍然允许。
- `groups.<room>.allowBots` 可覆盖单个房间的账户级设置。
- OpenClaw 仍会忽略来自同一 Matrix 用户 ID 的消息，以避免自回复循环。
- Matrix 在这里不提供原生机器人标记；OpenClaw 将“机器人发送”视为“由此 OpenClaw Gateway 网关上另一个已配置的 Matrix 账户发送”。

在共享房间中启用机器人到机器人流量时，请使用严格的房间 allowlist 和提及要求。

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

多账户支持：使用 `channels.matrix.accounts` 配置每个账户的凭证和可选的 `name`。共享模式请参见 [配置参考](/zh-CN/gateway/configuration-reference#multi-account-all-channels)。

详细引导诊断：

```bash
openclaw matrix verify bootstrap --verbose
```

在引导前强制重置 cross-signing 身份：

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

删除当前服务器备份并创建新的备份基线。如果存储的备份密钥无法被干净地加载，此重置也可以重新创建 secret storage，以便未来冷启动时能够加载新的备份密钥：

```bash
openclaw matrix verify backup reset --yes
```

所有 `verify` 命令默认都很简洁（包括安静的内部 SDK 日志），只有使用 `--verbose` 时才显示详细诊断。
在编写脚本时，请使用 `--json` 获取完整的机器可读输出。

在多账户设置中，Matrix CLI 命令会使用隐式的 Matrix 默认账户，除非你传入 `--account <id>`。
如果你配置了多个命名账户，请先设置 `channels.matrix.defaultAccount`，否则这些隐式 CLI 操作将停止并要求你显式选择账户。
当你希望验证或设备操作明确针对某个命名账户时，请使用 `--account`：

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

当某个命名账户的加密被禁用或不可用时，Matrix 警告和验证错误会指向该账户的配置键，例如 `channels.matrix.accounts.assistant.encryption`。

### “已验证”的含义

只有当此 Matrix 设备已由你自己的 cross-signing identity 验证时，OpenClaw 才会将其视为已验证。
在实践中，`openclaw matrix verify status --verbose` 会暴露三个信任信号：

- `Locally trusted`：此设备仅被当前客户端信任
- `Cross-signing verified`：SDK 报告此设备已通过 cross-signing 验证
- `Signed by owner`：此设备已由你自己的 self-signing key 签名

只有在存在 cross-signing 验证或 owner-signing 时，`Verified by owner` 才会变为 `yes`。
仅有本地信任并不足以让 OpenClaw 将该设备视为完全已验证。

### bootstrap 的作用

`openclaw matrix verify bootstrap` 是用于修复和设置加密 Matrix 账户的命令。
它会按顺序完成以下所有操作：

- 引导 secret storage，并尽可能复用现有恢复密钥
- 引导 cross-signing，并上传缺失的公开 cross-signing keys
- 尝试标记并交叉签名当前设备
- 如果服务器端房间密钥备份尚不存在，则创建一个新的备份

如果 homeserver 在上传 cross-signing keys 时需要交互式认证，OpenClaw 会先尝试不带认证上传，然后尝试 `m.login.dummy`，如果已配置 `channels.matrix.password`，再尝试 `m.login.password`。

仅当你明确希望丢弃当前 cross-signing identity 并创建新身份时，才使用 `--force-reset-cross-signing`。

如果你明确希望丢弃当前房间密钥备份，并为未来消息重新开始新的备份基线，请使用 `openclaw matrix verify backup reset --yes`。
只有在你接受无法恢复的旧加密历史将继续不可用，并且接受 OpenClaw 可能在当前备份密钥无法安全加载时重新创建 secret storage 的情况下，才应这样做。

### 新备份基线

如果你希望未来的加密消息继续可用，并接受丢失无法恢复的旧历史，请按顺序运行以下命令：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

如果你希望明确针对某个命名 Matrix 账户，请为每个命令加上 `--account <id>`。

### 启动行为

当 `encryption: true` 时，Matrix 默认会将 `startupVerification` 设为 `"if-unverified"`。
启动时，如果此设备仍未验证，Matrix 会在另一个 Matrix 客户端中请求自验证；如果已有请求待处理，则会跳过重复请求；并会在重启后重试前应用本地冷却时间。
默认情况下，失败的请求创建尝试会比成功创建后的重试更早再次尝试。
如果你想禁用自动启动请求，请设置 `startupVerification: "off"`；如果你希望缩短或延长重试窗口，则调整 `startupVerificationCooldownHours`。

启动时还会自动执行一次保守的加密 bootstrap 过程。
该过程会优先尝试复用当前 secret storage 和 cross-signing identity，并避免重置 cross-signing，除非你运行显式的 bootstrap 修复流程。

如果启动时发现 bootstrap 状态损坏且已配置 `channels.matrix.password`，OpenClaw 可以尝试更严格的修复路径。
如果当前设备已经由 owner-signed，OpenClaw 会保留该身份，而不是自动重置它。

从之前公开的 Matrix 插件升级时：

- OpenClaw 会在可能的情况下自动复用相同的 Matrix 账户、access token 和设备身份。
- 在执行任何可操作的 Matrix 迁移更改之前，OpenClaw 会在 `~/Backups/openclaw-migrations/` 下创建或复用恢复快照。
- 如果你使用多个 Matrix 账户，请在从旧的扁平存储布局升级前设置 `channels.matrix.defaultAccount`，这样 OpenClaw 才知道应将共享的旧状态迁移到哪个账户。
- 如果旧插件曾在本地存储 Matrix 房间密钥备份解密密钥，启动或 `openclaw doctor --fix` 现在会自动将其导入新的恢复密钥流程。
- 如果在准备迁移后 Matrix access token 发生了变化，启动现在会在放弃自动备份恢复前扫描同级 token-hash 存储根目录中的待恢复旧状态。
- 如果之后同一账户、homeserver 和用户的 Matrix access token 再次发生变化，OpenClaw 现在会优先复用最完整的现有 token-hash 存储根目录，而不是从空的 Matrix 状态目录开始。
- 在下次 Gateway 网关启动时，已备份的房间密钥会自动恢复到新的加密存储中。
- 如果旧插件包含仅本地存在、从未备份的房间密钥，OpenClaw 会明确发出警告。这些密钥无法从旧的 rust crypto store 中自动导出，因此某些旧的加密历史在手动恢复之前可能仍不可用。
- 完整升级流程、限制、恢复命令和常见迁移消息，请参见 [Matrix migration](/zh-CN/install/migrating-matrix)。

加密运行时状态按账户、用户和 token-hash 组织，目录位于
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`。
该目录在这些功能启用时包含同步存储（`bot-storage.json`）、加密存储（`crypto/`）、
恢复密钥文件（`recovery-key.json`）、IndexedDB 快照（`crypto-idb-snapshot.json`）、
线程绑定（`thread-bindings.json`）以及启动验证状态（`startup-verification.json`）。
当 token 变化但账户身份保持不变时，OpenClaw 会为该 account/homeserver/user 元组复用最佳的现有根目录，因此先前的同步状态、加密状态、线程绑定和启动验证状态仍然可见。

### Node crypto store 模型

此插件中的 Matrix E2EE 在 Node 中使用官方 `matrix-js-sdk` Rust crypto 路径。
当你希望加密状态在重启后仍能保留时，该路径要求使用基于 IndexedDB 的持久化。

OpenClaw 当前在 Node 中通过以下方式实现：

- 使用 `fake-indexeddb` 作为 SDK 所需的 IndexedDB API shim
- 在 `initRustCrypto` 之前，从 `crypto-idb-snapshot.json` 恢复 Rust crypto IndexedDB 内容
- 在初始化后和运行期间，将更新后的 IndexedDB 内容持久化回 `crypto-idb-snapshot.json`
- 通过建议性文件锁，围绕 `crypto-idb-snapshot.json` 串行化快照恢复和持久化，以避免 Gateway 网关运行时持久化与 CLI 维护在同一快照文件上发生竞争

这只是兼容性/存储层面的处理，不是自定义加密实现。
该快照文件属于敏感运行时状态，并以严格的文件权限存储。
在 OpenClaw 的安全模型下，Gateway 网关主机和本地 OpenClaw 状态目录已经位于受信任的操作员边界内，因此这主要是运行可靠性问题，而不是单独的远程信任边界。

计划中的改进：

- 为持久化的 Matrix 密钥材料添加 SecretRef 支持，使恢复密钥和相关的存储加密密钥可以来自 OpenClaw secrets providers，而不只是本地文件

## 配置文件管理

使用以下命令更新所选账户的 Matrix 自身资料：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

如果你希望明确针对某个命名 Matrix 账户，请添加 `--account <id>`。

Matrix 可直接接受 `mxc://` 头像 URL。当你传入 `http://` 或 `https://` 头像 URL 时，OpenClaw 会先将其上传到 Matrix，然后把解析得到的 `mxc://` URL 回写到 `channels.matrix.avatarUrl`（或所选账户的覆盖值）中。

## 自动验证通知

Matrix 现在会将验证生命周期通知直接作为 `m.notice` 消息发布到严格的私信验证房间中。
这包括：

- 验证请求通知
- 验证就绪通知（带有明确的“通过表情符号验证”指引）
- 验证开始和完成通知
- SAS 详情（表情符号和十进制），如果可用

来自另一个 Matrix 客户端的入站验证请求会被 OpenClaw 跟踪并自动接受。
对于自验证流程，当表情符号验证可用时，OpenClaw 也会自动启动 SAS 流程并确认自身这一侧。
对于来自另一个 Matrix 用户/设备的验证请求，OpenClaw 会自动接受该请求，然后等待 SAS 流程正常继续。
你仍需要在你的 Matrix 客户端中比对表情符号或十进制 SAS，并在那边确认“它们匹配”，以完成验证。

OpenClaw 不会盲目自动接受自发起的重复流程。若已有自验证请求待处理，启动时会跳过创建新请求。

验证协议/系统通知不会转发到智能体聊天流水线，因此不会产生 `NO_REPLY`。

### 设备清理

由 OpenClaw 管理的旧 Matrix 设备可能会在账户中逐渐累积，使加密房间中的信任关系更难判断。
可使用以下命令列出它们：

```bash
openclaw matrix devices list
```

使用以下命令移除陈旧的 OpenClaw 管理设备：

```bash
openclaw matrix devices prune-stale
```

### Direct Room 修复

如果私信状态不同步，OpenClaw 可能会保留陈旧的 `m.direct` 映射，把它指向旧的单人房间而不是当前有效的私信。可使用以下命令检查某个对端的当前映射：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

使用以下命令修复：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修复逻辑会将 Matrix 专属逻辑保留在插件内部：

- 它会优先选择已经在 `m.direct` 中映射的严格 1:1 私信
- 否则会回退到与该用户当前已加入的任意严格 1:1 私信
- 如果不存在健康的私信，它会创建一个新的直连房间，并重写 `m.direct` 指向它

修复流程不会自动删除旧房间。它只会选择健康的私信并更新映射，以便新的 Matrix 发送、验证通知和其他私信流程再次指向正确的房间。

## 线程

Matrix 同时支持自动回复和 message-tool 发送使用原生 Matrix 线程。

- `dm.sessionScope: "per-user"`（默认）会让 Matrix 私信路由保持按发送者划分，因此多个私信房间在解析到同一对端时可共享一个会话。
- `dm.sessionScope: "per-room"` 会将每个 Matrix 私信房间隔离到自己的会话键中，同时仍使用普通私信认证和 allowlist 检查。
- 显式的 Matrix 会话绑定仍优先生效，因此已绑定的房间和线程会继续使用其选定的目标会话。
- `threadReplies: "off"` 会将回复保持在顶层，并让入站线程消息继续使用父级会话。
- `threadReplies: "inbound"` 仅当入站消息本身已经在线程中时，才在线程内回复。
- `threadReplies: "always"` 会让房间回复保留在线程中，并以触发消息为根，通过从第一条触发消息开始匹配的线程作用域会话来路由该会话。
- `dm.threadReplies` 仅覆盖私信中的顶层设置。例如，你可以让房间线程彼此隔离，同时让私信保持扁平。
- 入站线程消息会将线程根消息作为额外智能体上下文包含进来。
- Message-tool 发送现在会在目标是同一房间或同一私信用户目标时自动继承当前 Matrix 线程，除非显式提供了 `threadId`。
- 只有当当前会话元数据能证明其是同一 Matrix 账户上的同一私信对端时，才会复用同会话私信用户目标；否则 OpenClaw 会回退到普通的用户作用域路由。
- 当 OpenClaw 发现某个 Matrix 私信房间与同一共享 Matrix 私信会话中的另一个私信房间冲突时，若已启用线程绑定，它会在该房间中发布一次性 `m.notice`，包含 `/focus` 逃生入口和 `dm.sessionScope` 提示。
- Matrix 支持运行时线程绑定。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 以及线程绑定的 `/acp spawn` 现在都可在 Matrix 房间和私信中使用。
- 当 `threadBindings.spawnSubagentSessions=true` 时，在顶层 Matrix 房间/私信中执行 `/focus` 会创建一个新的 Matrix 线程，并将其绑定到目标会话。
- 在现有 Matrix 线程内执行 `/focus` 或 `/acp spawn --thread here`，则会绑定当前线程本身。

## ACP 会话绑定

Matrix 房间、私信和现有 Matrix 线程都可以转换为持久的 ACP 工作区，而无需改变聊天界面。

适合操作员的快速流程：

- 在你想继续使用的 Matrix 私信、房间或现有线程内运行 `/acp spawn codex --bind here`。
- 在顶层 Matrix 私信或房间中，当前私信/房间会继续作为聊天界面，后续消息会路由到新生成的 ACP 会话。
- 在现有 Matrix 线程内，`--bind here` 会将当前线程原地绑定。
- `/new` 和 `/reset` 会原地重置同一个已绑定的 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

说明：

- `--bind here` 不会创建子 Matrix 线程。
- `threadBindings.spawnAcpSessions` 仅在 `/acp spawn --thread auto|here` 时才需要，因为此时 OpenClaw 需要创建或绑定子 Matrix 线程。

### 线程绑定配置

Matrix 会继承来自 `session.threadBindings` 的全局默认值，同时也支持按渠道覆盖：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix 的线程绑定生成标志为选择性启用：

- 设置 `threadBindings.spawnSubagentSessions: true`，可允许顶层 `/focus` 创建并绑定新的 Matrix 线程。
- 设置 `threadBindings.spawnAcpSessions: true`，可允许 `/acp spawn --thread auto|here` 将 ACP 会话绑定到 Matrix 线程。

## 表情回应

Matrix 支持出站表情回应操作、入站表情回应通知和入站 ack 表情回应。

- 出站表情回应工具受 `channels["matrix"].actions.reactions` 控制。
- `react` 会向指定 Matrix 事件添加一个表情回应。
- `reactions` 会列出指定 Matrix 事件当前的表情回应摘要。
- `emoji=""` 会移除机器人账户在该事件上的所有自身表情回应。
- `remove: true` 只会移除机器人账户针对该事件所添加的指定表情回应。

Ack 表情回应使用标准 OpenClaw 解析顺序：

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
- 默认：`own`

当前行为：

- `reactionNotifications: "own"` 会在 `m.reaction` 事件针对机器人所发送的 Matrix 消息时，转发新增的 `m.reaction` 事件。
- `reactionNotifications: "off"` 会禁用表情回应系统事件。
- 表情回应移除仍不会被合成为系统事件，因为 Matrix 会将其作为 redactions，而不是独立的 `m.reaction` 移除事件来呈现。

## 历史上下文

- `channels.matrix.historyLimit` 控制当 Matrix 房间消息触发智能体时，作为 `InboundHistory` 包含的最近房间消息数量。
- 它会回退到 `messages.groupChat.historyLimit`。如果两者都未设置，则实际默认值为 `0`，因此受提及门控的房间消息不会被缓冲。设置为 `0` 可禁用。
- Matrix 房间历史仅限房间。私信仍使用普通会话历史。
- Matrix 房间历史是待处理型的：OpenClaw 会缓冲尚未触发回复的房间消息，然后在提及或其他触发到来时对该窗口进行快照。
- 当前触发消息不会包含在 `InboundHistory` 中；它会作为本轮主入站正文保留。
- 同一 Matrix 事件的重试会复用原始历史快照，而不是向前漂移到更新的房间消息。

## 上下文可见性

Matrix 支持共享的 `contextVisibility` 控制，用于补充房间上下文，例如获取到的回复文本、线程根消息和待处理历史。

- `contextVisibility: "all"` 是默认值。补充上下文会按接收到的内容保留。
- `contextVisibility: "allowlist"` 会将补充上下文过滤为仅保留通过当前房间/用户 allowlist 检查的发送者内容。
- `contextVisibility: "allowlist_quote"` 的行为与 `allowlist` 相同，但仍保留一条显式引用的回复。

此设置影响的是补充上下文的可见性，而不是入站消息本身是否可以触发回复。
触发授权仍由 `groupPolicy`、`groups`、`groupAllowFrom` 和私信策略设置控制。

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

有关提及门控和 allowlist 行为，请参见 [群组](/zh-CN/channels/groups)。

Matrix 私信配对示例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果某个未经批准的 Matrix 用户在获批前持续给你发消息，OpenClaw 会复用同一个待处理配对代码，并可能在短暂冷却后再次发送提醒回复，而不是生成新的代码。

有关共享的私信配对流程和存储布局，请参见 [配对](/zh-CN/channels/pairing)。

## Exec 审批

Matrix 可以作为某个 Matrix 账户的原生审批客户端。原生私信/渠道路由开关仍位于 exec 审批配置下：

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（可选；会回退到 `channels.matrix.dm.allowFrom`）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

审批者必须是 Matrix 用户 ID，例如 `@owner:example.org`。当 `enabled` 未设置或为 `"auto"`，且至少能解析出一个审批者时，Matrix 会自动启用原生审批。Exec 审批会优先使用 `execApprovals.approvers`，并可回退到 `channels.matrix.dm.allowFrom`。插件审批则通过 `channels.matrix.dm.allowFrom` 授权。设置 `enabled: false` 可显式禁用 Matrix 作为原生审批客户端。否则，审批请求会回退到其他已配置的审批路由或审批回退策略。

Matrix 原生路由现在同时支持两种审批类型：

- `channels.matrix.execApprovals.*` 控制 Matrix 审批提示的原生私信/渠道扇出模式。
- Exec 审批使用来自 `execApprovals.approvers` 或 `channels.matrix.dm.allowFrom` 的 exec 审批者集合。
- 插件审批使用来自 `channels.matrix.dm.allowFrom` 的 Matrix 私信 allowlist。
- Matrix 表情回应快捷方式和消息更新同时适用于 exec 和插件审批。

投递规则：

- `target: "dm"` 会将审批提示发送到审批者私信
- `target: "channel"` 会将提示发送回原始 Matrix 房间或私信
- `target: "both"` 会同时发送到审批者私信和原始 Matrix 房间或私信

Matrix 审批提示会在主要审批消息上植入表情回应快捷方式：

- `✅` = 允许一次
- `❌` = 拒绝
- `♾️` = 当有效 exec 策略允许该决定时，始终允许

审批者可以对该消息添加表情回应，也可以使用回退 slash commands：`/approve <id> allow-once`、`/approve <id> allow-always` 或 `/approve <id> deny`。

只有已解析的审批者可以批准或拒绝。对于 exec 审批，渠道投递会包含命令文本，因此仅应在受信任房间中启用 `channel` 或 `both`。

Matrix 审批提示会复用共享核心审批规划器。Matrix 专属的原生界面负责处理房间/私信路由、表情回应以及针对 exec 和插件审批的消息发送/更新/删除行为。

按账户覆盖：

- `channels.matrix.accounts.<account>.execApprovals`

相关文档：[Exec 审批](/zh-CN/tools/exec-approvals)

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

顶层 `channels.matrix` 值会作为命名账户的默认值，除非账户自行覆盖。
你可以使用 `groups.<room>.account`（或旧版 `rooms.<room>.account`）将继承的房间条目限定到某个 Matrix 账户。
未设置 `account` 的条目会在所有 Matrix 账户之间共享，而带有 `account: "default"` 的条目在默认账户直接配置于顶层 `channels.matrix.*` 时仍然有效。
仅有部分共享认证默认值本身不会创建单独的隐式默认账户。只有当该默认账户具有新的认证信息（`homeserver` 加 `accessToken`，或 `homeserver` 加 `userId` 和 `password`）时，OpenClaw 才会合成顶层 `default` 账户；如果之后缓存凭证满足认证要求，命名账户仍可通过 `homeserver` 加 `userId` 保持可发现。
如果 Matrix 已经恰好有一个命名账户，或 `defaultAccount` 指向现有命名账户键，则单账户到多账户的修复/设置提升会保留该账户，而不是创建新的 `accounts.default` 条目。只有 Matrix 认证/bootstrap 键会移动到该提升后的账户中；共享投递策略键仍保留在顶层。
当你希望 OpenClaw 在隐式路由、探测和 CLI 操作中优先使用某个命名 Matrix 账户时，请设置 `defaultAccount`。
如果你配置了多个命名账户，请设置 `defaultAccount`，或为依赖隐式账户选择的 CLI 命令传入 `--account <id>`。
当你想为单条命令覆盖该隐式选择时，请向 `openclaw matrix verify ...` 和 `openclaw matrix devices ...` 传入 `--account <id>`。

## 私有/LAN homeserver

默认情况下，OpenClaw 会阻止连接私有/内部 Matrix homeserver，以防范 SSRF，除非你为每个账户显式选择启用。

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

此选择启用仅允许受信任的私有/内部目标。公开的明文 homeserver，例如
`http://matrix.example.org:8008`，仍会被阻止。尽可能优先使用 `https://`。

## 为 Matrix 流量配置代理

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

命名账户可使用 `channels.matrix.accounts.<id>.proxy` 覆盖顶层默认值。
OpenClaw 会对运行时 Matrix 流量和账户状态探测使用相同的代理设置。

## 目标解析

无论 OpenClaw 在何处要求你提供房间或用户目标，Matrix 都接受以下目标形式：

- 用户：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房间：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 别名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

实时目录查找使用已登录的 Matrix 账户：

- 用户查找会查询该 homeserver 上的 Matrix 用户目录。
- 房间查找会直接接受显式房间 ID 和别名，然后回退到搜索该账户已加入房间的名称。
- 已加入房间名称查找属于尽力而为。如果无法将房间名称解析为 ID 或别名，它会在运行时 allowlist 解析中被忽略。

## 配置参考

- `enabled`：启用或禁用该渠道。
- `name`：账户的可选标签。
- `defaultAccount`：配置了多个 Matrix 账户时的首选账户 ID。
- `homeserver`：homeserver URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允许该 Matrix 账户连接到私有/内部 homeserver。当 homeserver 解析到 `localhost`、LAN/Tailscale IP 或类似 `matrix-synapse` 的内部主机时，请启用此项。
- `proxy`：Matrix 流量使用的可选 HTTP(S) 代理 URL。命名账户可以用自己的 `proxy` 覆盖顶层默认值。
- `userId`：完整 Matrix 用户 ID，例如 `@bot:example.org`。
- `accessToken`：基于 token 的认证所用 access token。`channels.matrix.accessToken` 和 `channels.matrix.accounts.<id>.accessToken` 在 env/file/exec providers 中均支持纯文本值和 SecretRef 值。请参见 [Secrets Management](/zh-CN/gateway/secrets)。
- `password`：基于 password 登录所用密码。支持纯文本值和 SecretRef 值。
- `deviceId`：显式 Matrix 设备 ID。
- `deviceName`：password 登录时的设备显示名称。
- `avatarUrl`：用于 profile sync 和 `set-profile` 更新的已存储自身头像 URL。
- `initialSyncLimit`：启动同步事件上限。
- `encryption`：启用 E2EE。
- `allowlistOnly`：对私信和房间强制使用仅 allowlist 行为。
- `allowBots`：允许来自其他已配置 OpenClaw Matrix 账户的消息（`true` 或 `"mentions"`）。
- `groupPolicy`：`open`、`allowlist` 或 `disabled`。
- `contextVisibility`：补充房间上下文可见性模式（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`：房间流量的用户 ID allowlist。
- `groupAllowFrom` 条目应为完整 Matrix 用户 ID。未解析名称会在运行时被忽略。
- `historyLimit`：作为群组历史上下文包含的最大房间消息数。会回退到 `messages.groupChat.historyLimit`；如果两者都未设置，则实际默认值为 `0`。设置 `0` 可禁用。
- `replyToMode`：`off`、`first`、`all` 或 `batched`。
- `markdown`：出站 Matrix 文本的可选 Markdown 渲染配置。
- `streaming`：`off`（默认）、`partial`、`quiet`、`true` 或 `false`。`partial` 和 `true` 会使用普通 Matrix 文本消息启用“先预览”的草稿更新。`quiet` 会为自托管 push-rule 设置使用不通知的预览通知。
- `blockStreaming`：`true` 会在草稿预览流式传输启用时，为已完成的 assistant blocks 启用单独进度消息。
- `threadReplies`：`off`、`inbound` 或 `always`。
- `threadBindings`：用于线程绑定会话路由和生命周期的按渠道覆盖。
- `startupVerification`：启动时自动自验证请求模式（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`：重试自动启动验证请求前的冷却时长。
- `textChunkLimit`：出站消息分块大小。
- `chunkMode`：`length` 或 `newline`。
- `responsePrefix`：出站回复的可选消息前缀。
- `ackReaction`：此渠道/账户的可选 ack 表情回应覆盖值。
- `ackReactionScope`：可选的 ack 表情回应作用域覆盖（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`：入站表情回应通知模式（`own`、`off`）。
- `mediaMaxMb`：Matrix 媒体处理的媒体大小上限（MB）。它适用于出站发送和入站媒体处理。
- `autoJoin`：邀请自动加入策略（`always`、`allowlist`、`off`）。默认：`off`。它适用于所有 Matrix 邀请，包括私信式邀请，而不仅仅是房间/群组邀请。OpenClaw 会在邀请发生时做出该决定，此时它尚无法可靠地将加入的房间归类为私信或群组。
- `autoJoinAllowlist`：当 `autoJoin` 为 `allowlist` 时允许的房间/别名。别名条目会在处理邀请时解析为房间 ID；OpenClaw 不信任被邀请房间自行声明的别名状态。
- `dm`：私信策略块（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.policy`：控制 OpenClaw 加入房间并将其归类为私信后的私信访问。它不会改变邀请是否自动加入。
- `dm.allowFrom` 条目应为完整 Matrix 用户 ID，除非你已通过实时目录查找将其解析。
- `dm.sessionScope`：`per-user`（默认）或 `per-room`。如果你希望同一对端的每个 Matrix 私信房间都保持独立上下文，请使用 `per-room`。
- `dm.threadReplies`：仅用于私信的线程策略覆盖（`off`、`inbound`、`always`）。它会覆盖顶层 `threadReplies` 设置，对私信中的回复位置和会话隔离同时生效。
- `execApprovals`：Matrix 原生 exec 审批投递（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`：允许审批 exec 请求的 Matrix 用户 ID。当 `dm.allowFrom` 已能标识审批者时，此项可选。
- `execApprovals.target`：`dm | channel | both`（默认：`dm`）。
- `accounts`：命名的按账户覆盖值。顶层 `channels.matrix` 值会作为这些条目的默认值。
- `groups`：按房间划分的策略映射。优先使用房间 ID 或别名；未解析的房间名会在运行时被忽略。解析后，会话/群组标识使用稳定的房间 ID，而人类可读标签仍来自房间名。
- `groups.<room>.account`：在多账户设置中，将一个继承的房间条目限制到特定 Matrix 账户。
- `groups.<room>.allowBots`：针对已配置机器人发送者的房间级覆盖（`true` 或 `"mentions"`）。
- `groups.<room>.users`：按房间划分的发送者 allowlist。
- `groups.<room>.tools`：按房间划分的工具允许/拒绝覆盖。
- `groups.<room>.autoReply`：房间级提及门控覆盖。`true` 会禁用该房间的提及要求；`false` 会强制重新启用。
- `groups.<room>.skills`：可选的房间级 Skills 过滤器。
- `groups.<room>.systemPrompt`：可选的房间级系统提示片段。
- `rooms`：`groups` 的旧版别名。
- `actions`：按操作划分的工具门控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 相关内容

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信认证与配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为与提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型与加固
