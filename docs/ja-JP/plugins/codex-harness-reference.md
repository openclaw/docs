---
read_when:
    - Codex ハーネスのすべての設定フィールドが必要です
    - app-server のトランスポート、認証、検出、またはタイムアウトの動作を変更する場合
    - Codex ハーネスの起動、モデル検出、または環境分離をデバッグしている場合
summary: Codex ハーネスの設定、認証、検出、アプリサーバーに関するリファレンス
title: Codex ハーネスリファレンス
x-i18n:
    generated_at: "2026-07-16T11:48:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 00dd9050fdc9f2c179012285540f49ada8825f29be1d4630742a4d948a5318a1
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

このリファレンスでは、公式 `codex` Plugin の詳細な設定について説明します。
セットアップとルーティングの判断については、
[Codex ハーネス](/ja-JP/plugins/codex-harness)から始めてください。

## Plugin 設定サーフェス

Codex ハーネスのすべての設定は `plugins.entries.codex.config` 配下にあります。

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

トップレベルのフィールド：

| フィールド                      | デフォルト                  | 意味                                                                                                                                        |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 有効                  | Codex app-server `model/list` のモデル検出設定。                                                                                    |
| `appServer`                | 管理対象の stdio app-server | トランスポート、コマンド、認証、承認、サンドボックス、タイムアウトの設定。通常のハーネスでは、デフォルトでエージェントスコープの状態を使用します。                        |
| `codexDynamicToolsLoading` | `"searchable"`           | OpenClaw の動的ツールを Codex の初期ツールコンテキストに直接配置するには、`"direct"` を使用します。                                                       |
| `codexDynamicToolsExclude` | `[]`                     | Codex app-server のターンから除外する追加の OpenClaw 動的ツール名。                                                                    |
| `codexPlugins`             | 無効                 | 接続済みアカウントのアプリへのオプトインアクセスを含む、Codex のネイティブ Plugin／アプリ対応。[Codex ネイティブ Plugin](/ja-JP/plugins/codex-native-plugins)を参照してください。 |
| `computerUse`              | 無効                 | Codex Computer Use のセットアップ。[Codex Computer Use](/ja-JP/plugins/codex-computer-use)を参照してください。                                                               |
| `sessionCatalog`           | 有効                  | サイドバー向けのネイティブ Codex セッション検出。プロバイダーやハーネスを無効にせず検出のみを無効にするには、`enabled: false` を設定します。           |
| `supervision`              | 無効                 | エージェント向けのネイティブセッショントランスクリプトおよび書き込み制御ポリシー。[Codex の監督](/ja-JP/plugins/codex-supervision)を参照してください。                          |

## 監督

ネイティブセッション検出では、デフォルトで Gateway
コンピューターおよびオプトインしたペアリング済み Node にある、アーカイブされていない Codex セッションを一覧表示します。このカタログのみを無効にするには、次のように設定します。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          sessionCatalog: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

`supervision` はエージェント向けツールを別途制御します。

| フィールド                 | デフォルト                 | 意味                                                                                                                                                                                                                                   |
| --------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                 | エージェント向け Codex 監督ツールを有効にします。これは認証済みオペレーターのセッションカタログを制御しません。                                                                                                                            |
| `endpoints`           | 組み込みローカルエンドポイント | 維持されている Codex 監督エージェントとスタンドアロン MCP ツール向けの互換性および高度なエンドポイントターゲット。人間向けカタログとブランチフローはこれらのターゲットを無視し、`appServer` から解決された監督用 App Server を使用します。       |
| `allowRawTranscripts` | `false`                 | 監督が有効な場合、自律エージェントまたはスタンドアロン MCP によるトランスクリプトの読み取りと、トランスクリプトから派生した一覧フィールドの読み取りを許可します。`codex_threads` のメタデータのみの読み取りは引き続き利用できます。認証済み Control UI の継続操作は制御しません。     |
| `allowWriteControls`  | `false`                 | 監督が有効な場合、自律的な `codex_threads` のフォーク、名前変更、アーカイブ、アーカイブ解除の変更、およびスタンドアロン MCP の送信、誘導、中断操作を許可します。その他のバインディング、ホスト、ステータス、確認のチェックは回避しません。 |

エンドポイントエントリでは、次のフィールドを使用できます。

| フィールド          | 適用対象    | 意味                                                               |
| -------------- | ------------- | --------------------------------------------------------------------- |
| `id`           | すべて           | 安定したエンドポイント ID。                                                   |
| `label`        | すべて           | 任意の表示ラベル。                                               |
| `transport`    | すべて           | `"stdio-proxy"` または `"websocket"`。                                     |
| `command`      | `stdio-proxy` | 任意の App Server コマンド。                                          |
| `args`         | `stdio-proxy` | 任意のコマンド引数。                                           |
| `cwd`          | `stdio-proxy` | 任意の子プロセス作業ディレクトリ。                             |
| `url`          | `websocket`   | 必須の WebSocket URL または対応するローカルソケット URL。                     |
| `authTokenEnv` | `websocket`   | 値によってエンドポイントを認証する任意の環境変数。 |

**Codex Sessions** ページは Plugin の監督用 App Server を使用し、
アーカイブされていないセッションのみを表示します。明示的な `appServer` 接続設定がない場合、
その接続は管理対象のユーザーホーム stdio になります。保存済みまたはアイドル状態のローカル行からは、
最後に永続化されたターミナルソースターンまでの、範囲を制限したユーザーおよびアシスタント履歴を持つ
モデル固定 Chat を作成できます。そのプライベートバインディングにより、スナップショットフォーク、
正規の `appServer` ソースブランチ、履歴注入、その後のターンがその接続上に維持されます。
最初の正規開始では、フォークによって返されたペアを使用します。それ以降の再開では
OpenClaw のモデルおよびプロバイダーのオーバーライドを省略し、Codex が
正規スレッドに永続化されたペアを復元できるようにします。別のネイティブ変更によってその
ペアを更新できますが、外側のモデルおよびフォールバックチェーンが置き換えることはありません。保存済みおよびアイドル状態の
行は、他のランナーが存在しないことを確認した後にアーカイブできます。ただし、別のアクティブな
OpenClaw バインディングが完全に同一のターゲット、またはそこから生成されたアーカイブされていない
子孫のいずれかを所有している場合は除きます。OpenClaw は Codex の子孫ページネーションに従い、
列挙エラー、循環、または安全上限の枯渇が発生した場合はフェイルクローズします。確認では引き続き、
不明なネイティブクライアントと、ステータスからアーカイブまでの競合を対象にします。監督対象の
モデル固定 Chat は、ネイティブバインディングを保護している間は削除できません。
アクティブなソースからブランチを作成したり、ソースをアーカイブしたりすることはできませんが、既存の監督対象
Chat は引き続き開くことができます。ペアリング済み Node のすべての行は読み取り専用のままです。Node
トランスポートでは、ハーネスに必要なストリーミングライフサイクルがまだ提供されていません。

`appServer.homeScope: "user"` 単独では、管理対象ハーネス
プロセスが使用する Codex ホームのみが変更され、フリートカタログは公開されません。監督を有効にしても
ハーネスのデフォルトは変更されません。代わりに、明示的な `appServer`
接続設定が存在しない場合、別個の監督接続はデフォルトで管理対象のユーザーホーム stdio を使用します。明示的な設定はその接続に適用されます。
保留中および確定済みの監督対象バインディングは、すべてのターンでその接続を維持します。
監督が無効な場合、または接続／ライフサイクルにドリフトがある場合は、
エージェントホームのハーネスにフォールバックせず、フェイルクローズします。デフォルト接続は
ネイティブ Codex クライアントと保存済みセッションを共有しますが、各クライアントのプロセスローカルなアクティビティ状態は共有しません。

従来の `plugins.entries.codex-supervisor` 設定は廃止されました。古いエントリ、エンドポイント定義、ポリシー
フラグ、Plugin の許可／拒否参照をこのブロックに移行するには、
`openclaw doctor --fix` を実行してください。競合する場合は、明示的な正規
`codex.config.supervision` 値が優先されます。

## App-server トランスポート

通常のハーネスターンでは、OpenClaw は公式 Plugin に同梱されている
管理対象 Codex バイナリ（現在は `@openai/codex` `0.144.3`）を起動します。

```bash
codex app-server --listen stdio://
```

これにより、app-server のバージョンは、ローカルに別途インストールされている Codex CLI ではなく、
公式 `codex` Plugin に固定されます。意図的に別の実行可能ファイルを使用する場合にのみ、
`appServer.command` を設定してください。デフォルトの分離されたエージェントホームを使用する通常の管理対象ターンでは、
macOS デスクトップバンドルがインストールされている場合でも、この固定パッケージが優先されます。
[Computer Use](/ja-JP/plugins/codex-computer-use) が有効な場合、または `homeScope` が
`"user"` でネイティブ Computer Use の状態を読み込める場合、管理対象の起動では代わりに、
必要な macOS 権限を所有するデスクトップアプリのバイナリが優先されます。同じ
デスクトップ優先ルールは、分離されたエージェントホームの有効な Codex 設定で
ネイティブ Computer Use が有効な場合にも適用されます。デスクトップアプリバンドルがインストールされていない場合、
OpenClaw は固定パッケージのバイナリにフォールバックします。

実行可能ファイルの引き継ぎとネイティブ設定のフェンシングにより、単一の
実行中 Gateway プロセス内のクライアントが調整されます。別のプロセスが
ネイティブ Codex Plugin の設定を変更した後は、Gateway を再起動してください。

監督では別の接続が解決されます。明示的な
`appServer` 接続設定がない場合は、`homeScope: "user"` を使用する管理対象 stdio が使用されます。
通常のハーネスは `homeScope: "agent"` を使用する管理対象 stdio のままです。明示的な
接続設定は両方のパスに適用されます。通常のハーネスでネイティブクライアントと
`$CODEX_HOME`（または `~/.codex`）を共有する必要がある場合は、
`homeScope: "user"` を明示的に設定してください。プライベートな監督対象バインディングは、
通常のハーネスのデフォルトに関係なく監督接続を使用します。独立した App Server
プロセスは、それぞれ個別のライブステータスと承認状態を維持します。

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

`appServer` のフィールド：

| フィールド                                         | デフォルト                                                | 意味                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` は Codex を起動します。明示的な `"unix"` はローカル制御ソケットに接続し、`"websocket"` は `url` に接続します。                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` は通常のハーネス状態を OpenClaw エージェントごとに分離します。`"user"` は明示的なオプトインであり、ネイティブの `$CODEX_HOME` または `~/.codex` を共有し、ネイティブ認証を使用して、所有者のみのスレッド管理を有効にします。ユーザースコープでは、ローカル stdio または Unix トランスポートをサポートします。個別の監視接続では、未設定の値は stdio または Unix の場合は `"user"`、WebSocket の場合は `"agent"` に解決されます。     |
| `command`                                     | 管理対象の Codex バイナリ                                   | stdio トランスポート用の実行ファイルです。管理対象のバイナリを使用するには未設定のままにします。                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio トランスポート用の引数です。                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 未設定                                                  | WebSocket App Server URL または `unix://` URL です。明示的に空の Unix パスを指定すると、標準のユーザーホーム制御ソケットが選択されます。                                                                                                                                                                                                                                                                          |
| `authToken`                                   | 未設定                                                  | WebSocket トランスポート用の Bearer トークンです。リテラル文字列、または `${CODEX_APP_SERVER_TOKEN}` などの SecretInput を受け付けます。                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | 追加の WebSocket ヘッダーです。ヘッダー値にはリテラル文字列、または `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"` などの SecretInput 値を使用できます。                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw が継承環境を構築した後、起動された stdio app-server プロセスから削除される追加の環境変数名です。                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | 未設定                                                  | リモート Codex app-server のワークスペースルートです。設定すると、OpenClaw は解決済みの OpenClaw ワークスペースからローカルワークスペースルートを推定し、このリモートルート配下で現在の cwd のサフィックスを維持して、最終的な app-server の cwd のみを Codex に送信します。cwd が解決済みの OpenClaw ワークスペースルート外にある場合、OpenClaw は Gateway ローカルのパスをリモート app-server に送信せず、フェイルクローズします。 |
| `loopDetectionPreToolUseRelay`                | `true`                                                 | OpenClaw のループ検出と、その明示的なポリシーなしマーカーにのみ使用される Codex `PreToolUse` サブプロセスをインストールします。ツールごとのプロセスのファンアウトを減らすには、`false` を設定します。ツール実行前の Plugin フックと信頼済みツールポリシーでは、引き続き必要なリレーがインストールされます。                                                                                                                                         |
| `requestTimeoutMs`                            | `60000`                                                | app-server のコントロールプレーン呼び出しのタイムアウトです。                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex がターンを受け入れた後、またはターンスコープの app-server リクエスト後に、OpenClaw が `turn/completed` を待機する間の静穏時間です。                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw が `turn/completed` を待機する間、ツールへの引き渡し、ネイティブツールの完了、ツール実行後の未加工のアシスタント進捗、未加工の推論完了、または推論の進捗の後に使用される、完了時のアイドル時間および進捗のガードです。ツール実行後の統合処理が、最終的なアシスタント解放の時間枠よりも正当に長く静止する可能性がある、信頼済みまたは負荷の高いワークロードに使用します。                                |
| `mode`                                        | ローカル Codex の要件で YOLO が許可されない場合を除き `"yolo"` | YOLO またはガーディアンによるレビュー付き実行のプリセットです。                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` または許可されたガーディアン承認ポリシー       | スレッドの開始、再開、およびターン時に送信されるネイティブ Codex 承認ポリシーです。                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` または許可されたガーディアンサンドボックス  | スレッドの開始および再開時に送信されるネイティブ Codex サンドボックスモードです。アクティブな OpenClaw サンドボックスでは、`danger-full-access` ターンが Codex `workspace-write` に制限され、ターンのネットワークフラグは OpenClaw サンドボックスのエグレス設定に従います。                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` または許可されたガーディアンレビュアー               | 許可されている場合、Codex にネイティブ承認プロンプトをレビューさせるには `"auto_review"` を使用します。                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | 現在のプロセスディレクトリ                              | `--cwd` が省略された場合に `/codex bind` が使用するワークスペースです。                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | 未設定                                                  | オプションの Codex app-server サービスティアです。`"priority"` は高速モードのルーティングを有効にし、`"flex"` は flex 処理を要求し、`null` はオーバーライドを解除します。従来の `"fast"` は `"priority"` として受け付けられます。                                                                                                                                                                                                 |
| `networkProxy`                                | 無効                                               | app-server コマンドで Codex 権限プロファイルのネットワーク機能を使用するためのオプトインです。OpenClaw は選択された `permissions.<profile>.network` 設定を定義し、`sandbox` を送信する代わりに `default_permissions` でそれを選択します。                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | サポート対象の Codex app-server に OpenClaw サンドボックスを基盤とする Codex 環境を登録し、ネイティブ Codex 実行をアクティブな OpenClaw サンドボックス内で実行できるようにするプレビュー版のオプトインです。                                                                                                                                                                                                            |

`appServer.networkProxy` は Codex のサンドボックス契約を変更するため、明示的です。有効にすると、OpenClaw は Codex スレッド設定に `features.network_proxy.enabled` と
`default_permissions` も設定し、生成された権限プロファイルが Codex 管理のネットワークを開始できるようにします。OpenClaw はデフォルトで、プロファイル本体から衝突耐性のある
`openclaw-network-<fingerprint>` プロファイル名を生成します。安定したローカル名が必要な場合にのみ `profileName` を使用してください。

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

通常の app-server ランタイムが `danger-full-access` になる場合、`networkProxy` を有効にすると、生成される権限プロファイルでは代わりにワークスペース形式のファイルシステムアクセスが使用されます。Codex 管理のネットワーク適用はサンドボックス化されたネットワークであるため、フルアクセスプロファイルでは送信トラフィックを保護できません。

Plugin は、古いまたはバージョン情報のない app-server ハンドシェイクをブロックします。Codex app-server は安定版 `0.143.0` 以降を報告する必要があります。

OpenClaw は、非ループバックの WebSocket app-server URL をリモートとして扱い、`appServer.authToken` または `Authorization` ヘッダーによる、アイデンティティ情報を含む WebSocket 認証を要求します。`appServer.authToken` と各 `appServer.headers.*` 値には SecretInput を指定できます。シークレットランタイムは、OpenClaw が app-server の起動オプションを構築する前に SecretRef と環境変数の省略表記を解決し、未解決の構造化 SecretRef がある場合は、トークンやヘッダーが送信される前に失敗します。ネイティブ Codex Plugin が設定されている場合、OpenClaw は接続済み app-server の Plugin コントロールプレーンを使用してそれらの Plugin をインストールまたは更新し、その後アプリのインベントリを更新して、Plugin が所有するアプリを Codex スレッドから参照できるようにします。`app/list` は引き続き信頼できるインベントリおよびメタデータソースですが、一覧にあるアクセス可能なアプリを Codex が現在無効とマークしている場合でも、`thread/start` がそのアプリに `config.apps[appId].enabled = true` を送信するかどうかは OpenClaw のポリシーが決定します。不明または欠落しているアプリ ID は引き続きフェイルクローズされます。このパスは、`plugin/install` を介してマーケットプレイスの Plugin を有効化し、インベントリを更新するだけです。OpenClaw が管理する Plugin のインストールとアプリインベントリの更新を受け入れることを信頼できるリモート app-server にのみ、OpenClaw を接続してください。

## 承認モードとサンドボックスモード

ローカル stdio app-server セッションは、デフォルトで YOLO モードになります。
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"` です。この信頼されたローカルオペレーター向けの構成により、応答する人がいないネイティブ承認プロンプトに阻害されることなく、無人の OpenClaw ターンと Heartbeat を進行できます。

Codex のローカルシステム要件ファイルで暗黙の YOLO 承認、レビュアー、またはサンドボックス値が許可されていない場合、OpenClaw は暗黙のデフォルトを代わりに guardian として扱い、許可された guardian 権限を選択します。`tools.exec.mode: "auto"` も guardian によるレビュー付き Codex 承認を強制し、安全でない従来の `approvalPolicy: "never"` または `sandbox: "danger-full-access"` のオーバーライドを維持しません。意図的に承認なしの構成にするには、`tools.exec.mode: "full"` を設定してください。同じ要件ファイル内でホスト名が一致する `[[remote_sandbox_config]]` エントリも、サンドボックスのデフォルト決定に反映されます。

Codex の guardian によるレビュー付き承認には、`appServer.mode: "guardian"` を設定します。

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

`guardian` プリセットは、それらの値が許可されている場合、`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、および `sandbox: "workspace-write"` に展開されます。個別のポリシーフィールドは `mode` を上書きします。古い `guardian_subagent` レビュアー値は互換性エイリアスとして引き続き受け入れられますが、新しい設定では `auto_review` を使用してください。

OpenClaw サンドボックスが有効な場合でも、ローカルの Codex app-server プロセスは Gateway ホスト上で実行されます。そのため OpenClaw は、Codex のホスト側サンドボックス化を OpenClaw サンドボックスバックエンドと同等とは扱わず、そのターンでは Codex ネイティブの Code Mode、ユーザー MCP サーバー、およびアプリを利用する Plugin の実行を無効にします。通常の exec/process ツールが利用可能な場合、シェルアクセスは `sandbox_exec` や `sandbox_process` など、OpenClaw サンドボックスを基盤とする動的ツールを介して公開されます。

<Note>
Docker を基盤とする OpenClaw サンドボックスホスト（`agents.defaults.sandbox.mode` が Docker バックエンドに設定されている場合）では、`openclaw doctor` は、サンドボックスコンテナ内での `workspace-write` シェル実行に必要な、ネストされた Codex `bwrap` 用の非特権ユーザー名前空間、および Docker サンドボックスのネットワーク送信が無効な場合はネットワーク名前空間を、ホストが許可しているかどうかを確認します。確認に失敗すると、Ubuntu/AppArmor ホストでは通常、`bwrap: setting up uid map: Permission denied` または
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` として表面化します。報告されたホストの名前空間ポリシーを OpenClaw サービスユーザー向けに修正し、Gateway を再起動してください。ホスト全体に適用される `kernel.apparmor_restrict_unprivileged_userns=0` のフォールバックより、サービスプロセスを対象に限定した AppArmor プロファイルを優先してください。また、ネストされた `bwrap` を満たすためだけに、Docker コンテナへより広範な権限を付与しないでください。
</Note>

## サンドボックス化されたネイティブ実行

安定したデフォルト動作はフェイルクローズです。OpenClaw のサンドボックス化が有効な場合、通常は Codex app-server ホストから実行される Codex のネイティブ実行サーフェスが無効になります。OpenClaw のサンドボックスバックエンドで Codex のリモート環境サポートを試す場合にのみ、`appServer.experimental.sandboxExecServer: true` を使用してください。このプレビューパスは、サポートされているすべての Codex app-server バージョンで動作します。

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

このフラグがオンで、現在の OpenClaw セッションがサンドボックス化されている場合、OpenClaw は有効なサンドボックスを基盤とする local loopback exec-server を起動して Codex app-server に登録し、OpenClaw が所有するその環境を使用して Codex スレッドとターンを開始します。app-server が環境を登録できない場合、ホスト実行へ暗黙にフォールバックせず、実行はフェイルクローズされます。

このプレビューパスはローカル専用です。リモート WebSocket app-server は、同じホスト上で実行されていない限りループバック exec-server に到達できないため、OpenClaw はこの組み合わせを拒否します。

## 認証と環境の分離

デフォルトのエージェント別ホームでは、認証は次の順序で選択されます。

1. エージェント用の明示的な OpenClaw Codex 認証プロファイル。
2. そのエージェントの Codex ホームにある app-server の既存アカウント。
3. ローカル stdio app-server の起動に限り、app-server アカウントが存在せず、OpenAI 認証が引き続き必要な場合は、`CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイル（OAuth またはトークンクレデンシャルの種類）を検出すると、起動する Codex 子プロセスから `CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、Gateway レベルの API キーを埋め込みや OpenAI モデルの直接利用に使用可能なまま維持しつつ、ネイティブ Codex app-server のターンが誤って API 経由で課金されるのを防ぎます。

明示的な Codex API キープロファイルとローカル stdio の環境変数キーフォールバックでは、継承された子プロセス環境の代わりに app-server ログインを使用します。WebSocket app-server 接続には Gateway 環境の API キーフォールバックは渡されません。明示的な認証プロファイルまたはリモート app-server 自体のアカウントを使用してください。

stdio app-server の起動時は、デフォルトで OpenClaw のプロセス環境を継承します。OpenClaw は Codex app-server のアカウントブリッジを所有し、`CODEX_HOME` を、そのエージェントの OpenClaw 状態下にあるエージェント別ディレクトリへ設定します。これにより、Codex の設定、アカウント、Plugin のキャッシュとデータ、およびスレッド状態が、オペレーター個人の `~/.codex` ホームから流入せず、OpenClaw エージェントのスコープ内に保たれます。

ネイティブ Codex の状態を Codex Desktop および CLI と共有するには、`appServer.homeScope: "user"` を設定します。このローカルユーザーホームモードは、管理対象の stdio と明示的な Unix トランスポートをサポートします。`$CODEX_HOME` が設定されている場合はそれを使用し、それ以外の場合は `~/.codex` を使用します。これには、ネイティブの認証、設定、Plugin、およびスレッドが含まれます。OpenClaw は app-server に対する認証プロファイルブリッジをスキップします。所有者として検証済みのターンでは、`codex_threads` を使用して、それらのスレッドを一覧表示（任意の `search` フィルター付き）、読み取り、フォーク、名前変更、アーカイブ、およびアーカイブ解除できます。OpenClaw で続行する前にスレッドをフォークしてください。独立した Codex プロセスは、同じスレッドへの同時書き込みを調整しません。

この `homeScope` のオプトインは、通常のハーネスセッションに適用されます。Codex Sessions を介して作成された Chat は、代わりに専用の監視接続を使用します。これにより、正規ブランチと今後の再開で、ネイティブ接続の認証およびプロバイダー設定が維持されます。

モデルが固定された監視対象 Chat では、`codex_threads` を使用して別のフォークをアタッチしたり、Chat に紐付けられたネイティブスレッドをアーカイブしたりできません。一覧表示とメタデータのみの読み取りは引き続き利用できます。生のトランスクリプトの読み取りには `allowRawTranscripts` が必要です。これが無効な場合、ネイティブ検索がトランスクリプトのプレビューに一致する可能性があるため、一覧検索も拒否されます。名前変更、アーカイブ解除、切り離されたフォーク、および他の OpenClaw Chat が所有していない無関係なスレッドのアーカイブには、`allowWriteControls` が必要です。どちらのオプションも、ロックされた紐付けを回避するものではありません。

OpenClaw は、通常のローカル app-server 起動時に `HOME` を書き換えません。`openclaw`、`gh`、`git`、クラウド CLI、シェルコマンドなど、Codex が実行するサブプロセスは通常のプロセスホームを参照し、ユーザーホームの設定とトークンを検出できます。Codex は `$HOME/.agents/skills` と `$HOME/.agents/plugins/marketplace.json` も検出する場合があります。この `.agents` の検出は意図的にオペレーターホームと共有され、分離された `~/.codex` 状態とは別です。

デフォルトのエージェントスコープでは、OpenClaw Plugin と OpenClaw Skills のスナップショットは引き続き OpenClaw 独自の Plugin レジストリと Skills ローダーを介して渡されますが、個人用 Codex `~/.codex` アセットは渡されません。分離された OpenClaw エージェントに組み込むべき有用な Codex CLI Skills や Plugin が Codex ホームにある場合は、明示的にインベントリを作成してください。

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

デプロイメントで追加の環境分離が必要な場合は、それらの変数を `appServer.clearEnv` に追加します。

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

`appServer.clearEnv` が影響するのは、起動された Codex app-server 子プロセスのみです。OpenClaw は、ローカル起動の正規化中にこのリストから `CODEX_HOME` と `HOME` を削除します。`CODEX_HOME` は選択されたエージェントまたはユーザースコープを引き続き指し、`HOME` は継承されたままになるため、サブプロセスは通常のユーザーホーム状態を使用できます。

## 動的ツール

Codex の動的ツールは、デフォルトで `searchable` 読み込みとなり、`openclaw` 名前空間の下で `deferLoading: true` を使用して公開されます。OpenClaw は通常、Codex ネイティブのワークスペース操作や Codex 独自のツール検索サーフェスと重複する動的ツールを公開しません。

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

有限のランタイム許可リストによってネイティブ Code Mode が無効になる場合、OpenClaw は空の実行環境選択を送信します。その直接的な非サンドボックス環境では、OpenClaw はポリシーでフィルタリングされた `exec` および `process` ツールをシェルのフォールバックとして維持します。ランタイム許可リストと `codexDynamicToolsExclude` は引き続き適用されます。

OpenClaw の残りの統合ツールの大半（メッセージング、メディア、cron、
ブラウザー、ノード、Gateway、`heartbeat_respond`、`web_search` など）は、その名前空間の
Codex ツール検索を通じて利用できます。これにより、モデルの初期
コンテキストを小さく保てます。一部のツールは、
`codexDynamicToolsLoading` に関係なく直接呼び出せます。Codex ツール検索が利用できない場合や、
コネクターのみのユニバースに解決される場合があるためです。そのツールは `agents_list`、`sessions_spawn`、
`sessions_yield` です。開発者向け指示は引き続き、通常の Codex サブエージェントを
Codex ネイティブのサブエージェント作業ではネイティブの `spawn_agent` へ誘導し、
明示的な OpenClaw または ACP の委任には `sessions_spawn` を利用できます。
メッセージツールのみを使用するソース返信も、ターン制御の契約であるため、
引き続き直接処理されます。

OpenClaw の `computer`
ツールを含む `catalogMode: "direct-only"` とマークされたツールは、`openclaw_direct` の配下にグループ化されます。OpenClaw は、オペレーターが指定したエントリを
置き換えることなく、その名前空間を Codex の `code_mode.direct_only_tool_namespaces` リストに追加します。
そのため Codex は、これらのツールをネストされた Code Mode の `tools.*` 呼び出しを
介してルーティングする代わりに、通常のスレッドとコードモード専用スレッドで
`DirectModelOnly` として公開します。この境界は、画像を含む結果に必要です。
ネストされた Code Mode のシリアル化では画像出力がテキストに平坦化されるため、
次のコンピューター操作に必要なスクリーンショットが失われます。

遅延動的ツールを検索できないカスタム Codex app-server に接続する場合、または
完全なツールペイロードをデバッグする場合にのみ、`codexDynamicToolsLoading: "direct"` を設定してください。

## タイムアウト

OpenClaw が所有する動的ツール呼び出しは、
`appServer.requestTimeoutMs` とは独立して制限されます。各 Codex `item/tool/call` リクエストでは、
次の順序で最初に利用可能なタイムアウトを使用します。

- 呼び出しごとの正の `timeoutMs` 引数。
- `image_generate` の場合は、`agents.defaults.imageGenerationModel.timeoutMs`。
- タイムアウトが設定されていない `image_generate` の場合は、画像生成のデフォルトである 120 秒。
- メディア理解の `image` ツールの場合は、ミリ秒に変換した `tools.media.image.timeoutSeconds`、
  またはメディアのデフォルトである 60 秒。画像理解では、これはリクエスト自体に適用され、
  それ以前の準備作業によって短縮されません。
- `message` ツールの場合は、固定のデフォルトである 120 秒。
- 動的ツールのデフォルトである 90 秒。

このウォッチドッグは、外側の動的 `item/tool/call` の予算です。プロバイダー固有の
リクエストタイムアウトはその呼び出し内で実行され、独自のタイムアウトセマンティクスを維持します。
動的ツールの予算は 600000 ms が上限です。タイムアウトすると、OpenClaw は対応している場合に
ツールシグナルを中止し、失敗した動的ツール応答を
Codex に返します。これにより、セッションを
`processing` のままにせず、ターンを続行できます。

Codex がターンを受け入れた後、および OpenClaw がターンスコープの
app-server リクエストに応答した後、ハーネスは Codex が現在のターンを進行させ、
最終的に `turn/completed` でネイティブターンを完了することを想定します。
app-server が `appServer.turnCompletionIdleTimeoutMs` の間何も送信しない場合、OpenClaw は
ベストエフォートで Codex ターンを中断し、診断用タイムアウトを記録して、
OpenClaw セッションレーンを解放します。これにより、後続のチャットメッセージが
停止したネイティブターンの後ろでキューに入ることを防ぎます。

同じターンのほとんどの非終端通知は、Codex がターンの継続を証明したため、
この短いウォッチドッグを解除します。ツールの引き渡しでは、より長い
ツール後アイドル予算を使用します。具体的には、OpenClaw が `item/tool/call` 応答を返した後、
`commandExecution` などのネイティブツール項目が完了した後、生の
`custom_tool_call_output` 完了後、およびツール後の生のアシスタント進行、
生の推論完了、または推論進行の後です。このガードは、設定されている場合は
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` を使用し、
それ以外の場合はデフォルトで 5 分です。同じツール後予算は、Codex が次の
現在ターンイベントを送出する前の無音の統合期間についても、進行ウォッチドッグを延長します。
推論完了、コメンタリー `agentMessage`
完了、ツール前の生の推論またはアシスタント進行の後には、自動的な最終返信が続く可能性があるため、
セッションレーンを即座に解放する代わりに、進行後返信ガードを使用します。最終／非コメンタリーの
完了済み `agentMessage` 項目とツール前の生のアシスタント完了のみが、
アシスタント出力解放を作動させます。その後 Codex が `turn/completed` なしで
何も送信しなくなった場合、OpenClaw はベストエフォートでネイティブターンを中断し、
セッションレーンを解放します。アシスタント、ツール、アクティブ項目、または副作用の証拠がない
ターン完了アイドルタイムアウトを含む、リプレイ可能で安全な stdio app-server 障害は、
新しい app-server 試行で 1 回再試行されます。安全でないタイムアウトでは、停止した
app-server クライアントを破棄し、OpenClaw セッションレーンを解放します。また、
自動的にリプレイする代わりに、古いネイティブスレッドのバインディングを
クリアします。完了監視のタイムアウトでは、Codex 固有のタイムアウトテキストが表示されます。
リプレイ可能で安全な場合は応答が不完全な可能性があることを示し、安全でない場合は
再試行前に現在の状態を確認するようユーザーに伝えます。公開タイムアウト診断には、
最後の app-server 通知メソッド、生のアシスタント応答項目の id/type/role、
アクティブなリクエスト／項目数、作動中の監視状態などの構造化フィールドが含まれます。
最後の通知が生のアシスタント応答項目の場合は、長さを制限したアシスタントテキストの
プレビューも含まれます。生のプロンプトやツールの内容は
含まれません。

## モデルの検出

デフォルトでは、Codex Plugin は app-server に利用可能なモデルを問い合わせます。モデルの
可用性は Codex app-server が所有するため、OpenClaw がバンドル済みの
`@openai/codex` バージョンをアップグレードした場合や、デプロイメントで
`appServer.command` が別の Codex バイナリを指す場合に、リストが変わる可能性があります。
可用性はアカウントスコープの場合もあります。実行中の Gateway で `/codex models` を使用すると、
そのハーネスとアカウントのライブカタログを確認できます。

検出に失敗するかタイムアウトした場合、OpenClaw はバンドル済みのフォールバックカタログを使用します。

| モデル ID       | 表示名 | 推論エフォート        |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
現在バンドルされているハーネスは `@openai/codex` `0.144.3` です。バンドル済み app-server に対する
`model/list` プローブでは、次の公開ピッカー行が返されました。

| モデル ID        | 入力モダリティ | 推論エフォート                    |
| --------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`   | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra` | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`  | text, image      | low, medium, high, xhigh, max        |
| `gpt-5.5`       | text, image      | low, medium, high, xhigh             |
| `gpt-5.4`       | text, image      | low, medium, high, xhigh             |
| `gpt-5.4-mini`  | text, image      | low, medium, high, xhigh             |
| `gpt-5.2`       | text, image      | low, medium, high, xhigh             |

app-server カタログは `ultra` を報告できますが、OpenClaw の推論コントロールが現在
公開するレベルは `max` までです。

ライブのピッカー行はアカウントスコープであり、アカウント、Codex
カタログ、またはバンドル版によって変わる可能性があります。特定時点の表に依存せず、
現在のリストを確認するには `/codex models` を実行してください。内部または特殊なフロー向けの
非表示モデルも、通常のモデルピッカーの選択肢ではないまま
app-server カタログに表示されることがあります。
</Note>

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

起動時に Codex のプローブを避け、フォールバックカタログのみを使用する場合は、
検出を無効にします。

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

Codex は、ネイティブのプロジェクトドキュメント検出を通じて `AGENTS.md` 自体を処理します。
OpenClaw は、合成した Codex プロジェクトドキュメントファイルを書き込まず、ペルソナファイルについて
Codex のフォールバックファイル名にも依存しません。Codex のフォールバックが適用されるのは、
`AGENTS.md` が存在しない場合のみであるためです。

OpenClaw ワークスペースとの同等性を確保するため、Codex ハーネスはその他の
ブートストラップファイルを開発者向け指示として転送しますが、すべて同じ方法ではありません。

- `TOOLS.md` は Codex の**継承される**開発者向け指示として転送されるため、
  ターン中に生成されたネイティブ Codex サブエージェントにも表示されます。
- `SOUL.md`、`IDENTITY.md`、`USER.md` は、**ターンスコープ**の
  コラボレーション指示として転送されます。ネイティブ Codex サブエージェントはこれらを継承しないため、
  サブエージェントのターンが親エージェントのペルソナや
  ユーザープロファイルを取り込むことを防ぎます。
- 読み込まれた OpenClaw Skills のコンパクトなリストも、ターンスコープの
  コラボレーション用開発者向け指示として転送されるため、ネイティブ Codex サブエージェントは
  これも継承しません。
- `HEARTBEAT.md` の内容は注入されません。Heartbeat ターンには、
  ファイルが存在し、空でない場合にそのファイルを読み取るための
  コラボレーションモードのポインターが提供されます。
- 設定されたエージェントワークスペースの `MEMORY.md` の内容は、その
  ワークスペースでメモリツールが利用可能な場合、ネイティブ Codex ターン入力に貼り付けられません。
  存在する場合、ハーネスは小さなワークスペースメモリの
  ポインターをターンスコープのコラボレーション用開発者向け指示に追加し、永続メモリが関連する場合、
  Codex は `memory_search` または `memory_get` を使用する必要があります。
  ツールが無効な場合、メモリ検索が利用できない場合、またはアクティブな
  ワークスペースがエージェントメモリのワークスペースと異なる場合、`MEMORY.md` は
  通常の制限付きターンコンテキスト経路を使用します。
- `BOOTSTRAP.md` が存在する場合、OpenClaw のターン入力参照
  コンテキストとして転送されます。

## 環境オーバーライド

ローカルテストでは、引き続き環境オーバーライドを利用できます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` が未設定の場合、
`OPENCLAW_CODEX_APP_SERVER_BIN` は管理対象バイナリをバイパスします。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、1 回限りのローカルテストには
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。反復可能なデプロイメントでは、
Codex ハーネスの残りのセットアップと同じレビュー済みファイル内に Plugin の動作を保持できるため、
設定の使用を推奨します。

## 関連項目

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [Codex の監督](/ja-JP/plugins/codex-supervision)
- [ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins)
- [Codex Computer Use](/ja-JP/plugins/codex-computer-use)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [設定リファレンス](/ja-JP/gateway/configuration-reference)
