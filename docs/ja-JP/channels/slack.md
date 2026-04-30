---
read_when:
    - Slack の設定または Slack のソケット/HTTP モードのデバッグ
summary: Slack のセットアップとランタイム動作（ソケットモード + HTTP リクエスト URL）
title: Slack
x-i18n:
    generated_at: "2026-04-30T05:00:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08024bd947ddeb00a1ab3aaa3864cf31817303bbc0523902acdc539fc662e127
    source_path: channels/slack.md
    workflow: 16
---

Slack アプリ連携により、DM とチャンネルで本番運用可能です。デフォルトモードはソケットモードです。HTTP リクエスト URL もサポートされています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Slack DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    複数チャンネルにまたがる診断と修復プレイブック。
  </Card>
</CardGroup>

## クイックセットアップ

<Tabs>
  <Tab title="ソケットモード（デフォルト）">
    <Steps>
      <Step title="新しい Slack アプリを作成する">
        Slack アプリ設定で **[新しいアプリを作成](https://api.slack.com/apps/new)** ボタンを押します。

        - **マニフェストから**を選択し、アプリのワークスペースを選択する
        - 下の[サンプルマニフェスト](#manifest-and-scope-checklist)を貼り付け、続行して作成する
        - `connections:write` を持つ**アプリレベルトークン**（`xapp-...`）を生成する
        - アプリをインストールし、表示された**Bot トークン**（`xoxb-...`）をコピーする

      </Step>

      <Step title="OpenClaw を設定する">

        推奨される SecretRef 設定:

```bash
export SLACK_APP_TOKEN=xapp-...
export SLACK_BOT_TOKEN=xoxb-...
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        環境変数フォールバック（デフォルトアカウントのみ）:

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Gateway を起動する">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP リクエスト URL">
    <Steps>
      <Step title="新しい Slack アプリを作成する">
        Slack アプリ設定で **[新しいアプリを作成](https://api.slack.com/apps/new)** ボタンを押します。

        - **マニフェストから**を選択し、アプリのワークスペースを選択する
        - [サンプルマニフェスト](#manifest-and-scope-checklist)を貼り付け、作成前に URL を更新する
        - リクエスト検証用に**署名シークレット**を保存する
        - アプリをインストールし、表示された**Bot トークン**（`xoxb-...`）をコピーする

      </Step>

      <Step title="OpenClaw を設定する">

        推奨される SecretRef 設定:

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        複数アカウントの HTTP には一意の Webhook パスを使用する

        登録が衝突しないように、各アカウントに個別の `webhookPath`（デフォルトは `/slack/events`）を指定します。
        </Note>

      </Step>

      <Step title="Gateway を起動する">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## ソケットモードのトランスポート調整

OpenClaw は、ソケットモードの Slack SDK クライアントの pong タイムアウトをデフォルトで 15 秒に設定します。ワークスペースまたはホスト固有の調整が必要な場合にのみ、トランスポート設定を上書きしてください。

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

これは、Slack websocket の pong/server-ping タイムアウトを記録するソケットモードのワークスペース、またはイベントループの枯渇が既知のホストで実行する場合にのみ使用してください。`clientPingTimeout` は SDK がクライアント ping を送信した後の pong 待機時間です。`serverPingTimeout` は Slack サーバー ping の待機時間です。アプリメッセージとイベントはアプリケーション状態のままであり、トランスポートの生存性シグナルではありません。

## マニフェストとスコープのチェックリスト

基本の Slack アプリマニフェストは、ソケットモードと HTTP リクエスト URL で同じです。異なるのは `settings` ブロック（およびスラッシュコマンドの `url`）だけです。

基本マニフェスト（ソケットモードのデフォルト）:

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

**HTTP リクエスト URL モード**では、`settings` を HTTP バリアントに置き換え、各スラッシュコマンドに `url` を追加します。公開 URL が必要です。

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
        /* same as Socket Mode */
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

上記のデフォルトを拡張する別の機能を公開します。

<AccordionGroup>
  <Accordion title="任意のネイティブスラッシュコマンド">

    単一の設定済みコマンドの代わりに、ニュアンスを持たせて複数の[ネイティブスラッシュコマンド](#commands-and-slash-behavior)を使用できます。

    - `/status` コマンドは予約されているため、`/status` の代わりに `/agentstatus` を使用します。
    - 一度に利用可能にできるスラッシュコマンドは 25 個までです。

    既存の `features.slash_commands` セクションを、[利用可能なコマンド](/ja-JP/tools/slash-commands#command-list)のサブセットに置き換えます。

    <Tabs>
      <Tab title="ソケットモード（デフォルト）">

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
      <Tab title="HTTP リクエスト URL">
        上記のソケットモードと同じ `slash_commands` リストを使用し、すべてのエントリに `"url": "https://gateway-host.example.com/slack/events"` を追加します。例:

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
      // ...repeat for every command with the same `url` value
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="任意の作成者スコープ（書き込み操作）">
    送信メッセージでデフォルトの Slack アプリ ID の代わりにアクティブなエージェント ID（カスタムユーザー名とアイコン）を使用したい場合は、`chat:write.customize` Bot スコープを追加します。

    絵文字アイコンを使用する場合、Slack は `:emoji_name:` 構文を想定します。

  </Accordion>
  <Accordion title="任意のユーザートークンスコープ（読み取り操作）">
    `channels.slack.userToken` を設定する場合、一般的な読み取りスコープは次のとおりです。

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read`（Slack 検索の読み取りに依存する場合）

  </Accordion>
</AccordionGroup>

## トークンモデル

- `botToken` + `appToken` は Socket Mode に必要です。
- HTTP モードには `botToken` + `signingSecret` が必要です。
- `botToken`、`appToken`、`signingSecret`、`userToken` は、プレーンテキスト文字列または SecretRef オブジェクトを受け付けます。
- 設定トークンは env フォールバックを上書きします。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env フォールバックはデフォルトアカウントにのみ適用されます。
- `userToken` (`xoxp-...`) は設定のみです (env フォールバックなし)。既定では読み取り専用動作 (`userTokenReadOnly: true`) になります。

ステータススナップショットの動作:

- Slack アカウント検査では、資格情報ごとの `*Source` フィールドと `*Status` フィールド (`botToken`、`appToken`、`signingSecret`、`userToken`) を追跡します。
- ステータスは `available`、`configured_unavailable`、または `missing` です。
- `configured_unavailable` は、アカウントが SecretRef または別の非インライン secret ソースを通じて設定されているものの、現在のコマンド/ランタイムパスでは実際の値を解決できなかったことを意味します。
- HTTP モードでは `signingSecretStatus` が含まれます。Socket Mode では、必要なペアは `botTokenStatus` + `appTokenStatus` です。

<Tip>
アクション/ディレクトリ読み取りでは、設定されている場合にユーザートークンを優先できます。書き込みでは、引き続きボットトークンが優先されます。ユーザートークンによる書き込みは、`userTokenReadOnly: false` で、かつボットトークンが利用できない場合にのみ許可されます。
</Tip>

## アクションとゲート

Slack アクションは `channels.slack.actions.*` で制御されます。

現在の Slack ツールで利用できるアクショングループ:

| グループ      | 既定 |
| ---------- | ------- |
| messages   | 有効 |
| reactions  | 有効 |
| pins       | 有効 |
| memberInfo | 有効 |
| emojiList  | 有効 |

現在の Slack メッセージアクションには、`send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info`、`emoji-list` が含まれます。`download-file` はインバウンドファイルプレースホルダーに表示される Slack ファイル ID を受け付け、画像の場合は画像プレビューを、その他のファイル種別の場合はローカルファイルメタデータを返します。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.slack.dmPolicy` は DM アクセスを制御します。`channels.slack.allowFrom` は正式な DM 許可リストです。

    - `pairing` (既定)
    - `allowlist`
    - `open` (`channels.slack.allowFrom` に `"*"` が含まれている必要があります)
    - `disabled`

    DM フラグ:

    - `dm.enabled` (既定は true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (レガシー)
    - `dm.groupEnabled` (グループ DM の既定は false)
    - `dm.groupChannels` (任意の MPIM 許可リスト)

    マルチアカウントの優先順位:

    - `channels.slack.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントは、自身の `allowFrom` が未設定の場合に `channels.slack.allowFrom` を継承します。
    - 名前付きアカウントは `channels.slack.accounts.default.allowFrom` を継承しません。

    レガシーの `channels.slack.dm.policy` と `channels.slack.dm.allowFrom` は互換性のために引き続き読み取られます。`openclaw doctor --fix` は、アクセスを変更せずに実行できる場合、それらを `dmPolicy` と `allowFrom` に移行します。

    DM でのペアリングには `openclaw pairing approve slack <code>` を使用します。

  </Tab>

  <Tab title="チャンネルポリシー">
    `channels.slack.groupPolicy` はチャンネル処理を制御します。

    - `open`
    - `allowlist`
    - `disabled`

    チャンネル許可リストは `channels.slack.channels` 配下に置き、設定キーには **安定した Slack チャンネル ID** (例: `C12345678`) を使用する必要があります。

    ランタイムメモ: `channels.slack` が完全に存在しない場合 (env のみのセットアップ)、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに記録します (`channels.defaults.groupPolicy` が設定されている場合でも同様です)。

    名前/ID 解決:

    - チャンネル許可リストのエントリと DM 許可リストのエントリは、トークンアクセスで許可される場合、起動時に解決されます
    - 未解決のチャンネル名エントリは設定どおり保持されますが、既定ではルーティングでは無視されます
    - インバウンド認可とチャンネルルーティングは既定で ID 優先です。直接のユーザー名/スラッグ照合には `channels.slack.dangerouslyAllowNameMatching: true` が必要です

    <Warning>
    名前ベースのキー (`#channel-name` または `channel-name`) は `groupPolicy: "allowlist"` では一致しません。チャンネル検索は既定で ID 優先のため、名前ベースのキーではルーティングに成功せず、そのチャンネル内のすべてのメッセージが無言でブロックされます。これは `groupPolicy: "open"` とは異なります。この場合、ルーティングにチャンネルキーは必要なく、名前ベースのキーが機能しているように見えます。

    常に Slack チャンネル ID をキーとして使用してください。確認するには、Slack でチャンネルを右クリック → **リンクをコピー** — URL の末尾に ID (`C...`) が表示されます。

    正しい例:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { allow: true, requireMention: true },
          },
        },
      },
    }
    ```

    不正な例 (`groupPolicy: "allowlist"` では無言でブロックされます):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { allow: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="メンションとチャンネルユーザー">
    チャンネルメッセージは既定でメンションゲート付きです。

    メンションソース:

    - 明示的なアプリメンション (`<@botId>`)
    - メンション正規表現パターン (`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`)
    - 暗黙的なボットへの返信スレッド動作 (`thread.requireExplicitMention` が `true` の場合は無効)

    チャンネルごとの制御 (`channels.slack.channels.<id>`。名前は起動時解決または `dangerouslyAllowNameMatching` 経由のみ):

    - `requireMention`
    - `users` (許可リスト)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` キー形式: `id:`、`e164:`、`username:`、`name:`、または `"*"` ワイルドカード
      (レガシーのプレフィックスなしキーは引き続き `id:` のみにマップされます)

  </Tab>
</Tabs>

## スレッド、セッション、返信タグ

- DM は `direct` として、チャンネルは `channel` として、MPIM は `group` としてルーティングされます。
- 既定の `session.dmScope=main` では、Slack DM はエージェントのメインセッションに折りたたまれます。
- チャンネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- スレッド返信では、該当する場合にスレッドセッション接尾辞 (`:thread:<threadTs>`) を作成できます。
- `channels.slack.thread.historyScope` の既定は `thread` です。`thread.inheritParent` の既定は `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッドセッションの開始時に取得される既存のスレッドメッセージ数を制御します (既定は `20`。無効にするには `0` を設定)。
- `channels.slack.thread.requireExplicitMention` (既定は `false`): `true` の場合、暗黙的なスレッドメンションを抑制し、ボットがすでにスレッドに参加している場合でも、スレッド内の明示的な `@bot` メンションにのみボットが応答するようにします。これがない場合、ボットが参加したスレッド内の返信は `requireMention` ゲートを迂回します。

返信スレッド制御:

- `channels.slack.replyToMode`: `off|first|all|batched` (既定は `off`)
- `channels.slack.replyToModeByChatType`: `direct|group|channel` ごと
- ダイレクトチャットのレガシーフォールバック: `channels.slack.dm.replyToMode`

手動返信タグがサポートされています。

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含め、Slack の **すべて** の返信スレッド化を無効にします。これは、`"off"` モードでも明示的なタグが引き続き尊重される Telegram とは異なります。Slack スレッドではメッセージがチャンネルから非表示になりますが、Telegram の返信はインラインで表示されたままです。
</Note>

## Ack リアクション

`ackReaction` は、OpenClaw がインバウンドメッセージを処理している間、確認用絵文字を送信します。

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- エージェント ID 絵文字フォールバック (`agents.list[].identity.emoji`、それ以外は "👀")

メモ:

- Slack はショートコードを想定します (例: `"eyes"`)。
- Slack アカウントまたはグローバルでリアクションを無効にするには `""` を使用します。

## テキストストリーミング

`channels.slack.streaming` はライブプレビュー動作を制御します。

- `off`: ライブプレビューストリーミングを無効にします。
- `partial` (既定): プレビューテキストを最新の部分出力で置き換えます。
- `block`: チャンク化されたプレビュー更新を追加します。
- `progress`: 生成中に進捗ステータステキストを表示し、その後最終テキストを送信します。
- `streaming.preview.toolProgress`: ドラフトプレビューが有効な場合、ツール/進捗更新を同じ編集済みプレビューメッセージにルーティングします (既定: `true`)。別々のツール/進捗メッセージを維持するには `false` を設定します。

`channels.slack.streaming.nativeTransport` は、`channels.slack.streaming.mode` が `partial` の場合に Slack ネイティブテキストストリーミングを制御します (既定: `true`)。

- ネイティブテキストストリーミングと Slack アシスタントスレッドステータスを表示するには、返信スレッドが利用可能である必要があります。スレッド選択は引き続き `replyToMode` に従います。
- ネイティブストリーミングが利用できない場合でも、チャンネルとグループチャットのルートは通常のドラフトプレビューを使用できます。
- トップレベルの Slack DM は既定でスレッド外のままなので、スレッド形式のプレビューは表示されません。そこで見える進捗が必要な場合は、スレッド返信または `typingReaction` を使用してください。
- メディアおよび非テキストペイロードは通常配信にフォールバックします。
- メディア/エラーの最終応答は保留中のプレビュー編集をキャンセルします。対象となるテキスト/ブロックの最終応答は、プレビューをその場で編集できる場合にのみフラッシュされます。
- ストリーミングが返信途中で失敗した場合、OpenClaw は残りのペイロードについて通常配信にフォールバックします。

Slack ネイティブテキストストリーミングの代わりにドラフトプレビューを使用する:

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

レガシーキー:

- `channels.slack.streamMode` (`replace | status_final | append`) は `channels.slack.streaming.mode` に自動移行されます。
- boolean `channels.slack.streaming` は `channels.slack.streaming.mode` と `channels.slack.streaming.nativeTransport` に自動移行されます。
- レガシーの `channels.slack.nativeStreaming` は `channels.slack.streaming.nativeTransport` に自動移行されます。

## 入力中リアクションフォールバック

`typingReaction` は、OpenClaw が返信を処理している間、インバウンド Slack メッセージに一時的なリアクションを追加し、実行が完了すると削除します。これは、既定の「入力中...」ステータスインジケーターを使用するスレッド返信の外で特に有用です。

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

メモ:

- Slack はショートコードを想定します (例: `"hourglass_flowing_sand"`)。
- リアクションはベストエフォートであり、返信または失敗パスの完了後にクリーンアップが自動的に試行されます。

## メディア、チャンク化、配信

<AccordionGroup>
  <Accordion title="インバウンド添付ファイル">
    Slack ファイル添付は Slack がホストするプライベート URL からダウンロードされ (トークン認証リクエストフロー)、取得が成功しサイズ制限で許可される場合にメディアストアへ書き込まれます。ファイルプレースホルダーには Slack `fileId` が含まれるため、エージェントは `download-file` で元のファイルを取得できます。

    ダウンロードには、制限付きのアイドルタイムアウトと合計タイムアウトが使用されます。Slack ファイル取得が停止または失敗した場合でも、OpenClaw はメッセージの処理を続行し、ファイルプレースホルダーにフォールバックします。

    ランタイムのインバウンドサイズ上限は、`channels.slack.mediaMaxMb` で上書きされない限り、既定で `20MB` です。

  </Accordion>

  <Accordion title="アウトバウンドテキストとファイル">
    - テキストチャンクは `channels.slack.textChunkLimit` を使用します (既定 4000)
    - `channels.slack.chunkMode="newline"` は段落優先の分割を有効にします
    - ファイル送信は Slack アップロード API を使用し、スレッド返信 (`thread_ts`) を含められます
    - アウトバウンドメディア上限は、設定されている場合は `channels.slack.mediaMaxMb` に従います。それ以外の場合、チャンネル送信はメディアパイプラインの MIME 種別既定値を使用します

  </Accordion>

  <Accordion title="配信先">
    推奨される明示的な宛先:

    - `user:<id>` は DM 用
    - `channel:<id>` はチャンネル用

    Slack DM は、ユーザー宛先に送信する際に Slack 会話 API 経由で開かれます。

  </Accordion>
</AccordionGroup>

## コマンドと slash の動作

slash コマンドは、Slack では単一の設定済みコマンドまたは複数のネイティブコマンドとして表示されます。コマンドの既定値を変更するには `channels.slack.slashCommand` を設定します。

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

ネイティブコマンドには Slack アプリで[追加のマニフェスト設定](#additional-manifest-settings)が必要です。代わりに、グローバル設定で `channels.slack.commands.native: true` または `commands.native: true` を指定すると有効になります。

- Slack ではネイティブコマンド自動モードは**オフ**のため、`commands.native: "auto"` では Slack ネイティブコマンドは有効になりません。

```txt
/help
```

ネイティブ引数メニューでは、選択したオプション値をディスパッチする前に確認モーダルを表示する適応型レンダリング戦略を使用します。

- 最大 5 個のオプション: ボタンブロック
- 6-100 個のオプション: 静的選択メニュー
- 100 個を超えるオプション: インタラクティビティオプションハンドラーが利用可能な場合は、非同期オプションフィルタリング付きの外部選択
- Slack の制限を超過: エンコードされたオプション値はボタンにフォールバック

```txt
/think
```

スラッシュセッションは `agent:<agentId>:slack:slash:<userId>` のような分離キーを使用し、コマンド実行は引き続き `CommandTargetSessionKey` を使って対象の会話セッションへルーティングします。

## インタラクティブ返信

Slack はエージェントが作成したインタラクティブ返信コントロールをレンダリングできますが、この機能はデフォルトで無効です。

グローバルに有効化するには、次のようにします。

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

または、1 つの Slack アカウントだけで有効化するには、次のようにします。

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

有効にすると、エージェントは Slack 専用の返信ディレクティブを出力できます。

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

これらのディレクティブは Slack Block Kit にコンパイルされ、クリックまたは選択は既存の Slack インタラクションイベント経路を通じて戻されます。

注記:

- これは Slack 固有の UI です。他のチャンネルは Slack Block Kit ディレクティブを自身のボタンシステムへ変換しません。
- インタラクティブコールバック値は OpenClaw が生成する不透明トークンであり、エージェントが作成した生の値ではありません。
- 生成されたインタラクティブブロックが Slack Block Kit の制限を超える場合、OpenClaw は無効な blocks ペイロードを送信する代わりに、元のテキスト返信へフォールバックします。

## Slack での exec 承認

Slack は、Web UI やターミナルへのフォールバックの代わりに、インタラクティブボタンとインタラクションを備えたネイティブ承認クライアントとして動作できます。

- Exec 承認は、ネイティブの DM/チャンネルルーティングに `channels.slack.execApprovals.*` を使用します。
- Plugin 承認は、リクエストがすでに Slack に到達していて承認 ID 種別が `plugin:` の場合、同じ Slack ネイティブボタン画面から解決できます。
- 承認者の認可は引き続き強制されます。承認者として識別されたユーザーだけが、Slack からリクエストを承認または拒否できます。

これは他のチャンネルと同じ共有承認ボタン画面を使用します。Slack アプリ設定で `interactivity` が有効な場合、承認プロンプトは会話内に Block Kit ボタンとして直接レンダリングされます。
これらのボタンが存在する場合、それらが主要な承認 UX です。OpenClaw は、ツール結果がチャット承認を利用できない、または手動承認が唯一の経路であると示す場合にのみ、手動の `/approve` コマンドを含める必要があります。

設定パス:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (任意。可能な場合は `commands.ownerAllowFrom` にフォールバック)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`、デフォルト: `dm`)
- `agentFilter`, `sessionFilter`

Slack は、`enabled` が未設定または `"auto"` で、少なくとも 1 人の承認者が解決される場合、ネイティブ exec 承認を自動的に有効にします。Slack をネイティブ承認クライアントとして明示的に無効化するには、`enabled: false` を設定します。
承認者が解決される場合にネイティブ承認を強制的にオンにするには、`enabled: true` を設定します。

明示的な Slack exec 承認設定がない場合のデフォルト動作:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

明示的な Slack ネイティブ設定が必要なのは、承認者を上書きする、フィルターを追加する、または発信元チャット配信を選択する場合だけです。

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

共有 `approvals.exec` 転送は別機能です。exec 承認プロンプトを他のチャットまたは明示的な帯域外ターゲットにもルーティングする必要がある場合にのみ使用してください。共有 `approvals.plugin` 転送も別機能です。Slack ネイティブボタンは、それらのリクエストがすでに Slack に到達している場合、引き続き Plugin 承認を解決できます。

同じチャットでの `/approve` は、すでにコマンドをサポートしている Slack チャンネルと DM でも動作します。承認転送モデル全体については、[Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

## イベントと運用上の動作

- メッセージの編集/削除はシステムイベントへマッピングされます。
- スレッドブロードキャスト（「チャンネルにも送信」スレッド返信）は通常のユーザーメッセージとして処理されます。
- リアクションの追加/削除イベントはシステムイベントへマッピングされます。
- メンバーの参加/退出、チャンネルの作成/名前変更、ピンの追加/削除イベントはシステムイベントへマッピングされます。
- `configWrites` が有効な場合、`channel_id_changed` はチャンネル設定キーを移行できます。
- チャンネルトピック/目的メタデータは信頼できないコンテキストとして扱われ、ルーティングコンテキストへ注入される場合があります。
- スレッド開始メッセージと初期スレッド履歴コンテキストのシードは、該当する場合、設定された送信者許可リストでフィルタリングされます。
- ブロックアクションとモーダルインタラクションは、リッチなペイロードフィールドを持つ構造化された `Slack interaction: ...` システムイベントを出力します。
  - ブロックアクション: 選択値、ラベル、ピッカー値、`workflow_*` メタデータ
  - モーダル `view_submission` と `view_closed` イベント。ルーティングされたチャンネルメタデータとフォーム入力を含みます

## 設定リファレンス

主要リファレンス: [設定リファレンス - Slack](/ja-JP/gateway/config-channels#slack)。

<Accordion title="重要度の高い Slack フィールド">

- モード/認証: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM アクセス: `dm.enabled`, `dmPolicy`, `allowFrom` (レガシー: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- 互換性トグル: `dangerouslyAllowNameMatching` (緊急回避用。必要な場合を除きオフのままにしてください)
- チャンネルアクセス: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- スレッド/履歴: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 配信: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- 運用/機能: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャンネルで返信がない">
    次の順に確認してください。

    - `groupPolicy`
    - チャンネル許可リスト (`channels.slack.channels`) — **キーはチャンネル名 (`#channel-name`) ではなく、チャンネル ID** (`C12345678`) である必要があります。チャンネルルーティングはデフォルトで ID 優先のため、`groupPolicy: "allowlist"` では名前ベースのキーは暗黙的に失敗します。ID を確認するには、Slack でチャンネルを右クリック → **リンクをコピー** — URL 末尾の `C...` 値がチャンネル ID です。
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
    確認項目:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (またはレガシーの `channels.slack.dm.policy`)
    - ペアリング承認 / 許可リストエントリ
    - Slack Assistant DM イベント: `drop message_changed` に言及する詳細ログは、通常、Slack がメッセージメタデータ内に復元可能な人間の送信者を含まない、編集済みの Assistant スレッドイベントを送信したことを意味します

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket モードが接続されない">
    Slack アプリ設定で bot トークン、app トークン、Socket Mode の有効化を検証してください。

    `openclaw channels status --probe --json` が `botTokenStatus` または
    `appTokenStatus: "configured_unavailable"` を表示する場合、その Slack アカウントは設定済みですが、現在のランタイムが SecretRef ベースの値を解決できませんでした。

  </Accordion>

  <Accordion title="HTTP モードがイベントを受信しない">
    検証項目:

    - 署名シークレット
    - Webhook パス
    - Slack Request URL（Events + Interactivity + Slash Commands）
    - HTTP アカウントごとの一意な `webhookPath`

    アカウントスナップショットに `signingSecretStatus: "configured_unavailable"` が表示される場合、HTTP アカウントは設定済みですが、現在のランタイムが SecretRef ベースの署名シークレットを解決できませんでした。

  </Accordion>

  <Accordion title="ネイティブ/スラッシュコマンドが起動しない">
    意図したものが次のどちらかを確認してください。

    - Slack に登録済みの一致するスラッシュコマンドを使うネイティブコマンドモード (`channels.slack.commands.native: true`)
    - または単一スラッシュコマンドモード (`channels.slack.slashCommand.enabled: true`)

    `commands.useAccessGroups` とチャンネル/ユーザー許可リストも確認してください。

  </Accordion>
</AccordionGroup>

## 添付ファイルのビジョンリファレンス

Slack ファイルのダウンロードに成功し、サイズ制限が許す場合、Slack はダウンロード済みメディアをエージェントターンへ添付できます。画像ファイルはメディア理解経路を通すか、ビジョン対応の返信モデルへ直接渡すことができます。他のファイルは、画像入力として扱われるのではなく、ダウンロード可能なファイルコンテキストとして保持されます。

### サポートされるメディアタイプ

| メディアタイプ                 | ソース               | 現在の動作                                                                        | 注記                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 画像   | Slack ファイル URL   | ダウンロードされ、ビジョン対応処理のためにターンへ添付されます                    | ファイルごとの上限: `channels.slack.mediaMaxMb` (デフォルト 20 MB)        |
| PDF ファイル                   | Slack ファイル URL   | ダウンロードされ、`download-file` や `pdf` などのツール向けのファイルコンテキストとして公開されます | Slack インバウンドは PDF を画像ビジョン入力へ自動変換しません            |
| その他のファイル               | Slack ファイル URL   | 可能な場合はダウンロードされ、ファイルコンテキストとして公開されます              | バイナリファイルは画像入力として扱われません                              |
| スレッド返信                   | スレッド開始ファイル | 返信に直接メディアがない場合、ルートメッセージファイルをコンテキストとしてハイドレートできます | ファイルのみの開始メッセージは添付ファイルプレースホルダーを使用します   |
| 複数画像メッセージ             | 複数の Slack ファイル | 各ファイルは個別に評価されます                                                    | Slack の処理はメッセージごとに 8 ファイルまでに制限されます               |

### インバウンドパイプライン

ファイル添付を含む Slack メッセージが到着した場合:

1. OpenClaw は bot トークン (`xoxb-...`) を使用して Slack のプライベート URL からファイルをダウンロードします。
2. 成功すると、ファイルはメディアストアへ書き込まれます。
3. ダウンロード済みメディアのパスとコンテンツタイプがインバウンドコンテキストへ追加されます。
4. 画像対応モデル/ツール経路は、そのコンテキストの画像添付を使用できます。
5. 非画像ファイルは、それらを処理できるツール向けのファイルメタデータまたはメディア参照として引き続き利用できます。

### スレッドルート添付ファイルの継承

メッセージがスレッド内に到着した場合 (`thread_ts` 親を持つ場合):

- 返信自体に直接メディアがなく、含まれるルートメッセージにファイルがある場合、Slack はルートファイルをスレッド開始コンテキストとしてハイドレートできます。
- 直接の返信添付ファイルは、ルートメッセージ添付ファイルより優先されます。
- ファイルのみでテキストがないルートメッセージは添付ファイルプレースホルダーで表現されるため、フォールバックは引き続きそのファイルを含めることができます。

### 複数添付ファイルの処理

1 つの Slack メッセージに複数のファイル添付が含まれる場合:

- 各添付ファイルはメディアパイプラインで個別に処理されます。
- ダウンロードされたメディア参照はメッセージコンテキストに集約されます。
- 処理順序はイベントペイロード内の Slack のファイル順に従います。
- ある添付ファイルのダウンロード失敗が、他の添付ファイルをブロックすることはありません。

### サイズ、ダウンロード、モデルの制限

- **サイズ上限**: デフォルトはファイルあたり 20 MB です。`channels.slack.mediaMaxMb` で設定できます。
- **ダウンロード失敗**: Slack が配信できないファイル、期限切れ URL、アクセスできないファイル、サイズ超過のファイル、Slack 認証/ログイン HTML レスポンスは、未対応形式として報告されるのではなくスキップされます。
- **Vision モデル**: 画像分析は、vision に対応している場合はアクティブな返信モデルを使用し、そうでない場合は `agents.defaults.imageModel` で設定された画像モデルを使用します。

### 既知の制限

| シナリオ                               | 現在の動作                                                             | 回避策                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 期限切れの Slack ファイル URL                 | ファイルはスキップされ、エラーは表示されません                                                 | Slack でファイルを再アップロードします                                                |
| Vision モデルが設定されていない            | 画像添付はメディア参照として保存されますが、画像として分析されません | `agents.defaults.imageModel` を設定するか、vision 対応の返信モデルを使用します |
| 非常に大きな画像（デフォルトでは > 20 MB） | サイズ上限に従ってスキップされます                                                         | Slack が許可する場合は `channels.slack.mediaMaxMb` を増やします                       |
| 転送/共有された添付ファイル           | テキストおよび Slack がホストする画像/ファイルメディアはベストエフォートで処理されます                       | OpenClaw スレッドで直接再共有します                                   |
| PDF 添付                        | ファイル/メディアコンテキストとして保存され、画像 vision には自動的にルーティングされません  | ファイルメタデータには `download-file` を使用し、PDF 分析には `pdf` ツールを使用します   |

### 関連ドキュメント

- [メディア理解パイプライン](/ja-JP/nodes/media-understanding)
- [PDF ツール](/ja-JP/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack 添付ファイル vision の有効化
- 回帰テスト: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- ライブ検証: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Slack ユーザーを Gateway にペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    チャンネルとグループ DM の動作。
  </Card>
  <Card title="チャンネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントにルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと強化。
  </Card>
  <Card title="設定" icon="sliders" href="/ja-JP/gateway/configuration">
    設定のレイアウトと優先順位。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    コマンドカタログと動作。
  </Card>
</CardGroup>
