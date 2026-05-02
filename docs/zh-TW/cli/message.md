---
read_when:
    - 新增或修改訊息 CLI 動作
    - 變更傳出通道行為
summary: '`openclaw message` 的 CLI 參考（傳送 + 頻道動作）'
title: 訊息
x-i18n:
    generated_at: "2026-05-02T20:44:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b73a50da34838f80ad5d0d266f5c66f95436f8535e6312296ae022918b1ab55
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

用於傳送訊息與頻道動作的單一外送命令
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp)。

## 用法

```
openclaw message <subcommand> [flags]
```

頻道選擇：

- 如果設定了多個頻道，則必須提供 `--channel`。
- 如果剛好只設定一個頻道，該頻道會成為預設值。
- 值：`discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost 需要 Plugin)
- 當存在 `--channel` 或帶有頻道前綴的目標時，`openclaw message` 會將所選頻道解析為其所屬的 Plugin；否則會載入已設定的頻道 Plugin 以推斷預設頻道。

目標格式 (`--target`)：

- WhatsApp：E.164、群組 JID，或 WhatsApp Channel/Newsletter JID (`...@newsletter`)
- Telegram：聊天 ID 或 `@username`
- Discord：`channel:<id>` 或 `user:<id>` (或 `<@id>` 提及；原始數字 ID 會被視為頻道)
- Google Chat：`spaces/<spaceId>` 或 `users/<userId>`
- Slack：`channel:<id>` 或 `user:<id>` (接受原始頻道 ID)
- Mattermost (Plugin)：`channel:<id>`、`user:<id>` 或 `@username` (裸 ID 會被視為頻道)
- Signal：`+E.164`、`group:<id>`、`signal:+E.164`、`signal:group:<id>`，或 `username:<name>`/`u:<name>`
- iMessage：處理代號、`chat_id:<id>`、`chat_guid:<guid>` 或 `chat_identifier:<id>`
- Matrix：`@user:server`、`!room:server` 或 `#alias:server`
- Microsoft Teams：對話 ID (`19:...@thread.tacv2`) 或 `conversation:<id>` 或 `user:<aad-object-id>`

名稱查詢：

- 對於支援的提供者 (Discord/Slack/等)，像 `Help` 或 `#help` 這樣的頻道名稱會透過目錄快取解析。
- 快取未命中時，如果提供者支援，OpenClaw 會嘗試即時目錄查詢。

## 常用旗標

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (send/poll/read/等的目標頻道或使用者)
- `--targets <name>` (可重複；僅限廣播)
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef 行為

- `openclaw message` 會在執行所選動作前解析支援頻道的 SecretRefs。
- 解析會在可能時限定於作用中的動作目標：
  - 設定 `--channel` 時以頻道為範圍 (或從像 `discord:...` 這樣的前綴目標推斷)
  - 設定 `--account` 時以帳戶為範圍 (頻道全域 + 所選帳戶表面)
  - 省略 `--account` 時，OpenClaw 不會強制使用 `default` 帳戶 SecretRef 範圍
- 無關頻道上未解析的 SecretRefs 不會阻擋目標式訊息動作。
- 如果所選頻道/帳戶 SecretRef 未解析，該命令會對該動作以失敗關閉。

## 動作

### 核心

- `send`
  - 頻道：WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - 必要：`--target`，以及 `--message`、`--media` 或 `--presentation`
  - 選用：`--media`、`--presentation`、`--delivery`、`--pin`、`--reply-to`、`--thread-id`、`--gif-playback`、`--force-document`、`--silent`
  - 共用簡報承載：`--presentation` 會傳送語意區塊 (`text`、`context`、`divider`、`buttons`、`select`)，核心會透過所選頻道宣告的能力轉譯。請參閱 [訊息簡報](/zh-TW/plugins/message-presentation)。
  - 通用遞送偏好：`--delivery` 接受像 `{ "pin": true }` 這樣的遞送提示；當頻道支援時，`--pin` 是釘選遞送的簡寫。
  - 僅限 Telegram：`--force-document` (將圖片與 GIF 作為文件傳送，以避免 Telegram 壓縮)
  - 僅限 Telegram：`--thread-id` (論壇主題 ID)
  - 僅限 Slack：`--thread-id` (討論串時間戳記；`--reply-to` 使用相同欄位)
  - Telegram + Discord：`--silent`
  - 僅限 WhatsApp：`--gif-playback`；WhatsApp Channels/Newsletters 使用其原生 `@newsletter` JID 定址。

- `poll`
  - 頻道：WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - 必要：`--target`、`--poll-question`、`--poll-option` (可重複)
  - 選用：`--poll-multi`
  - 僅限 Discord：`--poll-duration-hours`、`--silent`、`--message`
  - 僅限 Telegram：`--poll-duration-seconds` (5-600)、`--silent`、`--poll-anonymous` / `--poll-public`、`--thread-id`

- `react`
  - 頻道：Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - 必要：`--message-id`、`--target`
  - 選用：`--emoji`、`--remove`、`--participant`、`--from-me`、`--target-author`、`--target-author-uuid`
  - 注意：`--remove` 需要 `--emoji` (省略 `--emoji` 可在支援處清除自己的反應；請參閱 /tools/reactions)
  - 僅限 WhatsApp：`--participant`、`--from-me`
  - Signal 群組反應：必須提供 `--target-author` 或 `--target-author-uuid`

- `reactions`
  - 頻道：Discord/Google Chat/Slack/Matrix
  - 必要：`--message-id`、`--target`
  - 選用：`--limit`

- `read`
  - 頻道：Discord/Slack/Matrix
  - 必要：`--target`
  - 選用：`--limit`、`--message-id`、`--before`、`--after`
  - 僅限 Slack：`--message-id` 會讀取特定 Slack 訊息時間戳記；搭配 `--thread-id` 可讀取精確的討論串回覆。
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

- `pins` (列出)
  - 頻道：Discord/Slack/Matrix
  - 必要：`--target`

- `permissions`
  - 頻道：Discord/Matrix
  - 必要：`--target`
  - 僅限 Matrix：在啟用 Matrix 加密且允許驗證動作時可用

- `search`
  - 頻道：Discord
  - 必要：`--guild-id`、`--query`
  - 選用：`--channel-id`、`--channel-ids` (可重複)、`--author-id`、`--author-ids` (可重複)、`--limit`

### 討論串

- `thread create`
  - 頻道：Discord
  - 必要：`--thread-name`、`--target` (頻道 ID)
  - 選用：`--message-id`、`--message`、`--auto-archive-min`

- `thread list`
  - 頻道：Discord
  - 必要：`--guild-id`
  - 選用：`--channel-id`、`--include-archived`、`--before`、`--limit`

- `thread reply`
  - 頻道：Discord
  - 必要：`--target` (討論串 ID)、`--message`
  - 選用：`--media`、`--reply-to`

### 表情符號

- `emoji list`
  - Discord：`--guild-id`
  - Slack：沒有額外旗標

- `emoji upload`
  - 頻道：Discord
  - 必要：`--guild-id`、`--emoji-name`、`--media`
  - 選用：`--role-ids` (可重複)

### 貼圖

- `sticker send`
  - 頻道：Discord
  - 必要：`--target`、`--sticker-id` (可重複)
  - 選用：`--message`

- `sticker upload`
  - 頻道：Discord
  - 必要：`--guild-id`、`--sticker-name`、`--sticker-desc`、`--sticker-tags`、`--media`

### 角色 / 頻道 / 成員 / 語音

- `role info` (Discord)：`--guild-id`
- `role add` / `role remove` (Discord)：`--guild-id`、`--user-id`、`--role-id`
- `channel info` (Discord)：`--target`
- `channel list` (Discord)：`--guild-id`
- `member info` (Discord/Slack)：`--user-id` (Discord 另需 `--guild-id`)
- `voice status` (Discord)：`--guild-id`、`--user-id`

### 事件

- `event list` (Discord)：`--guild-id`
- `event create` (Discord)：`--guild-id`、`--event-name`、`--start-time`
  - 選用：`--end-time`、`--desc`、`--channel-id`、`--location`、`--event-type`

### 管理 (Discord)

- `timeout`：`--guild-id`、`--user-id` (選用 `--duration-min` 或 `--until`；兩者皆省略可清除逾時)
- `kick`：`--guild-id`、`--user-id` (+ `--reason`)
- `ban`：`--guild-id`、`--user-id` (+ `--delete-days`、`--reason`)
  - `timeout` 也支援 `--reason`

### 廣播

- `broadcast`
  - 頻道：任何已設定的頻道；使用 `--channel all` 以目標設定所有提供者
  - 必要：`--targets <target...>`
  - 選用：`--message`、`--media`、`--dry-run`

## 範例

傳送 Discord 回覆：

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

傳送含語意按鈕的訊息：

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

核心會根據頻道能力，將相同的 `presentation` 承載轉譯為 Discord 元件、Slack 區塊、Telegram 行內按鈕、Mattermost props，或 Teams/Feishu 卡片。完整合約與備援規則請參閱 [訊息簡報](/zh-TW/plugins/message-presentation)。

傳送更豐富的簡報承載：

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

建立 Discord 投票：

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

建立 Telegram 投票 (2 分鐘後自動關閉)：

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

傳送 Teams 主動訊息：

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

建立 Teams 投票：

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

在 Slack 中反應：

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

在 Signal 群組中反應：

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

透過通用簡報傳送 Telegram 行內按鈕：

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

透過通用簡報傳送 Teams 卡片：

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
