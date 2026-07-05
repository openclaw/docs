---
read_when:
    - メッセージCLIアクションの追加または変更
    - 送信チャネルの動作を変更する
summary: '`openclaw message` の CLI リファレンス（送信 + チャネルアクション）'
title: メッセージ
x-i18n:
    generated_at: "2026-07-05T11:12:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2148973c4b1900bd36c5675969e943db09b0b1d9adffd66c151113c7837023
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Discord、Google Chat、iMessage、Matrix、Mattermost (Plugin)、Microsoft Teams、
Signal、Slack、Telegram、WhatsApp 全体でメッセージとチャンネルアクションを送信するための
単一のアウトバウンドコマンドです。

```bash
openclaw message <subcommand> [flags]
```

## チャンネル選択

- 複数のチャンネルが設定されている場合、`--channel <name>` は必須です。
  ちょうど 1 つのチャンネルだけが設定されている場合、そのチャンネルがデフォルトになります。
- 値: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  (Mattermost には Plugin が必要です)。
- チャンネル接頭辞付きターゲット (例: `discord:channel:123`) は、明示的な `--channel` なしで
  所有元の Plugin に解決されます。

## ターゲット形式 (`-t, --target`)

| チャンネル        | 形式                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| Discord             | `channel:<id>`、`user:<id>`、`<@id>` メンション、または裸の数値 id (チャンネル id として扱われます)        |
| Google Chat         | `spaces/<spaceId>` または `users/<userId>`                                                                |
| iMessage            | ハンドル、`chat_id:<id>`、`chat_guid:<guid>`、または `chat_identifier:<id>`                                |
| Mattermost (Plugin) | `channel:<id>`、`user:<id>`、`@username`、または裸の id (チャンネルとして扱われます)                       |
| Matrix              | `@user:server`、`!room:server`、または `#alias:server`                                                     |
| Microsoft Teams     | `conversation:<id>` (`19:...@thread.tacv2`)、裸の会話 id、または `user:<aad-object-id>`                   |
| Signal              | `+E.164`、`group:<id>`、`uuid:<id>`、`username:<name>`/`u:<name>`、またはこれらに `signal:` を付けたもの   |
| Slack               | `channel:<id>` または `user:<id>` (裸の id はチャンネルとして扱われます)                                   |
| Telegram            | チャット id、`@username`、またはフォーラムトピックターゲット: `<chatId>:topic:<topicId>` (または `--thread-id <topicId>`) |
| WhatsApp            | E.164、グループ JID (`...@g.us`)、またはチャンネル/ニュースレター JID (`...@newsletter`)                  |

チャンネル名検索: ディレクトリを持つプロバイダー (Discord/Slack など) では、
`Help` や `#help` のような名前はディレクトリキャッシュを介して解決されます。
キャッシュミス時、そのプロバイダーが対応している場合はライブディレクトリ検索にフォールバックします。

## 共通フラグ

すべてのアクションは `--channel <name>`、`--account <id>`、`--json`、
`--dry-run`、`--verbose` を受け付けます。送信先を取るアクションは
`-t, --target <dest>` も受け付けます。

## SecretRef 解決

`openclaw message` は、アクションの実行前にチャンネル SecretRefs を解決します。
スコープは可能な限り狭くなります。

- `--channel` が設定されている場合 (または接頭辞付きターゲットから推論される場合) はチャンネルスコープ
- `--account` も設定されている場合はアカウントスコープ
- どちらも設定されていない場合は設定済みのすべてのチャンネル

無関係なチャンネル上の未解決の SecretRefs が、ターゲット指定されたアクションをブロックすることはありません。
選択されたチャンネル/アカウント上の未解決の SecretRef は、アクションを fail closed します。

## アクション

### コア

| アクション      | チャンネル                                                                                                      | 必須                                                           | 注記                                                                                                                                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `send`          | Discord、Google Chat、iMessage、Matrix、Mattermost (Plugin)、Microsoft Teams、Signal、Slack、Telegram、WhatsApp | `--target` と、`--message`/`--media`/`--presentation` のいずれか | 下の [送信](#send) を参照してください。                                                                                                                                                                                                                                                              |
| `poll`          | Discord、Matrix、Microsoft Teams、Telegram、WhatsApp                                                            | `--target`、`--poll-question`、`--poll-option` (繰り返し)      | 下の [投票](#poll) を参照してください。                                                                                                                                                                                                                                                              |
| `react`         | Discord、Google Chat、Matrix、Nextcloud Talk、Signal、Slack、Telegram、WhatsApp                                 | `--message-id`、`--target`                                    | `--emoji`、`--remove` (`--emoji` が必要です。対応チャンネルで自分のリアクションを消去するには省略します。[リアクション](/ja-JP/tools/reactions) を参照)。WhatsApp: `--participant`、`--from-me`。Signal グループリアクションには `--target-author` または `--target-author-uuid` が必要です。Nextcloud Talk はリアクションの追加のみ対応し、`--remove` はエラーになります。 |
| `reactions`     | Discord、Google Chat、Matrix、Microsoft Teams、Slack                                                            | `--message-id`、`--target`                                    | `--limit`。                                                                                                                                                                                                                                                                                           |
| `read`          | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--target`                                                     | `--limit`、`--message-id`、`--before`、`--after`。Discord: `--around`、`--include-thread`。Slack: `--message-id` は特定のタイムスタンプを読み取ります。正確なスレッド返信には `--thread-id` と組み合わせます。                                                                                       |
| `edit`          | Discord、Matrix、Microsoft Teams、Slack、Telegram                                                               | `--message-id`、`--message`、`--target`                       | Telegram フォーラムスレッドでは `--thread-id` を使用します。                                                                                                                                                                                                                                          |
| `delete`        | Discord、Matrix、Microsoft Teams、Slack、Telegram                                                               | `--message-id`、`--target`                                    |                                                                                                                                                                                                                                                                                                        |
| `pin` / `unpin` | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--message-id`、`--target`                                    | `unpin` は `--pinned-message-id` も受け付けます (Microsoft Teams: チャットメッセージ id ではなく、pin/list-pins リソース id)。                                                                                                                                                                       |
| `pins` (一覧)   | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--target`                                                     | `--limit`。                                                                                                                                                                                                                                                                                           |
| `permissions`   | Discord、Matrix                                                                                                 | `--target`                                                     | Matrix: 暗号化が有効で、検証アクションが許可されている場合のみ利用できます。                                                                                                                                                                                                                         |
| `search`        | Discord                                                                                                         | `--guild-id`、`--query`                                       | `--channel-id`、`--channel-ids` (繰り返し)、`--author-id`、`--author-ids` (繰り返し)、`--limit`。                                                                                                                                                                                                     |
| `member info`   | Discord、Matrix、Microsoft Teams、Slack                                                                         | `--user-id`                                                    | `--guild-id` (Discord)。                                                                                                                                                                                                                                                                              |

### 送信

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`: 画像/音声/動画/ドキュメントを添付します (ローカルパスまたは
  URL)。
- `--presentation <json>`: `text`、`context`、`divider`、
  `buttons`、`select` ブロックを含む共有ペイロードです。チャンネルの機能に応じてレンダリングされます。
  [メッセージプレゼンテーション](/ja-JP/plugins/message-presentation) を参照してください。
- `--delivery <json>`: 汎用の配信設定です。例: `{"pin":
true}`。チャンネルが対応している場合、`--pin` はピン留め配信の短縮形です。
- `--reply-to <id>`、`--thread-id <id>` (Telegram フォーラムトピック。Slack スレッド
  タイムスタンプで、`--reply-to` と同じフィールドです)。
- `--force-document` (Telegram、WhatsApp): チャンネルの圧縮を避けるため、
  画像/GIF/動画をドキュメントとして送信します。
- `--silent` (Telegram、Discord): 通知なしで送信します。
- `--gif-playback` (WhatsApp のみ): 動画メディアを GIF 再生として扱います。

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Telegram Mini App ボタンは `webApp` を使用し (`web_app` は従来の
JSON 向けに引き続き解析されます)、ユーザーとボット間のプライベートチャットでのみレンダリングされます。

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

- `--poll-option <choice>`: 2〜12 回繰り返します。
- `--poll-multi`: 複数選択を許可します。
- Discord: `--poll-duration-hours`、`--silent`、`--message`。
- Telegram: `--poll-duration-seconds <n>` (5〜600)、`--silent`、
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

- `thread create`: チャンネルは Discord。必須: `--thread-name`、`--target`
  (チャンネル ID)。任意: `--message-id`、`--message`、`--auto-archive-min`。
- `thread list`: チャンネルは Discord。必須: `--guild-id`。任意:
  `--channel-id`、`--include-archived`、`--before`、`--limit`。
- `thread reply`: チャンネルは Discord。必須: `--target` (スレッド ID)、
  `--message`。任意: `--media`、`--reply-to`。

### 絵文字

- `emoji list`: Discord (`--guild-id`)、Slack (追加フラグなし)。
- `emoji upload`: Discord。必須: `--guild-id`、`--emoji-name`、`--media`。
  任意: `--role-ids` (繰り返し)。

### ステッカー

- `sticker send`: Discord。必須: `--target`、`--sticker-id` (繰り返し)。
  任意: `--message`。
- `sticker upload`: Discord。必須: `--guild-id`、`--sticker-name`、
  `--sticker-desc`、`--sticker-tags`、`--media`。

### ロール、チャンネル、音声、イベント (Discord)

- `role info`: `--guild-id`。
- `role add` / `role remove`: `--guild-id`、`--user-id`、`--role-id`。
- `channel info`: `--target`。
- `channel list`: `--guild-id`。
- `voice status`: `--guild-id`、`--user-id`。
- `event list`: `--guild-id`。
- `event create`: 必須 `--guild-id`、`--event-name`、`--start-time`;
  任意 `--end-time`、`--desc`、`--channel-id`、`--location`、
  `--event-type`、`--image <url-or-path>`。

### モデレーション (Discord)

- `timeout`: `--guild-id`、`--user-id`; 任意 `--duration-min` または
  `--until` (タイムアウトを解除するには両方を省略)、`--reason`。
- `kick`: `--guild-id`、`--user-id`、`--reason`。
- `ban`: `--guild-id`、`--user-id`、`--delete-days`、`--reason`。

### ブロードキャスト

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

1 つのペイロードを複数のターゲットに送信します。`--targets` はスペース区切りの
リストを受け取ります。設定済みのすべてのプロバイダーを対象にするには `--channel all` を使用します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Agent 送信](/ja-JP/tools/agent-send)
- [メッセージ表示](/ja-JP/plugins/message-presentation)
