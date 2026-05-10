---
read_when:
    - 规划从 BlueBubbles 迁移到内置 iMessage 插件
    - 将 BlueBubbles 配置键转换为 iMessage 对应项
    - 在启用 iMessage 插件之前验证 imsg
summary: 将旧的 BlueBubbles 配置迁移到内置的 iMessage 插件，且不会丢失配对、允许列表或群组绑定。
title: Coming from BlueBubbles
x-i18n:
    generated_at: "2026-05-10T19:21:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81ce77d7fe2d6fe054c1457e14624ebd2aba02f69ed7bc2cfb242cdb1de38a1e
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

内置的 `imessage` 插件现在通过 JSON-RPC 驱动 [`steipete/imsg`](https://github.com/steipete/imsg)，可访问与 BlueBubbles 相同的私有 API 接口面（`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、群组管理、附件）。如果你已经在安装了 `imsg` 的 Mac 上运行，可以移除 BlueBubbles 服务器，让插件直接与 Messages.app 通信。

BlueBubbles 支持已移除。OpenClaw 仅通过 `imsg` 支持 iMessage。本指南用于将旧的 `channels.bluebubbles` 配置迁移到 `channels.imessage`；没有其他受支持的迁移路径。

## 何时适合迁移

- 你已经在 Messages.app 已登录的同一台 Mac（或可通过 SSH 访问的 Mac）上运行 `imsg`。
- 你希望减少一个活动部件：没有单独的 BlueBubbles 服务器，没有需要认证的 REST 端点，也没有 webhook 管道。用单个 CLI 二进制文件替代服务器 + 客户端应用 + 辅助工具。
- 你使用的是[受支持的 macOS / `imsg` 构建](/zh-CN/channels/imessage#requirements-and-permissions-macos)，并且私有 API 探测报告 `available: true`。

## imsg 的作用

`imsg` 是用于 Messages 的本地 macOS CLI。OpenClaw 将 `imsg rpc` 作为子进程启动，并通过 stdin/stdout 使用 JSON-RPC 通信。没有 HTTP 服务器、webhook URL、后台守护进程、launch agent，也没有需要暴露的端口。

- 读取通过只读 SQLite 句柄来自 `~/Library/Messages/chat.db`。
- 实时入站消息来自 `imsg watch` / `watch.subscribe`，它会跟踪 `chat.db` 文件系统事件，并带有轮询回退。
- 发送普通文本和文件时使用 Messages.app 自动化。
- 高级操作使用 `imsg launch` 将 `imsg` 辅助工具注入 Messages.app。这会解锁已读回执、正在输入指示器、富文本发送、编辑、撤回、线程回复、tapbacks 和群组管理。
- Linux 构建可以检查复制的 `chat.db`，但不能发送、监听实时 Mac 数据库，或驱动 Messages.app。对于 OpenClaw iMessage，请在已登录的 Mac 上运行 `imsg`，或通过指向该 Mac 的 SSH 包装器运行。

## 开始之前

1. 在运行 Messages.app 的 Mac 上安装 `imsg`：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   如果 `imsg chats` 因 `unable to open database file`、空输出或 `authorization denied` 失败，请向启动 `imsg` 的终端、编辑器、Node 进程、Gateway 网关服务或 SSH 父进程授予“完全磁盘访问权限”，然后重新打开该父进程。

2. 在更改 OpenClaw 配置之前，验证读取、监听、发送和 RPC 接口面：

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   将 `42` 替换为来自 `imsg chats` 的真实 chat id。发送需要 Messages.app 的自动化权限。如果 OpenClaw 将通过 SSH 运行，请通过 OpenClaw 将使用的同一个 SSH 包装器或用户上下文运行这些命令。

3. 当你需要高级操作时，启用私有 API 桥接：

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` 要求禁用 SIP。基本发送、历史记录和监听无需 `imsg launch` 即可工作；高级操作不行。

4. 通过 OpenClaw 验证桥接：

   ```bash
   openclaw channels status --probe
   ```

   你需要 `imessage.privateApi.available: true`。如果报告为 `false`，请先修复它，参见[能力检测](/zh-CN/channels/imessage#private-api-actions)。

5. 快照你的配置：

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## 配置转换

iMessage 和 BlueBubbles 共享大量渠道级配置。发生变化的键主要是传输方式（REST 服务器与本地 CLI）。行为键（`dmPolicy`、`groupPolicy`、`allowFrom` 等）保持相同含义。

| BlueBubbles                                                | 内置 iMessage                             | 备注                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | 语义相同。                                                                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.serverUrl`                           | _(已移除)_                                | 没有 REST 服务器，插件会通过 stdio 启动 `imsg rpc`。                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.password`                            | _(已移除)_                                | 不需要 webhook 身份验证。                                                                                                                                                                                                                                                                                                                   |
| _(隐式)_                                                   | `channels.imessage.cliPath`               | `imsg` 的路径（默认 `imsg`）；使用包装脚本进行 SSH。                                                                                                                                                                                                                                                                                         |
| _(隐式)_                                                   | `channels.imessage.dbPath`                | 可选的 Messages.app `chat.db` 覆盖；省略时会自动检测。                                                                                                                                                                                                                                                                                       |
| _(隐式)_                                                   | `channels.imessage.remoteHost`            | `host` 或 `user@host`，仅当 `cliPath` 是 SSH 包装脚本并且你希望通过 SCP 拉取附件时才需要。                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | 值相同（`pairing` / `allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | 配对批准会按 handle 延续，而不是按 token 延续。                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | 值相同（`allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | 相同。                                                                                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **逐字复制此项，包括任何 `groups: { "*": { ... } }` 通配符条目。** 每个群组的 `requireMention`、`tools`、`toolsBySender` 都会延续。使用 `groupPolicy: "allowlist"` 时，空的或缺失的 `groups` 块会静默丢弃每条群组消息，请参见下方“群组注册表易错点”。                              |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | 默认 `true`。使用内置插件时，只有私有 API 探测可用时才会触发。                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | 形状相同，**同样默认关闭**。如果你在 BlueBubbles 上已有附件流转，必须在 iMessage 块中显式重新设置此项；它不会隐式延续，在你这样做之前，入站照片/媒体会被静默丢弃，并且不会出现 `Inbound message` 日志行。                                                                        |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | 本地根目录；通配符规则相同。                                                                                                                                                                                                                                                                                                                 |
| _(不适用)_                                                 | `channels.imessage.remoteAttachmentRoots` | 仅在设置了 `remoteHost` 以进行 SCP 拉取时使用。                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage 上默认是 16 MB（BlueBubbles 默认值是 8 MB）。如果你想保留更低上限，请显式设置。                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | 两者默认都是 4000。                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 相同的可选启用项。仅限私信，群聊在两个渠道上都会保持按消息即时派发。启用后，如果没有显式的 `messages.inbound.byChannel.imessage`，默认入站 debounce 会扩大到 2500 ms。请参见 [iMessage 文档 § 合并拆分发送的私信](/zh-CN/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition)。 |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(不适用)_                                | iMessage 已经会从 `chat.db` 读取发送者显示名称。                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | 每个 action 的开关：`reactions`、`edit`、`unsend`、`reply`、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`、`sendAttachment`。                                                                                              |

多账号配置（`channels.bluebubbles.accounts.*`）会一一转换为 `channels.imessage.accounts.*`。

## 群组注册表易错点

内置 iMessage 插件会连续运行**两个**独立的群组 allowlist 门控。两者都必须通过，群组消息才能到达智能体：

1. **发送者 / 聊天目标 allowlist**（`channels.imessage.groupAllowFrom`）—— 由 `isAllowedIMessageSender` 检查。按发送者 handle、`chat_guid`、`chat_identifier` 或 `chat_id` 匹配入站消息。形状与 BlueBubbles 相同。
2. **群组注册表**（`channels.imessage.groups`）—— 由 `inbound-processing.ts:199` 中的 `resolveChannelGroupPolicy` 检查。使用 `groupPolicy: "allowlist"` 时，此门控要求二选一：
   - 一个 `groups: { "*": { ... } }` 通配符条目（设置 `allowAll = true`），或
   - `groups` 下针对每个 `chat_id` 的显式条目。

如果门控 1 通过但门控 2 失败，消息会被丢弃。插件会发出两个 `warn` 级别信号，因此在默认日志级别下这不再是静默行为：

- 当设置了 `groupPolicy: "allowlist"` 但 `channels.imessage.groups` 为空（没有 `"*"` 通配符，也没有每个 `chat_id` 的条目）时，每个账号会在启动时发出一次性 `warn`，在任何消息落地之前触发。
- 当某个特定群组首次在运行时被丢弃时，会针对每个 `chat_id` 发出一次性 `warn`，指明该 chat_id 以及为了允许它需要添加到 `groups` 的确切键名。

私信会继续工作，因为它们走的是不同的代码路径。

这是最常见的 BlueBubbles → 内置 iMessage 迁移失败模式：操作者复制了 `groupAllowFrom` 和 `groupPolicy`，但跳过了 `groups` 块，因为 BlueBubbles 的 `groups: { "*": { "requireMention": true } }` 看起来像是不相关的提及设置。它实际上是注册表门控的关键配置。

在 `groupPolicy: "allowlist"` 之后保持群组消息继续流转的最小配置：

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

`requireMention: true` 位于 `*` 下时，如果未配置提及模式，这是无害的：运行时会设置 `canDetectMention = false`，并在 `inbound-processing.ts:512` 短路跳过提及丢弃逻辑。配置提及模式（`agents.list[].groupChat.mentionPatterns`）后，它会按预期工作。

如果 Gateway 网关日志记录 `imessage: dropping group message from chat_id=<id>`，或启动行显示 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`，说明第 2 道门正在丢弃消息，请添加 `groups` 块。

## 分步说明

1. 在现有 BlueBubbles 块旁边添加一个 iMessage 块。旧块仅保留作为复制来源，直到新路径通过验证：

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false, // turn on after the dry run below
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // copy from bluebubbles.groups — silently drops groups if missing, see "Group registry footgun" above
         actions: {
           reactions: true,
           edit: true,
           unsend: true,
           reply: true,
           sendWithEffect: true,
           sendAttachment: true,
         },
       },
     },
   }
   ```

2. **试运行探测** — 启动 Gateway 网关，并确认 iMessage 报告为健康：

   ```bash
   openclaw gateway
   openclaw channels status
   openclaw channels status --probe   # expect imessage.privateApi.available: true
   ```

   因为 `imessage.enabled` 仍为 `false`，入站 iMessage 流量还不会被路由，但 `--probe` 会执行桥接器，因此你可以在切换前发现权限或安装问题。

3. **切换。** 移除 BlueBubbles 配置，并在一次配置编辑中启用 iMessage：

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   重启 Gateway 网关。入站 iMessage 流量现在会通过内置插件流转。

4. **验证私信。** 给智能体发送一条直接消息；确认回复成功送达。

5. **单独验证群组。** 私信和群组走不同的代码路径，私信成功并不能证明群组正在路由。在已配对的群聊中给智能体发送一条消息，并确认回复成功送达。如果群组没有响应（没有智能体回复，也没有错误），检查 Gateway 网关日志中是否有 `imessage: dropping group message from chat_id=<id>`，或启动时的 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` 行，这两者都会在默认日志级别触发。如果出现任意一项，说明你的 `groups` 块缺失或为空，请参阅上面的“组注册表陷阱”。

6. **验证操作面** — 从已配对私信中，让智能体执行回应、编辑、撤回、回复、发送照片，以及（在群组中）重命名群组 / 添加或移除参与者。每个操作都应原生落到 Messages.app 中。如果有任何操作抛出 "iMessage `<action>` requires the imsg private API bridge"，请再次运行 `imsg launch`，并刷新 `channels status --probe`。

7. 当 iMessage 私信、群组和操作都验证通过后，**移除 BlueBubbles 服务器和配置**。OpenClaw 不会使用 `channels.bluebubbles`。

## 操作对等概览

| 操作                                                       | 旧版 BlueBubbles                    | 内置 iMessage                                                                                                           |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 发送文本 / SMS 回退                                       | ✅                                  | ✅                                                                                                                      |
| 发送媒体（照片、视频、文件、语音）                        | ✅                                  | ✅                                                                                                                      |
| 线程回复（`reply_to_guid`）                               | ✅                                  | ✅（关闭 [#51892](https://github.com/openclaw/openclaw/issues/51892)）                                                  |
| Tapback（`react`）                                        | ✅                                  | ✅                                                                                                                      |
| 编辑 / 撤回（macOS 13+ 接收者）                           | ✅                                  | ✅                                                                                                                      |
| 发送屏幕效果                                              | ✅                                  | ✅（关闭 [#9394](https://github.com/openclaw/openclaw/issues/9394) 的一部分）                                           |
| 富文本加粗 / 斜体 / 下划线 / 删除线                       | ✅                                  | ✅（通过 attributedBody 的类型化运行格式）                                                                              |
| 重命名群组 / 设置群组图标                                 | ✅                                  | ✅                                                                                                                      |
| 添加 / 移除参与者、离开群组                               | ✅                                  | ✅                                                                                                                      |
| 已读回执和输入指示器                                      | ✅                                  | ✅（受 private API 探测门控）                                                                                           |
| 同一发送者私信合并                                        | ✅                                  | ✅（仅私信；通过 `channels.imessage.coalesceSameSenderDms` 选择启用）                                                   |
| Gateway 网关停机期间收到的入站消息补收                   | ✅（webhook 重放 + 历史拉取）       | ✅（通过 `channels.imessage.catchup.enabled` 选择启用；关闭 [#78649](https://github.com/openclaw/openclaw/issues/78649)） |

iMessage 补收现在作为内置插件上的可选启用功能提供。Gateway 网关启动时，如果 `channels.imessage.catchup.enabled` 为 `true`，Gateway 网关会对 `imsg watch` 使用的同一个 JSON-RPC 客户端运行一次 `chats.list` + 每个聊天的 `messages.history` 流程，将每条错过的入站记录通过实时分发路径重放（allowlists、群组策略、debouncer、echo cache），并持久化每个账号的游标，使后续启动从上次停止处继续。请参阅[在 Gateway 网关停机后补收](/zh-CN/channels/imessage#catching-up-after-gateway-downtime)了解调优。

## 配对、会话和 ACP 绑定

- **配对批准**按 handle 继承。你无需重新批准已知发送者，`channels.imessage.allowFrom` 会识别 BlueBubbles 使用的相同 `+15555550123` / `user@example.com` 字符串。
- **会话**仍按智能体 + 聊天限定范围。默认 `session.dmScope=main` 下，私信会折叠到智能体主会话；群组会话仍按每个 `chat_id` 隔离。会话键不同（`agent:<id>:imessage:group:<chat_id>` 与 BlueBubbles 等效项），BlueBubbles 会话键下的旧对话历史不会带入 iMessage 会话。
- 引用 `match.channel: "bluebubbles"` 的 **ACP 绑定**需要更新为 `"imessage"`。`match.peer.id` 的形状（`chat_id:`、`chat_guid:`、`chat_identifier:`、裸 handle）完全相同。

## 无回滚渠道

没有受支持的 BlueBubbles 运行时可切回。如果 iMessage 验证失败，请设置 `channels.imessage.enabled: false`，重启 Gateway 网关，修复 `imsg` 阻塞问题，然后重试切换。

回复缓存位于 `~/.openclaw/state/imessage/reply-cache.jsonl`（模式 `0600`，父目录 `0700`）。如果你想从干净状态开始，可以安全删除它。

## 相关内容

- [iMessage](/zh-CN/channels/imessage) — 完整的 iMessage 渠道参考，包括 `imsg launch` 设置和能力检测。
- `/channels/bluebubbles` — 重定向到此迁移指南的旧版 URL。
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程。
- [频道路由](/zh-CN/channels/channel-routing) — Gateway 网关如何为出站回复选择渠道。
