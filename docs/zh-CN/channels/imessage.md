---
read_when:
    - 设置 iMessage 支持
    - 调试 iMessage 发送/接收
summary: 通过 imsg（基于 stdio 的 JSON-RPC）提供原生 iMessage 支持，包含用于回复、tapbacks、效果、附件和群组管理的私有 API 操作。当主机要求满足时，推荐用于新的 OpenClaw iMessage 设置。
title: iMessage
x-i18n:
    generated_at: "2026-05-13T02:51:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8125beab13c067e287f4cc041b65632989b8aaadce9b3719cc5e7312a0927aeb
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
对于 OpenClaw iMessage 部署，请在已登录的 macOS Messages 主机上使用 `imsg`。如果你的 Gateway 网关运行在 Linux 或 Windows 上，请将 `channels.imessage.cliPath` 指向一个 SSH 包装脚本，由它在 Mac 上运行 `imsg`。

**Gateway 网关停机后的补齐是选择启用的。** 启用后（`channels.imessage.catchup.enabled: true`），Gateway 网关会在下次启动时重放其离线期间（崩溃、重启、Mac 睡眠）落入 `chat.db` 的入站消息。默认禁用 — 见[在 Gateway 网关停机后补齐](#catching-up-after-gateway-downtime)。关闭 [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649)。
</Note>

<Warning>
BlueBubbles 支持已移除。请将 `channels.bluebubbles` 配置迁移到 `channels.imessage`；OpenClaw 仅通过 `imsg` 支持 iMessage。先阅读简短公告 [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage)，或查看完整迁移表 [Coming from BlueBubbles](/zh-CN/channels/imessage-from-bluebubbles)。
</Warning>

Status：原生外部 CLI 集成。Gateway 网关会启动 `imsg rpc`，并通过 stdio 上的 JSON-RPC 通信（没有单独的守护进程/端口）。高级操作需要 `imsg launch` 和成功的私有 API 探测。

<CardGroup cols={3}>
  <Card title="私有 API 操作" icon="wand-sparkles" href="#private-api-actions">
    回复、tapback、效果、附件和群组管理。
  </Card>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    iMessage 私信默认使用配对模式。
  </Card>
  <Card title="远程 Mac" icon="terminal" href="#remote-mac-over-ssh">
    当 Gateway 网关未运行在 Messages Mac 上时，使用 SSH 包装脚本。
  </Card>
  <Card title="配置参考" icon="settings" href="/zh-CN/gateway/config-channels#imessage">
    完整的 iMessage 字段参考。
  </Card>
</CardGroup>

## 快速设置

<Tabs>
  <Tab title="本地 Mac（快速路径）">
    <Steps>
      <Step title="安装并验证 imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="配置 OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="启动 Gateway 网关">

```bash
openclaw gateway
```

      </Step>

      <Step title="批准首次私信配对（默认 dmPolicy）">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        配对请求会在 1 小时后过期。
      </Step>
    </Steps>

  </Tab>

  <Tab title="通过 SSH 访问远程 Mac">
    OpenClaw 只需要一个兼容 stdio 的 `cliPath`，因此你可以将 `cliPath` 指向一个包装脚本，由它通过 SSH 连接到远程 Mac 并运行 `imsg`。

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    启用附件时的推荐配置：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    如果未设置 `remoteHost`，OpenClaw 会尝试通过解析 SSH 包装脚本来自动检测它。
    `remoteHost` 必须是 `host` 或 `user@host`（不能包含空格或 SSH 选项）。
    OpenClaw 对 SCP 使用严格的主机密钥检查，因此中继主机密钥必须已存在于 `~/.ssh/known_hosts` 中。
    附件路径会根据允许的根路径（`attachmentRoots` / `remoteAttachmentRoots`）进行验证。

  </Tab>
</Tabs>

## 要求和权限（macOS）

- 运行 `imsg` 的 Mac 必须已登录 Messages。
- 运行 OpenClaw/`imsg` 的进程上下文需要完整磁盘访问权限（Messages 数据库访问）。
- 通过 Messages.app 发送消息需要自动化权限。
- 对于高级操作（回应 / 编辑 / 撤回发送 / 线程回复 / 效果 / 群组操作），必须禁用系统完整性保护 — 见下方[启用 imsg 私有 API](#enabling-the-imsg-private-api)。基础文本和媒体发送/接收不需要它也能工作。

<Tip>
权限按进程上下文授予。如果 Gateway 网关以无头方式运行（LaunchAgent/SSH），请在同一上下文中运行一次交互式命令以触发提示：

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## 启用 imsg 私有 API

`imsg` 提供两种运行模式：

- **基础模式**（默认，无需更改 SIP）：通过 `send` 发送出站文本和媒体、入站 watch/history、聊天列表。这就是全新 `brew install steipete/tap/imsg` 加上上方标准 macOS 权限后即可获得的能力。
- **私有 API 模式**：`imsg` 将辅助 dylib 注入 `Messages.app`，以调用内部 `IMCore` 函数。这会解锁 `react`、`edit`、`unsend`、`reply`（线程式）、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`，以及输入状态指示和已读回执。

要使用此渠道页面记录的高级操作能力，你需要私有 API 模式。`imsg` README 明确说明了该要求：

> `read`、`typing`、`launch`、由桥接支持的富发送、消息变更和聊天管理等高级功能是选择启用的。它们要求禁用 SIP，并将辅助 dylib 注入 `Messages.app`。当 SIP 启用时，`imsg launch` 会拒绝注入。

辅助注入技术使用 `imsg` 自己的 dylib 来访问 Messages 私有 API。OpenClaw iMessage 路径中没有第三方服务器或 BlueBubbles 运行时。

<Warning>
**禁用 SIP 是真实的安全权衡。** SIP 是 macOS 防止运行被修改系统代码的核心保护之一；系统范围关闭它会带来额外攻击面和副作用。特别是，**在 Apple Silicon Mac 上禁用 SIP 也会禁用在 Mac 上安装和运行 iOS 应用的能力**。

请将其视为有意的运维选择，而不是默认选项。如果你的威胁模型无法容忍关闭 SIP，内置 iMessage 将仅限于基础模式 — 只能发送/接收文本和媒体，没有回应 / 编辑 / 撤回发送 / 效果 / 群组操作。
</Warning>

### 设置

1. 在运行 Messages.app 的 Mac 上**安装（或升级）`imsg`**：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 输出会报告 `bridge_version`、`rpc_methods` 和每个方法的 `selectors`，因此你可以在开始前查看当前构建支持什么。

2. **禁用系统完整性保护。** 这与 macOS 版本相关，因为底层 Apple 要求取决于操作系统和硬件：
   - **macOS 10.13–10.15（Sierra–Catalina）：** 通过 Terminal 禁用 Library Validation，重启到恢复模式，运行 `csrutil disable`，再重启。
   - **macOS 11+（Big Sur 及更高版本），Intel：** 恢复模式（或互联网恢复），`csrutil disable`，重启。
   - **macOS 11+，Apple Silicon：** 通过电源按钮启动序列进入恢复；在较新的 macOS 版本中，点击 Continue 时按住 **Left Shift** 键，然后运行 `csrutil disable`。虚拟机设置遵循单独流程 — 先创建 VM 快照。
   - **macOS 26 / Tahoe：** library-validation 策略和 `imagent` 私有授权检查进一步收紧；`imsg` 可能需要更新构建才能跟上。如果在 macOS 主版本升级后，`imsg launch` 注入或特定 `selectors` 开始返回 false，请先检查 `imsg` 的发布说明，再假设 SIP 步骤已成功。

   在运行 `imsg launch` 前，请按照 Apple 针对你的 Mac 的恢复模式流程禁用 SIP。

3. **注入辅助程序。** 在 SIP 已禁用且 Messages.app 已登录的情况下：

   ```bash
   imsg launch
   ```

   当 SIP 仍启用时，`imsg launch` 会拒绝注入，因此这也可用来确认第 2 步已生效。

4. **从 OpenClaw 验证桥接：**

   ```bash
   openclaw channels status --probe
   ```

   iMessage 条目应报告 `works`，且 `imsg status --json | jq '.selectors'` 应显示 `retractMessagePart: true`，以及你的 macOS 构建暴露的任意编辑 / 输入 / 已读 selectors。`actions.ts` 中的 OpenClaw 插件按方法门控只会公布底层 selector 为 `true` 的操作，因此你在智能体工具列表中看到的操作面反映了此主机上的桥接实际能做什么。

如果 `openclaw channels status --probe` 将渠道报告为 `works`，但特定操作在分发时抛出 “iMessage `<action>` requires the imsg private API bridge”，请再次运行 `imsg launch` — 辅助程序可能会脱落（Messages.app 重启、操作系统更新等），而缓存的 `available: true` 状态会持续公布操作，直到下一次探测刷新。

### 当你无法禁用 SIP 时

如果禁用 SIP 对你的威胁模型不可接受：

- `imsg` 会回退到基础模式 — 仅支持文本 + 媒体 + 接收。
- OpenClaw 插件仍会公布文本/媒体发送和入站监控；它只是会从操作面隐藏 `react`、`edit`、`unsend`、`reply`、`sendWithEffect` 和群组操作（根据按方法能力门控）。
- 你可以为 iMessage 工作负载运行一台单独的非 Apple-Silicon Mac（或专用机器人 Mac）并关闭 SIP，同时在你的主要设备上保持 SIP 启用。见下方[专用机器人 macOS 用户（单独的 iMessage 身份）](#deployment-patterns)。

## 访问控制和路由

<Tabs>
  <Tab title="私信策略">
    `channels.imessage.dmPolicy` 控制直接消息：

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    允许列表字段：`channels.imessage.allowFrom`。

    允许列表条目必须标识发送者：handle 或静态发送者访问组（`accessGroup:<name>`）。对 `chat_id:*`、`chat_guid:*` 或 `chat_identifier:*` 等聊天目标使用 `channels.imessage.groupAllowFrom`；对数字 `chat_id` 注册表键使用 `channels.imessage.groups`。

  </Tab>

  <Tab title="群组策略 + 提及">
    `channels.imessage.groupPolicy` 控制群组处理：

    - `allowlist`（配置时默认）
    - `open`
    - `disabled`

    群组发送者允许列表：`channels.imessage.groupAllowFrom`。

    `groupAllowFrom` 条目也可以引用静态发送者访问组（`accessGroup:<name>`）。

    运行时回退：如果未设置 `groupAllowFrom`，iMessage 群组发送者检查会使用 `allowFrom`；当私信和群组准入应不同时，请设置 `groupAllowFrom`。
    运行时说明：如果完全缺少 `channels.imessage`，运行时会回退到 `groupPolicy="allowlist"` 并记录警告（即使已设置 `channels.defaults.groupPolicy`）。

    <Warning>
    群组路由有**两个**连续运行的允许列表门控，并且两者都必须通过：

    1. **发送者 / 聊天目标允许列表**（`channels.imessage.groupAllowFrom`）— handle、`chat_guid`、`chat_identifier` 或 `chat_id`。
    2. **群组注册表**（`channels.imessage.groups`）— 使用 `groupPolicy: "allowlist"` 时，此门控需要 `groups: { "*": { ... } }` 通配符条目（设置 `allowAll = true`），或 `groups` 下显式的每个 `chat_id` 条目。

    如果门控 2 中没有任何内容，每条群组消息都会被丢弃。插件会在默认日志级别发出两个 `warn` 级别信号：

    - 启动时每个账号一次：`imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - 运行时每个 `chat_id` 一次：`imessage: dropping group message from chat_id=<id> ...`

    私信会继续工作，因为它们走的是不同代码路径。

    在 `groupPolicy: "allowlist"` 下保持群组继续流转的最低配置：

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    如果这些 `warn` 行出现在 Gateway 网关日志中，说明第 2 道门控正在丢弃消息 —— 添加 `groups` 块。
    </Warning>

    群组的提及门控：

    - iMessage 没有原生提及元数据
    - 提及检测使用正则表达式模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 未配置模式时，无法强制执行提及门控

    来自已授权发送者的控制命令可以绕过群组中的提及门控。

    按群组设置的 `systemPrompt`：

    `channels.imessage.groups.*` 下的每个条目都接受一个可选的 `systemPrompt` 字符串。该值会在处理该群组消息的每个轮次中注入到智能体的系统提示词中。解析方式与 `channels.whatsapp.groups` 使用的按群组提示词解析一致：

    1. **群组专用系统提示词**（`groups["<chat_id>"].systemPrompt`）：当映射中存在特定群组条目，**并且**定义了其 `systemPrompt` 键时使用。如果 `systemPrompt` 是空字符串（`""`），则会抑制通配符，并且不会对该群组应用系统提示词。
    2. **群组通配符系统提示词**（`groups["*"].systemPrompt`）：当映射中完全不存在特定群组条目，或存在但未定义 `systemPrompt` 键时使用。

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    按群组设置的提示词只应用于群组消息 —— 此频道中的私信不受影响。

  </Tab>

  <Tab title="会话和确定性回复">
    - 私信使用直接路由；群组使用群组路由。
    - 使用默认的 `session.dmScope=main` 时，iMessage 私信会折叠到智能体主会话中。
    - 群组会话相互隔离（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回复会使用来源频道/目标元数据路由回 iMessage。

    类群组线程行为：

    一些多参与者 iMessage 线程可能会以 `is_group=false` 到达。
    如果该 `chat_id` 已在 `channels.imessage.groups` 下显式配置，OpenClaw 会将其视为群组流量（群组门控 + 群组会话隔离）。

  </Tab>
</Tabs>

## ACP 会话绑定

旧版 iMessage 聊天也可以绑定到 ACP 会话。

快速操作流程：

- 在私信或允许的群聊中运行 `/acp spawn codex --bind here`。
- 同一 iMessage 对话中的后续消息会路由到已生成的 ACP 会话。
- `/new` 和 `/reset` 会在原位重置同一个已绑定 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

支持通过顶层 `bindings[]` 条目配置持久绑定，其中包含 `type: "acp"` 和 `match.channel: "imessage"`。

`match.peer.id` 可以使用：

- 规范化的私信句柄，例如 `+15555550123` 或 `user@example.com`
- `chat_id:<id>`（推荐用于稳定的群组绑定）
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

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
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

参见 [ACP 智能体](/zh-CN/tools/acp-agents)，了解共享的 ACP 绑定行为。

## 部署模式

<AccordionGroup>
  <Accordion title="专用机器人 macOS 用户（独立的 iMessage 身份）">
    使用专用 Apple ID 和 macOS 用户，使机器人流量与你的个人 Messages 配置文件隔离。

    典型流程：

    1. 创建/登录专用 macOS 用户。
    2. 在该用户中使用机器人 Apple ID 登录 Messages。
    3. 在该用户中安装 `imsg`。
    4. 创建 SSH 包装器，让 OpenClaw 能够在该用户上下文中运行 `imsg`。
    5. 将 `channels.imessage.accounts.<id>.cliPath` 和 `.dbPath` 指向该用户配置文件。

    首次运行可能需要在该机器人用户会话中授予 GUI 权限（自动化 + 完全磁盘访问权限）。

  </Accordion>

  <Accordion title="通过 Tailscale 使用远程 Mac（示例）">
    常见拓扑：

    - Gateway 网关在 Linux/VM 上运行
    - iMessage + `imsg` 在你的 tailnet 中的一台 Mac 上运行
    - `cliPath` 包装器使用 SSH 运行 `imsg`
    - `remoteHost` 启用 SCP 附件获取

    示例：

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    使用 SSH 密钥，让 SSH 和 SCP 都无需交互。
    请先确保主机密钥受信任（例如 `ssh bot@mac-mini.tailnet-1234.ts.net`），以便填充 `known_hosts`。

  </Accordion>

  <Accordion title="多账号模式">
    iMessage 支持在 `channels.imessage.accounts` 下进行按账号配置。

    每个账号都可以覆盖 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、历史记录设置以及附件根路径允许列表等字段。

  </Accordion>
</AccordionGroup>

## 媒体、分块和投递目标

<AccordionGroup>
  <Accordion title="附件和媒体">
    - 入站附件摄取**默认关闭** —— 设置 `channels.imessage.includeAttachments: true`，即可将照片、语音备忘录、视频和其他附件转发给智能体。禁用时，仅含附件的 iMessage 会在到达智能体之前被丢弃，并且可能根本不会产生 `Inbound message` 日志行。
    - 设置 `remoteHost` 时，可以通过 SCP 获取远程附件路径
    - 附件路径必须匹配允许的根路径：
      - `channels.imessage.attachmentRoots`（本地）
      - `channels.imessage.remoteAttachmentRoots`（远程 SCP 模式）
      - 默认根路径模式：`/Users/*/Library/Messages/Attachments`
    - SCP 使用严格主机密钥检查（`StrictHostKeyChecking=yes`）
    - 出站媒体大小使用 `channels.imessage.mediaMaxMb`（默认 16 MB）

  </Accordion>

  <Accordion title="出站分块">
    - 文本分块限制：`channels.imessage.textChunkLimit`（默认 4000）
    - 分块模式：`channels.imessage.chunkMode`
      - `length`（默认）
      - `newline`（优先按段落拆分）

  </Accordion>

  <Accordion title="寻址格式">
    首选显式目标：

    - `chat_id:123`（推荐用于稳定路由）
    - `chat_guid:...`
    - `chat_identifier:...`

    也支持句柄目标：

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## 私有 API 操作

当 `imsg launch` 正在运行，并且 `openclaw channels status --probe` 报告 `privateApi.available: true` 时，消息工具除了普通文本发送外，还可以使用 iMessage 原生操作。

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="可用操作">
    - **react**：添加/移除 iMessage tapback（`messageId`、`emoji`、`remove`）。支持的 tapback 映射到爱心、喜欢、不喜欢、大笑、强调和疑问。
    - **reply**：向现有消息发送线程回复（`messageId`、`text` 或 `message`，以及 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。
    - **sendWithEffect**：使用 iMessage 效果发送文本（`text` 或 `message`，`effect` 或 `effectId`）。
    - **edit**：在支持的 macOS/私有 API 版本上编辑已发送消息（`messageId`、`text` 或 `newText`）。
    - **unsend**：在支持的 macOS/私有 API 版本上撤回已发送消息（`messageId`）。
    - **upload-file**：发送媒体/文件（`buffer` 为 base64，或已注水的 `media`/`path`/`filePath`、`filename`，可选 `asVoice`）。旧版别名：`sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**：当当前目标是群组对话时，管理群聊。

  </Accordion>

  <Accordion title="消息 ID">
    入站 iMessage 上下文会在可用时同时包含短 `MessageSid` 值和完整消息 GUID。短 ID 的作用域限定在最近的内存回复缓存中，并会在使用前根据当前聊天进行检查。如果短 ID 已过期或属于另一个聊天，请使用完整的 `MessageSidFull` 重试。

  </Accordion>

  <Accordion title="能力检测">
    只有当缓存的探测状态显示桥接不可用时，OpenClaw 才会隐藏私有 API 操作。如果状态未知，操作会保持可见，并在调度时惰性探测，因此首次操作可以在 `imsg launch` 之后成功，而无需单独手动刷新状态。

  </Accordion>

  <Accordion title="已读回执和正在输入">
    当私有 API 桥接启动时，已接受的入站聊天会在调度前标记为已读，并在智能体生成期间向发送者显示正在输入气泡。使用以下配置禁用已读标记：

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    早于按方法能力列表的旧版 `imsg` 构建会静默关闭正在输入/已读门控；OpenClaw 会在每次重启时记录一次性警告，以便归因缺失的回执。

  </Accordion>

  <Accordion title="入站 tapback">
    OpenClaw 订阅 iMessage tapback，并将已接受的反应作为系统事件路由，而不是作为普通消息文本，因此用户 tapback 不会触发普通回复循环。

    通知模式由 `channels.imessage.reactionNotifications` 控制：

    - `"own"`（默认）：仅当用户对机器人撰写的消息作出反应时通知。
    - `"all"`：通知来自已授权发送者的所有入站 tapback。
    - `"off"`：忽略入站 tapback。

    按账号覆盖使用 `channels.imessage.accounts.<id>.reactionNotifications`。

  </Accordion>
</AccordionGroup>

## 配置写入

iMessage 默认允许由频道发起的配置写入（用于 `commands.config: true` 时的 `/config set|unset`）。

禁用：

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 合并拆分发送的私信（同一次输入中的命令 + URL）

当用户同时输入命令和 URL 时 —— 例如 `Dump https://example.com/article` —— Apple 的 Messages 应用会将发送拆分成**两条独立的 `chat.db` 行**：

1. 一条文本消息（`"Dump"`）。
2. 一个 URL 预览气泡（`"https://..."`），并带有 OG 预览图片作为附件。

两行在大多数设置中会相隔约 0.8-2.0 秒到达 OpenClaw。如果没有合并，智能体会在第 1 轮只收到命令并回复（通常是“把 URL 发给我”），然后到第 2 轮才看到 URL，此时命令上下文已经丢失。这是 Apple 的发送管线行为，并不是 OpenClaw 或 `imsg` 引入的。

`channels.imessage.coalesceSameSenderDms` 会让一个私信选择把连续的同发送者行合并成一个智能体轮次。群组聊天会继续按消息分发，以保留多用户轮次结构。

<Tabs>
  <Tab title="何时启用">
    在以下情况启用：

    - 你发布的技能期望在一条消息中收到 `command + payload`（dump、paste、save、queue 等）。
    - 你的用户会把 URL、图片或长内容与命令一起粘贴。
    - 你可以接受增加的私信轮次延迟（见下文）。

    在以下情况保持禁用：

    - 你需要单词私信触发器具备最低命令延迟。
    - 你的所有流程都是没有后续载荷的一次性命令。

  </Tab>
  <Tab title="启用">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    开启该标志且没有显式设置 `messages.inbound.byChannel.imessage` 时，防抖窗口会扩大到 **2500 ms**（旧默认值为 0 ms，即不防抖）。需要更宽的窗口，是因为 Apple 的拆分发送节奏为 0.8-2.0 秒，无法适配更紧的默认值。

    如需自行调整窗口：

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is
            // slow or under memory pressure (observed gap can stretch past 2 s
            // then).
            imessage: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="权衡">
    - **私信消息会增加延迟。** 开启该标志后，每条私信（包括独立控制命令和单条文本后续消息）都会在分发前最多等待一个防抖窗口，以防有载荷行即将到来。群组聊天消息仍会即时分发。
    - **合并输出有上限。** 合并文本最多 4000 个字符，并带有显式的 `…[truncated]` 标记；附件最多 20 个；来源条目最多 10 个（超出后保留第一条和最新条）。每个来源 GUID 都会在 `coalescedMessageGuids` 中跟踪，供下游遥测使用。
    - **仅限私信。** 群组聊天会回退为按消息分发，因此多人输入时 bot 仍能保持响应。
    - **按渠道选择启用。** 其他渠道（Telegram、WhatsApp、Slack、……）不受影响。设置了 `channels.bluebubbles.coalesceSameSenderDms` 的旧版 BlueBubbles 配置应将该值迁移到 `channels.imessage.coalesceSameSenderDms`。

  </Tab>
</Tabs>

### 场景以及智能体看到的内容

| 用户编写                                                           | `chat.db` 产生       | 关闭标志（默认）                        | 开启标志 + 2500 ms 窗口                                                |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（一次发送）                              | 2 行，相隔约 1 秒     | 两个智能体轮次：“Dump” 单独一轮，然后是 URL | 一个轮次：合并文本 `Dump https://example.com`                        |
| `Save this 📎image.jpg caption`（附件 + 文本）                | 2 行                | 两个轮次（附件在合并时丢弃） | 一个轮次：保留文本 + 图片                                        |
| `/status`（独立命令）                                     | 1 行                 | 即时分发                        | **最多等待一个窗口，然后分发**                                    |
| 单独粘贴 URL                                                   | 1 行                 | 即时分发                        | 即时分发（桶中只有一个条目）                             |
| 文本 + URL 作为两条有意分开的消息发送，相隔数分钟 | 窗口外 2 行 | 两个轮次                               | 两个轮次（两者之间窗口已过期）                                 |
| 快速大量发送（窗口内 >10 条小私信）                          | N 行                | N 个轮次                                 | 一个轮次，输出有上限（应用第一条 + 最新条、文本/附件上限） |
| 两个人在群组聊天中输入                                  | 来自 M 个发送者的 N 行 | M+ 个轮次（每个发送者桶一个）        | M+ 个轮次，群组聊天不会被合并                                |

## Gateway 网关停机后的追赶

当 Gateway 网关离线（崩溃、重启、Mac 休眠、机器关机）时，`imsg watch` 会在 Gateway 网关恢复后从当前 `chat.db` 状态继续；默认情况下，间隔期间到达的任何内容都不会被看到。追赶会在下一次启动时重放这些消息，确保智能体不会静默错过入站流量。

追赶功能**默认禁用**。按渠道启用：

```ts
channels: {
  imessage: {
    catchup: {
      enabled: true,             // master switch (default: false)
      maxAgeMinutes: 120,        // skip rows older than now - 2h (default: 120, clamp 1..720)
      perRunLimit: 50,           // max rows replayed per startup (default: 50, clamp 1..500)
      firstRunLookbackMinutes: 30, // first run with no cursor: look back 30 min (default: 30)
      maxFailureRetries: 10,     // give up on a wedged guid after 10 dispatch failures (default: 10)
    },
  },
}
```

### 运行方式

每次 `monitorIMessageProvider` 启动执行一轮，顺序为 `imsg launch` 就绪 → `watch.subscribe` → `performIMessageCatchup` → 实时分发循环。追赶本身使用 `chats.list` + 每个聊天的 `messages.history`，并通过与 `imsg watch` 相同的 JSON-RPC 客户端调用。追赶期间到达的任何内容都会照常流经实时分发；现有入站去重缓存会吸收与重放行之间的任何重叠。

每条重放行都会走实时分发路径（`evaluateIMessageInbound` + `dispatchInboundMessage`），因此允许列表、群组策略、防抖器、回声缓存和已读回执在重放消息与实时消息上的行为完全一致。

### 游标和重试语义

追赶会在 `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` 保存按账号划分的游标（OpenClaw 状态目录默认是 `~/.openclaw`，可用 `OPENCLAW_STATE_DIR` 覆盖）：

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- 每次成功分发后，游标都会前进；当某行的分发抛出异常时，游标会保持不变，下一次启动会从保持的游标重试同一行。
- 当同一个 `guid` 连续抛出异常达到 `maxFailureRetries` 次后，追赶会记录一条 `warn`，并强制将游标推进到卡住的消息之后，确保后续启动可以继续前进。
- 已经放弃的 guid 在后续运行中一看到就跳过（不会尝试分发），并计入运行摘要中的 `skippedGivenUp`。

### 操作者可见信号

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

`WARN ... capped to perRunLimit` 行表示单次启动没有清空全部积压。如果你的间隔经常超过默认的 50 行处理量，请提高 `perRunLimit`（最大 500）。

### 何时保持关闭

- Gateway 网关持续运行，并有看门狗自动重启，间隔始终小于几秒，此时默认关闭即可。
- 私信量很低，错过消息也不会改变智能体行为；`firstRunLookbackMinutes` 初始窗口可能会在首次启用时分发令人意外的旧上下文。

启用追赶后，首次没有游标的启动只会回看 `firstRunLookbackMinutes`（默认 30 分钟），而不是完整的 `maxAgeMinutes` 窗口；这样可避免重放启用前的长历史消息。

## 故障排除

<AccordionGroup>
  <Accordion title="找不到 imsg 或 RPC 不受支持">
    验证二进制文件和 RPC 支持：

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    如果探测报告 RPC 不受支持，请更新 `imsg`。如果私有 API 操作不可用，请在已登录的 macOS 用户会话中运行 `imsg launch`，然后再次探测。如果 Gateway 网关未在 macOS 上运行，请使用上面的通过 SSH 连接远程 Mac 设置，而不是默认的本地 `imsg` 路径。

  </Accordion>

  <Accordion title="Gateway 网关未在 macOS 上运行">
    默认的 `cliPath: "imsg"` 必须在已登录 Messages 的 Mac 上运行。在 Linux 或 Windows 上，将 `channels.imessage.cliPath` 设置为一个包装脚本，用 SSH 连接到那台 Mac 并运行 `imsg "$@"`。

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    然后运行：

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="私信被忽略">
    检查：

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - 配对审批（`openclaw pairing list imessage`）

  </Accordion>

  <Accordion title="群组消息被忽略">
    检查：

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` 允许列表行为
    - 提及模式配置（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="远程附件失败">
    检查：

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - 来自 Gateway 网关主机的 SSH/SCP 密钥认证
    - 主机密钥存在于 Gateway 网关主机上的 `~/.ssh/known_hosts`
    - 运行 Messages 的 Mac 上远程路径可读

  </Accordion>

  <Accordion title="错过了 macOS 权限提示">
    在同一用户/会话上下文中的交互式 GUI 终端中重新运行，并批准提示：

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    确认运行 OpenClaw/`imsg` 的进程上下文已获得 Full Disk Access + Automation 权限。

  </Accordion>
</AccordionGroup>

## 配置参考指针

- [Configuration reference - iMessage](/zh-CN/gateway/config-channels#imessage)
- [Gateway 网关配置](/zh-CN/gateway/configuration)
- [配对](/zh-CN/channels/pairing)

## 相关

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage) — 公告和迁移摘要
- [Coming from BlueBubbles](/zh-CN/channels/imessage-from-bluebubbles) — 配置转换表和逐步切换流程
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程
- [群组](/zh-CN/channels/groups) — 群组聊天行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全性](/zh-CN/gateway/security) — 访问模型和加固
