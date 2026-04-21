---
read_when:
    - 设置 BlueBubbles 渠道
    - Webhook 配对故障排除
    - 在 macOS 上配置 iMessage
summary: 通过 BlueBubbles macOS 服务器接入 iMessage（REST 发送/接收、正在输入、表情回应、配对、高级操作）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-21T20:11:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: db2e193db3fbcea22748187c21d0493037f59d4f1af163725530d5572b06e8b4
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles（macOS REST）

状态：一个通过 HTTP 与 BlueBubbles macOS 服务器通信的内置插件。由于其 API 更丰富、设置也比旧版 `imsg` 渠道更简单，**推荐用于 iMessage 集成**。

## 内置插件

当前的 OpenClaw 版本内置了 BlueBubbles，因此常规打包构建**不需要**单独执行 `openclaw plugins install` 步骤。

## 概览

- 通过 BlueBubbles 辅助应用在 macOS 上运行（[bluebubbles.app](https://bluebubbles.app)）。
- 推荐/已测试：macOS Sequoia（15）。macOS Tahoe（26）可用；但当前在 Tahoe 上编辑功能不可用，群组图标更新也可能显示成功但不会同步。
- OpenClaw 通过它的 REST API 与其通信（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）。
- 传入消息通过 webhook 到达；传出回复、正在输入指示、已读回执和 tapback 都通过 REST 调用完成。
- 附件和贴纸会作为入站媒体摄取（并在可能时暴露给智能体）。
- 配对/允许列表的工作方式与其他渠道相同（`/channels/pairing` 等），使用 `channels.bluebubbles.allowFrom` + 配对码。
- 表情回应会像 Slack/Telegram 一样作为系统事件暴露，因此智能体可以在回复前“提及”它们。
- 高级功能：编辑、撤回、回复线程、消息效果、群组管理。

## 快速开始

1. 在你的 Mac 上安装 BlueBubbles 服务器（按照 [bluebubbles.app/install](https://bluebubbles.app/install) 上的说明操作）。
2. 在 BlueBubbles 配置中，启用 web API 并设置密码。
3. 运行 `openclaw onboard` 并选择 BlueBubbles，或手动配置：

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. 将 BlueBubbles webhook 指向你的 Gateway 网关（示例：`https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）。
5. 启动 Gateway 网关；它会注册 webhook 处理器并开始配对。

安全说明：

- 始终设置 webhook 密码。
- 始终要求进行 webhook 身份验证。无论 loopback/代理拓扑如何，除非 BlueBubbles webhook 请求包含与 `channels.bluebubbles.password` 匹配的 password/guid（例如 `?password=<password>` 或 `x-password`），否则 OpenClaw 会拒绝该请求。
- 在读取/解析完整 webhook 请求体之前，会先检查密码认证。

## 保持 Messages.app 处于活动状态（VM / 无头设置）

某些 macOS VM / 常开环境可能会出现 Messages.app 进入“空闲”状态的情况（传入事件会停止，直到应用被打开/切到前台）。一个简单的变通办法是使用 AppleScript + LaunchAgent **每 5 分钟轻触一次 Messages**。

### 1）保存 AppleScript

将其保存为：

- `~/Scripts/poke-messages.scpt`

示例脚本（非交互式；不会抢占焦点）：

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2）安装 LaunchAgent

将其保存为：

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

说明：

- 该任务会**每 300 秒**运行一次，并且会**在登录时**运行。
- 首次运行时可能会触发 macOS 的**自动化**提示（`osascript` → Messages）。请在运行该 LaunchAgent 的同一用户会话中批准这些提示。

加载它：

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## 新手引导

BlueBubbles 可在交互式新手引导中使用：

```
openclaw onboard
```

向导会提示你输入：

- **Server URL**（必填）：BlueBubbles 服务器地址（例如 `http://192.168.1.100:1234`）
- **Password**（必填）：来自 BlueBubbles Server 设置的 API 密码
- **Webhook path**（可选）：默认为 `/bluebubbles-webhook`
- **DM policy**：pairing、allowlist、open 或 disabled
- **Allow list**：电话号码、电子邮件或聊天目标

你也可以通过 CLI 添加 BlueBubbles：

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## 访问控制（私信 + 群组）

私信：

- 默认值：`channels.bluebubbles.dmPolicy = "pairing"`。
- 未知发送者会收到一个配对码；在获得批准之前，消息会被忽略（配对码 1 小时后过期）。
- 通过以下方式批准：
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- 配对是默认的令牌交换方式。详情参见：[Pairing](/zh-CN/channels/pairing)

群组：

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（默认：`allowlist`）。
- 当设置为 `allowlist` 时，`channels.bluebubbles.groupAllowFrom` 控制谁可以在群组中触发。

### 联系人姓名增强（macOS，可选）

BlueBubbles 的群组 webhook 通常只包含原始参与者地址。如果你希望 `GroupMembers` 上下文改为显示本地联系人姓名，可以选择在 macOS 上启用本地通讯录增强：

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` 启用该查找。默认值：`false`。
- 只有在群组访问、命令授权和提及门控都允许该消息通过之后，才会执行查找。
- 只有未命名的电话参与者会被增强。
- 如果未找到本地匹配项，则原始电话号码仍会作为回退值保留。

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### 提及门控（群组）

BlueBubbles 支持群聊的提及门控，与 iMessage/WhatsApp 的行为一致：

- 使用 `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）检测提及。
- 当为某个群组启用 `requireMention` 时，智能体只有在被提及时才会响应。
- 来自已授权发送者的控制命令会绕过提及门控。

按群组配置：

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // 所有群组的默认值
        "iMessage;-;chat123": { requireMention: false }, // 特定群组的覆盖值
      },
    },
  },
}
```

### 命令门控

- 控制命令（例如 `/config`、`/model`）需要授权。
- 使用 `allowFrom` 和 `groupAllowFrom` 来确定命令授权。
- 已授权发送者即使在群组中未提及，也可以运行控制命令。

### 按群组设置 system prompt

`channels.bluebubbles.groups.*` 下的每个条目都接受一个可选的 `systemPrompt` 字符串。每当处理该群组中的消息时，该值都会注入到智能体的 system prompt 中，因此你可以为每个群组设置特定人格或行为规则，而无需编辑智能体提示词：

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "将回复控制在 3 句话以内。模仿群组的随意语气。",
        },
      },
    },
  },
}
```

该键与 BlueBubbles 为该群组报告的 `chatGuid` / `chatIdentifier` / 数字 `chatId` 相匹配，而 `"*"` 通配符条目则为每个没有精确匹配的群组提供默认值（与 `requireMention` 和按群组工具策略使用的模式相同）。精确匹配始终优先于通配符。私信会忽略此字段；请改用智能体级或账户级提示词自定义。

#### 示例：线程回复和 tapback 表情回应（Private API）

启用 BlueBubbles Private API 后，传入消息会带有简短消息 ID（例如 `[[reply_to:5]]`），智能体可以调用 `action=reply` 将回复串接到特定消息，或调用 `action=react` 添加 tapback。按群组设置 `systemPrompt` 是让智能体稳定选择正确工具的可靠方法：

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "在此群组中回复时，始终使用上下文中的",
            "[[reply_to:N]] messageId 调用 action=reply，这样你的回复会串接到",
            "触发消息下方。绝不要发送新的未关联消息。",
            "",
            "对于简短确认（'ok'、'got it'、'on it'），请使用",
            "action=react 并选择合适的 tapback 表情（❤️、👍、😂、‼️、❓），",
            "而不是发送文本回复。",
          ].join(" "),
        },
      },
    },
  },
}
```

tapback 表情回应和线程回复都需要 BlueBubbles Private API；相关底层机制参见 [Advanced actions](#advanced-actions) 和 [Message IDs](#message-ids-short-vs-full)。

## ACP 会话绑定

BlueBubbles 聊天可以在不改变传输层的情况下转变为持久 ACP 工作区。

快速操作流程：

- 在私信或允许的群聊中运行 `/acp spawn codex --bind here`。
- 在同一个 BlueBubbles 会话中，后续消息会路由到生成的 ACP 会话。
- `/new` 和 `/reset` 会在原地重置同一个已绑定 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

也支持通过顶层 `bindings[]` 条目配置持久绑定，使用 `type: "acp"` 和 `match.channel: "bluebubbles"`。

`match.peer.id` 可以使用任意受支持的 BlueBubbles 目标形式：

- 标准化私信句柄，例如 `+15555550123` 或 `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

对于稳定的群组绑定，优先使用 `chat_id:*` 或 `chat_identifier:*`。

示例：

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

共享的 ACP 绑定行为参见 [ACP Agents](/zh-CN/tools/acp-agents)。

## 正在输入 + 已读回执

- **正在输入指示**：会在生成回复之前和期间自动发送。
- **已读回执**：由 `channels.bluebubbles.sendReadReceipts` 控制（默认：`true`）。
- **正在输入指示**：OpenClaw 会发送开始输入事件；BlueBubbles 会在发送后或超时后自动清除输入状态（通过 DELETE 手动停止并不可靠）。

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // 禁用已读回执
    },
  },
}
```

## 高级操作

当在配置中启用时，BlueBubbles 支持高级消息操作：

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback 表情回应（默认：true）
        edit: true, // 编辑已发送消息（macOS 13+，在 macOS 26 Tahoe 上不可用）
        unsend: true, // 撤回消息（macOS 13+）
        reply: true, // 按消息 GUID 进行线程回复
        sendWithEffect: true, // 消息效果（slam、loud 等）
        renameGroup: true, // 重命名群聊
        setGroupIcon: true, // 设置群聊图标/照片（在 macOS 26 Tahoe 上不稳定）
        addParticipant: true, // 向群组添加参与者
        removeParticipant: true, // 从群组移除参与者
        leaveGroup: true, // 退出群聊
        sendAttachment: true, // 发送附件/媒体
      },
    },
  },
}
```

可用操作：

- **react**：添加/移除 tapback 表情回应（`messageId`、`emoji`、`remove`）。iMessage 原生的 tapback 集合是 `love`、`like`、`dislike`、`laugh`、`emphasize` 和 `question`。当智能体选择了该集合之外的 emoji（例如 `👀`）时，reaction 工具会回退为 `love`，这样 tapback 仍然会渲染，而不会导致整个请求失败。已配置的确认表情回应仍会严格校验，遇到未知值时会报错。
- **edit**：编辑已发送消息（`messageId`、`text`）
- **unsend**：撤回消息（`messageId`）
- **reply**：回复特定消息（`messageId`、`text`、`to`）
- **sendWithEffect**：使用 iMessage 效果发送（`text`、`to`、`effectId`）
- **renameGroup**：重命名群聊（`chatGuid`、`displayName`）
- **setGroupIcon**：设置群聊图标/照片（`chatGuid`、`media`）—— 在 macOS 26 Tahoe 上不稳定（API 可能返回成功，但图标不会同步）。
- **addParticipant**：向群组添加成员（`chatGuid`、`address`）
- **removeParticipant**：从群组移除成员（`chatGuid`、`address`）
- **leaveGroup**：退出群聊（`chatGuid`）
- **upload-file**：发送媒体/文件（`to`、`buffer`、`filename`、`asVoice`）
  - 语音备忘录：将 **MP3** 或 **CAF** 音频与 `asVoice: true` 一起设置，即可作为 iMessage 语音消息发送。BlueBubbles 在发送语音备忘录时会将 MP3 转换为 CAF。
- 旧别名：`sendAttachment` 仍然可用，但 `upload-file` 才是规范操作名称。

### 消息 ID（短 ID 与完整 ID）

OpenClaw 可能会暴露_短_消息 ID（例如 `1`、`2`）以节省 token。

- `MessageSid` / `ReplyToId` 可以是短 ID。
- `MessageSidFull` / `ReplyToIdFull` 包含提供商的完整 ID。
- 短 ID 保存在内存中；重启或缓存清除后可能失效。
- 操作接受短 ID 或完整 `messageId`，但如果短 ID 已不可用，就会报错。

对于持久自动化和存储，请使用完整 ID：

- 模板：`{{MessageSidFull}}`、`{{ReplyToIdFull}}`
- 上下文：入站载荷中的 `MessageSidFull` / `ReplyToIdFull`

模板变量参见 [Configuration](/zh-CN/gateway/configuration)。

## 合并拆分发送的私信（一次编辑中同时包含命令 + URL）

当用户在 iMessage 中同时输入命令和 URL 时——例如 `Dump https://example.com/article`——Apple 会把这次发送拆成**两个独立的 webhook 投递**：

1. 一条文本消息（`"Dump"`）。
2. 一个 URL 预览气泡（`"https://..."`），并带有 OG 预览图片作为附件。

在大多数环境中，这两个 webhook 会相隔约 0.8 - 2.0 秒到达 OpenClaw。如果不进行合并，智能体会在第 1 轮只收到命令本身，然后回复（通常是“把 URL 发给我”），等到第 2 轮才看到 URL——此时命令上下文已经丢失。

`channels.bluebubbles.coalesceSameSenderDms` 可让私信选择启用：将同一发送者连续发来的 webhook 合并为一次智能体轮次。群聊则继续按单条消息作为键，以保留多用户轮次结构。

### 何时启用

在以下情况下启用：

- 你提供的 Skills 期望在一条消息中接收 `命令 + 负载`（dump、paste、save、queue 等）。
- 你的用户会把 URL、图片或长内容与命令一起粘贴发送。
- 你可以接受额外增加的私信轮次延迟（见下文）。

在以下情况下保持关闭：

- 你需要单词私信触发命令的最低延迟。
- 你的所有流程都是不带后续负载的一次性命令。

### 启用方式

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // 选择启用（默认：false）
    },
  },
}
```

当此标志开启，且未显式设置 `messages.inbound.byChannel.bluebubbles` 时，去抖窗口会扩大到 **2500 ms**（未启用合并时默认是 500 ms）。必须使用更宽的窗口——Apple 0.8 - 2.0 秒的拆分发送节奏无法落入更紧的默认窗口中。

如果你要自行调整窗口：

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms 适用于大多数环境；如果你的 Mac 较慢
        // 或存在内存压力（观察到的间隔可能超过 2 秒），可提高到 4000 ms。
        bluebubbles: 2500,
      },
    },
  },
}
```

### 权衡

- **私信控制命令会增加延迟。** 启用该标志后，私信控制命令消息（如 `Dump`、`Save` 等）现在会在分发前最多等待整个去抖窗口，以防后续还有负载 webhook 到来。群聊命令仍然会立即分发。
- **合并输出有上限**——合并文本最多 4000 个字符，超出时会带有显式的 `…[truncated]` 标记；附件上限为 20；来源条目上限为 10（超过后保留“第一条 + 最新条目”）。每个来源 `messageId` 仍然会进入入站去重，因此如果之后 MessagePoller 重放其中任意单个事件，系统仍会识别它是重复事件。
- **按渠道选择启用。** 其他渠道（Telegram、WhatsApp、Slack、……）不受影响。

### 场景与智能体实际看到的内容

| 用户输入内容 | Apple 投递内容 | 标志关闭（默认） | 标志开启 + 2500 ms 窗口 |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（一次发送） | 2 个 webhook，相隔约 1 秒 | 两个智能体轮次：“Dump” 单独一轮，然后是 URL | 一轮：合并文本 `Dump https://example.com` |
| `Save this 📎image.jpg caption`（附件 + 文本） | 2 个 webhook | 两轮 | 一轮：文本 + 图片 |
| `/status`（独立命令） | 1 个 webhook | 立即分发 | **最多等待整个窗口后再分发** |
| 单独粘贴 URL | 1 个 webhook | 立即分发 | 立即分发（bucket 中只有一个条目） |
| 文本 + URL 分几分钟作为两条独立消息刻意发送 | 窗口之外的 2 个 webhook | 两轮 | 两轮（窗口在两者之间到期） |
| 快速洪泛（窗口内 >10 条小型私信） | N 个 webhook | N 轮 | 一轮，带有上限输出（应用“第一条 + 最新条目”、文本/附件上限） |

### 拆分发送合并的故障排除

如果标志已开启，但拆分发送仍然作为两轮到达，请逐层检查：

1. **配置是否实际已加载。**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   然后执行 `openclaw gateway restart`——该标志会在 debouncer 注册表创建时读取。

2. **你的环境的去抖窗口是否足够宽。** 查看 BlueBubbles 服务器日志 `~/Library/Logs/bluebubbles-server/main.log`：

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   测量 `"Dump"` 这类文本分发与后续 `"https://..."`; Attachments:` 分发之间的间隔。将 `messages.inbound.byChannel.bluebubbles` 提高到足以覆盖该间隔。

3. **会话 JSONL 时间戳 ≠ webhook 到达时间。** 会话事件时间戳（`~/.openclaw/agents/<id>/sessions/*.jsonl`）反映的是 Gateway 网关何时将消息交给智能体，**不是** webhook 何时到达。如果排队中的第二条消息被标记为 `[Queued messages while agent was busy]`，说明第二个 webhook 到达时，第一轮仍在运行——合并 bucket 已经刷新。请根据 BB 服务器日志而不是会话日志来调整窗口。

4. **内存压力拖慢了回复分发。** 在较小的机器（8 GB）上，智能体轮次可能耗时较长，以至于在回复完成前合并 bucket 就已刷新，结果 URL 作为排队的第二轮到达。检查 `memory_pressure` 和 `ps -o rss -p $(pgrep openclaw-gateway)`；如果 Gateway 网关的 RSS 超过约 500 MB 且压缩器处于活跃状态，请关闭其他重型进程或升级到更大的主机。

5. **回复引用发送走的是另一条路径。** 如果用户把 `Dump` 作为对现有 URL 预览气泡的**回复**发出（iMessage 会在 Dump 气泡上显示 “1 Reply” 标记），那么 URL 位于 `replyToBody` 中，而不是第二个 webhook 中。这时不适用合并——这是 Skills/提示词层面的问题，而不是 debouncer 层面的问题。

## 分块流式传输

控制是将回复作为单条消息发送，还是按块流式发送：
__OC_I18N_900017__
## 媒体 + 限制

- 入站附件会被下载并存储在媒体缓存中。
- 入站和出站媒体的大小上限由 `channels.bluebubbles.mediaMaxMb` 控制（默认：8 MB）。
- 出站文本会按 `channels.bluebubbles.textChunkLimit` 分块（默认：4000 个字符）。

## 配置参考

完整配置： [Configuration](/gateway/configuration)

提供商选项：

- `channels.bluebubbles.enabled`：启用/禁用该渠道。
- `channels.bluebubbles.serverUrl`：BlueBubbles REST API 基础 URL。
- `channels.bluebubbles.password`：API 密码。
- `channels.bluebubbles.webhookPath`：webhook 端点路径（默认：`/bluebubbles-webhook`）。
- `channels.bluebubbles.dmPolicy`：`pairing | allowlist | open | disabled`（默认：`pairing`）。
- `channels.bluebubbles.allowFrom`：私信允许列表（handles、电子邮件、E.164 号码、`chat_id:*`、`chat_guid:*`）。
- `channels.bluebubbles.groupPolicy`：`open | allowlist | disabled`（默认：`allowlist`）。
- `channels.bluebubbles.groupAllowFrom`：群组发送者允许列表。
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`：在 macOS 上，在门控通过后，可选择从本地通讯录增强未命名的群组参与者。默认：`false`。
- `channels.bluebubbles.groups`：按群组配置（`requireMention` 等）。
- `channels.bluebubbles.sendReadReceipts`：发送已读回执（默认：`true`）。
- `channels.bluebubbles.blockStreaming`：启用分块流式传输（默认：`false`；流式回复所必需）。
- `channels.bluebubbles.textChunkLimit`：出站分块字符数上限（默认：4000）。
- `channels.bluebubbles.sendTimeoutMs`：通过 `/api/v1/message/text` 发送出站文本时每个请求的超时时间（毫秒）（默认：30000）。在 macOS 26 环境中，如果 Private API 的 iMessage 发送可能在 iMessage 框架内部停滞 60 秒以上，请调高此值；例如设为 `45000` 或 `60000`。探测、聊天查找、表情回应、编辑和健康检查当前仍保留较短的 10 秒默认值；后续计划将更宽的超时覆盖到表情回应和编辑。按账户覆盖：`channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
- `channels.bluebubbles.chunkMode`：`length`（默认）仅在超过 `textChunkLimit` 时拆分；`newline` 会先按空行（段落边界）拆分，再按长度分块。
- `channels.bluebubbles.mediaMaxMb`：入站/出站媒体大小上限（MB）（默认：8）。
- `channels.bluebubbles.mediaLocalRoots`：允许用于出站本地媒体路径的绝对本地目录显式允许列表。默认会拒绝发送本地路径，除非配置了此项。按账户覆盖：`channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
- `channels.bluebubbles.coalesceSameSenderDms`：将同一发送者连续发来的私信 webhook 合并为一次智能体轮次，使 Apple 拆分的“文本 + URL”发送能够作为一条消息到达（默认：`false`）。场景、窗口调优和权衡取舍参见 [合并拆分发送的私信](#coalescing-split-send-dms-command--url-in-one-composition)。当启用且未显式设置 `messages.inbound.byChannel.bluebubbles` 时，会将默认入站去抖窗口从 500 ms 扩大到 2500 ms。
- `channels.bluebubbles.historyLimit`：用于上下文的群组消息最大数量（0 表示禁用）。
- `channels.bluebubbles.dmHistoryLimit`：私信历史记录上限。
- `channels.bluebubbles.actions`：启用/禁用特定操作。
- `channels.bluebubbles.accounts`：多账户配置。

相关全局选项：

- `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`。

## 寻址 / 投递目标

为了获得稳定路由，优先使用 `chat_guid`：

- `chat_guid:iMessage;-;+15555550123`（群组首选）
- `chat_id:123`
- `chat_identifier:...`
- 直接 handle：`+15555550123`、`user@example.com`
  - 如果某个直接 handle 没有现有的私信聊天，OpenClaw 会通过 `POST /api/v1/chat/new` 创建一个。这要求启用 BlueBubbles Private API。

### iMessage 与 SMS 路由

当同一个 handle 在 Mac 上同时存在 iMessage 聊天和 SMS 聊天时（例如某个已注册 iMessage 的电话号码，同时也收过绿色气泡的回退消息），OpenClaw 会优先选择 iMessage 聊天，绝不会静默降级到 SMS。要强制使用 SMS 聊天，请使用显式的 `sms:` 目标前缀（例如 `sms:+15555550123`）。如果某个 handle 没有匹配的 iMessage 聊天，则仍会通过 BlueBubbles 报告的相应聊天发送。

## 安全

- webhook 请求通过将查询参数或请求头中的 `guid`/`password` 与 `channels.bluebubbles.password` 进行比较来完成身份验证。
- 请妥善保管 API 密码和 webhook 端点（将它们视为凭据）。
- BlueBubbles webhook 身份验证没有 localhost 绕过。如果你代理 webhook 流量，请在整个请求链路中保留 BlueBubbles 密码。这里的 `gateway.trustedProxies` 不能替代 `channels.bluebubbles.password`。参见 [Gateway 网关安全](/gateway/security#reverse-proxy-configuration)。
- 如果要在局域网之外暴露 BlueBubbles 服务器，请启用 HTTPS 和防火墙规则。

## 故障排除

- 如果“正在输入”/已读事件停止工作，请检查 BlueBubbles webhook 日志，并验证 Gateway 网关路径与 `channels.bluebubbles.webhookPath` 一致。
- 配对码会在一小时后过期；请使用 `openclaw pairing list bluebubbles` 和 `openclaw pairing approve bluebubbles <code>`。
- 表情回应需要 BlueBubbles private API（`POST /api/v1/message/react`）；请确认服务器版本提供了该接口。
- 编辑/撤回需要 macOS 13+ 和兼容的 BlueBubbles 服务器版本。在 macOS 26（Tahoe）上，由于 private API 变更，编辑当前不可用。
- 群组图标更新在 macOS 26（Tahoe）上可能不稳定：API 可能返回成功，但新图标不会同步。
- OpenClaw 会根据 BlueBubbles 服务器的 macOS 版本自动隐藏已知有问题的操作。如果在 macOS 26（Tahoe）上仍然显示 edit，请手动使用 `channels.bluebubbles.actions.edit=false` 禁用它。
- 已启用 `coalesceSameSenderDms`，但拆分发送（例如 `Dump` + URL）仍然作为两轮到达：请参阅[拆分发送合并的故障排除](#split-send-coalescing-troubleshooting)检查清单——常见原因包括去抖窗口过窄、将会话日志时间戳误读为 webhook 到达时间，或发送的是回复引用（它使用的是 `replyToBody`，而不是第二个 webhook）。
- 查看状态/健康信息：`openclaw status --all` 或 `openclaw status --deep`。

有关通用渠道工作流的参考，请参见 [Channels](/zh-CN/channels) 和 [Plugins](/zh-CN/tools/plugin) 指南。

## 相关内容

- [Channels Overview](/zh-CN/channels) —— 所有受支持的渠道
- [Pairing](/zh-CN/channels/pairing) —— 私信认证和配对流程
- [Groups](/zh-CN/channels/groups) —— 群聊行为和提及门控
- [Channel Routing](/zh-CN/channels/channel-routing) —— 消息的会话路由
- [Security](/zh-CN/gateway/security) —— 访问模型与加固
