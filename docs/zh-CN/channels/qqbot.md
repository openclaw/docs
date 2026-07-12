---
read_when:
    - 你想将 OpenClaw 连接到 QQ
    - 你需要设置 QQ Bot 凭据
    - 你需要 QQ Bot 群聊或私聊支持
summary: QQ Bot 设置、配置和使用方法
title: QQ Bot
x-i18n:
    generated_at: "2026-07-11T20:21:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e654d1a3e501ef825e857cf0fdd780401c6dc0012d729db0aa1ae72a8a6871ed
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot 通过官方 QQ Bot API（WebSocket 网关）连接到 OpenClaw。
C2C 私聊和群组 `@` 提及是主要聊天类型，并支持丰富的媒体内容（图片、语音、视频、文件）。频道消息仅支持文本和远程 URL 图片；频道中不支持语音、视频、文件上传以及本地/Base64 图片。任何场景均不支持表情回应和话题串。

状态：官方可下载插件。

## 安装

```bash
openclaw plugins install @openclaw/qqbot
```

## 设置

1. 前往 [QQ 开放平台](https://q.qq.com/)，使用手机 QQ 扫描二维码以注册/登录。
2. 点击 **Create Bot** 创建新的 QQ Bot。
3. 在 Bot 的设置页面找到 **AppID** 和 **AppSecret**，并复制它们。

<Note>
AppSecret 不会以明文形式存储。如果离开页面前未保存，则必须重新生成一个。
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

除手动输入 AppID/AppSecret 外，向导还提供二维码绑定方式：使用与目标 QQ Bot 关联的手机应用扫描二维码即可完成绑定。OpenClaw 会将返回的凭据持久化到该账户的配置作用域中。

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

- `openclaw channels add --channel qqbot --token-file ...` 仅设置 AppSecret；必须已在配置或 `QQBOT_APP_ID` 中设置 `appId`。
- `clientSecret` 接受明文字符串、文件路径（`clientSecretFile`）或结构化 SecretRef 对象。
- `clientSecret` 不接受旧版 `secretref:...` / `secretref-env:...` 标记字符串；请改用结构化 SecretRef 对象。

### 访问策略

- `allowFrom` / `groupAllowFrom` 限制谁可以在 C2C / 群组场景中与 Bot 聊天。`dmPolicy` / `groupPolicy`（`open` | `allowlist` | `disabled`）控制执行模式。只要 `allowFrom` 包含具体的非通配符条目，`dmPolicy` 就默认为 `allowlist`，否则默认为 `open`。只要 `groupAllowFrom` 或 `allowFrom` 包含具体条目，`groupPolicy` 就默认为 `allowlist`，否则默认为 `open`。
- 无论 `dmPolicy` / `groupPolicy` 如何设置，“身份验证：允许列表”斜杠命令都要求 `allowFrom` 中存在明确的非通配符条目（群组调用则要求 `groupAllowFrom` 中存在该条目）——参阅[斜杠命令](#slash-commands)。

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

每个账户拥有独立的 WebSocket 连接、API 客户端和令牌缓存，并以 `appId` 为键。日志行会标记所属账户 ID，因此在一个 Gateway 网关下运行多个 Bot 时，各账户的诊断信息仍可区分。

通过 CLI 添加第二个 Bot：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 群聊

群组支持使用 QQ 群组 OpenID，而不是显示名称。将 Bot 添加到群组，然后提及它，或将群组配置为无需提及即可运行。

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

`groups["*"]` 为所有群组设置默认值；具体的 `groups.GROUP_OPENID` 条目会覆盖某个群组的这些默认值。群组设置：

| 字段                  | 默认值           | 说明                                                                                               |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | Bot 回复前要求 `@` 提及。                                                                          |
| `commandLevel`        | `all`            | 可在群组中运行哪些内置斜杠命令（见下文）。                                                         |
| `ignoreOtherMentions` | `false`          | 丢弃提及其他人但未提及 Bot 的消息。                                                                |
| `historyLimit`        | `50`             | 保留最近未提及 Bot 的消息，作为下一轮提及对话的上下文。`0` 表示禁用历史记录。                      |
| `tools`               | —                | 为整个群组允许/拒绝工具。                                                                          |
| `toolsBySender`       | —                | 按发送者覆盖工具设置；参阅[群组](/zh-CN/channels/groups#groupchannel-tool-restrictions-optional)。        |
| `name`                | OpenID 前缀      | 用于日志和群组上下文的友好标签。                                                                   |
| `prompt`              | 内置默认值       | 附加到智能体上下文中的各群组行为提示词。                                                           |

`commandLevel` 接受以下值：

| 级别     | 行为                                                                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | 现有内置命令保持可用。部分命令仍会从菜单中隐藏，但获得授权的用户依然可以在群组中运行它们。                                                           |
| `safety` | `/help`、`/btw`、`/stop` 在群组中保持可见；敏感命令（`/config`、`/tools`、`/bash` 等）必须在私聊中运行。                                             |
| `strict` | 仅允许严格运行所需的群组会话控制命令。`/stop` 仍然有效，因此获得授权的发送者可以中断正在进行的运行。                                                 |

旧版 QQ Bot `toolPolicy` 条目已停用。运行 `openclaw doctor --fix` 将其迁移到 `tools`。

激活模式为 `mention` 和 `always`。`requireMention: true` 映射到 `mention`；`requireMention: false` 映射到 `always`。如果存在会话级激活覆盖设置，则其优先级高于配置。

入站队列按对端划分。群组对端的队列容量上限更大（50，直接对端为 20）；队列已满时，会先逐出 Bot 发出的消息，再逐出用户消息；连续涌入的普通群组消息会合并为一个注明来源的轮次。斜杠命令逐个运行，不受任何合并批次影响。

### 语音（STT / TTS）

STT 和 TTS 支持具有优先级回退的两级配置：

| 设置 | 插件专属                                                 | 框架回退                      |
| ---- | -------------------------------------------------------- | ----------------------------- |
| STT  | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS  | `channels.qqbot.tts`、`channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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

将任一项设为 `enabled: false` 即可禁用。账户级 TTS 覆盖设置与 `messages.tts` 使用相同结构，并深度合并到渠道/全局 TTS 配置之上。

STT 请求默认在 60 秒后超时。插件专属 STT 使用所选 `models.providers.<id>.timeoutSeconds` 覆盖值。框架音频 STT 依次使用 `tools.media.audio.models[0].timeoutSeconds`、`tools.media.audio.timeoutSeconds`，然后使用所选提供商的覆盖值。

入站 QQ 语音附件会作为音频媒体元数据提供给智能体，同时避免将原始语音文件放入通用 `MediaPaths`。配置 TTS 后，在纯文本回复中使用 `[[audio_as_voice]]` 会合成 TTS 并发送原生 QQ 语音消息。

还可通过 `channels.qqbot.audioFormatPolicy` 调整出站音频上传/转码行为：

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 目标格式

| 格式                       | 说明             |
| -------------------------- | ---------------- |
| `qqbot:c2c:OPENID`         | 私聊（C2C）      |
| `qqbot:group:GROUP_OPENID` | 群聊             |
| `qqbot:channel:CHANNEL_ID` | 频道             |

<Note>
每个 Bot 都有自己的一组用户 OpenID。通过 Bot A 收到的 OpenID **不能**用于通过 Bot B 发送消息。
</Note>

## 斜杠命令

在进入 AI 队列前截获的内置命令：

| 命令                 | 身份验证 | 作用域   | 说明                                                                   |
| -------------------- | -------- | -------- | ---------------------------------------------------------------------- |
| `/bot-ping`          | —        | 任意     | 延迟测试                                                               |
| `/bot-help`          | —        | 任意     | 列出所有命令                                                           |
| `/bot-me`            | —        | 仅限私聊 | 显示发送者的 QQ 用户 ID（OpenID），用于设置 `allowFrom` / `groupAllowFrom` |
| `/bot-version`       | —        | 仅限私聊 | 显示 OpenClaw 框架版本和插件版本                                       |
| `/bot-upgrade`       | —        | 仅限私聊 | 显示 QQ Bot 升级指南链接                                               |
| `/bot-approve`       | 允许列表 | 仅限私聊 | 管理命令执行审批配置（开启/关闭/始终/重置/状态）                        |
| `/bot-logs`          | 允许列表 | 仅限私聊 | 将近期 Gateway 网关日志导出为文件                                      |
| `/bot-clear-storage` | 允许列表 | 仅限私聊 | 删除 QQ Bot 媒体目录下的缓存下载内容                                   |
| `/bot-streaming`     | 允许列表 | 仅限私聊 | 切换 C2C 流式回复                                                      |
| `/bot-group-allways` | 允许列表 | 仅限私聊 | 切换默认群组激活模式（需要提及与始终开启）                             |

在任何命令后附加 `?` 可查看用法帮助（例如 `/bot-upgrade ?`）。

“身份验证：允许列表”命令还要求发送者的 OpenID 位于明确的非通配符 `allowFrom` 列表中（群组中发出的命令优先使用 `groupAllowFrom`，否则回退到 `allowFrom`）。通配符 `allowFrom: ["*"]` 允许聊天，但不允许使用这些命令。在私聊之外运行这些命令或未获得授权时，系统会返回提示，而不是静默丢弃消息。

`/bot-me`、`/bot-version` 和 `/bot-upgrade` 仅限私聊使用，但不要求加入允许列表——任何 C2C 发送者都可以运行它们。

当 QQ Bot Exec 审批使用默认的同聊天回退时，点击原生审批按钮会遵循同一份显式的非通配符命令允许列表。若只授予审批权限而不授予更广泛的命令访问权限，请配置 `channels.qqbot.execApprovals.approvers`。原生 Exec 审批默认启用。

## 媒体和存储

- 入站、出站和 Gateway 网桥媒体共用 `~/.openclaw/media/qqbot` 下的同一个载荷根目录（设置 `OPENCLAW_HOME` 时会遵循该设置），因此上传、下载和转码缓存都位于同一个受保护目录下。
- 面向 C2C 和群组目标的富媒体投递统一通过 `sendMedia` 路径进行。大小为 5&nbsp;MiB 或以上的本地文件和内存缓冲区使用 QQ 的分块上传端点；较小的载荷以及远程 URL/Base64 来源使用单次上传 API。
- 如果热升级在 Gateway 网关完成写入 `openclaw.json` 前将其中断，插件会在下次启动时从内部快照恢复该账户最后已知的 `appId` / `clientSecret`（绝不会覆盖有意进行的配置更改），因此无需重新扫描二维码。

## 故障排查

- **Gateway 网关无法启动/没有入站消息：**请验证 `appId` 和 `clientSecret` 是否正确，并确认该机器人已在 QQ 开放平台启用。缺少凭据时会显示“QQBot 未配置（缺少 appId 或 clientSecret）”。
- **使用 `--token-file` 设置后仍显示未配置：**`--token-file` 只设置 AppSecret。仍必须在配置或 `QQBOT_APP_ID` 中设置 `appId`。
- **突发的群组回复发生冲突：**当某个对端的队列已满时，入站队列会优先淘汰机器人发送的消息，而不是人类发送的消息；它还会将突发的普通（非命令）群组消息合并成一个注明发送者的轮次，因此大量机器人消息不应导致人类消息得不到处理。
- **主动消息未送达：**如果用户最近没有互动，QQ 可能会阻止机器人主动发起的消息。
- **语音未转录：**请确保已配置 STT，并且提供商可访问。

## 相关内容

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [渠道故障排查](/zh-CN/channels/troubleshooting)
