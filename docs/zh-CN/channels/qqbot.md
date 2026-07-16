---
read_when:
    - 你想将 OpenClaw 连接到 QQ
    - 你需要设置 QQ Bot 凭据
    - 你想要 QQ Bot 群聊或私聊支持
summary: QQ Bot 设置、配置和使用方法
title: QQ Bot
x-i18n:
    generated_at: "2026-07-16T11:25:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 71b0909e28e28d7f88e93b6f022f9aa2a4421d1381bb1ab4b706f381585ba476
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot 通过官方 QQ Bot API（WebSocket Gateway 网关）连接到 OpenClaw。
C2C 私聊和群组 `@` 提及是主要聊天类型，支持丰富的
媒体（图片、语音、视频、文件）。频道消息仅支持
文本和远程 URL 图片；频道中不支持语音、视频、文件上传以及本地/Base64
图片。任何位置均不支持表情回应和话题串。

状态：官方可下载插件。

## 安装

```bash
openclaw plugins install @openclaw/qqbot
```

## 设置

1. 前往 [QQ 开放平台](https://q.qq.com/)，使用手机
   QQ 扫描二维码以注册/登录。
2. 点击 **创建机器人** 创建新的 QQ Bot。
3. 在机器人的设置页面找到 **AppID** 和 **AppSecret** 并复制。

<Note>
AppSecret 不会以明文存储。如果未保存就离开页面，则必须重新生成一个。
</Note>

4. 添加渠道：

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. 重启 Gateway 网关。

交互式设置：

```bash
openclaw channels add
```

除了手动输入 AppID/AppSecret，向导还提供二维码绑定方式：
使用与目标 QQ Bot 关联的手机应用扫描二维码即可完成绑定。
OpenClaw 会将返回的凭据持久保存到该账户的配置作用域中。

## 配置

最小配置：

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

默认账户环境变量（仅限顶层账户）：

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

基于文件的 AppSecret：

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

环境变量 SecretRef AppSecret：

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: { source: "env", provider: "default", id: "QQBOT_CLIENT_SECRET" },
    },
  },
}
```

注意：

- `openclaw channels add --channel qqbot --token-file ...` 仅设置 AppSecret；
  必须已在配置或 `QQBOT_APP_ID` 中设置 `appId`。
- `clientSecret` 接受明文字符串、文件路径（`clientSecretFile`）
  或结构化 SecretRef 对象。
- 对于 `clientSecret`，旧版 `secretref:...` / `secretref-env:...` 标记字符串会被拒绝；
  请改用结构化 SecretRef 对象。

### 流式传输

```json5
{
  channels: {
    qqbot: {
      streaming: {
        mode: "partial", // 分块流式传输："partial"（默认）或 "off"
        nativeTransport: true, // 对私信使用 QQ 官方 C2C stream_messages API
      },
    },
  },
}
```

- `streaming.mode: "off"` 会为该账户禁用分块流式传输。
- `streaming.nativeTransport: true` 通过 QQ 官方
  `stream_messages` API 流式传输 C2C（私信）回复；群组/频道目标不受影响。
- 旧版 `streaming: true|false` 标量和 `streaming.c2cStreamApi` 键
  可通过 `openclaw doctor --fix` 迁移为此结构。
- `/bot-streaming on|off` 可在私信中切换同一配置。

### 访问策略

- `allowFrom` / `groupAllowFrom` 限制可在 C2C /
  群组场景中与机器人聊天的用户。`dmPolicy` / `groupPolicy`（`open` | `allowlist` | `disabled`）
  控制强制执行模式。`allowFrom` 中存在具体的（非通配符）条目后，
  `dmPolicy` 默认为 `allowlist`，否则默认为 `open`。
  `groupAllowFrom` 或 `allowFrom` 中任一存在具体条目后，
  `groupPolicy` 默认为 `allowlist`，否则默认为 `open`。
- 无论 `dmPolicy` / `groupPolicy` 如何设置，“身份验证：允许列表”斜杠命令都要求
  `allowFrom` 中存在明确的非通配符条目（群组调用则为 `groupAllowFrom`）；
  请参阅[斜杠命令](#slash-commands)。

### 多账户设置

在单个 OpenClaw 实例下运行多个 QQ Bot：

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

每个账户都有按 `appId` 键控的独立 WebSocket 连接、API 客户端和令牌
缓存。日志行会标记所属账户 ID，因此在一个 Gateway 网关下运行多个机器人时，
诊断信息仍可彼此区分。

通过 CLI 添加第二个机器人：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 群聊

群组支持使用 QQ 群 OpenID，而不是显示名称。将机器人添加到
群组，然后提及它，或将该群组配置为无需提及即可运行。

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          commandLevel: "all",
          historyLimit: 50,
          tools: { deny: ["exec", "read", "write"] },
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          commandLevel: "safety",
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` 为每个群组设置默认值；具体的 `groups.GROUP_OPENID`
条目会覆盖一个群组的这些默认值。群组设置：

| 字段                 | 默认值          | 说明                                                                                        |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | 要求先进行 `@` 提及，机器人才会回复。                                                     |
| `commandLevel`        | `all`            | 可在群组中运行哪些内置斜杠命令（见下文）。                                    |
| `ignoreOtherMentions` | `false`          | 丢弃提及其他人但未提及机器人的消息。                                           |
| `historyLimit`        | `50`             | 保留最近未提及机器人的消息，作为下一次被提及时的上下文。`0` 禁用历史记录。     |
| `tools`               | —                | 为整个群组允许/拒绝工具。                                                              |
| `toolsBySender`       | —                | 按发送者覆盖工具设置；请参阅[群组](/zh-CN/channels/groups#groupchannel-tool-restrictions-optional)。 |
| `name`                | OpenID 前缀    | 在日志和群组上下文中使用的友好标签。                                                     |
| `prompt`              | 内置默认值 | 附加到智能体上下文的群组专属行为提示词。                                           |

`commandLevel` 接受：

| 级别    | 行为                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | 现有内置命令保持可用。部分命令仍会从菜单中隐藏，但获授权的用户依然可在群组中运行它们。                  |
| `safety` | `/help`、`/btw`、`/stop` 在群组中保持可见；敏感命令（`/config`、`/tools`、`/bash` 等）必须在私聊中运行。      |
| `strict` | 仅允许严格操作所需的群组会话控制命令。`/stop` 仍然有效，因此获授权的发送者可以中断正在进行的运行。 |

旧 QQBot `toolPolicy` 条目已停用。运行 `openclaw doctor --fix` 将其迁移到 `tools`。

激活模式为 `mention` 和 `always`。`requireMention: true` 映射到
`mention`；`requireMention: false` 映射到 `always`。如果存在会话级激活
覆盖设置，则优先于配置。

入站队列按对端划分。群组对端的队列上限更大（50，而直接对端为 20），
队列已满时会先淘汰机器人发送的消息，再淘汰人类发送的消息，
并将连续出现的普通群组消息合并为一个标明发送者的轮次。斜杠
命令逐个运行，不受任何合并批次影响。

### 语音（STT / TTS）

STT 和 TTS 支持带优先级回退的两级配置：

| 设置 | 插件专属                                          | 框架回退            |
| ------- | -------------------------------------------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`、`channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
      accounts: {
        "qq-main": {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

在任一配置中设置 `enabled: false` 即可禁用。账户级 TTS 覆盖使用与
`messages.tts` 相同的结构，并在渠道/全局 TTS 配置之上进行深度合并。

STT 请求默认在 60 秒后超时。插件专属 STT 使用所选的
`models.providers.<id>.timeoutSeconds` 覆盖值。框架音频 STT
依次使用 `tools.media.audio.models[0].timeoutSeconds`、
`tools.media.audio.timeoutSeconds`，然后使用所选提供商的覆盖值。

入站 QQ 语音附件会作为音频媒体元数据提供给智能体，
同时避免将原始语音文件放入通用 `MediaPaths`。配置 TTS 后，
纯文本回复中的 `[[audio_as_voice]]` 会合成 TTS 并发送原生 QQ 语音消息。

还可以使用 `channels.qqbot.audioFormatPolicy` 调整出站音频上传/转码行为：

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 目标格式

| 格式                     | 说明        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | 私聊（C2C） |
| `qqbot:group:GROUP_OPENID` | 群聊         |
| `qqbot:channel:CHANNEL_ID` | 频道      |

<Note>
每个机器人都有自己的一组用户 OpenID。机器人 A 收到的 OpenID **不能**用于通过机器人 B 发送消息。
</Note>

## 斜杠命令

在进入 AI 队列前拦截的内置命令：

| 命令              | 身份验证      | 范围        | 描述                                                                    |
| -------------------- | --------- | ------------ | ------------------------------------------------------------------------------ |
| `/bot-ping`          | —         | 任意          | 延迟测试                                                                   |
| `/bot-help`          | —         | 任意          | 列出所有命令                                                              |
| `/bot-me`            | —         | 仅限私聊 | 显示发送者的 QQ 用户 ID（openid），用于设置 `allowFrom` / `groupAllowFrom` |
| `/bot-version`       | —         | 仅限私聊 | 显示 OpenClaw 框架版本和插件版本                         |
| `/bot-upgrade`       | —         | 仅限私聊 | 显示 QQ Bot 升级指南链接                                              |
| `/bot-approve`       | 允许列表 | 仅限私聊 | 管理命令执行审批配置（开启 / 关闭 / 始终 / 重置 / 状态）  |
| `/bot-logs`          | 允许列表 | 仅限私聊 | 将最近的 Gateway 网关日志导出为文件                                           |
| `/bot-clear-storage` | 允许列表 | 仅限私聊 | 删除 QQ Bot 媒体目录下缓存的下载文件                        |
| `/bot-streaming`     | 允许列表 | 仅限私聊 | 切换 C2C 流式回复                                                   |
| `/bot-group-allways` | 允许列表 | 仅限私聊 | 切换默认群组激活模式（需要提及与始终启用）      |

在任意命令后附加 `?` 可查看用法帮助（例如 `/bot-upgrade ?`）。

“身份验证：允许列表”命令还要求发送者的 openid 位于显式的非通配符
`allowFrom` 列表中（对于群组发出的命令，`groupAllowFrom` 优先，
否则回退到 `allowFrom`）。通配符
`allowFrom: ["*"]` 允许聊天，但不允许执行这些命令。在私聊之外运行这些命令，
或未获得授权时，会返回提示，而不是静默丢弃消息。

`/bot-me`、`/bot-version` 和 `/bot-upgrade` 仅限私聊，但不
要求允许列表——任何 C2C 发送者都可以运行它们。

当 QQ Bot Exec 审批使用默认的同一聊天回退机制时，点击原生审批
按钮也遵循相同的显式非通配符命令允许列表。要仅授予审批权限而不授予
更广泛的命令访问权限，请配置
`channels.qqbot.execApprovals.approvers`。原生 Exec 审批默认
启用。

## 媒体和存储

- 入站、出站和 Gateway 网关桥接媒体共用
  `~/.openclaw/media/qqbot` 下的同一个有效负载根目录（设置 `OPENCLAW_HOME` 时会遵循该设置），因此上传、
  下载和转码缓存都位于同一个受保护目录下。
- 面向 C2C 和群组目标的富媒体交付统一通过 `sendMedia`
  路径完成。大小为 5&nbsp;MiB 或更大的本地文件和内存缓冲区使用 QQ 的
  分块上传端点；较小的有效负载以及远程 URL/Base64 来源使用
  单次上传 API。
- 如果热升级在 Gateway 网关完成写入
  `openclaw.json` 之前将其中断，插件会在下次启动时从内部快照恢复该账户
  最后已知的 `appId` / `clientSecret`
  （绝不会覆盖有意进行的配置更改），因此无需
  重新扫描二维码。

## 故障排查

- **Gateway 网关无法启动 / 没有入站消息：**请验证 `appId` 和
  `clientSecret` 是否正确，并确认已在 QQ 开放平台启用该 Bot。
  缺少凭据时会显示“QQBot 未配置（缺少 appId 或
  clientSecret）”。
- **使用 `--token-file` 设置后仍显示未配置：**`--token-file` 仅
  设置 AppSecret。仍必须在配置或 `QQBOT_APP_ID` 中设置 `appId`。
- **突发群组回复发生冲突：**当某个对等方的队列已满时，入站队列会优先逐出
  Bot 发出的消息，而不是人类发出的消息；同时会将突发的普通（非命令）
  群组消息合并为一个带来源归属的轮次，因此大量 Bot 消息
  不应导致人类消息得不到处理。
- **主动消息未送达：**如果用户近期没有互动，QQ 可能会阻止
  Bot 主动发起的消息。
- **语音未转录：**请确保已配置 STT，且提供商
  可访问。

## 相关内容

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [渠道故障排查](/zh-CN/channels/troubleshooting)
