---
read_when:
    - 更改群聊行为或提及门控
summary: 跨多个平台的群聊行为（Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo）
title: 群组
x-i18n:
    generated_at: "2026-04-05T08:15:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39d066e0542b468c6f8b384b463e2316590ea09a00ecb2065053e1e2ce55bd5f
    source_path: channels/groups.md
    workflow: 15
---

# 群组

OpenClaw 会在各个平台上以一致方式处理群聊：Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo。

## 新手简介（2 分钟）

OpenClaw “运行”在你自己的消息账号上。没有单独的 WhatsApp 机器人用户。
如果**你**在某个群组中，OpenClaw 就可以看到该群组并在那里回复。

默认行为：

- 群组是受限的（`groupPolicy: "allowlist"`）。
- 回复需要提及，除非你显式禁用提及门控。

也就是说：在 allowlist 中的发送者可以通过提及 OpenClaw 来触发它。

> TL;DR
>
> - **私信访问**由 `*.allowFrom` 控制。
> - **群组访问**由 `*.groupPolicy` + allowlist（`*.groups`、`*.groupAllowFrom`）控制。
> - **回复触发**由提及门控（`requireMention`、`/activation`）控制。

快速流程（群消息会发生什么）：

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## 上下文可见性与 allowlist

群组安全涉及两种不同的控制：

- **触发授权**：谁可以触发智能体（`groupPolicy`、`groups`、`groupAllowFrom`、各渠道专用 allowlist）。
- **上下文可见性**：哪些补充上下文会注入模型（回复文本、引用、线程历史、转发元数据）。

默认情况下，OpenClaw 优先保证正常聊天行为，并尽量保持上下文按接收时的原样。这意味着 allowlist 主要决定谁可以触发操作，而不是为每一段引用或历史片段提供统一的脱敏边界。

当前行为因渠道而异：

- 某些渠道已经在特定路径中对补充上下文应用基于发送者的过滤（例如 Slack 线程预填充、Matrix 回复/线程查找）。
- 其他渠道仍会按接收时的原样传递引用/回复/转发上下文。

加固方向（计划中）：

- `contextVisibility: "all"`（默认）保留当前按接收原样的行为。
- `contextVisibility: "allowlist"` 将补充上下文过滤为仅 allowlist 发送者。
- `contextVisibility: "allowlist_quote"` 是 `allowlist` 加上一个显式引用/回复例外。

在这个加固模型尚未在所有渠道中一致实现之前，不同平台之间会存在差异。

![群消息流程](/images/groups-flow.svg)

如果你想要……

| 目标 | 需要设置的内容 |
| ---- | -------------- |
| 允许所有群组，但只在 @ 提及时回复 | `groups: { "*": { requireMention: true } }` |
| 禁用所有群组回复 | `groupPolicy: "disabled"` |
| 只允许特定群组 | `groups: { "<group-id>": { ... } }`（不使用 `"*"` 键） |
| 只有你可以在群组中触发 | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## 会话键名

- 群组会话使用 `agent:<agentId>:<channel>:group:<id>` 会话键名（房间/频道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram forum topics 会将 `:topic:<threadId>` 添加到群组 id 中，因此每个 topic 都有自己的会话。
- 直接聊天使用主会话（或按发送者单独配置时使用各自会话）。
- Heartbeat 会跳过群组会话。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：个人私信 + 公开群组（单智能体）

可以——如果你的“个人”流量是**私信**，而“公开”流量是**群组**，这种方式非常适合。

原因：在单智能体模式下，私信通常会落到**主**会话键名（`agent:main:main`），而群组始终使用**非主**会话键名（`agent:main:<channel>:group:<id>`）。如果你启用 `mode: "non-main"` 的沙箱隔离，这些群组会话会在 Docker 中运行，而你的主私信会话仍保留在主机上运行。

这会给你一个统一的智能体“头脑”（共享工作区 + 记忆），但有两种执行姿态：

- **私信**：完整工具（主机）
- **群组**：沙箱 + 受限工具（Docker）

> 如果你需要真正独立的工作区/人格（“个人”和“公开”绝不能混合），请使用第二个智能体 + bindings。参见 [多智能体路由](/concepts/multi-agent)。

示例（私信在主机上，群组使用沙箱隔离 + 仅消息工具）：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // 群组/频道属于 non-main -> 沙箱隔离
        scope: "session", // 最强隔离（每个群组/频道一个容器）
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // 如果 allow 非空，其余全部会被阻止（deny 仍然优先）。
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

想要“群组只能看到文件夹 X”而不是“无法访问主机”？保持 `workspaceAccess: "none"`，并只将 allowlist 路径挂载到沙箱中：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

相关内容：

- 配置键和默认值：[Gateway 网关配置](/gateway/configuration-reference#agentsdefaultssandbox)
- 调试工具为何被阻止：[沙箱 vs 工具策略 vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)
- 绑定挂载详情：[沙箱隔离](/gateway/sandboxing#custom-bind-mounts)

## 显示标签

- UI 标签在有 `displayName` 时使用它，格式为 `<channel>:<token>`。
- `#room` 保留给房间/频道；群聊使用 `g-<slug>`（小写，空格转为 `-`，保留 `#@+._-`）。

## 群组策略

控制每个渠道如何处理群组/房间消息：

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // 数字 Telegram 用户 id（向导可解析 @username）
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
    },
  },
}
```

| 策略 | 行为 |
| ---- | ---- |
| `"open"` | 群组会绕过 allowlist；提及门控仍然适用。 |
| `"disabled"` | 完全阻止所有群组消息。 |
| `"allowlist"` | 仅允许与已配置 allowlist 匹配的群组/房间。 |

说明：

- `groupPolicy` 与提及门控分离（提及门控要求 @ 提及）。
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo：使用 `groupAllowFrom`（回退：显式 `allowFrom`）。
- 私信配对批准（`*-allowFrom` 存储条目）仅适用于私信访问；群组发送者授权仍需通过群组 allowlist 显式配置。
- Discord：allowlist 使用 `channels.discord.guilds.<id>.channels`。
- Slack：allowlist 使用 `channels.slack.channels`。
- Matrix：allowlist 使用 `channels.matrix.groups`。优先使用房间 ID 或别名；已加入房间的名称查找为尽力而为，未解析的名称会在运行时忽略。使用 `channels.matrix.groupAllowFrom` 来限制发送者；也支持按房间的 `users` allowlist。
- 群组私信单独控制（`channels.discord.dm.*`、`channels.slack.dm.*`）。
- Telegram allowlist 可匹配用户 ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）或用户名（`"@alice"` 或 `"alice"`）；前缀不区分大小写。
- 默认值是 `groupPolicy: "allowlist"`；如果你的群组 allowlist 为空，则群组消息会被阻止。
- 运行时安全性：当某个提供商块完全缺失（`channels.<provider>` 不存在）时，群组策略会回退到失败即关闭模式（通常为 `allowlist`），而不是继承 `channels.defaults.groupPolicy`。

快速心智模型（群组消息的评估顺序）：

1. `groupPolicy`（open/disabled/allowlist）
2. 群组 allowlist（`*.groups`、`*.groupAllowFrom`、渠道专用 allowlist）
3. 提及门控（`requireMention`、`/activation`）

## 提及门控（默认）

除非按群组覆盖，否则群组消息需要提及。默认值位于每个子系统下的 `*.groups."*"`。

回复机器人消息会被视为隐式提及（前提是该渠道支持回复元数据）。这适用于 Telegram、WhatsApp、Slack、Discord 和 Microsoft Teams。

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

说明：

- `mentionPatterns` 是不区分大小写的安全正则模式；无效模式和不安全的嵌套重复形式会被忽略。
- 提供显式提及的平台仍会传入这些信息；这些模式只是回退方案。
- 按智能体覆盖：`agents.list[].groupChat.mentionPatterns`（当多个智能体共享一个群组时很有用）。
- 只有在可以进行提及检测时，才会强制执行提及门控（原生提及或已配置 `mentionPatterns`）。
- Discord 默认值位于 `channels.discord.guilds."*"`（可按 guild/channel 覆盖）。
- 群组历史上下文会在各渠道中统一包装，并且仅包含 **pending-only** 内容（因提及门控而跳过的消息）；使用 `messages.groupChat.historyLimit` 作为全局默认值，使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）进行覆盖。设置为 `0` 可禁用。

## 群组/频道工具限制（可选）

某些渠道配置支持限制**在特定群组/房间/频道内**可用的工具。

- `tools`：为整个群组设置工具 allow/deny。
- `toolsBySender`：群组内按发送者覆盖。
  使用显式键前缀：
  `id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 和 `"*"` 通配符。
  旧的无前缀键仍然接受，并且仅按 `id:` 匹配。

解析顺序（越具体优先级越高）：

1. 群组/频道的 `toolsBySender` 匹配
2. 群组/频道的 `tools`
3. 默认（`"*"`）`toolsBySender` 匹配
4. 默认（`"*"`）`tools`

示例（Telegram）：

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

说明：

- 群组/频道工具限制会与全局/智能体工具策略叠加应用（deny 仍然优先）。
- 某些渠道对房间/频道使用不同的嵌套结构（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。

## 群组 allowlist

当配置了 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 时，这些键会充当群组 allowlist。使用 `"*"` 可允许所有群组，同时仍设置默认提及行为。

一个常见误解是：私信配对批准并不等同于群组授权。
对于支持私信配对的渠道，配对存储仅解锁私信。群组命令仍需要来自配置 allowlist 的显式群组发送者授权，例如 `groupAllowFrom` 或该渠道文档中说明的配置回退项。

常见意图（可直接复制粘贴）：

1. 禁用所有群组回复

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. 仅允许特定群组（WhatsApp）

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. 允许所有群组，但要求提及（显式）

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. 只有所有者可以在群组中触发（WhatsApp）

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## 激活（仅所有者）

群组所有者可以切换每个群组的激活方式：

- `/activation mention`
- `/activation always`

所有者由 `channels.whatsapp.allowFrom` 决定（未设置时则使用机器人的自身 E.164）。请将命令作为独立消息发送。其他平台当前会忽略 `/activation`。

## 上下文字段

群组入站负载会设置：

- `ChatType=group`
- `GroupSubject`（如果已知）
- `GroupMembers`（如果已知）
- `WasMentioned`（提及门控结果）
- Telegram forum topics 还会包含 `MessageThreadId` 和 `IsForum`

渠道专用说明：

- BlueBubbles 可以在填充 `GroupMembers` 之前，先从本地 Contacts 数据库中补充未命名的 macOS 群组参与者信息。此功能默认关闭，且仅在正常群组门控通过后才会运行。

在新群组会话的第一轮中，智能体系统提示会包含群组简介。它会提醒模型像人类一样回复、避免使用 Markdown 表格，并避免输出字面的 `\n` 序列。

## iMessage 细节

- 在路由或 allowlist 中优先使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群组回复始终发回同一个 `chat_id`。

## WhatsApp 细节

有关仅适用于 WhatsApp 的行为（历史注入、提及处理细节），请参见[群消息](/channels/group-messages)。
