---
read_when:
    - Slackの設定またはSlackのソケット/HTTPモードのデバッグ
summary: Slack の設定と実行時の挙動（Socket Mode + HTTPリクエストURL）
title: Slack
x-i18n:
    generated_at: "2026-05-02T04:49:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60e06b138e1579156ccd07bb6db1a25009be970d072ba500b61810c5b78fd01d
    source_path: channels/slack.md
    workflow: 16
---

本番利用に対応しており、Slack アプリ連携を通じて DM とチャンネルで使えます。デフォルトモードは Socket Mode です。HTTP Request URL もサポートされています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Slack DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復プレイブック。
  </Card>
</CardGroup>

## 簡単なセットアップ

<Tabs>
  <Tab title="Socket Mode（デフォルト）">
    <Steps>
      <Step title="新しい Slack アプリを作成する">
        Slack アプリ設定で **[Create New App](https://api.slack.com/apps/new)** ボタンを押します。

        - **from a manifest** を選択し、アプリ用のワークスペースを選びます
        - 以下の [サンプルマニフェスト](#manifest-and-scope-checklist) を貼り付け、作成を続行します
        - `connections:write` を持つ **App-Level Token** (`xapp-...`) を生成します
        - アプリをインストールし、表示される **Bot Token** (`xoxb-...`) をコピーします

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

  <Tab title="HTTP Request URL">
    <Steps>
      <Step title="新しい Slack アプリを作成する">
        Slack アプリ設定で **[Create New App](https://api.slack.com/apps/new)** ボタンを押します。

        - **from a manifest** を選択し、アプリ用のワークスペースを選びます
        - [サンプルマニフェスト](#manifest-and-scope-checklist) を貼り付け、作成前に URL を更新します
        - リクエスト検証用の **Signing Secret** を保存します
        - アプリをインストールし、表示される **Bot Token** (`xoxb-...`) をコピーします

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
        複数アカウントの HTTP には一意の Webhook パスを使う

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

## Socket Mode トランスポートの調整

OpenClaw は、Socket Mode では Slack SDK クライアントの pong タイムアウトをデフォルトで 15 秒に設定します。ワークスペースまたはホスト固有の調整が必要な場合にのみ、トランスポート設定を上書きしてください。

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

これは、Slack websocket の pong/server-ping タイムアウトをログに記録する Socket Mode ワークスペース、またはイベントループの枯渇が既知のホストでのみ使用してください。`clientPingTimeout` は SDK がクライアント ping を送信した後の pong 待機時間です。`serverPingTimeout` は Slack サーバー ping の待機時間です。アプリのメッセージとイベントはアプリケーション状態であり、トランスポートの生存シグナルではありません。

## マニフェストとスコープのチェックリスト

基本の Slack アプリマニフェストは、Socket Mode と HTTP Request URL で同じです。異なるのは `settings` ブロック（およびスラッシュコマンドの `url`）だけです。

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

**HTTP Request URL モード**では、`settings` を HTTP 版に置き換え、各スラッシュコマンドに `url` を追加します。公開 URL が必要です。

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

デフォルトのマニフェストでは、Slack App Home の **Home** タブが有効になり、`app_home_opened` を購読します。ワークスペースメンバーが Home タブを開くと、OpenClaw は `views.publish` で安全なデフォルトの Home ビューを公開します。会話ペイロードやプライベート設定は含まれません。Slack DM 用には **Messages** タブが有効なままになります。

<AccordionGroup>
  <Accordion title="任意のネイティブスラッシュコマンド">

    単一の設定済みコマンドの代わりに、複数の [ネイティブスラッシュコマンド](#commands-and-slash-behavior) を細かな違いに応じて使用できます。

    - `/status` コマンドは予約されているため、`/status` の代わりに `/agentstatus` を使います。
    - 一度に利用可能にできるスラッシュコマンドは 25 個以下です。

    既存の `features.slash_commands` セクションを、[利用可能なコマンド](/ja-JP/tools/slash-commands#command-list) のサブセットに置き換えます。

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
      <Tab title="HTTP Request URL">
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
    送信メッセージでデフォルトの Slack アプリ ID ではなく、アクティブなエージェント ID（カスタムユーザー名とアイコン）を使いたい場合は、`chat:write.customize` bot スコープを追加します。

    絵文字アイコンを使う場合、Slack は `:emoji_name:` 構文を想定します。

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

- Socket Mode には `botToken` + `appToken` が必要です。
- HTTP モードには `botToken` + `signingSecret` が必要です。
- `botToken`、`appToken`、`signingSecret`、`userToken` は、平文
  文字列または SecretRef オブジェクトを受け付けます。
- 設定内のトークンは env フォールバックより優先されます。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` の env フォールバックはデフォルトアカウントにのみ適用されます。
- `userToken`（`xoxp-...`）は設定専用（env フォールバックなし）で、デフォルトは読み取り専用動作（`userTokenReadOnly: true`）です。

ステータススナップショットの動作:

- Slack アカウント検査は、認証情報ごとの `*Source` と `*Status`
  フィールド（`botToken`、`appToken`、`signingSecret`、`userToken`）を追跡します。
- ステータスは `available`、`configured_unavailable`、または `missing` です。
- `configured_unavailable` は、アカウントが SecretRef
  または別の非インラインシークレットソースを通じて設定されているものの、現在のコマンド/ランタイムパスでは
  実際の値を解決できなかったことを意味します。
- HTTP モードでは `signingSecretStatus` が含まれます。Socket Mode では、
  必須のペアは `botTokenStatus` + `appTokenStatus` です。

<Tip>
アクション/ディレクトリ読み取りでは、設定されている場合にユーザートークンを優先できます。書き込みでは、bot トークンが引き続き優先されます。ユーザートークンによる書き込みは、`userTokenReadOnly: false` かつ bot トークンが利用できない場合にのみ許可されます。
</Tip>

## アクションとゲート

Slack アクションは `channels.slack.actions.*` で制御されます。

現在の Slack ツールで利用できるアクショングループ:

| グループ   | デフォルト |
| ---------- | ------- |
| messages   | 有効 |
| reactions  | 有効 |
| pins       | 有効 |
| memberInfo | 有効 |
| emojiList  | 有効 |

現在の Slack メッセージアクションには、`send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info`、`emoji-list` が含まれます。`download-file` はインバウンドファイルプレースホルダーに表示される Slack ファイル ID を受け付け、画像の場合は画像プレビューを、その他のファイルタイプの場合はローカルファイルメタデータを返します。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.slack.dmPolicy` は DM アクセスを制御します。`channels.slack.allowFrom` は正規の DM 許可リストです。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.slack.allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    DM フラグ:

    - `dm.enabled`（デフォルト true）
    - `channels.slack.allowFrom`
    - `dm.allowFrom`（レガシー）
    - `dm.groupEnabled`（グループ DM はデフォルト false）
    - `dm.groupChannels`（任意の MPIM 許可リスト）

    複数アカウントの優先順位:

    - `channels.slack.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントは、独自の `allowFrom` が未設定の場合に `channels.slack.allowFrom` を継承します。
    - 名前付きアカウントは `channels.slack.accounts.default.allowFrom` を継承しません。

    レガシーの `channels.slack.dm.policy` と `channels.slack.dm.allowFrom` は互換性のために引き続き読み取られます。`openclaw doctor --fix` は、アクセスを変更せずに実行できる場合、それらを `dmPolicy` と `allowFrom` に移行します。

    DM でのペアリングには `openclaw pairing approve slack <code>` を使用します。

  </Tab>

  <Tab title="チャンネルポリシー">
    `channels.slack.groupPolicy` はチャンネル処理を制御します。

    - `open`
    - `allowlist`
    - `disabled`

    チャンネル許可リストは `channels.slack.channels` 配下にあり、設定キーとして **安定した Slack チャンネル ID**（例: `C12345678`）を使用する必要があります。

    ランタイムメモ: `channels.slack` が完全に存在しない場合（env のみのセットアップ）、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに記録します（`channels.defaults.groupPolicy` が設定されている場合でも）。

    名前/ID 解決:

    - チャンネル許可リストエントリと DM 許可リストエントリは、トークンアクセスで許可される場合に起動時に解決されます
    - 未解決のチャンネル名エントリは設定どおり保持されますが、デフォルトではルーティングでは無視されます
    - インバウンド認可とチャンネルルーティングはデフォルトで ID 優先です。直接のユーザー名/スラッグ照合には `channels.slack.dangerouslyAllowNameMatching: true` が必要です

    <Warning>
    名前ベースのキー（`#channel-name` または `channel-name`）は `groupPolicy: "allowlist"` では一致しません。チャンネル検索はデフォルトで ID 優先のため、名前ベースのキーではルーティングが成功することはなく、そのチャンネル内のすべてのメッセージは黙ってブロックされます。これは `groupPolicy: "open"` とは異なります。この場合、チャンネルキーはルーティングに不要で、名前ベースのキーが機能しているように見えます。

    常に Slack チャンネル ID をキーとして使用してください。見つけるには、Slack でチャンネルを右クリック → **リンクをコピー** — ID（`C...`）が URL の末尾に表示されます。

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

    不正な例（`groupPolicy: "allowlist"` では黙ってブロックされます）:

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
    チャンネルメッセージはデフォルトでメンションゲートされます。

    メンションソース:

    - 明示的なアプリメンション（`<@botId>`）
    - bot ユーザーがそのユーザーグループのメンバーである場合の Slack ユーザーグループメンション（`<!subteam^S...>`）。`usergroups:read` が必要です
    - メンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバック `messages.groupChat.mentionPatterns`）
    - 暗黙的な bot への返信スレッド動作（`thread.requireExplicitMention` が `true` の場合は無効）

    チャンネルごとの制御（`channels.slack.channels.<id>`。名前は起動時解決または `dangerouslyAllowNameMatching` 経由のみ）:

    - `requireMention`
    - `users`（許可リスト）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` キー形式: `id:`、`e164:`、`username:`、`name:`、または `"*"` ワイルドカード
      （レガシーの接頭辞なしキーは引き続き `id:` のみにマップされます）

    `allowBots` はチャンネルとプライベートチャンネルでは保守的です。bot が作成したルームメッセージは、送信 bot がそのルームの `users` 許可リストに明示的に記載されている場合、または `channels.slack.allowFrom` からの明示的な Slack オーナー ID の少なくとも 1 つが現在ルームメンバーである場合にのみ受け入れられます。ワイルドカードと表示名のオーナーエントリはオーナー存在の条件を満たしません。オーナー存在は Slack `conversations.members` を使用します。アプリにルームタイプに対応する読み取りスコープ（パブリックチャンネルは `channels:read`、プライベートチャンネルは `groups:read`）があることを確認してください。メンバー検索に失敗した場合、OpenClaw は bot が作成したルームメッセージをドロップします。

  </Tab>
</Tabs>

## スレッド、セッション、返信タグ

- DM は `direct` として、チャンネルは `channel` として、MPIM は `group` としてルーティングされます。
- Slack ルートバインディングは、生のピア ID に加えて、`channel:C12345678`、`user:U12345678`、`<@U12345678>` などの Slack ターゲット形式を受け付けます。
- デフォルトの `session.dmScope=main` では、Slack DM はエージェントのメインセッションに集約されます。
- チャンネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- スレッド返信は、該当する場合にスレッドセッションサフィックス（`:thread:<threadTs>`）を作成できます。
- `channels.slack.thread.historyScope` のデフォルトは `thread` です。`thread.inheritParent` のデフォルトは `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッドセッション開始時に取得される既存スレッドメッセージ数を制御します（デフォルト `20`。無効にするには `0` を設定）。
- `channels.slack.thread.requireExplicitMention`（デフォルト `false`）: `true` の場合、暗黙的なスレッドメンションを抑制し、bot がすでにスレッドに参加している場合でも、スレッド内の明示的な `@bot` メンションにのみ bot が応答します。これがない場合、bot が参加したスレッドでの返信は `requireMention` ゲートを迂回します。

返信スレッド制御:

- `channels.slack.replyToMode`: `off|first|all|batched`（デフォルト `off`）
- `channels.slack.replyToModeByChatType`: `direct|group|channel` ごと
- ダイレクトチャット向けのレガシーフォールバック: `channels.slack.dm.replyToMode`

手動返信タグがサポートされています。

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含む Slack の **すべての** 返信スレッド化を無効にします。これは、`"off"` モードでも明示的なタグが引き続き尊重される Telegram とは異なります。Slack スレッドはメッセージをチャンネルから隠しますが、Telegram の返信はインラインで表示されたままです。
</Note>

## Ack リアクション

`ackReaction` は、OpenClaw がインバウンドメッセージを処理している間、確認用絵文字を送信します。

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- エージェント ID 絵文字フォールバック（`agents.list[].identity.emoji`、それ以外は "👀"）

メモ:

- Slack はショートコード（例: `"eyes"`）を想定します。
- Slack アカウントまたはグローバルでリアクションを無効にするには `""` を使用します。

## テキストストリーミング

`channels.slack.streaming` はライブプレビュー動作を制御します。

- `off`: ライブプレビューストリーミングを無効にします。
- `partial`（デフォルト）: プレビューテキストを最新の部分出力で置き換えます。
- `block`: チャンク化されたプレビュー更新を追加します。
- `progress`: 生成中に進捗ステータステキストを表示し、その後最終テキストを送信します。
- `streaming.preview.toolProgress`: ドラフトプレビューがアクティブな場合、ツール/進捗更新を同じ編集済みプレビューメッセージにルーティングします（デフォルト: `true`）。個別のツール/進捗メッセージを保持するには `false` を設定します。

`channels.slack.streaming.nativeTransport` は、`channels.slack.streaming.mode` が `partial` の場合の Slack ネイティブテキストストリーミングを制御します（デフォルト: `true`）。

- ネイティブテキストストリーミングと Slack アシスタントスレッドステータスを表示するには、返信スレッドが利用可能である必要があります。スレッド選択は引き続き `replyToMode` に従います。
- チャンネルとグループチャットのルートは、ネイティブストリーミングが利用できない場合でも通常のドラフトプレビューを使用できます。
- トップレベルの Slack DM はデフォルトでスレッド外のままなので、スレッド形式のプレビューは表示されません。そこで進捗を表示したい場合は、スレッド返信または `typingReaction` を使用してください。
- メディアと非テキストペイロードは通常配信にフォールバックします。
- メディア/エラーの最終出力は保留中のプレビュー編集をキャンセルします。対象となるテキスト/ブロックの最終出力は、プレビューをその場で編集できる場合にのみフラッシュされます。
- ストリーミングが返信の途中で失敗した場合、OpenClaw は残りのペイロードについて通常配信にフォールバックします。

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

- `channels.slack.streamMode`（`replace | status_final | append`）は `channels.slack.streaming.mode` に自動移行されます。
- boolean `channels.slack.streaming` は `channels.slack.streaming.mode` と `channels.slack.streaming.nativeTransport` に自動移行されます。
- レガシーの `channels.slack.nativeStreaming` は `channels.slack.streaming.nativeTransport` に自動移行されます。

## 入力中リアクションフォールバック

`typingReaction` は、OpenClaw が返信を処理している間、インバウンド Slack メッセージに一時的なリアクションを追加し、実行が終了すると削除します。これはデフォルトの「is typing...」ステータスインジケーターを使用するスレッド返信の外で最も便利です。

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

メモ:

- Slack はショートコード（例: `"hourglass_flowing_sand"`）を想定します。
- リアクションはベストエフォートであり、返信または失敗パスの完了後にクリーンアップが自動的に試行されます。

## メディア、チャンク化、配信

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Slack のファイル添付は、Slack がホストするプライベート URL（トークン認証付きリクエストフロー）からダウンロードされ、取得に成功しサイズ制限が許す場合にメディアストアへ書き込まれます。ファイルのプレースホルダーには Slack の `fileId` が含まれるため、エージェントは `download-file` で元のファイルを取得できます。

    ダウンロードには、制限付きのアイドルタイムアウトと合計タイムアウトが使用されます。Slack ファイルの取得が停止または失敗した場合でも、OpenClaw はメッセージ処理を継続し、ファイルプレースホルダーにフォールバックします。

    実行時の受信サイズ上限は、`channels.slack.mediaMaxMb` で上書きされない限り、デフォルトで `20MB` です。

  </Accordion>

  <Accordion title="Outbound text and files">
    - テキストチャンクは `channels.slack.textChunkLimit`（デフォルト 4000）を使用します
    - `channels.slack.chunkMode="newline"` は段落優先の分割を有効にします
    - ファイル送信は Slack アップロード API を使用し、スレッド返信（`thread_ts`）を含められます
    - 送信メディア上限は、設定されている場合は `channels.slack.mediaMaxMb` に従います。そうでない場合、チャネル送信はメディアパイプラインの MIME 種別デフォルトを使用します

  </Accordion>

  <Accordion title="Delivery targets">
    推奨される明示的なターゲット:

    - DM には `user:<id>`
    - チャネルには `channel:<id>`

    テキストまたはブロックのみの Slack DM は、ユーザー ID へ直接投稿できます。ファイルアップロードとスレッド送信では、具体的な会話 ID が必要なため、まず Slack 会話 API 経由で DM を開きます。

  </Accordion>
</AccordionGroup>

## コマンドとスラッシュの動作

スラッシュコマンドは Slack では、単一の設定済みコマンドまたは複数のネイティブコマンドとして表示されます。コマンドのデフォルトを変更するには `channels.slack.slashCommand` を設定します:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

ネイティブコマンドには Slack アプリで [追加のマニフェスト設定](#additional-manifest-settings) が必要であり、代わりに `channels.slack.commands.native: true` またはグローバル設定の `commands.native: true` で有効にします。

- Slack ではネイティブコマンドの自動モードは **オフ** のため、`commands.native: "auto"` では Slack ネイティブコマンドは有効になりません。

```txt
/help
```

ネイティブ引数メニューは、選択されたオプション値をディスパッチする前に確認モーダルを表示する適応型レンダリング戦略を使用します:

- 最大 5 個のオプション: ボタンブロック
- 6〜100 個のオプション: 静的選択メニュー
- 100 個を超えるオプション: インタラクティビティのオプションハンドラーが利用可能な場合、非同期オプションフィルタリング付きの外部選択
- Slack の制限超過: エンコードされたオプション値はボタンにフォールバックします

```txt
/think
```

スラッシュセッションは `agent:<agentId>:slack:slash:<userId>` のような分離されたキーを使用し、それでも `CommandTargetSessionKey` を使ってコマンド実行をターゲット会話セッションへルーティングします。

## インタラクティブ返信

Slack はエージェント作成のインタラクティブ返信コントロールをレンダリングできますが、この機能はデフォルトで無効です。

グローバルに有効にします:

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

または、1 つの Slack アカウントだけで有効にします:

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

有効にすると、エージェントは Slack 専用の返信ディレクティブを出力できます:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

これらのディレクティブは Slack Block Kit にコンパイルされ、クリックや選択を既存の Slack インタラクションイベント経路に戻します。

注:

- これは Slack 固有の UI です。他のチャネルは Slack Block Kit ディレクティブをそれぞれのボタンシステムに変換しません。
- インタラクティブコールバック値は OpenClaw が生成する不透明なトークンであり、エージェントが作成した生の値ではありません。
- 生成されたインタラクティブブロックが Slack Block Kit の制限を超える場合、OpenClaw は無効なブロックペイロードを送信する代わりに、元のテキスト返信へフォールバックします。

## Slack での Exec 承認

Slack は、Web UI や端末へのフォールバックの代わりに、インタラクティブボタンとインタラクションを備えたネイティブ承認クライアントとして動作できます。

- Exec 承認は、ネイティブ DM/チャネルルーティングに `channels.slack.execApprovals.*` を使用します。
- Plugin 承認は、リクエストがすでに Slack に届いており、承認 ID 種別が `plugin:` の場合、同じ Slack ネイティブのボタン面から引き続き解決できます。
- 承認者の認可は引き続き強制されます。承認者として識別されたユーザーのみが、Slack 経由でリクエストを承認または拒否できます。

これは他のチャネルと同じ共有承認ボタン面を使用します。Slack アプリ設定で `interactivity` が有効な場合、承認プロンプトは会話内に直接 Block Kit ボタンとしてレンダリングされます。
これらのボタンが存在する場合、それらが主要な承認 UX です。OpenClaw は、ツール結果がチャット承認を利用できない、または手動承認が唯一の経路であると示す場合にのみ、手動の `/approve` コマンドを含めるべきです。

設定パス:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（任意。可能な場合は `commands.ownerAllowFrom` にフォールバックします）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `agentFilter`, `sessionFilter`

Slack は、`enabled` が未設定または `"auto"` で、少なくとも 1 人の承認者が解決される場合、ネイティブ Exec 承認を自動的に有効にします。Slack をネイティブ承認クライアントとして明示的に無効にするには `enabled: false` を設定します。
承認者が解決される場合にネイティブ承認を強制的にオンにするには、`enabled: true` を設定します。

明示的な Slack Exec 承認設定がない場合のデフォルト動作:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

明示的な Slack ネイティブ設定が必要なのは、承認者を上書きする、フィルターを追加する、または発信元チャット配信を選択する場合だけです:

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

共有 `approvals.exec` 転送は別です。Exec 承認プロンプトを他のチャットや明示的な帯域外ターゲットにもルーティングする必要がある場合にのみ使用してください。共有 `approvals.plugin` 転送も別です。Slack ネイティブボタンは、それらのリクエストがすでに Slack に届いている場合、Plugin 承認を引き続き解決できます。

同じチャットでの `/approve` は、すでにコマンドをサポートしている Slack チャネルと DM でも動作します。完全な承認転送モデルについては [Exec 承認](/ja-JP/tools/exec-approvals) を参照してください。

## イベントと運用上の動作

- メッセージの編集/削除はシステムイベントにマッピングされます。
- スレッドブロードキャスト（「チャネルにも送信」スレッド返信）は通常のユーザーメッセージとして処理されます。
- リアクションの追加/削除イベントはシステムイベントにマッピングされます。
- メンバーの参加/退出、チャネルの作成/名前変更、ピンの追加/削除イベントはシステムイベントにマッピングされます。
- `configWrites` が有効な場合、`channel_id_changed` はチャネル設定キーを移行できます。
- チャネルのトピック/目的メタデータは信頼できないコンテキストとして扱われ、ルーティングコンテキストに注入される場合があります。
- スレッド開始メッセージと初期スレッド履歴コンテキストのシードは、該当する場合、設定済みの送信者許可リストでフィルターされます。
- ブロックアクションとモーダルインタラクションは、豊富なペイロードフィールドを持つ構造化された `Slack interaction: ...` システムイベントを出力します:
  - ブロックアクション: 選択値、ラベル、ピッカー値、`workflow_*` メタデータ
  - モーダル `view_submission` と `view_closed` イベント。ルーティング済みチャネルメタデータとフォーム入力を含みます

## 設定リファレンス

主要リファレンス: [設定リファレンス - Slack](/ja-JP/gateway/config-channels#slack)。

<Accordion title="High-signal Slack fields">

- モード/認証: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM アクセス: `dm.enabled`, `dmPolicy`, `allowFrom`（レガシー: `dm.policy`, `dm.allowFrom`）, `dm.groupEnabled`, `dm.groupChannels`
- 互換性トグル: `dangerouslyAllowNameMatching`（緊急回避用。必要な場合以外はオフのままにします）
- チャネルアクセス: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- スレッド/履歴: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 配信: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- 運用/機能: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="No replies in channels">
    次の順序で確認します:

    - `groupPolicy`
    - チャネル許可リスト（`channels.slack.channels`）— **キーはチャネル ID**（`C12345678`）である必要があり、名前（`#channel-name`）ではありません。チャネルルーティングはデフォルトで ID 優先のため、`groupPolicy: "allowlist"` では名前ベースのキーは静かに失敗します。ID を見つけるには、Slack でチャネルを右クリック → **リンクをコピー** — URL 末尾の `C...` 値がチャネル ID です。
    - `requireMention`
    - チャネルごとの `users` 許可リスト

    役立つコマンド:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM messages ignored">
    確認項目:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（またはレガシーの `channels.slack.dm.policy`）
    - ペアリング承認 / 許可リストエントリ
    - Slack Assistant DM イベント: `drop message_changed` に言及する詳細ログは、通常、メッセージメタデータ内に復元可能な人間の送信者がない、編集済みの Assistant スレッドイベントを Slack が送信したことを意味します

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode not connecting">
    Slack アプリ設定で bot + app トークンと Socket Mode の有効化を検証します。

    `openclaw channels status --probe --json` が `botTokenStatus` または
    `appTokenStatus: "configured_unavailable"` を示す場合、Slack アカウントは
    設定されていますが、現在のランタイムが SecretRef に裏付けられた
    値を解決できませんでした。

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    検証項目:

    - 署名シークレット
    - Webhook パス
    - Slack Request URL（Events + Interactivity + Slash Commands）
    - HTTP アカウントごとの一意の `webhookPath`

    アカウントスナップショットに `signingSecretStatus: "configured_unavailable"` が表示される場合、
    HTTP アカウントは設定されていますが、現在のランタイムが SecretRef に裏付けられた署名シークレットを
    解決できませんでした。

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    意図していたものがどちらかを確認します:

    - Slack に登録された一致するスラッシュコマンドを使うネイティブコマンドモード（`channels.slack.commands.native: true`）
    - または単一スラッシュコマンドモード（`channels.slack.slashCommand.enabled: true`）

    `commands.useAccessGroups` とチャネル/ユーザー許可リストも確認してください。

  </Accordion>
</AccordionGroup>

## 添付 vision リファレンス

Slack ファイルのダウンロードに成功しサイズ制限が許す場合、Slack はダウンロード済みメディアをエージェントターンに添付できます。画像ファイルはメディア理解パスを通すか、vision 対応の返信モデルへ直接渡せます。他のファイルは画像入力として扱われるのではなく、ダウンロード可能なファイルコンテキストとして保持されます。

### サポートされるメディアタイプ

| メディア種別                     | ソース               | 現在の動作                                                                  | 注記                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 画像 | Slack ファイル URL       | ダウンロードされ、ビジョン対応処理のためにターンへ添付される                   | ファイルごとの上限: `channels.slack.mediaMaxMb` (デフォルト 20 MB)                 |
| PDF ファイル                      | Slack ファイル URL       | ダウンロードされ、`download-file` や `pdf` などのツール用のファイルコンテキストとして公開される | Slack インバウンドは PDF を画像ビジョン入力へ自動変換しない |
| その他のファイル                    | Slack ファイル URL       | 可能な場合はダウンロードされ、ファイルコンテキストとして公開される                              | バイナリファイルは画像入力として扱われない                               |
| スレッド返信                 | スレッド開始メッセージのファイル | 返信に直接メディアがない場合、ルートメッセージのファイルをコンテキストとしてハイドレートできる  | ファイルのみの開始メッセージでは添付プレースホルダーを使用する                          |
| 複数画像メッセージ           | 複数の Slack ファイル | 各ファイルは独立して評価される                                              | Slack の処理はメッセージごとに最大 8 ファイルに制限される                     |

### インバウンドパイプライン

ファイル添付付きの Slack メッセージが届いた場合:

1. OpenClaw は bot トークン (`xoxb-...`) を使用して、Slack のプライベート URL からファイルをダウンロードする。
2. 成功すると、ファイルはメディアストアに書き込まれる。
3. ダウンロードされたメディアパスとコンテンツタイプがインバウンドコンテキストに追加される。
4. 画像対応のモデル/ツールパスは、そのコンテキストの画像添付を使用できる。
5. 画像以外のファイルは、それらを扱えるツール向けに、ファイルメタデータまたはメディア参照として引き続き利用できる。

### スレッドルート添付の継承

メッセージがスレッド内で届いた場合 (`thread_ts` 親を持つ場合):

- 返信自体に直接メディアがなく、含まれるルートメッセージにファイルがある場合、Slack はルートファイルをスレッド開始コンテキストとしてハイドレートできる。
- 直接の返信添付は、ルートメッセージの添付より優先される。
- ファイルのみでテキストがないルートメッセージは、フォールバックがそのファイルを引き続き含められるよう、添付プレースホルダーで表現される。

### 複数添付の処理

単一の Slack メッセージに複数のファイル添付が含まれる場合:

- 各添付はメディアパイプラインを通じて独立して処理される。
- ダウンロードされたメディア参照はメッセージコンテキストに集約される。
- 処理順序はイベントペイロード内の Slack ファイル順に従う。
- 1 つの添付のダウンロードに失敗しても、他の添付はブロックされない。

### サイズ、ダウンロード、モデルの制限

- **サイズ上限**: デフォルトはファイルごとに 20 MB。`channels.slack.mediaMaxMb` で設定可能。
- **ダウンロード失敗**: Slack が提供できないファイル、期限切れ URL、アクセスできないファイル、サイズ超過ファイル、Slack 認証/ログイン HTML レスポンスは、未対応形式として報告されるのではなくスキップされる。
- **ビジョンモデル**: 画像分析は、ビジョンに対応している場合はアクティブな返信モデルを使用し、そうでない場合は `agents.defaults.imageModel` に設定された画像モデルを使用する。

### 既知の制限

| シナリオ                               | 現在の動作                                                             | 回避策                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 期限切れの Slack ファイル URL                 | ファイルはスキップされ、エラーは表示されない                                                 | Slack にファイルを再アップロードする                                                |
| ビジョンモデルが設定されていない            | 画像添付はメディア参照として保存されるが、画像として分析されない | `agents.defaults.imageModel` を設定するか、ビジョン対応の返信モデルを使用する |
| 非常に大きい画像 (デフォルトでは > 20 MB) | サイズ上限によりスキップされる                                                         | Slack が許可する場合は `channels.slack.mediaMaxMb` を増やす                       |
| 転送/共有された添付           | テキストと Slack ホストの画像/ファイルメディアはベストエフォート                       | OpenClaw スレッドで直接再共有する                                   |
| PDF 添付                        | ファイル/メディアコンテキストとして保存され、画像ビジョンには自動的にルーティングされない  | ファイルメタデータには `download-file` を、PDF 分析には `pdf` ツールを使用する   |

### 関連ドキュメント

- [メディア理解パイプライン](/ja-JP/nodes/media-understanding)
- [PDF ツール](/ja-JP/tools/pdf)
- エピック: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack 添付のビジョン有効化
- 回帰テスト: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- ライブ検証: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## 関連

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    Slack ユーザーを Gateway にペアリングする。
  </Card>
  <Card title="Groups" icon="users" href="/ja-JP/channels/groups">
    チャンネルとグループ DM の動作。
  </Card>
  <Card title="Channel routing" icon="route" href="/ja-JP/channels/channel-routing">
    インバウンドメッセージをエージェントにルーティングする。
  </Card>
  <Card title="Security" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルとハードニング。
  </Card>
  <Card title="Configuration" icon="sliders" href="/ja-JP/gateway/configuration">
    設定レイアウトと優先順位。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ja-JP/tools/slash-commands">
    コマンドカタログと動作。
  </Card>
</CardGroup>
