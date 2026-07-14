---
read_when:
    - 更改群聊行为或提及门控
    - 将 mentionPatterns 限定于特定群组对话
sidebarTitle: Groups
summary: 跨界面的群聊行为（Discord/iMessage/Matrix/Microsoft Teams/QQ Bot/Signal/Slack/Telegram/WhatsApp/Zalo）
title: 群组
x-i18n:
    generated_at: "2026-07-14T13:27:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 6b8881b315adea3dcf6220e589f02ce34a5a9da961bcfaa59fc461c9cc347056
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw 对所有支持群组的渠道应用相同的群组规则，包括 Discord、iMessage、Matrix、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 和 Zalo。

对于应始终开启、仅在智能体明确发送可见消息时才发言，其余时候静默提供上下文的房间，请参阅[环境房间事件](/zh-CN/channels/ambient-room-events)。

## 新手介绍（2 分钟）

OpenClaw“运行”在你自己的消息账户中。它没有单独的 WhatsApp Bot 用户：如果**你**在某个群组中，OpenClaw 就能看到该群组并在其中回复。

默认行为：

- 群组受到限制（`groupPolicy: "allowlist"`）；群组发送者在加入允许名单前会被阻止。
- 回复需要提及，除非你为某个群组禁用提及门控。
- 最终回复文本会自动发布到房间（`visibleReplies: "automatic"`）。

也就是说：允许名单中的发送者可以通过提及 OpenClaw 来触发它。

<Note>
**简而言之**

- **私信访问权限**由 `*.allowFrom` 控制。
- **群组访问权限**由 `*.groupPolicy` + 允许名单（`*.groups`、`*.groupAllowFrom`）控制。
- **回复触发**由提及门控（`requireMention`、`/activation`）控制。

</Note>

快速流程（收到群组消息后会发生什么）：

```text
groupPolicy？disabled -> 丢弃
groupPolicy？allowlist -> 群组已获准？否 -> 丢弃
requireMention？是 -> 已提及？否 -> 仅存储为上下文
提及/回复/命令/私信 -> 用户请求
始终开启的群组闲聊 -> 用户请求；配置后也可作为房间事件
```

## 可见回复

对于普通群组/渠道请求，OpenClaw 默认为 `messages.groupChat.visibleReplies: "automatic"`：最终助手文本会作为可见回复发布到房间。

当共享房间应允许智能体通过调用 `message(action=send)` 自行决定何时发言时，请使用 `messages.groupChat.visibleReplies: "message_tool"`。此模式最适合能可靠使用工具的模型（例如 GPT-5.6 Sol）。如果模型未调用工具而返回了实质性的最终文本，OpenClaw 会将该文本保持为私密内容，而不会发布到房间。

对于无法可靠遵循仅工具交付要求的模型或运行时，请使用 `"automatic"`：普通最终文本会直接发布到房间，智能体仍可调用 `message(action=send)` 来发送无法随最终文本一同传送的文件、图像或其他附件。

如果当前工具策略下消息工具不可用，OpenClaw 会回退到自动发送可见回复，而不是静默抑制响应。`openclaw doctor` 会对此不匹配发出警告。

对于直接聊天及任何其他来源事件，`messages.visibleReplies: "message_tool"` 会在全局应用相同的仅工具行为；`messages.groupChat.visibleReplies` 仍是针对群组/渠道房间的更具体覆盖项。内部 WebChat 直接轮次默认自动交付最终回复，使 Pi 和 Codex 获得相同的可见回复契约。

仅工具模式取代了旧有模式，即在大多数潜水模式轮次中强制模型回答 `NO_REPLY`。在仅工具模式下，提示词不会定义 `NO_REPLY` 契约；不产生任何可见内容仅表示不调用消息工具。

由插件拥有的对话绑定是例外。插件绑定线程并认领入站轮次后，插件返回的回复即为可见的绑定响应；它不需要 `message(action=send)`。该回复是插件运行时输出，而不是私密的模型最终文本。

直接群组请求仍会发送输入状态指示。启用后，环境式始终开启房间事件仍会保持严格且静默，除非智能体调用消息工具。

会话默认抑制详细的工具/进度摘要。调试时，使用 `/verbose on`（或 `/verbose full`）为当前会话显示这些摘要，并使用 `/verbose off` 恢复为仅显示最终回复的行为。详细状态按会话存储，并在直接聊天、群组、渠道和论坛主题中以相同方式工作。

要将未提及智能体的始终开启群组闲聊作为静默房间上下文而非用户请求提交，请使用[环境房间事件](/zh-CN/channels/ambient-room-events)：

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

默认值为 `unmentionedInbound: "user_request"`。包含提及的消息、命令、中止请求和私信仍属于用户请求。

要要求群组/渠道请求的可见输出通过消息工具发送：

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

要对每个来源聊天都执行此要求：

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

保存文件后，Gateway 网关无需重启即可应用 `messages` 配置更改。仅当配置重新加载已禁用（`gateway.reload.mode: "off"`）时才需重启。

命令轮次会绕过 `visibleReplies: "message_tool"`，并始终发送可见回复：原生斜杠命令（Discord、Telegram 及其他支持原生命令的界面）和已获授权的文本 `/...` 命令都会将响应发布到来源聊天。群组中未获授权的文本 `/...` 轮次仍仅通过消息工具交付；普通聊天轮次遵循配置的默认值。

## 上下文可见性和允许名单

群组安全涉及两种不同的控制：

- **触发授权**：谁能触发智能体（`groupPolicy`、`groups`、`groupAllowFrom`、渠道专用允许名单）。
- **上下文可见性**：向模型注入哪些补充上下文（回复/引用文本、线程历史记录、转发元数据）。

默认情况下，OpenClaw 会按收到时的原样保留上下文：允许名单决定谁能触发操作，而不决定模型能看到哪些引用或历史片段。若还要筛选补充上下文，请设置 `contextVisibility`：

| 模式                | 行为                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"`（默认）   | 按收到时的原样保留补充上下文。                                           |
| `"allowlist"`       | 仅注入来自允许名单发送者的历史记录/线程/引用/转发上下文。     |
| `"allowlist_quote"` | `allowlist`，并保留来自任何发送者且被明确引用或回复的消息。 |

可按渠道（`channels.<channel>.contextVisibility`）、按账户（`channels.<channel>.accounts.<accountId>.contextVisibility`）或全局（`channels.defaults.contextVisibility`）设置。会获取补充上下文的渠道（Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp）在构建入站上下文时会应用该策略；未知的策略组合会以关闭方式失败并省略上下文。

![群组消息流程](/images/groups-flow.svg)

如果你希望……

| 目标                                         | 设置内容                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| 允许所有群组，但仅在 @提及时回复 | `groups: { "*": { requireMention: true } }`                |
| 禁用所有群组回复                    | `groupPolicy: "disabled"`                                  |
| 仅允许特定群组                         | `groups: { "<group-id>": { ... } }`（无 `"*"` 键）         |
| 群组中只有你能触发智能体               | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |
| 在多个渠道间复用同一组可信发送者 | `groupAllowFrom: ["accessGroup:operators"]`                |

有关可复用的发送者允许名单，请参阅[访问组](/zh-CN/channels/access-groups)。

## 会话键

- 群组会话使用 `agent:<agentId>:<channel>:group:<id>` 会话键（房间/渠道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 论坛主题会将 `:topic:<threadId>` 添加到群组 ID 中，使每个主题都有自己的会话。
- 直接聊天使用主会话（如果已配置 `session.dmScope`，则使用按发送者划分的会话）。
- Heartbeat 在配置的心跳会话中运行（默认：智能体主会话）；群组会话不会运行自己的 Heartbeat。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：个人私信 + 公共群组（单个智能体）

可以——如果你的“个人”流量是**私信**，而“公共”流量是**群组**，此模式效果很好。

原因是：在单智能体模式下，私信通常进入**主**会话键（`agent:main:main`），而群组始终使用**非主**会话键（`agent:main:<channel>:group:<id>`）。如果通过 `mode: "non-main"` 启用沙箱隔离，这些群组会话会在配置的沙箱后端中运行，而你的主私信会话仍在主机上运行。如果未选择后端，则默认使用 Docker。

这样，你可以拥有一个智能体“大脑”（共享工作区 + 记忆），但采用两种执行方式：

- **私信**：完整工具（主机）
- **群组**：沙箱 + 受限工具

<Note>
如果你需要真正独立的工作区/角色设定（“个人”和“公共”绝不能混合），请使用第二个智能体 + 绑定。请参阅[多智能体路由](/zh-CN/concepts/multi-agent)。
</Note>

<Tabs>
  <Tab title="私信在主机上运行，群组在沙箱中运行">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // 群组/渠道是非主会话 -> 在沙箱中运行
            scope: "session", // 最强隔离（每个群组/渠道一个容器）
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // 如果 allow 非空，则会阻止其他所有项（deny 仍优先）。
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="群组只能看到允许名单中的文件夹">
    希望“群组只能看到文件夹 X”，而不是“无法访问主机”？请保留 `workspaceAccess: "none"`，并仅将允许名单中的路径挂载到沙箱：

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
                // 主机路径:容器路径:模式
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
- 调试工具被阻止的原因：[沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)
- 绑定挂载详情：[沙箱隔离](/zh-CN/gateway/sandboxing#custom-bind-mounts)

## 显示标签

- 如果 `displayName` 可用，UI 标签会使用它，并按 `<channel>:<token>` 格式显示。
- `#room` 保留用于房间/渠道；群组聊天使用 `g-<slug>`（小写，空格 -> `-`，保留 `#@+._-`）。非常长的不透明 ID 会缩短为稳定令牌，以免在 UI 中泄露完整的路由 ID。

## 群组策略

按渠道控制群组/房间消息的处理方式：

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // Telegram 用户数字 ID（设置过程会解析 @username）
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

| 策略        | 行为                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | 群组绕过允许列表；提及门控仍然适用。      |
| `"disabled"`  | 完全阻止所有群组消息。                           |
| `"allowlist"` | 仅允许与已配置允许列表匹配的群组/房间。 |

<AccordionGroup>
  <Accordion title="各渠道说明">
    - `groupPolicy` 与提及门控（要求使用 @提及）相互独立。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo：使用 `groupAllowFrom`（回退：显式设置 `allowFrom`）。
    - Signal：`groupAllowFrom` 可以匹配入站 Signal 群组 ID，也可以匹配发送者的电话号码/UUID。
    - 私信配对审批（`*-allowFrom` 存储条目）仅适用于私信访问；群组发送者授权仍需在群组允许列表中显式配置。
    - Discord：允许列表使用 `channels.discord.guilds.<id>.channels`。
    - Slack：允许列表使用 `channels.slack.channels`。
    - Matrix：允许列表使用 `channels.matrix.groups`。请使用房间 ID（`!room:server`）或别名（`#alias:server`）；房间名称键仅在配置了 `channels.matrix.dangerouslyAllowNameMatching: true` 时匹配，无法解析的条目在运行时会被忽略。使用 `channels.matrix.groupAllowFrom` 限制发送者；也支持按房间配置 `users` 允许列表。
    - 群组私信单独控制（`channels.discord.dm.*`、`channels.slack.dm.*`：`groupEnabled`、`groupChannels`）。
    - Telegram：发送者允许列表仅接受用户数字 ID（`"123456789"`；`telegram:`/`tg:` 前缀会以不区分大小写的方式移除）。`@username` 条目在运行时不会匹配，并会记录警告；设置过程会将 `@username` 解析为 ID。负数聊天 ID 应放在 `channels.telegram.groups` 下，而不是发送者允许列表中。
    - 默认值为 `groupPolicy: "allowlist"`；如果群组允许列表为空，则群组消息会被阻止。
    - 运行时安全性：当提供商配置块完全缺失（不存在 `channels.<provider>`）时，群组策略会以故障关闭方式采用 `allowlist`，而不是继承 `channels.defaults.groupPolicy`，并且 Gateway 网关会为每个账号记录一次该回退情况。

  </Accordion>
</AccordionGroup>

快速理解模型（群组消息的评估顺序）：

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="群组允许列表">
    群组允许列表（`*.groups`、`*.groupAllowFrom`、渠道专用允许列表）。
  </Step>
  <Step title="提及门控">
    提及门控（`requireMention`、`/activation`）。
  </Step>
</Steps>

## 提及门控（默认）

除非按群组覆盖，否则群组消息必须包含提及。默认值位于各子系统的 `*.groups."*"` 下。

当渠道提供回复元数据时，回复机器人消息视为隐式提及；在提供引用元数据的渠道上，引用机器人消息也可以视为提及。当前内置支持的渠道包括：Discord、Microsoft Teams、QQ Bot、Slack、Telegram、WhatsApp 和 Zalo Personal。

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

已配置的 `mentionPatterns` 是正则表达式回退触发器。当平台不提供原生机器人提及，或者希望将 `openclaw:` 等纯文本视为提及时，请使用这些触发器。平台原生提及与此相互独立：当 Discord、Slack、Telegram、Matrix、Signal 或其他渠道能够确认消息明确提及了机器人时，即使已配置的正则表达式模式被拒绝，该原生提及仍会触发。

默认情况下，只要渠道将提供商和会话事实传入提及检测，已配置的提及模式就会在所有相关位置生效。为避免宽泛模式唤醒每个群组中的智能体，请使用 `channels.<channel>.mentionPatterns` 按渠道限定其作用域。

如果某个渠道应默认关闭正则表达式提及模式，请使用 `mode: "deny"`，然后通过 `allowIn` 为特定房间启用：

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

当正则提及模式应广泛应用时，使用默认的 `mode: "allow"`（或省略 `mode`），然后在嘈杂的房间中使用 `denyIn` 将其关闭：

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

| 字段           | 效果                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | 除非会话 ID 位于 `denyIn` 中，否则启用正则提及模式。这是默认设置。                    |
| `mode: "deny"`  | 除非会话 ID 位于 `allowIn` 中，否则禁用正则提及模式。                                       |
| `allowIn`       | 在拒绝模式下启用正则提及模式的会话 ID。                                               |
| `denyIn`        | 禁用正则提及模式的会话 ID。如果二者包含同一个 ID，`denyIn` 优先于 `allowIn`。 |

目前支持的作用域正则策略：

| 渠道  | `allowIn` / `denyIn` 中使用的 ID                             |
| -------- | ------------------------------------------------------------ |
| Discord  | Discord 频道 ID。                                         |
| Matrix   | Matrix 房间 ID。                                             |
| Slack    | Slack 频道 ID。                                           |
| Telegram | 群聊 ID，或论坛话题的 `chatId:topic:threadId`。 |
| WhatsApp | WhatsApp 会话 ID，例如 `123@g.us`。                |

当渠道支持多个账号时，账号级渠道配置可以在 `channels.<channel>.accounts.<accountId>.mentionPatterns` 下设置相同的策略。对于该账号，账号策略优先于顶层渠道策略。

<AccordionGroup>
  <Accordion title="提及门控说明">
    - `mentionPatterns` 是不区分大小写的安全正则表达式模式；无效模式和不安全的嵌套重复形式会被忽略（并发出警告）。
    - 模式优先级：`agents.list[].groupChat.mentionPatterns`（当多个智能体共享一个群组时很有用）优先于 `messages.groupChat.mentionPatterns`；两者均未设置时，将根据智能体身份的名称/表情符号派生模式。
    - 仅当可以检测提及（原生提及或已配置 `mentionPatterns`）时，才会强制执行提及门控。
    - 将群组或发送者列入允许列表不会禁用提及门控；当所有消息都应触发时，请将该群组的 `requireMention` 设置为 `false`。
    - 自动群聊提示上下文会在每一轮携带解析后的静默回复指令；工作区文件不应重复 `NO_REPLY` 机制。
    - 在允许自动静默回复的群组中，干净的空模型轮次或仅推理的模型轮次会被视为静默，等同于 `NO_REPLY`。直接聊天永远不会收到 `NO_REPLY` 指引，而仅使用消息工具的群组回复会通过不调用 `message(action=send)` 来保持静默。
    - 默认情况下，始终开启的环境群聊使用用户请求语义。设置 `messages.groupChat.unmentionedInbound: "room_event"` 可改为将其作为静默上下文提交。有关设置示例，请参阅[环境房间事件](/zh-CN/channels/ambient-room-events)。
    - 房间事件不会存储为虚假的用户请求，并且无消息工具房间事件中的私有助手文本不会作为聊天历史重新播放。
    - Discord 默认设置位于 `channels.discord.guilds."*"` 中（可按服务器/频道覆盖）。
    - 各渠道会统一封装群组历史上下文。采用提及门控的群组会保留待处理的已跳过消息；当渠道支持时，始终开启的群组也可能保留近期已处理的房间消息。使用 `messages.groupChat.historyLimit` 设置全局默认值，使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）进行覆盖。设置 `0` 可将其禁用。

  </Accordion>
</AccordionGroup>

## 群组/渠道工具限制（可选）

部分渠道配置支持限制**特定群组/房间/频道内**可用的工具。

- `tools`：为整个群组允许/拒绝工具（`allow`、`alsoAllow`、`deny`；拒绝优先）。
- `toolsBySender`：群组内按发送者覆盖。使用明确的键前缀：`channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`，以及 `"*"` 通配符。渠道 ID 使用 OpenClaw 的规范渠道 ID；`teams` 等别名会规范化为 `msteams`。仍接受旧版无前缀键，但仅按 `id:` 进行匹配，并会记录弃用警告。

解析顺序（最具体者优先）：

<Steps>
  <Step title="群组 toolsBySender">
    匹配群组/渠道 `toolsBySender`。
  </Step>
  <Step title="群组 tools">
    群组/渠道 `tools`。
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
群组/渠道工具限制会在全局/智能体工具策略之外额外应用（拒绝规则仍然优先）。某些渠道对房间/频道使用不同的嵌套结构（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## 群组允许列表

配置 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 后，其中的键将充当群组允许列表。使用 `"*"` 可允许所有群组，同时仍设置默认提及行为。

<Warning>
常见误区：私信配对批准与群组授权并不相同。对于支持私信配对的渠道，配对存储只会解锁私信。群组命令仍需通过配置允许列表（例如 `groupAllowFrom`）或该渠道文档所述的配置回退规则，明确授权群组发送者。
</Warning>

常见配置意图（复制/粘贴）：

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

## 激活（仅所有者）

群组所有者可以通过单独发送以下消息切换每个群组的激活状态：

- `/activation mention`
- `/activation always`

`/activation` 是一条仅限核心所有者使用的命令，并且只适用于群聊。所有者是指发送者与 `commands.ownerAllowFrom` 匹配；渠道 `allowFrom` 列表仅控制普通渠道和命令访问权限。对于会查询已存储模式的渠道（Google Chat、QQ Bot、Telegram、WhatsApp），该模式会覆盖相应群组的 `requireMention`，并且所有渠道中的群组系统提示词引言都会反映当前激活的模式。

## 上下文字段

群组入站载荷会设置：

- `ChatType=group`
- `GroupSubject`（如果已知）
- `GroupMembers`（如果已知）
- `WasMentioned`（提及门控结果）
- Telegram 论坛话题还包含 `MessageThreadId` 和 `IsForum`。

在新群组会话的第一轮（以及 `/activation` 更改后），智能体系统提示词会包含群组引言。它会提醒模型像人类一样回复、尽量减少空行并遵循正常的聊天间距，同时避免输入字面量 `\n` 序列。非 Telegram 群组还会建议避免使用 Markdown 表格；Telegram 富文本指南来自 Telegram 渠道提示词。源自渠道的群组名称和参与者标签会呈现为带围栏的不受信任元数据，而不是内联系统指令。

## iMessage 特定说明

- 进行路由或配置允许列表时，优先使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群组回复始终返回同一个 `chat_id`。

## WhatsApp 系统提示词

有关规范的 WhatsApp 系统提示词规则（包括群组和直接提示词解析、通配符行为以及账户覆盖语义），请参阅 [WhatsApp](/zh-CN/channels/whatsapp#system-prompts)。

## WhatsApp 特定说明

有关 WhatsApp 专属行为（历史记录注入、提及处理细节），请参阅[群组消息](/zh-CN/channels/group-messages)。

## 相关内容

- [广播群组](/zh-CN/channels/broadcast-groups)
- [渠道路由](/zh-CN/channels/channel-routing)
- [群组消息](/zh-CN/channels/group-messages)
- [配对](/zh-CN/channels/pairing)
