---
read_when:
    - 同梱の Codex app-server ハーネスを使用したい場合
    - Codex ハーネス設定の例が必要です
    - Codex のみのデプロイでは、PI にフォールバックせずに失敗させたい
summary: バンドルされた Codex app-server harness 経由で OpenClaw の埋め込みエージェントターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-05-11T20:34:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37546661dc80d8ce680c379ca2a49919b08ac24a748dc15d1478c1421e81c632
    source_path: plugins/codex-harness.md
    workflow: 16
---

バンドルされた `codex` plugin により、OpenClaw は組み込みの PI ハーネスではなく
Codex app-server を通じて、埋め込み OpenAI エージェントターンを実行できます。

低レベルのエージェントセッションを Codex に所有させたい場合は Codex ハーネスを使用します。
ネイティブなスレッド再開、ネイティブなツール継続、ネイティブな Compaction、
app-server 実行が対象です。OpenClaw は引き続き、チャットチャネル、セッションファイル、モデル選択、
OpenClaw 動的ツール、承認、メディア配信、表示されるトランスクリプトミラーを所有します。

通常のセットアップでは `openai/gpt-5.5` のような正規の OpenAI モデル参照を使用します。
`openai-codex/gpt-*` モデル参照は設定しないでください。OpenAI エージェント認証順序は
`auth.order.openai` の下に置きます。既存インストール向けに、古い `openai-codex:*` プロファイルと
`auth.order.openai-codex` エントリは引き続きサポートされます。

OpenClaw は、Codex ネイティブ code mode と
code-mode-only が有効な状態で Codex app-server スレッドを開始します。これにより、遅延可能/検索可能な OpenClaw 動的ツールは、
Codex の上に PI スタイルのツール検索ラッパーを追加するのではなく、
Codex 自身のコード実行およびツール検索サーフェス内に保持されます。

より広いモデル/プロバイダー/ランタイム分割については、
[エージェントランタイム](/ja-JP/concepts/agent-runtimes)から始めてください。要約すると、
`openai/gpt-5.5` はモデル参照、`codex` はランタイムであり、Telegram、
Discord、Slack、または別のチャネルが通信サーフェスのままです。

## 要件

- バンドルされた `codex` plugin が利用可能な OpenClaw。
- 設定で `plugins.allow` を使用している場合は、`codex` を含めます。
- Codex app-server `0.125.0` 以降。バンドルされた plugin は、デフォルトで互換性のある
  Codex app-server バイナリを管理するため、`PATH` 上のローカル `codex` コマンドは
  通常のハーネス起動に影響しません。
- `openclaw models auth login --provider openai-codex`、
  エージェントの Codex ホーム内の app-server アカウント、または明示的な Codex API キー
  認証プロファイルを通じて Codex 認証が利用可能であること。

認証の優先順位、環境分離、カスタム app-server コマンド、モデル検出、
およびすべての設定フィールドについては、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## クイックスタート

OpenClaw で Codex を使いたいほとんどのユーザーには、この手順が適しています。ChatGPT/Codex サブスクリプションでサインインし、バンドルされた `codex` plugin を有効にし、
正規の `openai/gpt-*` モデル参照を使用します。

Codex OAuth でサインインします。

```bash
openclaw models auth login --provider openai-codex
```

バンドルされた `codex` plugin を有効にし、OpenAI エージェントモデルを選択します。

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

設定で `plugins.allow` を使用している場合は、そこにも `codex` を追加します。

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

plugin 設定を変更したら Gateway を再起動します。既存のチャットにすでにセッションがある場合は、
ランタイム変更をテストする前に `/new` または `/reset` を使用し、次のターンで現在の設定からハーネスが解決されるようにします。

## 設定

クイックスタート設定は、最小限の実用的な Codex ハーネス設定です。Codex
ハーネスのオプションは OpenClaw 設定で設定し、CLI は Codex 認証にのみ使用します。

| 必要なこと                                   | 設定                                                                              | 場所                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| ハーネスを有効にする                     | `plugins.entries.codex.enabled: true`                                            | OpenClaw 設定                    |
| 許可リスト付きの plugin インストールを維持する     | `plugins.allow` に `codex` を含める                                               | OpenClaw 設定                    |
| OpenAI エージェントターンを Codex 経由にルーティングする | `agents.defaults.model` または `agents.list[].model` を `openai/gpt-*` にする               | OpenClaw エージェント設定              |
| Codex OAuth でサインインする               | `openclaw models auth login --provider openai-codex`                             | CLI 認証プロファイル                   |
| Codex 実行用の API キーバックアップを追加する      | サブスクリプション認証の後に `auth.order.openai` で列挙された `openai:*` API キープロファイル | CLI 認証プロファイル + OpenClaw 設定 |
| Codex が利用できない場合にフェイルクローズする  | プロバイダーまたはモデルの `agentRuntime.id: "codex"`                                     | OpenClaw モデル/プロバイダー設定     |
| 直接 OpenAI API トラフィックを使用する          | 通常の OpenAI 認証を使ったプロバイダーまたはモデルの `agentRuntime.id: "pi"`                | OpenClaw モデル/プロバイダー設定     |
| app-server の動作を調整する               | `plugins.entries.codex.config.appServer.*`                                       | Codex plugin 設定                |
| ネイティブ Codex plugin アプリを有効にする        | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex plugin 設定                |
| Codex Computer Use を有効にする              | `plugins.entries.codex.config.computerUse.*`                                     | Codex plugin 設定                |

Codex バックエンドの OpenAI エージェントターンには `openai/gpt-*` モデル参照を使用します。
サブスクリプション優先/API キーバックアップの順序付けには
`auth.order.openai` を推奨します。既存の `openai-codex:*` 認証プロファイルと
`auth.order.openai-codex` は引き続き有効ですが、新しい
`openai-codex/gpt-*` モデル参照は書かないでください。

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

この形では、どちらのプロファイルも `openai/gpt-*` エージェントターンについては引き続き Codex 経由で実行されます。
API キーは認証フォールバックにすぎず、PI や通常の OpenAI Responses へ切り替える要求ではありません。

このページの残りでは、ユーザーが選択する必要がある一般的なバリエーションを扱います。
デプロイ形態、フェイルクローズルーティング、guardian 承認ポリシー、ネイティブ Codex
plugins、Computer Use です。完全なオプション一覧、デフォルト、列挙値、検出、
環境分離、タイムアウト、および app-server トランスポートフィールドについては、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## Codex ランタイムを確認する

Codex を想定しているチャットで `/status` を使用します。Codex バックエンドの OpenAI エージェント
ターンでは次のように表示されます。

```text
Runtime: OpenAI Codex
```

次に Codex app-server の状態を確認します。

```text
/codex status
/codex models
```

`/codex status` は app-server 接続、アカウント、レート制限、MCP
サーバー、および Skills を報告します。`/codex models` は、そのハーネスとアカウント向けのライブ Codex app-server カタログを一覧表示します。`/status` が想定外の場合は、
[トラブルシューティング](#troubleshooting)を参照してください。

## ルーティングとモデル選択

プロバイダー参照とランタイムポリシーは分けて保ちます。

- Codex 経由の OpenAI エージェントターンには `openai/gpt-*` を使用します。
- 設定で `openai-codex/gpt-*` は使用しないでください。`openclaw doctor --fix` を実行して、
  レガシー参照と古いセッションルートピンを修復します。
- 通常の OpenAI 自動モードでは `agentRuntime.id: "codex"` は任意ですが、
  Codex が利用できない場合にデプロイをフェイルクローズさせたいときに便利です。
- `agentRuntime.id: "pi"` は、それが意図的な場合にプロバイダーまたはモデルを直接 PI 動作にオプトインさせます。
- `/codex ...` は、チャットからネイティブ Codex app-server 会話を制御します。
- ACP/acpx は別の外部ハーネス経路です。ユーザーが ACP/acpx または外部ハーネスアダプターを求めた場合にのみ使用してください。

一般的なコマンドルーティング:

| ユーザーの意図                     | 使用するもの                                     |
| ------------------------------- | --------------------------------------- |
| 現在のチャットを関連付ける         | `/codex bind [--cwd <path>]`            |
| 既存の Codex スレッドを再開する | `/codex resume <thread-id>`             |
| Codex スレッドを一覧表示またはフィルターする    | `/codex threads [filter]`               |
| Codex フィードバックのみを送信する        | `/codex diagnostics [note]`             |
| ACP/acpx タスクを開始する          | `/codex` ではなく ACP/acpx セッションコマンド |

| ユースケース                                             | 設定                                                        | 確認                                  | 注記                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| ネイティブ Codex ランタイムを使う ChatGPT/Codex サブスクリプション | `openai/gpt-*` と有効化済みの `codex` plugin                       | `/status` が `Runtime: OpenAI Codex` を表示 | 推奨パス                   |
| Codex が利用できない場合にフェイルクローズする                  | プロバイダーまたはモデルの `agentRuntime.id: "codex"`                     | PI フォールバックではなくターンが失敗する       | Codex 専用デプロイに使用     |
| PI 経由の直接 OpenAI API キートラフィック             | プロバイダーまたはモデルの `agentRuntime.id: "pi"` と通常の OpenAI 認証 | `/status` が PI ランタイムを表示              | PI が意図的な場合にのみ使用    |
| レガシー設定                                        | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` がそれを書き換える     | この方法で新しい設定を書かない   |
| ACP/acpx Codex アダプター                               | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP タスク/セッション状態                 | ネイティブ Codex ハーネスとは別 |

`agents.defaults.imageModel` も同じプレフィックス分割に従います。通常の OpenAI ルートには `openai/gpt-*`
を使用し、画像理解を制限された Codex app-server ターンで実行する必要がある場合にのみ `codex/gpt-*`
を使用します。`openai-codex/gpt-*` は使用しないでください。doctor はそのレガシープレフィックスを `openai/gpt-*` に書き換えます。

## デプロイパターン

### 基本的な Codex デプロイ

すべての OpenAI エージェントターンがデフォルトで Codex を使用すべき場合は、クイックスタート設定を使用します。

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

この形では、Claude をデフォルトエージェントとして維持し、名前付き Codex エージェントを追加します。

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

### フェイルクローズ Codex デプロイ

OpenAI エージェントターンでは、バンドルされた plugin が利用可能な場合、`openai/gpt-*` はすでに Codex に解決されます。
明文化されたフェイルクローズ規則が必要な場合は、明示的なランタイムポリシーを追加します。

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

Codex が強制されている場合、Codex plugin が無効、app-server が古すぎる、または
app-server を起動できないと、OpenClaw は早期に失敗します。

## App-server ポリシー

デフォルトでは、plugin は OpenClaw が管理する Codex バイナリを stdio
トランスポートでローカルに起動します。別の実行ファイルを意図的に実行したい場合にのみ `appServer.command` を設定します。
WebSocket トランスポートは、app-server がすでに別の場所で実行されている場合にのみ使用します。

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

ローカル stdio app-server セッションは、信頼済みローカルオペレーターの姿勢をデフォルトにします:
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"`。ローカル Codex 要件がこの暗黙の
YOLO 姿勢を許可しない場合、OpenClaw は代わりに許可された guardian 権限を選択します。
セッションで OpenClaw サンドボックスが有効な場合、OpenClaw は Codex の
`danger-full-access` を Codex の `workspace-write` に狭め、ネイティブ Codex code-mode のターンが
サンドボックス化されたワークスペース内に留まるようにします。

サンドボックス脱出や追加権限の前に Codex ネイティブの自動レビューを使いたい場合は、guardian モードを使用します:

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

guardian モードは Codex app-server 承認に展開され、通常は
ローカル要件がそれらの値を許可する場合に `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、および
`sandbox: "workspace-write"` になります。

すべての app-server フィールド、認証順序、環境分離、検出、および
タイムアウト動作については、[Codex harness reference](/ja-JP/plugins/codex-harness-reference) を参照してください。

## コマンドと診断

同梱Pluginは、OpenClaw テキストコマンドをサポートする任意のチャネルで
`/codex` をスラッシュコマンドとして登録します。

一般的な形式:

- `/codex status` は app-server 接続、モデル、アカウント、レート制限、
  MCP サーバー、および skills を確認します。
- `/codex models` はライブ Codex app-server モデルを一覧表示します。
- `/codex threads [filter]` は最近の Codex app-server スレッドを一覧表示します。
- `/codex resume <thread-id>` は現在の OpenClaw セッションを
  既存の Codex スレッドにアタッチします。
- `/codex compact` は Codex app-server に、アタッチされたスレッドの compact を依頼します。
- `/codex review` はアタッチされたスレッドに対して Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` は、アタッチされたスレッドの
  Codex フィードバックを送信する前に確認します。
- `/codex account` はアカウントとレート制限の状態を表示します。
- `/codex mcp` は Codex app-server MCP サーバーの状態を一覧表示します。
- `/codex skills` は Codex app-server skills を一覧表示します。

ほとんどのサポート報告では、バグが発生した会話で `/diagnostics [note]` から開始します。
これは 1 つの Gateway 診断レポートを作成し、Codex harness セッションでは
関連する Codex フィードバックバンドルを送信する承認を求めます。
プライバシーモデルとグループチャットでの動作については、
[Diagnostics export](/ja-JP/gateway/diagnostics) を参照してください。

完全な Gateway 診断バンドルなしで、現在アタッチされているスレッドの
Codex フィードバックアップロードだけを明示的に行いたい場合にのみ
`/codex diagnostics [note]` を使用します。

### Codex スレッドをローカルで調べる

問題のある Codex 実行を調べる最速の方法は、多くの場合、ネイティブ Codex
スレッドを直接開くことです:

```bash
codex resume <thread-id>
```

完了した `/diagnostics` の返信、`/codex binding`、または
`/codex threads [filter]` からスレッド ID を取得します。

アップロードの仕組みとランタイムレベルの診断境界については、
[Codex harness runtime](/ja-JP/plugins/codex-harness-runtime#codex-feedback-upload) を参照してください。

認証はこの順序で選択されます:

1. エージェントの順序付き OpenAI 認証プロファイル。できれば
   `auth.order.openai` の下に置きます。既存の `openai-codex:*` プロファイル ID は引き続き有効です。
2. そのエージェントの Codex home にある app-server の既存アカウント。
3. ローカル stdio app-server 起動の場合のみ、app-server アカウントが存在せず、OpenAI 認証が
   まだ必要なときは、`CODEX_API_KEY`、その後
   `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション型の Codex 認証プロファイルを検出すると、
起動される Codex 子プロセスから `CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。
これにより、Gateway レベルの API キーは埋め込みや直接 OpenAI モデルで利用可能なままにしつつ、
ネイティブ Codex app-server ターンが誤って API 経由で課金されることを防ぎます。
明示的な Codex API キープロファイルとローカル stdio 環境キーのフォールバックは、
継承された子プロセス環境ではなく app-server ログインを使用します。
WebSocket app-server 接続は Gateway 環境 API キーのフォールバックを受け取りません。
明示的な認証プロファイル、またはリモート app-server 自身のアカウントを使用してください。

サブスクリプションプロファイルが Codex 使用量制限に達した場合、Codex がリセット時刻を報告したときは
OpenClaw がその時刻を記録し、同じ Codex 実行のために次の順序付き認証プロファイルを試します。
リセット時刻が過ぎると、選択された `openai/gpt-*` モデルや Codex ランタイムを変更せずに、
そのサブスクリプションプロファイルは再び対象になります。

デプロイに追加の環境分離が必要な場合は、それらの変数を
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

`appServer.clearEnv` は、起動される Codex app-server 子プロセスにのみ影響します。

Codex 動的ツールはデフォルトで `searchable` 読み込みになります。OpenClaw は
Codex ネイティブのワークスペース操作と重複する動的ツールを公開しません: `read`、`write`、
`edit`、`apply_patch`、`exec`、`process`、および `update_plan`。メッセージング、セッション、メディア、cron、ブラウザー、ノード、
gateway、`heartbeat_respond`、`web_search` などの残りの OpenClaw
統合ツールは `openclaw` 名前空間の下で Codex ツール検索を通じて利用でき、
初期モデルコンテキストを小さく保ちます。
`sessions_yield` とメッセージツール専用ソース返信は、ターン制御契約であるため直接のままです。
Heartbeat コラボレーション指示は、そのツールがまだ読み込まれていない場合に、
Heartbeat ターンを終了する前に `heartbeat_respond` を検索するよう Codex に伝えます。

`codexDynamicToolsLoading: "direct"` は、遅延された動的ツールを検索できないカスタム Codex
app-server に接続する場合、または完全なツールペイロードをデバッグする場合にのみ設定します。

サポートされるトップレベル Codex Plugin フィールド:

| フィールド                      | デフォルト        | 意味                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw 動的ツールを初期 Codex ツールコンテキストに直接入れるには `"direct"` を使用します。 |
| `codexDynamicToolsExclude` | `[]`           | Codex app-server ターンから除外する追加の OpenClaw 動的ツール名。              |
| `codexPlugins`             | disabled       | 移行済みのソースインストール済み curated plugins に対するネイティブ Codex plugin/app サポート。           |

サポートされる `appServer` フィールド:

| フィールド                         | デフォルト                                                | 意味                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` は Codex を起動します。`"websocket"` は `url` に接続します。                                                                                                                                                                                |
| `command`                     | 管理対象の Codex バイナリ                                   | stdio トランスポート用の実行ファイル。管理対象バイナリを使用する場合は未設定のままにします。明示的な上書きの場合にのみ設定します。                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | stdio トランスポート用の引数。                                                                                                                                                                                                          |
| `url`                         | 未設定                                                  | WebSocket app-server URL。                                                                                                                                                                                                               |
| `authToken`                   | 未設定                                                  | WebSocket トランスポート用の Bearer トークン。                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | 追加の WebSocket ヘッダー。                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | OpenClaw が継承環境を構築した後、起動される stdio app-server プロセスから削除される追加の環境変数名。`CODEX_HOME` と `HOME` は、ローカル起動時の OpenClaw のエージェント別 Codex 分離用に予約されています。    |
| `requestTimeoutMs`            | `60000`                                                | app-server コントロールプレーン呼び出しのタイムアウト。                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | ターンスコープの Codex app-server リクエスト後、OpenClaw が `turn/completed` を待つ間の静かなウィンドウ。ツール後やステータスのみの合成フェーズが遅い場合は、この値を上げます。                                                                     |
| `mode`                        | ローカル Codex 要件が YOLO を許可しない場合を除き `"yolo"` | YOLO または guardian レビュー付き実行のプリセット。`danger-full-access`、`never` 承認、または `user` レビュアーを省略するローカル stdio 要件では、暗黙のデフォルトが guardian になります。                                                   |
| `approvalPolicy`              | `"never"` または許可された guardian 承認ポリシー       | スレッド開始/再開/ターンに送信されるネイティブ Codex 承認ポリシー。guardian のデフォルトは、許可されている場合 `"on-request"` を優先します。                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` または許可された guardian サンドボックス  | スレッド開始/再開に送信されるネイティブ Codex サンドボックスモード。guardian のデフォルトは、許可されている場合 `"workspace-write"`、それ以外の場合 `"read-only"` を優先します。OpenClaw サンドボックスが有効な場合、`danger-full-access` は `"workspace-write"` に狭められます。 |
| `approvalsReviewer`           | `"user"` または許可された guardian レビュアー               | 許可されている場合は `"auto_review"` を使用して、ネイティブ承認プロンプトを Codex にレビューさせます。それ以外の場合は `guardian_subagent` または `user` です。`guardian_subagent` はレガシーエイリアスのままです。                                                                      |
| `serviceTier`                 | 未設定                                                  | 任意の Codex app-server サービスティア。`"priority"` は fast-mode ルーティングを有効にし、`"flex"` は flex processing を要求し、`null` は上書きをクリアし、レガシーの `"fast"` は `"priority"` として受け入れられます。                                         |

OpenClaw が所有する動的ツール呼び出しは、
`appServer.requestTimeoutMs` とは独立して制限されます。Codex の `item/tool/call` リクエストは、デフォルトで 30 秒の
OpenClaw ウォッチドッグを使用します。呼び出しごとの正の `timeoutMs` 引数は、
その特定ツールの予算を延長または短縮します。`image_generate` ツールは、ツール呼び出しが独自のタイムアウトを
指定しない場合、`agents.defaults.imageGenerationModel.timeoutMs` も使用します。また、メディア理解の `image` ツールは、
`tools.media.image.timeoutSeconds` またはその 60 秒のメディアデフォルトを使用します。動的ツールの
予算は 600000 ms が上限です。タイムアウト時、OpenClaw はサポートされている場合にツールシグナルを中止し、
失敗した動的ツールレスポンスを Codex に返すため、セッションを `processing` に残す代わりにターンを
継続できます。

OpenClaw が Codex のターンスコープ app-server リクエストに応答した後、ハーネスは
Codex が `turn/completed` でネイティブターンを完了することも期待します。その応答後に
app-server が `appServer.turnCompletionIdleTimeoutMs` の間沈黙した場合、OpenClaw はベストエフォートで Codex ターンに割り込み、
診断タイムアウトを記録し、OpenClaw セッションレーンを解放するため、後続のチャットメッセージが
古いネイティブターンの背後でキューに残りません。同じターンの非終端通知は、
`rawResponseItem/completed` を含め、その短いウォッチドッグを解除します。これは Codex がターンがまだ生存していることを
証明したためです。一方で、より長い終端ウォッチドッグは、本当に停止したターンを引き続き保護します。タイムアウト診断には、
最後の app-server 通知メソッドと、生のアシスタントレスポンス項目の場合は、
項目タイプ、ロール、id、境界付きのアシスタントテキストプレビューが含まれます。

ローカルテスト用の環境オーバーライドは引き続き利用できます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` は、
`appServer.command` が未設定の場合に管理対象バイナリをバイパスします。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、
一回限りのローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。反復可能なデプロイでは、
Codex ハーネスセットアップの残りと同じレビュー済みファイルに Plugin の挙動を保持できるため、
設定の使用が推奨されます。

## ネイティブ Codex plugins

ネイティブ Codex plugin サポートは、OpenClaw ハーネスターンと同じ Codex スレッド内で、
Codex app-server 独自のアプリおよび Plugin 機能を使用します。OpenClaw は
Codex plugins を合成 `codex_plugin_*` OpenClaw 動的ツールに変換しません。

`codexPlugins` は、ネイティブ Codex ハーネスを選択するセッションにのみ影響します。
PI 実行、通常の OpenAI プロバイダー実行、ACP 会話
バインディング、その他のハーネスには影響しません。

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
            allow_destructive_actions: false,
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

スレッドアプリ設定は、OpenClaw が Codex ハーネスセッションを確立するか、
古い Codex スレッドバインディングを置き換えるときに計算されます。ターンごとには再計算されません。
`codexPlugins` を変更した後は、`/new`、`/reset`、または Gateway の再起動を使用して、
今後の Codex ハーネスセッションが更新済みのアプリセットで開始されるようにしてください。

移行の適格性、アプリインベントリ、破壊的アクションポリシー、
エリシテーション、ネイティブ Plugin 診断については、
[ネイティブ Codex plugins](/ja-JP/plugins/codex-native-plugins) を参照してください。

## Computer Use

Computer Use については、専用のセットアップガイドで扱っています:
[Codex Computer Use](/ja-JP/plugins/codex-computer-use)。

要約すると、OpenClaw はデスクトップ制御アプリをベンダー化せず、
デスクトップアクション自体も実行しません。Codex app-server を準備し、
`computer-use` MCP サーバーが利用可能であることを検証した後、
Codex モードのターン中にネイティブ MCP ツール呼び出しを Codex に所有させます。

## ランタイム境界

Codex ハーネスは、低レベルの組み込みエージェント実行器のみを変更します。

- OpenClaw 動的ツールはサポートされます。Codex は OpenClaw にこれらの
  ツールの実行を依頼するため、OpenClaw は実行経路に残ります。
- Codex ネイティブのシェル、パッチ、MCP、ネイティブアプリツールは Codex が所有します。
  OpenClaw はサポートされるリレーを通じて選択されたネイティブイベントを観測またはブロックできますが、
  ネイティブツール引数を書き換えることはありません。
- Codex はネイティブ Compaction を所有します。OpenClaw は、チャンネル
  履歴、検索、`/new`、`/reset`、将来のモデルまたはハーネス切り替えのためにトランスクリプトミラーを保持します。
- メディア生成、メディア理解、TTS、承認、メッセージングツールの
  出力は、対応する OpenClaw プロバイダー/モデル設定を通じて継続されます。
- `tool_result_persist` は、OpenClaw が所有するトランスクリプトツール結果に適用され、
  Codex ネイティブのツール結果レコードには適用されません。

フックレイヤー、サポートされる V1 サーフェス、ネイティブ権限処理、キュー
ステアリング、Codex フィードバックアップロードの仕組み、Compaction の詳細については、
[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime) を参照してください。

## トラブルシューティング

**Codex が通常の `/model` プロバイダーとして表示されない:** 新しい設定では
想定どおりです。`openai/gpt-*` モデルを選択し、
`plugins.entries.codex.enabled` を有効にして、`plugins.allow` が
`codex` を除外していないか確認してください。

**OpenClaw が Codex ではなく PI を使用する:** モデル参照が
公式 OpenAI プロバイダー上の `openai/gpt-*` であり、Codex plugin が
インストール済みかつ有効であることを確認してください。テスト中に厳密な証明が必要な場合は、プロバイダーまたは
モデルに `agentRuntime.id: "codex"` を設定します。強制された Codex ランタイムは、
PI にフォールバックする代わりに失敗します。

**従来の `openai-codex/*` 設定が残っている:** `openclaw doctor --fix` を実行してください。
Doctor は従来のモデル参照を `openai/*` に書き換え、古いセッションおよび
エージェント全体のランタイムピンを削除し、既存の認証プロファイルオーバーライドを保持します。

**app-server が拒否される:** Codex app-server `0.125.0` 以降を使用してください。
`0.125.0-alpha.2` や `0.125.0+custom` のような同一バージョンのプレリリースやビルドサフィックス付きバージョンは、
OpenClaw が安定版 `0.125.0` のプロトコル下限をテストするため拒否されます。

**`/codex status` が接続できない:** バンドルされた `codex` Plugin が
有効であること、許可リストが設定されている場合は `plugins.allow` にそれが含まれていること、
およびカスタムの `appServer.command`、`url`、`authToken`、またはヘッダーが有効であることを確認してください。

**モデル検出が遅い:** 
`plugins.entries.codex.config.discovery.timeoutMs` を下げるか、検出を無効にしてください。
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference#model-discovery) を参照してください。

**WebSocket トランスポートがすぐに失敗する:** `appServer.url`、`authToken`、
ヘッダー、およびリモート app-server が同じ Codex app-server
プロトコルバージョンを話すことを確認してください。

**Codex 以外のモデルが PI を使用する:** プロバイダーまたはモデルランタイム
ポリシーが別のハーネスにルーティングしない限り、想定どおりです。通常の OpenAI 以外のプロバイダー参照は、
`auto` モードでは通常のプロバイダーパスに留まります。

**Computer Use はインストールされているがツールが実行されない:** 新しいセッションから
`/codex computer-use status` を確認してください。ツールが
`Native hook relay unavailable` を報告する場合は、`/new` または `/reset` を使用します。継続する場合は、
Gateway を再起動して古いネイティブフック登録をクリアしてください。
[Codex Computer Use](/ja-JP/plugins/codex-computer-use#troubleshooting) を参照してください。

## 関連

- [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [ネイティブ Codex plugins](/ja-JP/plugins/codex-native-plugins)
- [Codex Computer Use](/ja-JP/plugins/codex-computer-use)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [エージェントハーネス plugins](/ja-JP/plugins/sdk-agent-harness)
- [Plugin フック](/ja-JP/plugins/hooks)
- [診断エクスポート](/ja-JP/gateway/diagnostics)
- [ステータス](/ja-JP/cli/status)
- [テスト](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
