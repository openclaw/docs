---
read_when:
    - Slack のセットアップ、または Slack の socket/HTTP モードのデバッグ
summary: Slack のセットアップとランタイム動作（Socket Mode + HTTP Request URLs）
title: Slack
x-i18n:
    generated_at: "2026-04-25T13:42:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8d177cad1e795ecccf31cff486b9c8036bf91b22d122e8afbd9cfaf7635e4ea
    source_path: channels/slack.md
    workflow: 15
---

Slack アプリ連携を通じて DM とチャンネルの両方に本番対応しています。デフォルトモードは Socket Mode で、HTTP Request URLs もサポートされています。

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
        Slack アプリ設定で **[Create New App](https://api.slack.com/apps/new)** ボタンを押します。

        - **from a manifest** を選択し、アプリ用のワークスペースを選びます
        - 下記の[マニフェスト例](#manifest-and-scope-checklist)を貼り付け、そのまま作成を続けます
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

        環境変数によるフォールバック（デフォルトアカウントのみ）:

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

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="新しい Slack アプリを作成">
        Slack アプリ設定で **[Create New App](https://api.slack.com/apps/new)** ボタンを押します。

        - **from a manifest** を選択し、アプリ用のワークスペースを選びます
        - [マニフェスト例](#manifest-and-scope-checklist)を貼り付け、作成前に URL を更新します
        - リクエスト検証用に **Signing Secret** を保存します
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
        マルチアカウントの HTTP では一意の webhook パスを使ってください

        各アカウントに別々の `webhookPath`（デフォルトは `/slack/events`）を割り当て、登録が衝突しないようにしてください。
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

## マニフェストとスコープのチェックリスト

ベースとなる Slack アプリのマニフェストは Socket Mode と HTTP Request URLs で共通です。異なるのは `settings` ブロック（およびスラッシュコマンドの `url`）だけです。

ベースマニフェスト（Socket Mode デフォルト）:

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

**HTTP Request URLs モード**では、`settings` を HTTP 用バリアントに置き換え、各スラッシュコマンドに `url` を追加してください。公開 URL が必要です。

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

### 追加のマニフェスト設定

上記デフォルトを拡張するさまざまな機能を示します。

<AccordionGroup>
  <Accordion title="任意のネイティブスラッシュコマンド">

    単一の設定済みコマンドの代わりに、複数の[ネイティブスラッシュコマンド](#commands-and-slash-behavior)をニュアンス付きで使えます。

    - `/status` コマンドは予約済みのため、`/status` ではなく `/agentstatus` を使ってください。
    - 同時に利用可能なスラッシュコマンドは 25 個までです。

    既存の `features.slash_commands` セクションを、[利用可能なコマンド](/ja-JP/tools/slash-commands#command-list) のサブセットに置き換えてください。

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
        "description": "List providers/models",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
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
      <Tab title="HTTP Request URLs">
        上記 Socket Mode と同じ `slash_commands` リストを使い、各エントリに `"url": "https://gateway-host.example.com/slack/events"` を追加してください。例:

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
      // ...すべてのコマンドに同じ `url` 値を使って繰り返します
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="任意の作成者スコープ（書き込み操作）">
    送信メッセージでデフォルトの Slack アプリ identity の代わりにアクティブな agent identity（カスタムユーザー名とアイコン）を使いたい場合は、`chat:write.customize` bot スコープを追加してください。

    絵文字アイコンを使う場合、Slack では `:emoji_name:` 構文が必要です。

  </Accordion>
  <Accordion title="任意の user token スコープ（読み取り操作）">
    `channels.slack.userToken` を設定する場合、一般的な読み取りスコープは次のとおりです。

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read`（Slack 検索読み取りに依存する場合）

  </Accordion>
</AccordionGroup>

## トークンモデル

- Socket Mode では `botToken` + `appToken` が必要です。
- HTTP モードでは `botToken` + `signingSecret` が必要です。
- `botToken`、`appToken`、`signingSecret`、`userToken` はプレーンテキスト文字列または SecretRef オブジェクトを受け付けます。
- config のトークンは環境変数によるフォールバックより優先されます。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` の環境変数フォールバックはデフォルトアカウントにのみ適用されます。
- `userToken`（`xoxp-...`）は config 専用です（環境変数フォールバックなし）。デフォルトでは読み取り専用動作（`userTokenReadOnly: true`）になります。

ステータススナップショットの動作:

- Slack アカウント検査では、資格情報ごとの `*Source` および `*Status` フィールド（`botToken`、`appToken`、`signingSecret`、`userToken`）を追跡します。
- ステータスは `available`、`configured_unavailable`、または `missing` です。
- `configured_unavailable` は、そのアカウントが SecretRef または別のインラインではない secret ソース経由で設定されているものの、現在のコマンド/ランタイム経路では実際の値を解決できなかったことを意味します。
- HTTP モードでは `signingSecretStatus` が含まれます。Socket Mode では必要な組み合わせは `botTokenStatus` + `appTokenStatus` です。

<Tip>
操作やディレクトリ読み取りでは、設定されていれば user token を優先できます。書き込みでは bot token が引き続き優先されます。user token による書き込みは、`userTokenReadOnly: false` かつ bot token が利用できない場合にのみ許可されます。
</Tip>

## アクションとゲート

Slack アクションは `channels.slack.actions.*` によって制御されます。

現在の Slack ツールで利用可能なアクショングループ:

| グループ   | デフォルト |
| ---------- | ---------- |
| messages   | enabled    |
| reactions  | enabled    |
| pins       | enabled    |
| memberInfo | enabled    |
| emojiList  | enabled    |

現在の Slack メッセージアクションには `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info`、`emoji-list` が含まれます。`download-file` は受信ファイルプレースホルダーに表示される Slack file ID を受け取り、画像の場合は画像プレビューを、その他のファイル形式ではローカルファイルのメタデータを返します。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.slack.dmPolicy` は DM アクセスを制御します（旧: `channels.slack.dm.policy`）。

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

    マルチアカウント時の優先順位:

    - `channels.slack.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントは、自身の `allowFrom` が未設定の場合に `channels.slack.allowFrom` を継承します。
    - 名前付きアカウントは `channels.slack.accounts.default.allowFrom` を継承しません。

    DM でのペアリングには `openclaw pairing approve slack <code>` を使います。

  </Tab>

  <Tab title="チャンネルポリシー">
    `channels.slack.groupPolicy` はチャンネル処理を制御します。

    - `open`
    - `allowlist`
    - `disabled`

    チャンネルの許可リストは `channels.slack.channels` 配下にあり、安定したチャンネル ID を使うべきです。

    ランタイムに関する注意: `channels.slack` が完全に存在しない場合（環境変数のみのセットアップ）、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告を記録します（`channels.defaults.groupPolicy` が設定されていても同様です）。

    名前/ID 解決:

    - チャンネル許可リストのエントリと DM 許可リストのエントリは、トークンアクセスが許す場合に起動時に解決されます
    - 解決できないチャンネル名エントリは設定どおり保持されますが、デフォルトではルーティングで無視されます
    - 受信認可とチャンネルルーティングはデフォルトで ID 優先です。username/slug の直接一致には `channels.slack.dangerouslyAllowNameMatching: true` が必要です

  </Tab>

  <Tab title="メンションとチャンネルユーザー">
    チャンネルメッセージはデフォルトでメンションによってゲートされます。

    メンション元:

    - 明示的なアプリメンション（`<@botId>`）
    - メンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - bot への暗黙の返信スレッド動作（`thread.requireExplicitMention` が `true` の場合は無効）

    チャンネルごとの制御（`channels.slack.channels.<id>`。名前は起動時解決または `dangerouslyAllowNameMatching` 経由のみ）:

    - `requireMention`
    - `users`（許可リスト）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` のキー形式: `id:`、`e164:`、`username:`、`name:`、または `"*"` ワイルドカード
      （旧来の接頭辞なしキーも引き続き `id:` のみにマップされます）

  </Tab>
</Tabs>

## スレッド、セッション、返信タグ

- DM は `direct` として、チャンネルは `channel` として、MPIM は `group` としてルーティングされます。
- デフォルトの `session.dmScope=main` では、Slack DM は agent のメインセッションに集約されます。
- チャンネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- 該当する場合、スレッド返信はスレッドセッション接尾辞（`:thread:<threadTs>`）を作成できます。
- `channels.slack.thread.historyScope` のデフォルトは `thread`、`thread.inheritParent` のデフォルトは `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッドセッション開始時に取得する既存スレッドメッセージ数を制御します（デフォルト `20`。無効化するには `0` を設定）。
- `channels.slack.thread.requireExplicitMention`（デフォルト `false`）: `true` の場合、暗黙のスレッドメンションを抑制するため、bot がすでにそのスレッドに参加していても、bot はスレッド内の明示的な `@bot` メンションにのみ応答します。これを無効のままにすると、bot が参加しているスレッド内の返信は `requireMention` のゲートを迂回します。

返信スレッド制御:

- `channels.slack.replyToMode`: `off|first|all|batched`（デフォルト `off`）
- `channels.slack.replyToModeByChatType`: `direct|group|channel` ごとの設定
- direct チャット用の旧フォールバック: `channels.slack.dm.replyToMode`

手動返信タグがサポートされています。

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

注意: `replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含む **すべて** の Slack 返信スレッドを無効にします。これは Telegram と異なります。Telegram では `"off"` モードでも明示タグは引き続き尊重されますが、Slack スレッドではメッセージがチャンネルから隠れ、Telegram の返信はインラインのまま表示されます。

## 確認リアクション

`ackReaction` は、OpenClaw が受信メッセージを処理している間、確認用の絵文字を送信します。

解決順:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- agent identity の絵文字フォールバック（`agents.list[].identity.emoji`、なければ `"👀"`）

注意:

- Slack では shortcode が必要です（例: `"eyes"`）。
- Slack アカウント単位またはグローバルでリアクションを無効にするには `""` を使います。

## テキストストリーミング

`channels.slack.streaming` はライブプレビュー動作を制御します。

- `off`: ライブプレビューのストリーミングを無効化。
- `partial`（デフォルト）: プレビューテキストを最新の部分出力で置き換えます。
- `block`: チャンク化されたプレビュー更新を追加します。
- `progress`: 生成中は進捗ステータステキストを表示し、その後で最終テキストを送信します。
- `streaming.preview.toolProgress`: ドラフトプレビューが有効なとき、ツール/進捗更新を同じ編集済みプレビューメッセージに流します（デフォルト: `true`）。別々のツール/進捗メッセージを維持するには `false` を設定してください。

`channels.slack.streaming.nativeTransport` は、`channels.slack.streaming.mode` が `partial` のときの Slack ネイティブテキストストリーミングを制御します（デフォルト: `true`）。

- ネイティブテキストストリーミングと Slack assistant スレッドステータスを表示するには、返信スレッドが利用可能である必要があります。スレッド選択は引き続き `replyToMode` に従います。
- チャンネルおよびグループチャットのルートは、ネイティブストリーミングが使えない場合でも通常のドラフトプレビューを使えます。
- トップレベルの Slack DM はデフォルトでスレッド外のままなので、スレッド形式のプレビューは表示されません。そこで進捗を見せたい場合は、スレッド返信または `typingReaction` を使ってください。
- メディアおよび非テキストペイロードは通常配信にフォールバックします。
- メディア/エラーの最終メッセージは保留中のプレビュー編集をキャンセルします。条件を満たすテキスト/ブロックの最終メッセージは、その場でプレビューを編集できる場合にのみフラッシュされます。
- 返信途中でストリーミングに失敗した場合、OpenClaw は残りのペイロードについて通常配信にフォールバックします。

Slack ネイティブテキストストリーミングの代わりにドラフトプレビューを使うには:

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

旧キー:

- `channels.slack.streamMode`（`replace | status_final | append`）は `channels.slack.streaming.mode` に自動移行されます。
- boolean の `channels.slack.streaming` は `channels.slack.streaming.mode` と `channels.slack.streaming.nativeTransport` に自動移行されます。
- 旧 `channels.slack.nativeStreaming` は `channels.slack.streaming.nativeTransport` に自動移行されます。

## typing reaction フォールバック

`typingReaction` は、OpenClaw が返信を処理している間、受信した Slack メッセージに一時的なリアクションを追加し、実行が完了すると削除します。これは、デフォルトの「入力中...」ステータスインジケーターを使うスレッド返信の外で特に有用です。

解決順:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意:

- Slack では shortcode が必要です（例: `"hourglass_flowing_sand"`）。
- このリアクションはベストエフォートであり、返信または失敗パスの完了後に自動クリーンアップが試行されます。

## メディア、チャンク化、配信

<AccordionGroup>
  <Accordion title="受信添付ファイル">
    Slack のファイル添付は、Slack がホストするプライベート URL からダウンロードされ（トークン認証付きリクエストフロー）、取得に成功しサイズ制限内であればメディアストアに書き込まれます。ファイルプレースホルダーには Slack の `fileId` が含まれるため、agent は `download-file` で元のファイルを取得できます。

    ランタイムの受信サイズ上限は、`channels.slack.mediaMaxMb` で上書きされない限りデフォルトで `20MB` です。

  </Accordion>

  <Accordion title="送信テキストとファイル">
    - テキストチャンクは `channels.slack.textChunkLimit` を使います（デフォルト 4000）
    - `channels.slack.chunkMode="newline"` は段落優先の分割を有効にします
    - ファイル送信は Slack の upload API を使い、スレッド返信（`thread_ts`）を含めることができます
    - 送信メディア上限は、`channels.slack.mediaMaxMb` が設定されていればそれに従い、未設定ならチャネル送信はメディアパイプラインの MIME 種別デフォルトに従います

  </Accordion>

  <Accordion title="配信ターゲット">
    推奨される明示的ターゲット:

    - DM には `user:<id>`
    - チャンネルには `channel:<id>`

    Slack DM は、user ターゲットへ送信する際に Slack conversation API を通じて開かれます。

  </Accordion>
</AccordionGroup>

## コマンドとスラッシュ動作

Slack のスラッシュコマンドは、単一の設定済みコマンドとしても、複数のネイティブコマンドとしても表示できます。コマンドのデフォルトを変更するには `channels.slack.slashCommand` を設定してください。

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

ネイティブコマンドには、Slack アプリで[追加のマニフェスト設定](#additional-manifest-settings)が必要で、代わりに `channels.slack.commands.native: true` またはグローバル設定の `commands.native: true` で有効化されます。

- Slack ではネイティブコマンドの自動モードは **off** なので、`commands.native: "auto"` では Slack ネイティブコマンドは有効になりません。

```txt
/help
```

ネイティブ引数メニューは、選択したオプション値を送信する前に確認モーダルを表示する適応型レンダリング戦略を使います。

- 5 個までのオプション: ボタンブロック
- 6〜100 個のオプション: 静的セレクトメニュー
- 100 個を超えるオプション: interactivity options handler が利用可能な場合、非同期オプションフィルタリング付きの external select
- Slack の制限を超えた場合: エンコード済みオプション値はボタンにフォールバック

```txt
/think
```

スラッシュセッションは `agent:<agentId>:slack:slash:<userId>` のような分離キーを使い、コマンド実行は引き続き `CommandTargetSessionKey` を使ってターゲット会話セッションへルーティングされます。

## インタラクティブ返信

Slack は agent が作成したインタラクティブ返信コントロールをレンダリングできますが、この機能はデフォルトで無効です。

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

または、1 つの Slack アカウントに対してのみ有効化するには:

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

有効化すると、agent は Slack 専用の返信ディレクティブを出力できます。

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

これらのディレクティブは Slack Block Kit にコンパイルされ、クリックや選択は既存の Slack interaction event パスを通じて返送されます。

注意:

- これは Slack 固有の UI です。他のチャネルでは Slack Block Kit ディレクティブはそれぞれのボタンシステムに変換されません。
- インタラクティブなコールバック値は OpenClaw が生成した opaque token であり、agent が作成した生の値ではありません。
- 生成されたインタラクティブブロックが Slack Block Kit の制限を超える場合、OpenClaw は無効な blocks ペイロードを送る代わりに元のテキスト返信へフォールバックします。

## Slack での exec 承認

Slack は、Web UI やターミナルにフォールバックする代わりに、インタラクティブボタンと interaction を使うネイティブ承認クライアントとして動作できます。

- Exec 承認では、ネイティブな DM/チャンネルルーティングに `channels.slack.execApprovals.*` を使います。
- Plugin 承認でも、リクエストがすでに Slack に到達しており、承認 ID 種別が `plugin:` であれば、同じ Slack ネイティブボタン画面を通じて解決できます。
- 承認者の認可は引き続き強制されます。承認者として識別されたユーザーのみが Slack 経由でリクエストを承認または拒否できます。

これは他のチャネルと同じ共有承認ボタン画面を使います。Slack アプリ設定で `interactivity` を有効にすると、承認プロンプトは会話内に Block Kit ボタンとして直接表示されます。
それらのボタンが存在する場合、それが主要な承認 UX です。OpenClaw は、ツール結果でチャット承認が利用不可と示された場合、または手動承認のみが唯一の経路である場合にのみ、手動の `/approve` コマンドを含めるべきです。

設定パス:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（任意。可能であれば `commands.ownerAllowFrom` にフォールバック）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `agentFilter`、`sessionFilter`

Slack では、`enabled` が未設定または `"auto"` で、かつ少なくとも 1 人の承認者が解決されると、ネイティブ exec 承認が自動的に有効になります。Slack をネイティブ承認クライアントとして明示的に無効にするには `enabled: false` を設定してください。
承認者が解決される場合にネイティブ承認を強制的に有効にするには `enabled: true` を設定してください。

明示的な Slack exec 承認設定がない場合のデフォルト動作:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

承認者の上書き、フィルターの追加、または origin-chat 配信の有効化を行いたい場合にのみ、明示的な Slack ネイティブ設定が必要です。

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

共有の `approvals.exec` 転送は別機能です。exec 承認プロンプトも他のチャットや明示的な帯域外ターゲットにルーティングする必要がある場合にのみ使ってください。共有の `approvals.plugin` 転送も別機能です。Slack ネイティブボタンは、それらのリクエストがすでに Slack に届いている場合、引き続き plugin 承認を解決できます。

同一チャット内の `/approve` も、すでにコマンドをサポートしている Slack チャンネルおよび DM で動作します。完全な承認転送モデルについては [Exec approvals](/ja-JP/tools/exec-approvals) を参照してください。

## イベントと運用時の動作

- メッセージの編集/削除はシステムイベントにマップされます。
- スレッドのブロードキャスト（「Also send to channel」付きのスレッド返信）は通常のユーザーメッセージとして処理されます。
- リアクションの追加/削除イベントはシステムイベントにマップされます。
- メンバーの参加/退出、チャンネルの作成/名称変更、ピンの追加/削除イベントはシステムイベントにマップされます。
- `channel_id_changed` は、`configWrites` が有効な場合にチャンネル設定キーを移行できます。
- チャンネルトピック/目的のメタデータは信頼されないコンテキストとして扱われ、ルーティングコンテキストに注入されることがあります。
- スレッド開始メッセージと初期スレッド履歴コンテキストのシードは、該当する場合は設定済み送信者許可リストによってフィルタリングされます。
- Block action とモーダル interaction は、リッチなペイロードフィールドを持つ構造化された `Slack interaction: ...` システムイベントを出力します。
  - block action: 選択値、ラベル、picker 値、`workflow_*` メタデータ
  - モーダルの `view_submission` および `view_closed` イベント。ルーティング済みチャンネルメタデータとフォーム入力を含む

## 設定リファレンス

主要リファレンス: [Configuration reference - Slack](/ja-JP/gateway/config-channels#slack)。

<Accordion title="重要な Slack フィールド">

- mode/auth: `mode`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
- DM アクセス: `dm.enabled`、`dmPolicy`、`allowFrom`（旧: `dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
- 互換性トグル: `dangerouslyAllowNameMatching`（緊急用。必要な場合以外はオフのままにしてください）
- チャンネルアクセス: `groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`
- スレッド/履歴: `replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 配信: `textChunkLimit`、`chunkMode`、`mediaMaxMb`、`streaming`、`streaming.nativeTransport`、`streaming.preview.toolProgress`
- 運用/機能: `configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

</Accordion>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャンネルで返信がない">
    次の順に確認してください。

    - `groupPolicy`
    - チャンネル許可リスト（`channels.slack.channels`）
    - `requireMention`
    - チャンネルごとの `users` 許可リスト

    便利なコマンド:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM メッセージが無視される">
    次を確認してください。

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（または旧 `channels.slack.dm.policy`）
    - pairing 承認 / 許可リストエントリ
    - Slack Assistant DM イベント: `drop message_changed` に言及する詳細ログは通常、Slack がメッセージメタデータ内に復元可能な人間送信者のない編集済み Assistant スレッドイベントを送ったことを意味します

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode が接続しない">
    bot/app トークンと、Slack アプリ設定での Socket Mode 有効化を確認してください。

    `openclaw channels status --probe --json` に `botTokenStatus` または
    `appTokenStatus: "configured_unavailable"` が表示される場合、その Slack アカウントは
    設定されていますが、現在のランタイムでは SecretRef ベースの値を解決できませんでした。

  </Accordion>

  <Accordion title="HTTP mode でイベントを受信しない">
    次を確認してください。

    - signing secret
    - webhook パス
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - HTTP アカウントごとの一意な `webhookPath`

    アカウントスナップショットに `signingSecretStatus: "configured_unavailable"` が
    表示される場合、その HTTP アカウントは設定されていますが、現在のランタイムでは
    SecretRef ベースの signing secret を解決できませんでした。

  </Accordion>

  <Accordion title="ネイティブ/スラッシュコマンドが動作しない">
    意図していたものを確認してください。

    - ネイティブコマンドモード（`channels.slack.commands.native: true`）で、対応するスラッシュコマンドが Slack に登録されている
    - または単一スラッシュコマンドモード（`channels.slack.slashCommand.enabled: true`）

    また、`commands.useAccessGroups` とチャンネル/ユーザー許可リストも確認してください。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Slack ユーザーを Gateway にペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    チャンネルとグループ DM の動作。
  </Card>
  <Card title="チャネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージを agent にルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルとハードニング。
  </Card>
  <Card title="設定" icon="sliders" href="/ja-JP/gateway/configuration">
    config レイアウトと優先順位。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    コマンドカタログと動作。
  </Card>
</CardGroup>
