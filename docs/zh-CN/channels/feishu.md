---
read_when:
    - 你想要连接 Feishu/Lark 机器人
    - 你正在配置 Feishu 渠道
summary: Feishu 机器人概览、功能和配置
title: Feishu
x-i18n:
    generated_at: "2026-06-27T01:20:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a12e91ff42b17ee99f07c10933d65a407db8ed9de2ac7bc6028d7004aa4e346
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark 是一个一体化协作平台，团队可在其中聊天、共享文档、管理日历，并一起完成工作。

**状态：**机器人私信 + 群聊已可用于生产。WebSocket 是默认模式；webhook 模式可选。

---

## 快速开始

<Note>
需要 OpenClaw 2026.5.29 或更高版本。运行 `openclaw --version` 检查版本。使用 `openclaw update` 升级。
</Note>

<Steps>
  <Step title="运行频道设置向导">
  ```bash
  openclaw channels login --channel feishu
  ```
  选择手动设置以粘贴来自 Feishu Open Platform 的 App ID 和 App Secret，或选择二维码设置以自动创建机器人。如果中国大陆版 Feishu 移动应用对二维码没有反应，请重新运行设置并选择手动设置。
  </Step>
  
  <Step title="设置完成后，重启 Gateway 网关以应用更改">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## 访问控制

### 私信

配置 `dmPolicy` 来控制谁可以向机器人发送私信：

- `"pairing"` - 未知用户会收到配对码；通过 CLI 批准
- `"allowlist"` - 只有列在 `allowFrom` 中的用户可以聊天
- `"open"` - 仅当 `allowFrom` 包含 `"*"` 时允许公开私信；如果是限制性条目，则只有匹配的用户可以聊天
- `"disabled"` - 禁用所有私信

**批准配对请求：**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### 群聊

**群组策略**（`channels.feishu.groupPolicy`）：

| 值            | 行为                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | 回复群组中的所有消息                                                                         |
| `"allowlist"` | 只回复 `groupAllowFrom` 中的群组，或在 `groups.<chat_id>` 下显式配置的群组                   |
| `"disabled"`  | 禁用所有群组消息；显式的 `groups.<chat_id>` 条目不会覆盖此设置                               |

默认值：`allowlist`

**提及要求**（`channels.feishu.requireMention`）：

- `true` - 要求 @提及（默认）
- `false` - 无需 @提及即可回复
- 按群组覆盖：`channels.feishu.groups.<chat_id>.requireMention`
- 仅广播的 `@all` 和 `@_all` 不会被视为机器人提及。同时提及 `@all` 和机器人的消息仍会计为机器人提及。

---

## 群组配置示例

### 允许所有群组，不要求 @提及

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### 允许所有群组，仍要求 @提及

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

### 只允许特定群组

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

在 `allowlist` 模式下，你也可以通过添加显式的 `groups.<chat_id>` 条目来允许某个群组。显式条目不会覆盖 `groupPolicy: "disabled"`。`groups.*` 下的通配符默认值会配置匹配的群组，但它们本身不会允许群组。

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
          // User open_ids look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## 获取群组/用户 ID

### 群组 ID（`chat_id`，格式：`oc_xxx`）

在 Feishu/Lark 中打开群组，点击右上角的菜单图标，然后进入**设置**。群组 ID（`chat_id`）会列在设置页面中。

![获取群组 ID](/images/feishu-get-group-id.png)

### 用户 ID（`open_id`，格式：`ou_xxx`）

启动 Gateway 网关，向机器人发送私信，然后检查日志：

```bash
openclaw logs --follow
```

在日志输出中查找 `open_id`。你也可以检查待处理的配对请求：

```bash
openclaw pairing list feishu
```

---

## 常用命令

| 命令      | 描述                 |
| --------- | -------------------- |
| `/status` | 显示机器人状态       |
| `/reset`  | 重置当前会话         |
| `/model`  | 显示或切换 AI 模型   |

<Note>
Feishu/Lark 不支持原生斜杠菜单，因此请将这些命令作为纯文本消息发送。
</Note>

---

## 故障排除

### 机器人在群聊中没有响应

1. 确保机器人已添加到群组
2. 确保你 @提及机器人（默认要求）
3. 验证 `groupPolicy` 不是 `"disabled"`
4. 检查日志：`openclaw logs --follow`

### 机器人收不到消息

1. 确保机器人已在 Feishu Open Platform / Lark Developer 中发布并获批
2. 确保事件订阅包含 `im.message.receive_v1`
3. 确保已选择**持久连接**（WebSocket）
4. 确保已授予所有必需的权限范围
5. 确保 Gateway 网关正在运行：`openclaw gateway status`
6. 检查日志：`openclaw logs --follow`

### 二维码设置在 Feishu 移动应用中没有反应

1. 重新运行设置：`openclaw channels login --channel feishu`
2. 选择手动设置
3. 在 Feishu Open Platform 中，创建一个自建应用并复制其 App ID 和 App Secret
4. 将这些凭证粘贴到设置向导中

### App Secret 泄露

1. 在 Feishu Open Platform / Lark Developer 中重置 App Secret
2. 更新你的配置中的值
3. 重启 Gateway 网关：`openclaw gateway restart`

---

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
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` 控制当出站 API 未指定 `accountId` 时使用哪个账号。
`accounts.<id>.tts` 使用与 `messages.tts` 相同的形状，并在全局 TTS 配置之上进行深度合并，因此多机器人 Feishu 设置可以在全局保留共享的提供商凭证，同时仅按账号覆盖语音、模型、人设或自动模式。

### 消息限制

- `textChunkLimit` - 出站文本分块大小（默认：`2000` 个字符）
- `mediaMaxMb` - 媒体上传/下载限制（默认：`30` MB）

### 流式传输

Feishu/Lark 支持通过交互式卡片进行流式回复。启用后，机器人会在生成文本时实时更新卡片。

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

设置 `streaming: false` 可在一条消息中发送完整回复。`blockStreaming` 默认关闭；仅当你希望在最终回复前刷新已完成的助手块时才启用它。

### 配额优化

使用两个可选标志减少 Feishu/Lark API 调用次数：

- `typingIndicator`（默认 `true`）：设置为 `false` 可跳过正在输入反应调用
- `resolveSenderNames`（默认 `true`）：设置为 `false` 可跳过发送者资料查询

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

### ACP 会话

Feishu/Lark 支持针对私信和群组线程消息的 ACP。Feishu/Lark ACP 由文本命令驱动 - 没有原生斜杠菜单，因此请直接在对话中使用 `/acp ...` 消息。

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

在 Feishu/Lark 私信或线程中：

```text
/acp spawn codex --thread here
```

`--thread here` 适用于私信和 Feishu/Lark 线程消息。绑定对话中的后续消息会直接路由到该 ACP 会话。

### 多 Agent 路由

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

请参阅[获取群组/用户 ID](#get-groupuser-ids)以了解查询提示。

---

## 每用户 Agent 隔离（动态 Agent 创建）

启用 `dynamicAgentCreation` 可为每个私信用户自动创建**隔离的智能体实例**。每个用户都会获得自己的：

- 独立工作区目录
- 单独的 `USER.md` / `SOUL.md` / `MEMORY.md`
- 私有对话历史
- 隔离的 Skills 和状态

这对于公开机器人至关重要，因为你希望每个用户都有自己的私有 AI 助手体验。

<Note>
动态绑定包含规范化后的 Feishu `accountId`，因此默认账号和命名账号会将每个发送者路由到正确的动态智能体。

如果命名账号在较旧版本中创建了未限定作用域的动态智能体，该旧版智能体仍会计入 `maxAgents`。在移除它之前，请确认默认账号未使用它，或临时提高 `maxAgents`；OpenClaw 无法安全地推断含糊旧版状态归属哪个账号。
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
    // Critical: makes each user's DM their "main session"
    // Automatically loads USER.md / SOUL.md / MEMORY.md
    // For stronger isolation, use "per-channel-peer" instead
    dmScope: "main",
  },
}
```

### 工作原理

当新用户发送第一条私信时：

1. 该渠道生成唯一的 `agentId`：默认账号使用 `feishu-{user_open_id}`，命名账号使用有界的账号前缀身份摘要
2. 在 `workspaceTemplate` 路径创建新工作区
3. 注册智能体并为该用户创建绑定
4. 工作区辅助工具会在首次访问时确保引导文件（`AGENTS.md`、`SOUL.md`、`USER.md` 等）存在
5. 将此用户之后的所有消息路由到其专属智能体

### 配置选项

| 设置                                                     | 描述                                 | 默认值                               |
| -------------------------------------------------------- | ------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | 启用按用户自动创建智能体             | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | 动态智能体工作区的路径模板           | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | 智能体目录名称模板                   | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | 要创建的动态智能体最大数量           | 不限                                 |

模板变量：

- `{agentId}` - 生成的智能体 ID（例如 `feishu-ou_xxxxxx` 或 `feishu-support-<identity_digest>`）
- `{userId}` - 发送者的 Feishu open_id（例如 `ou_xxxxxx`）

### 会话范围

`session.dmScope` 控制私信如何映射到智能体会话。这是一个会影响所有渠道的**全局设置**。

| 值                           | 行为                                               | 最适合                                                           |
| ---------------------------- | -------------------------------------------------- | ---------------------------------------------------------------- |
| `"main"`                     | 每个用户的私信映射到其智能体的 main 会话           | 希望自动加载 `USER.md` / `SOUL.md` 的单用户机器人                |
| `"per-channel-peer"`         | 每个（渠道 + 用户）组合获得一个单独会话            | 需要更强隔离的公开多用户机器人                                   |
| `"per-account-channel-peer"` | 每个（账号 + 渠道 + 用户）组合获得一个单独会话     | 需要账号级会话隔离的多账号机器人                                 |

**权衡**：使用 `"main"` 会启用自动引导文件加载（`USER.md`、`SOUL.md`、`MEMORY.md`），但意味着所有渠道中的所有私信都会共享相同的会话键模式。对于更重视隔离而不是引导自动加载的公开多用户机器人，可以考虑 `"per-channel-peer"` 并手动管理引导文件。

<Note>
当具名 Feishu 账号需要为同一发送者保留单独会话时，使用 `"per-account-channel-peer"`。动态绑定会保留账号范围。
</Note>

```json5
{
  session: {
    // For single-user personal bots: enables auto bootstrap loading
    dmScope: "main",

    // For public multi-user bots: stronger isolation
    // dmScope: "per-channel-peer",
  },
}
```

### 典型多用户部署

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
    // Choose dmScope based on your isolation needs:
    // "main" for bootstrap auto-loading, "per-channel-peer" for stronger isolation
    dmScope: "main",
  },
  bindings: [], // Empty - dynamic agents auto-bind
}
```

### 验证

检查 Gateway 网关日志以确认动态创建正在工作：

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

列出所有已创建的工作区：

```bash
ls -la ~/.openclaw/workspace-*
```

### 说明

- **工作区隔离**：每个用户都会获得自己的工作区目录和智能体实例。在正常消息流程中，用户无法看到彼此的对话历史或文件。
- **安全边界**：这是一种消息上下文隔离机制，不是针对恶意共租户的安全边界。智能体进程和主机环境是共享的。
- **`bindings` 应为空**：动态智能体会自动注册自己的绑定
- **升级路径**：现有手动绑定会继续与动态智能体并行工作
- **`session.dmScope` 是全局的**：这会影响所有渠道，而不只是 Feishu

---

## 配置参考

完整配置：[Gateway 网关配置](/zh-CN/gateway/configuration)

| 设置                                                     | 描述                                                                                      | 默认值                               |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------ |
| `channels.feishu.enabled`                                | 启用/禁用该渠道                                                                           | `true`                               |
| `channels.feishu.domain`                                 | API 域（`feishu` 或 `lark`）                                                              | `feishu`                             |
| `channels.feishu.connectionMode`                         | 事件传输协议（`websocket` 或 `webhook`）                                                   | `websocket`                          |
| `channels.feishu.defaultAccount`                         | 出站路由的默认账号                                                                        | `default`                            |
| `channels.feishu.verificationToken`                      | webhook 模式必需                                                                          | -                                    |
| `channels.feishu.encryptKey`                             | webhook 模式必需                                                                          | -                                    |
| `channels.feishu.webhookPath`                            | Webhook 路由路径                                                                          | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Webhook 绑定主机                                                                          | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Webhook 绑定端口                                                                          | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | App ID                                                                                    | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | App Secret                                                                                | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | 按账号覆盖域                                                                              | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | 按账号覆盖 TTS                                                                            | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | 私信策略                                                                                  | `pairing`                            |
| `channels.feishu.allowFrom`                              | 私信允许列表（open_id 列表）                                                              | -                                    |
| `channels.feishu.groupPolicy`                            | 群组策略                                                                                  | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | 群组允许列表                                                                              | -                                    |
| `channels.feishu.requireMention`                         | 群组中需要 @mention                                                                       | `true`                               |
| `channels.feishu.groups.<chat_id>.requireMention`        | 按群组覆盖 @mention；显式 ID 也会在允许列表模式中允许该群组                               | 继承                                 |
| `channels.feishu.groups.<chat_id>.enabled`               | 启用/禁用特定群组                                                                         | `true`                               |
| `channels.feishu.dynamicAgentCreation.enabled`           | 启用按用户自动创建智能体                                                                  | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | 动态智能体工作区的路径模板                                                                | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | 智能体目录名称模板                                                                        | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | 要创建的动态智能体最大数量                                                                | 不限                                 |
| `channels.feishu.textChunkLimit`                         | 消息分块大小                                                                              | `2000`                               |
| `channels.feishu.mediaMaxMb`                             | 媒体大小限制                                                                              | `30`                                 |
| `channels.feishu.streaming`                              | 流式卡片输出                                                                              | `true`                               |
| `channels.feishu.blockStreaming`                         | 已完成块回复流式传输                                                                      | `false`                              |
| `channels.feishu.typingIndicator`                        | 发送正在输入反应                                                                          | `true`                               |
| `channels.feishu.resolveSenderNames`                     | 解析发送者显示名称                                                                        | `true`                               |
| `channels.feishu.tools.bitable`                          | 启用 Bitable/Base 工具                                                                    | `true`                               |
| `channels.feishu.tools.base`                             | `channels.feishu.tools.bitable` 的别名；两者同时设置时，显式 `bitable` 优先               | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | 按账号控制 Bitable/Base 工具                                                              | 继承                                 |
| `channels.feishu.accounts.<id>.tools.base`               | `tools.bitable` 的按账号别名                                                              | 继承                                 |

---

## 支持的消息类型

### 接收

- ✅ 文本
- ✅ 富文本（post）
- ✅ 图片
- ✅ 文件
- ✅ 音频
- ✅ 视频/媒体
- ✅ 表情贴纸

入站 Feishu/Lark 音频消息会被规范化为媒体占位符，而不是原始 `file_key` JSON。当配置了 `tools.media.audio` 时，OpenClaw 会下载语音备注资源，并在智能体轮次之前运行共享音频转写，因此智能体会收到语音转写文本。如果 Feishu 在音频载荷中直接包含转写文本，则会直接使用该文本，而不会再进行一次 ASR 调用。如果没有音频转写提供商，智能体仍会收到一个 `<media:audio>` 占位符以及已保存的附件，而不是原始 Feishu 资源载荷。

### 发送

- ✅ 文本
- ✅ 图片
- ✅ 文件
- ✅ 音频
- ✅ 视频/媒体
- ✅ 交互式卡片（包括流式更新）
- ⚠️ 富文本（帖子式格式；不支持完整的 Feishu/Lark 创作能力）

原生 Feishu/Lark 音频气泡使用 Feishu `audio` 消息类型，并要求上传
Ogg/Opus 媒体（`file_type: "opus"`）。现有的 `.opus` 和 `.ogg` 媒体
会直接作为原生音频发送。MP3/WAV/M4A 和其他可能的音频格式仅在回复请求语音
投递（`audioAsVoice` / 消息工具 `asVoice`，包括 TTS 语音便签
回复）时，才会通过 `ffmpeg` 转码为 48kHz Ogg/Opus。普通 MP3 附件仍作为常规文件。如果缺少 `ffmpeg` 或
转换失败，OpenClaw 会回退为文件附件并记录原因。

### 话题和回复

- ✅ 行内回复
- ✅ 话题回复
- ✅ 回复话题消息时，媒体回复会保持话题感知

对于 `groupSessionScope: "group_topic"` 和 `"group_topic_sender"`，原生
Feishu/Lark 话题群组使用事件 `thread_id`（`omt_*`）作为规范的
话题会话键。如果原生话题起始事件省略了 `thread_id`，OpenClaw
会在路由该轮次前从 Feishu 补全它。OpenClaw 转换为话题的普通群组回复会继续使用回复根消息 ID（`om_*`），这样
第一轮和后续轮次会保持在同一个会话中。

---

## 相关

- [频道概览](/zh-CN/channels) - 所有支持的渠道
- [配对](/zh-CN/channels/pairing) - 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) - 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) - 消息的会话路由
- [安全](/zh-CN/gateway/security) - 访问模型和加固
