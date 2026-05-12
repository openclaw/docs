---
read_when:
    - バンドルされた Codex app-server ハーネスを使用したい場合
    - Codex ハーネスの設定例が必要です
    - Codex のみのデプロイを Pi にフォールバックせず失敗させたい場合
summary: 同梱の Codex アプリサーバーハーネスを通じて OpenClaw の埋め込みエージェントターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-05-12T08:45:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62023998d817a557bd6434e3ab47f3b99b97fdea93a8984b78b7bd1738a61f92
    source_path: plugins/codex-harness.md
    workflow: 16
---

同梱の `codex` Plugin により、OpenClaw は組み込みの PI ハーネスではなく Codex app-server 経由で埋め込み OpenAI agent ターンを実行できます。

低レベルの agent セッションを Codex に担わせたい場合は、Codex ハーネスを使用します。対象は、ネイティブなスレッド再開、ネイティブなツール継続、ネイティブな Compaction、app-server 実行です。OpenClaw は引き続き、チャットチャネル、セッションファイル、モデル選択、OpenClaw 動的ツール、承認、メディア配信、表示される transcript ミラーを担います。

通常のセットアップでは、`openai/gpt-5.5` のような正規の OpenAI モデル ref を使用します。`openai-codex/gpt-*` モデル ref は設定しないでください。OpenAI agent 認証順序は `auth.order.openai` の下に置きます。古い `openai-codex:*` プロファイルと `auth.order.openai-codex` エントリは、既存インストール向けに引き続きサポートされます。

OpenClaw は Codex app-server スレッドを、Codex ネイティブコードモードおよびコードモード専用を有効にして開始します。これにより、遅延/検索可能な OpenClaw 動的ツールは、Codex の上に PI 形式のツール検索ラッパーを追加するのではなく、Codex 自身のコード実行とツール検索サーフェス内に保持されます。

より広いモデル/プロバイダー/ランタイムの分離については、[Agent ランタイム](/ja-JP/concepts/agent-runtimes)から始めてください。短く言えば、`openai/gpt-5.5` がモデル ref、`codex` がランタイムであり、Telegram、Discord、Slack、または別のチャネルが通信サーフェスのままです。

## 要件

- 同梱の `codex` Plugin が利用可能な OpenClaw。
- config で `plugins.allow` を使用している場合は、`codex` を含めます。
- Codex app-server `0.125.0` 以降。同梱 Plugin はデフォルトで互換性のある Codex app-server バイナリを管理するため、`PATH` 上のローカル `codex` コマンドは通常のハーネス起動に影響しません。
- `openclaw models auth login --provider openai-codex`、agent の Codex ホーム内の app-server アカウント、または明示的な Codex API キー認証プロファイルを通じて Codex 認証が利用可能であること。

認証の優先順位、環境分離、カスタム app-server コマンド、モデル検出、すべての config フィールドについては、[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## クイックスタート

OpenClaw で Codex を使いたいほとんどのユーザーには、この経路が適しています。ChatGPT/Codex サブスクリプションでサインインし、同梱の `codex` Plugin を有効にして、正規の `openai/gpt-*` モデル ref を使用します。

Codex OAuth でサインインします。

```bash
openclaw models auth login --provider openai-codex
```

同梱の `codex` Plugin を有効にし、OpenAI agent モデルを選択します。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

config で `plugins.allow` を使用している場合は、そこにも `codex` を追加します。

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Plugin config を変更した後は Gateway を再起動してください。既存チャットにすでにセッションがある場合は、ランタイム変更をテストする前に `/new` または `/reset` を使用し、次のターンが現在の config からハーネスを解決するようにします。

## 設定

クイックスタート config は、最小限で動作する Codex ハーネス config です。Codex ハーネスのオプションは OpenClaw config に設定し、CLI は Codex 認証のみに使用します。

| 必要なこと                             | 設定                                                                             | 場所                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| ハーネスを有効化                       | `plugins.entries.codex.enabled: true`                                            | OpenClaw config                    |
| allowlist された Plugin インストールを維持 | `plugins.allow` に `codex` を含める                                               | OpenClaw config                    |
| OpenAI agent ターンを Codex 経由にする | `agents.defaults.model` または `agents.list[].model` を `openai/gpt-*` にする      | OpenClaw agent config              |
| Codex OAuth でサインイン               | `openclaw models auth login --provider openai-codex`                             | CLI 認証プロファイル               |
| Codex 実行用の API キーバックアップを追加 | `auth.order.openai` でサブスクリプション認証の後に `openai:*` API キープロファイルを列挙 | CLI 認証プロファイル + OpenClaw config |
| Codex が利用不可の場合に fail closed する | プロバイダーまたはモデルの `agentRuntime.id: "codex"`                            | OpenClaw モデル/プロバイダー config |
| 直接の OpenAI API トラフィックを使用   | 通常の OpenAI 認証を使い、プロバイダーまたはモデルの `agentRuntime.id: "pi"`      | OpenClaw モデル/プロバイダー config |
| app-server の動作を調整                | `plugins.entries.codex.config.appServer.*`                                       | Codex Plugin config                |
| ネイティブ Codex Plugin アプリを有効化 | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex Plugin config                |
| Codex Computer Use を有効化            | `plugins.entries.codex.config.computerUse.*`                                     | Codex Plugin config                |

Codex バックの OpenAI agent ターンには `openai/gpt-*` モデル ref を使用します。サブスクリプション優先/API キーバックアップの順序には、`auth.order.openai` を推奨します。既存の `openai-codex:*` 認証プロファイルと `auth.order.openai-codex` は引き続き有効ですが、新しい `openai-codex/gpt-*` モデル ref は書かないでください。

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

この形では、どちらのプロファイルも `openai/gpt-*` agent ターンでは引き続き Codex 経由で実行されます。API キーは認証フォールバックにすぎず、PI や通常の OpenAI Responses へ切り替える要求ではありません。

このページの残りでは、ユーザーが選択する必要がある一般的なバリエーションを扱います。デプロイ形態、fail-closed ルーティング、guardian 承認ポリシー、ネイティブ Codex Plugin、Computer Use です。完全なオプション一覧、デフォルト、enum、検出、環境分離、タイムアウト、app-server トランスポートフィールドについては、[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## Codex ランタイムを検証する

Codex を期待しているチャットで `/status` を使用します。Codex バックの OpenAI agent ターンでは次のように表示されます。

```text
Runtime: OpenAI Codex
```

次に Codex app-server の状態を確認します。

```text
/codex status
/codex models
```

`/codex status` は app-server 接続、アカウント、レート制限、MCP サーバー、skills を報告します。`/codex models` は、ハーネスとアカウントに対するライブの Codex app-server カタログを一覧表示します。`/status` が予想外の場合は、[トラブルシューティング](#troubleshooting)を参照してください。

## ルーティングとモデル選択

プロバイダー ref とランタイムポリシーは分けて扱います。

- Codex 経由の OpenAI agent ターンには `openai/gpt-*` を使用します。
- config で `openai-codex/gpt-*` は使用しないでください。`openclaw doctor --fix` を実行して、レガシー ref と古いセッションルート固定を修復します。
- `agentRuntime.id: "codex"` は通常の OpenAI 自動モードでは任意ですが、Codex が利用不可の場合にデプロイを fail closed させたいときに有用です。
- `agentRuntime.id: "pi"` は、それが意図したものである場合に、プロバイダーまたはモデルを直接 PI 動作にします。
- `/codex ...` はチャットからネイティブ Codex app-server 会話を制御します。
- ACP/acpx は別の外部ハーネス経路です。ユーザーが ACP/acpx または外部ハーネスアダプターを求めた場合にのみ使用します。

一般的なコマンドルーティング:

| ユーザーの意図                  | 使用するもの                            |
| ------------------------------- | --------------------------------------- |
| 現在のチャットをアタッチする    | `/codex bind [--cwd <path>]`            |
| 既存の Codex スレッドを再開する | `/codex resume <thread-id>`             |
| Codex スレッドを一覧/絞り込む   | `/codex threads [filter]`               |
| Codex フィードバックのみ送信    | `/codex diagnostics [note]`             |
| ACP/acpx タスクを開始する       | `/codex` ではなく ACP/acpx セッションコマンド |

| ユースケース                                           | 設定                                                             | 検証                                    | メモ                               |
| ------------------------------------------------------ | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| ネイティブ Codex ランタイム付き ChatGPT/Codex サブスクリプション | `openai/gpt-*` と有効化済みの `codex` Plugin                    | `/status` が `Runtime: OpenAI Codex` を表示 | 推奨経路                           |
| Codex が利用不可の場合に fail closed する              | プロバイダーまたはモデルの `agentRuntime.id: "codex"`            | PI フォールバックではなくターンが失敗する | Codex 専用デプロイで使用           |
| PI 経由の直接 OpenAI API キートラフィック              | プロバイダーまたはモデルの `agentRuntime.id: "pi"` と通常の OpenAI 認証 | `/status` が PI ランタイムを表示         | PI が意図したものである場合のみ使用 |
| レガシー config                                        | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` が書き換える     | この方法で新しい config は書かない |
| ACP/acpx Codex アダプター                              | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP タスク/セッション状態               | ネイティブ Codex ハーネスとは別     |

`agents.defaults.imageModel` も同じ prefix 分離に従います。通常の OpenAI ルートには `openai/gpt-*` を使用し、画像理解を bounded な Codex app-server ターン経由で実行すべき場合にのみ `codex/gpt-*` を使用します。`openai-codex/gpt-*` は使用しないでください。doctor はそのレガシー prefix を `openai/gpt-*` に書き換えます。

## デプロイパターン

### 基本的な Codex デプロイ

すべての OpenAI agent ターンでデフォルトで Codex を使用する場合は、クイックスタート config を使用します。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

### 混在プロバイダーデプロイ

この形では Claude をデフォルト agent として維持し、名前付き Codex agent を追加します。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-6",
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
      },
    ],
  },
}
```

この config では、`main` agent は通常のプロバイダー経路を使用し、`codex` agent は Codex app-server を使用します。

### Fail-closed Codex デプロイ

OpenAI agent ターンでは、同梱 Plugin が利用可能な場合、`openai/gpt-*` はすでに Codex に解決されます。明文化された fail-closed ルールが必要な場合は、明示的なランタイムポリシーを追加します。

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Codex が強制されている場合、Codex Plugin が無効、app-server が古すぎる、または app-server を開始できないと、OpenClaw は早期に失敗します。

## App-server ポリシー

デフォルトでは、Plugin は OpenClaw 管理の Codex バイナリをローカルで stdio トランスポートにより開始します。意図的に別の実行ファイルを実行したい場合にのみ、`appServer.command` を設定してください。app-server がすでに別の場所で実行されている場合にのみ、WebSocket トランスポートを使用します。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

ローカル stdio app-server セッションのデフォルトは、信頼済みローカルオペレーターの姿勢です:
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"`。ローカルの Codex 要件でその暗黙の YOLO 姿勢が許可されない場合、
OpenClaw は代わりに許可済みの guardian 権限を選択します。
セッションで OpenClaw サンドボックスが有効な場合、OpenClaw は Codex
`danger-full-access` を Codex `workspace-write` に狭めるため、ネイティブ Codex code-mode のターンは
サンドボックス化されたワークスペース内に留まります。

サンドボックスの脱出や追加権限の前に Codex ネイティブの自動レビューを使いたい場合は、guardian モードを使用します:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

guardian モードは Codex app-server 承認に展開され、通常はローカル要件でそれらの値が許可されている場合、
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、および
`sandbox: "workspace-write"` になります。

すべての app-server フィールド、認証順序、環境分離、検出、および
タイムアウト動作については、[Codex harness リファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## コマンドと診断

バンドルされた Plugin は、OpenClaw テキストコマンドをサポートする任意のチャンネルで
`/codex` をスラッシュコマンドとして登録します。

一般的な形式:

- `/codex status` は app-server 接続、モデル、アカウント、レート制限、
  MCP サーバー、および Skills を確認します。
- `/codex models` はライブ Codex app-server モデルを一覧表示します。
- `/codex threads [filter]` は最近の Codex app-server スレッドを一覧表示します。
- `/codex resume <thread-id>` は現在の OpenClaw セッションを既存の
  Codex スレッドに接続します。
- `/codex compact` は Codex app-server に接続中のスレッドの compact を要求します。
- `/codex review` は接続中のスレッドに対して Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` は、接続中のスレッドについて Codex フィードバックを送信する前に確認します。
- `/codex account` はアカウントとレート制限の状態を表示します。
- `/codex mcp` は Codex app-server MCP サーバーの状態を一覧表示します。
- `/codex skills` は Codex app-server Skills を一覧表示します。

ほとんどのサポート報告では、バグが発生した会話で `/diagnostics [note]` から始めます。
これは 1 つの Gateway 診断レポートを作成し、Codex harness セッションでは、関連する Codex フィードバックバンドルを送信する承認を求めます。
プライバシーモデルとグループチャットの動作については、[診断エクスポート](/ja-JP/gateway/diagnostics)を参照してください。

現在接続中のスレッドについて、完全な Gateway 診断バンドルなしで Codex
フィードバックのアップロードだけを特に行いたい場合にのみ、`/codex diagnostics [note]` を使用してください。

### Codex スレッドをローカルで調査する

問題のある Codex 実行を調査する最速の方法は、多くの場合、ネイティブ Codex
スレッドを直接開くことです:

```bash
codex resume <thread-id>
```

完了した `/diagnostics` の返信、`/codex binding`、または
`/codex threads [filter]` からスレッド ID を取得します。

アップロードの仕組みとランタイムレベルの診断境界については、
[Codex harness ランタイム](/ja-JP/plugins/codex-harness-runtime#codex-feedback-upload)を参照してください。

認証は次の順序で選択されます:

1. エージェントの順序付き OpenAI 認証プロファイル。できれば
   `auth.order.openai` 配下を使用します。既存の `openai-codex:*` プロファイル ID は引き続き有効です。
2. そのエージェントの Codex ホーム内にある app-server の既存アカウント。
3. ローカル stdio app-server 起動の場合のみ、app-server アカウントが存在せず OpenAI 認証が
   まだ必要なときに、`CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出すると、生成される Codex 子プロセスから
`CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、Gateway レベルの API キーは埋め込みや直接の OpenAI モデルで利用可能なまま、ネイティブ Codex app-server のターンが誤って API 経由で課金されることを防ぎます。
明示的な Codex API キープロファイルとローカル stdio 環境キーのフォールバックは、継承された子プロセス環境ではなく app-server ログインを使用します。WebSocket app-server 接続は Gateway 環境 API キーのフォールバックを受け取りません。明示的な認証プロファイルまたはリモート app-server 自身のアカウントを使用してください。

サブスクリプションプロファイルが Codex 使用量制限に達した場合、Codex がリセット時刻を報告すると OpenClaw はそれを記録し、同じ
Codex 実行について次の順序付き認証プロファイルを試します。リセット時刻を過ぎると、選択された `openai/gpt-*` モデルや Codex ランタイムを変更しなくても、サブスクリプションプロファイルは再び利用可能になります。

デプロイで追加の環境分離が必要な場合は、それらの変数を
`appServer.clearEnv` に追加します:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` は、生成される Codex app-server 子プロセスにのみ影響します。

Codex 動的ツールのデフォルトは `searchable` 読み込みです。OpenClaw は Codex ネイティブのワークスペース操作と重複する動的ツールを公開しません: `read`、`write`、
`edit`、`apply_patch`、`exec`、`process`、および `update_plan`。メッセージング、セッション、メディア、cron、ブラウザー、ノード、
gateway、`heartbeat_respond`、`web_search` などの残りの OpenClaw 統合ツールは、`openclaw` 名前空間の下で Codex ツール検索を通じて利用でき、初期モデルコンテキストを
小さく保ちます。
`sessions_yield` とメッセージツール専用ソース返信は、ターン制御契約であるため直接のままです。Heartbeat コラボレーション手順は、ツールがまだ読み込まれていない場合、heartbeat ターンを終了する前に
`heartbeat_respond` を検索するよう Codex に指示します。

`codexDynamicToolsLoading: "direct"` は、遅延動的ツールを検索できないカスタム Codex
app-server に接続する場合、または完全なツールペイロードをデバッグする場合にのみ設定してください。

サポートされるトップレベル Codex Plugin フィールド:

| フィールド                      | デフォルト        | 意味                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | `"direct"` を使用すると、OpenClaw 動的ツールを初期 Codex ツールコンテキストに直接配置します。 |
| `codexDynamicToolsExclude` | `[]`           | Codex app-server ターンから除外する追加の OpenClaw 動的ツール名。              |
| `codexPlugins`             | 無効       | 移行済みのソースインストール済み curated plugins のネイティブ Codex plugin/app サポート。           |

サポートされる `appServer` フィールド:

| フィールド                         | デフォルト                                                | 意味                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` は Codex を生成します。`"websocket"` は `url` に接続します。                                                                                                                                                                                |
| `command`                     | 管理対象の Codex バイナリ                                   | stdio transport の実行ファイル。管理対象バイナリを使用するには未設定のままにします。明示的なオーバーライドの場合にのみ設定してください。                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | stdio transport の引数。                                                                                                                                                                                                          |
| `url`                         | 未設定                                                  | WebSocket app-server URL。                                                                                                                                                                                                               |
| `authToken`                   | 未設定                                                  | WebSocket transport の Bearer token。                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | 追加の WebSocket ヘッダー。                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | OpenClaw が継承環境を構築した後、生成される stdio app-server プロセスから削除される追加の環境変数名。`CODEX_HOME` と `HOME` は、ローカル起動時の OpenClaw のエージェントごとの Codex 分離用に予約されています。    |
| `requestTimeoutMs`            | `60000`                                                | app-server control-plane 呼び出しのタイムアウト。                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | ターンスコープの Codex app-server リクエスト後、OpenClaw が `turn/completed` を待機する静かな期間。ツール後またはステータスのみの合成フェーズが遅い場合は、この値を引き上げます。                                                                     |
| `mode`                        | ローカル Codex 要件が YOLO を許可しない限り `"yolo"` | YOLO または guardian レビュー付き実行のプリセット。`danger-full-access`、`never` 承認、または `user` reviewer を省略するローカル stdio 要件では、暗黙のデフォルトが guardian になります。                                                   |
| `approvalPolicy`              | `"never"` または許可済みの guardian approval policy       | thread start/resume/turn に送信されるネイティブ Codex 承認ポリシー。guardian のデフォルトは、許可されている場合 `"on-request"` を優先します。                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` または許可済みの guardian sandbox  | thread start/resume に送信されるネイティブ Codex サンドボックスモード。guardian のデフォルトは、許可されている場合 `"workspace-write"`、それ以外は `"read-only"` を優先します。OpenClaw サンドボックスが有効な場合、`danger-full-access` は `"workspace-write"` に狭められます。 |
| `approvalsReviewer`           | `"user"` または許可済みの guardian reviewer               | 許可されている場合、Codex にネイティブ承認プロンプトをレビューさせるには `"auto_review"` を使用します。それ以外は `guardian_subagent` または `user` です。`guardian_subagent` は従来のエイリアスのままです。                                                                      |
| `serviceTier`                 | 未設定                                                  | 任意の Codex app-server サービス層。`"priority"` は fast-mode ルーティングを有効にし、`"flex"` は flex processing を要求し、`null` はオーバーライドをクリアし、従来の `"fast"` は `"priority"` として受け入れられます。                                         |

OpenClaw 所有の動的ツール呼び出しは、
`appServer.requestTimeoutMs` とは独立して制限されます。Codex `item/tool/call` リクエストは、デフォルトで 30 秒の
OpenClaw watchdog を使用します。正の per-call `timeoutMs` 引数は、
その特定ツールの予算を延長または短縮します。`image_generate` ツールは、ツール呼び出しが独自のタイムアウトを提供しない場合、
`agents.defaults.imageGenerationModel.timeoutMs` も使用し、メディア理解の `image` ツールは
`tools.media.image.timeoutSeconds` またはその 60 秒のメディア既定値を使用します。動的ツールの予算は 600000 ms で上限が設定されます。タイムアウト時、OpenClaw はサポートされている場合ツールシグナルを中止し、Codex に失敗した動的ツール応答を返すため、セッションを `processing` のまま残さずにターンを継続できます。

OpenClaw が Codex の turn-scoped app-server リクエストに応答した後、ハーネスは Codex がネイティブターンを `turn/completed` で終了することも期待します。その応答後に app-server が `appServer.turnCompletionIdleTimeoutMs` の間静かになった場合、OpenClaw はベストエフォートで Codex ターンに割り込み、診断タイムアウトを記録し、OpenClaw セッションレーンを解放して、後続のチャットメッセージが古いネイティブターンの後ろにキューされないようにします。同じターンに対する非終端通知は、`rawResponseItem/completed` を含め、この短い watchdog を解除します。Codex がターンがまだ生きていることを証明したためです。より長い終端 watchdog は、本当にスタックしたターンを引き続き保護します。rate-limit 更新などのグローバル app-server 通知は、ターンアイドル進行をリセットしません。Codex が完了済みの `agentMessage` アイテムを発行し、その後 `turn/completed` なしで静かになった場合、OpenClaw はアシスタント出力を実質的に完了と扱い、ベストエフォートでネイティブ Codex ターンに割り込み、セッションレーンを解放します。タイムアウト診断には、最後の app-server 通知メソッド、および raw アシスタント応答アイテムについては、アイテムの種類、ロール、id、制限付きのアシスタントテキストプレビューが含まれます。

ローカルテスト用の環境オーバーライドは引き続き利用できます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` が未設定の場合、`OPENCLAW_CODEX_APP_SERVER_BIN` は管理対象バイナリをバイパスします。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、単発のローカルテストには
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。設定は、Codex ハーネス設定の残りと同じレビュー済みファイル内に Plugin の動作を保持するため、反復可能なデプロイでは推奨されます。

## ネイティブ Codex Plugin

ネイティブ Codex Plugin サポートは、OpenClaw ハーネスターンと同じ Codex スレッド内で、Codex app-server 自身のアプリおよび Plugin 機能を使用します。OpenClaw は Codex Plugin を合成 `codex_plugin_*` OpenClaw 動的ツールに変換しません。

`codexPlugins` はネイティブ Codex ハーネスを選択するセッションにのみ影響します。PI 実行、通常の OpenAI プロバイダー実行、ACP 会話バインディング、その他のハーネスには影響しません。

最小限の移行済み設定:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

スレッドアプリ設定は、OpenClaw が Codex ハーネスセッションを確立するか、古い Codex スレッドバインディングを置き換えるときに計算されます。毎ターン再計算されるわけではありません。
`codexPlugins` を変更した後は、`/new`、`/reset` を使用するか Gateway を再起動して、今後の Codex ハーネスセッションが更新されたアプリセットで開始されるようにしてください。

移行対象条件、アプリインベントリ、破壊的アクションポリシー、elicitations、ネイティブ Plugin 診断については、
[ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins) を参照してください。

## Computer Use

Computer Use は独自のセットアップガイドで扱われています:
[Codex Computer Use](/ja-JP/plugins/codex-computer-use)。

要約すると、OpenClaw はデスクトップ制御アプリを vendoring せず、デスクトップアクション自体も実行しません。Codex app-server を準備し、`computer-use` MCP サーバーが利用可能であることを検証し、その後 Codex-mode ターン中のネイティブ MCP ツール呼び出しは Codex に所有させます。

## ランタイム境界

Codex ハーネスは、低レベルの組み込みエージェント実行器のみを変更します。

- OpenClaw 動的ツールはサポートされています。Codex は OpenClaw にそれらのツールの実行を依頼するため、OpenClaw は実行パスに残ります。
- Codex-native shell、patch、MCP、ネイティブアプリツールは Codex が所有します。OpenClaw はサポートされているリレーを通じて選択されたネイティブイベントを観測またはブロックできますが、ネイティブツール引数を書き換えることはありません。
- Codex はネイティブ Compaction を所有します。OpenClaw はチャネル履歴、検索、`/new`、`/reset`、および将来のモデルまたはハーネス切り替えのためにトランスクリプトミラーを保持します。
- メディア生成、メディア理解、TTS、承認、メッセージングツール出力は、対応する OpenClaw プロバイダー/モデル設定を引き続き通過します。
- `tool_result_persist` は OpenClaw 所有のトランスクリプトツール結果に適用され、Codex-native ツール結果レコードには適用されません。

フックレイヤー、サポートされている V1 サーフェス、ネイティブ権限処理、キュー誘導、Codex フィードバックアップロードの仕組み、Compaction の詳細については、
[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime) を参照してください。

## トラブルシューティング

**Codex が通常の `/model` プロバイダーとして表示されない:** 新しい設定では想定どおりです。`openai/gpt-*` モデルを選択し、`plugins.entries.codex.enabled` を有効にして、`plugins.allow` が `codex` を除外していないか確認してください。

**OpenClaw が Codex の代わりに PI を使用する:** モデル参照が公式 OpenAI プロバイダー上の `openai/gpt-*` であり、Codex Plugin がインストールされ有効化されていることを確認してください。テスト中に厳密な証明が必要な場合は、プロバイダーまたはモデルの `agentRuntime.id: "codex"` を設定してください。強制された Codex ランタイムは、PI にフォールバックせず失敗します。

**レガシー `openai-codex/*` 設定が残っている:** `openclaw doctor --fix` を実行してください。Doctor はレガシーモデル参照を `openai/*` に書き換え、古いセッションおよび whole-agent ランタイムピンを削除し、既存の auth-profile オーバーライドを保持します。

**app-server が拒否される:** Codex app-server `0.125.0` 以降を使用してください。同一バージョンのプレリリースまたは `0.125.0-alpha.2` や `0.125.0+custom` のような build-suffixed バージョンは拒否されます。OpenClaw が安定版 `0.125.0` プロトコル下限をテストするためです。

**`/codex status` が接続できない:** バンドルされた `codex` Plugin が有効であること、allowlist が設定されている場合は `plugins.allow` にそれが含まれていること、カスタムの `appServer.command`、`url`、`authToken`、またはヘッダーが有効であることを確認してください。

**モデル検出が遅い:** `plugins.entries.codex.config.discovery.timeoutMs` を下げるか、検出を無効にしてください。[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference#model-discovery) を参照してください。

**WebSocket トランスポートが即座に失敗する:** `appServer.url`、`authToken`、ヘッダー、およびリモート app-server が同じ Codex app-server プロトコルバージョンを話していることを確認してください。

**非 Codex モデルが PI を使用する:** プロバイダーまたはモデルランタイムポリシーが別のハーネスへルーティングしない限り、これは想定どおりです。通常の非 OpenAI プロバイダー参照は、`auto` モードでは通常のプロバイダーパスに留まります。

**Computer Use はインストールされているがツールが実行されない:** 新しいセッションから `/codex computer-use status` を確認してください。ツールが `Native hook relay unavailable` を報告する場合は、`/new` または `/reset` を使用してください。解消しない場合は Gateway を再起動して、古いネイティブフック登録をクリアしてください。[Codex Computer Use](/ja-JP/plugins/codex-computer-use#troubleshooting) を参照してください。

## 関連

- [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins)
- [Codex Computer Use](/ja-JP/plugins/codex-computer-use)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
- [Plugin フック](/ja-JP/plugins/hooks)
- [診断エクスポート](/ja-JP/gateway/diagnostics)
- [ステータス](/ja-JP/cli/status)
- [テスト](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
