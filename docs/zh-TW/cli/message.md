---
read_when:
    - 新增或修改訊息命令列介面操作
    - 變更外送頻道行為
summary: '`openclaw message` 的命令列介面參考（傳送 + 頻道操作）'
title: 訊息
x-i18n:
    generated_at: "2026-07-11T21:12:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2d1cca9be7cfa7625cac3e440ecb5847d9fab9c545c9267a41a2f99c26c514b
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

用於在 Discord、Google Chat、iMessage、Matrix、Mattermost（外掛）、Microsoft Teams、Signal、Slack、Telegram 與 WhatsApp 之間傳送訊息及執行頻道操作的單一輸出命令。

```bash
openclaw message <subcommand> [flags]
```

## 頻道選擇

- 若設定了多個頻道，則必須指定 `--channel <name>`；若只設定一個頻道，則該頻道為預設值。
- 可用值：`discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  （Mattermost 需要此外掛）。
- 帶有頻道前綴的目標（例如 `discord:channel:123`）無須明確指定 `--channel`，即可解析出所屬外掛。

## 目標格式（`-t, --target`）

| 頻道                | 格式                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Discord             | `channel:<id>`、`user:<id>`、`<@id>` 提及，或純數字識別碼（視為頻道識別碼）                                       |
| Google Chat         | `spaces/<spaceId>` 或 `users/<userId>`                                                                             |
| iMessage            | 聯絡代號、`chat_id:<id>`、`chat_guid:<guid>` 或 `chat_identifier:<id>`                                             |
| Mattermost（外掛）  | `channel:<id>`、`user:<id>`、`@username`，或純識別碼（視為頻道）                                                   |
| Matrix              | `@user:server`、`!room:server` 或 `#alias:server`                                                                   |
| Microsoft Teams     | `conversation:<id>`（`19:...@thread.tacv2`）、純交談識別碼，或 `user:<aad-object-id>`                              |
| Signal              | `+E.164`、`group:<id>`、`uuid:<id>`、`username:<name>`/`u:<name>`，或上述任一格式加上 `signal:` 前綴               |
| Slack               | `channel:<id>` 或 `user:<id>`（純識別碼視為頻道）                                                                  |
| Telegram            | 聊天識別碼、`@username`，或論壇主題目標：`<chatId>:topic:<topicId>`（或 `--thread-id <topicId>`）                  |
| WhatsApp            | E.164、群組 JID（`...@g.us`），或頻道／電子報 JID（`...@newsletter`）                                              |

頻道名稱查詢：對於具有目錄的提供者（Discord／Slack 等），`Help` 或 `#help` 等名稱會透過目錄快取解析；若快取未命中且提供者支援即時目錄查詢，則會改用即時查詢。

## 通用旗標

每項操作都接受：`--channel <name>`、`--account <id>`、`--json`、`--dry-run`、`--verbose`。需要目的地的操作也接受 `-t, --target <dest>`。

## SecretRef 解析

`openclaw message` 會在執行操作前解析頻道 SecretRef，並盡可能縮小解析範圍：

- 設定 `--channel` 時（或從帶前綴的目標推斷時），範圍限於該頻道
- 同時設定 `--account` 時，範圍限於該帳號
- 兩者皆未設定時，範圍涵蓋所有已設定的頻道

不相關頻道中未解析的 SecretRef 絕不會阻擋指定目標的操作；所選頻道／帳號中若有未解析的 SecretRef，操作將以封閉失敗方式終止。

## 操作

### 核心

| 操作            | 頻道                                                                                                            | 必要項目                                                       | 備註                                                                                                                                                                                                                                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `send`          | Discord、Google Chat、iMessage、Matrix、Mattermost（外掛）、Microsoft Teams、Signal、Slack、Telegram、WhatsApp | `--target`，以及 `--message`/`--media`/`--presentation` 其中之一 | 請參閱下方的[傳送](#send)。                                                                                                                                                                                                                                                                                  |
| `poll`          | Discord、Matrix、Microsoft Teams、Telegram、WhatsApp                                                            | `--target`、`--poll-question`、`--poll-option`（可重複）        | 請參閱下方的[投票](#poll)。                                                                                                                                                                                                                                                                                  |
| `react`         | Discord、Matrix、Nextcloud Talk、Signal、Slack、Telegram、WhatsApp                                              | `--message-id`、`--target`                                     | `--emoji`、`--remove`（需要 `--emoji`；若省略，在支援的頻道上會清除自己的反應，請參閱[表情回應](/zh-TW/tools/reactions)）。WhatsApp：`--participant`、`--from-me`。Signal 群組反應需要 `--target-author` 或 `--target-author-uuid`。Nextcloud Talk 只能新增反應；使用 `--remove` 會發生錯誤。 |
| `reactions`     | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--message-id`、`--target`                                     | `--limit`。                                                                                                                                                                                                                                                                                                 |
| `read`          | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--target`                                                     | `--limit`、`--message-id`、`--before`、`--after`。Discord：`--around`、`--include-thread`。Slack：`--message-id` 會讀取特定時間戳記；搭配 `--thread-id` 可讀取確切的討論串回覆。                                                                    |
| `edit`          | Discord、Matrix、Microsoft Teams、Slack、Telegram                                                               | `--message-id`、`--message`、`--target`                        | Telegram 論壇討論串使用 `--thread-id`。                                                                                                                                                                                                                                                                      |
| `delete`        | Discord、Matrix、Microsoft Teams、Slack、Telegram                                                               | `--message-id`、`--target`                                     |                                                                                                                                                                                                                                                                                                            |
| `pin` / `unpin` | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--message-id`、`--target`                                     | `unpin` 也接受 `--pinned-message-id`（Microsoft Teams：釘選／列出釘選項目的資源識別碼，而非聊天訊息識別碼）。                                                                                                                                                                                                |
| `pins`（列出）  | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--target`                                                     | `--limit`。                                                                                                                                                                                                                                                                                                 |
| `permissions`   | Discord、Matrix                                                                                                 | `--target`                                                     | Matrix：僅在已啟用加密且允許驗證操作時可用。                                                                                                                                                                                                                                                                |
| `search`        | Discord                                                                                                         | `--guild-id`、`--query`                                        | `--channel-id`、`--channel-ids`（可重複）、`--author-id`、`--author-ids`（可重複）、`--limit`。                                                                                                                                                                                                              |
| `member info`   | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--user-id`                                                    | `--guild-id`（Discord）。                                                                                                                                                                                                                                                                                    |

### 傳送

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`：附加圖片／音訊／影片／文件（本機路徑或 URL）。
- `--presentation <json>`：包含 `text`、`context`、`divider`、`chart`、`table`、`buttons` 與 `select` 區塊的共用承載資料，會依各頻道的能力進行呈現。請參閱[訊息呈現](/zh-TW/plugins/message-presentation)。
- `--delivery <json>`：通用傳送偏好設定，例如 `{"pin":
true}`。頻道支援釘選傳送時，`--pin` 是其簡寫。
- `--reply-to <id>`、`--thread-id <id>`（Telegram 論壇主題；Slack 討論串時間戳記，與 `--reply-to` 使用相同欄位）。
- `--force-document`（Telegram、WhatsApp）：以文件形式傳送圖片／GIF／影片，避免頻道壓縮。
- `--silent`（Telegram、Discord）：傳送時不發出通知。
- `--gif-playback`（僅限 WhatsApp）：將影片媒體視為 GIF 播放。

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Slack 會以原生方式呈現支援的圖表區塊；其他頻道則會以易讀文字接收相同資料：

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"blocks":[{"type":"chart","chartType":"bar","title":"Quarterly revenue","categories":["Q1","Q2"],"series":[{"name":"Revenue","values":[120,145]}],"xLabel":"Quarter"}]}'
```

Slack 也會以原生方式呈現明確的表格區塊。其他頻道會以固定格式的文字接收標題與每一列：

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"title":"Pipeline report","blocks":[{"type":"table","caption":"Open pipeline","headers":["Account","Stage","ARR"],"rows":[["Acme","Won",125000],["Globex","Review",82000]],"rowHeaderColumnIndex":0}]}'
```

Telegram Mini App 按鈕使用 `webApp`（`web_app` 仍可用於剖析舊版
JSON），且僅會呈現在使用者與機器人之間的私人聊天中：

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

- `--poll-option <choice>`：重複使用 2 至 12 次。
- `--poll-multi`：允許複選。
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

### 討論串

- `thread create`：適用頻道為 Discord。必要：`--thread-name`、`--target`
  （頻道 ID）。選用：`--message-id`、`--message`、`--auto-archive-min`。
- `thread list`：適用頻道為 Discord。必要：`--guild-id`。選用：
  `--channel-id`、`--include-archived`、`--before`、`--limit`。
- `thread reply`：適用頻道為 Discord。必要：`--target`（討論串 ID）、
  `--message`。選用：`--media`、`--reply-to`。

### 表情符號

- `emoji list`：Discord（`--guild-id`）、Slack（無額外旗標）。
- `emoji upload`：Discord。必要：`--guild-id`、`--emoji-name`、`--media`。
  選用：`--role-ids`（可重複使用）。

### 貼圖

- `sticker send`：Discord。必要：`--target`、`--sticker-id`（可重複使用）。
  選用：`--message`。
- `sticker upload`：Discord。必要：`--guild-id`、`--sticker-name`、
  `--sticker-desc`、`--sticker-tags`、`--media`。

### 身分組、頻道、語音、活動（Discord）

- `role info`：`--guild-id`。
- `role add` / `role remove`：`--guild-id`、`--user-id`、`--role-id`。
- `channel info`：`--target`。
- `channel list`：`--guild-id`。
- `voice status`：`--guild-id`、`--user-id`。
- `event list`：`--guild-id`。
- `event create`：必要參數為 `--guild-id`、`--event-name`、`--start-time`；
  選用參數為 `--end-time`、`--desc`、`--channel-id`、`--location`、
  `--event-type`、`--image <url-or-path>`。

### 管理（Discord）

- `timeout`：`--guild-id`、`--user-id`；選用 `--duration-min` 或
  `--until`（兩者皆省略可解除逾時限制）、`--reason`。
- `kick`：`--guild-id`、`--user-id`、`--reason`。
- `ban`：`--guild-id`、`--user-id`、`--delete-days`、`--reason`。

### 廣播

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

將單一承載內容傳送至多個目標。`--targets` 接受以空格分隔的
清單。使用 `--channel all` 可將所有已設定的提供者設為目標。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [代理程式傳送](/zh-TW/tools/agent-send)
- [訊息呈現](/zh-TW/plugins/message-presentation)
