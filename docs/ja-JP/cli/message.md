---
read_when:
    - message CLI actions を追加または変更する
    - outbound channel の動作を変更する
summary: '`openclaw message` の CLI リファレンス（送信 + channel actions）'
title: message
x-i18n:
    generated_at: "2026-04-23T14:02:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37b6f40b435326aee186dad1e6e060c24f2ef6d44b07fd85d4ce5cfd7f350b91
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

メッセージ送信と channel actions のための単一の outbound コマンド
（Discord/Google Chat/iMessage/Matrix/Mattermost (plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp）。

## 使用方法

```
openclaw message <subcommand> [flags]
```

channel の選択:

- 複数の channel が設定されている場合、`--channel` は必須です。
- ちょうど 1 つの channel だけが設定されている場合、それがデフォルトになります。
- 値: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`（Mattermost には plugin が必要）

target 形式（`--target`）:

- WhatsApp: E.164 または group JID
- Telegram: chat id または `@username`
- Discord: `channel:<id>` または `user:<id>`（または `<@id>` mention。生の数値 ids は channels として扱われます）
- Google Chat: `spaces/<spaceId>` または `users/<userId>`
- Slack: `channel:<id>` または `user:<id>`（生の channel id も使用可能）
- Mattermost (plugin): `channel:<id>`、`user:<id>`、または `@username`（id 単体は channels として扱われます）
- Signal: `+E.164`、`group:<id>`、`signal:+E.164`、`signal:group:<id>`、または `username:<name>`/`u:<name>`
- iMessage: handle、`chat_id:<id>`、`chat_guid:<guid>`、または `chat_identifier:<id>`
- Matrix: `@user:server`、`!room:server`、または `#alias:server`
- Microsoft Teams: conversation id（`19:...@thread.tacv2`）、`conversation:<id>`、または `user:<aad-object-id>`

名前 lookup:

- 対応する providers（Discord/Slack など）では、`Help` や `#help` のような channel 名は directory cache 経由で解決されます。
- cache miss 時は、provider が対応していれば OpenClaw が live directory lookup を試みます。

## 共通 flags

- `--channel <name>`
- `--account <id>`
- `--target <dest>`（send/poll/read などの対象 channel または user）
- `--targets <name>`（繰り返し可。broadcast のみ）
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef の動作

- `openclaw message` は、選択された action を実行する前に、対応する channel SecretRefs を解決します。
- 可能な場合、解決はアクティブな action target にスコープされます:
  - `--channel` が設定されている場合は channel スコープ（または `discord:...` のような prefix 付き target から推論）
  - `--account` が設定されている場合は account スコープ（channel globals + 選択した account surfaces）
  - `--account` を省略した場合、OpenClaw は `default` account の SecretRef スコープを強制しません
- 関係のない channels 上の未解決 SecretRefs は、対象を絞った message action を妨げません。
- 選択した channel/account の SecretRef が未解決の場合、その action に対してコマンドは fail closed します。

## Actions

### Core

- `send`
  - Channels: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - 必須: `--target`、および `--message`、`--media`、`--presentation` のいずれか
  - 任意: `--media`、`--presentation`、`--delivery`、`--pin`、`--reply-to`、`--thread-id`、`--gif-playback`、`--force-document`、`--silent`
  - 共通 presentation payloads: `--presentation` は意味的な blocks（`text`、`context`、`divider`、`buttons`、`select`）を送信し、core が選択した channel の宣言済み capabilities を通じてレンダリングします。[Message Presentation](/ja-JP/plugins/message-presentation) を参照してください。
  - 汎用 delivery preferences: `--delivery` は `{ "pin": true }` のような delivery hints を受け付けます。`--pin` は、channel がサポートしている場合の pinned delivery の省略形です。
  - Telegram のみ: `--force-document`（Telegram の圧縮を避けるため、画像や GIF を documents として送信）
  - Telegram のみ: `--thread-id`（forum topic id）
  - Slack のみ: `--thread-id`（thread timestamp。`--reply-to` も同じ field を使います）
  - Telegram + Discord: `--silent`
  - WhatsApp のみ: `--gif-playback`

- `poll`
  - Channels: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - 必須: `--target`、`--poll-question`、`--poll-option`（繰り返し可）
  - 任意: `--poll-multi`
  - Discord のみ: `--poll-duration-hours`、`--silent`、`--message`
  - Telegram のみ: `--poll-duration-seconds`（5-600）、`--silent`、`--poll-anonymous` / `--poll-public`、`--thread-id`

- `react`
  - Channels: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - 必須: `--message-id`、`--target`
  - 任意: `--emoji`、`--remove`、`--participant`、`--from-me`、`--target-author`、`--target-author-uuid`
  - 注: `--remove` には `--emoji` が必要です（対応する場合に自分の reactions をクリアするには `--emoji` を省略します。/tools/reactions を参照）
  - WhatsApp のみ: `--participant`、`--from-me`
  - Signal group reactions: `--target-author` または `--target-author-uuid` が必須

- `reactions`
  - Channels: Discord/Google Chat/Slack/Matrix
  - 必須: `--message-id`、`--target`
  - 任意: `--limit`

- `read`
  - Channels: Discord/Slack/Matrix
  - 必須: `--target`
  - 任意: `--limit`、`--before`、`--after`
  - Discord のみ: `--around`

- `edit`
  - Channels: Discord/Slack/Matrix
  - 必須: `--message-id`、`--message`、`--target`

- `delete`
  - Channels: Discord/Slack/Telegram/Matrix
  - 必須: `--message-id`、`--target`

- `pin` / `unpin`
  - Channels: Discord/Slack/Matrix
  - 必須: `--message-id`、`--target`

- `pins`（一覧）
  - Channels: Discord/Slack/Matrix
  - 必須: `--target`

- `permissions`
  - Channels: Discord/Matrix
  - 必須: `--target`
  - Matrix のみ: Matrix encryption が有効で、verification actions が許可されている場合に利用可能

- `search`
  - Channels: Discord
  - 必須: `--guild-id`、`--query`
  - 任意: `--channel-id`、`--channel-ids`（繰り返し可）、`--author-id`、`--author-ids`（繰り返し可）、`--limit`

### Threads

- `thread create`
  - Channels: Discord
  - 必須: `--thread-name`、`--target`（channel id）
  - 任意: `--message-id`、`--message`、`--auto-archive-min`

- `thread list`
  - Channels: Discord
  - 必須: `--guild-id`
  - 任意: `--channel-id`、`--include-archived`、`--before`、`--limit`

- `thread reply`
  - Channels: Discord
  - 必須: `--target`（thread id）、`--message`
  - 任意: `--media`、`--reply-to`

### Emojis

- `emoji list`
  - Discord: `--guild-id`
  - Slack: 追加 flags なし

- `emoji upload`
  - Channels: Discord
  - 必須: `--guild-id`、`--emoji-name`、`--media`
  - 任意: `--role-ids`（繰り返し可）

### Stickers

- `sticker send`
  - Channels: Discord
  - 必須: `--target`、`--sticker-id`（繰り返し可）
  - 任意: `--message`

- `sticker upload`
  - Channels: Discord
  - 必須: `--guild-id`、`--sticker-name`、`--sticker-desc`、`--sticker-tags`、`--media`

### Roles / Channels / Members / Voice

- `role info`（Discord）: `--guild-id`
- `role add` / `role remove`（Discord）: `--guild-id`、`--user-id`、`--role-id`
- `channel info`（Discord）: `--target`
- `channel list`（Discord）: `--guild-id`
- `member info`（Discord/Slack）: `--user-id`（Discord では `+ --guild-id`）
- `voice status`（Discord）: `--guild-id`、`--user-id`

### Events

- `event list`（Discord）: `--guild-id`
- `event create`（Discord）: `--guild-id`、`--event-name`、`--start-time`
  - 任意: `--end-time`、`--desc`、`--channel-id`、`--location`、`--event-type`

### Moderation（Discord）

- `timeout`: `--guild-id`、`--user-id`（任意で `--duration-min` または `--until`。両方省略すると timeout をクリア）
- `kick`: `--guild-id`、`--user-id`（+ `--reason`）
- `ban`: `--guild-id`、`--user-id`（+ `--delete-days`、`--reason`）
  - `timeout` も `--reason` をサポート

### Broadcast

- `broadcast`
  - Channels: 設定済みの任意の channel。すべての providers を対象にするには `--channel all` を使用
  - 必須: `--targets <target...>`
  - 任意: `--message`、`--media`、`--dry-run`

## 例

Discord の reply を送信:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

意味的な buttons を含むメッセージを送信:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

Core は同じ `presentation` payload を、channel capability に応じて Discord components、Slack blocks、Telegram inline buttons、Mattermost props、または Teams/Feishu cards にレンダリングします。完全な contract と fallback rules については [Message Presentation](/ja-JP/plugins/message-presentation) を参照してください。

よりリッチな presentation payload を送信:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Discord poll を作成:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Telegram poll を作成（2 分後に自動クローズ）:

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Teams の proactive message を送信:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Teams poll を作成:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Slack で reaction を付ける:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Signal group で reaction を付ける:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

汎用 presentation で Telegram inline buttons を送信:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

汎用 presentation で Teams card を送信:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

圧縮を避けるため、Telegram で画像を document として送信:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```
