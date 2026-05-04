---
read_when:
    - Slack のセットアップまたは Slack のソケット/HTTP モードのデバッグ
summary: Slack のセットアップとランタイム動作（Socket Mode + HTTP Request URLs）
title: Slack
x-i18n:
    generated_at: "2026-05-04T04:58:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2be45f03511a64373b1f4316c59800eeeef8baccb4c00454b49999258b2e546b
    source_path: channels/slack.md
    workflow: 16
---

DM とチャンネル向けに、Slack アプリ連携で本番運用可能です。デフォルトモードはソケットモードです。HTTPリクエストURLにも対応しています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Slack DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復手順。
  </Card>
</CardGroup>

## クイックセットアップ

<Tabs>
  <Tab title="ソケットモード（デフォルト）">
    <Steps>
      <Step title="新しい Slack アプリを作成する">
        Slack アプリ設定で **[新しいアプリを作成](https://api.slack.com/apps/new)** ボタンを押します。

        - **マニフェストから** を選び、アプリ用のワークスペースを選択します
        - 下の [サンプルマニフェスト](#manifest-and-scope-checklist) を貼り付け、作成へ進みます
        - `connections:write` を持つ **アプリレベルトークン**（`xapp-...`）を生成します
        - アプリをインストールし、表示された **ボットトークン**（`xoxb-...`）をコピーします

      </Step>

      <Step title="OpenClaw を設定する">

        推奨の SecretRef セットアップ:

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

  <Tab title="HTTPリクエストURL">
    <Steps>
      <Step title="新しい Slack アプリを作成する">
        Slack アプリ設定で **[新しいアプリを作成](https://api.slack.com/apps/new)** ボタンを押します。

        - **マニフェストから** を選び、アプリ用のワークスペースを選択します
        - [サンプルマニフェスト](#manifest-and-scope-checklist) を貼り付け、作成前にURLを更新します
        - リクエスト検証用の **署名シークレット** を保存します
        - アプリをインストールし、表示された **ボットトークン**（`xoxb-...`）をコピーします

      </Step>

      <Step title="OpenClaw を設定する">

        推奨の SecretRef セットアップ:

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
        複数アカウントのHTTPでは一意のWebhookパスを使用してください

        登録が衝突しないように、各アカウントへ個別の `webhookPath`（デフォルトは `/slack/events`）を指定してください。
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

OpenClaw はソケットモードで、Slack SDK クライアントのpongタイムアウトをデフォルトで15秒に設定します。ワークスペースまたはホスト固有の調整が必要な場合にのみ、トランスポート設定を上書きしてください。

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

これは、Slack websocket のpongタイムアウトやserver-pingタイムアウトがログに記録されるソケットモードのワークスペース、またはイベントループの枯渇が既知のホストでのみ使用してください。`clientPingTimeout` は SDK がクライアントpingを送信した後のpong待機時間です。`serverPingTimeout` は Slack サーバーpingの待機時間です。アプリメッセージとイベントはアプリケーション状態のままであり、トランスポートの生存確認シグナルではありません。

## マニフェストとスコープのチェックリスト

基本の Slack アプリマニフェストは、ソケットモードとHTTPリクエストURLで同じです。異なるのは `settings` ブロック（およびスラッシュコマンドの `url`）だけです。

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

**HTTPリクエストURLモード** では、`settings` をHTTP版に置き換え、各スラッシュコマンドに `url` を追加します。公開URLが必要です。

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

デフォルトのマニフェストでは、Slack App Home の **ホーム** タブが有効になり、`app_home_opened` を購読します。ワークスペースメンバーがホームタブを開くと、OpenClaw は `views.publish` で安全なデフォルトのホームビューを公開します。会話ペイロードや非公開設定は含まれません。Slack DM 向けに **メッセージ** タブは有効なままです。

<AccordionGroup>
  <Accordion title="任意のネイティブスラッシュコマンド">

    単一の設定済みコマンドの代わりに複数の [ネイティブスラッシュコマンド](#commands-and-slash-behavior) を使えますが、いくつか注意点があります。

    - `/status` コマンドは予約済みのため、`/status` の代わりに `/agentstatus` を使用してください。
    - 同時に利用可能にできるスラッシュコマンドは25個までです。

    既存の `features.slash_commands` セクションを [利用可能なコマンド](/ja-JP/tools/slash-commands#command-list) の一部に置き換えます。

    <Tabs>
      <Tab title="ソケットモード（デフォルト）">

```json
{
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
      "command": "/side",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Control the usage footer or show cost summary",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTPリクエストURL">
        上記のソケットモードと同じ `slash_commands` リストを使用し、すべての項目に `"url": "https://gateway-host.example.com/slack/events"` を追加します。例:

```json
{
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
  ]
}
```

        リスト内のすべてのコマンドで同じ `url` 値を繰り返します。

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="任意の authorship スコープ（書き込み操作）">
    送信メッセージでデフォルトの Slack アプリ ID ではなく、アクティブなエージェント ID（カスタムユーザー名とアイコン）を使いたい場合は、`chat:write.customize` bot スコープを追加します。

    絵文字アイコンを使う場合、Slack は `:emoji_name:` 構文を想定します。

  </Accordion>
  <Accordion title="任意の user-token スコープ（読み取り操作）">
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
- `botToken`, `appToken`, `signingSecret`, `userToken` は、プレーンテキスト文字列または SecretRef オブジェクトを受け付けます。
- 設定トークンは env フォールバックより優先されます。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env フォールバックはデフォルトアカウントにのみ適用されます。
- `userToken`（`xoxp-...`）は設定専用（env フォールバックなし）で、デフォルトでは読み取り専用の動作（`userTokenReadOnly: true`）になります。

ステータススナップショットの動作:

- Slack アカウント検査は、認証情報ごとの `*Source` と `*Status` フィールド（`botToken`, `appToken`, `signingSecret`, `userToken`）を追跡します。
- ステータスは `available`, `configured_unavailable`, `missing` のいずれかです。
- `configured_unavailable` は、そのアカウントが SecretRef または別の非インラインシークレットソースを通じて設定されているものの、現在のコマンドまたはランタイムパスでは実際の値を解決できなかったことを意味します。
- HTTP モードでは `signingSecretStatus` が含まれます。Socket Mode では必要なペアは `botTokenStatus` + `appTokenStatus` です。

<Tip>
アクションやディレクトリ読み取りでは、設定されている場合に user token が優先されることがあります。書き込みでは bot token が引き続き優先されます。user-token 書き込みは、`userTokenReadOnly: false` で、かつ bot token が利用できない場合にのみ許可されます。
</Tip>

## アクションとゲート

Slack アクションは `channels.slack.actions.*` で制御されます。

現在の Slack ツールで利用できるアクショングループ:

| グループ      | デフォルト |
| ---------- | ------- |
| messages   | 有効 |
| reactions  | 有効 |
| pins       | 有効 |
| memberInfo | 有効 |
| emojiList  | 有効 |

現在の Slack メッセージアクションには、`send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info`, `emoji-list` があります。`download-file` は受信ファイルプレースホルダーに表示される Slack ファイル ID を受け取り、画像の場合は画像プレビューを、それ以外のファイル種別の場合はローカルファイルメタデータを返します。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.slack.dmPolicy` は DM アクセスを制御します。`channels.slack.allowFrom` は正規の DM 許可リストです。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.slack.allowFrom` に `"*"` が含まれている必要があります）
    - `disabled`

    DM フラグ:

    - `dm.enabled`（デフォルト true）
    - `channels.slack.allowFrom`
    - `dm.allowFrom`（レガシー）
    - `dm.groupEnabled`（グループ DM のデフォルトは false）
    - `dm.groupChannels`（任意の MPIM 許可リスト）

    複数アカウントでの優先順位:

    - `channels.slack.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントは、自身の `allowFrom` が未設定の場合に `channels.slack.allowFrom` を継承します。
    - 名前付きアカウントは `channels.slack.accounts.default.allowFrom` を継承しません。

    レガシーの `channels.slack.dm.policy` と `channels.slack.dm.allowFrom` は、互換性のために引き続き読み取られます。`openclaw doctor --fix` は、アクセスを変更せずに実行できる場合、それらを `dmPolicy` と `allowFrom` に移行します。

    DM でのペアリングには `openclaw pairing approve slack <code>` を使います。

  </Tab>

  <Tab title="チャンネルポリシー">
    `channels.slack.groupPolicy` はチャンネル処理を制御します。

    - `open`
    - `allowlist`
    - `disabled`

    チャンネル許可リストは `channels.slack.channels` 配下にあり、設定キーとして**安定した Slack チャンネル ID**（例: `C12345678`）を使う必要があります。

    ランタイム上の注意: `channels.slack` が完全に存在しない場合（env のみのセットアップ）、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに出力します（`channels.defaults.groupPolicy` が設定されている場合でも同様です）。

    名前/ID 解決:

    - チャンネル許可リストエントリと DM 許可リストエントリは、トークンアクセスで許可される場合、起動時に解決されます
    - 未解決のチャンネル名エントリは設定されたまま保持されますが、デフォルトではルーティングでは無視されます
    - 受信認可とチャンネルルーティングはデフォルトで ID 優先です。直接のユーザー名/スラッグ照合には `channels.slack.dangerouslyAllowNameMatching: true` が必要です

    <Warning>
    名前ベースのキー（`#channel-name` または `channel-name`）は `groupPolicy: "allowlist"` では一致しません。チャンネル検索はデフォルトで ID 優先のため、名前ベースのキーでは正常にルーティングされず、そのチャンネル内のすべてのメッセージがサイレントにブロックされます。これは、チャンネルキーがルーティングに不要で、名前ベースのキーが機能しているように見える `groupPolicy: "open"` とは異なります。

    キーには必ず Slack チャンネル ID を使ってください。確認するには、Slack でチャンネルを右クリック → **Copy link** — URL の末尾に ID（`C...`）が表示されます。

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

    誤った例（`groupPolicy: "allowlist"` ではサイレントにブロックされます）:

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
    チャンネルメッセージはデフォルトでメンションによってゲートされます。

    メンションソース:

    - 明示的なアプリメンション（`<@botId>`）
    - bot ユーザーがそのユーザーグループのメンバーである場合の Slack ユーザーグループメンション（`<!subteam^S...>`）。`usergroups:read` が必要です
    - メンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - bot への暗黙的な返信スレッド動作（`thread.requireExplicitMention` が `true` の場合は無効）

    チャンネルごとの制御（`channels.slack.channels.<id>`。名前は起動時解決または `dangerouslyAllowNameMatching` 経由のみ）:

    - `requireMention`
    - `users`（許可リスト）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` キー形式: `id:`, `e164:`, `username:`, `name:`, または `"*"` ワイルドカード
      （レガシーの接頭辞なしキーは引き続き `id:` のみにマップされます）

    `allowBots` はチャンネルとプライベートチャンネルでは保守的です。bot が作成したルームメッセージは、送信元 bot がそのルームの `users` 許可リストに明示的に記載されている場合、または `channels.slack.allowFrom` の明示的な Slack 所有者 ID の少なくとも 1 つが現在ルームメンバーである場合にのみ受け付けられます。ワイルドカードや表示名の所有者エントリは、所有者の存在を満たしません。所有者の存在確認には Slack `conversations.members` を使います。アプリにルーム種別に対応する読み取りスコープ（公開チャンネルは `channels:read`、プライベートチャンネルは `groups:read`）があることを確認してください。メンバー検索に失敗した場合、OpenClaw は bot が作成したルームメッセージを破棄します。

  </Tab>
</Tabs>

## スレッド、セッション、返信タグ

- DM は `direct` として、チャンネルは `channel` として、MPIM は `group` としてルーティングされます。
- Slack ルートバインディングは、生のピア ID に加えて、`channel:C12345678`, `user:U12345678`, `<@U12345678>` などの Slack ターゲット形式を受け付けます。
- デフォルトの `session.dmScope=main` では、Slack DM はエージェントのメインセッションに集約されます。
- チャンネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- スレッド返信は、該当する場合にスレッドセッションサフィックス（`:thread:<threadTs>`）を作成できます。
- `channels.slack.thread.historyScope` のデフォルトは `thread` です。`thread.inheritParent` のデフォルトは `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッドセッションが開始するときに取得する既存スレッドメッセージ数を制御します（デフォルトは `20`。無効にするには `0` を設定します）。
- `channels.slack.thread.requireExplicitMention`（デフォルト `false`）: `true` の場合、bot がすでにスレッドに参加していても、bot はスレッド内の明示的な `@bot` メンションにのみ応答するよう、暗黙的なスレッドメンションを抑制します。これがない場合、bot が参加したスレッド内の返信は `requireMention` ゲートをバイパスします。

返信スレッド制御:

- `channels.slack.replyToMode`: `off|first|all|batched`（デフォルト `off`）
- `channels.slack.replyToModeByChatType`: `direct|group|channel` ごと
- 直接チャット向けのレガシーフォールバック: `channels.slack.dm.replyToMode`

手動返信タグがサポートされています。

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含む Slack の**すべて**の返信スレッドを無効にします。これは、`"off"` モードでも明示的なタグが引き続き尊重される Telegram とは異なります。Slack スレッドはメッセージをチャンネルから隠しますが、Telegram の返信はインラインで表示されたままです。
</Note>

## Ack リアクション

`ackReaction` は、OpenClaw が受信メッセージを処理している間、確認応答の絵文字を送信します。

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- エージェント ID の絵文字フォールバック（`agents.list[].identity.emoji`、それ以外は "👀"）

注記:

- Slack はショートコード（例: `"eyes"`）を想定します。
- Slack アカウントまたは全体でリアクションを無効にするには `""` を使います。

## テキストストリーミング

`channels.slack.streaming` はライブプレビューの動作を制御します。

- `off`: ライブプレビューストリーミングを無効にします。
- `partial`（デフォルト）: プレビューテキストを最新の部分出力で置き換えます。
- `block`: チャンク化されたプレビュー更新を追加します。
- `progress`: 生成中は進行状況テキストを表示し、その後に最終テキストを送信します。
- `streaming.preview.toolProgress`: 下書きプレビューが有効な場合、ツール/進行状況更新を同じ編集済みプレビューメッセージにルーティングします（デフォルト: `true`）。別々のツール/進行状況メッセージを維持するには `false` を設定します。

`channels.slack.streaming.nativeTransport` は、`channels.slack.streaming.mode` が `partial` の場合の Slack ネイティブテキストストリーミングを制御します（デフォルト: `true`）。

- ネイティブテキストストリーミングと Slack アシスタントスレッドステータスを表示するには、返信スレッドが利用可能である必要があります。スレッド選択は引き続き `replyToMode` に従います。
- ネイティブストリーミングが利用できない場合、または返信スレッドが存在しない場合でも、チャンネル、グループチャット、トップレベル DM ルートは通常の下書きプレビューを使用できます。
- トップレベルの Slack DM はデフォルトでスレッド外のままなので、Slack のスレッド形式のネイティブストリーム/ステータスプレビューは表示されません。代わりに OpenClaw は DM に下書きプレビューを投稿して編集します。
- メディアと非テキストペイロードは通常の配信にフォールバックします。
- メディア/エラーの最終出力は保留中のプレビュー編集をキャンセルします。対象となるテキスト/ブロックの最終出力は、プレビューをその場で編集できる場合にのみフラッシュされます。
- 返信の途中でストリーミングに失敗した場合、OpenClaw は残りのペイロードについて通常の配信にフォールバックします。

Slack ネイティブテキストストリーミングの代わりに下書きプレビューを使う:

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
- boolean の `channels.slack.streaming` は `channels.slack.streaming.mode` と `channels.slack.streaming.nativeTransport` に自動移行されます。
- レガシーの `channels.slack.nativeStreaming` は `channels.slack.streaming.nativeTransport` に自動移行されます。

## Typing リアクションフォールバック

`typingReaction` は、OpenClaw が返信を処理している間に受信 Slack メッセージへ一時的なリアクションを追加し、実行が終了するとそれを削除します。これは、デフォルトの "is typing..." ステータスインジケーターを使うスレッド返信の外で特に役立ちます。

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注記:

- Slack はショートコード（例: `"hourglass_flowing_sand"`）を想定します。
- リアクションはベストエフォートで、返信または失敗パスの完了後にクリーンアップが自動的に試行されます。

## メディア、チャンク分割、配信

<AccordionGroup>
  <Accordion title="受信添付ファイル">
    Slack のファイル添付は、Slack がホストするプライベート URL（トークン認証付きリクエストフロー）からダウンロードされ、取得に成功してサイズ制限が許す場合はメディアストアに書き込まれます。ファイルプレースホルダーには Slack の `fileId` が含まれるため、エージェントは `download-file` で元のファイルを取得できます。

    ダウンロードには、制限付きのアイドルタイムアウトと合計タイムアウトが使われます。Slack ファイルの取得が停止または失敗した場合でも、OpenClaw はメッセージの処理を継続し、ファイルプレースホルダーにフォールバックします。

    ランタイムの受信サイズ上限は、`channels.slack.mediaMaxMb` で上書きされない限り、デフォルトで `20MB` です。

  </Accordion>

  <Accordion title="送信テキストとファイル">
    - テキストチャンクは `channels.slack.textChunkLimit`（デフォルト 4000）を使います
    - `channels.slack.chunkMode="newline"` は段落優先の分割を有効にします
    - ファイル送信は Slack アップロード API を使い、スレッド返信（`thread_ts`）を含められます
    - 送信メディアの上限は、設定されている場合は `channels.slack.mediaMaxMb` に従います。それ以外の場合、チャンネル送信はメディアパイプラインの MIME 種別デフォルトを使います

  </Accordion>

  <Accordion title="配信ターゲット">
    推奨される明示的なターゲット:

    - DM には `user:<id>`
    - チャンネルには `channel:<id>`

    テキストまたはブロックのみの Slack DM はユーザー ID に直接投稿できます。ファイルアップロードとスレッド送信では具体的な会話 ID が必要なため、まず Slack 会話 API で DM を開きます。

  </Accordion>
</AccordionGroup>

## コマンドとスラッシュの動作

スラッシュコマンドは、Slack では単一の設定済みコマンド、または複数のネイティブコマンドとして表示されます。コマンドのデフォルトを変更するには、`channels.slack.slashCommand` を設定します。

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

ネイティブコマンドには Slack アプリで [追加のマニフェスト設定](#additional-manifest-settings) が必要で、代わりに `channels.slack.commands.native: true`、またはグローバル設定の `commands.native: true` で有効化します。

- Slack ではネイティブコマンドの自動モードが **オフ** のため、`commands.native: "auto"` は Slack ネイティブコマンドを有効化しません。

```txt
/help
```

ネイティブ引数メニューは、選択されたオプション値をディスパッチする前に確認モーダルを表示する適応型レンダリング戦略を使います。

- 最大 5 個のオプション: ボタンブロック
- 6-100 個のオプション: 静的セレクトメニュー
- 100 個を超えるオプション: インタラクティビティオプションハンドラーが利用可能な場合、非同期オプションフィルタリング付き外部セレクト
- Slack の制限超過: エンコードされたオプション値はボタンにフォールバックします

```txt
/think
```

スラッシュセッションは `agent:<agentId>:slack:slash:<userId>` のような分離キーを使い、引き続き `CommandTargetSessionKey` を使ってコマンド実行をターゲット会話セッションへルーティングします。

## インタラクティブ返信

Slack は、エージェントが作成したインタラクティブ返信コントロールをレンダリングできますが、この機能はデフォルトでは無効です。

グローバルに有効化します。

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

または、1 つの Slack アカウントだけで有効化します。

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

有効化すると、エージェントは Slack 専用の返信ディレクティブを出力できます。

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

これらのディレクティブは Slack Block Kit にコンパイルされ、クリックや選択を既存の Slack インタラクションイベントパス経由で戻します。

注記:

- これは Slack 固有の UI です。他のチャンネルは Slack Block Kit ディレクティブを独自のボタンシステムに変換しません。
- インタラクティブコールバック値は、エージェントが作成した生の値ではなく、OpenClaw が生成した不透明トークンです。
- 生成されたインタラクティブブロックが Slack Block Kit の制限を超える場合、OpenClaw は無効なブロックペイロードを送信する代わりに、元のテキスト返信へフォールバックします。

## Slack での Exec 承認

Slack は、Web UI やターミナルへフォールバックする代わりに、インタラクティブボタンとインタラクションを備えたネイティブ承認クライアントとして機能できます。

- Exec 承認は、ネイティブ DM/チャンネルルーティングに `channels.slack.execApprovals.*` を使います。
- Plugin 承認は、リクエストがすでに Slack に届いていて承認 ID 種別が `plugin:` の場合、同じ Slack ネイティブボタン画面を通じて引き続き解決できます。
- 承認者の認可は引き続き強制されます。承認者として識別されたユーザーだけが、Slack 経由でリクエストを承認または拒否できます。

これは他のチャンネルと同じ共有承認ボタン画面を使います。Slack アプリ設定で `interactivity` が有効な場合、承認プロンプトは会話内に直接 Block Kit ボタンとしてレンダリングされます。
それらのボタンが存在する場合、それらが主要な承認 UX です。OpenClaw は、ツール結果がチャット承認を利用できない、または手動承認が唯一のパスであることを示す場合にのみ、手動の `/approve` コマンドを含めるべきです。

設定パス:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（任意。可能な場合は `commands.ownerAllowFrom` にフォールバック）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `agentFilter`, `sessionFilter`

Slack は、`enabled` が未設定または `"auto"` で、少なくとも 1 人の
承認者が解決される場合、ネイティブ Exec 承認を自動的に有効化します。Slack をネイティブ承認クライアントとして明示的に無効化するには、`enabled: false` を設定します。
承認者が解決される場合にネイティブ承認を強制的に有効化するには、`enabled: true` を設定します。

明示的な Slack Exec 承認設定がない場合のデフォルト動作:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

明示的な Slack ネイティブ設定が必要なのは、承認者を上書きする、フィルターを追加する、または
送信元チャット配信にオプトインする場合だけです。

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

共有 `approvals.exec` 転送は別です。Exec 承認プロンプトを他のチャットや明示的な帯域外ターゲットにもルーティングする必要がある場合にのみ使います。共有 `approvals.plugin` 転送も別です。Slack ネイティブボタンは、それらのリクエストがすでに Slack に届いている場合、引き続き Plugin 承認を解決できます。

同じチャット内の `/approve` も、すでにコマンドをサポートしている Slack チャンネルと DM で機能します。承認転送モデル全体については、[Exec 承認](/ja-JP/tools/exec-approvals) を参照してください。

## イベントと運用上の動作

- メッセージの編集/削除はシステムイベントにマッピングされます。
- スレッドブロードキャスト（「チャンネルにも送信」スレッド返信）は通常のユーザーメッセージとして処理されます。
- リアクションの追加/削除イベントはシステムイベントにマッピングされます。
- メンバーの参加/退出、チャンネルの作成/名前変更、ピンの追加/削除イベントはシステムイベントにマッピングされます。
- `configWrites` が有効な場合、`channel_id_changed` はチャンネル設定キーを移行できます。
- チャンネルトピック/目的メタデータは信頼できないコンテキストとして扱われ、ルーティングコンテキストに注入される可能性があります。
- スレッド開始メッセージと初期スレッド履歴コンテキストのシードは、該当する場合、設定された送信者許可リストでフィルタリングされます。
- ブロックアクションとモーダルインタラクションは、リッチなペイロードフィールドを持つ構造化された `Slack interaction: ...` システムイベントを出力します。
  - ブロックアクション: 選択値、ラベル、ピッカー値、`workflow_*` メタデータ
  - モーダル `view_submission` と `view_closed` イベント。ルーティングされたチャンネルメタデータとフォーム入力を含みます

## 設定リファレンス

主要リファレンス: [設定リファレンス - Slack](/ja-JP/gateway/config-channels#slack)。

<Accordion title="重要度の高い Slack フィールド">

- モード/認証: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM アクセス: `dm.enabled`, `dmPolicy`, `allowFrom`（レガシー: `dm.policy`, `dm.allowFrom`）, `dm.groupEnabled`, `dm.groupChannels`
- 互換性トグル: `dangerouslyAllowNameMatching`（緊急回避用。必要な場合を除きオフのままにしてください）
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
    - チャンネル許可リスト（`channels.slack.channels`） — **キーはチャンネル ID**（`C12345678`）である必要があり、名前（`#channel-name`）ではありません。チャンネルルーティングはデフォルトで ID 優先のため、`groupPolicy: "allowlist"` では名前ベースのキーは暗黙的に失敗します。ID を見つけるには、Slack でチャンネルを右クリック → **リンクをコピー** — URL 末尾の `C...` 値がチャンネル ID です。
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
    確認してください。

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（またはレガシーの `channels.slack.dm.policy`）
    - ペアリング承認 / 許可リストエントリ
    - Slack Assistant DM イベント: `drop message_changed` に言及する詳細ログは、
      通常、Slack がメッセージメタデータ内に復元可能な人間の送信者を含まない
      編集済み Assistant スレッドイベントを送信したことを意味します

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode が接続しない">
    Slack アプリ設定で、ボット + アプリトークンと Socket Mode の有効化を検証してください。

    `openclaw channels status --probe --json` が `botTokenStatus` または
    `appTokenStatus: "configured_unavailable"` を表示する場合、その Slack アカウントは
    設定されていますが、現在のランタイムが SecretRef に基づく値を解決できませんでした。

  </Accordion>

  <Accordion title="HTTP モードがイベントを受信しない">
    検証してください。

    - 署名シークレット
    - Webhook パス
    - Slack リクエスト URL（Events + Interactivity + Slash Commands）
    - HTTP アカウントごとに一意の `webhookPath`

    アカウントスナップショットに `signingSecretStatus: "configured_unavailable"` が表示される場合、その HTTP アカウントは設定されていますが、現在のランタイムが SecretRef に基づく署名シークレットを解決できませんでした。

  </Accordion>

  <Accordion title="ネイティブ/スラッシュコマンドが発火しない">
    どちらを意図していたか確認してください。

    - Slack に登録された一致するスラッシュコマンドを使うネイティブコマンドモード（`channels.slack.commands.native: true`）
    - または単一スラッシュコマンドモード（`channels.slack.slashCommand.enabled: true`）

    `commands.useAccessGroups` とチャンネル/ユーザー許可リストも確認してください。

  </Accordion>
</AccordionGroup>

## 添付ファイルのビジョンリファレンス

Slack ファイルのダウンロードに成功し、サイズ制限が許す場合、Slack はダウンロード済みメディアをエージェントターンに添付できます。画像ファイルはメディア理解パス経由で渡すことも、ビジョン対応の返信モデルへ直接渡すこともできます。他のファイルは、画像入力として扱われるのではなく、ダウンロード可能なファイルコンテキストとして保持されます。

### サポートされるメディアタイプ

| メディア種別                     | ソース               | 現在の動作                                                                  | 注記                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 画像 | Slack ファイル URL       | ダウンロードされ、ビジョン対応の処理用にターンへ添付される                   | ファイルごとの上限: `channels.slack.mediaMaxMb` (デフォルト 20 MB)                 |
| PDF ファイル                      | Slack ファイル URL       | ダウンロードされ、`download-file` や `pdf` などのツール向けにファイルコンテキストとして公開される | Slack インバウンドは PDF を画像ビジョン入力へ自動変換しない |
| その他のファイル                    | Slack ファイル URL       | 可能な場合はダウンロードされ、ファイルコンテキストとして公開される                              | バイナリファイルは画像入力として扱われない                               |
| スレッド返信                 | スレッド開始メッセージのファイル | 返信に直接メディアがない場合、ルートメッセージのファイルをコンテキストとして取り込める  | ファイルのみの開始メッセージでは添付プレースホルダーを使用する                          |
| 複数画像メッセージ           | 複数の Slack ファイル | 各ファイルが個別に評価される                                              | Slack の処理は 1 メッセージあたり 8 ファイルに制限される                     |

### インバウンドパイプライン

ファイル添付を含む Slack メッセージが到着した場合:

1. OpenClaw は bot トークン (`xoxb-...`) を使用して Slack のプライベート URL からファイルをダウンロードする。
2. 成功すると、ファイルはメディアストアに書き込まれる。
3. ダウンロードされたメディアパスとコンテンツタイプがインバウンドコンテキストに追加される。
4. 画像対応のモデル/ツールパスは、そのコンテキストの画像添付を使用できる。
5. 非画像ファイルは、それを処理できるツール向けにファイルメタデータまたはメディア参照として引き続き利用できる。

### スレッドルート添付の継承

メッセージがスレッド内に到着した場合 (`thread_ts` の親を持つ):

- 返信自体に直接メディアがなく、含まれるルートメッセージにファイルがある場合、Slack はルートファイルをスレッド開始コンテキストとして取り込める。
- 直接の返信添付は、ルートメッセージの添付より優先される。
- ファイルのみでテキストがないルートメッセージは、フォールバックがそのファイルを引き続き含められるように、添付プレースホルダーで表される。

### 複数添付の処理

1 つの Slack メッセージに複数のファイル添付が含まれる場合:

- 各添付はメディアパイプラインを通じて個別に処理される。
- ダウンロードされたメディア参照はメッセージコンテキストに集約される。
- 処理順序はイベントペイロード内の Slack のファイル順に従う。
- 1 つの添付のダウンロードに失敗しても、他の添付はブロックされない。

### サイズ、ダウンロード、モデルの制限

- **サイズ上限**: デフォルトは 1 ファイルあたり 20 MB。`channels.slack.mediaMaxMb` で設定可能。
- **ダウンロード失敗**: Slack が提供できないファイル、期限切れ URL、アクセス不能なファイル、サイズ超過のファイル、Slack 認証/ログイン HTML レスポンスは、未対応形式として報告されるのではなくスキップされる。
- **ビジョンモデル**: 画像解析は、ビジョンをサポートしている場合はアクティブな返信モデルを使用し、または `agents.defaults.imageModel` で設定された画像モデルを使用する。

### 既知の制限

| シナリオ                               | 現在の動作                                                             | 回避策                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 期限切れの Slack ファイル URL                 | ファイルはスキップされ、エラーは表示されない                                                 | Slack でファイルを再アップロードする                                                |
| ビジョンモデルが設定されていない            | 画像添付はメディア参照として保存されるが、画像として解析されない | `agents.defaults.imageModel` を設定するか、ビジョン対応の返信モデルを使用する |
| 非常に大きな画像 (デフォルトで > 20 MB) | サイズ上限によりスキップされる                                                         | Slack が許可する場合は `channels.slack.mediaMaxMb` を増やす                       |
| 転送/共有された添付           | テキストおよび Slack ホストの画像/ファイルメディアはベストエフォート                       | OpenClaw スレッドで直接再共有する                                   |
| PDF 添付                        | ファイル/メディアコンテキストとして保存され、画像ビジョンへ自動的にはルーティングされない  | ファイルメタデータには `download-file` を使用し、PDF 解析には `pdf` ツールを使用する   |

### 関連ドキュメント

- [メディア理解パイプライン](/ja-JP/nodes/media-understanding)
- [PDF ツール](/ja-JP/tools/pdf)
- エピック: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack 添付ビジョンの有効化
- 回帰テスト: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- ライブ検証: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## 関連

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    Slack ユーザーを Gateway にペアリングする。
  </Card>
  <Card title="Groups" icon="users" href="/ja-JP/channels/groups">
    チャンネルおよびグループ DM の動作。
  </Card>
  <Card title="Channel routing" icon="route" href="/ja-JP/channels/channel-routing">
    インバウンドメッセージをエージェントへルーティングする。
  </Card>
  <Card title="Security" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと強化。
  </Card>
  <Card title="Configuration" icon="sliders" href="/ja-JP/gateway/configuration">
    設定のレイアウトと優先順位。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ja-JP/tools/slash-commands">
    コマンドカタログと動作。
  </Card>
</CardGroup>
