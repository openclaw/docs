---
read_when:
    - メッセージ CLI アクションの追加または変更
    - 送信チャネルの動作を変更する
summary: '`openclaw message` の CLI リファレンス（送信 + チャンネルアクション）'
title: メッセージ
x-i18n:
    generated_at: "2026-07-11T22:03:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2d1cca9be7cfa7625cac3e440ecb5847d9fab9c545c9267a41a2f99c26c514b
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Discord、Google Chat、iMessage、Matrix、Mattermost（Plugin）、Microsoft Teams、
Signal、Slack、Telegram、WhatsAppでメッセージやチャネルアクションを送信するための
単一の送信コマンドです。

```bash
openclaw message <subcommand> [flags]
```

## チャネルの選択

- 複数のチャネルが設定されている場合は `--channel <name>` が必須です。
  設定されているチャネルが1つだけの場合は、そのチャネルがデフォルトになります。
- 値: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  （MattermostにはPluginが必要です）。
- チャネル接頭辞付きのターゲット（例: `discord:channel:123`）では、
  `--channel` を明示しなくても所有元のPluginが解決されます。

## ターゲット形式（`-t, --target`）

| チャネル            | 形式                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Discord             | `channel:<id>`、`user:<id>`、`<@id>` メンション、または数値IDのみ（チャネルIDとして扱われます）                   |
| Google Chat         | `spaces/<spaceId>` または `users/<userId>`                                                                         |
| iMessage            | ハンドル、`chat_id:<id>`、`chat_guid:<guid>`、または `chat_identifier:<id>`                                        |
| Mattermost（Plugin） | `channel:<id>`、`user:<id>`、`@username`、またはIDのみ（チャネルとして扱われます）                                 |
| Matrix              | `@user:server`、`!room:server`、または `#alias:server`                                                              |
| Microsoft Teams     | `conversation:<id>`（`19:...@thread.tacv2`）、会話IDのみ、または `user:<aad-object-id>`                             |
| Signal              | `+E.164`、`group:<id>`、`uuid:<id>`、`username:<name>`/`u:<name>`、またはこれらに `signal:` 接頭辞を付けたもの      |
| Slack               | `channel:<id>` または `user:<id>`（IDのみの場合はチャネルとして扱われます）                                        |
| Telegram            | チャットID、`@username`、またはフォーラムトピックのターゲット: `<chatId>:topic:<topicId>`（または `--thread-id <topicId>`） |
| WhatsApp            | E.164、グループJID（`...@g.us`）、またはチャネル／ニュースレターJID（`...@newsletter`）                            |

チャネル名の検索: ディレクトリを持つプロバイダー（Discord、Slackなど）では、
`Help` や `#help` のような名前をディレクトリキャッシュから解決します。キャッシュに
ない場合、プロバイダーが対応していればライブディレクトリ検索にフォールバックします。

## 共通フラグ

すべてのアクションで `--channel <name>`、`--account <id>`、`--json`、
`--dry-run`、`--verbose` を使用できます。宛先を取るアクションでは、
`-t, --target <dest>` も使用できます。

## SecretRefの解決

`openclaw message` はアクションを実行する前に、可能な限り狭いスコープで
チャネルのSecretRefを解決します。

- `--channel` が設定されている場合（または接頭辞付きターゲットから推論される場合）はチャネルスコープ
- `--account` も設定されている場合はアカウントスコープ
- どちらも設定されていない場合は設定済みの全チャネル

無関係なチャネルで未解決のSecretRefがあっても、対象を指定したアクションは
ブロックされません。選択したチャネル／アカウントのSecretRefが未解決の場合、
アクションは安全側に倒して失敗します。

## アクション

### コア

| アクション      | チャネル                                                                                                        | 必須                                                           | 備考                                                                                                                                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `send`          | Discord、Google Chat、iMessage、Matrix、Mattermost（Plugin）、Microsoft Teams、Signal、Slack、Telegram、WhatsApp | `--target` に加えて `--message`/`--media`/`--presentation` のいずれか | 以下の[送信](#send)を参照してください。                                                                                                                                                                                                                                                                |
| `poll`          | Discord、Matrix、Microsoft Teams、Telegram、WhatsApp                                                            | `--target`、`--poll-question`、`--poll-option`（繰り返し可）   | 以下の[投票](#poll)を参照してください。                                                                                                                                                                                                                                                                |
| `react`         | Discord、Matrix、Nextcloud Talk、Signal、Slack、Telegram、WhatsApp                                              | `--message-id`、`--target`                                     | `--emoji`、`--remove`（`--emoji` が必要です。対応している場合、自分のリアクションをすべて消去するには省略します。[リアクション](/ja-JP/tools/reactions)を参照）。WhatsApp: `--participant`、`--from-me`。Signalのグループリアクションには `--target-author` または `--target-author-uuid` が必要です。Nextcloud Talkではリアクションの追加のみ可能で、`--remove` はエラーになります。 |
| `reactions`     | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--message-id`、`--target`                                     | `--limit`。                                                                                                                                                                                                                                                                                             |
| `read`          | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--target`                                                     | `--limit`、`--message-id`、`--before`、`--after`。Discord: `--around`、`--include-thread`。Slack: `--message-id` は特定のタイムスタンプを読み取ります。正確なスレッド返信を指定するには `--thread-id` と組み合わせます。                                                                                     |
| `edit`          | Discord、Matrix、Microsoft Teams、Slack、Telegram                                                               | `--message-id`、`--message`、`--target`                        | Telegramのフォーラムスレッドでは `--thread-id` を使用します。                                                                                                                                                                                                                                          |
| `delete`        | Discord、Matrix、Microsoft Teams、Slack、Telegram                                                               | `--message-id`、`--target`                                     |                                                                                                                                                                                                                                                                                                        |
| `pin` / `unpin` | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--message-id`、`--target`                                     | `unpin` では `--pinned-message-id` も使用できます（Microsoft Teamsでは、チャットメッセージIDではなく、ピン留め／ピン留め一覧リソースのIDです）。                                                                                                                                                       |
| `pins`（一覧）  | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--target`                                                     | `--limit`。                                                                                                                                                                                                                                                                                             |
| `permissions`   | Discord、Matrix                                                                                                 | `--target`                                                     | Matrix: 暗号化が有効で、検証アクションが許可されている場合にのみ使用できます。                                                                                                                                                                                                                         |
| `search`        | Discord                                                                                                         | `--guild-id`、`--query`                                        | `--channel-id`、`--channel-ids`（繰り返し可）、`--author-id`、`--author-ids`（繰り返し可）、`--limit`。                                                                                                                                                                                                |
| `member info`   | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--user-id`                                                    | `--guild-id`（Discord）。                                                                                                                                                                                                                                                                               |

### 送信

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`: 画像／音声／動画／文書を添付します（ローカルパスまたは
  URL）。
- `--presentation <json>`: `text`、`context`、`divider`、
  `chart`、`table`、`buttons`、`select` ブロックを含む共通ペイロードです。
  各チャネルの機能に応じてレンダリングされます。
  [メッセージプレゼンテーション](/ja-JP/plugins/message-presentation)を参照してください。
- `--delivery <json>`: 汎用的な配信設定です。例: `{"pin":
true}`。チャネルが対応している場合、`--pin` はピン留め配信の短縮形です。
- `--reply-to <id>`、`--thread-id <id>`（Telegramのフォーラムトピック、Slackの
  スレッドタイムスタンプ。`--reply-to` と同じフィールドです）。
- `--force-document`（Telegram、WhatsApp）: チャネルによる圧縮を避けるため、
  画像／GIF／動画を文書として送信します。
- `--silent`（Telegram、Discord）: 通知なしで送信します。
- `--gif-playback`（WhatsAppのみ）: 動画メディアをGIF再生として扱います。

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Slackでは対応しているチャートブロックをネイティブにレンダリングします。
その他のチャネルでは、同じデータを読みやすいテキストとして受信します。

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"blocks":[{"type":"chart","chartType":"bar","title":"Quarterly revenue","categories":["Q1","Q2"],"series":[{"name":"Revenue","values":[120,145]}],"xLabel":"Quarter"}]}'
```

Slack は明示的なテーブルブロックもネイティブにレンダリングします。ほかのチャネルでは、キャプションとすべての行を決定的なテキストとして受信します。

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"title":"Pipeline report","blocks":[{"type":"table","caption":"Open pipeline","headers":["Account","Stage","ARR"],"rows":[["Acme","Won",125000],["Globex","Review",82000]],"rowHeaderColumnIndex":0}]}'
```

Telegram Mini App のボタンは `webApp`（従来の JSON 用として `web_app` も引き続き解析されます）を使用し、ユーザーとボット間のプライベートチャットでのみレンダリングされます。

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

- `--poll-option <choice>`：2～12 回繰り返します。
- `--poll-multi`：複数選択を許可します。
- Discord：`--poll-duration-hours`、`--silent`、`--message`。
- Telegram：`--poll-duration-seconds <n>`（5～600）、`--silent`、
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

### スレッド

- `thread create`：対応チャネルは Discord です。必須：`--thread-name`、`--target`
  （チャネル ID）。任意：`--message-id`、`--message`、`--auto-archive-min`。
- `thread list`：対応チャネルは Discord です。必須：`--guild-id`。任意：
  `--channel-id`、`--include-archived`、`--before`、`--limit`。
- `thread reply`：対応チャネルは Discord です。必須：`--target`（スレッド ID）、
  `--message`。任意：`--media`、`--reply-to`。

### 絵文字

- `emoji list`：Discord（`--guild-id`）、Slack（追加のフラグなし）。
- `emoji upload`：Discord。必須：`--guild-id`、`--emoji-name`、`--media`。
  任意：`--role-ids`（繰り返し指定可能）。

### ステッカー

- `sticker send`：Discord。必須：`--target`、`--sticker-id`（繰り返し指定可能）。
  任意：`--message`。
- `sticker upload`：Discord。必須：`--guild-id`、`--sticker-name`、
  `--sticker-desc`、`--sticker-tags`、`--media`。

### ロール、チャネル、ボイス、イベント（Discord）

- `role info`：`--guild-id`。
- `role add` / `role remove`：`--guild-id`、`--user-id`、`--role-id`。
- `channel info`：`--target`。
- `channel list`：`--guild-id`。
- `voice status`：`--guild-id`、`--user-id`。
- `event list`：`--guild-id`。
- `event create`：必須は `--guild-id`、`--event-name`、`--start-time`。
  任意は `--end-time`、`--desc`、`--channel-id`、`--location`、
  `--event-type`、`--image <url-or-path>`。

### モデレーション（Discord）

- `timeout`：`--guild-id`、`--user-id`。任意は `--duration-min` または
  `--until`（タイムアウトを解除するには両方とも省略）、`--reason`。
- `kick`：`--guild-id`、`--user-id`、`--reason`。
- `ban`：`--guild-id`、`--user-id`、`--delete-days`、`--reason`。

### ブロードキャスト

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

1 つのペイロードを複数のターゲットに送信します。`--targets` には、スペース区切りのリストを指定します。設定済みのすべてのプロバイダーを対象にするには、`--channel all` を使用します。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [エージェント送信](/ja-JP/tools/agent-send)
- [メッセージプレゼンテーション](/ja-JP/plugins/message-presentation)
