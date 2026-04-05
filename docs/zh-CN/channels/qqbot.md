---
read_when:
    - 你想将 OpenClaw 连接到 QQ
    - 你需要设置 QQ Bot 凭证
    - 你想使用 QQ Bot 群聊或私聊支持
summary: QQ Bot 设置、配置和使用方法
title: QQ Bot
x-i18n:
    generated_at: "2026-04-05T08:16:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e58fb7b07c59ecbf80a1276368c4a007b45d84e296ed40cffe9845e0953696c
    source_path: channels/qqbot.md
    workflow: 15
---

# QQ Bot

QQ Bot 通过官方 QQ Bot API（WebSocket 网关）连接到 OpenClaw。该插件支持 C2C 私聊、群 @ 消息以及频道消息，并支持丰富媒体（图片、语音、视频、文件）。

状态：内置插件。支持私信、群聊、频道和媒体。不支持表情回应和线程。

## 内置插件

当前 OpenClaw 版本已内置 QQ Bot，因此普通打包构建不需要单独执行 `openclaw plugins install` 步骤。

## 设置

1. 前往 [QQ Open Platform](https://q.qq.com/)，使用你的手机 QQ 扫描二维码完成注册/登录。
2. 点击 **Create Bot** 创建一个新的 QQ 机器人。
3. 在机器人的设置页面找到 **AppID** 和 **AppSecret** 并复制它们。

> AppSecret 不会以明文存储——如果你离开该页面而没有保存它，
> 你将不得不重新生成一个新的。

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

- 环境变量回退仅适用于默认 QQ Bot 账号。
- `openclaw channels add --channel qqbot --token-file ...` 仅提供
  AppSecret；AppID 必须已在配置或 `QQBOT_APP_ID` 中设置。
- `clientSecret` 也接受 SecretRef 输入，而不只是明文字符串。

### 多账号设置

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

每个账号都会启动自己的 WebSocket 连接，并维护独立的 token 缓存（按 `appId` 隔离）。

通过 CLI 添加第二个机器人：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 语音（STT / TTS）

STT 和 TTS 支持两级配置与优先级回退：

| 设置 | 插件专用 | 框架回退 |
| ------- | -------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt` | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts` | `messages.tts`                |

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
    },
  },
}
```

在任一项上设置 `enabled: false` 可将其禁用。

出站音频上传/转码行为也可通过
`channels.qqbot.audioFormatPolicy` 进行调优：

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 目标格式

| 格式 | 说明 |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | 私聊（C2C） |
| `qqbot:group:GROUP_OPENID` | 群聊 |
| `qqbot:channel:CHANNEL_ID` | 频道 |

> 每个机器人都有自己的一组用户 OpenID。由机器人 A 接收到的 OpenID **不能**
> 用于通过机器人 B 发送消息。

## 斜杠命令

在进入 AI 队列前会先拦截内置命令：

| 命令 | 说明 |
| -------------- | ------------------------------------ |
| `/bot-ping`    | 延迟测试 |
| `/bot-version` | 显示 OpenClaw 框架版本 |
| `/bot-help`    | 列出所有命令 |
| `/bot-upgrade` | 显示 QQBot 升级指南链接 |
| `/bot-logs`    | 将最近的 gateway 日志导出为文件 |

在任意命令后追加 `?` 可查看用法帮助（例如 `/bot-upgrade ?`）。

## 故障排除

- **机器人回复 “gone to Mars”：** 未配置凭证，或 Gateway 网关未启动。
- **没有入站消息：** 请验证 `appId` 和 `clientSecret` 是否正确，以及机器人是否已在 QQ Open Platform 上启用。
- **使用 `--token-file` 设置后仍显示未配置：** `--token-file` 仅设置 AppSecret。你仍然需要在配置中设置 `appId`，或设置 `QQBOT_APP_ID`。
- **主动消息未送达：** 如果用户最近没有互动，QQ 可能会拦截机器人主动发起的消息。
- **语音未转写：** 请确保已配置 STT，且提供商可访问。
