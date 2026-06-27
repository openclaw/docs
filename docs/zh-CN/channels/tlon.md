---
read_when:
    - 开发 Tlon/Urbit 渠道功能
summary: Tlon/Urbit 支持状态、能力和配置
title: Tlon
x-i18n:
    generated_at: "2026-05-03T22:20:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1718044541b431ff2437508e7e6659c14206f4aa84ab8b207e0d791dea2a48c5
    source_path: channels/tlon.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Tlon 是构建在 Urbit 上的去中心化消息应用。OpenClaw 会连接到你的 Urbit ship，并可以
回复私信和群聊消息。默认情况下，群组回复需要 @ 提及，也可以
通过允许列表进一步限制。

Status：内置插件。支持私信、群组提及、线程回复、富文本格式和
图片上传。暂不支持表情回应和投票。

## 内置插件

在当前 OpenClaw 版本中，Tlon 作为内置插件随附，因此普通打包
构建不需要单独安装。

如果你使用的是旧版本构建，或排除了 Tlon 的自定义安装，请安装
当前 npm 包：

通过 CLI 安装（npm registry）：

```bash
openclaw plugins install @openclaw/tlon
```

使用裸包名可跟随当前官方发布标签。仅在需要可复现安装时才固定精确
版本。

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

详情：[插件](/zh-CN/tools/plugin)

## 设置

1. 确保 Tlon 插件可用。
   - 当前打包的 OpenClaw 版本已内置它。
   - 旧版/自定义安装可以使用上面的命令手动添加它。
2. 收集你的 ship URL 和登录码。
3. 配置 `channels.tlon`。
4. 重启 Gateway 网关。
5. 给机器人发私信，或在群组频道中提及它。

最小配置（单账户）：

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

默认情况下，OpenClaw 会阻止私有/内部主机名和 IP 范围以提供 SSRF 保护。
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

⚠️ 仅在你信任本地网络时启用此项。该设置会对发送到你的 ship URL 的请求
禁用 SSRF 保护。

## 群组频道

默认启用自动发现。你也可以手动固定频道：

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

私信允许列表（空 = 不允许私信，使用 `ownerShip` 进行批准流程）：

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

## 所有者和批准系统

设置所有者 ship，以便在未授权用户尝试交互时接收批准请求：

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
频道消息始终允许。你不需要将所有者添加到 `dmAllowlist` 或
`defaultAuthorizedShips`。

设置后，所有者会收到以下私信通知：

- 来自不在允许列表中的 ships 的私信请求
- 未授权频道中的提及
- 群组邀请请求

## 自动接受设置

自动接受私信邀请（针对 `dmAllowlist` 中的 ships）：

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

自动接受来自受信任 ships 的群组邀请：

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
      groupInviteAllowlist: ["~zod"],
    },
  },
}
```

当 `groupInviteAllowlist` 为空时，`autoAcceptGroupInvites` 会默认拒绝。将
允许列表设置为应自动接受其群组邀请的 ships。

## 递送目标（CLI/cron）

将这些目标与 `openclaw message send` 或 cron 递送一起使用：

- 私信：`~sampel-palnet` 或 `dm/~sampel-palnet`
- 群组：`chat/~host-ship/channel` 或 `group:~host-ship/channel`

## 内置 Skills

Tlon 插件包含一个内置 Skills（[`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)），
它提供对 Tlon 操作的 CLI 访问：

- **联系人**：获取/更新资料，列出联系人
- **频道**：列出、创建、发布消息、获取历史记录
- **群组**：列出、创建、管理成员
- **私信**：发送消息、对消息作出回应
- **表情回应**：向帖子和私信添加/移除 emoji 表情回应
- **设置**：通过 slash commands 管理插件权限

安装插件后，该 Skills 会自动可用。

## 能力

| 功能         | Status                                  |
| --------------- | --------------------------------------- |
| 直接消息 | ✅ 支持                            |
| 群组/频道 | ✅ 支持（默认需要提及） |
| 线程         | ✅ 支持（在线程中自动回复）   |
| 富文本       | ✅ Markdown 转换为 Tlon 格式    |
| 图片          | ✅ 上传到 Tlon 存储             |
| 表情回应       | ✅ 通过[内置 Skills](#bundled-skill)  |
| 投票           | ❌ 暂不支持                    |
| 原生命令 | ✅ 支持（默认仅所有者可用）    |

## 故障排除

先运行这个排查步骤：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

常见故障：

- **忽略私信**：发送者不在 `dmAllowlist` 中，且未配置用于批准流程的 `ownerShip`。
- **忽略群组消息**：频道未被发现，或发送者未授权。
- **连接错误**：检查 ship URL 是否可访问；对本地 ships 启用 `allowPrivateNetwork`。
- **认证错误**：确认登录码是当前有效的（代码会轮换）。

## 配置参考

完整配置：[配置](/zh-CN/gateway/configuration)

提供商选项：

- `channels.tlon.enabled`：启用/禁用渠道启动。
- `channels.tlon.ship`：机器人的 Urbit ship 名称（例如 `~sampel-palnet`）。
- `channels.tlon.url`：ship URL（例如 `https://sampel-palnet.tlon.network`）。
- `channels.tlon.code`：ship 登录码。
- `channels.tlon.allowPrivateNetwork`：允许 localhost/LAN URL（SSRF 绕过）。
- `channels.tlon.ownerShip`：批准系统的所有者 ship（始终授权）。
- `channels.tlon.dmAllowlist`：允许发私信的 ships（空 = 无）。
- `channels.tlon.autoAcceptDmInvites`：自动接受来自允许列表中 ships 的私信。
- `channels.tlon.autoAcceptGroupInvites`：自动接受来自允许列表中 ships 的群组邀请。
- `channels.tlon.groupInviteAllowlist`：其群组邀请可以被自动接受的 ships。
- `channels.tlon.autoDiscoverChannels`：自动发现群组频道（默认：true）。
- `channels.tlon.groupChannels`：手动固定的频道 nests。
- `channels.tlon.defaultAuthorizedShips`：对所有频道授权的 ships。
- `channels.tlon.authorization.channelRules`：按频道设置的认证规则。
- `channels.tlon.showModelSignature`：在消息后附加模型名称。

## 备注

- 群组回复需要提及（例如 `~your-bot-ship`）才会响应。
- 线程回复：如果传入消息在线程中，OpenClaw 会在线程内回复。
- 富文本：Markdown 格式（粗体、斜体、代码、标题、列表）会转换为 Tlon 的原生格式。
- 图片：URL 会上传到 Tlon 存储，并作为图片块嵌入。

## 相关内容

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固
