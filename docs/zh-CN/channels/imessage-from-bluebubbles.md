---
read_when:
    - 规划从 BlueBubbles 迁移到内置 iMessage 插件
    - 将 BlueBubbles 配置键名转换为对应的 iMessage 配置键名
    - 启用 iMessage 插件前验证 imsg
summary: 将旧的 BlueBubbles 配置迁移到内置 iMessage 插件，同时不丢失配对、允许列表或群组绑定。
title: Coming from BlueBubbles
x-i18n:
    generated_at: "2026-06-27T01:21:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dae45911686697a064b19265b11acb87d377992f762256c44a22dd3f1b4c4b08
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

内置的 `imessage` 插件现在通过 JSON-RPC 驱动 [`steipete/imsg`](https://github.com/steipete/imsg)，可访问与 BlueBubbles 相同的私有 API 表面（`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、群组管理、附件）。如果你已经在安装了 `imsg` 的 Mac 上运行，可以移除 BlueBubbles 服务器，让插件直接与 Messages.app 通信。

BlueBubbles 支持已移除。OpenClaw 仅通过 `imsg` 支持 iMessage。本指南用于将旧的 `channels.bluebubbles` 配置迁移到 `channels.imessage`；没有其他受支持的迁移路径。

<Note>
如需简短公告和操作员摘要，请参阅 [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage)。
</Note>

## 迁移检查清单

当你已经了解旧的 BlueBubbles 配置，并希望采用最短的安全路径时，请使用此检查清单：

1. 在运行 Messages.app 的 Mac 上直接验证 `imsg`（`imsg chats`、`imsg history`、`imsg send` 和 `imsg rpc --help`）。
2. 将行为键从 `channels.bluebubbles` 复制到 `channels.imessage`：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`includeAttachments`、`attachmentRoots`、`mediaMaxMb`、`textChunkLimit`、`coalesceSameSenderDms` 和 `actions`。
3. 删除不再存在的传输键：`serverUrl`、`password`、webhook URL，以及 BlueBubbles 服务器设置。
4. 如果 Gateway 网关未在 Messages Mac 上运行，请将 `channels.imessage.cliPath` 设置为 SSH 包装器，并为远程附件获取设置 `remoteHost`。
5. 停止 Gateway 网关后，启用 `channels.imessage`，然后运行 `openclaw channels status --probe --channel imessage`。
6. 测试一个私信、一个允许的群组、附件（如果已启用），以及你期望智能体使用的每个私有 API 操作。
7. 在验证 iMessage 路径后，删除 BlueBubbles 服务器和旧的 `channels.bluebubbles` 配置。

## 何时适合迁移

- 你已经在 Messages.app 已登录的同一台 Mac（或可通过 SSH 访问的 Mac）上运行 `imsg`。
- 你希望减少一个组件 —— 不需要单独的 BlueBubbles 服务器，不需要要认证的 REST 端点，也不需要 webhook 管道。使用单个 CLI 二进制文件，而不是服务器 + 客户端应用 + 辅助程序。
- 你使用的是[受支持的 macOS / `imsg` 构建](/zh-CN/channels/imessage#requirements-and-permissions-macos)，且私有 API 探测报告 `available: true`。

## imsg 的作用

`imsg` 是用于 Messages 的本地 macOS CLI。OpenClaw 会将 `imsg rpc` 作为子进程启动，并通过 stdin/stdout 使用 JSON-RPC 通信。没有 HTTP 服务器、webhook URL、后台守护进程、launch agent，也没有需要暴露的端口。

- 读取通过只读 SQLite 句柄来自 `~/Library/Messages/chat.db`。
- 实时入站消息来自 `imsg watch` / `watch.subscribe`，它会跟随 `chat.db` 文件系统事件，并带有轮询回退。
- 发送会使用 Messages.app 自动化来发送普通文本和文件。
- 高级操作使用 `imsg launch` 将 `imsg` 辅助程序注入 Messages.app。这会解锁已读回执、输入指示器、富发送、编辑、撤回、线程回复、tapbacks 和群组管理。
- Linux 构建可以检查复制的 `chat.db`，但不能发送、监听实时 Mac 数据库，或驱动 Messages.app。对于 OpenClaw iMessage，请在已登录的 Mac 上运行 `imsg`，或通过指向该 Mac 的 SSH 包装器运行。

## 开始之前

1. 在运行 Messages.app 的 Mac 上安装 `imsg`：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   如果 `imsg chats` 因 `unable to open database file`、空输出或 `authorization denied` 而失败，请向启动 `imsg` 的终端、编辑器、Node 进程、Gateway 网关服务或 SSH 父进程授予完全磁盘访问权限，然后重新打开该父进程。

2. 在更改 OpenClaw 配置之前，验证读取、监听、发送和 RPC 表面：

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   将 `42` 替换为来自 `imsg chats` 的真实聊天 ID。发送需要 Messages.app 的自动化权限。如果 OpenClaw 将通过 SSH 运行，请通过 OpenClaw 将使用的同一 SSH 包装器或用户上下文运行这些命令。如果读取/探测正常但发送因 AppleEvents `-1743` 失败，请检查自动化权限是否落在 `/usr/libexec/sshd-keygen-wrapper` 上；请参阅 [SSH 包装器发送因 AppleEvents -1743 失败](/zh-CN/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743)。

3. 当你需要高级操作时，启用私有 API 桥接：

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` 要求禁用 SIP。基本发送、历史记录和监听无需 `imsg launch` 即可工作；高级操作则不行。

4. 添加已启用的 `channels.imessage` 配置后，通过 OpenClaw 验证桥接：

   ```bash
   openclaw channels status --probe
   ```

   你需要看到 `imessage.privateApi.available: true`。如果报告 `false`，请先修复它 —— 参见[能力检测](/zh-CN/channels/imessage#private-api-actions)。`channels status --probe` 只会探测已配置且已启用的账户。

5. 为你的配置创建快照：

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## 配置转换

iMessage 和 BlueBubbles 共享许多渠道级配置。发生变化的键主要是传输相关（REST 服务器与本地 CLI）。行为键（`dmPolicy`、`groupPolicy`、`allowFrom` 等）保持相同含义。

| BlueBubbles                                                | 内置 iMessage                          | 备注                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | 语义相同。                                                                                                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.serverUrl`                           | _（已移除）_                               | 没有 REST 服务器，该插件会通过 stdio 启动 `imsg rpc`。                                                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.password`                            | _（已移除）_                               | 不需要 webhook 认证。                                                                                                                                                                                                                                                                                                                                                    |
| _（隐式）_                                               | `channels.imessage.cliPath`               | 指向 `imsg` 的路径（默认 `imsg`）；SSH 请使用包装脚本。                                                                                                                                                                                                                                                                                                                       |
| _（隐式）_                                               | `channels.imessage.dbPath`                | 可选的 Messages.app `chat.db` 覆盖；省略时会自动检测。                                                                                                                                                                                                                                                                                                                |
| _（隐式）_                                               | `channels.imessage.remoteHost`            | `host` 或 `user@host`，仅当 `cliPath` 是 SSH 包装脚本且你希望通过 SCP 获取附件时才需要。                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | 值相同（`pairing` / `allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | 配对批准按 handle 迁移，而不是按 token。                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | 值相同（`allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | 相同。                                                                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **逐字复制此项，包括任何 `groups: { "*": { ... } }` 通配符条目。** 每群组的 `requireMention`、`tools`、`toolsBySender` 会迁移。使用 `groupPolicy: "allowlist"` 时，空的或缺失的 `groups` 块会静默丢弃每条群组消息，见下方“群组注册表陷阱”。                                                                                       |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | 默认 `true`。使用内置插件时，仅当私有 API 探测可用时才会触发。                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | 形状相同，**同样默认关闭**。如果你之前在 BlueBubbles 上启用了附件流转，必须在 iMessage 块中显式重新设置此项；它不会隐式迁移，在你设置之前，入站照片/媒体会被静默丢弃，且不会出现 `Inbound message` 日志行。                                                                                                     |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | 本地根路径；通配符规则相同。                                                                                                                                                                                                                                                                                                                                                    |
| _（不适用）_                                                    | `channels.imessage.remoteAttachmentRoots` | 仅在为 SCP 获取设置了 `remoteHost` 时使用。                                                                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage 默认 16 MB（BlueBubbles 默认是 8 MB）。如果你想保留较低上限，请显式设置。                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | 两者都默认 4000。                                                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 同样为选择启用。仅限私信，群聊在两个渠道上都会保留即时的逐消息分发。启用后，如果没有显式设置 `messages.inbound.byChannel.imessage` 或全局 `messages.inbound.debounceMs`，默认入站防抖会扩展到 7000 ms。见 [iMessage 文档 § 合并拆分发送的私信](/zh-CN/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition)。 |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _（不适用）_                                   | iMessage 已经从 `chat.db` 读取发送者显示名称。                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | 按操作开关：`reactions`、`edit`、`unsend`、`reply`、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`、`sendAttachment`。                                                                                                                                                                                                  |

多账户配置（`channels.bluebubbles.accounts.*`）会一对一转换为 `channels.imessage.accounts.*`。

## 群组注册表陷阱

内置 iMessage 插件会连续运行**两个**独立的群组 allowlist 门控。两者都必须通过，群组消息才能到达智能体：

1. **发送者 / 聊天目标 allowlist**（`channels.imessage.groupAllowFrom`）—— 由 `isAllowedIMessageSender` 检查。按发送者 handle、`chat_guid`、`chat_identifier` 或 `chat_id` 匹配入站消息。形状与 BlueBubbles 相同。
2. **群组注册表**（`channels.imessage.groups`）—— 由 `inbound-processing.ts:199` 中的 `resolveChannelGroupPolicy` 检查。使用 `groupPolicy: "allowlist"` 时，此门控需要以下任一项：
   - 一个 `groups: { "*": { ... } }` 通配符条目（设置 `allowAll = true`），或
   - `groups` 下显式的逐 `chat_id` 条目。

如果门控 1 通过但门控 2 失败，消息会被丢弃。该插件会发出两个 `warn` 级别信号，因此在默认日志级别下这不再是静默行为：

- 当设置了 `groupPolicy: "allowlist"` 但 `channels.imessage.groups` 为空（没有 `"*"` 通配符，也没有逐 `chat_id` 条目）时，每个账户会在启动时发出一次性 `warn`，在任何消息到达前触发。
- 运行时某个特定群组第一次被丢弃时，会按 `chat_id` 发出一次性 `warn`，其中会指明 chat_id 以及需要添加到 `groups` 中以允许它的确切键。

私信会继续工作，因为它们走的是不同的代码路径。

这是最常见的 BlueBubbles → 内置 iMessage 迁移失败模式：操作员复制了 `groupAllowFrom` 和 `groupPolicy`，但跳过了 `groups` 块，因为 BlueBubbles 的 `groups: { "*": { "requireMention": true } }` 看起来像一个无关的提及设置。实际上，它对注册表门控至关重要。

在 `groupPolicy: "allowlist"` 之后，要让群组消息继续流转，最低配置如下：

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

`*` 下的 `requireMention: true` 在未配置提及模式时是无害的：运行时会设置 `canDetectMention = false`，并在 `inbound-processing.ts:512` 短路跳过提及丢弃逻辑。配置了提及模式时（`agents.list[].groupChat.mentionPatterns`），它会按预期工作。

如果 Gateway 网关日志出现 `imessage: dropping group message from chat_id=<id>`，或启动行出现 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`，说明第 2 道门控正在丢弃消息，请添加 `groups` 块。

## 分步说明

1. 在现有 BlueBubbles 块旁边添加一个 iMessage 块。当 Gateway 网关仍在路由 BlueBubbles 流量时，保持它禁用：

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

2. **在流量真正相关之前探测** — 停止 Gateway 网关，临时启用 iMessage 块，并确认 iMessage 从 CLI 报告为健康：

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` 只探测已配置且已启用的账户。除非你明确希望两个频道监视器都运行，否则不要在 BlueBubbles 和 iMessage 同时启用的情况下重启 Gateway 网关。如果你不会立即切换，请在重启 Gateway 网关前把 `channels.imessage.enabled` 设回 `false`。在启用 OpenClaw 流量前，使用 [开始之前](#before-you-start) 中的直接 `imsg` 命令验证 Mac。

3. **切换。** 启用的 iMessage 账户报告健康后，移除 BlueBubbles 配置并保持 iMessage 启用：

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   重启 Gateway 网关。入站 iMessage 流量现在会通过内置插件流转。

4. **验证私信。** 向智能体发送一条直接消息；确认回复送达。

5. **单独验证群组。** 私信和群组走不同的代码路径 — 私信成功并不能证明群组正在路由。在已配对的群聊中向智能体发送一条消息，并确认回复送达。如果群组无响应（没有智能体回复，也没有错误），请检查 Gateway 网关日志是否有 `imessage: dropping group message from chat_id=<id>`，或启动时的 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` 行 — 两者都会在默认日志级别触发。如果出现任一项，说明你的 `groups` 块缺失或为空 — 请参见上面的“群组注册表陷阱”。

6. **验证操作表面** — 在已配对的私信中，让智能体执行 react、edit、unsend、reply、发送照片，以及（在群组中）重命名群组 / 添加或移除参与者。每个操作都应原生落到 Messages.app。如果任何操作抛出 “iMessage `<action>` requires the imsg private API bridge”，请再次运行 `imsg launch`，并刷新 `channels status --probe`。

7. 验证 iMessage 私信、群组和操作后，**移除 BlueBubbles 服务器和配置**。OpenClaw 不会使用 `channels.bluebubbles`。

## 操作对等性速览

| 操作                                                | 旧版 BlueBubbles                    | 内置 iMessage                                                                 |
| --------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| 发送文本 / SMS 回退                                 | ✅                                  | ✅                                                                            |
| 发送媒体（照片、视频、文件、语音）                  | ✅                                  | ✅                                                                            |
| 线程回复（`reply_to_guid`）                         | ✅                                  | ✅（关闭 [#51892](https://github.com/openclaw/openclaw/issues/51892)）        |
| Tapback（`react`）                                  | ✅                                  | ✅                                                                            |
| 编辑 / 撤回（macOS 13+ 接收方）                     | ✅                                  | ✅                                                                            |
| 发送带屏幕效果的消息                                | ✅                                  | ✅（关闭 [#9394](https://github.com/openclaw/openclaw/issues/9394) 的一部分） |
| 富文本粗体 / 斜体 / 下划线 / 删除线                 | ✅                                  | ✅（通过 attributedBody 进行 typed-run 格式化）                               |
| 重命名群组 / 设置群组图标                           | ✅                                  | ✅                                                                            |
| 添加 / 移除参与者，离开群组                         | ✅                                  | ✅                                                                            |
| 已读回执和输入指示器                                | ✅                                  | ✅（受私有 API 探测门控）                                                     |
| 同一发送者私信合并                                  | ✅                                  | ✅（仅限私信；通过 `channels.imessage.coalesceSameSenderDms` 选择启用）       |
| 重启后的入站恢复                                    | ✅（webhook 重放 + 历史拉取）       | ✅（自动：通过 since_rowid 重放遗漏消息 + 去重；本地窗口更宽）                |

iMessage 会恢复 Gateway 网关停机期间遗漏的消息：启动时，它会通过 `imsg watch.subscribe` 的 `since_rowid` 从最后已分发的 rowid 重放，并按 GUID 去重，同时用陈旧积压年龄围栏抑制 Push-flush 的“积压炸弹”。这会通过 `imsg` RPC 连接运行，因此也适用于远程 SSH `cliPath` 设置；本地设置可以读取 `chat.db`，所以恢复窗口更宽。请参见 [桥接器或 Gateway 网关重启后的入站恢复](/zh-CN/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart)。

## 配对、会话和 ACP 绑定

- **配对批准** 会按 handle 继承。你不需要重新批准已知发送者 — `channels.imessage.allowFrom` 会识别 BlueBubbles 使用的相同 `+15555550123` / `user@example.com` 字符串。
- **会话** 仍按智能体 + 聊天限定范围。默认 `session.dmScope=main` 下，私信会折叠进智能体主会话；群组会话会按 `chat_id` 保持隔离。会话键不同（`agent:<id>:imessage:group:<chat_id>` 与 BlueBubbles 等价项不同）— BlueBubbles 会话键下的旧对话历史不会带入 iMessage 会话。
- 引用 `match.channel: "bluebubbles"` 的 **ACP 绑定** 需要更新为 `"imessage"`。`match.peer.id` 的形状（`chat_id:`、`chat_guid:`、`chat_identifier:`、裸 handle）完全相同。

## 无回滚频道

没有受支持的 BlueBubbles 运行时可切回。如果 iMessage 验证失败，请设置 `channels.imessage.enabled: false`，重启 Gateway 网关，修复 `imsg` 阻塞项，然后重试切换。

回复缓存位于 SQLite 插件状态中。`openclaw doctor --fix` 会在旧的 `imessage/reply-cache.jsonl` sidecar 存在时导入并归档它。

## 相关内容

- [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage) — 简短公告和操作员摘要。
- [iMessage](/zh-CN/channels/imessage) — 完整的 iMessage 频道参考，包括 `imsg launch` 设置和能力检测。
- `/channels/bluebubbles` — 重定向到此迁移指南的旧版 URL。
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程。
- [频道路由](/zh-CN/channels/channel-routing) — Gateway 网关如何为出站回复选择频道。
