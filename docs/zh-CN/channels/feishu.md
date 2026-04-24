---
read_when:
    - 你想连接一个 Feishu/Lark 机器人
    - 你正在配置 Feishu 渠道
summary: Feishu 机器人概览、功能和配置
title: Feishu
x-i18n:
    generated_at: "2026-04-24T01:17:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: f68a03c457fb2be7654f298fbad759705983d9e673b7b7b950609694894bdcbc
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark 是一个一体化协作平台，团队可以在其中聊天、共享文档、管理日历，并协同完成工作。

**状态：** 已可用于生产环境，支持机器人私信 + 群聊。WebSocket 是默认模式；webhook 模式为可选。

---

## 快速开始

> **需要 OpenClaw 2026.4.24 或更高版本。** 运行 `openclaw --version` 进行检查。使用 `openclaw update` 升级。

<Steps>
  <Step title="运行渠道设置向导">
  ```bash
  openclaw channels login --channel feishu
  ```
  使用你的 Feishu/Lark 移动应用扫描二维码，以自动创建一个 Feishu/Lark 机器人。
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

配置 `dmPolicy` 以控制谁可以向机器人发送私信：

- `"pairing"` — 未知用户会收到配对码；通过 CLI 批准
- `"allowlist"` — 只有 `allowFrom` 中列出的用户可以聊天（默认：仅机器人所有者）
- `"open"` — 允许所有用户
- `"disabled"` — 禁用所有私信

**批准配对请求：**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### 群聊

**群组策略** (`channels.feishu.groupPolicy`)：

| Value         | 行为 |
| ------------- | ---- |
| `"open"`      | 响应群组中的所有消息 |
| `"allowlist"` | 仅响应 `groupAllowFrom` 中的群组 |
| `"disabled"`  | 禁用所有群组消息 |

默认值：`allowlist`

**提及要求** (`channels.feishu.requireMention`)：

- `true` — 需要 `@mention`（默认）
- `false` — 无需 `@mention` 也会响应
- 按群组覆盖：`channels.feishu.groups.<chat_id>.requireMention`

---

## 群组配置示例

### 允许所有群组，无需 `@mention`

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### 允许所有群组，但仍要求 `@mention`

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
      // 群组 ID 形如：oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
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
          // 用户 open_id 形如：ou_xxx
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

### 群组 ID (`chat_id`，格式：`oc_xxx`)

在 Feishu/Lark 中打开群组，点击右上角的菜单图标，然后进入 **设置**。群组 ID (`chat_id`) 会显示在设置页面上。

![Get Group ID](/images/feishu-get-group-id.png)

### 用户 ID (`open_id`，格式：`ou_xxx`)

启动 Gateway 网关，向机器人发送一条私信，然后查看日志：

```bash
openclaw logs --follow
```

在日志输出中查找 `open_id`。你也可以查看待处理的配对请求：

```bash
openclaw pairing list feishu
```

---

## 常用命令

| Command   | 描述 |
| --------- | ---- |
| `/status` | 显示机器人状态 |
| `/reset`  | 重置当前会话 |
| `/model`  | 显示或切换 AI 模型 |

> Feishu/Lark 不支持原生斜杠命令菜单，因此请将这些命令作为普通文本消息发送。

---

## 故障排除

### 机器人在群聊中没有响应

1. 确保机器人已被添加到群组中
2. 确保你已 `@mention` 机器人（默认要求）
3. 确认 `groupPolicy` 不是 `"disabled"`
4. 查看日志：`openclaw logs --follow`

### 机器人没有接收到消息

1. 确保机器人已在 Feishu Open Platform / Lark Developer 中发布并获批
2. 确保事件订阅包含 `im.message.receive_v1`
3. 确保已选择 **persistent connection**（WebSocket）
4. 确保已授予所有必需的权限范围
5. 确保 Gateway 网关正在运行：`openclaw gateway status`
6. 查看日志：`openclaw logs --follow`

### App Secret 泄露

1. 在 Feishu Open Platform / Lark Developer 中重置 App Secret
2. 更新你配置中的对应值
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

`defaultAccount` 控制在出站 API 未指定 `accountId` 时使用哪个账号。

### 消息限制

- `textChunkLimit` — 出站文本分块大小（默认：`2000` 个字符）
- `mediaMaxMb` — 媒体上传/下载限制（默认：`30` MB）

### 流式传输

Feishu/Lark 支持通过交互卡片进行流式回复。启用后，机器人会在生成文本时实时更新卡片。

```json5
{
  channels: {
    feishu: {
      streaming: true, // 启用流式卡片输出（默认：true）
      blockStreaming: true, // 启用分块流式传输（默认：true）
    },
  },
}
```

将 `streaming: false` 设为关闭后，会在一条消息中发送完整回复。

### 配额优化

使用两个可选标志减少 Feishu/Lark API 调用次数：

- `typingIndicator`（默认 `true`）：设为 `false` 以跳过“正在输入”反应调用
- `resolveSenderNames`（默认 `true`）：设为 `false` 以跳过发送者资料查询

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

Feishu/Lark 支持用于私信和群组话题消息的 ACP。Feishu/Lark ACP 由文本命令驱动——没有原生斜杠命令菜单，因此请直接在对话中使用 `/acp ...` 消息。

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

#### 从聊天中启动 ACP

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

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"`（私信）或 `"group"`（群聊）
- `match.peer.id`: 用户 Open ID (`ou_xxx`) 或群组 ID (`oc_xxx`)

查找提示请参见 [获取群组/用户 ID](#get-groupuser-ids)。

---

## 配置参考

完整配置：[Gateway 网关配置](/zh-CN/gateway/configuration)

| Setting                                           | 描述 | Default          |
| ------------------------------------------------- | ---- | ---------------- |
| `channels.feishu.enabled`                         | 启用/禁用该渠道 | `true`           |
| `channels.feishu.domain`                          | API 域名（`feishu` 或 `lark`） | `feishu`         |
| `channels.feishu.connectionMode`                  | 事件传输方式（`websocket` 或 `webhook`） | `websocket`      |
| `channels.feishu.defaultAccount`                  | 出站路由的默认账号 | `default`        |
| `channels.feishu.verificationToken`               | webhook 模式必需 | —                |
| `channels.feishu.encryptKey`                      | webhook 模式必需 | —                |
| `channels.feishu.webhookPath`                     | Webhook 路由路径 | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhook 绑定主机 | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhook 绑定端口 | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret | —                |
| `channels.feishu.accounts.<id>.domain`            | 按账号覆盖域名 | `feishu`         |
| `channels.feishu.dmPolicy`                        | 私信策略 | `allowlist`      |
| `channels.feishu.allowFrom`                       | 私信允许列表（`open_id` 列表） | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | 群组策略 | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | 群组允许列表 | —                |
| `channels.feishu.requireMention`                  | 在群组中要求 `@mention` | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | 按群组覆盖 `@mention` | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | 启用/禁用特定群组 | `true`           |
| `channels.feishu.textChunkLimit`                  | 消息分块大小 | `2000`           |
| `channels.feishu.mediaMaxMb`                      | 媒体大小限制 | `30`             |
| `channels.feishu.streaming`                       | 流式卡片输出 | `true`           |
| `channels.feishu.blockStreaming`                  | 分块流式传输 | `true`           |
| `channels.feishu.typingIndicator`                 | 发送“正在输入”反应 | `true`           |
| `channels.feishu.resolveSenderNames`              | 解析发送者显示名称 | `true`           |

---

## 支持的消息类型

### 接收

- ✅ 文本
- ✅ 富文本（post）
- ✅ 图片
- ✅ 文件
- ✅ 音频
- ✅ 视频/媒体
- ✅ 贴纸

### 发送

- ✅ 文本
- ✅ 图片
- ✅ 文件
- ✅ 音频
- ✅ 视频/媒体
- ✅ 交互卡片（包括流式更新）
- ⚠️ 富文本（post 风格格式；不支持 Feishu/Lark 的全部原生编辑能力）

### 话题和回复

- ✅ 内联回复
- ✅ 话题回复
- ✅ 回复话题消息时，媒体回复会保持话题感知

---

## 相关内容

- [渠道概览](/zh-CN/channels) — 所有受支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型与加固措施
