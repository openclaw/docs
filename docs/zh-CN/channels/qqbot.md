---
read_when:
    - 你想将 OpenClaw 连接到 QQ
    - 你需要设置 QQ Bot 凭证
    - 你想要 QQ Bot 群组或私聊支持
summary: QQ Bot 设置、配置和使用
title: QQ Bot
x-i18n:
    generated_at: "2026-05-03T22:31:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: e17fa0da2f6939ed28cac5f13b3e37e6c63b87a10250ff213f7a86685a6141d6
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot 通过官方 QQ Bot API（WebSocket Gateway 网关）连接到 OpenClaw。该
插件支持 C2C 私聊、群组 @消息，以及带有
富媒体（图片、语音、视频、文件）的公会频道消息。

Status：可下载插件。支持私信、群聊、公会频道和
媒体。不支持回应和线程。

## 安装

在设置前安装 QQ Bot：

```bash
openclaw plugins install @openclaw/qqbot
```

## 设置

1. 前往 [QQ 开放平台](https://q.qq.com/)，并用你的
   手机 QQ 扫描二维码来注册 / 登录。
2. 点击 **Create Bot** 创建一个新的 QQ Bot。
3. 在 Bot 的设置页面找到 **AppID** 和 **AppSecret** 并复制它们。

> AppSecret 不会以明文存储——如果你未保存就离开页面，
> 就必须重新生成一个新的。

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

默认账号环境变量：

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

文件支持的 AppSecret：

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

- 环境变量回退仅适用于默认 QQ Bot 账号。
- `openclaw channels add --channel qqbot --token-file ...` 只提供
  AppSecret；AppID 必须已在配置或 `QQBOT_APP_ID` 中设置。
- `clientSecret` 也接受 SecretRef 输入，而不仅是明文字符串。
- 旧版 `secretref:/...` 标记字符串不是有效的 `clientSecret` 值；
  请使用上方示例中的结构化 SecretRef 对象。

### 多账号设置

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

每个账号都会启动自己的 WebSocket 连接，并维护独立的
token 缓存（按 `appId` 隔离）。

通过 CLI 添加第二个 Bot：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 群聊

QQ Bot 群聊支持使用 QQ 群 OpenID，而不是显示名称。将 Bot 添加
到群，然后提及它，或将该群配置为无需提及即可运行。

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

`groups["*"]` 为每个群设置默认值，而具体的
`groups.GROUP_OPENID` 条目会覆盖单个群的这些默认值。群组
设置包括：

- `requireMention`：要求先 @提及 Bot，Bot 才会回复。默认值：`true`。
- `ignoreOtherMentions`：丢弃提及其他人但未提及 Bot 的消息。
- `historyLimit`：保留最近的非提及群消息，作为下一次被提及时的上下文。设置为 `0` 可禁用。
- `toolPolicy`：群组范围工具使用 `full`、`restricted` 或 `none`。
- `name`：日志和群组上下文中使用的友好标签。
- `prompt`：追加到智能体上下文的按群组行为提示词。

激活模式为 `mention` 和 `always`。`requireMention: true` 映射到
`mention`；`requireMention: false` 映射到 `always`。如果存在会话级激活
覆盖，则它优先于配置。

入站队列按对等方划分。群组对等方会获得更大的队列上限，在队列满时优先保留人工
消息而非 Bot 生成的聊天内容，并将普通
群消息的突发合并为一个归属明确的轮次。斜杠命令仍会逐个运行。

### 语音（STT / TTS）

STT 和 TTS 支持带优先级回退的两级配置：

| 设置 | 插件专属                                                 | 框架回退                      |
| ---- | -------------------------------------------------------- | ----------------------------- |
| STT  | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS  | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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

在任一项上设置 `enabled: false` 可禁用。
账号级 TTS 覆盖使用与 `messages.tts` 相同的结构，并会在
渠道/全局 TTS 配置之上进行深度合并。

入站 QQ 语音附件会作为音频媒体元数据暴露给智能体，同时
避免将原始语音文件放入通用 `MediaPaths`。当已配置 TTS 时，`[[audio_as_voice]]` 纯
文本回复会合成 TTS 并发送原生 QQ 语音消息。

出站音频上传/转码行为也可通过
`channels.qqbot.audioFormatPolicy` 调整：

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 目标格式

| 格式                       | 描述          |
| -------------------------- | ------------- |
| `qqbot:c2c:OPENID`         | 私聊（C2C）   |
| `qqbot:group:GROUP_OPENID` | 群聊          |
| `qqbot:channel:CHANNEL_ID` | 公会频道      |

> 每个 Bot 都有自己的一组用户 OpenID。Bot A 收到的 OpenID **不能**
> 用于通过 Bot B 发送消息。

## 斜杠命令

在 AI 队列前拦截的内置命令：

| 命令           | 描述                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| `/bot-ping`    | 延迟测试                                                                                               |
| `/bot-version` | 显示 OpenClaw 框架版本                                                                                 |
| `/bot-help`    | 列出所有命令                                                                                           |
| `/bot-me`      | 显示发送者的 QQ 用户 ID（openid），用于 `allowFrom`/`groupAllowFrom` 设置                              |
| `/bot-upgrade` | 显示 QQBot 升级指南链接                                                                                |
| `/bot-logs`    | 将最近的 Gateway 网关日志导出为文件                                                                    |
| `/bot-approve` | 通过原生流程批准待处理的 QQ Bot 操作（例如，确认 C2C 或群组上传）。                                    |

在任意命令后追加 `?` 可查看用法帮助（例如 `/bot-upgrade ?`）。

管理员命令（`/bot-me`、`/bot-upgrade`、`/bot-logs`、`/bot-clear-storage`、`/bot-streaming`、`/bot-approve`）仅限私信，并要求发送者的 openid 位于显式的非通配符 `allowFrom` 列表中。通配符 `allowFrom: ["*"]` 允许聊天，但不会授予管理员命令访问权限。群消息会先匹配 `groupAllowFrom`，再回退到 `allowFrom`。在群中运行管理员命令会返回提示，而不是静默丢弃。

## 引擎架构

QQ Bot 作为插件内部的自包含引擎提供：

- 每个账号拥有隔离的资源栈（WebSocket 连接、API 客户端、token 缓存、媒体存储根目录），并按 `appId` 作为键。账号绝不会共享入站/出站状态。
- 多账号日志记录器会用所属账号标记日志行，因此当你在一个 Gateway 网关下运行多个 Bot 时，诊断信息仍可分离。
- 入站、出站和 Gateway 网关桥接路径在 `~/.openclaw/media` 下共享单个媒体载荷根目录，因此上传、下载和转码缓存会落在一个受保护目录下，而不是按子系统分散成树状目录。
- 富媒体投递会通过一个 `sendMedia` 路径处理 C2C 和群组目标。超过大文件阈值的本地文件和缓冲区会使用 QQ 的分块上传端点，而较小载荷会使用一次性媒体 API。
- 凭证可以作为标准 OpenClaw 凭证快照的一部分备份和恢复；引擎会在恢复时重新挂接每个账号的资源栈，而无需重新进行二维码配对。

## 二维码新手引导

除了手动粘贴 `AppID:AppSecret`，引擎还支持二维码新手引导流程，用于将 QQ Bot 关联到 OpenClaw：

1. 运行 QQ Bot 设置路径（例如 `openclaw channels add --channel qqbot`），并在提示时选择二维码流程。
2. 使用绑定目标 QQ Bot 的手机应用扫描生成的二维码。
3. 在手机上批准配对。OpenClaw 会将返回的凭证持久化到正确账号作用域下的 `credentials/` 中。

Bot 自身生成的批准提示（例如 QQ Bot API 暴露的 “allow this action?” 流程）会显示为原生 OpenClaw 提示，你可以用 `/bot-approve` 接受，而无需通过原始 QQ 客户端回复。

## 故障排除

- **Bot 回复 “gone to Mars”：** 凭证未配置，或 Gateway 网关未启动。
- **没有入站消息：** 验证 `appId` 和 `clientSecret` 是否正确，并且
  Bot 已在 QQ 开放平台启用。
- **反复自我回复：** OpenClaw 会将 QQ 出站引用索引记录为
  Bot 生成，并忽略当前 `msgIdx` 与同一
  Bot 账号匹配的入站事件。这样可以防止平台回声循环，同时仍允许用户
  引用或回复以前的 Bot 消息。
- **使用 `--token-file` 设置后仍显示未配置：** `--token-file` 只会设置
  AppSecret。你仍需要在配置或 `QQBOT_APP_ID` 中设置 `appId`。
- **主动消息未到达：** 如果用户最近没有交互，QQ 可能会拦截 Bot 发起的消息。
- **语音未被转录：** 确保已配置 STT，且提供商可访问。

## 相关

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [渠道故障排除](/zh-CN/channels/troubleshooting)
