---
read_when:
    - 设置 iMessage 支持
    - 调试 iMessage 发送/接收
summary: 通过 imsg（基于 stdio 的 JSON-RPC）原生支持 iMessage，并提供用于回复、tapbacks、特效、投票、附件和群组管理的私有 API 操作。当主机要求匹配时，这是新的 OpenClaw iMessage 设置的首选方案。
title: iMessage
x-i18n:
    generated_at: "2026-07-05T17:39:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f4932ab612ce9ef8542e030962f64b828a633167654a0dfe09561aff543cc96
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
对于 OpenClaw iMessage 部署，请在已登录的 macOS Messages 主机上使用 `imsg`。如果你的 Gateway 网关运行在 Linux 或 Windows 上，请将 `channels.imessage.cliPath` 指向一个 SSH 包装器，由它在 Mac 上运行 `imsg`。

**入站恢复是自动的。** 在 bridge 或 Gateway 网关重启后，iMessage 会重放停机期间错过的消息，并抑制 Apple 在 Push 恢复后可能刷出的陈旧“积压消息炸弹”，同时去重，确保不会重复分发任何内容。无需配置启用 — 请参阅[bridge 或 Gateway 网关重启后的入站恢复](#inbound-recovery-after-a-bridge-or-gateway-restart)。
</Note>

<Warning>
BlueBubbles 支持已移除。请将 `channels.bluebubbles` 配置迁移到 `channels.imessage`；OpenClaw 仅通过 `imsg` 支持 iMessage。短公告请先阅读 [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage)，完整迁移表请阅读 [Coming from BlueBubbles](/zh-CN/channels/imessage-from-bluebubbles)。
</Warning>

状态：原生外部 CLI 集成。Gateway 网关会启动 `imsg rpc`，并通过 stdio 使用 JSON-RPC 通信 — 无需单独的 daemon 或端口。高级操作需要 `imsg launch` 和成功的私有 API 探测。

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    回复、tapback、效果、投票、附件和群组管理。
  </Card>
  <Card title="Pairing" icon="link" href="/zh-CN/channels/pairing">
    iMessage 私信默认使用配对模式。
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    当 Gateway 网关未运行在 Messages Mac 上时，请使用 SSH 包装器。
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
    OpenClaw 只需要一个兼容 stdio 的 `cliPath`，因此你可以将 `cliPath` 指向一个包装脚本，由它通过 SSH 连接到远程 Mac 并运行 `imsg`。

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    启用附件时推荐的配置：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: extra allowed attachment roots (merged with the default
      // /Users/*/Library/Messages/Attachments).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    如果未设置 `remoteHost`，OpenClaw 会尝试通过解析 SSH 包装脚本自动检测它。
    `remoteHost` 必须是 `host` 或 `user@host`（不能包含空格或 SSH 选项）；不安全的值会被忽略。
    OpenClaw 对 SCP 使用严格的主机密钥检查，因此中继主机密钥必须已经存在于 `~/.ssh/known_hosts` 中。
    附件路径会根据允许的根目录（`attachmentRoots` / `remoteAttachmentRoots`）进行验证。

<Warning>
你放在 `imsg` 前面的任何 `cliPath` 包装器或 SSH 代理都必须像透明的 stdio 管道一样处理长生命周期 JSON-RPC。OpenClaw 会在该渠道的整个生命周期内，通过包装器的 stdin/stdout 交换小型换行分帧 JSON-RPC 消息：

- 一旦有字节可用，就**立即**转发每个 stdin 块/行 — 不要等待 EOF。
- 及时反向转发每个 stdout 块/行。
- 保留换行符。
- 避免固定大小的阻塞读取（`read(4096)`、`cat | buffer`、默认 shell `read`），它们可能会饿死小帧。
- 保持 stderr 与 JSON-RPC stdout 流分离。

如果包装器一直缓冲 stdin，直到填满大块才发送，会产生看起来像 iMessage 中断的症状 — `imsg rpc timeout (chats.list)` 或反复重启渠道 — 即使 `imsg rpc` 本身是正常的。上面的 `ssh -T host imsg "$@"` 是安全的，因为它会转发 OpenClaw 的 `cliPath` 参数，例如 `rpc` 和 `--db`。像 `ssh host imsg | grep -v '^DEBUG'` 这样的管道并不安全 — 按行缓冲的工具仍可能卡住帧；如果必须过滤，请在每个阶段使用 `stdbuf -oL -eL`。
</Warning>

  </Tab>
</Tabs>

## 要求和权限（macOS）

- Messages 必须在运行 `imsg` 的 Mac 上登录。
- 运行 OpenClaw/`imsg` 的进程上下文需要 Full Disk Access（用于访问 Messages DB）。
- 通过 Messages.app 发送消息需要 Automation 权限。
- 对于高级操作（react / edit / unsend / threaded reply / effects / polls / group ops），必须禁用 System Integrity Protection — 请参阅[启用 imsg 私有 API](#enabling-the-imsg-private-api)。基础文本和媒体收发不需要禁用它。

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

检查已登录 Mac 用户的 TCC 数据库，或 System Settings > Privacy & Security > Automation。如果 Automation 条目记录的是 `/usr/libexec/sshd-keygen-wrapper`，而不是 `imsg` 或本地 shell 进程，macOS 可能不会为该 SSH 服务器端客户端显示可用的 Messages 开关：

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

在这种状态下，反复执行 `tccutil reset AppleEvents` 或通过同一个 SSH 包装器重新运行 `imsg send` 可能仍会失败，因为需要 Messages Automation 的进程上下文是 SSH 包装器，而不是 UI 可以授权的应用。

请改用受支持的 `imsg` 进程上下文之一：

- 在已登录 Messages 用户的本地会话中运行 Gateway 网关，或至少运行 `imsg` bridge。
- 在同一会话中授予 Full Disk Access 和 Automation 后，为该用户使用 LaunchAgent 启动 Gateway 网关。
- 如果保留双用户 SSH 拓扑，请在启用渠道前验证真正的出站 `imsg send` 能通过完全相同的包装器成功。如果无法授予 Automation，请改为重新配置为单用户 `imsg` 设置，而不是依赖 SSH 包装器进行发送。

</Accordion>

## 启用 imsg 私有 API

`imsg` 提供两种运行模式：

- **基础模式**（默认，无需更改 SIP）：通过 `send` 发送出站文本和媒体，入站 watch/history，聊天列表。这是全新 `brew install steipete/tap/imsg` 加上上面标准 macOS 权限后即可获得的模式。
- **私有 API 模式**：`imsg` 将辅助 dylib 注入 `Messages.app`，以调用内部 `IMCore` 函数。这会解锁 `react`、`edit`、`unsend`、`reply`（threaded）、`sendWithEffect`、`poll` 和 `poll-vote`（原生 Messages 投票）、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`，以及正在输入指示和已读回执。

本页上的高级操作面需要私有 API 模式。`imsg` README 明确说明了该要求：

> 高级功能，例如 `read`、`typing`、`launch`、bridge 支持的富发送、消息变更和聊天管理，都是选择启用的。它们要求禁用 SIP，并将辅助 dylib 注入 `Messages.app`。当 SIP 启用时，`imsg launch` 会拒绝注入。

该辅助注入技术使用 `imsg` 自身的 dylib 访问 Messages 私有 API。OpenClaw iMessage 路径中没有第三方服务器或 BlueBubbles 运行时。

<Warning>
**禁用 SIP 是真实的安全权衡。** SIP 是 macOS 防止运行被修改系统代码的核心保护之一；在系统范围内关闭它会带来额外攻击面和副作用。特别是，**在 Apple Silicon Mac 上禁用 SIP 还会禁用在你的 Mac 上安装和运行 iOS 应用的能力**。

请将其视为有意的运维选择，而不是默认选项。如果你的威胁模型无法容忍关闭 SIP，内置 iMessage 将仅限于基础模式 — 只能收发文本和媒体，没有 reaction / edit / unsend / effects / group ops。
</Warning>

### 设置

1. 在运行 Messages.app 的 Mac 上**安装（或升级）`imsg`**：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 输出会报告 `bridge_version`、`rpc_methods` 和按方法列出的 `selectors`，因此你可以在开始前查看当前构建支持什么。

2. **禁用 System Integrity Protection，并且（在现代 macOS 上）禁用 Library Validation。** 将非 Apple 辅助 dylib 注入 Apple 签名的 `Messages.app` 需要关闭 SIP，**并且**放宽 library validation。Recovery 模式下的 SIP 步骤因 macOS 版本而异：
   - **macOS 10.13-10.15（Sierra-Catalina）：** 通过 Terminal 禁用 Library Validation，重启到 Recovery Mode，运行 `csrutil disable`，然后重启。
   - **macOS 11+（Big Sur 及更高版本），Intel：** 进入 Recovery Mode（或 Internet Recovery），运行 `csrutil disable`，然后重启。
   - **macOS 11+，Apple Silicon：** 使用电源按钮启动流程进入 Recovery；在近期 macOS 版本中，点击 Continue 时按住**左 Shift** 键，然后运行 `csrutil disable`。虚拟机设置遵循单独流程，因此请先创建 VM 快照。

   **在 macOS 11 及更高版本上，仅运行 `csrutil disable` 通常不够。** Apple 仍会把 `Messages.app` 作为平台二进制文件强制执行 library validation，因此即使 SIP 关闭，adhoc 签名的辅助程序也会被拒绝（`Library Validation failed: ... platform binary, but mapped file is not`）。禁用 SIP 后，还要禁用 library validation 并重启：

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26（Tahoe），已在 26.5.1 验证：** 关闭 SIP **加上**上面的 `DisableLibraryValidation` 命令，足以在 26.0 到 26.5.x 中注入辅助程序。**不需要 boot-args。** 该 plist 是决定性因素，也是 Tahoe 上注入失败时最常漏掉的步骤：
   - **有该 plist：** `imsg launch` 会注入，且 `imsg status` 会报告 `advanced_features: true`。
   - **没有该 plist（即使 SIP 关闭）：** `imsg launch` 会失败并显示 `Failed to launch: Timeout waiting for Messages.app to initialize`。AMFI 在加载时拒绝 adhoc 辅助程序，因此 bridge 永远无法就绪，launch 最终超时。这个超时是大多数人在 Tahoe 上遇到的症状；修复方法是上面的 plist，而不是采取更激进的措施。

   如果 macOS 升级后 `imsg launch` 注入或特定 `selectors` 开始返回 false，此门槛通常就是原因。请先检查 SIP 和 library-validation 状态，再假设 SIP 步骤本身失败。如果这些设置正确但 bridge 仍无法注入，请收集 `imsg status --json` 和 `imsg launch` 输出，并报告给 `imsg` 项目，而不是削弱更多系统范围的安全控制。

3. **注入 helper。** 在 SIP 已禁用且 Messages.app 已登录的情况下：

   ```bash
   imsg launch
   ```

   当 SIP 仍处于启用状态时，`imsg launch` 会拒绝注入，因此这也可以作为第 2 步已生效的确认。

4. **从 OpenClaw 验证 bridge：**

   ```bash
   openclaw channels status --probe
   ```

   iMessage 条目应报告 `works`，并且 `imsg status --json | jq '{rpc_methods, selectors}'` 应显示你的 macOS 构建暴露的能力。创建投票需要 `selectors.pollPayloadMessage`；投票需要同时具备 `selectors.pollVoteMessage` 和 `poll.vote` RPC 方法。OpenClaw 插件只通告缓存探测支持的操作，而空缓存会保持乐观，并在首次分发时探测。

如果 `openclaw channels status --probe` 报告该渠道为 `works`，但特定操作在分发时抛出 “iMessage `<action>` requires the imsg private API bridge”，请再次运行 `imsg launch`——helper 可能会脱离（Messages.app 重启、OS 更新等），并且缓存的 `available: true` 状态会继续通告操作，直到下一次探测刷新。

### 当 SIP 保持启用时

如果禁用 SIP 不符合你的威胁模型：

- `imsg` 会回退到基础模式——仅支持文本 + 媒体 + 接收。
- OpenClaw 插件仍会通告文本/媒体发送和入站监控；它会从操作表面隐藏 `react`、`edit`、`unsend`、`reply`、`sendWithEffect` 和群组操作（按照逐方法能力门控）。
- 你可以运行一台单独的非 Apple-Silicon Mac（或专用 bot Mac），为 iMessage 工作负载关闭 SIP，同时在你的主设备上保持 SIP 启用。请参阅下方的 [Dedicated bot macOS user (separate iMessage identity)](#deployment-patterns)。

## 访问控制和路由

<Tabs>
  <Tab title="私信策略">
    `channels.imessage.dmPolicy` 控制私信：

    - `pairing`（默认）
    - `allowlist`（需要至少一个 `allowFrom` 条目）
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    允许列表字段：`channels.imessage.allowFrom`。

    允许列表条目必须标识发送者：handle 或静态发送者访问组（`accessGroup:<name>`）。对 `chat_id:*`、`chat_guid:*` 或 `chat_identifier:*` 等聊天目标使用 `channels.imessage.groupAllowFrom`；对数字 `chat_id` 注册表键使用 `channels.imessage.groups`。

  </Tab>

  <Tab title="群组策略 + 提及">
    `channels.imessage.groupPolicy` 控制群组处理：

    - `allowlist`（默认）
    - `open`
    - `disabled`

    群组发送者允许列表：`channels.imessage.groupAllowFrom`。

    `groupAllowFrom` 条目也可以引用静态发送者访问组（`accessGroup:<name>`）。

    运行时回退：如果未设置 `groupAllowFrom`，iMessage 群组发送者检查会使用 `allowFrom`；当私信和群组准入应不同时，请设置 `groupAllowFrom`。显式为空的 `groupAllowFrom: []` 不会回退——它会在 `allowlist` 下阻止所有群组发送者。
    运行时说明：如果完全缺少 `channels.imessage`，运行时会回退到 `groupPolicy="allowlist"` 并记录警告（即使已设置 `channels.defaults.groupPolicy`）。

    <Warning>
    `groupPolicy: "allowlist"` 下的群组路由会连续运行**两个**门控：

    1. **发送者允许列表**（`channels.imessage.groupAllowFrom`）——handle、`accessGroup:<name>`、`chat_guid`、`chat_identifier` 或 `chat_id`。有效列表为空（没有 `groupAllowFrom` 且没有 `allowFrom` 回退）会阻止每个群组发送者。
    2. **群组注册表**（`channels.imessage.groups`）——一旦映射中有条目就会强制执行：聊天必须匹配显式的逐 `chat_id` 条目，或 `groups: { "*": { ... } }` 通配符。当 `groups` 为空或缺失时，仅由发送者允许列表决定准入。

    如果没有配置有效的群组发送者允许列表，每条群组消息都会在注册表门控前被丢弃。每个门控在默认日志级别都有自己的 `warn` 级别信号，并且各自给出不同修复方式：

    - 启动时每个账户一次，当有效群组发送者允许列表为空时：`imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`——通过设置 `channels.imessage.groupAllowFrom`（或 `allowFrom`）修复；仅添加 `groups` 条目会让门控 1 继续阻止每个发送者。
    - 运行时每个 `chat_id` 一次，当发送者通过门控 1 但聊天缺失于已填充的 `groups` 注册表时：`imessage: dropping group message from chat_id=<id> ...`——通过在 `channels.imessage.groups` 下添加该 `chat_id`（或 `"*"`）修复。

    私信不受影响——它们走不同的代码路径。

    `groupPolicy: "allowlist"` 下群组流程的推荐配置：

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

    仅 `groupAllowFrom` 就会允许这些发送者进入任何群组；添加 `groups` 块可限定允许哪些聊天（并设置逐聊天选项，例如 `requireMention`）。
    </Warning>

    群组提及门控：

    - iMessage 没有原生提及元数据
    - 提及检测使用正则表达式模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 未配置模式时，无法强制执行提及门控
    - 来自已授权发送者的控制命令会绕过提及门控

    逐群组 `systemPrompt`：

    `channels.imessage.groups.*` 下的每个条目都接受可选的 `systemPrompt` 字符串，该字符串会在处理该群组中消息的每个轮次注入到智能体的系统提示中。解析方式与 `channels.whatsapp.groups` 一致：

    1. **群组特定系统提示**（`groups["<chat_id>"].systemPrompt`）：当映射中存在特定群组条目**且**其 `systemPrompt` 键已定义时使用。如果 `systemPrompt` 是空字符串（`""`），则会抑制通配符，并且不会向该群组应用系统提示。
    2. **群组通配符系统提示**（`groups["*"].systemPrompt`）：当映射中完全不存在特定群组条目，或该条目存在但未定义 `systemPrompt` 键时使用。

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

    逐群组提示仅适用于群组消息——私信不受影响。

  </Tab>

  <Tab title="会话和确定性回复">
    - 私信使用直接路由；群组使用群组路由。
    - 使用默认 `session.dmScope=main` 时，iMessage 私信会折叠到智能体主会话中。
    - 群组会话是隔离的（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回复会使用来源渠道/目标元数据路由回 iMessage。

    类群组线程行为：

    某些多参与者 iMessage 线程可能以 `is_group=false` 到达。
    如果该 `chat_id` 已在 `channels.imessage.groups` 下显式配置，OpenClaw 会将其视为群组流量（群组门控 + 群组会话隔离）。

  </Tab>
</Tabs>

## ACP 对话绑定

iMessage 聊天可以绑定到 ACP 会话。

快速操作员流程：

- 在私信或允许的群组聊天中运行 `/acp spawn codex --bind here`。
- 同一 iMessage 对话中的未来消息会路由到已生成的 ACP 会话。
- `/new` 和 `/reset` 会在原处重置同一个已绑定 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

已配置的持久绑定使用顶层 `bindings[]` 条目，并带有 `type: "acp"` 和 `match.channel: "imessage"`。

`match.peer.id` 可以使用：

- 规范化的私信 handle，例如 `+15555550123` 或 `user@example.com`
- `chat_id:<id>`（推荐用于稳定群组绑定）
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

有关共享 ACP 绑定行为，请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

## 部署模式

<AccordionGroup>
  <Accordion title="专用 bot macOS 用户（单独的 iMessage 身份）">
    使用专用 Apple ID 和 macOS 用户，使 bot 流量与你的个人 Messages 资料隔离。

    典型流程：

    1. 创建/登录专用 macOS 用户。
    2. 在该用户中使用 bot Apple ID 登录 Messages。
    3. 在该用户中安装 `imsg`。
    4. 创建 SSH wrapper，使 OpenClaw 可以在该用户上下文中运行 `imsg`。
    5. 将 `channels.imessage.accounts.<id>.cliPath` 和 `.dbPath` 指向该用户资料。

    首次运行可能需要在该 bot 用户会话中进行 GUI 审批（Automation + Full Disk Access）。

  </Accordion>

  <Accordion title="通过 Tailscale 访问远程 Mac（示例）">
    常见拓扑：

    - Gateway 网关运行在 Linux/VM 上
    - iMessage + `imsg` 运行在你的 tailnet 中的一台 Mac 上
    - `cliPath` wrapper 使用 SSH 运行 `imsg`
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

    使用 SSH 密钥，使 SSH 和 SCP 都是非交互式。
    请先确保主机密钥受信任（例如 `ssh bot@mac-mini.tailnet-1234.ts.net`），以便填充 `known_hosts`。

  </Accordion>

  <Accordion title="多账户模式">
    iMessage 支持 `channels.imessage.accounts` 下的逐账户配置。

    每个账户都可以覆盖 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、历史设置和附件根允许列表等字段。

  </Accordion>

  <Accordion title="私信历史">
    设置 `channels.imessage.dmHistoryLimit`，用该对话最近解码的 `imsg` 历史为新的私信会话播种。使用 `channels.imessage.dms["<sender>"].historyLimit` 进行逐发送者覆盖，包括设为 `0` 以禁用某个发送者的历史。

    iMessage 私信历史会按需从 `imsg` 获取。未设置 `dmHistoryLimit` 会禁用全局私信历史播种，但正数的逐发送者 `channels.imessage.dms["<sender>"].historyLimit` 仍会为该发送者启用播种。

  </Accordion>
</AccordionGroup>

## 媒体、分块和投递目标

<AccordionGroup>
  <Accordion title="附件和媒体">
    - 入站附件摄取**默认关闭** — 设置 `channels.imessage.includeAttachments: true`，将照片、语音备忘录、视频和其他附件转发给智能体。禁用时，仅包含附件的 iMessage 会在到达智能体前被丢弃，并且可能完全不会产生 `Inbound message` 日志行。
    - 设置 `remoteHost` 后，可以通过 SCP 获取远程附件路径
    - 附件路径必须匹配允许的根目录：
      - `channels.imessage.attachmentRoots`（本地）
      - `channels.imessage.remoteAttachmentRoots`（远程 SCP 模式）
      - 配置的根目录会扩展默认根目录模式 `/Users/*/Library/Messages/Attachments`（合并，而不是替换）
    - SCP 使用严格主机密钥检查（`StrictHostKeyChecking=yes`）
    - 出站媒体大小使用 `channels.imessage.mediaMaxMb`（默认 16 MB）

  </Accordion>

  <Accordion title="出站文本和分块">
    - 文本分块限制：`channels.imessage.textChunkLimit`（默认 4000）
    - 分块模式：`channels.imessage.chunkMode`
      - `length`（默认）
      - `newline`（优先按段落拆分）
    - 出站 markdown 粗体/斜体/下划线/删除线会转换为原生样式文本（macOS 15+ 接收者会渲染样式；较旧的接收者会看到不带标记的纯文本）；markdown 表格会按该渠道的 markdown 表格模式转换
    - `channels.imessage.sendTransport`（默认 `auto`，`bridge`，`applescript`）选择 `imsg` 如何发送消息

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

当 `imsg launch` 正在运行，并且 `openclaw channels status --probe` 报告 `privateApi.available: true` 时，消息工具除了常规文本发送外，还可以使用 iMessage 原生操作。

所有操作默认启用；使用 `channels.imessage.actions` 关闭单个操作：

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
    - **react**：添加/移除 iMessage tapback（`messageId`、`emoji`、`remove`）。支持的 tapback 映射到爱心、喜欢、不喜欢、大笑、强调和疑问。不带 emoji 移除时，会清除已设置的任意 tapback。
    - **reply**：向现有消息发送线程回复（`messageId`、`text` 或 `message`，以及 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。带附件回复还需要 `send-rich` 支持 `--file` 的 `imsg` 构建。
    - **sendWithEffect**：发送带 iMessage 效果的文本（`text` 或 `message`、`effect` 或 `effectId`）。短名称：slam、loud、gentle、invisibleink、confetti、lasers、fireworks、balloon、heart、echo、happybirthday、shootingstar、sparkles、spotlight。
    - **edit**：在支持的 macOS/私有 API 版本上编辑已发送消息（`messageId`、`text` 或 `newText`）。只能编辑 Gateway 网关自己发送的消息。
    - **unsend**：在支持的 macOS/私有 API 版本上撤回已发送消息（`messageId`）。只能撤回 Gateway 网关自己发送的消息。
    - **upload-file**：发送媒体/文件（`buffer` 为 base64，或已水合的 `media`/`path`/`filePath`、`filename`，可选 `asVoice`）。旧别名：`sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**：当前目标为群组会话时管理群聊。这些操作会修改主机的 Messages 身份，因此需要所有者发送者或 `operator.admin` Gateway 网关客户端。
    - **poll**：创建原生 Apple Messages 投票（`pollQuestion`，`pollOption` 重复 2 到 12 次，以及 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。iOS/iPadOS/macOS 26+ 上的接收者可以原生查看并投票；较旧的 OS 版本会收到 “Sent a poll” 文本降级提示。需要 `selectors.pollPayloadMessage`。
    - **poll-vote**：对现有投票投票（`pollId` 或 `messageId`，以及 `pollOptionIndex`、`pollOptionId` 或 `pollOptionText` 中恰好一个）。需要 `selectors.pollVoteMessage` 和 `poll.vote` RPC 方法。

    已接受的入站投票会呈现给智能体，包含问题、带编号的选项标签、票数，以及 `poll-vote` 所需的投票消息 ID。

  </Accordion>

  <Accordion title="消息 ID">
    入站 iMessage 上下文在可用时同时包含短 `MessageSid` 值和完整消息 GUID（`MessageSidFull`）。短 ID 的作用域限于近期 SQLite 支持的回复缓存，使用前会根据当前聊天进行检查。如果短 ID 已过期或属于另一个聊天，请用完整的 `MessageSidFull` 重试。

  </Accordion>

  <Accordion title="能力检测">
    只有当缓存的探测状态表示桥接不可用时，OpenClaw 才会隐藏私有 API 操作。如果状态未知，操作仍保持可见，并会在派发时延迟探测，因此在 `imsg launch` 后第一个操作无需单独手动刷新状态也可以成功。

  </Accordion>

  <Accordion title="已读回执和正在输入">
    私有 API 桥接启动后，已接受的入站聊天会被标记为已读，并且直接聊天会在轮次被接受后立即显示正在输入气泡，同时智能体准备上下文并生成回复。用以下配置禁用已读标记：

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    早于按方法能力列表的较旧 `imsg` 构建会静默关闭正在输入/已读；OpenClaw 会在每次重启后记录一次性警告，方便归因缺失的回执。

  </Accordion>

  <Accordion title="入站 tapback">
    OpenClaw 订阅 iMessage tapback，并将已接受的表情回应路由为系统事件，而不是普通消息文本，因此用户 tapback 不会触发普通回复循环。

    通知模式由 `channels.imessage.reactionNotifications` 控制：

    - `"own"`（默认）：仅当用户对机器人编写的消息作出表情回应时通知。
    - `"all"`：通知来自授权发送者的所有入站 tapback。
    - `"off"`：忽略入站 tapback。

    按账户覆盖使用 `channels.imessage.accounts.<id>.reactionNotifications`。

  </Accordion>

  <Accordion title="审批表情回应（👍 / 👎）">
    当 `approvals.exec.enabled` 或 `approvals.plugin.enabled` 为 true 且请求路由到 iMessage 时，Gateway 网关会以原生方式发送审批提示，并接受 tapback 来完成审批：

    - `👍`（喜欢 tapback）→ `allow-once`
    - `👎`（不喜欢 tapback）→ `deny`
    - `allow-always` 保留为手动降级方案：以普通回复发送 `/approve <id> allow-always`。

    表情回应处理要求作出回应的用户句柄是显式审批者。审批者列表从 `channels.imessage.allowFrom`（或 `channels.imessage.accounts.<id>.allowFrom`）读取；添加用户的 E.164 格式电话号码或其 Apple ID 邮箱（诸如 `chat_id:*` 的聊天目标不是有效审批者条目）。通配符条目 `"*"` 会生效，但允许任何发送者审批；空审批者列表会完全禁用表情回应快捷方式。表情回应快捷方式会有意绕过 `reactionNotifications`、`dmPolicy` 和 `groupAllowFrom`，因为显式审批者允许列表是审批解析唯一相关的门禁。

    `/approve` 文本命令授权遵循同一列表：当 `channels.imessage.allowFrom` 非空时，`/approve <id> <decision>` 会根据该审批者列表授权（而不是更广泛的私信允许列表），在私信允许列表中被允许但不在 `allowFrom` 中的发送者会收到明确拒绝。当 `allowFrom` 为空时，同聊天降级方案仍然生效，`/approve` 会授权私信允许列表允许的任何人。将所有应该审批的操作员（无论通过 `/approve` 还是通过表情回应）添加到 `allowFrom`。

    操作员说明：
    - 表情回应绑定同时存储在内存和 Gateway 网关的持久键值存储中（TTL 与审批过期时间匹配），并且 Gateway 网关还会轮询待处理提示的 tapback，因此 Gateway 网关重启后不久到达的 tapback 仍会完成审批。
    - 当该句柄是显式审批者时，操作员自己的 `is_from_me=true` tapback（例如来自已配对的 Apple 设备）会完成审批。
    - 只有配置了显式审批者时，审批提示才会路由到群组会话；否则任何群组成员都可能审批。
    - 旧版文本样式 tapback（很旧的 Apple 客户端发出的 `Liked "…"` 纯文本）无法完成审批，因为它们不携带消息 GUID；表情回应解析需要当前 macOS / iOS 客户端发出的结构化 tapback 元数据。

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

## 合并拆分发送的私信（一次输入中的命令 + URL）

当用户同时输入命令和 URL，例如 `Dump https://example.com/article`，Apple 的 Messages 应用会将发送拆分成**两条独立的 `chat.db` 行**：

1. 文本消息（`"Dump"`）。
2. URL 预览气泡（`"https://..."`），带有作为附件的 OG 预览图片。

在大多数设置中，这两行会相隔约 0.8 到 2.0 秒到达 OpenClaw。没有合并时，智能体在轮次 1 只会收到命令（并且常常回复“把 URL 发给我”），随后 URL 才会在轮次 2 到达。这是 Apple 的发送管线行为，不是 OpenClaw 或 `imsg` 引入的。

`channels.imessage.coalesceSameSenderDms` 会让私信选择缓冲同一发送者连续发送的行。当 `imsg` 在某个源行上暴露结构化 URL 预览标记 `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` 时，OpenClaw 只合并该真实的拆分发送，并将其他任何缓冲的行保留为独立轮次。在完全不发出气泡元数据的较旧 `imsg` 构建上，OpenClaw 无法区分拆分发送和独立发送，因此会降级为合并整个桶。这样会保留元数据出现前的行为，而不是让 `Dump <url>` 拆分发送回退成两个轮次。群聊继续按消息派发，以保留多用户轮次结构。

<Tabs>
  <Tab title="何时启用">
    在以下情况下启用：

    - 你发布的 Skills 期望一条消息内包含 `command + payload`（dump、paste、save、queue 等）。
    - 你的用户会把 URL 和命令一起粘贴。
    - 你可以接受增加的私信轮次延迟（见下文）。

    在以下情况下保持禁用：

    - 你需要单词私信触发器的最低命令延迟。
    - 你的所有流程都是没有后续载荷的一次性命令。

  </Tab>
  <Tab title="启用">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // 选择启用（默认：false）
        },
      },
    }
    ```

    启用该标志且没有显式 `messages.inbound.byChannel.imessage` 或全局 `messages.inbound.debounceMs` 时，防抖窗口会扩大到 **7000 ms**（旧版默认值为 0 ms，即不防抖）。需要更宽的窗口，是因为 Apple 的 URL 预览拆分发送节奏可能延长到数秒，同时 Messages.app 发出预览行。

    要自行调整窗口：

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms 覆盖观察到的 Messages.app URL 预览延迟。
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="权衡">
    - **精确合并需要当前的 `imsg` 载荷元数据。** 存在 `balloon_bundle_id` 时，只有真正的拆分发送会被合并；上文所述的无元数据回退合并是临时向后兼容，会在 `imsg` 在上游合并拆分发送后移除。
    - **私信消息会增加延迟。** 启用该标志后，每条私信（包括独立控制命令和单条文本跟进）都会在分发前最多等待防抖窗口时间，以防 URL 预览行即将到来。群聊消息仍会即时分发。
    - **合并输出有边界。** 合并文本上限为 4000 个字符，并带有显式 `…[truncated]` 标记；附件上限为 20 个；来源条目上限为 10 个（超过后保留首条和最新条）。每个来源 GUID 都会记录在 `coalescedMessageGuids` 中，用于下游遥测。
    - **仅限私信。** 群聊会落回逐消息分发，以便多人正在输入时 bot 仍保持响应。
    - **按频道选择启用。** 其他渠道（Discord、Slack、Telegram、WhatsApp、…）不受影响。设置了 `channels.bluebubbles.coalesceSameSenderDms` 的旧版 BlueBubbles 配置应将该值迁移到 `channels.imessage.coalesceSameSenderDms`。

  </Tab>
</Tabs>

### 场景以及智能体看到的内容

“标志开启”列展示的是会发出 `balloon_bundle_id` 的 `imsg` 构建上的行为。在完全不发出气泡元数据的旧版 `imsg` 构建上，下方标记为“两轮”/“N 轮”的行会改为回退到旧版合并（一轮）：OpenClaw 无法从结构上区分拆分发送和单独发送，因此会保留元数据出现之前的合并行为。一旦构建发出气泡元数据，精确分离就会激活。

| 用户编写内容                                                       | `chat.db` 产生内容                  | 标志关闭（默认）                        | 标志开启 + 窗口（imsg 发出气泡元数据）                                                            |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com`（一次发送）                              | 2 行，间隔约 1 秒                   | 两个智能体轮次：“Dump” 单独一轮，然后 URL | 一轮：合并文本 `Dump https://example.com`                                                          |
| `Save this 📎image.jpg caption`（附件 + 文本）                | 2 行，无 URL 气泡元数据             | 两轮                                    | 观察到元数据后为两轮；在旧版/锁存前的无元数据会话中为一个合并轮次                                  |
| `/status`（独立命令）                                     | 1 行                               | 即时分发                        | **最多等待窗口时间，然后分发**                                                                |
| 单独粘贴 URL                                                   | 1 行                               | 即时分发                        | 最多等待窗口时间，然后分发                                                                    |
| 文本 + URL 作为两条有意分开发送的消息，间隔数分钟 | 2 行，位于窗口之外               | 两轮                               | 两轮（窗口在它们之间过期）                                                             |
| 快速刷屏（窗口内 >10 条小私信）                          | N 行，无 URL 气泡元数据 | N 轮                                 | 观察到元数据后为 N 轮；在旧版/锁存前的无元数据会话中为一个有边界的合并轮次 |
| 群聊中两个人正在输入                                  | 来自 M 个发送者的 N 行               | M+ 轮（每个发送者桶一个）        | M+ 轮 — 群聊不会被合并                                                            |

## 桥接或 Gateway 网关重启后的入站恢复

iMessage 会恢复 Gateway 网关停机期间错过的消息，同时抑制 Apple 在 Push 恢复后可能刷出的陈旧“积压炸弹”。默认行为始终开启，基于入站去重构建。

- **重放去重。** 每条已分发的入站消息都会按其 Apple GUID 记录在持久化插件状态（`imessage.inbound-dedupe`）中，在摄取时声明，并在处理后提交（瞬时失败时释放，以便重试）。任何已处理的内容都会被丢弃，而不是重复分发。这让恢复可以积极重放，而无需逐消息记账。
- **停机恢复。** 启动时，监视器会记住最后分发的 `chat.db` rowid（一个持久化的按账户游标），并将它作为 `since_rowid` 传给 `imsg watch.subscribe`，因此 imsg 会重放 Gateway 网关停机期间落入的行，然后跟随实时数据。重放被限制在最近 500 行以及约 2 小时内的消息，去重会丢弃任何已处理内容。
- **陈旧积压年龄围栏。** 启动边界以上的行是真正的实时消息；如果某行的发送日期比到达时间早超过约 15 分钟，它就是 Push 刷出的积压，会被抑制。重放行（位于边界或边界以下）改用更宽的恢复窗口，因此最近错过的消息会送达，而久远历史不会送达。

恢复同时适用于本地和远程 `cliPath` 设置，因为 `since_rowid` 重放运行在同一条 `imsg` RPC 连接上。区别在于窗口：当 Gateway 网关可以读取 `chat.db`（本地）时，它会锚定启动 rowid 边界、限制重放跨度，并送达最多约数小时前错过的消息。通过远程 SSH `cliPath` 时，它无法读取数据库，因此重放不设上限，并且每一行都使用实时年龄围栏 — 它仍会恢复最近错过的消息，也仍会抑制旧积压，只是使用更窄的实时窗口。请在运行 Messages 的 Mac 上运行 Gateway 网关，以获得更宽的恢复窗口。

### 操作员可见信号

被抑制的积压会以默认级别记录日志，绝不会静默丢弃（`recovery` 标志显示应用了哪个窗口）：

```text
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### 迁移

`channels.imessage.catchup.*` 已弃用 — 停机恢复是自动的，新设置无需配置。带有 `catchup.enabled: true` 的现有配置仍会作为恢复重放窗口的兼容性配置文件受到支持。已禁用的 catchup 块（`enabled: false` 或没有 `enabled: true`）已退役；`openclaw doctor --fix` 会移除这些块。

## 故障排查

<AccordionGroup>
  <Accordion title="找不到 imsg 或不支持 RPC">
    验证二进制文件和 RPC 支持：

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    如果探测报告不支持 RPC，请更新 `imsg`。如果私有 API 操作不可用，请在已登录的 macOS 用户会话中运行 `imsg launch`，然后再次探测。如果 Gateway 网关未在 macOS 上运行，请改用上面的通过 SSH 连接远程 Mac 设置，而不是默认的本地 `imsg` 路径。

  </Accordion>

  <Accordion title="Messages 可以发送，但入站 iMessages 没有到达">
    首先证明消息是否到达了本地 Mac。如果 `chat.db` 没有变化，即使 `imsg status --json` 报告桥接健康，OpenClaw 也无法接收该消息。

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    如果从手机发送的消息没有创建新行，请先修复 macOS Messages 和 Apple Push 层，再更改 OpenClaw 配置。一次性服务刷新通常就足够：

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    从手机发送一条新的 iMessage，并在调试 OpenClaw 会话前确认出现新的 `chat.db` 行或 `imsg watch` 事件。不要将这作为周期性桥接重启循环来运行；在活跃工作期间反复执行 `imsg launch` 加 Gateway 网关重启可能会中断投递，并使正在进行的渠道运行滞留。

  </Accordion>

  <Accordion title="Gateway 网关未在 macOS 上运行">
    默认 `cliPath: "imsg"` 必须在登录了 Messages 的 Mac 上运行。在 Linux 或 Windows 上，将 `channels.imessage.cliPath` 设置为一个包装脚本，该脚本通过 SSH 连接到那台 Mac 并运行 `imsg "$@"`。

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
    - Gateway 网关主机上的 `~/.ssh/known_hosts` 中存在主机密钥
    - 运行 Messages 的 Mac 上远程路径的可读性

  </Accordion>

  <Accordion title="错过了 macOS 权限提示">
    在同一用户/会话上下文中的交互式 GUI 终端里重新运行，并批准提示：

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    确认为运行 OpenClaw/`imsg` 的进程上下文授予了“完全磁盘访问权限”和“自动化”。

  </Accordion>
</AccordionGroup>

## 配置参考指针

- [Configuration reference - iMessage](/zh-CN/gateway/config-channels#imessage)
- [Gateway 配置](/zh-CN/gateway/configuration)
- [配对](/zh-CN/channels/pairing)

## 相关

- [渠道概览](/zh-CN/channels) — 所有受支持的渠道
- [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage) — 公告和迁移摘要
- [Coming from BlueBubbles](/zh-CN/channels/imessage-from-bluebubbles) — 配置转换表和分步切换流程
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程
- [Groups](/zh-CN/channels/groups) — 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Security](/zh-CN/gateway/security) — 访问模型和加固
