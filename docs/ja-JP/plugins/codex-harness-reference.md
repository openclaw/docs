---
read_when:
    - すべての Codex ハーネス設定フィールドが必要です
    - アプリサーバーのトランスポート、認証、検出、またはタイムアウトの動作を変更している
    - Codex ハーネスの起動、モデル検出、または環境分離をデバッグしている
summary: Codex ハーネスの構成、認証、検出、アプリサーバーのリファレンス
title: Codex ハーネスリファレンス
x-i18n:
    generated_at: "2026-07-04T10:27:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43c905586346c8d7c255b58b706eb82543fd1ca05588e459a257e8f9f4cf36d4
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

このリファレンスでは、同梱の `codex`
Plugin の詳細な設定について説明します。セットアップとルーティングの判断については、
[Codex harness](/ja-JP/plugins/codex-harness) から始めてください。

## Plugin 設定サーフェス

すべての Codex harness 設定は `plugins.entries.codex.config` 配下にあります。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

サポートされている最上位フィールド:

| フィールド                 | デフォルト               | 意味                                                                                                                                      |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 有効                     | Codex app-server `model/list` のモデル検出設定。                                                                                          |
| `appServer`                | 管理対象の stdio app-server | トランスポート、コマンド、認証、承認、サンドボックス、タイムアウトの設定。                                                               |
| `codexDynamicToolsLoading` | `"searchable"`           | `"direct"` を使用すると、OpenClaw dynamic tools を初期 Codex ツールコンテキストに直接配置します。                                         |
| `codexDynamicToolsExclude` | `[]`                     | Codex app-server ターンから除外する追加の OpenClaw dynamic tool 名。                                                                      |
| `codexPlugins`             | 無効                     | 移行済みのソースインストール curated plugins に対するネイティブ Codex plugin/app サポート。[Native Codex plugins](/ja-JP/plugins/codex-native-plugins) を参照してください。 |
| `computerUse`              | 無効                     | Codex Computer Use のセットアップ。[Codex Computer Use](/ja-JP/plugins/codex-computer-use) を参照してください。                                 |

## App-server トランスポート

デフォルトでは、OpenClaw は同梱の
Plugin に含まれる管理対象の Codex バイナリを起動します。

```bash
codex app-server --listen stdio://
```

これにより、app-server のバージョンは、ローカルにたまたまインストールされている別個の Codex CLI ではなく、同梱の `codex` Plugin に紐づけられます。別の
実行ファイルを実行したい意図がある場合にのみ、`appServer.command` を設定してください。

すでに実行中の app-server には、WebSocket トランスポートを使用します。

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
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

サポートされている `appServer` フィールド:

| フィールド                                    | デフォルト                                             | 意味                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` は Codex を起動し、`"websocket"` は `url` に接続します。                                                                                                                                                                                                                                                                                                                               |
| `homeScope`                                   | `"agent"`                                              | `"agent"` は OpenClaw エージェントごとに Codex の状態を分離します。`"user"` はネイティブの `$CODEX_HOME` または `~/.codex` を共有し、ネイティブ認証を使い、所有者専用のスレッド管理を有効にします。ユーザースコープには stdio が必要です。                                                                                                                                                     |
| `command`                                     | 管理対象の Codex バイナリ                              | stdio トランスポート用の実行ファイルです。管理対象バイナリを使う場合は未設定のままにします。                                                                                                                                                                                                                                                                                                   |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio トランスポート用の引数です。                                                                                                                                                                                                                                                                                                                                                              |
| `url`                                         | 未設定                                                 | WebSocket app-server の URL です。                                                                                                                                                                                                                                                                                                                                                              |
| `authToken`                                   | 未設定                                                 | WebSocket トランスポート用のベアラートークンです。リテラル文字列、または `${CODEX_APP_SERVER_TOKEN}` のような SecretInput を受け付けます。                                                                                                                                                                                                                                                      |
| `headers`                                     | `{}`                                                   | 追加の WebSocket ヘッダーです。ヘッダー値には、リテラル文字列または SecretInput 値を指定できます。例: `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                        |
| `clearEnv`                                    | `[]`                                                   | OpenClaw が継承環境を構築した後に、起動された stdio app-server プロセスから削除される追加の環境変数名です。                                                                                                                                                                                                                                                                                    |
| `remoteWorkspaceRoot`                         | 未設定                                                 | リモート Codex app-server のワークスペースルートです。設定すると、OpenClaw は解決済みの OpenClaw ワークスペースからローカルワークスペースルートを推定し、このリモートルート配下で現在の cwd サフィックスを保持し、最終的な app-server cwd だけを Codex に送信します。cwd が解決済みの OpenClaw ワークスペースルートの外側にある場合、OpenClaw は Gateway ローカルパスをリモート app-server に送信する代わりにフェイルクローズします。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server コントロールプレーン呼び出しのタイムアウトです。                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex がターンを受け付けた後、またはターンスコープの app-server リクエスト後に、OpenClaw が `turn/completed` を待機する静かなウィンドウです。                                                                                                                                                                                                                                                   |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw が `turn/completed` を待機している間、ツールの引き継ぎ、ネイティブツール完了、ツール後の raw assistant 進行、raw reasoning 完了、または reasoning 進行の後に使われる完了アイドルおよび進行ガードです。ツール後の合成が最終 assistant リリース予算より正当に長く静かなままでいられる、信頼済みまたは重いワークロードに使用します。                                                                  |
| `mode`                                        | ローカル Codex 要件が YOLO を許可しない場合を除き `"yolo"` | YOLO または guardian レビュー付き実行のプリセットです。                                                                                                                                                                                                                                                                                                                                        |
| `approvalPolicy`                              | `"never"` または許可された guardian 承認ポリシー       | スレッド開始、再開、ターンに送信されるネイティブ Codex 承認ポリシーです。                                                                                                                                                                                                                                                                                                                       |
| `sandbox`                                     | `"danger-full-access"` または許可された guardian サンドボックス | スレッド開始と再開に送信されるネイティブ Codex サンドボックスモードです。有効な OpenClaw サンドボックスは `danger-full-access` ターンを Codex `workspace-write` に絞り込みます。ターンのネットワークフラグは OpenClaw サンドボックスのエグレスに従います。                                                                                                                                     |
| `approvalsReviewer`                           | `"user"` または許可された guardian レビュアー          | 許可されている場合に Codex がネイティブ承認プロンプトをレビューできるようにするには、`"auto_review"` を使います。                                                                                                                                                                                                                                                                               |
| `defaultWorkspaceDir`                         | 現在のプロセスディレクトリ                             | `--cwd` が省略されたときに `/codex bind` が使うワークスペースです。                                                                                                                                                                                                                                                                                                                             |
| `serviceTier`                                 | 未設定                                                 | 任意の Codex app-server サービスティアです。`"priority"` は fast-mode ルーティングを有効にし、`"flex"` は flex 処理を要求し、`null` は上書きをクリアします。レガシーの `"fast"` は `"priority"` として受け付けられます。                                                                                                                                                                         |
| `networkProxy`                                | 無効                                                   | app-server コマンド向けに Codex 権限プロファイルのネットワーキングを有効化します。OpenClaw は選択された `permissions.<profile>.network` 設定を定義し、`sandbox` を送信する代わりに `default_permissions` でそれを選択します。                                                                                                                                                                  |
| `experimental.sandboxExecServer`              | `false`                                                | OpenClaw サンドボックスに裏付けられた Codex 環境を Codex app-server 0.132.0 以降に登録し、ネイティブ Codex 実行を有効な OpenClaw サンドボックス内で実行できるようにするプレビューのオプトインです。                                                                                                                                                                                              |

`appServer.networkProxy` は Codex サンドボックス契約を変更するため明示的です。
有効にすると、OpenClaw は Codex スレッド設定で `features.network_proxy.enabled` と
`default_permissions` も設定し、生成された権限プロファイルが Codex 管理の
ネットワーキングを開始できるようにします。デフォルトでは、OpenClaw は
プロファイル本体から衝突耐性のある `openclaw-network-<fingerprint>` プロファイル名を生成します。
安定したローカル名が必要な場合にのみ `profileName` を使ってください。

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

通常の app-server ランタイムが `danger-full-access` になる場合でも、
`networkProxy` を有効にすると、生成される権限プロファイルには workspace スタイルのファイルシステムアクセスが使われます。Codex 管理のネットワーク強制はサンドボックス化されたネットワークであるため、フルアクセスプロファイルではアウトバウンドトラフィックを保護できません。

この Plugin は、古いまたはバージョンなしの app-server ハンドシェイクをブロックします。Codex app-server は、安定版バージョン `0.125.0` 以降を報告する必要があります。

OpenClaw は、非ループバックの WebSocket app-server URL をリモートとして扱い、`appServer.authToken` または `Authorization` ヘッダーによる、ID を持つ WebSocket 認証を要求します。`appServer.authToken` と各 `appServer.headers.*` 値には SecretInput を使用できます。secrets ランタイムは、OpenClaw が app-server 起動オプションを構築する前に SecretRefs と env 省略記法を解決し、未解決の構造化 SecretRefs はトークンやヘッダーが送信される前に失敗します。ネイティブ Codex plugins が構成されている場合、OpenClaw は接続済み app-server の plugin コントロールプレーンを使用してそれらの plugins をインストールまたは更新し、その後 app インベントリを更新して、plugin が所有する apps が Codex スレッドから見えるようにします。`app/list` は引き続き権威あるインベントリおよびメタデータソースですが、Codex が現在それを無効とマークしている場合でも、一覧にあるアクセス可能な app に対して `thread/start` が `config.apps[appId].enabled = true` を送信するかどうかは OpenClaw ポリシーが決定します。不明または欠落している app ids は fail-closed のままです。このパスは `plugin/install` によって marketplace plugins を有効化し、インベントリを更新するだけです。OpenClaw 管理の plugin インストールと app インベントリ更新を受け入れる信頼できるリモート app-servers にのみ OpenClaw を接続してください。

## 承認とサンドボックスモード

ローカル stdio app-server セッションは、デフォルトで YOLO モードになります:
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"`。この信頼済みローカルオペレーター向けの姿勢により、応答できる人がいないネイティブ承認プロンプトなしで、無人の OpenClaw ターンと heartbeats を進められます。

Codex のローカルシステム要件ファイルが暗黙の YOLO 承認、レビュアー、またはサンドボックス値を許可しない場合、OpenClaw は暗黙のデフォルトを代わりに guardian として扱い、許可された guardian 権限を選択します。`tools.exec.mode: "auto"` も guardian レビュー付きの Codex 承認を強制し、安全でないレガシーの `approvalPolicy: "never"` または `sandbox: "danger-full-access"` オーバーライドを保持しません。承認なしの姿勢を意図する場合は `tools.exec.mode: "full"` を設定してください。同じ要件ファイル内の、ホスト名に一致する
`[[remote_sandbox_config]]` エントリは、サンドボックスのデフォルト決定で尊重されます。

Codex guardian レビュー付き承認には `appServer.mode: "guardian"` を設定します:

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

`guardian` プリセットは、それらの値が許可されている場合、`approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`、および `sandbox: "workspace-write"` に展開されます。個別のポリシーフィールドは `mode` をオーバーライドします。古い `guardian_subagent` レビュアー値は互換エイリアスとして引き続き受け入れられますが、新しい config では `auto_review` を使用してください。

OpenClaw サンドボックスがアクティブな場合でも、ローカル Codex app-server プロセスは Gateway ホスト上で実行されます。そのため OpenClaw は、そのターンについて Codex ネイティブ Code Mode、ユーザー MCP サーバー、app-backed plugin 実行を無効にします。Codex ホスト側のサンドボックス化を OpenClaw サンドボックスバックエンドと同等として扱うことはしません。通常の exec/process ツールが利用可能な場合、シェルアクセスは `sandbox_exec` や `sandbox_process` などの OpenClaw サンドボックス backed 動的ツールを通じて公開されます。

Ubuntu/AppArmor ホストでは、アクティブな OpenClaw サンドボックス化なしでネイティブ Codex
`workspace-write` を意図的に実行すると、Codex bwrap がシェルコマンド開始前に `workspace-write` で失敗することがあります。
`bwrap: setting up uid map: Permission denied` または
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` が表示された場合は、より広い Docker コンテナ権限を付与するのではなく、`openclaw doctor` を実行し、報告された OpenClaw サービスユーザー向けのホスト名前空間ポリシーを修正してください。サービスプロセスにはスコープを絞った AppArmor プロファイルを優先してください。
`kernel.apparmor_restrict_unprivileged_userns=0` フォールバックはホスト全体に及び、セキュリティ上のトレードオフがあります。

## サンドボックス化されたネイティブ実行

安定したデフォルトは fail-closed です。アクティブな OpenClaw サンドボックス化は、そうでなければ Codex app-server ホストから実行されるネイティブ Codex 実行サーフェスを無効にします。Codex のリモート環境サポートを OpenClaw のサンドボックスバックエンドで試したい場合にのみ、`appServer.experimental.sandboxExecServer: true` を使用してください。このプレビューパスには Codex app-server 0.132.0 以降が必要です。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

このフラグがオンで、現在の OpenClaw セッションがサンドボックス化されている場合、OpenClaw はアクティブなサンドボックスを backed とする local loopback exec-server を起動し、それを Codex app-server に登録し、その OpenClaw 所有の環境で Codex スレッドとターンを開始します。app-server が環境を登録できない場合、実行はホスト実行へ暗黙にフォールバックするのではなく fail closed します。

このプレビューパスはローカル専用です。リモート WebSocket app-server は同じホストで実行されていない限り loopback exec-server に到達できないため、OpenClaw はその組み合わせを拒否します。

## 認証と環境分離

デフォルトのエージェントごとのホームでは、認証は次の順序で選択されます:

1. エージェント用の明示的な OpenClaw Codex 認証プロファイル。
2. そのエージェントの Codex ホームにある app-server の既存アカウント。
3. ローカル stdio app-server 起動のみで、app-server アカウントが存在せず、OpenAI 認証がまだ必要な場合、`CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプションスタイルの Codex 認証プロファイルを検出すると、生成される Codex 子プロセスから
`CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、Gateway レベルの API キーは embeddings や直接の OpenAI models に利用可能なまま、ネイティブ Codex app-server ターンが誤って API 経由で課金されることを防ぎます。

明示的な Codex API-key プロファイルとローカル stdio env-key フォールバックは、継承された子プロセス env ではなく app-server login を使用します。WebSocket app-server 接続は Gateway env API-key フォールバックを受け取りません。明示的な認証プロファイル、またはリモート app-server 自身のアカウントを使用してください。

Stdio app-server 起動は、デフォルトで OpenClaw のプロセス環境を継承します。OpenClaw は Codex app-server アカウントブリッジを所有し、`CODEX_HOME` をそのエージェントの OpenClaw state 配下にあるエージェントごとのディレクトリに設定します。これにより、Codex config、accounts、plugin cache/data、thread state は、オペレーター個人の `~/.codex` ホームから漏れ込むのではなく、OpenClaw エージェントにスコープされます。

ネイティブ Codex state を Codex Desktop および CLI と共有するには、`appServer.homeScope: "user"` を設定します。このローカル stdio 専用モードは、設定されている場合は `$CODEX_HOME`、それ以外の場合は `~/.codex` を使用します。ネイティブ auth、config、plugins、threads も含まれます。OpenClaw は app-server について auth-profile bridge をスキップします。検証済みの owner ターンは、`codex_threads` を使用して、それらの threads を一覧表示、検索、読み取り、fork、名前変更、アーカイブ、復元できます。OpenClaw で続行する前に thread を fork してください。独立した Codex プロセスは、同じ thread に対する同時 writer を調整しません。

OpenClaw は通常のローカル app-server 起動で `HOME` を書き換えません。`openclaw`、`gh`、`git`、クラウド CLI、シェルコマンドなどの Codex 実行サブプロセスは、通常のプロセス home を見て、ユーザーホームの config と tokens を見つけられます。Codex は `$HOME/.agents/skills` と `$HOME/.agents/plugins/marketplace.json` も検出する場合があります。この `.agents` 検出は意図的にオペレーター home と共有され、分離された `~/.codex` state とは別です。

デフォルトのエージェントスコープでは、OpenClaw plugins と OpenClaw skill snapshots は引き続き OpenClaw 独自の plugin registry と skill loader を通じて流れます。個人の Codex
`~/.codex` assets はそうではありません。分離された OpenClaw エージェントの一部にすべき、有用な Codex CLI skills または plugins が Codex home にある場合は、明示的に inventory してください:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

デプロイメントで追加の環境分離が必要な場合は、それらの変数を `appServer.clearEnv` に追加します:

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

`appServer.clearEnv` は、生成される Codex app-server 子プロセスにのみ影響します。OpenClaw は、ローカル起動の正規化中にこのリストから `CODEX_HOME` と `HOME` を削除します。`CODEX_HOME` は選択されたエージェントまたはユーザースコープを指したままになり、`HOME` はサブプロセスが通常のユーザーホーム state を使用できるよう継承されたままになります。

## 動的ツール

Codex 動的ツールは、デフォルトで `searchable` ロードになります。OpenClaw は、Codex ネイティブの workspace 操作と重複する動的ツールを公開しません:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

messaging、media、cron、browser、nodes、gateway、`heartbeat_respond`、`web_search` など、残りのほとんどの OpenClaw 統合ツールは、`openclaw` 名前空間の下で Codex ツール検索を通じて利用できます。これにより、初期モデルコンテキストが小さく保たれます。`sessions_yield` と message-tool-only source replies は、ターン制御契約であるため direct のままです。`sessions_spawn` は searchable のままなので、Codex のネイティブ `spawn_agent` が主要な Codex サブエージェントサーフェスであり続けます。一方で、明示的な OpenClaw または ACP 委任は、引き続き `openclaw` 動的ツール名前空間を通じて利用できます。

遅延された動的ツールを検索できないカスタム Codex app-server に接続する場合、または完全なツールペイロードをデバッグする場合にのみ、`codexDynamicToolsLoading: "direct"` を設定してください。

## タイムアウト

OpenClaw 所有の動的ツール呼び出しは、`appServer.requestTimeoutMs` とは独立して制限されます。各 Codex `item/tool/call` リクエストは、次の順序で最初に利用可能なタイムアウトを使用します:

- 正の per-call `timeoutMs` 引数。
- `image_generate` の場合、`agents.defaults.imageGenerationModel.timeoutMs`。
- `image_generate` で構成済みタイムアウトがない場合、120 秒の画像生成デフォルト。
- media-understanding `image` ツールの場合、`tools.media.image.timeoutSeconds` をミリ秒に変換した値、または 60 秒の media デフォルト。画像理解では、これはリクエスト自体に適用され、先行する準備作業によって短縮されません。
- 90 秒の動的ツールデフォルト。

この watchdog は、外側の動的 `item/tool/call` 予算です。プロバイダー固有のリクエストタイムアウトはその呼び出し内で実行され、独自のタイムアウトセマンティクスを保持します。動的ツール予算は 600000 ms で上限設定されます。タイムアウト時、OpenClaw はサポートされている場合ツールシグナルを中止し、失敗した動的ツール応答を Codex に返します。これにより、セッションを `processing` のままにするのではなくターンを続行できます。

Codex がターンを受け入れた後、および OpenClaw がターンスコープの app-server リクエストに応答した後、harness は Codex が現在のターンの進捗を作り、最終的に `turn/completed` でネイティブターンを完了することを期待します。app-server が `appServer.turnCompletionIdleTimeoutMs` の間沈黙した場合、OpenClaw は best-effort で Codex ターンを interrupt し、診断タイムアウトを記録し、OpenClaw セッション lane を解放します。これにより、後続のチャットメッセージが古いネイティブターンの後ろにキューされないようにします。

ほとんどの同一ターンの非終端通知は、その短い watchdog を解除します。Codex がそのターンがまだ生きていることを証明したためです。ツールのハンドオフでは、より長いツール後アイドル予算を使います。OpenClaw が `item/tool/call` レスポンスを返した後、`commandExecution` などのネイティブツール項目が完了した後、生の `custom_tool_call_output` 完了後、そしてツール後の生アシスタント進捗、生 reasoning 完了、または reasoning 進捗後です。このガードは、設定されている場合は `appServer.postToolRawAssistantCompletionIdleTimeoutMs` を使い、そうでない場合はデフォルトで 5 分になります。同じツール後予算は、Codex が次の現在ターンイベントを発行する前の無音合成ウィンドウについても進捗 watchdog を延長します。Reasoning 完了、commentary `agentMessage` 完了、ツール前の生 reasoning またはアシスタント進捗には自動最終返信が続く可能性があるため、セッションレーンを即時解放するのではなく、進捗後返信ガードを使います。final/non-commentary の完了済み `agentMessage` 項目と、ツール前の生アシスタント完了だけが、アシスタント出力解放を作動させます。その後 Codex が `turn/completed` なしで沈黙した場合、OpenClaw はベストエフォートでネイティブターンに割り込み、セッションレーンを解放します。アシスタント、ツール、アクティブ項目、または副作用の証拠がないターン完了アイドルタイムアウトを含む、リプレイ安全な stdio アプリサーバー失敗は、新しいアプリサーバー試行で 1 回再試行されます。安全でないタイムアウトでは、詰まったアプリサーバークライアントを終了し、OpenClaw セッションレーンを解放します。また、自動的にリプレイするのではなく、古いネイティブスレッドバインディングもクリアします。完了監視タイムアウトは Codex 固有のタイムアウト文言を表示します。リプレイ安全なケースではレスポンスが不完全な可能性があると伝え、安全でないケースでは再試行前に現在の状態を確認するようユーザーに伝えます。公開タイムアウト診断には、最後のアプリサーバー通知メソッド、生アシスタントレスポンス項目の id/type/role、アクティブなリクエスト/項目数、作動中の監視状態などの構造化フィールドが含まれます。最後の通知が生アシスタントレスポンス項目である場合は、境界付きのアシスタントテキストプレビューも含まれます。生プロンプトやツール内容は含まれません。

## モデル検出

デフォルトでは、Codex Plugin は利用可能なモデルをアプリサーバーに問い合わせます。モデルの可用性は Codex アプリサーバーが所有するため、OpenClaw がバンドルされた `@openai/codex` バージョンをアップグレードしたとき、またはデプロイメントが `appServer.command` を別の Codex バイナリに向けたときに、リストが変わることがあります。可用性はアカウントごとにスコープされることもあります。実行中の gateway で `/codex models` を使うと、そのハーネスとアカウントのライブカタログを確認できます。

検出に失敗するかタイムアウトした場合、OpenClaw は次のためにバンドルされたフォールバックカタログを使います。

- GPT-5.5
- GPT-5.4 mini

現在のバンドル済みハーネスは `@openai/codex` `0.142.4` です。GPT-5.6 が有効なワークスペースで、そのバンドル済みアプリサーバーに対する `model/list` プローブは、次の公開ピッカー行を返しました。

| モデル id              | 入力モダリティ | Reasoning エフォート                    |
| --------------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`         | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | text, image      | low, medium, high, xhigh, max        |
| `gpt-5.5`             | text, image      | low, medium, high, xhigh             |
| `gpt-5.4`             | text, image      | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | text, image      | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | text, image      | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | text             | low, medium, high, xhigh             |

GPT-5.6 へのアクセスは限定プレビュー中はアカウントごとにスコープされます。`max` はモデルの reasoning エフォートです。`ultra` は別個の Codex マルチエージェントオーケストレーションメタデータであり、標準の OpenAI reasoning エフォートではありません。

非表示モデルは、内部または特殊なフロー向けにアプリサーバーカタログから返されることがありますが、通常のモデルピッカーの選択肢ではありません。

検出は `plugins.entries.codex.config.discovery` で調整します。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

起動時に Codex のプローブを避け、フォールバックカタログだけを使いたい場合は、検出を無効にします。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## ワークスペースブートストラップファイル

Codex はネイティブのプロジェクトドキュメント検出を通じて `AGENTS.md` 自体を扱います。OpenClaw は合成 Codex プロジェクトドキュメントファイルを書き込まず、ペルソナファイルについて Codex のフォールバックファイル名にも依存しません。Codex のフォールバックは `AGENTS.md` がない場合にのみ適用されるためです。

OpenClaw ワークスペースの同等性のため、Codex ハーネスは他のブートストラップファイルを解決します。`SOUL.md`、`IDENTITY.md`、`TOOLS.md`、`USER.md` は、アクティブなエージェント、利用可能なワークスペースガイダンス、ユーザープロファイルを定義するため、OpenClaw Codex 開発者指示として転送されます。コンパクトな OpenClaw Skills リストは、ターンスコープのコラボレーション開発者指示として転送されます。`HEARTBEAT.md` の内容は注入されません。heartbeat ターンには、ファイルが存在し空でない場合にそのファイルを読むためのコラボレーションモードポインターが与えられます。設定されたエージェントワークスペースの `MEMORY.md` 内容は、そのワークスペースでメモリツールが利用可能な場合、ネイティブ Codex ターン入力に貼り付けられません。存在する場合、ハーネスはターンスコープのコラボレーション開発者指示に小さなワークスペースメモリポインターを追加し、永続メモリが関連する場合 Codex は `memory_search` または `memory_get` を使うべきです。ツールが無効、メモリ検索が利用不可、またはアクティブワークスペースがエージェントメモリワークスペースと異なる場合、`MEMORY.md` は通常の境界付きターンコンテキストパスを使います。
`BOOTSTRAP.md` が存在する場合は、OpenClaw ターン入力参照コンテキストとして転送されます。

## 環境オーバーライド

環境オーバーライドはローカルテスト向けに引き続き利用できます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` が未設定の場合、`OPENCLAW_CODEX_APP_SERVER_BIN` は管理対象バイナリを迂回します。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに `plugins.entries.codex.config.appServer.mode: "guardian"` を使うか、一回限りのローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使ってください。再現可能なデプロイメントでは、Plugin の動作を Codex ハーネス設定の残りと同じレビュー済みファイルに保てるため、設定が推奨されます。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [ネイティブ Codex plugins](/ja-JP/plugins/codex-native-plugins)
- [Codex Computer Use](/ja-JP/plugins/codex-computer-use)
- [OpenAI provider](/ja-JP/providers/openai)
- [設定リファレンス](/ja-JP/gateway/configuration-reference)
