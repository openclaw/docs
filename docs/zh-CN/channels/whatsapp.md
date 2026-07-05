---
read_when:
    - 处理 WhatsApp/网页渠道行为或收件箱路由
summary: WhatsApp 渠道支持、访问控制、投递行为和运维
title: WhatsApp
x-i18n:
    generated_at: "2026-07-05T11:04:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d006b750f387fac1ec0605d112fb2f753d0fc14354aa671cba300eac1fd5b3b
    source_path: channels/whatsapp.md
    workflow: 16
---

状态：通过 WhatsApp Web（Baileys）达到生产就绪。Gateway 网关拥有已链接的会话；不存在单独的 Twilio WhatsApp 渠道。

## 安装

`openclaw onboard` 和 `openclaw channels add --channel whatsapp` 会在你首次选择该插件时提示安装；如果插件缺失，`openclaw channels login --channel whatsapp` 也会提供相同的安装流程。开发检出使用本地插件路径；stable/beta 会先从 ClawHub 安装 `@openclaw/whatsapp`，失败时回退到 npm。WhatsApp 运行时在核心 OpenClaw npm 包之外发布，因此它的运行时依赖会保留在外部插件中。手动安装：

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

仅在注册表回退时使用裸 npm 包（`@openclaw/whatsapp`）；只有在需要可复现安装时才固定精确版本。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    对未知发送者的默认私信策略是配对。
  </Card>
  <Card title="渠道故障排查" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断和修复手册。
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

  <Step title="链接 WhatsApp（二维码）">

```bash
openclaw channels login --channel whatsapp
```

    登录仅支持二维码。在远程或无头主机上，开始登录前请准备一条可靠路径，将实时二维码传递到手机；终端渲染的二维码、截图或聊天附件都可能在传输途中过期。

    对于特定账号：

```bash
openclaw channels login --channel whatsapp --account work
```

    要在登录前附加现有/自定义凭证目录：

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

  <Step title="批准第一个配对请求（配对模式）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    配对请求会在 1 小时后过期；每个账号最多保留 3 个待处理请求。

  </Step>
</Steps>

<Note>
建议使用单独的 WhatsApp 号码（设置和元数据针对此场景优化），但也完全支持个人号码/自聊设置。
</Note>

## 部署模式

<AccordionGroup>
  <Accordion title="专用号码（推荐）">
    - 为 OpenClaw 使用单独的 WhatsApp 身份
    - 更清晰的私信允许列表和路由边界
    - 更低的自聊混淆概率

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

  <Accordion title="个人号码回退">
    新手引导支持个人号码模式，并写入适合自聊的基线：`dmPolicy: "allowlist"`、包含你自己号码的 `allowFrom`、`selfChatMode: true`。运行时自聊保护基于已链接的自身号码和 `allowFrom`。
  </Accordion>
</AccordionGroup>

## 运行时模型

- Gateway 网关拥有 WhatsApp socket 和重连循环。
- 看门狗会独立跟踪两个信号：原始 WhatsApp Web 传输活动和应用消息活动。安静但已连接的会话不会仅因为最近没有消息到达而重启；只有在传输帧在固定内部窗口（不可由用户配置）内停止到达，或应用消息静默超过正常消息超时的 4 倍时，才会强制重连。对于最近活跃的会话，刚重连后的第一个窗口会使用较短的正常消息超时，而不是 4 倍窗口。
- Baileys socket 计时在 `web.whatsapp.*` 下显式配置：`keepAliveIntervalMs`（应用 ping 间隔）、`connectTimeoutMs`（打开握手超时）、`defaultQueryTimeoutMs`（Baileys 查询等待，加上 OpenClaw 的出站发送/在线状态和入站已读回执超时）。
- 出站发送要求目标账号有活跃的 WhatsApp 监听器；否则会快速失败。
- 当 `@+<digits>` 和 `@<digits>` token（在文本和媒体说明中）匹配当前参与者元数据时，群组发送会附加原生提及元数据，包括基于 LID 的群组。
- 状态和广播聊天（`@status`、`@broadcast`）会被忽略。
- 直接聊天使用私信会话规则（`session.dmScope`；默认 `main` 会把私信合并到智能体主会话）。群组会话按 JID 隔离（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Channels/Newsletters 可以通过其原生 `@newsletter` JID 作为显式出站目标，使用频道会话元数据（`agent:<agentId>:whatsapp:channel:<jid>`），而不是私信语义。
- WhatsApp Web 传输会遵循 Gateway 网关主机上的标准代理环境变量（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY`、小写变体）。优先使用主机级代理配置，而不是逐渠道设置。
- 启用 `messages.removeAckAfterReply` 后，OpenClaw 会在可见回复送达后清除确认表情回应。

## 使用 MeowCaller 呼叫当前请求者（实验性）

该插件可以在源自 WhatsApp 的智能体轮次中暴露 `whatsapp_call`。它使用 [MeowCaller](https://github.com/purpshell/meowcaller) 向当前已授权请求者发起 WhatsApp 语音通话，并在对方接听后播放 OpenClaw TTS 消息。该工具没有目标号码参数，因此提示词无法重定向呼叫。默认禁用。

<Warning>
MeowCaller 是实验性的，没有带标签的发布版本，并且使用单独配对的 whatsmeow 已链接设备会话，不能复用插件的 Baileys 凭证。配对会向同一个 WhatsApp 账号添加另一个已链接设备；请使用 OpenClaw 使用的身份扫描。个人号码/自聊模式无法呼叫自身；请使用专用 OpenClaw 号码呼叫你的个人号码。
</Warning>

<Steps>
  <Step title="启用实验性呼叫">

    将 `actions.calls: true` 添加到 WhatsApp 渠道配置并重启 Gateway 网关：

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

    缺失或为 `false` 时，OpenClaw 不会暴露 `whatsapp_call` 工具。

  </Step>

  <Step title="安装已审核的 MeowCaller CLI">

    适配器期望 Gateway 网关主机的 `PATH` 上存在 `meowcaller` 可执行文件。在 [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) 合并前，请构建已审核的分支：

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    确保 `$HOME/.local/bin` 位于 Gateway 网关服务的 `PATH` 中。此修订版包含显式的 `pair` 和仅发送的 `notify` 命令；`notify` 不会打开麦克风、扬声器、视频设备或诊断采集。不要替换为上游示例 CLI 的 `play` 命令。

  </Step>

  <Step title="配对 MeowCaller 已链接设备">

    让 WhatsApp 智能体检查呼叫设置（`whatsapp_call` 状态动作会报告账号特定的状态目录和配对命令）。对于默认账号：

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    以交互方式运行此命令，从 **WhatsApp > Linked devices** 扫描二维码，并等待 `MeowCaller linked device ready`。请将 `wa-voip.db` 保持私密，它是 MeowCaller 会话。非默认账号会从状态动作获取自己的存储路径；在 Windows 上，运行其 PowerShell 命令。

  </Step>

  <Step title="配置 TTS 并从 WhatsApp 呼叫">

    配置支持电话场景的 [TTS 提供商](/zh-CN/tools/tts)，重启 Gateway 网关，然后发送类似 `Call me and say the build finished.` 的请求。该工具会从可信入站上下文解析发送者，合成一个临时私有 WAV 文件，在有界呼叫窗口内运行 MeowCaller，并在之后删除音频文件。OpenClaw 会显式传递账号的存储，等待接听/播放/挂断后的零退出状态，并将超时或非零退出视为工具调用失败。

  </Step>
</Steps>

限制：仅支持一对一出站音频呼叫，不支持任意目标号码，不与聊天连接共享凭证，个人号码/自聊模式不能自呼叫，合成音频最长 60 秒，除 MeowCaller 的接听/播放/挂断完成外，没有手机端可听性回执，并且 OpenClaw 会在有界的 115-175 秒窗口后停止配套进程（覆盖 MeowCaller 的连接、接听、播放和关闭阶段）。

## 审批提示

WhatsApp 可以将 Exec 和插件审批提示渲染为 `👍`/`👎` 表情回应，由顶层审批转发配置控制：

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

`approvals.exec` 和 `approvals.plugin` 相互独立；将 WhatsApp 启用为渠道只会链接传输，除非匹配的审批类别已启用并路由到那里，否则不会发送任何内容。会话模式仅对源自 WhatsApp 的审批发送原生 emoji 审批。目标模式会对显式目标使用共享转发管线，不会创建单独的审批者私信扇出。

WhatsApp 审批表情回应要求在 `allowFrom`（或 `"*"`）中显式配置审批者。`defaultTo` 设置普通默认消息目标，而不是审批者列表。手动 `/approve` 命令在审批解析前仍会经过普通的 WhatsApp 发送者授权路径。

## 插件钩子和隐私

入站 WhatsApp 消息可能携带个人内容、电话号码、群组标识符、发送者姓名和会话关联字段。除非你选择加入，否则 WhatsApp 不会向插件广播入站 `message_received` 钩子载荷：

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

将选择加入限定到 `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived` 下的单个账号。仅为你信任其处理入站 WhatsApp 内容和标识符的插件启用此项。

## 访问控制和激活

<Tabs>
  <Tab title="私信策略">
    `channels.whatsapp.dmPolicy`：

    | 值 | 行为 |
    | --- | --- |
    | `pairing`（默认） | 未知发送者请求配对；所有者批准 |
    | `allowlist` | 仅允许 `allowFrom` 发送者进入 |
    | `open` | 要求 `allowFrom` 包含 `"*"` |
    | `disabled` | 阻止所有私信 |

    `allowFrom` 接受 E.164 风格号码（内部会规范化）。它只是私信发送者访问控制列表，不会限制向群组 JID 或 `@newsletter` channel JID 的显式出站发送。

    多账号覆盖：`channels.whatsapp.accounts.<id>.dmPolicy`（以及 `.allowFrom`）优先于该账号的渠道级默认值。

    运行时说明：

    - 配对会持久保存在渠道允许存储中，并与配置的 `allowFrom` 合并
    - 定时自动化和 Heartbeat 接收者回退使用显式投递目标或配置的 `allowFrom`；私信配对批准不会隐式成为 cron/Heartbeat 接收者
    - 如果未配置允许列表，默认允许已链接的自身号码
    - OpenClaw 绝不会自动配对出站 `fromMe` 私信（你从已链接设备发送给自己的消息）

  </Tab>

  <Tab title="群组策略和允许列表">
    群组访问有两层：

    1. **群组成员允许列表** (`channels.whatsapp.groups`)：如果省略 `groups`，则所有群组都符合条件；如果存在，它会作为群组允许列表（`"*"` 允许全部）。
    2. **群组发送者策略** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)：`open` 会绕过发送者允许列表，`allowlist` 要求匹配 `groupAllowFrom`（或 `*`），`disabled` 会阻止所有群组入站消息。

    如果未设置 `groupAllowFrom`，发送者检查会在 `allowFrom` 有条目时回退到 `allowFrom`。发送者允许列表会在提及/回复激活之前评估。

    如果完全不存在 `channels.whatsapp` 块，运行时会回退到 `groupPolicy: "allowlist"`（并记录警告日志），即使 `channels.defaults.groupPolicy` 设置为其他值也是如此。

    <Note>
    群组成员解析有一个单账号安全网：如果只配置了一个 WhatsApp 账号，并且它的 `accounts.<id>.groups` 是显式空对象（`{}`），它会被视为“未设置”，并回退到根级 `channels.whatsapp.groups` 映射，而不是静默阻止每个群组。配置了 2 个及以上账号时，显式空账号映射会保持为空且不会回退——这允许一个账号有意禁用所有群组，而不影响其他同级账号。
    </Note>

  </Tab>

  <Tab title="提及和 /activation">
    群组回复默认需要提及。提及检测包括：

    - 明确提及 Bot 身份的 WhatsApp 提及
    - 配置的提及正则表达式模式（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）
    - 已授权群组消息的入站语音备注转录
    - 隐式回复给 Bot 检测（回复发送者匹配 Bot 身份）

    安全：引用/回复只满足提及门控——它**不会**授予发送者授权。使用 `groupPolicy: "allowlist"` 时，未在允许列表中的发送者即使回复允许列表用户的消息，也仍会被阻止。

    会话级激活命令：`/activation mention` 或 `/activation always`。这会更新会话状态（不是全局配置），并受所有者门控。

  </Tab>
</Tabs>

## 已配置的 ACP 绑定

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

私聊匹配 E.164 号码；群组匹配 WhatsApp 群组 JID。群组允许列表、发送者策略和提及/激活门控会在 OpenClaw 确保绑定的 ACP 会话存在之前运行。匹配的绑定拥有该路由——广播群组不会将该轮次扇出到普通 WhatsApp 会话。

## 个人号码和自聊行为

当已关联的自身号码也存在于 `allowFrom` 中时，自聊保护会激活：跳过自聊轮次的已读回执，忽略会 ping 到你自己的提及 JID 自动触发行为，并在未设置 `messages.responsePrefix` 时默认回复到 `[{identity.name}]`（或 `[openclaw]`）。

## 消息规范化和上下文

<AccordionGroup>
  <Accordion title="入站信封和回复上下文">
    传入消息会包装在共享入站信封中。引用回复会按以下形式追加上下文：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    回复元数据（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、发送者 JID/E.164）会在可用时填充。如果被引用的目标是可下载媒体，OpenClaw 会通过常规入站媒体存储保存它，并暴露 `MediaPath`/`MediaType`，让智能体可以直接检查它，而不是只看到 `<media:image>`。

  </Accordion>

  <Accordion title="媒体占位符和位置/联系人提取">
    仅媒体消息会规范化为占位符：`<media:image>`、`<media:video>`、`<media:audio>`、`<media:document>`、`<media:sticker>`。

    当正文只有 `<media:audio>` 时，已授权群组语音备注会在提及门控前转录，因此在语音备注中说出 Bot 提及可以触发回复。如果转录仍未提及 Bot，它会保留在待处理群组历史中，而不是原始占位符。

    位置正文会渲染为简短的坐标文本。位置标签/评论和联系人/vCard 详情会渲染为带围栏的不受信任元数据，而不是内联提示文本。

  </Accordion>

  <Accordion title="待处理群组历史注入">
    未处理的群组消息会缓冲，并在 Bot 最终被触发时作为上下文注入。

    - 默认限制：`50`
    - 配置：`channels.whatsapp.historyLimit`，回退到 `messages.groupChat.historyLimit`
    - `0` 禁用

    注入标记：`[Chat messages since your last reply - for context]` 和 `[Current message - respond to this]`。

  </Accordion>

  <Accordion title="已读回执">
    对已接受的入站消息默认启用。全局禁用：

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    按账号覆盖：`channels.whatsapp.accounts.<id>.sendReadReceipts`。即使全局启用，自聊轮次也会跳过已读回执。

  </Accordion>
</AccordionGroup>

## 投递、分块和媒体

<AccordionGroup>
  <Accordion title="文本分块">
    - 默认分块限制：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`；`newline` 优先使用段落边界（空行），然后回退到长度安全分块

  </Accordion>

  <Accordion title="出站媒体行为">
    - 支持图片、视频、音频（PTT 语音备注）和文档载荷
    - 音频以带 `ptt: true` 的 Baileys `audio` 载荷发送，渲染为按住说话语音备注；`audioAsVoice` 会保留在回复载荷上，因此无论提供商的源格式如何，TTS 语音备注输出都会保持在这一路径上
    - 原生 Ogg/Opus 音频以 `audio/ogg; codecs=opus` 发送；其他任何格式（包括 Microsoft Edge TTS MP3/WebM 输出）都会先用 `ffmpeg` 转码为 48 kHz 单声道 Ogg/Opus，再进行 PTT 投递
    - `/tts latest` 会将最新助手回复作为一条语音备注发送，并抑制对同一回复的重复发送；`/tts chat on|off|default` 控制当前聊天的自动 TTS
    - 视频发送上的 `gifPlayback: true` 会启用动画 GIF 播放
    - `forceDocument`/`asDocument` 会通过 Baileys 文档载荷路由出站图片、GIF 和视频，以避免 WhatsApp 的媒体压缩，并保留解析后的文件名和 MIME 类型
    - 标题会应用到多媒体回复中的第一个媒体项，但 PTT 语音备注除外：音频会先无标题发送，然后标题作为单独的文本消息发送（WhatsApp 客户端对语音备注标题的渲染并不一致）
    - 媒体源可以是 HTTP(S)、`file://` 或本地路径

  </Accordion>

  <Accordion title="媒体大小限制和回退行为">
    - 入站保存上限和出站发送上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 按账号覆盖：`channels.whatsapp.accounts.<id>.mediaMaxMb`
    - 图片会自动优化（调整大小/质量扫描）以适配限制，除非 `forceDocument`/`asDocument` 请求文档投递
    - 媒体发送失败时，首项回退会发送文本警告，而不是静默丢弃响应

  </Accordion>
</AccordionGroup>

## 回复引用

`channels.whatsapp.replyToMode` 控制原生回复引用（出站回复会可见地引用入站消息）：

| 值                | 行为                                           |
| ----------------- | ---------------------------------------------- |
| `"off"`（默认）   | 从不引用；作为普通消息发送                     |
| `"first"`         | 仅引用第一个出站回复分块                       |
| `"all"`           | 引用每个出站回复分块                           |
| `"batched"`       | 引用排队的批处理回复；立即回复不引用           |

按账号覆盖：`channels.whatsapp.accounts.<id>.replyToMode`。

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## 表情回应级别

`channels.whatsapp.reactionLevel` 控制智能体使用表情回应的范围：

| 级别                  | 确认表情回应 | Agent 发起的表情回应 |
| --------------------- | ------------ | -------------------- |
| `"off"`               | 否           | 否                   |
| `"ack"`               | 是           | 否                   |
| `"minimal"`（默认）   | 是           | 是，保守指导         |
| `"extensive"`         | 是           | 是，鼓励指导         |

按账号覆盖：`channels.whatsapp.accounts.<id>.reactionLevel`。

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## 确认表情回应

`channels.whatsapp.ackReaction` 会在入站收到时立即发送表情回应，受 `reactionLevel` 门控（为 `"off"` 时会抑制）：

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

说明：入站被接受后立即发送（回复前）；如果存在不带 `emoji` 的 `ackReaction`，WhatsApp 会使用路由智能体的身份 emoji，并回退到 "👀"（省略 `ackReaction` 或设置 `emoji: ""` 表示无确认）；失败会记录日志，但不会阻止回复投递；群组模式 `mentions` 只在提及触发的轮次上回应，而群组激活 `always` 会绕过该检查；WhatsApp 只使用 `channels.whatsapp.ackReaction`（旧版 `messages.ackReaction` 不适用于此处）。

## 生命周期状态表情回应

设置 `messages.statusReactions.enabled: true`，让 WhatsApp 在轮次期间替换确认表情回应，而不是保留静态回执 emoji，在排队、思考、工具活动、压缩、完成和错误等状态之间循环：

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

说明：`channels.whatsapp.ackReaction` 仍控制私聊和群组的适用资格；排队状态使用与普通确认表情回应相同的有效 emoji；WhatsApp 每条消息只有一个 Bot 表情回应槽位，因此生命周期更新会就地替换当前表情回应；`messages.removeAckAfterReply: true` 会在配置的完成/错误保持时间后清除最终状态表情回应；工具 emoji 类别包括 `tool`、`coding`、`web`、`deploy`、`build` 和 `concierge`。

## 多账号和凭证

<AccordionGroup>
  <Accordion title="账号选择和默认值">
    账号 ID 来自 `channels.whatsapp.accounts`。默认账号选择为 `default`（如果存在），否则为第一个配置的账号 ID（按字母顺序排序）。账号 ID 会在内部规范化以便查找。
  </Accordion>

  <Accordion title="凭证路径和旧版兼容性">
    - 当前认证路径：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（备份：`creds.json.bak`）
    - `~/.openclaw/credentials/` 中的旧版默认认证仍会在默认账号流程中被识别/迁移

  </Accordion>

  <Accordion title="登出行为">
    `openclaw channels logout --channel whatsapp [--account <id>]` 会清除该账号的 WhatsApp 凭证状态。当 Gateway 网关可达时，登出会先停止该账号的实时监听器，因此关联会话会在下次重启前停止接收消息。`openclaw channels remove --channel whatsapp` 也会在禁用或删除账号配置前停止实时监听器。

    在旧版凭证目录中，`oauth.json` 会保留，而 Baileys 凭证文件会被移除。

  </Accordion>
</AccordionGroup>

## 工具、操作和配置写入

- 智能体工具支持包括 WhatsApp 表情回应操作（`react`）。
- 操作开关：`channels.whatsapp.actions.reactions`、`channels.whatsapp.actions.polls`（现有操作默认值为 `true`）、`channels.whatsapp.actions.calls`（默认值为 `false`，见上方 MeowCaller）。
- 渠道发起的配置写入默认启用；通过 `channels.whatsapp.configWrites: false` 禁用。

## 故障排查

<AccordionGroup>
  <Accordion title="未关联（需要 QR 码）">
    现象：渠道状态报告未关联。

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="已关联但已断开 / 重连循环">
    现象：已关联账号反复断开或尝试重连。

    安静账号可以在正常消息超时后继续保持连接；只有当 WhatsApp Web 传输活动停止、套接字关闭，或应用层活动在更长的安全窗口之后仍保持静默时，看门狗才会重启（见上方运行时模型）。

    如果日志显示反复出现 `status=408 Request Time-out Connection was lost`，请在 `web.whatsapp` 下调整 Baileys 套接字时序。先将 `keepAliveIntervalMs` 缩短到低于你的网络空闲超时时间，并在慢速或丢包链路上增大 `connectTimeoutMs`：

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

    如果主机连接和时序修复后循环仍然存在，请备份账号凭证目录并重新关联：

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    如果 `~/.openclaw/logs/whatsapp-health.log` 显示 `Gateway inactive`，但 `openclaw gateway status` 和 `openclaw channels status --probe` 都显示健康，请运行 `openclaw doctor`。在 Linux 上，Doctor 会警告旧版 crontab 条目正在调用已退役的 `~/.openclaw/bin/ensure-whatsapp.sh` 脚本；请用 `crontab -e` 移除这些条目 — cron 可能缺少 systemd 用户总线环境，并导致该旧脚本误报 Gateway 网关健康状态。

  </Accordion>

  <Accordion title="代理后面的 QR 登录超时">
    现象：`openclaw channels login --channel whatsapp` 在显示可用 QR 码之前失败，并出现 `status=408 Request Time-out` 或 TLS 套接字断开。

    WhatsApp Web 登录使用 Gateway 网关主机的标准代理环境（`HTTPS_PROXY`、`HTTP_PROXY`、小写变体、`NO_PROXY`）。确认 Gateway 网关进程继承了代理环境变量，并且 `NO_PROXY` 不匹配 `mmg.whatsapp.net`。

  </Accordion>

  <Accordion title="发送时没有活动监听器">
    当目标账号没有活动 Gateway 网关监听器时，出站发送会快速失败。确认 Gateway 网关正在运行且账号已关联。
  </Accordion>

  <Accordion title="回复出现在转录中，但未出现在 WhatsApp 中">
    转录行记录智能体生成的内容；WhatsApp 投递会单独检查。OpenClaw 只有在 Baileys 为至少一个可见文本或媒体发送返回出站消息 ID 后，才会将自动回复视为已发送。

    确认表情回应是独立的回复前回执 — 成功的表情回应并不能证明后续文本/媒体回复已被接受。检查 Gateway 网关日志中是否有 `auto-reply delivery failed` 或 `auto-reply was not accepted by WhatsApp provider`。

  </Accordion>

  <Accordion title="群组消息被意外忽略">
    按此顺序检查：`groupPolicy`、`groupAllowFrom`/`allowFrom`、`groups` 允许列表条目、提及开关（`requireMention` + 提及模式），以及 `openclaw.json` 中的重复键（JSON5 后面的条目会覆盖前面的条目 — 每个作用域只保留一个 `groupPolicy`）。

    如果存在 `channels.whatsapp.groups`，WhatsApp 仍然可以观察来自其他群组的消息，但 OpenClaw 会在会话路由前丢弃它们。将群组 JID 添加到 `channels.whatsapp.groups`，或添加 `groups["*"]` 以接纳所有群组，同时继续通过 `groupPolicy`/`groupAllowFrom` 管理发送者授权。

  </Accordion>

  <Accordion title="Bun 运行时警告">
    WhatsApp Gateway 网关运行时应使用 Node。Bun 被标记为不兼容稳定的 WhatsApp/Telegram Gateway 网关操作。
  </Accordion>
</AccordionGroup>

## 系统提示词

WhatsApp 支持通过 `groups` 和 `direct` 映射为群组和直接聊天设置 Telegram 风格的系统提示词。

群组消息的解析：首先确定有效的 `groups` 映射 — 如果账号定义了任何自己的 `groups` 键，它会完全替换根 `groups` 映射（不进行深度合并）。随后提示词查找会在这一个生成的映射上运行：

1. **群组专用提示词**（`groups["<groupId>"].systemPrompt`）：当群组条目存在**且**其 `systemPrompt` 键已定义时使用。空字符串（`""`）会抑制通配符，并且不应用任何提示词。
2. **群组通配提示词**（`groups["*"].systemPrompt`）：当特定群组条目不存在，或存在但没有 `systemPrompt` 键时使用。

直接消息的解析遵循相同模式，作用于 `direct` 映射和 `direct["*"]`。

<Note>
`dms` 仍然是轻量级的每私信历史覆盖桶（`dms.<id>.historyLimit`）。提示词覆盖位于 `direct` 下。
</Note>

<Note>
这种用于提示词解析的账号替换根行为是普通的浅层覆盖：任何账号级 `groups`/`direct` 键，包括显式空对象，都会替换根映射。它不同于上面描述的群组成员允许列表检查；后者为意外为空的 `groups: {}` 提供单账号安全网。
</Note>

**与 Telegram 的区别：** Telegram 会在多账号设置中为每个账号抑制根 `groups`（即使账号没有自己的 `groups`），以阻止机器人接收不属于它的群组消息。WhatsApp 不应用该保护 — 没有自有覆盖的任何账号都会继承根 `groups`/`direct`，无论账号数量如何。在多账号 WhatsApp 设置中，如果你想要按账号配置提示词，请在每个账号下显式定义完整映射。

重要行为：

- `channels.whatsapp.groups` 既是每群组配置映射，也是聊天级群组允许列表。在根或账号作用域中，`groups["*"]` 表示该作用域“接纳所有群组”。
- 只有当你已经希望该作用域接纳所有群组时，才添加通配符 `systemPrompt`。如果只想让一组固定群组 ID 符合条件，请在每个显式允许列表条目上重复该提示词，而不是使用 `groups["*"]`。
- 群组接纳和发送者授权是分开的检查。`groups["*"]` 会扩大哪些群组可以进入群组处理；它不会授权这些群组中的每个发送者 — 这仍由 `groupPolicy`/`groupAllowFrom` 控制。
- `channels.whatsapp.direct` 对私信没有等效副作用：`direct["*"]` 只会在私信已通过 `dmPolicy` 加 `allowFrom` 或配对存储规则接纳后，提供默认配置。

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

## 配置参考指针

主要参考：[Configuration reference - WhatsApp](/zh-CN/gateway/config-channels#whatsapp)

| 区域             | 字段                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| 访问             | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| 投递             | `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`                |
| 多账号           | `accounts.<id>.enabled`、`accounts.<id>.authDir` 和其他每账号覆盖                                             |
| 操作             | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| 会话行为         | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| 提示词           | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## 相关内容

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [安全](/zh-CN/gateway/security)
- [渠道路由](/zh-CN/channels/channel-routing)
- [多智能体路由](/zh-CN/concepts/multi-agent)
- [故障排查](/zh-CN/channels/troubleshooting)
