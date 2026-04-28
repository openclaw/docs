---
read_when:
    - 你想将 OpenClaw 连接到 QQ
    - 你需要设置 QQ Bot 凭证
    - 你想要 QQ Bot 群聊或私聊支持
summary: QQ Bot 设置、配置和使用
title: QQ Bot
x-i18n:
    generated_at: "2026-04-28T02:06:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: aefece6b05bb16d5c4f588bf7af4fd710b5f98aab0dbed8221490c46bf3f379c
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Bot 通过官方 QQ Bot API（WebSocket Gateway 网关）连接到 OpenClaw。该插件支持 C2C 私聊、群 @消息和频道消息，并支持富媒体（图片、语音、视频、文件）。

Status：内置插件。支持私信、群聊、频道以及媒体。不支持表情回应和主题帖。

## 内置插件

当前的 OpenClaw 版本已内置 QQ Bot，因此常规打包构建不需要单独执行 `openclaw plugins install` 步骤。

## 设置

1. 前往 [QQ 开放平台](https://q.qq.com/)，使用手机 QQ 扫描二维码进行注册 / 登录。
2. 点击 **Create Bot** 创建一个新的 QQ 机器人。
3. 在机器人的设置页面中找到 **AppID** 和 **AppSecret** 并复制它们。

> AppSecret 不会以明文存储——如果你离开页面前没有保存它，你将必须重新生成一个新的。

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

说明：

- 环境变量回退仅适用于默认 QQ Bot 账户。
- `openclaw channels add --channel qqbot --token-file ...` 只提供 AppSecret；AppID 必须已经在配置中设置，或者通过 `QQBOT_APP_ID` 设置。
- `clientSecret` 也接受 SecretRef 输入，而不仅仅是明文字符串。

### 多账户设置

在单个 OpenClaw 实例下运行多个 QQ 机器人：

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

每个账户都会启动自己的 WebSocket 连接，并维护独立的令牌缓存（按 `appId` 隔离）。

通过 CLI 添加第二个机器人：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 群聊

QQ Bot 群聊支持使用 QQ 群 OpenID，而不是显示名称。将机器人添加到群中，然后提及它，或者将该群配置为无需提及即可运行。

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

`groups["*"]` 为每个群设置默认值，而具体的 `groups.GROUP_OPENID` 条目会覆盖某一个群的这些默认值。群设置包括：

- `requireMention`：机器人回复前要求有 @提及。默认值：`true`。
- `ignoreOtherMentions`：丢弃提及了其他人但没有提及机器人的消息。
- `historyLimit`：将最近的、未提及机器人的群消息保留为下一次被提及时的上下文。设为 `0` 可禁用。
- `toolPolicy`：群范围工具策略，可选 `full`、`restricted` 或 `none`。
- `name`：用于日志和群上下文的友好标签。
- `prompt`：附加到智能体上下文中的每群行为提示词。

激活模式为 `mention` 和 `always`。`requireMention: true` 映射为 `mention`；`requireMention: false` 映射为 `always`。如果存在会话级激活覆盖，它将优先于配置生效。

入站队列按对端区分。群对端拥有更大的队列上限；当队列满时，会优先保留人工消息而不是机器人发送的杂项消息；同时会将连续爆发的普通群消息合并为一个带归属信息的轮次。斜杠命令仍然逐个执行。

### 语音（STT / TTS）

STT 和 TTS 支持两级配置，并带有优先级回退：

| 设置 | 插件专用 | 框架回退 |
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

在任一项上设置 `enabled: false` 可将其禁用。
账户级 TTS 覆盖使用与 `messages.tts` 相同的结构，并会在渠道 / 全局 TTS 配置之上执行深度合并。

入站 QQ 语音附件会以音频媒体元数据的形式暴露给智能体，同时不会将原始语音文件放入通用 `MediaPaths` 中。`[[audio_as_voice]]` 纯文本回复会合成 TTS，并在配置了 TTS 时发送原生 QQ 语音消息。

出站音频的上传 / 转码行为也可以通过 `channels.qqbot.audioFormatPolicy` 进行调整：

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 目标格式

| 格式 | 描述 |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | 私聊（C2C） |
| `qqbot:group:GROUP_OPENID` | 群聊 |
| `qqbot:channel:CHANNEL_ID` | 频道 |

> 每个机器人都有自己的一组用户 OpenID。从机器人 A 收到的 OpenID **不能** 用于通过机器人 B 发送消息。

## 斜杠命令

在 AI 队列之前拦截的内置命令：

| 命令 | 描述 |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | 延迟测试 |
| `/bot-version` | 显示 OpenClaw 框架版本 |
| `/bot-help`    | 列出所有命令 |
| `/bot-upgrade` | 显示 QQBot 升级指南链接 |
| `/bot-logs`    | 将最近的 Gateway 网关日志导出为文件 |
| `/bot-approve` | 通过原生流程批准待处理的 QQ Bot 操作（例如，确认一次 C2C 或群文件上传）。 |

在任意命令后追加 `?` 可查看用法帮助（例如 `/bot-upgrade ?`）。

## 引擎架构

QQ Bot 作为插件中的自包含引擎提供：

- 每个账户都拥有一个按 `appId` 键控的隔离资源栈（WebSocket 连接、API 客户端、令牌缓存、媒体存储根目录）。账户之间绝不共享入站 / 出站状态。
- 多账户日志记录器会使用所属账户标记日志行，因此当你在单个 Gateway 网关下运行多个机器人时，诊断信息仍可区分。
- 入站、出站和 Gateway 网关桥接路径共享 `~/.openclaw/media` 下的单一媒体负载根目录，因此上传、下载和转码缓存都会落在同一个受保护目录中，而不是分散到各子系统各自的目录树下。
- 富媒体投递通过单一路径 `sendMedia` 处理 C2C 和群目标。高于大文件阈值的本地文件和缓冲区会使用 QQ 的分块上传端点，而较小的负载则使用一次性媒体 API。
- 凭证可以作为标准 OpenClaw 凭证快照的一部分进行备份和恢复；恢复时，引擎会重新附加每个账户的资源栈，而无需重新扫码配对。

## 二维码新手引导

除了手动粘贴 `AppID:AppSecret` 外，该引擎还支持通过二维码新手引导流程将 QQ Bot 关联到 OpenClaw：

1. 运行 QQ Bot 设置路径（例如 `openclaw channels add --channel qqbot`），并在提示时选择二维码流程。
2. 使用与目标 QQ Bot 绑定的手机应用扫描生成的二维码。
3. 在手机上批准配对。OpenClaw 会将返回的凭证持久化到 `credentials/` 中对应账户的作用域下。

由机器人自身生成的批准提示（例如，QQ Bot API 暴露的“允许此操作？”流程）会以原生 OpenClaw 提示的形式显示，你可以使用 `/bot-approve` 接受，而不必通过原始 QQ 客户端回复。

## 故障排除

- **机器人回复“gone to Mars”：** 未配置凭证，或 Gateway 网关未启动。
- **没有入站消息：** 验证 `appId` 和 `clientSecret` 是否正确，并确认机器人已在 QQ 开放平台启用。
- **重复自回复：** OpenClaw 会将 QQ 出站引用索引记录为机器人发送内容，并忽略当前 `msgIdx` 与同一机器人账户匹配的入站事件。这可以防止平台回声循环，同时仍允许用户引用或回复机器人之前的消息。
- **使用 `--token-file` 设置后仍显示未配置：** `--token-file` 只设置 AppSecret。你仍然需要在配置中设置 `appId`，或设置 `QQBOT_APP_ID`。
- **主动消息未送达：** 如果用户最近没有互动，QQ 可能会拦截由机器人主动发起的消息。
- **语音未转写：** 确保已配置 STT，并且提供商可达。

## 相关

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [渠道故障排除](/zh-CN/channels/troubleshooting)
