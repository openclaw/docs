---
read_when:
    - メッセージCLIアクションを追加または変更する
    - 送信チャネルの動作を変更する
summary: '`openclaw message` のCLIリファレンス（送信 + チャネルアクション）'
title: メッセージ
x-i18n:
    generated_at: "2026-04-24T04:51:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39932fb54caee37bdf58681da22b30e1b4cc7cc11b654010bf0335b1da3b2b4d
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

メッセージ送信とチャネルアクションのための単一の送信コマンドです
（Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp）。

## 使用方法

```
openclaw message <subcommand> [flags]
```

チャネル選択:

- 複数のチャネルが設定されている場合、`--channel` は必須です。
- ちょうど1つのチャネルだけが設定されている場合、それがデフォルトになります。
- 値: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`（MattermostにはPluginが必要）

ターゲット形式（`--target`）:

- WhatsApp: E.164 またはグループJID
- Telegram: チャットID または `@username`
- Discord: `channel:<id>` または `user:<id>`（または `<@id>` メンション。生の数値IDはチャネルとして扱われます）
- Google Chat: `spaces/<spaceId>` または `users/<userId>`
- Slack: `channel:<id>` または `user:<id>`（生のチャネルIDも受け付けます）
- Mattermost (Plugin): `channel:<id>`、`user:<id>`、または `@username`（プレフィックスなしIDはチャネルとして扱われます）
- Signal: `+E.164`、`group:<id>`、`signal:+E.164`、`signal:group:<id>`、または `username:<name>` / `u:<name>`
- iMessage: handle、`chat_id:<id>`、`chat_guid:<guid>`、または `chat_identifier:<id>`
- Matrix: `@user:server`、`!room:server`、または `#alias:server`
- Microsoft Teams: conversation ID（`19:...@thread.tacv2`）または `conversation:<id>` または `user:<aad-object-id>`

名前解決:

- サポートされているプロバイダ（Discord/Slackなど）では、`Help` や `#help` のようなチャネル名はディレクトリキャッシュ経由で解決されます。
- キャッシュミス時は、プロバイダが対応していれば、OpenClawはライブディレクトリ検索を試みます。

## 共通フラグ

- `--channel <name>`
- `--account <id>`
- `--target <dest>`（send/poll/readなどの対象チャネルまたはユーザー）
- `--targets <name>`（繰り返し可。broadcastのみ）
- `--json`
- `--dry-run`
- `--verbose`

## SecretRefの動作

- `openclaw message` は、選択されたアクションを実行する前に、サポートされているチャネルSecretRefを解決します。
- 可能な場合、解決はアクティブなアクションターゲットにスコープされます:
  - `--channel` が設定されている場合はチャネルスコープ（または `discord:...` のようなプレフィックス付きターゲットから推論された場合）
  - `--account` が設定されている場合はアカウントスコープ（チャネルグローバル + 選択アカウントのサーフェス）
  - `--account` が省略されている場合、OpenClawは `default` アカウントのSecretRefスコープを強制しません
- 無関係なチャネル上の未解決SecretRefは、対象メッセージアクションをブロックしません。
- 選択されたチャネル/アカウントのSecretRefが未解決の場合、そのアクションではコマンドはフェイルクローズドになります。

## アクション

### コア

- `send`
  - チャネル: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - 必須: `--target`、加えて `--message`、`--media`、または `--presentation`
  - 任意: `--media`、`--presentation`、`--delivery`、`--pin`、`--reply-to`、`--thread-id`、`--gif-playback`、`--force-document`、`--silent`
  - 共有presentationペイロード: `--presentation` はセマンティックブロック（`text`、`context`、`divider`、`buttons`、`select`）を送信し、コアが選択したチャネルの宣言済み機能を通じてレンダリングします。[Message Presentation](/ja-JP/plugins/message-presentation)を参照してください。
  - 汎用配信設定: `--delivery` は `{ "pin": true }` のような配信ヒントを受け付けます。`--pin` は、チャネルが対応している場合のピン留め配信の短縮形です。
  - Telegramのみ: `--force-document`（画像とGIFを、Telegram圧縮を避けるためドキュメントとして送信）
  - Telegramのみ: `--thread-id`（フォーラムトピックID）
  - Slackのみ: `--thread-id`（スレッドタイムスタンプ。`--reply-to` は同じフィールドを使います）
  - Telegram + Discord: `--silent`
  - WhatsAppのみ: `--gif-playback`

- `poll`
  - チャネル: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - 必須: `--target`、`--poll-question`、`--poll-option`（繰り返し）
  - 任意: `--poll-multi`
  - Discordのみ: `--poll-duration-hours`、`--silent`、`--message`
  - Telegramのみ: `--poll-duration-seconds`（5-600）、`--silent`、`--poll-anonymous` / `--poll-public`、`--thread-id`

- `react`
  - チャネル: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - 必須: `--message-id`、`--target`
  - 任意: `--emoji`、`--remove`、`--participant`、`--from-me`、`--target-author`、`--target-author-uuid`
  - 注記: `--remove` には `--emoji` が必要です（`--emoji` を省略すると、対応チャネルでは自分のリアクションをクリアします。/tools/reactions を参照）
  - WhatsAppのみ: `--participant`、`--from-me`
  - Signalグループリアクション: `--target-author` または `--target-author-uuid` が必須

- `reactions`
  - チャネル: Discord/Google Chat/Slack/Matrix
  - 必須: `--message-id`、`--target`
  - 任意: `--limit`

- `read`
  - チャネル: Discord/Slack/Matrix
  - 必須: `--target`
  - 任意: `--limit`、`--before`、`--after`
  - Discordのみ: `--around`

- `edit`
  - チャネル: Discord/Slack/Matrix
  - 必須: `--message-id`、`--message`、`--target`

- `delete`
  - チャネル: Discord/Slack/Telegram/Matrix
  - 必須: `--message-id`、`--target`

- `pin` / `unpin`
  - チャネル: Discord/Slack/Matrix
  - 必須: `--message-id`、`--target`

- `pins`（一覧）
  - チャネル: Discord/Slack/Matrix
  - 必須: `--target`

- `permissions`
  - チャネル: Discord/Matrix
  - 必須: `--target`
  - Matrixのみ: Matrix暗号化が有効で、検証アクションが許可されている場合に利用可能

- `search`
  - チャネル: Discord
  - 必須: `--guild-id`、`--query`
  - 任意: `--channel-id`、`--channel-ids`（繰り返し）、`--author-id`、`--author-ids`（繰り返し）、`--limit`

### スレッド

- `thread create`
  - チャネル: Discord
  - 必須: `--thread-name`、`--target`（チャネルID）
  - 任意: `--message-id`、`--message`、`--auto-archive-min`

- `thread list`
  - チャネル: Discord
  - 必須: `--guild-id`
  - 任意: `--channel-id`、`--include-archived`、`--before`、`--limit`

- `thread reply`
  - チャネル: Discord
  - 必須: `--target`（スレッドID）、`--message`
  - 任意: `--media`、`--reply-to`

### 絵文字

- `emoji list`
  - Discord: `--guild-id`
  - Slack: 追加フラグなし

- `emoji upload`
  - チャネル: Discord
  - 必須: `--guild-id`、`--emoji-name`、`--media`
  - 任意: `--role-ids`（繰り返し）

### ステッカー

- `sticker send`
  - チャネル: Discord
  - 必須: `--target`、`--sticker-id`（繰り返し）
  - 任意: `--message`

- `sticker upload`
  - チャネル: Discord
  - 必須: `--guild-id`、`--sticker-name`、`--sticker-desc`、`--sticker-tags`、`--media`

### Role / チャネル / メンバー / ボイス

- `role info`（Discord）: `--guild-id`
- `role add` / `role remove`（Discord）: `--guild-id`、`--user-id`、`--role-id`
- `channel info`（Discord）: `--target`
- `channel list`（Discord）: `--guild-id`
- `member info`（Discord/Slack）: `--user-id`（Discordでは追加で `--guild-id`）
- `voice status`（Discord）: `--guild-id`、`--user-id`

### イベント

- `event list`（Discord）: `--guild-id`
- `event create`（Discord）: `--guild-id`、`--event-name`、`--start-time`
  - 任意: `--end-time`、`--desc`、`--channel-id`、`--location`、`--event-type`

### モデレーション（Discord）

- `timeout`: `--guild-id`、`--user-id`（任意で `--duration-min` または `--until`。両方省略するとtimeoutを解除）
- `kick`: `--guild-id`、`--user-id`（+ `--reason`）
- `ban`: `--guild-id`、`--user-id`（+ `--delete-days`、`--reason`）
  - `timeout` も `--reason` をサポート

### ブロードキャスト

- `broadcast`
  - チャネル: 設定済みの任意のチャネル。すべてのプロバイダを対象にするには `--channel all` を使用
  - 必須: `--targets <target...>`
  - 任意: `--message`、`--media`、`--dry-run`

## 例

Discordで返信を送信する:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

セマンティックボタン付きメッセージを送信する:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

コアは、同じ `presentation` ペイロードを、チャネル機能に応じてDiscordコンポーネント、Slackブロック、Telegramインラインボタン、Mattermost props、またはTeams/Feishuカードにレンダリングします。完全な契約とフォールバックルールについては [Message Presentation](/ja-JP/plugins/message-presentation) を参照してください。

よりリッチなpresentationペイロードを送信する:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Discordで投票を作成する:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Telegramで投票を作成する（2分後に自動終了）:

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Teamsで能動的メッセージを送信する:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Teamsで投票を作成する:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Slackでリアクションする:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Signalグループでリアクションする:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

汎用presentation経由でTelegramインラインボタンを送信する:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

汎用presentation経由でTeamsカードを送信する:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

圧縮を避けるため、Telegram画像をドキュメントとして送信する:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## 関連

- [CLIリファレンス](/ja-JP/cli)
- [Agent send](/ja-JP/tools/agent-send)
