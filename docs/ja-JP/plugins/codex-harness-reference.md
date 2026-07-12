---
read_when:
    - Codex ハーネスのすべての設定フィールドが必要です
    - app-server のトランスポート、認証、検出、またはタイムアウトの動作を変更する場合
    - Codex ハーネスの起動、モデル検出、または環境分離をデバッグしている場合
summary: Codex ハーネスの設定、認証、検出、アプリサーバーに関するリファレンス
title: Codex ハーネスリファレンス
x-i18n:
    generated_at: "2026-07-12T14:37:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eb3dcb14d9dbd70a225c13f239369b6d9d2cc0b0681aa29265f528287a6a8e4c
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

このリファレンスでは、公式 `codex` Plugin の詳細な設定について説明します。
セットアップとルーティングの判断については、まず
[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。

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

| フィールド                 | デフォルト               | 意味                                                                                                                                                     |
| -------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 有効                     | Codex app-server の `model/list` に対するモデル検出設定。                                                                                                 |
| `appServer`                | 管理対象の stdio app-server | トランスポート、コマンド、認証、承認、サンドボックス、タイムアウトの設定。通常のハーネスでは、デフォルトでエージェントスコープの状態を使用します。       |
| `codexDynamicToolsLoading` | `"searchable"`           | `"direct"` を使用すると、OpenClaw の動的ツールが Codex の初期ツールコンテキストに直接配置されます。                                                       |
| `codexDynamicToolsExclude` | `[]`                     | Codex app-server のターンから除外する、追加の OpenClaw 動的ツール名。                                                                                     |
| `codexPlugins`             | 無効                     | 接続済みアカウントのアプリへのオプトインアクセスを含む、ネイティブ Codex Plugin／アプリのサポート。[ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins)を参照してください。 |
| `computerUse`              | 無効                     | Codex Computer Use のセットアップ。[Codex Computer Use](/ja-JP/plugins/codex-computer-use)を参照してください。                                                 |
| `supervision`              | 無効                     | アーカイブされていないネイティブセッションのカタログ、ローカルブランチの継続、エージェントツールポリシー。[Codex 監督](/plugins/codex-supervision)を参照してください。 |

## 監督

監督では、Gateway コンピューターおよびオプトインしたペアリング済み Node から、
アーカイブされていない Codex セッションを一覧表示します。エージェントハーネスとは
独立して有効にします。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

`supervision` のフィールド：

| フィールド            | デフォルト                  | 意味                                                                                                                                                                                                                                                   |
| --------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`             | `false`                     | ローカルセッションカタログを公開し、Gateway 上では、Codex Sessions ページ向けにオプトインしたペアリング済み Node のカタログを集約します。                                                                                                              |
| `endpoints`           | 組み込みローカルエンドポイント | 維持されている Codex 監督エージェントとスタンドアロン MCP ツール向けの互換性および高度なエンドポイントターゲット。人向けカタログとブランチフローではこれらのターゲットを無視し、`appServer` から解決された監督用 App Server を使用します。                |
| `allowRawTranscripts` | `false`                     | 監督を有効にした状態で、自律エージェントまたはスタンドアロン MCP によるトランスクリプトの読み取りと、トランスクリプトから派生する一覧フィールドを許可します。`codex_threads` のメタデータのみの読み取りは引き続き利用できます。認証済み Control UI の継続は制御しません。 |
| `allowWriteControls`  | `false`                     | 監督を有効にした状態で、自律的な `codex_threads` のフォーク、名前変更、アーカイブ、アーカイブ解除の変更、およびスタンドアロン MCP の送信、誘導、中断操作を許可します。他のバインディング、ホスト、ステータス、確認のチェックを回避するものではありません。 |

エンドポイントエントリでは、次のフィールドを指定できます。

| フィールド     | 適用対象      | 意味                                                                    |
| -------------- | ------------- | ----------------------------------------------------------------------- |
| `id`           | すべて        | 安定したエンドポイント ID。                                             |
| `label`        | すべて        | オプションの表示ラベル。                                                 |
| `transport`    | すべて        | `"stdio-proxy"` または `"websocket"`。                                  |
| `command`      | `stdio-proxy` | オプションの App Server コマンド。                                       |
| `args`         | `stdio-proxy` | オプションのコマンド引数。                                               |
| `cwd`          | `stdio-proxy` | オプションの子プロセス作業ディレクトリ。                                 |
| `url`          | `websocket`   | 必須の WebSocket URL またはサポートされるローカルソケット URL。           |
| `authTokenEnv` | `websocket`   | 値を使用してエンドポイントを認証する、オプションの環境変数。             |

**Codex Sessions** ページは Plugin の監督用 App Server を使用し、
アーカイブされていないセッションのみを表示します。明示的な `appServer` 接続設定が
ない場合、その接続には管理対象のユーザーホーム stdio が使用されます。保存済みまたは
アイドル状態のローカル行から、最後に永続化された終端ソースターンまでの範囲に限定された
ユーザーおよびアシスタント履歴を持つ、モデル固定の Chat を作成できます。そのプライベート
バインディングにより、スナップショットのフォーク、正規の `appServer` ソースブランチ、
履歴の注入、および以降のターンはその接続上に維持されます。最初の正規開始では、フォークから
返されたペアを使用します。以降の再開では OpenClaw のモデルとプロバイダーのオーバーライドを
省略し、Codex が正規スレッドに永続化されたペアを復元できるようにします。別のネイティブな
変更によってそのペアを更新できますが、外側のモデルとフォールバックチェーンがそれを置き換える
ことはありません。保存済みおよびアイドル状態の行は、他のランナーが存在しないことを確認した後で
アーカイブできます。ただし、別のアクティブな OpenClaw バインディングが同一のターゲット、または
そこから生成されたアーカイブされていない子孫のいずれかを所有している場合は除きます。OpenClaw は
Codex の子孫ページネーションに従い、列挙エラー、循環、または安全上限の枯渇時にはフェイルクローズします。
確認は引き続き、不明なネイティブクライアントと、ステータス確認からアーカイブまでの競合を対象とします。
監督対象のモデル固定 Chat は、ネイティブバインディングを保護している間は削除できません。
アクティブなソースからブランチを作成したりアーカイブしたりすることはできませんが、既存の監督対象
Chat は引き続き開くことができます。ペアリング済み Node の各行は読み取り専用のままです。Node
トランスポートは、ハーネスに必要なストリーミングライフサイクルをまだ提供していません。

`appServer.homeScope: "user"` だけでは、管理対象ハーネスプロセスが使用する Codex ホームが
変わるだけであり、フリートカタログは公開されません。監督を有効にしても、ハーネスのデフォルトは
変わりません。代わりに、明示的な `appServer` 接続設定が存在しない場合、独立した監督接続は
デフォルトで管理対象のユーザーホーム stdio を使用します。明示的な設定は、その接続で尊重されます。
保留中および確定済みの監督対象バインディングは、すべてのターンでその接続を維持します。監督が無効に
なった場合や、接続またはライフサイクルにずれが生じた場合は、エージェントホームのハーネスに
フォールバックせず、フェイルクローズします。デフォルト接続は、ネイティブ Codex クライアントと
保存済みセッションを共有しますが、それらのプロセスローカルなアクティビティ状態は共有しません。

従来の `plugins.entries.codex-supervisor` 設定は廃止されています。
`openclaw doctor --fix` を実行して、古いエントリ、エンドポイント定義、ポリシーフラグ、
Plugin の許可／拒否参照をこのブロックに移行してください。競合する場合は、明示的な正規の
`codex.config.supervision` 値が優先されます。

## App-server トランスポート

通常のハーネスターンでは、OpenClaw は公式 Plugin に同梱された管理対象の Codex バイナリ
（現在は `@openai/codex` `0.144.1`）を起動します。

```bash
codex app-server --listen stdio://
```

これにより、app-server のバージョンは、ローカルに別途インストールされている Codex CLI ではなく、
公式 `codex` Plugin に結び付けられます。別の実行可能ファイルを意図的に使用する場合にのみ、
`appServer.command` を設定してください。デフォルトの分離されたエージェントホームを使用する
通常の管理対象ターンでは、macOS デスクトップバンドルがインストールされている場合でも、この固定
パッケージが優先されます。[Computer Use](/ja-JP/plugins/codex-computer-use) が有効な場合、または
`homeScope` が `"user"` でネイティブ Computer Use の状態を読み込める場合、管理対象の起動では、
必要な macOS 権限を所有するデスクトップアプリのバイナリが代わりに優先されます。同じデスクトップ
優先ルールは、分離されたエージェントホームの有効な Codex 設定でネイティブ Computer Use が有効に
なっている場合にも適用されます。デスクトップアプリのバンドルがインストールされていない場合、
OpenClaw は固定パッケージのバイナリにフォールバックします。

実行可能ファイルの引き継ぎとネイティブ設定のフェンシングにより、1 つの実行中 Gateway プロセス内の
クライアントが調整されます。別のプロセスがネイティブ Codex Plugin の設定を変更した後は、
Gateway を再起動してください。

監督は別の接続を解決します。明示的な `appServer` 接続設定がない場合、監督では
`homeScope: "user"` を指定した管理対象 stdio を使用し、通常のハーネスでは引き続き
`homeScope: "agent"` を指定した管理対象 stdio を使用します。明示的な接続設定は両方のパスで
尊重されます。通常のハーネスでネイティブクライアントと `$CODEX_HOME`（または `~/.codex`）を
共有する必要がある場合は、`homeScope: "user"` を明示的に設定してください。プライベートな
監督対象バインディングは、通常のハーネスのデフォルトにかかわらず、監督接続を使用します。
独立した App Server プロセスは、それぞれ別個のライブステータスと承認状態を維持します。

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

| フィールド                                     | デフォルト                                             | 意味                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` は Codex を起動します。明示的な `"unix"` はローカルの制御ソケットに接続し、`"websocket"` は `url` に接続します。                                                                                                                                                                                                                                                                           |
| `homeScope`                                   | `"agent"`                                              | `"agent"` は通常のハーネス状態を OpenClaw エージェントごとに分離します。`"user"` は明示的なオプトインで、ネイティブの `$CODEX_HOME` または `~/.codex` を共有し、ネイティブ認証を使用して、所有者専用のスレッド管理を有効にします。ユーザースコープはローカルの stdio または Unix トランスポートをサポートします。別個の監視接続では、未設定の値は stdio または Unix の場合は `"user"`、WebSocket の場合は `"agent"` に解決されます。 |
| `command`                                     | 管理対象の Codex バイナリ                              | stdio トランスポート用の実行可能ファイルです。管理対象のバイナリを使用する場合は未設定のままにします。                                                                                                                                                                                                                                                                                              |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio トランスポート用の引数です。                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 未設定                                                 | WebSocket App Server URL または `unix://` URL です。明示的に空の Unix パスを指定すると、標準のユーザーホーム制御ソケットが選択されます。                                                                                                                                                                                                                                                             |
| `authToken`                                   | 未設定                                                 | WebSocket トランスポート用の Bearer トークンです。リテラル文字列、または `${CODEX_APP_SERVER_TOKEN}` などの SecretInput を受け付けます。                                                                                                                                                                                                                                                             |
| `headers`                                     | `{}`                                                   | 追加の WebSocket ヘッダーです。ヘッダー値にはリテラル文字列または SecretInput 値を使用できます。例: `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                                 |
| `clearEnv`                                    | `[]`                                                   | OpenClaw が継承環境を構築した後、起動された stdio app-server プロセスから削除する追加の環境変数名です。                                                                                                                                                                                                                                                                                              |
| `remoteWorkspaceRoot`                         | 未設定                                                 | リモート Codex app-server のワークスペースルートです。設定すると、OpenClaw は解決済みの OpenClaw ワークスペースからローカルワークスペースルートを推測し、このリモートルート配下で現在の cwd のサフィックスを維持し、最終的な app-server の cwd のみを Codex に送信します。cwd が解決済みの OpenClaw ワークスペースルート外にある場合、OpenClaw は Gateway ローカルのパスをリモート app-server に送信せず、フェイルクローズします。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server のコントロールプレーン呼び出しのタイムアウトです。                                                                                                                                                                                                                                                                                                                                      |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex がターンを受け入れた後、またはターンスコープの app-server リクエストの後、OpenClaw が `turn/completed` を待機する際の無通信時間枠です。                                                                                                                                                                                                                                                         |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw が `turn/completed` を待機している間、ツールへの引き渡し、ネイティブツールの完了、ツール後の未加工アシスタント進行、未加工の推論完了、または推論進行の後に使用される、完了アイドルおよび進行状況ガードです。ツール後の統合処理が最終的なアシスタント応答の猶予時間より長く正当に無通信状態となる可能性がある、信頼済みまたは高負荷のワークロードに使用します。                                   |
| `mode`                                        | ローカルの Codex 要件で YOLO が許可されない場合を除き `"yolo"` | YOLO 実行またはガーディアンによるレビュー付き実行のプリセットです。                                                                                                                                                                                                                                                                                                                                |
| `approvalPolicy`                              | `"never"` または許可されたガーディアン承認ポリシー     | スレッドの開始、再開、およびターン時に送信されるネイティブ Codex 承認ポリシーです。                                                                                                                                                                                                                                                                                                                  |
| `sandbox`                                     | `"danger-full-access"` または許可されたガーディアンサンドボックス | スレッドの開始および再開時に送信されるネイティブ Codex サンドボックスモードです。有効な OpenClaw サンドボックスは、`danger-full-access` ターンを Codex の `workspace-write` に制限します。ターンのネットワークフラグは OpenClaw サンドボックスの外向き通信設定に従います。                                                                                                                                 |
| `approvalsReviewer`                           | `"user"` または許可されたガーディアンレビュアー        | 許可されている場合に Codex にネイティブ承認プロンプトをレビューさせるには、`"auto_review"` を使用します。                                                                                                                                                                                                                                                                                           |
| `defaultWorkspaceDir`                         | 現在のプロセスディレクトリ                             | `--cwd` が省略された場合に `/codex bind` が使用するワークスペースです。                                                                                                                                                                                                                                                                                                                             |
| `serviceTier`                                 | 未設定                                                 | オプションの Codex app-server サービス階層です。`"priority"` は高速モードのルーティングを有効にし、`"flex"` は flex 処理を要求し、`null` はオーバーライドを解除します。従来の `"fast"` は `"priority"` として受け付けられます。                                                                                                                                                                          |
| `networkProxy`                                | 無効                                                   | app-server コマンドで Codex 権限プロファイルのネットワーク機能を使用するようオプトインします。OpenClaw は選択された `permissions.<profile>.network` 設定を定義し、`sandbox` を送信する代わりに `default_permissions` でその設定を選択します。                                                                                                                                                            |
| `experimental.sandboxExecServer`              | `false`                                                | サポート対象の Codex app-server に OpenClaw サンドボックスを基盤とする Codex 環境を登録し、ネイティブ Codex 実行を有効な OpenClaw サンドボックス内で実行できるようにする、プレビュー版のオプトインです。                                                                                                                                                                                                |

`appServer.networkProxy` は Codex サンドボックスの契約を変更するため、
明示的な設定です。有効にすると、生成された権限プロファイルが Codex 管理の
ネットワーク機能を開始できるよう、OpenClaw は Codex スレッド設定に
`features.network_proxy.enabled` と `default_permissions` も設定します。
OpenClaw はデフォルトで、プロファイル本体から衝突耐性のある
`openclaw-network-<fingerprint>` プロファイル名を生成します。安定したローカル名が
必要な場合にのみ `profileName` を使用してください。

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
`networkProxy` を有効にすると、生成される権限プロファイルには代わりに
ワークスペース形式のファイルシステムアクセスが使用されます。Codex が管理するネットワーク強制は
サンドボックス化されたネットワーク機能であるため、フルアクセスプロファイルでは送信トラフィックを保護できません。

Plugin は、古いバージョンまたはバージョンなしの app-server ハンドシェイクをブロックします。Codex app-server は、
安定版バージョン `0.143.0` 以降を報告する必要があります。

OpenClaw は、非ループバックの WebSocket app-server URL をリモートとして扱い、
`appServer.authToken` または `Authorization` ヘッダーによる
ID 情報を含む WebSocket 認証を要求します。`appServer.authToken` および各 `appServer.headers.*`
値には SecretInput を使用できます。シークレットランタイムは、OpenClaw が app-server の起動オプションを構築する前に
SecretRef と環境変数の省略記法を解決し、未解決の
構造化 SecretRef がある場合は、トークンやヘッダーを送信する前に失敗します。ネイティブ
Codex Plugin が構成されている場合、OpenClaw は接続済み app-server の Plugin
コントロールプレーンを使用してそれらの Plugin をインストールまたは更新し、その後アプリの
インベントリを更新して、Plugin が所有するアプリを Codex スレッドから参照できるようにします。`app/list` は
引き続き正式なインベントリおよびメタデータソースですが、一覧に含まれるアクセス可能なアプリについて、
Codex が現在無効とマークしている場合でも、`thread/start` が
`config.apps[appId].enabled = true` を送信するかどうかは OpenClaw のポリシーが決定します。不明または
欠落しているアプリ ID は引き続きフェイルクローズされます。このパスは `plugin/install` を介してマーケットプレイスの
Plugin を有効化し、インベントリを更新するだけです。OpenClaw が管理する Plugin のインストールと
アプリインベントリの更新を受け入れることが信頼できるリモート app-server にのみ、OpenClaw を接続してください。

## 承認モードとサンドボックスモード

ローカルの stdio app-server セッションは、デフォルトで YOLO モードになります。
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"` が設定されます。この信頼されたローカルオペレーター向けの構成により、
無人の OpenClaw ターンと Heartbeat は、応答する人がいないネイティブの承認
プロンプトに妨げられずに処理を進められます。

Codex のローカルシステム要件ファイルで暗黙の YOLO 承認、
レビュアー、またはサンドボックス値が許可されていない場合、OpenClaw は代わりに暗黙のデフォルトを guardian
として扱い、許可された guardian 権限を選択します。`tools.exec.mode: "auto"`
も guardian によるレビュー付き Codex 承認を強制し、安全でない
従来の `approvalPolicy: "never"` または `sandbox: "danger-full-access"` オーバーライドは維持しません。
意図的に承認なしの構成にするには、`tools.exec.mode: "full"` を設定してください。
同じ要件ファイル内でホスト名に一致する `[[remote_sandbox_config]]` エントリは、
サンドボックスのデフォルト決定時に考慮されます。

Codex の guardian によるレビュー付き承認を使用するには、`appServer.mode: "guardian"` を設定します。

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
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、および
`sandbox: "workspace-write"` に展開されます。個別のポリシーフィールドは `mode` をオーバーライドします。古い
`guardian_subagent` レビュアー値も互換エイリアスとして引き続き受け付けられますが、
新しい構成では `auto_review` を使用してください。

OpenClaw サンドボックスが有効な場合でも、ローカルの Codex app-server プロセスは
Gateway ホスト上で実行されます。そのため OpenClaw は、Codex のホスト側サンドボックス化を
OpenClaw サンドボックスバックエンドと同等に扱うのではなく、そのターンでは Codex ネイティブの Code Mode、
ユーザー MCP サーバー、およびアプリを基盤とする Plugin 実行を無効にします。
通常の exec/process ツールが利用可能な場合、シェルアクセスは
`sandbox_exec` や `sandbox_process` など、OpenClaw サンドボックスを基盤とする動的ツールを通じて提供されます。

<Note>
Docker を基盤とする OpenClaw サンドボックスホスト（`agents.defaults.sandbox.mode` が
Docker バックエンドに設定されている場合）では、`openclaw doctor` は、
サンドボックスコンテナ内での `workspace-write`
シェル実行にネストされた Codex `bwrap` が必要とする非特権ユーザー名前空間、および Docker サンドボックスのネットワーク送信が無効な場合は
ネットワーク名前空間を、ホストが許可しているかどうかを検査します。検査に失敗すると、通常は
Ubuntu/AppArmor ホスト上で `bwrap: setting up uid map: Permission denied` または
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` と表示されます。
OpenClaw サービスユーザーについて、報告されたホストの名前空間ポリシーを修正し、Gateway を再起動してください。
ホスト全体の `kernel.apparmor_restrict_unprivileged_userns=0` フォールバックよりも、
サービスプロセス向けにスコープを限定した AppArmor プロファイルを優先してください。また、ネストされた `bwrap` の要件を満たすためだけに、
Docker コンテナへより広範な権限を付与しないでください。
</Note>

## サンドボックス化されたネイティブ実行

安定版のデフォルトはフェイルクローズです。有効な OpenClaw サンドボックスは、
通常であれば Codex app-server ホストから実行される Codex ネイティブ実行サーフェスを無効にします。
OpenClaw のサンドボックスバックエンドで Codex のリモート環境サポートを試す場合にのみ、
`appServer.experimental.sandboxExecServer: true` を使用してください。
このプレビューパスは、サポートされているすべての Codex app-server バージョンで動作します。

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
有効なサンドボックスを基盤とする local loopback exec-server を起動して
Codex app-server に登録し、OpenClaw が所有するその環境で Codex のスレッドとターンを開始します。
app-server が環境を登録できない場合、ホスト実行へ暗黙にフォールバックすることなく、
実行はフェイルクローズされます。

このプレビューパスはローカル専用です。リモート WebSocket app-server は、
同じホストで実行されていない限りループバック exec-server に到達できないため、OpenClaw は
この組み合わせを拒否します。

## 認証と環境の分離

デフォルトのエージェント単位のホームでは、認証は次の順序で選択されます。

1. エージェント向けの明示的な OpenClaw Codex 認証プロファイル。
2. そのエージェントの Codex ホームにある app-server の既存アカウント。
3. ローカルの stdio app-server 起動の場合に限り、app-server アカウントが存在せず、
   OpenAI 認証が引き続き必要な場合は、`CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイル（OAuth または
トークン資格情報タイプ）を検出すると、起動する Codex 子プロセスから
`CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、埋め込みや
OpenAI モデルの直接利用では Gateway レベルの API キーを引き続き使用できる一方で、
ネイティブ Codex app-server のターンが誤って API 経由で課金されるのを防ぎます。

明示的な Codex API キープロファイルとローカル stdio の環境変数キーへのフォールバックでは、
継承した子プロセスの環境変数ではなく app-server ログインを使用します。WebSocket app-server
接続には Gateway の環境変数 API キーへのフォールバックは渡されません。明示的な認証
プロファイルまたはリモート app-server 自身のアカウントを使用してください。

stdio app-server の起動時には、デフォルトで OpenClaw のプロセス環境が継承されます。
OpenClaw は Codex app-server のアカウントブリッジを管理し、`CODEX_HOME` を
そのエージェントの OpenClaw 状態配下にあるエージェント単位のディレクトリへ設定します。これにより、Codex の
構成、アカウント、Plugin のキャッシュ/データ、およびスレッド状態は、
オペレーター個人の `~/.codex` ホームから流入せず、OpenClaw
エージェントに限定されます。

ネイティブ Codex の状態を Codex Desktop および CLI と共有するには、
`appServer.homeScope: "user"` を設定します。このローカルユーザーホームモードは、管理対象の stdio と
明示的な Unix トランスポートをサポートします。`$CODEX_HOME` が設定されている場合はそれを使用し、
それ以外の場合は `~/.codex` を使用します。これにはネイティブ認証、構成、Plugin、スレッドが含まれます。
OpenClaw は app-server に対する認証プロファイルブリッジをスキップします。検証済みの所有者による
ターンでは、`codex_threads` を使用して、それらのスレッドを一覧表示（任意の `search` フィルター付き）、
読み取り、フォーク、名前変更、アーカイブ、およびアーカイブ解除できます。OpenClaw で続行する前に
スレッドをフォークしてください。独立した Codex プロセスは、同じスレッドに対する
同時書き込みを調整しません。

この `homeScope` のオプトインは、通常のハーネスセッションに適用されます。Codex Sessions を通じて作成された
Chat は、代わりに専用の監督接続を使用します。これにより、正規ブランチと
今後の再開に対して、ネイティブ接続の認証およびプロバイダー構成が維持されます。

モデルが固定された監督対象 Chat では、`codex_threads` は別の
フォークをアタッチできず、Chat に紐付けられたネイティブスレッドをアーカイブすることもできません。一覧表示とメタデータのみの読み取りは
引き続き利用できます。未加工のトランスクリプトを読み取るには `allowRawTranscripts` が必要です。これが
無効な場合、ネイティブ検索がトランスクリプトのプレビューに一致する可能性があるため、一覧検索も拒否されます。
別の OpenClaw Chat が所有していない無関係なスレッドの名前変更、アーカイブ解除、
切り離されたフォーク、およびアーカイブには、`allowWriteControls` が必要です。
どちらのオプションも、ロックされたバインディングを回避することはできません。

OpenClaw は、通常のローカル app-server 起動時に `HOME` を書き換えません。
`openclaw`、`gh`、`git`、クラウド CLI、シェルコマンドなどの Codex が実行する
サブプロセスは、通常のプロセスホームを参照し、ユーザーホームの構成と
トークンを検出できます。また Codex は、`$HOME/.agents/skills` と
`$HOME/.agents/plugins/marketplace.json` を検出する場合があります。この `.agents` の検出は、
意図的にオペレーターホームと共有され、分離された
`~/.codex` 状態とは別のものです。

デフォルトのエージェントスコープでは、OpenClaw Plugin と OpenClaw Skills のスナップショットは
引き続き OpenClaw 独自の Plugin レジストリと Skills ローダーを経由しますが、個人用の
Codex `~/.codex` アセットは経由しません。Codex ホームにある有用な Codex CLI Skills や
Plugin を分離された OpenClaw エージェントの一部にする場合は、それらを明示的に
インベントリ化してください。

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

デプロイメントで追加の環境分離が必要な場合は、それらの変数を
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

`appServer.clearEnv` は、起動される Codex app-server 子プロセスにのみ影響します。
OpenClaw は、ローカル起動の正規化中にこのリストから `CODEX_HOME` と `HOME` を削除します。
`CODEX_HOME` は選択されたエージェントまたはユーザースコープを指したままになり、
`HOME` は継承されたままとなるため、サブプロセスは通常のユーザーホーム状態を使用できます。

## 動的ツール

Codex 動的ツールはデフォルトで `searchable` 読み込みを使用し、
`openclaw` 名前空間の下で `deferLoading: true` として公開されます。OpenClaw は、
Codex ネイティブのワークスペース操作または Codex 独自のツール検索サーフェスと重複する
動的ツールを公開しません。

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

メッセージング、メディア、Cron、ブラウザー、Node、Gateway、
`heartbeat_respond`、`web_search` など、残りのほとんどの OpenClaw 統合ツールは、
その名前空間の Codex ツール検索を通じて利用できます。これにより、初期モデルコンテキストが小さく保たれます。
Codex ツール検索が利用できない場合や、コネクターのみのユニバースに解決される場合があるため、
一部のツールは `codexDynamicToolsLoading` に関係なく直接呼び出せます。
`agents_list`、`sessions_spawn`、`sessions_yield` が該当します。開発者向け指示では引き続き、
通常の Codex サブエージェントに対し、Codex ネイティブのサブエージェント作業にはネイティブの
`spawn_agent` を使用するよう誘導します。一方、`sessions_spawn` は明示的な OpenClaw または ACP の委任に
引き続き利用できます。メッセージツールのみを使用するソース返信も、
ターン制御の契約であるため、引き続き直接利用できます。

OpenClaw の `computer` ツールを含む、`catalogMode: "direct-only"` とマークされたツールは、
`openclaw_direct` の下にグループ化されます。OpenClaw は、オペレーターが指定したエントリを置き換えることなく、
その名前空間を Codex の `code_mode.direct_only_tool_namespaces` リストへ追加します。
そのため Codex は、これらのツールをネストされた Code Mode の `tools.*` 呼び出し経由でルーティングせず、
通常のスレッドと Code Mode 専用スレッドで `DirectModelOnly` として公開します。
この境界は画像を含む結果に必要です。ネストされた Code Mode のシリアル化では画像出力が
テキストに平坦化されるため、次のコンピューター操作に必要なスクリーンショットが失われます。

遅延動的ツールを検索できないカスタム Codex app-server に接続する場合、
または完全なツールペイロードをデバッグする場合にのみ、`codexDynamicToolsLoading: "direct"` を設定してください。

## タイムアウト

OpenClaw が所有する動的ツール呼び出しは、
`appServer.requestTimeoutMs` とは独立して制限されます。Codex の各 `item/tool/call` リクエストでは、
次の順序で最初に利用可能なタイムアウトが使用されます。

- 呼び出しごとの正の値の `timeoutMs` 引数。
- `image_generate` の場合、`agents.defaults.imageGenerationModel.timeoutMs`。
- タイムアウトが設定されていない `image_generate` の場合、画像生成のデフォルトである 120 秒。
- メディア理解用の `image` ツールの場合、`tools.media.image.timeoutSeconds`
  をミリ秒に変換した値、またはメディアのデフォルトである 60 秒。画像理解では、
  これはリクエスト自体に適用され、先行する準備処理に費やした時間によって短縮されません。
- `message` ツールの場合、固定のデフォルトである 120 秒。
- 動的ツールのデフォルトである 90 秒。

このウォッチドッグは、動的 `item/tool/call` 全体の予算です。プロバイダー固有の
リクエストタイムアウトはその呼び出し内で動作し、それぞれ固有のタイムアウトセマンティクスを維持します。
動的ツールの予算は 600000 ms が上限です。タイムアウトすると、OpenClaw はサポートされている場合に
ツールシグナルを中止し、失敗した動的ツールレスポンスを Codex に返します。これにより、セッションが
`processing` のまま残されることなく、ターンを続行できます。

Codex がターンを受け入れた後、および OpenClaw がターンスコープの
app-server リクエストに応答した後、ハーネスは Codex が現在のターンを進行させ、
最終的にネイティブターンを `turn/completed` で完了することを期待します。
app-server が `appServer.turnCompletionIdleTimeoutMs` の間何も送信しない場合、OpenClaw は
ベストエフォートで Codex ターンに割り込み、診断用タイムアウトを記録し、
OpenClaw セッションレーンを解放します。これにより、後続のチャットメッセージが
古いネイティブターンの後ろでキューに滞留することを防ぎます。

同じターンに対する非終端通知の大半は、Codex によってターンがまだ生存していることが
確認されるため、この短いウォッチドッグを解除します。ツールの引き渡しでは、より長い
ツール後アイドル予算が使用されます。対象となるのは、OpenClaw が `item/tool/call` レスポンスを返した後、
`commandExecution` などのネイティブツール項目が完了した後、生の
`custom_tool_call_output` が完了した後、およびツール後の生のアシスタント進行、
生の推論完了、または推論進行の後です。ガードは、設定されている場合は
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` を使用し、それ以外の場合は
デフォルトで 5 分を使用します。同じツール後予算によって、Codex が次の現在ターンイベントを
発行するまでの無通信の統合処理期間についても、進行ウォッチドッグが延長されます。推論完了、
commentary の `agentMessage` 完了、およびツール前の生の推論またはアシスタント進行の後には、
自動的な最終応答が続く可能性があるため、セッションレーンをただちに解放する代わりに、
進行後応答ガードを使用します。最終または非 commentary の完了済み `agentMessage` 項目と、
ツール前の生のアシスタント完了だけがアシスタント出力解放を作動させます。その後 Codex が
`turn/completed` を送信せずに無通信になった場合、OpenClaw はベストエフォートでネイティブターンに
割り込み、セッションレーンを解放します。リプレイしても安全な stdio app-server 障害は、
新しい app-server 試行で 1 回再試行されます。これには、アシスタント、ツール、
アクティブ項目、または副作用の証拠がないターン完了アイドルタイムアウトが含まれます。
安全でないタイムアウトの場合も、停止した app-server クライアントを廃棄し、
OpenClaw セッションレーンを解放します。また、自動的にリプレイする代わりに、
古いネイティブスレッドのバインドを消去します。完了監視タイムアウトでは、Codex 固有の
タイムアウトテキストが表示されます。リプレイしても安全な場合はレスポンスが不完全な可能性を伝え、
安全でない場合は再試行前に現在の状態を確認するようユーザーに伝えます。公開される
タイムアウト診断には、最後の app-server 通知メソッド、生のアシスタントレスポンス項目の
id/type/role、アクティブなリクエスト数と項目数、作動中の監視状態などの構造化フィールドが含まれます。
最後の通知が生のアシスタントレスポンス項目の場合は、長さを制限したアシスタントテキストの
プレビューも含まれます。生のプロンプトやツール内容は含まれません。

## モデル検出

デフォルトでは、Codex Plugin は利用可能なモデルを app-server に問い合わせます。モデルの
利用可否は Codex app-server が管理するため、OpenClaw がバンドル版の `@openai/codex` を
アップグレードした場合や、デプロイ環境で `appServer.command` が別の Codex バイナリを
指すようにした場合、一覧が変わる可能性があります。利用可否がアカウント単位で異なることもあります。
稼働中の Gateway で `/codex models` を使用すると、そのハーネスとアカウントのライブカタログを
確認できます。

検出に失敗するかタイムアウトした場合、OpenClaw はバンドルされたフォールバックカタログを使用します。

| モデル ID      | 表示名       | 推論強度                 |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
現在バンドルされているハーネスは `@openai/codex` `0.144.1` です。このバンドル版
app-server に対する `model/list` プローブでは、次の公開モデル選択行が返されました。

| モデル ID       | 入力モダリティ | 推論強度                             |
| --------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`   | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra` | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`  | text, image      | low, medium, high, xhigh, max        |
| `gpt-5.5`       | text, image      | low, medium, high, xhigh             |
| `gpt-5.4`       | text, image      | low, medium, high, xhigh             |
| `gpt-5.4-mini`  | text, image      | low, medium, high, xhigh             |
| `gpt-5.2`       | text, image      | low, medium, high, xhigh             |

app-server カタログは `ultra` を報告できますが、OpenClaw の推論コントロールで現在公開されている
レベルは `max` までです。

ライブのモデル選択行はアカウント単位であり、アカウント、Codex カタログ、またはバンドル版の
変更に伴って変わる可能性があります。特定時点の表に依存せず、現在の一覧を確認するには
`/codex models` を実行してください。内部または特殊なフロー向けの非表示モデルが、
通常のモデル選択肢ではないにもかかわらず app-server カタログに表示される場合もあります。
</Note>

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

起動時に Codex のプローブを行わず、フォールバックカタログのみを使用する場合は、
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
Codex のフォールバックは `AGENTS.md` が存在しない場合にのみ適用されるため、OpenClaw は
合成された Codex プロジェクトドキュメントファイルを書き込まず、ペルソナファイル用の
Codex フォールバックファイル名にも依存しません。

OpenClaw ワークスペースとの同等性を保つため、Codex ハーネスはその他の
ブートストラップファイルを開発者指示として転送しますが、その方法は同一ではありません。

- `TOOLS.md` は **継承される** Codex 開発者指示として転送されるため、
  ターン中に生成されたネイティブ Codex サブエージェントにも表示されます。
- `SOUL.md`、`IDENTITY.md`、`USER.md` は **ターンスコープ** の
  コラボレーション指示として転送されます。ネイティブ Codex サブエージェントはこれらを
  継承しないため、サブエージェントのターンが親エージェントのペルソナや
  ユーザープロファイルを引き継ぐことを防ぎます。
- 読み込まれた OpenClaw Skills の簡略一覧も、ターンスコープの
  コラボレーション開発者指示として転送されるため、ネイティブ Codex サブエージェントは
  これも継承しません。
- `HEARTBEAT.md` の内容は注入されません。Heartbeat ターンでは、ファイルが存在し、
  空でない場合にそのファイルを読むよう、コラボレーションモードの参照指示が与えられます。
- 設定されたエージェントワークスペースの `MEMORY.md` の内容は、そのワークスペースで
  メモリツールを利用できる場合、ネイティブ Codex ターン入力に貼り付けられません。
  ファイルが存在する場合、ハーネスはターンスコープのコラボレーション開発者指示に
  短いワークスペースメモリ参照を追加し、永続メモリが関連するとき Codex は
  `memory_search` または `memory_get` を使用する必要があります。
  ツールが無効な場合、メモリ検索を利用できない場合、またはアクティブな
  ワークスペースがエージェントのメモリワークスペースと異なる場合、`MEMORY.md` には
  通常の制限付きターンコンテキスト経路が使用されます。
- `BOOTSTRAP.md` が存在する場合は、OpenClaw ターン入力の参照コンテキストとして転送されます。

## 環境オーバーライド

ローカルテストでは、引き続き環境オーバーライドを利用できます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` が未設定の場合、`OPENCLAW_CODEX_APP_SERVER_BIN` は
管理対象バイナリを迂回します。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、
一度限りのローカルテストでは `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。
再現可能なデプロイでは設定の使用を推奨します。これにより、Plugin の動作を Codex ハーネスの
その他のセットアップと同じレビュー対象ファイル内に維持できます。

## 関連項目

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [Codex の監視](/plugins/codex-supervision)
- [ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins)
- [Codex Computer Use](/ja-JP/plugins/codex-computer-use)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [設定リファレンス](/ja-JP/gateway/configuration-reference)
