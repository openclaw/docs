---
read_when:
    - メッセージ CLI アクションの追加または変更
    - 送信チャネルの動作を変更する
summary: '`openclaw message` の CLI リファレンス（send + チャンネルアクション）'
title: メッセージ
x-i18n:
    generated_at: "2026-06-27T10:57:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a8a716435313efa41a13ee5c6392eb2e4cfca2ede3e4690b157d26d077f7d56
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

- 複数のチャンネルが設定されている場合、`--channel` が必須です。
- ちょうど 1 つのチャンネルだけが設定されている場合、それがデフォルトになります。
- 値: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost には Plugin が必要)
- `openclaw message` は、`--channel` またはチャンネル接頭辞付きターゲットが存在する場合、選択されたチャンネルをそれを所有する Plugin に解決します。それ以外の場合は、デフォルトチャンネル推定のために設定済みチャンネル Plugin を読み込みます。

ターゲット形式 (`--target`):

- WhatsApp: E.164、グループ JID、または WhatsApp チャンネル/ニュースレター JID (`...@newsletter`)
- Telegram: チャット ID、`@username`、またはフォーラムトピックターゲット (`-1001234567890:topic:42`、または `--thread-id 42`)
- Discord: `channel:<id>` または `user:<id>` (または `<@id>` メンション。生の数値 ID はチャンネルとして扱われます)
- Google Chat: `spaces/<spaceId>` または `users/<userId>`
- Slack: `channel:<id>` または `user:<id>` (生のチャンネル ID も受け付けます)
- Mattermost (Plugin): `channel:<id>`、`user:<id>`、または `@username` (裸の ID はチャンネルとして扱われます)
- Signal: `+E.164`、`group:<id>`、`signal:+E.164`、`signal:group:<id>`、または `username:<name>`/`u:<name>`
- iMessage: ハンドル、`chat_id:<id>`、`chat_guid:<guid>`、または `chat_identifier:<id>`
- Matrix: `@user:server`、`!room:server`、または `#alias:server`
- Microsoft Teams: 会話 ID (`19:...@thread.tacv2`)、`conversation:<id>`、または `user:<aad-object-id>`

名前検索:

- 対応プロバイダー (Discord/Slack など) では、`Help` や `#help` のようなチャンネル名はディレクトリキャッシュを通じて解決されます。
- キャッシュミス時、プロバイダーが対応している場合、OpenClaw はライブディレクトリ検索を試みます。

## 共通フラグ

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (送信/投票/読み取りなどのターゲットチャンネルまたはユーザー)
- `--targets <name>` (繰り返し可。ブロードキャストのみ)
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef の動作

- `openclaw message` は、選択されたアクションを実行する前に、対応しているチャンネルの SecretRef を解決します。
- 可能な場合、解決はアクティブなアクションターゲットにスコープされます:
  - `--channel` が設定されている場合 (または `discord:...` のような接頭辞付きターゲットから推定される場合) はチャンネルスコープ
  - `--account` が設定されている場合はアカウントスコープ (チャンネルグローバル + 選択されたアカウントサーフェス)
  - `--account` が省略された場合、OpenClaw は `default` アカウントの SecretRef スコープを強制しません
- 無関係なチャンネル上の未解決の SecretRef は、ターゲット指定されたメッセージアクションをブロックしません。
- 選択されたチャンネル/アカウントの SecretRef が未解決の場合、そのアクションについてコマンドはフェイルクローズします。

## アクション

### コア

- `send`
  - チャンネル: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - 必須: `--target` に加えて、`--message`、`--media`、または `--presentation`
  - 任意: `--media`、`--presentation`、`--delivery`、`--pin`、`--reply-to`、`--thread-id`、`--gif-playback`、`--force-document`、`--silent`
  - 共有プレゼンテーションペイロード: `--presentation` は、コアが選択されたチャンネルの宣言済み機能を通じてレンダリングするセマンティックブロック (`text`、`context`、`divider`、`buttons`、`select`) を送信します。[メッセージプレゼンテーション](/ja-JP/plugins/message-presentation) を参照してください。
  - 汎用配信設定: `--delivery` は `{ "pin": true }` のような配信ヒントを受け付けます。チャンネルが対応している場合、`--pin` はピン留め配信の省略形です。
  - Telegram + WhatsApp: `--force-document` (チャンネル圧縮を避けるため、画像、GIF、動画をドキュメントとして送信)
  - Telegram のみ: `--thread-id` (フォーラムトピック ID)
  - Slack のみ: `--thread-id` (スレッドのタイムスタンプ。`--reply-to` は同じフィールドを使用)
  - Telegram + Discord: `--silent`
  - WhatsApp のみ: `--gif-playback`。WhatsApp チャンネル/ニュースレターはネイティブの `@newsletter` JID で指定します。

- `poll`
  - チャンネル: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - 必須: `--target`、`--poll-question`、`--poll-option` (繰り返し可)
  - 任意: `--poll-multi`
  - Discord のみ: `--poll-duration-hours`、`--silent`、`--message`
  - Telegram のみ: `--poll-duration-seconds` (5-600)、`--silent`、`--poll-anonymous` / `--poll-public`、`--thread-id`

- `react`
  - チャンネル: Discord/Google Chat/Matrix/Nextcloud Talk/Signal/Slack/Telegram/WhatsApp
  - 必須: `--message-id`、`--target`
  - 任意: `--emoji`、`--remove`、`--participant`、`--from-me`、`--target-author`、`--target-author-uuid`
  - 注: `--remove` には `--emoji` が必要です (対応している場合に自分のリアクションをクリアするには `--emoji` を省略します。/tools/reactions を参照)
  - WhatsApp のみ: `--participant`、`--from-me`
  - Signal グループリアクション: `--target-author` または `--target-author-uuid` が必須
  - Nextcloud Talk: リアクションの追加のみ。`--remove` は明確なエラーで拒否されます (/tools/reactions を参照)

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
  - 任意: `--channel-id`、`--channel-ids` (繰り返し可)、`--author-id`、`--author-ids` (繰り返し可)、`--limit`

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
  - 任意: `--role-ids` (繰り返し可)

### ステッカー

- `sticker send`
  - チャンネル: Discord
  - 必須: `--target`、`--sticker-id` (繰り返し可)
  - 任意: `--message`

- `sticker upload`
  - チャンネル: Discord
  - 必須: `--guild-id`、`--sticker-name`、`--sticker-desc`、`--sticker-tags`、`--media`

### ロール / チャンネル / メンバー / 音声

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id`（Discord では `--guild-id` も）
- `voice status` (Discord): `--guild-id`, `--user-id`

### イベント

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - 任意: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### モデレーション (Discord)

- `timeout`: `--guild-id`, `--user-id`（任意で `--duration-min` または `--until`。タイムアウトを解除するには両方とも省略）
- `kick`: `--guild-id`, `--user-id`（+ `--reason`）
- `ban`: `--guild-id`, `--user-id`（+ `--delete-days`, `--reason`）
  - `timeout` は `--reason` にも対応

### ブロードキャスト

- `broadcast`
  - チャンネル: 設定済みの任意のチャンネル。すべてのプロバイダーを対象にするには `--channel all` を使用
  - 必須: `--targets <target...>`
  - 任意: `--message`, `--media`, `--dry-run`

## 例

Discord 返信を送信する:

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

コアは、チャンネルの機能に応じて、同じ `presentation` ペイロードを Discord コンポーネント、Slack ブロック、Telegram インラインボタン、Mattermost props、または Teams/Feishu カードにレンダリングします。完全なコントラクトとフォールバックルールについては、[メッセージプレゼンテーション](/ja-JP/plugins/message-presentation) を参照してください。

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

Telegram 投票を作成する（2分後に自動終了）:

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Teams プロアクティブメッセージを送信する:

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

汎用プレゼンテーションを通じて Telegram Mini App ボタンを送信する:

```
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

Telegram Web アプリボタンは、ユーザーと bot の間のプライベートチャットでのみサポートされます。`web_app` を使用する古い JSON ペイロードも引き続き解析されますが、`webApp` が正規のプレゼンテーションフィールドです。

汎用プレゼンテーションを通じて Teams カードを送信する:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

圧縮を避けるために、Telegram または WhatsApp の画像をドキュメントとして送信する:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Agent send](/ja-JP/tools/agent-send)
