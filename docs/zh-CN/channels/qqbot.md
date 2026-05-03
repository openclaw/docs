---
read_when:
    - 你想将 OpenClaw 连接到 QQ
    - 你需要设置 QQ Bot 凭证
    - 你需要 QQ Bot 群聊或私聊支持
summary: QQ Bot 设置、配置和使用
title: QQ Bot
x-i18n:
    generated_at: "2026-05-03T11:34:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 471c24110bf0ab8896d22f5bb5932ac4e03ff5169560c99ba6b9d1ca4025d9a8
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot 通过官方 QQ Bot API（WebSocket 网关）连接到 OpenClaw。该插件支持 C2C 私聊、群组 @消息，以及带有富媒体（图片、语音、视频、文件）的频道消息。

Status：可下载插件。支持私信、群聊、频道和媒体。不支持 reactions 和 threads。

## 安装

设置前安装 QQ Bot：

```bash
openclaw plugins install @openclaw/qqbot
```

## 设置

1. 前往 [QQ 开放平台](https://q.qq.com/)，用你的手机 QQ 扫描二维码注册 / 登录。
2. 点击**创建机器人**创建新的 QQ bot。
3. 在 bot 的设置页面找到 **AppID** 和 **AppSecret** 并复制它们。

> AppSecret 不会以明文存储 —— 如果你离开页面时没有保存它，
> 就必须重新生成新的 AppSecret。

4. 添加渠道：

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. 重启 Gateway 网关。

交互式设置路径：

```bash
openclaw channels add
openclaw configure --section channels
```

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

默认账户环境变量：

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

文件托管的 AppSecret：

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

环境 SecretRef AppSecret：

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

- 环境变量回退仅适用于默认 QQ Bot 账户。
- `openclaw channels add --channel qqbot --token-file ...` 仅提供
  AppSecret；AppID 必须已在配置或 `QQBOT_APP_ID` 中设置。
- `clientSecret` 也接受 SecretRef 输入，而不只是明文字符串。
- 旧版 `secretref:/...` 标记字符串不是有效的 `clientSecret` 值；
  请使用类似上方示例的结构化 SecretRef 对象。

### 多账户设置

在单个 OpenClaw 实例下运行多个 QQ bots：

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

每个账户都会启动自己的 WebSocket 连接，并维护独立的
token 缓存（按 `appId` 隔离）。

通过 CLI 添加第二个 bot：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 群聊

QQ Bot 群聊支持使用 QQ 群 OpenID，而不是显示名称。将 bot 添加到群组，
然后提及它，或将该群配置为无需提及即可运行。

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          historyLimit: 50,
          toolPolicy: "restricted",
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` 为每个群组设置默认值，具体的
`groups.GROUP_OPENID` 条目会覆盖单个群组的这些默认值。群组
设置包括：

- `requireMention`：要求 bot 回复前必须有 @mention。默认值：`true`。
- `ignoreOtherMentions`：丢弃提到了其他人但未提到 bot 的消息。
- `historyLimit`：保留最近的非提及群消息，作为下一次被提及时的上下文。设为 `0` 可禁用。
- `toolPolicy`：群组范围工具使用 `full`、`restricted` 或 `none`。
- `name`：用于日志和群组上下文的友好标签。
- `prompt`：追加到智能体上下文的逐群组行为提示。

激活模式为 `mention` 和 `always`。`requireMention: true` 映射到
`mention`；`requireMention: false` 映射到 `always`。如果存在会话级激活
覆盖，则优先于配置。

入站队列按对端划分。群组对端拥有更大的队列上限，在队列满时会让人工
消息优先于 bot 生成的闲聊，并将普通群消息的突发合并成一个带归属的回合。
Slash commands 仍会逐条运行。

### 语音（STT / TTS）

STT 和 TTS 支持带优先级回退的两级配置：

| 设置 | 插件专用                                                 | 框架回退                      |
| ------- | -------------------------------------------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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
        qq-main: {
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

在任一项上设置 `enabled: false` 可禁用。
账户级 TTS 覆盖使用与 `messages.tts` 相同的形状，并会在渠道/全局 TTS 配置之上进行深度合并。

入站 QQ 语音附件会作为音频媒体元数据暴露给智能体，同时
让原始语音文件不进入通用 `MediaPaths`。当配置了 TTS 时，`[[audio_as_voice]]` 纯
文本回复会合成 TTS，并发送原生 QQ 语音消息。

出站音频上传/转码行为也可以通过
`channels.qqbot.audioFormatPolicy` 调整：

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 目标格式

| 格式                       | 描述              |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | 私聊（C2C）        |
| `qqbot:group:GROUP_OPENID` | 群聊              |
| `qqbot:channel:CHANNEL_ID` | 频道              |

> 每个 bot 都有自己的一组用户 OpenID。Bot A 收到的 OpenID **不能**
> 用于通过 Bot B 发送消息。

## Slash commands

进入 AI 队列前被拦截的内置命令：

| 命令           | 描述                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | 延迟测试                                                                                                 |
| `/bot-version` | 显示 OpenClaw 框架版本                                                                                   |
| `/bot-help`    | 列出所有命令                                                                                             |
| `/bot-me`      | 显示发送者的 QQ 用户 ID（openid），用于 `allowFrom`/`groupAllowFrom` 设置                                  |
| `/bot-upgrade` | 显示 QQBot 升级指南链接                                                                                  |
| `/bot-logs`    | 将最近的 Gateway 网关日志导出为文件                                                                      |
| `/bot-approve` | 通过原生流程批准待处理的 QQ Bot 操作（例如，确认 C2C 或群组上传）。                                      |

在任何命令后追加 `?` 可查看用法帮助（例如 `/bot-upgrade ?`）。

管理员命令（`/bot-me`、`/bot-upgrade`、`/bot-logs`、`/bot-clear-storage`、`/bot-streaming`、`/bot-approve`）仅限私信使用，并且要求发送者的 openid 位于显式的非通配符 `allowFrom` 列表中。通配符 `allowFrom: ["*"]` 允许聊天，但不会授予管理员命令访问权限。群组消息会先匹配 `groupAllowFrom`，然后回退到 `allowFrom`。在群组中运行管理员命令会返回提示，而不是静默丢弃。

## 引擎架构

QQ Bot 作为插件内的自包含引擎发布：

- 每个账户都拥有一套按 `appId` 标识的隔离资源栈（WebSocket 连接、API 客户端、token 缓存、媒体存储根目录）。账户之间绝不会共享入站/出站状态。
- 多账户日志记录器会用所属账户标记日志行，因此当你在同一个 Gateway 网关下运行多个 bot 时，诊断信息仍可分开查看。
- 入站、出站和 Gateway 网关桥接路径共享 `~/.openclaw/media` 下的单个媒体负载根目录，因此上传、下载和转码缓存会落在一个受保护目录下，而不是每个子系统各自一棵目录树。
- 富媒体投递对 C2C 和群组目标使用同一条 `sendMedia` 路径。超过大文件阈值的本地文件和缓冲区会使用 QQ 的分块上传端点，而较小负载会使用一次性媒体 API。
- 凭证可以作为标准 OpenClaw 凭证快照的一部分进行备份和恢复；恢复时，引擎会重新附加每个账户的资源栈，而无需重新进行二维码配对。

## 二维码新手引导

除了手动粘贴 `AppID:AppSecret`，引擎还支持二维码新手引导流程，用于将 QQ Bot 关联到 OpenClaw：

1. 运行 QQ Bot 设置路径（例如 `openclaw channels add --channel qqbot`），并在提示时选择二维码流程。
2. 使用绑定目标 QQ Bot 的手机应用扫描生成的二维码。
3. 在手机上批准配对。OpenClaw 会将返回的凭证持久化到正确账户范围下的 `credentials/` 中。

由 bot 自身生成的批准提示（例如 QQ Bot API 暴露的“允许此操作？”流程）会显示为原生 OpenClaw 提示，你可以用 `/bot-approve` 接受，而不是通过原始 QQ 客户端回复。

## 故障排除

- **Bot 回复“gone to Mars”：** 凭证未配置或 Gateway 网关未启动。
- **没有入站消息：** 验证 `appId` 和 `clientSecret` 是否正确，并且
  bot 已在 QQ 开放平台启用。
- **反复自我回复：** OpenClaw 会将 QQ 出站引用索引记录为
  bot 生成，并忽略当前 `msgIdx` 匹配同一 bot 账户的入站事件。
  这可以防止平台回声循环，同时仍允许用户引用或回复之前的 bot 消息。
- **使用 `--token-file` 设置后仍显示未配置：** `--token-file` 只会设置
  AppSecret。你仍需要在配置或 `QQBOT_APP_ID` 中设置 `appId`。
- **主动消息未到达：** 如果用户最近没有互动，QQ 可能会拦截 bot 主动发起的消息。
- **语音未转写：** 确保已配置 STT，且提供商可访问。

## 相关

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [渠道故障排除](/zh-CN/channels/troubleshooting)
