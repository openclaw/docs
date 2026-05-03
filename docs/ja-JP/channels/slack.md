---
read_when:
    - Slack のセットアップまたは Slack ソケット/HTTP モードのデバッグ
summary: Slack のセットアップと実行時の動作（ソケットモード + HTTP リクエスト URL）
title: Slack
x-i18n:
    generated_at: "2026-05-03T04:58:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85473159dcbd395144e5c37da140164023ac117406ba517d557fcf0989042448
    source_path: channels/slack.md
    workflow: 16
---

DM とチャンネルで Slack アプリ連携を通じて本番運用可能です。デフォルトモードは Socket Mode です。HTTP Request URLs もサポートされています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Slack DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの挙動とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復プレイブック。
  </Card>
</CardGroup>

## クイックセットアップ

<Tabs>
  <Tab title="Socket Mode（デフォルト）">
    <Steps>
      <Step title="新しい Slack アプリを作成する">
        Slack アプリ設定で **[Create New App](https://api.slack.com/apps/new)** ボタンを押します。

        - **from a manifest** を選択し、アプリ用のワークスペースを選択します
        - 下の [サンプルマニフェスト](#manifest-and-scope-checklist) を貼り付け、作成を続行します
        - `connections:write` を持つ **App-Level Token**（`xapp-...`）を生成します
        - アプリをインストールし、表示される **Bot Token**（`xoxb-...`）をコピーします

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

        env フォールバック（デフォルトアカウントのみ）:

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Gateway を開始する">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="新しい Slack アプリを作成する">
        Slack アプリ設定で **[Create New App](https://api.slack.com/apps/new)** ボタンを押します。

        - **from a manifest** を選択し、アプリ用のワークスペースを選択します
        - [サンプルマニフェスト](#manifest-and-scope-checklist) を貼り付け、作成前に URL を更新します
        - リクエスト検証用の **Signing Secret** を保存します
        - アプリをインストールし、表示される **Bot Token**（`xoxb-...`）をコピーします

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
        複数アカウントの HTTP には一意の webhook パスを使用してください

        登録が衝突しないように、各アカウントに個別の `webhookPath`（デフォルトは `/slack/events`）を指定します。
        </Note>

      </Step>

      <Step title="Gateway を開始する">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Socket Mode トランスポートのチューニング

OpenClaw は Socket Mode で、Slack SDK クライアントの pong タイムアウトをデフォルトで 15 秒に設定します。ワークスペースまたはホスト固有の調整が必要な場合にのみ、トランスポート設定を上書きしてください。

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

これは、Slack websocket の pong/server-ping タイムアウトをログに記録する Socket Mode ワークスペース、またはイベントループの枯渇が既知のホストで実行されている場合にのみ使用してください。`clientPingTimeout` は SDK がクライアント ping を送信した後の pong 待機時間です。`serverPingTimeout` は Slack サーバー ping の待機時間です。アプリメッセージとイベントはアプリケーション状態のままであり、トランスポートの生存性シグナルではありません。

## マニフェストとスコープのチェックリスト

基本の Slack アプリマニフェストは Socket Mode と HTTP Request URLs で同じです。異なるのは `settings` ブロック（およびスラッシュコマンドの `url`）のみです。

基本マニフェスト（Socket Mode デフォルト）:

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
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
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
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

**HTTP Request URLs モード**では、`settings` を HTTP バリアントに置き換え、各スラッシュコマンドに `url` を追加します。公開 URL が必要です。

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

上記のデフォルトを拡張するさまざまな機能を公開します。

デフォルトのマニフェストでは、Slack App Home の **Home** タブが有効になり、`app_home_opened` をサブスクライブします。ワークスペースメンバーが Home タブを開くと、OpenClaw は `views.publish` で安全なデフォルトの Home ビューを公開します。会話ペイロードや非公開設定は含まれません。**Messages** タブは Slack DM 用に有効なままです。

<AccordionGroup>
  <Accordion title="任意のネイティブスラッシュコマンド">

    微妙な違いを考慮し、単一の設定済みコマンドの代わりに複数の[ネイティブスラッシュコマンド](#commands-and-slash-behavior)を使用できます。

    - `/status` コマンドは予約されているため、`/status` の代わりに `/agentstatus` を使用します。
    - 一度に利用可能にできるスラッシュコマンドは 25 個までです。

    既存の `features.slash_commands` セクションを、[利用可能なコマンド](/ja-JP/tools/slash-commands#command-list)のサブセットに置き換えます。

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
        上記の Socket Mode と同じ `slash_commands` リストを使用し、すべてのエントリに `"url": "https://gateway-host.example.com/slack/events"` を追加します。例:

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
    送信メッセージでデフォルトの Slack アプリ ID ではなく、アクティブなエージェント ID（カスタムユーザー名とアイコン）を使用したい場合は、`chat:write.customize` bot スコープを追加します。

    絵文字アイコンを使用する場合、Slack は `:emoji_name:` 構文を想定します。

  </Accordion>
  <Accordion title="任意のユーザートークンのスコープ（読み取り操作）">
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

- Socket Mode には `botToken` + `appToken` が必要です。
- HTTP モードには `botToken` + `signingSecret` が必要です。
- `botToken`、`appToken`、`signingSecret`、`userToken` は平文の文字列、または SecretRef オブジェクトを受け付けます。
- 設定内のトークンは env フォールバックより優先されます。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` の env フォールバックは、既定のアカウントにのみ適用されます。
- `userToken`（`xoxp-...`）は設定専用（env フォールバックなし）で、既定では読み取り専用動作（`userTokenReadOnly: true`）になります。

ステータススナップショットの動作:

- Slack アカウント検査は、認証情報ごとの `*Source` と `*Status` フィールド（`botToken`、`appToken`、`signingSecret`、`userToken`）を追跡します。
- ステータスは `available`、`configured_unavailable`、または `missing` です。
- `configured_unavailable` は、アカウントが SecretRef または別の非インライン secret ソースを通じて設定されているものの、現在のコマンド/ランタイム経路では実際の値を解決できなかったことを意味します。
- HTTP モードでは `signingSecretStatus` が含まれます。Socket Mode では、必要な組み合わせは `botTokenStatus` + `appTokenStatus` です。

<Tip>
アクション/ディレクトリ読み取りでは、設定されている場合にユーザートークンを優先できます。書き込みでは、引き続きボットトークンが優先されます。ユーザートークンによる書き込みは、`userTokenReadOnly: false` で、かつボットトークンが利用できない場合にのみ許可されます。
</Tip>

## アクションとゲート

Slack アクションは `channels.slack.actions.*` で制御されます。

現在の Slack ツールで利用できるアクショングループ:

| グループ   | 既定 |
| ---------- | ---- |
| messages   | 有効 |
| reactions  | 有効 |
| pins       | 有効 |
| memberInfo | 有効 |
| emojiList  | 有効 |

現在の Slack メッセージアクションには、`send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info`、`emoji-list` があります。`download-file` は受信ファイルプレースホルダーに表示される Slack ファイル ID を受け取り、画像の場合は画像プレビューを、それ以外のファイルタイプの場合はローカルファイルメタデータを返します。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.slack.dmPolicy` は DM アクセスを制御します。`channels.slack.allowFrom` は標準の DM 許可リストです。

    - `pairing`（既定）
    - `allowlist`
    - `open`（`channels.slack.allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    DM フラグ:

    - `dm.enabled`（既定は true）
    - `channels.slack.allowFrom`
    - `dm.allowFrom`（レガシー）
    - `dm.groupEnabled`（グループ DM の既定は false）
    - `dm.groupChannels`（任意の MPIM 許可リスト）

    複数アカウントの優先順位:

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

    チャンネル許可リストは `channels.slack.channels` の下に置かれ、設定キーとして**安定した Slack チャンネル ID**（例: `C12345678`）を使用する必要があります。

    ランタイムメモ: `channels.slack` が完全に存在しない場合（env のみのセットアップ）、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに記録します（`channels.defaults.groupPolicy` が設定されている場合でも同様です）。

    名前/ID 解決:

    - チャンネル許可リストのエントリと DM 許可リストのエントリは、トークンアクセスで可能な場合に起動時に解決されます
    - 解決できないチャンネル名エントリは設定されたまま保持されますが、既定ではルーティングでは無視されます
    - 受信認可とチャンネルルーティングは既定で ID 優先です。直接のユーザー名/slug マッチングには `channels.slack.dangerouslyAllowNameMatching: true` が必要です

    <Warning>
    名前ベースのキー（`#channel-name` または `channel-name`）は、`groupPolicy: "allowlist"` では一致しません。チャンネル検索は既定で ID 優先のため、名前ベースのキーではルーティングに成功することはなく、そのチャンネル内のすべてのメッセージは暗黙にブロックされます。これは `groupPolicy: "open"` とは異なります。`groupPolicy: "open"` では、ルーティングにチャンネルキーは不要で、名前ベースのキーが動作しているように見えます。

    必ず Slack チャンネル ID をキーとして使用してください。確認するには、Slack でチャンネルを右クリック → **リンクをコピー**。ID（`C...`）は URL の末尾に表示されます。

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

    誤った例（`groupPolicy: "allowlist"` では暗黙にブロックされます）:

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
    チャンネルメッセージは既定でメンションゲートされます。

    メンションソース:

    - 明示的なアプリメンション（`<@botId>`）
    - Slack ユーザーグループメンション（`<!subteam^S...>`）。ボットユーザーがそのユーザーグループのメンバーである場合。`usergroups:read` が必要です
    - メンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - 暗黙のボット返信先スレッド動作（`thread.requireExplicitMention` が `true` の場合は無効）

    チャンネルごとの制御（`channels.slack.channels.<id>`。名前は起動時解決または `dangerouslyAllowNameMatching` 経由のみ）:

    - `requireMention`
    - `users`（許可リスト）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` キー形式: `id:`、`e164:`、`username:`、`name:`、または `"*"` ワイルドカード
      （レガシーのプレフィックスなしキーは、引き続き `id:` のみにマップされます）

    `allowBots` は、チャンネルとプライベートチャンネルでは保守的です。ボット作成のルームメッセージは、送信元ボットがそのルームの `users` 許可リストに明示的に列挙されている場合、または `channels.slack.allowFrom` の明示的な Slack owner ID の少なくとも 1 つが現在ルームメンバーである場合にのみ受け入れられます。ワイルドカードや表示名の owner エントリは、owner の存在を満たしません。owner の存在確認には Slack `conversations.members` を使用します。アプリにルームタイプに対応する読み取りスコープ（パブリックチャンネルでは `channels:read`、プライベートチャンネルでは `groups:read`）があることを確認してください。メンバー検索に失敗した場合、OpenClaw はボット作成のルームメッセージを破棄します。

  </Tab>
</Tabs>

## スレッド、セッション、返信タグ

- DM は `direct` として、チャンネルは `channel` として、MPIM は `group` としてルーティングされます。
- Slack ルートバインディングは、生の peer ID に加えて、`channel:C12345678`、`user:U12345678`、`<@U12345678>` などの Slack ターゲット形式を受け付けます。
- 既定の `session.dmScope=main` では、Slack DM は agent main session に集約されます。
- チャンネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- スレッド返信は、該当する場合にスレッドセッションサフィックス（`:thread:<threadTs>`）を作成できます。
- `channels.slack.thread.historyScope` の既定は `thread` です。`thread.inheritParent` の既定は `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッドセッション開始時に取得する既存スレッドメッセージ数を制御します（既定は `20`。無効にするには `0` を設定）。
- `channels.slack.thread.requireExplicitMention`（既定は `false`）: `true` の場合、暗黙のスレッドメンションを抑制し、ボットがすでにそのスレッドに参加していても、スレッド内の明示的な `@bot` メンションにのみボットが応答します。これがない場合、ボットが参加したスレッド内の返信は `requireMention` ゲートをバイパスします。

返信スレッド制御:

- `channels.slack.replyToMode`: `off|first|all|batched`（既定は `off`）
- `channels.slack.replyToModeByChatType`: `direct|group|channel` ごと
- 直接チャット用のレガシーフォールバック: `channels.slack.dm.replyToMode`

手動返信タグがサポートされています。

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含め、Slack の**すべて**の返信スレッド化を無効にします。これは Telegram とは異なります。Telegram では、`"off"` モードでも明示的なタグは引き続き尊重されます。Slack スレッドはチャンネルからメッセージを非表示にしますが、Telegram の返信はインラインで表示されたままになります。
</Note>

## Ack リアクション

`ackReaction` は、OpenClaw が受信メッセージを処理している間、確認用の絵文字を送信します。

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- agent identity emoji フォールバック（`agents.list[].identity.emoji`、それ以外は "👀"）

メモ:

- Slack はショートコードを想定します（例: `"eyes"`）。
- Slack アカウントまたはグローバルでリアクションを無効にするには `""` を使用します。

## テキストストリーミング

`channels.slack.streaming` はライブプレビュー動作を制御します。

- `off`: ライブプレビューストリーミングを無効にします。
- `partial`（既定）: プレビューテキストを最新の部分出力に置き換えます。
- `block`: チャンク化されたプレビュー更新を追加します。
- `progress`: 生成中に進行状況テキストを表示し、その後最終テキストを送信します。
- `streaming.preview.toolProgress`: 下書きプレビューがアクティブな場合、ツール/進行状況の更新を同じ編集済みプレビューメッセージにルーティングします（既定: `true`）。別個のツール/進行状況メッセージを維持するには `false` を設定します。

`channels.slack.streaming.nativeTransport` は、`channels.slack.streaming.mode` が `partial` の場合に Slack ネイティブテキストストリーミングを制御します（既定: `true`）。

- ネイティブテキストストリーミングと Slack assistant スレッドステータスを表示するには、返信スレッドが利用可能である必要があります。スレッド選択は引き続き `replyToMode` に従います。
- チャンネル、グループチャット、トップレベル DM ルートは、ネイティブストリーミングが利用できない場合や返信スレッドが存在しない場合でも、通常の下書きプレビューを使用できます。
- トップレベルの Slack DM は既定でスレッド外のままなので、Slack のスレッド形式のネイティブストリーム/ステータスプレビューは表示されません。OpenClaw は代わりに DM に下書きプレビューを投稿して編集します。
- メディアと非テキストペイロードは通常の配信にフォールバックします。
- メディア/エラーの最終出力は保留中のプレビュー編集をキャンセルします。対象となるテキスト/ブロックの最終出力は、その場でプレビューを編集できる場合にのみフラッシュされます。
- ストリーミングが返信の途中で失敗した場合、OpenClaw は残りのペイロードについて通常の配信にフォールバックします。

Slack ネイティブテキストストリーミングの代わりに下書きプレビューを使用する:

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

- `channels.slack.streamMode`（`replace | status_final | append`）は `channels.slack.streaming.mode` に自動移行されます。
- boolean `channels.slack.streaming` は `channels.slack.streaming.mode` と `channels.slack.streaming.nativeTransport` に自動移行されます。
- レガシーの `channels.slack.nativeStreaming` は `channels.slack.streaming.nativeTransport` に自動移行されます。

## タイピングリアクションフォールバック

`typingReaction` は、OpenClaw が返信を処理している間、受信 Slack メッセージに一時的なリアクションを追加し、実行が完了したら削除します。これは、既定の「is typing...」ステータスインジケーターを使用するスレッド返信の外で特に有用です。

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

メモ:

- Slack はショートコードを想定します（例: `"hourglass_flowing_sand"`）。
- リアクションはベストエフォートであり、返信または失敗経路の完了後にクリーンアップが自動的に試行されます。

## メディア、チャンク化、配信

<AccordionGroup>
  <Accordion title="インバウンド添付ファイル">
    Slack のファイル添付は、Slack がホストするプライベート URL からダウンロードされ（トークン認証付きリクエストフロー）、取得が成功しサイズ制限で許可される場合はメディアストアに書き込まれます。ファイルプレースホルダーには Slack の `fileId` が含まれるため、エージェントは `download-file` で元のファイルを取得できます。

    ダウンロードには、制限付きのアイドルタイムアウトと総タイムアウトが使用されます。Slack ファイルの取得が停止または失敗した場合、OpenClaw はメッセージ処理を継続し、ファイルプレースホルダーにフォールバックします。

    実行時のインバウンドサイズ上限は、`channels.slack.mediaMaxMb` で上書きされない限り、既定で `20MB` です。

  </Accordion>

  <Accordion title="アウトバウンドテキストとファイル">
    - テキストチャンクは `channels.slack.textChunkLimit` を使用します（既定値 4000）
    - `channels.slack.chunkMode="newline"` は段落優先の分割を有効にします
    - ファイル送信は Slack アップロード API を使用し、スレッド返信（`thread_ts`）を含めることができます
    - アウトバウンドメディアの上限は、設定されている場合は `channels.slack.mediaMaxMb` に従います。設定されていない場合、チャンネル送信はメディアパイプラインの MIME 種別の既定値を使用します

  </Accordion>

  <Accordion title="配信先">
    推奨される明示的なターゲット:

    - DM には `user:<id>`
    - チャンネルには `channel:<id>`

    テキスト/ブロックのみの Slack DM はユーザー ID に直接投稿できます。ファイルアップロードとスレッド送信は具体的な会話 ID が必要なため、まず Slack 会話 API 経由で DM を開きます。

  </Accordion>
</AccordionGroup>

## コマンドとスラッシュの動作

スラッシュコマンドは、Slack では単一の設定済みコマンドまたは複数のネイティブコマンドとして表示されます。コマンドの既定値を変更するには、`channels.slack.slashCommand` を設定します。

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

ネイティブコマンドには Slack アプリで[追加のマニフェスト設定](#additional-manifest-settings)が必要で、代わりに `channels.slack.commands.native: true`、またはグローバル設定の `commands.native: true` で有効にします。

- Slack ではネイティブコマンドの自動モードは**オフ**のため、`commands.native: "auto"` は Slack ネイティブコマンドを有効にしません。

```txt
/help
```

ネイティブ引数メニューは、選択したオプション値をディスパッチする前に確認モーダルを表示する適応型レンダリング戦略を使用します。

- 最大 5 個のオプション: ボタンブロック
- 6〜100 個のオプション: 静的選択メニュー
- 100 個を超えるオプション: インタラクティビティオプションハンドラーが利用できる場合、非同期オプションフィルタリング付きの外部選択
- Slack の制限超過: エンコードされたオプション値はボタンにフォールバックします

```txt
/think
```

スラッシュセッションは `agent:<agentId>:slack:slash:<userId>` のような分離キーを使用しつつ、コマンド実行は引き続き `CommandTargetSessionKey` を使用してターゲット会話セッションへルーティングします。

## インタラクティブ返信

Slack はエージェントが作成したインタラクティブ返信コントロールをレンダリングできますが、この機能は既定で無効です。

グローバルに有効にします。

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

または 1 つの Slack アカウントだけで有効にします。

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

これらのディレクティブは Slack Block Kit にコンパイルされ、クリックまたは選択は既存の Slack インタラクションイベントパスを通じて戻されます。

注:

- これは Slack 固有の UI です。他のチャンネルは Slack Block Kit ディレクティブを自チャンネルのボタンシステムへ変換しません。
- インタラクティブコールバック値は OpenClaw が生成する不透明なトークンであり、エージェントが直接作成した生の値ではありません。
- 生成されたインタラクティブブロックが Slack Block Kit の制限を超える場合、OpenClaw は無効なブロックペイロードを送信する代わりに、元のテキスト返信へフォールバックします。

## Slack での exec 承認

Slack は、Web UI やターミナルへフォールバックする代わりに、インタラクティブボタンとインタラクションを備えたネイティブ承認クライアントとして動作できます。

- Exec 承認はネイティブ DM/チャンネルルーティングに `channels.slack.execApprovals.*` を使用します。
- Plugin 承認は、リクエストがすでに Slack に到達していて承認 ID 種別が `plugin:` の場合、同じ Slack ネイティブのボタン画面を通じて解決できます。
- 承認者の認可は引き続き強制されます。承認者として識別されたユーザーのみが、Slack 経由でリクエストを承認または拒否できます。

これは他のチャンネルと同じ共有承認ボタン画面を使用します。Slack アプリ設定で `interactivity` が有効になっている場合、承認プロンプトは会話内に直接 Block Kit ボタンとしてレンダリングされます。
これらのボタンが存在する場合、それらが主要な承認 UX です。OpenClaw は、ツール結果がチャット承認を利用できない、または手動承認が唯一の経路であることを示す場合にのみ、手動の `/approve` コマンドを含める必要があります。

設定パス:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（任意。可能な場合は `commands.ownerAllowFrom` にフォールバック）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`、既定値: `dm`）
- `agentFilter`、`sessionFilter`

Slack は、`enabled` が未設定または `"auto"` で、少なくとも 1 人の承認者を解決できる場合、ネイティブ exec 承認を自動的に有効にします。Slack をネイティブ承認クライアントとして明示的に無効にするには、`enabled: false` を設定します。
承認者を解決できる場合にネイティブ承認を強制的に有効にするには、`enabled: true` を設定します。

明示的な Slack exec 承認設定がない場合の既定の動作:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

明示的な Slack ネイティブ設定が必要なのは、承認者を上書きする、フィルターを追加する、または送信元チャットへの配信を有効にする場合だけです。

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

共有の `approvals.exec` 転送は別個のものです。exec 承認プロンプトを他のチャットや明示的な帯域外ターゲットにもルーティングする必要がある場合にのみ使用してください。共有の `approvals.plugin` 転送も別個のものです。Slack ネイティブボタンは、それらのリクエストがすでに Slack に到達している場合、引き続き Plugin 承認を解決できます。

同一チャットの `/approve` は、すでにコマンドをサポートしている Slack チャンネルと DM でも機能します。承認転送モデル全体については、[exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

## イベントと運用時の動作

- メッセージの編集/削除はシステムイベントにマッピングされます。
- スレッドブロードキャスト（「Also send to channel」のスレッド返信）は通常のユーザーメッセージとして処理されます。
- リアクションの追加/削除イベントはシステムイベントにマッピングされます。
- メンバーの参加/退出、チャンネルの作成/名前変更、ピンの追加/削除イベントはシステムイベントにマッピングされます。
- `configWrites` が有効な場合、`channel_id_changed` はチャンネル設定キーを移行できます。
- チャンネルトピック/目的のメタデータは信頼できないコンテキストとして扱われ、ルーティングコンテキストに注入される可能性があります。
- スレッド開始メッセージと初期スレッド履歴コンテキストのシードは、該当する場合、設定済み送信者許可リストでフィルタリングされます。
- ブロックアクションとモーダルインタラクションは、豊富なペイロードフィールドを持つ構造化された `Slack interaction: ...` システムイベントを発行します。
  - ブロックアクション: 選択値、ラベル、ピッカー値、`workflow_*` メタデータ
  - ルーティング済みチャンネルメタデータとフォーム入力を含むモーダル `view_submission` および `view_closed` イベント

## 設定リファレンス

主要リファレンス: [設定リファレンス - Slack](/ja-JP/gateway/config-channels#slack)。

<Accordion title="重要度の高い Slack フィールド">

- モード/認証: `mode`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
- DM アクセス: `dm.enabled`、`dmPolicy`、`allowFrom`（レガシー: `dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
- 互換性トグル: `dangerouslyAllowNameMatching`（緊急回避用。必要な場合を除きオフにしておく）
- チャンネルアクセス: `groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`
- スレッド/履歴: `replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 配信: `textChunkLimit`、`chunkMode`、`mediaMaxMb`、`streaming`、`streaming.nativeTransport`、`streaming.preview.toolProgress`
- 運用/機能: `configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

</Accordion>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャンネルに返信がない">
    次の順に確認します。

    - `groupPolicy`
    - チャンネル許可リスト（`channels.slack.channels`）— **キーはチャンネル名（`#channel-name`）ではなく、チャンネル ID**（`C12345678`）である必要があります。チャンネルルーティングは既定で ID 優先のため、名前ベースのキーは `groupPolicy: "allowlist"` の下で暗黙的に失敗します。ID を見つけるには、Slack でチャンネルを右クリック → **リンクをコピー** — URL 末尾の `C...` 値がチャンネル ID です。
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
    - `channels.slack.dmPolicy`（またはレガシーの `channels.slack.dm.policy`）
    - ペアリング承認 / 許可リスト項目
    - Slack Assistant DM イベント: `drop message_changed` に言及する詳細ログは、
      通常、メッセージメタデータ内に復元可能な人間の送信者がない
      編集済み Assistant スレッドイベントを Slack が送信したことを意味します

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode が接続しない">
    Slack アプリ設定で bot + app トークンと Socket Mode の有効化を検証します。

    `openclaw channels status --probe --json` に `botTokenStatus` または
    `appTokenStatus: "configured_unavailable"` が表示される場合、Slack アカウントは
    設定されていますが、現在のランタイムが SecretRef に基づく
    値を解決できなかったことを意味します。

  </Accordion>

  <Accordion title="HTTP モードがイベントを受信しない">
    検証項目:

    - 署名シークレット
    - Webhook パス
    - Slack Request URL（Events + Interactivity + Slash Commands）
    - HTTP アカウントごとの一意な `webhookPath`

    アカウントスナップショットに `signingSecretStatus: "configured_unavailable"` が表示される場合、
    HTTP アカウントは設定されていますが、現在のランタイムが
    SecretRef に基づく署名シークレットを解決できなかったことを意味します。

  </Accordion>

  <Accordion title="ネイティブ/スラッシュコマンドが実行されない">
    意図していたものを確認してください。

    - Slack に登録された一致するスラッシュコマンドを伴うネイティブコマンドモード（`channels.slack.commands.native: true`）
    - または単一スラッシュコマンドモード（`channels.slack.slashCommand.enabled: true`）

    `commands.useAccessGroups` とチャンネル/ユーザー許可リストも確認してください。

  </Accordion>
</AccordionGroup>

## 添付ファイルのビジョンリファレンス

Slack ファイルのダウンロードが成功し、サイズ制限で許可される場合、Slack はダウンロード済みメディアをエージェントターンに添付できます。画像ファイルはメディア理解パスを通すか、ビジョン対応の返信モデルへ直接渡すことができます。その他のファイルは画像入力として扱われるのではなく、ダウンロード可能なファイルコンテキストとして保持されます。

### サポートされるメディアタイプ

| メディア種別                     | ソース               | 現在の挙動                                                                  | 注記                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 画像 | Slack ファイル URL       | ダウンロードされ、ビジョン対応の処理のためにターンへ添付される                   | ファイル単位の上限: `channels.slack.mediaMaxMb` (デフォルト 20 MB)                 |
| PDF ファイル                      | Slack ファイル URL       | ダウンロードされ、`download-file` や `pdf` などのツール向けのファイルコンテキストとして公開される | Slack のインバウンドでは PDF は画像ビジョン入力へ自動変換されない |
| その他のファイル                    | Slack ファイル URL       | 可能な場合はダウンロードされ、ファイルコンテキストとして公開される                              | バイナリファイルは画像入力として扱われない                               |
| スレッド返信                 | スレッド開始メッセージのファイル | 返信に直接のメディアがない場合、ルートメッセージのファイルをコンテキストとしてハイドレートできる  | ファイルのみの開始メッセージでは添付プレースホルダーを使用する                          |
| 複数画像メッセージ           | 複数の Slack ファイル | 各ファイルは個別に評価される                                              | Slack の処理はメッセージあたり 8 ファイルに制限される                     |

### インバウンドパイプライン

ファイル添付付きの Slack メッセージが到着したとき:

1. OpenClaw はボットトークン (`xoxb-...`) を使って Slack のプライベート URL からファイルをダウンロードする。
2. 成功すると、ファイルはメディアストアに書き込まれる。
3. ダウンロード済みメディアのパスとコンテンツタイプがインバウンドコンテキストに追加される。
4. 画像対応モデル/ツールのパスは、そのコンテキスト内の画像添付を使用できる。
5. 画像以外のファイルは、それを処理できるツール向けにファイルメタデータまたはメディア参照として引き続き利用できる。

### スレッドルート添付の継承

メッセージがスレッド内に到着した場合 (`thread_ts` の親を持つ場合):

- 返信自体に直接のメディアがなく、含まれているルートメッセージにファイルがある場合、Slack はルートファイルをスレッド開始コンテキストとしてハイドレートできる。
- 直接の返信添付は、ルートメッセージの添付より優先される。
- ファイルのみでテキストがないルートメッセージは、フォールバックが引き続きそのファイルを含められるように、添付プレースホルダーで表現される。

### 複数添付の処理

1 つの Slack メッセージに複数のファイル添付が含まれる場合:

- 各添付はメディアパイプラインを通じて個別に処理される。
- ダウンロード済みメディア参照はメッセージコンテキストに集約される。
- 処理順序はイベントペイロード内の Slack のファイル順に従う。
- ある添付のダウンロードに失敗しても、他の添付はブロックされない。

### サイズ、ダウンロード、モデルの制限

- **サイズ上限**: デフォルトはファイルあたり 20 MB。`channels.slack.mediaMaxMb` で設定可能。
- **ダウンロード失敗**: Slack が配信できないファイル、期限切れ URL、アクセスできないファイル、サイズ超過のファイル、Slack 認証/ログイン HTML レスポンスは、未対応形式として報告されるのではなくスキップされる。
- **ビジョンモデル**: 画像分析は、ビジョンに対応している場合はアクティブな返信モデルを使用し、そうでなければ `agents.defaults.imageModel` で設定された画像モデルを使用する。

### 既知の制限

| シナリオ                               | 現在の挙動                                                             | 回避策                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 期限切れの Slack ファイル URL                 | ファイルはスキップされ、エラーは表示されない                                                 | Slack でファイルを再アップロードする                                                |
| ビジョンモデルが設定されていない            | 画像添付はメディア参照として保存されるが、画像として分析されない | `agents.defaults.imageModel` を設定するか、ビジョン対応の返信モデルを使用する |
| 非常に大きい画像 (デフォルトでは 20 MB 超) | サイズ上限によりスキップされる                                                         | Slack が許可する場合は `channels.slack.mediaMaxMb` を増やす                       |
| 転送/共有された添付           | テキストと Slack ホストの画像/ファイルメディアはベストエフォート                       | OpenClaw スレッドで直接再共有する                                   |
| PDF 添付                        | ファイル/メディアコンテキストとして保存され、画像ビジョン経由で自動的にはルーティングされない  | ファイルメタデータには `download-file` を使用し、PDF 分析には `pdf` ツールを使用する   |

### 関連ドキュメント

- [メディア理解パイプライン](/ja-JP/nodes/media-understanding)
- [PDF ツール](/ja-JP/tools/pdf)
- エピック: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack 添付のビジョン有効化
- 回帰テスト: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- ライブ検証: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Slack ユーザーを Gateway にペアリングする。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    チャンネルとグループ DM の挙動。
  </Card>
  <Card title="チャンネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    インバウンドメッセージをエージェントへルーティングする。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと堅牢化。
  </Card>
  <Card title="設定" icon="sliders" href="/ja-JP/gateway/configuration">
    設定のレイアウトと優先順位。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    コマンドカタログと挙動。
  </Card>
</CardGroup>
