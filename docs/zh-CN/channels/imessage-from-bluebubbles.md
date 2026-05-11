---
read_when:
    - 计划从 BlueBubbles 迁移到内置的 iMessage 插件
    - 将 BlueBubbles 配置键名转换为 iMessage 对应项
    - 启用 iMessage 插件前验证 imsg
summary: 将旧的 BlueBubbles 配置迁移到内置的 iMessage 插件，且不会丢失配对、允许列表或群组绑定。
title: Coming from BlueBubbles
x-i18n:
    generated_at: "2026-05-11T20:20:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 255bb79faf8e19215728c0401e6cac530f7bf4bfc8577df33518ab21a1597e90
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

内置的 `imessage` 插件现在通过 JSON-RPC 驱动 [`steipete/imsg`](https://github.com/steipete/imsg)，可以访问与 BlueBubbles 相同的私有 API 表面（`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、群组管理、附件）。如果你已经在安装了 `imsg` 的 Mac 上运行，可以移除 BlueBubbles 服务器，让插件直接与 Messages.app 通信。

BlueBubbles 支持已移除。OpenClaw 仅通过 `imsg` 支持 iMessage。本指南用于将旧的 `channels.bluebubbles` 配置迁移到 `channels.imessage`；没有其他受支持的迁移路径。

<Note>
如需简短公告和操作员摘要，请参阅 [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage)。
</Note>

## 迁移检查清单

当你已经了解旧的 BlueBubbles 配置，并且想使用最短的安全路径时，请使用此检查清单：

1. 直接在运行 Messages.app 的 Mac 上验证 `imsg`（`imsg chats`、`imsg history`、`imsg send` 和 `imsg rpc --help`）。
2. 将行为键从 `channels.bluebubbles` 复制到 `channels.imessage`：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`includeAttachments`、`attachmentRoots`、`mediaMaxMb`、`textChunkLimit`、`coalesceSameSenderDms` 和 `actions`。
3. 删除已不存在的传输键：`serverUrl`、`password`、Webhook URL，以及 BlueBubbles 服务器设置。
4. 如果 Gateway 网关未在 Messages Mac 上运行，请将 `channels.imessage.cliPath` 设置为 SSH 包装器，并设置 `remoteHost` 用于远程附件获取。
5. 在 Gateway 网关停止后，启用 `channels.imessage`，然后运行 `openclaw channels status --probe --channel imessage`。
6. 测试一个私信、一个允许的群组、附件（如果已启用），以及你预期智能体使用的每个私有 API 操作。
7. 在 iMessage 路径验证完成后，删除 BlueBubbles 服务器和旧的 `channels.bluebubbles` 配置。

## 何时适合此迁移

- 你已经在 Messages.app 已登录的同一台 Mac（或可通过 SSH 访问的 Mac）上运行 `imsg`。
- 你希望减少一个运行部件——没有单独的 BlueBubbles 服务器、没有需要认证的 REST 端点、没有 Webhook 管道。用单个 CLI 二进制文件替代服务器 + 客户端应用 + 辅助程序。
- 你正在使用[受支持的 macOS / `imsg` 构建](/zh-CN/channels/imessage#requirements-and-permissions-macos)，并且私有 API 探测报告 `available: true`。

## imsg 的作用

`imsg` 是用于 Messages 的本地 macOS CLI。OpenClaw 将 `imsg rpc` 作为子进程启动，并通过 stdin/stdout 使用 JSON-RPC 通信。它没有 HTTP 服务器、Webhook URL、后台守护进程、启动代理或需要暴露的端口。

- 读取来自 `~/Library/Messages/chat.db`，使用只读 SQLite 句柄。
- 实时传入消息来自 `imsg watch` / `watch.subscribe`，它会跟踪 `chat.db` 文件系统事件，并提供轮询回退。
- 发送使用 Messages.app 自动化来发送普通文本和文件。
- 高级操作使用 `imsg launch` 将 `imsg` 辅助程序注入 Messages.app。这会解锁已读回执、正在输入指示、富文本发送、编辑、撤回、线程回复、点按回应和群组管理。
- Linux 构建可以检查复制的 `chat.db`，但不能发送消息、监听实时 Mac 数据库，或驱动 Messages.app。对于 OpenClaw iMessage，请在已登录的 Mac 上运行 `imsg`，或通过指向该 Mac 的 SSH 包装器运行。

## 开始之前

1. 在运行 Messages.app 的 Mac 上安装 `imsg`：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   如果 `imsg chats` 失败并显示 `unable to open database file`、输出为空，或显示 `authorization denied`，请授予启动 `imsg` 的终端、编辑器、Node 进程、Gateway 网关服务或 SSH 父进程完全磁盘访问权限，然后重新打开该父进程。

2. 在更改 OpenClaw 配置之前，验证读取、监听、发送和 RPC 表面：

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   将 `42` 替换为 `imsg chats` 中的真实聊天 ID。发送需要 Messages.app 的自动化权限。如果 OpenClaw 将通过 SSH 运行，请通过 OpenClaw 将使用的相同 SSH 包装器或用户上下文运行这些命令。

3. 当你需要高级操作时，启用私有 API 桥接：

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` 需要禁用 SIP。基本发送、历史记录和监听无需 `imsg launch` 即可工作；高级操作不行。

4. 添加已启用的 `channels.imessage` 配置后，通过 OpenClaw 验证桥接：

   ```bash
   openclaw channels status --probe
   ```

   你需要看到 `imessage.privateApi.available: true`。如果报告 `false`，请先修复该问题——参见[能力检测](/zh-CN/channels/imessage#private-api-actions)。`channels status --probe` 只会探测已配置并启用的账号。

5. 快照你的配置：

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## 配置转换

iMessage 和 BlueBubbles 共享许多渠道级配置。发生变化的键主要是传输相关（REST 服务器与本地 CLI）。行为键（`dmPolicy`、`groupPolicy`、`allowFrom` 等）保持相同含义。

| BlueBubbles                                                | 内置 iMessage                            | 备注                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | 语义相同。                                                                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.serverUrl`                           | _（已移除）_                              | 没有 REST 服务器，插件会通过 stdio 启动 `imsg rpc`。                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.password`                            | _（已移除）_                              | 不需要 webhook 认证。                                                                                                                                                                                                                                                                                                                                        |
| _（隐式）_                                                 | `channels.imessage.cliPath`               | `imsg` 的路径（默认 `imsg`）；如需 SSH，请使用包装脚本。                                                                                                                                                                                                                                                                                                      |
| _（隐式）_                                                 | `channels.imessage.dbPath`                | 可选的 Messages.app `chat.db` 覆盖路径；省略时会自动检测。                                                                                                                                                                                                                                                                                                    |
| _（隐式）_                                                 | `channels.imessage.remoteHost`            | `host` 或 `user@host`，仅当 `cliPath` 是 SSH 包装脚本并且你想用 SCP 获取附件时才需要。                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | 值相同（`pairing` / `allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | 配对批准会按 handle 迁移，而不是按 token 迁移。                                                                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | 值相同（`allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | 相同。                                                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **逐字复制此项，包括任何 `groups: { "*": { ... } }` 通配符条目。** 每个群组的 `requireMention`、`tools`、`toolsBySender` 都会迁移。使用 `groupPolicy: "allowlist"` 时，如果 `groups` 块为空或缺失，会静默丢弃每条群组消息，见下方“群组注册表陷阱”。                                             |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | 默认值为 `true`。使用内置插件时，只有私有 API 探测启动后才会触发。                                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | 结构相同，**同样默认关闭**。如果你在 BlueBubbles 上已经启用了附件流转，必须在 iMessage 块中显式重新设置此项；它不会隐式迁移，在设置之前，入站照片/媒体会被静默丢弃，并且不会出现 `Inbound message` 日志行。                                                                                  |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | 本地根目录；通配符规则相同。                                                                                                                                                                                                                                                                                                                                  |
| _（不适用）_                                               | `channels.imessage.remoteAttachmentRoots` | 仅在设置 `remoteHost` 以进行 SCP 获取时使用。                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage 默认值为 16 MB（BlueBubbles 默认值为 8 MB）。如果要保留较低上限，请显式设置。                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | 两者默认值均为 4000。                                                                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 相同的选择性开启项。仅适用于私信；群聊在两个渠道上都会保持逐消息即时分发。如果启用但未显式设置 `messages.inbound.byChannel.imessage`，默认入站 debounce 会扩大到 2500 ms。见 [iMessage 文档 § 合并拆分发送的私信](/zh-CN/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition)。 |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _（不适用）_                              | iMessage 已经会从 `chat.db` 读取发送者显示名称。                                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | 每个操作的开关：`reactions`、`edit`、`unsend`、`reply`、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`、`sendAttachment`。                                                                                                                  |

多账号配置（`channels.bluebubbles.accounts.*`）会一对一转换为 `channels.imessage.accounts.*`。

## 群组注册表陷阱

内置 iMessage 插件会连续运行**两个**独立的群组允许列表门禁。两者都必须通过，群组消息才会到达智能体：

1. **发送者 / 聊天目标允许列表**（`channels.imessage.groupAllowFrom`）由 `isAllowedIMessageSender` 检查。按发送者 handle、`chat_guid`、`chat_identifier` 或 `chat_id` 匹配入站消息。结构与 BlueBubbles 相同。
2. **群组注册表**（`channels.imessage.groups`）由 `inbound-processing.ts:199` 中的 `resolveChannelGroupPolicy` 检查。使用 `groupPolicy: "allowlist"` 时，此门禁要求以下任一项：
   - 一个 `groups: { "*": { ... } }` 通配符条目（设置 `allowAll = true`），或
   - `groups` 下有一个显式的按 `chat_id` 配置的条目。

如果门禁 1 通过但门禁 2 失败，消息会被丢弃。插件会发出两个 `warn` 级别信号，因此在默认日志级别下它不再是静默的：

- 当设置了 `groupPolicy: "allowlist"` 但 `channels.imessage.groups` 为空（没有 `"*"` 通配符，也没有按 `chat_id` 配置的条目）时，每个账号在启动时发出一次 `warn`，在任何消息进入前触发。
- 运行时第一次丢弃某个具体群组时，按 `chat_id` 发出一次 `warn`，其中会说明 chat_id 以及要添加到 `groups` 以允许它的确切键名。

私信会继续工作，因为它们走的是不同代码路径。

这是最常见的 BlueBubbles → 内置 iMessage 迁移失败模式：操作者复制了 `groupAllowFrom` 和 `groupPolicy`，但跳过了 `groups` 块，因为 BlueBubbles 的 `groups: { "*": { "requireMention": true } }` 看起来像是不相关的提及设置。实际上，它对注册表门禁至关重要。

在 `groupPolicy: "allowlist"` 之后继续让群组消息流转的最小配置：

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

`requireMention: true` 在 `*` 下是无害的：未配置提及模式时，运行时会设置 `canDetectMention = false`，并在 `inbound-processing.ts:512` 短路跳过提及丢弃逻辑。配置了提及模式（`agents.list[].groupChat.mentionPatterns`）时，它会按预期工作。

如果 Gateway 网关日志出现 `imessage: dropping group message from chat_id=<id>`，或启动行出现 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`，则是第 2 道门在丢弃消息——添加 `groups` 块。

## 分步说明

1. 在现有 BlueBubbles 块旁添加一个 iMessage 块。当 Gateway 网关仍在路由 BlueBubbles 流量时，先保持它禁用：

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false,
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

2. **在流量重要之前先探测**——停止 Gateway 网关，临时启用 iMessage 块，并确认 iMessage 在 CLI 中报告健康：

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` 只会探测已配置且已启用的账号。除非你有意同时运行两个渠道监视器，否则不要在 BlueBubbles 和 iMessage 同时启用的情况下重启 Gateway 网关。如果你不会立即切换，在重启 Gateway 网关前将 `channels.imessage.enabled` 设回 `false`。在启用 OpenClaw 流量前，使用 [开始之前](#before-you-start) 中的直接 `imsg` 命令验证 Mac。

3. **切换。** 已启用的 iMessage 账号报告健康后，移除 BlueBubbles 配置并保持 iMessage 启用：

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   重启 Gateway 网关。入站 iMessage 流量现在会通过内置插件流转。

4. **验证私信。** 向智能体发送一条直接消息；确认回复能够送达。

5. **单独验证群组。** 私信和群组走不同代码路径——私信成功并不能证明群组正在路由。在已配对的群聊中向智能体发送一条消息，并确认回复能够送达。如果群组变得无响应（没有智能体回复，也没有错误），检查 Gateway 网关日志中是否有 `imessage: dropping group message from chat_id=<id>`，或启动时的 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` 行——两者都会在默认日志级别触发。如果出现任意一条，说明你的 `groups` 块缺失或为空——见上面的 “Group registry footgun”。

6. **验证操作面**——从已配对的私信中，让智能体执行反应、编辑、撤回、回复、发送照片，以及（在群组中）重命名群组 / 添加或移除参与者。每个操作都应原生落到 Messages.app 中。如果任何操作抛出 “iMessage `<action>` requires the imsg private API bridge”，请再次运行 `imsg launch` 并刷新 `channels status --probe`。

7. 在 iMessage 私信、群组和操作都验证通过后，**移除 BlueBubbles 服务器和配置**。OpenClaw 不会使用 `channels.bluebubbles`。

## 操作能力对照一览

| 操作                                                       | 旧版 BlueBubbles                    | 内置 iMessage                                                                                                           |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 发送文本 / SMS 回退                                        | ✅                                  | ✅                                                                                                                      |
| 发送媒体（照片、视频、文件、语音）                         | ✅                                  | ✅                                                                                                                      |
| 线程回复（`reply_to_guid`）                                | ✅                                  | ✅（关闭 [#51892](https://github.com/openclaw/openclaw/issues/51892)）                                                  |
| Tapback（`react`）                                         | ✅                                  | ✅                                                                                                                      |
| 编辑 / 撤回（macOS 13+ 接收方）                            | ✅                                  | ✅                                                                                                                      |
| 发送屏幕效果                                               | ✅                                  | ✅（关闭 [#9394](https://github.com/openclaw/openclaw/issues/9394) 的一部分）                                           |
| 富文本粗体 / 斜体 / 下划线 / 删除线                        | ✅                                  | ✅（通过 attributedBody 的 typed-run 格式化）                                                                           |
| 重命名群组 / 设置群组图标                                  | ✅                                  | ✅                                                                                                                      |
| 添加 / 移除参与者，退出群组                                | ✅                                  | ✅                                                                                                                      |
| 已读回执和正在输入指示器                                   | ✅                                  | ✅（受 private API 探测门控）                                                                                          |
| 同一发送者私信合并                                         | ✅                                  | ✅（仅私信；通过 `channels.imessage.coalesceSameSenderDms` 选择启用）                                                   |
| 补收 Gateway 网关停机期间收到的入站消息                    | ✅（webhook 重放 + 历史拉取）       | ✅（通过 `channels.imessage.catchup.enabled` 选择启用；关闭 [#78649](https://github.com/openclaw/openclaw/issues/78649)） |

iMessage 补收现在作为内置插件的一项可选启用功能提供。Gateway 网关启动时，如果 `channels.imessage.catchup.enabled` 为 `true`，Gateway 网关会针对 `imsg watch` 使用的同一个 JSON-RPC 客户端运行一次 `chats.list` + 每个聊天的 `messages.history` 遍历，通过实时分发路径（允许列表、群组策略、去抖器、回声缓存）重放每一条漏掉的入站行，并持久化每个账号的游标，以便后续启动从上次位置继续。调优见 [Gateway 网关停机后补收](/zh-CN/channels/imessage#catching-up-after-gateway-downtime)。

## 配对、会话和 ACP 绑定

- **配对审批** 会按 handle 继承。你不需要重新审批已知发送者——`channels.imessage.allowFrom` 会识别 BlueBubbles 使用的同样 `+15555550123` / `user@example.com` 字符串。
- **会话** 保持按每个智能体 + 聊天限定范围。在默认 `session.dmScope=main` 下，私信会折叠进智能体主会话；群组会话会按每个 `chat_id` 保持隔离。会话键不同（`agent:<id>:imessage:group:<chat_id>` 对比 BlueBubbles 等价键）——BlueBubbles 会话键下的旧对话历史不会带入 iMessage 会话。
- **ACP 绑定** 中引用 `match.channel: "bluebubbles"` 的部分需要更新为 `"imessage"`。`match.peer.id` 形状（`chat_id:`、`chat_guid:`、`chat_identifier:`、裸 handle）完全相同。

## 没有回滚渠道

没有受支持的 BlueBubbles 运行时可切换回去。如果 iMessage 验证失败，请设置 `channels.imessage.enabled: false`，重启 Gateway 网关，修复 `imsg` 阻塞点，然后重试切换。

回复缓存位于 `~/.openclaw/state/imessage/reply-cache.jsonl`（模式 `0600`，父目录 `0700`）。如果你想要干净状态，可以安全删除它。

## 相关内容

- [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage)——简短公告和操作员摘要。
- [iMessage](/zh-CN/channels/imessage)——完整 iMessage 渠道参考，包括 `imsg launch` 设置和能力检测。
- `/channels/bluebubbles`——重定向到本迁移指南的旧版 URL。
- [配对](/zh-CN/channels/pairing)——私信身份验证和配对流程。
- [频道路由](/zh-CN/channels/channel-routing)——Gateway 网关如何为出站回复选择渠道。
