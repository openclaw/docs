---
read_when:
    - 处理 WhatsApp/web 渠道行为或收件箱路由
summary: WhatsApp 渠道支持、访问控制、投递行为与运维操作
title: WhatsApp
x-i18n:
    generated_at: "2026-04-24T03:37:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0261e132d459c91f5d81d5ad9485acbdf5792e6bfc8cd33bb74e45192df9fd2f
    source_path: channels/whatsapp.md
    workflow: 15
---

状态：通过 WhatsApp Web（Baileys）达到生产就绪。Gateway 网关管理已关联的会话。

## 安装（按需）

- 新手引导（`openclaw onboard`）和 `openclaw channels add --channel whatsapp`
  会在你首次选择 WhatsApp 插件时提示安装。
- `openclaw channels login --channel whatsapp` 也会在
  插件尚未安装时提供安装流程。
- 开发渠道 + git checkout：默认使用本地插件路径。
- Stable/Beta：默认使用 npm 包 `@openclaw/whatsapp`。

你仍然可以手动安装：

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    未知发送者的默认私信策略是配对。
  </Card>
  <Card title="渠道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断与修复手册。
  </Card>
  <Card title="Gateway 网关配置" icon="settings" href="/zh-CN/gateway/configuration">
    完整的渠道配置模式与示例。
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

  <Step title="关联 WhatsApp（QR 码）">

```bash
openclaw channels login --channel whatsapp
```

    对于特定账户：

```bash
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
OpenClaw 建议尽可能为 WhatsApp 使用独立号码。（渠道元数据和设置流程已针对这种设置进行了优化，但也支持个人号码设置。）
</Note>

## 部署模式

<AccordionGroup>
  <Accordion title="专用号码（推荐）">
    这是最清晰的运维模式：

    - 为 OpenClaw 使用独立的 WhatsApp 身份
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

  <Accordion title="个人号码回退方案">
    新手引导支持个人号码模式，并会写入一个对自聊友好的基线配置：

    - `dmPolicy: "allowlist"`
    - `allowFrom` 包含你的个人号码
    - `selfChatMode: true`

    在运行时，自聊保护会基于已关联的自身号码和 `allowFrom` 生效。

  </Accordion>

  <Accordion title="仅限 WhatsApp Web 的渠道范围">
    在当前 OpenClaw 渠道架构中，消息平台渠道基于 WhatsApp Web（`Baileys`）。

    内置聊天渠道注册表中没有单独的 Twilio WhatsApp 消息渠道。

  </Accordion>
</AccordionGroup>

## 运行时模型

- Gateway 网关管理 WhatsApp socket 和重连循环。
- 出站发送要求目标账户存在活跃的 WhatsApp 监听器。
- 状态和广播聊天会被忽略（`@status`、`@broadcast`）。
- 私聊使用私信会话规则（`session.dmScope`；默认 `main` 会将私信合并到智能体主会话）。
- 群组会话彼此隔离（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Web 传输遵循 Gateway 网关主机上的标准代理环境变量（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` 及其小写变体）。优先使用主机级代理配置，而不是 WhatsApp 渠道专用代理设置。

## 访问控制与激活

<Tabs>
  <Tab title="私信策略">
    `channels.whatsapp.dmPolicy` 控制私聊访问：

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    `allowFrom` 接受 E.164 风格的号码（内部会进行规范化）。

    多账户覆盖：对于该账户，`channels.whatsapp.accounts.<id>.dmPolicy`（以及 `allowFrom`）优先于渠道级默认值。

    运行时行为细节：

    - 配对会持久化到渠道允许存储中，并与已配置的 `allowFrom` 合并
    - 如果未配置允许列表，则默认允许已关联的自身号码
    - OpenClaw 永远不会自动配对出站的 `fromMe` 私信（即你从已关联设备发送给自己的消息）

  </Tab>

  <Tab title="群组策略 + 允许列表">
    群组访问分为两层：

    1. **群组成员资格允许列表**（`channels.whatsapp.groups`）
       - 如果省略 `groups`，则所有群组都有资格
       - 如果存在 `groups`，它会充当群组允许列表（允许使用 `"*"`）

    2. **群组发送者策略**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`：绕过发送者允许列表
       - `allowlist`：发送者必须匹配 `groupAllowFrom`（或 `*`）
       - `disabled`：阻止所有群组入站消息

    发送者允许列表回退：

    - 如果未设置 `groupAllowFrom`，运行时会在 `allowFrom` 可用时回退到它
    - 在提及/回复激活之前，会先评估发送者允许列表

    注意：如果根本不存在 `channels.whatsapp` 配置块，运行时群组策略回退值为 `allowlist`（并记录警告），即使设置了 `channels.defaults.groupPolicy` 也是如此。

  </Tab>

  <Tab title="提及 + /activation">
    默认情况下，群组回复需要提及。

    提及检测包括：

    - 对机器人身份的显式 WhatsApp 提及
    - 已配置的提及正则模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 隐式回复机器人检测（回复发送者与机器人身份匹配）

    安全说明：

    - 引用/回复只会满足提及门控；它**不会**授予发送者授权
    - 当 `groupPolicy: "allowlist"` 时，即使非允许列表发送者回复了允许列表用户的消息，仍然会被阻止

    会话级激活命令：

    - `/activation mention`
    - `/activation always`

    `activation` 会更新会话状态（而不是全局配置）。它受 owner 权限控制。

  </Tab>
</Tabs>

## 个人号码与自聊行为

当已关联的自身号码也存在于 `allowFrom` 中时，WhatsApp 自聊保护会激活：

- 跳过自聊轮次的已读回执
- 忽略原本会提醒你自己的 mention-JID 自动触发行为
- 如果未设置 `messages.responsePrefix`，自聊回复默认使用 `[{identity.name}]` 或 `[openclaw]`

## 消息规范化与上下文

<AccordionGroup>
  <Accordion title="入站信封 + 回复上下文">
    传入的 WhatsApp 消息会封装到共享的入站信封中。

    如果存在引用回复，会附加以下形式的上下文：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    如果可用，也会填充回复元数据字段（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、发送者 JID/E.164）。

  </Accordion>

  <Accordion title="媒体占位符与位置/联系人提取">
    纯媒体入站消息会使用以下占位符进行规范化：

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    位置消息正文会使用简洁的坐标文本。位置标签/备注以及联系人/vCard 详情会渲染为带围栏的不受信任元数据，而不是内联提示文本。

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

## 投递、分块与媒体

<AccordionGroup>
  <Accordion title="文本分块">
    - 默认分块限制：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 模式优先按段落边界（空行）拆分，然后回退到按长度安全分块
  </Accordion>

  <Accordion title="出站媒体行为">
    - 支持图片、视频、音频（PTT 语音便笺）和文档负载
    - `audio/ogg` 会被改写为 `audio/ogg; codecs=opus` 以兼容语音便笺
    - 视频发送时通过 `gifPlayback: true` 支持动态 GIF 播放
    - 发送多媒体回复负载时，说明文字会应用到第一个媒体项
    - 媒体来源可以是 HTTP(S)、`file://` 或本地路径
  </Accordion>

  <Accordion title="媒体大小限制与回退行为">
    - 入站媒体保存上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 出站媒体发送上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 按账户覆盖使用 `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - 图片会自动优化（调整尺寸/质量扫描）以适应限制
    - 当媒体发送失败时，首项回退会发送文本警告，而不是静默丢弃响应
  </Accordion>
</AccordionGroup>

## 回复引用

WhatsApp 支持原生回复引用，即出站回复会可见地引用入站消息。可通过 `channels.whatsapp.replyToMode` 进行控制。

| 值       | 行为 |
| -------- | ---- |
| `"auto"` | 当提供商支持时引用入站消息；否则跳过引用 |
| `"on"`   | 始终引用入站消息；如果引用被拒绝，则回退为普通发送 |
| `"off"`  | 从不引用；作为普通消息发送 |

默认值是 `"auto"`。按账户覆盖使用 `channels.whatsapp.accounts.<id>.replyToMode`。

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## 反应级别

`channels.whatsapp.reactionLevel` 控制智能体在 WhatsApp 上使用表情反应的广度：

| 级别          | 确认反应 | 智能体主动反应 | 描述 |
| ------------- | -------- | -------------- | ---- |
| `"off"`       | 否       | 否             | 完全不使用反应 |
| `"ack"`       | 是       | 否             | 仅确认反应（回复前回执） |
| `"minimal"`   | 是       | 是（保守）     | 确认 + 在保守指导下使用智能体反应 |
| `"extensive"` | 是       | 是（鼓励）     | 确认 + 在鼓励指导下使用智能体反应 |

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

WhatsApp 支持通过 `channels.whatsapp.ackReaction` 在收到入站消息时立即发送确认反应。
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

- 在接受入站消息后立即发送（在回复之前）
- 失败会被记录日志，但不会阻止正常回复投递
- 群组模式 `mentions` 会在由提及触发的轮次中发送反应；群组激活 `always` 可绕过此检查
- WhatsApp 使用 `channels.whatsapp.ackReaction`（这里不使用旧版 `messages.ackReaction`）

## 多账户与凭证

<AccordionGroup>
  <Accordion title="账户选择与默认值">
    - 账户 id 来自 `channels.whatsapp.accounts`
    - 默认账户选择：如果存在则为 `default`，否则为第一个已配置的账户 id（按排序）
    - 账户 id 会在内部规范化后用于查找
  </Accordion>

  <Accordion title="凭证路径与旧版兼容性">
    - 当前认证路径：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 备份文件：`creds.json.bak`
    - 对于默认账户流程，仍会识别/迁移位于 `~/.openclaw/credentials/` 中的旧版默认认证
  </Accordion>

  <Accordion title="登出行为">
    `openclaw channels logout --channel whatsapp [--account <id>]` 会清除该账户的 WhatsApp 认证状态。

    在旧版认证目录中，会保留 `oauth.json`，同时移除 Baileys 认证文件。

  </Accordion>
</AccordionGroup>

## 工具、动作与配置写入

- 智能体工具支持包括 WhatsApp 反应动作（`react`）。
- 动作门控：
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 默认启用由渠道发起的配置写入（可通过 `channels.whatsapp.configWrites=false` 禁用）。

## 故障排除

<AccordionGroup>
  <Accordion title="未关联（需要 QR 码）">
    症状：渠道状态报告为未关联。

    修复：

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="已关联但断开 / 重连循环">
    症状：已关联账户反复断开或反复尝试重连。

    修复：

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    如有需要，使用 `channels login` 重新关联。

  </Accordion>

  <Accordion title="发送时没有活跃监听器">
    当目标账户不存在活跃的 Gateway 网关监听器时，出站发送会快速失败。

    请确保 Gateway 网关正在运行，并且账户已关联。

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
    WhatsApp Gateway 网关运行时应使用 Node。Bun 被标记为与稳定的 WhatsApp/Telegram Gateway 网关运行不兼容。
  </Accordion>
</AccordionGroup>

## 系统提示词

WhatsApp 通过 `groups` 和 `direct` 映射支持类似 Telegram 的群组和私聊系统提示词。

群组消息的解析层级：

首先确定生效的 `groups` 映射：如果账户定义了自己的 `groups`，它会完全替换根级 `groups` 映射（不进行深度合并）。随后会在得到的这个单一映射上执行提示词查找：

1. **群组特定系统提示词**（`groups["<groupId>"].systemPrompt`）：如果特定群组条目定义了 `systemPrompt`，则使用它。
2. **群组通配系统提示词**（`groups["*"].systemPrompt`）：当特定群组条目不存在或未定义 `systemPrompt` 时使用。

私聊消息的解析层级：

首先确定生效的 `direct` 映射：如果账户定义了自己的 `direct`，它会完全替换根级 `direct` 映射（不进行深度合并）。随后会在得到的这个单一映射上执行提示词查找：

1. **私聊特定系统提示词**（`direct["<peerId>"].systemPrompt`）：如果特定对端条目定义了 `systemPrompt`，则使用它。
2. **私聊通配系统提示词**（`direct["*"].systemPrompt`）：当特定对端条目不存在或未定义 `systemPrompt` 时使用。

注意：`dms` 仍然是轻量级的按私信历史覆盖桶（`dms.<id>.historyLimit`）；提示词覆盖位于 `direct` 下。

**与 Telegram 多账户行为的区别：** 在 Telegram 中，多账户设置下会有意对所有账户抑制根级 `groups`——即使某些账户没有定义自己的 `groups` 也是如此——以防止机器人接收其未加入群组的消息。WhatsApp 不应用这种保护：对于未定义账户级覆盖的账户，无论配置了多少账户，根级 `groups` 和根级 `direct` 都始终会被继承。在多账户 WhatsApp 设置中，如果你希望按账户设置群组或私聊提示词，请在每个账户下显式定义完整映射，而不要依赖根级默认值。

重要行为：

- `channels.whatsapp.groups` 同时是按群组的配置映射和聊天级群组允许列表。在根级或账户级作用域下，`groups["*"]` 表示该作用域“允许所有群组进入”。
- 只有在你本来就希望该作用域允许所有群组时，才添加通配群组 `systemPrompt`。如果你仍然只希望固定的一组群组 id 有资格进入，请不要把 `groups["*"]` 用作提示词默认值。应当改为在每个显式加入允许列表的群组条目上重复该提示词。
- 群组准入和发送者授权是两个独立检查。`groups["*"]` 会扩大可进入群组处理流程的群组集合，但它本身不会授权这些群组中的所有发送者。发送者访问仍然由 `channels.whatsapp.groupPolicy` 和 `channels.whatsapp.groupAllowFrom` 单独控制。
- `channels.whatsapp.direct` 对私信没有同样的副作用。`direct["*"]` 只会在某条私信已经通过 `dmPolicy` 加上 `allowFrom` 或配对存储规则准入后，提供默认的私聊配置。

示例：

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // 仅在根级作用域下应允许所有群组时使用。
        // 适用于所有未定义自己 groups 映射的账户。
        "*": { systemPrompt: "所有群组的默认提示词。" },
      },
      direct: {
        // 适用于所有未定义自己 direct 映射的账户。
        "*": { systemPrompt: "所有私聊的默认提示词。" },
      },
      accounts: {
        work: {
          groups: {
            // 该账户定义了自己的 groups，因此根级 groups 会被完全
            // 替换。若要保留通配符，也需要在这里显式定义 "*"。
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "专注于项目管理。",
            },
            // 仅在该账户中应允许所有群组时使用。
            "*": { systemPrompt: "工作群组的默认提示词。" },
          },
          direct: {
            // 该账户定义了自己的 direct 映射，因此根级 direct 条目会被
            // 完全替换。若要保留通配符，也需要在这里显式定义 "*"。
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
- 多账户：`accounts.<id>.enabled`、`accounts.<id>.authDir`、账户级覆盖
- 运维操作：`configWrites`、`debounceMs`、`web.enabled`、`web.heartbeatSeconds`、`web.reconnect.*`
- 会话行为：`session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`
- 提示词：`groups.<id>.systemPrompt`、`groups["*"].systemPrompt`、`direct.<id>.systemPrompt`、`direct["*"].systemPrompt`

## 相关内容

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [安全](/zh-CN/gateway/security)
- [渠道路由](/zh-CN/channels/channel-routing)
- [多智能体路由](/zh-CN/concepts/multi-agent)
- [故障排除](/zh-CN/channels/troubleshooting)
