---
read_when:
    - Codex ハーネスのすべての設定フィールドが必要です
    - app-server のトランスポート、認証、検出、またはタイムアウト動作を変更している
    - Codex ハーネスの起動、モデル検出、または環境分離をデバッグしている
summary: Codex ハーネスの構成、認証、検出、アプリサーバーのリファレンス
title: Codex ハーネスリファレンス
x-i18n:
    generated_at: "2026-07-01T07:51:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02dd72f9d85d2ea5fa45533a402d640786f17bdbe2242b7c1b8cd99405561a25
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

このリファレンスでは、同梱の `codex`
Plugin の詳細な設定を扱います。セットアップとルーティングの判断については、
[Codex harness](/ja-JP/plugins/codex-harness) から始めてください。

## Plugin 設定サーフェス

すべての Codex harness 設定は `plugins.entries.codex.config` の下にあります。

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

サポートされるトップレベルフィールド:

| フィールド                 | デフォルト               | 意味                                                                                                                                      |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 有効                     | Codex app-server `model/list` のモデル検出設定。                                                                                          |
| `appServer`                | managed stdio app-server | トランスポート、コマンド、認証、承認、サンドボックス、タイムアウトの設定。                                                               |
| `codexDynamicToolsLoading` | `"searchable"`           | `"direct"` を使用すると、OpenClaw の動的ツールを初期 Codex ツールコンテキストに直接配置します。                                           |
| `codexDynamicToolsExclude` | `[]`                     | Codex app-server ターンから除外する追加の OpenClaw 動的ツール名。                                                                         |
| `codexPlugins`             | 無効                     | 移行済みのソースインストール型 curated plugins 向けのネイティブ Codex plugin/app サポート。[Native Codex plugins](/ja-JP/plugins/codex-native-plugins) を参照してください。 |
| `computerUse`              | 無効                     | Codex Computer Use のセットアップ。[Codex Computer Use](/ja-JP/plugins/codex-computer-use) を参照してください。                                 |

## App-server トランスポート

デフォルトでは、OpenClaw は同梱の
Plugin とともに出荷される管理対象 Codex バイナリを起動します:

```bash
codex app-server --listen stdio://
```

これにより、app-server のバージョンは、ローカルに別途インストールされている可能性のある Codex CLI ではなく、同梱の `codex` Plugin に結び付けられます。別の実行可能ファイルを実行したいと意図している場合にのみ、
`appServer.command` を設定してください。

すでに実行中の app-server には、WebSocket トランスポートを使用します:

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

サポートされる `appServer` フィールド:

| フィールド                                    | デフォルト                                           | 意味                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` は Codex を起動し、`"websocket"` は `url` に接続します。                                                                                                                                                                                                                                                                                                                             |
| `command`                                     | 管理対象の Codex バイナリ                             | stdio transport の実行可能ファイル。管理対象バイナリを使用する場合は未設定のままにします。                                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio transport の引数。                                                                                                                                                                                                                                                                                                                                                                       |
| `url`                                         | 未設定                                                | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                     |
| `authToken`                                   | 未設定                                                | WebSocket transport の Bearer トークン。リテラル文字列、または `${CODEX_APP_SERVER_TOKEN}` などの SecretInput を受け付けます。                                                                                                                                                                                                                                                                 |
| `headers`                                     | `{}`                                                   | 追加の WebSocket ヘッダー。ヘッダー値はリテラル文字列、または `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"` などの SecretInput 値を受け付けます。                                                                                                                                                                                                                           |
| `clearEnv`                                    | `[]`                                                   | OpenClaw が継承環境を構築した後、起動された stdio app-server プロセスから削除される追加の環境変数名。                                                                                                                                                                                                                                                                                         |
| `remoteWorkspaceRoot`                         | 未設定                                                | リモート Codex app-server ワークスペースルート。設定すると、OpenClaw は解決済みの OpenClaw ワークスペースからローカルワークスペースルートを推定し、このリモートルート配下で現在の cwd サフィックスを保持し、最終的な app-server cwd だけを Codex に送信します。cwd が解決済みの OpenClaw ワークスペースルート外にある場合、OpenClaw は Gateway ローカルパスをリモート app-server に送信せずフェイルクローズします。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server コントロールプレーン呼び出しのタイムアウト。                                                                                                                                                                                                                                                                                                                                       |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex がターンを受け付けた後、またはターンスコープの app-server リクエスト後に、OpenClaw が `turn/completed` を待機する間の静かな時間枠。                                                                                                                                                                                                                                                     |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw が `turn/completed` を待機する間、ツールへのハンドオフ、ネイティブツールの完了、ツール後の raw assistant 進行、raw reasoning 完了、または reasoning 進行の後に使用される完了アイドルおよび進行ガード。ツール後の合成が最終 assistant リリース予算より長く正当に静かな状態を保てる、信頼済みまたは重いワークロードに使用します。                                |
| `mode`                                        | ローカル Codex 要件で YOLO が許可されない場合を除き `"yolo"` | YOLO または guardian レビュー付き実行のプリセット。                                                                                                                                                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` または許可された guardian 承認ポリシー      | スレッド開始、再開、ターンに送信されるネイティブ Codex 承認ポリシー。                                                                                                                                                                                                                                                                                                                         |
| `sandbox`                                     | `"danger-full-access"` または許可された guardian sandbox | スレッド開始および再開に送信されるネイティブ Codex sandbox モード。アクティブな OpenClaw sandboxes は `danger-full-access` ターンを Codex `workspace-write` に狭めます。ターンのネットワークフラグは OpenClaw sandbox egress に従います。                                                                                                                                                   |
| `approvalsReviewer`                           | `"user"` または許可された guardian reviewer           | 許可されている場合に Codex がネイティブ承認プロンプトをレビューできるようにするには、`"auto_review"` を使用します。                                                                                                                                                                                                                                                                           |
| `defaultWorkspaceDir`                         | 現在のプロセスディレクトリ                            | `--cwd` が省略されたときに `/codex bind` が使用するワークスペース。                                                                                                                                                                                                                                                                                                                            |
| `serviceTier`                                 | 未設定                                                | 任意の Codex app-server サービス階層。`"priority"` は fast-mode ルーティングを有効にし、`"flex"` は flex 処理を要求し、`null` は上書きをクリアします。レガシーの `"fast"` は `"priority"` として受け付けられます。                                                                                                                                                                             |
| `networkProxy`                                | 無効                                                  | app-server コマンドで Codex 権限プロファイルのネットワークにオプトインします。OpenClaw は選択された `permissions.<profile>.network` 設定を定義し、`sandbox` を送信する代わりに `default_permissions` でそれを選択します。                                                                                                                                                                  |
| `experimental.sandboxExecServer`              | `false`                                                | Codex app-server 0.132.0 以降に OpenClaw sandbox バックの Codex 環境を登録し、ネイティブ Codex 実行をアクティブな OpenClaw sandbox 内で実行できるようにするプレビューのオプトイン。                                                                                                                                                                                                            |

`appServer.networkProxy` は Codex sandbox
契約を変更するため明示的です。有効にすると、OpenClaw は Codex スレッド設定で
`features.network_proxy.enabled` と `default_permissions` も設定し、生成された権限
プロファイルが Codex 管理ネットワークを開始できるようにします。デフォルトでは、OpenClaw は
プロファイル本文から衝突耐性のある `openclaw-network-<fingerprint>` プロファイル名を生成します。
安定したローカル名が必要な場合にのみ `profileName` を使用してください。

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

通常の app-server ランタイムが `danger-full-access` になる場合、
`networkProxy` を有効にすると、生成された
権限プロファイルにはワークスペース形式のファイルシステムアクセスが使用されます。Codex 管理のネットワーク適用は sandbox 化されたネットワークであるため、
full-access プロファイルでは送信トラフィックを保護できません。

Plugin は古い、またはバージョンなしの app-server ハンドシェイクをブロックします。Codex app-server
は安定版バージョン `0.125.0` 以降を報告する必要があります。

OpenClaw は、非ループバックの WebSocket アプリサーバー URL をリモートとして扱い、
`appServer.authToken` または `Authorization` ヘッダーによる、アイデンティティを伴う WebSocket 認証を要求します。`appServer.authToken` と各 `appServer.headers.*`
値は SecretInput にできます。secrets ランタイムは、OpenClaw がアプリサーバー起動オプションを構築する前に SecretRef と env
省略記法を解決し、未解決の構造化 SecretRef はトークンやヘッダーが送信される前に失敗します。ネイティブ Codex
plugins が構成されている場合、OpenClaw は接続済みアプリサーバーの plugin コントロールプレーンを使ってそれらの plugins をインストールまたは更新し、その後アプリインベントリを更新して、plugin 所有のアプリが Codex スレッドから見えるようにします。`app/list` は引き続き
権威あるインベントリおよびメタデータソースですが、一覧にあるアクセス可能な
アプリについて、Codex が現在それを無効と示している場合でも
`thread/start` が `config.apps[appId].enabled = true` を送信するかどうかは OpenClaw ポリシーが決定します。不明または欠落しているアプリ ID は引き続きフェイルクローズです。このパスは `plugin/install`
経由で marketplace plugins を有効化し、インベントリを更新するだけです。OpenClaw が管理する plugin インストールとアプリインベントリ更新を受け入れることを信頼できるリモートアプリサーバーにのみ OpenClaw を接続してください。

## 承認とサンドボックスモード

ローカル stdio アプリサーバーセッションのデフォルトは YOLO モードです:
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"`。この信頼済みローカルオペレーターの姿勢により、
無人の OpenClaw ターンと Heartbeat は、誰も応答できないネイティブ承認プロンプトなしで進行できます。

Codex のローカルシステム要件ファイルが、暗黙の YOLO 承認、
レビュアー、またはサンドボックス値を許可しない場合、OpenClaw は暗黙のデフォルトを代わりに guardian として扱い、許可された guardian 権限を選択します。`tools.exec.mode: "auto"`
も guardian レビュー付き Codex 承認を強制し、危険な従来の
`approvalPolicy: "never"` または `sandbox: "danger-full-access"` の上書きを保持しません。意図的に承認なしの姿勢にするには `tools.exec.mode: "full"` を設定してください。同じ要件ファイル内のホスト名一致
`[[remote_sandbox_config]]` エントリは、サンドボックスのデフォルト決定で尊重されます。

Codex の guardian レビュー付き承認には `appServer.mode: "guardian"` を設定します:

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

`guardian` プリセットは、それらの値が許可されている場合、
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、および `sandbox: "workspace-write"` に展開されます。個別のポリシーフィールドは `mode` を上書きします。古い
`guardian_subagent` レビュアー値は互換エイリアスとして引き続き受け入れられますが、
新しい構成では `auto_review` を使用してください。

OpenClaw サンドボックスが有効な場合でも、ローカル Codex アプリサーバープロセスは
Gateway ホスト上で実行されます。そのため OpenClaw は、そのターンでは Codex ネイティブ Code Mode、
ユーザー MCP サーバー、およびアプリに支えられた plugin 実行を無効化し、Codex ホスト側サンドボックス化を OpenClaw サンドボックスバックエンドと同等とは扱いません。通常の exec/process ツールが利用可能な場合、シェルアクセスは `sandbox_exec` や `sandbox_process` などの OpenClaw サンドボックスに支えられた動的ツールを通じて公開されます。

Ubuntu/AppArmor ホストでは、アクティブな OpenClaw サンドボックス化なしでネイティブ Codex
`workspace-write` を意図的に実行すると、シェルコマンドの開始前に Codex bwrap が `workspace-write` で失敗することがあります。
`bwrap: setting up uid map: Permission denied` または
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` が表示された場合は、
より広い Docker コンテナ権限を付与するのではなく、`openclaw doctor` を実行し、OpenClaw
サービスユーザーについて報告されたホスト namespace ポリシーを修正してください。サービスプロセスには
スコープを絞った AppArmor プロファイルを推奨します。
`kernel.apparmor_restrict_unprivileged_userns=0` フォールバックはホスト全体に及び、
セキュリティ上のトレードオフがあります。

## サンドボックス化されたネイティブ実行

安定したデフォルトはフェイルクローズです。アクティブな OpenClaw サンドボックス化は、そうでなければ Codex アプリサーバー
ホストから実行される Codex ネイティブ実行面を無効化します。OpenClaw のサンドボックスバックエンドで Codex のリモート環境サポートを試したい場合にのみ、`appServer.experimental.sandboxExecServer: true` を使用してください。この
プレビューパスには Codex アプリサーバー 0.132.0 以降が必要です。

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

このフラグがオンで、現在の OpenClaw セッションがサンドボックス化されている場合、OpenClaw は
アクティブなサンドボックスに支えられた local loopback exec-server を起動し、それを Codex アプリサーバーに登録して、
その OpenClaw 所有環境で Codex スレッドとターンを開始します。アプリサーバーが環境を登録できない場合、
ホスト実行へ黙ってフォールバックするのではなく、実行はフェイルクローズします。

このプレビューパスはローカル専用です。リモート WebSocket アプリサーバーは、同じホストで実行されていない限り
loopback exec-server に到達できないため、OpenClaw はその組み合わせを拒否します。

## 認証と環境分離

認証は次の順序で選択されます:

1. エージェントの明示的な OpenClaw Codex 認証プロファイル。
2. そのエージェントの Codex home にあるアプリサーバーの既存アカウント。
3. ローカル stdio アプリサーバー起動の場合のみ、アプリサーバーアカウントが存在せず、OpenAI 認証が
   まだ必要なときの `CODEX_API_KEY`、次に `OPENAI_API_KEY`。

OpenClaw は ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出すると、生成された Codex 子プロセスから
`CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、Gateway レベルの API キーは embeddings や直接の OpenAI models に利用可能なまま、ネイティブ Codex アプリサーバーのターンが誤って API 経由で課金されることを防ぎます。

明示的な Codex API キープロファイルとローカル stdio env キーフォールバックは、継承された子プロセス env ではなくアプリサーバーログインを使用します。WebSocket アプリサーバー接続は Gateway env API キーフォールバックを受け取りません。明示的な認証プロファイルまたは
リモートアプリサーバー自身のアカウントを使用してください。

stdio アプリサーバー起動は、デフォルトで OpenClaw のプロセス環境を継承します。
OpenClaw は Codex アプリサーバーアカウントブリッジを所有し、`CODEX_HOME` をそのエージェントの OpenClaw state 配下にあるエージェント単位のディレクトリに設定します。これにより Codex の構成、
アカウント、plugin キャッシュ/データ、スレッド状態は、オペレーター個人の `~/.codex` home から漏れ込むのではなく、OpenClaw エージェントにスコープされます。

OpenClaw は通常のローカルアプリサーバー起動では `HOME` を書き換えません。`openclaw`、`gh`、`git`、クラウド CLI、シェルコマンドなどの Codex 実行サブプロセスは
通常のプロセス home を参照し、ユーザー home の構成とトークンを見つけられます。Codex は
`$HOME/.agents/skills` と `$HOME/.agents/plugins/marketplace.json` も検出することがあります。
その `.agents` 検出はオペレーター home と意図的に共有され、分離された `~/.codex` 状態とは別です。

OpenClaw plugins と OpenClaw skill スナップショットは、引き続き OpenClaw 自身の
plugin レジストリと skill ローダーを通じて流れます。個人の Codex `~/.codex` アセットは流れません。OpenClaw エージェントの一部にすべき有用な Codex CLI skills または plugins が Codex home にある場合は、
それらを明示的にインベントリしてください:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

デプロイメントに追加の環境分離が必要な場合は、それらの変数を
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

`appServer.clearEnv` は、生成された Codex アプリサーバー子プロセスにのみ影響します。
OpenClaw はローカル起動の正規化中にこのリストから `CODEX_HOME` と `HOME` を削除します:
`CODEX_HOME` はエージェント単位のままで、`HOME` はサブプロセスが通常のユーザー home 状態を使用できるよう継承されたままです。

## 動的ツール

Codex 動的ツールのデフォルトは `searchable` ロードです。OpenClaw は
Codex ネイティブのワークスペース操作と重複する動的ツールを公開しません:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

メッセージング、メディア、cron、
ブラウザー、ノード、Gateway、`heartbeat_respond`、`web_search` など、残りのほとんどの OpenClaw 統合ツールは、
`openclaw` namespace の下で Codex tool search を通じて利用できます。これにより初期
model context を小さく保てます。`sessions_yield` と message-tool-only の source replies は
ターン制御契約であるため direct のままです。`sessions_spawn` は searchable のままであるため、
Codex のネイティブ `spawn_agent` が主要な Codex サブエージェント面であり続ける一方で、明示的な OpenClaw または ACP 委任も
`openclaw` 動的ツール namespace を通じて引き続き利用できます。

遅延動的ツールを検索できないカスタム Codex
アプリサーバーへ接続する場合、または完全な
ツールペイロードをデバッグする場合にのみ、`codexDynamicToolsLoading: "direct"` を設定してください。

## タイムアウト

OpenClaw 所有の動的ツール呼び出しは、
`appServer.requestTimeoutMs` とは独立して制限されます。各 Codex `item/tool/call` リクエストは、次の順序で最初に利用可能なタイムアウトを使用します:

- 正の呼び出し単位 `timeoutMs` 引数。
- `image_generate` では、`agents.defaults.imageGenerationModel.timeoutMs`。
- 構成済みタイムアウトがない `image_generate` では、120 秒の
  画像生成デフォルト。
- メディア理解の `image` ツールでは、`tools.media.image.timeoutSeconds`
  をミリ秒に変換した値、または 60 秒のメディアデフォルト。画像
  理解では、これはリクエスト自体に適用され、事前の準備作業によって
  短縮されません。
- 90 秒の動的ツールデフォルト。

この watchdog は外側の動的 `item/tool/call` 予算です。プロバイダー固有の
リクエストタイムアウトはその呼び出しの内側で実行され、独自のタイムアウトセマンティクスを保持します。
動的ツール予算は 600000 ms で上限が設定されます。タイムアウト時、OpenClaw は
サポートされている場合はツールシグナルを中止し、失敗した動的ツールレスポンスを Codex に返して、
セッションを `processing` のまま残すのではなくターンを継続できるようにします。

Codex がターンを受け入れた後、および OpenClaw がターンスコープの
アプリサーバーリクエストに応答した後、harness は Codex が現在のターンを進め、最終的に
`turn/completed` でネイティブターンを完了することを期待します。アプリサーバーが
`appServer.turnCompletionIdleTimeoutMs` の間沈黙した場合、OpenClaw はベストエフォートで
Codex ターンに割り込み、診断タイムアウトを記録し、OpenClaw セッションレーンを解放して、
後続のチャットメッセージが古いネイティブターンの後ろにキューされないようにします。

同じターンのほとんどの非終端通知は、その短いウォッチドッグを解除します。
Codex がそのターンがまだ生きていることを証明したためです。ツールの引き渡しには、より長い
ツール後のアイドル予算を使用します。OpenClaw が `item/tool/call` レスポンスを返した後、
`commandExecution` などのネイティブツール項目が完了した後、生の
`custom_tool_call_output` 完了の後、そしてツール後の生アシスタント
進行状況、生 reasoning 完了、または reasoning 進行状況の後です。このガードは、設定されている場合は
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` を使用し、
それ以外の場合はデフォルトで 5 分になります。同じツール後予算は、Codex が次の
現在ターンイベントを発行する前の無音の合成ウィンドウに対する進行状況ウォッチドッグも延長します。Reasoning 完了、commentary
`agentMessage` 完了、およびツール前の生 reasoning またはアシスタント進行状況の後には、
自動的な最終返信が続く可能性があるため、セッションレーンを即座に解放するのではなく、
進行後返信ガードを使用します。最終/非 commentary の完了済み `agentMessage` 項目と、
ツール前の生アシスタント完了だけが、アシスタント出力の解放を作動させます。Codex がその後
`turn/completed` なしで沈黙した場合、OpenClaw はベストエフォートでネイティブターンを中断し、
セッションレーンを解放します。アシスタント、ツール、アクティブ項目、または
副作用の証拠がないターン完了アイドルタイムアウトを含む、リプレイセーフな stdio app-server 障害は、
新しい app-server 試行で 1 回だけ再試行されます。安全でないタイムアウトでも、停止した app-server クライアントは終了され、
OpenClaw セッションレーンが解放されます。また、自動的にリプレイされるのではなく、
古いネイティブスレッドのバインディングもクリアされます。完了監視タイムアウトでは、Codex 固有のタイムアウト文言が表示されます。
リプレイセーフなケースではレスポンスが不完全な可能性があると伝え、安全でないケースでは
再試行する前に現在の状態を確認するようユーザーに伝えます。公開タイムアウト診断には、
最後の app-server 通知メソッド、生アシスタントレスポンス項目の id/type/role、
アクティブなリクエスト/項目数、作動中の監視状態などの構造化フィールドが含まれます。
最後の通知が生アシスタントレスポンス項目の場合は、範囲を制限したアシスタントテキストのプレビューも含まれます。
生プロンプトやツール内容は含まれません。

## モデル検出

デフォルトでは、Codex Plugin は app-server に利用可能なモデルを問い合わせます。モデルの
可用性は Codex app-server が所有するため、OpenClaw がバンドルされた `@openai/codex` バージョンを
アップグレードしたとき、またはデプロイが `appServer.command` を別の Codex バイナリに向けたときに、
リストが変わる可能性があります。可用性はアカウント単位の場合もあります。実行中の Gateway で
`/codex models` を使用すると、そのハーネスとアカウントのライブカタログを確認できます。

検出が失敗またはタイムアウトした場合、OpenClaw は次のバンドル済みフォールバックカタログを使用します。

- GPT-5.5
- GPT-5.4 mini

現在のバンドル済みハーネスは `@openai/codex` `0.142.4` です。GPT-5.6 が有効なワークスペースで、
そのバンドル済み app-server に対して `model/list` プローブを実行したところ、次の公開ピッカー行が返されました。

| モデル ID              | 入力モダリティ | Reasoning effort                    |
| --------------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`         | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | text, image      | low, medium, high, xhigh, max        |
| `gpt-5.5`             | text, image      | low, medium, high, xhigh             |
| `gpt-5.4`             | text, image      | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | text, image      | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | text, image      | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | text             | low, medium, high, xhigh             |

限定プレビュー中の GPT-5.6 アクセスはアカウント単位です。`max` はモデルの
reasoning effort です。`ultra` は別個の Codex マルチエージェントオーケストレーションメタデータであり、
標準の OpenAI reasoning effort ではありません。

非表示モデルは、内部または特殊なフロー向けに app-server カタログから返される場合がありますが、
通常のモデルピッカーの選択肢ではありません。

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

起動時に Codex のプローブを避け、フォールバックカタログだけを使用したい場合は、検出を無効にします。

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

Codex はネイティブのプロジェクトドキュメント検出を通じて `AGENTS.md` 自体を処理します。OpenClaw は、
合成された Codex プロジェクトドキュメントファイルを書き込まず、ペルソナファイルについて Codex のフォールバック
ファイル名にも依存しません。Codex のフォールバックは `AGENTS.md` が存在しない場合にのみ適用されるためです。

OpenClaw ワークスペースとの同等性のため、Codex ハーネスはその他のブートストラップ
ファイルを解決します。`SOUL.md`、`IDENTITY.md`、`TOOLS.md`、`USER.md` は、
アクティブなエージェント、利用可能なワークスペースガイダンス、ユーザープロファイルを定義するため、
OpenClaw Codex developer instructions として転送されます。コンパクトな OpenClaw Skills
リストは、ターンスコープのコラボレーション developer instructions として転送されます。
`HEARTBEAT.md` の内容は注入されません。Heartbeat ターンでは、ファイルが存在し、空でない場合にそのファイルを読むための
コラボレーションモードポインターを受け取ります。設定されたエージェントワークスペースの `MEMORY.md` 内容は、
そのワークスペースでメモリツールが利用可能な場合、ネイティブ Codex ターン入力には貼り付けられません。
存在する場合、ハーネスは小さなワークスペースメモリポインターをターンスコープのコラボレーション developer instructions に追加し、
永続メモリが関連する場合、Codex は `memory_search` または `memory_get` を使用する必要があります。
ツールが無効、メモリ検索が利用できない、またはアクティブワークスペースがエージェントメモリワークスペースと異なる場合、
`MEMORY.md` は通常の範囲制限付きターンコンテキストパスを使用します。
`BOOTSTRAP.md` が存在する場合は、OpenClaw ターン入力の参照コンテキストとして転送されます。

## 環境オーバーライド

環境オーバーライドは、ローカルテスト用に引き続き利用できます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` は、`appServer.command` が未設定の場合に
管理対象バイナリをバイパスします。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、
一回限りのローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。再現可能なデプロイでは、
Plugin の動作を Codex ハーネス設定の残りと同じレビュー済みファイルに保持できるため、
設定の使用が推奨されます。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins)
- [Codex Computer Use](/ja-JP/plugins/codex-computer-use)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [設定リファレンス](/ja-JP/gateway/configuration-reference)
