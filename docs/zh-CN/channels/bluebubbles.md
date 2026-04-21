---
read_when:
    - 设置 BlueBubbles 渠道
    - Webhook 配对故障排除
    - 在 macOS 上配置 iMessage
summary: 通过 BlueBubbles macOS 服务器使用 iMessage（REST 发送/接收、正在输入、回应、配对、高级操作）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-21T03:02:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3d8d617fc86ca1b191ff4dd2ae26b464e4d3f456a79c67b484a3a76d75de0d2
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles（macOS REST）

状态：通过 HTTP 与 BlueBubbles macOS 服务器通信的内置插件。由于其 API 更丰富且设置比旧版 `imsg` 渠道更简单，**推荐用于 iMessage 集成**。

## 内置插件

当前的 OpenClaw 发布版本已内置 BlueBubbles，因此普通打包构建
不需要单独执行 `openclaw plugins install` 步骤。

## 概览

- 通过 BlueBubbles 辅助应用在 macOS 上运行（[bluebubbles.app](https://bluebubbles.app)）。
- 推荐/已测试：macOS Sequoia（15）。macOS Tahoe（26）可用；目前在 Tahoe 上编辑功能已损坏，群组图标更新也可能显示成功但不会同步。
- OpenClaw 通过其 REST API 与之通信（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）。
- 传入消息通过 webhook 到达；传出回复、正在输入指示、已读回执和 tapback 都通过 REST 调用完成。
- 附件和贴纸会作为入站媒体被接收（并在可能时呈现给智能体）。
- 配对/允许列表的工作方式与其他渠道相同（`/channels/pairing` 等），使用 `channels.bluebubbles.allowFrom` + 配对码。
- 回应会像 Slack/Telegram 一样作为系统事件呈现，因此智能体可以在回复前“提及”它们。
- 高级功能：编辑、撤回、回复线程、消息效果、群组管理。

## 快速开始

1. 在你的 Mac 上安装 BlueBubbles 服务器（按照 [bluebubbles.app/install](https://bluebubbles.app/install) 上的说明操作）。
2. 在 BlueBubbles 配置中启用 web API，并设置密码。
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
- 始终要求进行 webhook 身份验证。无论 loopback/proxy 拓扑如何，除非 BlueBubbles webhook 请求包含与 `channels.bluebubbles.password` 匹配的 password/guid（例如 `?password=<password>` 或 `x-password`），否则 OpenClaw 会拒绝该请求。
- 在读取/解析完整 webhook 请求体之前，会先检查密码身份验证。

## 保持 Messages.app 存活（VM / 无头设置）

某些 macOS VM / 常开设置可能会导致 Messages.app 进入“空闲”状态（传入事件会停止，直到应用被打开/切到前台）。一个简单的变通方法是使用 AppleScript + LaunchAgent **每 5 分钟触发一次 Messages**。

### 1）保存 AppleScript

将以下内容保存为：

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

将以下内容保存为：

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

- 这会**每 300 秒**运行一次，并且**在登录时**运行。
- 第一次运行时可能会触发 macOS **Automation** 提示（`osascript` → Messages）。请在运行该 LaunchAgent 的同一用户会话中批准这些提示。

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

向导会提示输入：

- **Server URL**（必填）：BlueBubbles 服务器地址（例如 `http://192.168.1.100:1234`）
- **Password**（必填）：BlueBubbles Server 设置中的 API 密码
- **Webhook path**（可选）：默认为 `/bluebubbles-webhook`
- **私信策略**：pairing、allowlist、open 或 disabled
- **允许列表**：电话号码、电子邮件地址或聊天目标

你也可以通过 CLI 添加 BlueBubbles：

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## 访问控制（私信 + 群组）

私信：

- 默认：`channels.bluebubbles.dmPolicy = "pairing"`。
- 未知发送者会收到一个配对码；在获批前其消息会被忽略（代码会在 1 小时后过期）。
- 通过以下方式批准：
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- 配对是默认的令牌交换方式。详情见：[Pairing](/zh-CN/channels/pairing)

群组：

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（默认：`allowlist`）。
- 当设置为 `allowlist` 时，`channels.bluebubbles.groupAllowFrom` 用于控制谁可以在群组中触发。

### 联系人姓名增强（macOS，可选）

BlueBubbles 的群组 webhook 通常只包含原始参与者地址。如果你希望 `GroupMembers` 上下文改为显示本地联系人姓名，可以在 macOS 上选择启用本地通讯录增强：

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` 启用查找。默认值：`false`。
- 只有在群组访问、命令授权和提及门控允许该消息通过后，才会执行查找。
- 仅会增强未命名的电话参与者。
- 当找不到本地匹配项时，原始电话号码仍会作为回退值保留。

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

BlueBubbles 支持群聊中的提及门控，与 iMessage/WhatsApp 行为一致：

- 使用 `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）来检测提及。
- 当某个群组启用了 `requireMention` 时，智能体只会在被提及时响应。
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
        "iMessage;-;chat123": { requireMention: false }, // 特定群组的覆盖设置
      },
    },
  },
}
```

### 命令门控

- 控制命令（例如 `/config`、`/model`）需要授权。
- 使用 `allowFrom` 和 `groupAllowFrom` 来判断命令授权。
- 已授权发送者即使在群组中未提及，也可以运行控制命令。

### 按群组设置系统提示词

`channels.bluebubbles.groups.*` 下的每个条目都接受一个可选的 `systemPrompt` 字符串。对于该群组中的每一次消息处理轮次，这个值都会被注入到智能体的系统提示词中，因此你可以在不编辑智能体提示词的情况下，为每个群组设置不同的人设或行为规则：

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Keep responses under 3 sentences. Mirror the group's casual tone.",
        },
      },
    },
  },
}
```

该键会匹配 BlueBubbles 报告的群组 `chatGuid` / `chatIdentifier` / 数字 `chatId` 中的任意一种，而 `"*"` 通配符条目会为所有没有精确匹配的群组提供默认值（与 `requireMention` 和按群组工具策略使用相同模式）。精确匹配始终优先于通配符。私信会忽略该字段；请改用智能体级别或账户级别的提示词自定义。

#### 示例：线程回复和 tapback 回应（Private API）

启用 BlueBubbles Private API 后，入站消息会带有短消息 ID（例如 `[[reply_to:5]]`），智能体可以调用 `action=reply` 以在线程中回复特定消息，或调用 `action=react` 来添加 tapback。按群组设置的 `systemPrompt` 是确保智能体选择正确工具的可靠方式：

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "When replying in this group, always call action=reply with the",
            "[[reply_to:N]] messageId from context so your response threads",
            "under the triggering message. Never send a new unlinked message.",
            "",
            "For short acknowledgements ('ok', 'got it', 'on it'), use",
            "action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "instead of sending a text reply.",
          ].join(" "),
        },
      },
    },
  },
}
```

Tapback 回应和线程回复都需要 BlueBubbles Private API；其底层机制参见 [高级操作](#advanced-actions) 和 [消息 ID](#message-ids-short-vs-full)。

## ACP 会话绑定

BlueBubbles 聊天可以转换为持久化的 ACP 工作区，而无需更改传输层。

快速操作流程：

- 在私信或允许的群聊中运行 `/acp spawn codex --bind here`。
- 之后，该 BlueBubbles 会话中的消息会路由到已生成的 ACP 会话。
- `/new` 和 `/reset` 会在原地重置同一个已绑定的 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

也支持通过顶层 `bindings[]` 条目配置持久绑定，使用 `type: "acp"` 和 `match.channel: "bluebubbles"`。

`match.peer.id` 可以使用任何受支持的 BlueBubbles 目标形式：

- 规范化的私信句柄，例如 `+15555550123` 或 `user@example.com`
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

共享的 ACP 绑定行为请参见 [ACP Agents](/zh-CN/tools/acp-agents)。

## 正在输入 + 已读回执

- **正在输入指示**：会在生成回复之前和期间自动发送。
- **已读回执**：由 `channels.bluebubbles.sendReadReceipts` 控制（默认：`true`）。
- **正在输入指示**：OpenClaw 会发送输入开始事件；BlueBubbles 会在发送后或超时后自动清除输入状态（通过 DELETE 手动停止并不可靠）。

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
        reactions: true, // tapback（默认：true）
        edit: true, // 编辑已发送消息（macOS 13+，在 macOS 26 Tahoe 上已损坏）
        unsend: true, // 撤回消息（macOS 13+）
        reply: true, // 通过消息 GUID 进行线程回复
        sendWithEffect: true, // 使用 iMessage 效果发送（slam、loud 等）
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

- **react**：添加/移除 tapback 回应（`messageId`、`emoji`、`remove`）
- **edit**：编辑已发送消息（`messageId`、`text`）
- **unsend**：撤回消息（`messageId`）
- **reply**：回复特定消息（`messageId`、`text`、`to`）
- **sendWithEffect**：使用 iMessage 效果发送（`text`、`to`、`effectId`）
- **renameGroup**：重命名群聊（`chatGuid`、`displayName`）
- **setGroupIcon**：设置群聊图标/照片（`chatGuid`、`media`）—— 在 macOS 26 Tahoe 上不稳定（API 可能返回成功，但图标不会同步）。
- **addParticipant**：向群组添加某人（`chatGuid`、`address`）
- **removeParticipant**：从群组移除某人（`chatGuid`、`address`）
- **leaveGroup**：退出群聊（`chatGuid`）
- **upload-file**：发送媒体/文件（`to`、`buffer`、`filename`、`asVoice`）
  - 语音备忘录：将 **MP3** 或 **CAF** 音频与 `asVoice: true` 一起设置，可作为 iMessage 语音消息发送。BlueBubbles 在发送语音备忘录时会将 MP3 转换为 CAF。
- 旧别名：`sendAttachment` 仍然可用，但 `upload-file` 是规范操作名称。

### 消息 ID（短 ID 与完整 ID）

OpenClaw 可能会显示_短_消息 ID（例如 `1`、`2`）以节省 token。

- `MessageSid` / `ReplyToId` 可以是短 ID。
- `MessageSidFull` / `ReplyToIdFull` 包含提供商的完整 ID。
- 短 ID 保存在内存中；在重启或缓存清除后可能失效。
- 操作接受短或完整 `messageId`，但如果短 ID 不再可用，将会报错。

对于持久化自动化和存储，请使用完整 ID：

- 模板：`{{MessageSidFull}}`、`{{ReplyToIdFull}}`
- 上下文：入站载荷中的 `MessageSidFull` / `ReplyToIdFull`

模板变量请参见 [Configuration](/zh-CN/gateway/configuration)。

## 分块流式传输

控制回复是作为单条消息发送，还是以分块方式流式发送：

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // 启用分块流式传输（默认关闭）
    },
  },
}
```

## 媒体 + 限制

- 入站附件会被下载并存储到媒体缓存中。
- 入站和出站媒体都通过 `channels.bluebubbles.mediaMaxMb` 限制媒体大小（默认：8 MB）。
- 出站文本会按 `channels.bluebubbles.textChunkLimit` 进行分块（默认：4000 个字符）。

## 配置参考

完整配置： [Configuration](/zh-CN/gateway/configuration)

提供商选项：

- `channels.bluebubbles.enabled`：启用/禁用该渠道。
- `channels.bluebubbles.serverUrl`：BlueBubbles REST API 基础 URL。
- `channels.bluebubbles.password`：API 密码。
- `channels.bluebubbles.webhookPath`：Webhook 端点路径（默认：`/bluebubbles-webhook`）。
- `channels.bluebubbles.dmPolicy`：`pairing | allowlist | open | disabled`（默认：`pairing`）。
- `channels.bluebubbles.allowFrom`：私信允许列表（句柄、电子邮件、E.164 号码、`chat_id:*`、`chat_guid:*`）。
- `channels.bluebubbles.groupPolicy`：`open | allowlist | disabled`（默认：`allowlist`）。
- `channels.bluebubbles.groupAllowFrom`：群组发送者允许列表。
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`：在 macOS 上，在门控通过后可选地从本地通讯录增强未命名的群组参与者。默认：`false`。
- `channels.bluebubbles.groups`：按群组配置（`requireMention` 等）。
- `channels.bluebubbles.sendReadReceipts`：发送已读回执（默认：`true`）。
- `channels.bluebubbles.blockStreaming`：启用分块流式传输（默认：`false`；流式回复必需）。
- `channels.bluebubbles.textChunkLimit`：出站分块大小，单位为字符（默认：4000）。
- `channels.bluebubbles.sendTimeoutMs`：通过 `/api/v1/message/text` 发送出站文本时每个请求的超时时间（毫秒，默认：30000）。在 macOS 26 设置中，如果 Private API iMessage 发送可能在 iMessage 框架内部停滞 60+ 秒，请调高此值；例如 `45000` 或 `60000`。探测、聊天查找、回应、编辑和健康检查目前仍保持较短的 10 秒默认值；后续计划扩展到回应和编辑。按账户覆盖：`channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
- `channels.bluebubbles.chunkMode`：`length`（默认）仅在超过 `textChunkLimit` 时拆分；`newline` 会先按空行（段落边界）拆分，再按长度分块。
- `channels.bluebubbles.mediaMaxMb`：入站/出站媒体上限，单位 MB（默认：8）。
- `channels.bluebubbles.mediaLocalRoots`：允许出站使用本地媒体路径的绝对本地目录显式允许列表。默认情况下，除非配置此项，否则会拒绝本地路径发送。按账户覆盖：`channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
- `channels.bluebubbles.historyLimit`：用于上下文的最大群组消息数（0 表示禁用）。
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
- 直接句柄：`+15555550123`、`user@example.com`
  - 如果某个直接句柄尚不存在私信聊天，OpenClaw 将通过 `POST /api/v1/chat/new` 创建一个。这要求启用 BlueBubbles Private API。

## 安全

- Webhook 请求通过将 `guid`/`password` 查询参数或标头与 `channels.bluebubbles.password` 进行比对来验证身份。
- 请妥善保管 API 密码和 webhook 端点（将它们视为凭证）。
- BlueBubbles webhook 身份验证没有 localhost 绕过。如果你代理 webhook 流量，请确保请求端到端携带 BlueBubbles 密码。这里的 `gateway.trustedProxies` 不能替代 `channels.bluebubbles.password`。参见 [Gateway security](/zh-CN/gateway/security#reverse-proxy-configuration)。
- 如果要将 BlueBubbles 服务器暴露到局域网之外，请启用 HTTPS + 防火墙规则。

## 故障排除

- 如果正在输入/已读事件停止工作，请检查 BlueBubbles webhook 日志，并确认 Gateway 网关路径与 `channels.bluebubbles.webhookPath` 匹配。
- 配对码会在一小时后过期；请使用 `openclaw pairing list bluebubbles` 和 `openclaw pairing approve bluebubbles <code>`。
- 回应需要 BlueBubbles private API（`POST /api/v1/message/react`）；请确认服务器版本提供此功能。
- 编辑/撤回需要 macOS 13+ 和兼容的 BlueBubbles 服务器版本。在 macOS 26（Tahoe）上，由于 private API 变更，编辑目前已损坏。
- 群组图标更新在 macOS 26（Tahoe）上可能不稳定：API 可能返回成功，但新图标不会同步。
- OpenClaw 会根据 BlueBubbles 服务器的 macOS 版本自动隐藏已知损坏的操作。如果在 macOS 26（Tahoe）上仍显示 edit，请使用 `channels.bluebubbles.actions.edit=false` 手动禁用。
- 状态/健康信息请使用：`openclaw status --all` 或 `openclaw status --deep`。

有关一般渠道工作流参考，请参见 [Channels](/zh-CN/channels) 和 [Plugins](/zh-CN/tools/plugin) 指南。

## 相关内容

- [Channels Overview](/zh-CN/channels) — 所有受支持的渠道
- [Pairing](/zh-CN/channels/pairing) — 私信身份验证与配对流程
- [Groups](/zh-CN/channels/groups) — 群聊行为与提及门控
- [Channel Routing](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Security](/zh-CN/gateway/security) — 访问模型与加固
