---
read_when:
    - 设置 iMessage 支持
    - 调试 iMessage 发送/接收
summary: 通过 imsg（基于 stdio 的 JSON-RPC）提供原生 iMessage 支持，具备用于回复、点按回应、效果、投票、附件和群组管理的私有 API 操作。当主机要求满足时，这是新的 OpenClaw iMessage 设置的首选方案。
title: iMessage
x-i18n:
    generated_at: "2026-07-01T10:56:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0fbddd770d05762c64b81e9c6443ac8fd487ba15a34ed70b068a69776d355b81
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
对于 OpenClaw iMessage 部署，请在已登录的 macOS Messages 主机上使用 `imsg`。如果你的 Gateway 网关运行在 Linux 或 Windows 上，请将 `channels.imessage.cliPath` 指向一个 SSH 包装器，由它在 Mac 上运行 `imsg`。

**入站恢复是自动的。** 在 bridge 或 Gateway 网关重启后，iMessage 会重放停机期间错过的消息，并抑制 Apple 在 Push 恢复后可能刷出的陈旧“积压轰炸”，同时去重，确保不会重复分发任何内容。无需配置即可启用 — 请参阅[bridge 或 Gateway 网关重启后的入站恢复](#inbound-recovery-after-a-bridge-or-gateway-restart)。
</Note>

<Warning>
BlueBubbles 支持已移除。请将 `channels.bluebubbles` 配置迁移到 `channels.imessage`；OpenClaw 仅通过 `imsg` 支持 iMessage。简短公告请从 [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage) 开始，完整迁移表请参阅 [Coming from BlueBubbles](/zh-CN/channels/imessage-from-bluebubbles)。
</Warning>

状态：原生外部 CLI 集成。Gateway 网关会生成 `imsg rpc`，并通过 stdio 上的 JSON-RPC 通信（没有单独的守护进程/端口）。高级操作需要 `imsg launch` 以及成功的私有 API 探测。

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    回复、tapback、效果、投票、附件和群组管理。
  </Card>
  <Card title="Pairing" icon="link" href="/zh-CN/channels/pairing">
    iMessage 私信默认使用配对模式。
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    当 Gateway 网关未在 Messages Mac 上运行时，请使用 SSH 包装器。
  </Card>
  <Card title="Configuration reference" icon="settings" href="/zh-CN/gateway/config-channels#imessage">
    完整的 iMessage 字段参考。
  </Card>
</CardGroup>

## 快速设置

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Configure OpenClaw">

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

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        配对请求会在 1 小时后过期。
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw 只需要一个兼容 stdio 的 `cliPath`，因此你可以将 `cliPath` 指向一个包装器脚本，由它通过 SSH 连接到远程 Mac 并运行 `imsg`。

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

    如果未设置 `remoteHost`，OpenClaw 会尝试通过解析 SSH 包装器脚本来自动检测它。
    `remoteHost` 必须是 `host` 或 `user@host`（不能包含空格或 SSH 选项）。
    OpenClaw 对 SCP 使用严格的主机密钥检查，因此中继主机密钥必须已经存在于 `~/.ssh/known_hosts` 中。
    附件路径会根据允许的根目录（`attachmentRoots` / `remoteAttachmentRoots`）进行验证。

<Warning>
你放在 `imsg` 前面的任何 `cliPath` 包装器或 SSH 代理，都必须像长期运行的 JSON-RPC 透明 stdio 管道一样工作。OpenClaw 会在该渠道的生命周期内，通过包装器的 stdin/stdout 交换小型换行分帧 JSON-RPC 消息：

- 在字节可用后，**立即**转发每个 stdin 分块/行 — 不要等待 EOF。
- 及时按反方向转发每个 stdout 分块/行。
- 保留换行符。
- 避免固定大小的阻塞读取（`read(4096)`、`cat | buffer`、默认 shell `read`），它们可能会饿死小帧。
- 将 stderr 与 JSON-RPC stdout 流分开。

如果包装器一直缓冲 stdin，直到填满一个大块，症状会看起来像 iMessage 中断 — `imsg rpc timeout (chats.list)` 或频道反复重启 — 即使 `imsg rpc` 本身是健康的。上面的 `ssh -T host imsg "$@"` 是安全的，因为它会转发 OpenClaw 的 `cliPath` 参数，例如 `rpc` 和 `--db`。像 `ssh host imsg | grep -v '^DEBUG'` 这样的管道则**不安全** — 行缓冲工具仍可能截留帧；如果必须过滤，请在每个阶段使用 `stdbuf -oL -eL`。
</Warning>

  </Tab>
</Tabs>

## 要求和权限（macOS）

- 运行 `imsg` 的 Mac 必须已登录 Messages。
- 运行 OpenClaw/`imsg` 的进程上下文需要 Full Disk Access（Messages 数据库访问）。
- 需要 Automation 权限才能通过 Messages.app 发送消息。
- 对于高级操作（react / edit / unsend / threaded reply / effects / polls / group ops），必须禁用 System Integrity Protection — 请参阅下方的[启用 imsg 私有 API](#enabling-the-imsg-private-api)。基本文本和媒体的发送/接收无需禁用它即可工作。

<Tip>
权限按进程上下文授予。如果 Gateway 网关以无头方式运行（LaunchAgent/SSH），请在同一上下文中运行一次交互式命令以触发提示：

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH wrapper sends fail with AppleEvents -1743">
  远程 SSH 设置可以读取聊天、通过 `channels status --probe`，并处理入站消息，但出站发送仍可能因 AppleEvents 授权错误而失败：

```text
Not authorized to send Apple events to Messages. (-1743)
```

检查已登录 Mac 用户的 TCC 数据库，或检查 System Settings > Privacy & Security > Automation。如果 Automation 条目记录的是 `/usr/libexec/sshd-keygen-wrapper`，而不是 `imsg` 或本地 shell 进程，macOS 可能不会为该 SSH 服务端客户端暴露可用的 Messages 开关：

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

在这种状态下，反复执行 `tccutil reset AppleEvents`，或通过同一个 SSH 包装器重新运行 `imsg send`，可能会持续失败，因为需要 Messages Automation 的进程上下文是 SSH 包装器，而不是 UI 可以授权的应用。

请改用受支持的 `imsg` 进程上下文之一：

- 在已登录的 Messages 用户本地会话中运行 Gateway 网关，或至少运行 `imsg` bridge。
- 在同一会话中授予 Full Disk Access 和 Automation 后，使用该用户的 LaunchAgent 启动 Gateway 网关。
- 如果你保留双用户 SSH 拓扑，请在启用该渠道前，确认真实的出站 `imsg send` 可以通过完全相同的包装器成功执行。如果无法授予 Automation，请改为重新配置为单用户 `imsg` 设置，而不是依赖 SSH 包装器发送。

</Accordion>

## 启用 imsg 私有 API

`imsg` 提供两种运行模式：

- **基本模式**（默认，无需更改 SIP）：通过 `send` 发送出站文本和媒体、入站 watch/history、聊天列表。这是全新执行 `brew install steipete/tap/imsg` 并授予上方标准 macOS 权限后开箱即可获得的功能。
- **私有 API 模式**：`imsg` 会将一个辅助 dylib 注入 `Messages.app`，以调用内部 `IMCore` 函数。这会解锁 `react`、`edit`、`unsend`、`reply`（线程式）、`sendWithEffect`、`poll` 和 `poll-vote`（原生 Messages 投票）、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`，以及输入状态指示和已读回执。

要使用本频道页面记录的高级操作能力，你需要私有 API 模式。`imsg` README 明确说明了该要求：

> `read`、`typing`、`launch`、bridge 支持的富发送、消息变更和聊天管理等高级功能是选择性启用的。它们要求禁用 SIP，并将辅助 dylib 注入 `Messages.app`。启用 SIP 时，`imsg launch` 会拒绝注入。

该辅助注入技术使用 `imsg` 自己的 dylib 来访问 Messages 私有 API。OpenClaw iMessage 路径中没有第三方服务器或 BlueBubbles 运行时。

<Warning>
**禁用 SIP 是真实的安全取舍。** SIP 是 macOS 防止运行被修改系统代码的核心保护之一；在系统范围关闭它会打开额外攻击面并产生副作用。尤其是，**在 Apple Silicon Mac 上禁用 SIP 还会禁用在你的 Mac 上安装和运行 iOS 应用的能力**。

请将其视为有意的运维选择，而不是默认选项。如果你的威胁模型无法接受关闭 SIP，内置 iMessage 将仅限于基本模式 — 只能发送/接收文本和媒体，不能使用 reactions / edit / unsend / effects / group ops。
</Warning>

### 设置

1. 在运行 Messages.app 的 Mac 上**安装（或升级）`imsg`**：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 输出会报告 `bridge_version`、`rpc_methods` 和每个方法的 `selectors`，因此你可以在开始前查看当前构建支持哪些内容。

2. **禁用 System Integrity Protection，并且（在现代 macOS 上）禁用 Library Validation。** 将非 Apple 辅助 dylib 注入 Apple 签名的 `Messages.app`，需要关闭 SIP，**并且**放宽 library validation。Recovery 模式下的 SIP 步骤因 macOS 版本而异：
   - **macOS 10.13-10.15（Sierra-Catalina）：** 通过 Terminal 禁用 Library Validation，重启进入 Recovery Mode，运行 `csrutil disable`，然后重启。
   - **macOS 11+（Big Sur 及更高版本），Intel：** 进入 Recovery Mode（或 Internet Recovery），运行 `csrutil disable`，然后重启。
   - **macOS 11+，Apple Silicon：** 使用电源键启动流程进入 Recovery；在较新的 macOS 版本中，点击 Continue 时按住**左 Shift** 键，然后运行 `csrutil disable`。虚拟机设置遵循单独流程，因此请先创建 VM 快照。

   **在 macOS 11 及更高版本上，仅运行 `csrutil disable` 通常不够。** Apple 仍会把 `Messages.app` 作为平台二进制文件强制执行 library validation，因此即使关闭 SIP，临时签名的辅助程序也会被拒绝（`Library Validation failed: ... platform binary, but mapped file is not`）。禁用 SIP 后，还要禁用 library validation 并重启：

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26（Tahoe），已在 26.5.1 验证：** 关闭 SIP，**再加上**上面的 `DisableLibraryValidation` 命令，就足以在 26.0 到 26.5.x 上注入辅助程序。**不需要 boot-args。** 该 plist 是决定性因素，也是 Tahoe 上注入失败时最常见的遗漏步骤：
   - **有该 plist 时：** `imsg launch` 会注入，`imsg status` 会报告 `advanced_features: true`。
   - **没有该 plist 时（即使 SIP 已关闭）：** `imsg launch` 会失败并显示 `Failed to launch: Timeout waiting for Messages.app to initialize`。AMFI 会在加载时拒绝临时签名的辅助程序，因此 bridge 永远无法就绪，launch 最终超时。该超时是大多数人在 Tahoe 上遇到的症状，修复方式是使用上面的 plist，而不是采取更激进的措施。

   这已通过 macOS 26.5.1（Apple Silicon）上的受控前后对比确认：有该 plist 时，dylib 会映射到 `Messages.app`，bridge 会启动；移除该 plist 并重启后，`imsg launch` 会产生上面的超时失败，并且 dylib 未被映射。

   如果 `imsg launch` 注入或特定 `selectors` 在 macOS 升级后开始返回 false，这个门控通常就是原因。先检查你的 SIP 和库验证状态，再假设 SIP 步骤本身失败了。如果这些设置正确但桥接器仍无法注入，请收集 `imsg status --json` 以及 `imsg launch` 输出，并报告给 `imsg` 项目，而不是削弱其他系统范围的安全控制。

   先按照 Apple 针对你的 Mac 提供的恢复模式流程禁用 SIP，然后再运行 `imsg launch`。

3. **注入辅助程序。** 在 SIP 已禁用且 Messages.app 已登录的情况下：

   ```bash
   imsg launch
   ```

   当 SIP 仍处于启用状态时，`imsg launch` 会拒绝注入，因此这也可以作为第 2 步已生效的确认。

4. **从 OpenClaw 验证桥接器：**

   ```bash
   openclaw channels status --probe
   ```

   iMessage 条目应报告 `works`，并且 `imsg status --json | jq '{rpc_methods, selectors}'` 应显示你的 macOS 构建所暴露的能力。创建投票需要 `selectors.pollPayloadMessage`；投票需要同时具备 `selectors.pollVoteMessage` 和 `poll.vote` RPC 方法。OpenClaw 插件只会公布缓存探测支持的操作，而空缓存会保持乐观，并在首次分发时进行探测。

如果 `openclaw channels status --probe` 报告该渠道为 `works`，但特定操作在分发时抛出 “iMessage `<action>` requires the imsg private API bridge”，请再次运行 `imsg launch`，辅助程序可能会脱离（Messages.app 重启、操作系统更新等），而缓存的 `available: true` 状态会继续公布操作，直到下一次探测刷新。

### 无法禁用 SIP 时

如果禁用 SIP 不符合你的威胁模型：

- `imsg` 会回退到基础模式，即仅文本 + 媒体 + 接收。
- OpenClaw 插件仍会公布文本/媒体发送和入站监控；它只会从操作表面隐藏 `react`、`edit`、`unsend`、`reply`、`sendWithEffect` 以及群组操作（按每方法能力门控）。
- 你可以运行一台单独的非 Apple Silicon Mac（或专用机器人 Mac），为 iMessage 工作负载关闭 SIP，同时在主要设备上保持 SIP 启用。参见下方的 [Dedicated bot macOS user (separate iMessage identity)](#deployment-patterns)。

## 访问控制和路由

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` 控制私信：

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    允许列表字段：`channels.imessage.allowFrom`。

    允许列表条目必须标识发送者：handle 或静态发送者访问组（`accessGroup:<name>`）。对 `chat_id:*`、`chat_guid:*` 或 `chat_identifier:*` 等聊天目标使用 `channels.imessage.groupAllowFrom`；对数字 `chat_id` 注册表键使用 `channels.imessage.groups`。

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` 控制群组处理：

    - `allowlist`（配置后默认）
    - `open`
    - `disabled`

    群组发送者允许列表：`channels.imessage.groupAllowFrom`。

    `groupAllowFrom` 条目也可以引用静态发送者访问组（`accessGroup:<name>`）。

    运行时回退：如果未设置 `groupAllowFrom`，iMessage 群组发送者检查会使用 `allowFrom`；当私信和群组准入应不同时，请设置 `groupAllowFrom`。
    运行时说明：如果完全缺少 `channels.imessage`，运行时会回退到 `groupPolicy="allowlist"` 并记录警告（即使已设置 `channels.defaults.groupPolicy`）。

    <Warning>
    群组路由有**两个**允许列表门控连续运行，且两者都必须通过：

    1. **发送者 / 聊天目标允许列表**（`channels.imessage.groupAllowFrom`）—— handle、`chat_guid`、`chat_identifier` 或 `chat_id`。
    2. **群组注册表**（`channels.imessage.groups`）—— 使用 `groupPolicy: "allowlist"` 时，此门控要求存在 `groups: { "*": { ... } }` 通配符条目（设置 `allowAll = true`），或在 `groups` 下存在显式的按 `chat_id` 条目。

    如果门控 2 中没有任何内容，所有群组消息都会被丢弃。插件会在默认日志级别发出两个 `warn` 级别信号：

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

    如果 Gateway 网关日志中出现这些 `warn` 行，说明门控 2 正在丢弃消息，请添加 `groups` 块。
    </Warning>

    群组提及门控：

    - iMessage 没有原生提及元数据
    - 提及检测使用正则表达式模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 如果没有配置模式，就无法强制执行提及门控

    来自授权发送者的控制命令可以绕过群组中的提及门控。

    按群组设置的 `systemPrompt`：

    `channels.imessage.groups.*` 下的每个条目都接受一个可选的 `systemPrompt` 字符串。该值会在处理该群组消息的每一轮中注入到智能体的系统提示词。解析方式与 `channels.whatsapp.groups` 使用的按群组提示词解析一致：

    1. **群组专用系统提示词**（`groups["<chat_id>"].systemPrompt`）：当映射中存在特定群组条目**且**其 `systemPrompt` 键已定义时使用。如果 `systemPrompt` 是空字符串（`""`），通配符会被抑制，并且不会对该群组应用系统提示词。
    2. **群组通配符系统提示词**（`groups["*"].systemPrompt`）：当映射中完全不存在特定群组条目，或该条目存在但未定义 `systemPrompt` 键时使用。

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

    按群组提示词只应用于群组消息，本渠道中的直接消息不受影响。

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - 私信使用直接路由；群组使用群组路由。
    - 使用默认 `session.dmScope=main` 时，iMessage 私信会合并到智能体主会话中。
    - 群组会话相互隔离（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回复会使用来源渠道/目标元数据路由回 iMessage。

    类群组线程行为：

    某些多参与者 iMessage 线程可能以 `is_group=false` 到达。
    如果该 `chat_id` 已在 `channels.imessage.groups` 下显式配置，OpenClaw 会将其视为群组流量（群组门控 + 群组会话隔离）。

  </Tab>
</Tabs>

## ACP 对话绑定

旧版 iMessage 聊天也可以绑定到 ACP 会话。

快速操作流程：

- 在私信或允许的群组聊天中运行 `/acp spawn codex --bind here`。
- 该同一 iMessage 对话中的后续消息会路由到生成的 ACP 会话。
- `/new` 和 `/reset` 会就地重置同一个已绑定 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

通过顶层 `bindings[]` 条目支持配置的持久绑定，其中 `type: "acp"` 且 `match.channel: "imessage"`。

`match.peer.id` 可以使用：

- 规范化的私信 handle，例如 `+15555550123` 或 `user@example.com`
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

参见 [ACP Agents](/zh-CN/tools/acp-agents) 了解共享 ACP 绑定行为。

## 部署模式

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    使用专用 Apple ID 和 macOS 用户，使机器人流量与你的个人 Messages 资料隔离。

    典型流程：

    1. 创建/登录专用 macOS 用户。
    2. 在该用户中使用机器人 Apple ID 登录 Messages。
    3. 在该用户中安装 `imsg`。
    4. 创建 SSH 包装器，使 OpenClaw 能在该用户上下文中运行 `imsg`。
    5. 将 `channels.imessage.accounts.<id>.cliPath` 和 `.dbPath` 指向该用户资料。

    首次运行可能需要在该机器人用户会话中进行 GUI 审批（自动化 + 完全磁盘访问）。

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    常见拓扑：

    - Gateway 网关运行在 Linux/VM 上
    - iMessage + `imsg` 运行在你的 tailnet 中的一台 Mac 上
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

    使用 SSH 密钥，使 SSH 和 SCP 都无需交互。
    先确保主机密钥受信任（例如 `ssh bot@mac-mini.tailnet-1234.ts.net`），以便填充 `known_hosts`。

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage 支持在 `channels.imessage.accounts` 下配置每个账号。

    每个账号都可以覆盖 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、历史设置以及附件根允许列表等字段。

  </Accordion>

  <Accordion title="Direct-message history">
    设置 `channels.imessage.dmHistoryLimit`，用该对话最近解码的 `imsg` 历史为新的直接消息会话做种子。使用 `channels.imessage.dms["<sender>"].historyLimit` 进行按发送者覆盖，包括设置为 `0` 以禁用某个发送者的历史。

    iMessage 私信历史会按需从 `imsg` 获取。未设置 `dmHistoryLimit` 会禁用全局私信历史种子，但正数的按发送者 `channels.imessage.dms["<sender>"].historyLimit` 仍会为该发送者启用种子。

  </Accordion>
</AccordionGroup>

## 媒体、分块和投递目标

<AccordionGroup>
  <Accordion title="附件和媒体">
    - 入站附件摄取默认**关闭**，设置 `channels.imessage.includeAttachments: true` 可将照片、语音备忘录、视频和其他附件转发给智能体。禁用时，仅含附件的 iMessage 会在到达智能体之前被丢弃，并且可能完全不会产生 `Inbound message` 日志行。
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
    首选显式目标：

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

当 `imsg launch` 正在运行，且 `openclaw channels status --probe` 报告 `privateApi.available: true` 时，消息工具除了正常发送文本外，还可以使用 iMessage 原生操作。

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
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="可用操作">
    - **react**：添加/移除 iMessage Tapback（`messageId`、`emoji`、`remove`）。支持的 Tapback 映射到 love、like、dislike、laugh、emphasize 和 question。
    - **reply**：向现有消息发送线程回复（`messageId`、`text` 或 `message`，以及 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。
    - **sendWithEffect**：发送带有 iMessage 效果的文本（`text` 或 `message`，`effect` 或 `effectId`）。
    - **edit**：在受支持的 macOS/私有 API 版本上编辑已发送消息（`messageId`、`text` 或 `newText`）。
    - **unsend**：在受支持的 macOS/私有 API 版本上撤回已发送消息（`messageId`）。
    - **upload-file**：发送媒体/文件（作为 base64 的 `buffer`，或已补全的 `media`/`path`/`filePath`，`filename`，可选 `asVoice`）。旧版别名：`sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**：当当前目标是群组对话时管理群组聊天。
    - **poll**：创建原生 Apple Messages 投票（`pollQuestion`，重复 2 到 12 次的 `pollOption`，以及 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。iOS/iPadOS/macOS 26+ 上的接收者可原生查看并投票；较旧 OS 版本会收到 “Sent a poll” 文本回退。需要 `selectors.pollPayloadMessage`。
    - **poll-vote**：对现有投票投票（`pollId` 或 `messageId`，并且只提供 `pollOptionIndex`、`pollOptionId` 或 `pollOptionText` 中的一个）。需要 `selectors.pollVoteMessage` 和 `poll.vote` RPC 方法。

    已接受的入站投票会为智能体渲染为问题、编号选项标签、票数，以及 `poll-vote` 所需的投票消息 ID。

  </Accordion>

  <Accordion title="消息 ID">
    入站 iMessage 上下文在可用时会同时包含短 `MessageSid` 值和完整消息 GUID。短 ID 的作用域限定在近期的 SQLite 支持回复缓存内，使用前会与当前聊天核对。如果短 ID 已过期或属于另一个聊天，请改用完整的 `MessageSidFull` 重试。

  </Accordion>

  <Accordion title="能力检测">
    只有当缓存的探测状态显示桥接不可用时，OpenClaw 才会隐藏私有 API 操作。如果状态未知，操作会保持可见并延迟调度探测，因此在 `imsg launch` 后，第一个操作无需单独手动刷新状态也可以成功。

  </Accordion>

  <Accordion title="已读回执和正在输入">
    当私有 API 桥接启动后，已接受的入站聊天会被标记为已读；对于直接聊天，一旦轮次被接受，就会显示正在输入气泡，同时智能体准备上下文并生成回复。使用以下配置禁用已读标记：

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    早于按方法能力列表的旧版 `imsg` 构建会静默关闭正在输入/已读；OpenClaw 会在每次重启后记录一次性警告，以便将缺失回执归因清楚。

  </Accordion>

  <Accordion title="入站 Tapback">
    OpenClaw 订阅 iMessage Tapback，并将已接受的回应作为系统事件路由，而不是作为普通消息文本，因此用户的 Tapback 不会触发普通回复循环。

    通知模式由 `channels.imessage.reactionNotifications` 控制：

    - `"own"`（默认）：仅当用户回应机器人编写的消息时通知。
    - `"all"`：对来自已授权发送者的所有入站 Tapback 发出通知。
    - `"off"`：忽略入站 Tapback。

    按账户覆盖使用 `channels.imessage.accounts.<id>.reactionNotifications`。

  </Accordion>

  <Accordion title="审批回应（👍 / 👎）">
    当 `approvals.exec.enabled` 或 `approvals.plugin.enabled` 为 true，且请求路由到 iMessage 时，Gateway 网关会原生发送审批提示，并接受 Tapback 来完成处理：

    - `👍`（Like Tapback）→ `allow-once`
    - `👎`（Dislike Tapback）→ `deny`
    - `allow-always` 保留为手动回退：以常规回复发送 `/approve <id> allow-always`。

    回应处理要求做出回应的用户句柄是显式审批人。审批人列表从 `channels.imessage.allowFrom`（或 `channels.imessage.accounts.<id>.allowFrom`）读取；请添加用户的 E.164 格式电话号码或其 Apple ID 邮箱。通配符条目 `"*"` 会被接受，但允许任何发送者审批。回应快捷方式会有意绕过 `reactionNotifications`、`dmPolicy` 和 `groupAllowFrom`，因为显式审批人允许列表是审批处理唯一相关的门控。

    **此版本的行为变更：**当 `channels.imessage.allowFrom` 非空时，`/approve <id> <decision>` 文本命令现在会根据该审批人列表授权（而不是更宽泛的私信允许列表）。被私信允许列表允许但不在 `allowFrom` 中的发送者会收到明确拒绝。请将每个应能通过 `/approve`（以及通过回应）审批的操作员添加到 `allowFrom`，以保留以前的行为。当 `allowFrom` 为空时，旧版“同聊天回退”仍然生效，`/approve` 会继续授权私信允许列表允许的任何人。

    操作员说明：
    - 回应绑定会同时存储在内存中（TTL 与审批过期时间匹配）和 Gateway 网关的持久化键值存储中，因此在 Gateway 网关重启后不久到达的 Tapback 仍然可以完成审批。
    - 跨设备 `is_from_me=true` Tapback（操作员在已配对 Apple 设备上的本人回应）会被有意忽略，因此机器人无法自我审批。
    - 旧版文本样式 Tapback（非常旧的 Apple 客户端发出的 `Liked "…"` 纯文本）无法完成审批，因为它们不携带消息 GUID；回应处理需要当前 macOS / iOS 客户端发出的结构化 Tapback 元数据。

  </Accordion>
</AccordionGroup>

## 配置写入

iMessage 默认允许频道发起的配置写入（当 `commands.config: true` 时用于 `/config set|unset`）。

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

## 合并拆分发送的私信（一次撰写中的命令 + URL）

当用户同时输入命令和 URL，例如 `Dump https://example.com/article`，Apple 的 Messages 应用会将发送拆分为**两条单独的 `chat.db` 行**：

1. 文本消息（`"Dump"`）。
2. 带有 OG 预览图片作为附件的 URL 预览气泡（`"https://..."`）。

在大多数设置中，这两行会相隔约 0.8-2.0 秒到达 OpenClaw。如果没有合并，智能体会在第 1 个轮次只收到命令并回复（通常是“把 URL 发给我”），而只在第 2 个轮次看到 URL，此时命令上下文已经丢失。这是 Apple 的发送管线造成的，不是 OpenClaw 或 `imsg` 引入的行为。

`channels.imessage.coalesceSameSenderDms` 让某个私信进入缓冲连续同发送者行的模式。当 `imsg` 在某个源行上暴露结构化 URL 预览标记 `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` 时，OpenClaw 只会合并那个真实的拆分发送，并将其他任何已缓冲行保留为单独轮次。在完全不发出气泡元数据的较旧 `imsg` 构建上，OpenClaw 无法区分拆分发送和单独发送，因此会回退为合并整个桶。这样会保留元数据之前的行为，而不是将 `Dump <url>` 拆分发送回退成两个轮次。群组聊天继续按消息分发，以保留多用户轮次结构。

<Tabs>
  <Tab title="何时启用">
    在以下情况下启用：

    - 你发布的 Skills 预期在一条消息中接收 `command + payload`（dump、paste、save、queue 等）。
    - 你的用户会在命令旁粘贴 URL。
    - 你可以接受增加的私信轮次延迟（见下文）。

    在以下情况下保持禁用：

    - 你需要单词私信触发器的最低命令延迟。
    - 你的所有流程都是没有载荷后续的单次命令。

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

    启用该标志且没有显式设置 `messages.inbound.byChannel.imessage` 或全局 `messages.inbound.debounceMs` 时，防抖窗口会扩大到 **7000 ms**（旧版默认值为 0 ms，即不防抖）。需要更宽的窗口，是因为 Apple 的 URL 预览拆分发送节奏可能拉长到数秒，同时 Messages.app 会发出预览行。

    要自行调整窗口：

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="权衡">
    - **精确合并需要当前的 `imsg` 负载元数据。** 当 URL 行包含 `balloon_bundle_id` 时，只有那次真实的拆分发送会被合并，其他缓冲行会保持分离。在较旧的 `imsg` 构建中，如果没有暴露气泡元数据，OpenClaw 会回退为合并缓冲桶，这样 `Dump <url>` 拆分发送就不会退化成两个轮次（临时向后兼容，等 `imsg` 在上游合并拆分发送后移除）。
    - **私信消息会增加延迟。** 开启该标志后，每条私信（包括独立控制命令和单文本后续消息）都会在分发前最多等待一个防抖窗口，以防 URL 预览行即将到来。群聊消息仍会即时分发。
    - **合并输出有边界。** 合并文本上限为 4000 个字符，并带有显式 `…[truncated]` 标记；附件上限为 20 个；来源条目上限为 10 个（超出后保留第一个和最新的条目）。每个来源 GUID 都会记录在 `coalescedMessageGuids` 中，用于下游遥测。
    - **仅限私信。** 群聊会退回到逐消息分发，因此多人同时输入时 Bot 仍能保持响应。
    - **选择加入，按渠道配置。** 其他渠道（Telegram、WhatsApp、Slack、…）不受影响。设置了 `channels.bluebubbles.coalesceSameSenderDms` 的旧版 BlueBubbles 配置应将该值迁移到 `channels.imessage.coalesceSameSenderDms`。

  </Tab>
</Tabs>

### 场景和智能体看到的内容

“开启标志”列展示的是在会发出 `balloon_bundle_id` 的 `imsg` 构建上的行为。在完全不发出气泡元数据的较旧 `imsg` 构建上，下方标记为“两个轮次”/“N 个轮次”的行会改为回退到旧版合并（一个轮次）：OpenClaw 无法从结构上区分拆分发送和独立发送，因此会保留元数据之前的合并行为。构建开始发出气泡元数据后，精确分离就会启用。

| 用户编写的内容                                                       | `chat.db` 生成的内容                 | 关闭标志（默认）                        | 开启标志 + 窗口（imsg 发出气泡元数据）                                                            |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com`（一次发送）                              | 2 行，相隔约 1 秒                   | 两个智能体轮次：“Dump” 单独一次，然后是 URL | 一个轮次：合并文本 `Dump https://example.com`                                                       |
| `Save this 📎image.jpg caption`（附件 + 文本）                      | 2 行，没有 URL 气泡元数据           | 两个轮次                                | 观察到元数据后为两个轮次；旧版/预锁存且无元数据的会话中为一个合并轮次                              |
| `/status`（独立命令）                                               | 1 行                                | 即时分发                                | **最多等待窗口时间，然后分发**                                                                      |
| 单独粘贴 URL                                                        | 1 行                                | 即时分发                                | 最多等待窗口时间，然后分发                                                                          |
| 文本 + URL 作为两条有意分开发送的消息，间隔数分钟                   | 2 行，在窗口之外                    | 两个轮次                                | 两个轮次（窗口在两者之间过期）                                                                      |
| 快速刷屏（窗口内 >10 条小私信）                                     | N 行，没有 URL 气泡元数据           | N 个轮次                                | 观察到元数据后为 N 个轮次；旧版/预锁存且无元数据的会话中为一个有界合并轮次                          |
| 两个人在群聊中输入                                                  | 来自 M 个发送者的 N 行              | M+ 个轮次（每个发送者桶一个）           | M+ 个轮次 — 群聊不会被合并                                                                          |

## 网桥或 Gateway 网关重启后的入站恢复

iMessage 会恢复 Gateway 网关停机期间错过的消息，同时抑制 Apple 在 Push 恢复后可能刷出的过期“积压炸弹”。默认行为始终开启，构建在入站去重之上。

- **重放去重。** 每条已分发的入站消息都会按其 Apple GUID 记录到持久化插件状态（`imessage.inbound-dedupe`）中，在摄取时声明，并在处理后提交（瞬时失败时释放，以便重试）。任何已处理的消息都会被丢弃，而不是重复分发。正是这一点让恢复可以积极重放，而无需逐消息记账。
- **停机恢复。** 启动时，监视器会记住最后一次分发的 `chat.db` rowid（一个持久化的按账号游标），并将其作为 `since_rowid` 传给 `imsg watch.subscribe`，因此 imsg 会重放 Gateway 网关停机期间到达的行，然后跟踪实时消息。重放会限制在最近的行，以及最多约 2 小时内的消息；去重会丢弃任何已处理内容。
- **过期积压年龄栅栏。** 启动边界之上的行是真正的实时内容；如果某行的发送日期比其到达时间早超过约 15 分钟，它就是 Push 刷出的积压内容，会被抑制。重放行（位于边界或其下）改用更宽的恢复窗口，因此最近错过的消息会被送达，而久远历史不会。

恢复可同时用于本地和远程 `cliPath` 设置，因为 `since_rowid` 重放运行在同一个 `imsg` RPC 连接上。区别在于窗口：当 Gateway 网关可以读取 `chat.db`（本地）时，它会锚定启动 rowid 边界，限制重放跨度，并送达最多几小时前错过的消息。通过远程 SSH `cliPath` 时，它无法读取数据库，因此重放不设上限，且每一行都使用实时年龄栅栏 — 它仍会恢复最近错过的消息，也仍会抑制旧积压，只是使用更窄的实时窗口。请在运行 Messages 的 Mac 上运行 Gateway 网关，以获得更宽的恢复窗口。

### 操作者可见信号

被抑制的积压会以默认级别记录日志，绝不会静默丢弃（`recovery` 标志显示应用了哪个窗口）：

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### 迁移

`channels.imessage.catchup.*` 已弃用 — 停机恢复现在是自动的，新设置无需配置。带有 `catchup.enabled: true` 的现有配置仍会作为恢复重放窗口的兼容性配置文件被遵循。已禁用的 catchup 块（`enabled: false` 或没有 `enabled: true`）已退役；`openclaw doctor --fix` 会移除它们。

## 故障排除

<AccordionGroup>
  <Accordion title="找不到 imsg 或 RPC 不受支持">
    验证二进制文件和 RPC 支持：

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    如果探测报告 RPC 不受支持，请更新 `imsg`。如果私有 API 操作不可用，请在已登录的 macOS 用户会话中运行 `imsg launch`，然后再次探测。如果 Gateway 网关没有在 macOS 上运行，请改用上面的通过 SSH 连接远程 Mac 设置，而不是默认的本地 `imsg` 路径。

  </Accordion>

  <Accordion title="消息可以发送，但入站 iMessage 未到达">
    先证明消息是否到达了本地 Mac。如果 `chat.db` 没有变化，即使 `imsg status --json` 报告网桥健康，OpenClaw 也无法接收该消息。

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    如果手机发送的消息没有创建新行，请先修复 macOS Messages 和 Apple Push 层，再更改 OpenClaw 配置。一次性服务刷新通常就足够：

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    从手机发送一条新的 iMessage，并在调试 OpenClaw 会话之前确认出现新的 `chat.db` 行或 `imsg watch` 事件。不要把这作为周期性网桥重启循环来运行；在活跃工作期间反复执行 `imsg launch` 加 Gateway 网关重启可能会中断投递，并让正在进行的渠道运行滞留。

  </Accordion>

  <Accordion title="Gateway 网关未在 macOS 上运行">
    默认的 `cliPath: "imsg"` 必须在已登录 Messages 的 Mac 上运行。在 Linux 或 Windows 上，请将 `channels.imessage.cliPath` 设置为一个包装脚本，该脚本通过 SSH 连接到那台 Mac 并运行 `imsg "$@"`。

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
    - 从 Gateway 网关主机发起的 SSH/SCP 密钥认证
    - Gateway 网关主机上的 `~/.ssh/known_hosts` 中存在主机密钥
    - 运行 Messages 的 Mac 上远程路径的可读性

  </Accordion>

  <Accordion title="错过了 macOS 权限提示">
    在同一用户/会话上下文的交互式 GUI 终端中重新运行并批准提示：

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    确认运行 OpenClaw/`imsg` 的进程上下文已授予完整磁盘访问权限 + 自动化权限。

  </Accordion>
</AccordionGroup>

## 配置参考指针

- [Configuration reference - iMessage](/zh-CN/gateway/config-channels#imessage)
- [Gateway 网关配置](/zh-CN/gateway/configuration)
- [配对](/zh-CN/channels/pairing)

## 相关

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage) — 公告和迁移摘要
- [Coming from BlueBubbles](/zh-CN/channels/imessage-from-bluebubbles) — 配置转换表和分步切换流程
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固
