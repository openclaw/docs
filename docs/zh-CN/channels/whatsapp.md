---
read_when:
    - 处理 WhatsApp/web 渠道行为或收件箱路由
summary: WhatsApp 渠道支持、访问控制、递送行为和运维
title: WhatsApp
x-i18n:
    generated_at: "2026-05-03T04:55:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f12709fc8ecb45e1b060647daf9a4624485d52b7b6436c3d07f171e6807babf
    source_path: channels/whatsapp.md
    workflow: 16
---

Status：通过 WhatsApp Web（Baileys）可用于生产环境。Gateway 网关拥有已链接的会话。

## 安装（按需）

- 新手引导（`openclaw onboard`）和 `openclaw channels add --channel whatsapp`
  会在你第一次选择 WhatsApp 插件时提示安装它。
- 当插件尚不存在时，`openclaw channels login --channel whatsapp` 也会提供安装流程。
- 开发渠道 + git checkout：默认使用本地插件路径。
- 稳定版/Beta：在当前官方发布标签上使用 npm 包 `@openclaw/whatsapp`。

仍可手动安装：

```bash
openclaw plugins install @openclaw/whatsapp
```

使用裸包名以跟随当前官方发布标签。只有在需要可复现安装时，才固定精确版本。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    默认私信策略是对未知发送者进行配对。
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

  <Step title="链接 WhatsApp（QR）">

```bash
openclaw channels login --channel whatsapp
```

    对于特定账号：

```bash
openclaw channels login --channel whatsapp --account work
```

    要在登录前附加现有/自定义 WhatsApp Web 认证目录：

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

    配对请求会在 1 小时后过期。每个渠道的待处理请求上限为 3 个。

  </Step>
</Steps>

<Note>
OpenClaw 建议尽可能在单独的号码上运行 WhatsApp。（渠道元数据和设置流程针对该设置进行了优化，但也支持个人号码设置。）
</Note>

## 部署模式

<AccordionGroup>
  <Accordion title="专用号码（推荐）">
    这是最清晰的运维模式：

    - 为 OpenClaw 使用单独的 WhatsApp 身份
    - 更清晰的私信允许列表和路由边界
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

  <Accordion title="个人号码回退">
    新手引导支持个人号码模式，并写入适合自聊的基线：

    - `dmPolicy: "allowlist"`
    - `allowFrom` 包含你的个人号码
    - `selfChatMode: true`

    运行时，自聊保护基于已链接的自身号码和 `allowFrom`。

  </Accordion>

  <Accordion title="仅限 WhatsApp Web 的渠道范围">
    在当前 OpenClaw 渠道架构中，消息平台渠道基于 WhatsApp Web（`Baileys`）。

    内置聊天渠道注册表中没有单独的 Twilio WhatsApp 消息渠道。

  </Accordion>
</AccordionGroup>

## 运行时模型

- Gateway 网关拥有 WhatsApp socket 和重连循环。
- 重连看门狗使用 WhatsApp Web 传输活动，而不仅仅是入站应用消息量，因此安静的已链接设备会话不会仅因为最近没人发送消息而被重启。如果传输帧持续到达但在看门狗窗口内没有处理任何应用消息，较长的应用静默上限仍会强制重连；对于最近活跃会话的瞬时重连后，该应用静默检查会在第一个恢复窗口使用正常消息超时。
- Baileys socket 时序在 `web.whatsapp.*` 下显式配置：`keepAliveIntervalMs` 控制 WhatsApp Web 应用 ping，`connectTimeoutMs` 控制打开握手超时，`defaultQueryTimeoutMs` 控制 Baileys 查询超时。
- 出站发送需要目标账号有活跃的 WhatsApp 监听器。
- 当文本和媒体说明中的 `@+<digits>` 与 `@<digits>` token 匹配当前 WhatsApp 参与者元数据时，群组发送会附加原生提及元数据，包括基于 LID 的群组。
- Status 和广播聊天会被忽略（`@status`、`@broadcast`）。
- 重连看门狗跟随 WhatsApp Web 传输活动，而不仅仅是入站应用消息量：只要传输帧继续，安静的已链接设备会话就会保持在线，但传输停滞会在更晚的远端断开路径之前强制重连。
- 直接聊天使用私信会话规则（`session.dmScope`；默认 `main` 会将私信折叠到智能体主会话）。
- 群组会话是隔离的（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Channels/Newsletters 可以用其原生 `@newsletter` JID 作为显式出站目标。出站 newsletter 发送使用渠道会话元数据（`agent:<agentId>:whatsapp:channel:<jid>`），而不是私信会话语义。
- WhatsApp Web 传输会遵循 Gateway 网关主机上的标准代理环境变量（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小写变体）。优先使用主机级代理配置，而不是渠道特定的 WhatsApp 代理设置。
- 启用 `messages.removeAckAfterReply` 时，OpenClaw 会在可见回复送达后清除 WhatsApp ack 反应。

## 插件钩子和隐私

WhatsApp 入站消息可能包含个人消息内容、电话号码、群组标识符、发送者姓名和会话关联字段。因此，除非你显式选择启用，否则 WhatsApp 不会向插件广播入站 `message_received` 钩子载荷：

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

只应为你信任其接收入站 WhatsApp 消息内容和标识符的插件启用此项。

## 访问控制和激活

<Tabs>
  <Tab title="私信策略">
    `channels.whatsapp.dmPolicy` 控制直接聊天访问：

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    `allowFrom` 接受 E.164 风格号码（内部会进行规范化）。

    `allowFrom` 是私信发送者访问控制列表。它不会限制对 WhatsApp 群组 JID 或 `@newsletter` 渠道 JID 的显式出站发送。

    多账号覆盖：`channels.whatsapp.accounts.<id>.dmPolicy`（以及 `allowFrom`）优先于该账号的渠道级默认值。

    运行时行为细节：

    - 配对会持久化到渠道 allow-store，并与配置的 `allowFrom` 合并
    - 定时自动化和 Heartbeat 接收者回退使用显式投递目标或配置的 `allowFrom`；私信配对批准不会隐式成为 cron 或 Heartbeat 接收者
    - 如果未配置允许列表，则默认允许已链接的自身号码
    - OpenClaw 绝不会自动配对出站 `fromMe` 私信（你从已链接设备发送给自己的消息）

  </Tab>

  <Tab title="群组策略 + 允许列表">
    群组访问有两层：

    1. **群组成员允许列表**（`channels.whatsapp.groups`）
       - 如果省略 `groups`，则所有群组都符合条件
       - 如果存在 `groups`，它会作为群组允许列表（允许 `"*"`）

    2. **群组发送者策略**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`：绕过发送者允许列表
       - `allowlist`：发送者必须匹配 `groupAllowFrom`（或 `*`）
       - `disabled`：阻止所有群组入站

    发送者允许列表回退：

    - 如果未设置 `groupAllowFrom`，运行时会在可用时回退到 `allowFrom`
    - 发送者允许列表会在提及/回复激活之前评估

    注意：如果完全没有 `channels.whatsapp` 块，即使设置了 `channels.defaults.groupPolicy`，运行时群组策略回退也是 `allowlist`（并记录警告日志）。

  </Tab>

  <Tab title="提及 + /activation">
    群组回复默认需要提及。

    提及检测包括：

    - 对机器人身份的显式 WhatsApp 提及
    - 已配置的提及正则模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 已授权群组消息的入站语音便签转录
    - 隐式回复机器人检测（回复发送者匹配机器人身份）

    安全说明：

    - 引用/回复只满足提及门控；它**不会**授予发送者授权
    - 使用 `groupPolicy: "allowlist"` 时，即使非允许列表发送者回复了允许列表用户的消息，仍会被阻止

    会话级激活命令：

    - `/activation mention`
    - `/activation always`

    `activation` 会更新会话状态（不是全局配置）。它受所有者门控。

  </Tab>
</Tabs>

## 个人号码和自聊行为

当已链接的自身号码也存在于 `allowFrom` 中时，WhatsApp 自聊防护会激活：

- 跳过自聊轮次的已读回执
- 忽略原本会 ping 你自己的 mention-JID 自动触发行为
- 如果未设置 `messages.responsePrefix`，自聊回复默认使用 `[{identity.name}]` 或 `[openclaw]`

## 消息规范化和上下文

<AccordionGroup>
  <Accordion title="入站信封 + 回复上下文">
    传入的 WhatsApp 消息会包装在共享入站信封中。

    如果存在引用回复，上下文会以这种形式追加：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    可用时也会填充回复元数据字段（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、发送者 JID/E.164）。
    当引用回复目标是可下载媒体时，OpenClaw 会通过正常入站媒体存储保存它，并将其暴露为 `MediaPath`/`MediaType`，以便智能体检查被引用的图片，而不是只看到 `<media:image>`。

  </Accordion>

  <Accordion title="媒体占位符和位置/联系人提取">
    仅媒体的入站消息会使用如下占位符进行规范化：

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    当正文只有 `<media:audio>` 时，已授权群组语音便签会在提及门控之前转录，因此在语音便签中说出机器人提及可以触发回复。如果转录仍未提及机器人，则转录会保留在待处理群组历史中，而不是保留原始占位符。

    位置正文使用简洁的坐标文本。位置标签/评论和联系人/vCard 详情会渲染为围栏式不可信元数据，而不是内联提示文本。

  </Accordion>

  <Accordion title="待处理群组历史注入">
    对于群组，未处理消息可以被缓冲，并在机器人最终被触发时作为上下文注入。

    - 默认限制：`50`
    - 配置：`channels.whatsapp.historyLimit`
    - 回退：`messages.groupChat.historyLimit`
    - `0` 表示禁用

    注入标记：

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="已读回执">
    对已接受的入站 WhatsApp 消息，已读回执默认启用。

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

    即使全局启用，自己与自己的聊天回合也会跳过已读回执。

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
    - 音频媒体通过 Baileys `audio` 载荷发送，并带有 `ptt: true`，因此 WhatsApp 客户端会将其渲染为按住说话语音便笺
    - 回复载荷会保留 `audioAsVoice`；即使提供商返回 MP3 或 WebM，WhatsApp 的 TTS 语音便笺输出也会保持在这条 PTT 路径上
    - 原生 Ogg/Opus 音频会作为 `audio/ogg; codecs=opus` 发送，以兼容语音便笺
    - 非 Ogg 音频（包括 Microsoft Edge TTS MP3/WebM 输出）会在 PTT 投递前用 `ffmpeg` 转码为 48 kHz 单声道 Ogg/Opus
    - `/tts latest` 将最新的助手回复作为一个语音便笺发送，并抑制对同一回复的重复发送；`/tts chat on|off|default` 控制当前 WhatsApp 聊天的自动 TTS
    - 视频发送通过 `gifPlayback: true` 支持动画 GIF 播放
    - 发送多媒体回复载荷时，标题会应用到第一个媒体项；但 PTT 语音便笺会先发送音频，再单独发送可见文本，因为 WhatsApp 客户端无法一致地渲染语音便笺标题
    - 媒体来源可以是 HTTP(S)、`file://` 或本地路径

  </Accordion>

  <Accordion title="媒体大小限制和回退行为">
    - 入站媒体保存上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 出站媒体发送上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 按账号覆盖使用 `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - 图片会自动优化（调整大小/质量扫描）以满足限制
    - 媒体发送失败时，首项回退会发送文本警告，而不是静默丢弃回复

  </Accordion>
</AccordionGroup>

## 回复引用

WhatsApp 支持原生回复引用，出站回复会明显引用入站消息。使用 `channels.whatsapp.replyToMode` 控制它。

| 值          | 行为                                         |
| ----------- | -------------------------------------------- |
| `"off"`     | 永不引用；作为普通消息发送                   |
| `"first"`   | 仅引用第一个出站回复分块                     |
| `"all"`     | 引用每个出站回复分块                         |
| `"batched"` | 引用排队的批量回复，同时让即时回复不带引用 |

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

| 级别          | Ack reactions | 智能体发起的 reactions | 描述                                       |
| ------------- | ------------- | ---------------------- | ------------------------------------------ |
| `"off"`       | 否            | 否                     | 完全不使用 reactions                       |
| `"ack"`       | 是            | 否                     | 仅使用 Ack reactions（回复前回执）         |
| `"minimal"`   | 是            | 是（保守）             | Ack + 智能体 reactions，并采用保守指导     |
| `"extensive"` | 是            | 是（鼓励）             | Ack + 智能体 reactions，并采用鼓励性指导   |

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

WhatsApp 支持通过 `channels.whatsapp.ackReaction` 在收到入站消息时立即发送 ack reactions。
Ack reactions 受 `reactionLevel` 约束，当 `reactionLevel` 为 `"off"` 时会被抑制。

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
- 失败会被记录，但不会阻塞正常回复投递
- 组模式 `mentions` 会在由提及触发的回合上 reaction；组激活 `always` 会绕过此检查
- WhatsApp 使用 `channels.whatsapp.ackReaction`（此处不使用旧版 `messages.ackReaction`）

## 多账号和凭证

<AccordionGroup>
  <Accordion title="账号选择和默认值">
    - 账号 ID 来自 `channels.whatsapp.accounts`
    - 默认账号选择：如果存在则使用 `default`，否则使用第一个配置的账号 ID（排序后）
    - 账号 ID 会在内部规范化以便查找

  </Accordion>

  <Accordion title="凭证路径和旧版兼容性">
    - 当前认证路径：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 备份文件：`creds.json.bak`
    - `~/.openclaw/credentials/` 中的旧版默认认证仍会在默认账号流程中被识别/迁移

  </Accordion>

  <Accordion title="登出行为">
    `openclaw channels logout --channel whatsapp [--account <id>]` 会清除该账号的 WhatsApp 认证状态。

    当 Gateway 网关可达时，登出会先停止所选账号的实时 WhatsApp 监听器，这样已链接的会话不会在下次重启前继续接收消息。`openclaw channels remove --channel whatsapp` 也会在禁用或删除账号配置前停止实时监听器。

    在旧版认证目录中，`oauth.json` 会被保留，而 Baileys 认证文件会被删除。

  </Accordion>
</AccordionGroup>

## 工具、操作和配置写入

- 智能体工具支持包括 WhatsApp reaction 操作（`react`）。
- 操作门控：
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 渠道发起的配置写入默认启用（可通过 `channels.whatsapp.configWrites=false` 禁用）。

## 故障排除

<AccordionGroup>
  <Accordion title="未链接（需要 QR）">
    现象：渠道 Status 报告未链接。

    修复：

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="已链接但断开 / 重连循环">
    现象：已链接账号反复断开或尝试重连。

    安静账号可以在正常消息超时后仍保持连接；当 WhatsApp Web 传输活动停止、套接字关闭，或应用级活动在更长的安全窗口内保持静默时，watchdog 会重启。

    如果日志显示重复的 `status=408 Request Time-out Connection was lost`，请调整 `web.whatsapp` 下的 Baileys 套接字时序。先将 `keepAliveIntervalMs` 缩短到低于你的网络空闲超时时间，并在慢速或丢包链路上增加 `connectTimeoutMs`：

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

    如果 `~/.openclaw/logs/whatsapp-health.log` 显示 `Gateway inactive`，但 `openclaw gateway status` 和 `openclaw channels status --probe` 显示 gateway 和 WhatsApp 健康，请运行 `openclaw doctor`。在 Linux 上，Doctor 会警告仍调用 `~/.openclaw/bin/ensure-whatsapp.sh` 的旧版 crontab 条目；请用 `crontab -e` 删除这些过时条目，因为 cron 可能缺少 systemd 用户总线环境，并导致旧脚本误报 gateway 健康状态。

    如有需要，可用 `channels login` 重新链接。

  </Accordion>

  <Accordion title="代理后面的 QR 登录超时">
    现象：`openclaw channels login --channel whatsapp` 在显示可用 QR 码之前失败，并出现 `status=408 Request Time-out` 或 TLS 套接字断开。

    WhatsApp Web 登录使用 gateway 主机的标准代理环境（`HTTPS_PROXY`、`HTTP_PROXY`、小写变体和 `NO_PROXY`）。请确认 gateway 进程继承了代理环境变量，并且 `NO_PROXY` 不匹配 `mmg.whatsapp.net`。

  </Accordion>

  <Accordion title="发送时没有活跃监听器">
    当目标账号没有活跃的 Gateway 网关监听器时，出站发送会快速失败。

    确保 gateway 正在运行，并且账号已链接。

  </Accordion>

  <Accordion title="回复出现在转录中，但没有出现在 WhatsApp 中">
    转录行记录智能体生成的内容。WhatsApp 投递会单独检查：只有在 Baileys 为至少一个可见文本或媒体发送返回出站消息 ID 后，OpenClaw 才会将自动回复视为已发送。

    Ack reactions 是独立的回复前回执。成功的 reaction 并不能证明后续文本或媒体回复已被 WhatsApp 接受。

    检查 gateway 日志中是否有 `auto-reply delivery failed` 或 `auto-reply was not accepted by WhatsApp provider`。

  </Accordion>

  <Accordion title="组消息被意外忽略">
    按以下顺序检查：

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 允许列表条目
    - 提及门控（`requireMention` + 提及模式）
    - `openclaw.json`（JSON5）中的重复键：后面的条目会覆盖前面的条目，因此每个作用域只保留一个 `groupPolicy`

  </Accordion>

  <Accordion title="Bun 运行时警告">
    WhatsApp Gateway 网关运行时应使用 Node。Bun 被标记为不兼容稳定的 WhatsApp/Telegram Gateway 网关运行。
  </Accordion>
</AccordionGroup>

## 系统提示词

WhatsApp 支持通过 `groups` 和 `direct` 映射，为群组和直接聊天配置 Telegram 风格的系统提示词。

组消息的解析层级：

首先确定有效的 `groups` 映射：如果账号定义了自己的 `groups`，它会完全替换根级 `groups` 映射（不会深度合并）。然后提示词查找会在得到的单个映射上运行：

1. **特定组系统提示词**（`groups["<groupId>"].systemPrompt`）：当映射中存在特定组条目，**且**其 `systemPrompt` 键已定义时使用。如果 `systemPrompt` 是空字符串（`""`），通配符会被抑制，并且不会应用系统提示词。
2. **组通配符系统提示词**（`groups["*"].systemPrompt`）：当映射中完全不存在特定组条目，或该条目存在但没有定义 `systemPrompt` 键时使用。

直接消息的解析层级：

首先确定有效的 `direct` 映射：如果账号定义了自己的 `direct`，它会完全替换根级 `direct` 映射（不会深度合并）。然后提示词查找会在得到的单个映射上运行：

1. **特定直接聊天系统提示词**（`direct["<peerId>"].systemPrompt`）：当映射中存在特定对端条目，**且**其 `systemPrompt` 键已定义时使用。如果 `systemPrompt` 是空字符串（`""`），通配符会被抑制，并且不会应用系统提示词。
2. **直接聊天通配符系统提示词**（`direct["*"].systemPrompt`）：当映射中完全不存在特定对端条目，或该条目存在但没有定义 `systemPrompt` 键时使用。

<Note>
`dms` 仍是轻量级的按私信历史覆盖存储桶（`dms.<id>.historyLimit`）。提示词覆盖位于 `direct` 下。
</Note>

**与 Telegram 多账号行为的区别：**在 Telegram 中，多账号设置会刻意对所有账号抑制根级 `groups`，即使某些账号没有定义自己的 `groups`，以防机器人接收它不属于的群组消息。WhatsApp 不应用这个保护：只要账号没有定义账号级覆盖项，根级 `groups` 和根级 `direct` 始终会被继承，无论配置了多少个账号。在多账号 WhatsApp 设置中，如果你想要按账号设置群组或私信提示词，请在每个账号下显式定义完整映射，而不是依赖根级默认值。

重要行为：

- `channels.whatsapp.groups` 既是按群组的配置映射，也是聊天级群组 allowlist。在根级或账号作用域中，`groups["*"]` 表示该作用域“允许所有群组进入”。
- 只有当你已经希望该作用域允许所有群组进入时，才添加通配符群组 `systemPrompt`。如果你仍然只希望一组固定的群组 ID 符合条件，不要使用 `groups["*"]` 作为提示词默认值。请改为在每个显式 allowlist 的群组条目上重复该提示词。
- 群组准入和发送者授权是相互独立的检查。`groups["*"]` 会扩大能够进入群组处理的群组集合，但它本身不会授权这些群组中的每个发送者。发送者访问权限仍由 `channels.whatsapp.groupPolicy` 和 `channels.whatsapp.groupAllowFrom` 单独控制。
- `channels.whatsapp.direct` 对私信没有相同的副作用。`direct["*"]` 只会在私信已通过 `dmPolicy` 加上 `allowFrom` 或配对存储规则准入后，提供默认的私信聊天配置。

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
- 递送：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`
- 多账号：`accounts.<id>.enabled`、`accounts.<id>.authDir`、账号级覆盖项
- 运维：`configWrites`、`debounceMs`、`web.enabled`、`web.heartbeatSeconds`、`web.reconnect.*`、`web.whatsapp.*`
- 会话行为：`session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`
- 提示词：`groups.<id>.systemPrompt`、`groups["*"].systemPrompt`、`direct.<id>.systemPrompt`、`direct["*"].systemPrompt`

## 相关内容

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [安全](/zh-CN/gateway/security)
- [渠道路由](/zh-CN/channels/channel-routing)
- [多智能体路由](/zh-CN/concepts/multi-agent)
- [故障排除](/zh-CN/channels/troubleshooting)
