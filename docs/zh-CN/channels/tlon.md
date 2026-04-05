---
read_when:
    - 处理 Tlon/Urbit 渠道功能时
summary: Tlon/Urbit 支持状态、能力和配置
title: Tlon
x-i18n:
    generated_at: "2026-04-05T08:18:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 289cffb3c1b2d450a5f41e0d67117dfb5c192cec956d82039caac9df9f07496d
    source_path: channels/tlon.md
    workflow: 15
---

# Tlon

Tlon 是一个构建于 Urbit 之上的去中心化通信工具。OpenClaw 可以连接到你的 Urbit ship，并且能够响应私信和群聊消息。默认情况下，群组回复需要带有 `@` 提及，并且还可以通过 allowlist 进一步限制。

状态：内置插件。支持私信、群组提及、线程回复、富文本格式和图片上传。暂不支持 Reactions 和 投票。

## 内置插件

Tlon 作为内置插件随当前的 OpenClaw 发布版本提供，因此普通的打包构建不需要单独安装。

如果你使用的是较旧的构建版本，或者是不包含 Tlon 的自定义安装，请手动安装：

通过 CLI 安装（npm 注册表）：

```bash
openclaw plugins install @openclaw/tlon
```

本地检出安装（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

详情：[Plugins](/tools/plugin)

## 设置

1. 确保 Tlon 插件可用。
   - 当前打包的 OpenClaw 发布版本已经内置了它。
   - 较旧/自定义安装可以使用上面的命令手动添加。
2. 获取你的 ship URL 和登录代码。
3. 配置 `channels.tlon`。
4. 重启 Gateway 网关。
5. 给机器人发送私信，或在群组渠道中提及它。

最小配置（单账户）：

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // 推荐：你的 ship，始终被允许
    },
  },
}
```

## 私有/LAN ship

默认情况下，OpenClaw 会阻止私有/内部主机名和 IP 范围，以防范 SSRF。如果你的 ship 运行在私有网络中（localhost、LAN IP 或内部主机名），你必须显式启用：

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

这适用于以下 URL：

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ 仅当你信任本地网络时才启用此项。此设置会对发往你的 ship URL 的请求禁用 SSRF 保护。

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

私信 allowlist（空 = 不允许任何私信，使用 `ownerShip` 进行审批流程）：

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

## 所有者与审批系统

设置一个 owner ship，以便在未授权用户尝试交互时接收审批请求：

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

owner ship 会**在所有地方自动获得授权**——私信邀请会被自动接受，渠道消息也始终被允许。你不需要将 owner 添加到 `dmAllowlist` 或 `defaultAuthorizedShips` 中。

设置后，owner 会通过私信收到以下通知：

- 来自不在 allowlist 中的 ship 的私信请求
- 未经授权的渠道提及时的通知
- 群组邀请请求

## 自动接受设置

自动接受私信邀请（针对 `dmAllowlist` 中的 ship）：

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

## 发送目标（CLI/cron）

将这些与 `openclaw message send` 或 cron 投递一起使用：

- 私信：`~sampel-palnet` 或 `dm/~sampel-palnet`
- 群组：`chat/~host-ship/channel` 或 `group:~host-ship/channel`

## 内置 Skill

Tlon 插件包含一个内置 Skill（[`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)），提供对 Tlon 操作的 CLI 访问：

- **联系人**：获取/更新资料，列出联系人
- **渠道**：列出、创建、发送消息、获取历史记录
- **群组**：列出、创建、管理成员
- **私信**：发送消息，对消息添加反应
- **Reactions**：为帖子和私信添加/移除表情反应
- **设置**：通过斜杠命令管理插件权限

安装插件后，该 Skill 会自动可用。

## 能力

| 功能         | 状态                                   |
| --------------- | --------------------------------------- |
| 私信 | ✅ 支持                            |
| 群组/渠道 | ✅ 支持（默认需要提及） |
| 线程         | ✅ 支持（在线程中自动回复）   |
| 富文本       | ✅ Markdown 会转换为 Tlon 格式    |
| 图片          | ✅ 上传到 Tlon 存储             |
| Reactions       | ✅ 通过[内置 Skill](#bundled-skill)提供  |
| 投票           | ❌ 暂不支持                    |
| 原生命令 | ✅ 支持（默认仅 owner 可用）    |

## 故障排除

请先按这个顺序运行：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

常见故障：

- **私信被忽略**：发送者不在 `dmAllowlist` 中，并且未配置 `ownerShip` 用于审批流程。
- **群组消息被忽略**：渠道未被发现，或发送者未获授权。
- **连接错误**：检查 ship URL 是否可达；对于本地 ship，启用 `allowPrivateNetwork`。
- **认证错误**：确认登录代码仍然有效（代码会轮换）。

## 配置参考

完整配置：[Configuration](/gateway/configuration)

提供商选项：

- `channels.tlon.enabled`：启用/禁用渠道启动。
- `channels.tlon.ship`：机器人的 Urbit ship 名称（例如 `~sampel-palnet`）。
- `channels.tlon.url`：ship URL（例如 `https://sampel-palnet.tlon.network`）。
- `channels.tlon.code`：ship 登录代码。
- `channels.tlon.allowPrivateNetwork`：允许 localhost/LAN URL（绕过 SSRF）。
- `channels.tlon.ownerShip`：用于审批系统的 owner ship（始终授权）。
- `channels.tlon.dmAllowlist`：允许发送私信的 ship（空 = 无）。
- `channels.tlon.autoAcceptDmInvites`：自动接受来自 allowlist 中 ship 的私信。
- `channels.tlon.autoAcceptGroupInvites`：自动接受所有群组邀请。
- `channels.tlon.autoDiscoverChannels`：自动发现群组渠道（默认：true）。
- `channels.tlon.groupChannels`：手动固定的渠道 nest。
- `channels.tlon.defaultAuthorizedShips`：对所有渠道都已授权的 ship。
- `channels.tlon.authorization.channelRules`：按渠道设置的认证规则。
- `channels.tlon.showModelSignature`：在消息后追加模型名称。

## 说明

- 群组回复需要带有提及（例如 `~your-bot-ship`）才会响应。
- 线程回复：如果传入消息在线程中，OpenClaw 会在线程内回复。
- 富文本：Markdown 格式（粗体、斜体、代码、标题、列表）会转换为 Tlon 原生格式。
- 图片：URL 会上传到 Tlon 存储，并以内嵌图片块的形式展示。

## 相关内容

- [Channels Overview](/channels) — 所有支持的渠道
- [Pairing](/channels/pairing) — 私信认证与配对流程
- [Groups](/channels/groups) — 群聊行为和提及限制
- [Channel Routing](/channels/channel-routing) — 消息的会话路由
- [Security](/gateway/security) — 访问模型与安全加固
