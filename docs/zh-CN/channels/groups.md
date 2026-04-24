---
read_when:
    - 更改群聊行为或提及门控
summary: 跨各个界面的群聊行为（Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo）
title: 群组
x-i18n:
    generated_at: "2026-04-24T03:37:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: c014d6e08649c8dfd221640435b1d5cf93758bf10b4b6c1a536532e07f622d7b
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw 会在各个界面中一致地处理群聊：Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo。

## 新手简介（2 分钟）

OpenClaw “运行”在你自己的消息账号上。它不会创建一个单独的 WhatsApp 机器人用户。
如果**你**在某个群里，OpenClaw 就能看到这个群，并在其中回复。

默认行为：

- 群组默认受限（`groupPolicy: "allowlist"`）。
- 回复需要提及，除非你明确关闭提及门控。

也就是说：在允许列表中的发送者，可以通过提及 OpenClaw 来触发它。

> TL;DR
>
> - **私信访问**由 `*.allowFrom` 控制。
> - **群组访问**由 `*.groupPolicy` + 允许列表（`*.groups`、`*.groupAllowFrom`）控制。
> - **回复触发**由提及门控（`requireMention`、`/activation`）控制。

快速流程（群消息会发生什么）：

```text
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## 上下文可见性与允许列表

群组安全涉及两个不同的控制项：

- **触发授权**：谁可以触发智能体（`groupPolicy`、`groups`、`groupAllowFrom`、渠道特定的允许列表）。
- **上下文可见性**：哪些补充上下文会被注入模型（回复文本、引用、线程历史、转发元数据）。

默认情况下，OpenClaw 优先保持正常的聊天行为，并尽量保留消息接收时的原始上下文。这意味着，允许列表主要决定谁可以触发操作，而不是对每一段引用或历史片段都统一进行脱敏的边界。

当前行为因渠道而异：

- 某些渠道已经在特定路径中对补充上下文应用了基于发送者的过滤（例如 Slack 线程初始化、Matrix 回复/线程查找）。
- 其他渠道仍会按接收到的原样传递引用/回复/转发上下文。

加固方向（计划中）：

- `contextVisibility: "all"`（默认）保持当前“按接收原样处理”的行为。
- `contextVisibility: "allowlist"` 将补充上下文过滤为仅限允许列表中的发送者。
- `contextVisibility: "allowlist_quote"` 表示 `allowlist`，并额外允许一次明确的引用/回复例外。

在这个加固模型尚未在各渠道中统一实现之前，不同界面的行为会存在差异。

![群消息流程](/images/groups-flow.svg)

如果你想要……

| 目标 | 应设置项 |
| -------------------------------------------- | ---------------------------------------------------------- |
| 允许所有群组，但仅在 `@提及` 时回复 | `groups: { "*": { requireMention: true } }` |
| 禁用所有群组回复 | `groupPolicy: "disabled"` |
| 仅允许特定群组 | `groups: { "<group-id>": { ... } }`（不使用 `"*"` 键） |
| 只有你可以在群组中触发 | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## 会话键

- 群组会话使用 `agent:<agentId>:<channel>:group:<id>` 会话键（房间/频道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 论坛话题会在群组 id 后附加 `:topic:<threadId>`，因此每个话题都有自己的会话。
- 私聊使用主会话（如果已配置，也可以按发送者区分）。
- 群组会话会跳过心跳。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：个人私信 + 公开群组（单个智能体）

可以——如果你的“个人”流量是**私信**，而“公开”流量是**群组**，这种模式效果很好。

原因是：在单智能体模式下，私信通常会进入**主**会话键（`agent:main:main`），而群组始终使用**非主**会话键（`agent:main:<channel>:group:<id>`）。如果你启用 `mode: "non-main"` 的沙箱隔离，这些群组会话会在配置的沙箱后端中运行，而你的主私信会话仍留在宿主机上。如果你没有自行选择后端，Docker 是默认后端。

这样你就得到一个智能体“大脑”（共享工作区 + 记忆），但具备两种执行姿态：

- **私信**：完整工具（宿主机）
- **群组**：沙箱 + 受限工具

> 如果你需要真正分离的工作区/人格（“个人”和“公开”绝不能混在一起），请使用第二个智能体 + 绑定。参见 [Multi-Agent Routing](/zh-CN/concepts/multi-agent)。

示例（私信运行在宿主机上，群组使用沙箱隔离 + 仅消息类工具）：

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

如果你想要的不是“无宿主机访问”，而是“群组只能看到文件夹 X”，请保留 `workspaceAccess: "none"`，并且只把允许列表中的路径挂载到沙箱中：

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

- 配置键与默认值：[Gateway 配置](/zh-CN/gateway/config-agents#agentsdefaultssandbox)
- 调试某个工具为何被阻止：[沙箱隔离 vs 工具策略 vs 提权](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)
- 绑定挂载详情：[沙箱隔离](/zh-CN/gateway/sandboxing#custom-bind-mounts)

## 显示标签

- UI 标签在可用时使用 `displayName`，格式为 `<channel>:<token>`。
- `#room` 保留给房间/频道；群聊使用 `g-<slug>`（小写，空格替换为 `-`，保留 `#@+._-`）。

## 群组策略

按渠道控制如何处理群组/房间消息：

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
| `"open"` | 群组会绕过允许列表；但提及门控仍然生效。 |
| `"disabled"` | 完全阻止所有群组消息。 |
| `"allowlist"` | 只允许与已配置允许列表匹配的群组/房间。 |

说明：

- `groupPolicy` 与提及门控是分开的（提及门控要求 `@提及`）。
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo：使用 `groupAllowFrom`（回退为显式 `allowFrom`）。
- 私信配对批准（`*-allowFrom` 存储项）仅适用于私信访问；群组发送者授权仍需明确配置到群组允许列表中。
- Discord：允许列表使用 `channels.discord.guilds.<id>.channels`。
- Slack：允许列表使用 `channels.slack.channels`。
- Matrix：允许列表使用 `channels.matrix.groups`。优先使用房间 ID 或别名；已加入房间的名称查找为尽力而为，运行时无法解析的名称会被忽略。使用 `channels.matrix.groupAllowFrom` 来限制发送者；也支持按房间配置 `users` 允许列表。
- 群组私信单独控制（`channels.discord.dm.*`、`channels.slack.dm.*`）。
- Telegram 允许列表可匹配用户 ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）或用户名（`"@alice"` 或 `"alice"`）；前缀不区分大小写。
- 默认值是 `groupPolicy: "allowlist"`；如果你的群组允许列表为空，群组消息会被阻止。
- 运行时安全：当某个提供商配置块完全缺失（`channels.<provider>` 不存在）时，群组策略会回退到故障关闭模式（通常是 `allowlist`），而不是继承 `channels.defaults.groupPolicy`。

快速心智模型（群组消息的评估顺序）：

1. `groupPolicy`（open/disabled/allowlist）
2. 群组允许列表（`*.groups`、`*.groupAllowFrom`、渠道特定允许列表）
3. 提及门控（`requireMention`、`/activation`）

## 提及门控（默认）

除非按群组单独覆盖，否则群组消息需要提及。默认值按各子系统存放在 `*.groups."*"` 下。

当渠道支持回复元数据时，回复机器人消息会被视为隐式提及。
在提供引用元数据的渠道上，引用机器人消息也可能被视为隐式提及。当前内置支持的情况包括 Telegram、WhatsApp、Slack、Discord、Microsoft Teams 和 ZaloUser。

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

- `mentionPatterns` 是不区分大小写的安全正则模式；无效模式以及不安全的嵌套重复形式会被忽略。
- 提供显式提及能力的界面仍会正常通过；这些模式只是回退方案。
- 可按智能体覆盖：`agents.list[].groupChat.mentionPatterns`（当多个智能体共享同一个群组时很有用）。
- 只有在可以检测提及的情况下，才会强制执行提及门控（即存在原生提及或已配置 `mentionPatterns`）。
- Discord 默认值位于 `channels.discord.guilds."*"`（可按 guild/频道覆盖）。
- 群组历史上下文会在各渠道中统一包装，并且仅限**待处理消息**（即因提及门控而被跳过的消息）；全局默认值使用 `messages.groupChat.historyLimit`，覆盖项使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）。设为 `0` 可禁用。

## 群组/频道工具限制（可选）

某些渠道配置支持限制**特定群组/房间/频道内**可用的工具。

- `tools`：为整个群组设置工具 allow/deny。
- `toolsBySender`：按群组内发送者设置覆盖规则。
  使用显式键前缀：
  `id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 以及 `"*"` 通配符。
  旧版无前缀键仍然接受，但只会按 `id:` 匹配。

解析顺序（越具体优先级越高）：

1. 群组/频道 `toolsBySender` 匹配
2. 群组/频道 `tools`
3. 默认值（`"*"`）`toolsBySender` 匹配
4. 默认值（`"*"`）`tools`

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

- 群组/频道工具限制会在全局/智能体工具策略之外额外生效（`deny` 仍然优先）。
- 某些渠道对房间/频道使用不同的嵌套结构（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。

## 群组允许列表

当配置了 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 时，这些键会作为群组允许列表。使用 `"*"` 可以允许所有群组，同时仍然设置默认的提及行为。

一个常见误解是：私信配对批准并不等同于群组授权。
对于支持私信配对的渠道，配对存储只会解锁私信。群组命令仍然需要来自配置允许列表的显式群组发送者授权，例如 `groupAllowFrom`，或该渠道文档中说明的配置回退项。

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

## 激活方式（仅限所有者）

群组所有者可以按群组切换激活方式：

- `/activation mention`
- `/activation always`

所有者由 `channels.whatsapp.allowFrom` 决定（如果未设置，则使用机器人自身的 E.164）。请将该命令作为单独的一条消息发送。其他界面当前会忽略 `/activation`。

## 上下文字段

群组入站负载会设置：

- `ChatType=group`
- `GroupSubject`（如果已知）
- `GroupMembers`（如果已知）
- `WasMentioned`（提及门控结果）
- Telegram 论坛话题还会包含 `MessageThreadId` 和 `IsForum`。

渠道特定说明：

- BlueBubbles 可以选择在填充 `GroupMembers` 之前，先从本地通讯录数据库补全未命名的 macOS 群组参与者。此功能默认关闭，并且只有在正常的群组门控通过后才会运行。

智能体系统提示会在新群组会话的第一轮中加入一段群组介绍。它会提醒模型像人类一样回复、避免使用 Markdown 表格、尽量减少空行、遵循正常聊天的空格习惯，并避免输入字面量 `\n` 序列。来自渠道的群组名称和参与者标签会以带围栏的非可信元数据形式呈现，而不是以内联系统指令的形式出现。

## iMessage 细节

- 在路由或允许列表中，优先使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群组回复始终会返回到相同的 `chat_id`。

## WhatsApp 系统提示

有关规范的 WhatsApp 系统提示规则，包括群组与私聊提示解析、通配符行为以及账号覆盖语义，请参见 [WhatsApp](/zh-CN/channels/whatsapp#system-prompts)。

## WhatsApp 细节

有关仅适用于 WhatsApp 的行为（历史注入、提及处理细节），请参见 [群消息](/zh-CN/channels/group-messages)。

## 相关内容

- [群消息](/zh-CN/channels/group-messages)
- [广播群组](/zh-CN/channels/broadcast-groups)
- [渠道路由](/zh-CN/channels/channel-routing)
- [配对](/zh-CN/channels/pairing)
