---
read_when:
    - 更改群聊行为或提及门控
summary: 跨不同界面上的群聊行为（Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo）
title: 群组
x-i18n:
    generated_at: "2026-04-26T05:36:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa3448638de2f7babb432d0434dd4fb0f3d6ee53cad39627fef313b9023b138c
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw 会在不同界面上以一致方式处理群聊：Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo。

## 新手简介（2 分钟）

OpenClaw “运行”在你自己的消息账号上。没有单独的 WhatsApp 机器人用户。
如果**你**在一个群组里，OpenClaw 就能看到该群组并在那里回复。

默认行为：

- 群组是受限的（`groupPolicy: "allowlist"`）。
- 回复需要提及，除非你明确禁用提及门控。

也就是说：在允许列表中的发送者可以通过提及 OpenClaw 来触发它。

> TL;DR
>
> - **私信访问**由 `*.allowFrom` 控制。
> - **群组访问**由 `*.groupPolicy` + 允许列表（`*.groups`、`*.groupAllowFrom`）控制。
> - **回复触发**由提及门控（`requireMention`、`/activation`）控制。

快速流程（群组消息会发生什么）：

```text
groupPolicy? disabled -> 丢弃
groupPolicy? allowlist -> 群组已允许？否 -> 丢弃
requireMention? yes -> 已提及？否 -> 仅存储为上下文
otherwise -> 回复
```

## 上下文可见性和允许列表

群组安全涉及两种不同的控制：

- **触发授权**：谁可以触发智能体（`groupPolicy`、`groups`、`groupAllowFrom`、渠道特定的允许列表）。
- **上下文可见性**：哪些补充上下文会被注入模型中（回复文本、引用、线程历史、转发元数据）。

默认情况下，OpenClaw 优先保证正常聊天行为，并尽量保留接收到的上下文原样。这意味着允许列表主要决定谁可以触发操作，而不是对每一段引用或历史片段都构成通用的脱敏边界。

当前行为因渠道而异：

- 某些渠道已经在特定路径中对补充上下文应用基于发送者的过滤（例如 Slack 线程预填充、Matrix 回复/线程查询）。
- 其他渠道仍然会按接收到的原样传递引用/回复/转发上下文。

加固方向（计划中）：

- `contextVisibility: "all"`（默认）保留当前按接收原样处理的行为。
- `contextVisibility: "allowlist"` 将补充上下文过滤为仅允许列表中的发送者。
- `contextVisibility: "allowlist_quote"` 表示 `allowlist`，并额外允许一个明确的引用/回复例外。

在这个加固模型尚未在各渠道中一致实现之前，不同界面之间会存在差异。

![群组消息流程](/images/groups-flow.svg)

如果你想要……

| 目标 | 要设置的内容 |
| -------------------------------------------- | ---------------------------------------------------------- |
| 允许所有群组，但只在 @提及时回复 | `groups: { "*": { requireMention: true } }` |
| 禁用所有群组回复 | `groupPolicy: "disabled"` |
| 仅允许特定群组 | `groups: { "<group-id>": { ... } }`（不使用 `"*"` 键） |
| 只有你能在群组中触发 | `groupPolicy: "allowlist"`，`groupAllowFrom: ["+1555..."]` |

## 会话键

- 群组会话使用 `agent:<agentId>:<channel>:group:<id>` 作为会话键（房间/频道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 论坛话题会将 `:topic:<threadId>` 添加到群组 id 中，因此每个话题都有自己的会话。
- 私聊使用主会话（或按配置为每个发送者单独会话）。
- 心跳会跳过群组会话。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：个人私信 + 公共群组（单个智能体）

可以——如果你的“个人”流量是**私信**，而“公共”流量是**群组**，这种方式效果很好。

原因：在单智能体模式下，私信通常会进入**主**会话键（`agent:main:main`），而群组总是使用**非主**会话键（`agent:main:<channel>:group:<id>`）。如果你启用 `mode: "non-main"` 的沙箱隔离，这些群组会话就会在已配置的沙箱后端中运行，而你的主私信会话仍保留在宿主机上。如果你不选择具体后端，默认后端是 Docker。

这样你就拥有一个智能体“中枢”（共享工作区 + memory），但有两种执行姿态：

- **私信**：完整工具（宿主机）
- **群组**：沙箱 + 受限工具

> 如果你需要真正独立的工作区/人格（“个人”和“公共”绝不能混用），请使用第二个智能体 + 绑定。参见 [Multi-Agent Routing](/zh-CN/concepts/multi-agent)。

示例（私信在宿主机上，群组在沙箱中运行 + 仅允许消息类工具）：

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
        // 如果 allow 非空，其他所有内容都会被阻止（deny 仍然优先生效）。
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

想要“群组只能看到文件夹 X”，而不是“完全不能访问宿主机”？保留 `workspaceAccess: "none"`，并只把允许列表中的路径挂载到沙箱中：

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
- 调试为什么某个工具被阻止：[Sandbox vs Tool Policy vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)
- 绑定挂载详情：[沙箱隔离](/zh-CN/gateway/sandboxing#custom-bind-mounts)

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
      groupAllowFrom: ["123456789"], // Telegram 数字用户 id（向导可以解析 @username）
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
| `"open"` | 群组绕过允许列表；提及门控仍然适用。 |
| `"disabled"` | 完全阻止所有群组消息。 |
| `"allowlist"` | 仅允许与已配置允许列表匹配的群组/房间。 |

注意：

- `groupPolicy` 与提及门控是分开的（提及门控要求 @提及）。
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo：使用 `groupAllowFrom`（回退为显式 `allowFrom`）。
- 私信配对批准（`*-allowFrom` 存储条目）仅适用于私信访问；群组发送者授权仍然需要显式配置群组允许列表。
- Discord：允许列表使用 `channels.discord.guilds.<id>.channels`。
- Slack：允许列表使用 `channels.slack.channels`。
- Matrix：允许列表使用 `channels.matrix.groups`。优先使用房间 id 或别名；已加入房间的名称查询属于尽力而为，无法解析的名称会在运行时被忽略。使用 `channels.matrix.groupAllowFrom` 来限制发送者；也支持按房间配置的 `users` 允许列表。
- 群组私信单独控制（`channels.discord.dm.*`、`channels.slack.dm.*`）。
- Telegram 允许列表可以匹配用户 id（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）或用户名（`"@alice"` 或 `"alice"`）；前缀大小写不敏感。
- 默认值是 `groupPolicy: "allowlist"`；如果你的群组允许列表为空，群组消息会被阻止。
- 运行时安全性：当某个提供商的配置块完全缺失（`channels.<provider>` 不存在）时，群组策略会回退到失败即关闭的模式（通常为 `allowlist`），而不是继承 `channels.defaults.groupPolicy`。

快速心智模型（群组消息的评估顺序）：

1. `groupPolicy`（open/disabled/allowlist）
2. 群组允许列表（`*.groups`、`*.groupAllowFrom`、渠道特定允许列表）
3. 提及门控（`requireMention`、`/activation`）

## 提及门控（默认）

群组消息需要提及，除非你按群组覆盖该设置。默认值按各子系统存放在 `*.groups."*"` 下。

当渠道支持回复元数据时，回复机器人消息会被视为隐式提及。
在暴露引用元数据的渠道上，引用机器人消息也可能被视为隐式提及。当前内置支持的情况包括 Telegram、WhatsApp、Slack、Discord、Microsoft Teams 和 ZaloUser。

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

注意：

- `mentionPatterns` 是大小写不敏感的安全正则表达式模式；无效模式和不安全的嵌套重复形式会被忽略。
- 提供显式提及的界面仍然可以通过；这些模式只是回退机制。
- 按智能体覆盖：`agents.list[].groupChat.mentionPatterns`（当多个智能体共享一个群组时很有用）。
- 只有在能够检测提及的情况下才会强制执行提及门控（原生提及，或已配置 `mentionPatterns`）。
- 在允许静默回复的群组中，纯空回复或仅包含推理的模型轮次会被视为静默，与 `NO_REPLY` 等效。私聊仍会把空回复视为一次失败的智能体轮次。
- Discord 默认值位于 `channels.discord.guilds."*"`（可按 guild/频道覆盖）。
- 群组历史上下文会在各渠道之间统一包装，并且仅包含**待处理消息**（即因提及门控而被跳过的消息）；全局默认值使用 `messages.groupChat.historyLimit`，覆盖项使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）。设为 `0` 可禁用。

## 群组/频道工具限制（可选）

某些渠道配置支持限制**特定群组/房间/频道内**可用的工具。

- `tools`：为整个群组允许/拒绝工具。
- `toolsBySender`：群组内按发送者进行覆盖。
  使用明确的键前缀：
  `id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`，以及 `"*"` 通配符。
  旧版无前缀键仍然接受，但仅按 `id:` 匹配。

解析顺序（越具体越优先）：

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

注意：

- 群组/频道工具限制会在全局/智能体工具策略之外额外生效（`deny` 仍然优先生效）。
- 某些渠道对房间/频道使用不同的嵌套方式（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。

## 群组允许列表

当配置了 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 时，这些键会充当群组允许列表。使用 `"*"` 可以允许所有群组，同时仍然设置默认的提及行为。

常见混淆点：私信配对批准不等同于群组授权。
对于支持私信配对的渠道，配对存储只会解锁私信。群组命令仍然需要通过配置允许列表进行显式的群组发送者授权，例如 `groupAllowFrom`，或该渠道文档中说明的配置回退方式。

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

3. 允许所有群组，但要求提及（显式设置）

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

群组所有者可以按群组切换激活方式：

- `/activation mention`
- `/activation always`

所有者由 `channels.whatsapp.allowFrom` 决定（如果未设置，则使用机器人的自身 E.164）。请将该命令作为单独一条消息发送。其他界面当前会忽略 `/activation`。

## 上下文字段

群组入站负载会设置：

- `ChatType=group`
- `GroupSubject`（如果已知）
- `GroupMembers`（如果已知）
- `WasMentioned`（提及门控结果）
- Telegram 论坛话题还会包含 `MessageThreadId` 和 `IsForum`。

渠道特定说明：

- BlueBubbles 可以在填充 `GroupMembers` 之前，选择性地从本地 Contacts 数据库中补全未命名的 macOS 群组参与者信息。此功能默认关闭，且仅会在常规群组门控通过后运行。

智能体系统提示会在新群组会话的第一轮中包含一段群组简介。它会提醒模型像人类一样回复、避免使用 Markdown 表格、尽量减少空行并遵循正常聊天间距，同时避免输入字面量 `\n` 序列。来自渠道的群组名称和参与者标签会以带围栏的不受信任元数据形式呈现，而不是以内联系统指令的方式呈现。

## iMessage 特定说明

- 在路由或加入允许列表时，优先使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群组回复始终会返回到相同的 `chat_id`。

## WhatsApp 系统提示

有关规范的 WhatsApp 系统提示规则，包括群组和私聊提示解析、通配符行为以及账号覆盖语义，请参见 [WhatsApp](/zh-CN/channels/whatsapp#system-prompts)。

## WhatsApp 特定说明

有关仅适用于 WhatsApp 的行为（历史注入、提及处理细节），请参见 [群组消息](/zh-CN/channels/group-messages)。

## 相关内容

- [群组消息](/zh-CN/channels/group-messages)
- [广播群组](/zh-CN/channels/broadcast-groups)
- [渠道路由](/zh-CN/channels/channel-routing)
- [配对](/zh-CN/channels/pairing)
