---
read_when:
    - 更改群聊行为或提及门控机制
    - 将 mentionPatterns 限定到特定群组会话
sidebarTitle: Groups
summary: 跨不同平台的群聊行为（Discord/iMessage/Matrix/Microsoft Teams/QQ Bot/Signal/Slack/Telegram/WhatsApp/Zalo）
title: 群组
x-i18n:
    generated_at: "2026-07-11T20:19:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b19356e801e0b44c8409b1eef59a32357977104d46a138934757c4e8a00ed44c
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw 在所有支持群组的渠道中应用相同的群组规则，包括 Discord、iMessage、Matrix、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 和 Zalo。

对于应始终保持开启、仅在智能体明确发送可见消息时才发言，其他时候只提供安静上下文的房间，请参阅[环境房间事件](/zh-CN/channels/ambient-room-events)。

## 新手简介（2 分钟）

OpenClaw “驻留”在你自己的消息账户中。它没有独立的 WhatsApp Bot 用户：只要**你**在某个群组中，OpenClaw 就能看到该群组并在其中回复。

默认行为：

- 群组受到限制（`groupPolicy: "allowlist"`）；群组发送者在加入允许列表前会被阻止。
- 除非你为某个群组禁用提及门控，否则回复需要提及。
- 最终回复文本会自动发布到房间（`visibleReplies: "automatic"`）。

换句话说：允许列表中的发送者可以通过提及 OpenClaw 来触发它。

<Note>
**简而言之**

- **私信访问权限**由 `*.allowFrom` 控制。
- **群组访问权限**由 `*.groupPolicy` 和允许列表（`*.groups`、`*.groupAllowFrom`）控制。
- **回复触发方式**由提及门控（`requireMention`、`/activation`）控制。

</Note>

快速流程（群组消息的处理过程）：

```text
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## 可见回复

对于普通的群组/渠道请求，OpenClaw 默认使用 `messages.groupChat.visibleReplies: "automatic"`：智能体的最终文本会作为可见回复发布到房间。

如果共享房间应由智能体通过调用 `message(action=send)` 来决定何时发言，请使用 `messages.groupChat.visibleReplies: "message_tool"`。此模式最适合能可靠使用工具的模型（例如 GPT-5.6 Sol）。如果模型未调用该工具，却返回了实质性的最终文本，OpenClaw 会将该文本保留为私密内容，而不会发布到房间。

对于无法可靠遵循“仅通过工具交付”要求的模型或运行时，请使用 `"automatic"`：普通的最终文本会直接发布到房间，智能体仍可调用 `message(action=send)` 来发送无法随最终文本一同交付的文件、图像或其他附件。

如果当前工具策略不允许使用消息工具，OpenClaw 会回退到自动发送可见回复，而不是静默抑制响应。`openclaw doctor` 会对此不匹配情况发出警告。

对于直接聊天和任何其他来源事件，`messages.visibleReplies: "message_tool"` 会在全局应用相同的“仅通过工具交付”行为；`messages.groupChat.visibleReplies` 仍是针对群组/渠道房间的更具体覆盖项。内部 WebChat 直接轮次默认自动交付最终回复，以便 Pi 和 Codex 获得相同的可见回复契约。

仅工具模式取代了旧有做法：不再强制模型在大多数潜水模式轮次中回复 `NO_REPLY`。在仅工具模式下，提示词不会定义 `NO_REPLY` 契约；不产生任何可见内容只意味着不调用消息工具。

由插件管理的对话绑定属于例外。一旦插件绑定某个线程并接管传入轮次，插件返回的回复就是可见的绑定响应；它无需调用 `message(action=send)`。该回复是插件运行时输出，而不是模型的私密最终文本。

对于直接的群组请求，仍会发送正在输入指示。启用后，环境型始终开启的房间事件仍会保持严格和安静，除非智能体调用消息工具。

默认情况下，会话会抑制冗长的工具/进度摘要。调试时，使用 `/verbose on`（或 `/verbose full`）在当前会话中显示这些摘要；使用 `/verbose off` 恢复为仅显示最终回复的行为。详细输出状态按会话保存，并且在直接聊天、群组、渠道和论坛主题中的行为相同。

若要将未提及智能体的始终开启群组闲聊作为安静的房间上下文提交，而不是作为用户请求，请使用[环境房间事件](/zh-CN/channels/ambient-room-events)：

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

默认值为 `unmentionedInbound: "user_request"`。提及消息、命令、中止请求和私信仍作为用户请求处理。

若要要求群组/渠道请求的可见输出必须通过消息工具发送：

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

若要对每个来源聊天都提出此要求：

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

文件保存后，Gateway 网关无需重启即可加载 `messages` 配置更改。仅当配置重新加载已禁用（`gateway.reload.mode: "off"`）时才需要重启。

命令轮次会绕过 `visibleReplies: "message_tool"` 并始终以可见方式回复：原生斜杠命令（Discord、Telegram 以及其他支持原生命令的界面）和已授权的文本 `/...` 命令都会将响应发布到来源聊天。群组中未经授权的文本 `/...` 轮次仍只能通过消息工具回复；普通聊天轮次遵循已配置的默认值。

## 上下文可见性和允许列表

群组安全涉及两种不同的控制机制：

- **触发授权**：谁可以触发智能体（`groupPolicy`、`groups`、`groupAllowFrom`、渠道专用允许列表）。
- **上下文可见性**：向模型注入哪些补充上下文（回复/引用文本、线程历史记录、转发元数据）。

默认情况下，OpenClaw 会原样保留接收到的上下文：允许列表决定谁能触发操作，而不决定模型能看到哪些引用片段或历史片段。若还要筛选补充上下文，请设置 `contextVisibility`：

| 模式                | 行为                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"`（默认）   | 原样保留接收到的补充上下文。                                           |
| `"allowlist"`       | 仅注入来自允许列表发送者的历史记录/线程/引用/转发上下文。     |
| `"allowlist_quote"` | 与 `allowlist` 相同，但另外保留任何发送者被明确引用或回复的消息。 |

可按渠道（`channels.<channel>.contextVisibility`）、按账户（`channels.<channel>.accounts.<accountId>.contextVisibility`）或全局（`channels.defaults.contextVisibility`）设置。会获取补充上下文的渠道（Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp）在构建传入上下文时会应用此策略；未知的策略组合会以失败关闭方式处理，并省略上下文。

![群组消息流程](/images/groups-flow.svg)

如果你想要……

| 目标                                         | 应设置的内容                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| 允许所有群组，但仅在 @提及时回复 | `groups: { "*": { requireMention: true } }`                |
| 禁用所有群组回复                    | `groupPolicy: "disabled"`                                  |
| 仅允许特定群组                         | `groups: { "<group-id>": { ... } }`（无 `"*"` 键）         |
| 群组中只有你可以触发智能体               | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |
| 跨渠道复用一组可信发送者 | `groupAllowFrom: ["accessGroup:operators"]`                |

有关可复用的发送者允许列表，请参阅[访问组](/zh-CN/channels/access-groups)。

## 会话键

- 群组会话使用 `agent:<agentId>:<channel>:group:<id>` 会话键（房间/渠道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 论坛主题会在群组 ID 后添加 `:topic:<threadId>`，因此每个主题都有自己的会话。
- 直接聊天使用主会话（如果配置了 `session.dmScope`，则使用按发送者划分的会话）。
- Heartbeat 在已配置的心跳会话中运行（默认为智能体主会话）；群组会话不会运行自己的 Heartbeat。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：个人私信 + 公共群组（单智能体）

可以——如果你的“个人”流量是**私信**，“公共”流量是**群组**，这种模式效果很好。

原因是：在单智能体模式下，私信通常进入**主**会话键（`agent:main:main`），而群组始终使用**非主**会话键（`agent:main:<channel>:group:<id>`）。如果启用 `mode: "non-main"` 沙箱隔离，这些群组会话将在已配置的沙箱后端中运行，而你的主私信会话仍在主机上运行。如果你未选择后端，则默认使用 Docker。

这样，你可以拥有一个智能体“大脑”（共享工作区和记忆），但采用两种执行方式：

- **私信**：完整工具（主机）
- **群组**：沙箱 + 受限工具

<Note>
如果你需要真正独立的工作区/角色（“个人”和“公共”绝不能混合），请使用第二个智能体和绑定。请参阅[多智能体路由](/zh-CN/concepts/multi-agent)。
</Note>

<Tabs>
  <Tab title="私信在主机上运行，群组在沙箱中运行">
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
    想让“群组只能看到文件夹 X”，而不是“无法访问主机”？请保留 `workspaceAccess: "none"`，并仅将允许列表中的路径挂载到沙箱：

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

- 配置键和默认值：[Gateway 配置](/zh-CN/gateway/config-agents#agentsdefaultssandbox)
- 调试工具为何被阻止：[沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)
- 绑定挂载详情：[沙箱隔离](/zh-CN/gateway/sandboxing#custom-bind-mounts)

## 显示标签

- UI 标签在 `displayName` 可用时使用该值，并格式化为 `<channel>:<token>`。
- `#room` 保留用于房间/渠道；群聊使用 `g-<slug>`（小写，空格 -> `-`，保留 `#@+._-`）。对于很长的不透明 ID，会将其缩短为稳定令牌，以免在 UI 中泄露完整的路由 ID。

## 群组策略

控制各渠道处理群组/房间消息的方式：

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

| 策略          | 行为                                                   |
| ------------- | ------------------------------------------------------ |
| `"open"`      | 群组绕过允许列表；提及门控仍然适用。                   |
| `"disabled"`  | 完全阻止所有群组消息。                                 |
| `"allowlist"` | 仅允许与已配置允许列表匹配的群组或房间。               |

<AccordionGroup>
  <Accordion title="各渠道说明">
    - `groupPolicy` 与提及门控（要求 @提及）相互独立。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo：使用 `groupAllowFrom`（回退项：显式的 `allowFrom`）。
    - Signal：`groupAllowFrom` 可以匹配入站 Signal 群组 ID 或发送者的电话号码/UUID。
    - 私信配对审批（`*-allowFrom` 存储条目）仅适用于私信访问；群组发送者授权仍需在群组允许列表中显式配置。
    - Discord：允许列表使用 `channels.discord.guilds.<id>.channels`。
    - Slack：允许列表使用 `channels.slack.channels`。
    - Matrix：允许列表使用 `channels.matrix.groups`。使用房间 ID（`!room:server`）或别名（`#alias:server`）；仅当 `channels.matrix.dangerouslyAllowNameMatching: true` 时，房间名称键才会匹配，运行时会忽略无法解析的条目。使用 `channels.matrix.groupAllowFrom` 限制发送者；也支持按房间配置 `users` 允许列表。
    - 群组私信单独控制（`channels.discord.dm.*`、`channels.slack.dm.*`：`groupEnabled`、`groupChannels`）。
    - Telegram：发送者允许列表仅接受数字用户 ID（`"123456789"`；会以不区分大小写的方式移除 `telegram:`/`tg:` 前缀）。`@username` 条目在运行时不会匹配，并会记录警告；设置流程会将 `@username` 解析为 ID。负数聊天 ID 应配置在 `channels.telegram.groups` 下，而不是发送者允许列表中。
    - 默认值为 `groupPolicy: "allowlist"`；如果群组允许列表为空，则会阻止群组消息。
    - 运行时安全性：当提供商配置块完全缺失（不存在 `channels.<provider>`）时，群组策略会以关闭方式回退到 `allowlist`，而不会继承 `channels.defaults.groupPolicy`，并且 Gateway 网关会为每个账户记录一次该回退。

  </Accordion>
</AccordionGroup>

快速理解模型（群组消息的评估顺序）：

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（开放/禁用/允许列表）。
  </Step>
  <Step title="群组允许列表">
    群组允许列表（`*.groups`、`*.groupAllowFrom`、渠道专用允许列表）。
  </Step>
  <Step title="提及门控">
    提及门控（`requireMention`、`/activation`）。
  </Step>
</Steps>

## 提及门控（默认）

群组消息默认需要提及，除非按群组覆盖此行为。默认值位于各子系统的 `*.groups."*"` 下。

当渠道提供回复元数据时，回复机器人消息会被视为隐式提及；在提供引用元数据的渠道中，引用机器人消息也可以被视为提及。目前内置支持的渠道包括：Discord、Microsoft Teams、QQ Bot、Slack、Telegram、WhatsApp 和 Zalo Personal。

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

已配置的 `mentionPatterns` 是正则表达式回退触发器。当平台不提供原生机器人提及，或希望将 `openclaw:` 等纯文本视为提及时，请使用这些模式。原生平台提及与此相互独立：当 Discord、Slack、Telegram、Matrix 或其他渠道能够确认消息显式提及了机器人时，即使已配置的正则表达式模式被禁用，该原生提及仍会触发。

默认情况下，只要渠道将提供商和对话信息传递给提及检测，已配置的提及模式就会应用于所有位置。为防止宽泛模式在每个群组中唤醒智能体，可使用 `channels.<channel>.mentionPatterns` 按渠道限定其作用域。

如果某个渠道默认应关闭正则表达式提及模式，请使用 `mode: "deny"`，然后通过 `allowIn` 为特定房间启用：

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

如果正则表达式提及模式应广泛适用，请使用默认的 `mode: "allow"`（或省略 `mode`），然后通过 `denyIn` 在消息嘈杂的房间中将其关闭：

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

| 字段            | 效果                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | 除非对话 ID 位于 `denyIn` 中，否则启用正则表达式提及模式。这是默认值。                                    |
| `mode: "deny"`  | 除非对话 ID 位于 `allowIn` 中，否则禁用正则表达式提及模式。                                               |
| `allowIn`       | 在拒绝模式下启用正则表达式提及模式的对话 ID。                                                             |
| `denyIn`        | 禁用正则表达式提及模式的对话 ID。如果 `denyIn` 和 `allowIn` 都包含同一 ID，则 `denyIn` 优先。              |

目前支持限定作用域的正则表达式策略：

| 渠道     | `allowIn` / `denyIn` 中使用的 ID                              |
| -------- | ------------------------------------------------------------- |
| Discord  | Discord 渠道 ID。                                             |
| Matrix   | Matrix 房间 ID。                                              |
| Slack    | Slack 渠道 ID。                                               |
| Telegram | 群聊 ID，或论坛话题使用的 `chatId:topic:threadId`。           |
| WhatsApp | WhatsApp 对话 ID，例如 `123@g.us`。                           |

当渠道支持多个账户时，账户级渠道配置可以在 `channels.<channel>.accounts.<accountId>.mentionPatterns` 下设置相同策略。对于该账户，账户策略优先于顶层渠道策略。

<AccordionGroup>
  <Accordion title="提及门控说明">
    - `mentionPatterns` 是不区分大小写的安全正则表达式模式；无效模式和不安全的嵌套重复形式会被忽略（并记录警告）。
    - 模式优先级：`agents.list[].groupChat.mentionPatterns`（多个智能体共享一个群组时很有用）会覆盖 `messages.groupChat.mentionPatterns`；如果两者均未设置，则会根据智能体身份的名称/表情符号派生模式。
    - 仅当能够进行提及检测时（存在原生提及或配置了 `mentionPatterns`），才会强制执行提及门控。
    - 将群组或发送者加入允许列表不会禁用提及门控；如果所有消息都应触发，请将该群组的 `requireMention` 设置为 `false`。
    - 自动群聊提示词上下文会在每个轮次中携带已解析的静默回复指令；工作区文件不应重复实现 `NO_REPLY` 机制。
    - 在允许自动静默回复的群组中，纯空白或仅包含推理的模型轮次会被视为静默，等同于 `NO_REPLY`。直接聊天永远不会收到 `NO_REPLY` 指引，仅使用消息工具的群组回复则通过不调用 `message(action=send)` 来保持静默。
    - 默认情况下，持续接收的环境群组聊天使用用户请求语义。设置 `messages.groupChat.unmentionedInbound: "room_event"` 可改为将其作为静默上下文提交。设置示例请参阅[环境房间事件](/zh-CN/channels/ambient-room-events)。
    - 房间事件不会存储为虚假的用户请求，未使用消息工具的房间事件所产生的私有助手文本也不会作为聊天历史重新播放。
    - Discord 的默认值位于 `channels.discord.guilds."*"`（可按服务器/渠道覆盖）。
    - 所有渠道都会以统一方式封装群组历史上下文。使用提及门控的群组会保留待处理的已跳过消息；当渠道支持时，始终启用的群组也可以保留最近处理过的房间消息。使用 `messages.groupChat.historyLimit` 设置全局默认值，并使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）覆盖。设置为 `0` 可禁用。

  </Accordion>
</AccordionGroup>

## 群组/渠道工具限制（可选）

部分渠道配置支持限制**特定群组/房间/渠道内**可用的工具。

- `tools`：允许或拒绝整个群组使用工具（`allow`、`alsoAllow`、`deny`；拒绝优先）。
- `toolsBySender`：群组内按发送者覆盖。请使用显式键前缀：`channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`，以及 `"*"` 通配符。渠道 ID 使用 OpenClaw 规范渠道 ID；`teams` 等别名会规范化为 `msteams`。仍接受旧版无前缀键，但仅按 `id:` 匹配，并会记录弃用警告。

解析顺序（最具体者优先）：

<Steps>
  <Step title="群组 toolsBySender">
    匹配群组/渠道的 `toolsBySender`。
  </Step>
  <Step title="群组 tools">
    群组/渠道的 `tools`。
  </Step>
  <Step title="默认 toolsBySender">
    匹配默认（`"*"`）`toolsBySender`。
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
群组/渠道工具限制会在全局/智能体工具策略之外叠加应用（拒绝仍然优先）。部分渠道对房间/渠道采用不同的嵌套结构（例如 Discord 的 `guilds.*.channels.*`、Slack 的 `channels.*`、Microsoft Teams 的 `teams.*.channels.*`）。
</Note>

## 群组允许列表

配置 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 后，其中的键将作为群组允许列表。使用 `"*"` 可允许所有群组，同时仍可设置默认提及行为。

<Warning>
常见误区：私信配对审批与群组授权并不相同。对于支持私信配对的渠道，配对存储仅用于解锁私信。群组命令仍需通过配置允许列表（例如 `groupAllowFrom`）或该渠道文档中说明的配置回退机制，显式授权群组发送者。
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
  <Tab title="允许所有群组，但要求提及">
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

## 激活（仅限所有者）

群组所有者可以发送一条独立消息，切换各群组的激活模式：

- `/activation mention`
- `/activation always`

`/activation` 是一个仅限所有者使用的核心命令，并且仅适用于群聊。所有者是指发送者与该渠道的 `allowFrom` / `commands.ownerAllowFrom` 匹配（未配置允许列表时，该账号自身的 ID 也视为所有者）。在采用此设置的渠道（Google Chat、QQ Bot、Telegram、WhatsApp）中，存储的模式会覆盖该群组的 `requireMention`；所有渠道的群组系统提示词开场内容都会反映当前激活模式。

## 上下文字段

群组入站载荷会设置：

- `ChatType=group`
- `GroupSubject`（如果已知）
- `GroupMembers`（如果已知）
- `WasMentioned`（提及门控结果）
- Telegram 论坛话题还包含 `MessageThreadId` 和 `IsForum`。

在新群组会话的首轮（以及 `/activation` 更改后），智能体系统提示词会包含群组开场内容。它会提醒模型像人类一样回复、尽量减少空行并遵循正常的聊天间距，以及避免输入字面量 `\n` 序列。非 Telegram 群组还会提示避免使用 Markdown 表格；Telegram 富文本指南来自 Telegram 渠道提示词。源自渠道的群组名称和参与者标签会以带围栏的不可信元数据形式呈现，而不是作为内联系统指令。

## iMessage 详情

- 路由或配置允许列表时，优先使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群组回复始终发回同一 `chat_id`。

## WhatsApp 系统提示词

有关规范的 WhatsApp 系统提示词规则，包括群组和私信提示词解析、通配符行为及账号覆盖语义，请参阅 [WhatsApp](/zh-CN/channels/whatsapp#system-prompts)。

## WhatsApp 详情

有关 WhatsApp 独有的行为（历史记录注入、提及处理详情），请参阅[群组消息](/zh-CN/channels/group-messages)。

## 相关内容

- [广播群组](/zh-CN/channels/broadcast-groups)
- [频道路由](/zh-CN/channels/channel-routing)
- [群组消息](/zh-CN/channels/group-messages)
- [配对](/zh-CN/channels/pairing)
