---
read_when:
    - 你想要连接一个腾讯元宝机器人
    - 你正在配置腾讯元宝渠道
summary: 腾讯元宝机器人概览、功能和配置
title: 腾讯元宝
x-i18n:
    generated_at: "2026-07-11T20:22:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

腾讯元宝是腾讯的 AI 助手平台。由社区维护的 `openclaw-plugin-yuanbao` 插件通过 WebSocket 将腾讯元宝机器人连接到 OpenClaw，以支持私信和群聊。

**状态：**已达到生产可用状态，支持机器人私信和群聊。WebSocket 是唯一受支持的连接模式。此插件由腾讯元宝团队作为外部目录条目维护，而非由 OpenClaw 核心维护；以下配置和行为详情（安装和通用 CLI 功能除外）来自插件自身的文档，尚未根据 OpenClaw 核心源代码进行验证。

## 快速开始

需要 OpenClaw 2026.4.10 或更高版本。使用 `openclaw --version` 检查版本；使用 `openclaw update` 升级。

<Steps>
  <Step title="使用你的凭据添加腾讯元宝渠道">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` 使用以冒号分隔的 `appKey:appSecret`。在腾讯元宝应用的应用设置中创建机器人，以获取这些凭据。
  </Step>

  <Step title="重启 Gateway 网关以应用更改">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### 交互式设置（替代方式）

```bash
openclaw channels login --channel yuanbao
```

按照提示输入你的 App ID 和 App Secret。

## 访问控制

### 私信

`channels.yuanbao.dm.policy`：

| 值               | 行为                                        |
| ---------------- | ------------------------------------------- |
| `open`（默认）   | 允许所有用户                                |
| `pairing`        | 未知用户会收到配对码；通过 CLI 批准         |
| `allowlist`      | 只有 `allowFrom` 中的用户可以聊天           |
| `disabled`       | 禁用所有私信                                |

批准配对请求：

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### 群聊

`channels.yuanbao.requireMention`（默认值为 `true`）：机器人在群组中回复前必须被 @提及。回复机器人自己的消息会被视为隐式提及。

## 配置示例

基本设置，开放私信策略：

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

将私信限制为特定用户：

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

禁用群组中的 @提及要求：

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

调整出站传递：

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // 缓冲至达到此字符数
      maxChars: 3000, // 超过此限制时强制拆分
      idleMs: 5000, // 空闲超时后自动刷新（毫秒）
    },
  },
}
```

设置 `outboundQueueStrategy: "immediate"` 可发送每个分块而不进行缓冲。

## 常用命令

| 命令       | 描述                 |
| ---------- | -------------------- |
| `/help`    | 显示可用命令         |
| `/status`  | 显示机器人状态       |
| `/new`     | 启动新会话           |
| `/stop`    | 停止当前运行         |
| `/restart` | 重启 OpenClaw        |
| `/compact` | 压缩会话上下文       |

腾讯元宝支持原生斜杠命令菜单；Gateway 网关启动时，命令会自动同步到平台。

## 故障排查

**机器人在群聊中没有回复：**

1. 确认机器人已添加到群组
2. 确认你已 @提及机器人（默认要求）
3. 检查日志：`openclaw logs --follow`

**机器人没有收到消息：**

1. 确认机器人已在腾讯元宝应用中创建并获批准
2. 确认 `appKey` 和 `appSecret` 配置正确
3. 确认 Gateway 网关正在运行：`openclaw gateway status`
4. 检查日志：`openclaw logs --follow`

**机器人发送空回复或回退回复：**

1. 检查 AI 模型是否返回有效内容
2. 默认回退回复：“暂时无法解答，你可以换个问题问问我哦”
3. 使用 `channels.yuanbao.fallbackReply` 自定义

**App Secret 已泄露：**

1. 在腾讯元宝应用中重置 App Secret
2. 更新配置中的值
3. 重启 Gateway 网关：`openclaw gateway restart`

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

当出站 API 未指定 `accountId` 时，`defaultAccount` 控制使用哪个账户。

### 消息限制

- `maxChars`：单条消息的最大字符数（默认值为 `3000`）
- `mediaMaxMb`：媒体上传/下载限制（默认值为 `20` MB）
- `overflowPolicy`：消息超过限制时的行为，`"split"`（默认）或 `"stop"`

### 流式传输

腾讯元宝支持分块级流式输出；机器人会在生成文本时分块发送。

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // 已启用分块流式传输（默认）
    },
  },
}
```

设置 `disableBlockStreaming: true` 可将完整回复作为一条消息发送。

### 群聊历史上下文

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // 默认值：100，设置为 0 可禁用
    },
  },
}
```

控制群聊的 AI 上下文中包含多少条历史消息。

### 引用回复模式

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all"（默认值："first"）
    },
  },
}
```

| 值      | 行为                                         |
| ------- | -------------------------------------------- |
| `off`   | 不引用回复                                   |
| `first` | 每条入站消息仅引用第一次回复（默认）         |
| `all`   | 引用每次回复                                 |

### Markdown 提示注入

默认情况下，机器人会注入一条系统提示词指令，以防止模型将整个回复包裹在 Markdown 代码块中。

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // 默认值：true
    },
  },
}
```

### 调试模式

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

为列出的机器人 ID 启用未经清理的日志输出。

### 多智能体路由

使用 `bindings` 将腾讯元宝私信或群组路由到不同的智能体：

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

- `match.channel`：`"yuanbao"`
- `match.peer.kind`：`"direct"`（私信）或 `"group"`（群聊）
- `match.peer.id`：用户 ID 或群组代码

## 配置参考

完整配置：[Gateway 配置](/zh-CN/gateway/configuration)

| 设置                                       | 描述                                             | 默认值                                 |
| ------------------------------------------ | ------------------------------------------------ | -------------------------------------- |
| `channels.yuanbao.enabled`                 | 启用/禁用渠道                                    | `true`                                 |
| `channels.yuanbao.defaultAccount`          | 用于出站路由的默认账户                           | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key（签名 + 票据生成）                       | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret（签名）                               | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | 预签名令牌（跳过自动票据签名）                   | -                                      |
| `channels.yuanbao.accounts.<id>.name`      | 账户显示名称                                     | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | 启用/禁用特定账户                                | `true`                                 |
| `channels.yuanbao.dm.policy`               | 私信策略                                         | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | 私信允许列表（用户 ID 列表）                     | -                                      |
| `channels.yuanbao.requireMention`          | 要求在群组中 @提及                               | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | 长消息处理（`split` 或 `stop`）                  | `split`                                |
| `channels.yuanbao.replyToMode`             | 群组引用回复策略（`off`、`first`、`all`）        | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | 出站策略（`merge-text` 或 `immediate`）          | `merge-text`                           |
| `channels.yuanbao.minChars`                | 合并文本：触发发送的最小字符数                   | `2800`                                 |
| `channels.yuanbao.maxChars`                | 合并文本：每条消息的最大字符数                   | `3000`                                 |
| `channels.yuanbao.idleMs`                  | 合并文本：自动刷新前的空闲超时（毫秒）           | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | 媒体大小限制（MB）                               | `20`                                   |
| `channels.yuanbao.historyLimit`            | 群聊历史上下文条目数                             | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | 禁用分块级流式输出                               | `false`                                |
| `channels.yuanbao.fallbackReply`           | 模型未返回内容时的回退回复                       | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | 注入防止 Markdown 整体包裹的指令                 | `true`                                 |
| `channels.yuanbao.debugBotIds`             | 调试允许列表中的机器人 ID（未经清理的日志）      | `[]`                                   |

## 支持的消息类型

**接收：**文本、图片、文件、音频/语音、视频、贴纸/自定义表情符号、自定义元素（链接卡片）。

**发送：**文本（Markdown）、图片、文件、音频、视频、贴纸。

**话题串和回复：**引用回复（可通过 `replyToMode` 配置）；平台不支持话题串回复。

## 相关内容

- [渠道概览](/zh-CN/channels) - 所有受支持的渠道
- [配对](/zh-CN/channels/pairing) - 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) - 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) - 消息的会话路由
- [安全性](/zh-CN/gateway/security) - 访问模型和安全加固
