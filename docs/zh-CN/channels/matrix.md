---
read_when:
    - 在 OpenClaw 中设置 Matrix
    - 配置 Matrix 端到端加密（E2EE）和验证
summary: Matrix 支持状态、设置和配置示例
title: Matrix
x-i18n:
    generated_at: "2026-04-14T21:03:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 631f6fdcfebc23136c1a66b04851a25c047535d13cceba5650b8b421bc3afcf8
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix 是 OpenClaw 的一个内置渠道插件。
它使用官方的 `matrix-js-sdk`，并支持私信、房间、线程、媒体、回应、投票、位置和端到端加密（E2EE）。

## 内置插件

Matrix 在当前的 OpenClaw 版本中作为内置插件提供，因此常规打包构建不需要单独安装。

如果你使用的是较旧版本，或者是不包含 Matrix 的自定义安装，请手动安装：

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
   - 当前打包的 OpenClaw 版本已内置该插件。
   - 较旧版本或自定义安装可使用上述命令手动添加。
2. 在你的 homeserver 上创建一个 Matrix 账号。
3. 使用以下任一方式配置 `channels.matrix`：
   - `homeserver` + `accessToken`，或
   - `homeserver` + `userId` + `password`。
4. 重启 Gateway 网关。
5. 与机器人开始一个私信，或邀请它加入房间。
   - 只有当 `channels.matrix.autoJoin` 允许时，新的 Matrix 邀请才会生效。

交互式设置路径：

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix 向导会询问：

- homeserver URL
- 认证方式：访问令牌或密码
- 用户 ID（仅密码认证）
- 可选设备名称
- 是否启用 E2EE
- 是否配置房间访问和邀请自动加入

向导的关键行为：

- 如果 Matrix 认证环境变量已存在，且该账号的认证信息尚未保存在配置中，向导会提供环境变量快捷方式，以便将认证信息保存在环境变量中。
- 账号名称会规范化为账号 ID。例如，`Ops Bot` 会变成 `ops-bot`。
- 私信允许列表条目可直接接受 `@user:server`；显示名称仅在实时目录查找能找到唯一精确匹配时有效。
- 房间允许列表条目可直接接受房间 ID 和别名。优先使用 `!room:server` 或 `#alias:server`；无法解析的名称会在运行时被允许列表解析忽略。
- 在邀请自动加入的允许列表模式下，仅使用稳定的邀请目标：`!roomId:server`、`#alias:server` 或 `*`。纯房间名称会被拒绝。
- 若要在保存前解析房间名称，请使用 `openclaw channels resolve --channel matrix "Project Room"`。

<Warning>
`channels.matrix.autoJoin` 默认值为 `off`。

如果你不设置它，机器人将不会加入被邀请的房间或新的私信式邀请，因此除非你先手动加入，否则它不会出现在新的群组或被邀请的私信中。

设置 `autoJoin: "allowlist"` 并结合 `autoJoinAllowlist`，可限制它接受哪些邀请；或者设置 `autoJoin: "always"`，让它加入所有邀请。

在 `allowlist` 模式下，`autoJoinAllowlist` 仅接受 `!roomId:server`、`#alias:server` 或 `*`。
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

基于令牌的最小设置：

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

基于密码的设置（登录后会缓存令牌）：

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
当该目录中存在缓存凭证时，即使当前认证信息未直接在配置中设置，OpenClaw 仍会在设置、Doctor 和渠道状态发现中将 Matrix 视为已配置。

对应的环境变量（当未设置相应配置键时使用）：

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

对于规范化账号 ID `ops-bot`，请使用：

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix 会对账号 ID 中的标点符号进行转义，以避免作用域环境变量冲突。
例如，`-` 会变为 `_X2D_`，因此 `ops-prod` 会映射为 `MATRIX_OPS_X2D_PROD_*`。

只有当这些认证环境变量已经存在，且所选账号的 Matrix 认证信息尚未保存在配置中时，交互式向导才会提供环境变量快捷方式。

## 配置示例

这是一个实用的基础配置示例，启用了私信配对、房间允许列表和 E2EE：

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

`autoJoin` 适用于所有 Matrix 邀请，包括私信式邀请。OpenClaw 无法在邀请时可靠地将一个被邀请的房间分类为私信或群组，因此所有邀请都会先经过 `autoJoin`。`dm.policy` 会在机器人加入后、且房间被分类为私信之后才生效。

## 流式预览

Matrix 回复流式传输为可选启用。

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

- `streaming: "off"` 是默认值。OpenClaw 会等待最终回复并发送一次。
- `streaming: "partial"` 会为当前智能体消息块创建一条可编辑的预览消息，使用普通 Matrix 文本消息。这会保留 Matrix 传统的“先预览后完成”通知行为，因此标准客户端可能会针对第一次流式预览文本而不是最终完成的消息块发出通知。
- `streaming: "quiet"` 会为当前智能体消息块创建一条可编辑的静默预览通知。仅当你也为最终定稿的预览编辑配置了接收方推送规则时，才使用此选项。
- `blockStreaming: true` 会启用单独的 Matrix 进度消息。启用预览流式传输后，Matrix 会为当前消息块保留实时草稿，并将已完成的消息块保留为单独消息。
- 当预览流式传输开启且 `blockStreaming` 为关闭时，Matrix 会原地编辑实时草稿，并在消息块或整轮完成时将同一事件定稿。
- 如果预览内容已无法容纳在单个 Matrix 事件中，OpenClaw 会停止预览流式传输并回退为普通最终投递。
- 媒体回复仍会正常发送附件。如果一个过时的预览无法再被安全复用，OpenClaw 会在发送最终媒体回复前将其清除。
- 预览编辑会额外消耗 Matrix API 调用。如果你希望采用最保守的速率限制行为，请保持关闭流式传输。

`blockStreaming` 本身不会启用草稿预览。
使用 `streaming: "partial"` 或 `streaming: "quiet"` 来启用预览编辑；如果你还希望已完成的智能体消息块保留为单独的进度消息，再额外设置 `blockStreaming: true`。

如果你需要标准 Matrix 通知而不想配置自定义推送规则，请使用 `streaming: "partial"` 以获得先预览的行为，或保持 `streaming` 关闭以仅投递最终结果。在 `streaming: "off"` 时：

- `blockStreaming: true` 会将每个已完成的消息块作为普通会通知的 Matrix 消息发送。
- `blockStreaming: false` 只会将最终完整回复作为普通会通知的 Matrix 消息发送。

### 自托管静默定稿预览的推送规则

如果你运行自己的 Matrix 基础设施，并希望静默预览仅在消息块或最终回复完成时才通知，请将 `streaming: "quiet"`，并为定稿预览编辑添加按用户配置的推送规则。

这通常是接收方用户级别的设置，而不是 homeserver 全局配置变更：

开始前的快速对应关系：

- recipient user = 应接收通知的人
- bot user = 发送回复的 OpenClaw Matrix 账号
- 对下面的 API 调用使用接收方用户的访问令牌
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

2. 确保接收方账号已经能收到普通 Matrix 推送通知。静默预览规则只有在该用户已有可用的推送器/设备时才有效。

3. 获取接收方用户的访问令牌。
   - 使用接收方用户的令牌，而不是机器人的令牌。
   - 复用现有客户端会话令牌通常最简单。
   - 如果你需要签发一个新的令牌，可以通过标准 Matrix Client-Server API 登录：

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

4. 验证接收方账号是否已经有推送器：

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

如果这里没有返回活动的推送器/设备，请先修复普通 Matrix 通知，再添加下面的 OpenClaw 规则。

OpenClaw 会使用以下内容标记已定稿的纯文本预览编辑：

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. 为每个应接收这些通知的接收方账号创建一个覆盖型推送规则：

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

运行命令前请替换以下值：

- `https://matrix.example.org`：你的 homeserver 基础 URL
- `$USER_ACCESS_TOKEN`：接收方用户的访问令牌
- `openclaw-finalized-preview-botname`：对此接收方用户而言、该机器人的唯一规则 ID
- `@bot:example.org`：你的 OpenClaw Matrix 机器人 MXID，不是接收方用户的 MXID

多机器人设置的重要说明：

- 推送规则以 `ruleId` 为键。对同一规则 ID 重复执行 `PUT` 会更新该条规则。
- 如果同一个接收方用户需要为多个 OpenClaw Matrix 机器人账号接收通知，请为每个机器人创建一条规则，并为每个 `sender` 匹配使用唯一的规则 ID。
- 一个简单的命名模式是 `openclaw-finalized-preview-<botname>`，例如 `openclaw-finalized-preview-ops` 或 `openclaw-finalized-preview-support`。

该规则会根据事件发送者进行匹配：

- 使用接收方用户的令牌进行认证
- 将 `sender` 与 OpenClaw 机器人的 MXID 进行匹配

6. 验证规则是否存在：

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. 测试一次流式回复。在静默模式下，房间中应显示一个静默草稿预览，并且当消息块或整轮结束时，最终的原地编辑应触发一次通知。

如果你之后需要移除该规则，请使用接收方用户的令牌删除同一个规则 ID：

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

说明：

- 使用接收方用户的访问令牌创建该规则，而不是机器人的令牌。
- 新建的用户定义 `override` 规则会插入到默认抑制规则之前，因此不需要额外的排序参数。
- 这只影响 OpenClaw 能够安全原地定稿的纯文本预览编辑。媒体回退和过时预览回退仍使用普通 Matrix 投递方式。
- 如果 `GET /_matrix/client/v3/pushers` 显示没有推送器，则说明该用户在这个账号/设备上尚未配置可用的 Matrix 推送投递。

#### Synapse

对于 Synapse，通常只需完成上述设置即可：

- OpenClaw 定稿预览通知不需要特殊的 `homeserver.yaml` 配置修改。
- 如果你的 Synapse 部署已经能发送普通 Matrix 推送通知，那么上面的用户令牌 + `pushrules` 调用就是主要设置步骤。
- 如果你在反向代理或 worker 后面运行 Synapse，请确保 `/_matrix/client/.../pushrules/` 能正确转发到 Synapse。
- 如果你运行 Synapse workers，请确保推送器状态正常。推送投递由主进程或 `synapse.app.pusher` / 已配置的 pusher workers 处理。

#### Tuwunel

对于 Tuwunel，请使用与上面相同的设置流程和推送规则 API 调用：

- 对于定稿预览标记本身，不需要 Tuwunel 特定配置。
- 如果普通 Matrix 通知对该用户已经正常工作，那么上面的用户令牌 + `pushrules` 调用就是主要设置步骤。
- 如果通知在用户于另一台设备上活跃时似乎消失了，请检查是否启用了 `suppress_push_when_active`。Tuwunel 在 2025 年 9 月 12 日发布的 Tuwunel 1.4.2 中加入了此选项，它可能会在一台设备活跃时有意抑制向其他设备推送通知。

## 机器人到机器人的房间

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

- `allowBots: true` 会在允许的房间和私信中接受来自其他已配置 Matrix 机器人账号的消息。
- `allowBots: "mentions"` 仅在这些消息在房间中明确提及此机器人时才接受。私信仍然允许。
- `groups.<room>.allowBots` 会覆盖单个房间的账号级设置。
- OpenClaw 仍会忽略来自同一 Matrix 用户 ID 的消息，以避免自回复循环。
- Matrix 这里不提供原生机器人标志；OpenClaw 将“由机器人撰写”视为“由此 OpenClaw Gateway 网关上另一个已配置 Matrix 账号发送”。

在共享房间中启用机器人到机器人流量时，请使用严格的房间允许列表和提及要求。

## 加密和验证

在加密的（E2EE）房间中，出站图片事件使用 `thumbnail_file`，因此图片预览会和完整附件一起加密。未加密房间仍使用普通的 `thumbnail_url`。无需任何配置——插件会自动检测 E2EE 状态。

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

引导跨签名和验证状态：

```bash
openclaw matrix verify bootstrap
```

详细引导诊断：

```bash
openclaw matrix verify bootstrap --verbose
```

在引导前强制执行一次全新的跨签名身份重置：

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

删除当前服务器备份并创建一个全新的备份基线。如果存储的备份密钥无法被干净加载，此重置还可以重新创建秘密存储，以便未来冷启动时能够加载新的备份密钥：

```bash
openclaw matrix verify backup reset --yes
```

默认情况下，所有 `verify` 命令都保持简洁输出（包括安静的内部 SDK 日志），只有在使用 `--verbose` 时才显示详细诊断。
在编写脚本时，请使用 `--json` 获取完整的机器可读输出。

在多账号设置中，Matrix CLI 命令会使用隐式的 Matrix 默认账号，除非你传入 `--account <id>`。
如果你配置了多个命名账号，请先设置 `channels.matrix.defaultAccount`，否则这些隐式 CLI 操作会停止并要求你显式选择一个账号。
当你希望验证或设备操作显式针对某个命名账号时，请使用 `--account`：

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

当命名账号的加密被禁用或不可用时，Matrix 警告和验证错误会指向该账号的配置键，例如 `channels.matrix.accounts.assistant.encryption`。

### “已验证”是什么意思

只有当这个 Matrix 设备被你自己的跨签名身份验证后，OpenClaw 才会将其视为已验证。
在实际中，`openclaw matrix verify status --verbose` 会显示三个信任信号：

- `Locally trusted`：此设备仅被当前客户端信任
- `Cross-signing verified`：SDK 报告该设备已通过跨签名验证
- `Signed by owner`：此设备已由你自己的自签名密钥签名

只有在存在跨签名验证或所有者签名时，`Verified by owner` 才会变为 `yes`。
仅有本地信任不足以让 OpenClaw 将该设备视为完全已验证。

### bootstrap 的作用

`openclaw matrix verify bootstrap` 是加密 Matrix 账号的修复和设置命令。
它会按顺序执行以下所有操作：

- 引导秘密存储，尽可能复用现有恢复密钥
- 引导跨签名并上传缺失的公开跨签名密钥
- 尝试标记并交叉签名当前设备
- 如果服务器端房间密钥备份尚不存在，则创建一个新的备份

如果 homeserver 需要交互式认证才能上传跨签名密钥，OpenClaw 会先尝试无认证上传，然后尝试 `m.login.dummy`，如果配置了 `channels.matrix.password`，再尝试 `m.login.password`。

只有在你明确想要丢弃当前跨签名身份并创建新身份时，才使用 `--force-reset-cross-signing`。

如果你明确希望丢弃当前房间密钥备份，并为未来消息建立新的备份基线，请使用 `openclaw matrix verify backup reset --yes`。
只有当你接受无法恢复的旧加密历史将继续不可用，并且 OpenClaw 可能会在当前备份密钥无法安全加载时重新创建秘密存储时，才这样做。

### 全新的备份基线

如果你想保证未来的加密消息继续正常工作，并接受失去无法恢复的旧历史记录，请按顺序运行以下命令：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

如果你想显式针对某个命名 Matrix 账号，请在每个命令后加上 `--account <id>`。

### 启动行为

当 `encryption: true` 时，Matrix 默认将 `startupVerification` 设置为 `"if-unverified"`。
在启动时，如果此设备仍未验证，Matrix 会请求在另一个 Matrix 客户端中进行自验证；如果已有请求待处理，则跳过重复请求；并在重启后重试前应用本地冷却时间。
默认情况下，失败的请求尝试会比成功创建请求后的重试更快。
设置 `startupVerification: "off"` 可禁用自动启动请求；如果你希望更短或更长的重试窗口，可调整 `startupVerificationCooldownHours`。

启动时还会自动执行一次保守的加密引导检查。
该检查会优先尝试复用当前的秘密存储和跨签名身份，并且除非你运行显式的 bootstrap 修复流程，否则不会重置跨签名。

如果启动时发现引导状态损坏，且配置了 `channels.matrix.password`，OpenClaw 可以尝试更严格的修复路径。
如果当前设备已经由所有者签名，OpenClaw 会保留该身份，而不会自动重置它。

有关完整升级流程、限制、恢复命令和常见迁移消息，请参阅 [Matrix migration](/zh-CN/install/migrating-matrix)。

### 验证通知

Matrix 会将验证生命周期通知直接作为 `m.notice` 消息发布到严格的私信验证房间中。
包括：

- 验证请求通知
- 验证就绪通知（包含明确的“通过表情符号验证”指引）
- 验证开始和完成通知
- 可用时的 SAS 详情（表情符号和十进制数字）

来自其他 Matrix 客户端的传入验证请求会被 OpenClaw 跟踪并自动接受。
对于自验证流程，当表情符号验证可用时，OpenClaw 也会自动启动 SAS 流程并确认自己这一侧。
对于来自其他 Matrix 用户/设备的验证请求，OpenClaw 会自动接受请求，然后等待 SAS 流程正常继续。
你仍然需要在你的 Matrix 客户端中比较表情符号或十进制 SAS，并在那里确认“它们匹配”，以完成验证。

OpenClaw 不会盲目自动接受由自身发起的重复流程。当已有自验证请求待处理时，启动过程会跳过创建新的请求。

验证协议/系统通知不会转发到智能体聊天管线，因此不会产生 `NO_REPLY`。

### 设备清理

由 OpenClaw 管理的旧 Matrix 设备可能会在账号中不断累积，使加密房间的信任状态更难判断。
可使用以下命令列出它们：

```bash
openclaw matrix devices list
```

可使用以下命令移除过期的 OpenClaw 管理设备：

```bash
openclaw matrix devices prune-stale
```

### 加密存储

Matrix E2EE 在 Node 中使用官方 `matrix-js-sdk` 的 Rust 加密路径，并使用 `fake-indexeddb` 作为 IndexedDB 垫片。加密状态会持久化到快照文件（`crypto-idb-snapshot.json`）并在启动时恢复。该快照文件属于敏感运行时状态，使用严格的文件权限存储。

加密运行时状态位于按账号、按用户令牌哈希划分的根目录下：
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`。
该目录包含同步存储（`bot-storage.json`）、加密存储（`crypto/`）、恢复密钥文件（`recovery-key.json`）、IndexedDB 快照（`crypto-idb-snapshot.json`）、线程绑定（`thread-bindings.json`）以及启动验证状态（`startup-verification.json`）。
当令牌发生变化但账号身份保持不变时，OpenClaw 会为该账号 / homeserver / 用户元组复用最佳现有根目录，因此先前的同步状态、加密状态、线程绑定和启动验证状态都会继续可见。

## 资料管理

使用以下命令更新所选账号的 Matrix 自身资料：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

如果你想显式针对某个命名 Matrix 账号，请添加 `--account <id>`。

Matrix 可直接接受 `mxc://` 头像 URL。当你传入 `http://` 或 `https://` 头像 URL 时，OpenClaw 会先将其上传到 Matrix，然后把解析后的 `mxc://` URL 回写到 `channels.matrix.avatarUrl`（或所选账号的覆盖配置）中。

## 线程

Matrix 同时支持用于自动回复和消息工具发送的原生 Matrix 线程。

- `dm.sessionScope: "per-user"`（默认）会保持 Matrix 私信路由以发送者为范围，因此多个私信房间在解析为同一对端时可以共享一个会话。
- `dm.sessionScope: "per-room"` 会将每个 Matrix 私信房间隔离为各自独立的会话键，同时仍使用正常的私信认证和允许列表检查。
- 显式的 Matrix 会话绑定仍然具有更高优先级，因此已绑定的房间和线程会继续使用其选定的目标会话。
- `threadReplies: "off"` 会将回复保持在顶层，并让传入的线程消息继续使用父会话。
- `threadReplies: "inbound"` 仅当传入消息本身已经位于某个线程中时，才在线程内回复。
- `threadReplies: "always"` 会将房间回复保持在线程中，该线程以触发消息为根，并从第一条触发消息开始，通过匹配的线程作用域会话来路由该对话。
- `dm.threadReplies` 仅覆盖私信的顶层设置。例如，你可以让房间线程彼此隔离，同时让私信保持扁平。
- 传入的线程消息会将线程根消息作为额外的智能体上下文包含进来。
- 消息工具发送在目标为同一房间或同一私信用户目标时，会自动继承当前 Matrix 线程，除非显式提供了 `threadId`。
- 基于同一会话的私信用户目标复用，仅在当前会话元数据能够证明它是同一 Matrix 账号下的同一私信对端时才会生效；否则 OpenClaw 会回退为正常的按用户作用域路由。
- 当 OpenClaw 发现某个 Matrix 私信房间与另一个私信房间在同一个共享 Matrix 私信会话上发生冲突时，如果启用了线程绑定并且存在 `dm.sessionScope` 提示，它会在该房间中发布一次性的 `m.notice`，其中包含 `/focus` 逃生口。
- Matrix 支持运行时线程绑定。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 以及线程绑定的 `/acp spawn` 都可在 Matrix 房间和私信中使用。
- 顶层 Matrix 房间 / 私信中的 `/focus` 会在 `threadBindings.spawnSubagentSessions=true` 时创建一个新的 Matrix 线程，并将其绑定到目标会话。
- 在现有 Matrix 线程内运行 `/focus` 或 `/acp spawn --thread here` 时，则会改为绑定当前线程。

## ACP 会话绑定

Matrix 房间、私信以及现有 Matrix 线程都可以转为持久化 ACP 工作区，而无需更改聊天界面。

面向操作员的快速流程：

- 在你希望继续使用的 Matrix 私信、房间或现有线程中运行 `/acp spawn codex --bind here`。
- 在顶层 Matrix 私信或房间中，当前私信 / 房间会继续作为聊天界面，后续消息会路由到新创建的 ACP 会话。
- 在现有 Matrix 线程中，`--bind here` 会将当前线程原地绑定。
- `/new` 和 `/reset` 会原地重置同一个已绑定 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

说明：

- `--bind here` 不会创建子 Matrix 线程。
- 只有在 `/acp spawn --thread auto|here` 这种情况下，OpenClaw 需要创建或绑定子 Matrix 线程时，才需要 `threadBindings.spawnAcpSessions`。

### 线程绑定配置

Matrix 会继承来自 `session.threadBindings` 的全局默认值，同时也支持每个渠道的覆盖设置：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix 线程绑定的 spawn 标志为可选启用：

- 设置 `threadBindings.spawnSubagentSessions: true` 以允许顶层 `/focus` 创建并绑定新的 Matrix 线程。
- 设置 `threadBindings.spawnAcpSessions: true` 以允许 `/acp spawn --thread auto|here` 将 ACP 会话绑定到 Matrix 线程。

## 回应

Matrix 支持出站回应操作、入站回应通知，以及入站确认回应。

- 出站回应工具受 `channels["matrix"].actions.reactions` 控制。
- `react` 会向特定 Matrix 事件添加一个回应。
- `reactions` 会列出特定 Matrix 事件当前的回应汇总。
- `emoji=""` 会移除机器人账号在该事件上的所有自身回应。
- `remove: true` 仅移除机器人账号的指定表情回应。

确认回应使用 OpenClaw 的标准解析顺序：

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

行为：

- `reactionNotifications: "own"` 会在 `m.reaction` 事件目标是由机器人撰写的 Matrix 消息时，转发新增的 `m.reaction` 事件。
- `reactionNotifications: "off"` 会禁用回应系统事件。
- 回应移除不会被合成为系统事件，因为 Matrix 将其表现为 redaction，而不是独立的 `m.reaction` 移除事件。

## 历史上下文

- `channels.matrix.historyLimit` 控制当 Matrix 房间消息触发智能体时，作为 `InboundHistory` 包含的最近房间消息数量。它会回退到 `messages.groupChat.historyLimit`；如果两者都未设置，则生效默认值为 `0`。设置为 `0` 可禁用。
- Matrix 房间历史仅限房间本身。私信仍使用普通会话历史。
- Matrix 房间历史仅针对待处理消息：OpenClaw 会缓冲尚未触发回复的房间消息，然后在提及或其他触发条件到来时对该窗口创建快照。
- 当前触发消息不会被包含在 `InboundHistory` 中；它会保留在该轮主入站消息体中。
- 对同一 Matrix 事件的重试会复用原始历史快照，而不是漂移到更新的房间消息。

## 上下文可见性

Matrix 支持共享的 `contextVisibility` 控制，用于补充房间上下文，例如获取到的回复文本、线程根消息以及待处理历史。

- `contextVisibility: "all"` 是默认值。补充上下文会按接收到的内容保留。
- `contextVisibility: "allowlist"` 会将补充上下文过滤为仅包含通过当前房间 / 用户允许列表检查的发送者。
- `contextVisibility: "allowlist_quote"` 的行为类似 `allowlist`，但仍会保留一条显式引用回复。

该设置影响的是补充上下文的可见性，而不是入站消息本身是否可以触发回复。
触发授权仍由 `groupPolicy`、`groups`、`groupAllowFrom` 以及私信策略设置决定。

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

Matrix 私信的配对示例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果某个尚未批准的 Matrix 用户在获批前持续给你发消息，OpenClaw 会复用同一个待处理配对码，并且在短暂冷却后可能会再次发送提醒回复，而不是生成新的配对码。

有关共享的私信配对流程和存储布局，请参阅 [Pairing](/zh-CN/channels/pairing)。

## 直连房间修复

如果私信状态不同步，OpenClaw 可能会留下过期的 `m.direct` 映射，使其指向旧的单人房间而不是当前活跃私信。可使用以下命令检查某个对端的当前映射：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

使用以下命令修复它：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修复流程会：

- 优先选择已在 `m.direct` 中映射的严格 1:1 私信
- 否则回退到当前已加入、且与该用户对应的任意严格 1:1 私信
- 如果不存在健康的私信，则创建一个新的直连房间并重写 `m.direct`

修复流程不会自动删除旧房间。它只会选择健康的私信并更新映射，以便新的 Matrix 发送、验证通知以及其他私信流程重新指向正确的房间。

## Exec 审批

Matrix 可以作为某个 Matrix 账号的原生审批客户端。原生私信 / 渠道路由控制项仍位于 exec 审批配置下：

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（可选；会回退到 `channels.matrix.dm.allowFrom`）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

审批人必须是 Matrix 用户 ID，例如 `@owner:example.org`。当 `enabled` 未设置或为 `"auto"`，且至少能解析出一个审批人时，Matrix 会自动启用原生审批。Exec 审批优先使用 `execApprovals.approvers`，也可以回退到 `channels.matrix.dm.allowFrom`。插件审批通过 `channels.matrix.dm.allowFrom` 授权。将 `enabled: false` 设为显式禁用 Matrix 作为原生审批客户端。否则，审批请求会回退到其他已配置的审批路由或审批回退策略。

Matrix 原生路由同时支持两类审批：

- `channels.matrix.execApprovals.*` 控制 Matrix 审批提示的原生私信 / 渠道扇出模式。
- Exec 审批使用来自 `execApprovals.approvers` 或 `channels.matrix.dm.allowFrom` 的 exec 审批人集合。
- 插件审批使用 `channels.matrix.dm.allowFrom` 中的 Matrix 私信允许列表。
- Matrix 回应快捷方式和消息更新同时适用于 exec 审批和插件审批。

投递规则：

- `target: "dm"` 会将审批提示发送到审批人的私信
- `target: "channel"` 会将提示发回原始 Matrix 房间或私信
- `target: "both"` 会同时发送到审批人的私信以及原始 Matrix 房间或私信

Matrix 审批提示会在主审批消息上预置回应快捷方式：

- `✅` = 允许一次
- `❌` = 拒绝
- `♾️` = 始终允许，前提是该决策受到当前生效 exec 策略允许

审批人可以对该消息添加回应，也可以使用回退斜杠命令：`/approve <id> allow-once`、`/approve <id> allow-always` 或 `/approve <id> deny`。

只有已解析的审批人才能批准或拒绝。对于 exec 审批，渠道投递会包含命令文本，因此仅应在受信任房间中启用 `channel` 或 `both`。

按账号覆盖：

- `channels.matrix.accounts.<account>.execApprovals`

相关文档：[Exec approvals](/zh-CN/tools/exec-approvals)

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

顶层 `channels.matrix` 值会作为命名账号的默认值，除非某个账号进行了覆盖。
你可以使用 `groups.<room>.account` 将继承的房间条目限定到某一个 Matrix 账号。
未设置 `account` 的条目会在所有 Matrix 账号之间共享，而设置了 `account: "default"` 的条目在默认账号直接配置于顶层 `channels.matrix.*` 时仍然有效。
部分共享认证默认值本身不会创建单独的隐式默认账号。只有当该默认账号具备新的认证信息（`homeserver` + `accessToken`，或 `homeserver` + `userId` 和 `password`）时，OpenClaw 才会合成顶层 `default` 账号；命名账号仍然可以仅凭 `homeserver` + `userId` 保持可发现，随后由缓存凭证满足认证要求。
如果 Matrix 已经恰好有一个命名账号，或者 `defaultAccount` 指向一个现有命名账号键，则单账号到多账号的修复 / 设置升级会保留该账号，而不是创建一个新的 `accounts.default` 条目。只有 Matrix 认证 / bootstrap 键会移动到这个升级后的账号中；共享的投递策略键仍保留在顶层。
当你希望 OpenClaw 在隐式路由、探测和 CLI 操作中优先使用某个命名 Matrix 账号时，请设置 `defaultAccount`。
如果配置了多个 Matrix 账号，且其中一个账号 ID 为 `default`，即使未设置 `defaultAccount`，OpenClaw 也会隐式使用该账号。
如果你配置了多个命名账号，请设置 `defaultAccount`，或在依赖隐式账号选择的 CLI 命令中传入 `--account <id>`。
当你想为单条命令覆盖这种隐式选择时，请向 `openclaw matrix verify ...` 和 `openclaw matrix devices ...` 传入 `--account <id>`。

有关共享多账号模式，请参阅 [Configuration reference](/zh-CN/gateway/configuration-reference#multi-account-all-channels)。

## 私有 / 局域网 homeserver

默认情况下，除非你为每个账号显式选择启用，否则 OpenClaw 会出于 SSRF 防护而阻止连接私有 / 内部 Matrix homeserver。

如果你的 homeserver 运行在 localhost、局域网 / Tailscale IP 或内部主机名上，请为该 Matrix 账号启用 `network.dangerouslyAllowPrivateNetwork`：

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

此显式启用仅允许受信任的私有 / 内部目标。像 `http://matrix.example.org:8008` 这样的公共明文 homeserver 仍会被阻止。请尽可能优先使用 `https://`。

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

命名账号可以使用 `channels.matrix.accounts.<id>.proxy` 覆盖顶层默认值。
OpenClaw 会对运行时 Matrix 流量和账号状态探测使用相同的代理设置。

## 目标解析

在 OpenClaw 任何要求你提供房间或用户目标的地方，Matrix 都接受以下目标形式：

- 用户：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房间：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 别名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

实时目录查找使用已登录的 Matrix 账号：

- 用户查找会查询该 homeserver 上的 Matrix 用户目录。
- 房间查找会直接接受显式房间 ID 和别名，然后回退为搜索该账号已加入房间的名称。
- 已加入房间名称查找属于尽力而为。如果某个房间名称无法解析为 ID 或别名，则在运行时允许列表解析中会被忽略。

## 配置参考

- `enabled`：启用或禁用该渠道。
- `name`：账号的可选标签。
- `defaultAccount`：配置多个 Matrix 账号时的首选账号 ID。
- `homeserver`：homeserver URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允许此 Matrix 账号连接到私有 / 内部 homeserver。当 homeserver 解析到 `localhost`、局域网 / Tailscale IP 或 `matrix-synapse` 这类内部主机时，请启用此项。
- `proxy`：用于 Matrix 流量的可选 HTTP(S) 代理 URL。命名账号可以用自己的 `proxy` 覆盖顶层默认值。
- `userId`：完整的 Matrix 用户 ID，例如 `@bot:example.org`。
- `accessToken`：用于基于令牌认证的访问令牌。`channels.matrix.accessToken` 和 `channels.matrix.accounts.<id>.accessToken` 支持明文值和 SecretRef 值，适用于 env / file / exec 提供商。参见 [Secrets Management](/zh-CN/gateway/secrets)。
- `password`：用于基于密码登录的密码。支持明文值和 SecretRef 值。
- `deviceId`：显式 Matrix 设备 ID。
- `deviceName`：用于密码登录的设备显示名称。
- `avatarUrl`：用于资料同步和 `profile set` 更新的已存储自头像 URL。
- `initialSyncLimit`：启动同步期间拉取的最大事件数。
- `encryption`：启用 E2EE。
- `allowlistOnly`：当为 `true` 时，会将 `open` 房间策略升级为 `allowlist`，并强制所有活跃私信策略（`disabled` 除外，包括 `pairing` 和 `open`）变为 `allowlist`。不影响 `disabled` 策略。
- `allowBots`：允许来自其他已配置 OpenClaw Matrix 账号的消息（`true` 或 `"mentions"`）。
- `groupPolicy`：`open`、`allowlist` 或 `disabled`。
- `contextVisibility`：补充房间上下文的可见性模式（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`：房间流量的允许列表用户 ID。条目应为完整 Matrix 用户 ID；无法解析的名称会在运行时被忽略。
- `historyLimit`：作为群组历史上下文包含的最大房间消息数。会回退到 `messages.groupChat.historyLimit`；如果两者都未设置，则生效默认值为 `0`。设置为 `0` 可禁用。
- `replyToMode`：`off`、`first`、`all` 或 `batched`。
- `markdown`：用于出站 Matrix 文本的可选 Markdown 渲染配置。
- `streaming`：`off`（默认）、`"partial"`、`"quiet"`、`true` 或 `false`。`"partial"` 和 `true` 会使用普通 Matrix 文本消息启用先预览后定稿的草稿更新。`"quiet"` 用于自托管推送规则场景下的静默预览通知。`false` 等同于 `"off"`。
- `blockStreaming`：当草稿预览流式传输处于启用状态时，`true` 会为已完成的智能体消息块启用单独的进度消息。
- `threadReplies`：`off`、`inbound` 或 `always`。
- `threadBindings`：针对线程绑定会话路由和生命周期的每渠道覆盖设置。
- `startupVerification`：启动时自动自验证请求模式（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`：重试自动启动验证请求前的冷却时间。
- `textChunkLimit`：按字符数拆分时的出站消息分块大小（当 `chunkMode` 为 `length` 时生效）。
- `chunkMode`：`length` 按字符数拆分消息；`newline` 在换行边界拆分。
- `responsePrefix`：可选字符串，会加在该渠道所有出站回复前面。
- `ackReaction`：此渠道 / 账号的可选确认回应覆盖值。
- `ackReactionScope`：可选确认回应作用域覆盖值（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`：入站回应通知模式（`own`、`off`）。
- `mediaMaxMb`：用于出站发送和入站媒体处理的媒体大小上限，单位 MB。
- `autoJoin`：邀请自动加入策略（`always`、`allowlist`、`off`）。默认值：`off`。适用于所有 Matrix 邀请，包括私信式邀请。
- `autoJoinAllowlist`：当 `autoJoin` 为 `allowlist` 时允许的房间 / 别名。在邀请处理期间，别名条目会解析为房间 ID；OpenClaw 不会信任被邀请房间声称的别名状态。
- `dm`：私信策略块（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.policy`：控制 OpenClaw 加入房间并将其分类为私信后的私信访问策略。它不会改变邀请是否会自动加入。
- `dm.allowFrom`：除非你已经通过实时目录查找解析过，否则条目应为完整 Matrix 用户 ID。
- `dm.sessionScope`：`per-user`（默认）或 `per-room`。如果你希望每个 Matrix 私信房间即使面对同一对端也保持独立上下文，请使用 `per-room`。
- `dm.threadReplies`：仅适用于私信的线程策略覆盖（`off`、`inbound`、`always`）。它会覆盖顶层 `threadReplies` 设置，影响私信中的回复位置和会话隔离。
- `execApprovals`：Matrix 原生 exec 审批投递（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`：允许批准 exec 请求的 Matrix 用户 ID。如果 `dm.allowFrom` 已经标识出审批人，则此项可选。
- `execApprovals.target`：`dm | channel | both`（默认：`dm`）。
- `accounts`：按账号命名的覆盖项。顶层 `channels.matrix` 值会作为这些条目的默认值。
- `groups`：按房间的策略映射。优先使用房间 ID 或别名；无法解析的房间名称会在运行时被忽略。解析后，会话 / 群组身份使用稳定的房间 ID。
- `groups.<room>.account`：在多账号设置中，将某个继承的房间条目限定到指定 Matrix 账号。
- `groups.<room>.allowBots`：针对已配置机器人发送者的房间级覆盖（`true` 或 `"mentions"`）。
- `groups.<room>.users`：每个房间的发送者允许列表。
- `groups.<room>.tools`：每个房间的工具允许 / 拒绝覆盖设置。
- `groups.<room>.autoReply`：房间级提及门控覆盖。`true` 会禁用该房间的提及要求；`false` 会强制重新启用。
- `groups.<room>.skills`：可选的房间级技能过滤器。
- `groups.<room>.systemPrompt`：可选的房间级系统提示片段。
- `rooms`：`groups` 的旧别名。
- `actions`：按操作划分的工具门控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 相关内容

- [Channels Overview](/zh-CN/channels) — 所有受支持的渠道
- [Pairing](/zh-CN/channels/pairing) — 私信认证与配对流程
- [Groups](/zh-CN/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Security](/zh-CN/gateway/security) — 访问模型与安全加固
