---
read_when:
    - 处理 WhatsApp /web 渠道行为或收件箱路由
summary: WhatsApp 渠道支持、访问控制、投递行为和运维
title: WhatsApp
x-i18n:
    generated_at: "2026-04-26T04:44:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 300a8c7ff5768a8da869a4052c01639e7763550adceb40dabc908be44602f352
    source_path: channels/whatsapp.md
    workflow: 15
---

Status：通过 WhatsApp Web（Baileys）达到可用于生产的状态。Gateway 网关拥有已关联的会话。

## 安装（按需）

- 新手引导（`openclaw onboard`）和 `openclaw channels add --channel whatsapp`
  会在你第一次选择 WhatsApp 插件时提示安装。
- `openclaw channels login --channel whatsapp` 也会在
  插件尚未安装时提供安装流程。
- 开发渠道 + git 检出：默认使用本地插件路径。
- Stable/Beta：默认使用 npm 包 `@openclaw/whatsapp`。

也可以继续使用手动安装：

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    对未知发送者的默认私信策略是配对。
  </Card>
  <Card title="渠道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断与修复手册。
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

  <Step title="关联 WhatsApp（QR）">

```bash
openclaw channels login --channel whatsapp
```

    针对特定账号：

```bash
openclaw channels login --channel whatsapp --account work
```

    如需在登录前附加现有 / 自定义的 WhatsApp Web 认证目录：

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

    配对请求会在 1 小时后过期。每个渠道最多保留 3 个待处理请求。

  </Step>
</Steps>

<Note>
OpenClaw 建议尽可能为 WhatsApp 使用单独的号码。（渠道元数据和设置流程针对这种部署进行了优化，但也支持个人号码部署。）
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
    新手引导支持个人号码模式，并会写入适合自聊的基线配置：

    - `dmPolicy: "allowlist"`
    - `allowFrom` 包含你的个人号码
    - `selfChatMode: true`

    在运行时，自聊保护基于已关联的自身号码和 `allowFrom` 生效。

  </Accordion>

  <Accordion title="仅限 WhatsApp Web 的渠道范围">
    在当前 OpenClaw 渠道架构中，消息平台渠道基于 WhatsApp Web（`Baileys`）。

    内置聊天渠道注册表中没有单独的 Twilio WhatsApp 消息渠道。

  </Accordion>
</AccordionGroup>

## 运行时模型

- Gateway 网关拥有 WhatsApp socket 和重连循环。
- 出站发送要求目标账号存在活动中的 WhatsApp 监听器。
- 会忽略 Status 和 broadcast 聊天（`@status`、`@broadcast`）。
- 私聊使用私信会话规则（`session.dmScope`；默认 `main` 会把私信折叠到智能体主会话）。
- 群组会话彼此隔离（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Web 传输遵循 Gateway 网关主机上的标准代理环境变量（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小写变体）。优先使用主机级代理配置，而不是渠道特定的 WhatsApp 代理设置。
- 启用 `messages.removeAckAfterReply` 时，OpenClaw 会在可见回复送达后清除 WhatsApp 的 ack 反应。

## 插件钩子和隐私

WhatsApp 入站消息可能包含个人消息内容、电话号码、
群组标识符、发送者名称以及会话关联字段。因此，
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

你也可以把这个选择启用范围限定到某个账号：

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

仅在你信任相关插件可以接收入站 WhatsApp 消息内容和标识符时启用此功能。

## 访问控制和激活

<Tabs>
  <Tab title="私信策略">
    `channels.whatsapp.dmPolicy` 控制私聊访问：

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    `allowFrom` 接受 E.164 风格号码（内部会标准化）。

    多账号覆盖：对于该账号，`channels.whatsapp.accounts.<id>.dmPolicy`（以及 `allowFrom`）优先于渠道级默认值。

    运行时行为细节：

    - 配对会持久化到渠道 allow-store，并与已配置的 `allowFrom` 合并
    - 如果未配置任何 allowlist，默认允许已关联的自身号码
    - OpenClaw 绝不会自动配对出站 `fromMe` 私信（即你从已关联设备发给自己的消息）

  </Tab>

  <Tab title="群组策略 + allowlist">
    群组访问有两层：

    1. **群组成员 allowlist**（`channels.whatsapp.groups`）
       - 如果省略 `groups`，则所有群组都有资格
       - 如果存在 `groups`，它就作为群组 allowlist（允许 `"*"`）

    2. **群组发送者策略**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`：绕过发送者 allowlist
       - `allowlist`：发送者必须匹配 `groupAllowFrom`（或 `*`）
       - `disabled`：阻止所有群组入站消息

    发送者 allowlist 回退：

    - 如果未设置 `groupAllowFrom`，运行时会在可用时回退到 `allowFrom`
    - 发送者 allowlist 会在提及 / 回复激活之前进行评估

    注意：如果完全不存在 `channels.whatsapp` 配置块，运行时群组策略回退为 `allowlist`（并记录警告日志），即使设置了 `channels.defaults.groupPolicy` 也是如此。

  </Tab>

  <Tab title="提及 + /activation">
    默认情况下，群组回复需要被提及。

    提及检测包括：

    - 对机器人身份的显式 WhatsApp 提及
    - 已配置的提及正则模式（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）
    - 隐式回复机器人检测（回复目标发送者与机器人身份匹配）

    安全说明：

    - 引用 / 回复只能满足提及门控；它**不会**授予发送者授权
    - 当 `groupPolicy: "allowlist"` 时，即使非 allowlist 发送者回复了 allowlist 用户的消息，仍会被阻止

    会话级激活命令：

    - `/activation mention`
    - `/activation always`

    `activation` 会更新会话状态（而不是全局配置）。它受所有者权限控制。

  </Tab>
</Tabs>

## 个人号码和自聊行为

当已关联的自身号码也存在于 `allowFrom` 中时，WhatsApp 自聊保护会启用：

- 跳过自聊轮次的已读回执
- 忽略原本会提醒你自己的 mention-JID 自动触发行为
- 如果未设置 `messages.responsePrefix`，自聊回复默认使用 `[{identity.name}]` 或 `[openclaw]`

## 消息标准化和上下文

<AccordionGroup>
  <Accordion title="入站信封 + 回复上下文">
    入站 WhatsApp 消息会封装到共享的入站信封中。

    如果存在引用回复，会以如下形式附加上下文：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    在可用时，还会填充回复元数据字段（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、发送者 JID/E.164）。

  </Accordion>

  <Accordion title="媒体占位符以及位置 / 联系人提取">
    仅媒体的入站消息会使用如下占位符进行标准化：

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    位置消息正文会使用简洁的坐标文本。位置标签 / 注释以及联系人 / vCard 详情会渲染为带围栏的不可信元数据，而不是内联提示词文本。

  </Accordion>

  <Accordion title="待处理群组历史注入">
    对于群组，在机器人最终被触发时，可以缓冲尚未处理的消息并作为上下文注入。

    - 默认限制：`50`
    - 配置：`channels.whatsapp.historyLimit`
    - 回退：`messages.groupChat.historyLimit`
    - `0` 表示禁用

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
    - `newline` 模式优先按段落边界（空行）拆分，然后回退到按长度安全分块
  </Accordion>

  <Accordion title="出站媒体行为">
    - 支持图片、视频、音频（PTT 语音便笺）和文档负载
    - 音频媒体通过 Baileys 的 `audio` 负载发送，并设置 `ptt: true`，因此 WhatsApp 客户端会将其渲染为按住说话语音便笺
    - 回复负载会保留 `audioAsVoice`；WhatsApp 的 TTS 语音便笺输出即使提供商返回 MP3 或 WebM，也会继续走这个 PTT 路径
    - 原生 Ogg/Opus 音频会以 `audio/ogg; codecs=opus` 发送，以确保语音便笺兼容性
    - 非 Ogg 音频，包括 Microsoft Edge TTS MP3/WebM 输出，会在 PTT 投递前使用 `ffmpeg` 转码为 48 kHz 单声道 Ogg/Opus
    - `/tts latest` 会将最近一条助手回复作为单条语音便笺发送，并抑制对同一条回复的重复发送；`/tts chat on|off|default` 控制当前 WhatsApp 聊天的自动 TTS
    - 动态 GIF 播放通过视频发送上的 `gifPlayback: true` 提供支持
    - 发送多媒体回复负载时，标题说明会应用到第一个媒体项；但 PTT 语音便笺会先发送音频，再单独发送可见文本，因为 WhatsApp 客户端对语音便笺标题说明的渲染并不一致
    - 媒体源可以是 HTTP(S)、`file://` 或本地路径
  </Accordion>

  <Accordion title="媒体大小限制和回退行为">
    - 入站媒体保存上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 出站媒体发送上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 按账号覆盖使用 `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - 图片会自动优化（调整尺寸 / 质量扫描）以适配限制
    - 媒体发送失败时，首项回退会发送文本警告，而不是静默丢弃回复
  </Accordion>
</AccordionGroup>

## 回复引用

WhatsApp 支持原生回复引用，也就是出站回复会以可见方式引用入站消息。可通过 `channels.whatsapp.replyToMode` 控制。

| 值          | 行为                                                                 |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | 从不引用；作为普通消息发送                                           |
| `"first"`   | 仅引用第一段出站回复分块                                             |
| `"all"`     | 引用每一段出站回复分块                                               |
| `"batched"` | 引用排队的批量回复，同时让即时回复保持不引用                         |

默认值是 `"off"`。按账号覆盖使用 `channels.whatsapp.accounts.<id>.replyToMode`。

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

`channels.whatsapp.reactionLevel` 控制智能体在 WhatsApp 上使用 emoji 反应的范围：

| 级别          | Ack 反应 | 智能体主动反应          | 说明                               |
| ------------- | -------- | ----------------------- | ---------------------------------- |
| `"off"`       | 否       | 否                      | 完全不使用反应                     |
| `"ack"`       | 是       | 否                      | 仅使用 Ack 反应（回复前确认接收）  |
| `"minimal"`   | 是       | 是（保守）              | Ack + 智能体反应，采用保守指引     |
| `"extensive"` | 是       | 是（鼓励）              | Ack + 智能体反应，采用鼓励性指引   |

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

WhatsApp 支持通过 `channels.whatsapp.ackReaction` 在接收入站消息时立即发送 Ack 反应。
Ack 反应受 `reactionLevel` 控制——当 `reactionLevel` 为 `"off"` 时会被抑制。

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
- 失败会记录日志，但不会阻止正常回复投递
- 群组模式 `mentions` 会在由提及触发的轮次发送反应；群组激活 `always` 会绕过此检查
- WhatsApp 使用 `channels.whatsapp.ackReaction`（这里不使用旧版 `messages.ackReaction`）

## 多账号和凭证

<AccordionGroup>
  <Accordion title="账号选择和默认值">
    - 账号 id 来自 `channels.whatsapp.accounts`
    - 默认账号选择：如果存在 `default` 则使用它，否则使用第一个已配置的账号 id（已排序）
    - 账号 id 会在内部标准化以便查找
  </Accordion>

  <Accordion title="凭证路径和旧版兼容性">
    - 当前认证路径：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 备份文件：`creds.json.bak`
    - `~/.openclaw/credentials/` 中的旧版默认认证仍会被识别 / 迁移，用于默认账号流程
  </Accordion>

  <Accordion title="登出行为">
    `openclaw channels logout --channel whatsapp [--account <id>]` 会清除该账号的 WhatsApp 认证状态。

    在旧版认证目录中，会保留 `oauth.json`，同时移除 Baileys 认证文件。

  </Accordion>
</AccordionGroup>

## 工具、动作和配置写入

- 智能体工具支持包括 WhatsApp 反应动作（`react`）。
- 动作门控：
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 默认启用由渠道发起的配置写入（可通过 `channels.whatsapp.configWrites=false` 禁用）。

## 故障排除

<AccordionGroup>
  <Accordion title="未关联（需要 QR）">
    症状：渠道状态显示未关联。

    解决方法：

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="已关联但断开 / 重连循环">
    症状：账号已关联，但反复断开或不断尝试重连。

    解决方法：

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    如有需要，可使用 `channels login` 重新关联。

  </Accordion>

  <Accordion title="发送时没有活动监听器">
    当目标账号没有活动中的 Gateway 网关监听器时，出站发送会快速失败。

    请确保 Gateway 网关正在运行，且该账号已关联。

  </Accordion>

  <Accordion title="群组消息意外被忽略">
    按以下顺序检查：

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` allowlist 条目
    - 提及门控（`requireMention` + mention patterns）
    - `openclaw.json`（JSON5）中的重复键：后面的条目会覆盖前面的条目，因此每个作用域只保留一个 `groupPolicy`

  </Accordion>

  <Accordion title="Bun 运行时警告">
    WhatsApp Gateway 网关运行时应使用 Node。Bun 被标记为与稳定的 WhatsApp / Telegram Gateway 网关运行不兼容。
  </Accordion>
</AccordionGroup>

## 系统提示词

WhatsApp 支持类似 Telegram 的群组和私聊系统提示词，分别通过 `groups` 和 `direct` 映射配置。

群组消息的解析层级：

首先确定生效的 `groups` 映射：如果账号定义了自己的 `groups`，它会完全替换根级 `groups` 映射（不做深度合并）。随后会在得到的这个单一映射上执行提示词查找：

1. **群组专用系统提示词**（`groups["<groupId>"].systemPrompt`）：当映射中存在该特定群组条目，**且**其定义了 `systemPrompt` 键时使用。如果 `systemPrompt` 是空字符串（`""`），则会抑制通配符，不应用任何系统提示词。
2. **群组通配符系统提示词**（`groups["*"].systemPrompt`）：当映射中完全不存在该特定群组条目，或该条目存在但未定义 `systemPrompt` 键时使用。

私信的解析层级：

首先确定生效的 `direct` 映射：如果账号定义了自己的 `direct`，它会完全替换根级 `direct` 映射（不做深度合并）。随后会在得到的这个单一映射上执行提示词查找：

1. **私聊专用系统提示词**（`direct["<peerId>"].systemPrompt`）：当映射中存在该特定对端条目，**且**其定义了 `systemPrompt` 键时使用。如果 `systemPrompt` 是空字符串（`""`），则会抑制通配符，不应用任何系统提示词。
2. **私聊通配符系统提示词**（`direct["*"].systemPrompt`）：当映射中完全不存在该特定对端条目，或该条目存在但未定义 `systemPrompt` 键时使用。

注意：`dms` 仍然是轻量级的逐私信历史覆盖配置桶（`dms.<id>.historyLimit`）；提示词覆盖配置位于 `direct` 下。

**与 Telegram 多账号行为的区别：** 在 Telegram 中，多账号设置下会有意抑制所有账号的根级 `groups`——即使某些账号没有定义自己的 `groups` 也是如此——以防机器人接收到它不属于的群组消息。WhatsApp 不应用这一保护：无论配置了多少账号，没有定义账号级覆盖的账号始终会继承根级 `groups` 和根级 `direct`。在多账号 WhatsApp 设置中，如果你希望为每个账号配置不同的群组或私聊提示词，请在每个账号下显式定义完整映射，而不要依赖根级默认值。

重要行为：

- `channels.whatsapp.groups` 同时是逐群组配置映射和聊天级群组 allowlist。在根级或账号作用域中，`groups["*"]` 表示该作用域“允许所有群组接入”。
- 只有在你本来就希望该作用域允许所有群组时，才添加通配符群组 `systemPrompt`。如果你仍希望只有固定的一组群组 id 可以使用，请不要用 `groups["*"]` 作为默认提示词。应改为在每个显式加入 allowlist 的群组条目上重复设置提示词。
- 群组准入和发送者授权是两个独立检查。`groups["*"]` 会扩大可以进入群组处理流程的群组集合，但它本身不会授权这些群组中的每个发送者。发送者访问仍单独由 `channels.whatsapp.groupPolicy` 和 `channels.whatsapp.groupAllowFrom` 控制。
- `channels.whatsapp.direct` 对私信没有同样的副作用。`direct["*"]` 只会在私信已经通过 `dmPolicy` 加上 `allowFrom` 或 pairing-store 规则被允许后，提供默认的私聊配置。

示例：

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // 仅在根级作用域确实应允许所有群组时使用。
        // 适用于所有未定义自己 groups 映射的账号。
        "*": { systemPrompt: "所有群组的默认提示词。" },
      },
      direct: {
        // 适用于所有未定义自己 direct 映射的账号。
        "*": { systemPrompt: "所有私聊的默认提示词。" },
      },
      accounts: {
        work: {
          groups: {
            // 该账号定义了自己的 groups，因此根级 groups 会被完全
            // 替换。若要保留通配符，这里也要显式定义 "*"。
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "专注于项目管理。",
            },
            // 仅在该账号中确实应允许所有群组时使用。
            "*": { systemPrompt: "工作群组的默认提示词。" },
          },
          direct: {
            // 该账号定义了自己的 direct 映射，因此根级 direct 条目会被
            // 完全替换。若要保留通配符，这里也要显式定义 "*"。
            "+15551234567": { systemPrompt: "特定工作私聊的提示词。" },
            "*": { systemPrompt: "工作私聊的默认提示词。" },
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

高信号 WhatsApp 字段：

- 访问控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`
- 投递：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`
- 多账号：`accounts.<id>.enabled`、`accounts.<id>.authDir`、账号级覆盖
- 运维：`configWrites`、`debounceMs`、`web.enabled`、`web.heartbeatSeconds`、`web.reconnect.*`
- 会话行为：`session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`
- 提示词：`groups.<id>.systemPrompt`、`groups["*"].systemPrompt`、`direct.<id>.systemPrompt`、`direct["*"].systemPrompt`

## 相关内容

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [安全](/zh-CN/gateway/security)
- [渠道路由](/zh-CN/channels/channel-routing)
- [多智能体路由](/zh-CN/concepts/multi-agent)
- [故障排除](/zh-CN/channels/troubleshooting)
