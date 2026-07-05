---
read_when:
    - 更改群聊行为或提及门控
    - 将 mentionPatterns 限定到特定群组对话
sidebarTitle: Groups
summary: 跨界面的群聊行为（Discord/iMessage/Matrix/Microsoft Teams/QQ Bot/Signal/Slack/Telegram/WhatsApp/Zalo）
title: 群组
x-i18n:
    generated_at: "2026-07-05T11:02:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 28df65cd1b9b682ae72ea8697597a6481b85ee2689479237a2d1896483386907
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw 在支持群组的各类渠道中应用相同的群组规则，包括 Discord、iMessage、Matrix、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 和 Zalo。

对于应始终开启、只提供安静上下文，除非智能体明确发送可见消息的房间，请参阅[环境房间事件](/zh-CN/channels/ambient-room-events)。

## 新手介绍（2 分钟）

OpenClaw “存在于”你自己的消息账号中。没有单独的 WhatsApp Bot 用户：如果**你**在某个群组中，OpenClaw 就可以看到该群组并在其中响应。

默认行为：

- 群组受限（`groupPolicy: "allowlist"`）；群组发送者在加入允许列表前会被阻止。
- 回复需要提及，除非你对某个群组禁用提及门控。
- 最终回复文本会自动发布到房间（`visibleReplies: "automatic"`）。

换句话说：允许列表中的发送者可以通过提及 OpenClaw 来触发它。

<Note>
**简要版**

- **私信访问**由 `*.allowFrom` 控制。
- **群组访问**由 `*.groupPolicy` + 允许列表（`*.groups`、`*.groupAllowFrom`）控制。
- **回复触发**由提及门控（`requireMention`、`/activation`）控制。

</Note>

快速流程（群组消息会发生什么）：

```text
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## 可见回复

对于普通群组/渠道请求，OpenClaw 默认使用 `messages.groupChat.visibleReplies: "automatic"`：最终助手文本会作为可见回复发布到房间。

当共享房间应让智能体通过调用 `message(action=send)` 自行决定何时发言时，请使用 `messages.groupChat.visibleReplies: "message_tool"`。这最适合工具调用可靠的模型（例如 GPT 5.5）。如果模型错过该工具并返回实质性的最终文本，OpenClaw 会将该文本保持为私有，而不是发布到房间。

对于不能可靠遵循仅工具投递的模型或运行时，请使用 `"automatic"`：普通文本最终回复会直接发布到房间，智能体仍可为文件、图片或其他无法随最终文本一起发送的附件调用 `message(action=send)`。

如果消息工具在当前工具策略下不可用，OpenClaw 会回退到自动可见回复，而不是静默抑制响应。`openclaw doctor` 会对此不匹配发出警告。

对于直接聊天和任何其他源事件，`messages.visibleReplies: "message_tool"` 会在全局应用相同的仅工具行为；`messages.groupChat.visibleReplies` 仍是针对群组/渠道房间的更具体覆盖。内部 WebChat 直接轮次默认使用自动最终回复投递，因此 Pi 和 Codex 会收到相同的可见回复契约。

仅工具模式取代了旧模式中强制模型在大多数潜伏模式轮次回答 `NO_REPLY` 的做法。在仅工具模式中，提示词不会定义 `NO_REPLY` 契约；不产生可见输出仅表示不调用消息工具。

插件拥有的对话绑定是例外。一旦插件绑定线程并声明接管入站轮次，插件返回的回复就是可见绑定响应；它不需要 `message(action=send)`。该回复是插件运行时输出，而不是私有模型最终文本。

直接群组请求仍会发送输入状态指示器。启用后，环境始终开启房间事件仍保持严格且安静，除非智能体调用消息工具。

会话默认抑制冗长的工具/进度摘要。调试时使用 `/verbose on`（或 `/verbose full`）为当前会话显示这些摘要，并使用 `/verbose off` 返回仅最终回复行为。详细状态按会话保存，并且在直接聊天、群组、渠道和论坛主题中的工作方式相同。

要将未提及的始终开启群组闲聊作为安静房间上下文提交，而不是作为用户请求，请使用[环境房间事件](/zh-CN/channels/ambient-room-events)：

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

默认值是 `unmentionedInbound: "user_request"`。被提及的消息、命令、中止请求和私信仍是用户请求。

要要求群组/渠道请求的可见输出必须通过消息工具发送：

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

要对每个源聊天都提出此要求：

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

保存文件后，Gateway 网关会在不重启的情况下获取 `messages` 配置变更。只有在配置重载被禁用（`gateway.reload.mode: "off"`）时才需要重启。

命令轮次会绕过 `visibleReplies: "message_tool"` 并始终可见回复：原生斜杠命令（Discord、Telegram 以及其他支持原生命令的界面）和已授权的文本 `/...` 命令都会将响应发布到源聊天。群组中未授权的文本 `/...` 轮次仍保持仅消息工具；普通聊天轮次遵循配置的默认值。

## 上下文可见性和允许列表

群组安全涉及两种不同控制：

- **触发授权**：谁可以触发智能体（`groupPolicy`、`groups`、`groupAllowFrom`、渠道特定允许列表）。
- **上下文可见性**：哪些补充上下文会注入到模型中（回复/引用文本、线程历史、转发元数据）。

默认情况下，OpenClaw 会按收到的内容保留上下文：允许列表决定谁可以触发操作，而不是模型可以看到哪些引用或历史片段。若还要筛选补充上下文，请设置 `contextVisibility`：

| 模式                | 行为                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"`（默认）   | 按收到的内容保留补充上下文。                                           |
| `"allowlist"`       | 仅注入来自允许列表发送者的历史/线程/引用/转发上下文。     |
| `"allowlist_quote"` | `allowlist`，并保留来自任意发送者的明确引用/回复目标消息。 |

可按渠道（`channels.<channel>.contextVisibility`）、按账号（`channels.<channel>.accounts.<accountId>.contextVisibility`）或全局（`channels.defaults.contextVisibility`）设置。会获取补充上下文的渠道（Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp）会在构建入站上下文时应用该策略；未知策略组合会失效关闭并省略上下文。

![群组消息流程](/images/groups-flow.svg)

如果你想要……

| 目标                                         | 要设置的内容                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| 允许所有群组，但只在 @ 提及时回复 | `groups: { "*": { requireMention: true } }`                |
| 禁用所有群组回复                    | `groupPolicy: "disabled"`                                  |
| 仅特定群组                         | `groups: { "<group-id>": { ... } }`（没有 `"*"` 键）         |
| 只有你可以在群组中触发               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| 跨渠道复用一组可信发送者 | `groupAllowFrom: ["accessGroup:operators"]`                |

有关可复用发送者允许列表，请参阅[访问组](/zh-CN/channels/access-groups)。

## 会话键

- 群组会话使用 `agent:<agentId>:<channel>:group:<id>` 会话键（房间/渠道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 论坛主题会在群组 id 后添加 `:topic:<threadId>`，因此每个主题都有自己的会话。
- 直接聊天使用主会话（如果配置了 `session.dmScope`，则使用按发送者划分的会话）。
- Heartbeat 在配置的 Heartbeat 会话中运行（默认：智能体主会话）；群组会话不会运行自己的 Heartbeat。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：个人私信 + 公开群组（单智能体）

可以。如果你的“个人”流量是**私信**，而“公开”流量是**群组**，这种方式效果很好。

原因：在单智能体模式中，私信通常落入**主**会话键（`agent:main:main`），而群组始终使用**非主**会话键（`agent:main:<channel>:group:<id>`）。如果你用 `mode: "non-main"` 启用沙箱隔离，这些群组会话会在配置的沙箱后端中运行，而你的主私信会话仍留在主机上。如果你没有选择后端，Docker 是默认后端。

这为你提供一个智能体“大脑”（共享工作区 + 记忆），但有两种执行姿态：

- **私信**：完整工具（主机）
- **群组**：沙箱 + 受限工具

<Note>
如果你需要真正独立的工作区/身份（“个人”和“公开”绝不能混合），请使用第二个智能体 + 绑定。请参阅[多 Agent 路由](/zh-CN/concepts/multi-agent)。
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
    想要“群组只能看到文件夹 X”，而不是“无主机访问”？保留 `workspaceAccess: "none"`，并只将允许列表中的路径挂载到沙箱中：

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

- 配置键和默认值：[Gateway 配置](/zh-CN/gateway/config-agents#agentsdefaultssandbox)
- 调试工具被阻止的原因：[沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)
- 绑定挂载详情：[沙箱隔离](/zh-CN/gateway/sandboxing#custom-bind-mounts)

## 显示标签

- UI 标签在可用时使用 `displayName`，格式为 `<channel>:<token>`。
- `#room` 保留给房间/渠道；群组聊天使用 `g-<slug>`（小写，空格 -> `-`，保留 `#@+._-`）。很长的不透明 id 会缩短为稳定令牌，而不是将完整路由 id 泄漏到 UI 中。

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
      groupAllowFrom: ["123456789"], // numeric Telegram user id (setup resolves @username)
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
        GUILD_ID: { channels: { help: { enabled: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { enabled: true } },
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
| `"open"`      | 群组绕过允许列表；提及门控仍然适用。                         |
| `"disabled"`  | 完全阻止所有群组消息。                                       |
| `"allowlist"` | 仅允许匹配已配置允许列表的群组/房间。                        |

<AccordionGroup>
  <Accordion title="各渠道说明">
    - `groupPolicy` 独立于提及门控（后者需要 @提及）。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo：使用 `groupAllowFrom`（回退：显式 `allowFrom`）。
    - Signal：`groupAllowFrom` 可以匹配入站 Signal 群组 ID 或发送者电话/UUID。
    - 私信配对审批（`*-allowFrom` 存储条目）仅适用于私信访问；群组发送者授权仍然显式保留在群组允许列表中。
    - Discord：允许列表使用 `channels.discord.guilds.<id>.channels`。
    - Slack：允许列表使用 `channels.slack.channels`。
    - Matrix：允许列表使用 `channels.matrix.groups`。使用房间 ID（`!room:server`）或别名（`#alias:server`）；房间名称键仅在 `channels.matrix.dangerouslyAllowNameMatching: true` 时匹配，未解析的条目会在运行时被忽略。使用 `channels.matrix.groupAllowFrom` 限制发送者；也支持按房间配置的 `users` 允许列表。
    - 群组私信单独控制（`channels.discord.dm.*`、`channels.slack.dm.*`：`groupEnabled`、`groupChannels`）。
    - Telegram：发送者允许列表仅接受数字用户 ID（`"123456789"`；`telegram:`/`tg:` 前缀会以不区分大小写的方式剥离）。`@username` 条目在运行时不匹配，并会记录警告；设置会将 `@username` 解析为 ID。负数聊天 ID 属于 `channels.telegram.groups`，而不是发送者允许列表。
    - 默认值是 `groupPolicy: "allowlist"`；如果你的群组允许列表为空，则会阻止群组消息。
    - 运行时安全：当某个提供商块完全缺失（缺少 `channels.<provider>`）时，群组策略会失败关闭到 `allowlist`，而不是继承 `channels.defaults.groupPolicy`，并且 Gateway 网关会针对每个账户记录一次该回退。

  </Accordion>
</AccordionGroup>

快速心智模型（群组消息的评估顺序）：

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="群组允许列表">
    群组允许列表（`*.groups`、`*.groupAllowFrom`、渠道特定允许列表）。
  </Step>
  <Step title="提及门控">
    提及门控（`requireMention`、`/activation`）。
  </Step>
</Steps>

## 提及门控（默认）

群组消息需要提及，除非按群组覆盖。默认值按子系统位于 `*.groups."*"` 下。

回复机器人消息会在渠道暴露回复元数据时算作隐式提及；引用机器人消息也可能在暴露引用元数据的渠道上算作提及。当前内置情况：Discord、Microsoft Teams、QQ Bot、Slack、Telegram、WhatsApp 和 Zalo Personal。

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

## 限定已配置提及模式的范围

已配置的 `mentionPatterns` 是正则回退触发器。当平台不暴露原生机器人提及，或者像 `openclaw:` 这样的纯文本应算作提及时使用它们。原生平台提及是独立的：当 Discord、Slack、Telegram、Matrix 或其他渠道能够证明消息明确提及了机器人时，即使已配置的正则模式被拒绝，该原生提及仍会触发。

默认情况下，已配置的提及模式会在渠道把提供商和会话事实传入提及检测的所有位置生效。若要避免宽泛模式在每个群组中唤醒智能体，请使用 `channels.<channel>.mentionPatterns` 按渠道限定范围。

当某个渠道默认应关闭正则提及模式时，使用 `mode: "deny"`，然后用 `allowIn` 选择性启用特定房间：

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

当正则提及模式应广泛适用时，使用默认的 `mode: "allow"`（或省略 `mode`），然后用 `denyIn` 在嘈杂房间中关闭它们：

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
| `mode: "allow"` | 除非会话 ID 位于 `denyIn` 中，否则启用正则提及模式。这是默认值。                                                      |
| `mode: "deny"`  | 除非会话 ID 位于 `allowIn` 中，否则禁用正则提及模式。                                                                 |
| `allowIn`       | 在拒绝模式下启用正则提及模式的会话 ID。                                                                               |
| `denyIn`        | 禁用正则提及模式的会话 ID。如果同一个 ID 同时包含在两者中，`denyIn` 优先于 `allowIn`。                                |

当前支持的限定范围正则策略：

| 渠道     | `allowIn` / `denyIn` 中使用的 ID                         |
| -------- | --------------------------------------------------------- |
| Discord  | Discord 渠道 ID。                                         |
| Matrix   | Matrix 房间 ID。                                          |
| Slack    | Slack 渠道 ID。                                           |
| Telegram | 群组聊天 ID，或论坛话题的 `chatId:topic:threadId`。       |
| WhatsApp | WhatsApp 会话 ID，例如 `123@g.us`。                       |

当该渠道支持多个账户时，账户级渠道配置可以在 `channels.<channel>.accounts.<accountId>.mentionPatterns` 下设置相同策略。账户策略优先于该账户的顶层渠道策略。

<AccordionGroup>
  <Accordion title="提及门控说明">
    - `mentionPatterns` 是不区分大小写的安全正则模式；无效模式和不安全的嵌套重复形式会被忽略（并伴随警告）。
    - 模式优先级：`agents.list[].groupChat.mentionPatterns`（当多个智能体共享一个群组时很有用）会覆盖 `messages.groupChat.mentionPatterns`；两者都未设置时，会从智能体身份名称/表情符号派生模式。
    - 仅在可以进行提及检测时（配置了原生提及或 `mentionPatterns`）才强制执行提及门控。
    - 将群组或发送者加入允许列表不会禁用提及门控；当所有消息都应触发时，将该群组的 `requireMention` 设置为 `false`。
    - 自动群组聊天提示上下文会在每个轮次携带已解析的静默回复指令；工作区文件不应重复 `NO_REPLY` 机制。
    - 允许自动静默回复的群组会将干净的空模型轮次或仅推理模型轮次视为静默，等同于 `NO_REPLY`。直接聊天永远不会收到 `NO_REPLY` 指引，而仅消息工具的群组回复会通过不调用 `message(action=send)` 来保持安静。
    - 环境常开群组闲聊默认使用用户请求语义。设置 `messages.groupChat.unmentionedInbound: "room_event"` 可改为将其作为安静上下文提交。有关设置示例，请参阅[环境房间事件](/zh-CN/channels/ambient-room-events)。
    - 房间事件不会作为伪造用户请求存储，来自无消息工具房间事件的私有助手文本也不会作为聊天历史重放。
    - Discord 默认值位于 `channels.discord.guilds."*"`（可按服务器/渠道覆盖）。
    - 群组历史上下文会在各渠道间统一包装。提及门控群组会保留待处理的已跳过消息；当渠道支持时，常开群组也可能保留最近已处理的房间消息。使用 `messages.groupChat.historyLimit` 设置全局默认值，并使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）进行覆盖。设置为 `0` 可禁用。

  </Accordion>
</AccordionGroup>

## 群组/渠道工具限制（可选）

某些渠道配置支持限制**特定群组/房间/渠道内部**可用的工具。

- `tools`：允许/拒绝整个群组的工具（`allow`、`alsoAllow`、`deny`；拒绝优先）。
- `toolsBySender`：群组内的按发送者覆盖。使用显式键前缀：`channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 和 `"*"` 通配符。渠道 ID 使用规范 OpenClaw 渠道 ID；诸如 `teams` 的别名会规范化为 `msteams`。仍接受旧版无前缀键，仅按 `id:` 匹配，并记录弃用警告。

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
群组/渠道工具限制会在全局/智能体工具策略之外额外应用（拒绝仍然优先）。某些渠道对房间/渠道使用不同的嵌套结构（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## 群组允许列表

当配置了 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 时，其键会作为群组允许列表。使用 `"*"` 可允许所有群组，同时仍设置默认提及行为。

<Warning>
常见混淆：私信配对审批不等同于群组授权。对于支持私信配对的渠道，配对存储只解锁私信。群组命令仍然需要来自配置 allowlist 的显式群组发送者授权，例如 `groupAllowFrom`，或该渠道记录的配置回退。
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
  <Tab title="仅所有者可触发（WhatsApp）">
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

群组所有者可以通过一条独立消息切换每个群组的激活状态：

- `/activation mention`
- `/activation always`

`/activation` 是核心的所有者门控命令，并且仅适用于群聊。所有者是指发送者匹配该渠道的 `allowFrom` / `commands.ownerAllowFrom`（未配置 allowlist 时，该账号自身的 id 也算作所有者）。存储的模式会在查询它的渠道（Google Chat、QQ Bot、Telegram、WhatsApp）上覆盖该群组的 `requireMention`，并且群组系统提示引导会在所有位置反映当前激活模式。

## 上下文字段

群组入站 payload 会设置：

- `ChatType=group`
- `GroupSubject`（如果已知）
- `GroupMembers`（如果已知）
- `WasMentioned`（提及门控结果）
- Telegram 论坛主题还会包含 `MessageThreadId` 和 `IsForum`。

智能体系统提示会在新群组会话的第一轮（以及 `/activation` 变更后）包含群组引导。它会提醒模型像真人一样回应，尽量减少空行并遵循正常聊天间距，避免输入字面量 `\n` 序列。非 Telegram 群组也不建议使用 Markdown 表格；Telegram 富文本指导来自 Telegram 渠道提示。来自渠道的群组名称和参与者标签会渲染为代码围栏中的不受信任元数据，而不是内联系统指令。

## iMessage 细节

- 路由或加入 allowlist 时，优先使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群组回复始终发回同一个 `chat_id`。

## WhatsApp 系统提示

请参阅 [WhatsApp](/zh-CN/channels/whatsapp#system-prompts)，了解规范的 WhatsApp 系统提示规则，包括群组和直接提示解析、通配符行为，以及账号覆盖语义。

## WhatsApp 细节

请参阅 [群组消息](/zh-CN/channels/group-messages)，了解仅适用于 WhatsApp 的行为（历史注入、提及处理细节）。

## 相关

- [广播群组](/zh-CN/channels/broadcast-groups)
- [渠道路由](/zh-CN/channels/channel-routing)
- [群组消息](/zh-CN/channels/group-messages)
- [配对](/zh-CN/channels/pairing)
