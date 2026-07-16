---
read_when:
    - 设置 iMessage 支持
    - 调试 iMessage 收发
summary: 通过 imsg（基于 stdio 的 JSON-RPC）提供原生 iMessage 支持，并通过私有 API 实现回复、点按回应、特效、投票、附件和群组管理操作。当主机满足相关要求时，建议新的 OpenClaw iMessage 设置优先采用此方案。
title: iMessage
x-i18n:
    generated_at: "2026-07-16T11:21:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 78b7ff7621e66e3b0122b5581c097140b7f62998b78981741bd3edbc0e1608bd
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
对于常见的 OpenClaw iMessage 部署，请在同一台已登录 macOS“信息”的主机上运行 Gateway 网关和 `imsg`。如果 Gateway 网关在其他位置运行，请将 `channels.imessage.cliPath` 指向透明的 SSH 包装脚本，由它在 Mac 上运行 `imsg`。

**入站恢复会自动进行。** 桥接器或 Gateway 网关重启后，iMessage 会重放停机期间错过的消息，并抑制 Apple 在推送恢复后可能集中刷出的陈旧“积压消息炸弹”，同时执行去重，确保不会重复分发任何消息。无需通过配置启用——请参阅[桥接器或 Gateway 网关重启后的入站恢复](#inbound-recovery-after-a-bridge-or-gateway-restart)。
</Note>

<Warning>
已移除 BlueBubbles 支持。请将 `channels.bluebubbles` 配置迁移到 `channels.imessage`；OpenClaw 仅通过 `imsg` 支持 iMessage。简短公告请先阅读 [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage)，完整迁移表请阅读 [Coming from BlueBubbles](/zh-CN/channels/imessage-from-bluebubbles)。
</Warning>

状态：原生外部 CLI 集成。Gateway 网关会启动 `imsg rpc`，并通过 stdio 使用 JSON-RPC 通信——无需单独的守护进程或端口。强烈建议使用私有 API 模式，以获得功能完整的 iMessage 渠道；回复、点按回应、特效、投票、附件回复和群组操作都需要 `imsg launch`，且私有 API 探测必须成功。

对于常见的本地设置，OpenClaw 设置流程可以在已登录“信息”的 Mac 上，经用户确认后，通过 Homebrew 安装或更新 `imsg`。手动设置和 SSH 包装脚本拓扑仍由操作员管理：请在将运行 Gateway 网关或包装脚本的同一用户上下文中安装或更新 `imsg`。

<CardGroup cols={3}>
  <Card title="私有 API 操作" icon="wand-sparkles" href="#private-api-actions">
    回复、点按回应、特效、投票、附件和群组管理。
  </Card>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    iMessage 私信默认使用配对模式。
  </Card>
  <Card title="远程 Mac" icon="terminal" href="#remote-mac-over-ssh">
    当 Gateway 网关未在“信息”所在的 Mac 上运行时，请使用 SSH 包装脚本。
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
brew update && brew upgrade imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

        当本地设置向导检测到默认的 `imsg` 命令缺失时，可以提示通过 Homebrew 安装 `steipete/tap/imsg`。如果检测到由 Homebrew 管理的 `imsg`，则可以提示重新安装或更新。不会修改自定义的 `cliPath` 包装脚本。

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

        配对请求将在 1 小时后过期。
      </Step>
    </Steps>

  </Tab>

  <Tab title="通过 SSH 连接远程 Mac">
    大多数设置不需要 SSH。仅当 Gateway 网关无法在已登录“信息”的 Mac 上运行时，才使用此拓扑。OpenClaw 只需要兼容 stdio 的 `cliPath`，因此可以将 `cliPath` 指向一个包装脚本，由该脚本通过 SSH 连接远程 Mac 并运行 `imsg`。
    请在该远程 Mac 上安装和更新 `imsg`，而不是在 Gateway 网关主机上：

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    启用附件时的推荐配置：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // 用于通过 SCP 获取附件
      includeAttachments: true,
      // 可选：额外允许的附件根目录（与默认的
      // /Users/*/Library/Messages/Attachments 合并）。
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    如果未设置 `remoteHost`，OpenClaw 会尝试通过解析 SSH 包装脚本自动检测它。
    `remoteHost` 必须是 `host` 或 `user@host`（不得包含空格或 SSH 选项）；不安全的值会被忽略。
    OpenClaw 对 SCP 使用严格的主机密钥检查，因此中继主机密钥必须已存在于 `~/.ssh/known_hosts` 中。
    附件路径会根据允许的根目录（`attachmentRoots` / `remoteAttachmentRoots`）进行验证。

<Warning>
放在 `imsg` 前面的任何 `cliPath` 包装脚本或 SSH 代理，都必须表现为适用于长时间运行 JSON-RPC 的透明 stdio 管道。在渠道的整个生命周期内，OpenClaw 会通过包装脚本的 stdin/stdout 交换以换行符分帧的小型 JSON-RPC 消息：

- 一旦有字节可用，便**立即**转发每个 stdin 数据块/行——不要等待 EOF。
- 及时反向转发每个 stdout 数据块/行。
- 保留换行符。
- 避免使用固定大小的阻塞读取（`read(4096)`、`cat | buffer`、默认 shell `read`），否则小型帧可能得不到处理。
- 将 stderr 与 JSON-RPC stdout 流分开。

如果包装脚本将 stdin 缓冲到填满大块数据后才发送，就会产生类似 iMessage 中断的症状——`imsg rpc timeout (chats.list)` 或渠道反复重启——即使 `imsg rpc` 本身运行正常。上面的 `ssh -T host imsg "$@"` 是安全的，因为它会转发 OpenClaw 的 `cliPath` 参数，例如 `rpc` 和 `--db`。而 `ssh host imsg | grep -v '^DEBUG'` 之类的管道则不安全——即使是行缓冲工具也可能滞留帧；如果必须过滤，请在每个阶段使用 `stdbuf -oL -eL`。
</Warning>

  </Tab>
</Tabs>

## 要求和权限（macOS）

- 必须在运行 `imsg` 的 Mac 上登录“信息”。
- 运行 OpenClaw/`imsg` 的进程上下文需要“完全磁盘访问权限”（用于访问“信息”数据库）。
- 通过 Messages.app 发送消息需要“自动化”权限。
- 对于高级操作（回应 / 编辑 / 撤回 / 话题串回复 / 特效 / 投票 / 群组操作），必须禁用“系统完整性保护”——请参阅[启用 imsg 私有 API](#enabling-the-imsg-private-api)。无需禁用即可进行基本的文本和媒体收发。

<Tip>
权限按进程上下文授予。如果 Gateway 网关以无头方式运行（LaunchAgent/SSH），请在同一上下文中运行一次交互式命令以触发权限提示：

```bash
imsg chats --limit 1
# 或
imsg send <handle> "测试"
```

</Tip>

<Accordion title="SSH 包装脚本发送失败，出现 AppleEvents -1743">
  远程 SSH 设置可能可以读取聊天、通过 `channels status --probe`，并处理入站消息，但出站发送仍会因 AppleEvents 授权错误而失败：

```text
无权向“信息”发送 Apple 事件。(-1743)
```

检查已登录 Mac 用户的 TCC 数据库或 System Settings > Privacy & Security > Automation。如果“自动化”条目记录的是 `/usr/libexec/sshd-keygen-wrapper`，而不是 `imsg` 或本地 shell 进程，则 macOS 可能不会为该 SSH 服务端客户端提供可用的“信息”开关：

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

在这种状态下，重复执行 `tccutil reset AppleEvents` 或通过同一个 SSH 包装脚本重新运行 `imsg send` 可能仍会失败，因为需要“信息”自动化权限的进程上下文是 SSH 包装脚本，而不是 UI 可以授权的应用。

请改用以下受支持的 `imsg` 进程上下文之一：

- 在已登录“信息”的用户本地会话中运行 Gateway 网关，或至少运行 `imsg` 桥接器。
- 从同一会话授予“完全磁盘访问权限”和“自动化”权限后，使用该用户的 LaunchAgent 启动 Gateway 网关。
- 如果保留双用户 SSH 拓扑，请在启用渠道之前，验证真实的出站 `imsg send` 能否通过确切的包装脚本成功执行。如果无法授予“自动化”权限，请重新配置为单用户 `imsg` 设置，而不是依赖 SSH 包装脚本进行发送。

</Accordion>

## 启用 imsg 私有 API

`imsg` 提供两种运行模式。对于 OpenClaw，推荐使用私有 API 模式，因为它能为渠道提供用户期望的原生 iMessage 操作。基本模式仍适用于低风险安装、初始验证，或无法禁用 SIP 的主机。

- **基本模式**（默认，无需更改 SIP）：通过 `send` 发送文本和媒体、入站监听/历史记录、聊天列表。这是全新安装 `brew install steipete/tap/imsg` 并授予上述标准 macOS 权限后即可获得的功能。
- **私有 API 模式**：`imsg` 会将辅助 dylib 注入 `Messages.app`，以调用内部 `IMCore` 函数。这样可以解锁 `react`、`edit`、`unsend`、`reply`（话题串）、`sendWithEffect`、`poll` 和 `poll-vote`（“信息”原生投票）、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`，以及正在输入指示器和已读回执。

本页推荐的操作功能面需要使用私有 API 模式。`imsg` README 明确说明了这一要求：

> `read`、`typing`、`launch`、由桥接器支持的富媒体发送、消息修改和聊天管理等高级功能需要主动启用。它们要求禁用 SIP，并将辅助 dylib 注入 `Messages.app`。启用 SIP 时，`imsg launch` 会拒绝注入。

辅助注入技术使用 `imsg` 自身的 dylib 来访问“信息”私有 API。OpenClaw iMessage 路径中不存在第三方服务器或 BlueBubbles 运行时。

<Warning>
**禁用 SIP 会带来切实的安全权衡。** SIP 是 macOS 防止运行已修改系统代码的核心保护机制之一；在整个系统范围内将其关闭会增加攻击面并产生其他副作用。尤其需要注意的是，**在 Apple Silicon Mac 上禁用 SIP 还会导致无法在 Mac 上安装和运行 iOS 应用**。

请将其视为一项经过审慎考虑的运维选择，尤其是在主要个人 Mac 上。要实现生产级 OpenClaw iMessage，建议使用专用 Mac 或专用机器人 macOS 用户，以便放心启用桥接器。如果你的威胁模型无法容忍在任何位置关闭 SIP，则内置 iMessage 仅限基本模式——只能收发文本和媒体，不支持回应 / 编辑 / 撤回 / 特效 / 群组操作。
</Warning>

### 设置

1. 在运行 Messages.app 的 Mac 上**安装（或升级）`imsg`**：

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 输出会报告 `bridge_version`、`rpc_methods` 和每种方法的 `selectors`，以便在开始前了解当前构建版本支持哪些功能。

2. **禁用系统完整性保护，并且（在现代 macOS 上）禁用库验证。** 将非 Apple 的辅助 dylib 注入由 Apple 签名的 `Messages.app`，需要关闭 SIP **并**放宽库验证。恢复模式下的 SIP 操作因 macOS 版本而异：
   - **macOS 10.13-10.15（Sierra-Catalina）：** 通过终端禁用库验证，重新启动进入恢复模式，运行 `csrutil disable`，然后重新启动。
   - **macOS 11+（Big Sur 及更高版本），Intel：** 进入恢复模式（或互联网恢复），运行 `csrutil disable`，然后重新启动。
   - **macOS 11+，Apple 芯片：** 使用电源按钮启动流程进入恢复模式；在较新的 macOS 版本中，点击 Continue 时按住 **Left Shift** 键，然后运行 `csrutil disable`。虚拟机设置采用单独的流程，因此请先创建虚拟机快照。

   **在 macOS 11 及更高版本中，仅执行 `csrutil disable` 通常还不够。** Apple 仍将 `Messages.app` 作为平台二进制文件实施库验证，因此即使 SIP 已关闭，临时签名的辅助程序仍会被拒绝（`Library Validation failed: ... platform binary, but mapped file is not`）。禁用 SIP 后，还需禁用库验证并重新启动：

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26（Tahoe），已在 26.5.1 上验证：** 关闭 SIP **并**执行上面的 `DisableLibraryValidation` 命令，即足以在 26.0 至 26.5.x 上注入辅助程序。**无需 boot-args。** 该 plist 是决定性因素，也是 Tahoe 上注入失败时最常遗漏的步骤：
   - **存在该 plist 时：** `imsg launch` 会完成注入，且 `imsg status` 会报告 `advanced_features: true`。
   - **不存在该 plist 时（即使 SIP 已关闭）：** `imsg launch` 会失败并显示 `Failed to launch: Timeout waiting for Messages.app to initialize`。AMFI 会在加载时拒绝临时签名的辅助程序，因此桥接器始终无法就绪，启动最终会超时。该超时是大多数人在 Tahoe 上遇到的症状；修复方法是添加上述 plist，而不是采取更激进的措施。

   如果 macOS 升级后，`imsg launch` 注入或特定的 `selectors` 开始返回 false，通常是此门控导致的。在认定 SIP 步骤本身失败之前，请检查 SIP 和库验证状态。如果这些设置正确，但桥接器仍无法注入，请收集 `imsg status --json` 以及 `imsg launch` 的输出，并向 `imsg` 项目报告，而不是进一步削弱其他系统级安全控制。

3. **注入辅助程序。** 在 SIP 已禁用且 Messages.app 已登录的情况下：

   ```bash
   imsg launch
   ```

   SIP 仍启用时，`imsg launch` 会拒绝注入，因此这也可用于确认第 2 步已生效。

4. **通过 OpenClaw 验证桥接器：**

   ```bash
   openclaw channels status --probe
   ```

   iMessage 条目应报告 `works`，而 `imsg status --json | jq '{rpc_methods, selectors}'` 应显示你的 macOS 构建所开放的能力。创建投票需要 `selectors.pollPayloadMessage`；投票需要同时具备 `selectors.pollVoteMessage` 和 `poll.vote` RPC 方法。OpenClaw 插件仅公布缓存探测所支持的操作；缓存为空时则保持乐观，并在首次分派时进行探测。

如果 `openclaw channels status --probe` 将渠道报告为 `works`，但特定操作在分派时抛出“iMessage `<action>` requires the imsg private API bridge”，请再次运行 `imsg launch`——辅助程序可能会脱离（Messages.app 重新启动、操作系统更新等），而缓存的 `available: true` 状态会继续公布这些操作，直到下一次探测刷新为止。

### SIP 保持启用时

如果你的威胁模型不允许禁用 SIP：

- `imsg` 会回退到基本模式——仅支持文本、媒体和接收。
- OpenClaw 插件仍会公布文本/媒体发送和入站监控；它会从操作界面隐藏 `react`、`edit`、`unsend`、`reply`、`sendWithEffect` 和群组操作（依据各方法的能力门控）。
- 你可以在另一台非 Apple 芯片 Mac（或专用机器人 Mac）上关闭 SIP 来运行 iMessage 工作负载，同时在主要设备上保持 SIP 启用。请参阅下文的[专用机器人 macOS 用户（独立的 iMessage 身份）](#deployment-patterns)。

## 访问控制和路由

<Tabs>
  <Tab title="私信策略">
    `channels.imessage.dmPolicy` 控制私信：

    - `pairing`（默认）
    - `allowlist`（要求至少有一个 `allowFrom` 条目）
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    允许列表字段：`channels.imessage.allowFrom`。

    允许列表条目必须标识发送者：句柄或静态发送者访问组（`accessGroup:<name>`）。对于 `chat_id:*`、`chat_guid:*` 或 `chat_identifier:*` 等聊天目标，请使用 `channels.imessage.groupAllowFrom`；对于数字形式的 `chat_id` 注册表键，请使用 `channels.imessage.groups`。

  </Tab>

  <Tab title="群组策略 + 提及">
    `channels.imessage.groupPolicy` 控制群组处理：

    - `allowlist`（默认）
    - `open`
    - `disabled`

    群组发送者允许列表：`channels.imessage.groupAllowFrom`。

    `groupAllowFrom` 条目也可以引用静态发送者访问组（`accessGroup:<name>`）。

    运行时回退：如果未设置 `groupAllowFrom`，iMessage 群组发送者检查将使用 `allowFrom`；当私信和群组的准入规则应不同时，请设置 `groupAllowFrom`。显式为空的 `groupAllowFrom: []` 不会回退——在 `allowlist` 下，它会阻止所有群组发送者。
    运行时说明：如果完全缺少 `channels.imessage`，运行时将回退到 `groupPolicy="allowlist"` 并记录警告（即使已设置 `channels.defaults.groupPolicy`）。

    <Warning>
    `groupPolicy: "allowlist"` 下的群组路由会连续执行**两道**门控：

    1. **发送者允许列表**（`channels.imessage.groupAllowFrom`）——句柄、`accessGroup:<name>`、`chat_guid`、`chat_identifier` 或 `chat_id`。有效列表为空（没有 `groupAllowFrom`，也没有 `allowFrom` 回退）时，会阻止所有群组发送者。
    2. **群组注册表**（`channels.imessage.groups`）——映射中存在条目后即强制执行：聊天必须匹配显式的单个 `chat_id` 条目或 `groups: { "*": { ... } }` 通配符。`groups` 为空或缺失时，仅由发送者允许列表决定是否准入。

    如果未配置有效的群组发送者允许列表，所有群组消息都会在注册表门控之前被丢弃。每道门控在默认日志级别下都有各自的 `warn` 级信号，并分别指出不同的修复方法：

    - 启动时每个账户记录一次，当有效的群组发送者允许列表为空时：`imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`——通过设置 `channels.imessage.groupAllowFrom`（或 `allowFrom`）修复；仅添加 `groups` 条目仍会让门控 1 阻止所有发送者。
    - 运行时每个 `chat_id` 记录一次，当发送者通过门控 1，但聊天不在已有内容的 `groups` 注册表中时：`imessage: dropping group message from chat_id=<id> ...`——通过在 `channels.imessage.groups` 下添加该 `chat_id`（或 `"*"`）来修复。

    私信不受影响——它们采用不同的代码路径。

    `groupPolicy: "allowlist"` 下群组消息流的推荐配置：

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

    仅 `groupAllowFrom` 就允许这些发送者进入任何群组；添加 `groups` 块可限定允许哪些聊天（并设置 `requireMention` 等每聊天选项）。
    </Warning>

    群组的提及门控：

    - iMessage 没有原生提及元数据
    - 提及检测使用正则表达式模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 如果未配置任何模式，则无法强制执行提及门控
    - 来自已授权发送者的控制命令会绕过提及门控

    每群组 `systemPrompt`：

    `channels.imessage.groups.*` 下的每个条目都接受可选的 `systemPrompt` 字符串；每次处理该群组中的消息时，都会将其注入智能体的系统提示词。解析方式与 `channels.whatsapp.groups` 相同：

    1. **群组专属系统提示词**（`groups["<chat_id>"].systemPrompt`）：当映射中存在特定群组条目，**并且**其 `systemPrompt` 键已定义时使用。如果 `systemPrompt` 是空字符串（`""`），则会抑制通配符，并且不对该群组应用任何系统提示词。
    2. **群组通配符系统提示词**（`groups["*"].systemPrompt`）：当映射中完全不存在特定群组条目，或者该条目存在但未定义 `systemPrompt` 键时使用。

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "使用英式拼写。" },
            "8421": {
              requireMention: true,
              systemPrompt: "这是值班轮换聊天。回复请控制在 3 句话以内。",
            },
            "9907": {
              // 显式抑制：通配符“使用英式拼写。”不适用于此处
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    每群组提示词仅适用于群组消息——私信不受影响。

  </Tab>

  <Tab title="会话和确定性回复">
    - 私信使用直接路由；群组使用群组路由。
    - 使用默认的 `session.dmScope=main` 时，iMessage 私信会归入智能体的主会话。
    - 群组会话相互隔离（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回复会使用来源渠道/目标元数据路由回 iMessage。

    类群组线程行为：

    某些多参与者 iMessage 线程到达时可能带有 `is_group=false`。
    如果该 `chat_id` 已在 `channels.imessage.groups` 下显式配置，OpenClaw 会将其视为群组流量（群组门控 + 群组会话隔离）。

  </Tab>
</Tabs>

## ACP 对话绑定

iMessage 聊天可以绑定到 ACP 会话。

快速操作流程：

- 在私信或允许的群聊中运行 `/acp spawn codex --bind here`。
- 此后，同一 iMessage 对话中的消息会路由到新生成的 ACP 会话。
- `/new` 和 `/reset` 会原地重置同一个已绑定 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

配置的持久绑定使用顶层 `bindings[]` 条目，其中包含 `type: "acp"` 和 `match.channel: "imessage"`。

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

有关共享的 ACP 绑定行为，请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

## 部署模式

<AccordionGroup>
  <Accordion title="专用机器人 macOS 用户（独立的 iMessage 身份）">
    使用专用 Apple ID 和 macOS 用户，将机器人流量与你的个人 Messages 资料隔离。

    典型流程：

    1. 创建/登录一个专用的 macOS 用户。
    2. 在该用户中使用机器人的 Apple ID 登录 Messages。
    3. 在该用户中安装 `imsg`。
    4. 创建一个 SSH 包装脚本，以便 OpenClaw 能在该用户上下文中运行 `imsg`。
    5. 将 `channels.imessage.accounts.<id>.cliPath` 和 `.dbPath` 指向该用户配置文件。

    首次运行可能需要在该机器人用户会话中进行 GUI 授权（Automation + Full Disk Access）。

  </Accordion>

  <Accordion title="通过 Tailscale 连接远程 Mac（示例）">
    常见拓扑：

    - Gateway 网关运行在 Linux/VM 上
    - iMessage + `imsg` 运行在 tailnet 中的一台 Mac 上
    - `cliPath` 包装脚本使用 SSH 运行 `imsg`
    - `remoteHost` 启用通过 SCP 获取附件

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

    使用 SSH 密钥，使 SSH 和 SCP 均可非交互式运行。
    请先确保主机密钥受信任（例如 `ssh bot@mac-mini.tailnet-1234.ts.net`），以便填充 `known_hosts`。

  </Accordion>

  <Accordion title="多账户模式">
    iMessage 支持在 `channels.imessage.accounts` 下进行按账户配置。

    每个账户都可以覆盖 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、历史记录设置和附件根目录允许列表等字段。

  </Accordion>

  <Accordion title="私信历史记录">
    设置 `channels.imessage.dmHistoryLimit`，以使用该对话最近解码的 `imsg` 历史记录初始化新的私信会话。使用 `channels.imessage.dms["<sender>"].historyLimit` 设置按发送者覆盖项，包括使用 `0` 为某个发送者禁用历史记录。

    iMessage 私信历史记录按需从 `imsg` 获取。未设置 `dmHistoryLimit` 会禁用全局私信历史记录初始化，但正数的按发送者 `channels.imessage.dms["<sender>"].historyLimit` 仍会为该发送者启用初始化。

  </Accordion>
</AccordionGroup>

## 媒体、分块和投递目标

<AccordionGroup>
  <Accordion title="附件和媒体">
    - 入站附件摄取**默认关闭**——设置 `channels.imessage.includeAttachments: true`，将照片、语音备忘录、视频和其他附件转发给智能体。禁用时，仅包含附件的 iMessage 会在到达智能体前被丢弃，并且可能根本不会产生 `Inbound message` 日志行。
    - 设置 `remoteHost` 后，可通过 SCP 获取远程附件路径
    - 附件路径必须匹配允许的根目录：
      - `channels.imessage.attachmentRoots`（本地）
      - `channels.imessage.remoteAttachmentRoots`（远程 SCP 模式）
      - 配置的根目录会扩展默认根目录模式 `/Users/*/Library/Messages/Attachments`（合并，而非替换）
    - SCP 使用严格的主机密钥检查（`StrictHostKeyChecking=yes`）
    - 出站媒体大小使用 `channels.imessage.mediaMaxMb`（默认 16 MB）

  </Accordion>

  <Accordion title="出站文本和分块">
    - 文本分块限制：`channels.imessage.textChunkLimit`（默认 4000）
    - 分块模式：`channels.imessage.streaming.chunkMode`
      - `length`（默认）
      - `newline`（优先按段落拆分）
    - 出站 Markdown 粗体/斜体/下划线/删除线会转换为原生样式文本（macOS 15+ 接收者会渲染这些样式；旧版系统的接收者会看到不带标记的纯文本）；Markdown 表格会根据渠道的 Markdown 表格模式进行转换
    - `channels.imessage.sendTransport`（`auto` 为默认值，另有 `bridge`、`applescript`）用于选择 `imsg` 如何投递发送内容

  </Accordion>

  <Accordion title="寻址格式">
    建议使用明确的目标：

    - `chat_id:123`（建议用于稳定路由）
    - `chat_guid:...`
    - `chat_identifier:...`

    也支持使用用户标识作为目标：

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## 私有 API 操作

当 `imsg launch` 正在运行且 `openclaw channels status --probe` 报告 `privateApi.available: true` 时，消息工具除发送普通文本外，还可以使用 iMessage 原生操作。

所有操作默认启用；使用 `channels.imessage.actions` 可单独关闭操作：

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
    - **回应**：添加/移除 iMessage 点按回应（`messageId`、`emoji`、`remove`）。支持的点按回应分别对应喜爱、赞、踩、大笑、强调和疑问。不提供表情符号进行移除时，会清除已设置的任意点按回应。
    - **回复**：向现有消息发送对话串回复（`messageId`、`text` 或 `message`，以及 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。带附件回复还需要一个 `imsg` 构建，其 `send-rich` 支持 `--file`。
    - **带效果发送**：使用 iMessage 效果发送文本（`text` 或 `message`，以及 `effect` 或 `effectId`）。简称：slam、loud、gentle、invisibleink、confetti、lasers、fireworks、balloon、heart、echo、happybirthday、shootingstar、sparkles、spotlight。
    - **编辑**：在受支持的 macOS/私有 API 版本上编辑已发送的消息（`messageId`、`text` 或 `newText`）。只能编辑 Gateway 网关自身发送的消息。
    - **撤回**：在受支持的 macOS/私有 API 版本上撤回已发送的消息（`messageId`）。只能撤回 Gateway 网关自身发送的消息。
    - **上传文件**：发送媒体/文件（`buffer` 以 base64 形式提供，或使用已注入内容的 `media`/`path`/`filePath`、`filename`，可选 `asVoice`）。旧版别名：`sendAttachment`。
    - **重命名群组**、**设置群组图标**、**添加参与者**、**移除参与者**、**退出群组**：当前目标为群聊时管理该群聊。这些操作会更改主机的 Messages 身份，因此要求发送者是所有者或使用 `operator.admin` Gateway 网关客户端。
    - **投票**：创建原生 Apple Messages 投票（`pollQuestion`、重复 2 到 12 次的 `pollOption`，以及 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。使用 iOS/iPadOS/macOS 26+ 的接收者可原生查看并投票；旧版操作系统会收到“已发送投票”的文本回退消息。需要 `selectors.pollPayloadMessage`。
    - **投票表决**：对现有投票进行表决（`pollId` 或 `messageId`，并且必须且只能提供 `pollOptionIndex`、`pollOptionId` 或 `pollOptionText` 中的一个）。需要 `selectors.pollVoteMessage` 和 `poll.vote` RPC 方法。

    已接受的入站投票会呈现给智能体，其中包括问题、带编号的选项标签、票数，以及 `poll-vote` 所需的投票消息 ID。

  </Accordion>

  <Accordion title="消息 ID">
    入站 iMessage 上下文在可用时同时包含短 `MessageSid` 值和完整消息 GUID（`MessageSidFull`）。短 ID 的作用域限于近期基于 SQLite 的回复缓存，使用前会根据当前聊天进行检查。如果短 ID 已过期，请在将目标设为提供该 ID 的对话时，使用其 `MessageSidFull` 重试。完整 ID 不会绕过对话或账户绑定，因此请将来自其他聊天的 ID 替换为当前目标聊天中的 ID。当无法取得当前对话证据时，远程委托调用可能会拒绝过期的完整 ID。

  </Accordion>

  <Accordion title="能力检测">
    仅当缓存的探测状态表明桥接不可用时，OpenClaw 才会隐藏私有 API 操作。如果状态未知，操作仍保持可见，并会在分派时延迟探测，使 `imsg launch` 后的首次操作无需单独手动刷新状态即可成功。

  </Accordion>

  <Accordion title="已读回执和正在输入状态">
    私有 API 桥接启动后，已接受的入站聊天会被标记为已读；轮次一经接受，私聊就会立即显示正在输入气泡，同时智能体准备上下文并生成内容。可使用以下配置禁用已读标记：

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    早于按方法能力列表机制的旧版 `imsg` 构建会静默禁用正在输入状态/已读功能；OpenClaw 每次重启仅记录一次警告，以便明确缺失回执的原因。

  </Accordion>

  <Accordion title="入站点按回应">
    OpenClaw 会订阅 iMessage 点按回应，并将已接受的回应作为系统事件路由，而非普通消息文本，因此用户的点按回应不会触发常规回复循环。

    通知模式由 `channels.imessage.reactionNotifications` 控制：

    - `"own"`（默认）：仅当用户回应机器人发送的消息时通知。
    - `"all"`：通知来自已授权发送者的所有入站点按回应。
    - `"off"`：忽略入站点按回应。

    按账户覆盖项使用 `channels.imessage.accounts.<id>.reactionNotifications`。

  </Accordion>

  <Accordion title="审批回应（👍 / 👎）">
    当 `approvals.exec.enabled` 或 `approvals.plugin.enabled` 为 true，且请求路由到 iMessage 时，Gateway 网关会以原生方式投递审批提示，并接受点按回应来完成审批：

    - `👍`（“赞”点按回应）→ `allow-once`
    - `👎`（“踩”点按回应）→ `deny`
    - `allow-always` 保留为手动回退方式：将 `/approve <id> allow-always` 作为普通回复发送。

    回应处理要求作出回应的用户标识是明确的审批者。审批者列表从 `channels.imessage.allowFrom`（或 `channels.imessage.accounts.<id>.allowFrom`）读取；添加采用 E.164 格式的用户电话号码或其 Apple ID 电子邮件地址（`chat_id:*` 等聊天目标不是有效的审批者条目）。支持通配符条目 `"*"`，但它会允许任何发送者审批；审批者列表为空则会完全禁用回应快捷方式。回应快捷方式会有意绕过 `reactionNotifications`、`dmPolicy` 和 `groupAllowFrom`，因为明确的审批者允许列表是审批处理唯一相关的门控条件。

    `/approve` 文本命令授权遵循同一列表：当 `channels.imessage.allowFrom` 非空时，`/approve <id> <decision>` 会根据该审批者列表进行授权（而不是更宽泛的私信允许列表），获私信允许列表许可但未列入 `allowFrom` 的发送者会收到明确的拒绝。当 `allowFrom` 为空时，同一聊天回退机制继续生效，`/approve` 会授权私信允许列表所许可的任何人。将所有应当通过 `/approve` 或回应进行审批的操作员添加到 `allowFrom`。

    操作员说明：
    - 表情回应绑定同时存储在内存和 Gateway 网关的持久化键值存储中（TTL 与审批到期时间一致），Gateway 网关还会轮询待处理提示中的 tapback，因此在 Gateway 网关重启后不久到达的 tapback 仍可完成审批。
    - 当操作员自己的 `is_from_me=true` tapback（例如来自已配对的 Apple 设备）对应的句柄是明确指定的审批者时，该 tapback 会完成审批。
    - 只有配置了明确的审批者时，审批提示才会路由到群组对话中；否则任何群组成员都可以批准。
    - 旧版文本样式的 tapback（来自非常旧的 Apple 客户端的 `Liked "…"` 纯文本）无法完成审批，因为它们不携带消息 GUID；解析表情回应需要当前 macOS / iOS 客户端发出的结构化 tapback 元数据。

  </Accordion>
</AccordionGroup>

## 配置写入

默认情况下，iMessage 允许由渠道发起配置写入（用于 `/config set|unset`，当 `commands.config: true` 时）。

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

## 合并拆分发送的私信（在一次编写中包含命令和 URL）

当用户同时输入命令和 URL 时（例如 `Dump https://example.com/article`），Apple 的 Messages 应用会将发送内容拆分为**两个独立的 `chat.db` 行**：

1. 一条文本消息（`"Dump"`）。
2. 一个 URL 预览气泡（`"https://..."`），其中包含作为附件的 OG 预览图像。

在大多数设置中，这两行会相隔约 0.8-2.0 秒到达 OpenClaw。如果不合并，智能体会在第 1 轮只收到命令（并且通常会回复“请把 URL 发给我”），随后 URL 才会在第 2 轮到达。这是 Apple 的发送管线所致，并非 OpenClaw 或 `imsg` 引入的行为。

`channels.imessage.coalesceSameSenderDms` 可让私信选择缓冲来自同一发送者的连续行。当 `imsg` 在某个源行上公开结构化 URL 预览标记 `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` 时，OpenClaw 只会合并该真实的拆分发送，并将其他已缓冲行保留为独立轮次。在完全不发出气泡元数据的旧版 `imsg` 构建中，OpenClaw 无法区分拆分发送和单独发送，因此会回退为合并整个分组。这样可以保留引入元数据之前的行为，避免 `Dump <url>` 拆分发送退化为两个轮次。群聊仍按消息逐条分派，以保留多用户轮次结构。

<Tabs>
  <Tab title="何时启用">
    在以下情况下启用：

    - 你发布的 Skills 需要在一条消息中接收 `command + payload`（转储、粘贴、保存、排队等）。
    - 你的用户会将 URL 与命令一起粘贴。
    - 你可以接受增加的私信轮次延迟（见下文）。

    在以下情况下保持禁用：

    - 你需要让单词私信触发器具有最低的命令延迟。
    - 你的所有流程都是不带后续有效载荷的一次性命令。

  </Tab>
  <Tab title="启用">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // 选择启用（默认值：false）
        },
      },
    }
    ```

    启用该标志且未显式设置 `messages.inbound.byChannel.imessage` 或全局 `messages.inbound.debounceMs` 时，防抖窗口将扩大到 **7000 ms**（旧版默认值为 0 ms，即不进行防抖）。之所以需要更宽的窗口，是因为 Apple 的 URL 预览拆分发送间隔可能延长至数秒，而 Messages.app 会在此期间发出预览行。

    自行调整窗口：

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms 可覆盖观察到的 Messages.app URL 预览延迟。
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="权衡">
    - **精确合并需要当前的 `imsg` 有效载荷元数据。**存在 `balloon_bundle_id` 时，只会合并真实的拆分发送；上述无元数据回退合并是临时的向后兼容措施，一旦 `imsg` 在上游合并拆分发送，该措施就会移除。
    - **私信消息会增加延迟。**启用该标志后，每条私信（包括独立控制命令和单条文本后续消息）都会在分派前最多等待一个防抖窗口，以防 URL 预览行即将到达。群聊消息仍会立即分派。
    - **合并后的输出有界限。**合并文本上限为 4000 个字符，并带有明确的 `…[truncated]` 标记；附件上限为 20 个；源条目上限为 10 个（超出时保留第一个和最新条目）。每个源 GUID 都会记录在 `coalescedMessageGuids` 中，用于下游遥测。
    - **仅限私信。**群聊会继续按消息逐条分派，确保多人同时输入时机器人仍能及时响应。
    - **按渠道选择启用。**其他渠道（Discord、Slack、Telegram、WhatsApp 等）不受影响。设置了 `channels.bluebubbles.coalesceSameSenderDms` 的旧版 BlueBubbles 配置应将该值迁移到 `channels.imessage.coalesceSameSenderDms`。

  </Tab>
</Tabs>

### 场景以及智能体看到的内容

“启用标志”列显示发出 `balloon_bundle_id` 的 `imsg` 构建上的行为。在完全不发出气泡元数据的旧版 `imsg` 构建中，下方标记为“两个轮次”/“N 个轮次”的行会改为回退至旧版合并（一个轮次）：OpenClaw 无法从结构上区分拆分发送与单独发送，因此会保留引入元数据之前的合并行为。当构建开始发出气泡元数据后，精确分离才会生效。

| 用户编写内容                                                      | `chat.db` 产生的结果                  | 关闭标志（默认）                      | 启用标志 + 窗口（imsg 发出气泡元数据）                                                      |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com`（一次发送）                              | 2 行，间隔约 1 秒                   | 智能体执行两个轮次：先仅收到“Dump”，然后收到 URL | 一个轮次：合并文本 `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption`（附件 + 文本）                | 2 行，不含 URL 气泡元数据 | 两个轮次                               | 观察到元数据后为两个轮次；旧版/锁存前的无元数据会话中为一个合并轮次       |
| `/status`（独立命令）                                     | 1 行                               | 立即分派                        | **最多等待一个窗口，然后分派**                                                                |
| 单独粘贴 URL                                                   | 1 行                               | 立即分派                        | 最多等待一个窗口，然后分派                                                                    |
| 文本 + URL 作为两条有意分开的消息发送，间隔数分钟 | 窗口外的 2 行               | 两个轮次                               | 两个轮次（两者之间窗口已到期）                                                             |
| 快速连续发送（窗口内超过 10 条短私信）                          | N 行，不含 URL 气泡元数据 | N 个轮次                                 | 观察到元数据后为 N 个轮次；旧版/锁存前的无元数据会话中为一个有界合并轮次 |
| 两个人在群聊中输入                                  | 来自 M 个发送者的 N 行               | M+ 个轮次（每个发送者分组一个）        | M+ 个轮次——群聊不会合并                                                            |

## 网桥或 Gateway 网关重启后的入站恢复

iMessage 会恢复 Gateway 网关停机期间遗漏的消息，同时抑制 Apple 在 Push 恢复后可能刷新的陈旧“积压消息轰炸”。默认行为始终启用，并建立在入站去重机制之上。

- **重放去重。**每条已分派的入站消息都会根据其 Apple GUID 记录在持久化插件状态（`imessage.inbound-dedupe`）中，在摄取时认领，并在处理后提交（发生瞬时故障时释放，以便重试）。已处理的任何内容都会被丢弃，而不会重复分派。正是这一机制让恢复过程可以积极重放，而无需逐条记录消息。
- **停机恢复。**启动时，监视器会记住最后分派的 `chat.db` rowid（持久化的按账户游标），并将其作为 `since_rowid` 传递给 `imsg watch.subscribe`，使 imsg 重放 Gateway 网关停机期间到达的行，然后开始跟踪实时消息。重放范围限定为最近的 500 行以及最多约 2 小时前的消息，去重机制会丢弃任何已处理内容。
- **陈旧积压消息年龄边界。**启动边界以上的行是真正的实时消息；如果某行的发送日期比到达时间早超过约 15 分钟，则它属于 Push 刷新的积压消息，会被抑制。重放行（位于边界或边界以下）则使用更宽的恢复窗口，因此最近遗漏的消息会送达，而久远的历史消息不会送达。

恢复功能适用于本地和远程 `cliPath` 设置，因为 `since_rowid` 重放通过同一个 `imsg` RPC 连接运行。区别在于窗口：当 Gateway 网关能够读取 `chat.db`（本地）时，它会确定启动 rowid 边界、限制重放跨度，并送达最多约两小时前遗漏的消息。通过远程 SSH `cliPath` 时，它无法读取数据库，因此重放不设上限，并且每一行都使用实时年龄边界——它仍会恢复最近遗漏的消息并抑制旧积压消息，只是使用较窄的实时窗口。若要使用更宽的恢复窗口，请在运行 Messages 的 Mac 上运行 Gateway 网关。

### 操作员可见信号

被抑制的积压消息会以默认级别记录日志，绝不会静默丢弃（`recovery` 标志会显示应用了哪个窗口）：

```text
imessage: 已抑制陈旧入站积压消息 account=<id> sent=<iso> recovery=<bool>（启动以来已抑制 <N> 条）
```

### 迁移

`channels.imessage.catchup.*` 已弃用——停机恢复是自动的，新设置无需配置。包含 `catchup.enabled: true` 的现有配置仍会作为恢复重放窗口的兼容性配置文件受到支持。已禁用的追赶块（`enabled: false` 或缺少 `enabled: true`）已停用；`openclaw doctor --fix` 会移除这些块。

## 故障排查

<AccordionGroup>
  <Accordion title="找不到 imsg 或不支持 RPC">
    验证二进制文件和 RPC 支持：

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    如果探测报告不支持 RPC，请更新 `imsg`。如果私有 API 操作不可用，请在已登录的 macOS 用户会话中运行 `imsg launch`，然后再次探测。如果 Gateway 网关未在 macOS 上运行，请改用上述通过 SSH 连接远程 Mac 的设置，而不是默认的本地 `imsg` 路径。

  </Accordion>

  <Accordion title="Messages 可以发送，但入站 iMessage 无法到达">
    首先确认消息是否已到达本地 Mac。如果 `chat.db` 没有变化，即使 `imsg status --json` 报告网桥健康，OpenClaw 也无法接收消息。

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    如果手机发送的消息未创建新行，请先修复 macOS Messages 和 Apple Push 层，再更改 OpenClaw 配置。通常执行一次服务刷新即可：

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    从手机发送一条新的 iMessage，并在调试 OpenClaw 会话之前确认出现新的 `chat.db` 行或 `imsg watch` 事件。不要将此操作作为定期重新启动桥接器的循环；在工作进行期间反复执行 `imsg launch` 和重启 Gateway 网关可能会中断消息递送，并使正在进行的渠道运行停滞。

  </Accordion>

  <Accordion title="Gateway 网关未在 macOS 上运行">
    默认的 `cliPath: "imsg"` 必须在已登录 Messages 的 Mac 上运行。在 Linux 或 Windows 上，将 `channels.imessage.cliPath` 设置为一个包装脚本，使其通过 SSH 连接到该 Mac 并运行 `imsg "$@"`。

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
    - 从 Gateway 网关主机进行 SSH/SCP 密钥身份验证
    - Gateway 网关主机上的 `~/.ssh/known_hosts` 中存在主机密钥
    - 运行 Messages 的 Mac 上的远程路径可读性

  </Accordion>

  <Accordion title="错过了 macOS 权限提示">
    在相同用户/会话上下文的交互式 GUI 终端中重新运行，并批准提示：

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    确认已为运行 OpenClaw/`imsg` 的进程上下文授予“完全磁盘访问权限”和“自动化”权限。

  </Accordion>
</AccordionGroup>

## 配置参考链接

- [Configuration reference - iMessage](/zh-CN/gateway/config-channels#imessage)
- [Gateway 配置](/zh-CN/gateway/configuration)
- [配对](/zh-CN/channels/pairing)

## 相关内容

- [渠道概览](/zh-CN/channels) — 所有受支持的渠道
- [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage) — 公告和迁移摘要
- [Coming from BlueBubbles](/zh-CN/channels/imessage-from-bluebubbles) — 配置转换表和分步切换指南
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全性](/zh-CN/gateway/security) — 访问模型和安全加固
