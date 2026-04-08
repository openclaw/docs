---
read_when:
    - Slack をセットアップする場合、または Slack の socket/HTTP モードをデバッグする場合
summary: Slack のセットアップと実行時の動作（Socket Mode + HTTP Request URLs）
title: Slack
x-i18n:
    generated_at: "2026-04-08T06:02:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: cad132131ddce688517def7c14703ad314441c67aacc4cc2a2a721e1d1c01942
    source_path: channels/slack.md
    workflow: 15
---

# Slack

ステータス: Slack アプリ連携による DM とチャンネル向けに本番運用対応。デフォルトのモードは Socket Mode で、HTTP Request URLs もサポートされています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Slack DM はデフォルトでペアリングモードです。
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

        - **from a manifest** を選び、アプリ用のワークスペースを選択します
        - 以下の [マニフェストとスコープのチェックリスト](#manifest-and-scope-checklist) にある [サンプルマニフェスト](#manifest-and-scope-checklist) を貼り付けて、作成を続行します
        - `connections:write` を持つ **App-Level Token**（`xapp-...`）を生成します
        - アプリをインストールし、表示される **Bot Token**（`xoxb-...`）をコピーします
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

        - **from a manifest** を選び、アプリ用のワークスペースを選択します
        - [サンプルマニフェスト](#manifest-and-scope-checklist) を貼り付け、作成前に URL を更新します
        - リクエスト検証のために **Signing Secret** を保存します
        - アプリをインストールし、表示される **Bot Token**（`xoxb-...`）をコピーします

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
        マルチアカウント HTTP では一意の webhook パスを使用してください

        登録が衝突しないように、各アカウントに異なる `webhookPath`（デフォルトは `/slack/events`）を設定してください。
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
    "description": "OpenClaw 向け Slack コネクタ"
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
        "description": "OpenClaw にメッセージを送信",
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
    "description": "OpenClaw 向け Slack コネクタ"
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
        "description": "OpenClaw にメッセージを送信",
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

<AccordionGroup>
  <Accordion title="任意の作成者スコープ（書き込み操作）">
    送信メッセージでデフォルトの Slack アプリ ID ではなく、アクティブなエージェント ID（カスタムのユーザー名とアイコン）を使いたい場合は、`chat:write.customize` ボットスコープを追加してください。

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
- `botToken`、`appToken`、`signingSecret`、`userToken` は平文の文字列または SecretRef オブジェクトを受け付けます。
- 設定内のトークンは環境変数のフォールバックより優先されます。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` の環境変数フォールバックはデフォルトアカウントにのみ適用されます。
- `userToken`（`xoxp-...`）は設定のみで使用可能で（環境変数のフォールバックなし）、デフォルトでは読み取り専用動作（`userTokenReadOnly: true`）になります。

ステータススナップショットの動作:

- Slack アカウントの検査では、認証情報ごとの `*Source` と `*Status` フィールド（`botToken`、`appToken`、`signingSecret`、`userToken`）を追跡します。
- ステータスは `available`、`configured_unavailable`、または `missing` です。
- `configured_unavailable` は、そのアカウントが SecretRef または別のインラインでないシークレットソースで設定されているものの、現在のコマンド/実行時パスでは実際の値を解決できなかったことを意味します。
- HTTP モードでは `signingSecretStatus` が含まれます。Socket Mode では、必要な組み合わせは `botTokenStatus` + `appTokenStatus` です。

<Tip>
アクションやディレクトリ読み取りでは、設定されていれば user token を優先できます。書き込みでは bot token が引き続き優先されます。`userTokenReadOnly: false` で、かつ bot token が利用できない場合にのみ、user-token の書き込みが許可されます。
</Tip>

## アクションとゲート

Slack アクションは `channels.slack.actions.*` で制御されます。

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
    `channels.slack.dmPolicy` は DM アクセスを制御します（レガシー: `channels.slack.dm.policy`）。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.slack.allowFrom` に `"*"` を含める必要があります。レガシー: `channels.slack.dm.allowFrom`）
    - `disabled`

    DM フラグ:

    - `dm.enabled`（デフォルトは true）
    - `channels.slack.allowFrom`（推奨）
    - `dm.allowFrom`（レガシー）
    - `dm.groupEnabled`（グループ DM のデフォルトは false）
    - `dm.groupChannels`（任意の MPIM 許可リスト）

    マルチアカウントの優先順位:

    - `channels.slack.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントは、自身の `allowFrom` が未設定の場合に `channels.slack.allowFrom` を継承します。
    - 名前付きアカウントは `channels.slack.accounts.default.allowFrom` を継承しません。

    DM でのペアリングには `openclaw pairing approve slack <code>` を使用します。

  </Tab>

  <Tab title="チャンネルポリシー">
    `channels.slack.groupPolicy` はチャンネル処理を制御します。

    - `open`
    - `allowlist`
    - `disabled`

    チャンネル許可リストは `channels.slack.channels` にあり、安定したチャンネル ID を使用する必要があります。

    実行時の注意: `channels.slack` が完全に存在しない場合（環境変数のみのセットアップ）、実行時は `groupPolicy="allowlist"` にフォールバックし、警告をログに出します（`channels.defaults.groupPolicy` が設定されていても同様です）。

    名前/ID の解決:

    - チャンネル許可リスト項目と DM 許可リスト項目は、トークンアクセスが可能であれば起動時に解決されます
    - 解決されなかったチャンネル名の項目は設定どおり保持されますが、デフォルトではルーティング時に無視されます
    - 受信時の認可とチャンネルルーティングはデフォルトで ID 優先です。直接のユーザー名/スラッグ一致には `channels.slack.dangerouslyAllowNameMatching: true` が必要です

  </Tab>

  <Tab title="メンションとチャンネルユーザー">
    チャンネルメッセージはデフォルトでメンションゲート付きです。

    メンション元:

    - 明示的なアプリメンション（`<@botId>`）
    - メンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - 暗黙の bot へのスレッド返信動作（`thread.requireExplicitMention` が `true` の場合は無効）

    チャンネルごとの制御（`channels.slack.channels.<id>`、名前は起動時の解決または `dangerouslyAllowNameMatching` 経由のみ）:

    - `requireMention`
    - `users`（許可リスト）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` のキー形式: `id:`、`e164:`、`username:`、`name:`、または `"*"` ワイルドカード
      （レガシーの接頭辞なしキーは引き続き `id:` のみにマップされます）

  </Tab>
</Tabs>

## スレッド、セッション、返信タグ

- DM は `direct`、チャンネルは `channel`、MPIM は `group` としてルーティングされます。
- デフォルトの `session.dmScope=main` では、Slack DM はエージェントのメインセッションに集約されます。
- チャンネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- スレッド返信では、適用可能な場合にスレッドセッション接尾辞（`:thread:<threadTs>`）を作成できます。
- `channels.slack.thread.historyScope` のデフォルトは `thread`、`thread.inheritParent` のデフォルトは `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッドセッション開始時に取得する既存スレッドメッセージ数を制御します（デフォルトは `20`、無効化するには `0` を設定）。
- `channels.slack.thread.requireExplicitMention`（デフォルト `false`）: `true` の場合、暗黙のスレッドメンションを抑制し、bot がすでにそのスレッドに参加していても、スレッド内で明示的な `@bot` メンションにのみ応答します。これがない場合、bot が参加済みのスレッドでの返信は `requireMention` ゲートをバイパスします。

返信スレッド制御:

- `channels.slack.replyToMode`: `off|first|all|batched`（デフォルト `off`）
- `channels.slack.replyToModeByChatType`: `direct|group|channel` ごと
- 直接チャット向けのレガシーフォールバック: `channels.slack.dm.replyToMode`

手動の返信タグがサポートされています:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

注意: `replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含め、Slack のすべての返信スレッド機能を無効にします。これは Telegram と異なり、Telegram では `"off"` モードでも明示的なタグは引き続き尊重されます。この違いはプラットフォームのスレッドモデルを反映したものです。Slack スレッドではメッセージがチャンネルから隠れますが、Telegram の返信はメインチャットの流れの中で表示されたままです。

## 確認リアクション

`ackReaction` は、OpenClaw が受信メッセージを処理中であることを示す確認用絵文字を送信します。

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- エージェント ID の絵文字フォールバック（`agents.list[].identity.emoji`、それ以外は `"👀"`）

注意:

- Slack は shortcode を想定します（例: `"eyes"`）。
- Slack アカウント単位またはグローバルでリアクションを無効にするには `""` を使用します。

## テキストストリーミング

`channels.slack.streaming` はライブプレビュー動作を制御します。

- `off`: ライブプレビューストリーミングを無効にします。
- `partial`（デフォルト）: プレビューテキストを最新の部分出力に置き換えます。
- `block`: チャンク化されたプレビュー更新を追記します。
- `progress`: 生成中は進捗ステータステキストを表示し、その後に最終テキストを送信します。

`channels.slack.streaming.nativeTransport` は、`channels.slack.streaming.mode` が `partial` のときの Slack ネイティブテキストストリーミングを制御します（デフォルト: `true`）。

- ネイティブテキストストリーミングと Slack assistant thread status を表示するには、返信スレッドが利用可能である必要があります。スレッド選択は引き続き `replyToMode` に従います。
- チャンネルおよびグループチャットのルートでは、ネイティブストリーミングが利用できない場合でも通常の下書きプレビューを使用できます。
- 最上位の Slack DM はデフォルトでスレッド外のままのため、スレッド形式のプレビューは表示されません。そこで進捗を見せたい場合は、スレッド返信または `typingReaction` を使用してください。
- メディアおよび非テキストのペイロードは通常配信にフォールバックします。
- 返信の途中でストリーミングが失敗した場合、OpenClaw は残りのペイロードを通常配信にフォールバックします。

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

- `channels.slack.streamMode`（`replace | status_final | append`）は自動的に `channels.slack.streaming.mode` に移行されます。
- 真偽値の `channels.slack.streaming` は自動的に `channels.slack.streaming.mode` と `channels.slack.streaming.nativeTransport` に移行されます。
- レガシーの `channels.slack.nativeStreaming` は自動的に `channels.slack.streaming.nativeTransport` に移行されます。

## 入力中リアクションのフォールバック

`typingReaction` は、OpenClaw が返信を処理している間、受信した Slack メッセージに一時的なリアクションを追加し、実行が終了したときにそれを削除します。これは、デフォルトの「入力中...」ステータスインジケーターを使用するスレッド返信の外側で特に有用です。

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意:

- Slack は shortcode を想定します（例: `"hourglass_flowing_sand"`）。
- リアクションはベストエフォートで、返信または失敗処理が完了した後に自動クリーンアップが試行されます。

## メディア、チャンク分割、配信

<AccordionGroup>
  <Accordion title="受信添付ファイル">
    Slack のファイル添付は、Slack がホストする非公開 URL からダウンロードされ（トークン認証付きリクエストフロー）、取得に成功しサイズ制限内であればメディアストアに書き込まれます。

    実行時の受信サイズ上限は、`channels.slack.mediaMaxMb` で上書きされない限りデフォルトで `20MB` です。

  </Accordion>

  <Accordion title="送信テキストとファイル">
    - テキストチャンクには `channels.slack.textChunkLimit`（デフォルト 4000）を使用します
    - `channels.slack.chunkMode="newline"` は段落優先の分割を有効にします
    - ファイル送信では Slack のアップロード API を使用し、スレッド返信（`thread_ts`）を含めることができます
    - 送信メディア上限は、設定されていれば `channels.slack.mediaMaxMb` に従います。それ以外の場合、チャンネル送信はメディアパイプラインの MIME 種別デフォルトに従います
  </Accordion>

  <Accordion title="配信先">
    推奨される明示的なターゲット:

    - DM は `user:<id>`
    - チャンネルは `channel:<id>`

    Slack DM は、ユーザーターゲットへ送信する際に Slack conversation API 経由で開かれます。

  </Accordion>
</AccordionGroup>

## コマンドとスラッシュの動作

- Slack ではネイティブコマンドの自動モードは **off** です（`commands.native: "auto"` では Slack ネイティブコマンドは有効になりません）。
- ネイティブ Slack コマンドハンドラーを有効にするには `channels.slack.commands.native: true`（またはグローバルの `commands.native: true`）を設定します。
- ネイティブコマンドが有効な場合、1 つの例外を除いて、対応するスラッシュコマンドを Slack に登録してください（`/<command>` 名）。
  - ステータスコマンドには `/agentstatus` を登録してください（Slack は `/status` を予約しています）
- ネイティブコマンドが有効でない場合は、`channels.slack.slashCommand` を通じて単一の設定済みスラッシュコマンドを実行できます。
- ネイティブ引数メニューは現在、レンダリング戦略を適応的に切り替えます。
  - 最大 5 個のオプション: ボタンブロック
  - 6〜100 個のオプション: 静的セレクトメニュー
  - 100 個を超えるオプション: インタラクティビティのオプションハンドラーが利用可能な場合、非同期オプションフィルタリング付きの external select
  - エンコードされたオプション値が Slack の制限を超える場合、フローはボタンにフォールバックします
- 長いオプションペイロードでは、スラッシュコマンド引数メニューは選択値を送信する前に確認ダイアログを使用します。

デフォルトのスラッシュコマンド設定:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

スラッシュセッションは分離されたキーを使用します:

- `agent:<agentId>:slack:slash:<userId>`

また、コマンド実行は引き続き対象会話セッション（`CommandTargetSessionKey`）に対してルーティングされます。

## インタラクティブ返信

Slack はエージェント作成のインタラクティブ返信コントロールをレンダリングできますが、この機能はデフォルトで無効です。

グローバルに有効にする:

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

または、1 つの Slack アカウントだけで有効にする:

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

これらのディレクティブは Slack Block Kit にコンパイルされ、クリックまたは選択は既存の Slack interaction event パスを通じて戻されます。

注意:

- これは Slack 固有の UI です。他のチャンネルは Slack Block Kit ディレクティブをそれぞれのボタンシステムに変換しません。
- インタラクティブコールバック値は OpenClaw 生成の不透明トークンであり、生のエージェント作成値ではありません。
- 生成されたインタラクティブブロックが Slack Block Kit の制限を超える場合、OpenClaw は無効な blocks ペイロードを送信する代わりに元のテキスト返信へフォールバックします。

## Slack での Exec 承認

Slack は、Web UI やターミナルへのフォールバックではなく、インタラクティブボタンとインタラクションを備えたネイティブ承認クライアントとして動作できます。

- Exec 承認は、ネイティブの DM/チャンネルルーティングに `channels.slack.execApprovals.*` を使用します。
- プラグイン承認も、リクエストがすでに Slack に届いており、承認 ID 種別が `plugin:` の場合は、同じ Slack ネイティブボタン UI を通じて解決できます。
- 承認者の認可は引き続き強制されます。承認者として識別されたユーザーだけが、Slack 経由でリクエストを承認または拒否できます。

これは他のチャンネルと同じ共有承認ボタン UI を使用します。Slack アプリ設定で `interactivity` が有効な場合、承認プロンプトは会話内に直接 Block Kit ボタンとしてレンダリングされます。
それらのボタンが存在する場合、それが主要な承認 UX となります。OpenClaw は、ツール結果がチャット承認を利用できないと示す場合、または手動承認が唯一の経路である場合にのみ、手動の `/approve` コマンドを含めるべきです。

設定パス:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（任意。可能であれば `commands.ownerAllowFrom` にフォールバック）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `agentFilter`, `sessionFilter`

Slack は、`enabled` が未設定または `"auto"` で、かつ少なくとも 1 人の承認者が解決される場合、ネイティブ exec 承認を自動有効化します。
Slack をネイティブ承認クライアントとして明示的に無効にするには `enabled: false` を設定します。
承認者が解決されるときにネイティブ承認を強制的に有効にするには `enabled: true` を設定します。

明示的な Slack exec 承認設定がない場合のデフォルト動作:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

承認者の上書き、フィルターの追加、または発信元チャットへの配信を有効にしたい場合にのみ、明示的な Slack ネイティブ設定が必要です。

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

共有の `approvals.exec` 転送は別です。Exec 承認プロンプトを他のチャットや明示的な帯域外ターゲットにもルーティングする必要がある場合にのみ使用してください。共有の `approvals.plugin` 転送も別です。Slack ネイティブボタンは、それらのリクエストがすでに Slack に届いている場合、引き続きプラグイン承認を解決できます。

同一チャット内の `/approve` も、すでにコマンドをサポートしている Slack チャンネルと DM で動作します。完全な承認転送モデルについては [Exec approvals](/ja-JP/tools/exec-approvals) を参照してください。

## イベントと運用時の動作

- メッセージ編集/削除/スレッドブロードキャストはシステムイベントにマップされます。
- リアクション追加/削除イベントはシステムイベントにマップされます。
- メンバー参加/退出、チャンネル作成/名称変更、ピン追加/削除イベントはシステムイベントにマップされます。
- `channel_id_changed` は、`configWrites` が有効な場合にチャンネル設定キーを移行できます。
- チャンネルトピック/目的のメタデータは信頼されないコンテキストとして扱われ、ルーティングコンテキストに注入されることがあります。
- スレッド開始メッセージと初期スレッド履歴コンテキストのシードは、適用可能な場合、設定済み送信者許可リストによってフィルタリングされます。
- ブロックアクションとモーダルインタラクションは、リッチなペイロードフィールドを持つ構造化された `Slack interaction: ...` システムイベントを出力します。
  - ブロックアクション: 選択値、ラベル、picker 値、`workflow_*` メタデータ
  - モーダル `view_submission` と `view_closed` イベント。ルーティングされたチャンネルメタデータとフォーム入力を含みます

## 設定リファレンスの参照先

主な参照先:

- [設定リファレンス - Slack](/ja-JP/gateway/configuration-reference#slack)

  重要な Slack フィールド:
  - モード/認証: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - DM アクセス: `dm.enabled`, `dmPolicy`, `allowFrom`（レガシー: `dm.policy`, `dm.allowFrom`）、`dm.groupEnabled`, `dm.groupChannels`
  - 互換性トグル: `dangerouslyAllowNameMatching`（緊急用。必要になるまで無効のままにしてください）
  - チャンネルアクセス: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - スレッド/履歴: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - 配信: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`
  - 運用/機能: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

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
    - `channels.slack.dmPolicy`（またはレガシーの `channels.slack.dm.policy`）
    - ペアリング承認 / 許可リスト項目

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode が接続しない">
    bot トークンと app トークン、および Slack アプリ設定での Socket Mode 有効化を確認してください。

    `openclaw channels status --probe --json` で `botTokenStatus` または
    `appTokenStatus: "configured_unavailable"` が表示される場合、その Slack アカウントは
    設定されていますが、現在の実行時では SecretRef によって保持された
    値を解決できませんでした。

  </Accordion>

  <Accordion title="HTTP mode でイベントを受信しない">
    次を確認してください。

    - signing secret
    - webhook path
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - HTTP アカウントごとの一意な `webhookPath`

    アカウントスナップショットに `signingSecretStatus: "configured_unavailable"` が
    表示される場合、その HTTP アカウントは設定されていますが、現在の実行時で
    SecretRef によって保持された signing secret を解決できませんでした。

  </Accordion>

  <Accordion title="ネイティブ/スラッシュコマンドが反応しない">
    意図していた設定が次のどちらかを確認してください。

    - ネイティブコマンドモード（`channels.slack.commands.native: true`）で、対応するスラッシュコマンドが Slack に登録されている
    - または単一スラッシュコマンドモード（`channels.slack.slashCommand.enabled: true`）

    あわせて `commands.useAccessGroups` とチャンネル/ユーザーの許可リストも確認してください。

  </Accordion>
</AccordionGroup>

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [セキュリティ](/ja-JP/gateway/security)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
- [設定](/ja-JP/gateway/configuration)
- [スラッシュコマンド](/ja-JP/tools/slash-commands)
