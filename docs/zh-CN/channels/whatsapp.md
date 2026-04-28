---
read_when:
    - 处理 WhatsApp/网页渠道行为或收件箱路由
summary: WhatsApp 渠道支持、访问控制、投递行为和运维
title: WhatsApp
x-i18n:
    generated_at: "2026-04-28T11:46:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b18b3c05e391b26005c1c87a6fb6c4e6e02f095d5d3e655fc78898a0b6b8736
    source_path: channels/whatsapp.md
    workflow: 16
---

Status：通过 WhatsApp Web（Baileys）达到生产就绪。Gateway 网关拥有已关联的会话。

## 安装（按需）

- 新手引导（`openclaw onboard`）和 `openclaw channels add --channel whatsapp`
  会在你第一次选择 WhatsApp 插件时提示安装。
- 当插件尚未存在时，`openclaw channels login --channel whatsapp` 也会提供安装流程。
- Dev 渠道 + git checkout：默认使用本地插件路径。
- Stable/Beta：默认使用 npm 包 `@openclaw/whatsapp`。

仍可手动安装：

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    默认私信策略是为未知发送者配对。
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

    配对请求会在 1 小时后过期。每个渠道的待处理请求上限为 3 个。

  </Step>
</Steps>

<Note>
OpenClaw 建议尽可能在单独号码上运行 WhatsApp。（渠道元数据和设置流程针对此设置进行了优化，但也支持个人号码设置。）
</Note>

## 部署模式

<AccordionGroup>
  <Accordion title="专用号码（推荐）">
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

  <Accordion title="个人号码回退">
    新手引导支持个人号码模式，并写入适合自聊的基线：

    - `dmPolicy: "allowlist"`
    - `allowFrom` 包含你的个人号码
    - `selfChatMode: true`

    在运行时，自聊保护会基于已关联的自身号码和 `allowFrom` 生效。

  </Accordion>

  <Accordion title="仅 WhatsApp Web 的渠道范围">
    在当前 OpenClaw 渠道架构中，消息平台渠道基于 WhatsApp Web（`Baileys`）。

    内置聊天渠道注册表中没有单独的 Twilio WhatsApp 消息渠道。

  </Accordion>
</AccordionGroup>

## 运行时模型

- Gateway 网关拥有 WhatsApp 套接字和重连循环。
- 重连看门狗使用 WhatsApp Web 传输活动，而不只依赖入站应用消息量，因此安静的已关联设备会话不会仅仅因为最近没人发送消息而被重启。如果传输帧持续到达，但在看门狗窗口内没有处理任何应用消息，较长的应用静默上限仍会强制重连。
- 出站发送要求目标账号存在活跃的 WhatsApp 监听器。
- Status 和广播聊天会被忽略（`@status`、`@broadcast`）。
- 直接聊天使用私信会话规则（`session.dmScope`；默认 `main` 会将私信折叠到智能体主会话）。
- 群组会话相互隔离（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Web 传输会遵循 Gateway 网关主机上的标准代理环境变量（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小写变体）。优先使用主机级代理配置，而不是渠道专用的 WhatsApp 代理设置。
- 启用 `messages.removeAckAfterReply` 时，OpenClaw 会在可见回复送达后清除 WhatsApp ack 反应。

## 插件钩子和隐私

WhatsApp 入站消息可能包含个人消息内容、电话号码、群组标识符、发送者姓名和会话关联字段。因此，除非你显式选择加入，否则 WhatsApp 不会向插件广播入站 `message_received` 钩子负载：

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

只应对你信任其接收入站 WhatsApp 消息内容和标识符的插件启用此项。

## 访问控制和激活

<Tabs>
  <Tab title="私信策略">
    `channels.whatsapp.dmPolicy` 控制直接聊天访问：

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    `allowFrom` 接受 E.164 风格的号码（内部会规范化）。

    多账号覆盖：`channels.whatsapp.accounts.<id>.dmPolicy`（以及 `allowFrom`）优先于该账号的渠道级默认值。

    运行时行为详情：

    - 配对会持久化到渠道允许存储中，并与配置的 `allowFrom` 合并
    - 如果未配置允许列表，则默认允许已关联的自身号码
    - OpenClaw 永远不会自动配对出站 `fromMe` 私信（你从已关联设备发送给自己的消息）

  </Tab>

  <Tab title="群组策略 + 允许列表">
    群组访问有两层：

    1. **群组成员允许列表**（`channels.whatsapp.groups`）
       - 如果省略 `groups`，所有群组都符合条件
       - 如果存在 `groups`，它会作为群组允许列表（允许 `"*"`）

    2. **群组发送者策略**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`：绕过发送者允许列表
       - `allowlist`：发送者必须匹配 `groupAllowFrom`（或 `*`）
       - `disabled`：阻止所有群组入站

    发送者允许列表回退：

    - 如果未设置 `groupAllowFrom`，运行时会在可用时回退到 `allowFrom`
    - 发送者允许列表会在提及/回复激活之前评估

    注意：如果完全不存在 `channels.whatsapp` 块，即使设置了 `channels.defaults.groupPolicy`，运行时群组策略回退仍为 `allowlist`（并记录警告日志）。

  </Tab>

  <Tab title="提及 + /activation">
    群组回复默认要求提及。

    提及检测包括：

    - 显式提及机器人身份的 WhatsApp 提及
    - 配置的提及正则表达式模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 已授权群组消息中的入站语音备注转写文本
    - 隐式回复机器人检测（回复发送者匹配机器人身份）

    安全注意事项：

    - 引用/回复只满足提及门控；它**不会**授予发送者授权
    - 使用 `groupPolicy: "allowlist"` 时，即使非允许列表发送者回复了允许列表用户的消息，仍会被阻止

    会话级激活命令：

    - `/activation mention`
    - `/activation always`

    `activation` 会更新会话状态（不是全局配置）。它受所有者门控。

  </Tab>
</Tabs>

## 个人号码和自聊行为

当已关联的自身号码也存在于 `allowFrom` 中时，WhatsApp 自聊保护会激活：

- 跳过自聊轮次的已读回执
- 忽略原本会提醒你自己的 mention-JID 自动触发行为
- 如果未设置 `messages.responsePrefix`，自聊回复默认使用 `[{identity.name}]` 或 `[openclaw]`

## 消息规范化和上下文

<AccordionGroup>
  <Accordion title="入站封包 + 回复上下文">
    传入的 WhatsApp 消息会被包装在共享入站封包中。

    如果存在引用回复，上下文会以此形式追加：

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

    当正文只有 `<media:audio>` 时，已授权的群组语音备注会在提及门控前转写，因此在语音备注中说出机器人提及可以触发回复。如果转写文本仍未提及机器人，则会将转写文本保留在待处理群组历史中，而不是保留原始占位符。

    位置正文使用简洁的坐标文本。位置标签/评论和联系人/vCard 详情会渲染为围栏包裹的不可信元数据，而不是内联提示文本。

  </Accordion>

  <Accordion title="待处理群组历史注入">
    对于群组，未处理的消息可以被缓冲，并在机器人最终被触发时作为上下文注入。

    - 默认限制：`50`
    - 配置：`channels.whatsapp.historyLimit`
    - 回退：`messages.groupChat.historyLimit`
    - `0` 会禁用

    注入标记：

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="已读回执">
    对接受的入站 WhatsApp 消息，默认启用已读回执。

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
    - `newline` 模式优先使用段落边界（空行），然后回退到长度安全的分块

  </Accordion>

  <Accordion title="出站媒体行为">
    - 支持图片、视频、音频（PTT 语音留言）和文档载荷
    - 音频媒体通过 Baileys `audio` 载荷并带有 `ptt: true` 发送，因此 WhatsApp 客户端会将其渲染为按住说话的语音留言
    - 回复载荷会保留 `audioAsVoice`；即使提供商返回 MP3 或 WebM，WhatsApp 的 TTS 语音留言输出也会保持在这条 PTT 路径上
    - 原生 Ogg/Opus 音频会以 `audio/ogg; codecs=opus` 发送，以兼容语音留言
    - 非 Ogg 音频，包括 Microsoft Edge TTS MP3/WebM 输出，会先用 `ffmpeg` 转码为 48 kHz 单声道 Ogg/Opus，然后再通过 PTT 发送
    - `/tts latest` 将最新的助手回复作为一条语音留言发送，并对同一回复抑制重复发送；`/tts chat on|off|default` 控制当前 WhatsApp 聊天的自动 TTS
    - 通过在视频发送中设置 `gifPlayback: true` 支持动画 GIF 播放
    - 发送多媒体回复载荷时，说明文字会应用到第一个媒体项目；但 PTT 语音留言会先发送音频，再单独发送可见文本，因为 WhatsApp 客户端不会一致地渲染语音留言说明文字
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

## 回复引用

WhatsApp 支持原生回复引用，出站回复会显式引用入站消息。使用 `channels.whatsapp.replyToMode` 控制它。

| 值          | 行为                                                   |
| ----------- | ------------------------------------------------------ |
| `"off"`     | 永不引用；作为普通消息发送                             |
| `"first"`   | 仅引用第一个出站回复块                                 |
| `"all"`     | 引用每个出站回复块                                     |
| `"batched"` | 引用排队的批量回复，同时让即时回复保持不引用           |

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

`channels.whatsapp.reactionLevel` 控制智能体在 WhatsApp 上使用 emoji reaction 的范围：

| 级别          | Ack reaction | 智能体主动 reaction | 描述                                      |
| ------------- | ------------ | ------------------- | ----------------------------------------- |
| `"off"`       | 否           | 否                  | 完全不使用 reaction                       |
| `"ack"`       | 是           | 否                  | 仅使用 Ack reaction（回复前回执）         |
| `"minimal"`   | 是           | 是（保守）          | Ack + 智能体 reaction，并采用保守指导     |
| `"extensive"` | 是           | 是（鼓励）          | Ack + 智能体 reaction，并采用鼓励指导     |

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

WhatsApp 支持通过 `channels.whatsapp.ackReaction` 在收到入站消息时立即发送 ack reaction。
Ack reaction 受 `reactionLevel` 限制，当 `reactionLevel` 为 `"off"` 时会被抑制。

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
- 失败会记录日志，但不会阻塞正常回复发送
- 群组模式 `mentions` 会在由提及触发的轮次上作出 reaction；群组激活 `always` 会作为旁路跳过此检查
- WhatsApp 使用 `channels.whatsapp.ackReaction`（此处不使用旧版 `messages.ackReaction`）

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
    - `~/.openclaw/credentials/` 中的旧版默认认证仍会被默认账号流程识别/迁移

  </Accordion>

  <Accordion title="登出行为">
    `openclaw channels logout --channel whatsapp [--account <id>]` 会清除该账号的 WhatsApp 认证状态。

    在旧版认证目录中，会保留 `oauth.json`，同时移除 Baileys 认证文件。

  </Accordion>
</AccordionGroup>

## 工具、动作和配置写入

- 智能体工具支持包括 WhatsApp reaction 动作（`react`）。
- 动作门控：
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

    安静账号可以在正常消息超时后继续保持连接；当 WhatsApp Web 传输活动停止、socket 关闭，或应用级活动在更长安全窗口之外仍保持静默时，看门狗会重启。

    修复：

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    如有需要，使用 `channels login` 重新关联。

  </Accordion>

  <Accordion title="代理后面的 QR 登录超时">
    症状：`openclaw channels login --channel whatsapp` 在显示可用 QR 码之前失败，并显示 `status=408 Request Time-out` 或 TLS socket 断开。

    WhatsApp Web 登录使用 Gateway 网关主机的标准代理环境（`HTTPS_PROXY`、`HTTP_PROXY`、小写变体以及 `NO_PROXY`）。确认 Gateway 网关进程继承了代理环境，并且 `NO_PROXY` 不匹配 `mmg.whatsapp.net`。

  </Accordion>

  <Accordion title="发送时没有活动监听器">
    当目标账号没有活动的 Gateway 网关监听器时，出站发送会快速失败。

    确保 Gateway 网关正在运行，并且账号已关联。

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

## 系统提示词

WhatsApp 通过 `groups` 和 `direct` 映射支持 Telegram 风格的群组和直接聊天系统提示词。

群组消息的解析层级：

首先确定有效的 `groups` 映射：如果账号定义了自己的 `groups`，它会完全替换根 `groups` 映射（不进行深度合并）。然后在得到的单个映射上执行提示词查找：

1. **群组专用系统提示词**（`groups["<groupId>"].systemPrompt`）：当映射中存在特定群组条目**且**其 `systemPrompt` 键已定义时使用。如果 `systemPrompt` 是空字符串（`""`），则会抑制通配符且不应用系统提示词。
2. **群组通配符系统提示词**（`groups["*"].systemPrompt`）：当特定群组条目完全不存在于映射中，或条目存在但未定义 `systemPrompt` 键时使用。

直接消息的解析层级：

首先确定有效的 `direct` 映射：如果账号定义了自己的 `direct`，它会完全替换根 `direct` 映射（不进行深度合并）。然后在得到的单个映射上执行提示词查找：

1. **Direct 专用系统提示词**（`direct["<peerId>"].systemPrompt`）：当映射中存在特定对等方条目**且**其 `systemPrompt` 键已定义时使用。如果 `systemPrompt` 是空字符串（`""`），则会抑制通配符且不应用系统提示词。
2. **Direct 通配符系统提示词**（`direct["*"].systemPrompt`）：当特定对等方条目完全不存在于映射中，或条目存在但未定义 `systemPrompt` 键时使用。

<Note>
`dms` 仍是轻量的按私信历史覆盖桶（`dms.<id>.historyLimit`）。提示词覆盖位于 `direct` 下。
</Note>

**与 Telegram 多账号行为的区别：**在 Telegram 中，在多账号设置里会有意对所有账号抑制根 `groups`，即使某个账号没有定义自己的 `groups`，也是如此，这是为了防止 bot 接收不属于它的群组中的群组消息。WhatsApp 不应用此保护：没有定义账号级覆盖的账号，始终会继承根 `groups` 和根 `direct`，无论配置了多少个账号。在多账号 WhatsApp 设置中，如果你想要按账号设置群组或直接提示词，请在每个账号下显式定义完整映射，而不是依赖根级默认值。

重要行为：

- `channels.whatsapp.groups` 既是按群组配置映射，也是聊天级群组允许列表。在根作用域或账号作用域中，`groups["*"]` 表示该作用域“允许所有群组”。
- 只有当你已经希望该作用域允许所有群组时，才添加通配符群组 `systemPrompt`。如果你仍然只希望固定的一组群组 ID 符合条件，请不要用 `groups["*"]` 作为提示词默认值。相反，应在每个显式允许列表群组条目上重复该提示词。
- 群组准入和发送者授权是两个独立检查。`groups["*"]` 会扩大可到达群组处理的群组集合，但它本身不会授权这些群组中的每个发送者。发送者访问仍由 `channels.whatsapp.groupPolicy` 和 `channels.whatsapp.groupAllowFrom` 单独控制。
- `channels.whatsapp.direct` 对私信没有相同的副作用。`direct["*"]` 只会在私信已经由 `dmPolicy` 加 `allowFrom` 或配对存储规则准入后，提供默认的直接聊天配置。

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

高信号 WhatsApp 字段：

- 访问：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`
- 递送：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`
- 多账号：`accounts.<id>.enabled`、`accounts.<id>.authDir`、账号级覆盖项
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
