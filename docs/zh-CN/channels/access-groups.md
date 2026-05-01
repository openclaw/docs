---
read_when:
    - 在多个消息渠道中配置相同的允许列表
    - 共享私信和群组发送者访问规则
    - 审查消息渠道访问控制
summary: 用于消息渠道的可复用发送者允许名单
title: 访问组
x-i18n:
    generated_at: "2026-05-01T23:03:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7bc1d4fb80e5c5d4e72b190d49821aa93ced575eafcf89864ac800e8558f94
    source_path: channels/access-groups.md
    workflow: 16
---

访问组是你定义一次、并通过 `accessGroup:<name>` 从渠道允许列表引用的具名发送者列表。

当同一批人应被允许使用多个消息渠道，或一个受信任集合应同时应用于私信和群组发送者授权时，请使用它们。

访问组本身不会授予访问权限。只有当允许列表字段引用某个组时，该组才有意义。

## 静态消息发送者组

静态发送者组使用 `type: "message.senders"`。

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
}
```

成员列表按消息渠道 ID 作为键：

| 键        | 含义                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `"*"`      | 对引用该组的每个消息渠道检查的共享条目。 |
| `discord`  | 仅用于 Discord 允许列表匹配时检查的条目。                    |
| `telegram` | 仅用于 Telegram 允许列表匹配时检查的条目。                   |
| `whatsapp` | 仅用于 WhatsApp 允许列表匹配时检查的条目。                   |

条目会使用目标渠道的常规 `allowFrom` 规则进行匹配。OpenClaw 不会在渠道之间转换发送者 ID。如果 Alice 同时有 Telegram ID 和 Discord ID，请将两个 ID 都列在相应的键下。

## 从允许列表引用组

在消息渠道路径支持发送者允许列表的任何位置，都可以使用 `accessGroup:<name>` 引用组。

私信允许列表示例：

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
    telegram: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

群组发送者允许列表示例：

```json5
{
  accessGroups: {
    oncall: {
      type: "message.senders",
      members: {
        whatsapp: ["+15551234567"],
        googlechat: ["users/1234567890"],
      },
    },
  },
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["accessGroup:oncall"],
    },
    googlechat: {
      spaces: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

你可以混合使用组和直接条目：

```json5
{
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators", "discord:123456789012345678"],
    },
  },
}
```

## 支持的消息渠道路径

访问组可用于共享的消息渠道授权路径，包括：

- 私信发送者允许列表，例如 `channels.<channel>.allowFrom`
- 群组发送者允许列表，例如 `channels.<channel>.groupAllowFrom`
- 使用相同发送者匹配规则的渠道特定按房间发送者允许列表
- 复用消息渠道发送者允许列表的命令授权路径

渠道支持取决于该渠道是否通过共享的 OpenClaw 发送者授权辅助工具接入。当前内置支持包括 Discord、Google Chat、Nostr、WhatsApp、Zalo 和 Zalo Personal。静态 `message.senders` 组设计为与渠道无关，因此新的消息渠道应通过使用共享的插件 SDK 辅助工具来支持它们，而不是自定义允许列表展开。

## Discord 渠道受众

Discord 还支持动态访问组类型：

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

`discord.channelAudience` 表示“允许当前可以查看此服务器渠道的 Discord 私信发送者”。OpenClaw 会在授权时通过 Discord 解析发送者，并应用 Discord `ViewChannel` 权限规则。

当某个 Discord 渠道已经是某个团队的事实来源时使用此功能，例如 `#maintainers` 或 `#on-call`。

要求和失败行为：

- 机器人需要能访问该服务器和渠道。
- 机器人需要 Discord 开发者门户中的 **Server Members Intent**。
- 当 Discord 返回 `Missing Access`、无法将发送者解析为服务器成员，或渠道属于另一个服务器时，访问组会失败关闭。

更多 Discord 特定示例：[Discord 访问控制](/zh-CN/channels/discord#access-control-and-routing)

## 安全说明

- 访问组是允许列表别名，不是角色。它们本身不会创建所有者、批准配对请求或授予工具权限。
- `dmPolicy: "open"` 仍然要求有效的私信允许列表中包含 `"*"`。引用访问组不等同于公共访问。
- 缺失的组名会失败关闭。如果 `allowFrom` 包含 `accessGroup:operators` 而 `accessGroups.operators` 不存在，则该条目不会授权任何人。
- 保持渠道 ID 稳定。当渠道同时支持数字/用户 ID 和显示名称时，优先使用数字/用户 ID。

## 故障排除

如果某个发送者本应匹配但被阻止：

1. 确认允许列表字段包含精确的 `accessGroup:<name>` 引用。
2. 确认 `accessGroups.<name>.type` 正确。
3. 确认发送者 ID 列在匹配的渠道键下，或列在 `"*"` 下。
4. 确认该条目使用该渠道的常规允许列表语法。
5. 对于 Discord 渠道受众，确认机器人可以看到服务器渠道，并且已启用 Server Members Intent。

编辑访问控制配置后运行 `openclaw doctor`。它会在运行时之前捕获许多无效的允许列表和策略组合。
