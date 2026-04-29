---
read_when:
    - 正在开发 Tlon/Urbit 渠道功能
summary: Tlon/Urbit 支持状态、能力和配置
title: Tlon
x-i18n:
    generated_at: "2026-04-29T05:38:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: bec632f946796a0ea4bceb5ad26f1ff1825c4304bf7252e9d2fd4d3889d36b52
    source_path: channels/tlon.md
    workflow: 16
---

Tlon 是构建在 Urbit 上的去中心化消息工具。OpenClaw 会连接到你的 Urbit ship，并可以
回复私信和群聊消息。群组回复默认需要 @ 提及，并且可以通过允许列表进一步限制。

Status：内置插件。支持私信、群组提及、线程回复、富文本格式和
图片上传。尚不支持回应和投票。

## 内置插件

在当前 OpenClaw 版本中，Tlon 作为内置插件随包提供，因此普通打包
构建不需要单独安装。

如果你使用的是较旧版本，或自定义安装排除了 Tlon，请在发布当前 npm 包后安装
当前 npm 包：

通过 CLI 安装（npm registry，在存在当前包时）：

```bash
openclaw plugins install @openclaw/tlon
```

如果 npm 报告 OpenClaw 所有的包已弃用，请使用当前打包的
OpenClaw 构建，或在更新的 npm 包
发布之前使用本地检出路径。

本地检出（从 git repo 运行时）：

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

详情：[插件](/zh-CN/tools/plugin)

## 设置

1. 确保 Tlon 插件可用。
   - 当前打包的 OpenClaw 版本已经内置它。
   - 较旧/自定义安装可以使用上面的命令手动添加它。
2. 获取你的 ship URL 和登录代码。
3. 配置 `channels.tlon`。
4. 重启 Gateway 网关。
5. 私信该机器人，或在群组渠道中提及它。

最小配置（单账号）：

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## 私有/LAN ships

默认情况下，OpenClaw 会阻止私有/内部主机名和 IP 范围以防护 SSRF。
如果你的 ship 运行在私有网络上（localhost、LAN IP 或内部主机名），
你必须显式选择启用：

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

这适用于如下 URL：

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ 仅在你信任本地网络时启用此项。此设置会对发往你的 ship URL 的请求
禁用 SSRF 防护。

## 群组渠道

默认启用自动发现。你也可以手动固定渠道：

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

禁用自动发现：

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## 访问控制

私信允许列表（空 = 不允许任何私信，使用 `ownerShip` 处理审批流程）：

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

群组授权（默认受限）：

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## 所有者和审批系统

设置一个所有者 ship，以便在未授权用户尝试互动时接收审批请求：

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

所有者 ship 会**自动在所有位置获得授权**——私信邀请会自动接受，
渠道消息始终允许。你不需要把所有者添加到 `dmAllowlist` 或
`defaultAuthorizedShips`。

设置后，所有者会收到以下私信通知：

- 来自不在允许列表中的 ship 的私信请求
- 未授权渠道中的提及
- 群组邀请请求

## 自动接受设置

自动接受私信邀请（来自 dmAllowlist 中的 ship）：

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

自动接受群组邀请：

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## 投递目标（CLI/cron）

将这些与 `openclaw message send` 或 cron 投递一起使用：

- 私信：`~sampel-palnet` 或 `dm/~sampel-palnet`
- 群组：`chat/~host-ship/channel` 或 `group:~host-ship/channel`

## 内置 skill

Tlon 插件包含一个内置 skill（[`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)），
它提供对 Tlon 操作的 CLI 访问：

- **联系人**：获取/更新个人资料，列出联系人
- **渠道**：列出、创建、发布消息、获取历史记录
- **群组**：列出、创建、管理成员
- **私信**：发送消息、对消息作出回应
- **回应**：向帖子和私信添加/移除 emoji 回应
- **设置**：通过 slash commands 管理插件权限

安装插件后，该 skill 会自动可用。

## 能力

| 功能         | Status                                  |
| --------------- | --------------------------------------- |
| 直接消息 | ✅ 支持                            |
| 群组/渠道 | ✅ 支持（默认需要提及） |
| 线程         | ✅ 支持（在线程中自动回复）   |
| 富文本       | ✅ Markdown 会转换为 Tlon 格式    |
| 图片          | ✅ 上传到 Tlon 存储             |
| 回应       | ✅ 通过[内置 skill](#bundled-skill)  |
| 投票           | ❌ 尚不支持                    |
| 原生命令 | ✅ 支持（默认仅所有者）    |

## 故障排除

先运行此排查阶梯：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

常见失败：

- **私信被忽略**：发送者不在 `dmAllowlist` 中，并且没有为审批流程配置 `ownerShip`。
- **群组消息被忽略**：渠道未被发现，或发送者未获得授权。
- **连接错误**：检查 ship URL 是否可访问；对本地 ship 启用 `allowPrivateNetwork`。
- **认证错误**：确认登录代码是当前有效的（代码会轮换）。

## 配置参考

完整配置：[配置](/zh-CN/gateway/configuration)

提供商选项：

- `channels.tlon.enabled`：启用/禁用渠道启动。
- `channels.tlon.ship`：机器人的 Urbit ship 名称（例如 `~sampel-palnet`）。
- `channels.tlon.url`：ship URL（例如 `https://sampel-palnet.tlon.network`）。
- `channels.tlon.code`：ship 登录代码。
- `channels.tlon.allowPrivateNetwork`：允许 localhost/LAN URL（绕过 SSRF）。
- `channels.tlon.ownerShip`：审批系统的所有者 ship（始终授权）。
- `channels.tlon.dmAllowlist`：允许发送私信的 ship（空 = 无）。
- `channels.tlon.autoAcceptDmInvites`：自动接受来自允许列表中 ship 的私信。
- `channels.tlon.autoAcceptGroupInvites`：自动接受所有群组邀请。
- `channels.tlon.autoDiscoverChannels`：自动发现群组渠道（默认：true）。
- `channels.tlon.groupChannels`：手动固定的渠道 nest。
- `channels.tlon.defaultAuthorizedShips`：对所有渠道授权的 ship。
- `channels.tlon.authorization.channelRules`：按渠道设置的认证规则。
- `channels.tlon.showModelSignature`：向消息追加模型名称。

## 注意事项

- 群组回复需要提及（例如 `~your-bot-ship`）才会响应。
- 线程回复：如果入站消息位于线程中，OpenClaw 会在线程内回复。
- 富文本：Markdown 格式（粗体、斜体、代码、标题、列表）会转换为 Tlon 的原生格式。
- 图片：URL 会上传到 Tlon 存储，并作为图片块嵌入。

## 相关

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固
