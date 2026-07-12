---
read_when:
    - 设置 iMessage 支持
    - 调试 iMessage 收发
summary: 通过 imsg（基于 stdio 的 JSON-RPC）提供原生 iMessage 支持，并通过私有 API 实现回复、点按回应、特效、投票、附件和群组管理操作。当主机要求符合条件时，建议新的 OpenClaw iMessage 设置优先使用此方案。
title: iMessage
x-i18n:
    generated_at: "2026-07-12T14:18:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 81819aad1a9199791c3c02eb0c9cc72059c663710140b33ba31f79b4bc59d8e2
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
对于常见的 OpenClaw iMessage 部署，请在同一台已登录 macOS Messages 的主机上运行 Gateway 网关和 `imsg`。如果你的 Gateway 网关运行在其他位置，请将 `channels.imessage.cliPath` 指向一个透明的 SSH 包装器，由它在 Mac 上运行 `imsg`。

**入站恢复会自动进行。** Bridge 或 Gateway 网关重启后，iMessage 会重放停机期间错过的消息，并抑制 Apple 在 Push 恢复后可能刷出的过时“积压消息炸弹”，同时进行去重，确保不会重复分发任何内容。无需配置即可启用——请参阅 [Bridge 或 Gateway 网关重启后的入站恢复](#inbound-recovery-after-a-bridge-or-gateway-restart)。
</Note>

<Warning>
BlueBubbles 支持已移除。请将 `channels.bluebubbles` 配置迁移到 `channels.imessage`；OpenClaw 仅通过 `imsg` 支持 iMessage。简要公告请先阅读 [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage)，完整迁移表请参阅 [Coming from BlueBubbles](/zh-CN/channels/imessage-from-bluebubbles)。
</Warning>

状态：原生外部 CLI 集成。Gateway 网关会启动 `imsg rpc`，并通过 stdio 使用 JSON-RPC 通信——无需单独的守护进程或端口。强烈建议使用私有 API 模式，以获得完整的 iMessage 渠道功能；回复、点按回应、特效、投票、附件回复和群组操作都需要运行 `imsg launch`，并成功通过私有 API 探测。

对于常见的本地设置，OpenClaw 设置流程可在已登录 Messages 的 Mac 上，经用户确认后通过 Homebrew 安装或更新 `imsg`。手动设置和 SSH 包装器拓扑仍由操作员管理：请在将运行 Gateway 网关或包装器的同一用户上下文中安装或更新 `imsg`。

<CardGroup cols={3}>
  <Card title="私有 API 操作" icon="wand-sparkles" href="#private-api-actions">
    回复、点按回应、特效、投票、附件和群组管理。
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
brew update && brew upgrade imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

        当本地设置向导检测到默认的 `imsg` 命令缺失时，它可以提示通过 Homebrew 安装 `steipete/tap/imsg`。如果检测到由 Homebrew 管理的 `imsg`，它可以提示重新安装或更新。不会修改自定义的 `cliPath` 包装器。

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

  <Tab title="通过 SSH 使用远程 Mac">
    大多数设置不需要 SSH。仅当 Gateway 网关无法运行在已登录 Messages 的 Mac 上时，才使用此拓扑。OpenClaw 只要求 `cliPath` 兼容 stdio，因此你可以将 `cliPath` 指向一个包装器脚本，由它通过 SSH 连接远程 Mac 并运行 `imsg`。
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

    如果未设置 `remoteHost`，OpenClaw 会尝试通过解析 SSH 包装器脚本自动检测它。
    `remoteHost` 必须为 `host` 或 `user@host`（不能包含空格或 SSH 选项）；不安全的值会被忽略。
    OpenClaw 对 SCP 使用严格的主机密钥检查，因此中继主机密钥必须已存在于 `~/.ssh/known_hosts` 中。
    附件路径会根据允许的根目录（`attachmentRoots` / `remoteAttachmentRoots`）进行验证。

<Warning>
任何放在 `imsg` 前面的 `cliPath` 包装器或 SSH 代理都**必须**像透明的 stdio 管道一样处理长时间运行的 JSON-RPC。在渠道的整个生命周期内，OpenClaw 会通过包装器的 stdin/stdout 交换以换行符分帧的小型 JSON-RPC 消息：

- 每个 stdin 数据块或行在**字节一经可用时**就立即转发——不要等待 EOF。
- 及时沿反方向转发每个 stdout 数据块或行。
- 保留换行符。
- 避免使用固定大小的阻塞读取（`read(4096)`、`cat | buffer`、默认 shell `read`），否则可能导致小数据帧得不到处理。
- 将 stderr 与 JSON-RPC stdout 流分开。

如果包装器会缓冲 stdin，直到填满一个大数据块才转发，就会产生类似 iMessage 中断的症状——`imsg rpc timeout (chats.list)` 或渠道反复重启——即使 `imsg rpc` 本身运行正常。上面的 `ssh -T host imsg "$@"` 是安全的，因为它会转发 OpenClaw 的 `cliPath` 参数，例如 `rpc` 和 `--db`。而 `ssh host imsg | grep -v '^DEBUG'` 之类的管道则**不安全**——行缓冲工具仍可能滞留数据帧；如果必须进行过滤，请在每个阶段使用 `stdbuf -oL -eL`。
</Warning>

  </Tab>
</Tabs>

## 要求和权限（macOS）

- 运行 `imsg` 的 Mac 必须已登录 Messages。
- 运行 OpenClaw/`imsg` 的进程上下文需要 Full Disk Access（用于访问 Messages 数据库）。
- 通过 Messages.app 发送消息需要 Automation 权限。
- 对于高级操作（回应 / 编辑 / 撤回 / 线程回复 / 特效 / 投票 / 群组操作），必须禁用 System Integrity Protection——请参阅[启用 imsg 私有 API](#enabling-the-imsg-private-api)。无需禁用它即可进行基本的文本和媒体收发。

<Tip>
权限按进程上下文授予。如果 Gateway 网关以无头方式运行（LaunchAgent/SSH），请在同一上下文中运行一次交互式命令以触发权限提示：

```bash
imsg chats --limit 1
# 或
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH 包装器发送失败并出现 AppleEvents -1743">
  远程 SSH 设置可能可以读取聊天、通过 `channels status --probe` 检查并处理入站消息，但出站发送仍会因 AppleEvents 授权错误而失败：

```text
无权向 Messages 发送 Apple events。(-1743)
```

检查已登录 Mac 用户的 TCC 数据库，或打开 System Settings > Privacy & Security > Automation。如果 Automation 条目记录的是 `/usr/libexec/sshd-keygen-wrapper`，而不是 `imsg` 或本地 shell 进程，macOS 可能无法为该 SSH 服务端客户端提供可用的 Messages 开关：

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

在这种状态下，重复运行 `tccutil reset AppleEvents` 或通过同一 SSH 包装器重新运行 `imsg send` 可能仍会失败，因为需要 Messages Automation 权限的进程上下文是 SSH 包装器，而不是 UI 可以授权的应用。

请改用受支持的 `imsg` 进程上下文之一：

- 在已登录 Messages 用户的本地会话中运行 Gateway 网关，或者至少运行 `imsg` Bridge。
- 从同一会话授予 Full Disk Access 和 Automation 后，使用该用户的 LaunchAgent 启动 Gateway 网关。
- 如果保留双用户 SSH 拓扑，请在启用渠道前确认通过该确切包装器执行实际的出站 `imsg send` 能够成功。如果无法授予 Automation 权限，请改为单用户 `imsg` 设置，而不要依赖 SSH 包装器进行发送。

</Accordion>

## 启用 imsg 私有 API

`imsg` 提供两种运行模式。对于 OpenClaw，建议使用私有 API 模式，因为它能为渠道提供用户所期望的原生 iMessage 操作。基本模式仍适合低风险安装、初始验证，或者无法禁用 SIP 的主机。

- **基本模式**（默认，无需更改 SIP）：通过 `send` 发送出站文本和媒体、监听和查看入站历史记录、列出聊天。这是全新运行 `brew install steipete/tap/imsg` 并授予上述标准 macOS 权限后即可获得的功能。
- **私有 API 模式**：`imsg` 将辅助 dylib 注入 `Messages.app`，以调用内部 `IMCore` 函数。这样可解锁 `react`、`edit`、`unsend`、`reply`（线程式）、`sendWithEffect`、`poll` 和 `poll-vote`（原生 Messages 投票）、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`，以及输入状态指示和已读回执。

本页面推荐的操作功能集需要私有 API 模式。`imsg` README 明确说明了相关要求：

> `read`、`typing`、`launch`、由 Bridge 支持的富内容发送、消息修改和聊天管理等高级功能需要主动启用。它们要求禁用 SIP，并将辅助 dylib 注入 `Messages.app`。启用 SIP 时，`imsg launch` 会拒绝执行注入。

这种辅助注入技术使用 `imsg` 自己的 dylib 来访问 Messages 私有 API。OpenClaw iMessage 路径中没有第三方服务器或 BlueBubbles 运行时。

<Warning>
**禁用 SIP 会带来真实的安全权衡。** SIP 是 macOS 防止运行已修改系统代码的核心保护机制之一；在整个系统范围内将其关闭，会增加额外的攻击面和副作用。尤其需要注意的是，**在 Apple Silicon Mac 上禁用 SIP 还会导致无法在 Mac 上安装和运行 iOS 应用**。

请将此视为一项经过慎重考虑的运维选择，尤其是在主要的个人 Mac 上。对于生产级 OpenClaw iMessage，最好使用专用 Mac 或专用机器人 macOS 用户，并确保你愿意为其启用 Bridge。如果你的威胁模型无法容忍在任何设备上关闭 SIP，内置 iMessage 将只能使用基本模式——仅可收发文本和媒体，不支持回应 / 编辑 / 撤回 / 特效 / 群组操作。
</Warning>

### 设置

1. 在运行 Messages.app 的 Mac 上**安装（或升级）`imsg`**：

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 输出会报告 `bridge_version`、`rpc_methods` 和每个方法的 `selectors`，以便你在开始前查看当前构建支持哪些功能。

2. **禁用 System Integrity Protection，并且（在现代 macOS 上）禁用 Library Validation。** 将非 Apple 的辅助 dylib 注入由 Apple 签名的 `Messages.app`，需要关闭 SIP，**同时**放宽 Library Validation。恢复模式下的 SIP 操作因 macOS 版本而异：
   - **macOS 10.13-10.15 (Sierra-Catalina)：**通过 Terminal 禁用 Library Validation，重启进入 Recovery Mode，运行 `csrutil disable`，然后重新启动。
   - **macOS 11+ (Big Sur and later)，Intel：**进入 Recovery Mode（或 Internet Recovery），运行 `csrutil disable`，然后重新启动。
   - **macOS 11+，Apple Silicon：**使用电源按钮启动流程进入 Recovery；在较新的 macOS 版本中，点击 Continue 时按住 **Left Shift** 键，然后运行 `csrutil disable`。虚拟机设置采用单独的流程，因此请先创建 VM 快照。

   **在 macOS 11 及更高版本中，仅执行 `csrutil disable` 通常还不够。** Apple 仍会对作为平台二进制文件的 `Messages.app` 强制执行库验证，因此即使已关闭 SIP，临时签名的辅助程序也会被拒绝（`Library Validation failed: ... platform binary, but mapped file is not`）。禁用 SIP 后，还需禁用库验证并重新启动：

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe)，已在 26.5.1 上验证：**关闭 SIP **并且**执行上面的 `DisableLibraryValidation` 命令，就足以在 26.0 至 26.5.x 中注入辅助程序。**无需设置 boot-args。**该 plist 是决定性因素，也是 Tahoe 上注入失败时最常遗漏的步骤：
   - **存在该 plist 时：**`imsg launch` 会完成注入，且 `imsg status` 会报告 `advanced_features: true`。
   - **不存在该 plist 时（即使已关闭 SIP）：**`imsg launch` 会失败并显示 `Failed to launch: Timeout waiting for Messages.app to initialize`。AMFI 会在加载时拒绝临时签名的辅助程序，因此桥接永远无法就绪，启动最终超时。这是大多数人在 Tahoe 上遇到的超时症状；修复方法是设置上述 plist，而不是采取更激进的措施。

   如果升级 macOS 后，`imsg launch` 注入失败或特定 `selectors` 开始返回 false，通常就是此验证关卡导致的。在认定 SIP 步骤本身失败之前，请检查 SIP 和库验证状态。如果这些设置正确，但桥接仍无法注入，请收集 `imsg status --json` 和 `imsg launch` 的输出并报告给 `imsg` 项目，而不是进一步削弱系统范围的安全控制。

3. **注入辅助程序。**禁用 SIP 并登录 Messages.app 后：

   ```bash
   imsg launch
   ```

   SIP 仍处于启用状态时，`imsg launch` 会拒绝注入，因此这也可用于确认第 2 步已生效。

4. **通过 OpenClaw 验证桥接：**

   ```bash
   openclaw channels status --probe
   ```

   iMessage 条目应报告 `works`，而 `imsg status --json | jq '{rpc_methods, selectors}'` 应显示你的 macOS 构建版本所公开的能力。创建投票需要 `selectors.pollPayloadMessage`；投票操作同时需要 `selectors.pollVoteMessage` 和 `poll.vote` RPC 方法。OpenClaw 插件仅公布缓存探测结果所支持的操作；如果缓存为空，则保持乐观状态，并在首次分发时进行探测。

如果 `openclaw channels status --probe` 将该渠道报告为 `works`，但特定操作在分发时抛出“iMessage `<action>` requires the imsg private API bridge”，请再次运行 `imsg launch`——辅助程序可能会脱离（例如 Messages.app 重新启动、操作系统更新等），而缓存的 `available: true` 状态会继续公布这些操作，直到下一次探测刷新状态。

### SIP 保持启用时

如果你的威胁模型不允许禁用 SIP：

- `imsg` 会回退到基本模式——仅支持文本、媒体和接收。
- OpenClaw 插件仍会公布文本/媒体发送和入站监控能力；它会从操作表面隐藏 `react`、`edit`、`unsend`、`reply`、`sendWithEffect` 和群组操作（依据逐方法能力验证关卡）。
- 你可以使用一台单独的非 Apple Silicon Mac（或专用机器人 Mac），关闭其 SIP 来处理 iMessage 工作负载，同时让主要设备保持启用 SIP。请参阅下方的[专用机器人 macOS 用户（独立 iMessage 身份）](#deployment-patterns)。

## 访问控制和路由

<Tabs>
  <Tab title="私信策略">
    `channels.imessage.dmPolicy` 控制私信：

    - `pairing`（默认）
    - `allowlist`（要求至少有一个 `allowFrom` 条目）
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    允许列表字段：`channels.imessage.allowFrom`。

    允许列表条目必须标识发送者：句柄或静态发送者访问组（`accessGroup:<name>`）。对于 `chat_id:*`、`chat_guid:*` 或 `chat_identifier:*` 等聊天目标，请使用 `channels.imessage.groupAllowFrom`；对于数字 `chat_id` 注册表键，请使用 `channels.imessage.groups`。

  </Tab>

  <Tab title="群组策略 + 提及">
    `channels.imessage.groupPolicy` 控制群组处理：

    - `allowlist`（默认）
    - `open`
    - `disabled`

    群组发送者允许列表：`channels.imessage.groupAllowFrom`。

    `groupAllowFrom` 条目也可以引用静态发送者访问组（`accessGroup:<name>`）。

    运行时回退：如果未设置 `groupAllowFrom`，iMessage 群组发送者检查会使用 `allowFrom`；当私信和群组的准入规则应不同时，请设置 `groupAllowFrom`。显式设置为空的 `groupAllowFrom: []` 不会回退——在 `allowlist` 下，它会阻止所有群组发送者。
    运行时注意事项：如果完全缺少 `channels.imessage`，运行时会回退到 `groupPolicy="allowlist"` 并记录警告（即使已设置 `channels.defaults.groupPolicy`）。

    <Warning>
    `groupPolicy: "allowlist"` 下的群组路由会连续执行**两个**验证关卡：

    1. **发送者允许列表**（`channels.imessage.groupAllowFrom`）——句柄、`accessGroup:<name>`、`chat_guid`、`chat_identifier` 或 `chat_id`。有效列表为空（既无 `groupAllowFrom`，也无 `allowFrom` 回退）时，会阻止所有群组发送者。
    2. **群组注册表**（`channels.imessage.groups`）——映射中存在条目后便会强制执行：聊天必须匹配显式的逐 `chat_id` 条目或 `groups: { "*": { ... } }` 通配符。当 `groups` 为空或缺失时，仅由发送者允许列表决定是否准入。

    如果未配置有效的群组发送者允许列表，每条群组消息都会在到达注册表验证关卡之前被丢弃。每个验证关卡在默认日志级别下都有自己的 `warn` 级别信号，并分别指出不同的修复方法：

    - 启动时每个账户仅记录一次；当有效的群组发送者允许列表为空时：`imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`——通过设置 `channels.imessage.groupAllowFrom`（或 `allowFrom`）修复；仅添加 `groups` 条目仍会导致验证关卡 1 阻止所有发送者。
    - 运行时每个 `chat_id` 仅记录一次；当发送者通过验证关卡 1，但聊天不存在于已有内容的 `groups` 注册表中时：`imessage: dropping group message from chat_id=<id> ...`——通过在 `channels.imessage.groups` 下添加该 `chat_id`（或 `"*"`）修复。

    私信不受影响——它们使用不同的代码路径。

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

    仅设置 `groupAllowFrom` 就会允许这些发送者进入任何群组；添加 `groups` 块可限定允许哪些聊天（并设置 `requireMention` 等逐聊天选项）。
    </Warning>

    群组提及验证：

    - iMessage 没有原生提及元数据
    - 提及检测使用正则表达式模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 如果未配置模式，则无法强制执行提及验证
    - 来自已授权发送者的控制命令会绕过提及验证

    逐群组 `systemPrompt`：

    `channels.imessage.groups.*` 下的每个条目都接受可选的 `systemPrompt` 字符串；每当处理该群组中的消息时，此字符串都会注入智能体的系统提示词。解析方式与 `channels.whatsapp.groups` 相同：

    1. **群组专用系统提示词**（`groups["<chat_id>"].systemPrompt`）：当映射中存在特定群组条目，**并且**其 `systemPrompt` 键已定义时使用。如果 `systemPrompt` 是空字符串（`""`），则会抑制通配符，并且不会对该群组应用系统提示词。
    2. **群组通配符系统提示词**（`groups["*"].systemPrompt`）：当映射中完全不存在特定群组条目，或该条目存在但未定义 `systemPrompt` 键时使用。

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
              systemPrompt: "这是值班轮换聊天。回复不超过 3 句话。",
            },
            "9907": {
              // 显式抑制：通配符“使用英式拼写。”不在此处应用
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    逐群组提示词仅适用于群组消息——私信不受影响。

  </Tab>

  <Tab title="会话和确定性回复">
    - 私信使用直接路由；群组使用群组路由。
    - 使用默认的 `session.dmScope=main` 时，iMessage 私信会合并到智能体主会话中。
    - 群组会话相互隔离（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回复会使用来源渠道/目标元数据路由回 iMessage。

    类群组线程行为：

    某些包含多个参与者的 iMessage 线程可能以 `is_group=false` 到达。
    如果该 `chat_id` 已在 `channels.imessage.groups` 下显式配置，OpenClaw 会将其视为群组流量（群组验证 + 群组会话隔离）。

  </Tab>
</Tabs>

## ACP 对话绑定

iMessage 聊天可以绑定到 ACP 会话。

快速操作流程：

- 在私信或允许的群聊中运行 `/acp spawn codex --bind here`。
- 之后同一 iMessage 对话中的消息会路由到新建的 ACP 会话。
- `/new` 和 `/reset` 会就地重置同一个已绑定 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

配置的持久绑定使用顶层 `bindings[]` 条目，其中包含 `type: "acp"` 和 `match.channel: "imessage"`。

`match.peer.id` 可以使用：

- 规范化的私信句柄，例如 `+15555550123` 或 `user@example.com`
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

有关共享 ACP 绑定行为，请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

## 部署模式

<AccordionGroup>
  <Accordion title="专用机器人 macOS 用户（独立 iMessage 身份）">
    使用专用 Apple ID 和 macOS 用户，使机器人流量与你的个人 Messages 配置文件相互隔离。

    典型流程：

    1. 创建并登录专用 macOS 用户。
    2. 在该用户中使用机器人的 Apple ID 登录 Messages。
    3. 在该用户中安装 `imsg`。
    4. 创建 SSH 包装脚本，使 OpenClaw 能够在该用户上下文中运行 `imsg`。
    5. 将 `channels.imessage.accounts.<id>.cliPath` 和 `.dbPath` 指向该用户配置文件。

    首次运行时，可能需要在该机器人用户会话中通过 GUI 授予权限（Automation + Full Disk Access）。

  </Accordion>

  <Accordion title="通过 Tailscale 使用远程 Mac（示例）">
    常见拓扑：

    - Gateway 网关运行在 Linux/VM 上
    - iMessage + `imsg` 运行在你的 tailnet 中的一台 Mac 上
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

    使用 SSH 密钥，使 SSH 和 SCP 均可非交互运行。
    请先确保主机密钥受信任（例如运行 `ssh bot@mac-mini.tailnet-1234.ts.net`），以便填充 `known_hosts`。

  </Accordion>

  <Accordion title="多账户模式">
    iMessage 支持在 `channels.imessage.accounts` 下配置各个账户。

    每个账户都可以覆盖 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、历史记录设置和附件根目录允许列表等字段。

  </Accordion>

  <Accordion title="私信历史记录">
    设置 `channels.imessage.dmHistoryLimit`，可使用相应对话中最近解码的 `imsg` 历史记录初始化新的私信会话。使用 `channels.imessage.dms["<sender>"].historyLimit` 可为各发送者单独覆盖此设置，包括设为 `0` 以禁用某个发送者的历史记录。

    iMessage 私信历史记录会按需从 `imsg` 获取。不设置 `dmHistoryLimit` 会禁用全局私信历史记录初始化，但正数的发送者级 `channels.imessage.dms["<sender>"].historyLimit` 仍会为该发送者启用初始化。

  </Accordion>
</AccordionGroup>

## 媒体、分块和投递目标

<AccordionGroup>
  <Accordion title="附件和媒体">
    - 入站附件摄取**默认关闭**——设置 `channels.imessage.includeAttachments: true`，可将照片、语音备忘录、视频及其他附件转发给智能体。禁用此选项时，仅含附件的 iMessage 会在到达智能体前被丢弃，并且可能完全不会产生 `Inbound message` 日志行。
    - 设置 `remoteHost` 后，可以通过 SCP 获取远程附件路径
    - 附件路径必须匹配允许的根目录：
      - `channels.imessage.attachmentRoots`（本地）
      - `channels.imessage.remoteAttachmentRoots`（远程 SCP 模式）
      - 配置的根目录会扩展默认根目录模式 `/Users/*/Library/Messages/Attachments`（合并而非替换）
    - SCP 使用严格的主机密钥检查（`StrictHostKeyChecking=yes`）
    - 出站媒体大小使用 `channels.imessage.mediaMaxMb`（默认 16 MB）

  </Accordion>

  <Accordion title="出站文本和分块">
    - 文本分块限制：`channels.imessage.textChunkLimit`（默认 4000）
    - 分块模式：`channels.imessage.streaming.chunkMode`
      - `length`（默认）
      - `newline`（优先按段落拆分）
    - 出站 Markdown 粗体/斜体/下划线/删除线会转换为原生样式文本（使用 macOS 15+ 的接收方会渲染样式；旧版本接收方会看到不含标记的纯文本）；Markdown 表格会根据渠道的 Markdown 表格模式进行转换
    - `channels.imessage.sendTransport`（默认为 `auto`，可选 `bridge`、`applescript`）用于选择 `imsg` 投递发送内容的方式

  </Accordion>

  <Accordion title="寻址格式">
    首选的显式目标：

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

当 `imsg launch` 正在运行，且 `openclaw channels status --probe` 报告 `privateApi.available: true` 时，消息工具除了发送普通文本外，还可以使用 iMessage 原生操作。

所有操作默认启用；使用 `channels.imessage.actions` 可分别关闭各项操作：

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
    - **react**：添加/移除 iMessage Tapback 表情回应（`messageId`、`emoji`、`remove`）。支持的 Tapback 分别映射到爱心、赞、踩、大笑、强调和问号。不指定表情符号直接移除时，会清除当前设置的任意 Tapback。
    - **reply**：向现有消息发送串联回复（`messageId`、`text` 或 `message`，再加上 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。带附件回复还需要所使用的 `imsg` 构建版本中的 `send-rich` 支持 `--file`。
    - **sendWithEffect**：使用 iMessage 效果发送文本（`text` 或 `message`、`effect` 或 `effectId`）。短名称：slam、loud、gentle、invisibleink、confetti、lasers、fireworks、balloon、heart、echo、happybirthday、shootingstar、sparkles、spotlight。
    - **edit**：在受支持的 macOS/私有 API 版本上编辑已发送的消息（`messageId`、`text` 或 `newText`）。只能编辑 Gateway 网关自身发送的消息。
    - **unsend**：在受支持的 macOS/私有 API 版本上撤回已发送的消息（`messageId`）。只能撤回 Gateway 网关自身发送的消息。
    - **upload-file**：发送媒体/文件（以 base64 编码的 `buffer`，或已填充的 `media`/`path`/`filePath`、`filename`，以及可选的 `asVoice`）。旧版别名：`sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**：当当前目标为群组对话时管理群聊。这些操作会修改主机上的 Messages 身份，因此要求发送者为所有者，或使用具有 `operator.admin` 权限的 Gateway 网关客户端。
    - **poll**：创建原生 Apple Messages 投票（`pollQuestion`、重复 2 到 12 次的 `pollOption`，再加上 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。使用 iOS/iPadOS/macOS 26+ 的接收方可以原生查看并投票；旧版操作系统会收到 "Sent a poll" 文本作为回退。需要 `selectors.pollPayloadMessage`。
    - **poll-vote**：对现有投票进行投票（`pollId` 或 `messageId`，并且必须在 `pollOptionIndex`、`pollOptionId` 和 `pollOptionText` 中恰好指定一个）。需要 `selectors.pollVoteMessage` 和 `poll.vote` RPC 方法。

    已接受的入站投票会向智能体呈现问题、带编号的选项标签、票数，以及 `poll-vote` 所需的投票消息 ID。

  </Accordion>

  <Accordion title="消息 ID">
    如果可用，入站 iMessage 上下文会同时包含较短的 `MessageSid` 值和完整消息 GUID（`MessageSidFull`）。短 ID 的作用域限定在近期由 SQLite 支持的回复缓存中，使用前会根据当前聊天进行检查。如果短 ID 已过期或属于其他聊天，请使用完整的 `MessageSidFull` 重试。

  </Accordion>

  <Accordion title="能力检测">
    仅当缓存的探测状态表明桥接不可用时，OpenClaw 才会隐藏私有 API 操作。如果状态未知，操作仍保持可见，并在分派时延迟执行探测，因此在运行 `imsg launch` 后，无需单独手动刷新状态，首次操作即可成功。

  </Accordion>

  <Accordion title="已读回执和正在输入状态">
    私有 API 桥接启动后，已接受的入站聊天会被标记为已读；轮次一经接受，直接聊天便会显示正在输入气泡，并在智能体准备上下文和生成内容期间持续显示。可使用以下配置禁用标记已读：

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    对于早于按方法列出能力这一机制的旧版 `imsg` 构建，OpenClaw 会静默禁用正在输入状态和已读回执；每次重启时，OpenClaw 会记录一次性警告，以便将回执缺失归因于此。

  </Accordion>

  <Accordion title="入站点回">
    OpenClaw 会订阅 iMessage 点回，并将已接受的回应作为系统事件路由，而不是作为普通消息文本，因此用户点回不会触发常规回复循环。

    通知模式由 `channels.imessage.reactionNotifications` 控制：

    - `"own"`（默认）：仅当用户回应由机器人撰写的消息时通知。
    - `"all"`：对授权发送者的所有入站点回发出通知。
    - `"off"`：忽略入站点回。

    每个账户的覆盖配置使用 `channels.imessage.accounts.<id>.reactionNotifications`。

  </Accordion>

  <Accordion title="审批回应（👍 / 👎）">
    当 `approvals.exec.enabled` 或 `approvals.plugin.enabled` 为 true，且请求路由到 iMessage 时，Gateway 网关会以原生方式发送审批提示，并接受通过点回来解决审批：

    - `👍`（Like 点回）→ `allow-once`
    - `👎`（Dislike 点回）→ `deny`
    - `allow-always` 仍作为手动回退方式：以普通回复形式发送 `/approve <id> allow-always`。

    回应处理要求作出回应的用户句柄是明确指定的审批者。审批者列表从 `channels.imessage.allowFrom`（或 `channels.imessage.accounts.<id>.allowFrom`）读取；请添加用户采用 E.164 格式的电话号码或其 Apple ID 电子邮件地址（`chat_id:*` 等聊天目标不是有效的审批者条目）。通配符条目 `"*"` 会生效，但它允许任何发送者进行审批；空审批者列表会完全禁用回应快捷方式。回应快捷方式会有意绕过 `reactionNotifications`、`dmPolicy` 和 `groupAllowFrom`，因为明确指定审批者的允许列表是解决审批时唯一相关的限制条件。

    `/approve` 文本命令的授权遵循同一列表：当 `channels.imessage.allowFrom` 非空时，系统会根据该审批者列表（而非范围更广的私信允许列表）授权 `/approve <id> <decision>`；私信允许列表允许、但不在 `allowFrom` 中的发送者会收到明确的拒绝。当 `allowFrom` 为空时，同一聊天回退机制仍然有效，`/approve` 会授权私信允许列表所允许的任何人。请将所有应当通过 `/approve` 或回应执行审批的操作员都添加到 `allowFrom`。

    操作员注意事项：
    - 回应绑定会同时存储在内存以及 Gateway 网关的持久化键值存储中（TTL 与审批过期时间一致），Gateway 网关还会轮询待处理提示中的点回，因此即使点回在 Gateway 网关重启后不久到达，仍可解决审批。
    - 当操作员的句柄是明确指定的审批者时，操作员自己的 `is_from_me=true` 点回（例如来自已配对的 Apple 设备）也可解决审批。
    - 仅当配置了明确指定的审批者时，审批提示才会路由到群组会话中；否则任何群组成员都可能进行审批。
    - 旧版文本式点回（非常旧的 Apple 客户端发送的 `Liked "…"` 纯文本）无法解决审批，因为其中不包含消息 GUID；回应解决审批需要当前 macOS / iOS 客户端所发出的结构化点回元数据。

  </Accordion>
</AccordionGroup>

## 配置写入

默认情况下，iMessage 允许由渠道发起配置写入（即当 `commands.config: true` 时使用 `/config set|unset`）。

禁用方法：

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

## 合并拆分发送的私信（在同一次撰写中包含命令和 URL）

当用户同时输入命令和 URL（例如 `Dump https://example.com/article`）时，Apple 的 Messages 应用会将发送内容拆分为 **两个独立的 `chat.db` 行**：

1. 一条文本消息（`"Dump"`）。
2. 一个 URL 预览气泡（`"https://..."`），其附件中包含 OG 预览图像。

在大多数环境中，这两行会相隔约 0.8-2.0 秒到达 OpenClaw。如果不进行合并，智能体在第 1 个轮次中只会收到命令（并且通常会回复“请把 URL 发给我”），而 URL 要到第 2 个轮次才会到达。这是 Apple 的发送管线所致，并非 OpenClaw 或 `imsg` 引入的行为。

`channels.imessage.coalesceSameSenderDms` 可选择将私信中连续的同一发送者记录加入缓冲。当 `imsg` 在某条源记录上公开结构化 URL 预览标记 `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` 时，OpenClaw 只合并这个真正的拆分发送，并将其他所有已缓冲记录保留为独立轮次。在完全不产生气泡元数据的旧版 `imsg` 中，OpenClaw 无法区分拆分发送与多次独立发送，因此会回退为合并该缓冲桶。这会保留引入元数据前的行为，避免将 `Dump <url>` 拆分发送退化为两个轮次。群聊仍按消息逐条分发，以保留多用户轮次结构。

<Tabs>
  <Tab title="何时启用">
    在以下情况下启用：

    - 你提供的 Skills 期望在一条消息中收到 `command + payload`（转储、粘贴、保存、排队等）。
    - 你的用户会将 URL 与命令一起粘贴。
    - 你可以接受增加的私信轮次延迟（见下文）。

    在以下情况下保持禁用：

    - 对单字私信触发命令，你需要最低命令延迟。
    - 你的所有流程都是一次性命令，不会随后追加有效负载。

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

    启用此标志，并且未显式设置 `messages.inbound.byChannel.imessage` 或全局 `messages.inbound.debounceMs` 时，防抖窗口会扩大至 **7000 ms**（旧版默认值为 0 ms，即不防抖）。需要扩大窗口，是因为 Apple 的 URL 预览拆分发送节奏可能持续数秒，期间 Messages.app 会生成预览记录。

    要自行调整窗口：

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms 可覆盖观测到的 Messages.app URL 预览延迟。
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="权衡">
    - **精确合并需要当前 `imsg` 有效负载元数据。** 存在 `balloon_bundle_id` 时，只合并真正的拆分发送；上述无元数据回退合并属于临时向后兼容措施，将在 `imsg` 上游自行合并拆分发送后移除。
    - **私信消息会增加延迟。** 启用此标志后，每条私信（包括独立控制命令和单条文本后续消息）在分发前最多等待一个防抖窗口，以防随后到达 URL 预览记录。群聊消息仍会立即分发。
    - **合并输出有界限。** 合并文本上限为 4000 个字符，并带有明确的 `…[truncated]` 标记；附件上限为 20 个；源条目上限为 10 个（超过后保留第一条和最新条目）。每个源 GUID 都会记录在 `coalescedMessageGuids` 中，供下游遥测使用。
    - **仅限私信。** 群聊会继续按消息逐条分发，使多人输入时机器人仍能及时响应。
    - **按渠道选择启用。** 其他渠道（Discord、Slack、Telegram、WhatsApp 等）不受影响。设置了 `channels.bluebubbles.coalesceSameSenderDms` 的旧版 BlueBubbles 配置应将该值迁移到 `channels.imessage.coalesceSameSenderDms`。

  </Tab>
</Tabs>

### 场景以及智能体看到的内容

“启用标志”列展示产生 `balloon_bundle_id` 的 `imsg` 版本上的行为。在完全不产生气泡元数据的旧版 `imsg` 中，下表标记为“两个轮次”/“N 个轮次”的记录会改为回退到旧版合并（一个轮次）：OpenClaw 无法从结构上区分拆分发送和多次独立发送，因此会保留引入元数据前的合并行为。版本开始产生气泡元数据后，精确分离便会生效。

| 用户编写                                                           | `chat.db` 产生的内容                  | 关闭标志（默认）                         | 启用标志 + 窗口（imsg 产生气泡元数据）                                                              |
| ------------------------------------------------------------------ | ------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `Dump https://example.com`（一次发送）                             | 间隔约 1 s 的 2 条记录                | 两个智能体轮次：仅“Dump”，然后是 URL     | 一个轮次：合并文本 `Dump https://example.com`                                                       |
| `Save this 📎image.jpg caption`（附件 + 文本）                     | 2 条不含 URL 气泡元数据的记录         | 两个轮次                                 | 观测到元数据后为两个轮次；在旧版/锁定前的无元数据会话中为一个合并轮次                              |
| `/status`（独立命令）                                              | 1 条记录                              | 立即分发                                 | **最多等待一个窗口，然后分发**                                                                       |
| 单独粘贴 URL                                                       | 1 条记录                              | 立即分发                                 | 最多等待一个窗口，然后分发                                                                           |
| 文本 + URL 作为两条刻意分开的消息发送，相隔数分钟                  | 窗口之外的 2 条记录                   | 两个轮次                                 | 两个轮次（两条消息之间窗口已到期）                                                                   |
| 快速大量发送（窗口内超过 10 条短私信）                             | N 条不含 URL 气泡元数据的记录         | N 个轮次                                 | 观测到元数据后为 N 个轮次；在旧版/锁定前的无元数据会话中为一个有界限的合并轮次                     |
| 两个人在群聊中输入                                                 | 来自 M 个发送者的 N 条记录            | M+ 个轮次（每个发送者缓冲桶一个轮次）    | M+ 个轮次——群聊不会合并                                                                              |

## 桥接器或 Gateway 网关重启后的入站恢复

iMessage 会恢复 Gateway 网关停机期间错过的消息，同时抑制 Apple 在 Push 恢复后可能集中刷出的陈旧“积压消息炸弹”。默认行为始终启用，并建立在入站去重机制之上。

- **重放去重。** 每条已分发的入站消息都会按其 Apple GUID 记录在持久化插件状态（`imessage.inbound-dedupe`）中：在摄取时声明，处理后提交（发生瞬时故障时释放，以便重试）。任何已处理的消息都会被丢弃，而不是重复分发。正因如此，恢复功能可以积极重放，而无需逐条维护消息记录。
- **停机恢复。** 启动时，监视器会记住最后分发的 `chat.db` rowid（持久化的按账户游标），并通过 `since_rowid` 将其传递给 `imsg watch.subscribe`，这样 imsg 会先重放 Gateway 网关停机期间写入的记录，然后持续跟踪实时消息。重放范围限制为最近 500 条记录和最多约 2 小时前的消息，去重机制会丢弃任何已处理的消息。
- **陈旧积压消息年龄防线。** 启动边界以上的记录确实是实时消息；如果某条记录的发送日期比到达时间早超过约 15 分钟，则属于 Push 集中刷出的积压消息，会被抑制。重放记录（位于边界或边界以下）则使用更宽的恢复窗口，因此最近错过的消息会被送达，而久远历史消息不会。

恢复功能适用于本地和远程 `cliPath` 设置，因为 `since_rowid` 重放通过同一个 `imsg` RPC 连接运行。区别在于窗口：当 Gateway 网关可以读取 `chat.db`（本地）时，它会固定启动 rowid 边界、限制重放跨度，并送达最多约两小时前错过的消息。通过远程 SSH `cliPath` 时，它无法读取数据库，因此重放不设上限，并且每条记录都使用实时年龄防线——它仍会恢复最近错过的消息，并抑制旧积压消息，只是使用更窄的实时窗口。要使用更宽的恢复窗口，请在运行 Messages 的 Mac 上运行 Gateway 网关。

### 操作员可见信号

被抑制的积压消息会按默认级别记录日志，绝不会静默丢弃（`recovery` 标志表示应用了哪个窗口）：

```text
imessage: 已抑制陈旧入站积压消息 account=<id> sent=<iso> recovery=<bool>（启动后共抑制 <N> 条）
```

### 迁移

`channels.imessage.catchup.*` 已弃用——停机恢复是自动的，新设置无需任何配置。包含 `catchup.enabled: true` 的现有配置仍会作为恢复重放窗口的兼容性配置文件受到支持。已禁用的补收配置块（`enabled: false` 或未设置 `enabled: true`）将被淘汰；`openclaw doctor --fix` 会将其移除。

## 故障排除

<AccordionGroup>
  <Accordion title="找不到 imsg 或不支持 RPC">
    验证二进制文件和 RPC 支持：

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    如果探测报告不支持 RPC，请更新 `imsg`。如果私有 API 操作不可用，请在已登录的 macOS 用户会话中运行 `imsg launch`，然后再次探测。如果 Gateway 网关未在 macOS 上运行，请使用上文的“通过 SSH 使用远程 Mac”设置，而不是默认的本地 `imsg` 路径。

  </Accordion>

  <Accordion title="可以发送 Messages 消息，但收不到入站 iMessage">
    首先确认消息是否到达本地 Mac。如果 `chat.db` 没有变化，即使 `imsg status --json` 报告桥接器运行正常，OpenClaw 也无法接收该消息。

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    如果从手机发送的消息没有创建新记录，请先修复 macOS Messages 和 Apple Push 层，再更改 OpenClaw 配置。一次性刷新服务通常就足够：

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    从手机发送一条新的 iMessage，并确认出现新的 `chat.db` 记录或 `imsg watch` 事件，然后再调试 OpenClaw 会话。不要将此操作作为定期重新启动桥接器的循环；在活跃工作期间反复运行 `imsg launch` 并重启 Gateway 网关，可能会中断消息送达，并使正在进行的渠道运行陷入停滞。

  </Accordion>

  <Accordion title="Gateway 网关未在 macOS 上运行">
    默认的 `cliPath: "imsg"` 必须在已登录 Messages 的 Mac 上运行。在 Linux 或 Windows 上，将 `channels.imessage.cliPath` 设置为一个包装脚本，由该脚本通过 SSH 连接到该 Mac 并运行 `imsg "$@"`。

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
    - Gateway 网关主机的 `~/.ssh/known_hosts` 中存在主机密钥
    - 运行 Messages 的 Mac 上远程路径具有读取权限

  </Accordion>

  <Accordion title="错过了 macOS 权限提示">
    在相同用户/会话上下文的交互式 GUI 终端中重新运行，并批准提示：

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    确认运行 OpenClaw/`imsg` 的进程上下文已获得“完全磁盘访问权限”+“自动化”权限。

  </Accordion>
</AccordionGroup>

## 配置参考指引

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
- [安全性](/zh-CN/gateway/security) — 访问模型和加固措施
