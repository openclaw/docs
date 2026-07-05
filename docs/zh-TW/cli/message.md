---
read_when:
    - 新增或修改訊息命令列介面動作
    - 變更對外通道行為
summary: '`openclaw message` 的命令列介面參考（傳送 + 頻道動作）'
title: 訊息
x-i18n:
    generated_at: "2026-07-05T11:10:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2148973c4b1900bd36c5675969e943db09b0b1d9adffd66c151113c7837023
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

用於跨 Discord、Google Chat、iMessage、Matrix、Mattermost（外掛）、Microsoft Teams、Signal、Slack、Telegram 和 WhatsApp 傳送訊息與頻道動作的單一外送命令。

```bash
openclaw message <subcommand> [flags]
```

## 頻道選擇

- 如果設定了多個頻道，必須使用 `--channel <name>`；如果只設定了一個頻道，該頻道即為預設值。
- 值：`discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  （Mattermost 需要外掛）。
- 帶頻道前綴的目標（例如 `discord:channel:123`）會解析擁有該目標的外掛，而不需要明確指定 `--channel`。

## 目標格式（`-t, --target`）

| 頻道                | 格式                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| Discord             | `channel:<id>`、`user:<id>`、`<@id>` 提及，或純數字 id（視為頻道 id）                                      |
| Google Chat         | `spaces/<spaceId>` 或 `users/<userId>`                                                                     |
| iMessage            | handle、`chat_id:<id>`、`chat_guid:<guid>`，或 `chat_identifier:<id>`                                      |
| Mattermost（外掛）  | `channel:<id>`、`user:<id>`、`@username`，或純 id（視為頻道）                                              |
| Matrix              | `@user:server`、`!room:server`，或 `#alias:server`                                                         |
| Microsoft Teams     | `conversation:<id>`（`19:...@thread.tacv2`）、純 conversation id，或 `user:<aad-object-id>`                |
| Signal              | `+E.164`、`group:<id>`、`uuid:<id>`、`username:<name>`/`u:<name>`，或任何加上 `signal:` 前綴的上述格式     |
| Slack               | `channel:<id>` 或 `user:<id>`（純 id 會視為頻道）                                                         |
| Telegram            | chat id、`@username`，或論壇主題目標：`<chatId>:topic:<topicId>`（或 `--thread-id <topicId>`）             |
| WhatsApp            | E.164、群組 JID（`...@g.us`），或頻道/電子報 JID（`...@newsletter`）                                      |

頻道名稱查詢：對於具有目錄的提供者（Discord/Slack/等等），像 `Help` 或 `#help` 這類名稱會透過目錄快取解析；在快取未命中且提供者支援時，會退回即時目錄查詢。

## 常用旗標

每個動作都接受：`--channel <name>`、`--account <id>`、`--json`、`--dry-run`、`--verbose`。需要目的地的動作也接受 `-t, --target <dest>`。

## SecretRef 解析

`openclaw message` 會在執行動作前解析頻道 SecretRefs，並盡可能縮小作用範圍：

- 設定 `--channel` 時（或從帶前綴的目標推斷時）限定於頻道範圍
- 同時設定 `--account` 時限定於帳號範圍
- 兩者皆未設定時，涵蓋所有已設定的頻道

不相關頻道上未解析的 SecretRefs 絕不會阻擋定向動作；選定頻道/帳號上未解析的 SecretRef 會讓動作以關閉方式失敗。

## 動作

### 核心

| 動作            | 頻道                                                                                                            | 必填                                                           | 備註                                                                                                                                                                                                                                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `send`          | Discord、Google Chat、iMessage、Matrix、Mattermost（外掛）、Microsoft Teams、Signal、Slack、Telegram、WhatsApp | `--target`，加上 `--message`/`--media`/`--presentation` 之一   | 請參閱下方的[傳送](#send)。                                                                                                                                                                                                                                                                                           |
| `poll`          | Discord、Matrix、Microsoft Teams、Telegram、WhatsApp                                                            | `--target`、`--poll-question`、`--poll-option`（可重複）       | 請參閱下方的[投票](#poll)。                                                                                                                                                                                                                                                                                           |
| `react`         | Discord、Google Chat、Matrix、Nextcloud Talk、Signal、Slack、Telegram、WhatsApp                                 | `--message-id`、`--target`                                    | `--emoji`、`--remove`（需要 `--emoji`；省略它可在支援時清除自己的反應，請參閱[反應](/zh-TW/tools/reactions)）。WhatsApp：`--participant`、`--from-me`。Signal 群組反應需要 `--target-author` 或 `--target-author-uuid`。Nextcloud Talk 只會新增反應；`--remove` 會報錯。 |
| `reactions`     | Discord、Google Chat、Matrix、Microsoft Teams、Slack                                                            | `--message-id`、`--target`                                    | `--limit`。                                                                                                                                                                                                                                                                                                           |
| `read`          | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--target`                                                     | `--limit`、`--message-id`、`--before`、`--after`。Discord：`--around`、`--include-thread`。Slack：`--message-id` 會讀取特定時間戳，與 `--thread-id` 搭配可精確讀取討論串回覆。                                                                                                                                            |
| `edit`          | Discord、Matrix、Microsoft Teams、Slack、Telegram                                                               | `--message-id`、`--message`、`--target`                       | Telegram 論壇討論串使用 `--thread-id`。                                                                                                                                                                                                                                                                                |
| `delete`        | Discord、Matrix、Microsoft Teams、Slack、Telegram                                                               | `--message-id`、`--target`                                    |                                                                                                                                                                                                                                                                                                                        |
| `pin` / `unpin` | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--message-id`、`--target`                                    | `unpin` 也接受 `--pinned-message-id`（Microsoft Teams：釘選/列出釘選資源 id，而不是聊天訊息 id）。                                                                                                                                                                                                                     |
| `pins`（列出）  | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--target`                                                     | `--limit`。                                                                                                                                                                                                                                                                                                           |
| `permissions`   | Discord、Matrix                                                                                                 | `--target`                                                     | Matrix：僅在啟用加密且允許驗證動作時可用。                                                                                                                                                                                                                                                                            |
| `search`        | Discord                                                                                                         | `--guild-id`、`--query`                                       | `--channel-id`、`--channel-ids`（可重複）、`--author-id`、`--author-ids`（可重複）、`--limit`。                                                                                                                                                                                                                        |
| `member info`   | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--user-id`                                                    | `--guild-id`（Discord）。                                                                                                                                                                                                                                                                                             |

### 傳送

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`：附加圖片/音訊/影片/文件（本機路徑或 URL）。
- `--presentation <json>`：含有 `text`、`context`、`divider`、`buttons`、`select` 區塊的共用承載內容，依各頻道能力呈現。請參閱[訊息呈現](/zh-TW/plugins/message-presentation)。
- `--delivery <json>`：通用傳遞偏好設定，例如 `{"pin":
true}`。在頻道支援時，`--pin` 是釘選傳遞的簡寫。
- `--reply-to <id>`、`--thread-id <id>`（Telegram 論壇主題；Slack 討論串時間戳，與 `--reply-to` 相同欄位）。
- `--force-document`（Telegram、WhatsApp）：將圖片/GIF/影片作為文件傳送，以避免頻道壓縮。
- `--silent`（Telegram、Discord）：傳送時不發出通知。
- `--gif-playback`（僅 WhatsApp）：將影片媒體視為 GIF 播放。

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Telegram Mini App 按鈕使用 `webApp`（`web_app` 仍會為了舊版 JSON 而解析），且只會在使用者與機器人之間的私人聊天中呈現：

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

- `--poll-option <choice>`：重複 2-12 次。
- `--poll-multi`：允許多選。
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

### 對話串

- `thread create`：管道 Discord。必填：`--thread-name`、`--target`
  （channel id）。選填：`--message-id`、`--message`、`--auto-archive-min`。
- `thread list`：管道 Discord。必填：`--guild-id`。選填：
  `--channel-id`、`--include-archived`、`--before`、`--limit`。
- `thread reply`：管道 Discord。必填：`--target`（thread id）、
  `--message`。選填：`--media`、`--reply-to`。

### 表情符號

- `emoji list`：Discord（`--guild-id`）、Slack（無額外旗標）。
- `emoji upload`：Discord。必填：`--guild-id`、`--emoji-name`、`--media`。
  選填：`--role-ids`（重複）。

### 貼圖

- `sticker send`：Discord。必填：`--target`、`--sticker-id`（重複）。
  選填：`--message`。
- `sticker upload`：Discord。必填：`--guild-id`、`--sticker-name`、
  `--sticker-desc`、`--sticker-tags`、`--media`。

### 角色、頻道、語音、活動（Discord）

- `role info`：`--guild-id`。
- `role add` / `role remove`：`--guild-id`、`--user-id`、`--role-id`。
- `channel info`：`--target`。
- `channel list`：`--guild-id`。
- `voice status`：`--guild-id`、`--user-id`。
- `event list`：`--guild-id`。
- `event create`：必填 `--guild-id`、`--event-name`、`--start-time`；
  選填 `--end-time`、`--desc`、`--channel-id`、`--location`、
  `--event-type`、`--image <url-or-path>`。

### 管理（Discord）

- `timeout`：`--guild-id`、`--user-id`；選填 `--duration-min` 或
  `--until`（兩者皆省略即可清除 timeout）、`--reason`。
- `kick`：`--guild-id`、`--user-id`、`--reason`。
- `ban`：`--guild-id`、`--user-id`、`--delete-days`、`--reason`。

### 廣播

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

將一個 payload 傳送到多個目標。`--targets` 接受以空格分隔的
清單。使用 `--channel all` 以每個已設定的 provider 為目標。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [Agent 傳送](/zh-TW/tools/agent-send)
- [訊息呈現](/zh-TW/plugins/message-presentation)
