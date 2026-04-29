---
read_when:
    - 处理 WhatsApp/web 渠道行为或收件箱路由
summary: WhatsApp 渠道支持、访问控制、投递行为和运维
title: WhatsApp
x-i18n:
    generated_at: "2026-04-29T04:46:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: adf84a966468b60d50f7a770fac5c862fa527957ff9ac06acaf8aa35ebd1bbdb
    source_path: channels/whatsapp.md
    workflow: 16
---

Status：通过 WhatsApp Web（Baileys）达到生产就绪。Gateway 网关拥有已链接会话。

## 按需安装

- 新手引导（`openclaw onboard`）和 `openclaw channels add --channel whatsapp`
  会在你首次选择 WhatsApp 插件时提示安装。
- 当插件尚未存在时，`openclaw channels login --channel whatsapp` 也会提供安装流程。
- 开发渠道 + git checkout：默认使用本地插件路径。
- 稳定版/Beta：默认使用 npm 包 `@openclaw/whatsapp`。

仍可手动安装：

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    未知发送者的默认私信策略是配对。
  </Card>
  <Card title="渠道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断和修复操作手册。
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

  <Step title="链接 WhatsApp（二维码）">

```bash
openclaw channels login --channel whatsapp
```

    针对特定账号：

```bash
openclaw channels login --channel whatsapp --account work
```

    在登录前挂载现有/自定义 WhatsApp Web 认证目录：

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

  <Step title="批准首个配对请求（如果使用配对模式）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    配对请求会在 1 小时后过期。每个渠道的待处理请求上限为 3 个。

  </Step>
</Steps>

<Note>
OpenClaw 建议尽可能使用单独的号码运行 WhatsApp。（渠道元数据和设置流程针对这种设置做了优化，但也支持个人号码设置。）
</Note>

## 部署模式

<AccordionGroup>
  <Accordion title="专用号码（推荐）">
    这是最清晰的运维模式：

    - OpenClaw 使用单独的 WhatsApp 身份
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

  <Accordion title="个人号码后备方案">
    新手引导支持个人号码模式，并会写入适合自聊的基线配置：

    - `dmPolicy: "allowlist"`
    - `allowFrom` 包含你的个人号码
    - `selfChatMode: true`

    运行时中，自聊保护基于已链接的本人号码和 `allowFrom`。

  </Accordion>

  <Accordion title="仅限 WhatsApp Web 的渠道范围">
    在当前 OpenClaw 渠道架构中，消息平台渠道基于 WhatsApp Web（`Baileys`）。

    内置聊天渠道注册表中没有单独的 Twilio WhatsApp 消息渠道。

  </Accordion>
</AccordionGroup>

## 运行时模型

- Gateway 网关拥有 WhatsApp socket 和重连循环。
- 重连看门狗使用 WhatsApp Web 传输活动，而不只使用入站应用消息量，因此安静的已链接设备会话不会仅仅因为最近没人发送消息而被重启。如果传输帧持续到达，但在看门狗窗口内没有处理应用消息，较长的应用静默上限仍会强制重连。
- Baileys socket 时序在 `web.whatsapp.*` 下显式配置：`keepAliveIntervalMs` 控制 WhatsApp Web 应用 ping，`connectTimeoutMs` 控制开启握手超时，`defaultQueryTimeoutMs` 控制 Baileys 查询超时。
- 出站发送需要目标账号有活跃的 WhatsApp 监听器。
- Status 和广播聊天会被忽略（`@status`、`@broadcast`）。
- 重连看门狗跟随 WhatsApp Web 传输活动，而不只跟随入站应用消息量：只要传输帧持续，安静的已链接设备会话就会保持在线，但传输停滞会在后续远端断开路径之前很久就强制重连。
- 直接聊天使用私信会话规则（`session.dmScope`；默认 `main` 会把私信折叠到智能体主会话）。
- 群组会话彼此隔离（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Web 传输遵循 Gateway 网关主机上的标准代理环境变量（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小写变体）。优先使用主机级代理配置，而不是渠道特定的 WhatsApp 代理设置。
- 启用 `messages.removeAckAfterReply` 时，OpenClaw 会在可见回复送达后清除 WhatsApp ack 反应。

## 插件钩子和隐私

WhatsApp 入站消息可能包含个人消息内容、电话号码、
群组标识符、发送者姓名和会话关联字段。因此，
除非你显式选择加入，否则 WhatsApp 不会向插件广播入站 `message_received` 钩子载荷：

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

你可以将选择加入限定到一个账号：

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
  <Tab title="私信策略">
    `channels.whatsapp.dmPolicy` 控制直接聊天访问：

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    `allowFrom` 接受 E.164 风格号码（内部会规范化）。

    多账号覆盖：`channels.whatsapp.accounts.<id>.dmPolicy`（以及 `allowFrom`）优先于该账号的渠道级默认值。

    运行时行为详情：

    - 配对会持久化到渠道允许存储中，并与已配置的 `allowFrom` 合并
    - 如果未配置 allowlist，默认允许已链接的本人号码
    - OpenClaw 永远不会自动配对出站 `fromMe` 私信（你从已链接设备发送给自己的消息）

  </Tab>

  <Tab title="群组策略 + allowlists">
    群组访问有两层：

    1. **群组成员 allowlist**（`channels.whatsapp.groups`）
       - 如果省略 `groups`，则所有群组都有资格
       - 如果存在 `groups`，它会作为群组 allowlist（允许 `"*"`）

    2. **群组发送者策略**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`：绕过发送者 allowlist
       - `allowlist`：发送者必须匹配 `groupAllowFrom`（或 `*`）
       - `disabled`：阻止所有群组入站消息

    发送者 allowlist 后备：

    - 如果未设置 `groupAllowFrom`，运行时会在可用时回退到 `allowFrom`
    - 发送者 allowlist 会在提及/回复激活之前评估

    注意：如果根本不存在 `channels.whatsapp` 块，运行时群组策略后备是 `allowlist`（并记录警告日志），即使设置了 `channels.defaults.groupPolicy` 也是如此。

  </Tab>

  <Tab title="提及 + /activation">
    群组回复默认需要提及。

    提及检测包括：

    - 显式提及机器人身份的 WhatsApp 提及
    - 已配置的提及正则模式（`agents.list[].groupChat.mentionPatterns`，后备为 `messages.groupChat.mentionPatterns`）
    - 已授权群组消息的入站语音便笺转写
    - 隐式回复机器人检测（回复发送者匹配机器人身份）

    安全说明：

    - 引用/回复只满足提及门控；它**不会**授予发送者授权
    - 使用 `groupPolicy: "allowlist"` 时，非 allowlist 发送者即使回复 allowlist 用户的消息，仍会被阻止

    会话级激活命令：

    - `/activation mention`
    - `/activation always`

    `activation` 更新会话状态（不是全局配置）。它受所有者门控。

  </Tab>
</Tabs>

## 个人号码和自聊行为

当已链接的本人号码也出现在 `allowFrom` 中时，WhatsApp 自聊防护会激活：

- 跳过自聊轮次的已读回执
- 忽略否则会 ping 你自己的提及 JID 自动触发行为
- 如果未设置 `messages.responsePrefix`，自聊回复默认使用 `[{identity.name}]` 或 `[openclaw]`

## 消息规范化和上下文

<AccordionGroup>
  <Accordion title="入站信封 + 回复上下文">
    传入的 WhatsApp 消息会包装在共享入站信封中。

    如果存在引用回复，上下文会按以下形式追加：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    可用时也会填充回复元数据字段（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、发送者 JID/E.164）。

  </Accordion>

  <Accordion title="媒体占位符和位置/联系人提取">
    仅媒体的入站消息会用如下占位符规范化：

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    当正文只有 `<media:audio>` 时，已授权群组语音便笺会在提及门控前转写，因此在语音便笺中说出机器人提及可以触发回复。如果转写内容仍未提及机器人，转写会保存在待处理群组历史中，而不是原始占位符。

    位置正文使用简洁的坐标文本。位置标签/评论以及联系人/vCard 详情会渲染为围栏包裹的不受信元数据，而不是内联提示词文本。

  </Accordion>

  <Accordion title="待处理群组历史注入">
    对于群组，未处理消息可以缓冲，并在机器人最终被触发时作为上下文注入。

    - 默认限制：`50`
    - 配置：`channels.whatsapp.historyLimit`
    - 后备：`messages.groupChat.historyLimit`
    - `0` 禁用

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

## 送达、分块和媒体

<AccordionGroup>
  <Accordion title="文本分块">
    - 默认分块限制：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 模式优先使用段落边界（空行），然后回退到长度安全分块

  </Accordion>

  <Accordion title="出站媒体行为">
    - 支持图片、视频、音频（PTT 语音便笺）和文档载荷
    - 音频媒体会通过 Baileys `audio` 载荷并带 `ptt: true` 发送，因此 WhatsApp 客户端会将其呈现为一条一键通语音便笺
    - 回复载荷会保留 `audioAsVoice`；即使提供商返回 MP3 或 WebM，WhatsApp 的 TTS 语音便笺输出也会保持在这条 PTT 路径上
    - 原生 Ogg/Opus 音频会以 `audio/ogg; codecs=opus` 发送，以兼容语音便笺
    - 非 Ogg 音频，包括 Microsoft Edge TTS MP3/WebM 输出，会先用 `ffmpeg` 转码为 48 kHz 单声道 Ogg/Opus，再作为 PTT 发送
    - `/tts latest` 会把最新的助手回复作为一条语音便笺发送，并抑制同一回复的重复发送；`/tts chat on|off|default` 控制当前 WhatsApp 聊天的自动 TTS
    - 通过视频发送中的 `gifPlayback: true` 支持 GIF 动画播放
    - 发送多媒体回复载荷时，说明文字会应用到第一个媒体项；但 PTT 语音便笺会先发送音频，再单独发送可见文本，因为 WhatsApp 客户端对语音便笺说明文字的呈现并不一致
    - 媒体来源可以是 HTTP(S)、`file://` 或本地路径

  </Accordion>

  <Accordion title="媒体大小限制和回退行为">
    - 入站媒体保存上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 出站媒体发送上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 按账号覆盖使用 `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - 图片会自动优化（调整尺寸/质量扫描）以符合限制
    - 媒体发送失败时，首项回退会发送文本警告，而不是静默丢弃响应

  </Accordion>
</AccordionGroup>

## 错误可见性

`channels.whatsapp.exposeErrorText` 控制是否将智能体/提供商错误文本传回 WhatsApp。默认值为 `true`。将其设为 `false` 可在 WhatsApp 上保持故障静默，同时保留其他渠道行为。

```json5
{
  channels: {
    whatsapp: {
      exposeErrorText: false,
    },
  },
}
```

按账号覆盖使用 `channels.whatsapp.accounts.<id>.exposeErrorText`。

## 回复引用

WhatsApp 支持原生回复引用，即出站回复会直观引用入站消息。使用 `channels.whatsapp.replyToMode` 控制它。

| 值          | 行为                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | 从不引用；作为普通消息发送                                            |
| `"first"`   | 只引用第一个出站回复块                                                |
| `"all"`     | 引用每个出站回复块                                                    |
| `"batched"` | 引用排队的批量回复，同时让即时回复不引用                              |

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

| 级别          | 确认反应 | 智能体发起的反应 | 描述                                             |
| ------------- | -------- | ---------------- | ------------------------------------------------ |
| `"off"`       | 否       | 否               | 完全不使用反应                                   |
| `"ack"`       | 是       | 否               | 仅确认反应（回复前回执）                         |
| `"minimal"`   | 是       | 是（保守）       | 确认 + 带保守指导的智能体反应                    |
| `"extensive"` | 是       | 是（鼓励）       | 确认 + 带鼓励指导的智能体反应                    |

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

WhatsApp 支持通过 `channels.whatsapp.ackReaction` 在收到入站消息后立即发送确认反应。
确认反应受 `reactionLevel` 限制，在 `reactionLevel` 为 `"off"` 时会被抑制。

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
- 失败会被记录，但不会阻塞正常回复投递
- 群组模式 `mentions` 会在由提及触发的轮次上作出反应；群组激活 `always` 会作为此检查的绕过
- WhatsApp 使用 `channels.whatsapp.ackReaction`（这里不使用旧版 `messages.ackReaction`）

## 多账号和凭证

<AccordionGroup>
  <Accordion title="账号选择和默认值">
    - 账号 ID 来自 `channels.whatsapp.accounts`
    - 默认账号选择：如果存在则使用 `default`，否则使用第一个已配置的账号 ID（排序后）
    - 账号 ID 会在内部规范化以便查找

  </Accordion>

  <Accordion title="凭证路径和旧版兼容性">
    - 当前认证路径：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 备份文件：`creds.json.bak`
    - `~/.openclaw/credentials/` 中的旧版默认认证仍会在默认账号流程中被识别/迁移

  </Accordion>

  <Accordion title="登出行为">
    `openclaw channels logout --channel whatsapp [--account <id>]` 会清除该账号的 WhatsApp 认证状态。

    在旧版认证目录中，`oauth.json` 会被保留，而 Baileys 认证文件会被移除。

  </Accordion>
</AccordionGroup>

## 工具、操作和配置写入

- 智能体工具支持包括 WhatsApp 反应操作（`react`）。
- 操作门控：
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 渠道发起的配置写入默认启用（通过 `channels.whatsapp.configWrites=false` 禁用）。

## 故障排除

<AccordionGroup>
  <Accordion title="未关联（需要 QR）">
    症状：渠道状态报告未关联。

    修复：

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="已关联但已断开 / 重连循环">
    症状：已关联账号反复断开或尝试重连。

    安静账号可以在普通消息超时后继续保持连接；当 WhatsApp Web 传输活动停止、套接字关闭，或应用层活动静默超过更长的安全窗口时，看门狗会重启。

    如果日志显示反复出现 `status=408 Request Time-out Connection was lost`，请调节 `web.whatsapp` 下的 Baileys 套接字时序。先将 `keepAliveIntervalMs` 缩短到低于你的网络空闲超时，并在较慢或丢包链路上增大 `connectTimeoutMs`：

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

    WhatsApp Web 登录使用 Gateway 网关主机的标准代理环境（`HTTPS_PROXY`、`HTTP_PROXY`、小写变体和 `NO_PROXY`）。确认 Gateway 网关进程继承了代理环境，并且 `NO_PROXY` 不匹配 `mmg.whatsapp.net`。

  </Accordion>

  <Accordion title="发送时没有活动监听器">
    如果目标账号没有活动的 Gateway 网关监听器，出站发送会快速失败。

    确保 Gateway 网关正在运行且账号已关联。

  </Accordion>

  <Accordion title="群组消息被意外忽略">
    按此顺序检查：

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

## 系统提示

WhatsApp 通过 `groups` 和 `direct` 映射，支持 Telegram 风格的群组和直接聊天系统提示。

群组消息的解析层级：

首先确定有效的 `groups` 映射：如果账号定义了自己的 `groups`，它会完全替换根级 `groups` 映射（不进行深度合并）。随后在生成的单一映射上执行提示查找：

1. **群组专属系统提示**（`groups["<groupId>"].systemPrompt`）：当映射中存在特定群组条目**且**其 `systemPrompt` 键已定义时使用。如果 `systemPrompt` 是空字符串（`""`），通配符会被抑制，且不会应用任何系统提示。
2. **群组通配系统提示**（`groups["*"].systemPrompt`）：当映射中完全没有特定群组条目，或该条目存在但未定义 `systemPrompt` 键时使用。

直接消息的解析层级：

首先确定有效的 `direct` 映射：如果账号定义了自己的 `direct`，它会完全替换根级 `direct` 映射（不进行深度合并）。随后在生成的单一映射上执行提示查找：

1. **直接聊天专属系统提示**（`direct["<peerId>"].systemPrompt`）：当映射中存在特定对等方条目**且**其 `systemPrompt` 键已定义时使用。如果 `systemPrompt` 是空字符串（`""`），通配符会被抑制，且不会应用任何系统提示。
2. **直接聊天通配系统提示**（`direct["*"].systemPrompt`）：当映射中完全没有特定对等方条目，或该条目存在但未定义 `systemPrompt` 键时使用。

<Note>
`dms` 仍是轻量级的按私信历史覆盖桶（`dms.<id>.historyLimit`）。提示覆盖位于 `direct` 下。
</Note>

**与 Telegram 多账号行为的区别：** 在 Telegram 中，多账号设置会刻意为所有账号抑制根级 `groups`，即使某些账号没有定义自己的 `groups` 也是如此，以防止机器人接收不属于它的群组消息。WhatsApp 不应用此保护：没有定义账号级覆盖的账号始终会继承根级 `groups` 和根级 `direct`，无论配置了多少个账号。在多账号 WhatsApp 设置中，如果你需要按账号设置群组或直接聊天提示，请在每个账号下显式定义完整映射，而不是依赖根级默认值。

重要行为：

- `channels.whatsapp.groups` 既是按群组配置映射，也是聊天级群组允许列表。在根级或账号作用域中，`groups["*"]` 表示该作用域“允许所有群组”。
- 只有在你已经希望该作用域允许所有群组时，才添加通配群组 `systemPrompt`。如果你仍希望只有固定的一组群组 ID 符合条件，请不要用 `groups["*"]` 作为提示默认值。请改为在每个显式允许列表群组条目上重复该提示。
- 群组准入和发送者授权是独立检查。`groups["*"]` 会扩大可以进入群组处理的群组集合，但它本身不会授权这些群组中的每个发送者。发送者访问仍由 `channels.whatsapp.groupPolicy` 和 `channels.whatsapp.groupAllowFrom` 单独控制。
- `channels.whatsapp.direct` 对私信没有相同副作用。`direct["*"]` 只会在私信已通过 `dmPolicy` 加 `allowFrom` 或配对存储规则准入后，提供默认直接聊天配置。

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

关键 WhatsApp 字段：

- 访问：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`
- 投递：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`、`exposeErrorText`
- 多账号：`accounts.<id>.enabled`、`accounts.<id>.authDir`、账号级覆盖项
- 操作：`configWrites`、`debounceMs`、`web.enabled`、`web.heartbeatSeconds`、`web.reconnect.*`、`web.whatsapp.*`
- 会话行为：`session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`
- 提示词：`groups.<id>.systemPrompt`、`groups["*"].systemPrompt`、`direct.<id>.systemPrompt`、`direct["*"].systemPrompt`

## 相关内容

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [安全](/zh-CN/gateway/security)
- [渠道路由](/zh-CN/channels/channel-routing)
- [多智能体路由](/zh-CN/concepts/multi-agent)
- [故障排除](/zh-CN/channels/troubleshooting)
