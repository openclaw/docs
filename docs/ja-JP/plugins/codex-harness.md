---
read_when:
    - 同梱の Codex app-server ハーネスを使用したい
    - Codex ハーネスの設定例が必要です
    - Codex 専用のデプロイを、Pi にフォールバックさせるのではなく失敗させたい
summary: 同梱の Codex app-server ハーネスを通じて OpenClaw の埋め込みエージェントターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-05-12T00:59:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 273572d7b7f3b6c57ddd0de38ce467463e9f1f0eab66dc7e2c38fa7679cb0359
    source_path: plugins/codex-harness.md
    workflow: 16
---

バンドルされた `codex` plugin により、OpenClaw は組み込みの PI ハーネスではなく
Codex app-server 経由で埋め込みの OpenAI エージェントターンを実行できます。

低レベルのエージェントセッションを Codex に所有させたい場合は、Codex ハーネスを使用します:
ネイティブなスレッド再開、ネイティブなツール継続、ネイティブな Compaction、
および app-server 実行です。OpenClaw は引き続きチャットチャネル、セッションファイル、モデル
選択、OpenClaw 動的ツール、承認、メディア配信、可視の
トランスクリプトミラーを所有します。

通常のセットアップでは、`openai/gpt-5.5` のような正規の OpenAI モデル参照を使用します。
`openai-codex/gpt-*` モデル参照は設定しないでください。OpenAI エージェント認証順序は
`auth.order.openai` の下に置きます。古い `openai-codex:*` プロファイルと
`auth.order.openai-codex` エントリは、既存のインストール向けに引き続きサポートされます。

OpenClaw は、Codex ネイティブコードモードと code-mode-only を有効にして
Codex app-server スレッドを開始します。これにより、遅延可能または検索可能な OpenClaw 動的ツールは、
Codex の上に PI 形式のツール検索ラッパーを追加するのではなく、Codex 自身のコード実行および
ツール検索サーフェス内に保持されます。

より広範なモデル/プロバイダー/ランタイムの分割については、
[エージェントランタイム](/ja-JP/concepts/agent-runtimes)から始めてください。短く言えば:
`openai/gpt-5.5` がモデル参照、`codex` がランタイムであり、Telegram、
Discord、Slack、または別のチャネルが通信サーフェスとして残ります。

## 要件

- バンドルされた `codex` plugin が利用可能な OpenClaw。
- 設定で `plugins.allow` を使用している場合は、`codex` を含めます。
- Codex app-server `0.125.0` 以降。バンドルされた plugin は、デフォルトで互換性のある
  Codex app-server バイナリを管理するため、`PATH` 上のローカル `codex` コマンドは
  通常のハーネス起動に影響しません。
- `openclaw models auth login --provider openai-codex` 経由、
  エージェントの Codex ホーム内の app-server アカウント、または明示的な Codex API キー
  認証プロファイルを通じて Codex 認証が利用可能であること。

認証の優先順位、環境分離、カスタム app-server コマンド、モデル
検出、およびすべての設定フィールドについては、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## クイックスタート

OpenClaw で Codex を使いたいほとんどのユーザーには、この手順が適しています:
ChatGPT/Codex サブスクリプションでサインインし、バンドルされた `codex` plugin を有効にして、
正規の `openai/gpt-*` モデル参照を使用します。

Codex OAuth でサインインします:

```bash
openclaw models auth login --provider openai-codex
```

バンドルされた `codex` plugin を有効にし、OpenAI エージェントモデルを選択します:

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

設定で `plugins.allow` を使用している場合は、そこにも `codex` を追加します:

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

plugin 設定を変更した後は Gateway を再起動してください。既存のチャットにすでに
セッションがある場合は、ランタイム変更をテストする前に `/new` または `/reset` を使用し、
次のターンが現在の設定からハーネスを解決するようにしてください。

## 設定

クイックスタート設定は、Codex ハーネス設定として最小限有効な設定です。Codex
ハーネスオプションは OpenClaw 設定で指定し、CLI は Codex 認証のみに使用します:

| 必要なこと                             | 設定                                                                             | 場所                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| ハーネスを有効にする                   | `plugins.entries.codex.enabled: true`                                            | OpenClaw 設定                      |
| 許可リスト付き plugin インストールを維持する | `plugins.allow` に `codex` を含める                                             | OpenClaw 設定                      |
| OpenAI エージェントターンを Codex 経由でルーティングする | `agents.defaults.model` または `agents.list[].model` を `openai/gpt-*` にする | OpenClaw エージェント設定          |
| Codex OAuth でサインインする           | `openclaw models auth login --provider openai-codex`                             | CLI 認証プロファイル               |
| Codex 実行用の API キーバックアップを追加する | `auth.order.openai` でサブスクリプション認証の後に `openai:*` API キープロファイルを列挙 | CLI 認証プロファイル + OpenClaw 設定 |
| Codex が利用できない場合に閉じて失敗する | プロバイダーまたはモデルの `agentRuntime.id: "codex"`                           | OpenClaw モデル/プロバイダー設定   |
| 直接の OpenAI API トラフィックを使用する | 通常の OpenAI 認証とともにプロバイダーまたはモデルの `agentRuntime.id: "pi"`     | OpenClaw モデル/プロバイダー設定   |
| app-server の動作を調整する            | `plugins.entries.codex.config.appServer.*`                                       | Codex plugin 設定                  |
| ネイティブ Codex plugin アプリを有効にする | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex plugin 設定                  |
| Codex Computer Use を有効にする        | `plugins.entries.codex.config.computerUse.*`                                     | Codex plugin 設定                  |

Codex バックの OpenAI エージェントターンには `openai/gpt-*` モデル参照を使用します。
サブスクリプション優先/API キーバックアップの順序付けには
`auth.order.openai` を推奨します。既存の `openai-codex:*` 認証プロファイルと
`auth.order.openai-codex` は引き続き有効ですが、新しい `openai-codex/gpt-*`
モデル参照は書かないでください。

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

この形では、どちらのプロファイルも `openai/gpt-*` エージェントターンでは引き続き
Codex 経由で実行されます。API キーは認証のフォールバックにすぎず、PI または
通常の OpenAI Responses へ切り替える要求ではありません。

このページの残りでは、ユーザーが選択する必要のある一般的なバリエーションを扱います:
デプロイ形態、閉じて失敗するルーティング、ガーディアン承認ポリシー、ネイティブ Codex
plugins、および Computer Use です。完全なオプション一覧、デフォルト、列挙値、検出、
環境分離、タイムアウト、app-server トランスポートフィールドについては、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## Codex ランタイムを検証する

Codex を期待するチャットで `/status` を使用します。Codex バックの OpenAI エージェント
ターンでは次のように表示されます:

```text
Runtime: OpenAI Codex
```

次に Codex app-server の状態を確認します:

```text
/codex status
/codex models
```

`/codex status` は app-server 接続、アカウント、レート制限、MCP
サーバー、および skills を報告します。`/codex models` は、そのハーネスとアカウント向けの
ライブ Codex app-server カタログを一覧表示します。`/status` が予想外の場合は、
[トラブルシューティング](#troubleshooting)を参照してください。

## ルーティングとモデル選択

プロバイダー参照とランタイムポリシーは分けて扱います:

- Codex 経由の OpenAI エージェントターンには `openai/gpt-*` を使用します。
- 設定で `openai-codex/gpt-*` を使用しないでください。レガシー参照と古いセッションルートピンを
  修復するには `openclaw doctor --fix` を実行します。
- `agentRuntime.id: "codex"` は通常の OpenAI 自動モードでは任意ですが、
  Codex が利用できない場合にデプロイを閉じて失敗させたいときに有用です。
- `agentRuntime.id: "pi"` は、それが意図した動作である場合に、プロバイダーまたはモデルを
  直接 PI 動作にオプトインします。
- `/codex ...` は、チャットからネイティブ Codex app-server 会話を制御します。
- ACP/acpx は別の外部ハーネス経路です。ユーザーが ACP/acpx または外部ハーネスアダプターを
  求めた場合にのみ使用します。

一般的なコマンドルーティング:

| ユーザーの意図                  | 使用するもの                              |
| ------------------------------- | ----------------------------------------- |
| 現在のチャットをアタッチする    | `/codex bind [--cwd <path>]`              |
| 既存の Codex スレッドを再開する | `/codex resume <thread-id>`               |
| Codex スレッドを一覧表示または絞り込む | `/codex threads [filter]`                 |
| Codex フィードバックのみを送信する | `/codex diagnostics [note]`               |
| ACP/acpx タスクを開始する       | `/codex` ではなく ACP/acpx セッションコマンド |

| ユースケース                                           | 設定                                                             | 検証                                    | 注記                               |
| ------------------------------------------------------ | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| ネイティブ Codex ランタイムを使う ChatGPT/Codex サブスクリプション | `openai/gpt-*` と有効化済み `codex` plugin                       | `/status` が `Runtime: OpenAI Codex` を表示 | 推奨パス                           |
| Codex が利用できない場合に閉じて失敗する               | プロバイダーまたはモデルの `agentRuntime.id: "codex"`            | PI フォールバックではなくターンが失敗する | Codex 専用デプロイで使用           |
| PI 経由の直接 OpenAI API キートラフィック              | プロバイダーまたはモデルの `agentRuntime.id: "pi"` と通常の OpenAI 認証 | `/status` が PI ランタイムを表示        | PI が意図されている場合のみ使用    |
| レガシー設定                                           | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` が書き換える    | この方法で新しい設定を書かない     |
| ACP/acpx Codex アダプター                              | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP タスク/セッション状態               | ネイティブ Codex ハーネスとは別    |

`agents.defaults.imageModel` も同じプレフィックス分割に従います。通常の OpenAI ルートには
`openai/gpt-*` を使用し、画像理解を制限付きの Codex app-server ターン経由で実行する必要がある場合にのみ
`codex/gpt-*` を使用します。`openai-codex/gpt-*` は使用しないでください。doctor はそのレガシー
プレフィックスを `openai/gpt-*` に書き換えます。

## デプロイパターン

### 基本的な Codex デプロイ

すべての OpenAI エージェントターンでデフォルトで Codex を使用する場合は、クイックスタート設定を使用します。

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

### 混合プロバイダーデプロイ

この形では Claude をデフォルトエージェントとして保持し、名前付き Codex エージェントを追加します:

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

この設定では、`main` エージェントは通常のプロバイダー経路を使用し、
`codex` エージェントは Codex app-server を使用します。

### 閉じて失敗する Codex デプロイ

OpenAI エージェントターンでは、バンドルされた plugin が利用可能な場合、
`openai/gpt-*` はすでに Codex に解決されます。明文化された
閉じて失敗するルールが必要な場合は、明示的なランタイムポリシーを追加します:

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

Codex が強制されている場合、Codex plugin が無効、app-server が古すぎる、
または app-server を開始できないと、OpenClaw は早期に失敗します。

## app-server ポリシー

デフォルトでは、plugin は OpenClaw が管理する Codex バイナリを stdio
トランスポートでローカル起動します。意図的に別の実行可能ファイルを実行したい場合にのみ
`appServer.command` を設定してください。app-server が別の場所ですでに実行中の場合にのみ
WebSocket トランスポートを使用します:

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

ローカル stdio app-server セッションのデフォルトは、信頼されたローカルオペレーターの姿勢です。
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"`。ローカル Codex 要件がその暗黙的な YOLO 姿勢を許可しない場合、
OpenClaw は代わりに許可された guardian 権限を選択します。
セッションで OpenClaw サンドボックスが有効な場合、OpenClaw は Codex の
`danger-full-access` を Codex の `workspace-write` に狭め、ネイティブ Codex コードモードのターンが
サンドボックス化されたワークスペース内に留まるようにします。

サンドボックスの脱出や追加権限の前に Codex ネイティブの自動レビューを使いたい場合は、guardian モードを使用します。

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

guardian モードは Codex app-server 承認に展開されます。通常、ローカル要件がそれらの値を許可する場合は
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、および
`sandbox: "workspace-write"` です。

すべての app-server フィールド、認証順序、環境分離、検出、および
タイムアウト動作については、[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## コマンドと診断

同梱Pluginは、OpenClaw テキストコマンドをサポートする任意のチャンネルで
`/codex` をスラッシュコマンドとして登録します。

一般的な形式:

- `/codex status` は app-server 接続、モデル、アカウント、レート制限、
  MCP サーバー、および Skills を確認します。
- `/codex models` はライブ Codex app-server モデルを一覧表示します。
- `/codex threads [filter]` は最近の Codex app-server スレッドを一覧表示します。
- `/codex resume <thread-id>` は現在の OpenClaw セッションを
  既存の Codex スレッドにアタッチします。
- `/codex compact` は Codex app-server に、アタッチされたスレッドの Compaction を依頼します。
- `/codex review` はアタッチされたスレッドに対して Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` は、アタッチされたスレッドの
  Codex フィードバックを送信する前に確認します。
- `/codex account` はアカウントとレート制限の状態を表示します。
- `/codex mcp` は Codex app-server MCP サーバー状態を一覧表示します。
- `/codex skills` は Codex app-server Skills を一覧表示します。

ほとんどのサポートレポートでは、バグが発生した会話で
`/diagnostics [note]` から開始してください。これは 1 つの Gateway 診断レポートを作成し、Codex
ハーネスセッションでは、関連する Codex フィードバックバンドルを送信する承認を求めます。
プライバシーモデルとグループチャットの動作については、[診断エクスポート](/ja-JP/gateway/diagnostics)を参照してください。

完全な Gateway 診断バンドルなしで、現在アタッチされているスレッドの
Codex フィードバックアップロードだけを特に行いたい場合にのみ、`/codex diagnostics [note]` を使用してください。

### Codex スレッドをローカルで調査する

不良な Codex 実行を調査する最速の方法は、多くの場合、ネイティブ Codex
スレッドを直接開くことです。

```bash
codex resume <thread-id>
```

完了した `/diagnostics` の返信、`/codex binding`、または
`/codex threads [filter]` からスレッド ID を取得します。

アップロードの仕組みとランタイムレベルの診断境界については、
[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#codex-feedback-upload)を参照してください。

認証は次の順序で選択されます。

1. エージェントの順序付き OpenAI 認証プロファイル。できれば
   `auth.order.openai` 配下を使用します。既存の `openai-codex:*` プロファイル ID は引き続き有効です。
2. そのエージェントの Codex ホームにある app-server の既存アカウント。
3. ローカル stdio app-server 起動の場合のみ、app-server アカウントが存在せず OpenAI 認証が
   まだ必要な場合に、`CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出すると、生成される Codex 子プロセスから
`CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、Gateway レベルの API キーを embeddings や直接の OpenAI モデルで利用できるままにしながら、
ネイティブ Codex app-server ターンが誤って API 経由で課金されるのを防ぎます。
明示的な Codex API キープロファイルとローカル stdio 環境キーのフォールバックは、継承された子プロセス環境ではなく app-server
ログインを使用します。WebSocket app-server 接続は Gateway 環境 API キーのフォールバックを受け取りません。明示的な認証プロファイル、または
リモート app-server 自身のアカウントを使用してください。

サブスクリプションプロファイルが Codex 使用制限に達した場合、Codex がリセット時刻を報告していれば OpenClaw はそれを記録し、
同じ Codex 実行に対して次の順序付き認証プロファイルを試します。リセット時刻が過ぎると、
選択された `openai/gpt-*` モデルや Codex ランタイムを変更せずに、サブスクリプションプロファイルは再び利用可能になります。

デプロイで追加の環境分離が必要な場合は、それらの変数を
`appServer.clearEnv` に追加します。

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

Codex 動的ツールのデフォルトは `searchable` 読み込みです。OpenClaw は、
Codex ネイティブのワークスペース操作と重複する動的ツールを公開しません: `read`、`write`、
`edit`、`apply_patch`、`exec`、`process`、および `update_plan`。メッセージング、セッション、メディア、cron、ブラウザー、ノード、
gateway、`heartbeat_respond`、`web_search` などの残りの OpenClaw
統合ツールは、`openclaw` 名前空間の下で Codex ツール検索を通じて利用でき、
初期モデルコンテキストを小さく保ちます。
`sessions_yield` とメッセージツール専用ソース返信は、ターン制御契約であるため直接のままです。Heartbeat コラボレーション指示は、
ツールがまだ読み込まれていない場合に、Heartbeat ターンを終了する前に `heartbeat_respond` を検索するよう Codex に伝えます。

遅延された動的ツールを検索できないカスタム Codex
app-server に接続する場合、または完全なツールペイロードをデバッグする場合にのみ、
`codexDynamicToolsLoading: "direct"` を設定してください。

サポートされているトップレベル Codex Plugin フィールド:

| フィールド                 | デフォルト     | 意味                                                                                       |
| -------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw 動的ツールを初期 Codex ツールコンテキストに直接入れるには `"direct"` を使用します。 |
| `codexDynamicToolsExclude` | `[]`           | Codex app-server ターンから省略する追加の OpenClaw 動的ツール名。                           |
| `codexPlugins`             | 無効           | 移行されたソースインストール済み curated plugins のネイティブ Codex plugin/app サポート。    |

サポートされている `appServer` フィールド:

| フィールド                    | デフォルト                                             | 意味                                                                                                                                                                                                                                      |
| ----------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` は Codex を生成し、`"websocket"` は `url` に接続します。                                                                                                                                                                         |
| `command`                     | 管理対象 Codex バイナリ                                | stdio transport の実行ファイル。管理対象バイナリを使用する場合は未設定のままにし、明示的なオーバーライドの場合にのみ設定します。                                                                                                          |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | stdio transport の引数。                                                                                                                                                                                                                  |
| `url`                         | 未設定                                                 | WebSocket app-server URL。                                                                                                                                                                                                                |
| `authToken`                   | 未設定                                                 | WebSocket transport の Bearer トークン。                                                                                                                                                                                                  |
| `headers`                     | `{}`                                                   | 追加の WebSocket ヘッダー。                                                                                                                                                                                                               |
| `clearEnv`                    | `[]`                                                   | OpenClaw が継承環境を構築した後、生成される stdio app-server プロセスから削除される追加の環境変数名。`CODEX_HOME` と `HOME` は、ローカル起動時の OpenClaw のエージェントごとの Codex 分離用に予約されています。                        |
| `requestTimeoutMs`            | `60000`                                                | app-server control-plane 呼び出しのタイムアウト。                                                                                                                                                                                        |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | OpenClaw が `turn/completed` を待っている間の、ターンスコープの Codex app-server リクエスト後の静かなウィンドウ。ツール後または状態のみの合成フェーズが遅い場合は、これを増やします。                                                     |
| `mode`                        | ローカル Codex 要件が YOLO を許可しない場合を除き `"yolo"` | YOLO または guardian レビュー付き実行のプリセット。`danger-full-access`、`never` 承認、または `user` レビュアーを省略するローカル stdio 要件では、暗黙のデフォルトが guardian になります。                                                 |
| `approvalPolicy`              | `"never"` または許可された guardian 承認ポリシー       | スレッド開始/再開/ターンに送信されるネイティブ Codex 承認ポリシー。guardian のデフォルトは、許可されている場合 `"on-request"` を優先します。                                                                                               |
| `sandbox`                     | `"danger-full-access"` または許可された guardian サンドボックス | スレッド開始/再開に送信されるネイティブ Codex サンドボックスモード。guardian のデフォルトは、許可されている場合 `"workspace-write"` を優先し、それ以外の場合は `"read-only"` です。OpenClaw サンドボックスが有効な場合、`danger-full-access` は `"workspace-write"` に狭められます。 |
| `approvalsReviewer`           | `"user"` または許可された guardian レビュアー          | 許可されている場合、Codex にネイティブ承認プロンプトをレビューさせるには `"auto_review"` を使用し、それ以外の場合は `guardian_subagent` または `user` を使用します。`guardian_subagent` はレガシーエイリアスのままです。                |
| `serviceTier`                 | 未設定                                                 | 任意の Codex app-server サービスティア。`"priority"` は fast-mode ルーティングを有効にし、`"flex"` は flex 処理を要求し、`null` はオーバーライドをクリアし、レガシーの `"fast"` は `"priority"` として受け入れられます。                 |

OpenClaw が所有する動的ツール呼び出しは、`appServer.requestTimeoutMs` とは独立して制限されます。Codex の `item/tool/call` リクエストは、デフォルトで 30 秒の OpenClaw ウォッチドッグを使用します。正の per-call `timeoutMs` 引数は、その特定ツールの予算を延長または短縮します。`image_generate` ツールは、ツール呼び出しが独自のタイムアウトを提供しない場合に `agents.defaults.imageGenerationModel.timeoutMs` も使用し、メディア理解の `image` ツールは `tools.media.image.timeoutSeconds` または 60 秒のメディアデフォルトを使用します。動的ツールの予算は 600000 ms に上限設定されます。タイムアウト時、OpenClaw はサポートされている場合にツールシグナルを中止し、失敗した動的ツール応答を Codex に返すため、セッションを `processing` のまま残さずにターンを継続できます。

OpenClaw が Codex のターンスコープ app-server リクエストに応答した後、ハーネスは Codex が `turn/completed` でネイティブターンを完了することも期待します。その応答後に app-server が `appServer.turnCompletionIdleTimeoutMs` の間沈黙した場合、OpenClaw はベストエフォートで Codex ターンに割り込み、診断タイムアウトを記録し、OpenClaw セッションレーンを解放して、後続のチャットメッセージが古いネイティブターンの後ろにキューされないようにします。同じターンの非終端通知（`rawResponseItem/completed` を含む）があると、Codex がターンがまだ生きていることを証明したため、この短いウォッチドッグは解除されます。より長い終端ウォッチドッグは、本当に停止したターンを引き続き保護します。タイムアウト診断には、最後の app-server 通知メソッドと、生のアシスタント応答アイテムの場合はアイテムタイプ、ロール、id、制限されたアシスタントテキストプレビューが含まれます。

ローカルテスト用の環境オーバーライドは引き続き利用できます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` は、`appServer.command` が未設定の場合に管理対象バイナリを迂回します。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに `plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、単発のローカルテストでは `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。再現可能なデプロイでは設定が推奨されます。これは、Codex ハーネス設定の残りと同じレビュー済みファイルに Plugin の挙動を保持できるためです。

## ネイティブ Codex Plugin

ネイティブ Codex Plugin サポートは、OpenClaw ハーネスターンと同じ Codex スレッド内で、Codex app-server 独自のアプリと Plugin 機能を使用します。OpenClaw は Codex Plugin を合成 `codex_plugin_*` OpenClaw 動的ツールに変換しません。

`codexPlugins` はネイティブ Codex ハーネスを選択するセッションにのみ影響します。PI 実行、通常の OpenAI プロバイダー実行、ACP 会話バインディング、その他のハーネスには影響しません。

移行済みの最小設定:

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

スレッドアプリ設定は、OpenClaw が Codex ハーネスセッションを確立するか、古い Codex スレッドバインディングを置き換えるときに計算されます。各ターンで再計算されることはありません。`codexPlugins` を変更した後は、`/new`、`/reset` を使用するか、Gateway を再起動して、今後の Codex ハーネスセッションが更新されたアプリセットで開始されるようにしてください。

移行対象条件、アプリインベントリ、破壊的アクションポリシー、エリシテーション、ネイティブ Plugin 診断については、[ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins) を参照してください。

## Computer Use

Computer Use は専用のセットアップガイドで扱います:
[Codex Computer Use](/ja-JP/plugins/codex-computer-use)。

要約すると、OpenClaw はデスクトップ制御アプリをベンダー提供せず、デスクトップアクションを自身で実行しません。OpenClaw は Codex app-server を準備し、`computer-use` MCP サーバーが利用可能であることを検証したうえで、Codex モードのターン中に Codex がネイティブ MCP ツール呼び出しを所有するようにします。

## ランタイム境界

Codex ハーネスは低レベルの組み込みエージェント実行器のみを変更します。

- OpenClaw 動的ツールはサポートされています。Codex は OpenClaw にそれらのツールの実行を依頼するため、OpenClaw は実行経路に残ります。
- Codex ネイティブのシェル、パッチ、MCP、ネイティブアプリツールは Codex が所有します。OpenClaw はサポートされているリレーを通じて選択されたネイティブイベントを観測またはブロックできますが、ネイティブツール引数を書き換えることはありません。
- Codex はネイティブ Compaction を所有します。OpenClaw はチャネル履歴、検索、`/new`、`/reset`、将来のモデルまたはハーネス切り替えのためにトランスクリプトミラーを保持します。
- メディア生成、メディア理解、TTS、承認、メッセージングツール出力は、対応する OpenClaw プロバイダー/モデル設定を通じて継続します。
- `tool_result_persist` は OpenClaw が所有するトランスクリプトツール結果に適用され、Codex ネイティブのツール結果レコードには適用されません。

フックレイヤー、サポートされる V1 サーフェス、ネイティブ権限処理、キュー誘導、Codex フィードバックアップロード機構、Compaction の詳細については、[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime) を参照してください。

## トラブルシューティング

**Codex が通常の `/model` プロバイダーとして表示されない:** 新しい設定では想定どおりです。`openai/gpt-*` モデルを選択し、`plugins.entries.codex.enabled` を有効化し、`plugins.allow` が `codex` を除外していないか確認してください。

**OpenClaw が Codex ではなく PI を使用する:** モデル参照が公式 OpenAI プロバイダー上の `openai/gpt-*` であり、Codex Plugin がインストールされ有効化されていることを確認してください。テスト中に厳密な証明が必要な場合は、プロバイダーまたはモデルの `agentRuntime.id: "codex"` を設定してください。強制された Codex ランタイムは、PI にフォールバックせず失敗します。

**レガシー `openai-codex/*` 設定が残っている:** `openclaw doctor --fix` を実行してください。Doctor はレガシーモデル参照を `openai/*` に書き換え、古いセッションとエージェント全体のランタイムピンを削除し、既存の認証プロファイルオーバーライドを保持します。

**app-server が拒否される:** Codex app-server `0.125.0` 以降を使用してください。同一バージョンのプレリリースや、`0.125.0-alpha.2` または `0.125.0+custom` のようなビルドサフィックス付きバージョンは拒否されます。OpenClaw は安定版 `0.125.0` のプロトコル下限をテストするためです。

**`/codex status` が接続できない:** バンドルされた `codex` Plugin が有効であること、許可リストが設定されている場合は `plugins.allow` にそれが含まれること、カスタム `appServer.command`、`url`、`authToken`、またはヘッダーが有効であることを確認してください。

**モデル検出が遅い:** `plugins.entries.codex.config.discovery.timeoutMs` を下げるか、検出を無効化してください。[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference#model-discovery) を参照してください。

**WebSocket トランスポートが即座に失敗する:** `appServer.url`、`authToken`、ヘッダー、およびリモート app-server が同じ Codex app-server プロトコルバージョンを話していることを確認してください。

**非 Codex モデルが PI を使用する:** プロバイダーまたはモデルのランタイムポリシーが別のハーネスにルーティングしない限り、想定どおりです。通常の非 OpenAI プロバイダー参照は、`auto` モードでは通常のプロバイダー経路のままです。

**Computer Use はインストールされているがツールが実行されない:** 新しいセッションから `/codex computer-use status` を確認してください。ツールが `Native hook relay unavailable` を報告する場合は、`/new` または `/reset` を使用してください。継続する場合は、Gateway を再起動して古いネイティブフック登録をクリアしてください。[Codex Computer Use](/ja-JP/plugins/codex-computer-use#troubleshooting) を参照してください。

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
