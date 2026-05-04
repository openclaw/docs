---
read_when:
    - 新增或修改訊息 CLI 動作
    - 變更出站通道行為
summary: '`openclaw message` 的 CLI 參考（傳送 + 頻道動作）'
title: 訊息
x-i18n:
    generated_at: "2026-05-04T09:36:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ef57d33c93206a61a6d044667de4faf6340f7d8cc324300f235e838ee3b7ff1
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

用於傳送訊息與頻道動作的單一外送命令
（Discord/Google Chat/iMessage/Matrix/Mattermost (plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp）。

## 用法

```
openclaw message <subcommand> [flags]
```

頻道選擇：

- 如果設定了多個頻道，則需要 `--channel`。
- 如果只設定了一個頻道，該頻道會成為預設值。
- 值：`discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`（Mattermost 需要 plugin）
- 當存在 `--channel` 或帶有頻道前綴的目標時，`openclaw message` 會將選取的頻道解析到其所屬 Plugin；否則會載入已設定的頻道 Plugin，以推斷預設頻道。

目標格式（`--target`）：

- WhatsApp：E.164、群組 JID，或 WhatsApp Channel/Newsletter JID（`...@newsletter`）
- Telegram：聊天 ID、`@username`，或論壇主題目標（`-1001234567890:topic:42`，或 `--thread-id 42`）
- Discord：`channel:<id>` 或 `user:<id>`（或 `<@id>` 提及；原始數字 ID 會視為頻道）
- Google Chat：`spaces/<spaceId>` 或 `users/<userId>`
- Slack：`channel:<id>` 或 `user:<id>`（接受原始頻道 ID）
- Mattermost (plugin)：`channel:<id>`、`user:<id>`，或 `@username`（裸 ID 會視為頻道）
- Signal：`+E.164`、`group:<id>`、`signal:+E.164`、`signal:group:<id>`，或 `username:<name>`/`u:<name>`
- iMessage：handle、`chat_id:<id>`、`chat_guid:<guid>`，或 `chat_identifier:<id>`
- Matrix：`@user:server`、`!room:server`，或 `#alias:server`
- Microsoft Teams：對話 ID（`19:...@thread.tacv2`）或 `conversation:<id>` 或 `user:<aad-object-id>`

名稱查找：

- 對於支援的提供者（Discord/Slack 等），像 `Help` 或 `#help` 這類頻道名稱會透過目錄快取解析。
- 快取未命中時，若提供者支援，OpenClaw 會嘗試即時目錄查找。

## 常用 flags

- `--channel <name>`
- `--account <id>`
- `--target <dest>`（用於傳送/輪詢/讀取等的目標頻道或使用者）
- `--targets <name>`（可重複；僅限廣播）
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef 行為

- `openclaw message` 會在執行選取的動作前解析支援的頻道 SecretRefs。
- 解析會在可行時限定於作用中動作目標範圍：
  - 設定 `--channel` 時為頻道範圍（或從像 `discord:...` 這類帶前綴的目標推斷）
  - 設定 `--account` 時為帳號範圍（頻道全域 + 選取的帳號表面）
  - 省略 `--account` 時，OpenClaw 不會強制使用 `default` 帳號 SecretRef 範圍
- 不相關頻道上未解析的 SecretRefs 不會阻擋目標訊息動作。
- 如果選取的頻道/帳號 SecretRef 未解析，該動作的命令會關閉失敗。

## 動作

### 核心

- `send`
  - 頻道：WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - 必要：`--target`，以及 `--message`、`--media` 或 `--presentation`
  - 選用：`--media`、`--presentation`、`--delivery`、`--pin`、`--reply-to`、`--thread-id`、`--gif-playback`、`--force-document`、`--silent`
  - 共用 presentation payload：`--presentation` 會傳送語意區塊（`text`、`context`、`divider`、`buttons`、`select`），核心會透過選取頻道宣告的能力來轉譯。請參閱 [訊息呈現](/zh-TW/plugins/message-presentation)。
  - 通用 delivery 偏好設定：`--delivery` 接受例如 `{ "pin": true }` 的 delivery 提示；當頻道支援時，`--pin` 是 pinned delivery 的簡寫。
  - 僅限 Telegram：`--force-document`（將圖片和 GIF 作為文件傳送，以避免 Telegram 壓縮）
  - 僅限 Telegram：`--thread-id`（論壇主題 ID）
  - 僅限 Slack：`--thread-id`（thread timestamp；`--reply-to` 使用相同欄位）
  - Telegram + Discord：`--silent`
  - 僅限 WhatsApp：`--gif-playback`；WhatsApp Channels/Newsletters 以其原生 `@newsletter` JID 定址。

- `poll`
  - 頻道：WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - 必要：`--target`、`--poll-question`、`--poll-option`（可重複）
  - 選用：`--poll-multi`
  - 僅限 Discord：`--poll-duration-hours`、`--silent`、`--message`
  - 僅限 Telegram：`--poll-duration-seconds`（5-600）、`--silent`、`--poll-anonymous` / `--poll-public`、`--thread-id`

- `react`
  - 頻道：Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - 必要：`--message-id`、`--target`
  - 選用：`--emoji`、`--remove`、`--participant`、`--from-me`、`--target-author`、`--target-author-uuid`
  - 注意：`--remove` 需要 `--emoji`（省略 `--emoji` 可在支援處清除自己的 reactions；請參閱 /tools/reactions）
  - 僅限 WhatsApp：`--participant`、`--from-me`
  - Signal 群組 reactions：需要 `--target-author` 或 `--target-author-uuid`

- `reactions`
  - 頻道：Discord/Google Chat/Slack/Matrix
  - 必要：`--message-id`、`--target`
  - 選用：`--limit`

- `read`
  - 頻道：Discord/Slack/Matrix
  - 必要：`--target`
  - 選用：`--limit`、`--message-id`、`--before`、`--after`
  - 僅限 Slack：`--message-id` 會讀取特定 Slack 訊息 timestamp；搭配 `--thread-id` 可讀取精確的 thread 回覆。
  - 僅限 Discord：`--around`

- `edit`
  - 頻道：Discord/Slack/Matrix
  - 必要：`--message-id`、`--message`、`--target`

- `delete`
  - 頻道：Discord/Slack/Telegram/Matrix
  - 必要：`--message-id`、`--target`

- `pin` / `unpin`
  - 頻道：Discord/Slack/Matrix
  - 必要：`--message-id`、`--target`

- `pins`（列出）
  - 頻道：Discord/Slack/Matrix
  - 必要：`--target`

- `permissions`
  - 頻道：Discord/Matrix
  - 必要：`--target`
  - 僅限 Matrix：當 Matrix 加密已啟用且允許驗證動作時可用

- `search`
  - 頻道：Discord
  - 必要：`--guild-id`、`--query`
  - 選用：`--channel-id`、`--channel-ids`（可重複）、`--author-id`、`--author-ids`（可重複）、`--limit`

### Threads

- `thread create`
  - 頻道：Discord
  - 必要：`--thread-name`、`--target`（頻道 ID）
  - 選用：`--message-id`、`--message`、`--auto-archive-min`

- `thread list`
  - 頻道：Discord
  - 必要：`--guild-id`
  - 選用：`--channel-id`、`--include-archived`、`--before`、`--limit`

- `thread reply`
  - 頻道：Discord
  - 必要：`--target`（thread ID）、`--message`
  - 選用：`--media`、`--reply-to`

### 表情符號

- `emoji list`
  - Discord：`--guild-id`
  - Slack：沒有額外 flags

- `emoji upload`
  - 頻道：Discord
  - 必要：`--guild-id`、`--emoji-name`、`--media`
  - 選用：`--role-ids`（可重複）

### 貼圖

- `sticker send`
  - 頻道：Discord
  - 必要：`--target`、`--sticker-id`（可重複）
  - 選用：`--message`

- `sticker upload`
  - 頻道：Discord
  - 必要：`--guild-id`、`--sticker-name`、`--sticker-desc`、`--sticker-tags`、`--media`

### 角色 / 頻道 / 成員 / 語音

- `role info`（Discord）：`--guild-id`
- `role add` / `role remove`（Discord）：`--guild-id`、`--user-id`、`--role-id`
- `channel info`（Discord）：`--target`
- `channel list`（Discord）：`--guild-id`
- `member info`（Discord/Slack）：`--user-id`（Discord 另需 `--guild-id`）
- `voice status`（Discord）：`--guild-id`、`--user-id`

### 事件

- `event list`（Discord）：`--guild-id`
- `event create`（Discord）：`--guild-id`、`--event-name`、`--start-time`
  - 選用：`--end-time`、`--desc`、`--channel-id`、`--location`、`--event-type`

### 管理（Discord）

- `timeout`：`--guild-id`、`--user-id`（選用 `--duration-min` 或 `--until`；兩者都省略則清除 timeout）
- `kick`：`--guild-id`、`--user-id`（+ `--reason`）
- `ban`：`--guild-id`、`--user-id`（+ `--delete-days`、`--reason`）
  - `timeout` 也支援 `--reason`

### 廣播

- `broadcast`
  - 頻道：任何已設定的頻道；使用 `--channel all` 以目標所有提供者
  - 必要：`--targets <target...>`
  - 選用：`--message`、`--media`、`--dry-run`

## 範例

傳送 Discord 回覆：

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

傳送帶有語意按鈕的訊息：

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

核心會依據頻道能力，將相同的 `presentation` payload 轉譯成 Discord components、Slack blocks、Telegram inline buttons、Mattermost props，或 Teams/Feishu cards。完整合約與 fallback 規則請參閱 [訊息呈現](/zh-TW/plugins/message-presentation)。

傳送更豐富的 presentation payload：

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

建立 Discord poll：

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

建立 Telegram poll（2 分鐘後自動關閉）：

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

傳送 Teams proactive 訊息：

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

建立 Teams poll：

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

在 Slack 加上 reaction：

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

在 Signal 群組加上 reaction：

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

透過通用 presentation 傳送 Telegram inline buttons：

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

透過通用 presentation 傳送 Teams card：

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

將 Telegram 圖片作為文件傳送以避免壓縮：

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## 相關

- [CLI 參考](/zh-TW/cli)
- [Agent 傳送](/zh-TW/tools/agent-send)
