---
read_when:
    - 你想将 OpenClaw 连接到 QQ
    - 你需要设置 QQ Bot 凭证
    - 你希望 QQ Bot 支持群聊或私聊
summary: QQ Bot 设置、配置和使用
title: QQ Bot
x-i18n:
    generated_at: "2026-04-25T11:16:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1219f8d6ca3996272b293cc042364300f0fdfea6c7f19585e4ee514ac2182d46
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Bot 通过官方 QQ Bot API（WebSocket Gateway 网关）连接到 OpenClaw。该插件支持 C2C 私聊、群组 @消息以及频道消息，并支持富媒体（图片、语音、视频、文件）。

Status：内置插件。支持私信、群聊、频道以及媒体。不支持 Reactions 和 Threads。

## 内置插件

当前的 OpenClaw 版本已内置 QQ Bot，因此常规打包构建不需要单独执行 `openclaw plugins install` 步骤。

## 设置

1. 前往 [QQ 开放平台](https://q.qq.com/)，使用你手机上的 QQ 扫描二维码进行注册 / 登录。
2. 点击 **Create Bot** 创建一个新的 QQ 机器人。
3. 在机器人的设置页面找到 **AppID** 和 **AppSecret** 并复制它们。

> AppSecret 不会以明文存储——如果你离开页面时没有保存它，
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
- `openclaw channels add --channel qqbot --token-file ...` 仅提供 AppSecret；AppID 必须已经在配置中设置，或通过 `QQBOT_APP_ID` 提供。
- `clientSecret` 也接受 SecretRef 输入，而不只是明文字符串。

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

每个账户都会启动各自的 WebSocket 连接，并维护独立的令牌缓存（按 `appId` 隔离）。

通过 CLI 添加第二个机器人：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 语音（STT / TTS）

STT 和 TTS 支持两级配置，并按优先级回退：

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

传入的 QQ 语音附件会以音频媒体元数据的形式提供给智能体，同时将原始语音文件排除在通用 `MediaPaths` 之外。`[[audio_as_voice]]` 纯文本回复会合成 TTS，并在已配置 TTS 时发送原生 QQ 语音消息。

你还可以通过 `channels.qqbot.audioFormatPolicy` 调整出站音频的上传 / 转码行为：

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 目标格式

| 格式 | 说明 |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | 私聊（C2C） |
| `qqbot:group:GROUP_OPENID` | 群聊 |
| `qqbot:channel:CHANNEL_ID` | 频道 |
 
> 每个机器人都有自己的一组用户 OpenID。通过机器人 A 收到的 OpenID **不能**
> 用于通过机器人 B 发送消息。

## Slash 命令

在 AI 队列之前拦截的内置命令：

| 命令 | 说明 |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | 延迟测试 |
| `/bot-version` | 显示 OpenClaw 框架版本 |
| `/bot-help`    | 列出所有命令 |
| `/bot-upgrade` | 显示 QQBot 升级指南链接 |
| `/bot-logs`    | 将最近的 Gateway 网关日志导出为文件 |
| `/bot-approve` | 通过原生流程批准待处理的 QQ Bot 操作（例如确认 C2C 或群组上传）。 |

在任意命令后追加 `?` 可查看用法帮助（例如 `/bot-upgrade ?`）。

## 引擎架构

QQ Bot 以插件内部的独立引擎形式提供：

- 每个账户都拥有独立隔离的资源栈（WebSocket 连接、API 客户端、令牌缓存、媒体存储根目录），并以 `appId` 作为键。账户之间绝不会共享入站 / 出站状态。
- 多账户日志记录器会用所属账户标记日志行，这样当你在同一个 Gateway 网关下运行多个机器人时，诊断信息仍可彼此区分。
- 入站、出站和 Gateway 网关桥接路径共享 `~/.openclaw/media` 下的单一媒体负载根目录，因此上传、下载和转码缓存都会落在同一个受保护目录下，而不是按子系统拆分的目录树。
- 凭证可以作为标准 OpenClaw 凭证快照的一部分进行备份和恢复；恢复时，引擎会重新附加每个账户的资源栈，而无需重新扫码配对。

## 二维码新手引导

除了手动粘贴 `AppID:AppSecret` 之外，该引擎还支持通过二维码新手引导流程将 QQ Bot 链接到 OpenClaw：

1. 运行 QQ Bot 设置路径（例如 `openclaw channels add --channel qqbot`），并在提示时选择二维码流程。
2. 使用与目标 QQ Bot 绑定的手机应用扫描生成的二维码。
3. 在手机上批准配对。OpenClaw 会将返回的凭证持久化到 `credentials/` 中对应的账户作用域下。

由机器人自身生成的批准提示（例如 QQ Bot API 暴露的“允许此操作？”流程）会显示为 OpenClaw 原生提示，你可以使用 `/bot-approve` 接受，而不必通过原始 QQ 客户端回复。

## 故障排除

- **机器人回复 “gone to Mars”：** 未配置凭证，或 Gateway 网关尚未启动。
- **没有入站消息：** 请确认 `appId` 和 `clientSecret` 正确，并且该机器人已在 QQ 开放平台启用。
- **使用 `--token-file` 设置后仍显示未配置：** `--token-file` 只设置 AppSecret。你仍然需要在配置中设置 `appId`，或使用 `QQBOT_APP_ID`。
- **主动消息未送达：** 如果用户最近没有互动，QQ 可能会拦截由机器人主动发起的消息。
- **语音未转写：** 请确认已配置 STT，并且提供商可访问。

## 相关内容

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [渠道故障排除](/zh-CN/channels/troubleshooting)
