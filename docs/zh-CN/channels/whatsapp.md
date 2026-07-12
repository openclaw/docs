---
read_when:
    - 处理 WhatsApp/Web 渠道行为或收件箱路由
summary: WhatsApp 渠道支持、访问控制、消息递送行为和运维
title: WhatsApp
x-i18n:
    generated_at: "2026-07-11T20:21:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f416d2b7a75e9c4798ded34a1ec5d9d7f49ab99a56977f1383347936fe47af55
    source_path: channels/whatsapp.md
    workflow: 16
---

状态：已通过 WhatsApp Web（Baileys）达到生产就绪。Gateway 网关拥有已关联的会话；不存在单独的 Twilio WhatsApp 渠道。

## 安装

首次选择该插件时，`openclaw onboard` 和 `openclaw channels add --channel whatsapp` 会提示安装；如果插件缺失，`openclaw channels login --channel whatsapp` 也会提供相同的安装流程。开发检出使用本地插件路径；稳定版/测试版安装会先从 ClawHub 安装 `@openclaw/whatsapp`，失败时回退到 npm。WhatsApp 运行时在 OpenClaw 核心 npm 软件包之外发布，因此其运行时依赖由外部插件自行携带。手动安装：

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

仅在回退到注册表时使用不带前缀的 npm 软件包（`@openclaw/whatsapp`）；只有需要可复现安装时才固定到确切版本。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    对于未知发送者，默认私信策略为配对。
  </Card>
  <Card title="渠道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断和修复操作手册。
  </Card>
  <Card title="Gateway 配置" icon="settings" href="/zh-CN/gateway/configuration">
    完整的渠道配置模式和示例。
  </Card>
</CardGroup>

## 快速设置

<Steps>
  <Step title="配置访问策略">

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

    登录仅支持二维码。在远程或无头主机上，开始登录前应准备好将实时二维码可靠传送到手机的方式；终端渲染的二维码、屏幕截图或聊天附件可能会在传送途中失效。

    对于特定账户：

```bash
openclaw channels login --channel whatsapp --account work
```

    要在登录前关联现有/自定义身份验证目录：

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

  <Step title="批准首个配对请求（配对模式）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    配对请求会在 1 小时后过期；每个账户最多可有 3 个待处理请求。

  </Step>
</Steps>

<Note>
建议使用单独的 WhatsApp 号码（设置和元数据已针对这种方式优化），但也完全支持个人号码/与自己聊天的设置。
</Note>

## 部署模式

<AccordionGroup>
  <Accordion title="专用号码（推荐）">
    - 为 OpenClaw 使用单独的 WhatsApp 身份
    - 私信允许列表和路由边界更清晰
    - 降低与自己聊天时产生混淆的可能性

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

  <Accordion title="个人号码回退方案">
    新手引导支持个人号码模式，并写入适合与自己聊天的基线配置：`dmPolicy: "allowlist"`、`allowFrom` 包含你自己的号码、`selfChatMode: true`。运行时的与自己聊天保护机制以已关联的自身号码和 `allowFrom` 为依据。
  </Accordion>
</AccordionGroup>

## 运行时模型

- Gateway 网关拥有 WhatsApp 套接字和重新连接循环。
- 看门狗独立跟踪两个信号：原始 WhatsApp Web 传输活动和应用消息活动。安静但仍保持连接的会话不会仅仅因为最近没有收到消息而重启；只有在固定的内部时间窗口内停止收到传输帧（用户不可配置），或应用消息的静默时间超过正常消息超时的 4 倍时，才会强制重新连接。对于最近活跃的会话，刚刚重新连接后的首个窗口会使用较短的正常消息超时，而不是 4 倍窗口。对于 Baileys 在重新连接早期送达的离线消息，OpenClaw 可以自动回复，其范围受入站消息 ID 去重有效期限制；初次启动仍保留较短的过期历史记录防护。
- Baileys 套接字计时在 `web.whatsapp.*` 下显式配置：`keepAliveIntervalMs`（应用 ping 间隔）、`connectTimeoutMs`（建立连接的握手超时）、`defaultQueryTimeoutMs`（Baileys 查询等待时间，以及 OpenClaw 的出站发送/在线状态和入站已读回执超时）。
- 出站发送要求目标账户存在活跃的 WhatsApp 监听器；否则发送会立即失败。
- 当群组发送中的 `@+<digits>` 和 `@<digits>` 标记（位于文本和媒体说明中）与当前参与者元数据匹配时，会附加原生提及元数据，包括由 LID 支持的群组。
- 状态和广播聊天（`@status`、`@broadcast`）会被忽略。
- 直接聊天使用私信会话规则（`session.dmScope`；默认值 `main` 会将私信合并到智能体主会话中）。群组会话按 JID 隔离（`agent:<agentId>:whatsapp:group:<jid>`）。
- 可通过 WhatsApp Channels/Newsletters 的原生 `@newsletter` JID 将其明确指定为出站目标，并使用渠道会话元数据（`agent:<agentId>:whatsapp:channel:<jid>`），而不是私信语义。
- WhatsApp Web 传输遵循 Gateway 网关主机上的标准代理环境变量（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` 及其小写变体）。相比按渠道配置，优先使用主机级代理配置。
- 启用 `messages.removeAckAfterReply` 后，OpenClaw 会在可见回复送达后清除确认表情回应。

## 使用 MeowCaller 呼叫当前请求者（实验性）

插件可以在源自 WhatsApp 的智能体轮次中公开 `whatsapp_call`。它使用 [MeowCaller](https://github.com/purpshell/meowcaller) 向当前已获授权的请求者发起 WhatsApp 语音通话，并在对方接听后播放 OpenClaw TTS 消息。该工具没有目标号码参数，因此提示词无法将呼叫重定向到其他号码。默认禁用。

<Warning>
MeowCaller 仍处于实验阶段，没有带标签的发行版，并且使用单独配对的 whatsmeow 已关联设备会话——它无法复用插件的 Baileys 凭据。配对会向同一个 WhatsApp 账户添加另一台已关联设备；请使用 OpenClaw 所用的身份进行扫描。个人号码/与自己聊天模式无法呼叫自身；请使用专用 OpenClaw 号码呼叫你的个人号码。
</Warning>

<Steps>
  <Step title="启用实验性呼叫">

    将 `actions.calls: true` 添加到 WhatsApp 渠道配置，然后重启 Gateway 网关：

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    当该配置缺失或为 `false` 时，OpenClaw 不会公开 `whatsapp_call` 工具。

  </Step>

  <Step title="安装已审核的 MeowCaller CLI">

    适配器要求 Gateway 网关主机的 `PATH` 中存在 `meowcaller` 可执行文件。在 [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) 合并之前，请构建已审核的分支：

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    确保 `$HOME/.local/bin` 位于 Gateway 网关服务的 `PATH` 中。此修订版提供显式的 `pair` 和仅发送的 `notify` 命令；`notify` 不会打开麦克风、扬声器、视频设备或诊断捕获功能。不要改用上游示例 CLI 的 `play` 命令。

  </Step>

  <Step title="配对 MeowCaller 已关联设备">

    要求 WhatsApp 智能体检查呼叫设置（`whatsapp_call` 状态操作会报告账户专用状态目录和配对命令）。对于默认账户：

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    以交互方式运行此命令，从 **WhatsApp > Linked devices** 扫描二维码，并等待出现 `MeowCaller linked device ready`。请妥善保管 `wa-voip.db`，不要泄露——它是 MeowCaller 会话。非默认账户会从状态操作获得各自的存储路径；在 Windows 上，请运行其 PowerShell 命令。

  </Step>

  <Step title="配置 TTS 并从 WhatsApp 发起呼叫">

    配置支持电话通话的 [TTS 提供商](/zh-CN/tools/tts)，重启 Gateway 网关，然后发送类似 `呼叫我并说构建已完成。` 的请求。该工具从可信入站上下文中解析发送者，合成临时私有 WAV 文件，在限定的呼叫时间窗口内运行 MeowCaller，并在之后删除音频文件。OpenClaw 会显式传递账户的存储路径，等待接听/播放/挂断后返回零退出状态，并将超时或非零退出视为工具调用失败。

  </Step>
</Steps>

限制：仅支持一对一出站音频呼叫、不支持任意目标号码、不与聊天连接共享身份验证、个人号码/与自己聊天模式下不支持呼叫自身、合成音频最长为 60 秒、除 MeowCaller 完成接听/播放/挂断外不提供手机端可听性回执，并且 OpenClaw 会在限定的 115–175 秒窗口后停止配套进程（该窗口涵盖 MeowCaller 的连接、接听、播放和关闭阶段）。

## 审批提示

WhatsApp 可以将 Exec 和插件审批提示呈现为 `👍`/`👎` 表情回应，由顶层审批转发配置控制：

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

`approvals.exec` 和 `approvals.plugin` 相互独立；将 WhatsApp 启用为渠道只会关联传输，除非启用匹配的审批类别并将其路由到该渠道，否则不会发送任何内容。会话模式仅为源自 WhatsApp 的审批发送原生表情符号审批。目标模式使用共享转发管道向显式目标发送，不会另外向审批者私信进行扇出。

WhatsApp 审批表情回应要求在 `allowFrom` 中显式列出审批者（或使用 `"*"`）。`defaultTo` 设置普通消息的默认目标，而不是审批者列表。手动 `/approve` 命令仍会在解析审批之前经过常规 WhatsApp 发送者授权流程。

## 插件钩子和隐私

入站 WhatsApp 消息可能包含个人内容、电话号码、群组标识符、发送者姓名和会话关联字段。除非你选择启用，否则 WhatsApp 不会向插件广播入站 `message_received` 钩子载荷：

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

可在 `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived` 下将选择启用范围限定为单个账户。仅对你信任其处理入站 WhatsApp 内容和标识符的插件启用此功能。

## 访问控制和激活

<Tabs>
  <Tab title="私信策略">
    `channels.whatsapp.dmPolicy`：

    | 值 | 行为 |
    | --- | --- |
    | `pairing`（默认） | 未知发送者请求配对；所有者批准 |
    | `allowlist` | 仅允许 `allowFrom` 中的发送者 |
    | `open` | 要求 `allowFrom` 包含 `"*"` |
    | `disabled` | 阻止所有私信 |

    `allowFrom` 接受 E.164 格式的号码（内部会进行规范化）。它只是私信发送者访问控制列表——不会限制向群组 JID 或 `@newsletter` 渠道 JID 进行的显式出站发送。

    多账户覆盖：对于相应账户，`channels.whatsapp.accounts.<id>.dmPolicy`（以及 `.allowFrom`）优先于渠道级默认值。

    运行时说明：

    - 配对信息会持久保存在渠道允许列表存储中，并与配置的 `allowFrom` 合并
    - 定时自动化和 Heartbeat 接收方回退使用显式投递目标或配置的 `allowFrom`；私信配对批准不会隐式成为 cron/Heartbeat 接收方
    - 如果未配置允许列表，则默认允许已关联的本人号码
    - OpenClaw 绝不会自动配对出站 `fromMe` 私信（即你从已关联设备发送给自己的消息）

  </Tab>

  <Tab title="群组策略和允许列表">
    群组访问控制分为两层：

    1. **群组成员资格允许列表**（`channels.whatsapp.groups`）：如果省略 `groups`，则所有群组都符合条件；如果存在，则作为群组允许列表（`"*"` 允许所有群组）。
    2. **群组发送者策略**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）：`open` 绕过发送者允许列表，`allowlist` 要求匹配 `groupAllowFrom`（或 `*`），`disabled` 阻止所有群组入站消息。

    如果未设置 `groupAllowFrom`，且 `allowFrom` 包含条目，则发送者检查会回退到 `allowFrom`。发送者允许列表会在提及/回复激活之前进行评估。

    如果完全不存在 `channels.whatsapp` 配置块，即使 `channels.defaults.groupPolicy` 设置为其他值，运行时也会回退到 `groupPolicy: "allowlist"`（并记录警告日志）。

    <Note>
    群组成员资格解析提供单账号安全机制：如果只配置了一个 WhatsApp 账号，且其 `accounts.<id>.groups` 是显式空对象（`{}`），则会将其视为“未设置”，并回退到根级 `channels.whatsapp.groups` 映射，而不是静默阻止所有群组。配置 2 个或更多账号时，显式的账号空映射将保持为空且不会回退——这样，一个账号可以有意禁用所有群组，而不影响其他同级账号。
    </Note>

  </Tab>

  <Tab title="提及和 /activation">
    默认情况下，群组回复需要提及。提及检测包括：

    - 对机器人身份的显式 WhatsApp 提及
    - 配置的提及正则表达式模式（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）
    - 已获授权的群组消息中的入站语音留言转录文本
    - 隐式的回复机器人检测（回复对象的发送者与机器人身份匹配）

    安全性：引用/回复只能满足提及门控——它**不会**授予发送者权限。使用 `groupPolicy: "allowlist"` 时，不在允许列表中的发送者即使回复允许列表中用户的消息，仍会被阻止。

    会话级激活命令：`/activation mention` 或 `/activation always`。这会更新会话状态（而非全局配置），并且仅所有者可执行。

  </Tab>
</Tabs>

## 配置的 ACP 绑定

WhatsApp 通过顶层 `bindings[]` 支持持久 ACP 绑定：

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

直接聊天匹配 E.164 号码；群组匹配 WhatsApp 群组 JID。在 OpenClaw 确保绑定的 ACP 会话存在之前，会先执行群组允许列表、发送者策略和提及/激活门控。匹配的绑定拥有该路由——广播群组不会将该轮次分发到普通 WhatsApp 会话。

## 个人号码和自聊行为

当已关联的本人号码也存在于 `allowFrom` 中时，会启用自聊保护措施：跳过自聊轮次的已读回执，忽略可能会提及你自己的提及 JID 自动触发行为；当未设置 `messages.responsePrefix` 时，默认使用 `[{identity.name}]`（或 `[openclaw]`）作为回复前缀。

## 消息规范化和上下文

<AccordionGroup>
  <Accordion title="入站封装和回复上下文">
    传入消息会封装在共享入站信封中。引用回复会按以下形式附加上下文：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    在可用时，会填充回复元数据（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、发送者 JID/E.164）。如果引用目标是可下载的媒体，OpenClaw 会通过常规入站媒体存储保存它，并公开 `MediaPath`/`MediaType`，以便智能体直接检查，而不是只能看到 `<media:image>`。

  </Accordion>

  <Accordion title="媒体占位符和位置/联系人提取">
    仅含媒体的消息会规范化为占位符：`<media:image>`、`<media:video>`、`<media:audio>`、`<media:document>`、`<media:sticker>`。

    当消息正文只有 `<media:audio>` 时，已获授权的群组语音留言会在提及门控前进行转录，因此在语音留言中说出对机器人的提及即可触发回复。如果转录文本仍未提及机器人，它会保留在待处理群组历史记录中，而不是保留原始占位符。

    位置消息正文会呈现为简洁的坐标文本。位置标签/评论以及联系人/vCard 详情会呈现为围栏包裹的不受信任元数据，而不是内联提示文本。

  </Accordion>

  <Accordion title="待处理群组历史记录注入">
    未处理的群组消息会被缓冲，并在机器人最终被触发时作为上下文注入。

    - 默认限制：`50`
    - 配置：`channels.whatsapp.historyLimit`，回退到 `messages.groupChat.historyLimit`
    - `0` 表示禁用

    注入标记：`[Chat messages since your last reply - for context]` 和 `[Current message - respond to this]`。

  </Accordion>

  <Accordion title="已读回执">
    默认对已接受的入站消息启用。全局禁用方式：

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    单账号覆盖：`channels.whatsapp.accounts.<id>.sendReadReceipts`。即使全局启用，自聊轮次也会跳过已读回执。

  </Accordion>
</AccordionGroup>

## 投递、分块和媒体

<AccordionGroup>
  <Accordion title="文本分块">
    - 默认分块限制：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`；`newline` 优先按段落边界（空行）分块，然后回退到长度安全的分块方式

  </Accordion>

  <Accordion title="出站媒体行为">
    - 支持图像、视频、音频（PTT 语音留言）和文档载荷
    - 音频以 Baileys `audio` 载荷并设置 `ptt: true` 发送，呈现为按键讲话语音留言；回复载荷会保留 `audioAsVoice`，因此无论提供商的源格式如何，TTS 语音留言输出都会继续使用此路径
    - 原生 Ogg/Opus 音频以 `audio/ogg; codecs=opus` 发送；其他任何格式（包括 Microsoft Edge TTS 的 MP3/WebM 输出）都会先通过 `ffmpeg` 转码为 48 kHz 单声道 Ogg/Opus，再进行 PTT 投递
    - `/tts latest` 将最新的助手回复作为一条语音留言发送，并阻止同一回复被重复发送；`/tts chat on|off|default` 控制当前聊天的自动 TTS
    - 在视频发送中设置 `gifPlayback: true` 可启用 GIF 动画播放
    - `forceDocument`/`asDocument` 会通过 Baileys 文档载荷路由出站图像、GIF 和视频，以避免 WhatsApp 的媒体压缩，并保留解析后的文件名和 MIME 类型
    - 多媒体回复中的说明文字会应用于第一个媒体项，但 PTT 语音留言除外：音频会先发送且不带说明文字，随后说明文字会作为单独的文本消息发送（WhatsApp 客户端无法一致地呈现语音留言说明文字）
    - 媒体来源可以是 HTTP(S)、`file://` 或本地路径

  </Accordion>

  <Accordion title="媒体大小限制和回退行为">
    - 入站保存上限和出站发送上限：`channels.whatsapp.mediaMaxMb`（默认值为 `50`）
    - 单账号覆盖：`channels.whatsapp.accounts.<id>.mediaMaxMb`
    - 除非 `forceDocument`/`asDocument` 请求以文档形式投递，否则图像会自动优化（调整尺寸/遍历质量级别）以满足限制
    - 媒体发送失败时，第一个媒体项的回退机制会发送文本警告，而不是静默丢弃回复

  </Accordion>
</AccordionGroup>

## 回复引用

`channels.whatsapp.replyToMode` 控制原生回复引用（出站回复会明显引用入站消息）：

| 值                | 行为                                             |
| ----------------- | ------------------------------------------------ |
| `"off"`（默认）   | 从不引用；作为普通消息发送                       |
| `"first"`         | 仅引用第一个出站回复分块                         |
| `"all"`           | 引用每个出站回复分块                             |
| `"batched"`       | 引用已排队的批量回复；即时回复不引用             |

单账号覆盖：`channels.whatsapp.accounts.<id>.replyToMode`。

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## 表情回应级别

`channels.whatsapp.reactionLevel` 控制智能体使用表情回应的范围：

| 级别                  | 确认表情回应 | 智能体主动发起的表情回应 |
| --------------------- | ------------ | ------------------------ |
| `"off"`               | 否           | 否                       |
| `"ack"`               | 是           | 否                       |
| `"minimal"`（默认）   | 是           | 是，遵循保守指引         |
| `"extensive"`         | 是           | 是，遵循鼓励使用的指引   |

单账号覆盖：`channels.whatsapp.accounts.<id>.reactionLevel`。

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## 确认表情回应

`channels.whatsapp.ackReaction` 会在收到入站消息时立即发送表情回应，并受 `reactionLevel` 控制（设为 `"off"` 时禁用）：

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

说明：入站消息被接受后立即发送（回复前）；如果存在 `ackReaction` 但没有 `emoji`，WhatsApp 会使用被路由智能体的身份表情符号，并回退到“👀”（省略 `ackReaction` 或设置 `emoji: ""` 可不发送确认表情回应）；失败会记录到日志中，但不会阻止回复投递；群组模式 `mentions` 仅在由提及触发的轮次中发送表情回应，而群组激活模式 `always` 会绕过该检查；WhatsApp 仅使用 `channels.whatsapp.ackReaction`（旧版 `messages.ackReaction` 在此处不适用）。

## 生命周期状态表情回应

设置 `messages.statusReactions.enabled: true`，即可让 WhatsApp 在轮次期间替换确认表情回应，而不是保留静态的接收表情符号；状态会依次涵盖排队、思考、工具活动、压缩、完成和错误等：

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

说明：`channels.whatsapp.ackReaction` 仍控制直接消息和群组是否符合使用条件；排队状态使用与普通确认表情回应相同的有效表情符号；WhatsApp 对每条消息只提供一个机器人表情回应槽位，因此生命周期更新会原位替换当前表情回应；`messages.removeAckAfterReply: true` 会在配置的完成/错误保留时间结束后清除最终状态表情回应；工具表情符号类别包括 `tool`、`coding`、`web`、`deploy`、`build` 和 `concierge`。

## 多账号和凭据

<AccordionGroup>
  <Accordion title="账号选择和默认值">
    账号 ID 来自 `channels.whatsapp.accounts`。如果存在 `default`，则选择它作为默认账号；否则选择按字母顺序排序后的第一个已配置账号 ID。账号 ID 会在内部规范化后用于查找。
  </Accordion>

  <Accordion title="凭据路径和旧版兼容性">
    - 当前身份验证路径：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（备份：`creds.json.bak`）
    - 仍会识别 `~/.openclaw/credentials/` 中的旧版默认身份验证数据，并在默认账户流程中迁移

  </Accordion>

  <Accordion title="退出登录行为">
    `openclaw channels logout --channel whatsapp [--account <id>]` 会清除该账户的 WhatsApp 身份验证状态。当 Gateway 网关可访问时，退出登录会先停止该账户的实时监听器，因此已关联的会话会在下次重启前停止接收消息。`openclaw channels remove --channel whatsapp` 也会在禁用或删除账户配置前停止实时监听器。

    在旧版身份验证目录中，删除 Baileys 身份验证文件时会保留 `oauth.json`。

  </Accordion>
</AccordionGroup>

## 工具、操作和配置写入

- Agent 工具支持包括 WhatsApp 表情回应操作（`react`）。
- 操作开关：`channels.whatsapp.actions.reactions`、`channels.whatsapp.actions.polls`（现有操作默认为 `true`）、`channels.whatsapp.actions.calls`（默认为 `false`，参见上文的 MeowCaller）。
- 默认启用由渠道发起的配置写入；可通过 `channels.whatsapp.configWrites: false` 禁用。

## 故障排查

<AccordionGroup>
  <Accordion title="未关联（需要二维码）">
    症状：渠道状态报告未关联。

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="已关联但断开连接／陷入重新连接循环">
    症状：已关联的账户反复断开连接或尝试重新连接。

    即使超过正常消息超时时间，不活跃的账户也可以保持连接；仅当 WhatsApp Web 传输活动停止、套接字关闭，或应用级活动的静默时间超过较长的安全窗口时，监视器才会重启（参见上文的运行时模型）。

    如果日志反复显示 `status=408 Request Time-out Connection was lost`，请调整 `web.whatsapp` 下的 Baileys 套接字时序。首先将 `keepAliveIntervalMs` 缩短到低于网络的空闲超时时间；对于速度较慢或丢包的连接，则增大 `connectTimeoutMs`：

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

    如果修复主机连接和时序后循环仍然存在，请备份账户身份验证目录，然后重新关联：

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    如果 `~/.openclaw/logs/whatsapp-health.log` 显示 `Gateway inactive`，但 `openclaw gateway status` 和 `openclaw channels status --probe` 都显示健康，请运行 `openclaw doctor`。在 Linux 上，Doctor 会针对调用已停用的 `~/.openclaw/bin/ensure-whatsapp.sh` 脚本的旧版 crontab 条目发出警告；请使用 `crontab -e` 删除这些条目——cron 可能缺少 systemd 用户总线环境，导致该旧脚本错误报告 Gateway 网关健康状况。

  </Accordion>

  <Accordion title="通过代理进行二维码登录时超时">
    症状：`openclaw channels login --channel whatsapp` 在显示可用二维码之前失败，并出现 `status=408 Request Time-out` 或 TLS 套接字断开连接。

    WhatsApp Web 登录使用 Gateway 网关主机的标准代理环境（`HTTPS_PROXY`、`HTTP_PROXY`、对应的小写变体和 `NO_PROXY`）。请确认 Gateway 网关进程继承了代理环境，并且 `NO_PROXY` 不匹配 `mmg.whatsapp.net`。

  </Accordion>

  <Accordion title="发送时没有活动监听器">
    如果目标账户不存在活动的 Gateway 网关监听器，出站发送会快速失败。请确认 Gateway 网关正在运行且账户已关联。
  </Accordion>

  <Accordion title="回复出现在记录中，但未出现在 WhatsApp 中">
    记录行保存智能体生成的内容；WhatsApp 投递情况会单独检查。只有在至少一次用户可见的文本或媒体发送中，Baileys 返回出站消息 ID 后，OpenClaw 才会将自动回复视为已发送。

    确认表情回应是回复前的独立回执——表情回应成功并不能证明后续文本／媒体回复已被接受。请检查 Gateway 网关日志中是否出现 `auto-reply delivery failed` 或 `auto-reply was not accepted by WhatsApp provider`。

  </Accordion>

  <Accordion title="群组消息意外被忽略">
    请按以下顺序检查：`groupPolicy`、`groupAllowFrom`/`allowFrom`、`groups` 允许列表条目、提及限制（`requireMention` + 提及模式），以及 `openclaw.json` 中的重复键（JSON5 中后面的条目会覆盖前面的条目——每个作用域仅保留一个 `groupPolicy`）。

    如果存在 `channels.whatsapp.groups`，WhatsApp 仍可观察到其他群组的消息，但 OpenClaw 会在会话路由之前将其丢弃。请将群组 JID 添加到 `channels.whatsapp.groups`，或添加 `groups["*"]` 以允许所有群组，同时继续通过 `groupPolicy`/`groupAllowFrom` 控制发送者授权。

  </Accordion>

  <Accordion title="Bun 运行时警告">
    WhatsApp Gateway 网关运行时应使用 Node。Bun 被标记为不兼容，不适合稳定运行 WhatsApp/Telegram Gateway 网关。
  </Accordion>
</AccordionGroup>

## 系统提示词

WhatsApp 通过 `groups` 和 `direct` 映射，为群组和直接聊天提供 Telegram 风格的系统提示词支持。

群组消息的解析方式：首先确定生效的 `groups` 映射——只要账户定义了自己的 `groups` 键，它就会完全替换根级 `groups` 映射（不会深度合并）。随后仅在最终得到的这一个映射中查找提示词：

1. **群组专属提示词**（`groups["<groupId>"].systemPrompt`）：当群组条目存在，**并且**其 `systemPrompt` 键已定义时使用。空字符串（`""`）会抑制通配符，且不应用任何提示词。
2. **群组通配符提示词**（`groups["*"].systemPrompt`）：当特定群组条目不存在，或该条目存在但没有 `systemPrompt` 键时使用。

私信的解析方式完全相同，但针对的是 `direct` 映射和 `direct["*"]`。

<Note>
`dms` 仍是轻量的每私信历史记录覆盖项（`dms.<id>.historyLimit`）。提示词覆盖项位于 `direct` 下。
</Note>

<Note>
这种在提示词解析中由账户配置替换根级配置的行为属于普通的浅层覆盖：任何账户级 `groups`/`direct` 键（包括显式的空对象）都会替换根级映射。它与上文所述的群组成员允许列表检查不同；对于意外设置为空的 `groups: {}`，后者在单账户场景下具有安全保护机制。
</Note>

**与 Telegram 的区别：**在多账户设置中，Telegram 会对每个账户抑制根级 `groups`（即使账户本身未定义 `groups`），以防止 Bot 接收其并未加入的群组的消息。WhatsApp 不应用此保护——无论账户数量多少，任何未定义自身覆盖项的账户都会继承根级 `groups`/`direct`。在多账户 WhatsApp 设置中，如果你需要按账户设置提示词，请在每个账户下显式定义完整映射。

重要行为：

- `channels.whatsapp.groups` 既是每群组配置映射，也是聊天级群组允许列表。无论位于根级还是账户作用域，`groups["*"]` 都表示该作用域“允许所有群组”。
- 仅当你已希望该作用域允许所有群组时，才添加通配符 `systemPrompt`。如果只允许一组固定的群组 ID，请在每个显式列入允许列表的条目上重复设置提示词，而不要使用 `groups["*"]`。
- 群组准入和发送者授权是两项独立检查。`groups["*"]` 会扩大可进入群组处理流程的群组范围；它不会授权这些群组中的所有发送者——发送者授权仍由 `groupPolicy`/`groupAllowFrom` 控制。
- `channels.whatsapp.direct` 对私信没有类似的副作用：`direct["*"]` 仅在私信已根据 `dmPolicy` 加 `allowFrom` 或配对存储规则获得准入后，提供默认配置。

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

主要参考：[Configuration reference - WhatsApp](/zh-CN/gateway/config-channels#whatsapp)

| 范畴             | 字段                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| 访问控制         | `dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`                                             |
| 投递             | `textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`                |
| 多账户           | `accounts.<id>.enabled`、`accounts.<id>.authDir` 以及其他每账户覆盖项                                          |
| 运维操作         | `configWrites`、`debounceMs`、`web.enabled`、`web.heartbeatSeconds`、`web.reconnect.*`、`web.whatsapp.*`       |
| 会话行为         | `session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`                                   |
| 提示词           | `groups.<id>.systemPrompt`、`groups["*"].systemPrompt`、`direct.<id>.systemPrompt`、`direct["*"].systemPrompt` |

## 相关内容

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [安全性](/zh-CN/gateway/security)
- [渠道路由](/zh-CN/channels/channel-routing)
- [多智能体路由](/zh-CN/concepts/multi-agent)
- [故障排查](/zh-CN/channels/troubleshooting)
