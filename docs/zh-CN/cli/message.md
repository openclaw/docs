---
read_when:
    - 添加或修改消息 CLI 操作
    - 更改渠道出站行为
summary: '`openclaw message` 的 CLI 参考（发送 + 渠道操作）'
title: 消息
x-i18n:
    generated_at: "2026-07-11T20:24:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2d1cca9be7cfa7625cac3e440ecb5847d9fab9c545c9267a41a2f99c26c514b
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

用于跨 Discord、Google Chat、iMessage、Matrix、Mattermost（插件）、Microsoft Teams、Signal、Slack、Telegram 和 WhatsApp 发送消息及执行渠道操作的统一出站命令。

```bash
openclaw message <subcommand> [flags]
```

## 渠道选择

- 如果配置了多个渠道，则必须指定 `--channel <name>`；如果只配置了一个渠道，则默认使用该渠道。
- 可用值：`discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  （Mattermost 需要安装插件）。
- 带渠道前缀的目标（例如 `discord:channel:123`）无需显式指定 `--channel`，即可解析到所属插件。

## 目标格式（`-t, --target`）

| 渠道                | 格式                                                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| Discord             | `channel:<id>`、`user:<id>`、`<@id>` 提及，或纯数字 ID（视为渠道 ID）                                         |
| Google Chat         | `spaces/<spaceId>` 或 `users/<userId>`                                                                         |
| iMessage            | 联系方式、`chat_id:<id>`、`chat_guid:<guid>` 或 `chat_identifier:<id>`                                        |
| Mattermost（插件）  | `channel:<id>`、`user:<id>`、`@username`，或纯 ID（视为渠道）                                                  |
| Matrix              | `@user:server`、`!room:server` 或 `#alias:server`                                                              |
| Microsoft Teams     | `conversation:<id>`（`19:...@thread.tacv2`）、纯会话 ID 或 `user:<aad-object-id>`                              |
| Signal              | `+E.164`、`group:<id>`、`uuid:<id>`、`username:<name>`/`u:<name>`，或上述任一格式加上 `signal:` 前缀           |
| Slack               | `channel:<id>` 或 `user:<id>`（纯 ID 视为渠道）                                                                |
| Telegram            | 聊天 ID、`@username`，或论坛话题目标：`<chatId>:topic:<topicId>`（也可使用 `--thread-id <topicId>`）           |
| WhatsApp            | E.164、群组 JID（`...@g.us`）或频道/简报 JID（`...@newsletter`）                                               |

渠道名称查找：对于提供目录的提供商（Discord、Slack 等），`Help` 或 `#help` 等名称会通过目录缓存解析；如果缓存未命中且提供商支持实时目录查询，则回退到实时查询。

## 通用标志

每项操作都接受：`--channel <name>`、`--account <id>`、`--json`、`--dry-run`、`--verbose`。需要目标地址的操作还接受 `-t, --target <dest>`。

## SecretRef 解析

`openclaw message` 会在执行操作前解析渠道 SecretRef，并尽可能缩小解析范围：

- 设置了 `--channel` 时按渠道限定范围（也可从带前缀的目标推断）
- 同时设置了 `--account` 时按账户限定范围
- 两者均未设置时，解析所有已配置的渠道

无关渠道中无法解析的 SecretRef 绝不会阻止定向操作；所选渠道或账户中的 SecretRef 无法解析时，操作将拒绝执行。

## 操作

### 核心

| 操作            | 渠道                                                                                                            | 必需项                                                         | 说明                                                                                                                                                                                                                                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `send`          | Discord、Google Chat、iMessage、Matrix、Mattermost（插件）、Microsoft Teams、Signal、Slack、Telegram、WhatsApp | `--target`，以及 `--message`/`--media`/`--presentation` 之一   | 请参阅下方的[发送](#send)。                                                                                                                                                                                                                                                                                                 |
| `poll`          | Discord、Matrix、Microsoft Teams、Telegram、WhatsApp                                                            | `--target`、`--poll-question`、`--poll-option`（可重复）       | 请参阅下方的[投票](#poll)。                                                                                                                                                                                                                                                                                                 |
| `react`         | Discord、Matrix、Nextcloud Talk、Signal、Slack、Telegram、WhatsApp                                              | `--message-id`、`--target`                                     | `--emoji`、`--remove`（需要 `--emoji`；省略该参数可在支持的渠道中清除自己的表情回应，参见[表情回应](/zh-CN/tools/reactions)）。WhatsApp：`--participant`、`--from-me`。Signal 群组表情回应需要 `--target-author` 或 `--target-author-uuid`。Nextcloud Talk 只能添加表情回应；使用 `--remove` 会报错。 |
| `reactions`     | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--message-id`、`--target`                                     | `--limit`。                                                                                                                                                                                                                                                                                                                  |
| `read`          | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--target`                                                     | `--limit`、`--message-id`、`--before`、`--after`。Discord：`--around`、`--include-thread`。Slack：`--message-id` 读取特定时间戳；与 `--thread-id` 组合可读取指定的确切线程回复。                                                                                                                                                |
| `edit`          | Discord、Matrix、Microsoft Teams、Slack、Telegram                                                               | `--message-id`、`--message`、`--target`                        | Telegram 论坛线程使用 `--thread-id`。                                                                                                                                                                                                                                                                                       |
| `delete`        | Discord、Matrix、Microsoft Teams、Slack、Telegram                                                               | `--message-id`、`--target`                                     |                                                                                                                                                                                                                                                                                                                              |
| `pin` / `unpin` | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--message-id`、`--target`                                     | `unpin` 还接受 `--pinned-message-id`（对于 Microsoft Teams，这是固定消息/固定消息列表资源 ID，而不是聊天消息 ID）。                                                                                                                                                                                                          |
| `pins`（列表）  | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--target`                                                     | `--limit`。                                                                                                                                                                                                                                                                                                                  |
| `permissions`   | Discord、Matrix                                                                                                 | `--target`                                                     | Matrix：仅在启用加密并允许验证操作时可用。                                                                                                                                                                                                                                                                                   |
| `search`        | Discord                                                                                                         | `--guild-id`、`--query`                                        | `--channel-id`、`--channel-ids`（可重复）、`--author-id`、`--author-ids`（可重复）、`--limit`。                                                                                                                                                                                                                              |
| `member info`   | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--user-id`                                                    | `--guild-id`（Discord）。                                                                                                                                                                                                                                                                                                   |

### 发送

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`：附加图片、音频、视频或文档（本地路径或 URL）。
- `--presentation <json>`：包含 `text`、`context`、`divider`、`chart`、`table`、`buttons` 和 `select` 块的共享载荷，根据各渠道的能力进行渲染。请参阅[消息呈现](/zh-CN/plugins/message-presentation)。
- `--delivery <json>`：通用投递偏好，例如 `{"pin":
true}`。当渠道支持固定消息投递时，`--pin` 是其简写形式。
- `--reply-to <id>`、`--thread-id <id>`（Telegram 论坛话题；Slack 线程时间戳，与 `--reply-to` 使用同一字段）。
- `--force-document`（Telegram、WhatsApp）：将图片、GIF 和视频作为文档发送，以避免渠道压缩。
- `--silent`（Telegram、Discord）：发送时不触发通知。
- `--gif-playback`（仅限 WhatsApp）：将视频媒体作为 GIF 播放。

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Slack 会以原生方式渲染受支持的图表块；其他渠道则以可读文本形式接收相同数据：

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"blocks":[{"type":"chart","chartType":"bar","title":"Quarterly revenue","categories":["Q1","Q2"],"series":[{"name":"Revenue","values":[120,145]}],"xLabel":"Quarter"}]}'
```

Slack 还会原生渲染显式表格块。其他渠道会以确定性文本形式接收标题和每一行：

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"title":"Pipeline report","blocks":[{"type":"table","caption":"Open pipeline","headers":["Account","Stage","ARR"],"rows":[["Acme","Won",125000],["Globex","Review",82000]],"rowHeaderColumnIndex":0}]}'
```

Telegram Mini App 按钮使用 `webApp`（为兼容旧版 JSON，仍可解析 `web_app`），并且仅在用户与 Bot 之间的私聊中渲染：

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

- `--poll-option <choice>`：重复使用 2 至 12 次。
- `--poll-multi`：允许多选。
- Discord：`--poll-duration-hours`、`--silent`、`--message`。
- Telegram：`--poll-duration-seconds <n>`（5 至 600）、`--silent`、
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

### 话题串

- `thread create`：支持 Discord 渠道。必需：`--thread-name`、`--target`
  （渠道 ID）。可选：`--message-id`、`--message`、`--auto-archive-min`。
- `thread list`：支持 Discord 渠道。必需：`--guild-id`。可选：
  `--channel-id`、`--include-archived`、`--before`、`--limit`。
- `thread reply`：支持 Discord 渠道。必需：`--target`（话题串 ID）、
  `--message`。可选：`--media`、`--reply-to`。

### 表情符号

- `emoji list`：Discord（`--guild-id`）、Slack（无需额外标志）。
- `emoji upload`：Discord。必需：`--guild-id`、`--emoji-name`、`--media`。
  可选：`--role-ids`（可重复使用）。

### 贴纸

- `sticker send`：Discord。必需：`--target`、`--sticker-id`（可重复使用）。
  可选：`--message`。
- `sticker upload`：Discord。必需：`--guild-id`、`--sticker-name`、
  `--sticker-desc`、`--sticker-tags`、`--media`。

### 角色、渠道、语音、事件（Discord）

- `role info`：`--guild-id`。
- `role add` / `role remove`：`--guild-id`、`--user-id`、`--role-id`。
- `channel info`：`--target`。
- `channel list`：`--guild-id`。
- `voice status`：`--guild-id`、`--user-id`。
- `event list`：`--guild-id`。
- `event create`：必需 `--guild-id`、`--event-name`、`--start-time`；
  可选 `--end-time`、`--desc`、`--channel-id`、`--location`、
  `--event-type`、`--image <url-or-path>`。

### 管理（Discord）

- `timeout`：`--guild-id`、`--user-id`；可选 `--duration-min` 或
  `--until`（两者均省略可清除超时限制）、`--reason`。
- `kick`：`--guild-id`、`--user-id`、`--reason`。
- `ban`：`--guild-id`、`--user-id`、`--delete-days`、`--reason`。

### 广播

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

将一个载荷发送到多个目标。`--targets` 接受以空格分隔的列表。使用 `--channel all` 可将每个已配置的提供商作为目标。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Agent 发送](/zh-CN/tools/agent-send)
- [消息呈现](/zh-CN/plugins/message-presentation)
