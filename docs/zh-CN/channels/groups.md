---
read_when:
    - 更改群聊行为或提及门控
summary: 跨各个界面中的群聊行为（Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo）
title: 群组
x-i18n:
    generated_at: "2026-04-26T04:25:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9a2351e35560ddbf66ba6879da778936b54fd49b18a6d1146bbf700e07eb3e9
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw 在各个界面上的群聊处理方式保持一致：Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo。

## 新手简介（2 分钟）

OpenClaw “运行”在你自己的消息账号上。不存在单独的 WhatsApp 机器人账号。
如果**你**在某个群组里，OpenClaw 就可以看到该群组并在那里回复。

默认行为：

- 群组受限（`groupPolicy: "allowlist"`）。
- 回复需要提及，除非你明确禁用提及门控。

也就是说：被列入允许名单的发送者，可以通过提及 OpenClaw 来触发它。

> TL;DR
>
> - **私信访问**由 `*.allowFrom` 控制。
> - **群组访问**由 `*.groupPolicy` + 允许名单（`*.groups`、`*.groupAllowFrom`）控制。
> - **回复触发**由提及门控控制（`requireMention`、`/activation`）。

快速流程（群组消息会发生什么）：

```
groupPolicy? disabled -> 丢弃
groupPolicy? allowlist -> 群组允许？否 -> 丢弃
requireMention? yes -> 已提及？否 -> 仅存储用于上下文
otherwise -> 回复
```

## 上下文可见性与允许名单

群组安全涉及两种不同的控制：

- **触发授权**：谁可以触发智能体（`groupPolicy`、`groups`、`groupAllowFrom`、特定渠道的允许名单）。
- **上下文可见性**：哪些补充上下文会注入到模型中（回复文本、引用、线程历史、转发元数据）。

默认情况下，OpenClaw 优先保证正常聊天行为，并尽量按接收到的原样保留上下文。这意味着允许名单主要决定谁可以触发操作，而不是针对每一段引用内容或历史片段的通用脱敏边界。

当前行为因渠道而异：

- 某些渠道已经在特定路径中对补充上下文应用基于发送者的过滤（例如 Slack 线程种子、Matrix 回复/线程查找）。
- 其他渠道仍会按接收到的原样传递引用/回复/转发上下文。

加固方向（计划中）：

- `contextVisibility: "all"`（默认）保留当前“按接收原样处理”的行为。
- `contextVisibility: "allowlist"` 将补充上下文过滤为仅来自允许名单发送者。
- `contextVisibility: "allowlist_quote"` 表示 `allowlist`，再加一个显式的引用/回复例外。

在这个加固模型还未在各个渠道中一致实现之前，你应预期不同界面之间会有差异。

![群组消息流程](/images/groups-flow.svg)

如果你想要……

| 目标 | 应设置内容 |
| -------------------------------------------- | ---------------------------------------------------------- |
| 允许所有群组，但仅在 @提及时回复 | `groups: { "*": { requireMention: true } }` |
| 禁用所有群组回复 | `groupPolicy: "disabled"` |
| 仅限特定群组 | `groups: { "<group-id>": { ... } }`（不使用 `"*"` 键） |
| 只有你可以在群组中触发 | `groupPolicy: "allowlist"`，`groupAllowFrom: ["+1555..."]` |

## 会话键

- 群组会话使用 `agent:<agentId>:<channel>:group:<id>` 会话键（房间/频道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram forum topics 会在群组 id 后附加 `:topic:<threadId>`，因此每个主题都有自己的会话。
- 直接聊天使用主会话（或者如果已配置，则按发送者区分）。
- 群组会话会跳过心跳。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：个人私信 + 公共群组（单智能体）

可以——如果你的“个人”流量是**私信**，而“公共”流量是**群组**，这种方式效果很好。

原因是：在单智能体模式下，私信通常会进入**主**会话键（`agent:main:main`），而群组始终使用**非主**会话键（`agent:main:<channel>:group:<id>`）。如果你启用 `mode: "non-main"` 的沙箱隔离，这些群组会话就会在配置的沙箱后端中运行，而你的主私信会话仍保留在宿主机上。如果你没有选择特定后端，默认后端是 Docker。

这样你就拥有一个智能体“大脑”（共享工作区 + 记忆），但有两种执行姿态：

- **私信**：完整工具（宿主机）
- **群组**：沙箱 + 受限工具

> 如果你需要真正分离的工作区/人格（“个人”和“公共”绝不能混用），请使用第二个智能体 + 绑定。参见 [Multi-Agent Routing](/zh-CN/concepts/multi-agent)。

示例（私信在宿主机上运行，群组使用沙箱 + 仅消息工具）：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels are non-main -> sandboxed
        scope: "session", // strongest isolation (one container per group/channel)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // If allow is non-empty, everything else is blocked (deny still wins).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

如果你想要“群组只能看到文件夹 X”，而不是“完全无宿主机访问权限”，请保持 `workspaceAccess: "none"`，并且仅将允许名单中的路径挂载到沙箱中：

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

- 配置键和默认值：[Gateway 网关配置](/zh-CN/gateway/config-agents#agentsdefaultssandbox)
- 调试工具为什么被阻止：[沙箱隔离 vs 工具策略 vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)
- bind mounts 详情：[沙箱隔离](/zh-CN/gateway/sandboxing#custom-bind-mounts)

## 显示标签

- UI 标签在可用时使用 `displayName`，格式为 `<channel>:<token>`。
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
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
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
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| 策略 | 行为 |
| ------------- | ------------------------------------------------------------ |
| `"open"` | 群组绕过允许名单；提及门控仍然适用。 |
| `"disabled"` | 完全阻止所有群组消息。 |
| `"allowlist"` | 仅允许与已配置允许名单匹配的群组/房间。 |

说明：

- `groupPolicy` 与提及门控是分开的（提及门控要求 @提及）。
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo：使用 `groupAllowFrom`（回退为显式 `allowFrom`）。
- 私信配对批准（`*-allowFrom` 存储项）仅适用于私信访问；群组发送者授权仍需在群组允许名单中显式配置。
- Discord：允许名单使用 `channels.discord.guilds.<id>.channels`。
- Slack：允许名单使用 `channels.slack.channels`。
- Matrix：允许名单使用 `channels.matrix.groups`。优先使用房间 ID 或别名；已加入房间的名称查找是尽力而为的，运行时无法解析的名称会被忽略。使用 `channels.matrix.groupAllowFrom` 来限制发送者；也支持按房间配置的 `users` 允许名单。
- 群组私信单独控制（`channels.discord.dm.*`、`channels.slack.dm.*`）。
- Telegram 允许名单可匹配用户 ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）或用户名（`"@alice"` 或 `"alice"`）；前缀大小写不敏感。
- 默认值是 `groupPolicy: "allowlist"`；如果你的群组允许名单为空，群组消息会被阻止。
- 运行时安全性：当某个提供商配置块完全缺失（不存在 `channels.<provider>`）时，群组策略会回退到故障关闭模式（通常是 `allowlist`），而不是继承 `channels.defaults.groupPolicy`。

快速心智模型（群组消息的评估顺序）：

1. `groupPolicy`（open/disabled/allowlist）
2. 群组允许名单（`*.groups`、`*.groupAllowFrom`、特定渠道的允许名单）
3. 提及门控（`requireMention`、`/activation`）

## 提及门控（默认）

除非按群组覆盖，否则群组消息需要提及。默认值按各子系统存放在 `*.groups."*"` 下。

当渠道支持回复元数据时，回复机器人消息会被视为隐式提及。
在提供引用元数据的渠道上，引用机器人消息也可被视为隐式提及。当前内置支持的情况包括 Telegram、WhatsApp、Slack、Discord、Microsoft Teams 和 ZaloUser。

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

- `mentionPatterns` 是大小写不敏感的安全正则模式；无效模式和不安全的嵌套重复形式会被忽略。
- 提供显式提及的界面仍然会通过；这些模式只是回退方案。
- 按智能体覆盖：`agents.list[].groupChat.mentionPatterns`（当多个智能体共享一个群组时很有用）。
- 只有在可以检测提及的情况下，才会强制执行提及门控（原生提及或已配置 `mentionPatterns`）。
- 在允许静默回复的始终开启群组中，模型返回的干净空回复会被视为静默，相当于 `NO_REPLY`。提及门控群组和直接聊天仍会将空回复视为一次失败的智能体轮次。
- Discord 默认值位于 `channels.discord.guilds."*"` 下（可按 guild/channel 覆盖）。
- 群组历史上下文在各渠道间使用统一封装，并且仅限 **pending-only**（即因提及门控而被跳过的消息）；使用 `messages.groupChat.historyLimit` 作为全局默认值，使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）进行覆盖。设为 `0` 可禁用。

## 群组/频道工具限制（可选）

某些渠道配置支持限制**特定群组/房间/频道内**可用的工具。

- `tools`：为整个群组允许/拒绝工具。
- `toolsBySender`：群组内按发送者进行覆盖。
  使用显式键前缀：
  `id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`，以及 `"*"` 通配符。
  旧的无前缀键仍然接受，但只会按 `id:` 进行匹配。

解析顺序（越具体优先级越高）：

1. 群组/频道 `toolsBySender` 匹配
2. 群组/频道 `tools`
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

- 群组/频道工具限制会在全局/智能体工具策略之外额外应用（`deny` 仍然优先）。
- 某些渠道对房间/频道使用不同的嵌套结构（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。

## 群组允许名单

当配置了 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 时，这些键会作为群组允许名单。使用 `"*"` 可允许所有群组，同时仍设置默认的提及行为。

常见误解：私信配对批准不等于群组授权。
对于支持私信配对的渠道，配对存储仅解锁私信。群组命令仍然需要通过配置允许名单进行显式的群组发送者授权，例如 `groupAllowFrom` 或该渠道文档中说明的配置回退项。

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

3. 允许所有群组，但要求提及（显式配置）

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

群组所有者可以切换每个群组的激活状态：

- `/activation mention`
- `/activation always`

所有者由 `channels.whatsapp.allowFrom` 决定（如果未设置，则使用机器人自身的 E.164）。请将命令作为独立消息发送。其他界面当前会忽略 `/activation`。

## 上下文字段

群组入站负载会设置：

- `ChatType=group`
- `GroupSubject`（如果已知）
- `GroupMembers`（如果已知）
- `WasMentioned`（提及门控结果）
- Telegram forum topics 还会包含 `MessageThreadId` 和 `IsForum`。

特定渠道说明：

- BlueBubbles 可在填充 `GroupMembers` 之前，选择性地从本地 Contacts 数据库中补充未命名的 macOS 群组参与者信息。此功能默认关闭，并且仅会在正常群组门控通过后运行。

智能体系统提示会在新群组会话的第一轮包含一个群组简介。它会提醒模型像人类一样回复、避免使用 Markdown 表格、尽量减少空行、遵循正常聊天间距，并避免输入字面量 `\n` 序列。来自渠道的群组名称和参与者标签会作为加围栏的不受信任元数据呈现，而不是内联系统指令。

## iMessage 特定说明

- 在路由或加入允许名单时，优先使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群组回复始终发送回同一个 `chat_id`。

## WhatsApp 系统提示

有关规范的 WhatsApp 系统提示规则，包括群组和私聊提示解析、通配符行为以及账号覆盖语义，请参见 [WhatsApp](/zh-CN/channels/whatsapp#system-prompts)。

## WhatsApp 特定说明

有关 WhatsApp 专属行为（历史注入、提及处理细节），请参见 [群组消息](/zh-CN/channels/group-messages)。

## 相关内容

- [群组消息](/zh-CN/channels/group-messages)
- [广播群组](/zh-CN/channels/broadcast-groups)
- [渠道路由](/zh-CN/channels/channel-routing)
- [配对](/zh-CN/channels/pairing)
