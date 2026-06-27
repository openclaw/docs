---
read_when:
    - すべての Codex ハーネス設定フィールドが必要です
    - アプリサーバーのトランスポート、認証、検出、またはタイムアウトの動作を変更している
    - Codex ハーネスの起動、モデル検出、または環境分離をデバッグしている
summary: Codex ハーネスの設定、認証、検出、アプリサーバーのリファレンス
title: Codex ハーネスリファレンス
x-i18n:
    generated_at: "2026-06-27T12:11:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32da817c262a61769b78b16c10e508175c730a568c2ba6321595c430815526a5
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

このリファレンスでは、同梱された `codex`
Plugin の詳細な設定について説明します。セットアップとルーティングの判断については、
[Codex ハーネス](/ja-JP/plugins/codex-harness)から始めてください。

## Plugin 設定サーフェス

すべての Codex ハーネス設定は `plugins.entries.codex.config` の下にあります。

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

サポートされているトップレベルフィールド:

| フィールド                 | デフォルト               | 意味                                                                                                                                      |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 有効                     | Codex app-server `model/list` のモデル検出設定。                                                                                          |
| `appServer`                | managed stdio app-server | トランスポート、コマンド、認証、承認、サンドボックス、タイムアウトの設定。                                                                |
| `codexDynamicToolsLoading` | `"searchable"`           | OpenClaw 動的ツールを初期 Codex ツールコンテキストに直接配置するには `"direct"` を使用します。                                             |
| `codexDynamicToolsExclude` | `[]`                     | Codex app-server ターンから除外する追加の OpenClaw 動的ツール名。                                                                         |
| `codexPlugins`             | 無効                     | 移行済みのソースインストール型キュレーション Plugin に対するネイティブ Codex Plugin/app サポート。[ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins)を参照してください。 |
| `computerUse`              | 無効                     | Codex Computer Use のセットアップ。[Codex Computer Use](/ja-JP/plugins/codex-computer-use)を参照してください。                                  |

## App-server トランスポート

デフォルトでは、OpenClaw は同梱された
Plugin とともに出荷される managed Codex バイナリを起動します。

```bash
codex app-server --listen stdio://
```

これにより、app-server のバージョンは、ローカルにたまたまインストールされている別個の Codex CLI ではなく、
同梱の `codex` Plugin に結び付けられます。別の実行可能ファイルを意図的に実行したい場合にのみ
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

サポートされている `appServer` フィールド:

| フィールド                                         | デフォルト                                                | 意味                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` は Codex を起動します。`"websocket"` は `url` に接続します。                                                                                                                                                                                                                                                                                                                                        |
| `command`                                     | 管理対象の Codex バイナリ                                   | stdio トランスポート用の実行ファイル。管理対象バイナリを使用するには未設定のままにします。                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio トランスポート用の引数。                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 未設定                                                  | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | 未設定                                                  | WebSocket トランスポート用のベアラートークン。リテラル文字列、または `${CODEX_APP_SERVER_TOKEN}` のような SecretInput を受け入れます。                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | 追加の WebSocket ヘッダー。ヘッダー値は、リテラル文字列または SecretInput 値を受け入れます。例: `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw が継承環境を構築した後、起動された stdio app-server プロセスから削除される追加の環境変数名。                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | 未設定                                                  | リモート Codex app-server ワークスペースルート。設定すると、OpenClaw は解決済みの OpenClaw ワークスペースからローカルワークスペースルートを推定し、このリモートルート配下の現在の cwd サフィックスを保持し、最終的な app-server cwd だけを Codex に送信します。cwd が解決済みの OpenClaw ワークスペースルートの外側にある場合、OpenClaw は Gateway ローカルパスをリモート app-server に送信する代わりにフェイルクローズします。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server コントロールプレーン呼び出しのタイムアウト。                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex がターンを受け入れた後、またはターンスコープの app-server リクエストの後に、OpenClaw が `turn/completed` を待機する間の静かな時間枠。                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | ツールのハンドオフ、ネイティブツール完了、ツール後の raw アシスタント進行、raw 推論完了、または推論進行の後に、OpenClaw が `turn/completed` を待機する間に使用される、完了アイドルおよび進行ガード。ツール後の統合が最終アシスタント解放予算より長く正当に静かなままでいられる、信頼済みまたは重いワークロードに使用します。                                |
| `mode`                                        | ローカル Codex 要件が YOLO を許可しない場合を除き `"yolo"` | YOLO またはガーディアンレビュー付き実行のプリセット。                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` または許可されたガーディアン承認ポリシー       | スレッド開始、再開、ターンに送信されるネイティブ Codex 承認ポリシー。                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` または許可されたガーディアンサンドボックス  | スレッド開始と再開に送信されるネイティブ Codex サンドボックスモード。アクティブな OpenClaw サンドボックスは、`danger-full-access` ターンを Codex `workspace-write` に狭めます。ターンのネットワークフラグは OpenClaw サンドボックスの外向き通信に従います。                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` または許可されたガーディアンレビュアー               | 許可されている場合、`"auto_review"` を使用して Codex にネイティブ承認プロンプトをレビューさせます。                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | 現在のプロセスディレクトリ                              | `--cwd` が省略された場合に `/codex bind` で使用されるワークスペース。                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | 未設定                                                  | 任意の Codex app-server サービスティア。`"priority"` は fast-mode ルーティングを有効にし、`"flex"` は flex 処理をリクエストし、`null` はオーバーライドをクリアします。レガシーの `"fast"` は `"priority"` として受け入れられます。                                                                                                                                                                                                 |
| `networkProxy`                                | 無効                                               | app-server コマンド向けの Codex 権限プロファイルネットワーキングにオプトインします。OpenClaw は選択された `permissions.<profile>.network` 設定を定義し、`sandbox` を送信する代わりに `default_permissions` でそれを選択します。                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | OpenClaw サンドボックスでバックアップされた Codex 環境を Codex app-server 0.132.0 以降に登録し、ネイティブ Codex 実行をアクティブな OpenClaw サンドボックス内で実行できるようにする、プレビューのオプトイン。                                                                                                                                                                                                         |

`appServer.networkProxy` は Codex サンドボックス契約を変更するため明示的です。有効にすると、OpenClaw は Codex スレッド設定で `features.network_proxy.enabled` と `default_permissions` も設定し、生成された権限プロファイルが Codex 管理ネットワーキングを開始できるようにします。デフォルトでは、OpenClaw はプロファイル本文から衝突耐性のある `openclaw-network-<fingerprint>` プロファイル名を生成します。安定したローカル名が必要な場合にのみ `profileName` を使用してください。

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

通常の app-server ランタイムが `danger-full-access` になる場合、`networkProxy` を有効にすると、生成された権限プロファイルにワークスペース形式のファイルシステムアクセスが使用されます。Codex 管理のネットワーク強制はサンドボックス化されたネットワーキングであるため、フルアクセスプロファイルでは送信トラフィックを保護できません。

この Plugin は、古い、またはバージョンなしの app-server ハンドシェイクをブロックします。Codex app-server は安定版バージョン `0.125.0` 以降を報告する必要があります。

OpenClaw は、非ループバックの WebSocket アプリサーバー URL をリモートとして扱い、
`appServer.authToken` または `Authorization` ヘッダーによる、ID を持つ WebSocket 認証を要求します。`appServer.authToken` と各 `appServer.headers.*`
値には SecretInput を指定できます。シークレットランタイムは、OpenClaw がアプリサーバーの起動オプションを構築する前に SecretRef と env
省略記法を解決し、未解決の構造化 SecretRef はトークンやヘッダーが送信される前に失敗します。ネイティブ Codex
Plugin が構成されている場合、OpenClaw は接続済みアプリサーバーの Plugin コントロールプレーンを使用してそれらの Plugin をインストールまたは更新し、その後アプリインベントリを更新して、Plugin 所有のアプリが Codex スレッドに表示されるようにします。`app/list` は引き続き信頼できるインベントリおよびメタデータのソースですが、Codex が現在そのアプリを無効としてマークしている場合でも、一覧にあるアクセス可能なアプリについて `thread/start` が `config.apps[appId].enabled = true` を送信するかどうかは OpenClaw ポリシーが決定します。不明または欠落しているアプリ ID は引き続きフェイルクローズされます。このパスは `plugin/install`
経由でマーケットプレイス Plugin を有効化し、インベントリを更新するだけです。OpenClaw が管理する Plugin インストールとアプリインベントリ更新を受け入れることを信頼できるリモートアプリサーバーにのみ、OpenClaw を接続してください。

## 承認とサンドボックスモード

ローカル stdio アプリサーバーセッションの既定値は YOLO モードです:
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"`。この信頼されたローカルオペレーター前提により、
応答できる人がいないネイティブ承認プロンプトなしで、無人の OpenClaw ターンと Heartbeat を進められます。

Codex のローカルシステム要件ファイルが、暗黙の YOLO 承認、
レビュアー、またはサンドボックス値を許可しない場合、OpenClaw は暗黙の既定値を代わりに guardian として扱い、許可された guardian 権限を選択します。`tools.exec.mode: "auto"`
も guardian レビュー付き Codex 承認を強制し、安全でないレガシーの
`approvalPolicy: "never"` または `sandbox: "danger-full-access"` オーバーライドを保持しません。意図的に承認なしの前提にするには `tools.exec.mode: "full"` を設定します。同じ要件ファイル内のホスト名一致
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

`guardian` プリセットは、それらの値が許可されている場合、
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、および `sandbox: "workspace-write"` に展開されます。個別のポリシーフィールドは `mode` をオーバーライドします。古い
`guardian_subagent` レビュアー値は互換性エイリアスとして引き続き受け入れられますが、新しい構成では `auto_review` を使用してください。

OpenClaw サンドボックスが有効な場合でも、ローカル Codex アプリサーバープロセスは Gateway ホスト上で実行されます。そのため OpenClaw は、Codex ホスト側のサンドボックス化を OpenClaw サンドボックスバックエンドと同等に扱うのではなく、そのターンでは Codex ネイティブ Code Mode、ユーザー MCP サーバー、アプリ支援 Plugin 実行を無効化します。通常の exec/process ツールが利用可能な場合、シェルアクセスは `sandbox_exec` や `sandbox_process` などの OpenClaw サンドボックス支援動的ツールを通じて公開されます。

Ubuntu/AppArmor ホストでは、有効な OpenClaw サンドボックス化なしでネイティブ Codex
`workspace-write` を意図的に実行すると、シェルコマンドが開始される前に Codex bwrap が `workspace-write` で失敗することがあります。
`bwrap: setting up uid map: Permission denied` または
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` が表示された場合は、Docker コンテナ権限を広げるのではなく、
`openclaw doctor` を実行し、OpenClaw サービスユーザーについて報告されたホスト名前空間ポリシーを修正してください。サービスプロセスにはスコープを絞った AppArmor プロファイルを推奨します。
`kernel.apparmor_restrict_unprivileged_userns=0` フォールバックはホスト全体に影響し、セキュリティ上のトレードオフがあります。

## サンドボックス化されたネイティブ実行

安定した既定値はフェイルクローズです。有効な OpenClaw サンドボックス化は、そうでなければ Codex アプリサーバーホストから実行されるネイティブ Codex 実行サーフェスを無効化します。Codex のリモート環境サポートを OpenClaw のサンドボックスバックエンドで試したい場合にのみ、`appServer.experimental.sandboxExecServer: true` を使用してください。このプレビューパスには Codex アプリサーバー 0.132.0 以降が必要です。

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

このフラグがオンで、現在の OpenClaw セッションがサンドボックス化されている場合、OpenClaw は有効なサンドボックスをバックエンドとする local loopback exec-server を起動し、それを Codex アプリサーバーに登録して、その OpenClaw 所有環境で Codex スレッドとターンを開始します。アプリサーバーが環境を登録できない場合、ホスト実行へ暗黙にフォールバックするのではなく、実行はフェイルクローズされます。

このプレビューパスはローカル専用です。リモート WebSocket アプリサーバーは、同じホスト上で実行されていない限り loopback exec-server に到達できないため、OpenClaw はその組み合わせを拒否します。

## 認証と環境分離

認証は次の順序で選択されます:

1. エージェント用の明示的な OpenClaw Codex 認証プロファイル。
2. そのエージェントの Codex ホーム内にあるアプリサーバーの既存アカウント。
3. ローカル stdio アプリサーバー起動の場合のみ、アプリサーバーアカウントが存在せず、OpenAI 認証がまだ必要なときは `CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出すると、生成される Codex 子プロセスから
`CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、Gateway レベルの API キーを埋め込みや直接の OpenAI モデルには利用可能なままにしつつ、ネイティブ Codex アプリサーバーターンが誤って API 経由で課金されることを防ぎます。

明示的な Codex API キープロファイルとローカル stdio env キーフォールバックは、継承された子プロセス env ではなくアプリサーバーログインを使用します。WebSocket アプリサーバー接続は Gateway env API キーフォールバックを受け取りません。明示的な認証プロファイルまたはリモートアプリサーバー自身のアカウントを使用してください。

stdio アプリサーバー起動は、既定で OpenClaw のプロセス環境を継承します。OpenClaw は Codex アプリサーバーアカウントブリッジを所有し、`CODEX_HOME` をそのエージェントの OpenClaw 状態配下のエージェント別ディレクトリに設定します。これにより、Codex の構成、アカウント、Plugin キャッシュ/データ、スレッド状態は、オペレーター個人の `~/.codex` ホームから漏れ込むのではなく、OpenClaw エージェントにスコープされます。

OpenClaw は通常のローカルアプリサーバー起動では `HOME` を書き換えません。`openclaw`、`gh`、`git`、クラウド CLI、シェルコマンドなどの Codex 実行サブプロセスは通常のプロセスホームを参照し、ユーザーホームの構成とトークンを見つけられます。Codex は `$HOME/.agents/skills` と `$HOME/.agents/plugins/marketplace.json` も検出する場合があります。その `.agents` 検出は意図的にオペレーターホームと共有され、分離された `~/.codex` 状態とは別です。

OpenClaw Plugin と OpenClaw Skills スナップショットは、引き続き OpenClaw 独自の Plugin レジストリと Skills ローダーを通じて流れます。個人の Codex `~/.codex` アセットは流れません。OpenClaw エージェントの一部にすべき Codex ホーム由来の有用な Codex CLI Skills または Plugin がある場合は、それらを明示的にインベントリ化してください:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

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

`appServer.clearEnv` は、生成される Codex アプリサーバー子プロセスにのみ影響します。OpenClaw はローカル起動の正規化中に、このリストから `CODEX_HOME` と `HOME` を削除します。`CODEX_HOME` はエージェント別のままで、`HOME` は継承されたままになり、サブプロセスが通常のユーザーホーム状態を使用できるようにします。

## 動的ツール

Codex 動的ツールの既定値は `searchable` ロードです。OpenClaw は、Codex ネイティブのワークスペース操作と重複する動的ツールを公開しません:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

メッセージング、メディア、cron、ブラウザー、ノード、Gateway、`heartbeat_respond`、`web_search` など、残りのほとんどの OpenClaw 統合ツールは、`openclaw` 名前空間の下で Codex ツール検索を通じて利用できます。これにより、初期モデルコンテキストが小さく保たれます。`sessions_yield` とメッセージツール専用のソース返信は、ターン制御コントラクトであるため直接のままです。`sessions_spawn` は searchable のままなので、Codex ネイティブの `spawn_agent` が主要な Codex サブエージェントサーフェスであり続ける一方、明示的な OpenClaw または ACP 委任も `openclaw` 動的ツール名前空間を通じて引き続き利用できます。

遅延動的ツールを検索できないカスタム Codex アプリサーバーに接続する場合、または完全なツールペイロードをデバッグする場合にのみ、`codexDynamicToolsLoading: "direct"` を設定してください。

## タイムアウト

OpenClaw 所有の動的ツール呼び出しは、`appServer.requestTimeoutMs` とは独立して制限されます。各 Codex `item/tool/call` リクエストは、次の順序で最初に利用可能なタイムアウトを使用します:

- 正の値の呼び出し別 `timeoutMs` 引数。
- `image_generate` の場合、`agents.defaults.imageGenerationModel.timeoutMs`。
- 構成済みタイムアウトのない `image_generate` の場合、120 秒の画像生成既定値。
- メディア理解 `image` ツールの場合、`tools.media.image.timeoutSeconds` をミリ秒に変換した値、または 60 秒のメディア既定値。画像理解では、これはリクエスト自体に適用され、事前の準備作業によって短縮されません。
- 90 秒の動的ツール既定値。

このウォッチドッグは、外側の動的 `item/tool/call` 予算です。プロバイダー固有のリクエストタイムアウトはその呼び出し内で実行され、独自のタイムアウトセマンティクスを維持します。動的ツール予算は 600000 ms で上限設定されます。タイムアウト時、OpenClaw はサポートされている場合にツールシグナルを中止し、失敗した動的ツール応答を Codex に返します。これにより、セッションを `processing` に残すのではなく、ターンを継続できます。

Codex がターンを受け入れた後、および OpenClaw がターンスコープのアプリサーバーリクエストに応答した後、ハーネスは Codex が現在のターンで進捗し、最終的に `turn/completed` でネイティブターンを終了することを期待します。アプリサーバーが `appServer.turnCompletionIdleTimeoutMs` の間静かになった場合、OpenClaw はベストエフォートで Codex ターンに割り込み、診断タイムアウトを記録し、古いネイティブターンの後ろに後続のチャットメッセージがキューされないよう OpenClaw セッションレーンを解放します。

同じターンのほとんどの非終端通知は、その短いウォッチドッグを解除します。
Codex がそのターンがまだ生きていることを証明したためです。ツールへの引き継ぎでは、より長い
ツール後アイドル予算を使用します。これは、OpenClaw が `item/tool/call` レスポンスを返した後、
`commandExecution` などのネイティブツール項目が完了した後、生の
`custom_tool_call_output` 完了後、そしてツール後の生の assistant
進行、生の reasoning 完了、または reasoning 進行の後に適用されます。ガードは、設定されている場合は
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` を使用し、
それ以外の場合は既定で 5 分になります。同じツール後予算は、Codex が次の
現在ターンイベントを発行する前の無音の合成ウィンドウについても、進行ウォッチドッグを延長します。Reasoning 完了、commentary
`agentMessage` 完了、ツール前の生の reasoning または assistant 進行の後には
自動の最終返信が続く場合があるため、セッションレーンをすぐに解放する代わりに、進行後返信
ガードを使用します。assistant 出力の解放を作動させるのは、
final/非 commentay の完了済み `agentMessage` 項目と、ツール前の生の assistant
完了だけです。その後 Codex が `turn/completed` なしで無音になった場合、
OpenClaw はベストエフォートでネイティブターンに割り込み、セッションレーンを解放します。Assistant、ツール、アクティブ項目、または
副作用の証拠がないターン完了アイドルタイムアウトを含む、リプレイ安全な stdio アプリサーバー障害は、
新しいアプリサーバー試行で 1 回再試行されます。安全でない
タイムアウトでは、停止したアプリサーバークライアントを退役させ、OpenClaw
セッションレーンを解放します。また、自動的にリプレイする代わりに、古いネイティブスレッドのバインディングも
クリアします。完了監視タイムアウトは Codex 固有のタイムアウト
テキストを表示します。リプレイ安全なケースではレスポンスが不完全な可能性があると伝え、安全でないケースでは
再試行前に現在の状態を確認するようユーザーに伝えます。公開タイムアウト診断には、
最後のアプリサーバー通知メソッド、生の assistant レスポンス項目の id/type/role、
アクティブなリクエスト/項目数、作動中の監視状態などの構造化フィールドが含まれます。最後の通知が生の assistant レスポンス項目の場合は、
境界付きの assistant テキストプレビューも含まれます。生のプロンプトや
ツール内容は含まれません。

## モデル検出

既定では、Codex Plugin は利用可能なモデルをアプリサーバーに問い合わせます。モデルの
可用性は Codex アプリサーバーが所有するため、OpenClaw がバンドルされた
`@openai/codex` バージョンをアップグレードした場合や、デプロイメントが
`appServer.command` を別の Codex バイナリに向けた場合に、リストが変わることがあります。可用性は
アカウントスコープの場合もあります。実行中の Gateway で `/codex models` を使用すると、そのハーネスとアカウントのライブカタログを確認できます。

検出が失敗またはタイムアウトした場合、OpenClaw は次のバンドル済みフォールバックカタログを使用します。

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

現在のバンドル済みハーネスは `@openai/codex` `0.139.0` です。そのバンドル済みアプリサーバーに対する `model/list` プローブは
次を返しました。

| モデル ID       | 既定 | 非表示 | 入力モダリティ | Reasoning efforts        |
| --------------- | ------- | ------ | ---------------- | ------------------------ |
| `gpt-5.5`       | はい     | いいえ     | テキスト, 画像      | low, medium, high, xhigh |
| `gpt-5.4`       | いいえ      | いいえ     | テキスト, 画像      | low, medium, high, xhigh |
| `gpt-5.4-mini`  | いいえ      | いいえ     | テキスト, 画像      | low, medium, high, xhigh |
| `gpt-5.3-codex` | いいえ      | いいえ     | テキスト, 画像      | low, medium, high, xhigh |
| `gpt-5.2`       | いいえ      | いいえ     | テキスト, 画像      | low, medium, high, xhigh |

非表示モデルは、内部または
特殊なフロー向けにアプリサーバーカタログから返されることがありますが、通常のモデルピッカーの選択肢ではありません。

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

Codex は、ネイティブのプロジェクトドキュメント検出を通じて `AGENTS.md` を自分で処理します。OpenClaw は
合成 Codex プロジェクトドキュメントファイルを書き込まず、persona ファイルについて Codex フォールバック
ファイル名にも依存しません。Codex のフォールバックは
`AGENTS.md` が存在しない場合にのみ適用されるためです。

OpenClaw ワークスペースとの同等性のために、Codex ハーネスは他のブートストラップ
ファイルを解決します。`SOUL.md`、`IDENTITY.md`、`TOOLS.md`、`USER.md` は、
アクティブなエージェント、利用可能なワークスペースガイダンス、ユーザープロファイルを定義するため、
OpenClaw Codex developer instructions として転送されます。コンパクトな OpenClaw Skills
リストは、ターンスコープのコラボレーション developer instructions として転送されます。
`HEARTBEAT.md` の内容は注入されません。Heartbeat ターンには、ファイルが存在して空でない場合に
そのファイルを読むためのコラボレーションモードのポインターが付与されます。設定されたエージェントワークスペースの `MEMORY.md` 内容は、
そのワークスペースでメモリツールが利用可能な場合、ネイティブ Codex ターン入力には貼り付けられません。
存在する場合、ハーネスは小さなワークスペースメモリポインターをターンスコープのコラボレーション developer
instructions に追加し、耐久メモリが関連する場合 Codex は `memory_search` または `memory_get` を使用するべきです。ツールが無効、メモリ検索が利用不可、または
アクティブワークスペースがエージェントメモリワークスペースと異なる場合、`MEMORY.md` は
通常の境界付きターンコンテキストパスを使用します。
`BOOTSTRAP.md` が存在する場合は、OpenClaw ターン入力の参照
コンテキストとして転送されます。

## 環境オーバーライド

環境オーバーライドはローカルテスト用に引き続き利用できます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` は、
`appServer.command` が未設定の場合に管理対象バイナリをバイパスします。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、
一回限りのローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用します。反復可能なデプロイメントには Config が推奨されます。
これは、Plugin の動作を Codex ハーネス設定の残りと同じレビュー済みファイル内に保つためです。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins)
- [Codex Computer Use](/ja-JP/plugins/codex-computer-use)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [構成リファレンス](/ja-JP/gateway/configuration-reference)
