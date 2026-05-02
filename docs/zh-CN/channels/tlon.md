---
read_when:
    - 开发 Tlon/Urbit 渠道功能
summary: Tlon/Urbit 支持状态、能力和配置
title: Tlon
x-i18n:
    generated_at: "2026-05-02T21:57:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30915170786fc1ee8b84fb8be2ea42280262923064cfa9ca7107036096a13add
    source_path: channels/tlon.md
    workflow: 16
---

Tlon 是构建在 Urbit 上的去中心化消息应用。OpenClaw 会连接到你的 Urbit ship，并且可以
回复私信和群聊消息。默认情况下，群组回复需要 @ 提及，也可以
通过 allowlist 进一步限制。

Status: 内置插件。支持私信、群组提及、thread 回复、富文本格式以及
图片上传。尚不支持 Reactions 和投票。

## 内置插件

Tlon 在当前 OpenClaw 版本中作为内置插件发布，因此常规打包
构建不需要单独安装。

如果你使用的是较旧构建，或是不包含 Tlon 的自定义安装，请安装
当前 npm 包：

通过 CLI 安装（npm registry）：

```bash
openclaw plugins install @openclaw/tlon
```

使用裸包名以跟随当前官方发布标签。只有在需要可复现安装时，
才固定到精确版本。

本地 checkout（从 git repo 运行时）：

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

详情：[插件](/zh-CN/tools/plugin)

## 设置

1. 确保 Tlon 插件可用。
   - 当前打包的 OpenClaw 版本已内置它。
   - 较旧/自定义安装可以使用上面的命令手动添加。
2. 收集你的 ship URL 和登录 code。
3. 配置 `channels.tlon`。
4. 重启 Gateway 网关。
5. 给机器人发送私信，或在群组 channel 中提及它。

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

默认情况下，OpenClaw 会阻止私有/内部主机名和 IP 范围，以提供 SSRF 防护。
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

⚠️ 只有在你信任本地网络时才启用此项。此设置会对发往你的 ship URL 的请求
禁用 SSRF 防护。

## 群组 channels

默认启用自动发现。你也可以手动固定 channels：

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

私信 allowlist（空 = 不允许私信，使用 `ownerShip` 走审批流程）：

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

设置 owner ship，以便在未授权用户尝试交互时接收审批请求：

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

owner ship 会**在所有位置自动获得授权** — 私信邀请会自动接受，
channel 消息始终允许。你不需要把 owner 添加到 `dmAllowlist` 或
`defaultAuthorizedShips`。

设置后，owner 会收到以下私信通知：

- 来自未在 allowlist 中的 ships 的私信请求
- 未经授权的 channels 中的提及
- 群组邀请请求

## 自动接受设置

自动接受私信邀请（针对 dmAllowlist 中的 ships）：

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

将这些目标与 `openclaw message send` 或 cron 投递一起使用：

- 私信：`~sampel-palnet` 或 `dm/~sampel-palnet`
- 群组：`chat/~host-ship/channel` 或 `group:~host-ship/channel`

## 内置 skill

Tlon 插件包含一个内置 skill（[`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)），
可提供对 Tlon 操作的 CLI 访问：

- **联系人**：获取/更新资料，列出联系人
- **Channels**：列出、创建、发布消息、获取历史记录
- **群组**：列出、创建、管理成员
- **私信**：发送消息、对消息作出反应
- **Reactions**：为帖子和私信添加/移除 emoji reactions
- **设置**：通过 slash commands 管理插件权限

插件安装后，该 skill 会自动可用。

## 能力

| 功能            | Status                                  |
| --------------- | --------------------------------------- |
| 直接消息        | ✅ 支持                                |
| 群组/channels   | ✅ 支持（默认需要提及）                 |
| Threads         | ✅ 支持（在 thread 中自动回复）         |
| 富文本          | ✅ Markdown 会转换为 Tlon 格式          |
| 图片            | ✅ 上传到 Tlon storage                  |
| Reactions       | ✅ 通过[内置 skill](#bundled-skill)     |
| 投票            | ❌ 尚不支持                            |
| 原生命令        | ✅ 支持（默认仅限 owner）               |

## 故障排除

先运行这个排查阶梯：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

常见故障：

- **私信被忽略**：发送者不在 `dmAllowlist` 中，并且没有为审批流程配置 `ownerShip`。
- **群组消息被忽略**：channel 未被发现，或发送者未获授权。
- **连接错误**：检查 ship URL 是否可访问；对本地 ships 启用 `allowPrivateNetwork`。
- **认证错误**：验证登录 code 是否为当前有效 code（codes 会轮换）。

## 配置参考

完整配置：[配置](/zh-CN/gateway/configuration)

提供商选项：

- `channels.tlon.enabled`：启用/禁用 channel 启动。
- `channels.tlon.ship`：机器人的 Urbit ship 名称（例如 `~sampel-palnet`）。
- `channels.tlon.url`：ship URL（例如 `https://sampel-palnet.tlon.network`）。
- `channels.tlon.code`：ship 登录 code。
- `channels.tlon.allowPrivateNetwork`：允许 localhost/LAN URLs（绕过 SSRF）。
- `channels.tlon.ownerShip`：审批系统的 owner ship（始终授权）。
- `channels.tlon.dmAllowlist`：允许发送私信的 ships（空 = 无）。
- `channels.tlon.autoAcceptDmInvites`：自动接受 allowlisted ships 的私信。
- `channels.tlon.autoAcceptGroupInvites`：自动接受所有群组邀请。
- `channels.tlon.autoDiscoverChannels`：自动发现群组 channels（默认：true）。
- `channels.tlon.groupChannels`：手动固定的 channel nests。
- `channels.tlon.defaultAuthorizedShips`：对所有 channels 授权的 ships。
- `channels.tlon.authorization.channelRules`：按 channel 配置的 auth rules。
- `channels.tlon.showModelSignature`：在消息后附加模型名称。

## 备注

- 群组回复需要提及（例如 `~your-bot-ship`）才会响应。
- Thread 回复：如果传入消息位于 thread 中，OpenClaw 会在同一 thread 中回复。
- 富文本：Markdown 格式（粗体、斜体、code、headers、列表）会转换为 Tlon 的原生格式。
- 图片：URLs 会上传到 Tlon storage，并作为 image blocks 嵌入。

## 相关

- [Channels 概览](/zh-CN/channels) — 所有支持的 channels
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固
