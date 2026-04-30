---
read_when:
    - 更改群聊行为或提及门控
sidebarTitle: Groups
summary: 各平台的群聊行为（Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo）
title: 群组
x-i18n:
    generated_at: "2026-04-30T13:58:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a675d14c0c9b236c960b8401e2771af355735ef23c7cf3697e273d452ecdf8d
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw 在各个接入端对群聊的处理保持一致：Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo。

## 新手简介（2 分钟）

OpenClaw “存在于”你自己的消息账号中。没有单独的 WhatsApp 机器人用户。如果**你**在某个群组中，OpenClaw 就能看到该群组并在那里响应。

默认行为：

- 群组受到限制（`groupPolicy: "allowlist"`）。
- 除非你明确禁用提及门控，否则回复需要提及。
- 群组/渠道中的普通最终回复默认是私密的。可见的房间输出使用 `message` 工具。

换句话说：允许列表中的发送者可以通过提及 OpenClaw 来触发它。

<Note>
**简而言之**

- **私信访问**由 `*.allowFrom` 控制。
- **群组访问**由 `*.groupPolicy` + 允许列表（`*.groups`、`*.groupAllowFrom`）控制。
- **回复触发**由提及门控（`requireMention`、`/activation`）控制。

</Note>

快速流程（群组消息会发生什么）：

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## 可见回复

对于群组/渠道房间，OpenClaw 默认使用 `messages.groupChat.visibleReplies: "message_tool"`。
这意味着智能体仍会处理该轮对话，并且可以更新记忆/会话状态，但它的普通最终回答不会自动发回房间。要可见地发言，智能体会使用 `message(action=send)`。

对于直接聊天和任何其他来源轮次，使用 `messages.visibleReplies: "message_tool"` 可在全局应用同样的仅工具可见回复行为。`messages.groupChat.visibleReplies` 仍然是针对群组/渠道房间的更具体覆盖项。

这取代了旧模式，即强制模型在大多数潜伏模式轮次中回答 `NO_REPLY`。在仅工具模式中，不产生任何可见输出只是意味着不调用 message 工具。

当智能体在仅工具模式中工作时，仍会发送输入状态指示器。对于这些轮次，默认群组输入状态模式会从 "message" 升级为 "instant"，因为在智能体决定是否调用 message 工具之前，可能永远不会有普通助手消息文本。显式的输入状态模式配置仍然优先生效。

要恢复群组/渠道房间的旧版自动最终回复：

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

文件保存后，Gateway 网关会热重载 `messages` 配置。只有在部署中禁用了文件监听或配置重载时，才需要重启。

要要求每个来源聊天的可见输出都通过 message 工具：

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

原生命令斜杠命令（Discord、Telegram，以及其他支持原生命令的接入端）会绕过 `visibleReplies: "message_tool"`，并始终可见地回复，以便渠道原生命令 UI 获得它预期的响应。这只适用于经过验证的原生命令轮次；文本输入的 `/...` 命令和普通聊天轮次仍遵循已配置的群组默认值。

## 上下文可见性和允许列表

群组安全涉及两种不同控制：

- **触发授权**：谁可以触发智能体（`groupPolicy`、`groups`、`groupAllowFrom`、渠道特定允许列表）。
- **上下文可见性**：哪些补充上下文会注入模型（回复文本、引用、线程历史、转发元数据）。

默认情况下，OpenClaw 优先保持正常聊天行为，并尽量按接收时的样子保留上下文。这意味着允许列表主要决定谁可以触发操作，而不是对每个引用片段或历史片段都适用的通用遮盖边界。

<AccordionGroup>
  <Accordion title="Current behavior is channel-specific">
    - 一些渠道已经在特定路径中对补充上下文应用基于发送者的过滤（例如 Slack 线程种子填充、Matrix 回复/线程查找）。
    - 其他渠道仍会按接收时的样子传递引用/回复/转发上下文。

  </Accordion>
  <Accordion title="Hardening direction (planned)">
    - `contextVisibility: "all"`（默认）保持当前按接收内容处理的行为。
    - `contextVisibility: "allowlist"` 将补充上下文过滤为允许列表中的发送者。
    - `contextVisibility: "allowlist_quote"` 是 `allowlist` 加上一个显式引用/回复例外。

    在这个加固模型于各渠道中一致实现之前，预计不同接入端之间会存在差异。

  </Accordion>
</AccordionGroup>

![群组消息流程](/images/groups-flow.svg)

如果你想要……

| 目标                                         | 要设置的内容                                               |
| -------------------------------------------- | ---------------------------------------------------------- |
| 允许所有群组，但只在 @提及时回复 | `groups: { "*": { requireMention: true } }`                |
| 禁用所有群组回复                    | `groupPolicy: "disabled"`                                  |
| 只允许特定群组                         | `groups: { "<group-id>": { ... } }`（没有 `"*"` 键）         |
| 只有你可以在群组中触发               | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |

## 会话键

- 群组会话使用 `agent:<agentId>:<channel>:group:<id>` 会话键（房间/渠道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 论坛主题会向群组 ID 添加 `:topic:<threadId>`，因此每个主题都有自己的会话。
- 直接聊天使用主会话（如果已配置，也可以按发送者分开）。
- 群组会话会跳过 Heartbeat。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：个人私信 + 公共群组（单智能体）

可以，这在你的“个人”流量是**私信**、你的“公共”流量是**群组**时效果很好。

原因：在单智能体模式中，私信通常进入**主**会话键（`agent:main:main`），而群组始终使用**非主**会话键（`agent:main:<channel>:group:<id>`）。如果你启用 `mode: "non-main"` 的沙箱隔离，这些群组会话会在配置的沙箱后端中运行，而你的主私信会话仍保留在宿主机上。如果你不选择后端，Docker 是默认后端。

这会给你一个智能体“大脑”（共享工作区 + 记忆），但有两种执行姿态：

- **私信**：完整工具（宿主机）
- **群组**：沙箱 + 受限工具

<Note>
如果你需要真正分离的工作区/人格（“个人”和“公共”绝不能混合），请使用第二个智能体 + 绑定。请参阅 [Multi-Agent Routing](/zh-CN/concepts/multi-agent)。
</Note>

<Tabs>
  <Tab title="DMs on host, groups sandboxed">
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
  </Tab>
  <Tab title="Groups see only an allowlisted folder">
    想要“群组只能看到文件夹 X”，而不是“没有宿主机访问权限”？保留 `workspaceAccess: "none"`，并且只将允许列表中的路径挂载进沙箱：

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

  </Tab>
</Tabs>

相关内容：

- 配置键和默认值：[Gateway 网关配置](/zh-CN/gateway/config-agents#agentsdefaultssandbox)
- 调试工具为何被阻止：[沙箱 vs 工具策略 vs 提权](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)
- 绑定挂载详情：[沙箱隔离](/zh-CN/gateway/sandboxing#custom-bind-mounts)

## 显示标签

- UI 标签会在可用时使用 `displayName`，格式化为 `<channel>:<token>`。
- `#room` 保留给房间/渠道；群聊使用 `g-<slug>`（小写，空格 -> `-`，保留 `#@+._-`）。

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

| 策略        | 行为                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | 群组会绕过允许列表；提及门控仍然适用。      |
| `"disabled"`  | 完全阻止所有群组消息。                           |
| `"allowlist"` | 只允许匹配已配置允许列表的群组/房间。 |

<AccordionGroup>
  <Accordion title="Per-channel notes">
    - `groupPolicy` 与提及门控是分开的（后者需要 @提及）。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo：使用 `groupAllowFrom`（回退：显式 `allowFrom`）。
    - 私信配对批准（`*-allowFrom` 存储条目）只适用于私信访问；群组发送者授权仍显式使用群组允许列表。
    - Discord：允许列表使用 `channels.discord.guilds.<id>.channels`。
    - Slack：允许列表使用 `channels.slack.channels`。
    - Matrix：允许列表使用 `channels.matrix.groups`。优先使用房间 ID 或别名；已加入房间的名称查找是尽力而为，未解析的名称会在运行时被忽略。使用 `channels.matrix.groupAllowFrom` 来限制发送者；也支持每个房间的 `users` 允许列表。
    - 群组私信单独控制（`channels.discord.dm.*`、`channels.slack.dm.*`）。
    - Telegram 允许列表可以匹配用户 ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）或用户名（`"@alice"` 或 `"alice"`）；前缀不区分大小写。
    - 默认值是 `groupPolicy: "allowlist"`；如果你的群组允许列表为空，群组消息会被阻止。
    - 运行时安全：当提供商块完全缺失（不存在 `channels.<provider>`）时，群组策略会回退到故障关闭模式（通常是 `allowlist`），而不是继承 `channels.defaults.groupPolicy`。

  </Accordion>
</AccordionGroup>

快速心智模型（群组消息的评估顺序）：

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="Group allowlists">
    群组允许列表（`*.groups`、`*.groupAllowFrom`、渠道特定允许列表）。
  </Step>
  <Step title="Mention gating">
    提及门控（`requireMention`、`/activation`）。
  </Step>
</Steps>

## 提及门控（默认）

除非按群组覆盖，否则群组消息需要提及。默认值位于每个子系统的 `*.groups."*"` 下。

回复机器人消息在渠道支持回复元数据时会计为隐式提及。引用机器人消息在暴露引用元数据的渠道上也可以计为隐式提及。当前内置情况包括 Telegram、WhatsApp、Slack、Discord、Microsoft Teams 和 ZaloUser。

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

<AccordionGroup>
  <Accordion title="提及门控说明">
    - `mentionPatterns` 是大小写不敏感的安全正则表达式模式；无效模式和不安全的嵌套重复形式会被忽略。
    - 提供显式提及的表面仍会通过；模式只是回退方案。
    - 按智能体覆盖：`agents.list[].groupChat.mentionPatterns`（当多个智能体共享一个群组时很有用）。
    - 只有在可以检测提及时，才会强制执行提及门控（已配置原生提及或 `mentionPatterns`）。
    - 群聊提示上下文会在每一轮携带已解析的静默回复指令；工作区文件不应重复 `NO_REPLY` 机制。
    - 允许静默回复的群组会将干净的空模型轮次或仅推理模型轮次视为静默，等同于 `NO_REPLY`。只有在显式允许直接静默回复时，直接聊天才会执行相同行为；否则空回复仍会保留为失败的智能体轮次。
    - Discord 默认值位于 `channels.discord.guilds."*"`（可按服务器/渠道覆盖）。
    - 群组历史上下文会在各渠道中统一包装，并且**仅限待处理消息**（因提及门控而跳过的消息）；使用 `messages.groupChat.historyLimit` 设置全局默认值，并使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）进行覆盖。设置为 `0` 可禁用。

  </Accordion>
</AccordionGroup>

## 群组/渠道工具限制（可选）

某些渠道配置支持限制**特定群组/房间/渠道内**可用的工具。

- `tools`：允许/拒绝整个群组的工具。
- `toolsBySender`：群组内按发送者覆盖。使用显式键前缀：`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 和 `"*"` 通配符。旧版无前缀键仍会被接受，并且仅按 `id:` 匹配。

解析顺序（最具体者优先）：

<Steps>
  <Step title="群组 toolsBySender">
    群组/渠道 `toolsBySender` 匹配。
  </Step>
  <Step title="群组 tools">
    群组/渠道 `tools`。
  </Step>
  <Step title="默认 toolsBySender">
    默认（`"*"`）`toolsBySender` 匹配。
  </Step>
  <Step title="默认 tools">
    默认（`"*"`）`tools`。
  </Step>
</Steps>

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

<Note>
群组/渠道工具限制会在全局/智能体工具策略之外额外应用（拒绝仍然优先）。某些渠道对房间/渠道使用不同嵌套结构（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## 群组允许列表

配置 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 时，这些键会作为群组允许列表。使用 `"*"` 可允许所有群组，同时仍设置默认提及行为。

<Warning>
常见混淆：私信配对批准不等同于群组授权。对于支持私信配对的渠道，配对存储只会解锁私信。群组命令仍需要来自配置允许列表的显式群组发送者授权，例如 `groupAllowFrom`，或该渠道文档记录的配置回退。
</Warning>

常见意图（复制/粘贴）：

<Tabs>
  <Tab title="禁用所有群组回复">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="仅允许特定群组（WhatsApp）">
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
  </Tab>
  <Tab title="允许所有群组但要求提及">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="仅所有者触发（WhatsApp）">
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
  </Tab>
</Tabs>

## 激活（仅所有者）

群组所有者可以切换每个群组的激活状态：

- `/activation mention`
- `/activation always`

所有者由 `channels.whatsapp.allowFrom`（或未设置时由机器人的自身 E.164）确定。将命令作为独立消息发送。其他表面目前会忽略 `/activation`。

## 上下文字段

群组入站载荷会设置：

- `ChatType=group`
- `GroupSubject`（如果已知）
- `GroupMembers`（如果已知）
- `WasMentioned`（提及门控结果）
- Telegram 论坛话题还包括 `MessageThreadId` 和 `IsForum`。

渠道特定说明：

- BlueBubbles 可以在填充 `GroupMembers` 之前，可选地从本地通讯录数据库补充未命名的 macOS 群组参与者。此功能默认关闭，并且只会在正常群组门控通过后运行。

智能体系统提示会在新群组会话的第一轮包含群组介绍。它会提醒模型像人一样回复、避免 Markdown 表格、尽量减少空行并遵循正常聊天间距，以及避免输入字面量 `\n` 序列。渠道来源的群组名称和参与者标签会呈现为围栏包裹的不受信元数据，而不是内联系统指令。

## iMessage 细节

- 路由或加入允许列表时优先使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群组回复始终返回到同一个 `chat_id`。

## WhatsApp 系统提示

请参阅 [WhatsApp](/zh-CN/channels/whatsapp#system-prompts)，了解规范的 WhatsApp 系统提示规则，包括群组和直接提示解析、通配符行为以及账号覆盖语义。

## WhatsApp 细节

请参阅[群组消息](/zh-CN/channels/group-messages)，了解仅适用于 WhatsApp 的行为（历史注入、提及处理细节）。

## 相关内容

- [广播群组](/zh-CN/channels/broadcast-groups)
- [渠道路由](/zh-CN/channels/channel-routing)
- [群组消息](/zh-CN/channels/group-messages)
- [配对](/zh-CN/channels/pairing)
