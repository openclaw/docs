---
read_when:
    - OpenClawをClickClackワークスペースに接続する
    - ClickClackボットのアイデンティティをテストする
summary: ClickClack ボットトークンチャンネルのセットアップとターゲット構文
title: ClickClack
x-i18n:
    generated_at: "2026-07-11T21:56:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack は、正式対応の ClickClack ボットトークンを介して、OpenClaw をセルフホスト型 ClickClack ワークスペースに接続します。

OpenClaw エージェントを ClickClack ボットユーザーとして表示したい場合に使用します。ClickClack は、独立したサービスボットとユーザー所有のボットをサポートしています。ユーザー所有のボットは `owner_user_id` を保持し、付与したトークンスコープのみを受け取ります。

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

ユーザー所有のボットの場合は、`--owner <user_id>` を追加します。

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

アカウントは、`baseUrl`、`token`、`workspace` がすべて設定されている場合にのみ、設定済みとみなされます。`workspace` には、ワークスペース ID（`wsp_...`）、スラッグ、または名前を指定できます。Gateway は起動時にこれを ID に解決します。

### アカウント設定キー

| キー                    | デフォルト          | 注記                                                                                    |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | なし（必須）        | ClickClack サーバーの URL。                                                             |
| `token`                 | なし（必須）        | 平文文字列またはシークレット参照（`source: "env" \| "file" \| "exec"`）。               |
| `workspace`             | なし（必須）        | ワークスペース ID、スラッグ、または名前。                                               |
| `replyMode`             | `"agent"`           | `"agent"` は完全なエージェントパイプラインを実行し、`"model"` は短い直接モデル補完を送信します。 |
| `defaultTo`             | `"channel:general"` | 送信経路でターゲットが指定されていない場合に使用するターゲット。                        |
| `allowFrom`             | `["*"]`             | 受信 DM およびチャンネルメッセージ用のユーザー ID 許可リスト。                          |
| `botUserId`             | 自動検出            | 起動時にボットトークンのアイデンティティから解決されます。                              |
| `agentId`               | ルートのデフォルト  | このアカウントの受信メッセージを 1 つのエージェントに固定します。                       |
| `toolsAllow`            | なし                | このアカウントからのエージェント返信に対するツール許可リスト。                          |
| `model`, `systemPrompt` | なし                | `replyMode: "model"` の補完で使用されます。                                              |
| `reconnectMs`           | `1500`              | リアルタイム再接続の遅延時間（100～60000）。                                            |

`plugins.allow` が空ではない制限リストの場合、チャンネル設定で ClickClack を明示的に選択するか、`openclaw plugins enable clickclack` を実行すると、そのリストに `clickclack` が追加されます。オンボーディングでのインストールでも、同じ明示的選択の動作が使用されます。これらの経路では、`plugins.deny` またはグローバルな `plugins.enabled: false` 設定は上書きされません。`openclaw plugins install @openclaw/clickclack` を直接実行した場合は、通常の Plugin インストールポリシーに従い、既存の許可リストにも ClickClack が記録されます。

## 複数のボット

各アカウントは、それぞれ独自の ClickClack リアルタイム接続を開き、独自のボットトークンを使用します。

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

## 返信モード

- `replyMode: "agent"`（デフォルト）は、セッション記録とツールポリシーを含む通常のエージェントパイプラインを通して受信メッセージを処理します。
- `replyMode: "model"` はエージェントパイプラインを省略し、Plugin ランタイムの `llm.complete` を使用して、短い直接的なボット返信を生成します（必要に応じて `model` と `systemPrompt` で調整できます）。

モデルモードは、解決されたボットエージェント ID に対して補完を実行するため、明示的な `plugins.entries.clickclack.llm.allowAgentIdOverride: true` 信頼フラグが必要です。

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

デフォルトの `agent` 返信モードのみを使用する場合は、信頼フラグを無効のままにしてください。このモードでは必要ありません。

サービス間の相関証跡には `agent` モードを使用します。正規の `msg_<ulid>` 形式を持つ信頼できる ClickClack メッセージ ID に対して、チャンネルは決定論的な OpenClaw 実行 ID `clickclack:<message-id>` を導出します。各モデル呼び出しは、診断で `clickclack:<message-id>:model:<n>` として確認できます。そのターンで ClawRouter を使用する場合、同じモデル呼び出し ID が `X-Request-ID` として送信されます。`model` モードは通常のエージェント実行／セッション診断を迂回するため、この証跡経路には適していません。

リアルタイムイベントに検証済みの `payload.correlation_id` が含まれる場合、チャンネルは信頼できるメッセージ取得と、それによって生成される ClickClack 返信リクエストに、その値を `X-Correlation-ID` として引き継ぎます。値には ClickClack の安全な 128 文字セット（`A-Z`、`a-z`、`0-9`、`.`、`_`、`:`、`-`）を使用します。無効な値は省略されます。これらの結合に含まれるのは識別子のみで、メッセージ本文、プロンプト、補完、認証情報、ツール出力が含まれることはありません。

## エージェントアクティビティ行

デフォルトでは、エージェントのターン実行中、ClickClack チャンネルには何も表示されず、最終返信のみが投稿されます。アカウントで `agentActivity: true` を設定すると、ターンの進行中に永続的な `agent_commentary` および `agent_tool` メッセージ行が公開されます。

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

- **デフォルトでは無効です。** 標準設定および古い ClickClack サーバーには影響しません。
- **`agent_activity:write` トークンスコープが必要です。** このスコープは `bot:write` とは別であり、そこから継承されません。このオプションを有効にする前に、`--scopes bot:write,agent_activity:write` を指定してボットトークンを作成するか、既存のトークンにこのスコープを付与してください。
- **ベストエフォートで縮退します。** トークンに `agent_activity:write` がない場合、またはサーバーがアクティビティ書き込みを拒否した場合、失敗はログに記録されますが、最終返信は通常どおり配信されます。アクティビティ行は表示されません。
- 行はターンごと（`turn_id`）にグループ化され、1 つの論理ステップが 1 行になるよう統合されます。ツール行は Discord／Slack／Telegram と同じ進捗書式（ツール名とコマンドの詳細）を使用します。
- **帰属メタデータ。** エージェントが作成した投稿（アクティビティ行と最終返信）には、そのターンで実際に使用されたモデル（フォールバック後を含む）から解決された `author_model` および `author_thinking` フィールドが含まれます。これらの列が定義されていないサーバーは不明な JSON フィールドを無視します。これらを永続化するサーバーでは、メッセージごとに「この行をどのモデルが、どの思考レベルで生成したか」を確認できます。

## ターゲット

- `channel:<name-or-id>` はワークスペースのチャンネルに送信します。プレフィックスのないターゲットには、デフォルトで `channel:` が適用されます。
- `dm:<user_id>` は、そのユーザーとのダイレクト会話を作成または再利用します。
- `thread:<message_id>` は、そのメッセージを起点とするスレッドに返信します。

明示的な送信ターゲットには、`clickclack:` または `cc:` プロバイダープレフィックスを付けることもできます。

例：

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 権限

ClickClack トークンスコープは ClickClack API によって適用されます。

- `bot:read`：ワークスペース、チャンネル、メッセージ、スレッド、DM、リアルタイム、プロフィールのデータを読み取ります。
- `bot:write`：`bot:read` に加え、チャンネルメッセージ、スレッド返信、DM、アップロードを許可します。
- `bot:admin`：`bot:write` に加え、チャンネル作成を許可します。
- `agent_activity:write`：永続的なエージェントアクティビティ行（`agent_commentary`／`agent_tool`）。`bot:write` または `bot:admin` からは継承されません。`agentActivity: true` を設定した場合にのみ必要です。

通常のエージェントチャットでは、OpenClaw に必要なのは `bot:write` のみです。[エージェントアクティビティ行](#agent-activity-rows)を有効にする場合は、`agent_activity:write` を追加してください。

## トラブルシューティング

- `ClickClack is not configured for account "<id>"`：そのアカウントに `baseUrl`、`token`（たとえば `CLICKCLACK_BOT_TOKEN` 経由）、`workspace` を設定してください。
- `ClickClack workspace not found: <value>`：`workspace` に、ClickClack が返したワークスペース ID、スラッグ、または名前を設定してください。
- 受信返信がない：トークンにリアルタイム読み取りアクセス権があることを確認してください。また、ボットは自身のメッセージと他のボットからのメッセージを無視することに注意してください。
- チャンネルへの送信に失敗する：ボットがワークスペースのメンバーであり、`bot:write` を持っていることを確認してください。
