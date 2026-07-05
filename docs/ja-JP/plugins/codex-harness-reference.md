---
read_when:
    - すべての Codex ハーネス設定フィールドが必要です
    - app-server のトランスポート、認証、検出、またはタイムアウトの動作を変更している場合
    - Codex ハーネスの起動、モデル検出、または環境分離をデバッグしている
summary: Codex ハーネス向けの設定、認証、検出、アプリサーバーリファレンス
title: Codex ハーネスリファレンス
x-i18n:
    generated_at: "2026-07-05T11:37:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7da4aa4ef7dc26bb7325d195309b9f608ecc645e515907d52306fcc419a94081
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

このリファレンスでは、バンドルされた `codex` Plugin の詳細設定を扱います。
セットアップとルーティングの判断については、
[Codex ハーネス](/ja-JP/plugins/codex-harness)から始めてください。

## Plugin 設定サーフェス

すべての Codex ハーネス設定は `plugins.entries.codex.config` 配下にあります。

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

トップレベルフィールド:

| フィールド                 | デフォルト               | 意味                                                                                                                                      |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 有効                     | Codex app-server `model/list` のモデル検出設定。                                                                                          |
| `appServer`                | 管理 stdio app-server    | トランスポート、コマンド、認証、承認、サンドボックス、タイムアウトの設定。                                                               |
| `codexDynamicToolsLoading` | `"searchable"`           | OpenClaw 動的ツールを初期 Codex ツールコンテキストに直接入れるには `"direct"` を使用します。                                              |
| `codexDynamicToolsExclude` | `[]`                     | Codex app-server ターンから省略する追加の OpenClaw 動的ツール名。                                                                         |
| `codexPlugins`             | 無効                     | 移行済みのソースインストール型キュレーション済みプラグイン向けのネイティブ Codex プラグイン/app サポート。[ネイティブ Codex プラグイン](/ja-JP/plugins/codex-native-plugins)を参照してください。 |
| `computerUse`              | 無効                     | Codex Computer Use セットアップ。[Codex Computer Use](/ja-JP/plugins/codex-computer-use)を参照してください。                                    |

## App-server トランスポート

デフォルトでは、OpenClaw はバンドルされた Plugin に同梱されている管理対象 Codex バイナリ
（現在は `@openai/codex` `0.142.5`）を起動します。

```bash
codex app-server --listen stdio://
```

これにより、app-server のバージョンは、ローカルにたまたまインストールされている別の Codex CLI ではなく、
バンドルされた `codex` Plugin に紐づきます。意図的に別の実行ファイルを使いたい場合にのみ
`appServer.command` を設定してください。

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

`appServer` フィールド:

| フィールド                                  | デフォルト                                             | 意味                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` は Codex を起動します。`"websocket"` は `url` に接続します。                                                                                                                                                                                                                                                                                                                          |
| `homeScope`                                   | `"agent"`                                              | `"agent"` は OpenClaw エージェントごとに Codex の状態を分離します。`"user"` はネイティブの `$CODEX_HOME` または `~/.codex` を共有し、ネイティブ認証を使用し、所有者限定のスレッド管理を有効にします。ユーザースコープには stdio が必要です。                                                                                                                                                |
| `command`                                     | 管理対象の Codex バイナリ                              | stdio トランスポート用の実行ファイルです。管理対象バイナリを使用するには未設定のままにします。                                                                                                                                                                                                                                                                                                |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio トランスポート用の引数です。                                                                                                                                                                                                                                                                                                                                                             |
| `url`                                         | 未設定                                                 | WebSocket app-server URL です。                                                                                                                                                                                                                                                                                                                                                                 |
| `authToken`                                   | 未設定                                                 | WebSocket トランスポート用の Bearer トークンです。リテラル文字列、または `${CODEX_APP_SERVER_TOKEN}` などの SecretInput を受け付けます。                                                                                                                                                                                                                                                       |
| `headers`                                     | `{}`                                                   | 追加の WebSocket ヘッダーです。ヘッダー値には、リテラル文字列または SecretInput 値を指定できます。例: `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                       |
| `clearEnv`                                    | `[]`                                                   | OpenClaw が継承環境を構築した後、起動された stdio app-server プロセスから削除される追加の環境変数名です。                                                                                                                                                                                                                                                                                    |
| `remoteWorkspaceRoot`                         | 未設定                                                 | リモート Codex app-server のワークスペースルートです。設定すると、OpenClaw は解決済みの OpenClaw ワークスペースからローカルワークスペースルートを推定し、このリモートルート配下で現在の cwd サフィックスを保持し、最終的な app-server cwd のみを Codex に送信します。cwd が解決済みの OpenClaw ワークスペースルートの外にある場合、OpenClaw は Gateway ローカルパスをリモート app-server に送信せず、フェイルクローズします。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server コントロールプレーン呼び出しのタイムアウトです。                                                                                                                                                                                                                                                                                                                                    |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex がターンを受け入れた後、またはターンスコープの app-server リクエスト後に、OpenClaw が `turn/completed` を待機する間の静かなウィンドウです。                                                                                                                                                                                                                                             |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw が `turn/completed` を待機している間に、ツールの引き渡し、ネイティブツール完了、ツール後の raw assistant 進捗、raw reasoning 完了、または reasoning 進捗の後で使用される、完了アイドルおよび進捗ガードです。ツール後の合成が最終アシスタントリリース予算よりも正当に長く静かな状態でいられる、信頼済みまたは重いワークロードに使用します。                                |
| `mode`                                        | ローカル Codex の要件が YOLO を許可しない場合を除き `"yolo"` | YOLO または guardian レビュー済み実行のプリセットです。                                                                                                                                                                                                                                                                                                                                        |
| `approvalPolicy`                              | `"never"` または許可された guardian 承認ポリシー       | スレッド開始、再開、ターンに送信されるネイティブ Codex 承認ポリシーです。                                                                                                                                                                                                                                                                                                                     |
| `sandbox`                                     | `"danger-full-access"` または許可された guardian サンドボックス | スレッド開始と再開に送信されるネイティブ Codex サンドボックスモードです。有効な OpenClaw サンドボックスは、`danger-full-access` ターンを Codex `workspace-write` に狭めます。ターンのネットワークフラグは OpenClaw サンドボックスの egress に従います。                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` または許可された guardian レビュアー          | 許可されている場合、`"auto_review"` を使用すると Codex がネイティブ承認プロンプトをレビューします。                                                                                                                                                                                                                                                                                            |
| `defaultWorkspaceDir`                         | 現在のプロセスディレクトリ                             | `--cwd` が省略されたときに `/codex bind` が使用するワークスペースです。                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | 未設定                                                 | 任意の Codex app-server サービスティアです。`"priority"` は fast-mode ルーティングを有効にし、`"flex"` は flex 処理を要求し、`null` は上書きをクリアします。レガシーの `"fast"` は `"priority"` として受け付けられます。                                                                                                                                                                      |
| `networkProxy`                                | 無効                                                   | app-server コマンドで Codex permissions-profile ネットワークを使用するようにします。OpenClaw は、`sandbox` を送信する代わりに、選択された `permissions.<profile>.network` 設定を定義し、`default_permissions` でそれを選択します。                                                                                                                                                           |
| `experimental.sandboxExecServer`              | `false`                                                | OpenClaw サンドボックスを基盤とする Codex 環境を Codex app-server 0.132.0 以降に登録し、ネイティブ Codex 実行を有効な OpenClaw サンドボックス内で実行できるようにするプレビューのオプトインです。                                                                                                                                                                                            |

`appServer.networkProxy` は Codex サンドボックス契約を変更するため、明示的です。有効にすると、OpenClaw は生成された権限プロファイルが Codex 管理のネットワーク処理を開始できるように、Codex スレッド設定で `features.network_proxy.enabled` と `default_permissions` も設定します。OpenClaw はデフォルトで、プロファイル本文から衝突耐性のある `openclaw-network-<fingerprint>` プロファイル名を生成します。安定したローカル名が必要な場合にのみ `profileName` を使用してください。

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

通常のアプリサーバーランタイムが `danger-full-access` になる場合、
`networkProxy` を有効にすると、生成される権限プロファイルには代わりに
workspace 形式のファイルシステムアクセスが使用されます。Codex が管理するネットワーク強制はサンドボックス化された
ネットワーク処理であるため、フルアクセスプロファイルでは外向き通信を保護できません。

この Plugin は、古い、またはバージョンなしのアプリサーバーハンドシェイクをブロックします。Codex アプリサーバーは、
stable バージョン `0.125.0` 以降を報告する必要があります。

OpenClaw は、非ループバックの WebSocket アプリサーバー URL をリモートとして扱い、
`appServer.authToken` または `Authorization` ヘッダーによる、識別情報を持つ WebSocket 認証を要求します。`appServer.authToken` と各 `appServer.headers.*`
値には SecretInput を使用できます。secrets ランタイムは、OpenClaw がアプリサーバーの起動オプションを構築する前に SecretRefs と env
省略記法を解決し、未解決の構造化 SecretRefs は、トークンやヘッダーが送信される前に失敗します。ネイティブ
Codex plugins が設定されている場合、OpenClaw は接続済みアプリサーバーの Plugin
制御プレーンを使ってそれらの plugins をインストールまたは更新し、その後 app
インベントリを更新して、Plugin 所有の apps が Codex スレッドに見えるようにします。`app/list` は
引き続き権威あるインベントリおよびメタデータソースですが、OpenClaw ポリシーは、
Codex が現在無効とマークしている場合でも、一覧表示されたアクセス可能な app について `thread/start` が `config.apps[appId].enabled = true` を送るかどうかを決定します。不明または
欠落している app id は引き続きフェイルクローズです。この経路は、`plugin/install` によって marketplace
plugins を有効化し、インベントリを更新するだけです。OpenClaw をリモートアプリサーバーに接続するのは、
OpenClaw 管理の Plugin インストールと app インベントリ更新を受け入れてよいと信頼できる場合に限定してください。

## 承認とサンドボックスモード

ローカル stdio アプリサーバーセッションは、デフォルトで YOLO モードになります。
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"` です。この信頼されたローカルオペレーターの姿勢により、
無人の OpenClaw ターンと Heartbeat は、応答できる人がいないネイティブ承認プロンプトなしで進行できます。

Codex のローカルシステム要件ファイルが暗黙の YOLO 承認、
レビュアー、またはサンドボックス値を許可しない場合、OpenClaw は暗黙のデフォルトを代わりに guardian
として扱い、許可された guardian 権限を選択します。`tools.exec.mode: "auto"` も guardian レビュー付きの Codex 承認を強制し、安全でない従来の
`approvalPolicy: "never"` または `sandbox: "danger-full-access"` オーバーライドを保持しません。意図的に承認なしの姿勢を取るには
`tools.exec.mode: "full"` を設定してください。同じ要件ファイル内のホスト名に一致する `[[remote_sandbox_config]]` エントリは、サンドボックスのデフォルト決定で尊重されます。

Codex の guardian レビュー付き承認には `appServer.mode: "guardian"` を設定します。

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

`guardian` プリセットは、それらの値が許可されている場合に `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`、および `sandbox: "workspace-write"` に展開されます。個別のポリシーフィールドは `mode` をオーバーライドします。古い
`guardian_subagent` レビュアー値は互換エイリアスとして引き続き受け入れられますが、
新しい config では `auto_review` を使用してください。

OpenClaw サンドボックスが有効な場合でも、ローカル Codex アプリサーバープロセスは
Gateway ホスト上で実行されます。そのため OpenClaw は、そのターンでは Codex ホスト側のサンドボックス化を OpenClaw サンドボックス
バックエンドと同等に扱うのではなく、Codex ネイティブ Code Mode、
ユーザー MCP サーバー、および app-backed Plugin 実行を無効にします。
通常の exec/process ツールが利用可能な場合、シェルアクセスは `sandbox_exec` や
`sandbox_process` などの OpenClaw サンドボックス backed 動的ツールを通じて公開されます。

<Note>
Docker backed OpenClaw サンドボックスホスト（`agents.defaults.sandbox.mode` が
Docker バックエンドに設定されている場合）では、`openclaw doctor` が、ホストが非特権ユーザーに対して、また Docker サンドボックスのネットワーク egress が無効な場合はネットワークに対して、
サンドボックスコンテナ内での `workspace-write`
シェル実行にネストされた Codex `bwrap` が必要とする namespace を許可しているかを検査します。検査に失敗すると通常、
Ubuntu/AppArmor ホスト上で `bwrap: setting up uid map: Permission denied` または
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` として表面化します。OpenClaw
サービスユーザー向けに報告されたホスト namespace ポリシーを修正し、Gateway を再起動してください。ホスト全体の
`kernel.apparmor_restrict_unprivileged_userns=0` フォールバックよりも、サービスプロセス用のスコープされた AppArmor プロファイルを優先し、
ネストされた `bwrap` を満たすためだけに、より広い Docker コンテナ権限を付与しないでください。
</Note>

## サンドボックス化されたネイティブ実行

安定版のデフォルトはフェイルクローズです。有効な OpenClaw サンドボックス化は、それがなければ Codex アプリサーバー
ホストから実行される Codex ネイティブ実行サーフェスを無効にします。Codex のリモート環境サポートを OpenClaw のサンドボックスバックエンドで試したい場合にのみ、
`appServer.experimental.sandboxExecServer: true` を使用してください。
このプレビュー経路には Codex アプリサーバー 0.132.0 以降が必要です。

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

このフラグがオンで、現在の OpenClaw セッションがサンドボックス化されている場合、OpenClaw はアクティブなサンドボックスを backing とする local loopback exec-server を起動し、
Codex アプリサーバーに登録し、その OpenClaw 所有の環境で Codex スレッドとターンを開始します。アプリサーバーが環境を登録できない場合、
実行はホスト実行に黙ってフォールバックせずにフェイルクローズします。

このプレビュー経路はローカル専用です。リモート WebSocket アプリサーバーは、同じホスト上で実行されていない限り
loopback exec-server に到達できないため、OpenClaw はその組み合わせを拒否します。

## 認証と環境分離

デフォルトのエージェント別 home では、認証は次の順序で選択されます。

1. エージェント用の明示的な OpenClaw Codex 認証プロファイル。
2. そのエージェントの Codex home にあるアプリサーバーの既存アカウント。
3. ローカル stdio アプリサーバー起動の場合のみ、アプリサーバーアカウントが存在せず、OpenAI 認証が
   まだ必要なときに、`CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイル（OAuth または
token credential type）を検出すると、生成された Codex 子プロセスから `CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、Gateway レベルの API キーを embeddings や直接の OpenAI models に利用可能なままにしつつ、
ネイティブ Codex アプリサーバーターンが誤って API 課金されることを防ぎます。

明示的な Codex API-key プロファイルとローカル stdio env-key フォールバックは、
継承された子プロセス env ではなくアプリサーバーログインを使用します。WebSocket アプリサーバー
接続は Gateway env API-key フォールバックを受け取りません。明示的な認証
プロファイル、またはリモートアプリサーバー自身のアカウントを使用してください。

stdio アプリサーバー起動は、デフォルトで OpenClaw のプロセス環境を継承します。
OpenClaw は Codex アプリサーバーアカウントブリッジを所有し、`CODEX_HOME` をそのエージェントの OpenClaw state 配下のエージェント別ディレクトリに設定します。これにより、Codex
config、accounts、Plugin cache/data、および thread state は、オペレーター個人の `~/.codex` home から漏れ込むのではなく、OpenClaw
エージェントにスコープされます。

ネイティブ Codex state を Codex Desktop および CLI と共有するには、`appServer.homeScope: "user"` を設定します。このローカル stdio 専用モードは、設定されている場合は `$CODEX_HOME` を使用し、
そうでなければ `~/.codex` を使用します。これにはネイティブ auth、config、plugins、および threads が含まれます。
OpenClaw はアプリサーバー向けの認証プロファイルブリッジをスキップします。検証済みの所有者ターンでは、
`codex_threads` を使ってそれらの threads を一覧表示（任意の `search` フィルター付き）、
読み取り、fork、名前変更、アーカイブ、およびアーカイブ解除できます。OpenClaw で続行する前に thread を fork してください。独立した Codex プロセスは、
同じ thread に対する同時 writer を調整しません。

OpenClaw は通常のローカルアプリサーバー起動で `HOME` を書き換えません。
`openclaw`、`gh`、`git`、cloud CLIs、シェル
コマンドなどの Codex-run サブプロセスは通常のプロセス home を参照し、user-home config と
tokens を見つけられます。Codex は `$HOME/.agents/skills` と
`$HOME/.agents/plugins/marketplace.json` も検出する場合があります。その `.agents` 検出は
意図的にオペレーター home と共有され、分離された
`~/.codex` state とは別です。

デフォルトのエージェントスコープでは、OpenClaw plugins と OpenClaw skill snapshots は
引き続き OpenClaw 自身の Plugin レジストリと skill loader を通じて流れます。個人用の
Codex `~/.codex` assets は流れません。分離された OpenClaw
エージェントの一部にすべき有用な Codex CLI Skills または
plugins が Codex home にある場合は、明示的に棚卸ししてください。

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

デプロイに追加の環境分離が必要な場合は、それらの変数を
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

`appServer.clearEnv` は、生成された Codex アプリサーバー子プロセスにのみ影響します。
OpenClaw はローカル起動の正規化中に、このリストから `CODEX_HOME` と `HOME` を削除します。
`CODEX_HOME` は選択されたエージェントまたはユーザースコープを指したままになり、
`HOME` はサブプロセスが通常の user-home state を使えるように継承されたままになります。

## 動的ツール

Codex 動的ツールはデフォルトで `searchable` loading になり、
`openclaw` namespace の下で `deferLoading: true` として公開されます。OpenClaw は、
Codex ネイティブの workspace 操作や Codex 自身の
tool-search サーフェスと重複する動的ツールを公開しません。

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`
- `tool_call`
- `tool_describe`
- `tool_search`
- `tool_search_code`

messaging、media、Cron、browser、nodes、Gateway、`heartbeat_respond`、`web_search` など、
残りのほとんどの OpenClaw 連携ツールは、その namespace の下で Codex tool search を通じて利用できます。これにより初期モデル
コンテキストを小さく保てます。少数のツールは `codexDynamicToolsLoading` に関係なく直接呼び出し可能なままです。これは Codex tool search が利用できない場合や、
connector-only の universe に解決される場合があるためです。`agents_list`、`sessions_spawn`、および
`sessions_yield` です。developer instructions は通常の Codex subagents を Codex-native subagent 作業向けのネイティブ
`spawn_agent` に引き続き誘導します。一方で
`sessions_spawn` は、明示的な OpenClaw または ACP delegation のために利用可能なままです。
message-tool-only source replies も、turn-control contract であるため direct のままです。

遅延された動的ツールを検索できないカスタム Codex アプリサーバーに接続する場合、または
完全なツールペイロードをデバッグする場合にのみ、`codexDynamicToolsLoading: "direct"` を設定してください。

## タイムアウト

OpenClaw 所有の動的ツール呼び出しは、
`appServer.requestTimeoutMs` とは独立して制限されます。各 Codex `item/tool/call` リクエストは、
次の順序で最初に利用可能なタイムアウトを使用します。

- 正の per-call `timeoutMs` 引数。
- `image_generate` では、`agents.defaults.imageGenerationModel.timeoutMs`。
- 設定済みタイムアウトがない `image_generate` では、120 秒の
  image-generation デフォルト。
- media-understanding `image` ツールでは、`tools.media.image.timeoutSeconds` を
  ミリ秒に変換した値、または 60 秒の media デフォルト。image
  understanding では、これはリクエスト自体に適用され、以前の準備作業によって短縮されません。
- `message` ツールでは、固定の 120 秒デフォルト。
- 90 秒の dynamic-tool デフォルト。

この watchdog は外側の動的 `item/tool/call` 予算です。Provider 固有の
リクエストタイムアウトはその呼び出しの内側で実行され、独自のタイムアウトセマンティクスを維持します。
動的ツール予算は 600000 ms に上限設定されます。タイムアウト時、OpenClaw はサポートされている場合にツールシグナルを中止し、
失敗した dynamic-tool レスポンスを Codex に返すことで、セッションを
`processing` のままにせずターンを続行できるようにします。

Codex がターンを受け付けた後、および OpenClaw がターンスコープの
アプリサーバーリクエストに応答した後、ハーネスは Codex が現在のターンで進捗し、
最終的にネイティブターンを `turn/completed` で終了することを期待します。
アプリサーバーが `appServer.turnCompletionIdleTimeoutMs` の間沈黙した場合、
OpenClaw はベストエフォートで Codex ターンに割り込み、診断用タイムアウトを記録し、
OpenClaw セッションレーンを解放して、後続のチャットメッセージが古いネイティブターンの後ろに
キューされないようにします。

同じターンのほとんどの非終端通知は、その短いウォッチドッグを解除します。
Codex がそのターンがまだ生きていることを証明したためです。ツール引き渡しでは、
より長いツール後アイドル予算を使用します。OpenClaw が `item/tool/call` 応答を返した後、
`commandExecution` などのネイティブツール項目が完了した後、生の
`custom_tool_call_output` 完了後、およびツール後の生アシスタント進捗、
生推論完了、または推論進捗の後です。このガードは、設定されている場合は
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` を使用し、
それ以外の場合は既定で 5 分になります。同じツール後予算は、Codex が次の現在ターンイベントを
発行する前の無音の合成ウィンドウについても、進捗ウォッチドッグを延長します。推論完了、
commentary `agentMessage` 完了、およびツール前の生推論またはアシスタント進捗は、
自動の最終返信が続く可能性があるため、セッションレーンをすぐに解放する代わりに、
進捗後返信ガードを使用します。最終/非 commentary の完了済み `agentMessage` 項目と、
ツール前の生アシスタント完了だけが、アシスタント出力解放を作動させます。その後 Codex が
`turn/completed` なしに沈黙した場合、OpenClaw はベストエフォートでネイティブターンに割り込み、
セッションレーンを解放します。アシスタント、ツール、アクティブ項目、または副作用の証拠がない
ターン完了アイドルタイムアウトを含む、再生安全な stdio アプリサーバー失敗は、
新しいアプリサーバー試行で 1 回再試行されます。安全でないタイムアウトでも、
停止したアプリサーバークライアントを退役させ、OpenClaw セッションレーンを解放します。
また、自動的に再生する代わりに、古いネイティブスレッドバインディングをクリアします。
完了監視タイムアウトは Codex 固有のタイムアウト文を表示します。再生安全なケースでは応答が
不完全な可能性があると伝え、安全でないケースでは再試行前に現在の状態を確認するようユーザーに
伝えます。公開タイムアウト診断には、最後のアプリサーバー通知メソッド、生アシスタント応答項目の
id/type/role、アクティブなリクエスト/項目数、作動中の監視状態などの構造化フィールドが
含まれます。最後の通知が生アシスタント応答項目である場合、制限付きのアシスタントテキストの
プレビューも含まれます。生プロンプトやツール内容は含まれません。

## モデル探索

既定では、Codex Plugin は利用可能なモデルをアプリサーバーに問い合わせます。モデルの
利用可否は Codex アプリサーバーが所有するため、OpenClaw がバンドルされた
`@openai/codex` バージョンをアップグレードした場合や、デプロイメントが
`appServer.command` を別の Codex バイナリに向けた場合、一覧が変わることがあります。
利用可否はアカウントスコープになることもあります。実行中の Gateway で `/codex models` を
使用して、そのハーネスとアカウントのライブカタログを確認してください。

探索が失敗またはタイムアウトした場合、OpenClaw はバンドルされたフォールバックカタログを使用します。

| モデル id       | 表示名 | 推論エフォート        |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
現在バンドルされているハーネスは `@openai/codex` `0.142.5` です。そのバンドル済み
アプリサーバーに対する `model/list` プローブは、フォールバックカタログに加えて、
次の公開ピッカー行を返しました。

| モデル id              | 入力モダリティ | 推論エフォート        |
| --------------------- | ---------------- | ------------------------ |
| `gpt-5.5`             | text, image      | low, medium, high, xhigh |
| `gpt-5.4`             | text, image      | low, medium, high, xhigh |
| `gpt-5.4-mini`        | text, image      | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | text             | low, medium, high, xhigh |

ライブピッカー行はアカウントスコープであり、アカウント、Codex カタログ、またはバンドル版に
よって変わることがあります。ある時点の表に依存するのではなく、現在の一覧には
`/codex models` を実行してください。内部または特殊なフロー向けに、通常のモデルピッカーの
選択肢ではない非表示モデルがアプリサーバーカタログに現れることもあります。
</Note>

`plugins.entries.codex.config.discovery` で探索を調整します。

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

起動時に Codex のプローブを避け、フォールバックカタログだけを使用したい場合は、
探索を無効にします。

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

## ワークスペースのブートストラップファイル

Codex はネイティブのプロジェクトドキュメント探索を通じて `AGENTS.md` 自体を処理します。
OpenClaw は合成 Codex プロジェクトドキュメントファイルを書き込まず、ペルソナファイルのために
Codex のフォールバックファイル名にも依存しません。Codex のフォールバックは `AGENTS.md` が
存在しない場合にのみ適用されるためです。

OpenClaw ワークスペースとの同等性のため、Codex ハーネスは他のブートストラップファイルを
開発者指示として転送しますが、同一ではありません。

- `TOOLS.md` は **継承された** Codex 開発者指示として転送されるため、
  ターン中に生成されたネイティブ Codex サブエージェントにも見えます。
- `SOUL.md`、`IDENTITY.md`、`USER.md` は **ターンスコープの**
  コラボレーション指示として転送されます。ネイティブ Codex サブエージェントはそれらを
  継承しないため、サブエージェントのターンが親エージェントのペルソナとユーザープロファイルを
  取り込まないようになります。
- コンパクトに読み込まれた OpenClaw Skills 一覧も、ターンスコープのコラボレーション
  開発者指示として転送されるため、ネイティブ Codex サブエージェントはこれも継承しません。
- `HEARTBEAT.md` の内容は注入されません。Heartbeat ターンでは、ファイルが存在し、
  空でない場合にそのファイルを読むためのコラボレーションモードのポインターを受け取ります。
- 構成済みエージェントワークスペースの `MEMORY.md` 内容は、そのワークスペースでメモリツールが
  利用可能な場合、ネイティブ Codex ターン入力には貼り付けられません。存在する場合、ハーネスは
  小さなワークスペースメモリポインターをターンスコープのコラボレーション開発者指示に追加し、
  永続メモリが関連する場合、Codex は `memory_search` または `memory_get` を使用する必要があります。
  ツールが無効、メモリ検索が利用不可、またはアクティブなワークスペースがエージェントメモリ
  ワークスペースと異なる場合、`MEMORY.md` は代わりに通常の制限付きターンコンテキストパスを
  使用します。
- `BOOTSTRAP.md` が存在する場合、OpenClaw ターン入力参照コンテキストとして転送されます。

## 環境オーバーライド

環境オーバーライドはローカルテスト用に引き続き利用できます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` は、`appServer.command` が未設定の場合に
管理対象バイナリをバイパスします。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、
一回限りのローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。
構成は、Plugin の挙動を Codex ハーネス設定の残りと同じレビュー済みファイル内に保つため、
再現可能なデプロイメントでは推奨されます。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins)
- [Codex Computer Use](/ja-JP/plugins/codex-computer-use)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [構成リファレンス](/ja-JP/gateway/configuration-reference)
