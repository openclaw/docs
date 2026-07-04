---
read_when:
    - 处理 WhatsApp/web 渠道行为或收件箱路由
summary: WhatsApp 渠道支持、访问控制、投递行为和运维
title: WhatsApp
x-i18n:
    generated_at: "2026-07-04T10:26:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a968c08c461708fb4b8cabe4528af2514b0a5768d272abab8f88e36e24bde302
    source_path: channels/whatsapp.md
    workflow: 16
---

状态：通过 WhatsApp Web（Baileys）达到生产就绪。Gateway 网关拥有已关联会话。

## 安装（按需）

- 新手引导（`openclaw onboard`）和 `openclaw channels add --channel whatsapp`
  会在你第一次选择 WhatsApp 插件时提示安装。
- 当插件尚不存在时，`openclaw channels login --channel whatsapp` 也会提供安装流程。
- 开发渠道 + git checkout：默认使用本地插件路径。
- Stable/Beta：优先从 ClawHub 安装官方 `@openclaw/whatsapp` 插件，
  npm 作为后备。
- WhatsApp 运行时分发在核心 OpenClaw npm 包之外，因此
  WhatsApp 专属运行时依赖会留在外部插件中。

仍可手动安装：

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

仅在需要注册表后备时使用裸 npm 包（`@openclaw/whatsapp`）。
仅在需要可复现安装时固定精确版本。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    默认私信策略是为未知发送者进行配对。
  </Card>
  <Card title="频道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨频道诊断和修复手册。
  </Card>
  <Card title="Gateway 网关配置" icon="settings" href="/zh-CN/gateway/configuration">
    完整频道配置模式和示例。
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

  <Step title="关联 WhatsApp（QR）">

```bash
openclaw channels login --channel whatsapp
```

    当前登录基于 QR。在远程或无头环境中，开始登录前，请确保你有可靠路径
    将实时 QR 码传递到将要扫描它的手机。

    对于特定账号：

```bash
openclaw channels login --channel whatsapp --account work
```

    如需在登录前附加现有/自定义 WhatsApp Web 凭证目录：

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

  <Step title="批准第一次配对请求（如果使用配对模式）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    配对请求会在 1 小时后过期。每个渠道最多保留 3 个待处理请求。

  </Step>
</Steps>

<Note>
OpenClaw 建议尽可能使用单独号码运行 WhatsApp。（渠道元数据和设置流程针对这种设置进行了优化，但也支持个人号码设置。）
</Note>

<Warning>
当前 WhatsApp 设置流程仅支持 QR。终端渲染的 QR、截图、
PDF 或聊天附件在从远程机器转发时可能会过期或变得不可读。
对于远程/无头主机，优先使用直接 QR 图像交接路径，而不是手动终端捕获。
</Warning>

## 使用 MeowCaller 呼叫当前请求者（实验性）

WhatsApp 插件可以在 WhatsApp 来源的 Agent 轮次中公开 `whatsapp_call`。该工具
使用 [MeowCaller](https://github.com/purpshell/meowcaller) 向当前已授权请求者发起 WhatsApp 语音通话，
并在对方接听后播放一条 OpenClaw TTS 消息。该工具
不接受目标号码，因此提示词无法将通话重定向到第三方。
此实验性能力默认禁用。

<Warning>
MeowCaller 是实验性的，没有带标签的发布版本，并使用单独配对的 whatsmeow
已关联设备会话。它无法复用 WhatsApp 插件的 Baileys 凭证。配对会
向同一个 WhatsApp 账号添加另一个已关联设备。请使用 OpenClaw 使用的
WhatsApp 身份进行扫描。个人号码/自聊模式无法呼叫自己；请使用专用 OpenClaw 号码
来呼叫你的个人号码。
</Warning>

<Steps>
  <Step title="启用实验性通话">

    将 `actions.calls: true` 添加到 `openclaw.json` 中的 WhatsApp 渠道：

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

    将其合并到你现有的 WhatsApp 配置中，然后重启 Gateway 网关。当该
    设置缺失或为 `false` 时，OpenClaw 不会向 Agent 公开 `whatsapp_call` 工具。

  </Step>

  <Step title="安装已审查的 MeowCaller CLI">

    适配器要求 Gateway 网关主机的 `PATH` 上存在名为 `meowcaller` 的可执行文件。
    在 [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) 合并前，请构建
    提交 `752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f` 对应的已审查分支：

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    确保 `$HOME/.local/bin` 也在 Gateway 网关服务的 `PATH` 上。此修订版提供
    显式的 `pair` 和仅发送的 `notify` 命令。`notify` 不会打开麦克风、扬声器、
    视频设备、入站音频接收端或诊断捕获。不要替换为示例
    CLI 的 `play` 命令。

  </Step>

  <Step title="配对 MeowCaller 已关联设备">

    让 WhatsApp Agent 检查通话设置。`whatsapp_call` 状态动作会报告
    账号专属状态目录和配对命令。对于默认账号：

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    在交互式终端中运行该命令。从 **WhatsApp > 已关联设备** 扫描其 QR，
    并等待 `MeowCaller linked device ready`。随后命令会退出。请保持 `wa-voip.db`
    私密；它是 MeowCaller 已关联设备会话。使用非默认账号时，`whatsapp_call` 状态动作
    会返回账号专属命令和 shell。在 Windows 上，运行其 PowerShell 命令；MeowCaller 会创建存储目录。

  </Step>

  <Step title="配置 TTS 并从 WhatsApp 发起通话">

    配置支持电话场景的 [TTS 提供商](/zh-CN/tools/tts)，重启 Gateway 网关，然后发送一个
    WhatsApp 请求，例如 `Call me and say the build finished.`。该工具会从可信入站上下文
    解析发送者，合成一个临时私有 WAV 文件，在有界通话窗口内运行 MeowCaller，
    并在之后删除音频文件。OpenClaw 会显式传递该账号的
    存储，等待接听、播放和挂断后的零退出状态，并将
    超时或非零退出视为工具调用失败。

  </Step>
</Steps>

当前限制：

- 仅支持一对一出站音频通话
- 不支持任意目标号码
- 不与聊天连接共享凭证
- 个人号码/自聊模式下不支持自呼叫
- 合成音频限制为 60 秒
- 除 MeowCaller 的接听/播放/挂断完成状态外，没有手机端可听性回执
- OpenClaw 会在有界的 115–175 秒窗口后停止配套进程，包括
  MeowCaller 的连接、接听、播放和关闭阶段

## 部署模式

<AccordionGroup>
  <Accordion title="专用号码（推荐）">
    这是最清晰的运维模式：

    - 为 OpenClaw 使用单独的 WhatsApp 身份
    - 更清晰的私信 allowlist 和路由边界
    - 降低自聊混淆概率

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

  <Accordion title="个人号码后备">
    新手引导支持个人号码模式，并写入适合自聊的基线：

    - `dmPolicy: "allowlist"`
    - `allowFrom` 包含你的个人号码
    - `selfChatMode: true`

    在运行时，自聊保护基于已关联的自身号码和 `allowFrom`。

  </Accordion>

  <Accordion title="仅 WhatsApp Web 的渠道范围">
    在当前 OpenClaw 渠道架构中，消息平台渠道基于 WhatsApp Web（`Baileys`）。

    内置聊天渠道注册表中没有单独的 Twilio WhatsApp 消息渠道。

  </Accordion>
</AccordionGroup>

## 运行时模型

- Gateway 网关拥有 WhatsApp socket 和重连循环。
- 重连 watchdog 使用 WhatsApp Web 传输活动，而不只看入站应用消息量，因此安静的已关联设备会话不会仅仅因为最近没人发送消息就被重启。如果传输帧持续到达但 watchdog 窗口内没有处理任何应用消息，较长的应用静默上限仍会强制重连；对于最近活跃会话的一次瞬时重连之后，该应用静默检查会在第一个恢复窗口使用正常消息超时。
- Baileys socket 计时在 `web.whatsapp.*` 下显式配置：`keepAliveIntervalMs` 控制 WhatsApp Web 应用 ping，`connectTimeoutMs` 控制打开握手超时，`defaultQueryTimeoutMs` 控制 Baileys 查询等待，以及 OpenClaw 本地出站发送/在线状态和入站已读回执操作边界。
- 出站发送要求目标账号有活跃的 WhatsApp listener。
- 当文本和媒体标题中的 `@+<digits>` 与 `@<digits>` token 匹配当前 WhatsApp 参与者元数据（包括 LID 支持的群组）时，群组发送会附加原生提及元数据。
- 状态和广播聊天会被忽略（`@status`、`@broadcast`）。
- 重连 watchdog 遵循 WhatsApp Web 传输活动，而不只看入站应用消息量：只要传输帧继续，安静的已关联设备会话就会保持在线，但传输停滞会在后续远端断开路径之前很久就强制重连。
- 直接聊天使用私信会话规则（`session.dmScope`；默认 `main` 会将私信折叠到 Agent 主会话）。
- 群组会话隔离（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Channels/Newsletters 可以使用其原生 `@newsletter` JID 作为显式出站目标。出站 newsletter 发送使用频道会话元数据（`agent:<agentId>:whatsapp:channel:<jid>`），而不是私信会话语义。
- WhatsApp Web 传输遵循 Gateway 网关主机上的标准代理环境变量（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小写变体）。优先使用主机级代理配置，而不是渠道专属 WhatsApp 代理设置。
- 当启用 `messages.removeAckAfterReply` 时，OpenClaw 会在可见回复送达后清除 WhatsApp ack reaction。

## 审批提示

WhatsApp 可以用 `👍` / `👎` reaction 渲染 exec 和插件审批提示。发送由顶层审批转发配置控制：

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

`approvals.exec` 和 `approvals.plugin` 相互独立。将 WhatsApp 启用为渠道只会关联
传输；除非启用匹配的审批族并路由到 WhatsApp，否则不会发送审批提示。
会话模式仅为源自 WhatsApp 的审批发送原生 emoji 审批。目标模式使用共享转发管道发送到显式 WhatsApp
目标，并且不会创建单独的审批者私信扇出。

WhatsApp 审批 reaction 需要来自 `allowFrom` 或 `"*"` 的显式 WhatsApp 审批者。
`defaultTo` 控制普通默认消息目标；它不是审批者。手动
`/approve` 命令在审批解析前仍会经过正常的 WhatsApp 发送者授权路径。

## 插件钩子和隐私

WhatsApp 入站消息可能包含个人消息内容、电话号码、
群组标识符、发送者名称和会话关联字段。因此，
除非你显式选择启用，否则 WhatsApp 不会向插件广播入站 `message_received` 钩子载荷：

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

你可以将选择启用限定到一个账号：

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

仅对你信任、可接收入站 WhatsApp 消息内容和标识符的插件启用此项。

## 访问控制和激活

<Tabs>
  <Tab title="私信策略">
    `channels.whatsapp.dmPolicy` 控制直接聊天访问：

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    `allowFrom` 接受 E.164 风格号码（内部会规范化）。

    `allowFrom` 是私信发送者访问控制列表。它不会限制显式发送到 WhatsApp 群组 JID 或 `@newsletter` 渠道 JID 的出站消息。

    多账号覆盖：`channels.whatsapp.accounts.<id>.dmPolicy`（以及 `allowFrom`）优先于该账号的渠道级默认值。

    运行时行为细节：

    - 配对会持久化到渠道 allow-store，并与配置的 `allowFrom` 合并
    - 定时自动化和 Heartbeat 接收者回退使用显式投递目标或配置的 `allowFrom`；私信配对审批不会隐式成为 cron 或 Heartbeat 接收者
    - 如果未配置 allowlist，则默认允许已链接的本机号码
    - OpenClaw 永远不会自动配对出站 `fromMe` 私信（你从已链接设备发送给自己的消息）

  </Tab>

  <Tab title="群组策略 + allowlist">
    群组访问有两层：

    1. **群组成员 allowlist**（`channels.whatsapp.groups`）
       - 如果省略 `groups`，所有群组都符合条件
       - 如果存在 `groups`，它会作为群组 allowlist（允许 `"*"`）

    2. **群组发送者策略**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`：绕过发送者 allowlist
       - `allowlist`：发送者必须匹配 `groupAllowFrom`（或 `*`）
       - `disabled`：阻止所有群组入站消息

    发送者 allowlist 回退：

    - 如果未设置 `groupAllowFrom`，运行时会在可用时回退到 `allowFrom`
    - 发送者 allowlist 会先于提及/回复激活进行评估

    注意：如果完全不存在 `channels.whatsapp` 块，运行时群组策略回退为 `allowlist`（并带有警告日志），即使设置了 `channels.defaults.groupPolicy` 也是如此。

  </Tab>

  <Tab title="提及 + /activation">
    群组回复默认要求提及。

    提及检测包括：

    - 对机器人身份的显式 WhatsApp 提及
    - 配置的提及正则模式（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）
    - 已授权群组消息的入站语音便笺转录
    - 隐式回复机器人检测（回复发送者匹配机器人身份）

    安全注意事项：

    - 引用/回复只满足提及门控；它**不会**授予发送者授权
    - 使用 `groupPolicy: "allowlist"` 时，即使非 allowlist 发送者回复了 allowlist 用户的消息，仍会被阻止

    会话级激活命令：

    - `/activation mention`
    - `/activation always`

    `activation` 会更新会话状态（不是全局配置）。它受所有者门控。

  </Tab>
</Tabs>

## 配置的 ACP 绑定

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
- 在 OpenClaw 确保配置的 ACP 会话存在之前，会先运行群组 allowlist、发送者策略以及提及或激活门控。
- 匹配到的已配置 ACP 绑定拥有该路由。WhatsApp 广播群组不会将该轮次分发到普通 WhatsApp 会话。

## 个人号码和自聊行为

当已链接的本机号码也存在于 `allowFrom` 中时，WhatsApp 自聊保护会激活：

- 跳过自聊轮次的已读回执
- 忽略原本会提及你自己的 mention-JID 自动触发行为
- 如果未设置 `messages.responsePrefix`，自聊回复默认使用 `[{identity.name}]` 或 `[openclaw]`

## 消息规范化和上下文

<AccordionGroup>
  <Accordion title="入站信封 + 回复上下文">
    传入的 WhatsApp 消息会封装在共享入站信封中。

    如果存在引用回复，上下文会以这种形式追加：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    可用时还会填充回复元数据字段（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、发送者 JID/E.164）。
    当引用回复目标是可下载媒体时，OpenClaw 会通过
    常规入站媒体存储保存它，并将其暴露为 `MediaPath`/`MediaType`，使
    智能体可以检查引用的图片，而不只是看到
    `<media:image>`。

  </Accordion>

  <Accordion title="媒体占位符和位置/联系人提取">
    仅媒体的入站消息会使用如下占位符规范化：

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    已授权群组语音便笺会在提及门控前转录，前提是
    正文只有 `<media:audio>`，因此在语音便笺中说出机器人提及可以
    触发回复。如果转录文本仍未提及机器人，则
    转录文本会保留在待处理群组历史中，而不是保留原始占位符。

    位置正文使用简短坐标文本。位置标签/评论和联系人/vCard 详情会渲染为围栏包裹的不受信任元数据，而不是内联提示文本。

  </Accordion>

  <Accordion title="待处理群组历史注入">
    对于群组，未处理消息可以被缓冲，并在机器人最终被触发时作为上下文注入。

    - 默认限制：`50`
    - 配置：`channels.whatsapp.historyLimit`
    - 回退：`messages.groupChat.historyLimit`
    - `0` 会禁用

    注入标记：

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="已读回执">
    对于已接受的入站 WhatsApp 消息，默认启用已读回执。

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
    - 支持图片、视频、音频（PTT 语音便笺）和文档载荷
    - 音频媒体通过 Baileys `audio` 载荷发送，并带有 `ptt: true`，因此 WhatsApp 客户端会将其渲染为一条按住说话语音便笺
    - 回复载荷会保留 `audioAsVoice`；即使提供商返回 MP3 或 WebM，面向 WhatsApp 的 TTS 语音便笺输出仍会保留在这条 PTT 路径上
    - 原生 Ogg/Opus 音频会以 `audio/ogg; codecs=opus` 发送，以兼容语音便笺
    - 非 Ogg 音频（包括 Microsoft Edge TTS MP3/WebM 输出）会在 PTT 投递前用 `ffmpeg` 转码为 48 kHz 单声道 Ogg/Opus
    - `/tts latest` 会将最新的助手回复作为一条语音便笺发送，并抑制同一回复的重复发送；`/tts chat on|off|default` 控制当前 WhatsApp 聊天的自动 TTS
    - 通过视频发送中的 `gifPlayback: true` 支持动画 GIF 播放
    - `forceDocument` / `asDocument` 会通过 Baileys 文档载荷发送出站图片、GIF 和视频，以避免 WhatsApp 媒体压缩，同时保留解析出的文件名和 MIME 类型
    - 发送多媒体回复载荷时，说明文字会应用到第一个媒体项；但 PTT 语音便笺会先发送音频，再单独发送可见文本，因为 WhatsApp 客户端不会稳定渲染语音便笺说明文字
    - 媒体来源可以是 HTTP(S)、`file://` 或本地路径

  </Accordion>

  <Accordion title="媒体大小限制和回退行为">
    - 入站媒体保存上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 出站媒体发送上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 按账号覆盖使用 `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - 除非 `forceDocument` / `asDocument` 请求文档投递，否则图片会自动优化（调整大小/质量扫描）以符合限制
    - 媒体发送失败时，首项回退会发送文本警告，而不是静默丢弃响应

  </Accordion>
</AccordionGroup>

## 回复引用

WhatsApp 支持原生回复引用，出站回复会可见地引用入站消息。使用 `channels.whatsapp.replyToMode` 控制它。

| 值          | 行为                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | 永不引用；作为普通消息发送                                            |
| `"first"`   | 仅引用第一个出站回复分块                                              |
| `"all"`     | 引用每一个出站回复分块                                                |
| `"batched"` | 引用排队的批量回复，同时让即时回复保持不引用                          |

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

## 反应级别

`channels.whatsapp.reactionLevel` 控制智能体在 WhatsApp 上使用表情反应的范围：

| 级别          | Ack 反应 | 智能体发起的反应 | 描述                              |
| ------------- | -------- | ---------------- | --------------------------------- |
| `"off"`       | 否       | 否               | 完全不使用反应                    |
| `"ack"`       | 是       | 否               | 仅 Ack 反应（回复前回执）         |
| `"minimal"`   | 是       | 是（保守）       | Ack + 带保守指导的智能体反应      |
| `"extensive"` | 是       | 是（鼓励）       | Ack + 带鼓励指导的智能体反应      |

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

## 确认反应

WhatsApp 支持通过 `channels.whatsapp.ackReaction` 在入站接收时立即发送 Ack 反应。
Ack 反应受 `reactionLevel` 门控，在 `reactionLevel` 为 `"off"` 时会被抑制。

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

- 在入站消息被接受后立即发送（回复前）
- 如果存在 `ackReaction` 但没有 `emoji`，WhatsApp 会使用路由到的智能体的身份表情符号，并回退到 “👀”；省略 `ackReaction` 或设置 `emoji: ""` 则不发送确认回应
- 失败会被记录到日志，但不会阻止正常回复投递
- 群组模式 `mentions` 会对由提及触发的轮次作出回应；群组激活 `always` 会作为此检查的绕过条件
- WhatsApp 使用 `channels.whatsapp.ackReaction`（这里不使用旧版 `messages.ackReaction`）

## 生命周期状态回应

设置 `messages.statusReactions.enabled: true`，让 WhatsApp 在轮次期间替换确认回应，而不是保留静态的回执表情符号。启用后，OpenClaw 会使用同一个入站消息回应槽来表示生命周期状态，例如已排队、思考中、工具活动、压缩、完成和错误。

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

- `channels.whatsapp.ackReaction` 仍控制状态回应是否可用于直接消息和群组。
- 已排队状态回应使用与普通确认回应相同的有效确认表情符号。
- WhatsApp 每条消息只有一个 Bot 回应槽，因此生命周期更新会原地替换当前回应。
- `messages.removeAckAfterReply: true` 会在配置的完成/错误保持时间后清除最终状态回应。
- 工具表情符号类别包括 `tool`、`coding`、`web`、`deploy`、`build` 和 `concierge`。

## 多账户和凭证

<AccordionGroup>
  <Accordion title="Account selection and defaults">
    - 账户 ID 来自 `channels.whatsapp.accounts`
    - 默认账户选择：如果存在则使用 `default`，否则使用第一个已配置的账户 ID（排序后）
    - 账户 ID 会在内部归一化以便查找

  </Accordion>

  <Accordion title="Credential paths and legacy compatibility">
    - 当前认证路径：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 备份文件：`creds.json.bak`
    - 仍会识别/迁移 `~/.openclaw/credentials/` 中的旧版默认认证，用于默认账户流程

  </Accordion>

  <Accordion title="Logout behavior">
    `openclaw channels logout --channel whatsapp [--account <id>]` 会清除该账户的 WhatsApp 认证状态。

    当 Gateway 网关可达时，退出登录会先停止所选账户的实时 WhatsApp 监听器，使已关联的会话不会继续接收消息直到下次重启。`openclaw channels remove --channel whatsapp` 也会在禁用或删除账户配置前停止实时监听器。

    在旧版认证目录中，会保留 `oauth.json`，同时移除 Baileys 认证文件。

  </Accordion>
</AccordionGroup>

## 工具、操作和配置写入

- 智能体工具支持包括 WhatsApp 回应操作（`react`）。
- 操作门控：
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 默认启用由渠道发起的配置写入（可通过 `channels.whatsapp.configWrites=false` 禁用）。

## 故障排除

<AccordionGroup>
  <Accordion title="Not linked (QR required)">
    症状：渠道状态报告未关联。

    修复：

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Linked but disconnected / reconnect loop">
    症状：已关联账户反复断开连接或尝试重新连接。

    安静账户可以在正常消息超时后仍保持连接；当 WhatsApp Web 传输活动停止、套接字关闭，或应用级活动在更长的安全窗口内持续静默时，watchdog 会重启。

    如果日志显示反复出现 `status=408 Request Time-out Connection was lost`，请在 `web.whatsapp` 下调整 Baileys 套接字时序。先将 `keepAliveIntervalMs` 缩短到低于你的网络空闲超时时间，并在较慢或丢包链路上增大 `connectTimeoutMs`：

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

    如果在主机连通性和时序修复后循环仍然存在，请备份该账户认证目录并重新关联该账户：

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    如果 `~/.openclaw/logs/whatsapp-health.log` 显示 `Gateway inactive`，但 `openclaw gateway status` 和 `openclaw channels status --probe` 显示 Gateway 网关和 WhatsApp 都健康，请运行 `openclaw doctor`。在 Linux 上，Doctor 会警告仍在调用 `~/.openclaw/bin/ensure-whatsapp.sh` 的旧版 crontab 条目；请用 `crontab -e` 移除这些过期条目，因为 cron 可能缺少 systemd 用户总线环境，导致这个旧脚本误报 Gateway 网关健康状态。

    如有需要，请使用 `channels login` 重新关联。

  </Accordion>

  <Accordion title="QR login times out behind a proxy">
    症状：`openclaw channels login --channel whatsapp` 在显示可用二维码前失败，并出现 `status=408 Request Time-out` 或 TLS 套接字断开。

    WhatsApp Web 登录使用 Gateway 网关主机的标准代理环境（`HTTPS_PROXY`、`HTTP_PROXY`、小写变体以及 `NO_PROXY`）。确认 Gateway 网关进程继承了代理环境变量，并且 `NO_PROXY` 未匹配 `mmg.whatsapp.net`。

  </Accordion>

  <Accordion title="No active listener when sending">
    当目标账户没有活跃的 Gateway 网关监听器时，出站发送会快速失败。

    确保 Gateway 网关正在运行且账户已关联。

  </Accordion>

  <Accordion title="Reply appears in transcript but not in WhatsApp">
    轨迹行记录智能体生成的内容。WhatsApp 投递会单独检查：只有在 Baileys 至少为一次可见文本或媒体发送返回出站消息 ID 后，OpenClaw 才会把自动回复视为已发送。

    确认回应是独立的回复前回执。回应成功并不证明后续文本或媒体回复已被 WhatsApp 接受。

    检查 Gateway 网关日志中是否有 `auto-reply delivery failed` 或 `auto-reply was not accepted by WhatsApp provider`。

  </Accordion>

  <Accordion title="Group messages unexpectedly ignored">
    按以下顺序检查：

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 允许列表条目
    - 提及门控（`requireMention` + 提及模式）
    - `openclaw.json`（JSON5）中的重复键：后面的条目会覆盖前面的条目，因此每个作用域只保留一个 `groupPolicy`

    如果存在 `channels.whatsapp.groups`，WhatsApp 仍可能观察到来自其他群组的消息，但 OpenClaw 会在会话路由前丢弃它们。将群组 JID 添加到 `channels.whatsapp.groups`，或添加 `groups["*"]` 来接纳所有群组，同时继续通过 `groupPolicy` 和 `groupAllowFrom` 维护发送者授权。

  </Accordion>

  <Accordion title="Bun runtime warning">
    WhatsApp Gateway 网关运行时应使用 Node。Bun 被标记为不兼容稳定的 WhatsApp/Telegram Gateway 网关操作。
  </Accordion>
</AccordionGroup>

## 系统提示词

WhatsApp 支持通过 `groups` 和 `direct` 映射为群组和直接聊天配置 Telegram 风格的系统提示词。

群组消息的解析层级：

有效的 `groups` 映射会先确定：如果账户定义了自己的 `groups`，它会完全替换根级 `groups` 映射（不进行深度合并）。随后提示词查找会在生成的单个映射上运行：

1. **群组专用系统提示词**（`groups["<groupId>"].systemPrompt`）：当特定群组条目存在于映射中**且**定义了 `systemPrompt` 键时使用。如果 `systemPrompt` 是空字符串（`""`），则会抑制通配符，并且不应用系统提示词。
2. **群组通配系统提示词**（`groups["*"].systemPrompt`）：当特定群组条目完全不存在于映射中，或存在但未定义 `systemPrompt` 键时使用。

直接消息的解析层级：

有效的 `direct` 映射会先确定：如果账户定义了自己的 `direct`，它会完全替换根级 `direct` 映射（不进行深度合并）。随后提示词查找会在生成的单个映射上运行：

1. **直接聊天专用系统提示词**（`direct["<peerId>"].systemPrompt`）：当特定对端条目存在于映射中**且**定义了 `systemPrompt` 键时使用。如果 `systemPrompt` 是空字符串（`""`），则会抑制通配符，并且不应用系统提示词。
2. **直接聊天通配系统提示词**（`direct["*"].systemPrompt`）：当特定对端条目完全不存在于映射中，或存在但未定义 `systemPrompt` 键时使用。

<Note>
`dms` 仍然是轻量的每私信历史覆盖桶（`dms.<id>.historyLimit`）。提示词覆盖位于 `direct` 下。
</Note>

**与 Telegram 多账户行为的区别：** 在 Telegram 中，多账户设置会有意为所有账户抑制根级 `groups`，即使某些账户没有定义自己的 `groups`，以防止 Bot 接收来自其不属于的群组的群组消息。WhatsApp 不应用此保护：只要账户没有定义账户级覆盖，就始终继承根级 `groups` 和根级 `direct`，无论配置了多少账户。在多账户 WhatsApp 设置中，如果你想要按账户配置群组或直接聊天提示词，请在每个账户下显式定义完整映射，而不是依赖根级默认值。

重要行为：

- `channels.whatsapp.groups` 同时是每群组配置映射和聊天级群组允许列表。在根级或账户作用域中，`groups["*"]` 表示该作用域“接纳所有群组”。
- 只有在你已经希望该作用域接纳所有群组时，才添加通配群组 `systemPrompt`。如果你仍然只希望固定的一组群组 ID 有资格进入处理，请不要使用 `groups["*"]` 作为提示词默认值。改为在每个显式允许的群组条目上重复该提示词。
- 群组准入和发送者授权是独立检查。`groups["*"]` 会扩大可进入群组处理的群组集合，但它本身不会授权这些群组中的每个发送者。发送者访问仍由 `channels.whatsapp.groupPolicy` 和 `channels.whatsapp.groupAllowFrom` 分别控制。
- `channels.whatsapp.direct` 对私信没有相同副作用。`direct["*"]` 只会在私信已通过 `dmPolicy` 加 `allowFrom` 或配对存储规则被接纳后，提供默认直接聊天配置。

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

重点 WhatsApp 字段：

- 访问：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`
- 递送：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`
- 多账号：`accounts.<id>.enabled`、`accounts.<id>.authDir`、账号级覆盖项
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
