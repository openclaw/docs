---
read_when:
    - 处理 WhatsApp/web 渠道行为或收件箱路由
summary: WhatsApp 渠道支持、访问控制、投递行为和运维
title: WhatsApp
x-i18n:
    generated_at: "2026-04-26T03:01:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 120033548f60a39619952e908bd4925dc7da5f8baaa4406ed455aa46010fbb2e
    source_path: channels/whatsapp.md
    workflow: 15
---

Status：通过 WhatsApp Web（Baileys）达到生产可用状态。Gateway 网关拥有已关联的会话。

## 安装（按需）

- 新手引导（`openclaw onboard`）和 `openclaw channels add --channel whatsapp`
  会在你首次选择 WhatsApp 插件时提示安装它。
- `openclaw channels login --channel whatsapp` 也会在插件尚未安装时提供安装流程。
- 开发渠道 + git 检出：默认使用本地插件路径。
- Stable/Beta：默认使用 npm 包 `@openclaw/whatsapp`。

也可以继续使用手动安装：

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    未知发件人的默认私信策略是配对。
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

  <Step title="关联 WhatsApp（QR）">

```bash
openclaw channels login --channel whatsapp
```

    对于特定账户：

```bash
openclaw channels login --channel whatsapp --account work
```

    要在登录前附加现有/自定义的 WhatsApp Web 认证目录：

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

  <Step title="批准首次配对请求（如果使用配对模式）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    配对请求会在 1 小时后过期。每个渠道最多保留 3 个待处理请求。

  </Step>
</Steps>

<Note>
OpenClaw 建议尽可能为 WhatsApp 使用单独的号码。（渠道元数据和设置流程已针对这种设置优化，但也支持个人号码设置。）
</Note>

## 部署模式

<AccordionGroup>
  <Accordion title="专用号码（推荐）">
    这是最简洁的运维模式：

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
    在当前的 OpenClaw 渠道架构中，消息平台渠道基于 WhatsApp Web（`Baileys`）。

    内置聊天渠道注册表中没有单独的 Twilio WhatsApp 消息渠道。

  </Accordion>
</AccordionGroup>

## 运行时模型

- Gateway 网关拥有 WhatsApp socket 和重连循环。
- 出站发送要求目标账户存在活动的 WhatsApp 监听器。
- Status 和广播聊天会被忽略（`@status`、`@broadcast`）。
- 直接聊天使用私信会话规则（`session.dmScope`；默认 `main` 会将私信折叠到智能体主会话）。
- 群组会话彼此隔离（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Web 传输遵循 Gateway 网关主机上的标准代理环境变量（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` 及其小写变体）。优先使用主机级代理配置，而不是渠道专用的 WhatsApp 代理设置。

## 插件钩子与隐私

WhatsApp 入站消息可能包含个人消息内容、电话号码、
群组标识符、发件人姓名以及会话关联字段。因此，
除非你明确选择启用，否则 WhatsApp 不会向插件广播入站
`message_received` hook 负载：

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

你也可以将此选择启用范围限制到单个账户：

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

仅当你信任插件可以接收入站 WhatsApp 消息内容和标识符时，
才启用此功能。

## 访问控制与激活

<Tabs>
  <Tab title="私信策略">
    `channels.whatsapp.dmPolicy` 控制直接聊天访问：

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    `allowFrom` 接受 E.164 风格的号码（内部会进行规范化）。

    多账户覆盖：对于该账户，`channels.whatsapp.accounts.<id>.dmPolicy`（以及 `allowFrom`）优先于渠道级默认值。

    运行时行为细节：

    - 配对会持久化到渠道 allow-store，并与已配置的 `allowFrom` 合并
    - 如果未配置 allowlist，默认允许已关联的自身号码
    - OpenClaw 绝不会自动配对出站 `fromMe` 私信（即你从已关联设备发给自己的消息）

  </Tab>

  <Tab title="群组策略 + allowlist">
    群组访问分为两层：

    1. **群组成员 allowlist**（`channels.whatsapp.groups`）
       - 如果省略 `groups`，则所有群组都有资格
       - 如果存在 `groups`，它会作为群组 allowlist（允许 `"*"`）

    2. **群组发件人策略**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`：绕过发件人 allowlist
       - `allowlist`：发件人必须匹配 `groupAllowFrom`（或 `*`）
       - `disabled`：阻止所有群组入站消息

    发件人 allowlist 回退：

    - 如果未设置 `groupAllowFrom`，运行时会在可用时回退到 `allowFrom`
    - 发件人 allowlist 会在提及/回复激活之前进行评估

    注意：如果根本不存在 `channels.whatsapp` 配置块，运行时的群组策略回退为 `allowlist`（并记录警告日志），即使设置了 `channels.defaults.groupPolicy` 也是如此。

  </Tab>

  <Tab title="提及 + /activation">
    群组回复默认需要被提及。

    提及检测包括：

    - 对机器人身份的显式 WhatsApp 提及
    - 已配置的提及正则模式（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）
    - 隐式回复机器人的检测（回复发送者匹配机器人身份）

    安全说明：

    - 引用/回复仅满足提及门控；它**不会**授予发件人授权
    - 当 `groupPolicy: "allowlist"` 时，即使非 allowlist 发件人回复了 allowlist 用户的消息，仍会被阻止

    会话级激活命令：

    - `/activation mention`
    - `/activation always`

    `activation` 会更新会话状态（而非全局配置）。它受所有者权限控制。

  </Tab>
</Tabs>

## 个人号码与自聊行为

当已关联的自身号码同时存在于 `allowFrom` 中时，WhatsApp 自聊保护会启用：

- 跳过自聊回合的已读回执
- 忽略原本会触发给自己发送提醒的 mention-JID 自动触发行为
- 如果未设置 `messages.responsePrefix`，自聊回复默认使用 `[{identity.name}]` 或 `[openclaw]`

## 消息规范化与上下文

<AccordionGroup>
  <Accordion title="入站信封 + 回复上下文">
    传入的 WhatsApp 消息会被包装到共享的入站信封中。

    如果存在引用回复，上下文会以如下形式追加：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    回复元数据字段也会在可用时填充（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、发件人 JID/E.164）。

  </Accordion>

  <Accordion title="媒体占位符以及位置/联系人提取">
    仅含媒体的入站消息会被规范化为如下占位符：

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    位置消息正文使用简洁的坐标文本。位置标签/备注以及联系人/vCard 详情会渲染为带围栏的不受信任元数据，而不是内联提示文本。

  </Accordion>

  <Accordion title="待处理群组历史注入">
    对于群组，当机器人最终被触发时，未处理消息可以被缓冲并作为上下文注入。

    - 默认上限：`50`
    - 配置：`channels.whatsapp.historyLimit`
    - 回退：`messages.groupChat.historyLimit`
    - `0` 表示禁用

    注入标记：

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="已读回执">
    默认会为已接受的入站 WhatsApp 消息发送已读回执。

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

    即使全局启用，自聊回合也会跳过已读回执。

  </Accordion>
</AccordionGroup>

## 投递、分块和媒体

<AccordionGroup>
  <Accordion title="文本分块">
    - 默认分块上限：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 模式优先按段落边界（空行）切分，然后再回退到按长度安全分块
  </Accordion>

  <Accordion title="出站媒体行为">
    - 支持图片、视频、音频（PTT 语音便笺）和文档负载
    - 音频媒体通过 Baileys 的 `audio` 负载发送，并设置 `ptt: true`，因此 WhatsApp 客户端会将其渲染为按住说话语音便笺
    - 回复负载会保留 `audioAsVoice`；WhatsApp 的 TTS 语音便笺输出即使提供商返回的是 MP3 或 WebM，也会继续走这个 PTT 路径
    - 原生 Ogg/Opus 音频会以 `audio/ogg; codecs=opus` 发送，以兼容语音便笺
    - 非 Ogg 音频（包括 Microsoft Edge TTS 的 MP3/WebM 输出）会在 PTT 投递前通过 `ffmpeg` 转码为 48 kHz 单声道 Ogg/Opus
    - `/tts latest` 会将最近一次助手回复作为单条语音便笺发送，并抑制对同一回复的重复发送；`/tts chat on|off|default` 控制当前 WhatsApp 聊天的自动 TTS
    - 发送视频时支持通过 `gifPlayback: true` 播放动图 GIF
    - 发送多媒体回复负载时，说明文字会应用到第一项媒体；但 PTT 语音便笺会先发送音频，再单独发送可见文本，因为 WhatsApp 客户端对语音便笺说明文字的渲染并不一致
    - 媒体来源可以是 HTTP(S)、`file://` 或本地路径
  </Accordion>

  <Accordion title="媒体大小限制与回退行为">
    - 入站媒体保存上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 出站媒体发送上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 按账户覆盖使用 `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - 图片会自动优化（尺寸/质量扫描）以适配限制
    - 媒体发送失败时，首项回退会发送文本警告，而不是静默丢弃响应
  </Accordion>
</AccordionGroup>

## 回复引用

WhatsApp 支持原生回复引用，即出站回复会以可见方式引用入站消息。可通过 `channels.whatsapp.replyToMode` 控制。

| 值 | 行为 |
| ----------- | --------------------------------------------------------------------- |
| `"off"` | 从不引用；作为普通消息发送 |
| `"first"` | 仅引用第一段出站回复分块 |
| `"all"` | 引用每一段出站回复分块 |
| `"batched"` | 引用排队的批量回复，同时保持即时回复不引用 |

默认值为 `"off"`。按账户覆盖使用 `channels.whatsapp.accounts.<id>.replyToMode`。

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

`channels.whatsapp.reactionLevel` 控制智能体在 WhatsApp 上使用表情 प्रतिक्रिया的范围：

| 级别 | 确认反应 | 智能体主动反应 | 描述 |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"` | 否 | 否 | 完全不使用反应 |
| `"ack"` | 是 | 否 | 仅确认反应（回复前回执） |
| `"minimal"` | 是 | 是（保守） | 确认反应 + 带保守指导的智能体反应 |
| `"extensive"` | 是 | 是（鼓励） | 确认反应 + 带鼓励指导的智能体反应 |

默认值：`"minimal"`。

按账户覆盖使用 `channels.whatsapp.accounts.<id>.reactionLevel`。

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

WhatsApp 支持通过 `channels.whatsapp.ackReaction` 在接收入站消息时立即发送确认反应。
确认反应受 `reactionLevel` 控制——当 `reactionLevel` 为 `"off"` 时会被抑制。

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
- 失败会被记录日志，但不会阻止正常回复投递
- 群组模式 `mentions` 会在由提及触发的回合发送反应；群组激活 `always` 可绕过此检查
- WhatsApp 使用 `channels.whatsapp.ackReaction`（此处不使用旧版 `messages.ackReaction`）

## 多账户与凭证

<AccordionGroup>
  <Accordion title="账户选择与默认值">
    - 账户 id 来自 `channels.whatsapp.accounts`
    - 默认账户选择：如果存在 `default` 则使用它，否则使用第一个已配置的账户 id（排序后）
    - 账户 id 会在内部规范化以供查找
  </Accordion>

  <Accordion title="凭证路径与旧版兼容性">
    - 当前认证路径：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 备份文件：`creds.json.bak`
    - `~/.openclaw/credentials/` 中的旧版默认认证仍会被识别/迁移，用于默认账户流程
  </Accordion>

  <Accordion title="登出行为">
    `openclaw channels logout --channel whatsapp [--account <id>]` 会清除该账户的 WhatsApp 认证状态。

    在旧版认证目录中，会保留 `oauth.json`，同时移除 Baileys 认证文件。

  </Accordion>
</AccordionGroup>

## 工具、操作与配置写入

- 智能体工具支持包括 WhatsApp reaction 操作（`react`）。
- 操作门控：
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 默认启用由渠道发起的配置写入（可通过 `channels.whatsapp.configWrites=false` 禁用）。

## 故障排除

<AccordionGroup>
  <Accordion title="未关联（需要 QR）">
    症状：渠道 Status 报告未关联。

    修复方法：

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="已关联但已断开 / 重连循环">
    症状：已关联账户反复断开或尝试重连。

    修复方法：

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    如有需要，可使用 `channels login` 重新关联。

  </Accordion>

  <Accordion title="发送时没有活动监听器">
    当目标账户不存在活动的 Gateway 网关监听器时，出站发送会快速失败。

    请确保 Gateway 网关正在运行，并且该账户已关联。

  </Accordion>

  <Accordion title="群组消息意外被忽略">
    按以下顺序检查：

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` allowlist 条目
    - 提及门控（`requireMention` + 提及模式）
    - `openclaw.json`（JSON5）中的重复键：后面的条目会覆盖前面的条目，因此每个作用域只保留一个 `groupPolicy`

  </Accordion>

  <Accordion title="Bun 运行时警告">
    WhatsApp Gateway 网关运行时应使用 Node。Bun 被标记为不兼容稳定的 WhatsApp/Telegram Gateway 网关运行。
  </Accordion>
</AccordionGroup>

## 系统提示词

WhatsApp 支持类似 Telegram 的群组和直接聊天系统提示词，通过 `groups` 和 `direct` 映射实现。

群组消息的解析层级：

首先确定生效的 `groups` 映射：如果账户定义了自己的 `groups`，它会完全替换根级 `groups` 映射（不进行深度合并）。随后提示词查找会在得到的单一映射上进行：

1. **群组专属系统提示词**（`groups["<groupId>"].systemPrompt`）：当映射中存在该特定群组条目，**且**其定义了 `systemPrompt` 键时使用。如果 `systemPrompt` 是空字符串（`""`），则会抑制通配符，不应用任何系统提示词。
2. **群组通配符系统提示词**（`groups["*"].systemPrompt`）：当映射中完全不存在该特定群组条目，或者该条目存在但未定义 `systemPrompt` 键时使用。

直接消息的解析层级：

首先确定生效的 `direct` 映射：如果账户定义了自己的 `direct`，它会完全替换根级 `direct` 映射（不进行深度合并）。随后提示词查找会在得到的单一映射上进行：

1. **直接消息专属系统提示词**（`direct["<peerId>"].systemPrompt`）：当映射中存在该特定对端条目，**且**其定义了 `systemPrompt` 键时使用。如果 `systemPrompt` 是空字符串（`""`），则会抑制通配符，不应用任何系统提示词。
2. **直接消息通配符系统提示词**（`direct["*"].systemPrompt`）：当映射中完全不存在该特定对端条目，或者该条目存在但未定义 `systemPrompt` 键时使用。

注意：`dms` 仍然是轻量级的按私信历史覆盖桶（`dms.<id>.historyLimit`）；提示词覆盖位于 `direct` 下。

**与 Telegram 多账户行为的区别：** 在 Telegram 中，在多账户设置里，根级 `groups` 会被有意地对所有账户抑制——即便那些账户没有定义自己的 `groups`——以防机器人接收到其并不属于的群组消息。WhatsApp 不应用这项保护：无论配置了多少个账户，对于未定义账户级覆盖的账户，根级 `groups` 和根级 `direct` 都始终会被继承。在多账户 WhatsApp 设置中，如果你希望为每个账户设置群组或直接消息提示词，请在每个账户下显式定义完整映射，而不是依赖根级默认值。

重要行为：

- `channels.whatsapp.groups` 同时是按群组的配置映射和聊天级群组 allowlist。在根级或账户级作用域中，`groups["*"]` 表示该作用域“允许所有群组”。
- 只有在你本来就希望该作用域允许所有群组时，才添加通配符群组 `systemPrompt`。如果你仍然只希望固定的一组群组 id 有资格使用，不要将 `groups["*"]` 用作提示词默认值。相反，应在每个明确加入 allowlist 的群组条目上重复填写该提示词。
- 群组准入和发件人授权是两个独立检查。`groups["*"]` 会扩大可以进入群组处理流程的群组集合，但它本身不会授权这些群组中的每一个发件人。发件人访问仍然由 `channels.whatsapp.groupPolicy` 和 `channels.whatsapp.groupAllowFrom` 单独控制。
- `channels.whatsapp.direct` 对私信没有相同的副作用。`direct["*"]` 仅在私信已经通过 `dmPolicy` 加上 `allowFrom` 或配对存储规则被允许之后，提供默认的直接聊天配置。

示例：

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Only use if all groups should be admitted at the root scope.
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

主要参考：

- [配置参考 - WhatsApp](/zh-CN/gateway/config-channels#whatsapp)

高信号 WhatsApp 字段：

- 访问控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`
- 投递：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`
- 多账户：`accounts.<id>.enabled`、`accounts.<id>.authDir`、账户级覆盖
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
