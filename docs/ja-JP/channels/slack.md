---
read_when:
    - Slack をセットアップしている場合、または Slack の socket/HTTP モードをデバッグしている場合
summary: Slack のセットアップとランタイム動作（Socket Mode + HTTP リクエスト URL）
title: Slack
x-i18n:
    generated_at: "2026-04-24T04:47:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 906a4fcf00a51f4a9b8410f982abe1f068687b5aa9847a4894f489e57fa9e4dd
    source_path: channels/slack.md
    workflow: 15
---

DM とチャネル向けに、Slack アプリ統合経由で本番運用可能です。デフォルトモードは Socket Mode で、HTTP リクエスト URL もサポートされています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Slack DM はデフォルトでペアリングモードです。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断と修復プレイブック。
  </Card>
</CardGroup>

## クイックセットアップ

<Tabs>
  <Tab title="Socket Mode（デフォルト）">
    <Steps>
      <Step title="新しい Slack アプリを作成">
        Slack アプリ設定で **[Create New App](https://api.slack.com/apps/new)** ボタンを押します:

        - **from a manifest** を選び、アプリ用のワークスペースを選択します
        - 下記の [manifest の例](#manifest-and-scope-checklist) を貼り付けて作成を続行します
        - `connections:write` を持つ **App-Level Token**（`xapp-...`）を生成します
        - アプリをインストールし、表示される **Bot Token**（`xoxb-...`）をコピーします
      </Step>

      <Step title="OpenClaw を設定">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        env フォールバック（デフォルトアカウントのみ）:

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Gateway を起動">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP リクエスト URL">
    <Steps>
      <Step title="新しい Slack アプリを作成">
        Slack アプリ設定で **[Create New App](https://api.slack.com/apps/new)** ボタンを押します:

        - **from a manifest** を選び、アプリ用のワークスペースを選択します
        - [manifest の例](#manifest-and-scope-checklist) を貼り付け、作成前に URL を更新します
        - リクエスト検証用の **Signing Secret** を保存します
        - アプリをインストールし、表示される **Bot Token**（`xoxb-...`）をコピーします

      </Step>

      <Step title="OpenClaw を設定">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

        <Note>
        マルチアカウント HTTP では一意の Webhook パスを使います

        登録が衝突しないよう、各アカウントに個別の `webhookPath`（デフォルトは `/slack/events`）を設定してください。
        </Note>

      </Step>

      <Step title="Gateway を起動">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Manifest とスコープのチェックリスト

ベースの Slack アプリ manifest は Socket Mode と HTTP リクエスト URL で共通です。異なるのは `settings` ブロック（およびスラッシュコマンドの `url`）だけです。

ベース manifest（Socket Mode デフォルト）:

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

**HTTP リクエスト URL モード**では、`settings` を HTTP 用のバリアントに置き換え、各スラッシュコマンドに `url` を追加します。公開 URL が必要です:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        /* Socket Mode と同じ */
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### 追加の manifest 設定

上記のデフォルトを拡張する各種機能を示します。

<AccordionGroup>
  <Accordion title="任意のネイティブスラッシュコマンド">

    1 つの設定済みコマンドの代わりに、ニュアンス付きで複数の [ネイティブスラッシュコマンド](#commands-and-slash-behavior) を使えます:

    - `/status` コマンドは予約済みなので、`/status` の代わりに `/agentstatus` を使ってください。
    - 同時に利用可能にできるスラッシュコマンドは 25 個までです。

    既存の `features.slash_commands` セクションを、[利用可能なコマンド](/ja-JP/tools/slash-commands#command-list) のサブセットで置き換えてください:

    <Tabs>
      <Tab title="Socket Mode（デフォルト）">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Reset the current session"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Stop the current run"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "List providers/models or add a model",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all] | add <provider> <modelId>"
      },
      {
        "command": "/help",
        "description": "Show the short help summary"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP リクエスト URL">
        Socket Mode 上記と同じ `slash_commands` リストを使い、各エントリに `"url": "https://gateway-host.example.com/slack/events"` を追加してください。例:

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Show the short help summary",
        "url": "https://gateway-host.example.com/slack/events"
      }
      // ...同じ `url` 値で全コマンドに繰り返します
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="任意の作成者スコープ（書き込み操作）">
    送信メッセージでデフォルトの Slack アプリ ID ではなく、アクティブなエージェント ID（カスタムのユーザー名とアイコン）を使いたい場合は、`chat:write.customize` ボットスコープを追加してください。

    絵文字アイコンを使う場合、Slack では `:emoji_name:` 構文が必要です。

  </Accordion>
  <Accordion title="任意の user-token スコープ（読み取り操作）">
    `channels.slack.userToken` を設定する場合、一般的な読み取りスコープは次のとおりです:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - Slack 検索読み取りに依存する場合は `search:read`

  </Accordion>
</AccordionGroup>

## トークンモデル

- Socket Mode には `botToken` + `appToken` が必要です。
- HTTP モードには `botToken` + `signingSecret` が必要です。
- `botToken`、`appToken`、`signingSecret`、`userToken` は平文文字列または SecretRef オブジェクトを受け付けます。
- 設定内トークンは env フォールバックより優先されます。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` の env フォールバックはデフォルトアカウントにのみ適用されます。
- `userToken`（`xoxp-...`）は設定専用です（env フォールバックなし）で、デフォルトでは読み取り専用動作（`userTokenReadOnly: true`）になります。

ステータススナップショットの動作:

- Slack アカウント検査では、認証情報ごとの `*Source` と `*Status` フィールド（`botToken`、`appToken`、`signingSecret`、`userToken`）を追跡します。
- ステータスは `available`、`configured_unavailable`、または `missing` です。
- `configured_unavailable` は、そのアカウントが SecretRef または別のインラインではないシークレットソース経由で設定されているが、現在のコマンド/ランタイムパスでは実際の値を解決できなかったことを意味します。
- HTTP モードでは `signingSecretStatus` が含まれます。Socket Mode では必要な組み合わせは `botTokenStatus` + `appTokenStatus` です。

<Tip>
アクション/ディレクトリ読み取りでは、設定されていれば user token が優先される場合があります。書き込みでは bot token が引き続き優先されます。user-token での書き込みが許可されるのは、`userTokenReadOnly: false` かつ bot token が利用できない場合のみです。
</Tip>

## アクションとゲート

Slack アクションは `channels.slack.actions.*` で制御されます。

現在の Slack ツールで利用可能なアクショングループ:

| グループ   | デフォルト |
| ---------- | ---------- |
| messages   | enabled    |
| reactions  | enabled    |
| pins       | enabled    |
| memberInfo | enabled    |
| emojiList  | enabled    |

現在の Slack メッセージアクションには `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info`、`emoji-list` が含まれます。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.slack.dmPolicy` は DM アクセスを制御します（旧: `channels.slack.dm.policy`）:

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.slack.allowFrom` に `"*"` を含める必要があります。旧: `channels.slack.dm.allowFrom`）
    - `disabled`

    DM フラグ:

    - `dm.enabled`（デフォルト true）
    - `channels.slack.allowFrom`（推奨）
    - `dm.allowFrom`（旧）
    - `dm.groupEnabled`（グループ DM のデフォルトは false）
    - `dm.groupChannels`（任意の MPIM 許可リスト）

    マルチアカウントの優先順位:

    - `channels.slack.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントは、自身の `allowFrom` が未設定の場合、`channels.slack.allowFrom` を継承します。
    - 名前付きアカウントは `channels.slack.accounts.default.allowFrom` を継承しません。

    DM でのペアリングには `openclaw pairing approve slack <code>` を使います。

  </Tab>

  <Tab title="チャネルポリシー">
    `channels.slack.groupPolicy` はチャネル処理を制御します:

    - `open`
    - `allowlist`
    - `disabled`

    チャネル許可リストは `channels.slack.channels` 配下にあり、安定したチャネル ID を使う必要があります。

    ランタイムに関する注記: `channels.slack` が完全に欠落している場合（env のみのセットアップ）、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに出力します（`channels.defaults.groupPolicy` が設定されていても同様です）。

    名前/ID 解決:

    - チャネル許可リストエントリと DM 許可リストエントリは、トークンアクセスが許す場合に起動時に解決されます
    - 解決されないチャネル名エントリは設定どおり保持されますが、デフォルトではルーティングで無視されます
    - 受信認可とチャネルルーティングはデフォルトで ID 優先です。ユーザー名/スラッグの直接一致には `channels.slack.dangerouslyAllowNameMatching: true` が必要です

  </Tab>

  <Tab title="メンションとチャネルユーザー">
    チャネルメッセージはデフォルトでメンションゲートされます。

    メンションソース:

    - 明示的なアプリメンション（`<@botId>`）
    - メンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - 暗黙の bot 返信先スレッド動作（`thread.requireExplicitMention` が `true` の場合は無効）

    チャネルごとの制御（`channels.slack.channels.<id>`。名前は起動時解決または `dangerouslyAllowNameMatching` 経由のみ）:

    - `requireMention`
    - `users`（許可リスト）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` のキー形式: `id:`、`e164:`、`username:`、`name:`、または `"*"` ワイルドカード
      （旧来のプレフィックスなしキーも引き続き `id:` のみにマップされます）

  </Tab>
</Tabs>

## スレッド、セッション、返信タグ

- DM は `direct`、チャネルは `channel`、MPIM は `group` としてルーティングされます。
- デフォルトの `session.dmScope=main` では、Slack DM はエージェントのメインセッションに集約されます。
- チャネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- スレッド返信は、該当する場合にスレッドセッション接尾辞（`:thread:<threadTs>`）を作成できます。
- `channels.slack.thread.historyScope` のデフォルトは `thread`、`thread.inheritParent` のデフォルトは `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッドセッション開始時に取得する既存スレッドメッセージ数を制御します（デフォルト `20`。無効化するには `0` を設定）。
- `channels.slack.thread.requireExplicitMention`（デフォルト `false`）: `true` の場合、暗黙のスレッドメンションを抑制するため、ボットがすでにそのスレッドに参加していても、スレッド内では明示的な `@bot` メンションにのみ応答します。これがない場合、ボット参加済みスレッド内の返信は `requireMention` ゲートをバイパスします。

返信スレッド制御:

- `channels.slack.replyToMode`: `off|first|all|batched`（デフォルト `off`）
- `channels.slack.replyToModeByChatType`: `direct|group|channel` ごと
- ダイレクトチャット向けの旧来フォールバック: `channels.slack.dm.replyToMode`

手動返信タグがサポートされています:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

注記: `replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含む **すべて** の Slack 返信スレッドを無効化します。これは Telegram と異なります。Telegram では `"off"` モードでも明示タグは引き続き尊重されますが、Slack スレッドはメッセージをチャネルから隠す一方、Telegram の返信はインラインで表示されたままです。

## 確認リアクション

`ackReaction` は、OpenClaw が受信メッセージを処理している間、確認用絵文字を送信します。

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- エージェント ID の絵文字フォールバック（`agents.list[].identity.emoji`、なければ `"👀"`）

注記:

- Slack ではショートコード（例: `"eyes"`）が必要です。
- Slack アカウント単位またはグローバルでリアクションを無効にするには `""` を使います。

## テキストストリーミング

`channels.slack.streaming` はライブプレビュー動作を制御します:

- `off`: ライブプレビューストリーミングを無効化。
- `partial`（デフォルト）: プレビューテキストを最新の部分出力で置き換えます。
- `block`: 分割されたプレビュー更新を追加します。
- `progress`: 生成中は進行状況テキストを表示し、その後最終テキストを送信します。
- `streaming.preview.toolProgress`: 下書きプレビューが有効な場合、ツール/進行状況更新を同じ編集済みプレビューメッセージに流し込みます（デフォルト: `true`）。個別のツール/進行状況メッセージを維持するには `false` に設定してください。

`channels.slack.streaming.nativeTransport` は、`channels.slack.streaming.mode` が `partial` のときの Slack ネイティブテキストストリーミングを制御します（デフォルト: `true`）。

- Slack ネイティブテキストストリーミングと Slack assistant スレッドステータスを表示するには、返信スレッドが利用可能である必要があります。スレッド選択は引き続き `replyToMode` に従います。
- ネイティブストリーミングが利用できない場合でも、チャネルおよびグループチャットのルートでは通常の下書きプレビューを使用できます。
- トップレベルの Slack DM はデフォルトでスレッド外のままなので、スレッド形式のプレビューは表示されません。そこで進行状況を見せたい場合は、スレッド返信または `typingReaction` を使ってください。
- メディアおよび非テキストペイロードは通常の配信にフォールバックします。
- メディア/エラーの最終出力は保留中のプレビュー編集をキャンセルします。対象となるテキスト/ブロックの最終出力は、プレビューをその場で編集できる場合にのみフラッシュされます。
- ストリーミングが返信途中で失敗した場合、OpenClaw は残りのペイロードについて通常配信にフォールバックします。

Slack ネイティブテキストストリーミングの代わりに下書きプレビューを使うには:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

旧来キー:

- `channels.slack.streamMode`（`replace | status_final | append`）は自動的に `channels.slack.streaming.mode` へ移行されます。
- boolean の `channels.slack.streaming` は自動的に `channels.slack.streaming.mode` と `channels.slack.streaming.nativeTransport` へ移行されます。
- 旧来の `channels.slack.nativeStreaming` は自動的に `channels.slack.streaming.nativeTransport` へ移行されます。

## タイピングリアクションのフォールバック

`typingReaction` は、OpenClaw が返信を処理している間、受信した Slack メッセージに一時的なリアクションを追加し、実行が完了すると削除します。これは、デフォルトの「is typing...」ステータスインジケーターを使うスレッド返信以外で特に有用です。

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注記:

- Slack ではショートコード（例: `"hourglass_flowing_sand"`）が必要です。
- このリアクションはベストエフォートであり、返信または失敗パスの完了後に自動クリーンアップが試行されます。

## メディア、チャンク分割、配信

<AccordionGroup>
  <Accordion title="受信添付ファイル">
    Slack のファイル添付は、Slack ホストのプライベート URL（トークン認証付きリクエストフロー）からダウンロードされ、取得成功かつサイズ制限内であればメディアストアに書き込まれます。

    ランタイムの受信サイズ上限は、`channels.slack.mediaMaxMb` で上書きしない限りデフォルトで `20MB` です。

  </Accordion>

  <Accordion title="送信テキストとファイル">
    - テキストチャンクには `channels.slack.textChunkLimit`（デフォルト 4000）を使います
    - `channels.slack.chunkMode="newline"` で段落優先分割が有効になります
    - ファイル送信では Slack の upload API を使い、スレッド返信（`thread_ts`）も含められます
    - 送信メディア上限は、設定されていれば `channels.slack.mediaMaxMb` に従い、そうでなければチャネル送信はメディアパイプラインの MIME 種別デフォルトに従います
  </Accordion>

  <Accordion title="配信ターゲット">
    推奨される明示ターゲット:

    - DM には `user:<id>`
    - チャネルには `channel:<id>`

    Slack DM は、ユーザーターゲットへ送信するときに Slack conversation API 経由で開かれます。

  </Accordion>
</AccordionGroup>

## コマンドとスラッシュ動作

スラッシュコマンドは、1 つの設定済みコマンドまたは複数のネイティブコマンドとして Slack に表示されます。コマンドのデフォルトを変更するには `channels.slack.slashCommand` を設定します:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

ネイティブコマンドには、Slack アプリ内で [追加の manifest 設定](#additional-manifest-settings) が必要で、代わりに `channels.slack.commands.native: true` またはグローバル設定内の `commands.native: true` で有効化します。

- Slack ではネイティブコマンドの自動モードは **off** なので、`commands.native: "auto"` では Slack ネイティブコマンドは有効になりません。

```txt
/help
```

ネイティブ引数メニューは、選択されたオプション値を送信する前に確認モーダルを表示する適応型レンダリング戦略を使います:

- 最大 5 個のオプション: ボタンブロック
- 6〜100 個のオプション: 静的セレクトメニュー
- 100 個を超えるオプション: interactivity オプションハンドラが利用可能な場合は、非同期オプションフィルタ付き external select
- Slack 制限超過時: エンコード済みオプション値はボタンへフォールバック

```txt
/think
```

スラッシュセッションは `agent:<agentId>:slack:slash:<userId>` のような分離キーを使い、それでも `CommandTargetSessionKey` を用いてコマンド実行を対象会話セッションへルーティングします。

## インタラクティブ返信

Slack はエージェント作成のインタラクティブ返信コントロールをレンダリングできますが、この機能はデフォルトで無効です。

グローバルに有効化するには:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

または 1 つの Slack アカウントだけで有効化するには:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

有効化されると、エージェントは Slack 専用の返信ディレクティブを出力できます:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

これらのディレクティブは Slack Block Kit にコンパイルされ、クリックまたは選択は既存の Slack interaction イベントパスを通じて戻されます。

注記:

- これは Slack 固有の UI です。他のチャネルは Slack Block Kit ディレクティブを独自のボタンシステムへ変換しません。
- インタラクティブコールバック値は、エージェント作成の生値ではなく、OpenClaw が生成する不透明なトークンです。
- 生成されたインタラクティブブロックが Slack Block Kit の制限を超える場合、OpenClaw は無効な blocks ペイロードを送る代わりに元のテキスト返信へフォールバックします。

## Slack での exec 承認

Slack は、Web UI やターミナルへフォールバックする代わりに、インタラクティブボタンと interaction を備えたネイティブ承認クライアントとして機能できます。

- Exec 承認は、ネイティブ DM/チャネルルーティングのために `channels.slack.execApprovals.*` を使います。
- Plugin 承認も、リクエストがすでに Slack に届いていて承認 ID 種別が `plugin:` である場合、同じ Slack ネイティブボタン面を通じて解決できます。
- 承認者認可は引き続き強制されます。承認者として識別されたユーザーだけが、Slack 経由でリクエストを承認または拒否できます。

これは他チャネルと同じ共有承認ボタン面を使います。Slack アプリ設定で `interactivity` が有効な場合、承認プロンプトは会話内に直接 Block Kit ボタンとしてレンダリングされます。
それらのボタンが存在する場合、それが主要な承認 UX になります。OpenClaw は、
ツール結果がチャット承認を利用不可と示す場合、または手動承認だけが唯一の経路である場合にのみ、手動の `/approve` コマンドを含めるべきです。

設定パス:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（任意。可能な場合は `commands.ownerAllowFrom` にフォールバック）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `agentFilter`、`sessionFilter`

Slack は、`enabled` が未設定または `"auto"` で、かつ少なくとも 1 人の
承認者が解決される場合、ネイティブ exec 承認を自動的に有効化します。Slack を
ネイティブ承認クライアントとして明示的に無効にするには `enabled: false` を
設定してください。承認者が解決されるときにネイティブ承認を強制的に有効にするには
`enabled: true` を設定してください。

明示的な Slack exec 承認設定がない場合のデフォルト動作:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

承認者の上書き、フィルタの追加、または発信元チャット配信への切り替えを行いたい
場合にのみ、明示的な Slack ネイティブ設定が必要です:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

共有 `approvals.exec` 転送は別です。exec 承認プロンプトを他のチャットまたは
明示的な帯域外ターゲットにもルーティングする必要がある場合にのみ使ってください。
共有 `approvals.plugin` 転送も別です。Slack ネイティブボタンは、それらの
リクエストがすでに Slack に届いている場合、引き続き Plugin 承認を解決できます。

同一チャットの `/approve` も、すでにコマンドをサポートしている Slack チャネルおよび
DM で動作します。完全な承認転送モデルについては [Exec approvals](/ja-JP/tools/exec-approvals)
を参照してください。

## イベントと運用動作

- メッセージの編集/削除/スレッドブロードキャストはシステムイベントにマップされます。
- リアクション追加/削除イベントはシステムイベントにマップされます。
- メンバーの参加/退出、チャネル作成/名称変更、ピン追加/削除イベントはシステムイベントにマップされます。
- `channel_id_changed` は、`configWrites` が有効な場合にチャネル設定キーを移行できます。
- チャネルトピック/目的のメタデータは信頼されないコンテキストとして扱われ、ルーティングコンテキストに注入されることがあります。
- スレッド開始メッセージと初期スレッド履歴コンテキストのシードは、該当する場合、設定された送信者許可リストによってフィルタされます。
- ブロックアクションとモーダル interaction は、豊富なペイロードフィールドを持つ構造化 `Slack interaction: ...` システムイベントを出力します:
  - block actions: 選択値、ラベル、picker 値、`workflow_*` メタデータ
  - ルーティングされたチャネルメタデータとフォーム入力を含むモーダル `view_submission` および `view_closed` イベント

## 設定リファレンス

主要リファレンス: [Configuration reference - Slack](/ja-JP/gateway/config-channels#slack)。

<Accordion title="重要な Slack フィールド">

- モード/認証: `mode`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
- DM アクセス: `dm.enabled`、`dmPolicy`、`allowFrom`（旧: `dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
- 互換性トグル: `dangerouslyAllowNameMatching`（緊急用。必要な場合を除き無効のままにしてください）
- チャネルアクセス: `groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`
- スレッド/履歴: `replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 配信: `textChunkLimit`、`chunkMode`、`mediaMaxMb`、`streaming`、`streaming.nativeTransport`、`streaming.preview.toolProgress`
- 運用/機能: `configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

</Accordion>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャネルで返信がない">
    次の順で確認してください:

    - `groupPolicy`
    - チャネル許可リスト（`channels.slack.channels`）
    - `requireMention`
    - チャネルごとの `users` 許可リスト

    便利なコマンド:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM メッセージが無視される">
    次を確認してください:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（または旧 `channels.slack.dm.policy`）
    - ペアリング承認 / 許可リストエントリ

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode が接続しない">
    Bot トークンと App トークン、および Slack アプリ設定での Socket Mode 有効化を確認してください。

    `openclaw channels status --probe --json` で `botTokenStatus` または
    `appTokenStatus: "configured_unavailable"` が表示される場合、その Slack
    アカウントは設定されていますが、現在のランタイムでは SecretRef ベースの値を
    解決できませんでした。

  </Accordion>

  <Accordion title="HTTP mode でイベントを受信しない">
    次を確認してください:

    - signing secret
    - webhook path
    - Slack Request URL（Events + Interactivity + Slash Commands）
    - HTTP アカウントごとの一意な `webhookPath`

    アカウントスナップショットに `signingSecretStatus: "configured_unavailable"` が
    表示される場合、その HTTP アカウントは設定されていますが、現在のランタイムでは
    SecretRef ベースの signing secret を解決できませんでした。

  </Accordion>

  <Accordion title="ネイティブ/スラッシュコマンドが反応しない">
    意図したものが次のどちらかを確認してください:

    - ネイティブコマンドモード（`channels.slack.commands.native: true`）で、Slack に一致するスラッシュコマンドが登録されている
    - または単一スラッシュコマンドモード（`channels.slack.slashCommand.enabled: true`）

    さらに `commands.useAccessGroups` とチャネル/ユーザー許可リストも確認してください。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Slack ユーザーを gateway にペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    チャネルおよびグループ DM の動作。
  </Card>
  <Card title="チャネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントへルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルとハードニング。
  </Card>
  <Card title="設定" icon="sliders" href="/ja-JP/gateway/configuration">
    設定レイアウトと優先順位。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    コマンドカタログと動作。
  </Card>
</CardGroup>
