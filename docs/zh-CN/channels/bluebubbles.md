---
read_when:
    - 设置 BlueBubbles 渠道
    - webhook 配对故障排除
    - 在 macOS 上配置 iMessage
sidebarTitle: BlueBubbles
summary: 通过 BlueBubbles macOS 服务器使用 iMessage（REST 发送/接收、正在输入状态、回应、配对、高级操作）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-28T11:45:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a77b248ed86eb4114f8b7f1fc6bd4cea004d65095a0439a4a8c814bc180082c
    source_path: channels/bluebubbles.md
    workflow: 16
---

Status：与 BlueBubbles macOS 服务器通过 HTTP 通信的内置插件。**推荐用于 iMessage 集成**，因为相比旧版 imsg 渠道，它的 API 更丰富，设置也更简单。

<Note>
当前 OpenClaw 版本内置 BlueBubbles，因此普通打包构建不需要单独执行 `openclaw plugins install` 步骤。
</Note>

## 概览

- 通过 BlueBubbles 辅助应用（[bluebubbles.app](https://bluebubbles.app)）在 macOS 上运行。
- 推荐/已测试：macOS Sequoia (15)。macOS Tahoe (26) 可用；目前 Tahoe 上的编辑功能损坏，群组图标更新可能报告成功但不会同步。
- OpenClaw 通过它的 REST API（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）与其通信。
- 传入消息通过 webhook 到达；传出回复、正在输入指示、已读回执和 tapback 都是 REST 调用。
- 附件和贴纸会作为入站媒体摄取（并在可能时呈现给智能体）。
- 合成 MP3 或 CAF 音频的自动 TTS 回复会作为 iMessage 语音备忘录气泡发送，而不是普通文件附件。
- 配对/允许列表的工作方式与其他渠道相同（`/channels/pairing` 等），使用 `channels.bluebubbles.allowFrom` + 配对码。
- 反应会像 Slack/Telegram 一样作为系统事件呈现，因此智能体可以在回复前“提及”它们。
- 高级功能：编辑、撤回、回复线程、消息效果、群组管理。

## 快速开始

<Steps>
  <Step title="Install BlueBubbles">
    在你的 Mac 上安装 BlueBubbles 服务器（按照 [bluebubbles.app/install](https://bluebubbles.app/install) 的说明操作）。
  </Step>
  <Step title="Enable the web API">
    在 BlueBubbles 配置中启用 web API 并设置密码。
  </Step>
  <Step title="Configure OpenClaw">
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
  <Step title="Point webhooks at the gateway">
    将 BlueBubbles webhook 指向你的 Gateway 网关（示例：`https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）。
  </Step>
  <Step title="Start the gateway">
    启动 Gateway 网关；它会注册 webhook 处理程序并开始配对。
  </Step>
</Steps>

<Warning>
**安全**

- 始终设置 webhook 密码。
- webhook 身份验证始终是必需的。除非 BlueBubbles webhook 请求包含与 `channels.bluebubbles.password` 匹配的密码/guid（例如 `?password=<password>` 或 `x-password`），否则 OpenClaw 会拒绝该请求，无论 local loopback/代理拓扑如何。
- 在读取/解析完整 webhook 正文之前会先检查密码身份验证。

</Warning>

## 让 Messages.app 保持活跃（VM / 无头设置）

某些 macOS VM / 常开设置可能会导致 Messages.app 进入“空闲”状态（传入事件会停止，直到应用被打开/置于前台）。一个简单的解决方法是使用 AppleScript + LaunchAgent **每 5 分钟轻触 Messages 一次**。

<Steps>
  <Step title="Save the AppleScript">
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
  <Step title="Install a LaunchAgent">
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

    这会**每 300 秒**运行一次，并且**登录时**运行。首次运行可能会触发 macOS **Automation** 提示（`osascript` → Messages）。请在运行 LaunchAgent 的同一用户会话中批准它们。

  </Step>
  <Step title="Load it">
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

向导会提示填写：

<ParamField path="Server URL" type="string" required>
  BlueBubbles 服务器地址（例如 `http://192.168.1.100:1234`）。
</ParamField>
<ParamField path="Password" type="string" required>
  来自 BlueBubbles 服务器设置的 API 密码。
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  webhook 端点路径。
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
  <Tab title="DMs">
    - 默认：`channels.bluebubbles.dmPolicy = "pairing"`。
    - 未知发送者会收到配对码；在获批前消息会被忽略（代码 1 小时后过期）。
    - 通过以下方式批准：
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - 配对是默认的令牌交换方式。详情：[配对](/zh-CN/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（默认：`allowlist`）。
    - `channels.bluebubbles.groupAllowFrom` 控制在设置 `allowlist` 时谁可以在群组中触发。

  </Tab>
</Tabs>

### 联系人名称增强（macOS，可选）

BlueBubbles 群组 webhook 通常只包含原始参与者地址。如果你希望 `GroupMembers` 上下文改为显示本地联系人名称，可以选择在 macOS 上启用本地 Contacts 增强：

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` 启用查询。默认值：`false`。
- 查询只会在群组访问、命令授权和提及门控允许消息通过后运行。
- 只会增强没有名称的电话参与者。
- 找不到本地匹配项时，原始电话号码会保留为回退值。

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

BlueBubbles 支持群组聊天的提及门控，匹配 iMessage/WhatsApp 行为：

- 使用 `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）检测提及。
- 当某个群组启用 `requireMention` 时，智能体只会在被提及时响应。
- 授权发送者的控制命令会绕过提及门控。

按群组配置：

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default for all groups
        "iMessage;-;chat123": { requireMention: false }, // override for specific group
      },
    },
  },
}
```

### 命令门控

- 控制命令（例如 `/config`、`/model`）需要授权。
- 使用 `allowFrom` 和 `groupAllowFrom` 确定命令授权。
- 授权发送者即使在群组中没有提及也可以运行控制命令。

### 按群组系统提示词

`channels.bluebubbles.groups.*` 下的每个条目都接受可选的 `systemPrompt` 字符串。该值会在处理该群组消息的每一轮中注入智能体的系统提示词，因此你可以设置按群组的人设或行为规则，而无需编辑智能体提示词：

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

该键匹配 BlueBubbles 为群组报告的任何 `chatGuid` / `chatIdentifier` / 数字 `chatId`，而 `"*"` 通配符条目会为没有精确匹配的每个群组提供默认值（与 `requireMention` 和按群组工具策略使用相同模式）。精确匹配始终优先于通配符。私信会忽略此字段；请改用智能体级或账户级提示词自定义。

#### 完整示例：线程回复和 tapback 反应（Private API）

启用 BlueBubbles Private API 后，入站消息会携带短消息 ID（例如 `[[reply_to:5]]`），智能体可以调用 `action=reply` 将回复接入特定消息线程，或调用 `action=react` 发送 tapback。按群组的 `systemPrompt` 是让智能体选择正确工具的可靠方式：

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

Tapback 反应和线程回复都需要 BlueBubbles Private API；请参阅[高级操作](#advanced-actions)和[消息 ID](#message-ids-short-vs-full)了解底层机制。

## ACP 对话绑定

BlueBubbles 聊天可以转换为持久 ACP 工作区，而无需更改传输层。

快速操作员流程：

- 在私信或允许的群组聊天中运行 `/acp spawn codex --bind here`。
- 同一 BlueBubbles 对话中的后续消息会路由到生成的 ACP 会话。
- `/new` 和 `/reset` 会就地重置同一个已绑定 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

也支持通过顶层 `bindings[]` 条目配置持久绑定，使用 `type: "acp"` 和 `match.channel: "bluebubbles"`。

`match.peer.id` 可以使用任何受支持的 BlueBubbles 目标形式：

- 规范化私信句柄，例如 `+15555550123` 或 `user@example.com`
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

请参阅 [ACP Agents](/zh-CN/tools/acp-agents) 了解共享 ACP 绑定行为。

## 正在输入 + 已读回执

- **输入指示器**：在响应生成前和生成期间自动发送。
- **已读回执**：由 `channels.bluebubbles.sendReadReceipts` 控制（默认：`true`）。
- **输入指示器**：OpenClaw 发送输入开始事件；BlueBubbles 会在发送或超时后自动清除输入状态（通过 DELETE 手动停止并不可靠）。

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
    },
  },
}
```

## 高级操作

BlueBubbles 在配置启用后支持高级消息操作：

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Available actions">
    - **react**：添加/移除 tapback 反应（`messageId`、`emoji`、`remove`）。iMessage 的原生 tapback 集合是 `love`、`like`、`dislike`、`laugh`、`emphasize` 和 `question`。当智能体选择该集合之外的表情符号时（例如 `👀`），反应工具会回退到 `love`，这样 tapback 仍会渲染，而不是让整个请求失败。配置的确认反应仍会严格校验，并在遇到未知值时报错。
    - **edit**：编辑已发送的消息（`messageId`、`text`）。
    - **unsend**：撤回一条消息（`messageId`）。
    - **reply**：回复特定消息（`messageId`、`text`、`to`）。
    - **sendWithEffect**：使用 iMessage 效果发送（`text`、`to`、`effectId`）。
    - **renameGroup**：重命名群聊（`chatGuid`、`displayName`）。
    - **setGroupIcon**：设置群聊图标/照片（`chatGuid`、`media`）— 在 macOS 26 Tahoe 上不稳定（API 可能返回成功，但图标不会同步）。
    - **addParticipant**：向群组添加某人（`chatGuid`、`address`）。
    - **removeParticipant**：从群组移除某人（`chatGuid`、`address`）。
    - **leaveGroup**：退出群聊（`chatGuid`）。
    - **upload-file**：发送媒体/文件（`to`、`buffer`、`filename`、`asVoice`）。
      - 语音备忘录：设置 `asVoice: true`，并使用 **MP3** 或 **CAF** 音频作为 iMessage 语音消息发送。发送语音备忘录时，BlueBubbles 会将 MP3 → CAF。
    - 旧别名：`sendAttachment` 仍然可用，但 `upload-file` 是规范操作名称。

  </Accordion>
</AccordionGroup>

### 消息 ID（短 ID 与完整 ID）

OpenClaw 可能会暴露_短_消息 ID（例如 `1`、`2`）以节省 token。

- `MessageSid` / `ReplyToId` 可以是短 ID。
- `MessageSidFull` / `ReplyToIdFull` 包含提供商完整 ID。
- 短 ID 保存在内存中；它们可能会在重启或缓存逐出后过期。
- 操作接受短 ID 或完整 `messageId`，但如果短 ID 不再可用会报错。

将完整 ID 用于持久自动化和存储：

- 模板：`{{MessageSidFull}}`、`{{ReplyToIdFull}}`
- 上下文：入站载荷中的 `MessageSidFull` / `ReplyToIdFull`

有关模板变量，请参阅[配置](/zh-CN/gateway/configuration)。

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 合并拆分发送的私信（命令 + URL 在同一次撰写中）

当用户在 iMessage 中同时输入命令和 URL 时，例如 `Dump https://example.com/article`，Apple 会把发送拆分为**两个独立的 webhook 投递**：

1. 一条文本消息（`"Dump"`）。
2. 一个 URL 预览气泡（`"https://..."`），其中 OG 预览图片作为附件。

在大多数设置中，这两个 webhook 会间隔约 0.8-2.0 秒到达 OpenClaw。如果不进行合并，智能体会在第 1 轮只收到命令、回复（通常是“把 URL 发给我”），然后在第 2 轮才看到 URL，而此时命令上下文已经丢失。

`channels.bluebubbles.coalesceSameSenderDms` 会让私信把同一发送者的连续 webhook 合并到单个智能体轮次中。群聊仍然按每条消息设键，因此会保留多用户轮次结构。

<Tabs>
  <Tab title="When to enable">
    在以下情况启用：

    - 你发布的 Skills 期望在一条消息中收到 `command + payload`（dump、paste、save、queue 等）。
    - 你的用户会在命令旁边粘贴 URL、图片或长内容。
    - 你可以接受增加的私信轮次延迟（见下文）。

    在以下情况保持禁用：

    - 你需要单词私信触发器的最低命令延迟。
    - 你的所有流程都是没有载荷后续内容的一次性命令。

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    启用该标志且没有显式设置 `messages.inbound.byChannel.bluebubbles` 时，防抖窗口会扩大到 **2500 ms**（非合并默认值为 500 ms）。需要更宽的窗口，因为 Apple 的拆分发送节奏为 0.8-2.0 秒，无法适配更紧的默认值。

    如需自行调整窗口：

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is slow
            // or under memory pressure (observed gap can stretch past 2 s then).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-offs">
    - **私信控制命令会增加延迟。** 启用该标志后，私信控制命令消息（例如 `Dump`、`Save` 等）现在会等待最多一个防抖窗口后再分发，以防有载荷 webhook 即将到达。群聊命令仍会即时分发。
    - **合并输出有边界** — 合并文本最多 4000 个字符，并带有显式 `…[truncated]` 标记；附件最多 20 个；来源条目最多 10 个（超过后保留第一个加最新的条目）。每个来源 `messageId` 仍会进入入站去重，因此之后 MessagePoller 重放任何单独事件时都会被识别为重复。
    - **按渠道选择启用。** 其他渠道（Telegram、WhatsApp、Slack、…）不受影响。

  </Tab>
</Tabs>

### 场景以及智能体看到的内容

| 用户撰写                                                           | Apple 投递                 | 标志关闭（默认）                         | 标志开启 + 2500 ms 窗口                                                |
| ------------------------------------------------------------------ | -------------------------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| `Dump https://example.com`（一次发送）                              | 2 个 webhook，间隔约 1 秒  | 两个智能体轮次：“Dump” 单独出现，然后是 URL | 一个轮次：合并文本 `Dump https://example.com`                          |
| `Save this 📎image.jpg caption`（附件 + 文本）                      | 2 个 webhook               | 两个轮次                                 | 一个轮次：文本 + 图片                                                  |
| `/status`（独立命令）                                               | 1 个 webhook               | 即时分发                                 | **最多等待窗口时长，然后分发**                                         |
| 单独粘贴 URL                                                       | 1 个 webhook               | 即时分发                                 | 即时分发（桶中只有一个条目）                                           |
| 文本 + URL 作为两条有意分开发送的消息，间隔数分钟                  | 2 个 webhook，位于窗口之外 | 两个轮次                                 | 两个轮次（窗口在两者之间过期）                                         |
| 快速洪泛（窗口内 >10 条小私信）                                     | N 个 webhook               | N 个轮次                                 | 一个轮次，有边界输出（保留第一个 + 最新，应用文本/附件上限）           |

### 拆分发送合并故障排除

如果标志已开启，但拆分发送仍以两个轮次到达，请逐层检查：

<AccordionGroup>
  <Accordion title="Config actually loaded">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    然后运行 `openclaw gateway restart` — 该标志会在创建防抖器注册表时读取。

  </Accordion>
  <Accordion title="Debounce window wide enough for your setup">
    查看 `~/Library/Logs/bluebubbles-server/main.log` 下的 BlueBubbles 服务器日志：

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    测量 `"Dump"` 风格文本分发与随后 `"https://..."; Attachments:` 分发之间的间隔。将 `messages.inbound.byChannel.bluebubbles` 提高到足以覆盖该间隔的值。

  </Accordion>
  <Accordion title="Session JSONL timestamps ≠ webhook arrival">
    会话事件时间戳（`~/.openclaw/agents/<id>/sessions/*.jsonl`）反映的是 Gateway 网关将消息交给智能体的时间，**不是** webhook 到达的时间。标记为 `[Queued messages while agent was busy]` 的排队第二条消息表示第一个轮次仍在运行时第二个 webhook 已到达，而合并桶已经刷新。应根据 BB 服务器日志调整窗口，而不是会话日志。
  </Accordion>
  <Accordion title="Memory pressure slowing reply dispatch">
    在较小机器上（8 GB），智能体轮次可能耗时足够长，导致合并桶在回复完成前就刷新，URL 会作为排队的第二个轮次落入。检查 `memory_pressure` 和 `ps -o rss -p $(pgrep openclaw-gateway)`；如果 Gateway 网关超过约 500 MB RSS 且压缩器处于活动状态，请关闭其他重型进程或迁移到更大的主机。
  </Accordion>
  <Accordion title="Reply-quote sends are a different path">
    如果用户把 `Dump` 作为对现有 URL 气泡的**回复**发送（iMessage 会在 Dump 气泡上显示 “1 Reply” 徽标），URL 位于 `replyToBody` 中，而不是第二个 webhook 中。合并不适用 — 这是 Skills/提示词层面的关注点，不是防抖器关注点。
  </Accordion>
</AccordionGroup>

## 分块流式传输

控制响应是作为单条消息发送，还是以块形式流式传输：

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## 媒体 + 限制

- 入站附件会下载并存储在媒体缓存中。
- 通过 `channels.bluebubbles.mediaMaxMb` 设置入站和出站媒体的媒体上限（默认：8 MB）。
- 出站文本会按 `channels.bluebubbles.textChunkLimit` 分块（默认：4000 个字符）。

## 配置参考

完整配置：[配置](/zh-CN/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connection and webhook">
    - `channels.bluebubbles.enabled`：启用/禁用该渠道。
    - `channels.bluebubbles.serverUrl`：BlueBubbles REST API 基础 URL。
    - `channels.bluebubbles.password`：API 密码。
    - `channels.bluebubbles.webhookPath`：Webhook 端点路径（默认：`/bluebubbles-webhook`）。

  </Accordion>
  <Accordion title="Access policy">
    - `channels.bluebubbles.dmPolicy`：`pairing | allowlist | open | disabled`（默认：`pairing`）。
    - `channels.bluebubbles.allowFrom`：私信允许列表（handle、邮箱、E.164 号码、`chat_id:*`、`chat_guid:*`）。
    - `channels.bluebubbles.groupPolicy`：`open | allowlist | disabled`（默认：`allowlist`）。
    - `channels.bluebubbles.groupAllowFrom`：群组发送者允许列表。
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`：在 macOS 上，可选择在门控通过后从本地通讯录补充未命名群组参与者信息。默认：`false`。
    - `channels.bluebubbles.groups`：按群组配置（`requireMention` 等）。

  </Accordion>
  <Accordion title="投递和分块">
    - `channels.bluebubbles.sendReadReceipts`: 发送已读回执（默认值：`true`）。
    - `channels.bluebubbles.blockStreaming`: 启用分块流式传输（默认值：`false`；流式回复需要启用）。
    - `channels.bluebubbles.textChunkLimit`: 出站分块大小，单位为字符（默认值：4000）。
    - `channels.bluebubbles.sendTimeoutMs`: 通过 `/api/v1/message/text` 发送出站文本时，每个请求的超时时间，单位为 ms（默认值：30000）。在 macOS 26 设置中，如果 Private API iMessage 发送可能在 iMessage 框架内停滞 60 多秒，可以调高该值；例如 `45000` 或 `60000`。探测、聊天查询、回应、编辑和健康检查目前仍保留较短的 10 秒默认值；计划后续把覆盖范围扩展到回应和编辑。按账号覆盖：`channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
    - `channels.bluebubbles.chunkMode`: `length`（默认值）只在超过 `textChunkLimit` 时拆分；`newline` 会先按空行（段落边界）拆分，再按长度分块。

  </Accordion>
  <Accordion title="媒体和历史记录">
    - `channels.bluebubbles.mediaMaxMb`: 入站/出站媒体上限，单位为 MB（默认值：8）。
    - `channels.bluebubbles.mediaLocalRoots`: 明确允许用于出站本地媒体路径的绝对本地目录白名单。默认拒绝发送本地路径，除非已配置此项。按账号覆盖：`channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
    - `channels.bluebubbles.coalesceSameSenderDms`: 将连续的同一发送者私信 webhook 合并成一个智能体轮次，使 Apple 的文本 + URL 拆分发送以单条消息抵达（默认值：`false`）。请参阅[合并拆分发送的私信](#coalescing-split-send-dms-command--url-in-one-composition)，了解场景、窗口调优和权衡。启用后，如果没有显式配置 `messages.inbound.byChannel.bluebubbles`，会把默认入站防抖窗口从 500 ms 扩大到 2500 ms。
    - `channels.bluebubbles.historyLimit`: 用于上下文的最大群组消息数（0 表示禁用）。
    - `channels.bluebubbles.dmHistoryLimit`: 私信历史记录限制。

  </Accordion>
  <Accordion title="操作和账号">
    - `channels.bluebubbles.actions`: 启用/禁用特定操作。
    - `channels.bluebubbles.accounts`: 多账号配置。

  </Accordion>
</AccordionGroup>

相关全局选项：

- `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`。

## 寻址 / 投递目标

优先使用 `chat_guid` 以获得稳定路由：

- `chat_guid:iMessage;-;+15555550123`（群组首选）
- `chat_id:123`
- `chat_identifier:...`
- 直接句柄：`+15555550123`、`user@example.com`
  - 如果直接句柄没有现有私信聊天，OpenClaw 将通过 `POST /api/v1/chat/new` 创建一个。这需要启用 BlueBubbles Private API。

### iMessage 与 SMS 路由

当同一个句柄在 Mac 上同时有 iMessage 和 SMS 聊天时（例如一个已注册 iMessage、但也接收过绿色气泡回退的电话号码），OpenClaw 会优先选择 iMessage 聊天，并且绝不会静默降级到 SMS。若要强制使用 SMS 聊天，请使用显式 `sms:` 目标前缀（例如 `sms:+15555550123`）。如果句柄没有匹配的 iMessage 聊天，则仍会通过 BlueBubbles 报告的任意聊天发送。

## 安全

- Webhook 请求会通过将 `guid`/`password` 查询参数或标头与 `channels.bluebubbles.password` 进行比较来验证。
- 请保密 API 密码和 webhook 端点（像凭据一样对待它们）。
- BlueBubbles webhook 身份验证没有 localhost 绕过。如果你代理 webhook 流量，请在请求端到端保留 BlueBubbles 密码。这里的 `gateway.trustedProxies` 不能替代 `channels.bluebubbles.password`。请参阅 [Gateway 网关安全](/zh-CN/gateway/security#reverse-proxy-configuration)。
- 如果将 BlueBubbles 服务器暴露到你的 LAN 之外，请启用 HTTPS + 防火墙规则。

## 故障排除

- 如果输入/已读事件停止工作，请检查 BlueBubbles webhook 日志，并确认 Gateway 网关路径与 `channels.bluebubbles.webhookPath` 匹配。
- 配对码会在一小时后过期；使用 `openclaw pairing list bluebubbles` 和 `openclaw pairing approve bluebubbles <code>`。
- 回应需要 BlueBubbles private API（`POST /api/v1/message/react`）；请确保服务器版本暴露了它。
- 编辑/撤回需要 macOS 13+ 和兼容的 BlueBubbles 服务器版本。在 macOS 26（Tahoe）上，由于 private API 变更，编辑目前已损坏。
- 在 macOS 26（Tahoe）上，群组图标更新可能不稳定：API 可能返回成功，但新图标不会同步。
- OpenClaw 会根据 BlueBubbles 服务器的 macOS 版本自动隐藏已知损坏的操作。如果编辑仍出现在 macOS 26（Tahoe）上，请使用 `channels.bluebubbles.actions.edit=false` 手动禁用它。
- 已启用 `coalesceSameSenderDms`，但拆分发送（例如 `Dump` + URL）仍作为两个轮次抵达：请查看[拆分发送合并故障排除](#split-send-coalescing-troubleshooting)清单 — 常见原因包括防抖窗口过窄、会话日志时间戳被误读为 webhook 抵达时间，或发送的是回复引用（它使用 `replyToBody`，而不是第二个 webhook）。
- 如需 Status/健康信息：`openclaw status --all` 或 `openclaw status --deep`。

如需通用渠道工作流参考，请参阅[渠道](/zh-CN/channels)和[插件](/zh-CN/tools/plugin)指南。

## 相关

- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [安全](/zh-CN/gateway/security) — 访问模型和加固
