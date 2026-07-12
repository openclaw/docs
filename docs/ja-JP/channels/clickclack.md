---
read_when:
    - OpenClaw を ClickClack ワークスペースに接続する
    - ClickClack ボットのアイデンティティをテストする
summary: ClickClack ボットトークンチャネルのセットアップとターゲット構文
title: ClickClack
x-i18n:
    generated_at: "2026-07-12T14:17:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack は、ファーストクラスの ClickClack ボットトークンを通じて、OpenClaw をセルフホストされた ClickClack ワークスペースに接続します。

OpenClaw エージェントを ClickClack ボットユーザーとして表示させたい場合に使用します。ClickClack は独立したサービスボットとユーザー所有ボットをサポートしています。ユーザー所有ボットは `owner_user_id` を保持し、付与されたトークンスコープのみを受け取ります。

## クイックセットアップ

ClickClack サーバーでボットトークンを作成します。

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

ユーザー所有ボットの場合は、`--owner <user_id>` を追加します。

OpenClaw を設定します。

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

次に実行します。

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

アカウントは、`baseUrl`、`token`、`workspace` がすべて設定されている場合にのみ、設定済みと見なされます。`workspace` にはワークスペース ID（`wsp_...`）、スラッグ、または名前を指定できます。Gateway は起動時にこれを ID に解決します。

### アカウント設定キー

| キー                    | デフォルト          | 備考                                                                                                            |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------- |
| `baseUrl`               | なし（必須）        | ClickClack サーバーの URL。                                                                                     |
| `token`                 | なし（必須）        | プレーン文字列またはシークレット参照（`source: "env" \| "file" \| "exec"`）。                                  |
| `workspace`             | なし（必須）        | ワークスペース ID、スラッグ、または名前。                                                                      |
| `replyMode`             | `"agent"`           | `"agent"` は完全なエージェントパイプラインを実行し、`"model"` は短い直接的なモデル補完を送信します。           |
| `defaultTo`             | `"channel:general"` | 送信パスでターゲットが指定されていない場合に使用するターゲット。                                              |
| `allowFrom`             | `["*"]`             | 受信 DM およびチャンネルメッセージに対するユーザー ID の許可リスト。                                          |
| `botUserId`             | 自動検出            | 起動時にボットトークンのアイデンティティから解決されます。                                                    |
| `agentId`               | ルートのデフォルト  | このアカウントの受信メッセージを 1 つのエージェントに固定します。                                             |
| `toolsAllow`            | なし                | このアカウントからのエージェント応答に対するツールの許可リスト。                                              |
| `model`, `systemPrompt` | なし                | `replyMode: "model"` の補完で使用されます。                                                                    |
| `reconnectMs`           | `1500`              | リアルタイム再接続の遅延（100～60000）。                                                                       |

`plugins.allow` が空でない制限リストの場合、チャンネルセットアップで
ClickClack を明示的に選択するか、`openclaw plugins enable clickclack` を実行すると、
そのリストに `clickclack` が追加されます。オンボーディングでのインストールでも、
同じ明示的な選択動作が使用されます。これらのパスは、`plugins.deny` または
グローバル設定 `plugins.enabled: false` を上書きしません。
`openclaw plugins install @openclaw/clickclack` を直接実行した場合は、通常の
Plugin インストールポリシーに従い、既存の許可リストにも ClickClack が記録されます。

## 複数のボット

各アカウントは独自の ClickClack リアルタイム接続を開き、独自のボットトークンを使用します。

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## 応答モード

- `replyMode: "agent"`（デフォルト）は、セッション記録とツールポリシーを含む通常のエージェントパイプラインを通じて受信メッセージをディスパッチします。
- `replyMode: "model"` はエージェントパイプラインをスキップし、Plugin ランタイムの `llm.complete` を使用して短い直接的なボット応答を生成します（必要に応じて `model` と `systemPrompt` で調整できます）。

モデルモードでは、解決されたボットエージェント ID に対して補完を実行します。そのためには、
明示的な信頼ビット `plugins.entries.clickclack.llm.allowAgentIdOverride: true` が
必要です。

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

デフォルトの `agent` 応答モードのみを使用する場合は、信頼ビットをオフのままにしてください。
このモードでは必要ありません。

サービス間の相関証拠には `agent` モードを使用します。正規の `msg_<ulid>` 形式の
正式な ClickClack メッセージ ID に対して、チャンネルは決定論的な OpenClaw 実行 ID
`clickclack:<message-id>` を導出します。各モデル呼び出しは、診断で
`clickclack:<message-id>:model:<n>` として表示されます。そのターンで
ClawRouter を使用する場合、同じモデル呼び出し ID が `X-Request-ID` として送信されます。
`model` モードは通常のエージェント実行／セッション診断を迂回するため、
この証拠パスには適していません。

リアルタイムイベントに検証済みの `payload.correlation_id` が含まれている場合、
チャンネルは正式なメッセージ取得と、その結果として行われる ClickClack 応答リクエストで、
これを `X-Correlation-ID` として引き継ぎます。値には ClickClack の安全な
128 文字セット（`A-Z`、`a-z`、`0-9`、`.`、`_`、`:`、`-`）を使用します。無効な値は
省略されます。これらの結合には識別子のみが含まれ、メッセージ本文、
プロンプト、補完、認証情報、ツール出力は一切含まれません。

## エージェントアクティビティ行

デフォルトでは、エージェントのターン実行中、ClickClack チャンネルには何も表示されず、最終応答のみが投稿されます。ターンの進行中に永続的な `agent_commentary` および `agent_tool` メッセージ行を公開するには、アカウントで `agentActivity: true` を設定します。

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

要件と動作：

- **デフォルトではオフです。** 標準セットアップおよび古い ClickClack サーバーには影響しません。
- **`agent_activity:write` トークンスコープが必要です。** このスコープは `bot:write` とは別であり、継承されません。このオプションを有効にする前に、`--scopes bot:write,agent_activity:write` を指定してボットトークンを作成するか、既存のトークンにこのスコープを付与してください。
- **ベストエフォートで機能を縮退します。** トークンに `agent_activity:write` がない場合や、サーバーがアクティビティの書き込みを拒否した場合は、失敗がログに記録され、最終応答は引き続き正常に配信されます。アクティビティ行は表示されません。
- 行はターンごと（`turn_id`）にグループ化され、1 つの論理ステップが 1 行になるように統合されます。ツール行では、Discord／Slack／Telegram と同じ進捗形式（ツール名とコマンドの詳細）が使用されます。
- **帰属メタデータ。** エージェントが作成した投稿（アクティビティ行と最終応答）には、ターンで実際に使用されたモデル（フォールバック後を含む）から解決された `author_model` および `author_thinking` フィールドが含まれます。これらのカラムを定義していないサーバーは未知の JSON フィールドを無視します。永続化するサーバーでは、メッセージごとに「どのモデルが、どの思考レベルでこの行を述べたか」を確認できます。

## ターゲット

- `channel:<name-or-id>` はワークスペースチャンネルに送信します。接頭辞のないターゲットには、デフォルトで `channel:` が使用されます。
- `dm:<user_id>` は、そのユーザーとのダイレクト会話を作成または再利用します。
- `thread:<message_id>` は、そのメッセージを起点とするスレッドに返信します。

明示的な送信ターゲットには、`clickclack:` または `cc:` プロバイダー接頭辞も指定できます。

例：

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 権限

ClickClack トークンスコープは ClickClack API によって適用されます。

- `bot:read`：ワークスペース／チャンネル／メッセージ／スレッド／DM／リアルタイム／プロフィールのデータを読み取ります。
- `bot:write`：`bot:read` に加え、チャンネルメッセージ、スレッド返信、DM、アップロードを許可します。
- `bot:admin`：`bot:write` に加え、チャンネル作成を許可します。
- `agent_activity:write`：永続的なエージェントアクティビティ行（`agent_commentary`／`agent_tool`）。`bot:write` または `bot:admin` には継承されず、`agentActivity: true` が設定されている場合にのみ必要です。

通常のエージェントチャットでは、OpenClaw に必要なのは `bot:write` のみです。[エージェントアクティビティ行](#agent-activity-rows)を有効にする場合は、`agent_activity:write` を追加してください。

## トラブルシューティング

- `ClickClack is not configured for account "<id>"`：そのアカウントに `baseUrl`、`token`（たとえば `CLICKCLACK_BOT_TOKEN` 経由）、`workspace` を設定してください。
- `ClickClack workspace not found: <value>`：`workspace` を ClickClack が返すワークスペース ID、スラッグ、または名前に設定してください。
- 受信応答がない場合：トークンにリアルタイム読み取りアクセスがあることを確認してください。また、ボットは自身のメッセージと他のボットからのメッセージを無視することに注意してください。
- チャンネルへの送信に失敗する場合：ボットがワークスペースのメンバーであり、`bot:write` を持っていることを確認してください。
