---
read_when:
    - Slack のセットアップ、または Slack の socket/HTTP モードのデバッグ
summary: Slack のセットアップとランタイム動作（Socket Mode + HTTP リクエスト URL）
title: Slack
x-i18n:
    generated_at: "2026-04-21T13:35:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fe3c3c344e1c20c09b29773f4f68d2790751e76d8bbaa3c6157e3ff75978acf
    source_path: channels/slack.md
    workflow: 15
---

# Slack

ステータス: Slack アプリ連携による DM + チャンネルは本番対応済みです。デフォルトモードは Socket Mode で、HTTP リクエスト URL もサポートされています。

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

## クイックセットアップ

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="新しい Slack アプリを作成する">
        Slack アプリ設定で **[Create New App](https://api.slack.com/apps/new)** ボタンを押します。

        - **from a manifest** を選択し、アプリ用のワークスペースを選びます
        - 下記の[マニフェスト例](#manifest-and-scope-checklist)を貼り付け、そのまま作成を続けます
        - `connections:write` を付けた **App-Level Token** (`xapp-...`) を生成します
        - アプリをインストールし、表示された **Bot Token** (`xoxb-...`) をコピーします
      </Step>

      <Step title="OpenClaw を設定する">

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

        環境変数のフォールバック（デフォルトアカウントのみ）:

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

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="新しい Slack アプリを作成する">
        Slack アプリ設定で **[Create New App](https://api.slack.com/apps/new)** ボタンを押します。

        - **from a manifest** を選択し、アプリ用のワークスペースを選びます
        - [マニフェスト例](#manifest-and-scope-checklist)を貼り付け、作成前に URL を更新します
        - リクエスト検証用の **Signing Secret** を保存します
        - アプリをインストールし、表示された **Bot Token** (`xoxb-...`) をコピーします

      </Step>

      <Step title="OpenClaw を設定する">

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
        マルチアカウント HTTP では一意の webhook パスを使ってください

        アカウントごとに異なる `webhookPath`（デフォルトは `/slack/events`）を設定し、登録が競合しないようにしてください。
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

## マニフェストとスコープのチェックリスト

<Tabs>
  <Tab title="Socket Mode (default)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw 用の Slack コネクタ"
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
        "description": "OpenClaw にメッセージを送信する",
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
    "description": "OpenClaw 用の Slack コネクタ"
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
        "description": "OpenClaw にメッセージを送信する",
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

上記のデフォルトを拡張する各種機能を表に出します。

<AccordionGroup>
  <Accordion title="任意のネイティブスラッシュコマンド">

    単一の設定済みコマンドの代わりに、複数の[ネイティブスラッシュコマンド](#commands-and-slash-behavior)をニュアンス付きで使用できます。

    - `/status` コマンドは予約済みなので、`/status` の代わりに `/agentstatus` を使ってください。
    - 同時に利用可能なスラッシュコマンドは 25 個までです。

    既存の `features.slash_commands` セクションを、[利用可能なコマンド](/ja-JP/tools/slash-commands#command-list) の一部で置き換えてください。

    <Tabs>
      <Tab title="Socket Mode (default)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "新しいセッションを開始する",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "現在のセッションをリセットする"
      },
      {
        "command": "/compact",
        "description": "セッションコンテキストを Compaction する",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "現在の実行を停止する"
      },
      {
        "command": "/session",
        "description": "スレッド紐付けの有効期限を管理する",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "思考レベルを設定する",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "詳細出力を切り替える",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "fast モードを表示または設定する",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "reasoning の表示を切り替える",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "elevated モードを切り替える",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "exec のデフォルトを表示または設定する",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "モデルを表示または設定する",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "プロバイダー一覧、またはプロバイダーのモデル一覧を表示する",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
      },
      {
        "command": "/help",
        "description": "短いヘルプ要約を表示する"
      },
      {
        "command": "/commands",
        "description": "生成されたコマンドカタログを表示する"
      },
      {
        "command": "/tools",
        "description": "現在のエージェントが今使えるものを表示する",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "利用可能な場合はプロバイダー使用量やクォータを含むランタイムステータスを表示する"
      },
      {
        "command": "/tasks",
        "description": "現在のセッションのアクティブな最近のバックグラウンドタスクを一覧表示する"
      },
      {
        "command": "/context",
        "description": "コンテキストがどのように組み立てられるかを説明する",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "あなたの送信者 ID を表示する"
      },
      {
        "command": "/skill",
        "description": "名前を指定して skill を実行する",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "セッションコンテキストを変更せずに補足の質問をする",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "使用量フッターを制御するか、コスト要約を表示する",
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
        "description": "セッションコンテキストを Compaction する",
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
        "description": "スレッド紐付けの有効期限を管理する",
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
        "description": "fast モードを表示または設定する",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "reasoning の表示を切り替える",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "elevated モードを切り替える",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "exec のデフォルトを表示または設定する",
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
        "description": "プロバイダー一覧、またはプロバイダーのモデル一覧を表示する",
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
        "description": "現在のエージェントが今使えるものを表示する",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "利用可能な場合はプロバイダー使用量やクォータを含むランタイムステータスを表示する",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "現在のセッションのアクティブな最近のバックグラウンドタスクを一覧表示する",
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
        "description": "あなたの送信者 ID を表示する",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "名前を指定して Skills を実行する",
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
        "description": "使用量フッターを制御するか、コスト要約を表示する",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="任意の authorship スコープ（書き込み操作）">
    デフォルトの Slack アプリ ID ではなく、アクティブなエージェント ID（カスタムのユーザー名とアイコン）を送信メッセージで使いたい場合は、`chat:write.customize` の bot スコープを追加してください。

    絵文字アイコンを使う場合、Slack では `:emoji_name:` 構文が必要です。

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

- Socket Mode では `botToken` + `appToken` が必要です。
- HTTP モードでは `botToken` + `signingSecret` が必要です。
- `botToken`、`appToken`、`signingSecret`、`userToken` には、平文の文字列または SecretRef オブジェクトを指定できます。
- 設定内のトークンは環境変数フォールバックより優先されます。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` の環境変数フォールバックはデフォルトアカウントにのみ適用されます。
- `userToken` (`xoxp-...`) は設定のみ対応です（環境変数フォールバックなし）。デフォルトでは読み取り専用動作（`userTokenReadOnly: true`）になります。

ステータススナップショットの動作:

- Slack アカウント検査では、認証情報ごとの `*Source` および `*Status` フィールド（`botToken`、`appToken`、`signingSecret`、`userToken`）を追跡します。
- ステータスは `available`、`configured_unavailable`、または `missing` です。
- `configured_unavailable` は、そのアカウントが SecretRef または別の非インラインなシークレットソースで設定されているものの、現在のコマンド/ランタイム経路では実際の値を解決できなかったことを意味します。
- HTTP モードでは `signingSecretStatus` が含まれます。Socket Mode では必要な組み合わせは `botTokenStatus` + `appTokenStatus` です。

<Tip>
アクション/ディレクトリ読み取りでは、設定されていれば user token を優先できます。書き込みでは bot token が引き続き優先されます。user-token による書き込みは、`userTokenReadOnly: false` かつ bot token が利用できない場合にのみ許可されます。
</Tip>

## アクションとゲート

Slack アクションは `channels.slack.actions.*` によって制御されます。

現在の Slack ツールで利用可能なアクショングループ:

| Group      | Default |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

現在の Slack メッセージアクションには、`send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info`、`emoji-list` が含まれます。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.slack.dmPolicy` は DM アクセスを制御します（旧式: `channels.slack.dm.policy`）。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.slack.allowFrom` に `"*"` を含める必要があります。旧式: `channels.slack.dm.allowFrom`）
    - `disabled`

    DM フラグ:

    - `dm.enabled`（デフォルト true）
    - `channels.slack.allowFrom`（推奨）
    - `dm.allowFrom`（旧式）
    - `dm.groupEnabled`（グループ DM のデフォルトは false）
    - `dm.groupChannels`（任意の MPIM allowlist）

    マルチアカウントの優先順位:

    - `channels.slack.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントでは、自身の `allowFrom` が未設定の場合に `channels.slack.allowFrom` を継承します。
    - 名前付きアカウントは `channels.slack.accounts.default.allowFrom` を継承しません。

    DM でのペアリングには `openclaw pairing approve slack <code>` を使います。

  </Tab>

  <Tab title="チャンネルポリシー">
    `channels.slack.groupPolicy` はチャンネル処理を制御します。

    - `open`
    - `allowlist`
    - `disabled`

    チャンネル allowlist は `channels.slack.channels` 配下にあり、安定したチャンネル ID を使うべきです。

    ランタイムに関する注記: `channels.slack` が完全に存在しない場合（環境変数のみのセットアップ）、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告を記録します（`channels.defaults.groupPolicy` が設定されていても同様です）。

    名前/ID 解決:

    - チャンネル allowlist エントリと DM allowlist エントリは、トークンアクセスが許可されていれば起動時に解決されます
    - 未解決のチャンネル名エントリは設定どおり保持されますが、デフォルトではルーティングで無視されます
    - 受信認可とチャンネルルーティングはデフォルトで ID 優先です。直接のユーザー名/slug 一致には `channels.slack.dangerouslyAllowNameMatching: true` が必要です

  </Tab>

  <Tab title="メンションとチャンネルユーザー">
    チャンネルメッセージはデフォルトでメンションゲートされます。

    メンションソース:

    - 明示的なアプリメンション（`<@botId>`）
    - メンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - ボットへの暗黙のスレッド返信動作（`thread.requireExplicitMention` が `true` の場合は無効）

    チャンネルごとの制御（`channels.slack.channels.<id>`。名前は起動時解決または `dangerouslyAllowNameMatching` 経由のみ）:

    - `requireMention`
    - `users`（allowlist）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` のキー形式: `id:`、`e164:`、`username:`、`name:`、または `"*"` ワイルドカード
      （旧式のプレフィックスなしキーも引き続き `id:` のみにマップされます）

  </Tab>
</Tabs>

## スレッディング、セッション、返信タグ

- DM は `direct`、チャンネルは `channel`、MPIM は `group` としてルーティングされます。
- デフォルトの `session.dmScope=main` では、Slack DM はエージェントのメインセッションに集約されます。
- チャンネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- スレッド返信は、該当する場合にスレッドセッション接尾辞（`:thread:<threadTs>`）を作成できます。
- `channels.slack.thread.historyScope` のデフォルトは `thread`、`thread.inheritParent` のデフォルトは `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッドセッション開始時に取得する既存スレッドメッセージ数を制御します（デフォルト `20`。無効化するには `0` を設定）。
- `channels.slack.thread.requireExplicitMention`（デフォルト `false`）: `true` の場合、暗黙のスレッドメンションを抑制するため、ボットがすでにそのスレッドに参加していても、スレッド内での明示的な `@bot` メンションにのみ応答します。これがない場合、ボット参加済みスレッドでの返信は `requireMention` ゲートをバイパスします。

返信スレッディング制御:

- `channels.slack.replyToMode`: `off|first|all|batched`（デフォルト `off`）
- `channels.slack.replyToModeByChatType`: `direct|group|channel` ごと
- direct chat 用の旧式フォールバック: `channels.slack.dm.replyToMode`

手動の返信タグに対応しています:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

注: `replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含め、Slack の**すべて**の返信スレッディングを無効にします。これは、明示タグが `"off"` モードでも引き続き尊重される Telegram とは異なります。この違いは、プラットフォームごとのスレッディングモデルを反映しています。Slack スレッドではメッセージがチャンネルから隠れますが、Telegram の返信はメインチャットの流れの中で表示されたままです。

## 確認用リアクション

`ackReaction` は、OpenClaw が受信メッセージを処理中であることを示す確認絵文字を送信します。

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- エージェント ID の絵文字フォールバック（`agents.list[].identity.emoji`、それ以外は "👀"）

注記:

- Slack では shortcode が必要です（例: `"eyes"`）。
- Slack アカウント単位またはグローバルでリアクションを無効にするには `""` を使います。

## テキストストリーミング

`channels.slack.streaming` はライブプレビュー動作を制御します:

- `off`: ライブプレビューのストリーミングを無効にします。
- `partial`（デフォルト）: プレビューテキストを最新の部分出力で置き換えます。
- `block`: チャンク化されたプレビュー更新を追記します。
- `progress`: 生成中は進捗ステータステキストを表示し、その後で最終テキストを送信します。

`channels.slack.streaming.nativeTransport` は、`channels.slack.streaming.mode` が `partial` のときに Slack ネイティブのテキストストリーミングを制御します（デフォルト: `true`）。

- ネイティブテキストストリーミングと Slack assistant のスレッドステータスを表示するには、返信スレッドが利用可能である必要があります。スレッド選択は引き続き `replyToMode` に従います。
- ネイティブストリーミングが利用できない場合でも、チャンネルとグループチャットのルートでは通常のドラフトプレビューを使えます。
- トップレベルの Slack DM はデフォルトでスレッド外のままなので、スレッド形式のプレビューは表示されません。そこで進捗を見せたい場合は、スレッド返信または `typingReaction` を使ってください。
- メディアや非テキストのペイロードは通常配信にフォールバックします。
- 返信の途中でストリーミングに失敗した場合、OpenClaw は残りのペイロードについて通常配信にフォールバックします。

Slack ネイティブのテキストストリーミングの代わりにドラフトプレビューを使うには:

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

- `channels.slack.streamMode`（`replace | status_final | append`）は自動的に `channels.slack.streaming.mode` へ移行されます。
- 真偽値の `channels.slack.streaming` は自動的に `channels.slack.streaming.mode` と `channels.slack.streaming.nativeTransport` へ移行されます。
- 旧式の `channels.slack.nativeStreaming` は自動的に `channels.slack.streaming.nativeTransport` へ移行されます。

## Typing reaction フォールバック

`typingReaction` は、OpenClaw が返信を処理している間、受信した Slack メッセージに一時的なリアクションを追加し、実行終了時にそれを削除します。これは主に、デフォルトの「入力中...」ステータスインジケーターを使うスレッド返信の外で役立ちます。

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注記:

- Slack では shortcode が必要です（例: `"hourglass_flowing_sand"`）。
- リアクションはベストエフォートであり、返信または失敗経路の完了後に自動クリーンアップが試行されます。

## メディア、チャンク化、配信

<AccordionGroup>
  <Accordion title="受信添付ファイル">
    Slack のファイル添付は、Slack がホストするプライベート URL からダウンロードされ（トークン認証付きリクエストフロー）、取得に成功しサイズ制限内であればメディアストアに書き込まれます。

    ランタイムの受信サイズ上限は、`channels.slack.mediaMaxMb` で上書きしない限りデフォルトで `20MB` です。

  </Accordion>

  <Accordion title="送信テキストとファイル">
    - テキストチャンクには `channels.slack.textChunkLimit` を使います（デフォルト 4000）
    - `channels.slack.chunkMode="newline"` で段落優先の分割を有効にします
    - ファイル送信には Slack の upload API を使用し、スレッド返信（`thread_ts`）を含めることもできます
    - 送信メディア上限は、`channels.slack.mediaMaxMb` が設定されていればそれに従います。未設定の場合、チャンネル送信は media pipeline の MIME 種別デフォルトに従います
  </Accordion>

  <Accordion title="配信先">
    推奨される明示的な宛先:

    - DM には `user:<id>`
    - チャンネルには `channel:<id>`

    Slack DM は、ユーザー宛先に送信する際に Slack conversation API によって開かれます。

  </Accordion>
</AccordionGroup>

## コマンドとスラッシュ動作

スラッシュコマンドは、Slack では単一の設定済みコマンドとして、または複数のネイティブコマンドとして表示されます。コマンドデフォルトを変更するには `channels.slack.slashCommand` を設定します。

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

ネイティブコマンドには、Slack アプリで[追加のマニフェスト設定](#additional-manifest-settings)が必要で、代わりに `channels.slack.commands.native: true` またはグローバル設定の `commands.native: true` で有効になります。

- Slack ではネイティブコマンドの自動モードは **off** なので、`commands.native: "auto"` では Slack ネイティブコマンドは有効になりません。

```txt
/help
```

ネイティブ引数メニューは、選択したオプション値を送信する前に確認モーダルを表示する適応型レンダリング戦略を使います。

- 最大 5 オプション: ボタンブロック
- 6〜100 オプション: 静的セレクトメニュー
- 100 を超えるオプション: interactivity options handler が利用可能な場合は、非同期オプションフィルタリング付き external select
- Slack の上限超過時: エンコード済みオプション値はボタンにフォールバック

```txt
/think
```

スラッシュセッションは `agent:<agentId>:slack:slash:<userId>` のような分離キーを使い、引き続き `CommandTargetSessionKey` を使ってコマンド実行を対象会話セッションへルーティングします。

## インタラクティブ返信

Slack はエージェント作成のインタラクティブ返信コントロールを描画できますが、この機能はデフォルトで無効です。

グローバルに有効にするには:

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

または、1 つの Slack アカウントだけで有効にするには:

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

これらのディレクティブは Slack Block Kit にコンパイルされ、クリックや選択は既存の Slack interaction event パスを通じて戻されます。

注記:

- これは Slack 固有の UI です。他のチャンネルでは Slack Block Kit ディレクティブを各自のボタンシステムに変換しません。
- インタラクティブなコールバック値は OpenClaw 生成の不透明トークンであり、生のエージェント作成値ではありません。
- 生成されたインタラクティブブロックが Slack Block Kit の上限を超える場合、OpenClaw は無効な blocks ペイロードを送る代わりに元のテキスト返信へフォールバックします。

## Slack の Exec approvals

Slack は、Web UI やターミナルにフォールバックする代わりに、インタラクティブボタンと interactions を備えたネイティブ承認クライアントとして動作できます。

- Exec approvals は、ネイティブな DM/チャンネルルーティングに `channels.slack.execApprovals.*` を使います。
- Plugin approvals も、リクエストがすでに Slack に到達していて承認 ID 種別が `plugin:` の場合、同じ Slack ネイティブボタン UI で解決できます。
- 承認者の認可は引き続き強制されます。承認者として識別されたユーザーだけが Slack 経由でリクエストを承認または拒否できます。

これは他チャンネルと同じ共有承認ボタン UI を使用します。Slack アプリ設定で `interactivity` が有効な場合、承認プロンプトは会話内に直接 Block Kit ボタンとして描画されます。
それらのボタンがある場合、それが主要な承認 UX です。OpenClaw
は、ツール結果がチャット承認を利用不可としている場合、または手動承認が唯一の経路である場合にのみ、手動の `/approve` コマンドを含めるべきです。

設定パス:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（任意。可能な場合は `commands.ownerAllowFrom` にフォールバック）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `agentFilter`, `sessionFilter`

Slack は、`enabled` が未設定または `"auto"` で、少なくとも 1 人の
承認者が解決されると、ネイティブ exec approvals を自動有効化します。Slack をネイティブ承認クライアントとして明示的に無効にするには `enabled: false` を設定します。
承認者が解決されるときにネイティブ承認を強制的に有効にするには `enabled: true` を設定します。

明示的な Slack exec approval 設定がない場合のデフォルト動作:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

承認者を上書きしたい、フィルターを追加したい、または送信元チャットへの配信を有効にしたい場合にのみ、明示的な Slack ネイティブ設定が必要です。

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

共有の `approvals.exec` 転送は別です。exec 承認プロンプトも他チャットや明示的な帯域外宛先へルーティングする必要がある場合にのみ使ってください。共有の `approvals.plugin` 転送も別です。これらのリクエストがすでに Slack に到達している場合、Slack ネイティブボタンで plugin approvals を引き続き解決できます。

同一チャットでの `/approve` も、すでにコマンドをサポートしている Slack チャンネルと DM で動作します。完全な承認転送モデルについては、[Exec approvals](/ja-JP/tools/exec-approvals) を参照してください。

## イベントと運用時の動作

- メッセージの編集/削除/スレッドブロードキャストは system event にマップされます。
- リアクションの追加/削除イベントは system event にマップされます。
- メンバーの参加/退出、チャンネルの作成/リネーム、ピンの追加/削除イベントは system event にマップされます。
- `channel_id_changed` は、`configWrites` が有効な場合にチャンネル設定キーを移行できます。
- チャンネルトピック/目的メタデータは信頼されないコンテキストとして扱われ、ルーティングコンテキストに注入されることがあります。
- スレッド開始メッセージと初期スレッド履歴コンテキスト投入は、該当する場合、設定済みの送信者 allowlist によってフィルタリングされます。
- ブロックアクションとモーダル interaction は、リッチなペイロードフィールドを持つ構造化された `Slack interaction: ...` system event を出力します:
  - ブロックアクション: 選択値、ラベル、picker 値、`workflow_*` メタデータ
  - モーダルの `view_submission` および `view_closed` イベント: ルーティングされたチャンネルメタデータとフォーム入力付き

## 設定リファレンスへのポインタ

主なリファレンス:

- [設定リファレンス - Slack](/ja-JP/gateway/configuration-reference#slack)

  重要度の高い Slack フィールド:
  - モード/認証: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - DM アクセス: `dm.enabled`, `dmPolicy`, `allowFrom`（旧式: `dm.policy`, `dm.allowFrom`）, `dm.groupEnabled`, `dm.groupChannels`
  - 互換性トグル: `dangerouslyAllowNameMatching`（緊急用。必要ない限り無効のままにする）
  - チャンネルアクセス: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - スレッディング/履歴: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - 配信: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`
  - 運用/機能: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャンネルで返信がない">
    次の順に確認してください。

    - `groupPolicy`
    - チャンネル allowlist（`channels.slack.channels`）
    - `requireMention`
    - チャンネルごとの `users` allowlist

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
    - `channels.slack.dmPolicy`（または旧式の `channels.slack.dm.policy`）
    - ペアリング承認 / allowlist エントリ

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode が接続されない">
    bot トークンと app トークン、および Slack アプリ設定での Socket Mode 有効化を検証してください。

    `openclaw channels status --probe --json` で `botTokenStatus` または
    `appTokenStatus: "configured_unavailable"` が表示される場合、Slack アカウントは
    設定されていますが、現在のランタイムでは SecretRef ベースの
    値を解決できませんでした。

  </Accordion>

  <Accordion title="HTTP mode でイベントを受信しない">
    次を検証してください。

    - signing secret
    - webhook path
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - HTTP アカウントごとの一意の `webhookPath`

    アカウントスナップショットに `signingSecretStatus: "configured_unavailable"` が
    表示される場合、その HTTP アカウントは設定されていますが、現在のランタイムでは
    SecretRef ベースの signing secret を解決できませんでした。

  </Accordion>

  <Accordion title="ネイティブ/スラッシュコマンドが動作しない">
    意図したのがどちらかを確認してください。

    - Slack に一致するスラッシュコマンドが登録されたネイティブコマンドモード（`channels.slack.commands.native: true`）
    - または単一スラッシュコマンドモード（`channels.slack.slashCommand.enabled: true`）

    また、`commands.useAccessGroups` とチャンネル/ユーザー allowlist も確認してください。

  </Accordion>
</AccordionGroup>

## 関連項目

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [セキュリティ](/ja-JP/gateway/security)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
- [設定](/ja-JP/gateway/configuration)
- [スラッシュコマンド](/ja-JP/tools/slash-commands)
