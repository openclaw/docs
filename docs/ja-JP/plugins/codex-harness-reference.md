---
read_when:
    - すべての Codex ハーネス設定フィールドが必要です
    - app-server のトランスポート、認証、検出、またはタイムアウト動作を変更している
    - Codex ハーネスの起動、モデル検出、または環境分離をデバッグしている
summary: Codex ハーネスの設定、認証、検出、アプリサーバーのリファレンス
title: Codex ハーネスリファレンス
x-i18n:
    generated_at: "2026-07-04T20:24:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1ffe2404dd35df36a706c098f99b841a9664baf76ee5d712836bb35d9ac78bc
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

このリファレンスでは、バンドルされた `codex`
plugin の詳細な設定について説明します。セットアップとルーティングの判断については、
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
| `codexDynamicToolsLoading` | `"searchable"`           | OpenClaw の動的ツールを初期 Codex ツールコンテキストに直接置くには `"direct"` を使用します。                                              |
| `codexDynamicToolsExclude` | `[]`                     | Codex app-server ターンから除外する追加の OpenClaw 動的ツール名。                                                                         |
| `codexPlugins`             | 無効                     | 移行済みのソースインストール型 curated plugins に対するネイティブ Codex plugin/app サポート。[Native Codex plugins](/ja-JP/plugins/codex-native-plugins) を参照してください。 |
| `computerUse`              | 無効                     | Codex Computer Use のセットアップ。[Codex Computer Use](/ja-JP/plugins/codex-computer-use) を参照してください。                                 |

## App-server トランスポート

デフォルトでは、OpenClaw はバンドルされた
plugin に同梱されている管理対象 Codex バイナリを起動します。

```bash
codex app-server --listen stdio://
```

これにより、app-server のバージョンは、ローカルに別途インストールされている可能性のある Codex CLI ではなく、バンドルされた `codex` plugin に結び付けられます。
意図的に別の実行可能ファイルを実行したい場合にのみ
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

サポートされる `appServer` フィールド:

| フィールド                                    | デフォルト                                             | 意味                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` は Codex を起動します。`"websocket"` は `url` に接続します。                                                                                                                                                                                                                                                                                                                                        |
| `homeScope`                                   | `"agent"`                                              | `"agent"` は OpenClaw エージェントごとに Codex の状態を分離します。`"user"` はネイティブの `$CODEX_HOME` または `~/.codex` を共有し、ネイティブ認証を使用し、所有者のみのスレッド管理を有効にします。ユーザースコープには stdio が必要です。                                                                                                                                                                                               |
| `command`                                     | 管理対象の Codex バイナリ                              | stdio トランスポート用の実行可能ファイル。管理対象バイナリを使用するには未設定のままにします。                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio トランスポート用の引数。                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 未設定                                                 | WebSocket app-server の URL。                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | 未設定                                                 | WebSocket トランスポート用の Bearer トークン。リテラル文字列、または `${CODEX_APP_SERVER_TOKEN}` のような SecretInput を受け付けます。                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | 追加の WebSocket ヘッダー。ヘッダー値は、リテラル文字列または SecretInput 値を受け付けます。例: `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw が継承環境を構築した後、起動された stdio app-server プロセスから削除される追加の環境変数名。                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | 未設定                                                 | リモート Codex app-server のワークスペースルート。設定すると、OpenClaw は解決済みの OpenClaw ワークスペースからローカルワークスペースルートを推論し、このリモートルート配下で現在の cwd サフィックスを保持し、最終的な app-server cwd のみを Codex に送信します。cwd が解決済みの OpenClaw ワークスペースルートの外にある場合、OpenClaw は Gateway ローカルパスをリモート app-server に送信する代わりにフェイルクローズします。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server コントロールプレーン呼び出しのタイムアウト。                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex がターンを受け付けた後、または OpenClaw が `turn/completed` を待機している間のターンスコープの app-server リクエスト後の静かな時間枠。                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw が `turn/completed` を待機している間、ツールへの引き渡し、ネイティブツール完了、ツール後の raw アシスタント進行、raw 推論完了、または推論進行の後に使用される完了アイドルおよび進行ガード。ツール後の合成が、最終アシスタント解放予算より長く正当に静かな状態を保てる、信頼済みまたは高負荷のワークロードに使用します。                                |
| `mode`                                        | ローカルの Codex 要件が YOLO を許可しない場合を除き `"yolo"` | YOLO または guardian レビュー付き実行のプリセット。                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` または許可された guardian 承認ポリシー       | スレッド開始、再開、ターンに送信されるネイティブ Codex 承認ポリシー。                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` または許可された guardian サンドボックス | スレッド開始と再開に送信されるネイティブ Codex サンドボックスモード。アクティブな OpenClaw サンドボックスは、`danger-full-access` ターンを Codex `workspace-write` に狭めます。ターンのネットワークフラグは OpenClaw サンドボックスのエグレスに従います。                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` または許可された guardian レビュー担当者      | 許可されている場合、`"auto_review"` を使用して Codex にネイティブ承認プロンプトをレビューさせます。                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | 現在のプロセスディレクトリ                             | `--cwd` が省略された場合に `/codex bind` が使用するワークスペース。                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | 未設定                                                 | 任意の Codex app-server サービスティア。`"priority"` は高速モードルーティングを有効にし、`"flex"` は flex 処理をリクエストし、`null` は上書きをクリアします。レガシーの `"fast"` は `"priority"` として受け付けられます。                                                                                                                                                                                                 |
| `networkProxy`                                | 無効                                                   | app-server コマンド用に Codex permissions-profile ネットワーキングをオプトインします。OpenClaw は選択された `permissions.<profile>.network` 設定を定義し、`sandbox` を送信する代わりに `default_permissions` でそれを選択します。                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | OpenClaw サンドボックスで裏付けられた Codex 環境を Codex app-server 0.132.0 以降に登録し、ネイティブ Codex 実行をアクティブな OpenClaw サンドボックス内で実行できるようにするプレビューのオプトイン。                                                                                                                                                                                                         |

`appServer.networkProxy` は Codex サンドボックス契約を変更するため、明示的です。
有効にすると、OpenClaw は Codex スレッド設定内の `features.network_proxy.enabled` と
`default_permissions` も設定し、生成された権限プロファイルが Codex 管理ネットワーキングを
開始できるようにします。デフォルトでは、OpenClaw はプロファイル本文から衝突耐性のある
`openclaw-network-<fingerprint>` プロファイル名を生成します。安定したローカル名が必要な場合のみ
`profileName` を使用してください。

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

通常の app-server ランタイムが `danger-full-access` になる場合、`networkProxy` を有効にすると、生成される権限プロファイルにはワークスペース形式のファイルシステムアクセスが使用されます。Codex 管理のネットワーク強制はサンドボックス化されたネットワークであるため、フルアクセスプロファイルでは送信トラフィックを保護できません。

この Plugin は、古い、またはバージョンなしの app-server ハンドシェイクをブロックします。Codex app-server は安定版バージョン `0.125.0` 以降を報告する必要があります。

OpenClaw は、非ループバックの WebSocket app-server URL をリモートとして扱い、`appServer.authToken` または `Authorization` ヘッダーによる ID 付き WebSocket 認証を要求します。`appServer.authToken` と各 `appServer.headers.*` 値には SecretInput を使用できます。secrets ランタイムは、OpenClaw が app-server 起動オプションを構築する前に SecretRefs と env 省略記法を解決し、未解決の構造化 SecretRefs はトークンやヘッダーが送信される前に失敗します。ネイティブ Codex Plugin が構成されている場合、OpenClaw は接続済み app-server の Plugin コントロールプレーンを使用してそれらの Plugin をインストールまたは更新し、その後 app インベントリを更新して、Plugin 所有の app が Codex スレッドに表示されるようにします。`app/list` は引き続き権威あるインベントリとメタデータのソースですが、Codex が現在無効としてマークしている場合でも、一覧にあるアクセス可能な app に対して `thread/start` が `config.apps[appId].enabled = true` を送信するかどうかは OpenClaw ポリシーが決定します。不明または欠落している app ID は引き続きフェイルクローズです。このパスは `plugin/install` 経由でマーケットプレイス Plugin を有効化し、インベントリを更新するだけです。OpenClaw 管理の Plugin インストールと app インベントリ更新を受け入れることを信頼できるリモート app-server にのみ OpenClaw を接続してください。

## 承認とサンドボックスモード

ローカル stdio app-server セッションの既定値は YOLO モードです:
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"`。この信頼されたローカルオペレーター向けの姿勢により、応答する人がいないネイティブ承認プロンプトなしで、無人の OpenClaw ターンと Heartbeat が進行できます。

Codex のローカルシステム要件ファイルが、暗黙の YOLO 承認、レビュアー、またはサンドボックス値を許可しない場合、OpenClaw は暗黙の既定値を代わりに guardian として扱い、許可された guardian 権限を選択します。`tools.exec.mode: "auto"` も guardian レビュー付きの Codex 承認を強制し、安全でないレガシーの `approvalPolicy: "never"` または `sandbox: "danger-full-access"` 上書きを保持しません。意図的に承認なしの姿勢にするには `tools.exec.mode: "full"` を設定してください。同じ要件ファイル内のホスト名一致
`[[remote_sandbox_config]]` エントリは、サンドボックス既定値の決定で尊重されます。

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

`guardian` プリセットは、それらの値が許可されている場合、`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、および `sandbox: "workspace-write"` に展開されます。個別のポリシーフィールドは `mode` を上書きします。古い `guardian_subagent` レビュアー値は互換エイリアスとして引き続き受け入れられますが、新しい構成では `auto_review` を使用してください。

OpenClaw サンドボックスが有効な場合でも、ローカル Codex app-server プロセスは Gateway ホスト上で実行されます。そのため OpenClaw は、そのターンについて Codex のネイティブ Code Mode、ユーザー MCP サーバー、app-backed Plugin 実行を無効化し、Codex ホスト側サンドボックスを OpenClaw サンドボックスバックエンドと同等とは扱いません。通常の exec/process ツールが利用可能な場合、シェルアクセスは `sandbox_exec` や `sandbox_process` などの OpenClaw サンドボックス-backed 動的ツールを通じて公開されます。

Ubuntu/AppArmor ホストでは、アクティブな OpenClaw サンドボックスなしでネイティブ Codex `workspace-write` を意図的に実行すると、Codex bwrap がシェルコマンドの開始前に `workspace-write` で失敗することがあります。`bwrap: setting up uid map: Permission denied` または
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` が表示された場合は、より広い Docker コンテナー権限を付与するのではなく、`openclaw doctor` を実行し、報告された OpenClaw サービスユーザー向けホスト namespace ポリシーを修正してください。サービスプロセスにはスコープ付き AppArmor プロファイルを優先してください。`kernel.apparmor_restrict_unprivileged_userns=0` フォールバックはホスト全体に影響し、セキュリティ上のトレードオフがあります。

## サンドボックス化されたネイティブ実行

安定した既定値はフェイルクローズです。アクティブな OpenClaw サンドボックスは、そうでなければ Codex app-server ホストから実行されるネイティブ Codex 実行サーフェスを無効化します。OpenClaw のサンドボックスバックエンドで Codex のリモート環境サポートを試したい場合にのみ、`appServer.experimental.sandboxExecServer: true` を使用してください。このプレビューパスには Codex app-server 0.132.0 以降が必要です。

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

このフラグがオンで、現在の OpenClaw セッションがサンドボックス化されている場合、OpenClaw はアクティブなサンドボックスをバックエンドとする local loopback exec-server を起動し、それを Codex app-server に登録して、その OpenClaw 所有の環境で Codex スレッドとターンを開始します。app-server が環境を登録できない場合、実行はホスト実行へ黙ってフォールバックするのではなくフェイルクローズします。

このプレビューパスはローカル専用です。リモート WebSocket app-server は、同じホスト上で実行されていない限り loopback exec-server に到達できないため、OpenClaw はその組み合わせを拒否します。

## 認証と環境分離

既定のエージェントごとのホームでは、認証は次の順序で選択されます:

1. エージェントの明示的な OpenClaw Codex 認証プロファイル。
2. そのエージェントの Codex ホーム内にある app-server の既存アカウント。
3. ローカル stdio app-server 起動の場合のみ、app-server アカウントが存在せず、OpenAI 認証がまだ必要な場合に、`CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出すると、生成された Codex 子プロセスから `CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、Gateway レベルの API キーは埋め込みや直接の OpenAI モデルに利用できる一方で、ネイティブ Codex app-server ターンが誤って API 経由で課金されることを防ぎます。

明示的な Codex API キープロファイルとローカル stdio env キーフォールバックは、継承された子プロセス env ではなく app-server ログインを使用します。WebSocket app-server 接続は Gateway env API キーフォールバックを受け取りません。明示的な認証プロファイルまたはリモート app-server 自身のアカウントを使用してください。

stdio app-server 起動は、既定で OpenClaw のプロセス環境を継承します。OpenClaw は Codex app-server アカウントブリッジを所有し、`CODEX_HOME` をそのエージェントの OpenClaw state 配下にあるエージェントごとのディレクトリに設定します。これにより、Codex 構成、アカウント、Plugin キャッシュ/データ、スレッド状態は、オペレーター個人の `~/.codex` ホームから漏れ込むのではなく、OpenClaw エージェントにスコープされます。

Codex Desktop と CLI でネイティブ Codex 状態を共有するには、`appServer.homeScope: "user"` を設定します。このローカル stdio 専用モードは、設定されている場合は `$CODEX_HOME` を使用し、それ以外の場合は `~/.codex` を使用します。ネイティブ認証、構成、Plugin、スレッドも含まれます。OpenClaw は app-server 用の認証プロファイルブリッジをスキップします。検証済みオーナーターンでは、`codex_threads` を使用してそれらのスレッドを一覧表示、検索、読み取り、フォーク、名前変更、アーカイブ、復元できます。OpenClaw でスレッドを続行する前にフォークしてください。独立した Codex プロセスは、同じスレッドに対する同時書き込みを調整しません。

OpenClaw は通常のローカル app-server 起動で `HOME` を書き換えません。`openclaw`、`gh`、`git`、クラウド CLI、シェルコマンドなどの Codex 実行サブプロセスは、通常のプロセスホームを参照し、ユーザーホームの構成とトークンを見つけることができます。Codex は `$HOME/.agents/skills` と `$HOME/.agents/plugins/marketplace.json` も検出する場合があります。この `.agents` 検出はオペレーターホームと意図的に共有され、分離された `~/.codex` 状態とは別です。

既定のエージェントスコープでは、OpenClaw Plugin と OpenClaw skill スナップショットは引き続き OpenClaw 自身の Plugin レジストリと skill ローダーを通じて流れます。個人用 Codex `~/.codex` アセットは流れません。分離された OpenClaw エージェントの一部にすべき Codex ホーム由来の有用な Codex CLI Skills または Plugin がある場合は、それらを明示的に棚卸ししてください:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

デプロイで追加の環境分離が必要な場合は、それらの変数を `appServer.clearEnv` に追加します:

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

`appServer.clearEnv` は、生成された Codex app-server 子プロセスにのみ影響します。OpenClaw はローカル起動の正規化中に、このリストから `CODEX_HOME` と `HOME` を削除します。`CODEX_HOME` は選択されたエージェントまたはユーザースコープを指したままになり、`HOME` はサブプロセスが通常のユーザーホーム状態を使用できるよう継承されたままになります。

## 動的ツール

Codex 動的ツールの既定は `searchable` 読み込みです。OpenClaw は、Codex ネイティブのワークスペース操作と重複する動的ツールを公開しません:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

メッセージング、メディア、Cron、ブラウザー、ノード、Gateway、`heartbeat_respond`、`web_search` など、残りの OpenClaw 統合ツールの大半は、`openclaw` namespace 配下の Codex ツール検索を通じて利用できます。これにより初期モデルコンテキストが小さく保たれます。`sessions_yield` とメッセージツール専用のソース返信は、ターン制御契約であるため direct のままです。`sessions_spawn` は searchable のままなので、Codex のネイティブ `spawn_agent` が主要な Codex サブエージェントサーフェスであり続けます。一方で、明示的な OpenClaw または ACP 委任は引き続き `openclaw` 動的ツール namespace から利用できます。

遅延動的ツールを検索できないカスタム Codex app-server に接続する場合、または完全なツールペイロードをデバッグする場合にのみ、`codexDynamicToolsLoading: "direct"` を設定してください。

## タイムアウト

OpenClaw 所有の動的ツール呼び出しは、`appServer.requestTimeoutMs` から独立して制限されます。各 Codex `item/tool/call` リクエストは、次の順序で最初に利用可能なタイムアウトを使用します:

- 正の呼び出しごとの `timeoutMs` 引数。
- `image_generate` の場合、`agents.defaults.imageGenerationModel.timeoutMs`。
- 構成済みタイムアウトなしの `image_generate` の場合、120 秒の画像生成既定値。
- メディア理解の `image` ツールの場合、`tools.media.image.timeoutSeconds` をミリ秒に変換した値、または 60 秒のメディア既定値。画像理解では、これはリクエスト自体に適用され、事前の準備作業によって短縮されません。
- 90 秒の動的ツール既定値。

このウォッチドッグは、外側の動的 `item/tool/call` 予算です。プロバイダー固有のリクエストタイムアウトはその呼び出し内で実行され、独自のタイムアウトセマンティクスを保持します。動的ツール予算は 600000 ms に上限設定されます。タイムアウト時、OpenClaw はサポートされる場合にツールシグナルを中止し、失敗した動的ツール応答を Codex に返します。これにより、セッションを `processing` のままにせず、ターンを続行できます。

Codex がターンを受け入れた後、および OpenClaw がターンスコープの app-server リクエストに応答した後、ハーネスは Codex が現在のターンで進行し、最終的に `turn/completed` でネイティブターンを完了することを期待します。app-server が `appServer.turnCompletionIdleTimeoutMs` の間沈黙した場合、OpenClaw はベストエフォートで Codex ターンを中断し、診断タイムアウトを記録し、OpenClaw セッションレーンを解放して、後続のチャットメッセージが古いネイティブターンの後ろにキューされないようにします。

同じターンのほとんどの非終端通知は、その短いウォッチドッグを解除します。Codex がそのターンがまだ生きていることを証明しているためです。ツールの引き渡しには、より長いツール後アイドル予算を使用します。OpenClaw が `item/tool/call` レスポンスを返した後、`commandExecution` などのネイティブツール項目が完了した後、生の `custom_tool_call_output` 完了後、そしてツール後の生アシスタント進捗、生推論完了、または推論進捗の後です。このガードは、設定されている場合は `appServer.postToolRawAssistantCompletionIdleTimeoutMs` を使用し、それ以外の場合はデフォルトで 5 分になります。同じツール後予算は、Codex が次の現在ターンイベントを出す前のサイレント合成ウィンドウの進捗ウォッチドッグも延長します。推論完了、commentary `agentMessage` 完了、ツール前の生推論またはアシスタント進捗の後には自動的な最終返信が続くことがあるため、セッションレーンをすぐに解放するのではなく、進捗後返信ガードを使用します。最終/非 commentary の完了済み `agentMessage` 項目と、ツール前の生アシスタント完了だけが、アシスタント出力解放を作動させます。その後 Codex が `turn/completed` なしで沈黙した場合、OpenClaw はベストエフォートでネイティブターンを割り込み、セッションレーンを解放します。アシスタント、ツール、アクティブ項目、または副作用の証拠がないターン完了アイドルタイムアウトを含む、リプレイ安全な stdio アプリサーバー失敗は、新しいアプリサーバー試行で 1 回再試行されます。安全でないタイムアウトでも、停止したアプリサーバークライアントを廃止し、OpenClaw セッションレーンを解放します。また、自動的にリプレイするのではなく、古いネイティブスレッドバインディングをクリアします。完了監視タイムアウトでは、Codex 固有のタイムアウト文言が表示されます。リプレイ安全なケースではレスポンスが不完全な可能性があると示し、安全でないケースでは再試行前に現在の状態を確認するようユーザーに伝えます。公開タイムアウト診断には、最後のアプリサーバー通知メソッド、生アシスタントレスポンス項目の id/type/role、アクティブなリクエスト/項目数、作動中の監視状態などの構造化フィールドが含まれます。最後の通知が生アシスタントレスポンス項目の場合は、上限付きのアシスタントテキストプレビューも含まれます。生プロンプトやツール内容は含まれません。

## モデル検出

デフォルトでは、Codex Plugin は利用可能なモデルをアプリサーバーに問い合わせます。モデルの可用性は Codex アプリサーバーが所有するため、OpenClaw がバンドルされた `@openai/codex` バージョンをアップグレードしたとき、またはデプロイが `appServer.command` を別の Codex バイナリに向けたときに、リストが変わることがあります。可用性はアカウント単位になることもあります。実行中の Gateway で `/codex models` を使用すると、そのハーネスとアカウントのライブカタログを確認できます。

検出に失敗するかタイムアウトした場合、OpenClaw は次のバンドル済みフォールバックカタログを使用します。

- GPT-5.5
- GPT-5.4 mini

現在バンドルされているハーネスは `@openai/codex` `0.142.5` です。そのバンドル済みアプリサーバーに対する `model/list` プローブでは、次の公開ピッカー行が返されました。

| モデル id             | 入力モダリティ | 推論エフォート         |
| --------------------- | -------------- | ---------------------- |
| `gpt-5.5`             | テキスト, 画像 | low, medium, high, xhigh |
| `gpt-5.4`             | テキスト, 画像 | low, medium, high, xhigh |
| `gpt-5.4-mini`        | テキスト, 画像 | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | テキスト       | low, medium, high, xhigh |

内部または特殊なフロー向けに、アプリサーバーカタログから非表示モデルが返されることがありますが、通常のモデルピッカーの選択肢ではありません。

`plugins.entries.codex.config.discovery` で検出を調整します。

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

Codex は、ネイティブのプロジェクトドキュメント検出を通じて `AGENTS.md` 自体を処理します。OpenClaw は合成 Codex プロジェクトドキュメントファイルを書き込まず、ペルソナファイルについて Codex のフォールバックファイル名にも依存しません。Codex のフォールバックは `AGENTS.md` がない場合にのみ適用されるためです。

OpenClaw ワークスペースとの同等性のために、Codex ハーネスは他のブートストラップファイルを解決します。`SOUL.md`、`IDENTITY.md`、`TOOLS.md`、`USER.md` は、アクティブなエージェント、利用可能なワークスペースガイダンス、ユーザープロファイルを定義するため、OpenClaw Codex 開発者指示として転送されます。コンパクトな OpenClaw Skills リストは、ターンスコープのコラボレーション開発者指示として転送されます。`HEARTBEAT.md` の内容は注入されません。heartbeat ターンには、ファイルが存在し空でない場合にそのファイルを読むためのコラボレーションモードポインターが与えられます。設定されたエージェントワークスペースの `MEMORY.md` 内容は、そのワークスペースでメモリツールが利用可能な場合、ネイティブ Codex ターン入力には貼り付けられません。存在する場合、ハーネスは小さなワークスペースメモリポインターをターンスコープのコラボレーション開発者指示に追加し、永続メモリが関連する場合は Codex が `memory_search` または `memory_get` を使用する必要があります。ツールが無効、メモリ検索が利用不可、またはアクティブワークスペースがエージェントメモリワークスペースと異なる場合、`MEMORY.md` は通常の上限付きターンコンテキストパスを使用します。
`BOOTSTRAP.md` が存在する場合は、OpenClaw ターン入力の参照コンテキストとして転送されます。

## 環境オーバーライド

環境オーバーライドはローカルテスト向けに引き続き利用できます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` が未設定の場合、`OPENCLAW_CODEX_APP_SERVER_BIN` は管理対象バイナリを迂回します。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに `plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、単発のローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。繰り返し可能なデプロイには設定が推奨されます。Plugin の挙動が、Codex ハーネス設定の他の部分と同じレビュー済みファイルに保持されるためです。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [ネイティブ Codex plugins](/ja-JP/plugins/codex-native-plugins)
- [Codex Computer Use](/ja-JP/plugins/codex-computer-use)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [設定リファレンス](/ja-JP/gateway/configuration-reference)
