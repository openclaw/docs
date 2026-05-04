---
read_when:
    - 更改群聊行为或提及门控
sidebarTitle: Groups
summary: 跨各平台的群聊行为 (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: 群组
x-i18n:
    generated_at: "2026-05-04T00:46:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: dea506c011a5d8f6155b2f56aacb236482cb8c5b7457001cb2171fd45932443d
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw 在各个表面上一致地处理群聊：Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo。

## 初学者简介（2 分钟）

OpenClaw “存在于”你自己的消息账号中。没有单独的 WhatsApp 机器人用户。如果**你**在某个群组里，OpenClaw 就能看到该群组并在那里回复。

默认行为：

- 群组受限（`groupPolicy: "allowlist"`）。
- 除非你明确禁用提及门控，否则回复需要提及。
- 群组/渠道中的普通最终回复默认是私密的。可见的聊天室输出使用 `message` 工具。

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

对于群组/渠道聊天室，OpenClaw 默认使用 `messages.groupChat.visibleReplies: "message_tool"`。
`openclaw doctor --fix` 会把这个默认值写入已配置但省略该项的渠道配置。
这意味着智能体仍会处理这一轮，并且可以更新记忆/会话状态，但它的普通最终答案不会自动发布回聊天室。要可见地发言，智能体会使用 `message(action=send)`。

此默认值依赖能够可靠调用工具的模型/运行时。如果日志显示
assistant 文本但 `didSendViaMessagingTool: false`，说明模型进行了
私密回答，而不是调用消息工具。这不是
Discord/Slack/Telegram 发送失败。请为
群组/渠道会话使用工具调用可靠的模型，或设置
`messages.groupChat.visibleReplies: "automatic"` 来恢复旧版可见
最终回复。

如果在当前工具策略下消息工具不可用，OpenClaw 会回退到自动可见回复，而不是静默抑制响应。
`openclaw doctor` 会对此不匹配发出警告。

对于直接聊天和任何其他来源轮次，使用 `messages.visibleReplies: "message_tool"` 可在全局应用相同的仅工具可见回复行为。Harness 也可以将其选为未设置时的默认值；Codex harness 会对 Codex 模式直接聊天这样做。`messages.groupChat.visibleReplies` 仍是群组/渠道聊天室更具体的覆盖项。

这取代了旧模式：强制模型在大多数潜伏模式轮次中回答 `NO_REPLY`。在仅工具模式下，不产生可见输出只表示不调用消息工具。

在仅工具模式下，智能体工作时仍会发送正在输入指示器。这些轮次的默认群组输入模式会从 “message” 升级为 “instant”，因为智能体决定是否调用消息工具之前，可能永远不会有普通 assistant 消息文本。显式的输入模式配置仍然优先。

要恢复群组/渠道聊天室的旧版自动最终回复：

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

文件保存后，Gateway 网关会热重载 `messages` 配置。只有在部署中禁用文件监听或配置重载时才需要重启。

要要求每个来源聊天的可见输出都通过消息工具：

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

原生斜杠命令（Discord、Telegram，以及其他支持原生命令的表面）会绕过 `visibleReplies: "message_tool"`，并始终可见地回复，这样渠道原生命令 UI 才能获得预期响应。这只适用于经过验证的原生命令轮次；文本输入的 `/...` 命令和普通聊天轮次仍遵循已配置的群组默认值。

## 上下文可见性与允许列表

群组安全涉及两种不同控制：

- **触发授权**：谁可以触发智能体（`groupPolicy`、`groups`、`groupAllowFrom`、渠道特定允许列表）。
- **上下文可见性**：哪些补充上下文会被注入模型（回复文本、引用、线程历史、转发元数据）。

默认情况下，OpenClaw 优先保持正常聊天行为，并基本按接收时的样子保留上下文。这意味着允许列表主要决定谁能触发操作，而不是针对每段引用或历史片段的通用删改边界。

<AccordionGroup>
  <Accordion title="当前行为因渠道而异">
    - 一些渠道已经在特定路径中对补充上下文应用基于发送者的过滤（例如 Slack 线程播种、Matrix 回复/线程查找）。
    - 其他渠道仍会按接收时的样子传递引用/回复/转发上下文。

  </Accordion>
  <Accordion title="加固方向（计划中）">
    - `contextVisibility: "all"`（默认）保持当前按接收样子处理的行为。
    - `contextVisibility: "allowlist"` 将补充上下文过滤为允许列表发送者。
    - `contextVisibility: "allowlist_quote"` 是 `allowlist` 加一个显式引用/回复例外。

    在此加固模型于各渠道中一致实现之前，预期不同表面之间会存在差异。

  </Accordion>
</AccordionGroup>

![群组消息流程](/images/groups-flow.svg)

如果你想要...

| 目标                                         | 设置内容                                                   |
| -------------------------------------------- | ---------------------------------------------------------- |
| 允许所有群组，但只在 @提及时回复 | `groups: { "*": { requireMention: true } }`                |
| 禁用所有群组回复                    | `groupPolicy: "disabled"`                                  |
| 仅特定群组                         | `groups: { "<group-id>": { ... } }`（没有 `"*"` 键）       |
| 只有你能在群组中触发               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| 跨渠道复用一组受信任发送者         | `groupAllowFrom: ["accessGroup:operators"]`                |

有关可复用发送者允许列表，请参阅[访问组](/zh-CN/channels/access-groups)。

## 会话键

- 群组会话使用 `agent:<agentId>:<channel>:group:<id>` 会话键（聊天室/渠道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 论坛主题会向群组 ID 添加 `:topic:<threadId>`，使每个主题都有自己的会话。
- 直接聊天使用主会话（如果已配置，也可以按发送者分开）。
- 群组会话会跳过 Heartbeat。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：个人私信 + 公开群组（单智能体）

可以，这在你的“个人”流量是**私信**、你的“公开”流量是**群组**时效果很好。

原因：在单智能体模式中，私信通常落到**主**会话键（`agent:main:main`），而群组始终使用**非主**会话键（`agent:main:<channel>:group:<id>`）。如果你以 `mode: "non-main"` 启用沙箱隔离，这些群组会话会在已配置的沙箱后端中运行，而你的主私信会话留在主机上。如果你没有选择后端，Docker 是默认后端。

这会给你一个智能体“大脑”（共享工作区 + 记忆），但有两种执行姿态：

- **私信**：完整工具（主机）
- **群组**：沙箱 + 受限工具

<Note>
如果你需要真正分离的工作区/人格（“个人”和“公开”绝不能混合），请使用第二个智能体 + 绑定。参阅[多智能体路由](/zh-CN/concepts/multi-agent)。
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
  <Tab title="群组只能看到允许列表文件夹">
    想要“群组只能看到文件夹 X”，而不是“没有主机访问权限”？保留 `workspaceAccess: "none"`，并只将允许列表路径挂载进沙箱：

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
- 调试工具被阻止的原因：[沙箱 vs 工具策略 vs 提权](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)
- 绑定挂载详情：[沙箱隔离](/zh-CN/gateway/sandboxing#custom-bind-mounts)

## 显示标签

- UI 标签在可用时使用 `displayName`，格式化为 `<channel>:<token>`。
- `#room` 保留给聊天室/渠道；群聊使用 `g-<slug>`（小写，空格 -> `-`，保留 `#@+._-`）。

## 群组策略

按渠道控制群组/聊天室消息的处理方式：

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
| `"open"`      | 群组绕过允许列表；提及门控仍然适用。      |
| `"disabled"`  | 完全阻止所有群组消息。                           |
| `"allowlist"` | 只允许匹配已配置允许列表的群组/聊天室。 |

<AccordionGroup>
  <Accordion title="按频道说明">
    - `groupPolicy` 与提及门控分开（后者需要 @mentions）。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo：使用 `groupAllowFrom`（回退：显式 `allowFrom`）。
    - Signal：`groupAllowFrom` 可以匹配入站 Signal 群组 ID 或发送者电话/UUID。
    - 私信配对批准（`*-allowFrom` 存储条目）仅适用于私信访问；群组发送者授权仍然明确依赖群组 allowlist。
    - Discord：allowlist 使用 `channels.discord.guilds.<id>.channels`。
    - Slack：allowlist 使用 `channels.slack.channels`。
    - Matrix：allowlist 使用 `channels.matrix.groups`。优先使用房间 ID 或别名；已加入房间的名称查找是尽力而为，运行时会忽略无法解析的名称。使用 `channels.matrix.groupAllowFrom` 限制发送者；也支持按房间的 `users` allowlist。
    - 群组私信单独控制（`channels.discord.dm.*`、`channels.slack.dm.*`）。
    - Telegram allowlist 可以匹配用户 ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）或用户名（`"@alice"` 或 `"alice"`）；前缀不区分大小写。
    - 默认值是 `groupPolicy: "allowlist"`；如果你的群组 allowlist 为空，群组消息会被阻止。
    - 运行时安全性：当 provider 块完全缺失（不存在 `channels.<provider>`）时，群组策略会回退到故障关闭模式（通常是 `allowlist`），而不是继承 `channels.defaults.groupPolicy`。

  </Accordion>
</AccordionGroup>

快速心智模型（群组消息的评估顺序）：

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="群组 allowlist">
    群组 allowlist（`*.groups`、`*.groupAllowFrom`、频道专用 allowlist）。
  </Step>
  <Step title="提及门控">
    提及门控（`requireMention`、`/activation`）。
  </Step>
</Steps>

## 提及门控（默认）

群组消息默认需要提及，除非按群组覆盖。默认值位于每个子系统的 `*.groups."*"` 下。

当 channel 支持回复元数据时，回复机器人消息会被视为隐式提及。在公开引用元数据的 channel 上，引用机器人消息也可以算作隐式提及。当前内置情况包括 Telegram、WhatsApp、Slack、Discord、Microsoft Teams 和 ZaloUser。

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
    - `mentionPatterns` 是不区分大小写的安全正则表达式模式；无效模式和不安全的嵌套重复形式会被忽略。
    - 提供显式提及的表面仍会通过；模式是回退方案。
    - 按智能体覆盖：`agents.list[].groupChat.mentionPatterns`（当多个智能体共享一个群组时很有用）。
    - 仅在可以进行提及检测时（配置了原生提及或 `mentionPatterns`）才强制执行提及门控。
    - 将群组或发送者加入 allowlist 不会禁用提及门控；当所有消息都应触发时，将该群组的 `requireMention` 设置为 `false`。
    - 群组聊天提示上下文每轮都会携带已解析的静默回复指令；工作区文件不应重复 `NO_REPLY` 机制。
    - 允许静默回复的群组会将干净的空模型回合或仅推理模型回合视为静默，等同于 `NO_REPLY`。直接聊天仅在明确允许直接静默回复时才会这样处理；否则空回复仍会被视为失败的智能体回合。
    - Discord 默认值位于 `channels.discord.guilds."*"`（可按 guild/channel 覆盖）。
    - 群组历史上下文在各 channel 间统一包装，并且**仅包含待处理内容**（因提及门控而跳过的消息）；使用 `messages.groupChat.historyLimit` 设置全局默认值，使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）进行覆盖。设置为 `0` 可禁用。

  </Accordion>
</AccordionGroup>

## 群组/channel 工具限制（可选）

某些 channel 配置支持限制**特定群组/房间/channel 内**可用的工具。

- `tools`：允许/拒绝整个群组的工具。
- `toolsBySender`：群组内按发送者覆盖。使用显式键前缀：`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 和 `"*"` 通配符。旧版无前缀键仍会被接受，并且仅按 `id:` 匹配。

解析顺序（最具体者优先）：

<Steps>
  <Step title="群组 toolsBySender">
    群组/channel `toolsBySender` 匹配。
  </Step>
  <Step title="群组 tools">
    群组/channel `tools`。
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
群组/channel 工具限制会额外叠加在全局/智能体工具策略之上（拒绝仍然优先）。某些 channel 对房间/channel 使用不同的嵌套方式（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## 群组 allowlist

配置 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 时，键会作为群组 allowlist。使用 `"*"` 可允许所有群组，同时仍设置默认提及行为。

<Warning>
常见混淆：私信配对批准不等同于群组授权。对于支持私信配对的 channel，配对存储仅解锁私信。群组命令仍需要来自配置 allowlist 的显式群组发送者授权，例如 `groupAllowFrom` 或该 channel 的文档化配置回退。
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
  <Tab title="允许所有群组但需要提及">
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
  <Tab title="仅 owner 触发（WhatsApp）">
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

## 激活（仅 owner）

群组 owner 可以切换按群组激活：

- `/activation mention`
- `/activation always`

Owner 由 `channels.whatsapp.allowFrom` 决定（未设置时使用机器人的自身 E.164）。将命令作为独立消息发送。其他表面目前会忽略 `/activation`。

## 上下文字段

群组入站负载会设置：

- `ChatType=group`
- `GroupSubject`（如果已知）
- `GroupMembers`（如果已知）
- `WasMentioned`（提及门控结果）
- Telegram 论坛主题还包括 `MessageThreadId` 和 `IsForum`。

Channel 专用说明：

- BlueBubbles 可以选择在填充 `GroupMembers` 之前，从本地通讯录数据库补充未命名的 macOS 群组参与者。此功能默认关闭，并且只会在正常群组门控通过后运行。

智能体系统提示会在新群组会话的第一轮包含群组介绍。它提醒模型像真人一样回应、避免 Markdown 表格、尽量减少空行并遵循普通聊天间距，以及避免输入字面量 `\n` 序列。来自 channel 的群组名称和参与者标签会渲染为 fenced 不受信任元数据，而不是内联系统指令。

## iMessage 细节

- 路由或加入 allowlist 时优先使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群组回复始终发回同一个 `chat_id`。

## WhatsApp 系统提示

请参阅 [WhatsApp](/zh-CN/channels/whatsapp#system-prompts)，了解规范的 WhatsApp 系统提示规则，包括群组和直接提示解析、通配符行为以及账号覆盖语义。

## WhatsApp 细节

请参阅 [群组消息](/zh-CN/channels/group-messages)，了解 WhatsApp 专用行为（历史注入、提及处理细节）。

## 相关内容

- [广播群组](/zh-CN/channels/broadcast-groups)
- [Channel 路由](/zh-CN/channels/channel-routing)
- [群组消息](/zh-CN/channels/group-messages)
- [配对](/zh-CN/channels/pairing)
