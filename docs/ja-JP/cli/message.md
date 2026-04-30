---
read_when:
    - メッセージ CLI アクションの追加または変更
    - アウトバウンドチャネルの動作の変更
summary: '`openclaw message` の CLI リファレンス (送信 + チャネルアクション)'
title: メッセージ
x-i18n:
    generated_at: "2026-04-30T05:05:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43f14b3815d89c92a7503e620e2424f41a3f6b92e20e089504017305b19bace4
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

メッセージとチャンネルアクションを送信するための単一の送信コマンド
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp)。

## 使用方法

```
openclaw message <subcommand> [flags]
```

チャンネル選択:

- 複数のチャンネルが設定されている場合は、`--channel` が必須です。
- チャンネルが 1 つだけ設定されている場合、それがデフォルトになります。
- 値: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost には Plugin が必要)
- `--channel` またはチャンネル接頭辞付きターゲットが存在する場合、`openclaw message` は選択されたチャンネルをその所有元 Plugin に解決します。それ以外の場合は、デフォルトチャンネル推論のために設定済みチャンネル Plugin を読み込みます。

ターゲット形式 (`--target`):

- WhatsApp: E.164 またはグループ JID
- Telegram: チャット ID または `@username`
- Discord: `channel:<id>` または `user:<id>` (または `<@id>` メンション。生の数値 ID はチャンネルとして扱われます)
- Google Chat: `spaces/<spaceId>` または `users/<userId>`
- Slack: `channel:<id>` または `user:<id>` (生のチャンネル ID も受け入れられます)
- Mattermost (Plugin): `channel:<id>`、`user:<id>`、または `@username` (裸の ID はチャンネルとして扱われます)
- Signal: `+E.164`、`group:<id>`、`signal:+E.164`、`signal:group:<id>`、または `username:<name>`/`u:<name>`
- iMessage: ハンドル、`chat_id:<id>`、`chat_guid:<guid>`、または `chat_identifier:<id>`
- Matrix: `@user:server`、`!room:server`、または `#alias:server`
- Microsoft Teams: 会話 ID (`19:...@thread.tacv2`) または `conversation:<id>` または `user:<aad-object-id>`

名前検索:

- サポートされているプロバイダー (Discord/Slack など) では、`Help` や `#help` のようなチャンネル名はディレクトリキャッシュ経由で解決されます。
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

- `openclaw message` は、選択されたアクションを実行する前に、サポート対象チャンネルの SecretRef を解決します。
- 可能な場合、解決はアクティブなアクションターゲットにスコープされます:
  - `--channel` が設定されている場合 (または `discord:...` のような接頭辞付きターゲットから推論される場合) はチャンネルスコープ
  - `--account` が設定されている場合はアカウントスコープ (チャンネルグローバル + 選択されたアカウント面)
  - `--account` が省略された場合、OpenClaw は `default` アカウント SecretRef スコープを強制しません
- 関係のないチャンネル上の未解決 SecretRef は、対象指定されたメッセージアクションをブロックしません。
- 選択されたチャンネル/アカウントの SecretRef が未解決の場合、そのアクションのコマンドはフェイルクローズします。

## アクション

### コア

- `send`
  - チャンネル: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - 必須: `--target` に加えて、`--message`、`--media`、または `--presentation`
  - 任意: `--media`、`--presentation`、`--delivery`、`--pin`、`--reply-to`、`--thread-id`、`--gif-playback`、`--force-document`、`--silent`
  - 共有プレゼンテーションペイロード: `--presentation` は、コアが選択されたチャンネルの宣言済み機能を通じてレンダリングするセマンティックブロック (`text`、`context`、`divider`、`buttons`、`select`) を送信します。[メッセージプレゼンテーション](/ja-JP/plugins/message-presentation) を参照してください。
  - 汎用配信設定: `--delivery` は `{ "pin": true }` のような配信ヒントを受け入れます。`--pin` は、チャンネルが対応している場合のピン留め配信の省略形です。
  - Telegram のみ: `--force-document` (Telegram の圧縮を避けるため、画像と GIF をドキュメントとして送信)
  - Telegram のみ: `--thread-id` (フォーラムトピック ID)
  - Slack のみ: `--thread-id` (スレッドのタイムスタンプ。`--reply-to` は同じフィールドを使用します)
  - Telegram + Discord: `--silent`
  - WhatsApp のみ: `--gif-playback`

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
  - 注: `--remove` には `--emoji` が必要です (対応している場所で自分のリアクションをクリアするには `--emoji` を省略します。/tools/reactions を参照)
  - WhatsApp のみ: `--participant`、`--from-me`
  - Signal グループリアクション: `--target-author` または `--target-author-uuid` が必須です

- `reactions`
  - チャンネル: Discord/Google Chat/Slack/Matrix
  - 必須: `--message-id`、`--target`
  - 任意: `--limit`

- `read`
  - チャンネル: Discord/Slack/Matrix
  - 必須: `--target`
  - 任意: `--limit`、`--before`、`--after`
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
  - Matrix のみ: Matrix 暗号化が有効で、検証アクションが許可されている場合に利用できます

- `search`
  - チャンネル: Discord
  - 必須: `--guild-id`、`--query`
  - 任意: `--channel-id`、`--channel-ids` (繰り返し指定)、`--author-id`、`--author-ids` (繰り返し指定)、`--limit`

### スレッド

- `thread create`
  - チャンネル: Discord
  - 必須: `--thread-name`、`--target` (チャンネル ID)
  - 任意: `--message-id`、`--message`、`--auto-archive-min`

- `thread list`
  - チャンネル: Discord
  - 必須: `--guild-id`
  - 任意: `--channel-id`、`--include-archived`、`--before`、`--limit`

- `thread reply`
  - チャンネル: Discord
  - 必須: `--target` (スレッド ID)、`--message`
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
- `member info` (Discord/Slack): `--user-id` (Discord の場合は + `--guild-id`)
- `voice status` (Discord): `--guild-id`、`--user-id`

### イベント

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`、`--event-name`、`--start-time`
  - 任意: `--end-time`、`--desc`、`--channel-id`、`--location`、`--event-type`

### モデレーション (Discord)

- `timeout`: `--guild-id`、`--user-id` (任意で `--duration-min` または `--until`。タイムアウトをクリアするには両方を省略)
- `kick`: `--guild-id`、`--user-id` (+ `--reason`)
- `ban`: `--guild-id`、`--user-id` (+ `--delete-days`、`--reason`)
  - `timeout` は `--reason` にも対応しています

### ブロードキャスト

- `broadcast`
  - チャンネル: 任意の設定済みチャンネル。すべてのプロバイダーを対象にするには `--channel all` を使用します
  - 必須: `--targets <target...>`
  - 任意: `--message`、`--media`、`--dry-run`

## 例

Discord 返信を送信:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

セマンティックボタン付きメッセージを送信:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

コアは、同じ `presentation` ペイロードを、チャンネル機能に応じて Discord コンポーネント、Slack ブロック、Telegram インラインボタン、Mattermost props、または Teams/Feishu カードにレンダリングします。完全な契約とフォールバック規則については、[メッセージプレゼンテーション](/ja-JP/plugins/message-presentation) を参照してください。

よりリッチなプレゼンテーションペイロードを送信:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Discord ポーリングを作成:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Telegram ポーリングを作成 (2 分後に自動クローズ):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Teams のプロアクティブメッセージを送信:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Teams ポーリングを作成:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Slack でリアクション:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Signal グループでリアクション:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

汎用プレゼンテーション経由で Telegram インラインボタンを送信:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

汎用プレゼンテーション経由で Teams カードを送信:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

圧縮を避けるため、Telegram 画像をドキュメントとして送信:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Agent 送信](/ja-JP/tools/agent-send)
