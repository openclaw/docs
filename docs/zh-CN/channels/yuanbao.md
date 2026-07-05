---
read_when:
    - 你想连接一个腾讯元宝机器人
    - 你正在配置腾讯元宝渠道
summary: 腾讯元宝 Bot 概览、功能和配置
title: 腾讯元宝
x-i18n:
    generated_at: "2026-07-05T11:06:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

腾讯元宝是 Tencent 的 AI 助手平台。社区维护的 `openclaw-plugin-yuanbao` 插件通过 WebSocket 将腾讯元宝机器人连接到 OpenClaw，用于私信和群聊。

**状态：** 私信机器人和群聊已生产就绪。WebSocket 是唯一受支持的连接模式。此插件由腾讯元宝团队作为外部目录条目维护，而不是由 OpenClaw 核心维护；下面的配置/行为细节（安装和通用 CLI 表面之外）来自插件自己的文档，尚未针对 OpenClaw 核心源代码进行验证。

## 快速开始

需要 OpenClaw 2026.4.10 或更高版本。使用 `openclaw --version` 检查；使用 `openclaw update` 升级。

<Steps>
  <Step title="使用你的凭证添加腾讯元宝渠道">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` 使用以冒号分隔的 `appKey:appSecret`。在腾讯元宝应用中通过你的应用设置创建机器人来获取这些值。
  </Step>

  <Step title="重启 Gateway 网关以应用更改">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### 交互式设置（替代方案）

```bash
openclaw channels login --channel yuanbao
```

按照提示输入你的 App ID 和 App Secret。

## 访问控制

### 私信

`channels.yuanbao.dm.policy`：

| 值               | 行为                              |
| ---------------- | --------------------------------- |
| `open`（默认）   | 允许所有用户                      |
| `pairing`        | 未知用户会获得配对码；通过 CLI 批准 |
| `allowlist`      | 只有 `allowFrom` 中的用户可以聊天 |
| `disabled`       | 禁用所有私信                      |

批准配对请求：

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### 群聊

`channels.yuanbao.requireMention`（默认 `true`）：要求机器人在群组中响应前被 @提及。回复机器人自己的消息会被视为隐式提及。

## 配置示例

基础设置，开放私信策略：

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

在群组中禁用 @提及要求：

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

出站投递调优：

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer until this many chars
      maxChars: 3000, // force split above this limit
      idleMs: 5000, // auto-flush after idle timeout (ms)
    },
  },
}
```

设置 `outboundQueueStrategy: "immediate"` 可发送每个分块且不缓冲。

## 常用命令

| 命令       | 描述             |
| ---------- | ---------------- |
| `/help`    | 显示可用命令     |
| `/status`  | 显示机器人状态   |
| `/new`     | 启动新会话       |
| `/stop`    | 停止当前运行     |
| `/restart` | 重启 OpenClaw    |
| `/compact` | 压缩会话上下文   |

腾讯元宝支持原生斜杠菜单；Gateway 网关启动时，命令会自动同步到平台。

## 故障排查

**机器人在群聊中没有响应：**

1. 确认机器人已添加到群组
2. 确认你 @提及了机器人（默认要求）
3. 检查日志：`openclaw logs --follow`

**机器人没有收到消息：**

1. 确认机器人已在腾讯元宝应用中创建并获批
2. 确认 `appKey` 和 `appSecret` 已正确配置
3. 确认 Gateway 网关正在运行：`openclaw gateway status`
4. 检查日志：`openclaw logs --follow`

**机器人发送空回复或回退回复：**

1. 检查 AI 模型是否返回有效内容
2. 默认回退回复：“暂时无法解答，你可以换个问题问问我哦”
3. 使用 `channels.yuanbao.fallbackReply` 自定义

**App Secret 泄露：**

1. 在腾讯元宝应用中重置 App Secret
2. 更新你的配置中的值
3. 重启 Gateway 网关：`openclaw gateway restart`

## 高级配置

### 多账号

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` 控制当出站 API 未指定 `accountId` 时使用哪个账号。

### 消息限制

- `maxChars`：单条消息最大字符数（默认 `3000`）
- `mediaMaxMb`：媒体上传/下载限制（默认 `20` MB）
- `overflowPolicy`：消息超出限制时的行为，`"split"`（默认）或 `"stop"`

### 流式传输

腾讯元宝支持块级流式输出；机器人会在生成时按分块发送文本。

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

设置 `disableBlockStreaming: true` 可在一条消息中发送完整回复。

### 群聊历史上下文

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

控制为群聊包含在 AI 上下文中的历史消息数量。

### 回复引用模式

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| 值      | 行为                                  |
| ------- | ------------------------------------- |
| `off`   | 不引用回复                            |
| `first` | 每条入站消息只引用第一次回复（默认）  |
| `all`   | 引用每一次回复                        |

### Markdown 提示注入

默认情况下，机器人会注入一条系统提示指令，防止模型将整个回复包裹在 markdown 代码块中。

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // default: true
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

为列出的机器人 ID 启用未清理的日志输出。

### 多智能体路由

使用 `bindings` 将腾讯元宝私信或群组路由到不同智能体：

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

| 设置                                       | 描述                                      | 默认值                                 |
| ------------------------------------------ | ----------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | 启用/禁用该渠道                           | `true`                                 |
| `channels.yuanbao.defaultAccount`          | 出站路由的默认账号                        | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key（签名 + ticket 生成）             | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret（签名）                        | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | 预签名 token（跳过自动 ticket 签名）      | -                                      |
| `channels.yuanbao.accounts.<id>.name`      | 账号显示名称                              | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | 启用/禁用特定账号                         | `true`                                 |
| `channels.yuanbao.dm.policy`               | 私信策略                                  | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | 私信允许列表（用户 ID 列表）              | -                                      |
| `channels.yuanbao.requireMention`          | 要求群组中 @提及                          | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | 长消息处理（`split` 或 `stop`）           | `split`                                |
| `channels.yuanbao.replyToMode`             | 群组回复引用策略（`off`、`first`、`all`） | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | 出站策略（`merge-text` 或 `immediate`）   | `merge-text`                           |
| `channels.yuanbao.minChars`                | Merge-text：触发发送的最小字符数          | `2800`                                 |
| `channels.yuanbao.maxChars`                | Merge-text：每条消息最大字符数            | `3000`                                 |
| `channels.yuanbao.idleMs`                  | Merge-text：自动刷新前的空闲超时（ms）    | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | 媒体大小限制（MB）                        | `20`                                   |
| `channels.yuanbao.historyLimit`            | 群聊历史上下文条目                        | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | 禁用块级流式输出                          | `false`                                |
| `channels.yuanbao.fallbackReply`           | 模型未返回内容时的回退回复                | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | 注入 markdown 防包裹指令                  | `true`                                 |
| `channels.yuanbao.debugBotIds`             | 调试允许列表机器人 ID（未清理日志）       | `[]`                                   |

## 支持的消息类型

**接收：**文本、图片、文件、音频/语音、视频、贴纸/自定义表情、自定义元素（链接卡片）。

**发送：**文本（markdown）、图片、文件、音频、视频、贴纸。

**线程和回复：**引用回复（可通过 `replyToMode` 配置）；平台不支持线程回复。

## 相关

- [渠道概览](/zh-CN/channels) - 所有受支持的渠道
- [配对](/zh-CN/channels/pairing) - 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) - 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) - 消息的会话路由
- [安全](/zh-CN/gateway/security) - 访问模型和加固
