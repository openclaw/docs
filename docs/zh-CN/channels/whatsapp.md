---
read_when:
    - 处理 WhatsApp/web 渠道行为或收件箱路由
summary: WhatsApp 渠道支持、访问控制、投递行为和运维
title: WhatsApp
x-i18n:
    generated_at: "2026-06-27T01:28:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88f81adc38bd64d1e35f382dfc209e690c059d52e522e5cbdf77d1da45c9d15f
    source_path: channels/whatsapp.md
    workflow: 16
---

状态：通过 WhatsApp Web（Baileys）达到生产就绪。Gateway 网关拥有已关联的会话。

## 按需安装

- 新手引导（`openclaw onboard`）和 `openclaw channels add --channel whatsapp`
  会在你首次选择 WhatsApp 插件时提示安装。
- 当插件尚不存在时，`openclaw channels login --channel whatsapp` 也会提供安装流程。
- 开发频道 + git checkout：默认使用本地插件路径。
- Stable/Beta：优先从 ClawHub 安装官方 `@openclaw/whatsapp` 插件，
  并以 npm 作为回退。
- WhatsApp 运行时在核心 OpenClaw npm 包之外分发，因此
  WhatsApp 专用运行时依赖会保留在外部插件中。

仍然可以手动安装：

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

仅在需要注册表回退时使用裸 npm 包（`@openclaw/whatsapp`）。
仅在需要可复现安装时固定精确版本。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/zh-CN/channels/pairing">
    未知发送者的默认私信策略是配对。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断和修复手册。
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/zh-CN/gateway/configuration">
    完整的渠道配置模式和示例。
  </Card>
</CardGroup>

## 快速设置

<Steps>
  <Step title="Configure WhatsApp access policy">

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

  <Step title="Link WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    当前登录基于二维码。在远程或无头环境中，开始登录前请确保
    有可靠路径可将实时二维码交付给要扫码的手机。

    对于特定账号：

```bash
openclaw channels login --channel whatsapp --account work
```

    若要在登录前附加现有/自定义 WhatsApp Web 凭证目录：

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Start the gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approve first pairing request (if using pairing mode)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    配对请求会在 1 小时后过期。每个渠道最多保留 3 个待处理请求。

  </Step>
</Steps>

<Note>
OpenClaw 建议在可行时为 WhatsApp 使用单独号码。（渠道元数据和设置流程针对这种设置进行了优化，但也支持个人号码设置。）
</Note>

<Warning>
当前 WhatsApp 设置流程仅支持二维码。终端渲染的二维码、截图、
PDF 或聊天附件在从远程机器转发期间可能过期或变得无法读取。
对于远程/无头主机，优先使用直接的二维码图片交接路径，而不是手动捕获终端内容。
</Warning>

## 部署模式

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    这是最清晰的运维模式：

    - 为 OpenClaw 使用单独的 WhatsApp 身份
    - 更清晰的私信允许列表和路由边界
    - 降低自聊混淆的概率

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

  <Accordion title="Personal-number fallback">
    新手引导支持个人号码模式，并写入适合自聊的基线：

    - `dmPolicy: "allowlist"`
    - `allowFrom` 包含你的个人号码
    - `selfChatMode: true`

    在运行时，自聊保护基于已关联的自身号码和 `allowFrom`。

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    在当前 OpenClaw 渠道架构中，消息平台渠道基于 WhatsApp Web（`Baileys`）。

    内置聊天渠道注册表中没有单独的 Twilio WhatsApp 消息渠道。

  </Accordion>
</AccordionGroup>

## 运行时模型

- Gateway 网关拥有 WhatsApp socket 和重连循环。
- 重连 watchdog 使用 WhatsApp Web 传输活动，而不仅仅是入站应用消息量，因此安静的已关联设备会话不会仅因为最近没人发送消息而重启。如果传输帧持续到达但在 watchdog 窗口内没有处理任何应用消息，较长的应用静默上限仍会强制重连；对于最近活跃会话的临时重连，首次恢复窗口会对该应用静默检查使用普通消息超时。
- Baileys socket 时序显式位于 `web.whatsapp.*` 下：`keepAliveIntervalMs` 控制 WhatsApp Web 应用 ping，`connectTimeoutMs` 控制打开握手超时，`defaultQueryTimeoutMs` 控制 Baileys 查询等待以及 OpenClaw 本地出站发送/在线状态和入站已读回执操作边界。
- 出站发送需要目标账号有活跃的 WhatsApp 监听器。
- 当文本和媒体说明中的 `@+<digits>` 与 `@<digits>` token 匹配当前 WhatsApp 参与者元数据时，群组发送会附加原生提及元数据，包括基于 LID 的群组。
- 状态和广播聊天会被忽略（`@status`、`@broadcast`）。
- 重连 watchdog 跟随 WhatsApp Web 传输活动，而不仅仅是入站应用消息量：只要传输帧继续，安静的已关联设备会话就会保持在线，但传输停滞会在较晚的远端断开路径之前强制重连。
- 直接聊天使用私信会话规则（`session.dmScope`；默认 `main` 会将私信折叠到 Agent 主会话）。
- 群组会话是隔离的（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Channels/Newsletters 可以使用其原生 `@newsletter` JID 作为显式出站目标。出站 newsletter 发送使用渠道会话元数据（`agent:<agentId>:whatsapp:channel:<jid>`），而不是私信会话语义。
- WhatsApp Web 传输遵循 Gateway 网关主机上的标准代理环境变量（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小写变体）。优先使用主机级代理配置，而不是渠道专用 WhatsApp 代理设置。
- 启用 `messages.removeAckAfterReply` 时，OpenClaw 会在可见回复送达后清除 WhatsApp ack 反应。

## 审批提示

WhatsApp 可以用 `👍` / `👎` reaction 渲染 exec 和插件审批提示。投递由顶层审批转发配置控制：

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` 和 `approvals.plugin` 相互独立。启用 WhatsApp 作为渠道只会关联
传输；除非匹配的审批族已启用并路由到 WhatsApp，否则不会发送审批提示。
会话模式只为源自 WhatsApp 的审批投递原生表情审批。目标模式会对显式 WhatsApp
目标使用共享转发管线，并且不会创建单独的审批者私信扇出。

WhatsApp 审批 reaction 需要来自 `allowFrom` 或 `"*"` 的显式 WhatsApp 审批者。
`defaultTo` 控制普通默认消息目标；它不是审批审批者。手动
`/approve` 命令在解析审批前仍会通过普通 WhatsApp 发送者授权路径。

## 插件钩子和隐私

WhatsApp 入站消息可能包含个人消息内容、电话号码、
群组标识符、发送者姓名和会话关联字段。因此，
除非你显式选择启用，否则 WhatsApp 不会向插件广播入站
`message_received` 钩子负载：

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

你可以将选择启用范围限定到一个账号：

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

仅对你信任可接收入站 WhatsApp 消息内容和标识符的插件启用此项。

## 访问控制和激活

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` 控制直接聊天访问：

    - `pairing`（默认）
    - `allowlist`
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    `allowFrom` 接受 E.164 风格号码（内部会标准化）。

    `allowFrom` 是私信发送者访问控制列表。它不会限制对 WhatsApp 群组 JID 或 `@newsletter` 渠道 JID 的显式出站发送。

    多账号覆盖：`channels.whatsapp.accounts.<id>.dmPolicy`（以及 `allowFrom`）优先于该账号的渠道级默认值。

    运行时行为细节：

    - 配对会持久化在渠道 allow-store 中，并与配置的 `allowFrom` 合并
    - 定时自动化和 Heartbeat 接收者回退会使用显式投递目标或配置的 `allowFrom`；私信配对审批不会隐式成为 cron 或 Heartbeat 接收者
    - 如果未配置允许列表，默认允许已关联的自身号码
    - OpenClaw 永远不会自动配对出站 `fromMe` 私信（你从已关联设备发送给自己的消息）

  </Tab>

  <Tab title="Group policy + allowlists">
    群组访问有两层：

    1. **群组成员允许列表**（`channels.whatsapp.groups`）
       - 如果省略 `groups`，所有群组都有资格
       - 如果存在 `groups`，它会作为群组允许列表（允许 `"*"`）

    2. **群组发送者策略**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`：绕过发送者允许列表
       - `allowlist`：发送者必须匹配 `groupAllowFrom`（或 `*`）
       - `disabled`：阻止所有群组入站

    发送者允许列表回退：

    - 如果未设置 `groupAllowFrom`，运行时会在可用时回退到 `allowFrom`
    - 发送者允许列表会在提及/回复激活之前求值

    注意：如果完全不存在 `channels.whatsapp` 块，即使设置了 `channels.defaults.groupPolicy`，运行时群组策略回退也是 `allowlist`（并带有警告日志）。

  </Tab>

  <Tab title="Mentions + /activation">
    默认情况下，群组回复需要提及。

    提及检测包括：

    - 对 bot 身份的显式 WhatsApp 提及
    - 配置的提及正则模式（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）
    - 已授权群组消息的入站语音备注转录
    - 隐式回复 bot 检测（回复发送者匹配 bot 身份）

    安全说明：

    - quote/reply 只满足提及门控；它**不会**授予发送者授权
    - 使用 `groupPolicy: "allowlist"` 时，即使未在允许列表中的发送者回复了允许列表用户的消息，仍会被阻止

    会话级激活命令：

    - `/activation mention`
    - `/activation always`

    `activation` 会更新会话状态（不是全局配置）。它受所有者门控。

  </Tab>
</Tabs>

## 已配置的 ACP 绑定

WhatsApp 支持通过顶层 `bindings[]` 条目配置持久 ACP 绑定：

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

- 直接聊天匹配 E.164 号码，例如 `+15555550123`。
- 群组匹配 WhatsApp 群组 JID，例如 `120363424282127706@g.us`。
- 群组 allowlist、发送者策略，以及提及或激活门控，会在 OpenClaw 确保已配置的 ACP 会话存在之前运行。
- 匹配的已配置 ACP 绑定拥有该路由。WhatsApp 广播群组不会把该轮次扇出到普通 WhatsApp 会话。

## 个人号码和自聊行为

当已链接的本人号码也出现在 `allowFrom` 中时，WhatsApp 自聊保护会激活：

- 跳过自聊轮次的已读回执
- 忽略原本会 ping 你自己的 mention-JID 自动触发行为
- 如果未设置 `messages.responsePrefix`，自聊回复默认使用 `[{identity.name}]` 或 `[openclaw]`

## 消息规范化和上下文

<AccordionGroup>
  <Accordion title="入站信封 + 回复上下文">
    传入的 WhatsApp 消息会被包装在共享入站信封中。

    如果存在引用回复，上下文会按以下形式追加：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    可用时也会填充回复元数据字段（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、发送者 JID/E.164）。
    当引用回复目标是可下载媒体时，OpenClaw 会通过常规入站媒体存储保存它，并将其暴露为 `MediaPath`/`MediaType`，以便智能体可以检查被引用的图片，而不是只看到 `<media:image>`。

  </Accordion>

  <Accordion title="媒体占位符和位置/联系人提取">
    仅包含媒体的入站消息会用如下占位符规范化：

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    授权群组语音备注会在提及门控之前转写，前提是正文只有 `<media:audio>`，因此在语音备注中说出机器人提及也可以触发回复。如果转写文本仍未提及机器人，转写文本会保留在待处理群组历史中，而不是原始占位符。

    位置正文使用简短的坐标文本。位置标签/评论以及联系人/vCard 详情会呈现为带围栏的不可信元数据，而不是内联提示文本。

  </Accordion>

  <Accordion title="待处理群组历史注入">
    对于群组，未处理的消息可以被缓冲，并在机器人最终被触发时作为上下文注入。

    - 默认限制：`50`
    - 配置：`channels.whatsapp.historyLimit`
    - fallback：`messages.groupChat.historyLimit`
    - `0` 禁用

    注入标记：

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="已读回执">
    已接受的入站 WhatsApp 消息默认启用已读回执。

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

    按账号覆盖：

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

## 投递、分块和媒体

<AccordionGroup>
  <Accordion title="文本分块">
    - 默认分块限制：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 模式优先使用段落边界（空行），然后回退到长度安全的分块

  </Accordion>

  <Accordion title="出站媒体行为">
    - 支持图片、视频、音频（PTT 语音备注）和文档载荷
    - 音频媒体会通过 Baileys `audio` 载荷发送，并带有 `ptt: true`，因此 WhatsApp 客户端会将其呈现为按住说话的语音备注
    - 回复载荷会保留 `audioAsVoice`；即使提供商返回 MP3 或 WebM，面向 WhatsApp 的 TTS 语音备注输出也会留在这条 PTT 路径上
    - 原生 Ogg/Opus 音频会以 `audio/ogg; codecs=opus` 发送，以兼容语音备注
    - 非 Ogg 音频（包括 Microsoft Edge TTS MP3/WebM 输出）会在 PTT 投递前用 `ffmpeg` 转码为 48 kHz 单声道 Ogg/Opus
    - `/tts latest` 会将最新助手回复作为一条语音备注发送，并抑制对同一回复的重复发送；`/tts chat on|off|default` 控制当前 WhatsApp 聊天的自动 TTS
    - 通过视频发送上的 `gifPlayback: true` 支持动画 GIF 播放
    - `forceDocument` / `asDocument` 会通过 Baileys 文档载荷发送出站图片、GIF 和视频，以避免 WhatsApp 媒体压缩，同时保留解析后的文件名和 MIME 类型
    - 发送多媒体回复载荷时，说明文字会应用到第一个媒体项；PTT 语音备注除外，因为 WhatsApp 客户端不会稳定呈现语音备注说明文字，所以会先发送音频，再单独发送可见文本
    - 媒体来源可以是 HTTP(S)、`file://` 或本地路径

  </Accordion>

  <Accordion title="媒体大小限制和 fallback 行为">
    - 入站媒体保存上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 出站媒体发送上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 按账号覆盖使用 `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - 除非 `forceDocument` / `asDocument` 请求文档投递，否则图片会自动优化（调整大小/质量扫掠）以符合限制
    - 媒体发送失败时，首项 fallback 会发送文本警告，而不是静默丢弃回复

  </Accordion>
</AccordionGroup>

## 回复引用

WhatsApp 支持原生回复引用，出站回复会可见地引用入站消息。用 `channels.whatsapp.replyToMode` 控制它。

| 值          | 行为                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | 从不引用；作为普通消息发送                                            |
| `"first"`   | 只引用第一个出站回复分块                                              |
| `"all"`     | 引用每个出站回复分块                                                  |
| `"batched"` | 引用排队的批处理回复，同时让即时回复保持不引用                        |

默认值为 `"off"`。按账号覆盖使用 `channels.whatsapp.accounts.<id>.replyToMode`。

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Reaction 级别

`channels.whatsapp.reactionLevel` 控制智能体在 WhatsApp 上使用表情 reaction 的范围：

| 级别          | Ack reaction | 智能体发起的 reaction | 描述                                             |
| ------------- | ------------ | --------------------- | ------------------------------------------------ |
| `"off"`       | 否           | 否                    | 完全不使用 reaction                              |
| `"ack"`       | 是           | 否                    | 仅 Ack reaction（回复前回执）                    |
| `"minimal"`   | 是           | 是（保守）            | Ack + 智能体 reaction，使用保守指导              |
| `"extensive"` | 是           | 是（鼓励）            | Ack + 智能体 reaction，使用鼓励指导              |

默认值：`"minimal"`。

按账号覆盖使用 `channels.whatsapp.accounts.<id>.reactionLevel`。

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## 确认 reaction

WhatsApp 支持通过 `channels.whatsapp.ackReaction` 在入站回执时立即发送 ack reaction。
Ack reaction 受 `reactionLevel` 门控，当 `reactionLevel` 为 `"off"` 时会被抑制。

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

- 在入站被接受后立即发送（回复前）
- 如果存在不带 `emoji` 的 `ackReaction`，WhatsApp 会使用路由智能体的身份 emoji，并回退到 "👀"；省略 `ackReaction` 或设置 `emoji: ""` 则不发送 ack reaction
- 失败会被记录到日志，但不会阻塞正常回复投递
- 群组模式 `mentions` 会在提及触发的轮次上 reaction；群组激活 `always` 会作为此检查的旁路
- WhatsApp 使用 `channels.whatsapp.ackReaction`（旧版 `messages.ackReaction` 在这里不使用）

## 生命周期状态 reaction

设置 `messages.statusReactions.enabled: true`，让 WhatsApp 在轮次期间替换 ack reaction，而不是保留静态回执 emoji。启用后，OpenClaw 会将同一个入站消息 reaction 槽用于排队、思考、工具活动、压缩、完成和错误等生命周期状态。

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

行为说明：

- `channels.whatsapp.ackReaction` 仍控制状态 reaction 是否适用于直接消息和群组。
- 排队状态 reaction 使用与普通 ack reaction 相同的有效 ack emoji。
- WhatsApp 每条消息只有一个机器人 reaction 槽，因此生命周期更新会就地替换当前 reaction。
- `messages.removeAckAfterReply: true` 会在配置的完成/错误保留时间后清除最终状态 reaction。
- 工具 emoji 类别包括 `tool`、`coding`、`web`、`deploy`、`build` 和 `concierge`。

## 多账号和凭证

<AccordionGroup>
  <Accordion title="账号选择和默认值">
    - 账号 ID 来自 `channels.whatsapp.accounts`
    - 默认账号选择：如果存在则使用 `default`，否则使用第一个已配置账号 ID（排序后）
    - 账号 ID 会在内部规范化以便查找

  </Accordion>

  <Accordion title="凭证路径和旧版兼容性">
    - 当前认证路径：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 备份文件：`creds.json.bak`
    - `~/.openclaw/credentials/` 中的旧版默认认证仍会在默认账号流程中被识别/迁移

  </Accordion>

  <Accordion title="登出行为">
    `openclaw channels logout --channel whatsapp [--account <id>]` 会清除该账号的 WhatsApp 认证状态。

    当 Gateway 网关可达时，登出会先停止所选账号的实时 WhatsApp 监听器，因此已链接会话不会在下次重启前继续接收消息。`openclaw channels remove --channel whatsapp` 也会在禁用或删除账号配置前停止实时监听器。

    在旧版认证目录中，`oauth.json` 会被保留，而 Baileys 认证文件会被移除。

  </Accordion>
</AccordionGroup>

## 工具、操作和配置写入

- 智能体工具支持包括 WhatsApp reaction 操作（`react`）。
- 操作门控：
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 默认启用由渠道发起的配置写入（通过 `channels.whatsapp.configWrites=false` 禁用）。

## 故障排除

<AccordionGroup>
  <Accordion title="未链接（需要 QR）">
    症状：渠道状态报告未链接。

    修复：

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="已链接但断开 / 重连循环">
    症状：已链接账号反复断开或尝试重连。

    安静账号可以在正常消息超时后保持连接；当 WhatsApp Web 传输活动停止、socket 关闭，或应用级活动在更长安全窗口之外保持静默时，watchdog 会重启。

    如果日志显示重复的 `status=408 Request Time-out Connection was lost`，请调整 `web.whatsapp` 下的 Baileys 套接字计时。先将 `keepAliveIntervalMs` 缩短到低于你的网络空闲超时时间，并在较慢或丢包的链路上增加 `connectTimeoutMs`：

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
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    如果修复主机连接和计时后循环仍然存在，请备份账号凭证目录并重新关联该账号：

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    如果 `~/.openclaw/logs/whatsapp-health.log` 显示 `Gateway inactive`，但 `openclaw gateway status` 和 `openclaw channels status --probe` 显示 Gateway 网关和 WhatsApp 状态正常，请运行 `openclaw doctor`。在 Linux 上，Doctor 会警告仍在调用 `~/.openclaw/bin/ensure-whatsapp.sh` 的旧版 crontab 条目；请用 `crontab -e` 删除这些过期条目，因为 cron 可能缺少 systemd 用户总线环境，并导致旧脚本误报 Gateway 网关健康状态。

    如有需要，请用 `channels login` 重新关联。

  </Accordion>

  <Accordion title="QR 登录在代理后超时">
    症状：`openclaw channels login --channel whatsapp` 在显示可用二维码之前失败，并出现 `status=408 Request Time-out` 或 TLS 套接字断开。

    WhatsApp Web 登录使用 Gateway 网关主机的标准代理环境（`HTTPS_PROXY`、`HTTP_PROXY`、小写变体和 `NO_PROXY`）。确认 Gateway 网关进程继承了代理环境变量，并且 `NO_PROXY` 没有匹配 `mmg.whatsapp.net`。

  </Accordion>

  <Accordion title="发送时没有活动监听器">
    当目标账号没有活动的 Gateway 网关监听器时，出站发送会快速失败。

    确保 Gateway 网关正在运行，并且账号已关联。

  </Accordion>

  <Accordion title="回复出现在转录中但未出现在 WhatsApp 中">
    转录行记录智能体生成的内容。WhatsApp 送达会单独检查：只有在 Baileys 至少为一次可见文本或媒体发送返回出站消息 ID 后，OpenClaw 才会将自动回复视为已发送。

    Ack reactions 是独立的回复前回执。成功的 reaction 并不能证明后续文本或媒体回复已被 WhatsApp 接受。

    检查 Gateway 网关日志中是否有 `auto-reply delivery failed` 或 `auto-reply was not accepted by WhatsApp provider`。

  </Accordion>

  <Accordion title="群组消息被意外忽略">
    按以下顺序检查：

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 允许列表条目
    - 提及门控（`requireMention` + 提及模式）
    - `openclaw.json`（JSON5）中的重复键：后面的条目会覆盖前面的条目，因此每个作用域只保留一个 `groupPolicy`

    如果存在 `channels.whatsapp.groups`，WhatsApp 仍然可以观察到来自其他群组的消息，但 OpenClaw 会在会话路由前丢弃它们。将群组 JID 添加到 `channels.whatsapp.groups`，或添加 `groups["*"]` 以接纳所有群组，同时仍通过 `groupPolicy` 和 `groupAllowFrom` 保持发送者授权控制。

  </Accordion>

  <Accordion title="Bun 运行时警告">
    WhatsApp Gateway 网关运行时应使用 Node。Bun 被标记为不兼容稳定的 WhatsApp/Telegram Gateway 网关操作。
  </Accordion>
</AccordionGroup>

## 系统提示词

WhatsApp 通过 `groups` 和 `direct` 映射，支持面向群组和直接聊天的 Telegram 风格系统提示词。

群组消息的解析层级：

首先确定有效的 `groups` 映射：如果账号定义了自己的 `groups`，它会完全替换根级 `groups` 映射（不进行深度合并）。然后在生成的单一映射上查找提示词：

1. **群组专属系统提示词**（`groups["<groupId>"].systemPrompt`）：当映射中存在特定群组条目，**并且**定义了它的 `systemPrompt` 键时使用。如果 `systemPrompt` 是空字符串（`""`），则会抑制通配符，并且不会应用系统提示词。
2. **群组通配系统提示词**（`groups["*"].systemPrompt`）：当映射中完全不存在特定群组条目，或存在该条目但未定义 `systemPrompt` 键时使用。

直接消息的解析层级：

首先确定有效的 `direct` 映射：如果账号定义了自己的 `direct`，它会完全替换根级 `direct` 映射（不进行深度合并）。然后在生成的单一映射上查找提示词：

1. **直接聊天专属系统提示词**（`direct["<peerId>"].systemPrompt`）：当映射中存在特定对端条目，**并且**定义了它的 `systemPrompt` 键时使用。如果 `systemPrompt` 是空字符串（`""`），则会抑制通配符，并且不会应用系统提示词。
2. **直接聊天通配系统提示词**（`direct["*"].systemPrompt`）：当映射中完全不存在特定对端条目，或存在该条目但未定义 `systemPrompt` 键时使用。

<Note>
`dms` 仍然是轻量级的每私信历史覆盖桶（`dms.<id>.historyLimit`）。提示词覆盖位于 `direct` 下。
</Note>

**与 Telegram 多账号行为的区别：**在 Telegram 中，多账号设置会有意对所有账号抑制根级 `groups`，即使某些账号没有定义自己的 `groups`，也是如此，以防止机器人接收来自其不属于的群组的群组消息。WhatsApp 不应用此防护：对于未定义账号级覆盖的账号，无论配置了多少个账号，始终会继承根级 `groups` 和根级 `direct`。在多账号 WhatsApp 设置中，如果你需要按账号设置群组或直接聊天提示词，请在每个账号下显式定义完整映射，而不是依赖根级默认值。

重要行为：

- `channels.whatsapp.groups` 既是每群组配置映射，也是聊天级群组允许列表。在根级或账号作用域中，`groups["*"]` 表示该作用域“接纳所有群组”。
- 只有在你已经希望该作用域接纳所有群组时，才添加通配群组 `systemPrompt`。如果你仍希望只有固定的一组群组 ID 有资格进入处理，请不要使用 `groups["*"]` 作为提示词默认值。请改为在每个显式允许的群组条目上重复该提示词。
- 群组接纳和发送者授权是独立检查。`groups["*"]` 会扩大可进入群组处理的群组集合，但它本身不会授权这些群组中的每个发送者。发送者访问仍由 `channels.whatsapp.groupPolicy` 和 `channels.whatsapp.groupAllowFrom` 单独控制。
- `channels.whatsapp.direct` 对私信没有相同副作用。`direct["*"]` 只会在私信已通过 `dmPolicy` 加 `allowFrom` 或配对存储规则接纳后，提供默认的直接聊天配置。

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

- [Configuration reference - WhatsApp](/zh-CN/gateway/config-channels#whatsapp)

高信号 WhatsApp 字段：

- 访问：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`
- 送达：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`
- 多账号：`accounts.<id>.enabled`、`accounts.<id>.authDir`、账号级覆盖
- 操作：`configWrites`、`debounceMs`、`web.enabled`、`web.heartbeatSeconds`、`web.reconnect.*`、`web.whatsapp.*`
- 会话行为：`session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`
- 提示词：`groups.<id>.systemPrompt`、`groups["*"].systemPrompt`、`direct.<id>.systemPrompt`、`direct["*"].systemPrompt`

## 相关

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [安全](/zh-CN/gateway/security)
- [频道路由](/zh-CN/channels/channel-routing)
- [多 Agent 路由](/zh-CN/concepts/multi-agent)
- [故障排除](/zh-CN/channels/troubleshooting)
