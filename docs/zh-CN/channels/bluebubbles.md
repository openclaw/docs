---
read_when:
    - 设置 BlueBubbles 渠道
    - Webhook 配对故障排除
    - 在 macOS 上配置 iMessage
sidebarTitle: BlueBubbles
summary: 通过 BlueBubbles macOS 服务器使用 iMessage（REST 发送/接收、正在输入、表情回应、配对、高级操作）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-26T06:59:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9a9eef02110f9e40f60c0bbd413c7ad7e33c377a7cf9ca2ae43aa170100ff77
    source_path: channels/bluebubbles.md
    workflow: 15
---

Status：通过 HTTP 与 BlueBubbles macOS 服务器通信的内置插件。由于其 API 更丰富且设置比旧版 imsg 渠道更简单，**推荐用于 iMessage 集成**。

<Note>
当前的 OpenClaw 发布版本已内置 BlueBubbles，因此普通打包构建不需要单独执行 `openclaw plugins install` 步骤。
</Note>

## 概览

- 通过 BlueBubbles 辅助应用在 macOS 上运行（[bluebubbles.app](https://bluebubbles.app)）。
- 推荐/已测试：macOS Sequoia（15）。macOS Tahoe（26）可用；当前在 Tahoe 上编辑功能不可用，群组图标更新也可能报告成功但不会同步。
- OpenClaw 通过其 REST API 与它通信（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）。
- 传入消息通过 webhook 到达；传出回复、正在输入指示、已读回执和 tapback 都通过 REST 调用完成。
- 附件和贴纸会作为入站媒体导入（并在可能时呈现给智能体）。
- 自动 TTS 回复如果合成为 MP3 或 CAF 音频，将作为 iMessage 语音备忘录气泡发送，而不是普通文件附件。
- 配对/allowlist 的工作方式与其他渠道相同（`/channels/pairing` 等），使用 `channels.bluebubbles.allowFrom` + 配对码。
- 表情回应会像 Slack/Telegram 一样作为系统事件呈现，因此智能体可以在回复前“提及”它们。
- 高级功能：编辑、撤回发送、回复线程、消息效果、群组管理。

## 快速开始

<Steps>
  <Step title="安装 BlueBubbles">
    在你的 Mac 上安装 BlueBubbles 服务器（按照 [bluebubbles.app/install](https://bluebubbles.app/install) 上的说明操作）。
  </Step>
  <Step title="启用 Web API">
    在 BlueBubbles 配置中，启用 Web API 并设置密码。
  </Step>
  <Step title="配置 OpenClaw">
    运行 `openclaw onboard` 并选择 BlueBubbles，或手动配置：

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

  </Step>
  <Step title="将 webhook 指向 Gateway 网关">
    将 BlueBubbles webhook 指向你的 Gateway 网关（示例：`https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）。
  </Step>
  <Step title="启动 Gateway 网关">
    启动 Gateway 网关；它会注册 webhook 处理器并开始配对。
  </Step>
</Steps>

<Warning>
**安全性**

- 始终设置 webhook 密码。
- 始终要求进行 webhook 身份验证。OpenClaw 会拒绝 BlueBubbles webhook 请求，除非它们包含与 `channels.bluebubbles.password` 匹配的 password/guid（例如 `?password=<password>` 或 `x-password`），无论 loopback/代理拓扑如何。
- 在读取/解析完整 webhook 请求体之前，会先检查密码身份验证。
  </Warning>

## 保持 Messages.app 处于活动状态（VM / 无头设置）

某些 macOS VM / 常开设置可能会导致 Messages.app 进入“空闲”状态（在应用被打开/切到前台之前，传入事件会停止）。一个简单的变通方案是使用 AppleScript + LaunchAgent **每 5 分钟触发一次 Messages**。

<Steps>
  <Step title="保存 AppleScript">
    将以下内容保存为 `~/Scripts/poke-messages.scpt`：

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

  </Step>
  <Step title="安装 LaunchAgent">
    将以下内容保存为 `~/Library/LaunchAgents/com.user.poke-messages.plist`：

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

    这会**每 300 秒**运行一次，并且**在登录时**运行。首次运行可能会触发 macOS 的**自动化**提示（`osascript` → Messages）。请在运行该 LaunchAgent 的同一用户会话中批准这些提示。

  </Step>
  <Step title="加载它">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## 新手引导

BlueBubbles 可在交互式新手引导中使用：

```
openclaw onboard
```

向导会提示你输入：

<ParamField path="Server URL" type="string" required>
  BlueBubbles 服务器地址（例如 `http://192.168.1.100:1234`）。
</ParamField>
<ParamField path="Password" type="string" required>
  来自 BlueBubbles Server 设置的 API 密码。
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Webhook 端点路径。
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`、`allowlist`、`open` 或 `disabled`。
</ParamField>
<ParamField path="Allow list" type="string[]">
  电话号码、电子邮件或聊天目标。
</ParamField>

你也可以通过 CLI 添加 BlueBubbles：

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## 访问控制（私信 + 群组）

<Tabs>
  <Tab title="私信">
    - 默认值：`channels.bluebubbles.dmPolicy = "pairing"`。
    - 未知发送者会收到一个配对码；在获批之前，消息会被忽略（代码在 1 小时后过期）。
    - 通过以下命令批准：
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - 配对是默认的令牌交换方式。详情请参见：[Pairing](/zh-CN/channels/pairing)
  </Tab>
  <Tab title="群组">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（默认：`allowlist`）。
    - 当设置为 `allowlist` 时，`channels.bluebubbles.groupAllowFrom` 用于控制哪些人可以在群组中触发。
  </Tab>
</Tabs>

### 联系人名称增强（macOS，可选）

BlueBubbles 群组 webhook 通常只包含原始参与者地址。如果你希望 `GroupMembers` 上下文改为显示本地联系人名称，可以选择在 macOS 上启用本地联系人增强：

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` 启用查找。默认值：`false`。
- 只有在群组访问、命令授权和提及门控都已允许该消息通过之后，才会执行查找。
- 只有未命名的电话参与者会被增强。
- 当未找到本地匹配项时，原始电话号码仍会作为回退值保留。

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

- 使用 `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）检测提及。
- 当某个群组启用 `requireMention` 时，智能体只会在被提及时响应。
- 来自已授权发送者的控制命令会绕过提及门控。

每个群组的配置：

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // 所有群组的默认值
        "iMessage;-;chat123": { requireMention: false }, // 覆盖特定群组
      },
    },
  },
}
```

### 命令门控

- 控制命令（例如 `/config`、`/model`）需要授权。
- 使用 `allowFrom` 和 `groupAllowFrom` 来确定命令授权。
- 已授权的发送者即使在群组中未提及，也可以运行控制命令。

### 每个群组的系统提示词

`channels.bluebubbles.groups.*` 下的每个条目都接受一个可选的 `systemPrompt` 字符串。每次处理该群组中的消息时，这个值都会注入到智能体的系统提示词中，因此你可以为每个群组设置不同的人设或行为规则，而无需编辑智能体提示词：

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

该键会匹配 BlueBubbles 报告的 `chatGuid` / `chatIdentifier` / 数字 `chatId` 中的任意一种，而 `"*"` 通配符条目会为所有没有精确匹配的群组提供默认值（与 `requireMention` 和每组工具策略使用相同的模式）。精确匹配始终优先于通配符。私信会忽略此字段；请改用智能体级别或账户级别的提示词自定义。

#### 示例：线程回复和 tapback 表情回应（Private API）

启用 BlueBubbles Private API 后，入站消息会附带短消息 ID（例如 `[[reply_to:5]]`），智能体可以调用 `action=reply` 以在线程中回复特定消息，或调用 `action=react` 发送一个 tapback。每个群组的 `systemPrompt` 是确保智能体选择正确工具的可靠方式：

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

tapback 表情回应和线程回复都需要 BlueBubbles Private API；底层机制请参见 [Advanced actions](#advanced-actions) 和 [Message IDs](#message-ids-short-vs-full)。

## ACP 会话绑定

BlueBubbles 聊天可以在不改变传输层的情况下转换为持久 ACP 工作区。

快速操作流程：

- 在私信或允许的群聊中运行 `/acp spawn codex --bind here`。
- 该 BlueBubbles 会话中的后续消息会路由到新创建的 ACP 会话。
- `/new` 和 `/reset` 会在原位置重置同一个已绑定的 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

也支持通过顶层 `bindings[]` 条目配置持久绑定，使用 `type: "acp"` 和 `match.channel: "bluebubbles"`。

`match.peer.id` 可以使用任何受支持的 BlueBubbles 目标格式：

- 规范化的私信标识，例如 `+15555550123` 或 `user@example.com`
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
- **正在输入指示**：OpenClaw 会发送开始输入事件；BlueBubbles 会在发送完成或超时后自动清除输入状态（通过 DELETE 手动停止并不可靠）。

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

BlueBubbles 在配置中启用后支持高级消息操作：

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

<AccordionGroup>
  <Accordion title="可用操作">
    - **react**：添加/移除 tapback 表情回应（`messageId`、`emoji`、`remove`）。iMessage 原生的 tapback 集合为 `love`、`like`、`dislike`、`laugh`、`emphasize` 和 `question`。当智能体选择了集合之外的 emoji（例如 `👀`）时，表情回应工具会回退为 `love`，这样 tapback 仍然可以渲染，而不是让整个请求失败。已配置的确认表情回应仍会严格校验，并在值未知时报错。
    - **edit**：编辑已发送消息（`messageId`、`text`）。
    - **unsend**：撤回消息（`messageId`）。
    - **reply**：回复特定消息（`messageId`、`text`、`to`）。
    - **sendWithEffect**：使用 iMessage 效果发送（`text`、`to`、`effectId`）。
    - **renameGroup**：重命名群聊（`chatGuid`、`displayName`）。
    - **setGroupIcon**：设置群聊图标/照片（`chatGuid`、`media`）—— 在 macOS 26 Tahoe 上不稳定（API 可能返回成功，但图标不会同步）。
    - **addParticipant**：向群组添加某人（`chatGuid`、`address`）。
    - **removeParticipant**：从群组移除某人（`chatGuid`、`address`）。
    - **leaveGroup**：退出群聊（`chatGuid`）。
    - **upload-file**：发送媒体/文件（`to`、`buffer`、`filename`、`asVoice`）。
      - 语音备忘录：将 `asVoice: true` 与 **MP3** 或 **CAF** 音频一起使用，以作为 iMessage 语音消息发送。BlueBubbles 在发送语音备忘录时会将 MP3 转换为 CAF。
    - 旧别名：`sendAttachment` 仍然可用，但 `upload-file` 是规范操作名称。
  </Accordion>
</AccordionGroup>

### 消息 ID（短 ID 与完整 ID）

OpenClaw 可能会显示_短_消息 ID（例如 `1`、`2`）以节省 token。

- `MessageSid` / `ReplyToId` 可以是短 ID。
- `MessageSidFull` / `ReplyToIdFull` 包含提供商的完整 ID。
- 短 ID 仅存在于内存中；它们可能会在重启或缓存逐出后失效。
- 操作接受短或完整 `messageId`，但如果短 ID 不再可用，就会报错。

对于持久自动化和存储，请使用完整 ID：

- 模板：`{{MessageSidFull}}`、`{{ReplyToIdFull}}`
- 上下文：入站负载中的 `MessageSidFull` / `ReplyToIdFull`

模板变量请参见 [配置](/zh-CN/gateway/configuration)。

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 合并拆分发送的私信（一次输入中的命令 + URL）

当用户在 iMessage 中同时输入命令和 URL 时——例如 `Dump https://example.com/article`——Apple 会将发送拆分为**两个独立的 webhook 投递**：

1. 一条文本消息（`"Dump"`）。
2. 一个 URL 预览气泡（`"https://..."`），其 OG 预览图片作为附件发送。

在大多数设置中，这两个 webhook 会相隔约 0.8 - 2.0 秒到达 OpenClaw。如果不进行合并，智能体在第 1 轮只会收到命令本身，随后作出回复（通常是“把 URL 发给我”），直到第 2 轮才看到 URL —— 到那时命令上下文已经丢失。

`channels.bluebubbles.coalesceSameSenderDms` 可让私信选择启用：将来自同一发送者、连续到达的 webhook 合并为同一个智能体轮次。群聊仍会按每条消息分别处理，从而保留多用户的轮次结构。

<Tabs>
  <Tab title="何时启用">
    在以下情况下启用：

    - 你提供的 Skills 期望在一条消息中收到 `command + payload`（dump、paste、save、queue 等）。
    - 你的用户会把 URL、图片或长内容与命令一起粘贴发送。
    - 你可以接受私信轮次增加的延迟（见下文）。

    在以下情况下保持禁用：

    - 你需要单词型私信触发命令的最低延迟。
    - 你的所有流程都是不带后续负载的一次性命令。

  </Tab>
  <Tab title="启用方式">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // 选择启用（默认：false）
        },
      },
    }
    ```

    启用该标志且未显式设置 `messages.inbound.byChannel.bluebubbles` 时，去抖窗口会扩大到 **2500 ms**（不启用合并时的默认值为 500 ms）。这个更大的窗口是必需的——Apple 0.8 - 2.0 秒的拆分发送节奏无法适配更紧的默认窗口。

    如果你想自行调整窗口：

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms 适用于大多数设置；如果你的 Mac 较慢
            // 或处于内存压力下（观察到的间隔可能会超过 2 秒），请提高到 4000 ms。
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="权衡">
    - **私信控制命令会增加延迟。** 启用该标志后，私信控制命令消息（如 `Dump`、`Save` 等）在分发前会等待最多一个去抖窗口，以防后续还有负载 webhook 到来。群聊命令仍保持即时分发。
    - **合并后的输出有上限**—— 合并文本最多 4000 个字符，并带有明确的 `…[truncated]` 标记；附件最多 20 个；源条目最多 10 个（超出后保留第一条和最新条目）。每个源 `messageId` 仍会进入入站去重，因此后续如果 MessagePoller 重放任意单个事件，仍会被识别为重复。
    - **按渠道选择启用。** 其他渠道（Telegram、WhatsApp、Slack、……）不受影响。
  </Tab>
</Tabs>

### 场景以及智能体看到的内容

| 用户输入内容 | Apple 投递内容 | 标志关闭（默认） | 标志开启 + 2500 ms 窗口 |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（一次发送） | 2 个 webhook，相隔约 1 秒 | 两个智能体轮次：“Dump” 单独一轮，然后是 URL | 一个轮次：合并文本 `Dump https://example.com` |
| `Save this 📎image.jpg caption`（附件 + 文本） | 2 个 webhook | 两个轮次 | 一个轮次：文本 + 图片 |
| `/status`（独立命令） | 1 个 webhook | 即时分发 | **最多等待一个窗口，然后分发** |
| 单独粘贴的 URL | 1 个 webhook | 即时分发 | 即时分发（桶中只有一个条目） |
| 文本 + URL 作为两条有意分开发送的消息，间隔数分钟 | 超出窗口的 2 个 webhook | 两个轮次 | 两个轮次（窗口会在它们之间过期） |
| 快速洪泛（窗口内 >10 条小型私信） | N 个 webhook | N 个轮次 | 一个轮次，输出有界（应用第一条 + 最新条目、文本/附件上限） |

### 拆分发送合并故障排除

如果该标志已启用，但拆分发送仍然以两个轮次到达，请逐层检查：

<AccordionGroup>
  <Accordion title="配置是否已实际加载">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    然后执行 `openclaw gateway restart` —— 该标志会在 debouncer-registry 创建时读取。

  </Accordion>
  <Accordion title="去抖窗口对你的设置是否足够宽">
    查看位于 `~/Library/Logs/bluebubbles-server/main.log` 的 BlueBubbles 服务器日志：

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    测量 `"Dump"` 这类文本分发与随后 `"https://..."; Attachments:` 分发之间的间隔。将 `messages.inbound.byChannel.bluebubbles` 提高到足以覆盖该间隔的值。

  </Accordion>
  <Accordion title="会话 JSONL 时间戳 ≠ webhook 到达时间">
    会话事件时间戳（`~/.openclaw/agents/<id>/sessions/*.jsonl`）反映的是 Gateway 网关何时将消息交给智能体，**而不是** webhook 何时到达。若排队中的第二条消息被标记为 `[Queued messages while agent was busy]`，表示第一个轮次在第二个 webhook 到达时仍在运行—— 合并桶已经刷新。请根据 BB 服务器日志而不是会话日志来调整窗口。
  </Accordion>
  <Accordion title="内存压力导致回复分发变慢">
    在较小的机器（8 GB）上，智能体轮次可能会耗时到让合并桶在回复完成前就已刷新，而 URL 会作为排队的第二轮到达。检查 `memory_pressure` 和 `ps -o rss -p $(pgrep openclaw-gateway)`；如果 Gateway 网关超过约 500 MB RSS 且压缩器处于活动状态，请关闭其他高负载进程，或升级到更大的主机。
  </Accordion>
  <Accordion title="引用回复发送走的是另一条路径">
    如果用户将 `Dump` 作为对已有 URL 气泡的**回复**发送（iMessage 会在 Dump 气泡上显示 “1 Reply” 标记），则 URL 位于 `replyToBody` 中，而不是第二个 webhook 中。此时不适用合并—— 这是 Skills/提示词问题，而不是 debouncer 问题。
  </Accordion>
</AccordionGroup>

## 分块流式传输

控制回复是作为单条消息发送，还是按块流式发送：

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

- 入站附件会被下载并存储在媒体缓存中。
- 入站和出站媒体可通过 `channels.bluebubbles.mediaMaxMb` 设置媒体大小上限（默认：8 MB）。
- 出站文本会按 `channels.bluebubbles.textChunkLimit` 分块（默认：4000 个字符）。

## 配置参考

完整配置： [配置](/zh-CN/gateway/configuration)

<AccordionGroup>
  <Accordion title="连接与 webhook">
    - `channels.bluebubbles.enabled`：启用/禁用该渠道。
    - `channels.bluebubbles.serverUrl`：BlueBubbles REST API 基础 URL。
    - `channels.bluebubbles.password`：API 密码。
    - `channels.bluebubbles.webhookPath`：Webhook 端点路径（默认：`/bluebubbles-webhook`）。
  </Accordion>
  <Accordion title="访问策略">
    - `channels.bluebubbles.dmPolicy`：`pairing | allowlist | open | disabled`（默认：`pairing`）。
    - `channels.bluebubbles.allowFrom`：私信 allowlist（handle、电子邮件、E.164 号码、`chat_id:*`、`chat_guid:*`）。
    - `channels.bluebubbles.groupPolicy`：`open | allowlist | disabled`（默认：`allowlist`）。
    - `channels.bluebubbles.groupAllowFrom`：群组发送者 allowlist。
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`：在 macOS 上，可在门控通过后选择性地从本地联系人中增强未命名的群组参与者信息。默认：`false`。
    - `channels.bluebubbles.groups`：每个群组的配置（`requireMention` 等）。
  </Accordion>
  <Accordion title="投递与分块">
    - `channels.bluebubbles.sendReadReceipts`：发送已读回执（默认：`true`）。
    - `channels.bluebubbles.blockStreaming`：启用分块流式传输（默认：`false`；流式回复所必需）。
    - `channels.bluebubbles.textChunkLimit`：出站分块的字符数上限（默认：4000）。
    - `channels.bluebubbles.sendTimeoutMs`：通过 `/api/v1/message/text` 发送出站文本时，每个请求的超时时间（毫秒，默认：30000）。在 macOS 26 设置中，如果 Private API 的 iMessage 发送可能在 iMessage 框架内部卡住 60+ 秒，请调高该值；例如 `45000` 或 `60000`。探测、聊天查找、表情回应、编辑和健康检查当前仍保持较短的 10 秒默认值；后续计划将扩展覆盖到表情回应和编辑。每个账户的覆盖项：`channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
    - `channels.bluebubbles.chunkMode`：`length`（默认）仅在超过 `textChunkLimit` 时拆分；`newline` 会先按空行（段落边界）拆分，再按长度分块。
  </Accordion>
  <Accordion title="媒体与历史记录">
    - `channels.bluebubbles.mediaMaxMb`：入站/出站媒体大小上限（MB，默认：8）。
    - `channels.bluebubbles.mediaLocalRoots`：允许用于出站本地媒体路径的绝对本地目录显式 allowlist。默认会拒绝发送本地路径，除非已配置该项。每个账户的覆盖项：`channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
    - `channels.bluebubbles.coalesceSameSenderDms`：将来自同一发送者、连续到达的私信 webhook 合并为一个智能体轮次，以便 Apple 的文本 + URL 拆分发送能作为单条消息到达（默认：`false`）。场景、窗口调优和权衡请参见[合并拆分发送的私信](#coalescing-split-send-dms-command--url-in-one-composition)。若启用且未显式设置 `messages.inbound.byChannel.bluebubbles`，默认入站去抖窗口会从 500 ms 扩大到 2500 ms。
    - `channels.bluebubbles.historyLimit`：用于上下文的群组消息最大数量（0 表示禁用）。
    - `channels.bluebubbles.dmHistoryLimit`：私信历史记录上限。
  </Accordion>
  <Accordion title="操作与账户">
    - `channels.bluebubbles.actions`：启用/禁用特定操作。
    - `channels.bluebubbles.accounts`：多账户配置。
  </Accordion>
</AccordionGroup>

相关全局选项：

- `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`。

## 寻址 / 投递目标

为获得稳定路由，优先使用 `chat_guid`：

- `chat_guid:iMessage;-;+15555550123`（群组首选）
- `chat_id:123`
- `chat_identifier:...`
- 直接 handle：`+15555550123`、`user@example.com`
  - 如果某个直接 handle 没有现有私信聊天，OpenClaw 会通过 `POST /api/v1/chat/new` 创建一个。这要求启用 BlueBubbles Private API。

### iMessage 与 SMS 路由

当同一个 handle 在 Mac 上同时存在 iMessage 聊天和 SMS 聊天时（例如某个电话号码已注册 iMessage，但也收到过绿色气泡回退消息），OpenClaw 会优先选择 iMessage 聊天，并且绝不会静默降级为 SMS。若要强制使用 SMS 聊天，请使用显式的 `sms:` 目标前缀（例如 `sms:+15555550123`）。如果某个 handle 没有匹配的 iMessage 聊天，仍会通过 BlueBubbles 报告的可用聊天发送。

## 安全性

- Webhook 请求通过将 `guid`/`password` 查询参数或请求头与 `channels.bluebubbles.password` 进行比较来完成身份验证。
- 请对 API 密码和 webhook 端点保密（将它们视为凭证）。
- BlueBubbles webhook 身份验证没有 localhost 绕过。如果你代理 webhook 流量，请在端到端请求中保留 BlueBubbles 密码。这里的 `gateway.trustedProxies` 不能替代 `channels.bluebubbles.password`。参见 [Gateway 网关安全性](/zh-CN/gateway/security#reverse-proxy-configuration)。
- 如果要在局域网之外暴露 BlueBubbles 服务器，请启用 HTTPS + 防火墙规则。

## 故障排除

- 如果正在输入/已读事件停止工作，请检查 BlueBubbles webhook 日志，并确认 Gateway 网关路径与 `channels.bluebubbles.webhookPath` 匹配。
- 配对码会在一小时后过期；请使用 `openclaw pairing list bluebubbles` 和 `openclaw pairing approve bluebubbles <code>`。
- 表情回应需要 BlueBubbles private API（`POST /api/v1/message/react`）；请确保服务器版本已提供该接口。
- 编辑/撤回需要 macOS 13+ 和兼容的 BlueBubbles 服务器版本。在 macOS 26（Tahoe）上，由于 private API 变更，编辑功能当前不可用。
- 群组图标更新在 macOS 26（Tahoe）上可能不稳定：API 可能返回成功，但新图标不会同步。
- OpenClaw 会根据 BlueBubbles 服务器的 macOS 版本自动隐藏已知不可用的操作。如果在 macOS 26（Tahoe）上仍显示编辑，请使用 `channels.bluebubbles.actions.edit=false` 手动禁用。
- 已启用 `coalesceSameSenderDms`，但拆分发送（例如 `Dump` + URL）仍然作为两个轮次到达：请参见[拆分发送合并故障排除](#split-send-coalescing-troubleshooting)检查清单—— 常见原因包括去抖窗口过窄、误将会话日志时间戳当作 webhook 到达时间，或引用回复发送（它使用 `replyToBody`，而不是第二个 webhook）。
- 查看 Status/健康信息：`openclaw status --all` 或 `openclaw status --deep`。

有关一般渠道工作流程参考，请参见[渠道](/zh-CN/channels)和[插件](/zh-CN/tools/plugin)指南。

## 相关内容

- [渠道路由](/zh-CN/channels/channel-routing) —— 消息的会话路由
- [渠道概览](/zh-CN/channels) —— 所有受支持的渠道
- [群组](/zh-CN/channels/groups) —— 群聊行为与提及门控
- [配对](/zh-CN/channels/pairing) —— 私信身份验证与配对流程
- [安全性](/zh-CN/gateway/security) —— 访问模型与加固
