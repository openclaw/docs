---
read_when:
    - 更改群聊行为或提及门控
    - 将 mentionPatterns 限定到特定群组对话
sidebarTitle: Groups
summary: 各端的群聊行为（Discord/iMessage/Matrix/Microsoft Teams/QQ Bot/Signal/Slack/Telegram/WhatsApp/Zalo）
title: 群组
x-i18n:
    generated_at: "2026-06-27T01:21:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48660e36ac642956842d453fd4caf2cbd7f4193efee9ac864fd7cf700c3c43b6
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw 在各个界面中一致处理群聊：Discord、iMessage、Matrix、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp、Zalo。

对于应提供安静上下文、除非智能体明确发送可见消息才发言的常驻房间，请参阅[环境房间事件](/zh-CN/channels/ambient-room-events)。

## 新手介绍（2 分钟）

OpenClaw “驻留”在你自己的消息账号中。没有单独的 WhatsApp Bot 用户。如果**你**在某个群组中，OpenClaw 就能看到该群组并在那里回复。

默认行为：

- 群组受限（`groupPolicy: "allowlist"`）。
- 回复需要提及，除非你明确停用提及门控。
- 群组/渠道中的可见回复默认使用 `message` 工具。

换句话说：允许列表中的发送者可以通过提及 OpenClaw 来触发它。

<Note>
**太长不看**

- **私信访问**由 `*.allowFrom` 控制。
- **群组访问**由 `*.groupPolicy` + 允许列表（`*.groups`、`*.groupAllowFrom`）控制。
- **回复触发**由提及门控（`requireMention`、`/activation`）控制。

</Note>

快速流程（群组消息会发生什么）：

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## 可见回复

对于普通群组/渠道请求，OpenClaw 默认使用 `messages.groupChat.visibleReplies: "automatic"`。最终的助手文本会通过旧版可见回复路径发布，除非你将该房间选择加入仅消息工具输出。

当共享房间应让智能体通过调用 `message(action=send)` 来决定何时发言时，使用 `messages.groupChat.visibleReplies: "message_tool"`。这最适合由最新一代、工具可靠的模型（例如 GPT 5.5）支持的群组房间。如果模型漏掉该工具并返回实质性最终文本，OpenClaw 会将该最终文本保持为私有，而不是发布到房间。

对于较弱的模型或无法可靠理解仅工具投递的运行时，使用 `"automatic"`。在自动模式下，智能体的最终助手文本就是可见源回复路径，因此无法稳定调用 `message(action=send)` 的模型仍可正常回答。

在自动模式下，普通文本最终回复会直接发布到房间。如果可见回复需要文件、图像或其他附件，智能体仍可对该附件使用 `message(action=send)`，而不是尝试强行通过最终文本回复发送。

如果消息工具在当前工具策略下不可用，OpenClaw 会回退到自动可见回复，而不是静默抑制响应。`openclaw doctor` 会对此不匹配发出警告。

对于直接聊天和任何其他源事件，使用 `messages.visibleReplies: "message_tool"` 可全局应用相同的仅工具可见回复行为。内部 WebChat 直接轮次默认使用自动最终回复投递，因此 Pi 和 Codex 会收到相同的可见回复契约。设置 `messages.visibleReplies: "message_tool"` 可有意要求用 `message(action=send)` 生成可见输出。`messages.groupChat.visibleReplies` 仍是针对群组/渠道房间的更具体覆盖。

这取代了旧模式：强制模型在大多数旁观模式轮次中回答 `NO_REPLY`。在仅工具模式下，提示词不会定义 `NO_REPLY` 契约。不产生可见动作仅表示不调用消息工具。

插件拥有的会话绑定是例外。一旦插件绑定线程并声明接管入站轮次，插件返回的回复就是可见绑定响应；它不需要 `message(action=send)`。该回复是插件运行时输出，而不是私有模型最终文本。

对于直接群组请求，仍会发送输入指示器。启用环境常驻房间事件时，除非智能体调用消息工具，否则这些事件会保持严格且安静。

会话默认抑制冗长的工具/进度摘要。调试时使用 `/verbose on` 可为当前会话显示这些摘要，使用 `/verbose off` 可恢复到仅最终回复行为。同一个详细状态会应用于直接聊天、群组、渠道和论坛主题。

若要将未提及的常驻群组闲聊作为安静房间上下文提交，而不是作为用户请求，请使用[环境房间事件](/zh-CN/channels/ambient-room-events)：

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

默认值为 `unmentionedInbound: "user_request"`。

被提及的消息、命令、中止请求和私信仍会保留为用户请求。

若要要求群组/渠道请求的可见输出通过消息工具发送：

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

文件保存后，Gateway 网关会热重载 `messages` 配置。只有在部署中禁用文件监听或配置重载时才需要重启。

若要要求每个源聊天的可见输出都通过消息工具发送：

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

原生斜杠命令（Discord、Telegram，以及其他支持原生命令的界面）会绕过 `visibleReplies: "message_tool"`，并始终可见地回复，以便渠道原生命令 UI 获得它预期的响应。这仅适用于经过验证的原生命令轮次；以文本键入的 `/...` 命令和普通聊天轮次仍遵循配置的群组默认值。

## 上下文可见性和允许列表

群组安全涉及两个不同控制项：

- **触发授权**：谁可以触发智能体（`groupPolicy`、`groups`、`groupAllowFrom`、渠道特定允许列表）。
- **上下文可见性**：哪些补充上下文会注入到模型中（回复文本、引用、线程历史、转发元数据）。

默认情况下，OpenClaw 优先保持正常聊天行为，并尽量按接收到的样子保留上下文。这意味着允许列表主要决定谁可以触发操作，而不是为每个引用或历史片段提供通用脱敏边界。

<AccordionGroup>
  <Accordion title="当前行为因渠道而异">
    - 某些渠道已经在特定路径中对补充上下文应用基于发送者的过滤（例如 Slack 线程播种、Matrix 回复/线程查找）。
    - 其他渠道仍会按接收到的样子传递引用/回复/转发上下文。

  </Accordion>
  <Accordion title="加固方向（计划中）">
    - `contextVisibility: "all"`（默认）保留当前按接收内容处理的行为。
    - `contextVisibility: "allowlist"` 将补充上下文过滤为仅允许列表中的发送者。
    - `contextVisibility: "allowlist_quote"` 是 `allowlist` 加上一个显式引用/回复例外。

    在此加固模型在各渠道中一致实现之前，预期不同界面会存在差异。

  </Accordion>
</AccordionGroup>

![群组消息流程](/images/groups-flow.svg)

如果你想要……

| 目标                                         | 应设置的内容                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| 允许所有群组，但只在 @提及时回复 | `groups: { "*": { requireMention: true } }`                |
| 停用所有群组回复                    | `groupPolicy: "disabled"`                                  |
| 仅特定群组                         | `groups: { "<group-id>": { ... } }`（没有 `"*"` 键）         |
| 只有你可以在群组中触发               | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |
| 跨渠道复用一组受信任发送者 | `groupAllowFrom: ["accessGroup:operators"]`                |

有关可复用的发送者允许列表，请参阅[访问组](/zh-CN/channels/access-groups)。

## 会话键

- 群组会话使用 `agent:<agentId>:<channel>:group:<id>` 会话键（房间/渠道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 论坛主题会在群组 ID 后添加 `:topic:<threadId>`，因此每个主题都有自己的会话。
- 直接聊天使用主会话（或在配置后按发送者使用单独会话）。
- 群组会话会跳过 Heartbeat。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：个人私信 + 公开群组（单智能体）

可以。如果你的“个人”流量是**私信**，而“公开”流量是**群组**，这种方式很合适。

原因：在单智能体模式下，私信通常落入**主**会话键（`agent:main:main`），而群组始终使用**非主**会话键（`agent:main:<channel>:group:<id>`）。如果你使用 `mode: "non-main"` 启用沙箱隔离，这些群组会话会在配置的沙箱后端中运行，而你的主私信会话仍保留在主机上。如果你未选择后端，Docker 是默认后端。

这样你会得到一个智能体“大脑”（共享工作区 + 记忆），但有两种执行姿态：

- **私信**：完整工具（主机）
- **群组**：沙箱 + 受限工具

<Note>
如果你需要真正独立的工作区/人格（“个人”和“公开”绝不能混合），请使用第二个智能体 + 绑定。请参阅[多智能体路由](/zh-CN/concepts/multi-agent)。
</Note>

<Tabs>
  <Tab title="私信在主机上，群组沙箱隔离">
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
  <Tab title="群组只能看到允许列表中的文件夹">
    想要“群组只能看到文件夹 X”，而不是“无法访问主机”？保留 `workspaceAccess: "none"`，并仅将允许列表中的路径挂载到沙箱中：

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

相关：

- 配置键和默认值：[Gateway 网关配置](/zh-CN/gateway/config-agents#agentsdefaultssandbox)
- 调试工具为何被阻止：[沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)
- 绑定挂载详情：[沙箱隔离](/zh-CN/gateway/sandboxing#custom-bind-mounts)

## 显示标签

- UI 标签在可用时使用 `displayName`，格式为 `<channel>:<token>`。
- `#room` 为房间/渠道保留；群聊使用 `g-<slug>`（小写，空格 -> `-`，保留 `#@+._-`）。

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

| 策略          | 行为                                                         |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | 群组绕过允许列表；提及门控仍然生效。                         |
| `"disabled"`  | 完全阻止所有群组消息。                                       |
| `"allowlist"` | 仅允许与已配置允许列表匹配的群组/房间。                      |

<AccordionGroup>
  <Accordion title="Per-channel notes">
    - `groupPolicy` 与提及门控（需要 @提及）相互独立。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo：使用 `groupAllowFrom`（回退：显式 `allowFrom`）。
    - Signal：`groupAllowFrom` 可以匹配入站 Signal 群组 ID，也可以匹配发送者手机号/UUID。
    - 私信配对审批（`*-allowFrom` 存储条目）仅适用于私信访问；群组发送者授权仍然显式使用群组允许列表。
    - Discord：允许列表使用 `channels.discord.guilds.<id>.channels`。
    - Slack：允许列表使用 `channels.slack.channels`。
    - Matrix：允许列表使用 `channels.matrix.groups`。优先使用房间 ID 或别名；已加入房间的名称查找是尽力而为，未解析的名称会在运行时被忽略。使用 `channels.matrix.groupAllowFrom` 限制发送者；也支持按房间配置的 `users` 允许列表。
    - 群组私信单独控制（`channels.discord.dm.*`、`channels.slack.dm.*`）。
    - Telegram 允许列表可以匹配用户 ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）或用户名（`"@alice"` 或 `"alice"`）；前缀不区分大小写。
    - 默认值是 `groupPolicy: "allowlist"`；如果你的群组允许列表为空，群组消息会被阻止。
    - 运行时安全性：当提供商块完全缺失（不存在 `channels.<provider>`）时，群组策略会回退到故障关闭模式（通常是 `allowlist`），而不是继承 `channels.defaults.groupPolicy`。

  </Accordion>
</AccordionGroup>

快速心智模型（群组消息的求值顺序）：

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="Group allowlists">
    群组允许列表（`*.groups`、`*.groupAllowFrom`、特定渠道允许列表）。
  </Step>
  <Step title="Mention gating">
    提及门控（`requireMention`、`/activation`）。
  </Step>
</Steps>

## 提及门控（默认）

除非按群组覆盖，否则群组消息需要提及。默认值位于每个子系统的 `*.groups."*"` 下。

当渠道支持回复元数据时，回复机器人消息会算作隐式提及。在暴露引用元数据的渠道上，引用机器人消息也可以算作隐式提及。当前内置场景包括 Telegram、WhatsApp、Slack、Discord、Microsoft Teams 和 ZaloUser。

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

## 限定已配置提及模式的作用域

已配置的 `mentionPatterns` 是正则表达式回退触发器。当平台不暴露原生机器人提及，或者你希望像 `openclaw:` 这样的纯文本算作提及时，请使用它们。原生平台提及是独立的：当 Discord、Slack、Telegram、Matrix 或其他渠道能够证明消息明确提及了机器人时，即使已配置的正则表达式模式被拒绝，该原生提及仍会触发。

默认情况下，已配置的提及模式会应用于该渠道传递提供商和会话事实到提及检测的所有位置。为了避免宽泛模式在每个群组中唤醒智能体，请使用 `channels.<channel>.mentionPatterns` 按渠道限定其作用域。

当某个渠道默认应关闭正则表达式提及模式时，使用 `mode: "deny"`，然后通过 `allowIn` 选择性启用特定房间：

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b", "\\bops bot\\b"],
    },
  },
  channels: {
    slack: {
      mentionPatterns: {
        mode: "deny",
        allowIn: ["C0123OPS"],
      },
    },
  },
}
```

当正则表达式提及模式应广泛应用时，使用默认的 `mode: "allow"`（或省略 `mode`），然后通过 `denyIn` 在嘈杂房间中关闭：

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
  channels: {
    telegram: {
      mentionPatterns: {
        denyIn: ["-1001234567890", "-1001234567890:topic:42"],
      },
    },
  },
}
```

策略解析：

| 字段            | 效果                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | 除非会话 ID 位于 `denyIn` 中，否则启用正则表达式提及模式。这是默认值。                                                |
| `mode: "deny"`  | 除非会话 ID 位于 `allowIn` 中，否则禁用正则表达式提及模式。                                                          |
| `allowIn`       | 在拒绝模式下启用正则表达式提及模式的会话 ID。                                                                        |
| `denyIn`        | 禁用正则表达式提及模式的会话 ID。如果 `denyIn` 和 `allowIn` 都包含同一个 ID，则 `denyIn` 优先。                       |

当前支持的作用域化正则表达式策略：

| 渠道     | `allowIn` / `denyIn` 中使用的 ID                              |
| -------- | ------------------------------------------------------------ |
| Discord  | Discord 渠道 ID。                                           |
| Matrix   | Matrix 房间 ID。                                            |
| Slack    | Slack 渠道 ID。                                             |
| Telegram | 群聊 ID，或用于论坛话题的 `chatId:topic:threadId`。          |
| WhatsApp | WhatsApp 会话 ID，例如 `123@g.us`。                         |

当该渠道支持多个账号时，账号级渠道配置可以在 `channels.<channel>.accounts.<accountId>.mentionPatterns` 下设置相同策略。账号策略优先于该账号的顶层渠道策略。

<AccordionGroup>
  <Accordion title="Mention gating notes">
    - `mentionPatterns` 是不区分大小写的安全正则表达式模式；无效模式和不安全的嵌套重复形式会被忽略。
    - 提供显式提及的表面仍会通过；已配置的正则表达式模式只是回退。
    - `channels.<channel>.mentionPatterns.mode: "deny"` 会默认禁用该渠道的已配置提及模式；用 `allowIn` 将选定会话重新启用。
    - `channels.<channel>.mentionPatterns.denyIn` 会针对特定会话 ID 禁用已配置提及模式，同时原生平台 @提及仍会通过。
    - 按智能体覆盖：`agents.list[].groupChat.mentionPatterns`（多个智能体共享一个群组时很有用）。
    - 仅当可以进行提及检测时（存在原生提及或已配置 `mentionPatterns`），才会强制执行提及门控。
    - 将群组或发送者加入允许列表不会禁用提及门控；当所有消息都应触发时，将该群组的 `requireMention` 设置为 `false`。
    - 自动群聊提示上下文会在每个轮次携带已解析的静默回复指令；工作区文件不应重复 `NO_REPLY` 机制。
    - 在允许自动静默回复的群组中，干净的空模型轮次或仅推理模型轮次会被视为静默，等同于 `NO_REPLY`。直接聊天永远不会收到 `NO_REPLY` 指引，而仅使用消息工具的群组回复会通过不调用 `message(action=send)` 来保持安静。
    - 环境中的常开群组闲聊默认使用用户请求语义。设置 `messages.groupChat.unmentionedInbound: "room_event"` 可改为将其作为安静上下文提交。设置示例见 [环境房间事件](/zh-CN/channels/ambient-room-events)。
    - 房间事件不会作为伪造的用户请求存储，并且来自无消息工具房间事件的私有助手文本不会作为聊天历史重放。
    - Discord 默认值位于 `channels.discord.guilds."*"`（可按服务器/渠道覆盖）。
    - 群组历史上下文会在各渠道中统一包装。启用提及门控的群组会保留待处理的已跳过消息；当渠道支持时，常开群组也可以保留最近处理过的房间消息。使用 `messages.groupChat.historyLimit` 设置全局默认值，使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）进行覆盖。设置为 `0` 可禁用。

  </Accordion>
</AccordionGroup>

## 群组/渠道工具限制（可选）

某些渠道配置支持限制**特定群组/房间/渠道内**可用的工具。

- `tools`：允许/拒绝整个群组的工具。
- `toolsBySender`：群组内按发送者覆盖。使用显式键前缀：`channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 和 `"*"` 通配符。渠道 ID 使用规范 OpenClaw 渠道 ID；诸如 `teams` 的别名会规范化为 `msteams`。旧版无前缀键仍会被接受，并且仅按 `id:` 匹配。

解析顺序（最具体者优先）：

<Steps>
  <Step title="Group toolsBySender">
    群组/渠道 `toolsBySender` 匹配。
  </Step>
  <Step title="Group tools">
    群组/渠道 `tools`。
  </Step>
  <Step title="Default toolsBySender">
    默认（`"*"`）`toolsBySender` 匹配。
  </Step>
  <Step title="Default tools">
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
群组/渠道工具限制会在全局/智能体工具策略之外额外应用（拒绝仍然优先）。某些渠道对房间/渠道使用不同的嵌套方式（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## 群组允许列表

当配置了 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 时，这些键会作为群组允许列表。使用 `"*"` 可允许所有群组，同时仍然设置默认提及行为。

<Warning>
常见混淆：私信配对审批不等同于群组授权。对于支持私信配对的渠道，配对存储只解锁私信。群组命令仍需要来自配置允许列表的显式群组发送者授权，例如 `groupAllowFrom`，或该渠道记录在文档中的配置回退。
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

所有者由 `channels.whatsapp.allowFrom` 决定（未设置时为机器人的自身 E.164）。请将该命令作为独立消息发送。其他表面目前会忽略 `/activation`。

## 上下文字段

群组入站载荷会设置：

- `ChatType=group`
- `GroupSubject`（如果已知）
- `GroupMembers`（如果已知）
- `WasMentioned`（提及门控结果）
- Telegram 论坛主题还包含 `MessageThreadId` 和 `IsForum`。

智能体系统提示会在新群组会话的第一轮包含群组介绍。它会提醒模型像真人一样回应、尽量减少空行并遵循正常聊天间距，以及避免输入字面量 `\n` 序列。非 Telegram 群组还不建议使用 Markdown 表格；Telegram 富文本指导来自 Telegram 渠道提示。渠道来源的群组名称和参与者标签会呈现为围栏包裹的不受信任元数据，而不是内联系统指令。

## iMessage 细节

- 路由或加入允许列表时优先使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群组回复始终返回同一个 `chat_id`。

## WhatsApp 系统提示

有关规范的 WhatsApp 系统提示规则，请参阅 [WhatsApp](/zh-CN/channels/whatsapp#system-prompts)，包括群组和直接提示解析、通配符行为以及账号覆盖语义。

## WhatsApp 细节

有关仅限 WhatsApp 的行为（历史注入、提及处理细节），请参阅 [群组消息](/zh-CN/channels/group-messages)。

## 相关

- [广播群组](/zh-CN/channels/broadcast-groups)
- [频道路由](/zh-CN/channels/channel-routing)
- [群组消息](/zh-CN/channels/group-messages)
- [配对](/zh-CN/channels/pairing)
