---
read_when:
    - 处理 WhatsApp/网页渠道行为或收件箱路由
summary: WhatsApp 渠道支持、访问控制、送达行为和运维
title: WhatsApp
x-i18n:
    generated_at: "2026-04-29T05:38:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9057208c69d125aea8d063f7c16c98babbf70ded7f693bdb15cde159c4920019
    source_path: channels/whatsapp.md
    workflow: 16
---

Status：已通过 WhatsApp Web（Baileys）达到生产就绪。Gateway 网关拥有已关联会话。

## 安装（按需）

- 新手引导（`openclaw onboard`）和 `openclaw channels add --channel whatsapp`
  会在你首次选择 WhatsApp 插件时提示安装。
- 当插件尚未存在时，`openclaw channels login --channel whatsapp` 也会提供安装流程。
- 开发渠道 + git checkout：默认使用本地插件路径。
- Stable/Beta：当当前软件包已发布时，使用 npm 包 `@openclaw/whatsapp`。

仍然可以手动安装：

```bash
openclaw plugins install @openclaw/whatsapp
```

如果 npm 报告 OpenClaw 拥有的软件包已弃用或缺失，请使用当前打包的 OpenClaw 构建或本地 checkout，直到 npm 包发布链路跟上。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    未知发送者的默认私信策略是配对。
  </Card>
  <Card title="渠道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断和修复手册。
  </Card>
  <Card title="Gateway 网关配置" icon="settings" href="/zh-CN/gateway/configuration">
    完整的渠道配置模式和示例。
  </Card>
</CardGroup>

## 快速设置

<Steps>
  <Step title="配置 WhatsApp 访问策略">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="关联 WhatsApp（二维码）">

```bash
openclaw channels login --channel whatsapp
```

    对于特定账户：

```bash
openclaw channels login --channel whatsapp --account work
```

    若要在登录前附加现有/自定义 WhatsApp Web 认证目录：

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="启动 Gateway 网关">

```bash
openclaw gateway
```

  </Step>

  <Step title="批准第一个配对请求（如果使用配对模式）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    配对请求会在 1 小时后过期。每个渠道的待处理请求上限为 3 个。

  </Step>
</Steps>

<Note>
OpenClaw 建议在可能时使用单独号码运行 WhatsApp。（渠道元数据和设置流程针对这种设置进行了优化，但也支持个人号码设置。）
</Note>

## 部署模式

<AccordionGroup>
  <Accordion title="专用号码（推荐）">
    这是最清晰的运维模式：

    - 为 OpenClaw 使用单独的 WhatsApp 身份
    - 更清晰的私信 allowlist 和路由边界
    - 更低的自聊混淆概率

    最小策略模式：

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="个人号码备用方案">
    新手引导支持个人号码模式，并会写入适合自聊的基线：

    - `dmPolicy: "allowlist"`
    - `allowFrom` 包含你的个人号码
    - `selfChatMode: true`

    在运行时，自聊保护基于已关联的自身号码和 `allowFrom`。

  </Accordion>

  <Accordion title="仅限 WhatsApp Web 的渠道范围">
    在当前 OpenClaw 渠道架构中，消息平台渠道基于 WhatsApp Web（`Baileys`）。

    内置聊天渠道注册表中没有单独的 Twilio WhatsApp 消息渠道。

  </Accordion>
</AccordionGroup>

## 运行时模型

- Gateway 网关拥有 WhatsApp socket 和重连循环。
- 重连 watchdog 使用 WhatsApp Web 传输活动，而不仅是入站应用消息量，因此安静的已关联设备会话不会仅因为最近没人发送消息而被重启。如果传输帧持续到达，但在 watchdog 窗口内没有处理任何应用消息，较长的应用静默上限仍会强制重连。
- Baileys socket 计时在 `web.whatsapp.*` 下显式配置：`keepAliveIntervalMs` 控制 WhatsApp Web 应用 ping，`connectTimeoutMs` 控制开启握手超时，`defaultQueryTimeoutMs` 控制 Baileys 查询超时。
- 出站发送需要目标账户有活跃的 WhatsApp 监听器。
- Status 和广播聊天会被忽略（`@status`、`@broadcast`）。
- 重连 watchdog 跟随 WhatsApp Web 传输活动，而不仅是入站应用消息量：只要传输帧持续，安静的已关联设备会话就会保持在线，但传输停滞会在更晚的远端断开路径之前强制重连。
- 直接聊天使用私信会话规则（`session.dmScope`；默认 `main` 会将私信折叠到智能体主会话）。
- 群组会话隔离（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Web 传输遵循 Gateway 网关主机上的标准代理环境变量（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小写变体）。优先使用主机级代理配置，而不是渠道特定的 WhatsApp 代理设置。
- 启用 `messages.removeAckAfterReply` 时，OpenClaw 会在可见回复送达后清除 WhatsApp ack reaction。

## 插件钩子和隐私

WhatsApp 入站消息可能包含个人消息内容、电话号码、群组标识符、发送者姓名和会话关联字段。因此，除非你显式选择启用，否则 WhatsApp 不会向插件广播入站 `message_received` 钩子 payload：

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

你可以将选择启用限定到一个账户：

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

只对你信任、可接收入站 WhatsApp 消息内容和标识符的插件启用此选项。

## 访问控制和激活

<Tabs>
  <Tab title="私信策略">
    `channels.whatsapp.dmPolicy` 控制直接聊天访问：

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    `allowFrom` 接受 E.164 风格号码（内部会规范化）。

    多账户覆盖：`channels.whatsapp.accounts.<id>.dmPolicy`（以及 `allowFrom`）优先于该账户的渠道级默认值。

    运行时行为详情：

    - 配对会持久化到渠道 allow-store，并与已配置的 `allowFrom` 合并
    - 如果未配置 allowlist，则默认允许已关联的自身号码
    - OpenClaw 绝不会自动配对出站 `fromMe` 私信（你从已关联设备发送给自己的消息）

  </Tab>

  <Tab title="群组策略 + allowlists">
    群组访问有两层：

    1. **群组成员 allowlist**（`channels.whatsapp.groups`）
       - 如果省略 `groups`，则所有群组都符合条件
       - 如果存在 `groups`，它会作为群组 allowlist（允许 `"*"`）

    2. **群组发送者策略**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`：绕过发送者 allowlist
       - `allowlist`：发送者必须匹配 `groupAllowFrom`（或 `*`）
       - `disabled`：阻止所有群组入站

    发送者 allowlist 备用逻辑：

    - 如果未设置 `groupAllowFrom`，运行时会在可用时回退到 `allowFrom`
    - 发送者 allowlist 会在提及/回复激活前评估

    注意：如果完全不存在 `channels.whatsapp` 块，则运行时群组策略备用值是 `allowlist`（并记录警告日志），即使设置了 `channels.defaults.groupPolicy` 也是如此。

  </Tab>

  <Tab title="提及 + /activation">
    默认情况下，群组回复需要提及。

    提及检测包括：

    - 显式提及 bot 身份的 WhatsApp mention
    - 已配置的提及正则模式（`agents.list[].groupChat.mentionPatterns`，备用 `messages.groupChat.mentionPatterns`）
    - 已授权群组消息的入站语音便笺转录
    - 隐式回复 bot 检测（回复发送者匹配 bot 身份）

    安全说明：

    - quote/reply 只满足提及门控；它**不会**授予发送者授权
    - 使用 `groupPolicy: "allowlist"` 时，非 allowlisted 发送者仍会被阻止，即使他们回复的是 allowlisted 用户的消息

    会话级激活命令：

    - `/activation mention`
    - `/activation always`

    `activation` 会更新会话状态（不是全局配置）。它受 owner 门控。

  </Tab>
</Tabs>

## 个人号码和自聊行为

当已关联的自身号码也存在于 `allowFrom` 中时，WhatsApp 自聊保护会激活：

- 跳过自聊轮次的已读回执
- 忽略原本会 ping 你自己的 mention-JID 自动触发行为
- 如果未设置 `messages.responsePrefix`，自聊回复默认使用 `[{identity.name}]` 或 `[openclaw]`

## 消息规范化和上下文

<AccordionGroup>
  <Accordion title="入站信封 + 回复上下文">
    入站 WhatsApp 消息会包装在共享入站信封中。

    如果存在引用回复，上下文会以这种形式追加：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    可用时也会填充回复元数据字段（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、发送者 JID/E.164）。

  </Accordion>

  <Accordion title="媒体占位符和位置/联系人提取">
    仅媒体的入站消息会规范化为如下占位符：

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    当正文只有 `<media:audio>` 时，已授权的群组语音便笺会在提及门控前转录，因此在语音便笺中说出 bot mention 可以触发回复。如果转录文本仍未提及 bot，转录文本会保留在待处理群组历史中，而不是保留原始占位符。

    位置正文使用简短坐标文本。位置标签/评论和联系人/vCard 详情会呈现为 fenced untrusted metadata，而不是内联 prompt 文本。

  </Accordion>

  <Accordion title="待处理群组历史注入">
    对于群组，未处理消息可以被缓冲，并在 bot 最终被触发时作为上下文注入。

    - 默认限制：`50`
    - 配置：`channels.whatsapp.historyLimit`
    - 备用：`messages.groupChat.historyLimit`
    - `0` 禁用

    注入标记：

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="已读回执">
    对已接受的入站 WhatsApp 消息，默认启用已读回执。

    全局禁用：

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    按账户覆盖：

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    即使全局启用，自聊轮次也会跳过已读回执。

  </Accordion>
</AccordionGroup>

## 送达、分块和媒体

<AccordionGroup>
  <Accordion title="文本分块">
    - 默认分块限制：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 模式优先使用段落边界（空行），然后回退到长度安全的分块

  </Accordion>

  <Accordion title="出站媒体行为">
    - 支持图片、视频、音频（PTT 语音便笺）和文档载荷
    - 音频媒体会通过 Baileys `audio` 载荷并带上 `ptt: true` 发送，因此 WhatsApp 客户端会将其渲染为一条按住说话语音便笺
    - 回复载荷会保留 `audioAsVoice`；即使提供商返回 MP3 或 WebM，WhatsApp 的 TTS 语音便笺输出仍会走这条 PTT 路径
    - 原生 Ogg/Opus 音频会作为 `audio/ogg; codecs=opus` 发送，以兼容语音便笺
    - 非 Ogg 音频（包括 Microsoft Edge TTS 的 MP3/WebM 输出）会先用 `ffmpeg` 转码为 48 kHz 单声道 Ogg/Opus，再进行 PTT 投递
    - `/tts latest` 会把最新的助手回复作为一条语音便笺发送，并抑制同一条回复的重复发送；`/tts chat on|off|default` 控制当前 WhatsApp 聊天的自动 TTS
    - 通过视频发送中的 `gifPlayback: true` 支持动画 GIF 播放
    - 发送多媒体回复载荷时，说明文字会应用到第一个媒体项；但 PTT 语音便笺会先发送音频，再单独发送可见文本，因为 WhatsApp 客户端不会稳定渲染语音便笺说明文字
    - 媒体来源可以是 HTTP(S)、`file://` 或本地路径

  </Accordion>

  <Accordion title="媒体大小限制和回退行为">
    - 入站媒体保存上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 出站媒体发送上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 每账号覆盖使用 `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - 图片会自动优化（调整大小/质量扫描）以符合限制
    - 媒体发送失败时，首项回退会发送文本警告，而不是静默丢弃响应

  </Accordion>
</AccordionGroup>

## 错误可见性

`channels.whatsapp.exposeErrorText` 控制是否将智能体/提供商错误文本回传到 WhatsApp。默认值为 `true`。将其设为 `false` 可让 WhatsApp 上的失败保持静默，同时保留其他渠道行为。

```json5
{
  channels: {
    whatsapp: {
      exposeErrorText: false,
    },
  },
}
```

每账号覆盖使用 `channels.whatsapp.accounts.<id>.exposeErrorText`。

## 回复引用

WhatsApp 支持原生回复引用，即出站回复会可见地引用入站消息。用 `channels.whatsapp.replyToMode` 控制。

| 值          | 行为                                                   |
| ----------- | ------------------------------------------------------ |
| `"off"`     | 从不引用；作为普通消息发送                             |
| `"first"`   | 仅引用第一个出站回复分块                               |
| `"all"`     | 引用每个出站回复分块                                   |
| `"batched"` | 引用排队的批量回复，同时让即时回复不带引用             |

默认值为 `"off"`。每账号覆盖使用 `channels.whatsapp.accounts.<id>.replyToMode`。

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## 表情回应级别

`channels.whatsapp.reactionLevel` 控制智能体在 WhatsApp 上使用表情回应的范围：

| 级别          | 确认回应 | 智能体发起的回应 | 描述                               |
| ------------- | -------- | ---------------- | ---------------------------------- |
| `"off"`       | 否       | 否               | 完全不使用回应                     |
| `"ack"`       | 是       | 否               | 仅确认回应（回复前回执）           |
| `"minimal"`   | 是       | 是（保守）       | 确认 + 带保守指引的智能体回应      |
| `"extensive"` | 是       | 是（鼓励）       | 确认 + 带鼓励指引的智能体回应      |

默认值：`"minimal"`。

每账号覆盖使用 `channels.whatsapp.accounts.<id>.reactionLevel`。

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## 确认回应

WhatsApp 支持通过 `channels.whatsapp.ackReaction` 在收到入站消息时立即发送确认回应。
确认回应受 `reactionLevel` 控制 —— 当 `reactionLevel` 为 `"off"` 时会被抑制。

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

行为说明：

- 入站消息被接受后立即发送（回复前）
- 失败会记录日志，但不会阻止正常回复投递
- group 模式 `mentions` 会在由提及触发的轮次中回应；group 激活 `always` 会作为此检查的绕过
- WhatsApp 使用 `channels.whatsapp.ackReaction`（这里不使用旧版 `messages.ackReaction`）

## 多账号和凭证

<AccordionGroup>
  <Accordion title="账号选择和默认值">
    - 账号 ID 来自 `channels.whatsapp.accounts`
    - 默认账号选择：如果存在则使用 `default`，否则使用第一个已配置账号 ID（排序后）
    - 账号 ID 会在内部规范化后用于查找

  </Accordion>

  <Accordion title="凭证路径和旧版兼容性">
    - 当前认证路径：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 备份文件：`creds.json.bak`
    - `~/.openclaw/credentials/` 中的旧版默认认证仍会在默认账号流程中被识别/迁移

  </Accordion>

  <Accordion title="登出行为">
    `openclaw channels logout --channel whatsapp [--account <id>]` 会清除该账号的 WhatsApp 认证状态。

    在旧版认证目录中，`oauth.json` 会保留，同时移除 Baileys 认证文件。

  </Accordion>
</AccordionGroup>

## 工具、操作和配置写入

- 智能体工具支持包括 WhatsApp 表情回应操作（`react`）。
- 操作门控：
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 渠道发起的配置写入默认启用（可通过 `channels.whatsapp.configWrites=false` 禁用）。

## 故障排除

<AccordionGroup>
  <Accordion title="未关联（需要 QR）">
    症状：渠道 Status 报告未关联。

    修复：

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="已关联但断开连接 / 重连循环">
    症状：已关联账号反复断开连接或尝试重连。

    安静账号可以在正常消息超时后继续保持连接；当 WhatsApp Web 传输活动停止、套接字关闭，或应用层活动在更长的安全窗口内持续静默时，看门狗会重启。

    如果日志显示重复的 `status=408 Request Time-out Connection was lost`，请调优 `web.whatsapp` 下的 Baileys 套接字时序。先将 `keepAliveIntervalMs` 缩短到低于你的网络空闲超时，并在慢速或有丢包的链路上增大 `connectTimeoutMs`：

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    修复：

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    如有需要，使用 `channels login` 重新关联。

  </Accordion>

  <Accordion title="代理后面的 QR 登录超时">
    症状：`openclaw channels login --channel whatsapp` 在显示可用 QR 码之前失败，并出现 `status=408 Request Time-out` 或 TLS 套接字断开。

    WhatsApp Web 登录使用 Gateway 网关主机的标准代理环境（`HTTPS_PROXY`、`HTTP_PROXY`、小写变体以及 `NO_PROXY`）。确认 Gateway 网关进程继承了代理环境变量，并且 `NO_PROXY` 不匹配 `mmg.whatsapp.net`。

  </Accordion>

  <Accordion title="发送时没有活跃监听器">
    当目标账号没有活跃的 Gateway 网关监听器时，出站发送会快速失败。

    确保 Gateway 网关正在运行且账号已关联。

  </Accordion>

  <Accordion title="群组消息被意外忽略">
    按以下顺序检查：

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 允许列表条目
    - 提及门控（`requireMention` + 提及模式）
    - `openclaw.json`（JSON5）中的重复键：后面的条目会覆盖前面的条目，因此每个作用域只保留一个 `groupPolicy`

  </Accordion>

  <Accordion title="Bun 运行时警告">
    WhatsApp Gateway 网关运行时应使用 Node。Bun 被标记为不兼容稳定的 WhatsApp/Telegram Gateway 网关操作。
  </Accordion>
</AccordionGroup>

## 系统提示词

WhatsApp 支持通过 `groups` 和 `direct` 映射，为群组和直接聊天配置 Telegram 风格的系统提示词。

群组消息的解析层级：

首先确定有效的 `groups` 映射：如果账号定义了自己的 `groups`，它会完全替换根级 `groups` 映射（不做深度合并）。随后在生成的单一映射上执行提示词查找：

1. **群组特定系统提示词**（`groups["<groupId>"].systemPrompt`）：当映射中存在特定群组条目**并且**定义了其 `systemPrompt` 键时使用。如果 `systemPrompt` 是空字符串（`""`），则通配符会被抑制，且不会应用任何系统提示词。
2. **群组通配符系统提示词**（`groups["*"].systemPrompt`）：当映射中完全不存在特定群组条目，或该条目存在但没有定义 `systemPrompt` 键时使用。

直接消息的解析层级：

首先确定有效的 `direct` 映射：如果账号定义了自己的 `direct`，它会完全替换根级 `direct` 映射（不做深度合并）。随后在生成的单一映射上执行提示词查找：

1. **直接聊天特定系统提示词**（`direct["<peerId>"].systemPrompt`）：当映射中存在特定对端条目**并且**定义了其 `systemPrompt` 键时使用。如果 `systemPrompt` 是空字符串（`""`），则通配符会被抑制，且不会应用任何系统提示词。
2. **直接聊天通配符系统提示词**（`direct["*"].systemPrompt`）：当映射中完全不存在特定对端条目，或该条目存在但没有定义 `systemPrompt` 键时使用。

<Note>
`dms` 仍是轻量的每私信历史覆盖桶（`dms.<id>.historyLimit`）。提示词覆盖位于 `direct` 下。
</Note>

**与 Telegram 多账号行为的区别：**在 Telegram 中，多账号设置会有意对所有账号抑制根级 `groups` —— 即使某些账号没有定义自己的 `groups` —— 以防止机器人接收它不属于的群组消息。WhatsApp 不应用此保护：根级 `groups` 和根级 `direct` 始终会被未定义账号级覆盖的账号继承，无论配置了多少账号。在多账号 WhatsApp 设置中，如果你想要按账号配置群组或直接聊天提示词，请在每个账号下显式定义完整映射，而不是依赖根级默认值。

重要行为：

- `channels.whatsapp.groups` 既是每群组配置映射，也是聊天级群组允许列表。在根作用域或账号作用域中，`groups["*"]` 表示该作用域“允许所有群组”。
- 仅当你已经希望该作用域允许所有群组时，才添加通配符群组 `systemPrompt`。如果你仍希望只有一组固定的群组 ID 具备资格，不要使用 `groups["*"]` 作为提示词默认值。请改为在每个显式允许列出的群组条目上重复该提示词。
- 群组准入和发送者授权是独立检查。`groups["*"]` 会扩大可进入群组处理的群组集合，但它本身不会授权这些群组中的每个发送者。发送者访问仍由 `channels.whatsapp.groupPolicy` 和 `channels.whatsapp.groupAllowFrom` 单独控制。
- `channels.whatsapp.direct` 对私信没有相同的副作用。`direct["*"]` 只会在私信已通过 `dmPolicy` 加 `allowFrom` 或配对存储规则被准入后，提供默认的直接聊天配置。

示例：

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## 配置参考指引

主要参考：

- [配置参考 - WhatsApp](/zh-CN/gateway/config-channels#whatsapp)

高价值 WhatsApp 字段：

- 访问：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`
- 投递：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`、`exposeErrorText`
- 多账号：`accounts.<id>.enabled`、`accounts.<id>.authDir`、账号级覆盖项
- 操作：`configWrites`、`debounceMs`、`web.enabled`、`web.heartbeatSeconds`、`web.reconnect.*`、`web.whatsapp.*`
- 会话行为：`session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`
- 提示词：`groups.<id>.systemPrompt`、`groups["*"].systemPrompt`、`direct.<id>.systemPrompt`、`direct["*"].systemPrompt`

## 相关

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [安全](/zh-CN/gateway/security)
- [渠道路由](/zh-CN/channels/channel-routing)
- [多智能体路由](/zh-CN/concepts/multi-agent)
- [故障排除](/zh-CN/channels/troubleshooting)
