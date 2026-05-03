---
read_when:
    - 设置 BlueBubbles 渠道
    - 网络钩子配对故障排除
    - 在 macOS 上配置 iMessage
sidebarTitle: BlueBubbles
summary: 通过 BlueBubbles macOS 服务器接入 iMessage（REST 发送/接收、输入状态、回应、配对、高级操作）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-03T22:31:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78a054da0c7c32b161997acd05914896259dd1a050e736a4c9e438a452ab6a51
    source_path: channels/bluebubbles.md
    workflow: 16
---

Status：与 BlueBubbles macOS 服务器通过 HTTP 通信的内置插件。由于相比旧版 imsg 渠道 API 更丰富、设置更简单，**推荐用于 iMessage 集成**。

<Note>
当前 OpenClaw 版本内置 BlueBubbles，因此普通打包构建不需要单独执行 `openclaw plugins install` 步骤。
</Note>

## 概览

- 通过 BlueBubbles 辅助应用（[bluebubbles.app](https://bluebubbles.app)）在 macOS 上运行。
- 推荐/已测试：macOS Sequoia（15）。macOS Tahoe（26）可用；编辑功能目前在 Tahoe 上损坏，群组图标更新可能报告成功但不会同步。
- OpenClaw 通过其 REST API（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）与它通信。
- 传入消息通过 Webhook 到达；传出回复、输入指示器、已读回执和 tapback 都是 REST 调用。
- 附件和贴纸会作为入站媒体被摄取（并在可能时暴露给智能体）。
- 合成 MP3 或 CAF 音频的自动 TTS 回复会作为 iMessage 语音备忘录气泡发送，而不是普通文件附件。
- 配对/允许列表的工作方式与其他渠道相同（`/channels/pairing` 等），使用 `channels.bluebubbles.allowFrom` + 配对码。
- 反应会像 Slack/Telegram 一样作为系统事件暴露，因此智能体可以在回复前“提及”它们。
- 高级功能：编辑、撤回、回复线程、消息效果、群组管理。

## 快速开始

<Steps>
  <Step title="安装 BlueBubbles">
    在你的 Mac 上安装 BlueBubbles 服务器（按照 [bluebubbles.app/install](https://bluebubbles.app/install) 的说明操作）。
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
  <Step title="将 Webhook 指向 Gateway 网关">
    将 BlueBubbles Webhook 指向你的 Gateway 网关（示例：`https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）。
  </Step>
  <Step title="启动 Gateway 网关">
    启动 Gateway 网关；它会注册 Webhook 处理器并开始配对。
  </Step>
</Steps>

<Warning>
**安全性**

- 始终设置 Webhook 密码。
- Webhook 身份验证始终是必需的。除非 BlueBubbles Webhook 请求包含与 `channels.bluebubbles.password` 匹配的密码/guid（例如 `?password=<password>` 或 `x-password`），否则 OpenClaw 会拒绝该请求，无论 loopback/proxy 拓扑如何。
- 密码身份验证会在读取/解析完整 Webhook 正文之前检查。

</Warning>

## 保持 Messages.app 活跃（VM / 无头设置）

某些 macOS VM / 常开设置可能会让 Messages.app 进入“空闲”状态（传入事件停止，直到应用被打开/置于前台）。一个简单的变通方法是使用 AppleScript + LaunchAgent **每 5 分钟轻触 Messages 一次**。

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

    这会**每 300 秒**运行一次，并且**登录时**运行。首次运行可能触发 macOS **自动化**提示（`osascript` → Messages）。请在运行 LaunchAgent 的同一用户会话中批准它们。

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

向导会提示输入：

<ParamField path="服务器 URL" type="string" required>
  BlueBubbles 服务器地址（例如 `http://192.168.1.100:1234`）。
</ParamField>
<ParamField path="密码" type="string" required>
  来自 BlueBubbles Server 设置的 API 密码。
</ParamField>
<ParamField path="Webhook 路径" type="string" default="/bluebubbles-webhook">
  Webhook 端点路径。
</ParamField>
<ParamField path="私信策略" type="string">
  `pairing`、`allowlist`、`open` 或 `disabled`。
</ParamField>
<ParamField path="允许列表" type="string[]">
  电话号码、电子邮件或聊天目标。
</ParamField>

你也可以通过 CLI 添加 BlueBubbles：

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## 访问控制（私信 + 群组）

<Tabs>
  <Tab title="私信">
    - 默认：`channels.bluebubbles.dmPolicy = "pairing"`。
    - 未知发送者会收到配对码；在批准之前，消息会被忽略（配对码 1 小时后过期）。
    - 通过以下方式批准：
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - 配对是默认的令牌交换。详情：[配对](/zh-CN/channels/pairing)

  </Tab>
  <Tab title="群组">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（默认：`allowlist`）。
    - 当设置了 `allowlist` 时，`channels.bluebubbles.groupAllowFrom` 控制谁可以在群组中触发。

  </Tab>
</Tabs>

### 联系人姓名增强（macOS，可选）

BlueBubbles 群组 Webhook 通常只包含原始参与者地址。如果你希望 `GroupMembers` 上下文改为显示本地联系人姓名，可以在 macOS 上选择启用本地联系人增强：

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` 启用查找。默认值：`false`。
- 查找仅在群组访问、命令授权和提及门控允许消息通过后运行。
- 仅会增强未命名的电话参与者。
- 找不到本地匹配项时，原始电话号码仍作为回退值。

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

BlueBubbles 支持群聊的提及门控，与 iMessage/WhatsApp 行为一致：

- 使用 `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）检测提及。
- 当为群组启用 `requireMention` 时，智能体仅在被提及时响应。
- 来自已授权发送者的控制命令会绕过提及门控。

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
- 使用 `allowFrom` 和 `groupAllowFrom` 判断命令授权。
- 已授权发送者即使在群组中未提及也可以运行控制命令。

### 按群组设置系统提示

`channels.bluebubbles.groups.*` 下的每个条目都接受一个可选的 `systemPrompt` 字符串。该值会在处理该群组中消息的每一轮被注入到智能体的系统提示中，因此你可以设置按群组的角色或行为规则，而无需编辑智能体提示：

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

该键匹配 BlueBubbles 为群组报告的 `chatGuid` / `chatIdentifier` / 数字 `chatId`，而 `"*"` 通配符条目会为没有精确匹配的每个群组提供默认值（与 `requireMention` 和按群组工具策略使用相同模式）。精确匹配始终优先于通配符。私信会忽略此字段；请改用智能体级或账号级提示自定义。

#### 示例：线程回复和 tapback 反应（Private API）

启用 BlueBubbles Private API 后，入站消息会带有短消息 ID（例如 `[[reply_to:5]]`），智能体可以调用 `action=reply` 以线程形式回复到特定消息，或调用 `action=react` 发送 tapback。按群组的 `systemPrompt` 是让智能体选择正确工具的可靠方式：

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: "When replying in this group, always call action=reply with the [[reply_to:N]] messageId from context so your response threads under the triggering message. Never send a new unlinked message. For short acknowledgements ('ok', 'got it', 'on it'), use action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓) instead of sending a text reply.",
        },
      },
    },
  },
}
```

Tapback 反应和线程回复都需要 BlueBubbles Private API；请参阅[高级操作](#advanced-actions)和[消息 ID](#message-ids-short-vs-full)了解底层机制。

## ACP 对话绑定

BlueBubbles 聊天可以转换为持久 ACP 工作区，而无需更改传输层。

快速操作流程：

- 在私信或允许的群聊中运行 `/acp spawn codex --bind here`。
- 该同一 BlueBubbles 对话中的未来消息会路由到生成的 ACP 会话。
- `/new` 和 `/reset` 会在原地重置同一个已绑定 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

也支持通过顶层 `bindings[]` 条目配置持久绑定，其中 `type: "acp"` 且 `match.channel: "bluebubbles"`。

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

请参阅 [ACP Agents](/zh-CN/tools/acp-agents) 了解共享 ACP 绑定行为。

## 输入指示器 + 已读回执

- **输入指示器**：在响应生成之前和期间自动发送。
- **已读回执**：由 `channels.bluebubbles.sendReadReceipts` 控制（默认值：`true`）。
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

BlueBubbles 在配置中启用后支持高级消息操作：

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
  <Accordion title="可用操作">
    - **react**：添加/移除 tapback 反应（`messageId`、`emoji`、`remove`）。iMessage 原生 tapback 集合是 `love`、`like`、`dislike`、`laugh`、`emphasize` 和 `question`。当智能体选择该集合之外的表情符号（例如 `👀`）时，反应工具会回退到 `love`，这样 tapback 仍会渲染，而不是让整个请求失败。配置的确认反应仍会严格校验，并在遇到未知值时报错。
    - **edit**：编辑已发送的消息（`messageId`、`text`）。
    - **unsend**：撤回消息（`messageId`）。
    - **reply**：回复特定消息（`messageId`、`text`、`to`）。
    - **sendWithEffect**：带 iMessage 效果发送（`text`、`to`、`effectId`）。
    - **renameGroup**：重命名群聊（`chatGuid`、`displayName`）。
    - **setGroupIcon**：设置群聊图标/照片（`chatGuid`、`media`）——在 macOS 26 Tahoe 上不稳定（API 可能返回成功，但图标不同步）。
    - **addParticipant**：向群组添加某人（`chatGuid`、`address`）。
    - **removeParticipant**：从群组移除某人（`chatGuid`、`address`）。
    - **leaveGroup**：离开群聊（`chatGuid`）。
    - **upload-file**：发送媒体/文件（`to`、`buffer`、`filename`、`asVoice`）。
      - 语音备忘录：将 `asVoice: true` 与 **MP3** 或 **CAF** 音频一起设置，可作为 iMessage 语音消息发送。BlueBubbles 发送语音备忘录时会将 MP3 → CAF。
    - 旧版别名：`sendAttachment` 仍可使用，但 `upload-file` 是规范操作名称。

  </Accordion>
</AccordionGroup>

### 消息 ID（短 ID 与完整 ID）

OpenClaw 可能会暴露_短_消息 ID（例如 `1`、`2`）以节省 token。

- `MessageSid` / `ReplyToId` 可以是短 ID。
- `MessageSidFull` / `ReplyToIdFull` 包含提供商完整 ID。
- 短 ID 存在于内存中；它们可能在重启或缓存淘汰后过期。
- 操作接受短或完整 `messageId`，但如果短 ID 不再可用，就会报错。

对持久自动化和存储使用完整 ID：

- 模板：`{{MessageSidFull}}`、`{{ReplyToIdFull}}`
- 上下文：入站载荷中的 `MessageSidFull` / `ReplyToIdFull`

请参阅[配置](/zh-CN/gateway/configuration)了解模板变量。

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 合并拆分发送的私信（一条组合内容中的命令 + URL）

当用户在 iMessage 中同时输入命令和 URL，例如 `Dump https://example.com/article`，Apple 会将发送拆分成**两个独立的 webhook 投递**：

1. 一条文本消息（`"Dump"`）。
2. 一个 URL 预览气泡（`"https://..."`），并将 OG 预览图片作为附件。

在大多数设置中，这两个 webhook 到达 OpenClaw 的时间相隔约 0.8-2.0 秒。没有合并时，智能体会在第 1 轮只收到命令并回复（通常是“把 URL 发给我”），然后才在第 2 轮看到 URL，而此时命令上下文已经丢失。

`channels.bluebubbles.coalesceSameSenderDms` 会让某个私信将连续的同发送者 webhook 合并为单个智能体轮次。群聊仍按单条消息作为键，因此会保留多用户轮次结构。

<Tabs>
  <Tab title="何时启用">
    在以下情况启用：

    - 你发布的 Skills 期望一条消息中包含 `command + payload`（dump、paste、save、queue 等）。
    - 你的用户会把 URL、图片或长内容与命令一起粘贴。
    - 你可以接受增加的私信轮次延迟（见下文）。

    在以下情况保持禁用：

    - 你需要单词私信触发器具备最低命令延迟。
    - 你的所有流程都是没有载荷后续内容的一次性命令。

  </Tab>
  <Tab title="启用">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    启用该标志且没有显式设置 `messages.inbound.byChannel.bluebubbles` 时，防抖窗口会扩大到 **2500 ms**（非合并的默认值为 500 ms）。更宽的窗口是必需的，因为 Apple 的拆分发送节奏为 0.8-2.0 秒，无法适配更紧的默认值。

    若要自行调优窗口：

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
  <Tab title="权衡">
    - **私信控制命令会增加延迟。** 启用该标志后，私信控制命令消息（如 `Dump`、`Save` 等）现在会等待最多一个防抖窗口后再分派，以防载荷 webhook 随后到达。群聊命令仍会即时分派。
    - **合并后的输出有上限**——合并文本上限为 4000 个字符，并带有显式 `…[truncated]` 标记；附件上限为 20 个；来源条目上限为 10 个（超过后保留第一个和最新的条目）。每个来源 `messageId` 仍会进入入站去重，因此稍后 MessagePoller 重放任何单个事件时都会被识别为重复。
    - **按渠道选择启用。** 其他渠道（Telegram、WhatsApp、Slack 等）不受影响。

  </Tab>
</Tabs>

### 场景以及智能体看到的内容

| 用户组合输入                                                       | Apple 投递                | 标志关闭（默认）                        | 标志开启 + 2500 ms 窗口                                                |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（一次发送）                             | 2 个 webhook，相隔约 1 秒 | 两个智能体轮次：只有“Dump”，然后是 URL | 一个轮次：合并文本 `Dump https://example.com`                          |
| `Save this 📎image.jpg caption`（附件 + 文本）                     | 2 个 webhook              | 两个轮次                                | 一个轮次：文本 + 图片                                                   |
| `/status`（独立命令）                                              | 1 个 webhook              | 即时分派                                | **最多等待一个窗口，然后分派**                                          |
| 单独粘贴 URL                                                       | 1 个 webhook              | 即时分派                                | 即时分派（桶中只有一个条目）                                            |
| 文本 + URL 作为两条有意分开发送的消息，间隔数分钟                 | 2 个 webhook，位于窗口外  | 两个轮次                                | 两个轮次（它们之间窗口已过期）                                          |
| 快速大量发送（窗口内 >10 条小私信）                               | N 个 webhook              | N 个轮次                                | 一个轮次，有上限输出（保留第一个 + 最新的，应用文本/附件上限）          |

### 拆分发送合并故障排除

如果标志已开启但拆分发送仍作为两个轮次到达，请逐层检查：

<AccordionGroup>
  <Accordion title="配置确实已加载">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    然后运行 `openclaw gateway restart`——该标志会在 debouncer-registry 创建时读取。

  </Accordion>
  <Accordion title="防抖窗口对你的设置足够宽">
    查看 `~/Library/Logs/bluebubbles-server/main.log` 下的 BlueBubbles 服务器日志：

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    测量 `"Dump"` 这类文本分派与随后 `"https://..."; Attachments:` 分派之间的间隔。将 `messages.inbound.byChannel.bluebubbles` 提高到能够舒适覆盖该间隔。

  </Accordion>
  <Accordion title="会话 JSONL 时间戳 ≠ webhook 到达时间">
    会话事件时间戳（`~/.openclaw/agents/<id>/sessions/*.jsonl`）反映的是 Gateway 网关将消息交给智能体的时间，**不是** webhook 到达的时间。带有 `[Queued messages while agent was busy]` 标记的排队第二条消息，表示第二个 webhook 到达时第一个轮次仍在运行，而合并桶已经刷新。请根据 BB 服务器日志调优窗口，而不是会话日志。
  </Accordion>
  <Accordion title="内存压力拖慢回复分派">
    在较小的机器（8 GB）上，智能体轮次可能耗时较长，导致合并桶在回复完成前刷新，而 URL 作为排队的第二个轮次落入系统。检查 `memory_pressure` 和 `ps -o rss -p $(pgrep openclaw-gateway)`；如果 Gateway 网关超过约 500 MB RSS 且压缩器处于活动状态，请关闭其他重型进程或升级到更大的主机。
  </Accordion>
  <Accordion title="引用回复发送走的是不同路径">
    如果用户点按 `Dump`，将其作为对现有 URL 气泡的**回复**（iMessage 在 Dump 气泡上显示“1 Reply”徽标），则 URL 位于 `replyToBody`，而不是第二个 webhook 中。合并不适用——这是 Skills/提示词关注点，不是防抖器关注点。
  </Accordion>
</AccordionGroup>

## 分块流式传输

控制响应是作为单条消息发送，还是以块的形式流式传输：

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

- 入站附件会被下载并存储在媒体缓存中。
- 通过 `channels.bluebubbles.mediaMaxMb` 为入站和出站媒体设置媒体上限（默认：8 MB）。
- 出站文本会按 `channels.bluebubbles.textChunkLimit` 分块（默认：4000 个字符）。

## 配置参考

完整配置：[配置](/zh-CN/gateway/configuration)

<AccordionGroup>
  <Accordion title="连接和 webhook">
    - `channels.bluebubbles.enabled`：启用/禁用该渠道。
    - `channels.bluebubbles.serverUrl`：BlueBubbles REST API 基础 URL。
    - `channels.bluebubbles.password`：API 密码。
    - `channels.bluebubbles.webhookPath`：Webhook 端点路径（默认：`/bluebubbles-webhook`）。

  </Accordion>
  <Accordion title="访问策略">
    - `channels.bluebubbles.dmPolicy`：`pairing | allowlist | open | disabled`（默认：`pairing`）。
    - `channels.bluebubbles.allowFrom`：私信允许列表（handles、电子邮件、E.164 号码、`chat_id:*`、`chat_guid:*`）。
    - `channels.bluebubbles.groupPolicy`：`open | allowlist | disabled`（默认：`allowlist`）。
    - `channels.bluebubbles.groupAllowFrom`：群组发送者允许列表。
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`：在 macOS 上，门控通过后可选择从本地通讯录补充未命名群组参与者信息。默认值：`false`。
    - `channels.bluebubbles.groups`：按群组配置（`requireMention` 等）。

  </Accordion>
  <Accordion title="投递和分块">
    - `channels.bluebubbles.sendReadReceipts`: 发送已读回执（默认值：`true`）。
    - `channels.bluebubbles.blockStreaming`: 启用分块流式传输（默认值：`false`；流式回复必需）。
    - `channels.bluebubbles.textChunkLimit`: 出站分块大小，单位为字符（默认值：4000）。
    - `channels.bluebubbles.sendTimeoutMs`: 通过 `/api/v1/message/text` 发送出站文本时，每个请求的超时时间，单位为 ms（默认值：30000）。在 macOS 26 设置中，如果 Private API iMessage 发送可能在 iMessage 框架内停滞 60 秒以上，可以调高该值；例如 `45000` 或 `60000`。探测、聊天查找、回应、编辑和健康检查目前仍保留较短的 10 秒默认值；计划后续将覆盖范围扩展到回应和编辑。按账户覆盖：`channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
    - `channels.bluebubbles.chunkMode`: `length`（默认值）仅在超过 `textChunkLimit` 时拆分；`newline` 会先按空行（段落边界）拆分，再按长度分块。

  </Accordion>
  <Accordion title="媒体和历史记录">
    - `channels.bluebubbles.mediaMaxMb`: 入站/出站媒体上限，单位为 MB（默认值：8）。
    - `channels.bluebubbles.mediaLocalRoots`: 明确允许用于出站本地媒体路径的绝对本地目录白名单。默认拒绝发送本地路径，除非配置了此项。按账户覆盖：`channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
    - `channels.bluebubbles.coalesceSameSenderDms`: 将同一发送者连续的私信 webhook 合并为一个智能体轮次，使 Apple 的文本+URL 拆分发送作为单条消息到达（默认值：`false`）。有关场景、窗口调优和权衡，请参阅[合并拆分发送的私信](#coalescing-split-send-dms-command--url-in-one-composition)。启用后，如果未显式配置 `messages.inbound.byChannel.bluebubbles`，默认入站防抖窗口会从 500 ms 扩大到 2500 ms。
    - `channels.bluebubbles.historyLimit`: 用于上下文的最大群组消息数（0 表示禁用）。
    - `channels.bluebubbles.dmHistoryLimit`: 私信历史记录限制。
    - `channels.bluebubbles.replyContextApiFallback`: 当入站回复没有 `replyToBody`/`replyToSender`，且内存中的回复上下文缓存未命中时，从 BlueBubbles HTTP API 获取原始消息，作为尽力而为的回退（默认值：`false`）。适用于共享同一 BlueBubbles 账户的多实例部署、进程重启后，或长生命周期 TTL/LRU 缓存被逐出后。该获取操作受到与其他所有 BlueBubbles 客户端请求相同策略的 SSRF 防护，绝不会抛出错误，并会填充缓存，让后续回复摊销成本。按账户覆盖：`channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`。渠道级设置会传播到未设置该标志的账户。

  </Accordion>
  <Accordion title="操作和账户">
    - `channels.bluebubbles.actions`: 启用/禁用特定操作。
    - `channels.bluebubbles.accounts`: 多账户配置。

  </Accordion>
</AccordionGroup>

相关全局选项：

- `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`。

## 寻址 / 投递目标

优先使用 `chat_guid` 进行稳定路由：

- `chat_guid:iMessage;-;+15555550123`（群组推荐）
- `chat_id:123`
- `chat_identifier:...`
- 直接句柄：`+15555550123`、`user@example.com`
  - 如果某个直接句柄没有现有私信聊天，OpenClaw 会通过 `POST /api/v1/chat/new` 创建一个。这需要启用 BlueBubbles Private API。

### iMessage 与 SMS 路由

当同一个句柄在 Mac 上同时有 iMessage 和 SMS 聊天时（例如一个已注册 iMessage、但也接收过绿气泡回退的电话号码），OpenClaw 会优先使用 iMessage 聊天，绝不会静默降级到 SMS。若要强制使用 SMS 聊天，请使用显式 `sms:` 目标前缀（例如 `sms:+15555550123`）。没有匹配 iMessage 聊天的句柄仍会通过 BlueBubbles 报告的任何聊天发送。

## 安全

- Webhook 请求通过将 `guid`/`password` 查询参数或标头与 `channels.bluebubbles.password` 比较来进行身份验证。
- 请将 API 密码和 webhook 端点保密（像凭证一样对待它们）。
- BlueBubbles webhook 身份验证没有 localhost 绕过。如果你代理 webhook 流量，请在请求端到端保留 BlueBubbles 密码。这里的 `gateway.trustedProxies` 不会替代 `channels.bluebubbles.password`。请参阅 [Gateway 网关安全](/zh-CN/gateway/security#reverse-proxy-configuration)。
- 如果将 BlueBubbles 服务器暴露到你的 LAN 之外，请启用 HTTPS 和防火墙规则。

## 故障排除

- 如果输入/已读事件停止工作，请检查 BlueBubbles webhook 日志，并确认 Gateway 网关路径与 `channels.bluebubbles.webhookPath` 匹配。
- 配对码会在一小时后过期；请使用 `openclaw pairing list bluebubbles` 和 `openclaw pairing approve bluebubbles <code>`。
- 回应需要 BlueBubbles private API（`POST /api/v1/message/react`）；请确保服务器版本暴露了它。
- 编辑/撤回需要 macOS 13+ 和兼容的 BlueBubbles 服务器版本。在 macOS 26（Tahoe）上，由于 private API 变更，编辑当前已损坏。
- 在 macOS 26（Tahoe）上，群组图标更新可能不稳定：API 可能返回成功，但新图标不会同步。
- OpenClaw 会根据 BlueBubbles 服务器的 macOS 版本自动隐藏已知损坏的操作。如果编辑在 macOS 26（Tahoe）上仍然出现，请使用 `channels.bluebubbles.actions.edit=false` 手动禁用它。
- 已启用 `coalesceSameSenderDms`，但拆分发送（例如 `Dump` + URL）仍作为两个轮次到达：请参阅[拆分发送合并故障排除](#split-send-coalescing-troubleshooting)清单，常见原因包括防抖窗口过短、会话日志时间戳被误读为 webhook 到达时间，或发送了回复引用（它使用 `replyToBody`，而不是第二个 webhook）。
- 状态/健康信息：`openclaw status --all` 或 `openclaw status --deep`。

有关通用渠道工作流参考，请参阅[渠道](/zh-CN/channels)和[插件](/zh-CN/tools/plugin)指南。

## 相关

- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [安全](/zh-CN/gateway/security) — 访问模型和加固
