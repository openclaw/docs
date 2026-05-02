---
read_when:
    - メッセージ CLI アクションの追加または変更
    - 送信チャネルの動作を変更する
summary: '`openclaw message` の CLI リファレンス（send + チャンネルアクション）'
title: メッセージ
x-i18n:
    generated_at: "2026-05-02T20:44:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b73a50da34838f80ad5d0d266f5c66f95436f8535e6312296ae022918b1ab55
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

メッセージとチャンネルアクションを送信するための単一の送信コマンド
(Discord/Google Chat/iMessage/Matrix/Mattermost (plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp)。

## 使用方法

```
openclaw message <subcommand> [flags]
```

チャンネルの選択:

- 複数のチャンネルが設定されている場合、`--channel` は必須です。
- ちょうど1つのチャンネルが設定されている場合、それがデフォルトになります。
- 値: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost には plugin が必要)
- `openclaw message` は、`--channel` またはチャンネル接頭辞付きターゲットが存在する場合、選択されたチャンネルを所有する plugin に解決します。それ以外の場合は、デフォルトチャンネルの推論のために設定済みのチャンネル plugin を読み込みます。

ターゲット形式 (`--target`):

- WhatsApp: E.164、グループ JID、または WhatsApp チャンネル/ニュースレター JID (`...@newsletter`)
- Telegram: チャット id または `@username`
- Discord: `channel:<id>` または `user:<id>` (または `<@id>` メンション。生の数値 id はチャンネルとして扱われます)
- Google Chat: `spaces/<spaceId>` または `users/<userId>`
- Slack: `channel:<id>` または `user:<id>` (生のチャンネル id も受け付けます)
- Mattermost (plugin): `channel:<id>`、`user:<id>`、または `@username` (裸の id はチャンネルとして扱われます)
- Signal: `+E.164`、`group:<id>`、`signal:+E.164`、`signal:group:<id>`、または `username:<name>`/`u:<name>`
- iMessage: ハンドル、`chat_id:<id>`、`chat_guid:<guid>`、または `chat_identifier:<id>`
- Matrix: `@user:server`、`!room:server`、または `#alias:server`
- Microsoft Teams: 会話 id (`19:...@thread.tacv2`) または `conversation:<id>` または `user:<aad-object-id>`

名前検索:

- 対応プロバイダー (Discord/Slack など) では、`Help` や `#help` のようなチャンネル名はディレクトリキャッシュを介して解決されます。
- キャッシュミス時、プロバイダーが対応している場合、OpenClaw はライブディレクトリ検索を試みます。

## 共通フラグ

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (送信/ポーリング/読み取りなどの対象チャンネルまたはユーザー)
- `--targets <name>` (繰り返し指定。ブロードキャストのみ)
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef の動作

- `openclaw message` は、選択されたアクションを実行する前に、対応するチャンネル SecretRef を解決します。
- 解決は可能な場合、アクティブなアクションターゲットにスコープされます:
  - `--channel` が設定されている場合 (または `discord:...` のような接頭辞付きターゲットから推論される場合) はチャンネルスコープ
  - `--account` が設定されている場合はアカウントスコープ (チャンネルグローバル + 選択されたアカウントのサーフェス)
  - `--account` が省略されている場合、OpenClaw は `default` アカウントの SecretRef スコープを強制しません
- 無関係なチャンネル上の未解決の SecretRef は、ターゲット指定されたメッセージアクションをブロックしません。
- 選択されたチャンネル/アカウントの SecretRef が未解決の場合、そのアクションのコマンドは失敗クローズします。

## アクション

### コア

- `send`
  - チャンネル: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - 必須: `--target` に加えて `--message`、`--media`、または `--presentation`
  - 任意: `--media`、`--presentation`、`--delivery`、`--pin`、`--reply-to`、`--thread-id`、`--gif-playback`、`--force-document`、`--silent`
  - 共有プレゼンテーションペイロード: `--presentation` は、選択されたチャンネルの宣言済み機能を通じてコアがレンダリングするセマンティックブロック (`text`、`context`、`divider`、`buttons`、`select`) を送信します。[Message Presentation](/ja-JP/plugins/message-presentation) を参照してください。
  - 汎用配信設定: `--delivery` は `{ "pin": true }` のような配信ヒントを受け付けます。`--pin` は、チャンネルが対応している場合のピン留め配信の省略形です。
  - Telegram のみ: `--force-document` (Telegram の圧縮を避けるため、画像と GIF をドキュメントとして送信)
  - Telegram のみ: `--thread-id` (フォーラムトピック id)
  - Slack のみ: `--thread-id` (スレッドのタイムスタンプ。`--reply-to` は同じフィールドを使用します)
  - Telegram + Discord: `--silent`
  - WhatsApp のみ: `--gif-playback`。WhatsApp チャンネル/ニュースレターはネイティブの `@newsletter` JID で指定されます。

- `poll`
  - チャンネル: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - 必須: `--target`、`--poll-question`、`--poll-option` (繰り返し指定)
  - 任意: `--poll-multi`
  - Discord のみ: `--poll-duration-hours`、`--silent`、`--message`
  - Telegram のみ: `--poll-duration-seconds` (5-600)、`--silent`、`--poll-anonymous` / `--poll-public`、`--thread-id`

- `react`
  - チャンネル: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - 必須: `--message-id`、`--target`
  - 任意: `--emoji`、`--remove`、`--participant`、`--from-me`、`--target-author`、`--target-author-uuid`
  - 注: `--remove` には `--emoji` が必要です (対応している場合に自分のリアクションをクリアするには `--emoji` を省略します。/tools/reactions を参照)
  - WhatsApp のみ: `--participant`、`--from-me`
  - Signal グループリアクション: `--target-author` または `--target-author-uuid` が必須

- `reactions`
  - チャンネル: Discord/Google Chat/Slack/Matrix
  - 必須: `--message-id`、`--target`
  - 任意: `--limit`

- `read`
  - チャンネル: Discord/Slack/Matrix
  - 必須: `--target`
  - 任意: `--limit`、`--message-id`、`--before`、`--after`
  - Slack のみ: `--message-id` は特定の Slack メッセージタイムスタンプを読み取ります。正確なスレッド返信を読み取るには `--thread-id` と組み合わせます。
  - Discord のみ: `--around`

- `edit`
  - チャンネル: Discord/Slack/Matrix
  - 必須: `--message-id`、`--message`、`--target`

- `delete`
  - チャンネル: Discord/Slack/Telegram/Matrix
  - 必須: `--message-id`、`--target`

- `pin` / `unpin`
  - チャンネル: Discord/Slack/Matrix
  - 必須: `--message-id`、`--target`

- `pins` (一覧)
  - チャンネル: Discord/Slack/Matrix
  - 必須: `--target`

- `permissions`
  - チャンネル: Discord/Matrix
  - 必須: `--target`
  - Matrix のみ: Matrix 暗号化が有効で、検証アクションが許可されている場合に利用可能

- `search`
  - チャンネル: Discord
  - 必須: `--guild-id`、`--query`
  - 任意: `--channel-id`、`--channel-ids` (繰り返し指定)、`--author-id`、`--author-ids` (繰り返し指定)、`--limit`

### スレッド

- `thread create`
  - チャンネル: Discord
  - 必須: `--thread-name`、`--target` (チャンネル id)
  - 任意: `--message-id`、`--message`、`--auto-archive-min`

- `thread list`
  - チャンネル: Discord
  - 必須: `--guild-id`
  - 任意: `--channel-id`、`--include-archived`、`--before`、`--limit`

- `thread reply`
  - チャンネル: Discord
  - 必須: `--target` (スレッド id)、`--message`
  - 任意: `--media`、`--reply-to`

### 絵文字

- `emoji list`
  - Discord: `--guild-id`
  - Slack: 追加フラグなし

- `emoji upload`
  - チャンネル: Discord
  - 必須: `--guild-id`、`--emoji-name`、`--media`
  - 任意: `--role-ids` (繰り返し指定)

### ステッカー

- `sticker send`
  - チャンネル: Discord
  - 必須: `--target`、`--sticker-id` (繰り返し指定)
  - 任意: `--message`

- `sticker upload`
  - チャンネル: Discord
  - 必須: `--guild-id`、`--sticker-name`、`--sticker-desc`、`--sticker-tags`、`--media`

### ロール / チャンネル / メンバー / 音声

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`、`--user-id`、`--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (Discord では `--guild-id` も必要)
- `voice status` (Discord): `--guild-id`、`--user-id`

### イベント

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`、`--event-name`、`--start-time`
  - 任意: `--end-time`、`--desc`、`--channel-id`、`--location`、`--event-type`

### モデレーション (Discord)

- `timeout`: `--guild-id`、`--user-id` (任意で `--duration-min` または `--until`。タイムアウトを解除するには両方を省略)
- `kick`: `--guild-id`、`--user-id` (+ `--reason`)
- `ban`: `--guild-id`、`--user-id` (+ `--delete-days`、`--reason`)
  - `timeout` は `--reason` にも対応しています

### ブロードキャスト

- `broadcast`
  - チャンネル: 設定済みの任意のチャンネル。すべてのプロバイダーを対象にするには `--channel all` を使用します
  - 必須: `--targets <target...>`
  - 任意: `--message`、`--media`、`--dry-run`

## 例

Discord 返信を送信する:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

セマンティックボタン付きのメッセージを送信する:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

コアは、チャンネル機能に応じて同じ `presentation` ペイロードを Discord コンポーネント、Slack ブロック、Telegram インラインボタン、Mattermost props、または Teams/Feishu カードにレンダリングします。完全な契約とフォールバック規則については [Message Presentation](/ja-JP/plugins/message-presentation) を参照してください。

よりリッチなプレゼンテーションペイロードを送信する:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Discord 投票を作成する:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Telegram 投票を作成する (2分後に自動終了):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Teams のプロアクティブメッセージを送信する:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Teams 投票を作成する:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Slack でリアクションする:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Signal グループでリアクションする:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

汎用プレゼンテーションを通じて Telegram インラインボタンを送信する:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

汎用プレゼンテーションを通じて Teams カードを送信する:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

圧縮を避けるために Telegram 画像をドキュメントとして送信する:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Agent send](/ja-JP/tools/agent-send)
