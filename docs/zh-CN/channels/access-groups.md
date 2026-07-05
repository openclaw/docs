---
read_when:
    - 在多个消息渠道中配置相同的允许列表
    - 共享私信和群组发送者访问规则
    - 审查消息渠道访问控制
summary: 消息渠道的可复用发送者允许列表
title: 访问组
x-i18n:
    generated_at: "2026-07-05T11:01:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 099abc95e90d9a7b7006d19062c46b4ffdb2aecb1e8e714454a3182131a786d0
    source_path: channels/access-groups.md
    workflow: 16
---

访问组是你在 `accessGroups` 下定义一次，并通过 `accessGroup:<name>` 从渠道允许列表引用的具名发送者列表。

当同一批人应该被允许使用多个消息渠道，或者一个受信任集合应同时适用于私信和群组发送者授权时，可以使用它们。

组本身不授予任何权限。只有在允许列表字段引用它的位置，它才有意义。

## 静态消息发送者组

静态发送者组使用 `type: "message.senders"`。`members` 以消息渠道 ID 为键，另有 `"*"` 用于每个渠道共享的条目：

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

| 键                         | 含义                                                                  |
| -------------------------- | --------------------------------------------------------------------- |
| `"*"`                      | 对引用该组的每个消息渠道都会检查的共享条目。                          |
| `discord`, `telegram`, ... | 仅在该渠道的允许列表匹配中检查的条目。                                |

条目会按照目标渠道的常规 `allowFrom` 规则进行匹配。OpenClaw 不会在渠道之间转换发送者 ID：如果 Alice 同时有 Telegram ID 和 Discord ID，请把两个 ID 都列在对应的渠道键下。

## 从允许列表引用组

在消息渠道路径支持发送者允许列表的任何位置，都可以用 `accessGroup:<name>` 引用组。

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
      groups: {
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

访问组适用于共享的消息渠道授权路径：

- 私信发送者允许列表，例如 `channels.<channel>.allowFrom`
- 群组发送者允许列表，例如 `channels.<channel>.groupAllowFrom`
- 使用相同发送者匹配规则的渠道专属按房间发送者允许列表（例如 Google Chat `groups.<space>.users`）
- 复用消息渠道发送者允许列表的命令授权路径

渠道支持取决于该渠道是否接入共享的 OpenClaw 发送者授权辅助函数。当前内置支持包括 ClickClack、Discord、Feishu、Google Chat、iMessage、IRC、LINE、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Signal、Slack、SMS、Telegram、WhatsApp、Zalo 和 Zalo Personal。静态 `message.senders` 组与渠道无关，因此新的消息渠道只要使用共享插件 SDK 入口辅助函数，而不是自定义允许列表展开，就能获得这些组。

## Discord 渠道受众

Discord 还支持一种动态访问组类型：

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

`discord.channelAudience` 表示“允许当前可以查看此公会频道的 Discord 私信发送者”。OpenClaw 会在授权时通过 Discord 解析发送者，并应用 Discord `ViewChannel` 权限规则。`membership` 是可选项，默认值为 `canViewChannel`。

当某个 Discord 渠道已经是团队事实来源时，例如 `#maintainers` 或 `#on-call`，可以使用此方式。

要求和失败行为：

- bot 需要能够访问该公会和频道。
- bot 需要 Discord Developer Portal 的**服务器成员 Intent**。
- 当 Discord 返回 `Missing Access`、发送者无法解析为公会成员，或频道属于另一个公会时，访问组会关闭失败。

更多 Discord 专属示例：[Discord 访问控制](/zh-CN/channels/discord#access-control-and-routing)

## 插件诊断

插件作者可以检查结构化的访问组状态，而不必将其重新展开成扁平允许列表：

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/access-groups";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

结果会报告已引用、已匹配、缺失、不支持和失败的组。可将其用于诊断或一致性测试。仅在仍然期望扁平 `allowFrom` 数组的兼容路径中使用 `expandAllowFromWithAccessGroups(...)`。

## 安全说明

- 访问组是允许列表别名，不是角色。它们本身不会创建所有者、批准配对请求，也不会授予工具权限。
- `dmPolicy: "open"` 仍然要求有效私信允许列表中包含 `"*"`。引用访问组并不等同于公开访问。
- 缺失的组名会关闭失败。如果 `allowFrom` 包含 `accessGroup:operators`，但 `accessGroups.operators` 不存在，则该条目不会授权任何人。
- 保持渠道 ID 稳定。当渠道同时支持数字/用户 ID 和显示名称时，优先使用数字/用户 ID。

## 故障排查

如果某个发送者应匹配但被阻止：

1. 确认允许列表字段包含精确的 `accessGroup:<name>` 引用。
2. 确认 `accessGroups.<name>.type` 正确。
3. 确认发送者 ID 已列在匹配的渠道键下，或列在 `"*"` 下。
4. 确认该条目使用该渠道的常规允许列表语法。
5. 对于 Discord 渠道受众，确认 bot 可以看到该公会频道，并且已启用服务器成员 Intent。

编辑访问控制配置后运行 `openclaw doctor`。它会在运行时之前捕获许多无效的允许列表和策略组合。
