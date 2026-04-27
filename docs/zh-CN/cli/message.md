---
read_when:
    - 添加或修改消息 CLI 操作
    - 更改出站渠道行为
summary: '`openclaw message` 的 CLI 参考（发送 + 渠道操作）'
title: 消息
x-i18n:
    generated_at: "2026-04-27T20:10:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43f14b3815d89c92a7503e620e2424f41a3f6b92e20e089504017305b19bace4
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

用于发送消息和执行渠道操作的单一出站命令
（Discord/Google Chat/iMessage/Matrix/Mattermost（插件）/Microsoft Teams/Signal/Slack/Telegram/WhatsApp）。

## 用法

```
openclaw message <subcommand> [flags]
```

渠道选择：

- 如果配置了多个渠道，则必须使用 `--channel`。
- 如果只配置了一个渠道，它会成为默认渠道。
- 取值：`discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`（Mattermost 需要插件）
- 当存在 `--channel` 或带渠道前缀的目标时，`openclaw message` 会将所选渠道解析到其所属插件；否则它会加载已配置的渠道插件以推断默认渠道。

目标格式（`--target`）：

- WhatsApp：E.164 或群组 JID
- Telegram：聊天 id 或 `@username`
- Discord：`channel:<id>` 或 `user:<id>`（或 `<@id>` 提及；原始数字 id 会被视为渠道）
- Google Chat：`spaces/<spaceId>` 或 `users/<userId>`
- Slack：`channel:<id>` 或 `user:<id>`（接受原始渠道 id）
- Mattermost（插件）：`channel:<id>`、`user:<id>` 或 `@username`（裸 id 会被视为渠道）
- Signal：`+E.164`、`group:<id>`、`signal:+E.164`、`signal:group:<id>` 或 `username:<name>`/`u:<name>`
- iMessage：handle、`chat_id:<id>`、`chat_guid:<guid>` 或 `chat_identifier:<id>`
- Matrix：`@user:server`、`!room:server` 或 `#alias:server`
- Microsoft Teams：conversation id（`19:...@thread.tacv2`）或 `conversation:<id>` 或 `user:<aad-object-id>`

名称查找：

- 对于受支持的 provider（Discord/Slack 等），会通过目录缓存解析像 `Help` 或 `#help` 这样的渠道名称。
- 如果缓存未命中，而 provider 支持，OpenClaw 会尝试实时目录查找。

## 常用标志

- `--channel <name>`
- `--account <id>`
- `--target <dest>`（用于 send/poll/read 等操作的目标渠道或用户）
- `--targets <name>`（可重复；仅用于广播）
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef 行为

- `openclaw message` 会在运行所选操作之前解析受支持渠道的 SecretRef。
- 解析会尽可能限定在当前操作目标范围内：
  - 设置了 `--channel` 时按渠道范围解析（或从 `discord:...` 这类带前缀目标推断）
  - 设置了 `--account` 时按账户范围解析（渠道全局 + 所选账户表面）
  - 当省略 `--account` 时，OpenClaw 不会强制使用 `default` 账户 SecretRef 范围
- 与目标消息操作无关渠道上的未解析 SecretRef 不会阻塞操作。
- 如果所选渠道/账户的 SecretRef 未解析，该命令会对此操作执行失败关闭。

## 操作

### 核心

- `send`
  - 渠道：WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（插件）/Signal/iMessage/Matrix/Microsoft Teams
  - 必需：`--target`，以及 `--message`、`--media` 或 `--presentation`
  - 可选：`--media`、`--presentation`、`--delivery`、`--pin`、`--reply-to`、`--thread-id`、`--gif-playback`、`--force-document`、`--silent`
  - 共享展示负载：`--presentation` 发送语义块（`text`、`context`、`divider`、`buttons`、`select`），核心会通过所选渠道声明的能力进行渲染。参见 [消息展示](/zh-CN/plugins/message-presentation)。
  - 通用投递偏好：`--delivery` 接受如 `{ "pin": true }` 这样的投递提示；当渠道支持时，`--pin` 是置顶投递的简写。
  - 仅 Telegram：`--force-document`（将图片和 GIF 作为文档发送，以避免 Telegram 压缩）
  - 仅 Telegram：`--thread-id`（论坛主题 id）
  - 仅 Slack：`--thread-id`（线程时间戳；`--reply-to` 使用同一字段）
  - Telegram + Discord：`--silent`
  - 仅 WhatsApp：`--gif-playback`

- `poll`
  - 渠道：WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - 必需：`--target`、`--poll-question`、`--poll-option`（可重复）
  - 可选：`--poll-multi`
  - 仅 Discord：`--poll-duration-hours`、`--silent`、`--message`
  - 仅 Telegram：`--poll-duration-seconds`（5-600）、`--silent`、`--poll-anonymous` / `--poll-public`、`--thread-id`

- `react`
  - 渠道：Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - 必需：`--message-id`、`--target`
  - 可选：`--emoji`、`--remove`、`--participant`、`--from-me`、`--target-author`、`--target-author-uuid`
  - 注意：`--remove` 需要 `--emoji`（省略 `--emoji` 可在支持时清除自己的反应；参见 /tools/reactions）
  - 仅 WhatsApp：`--participant`、`--from-me`
  - Signal 群组反应：必需 `--target-author` 或 `--target-author-uuid`

- `reactions`
  - 渠道：Discord/Google Chat/Slack/Matrix
  - 必需：`--message-id`、`--target`
  - 可选：`--limit`

- `read`
  - 渠道：Discord/Slack/Matrix
  - 必需：`--target`
  - 可选：`--limit`、`--before`、`--after`
  - 仅 Discord：`--around`

- `edit`
  - 渠道：Discord/Slack/Matrix
  - 必需：`--message-id`、`--message`、`--target`

- `delete`
  - 渠道：Discord/Slack/Telegram/Matrix
  - 必需：`--message-id`、`--target`

- `pin` / `unpin`
  - 渠道：Discord/Slack/Matrix
  - 必需：`--message-id`、`--target`

- `pins`（列出）
  - 渠道：Discord/Slack/Matrix
  - 必需：`--target`

- `permissions`
  - 渠道：Discord/Matrix
  - 必需：`--target`
  - 仅 Matrix：当启用 Matrix 加密并且允许验证操作时可用

- `search`
  - 渠道：Discord
  - 必需：`--guild-id`、`--query`
  - 可选：`--channel-id`、`--channel-ids`（可重复）、`--author-id`、`--author-ids`（可重复）、`--limit`

### 线程

- `thread create`
  - 渠道：Discord
  - 必需：`--thread-name`、`--target`（渠道 id）
  - 可选：`--message-id`、`--message`、`--auto-archive-min`

- `thread list`
  - 渠道：Discord
  - 必需：`--guild-id`
  - 可选：`--channel-id`、`--include-archived`、`--before`、`--limit`

- `thread reply`
  - 渠道：Discord
  - 必需：`--target`（线程 id）、`--message`
  - 可选：`--media`、`--reply-to`

### 表情符号

- `emoji list`
  - Discord：`--guild-id`
  - Slack：无额外标志

- `emoji upload`
  - 渠道：Discord
  - 必需：`--guild-id`、`--emoji-name`、`--media`
  - 可选：`--role-ids`（可重复）

### 贴纸

- `sticker send`
  - 渠道：Discord
  - 必需：`--target`、`--sticker-id`（可重复）
  - 可选：`--message`

- `sticker upload`
  - 渠道：Discord
  - 必需：`--guild-id`、`--sticker-name`、`--sticker-desc`、`--sticker-tags`、`--media`

### 角色 / 渠道 / 成员 / 语音

- `role info`（Discord）：`--guild-id`
- `role add` / `role remove`（Discord）：`--guild-id`、`--user-id`、`--role-id`
- `channel info`（Discord）：`--target`
- `channel list`（Discord）：`--guild-id`
- `member info`（Discord/Slack）：`--user-id`（Discord 还需 `--guild-id`）
- `voice status`（Discord）：`--guild-id`、`--user-id`

### 事件

- `event list`（Discord）：`--guild-id`
- `event create`（Discord）：`--guild-id`、`--event-name`、`--start-time`
  - 可选：`--end-time`、`--desc`、`--channel-id`、`--location`、`--event-type`

### 审核管理（Discord）

- `timeout`：`--guild-id`、`--user-id`（可选 `--duration-min` 或 `--until`；两者都省略则清除 timeout）
- `kick`：`--guild-id`、`--user-id`（+ `--reason`）
- `ban`：`--guild-id`、`--user-id`（+ `--delete-days`、`--reason`）
  - `timeout` 也支持 `--reason`

### 广播

- `broadcast`
  - 渠道：任何已配置渠道；使用 `--channel all` 以目标所有 provider
  - 必需：`--targets <target...>`
  - 可选：`--message`、`--media`、`--dry-run`

## 示例

发送一条 Discord 回复：

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

发送一条带有语义按钮的消息：

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

核心会根据渠道能力，将相同的 `presentation` 负载渲染为 Discord 组件、Slack blocks、Telegram 行内按钮、Mattermost props 或 Teams/Feishu 卡片。完整契约和回退规则参见 [消息展示](/zh-CN/plugins/message-presentation)。

发送更丰富的展示负载：

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

创建一个 Discord 投票：

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

创建一个 Telegram 投票（2 分钟后自动关闭）：

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

发送一条 Teams 主动消息：

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

创建一个 Teams 投票：

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

在 Slack 中添加反应：

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

在 Signal 群组中添加反应：

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

通过通用展示发送 Telegram 行内按钮：

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

通过通用展示发送一张 Teams 卡片：

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

将 Telegram 图片作为文档发送以避免压缩：

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [智能体发送](/zh-CN/tools/agent-send)
