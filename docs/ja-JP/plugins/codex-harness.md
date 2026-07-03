---
read_when:
    - バンドルされた Codex app-server ハーネスを使用したい場合
    - Codex ハーネス設定例が必要です
    - Codex のみのデプロイでは OpenClaw にフォールバックせずに失敗させたい
summary: バンドルされた Codex app-server ハーネスを通じて OpenClaw 埋め込みエージェントターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-07-03T13:16:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589aed06678207b3349c17dd1997c2d17abd5f4b8747fc18fd858b5a03a2d003
    source_path: plugins/codex-harness.md
    workflow: 16
---

バンドルされた `codex` Plugin により、OpenClaw は組み込みの OpenClaw ハーネスではなく
Codex app-server 経由で埋め込み OpenAI エージェントターンを実行できます。

低レベルのエージェントセッションを Codex に所有させたい場合は、Codex ハーネスを使用します。
ネイティブスレッドの再開、ネイティブツールの継続、ネイティブ Compaction、
app-server 実行が対象です。OpenClaw は引き続き、チャットチャンネル、セッションファイル、モデル
選択、OpenClaw 動的ツール、承認、メディア配信、表示されるトランスクリプトミラーを所有します。

通常のセットアップでは、`openai/gpt-5.5` のような正規の OpenAI モデル参照を使用します。
レガシー Codex GPT 参照は設定しないでください。OpenAI エージェント認証順序は
`auth.order.openai` の下に置きます。古いレガシー Codex 認証プロファイル ID と
レガシー Codex 認証順序エントリは、`openclaw doctor --fix` によって修復されるレガシー状態です。

OpenClaw サンドボックスがアクティブでない場合、OpenClaw は code-mode-only をデフォルトでオフのままにしつつ、
Codex ネイティブコードモードを有効にして Codex app-server スレッドを開始します。
これにより、Codex ネイティブワークスペースとコード機能を利用可能に保ちながら、
OpenClaw 動的ツールは app-server の `item/tool/call` ブリッジを通じて継続します。
アクティブな OpenClaw サンドボックス化と制限付きツールポリシーでは、実験的なサンドボックス
exec-server パスにオプトインしない限り、ネイティブコードモードは完全に無効になります。

この Codex ネイティブ機能は、
[OpenClaw code mode](/ja-JP/reference/code-mode) とは別のものです。これは、異なる `exec` 入力形状を持つ
汎用 OpenClaw 実行用のオプトイン QuickJS-WASI ランタイムです。

より広範なモデル、プロバイダー、ランタイムの分離については、
[エージェントランタイム](/ja-JP/concepts/agent-runtimes) から始めてください。要約すると、
`openai/gpt-5.5` はモデル参照、`codex` はランタイムであり、Telegram、
Discord、Slack、または別のチャンネルが通信サーフェスのままです。

## 要件

- バンドルされた `codex` Plugin が利用可能な OpenClaw。
- 設定で `plugins.allow` を使用している場合は、`codex` を含めます。
- Codex app-server `0.125.0` 以降。バンドルされた Plugin はデフォルトで互換性のある
  Codex app-server バイナリを管理するため、`PATH` 上のローカル `codex` コマンドは通常の
  ハーネス起動に影響しません。
- `openclaw models auth login --provider openai`、エージェントの Codex ホーム内の
  app-server アカウント、または明示的な Codex API キー認証プロファイルを通じて Codex 認証が利用可能であること。

認証の優先順位、環境分離、カスタム app-server コマンド、モデル
検出、およびすべての設定フィールドについては、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference) を参照してください。

## クイックスタート

OpenClaw で Codex を使いたいほとんどのユーザーには、このパスが適しています。
ChatGPT/Codex サブスクリプションでサインインし、バンドルされた `codex` Plugin を有効にして、
正規の `openai/gpt-*` モデル参照を使用します。

Codex OAuth でサインインします。

```bash
openclaw models auth login --provider openai
```

バンドルされた `codex` Plugin を有効にし、OpenAI エージェントモデルを選択します。

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

Plugin 設定を変更した後は Gateway を再起動します。既存のチャットにすでにセッションがある場合は、
ランタイム変更をテストする前に `/new` または `/reset` を使用して、次のターンが現在の設定から
ハーネスを解決するようにします。

## 設定

クイックスタート設定は、最小限で動作する Codex ハーネス設定です。Codex
ハーネスオプションは OpenClaw 設定で指定し、CLI は Codex 認証にのみ使用します。

| 必要なこと                             | 設定                                                                             | 場所                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| ハーネスを有効にする                   | `plugins.entries.codex.enabled: true`                                            | OpenClaw 設定                      |
| 許可リスト付き Plugin インストールを維持する | `plugins.allow` に `codex` を含める                                              | OpenClaw 設定                      |
| OpenAI エージェントターンを Codex 経由にする | `agents.defaults.model` または `agents.list[].model` を `openai/gpt-*` にする    | OpenClaw エージェント設定          |
| ChatGPT/Codex OAuth でサインインする   | `openclaw models auth login --provider openai`                                   | CLI 認証プロファイル               |
| Codex 実行用の API キーバックアップを追加する | `auth.order.openai` でサブスクリプション認証の後に `openai:*` API キープロファイルを列挙 | CLI 認証プロファイル + OpenClaw 設定 |
| Codex が利用不可の場合にフェイルクローズする | プロバイダーまたはモデルの `agentRuntime.id: "codex"`                           | OpenClaw モデル/プロバイダー設定   |
| 直接 OpenAI API トラフィックを使用する | 通常の OpenAI 認証とともにプロバイダーまたはモデルの `agentRuntime.id: "openclaw"` | OpenClaw モデル/プロバイダー設定   |
| app-server の動作を調整する            | `plugins.entries.codex.config.appServer.*`                                       | Codex Plugin 設定                  |
| ネイティブ Codex Plugin アプリを有効にする | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex Plugin 設定                  |
| Codex Computer Use を有効にする        | `plugins.entries.codex.config.computerUse.*`                                     | Codex Plugin 設定                  |

Codex バックの OpenAI エージェントターンには `openai/gpt-*` モデル参照を使用します。
サブスクリプション優先/API キーバックアップの順序には `auth.order.openai` を推奨します。
既存のレガシー Codex 認証プロファイル ID とレガシー Codex 認証順序は doctor 専用の
レガシー状態です。新しいレガシー Codex GPT 参照は書き込まないでください。

Codex バックのエージェントに `compaction.model` または `compaction.provider` を設定しないでください。
Codex はネイティブ app-server スレッド状態を通じて圧縮するため、OpenClaw は実行時に
これらのローカル要約オーバーライドを無視し、エージェントが Codex を使用している場合は
`openclaw doctor --fix` がそれらを削除します。

Lossless は、Codex ターンの周辺でのアセンブリ、取り込み、メンテナンスのためのコンテキストエンジンとして
引き続きサポートされます。`agents.defaults.compaction.provider` ではなく、
`plugins.slots.contextEngine: "lossless-claw"` と
`plugins.entries.lossless-claw.config.summaryModel` を通じて設定してください。
Codex がアクティブなランタイムである場合、`openclaw doctor --fix` は古い
`compaction.provider: "lossless-claw"` 形状を Lossless コンテキストエンジンスロットに移行しますが、
ネイティブ Codex が引き続き Compaction を所有します。

ネイティブ Codex app-server ハーネスは、事前プロンプトアセンブリを必要とするコンテキストエンジンをサポートします。
`codex-cli` を含む汎用 CLI バックエンドは、そのホスト機能を提供しません。

Codex バックのエージェントでは、`/compact` はバインドされたスレッドでネイティブ Codex app-server
Compaction を開始します。OpenClaw は完了を待機せず、OpenClaw タイムアウトを課さず、
共有 app-server を再起動せず、コンテキストエンジンや公開 OpenAI 要約機能へフォールバックしません。
ネイティブ Codex スレッドバインディングが存在しない、または古い場合、コマンドはフェイルクローズし、
オペレーターが Compaction バックエンドのサイレントな切り替えではなく、実際のランタイム境界を確認できるようにします。

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

この形状では、どちらのプロファイルも `openai/gpt-*` エージェントターンでは Codex 経由で実行されます。
API キーは認証フォールバックにすぎず、OpenClaw や通常の OpenAI Responses に切り替える要求ではありません。

このページの残りでは、ユーザーが選択する必要のある一般的なバリエーションを扱います。
デプロイ形状、フェイルクローズルーティング、ガーディアン承認ポリシー、ネイティブ Codex
Plugin、Computer Use です。完全なオプション一覧、デフォルト、列挙値、検出、
環境分離、タイムアウト、app-server トランスポートフィールドについては、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference) を参照してください。

## Codex ランタイムを確認する

Codex を期待するチャットで `/status` を使用します。Codex バックの OpenAI エージェント
ターンでは次のように表示されます。

```text
Runtime: OpenAI Codex
```

次に Codex app-server 状態を確認します。

```text
/codex status
/codex models
```

`/codex status` は app-server 接続、アカウント、レート制限、MCP
サーバー、Skills を報告します。`/codex models` は、ハーネスとアカウント用のライブ Codex app-server カタログを一覧表示します。
`/status` の結果が想定外の場合は、[トラブルシューティング](#troubleshooting) を参照してください。

## ルーティングとモデル選択

プロバイダー参照とランタイムポリシーは分けて扱います。

- Codex 経由の OpenAI エージェントターンには `openai/gpt-*` を使用します。
- 設定でレガシー Codex GPT 参照を使用しないでください。`openclaw doctor --fix` を実行して、
  レガシー参照と古いセッションルートピンを修復します。
- `agentRuntime.id: "codex"` は通常の OpenAI 自動モードでは任意ですが、
  Codex が利用不可の場合にデプロイをフェイルクローズさせたい場合に便利です。
- `agentRuntime.id: "openclaw"` は、意図的にプロバイダーまたはモデルを OpenClaw
  埋め込みランタイムにオプトインさせます。
- `/codex ...` はチャットからネイティブ Codex app-server 会話を制御します。
- ACP/acpx は別の外部ハーネスパスです。ユーザーが ACP/acpx または外部ハーネスアダプターを求めている場合にのみ使用してください。

一般的なコマンドルーティング:

| ユーザーの意図                                      | 使用するもの                                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 現在のチャットをアタッチする                        | `/codex bind [--cwd <path>]`                                                                          |
| 既存の Codex スレッドを再開する                     | `/codex resume <thread-id>`                                                                           |
| Codex スレッドを一覧表示またはフィルタリングする    | `/codex threads [filter]`                                                                             |
| ネイティブ Codex Plugin を一覧表示する              | `/codex plugins list`                                                                                 |
| 設定済みのネイティブ Codex Plugin を有効または無効にする | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| ペアリング済みノード上の既存の Codex CLI セッションをアタッチする | `/codex sessions --host <node> [filter]`, then `/codex resume <session-id> --host <node> --bind here` |
| Codex フィードバックのみを送信する                  | `/codex diagnostics [note]`                                                                           |
| ACP/acpx タスクを開始する                           | ACP/acpx セッションコマンド、`/codex` ではありません                                                  |

| ユースケース                                             | 設定                                                              | 確認                                  | 注記                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| ネイティブ Codex ランタイムを使う ChatGPT/Codex サブスクリプション | `openai/gpt-*` に加えて `codex` plugin を有効化                             | `/status` に `Runtime: OpenAI Codex` と表示される | 推奨パス                      |
| Codex が利用できない場合にフェイルクローズ                  | プロバイダーまたはモデルの `agentRuntime.id: "codex"`                           | 埋め込みフォールバックではなくターンが失敗する | Codex 専用デプロイに使用        |
| OpenClaw 経由で直接 OpenAI API キートラフィックを通す       | プロバイダーまたはモデルの `agentRuntime.id: "openclaw"` と通常の OpenAI 認証 | `/status` に OpenClaw ランタイムと表示される        | OpenClaw を意図している場合にのみ使用 |
| レガシー設定                                        | レガシー Codex GPT 参照                                                  | `openclaw doctor --fix` が書き換える     | 新しい設定をこの方法で書かない      |
| ACP/acpx Codex アダプター                               | ACP `sessions_spawn({ runtime: "acp" })`                               | ACP タスク/セッションステータス                 | ネイティブ Codex ハーネスとは別    |

`agents.defaults.imageModel` は同じプレフィックス分割に従います。通常の OpenAI ルートには `openai/gpt-*`
を使用し、画像理解を境界付きの Codex アプリサーバーターン経由で実行する必要がある場合にのみ
`codex/gpt-*` を使用してください。レガシー Codex GPT 参照は使用しないでください。doctor はそのレガシープレフィックスを `openai/gpt-*` に書き換えます。

## デプロイパターン

### 基本的な Codex デプロイ

すべての OpenAI エージェントターンでデフォルトで Codex を使う場合は、クイックスタート設定を使用します。

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

この形では Claude をデフォルトエージェントのままにし、名前付き Codex エージェントを追加します。

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

この設定では、`main` エージェントは通常のプロバイダーパスを使用し、`codex` エージェントは Codex アプリサーバーを使用します。

### フェイルクローズ Codex デプロイ

OpenAI エージェントターンでは、バンドル plugin が利用可能な場合、`openai/gpt-*` はすでに Codex に解決されます。明示的なフェイルクローズルールを書きたい場合は、ランタイムポリシーを追加します。

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

Codex を強制すると、Codex plugin が無効、アプリサーバーが古すぎる、またはアプリサーバーを開始できない場合に OpenClaw は早期に失敗します。

## アプリサーバーポリシー

デフォルトでは、plugin は OpenClaw が管理する Codex バイナリを stdio トランスポートでローカル起動します。
別の実行ファイルを意図的に実行したい場合にのみ `appServer.command` を設定してください。アプリサーバーがすでに別の場所で実行されている場合にのみ WebSocket トランスポートを使用します。

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

ローカル stdio アプリサーバーセッションは、信頼されたローカルオペレーターの姿勢をデフォルトにします。
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"` です。ローカル Codex 要件がこの暗黙の YOLO 姿勢を許可しない場合、OpenClaw は代わりに許可された guardian 権限を選択します。
セッションで OpenClaw サンドボックスが有効な場合、OpenClaw は Codex ホスト側サンドボックスに依存するのではなく、そのターンで Codex ネイティブ Code Mode、ユーザー MCP サーバー、アプリ支援 plugin 実行を無効にします。
通常の exec/process ツールが利用可能な場合、シェルアクセスは `sandbox_exec` や
`sandbox_process` などの OpenClaw サンドボックス支援動的ツールを通じて公開されます。

サンドボックス脱出や追加権限の前に Codex ネイティブの自動レビューを使いたい場合は、正規化された OpenClaw exec モードを使用します。

```json5
{
  tools: {
    exec: {
      mode: "auto",
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

Codex アプリサーバーセッションでは、ローカル要件がそれらの値を許可する場合、OpenClaw は `tools.exec.mode: "auto"` を Codex Guardian レビュー付き承認にマップします。通常は
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、および
`sandbox: "workspace-write"` です。
`tools.exec.mode: "auto"` では、OpenClaw はレガシーで安全でない Codex の
`approvalPolicy: "never"` または `sandbox: "danger-full-access"` 上書きを保持しません。意図的な承認なし Codex 姿勢には
`tools.exec.mode: "full"` を使用してください。レガシーの `plugins.entries.codex.config.appServer.mode: "guardian"` プリセットは引き続き機能しますが、`tools.exec.mode: "auto"` が正規化された OpenClaw サーフェスです。

ホスト exec 承認および ACPX 権限とのモードレベル比較については、[権限モード](/ja-JP/tools/permission-modes)を参照してください。

すべてのアプリサーバーフィールド、認証順序、環境分離、検出、タイムアウト動作については、[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## コマンドと診断

バンドル plugin は、OpenClaw テキストコマンドをサポートする任意のチャネルにスラッシュコマンドとして `/codex` を登録します。

ネイティブ実行と制御には、オーナーまたは `operator.admin` Gateway クライアントが必要です。これには、スレッドのバインドまたは再開、ターンの送信または停止、モデル、fast-mode、権限状態の変更、compact またはレビュー、バインド解除が含まれます。他の承認済み送信者は、読み取り専用のステータス、ヘルプ、アカウント、モデル、スレッド、MCP サーバー、skill、バインド検査コマンドを保持します。

一般的な形式:

- `/codex status` はアプリサーバー接続、モデル、アカウント、レート制限、
  MCP サーバー、skills を確認します。
- `/codex models` はライブ Codex アプリサーバーモデルを一覧表示します。
- `/codex threads [filter]` は最近の Codex アプリサーバースレッドを一覧表示します。
- `/codex resume <thread-id>` は現在の OpenClaw セッションを既存の Codex スレッドにアタッチします。
- `/codex compact` は Codex アプリサーバーに、アタッチされたスレッドの compact を依頼します。
- `/codex review` はアタッチされたスレッドに対して Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` はアタッチされたスレッドの Codex フィードバックを送信する前に確認します。
- `/codex account` はアカウントとレート制限のステータスを表示します。
- `/codex mcp` は Codex アプリサーバー MCP サーバーのステータスを一覧表示します。
- `/codex skills` は Codex アプリサーバー skills を一覧表示します。

ほとんどのサポート報告では、バグが発生した会話で `/diagnostics [note]` から始めます。これは 1 つの Gateway 診断レポートを作成し、Codex ハーネスセッションでは、関連する Codex フィードバックバンドルを送信する承認を求めます。
プライバシーモデルとグループチャット動作については、[診断エクスポート](/ja-JP/gateway/diagnostics)を参照してください。

完全な Gateway 診断バンドルなしで、現在アタッチされているスレッドの Codex フィードバックアップロードを特に必要とする場合にのみ、`/codex diagnostics [note]` を使用してください。

### Codex スレッドをローカルで検査する

問題のある Codex 実行を検査する最速の方法は、多くの場合、ネイティブ Codex スレッドを直接開くことです。

```bash
codex resume <thread-id>
```

完了した `/diagnostics` 応答、`/codex binding`、または
`/codex threads [filter]` からスレッド ID を取得します。

アップロードの仕組みとランタイムレベルの診断境界については、
[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#codex-feedback-upload)を参照してください。

認証は次の順序で選択されます。

1. エージェントの順序付き OpenAI 認証プロファイル。できれば
   `auth.order.openai` 配下に置きます。古いレガシー Codex 認証プロファイル ID とレガシー Codex 認証順序を移行するには、`openclaw doctor --fix` を実行します。
2. そのエージェントの Codex ホームにあるアプリサーバーの既存アカウント。
3. ローカル stdio アプリサーバー起動のみで、アプリサーバーアカウントが存在せず、OpenAI 認証がまだ必要な場合は、`CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出すると、生成された Codex 子プロセスから
`CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、Gateway レベルの API キーを埋め込みや直接 OpenAI モデルに利用可能なままにしつつ、ネイティブ Codex アプリサーバーターンが誤って API 経由で課金されることを防ぎます。
明示的な Codex API キープロファイルとローカル stdio 環境キーのフォールバックは、継承された子プロセス環境ではなくアプリサーバーログインを使用します。WebSocket アプリサーバー接続は Gateway 環境 API キーフォールバックを受け取りません。明示的な認証プロファイルまたはリモートアプリサーバー自身のアカウントを使用してください。
ネイティブ Codex plugins が設定されている場合、OpenClaw は plugin 所有アプリを Codex スレッドに公開する前に、接続されたアプリサーバーを通じてそれらの plugins をインストールまたは更新します。
`app/list` は引き続きアプリ ID、アクセシビリティ、メタデータの信頼できる情報源ですが、スレッド単位の有効化判断は OpenClaw が所有します。ポリシーで一覧上のアクセス可能なアプリが許可されている場合、`app/list` が現在そのアプリを無効と報告していても、OpenClaw は
`thread/start.config.apps[appId].enabled = true` を送信します。このパスは未知の ID に対するアプリインストールを作り出しません。OpenClaw は `plugin/install` でマーケットプレイス plugins のみを有効化し、その後インベントリを更新します。

サブスクリプションプロファイルが Codex 使用制限に達した場合、Codex がリセット時刻を報告していれば OpenClaw はそれを記録し、同じ Codex 実行に対して次の順序付き認証プロファイルを試します。リセット時刻が過ぎると、選択された `openai/gpt-*` モデルまたは Codex ランタイムを変更しなくても、サブスクリプションプロファイルは再び利用可能になります。

ローカル stdio アプリサーバー起動では、OpenClaw は `CODEX_HOME` をエージェント単位のディレクトリに設定し、Codex 設定、認証/アカウントファイル、plugin キャッシュ/データ、ネイティブスレッド状態がデフォルトでオペレーター個人の `~/.codex` を読み書きしないようにします。
OpenClaw は通常のプロセス `HOME` を保持します。Codex 実行サブプロセスは引き続きユーザーホームの設定とトークンを見つけることができ、Codex は共有の
`$HOME/.agents/skills` および `$HOME/.agents/plugins/marketplace.json` エントリを検出する場合があります。

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
OpenClaw はローカル起動の正規化中に、このリストから `CODEX_HOME` と `HOME` を削除します。`CODEX_HOME` はエージェント単位のまま、`HOME` は継承されたままなので、サブプロセスは通常のユーザーホーム状態を使用できます。

Codex 動的ツールのデフォルトは `searchable` 読み込みです。OpenClaw は
Codex ネイティブのワークスペース操作と重複する動的ツールを公開しません: `read`、`write`、
`edit`、`apply_patch`、`exec`、`process`、`update_plan`。メッセージング、メディア、Cron、ブラウザー、ノード、
Gateway、`heartbeat_respond` など、残りの OpenClaw 統合ツールの大半は、
`openclaw` 名前空間の Codex ツール検索から利用でき、初期モデルコンテキストを小さく保ちます。検索が有効で、管理対象プロバイダーが選択されていない場合、Web 検索はデフォルトで Codex のホスト型 `web_search` ツールを使用します。ネイティブのホスト型検索と OpenClaw の管理対象
`web_search` 動的ツールは相互に排他的であるため、管理対象検索がネイティブのドメイン制限を迂回することはできません。ホスト型検索が利用できない、明示的に無効化されている、または選択された管理対象プロバイダーで置き換えられている場合、OpenClaw は管理対象ツールを使用します。
OpenClaw は Codex のスタンドアロン `web.run` 拡張を無効のままにします。これは、
本番 app-server トラフィックがユーザー定義の `web` 名前空間を拒否するためです。
`tools.web.search.enabled: false` は両方の経路を無効化し、ツールが無効化された
LLM のみの実行でも同様です。Codex は `"cached"` を設定傾向として扱い、制限のない app-server ターンではライブ外部アクセスに解決します。ネイティブの `allowedDomains` が設定されている場合、自動管理対象フォールバックはフェイルクローズするため、許可リストは迂回できません。永続的な有効検索ポリシーの変更では、次のターンの前にバインドされた Codex
スレッドをローテーションします。一時的なターンごとの制限では、一時的な制限付きスレッドを使用し、後で再開できるよう既存のバインドを保持します。
`sessions_yield` とメッセージツールのみのソース返信は直接のままです。これらはターン制御コントラクトだからです。`sessions_spawn` は検索可能なままなので、Codex のネイティブ `spawn_agent` が引き続き主要な Codex サブエージェント面になります。一方で、明示的な OpenClaw または ACP 委任は、引き続き `openclaw` 動的ツール名前空間から利用できます。Heartbeat 共同作業の指示では、ツールがまだ読み込まれていない場合、Heartbeat ターンを終了する前に
`heartbeat_respond` を検索するよう Codex に伝えます。

遅延動的ツールを検索できないカスタム Codex
app-server に接続する場合、または完全なツールペイロードをデバッグする場合にのみ、`codexDynamicToolsLoading: "direct"` を設定してください。

サポートされる最上位の Codex Plugin フィールド:

| フィールド                 | デフォルト   | 意味                                                                                  |
| -------------------------- | ------------ | ------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw 動的ツールを初期 Codex ツールコンテキストに直接入れるには `"direct"` を使用します。 |
| `codexDynamicToolsExclude` | `[]`         | Codex app-server ターンから省略する追加の OpenClaw 動的ツール名。                    |
| `codexPlugins`             | 無効         | 移行済みのソースインストールされたキュレーション済み Plugin に対する、ネイティブ Codex Plugin/app サポート。 |

サポートされる `appServer` フィールド:

| フィールド                                    | デフォルト                                             | 意味                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` は Codex を起動し、`"websocket"` は `url` に接続します。                                                                                                                                                                                                                                                                                                                               |
| `command`                                     | 管理対象の Codex バイナリ                              | stdio トランスポート用の実行ファイル。管理対象バイナリを使う場合は未設定のままにし、明示的に上書きする場合のみ設定します。                                                                                                                                                                                                                                                                      |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio トランスポート用の引数。                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 未設定                                                 | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                      |
| `authToken`                                   | 未設定                                                 | WebSocket トランスポート用の Bearer トークン。リテラル文字列、または `${CODEX_APP_SERVER_TOKEN}` のような SecretInput を受け付けます。                                                                                                                                                                                                                                                           |
| `headers`                                     | `{}`                                                   | 追加の WebSocket ヘッダー。ヘッダー値はリテラル文字列、または `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"` のような SecretInput 値を受け付けます。                                                                                                                                                                                                                            |
| `clearEnv`                                    | `[]`                                                   | OpenClaw が継承環境を構築した後、起動された stdio app-server プロセスから削除される追加の環境変数名。OpenClaw はローカル起動のために、エージェントごとの `CODEX_HOME` と継承された `HOME` を保持します。                                                                                                                                                                                       |
| `codeModeOnly`                                | `false`                                                | Codex のコードモード専用ツールサーフェスを有効にします。OpenClaw の動的ツールは Codex に登録されたままなので、ネストされた `tools.*` 呼び出しは app-server の `item/tool/call` ブリッジを通じて返ります。                                                                                                                                                                                        |
| `remoteWorkspaceRoot`                         | 未設定                                                 | リモート Codex app-server のワークスペースルート。設定すると、OpenClaw は解決済みの OpenClaw ワークスペースからローカルワークスペースルートを推定し、このリモートルート配下の現在の cwd サフィックスを保持して、最終的な app-server cwd のみを Codex に送信します。cwd が解決済みの OpenClaw ワークスペースルートの外にある場合、OpenClaw は Gateway ローカルパスをリモート app-server に送信せず、fail closed します。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server コントロールプレーン呼び出しのタイムアウト。                                                                                                                                                                                                                                                                                                                                         |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex がターンを受け入れた後、またはターンスコープの app-server リクエストの後に、OpenClaw が `turn/completed` を待機する間の静かなウィンドウ。                                                                                                                                                                                                                                                   |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | ツールへのハンドオフ、ネイティブツール完了、ツール後の raw assistant 進行、raw reasoning 完了、または reasoning 進行の後、OpenClaw が `turn/completed` を待機する間に使用される完了アイドルおよび進行ガード。ツール後の合成が最終 assistant リリース予算よりも正当に長く静かな状態を保てる、信頼済みまたは重いワークロードに使用します。                                                        |
| `mode`                                        | ローカル Codex 要件が YOLO を許可しない場合を除き `"yolo"` | YOLO または guardian レビュー付き実行のプリセット。`danger-full-access`、`never` approval、または `user` reviewer を省略するローカル stdio 要件では、暗黙のデフォルトが guardian になります。                                                                                                                                                                                                    |
| `approvalPolicy`                              | `"never"` または許可された guardian approval policy    | スレッド開始/再開/ターンに送信されるネイティブ Codex approval policy。guardian のデフォルトは、許可されている場合 `"on-request"` を優先します。                                                                                                                                                                                                                                                   |
| `sandbox`                                     | `"danger-full-access"` または許可された guardian sandbox | スレッド開始/再開に送信されるネイティブ Codex sandbox mode。guardian のデフォルトは、許可されている場合 `"workspace-write"` を優先し、それ以外の場合は `"read-only"` を優先します。OpenClaw sandbox が有効な場合、`danger-full-access` ターンは Codex `workspace-write` を使用し、ネットワークアクセスは OpenClaw sandbox egress 設定から派生します。                                             |
| `approvalsReviewer`                           | `"user"` または許可された guardian reviewer            | 許可されている場合、Codex にネイティブ approval prompt をレビューさせるには `"auto_review"` を使用し、それ以外の場合は `guardian_subagent` または `user` を使用します。`guardian_subagent` はレガシーエイリアスのままです。                                                                                                                                                                      |
| `serviceTier`                                 | 未設定                                                 | 任意の Codex app-server service tier。`"priority"` は fast-mode ルーティングを有効にし、`"flex"` は flex processing を要求し、`null` は上書きをクリアし、レガシーの `"fast"` は `"priority"` として受け入れられます。                                                                                                                                                                             |
| `networkProxy`                                | 無効                                                   | app-server コマンド向けの Codex permissions-profile ネットワーキングを有効にします。OpenClaw は、`sandbox` を送信する代わりに、選択された `permissions.<profile>.network` config を定義し、`default_permissions` で選択します。                                                                                                                                                                  |
| `experimental.sandboxExecServer`              | `false`                                                | OpenClaw sandbox に裏付けられた Codex environment を Codex app-server 0.132.0 以降に登録するプレビューのオプトイン。これにより、ネイティブ Codex 実行をアクティブな OpenClaw sandbox 内で実行できます。                                                                                                                                                                                          |

`appServer.networkProxy` は Codex sandbox の契約を変更するため明示的です。
有効にすると、OpenClaw は Codex スレッド config に
`features.network_proxy.enabled` と `default_permissions` も設定し、生成された permission
profile が Codex 管理ネットワーキングを開始できるようにします。デフォルトでは、OpenClaw は
profile 本体から衝突に強い `openclaw-network-<fingerprint>` profile 名を生成します。
安定したローカル名が必要な場合のみ `profileName` を使用してください。

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
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
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
`networkProxy` を有効にすると、生成された permission profile には workspace スタイルの
ファイルシステムアクセスが使用されます。Codex 管理ネットワーク強制は sandbox 化された
ネットワーキングであるため、full-access profile では送信トラフィックを保護できません。
ドメインエントリは `allow` または `deny` を使用し、Unix ソケットエントリは Codex の
`allow` または `none` 値を使用します。

OpenClaw 所有の動的ツール呼び出しは、
`appServer.requestTimeoutMs` とは独立して制限されます。Codex の `item/tool/call` リクエストは、デフォルトで 90 秒の
OpenClaw ウォッチドッグを使用します。呼び出しごとの正の `timeoutMs` 引数は、
その特定ツールの予算を延長または短縮します。`image_generate` ツールは、
ツール呼び出しが独自のタイムアウトを提供しない場合は
`agents.defaults.imageGenerationModel.timeoutMs` を使用し、それ以外の場合は 120 秒の画像生成デフォルトを使用します。
メディア理解の `image` ツールは、
`tools.media.image.timeoutSeconds` または 60 秒のメディアデフォルトを使用します。画像理解では、
そのタイムアウトはリクエスト自体に適用され、先行する準備作業によって
短縮されません。動的ツールの予算は
600000 ms で上限設定されます。タイムアウト時、OpenClaw はサポートされている場合にツールシグナルを中止し、
失敗した動的ツール応答を Codex に返すため、セッションを `processing` のままにせず
ターンを続行できます。
このウォッチドッグは外側の動的 `item/tool/call` 予算です。プロバイダー固有の
リクエストタイムアウトはその呼び出しの内側で実行され、独自のタイムアウトセマンティクスを維持します。

Codex がターンを受け入れた後、および OpenClaw がターンスコープの
app-server リクエストに応答した後、ハーネスは Codex が現在のターンを進め、
最終的にネイティブターンを `turn/completed` で完了することを期待します。app-server が
`appServer.turnCompletionIdleTimeoutMs` の間沈黙した場合、OpenClaw はベストエフォートで
Codex ターンを中断し、診断タイムアウトを記録し、古い
ネイティブターンの後ろに後続のチャットメッセージがキューされないように
OpenClaw セッションレーンを解放します。同じターンのほとんどの非終端通知は、
Codex がターンがまだ生きていることを証明しているため、その短い
ウォッチドッグを解除します。ツールの引き渡しでは、より長いツール後アイドル予算を使用します。OpenClaw が `item/tool/call`
応答を返した後、`commandExecution` などのネイティブツール項目が完了した後、raw
`custom_tool_call_output` 完了後、およびツール後の raw assistant
進行、raw reasoning 完了、または reasoning 進行後です。このガードは、
設定されている場合は `appServer.postToolRawAssistantCompletionIdleTimeoutMs` を使用し、
それ以外の場合はデフォルトで 5 分になります。同じツール後予算は、Codex が次の
現在ターンイベントを発行する前の沈黙した合成ウィンドウの進行ウォッチドッグも延長します。レート制限更新などの
グローバル app-server 通知は、ターンアイドル進行をリセットしません。Reasoning 完了、commentary
`agentMessage` 完了、およびツール前の raw reasoning または assistant 進行は、
自動の最終返信が続く可能性があるため、セッションレーンを即時解放する代わりに
進行後返信ガードを使用します。最終/非commentary の完了済み `agentMessage` 項目とツール前の raw
assistant 完了のみが assistant 出力解放を作動させます。その後 Codex が
`turn/completed` なしで沈黙した場合、OpenClaw はベストエフォートでネイティブターンを中断し、
セッションレーンを解放します。別のターン監視がその解放競合に勝った場合でも、
ネイティブリクエスト、項目、または動的ツール完了がアクティブなままではなく、
assistant 出力解放が引き続き最新の完了項目に属し、後続の項目完了がない場合、
OpenClaw は完了済みの最終 assistant 項目を受け入れます。これにより、ターンを再生せずに、
完了済みツール作業後の最終回答を保持できます。部分的な assistant デルタ、古い以前の
返信、空の後続完了は対象外です。assistant、ツール、アクティブ項目、
または副作用の証拠を伴わないターン完了アイドルタイムアウトを含む、再生安全な stdio
app-server 障害は、新しい app-server 試行で 1 回再試行されます。安全でない
タイムアウトでも、停止した app-server クライアントを廃止し、OpenClaw
セッションレーンを解放します。また、自動再生される代わりに
古いネイティブスレッドバインディングをクリアします。完了監視タイムアウトは Codex 固有のタイムアウト
テキストを表示します。再生安全なケースでは応答が不完全な可能性があると伝え、安全でないケースでは
再試行前に現在の状態を確認するようユーザーに伝えます。公開タイムアウト診断には、
最後の app-server 通知メソッド、raw assistant 応答項目の id/type/role、
アクティブなリクエスト/項目数、作動中の監視状態などの構造化フィールドが含まれます。
最後の通知が raw assistant 応答項目である場合は、制限付きの assistant テキストプレビューも含まれます。
raw プロンプトやツール内容は含まれません。

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
一回限りのローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。反復可能なデプロイでは、
Plugin の挙動を Codex ハーネス設定の残りと同じレビュー済みファイルに保持できるため、
設定の使用が推奨されます。

## ネイティブ Codex Plugin

ネイティブ Codex Plugin サポートは、OpenClaw ハーネスターンと同じ Codex スレッド内で
Codex app-server 独自のアプリおよび Plugin 機能を使用します。OpenClaw は
Codex Plugin を合成 `codex_plugin_*` OpenClaw
動的ツールに変換しません。

`codexPlugins` はネイティブ Codex ハーネスを選択したセッションにのみ影響します。
組み込みハーネス実行、通常の OpenAI プロバイダー実行、ACP 会話
バインディング、その他のハーネスには影響しません。

最小移行済み設定:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
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
古い Codex スレッドバインディングを置き換えるときに計算されます。各ターンで再計算されるわけではありません。
`codexPlugins` を変更した後は、今後の Codex ハーネスセッションが更新されたアプリセットで開始されるように、
`/new`、`/reset` を使用するか、gateway を再起動してください。

移行適格性、アプリインベントリ、破壊的アクションポリシー、
elicitations、ネイティブ Plugin 診断については、
[ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins) を参照してください。

OpenAI 側のアプリおよび Plugin アクセスは、サインイン済み Codex アカウントと、
Business および Enterprise/Edu ワークスペースではワークスペースのアプリ制御によって管理されます。OpenAI のアカウントおよびワークスペース制御の概要については、
[ChatGPT プランで Codex を使用する](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
を参照してください。

## Computer Use

Computer Use は専用の設定ガイドで扱います:
[Codex Computer Use](/ja-JP/plugins/codex-computer-use)。

短く言えば、OpenClaw はデスクトップ制御アプリをベンダー提供せず、
デスクトップアクション自体も実行しません。Codex app-server を準備し、
`computer-use` MCP サーバーが利用可能であることを確認してから、Codex モードのターン中に
ネイティブ MCP ツール呼び出しを Codex に所有させます。

## ランタイム境界

Codex ハーネスは低レベルの埋め込みエージェント実行器のみを変更します。

- OpenClaw 動的ツールはサポートされます。Codex は OpenClaw にそれらの
  ツールを実行するよう求めるため、OpenClaw は実行パスに残ります。
- Codex ネイティブの shell、patch、MCP、ネイティブアプリツールは Codex が所有します。
  OpenClaw はサポートされるリレーを通じて選択されたネイティブイベントを監視またはブロックできますが、
  ネイティブツール引数を書き換えません。
- Codex はネイティブ Compaction を所有します。OpenClaw はチャネル
  履歴、検索、`/new`、`/reset`、および将来のモデルまたはハーネス切り替えのためにトランスクリプトミラーを保持しますが、
  Codex Compaction を OpenClaw または context-engine
  summarizer に置き換えることはありません。
- メディア生成、メディア理解、TTS、承認、および messaging-tool
  出力は、対応する OpenClaw プロバイダー/モデル設定を通じて継続します。
- `tool_result_persist` は OpenClaw 所有のトランスクリプトツール結果に適用され、
  Codex ネイティブのツール結果レコードには適用されません。

フック層、サポートされる V1 サーフェス、ネイティブ権限処理、キュー
ステアリング、Codex フィードバックアップロードの仕組み、および Compaction の詳細については、
[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime) を参照してください。

## トラブルシューティング

**Codex が通常の `/model` プロバイダーとして表示されない:** 新しい設定では想定どおりです。
`openai/gpt-*` モデルを選択し、
`plugins.entries.codex.enabled` を有効にして、`plugins.allow` が
`codex` を除外していないか確認してください。

**OpenClaw が Codex の代わりに組み込みハーネスを使用する:** モデル ref が
公式 OpenAI プロバイダー上の `openai/gpt-*` であり、Codex Plugin が
インストールされ有効になっていることを確認してください。テスト中に厳密な証明が必要な場合は、プロバイダーまたは
モデルの `agentRuntime.id: "codex"` を設定してください。強制 Codex ランタイムは、
OpenClaw にフォールバックせずに失敗します。

**OpenAI Codex ランタイムが API キーパスにフォールバックする:** モデル、ランタイム、選択されたプロバイダー、失敗を示す、
リダクト済みの gateway 抜粋を収集してください。
影響を受ける共同作業者に、OpenClaw ホストでこの読み取り専用コマンドを実行してもらってください。

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

有用な抜粋には通常、`openai/gpt-5.5` または `openai/gpt-5.4`、
`Runtime: OpenAI Codex`、`agentRuntime.id` または `harnessRuntime`、
`candidateProvider: "openai"`、および `401`、`Incorrect API key`、または
`No API key` の結果が含まれます。修正後の実行では、単純な OpenAI API キー失敗ではなく、
OpenAI OAuth パスが表示されるはずです。

**レガシー Codex モデル ref 設定が残っている:** `openclaw doctor --fix` を実行してください。
Doctor はレガシーモデル ref を `openai/*` に書き換え、古いセッションおよび
エージェント全体のランタイムピンを削除し、既存の認証プロファイルオーバーライドを保持します。

**app-server が拒否される:** Codex app-server `0.125.0` 以降を使用してください。
同一バージョンのプレリリースや、`0.125.0-alpha.2` または `0.125.0+custom` などのビルド接尾辞付きバージョンは、
OpenClaw が安定版 `0.125.0` プロトコル下限をテストするため拒否されます。

**`/codex status` が接続できない:** バンドルされた `codex` Plugin が
有効であること、許可リストが設定されている場合は `plugins.allow` にそれが含まれていること、
およびカスタム `appServer.command`、`url`、`authToken`、またはヘッダーが有効であることを確認してください。

**モデル検出が遅い:** 
`plugins.entries.codex.config.discovery.timeoutMs` を下げるか、検出を無効にしてください。
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference#model-discovery) を参照してください。

**WebSocket トランスポートが即座に失敗する:** `appServer.url`、`authToken`、
ヘッダー、およびリモート app-server が同じ Codex app-server
プロトコルバージョンを話していることを確認してください。

**ネイティブシェルまたはパッチツールが `Native hook relay unavailable` でブロックされる場合:**
Codex スレッドが、OpenClaw に登録されなくなったネイティブフックリレー ID をまだ使おうとしています。これはネイティブ Codex フックトランスポートの問題であり、ACP バックエンド、プロバイダー、GitHub、またはシェルコマンドの失敗ではありません。影響を受けているチャットで `/new` または `/reset` を使って新しいセッションを開始し、その後に無害なコマンドを再試行してください。一度は動作するものの、次のネイティブツール呼び出しがまた失敗する場合は、`/new` は一時的な回避策としてのみ扱ってください。古いスレッドが破棄され、ネイティブフック登録が再作成されるように、Codex app-server または OpenClaw Gateway を再起動した後、プロンプトを新しいセッションにコピーしてください。

**非 Codex モデルが組み込みハーネスを使用する場合:** プロバイダーまたはモデルランタイムポリシーが別のハーネスへルーティングしない限り、これは想定どおりです。通常の非 OpenAI プロバイダー参照は、`auto` モードでは通常のプロバイダーパスに留まります。

**Computer Use はインストールされているがツールが実行されない場合:** 新しいセッションから
`/codex computer-use status` を確認してください。ツールが
`Native hook relay unavailable` を報告する場合は、上記のネイティブフックリレー復旧手順を使用してください。詳しくは
[Codex Computer Use](/ja-JP/plugins/codex-computer-use#troubleshooting) を参照してください。

## 関連

- [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins)
- [Codex Computer Use](/ja-JP/plugins/codex-computer-use)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [OpenAI Codex ヘルプ](https://help.openai.com/en/collections/14937394-codex)
- [エージェントハーネスPlugin](/ja-JP/plugins/sdk-agent-harness)
- [Plugin フック](/ja-JP/plugins/hooks)
- [診断エクスポート](/ja-JP/gateway/diagnostics)
- [ステータス](/ja-JP/cli/status)
- [テスト](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
