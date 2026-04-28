---
read_when:
    - 更改群聊行为或提及门控
sidebarTitle: Groups
summary: 跨各类界面（Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo）的群聊行为
title: 群组
x-i18n:
    generated_at: "2026-04-27T22:37:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: bd075bdd0382b3edfb13d4ad296d969a1004c170fa16a6a8b73e29c52d53d7dd
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw 在各类界面上的群聊处理方式保持一致：Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo。

## 新手介绍（2 分钟）

OpenClaw “运行”在你自己的消息账号上。没有单独的 WhatsApp 机器人用户。如果**你**在某个群组里，OpenClaw 就可以看到该群组并在其中回复。

默认行为：

- 群组受限（`groupPolicy: "allowlist"`）。
- 回复需要提及，除非你明确禁用提及门控。

也就是说：已加入允许列表的发送者可以通过提及 OpenClaw 来触发它。

<Note>
**TL;DR**

- **私信访问权限**由 `*.allowFrom` 控制。
- **群组访问权限**由 `*.groupPolicy` + 允许列表（`*.groups`、`*.groupAllowFrom`）控制。
- **回复触发**由提及门控（`requireMention`、`/activation`）控制。
</Note>

快速流程（群组消息会发生什么）：

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## 上下文可见性与允许列表

群组安全涉及两种不同的控制：

- **触发授权**：谁可以触发智能体（`groupPolicy`、`groups`、`groupAllowFrom`、各渠道特定的允许列表）。
- **上下文可见性**：哪些补充上下文会被注入到模型中（回复文本、引用、线程历史、转发元数据）。

默认情况下，OpenClaw 优先保持正常聊天行为，并尽量按接收到的内容保留上下文。这意味着，允许列表主要决定谁可以触发操作，而不是针对每一段引用或历史片段的通用脱敏边界。

<AccordionGroup>
  <Accordion title="当前行为因渠道而异">
    - 某些渠道已经在特定路径上对补充上下文应用了基于发送者的过滤（例如 Slack 线程种子、Matrix 回复/线程查找）。
    - 其他渠道仍会按接收到的原样传递引用/回复/转发上下文。
  </Accordion>
  <Accordion title="加固方向（计划中）">
    - `contextVisibility: "all"`（默认）保持当前“按接收内容原样处理”的行为。
    - `contextVisibility: "allowlist"` 将补充上下文过滤为仅限允许列表发送者。
    - `contextVisibility: "allowlist_quote"` 等于 `allowlist`，外加一个明确的引用/回复例外。

    在这一加固模型在各渠道中一致实现之前，不同界面之间仍会存在差异。

  </Accordion>
</AccordionGroup>

![群组消息流程](/images/groups-flow.svg)

如果你想要……

| 目标 | 需要设置什么 |
| -------------------------------------------- | ---------------------------------------------------------- |
| 允许所有群组，但仅在 @ 提及时回复 | `groups: { "*": { requireMention: true } }` |
| 禁用所有群组回复 | `groupPolicy: "disabled"` |
| 仅允许特定群组 | `groups: { "<group-id>": { ... } }`（不使用 `"*"` 键） |
| 仅你可以在群组中触发 | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## 会话键

- 群组会话使用 `agent:<agentId>:<channel>:group:<id>` 会话键（房间/频道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 论坛话题会把 `:topic:<threadId>` 添加到群组 id 后面，因此每个话题都有自己的会话。
- 私聊使用主会话（或按发送者区分的会话，具体取决于配置）。
- 群组会话会跳过心跳。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：个人私信 + 公开群组（单智能体）

可以——如果你的“个人”流量是**私信**，而“公开”流量是**群组**，这种方式效果很好。

原因：在单智能体模式下，私信通常会进入**主**会话键（`agent:main:main`），而群组始终使用**非主**会话键（`agent:main:<channel>:group:<id>`）。如果你启用沙箱隔离并设置 `mode: "non-main"`，这些群组会话就会在已配置的沙箱后端中运行，而你的主私信会话仍在主机上运行。如果你未自行选择后端，默认后端是 Docker。

这样你就拥有一个智能体“核心”（共享工作区 + 记忆），但有两种不同的执行姿态：

- **私信**：完整工具（主机）
- **群组**：沙箱 + 受限工具

<Note>
如果你需要真正独立的工作区/人格（“个人”和“公开”绝不能混用），请使用第二个智能体 + 绑定。参见 [Multi-Agent Routing](/zh-CN/concepts/multi-agent)。
</Note>

<Tabs>
  <Tab title="私信在主机上，群组在沙箱中">
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
    想要“群组只能看到文件夹 X”，而不是“完全不能访问主机”？保留 `workspaceAccess: "none"`，并且只将允许列表中的路径挂载到沙箱中：

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
- 调试为什么某个工具被阻止：[沙箱 vs 工具策略 vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)
- 绑定挂载详情：[沙箱隔离](/zh-CN/gateway/sandboxing#custom-bind-mounts)

## 显示标签

- UI 标签在可用时使用 `displayName`，格式为 `<channel>:<token>`。
- `#room` 保留给房间/频道；群聊使用 `g-<slug>`（小写、空格转为 `-`、保留 `#@+._-`）。

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
| `"open"` | 群组会绕过允许列表；提及门控仍然适用。 |
| `"disabled"` | 完全阻止所有群组消息。 |
| `"allowlist"` | 仅允许与已配置允许列表匹配的群组/房间。 |

<AccordionGroup>
  <Accordion title="各渠道说明">
    - `groupPolicy` 与提及门控分开（提及门控要求使用 @ 提及）。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo：使用 `groupAllowFrom`（回退为显式 `allowFrom`）。
    - 私信配对批准（`*-allowFrom` 存储条目）仅适用于私信访问；群组发送者授权仍需显式加入群组允许列表。
    - Discord：允许列表使用 `channels.discord.guilds.<id>.channels`。
    - Slack：允许列表使用 `channels.slack.channels`。
    - Matrix：允许列表使用 `channels.matrix.groups`。优先使用房间 id 或别名；已加入房间的名称查找是尽力而为，未解析的名称会在运行时被忽略。使用 `channels.matrix.groupAllowFrom` 来限制发送者；也支持按房间设置 `users` 允许列表。
    - 群组私信是单独控制的（`channels.discord.dm.*`、`channels.slack.dm.*`）。
    - Telegram 允许列表可以匹配用户 id（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）或用户名（`"@alice"` 或 `"alice"`）；前缀不区分大小写。
    - 默认值是 `groupPolicy: "allowlist"`；如果你的群组允许列表为空，则群组消息会被阻止。
    - 运行时安全：当某个提供商配置块完全缺失（`channels.<provider>` 不存在）时，群组策略会回退到故障关闭模式（通常是 `allowlist`），而不是继承 `channels.defaults.groupPolicy`。
  </Accordion>
</AccordionGroup>

快速心智模型（群组消息的评估顺序）：

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="群组允许列表">
    群组允许列表（`*.groups`、`*.groupAllowFrom`、各渠道特定允许列表）。
  </Step>
  <Step title="提及门控">
    提及门控（`requireMention`、`/activation`）。
  </Step>
</Steps>

## 提及门控（默认）

群组消息默认需要提及，除非按群组单独覆盖。默认值按各子系统定义在 `*.groups."*"` 下。

当渠道支持回复元数据时，回复某条机器人消息会被视为隐式提及。当渠道暴露引用元数据时，引用某条机器人消息也可能被视为隐式提及。当前内置支持的情况包括 Telegram、WhatsApp、Slack、Discord、Microsoft Teams 和 ZaloUser。

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
    - `mentionPatterns` 是大小写不敏感且安全的正则表达式模式；无效模式以及不安全的嵌套重复形式会被忽略。
    - 提供显式提及的界面仍然会正常传递；这些模式只是回退方案。
    - 按智能体覆盖：`agents.list[].groupChat.mentionPatterns`（当多个智能体共享同一个群组时很有用）。
    - 只有在可以进行提及检测时，才会强制执行提及门控（即存在原生提及，或已配置 `mentionPatterns`）。
    - 群聊提示上下文会在每一轮都携带已解析的静默回复指令；工作区文件不应重复 `NO_REPLY` 机制。
    - 在允许静默回复的群组中，干净的空回复或仅推理的模型轮次会被视为静默，等同于 `NO_REPLY`。私聊仍将空回复视为一次失败的智能体轮次。
    - Discord 的默认值位于 `channels.discord.guilds."*"`（可按 guild/频道覆盖）。
    - 群组历史上下文在各渠道之间采用统一包装，并且仅包含**待处理消息**（即因提及门控而被跳过的消息）；全局默认值使用 `messages.groupChat.historyLimit`，覆盖值使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）。设置为 `0` 可禁用。
  </Accordion>
</AccordionGroup>

## 群组/频道工具限制（可选）

某些渠道配置支持限制**特定群组/房间/频道内**可用的工具。

- `tools`：为整个群组允许/拒绝工具。
- `toolsBySender`：群组内按发送者覆盖。使用明确的键前缀：`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 和 `"*"` 通配符。旧版不带前缀的键仍然接受，但仅按 `id:` 匹配。

解析顺序（越具体优先级越高）：

<Steps>
  <Step title="群组 toolsBySender">
    群组/频道 `toolsBySender` 匹配。
  </Step>
  <Step title="群组 tools">
    群组/频道 `tools`。
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
群组/频道工具限制会与全局/智能体工具策略一同生效（`deny` 仍然优先生效）。某些渠道对房间/频道使用不同的嵌套结构（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## 群组允许列表

当配置了 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 时，这些键会作为群组允许列表。使用 `"*"` 可以允许所有群组，同时仍然设置默认的提及行为。

<Warning>
一个常见误解：私信配对批准并不等同于群组授权。对于支持私信配对的渠道，配对存储仅解锁私信。群组命令仍然需要来自配置允许列表的显式群组发送者授权，例如 `groupAllowFrom`，或该渠道文档中说明的配置回退方式。
</Warning>

常见意图（可直接复制粘贴）：

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

群组所有者可以切换每个群组的激活方式：

- `/activation mention`
- `/activation always`

所有者由 `channels.whatsapp.allowFrom` 决定（如果未设置，则使用机器人的自身 E.164）。请将命令作为单独一条消息发送。其他界面当前会忽略 `/activation`。

## 上下文字段

群组入站载荷会设置：

- `ChatType=group`
- `GroupSubject`（如果已知）
- `GroupMembers`（如果已知）
- `WasMentioned`（提及门控结果）
- Telegram 论坛话题还会包含 `MessageThreadId` 和 `IsForum`。

各渠道说明：

- BlueBubbles 可以在填充 `GroupMembers` 之前，选择性地从本地通讯录数据库中补充未命名的 macOS 群组参与者信息。此功能默认关闭，并且仅在常规群组门控通过后才会运行。

智能体系统提示会在新群组会话的第一轮加入一段群组介绍。它会提醒模型像人类一样回复、避免使用 Markdown 表格、尽量减少空行、遵循正常聊天间距，并避免输入字面的 `\n` 序列。来自渠道的群组名称和参与者标签会以带围栏的非受信元数据形式呈现，而不是内联系统指令。

## iMessage 细节

- 在路由或加入允许列表时，优先使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群组回复始终返回到同一个 `chat_id`。

## WhatsApp 系统提示

有关规范的 WhatsApp 系统提示规则，包括群组和私聊提示解析、通配符行为以及账号覆盖语义，请参见 [WhatsApp](/zh-CN/channels/whatsapp#system-prompts)。

## WhatsApp 细节

有关仅限 WhatsApp 的行为（历史注入、提及处理细节），请参见 [群组消息](/zh-CN/channels/group-messages)。

## 相关内容

- [广播群组](/zh-CN/channels/broadcast-groups)
- [渠道路由](/zh-CN/channels/channel-routing)
- [群组消息](/zh-CN/channels/group-messages)
- [配对](/zh-CN/channels/pairing)
