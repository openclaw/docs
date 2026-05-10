---
read_when:
    - Codex ハーネスのすべての設定フィールドが必要です
    - app-server のトランスポート、認証、検出、またはタイムアウトの動作を変更している
    - Codex ハーネスの起動、モデル検出、または環境分離をデバッグしている
summary: Codex ハーネス向けの設定、認証、検出、アプリサーバーのリファレンス
title: Codex ハーネスリファレンス
x-i18n:
    generated_at: "2026-05-10T19:42:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72767810c9448015a1ce7f35263dba576151b18c1f4a43ba531d45728241f095
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

このリファレンスでは、同梱の `codex` Plugin の詳細な設定を扱います。セットアップとルーティング判断については、
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

サポートされる最上位フィールド:

| フィールド                 | デフォルト             | 意味                                                                                                                                              |
| -------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 有効                   | Codex app-server `model/list` のモデル検出設定。                                                                                                  |
| `appServer`                | 管理 stdio app-server  | トランスポート、コマンド、認証、承認、サンドボックス、タイムアウトの設定。                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`         | OpenClaw 動的ツールを初期 Codex ツールコンテキストに直接入れるには `"direct"` を使用します。                                                      |
| `codexDynamicToolsExclude` | `[]`                   | Codex app-server ターンから除外する追加の OpenClaw 動的ツール名。                                                                                 |
| `codexPlugins`             | 無効                   | 移行済みのソースインストールされた curated plugins 向けのネイティブ Codex Plugin/app サポート。[ネイティブ Codex plugins](/ja-JP/plugins/codex-native-plugins)を参照してください。 |
| `computerUse`              | 無効                   | Codex Computer Use セットアップ。[Codex Computer Use](/ja-JP/plugins/codex-computer-use)を参照してください。                                            |

## App-server トランスポート

デフォルトでは、OpenClaw は同梱 Plugin に含まれる管理対象の Codex バイナリを起動します。

```bash
codex app-server --listen stdio://
```

これにより、app-server のバージョンは、ローカルにたまたまインストールされている別の Codex CLI ではなく、同梱の `codex` Plugin に結び付けられます。別の実行ファイルを意図的に実行したい場合にのみ、`appServer.command` を設定してください。

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

| フィールド                    | デフォルト                                             | 意味                                                                                                                                                                                                  |
| ----------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` は Codex を起動し、`"websocket"` は `url` に接続します。                                                                                                                                     |
| `command`                     | 管理対象の Codex バイナリ                              | stdio トランスポート用の実行ファイル。管理対象バイナリを使用するには未設定のままにします。                                                                                                           |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | stdio トランスポート用の引数。                                                                                                                                                                        |
| `url`                         | 未設定                                                 | WebSocket app-server URL。                                                                                                                                                                            |
| `authToken`                   | 未設定                                                 | WebSocket トランスポート用の Bearer トークン。                                                                                                                                                        |
| `headers`                     | `{}`                                                   | 追加の WebSocket ヘッダー。                                                                                                                                                                           |
| `clearEnv`                    | `[]`                                                   | OpenClaw が継承環境を構築した後、起動された stdio app-server プロセスから削除される追加の環境変数名。                                                                                                |
| `requestTimeoutMs`            | `60000`                                                | app-server コントロールプレーン呼び出しのタイムアウト。                                                                                                                                              |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | OpenClaw が `turn/completed` を待っている間の、ターンスコープの app-server リクエスト後の無音期間。                                                                                                   |
| `mode`                        | ローカル Codex 要件が YOLO を許可しない場合を除き `"yolo"` | YOLO または guardian レビュー付き実行のプリセット。                                                                                                                                                  |
| `approvalPolicy`              | `"never"` または許可された guardian 承認ポリシー       | スレッド開始、再開、ターンに送信されるネイティブ Codex 承認ポリシー。                                                                                                                                |
| `sandbox`                     | `"danger-full-access"` または許可された guardian サンドボックス | スレッド開始と再開に送信されるネイティブ Codex サンドボックスモード。                                                                                                                                |
| `approvalsReviewer`           | `"user"` または許可された guardian レビュアー          | 許可されている場合、Codex にネイティブ承認プロンプトをレビューさせるには `"auto_review"` を使用します。                                                                                              |
| `defaultWorkspaceDir`         | 現在のプロセスディレクトリ                             | `--cwd` が省略されたときに `/codex bind` が使用するワークスペース。                                                                                                                                   |
| `serviceTier`                 | 未設定                                                 | 任意の Codex app-server サービス階層。`"priority"` は fast-mode ルーティングを有効にし、`"flex"` は flex 処理を要求し、`null` はオーバーライドをクリアします。従来の `"fast"` は `"priority"` として受け付けられます。 |

この Plugin は、古い、またはバージョンなしの app-server ハンドシェイクをブロックします。Codex app-server は安定版バージョン `0.125.0` 以上を報告する必要があります。

## 承認とサンドボックスモード

ローカル stdio app-server セッションのデフォルトは YOLO モードです:
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"`。この信頼されたローカルオペレーター姿勢により、無人の OpenClaw ターンと Heartbeat は、誰も回答できないネイティブ承認プロンプトなしで進行できます。

Codex のローカルシステム要件ファイルが、暗黙の YOLO 承認、レビュアー、またはサンドボックス値を許可しない場合、OpenClaw は暗黙のデフォルトを代わりに guardian として扱い、許可された guardian 権限を選択します。同じ要件ファイル内のホスト名一致 `[[remote_sandbox_config]]` エントリは、サンドボックスのデフォルト判断で尊重されます。

Codex guardian レビュー付き承認には `appServer.mode: "guardian"` を設定します。

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
`approvalsReviewer: "auto_review"`、および `sandbox: "workspace-write"` に展開されます。個別のポリシーフィールドは `mode` を上書きします。古い `guardian_subagent` レビュアー値は互換性エイリアスとして引き続き受け付けられますが、新しい設定では `auto_review` を使用してください。

## 認証と環境分離

認証は次の順序で選択されます。

1. エージェント用の明示的な OpenClaw Codex 認証プロファイル。
2. そのエージェントの Codex ホームにある app-server の既存アカウント。
3. ローカル stdio app-server 起動の場合のみ、app-server アカウントが存在せず、OpenAI 認証がまだ必要なときに、`CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出すると、起動された Codex 子プロセスから `CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、Gateway レベルの API キーを embeddings や直接の OpenAI モデルで利用可能にしたまま、ネイティブ Codex app-server ターンが誤って API 経由で課金されることを防ぎます。

明示的な Codex API キープロファイルとローカル stdio env キーフォールバックは、継承された子プロセス env ではなく app-server ログインを使用します。WebSocket app-server 接続は Gateway env API キーフォールバックを受け取りません。明示的な認証プロファイル、またはリモート app-server 自身のアカウントを使用してください。

stdio app-server 起動はデフォルトで OpenClaw のプロセス環境を継承しますが、OpenClaw は Codex app-server アカウントブリッジを所有し、`CODEX_HOME` と `HOME` の両方を、そのエージェントの OpenClaw 状態配下にあるエージェントごとのディレクトリに設定します。Codex 自身のスキルローダーは `$CODEX_HOME/skills` と `$HOME/.agents/skills` を読み取るため、ローカル app-server 起動では両方の値が分離されます。これにより、Codex ネイティブの Skills、plugins、設定、アカウント、スレッド状態は、オペレーター個人の Codex CLI ホームから漏れ込むのではなく、OpenClaw エージェントにスコープされます。

OpenClaw plugins と OpenClaw Skills スナップショットは、引き続き OpenClaw 独自の Plugin レジストリと Skills ローダーを通ります。個人の Codex CLI アセットは通りません。OpenClaw エージェントの一部にすべき有用な Codex CLI Skills または plugins がある場合は、明示的に棚卸ししてください。

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

デプロイに追加の環境分離が必要な場合は、それらの変数を `appServer.clearEnv` に追加します。

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

`appServer.clearEnv` は、起動された Codex app-server 子プロセスにのみ影響します。`CODEX_HOME` と `HOME` は、ローカル起動における OpenClaw のエージェントごとの Codex 分離用に予約されたままです。

## 動的ツール

Codex 動的ツールのデフォルトは `searchable` ローディングです。OpenClaw は Codex ネイティブのワークスペース操作と重複する動的ツールを公開しません。

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

メッセージング、セッション、メディア、cron、ブラウザー、ノード、gateway、`heartbeat_respond`、`web_search` など、残りの OpenClaw 連携ツールは、
`openclaw` 名前空間の下にある Codex ツール検索を通じて利用できます。これにより、初期の
モデルコンテキストを小さく保てます。`sessions_yield` とメッセージツール専用のソース返信は、
ターン制御コントラクトであるため直接のままです。

遅延動的ツールを検索できないカスタム Codex
app-server に接続する場合、または完全な
ツールペイロードをデバッグする場合にのみ、`codexDynamicToolsLoading: "direct"` を設定してください。

## タイムアウト

OpenClaw が所有する動的ツール呼び出しは、
`appServer.requestTimeoutMs` とは独立して制限されます。各 Codex `item/tool/call` リクエストでは、
次の順序で最初に利用可能なタイムアウトを使用します。

- 正の値の呼び出しごとの `timeoutMs` 引数。
- `image_generate` では、`agents.defaults.imageGenerationModel.timeoutMs`。
- メディア理解用の `image` ツールでは、`tools.media.image.timeoutSeconds`
  をミリ秒に変換した値、または 60 秒のメディア既定値。
- 30 秒の動的ツール既定値。

動的ツールの予算は 600000 ms に上限設定されます。タイムアウト時、OpenClaw はサポートされている場合に
ツールシグナルを中止し、失敗した動的ツール応答を Codex に返します。これにより、セッションを `processing` のまま残すのではなく、
ターンを継続できます。

OpenClaw が Codex のターンスコープ付き app-server リクエストに応答した後、ハーネスは
Codex がネイティブターンを `turn/completed` で完了することも期待します。その
応答後に `appServer.turnCompletionIdleTimeoutMs` の間 app-server が静かなままの場合、
OpenClaw はベストエフォートで Codex ターンを中断し、診断用タイムアウトを記録し、
古くなったネイティブターンの後ろに後続のチャットメッセージがキューされないように OpenClaw セッションレーンを解放します。

同じターンに対する非終端通知（`rawResponseItem/completed` を含む）は、
Codex がターンがまだ生きていることを証明したため、その短いウォッチドッグを解除します。より長い終端ウォッチドッグは、
本当に詰まったターンを引き続き保護します。タイムアウト診断には、最後の app-server
通知メソッドと、生のアシスタント応答項目については項目タイプ、ロール、
id、および制限付きのアシスタントテキストプレビューが含まれます。

## モデル検出

既定では、Codex Plugin は利用可能なモデルを app-server に問い合わせます。モデルの
可用性は Codex app-server が所有するため、OpenClaw がバンドルされた `@openai/codex` バージョンをアップグレードした場合や、デプロイが
`appServer.command` を別の Codex バイナリに向けた場合に、リストが変わることがあります。可用性は
アカウント単位になることもあります。実行中の Gateway で `/codex models` を使用すると、そのハーネスとアカウントのライブカタログを確認できます。

検出が失敗またはタイムアウトした場合、OpenClaw は次のバンドル済みフォールバックカタログを使用します。

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

現在バンドルされているハーネスは `@openai/codex` `0.130.0` です。そのバンドル済み app-server に対する `model/list` プローブは、
次を返しました。

| モデル id              | 既定 | 非表示 | 入力モダリティ | 推論エフォート        |
| --------------------- | ------- | ------ | ---------------- | ------------------------ |
| `gpt-5.5`             | はい     | いいえ     | text, image      | low, medium, high, xhigh |
| `gpt-5.4`             | いいえ      | いいえ     | text, image      | low, medium, high, xhigh |
| `gpt-5.4-mini`        | いいえ      | いいえ     | text, image      | low, medium, high, xhigh |
| `gpt-5.3-codex`       | いいえ      | いいえ     | text, image      | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | いいえ      | いいえ     | text             | low, medium, high, xhigh |
| `gpt-5.2`             | いいえ      | いいえ     | text, image      | low, medium, high, xhigh |

非表示モデルは、内部フローや
特殊なフロー向けに app-server カタログから返されることがありますが、通常のモデルピッカーの選択肢ではありません。

`plugins.entries.codex.config.discovery` の下で検出を調整します。

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

起動時に Codex のプローブを避け、フォールバックカタログのみを使用したい場合は検出を無効にします。

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
合成 Codex プロジェクトドキュメントファイルを書き込まず、ペルソナファイル向けの Codex フォールバック
ファイル名にも依存しません。これは Codex フォールバックが
`AGENTS.md` がない場合にのみ適用されるためです。

OpenClaw ワークスペースの同等性のために、Codex ハーネスは、存在する場合に `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、
`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md` を含む他のブートストラップ
ファイルを解決し、それらを `thread/start` と `thread/resume` の Codex developer instructions を通じて転送します。
これにより、`AGENTS.md` を重複させずに、ワークスペースのペルソナとプロファイルコンテキストをネイティブ Codex
の挙動形成レーンに見える状態に保てます。

## 環境オーバーライド

環境オーバーライドはローカルテストで引き続き利用できます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` が未設定の場合、`OPENCLAW_CODEX_APP_SERVER_BIN` はマネージドバイナリをバイパスします。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、
一回限りのローカルテストでは `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。再現可能なデプロイでは、
Codex ハーネスセットアップの残りと同じレビュー済みファイル内に Plugin の挙動を保てるため、設定が推奨されます。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins)
- [Codex Computer Use](/ja-JP/plugins/codex-computer-use)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [構成リファレンス](/ja-JP/gateway/configuration-reference)
