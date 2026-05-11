---
read_when:
    - 设置 iMessage 支持
    - 调试 iMessage 发送/接收
summary: 通过 imsg（基于 stdio 的 JSON-RPC）提供原生 iMessage 支持，包含用于回复、Tapback 回应、效果、附件和群组管理的私有 API 操作。当主机要求满足时，这是新的 OpenClaw iMessage 设置的首选方案。
title: iMessage
x-i18n:
    generated_at: "2026-05-11T20:20:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbce499e35c3dac12e6bb3f157d624a02a9bc8c26356f3decdfe62c85db6ee15
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
对于 OpenClaw iMessage 部署，请在已登录的 macOS Messages 主机上使用 `imsg`。如果你的 Gateway 网关运行在 Linux 或 Windows 上，请将 `channels.imessage.cliPath` 指向一个 SSH 包装脚本，由它在 Mac 上运行 `imsg`。

**Gateway 网关停机补收是选择性启用的。** 启用后（`channels.imessage.catchup.enabled: true`），Gateway 网关会在下次启动时重放它离线期间（崩溃、重启、Mac 睡眠）落入 `chat.db` 的入站消息。默认禁用 — 参见 [Gateway 网关停机后的补收](#catching-up-after-gateway-downtime)。关闭 [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649)。
</Note>

<Warning>
BlueBubbles 支持已移除。请将 `channels.bluebubbles` 配置迁移到 `channels.imessage`；OpenClaw 仅通过 `imsg` 支持 iMessage。简短公告请从 [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage) 开始，完整迁移表请参见 [Coming from BlueBubbles](/zh-CN/channels/imessage-from-bluebubbles)。
</Warning>

Status：原生外部 CLI 集成。Gateway 网关会启动 `imsg rpc`，并通过 stdio 上的 JSON-RPC 通信（没有单独的守护进程/端口）。高级操作需要 `imsg launch` 以及成功的私有 API 探测。

<CardGroup cols={3}>
  <Card title="私有 API 操作" icon="wand-sparkles" href="#private-api-actions">
    回复、tapback、效果、附件和群组管理。
  </Card>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    iMessage 私信默认使用配对模式。
  </Card>
  <Card title="远程 Mac" icon="terminal" href="#remote-mac-over-ssh">
    当 Gateway 网关没有运行在 Messages Mac 上时，请使用 SSH 包装脚本。
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

    如果未设置 `remoteHost`，OpenClaw 会尝试通过解析 SSH 包装脚本自动检测它。
    `remoteHost` 必须是 `host` 或 `user@host`（不能有空格或 SSH 选项）。
    OpenClaw 对 SCP 使用严格的主机密钥检查，因此中继主机密钥必须已存在于 `~/.ssh/known_hosts` 中。
    附件路径会根据允许的根路径（`attachmentRoots` / `remoteAttachmentRoots`）进行验证。

  </Tab>
</Tabs>

## 要求和权限（macOS）

- Messages 必须已在运行 `imsg` 的 Mac 上登录。
- 运行 OpenClaw/`imsg` 的进程上下文需要 Full Disk Access（Messages 数据库访问）。
- 通过 Messages.app 发送消息需要 Automation 权限。
- 对于高级操作（回应 / 编辑 / 撤回发送 / 线程回复 / 效果 / 群组操作），必须禁用 System Integrity Protection — 请参见下方的 [启用 imsg 私有 API](#enabling-the-imsg-private-api)。基础文本和媒体发送/接收无需禁用。

<Tip>
权限按进程上下文授予。如果 Gateway 网关以无头方式运行（LaunchAgent/SSH），请在同一上下文中运行一次性交互式命令以触发提示：

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## 启用 imsg 私有 API

`imsg` 提供两种运行模式：

- **基础模式**（默认，无需更改 SIP）：通过 `send` 发送出站文本和媒体、入站监听/历史记录、聊天列表。这是全新执行 `brew install steipete/tap/imsg` 并授予上文标准 macOS 权限后开箱即得的能力。
- **私有 API 模式**：`imsg` 将辅助 dylib 注入 `Messages.app`，以调用内部 `IMCore` 函数。这会解锁 `react`、`edit`、`unsend`、`reply`（线程回复）、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`，以及输入状态和已读回执。

要使用本频道页面所记录的高级操作能力，需要私有 API 模式。`imsg` README 明确说明了要求：

> `read`、`typing`、`launch`、桥接支持的富发送、消息变更和聊天管理等高级功能是选择性启用的。它们需要禁用 SIP，并将辅助 dylib 注入 `Messages.app`。启用 SIP 时，`imsg launch` 会拒绝注入。

辅助注入技术使用 `imsg` 自带的 dylib 来访问 Messages 私有 API。OpenClaw iMessage 路径中没有第三方服务器或 BlueBubbles 运行时。

<Warning>
**禁用 SIP 是真实的安全权衡。** SIP 是 macOS 防止运行被修改系统代码的核心保护之一；在系统范围内关闭它会带来额外攻击面和副作用。尤其是，**在 Apple Silicon Mac 上禁用 SIP 还会禁用在 Mac 上安装和运行 iOS 应用的能力**。

请将其视为有意的运维选择，而不是默认项。如果你的威胁模型无法接受关闭 SIP，内置 iMessage 将仅限于基础模式 — 只能发送/接收文本和媒体，没有回应 / 编辑 / 撤回发送 / 效果 / 群组操作。
</Warning>

### 设置

1. 在运行 Messages.app 的 Mac 上**安装（或升级）`imsg`**：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 输出会报告 `bridge_version`、`rpc_methods` 和每个方法的 `selectors`，因此你可以在开始前查看当前构建支持哪些能力。

2. **禁用 System Integrity Protection。** 这与 macOS 版本相关，因为底层 Apple 要求取决于操作系统和硬件：
   - **macOS 10.13–10.15（Sierra–Catalina）：**通过 Terminal 禁用 Library Validation，重启进入 Recovery Mode，运行 `csrutil disable`，然后重启。
   - **macOS 11+（Big Sur 及更高版本），Intel：**进入 Recovery Mode（或 Internet Recovery），运行 `csrutil disable`，然后重启。
   - **macOS 11+，Apple Silicon：**使用电源按钮启动流程进入 Recovery；在较新的 macOS 版本中，点击 Continue 时按住 **Left Shift** 键，然后运行 `csrutil disable`。虚拟机设置遵循单独流程 — 请先创建 VM 快照。
   - **macOS 26 / Tahoe：**library-validation 策略和 `imagent` 私有权限检查进一步收紧；`imsg` 可能需要更新构建才能跟上。如果 macOS 大版本升级后 `imsg launch` 注入或特定 `selectors` 开始返回 false，请先检查 `imsg` 的发行说明，再判断 SIP 步骤是否成功。

   在运行 `imsg launch` 之前，请按照 Apple 针对你的 Mac 的 Recovery-mode 流程禁用 SIP。

3. **注入辅助组件。** 在已禁用 SIP 且 Messages.app 已登录的情况下：

   ```bash
   imsg launch
   ```

   如果 SIP 仍处于启用状态，`imsg launch` 会拒绝注入，因此这也可确认第 2 步已生效。

4. **从 OpenClaw 验证桥接：**

   ```bash
   openclaw channels status --probe
   ```

   iMessage 条目应报告 `works`，并且 `imsg status --json | jq '.selectors'` 应显示 `retractMessagePart: true`，以及你的 macOS 构建暴露的编辑 / 输入状态 / 已读 selector。OpenClaw 插件在 `actions.ts` 中的逐方法门控只会公开底层 selector 为 `true` 的操作，因此你在 agent 工具列表中看到的操作能力会反映此主机上的桥接实际能做什么。

如果 `openclaw channels status --probe` 将该渠道报告为 `works`，但特定操作在分发时抛出 “iMessage `<action>` requires the imsg private API bridge”，请再次运行 `imsg launch` — 辅助组件可能会失效（Messages.app 重启、操作系统更新等），并且缓存的 `available: true` 状态会继续公开操作，直到下一次探测刷新。

### 无法禁用 SIP 时

如果禁用 SIP 不符合你的威胁模型：

- `imsg` 会回退到基础模式 — 仅支持文本 + 媒体 + 接收。
- OpenClaw 插件仍会公开文本/媒体发送和入站监控；它只是会根据逐方法能力门控，从操作能力中隐藏 `react`、`edit`、`unsend`、`reply`、`sendWithEffect` 和群组操作。
- 你可以运行一台单独的非 Apple-Silicon Mac（或专用机器人 Mac）并为 iMessage 工作负载关闭 SIP，同时在你的主要设备上保持 SIP 启用。参见下方的 [专用机器人 macOS 用户（单独的 iMessage 身份）](#deployment-patterns)。

## 访问控制和路由

<Tabs>
  <Tab title="私信策略">
    `channels.imessage.dmPolicy` 控制直接消息：

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    允许列表字段：`channels.imessage.allowFrom`。

    允许列表条目可以是 handle、静态发送者访问组（`accessGroup:<name>`）或聊天目标（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。

  </Tab>

  <Tab title="群组策略 + 提及">
    `channels.imessage.groupPolicy` 控制群组处理：

    - `allowlist`（配置后默认）
    - `open`
    - `disabled`

    群组发送者允许列表：`channels.imessage.groupAllowFrom`。

    `groupAllowFrom` 条目也可以引用静态发送者访问组（`accessGroup:<name>`）。

    运行时回退：如果未设置 `groupAllowFrom`，iMessage 群组发送者检查会在可用时回退到 `allowFrom`。
    运行时说明：如果完全缺少 `channels.imessage`，运行时会回退到 `groupPolicy="allowlist"` 并记录警告（即使已设置 `channels.defaults.groupPolicy`）。

    <Warning>
    群组路由有**两个**允许列表门控会前后连续运行，并且两者都必须通过：

    1. **发送者 / 聊天目标允许列表**（`channels.imessage.groupAllowFrom`）— handle、`chat_guid`、`chat_identifier` 或 `chat_id`。
    2. **群组注册表**（`channels.imessage.groups`）— 使用 `groupPolicy: "allowlist"` 时，此门控要求存在 `groups: { "*": { ... } }` 通配符条目（设置 `allowAll = true`），或在 `groups` 下存在明确的每个 `chat_id` 条目。

    如果门控 2 里面没有任何内容，每条群组消息都会被丢弃。插件会在默认日志级别发出两个 `warn` 级别信号：

    - 启动时每个账号一次：`imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - 运行时每个 `chat_id` 一次：`imessage: dropping group message from chat_id=<id> ...`

    私信会继续工作，因为它们走不同的代码路径。

    在 `groupPolicy: "allowlist"` 下保持群组流转的最小配置：

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

    如果这些 `warn` 行出现在 Gateway 网关日志中，说明第 2 道门控正在丢弃消息，请添加 `groups` 块。
    </Warning>

    说明群组的提及门控：

    - iMessage 没有原生提及元数据
    - 提及检测使用正则表达式模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 如果没有配置任何模式，就无法强制执行提及门控

    来自授权发送者的控制命令可以绕过群组中的提及门控。

    按群组配置的 `systemPrompt`：

    `channels.imessage.groups.*` 下的每个条目都接受一个可选的 `systemPrompt` 字符串。该值会在处理该群组中消息的每个轮次注入到 agent 的系统提示词中。解析方式与 `channels.whatsapp.groups` 使用的按群组提示词解析一致：

    1. **群组专用系统提示词**（`groups["<chat_id>"].systemPrompt`）：当映射中存在特定群组条目，**且**其 `systemPrompt` 键已定义时使用。如果 `systemPrompt` 是空字符串（`""`），则会抑制通配符，并且不会向该群组应用系统提示词。
    2. **群组通配符系统提示词**（`groups["*"].systemPrompt`）：当映射中完全不存在特定群组条目，或条目存在但未定义 `systemPrompt` 键时使用。

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

    按群组配置的提示词仅适用于群组消息，此渠道中的私信不受影响。

  </Tab>

  <Tab title="会话和确定性回复">
    - 私信使用直接路由；群组使用群组路由。
    - 使用默认的 `session.dmScope=main` 时，iMessage 私信会折叠到 agent 主会话中。
    - 群组会话是隔离的（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回复会使用原始渠道/目标元数据路由回 iMessage。

    类似群组的线程行为：

    一些多参与者 iMessage 线程可能以 `is_group=false` 到达。
    如果该 `chat_id` 已在 `channels.imessage.groups` 下显式配置，OpenClaw 会将其视为群组流量（群组门控 + 群组会话隔离）。

  </Tab>
</Tabs>

## ACP 对话绑定

旧版 iMessage 聊天也可以绑定到 ACP 会话。

快速操作员流程：

- 在私信或允许的群组聊天中运行 `/acp spawn codex --bind here`。
- 同一 iMessage 对话中的后续消息会路由到生成的 ACP 会话。
- `/new` 和 `/reset` 会就地重置同一个已绑定 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

支持通过顶层 `bindings[]` 条目配置持久绑定，其中包含 `type: "acp"` 和 `match.channel: "imessage"`。

`match.peer.id` 可以使用：

- 规范化私信句柄，例如 `+15555550123` 或 `user@example.com`
- `chat_id:<id>`（建议用于稳定的群组绑定）
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

有关共享 ACP 绑定行为，请参阅 [ACP Agents](/zh-CN/tools/acp-agents)。

## 部署模式

<AccordionGroup>
  <Accordion title="专用机器人 macOS 用户（独立 iMessage 身份）">
    使用专用 Apple ID 和 macOS 用户，使机器人流量与你的个人 Messages 资料隔离。

    典型流程：

    1. 创建/登录一个专用 macOS 用户。
    2. 在该用户中用机器人 Apple ID 登录 Messages。
    3. 在该用户中安装 `imsg`。
    4. 创建 SSH 包装器，让 OpenClaw 可以在该用户上下文中运行 `imsg`。
    5. 将 `channels.imessage.accounts.<id>.cliPath` 和 `.dbPath` 指向该用户资料。

    首次运行可能需要在该机器人用户会话中进行 GUI 批准（Automation + Full Disk Access）。

  </Accordion>

  <Accordion title="通过 Tailscale 连接远程 Mac（示例）">
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

    使用 SSH 密钥，确保 SSH 和 SCP 都是非交互式的。
    先确保主机密钥受信任（例如 `ssh bot@mac-mini.tailnet-1234.ts.net`），以便填充 `known_hosts`。

  </Accordion>

  <Accordion title="多账号模式">
    iMessage 支持在 `channels.imessage.accounts` 下按账号配置。

    每个账号都可以覆盖 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、历史记录设置和附件根目录 allowlist 等字段。

  </Accordion>
</AccordionGroup>

## 媒体、分块和投递目标

<AccordionGroup>
  <Accordion title="附件和媒体">
    - 入站附件摄取**默认关闭**，设置 `channels.imessage.includeAttachments: true` 可将照片、语音备忘录、视频和其他附件转发给 agent。关闭时，仅包含附件的 iMessage 会在到达 agent 前被丢弃，并且可能完全不会生成 `Inbound message` 日志行。
    - 设置 `remoteHost` 后，可以通过 SCP 获取远程附件路径
    - 附件路径必须匹配允许的根目录：
      - `channels.imessage.attachmentRoots`（本地）
      - `channels.imessage.remoteAttachmentRoots`（远程 SCP 模式）
      - 默认根目录模式：`/Users/*/Library/Messages/Attachments`
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
    推荐的显式目标：

    - `chat_id:123`（建议用于稳定路由）
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

当 `imsg launch` 正在运行且 `openclaw channels status --probe` 报告 `privateApi.available: true` 时，消息工具除了正常发送文本外，还可以使用 iMessage 原生操作。

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
    - **react**：添加/移除 iMessage tapback（`messageId`、`emoji`、`remove`）。支持的 tapback 会映射到 love、like、dislike、laugh、emphasize 和 question。
    - **reply**：向现有消息发送线程回复（`messageId`、`text` 或 `message`，以及 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。
    - **sendWithEffect**：使用 iMessage 效果发送文本（`text` 或 `message`，`effect` 或 `effectId`）。
    - **edit**：在支持的 macOS/私有 API 版本上编辑已发送消息（`messageId`、`text` 或 `newText`）。
    - **unsend**：在支持的 macOS/私有 API 版本上撤回已发送消息（`messageId`）。
    - **upload-file**：发送媒体/文件（`buffer` 作为 base64，或已补全的 `media`/`path`/`filePath`，`filename`，可选 `asVoice`）。旧版别名：`sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**：当当前目标是群组对话时管理群组聊天。

  </Accordion>

  <Accordion title="消息 ID">
    入站 iMessage 上下文在可用时同时包含短 `MessageSid` 值和完整消息 GUID。短 ID 的作用域限定在近期内存回复缓存中，并且在使用前会根据当前聊天进行检查。如果短 ID 已过期或属于另一个聊天，请使用完整 `MessageSidFull` 重试。

  </Accordion>

  <Accordion title="能力检测">
    OpenClaw 只会在缓存的探测状态表明桥接不可用时隐藏私有 API 操作。如果状态未知，操作会保持可见，并在分发时延迟探测，因此首次操作可以在 `imsg launch` 后成功，而无需单独手动刷新状态。

  </Accordion>

  <Accordion title="已读回执和正在输入">
    当私有 API 桥接启动后，已接受的入站聊天会在分发前被标记为已读，并且在 agent 生成回复时向发送者显示正在输入气泡。使用以下配置禁用已读标记：

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    早于按方法能力列表的旧版 `imsg` 构建会静默关闭正在输入/已读门控；OpenClaw 会在每次重启时记录一次警告，以便能归因缺失的回执。

  </Accordion>
</AccordionGroup>

## 配置写入

iMessage 默认允许由渠道发起的配置写入（用于 `commands.config: true` 时的 `/config set|unset`）。

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

## 合并拆分发送的私信（在一次组合中包含命令 + URL）

当用户同时输入命令和 URL，例如 `Dump https://example.com/article`，Apple 的 Messages 应用会将发送拆成**两条独立的 `chat.db` 行**：

1. 一条文本消息（`"Dump"`）。
2. 一个 URL 预览气泡（`"https://..."`），带有作为附件的 OG 预览图片。

在大多数设置中，这两行会相隔约 0.8-2.0 秒到达 OpenClaw。没有合并时，agent 会在第 1 个轮次只收到命令并回复（通常是“把 URL 发给我”），然后到第 2 个轮次才看到 URL，此时命令上下文已经丢失。这是 Apple 的发送管线，不是 OpenClaw 或 `imsg` 引入的行为。

`channels.imessage.coalesceSameSenderDms` 会让私信把同一发送者连续发送的行合并为一个 agent 轮次。群组聊天会继续按消息分发，以保留多用户轮次结构。

<Tabs>
  <Tab title="何时启用">
    在以下情况下启用：

    - 你发布的 Skills 期望在一条消息中收到 `command + payload`（dump、paste、save、queue 等）。
    - 你的用户会在命令旁粘贴 URL、图片或长内容。
    - 你可以接受增加的私信轮次延迟（见下文）。

    在以下情况下保持禁用：

    - 你需要让单词私信触发器拥有最低命令延迟。
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

    开启此标志且没有显式设置 `messages.inbound.byChannel.imessage` 时，防抖窗口会扩展到 **2500 ms**（旧版默认值为 0 ms，即不防抖）。需要更宽的窗口，是因为 Apple 的拆分发送节奏为 0.8-2.0 s，无法适应更紧的默认值。

    要自行调整窗口：

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
    - **DM 消息会增加延迟。**开启此标志后，每条 DM（包括独立控制命令和单条文本后续消息）都会在分发前最多等待防抖窗口时长，以防有负载行即将到达。群聊消息仍会即时分发。
    - **合并输出有边界。**合并文本上限为 4000 个字符，并带有显式 `…[truncated]` 标记；附件上限为 20 个；来源条目上限为 10 个（超出后保留第一个和最新的条目）。每个来源 GUID 都会在 `coalescedMessageGuids` 中跟踪，用于下游遥测。
    - **仅限 DM。**群聊会继续按消息逐条分发，因此当多人正在输入时，机器人仍能保持响应。
    - **按频道选择启用。**其他渠道（Telegram、WhatsApp、Slack、…）不受影响。设置了 `channels.bluebubbles.coalesceSameSenderDms` 的旧版 BlueBubbles 配置，应将该值迁移到 `channels.imessage.coalesceSameSenderDms`。

  </Tab>
</Tabs>

### 场景和智能体看到的内容

| 用户编写的内容                                                      | `chat.db` 生成的内容    | 标志关闭（默认）                      | 标志开启 + 2500 ms 窗口                                                |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（一次发送）                              | 2 行，间隔约 1 s     | 两个智能体轮次：“Dump” 单独一轮，然后 URL | 一个轮次：合并文本 `Dump https://example.com`                        |
| `Save this 📎image.jpg caption`（附件 + 文本）                | 2 行                | 两个轮次（合并时附件被丢弃） | 一个轮次：文本 + 图片被保留                                        |
| `/status`（独立命令）                                     | 1 行                 | 即时分发                        | **最多等待窗口时长，然后分发**                                    |
| 单独粘贴的 URL                                                   | 1 行                 | 即时分发                        | 即时分发（桶中只有一个条目）                             |
| 文本 + URL 作为两条有意分开的消息发送，间隔数分钟 | 2 行，位于窗口外 | 两个轮次                               | 两个轮次（窗口在两者之间过期）                                 |
| 快速涌入（窗口内 >10 条小 DM）                          | N 行                | N 个轮次                                 | 一个轮次，输出有边界（第一个 + 最新，应用文本/附件上限） |
| 群聊中两个人正在输入                                  | 来自 M 个发送者的 N 行 | M+ 个轮次（每个发送者桶一个）        | M+ 个轮次——群聊不会合并                                |

## Gateway 网关停机后的追赶

当 Gateway 网关离线（崩溃、重启、Mac 睡眠、机器关闭）时，`imsg watch` 会在 Gateway 网关恢复后从当前 `chat.db` 状态继续运行；默认情况下，间隙期间到达的任何内容都不会被看到。追赶会在下次启动时重放这些消息，让智能体不会静默错过入站流量。

追赶**默认禁用**。按频道启用：

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

每次 `monitorIMessageProvider` 启动执行一轮，顺序为 `imsg launch` 就绪 → `watch.subscribe` → `performIMessageCatchup` → 实时分发循环。追赶本身会使用 `chats.list` + 每个聊天的 `messages.history`，通过与 `imsg watch` 相同的 JSON-RPC 客户端执行。追赶过程中到达的任何内容都会正常通过实时分发流转；现有入站去重缓存会吸收与重放行的任何重叠。

每个重放行都会经过实时分发路径（`evaluateIMessageInbound` + `dispatchInboundMessage`），因此允许列表、群组策略、防抖器、回声缓存和已读回执在重放消息和实时消息上的行为完全相同。

### 游标和重试语义

追赶会在 `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` 保存每个账号的游标（OpenClaw 状态目录默认为 `~/.openclaw`，可用 `OPENCLAW_STATE_DIR` 覆盖）：

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- 每次成功分发后游标都会前进；当某一行的分发抛出异常时，游标会保持不变，下次启动会从保持的游标重试同一行。
- 对同一个 `guid` 连续抛出异常达到 `maxFailureRetries` 次后，追赶会记录一条 `warn`，并强制将游标推进到卡住的消息之后，让后续启动可以继续前进。
- 已经放弃的 guid 在后续运行中一看到就会跳过（不尝试分发），并在运行摘要中计入 `skippedGivenUp`。

### 操作者可见信号

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

一条 `WARN ... capped to perRunLimit` 行表示单次启动没有耗尽完整积压。如果你的间隙经常超过默认的 50 行一轮，请提高 `perRunLimit`（最大 500）。

### 何时保持关闭

- Gateway 网关持续运行，并带有 watchdog 自动重启，间隙总是小于几秒——默认关闭即可。
- DM 流量较低，漏掉的消息不会改变智能体行为——首次启用时，`firstRunLookbackMinutes` 初始窗口可能会分发令人意外的旧上下文。

开启追赶后，没有游标的首次启动只会回看 `firstRunLookbackMinutes`（默认 30 分钟），而不是完整的 `maxAgeMinutes` 窗口；这可以避免重放启用前的大量历史消息。

## 故障排除

<AccordionGroup>
  <Accordion title="找不到 imsg 或不支持 RPC">
    验证二进制文件和 RPC 支持：

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    如果探测报告不支持 RPC，请更新 `imsg`。如果私有 API 操作不可用，请在已登录的 macOS 用户会话中运行 `imsg launch`，然后再次探测。如果 Gateway 网关不是在 macOS 上运行，请使用上面的通过 SSH 连接远程 Mac 设置，而不是默认本地 `imsg` 路径。

  </Accordion>

  <Accordion title="Gateway 网关未在 macOS 上运行">
    默认的 `cliPath: "imsg"` 必须在登录了 Messages 的 Mac 上运行。在 Linux 或 Windows 上，将 `channels.imessage.cliPath` 设置为一个包装脚本，该脚本通过 SSH 连接到那台 Mac 并运行 `imsg "$@"`。

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    然后运行：

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DM 被忽略">
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
    - Gateway 网关主机上的 `~/.ssh/known_hosts` 中存在主机密钥
    - 运行 Messages 的 Mac 上远程路径的可读性

  </Accordion>

  <Accordion title="错过了 macOS 权限提示">
    在同一用户/会话上下文中的交互式 GUI 终端里重新运行，并批准提示：

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    确认为运行 OpenClaw/`imsg` 的进程上下文授予了“完全磁盘访问权限”+“自动化”权限。

  </Accordion>
</AccordionGroup>

## 配置参考指针

- [Configuration reference - iMessage](/zh-CN/gateway/config-channels#imessage)
- [Gateway 网关配置](/zh-CN/gateway/configuration)
- [配对](/zh-CN/channels/pairing)

## 相关

- [Channels 概览](/zh-CN/channels)——所有受支持的渠道
- [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage)——公告和迁移摘要
- [Coming from BlueBubbles](/zh-CN/channels/imessage-from-bluebubbles)——配置转换表和分步切换
- [配对](/zh-CN/channels/pairing)——DM 认证和配对流程
- [群组](/zh-CN/channels/groups)——群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing)——消息的会话路由
- [安全](/zh-CN/gateway/security)——访问模型和加固
