---
read_when:
    - 你想将 OpenClaw 连接到 QQ
    - 你需要设置 QQ Bot 凭证
    - 你想要 QQ Bot 群聊或私聊支持
summary: QQ Bot 设置、配置和使用
title: QQ Bot
x-i18n:
    generated_at: "2026-07-05T11:04:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a63f31014c376573456157d5268b9828ce4c0ae8337e4f6428bb57322dd10916
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot 通过官方 QQ Bot API（WebSocket Gateway 网关）连接到 OpenClaw。
C2C 私聊和群组 `@` 提及是主要聊天类型，支持富媒体（图片、语音、视频、文件）。频道消息仅支持文本和远程 URL 图片；频道中不支持语音、视频、文件上传以及本地/Base64 图片。任何位置都不支持表情回应和线程。

状态：官方可下载插件。

## 安装

```bash
openclaw plugins install @openclaw/qqbot
```

## 设置

1. 前往 [QQ 开放平台](https://q.qq.com/)，并用你的手机 QQ 扫描二维码注册/登录。
2. 点击 **Create Bot** 创建新的 QQ bot。
3. 在 bot 的设置页面找到 **AppID** 和 **AppSecret** 并复制它们。

<Note>
AppSecret 不会以明文存储。如果你没有保存就离开页面，则必须重新生成一个新的。
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

该向导还提供二维码绑定，作为手动输入 AppID/AppSecret 的替代方式：用绑定到目标 QQ Bot 的手机应用扫描二维码以完成绑定。OpenClaw 会在该账号的配置作用域下持久化返回的凭证。

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

默认账号环境变量（仅顶层账号）：

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

说明：

- `openclaw channels add --channel qqbot --token-file ...` 只设置 AppSecret；`appId` 必须已在配置或 `QQBOT_APP_ID` 中设置。
- `clientSecret` 接受明文字符串、文件路径（`clientSecretFile`）或结构化 SecretRef 对象。
- 旧版 `secretref:...` / `secretref-env:...` 标记字符串会被 `clientSecret` 拒绝；请改用结构化 SecretRef 对象。

### 访问策略

- `allowFrom` / `groupAllowFrom` 控制谁可以在 C2C / 群组上下文中与 bot 聊天。`dmPolicy` / `groupPolicy`（`open` | `allowlist` | `disabled`）控制执行模式。一旦 `allowFrom` 有具体（非通配符）条目，`dmPolicy` 默认值为 `allowlist`，否则为 `open`。一旦 `groupAllowFrom` 或 `allowFrom` 有具体条目，`groupPolicy` 默认值为 `allowlist`，否则为 `open`。
- “认证：allowlist” 斜杠命令要求 `allowFrom` 中有显式非通配符条目（群组调用则要求 `groupAllowFrom`），无论 `dmPolicy` / `groupPolicy` 如何。请参阅 [斜杠命令](#slash-commands)。

### 多账号设置

在单个 OpenClaw 实例下运行多个 QQ bot：

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

每个账号都拥有隔离的 WebSocket 连接、API 客户端和令牌缓存，并以 `appId` 为键。日志行会标记所属账号 ID，因此当你在一个 Gateway 网关下运行多个 bot 时，诊断仍能保持可分离。

通过 CLI 添加第二个 bot：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 群聊

群组支持使用 QQ 群组 OpenID，而不是显示名称。将 bot 添加到群组，然后提及它，或将群组配置为无需提及即可运行。

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

`groups["*"]` 为每个群组设置默认值；具体的 `groups.GROUP_OPENID` 条目会为某个群组覆盖这些默认值。群组设置：

| 字段                  | 默认值           | 描述                                                                                               |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | 要求在 bot 回复前先 `@` 提及。                                                                      |
| `commandLevel`        | `all`            | 哪些内置斜杠命令可以在群组中运行（见下文）。                                                       |
| `ignoreOtherMentions` | `false`          | 丢弃提及了其他人但没有提及 bot 的消息。                                                            |
| `historyLimit`        | `50`             | 保留最近的非提及消息，作为下一次被提及轮次的上下文。`0` 会禁用历史记录。                           |
| `tools`               | —                | 对整个群组允许/拒绝工具。                                                                          |
| `toolsBySender`       | —                | 按发送者覆盖工具；参见 [群组](/zh-CN/channels/groups#groupchannel-tool-restrictions-optional)。          |
| `name`                | openid 前缀      | 日志和群组上下文中使用的友好标签。                                                                 |
| `prompt`              | 内置默认值       | 追加到智能体上下文的按群组行为提示。                                                               |

`commandLevel` 接受：

| 级别     | 行为                                                                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | 现有内置命令保持可用。有些命令仍会从菜单中隐藏，但授权用户仍可在群组中运行它们。                                                            |
| `safety` | `/help`、`/btw`、`/stop` 在群组中保持可见；敏感命令（`/config`、`/tools`、`/bash` 等）必须在私聊中运行。                                      |
| `strict` | 仅允许严格运行所需的群组会话控制。`/stop` 仍可使用，因此授权发送者可以中断正在进行的运行。                                                   |

旧版 QQBot `toolPolicy` 条目已退役。运行 `openclaw doctor --fix` 将其迁移到 `tools`。

激活模式为 `mention` 和 `always`。`requireMention: true` 映射到 `mention`；`requireMention: false` 映射到 `always`。如果存在会话级激活覆盖，它优先于配置。

入站队列按对等方划分。群组对等方的队列上限更大（50，相比直接对等方的 20），满队列时会先驱逐 bot 作者消息，再驱逐人工消息，并将普通群组消息的突发合并为一个归属轮次。斜杠命令会逐个运行，独立于任何合并批次。

### 语音（STT / TTS）

STT 和 TTS 支持带优先级回退的两级配置：

| 设置 | 插件专用                                                 | 框架回退                      |
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

在任一项上设置 `enabled: false` 可禁用。账号级 TTS 覆盖使用与 `messages.tts` 相同的形状，并深度合并到渠道/全局 TTS 配置之上。

入站 QQ 语音附件会作为音频媒体元数据暴露给智能体，同时避免将原始语音文件放入通用 `MediaPaths`。当 TTS 已配置时，纯文本回复中的 `[[audio_as_voice]]` 会合成 TTS 并发送原生 QQ 语音消息。

出站音频上传/转码行为也可以通过 `channels.qqbot.audioFormatPolicy` 调整：

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 目标格式

| 格式                       | 描述           |
| -------------------------- | -------------- |
| `qqbot:c2c:OPENID`         | 私聊（C2C）    |
| `qqbot:group:GROUP_OPENID` | 群聊           |
| `qqbot:channel:CHANNEL_ID` | 频道           |

<Note>
每个 bot 都有自己的一组用户 OpenID。Bot A 收到的 OpenID **不能** 用于通过 Bot B 发送消息。
</Note>

## 斜杠命令

AI 队列之前拦截的内置命令：

| 命令                 | 认证      | 作用域   | 描述                                                                               |
| -------------------- | --------- | -------- | ---------------------------------------------------------------------------------- |
| `/bot-ping`          | —         | 任意     | 延迟测试                                                                           |
| `/bot-help`          | —         | 任意     | 列出所有命令                                                                       |
| `/bot-me`            | —         | 仅私聊   | 显示发送者的 QQ 用户 ID（openid），用于 `allowFrom` / `groupAllowFrom` 设置        |
| `/bot-version`       | —         | 仅私聊   | 显示 OpenClaw 框架版本和插件版本                                                   |
| `/bot-upgrade`       | —         | 仅私聊   | 显示 QQBot 升级指南链接                                                            |
| `/bot-approve`       | allowlist | 仅私聊   | 管理命令执行审批配置（on / off / always / reset / status）                         |
| `/bot-logs`          | allowlist | 仅私聊   | 将最近的 Gateway 网关日志导出为文件                                                |
| `/bot-clear-storage` | allowlist | 仅私聊   | 删除 QQBot 媒体目录下的缓存下载                                                    |
| `/bot-streaming`     | allowlist | 仅私聊   | 切换 C2C 流式回复                                                                  |
| `/bot-group-allways` | allowlist | 仅私聊   | 切换默认群组激活模式（需要提及与始终开启）                                         |

向任意命令追加 `?` 可查看用法帮助（例如 `/bot-upgrade ?`）。

“认证：allowlist” 命令还要求发送者的 openid 位于显式非通配符 `allowFrom` 列表中（群组发出的命令优先使用 `groupAllowFrom`，回退到 `allowFrom`）。通配符 `allowFrom: ["*"]` 允许聊天，但不允许这些命令。在私聊之外运行其中任何命令，或未授权运行，都会返回提示，而不是静默丢弃消息。

`/bot-me`、`/bot-version` 和 `/bot-upgrade` 仅限私聊，但不要求 allowlist，任何 C2C 发送者都可以运行它们。

当 QQ Bot Exec 审批使用默认的同一聊天回退时，原生审批按钮点击会遵循同一个显式的非通配符命令允许列表。要授予仅审批访问权限而不授予更广泛的命令访问权限，请配置 `channels.qqbot.execApprovals.approvers`。原生 Exec 审批默认启用。

## 媒体和存储

- 入站、出站和 Gateway 网关桥接媒体共享 `~/.openclaw/media/qqbot` 下的同一个载荷根目录（设置 `OPENCLAW_HOME` 时会遵循该设置），因此上传、下载和转码缓存都会保留在同一个受保护目录下。
- 面向 C2C 和群组目标的富媒体投递会走同一个 `sendMedia` 路径。5&nbsp;MiB 或更大的本地文件和内存缓冲区会使用 QQ 的分块上传端点；较小的载荷以及远程 URL/Base64 来源会使用一次性上传 API。
- 如果热升级在 Gateway 网关完成写入 `openclaw.json` 之前中断，插件会在下次启动时从内部快照恢复该账号上一次已知的 `appId` / `clientSecret`（绝不会覆盖有意的配置更改），因此不需要重新扫描二维码。

## 故障排查

- **Gateway 网关未启动 / 没有入站消息：**确认 `appId` 和 `clientSecret` 正确，并且 Bot 已在 QQ Open Platform 上启用。缺少凭据时会显示为“QQ Bot 未配置（缺少 appId 或 clientSecret）”。
- **使用 `--token-file` 设置后仍显示未配置：**`--token-file` 只会设置 AppSecret。`appId` 仍必须在配置或 `QQBOT_APP_ID` 中设置。
- **突发群组回复发生冲突：**当某个对等方的队列填满时，入站队列会先淘汰 Bot 自己发送的消息，再淘汰真人消息，并将普通（非命令）群组消息的突发合并为一个带归属的轮次，因此大量 Bot 聊天不应饿死真人消息。
- **主动消息未到达：**如果用户最近没有互动，QQ 可能会阻止 Bot 发起的消息。
- **语音未转录：**确保已配置 STT，且提供商可访问。

## 相关

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [渠道故障排查](/zh-CN/channels/troubleshooting)
