---
read_when:
    - Codex ハーネスのすべての設定フィールドが必要です
    - app-server のトランスポート、認証、検出、またはタイムアウトの動作を変更している場合
    - Codex ハーネスの起動、モデル検出、または環境分離をデバッグしている場合
summary: Codex ハーネスの設定、認証、検出、app-server リファレンス
title: Codex ハーネスリファレンス
x-i18n:
    generated_at: "2026-07-11T22:27:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb3dcb14d9dbd70a225c13f239369b6d9d2cc0b0681aa29265f528287a6a8e4c
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

このリファレンスでは、公式 `codex` Plugin の詳細設定について説明します。
セットアップとルーティングの判断については、
[Codex ハーネス](/ja-JP/plugins/codex-harness)から始めてください。

## Plugin 設定項目

Codex ハーネスのすべての設定は `plugins.entries.codex.config` 以下にあります。

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

最上位フィールド：

| フィールド                 | デフォルト                       | 意味                                                                                                                                                         |
| -------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `discovery`                | 有効                             | Codex app-server の `model/list` によるモデル検出設定。                                                                                                      |
| `appServer`                | 管理対象の標準入出力 app-server | トランスポート、コマンド、認証、承認、サンドボックス、タイムアウトの設定。通常のハーネスでは、デフォルトでエージェントスコープの状態を使用します。             |
| `codexDynamicToolsLoading` | `"searchable"`                   | `"direct"` を使用すると、OpenClaw の動的ツールを Codex の初期ツールコンテキストに直接配置します。                                                            |
| `codexDynamicToolsExclude` | `[]`                             | Codex app-server のターンから除外する、追加の OpenClaw 動的ツール名。                                                                                         |
| `codexPlugins`             | 無効                             | 接続済みアカウントのアプリへのオプトインアクセスを含む、Codex ネイティブの Plugin／アプリサポート。[Codex ネイティブ Plugin](/ja-JP/plugins/codex-native-plugins)を参照してください。 |
| `computerUse`              | 無効                             | Codex Computer Use のセットアップ。[Codex Computer Use](/ja-JP/plugins/codex-computer-use)を参照してください。                                                     |
| `supervision`              | 無効                             | アーカイブされていないネイティブセッションのカタログ、ローカルブランチの継続、エージェントツールポリシー。[Codex 監督](/plugins/codex-supervision)を参照してください。 |

## 監督

監督は、Gateway コンピューターと、オプトインしたペアリング済み Node にある、アーカイブされていない Codex セッションを一覧表示します。
エージェントハーネスとは独立して有効にします。

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

| フィールド            | デフォルト                     | 意味                                                                                                                                                                                                                                                       |
| --------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                        | ローカルセッションカタログを公開し、Gateway では、オプトインしたペアリング済み Node のカタログを Codex セッションページ用に集約します。                                                                                                                   |
| `endpoints`           | 組み込みローカルエンドポイント | 維持されている Codex 監督エージェントとスタンドアロン MCP ツール向けの互換性および高度なエンドポイントターゲット。人間向けカタログとブランチフローはこれらのターゲットを無視し、`appServer` から解決された監督用 App Server を使用します。                    |
| `allowRawTranscripts` | `false`                        | 監督が有効な場合、自律エージェントまたはスタンドアロン MCP によるトランスクリプトの読み取りと、トランスクリプトから派生する一覧フィールドを許可します。`codex_threads` のメタデータのみの読み取りは引き続き利用できます。認証済み Control UI の継続は制御しません。 |
| `allowWriteControls`  | `false`                        | 監督が有効な場合、自律的な `codex_threads` のフォーク、名前変更、アーカイブ、アーカイブ解除の変更に加え、スタンドアロン MCP の送信、誘導、中断操作を許可します。他のバインディング、ホスト、ステータス、確認のチェックを回避するものではありません。           |

エンドポイントの各エントリでは、次のフィールドを指定できます。

| フィールド     | 適用対象      | 意味                                                                 |
| -------------- | ------------- | -------------------------------------------------------------------- |
| `id`           | すべて        | 安定したエンドポイント ID。                                         |
| `label`        | すべて        | 省略可能な表示ラベル。                                               |
| `transport`    | すべて        | `"stdio-proxy"` または `"websocket"`。                               |
| `command`      | `stdio-proxy` | 省略可能な App Server コマンド。                                     |
| `args`         | `stdio-proxy` | 省略可能なコマンド引数。                                             |
| `cwd`          | `stdio-proxy` | 省略可能な子プロセスの作業ディレクトリ。                             |
| `url`          | `websocket`   | 必須の WebSocket またはサポートされているローカルソケットの URL。    |
| `authTokenEnv` | `websocket`   | 値を使用してエンドポイントを認証する、省略可能な環境変数。           |

**Codex セッション**ページは Plugin の監督用 App Server を使用し、アーカイブされていないセッションのみを表示します。明示的な `appServer` 接続設定がない場合、その接続は管理対象のユーザーホーム標準入出力になります。保存済みまたはアイドル状態のローカル行からは、最後に永続化された終了済みソースターンまでの、範囲を限定したユーザーとアシスタントの履歴を持つモデル固定 Chat を作成できます。その非公開バインディングにより、スナップショットのフォーク、正規の `appServer` ソースブランチ、履歴の注入、および以降のターンがその接続上に維持されます。最初の正規開始では、フォークから返されたペアを使用します。それ以降の再開では OpenClaw のモデルとプロバイダーのオーバーライドを省略するため、Codex は正規スレッドに永続化されたペアを復元します。別のネイティブ変更でそのペアを更新できますが、外側のモデルとフォールバックチェーンが置き換えることはありません。保存済みおよびアイドル状態の行は、他のランナーが存在しないことを確認した後でアーカイブできます。ただし、別のアクティブな OpenClaw バインディングが対象そのもの、またはそこから生成されたアーカイブされていない子孫のいずれかを所有している場合を除きます。OpenClaw は Codex の子孫ページネーションに従い、列挙エラー、循環、または安全上限の超過が発生した場合は閉鎖的に失敗します。確認では引き続き、不明なネイティブクライアントと、ステータス確認からアーカイブまでの競合を対象とします。監督対象のモデル固定 Chat は、ネイティブバインディングを保護している間は削除できません。アクティブなソースではブランチの作成やアーカイブはできませんが、既存の監督対象 Chat は引き続き開くことができます。ペアリング済み Node のすべての行は読み取り専用のままです。Node トランスポートは、ハーネスに必要なストリーミングライフサイクルをまだ提供していません。

`appServer.homeScope: "user"` だけを設定しても、管理対象ハーネスプロセスが使用する Codex ホームが変わるだけで、フリートカタログは公開されません。監督を有効にしても、ハーネスのデフォルトは変わりません。代わりに、明示的な `appServer` 接続設定が存在しない場合、独立した監督接続はデフォルトで管理対象のユーザーホーム標準入出力を使用します。明示的な設定は、その接続で優先されます。保留中および確定済みの監督対象バインディングは、すべてのターンでその接続を維持します。監督の無効化または接続／ライフサイクルのずれが発生した場合、エージェントホームのハーネスへフォールバックせず、閉鎖的に失敗します。デフォルト接続は、ネイティブ Codex クライアントと保存済みセッションを共有しますが、クライアントのプロセスローカルなアクティビティ状態は共有しません。

従来の `plugins.entries.codex-supervisor` 設定は廃止されました。`openclaw doctor --fix` を実行して、古いエントリ、エンドポイント定義、ポリシーフラグ、Plugin の許可／拒否参照をこのブロックへ移行してください。競合する場合は、明示的な正規の `codex.config.supervision` 値が優先されます。

## App-server トランスポート

通常のハーネスターンでは、OpenClaw は公式 Plugin に同梱されている管理対象 Codex バイナリ（現在は `@openai/codex` `0.144.1`）を起動します。

```bash
codex app-server --listen stdio://
```

これにより、app-server のバージョンは、ローカルに別途インストールされている Codex CLI ではなく、公式 `codex` Plugin に関連付けられます。意図的に別の実行ファイルを使用する場合にのみ `appServer.command` を設定してください。デフォルトの分離されたエージェントホームを使用する通常の管理対象ターンでは、macOS デスクトップバンドルがインストールされている場合でも、この固定パッケージが優先されます。[Computer Use](/ja-JP/plugins/codex-computer-use) が有効な場合、または `homeScope` が `"user"` でネイティブの Computer Use 状態を読み込める場合、管理対象の起動では代わりに、必要な macOS 権限を所有するデスクトップアプリのバイナリが優先されます。分離されたエージェントホームの有効な Codex 設定でネイティブ Computer Use が有効になっている場合も、同じデスクトップ優先ルールが適用されます。デスクトップアプリのバンドルがインストールされていない場合、OpenClaw は固定パッケージのバイナリにフォールバックします。

実行ファイルの引き継ぎとネイティブ設定のフェンシングにより、実行中の単一 Gateway プロセス内でクライアントが調整されます。別のプロセスがネイティブ Codex Plugin の設定を変更した後は、Gateway を再起動してください。

監督は独立した接続を解決します。明示的な `appServer` 接続設定がない場合、`homeScope: "user"` の管理対象標準入出力を使用します。通常のハーネスは `homeScope: "agent"` の管理対象標準入出力のままです。明示的な接続設定は両方の経路で優先されます。通常のハーネスでネイティブクライアントと `$CODEX_HOME`（または `~/.codex`）を共有する必要がある場合は、`homeScope: "user"` を明示的に設定してください。非公開の監督対象バインディングは、通常のハーネスのデフォルトにかかわらず監督接続を使用します。独立した App Server プロセスは、個別のライブステータスと承認状態を保持します。

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

| フィールド                                    | デフォルト                                             | 意味                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` は Codex を起動します。明示的な `"unix"` はローカル制御ソケットに接続し、`"websocket"` は `url` に接続します。                                                                                                                                                                                                                                                                        |
| `homeScope`                                   | `"agent"`                                              | `"agent"` は通常のハーネス状態を OpenClaw エージェントごとに分離します。`"user"` は明示的なオプトインで、ネイティブの `$CODEX_HOME` または `~/.codex` を共有し、ネイティブ認証を使用して、所有者のみのスレッド管理を有効にします。ユーザースコープはローカル stdio または Unix トランスポートをサポートします。別個の監視接続では、未設定の値は stdio または Unix の場合は `"user"`、WebSocket の場合は `"agent"` として解決されます。 |
| `command`                                     | 管理対象の Codex バイナリ                              | stdio トランスポート用の実行可能ファイルです。管理対象のバイナリを使用するには未設定のままにします。                                                                                                                                                                                                                                                                                            |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio トランスポート用の引数です。                                                                                                                                                                                                                                                                                                                                                              |
| `url`                                         | 未設定                                                 | WebSocket App Server URL または `unix://` URL です。明示的に空の Unix パスを指定すると、標準のユーザーホーム制御ソケットが選択されます。                                                                                                                                                                                                                                                        |
| `authToken`                                   | 未設定                                                 | WebSocket トランスポート用の Bearer トークンです。リテラル文字列または `${CODEX_APP_SERVER_TOKEN}` のような SecretInput を受け付けます。                                                                                                                                                                                                                                                       |
| `headers`                                     | `{}`                                                   | 追加の WebSocket ヘッダーです。ヘッダー値にはリテラル文字列または SecretInput 値を使用できます。例: `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                           |
| `clearEnv`                                    | `[]`                                                   | OpenClaw が継承環境を構築した後、起動された stdio app-server プロセスから削除する追加の環境変数名です。                                                                                                                                                                                                                                                                                          |
| `remoteWorkspaceRoot`                         | 未設定                                                 | リモート Codex app-server のワークスペースルートです。設定すると、OpenClaw は解決済みの OpenClaw ワークスペースからローカルワークスペースルートを推測し、このリモートルート配下で現在の cwd の接尾部分を維持し、最終的な app-server の cwd のみを Codex に送信します。cwd が解決済みの OpenClaw ワークスペースルート外にある場合、OpenClaw は Gateway ローカルのパスをリモート app-server に送信せず、フェイルクローズします。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server のコントロールプレーン呼び出しのタイムアウトです。                                                                                                                                                                                                                                                                                                                                  |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex がターンを受理した後、またはターンスコープの app-server リクエスト後に、OpenClaw が `turn/completed` を待機する際の無通信時間枠です。                                                                                                                                                                                                                                                      |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw が `turn/completed` を待機する間に、ツールへの引き渡し、ネイティブツールの完了、ツール後の生のアシスタント進行、未加工の推論完了、または推論の進行後に使用される完了アイドル時間と進行状況のガードです。ツール後の統合処理が、最終的なアシスタント出力の時間枠よりも長く正当に無通信状態になり得る、信頼済みまたは高負荷のワークロードに使用します。 |
| `mode`                                        | ローカルの Codex 要件で YOLO が禁止されない限り `"yolo"` | YOLO またはガーディアンレビュー済み実行用のプリセットです。                                                                                                                                                                                                                                                                                                                                    |
| `approvalPolicy`                              | `"never"` または許可されたガーディアン承認ポリシー    | スレッドの開始、再開、およびターンに送信されるネイティブ Codex 承認ポリシーです。                                                                                                                                                                                                                                                                                                               |
| `sandbox`                                     | `"danger-full-access"` または許可されたガーディアンサンドボックス | スレッドの開始と再開に送信されるネイティブ Codex サンドボックスモードです。有効な OpenClaw サンドボックスでは、`danger-full-access` ターンが Codex の `workspace-write` に制限されます。ターンのネットワークフラグは OpenClaw サンドボックスの外向き通信設定に従います。                                                                                                                            |
| `approvalsReviewer`                           | `"user"` または許可されたガーディアンレビュー担当     | 許可されている場合に Codex がネイティブ承認プロンプトをレビューするようにするには、`"auto_review"` を使用します。                                                                                                                                                                                                                                                                                |
| `defaultWorkspaceDir`                         | 現在のプロセスディレクトリ                             | `--cwd` が省略された場合に `/codex bind` が使用するワークスペースです。                                                                                                                                                                                                                                                                                                                         |
| `serviceTier`                                 | 未設定                                                 | オプションの Codex app-server サービス階層です。`"priority"` は高速モードのルーティングを有効にし、`"flex"` はフレックス処理を要求し、`null` は上書きを解除します。レガシーの `"fast"` は `"priority"` として受け付けられます。                                                                                                                                                                     |
| `networkProxy`                                | 無効                                                   | app-server コマンドで Codex 権限プロファイルのネットワーク機能を使用するようオプトインします。OpenClaw は `sandbox` を送信する代わりに、選択された `permissions.<profile>.network` 設定を定義し、`default_permissions` で選択します。                                                                                                                                                               |
| `experimental.sandboxExecServer`              | `false`                                                | サポート対象の Codex app-server に OpenClaw サンドボックスを基盤とする Codex 環境を登録し、ネイティブ Codex 実行を有効な OpenClaw サンドボックス内で実行できるようにするプレビュー版のオプトインです。                                                                                                                                                                                            |

`appServer.networkProxy` は Codex サンドボックスの契約を変更するため、明示的な設定です。有効にすると、OpenClaw は Codex スレッド設定で `features.network_proxy.enabled` と `default_permissions` も設定し、生成された権限プロファイルが Codex 管理のネットワーク機能を開始できるようにします。OpenClaw はデフォルトで、プロファイル本体から衝突しにくい `openclaw-network-<fingerprint>` というプロファイル名を生成します。安定したローカル名が必要な場合にのみ `profileName` を使用してください。

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
`networkProxy` を有効にすると、生成される権限プロファイルでは代わりに
ワークスペース形式のファイルシステムアクセスが使用されます。Codex が管理する
ネットワーク制御はサンドボックス化されたネットワーク機能であるため、フルアクセス
プロファイルでは送信トラフィックを保護できません。

Plugin は、古い、またはバージョン情報のない app-server ハンドシェイクをブロックします。
Codex app-server は安定版 `0.143.0` 以降を報告する必要があります。

OpenClaw は、非ループバックの WebSocket app-server URL をリモートとして扱い、
`appServer.authToken` または `Authorization` ヘッダーによる、ID 情報を含む
WebSocket 認証を要求します。`appServer.authToken` と各 `appServer.headers.*`
値には SecretInput を使用できます。シークレットランタイムは、OpenClaw が
app-server の起動オプションを構築する前に SecretRef と環境変数の省略記法を解決し、
未解決の構造化 SecretRef がある場合は、トークンやヘッダーが送信される前に失敗します。
ネイティブ Codex Plugin が設定されている場合、OpenClaw は接続先 app-server の
Plugin コントロールプレーンを使用してそれらの Plugin をインストールまたは更新し、
その後アプリ一覧を更新して、Plugin が所有するアプリを Codex スレッドから参照できるようにします。
`app/list` は引き続き正式な一覧およびメタデータの情報源ですが、一覧に含まれるアクセス可能な
アプリについて、Codex が現在無効とマークしている場合でも、`thread/start` で
`config.apps[appId].enabled = true` を送信するかどうかは OpenClaw のポリシーが決定します。
不明または欠落しているアプリ ID は引き続きフェイルクローズになります。この経路は
`plugin/install` を介してマーケットプレイスの Plugin を有効化し、一覧を更新するだけです。
OpenClaw が管理する Plugin のインストールとアプリ一覧の更新を受け入れても安全だと
信頼できるリモート app-server にのみ、OpenClaw を接続してください。

## 承認モードとサンドボックスモード

ローカル stdio app-server セッションのデフォルトは YOLO モードです。
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、
`sandbox: "danger-full-access"` が設定されます。この信頼済みローカルオペレーター向けの
構成により、応答する人がいないネイティブ承認プロンプトに妨げられることなく、
無人の OpenClaw ターンと Heartbeat を進行できます。

Codex のローカルシステム要件ファイルで暗黙の YOLO 承認、レビュー担当、または
サンドボックス値が許可されていない場合、OpenClaw は暗黙のデフォルトを代わりに
guardian として扱い、許可された guardian 権限を選択します。
`tools.exec.mode: "auto"` も Codex の承認を guardian レビュー対象にし、安全でない
従来の `approvalPolicy: "never"` または `sandbox: "danger-full-access"`
オーバーライドを維持しません。意図的に承認不要の構成にするには
`tools.exec.mode: "full"` を設定してください。同じ要件ファイル内でホスト名が一致する
`[[remote_sandbox_config]]` エントリは、サンドボックスのデフォルト決定時に考慮されます。

Codex の guardian レビュー付き承認を使用するには、`appServer.mode: "guardian"` を設定します。

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
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、
`sandbox: "workspace-write"` に展開されます。個別のポリシーフィールドは
`mode` より優先されます。以前の `guardian_subagent` レビュー担当値も互換性エイリアスとして
引き続き受け入れられますが、新しい設定では `auto_review` を使用してください。

OpenClaw サンドボックスが有効な場合でも、ローカル Codex app-server プロセスは
Gateway ホスト上で実行されます。そのため OpenClaw は、Codex のホスト側
サンドボックス化を OpenClaw サンドボックスバックエンドと同等には扱わず、そのターンでは
Codex ネイティブのコードモード、ユーザー MCP サーバー、およびアプリを基盤とする
Plugin 実行を無効にします。通常の exec/process ツールが利用可能な場合、シェルアクセスは
`sandbox_exec` や `sandbox_process` など、OpenClaw サンドボックスを基盤とする
動的ツールを通じて提供されます。

<Note>
Docker を基盤とする OpenClaw サンドボックスホスト
（`agents.defaults.sandbox.mode` が Docker バックエンドに設定されている場合）では、
`openclaw doctor` は、サンドボックスコンテナ内で `workspace-write` シェル実行を行う
ネストされた Codex `bwrap` に必要な、非特権ユーザー名前空間と、Docker サンドボックスの
ネットワーク送信が無効な場合はネットワーク名前空間を、ホストが許可しているかを検査します。
検査に失敗すると、Ubuntu/AppArmor ホストでは通常、
`bwrap: setting up uid map: Permission denied` または
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` と表示されます。
報告されたホスト名前空間ポリシーを OpenClaw サービスユーザー向けに修正し、
Gateway を再起動してください。ホスト全体に適用される
`kernel.apparmor_restrict_unprivileged_userns=0` の代替策よりも、
サービスプロセスに限定した AppArmor プロファイルを優先してください。また、ネストされた
`bwrap` の要件を満たすためだけに、Docker コンテナへ広範な権限を付与しないでください。
</Note>

## サンドボックス化されたネイティブ実行

安定版のデフォルトはフェイルクローズです。有効な OpenClaw サンドボックス化により、
通常なら Codex app-server ホストから実行される Codex ネイティブ実行サーフェスは
無効になります。Codex のリモート環境対応を OpenClaw のサンドボックスバックエンドで
試す場合にのみ、`appServer.experimental.sandboxExecServer: true` を使用してください。
このプレビュー経路は、サポートされるすべての Codex app-server バージョンで動作します。

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

このフラグが有効で、現在の OpenClaw セッションがサンドボックス化されている場合、
OpenClaw は有効なサンドボックスを基盤とする local loopback exec-server を起動し、
Codex app-server に登録したうえで、その OpenClaw 所有環境を使用して Codex のスレッドと
ターンを開始します。app-server が環境を登録できない場合、ホスト実行へ暗黙にフォールバックせず、
実行はフェイルクローズで失敗します。

このプレビュー経路はローカル専用です。リモート WebSocket app-server は、同じホスト上で
実行されていない限りループバック exec-server に到達できないため、OpenClaw はその組み合わせを
拒否します。

## 認証と環境の分離

デフォルトのエージェント単位のホームでは、認証は次の順序で選択されます。

1. エージェントに明示的に設定された OpenClaw Codex 認証プロファイル。
2. そのエージェントの Codex ホームにある app-server の既存アカウント。
3. ローカル stdio app-server の起動時のみ、app-server アカウントがなく、かつ
   OpenAI 認証が引き続き必要な場合は、`CODEX_API_KEY`、次に `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイル
（OAuth またはトークン資格情報タイプ）を検出すると、起動する Codex 子プロセスから
`CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、埋め込みや直接の
OpenAI モデル用に Gateway レベルの API キーを利用可能なまま維持しつつ、ネイティブ
Codex app-server のターンが誤って API 経由で課金されることを防ぎます。

明示的な Codex API キープロファイルとローカル stdio の環境変数キーへのフォールバックでは、
継承された子プロセス環境ではなく app-server ログインを使用します。WebSocket app-server
接続には Gateway の環境変数 API キーフォールバックは渡されません。明示的な認証プロファイル、
またはリモート app-server 自体のアカウントを使用してください。

stdio app-server の起動時は、デフォルトで OpenClaw のプロセス環境を継承します。
OpenClaw は Codex app-server のアカウントブリッジを管理し、`CODEX_HOME` を
そのエージェントの OpenClaw 状態配下にあるエージェント単位のディレクトリに設定します。
これにより、Codex の設定、アカウント、Plugin のキャッシュとデータ、およびスレッド状態は
オペレーター個人の `~/.codex` ホームから流入せず、OpenClaw エージェントに限定されます。

ネイティブ Codex の状態を Codex Desktop および CLI と共有するには、
`appServer.homeScope: "user"` を設定します。このローカルユーザーホームモードは、
管理対象 stdio と明示的な Unix トランスポートをサポートします。`$CODEX_HOME` が設定されている
場合はそれを使用し、それ以外の場合は `~/.codex` を使用します。これにはネイティブ認証、
設定、Plugin、スレッドが含まれます。OpenClaw は app-server に対する認証プロファイル
ブリッジを省略します。検証済み所有者のターンでは、`codex_threads` を使用して、
それらのスレッドを一覧表示（任意の `search` フィルター付き）、読み取り、フォーク、
名前変更、アーカイブ、アーカイブ解除できます。OpenClaw で継続する前にスレッドをフォークしてください。
独立した Codex プロセス同士は、同じスレッドへの同時書き込みを調整しません。

この `homeScope` のオプトインは、通常のハーネスセッションに適用されます。Codex Sessions
を通じて作成されたチャットは、代わりに専用の監督接続を使用します。これにより、
正規ブランチと今後の再開時に、ネイティブ接続の認証およびプロバイダー設定が維持されます。

モデルが固定された監督対象チャットでは、`codex_threads` は別のフォークを接続したり、
チャットに紐づくネイティブスレッドをアーカイブしたりできません。一覧表示とメタデータのみの
読み取りは引き続き利用できます。生のトランスクリプトの読み取りには
`allowRawTranscripts` が必要です。これが無効な場合、ネイティブ検索がトランスクリプトの
プレビューに一致する可能性があるため、一覧検索も拒否されます。別の OpenClaw チャットが
所有していない無関係なスレッドの名前変更、アーカイブ解除、切り離されたフォーク、および
アーカイブには `allowWriteControls` が必要です。どちらのオプションも、固定された紐付けを
回避するものではありません。

OpenClaw は、通常のローカル app-server 起動時に `HOME` を書き換えません。
`openclaw`、`gh`、`git`、クラウド CLI、シェルコマンドなど、Codex が実行する
サブプロセスは通常のプロセスホームを参照し、ユーザーホームの設定とトークンを見つけられます。
Codex は `$HOME/.agents/skills` と `$HOME/.agents/plugins/marketplace.json` も
検出する場合があります。この `.agents` の検出は意図的にオペレーターホームと共有されており、
分離された `~/.codex` 状態とは別です。

デフォルトのエージェントスコープでは、OpenClaw Plugin と OpenClaw Skills のスナップショットは、
引き続き OpenClaw 独自の Plugin レジストリと Skills ローダーを通じて流れますが、
個人用 Codex `~/.codex` アセットは流れません。分離された OpenClaw エージェントの一部に
すべき有用な Codex CLI Skills または Plugin が Codex ホームにある場合は、明示的に
一覧化してください。

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

デプロイで追加の環境分離が必要な場合は、それらの変数を `appServer.clearEnv` に追加します。

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
OpenClaw はローカル起動の正規化中に、このリストから `CODEX_HOME` と `HOME` を削除します。
`CODEX_HOME` は選択されたエージェントまたはユーザースコープを指したままとなり、
`HOME` は継承されたままになるため、サブプロセスは通常のユーザーホーム状態を使用できます。

## 動的ツール

Codex の動的ツールはデフォルトで `searchable` 読み込みを使用し、`openclaw`
名前空間の下で `deferLoading: true` として公開されます。OpenClaw は、Codex ネイティブの
ワークスペース操作または Codex 独自のツール検索サーフェスと重複する動的ツールを公開しません。

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

メッセージング、メディア、Cron、ブラウザー、Node、Gateway、`heartbeat_respond`、
`web_search` など、残りの OpenClaw 統合ツールの大部分は、その名前空間の Codex
ツール検索を通じて利用できます。これにより、初期モデルコンテキストを小さく保てます。
Codex ツール検索が利用できない場合や、コネクターだけのツール群が解決される場合があるため、
少数のツールは `codexDynamicToolsLoading` に関係なく直接呼び出せます。
`agents_list`、`sessions_spawn`、`sessions_yield` が該当します。
開発者向け指示では、通常の Codex サブエージェントに対し、Codex ネイティブの
サブエージェント作業には引き続きネイティブの `spawn_agent` を使用するよう案内します。
一方、`sessions_spawn` は明示的な OpenClaw または ACP の委任に使用できます。
メッセージツールのみを使用するソース返信も、ターン制御の契約であるため、引き続き直接公開されます。

OpenClaw の `computer` ツールを含む、`catalogMode: "direct-only"` とマークされたツールは、
`openclaw_direct` の下にグループ化されます。OpenClaw は、オペレーターが指定した
エントリを置き換えることなく、その名前空間を Codex の
`code_mode.direct_only_tool_namespaces` リストに追加します。そのため Codex は、
それらのツールをネストされたコードモードの `tools.*` 呼び出し経由でルーティングせず、
通常スレッドおよびコードモード専用スレッドで `DirectModelOnly` として公開します。
この境界は画像を含む結果に必要です。ネストされたコードモードのシリアル化では画像出力が
テキストに平坦化され、次のコンピューター操作に必要なスクリーンショットが失われるためです。

遅延された動的ツールを検索できないカスタム Codex app-server に接続する場合、または
完全なツールペイロードをデバッグする場合にのみ、`codexDynamicToolsLoading: "direct"`
を設定してください。

## タイムアウト

OpenClaw が管理する動的ツール呼び出しは、
`appServer.requestTimeoutMs` とは独立して制限されます。Codex の各 `item/tool/call` リクエストでは、
次の順序で最初に利用可能なタイムアウトが使用されます。

- 呼び出しごとの正の `timeoutMs` 引数。
- `image_generate` の場合は、`agents.defaults.imageGenerationModel.timeoutMs`。
- `image_generate` にタイムアウトが設定されていない場合は、画像生成のデフォルトである 120 秒。
- メディア理解用の `image` ツールの場合は、`tools.media.image.timeoutSeconds`
  をミリ秒に変換した値、またはメディアのデフォルトである 60 秒。画像理解では、
  これはリクエスト自体に適用され、それ以前の準備作業によって短縮されません。
- `message` ツールの場合は、固定のデフォルトである 120 秒。
- 動的ツールのデフォルトである 90 秒。

この監視タイマーは、動的な `item/tool/call` 全体の上限時間です。プロバイダー固有の
リクエストタイムアウトはその呼び出し内で実行され、それぞれ独自のタイムアウト動作を維持します。
動的ツールの上限時間は 600000 ミリ秒に制限されます。タイムアウト時、OpenClaw は
対応している場合にツールのシグナルを中止し、失敗した動的ツール応答を
Codex に返します。これにより、セッションを `processing` のまま残さずに
ターンを続行できます。

Codex がターンを受け付けた後、および OpenClaw がターン単位の
アプリサーバーリクエストに応答した後、ハーネスは Codex が現在のターンを進行させ、
最終的に `turn/completed` でネイティブターンを完了することを期待します。
アプリサーバーが `appServer.turnCompletionIdleTimeoutMs` の間応答しない場合、OpenClaw は
ベストエフォートで Codex のターンを中断し、診断用タイムアウトを記録して、
OpenClaw のセッションレーンを解放します。これにより、後続のチャットメッセージが
停止した古いネイティブターンの後ろで待機し続けることを防ぎます。

同じターンに対する終了以外の通知のほとんどは、Codex がターンの稼働継続を示したため、
この短い監視タイマーを解除します。ツールの引き渡しには、より長いツール後アイドル上限が使用されます。
対象となるのは、OpenClaw が `item/tool/call` 応答を返した後、
`commandExecution` などのネイティブツール項目が完了した後、
未加工の `custom_tool_call_output` が完了した後、およびツール後の未加工アシスタント処理、
未加工の推論完了、または推論処理の後です。このガードは、設定されている場合は
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` を使用し、
それ以外の場合はデフォルトで 5 分を使用します。同じツール後の上限時間は、
Codex が次の現在ターンのイベントを発行する前の無通知の統合処理期間についても、
進行監視タイマーを延長します。推論の完了、コメンタリーの `agentMessage` 完了、
およびツール前の未加工の推論またはアシスタント処理の後には自動的な最終応答が続く可能性があるため、
これらはセッションレーンを直ちに解放せず、進行後応答ガードを使用します。
最終かつコメンタリー以外の完了済み `agentMessage` 項目と、
ツール前の未加工アシスタント完了のみが、アシスタント出力後の解放を開始します。
その後 Codex が `turn/completed` を送信せずに応答しなくなった場合、OpenClaw は
ベストエフォートでネイティブターンを中断し、セッションレーンを解放します。
アシスタント、ツール、アクティブ項目、または副作用の証拠がないターン完了アイドルタイムアウトを含む、
再実行しても安全な標準入出力アプリサーバー障害は、新しいアプリサーバー試行で 1 回再試行されます。
安全でないタイムアウトでは、停止したアプリサーバークライアントを終了し、
OpenClaw のセッションレーンを解放します。また、自動的に再実行する代わりに、
古いネイティブスレッドの関連付けを解除します。完了監視タイムアウトでは、
Codex 固有のタイムアウト文言が表示されます。再実行しても安全な場合は応答が不完全な可能性を示し、
安全でない場合は再試行前に現在の状態を確認するようユーザーに伝えます。
公開されるタイムアウト診断には、最後のアプリサーバー通知メソッド、
未加工アシスタント応答項目の ID／種類／ロール、アクティブなリクエスト数／項目数、
有効な監視状態などの構造化フィールドが含まれます。最後の通知が未加工アシスタント応答項目の場合は、
上限付きのアシスタントテキストプレビューも含まれます。未加工のプロンプトやツール内容は含まれません。

## モデルの検出

デフォルトでは、Codex Plugin は利用可能なモデルをアプリサーバーに問い合わせます。
モデルの利用可否は Codex アプリサーバーによって管理されるため、OpenClaw がバンドル済みの
`@openai/codex` バージョンをアップグレードした場合や、デプロイ環境で
`appServer.command` が別の Codex バイナリを指す場合、一覧が変わる可能性があります。
利用可否はアカウントごとに異なる場合もあります。実行中の Gateway で `/codex models` を使用すると、
そのハーネスとアカウントの現在のカタログを確認できます。

検出が失敗またはタイムアウトした場合、OpenClaw はバンドル済みのフォールバックカタログを使用します。

| モデル ID      | 表示名       | 推論強度                 |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
現在バンドルされているハーネスは `@openai/codex` `0.144.1` です。そのバンドル済み
アプリサーバーに対する `model/list` の照会では、次の公開モデル選択行が返されました。

| モデル ID       | 入力モダリティ | 推論強度                             |
| --------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`   | テキスト、画像   | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra` | テキスト、画像   | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`  | テキスト、画像   | low, medium, high, xhigh, max        |
| `gpt-5.5`       | テキスト、画像   | low, medium, high, xhigh             |
| `gpt-5.4`       | テキスト、画像   | low, medium, high, xhigh             |
| `gpt-5.4-mini`  | テキスト、画像   | low, medium, high, xhigh             |
| `gpt-5.2`       | テキスト、画像   | low, medium, high, xhigh             |

アプリサーバーカタログは `ultra` を報告できますが、OpenClaw の推論コントロールで
現在公開されているレベルは `max` までです。

現在のモデル選択行はアカウントごとに異なり、アカウント、Codex カタログ、
またはバンドル済みバージョンによって変わる可能性があります。特定時点の表に依存せず、
現在の一覧を確認するには `/codex models` を実行してください。非表示モデルも、
通常のモデル選択肢ではない内部フローや特殊フロー向けとして、
アプリサーバーカタログに表示される場合があります。
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

起動時に Codex への照会を避け、フォールバックカタログのみを使用する場合は、
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

Codex はネイティブのプロジェクトドキュメント検出を通じて、`AGENTS.md` を独自に処理します。
Codex のフォールバックファイル名は `AGENTS.md` が存在しない場合にのみ適用されるため、
OpenClaw は合成された Codex プロジェクトドキュメントファイルを書き込まず、
ペルソナファイルに Codex のフォールバックファイル名を使用しません。

OpenClaw ワークスペースとの同等性を保つため、Codex ハーネスはその他の
ブートストラップファイルを開発者指示として転送しますが、方法は同一ではありません。

- `TOOLS.md` は Codex の**継承される**開発者指示として転送されるため、
  ターン中に生成されたネイティブ Codex サブエージェントも参照できます。
- `SOUL.md`、`IDENTITY.md`、`USER.md` は**ターン単位**の
  コラボレーション指示として転送されます。ネイティブ Codex サブエージェントには継承されないため、
  サブエージェントのターンが親エージェントのペルソナやユーザープロファイルを引き継ぐことを防ぎます。
- 簡潔に読み込まれた OpenClaw Skills の一覧も、ターン単位の
  コラボレーション用開発者指示として転送されるため、ネイティブ Codex サブエージェントには継承されません。
- `HEARTBEAT.md` の内容は注入されません。Heartbeat ターンでは、
  ファイルが存在して空でない場合に、それを読むためのコラボレーションモードの参照指示が追加されます。
- そのワークスペースでメモリツールを利用できる場合、設定されたエージェントワークスペースの
  `MEMORY.md` の内容は、ネイティブ Codex のターン入力に貼り付けられません。
  ファイルが存在する場合、ハーネスはターン単位のコラボレーション用開発者指示に
  簡潔なワークスペースメモリの参照指示を追加し、永続メモリが関連する場合、
  Codex は `memory_search` または `memory_get` を使用します。
  ツールが無効、メモリ検索が利用不可、またはアクティブなワークスペースが
  エージェントのメモリワークスペースと異なる場合、`MEMORY.md` は
  通常の上限付きターンコンテキスト経路を使用します。
- `BOOTSTRAP.md` が存在する場合、OpenClaw のターン入力用参照コンテキストとして転送されます。

## 環境変数による上書き

ローカルテストでは、引き続き次の環境変数で上書きできます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` が未設定の場合、`OPENCLAW_CODEX_APP_SERVER_BIN` は
管理対象バイナリを迂回します。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、
一時的なローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。
再現可能なデプロイでは、Codex ハーネスの他の設定と同じレビュー済みファイル内に
Plugin の動作を保持できるため、設定の使用を推奨します。

## 関連項目

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスのランタイム](/ja-JP/plugins/codex-harness-runtime)
- [Codex の監視](/plugins/codex-supervision)
- [ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins)
- [Codex のコンピューター操作](/ja-JP/plugins/codex-computer-use)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [設定リファレンス](/ja-JP/gateway/configuration-reference)
