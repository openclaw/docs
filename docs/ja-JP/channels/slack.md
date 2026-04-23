---
read_when:
    - Slackのセットアップ、またはSlackのsocket/HTTPモードのデバッグ
summary: Slackのセットアップとランタイム動作（Socket Mode + HTTP Request URLs）
title: Slack
x-i18n:
    generated_at: "2026-04-23T13:58:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3daf52cd28998bf7d692190468b9d8330f1867f56e49fc69666e7e107d4ba47c
    source_path: channels/slack.md
    workflow: 15
---

# Slack

ステータス: Slack app統合によるDMとチャネル向けに本番利用可能です。デフォルトモードはSocket Modeで、HTTP Request URLsもサポートされています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    SlackのDMはデフォルトでpairingモードです。
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
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="新しいSlack appを作成する">
        Slack app settingsで **[Create New App](https://api.slack.com/apps/new)** ボタンを押します。

        - **from a manifest** を選び、app用のworkspaceを選択します
        - 下記の[マニフェスト例](#manifest-and-scope-checklist)を貼り付け、そのまま作成を続けます
        - `connections:write` を持つ **App-Level Token** (`xapp-...`) を生成します
        - appをインストールし、表示される **Bot Token** (`xoxb-...`) をコピーします
      </Step>

      <Step title="OpenClawを設定する">

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

        環境変数のフォールバック（defaultアカウントのみ）:

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Gatewayを起動する">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="新しいSlack appを作成する">
        Slack app settingsで **[Create New App](https://api.slack.com/apps/new)** ボタンを押します。

        - **from a manifest** を選び、app用のworkspaceを選択します
        - [マニフェスト例](#manifest-and-scope-checklist)を貼り付け、作成前にURLを更新します
        - リクエスト検証用に **Signing Secret** を保存します
        - appをインストールし、表示される **Bot Token** (`xoxb-...`) をコピーします

      </Step>

      <Step title="OpenClawを設定する">

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
        マルチアカウントHTTPでは一意のWebhookパスを使用してください

        登録が衝突しないよう、各アカウントに別々の `webhookPath`（デフォルトは `/slack/events`）を設定してください。
        </Note>

      </Step>

      <Step title="Gatewayを起動する">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## マニフェストとスコープのチェックリスト

<Tabs>
  <Tab title="Socket Mode (default)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
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

  </Tab>

  <Tab title="HTTP Request URLs">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
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
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

  </Tab>
</Tabs>

### 追加のマニフェスト設定

上記のデフォルトを拡張する、さまざまな機能を表に出します。

<AccordionGroup>
  <Accordion title="任意のネイティブスラッシュコマンド">

    単一の設定済みコマンドの代わりに、ニュアンス付きで複数の[ネイティブスラッシュコマンド](#commands-and-slash-behavior)を使用できます。

    - `/status` コマンドは予約されているため、`/status` の代わりに `/agentstatus` を使用します。
    - 同時に利用可能なスラッシュコマンドは25個までです。

    既存の `features.slash_commands` セクションを、[利用可能なコマンド](/ja-JP/tools/slash-commands#command-list) の一部で置き換えてください。

    <Tabs>
      <Tab title="Socket Mode (default)">

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
      <Tab title="HTTP Request URLs">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "新しいセッションを開始する",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "現在のセッションをリセットする",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "セッションコンテキストを圧縮する",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "現在の実行を停止する",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "スレッドバインディングの有効期限を管理する",
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "思考レベルを設定する",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "詳細出力を切り替える",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "高速モードを表示または設定する",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "reasoningの表示を切り替える",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "elevatedモードを切り替える",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "execのデフォルト設定を表示または設定する",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "モデルを表示または設定する",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "プロバイダーを一覧表示する、またはプロバイダーのモデルを一覧表示する",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "短いヘルプ要約を表示する",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "生成されたコマンドカタログを表示する",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "現在のagentが今使えるものを表示する",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "利用可能な場合はプロバイダー使用量/クォータを含むランタイムステータスを表示する",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "現在のセッションのアクティブ/最近のバックグラウンドタスクを一覧表示する",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "コンテキストがどのように組み立てられるかを説明する",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "自分の送信者IDを表示する",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "名前でskillを実行する",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "セッションコンテキストを変更せずに補足の質問をする",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "使用量フッターを制御する、またはコスト概要を表示する",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="任意のauthoringスコープ（書き込み操作）">
    送信メッセージでデフォルトのSlack app IDではなく、アクティブなagent ID（カスタムユーザー名とアイコン）を使いたい場合は、`chat:write.customize` botスコープを追加してください。

    絵文字アイコンを使う場合、Slackは `:emoji_name:` 構文を期待します。

  </Accordion>
  <Accordion title="任意のuser tokenスコープ（読み取り操作）">
    `channels.slack.userToken` を設定する場合、一般的な読み取りスコープは次のとおりです。

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read`（Slack検索の読み取りに依存する場合）

  </Accordion>
</AccordionGroup>

## トークンモデル

- Socket Modeには `botToken` + `appToken` が必要です。
- HTTPモードには `botToken` + `signingSecret` が必要です。
- `botToken`、`appToken`、`signingSecret`、`userToken` はプレーンテキスト文字列またはSecretRefオブジェクトを受け付けます。
- 設定内のトークンは環境変数のフォールバックより優先されます。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` の環境変数フォールバックはdefaultアカウントにのみ適用されます。
- `userToken` (`xoxp-...`) は設定専用です（環境変数のフォールバックなし）。デフォルトは読み取り専用動作（`userTokenReadOnly: true`）です。

ステータススナップショットの動作:

- Slackアカウントの検査では、認証情報ごとの `*Source` と `*Status` フィールド（`botToken`、`appToken`、`signingSecret`、`userToken`）を追跡します。
- ステータスは `available`、`configured_unavailable`、`missing` です。
- `configured_unavailable` は、そのアカウントがSecretRefまたは別の非インラインのシークレットソースで設定されているものの、現在のコマンド/ランタイム経路では実際の値を解決できなかったことを意味します。
- HTTPモードでは `signingSecretStatus` が含まれます。Socket Modeでは、必要な組み合わせは `botTokenStatus` + `appTokenStatus` です。

<Tip>
アクションやディレクトリの読み取りでは、設定されていればuser tokenが優先されることがあります。書き込みでは引き続きbot tokenが優先されます。user tokenでの書き込みは `userTokenReadOnly: false` かつbot tokenが利用できない場合にのみ許可されます。
</Tip>

## アクションとゲート

Slackアクションは `channels.slack.actions.*` で制御されます。

現在のSlackツールで利用可能なアクショングループ:

| Group      | Default |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

現在のSlackメッセージアクションには、`send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info`、`emoji-list` が含まれます。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DMポリシー">
    `channels.slack.dmPolicy` がDMアクセスを制御します（旧式: `channels.slack.dm.policy`）。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.slack.allowFrom` に `"*"` を含める必要があります。旧式: `channels.slack.dm.allowFrom`）
    - `disabled`

    DMフラグ:

    - `dm.enabled`（デフォルト true）
    - `channels.slack.allowFrom`（推奨）
    - `dm.allowFrom`（旧式）
    - `dm.groupEnabled`（グループDMはデフォルト false）
    - `dm.groupChannels`（任意のMPIM許可リスト）

    マルチアカウントの優先順位:

    - `channels.slack.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントは、自身の `allowFrom` が未設定の場合に `channels.slack.allowFrom` を継承します。
    - 名前付きアカウントは `channels.slack.accounts.default.allowFrom` を継承しません。

    DMでのpairingには `openclaw pairing approve slack <code>` を使用します。

  </Tab>

  <Tab title="チャネルポリシー">
    `channels.slack.groupPolicy` がチャネル処理を制御します。

    - `open`
    - `allowlist`
    - `disabled`

    チャネル許可リストは `channels.slack.channels` 配下にあり、安定したチャネルIDを使う必要があります。

    ランタイム注記: `channels.slack` が完全に欠落している場合（環境変数のみのセットアップ）、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに出します（`channels.defaults.groupPolicy` が設定されていても同様）。

    名前/ID解決:

    - チャネル許可リスト項目とDM許可リスト項目は、トークンアクセスが可能であれば起動時に解決されます
    - 解決できなかったチャネル名項目は設定どおり保持されますが、デフォルトではルーティングで無視されます
    - 受信認可とチャネルルーティングはデフォルトでID優先です。直接のユーザー名/slug一致には `channels.slack.dangerouslyAllowNameMatching: true` が必要です

  </Tab>

  <Tab title="メンションとチャネルユーザー">
    チャネルメッセージはデフォルトでメンションゲートされます。

    メンションソース:

    - 明示的なappメンション（`<@botId>`）
    - メンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - botへの返信スレッドの暗黙動作（`thread.requireExplicitMention` が `true` の場合は無効）

    チャネルごとの制御（`channels.slack.channels.<id>`。名前は起動時解決または `dangerouslyAllowNameMatching` 経由のみ）:

    - `requireMention`
    - `users`（許可リスト）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` のキー形式: `id:`、`e164:`、`username:`、`name:`、または `"*"` ワイルドカード
      （旧式の接頭辞なしキーも引き続き `id:` のみにマップされます）

  </Tab>
</Tabs>

## スレッド、セッション、返信タグ

- DMは `direct` としてルーティングされ、チャネルは `channel`、MPIMは `group` としてルーティングされます。
- デフォルトの `session.dmScope=main` では、Slack DMはagentのメインセッションに集約されます。
- チャネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- スレッド返信は、必要に応じてスレッドセッション接尾辞（`:thread:<threadTs>`）を作成できます。
- `channels.slack.thread.historyScope` のデフォルトは `thread`、`thread.inheritParent` のデフォルトは `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッドセッション開始時に取得する既存スレッドメッセージ数を制御します（デフォルト `20`。無効化するには `0` に設定）。
- `channels.slack.thread.requireExplicitMention`（デフォルト `false`）: `true` の場合、暗黙のスレッドメンションを抑制し、botがすでにそのスレッドに参加していても、スレッド内では明示的な `@bot` メンションにのみ応答します。これがない場合、bot参加済みスレッド内の返信は `requireMention` ゲートをバイパスします。

返信スレッド制御:

- `channels.slack.replyToMode`: `off|first|all|batched`（デフォルト `off`）
- `channels.slack.replyToModeByChatType`: `direct|group|channel` ごと
- direct chat向けの旧式フォールバック: `channels.slack.dm.replyToMode`

手動返信タグがサポートされています:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

注: `replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含め、Slack内の**すべて**の返信スレッド機能を無効にします。これはTelegramと異なり、Telegramでは `"off"` モードでも明示タグが引き続き尊重されます。この違いはプラットフォームのスレッドモデルを反映しています。Slackのスレッドはメッセージをチャネルから隠しますが、Telegramの返信はメインチャットの流れの中で表示されたままです。

フォーカスされたSlackスレッド返信は、存在する場合、デフォルトagentシェルに対して返信を準備する代わりに、バインド済みのACPセッション経由でルーティングされます。これにより、スレッド内の後続メッセージに対して `/focus` と `/acp spawn ... --bind here` のバインディングが維持されます。

## 確認リアクション

`ackReaction` は、OpenClawが受信メッセージを処理中である間、確認用の絵文字を送信します。

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- agent IDの絵文字フォールバック（`agents.list[].identity.emoji`、なければ "👀"）

注記:

- Slackはショートコードを期待します（例: `"eyes"`）。
- Slackアカウント単位またはグローバルでリアクションを無効にするには `""` を使用します。

## テキストストリーミング

`channels.slack.streaming` はライブプレビューの動作を制御します。

- `off`: ライブプレビューのストリーミングを無効にします。
- `partial`（デフォルト）: プレビューテキストを最新の部分出力で置き換えます。
- `block`: チャンク化されたプレビュー更新を追記します。
- `progress`: 生成中は進捗ステータステキストを表示し、その後で最終テキストを送信します。
- `streaming.preview.toolProgress`: 下書きプレビューが有効な場合、ツール/進捗更新を同じ編集済みプレビューメッセージに流し込みます（デフォルト: `true`）。別々のツール/進捗メッセージを維持するには `false` に設定します。

`channels.slack.streaming.nativeTransport` は、`channels.slack.streaming.mode` が `partial` のときのSlackネイティブテキストストリーミングを制御します（デフォルト: `true`）。

- ネイティブテキストストリーミングとSlack assistantスレッドステータスを表示するには、返信スレッドが利用可能である必要があります。スレッド選択は引き続き `replyToMode` に従います。
- チャネルおよびグループチャットのルートは、ネイティブストリーミングが利用できない場合でも通常の下書きプレビューを使用できます。
- 最上位のSlack DMはデフォルトでスレッド外のままなので、スレッド形式のプレビューは表示されません。そこで進捗を見えるようにしたい場合は、スレッド返信または `typingReaction` を使用してください。
- メディアおよび非テキストペイロードは通常の配信にフォールバックします。
- メディア/エラーの最終結果は、一時的な下書きをフラッシュせずに保留中のプレビュー編集をキャンセルします。対象となるテキスト/ブロックの最終結果は、プレビューをその場で編集できる場合にのみフラッシュされます。
- 返信の途中でストリーミングが失敗した場合、OpenClawは残りのペイロードを通常配信にフォールバックします。
- SDKがローカルバッファをフラッシュする前にストリームを拒否するSlack Connectチャネルでは、通常のSlack返信にフォールバックするため、短い返信が黙って破棄されたり、Slackが確認する前に配信済みと報告されたりしません。

Slackネイティブテキストストリーミングの代わりに下書きプレビューを使う:

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

旧式キー:

- `channels.slack.streamMode`（`replace | status_final | append`）は `channels.slack.streaming.mode` に自動移行されます。
- 真偽値の `channels.slack.streaming` は `channels.slack.streaming.mode` と `channels.slack.streaming.nativeTransport` に自動移行されます。
- 旧式の `channels.slack.nativeStreaming` は `channels.slack.streaming.nativeTransport` に自動移行されます。

## typing reactionフォールバック

`typingReaction` は、OpenClawが返信を処理している間、受信したSlackメッセージに一時的なリアクションを追加し、実行完了時にそれを削除します。これは、デフォルトの「is typing...」ステータスインジケーターを使用するスレッド返信の外で特に有用です。

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注記:

- Slackはショートコードを期待します（例: `"hourglass_flowing_sand"`）。
- このリアクションはベストエフォートであり、返信または失敗処理の完了後に自動でクリーンアップが試行されます。

## メディア、チャンク化、配信

<AccordionGroup>
  <Accordion title="受信添付ファイル">
    Slackのファイル添付は、SlackホストのプライベートURLからダウンロードされ（トークン認証付きリクエストフロー）、取得に成功しサイズ制限内であればメディアストアに書き込まれます。

    ランタイムの受信サイズ上限は、`channels.slack.mediaMaxMb` で上書きされない限りデフォルトで `20MB` です。

  </Accordion>

  <Accordion title="送信テキストとファイル">
    - テキストチャンクは `channels.slack.textChunkLimit` を使用します（デフォルト 4000）
    - `channels.slack.chunkMode="newline"` は段落優先の分割を有効にします
    - ファイル送信はSlack upload APIを使用し、スレッド返信（`thread_ts`）を含めることができます
    - 送信メディア上限は、設定されている場合は `channels.slack.mediaMaxMb` に従います。未設定の場合、チャネル送信ではメディアパイプラインのMIME種別デフォルトを使用します
  </Accordion>

  <Accordion title="配信先">
    推奨される明示的なターゲット:

    - DMには `user:<id>`
    - チャネルには `channel:<id>`

    Slack DMは、ユーザーターゲットへの送信時にSlack conversation API経由で開かれます。

  </Accordion>
</AccordionGroup>

## コマンドとスラッシュ動作

スラッシュコマンドは、Slackでは単一の設定済みコマンドまたは複数のネイティブコマンドとして表示されます。コマンドのデフォルトを変更するには `channels.slack.slashCommand` を設定します。

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

ネイティブコマンドには、Slack app内で[追加のマニフェスト設定](#additional-manifest-settings)が必要で、代わりに `channels.slack.commands.native: true` またはグローバル設定の `commands.native: true` で有効化します。

- Slackではネイティブコマンドの自動モードは**off**です。そのため `commands.native: "auto"` ではSlackネイティブコマンドは有効になりません。

```txt
/help
```

ネイティブ引数メニューは、選択したオプション値を送信する前に確認モーダルを表示する適応レンダリング戦略を使用します。

- 最大5個のオプション: ボタンブロック
- 6〜100個のオプション: static selectメニュー
- 100個を超えるオプション: interactivity options handlerが利用可能な場合、非同期オプションフィルタリング付きexternal select
- Slackの制限超過: エンコードされたオプション値はボタンにフォールバック

```txt
/think
```

スラッシュセッションは `agent:<agentId>:slack:slash:<userId>` のような分離キーを使用しつつ、`CommandTargetSessionKey` を使ってコマンド実行を対象会話セッションにルーティングします。

## インタラクティブ返信

Slackはagent作成のインタラクティブ返信コントロールをレンダリングできますが、この機能はデフォルトでは無効です。

グローバルに有効化する:

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

または、1つのSlackアカウントだけで有効化する:

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

有効にすると、agentはSlack専用の返信ディレクティブを出力できます。

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

これらのディレクティブはSlack Block Kitにコンパイルされ、クリックまたは選択が既存のSlack interaction eventパスを通じて戻されます。

注記:

- これはSlack固有のUIです。他のチャネルはSlack Block Kitディレクティブを各自のボタンシステムには変換しません。
- インタラクティブコールバック値は、agentがそのまま記述した生の値ではなく、OpenClaw生成の不透明トークンです。
- 生成されたインタラクティブブロックがSlack Block Kitの制限を超える場合、OpenClawは無効なblocks payloadを送る代わりに元のテキスト返信にフォールバックします。

## Slackでのexec承認

Slackは、Web UIやターミナルへのフォールバックの代わりに、インタラクティブボタンとinteractionを備えたネイティブ承認クライアントとして機能できます。

- Exec承認は、ネイティブDM/チャネルルーティングに `channels.slack.execApprovals.*` を使用します。
- Plugin承認も、リクエストがすでにSlackに届いており、承認ID種別が `plugin:` の場合は、同じSlackネイティブボタンUIで解決できます。
- 承認者認可は引き続き強制されます。承認者として識別されたユーザーのみが、Slack経由でリクエストを承認または拒否できます。

これは他のチャネルと同じ共有承認ボタンUIを使用します。Slack app settingsで `interactivity` が有効な場合、承認プロンプトは会話内に直接Block Kitボタンとしてレンダリングされます。
これらのボタンが存在する場合、それらが主要な承認UXになります。OpenClaw
は、ツール結果がチャット承認を利用不可と示す場合、または手動承認が唯一の経路である場合にのみ、手動の `/approve` コマンドを含めるべきです。

設定パス:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（任意。可能であれば `commands.ownerAllowFrom` にフォールバック）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `agentFilter`, `sessionFilter`

Slackは、`enabled` が未設定または `"auto"` で、かつ少なくとも1人の
承認者が解決される場合、ネイティブexec承認を自動で有効化します。Slackをネイティブ承認クライアントとして明示的に無効にするには `enabled: false` を設定します。
承認者が解決されるときにネイティブ承認を強制的に有効にするには `enabled: true` を設定します。

明示的なSlack exec承認設定がない場合のデフォルト動作:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

承認者を上書きしたい、フィルターを追加したい、または元チャット配信を有効にしたい場合にのみ、明示的なSlackネイティブ設定が必要です。

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

共有の `approvals.exec` 転送は別物です。exec承認プロンプトを他のチャットまたは明示的な帯域外ターゲットにもルーティングする必要がある場合にのみ使用してください。共有の `approvals.plugin` 転送も別物です。Slackネイティブボタンは、それらのリクエストがすでにSlackに届いている場合、引き続きplugin承認を解決できます。

同一チャット内の `/approve` も、すでにコマンドをサポートしているSlackチャネルとDMで動作します。完全な承認転送モデルについては、[Exec approvals](/ja-JP/tools/exec-approvals) を参照してください。

## イベントと運用動作

- メッセージ編集/削除/スレッドブロードキャストはsystem eventにマップされます。
- リアクション追加/削除イベントはsystem eventにマップされます。
- メンバー参加/退出、チャネル作成/名前変更、ピン追加/削除イベントはsystem eventにマップされます。
- `channel_id_changed` は、`configWrites` が有効な場合にチャネル設定キーを移行できます。
- チャネルtopic/purposeメタデータは信頼できないコンテキストとして扱われ、ルーティングコンテキストに注入されることがあります。
- スレッド開始メッセージと初期スレッド履歴コンテキストのシードは、該当する場合、設定済みの送信者許可リストによってフィルタリングされます。
- ブロックアクションとモーダルinteractionは、豊富なペイロードフィールドを持つ構造化 `Slack interaction: ...` system eventを出力します。
  - block actions: 選択値、ラベル、picker値、`workflow_*` メタデータ
  - modal `view_submission` および `view_closed` イベント: ルーティング済みチャネルメタデータとフォーム入力を含む

## 設定リファレンスポインタ

主要リファレンス:

- [設定リファレンス - Slack](/ja-JP/gateway/configuration-reference#slack)

  重要なSlackフィールド:
  - モード/認証: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - DMアクセス: `dm.enabled`, `dmPolicy`, `allowFrom`（旧式: `dm.policy`, `dm.allowFrom`）, `dm.groupEnabled`, `dm.groupChannels`
  - 互換性トグル: `dangerouslyAllowNameMatching`（緊急用。必要な場合を除き無効のままにしてください）
  - チャネルアクセス: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - スレッド/履歴: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - 配信: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - 運用/機能: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャネルで返信がない">
    次の順に確認してください。

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

  <Accordion title="DMメッセージが無視される">
    次を確認してください。

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（または旧式の `channels.slack.dm.policy`）
    - pairing承認 / 許可リスト項目

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket modeが接続しない">
    botトークン + appトークン、およびSlack app settingsでのSocket Mode有効化を確認してください。

    `openclaw channels status --probe --json` で `botTokenStatus` または
    `appTokenStatus: "configured_unavailable"` が表示される場合、そのSlackアカウントは
    設定されていますが、現在のランタイムではSecretRefバックの
    値を解決できませんでした。

  </Accordion>

  <Accordion title="HTTP modeでイベントを受信しない">
    次を確認してください。

    - signing secret
    - webhook path
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - HTTPアカウントごとに一意の `webhookPath`

    アカウントスナップショットに `signingSecretStatus: "configured_unavailable"` が表示される場合、そのHTTPアカウントは設定されていますが、現在のランタイムではSecretRefバックのsigning secretを解決できませんでした。

    登録済みRequest URL Webhookは、Slack monitorセットアップで使われるのと同じ共有ハンドラレジストリを通じてディスパッチされるため、HTTPモードのSlackイベントは、ルート登録成功後に404になるのではなく、登録済みパスを通ってルーティングされ続けます。

  </Accordion>

  <Accordion title="カスタムbot tokenでのファイルダウンロード">
    `downloadFile` ヘルパーは、呼び出し元が明示的な `token` や事前構築済みクライアントなしで `cfg` を渡した場合、ランタイム設定からbot tokenを解決し、actionランタイム経路外でもcfg専用のファイルダウンロードを維持します。
  </Accordion>

  <Accordion title="ネイティブ/スラッシュコマンドが発火しない">
    意図しているのが次のどちらかを確認してください。

    - ネイティブコマンドモード（`channels.slack.commands.native: true`）で、Slackに対応するスラッシュコマンドが登録されている
    - または単一スラッシュコマンドモード（`channels.slack.slashCommand.enabled: true`）

    あわせて `commands.useAccessGroups` とチャネル/ユーザー許可リストも確認してください。

  </Accordion>
</AccordionGroup>

## 関連項目

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [セキュリティ](/ja-JP/gateway/security)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
- [設定](/ja-JP/gateway/configuration)
- [スラッシュコマンド](/ja-JP/tools/slash-commands)
