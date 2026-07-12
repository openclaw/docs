---
read_when:
    - 你想要连接 Feishu/Lark Bot
    - 你正在配置 Feishu 渠道
summary: Feishu Bot 概览、功能和配置
title: Feishu
x-i18n:
    generated_at: "2026-07-12T14:17:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 54f4d8a73fb1e7c2af970fa7dc71f953074aa49c4bc4aed0d24671c74a84ebe9
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw 通过官方 `@openclaw/feishu` 插件连接到 Feishu/Lark（一体化协作平台）：支持机器人私信、群聊、流式卡片回复，以及 Feishu 文档、wiki、云盘和多维表格工具。

**状态：**已可用于生产环境中的机器人私信和群聊。WebSocket 是默认事件传输方式（无需公共 URL）；也可选择 webhook 模式。

## 快速开始

<Note>
需要 OpenClaw 2026.5.29 或更高版本。运行 `openclaw --version` 检查版本。使用 `openclaw update` 升级。
</Note>

<Steps>
  <Step title="运行渠道设置向导">
  ```bash
  openclaw channels login --channel feishu
  ```
  如果尚未安装 `@openclaw/feishu` 插件，此命令会先安装插件，然后引导你完成设置：

- **手动设置**：粘贴来自 Feishu 开放平台（`https://open.feishu.cn`）或 Lark Developer（`https://open.larksuite.com`）的 App ID 和 App Secret。
- **二维码设置**：在 Feishu 应用中扫描二维码，自动创建机器人。此流程会将私信限制为仅允许你自己的账号（`dmPolicy: "allowlist"`，并使用你的 `open_id`）。

向导还会询问 API 域（Feishu 或 Lark）和群组策略。如果中国大陆版 Feishu 移动应用扫描二维码后没有反应，请重新运行设置并选择手动设置。
</Step>

  <Step title="设置完成后，重启 Gateway 网关以应用更改">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## 访问控制

### 私信

配置 `channels.feishu.dmPolicy`（默认值：`pairing`）以控制谁可以向机器人发送私信：

| 值            | 行为                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| `"pairing"`   | 未知用户会收到配对码；通过 CLI 批准                                                                   |
| `"allowlist"` | 只有 `allowFrom` 中列出的用户可以聊天                                                                  |
| `"open"`      | 公开私信；配置验证要求 `allowFrom` 包含 `"*"`。非通配符条目仍会缩小访问范围                           |

**批准配对请求：**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### 群聊

**群组策略**（`channels.feishu.groupPolicy`，默认值：`allowlist`）：

| 值            | 行为                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------- |
| `"open"`      | 回复群组中的所有消息                                                                              |
| `"allowlist"` | 仅回复 `groupAllowFrom` 中的群组，或 `groups.<chat_id>` 下明确配置的群组                           |
| `"disabled"`  | 禁用所有群组消息；明确的 `groups.<chat_id>` 条目不会覆盖此设置                                    |

**提及要求**（`channels.feishu.requireMention`）：

- 默认需要 @提及，但有效群组策略为 `"open"` 时除外；此时默认值为 `false`，因此无法携带提及的消息（例如图片）仍能送达智能体。
- 显式设置为 `true` 或 `false` 可覆盖默认值；按群组覆盖：`channels.feishu.groups.<chat_id>.requireMention`。
- 仅用于广播的 `@all` 和 `@_all` 不视为提及机器人。同时提及 `@all` 并直接提及机器人的消息仍视为提及机器人。

## 群组配置示例

### 允许所有群组，无需 @提及

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // 在 "open" 下，requireMention 默认为 false
    },
  },
}
```

### 允许所有群组，但仍要求 @提及

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### 仅允许特定群组

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // 群组 ID 的格式类似：oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

在 `allowlist` 模式下，你也可以通过添加明确的 `groups.<chat_id>` 条目来允许某个群组。明确条目不会覆盖 `groupPolicy: "disabled"`。`groups.*` 下的通配符默认值可配置匹配的群组，但它们本身不会允许这些群组。

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
    },
  },
}
```

### 限制群组内的发送者

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // 用户 open_id 的格式类似：ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

`channels.feishu.groupSenderAllowFrom` 为所有群组设置相同的发送者允许列表；按群组设置的 `allowFrom` 优先级更高。

<a id="get-groupuser-ids"></a>

## 获取群组/用户 ID

### 群组 ID（`chat_id`，格式：`oc_xxx`）

在 Feishu/Lark 中打开群组，点击右上角的菜单图标，然后进入 **Settings**。群组 ID（`chat_id`）会显示在设置页面上。

![获取群组 ID](/images/feishu-get-group-id.png)

### 用户 ID（`open_id`，格式：`ou_xxx`）

启动 Gateway 网关，向机器人发送私信，然后查看日志：

```bash
openclaw logs --follow
```

在日志输出中查找 `open_id`。你也可以查看待处理的配对请求：

```bash
openclaw pairing list feishu
```

## 常用命令

| 命令      | 描述                     |
| --------- | ------------------------ |
| `/status` | 显示机器人状态           |
| `/reset`  | 重置当前会话             |
| `/model`  | 显示或切换 AI 模型       |

<Note>
Feishu/Lark 不支持原生斜杠命令菜单，因此请将这些命令作为纯文本消息发送。
</Note>

## 故障排查

### 机器人在群聊中没有响应

1. 确保已将机器人添加到群组
2. 确保你 @提及了机器人（默认要求）
3. 验证 `groupPolicy` 不是 `"disabled"`
4. 查看日志：`openclaw logs --follow`

### 机器人收不到消息

1. 确保机器人已在 Feishu 开放平台/Lark Developer 中发布并获批
2. 确保事件订阅包含 `im.message.receive_v1`
3. 确保已选择 **persistent connection**（WebSocket）
4. 确保已授予所有必需的权限范围
5. 确保 Gateway 网关正在运行：`openclaw gateway status`
6. 查看日志：`openclaw logs --follow`

### Feishu 移动应用扫描二维码后没有反应

1. 重新运行设置：`openclaw channels login --channel feishu`
2. 选择手动设置
3. 在 Feishu 开放平台中创建自建应用，并复制其 App ID 和 App Secret
4. 将这些凭据粘贴到设置向导中

### App Secret 泄露

1. 在 Feishu 开放平台/Lark Developer 中重置 App Secret
2. 更新配置中的值
3. 重启 Gateway 网关：`openclaw gateway restart`

## 高级配置

### 多账号

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "主机器人",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "备用机器人",
          enabled: false,
        },
      },
    },
  },
}
```

当出站 API 未指定 `accountId` 时，`defaultAccount` 控制使用哪个账号。账号条目会继承顶层设置；大多数顶层键都可以按账号覆盖。
`accounts.<id>.tts` 使用与 `messages.tts` 相同的结构，并在全局 TTS 配置之上进行深度合并，因此多机器人 Feishu 设置可以全局共享提供商凭据，同时仅按账号覆盖语音、模型、角色设定或自动模式。

### 消息限制

- `textChunkLimit` - 出站文本分块大小（默认值：`4000` 个字符）
- `chunkMode` - `"length"`（默认值）在达到限制时拆分；`"newline"` 优先在换行边界拆分
- `mediaMaxMb` - 媒体上传/下载限制（默认值：`30` MB）

### 流式传输

Feishu/Lark 支持通过交互式卡片（Card Kit 流式 API）发送流式回复。启用后，机器人会在生成文本时实时更新卡片。

```json5
{
  channels: {
    feishu: {
      streaming: true, // 启用流式卡片输出（默认值：true）
      blockStreaming: true, // 选择启用已完成块的流式传输
    },
  },
}
```

设置 `streaming: false` 可在一条消息中发送完整回复；`renderMode: "raw"`（使用纯文本而非卡片）也会禁用流式卡片。`blockStreaming` 默认关闭；仅当你希望在最终回复之前刷新已完成的助手内容块时才启用它。

### 配额优化

通过两个可选标志减少 Feishu/Lark API 调用次数：

- `typingIndicator`（默认值为 `true`）：设置为 `false` 可跳过输入状态表情回应调用
- `resolveSenderNames`（默认值为 `true`）：设置为 `false` 可跳过发送者资料查询

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### 群组会话范围和话题线程

`channels.feishu.groupSessionScope`（顶层、按账号或按群组）控制群组消息如何映射到智能体会话：

| 值                       | 会话                                                          |
| ------------------------ | ------------------------------------------------------------- |
| `"group"`（默认值）      | 每个群聊一个会话                                              |
| `"group_sender"`         | 每个（群组 + 发送者）一个会话                                 |
| `"group_topic"`          | 每个话题线程一个会话；回退到群组会话                          |
| `"group_topic_sender"`   | 每个（话题 + 发送者）一个会话；回退到（群组 + 发送者）        |

对于话题范围，原生 Feishu/Lark 话题群组使用事件的 `thread_id`（`omt_*`）作为规范的话题会话键。如果原生话题起始事件缺少 `thread_id`，OpenClaw 会先从 Feishu 获取该值，再路由该轮次。OpenClaw 将普通群组回复转换为线程时，仍使用回复根消息 ID（`om_*`），以确保首轮和后续轮次保持在同一会话中。

将 `replyInThread: "enabled"`（顶层或按群组）设置为启用，可让机器人回复创建或继续 Feishu 话题线程，而不是以内联方式回复。`topicSessionMode` 是 `groupSessionScope` 的已弃用前身；请优先使用 `groupSessionScope`。

### Feishu 工作区工具

该插件提供用于 Feishu 文档、聊天、知识库、云存储、权限和多维表格的智能体工具，以及对应的 Skills（`feishu-doc`、`feishu-drive`、`feishu-perm`、`feishu-wiki`）。工具系列由 `channels.feishu.tools` 控制：

| 键              | 工具                                              | 默认值               |
| --------------- | ------------------------------------------------- | -------------------- |
| `tools.doc`     | `feishu_doc` 文档操作                             | `true`               |
| `tools.chat`    | `feishu_chat` 聊天信息和成员查询                  | `true`               |
| `tools.wiki`    | `feishu_wiki` 知识库（需要 `doc`）                | `true`               |
| `tools.drive`   | `feishu_drive` 云存储                             | `true`               |
| `tools.perm`    | `feishu_perm` 权限管理                            | `false`（敏感）      |
| `tools.scopes`  | `feishu_app_scopes` 应用权限范围诊断              | `true`               |
| `tools.bitable` | `feishu_bitable_*` 多维表格/Base 操作             | `true`               |

`tools.base` 是 `tools.bitable` 的别名；同时设置两者时，以明确的 `bitable` 值为准。按账号设置的开关位于 `accounts.<id>.tools` 下。

授予 `drive:drive.metadata:readonly`，以便在根目录之外直接执行 `feishu_drive info` 查询，除非应用已拥有完整的 `drive:drive` 权限范围。如果两种权限范围都没有，`info` 仍可通过 `drive:drive:readonly` 使用旧版根目录查询。

### ACP 会话

Feishu/Lark 支持在私信和群组话题消息中使用 ACP。Feishu/Lark ACP 由文本命令驱动——没有原生斜杠命令菜单，因此请直接在对话中发送 `/acp ...` 消息。

#### 持久 ACP 绑定

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### 从聊天中生成 ACP

在 Feishu/Lark 私信或话题中：

```text
/acp spawn codex --thread here
```

`--thread here` 适用于私信和 Feishu/Lark 话题消息。绑定对话中的后续消息会直接路由到该 ACP 会话。

### 多智能体路由

使用 `bindings` 将 Feishu/Lark 私信或群组路由到不同的智能体。

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

路由字段：

- `match.channel`：`"feishu"`
- `match.peer.kind`：`"direct"`（私信）或 `"group"`（群聊）
- `match.peer.id`：用户 Open ID（`ou_xxx`）或群组 ID（`oc_xxx`）

有关查询提示，请参阅[获取群组/用户 ID](#get-groupuser-ids)。

## 每用户 Agent 隔离（动态 Agent 创建）

启用 `dynamicAgentCreation`，为每个私信用户自动创建**隔离的智能体实例**。每个用户都会获得自己的：

- 独立工作区目录
- 单独的 `USER.md` / `SOUL.md` / `MEMORY.md`
- 私有对话历史记录
- 隔离的 Skills 和状态

对于公共机器人而言，如果你希望每个用户都能获得专属的私有 AI 助手体验，此功能至关重要。

<Note>
动态绑定包含规范化后的 Feishu `accountId`，因此默认账户和命名账户会将每个发送者路由到正确的动态智能体。

如果命名账户在旧版本中创建了没有账户范围的动态智能体，该旧版智能体仍会计入 `maxAgents`。移除它之前，请确认默认账户未使用它；或者临时增加 `maxAgents`。OpenClaw 无法安全推断不明确的旧版状态属于哪个账户。
</Note>

### 快速设置

```json5
{
  channels: {
    feishu: {
      dmPolicy: "open",
      allowFrom: ["*"],
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // 关键：使每个用户的私信成为其“主会话”
    // 自动加载 USER.md / SOUL.md / MEMORY.md
    // 如需更强的隔离，请改用 "per-channel-peer"
    dmScope: "main",
  },
}
```

### 工作原理

当新用户发送第一条私信时：

1. 渠道生成唯一的 `agentId`：默认账户使用 `feishu-{user_open_id}`，命名账户则使用长度受限、带账户前缀的身份摘要
2. 在 `workspaceTemplate` 路径创建新工作区
3. 注册智能体，并为该用户创建绑定
4. 工作区辅助程序确保首次访问时存在引导文件（`AGENTS.md`、`SOUL.md`、`USER.md` 等）
5. 将该用户之后的所有消息路由到其专属智能体

### 配置选项

| 设置                                                     | 说明                                 | 默认值                               |
| -------------------------------------------------------- | ------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | 启用自动为每个用户创建智能体         | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | 动态智能体工作区的路径模板           | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Agent 目录名称模板                   | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | 可创建的动态智能体数量上限           | 无限制                               |

模板变量：

- `{agentId}` - 生成的智能体 ID（例如 `feishu-ou_xxxxxx` 或 `feishu-support-<identity_digest>`）
- `{userId}` - 发送者的 Feishu open_id（例如 `ou_xxxxxx`）

### 会话范围

`session.dmScope` 控制如何将私信映射到智能体会话。这是影响所有渠道的**全局设置**。

| 值                           | 行为                                                               | 最适合                                                             |
| ---------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `"main"`                     | 每个用户的私信映射到其智能体的主会话                               | 希望自动加载 `USER.md` / `SOUL.md` 的单用户机器人                  |
| `"per-peer"`                 | 每个对端获得单独的会话（无论使用哪个渠道）                         | 仅按发送者身份进行隔离                                             |
| `"per-channel-peer"`         | 每个（渠道 + 用户）组合获得单独的会话                              | 需要更强隔离的公共多用户机器人                                     |
| `"per-account-channel-peer"` | 每个（账户 + 渠道 + 用户）组合获得单独的会话                       | 需要账户级会话隔离的多账户机器人                                   |

**权衡**：使用 `"main"` 可以自动加载引导文件（`USER.md`、`SOUL.md`、`MEMORY.md`），但这意味着所有渠道中的所有私信都共享相同的会话键模式。对于隔离比自动加载引导文件更重要的公共多用户机器人，请考虑使用 `"per-channel-peer"` 并手动管理引导文件。

<Note>
如果命名 Feishu 账户需要为同一发送者保留单独的会话，请使用 `"per-account-channel-peer"`。动态绑定会保留账户范围。
</Note>

### 典型的多用户部署

```json5
{
  channels: {
    feishu: {
      appId: "cli_xxx",
      appSecret: "xxx",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "open",
      requireMention: true,
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // 根据你的隔离需求选择 dmScope：
    // 使用 "main" 自动加载引导文件，使用 "per-channel-peer" 获得更强的隔离
    dmScope: "main",
  },
  bindings: [], // 留空——动态智能体会自动绑定
}
```

### 验证

检查 Gateway 网关日志，确认动态创建功能正常运行：

```text
feishu: 正在为用户 ou_xxxxxx 创建动态智能体 "feishu-ou_xxxxxx"
  工作区：/home/user/.openclaw/workspace-feishu-ou_xxxxxx
  Agent 目录：/home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

列出所有已创建的工作区：

```bash
ls -la ~/.openclaw/workspace-*
```

### 注意事项

- **工作区隔离**：每个用户都会获得自己的工作区目录和智能体实例。在正常消息流程中，用户无法查看彼此的对话历史记录或文件。
- **安全边界**：这是消息上下文隔离机制，而不是针对敌对共租户的安全边界。智能体进程和主机环境仍然共享。
- **必须保持启用配置写入**：动态 Agent 创建会将智能体和绑定写入配置；当 `channels.feishu.configWrites` 为 `false` 时会跳过此操作（默认：启用）。
- **`bindings` 应为空**：动态智能体会自动注册自己的绑定
- **升级路径**：现有手动绑定可以继续与动态智能体一起使用
- **`session.dmScope` 是全局设置**：它会影响所有渠道，而不仅仅是 Feishu

## 配置参考

完整配置：[Gateway 配置](/zh-CN/gateway/configuration)

| 设置                                                     | 说明                                                                                 | 默认值                               |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | 启用/禁用渠道                                                                        | `true`                               |
| `channels.feishu.domain`                                 | API 域（`feishu`、`lark` 或以 `https://` 开头的基础 URL）                            | `feishu`                             |
| `channels.feishu.connectionMode`                         | 事件传输方式（`websocket` 或 `webhook`）                                             | `websocket`                          |
| `channels.feishu.defaultAccount`                         | 出站路由的默认账户                                                                   | `default`                            |
| `channels.feishu.verificationToken`                      | webhook 模式必需                                                                     | -                                    |
| `channels.feishu.encryptKey`                             | webhook 模式必需                                                                     | -                                    |
| `channels.feishu.webhookPath`                            | Webhook 路由路径                                                                     | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Webhook 绑定主机                                                                     | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Webhook 绑定端口                                                                     | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | 应用 ID                                                                              | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | 应用密钥                                                                             | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | 按账户覆盖域设置                                                                     | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | 按账户覆盖 TTS 设置                                                                  | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | 私信策略（`pairing`、`allowlist`、`open`）                                           | `pairing`                            |
| `channels.feishu.allowFrom`                              | 私信允许列表（open_id 列表）                                                         | -                                    |
| `channels.feishu.groupPolicy`                            | 群组策略（`open`、`allowlist`、`disabled`）                                          | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | 群组允许列表                                                                         | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | 应用于所有群组的发送者允许列表                                                       | -                                    |
| `channels.feishu.requireMention`                         | 要求在群组中 @提及                                                                   | `true`（策略为 `open` 时为 `false`） |
| `channels.feishu.groups.<chat_id>.requireMention`        | 按群组覆盖 @提及设置；显式 ID 还会在允许列表模式下准入该群组                         | 继承                                 |
| `channels.feishu.groups.<chat_id>.enabled`               | 启用/禁用特定群组                                                                    | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | 按群组设置发送者允许列表（覆盖 `groupSenderAllowFrom`）                              | -                                    |
| `channels.feishu.groupSessionScope`                      | 群组会话映射（`group`、`group_sender`、`group_topic`、`group_topic_sender`）         | `group`                              |
| `channels.feishu.replyInThread`                          | Bot 回复创建/延续话题线程（`disabled`、`enabled`）                                   | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | 入站表情回应事件（`off`、`own`、`all`）                                              | `own`                                |
| `channels.feishu.dynamicAgentCreation.enabled`           | 启用自动为每位用户创建智能体                                                         | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | 动态智能体工作区的路径模板                                                           | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | 智能体目录名称模板                                                                   | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | 可创建的动态智能体最大数量                                                           | 无限制                               |
| `channels.feishu.textChunkLimit`                         | 消息分块大小                                                                         | `4000`                               |
| `channels.feishu.chunkMode`                              | 分块拆分方式（`length` 或 `newline`）                                                | `length`                             |
| `channels.feishu.mediaMaxMb`                             | 媒体大小限制                                                                         | `30`                                 |
| `channels.feishu.renderMode`                             | 回复渲染方式（`auto`、`raw`、`card`）                                                | `auto`                               |
| `channels.feishu.streaming`                              | 流式卡片输出                                                                         | `true`                               |
| `channels.feishu.blockStreaming`                         | 已完成内容块的回复流式传输                                                           | `false`                              |
| `channels.feishu.typingIndicator`                        | 发送正在输入表情回应                                                                 | `true`                               |
| `channels.feishu.resolveSenderNames`                     | 解析发送者显示名称                                                                   | `true`                               |
| `channels.feishu.configWrites`                           | 允许由渠道发起配置写入（动态智能体需要）                                             | `true`                               |
| `channels.feishu.tools.doc`                              | 启用文档工具                                                                         | `true`                               |
| `channels.feishu.tools.chat`                             | 启用聊天信息工具                                                                     | `true`                               |
| `channels.feishu.tools.wiki`                             | 启用知识库工具（需要 `doc`）                                                         | `true`                               |
| `channels.feishu.tools.drive`                            | 启用云存储工具                                                                       | `true`                               |
| `channels.feishu.tools.perm`                             | 启用权限管理工具                                                                     | `false`                              |
| `channels.feishu.tools.scopes`                           | 启用应用权限范围诊断工具                                                             | `true`                               |
| `channels.feishu.tools.bitable`                          | 启用多维表格/Base 工具                                                               | `true`                               |
| `channels.feishu.tools.base`                             | `channels.feishu.tools.bitable` 的别名；两者均设置时以显式 `bitable` 为准            | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | 按账户设置多维表格/Base 工具开关                                                      | 继承                                 |
| `channels.feishu.accounts.<id>.tools.base`               | 按账户设置的 `tools.bitable` 别名                                                     | 继承                                 |

## 支持的消息类型

### 接收

- ✅ 文本
- ✅ 富文本（帖子）
- ✅ 图片
- ✅ 文件
- ✅ 音频
- ✅ 视频/媒体
- ✅ 贴纸

入站 Feishu/Lark 音频消息会被规范化为媒体占位符，而不是原始
`file_key` JSON。配置 `tools.media.audio` 后，OpenClaw
会下载语音留言资源，并在智能体轮次开始前运行共享音频转写，
让智能体收到语音转写文本。如果 Feishu 在音频载荷中直接包含
转写文本，则会直接使用该文本，而不会再次调用 ASR。若没有音频转写提供商，
智能体仍会收到 `<media:audio>` 占位符和已保存的附件，而不是原始 Feishu
资源载荷。

### 发送

- ✅ 文本
- ✅ 图片
- ✅ 文件
- ✅ 音频
- ✅ 视频/媒体
- ✅ 交互式卡片（包括流式更新）
- ⚠️ 富文本（帖子样式格式；不支持 Feishu/Lark 的全部创作功能）

原生 Feishu/Lark 音频气泡使用 Feishu `audio` 消息类型，并要求
上传 Ogg/Opus 媒体（`file_type: "opus"`）。现有 `.opus` 和 `.ogg` 媒体
会直接作为原生音频发送。仅当回复请求以语音方式发送
（`audioAsVoice` / 消息工具 `asVoice`，包括 TTS 语音留言回复）时，
MP3/WAV/M4A 及其他可能的音频格式才会使用 `ffmpeg`
转码为 48kHz Ogg/Opus。普通 MP3 附件仍作为常规文件发送。如果缺少 `ffmpeg`
或转换失败，OpenClaw 会回退为文件附件并记录原因。

### 线程和回复

- ✅ 行内回复
- ✅ 线程回复
- ✅ 回复线程消息时，媒体回复仍会感知线程上下文

话题群组会话路由详见
[群组会话范围和话题线程](#group-session-scope-and-topic-threads)。

## 相关内容

- [渠道概览](/zh-CN/channels) - 所有支持的渠道
- [配对](/zh-CN/channels/pairing) - 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) - 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) - 消息的会话路由
- [安全性](/zh-CN/gateway/security) - 访问模型和安全加固
