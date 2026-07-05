---
read_when:
    - OpenClaw を ClickClack ワークスペースに接続する
    - ClickClack ボット ID のテスト
summary: ClickClack の bot-token チャンネル設定とターゲット構文
title: ClickClack
x-i18n:
    generated_at: "2026-07-05T17:39:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 164f6ee2e41092adf26d753c835ca82b2eb730e1fa93e987f07b7346441dff09
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack は、ファーストクラスの ClickClack ボットトークンを通じて、OpenClaw をセルフホストされた ClickClack ワークスペースに接続します。

OpenClaw エージェントを ClickClack ボットユーザーとして表示したい場合に使用します。ClickClack は独立したサービスボットとユーザー所有ボットをサポートします。ユーザー所有ボットは `owner_user_id` を保持し、付与したトークンスコープのみを受け取ります。

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

アカウントは、`baseUrl`、`token`、`workspace` がすべて設定されている場合にのみ設定済みとして扱われます。`workspace` はワークスペース ID (`wsp_...`)、スラッグ、または名前を受け入れます。Gateway は起動時にそれを ID に解決します。

### アカウント設定キー

| キー                     | デフォルト          | 注記                                                                                    |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | なし（必須）        | ClickClack サーバー URL。                                                               |
| `token`                 | なし（必須）        | プレーン文字列またはシークレット参照 (`source: "env" \| "file" \| "exec"`)。            |
| `workspace`             | なし（必須）        | ワークスペース ID、スラッグ、または名前。                                               |
| `replyMode`             | `"agent"`           | `"agent"` は完全なエージェントパイプラインを実行します。`"model"` は短い直接モデル補完を送信します。 |
| `defaultTo`             | `"channel:general"` | アウトバウンドパスでターゲットが指定されていない場合に使用されるターゲット。            |
| `allowFrom`             | `["*"]`             | 受信 DM とチャンネルメッセージのユーザー ID 許可リスト。                                |
| `botUserId`             | 自動検出            | 起動時にボットトークン ID から解決されます。                                            |
| `agentId`               | ルートデフォルト    | このアカウントの受信メッセージを 1 つのエージェントに固定します。                       |
| `toolsAllow`            | なし                | このアカウントからのエージェント返信で使用できるツールの許可リスト。                    |
| `model`, `systemPrompt` | なし                | `replyMode: "model"` 補完で使用されます。                                               |
| `reconnectMs`           | `1500`              | リアルタイム再接続遅延（100 から 60000）。                                              |

`plugins.allow` が空でない制限リストの場合、チャンネル設定で ClickClack を明示的に選択するか、`openclaw plugins enable clickclack` を実行すると、そのリストに `clickclack` が追加されます。オンボーディングのインストールでも同じ明示的選択の動作が使われます。これらのパスは `plugins.deny` やグローバルな `plugins.enabled: false` 設定を上書きしません。直接 `openclaw plugins install @openclaw/clickclack` を実行すると、通常の Plugin インストールポリシーに従い、既存の許可リストにも ClickClack を記録します。

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

## 返信モード

- `replyMode: "agent"`（デフォルト）は、セッション記録とツールポリシーを含む通常のエージェントパイプラインを通じて受信メッセージをディスパッチします。
- `replyMode: "model"` はエージェントパイプラインをスキップし、Plugin ランタイムの `llm.complete` を使用して短い直接ボット返信を行います（任意で `model` と `systemPrompt` によって調整されます）。

モデルモードは、解決されたボットエージェント ID に対して補完を実行します。そのため、明示的な `plugins.entries.clickclack.llm.allowAgentIdOverride: true` 信頼ビットが必要です。

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

デフォルトの `agent` 返信モードだけを使用する場合は、信頼ビットをオフのままにしてください。その場合は不要です。

## エージェントアクティビティ行

デフォルトでは、ClickClack チャンネルはエージェントターンの実行中に何も表示せず、最終返信だけが投稿されます。アカウントで `agentActivity: true` を設定すると、ターンの進行中に永続的な `agent_commentary` と `agent_tool` メッセージ行を公開します。

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

要件と動作:

- **デフォルトではオフ。** 標準設定と古い ClickClack サーバーには影響しません。
- **`agent_activity:write` トークンスコープが必要です。** このスコープは `bot:write` とは別で、それに継承されません。このオプションを有効にする前に、`--scopes bot:write,agent_activity:write` でボットトークンを作成するか、既存トークンにスコープを付与してください。
- **ベストエフォートの縮退。** トークンに `agent_activity:write` がない場合やサーバーがアクティビティ書き込みを拒否した場合、失敗はログに記録され、最終返信は通常どおり配信されます。アクティビティ行は表示されません。
- 行はターンごとにグループ化され（`turn_id`）、1 つの論理ステップが 1 行になるように統合されます。ツール行は Discord/Slack/Telegram と同じ進行状況フォーマット（ツール名とコマンド詳細）を使用します。
- **帰属メタデータ。** エージェントが作成した投稿（アクティビティ行と最終返信）には、そのターンで実際に使用されたモデル（フォールバック後を含む）から解決された `author_model` と `author_thinking` フィールドが含まれます。これらの列を定義していないサーバーは不明な JSON フィールドを無視します。それらを永続化するサーバーは、メッセージごとに「この行をどのモデルが、どの思考レベルで述べたか」に答えられます。

## ターゲット

- `channel:<name-or-id>` はワークスペースチャンネルに送信します。裸のターゲットはデフォルトで `channel:` になります。
- `dm:<user_id>` はそのユーザーとのダイレクト会話を作成または再利用します。
- `thread:<message_id>` はそのメッセージをルートとするスレッドに返信します。

明示的なアウトバウンドターゲットには、`clickclack:` または `cc:` プロバイダープレフィックスを付けることもできます。

例:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 権限

ClickClack トークンスコープは ClickClack API によって強制されます。

- `bot:read`: ワークスペース、チャンネル、メッセージ、スレッド、DM、リアルタイム、プロフィールデータを読み取ります。
- `bot:write`: `bot:read` に加えて、チャンネルメッセージ、スレッド返信、DM、アップロードを行います。
- `bot:admin`: `bot:write` に加えて、チャンネル作成を行います。
- `agent_activity:write`: 永続的なエージェントアクティビティ行（`agent_commentary` / `agent_tool`）。`bot:write` または `bot:admin` には継承されません。`agentActivity: true` が設定されている場合にのみ必要です。

OpenClaw は通常のエージェントチャットには `bot:write` のみを必要とします。[エージェントアクティビティ行](#agent-activity-rows)を有効にする場合は `agent_activity:write` を追加してください。

## トラブルシューティング

- `ClickClack is not configured for account "<id>"`: そのアカウントに `baseUrl`、`token`（たとえば `CLICKCLACK_BOT_TOKEN` 経由）、`workspace` を設定してください。
- `ClickClack workspace not found: <value>`: `workspace` を ClickClack から返されたワークスペース ID、スラッグ、または名前に設定してください。
- 受信返信がない: トークンにリアルタイム読み取りアクセス権があることを確認し、ボットは自分自身のメッセージと他のボットからのメッセージを無視する点に注意してください。
- チャンネル送信が失敗する: ボットがワークスペースのメンバーであり、`bot:write` を持っていることを確認してください。
