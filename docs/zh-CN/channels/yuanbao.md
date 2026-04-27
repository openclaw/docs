---
read_when:
    - 你想要连接一个 YuanBao 机器人
    - 你正在配置 YuanBao 渠道
summary: YuanBao 机器人概览、功能和配置
title: YuanBao
x-i18n:
    generated_at: "2026-04-27T15:08:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a9177cba0fb64b9d47762450ff9ec7b0ae497ed0027f98f35dbd6b1bc252110
    source_path: channels/yuanbao.md
    workflow: 15
---

# YuanBao

YuanBao 是腾讯的 AI 助手平台，支持通过即时消息进行机器人集成。机器人可以通过私信和群聊与用户互动。

**Status：** 机器人私信 + 群聊已可用于生产环境。WebSocket 是唯一受支持的连接模式。

---

## 快速开始

> **需要 OpenClaw 2026.4.10 或更高版本。** 运行 `openclaw --version` 进行检查。使用 `openclaw update` 升级。

<Steps>
  <Step title="使用你的凭证添加 YuanBao 渠道">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` 的值使用以冒号分隔的 `appKey:appSecret` 格式。你可以在 YuanBao APP 中通过在应用设置里创建机器人来获取这些信息。
  </Step>

  <Step title="设置完成后，重启 Gateway 网关以应用更改">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### 交互式设置（替代方式）

你也可以使用交互式向导：

```bash
openclaw channels login --channel yuanbao
```

按照提示输入你的 App ID 和 App Secret。

---

## 访问控制

### 私信

配置 `dmPolicy` 以控制谁可以向机器人发送私信：

- `"pairing"` — 未知用户会收到配对码；通过 CLI 批准
- `"allowlist"` — 只有列在 `allowFrom` 中的用户可以聊天
- `"open"` — 允许所有用户（默认）
- `"disabled"` — 禁用所有私信

**批准配对请求：**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### 群聊

**提及要求**（`channels.yuanbao.requireMention`）：

- `true` — 需要 @提及（默认）
- `false` — 无需 @提及也会回复

在群聊中回复机器人的消息会被视为隐式提及。

---

## 配置示例

### 使用开放私信策略的基础设置

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

### 将私信限制为特定用户

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

### 在群组中禁用 @提及要求

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### 优化出站消息传递

```json5
{
  channels: {
    yuanbao: {
      // 立即发送每个分块，不进行缓冲
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### 调整 merge-text 策略

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // 缓冲直到达到这么多字符
      maxChars: 3000, // 超过此限制时强制拆分
      idleMs: 5000, // 空闲超时后自动刷新（毫秒）
    },
  },
}
```

---

## 常用命令

| Command    | 描述             |
| ---------- | ---------------- |
| `/help`    | 显示可用命令     |
| `/status`  | 显示机器人状态   |
| `/new`     | 开始一个新会话   |
| `/stop`    | 停止当前运行     |
| `/restart` | 重启 OpenClaw    |
| `/compact` | 压缩会话上下文   |

> YuanBao 支持原生斜杠命令菜单。Gateway 网关启动时会自动将命令同步到平台。

---

## 故障排除

### 机器人在群聊中没有响应

1. 确保机器人已加入群组
2. 确保你 @提及了机器人（默认要求）
3. 检查日志：`openclaw logs --follow`

### 机器人没有收到消息

1. 确保机器人已在 YuanBao APP 中创建并通过审核
2. 确保 `appKey` 和 `appSecret` 已正确配置
3. 确保 Gateway 网关正在运行：`openclaw gateway status`
4. 检查日志：`openclaw logs --follow`

### 机器人发送空回复或回退回复

1. 检查 AI 模型是否返回了有效内容
2. 默认的回退回复是：“暂时无法解答，你可以换个问题问问我哦”
3. 可通过 `channels.yuanbao.fallbackReply` 自定义

### App Secret 泄露

1. 在 YuanBao APP 中重置 App Secret
2. 更新你配置中的值
3. 重启 Gateway 网关：`openclaw gateway restart`

---

## 高级配置

### 多账户

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "主机器人",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "备用机器人",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` 控制在出站 API 未指定 `accountId` 时使用哪个账户。

### 消息限制

- `maxChars` — 单条消息的最大字符数（默认：`3000` 个字符）
- `mediaMaxMb` — 媒体上传/下载限制（默认：`20` MB）
- `overflowPolicy` — 消息超出限制时的行为：`"split"`（默认）或 `"stop"`

### 流式传输

YuanBao 支持块级分块流式传输输出。启用后，机器人会在生成文本时按块发送。

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // 启用分块流式传输（默认）
    },
  },
}
```

设置 `disableBlockStreaming: true` 可在一条消息中发送完整回复。

### 群聊历史上下文

控制在群聊的 AI 上下文中包含多少条历史消息：

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // 默认：100，设置为 0 可禁用
    },
  },
}
```

### 回复模式

控制机器人在群聊中回复时如何引用消息：

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all"（默认："first"）
    },
  },
}
```

| Value     | 行为                                             |
| --------- | ------------------------------------------------ |
| `"off"`   | 不进行引用回复                                   |
| `"first"` | 每条入站消息仅对第一条回复进行引用（默认）       |
| `"all"`   | 引用每一条回复                                   |

### Markdown 提示注入

默认情况下，机器人会在系统提示中注入说明，以防止 AI 模型将整个回复包裹在 markdown 代码块中。

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // 默认：true
    },
  },
}
```

### 调试模式

为特定机器人 ID 启用未清洗的日志输出：

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### 多智能体路由

使用 `bindings` 将 YuanBao 私信或群组路由到不同智能体。

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
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

路由字段：

- `match.channel`：`"yuanbao"`
- `match.peer.kind`：`"direct"`（私信）或 `"group"`（群聊）
- `match.peer.id`：用户 ID 或群组代码

---

## 配置参考

完整配置：[Gateway 网关配置](/zh-CN/gateway/configuration)

| Setting                                    | 描述                                         | 默认值                                 |
| ------------------------------------------ | -------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | 启用/禁用该渠道                              | `true`                                 |
| `channels.yuanbao.defaultAccount`          | 用于出站路由的默认账户                       | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key（用于签名和票据生成）                | —                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret（用于签名）                       | —                                      |
| `channels.yuanbao.accounts.<id>.token`     | 预签名 token（跳过自动票据签名）             | —                                      |
| `channels.yuanbao.accounts.<id>.name`      | 账户显示名称                                 | —                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | 启用/禁用特定账户                            | `true`                                 |
| `channels.yuanbao.dm.policy`               | 私信策略                                     | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | 私信允许列表（用户 ID 列表）                 | —                                      |
| `channels.yuanbao.requireMention`          | 在群组中要求 @提及                           | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | 长消息处理方式（`split` 或 `stop`）          | `split`                                |
| `channels.yuanbao.replyToMode`             | 群组 reply-to 策略（`off`、`first`、`all`）  | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | 出站策略（`merge-text` 或 `immediate`）      | `merge-text`                           |
| `channels.yuanbao.minChars`                | merge-text：触发发送的最小字符数             | `2800`                                 |
| `channels.yuanbao.maxChars`                | merge-text：每条消息的最大字符数             | `3000`                                 |
| `channels.yuanbao.idleMs`                  | merge-text：自动刷新的空闲超时（毫秒）       | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | 媒体大小限制（MB）                           | `20`                                   |
| `channels.yuanbao.historyLimit`            | 群聊历史上下文条目数                         | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | 禁用块级分块流式传输输出                     | `false`                                |
| `channels.yuanbao.fallbackReply`           | 当 AI 未返回内容时的回退回复                 | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | 注入防止 markdown 包裹的提示说明             | `true`                                 |
| `channels.yuanbao.debugBotIds`             | 调试白名单机器人 ID（未清洗日志）            | `[]`                                   |

---

## 支持的消息类型

### 接收

- ✅ 文本
- ✅ 图片
- ✅ 文件
- ✅ 音频 / 语音
- ✅ 视频
- ✅ 贴纸 / 自定义表情
- ✅ 自定义元素（链接卡片等）

### 发送

- ✅ 文本（支持 markdown）
- ✅ 图片
- ✅ 文件
- ✅ 音频
- ✅ 视频
- ✅ 贴纸

### 线程和回复

- ✅ 引用回复（可通过 `replyToMode` 配置）
- ❌ 线程回复（平台不支持）

---

## 相关内容

- [渠道概览](/zh-CN/channels) — 所有受支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固
