---
read_when:
    - OpenClaw を ClickClack ワークスペースに接続する
    - ClickClackボットのアイデンティティのテスト
summary: ClickClack ボットトークンチャンネルのセットアップとターゲット構文
title: ClickClack
x-i18n:
    generated_at: "2026-07-16T11:21:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c422664ecdc9e41eb1810ca61654b886f1c51357fb9f48054d30c20a86ea8bc
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack は、正式にサポートされた ClickClack ボットトークンを介して、OpenClaw をセルフホスト型 ClickClack ワークスペースに接続します。

OpenClaw エージェントを ClickClack ボットユーザーとして表示したい場合に使用します。ClickClack は独立したサービスボットとユーザー所有ボットをサポートしています。ユーザー所有ボットは `owner_user_id` を保持し、付与したトークンスコープのみを受け取ります。

## クイックセットアップ

ClickClack で **Workspace settings → Integrations → OpenClaw** を開き、ボットを作成して、そのトークンをコピーします。次に、チャンネルを設定します。

```bash
openclaw channels add clickclack --base-url https://clickclack.example.com --token ccb_... --workspace default
```

`workspace` には、ワークスペース ID（`wsp_...`）、スラッグ、または表示名を指定できます。
`channels add` は、保存後にサーバー、トークン、ワークスペースを検証し、実行中の Gateway が新しいアカウントを認識したかどうかを報告します。OpenClaw がすでに実行中の場合、ClickClack は自動的に接続するため、2 つ目のコマンドは不要です。それ以外の場合は、次のコマンドで起動します。

```bash
openclaw gateway
```

ガイド付きセットアップを行うには、次を実行します。

```bash
openclaw onboard
```

ClickClack を選択し、プロンプトに従ってサーバー URL、ボットトークン、ワークスペースを入力します。ガイド付きセットアップでは、保存後にサーバー、トークン、ワークスペースを確認します。確認に失敗しても設定は破棄されません。

### 代替方法：環境変数ベースのトークン

デフォルトアカウントでは、トークンを設定に保存する代わりに `CLICKCLACK_BOT_TOKEN` を読み取ることができます。

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw channels add clickclack --base-url https://clickclack.example.com --workspace default --use-env
openclaw gateway
```

名前付きアカウントでは、設定済みのトークンまたはトークンファイルを使用する必要があります。共有環境変数は意図的にデフォルトアカウントのみに制限されています。

### JSON5 リファレンス

同等の設定構造は次のとおりです。

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

アカウントが設定済みと見なされるのは、`baseUrl`、トークンソース、`workspace` がすべて設定されている場合のみです。デフォルトアカウントのトークンソースには、`token`、`tokenFile`、または `CLICKCLACK_BOT_TOKEN` を指定できます。`workspace` には、ワークスペース ID（`wsp_...`）、スラッグ、または名前を指定できます。Gateway は起動時にこれを ID に解決します。

### アカウント設定キー

| キー                     | デフォルト             | 注記                                                                                   |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | なし（必須）     | ClickClack サーバーの URL。                                                                  |
| `token`                 | なし                | プレーン文字列またはシークレット参照（`source: "env" \| "file" \| "exec"`）としてのボットトークン。        |
| `tokenFile`             | なし                | ボットトークンファイルへのパス。`token` より優先されます。                                |
| `workspace`             | なし（必須）     | ワークスペース ID、スラッグ、または名前。                                                            |
| `replyMode`             | `"agent"`           | `"agent"` は完全なエージェントパイプラインを実行し、`"model"` は短いモデル補完を直接送信します。 |
| `defaultTo`             | `"channel:general"` | 送信パスでターゲットが指定されていない場合に使用するターゲット。                                      |
| `allowFrom`             | `["*"]`             | 受信 DM およびチャンネルメッセージに対するユーザー ID の許可リスト。                                 |
| `botUserId`             | 自動検出       | 起動時にボットトークンの ID から解決されます。                                        |
| `agentId`               | ルートのデフォルト       | このアカウントの受信メッセージを 1 つのエージェントに固定します。                                       |
| `toolsAllow`            | なし                | このアカウントからのエージェント返信に対するツール許可リスト。                                     |
| `model`、`systemPrompt` | なし                | `replyMode: "model"` の補完で使用されます。                                               |
| `commandMenu`           | `true`              | ネイティブコマンドを ClickClack コンポーザーの自動補完に公開します。                            |
| `reconnectMs`           | `1500`              | リアルタイム再接続の遅延（100～60000）。                                                |

`plugins.allow` が空でない制限的なリストの場合、チャンネルセットアップで ClickClack を明示的に選択するか、`openclaw plugins enable clickclack` を実行すると、そのリストに `clickclack` が追加されます。オンボーディングによるインストールでも、同じ明示的選択動作が使用されます。これらのパスは、`plugins.deny` またはグローバルな `plugins.enabled: false` 設定を上書きしません。`openclaw plugins install @openclaw/clickclack` を直接実行した場合は、通常の Plugin インストールポリシーに従い、既存の許可リストにも ClickClack が記録されます。

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

- `replyMode: "agent"`（デフォルト）は、セッション記録やツールポリシーを含む通常のエージェントパイプラインを通じて、受信メッセージをディスパッチします。
- `replyMode: "model"` はエージェントパイプラインをスキップし、Plugin ランタイムの `llm.complete` を使用してボットから直接返信します。必要に応じて `model` と `systemPrompt` で形式を調整できます。選択したプロバイダーとモデルが補完の予算を管理します。

モデルモードでは、解決されたボットエージェント ID に対して補完が実行されます。そのため、明示的な `plugins.entries.clickclack.llm.allowAgentIdOverride: true` 信頼ビットが必要です。

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

デフォルトの `agent` 返信モードのみを使用する場合は、信頼ビットをオフのままにしてください。そのモードでは必要ありません。

## コマンドメニュー

Gateway の起動時に、設定済みの各アカウントが OpenClaw のネイティブコマンドを ClickClack に公開します。これらはボットのハンドルでラベル付けされ、コンポーザーの自動補完に表示されます。公開済みのセットは起動のたびにすべて置き換えられます。ネイティブコマンドカタログが空の場合は、古いメニューも消去されます。

コマンドメニューの同期はデフォルトで有効です。無効にするには、アカウントで `commandMenu: false` を設定します。

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      commandMenu: false,
    },
  },
}
```

トークンには `commands:write` が必要です。現在の ClickClack の `bot:write` バンドルと `bot:admin` バンドルにはこのスコープが含まれており、個別に付与することもできます。コマンドメニュー導入前に作成されたトークンでは、スコープの追加またはトークンの置き換えが必要になる場合があります。

同期はベストエフォートで、Gateway の起動ごとに 1 回実行されます。スコープの不足やネットワーク障害は警告としてログに記録されます。エンドポイントを備えていない古い ClickClack サーバーの場合は、デバッグレベルでログに記録されます。いずれの障害もリアルタイム起動を妨げません。メニューはエージェントがオフラインの間も引き続き利用でき、ボットがワークスペースから退出すると削除されます。

このリリースでは、ネイティブコマンド仕様のみを公開します。エイリアス、および Skills、Plugin、カスタムコマンドのカタログはメニューに追加されません。同じ名前が HTTP スラッシュコマンドとしても登録されている場合、ClickClack はその登録を先にディスパッチします。その他のメニューコマンドは、通常のメッセージ配信を通じて処理されます。

サービス間の相関を示す証拠には、`agent` モードを使用します。正規の `msg_<ulid>` 形式の正式な ClickClack メッセージ ID から、チャンネルは決定論的な OpenClaw 実行 ID `clickclack:<message-id>` を導出します。その後、各モデル呼び出しは診断情報に `clickclack:<message-id>:model:<n>` として表示されます。そのターンで ClawRouter を使用する場合、同じモデル呼び出し ID が `X-Request-ID` として送信されます。`model` モードは通常のエージェント実行およびセッション診断を迂回するため、この証拠パスには適していません。

リアルタイムイベントに検証済みの `payload.correlation_id` が含まれている場合、チャンネルは正式なメッセージ取得と、その結果として行われる ClickClack 返信リクエストで、それを `X-Correlation-ID` として引き継ぎます。値には ClickClack の安全な 128 文字セット（`A-Z`、`a-z`、`0-9`、`.`、`_`、`:`、`-`）が使用され、無効な値は省略されます。これらの結合に含まれるのは識別子のみであり、メッセージ本文、プロンプト、補完、認証情報、ツール出力が含まれることはありません。

## 永続的なメディア配信

メディアを含むエージェント返信では、必須の永続的配信が使用されます。OpenClaw は ClickClack への最初の書き込み前に、パーツごとに安定したメッセージノンスとアップロードノンスを割り当てます。そのため、再試行ではストレージクォータを消費したり重複を公開したりせず、同じアップロードとメッセージを再利用します。再起動後にアップロードがすでに存在する場合、OpenClaw は元のローカルパスやリモートメディア URL を再読み込みしません。

この復旧契約には、次をサポートする ClickClack サーバーが必要です。

- `GET /api/uploads/by-nonce`。見つかった場合と見つからない場合の結果に
  `X-ClickClack-Upload-Nonce: supported` を含むこと。
- `GET /api/messages/by-nonce`。見つかった場合と見つからない場合の結果に
  `X-ClickClack-Message-Nonce: supported` を含むこと。
- 同じ所有者スコープのノンスとアップロードに対する、べき等なメッセージ作成と添付ファイルの関連付け。

古いサーバーが返す汎用的な 404 は、送信が存在しないことの証明とは見なされません。OpenClaw は重複のリスクを避けるため、配信を未解決のままにします。メディアを生成するエージェント返信を有効にする前に ClickClack を更新してください。

## エージェントアクティビティ行

デフォルトでは、エージェントターンの実行中に ClickClack チャンネルには何も表示されず、最終返信のみが投稿されます。ターンの進行中に永続的な `agent_commentary` および `agent_tool` メッセージ行を公開するには、アカウントで `agentActivity: true` を設定します。

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

- **デフォルトでは無効。** 標準設定と古い ClickClack サーバーには影響しません。
- **`agent_activity:write` トークンスコープが必要。** このスコープは `bot:write` とは別であり、そこから継承されません。このオプションを有効にする前に、`--scopes bot:write,agent_activity:write` を指定してボットトークンを作成するか、既存のトークンにスコープを付与してください。
- **ベストエフォートでの機能縮退。** トークンに `agent_activity:write` がない場合、またはサーバーがアクティビティの書き込みを拒否した場合、失敗はログに記録されますが、最終返信は通常どおり配信されます。アクティビティ行は表示されません。
- 行はターンごと（`turn_id`）にグループ化され、1 つの論理ステップが 1 行になるよう統合されます。ツール行には Discord、Slack、Telegram と同じ進行状況の書式（ツール名とコマンドの詳細）が使用されます。
- **帰属メタデータ。** エージェントが作成した投稿（アクティビティ行と最終返信）には、そのターンで実際に使用されたモデル（フォールバック後も含む）から解決された `author_model` フィールドと `author_thinking` フィールドが含まれます。これらの列を定義していないサーバーは未知の JSON フィールドを無視します。これらを永続化するサーバーでは、メッセージごとに「どのモデルが、どの思考レベルでこの行を生成したか」を確認できます。

## ターゲット

- `channel:<name-or-id>` はワークスペースのチャンネルに送信します。プレフィックスのないターゲットはデフォルトで `channel:` になります。
- `dm:<user_id>` は、そのユーザーとのダイレクト会話を作成または再利用します。
- `thread:<message_id>` は、そのメッセージを起点とするスレッドに返信します。

明示的な送信先ターゲットには、`clickclack:` または `cc:` プロバイダープレフィックスを付けることもできます。

送信メディアでは ClickClack のアップロード API を使用し、その後、永続化されたアップロードを
作成されたチャンネルメッセージ、スレッド返信、または DM に添付します。ローカルファイルとサポート対象の
リモートメディア URL には、ファイルあたり 64 MiB の制限とともに、OpenClaw の通常のメディアアクセス
ポリシーが適用されます。永続キューによる送信では、アップロードとメッセージの各パートに対して、
所有者スコープの個別の nonce を使用し、その後、同じオブジェクトを使用して添付の関連付けを再試行します。
サーバーの契約と復旧動作については、[永続的なメディア配信](#durable-media-delivery)を参照してください。

例:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 権限

ClickClack トークンのスコープは ClickClack API によって適用されます。

- `bot:read`: ワークスペース、チャンネル、メッセージ、スレッド、DM、リアルタイム、プロフィールのデータを読み取ります。
- `bot:write`: `bot:read` に加えて、チャンネルメッセージ、スレッド返信、DM、アップロード、コマンドメニューの公開を許可します。
- `bot:admin`: `bot:write` に加えて、チャンネルの作成を許可します。
- `commands:write`: ボットのコマンドメニューを公開します。現在の `bot:write` および `bot:admin` バンドルに含まれており、個別に付与することもできます。
- `agent_activity:write`: 永続的なエージェントアクティビティ行（`agent_commentary` / `agent_tool`）。`bot:write` または `bot:admin` には継承されません。`agentActivity: true` が設定されている場合にのみ必要です。

通常のエージェントチャットとコマンドメニューの同期には、OpenClaw は現在の `bot:write` のみを必要とします。[エージェントアクティビティ行](#agent-activity-rows)を有効にする場合は、`agent_activity:write` を追加してください。

## トラブルシューティング

- `ClickClack is not configured for account "<id>"`: そのアカウントに対して、`baseUrl`、`token`（たとえば `CLICKCLACK_BOT_TOKEN` 経由）、および `workspace` を設定します。
- `ClickClack workspace not found: <value>`: `workspace` を、ClickClack から返されたワークスペースの ID、スラッグ、または名前に設定します。
- 受信返信がない: トークンにリアルタイム読み取りアクセス権があることを確認してください。また、ボットは自身のメッセージと他のボットからのメッセージを無視することに注意してください。
- チャンネルへの送信に失敗する: ボットがワークスペースのメンバーであり、`bot:write` を持っていることを確認してください。
- コマンドメニューがない: `commandMenu` が `false` ではないこと、ClickClack サーバーが `PUT /api/bots/self/commands` をサポートしていること、およびトークンが `commands:write` を持っていることを確認してください。
