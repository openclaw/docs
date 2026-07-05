---
read_when:
    - 添加或修改消息 CLI 操作
    - 更改出站渠道行为
summary: '`openclaw message` 的 CLI 参考（send + 渠道操作）'
title: 消息
x-i18n:
    generated_at: "2026-07-05T11:10:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2148973c4b1900bd36c5675969e943db09b0b1d9adffd66c151113c7837023
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

用于在 Discord、Google Chat、iMessage、Matrix、Mattermost（插件）、Microsoft Teams、Signal、Slack、Telegram 和 WhatsApp 之间发送消息和渠道操作的单一出站命令。

```bash
openclaw message <subcommand> [flags]
```

## 渠道选择

- 如果配置了多个渠道，则需要 `--channel <name>`；如果只配置了一个渠道，该渠道就是默认值。
- 值：`discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  （Mattermost 需要插件）。
- 带渠道前缀的目标（例如 `discord:channel:123`）会解析拥有它的插件，无需显式指定 `--channel`。

## 目标格式（`-t, --target`）

| 渠道                | 格式                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| Discord             | `channel:<id>`、`user:<id>`、`<@id>` 提及，或裸数字 id（视为渠道 id）                                      |
| Google Chat         | `spaces/<spaceId>` 或 `users/<userId>`                                                                     |
| iMessage            | handle、`chat_id:<id>`、`chat_guid:<guid>` 或 `chat_identifier:<id>`                                       |
| Mattermost（插件）  | `channel:<id>`、`user:<id>`、`@username`，或裸 id（视为渠道）                                              |
| Matrix              | `@user:server`、`!room:server` 或 `#alias:server`                                                          |
| Microsoft Teams     | `conversation:<id>`（`19:...@thread.tacv2`）、裸会话 id，或 `user:<aad-object-id>`                         |
| Signal              | `+E.164`、`group:<id>`、`uuid:<id>`、`username:<name>`/`u:<name>`，或带 `signal:` 前缀的上述任一格式        |
| Slack               | `channel:<id>` 或 `user:<id>`（裸 id 会视为渠道）                                                         |
| Telegram            | chat id、`@username`，或论坛话题目标：`<chatId>:topic:<topicId>`（或 `--thread-id <topicId>`）             |
| WhatsApp            | E.164、群组 JID（`...@g.us`），或频道/Newsletter JID（`...@newsletter`）                                   |

渠道名称查找：对于带目录的提供商（Discord/Slack 等），`Help` 或 `#help` 这类名称会通过目录缓存解析；缓存未命中时，如果提供商支持，则回退到实时目录查找。

## 常用标志

每个操作都接受：`--channel <name>`、`--account <id>`、`--json`、`--dry-run`、`--verbose`。需要目标位置的操作也接受 `-t, --target <dest>`。

## SecretRef 解析

`openclaw message` 会在运行操作前解析渠道 SecretRef，并尽可能缩小作用域：

- 设置 `--channel` 时（或从带前缀的目标推断时）按渠道作用域
- 同时设置 `--account` 时按账户作用域
- 两者都未设置时覆盖所有已配置渠道

无关渠道上未解析的 SecretRef 永远不会阻止定向操作；所选渠道/账户上的未解析 SecretRef 会使操作以失败关闭方式终止。

## 操作

### 核心

| 操作            | 渠道                                                                                                            | 必需项                                                         | 说明                                                                                                                                                                                                                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `send`          | Discord、Google Chat、iMessage、Matrix、Mattermost（插件）、Microsoft Teams、Signal、Slack、Telegram、WhatsApp | `--target`，以及 `--message`/`--media`/`--presentation` 之一   | 见下方 [发送](#send)。                                                                                                                                                                                                                                                                                 |
| `poll`          | Discord、Matrix、Microsoft Teams、Telegram、WhatsApp                                                            | `--target`、`--poll-question`、`--poll-option`（可重复）       | 见下方 [投票](#poll)。                                                                                                                                                                                                                                                                                 |
| `react`         | Discord、Google Chat、Matrix、Nextcloud Talk、Signal、Slack、Telegram、WhatsApp                                 | `--message-id`、`--target`                                    | `--emoji`、`--remove`（需要 `--emoji`；省略它可在支持的地方清除自己的表情回应，见 [表情回应](/zh-CN/tools/reactions)）。WhatsApp：`--participant`、`--from-me`。Signal 群组表情回应需要 `--target-author` 或 `--target-author-uuid`。Nextcloud Talk 只添加表情回应；`--remove` 会报错。 |
| `reactions`     | Discord、Google Chat、Matrix、Microsoft Teams、Slack                                                            | `--message-id`、`--target`                                    | `--limit`。                                                                                                                                                                                                                                                                                            |
| `read`          | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--target`                                                    | `--limit`、`--message-id`、`--before`、`--after`。Discord：`--around`、`--include-thread`。Slack：`--message-id` 读取特定时间戳，结合 `--thread-id` 可读取精确的线程回复。                                                                 |
| `edit`          | Discord、Matrix、Microsoft Teams、Slack、Telegram                                                               | `--message-id`、`--message`、`--target`                       | Telegram 论坛线程使用 `--thread-id`。                                                                                                                                                                                                                                                                  |
| `delete`        | Discord、Matrix、Microsoft Teams、Slack、Telegram                                                               | `--message-id`、`--target`                                    |                                                                                                                                                                                                                                                                                                        |
| `pin` / `unpin` | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--message-id`、`--target`                                    | `unpin` 也接受 `--pinned-message-id`（Microsoft Teams：pin/list-pins 资源 id，而不是聊天消息 id）。                                                                                                                                                                                                    |
| `pins`（列表）  | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--target`                                                    | `--limit`。                                                                                                                                                                                                                                                                                            |
| `permissions`   | Discord、Matrix                                                                                                 | `--target`                                                    | Matrix：仅在启用加密且允许验证操作时可用。                                                                                                                                                                                                                                                            |
| `search`        | Discord                                                                                                         | `--guild-id`、`--query`                                       | `--channel-id`、`--channel-ids`（可重复）、`--author-id`、`--author-ids`（可重复）、`--limit`。                                                                                                                                                                                                        |
| `member info`   | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--user-id`                                                   | `--guild-id`（Discord）。                                                                                                                                                                                                                                                                              |

### 发送

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`：附加图片/音频/视频/文档（本地路径或 URL）。
- `--presentation <json>`：包含 `text`、`context`、`divider`、`buttons`、`select` 块的共享载荷，按每个渠道的能力渲染。见 [消息呈现](/zh-CN/plugins/message-presentation)。
- `--delivery <json>`：通用投递偏好，例如 `{"pin":
true}`。当渠道支持时，`--pin` 是固定投递的简写。
- `--reply-to <id>`、`--thread-id <id>`（Telegram 论坛话题；Slack 线程时间戳，与 `--reply-to` 是同一字段）。
- `--force-document`（Telegram、WhatsApp）：将图片/GIF/视频作为文档发送，以避免渠道压缩。
- `--silent`（Telegram、Discord）：发送时不通知。
- `--gif-playback`（仅 WhatsApp）：将视频媒体视为 GIF 播放。

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Telegram Mini App 按钮使用 `webApp`（`web_app` 仍会为旧版 JSON 解析），并且只在用户与 Bot 之间的私聊中渲染：

```bash
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

### 投票

```bash
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

- `--poll-option <choice>`：重复 2-12 次。
- `--poll-multi`：允许多选。
- Discord：`--poll-duration-hours`、`--silent`、`--message`。
- Telegram：`--poll-duration-seconds <n>`（5-600）、`--silent`、
  `--poll-anonymous` / `--poll-public`、`--thread-id`。

```bash
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

```bash
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

### 线程

- `thread create`：渠道 Discord。必填：`--thread-name`、`--target`
  （频道 id）。可选：`--message-id`、`--message`、`--auto-archive-min`。
- `thread list`：渠道 Discord。必填：`--guild-id`。可选：
  `--channel-id`、`--include-archived`、`--before`、`--limit`。
- `thread reply`：渠道 Discord。必填：`--target`（线程 id）、
  `--message`。可选：`--media`、`--reply-to`。

### 表情符号

- `emoji list`：Discord（`--guild-id`）、Slack（无额外标志）。
- `emoji upload`：Discord。必填：`--guild-id`、`--emoji-name`、`--media`。
  可选：`--role-ids`（可重复）。

### 贴纸

- `sticker send`：Discord。必填：`--target`、`--sticker-id`（可重复）。
  可选：`--message`。
- `sticker upload`：Discord。必填：`--guild-id`、`--sticker-name`、
  `--sticker-desc`、`--sticker-tags`、`--media`。

### 角色、频道、语音、事件（Discord）

- `role info`：`--guild-id`。
- `role add` / `role remove`：`--guild-id`、`--user-id`、`--role-id`。
- `channel info`：`--target`。
- `channel list`：`--guild-id`。
- `voice status`：`--guild-id`、`--user-id`。
- `event list`：`--guild-id`。
- `event create`：必填 `--guild-id`、`--event-name`、`--start-time`；
  可选 `--end-time`、`--desc`、`--channel-id`、`--location`、
  `--event-type`、`--image <url-or-path>`。

### 审核管理（Discord）

- `timeout`：`--guild-id`、`--user-id`；可选 `--duration-min` 或
  `--until`（两者都省略可清除超时）、`--reason`。
- `kick`：`--guild-id`、`--user-id`、`--reason`。
- `ban`：`--guild-id`、`--user-id`、`--delete-days`、`--reason`。

### 广播

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

向多个目标发送同一个负载。`--targets` 接受以空格分隔的列表。使用 `--channel all` 可定位每个已配置的提供商。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Agent send](/zh-CN/tools/agent-send)
- [消息呈现](/zh-CN/plugins/message-presentation)
