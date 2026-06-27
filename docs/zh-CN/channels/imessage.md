---
read_when:
    - 设置 iMessage 支持
    - 调试 iMessage 发送/接收
summary: 通过 imsg（基于 stdio 的 JSON-RPC）提供原生 iMessage 支持，并通过私有 API 操作支持回复、Tapback、效果、附件和群组管理。当主机要求满足时，这是新的 OpenClaw iMessage 设置的首选方案。
title: iMessage
x-i18n:
    generated_at: "2026-06-27T01:22:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 065c0426af6230f9be2f0a12ecc4553724d8ce1a2b6b0dad640b5ae8a8a480f0
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
对于 OpenClaw iMessage 部署，请在已登录的 macOS Messages 主机上使用 `imsg`。如果你的 Gateway 网关运行在 Linux 或 Windows 上，请将 `channels.imessage.cliPath` 指向一个 SSH 包装器，让它在 Mac 上运行 `imsg`。

**入站恢复是自动的。** 在桥接器或 Gateway 网关重启后，iMessage 会重放停机期间漏掉的消息，并抑制 Apple 在 Push 恢复后可能刷出的陈旧“积压炸弹”，同时执行去重，确保没有内容被分发两次。无需配置即可启用 — 请参阅[桥接器或 Gateway 网关重启后的入站恢复](#inbound-recovery-after-a-bridge-or-gateway-restart)。
</Note>

<Warning>
BlueBubbles 支持已移除。请将 `channels.bluebubbles` 配置迁移到 `channels.imessage`；OpenClaw 仅通过 `imsg` 支持 iMessage。简短公告请先阅读 [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage)，完整迁移表请阅读 [Coming from BlueBubbles](/zh-CN/channels/imessage-from-bluebubbles)。
</Warning>

状态：原生外部 CLI 集成。Gateway 网关会启动 `imsg rpc`，并通过 stdio 上的 JSON-RPC 通信（没有单独的守护进程/端口）。高级操作需要 `imsg launch` 以及成功的私有 API 探测。

<CardGroup cols={3}>
  <Card title="私有 API 操作" icon="wand-sparkles" href="#private-api-actions">
    回复、tapback、效果、附件和群组管理。
  </Card>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    iMessage 私信默认使用配对模式。
  </Card>
  <Card title="远程 Mac" icon="terminal" href="#remote-mac-over-ssh">
    当 Gateway 网关未运行在 Messages Mac 上时，请使用 SSH 包装器。
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

      <Step title="启动 gateway">

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

  <Tab title="通过 SSH 使用远程 Mac">
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

    如果未设置 `remoteHost`，OpenClaw 会尝试通过解析 SSH 包装器脚本自动检测它。
    `remoteHost` 必须是 `host` 或 `user@host`（不能包含空格或 SSH 选项）。
    OpenClaw 对 SCP 使用严格的主机密钥检查，因此中继主机密钥必须已存在于 `~/.ssh/known_hosts` 中。
    附件路径会根据允许的根目录（`attachmentRoots` / `remoteAttachmentRoots`）进行验证。

<Warning>
你放在 `imsg` 前面的任何 `cliPath` 包装器或 SSH 代理都必须像透明的 stdio 管道一样处理长生命周期 JSON-RPC。OpenClaw 会在该渠道的整个生命周期内，通过包装器的 stdin/stdout 交换小型换行分帧 JSON-RPC 消息：

- **只要有字节可用**，就立即转发每个 stdin 块/行 — 不要等待 EOF。
- 及时反向转发每个 stdout 块/行。
- 保留换行。
- 避免固定大小的阻塞读取（`read(4096)`、`cat | buffer`、默认 shell `read`），它们可能会让小帧得不到处理。
- 将 stderr 与 JSON-RPC stdout 流分开。

如果包装器会缓冲 stdin，直到填满大块才转发，就会产生看起来像 iMessage 中断的症状 — `imsg rpc timeout (chats.list)` 或反复的渠道重启 — 即使 `imsg rpc` 本身是健康的。上面的 `ssh -T host imsg "$@"` 是安全的，因为它会转发 OpenClaw 的 `cliPath` 参数，例如 `rpc` 和 `--db`。像 `ssh host imsg | grep -v '^DEBUG'` 这样的管道则不安全 — 行缓冲工具仍可能持有帧；如果必须过滤，请在每个阶段使用 `stdbuf -oL -eL`。
</Warning>

  </Tab>
</Tabs>

## 要求和权限（macOS）

- Messages 必须已在运行 `imsg` 的 Mac 上登录。
- 运行 OpenClaw/`imsg` 的进程上下文需要 Full Disk Access（用于访问 Messages 数据库）。
- 通过 Messages.app 发送消息需要 Automation 权限。
- 对于高级操作（回应 / 编辑 / 撤回 / 线程回复 / 效果 / 群组操作），必须禁用 System Integrity Protection — 请参阅下方的[启用 imsg 私有 API](#enabling-the-imsg-private-api)。基础文本和媒体收发无需禁用它即可工作。

<Tip>
权限按进程上下文授予。如果 gateway 以无头方式运行（LaunchAgent/SSH），请在同一上下文中运行一次交互式命令来触发提示：

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH 包装器发送失败并显示 AppleEvents -1743">
  远程 SSH 设置可能可以读取聊天、通过 `channels status --probe`，并处理入站消息，但出站发送仍会因 AppleEvents 授权错误而失败：

```text
Not authorized to send Apple events to Messages. (-1743)
```

检查已登录 Mac 用户的 TCC 数据库，或 System Settings > Privacy & Security > Automation。如果 Automation 条目记录的是 `/usr/libexec/sshd-keygen-wrapper`，而不是 `imsg` 或本地 shell 进程，macOS 可能不会为该 SSH 服务器端客户端暴露可用的 Messages 开关：

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

在这种状态下，反复运行 `tccutil reset AppleEvents` 或通过同一个 SSH 包装器重新运行 `imsg send` 可能仍会失败，因为需要 Messages Automation 的进程上下文是 SSH 包装器，而不是 UI 可以授权的应用。

请改用受支持的 `imsg` 进程上下文之一：

- 在已登录的 Messages 用户本地会话中运行 Gateway 网关，或至少运行 `imsg` 桥接器。
- 在同一会话中授予 Full Disk Access 和 Automation 后，用该用户的 LaunchAgent 启动 Gateway 网关。
- 如果你保留双用户 SSH 拓扑，请在启用渠道前验证真实的出站 `imsg send` 能通过完全相同的包装器成功执行。如果无法授予 Automation，请改为重新配置成单用户 `imsg` 设置，而不是依赖 SSH 包装器进行发送。

</Accordion>

## 启用 imsg 私有 API

`imsg` 提供两种运行模式：

- **基础模式**（默认，无需更改 SIP）：通过 `send` 发送出站文本和媒体、入站 watch/history、聊天列表。这就是全新 `brew install steipete/tap/imsg` 加上上述标准 macOS 权限后开箱可用的内容。
- **私有 API 模式**：`imsg` 将辅助 dylib 注入 `Messages.app`，以调用内部 `IMCore` 函数。这会解锁 `react`、`edit`、`unsend`、`reply`（线程式）、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`，以及输入指示器和已读回执。

要使用本渠道页面记录的高级操作能力，你需要私有 API 模式。`imsg` README 明确说明了该要求：

> Advanced features such as `read`, `typing`, `launch`, bridge-backed rich send, message mutation, and chat management are opt-in. They require SIP to be disabled and a helper dylib to be injected into `Messages.app`. `imsg launch` refuses to inject when SIP is enabled.

辅助注入技术使用 `imsg` 自己的 dylib 来访问 Messages 私有 API。OpenClaw iMessage 路径中没有第三方服务器或 BlueBubbles 运行时。

<Warning>
**禁用 SIP 是真实的安全权衡。** SIP 是 macOS 防止运行被修改系统代码的核心保护之一；在系统范围内关闭它会带来额外攻击面和副作用。尤其是，**在 Apple Silicon Mac 上禁用 SIP 也会禁用在你的 Mac 上安装和运行 iOS 应用的能力**。

请把它视为有意为之的运维选择，而不是默认设置。如果你的威胁模型不能容忍关闭 SIP，内置 iMessage 将仅限于基础模式 — 只能收发文本和媒体，不能使用回应 / 编辑 / 撤回 / 效果 / 群组操作。
</Warning>

### 设置

1. 在运行 Messages.app 的 Mac 上**安装（或升级）`imsg`**：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 输出会报告 `bridge_version`、`rpc_methods` 和每个方法的 `selectors`，因此你可以在开始前查看当前构建支持什么。

2. **禁用 System Integrity Protection，并且（在现代 macOS 上）禁用 Library Validation。** 将非 Apple 的辅助 dylib 注入 Apple 签名的 `Messages.app` 需要关闭 SIP，**并且**放宽 library validation。Recovery 模式下的 SIP 步骤因 macOS 版本而异：
   - **macOS 10.13-10.15（Sierra-Catalina）：** 通过 Terminal 禁用 Library Validation，重启到 Recovery Mode，运行 `csrutil disable`，然后重启。
   - **macOS 11+（Big Sur 及更高版本），Intel：** 进入 Recovery Mode（或 Internet Recovery），运行 `csrutil disable`，然后重启。
   - **macOS 11+，Apple Silicon：** 使用电源按钮启动流程进入 Recovery；在较新的 macOS 版本中，点击 Continue 时按住 **Left Shift** 键，然后运行 `csrutil disable`。虚拟机设置遵循单独流程，因此请先创建 VM 快照。

   **在 macOS 11 及更高版本上，单独运行 `csrutil disable` 通常不够。** Apple 仍会针对作为平台二进制文件的 `Messages.app` 强制执行 library validation，因此即使 SIP 已关闭，adhoc 签名的辅助组件也会被拒绝（`Library Validation failed: ... platform binary, but mapped file is not`）。禁用 SIP 后，还要禁用 library validation 并重启：

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26（Tahoe），已在 26.5.1 上验证：** 关闭 SIP **加上**上面的 `DisableLibraryValidation` 命令，足以在 26.0 到 26.5.x 上注入辅助组件。**不需要 boot-args。** 该 plist 是决定性因素，也是 Tahoe 上注入失败时最常缺少的步骤：
   - **有该 plist：** `imsg launch` 会注入，并且 `imsg status` 会报告 `advanced_features: true`。
   - **没有该 plist（即使 SIP 已关闭）：** `imsg launch` 会失败并显示 `Failed to launch: Timeout waiting for Messages.app to initialize`。AMFI 会在加载时拒绝 adhoc 辅助组件，因此桥接器永远无法就绪，launch 最终超时。这种超时是多数人在 Tahoe 上遇到的症状，修复方法是上面的 plist，而不是更激进的操作。

   这已在 macOS 26.5.1（Apple Silicon）上通过受控前后对比确认：有该 plist 时，dylib 会映射到 `Messages.app` 中并启动桥接器；移除该 plist 并重启后，`imsg launch` 会产生上述超时失败，且 dylib 未被映射。

   如果在 macOS 升级后，`imsg launch` 注入或特定 `selectors` 开始返回 false，通常就是这个门控导致的。先检查你的 SIP 和库验证状态，再判断 SIP 步骤本身是否失败。如果这些设置正确但桥仍然无法注入，请收集 `imsg status --json` 和 `imsg launch` 输出，并报告给 `imsg` 项目，而不是削弱额外的系统级安全控制。

   按照 Apple 针对你的 Mac 提供的恢复模式流程，在运行 `imsg launch` 前禁用 SIP。

3. **注入辅助程序。** 在 SIP 已禁用且 Messages.app 已登录的情况下：

   ```bash
   imsg launch
   ```

   当 SIP 仍处于启用状态时，`imsg launch` 会拒绝注入，因此这也可作为第 2 步已生效的确认。

4. **从 OpenClaw 验证桥：**

   ```bash
   openclaw channels status --probe
   ```

   iMessage 条目应报告 `works`，并且 `imsg status --json | jq '.selectors'` 应显示 `retractMessagePart: true`，以及你的 macOS 构建版本暴露的任意编辑 / 输入中 / 已读 selectors。`actions.ts` 中的 OpenClaw 插件按方法门控只会公布底层 selector 为 `true` 的动作，因此你在智能体工具列表中看到的动作表面反映了桥在这台主机上实际能做什么。

如果 `openclaw channels status --probe` 将频道报告为 `works`，但特定动作在分发时抛出 “iMessage `<action>` requires the imsg private API bridge”，请再次运行 `imsg launch`，辅助程序可能会脱落（Messages.app 重启、OS 更新等），并且缓存的 `available: true` 状态会继续公布动作，直到下一次探测刷新。

### 当你无法禁用 SIP 时

如果禁用 SIP 不符合你的威胁模型：

- `imsg` 会回退到基本模式，即仅文本 + 媒体 + 接收。
- OpenClaw 插件仍会公布文本/媒体发送和入站监控；它只是从动作表面隐藏 `react`、`edit`、`unsend`、`reply`、`sendWithEffect` 和群组操作（依据按方法能力门控）。
- 你可以运行一台单独的非 Apple Silicon Mac（或专用 Bot Mac）并关闭 SIP 来承载 iMessage 工作负载，同时在你的主要设备上保持 SIP 启用。请参阅下方 [Dedicated bot macOS user（separate iMessage identity）](#deployment-patterns)。

## 访问控制和路由

<Tabs>
  <Tab title="私信策略">
    `channels.imessage.dmPolicy` 控制私信：

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    允许列表字段：`channels.imessage.allowFrom`。

    允许列表条目必须标识发送者：handle 或静态发送者访问组（`accessGroup:<name>`）。对于 `chat_id:*`、`chat_guid:*` 或 `chat_identifier:*` 等聊天目标，请使用 `channels.imessage.groupAllowFrom`；对于数字 `chat_id` 注册表键，请使用 `channels.imessage.groups`。

  </Tab>

  <Tab title="群组策略 + 提及">
    `channels.imessage.groupPolicy` 控制群组处理：

    - `allowlist`（配置后默认）
    - `open`
    - `disabled`

    群组发送者允许列表：`channels.imessage.groupAllowFrom`。

    `groupAllowFrom` 条目也可以引用静态发送者访问组（`accessGroup:<name>`）。

    运行时回退：如果未设置 `groupAllowFrom`，iMessage 群组发送者检查会使用 `allowFrom`；当私信和群组准入应该不同时，请设置 `groupAllowFrom`。
    运行时说明：如果完全缺少 `channels.imessage`，运行时会回退到 `groupPolicy="allowlist"` 并记录一条警告（即使已设置 `channels.defaults.groupPolicy`）。

    <Warning>
    群组路由有**两个**允许列表门控连续运行，并且两个都必须通过：

    1. **发送者 / 聊天目标允许列表**（`channels.imessage.groupAllowFrom`）—— handle、`chat_guid`、`chat_identifier` 或 `chat_id`。
    2. **群组注册表**（`channels.imessage.groups`）—— 当 `groupPolicy: "allowlist"` 时，此门控要求存在 `groups: { "*": { ... } }` 通配符条目（设置 `allowAll = true`），或 `groups` 下存在显式的每个 `chat_id` 条目。

    如果门控 2 为空，每条群组消息都会被丢弃。插件会在默认日志级别发出两个 `warn` 级别信号：

    - 启动时每个账号一次：`imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - 运行时每个 `chat_id` 一次：`imessage: dropping group message from chat_id=<id> ...`

    私信会继续工作，因为它们走的是不同代码路径。

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

    群组的提及门控：

    - iMessage 没有原生提及元数据
    - 提及检测使用正则表达式模式（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）
    - 如果没有配置模式，提及门控无法执行

    来自授权发送者的控制命令可以在群组中绕过提及门控。

    每群组 `systemPrompt`：

    `channels.imessage.groups.*` 下的每个条目都接受一个可选的 `systemPrompt` 字符串。该值会在处理该群组消息的每个轮次中注入到智能体的系统提示词。解析方式与 `channels.whatsapp.groups` 使用的每群组提示词解析一致：

    1. **群组专用系统提示词**（`groups["<chat_id>"].systemPrompt`）：当 map 中存在特定群组条目**且**其 `systemPrompt` 键已定义时使用。如果 `systemPrompt` 是空字符串（`""`），通配符会被抑制，并且不会对该群组应用系统提示词。
    2. **群组通配符系统提示词**（`groups["*"].systemPrompt`）：当特定群组条目在 map 中完全不存在，或存在但未定义 `systemPrompt` 键时使用。

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

    每群组提示词只适用于群组消息，本频道中的私信不受影响。

  </Tab>

  <Tab title="会话和确定性回复">
    - 私信使用直接路由；群组使用群组路由。
    - 使用默认 `session.dmScope=main` 时，iMessage 私信会折叠到智能体主会话。
    - 群组会话是隔离的（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回复会使用来源频道/目标元数据路由回 iMessage。

    类群组线程行为：

    某些多参与者 iMessage 线程可能以 `is_group=false` 到达。
    如果该 `chat_id` 已在 `channels.imessage.groups` 下显式配置，OpenClaw 会将其视为群组流量（群组门控 + 群组会话隔离）。

  </Tab>
</Tabs>

## ACP 对话绑定

旧版 iMessage 聊天也可以绑定到 ACP 会话。

快速操作员流程：

- 在私信或允许的群组聊天内运行 `/acp spawn codex --bind here`。
- 同一 iMessage 对话中的后续消息会路由到生成的 ACP 会话。
- `/new` 和 `/reset` 会在原位重置同一个已绑定 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

已配置的持久绑定通过顶层 `bindings[]` 条目支持，其中包含 `type: "acp"` 和 `match.channel: "imessage"`。

`match.peer.id` 可以使用：

- 规范化的私信 handle，例如 `+15555550123` 或 `user@example.com`
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

请参阅 [ACP 智能体](/zh-CN/tools/acp-agents) 了解共享 ACP 绑定行为。

## 部署模式

<AccordionGroup>
  <Accordion title="专用 Bot macOS 用户（单独的 iMessage 身份）">
    使用专用 Apple ID 和 macOS 用户，使 Bot 流量与你的个人 Messages 配置隔离。

    典型流程：

    1. 创建/登录专用 macOS 用户。
    2. 在该用户中使用 Bot Apple ID 登录 Messages。
    3. 在该用户中安装 `imsg`。
    4. 创建 SSH 包装器，使 OpenClaw 可以在该用户上下文中运行 `imsg`。
    5. 将 `channels.imessage.accounts.<id>.cliPath` 和 `.dbPath` 指向该用户配置文件。

    首次运行可能需要在该 Bot 用户会话中进行 GUI 批准（自动化 + 完全磁盘访问权限）。

  </Accordion>

  <Accordion title="通过 Tailscale 连接远程 Mac（示例）">
    常见拓扑：

    - gateway 在 Linux/VM 上运行
    - iMessage + `imsg` 在你的 tailnet 中的一台 Mac 上运行
    - `cliPath` 包装器使用 SSH 运行 `imsg`
    - `remoteHost` 启用 SCP 附件拉取

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
    先确保主机密钥已受信任（例如 `ssh bot@mac-mini.tailnet-1234.ts.net`），这样会填充 `known_hosts`。

  </Accordion>

  <Accordion title="多账号模式">
    iMessage 支持在 `channels.imessage.accounts` 下进行按账号配置。

    每个账号都可以覆盖 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、历史设置和附件根允许列表等字段。

  </Accordion>

  <Accordion title="私信历史">
    设置 `channels.imessage.dmHistoryLimit`，以使用该对话最近解码的 `imsg` 历史为新的私信会话播种。使用 `channels.imessage.dms["<sender>"].historyLimit` 进行按发送者覆盖，包括用 `0` 为某个发送者禁用历史。

    iMessage 私信历史会按需从 `imsg` 获取。不设置 `dmHistoryLimit` 会禁用全局私信历史播种，但正数的按发送者 `channels.imessage.dms["<sender>"].historyLimit` 仍会为该发送者启用播种。

  </Accordion>
</AccordionGroup>

## 媒体、分块和交付目标

<AccordionGroup>
  <Accordion title="附件和媒体">
    - 入站附件摄取默认**关闭** — 设置 `channels.imessage.includeAttachments: true`，将照片、语音备忘录、视频和其他附件转发给智能体。禁用时，仅含附件的 iMessage 会在到达智能体前被丢弃，并且可能完全不会产生 `Inbound message` 日志行。
    - 设置 `remoteHost` 后，可以通过 SCP 获取远程附件路径
    - 附件路径必须匹配允许的根目录：
      - `channels.imessage.attachmentRoots`（本地）
      - `channels.imessage.remoteAttachmentRoots`（远程 SCP 模式）
      - 默认根目录模式：`/Users/*/Library/Messages/Attachments`
    - SCP 使用严格的主机密钥检查（`StrictHostKeyChecking=yes`）
    - 出站媒体大小使用 `channels.imessage.mediaMaxMb`（默认 16 MB）

  </Accordion>

  <Accordion title="出站分块">
    - 文本分块限制：`channels.imessage.textChunkLimit`（默认 4000）
    - 分块模式：`channels.imessage.chunkMode`
      - `length`（默认）
      - `newline`（段落优先拆分）

  </Accordion>

  <Accordion title="地址格式">
    推荐的显式目标：

    - `chat_id:123`（推荐用于稳定路由）
    - `chat_guid:...`
    - `chat_identifier:...`

    也支持 handle 目标：

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
    - **react**：添加/移除 iMessage 点按回应（`messageId`、`emoji`、`remove`）。支持的点按回应会映射到喜欢、赞同、反对、大笑、强调和疑问。
    - **reply**：向现有消息发送线程内回复（`messageId`、`text` 或 `message`，以及 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。
    - **sendWithEffect**：发送带 iMessage 效果的文本（`text` 或 `message`，`effect` 或 `effectId`）。
    - **edit**：在受支持的 macOS/私有 API 版本上编辑已发送消息（`messageId`、`text` 或 `newText`）。
    - **unsend**：在受支持的 macOS/私有 API 版本上撤回已发送消息（`messageId`）。
    - **upload-file**：发送媒体/文件（作为 base64 的 `buffer`，或已补全的 `media`/`path`/`filePath`、`filename`，可选 `asVoice`）。旧版别名：`sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**：当当前目标是群组会话时管理群聊。

  </Accordion>

  <Accordion title="消息 ID">
    入站 iMessage 上下文在可用时同时包含短 `MessageSid` 值和完整消息 GUID。短 ID 作用域限定在近期 SQLite 支持的回复缓存内，使用前会与当前聊天核对。如果短 ID 已过期或属于另一个聊天，请使用完整的 `MessageSidFull` 重试。

  </Accordion>

  <Accordion title="能力检测">
    仅当缓存的探测状态表明桥接不可用时，OpenClaw 才会隐藏私有 API 操作。如果状态未知，操作仍保持可见，并在分发时延迟探测，以便 `imsg launch` 后的第一个操作无需单独手动刷新状态也能成功。

  </Accordion>

  <Accordion title="已读回执和正在输入">
    当私有 API 桥接启动时，已接受的入站聊天会被标记为已读，直接聊天会在轮次被接受后立即显示正在输入气泡，同时智能体准备上下文并生成内容。可通过以下配置禁用已读标记：

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    早于按方法能力列表的旧版 `imsg` 构建会静默关闭正在输入/已读；OpenClaw 会在每次重启后记录一次性警告，使缺失回执可归因。

  </Accordion>

  <Accordion title="入站点按回应">
    OpenClaw 订阅 iMessage 点按回应，并将已接受的反应作为系统事件路由，而不是普通消息文本，因此用户的点按回应不会触发常规回复循环。

    通知模式由 `channels.imessage.reactionNotifications` 控制：

    - `"own"`（默认）：仅当用户对机器人编写的消息作出反应时通知。
    - `"all"`：通知来自已授权发送者的所有入站点按回应。
    - `"off"`：忽略入站点按回应。

    按账号覆盖使用 `channels.imessage.accounts.<id>.reactionNotifications`。

  </Accordion>

  <Accordion title="审批反应（👍 / 👎）">
    当 `approvals.exec.enabled` 或 `approvals.plugin.enabled` 为 true，且请求路由到 iMessage 时，Gateway 网关会以原生方式投递审批提示，并接受点按回应来完成处理：

    - `👍`（Like 点按回应）→ `allow-once`
    - `👎`（Dislike 点按回应）→ `deny`
    - `allow-always` 仍是手动回退：将 `/approve <id> allow-always` 作为普通回复发送。

    反应处理要求作出反应的用户 handle 是显式审批人。审批人列表从 `channels.imessage.allowFrom`（或 `channels.imessage.accounts.<id>.allowFrom`）读取；请以 E.164 格式添加用户电话号码，或添加他们的 Apple ID 邮箱。通配符条目 `"*"` 会被遵循，但会允许任何发送者批准。反应快捷方式会有意绕过 `reactionNotifications`、`dmPolicy` 和 `groupAllowFrom`，因为显式审批人允许列表是审批解析中唯一重要的门禁。

    **本版本的行为变更：** 当 `channels.imessage.allowFrom` 非空时，`/approve <id> <decision>` 文本命令现在会根据该审批人列表授权（而不是更宽泛的私信允许列表）。被私信允许列表允许、但不在 `allowFrom` 中的发送者会收到明确拒绝。请将每个应能通过 `/approve`（以及通过反应）批准的操作员添加到 `allowFrom`，以保留之前的行为。当 `allowFrom` 为空时，旧版“同聊天回退”仍然生效，`/approve` 会继续授权私信允许列表许可的任何人。

    操作员说明：
    - 反应绑定同时存储在内存中（TTL 与审批过期时间匹配）以及 Gateway 网关的持久化键值存储中，因此 Gateway 网关重启后不久到达的点按回应仍可解析该审批。
    - 跨设备的 `is_from_me=true` 点按回应（操作员自己在已配对 Apple 设备上的反应）会被有意忽略，因此机器人无法自我批准。
    - 旧版文本样式点按回应（非常旧的 Apple 客户端发出的 `Liked "…"` 纯文本）无法解析审批，因为它们不携带消息 GUID；反应解析需要当前 macOS / iOS 客户端发出的结构化点按回应元数据。

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

## 合并拆分发送的私信（一次撰写中的命令 + URL）

当用户同时输入命令和 URL，例如 `Dump https://example.com/article`，Apple 的 Messages app 会将发送拆分为**两条独立的 `chat.db` 行**：

1. 一条文本消息（`"Dump"`）。
2. 一个 URL 预览气泡（`"https://..."`），其中 OG 预览图片作为附件。

在大多数设置中，这两行会相隔约 0.8-2.0 秒到达 OpenClaw。如果不合并，智能体会在第 1 个轮次仅收到命令并回复（通常是“请把 URL 发给我”），然后只在第 2 个轮次看到 URL，此时命令上下文已经丢失。这是 Apple 的发送管线行为，不是 OpenClaw 或 `imsg` 引入的行为。

`channels.imessage.coalesceSameSenderDms` 会让私信缓冲同一发送者的连续行。当 `imsg` 在其中一个源行上暴露结构化 URL 预览标记 `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` 时，OpenClaw 只合并那个真正的拆分发送，并将任何其他缓冲行保留为独立轮次。在完全不发出气泡元数据的旧版 `imsg` 构建上，OpenClaw 无法区分拆分发送和独立发送，因此会回退为合并整个桶。这会保留元数据之前的行为，而不是把 `Dump <url>` 拆分发送回退成两个轮次。群聊会继续逐条消息分发，以保留多用户轮次结构。

<Tabs>
  <Tab title="何时启用">
    在以下情况下启用：

    - 你发布的 Skills 期望在一条消息中收到 `command + payload`（dump、paste、save、queue 等）。
    - 你的用户会把 URL 与命令一起粘贴。
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
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    开启该标志且没有显式设置 `messages.inbound.byChannel.imessage` 或全局 `messages.inbound.debounceMs` 时，防抖窗口会扩展到 **7000 ms**（旧版默认值是 0 ms，即不防抖）。需要更宽的窗口，是因为 Apple 的 URL 预览拆分发送节奏可能拉长到数秒，同时 Messages.app 会发出预览行。

    如需自行调整窗口：

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
    - **精确合并需要当前 `imsg` 载荷元数据。** 当 URL 行包含 `balloon_bundle_id` 时，只会合并那个真正的拆分发送，其他缓冲行保持独立。在不暴露气泡元数据的旧版 `imsg` 构建上，OpenClaw 会回退为合并缓冲桶，这样 `Dump <url>` 拆分发送不会退化为两个轮次（临时向后兼容，会在 `imsg` 上游合并拆分发送后移除）。
    - **私信消息会增加延迟。** 开启该标志后，每条私信（包括独立控制命令和单文本后续消息）都会在分发前最多等待防抖窗口，以防 URL 预览行即将到来。群聊消息保持即时分发。
    - **合并输出有界。** 合并文本上限为 4000 个字符，并带有显式 `…[truncated]` 标记；附件上限为 20；源条目上限为 10（超过后保留第一条和最新条）。每个源 GUID 都会在 `coalescedMessageGuids` 中跟踪，用于下游遥测。
    - **仅限私信。** 群聊会直接使用逐消息分发，因此多人输入时机器人仍保持响应。
    - **按渠道选择启用。** 其他渠道（Telegram、WhatsApp、Slack，…）不受影响。设置了 `channels.bluebubbles.coalesceSameSenderDms` 的旧版 BlueBubbles 配置应将该值迁移到 `channels.imessage.coalesceSameSenderDms`。

  </Tab>
</Tabs>

### 场景以及智能体看到的内容

“Flag on” 列展示在会发出 `balloon_bundle_id` 的 `imsg` 构建上的行为。在完全不发出气泡元数据的旧版 `imsg` 构建上，下方标记为 “两个轮次” / “N 个轮次” 的行会改为回退到旧版合并（一个轮次）：OpenClaw 无法从结构上区分拆分发送和独立发送，因此会保留元数据之前的合并方式。一旦构建发出气泡元数据，就会启用精确分离。

| 用户编写                                                           | `chat.db` 产生                     | Flag off（默认）                       | Flag on + 窗口（imsg 发出气泡元数据）                                                            |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com`（一次发送）                             | 2 行，间隔约 1 秒                   | 两个智能体轮次：“Dump” 单独一个，然后是 URL | 一个轮次：合并文本 `Dump https://example.com`                                                     |
| `Save this 📎image.jpg caption`（附件 + 文本）                     | 2 行，没有 URL 气泡元数据           | 两个轮次                               | 观察到元数据后为两个轮次；在旧版/锁定前无元数据会话中为一个合并轮次                               |
| `/status`（独立命令）                                              | 1 行                                | 立即分发                                | **最多等待一个窗口，然后分发**                                                                      |
| 单独粘贴的 URL                                                     | 1 行                                | 立即分发                                | 最多等待一个窗口，然后分发                                                                          |
| 文本 + URL 作为两条刻意分开的消息发送，间隔数分钟                  | 2 行，位于窗口之外                  | 两个轮次                               | 两个轮次（窗口在两者之间过期）                                                                      |
| 快速洪泛（窗口内超过 10 条小私信）                                 | N 行，没有 URL 气泡元数据           | N 个轮次                               | 观察到元数据后为 N 个轮次；在旧版/锁定前无元数据会话中为一个有界合并轮次                           |
| 群聊中两个人正在输入                                               | 来自 M 个发送者的 N 行              | M+ 个轮次（每个发送者桶一个）           | M+ 个轮次 — 群聊不会合并                                                                            |

## 桥接或 Gateway 网关重启后的入站恢复

iMessage 会恢复 Gateway 网关停机期间错过的消息，同时抑制 Apple 在 Push 恢复后可能刷出的陈旧“积压炸弹”。默认行为始终开启，基于入站去重构建。

- **重放去重。** 每条已分发的入站消息都会按其 Apple GUID 记录到持久化插件状态（`imessage.inbound-dedupe`）中，在摄取时声明，并在处理后提交（瞬时失败时释放，以便重试）。任何已处理的内容都会被丢弃，而不是重复分发。这让恢复可以积极重放，而无需逐条消息记账。
- **停机恢复。** 启动时，监视器会记住最后分发的 `chat.db` rowid（持久化的每账号游标），并将它作为 `since_rowid` 传给 `imsg watch.subscribe`，因此 imsg 会重放 Gateway 网关停机期间落入的行，然后跟踪实时数据。重放会限制在最近的行以及约 2 小时内的消息，去重会丢弃任何已处理的内容。
- **陈旧积压年龄栅栏。** 启动边界以上的行确实是实时数据；如果某条消息的发送日期比到达时间早超过约 15 分钟，它就是 Push 刷新的积压，会被抑制。重放的行（位于边界处或以下）改用更宽的恢复窗口，因此最近错过的消息会被投递，而久远历史不会。

恢复同时适用于本地和远程 `cliPath` 设置，因为 `since_rowid` 重放运行在同一条 `imsg` RPC 连接上。区别在于窗口：当 Gateway 网关可以读取 `chat.db`（本地）时，它会锚定启动 rowid 边界，限制重放跨度，并投递最多约几个小时前错过的消息。通过远程 SSH `cliPath` 时，它无法读取数据库，因此重放没有上限，并且每一行都使用实时年龄栅栏 — 它仍会恢复最近错过的消息，也仍会抑制旧积压，只是使用更窄的实时窗口。请在 Messages Mac 上运行 Gateway 网关，以获得更宽的恢复窗口。

### 操作者可见信号

被抑制的积压会以默认级别记录日志，绝不会静默丢弃（`recovery` 标志显示应用了哪个窗口）：

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### 迁移

`channels.imessage.catchup.*` 已弃用 — 停机恢复现在是自动的，新设置不需要配置。现有配置中带有 `catchup.enabled: true` 的内容仍会作为恢复重放窗口的兼容性配置文件受到支持。已禁用的 catchup 块（`enabled: false` 或没有 `enabled: true`）已退役；`openclaw doctor --fix` 会移除这些块。

## 故障排除

<AccordionGroup>
  <Accordion title="找不到 imsg 或 RPC 不受支持">
    验证二进制文件和 RPC 支持：

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    如果探测报告 RPC 不受支持，请更新 `imsg`。如果 private API 操作不可用，请在已登录的 macOS 用户会话中运行 `imsg launch`，然后再次探测。如果 Gateway 网关未在 macOS 上运行，请使用上面的通过 SSH 连接远程 Mac 设置，而不是默认的本地 `imsg` 路径。

  </Accordion>

  <Accordion title="消息可以发送，但入站 iMessage 没有到达">
    首先证明消息是否到达了本地 Mac。如果 `chat.db` 没有变化，即使 `imsg status --json` 报告桥接健康，OpenClaw 也无法接收该消息。

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

    从手机发送一条新的 iMessage，并在调试 OpenClaw 会话之前确认出现新的 `chat.db` 行或 `imsg watch` 事件。不要把它作为周期性桥接重启循环运行；在活跃工作期间反复执行 `imsg launch` 加 Gateway 网关重启，可能会中断投递并让正在进行的渠道运行滞留。

  </Accordion>

  <Accordion title="Gateway 网关未在 macOS 上运行">
    默认的 `cliPath: "imsg"` 必须在已登录 Messages 的 Mac 上运行。在 Linux 或 Windows 上，将 `channels.imessage.cliPath` 设置为一个包装脚本，通过 SSH 连接到那台 Mac 并运行 `imsg "$@"`。

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
    - 运行 Messages 的 Mac 上远程路径的可读性

  </Accordion>

  <Accordion title="错过了 macOS 权限提示">
    在相同用户/会话上下文中的交互式 GUI 终端里重新运行，并批准提示：

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    确认运行 OpenClaw/`imsg` 的进程上下文已授予 Full Disk Access + Automation。

  </Accordion>
</AccordionGroup>

## 配置参考指针

- [Configuration reference - iMessage](/zh-CN/gateway/config-channels#imessage)
- [Gateway 网关配置](/zh-CN/gateway/configuration)
- [配对](/zh-CN/channels/pairing)

## 相关

- [Channels 概览](/zh-CN/channels) — 所有受支持的渠道
- [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage) — 公告和迁移摘要
- [Coming from BlueBubbles](/zh-CN/channels/imessage-from-bluebubbles) — 配置翻译表和分步切换流程
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固
