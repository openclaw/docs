---
read_when:
    - 计划从 BlueBubbles 迁移到内置 iMessage 插件
    - 将 BlueBubbles 配置键转换为 iMessage 等效项
    - 启用 iMessage 插件前验证 imsg
summary: 将旧 BlueBubbles 配置转换为内置 iMessage 插件：键映射、群组允许列表门控和切换验证。
title: Coming from BlueBubbles
x-i18n:
    generated_at: "2026-07-05T17:39:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93d4a6adb1ad0548368ce840f419339fdfe294ea19eca2e94f665c3b4613af4c
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

已移除 BlueBubbles 支持。OpenClaw 仅通过内置的 `imessage` 插件支持 iMessage，该插件通过 JSON-RPC 驱动 [`steipete/imsg`](https://github.com/steipete/imsg)，并可访问 BlueBubbles 曾使用的同一私有 API 表面（`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、原生投票、群组管理、附件）。一个 CLI 二进制文件取代了 BlueBubbles 服务器 + 客户端应用 + webhook 管道：没有 REST 端点，也没有 webhook 认证。

本指南将旧的 `channels.bluebubbles` 配置迁移到 `channels.imessage`。没有其他受支持的迁移路径。在当前 OpenClaw 中，残留的 `channels.bluebubbles` 块是惰性的——运行时不会读取它。

<Note>
有关简短公告和操作员摘要，请参阅 [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage)。
</Note>

## 迁移检查清单

如果你已经知道旧的 BlueBubbles 配置，最短的安全路径是：

1. 在运行 Messages.app 的 Mac 上直接验证 `imsg`（`imsg chats`、`imsg history`、`imsg send`、`imsg rpc --help`）。
2. 将行为键从 `channels.bluebubbles` 复制到 `channels.imessage`：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`includeAttachments`、`attachmentRoots`、`mediaMaxMb`、`textChunkLimit`、`coalesceSameSenderDms` 和 `actions`。
3. 删除不再存在的传输键：`serverUrl`、`password`、webhook URL，以及 BlueBubbles 服务器设置。
4. 如果 Gateway 网关未在 Messages Mac 上运行，请将 `channels.imessage.cliPath` 设置为 SSH 包装器，并为远程附件获取设置 `remoteHost`。
5. 启用 `channels.imessage`，重启 Gateway 网关，然后运行 `openclaw channels status --probe --channel imessage`。
6. 测试一个私信、一个允许的群组、附件（如果已启用），以及你期望智能体使用的每个私有 API 操作。
7. 在验证 iMessage 路径后，删除 BlueBubbles 服务器和旧的 `channels.bluebubbles` 配置。

## imsg 的作用

`imsg` 是用于 Messages 的本地 macOS CLI。OpenClaw 会将 `imsg rpc` 作为子进程启动，并通过 stdin/stdout 使用 JSON-RPC 通信。没有 HTTP 服务器、webhook URL、后台守护进程、launch agent，也没有需要暴露的端口。

- 读取通过只读 SQLite 句柄来自 `~/Library/Messages/chat.db`。
- 实时入站消息来自 `imsg watch` / `watch.subscribe`，它会跟踪 `chat.db` 文件系统事件，并带有轮询后备机制。
- 发送对普通文本和文件发送使用 Messages.app 自动化。
- 高级操作使用 `imsg launch` 将 `imsg` 帮助程序注入 Messages.app。这会解锁已读回执、正在输入指示、富文本发送、编辑、撤回、线程回复、tapbacks、投票和群组管理。
- Linux 构建可以检查复制的 `chat.db`，但不能发送、监听实时 Mac 数据库，也不能驱动 Messages.app。对于 OpenClaw iMessage，请在已登录的 Mac 上运行 `imsg`，或通过指向该 Mac 的 SSH 包装器运行。

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

   将 `42` 替换为来自 `imsg chats` 的真实聊天 ID。发送需要 Messages.app 的自动化权限。如果 OpenClaw 将通过 SSH 运行，请通过 OpenClaw 将使用的同一个 SSH 包装器或用户上下文运行这些命令。如果读取正常但发送因 AppleEvents `-1743` 失败，请检查自动化权限是否落在 `/usr/libexec/sshd-keygen-wrapper` 上；参阅 [SSH 包装器发送因 AppleEvents -1743 失败](/zh-CN/channels/imessage#requirements-and-permissions-macos)。

3. 当你需要高级操作时，启用私有 API 桥接：

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` 要求禁用 SIP（并且在现代 macOS 上，需要放宽库验证——参阅 [启用 imsg 私有 API](/zh-CN/channels/imessage#enabling-the-imsg-private-api)）。基本发送、历史记录和监听不需要 `imsg launch`；高级操作需要。

4. 启用 `channels.imessage` 并启动 Gateway 网关后，通过 OpenClaw 验证桥接：

   ```bash
   openclaw channels status --probe
   ```

   iMessage 账户应报告 `works`；使用 `--json` 时，探测载荷包含 `privateApi.available: true`。如果它报告 `false`，请先修复该问题——参阅 [能力检测](/zh-CN/channels/imessage#private-api-actions)。探测需要可访问的 Gateway 网关（否则 CLI 会回退到仅配置输出），并且只探测已配置且已启用的账户。

5. 创建你的配置快照：

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## 配置转换

iMessage 和 BlueBubbles 共享大多数渠道级行为键。变化的是传输方式（REST 服务器 vs 本地 CLI）和群组注册表键格式。

| BlueBubbles                                                | 内置 iMessage                            | 备注                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | 语义相同（一旦该块存在，默认值为 `true`）。                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.serverUrl`                           | _(已移除)_                               | 没有 REST 服务器 — 插件会通过 stdio 启动 `imsg rpc`。                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.password`                            | _(已移除)_                               | 不需要 webhook 身份验证。                                                                                                                                                                                                                                                                                                      |
| _(隐式)_                                                   | `channels.imessage.cliPath`               | 指向 `imsg` 的路径（默认 `imsg`）；SSH 使用包装脚本。                                                                                                                                                                                                                                                                           |
| _(隐式)_                                                   | `channels.imessage.dbPath`                | 可选的 Messages.app `chat.db` 覆盖路径；省略时会自动检测。                                                                                                                                                                                                                                                                     |
| _(隐式)_                                                   | `channels.imessage.remoteHost`            | `host` 或 `user@host` — 仅当 `cliPath` 是 SSH 包装脚本且你想用 SCP 获取附件时才需要。                                                                                                                                                                                                                                         |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | 取值相同（`pairing` / `allowlist` / `open` / `disabled`）；默认 `pairing`。                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | 句柄格式相同（`+15555550123`、`user@example.com`）。配对存储中的批准不会转移 — 见下文。                                                                                                                                                                                                                                       |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | 取值相同（`allowlist` / `open` / `disabled`）；默认 `allowlist`。                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | 相同。未设置时，iMessage 会回退到 `allowFrom`；显式为空的 `groupAllowFrom: []` 会在 `groupPolicy: "allowlist"` 下阻止所有群组。                                                                                                                                                                                                 |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | 逐字复制 `"*"` 通配符条目；按数字形式的 iMessage `chat_id` 重新为每个群组条目设键 — 见“群组注册表陷阱”。`requireMention`、`tools`、`toolsBySender`、`systemPrompt` 会继承。                                                                                                              |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | 默认 `true`。使用内置插件时，只有私有 API 探测启动后才会触发。                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | 形状相同，也同样默认关闭。如果附件在 BlueBubbles 上曾经流入，请显式设置此项 — 在你这样做之前，入站照片/媒体会被静默丢弃（没有 `Inbound message` 日志行）。                                                                                                                                                                     |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | 本地根目录；通配符规则相同。                                                                                                                                                                                                                                                                                                  |
| _(不适用)_                                                 | `channels.imessage.remoteAttachmentRoots` | 仅在为 SCP 获取设置了 `remoteHost` 时使用。                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage 上默认 16 MB（BlueBubbles 默认是 8 MB）。若要保留较低上限，请显式设置。                                                                                                                                                                                                                                              |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | 两者默认都是 4000。                                                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 相同的选择启用项。仅适用于私信 — 群组会保持逐消息分发。除非设置了 `messages.inbound.byChannel.imessage` 或全局 `messages.inbound.debounceMs`，否则默认入站防抖会扩大到 7000 ms。见[合并分开发送的私信](/zh-CN/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition)。 |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(不适用)_                               | `imsg` 已经会从 `chat.db` 暴露发送者显示名。                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | 相同的逐动作开关（`reactions`、`edit`、`unsend`、`reply`、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`、`sendAttachment`），并新增 `polls`。全部默认启用；私有 API 动作仍然需要桥接。                         |

多账号配置（`channels.bluebubbles.accounts.*`）会一对一转换为 `channels.imessage.accounts.*`。

## 群组注册表陷阱

内置 iMessage 插件会连续运行两个群组门禁。群组消息必须同时通过两者才能到达智能体：

1. **发送者 / 聊天目标允许列表**（`channels.imessage.groupAllowFrom`）— 匹配发送者句柄或聊天目标（`chat_id:`、`chat_guid:`、`chat_identifier:` 条目）。未设置 `groupAllowFrom` 时，此门禁会回退到 `allowFrom`；显式的 `groupAllowFrom: []` 会禁用该回退，并在 `groupPolicy: "allowlist"` 下丢弃每条群组消息。
2. **群组注册表**（`channels.imessage.groups`）— 以数字形式的 iMessage `chat_id` 为键：
   - 没有 `groups` 块（或为空）：只要门禁 1 有一个非空的有效发送者允许列表，群组就会通过此门禁；发送者过滤控制访问权限，并且不会触发全部丢弃的启动警告。
   - `groups` 有条目但没有 `"*"`：只有列出的 `chat_id` 键会通过。列出任意群组都会让注册表变成允许列表，即使在 `groupPolicy: "open"` 下也是如此。
   - `groups: { "*": { ... } }`：每个群组都会通过此门禁。

迁移陷阱：BlueBubbles 使用聊天 GUID / 聊天标识符作为 `groups` 条目的键，而 iMessage 注册表使用数字形式的 `chat_id` 作为键。逐字复制每个群组条目会创建一个非空注册表，但其中的键永远无法匹配，因此每条群组消息都会在门禁 2 被丢弃。逐字复制 `"*"` 通配符；使用来自 `imsg chats` 的 `chat_id` 值重新为特定群组条目设键。

两个丢弃路径都会通过默认日志级别的 `warn` 行显示：

- 启动时每个账号一次，当设置了 `groupPolicy: "allowlist"` 且有效群组发送者允许列表为空时：`imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`。设置 `groupAllowFrom`（或 `allowFrom`）以允许发送者；仅添加 `groups` 不会满足发送者门禁。
- 运行时每个 `chat_id` 一次，当注册表丢弃群组时：`imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`，并指出要添加的确切键。

无论哪种情况，私信都会继续工作 — 它们走不同的代码路径，因此私信成功并不能证明群组路由正常。

使用 `groupPolicy: "allowlist"` 时，最小的发送者范围配置：

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
    },
  },
}
```

这会允许配置的发送者进入任意群组。添加 `groups` 条目可以限定允许的聊天，或设置每个聊天的选项，例如 `requireMention`；逐字复制 BlueBubbles 的 `"*"` 条目，但使用数字形式的 iMessage `chat_id` 值重新为特定条目设键。

## 分步说明

1. 翻译配置。编辑时保持新块禁用；旧的 `channels.bluebubbles` 块会被当前 OpenClaw 忽略，可以作为参考并存：

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // flip to true when ready to cut over
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // wildcard copies verbatim; re-key per-chat entries by chat_id
         // actions default to enabled; set individual toggles false to disable
       },
     },
   }
   ```

2. **切换并探测。** 设置 `channels.imessage.enabled: true`，重启 Gateway 网关，并确认该渠道报告为健康：

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # expect "works"; --json shows privateApi.available: true
   ```

   该探测需要可访问的 Gateway 网关，并且只探测已配置、已启用的账号。使用 [开始之前](#before-you-start) 中的直接 `imsg` 命令验证 Mac 本身。

3. **验证私信。** 向智能体发送一条直接消息；确认回复送达。

4. **单独验证群组。** 私信和群组走不同的代码路径——私信成功并不能证明群组正在路由。在允许的群聊中发送一条消息，并确认回复送达。如果群组静默（没有智能体回复，也没有错误），请检查 Gateway 网关日志中来自上文“群组注册表陷阱”的两条 `warn` 行。启动警告表示有效发送者允许列表为空；按 `chat_id` 的警告表示已填充的 `groups` 注册表不包含该聊天。

5. **验证操作表面。** 从已配对的私信中，让智能体执行表情回应、编辑、撤回、回复、发送照片，以及（在群组中）重命名群组或添加/移除参与者。每个操作都应原生送达 Messages.app。如果任何操作抛出 `iMessage <action> requires the imsg private API bridge`，请再次运行 `imsg launch`，并用 `openclaw channels status --probe` 刷新。

6. **移除 BlueBubbles 服务器和 `channels.bluebubbles` 块**，前提是 iMessage 私信、群组和操作都已验证。OpenClaw 不会读取 `channels.bluebubbles`。

## 操作对等性速览

| 操作                                                | 旧版 BlueBubbles | 内置 iMessage                                                                  |
| --------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| 发送文本 / SMS 回退                                 | ✅                 | ✅                                                                            |
| 发送媒体（照片、视频、文件、语音）                  | ✅                 | ✅                                                                            |
| 线程回复（`reply_to_guid`）                         | ✅                 | ✅（关闭 [#51892](https://github.com/openclaw/openclaw/issues/51892)）       |
| Tapback（`react`）                                  | ✅                 | ✅                                                                            |
| 编辑 / 撤回（macOS 13+ 接收者）                     | ✅                 | ✅                                                                            |
| 发送屏幕效果                                        | ✅                 | ✅（关闭 [#9394](https://github.com/openclaw/openclaw/issues/9394) 的一部分） |
| 富文本粗体 / 斜体 / 下划线 / 删除线                 | ✅                 | ✅（通过 attributedBody 进行 typed-run 格式化）                               |
| 原生 Messages 投票（创建和投票）                    | ❌                 | ✅（`actions.polls`；接收者需要 iOS/macOS 26+ 才能原生渲染）                 |
| 重命名群组 / 设置群组图标                           | ✅                 | ✅                                                                            |
| 添加 / 移除参与者、退出群组                         | ✅                 | ✅                                                                            |
| 已读回执和正在输入指示器                            | ✅                 | ✅（受私有 API 探测门控）                                                     |
| 同发送者私信合并                                    | ✅                 | ✅（仅私信；通过 `channels.imessage.coalesceSameSenderDms` 选择启用）        |
| 重启后的入站恢复                                    | ✅                 | ✅（自动：`since_rowid` 回放 + GUID 去重；本地窗口更宽）                     |

iMessage 会恢复 Gateway 网关停机期间漏掉的消息：启动时，它通过 `imsg watch.subscribe` 的 `since_rowid` 从上次已分发的 rowid 回放，按 GUID 去重，并用过期积压年龄围栏抑制 Push-flush 的“积压爆发”。这运行在 `imsg` RPC 连接上，因此也适用于远程 SSH `cliPath` 设置；本地设置会获得更宽的恢复窗口，因为它们可以读取 `chat.db`。参见[桥接或 Gateway 网关重启后的入站恢复](/zh-CN/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart)。

## 配对、会话和 ACP 绑定

- **允许列表按 handle 继承。** `channels.imessage.allowFrom` 可识别 BlueBubbles 使用的相同 `+15555550123` / `user@example.com` 字符串——请逐字复制。
- **配对存储批准不会转移。** 配对存储按渠道划分，不会迁移旧的 BlueBubbles 存储。仅通过配对获批的发送者必须在 iMessage 下重新配对一次，或者你将其 handle 添加到 `allowFrom`。
- **会话** 仍按智能体 + 聊天限定范围。在默认 `session.dmScope=main` 下，私信会折叠到智能体主会话；群组会话按 `chat_id` 保持隔离（`agent:<agentId>:imessage:group:<chat_id>`）。BlueBubbles 会话键下的旧对话历史不会带入 iMessage 会话。
- **ACP 绑定** 中引用 `match.channel: "bluebubbles"` 的地方必须改为 `"imessage"`。`match.peer.id` 形状（`chat_id:`、`chat_guid:`、`chat_identifier:`、裸 handle）相同。

## 无回滚渠道

没有受支持的 BlueBubbles 运行时可切回。如果 iMessage 验证失败，请设置 `channels.imessage.enabled: false`，重启 Gateway 网关，修复 `imsg` 阻塞项，然后重试切换。

回复缓存位于 SQLite 插件状态中。`openclaw doctor --fix` 会在旧的 `imessage/reply-cache.jsonl` sidecar 存在时导入并归档它。

## 相关

- [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage)——简短公告和操作员摘要。
- [iMessage](/zh-CN/channels/imessage)——完整 iMessage 渠道参考，包括 `imsg launch` 设置和能力检测。
- `/channels/bluebubbles`——重定向到本迁移指南的旧版 URL。
- [配对](/zh-CN/channels/pairing)——私信认证和配对流程。
- [频道路由](/zh-CN/channels/channel-routing)——Gateway 网关如何为出站回复选择渠道。
