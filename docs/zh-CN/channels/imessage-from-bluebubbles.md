---
read_when:
    - 规划从 BlueBubbles 迁移到内置的 iMessage 插件
    - 将 BlueBubbles 配置键转换为对应的 iMessage 配置键
    - 启用 iMessage 插件前验证 imsg
summary: 将旧版 BlueBubbles 配置迁移到内置 iMessage 插件：键映射、群组白名单门控和切换验证。
title: Coming from BlueBubbles
x-i18n:
    generated_at: "2026-07-11T20:19:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9d1533c356d3901358c25f0b90e6850124f66d3c14f056d90d5723242076d22
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

BlueBubbles 支持已移除。OpenClaw 现在仅通过内置的 `imessage` 插件支持 iMessage；该插件通过 JSON-RPC 驱动 [`steipete/imsg`](https://github.com/steipete/imsg)，并可访问与 BlueBubbles 相同的私有 API 功能面（`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、原生投票、群组管理、附件）。一个 CLI 二进制文件取代了 BlueBubbles 服务器、客户端应用和 webhook 管道：无需 REST 端点，也无需 webhook 身份验证。

本指南将旧的 `channels.bluebubbles` 配置迁移到 `channels.imessage`。不存在其他受支持的迁移路径。在当前版本的 OpenClaw 中，残留的 `channels.bluebubbles` 配置块不会生效——没有任何运行时会读取它。

<Note>
有关简短公告和运维摘要，请参阅 [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage)。
</Note>

## 迁移检查清单

如果你已了解旧的 BlueBubbles 配置，最简短且安全的迁移路径如下：

1. 直接在运行 Messages.app 的 Mac 上验证 `imsg`（`imsg chats`、`imsg history`、`imsg send`、`imsg rpc --help`）。
2. 将行为键从 `channels.bluebubbles` 复制到 `channels.imessage`：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`includeAttachments`、`attachmentRoots`、`mediaMaxMb`、`textChunkLimit`、`coalesceSameSenderDms` 和 `actions`。
3. 删除已不存在的传输键：`serverUrl`、`password`、webhook URL，以及 BlueBubbles 服务器设置。
4. 如果 Gateway 网关不在 Messages 所在的 Mac 上运行，请将 `channels.imessage.cliPath` 设置为 SSH 包装器，并为远程附件获取设置 `remoteHost`。
5. 启用 `channels.imessage`，重启 Gateway 网关，然后运行 `openclaw channels status --probe --channel imessage`。
6. 测试一条私信、一个已允许的群组、附件（如果已启用），以及你希望智能体使用的每项私有 API 操作。
7. 验证 iMessage 路径后，删除 BlueBubbles 服务器和旧的 `channels.bluebubbles` 配置。

## imsg 的作用

`imsg` 是用于 Messages 的本地 macOS CLI。OpenClaw 会将 `imsg rpc` 作为子进程启动，并通过标准输入/标准输出使用 JSON-RPC 与其通信。不需要 HTTP 服务器、webhook URL、后台守护进程、启动代理，也没有需要暴露的端口。

- 读取操作通过只读 SQLite 句柄访问 `~/Library/Messages/chat.db`。
- 实时入站消息来自 `imsg watch` / `watch.subscribe`，它会跟踪 `chat.db` 的文件系统事件，并在必要时回退到轮询。
- 普通文本和文件发送通过 Messages.app 自动化完成。
- 高级操作使用 `imsg launch` 将 `imsg` 辅助程序注入 Messages.app。由此可启用已读回执、输入状态指示、富文本发送、编辑、撤回、线程回复、点按回应、投票和群组管理。
- Linux 版本可以检查复制过来的 `chat.db`，但不能发送消息、监视 Mac 上的实时数据库或驱动 Messages.app。要使用 OpenClaw iMessage，请在已登录的 Mac 上运行 `imsg`，或通过指向该 Mac 的 SSH 包装器运行它。

## 开始之前

1. 在运行 Messages.app 的 Mac 上安装 `imsg`：

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   对于常见的本地设置，OpenClaw 设置流程可以在已登录 Messages 的 Mac 上，经用户确认后使用 Homebrew 安装或更新 `imsg`。手动设置和 SSH 包装器拓扑仍由操作员管理：请在将要运行 `imsg` 的同一本地或远程用户上下文中重复执行 Homebrew 更新。如果 `imsg chats` 失败并显示 `unable to open database file`、输出为空或显示 `authorization denied`，请向启动 `imsg` 的终端、编辑器、Node 进程、Gateway 网关服务或 SSH 父进程授予 Full Disk Access，然后重新打开该父进程。

2. 在更改 OpenClaw 配置之前，验证读取、监视、发送和 RPC 功能面：

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   将 `42` 替换为从 `imsg chats` 获取的真实聊天 ID。发送消息需要 Messages.app 的 Automation 权限。如果 OpenClaw 将通过 SSH 运行，请通过 OpenClaw 将使用的同一 SSH 包装器或用户上下文运行这些命令。如果读取正常，但发送因 AppleEvents `-1743` 而失败，请检查 Automation 权限是否授予了 `/usr/libexec/sshd-keygen-wrapper`；请参阅 [SSH 包装器发送因 AppleEvents -1743 而失败](/zh-CN/channels/imessage#requirements-and-permissions-macos)。

3. 启用私有 API 桥接。强烈建议为 OpenClaw iMessage 启用它，因为回复、点按回应、效果、投票、附件回复和群组操作都依赖此功能：

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` 要求禁用 SIP（在现代 macOS 上，还需要放宽库验证——请参阅[启用 imsg 私有 API](/zh-CN/channels/imessage#enabling-the-imsg-private-api)）。无需运行 `imsg launch` 即可使用基本发送、历史记录和监视功能，但无法使用完整的 OpenClaw iMessage 操作功能面。

4. 启用 `channels.imessage` 并启动 Gateway 网关后，通过 OpenClaw 验证桥接：

   ```bash
   openclaw channels status --probe
   ```

   iMessage 账户应报告 `works`；使用 `--json` 时，探测载荷中应包含 `privateApi.available: true`。如果报告为 `false`，请先修复此问题——请参阅[能力检测](/zh-CN/channels/imessage#private-api-actions)。探测需要可访问的 Gateway 网关（否则 CLI 会回退为仅输出配置），并且只会探测已配置且已启用的账户。

5. 备份你的配置：

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## 配置转换

iMessage 和 BlueBubbles 共享大多数渠道级行为键。变化之处在于传输方式（REST 服务器与本地 CLI）以及群组注册表键的格式。

| BlueBubbles                                                | 内置 iMessage                             | 说明                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | 语义相同（配置块存在后默认为 `true`）。                                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.serverUrl`                           | _（已移除）_                              | 不使用 REST 服务器——插件通过 stdio 启动 `imsg rpc`。                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.password`                            | _（已移除）_                              | 无需 webhook 身份验证。                                                                                                                                                                                                                                                                                               |
| _（隐式）_                                                 | `channels.imessage.cliPath`               | `imsg` 的路径（默认为 `imsg`）；通过 SSH 使用时请采用包装脚本。                                                                                                                                                                                                                                                       |
| _（隐式）_                                                 | `channels.imessage.dbPath`                | 可选的 Messages.app `chat.db` 路径覆盖；省略时自动检测。                                                                                                                                                                                                                                                              |
| _（隐式）_                                                 | `channels.imessage.remoteHost`            | `host` 或 `user@host`——仅当 `cliPath` 是 SSH 包装脚本，并且你希望通过 SCP 获取附件时才需要。                                                                                                                                                                                                                          |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | 值相同（`pairing` / `allowlist` / `open` / `disabled`）；默认为 `pairing`。                                                                                                                                                                                                                                           |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | 句柄格式相同（`+15555550123`、`user@example.com`）。配对存储中的批准记录不会迁移——见下文。                                                                                                                                                                                                                             |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | 值相同（`allowlist` / `open` / `disabled`）；默认为 `allowlist`。                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | 相同。未设置时，iMessage 会回退到 `allowFrom`；显式设置空的 `groupAllowFrom: []` 会在 `groupPolicy: "allowlist"` 下阻止所有群组。                                                                                                                                                                                        |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | 原样复制 `"*"` 通配符条目；按数字形式的 iMessage `chat_id` 重新设置各群组条目的键——参见“群组注册表陷阱”。`requireMention`、`tools`、`toolsBySender`、`systemPrompt` 可直接沿用。                                                                                                                                           |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | 默认为 `true`。使用内置插件时，仅当私有 API 探测正常运行时才会触发。                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | 结构相同，且同样默认关闭。如果 BlueBubbles 中启用了附件传输，请显式设置此项——在设置之前，入站照片和媒体会被静默丢弃（不会产生 `Inbound message` 日志行）。                                                                                                                                                              |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | 本地根目录；通配符规则相同。                                                                                                                                                                                                                                                                                          |
| _（不适用）_                                               | `channels.imessage.remoteAttachmentRoots` | 仅在设置了 `remoteHost` 以通过 SCP 获取文件时使用。                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage 上默认为 16 MB（BlueBubbles 的默认值为 8 MB）。若要保留较低的上限，请显式设置。                                                                                                                                                                                                                               |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | 两者均默认为 4000。                                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 同样需要选择启用。仅适用于私信——群组仍按消息逐条分派。除非设置了 `messages.inbound.byChannel.imessage` 或全局 `messages.inbound.debounceMs`，否则会将默认入站防抖时间延长至 7000 毫秒。参见[合并拆分发送的私信](/zh-CN/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition)。 |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _（不适用）_                              | `imsg` 已经会从 `chat.db` 提供发送者显示名称。                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | 每项操作的开关相同（`reactions`、`edit`、`unsend`、`reply`、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`、`sendAttachment`），并新增 `polls`。所有操作默认启用；私有 API 操作仍然需要桥接器。                                                                     |

多账户配置（`channels.bluebubbles.accounts.*`）可一一对应转换为 `channels.imessage.accounts.*`。

## 群组注册表陷阱

内置 iMessage 插件会依次执行两道群组门控。群组消息必须同时通过两者才能到达智能体：

1. **发送者/聊天目标允许列表**（`channels.imessage.groupAllowFrom`）——匹配发送者句柄或聊天目标（`chat_id:`、`chat_guid:`、`chat_identifier:` 条目）。未设置 `groupAllowFrom` 时，此门控会回退到 `allowFrom`；显式设置 `groupAllowFrom: []` 会禁用该回退，并在 `groupPolicy: "allowlist"` 下丢弃所有群组消息。
2. **群组注册表**（`channels.imessage.groups`）——以数字形式的 iMessage `chat_id` 为键：
   - 没有 `groups` 配置块（或配置块为空）：只要门控 1 的有效发送者允许列表非空，群组即可通过此门控；访问权限由发送者过滤控制，并且启动时不会触发“全部丢弃”警告。
   - `groups` 包含条目但没有 `"*"`：仅列出的 `chat_id` 键可以通过。即使 `groupPolicy: "open"`，列出任何群组也会使注册表成为允许列表。
   - `groups: { "*": { ... } }`：所有群组均可通过此门控。

迁移陷阱：BlueBubbles 的 `groups` 条目以聊天 GUID/聊天标识符为键，而 iMessage 注册表以数字形式的 `chat_id` 为键。原样复制各群组条目会创建一个非空注册表，但其中的键永远无法匹配，因此所有群组消息都会在门控 2 被丢弃。请原样复制 `"*"` 通配符；使用 `imsg chats` 中的 `chat_id` 值重新设置特定群组条目的键。

两种丢弃路径都会通过 `warn` 日志行显示在默认日志级别中：

- 每个账户在启动时最多一次：当设置了 `groupPolicy: "allowlist"`，但有效的群组发送者允许列表为空时：`imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`。设置 `groupAllowFrom`（或 `allowFrom`）以允许发送者；仅添加 `groups` 无法满足发送者门控。
- 运行时每个 `chat_id` 最多一次：当注册表丢弃群组时：`imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`，其中会指明需要添加的确切键。

无论哪种情况，私信仍可正常工作——私信采用不同的代码路径，因此私信成功并不能证明群组路由正常。

使用 `groupPolicy: "allowlist"` 时，最精简的发送者范围配置如下：

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

此配置允许已配置的发送者在任意群组中发送消息。添加 `groups` 条目可限定允许的聊天，或设置 `requireMention` 等按聊天配置的选项；请原样复制 BlueBubbles 的 `"*"` 条目，但要使用数字形式的 iMessage `chat_id` 值重新设置特定条目的键。

## 分步操作

1. 迁移配置。编辑时保持新配置块禁用；当前 OpenClaw 会忽略旧的 `channels.bluebubbles` 配置块，因此可将其保留在旁边作为参考：

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // 准备好切换时改为 true
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // 从 bluebubbles.allowFrom 复制
         groupPolicy: "allowlist",
         groupAllowFrom: [], // 从 bluebubbles.groupAllowFrom 复制
         groups: { "*": { requireMention: true } }, // 通配符配置原样复制；按 chat_id 重新设置每个聊天的条目键名
         // 操作默认启用；将各个开关设为 false 可单独禁用
       },
     },
   }
   ```

2. **切换并探测。** 设置 `channels.imessage.enabled: true`，重启 Gateway 网关，并确认渠道报告为健康状态：

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # 预期显示 "works"；--json 会显示 privateApi.available: true
   ```

   探测需要可访问的 Gateway 网关，并且仅探测已配置且启用的账户。使用[开始之前](#before-you-start)中的直接 `imsg` 命令验证 Mac 本身。

3. **验证私信。** 向智能体发送一条私信，确认回复成功送达。

4. **单独验证群组。** 私信和群组使用不同的代码路径——私信成功并不能证明群组路由正常。在允许的群聊中发送一条消息，并确认回复成功送达。如果群组没有任何响应（没有智能体回复，也没有错误），请检查 Gateway 网关日志中上文“群组注册表陷阱”所述的两行 `warn`。启动警告表示实际生效的发送者允许列表为空；针对特定 `chat_id` 的警告表示非空的 `groups` 注册表中不包含该聊天。

5. **验证操作能力。** 在已配对的私信中，让智能体依次添加表情回应、编辑、撤回、回复、发送照片，并在群组中重命名群组或添加/移除参与者。每项操作都应原生呈现在 Messages.app 中。如果任何操作抛出 `iMessage <action> requires the imsg private API bridge`，请再次运行 `imsg launch`，然后使用 `openclaw channels status --probe` 刷新状态。

6. 验证 iMessage 私信、群组和操作后，**移除 BlueBubbles 服务器和 `channels.bluebubbles` 配置块**。OpenClaw 不会读取 `channels.bluebubbles`。

## 操作能力对照一览

| 操作                                                | 旧版 BlueBubbles | 内置 iMessage                                                                  |
| --------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------- |
| 发送文本 / SMS 回退                                 | ✅               | ✅                                                                            |
| 发送媒体（照片、视频、文件、语音）                  | ✅               | ✅                                                                            |
| 线程回复（`reply_to_guid`）                         | ✅               | ✅（关闭 [#51892](https://github.com/openclaw/openclaw/issues/51892)）        |
| Tapback（`react`）                                  | ✅               | ✅                                                                            |
| 编辑 / 撤回（接收者使用 macOS 13+）                | ✅               | ✅                                                                            |
| 使用屏幕效果发送                                    | ✅               | ✅（关闭 [#9394](https://github.com/openclaw/openclaw/issues/9394) 的一部分） |
| 富文本粗体 / 斜体 / 下划线 / 删除线                | ✅               | ✅（通过 attributedBody 实现类型化文本段格式）                                |
| 原生 Messages 投票（创建和投票）                   | ❌               | ✅（`actions.polls`；接收者需要 iOS/macOS 26+ 才能原生呈现）                  |
| 重命名群组 / 设置群组图标                           | ✅               | ✅                                                                            |
| 添加 / 移除参与者、退出群组                         | ✅               | ✅                                                                            |
| 已读回执和输入状态指示器                            | ✅               | ✅（由私有 API 探测结果控制）                                                 |
| 合并同一发送者的私信                                | ✅               | ✅（仅限私信；通过 `channels.imessage.coalesceSameSenderDms` 选择启用）       |
| 重启后的入站恢复                                    | ✅               | ✅（自动执行：`since_rowid` 重放 + GUID 去重；本地模式使用更宽的时间窗口）    |

iMessage 会恢复 Gateway 网关停机期间遗漏的消息：启动时，它通过 `imsg watch.subscribe` 的 `since_rowid` 从最后一个已分发的 rowid 开始重放，按 GUID 去重，并使用过期积压消息的时间围栏抑制 Push 刷新引发的“积压消息爆发”。该机制通过 `imsg` RPC 连接运行，因此也适用于远程 SSH `cliPath` 设置；本地设置可以读取 `chat.db`，因而获得更宽的恢复时间窗口。请参阅[桥接或 Gateway 网关重启后的入站恢复](/zh-CN/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart)。

## 配对、会话和 ACP 绑定

- **允许列表按联系标识继承。** `channels.imessage.allowFrom` 可识别 BlueBubbles 使用的相同 `+15555550123` / `user@example.com` 字符串——原样复制即可。
- **配对存储中的批准不会转移。** 配对存储按渠道隔离，旧的 BlueBubbles 存储不会被迁移。仅通过配对获得批准的发送者必须在 iMessage 下重新配对一次，或者你可以将其联系标识添加到 `allowFrom`。
- **会话**仍按智能体和聊天划分作用域。在默认的 `session.dmScope=main` 设置下，私信会合并到智能体的主会话；群组会话则按 `chat_id` 保持隔离（`agent:<agentId>:imessage:group:<chat_id>`）。BlueBubbles 会话键下的旧对话历史不会转移到 iMessage 会话中。
- 引用 `match.channel: "bluebubbles"` 的 **ACP 绑定**必须改为 `"imessage"`。`match.peer.id` 的格式（`chat_id:`、`chat_guid:`、`chat_identifier:`、不带前缀的联系标识）完全相同。

## 无回滚渠道

没有受支持的 BlueBubbles 运行时可供切回。如果 iMessage 验证失败，请设置 `channels.imessage.enabled: false`，重启 Gateway 网关，修复阻碍 `imsg` 的问题，然后重新尝试切换。

回复缓存位于 SQLite 插件状态中。如果旧的 `imessage/reply-cache.jsonl` 辅助文件存在，`openclaw doctor --fix` 会将其导入并归档。

## 相关内容

- [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage) — 简短公告和运维人员摘要。
- [iMessage](/zh-CN/channels/imessage) — 完整的 iMessage 渠道参考，包括 `imsg launch` 设置和能力检测。
- `/channels/bluebubbles` — 重定向到本迁移指南的旧版 URL。
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程。
- [频道路由](/zh-CN/channels/channel-routing) — Gateway 网关如何为出站回复选择渠道。
